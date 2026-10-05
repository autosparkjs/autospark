import { AutoSparkDirectiveBase } from "../base";
import type { ComponentDataBasis, ComponentDef } from "../component-def";
import type { AutoSparkScope } from "../../scope";
import { collectSlotContent } from "../../utils/slot";
import { parseHtmlFragment } from "../../utils/transformElement";

/**
 * loader 成员属性值的字面量 url 判定（loader 专属，ADR-0065 决策二）：以 `/` `./` `../`
 * `http(s)://` `file://` 开头 → 字面量 url 直接加载（不经表达式求值，避免 `/a.html` 被当正则）；
 * 其余一律作表达式 watch 求值——裸标识符是响应式 url 的主形态（状态路径），与 x-import
 * 「标识符=文件名」语义相反，故**不复用** isLiteralUrl。
 */
function isLiteralLoaderUrl(raw: string): boolean {
    return /^(?:\/|\.\.\/|\.\/|https?:\/\/|file:\/\/)/i.test(raw);
}

/**
 * loader 占位呈现值（ADR-0065 决策六）：**HTML 字符串**（静态插入、不参与编译）|
 * **`{ name, props }`**（引入具名组件，用户 props 与引擎注入上下文合并、引擎注入优先）。
 */
type LoaderPlaceholder = string | { name: string; props?: Record<string, any> };

/**
 * loader 配置（ADR-0065 决策五）：`x-component-options.loader` 的对象形态。
 * string 简写（裸 url）在应用时归一为 `{ url }`。
 */
interface ComponentLoaderConfig {
    /** 远程组件 HTML url（必需） */
    url: string;
    /** 整包透传 fetch 的 requestInit（参与 url 缓存 key，防同 url 不同参数串缓存） */
    request?: RequestInit;
    /** 加载中占位；缺省 = x-loading */
    fallback?: LoaderPlaceholder;
    /** 失败呈现；缺省 = 内置 error 组件 */
    error?: LoaderPlaceholder;
    /** 加载中宿主临时占位尺寸（防布局跳动，成功与出错均移除） */
    width?: number | string;
    height?: number | string;
}

/**
 * 判定值是否为纯标识符 / 连字符段形态（如 `counter`、`my-card`、`UserAvatar`）。
 *
 * ADR-0054 后组件名走属性参数、值专职 props，本判定不再参与求值分流——仅用于
 * 「缺少组件名」warn 的迁移指引附言：值恰为纯标识符时提示旧定义写法改用 x-define。
 */
function isLiteralComponentName(raw: string): boolean {
    return /^[A-Za-z_$][\w$-]*$/.test(raw);
}

/**
 * x-component：组件实例化指令（ADR-0054 更名自 x-use，实例化机制承接 ADR-0022 决策五）。
 *
 * 在模板中实例化一个已声明的组件（局部 x-define 或全局 options.components）。语法：
 * - **属性参数承载组件名**：`x-component:counter`——静态、编译期可知（缺参即 warn），不支持
 *   响应式切换组件（条件切换用外层 x-if，ADR-0054 决策二）；
 * - **值专职 props**（ADR-0054 决策三），三形态：
 *   - 无值：无 props、不订阅；
 *   - 对象字面量：成员可引用状态路径（表达式支路按实际读取收集依赖，成员路径级触发）；
 *   - 纯状态路径（如 `order`）：对象按键展开为 props（v-bind="obj" 心智），路径支路透传
 *     `depth:2` 订阅（子键增删改/整体替换均触发，对齐 x-bind 展开先例 ADR-0043）；
 * - props **单向**注入组件 data 域（后于 data() 默认覆盖，R1=A 合并顺序），值变时 `Object.assign`
 *   更新出现键，组件内绑定经 getContext 重读自动刷新；组件内部状态不被重置、不回写外部状态。
 *
 * 其余机制（承接原 x-use）：
 * - 取组件冻结快照（经 `scope.getComponentDeclaration(name)` 沿链就近 + 全局兜底）；
 * - **宿主化身组件根**（T4=B）：复用宿主节点身份，清空其原内容、编译组件快照子树挂入；
 *   宿主属性继承到组件根（class 合并拼接、style 合并冲突键组件根优先、其他属性不覆盖；
 *   x-define 声明族属性不复制）；
 * - **子节点收为插槽内容**（ADR-0056）：宿主子节点在 `_instantiate` 懒收集为 content map，
 *   投影到组件模板的 `x-slot` 出口；无对应出口 warn 丢弃（不再「前缀编译」）。
 * - 组件语义：`compileChild` 传 componentDef，注入 data()/methods/hooks、置 isComponent=true。
 *
 * **结构指令冲突（U3）**：与 ownsChildren 指令（x-if/x-for/x-isolate/x-switch/x-tree）同元素
 * → 编译期 warn + 拒绝实例化（宿主原内容保持，不破坏渲染）。本指令自身声明 `ownsChildren`（ADR-0056
 * 子节点收为插槽内容），同元素时 `_resolveOwnership` 豁免通用多 owner 抛错——U3 检测留在 created
 * 友好 warn 路径，对既有行为无感。
 *
 * **递归保护（T5=A）**：组件模板内 `x-component:自身名` 实例化自身（树形/菜单组件）。沿 scope 链
 * 向上统计同名组件实例化深度，超上限（默认 100）warn + 停止，防无限递归。
 *
 * **异步占位（R6=B）**：组件定义尚未加载（x-import fetch 中）时，宿主显示 loading 态；
 * 就绪后替换为组件实例。当前阶段实现同步路径（组件已注册即实例化），异步占位在 x-import 阶段补全。
 *
 * @example 实例化组件（无 props）
 * <div x-component:counter></div>
 * @example 传 props（对象字面量，成员可引用状态路径）
 * <div x-component:counter="{ count: 100, label: order.label }"></div>
 * @example 绑定状态对象（按键展开为 props，深层响应）
 * <div x-component:counter="order"></div>
 */
export class ComponentDirective extends AutoSparkDirectiveBase {
    /** 介于结构指令（if=80/for=100）之下、普通指令之上，保证组件实例化在兄弟指令前执行 */
    static override readonly priority = 70;
    static override readonly singleton = true;
    /**
     * 永远占有子树（ADR-0056 决策八内容侧收集）：宿主子节点是**插槽内容**（模板态），
     * 由 `_instantiate` 懒收集进 content map、不进通用 walk——避免「前缀编译」bug。
     * （x-dialog/x-overlay 经 OverlayDirective 覆写为 false，宿主子节点保留，见 ADR-0056 决策十。）
     *
     * 与 x-for 等同元素时 `_resolveOwnership` 豁免多 owner 抛错（U3 友好 warn 留在 created）。
     */
    static override ownsChildren(): boolean {
        return true;
    }

    /** 递归实例化深度上限（T5=A，防无限递归；overlay 基座共享） */
    protected static readonly MAX_DEPTH = 100;

    /** 当前实例化的组件实例 scope（destroy 时级联销毁） */
    private instanceScope: AutoSparkScope | null = null;
    /** 当前实例化的组件名（属性参数静态承载，ADR-0054：恒定不变，无换名重实例化） */
    private componentName: string | null = null;
    /** 当前实例化的组件 def（缓存，props 更新时复用） */
    private instanceDef: ComponentDef | null = null;
    /** pending 组件名（异步加载中，组件未就绪；监听 components/<名>/registered 后重试实例化，R6=B） */
    protected pendingName: string | null = null;
    /** pending 期间的 props（组件就绪重试时复用） */
    protected pendingProps: Record<string, any> | undefined;
    /** components/<名>/registered 监听解绑函数 */
    private registeredUnsub: (() => void) | null = null;
    /** 当前监听的事件名（= `components/<pendingName>/registered`）：名变时比对重订（订阅键即过滤） */
    private _pendingEventName: string | null = null;

    // === loader 状态（ADR-0065） ===
    /** loader 激活标志：created 解析到 loader 声明后置位，接管实例化时序（props watch 只记 pending） */
    private _loaderActive = false;
    /** 当前 loader 配置（retry 重取时复用） */
    private _loaderCfg: ComponentLoaderConfig | null = null;
    /** 当前已加载 url（响应式重求值的同 url 去重位） */
    private _loadedUrl: string | null = null;
    /** 在途加载的 AbortController（url 响应式变化 / destroy 时 abort 丢弃过期结果） */
    private _loaderAbort: AbortController | null = null;
    /** pending props（loader 加载完成前 props watch 的暂存，完成后随实例化应用） */
    private _pendingProps: Record<string, any> | undefined;
    /** 占位块（fallback/error 组件）编译 scope（随宿主 scope.destroy 递归销毁，此处仅断引用） */
    private _placeholderScope: AutoSparkScope | null = null;

    /** .global 修饰符（ADR-0065 决策二：`x-component:名.global` 经解析期注入 options.global） */
    private get _globalMode(): boolean {
        return !!this.getOption("global");
    }

    override created() {
        // 结构指令冲突检测（U3）：同元素含其他 ownsChildren 指令 → warn + 拒绝实例化。
        // 注意：x-show 与 .keepalive 变体 ownsChildren=false，不在禁用集合（可同元素共存）；
        // 判定按 ownsChildren 动态推导（非指令名清单），新增结构指令自动纳入。
        if (this._hasStructuralConflict()) {
            this.warn(
                `x-component: 宿主元素含其他结构指令（占子树的 ownsChildren 指令，如 eager x-if/x-for/x-isolate/x-switch/x-tree），与组件实例化互斥，已跳过实例化（ADR-0022 决策五-5）。` +
                    `替代写法：条件挂载（销毁重建）把本指令写在该结构指令的子树内；仅显隐切换用 x-show 或 x-if.keepalive 同元素（组件保活）。`,
            );
            return;
        }
        // 混合宿主（ADR-0056 决策十修订）：覆盖物消费者与组件化身对宿主子节点的定位互斥
        //——前者是「宿主为声明点、子节点留原地」，后者是「宿主为组件化身、子节点归组件」；
        // 同元素并存会让同一份子树被两套通道各收一次 → warn + 拒绝实例化（x-component 让步）。
        if (this._hasOverlayConsumerSibling()) {
            this.warn(
                `x-component: 宿主元素同时声明了覆盖物消费者（x-dialog 等）——组件化身与覆盖物声明点对宿主子节点的定位互斥，已跳过实例化（ADR-0056 决策十修订）。` +
                    `替代写法：拆成两个元素（触发器与组件化身分开声明）。`,
            );
            return;
        }
        // 组件名：属性参数承载（x-component:counter，ADR-0054 决策二）。缺参 → warn 跳过实例化；
        // 值恰为纯标识符时附言迁移指引（旧定义写法 x-component="名" 与新实例化同形，指回 x-define）。
        let name = (this.attr ?? "").trim();
        // 点号组件名重建（ADR-0088）：指令解析器把属性参数的句点段切为修饰符
        // （`x-component:autospark.messages.actions` → attr="autospark" + modifiers），而组件名
        // 合法含点（`autospark.*` 引擎保留命名空间，ADR-0083）——按**升序候选回溯**拼接：
        // attr 起逐段并入修饰符试查组件表，首个命中者即组件名；短名优先命中时点号段保持
        // 修饰符语义（`x-component:counter.global` 的 .global 不受影响）。
        if (name !== "" && this.modifiers?.length) {
            const segments = [name, ...this.modifiers];
            for (let i = 2; i <= segments.length; i++) {
                const candidate = segments.slice(0, i).join(".");
                if (this.binding.getComponentDeclaration(candidate)) {
                    name = candidate;
                    break;
                }
            }
        }
        if (name === "") {
            const rawValue = this.value == null ? "" : String(this.value).trim();
            const hint = isLiteralComponentName(rawValue)
                ? `；若是组件定义，请改用 x-define="${rawValue}"（ADR-0054）`
                : "";
            this.warn(`x-component: 缺少组件名（应写 x-component:名称），已跳过实例化${hint}。`);
            return;
        }
        this.componentName = name;
        // === loader 解析（ADR-0065 决策二）：成员属性表达式（双轨）优先，回退静态选项/宿主回退 ===
        const loaderExpr = this.info.optionExprs?.loader;
        if (loaderExpr !== undefined) {
            const trimmed = loaderExpr.trim();
            if (trimmed === "") {
                this.warn(
                    `x-component: x-component-options.loader 的值为空（须提供 url 或配置对象表达式），已忽略。`,
                );
                return;
            }
            this._watchPropsOnly();
            if (isLiteralLoaderUrl(trimmed)) {
                // 字面量 url：直接加载，不经表达式求值（避免 /a.html 被当正则、http:// 被当注释）
                this.engine.scheduler.schedule(() => this._applyLoader(trimmed));
            } else {
                // 表达式：watch 求值（值 = url 字符串或配置对象），url 变化重载重实例化（响应式）
                const initial = this.binding.watch(loaderExpr, ({ value }) =>
                    this._applyLoader(value),
                );
                this.engine.scheduler.schedule(() => this._applyLoader(initial));
            }
            return;
        }
        const staticLoader = this.getOption("loader");
        if (staticLoader !== undefined && staticLoader !== "") {
            // 静态形态（整包 x-component-options="{loader:...}" / 字符串简写 / 宿主 x-options 回退）
            this._watchPropsOnly();
            this.engine.scheduler.schedule(() => this._applyLoader(staticLoader));
            return;
        }
        // === 无 loader：原流程（值专职 props，ADR-0054 决策三） ===
        const rawValue = this.value == null ? "" : String(this.value).trim();
        if (rawValue === "") {
            this.engine.scheduler.schedule(() => this._onValueChange(undefined));
            return;
        }
        // props 求值（watch 双轨自动分流，见类注释三形态）：纯状态路径经路径支路透传 depth:2
        // 深层订阅；对象字面量 / 局部上下文走表达式支路按实际读取收集依赖（options 被该支路忽略）。
        // 首次实例化 defer 到 microtask：created 在 compileElement 内同步跑，宿主尚未挂进父树
        // （transformElement 的 appendChild 还没发生），实例化需 parentNode/属性继承稳定。
        const initial = this.binding.watch(rawValue, ({ value }) => this._onValueChange(value), {
            depth: 2,
        });
        this.engine.scheduler.schedule(() => this._onValueChange(initial));
    }

    /**
     * 同元素是否含其他 ownsChildren 结构指令（U3 冲突检测）。
     *
     * 经 engine.directives 查各指令类的静态 `ownsChildren(info)`——与 compiler._resolveOwnership
     * 同源判定，但不触发通用报错，而是 warn + 跳过实例化。
     */
    private _hasStructuralConflict(): boolean {
        return this.binding.directives.some((d) => {
            // teleport 同元素不视为冲突（ADR-0059 决策六）：实例化主体优先，x-teleport
            // 在其自身 created 的自检中检测到本指令（ownsChildren）后对称让位退出
            if (d.info.name === "component" || d.info.name === "teleport") return false;
            const cls = this.engine.directives.get(d.info.name);
            return !!cls?.ownsChildren?.(d.info);
        });
    }

    /**
     * 同元素是否含覆盖物消费者（x-dialog 等，ADR-0056 决策十修订）。
     *
     * 经实例构造器的静态 `overlayConsumer` 判定（OverlayDirective 家族唯一覆写点）——
     * 与 `_hasStructuralConflict` 的按注册表查类同源，但**不 import overlay** 以避循环依赖。
     */
    private _hasOverlayConsumerSibling(): boolean {
        return this.binding.directives.some(
            (d) =>
                d !== this &&
                (d.constructor as { overlayConsumer?: boolean }).overlayConsumer === true,
        );
    }

    /**
     * props 值变化处理（组件名静态，无换名重实例化分支，ADR-0054）。
     *
     * - 对象 → 按键展开为 props 集合（v-bind="obj" 心智）；
     * - null / undefined → 无 props（如绑定的状态对象尚未就绪，静默）；
     * - 标量 / 数组 → warn 忽略（值必须是对象形态之一，数组无键值语义）。
     */
    private _onValueChange(value: any): void {
        let props: Record<string, any> | undefined;
        if (Array.isArray(value)) {
            this.warn(
                `x-component: props 值须为对象（字面量或状态对象），数组已忽略: ${JSON.stringify(value)}`,
            );
        } else if (value != null && typeof value === "object") {
            props = value as Record<string, any>;
        } else if (value !== undefined && value !== null) {
            this.warn(
                `x-component: props 值须为对象（字面量或状态对象），已忽略: ${JSON.stringify(value)}`,
            );
        }
        // 已实例化 → 仅更新 props（覆盖声明键，组件内部状态不被重置）。
        // props 与上次应用值浅等则跳过：静态字面量 props（无状态路径）的表达式支路 watcher
        // 订阅为空 deps（autostore watch([]) = 任意状态变化触发），每次重求值产生键值相同的
        // 新对象——若照常 assign 会把组件内部交互状态重置回 props 字面量（counter demo 场景：
        // 点击 + 后 count=105 被打回 100）。值没变就不是更新（ADR-0054 决策三）。
        if (this.instanceScope && this.instanceDef) {
            if (this._propsEqual(props, this._appliedProps)) return;
            this._updateProps(props);
            return;
        }
        this._pendingProps = props;
        // loader 接管实例化时机（ADR-0065 决策三首帧严格）：加载完成后 _runLoader 统一实例化
        if (this._loaderActive) return;
        this._instantiate(this.componentName!, props);
    }

    /**
     * loader 场景的 props 订阅（ADR-0065）：值变化仅更新 pending（实例化时机归 loader）。
     * 无值 = 无 props（不订阅，与原流程一致）。
     */
    private _watchPropsOnly(): void {
        const rawValue = this.value == null ? "" : String(this.value).trim();
        if (rawValue === "") {
            this._pendingProps = undefined;
            return;
        }
        this.binding.watch(rawValue, ({ value }) => this._onValueChange(value), {
            depth: 2,
        });
    }

    /**
     * 应用 loader 声明（ADR-0065）：值形态归一 + 同 url 去重后发起加载。
     *
     * 值三态：string → url 简写（归一 `{ url }`）；对象 → 配置原样；nullish → 静默
     * （绑定状态未就绪，对齐 props 绑定 nullish 静默先例）；其余 → warn 忽略。
     */
    private _applyLoader(value: unknown): void {
        let cfg: ComponentLoaderConfig | null = null;
        if (typeof value === "string") {
            const raw = value.trim();
            if (raw === "") return;
            cfg = { url: raw };
        } else if (value && typeof value === "object" && !(value instanceof RegExp)) {
            cfg = value as ComponentLoaderConfig;
        } else if (value == null) {
            return;
        }
        const url = cfg?.url;
        if (!cfg || !url || typeof url !== "string" || url.trim() === "") {
            this.warn(`x-component: loader 缺少有效 url，已跳过加载。`);
            return;
        }
        this._loaderActive = true;
        if (url === this._loadedUrl) return; // 同 url 去重（响应式重求值但 url 未变）
        void this._runLoader(cfg);
    }

    /**
     * 执行 loader 加载（ADR-0065 决策三/四）：清旧内容 → 占位（fallback/x-loading + 尺寸）→
     * fetch 注册（已注册仍 fetch，「以此 url 为准」）→ 同名校验 → 实例化；失败 → error 呈现。
     * url 响应式变化重入本方法：abort 旧请求、销毁旧实例子树（组件内部状态丢失）。
     */
    private async _runLoader(cfg: ComponentLoaderConfig): Promise<void> {
        this._loaderAbort?.abort();
        const ctrl = (this._loaderAbort = new AbortController());
        const url = cfg.url;
        this._loadedUrl = url;
        this._loaderCfg = cfg;
        // 首帧严格（决策三）：渲染的永远是 url 版——清旧内容（含旧实例子树）后占位等待
        this._clearHostContent();
        this.instanceScope = null;
        this.instanceDef = null;
        this._appliedProps = undefined;
        this._applyPlaceholderSize(cfg);
        if (cfg.fallback !== undefined && cfg.fallback !== "") {
            this._renderPlaceholder(cfg.fallback, {
                url,
                name: this.componentName,
                error: null,
                message: "",
            });
        } else {
            // 缺省 fallback：复用 x-loading 占位（R6=B 既有机制）
            this._showLoadingPlaceholder(this.componentName!);
        }
        try {
            const registered = await this.engine.importComponentsFromUrl(
                url,
                this._globalMode ? null : this.binding.parent,
                this._globalMode,
                cfg.request,
                ctrl.signal,
            );
            if (ctrl.signal.aborted) return;
            // null = 加载失败（fetch/解析错误，原始错误已在 engine 内 warn）
            if (registered === null) {
                this._renderLoaderError(new Error(`远程内容加载失败（${url}）`), cfg);
                return;
            }
            // 同名校验（决策四）：本次加载结果无属性参数指定的组件 → error 呈现
            //（查返回清单而非沿链查找——命中祖先 scope 的旧同名组件不算本次加载成功）
            if (!registered.includes(this.componentName!)) {
                this._renderLoaderError(new Error(`远程内容中无组件 "${this.componentName}"`), cfg);
                return;
            }
            this._clearHostContent();
            this._instantiate(this.componentName!, this._pendingProps);
        } catch (e: any) {
            if (ctrl.signal.aborted) return;
            this._renderLoaderError(
                e instanceof Error ? e : new Error(String(e?.message ?? e)),
                cfg,
            );
        } finally {
            if (this._loaderAbort === ctrl) this._loaderAbort = null;
        }
    }

    /**
     * 渲染占位呈现（ADR-0065 决策六，fallback/error 共用协议）：
     * HTML 字符串静态插入（不编译）；`{name, props}` 引入具名组件（用户 props 与引擎注入
     * 上下文 `ctx` 合并、引擎注入优先）；组件未注册 warn + 回退默认 x-loading 占位。
     */
    private _renderPlaceholder(decl: LoaderPlaceholder, ctx: Record<string, any>): void {
        this._clearHostContent();
        if (typeof decl === "string") {
            const frag = parseHtmlFragment(decl);
            if (frag) this.el.replaceChildren(...Array.from(frag.childNodes));
            return;
        }
        const snapshot =
            decl && typeof decl === "object"
                ? this.binding.getComponentDeclaration(decl.name)
                : null;
        if (!snapshot) {
            this.warn(
                `x-component: loader 占位组件 "${(decl as any)?.name}" 未注册，回退默认占位。`,
            );
            this._showLoadingPlaceholder(this.componentName!);
            return;
        }
        // props/上下文合并：函数值自动分流到非响应式 locals（autostore computed 陷阱防御，
        // 同 _renderLoaderError），其余走响应式 data 域
        const merged = { ...(decl.props ?? {}), ...ctx };
        const reactiveData: Record<string, any> = {};
        const localFns: Record<string, any> = {};
        for (const [k, v] of Object.entries(merged)) {
            (typeof v === "function" ? localFns : reactiveData)[k] = v;
        }
        const compiled = this.engine.compiler.compileChild(
            snapshot.cloneNode(true) as HTMLElement,
            this.binding,
            localFns,
            undefined,
            reactiveData,
        );
        if (Object.keys(localFns).length > 0) {
            compiled.scope.actions = { ...compiled.scope.actions, ...localFns } as Record<
                string,
                any
            >;
        }
        this._placeholderScope = compiled.scope;
        this.el.replaceChildren(compiled.el);
    }

    /**
     * 呈现加载失败（ADR-0065 决策六/七）：自定义 error 声明走占位协议；缺省渲染内置 error
     * 组件（getComponentDeclaration("error") 沿链 + 全局兜底 → 构造器默认内置），注入 error/message 与
     * retry/close 闭包（back 按钮走内置 action，无需注入）。error 不自愈——恢复途径仅
     * url 变化（响应式重入）或 retry。
     */
    private _renderLoaderError(err: Error, cfg: ComponentLoaderConfig): void {
        this._clearHostContent();
        const message = `组件 "${this.componentName}" 加载失败（${cfg.url}）：${err.message}`;
        if (cfg.error !== undefined && cfg.error !== "") {
            this._renderPlaceholder(cfg.error, {
                url: cfg.url,
                name: this.componentName,
                error: err,
                message,
            });
            return;
        }
        const snapshot = this.binding.getComponentDeclaration("error");
        if (!snapshot) {
            this.warn(`x-component: ${message}（且 error 组件未注册，无错误呈现。）`);
            return;
        }
        const compiled = this.engine.compiler.compileChild(
            snapshot.cloneNode(true) as HTMLElement,
            this.binding,
            {},
            undefined,
            // 数据上下文走响应式 data 域——**纯数据 + 布尔显隐键，绝无函数**：autostore 把
            // state 中的函数值当 computed，依赖收集（watch 读取）时执行函数 → 失败重渲染 →
            // 无限循环（实测抓栈证实）。执行体走 action 通道（下方 scope.actions 注入）。
            {
                error: err,
                message,
                url: cfg.url,
                name: this.componentName,
                hasRetry: true,
                hasClose: true,
            },
        );
        this._placeholderScope = compiled.scope;
        // retry/close 执行体注入实例 scope.actions（@click 经 getAction 命中；`back` 走内置 action）：
        // retry：重新 fetch 当前 url（重置去重位强制重跑）
        compiled.scope.actions = {
            ...(compiled.scope.actions ?? {}),
            retry: {
                name: "retry",
                handle: () => {
                    this._loadedUrl = null;
                    void this._runLoader(cfg);
                },
            },
            // close：清除本实例 error 呈现 + 照常广播 close 信号（嵌套 overlay 场景语义兼容）
            close: {
                name: "close",
                handle: () => {
                    try {
                        (this.engine.actions as Record<string, any>)?.close?.handle?.();
                    } catch {
                        /* 广播失败不阻断清理 */
                    }
                    this._clearHostContent();
                },
            },
        } as Record<string, any>;
        this.el.replaceChildren(compiled.el);
    }

    /**
     * 清空宿主内容（loader 加载前 / url 变化重实例化 / retry/close）：销毁宿主 el 内的子树
     * scopes（组件子树 / 占位块编译产物——均为宿主 scope 的直接 children，child.destroy 递归
     * 销毁孙辈并从父 children 移除自身；拷贝防遍历中 Set 变异）+ 清 DOM + 清占位尺寸与 x-loading。
     */
    private _clearHostContent(): void {
        for (const child of [...this.binding.children]) {
            if (child.el && this.el.contains(child.el)) child.destroy();
        }
        this.el.replaceChildren();
        this._placeholderScope = null;
        this._removePlaceholderSize();
        this._hideLoadingPlaceholder();
    }

    /** 应用加载中占位尺寸（宿主临时 inline style，防布局跳动；成功与出错均移除） */
    private _applyPlaceholderSize(cfg: ComponentLoaderConfig): void {
        if (cfg.width != null) {
            this.el.style.width =
                typeof cfg.width === "number" ? `${cfg.width}px` : String(cfg.width);
        }
        if (cfg.height != null) {
            this.el.style.height =
                typeof cfg.height === "number" ? `${cfg.height}px` : String(cfg.height);
        }
    }

    /** 移除占位尺寸 */
    private _removePlaceholderSize(): void {
        this.el.style.removeProperty("width");
        this.el.style.removeProperty("height");
    }

    /**
     * 组件查找 + def 反查（x-component 与 overlay 基座共享）。
     *
     * 快照经 `scope.getComponentDeclaration(name)`（scope 链就近 + 全局兜底）；def 反查：
     * 作用域组件经 `_componentDefs`（WeakMap，snapshot 为 key）、全局组件经
     * `_globalComponentDefCache`（按 name）——getComponentDef 对全局 snapshot 返回 undefined，
     * 须 fallback getGlobalComponentDef，否则全局组件的 setup(data/methods/hooks) 丢失、不注入。
     *
     * @returns `{ snapshot, def }`；未命中返回 null（调用方决定等待/警告行为）
     */
    protected _findComponentDef(
        name: string,
    ): { snapshot: HTMLElement; def: ComponentDef | null } | null {
        const snapshot = this.binding.getComponentDeclaration(name);
        if (!snapshot) return null;
        const def =
            this.engine.getComponentDef(snapshot) ??
            this.engine.getGlobalComponentDef(name) ??
            null;
        return { snapshot, def };
    }

    /**
     * 实例化组件：宿主 scope 化身组件实例 + 编译组件快照子树。
     *
     * 复用宿主 scope（this.binding）作组件实例 scope，避免同一宿主双 scope 冲突（T4=B 宿主化身组件根）：
     * 1. 注入组件语义（data/methods/hooks/isComponent）到宿主 scope；
     * 2. 属性继承（宿主普通属性保留，组件快照根属性并入，class/style 合并）；
     * 3. compileSubtree 编译组件快照子树到宿主（快照内指令建子 scope，watch 时读到注入的 data）；
     * 4. 手动触发 created/mounted hooks（宿主 scope 的 compile() 已早于组件注入跑过，hooks 须补触发）。
     */
    protected _instantiate(name: string, props: Record<string, any> | undefined): void {
        const found = this._findComponentDef(name);
        if (!found) {
            // 组件未注册（可能正在被 x-import 异步加载）：显示 loading 占位 + 监听就绪后重试（R6=B）
            this._showLoadingPlaceholder(name);
            this._waitForComponent(name, props);
            return;
        }
        // 递归深度保护（T5=A）：沿 parent 链统计同名组件实例化深度
        if (this._recursiveDepth(name) >= ComponentDirective.MAX_DEPTH) {
            this.warn(
                `x-component: 组件 "${name}" 递归实例化深度超过上限（${ComponentDirective.MAX_DEPTH}），已停止（疑似无终止条件递归）。`,
            );
            return;
        }
        this.instanceDef = found.def;
        this.instanceScope = this.binding; // 宿主 scope 即组件实例 scope
        // 属性继承（T4=B）：组件快照根属性并入宿主（须早于实例化，宿主属性就位后编译子树）
        this._mergeComponentRootAttrs(found.snapshot);
        // 数据基准解析（ADR-0053）：x-component-options.dataContext（消费覆盖）> def.dataContext（作者声明）> 默认
        const basis = this._resolveDataBasis(found.def);
        // 插槽内容懒收集（ADR-0056）：ownsChildren 下子节点留在 template、不进 el——
        // 此处按出口清单收集为 content map，stash 到宿主 scope 供出口 SlotDirective 查找。
        // 模板只读：collect 一律 cloneNode，不摘原节点（ADR-0002）。
        const slotContents = this.template
            ? collectSlotContent(this.template, found.def?.slots, (m) => this.warn(m))
            : null;
        // 防御性清空宿主 runtime 子节点（ownsChildren 下 el 为浅克隆本无子节点；
        // 覆盖 pending 占位等异常残留，保证投影/fallback 是唯一内容来源）
        this.el.replaceChildren();
        // 实例化：注册快照 + stash 内容 + 注入语义 + 施加数据基准 + 编译子树 + 触发 hooks
        this.engine.compiler.instantiateComponent(
            this.binding,
            found.snapshot,
            found.def,
            props,
            basis,
            slotContents,
            this.binding, // 内容调用方基准 = 宿主自身（getCallerContext 跳过组件 _data/边界）
        );
        this._appliedProps = props;
        // scoped CSS 注入（ADR-0022 决策四-4）：阶段 5 实现
    }

    /**
     * 解析数据基准（ADR-0053 组件数据边界；修订一：消费侧 `.open` 豁免）。
     *
     * 解析链：`x-component-options.dataContext`（消费覆盖）→ `def.dataContext`（作者声明，含 `.open` 修饰符
     * 经 buildComponentDef 校验）→ 默认。规则：
     * - **封闭是作者契约，消费侧 `.open` 是显式豁免**：`.open` 修饰符（≡ `x-component-options="{open:true}"`，
     *   解析期注入 options.open）可打开封闭组件——显式声明即豁免，不 warn；基准取消费 dataContext >
     *   def.dataContext（封闭组件上恒为 undefined）> 默认 `'host'`；
     * - 消费侧 dataContext 声明落在封闭组件（无任何 open 通道）时仍 warn + 忽略，保持封闭；
     * - 无效基准值 warn + 回退 `'host'`；
     * - `def` 为 null（纯快照组件，无声明侧 open 通道）仍可被消费侧 `.open` 打开。
     */
    private _resolveDataBasis(def: ComponentDef | null): ComponentDataBasis {
        const optionCtx = this.getOption("dataContext");
        // 消费侧 open 只读指令选项层（不经 getOption 的宿主 x-options 回退）——
        // 避免宿主上给其他指令声明的 open 键意外打开组件（ADR-0007 回退语义的隔离例外）
        const consumerOpen = this.options?.open === true;
        const open = def?.open === true || consumerOpen;
        if (optionCtx !== undefined) {
            if (open) {
                if (optionCtx === "host" || optionCtx === "declarer") return optionCtx;
                this.warn(
                    `x-component: 无效数据基准 ${JSON.stringify(optionCtx)}（须 'host'|'declarer'），已回退 'host'（ADR-0053）`,
                );
                return "host";
            }
            this.warn(
                `x-component: 组件 "${this.componentName}" 未声明 open（默认封闭），x-component-options.dataContext 不生效（ADR-0053）`,
            );
            return "closed";
        }
        if (!open) return "closed";
        return def?.dataContext ?? "host"; // open 未指基准 → 默认消费处上下文（≈ 既有透明行为）
    }

    /**
     * 组件快照根属性并入宿主（T4=B 属性继承）。
     *
     * 宿主化身组件根，组件快照根的属性（class/style/普通属性）并入宿主：
     * - class：拼接（宿主class + 组件根class）；
     * - style：合并，冲突键组件根优先（组件内部样式不被宿主意外覆盖）；
     * - 其他属性：宿主已有则保留（不覆盖），否则复制组件根属性。
     */
    private _mergeComponentRootAttrs(snapshot: HTMLElement): void {
        const host = this.el;
        for (const attr of Array.from(snapshot.attributes)) {
            if (!attr) continue;
            const name = attr.name;
            // 跳过 x-define 声明族属性（正身 / 修饰符形态 / 指令选项 / 属性参数，均不进实例化 DOM，ADR-0054/0081）
            if (name === "x-define" || name === "x-define-options") continue;
            if (name.startsWith("x-define.")) continue;
            if (name.startsWith("x-define:")) continue;
            if (name === "class") {
                const hostClass = host.getAttribute("class") ?? "";
                const merged = (hostClass + " " + attr.value).trim();
                if (merged) host.setAttribute("class", merged);
                continue;
            }
            if (name === "style") {
                const hostStyle = host.getAttribute("style") ?? "";
                // 组件根 style 优先：放前面，冲突时后者（宿主）本应优先但共识要求组件根优先——
                // CSS 同属性后者覆盖前者，故组件根放后面。重新审视：共识"冲突键组件根优先"→ 组件根放后。
                const merged = (hostStyle ? hostStyle + ";" : "") + attr.value;
                if (merged) host.setAttribute("style", merged);
                continue;
            }
            // 其他属性：宿主已有则保留（不覆盖），否则复制
            if (!host.hasAttribute(name)) {
                host.setAttribute(name, attr.value);
            }
        }
    }

    /** 上次实际应用到组件数据域的 props（浅值比较基准；destroy 时清空） */
    private _appliedProps: Record<string, any> | undefined;

    /**
     * props 浅值比较（键集合相同 + 每键 Object.is）。overlay 基座热更新复用（protected）。
     *
     * **同引用视为不等**：绑定状态对象形态（`x-component:box="order"`）重求值返回的是同一
     * 响应式引用，其内部键可能已被外部原地修改，必须照常 assign 把最新键值拷入。
     * 仅不同引用（静态字面量每次重求值产生新对象）才比较键值。
     */
    protected _propsEqual(
        a: Record<string, any> | undefined,
        b: Record<string, any> | undefined,
    ): boolean {
        if (a === b) return false; // 同引用 → 内部键可能已变，照常更新
        if (!a || !b) return false;
        const ka = Object.keys(a);
        if (ka.length !== Object.keys(b).length) return false;
        return ka.every((k) => Object.is(a[k], b[k]));
    }

    /**
     * 更新 props（值重求值后，组件已实例化）。
     *
     * Object.assign 进组件实例 scope.data，只覆盖 props 出现的键（组件内部状态不被重置，
     * ADR-0054 决策三：覆盖声明键、删键残留、不镜像同步）。
     */
    private _updateProps(props: Record<string, any> | undefined): void {
        if (!props || !this.instanceScope?.data) return;
        Object.assign(this.instanceScope.data, props);
        this._appliedProps = props;
    }

    /**
     * 显示 loading 占位（R6=B，组件异步加载中）。
     *
     * 复用 x-loading 运行时指令：宿主加 `x-loading="true"` 属性，dispatcher 自动 mount 覆盖层。
     * 宿主 x-component 已剥指令属性（Compile 指令），加 x-loading 属性触发 Runtime 指令派发。
     */
    private _showLoadingPlaceholder(_name: string): void {
        this.el.setAttribute("x-loading", "true");
    }

    /** 移除 loading 占位（组件就绪或卸载时） */
    private _hideLoadingPlaceholder(): void {
        this.el.removeAttribute("x-loading");
    }

    /**
     * 监听带名注册事件（`components/<名>/registered`，ADR-0085），目标组件就绪后经
     * {@link _retryPendingComponent} 重试（R6=B 异步占位）。
     *
     * 订阅键即过滤（无回调内名比对）；事件 **retain**——订阅晚于注册也能立即补发，
     * 消灭「查找失败 → 订阅之间组件恰好注册」的竞态窗口。pendingName 变化须比对重订
     * （订阅键随名走；旧实现已监听即 return 不换键，靠回调内比对——迁移时一并修正）。
     */
    protected _waitForComponent(name: string, props: Record<string, any> | undefined): void {
        this.pendingName = name;
        this.pendingProps = props;
        if (this.registeredUnsub && this._pendingEventName === name) return; // 已在监听同名
        if (this.registeredUnsub) {
            this.registeredUnsub();
            this.registeredUnsub = null;
        }
        this._pendingEventName = name;
        const sub = this.engine.on(`components/${name}/registered` as any, () => {
            // retain 补发在 on() 内同步执行，重试清理后订阅可能短暂残留——无 pending 时
            // 忽略重复触发（等价于旧实现的回调内名比对守卫）
            if (this.pendingName == null) return;
            this._retryPendingComponent();
        });
        this.registeredUnsub = typeof sub === "function" ? sub : () => sub.off();
    }

    /**
     * 等待的组件就绪后的重试入口（R6=B）：清 pending + 移除占位 + 重新实例化
     * （首次渲染用最新 props）。子类可覆盖加前置条件（如 overlay 的 visible 已归假则放弃）。
     */
    protected _retryPendingComponent(): void {
        const retryName = this.pendingName!;
        const retryProps = this.pendingProps;
        this._clearPending();
        this._hideLoadingPlaceholder();
        this._instantiate(retryName, retryProps);
    }

    /** 清理 pending 状态（组件就绪重试 / 卸载时） */
    protected _clearPending(): void {
        this.pendingName = null;
        this.pendingProps = undefined;
        this._pendingEventName = null;
        if (this.registeredUnsub) {
            this.registeredUnsub();
            this.registeredUnsub = null;
        }
    }

    /**
     * 沿 parent 链统计同名组件实例化深度（递归保护 T5=A）。
     *
     * 每个 isComponent=true 的祖先 scope 若实例化了同名组件，深度 +1。
     * scope 上记录实例化的组件名（经 scope.componentName，由 compileChild 在 componentDef 在场时设置）。
     */
    protected _recursiveDepth(name: string): number {
        let depth = 0;
        let s: AutoSparkScope | null = this.binding.parent;
        while (s) {
            if (s.isComponent && s.componentName === name) depth++;
            s = s.parent;
        }
        return depth;
    }

    override destroy(): void {
        // 宿主 scope 销毁由 compileElement 触发（scope.destroy 会调本 destroy + 触发 hooks）；
        // 此处清理 pending 监听 + loading 占位 + 实例引用 + loader 在途请求。
        // 组件子树/占位块子 scope 随宿主 scope.destroy 递归销毁（置 null 断引用即可）。
        // （组件名静态后无换名重实例化场景，原 x-use 的 _destroyInstance 已随之移除，ADR-0054。）
        this._loaderAbort?.abort();
        this._loaderAbort = null;
        this._clearPending();
        this._hideLoadingPlaceholder();
        this.instanceScope = null;
        this.instanceDef = null;
        this._appliedProps = undefined;
        this._placeholderScope = null;
        this._loaderActive = false;
        this._loaderCfg = null;
    }
}
