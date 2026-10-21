import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { ComponentDataBasis, ComponentDef } from "../features/component/component-def";
import type { AutoSparkScope } from "../engine/scope";
import type { AsyncLoader } from "asyncsignal/loader";
import { collectSlotContent, parseForwardSlots, type SlotForwarding } from "../utils/slot";
import { parseHtmlFragment } from "../utils/transformElement";
import { ERROR_COMPONENT_NAME } from "../components";
import {
    createRemoteLoader,
    dispatchLoadError,
    normalizeLoadError,
    resolveRequestInit,
    type RemoteLoadMeta,
} from "../features/directive/remote-load";

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
    /** 自动重试次数（ADR-0121，默认 0 = 行为零变化） */
    retry?: number;
    /** 重试间隔毫秒（默认 0） */
    retryDelay?: number;
    /** 单次请求超时毫秒（默认 0 = 无超时） */
    timeout?: number;
    /** 缓存毫秒（默认 0 = 不缓存） */
    cache?: number;
}

/**
 * 判定值是否为纯标识符 / 连字符段形态（如 `counter`、`my-card`、`UserAvatar`）。
 *
 * ADR-0054 后组件名走属性参数、值专职 props，本判定不参与求值分流——ADR-0110 后仅用于
 * 无参 url 简写的 undefined 迁移提示：值恰为纯标识符形态时提示旧定义写法改用属性参数。
 */
function isLiteralComponentName(raw: string): boolean {
    return /^[A-Za-z_$][\w$-]*$/.test(raw);
}

/**
 * x-component：组件实例化指令（ADR-0054 更名自 x-use，实例化机制承接 ADR-0022 决策五）。
 *
 * 在模板中实例化一个已声明的组件（局部 x-define 或全局 options.components）。语法：
 * - **属性参数承载组件名**：`x-component:counter`——静态、编译期可知，不支持响应式切换组件
 *   （条件切换用外层 x-if，ADR-0054 决策二）；**可省略**——省略时值专职远程组件 url（下述三分）；
 * - **值语义三分（ADR-0110）**：指令值按**文本形态**消歧（与 loader 通道同源的 isLiteralLoaderUrl
 *   判定——props 表达式永不以 url 前缀字符开头，文本级零歧义）：
 *   1. 值命中字面量 url（`/` `./` `../` `http(s)://` `file://` 开头）→ 远程组件直载；
 *   2. 无属性参数 → 值专职 url：字面量直载，否则表达式 watch 求值（string→url、object→loader
 *      配置、null→静默、undefined 且值为纯标识符形态 → 一次性迁移提示）——**响应式 url 简写**；
 *   3. 其余（有参）→ props 表达式（ADR-0054 决策三，三形态不变：无值/对象字面量/纯状态路径）。
 * - **props 选项通道（ADR-0110）**：`x-component-options.props`（整包静态或成员属性表达式——
 *   后者经 watch 响应式）与指令值 props **双源合并**：`Object.assign(optionsProps, 指令值)`——
 *   options.props 打底、指令值覆盖同名键；无效源（标量/数组 warn）按缺失处理、另一源独走；
 *   url 形态下指令值被占用，props 单源 = options.props；
 * - props **单向**注入组件 data 域（后于 data() 默认覆盖，R1=A 合并顺序），值变时 `Object.assign`
 *   更新出现键，组件内绑定经 getContext 重读自动刷新；组件内部状态不被重置、不回写外部状态。
 *
 * **loader 配置平铺归一（ADR-0110）**：url 取值优先级 指令值 > `options.loader.url`（双声明 warn
 * + 指令值胜）；`fallback`/`error`/`width`/`height`/`request` 平铺读 `x-component-options` 顶层
 * 同名键（成员属性形态天然响应式），同名键平铺层 > loader 对象内嵌层；loader 对象形态保留兼容。
 * 无参 url 返回多组件：取文档序首个 + warn（per-url 去重），显式指定用 `x-component:名称="<url>"`。
 *
 * **实例级边界覆盖（ADR-0110，extends x-define-options）**：`x-component-options.open`/`dataContext`
 * 与作者侧 x-define-options 同键——显式布尔 open（含 false）**覆盖** def.open（三级优先级：消费
 * 显式声明 > 作者声明 > 默认封闭）；dataContext 仅在生效 open 下有效（沿用 ADR-0053 校验）。
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
 * @example 远程组件直载（url 简写 + props 选项通道）
 * <div x-component="./components/detail.html" x-component-options.props="{ id: order.id }"></div>
 * @example 多组件远程内容显式指定（url 占用指令值，props 走选项通道）
 * <div x-component:detail="./components/pages.html" x-component-options.props="{ id: order.id }"></div>
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
    /**
     * 当前实例化的组件名（属性参数静态承载，ADR-0054：恒定不变，无换名重实例化）。
     * null = 无参 url 简写（ADR-0110）尚未从远程清单定格（加载完成后取首个或校验参数名）。
     */
    private componentName: string | null = null;
    /** 当前实例化的组件 def（缓存，props 更新时复用） */
    private instanceDef: ComponentDef | null = null;
    /** pending 组件名（异步加载中，组件未就绪；监听 components/<名>/registered 后重试实例化，R6=B） */
    protected pendingName: string | null = null;
    /** pending 期间的 props（组件就绪重试时复用） */
    protected pendingProps: Record<string, any> | undefined;
    /** components/<名>/registered 监听解绑函数集（点号名候选全集一键一订，ADR-0088 pending 修订） */
    private registeredUnsubs: Array<() => void> = [];
    /** 当前监听的事件名集：候选集变化时比对重订（订阅键即过滤） */
    private _pendingEventNames: string[] = [];

    // === loader 状态（ADR-0065） ===
    /** loader 激活标志：created 解析到 loader 声明后置位，接管实例化时序（props watch 只记 pending） */
    private _loaderActive = false;
    /** 当前 loader 配置（retry 重取时复用） */
    private _loaderCfg: ComponentLoaderConfig | null = null;
    /** 当前已加载 url（响应式重求值的同 url 去重位） */
    private _loadedUrl: string | null = null;
    /** 在途加载的 AsyncLoader 实例（ADR-0121：url 变化 / scope 销毁时 abort，落地身份校验丢弃过期结果） */
    private _loader: AsyncLoader<unknown, RemoteLoadMeta> | null = null;
    /** pending props（loader 加载完成前 props watch 的暂存，完成后随实例化应用） */
    private _pendingProps: Record<string, any> | undefined;
    /** 占位块（fallback/error 组件）编译 scope（随宿主 scope.destroy 递归销毁，此处仅断引用） */
    private _placeholderScope: AutoSparkScope | null = null;

    // === 值语义三分 / props 双源（ADR-0110） ===
    /** props 选项通道最新值（x-component-options.props：整包静态或成员属性表达式） */
    private _optionsProps: Record<string, any> | undefined;
    /** 指令值通道最新 props（纯 props 通道求值产物；url 形态下恒 undefined） */
    private _directiveProps: Record<string, any> | undefined;
    /** 无参 url 简写的表达式文本（undefined 迁移提示的形态判定用；非表达式通道为 undefined） */
    private _urlExprText: string | undefined;
    /** undefined url 迁移提示已发标志（一次性，防响应式重求值刷屏） */
    private _missingUrlWarned = false;
    /** 多组件取首个的 warn 去重位（per-url：同 url 重入不刷屏，url 变化重新提示） */
    private _multiWarnedUrl: string | null = null;
    /** 无参 url 简写形态（ADR-0110）：组件名非静态——每次加载从远程清单重新决策 */
    private _anonymousUrl = false;

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
        // 组件名 + 值文本（ADR-0110 值语义三分的判定输入）。
        // 双缺（无参且无值）→ warn 跳过实例化。
        const name = this._resolveComponentName();
        const rawValue = this.value == null ? "" : String(this.value).trim();
        if (name === "" && rawValue === "") {
            this.warn(
                `x-component: 缺少组件名（应写 x-component:名称 实例化本地组件，或 x-component="<url>" 直载远程组件），已跳过实例化。`,
            );
            return;
        }
        this.componentName = name === "" ? null : name;
        // 无参 url 简写形态：组件名非静态——每次加载从远程清单重新决策（ADR-0110）
        this._anonymousUrl = name === "";
        // 配置成员统一订阅（fallback/error/width/height/request 等，ADR-0110 平铺归一）；
        // loader/props 自管订阅（loader 沿 ADR-0065 双轨、props 双源合并），skip 防同一表达式双 watcher；
        // slots 非表达式（静态清单原文直读，ADR-0125），skip 防 watch 误求值
        this._watchOptionExprs(["loader", "props", "slots"]);
        // props 选项通道（ADR-0110）：整包静态 / 成员属性表达式——所有形态统一初始化
        this._initOptionsProps();
        // === 通道一：值命中字面量 url（含无参简写）→ url 通道，字面量直载（props 全权归 options.props） ===
        if (rawValue !== "" && isLiteralLoaderUrl(rawValue)) {
            this._warnDualLoaderDeclaration();
            this.engine.scheduler.schedule(() => this._applyLoader(rawValue));
            return;
        }
        // === 通道二：无参 → 值专职 url（表达式 watch 求值——string→url、object→配置、nullish→静默） ===
        if (name === "") {
            this._urlExprText = rawValue;
            const initial = this.binding.watch(rawValue, ({ value }) => this._applyLoader(value));
            this.engine.scheduler.schedule(() => this._applyLoader(initial));
            return;
        }
        // === 通道三：有参 + options.loader 旧通道（ADR-0065 保留；指令值仍专职 props） ===
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
        // === 通道四：纯 props 通道（值专职 props，ADR-0054 决策三） ===
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
     * 点号组件名重建（ADR-0088，pending 场景可重跑）：指令解析器把属性参数的句点段切为
     * 修饰符（`x-component:autospark.notifications.actions` → attr="autospark" + modifiers），
     * 而组件名合法含点（`autospark.*` 引擎保留命名空间，ADR-0083）——按**升序候选回溯**
     * 拼接：attr 起逐段并入修饰符试查组件表，首个命中者即组件名；短名优先命中时点号段保持
     * 修饰符语义（`x-component:counter.global` 的 .global 不受影响）。
     *
     * 编译期（created）单次回溯的盲区：组件注册晚于编译（注入模式 registerComponent /
     * x-import 异步加载）时全部候选 miss，名字定格在截断短名——pending 重试时经
     * {@link _retryPendingComponent} 重跑本方法，注册表已变则回溯升级为全名。
     */
    private _resolveComponentName(): string {
        let name = (this.attr ?? "").trim();
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
        return name;
    }

    /**
     * 点号候选全集（升序）：`attr`、`attr.m1`、…、全串——pending 等待的注册事件键集
     * （截断名与全名任一注册到来都能解锁重试，重试时回溯重判）。无修饰符时为单键。
     */
    private _componentNameCandidates(): string[] {
        const base = (this.attr ?? "").trim();
        if (base === "" || !this.modifiers?.length) return base === "" ? [] : [base];
        const segments = [base, ...this.modifiers];
        return segments.map((_, i) => segments.slice(0, i + 1).join("."));
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
            // 在其自身 created 的自检中检测到本指令（ownsChildren）后对称让位退出；
            // d === this 自我守卫（ADR-0117）：元素名自动组件等子类的 info.name 是组件名
            //（如 "counter"），迭代会命中自身——不豁免则误报自身冲突
            if (d === this || d.info.name === "component" || d.info.name === "teleport") {
                return false;
            }
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
     * props 选项通道初始化（ADR-0110）：成员属性表达式（响应式，优先，overlay 基座同款）→
     * 整包内嵌静态 props 回退（无 watch 无热更新，作初始值）。
     */
    private _initOptionsProps(): void {
        const propsExpr = this.info.optionExprs?.props;
        if (propsExpr !== undefined) {
            if (propsExpr.trim() === "") {
                this.warn(
                    `x-component: x-component-options.props 的值为空（须提供表达式：对象字面量或状态路径），已忽略`,
                );
                return;
            }
            const initial = this.binding.watch(
                propsExpr,
                ({ value }) => this._onOptionsProps(value),
                { depth: 2 },
            );
            this._onOptionsProps(initial);
        } else {
            const staticProps = this.getOption("props");
            if (staticProps !== undefined) this._onOptionsProps(staticProps);
        }
    }

    /**
     * props 值归一（指令值通道与 options.props 通道共用）：
     * - 对象 → 原样；
     * - null / undefined → undefined（如绑定的状态对象尚未就绪，静默）；
     * - 标量 / 数组 → warn 忽略（值必须是对象形态之一，数组无键值语义）。
     */
    private _normalizeProps(value: any): Record<string, any> | undefined {
        if (Array.isArray(value)) {
            this.warn(
                `x-component: props 值须为对象（字面量或状态对象），数组已忽略: ${JSON.stringify(value)}`,
            );
            return undefined;
        }
        if (value != null && typeof value === "object") return value as Record<string, any>;
        if (value !== undefined && value !== null) {
            this.warn(
                `x-component: props 值须为对象（字面量或状态对象），已忽略: ${JSON.stringify(value)}`,
            );
        }
        return undefined;
    }

    /** props 选项通道值变化（ADR-0110）：归一 → 存源 → 双源合并提交 */
    private _onOptionsProps(value: any): void {
        this._optionsProps = this._normalizeProps(value);
        this._commitProps();
    }

    /**
     * 指令值通道 props 变化处理（组件名静态，无换名重实例化分支，ADR-0054）。
     * 归一后存源，实例化/更新时机统一交 {@link _commitProps}（双源合并，ADR-0110）。
     */
    private _onValueChange(value: any): void {
        this._directiveProps = this._normalizeProps(value);
        this._commitProps();
    }

    /**
     * props 双源合并提交（ADR-0110）：`Object.assign(optionsProps, 指令值)`——options.props
     * 打底、指令值覆盖同名键；单源缺失时另一源独走。合并结果经既有防抖/更新协议应用：
     *
     * 已实例化 → 仅更新 props（覆盖声明键，组件内部状态不被重置）。
     * props 与上次应用值浅等则跳过：静态字面量 props（无状态路径）的表达式支路 watcher
     * 订阅为空 deps（autostore watch([]) = 任意状态变化触发），每次重求值产生键值相同的
     * 新对象——若照常 assign 会把组件内部交互状态重置回 props 字面量（counter demo 场景：
     * 点击 + 后 count=105 被打回 100）。值没变就不是更新（ADR-0054 决策三）。
     */
    private _commitProps(): void {
        let props: Record<string, any> | undefined;
        if (this._optionsProps && this._directiveProps) {
            props = { ...this._optionsProps, ...this._directiveProps };
        } else {
            props = this._directiveProps ?? this._optionsProps;
        }
        if (this.instanceScope && this.instanceDef) {
            if (this._propsEqual(props, this._appliedProps)) return;
            this._updateProps(props);
            return;
        }
        this._pendingProps = props;
        // loader 接管实例化时机（ADR-0065 决策三首帧严格）：加载完成后 _runLoader 统一实例化
        if (this._loaderActive) return;
        // 无组件名且 url 通道未激活（表达式尚未求值到 url）：等 url 通道驱动
        if (this.componentName == null) return;
        this._instantiate(this.componentName, props);
    }

    /** 指令值 url 与 options.loader 双声明 warn（ADR-0110：url 优先级指令值 > options.loader.url） */
    private _warnDualLoaderDeclaration(): void {
        if (
            this.info.optionExprs?.loader !== undefined ||
            this.getOption("loader") !== undefined
        ) {
            this.warn(
                `x-component: 指令值 url 与 x-component-options.loader 双声明，以指令值 url 为准，loader 声明已忽略。`,
            );
        }
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
     * 应用 loader 声明（ADR-0065）：值形态归一 + 平铺键合成 + 同 url 去重后发起加载。
     *
     * 值三态：string → url 简写（归一 `{ url }`）；对象 → 配置原样；null → 静默（绑定状态未
     * 就绪，对齐 props 绑定 nullish 静默先例）；undefined → 静默，但值为纯标识符形态时一次性
     * 迁移提示（疑似旧组件名写法 `x-component="counter"`，指回属性参数，ADR-0110）；其余 → warn。
     *
     * 平铺归一（ADR-0110）：`fallback/error/width/height/request` 平铺读 `x-component-options`
     * 顶层同名键（getOption 表达式层 > 整包 > 宿主），同名键平铺层 > loader 对象内嵌层。
     */
    private _applyLoader(value: unknown): void {
        let cfg: ComponentLoaderConfig | null = null;
        if (typeof value === "string") {
            const raw = value.trim();
            if (raw === "") return;
            cfg = { url: raw };
        } else if (value && typeof value === "object" && !(value instanceof RegExp)) {
            cfg = value as ComponentLoaderConfig;
        } else if (value === undefined) {
            // 无参 url 简写：路径不存在/尚未就绪。恰为纯标识符形态 → 疑似旧组件名写法，一次性提示
            if (
                this._urlExprText !== undefined &&
                !this._missingUrlWarned &&
                isLiteralComponentName(this._urlExprText)
            ) {
                this._missingUrlWarned = true;
                this.warn(
                    `x-component: 值 "${this._urlExprText}" 未求值到 url（状态路径不存在或尚未就绪）；` +
                        `若意图实例化本地组件，请改写 x-component:${this._urlExprText}（组件名走属性参数，ADR-0054）。`,
                );
            }
            return;
        } else if (value === null) {
            return;
        }
        const url = cfg?.url;
        if (!cfg || !url || typeof url !== "string" || url.trim() === "") {
            this.warn(`x-component: loader 缺少有效 url，已跳过加载。`);
            return;
        }
        // 平铺键合成（顶层 > loader 对象内嵌同名键）
        const merged = { ...cfg };
        const fallback = this.getOption("fallback") as LoaderPlaceholder | undefined;
        const error = this.getOption("error") as LoaderPlaceholder | undefined;
        const width = this.getOption("width") as number | string | undefined;
        const height = this.getOption("height") as number | string | undefined;
        const request = this.getOption("request") as RequestInit | undefined;
        const retry = this.getOption("retry") as number | undefined;
        const retryDelay = this.getOption("retryDelay") as number | undefined;
        const timeout = this.getOption("timeout") as number | undefined;
        const cache = this.getOption("cache") as number | undefined;
        if (fallback !== undefined) merged.fallback = fallback;
        if (error !== undefined) merged.error = error;
        if (width !== undefined) merged.width = width;
        if (height !== undefined) merged.height = height;
        if (request !== undefined) merged.request = request;
        if (retry !== undefined) merged.retry = retry;
        if (retryDelay !== undefined) merged.retryDelay = retryDelay;
        if (timeout !== undefined) merged.timeout = timeout;
        if (cache !== undefined) merged.cache = cache;
        this._loaderActive = true;
        if (url === this._loadedUrl) return; // 同 url 去重（响应式重求值但 url 未变）
        this._runLoader(merged);
    }

    /**
     * 执行 loader 加载（ADR-0065 决策三/四 + ADR-0121 收编）：清旧内容 → 占位（fallback/x-loading
     * + 尺寸）→ 经统一内核编排 fetch 注册（已注册仍 fetch，「以此 url 为准」）→ 同名校验 →
     * 实例化；失败 → 统一错误路径。url 响应式变化重入本方法：abort 旧 loader、销毁旧实例子树
     * （组件内部状态丢失）。
     */
    private _runLoader(cfg: ComponentLoaderConfig): void {
        this._loader?.abort();
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
        const getOption = (key: string): any => {
            if (key in cfg) return (cfg as Record<string, any>)[key];
            return this.getOption(key);
        };
        const loader = createRemoteLoader({
            engine: this.engine,
            url,
            getOption,
            loaderFn: async ({ abortSignal }) => {
                // request 权威整包 + method/header 简写（决策 7）；signal 不进 request
                // （engine 缓存键含 request 序列化——signal 非可序列化字段，单列透传）
                const init = resolveRequestInit(getOption, abortSignal);
                const { signal: initSignal, ...requestInit } = init;
                const signal = initSignal ?? undefined;
                // 仅剩内核默认补的 method:"GET" 时视为无自定义请求——保持 engine 缓存键为裸 url
                // （与 x-import 缺省形态一致，避免同 url 双键双 fetch）
                const hasCustomRequest =
                    Object.keys(requestInit).length > 1 || requestInit.method !== "GET";
                const registered = await this.engine.importComponentsFromUrl(
                    url,
                    this._globalMode ? null : this.binding.parent,
                    this._globalMode,
                    hasCustomRequest ? requestInit : undefined,
                    signal,
                );
                // null = 加载失败（engine 内已 warn）；抛错交内核归一/重试编排
                if (registered === null) throw new Error(`远程内容加载失败（${url}）`);
                return registered;
            },
        });
        this._loader = loader;
        this._wireLoaderLanding(loader, cfg, loader.get());
    }

    /**
     * 手动重试弹药（ADR-0121 决策 4）：执行体 = 当前 loader 的 `refresh()`（在途先中止再重启），
     * 落地与首取同路径。
     */
    private _retryLoader(): void {
        const loader = this._loader;
        if (!loader || !this._loaderCfg) return;
        this._wireLoaderLanding(loader, this._loaderCfg, loader.refresh());
    }

    /**
     * 统一落地点（ADR-0121）：成功 → 组件名决策（anonymous 取首 / 多组件 warn / 同名校验）→
     * 实例化；失败（重试耗尽）→ 错误归一 + `_renderLoaderError`；校验类失败同样走统一错误路径。
     * 主动 abort（AbortError）静默丢弃（决策 3）。
     */
    private _wireLoaderLanding(
        loader: AsyncLoader<unknown, RemoteLoadMeta>,
        cfg: ComponentLoaderConfig,
        p: Promise<unknown>,
    ): void {
        p.then(
            (registered: unknown) => {
                if (loader !== this._loader) return;
                const names = registered as string[];
                const url = cfg.url;
                // 组件名决策：无参 url 简写（ADR-0110）**每次加载重新决策**——取文档序首个 +
                // warn（per-url 去重），url 内容变化名字随新清单走；有参走同名校验（决策四）——
                // 本次加载结果无属性参数指定的组件 → error 呈现（查返回清单而非沿链查找——
                // 命中祖先 scope 的旧同名组件不算本次加载成功）
                if (this._anonymousUrl) {
                    if (names.length === 0) {
                        this._renderLoaderError(new Error(`远程内容中无组件（${url}）`), cfg);
                        return;
                    }
                    if (names.length > 1 && this._multiWarnedUrl !== url) {
                        this._multiWarnedUrl = url;
                        this.warn(
                            `x-component: 远程内容含 ${names.length} 个组件，已取文档序首个 "${names[0]}"；` +
                                `如需显式指定请改写 x-component:${names[0]}="${url}"。`,
                        );
                    }
                    this.componentName = names[0]!; // 上方 length === 0 已早退
                } else if (!names.includes(this.componentName!)) {
                    this._renderLoaderError(new Error(`远程内容中无组件 "${this.componentName}"`), cfg);
                    return;
                }
                this._clearHostContent();
                this._instantiate(this.componentName!, this._pendingProps);
            },
            (err: unknown) => {
                if (loader !== this._loader) return;
                if ((err as Error)?.name === "AbortError") return; // 主动 abort，非真错误
                this._renderLoaderError(
                    err instanceof Error ? err : new Error(String(err)),
                    cfg,
                );
            },
        );
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
     * 呈现加载失败（ADR-0065 决策六/七 + ADR-0121 决策 5）：自定义 error 声明走占位协议；
     * 缺省渲染内置 error 组件（getComponentDeclaration(ERROR_COMPONENT_NAME) 沿链 + 全局兜底
     * → 构造器默认内置），注入 error/message 与 retry/close 闭包（back 按钮走内置 action，
     * 无需注入）。error 不自愈——恢复途径仅 url 变化（响应式重入）或 retry。
     * ADR-0121：错误归一 + dispatchLoadError 派发 + x-error 在场退位；retry 统一走 loader.refresh()。
     */
    private _renderLoaderError(err: Error, cfg: ComponentLoaderConfig): void {
        this._clearHostContent();
        const loadErr = normalizeLoadError(err, this._loader?.meta);
        dispatchLoadError(this.el, loadErr, () => this._retryLoader());
        if (this.el.closest("[x-error]")) return;
        // 无参 url 简写加载失败时 componentName 尚未定格 → 文案退化为「远程组件」
        const label = this.componentName ?? "远程组件";
        const message = `组件 "${label}" 加载失败（${cfg.url}）：${err.message}`;
        if (cfg.error !== undefined && cfg.error !== "") {
            this._renderPlaceholder(cfg.error, {
                url: cfg.url,
                name: this.componentName,
                error: loadErr,
                message,
            });
            return;
        }
        const snapshot = this.binding.getComponentDeclaration(ERROR_COMPONENT_NAME);
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
                error: loadErr,
                message,
                url: cfg.url,
                name: this.componentName,
                // ADR-0118 决策 8 新契约：retryable/closeable（旧 hasRetry/hasClose 已退役）
                retryable: true,
                closeable: true,
            },
        );
        this._placeholderScope = compiled.scope;
        // retry/close 执行体注入实例 scope.actions（@click 经 getAction 命中；`back` 走内置 action）：
        // retry：统一走 loader.refresh()（ADR-0121 决策 4）
        compiled.scope.actions = {
            ...(compiled.scope.actions ?? {}),
            retry: {
                name: "retry",
                handle: () => this._retryLoader(),
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
        // 此处收集为 content map，stash 到宿主 scope 供出口 SlotDirective 查找。
        // 组件路径全量收集（ADR-0107 决策五）：跳过出口清单校验——动态出口名运行期才可知，
        // 未被消费的段静默闲置不 warn；覆盖物路径（overlay）维持清单校验不变。
        // 模板只读：collect 一律 cloneNode，不摘原节点（ADR-0002）。
        const slotContents = this.template
            ? collectSlotContent(this.template, found.def?.slots, (m) => this.warn(m), {
                  skipValidation: true,
              })
            : null;
        // 插槽转发声明（ADR-0125）：x-component-options.slots 静态清单一次解析，
        // stash 到实例 scope（持有者）——出口 SlotDirective 查找时按声明翻译逐级接力上溯
        const forwarding = this._parseForwardSlots();
        this.binding.slotForwarding = forwarding;
        if (forwarding) this._warnForwardSlotsCollisions(forwarding, found.def);
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

    /** 声明方自身 def.slots（warn 纪律用，ADR-0125）：首次判定时缓存——重实例化时宿主 scope
     * 已被注入内层组件语义（isComponent），届时沿链上溯会误指内层组件 */
    private _declarerSlots: string[] | null | undefined;

    /**
     * 解析插槽转发声明（ADR-0125 决策二/三）：`x-component-options.slots`——静态值，
     * 编译期一次解析不响应式。读取优先级：成员属性原文（`x-component-options.slots="…"`）
     * > 显式选项值（`x-component-options="{slots:…}"` / 宿主 x-options 回退）> `.slots`
     * 修饰符开关（显式值在场时被压制，ADR-0007 显式优先）。
     * 值语义：布尔 true / 字符串 "true" / `*` = **全部转发**快捷方式（≡ 通配）；字符串清单按
     * 逗号解析；布尔 false = 显式关闭（静默，可压制修饰符）；其余非字符串 / 空值 warn + 忽略。
     * null = 未声明或声明无效。
     */
    private _parseForwardSlots(): SlotForwarding | null {
        // 全部转发快捷方式（≡ `*`）：布尔 true（修饰符 / 整包）与字符串 "true"（成员属性形态）
        const ALL: SlotForwarding = { wildcard: true, map: new Map() };
        const fromValue = (raw: string): SlotForwarding | null => {
            const t = raw.trim();
            if (t === "true") return ALL;
            if (t !== "") return parseForwardSlots(t, (m) => this.warn(`x-component: ${m}`));
            this.warn(
                `x-component: x-component-options.slots 须为 true 或非空静态字符串清单（裸名 / 出口名:对外名 / *，逗号分隔），已忽略（ADR-0125）`,
            );
            return null;
        };
        // 成员属性原文（恒为属性文本 string）最优先
        const member = this.info.optionExprs?.slots;
        if (member !== undefined) return fromValue(String(member));
        // 显式选项值优先于修饰符（ADR-0007：显式声明含 false 压制 modifier 开关）
        const explicit = this.getOption("slots");
        if (explicit !== undefined) {
            if (explicit === true) return ALL;
            if (explicit === false) return null;
            if (typeof explicit === "string") return fromValue(explicit);
            this.warn(
                `x-component: x-component-options.slots 须为 true 或非空静态字符串清单（裸名 / 出口名:对外名 / *，逗号分隔），已忽略（ADR-0125）`,
            );
            return null;
        }
        // 修饰符开关：`x-component:名.slots` ≡ slots=true——修饰符匹配大小写不敏感
        //（HTML 属性名被 DOM 小写化，x-for .paging 先例）
        if (this.modifiers?.some((m) => m.toLowerCase() === "slots")) {
            return ALL;
        }
        return null;
    }

    /**
     * 转发 warn 纪律（ADR-0125 决策五，编译期一次、列出名字、不阻断）：
     * - 清单模式（含混写显式项）：对外名 ∩ 声明方自身 def.slots → 逐名 warn（同名段将被
     *   自身出口与转发下游双渲染）；
     * - `*` 模式：声明方 def.slots ∩ 相邻下一级组件 def.slots → warn 一次列出交集
     *   （不深扫多级、动态出口场景不追求精确，对齐 ADR-0107 skipValidation 容错哲学）。
     */
    private _warnForwardSlotsCollisions(forwarding: SlotForwarding, innerDef: ComponentDef | null): void {
        // 声明方 = 包装组件：模板内含本 x-component 元素的最近组件实例 scope（首判时缓存）
        if (this._declarerSlots === undefined) {
            let declarer: AutoSparkScope | null = this.binding;
            while (declarer && !declarer.isComponent) declarer = declarer.parent;
            this._declarerSlots = declarer?.componentDef?.slots ?? null;
        }
        const declarerSlots = this._declarerSlots;
        if (!declarerSlots || declarerSlots.length === 0) return;
        for (const outer of forwarding.map.values()) {
            if (declarerSlots.includes(outer)) {
                this.warn(
                    `x-component: 插槽转发 "${outer}" 与包装组件自身出口同名——该名段将同时被自身出口与转发下游消费（双渲染，ADR-0125）`,
                );
            }
        }
        if (forwarding.wildcard) {
            const innerSlots = innerDef?.slots;
            if (innerSlots && innerSlots.length > 0) {
                const inter = innerSlots.filter((n) => declarerSlots.includes(n));
                if (inter.length > 0) {
                    this.warn(
                        `x-component: 通配转发（*）命中与包装组件自身出口同名段：${inter.join("、")}——这些段将同时被自身出口与转发下游消费（双渲染，ADR-0125）`,
                    );
                }
            }
        }
    }

    /**
     * 解析数据基准（ADR-0053 组件数据边界；修订一：消费侧 `.open` 豁免；ADR-0110：open 实例级覆盖）。
     *
     * 解析链：`x-component-options.dataContext`（消费覆盖）→ `def.dataContext`（作者声明，含 `.open` 修饰符
     * 经 buildComponentDef 校验）→ 默认。规则：
     * - **open 三级优先级（ADR-0110，extends x-define-options）**：消费侧显式布尔（`.open` 修饰符 ≡
     *   `x-component-options="{open:true}"`；含显式 `open:false`）**覆盖** def.open → def.open → 默认封闭。
     *   消费侧可打开也可关闭（实例级边界覆盖，不回写 def 快照）；
     * - 基准取消费 dataContext > def.dataContext（封闭组件上恒为 undefined）> 默认 `'host'`；
     * - 消费侧 dataContext 声明落在封闭组件（无任何 open 通道）时仍 warn + 忽略，保持封闭；
     * - 无效基准值 warn + 回退 `'host'`；
     * - `def` 为 null（纯快照组件，无声明侧 open 通道）仍可被消费侧 open 打开。
     */
    private _resolveDataBasis(def: ComponentDef | null): ComponentDataBasis {
        const optionCtx = this.getOption("dataContext");
        // 消费侧 open 只读指令选项层（不经 getOption 的宿主 x-options 回退）——
        // 避免宿主上给其他指令声明的 open 键意外影响组件边界（ADR-0007 回退语义的隔离例外）。
        // 显式布尔（含 false）覆盖 def.open；未声明回退作者声明（ADR-0110 三级优先级）
        const rawOpen = this.options?.open;
        const open = typeof rawOpen === "boolean" ? rawOpen : def?.open === true;
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
     *
     * 点号名候选全集订阅（ADR-0088 pending 修订）：解析器把属性参数句点段切为修饰符，
     * 编译期回溯未命中时名字定格截断短名——单键等待会与全名注册事件（如
     * `components/autospark.outlet/registered`）键不匹配而死锁。故对候选全集
     * （`autospark`、`autospark.outlet`、…）逐键订阅，任一到来即解锁，重试时回溯重判。
     */
    protected _waitForComponent(name: string, props: Record<string, any> | undefined): void {
        this.pendingName = name;
        this.pendingProps = props;
        const eventNames = this._componentNameCandidates().map((c) => `components/${c}/registered`);
        if (eventNames.length === 0) return;
        const sameSet =
            eventNames.length === this._pendingEventNames.length &&
            eventNames.every((k) => this._pendingEventNames.includes(k));
        if (sameSet) return; // 已在监听同候选集
        this._unsubscribePending();
        this._pendingEventNames = eventNames;
        for (const key of eventNames) {
            const sub = this.engine.on(key as any, () => {
                // retain 补发在 on() 内同步执行，重试清理后订阅可能短暂残留——无 pending 时
                // 忽略重复触发（等价于旧实现的回调内名比对守卫）
                if (this.pendingName == null) return;
                this._retryPendingComponent();
            });
            this.registeredUnsubs.push(typeof sub === "function" ? sub : () => sub.off());
        }
    }

    /** 解除 pending 订阅集（重订 / 清理时） */
    private _unsubscribePending(): void {
        for (const off of this.registeredUnsubs) off();
        this.registeredUnsubs = [];
        this._pendingEventNames = [];
    }

    /**
     * 等待的组件就绪后的重试入口（R6=B）：清 pending + 移除占位 + 重新实例化
     * （首次渲染用最新 props）。子类可覆盖加前置条件（如 overlay 的 visible 已归假则放弃）。
     *
     * 重跑点号回溯（ADR-0088 pending 修订）：等待期间注册表已变（如全名组件经
     * registerComponent / x-import 注册），截断短名可能已可升级为全名。
     */
    protected _retryPendingComponent(): void {
        const retryProps = this.pendingProps;
        const resolved = this._resolveComponentName();
        this._clearPending();
        this._hideLoadingPlaceholder();
        if (resolved === "") return;
        this._instantiate(resolved, retryProps);
    }

    /** 清理 pending 状态（组件就绪重试 / 卸载时） */
    protected _clearPending(): void {
        this.pendingName = null;
        this.pendingProps = undefined;
        this._unsubscribePending();
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
        this._loader?.abort();
        this._loader = null;
        this._clearPending();
        this._hideLoadingPlaceholder();
        this.instanceScope = null;
        this.instanceDef = null;
        this._appliedProps = undefined;
        this._placeholderScope = null;
        this._loaderActive = false;
        this._loaderCfg = null;
        this._optionsProps = undefined;
        this._directiveProps = undefined;
        this._urlExprText = undefined;
        this._missingUrlWarned = false;
        this._multiWarnedUrl = null;
        this._anonymousUrl = false;
    }
}
