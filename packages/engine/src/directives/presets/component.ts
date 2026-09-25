import { AutoSparkDirectiveBase } from "../base";
import type { ComponentDataBasis, ComponentDef } from "../component-def";
import type { AutoSparkScope } from "../../scope";
import { collectSlotContent } from "../../utils/slot";

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
 * - 取组件冻结快照（经 `scope.getComponent(name)` 沿链就近 + 全局兜底）；
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
    /** pending 组件名（异步加载中，组件未就绪；监听 component/registered 后重试实例化，R6=B） */
    protected pendingName: string | null = null;
    /** pending 期间的 props（组件就绪重试时复用） */
    protected pendingProps: Record<string, any> | undefined;
    /** component/registered 监听解绑函数 */
    private registeredUnsub: (() => void) | null = null;

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
        // 组件名：属性参数承载（x-component:counter，ADR-0054 决策二）。缺参 → warn 跳过实例化；
        // 值恰为纯标识符时附言迁移指引（旧定义写法 x-component="名" 与新实例化同形，指回 x-define）。
        const name = (this.attr ?? "").trim();
        if (name === "") {
            const rawValue = this.value == null ? "" : String(this.value).trim();
            const hint = isLiteralComponentName(rawValue)
                ? `；若是组件定义，请改用 x-define="${rawValue}"（ADR-0054）`
                : "";
            this.warn(`x-component: 缺少组件名（应写 x-component:名称），已跳过实例化${hint}。`);
            return;
        }
        this.componentName = name;
        // 值专职 props（ADR-0054 决策三）：无值 = 无 props（不订阅）
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
            if (d.info.name === "component") return false;
            const cls = this.engine.directives.get(d.info.name);
            return !!cls?.ownsChildren?.(d.info);
        });
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
        this._instantiate(this.componentName!, props);
    }

    /**
     * 组件查找 + def 反查（x-component 与 overlay 基座共享）。
     *
     * 快照经 `scope.getComponent(name)`（scope 链就近 + 全局兜底）；def 反查：
     * 作用域组件经 `_componentDefs`（WeakMap，snapshot 为 key）、全局组件经
     * `_globalComponentDefCache`（按 name）——getComponentDef 对全局 snapshot 返回 undefined，
     * 须 fallback getGlobalComponentDef，否则全局组件的 setup(data/methods/hooks) 丢失、不注入。
     *
     * @returns `{ snapshot, def }`；未命中返回 null（调用方决定等待/警告行为）
     */
    protected _findComponentDef(
        name: string,
    ): { snapshot: HTMLElement; def: ComponentDef | null } | null {
        const snapshot = this.binding.getComponent(name);
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
            // 跳过 x-define 声明族属性（正身 / 修饰符形态 / 指令选项，均不进实例化 DOM，ADR-0054）
            if (name === "x-define" || name === "x-define-options") continue;
            if (name.startsWith("x-define.")) continue;
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
     * 监听 component/registered 事件，目标组件就绪后经 {@link _retryPendingComponent} 重试
     * （R6=B 异步占位）。
     */
    protected _waitForComponent(name: string, props: Record<string, any> | undefined): void {
        this.pendingName = name;
        this.pendingProps = props;
        if (this.registeredUnsub) return; // 已在监听
        const sub = this.engine.on("component/registered", (m: any) => {
            const payload = m?.payload ?? m;
            if (payload?.name === this.pendingName) {
                this._retryPendingComponent();
            }
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
        // 此处清理 pending 监听 + loading 占位 + 实例引用。组件子树子 scope 随宿主 scope.destroy 递归销毁。
        // （组件名静态后无换名重实例化场景，原 x-use 的 _destroyInstance 已随之移除，ADR-0054。）
        this._clearPending();
        this._hideLoadingPlaceholder();
        this.instanceScope = null;
        this.instanceDef = null;
        this._appliedProps = undefined;
    }
}
