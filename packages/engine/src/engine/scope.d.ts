import type { AutoSpark } from "./engine";
import type { ComponentDef, ComponentHooks } from "../features/component/component-def";
import type { AutoSparkAction } from "../features/action/types";
import type { SlotContent, SlotForwarding, SlotRegistry, SuperInlet } from "../utils/slot";
import { AutoSparkDirectiveBase } from "../features/directive/base";
import { type Watcher } from "autostore";
import { type ScopeIconEntry } from "../features/icons/domain";
/** 纯状态路径判定。导出供指令复用（x-for 据此判断 itemsPath 是否纯路径，
 *  决定是否补 `items.*` 项级监听——表达式 itemsPath 已由 watchExpression 覆盖）。 */
export declare function isSimpleStatePath(value: string): boolean;
export { LOCAL_PATHS } from "../consts";
export type AutoSparkBindingOptions = {
    /** 引用模板元素（编译只读输入，保留指令属性） */
    template: HTMLElement;
    /** 引用实际渲染的元素（已移除指令属性） */
    el: HTMLElement;
    /** 该元素上的指令实例列表 */
    directives: AutoSparkDirectiveBase[];
};
/**
 * 指令更新回调：接收当前最新值。
 *
 * 注意：回调在 `scheduler` flush 时触发，传入的 `value` 是**重新求值后的当前值**，
 * 反映本 tick 内所有变更的累积结果（而非某一次 operate 的值）。
 */
export type ScopeWatchListener = (payload: {
    value: any;
}) => void;
/**
 * 编译期错误条目（ADR-0118 决策 1）：收集到失败元素**所属 scope** 的 `errors` 字段
 * （只当前 scope，不含后代）。纯属性暴露（不经 engine.emit 广播），供调试/开发工具消费。
 * 与 x-error 管的「运行时错误」（action 桥接 / raise，经 DOM error 事件）正交两轨，互不消费。
 */
export interface ScopeErrorEntry {
    /** 错误来源阶段：指令 created / 指令 compile / 绑定表达式首次求值 */
    source: "directive-created" | "directive-compile" | "expression";
    /** 指令名（source 为 directive-* 时携带） */
    directive?: string;
    /** 表达式原文（source 为 expression 时携带） */
    expression?: string;
    /** 原始错误对象 */
    error: any;
}
/**
 * watch 的订阅选项（仅路径支路生效，透传给 `store.watch`，ADR-0043）。
 *
 * - `depth`：向后代钻取的深度（autostore 三档语义：0=仅自身重赋值、1=自身+恰好一级后代、
 *   ≥2=自身+全部后代）。属性展开（`x-bind="obj"` 无参）用它订阅对象内部键的变更。
 *   表达式支路（collectDependencies 读代理自动收集）无此概念，声明了也不生效。
 * - `context`：求值视图。`"caller"` = **调用方视图**（`getCallerContext`：跳过组件 `_data`/封闭
 *   边界，保留调用方 locals）——与插槽内容同一基准（ADR-0108）。缺省 `"self"`（本 scope 聚合视图）。
 *   `"caller"` 时强制走表达式支路（调用方视图的变量可能来自调用方 x-data 域，不能按 state 路径直订）。
 */
export interface ScopeWatchOptions {
    depth?: number;
    context?: "self" | "caller";
}
/**
 * x-for 分页状态的只读快照（ADR-0042 分页状态读取器 `scope.paging`）。
 * total 为估算值（pageCount×pageSize，尾页不满时高估）。
 */
export interface AutoSparkPagingSnapshot {
    /** 当前页码（1-based） */
    page: number;
    /** 每页条数 */
    pageSize: number;
    /** 总页数（0=未知，load-more 模式） */
    pageCount: number;
    /** 是否还有下一页 */
    hasMore: boolean;
    /** 是否正在加载（loader 模式） */
    loading: boolean;
    /** 错误信息（loader 模式，无错为 null） */
    error: string | null;
    /** 总条数估算值（pageCount×pageSize） */
    total: number;
}
/**
 * Q: 为什么要引入 Scope？
 * A: 一个 DOM 元素上可能挂多个指令，Scope 统一管理它们的生命周期与订阅，
 *    并在元素更新/销毁时集中清理（off watcher、递归销毁子作用域）。
 */
export declare class AutoSparkScope {
    /** scope 自增 id 计数器：作为 store.state.$scopes[id] 的索引键（x-data 私有响应式域，见 DataDirective） */
    private static _seq;
    /** 本 scope 唯一标识；仅 x-data scope 会在 store.state.$scopes[id] 创建对应条目，其余 scope 不占位 */
    readonly id: number;
    private _template;
    /** 引用实际渲染的元素 */
    readonly _el: WeakRef<HTMLElement>;
    readonly engine: AutoSpark;
    directives: AutoSparkDirectiveBase[];
    /**
     * 元素级宿主选项（`x-options` 解析产物，ADR-0007）。
     *
     * 供同元素所有指令经 `getOption` 回退读取（指令选项未命中时回退到此）。
     * 是配置而非数据，**不参与 getContext 聚合视图**（不污染表达式数据命名空间）。
     * 无 x-options 时为 null。
     */
    hostOptions: Record<string, any> | null;
    /**
     * x-data 注入的私有响应式数据域（指向 `store.state.$scopes[scope.id]`）。
     *
     * 由 `DataDirective` 在 `created()` 首次注入时令本字段指向 `store.state.$scopes[id]`（core 自动
     * 建响应式代理）。**永不换引用**——`_scopeView` Proxy 闭包绑定该引用；运行时更新只 `Object.assign`
     * 原地改（见 `engine.data`），绝不整体替换。与 `locals` 同级叠加进 `getContext`。
     *
     * 读写经 store 响应式代理 → `collectDependencies` 收集 `$scopes.<id>.<field>` 精准路径，
     * 字段级细粒度更新（**响应式**，无需 refresh——与 locals 的 refresh 驱动不同）。
     *
     * 父子元素的 data 经 parent 链层叠（子覆盖父同名键）；容器 x-data 经 parent 链
     * 自动透传进 x-for 各 item scope（item.parent = 容器 scope）。
     *
     * 字段名 `_data`（ADR-0022 决策二-3 修订）：对外暴露 `data` 改为 getter 返回 `getContext()`
     * 聚合视图（供 Proxy this 的 `this.data`），引擎内部读写响应式域用 `_data`。
     */
    _data: Record<string, any> | null;
    /**
     * data 聚合视图 getter（ADR-0022 决策二-3 修订）。
     *
     * 返回 `getContext()`——locals + _data + parent 链 + 全局 state 的聚合 Proxy 视图（响应式、
     * 可读可写）。供 Proxy this 的 `this.data`、外部便捷访问。底层响应式域经 `_data` 字段访问。
     */
    get data(): Record<string, any>;
    /**
     * 组件实例的内部方法容器（ADR-0022 决策二-3 修订）。
     *
     * 由 `<script setup>` 的 methods 经 `injectComponentSemantics` 注入（不再进 `scope.actions`，
     * 与 action 彻底分离）。method 经 `getMethod`（组件边界）查找、`getMethodThis()`（Proxy）调用——
     * method 内 `this` 是 Proxy，`this.<method名>` 直调/互调。普通 scope（非组件实例）为 null。
     */
    methods: Record<string, (...args: any[]) => any> | null;
    /**
     * 组件实例的非响应式局部变量（ADR-0022 决策二-3 (10)）。
     *
     * 由 `<script setup>` 的 `data` 段经 `injectComponentSemantics` 注入（ADR-0055 更名自 locals 段）。**普通对象、不进聚合视图**
     *（getContext 不含 _locals）——模板表达式读不到，仅经 Proxy this 的 `this.<key>` 访问
     *（method/data/framework key 优先级高于 _locals）。典型用途：定时器句柄、缓存、防抖标记。
     * 非组件实例 scope 为 null。
     */
    _locals: Record<string, any> | null;
    /** 本作用域持有的 watcher（destroy 时统一 off） */
    watchers: Watcher[];
    /**
     * 编译期错误收集（ADR-0118 决策 1）：指令 created/compile 抛错、绑定表达式首次求值抛错
     * 收集于此（只当前 scope 不含后代）。生命周期：compile() 开头清空 → 结束 `Object.freeze`
     * → destroy 随 scope 回收。纯属性暴露，供调试/开发工具消费。
     */
    errors: ScopeErrorEntry[];
    /** 本作用域 watch 注册的 update 闭包（refresh 时同步重跑，destroy 时清空）。
     *  用途见 refresh()：x-for 复用项 locals 原地更新后，驱动项内绑定重新求值并 patch。 */
    private _updates;
    /** 子作用域集合（x-if 子树、x-for 各项），destroy 时递归清理 */
    children: Set<AutoSparkScope>;
    parent: AutoSparkScope | null;
    constructor(engine: AutoSpark, el: HTMLElement, template: HTMLElement);
    get el(): HTMLElement | undefined;
    get template(): HTMLElement | undefined;
    /**
     * 访问全局状态（ADR-0057 更名自 `state`——全局树明确通道，与组件自有 data 域区分）
     */
    get globalState(): import("autospark").AutoSparkState<Record<string, any>>;
    /**
     * 注册子作用域（x-if/x-for 编译子模板时调用）。
     * 建立父子关系，使父作用域 destroy 时能递归清理子树全部 watcher。
     */
    addChild(child: AutoSparkScope): AutoSparkScope;
    /**
     * x-for 注入的局部数据（item/index 等循环派生变量）。
     *
     * 由 compiler 在编译期设置，子作用域继承父的 locals（嵌套 x-for 内层取外层 item）。
     * **进聚合视图**（getContext 第一优先级 locals > data），故模板表达式 `x-text="item.name"` 可见。
     * 普通对象、非响应式（x-for 复用项时原地 Object.assign + scope.refresh 驱动重渲染）。
     *
     * 原名 `localData`（ADR-0022 决策二-3 (10) 更名），与新 `_locals`（组件私有局部变量，不进聚合视图）区分。
     */
    locals: Record<string, any> | null;
    /**
     * 本作用域局部事件 action（由 `<script type="autospark/actions">` 在编译期注入）。
     *
     * 值恒为规范化后的 ActionDesc 描述符（ADR-0036：含 name/title/icon/handle），执行取
     * `.handle(...)`。与 locals/data 同级参与 getAction 的 parent 链查找（子覆盖父，命中即止）；
     * scope destroy 时随 scope 对象回收，无需手动清理。null 表示本层无局部 action。
     */
    actions: Record<string, AutoSparkAction> | null;
    /**
     * 组件实例的生命周期钩子（ADR-0022 决策三）。
     *
     * 仅组件实例 scope 持有（x-component 实例化时从 ComponentDef.hooks 克隆而来）；普通 scope 为 null。
     * 四阶段：created（compile 前）/ mounted（compile 后）/ beforeUnmount（destroy 开头，watcher 仍活）/
     * unmounted（destroy 结尾）。由 compileChild 实例化流程与 scope.destroy 分别触发（`_runHooks`）。
     * 每个 phase 是函数数组（多个 `<script setup>` 同名 hook 串行合并），单个失败 try-catch 不阻断其余。
     */
    hooks: ComponentHooks | null;
    /**
     * 是否为组件实例 scope（ADR-0022 决策二）。
     *
     * 组件本质上是一个特殊 scope——由 x-component 实例化时（compileChild 传入 componentDef）置 true。
     * 区别于普通 scope（x-for 项 / x-if 子树 / x-data 块等）：组件实例持有 data（合并 data() + props）、
     * methods（scope.actions）、hooks（四阶段生命周期）。供内部判定与调试观察。普通 scope 恒 false。
     */
    isComponent: boolean;
    /**
     * 组件实例化的组件名（ADR-0022 决策五-递归保护）。
     *
     * 仅组件实例 scope 有值（compileChild 传 componentDef 时取 def.name）；普通 scope 为 null。
     * 供 x-component 的递归深度统计：沿 parent 链统计同名组件实例化深度，防无限递归（T5=A）。
     */
    componentName: string | null;
    /**
     * x-define 收集的命名组件冻结快照（ADR-0022 承接 ADR-0021；指令名 ADR-0054）。
     *
     * compiler 前置 transformer 命中 `x-define` 元素时，将其**深克隆副本**（保留指令属性、未编译；
     * `<script setup>`/`<style>` 已在收集期提取并移除）按名存入**最近祖先 scope** 的本字段，
     * 并把原元素从渲染树摘除。key 为组件名（无值 `x-define` 取 `default`）；value 为冻结快照 HTMLElement。
     *
     * **`default` 唯一性已放宽**（ADR-0022 决策四-4）：同名组件直接归属同一 scope 时 warn + 后者覆盖
     * （不再抛错）；沿 parent 链允许就近覆盖（内层遮蔽外层）。其他组件名自由、可多 scope 同名。
     *
     * 消费者（x-loading/x-empty/x-error…）经 `getComponentDeclaration(name)` 沿 parent 链就近取用
     * （到顶兜底全局组件），命中则替换默认 UI，未命中回退默认实现（组件兜底）。
     * 本字段**仅在收集到组件时才创建**，多数 scope 无组件 → null，避免给每个 scope 平白分配空对象（YAGNI）。
     */
    components: Record<string, HTMLElement> | null;
    /**
     * 图标域名字表（ADR-0058）：x-icons 声明收集产物——图标名 → 声明令牌条目。
     * 后代 x-icon 沿 parent 链就近查找（内层遮蔽外层），到顶兜底全局注册表（与 getComponentDeclaration
     * 同构）。多数 scope 无声明 → null（同 components，YAGNI）；销毁时随 iconTokens 回收。
     */
    icons: Map<string, ScopeIconEntry> | null;
    /**
     * 本 scope 收集过的声明令牌集（ADR-0058 决策 4）：destroy 时逐令牌引用计数——归零摘除
     * 该组局部 symbol（同一声明源被多 scope/克隆共享，克隆不放大）。全局 symbol 不清理。
     */
    iconTokens: Set<string> | null;
    /**
     * x-for 分页状态的只读快照（ADR-0042 分页状态读取器）。
     *
     * 仅 x-for.paging 的容器 scope 持有：For 指令在分页状态每次变化时整体重建（Object.freeze），
     * 供 JS/action 读取（如 `engine.findScopeByEl(el).paging!.page`）。不注入 state.$scopes、
     * 不进聚合视图——模板内读取走 `$*` 分页变量，跨作用域共享走 `:data-paging` 绑定，三通道职责正交。
     * 多数 scope 无分页 → null（同 components，YAGNI）；随 scope 对象回收，无需手动清理。
     */
    paging: AutoSparkPagingSnapshot | null;
    /** 是否已销毁（destroy 幂等守卫；供覆盖物实例等外部资源判定级联死亡，ADR-0052） */
    destroyed: boolean;
    /**
     * 数据边界标志（ADR-0053 组件数据边界）：true = 本 scope 是**封闭组件实例 scope**。
     * 数据视图（getContext）与局部数据探测（hasLocalContext）的 parent 链上溯在本 scope
     * 止步——之上直接回退 `engine.state`（全局态可见，祖先 scope 的局部数据域不可见）。
     * 本 scope 自身的 locals/_data 仍在边界内（组件自己的数据域）。
     * 仅 x-component 实例化且解析链结论为封闭时设置（instantiateComponent），overlay 等路径不受影响。
     */
    dataBoundary: boolean;
    /**
     * declarer 基准的数据视图挂链目标（ADR-0053）：组件**声明处** scope。
     * 设置后本 scope 及子树的数据视图转道声明链（getContext 的 parentView 取声明 scope 的
     * 聚合视图、hasLocalContext 与 x-data 相对挂载同步转道），与结构 parent 链（消费处）解耦。
     * 声明 scope 销毁后降级为封闭行为（悬空守卫，warn 一次）。与 dataBoundary 互斥设置。
     */
    declarerDataScope: AutoSparkScope | null;
    /** declarer 悬空降级的 warn 一次标志（ADR-0053） */
    private _declarerDangleWarned;
    /**
     * 插槽内容 map（ADR-0056）：组件宿主/实例 scope 持有，出口 SlotDirective 沿 parent 链就近查找。
     *
     * 由 component/overlay 的 `_instantiate` 懒收集后 stash；嵌套组件各持独立 map。
     * null = 本 scope 无插槽内容（继续沿链查找）。
     */
    slotContents: Map<string, SlotContent> | null;
    /**
     * 插槽转发声明（ADR-0125）：x-component 消费内层组件时解析 `x-component-options.slots`
     * 的静态清单，stash 于被消费组件的实例 scope（出口查找链上的持有者）。出口 SlotDirective
     * 查找时按声明翻译名字（显式映射优先、`*` 通配原名）逐级接力上溯。
     * null = 无转发声明——「首持有者即停」防穿透不变式对未声明名字 100% 保留。
     */
    slotForwarding: SlotForwarding | null;
    /**
     * 组件实例的 def 引用（injectComponentSemantics 置位）：供插槽转发 warn 纪律等反查
     * def 级元信息（如声明方 def.slots，ADR-0125）。非组件实例 scope 为 null。
     */
    componentDef: ComponentDef | null;
    /**
     * `$slots` 插槽注册表（ADR-0107）：组件实例域保留键——本实例收到的全部插槽内容段
     * 的只读冻结快照（`Record<名, { name }>`，default 段在内）。
     *
     * 组件实例化 stash 点同步构建（instantiateComponent / instantiateDetachedComponent，
     * 恒注入——无内容为冻结空对象）；经 getContext 聚合视图最高优先级注入（不被
     * locals/data 遮蔽），set 拦截只读。非组件实例 scope 为 null（`$slots` 沿链上溯）。
     */
    slotsRegistry: SlotRegistry | null;
    /** `$slots` 写入的 warn 一次标志（ADR-0107 只读保留键） */
    private _slotsWriteWarned;
    /**
     * 插槽内容的调用方视图基准（ADR-0056 决策四）：内容 scope 的 `parent` 挂此，
     * `getContext` 经 `isSlotContent` → `getCallerContext` 取调用方视图。
     *
     * x-component = 宿主 scope 自身；overlay = x-dialog 消费者 binding。
     */
    slotCallerScope: AutoSparkScope | null;
    /**
     * 是否为插槽内容 scope（ADR-0056 决策四）：内容在**调用方作用域链**求值，
     * 不受 ADR-0053 组件封闭边界约束。`getContext` 的 parentView 改走
     * `parent.getCallerContext()`（跳过组件 `_data`/边界，保留调用方 locals）。
     */
    isSlotContent: boolean;
    /**
     * super 句柄（ADR-0084）：插槽内容 scope 由出口 SlotDirective 编译内容时注入，
     * 内容子树内的 x-super 标记沿 parent 链就近查找（`findSuperInlet`）。
     *
     * 三态：函数 = 命中（惰性编译本段 fallback）；`null` = 组件实例边界**遮蔽**
     * （instantiateComponent/Detached 置位——嵌套组件模板不得沿链读到外层内容通道的
     * 句柄）；`undefined` = 未设置（继续上溯）。判空用**值比较**（`!== undefined`）
     * 而非自有键——TS 可选字段会被转译器物化为 `defineProperty undefined` 自有键，
     * hasOwnProperty 无法区分「未设置」与「物化」。
     */
    superInlet?: SuperInlet | null;
    /** 缓存的聚合视图（命中优先级：locals > data > parent 链 > engine.state） */
    private _scopeView;
    /** 缓存的调用方视图（getCallerContext，组件/边界/declarer 三态；普通 scope 直接复用 getContext） */
    private _callerView;
    /**
     * 当前作用域上下文：沿 parent 链逐层查找（自身 locals 优先，命中不到查父级，直至根 engine.state）。
     *
     * 之所以用 parent 链而非共享栈：watchExpression 把返回的 scope 捕获进闭包，
     * 在 scheduler flush 时跨 tick 异步复用——每层视图必须不可变且互相独立，
     * 不能用 createStackedContext 那种共享可变 push/pop 栈（会在 pop / 兄弟项覆盖后丢值）。
     * 这让嵌套 x-for 内层能解析外层注入的变量（如内层 `row.title` 取到外层 row）。
     */
    getContext(): Record<string, any>;
    /**
     * 失效缓存的 `_scopeView`，下次 `getContext()` 重建。
     *
     * 供 `engine.data(el, data)` 在"data 从无到有"（el 原无 x-data，新建私有数据域）后调用——
     * `_scopeView` 是懒缓存（首次构建后冻结），data 新建后旧缓存不含 data 层，须失效重建，
     * 否则子树经 parent 链读不到新数据。
     */
    invalidateScopeView(): void;
    /**
     * 调用方视图（ADR-0056 决策四）：插槽内容经 `parent.getCallerContext()` 取此视图。
     *
     * - 本 scope 为组件实例 / 封闭边界 / declarer 基准三态：返回 **结构 parent 的聚合视图 +
     *   自身 `locals` 覆盖**（跳过 `_data` 与边界——调用方不应看到组件数据域，也不受封闭约束）；
     * - 普通 scope：直接 `getContext()`（调用方视图 = 其正常聚合视图）。
     *
     * 结果懒缓存于 `_callerView`（`invalidateScopeView` 一并失效）。
     */
    getCallerContext(): Record<string, any>;
    /**
     * 本 scope 或任意祖先是否持有局部数据（`locals` 或 `data`）。
     *
     * 决定 `watch` / `read` 的支路选择：只要有任意一层局部数据，简单路径也可能解析到局部变量
     * （如 x-data 注入的 `a`、x-for 的 `item`），**必须走表达式支路**经 `getContext` 求值，
     * 不能直读 `store.state`（否则 data 中的键被绕过、读到 undefined）。
     *
     * 仅在订阅/读取时调用一次（非每次更新），沿 parent 链 O(深度) 扫描，开销可忽略。
     *
     * **插槽内容特例（ADR-0056）**：`isSlotContent` scope 自身 locals（形参）查后，
     * 父级按**调用方视角**（`getCallerContext` 同构）探测——组件 `_data`/封闭边界不计入，
     * 否则封闭组件下内容的简单路径会误走 `store.state` 直读。
     */
    private hasLocalContext;
    /**
     * declarer 悬空降级的 warn（ADR-0053）：本 scope 只 warn 一次，防高频求值刷屏。
     */
    private _warnDeclarerDangle;
    /**
     * 沿 parent 链查找事件 action（局部 `<script type="autospark/actions">` → 全局 engine.actions → 插件全局表）。
     *
     * 查找顺序：本 scope.actions → 各祖先 actions → engine.actions（终点）→ 插件全局表
     * `AutoSpark.actions`（ADR-0111 决策 5 查询期委托兜底；命中经**本 engine** 惰性物化——
     * 规范化包装绑定触发 engine 的总线与生命周期广播，this 上下文即触发处实例）。
     * 子 scope 同名 action 覆盖祖先（命中即止）。供 OnDirective 求值器（Action 优先策略）使用。
     * 返回 ActionDesc 描述符（ADR-0036），执行取 `.handle(...)`。
     */
    getAction(name: string): AutoSparkAction | undefined;
    /**
     * 沿 parent 链查找最近的 x-data 私有响应式域（`data`）。
     *
     * 供 AutoSparkActionContext 经 `this.scope.getData()` 使用：action 无论挂在 x-data 元素本身
     * 还是其后代，均可拿到"当前所在 x-data 块"的可读可写响应式代理——区别于 `getContext`
     * 返回的只读聚合视图（写已有键会抛 TypeError）。整条链均无 x-data 时返回 null。
     *
     * data 引用恒定（DataDirective 铁律：永不整体替换 `$scopes[id]`），无需缓存；
     * 每次调用沿链 O(深度) 查找，开销可忽略。
     */
    getData(): Record<string, any> | null;
    /**
     * 沿 parent 链就近查找命名组件**声明**，到顶兜底全局组件（ADR-0022 决策五，承接 ADR-0021 决策 5/9；
     * 原名 `getComponent`，ADR-0080 更名——短名让位给实例读取 `engine.getComponent(el)`）。
     *
     * 消费者协议的核心查找：从本 scope 起，向上取首个含该名 component 的祖先 scope，
     * 命中即止（就近覆盖语义——内层 scope 的同名组件遮蔽外层、亦遮蔽全局）。scope 链无命中时
     * 兜底查全局组件双注册位（`options.components` > `options.builtinComponents`，ADR-0094，
     * 字符串入参懒预编译缓存），由 `engine._resolveGlobalComponent` 解析/包装/缓存。整条链
     * （含全局）无命中返回 undefined，由消费者回退其默认实现（组件兜底）。
     *
     * 与 `getAction`/`getData` 的 parent 链查找范式同构（getAction 末端亦兜底 engine.actions）。
     * 供 x-loading 等 Compile/Hybrid 消费指令经 `this.binding.getComponentDeclaration(name)` 使用；
     * Runtime 指令（无 binding）改用 `engine.getComponentDeclaration(name, el)`（经 el 反查 scope 后
     * 委托本方法，反查失败退纯全局）。查**实例**（实例化后的组件）不经本方法，用 `engine.getComponent(el)`。
     *
     * @param name 组件名（消费者约定名，如 `loading`/`empty`/`error`；自由命名）
     * @returns 组件冻结快照 HTMLElement（未编译、保留指令属性），或 undefined（未命中）
     */
    getComponentDeclaration(name: string): HTMLElement | undefined;
    /**
     * 沿 parent 链查找组件内部 method（ADR-0022 决策二-3 修订），**以组件实例 scope 为边界**。
     *
     * 查找规则：从本 scope 向上，每遇到 `isComponent` 的祖先 scope 查其 `methods`（命中即止）；
     * 若该祖先（非起点）是组件实例且未命中，**停止**——不穿透到更上层父组件，保证封装。
     *
     * 两种情形统一处理：
     * - 组件 A 内部元素调 method（button scope → A 实例 scope）：命中 A.methods ✓
     * - 子组件 B 内部元素调 method（B 内 button → B 实例 scope）：查 B.methods，未命中即止，
     *   不穿透到父组件 A ✗（封装保证——否则同组件在不同父内行为不同，不可移植）
     *
     * 与 `getAction`（无边界、兜底 engine.actions）的区别：action 是跨组件复用的事件处理器
     * （类比事件冒泡找 handler）；method 是组件私有方法（类比 class method 不穿透实例边界）。
     *
     * @param name method 名
     * @returns 命中的 method 函数，或 undefined（本组件边界内无此 method）
     */
    getMethod(name: string): ((...args: any[]) => any) | undefined;
    /**
     * 沿 parent 链查找 method 命中的**所属 scope**（与 `getMethod` 同边界逻辑，但返回 scope 而非函数）。
     *
     * 供 `getMethodThis` 的 Proxy get 陷阱：method 必须以其所属组件实例的 Proxy 为 this，
     * 故需定位 method 所属 scope，再用它的 `getMethodThis()`。组件边界规则同 `getMethod`
     * （遇 isComponent 祖先查完即止，不穿透父组件）。
     *
     * @param name method 名
     * @returns 命中 method 的 scope（其 `.methods[name]` 存在），或 undefined
     */
    private _findMethodOwner;
    /**
     * method/钩子执行时的 this 代理（ADR-0022 决策二-3 修订，策略 C；ADR-0057 数据模型 v2）。
     *
     * 懒构造、缓存的 Proxy（每 scope 一个）。Proxy get 陷阱暴露集合（白名单）：
     * - `data` → getContext() 聚合视图（响应式、可读可写）
     * - `props` → `data` 的完全等价别名（同一聚合视图引用；props 注入键位于聚合自有层）
     * - `globalState` → engine.state（全局树明确通道，无聚合遮蔽；更名自 `state`）
     * - `engine` → engine 实例
     * - `scope` → 本 scope 实例
     * - `el` → 组件根元素（scope.el）
     * - `<method名>` → getMethod 命中（组件边界，支持 `this.inc()`/`this.other()` 直调互调）
     * - `watch`/`read`/`getComponentDeclaration` → scope 同名方法（bind scope）
     * - `$parent` → 父组件实例的 Proxy（沿链最近 isComponent 祖先的 getMethodThis()，链式向上；无则 null）
     * - `super` → 继承链父方法视图（ADR-0082：当前执行方法**声明层**的下一层方法集；非继承组件 undefined）
     * - 其余 → scope 原生（bind scope，让用户也能用 scope 其他能力）
     *
     * set 陷阱：框架引用键（data/props/globalState/engine/scope/el）禁止整体覆盖（warn + 忽略）；
     * 字段写入（`this.data.x = v`）透传到聚合视图。
     *
     * 引擎内部代码用真实 scope（`this` = scope 实例），不经此 Proxy——故 method 名与 scope 原生
     * 方法同名时用户 method 胜出（仅影响用户代码），不破坏引擎内部。
     */
    private _methodThis;
    /** super 引用层表（ADR-0082）：[自身声明层 → 链根]，仅继承组件携带（initSuperLayers 注入） */
    private _superLayers;
    /** 当前执行方法的声明层号（super 词法解析基准；方法置层包装器置位、finally 还原） */
    private _superDepth;
    /** 按层号缓存的 super 视图（成员为置层包装函数） */
    private _superViews;
    /** 链根越界（super 之上无层）的空视图回退 */
    private static readonly _EMPTY_SUPER_VIEW;
    getMethodThis(): any;
    /**
     * 沿 parent 链找最近的 `isComponent` 祖先，返回其 Proxy this（`$parent` 实现）。
     * 无父组件（已是顶层组件）返回 null。
     */
    private _parentComponentProxy;
    /**
     * super 引用初始化（ADR-0082）：`injectComponentSemantics` 注入层表时调用——挂层表并为
     * 合并视图（`scope.methods`，已按实例克隆）上的每个方法装「置层」包装器（层表 findIndex
     * 定声明层）。**所有入口**（代理互调 / `@click` / super 调用 / 引擎直调）统一经包装器，
     * 这是 super 精确词法解析的唯一保证——父方法体内 `this.super` 解析到**其声明层**的下一层。
     */
    initSuperLayers(layers: Array<Record<string, (...args: any[]) => any>>): void;
    /**
     * super 视图（ADR-0082）：`this.super`（method this 代理）与门面 `instance.super` 的共同
     * 读取入口——**当前声明层 + 1** 的方法集。方法执行栈外（门面调用 / hooks）当前层恒 0，
     * 即直接父。非继承组件返回 undefined；越界（链根之上）返回冻结空对象。
     */
    getSuperView(): any;
    /** 置层包装：调用前置当前声明层、finally 还原（异常路径也回栈）；this 恒绑本实例代理 */
    private _wrapSuperMethod;
    /** 按层号取（并缓存冻结）super 视图；越界返回冻结空对象（成员访问 undefined） */
    private _superViewAt;
    /**
     * 沿 parent 链就近查找 super 句柄（ADR-0084）：内容子树内 x-super 标记的触发通道。
     *
     * 沿链首个**值非 undefined** 的 `superInlet` 定论（函数命中 / null 遮蔽即止），
     * undefined 继续上溯（含字段物化形态）；全链未设置返回 null（插槽内容之外，调用方 warn）。
     * 组件实例边界由实例化管道显式遮蔽（置 null），嵌套组件模板内的 x-super 不穿透。
     */
    findSuperInlet(): SuperInlet | null;
    /**
     * 创建指令实例（按优先级降序排列，大的先执行）。
     */
    private _createDirectives;
    /**
     * 订阅状态变化。双轨：
     *
     * - **路径支路**（`isStatePath` 为真，如 `user.name`）→ `store.watch(path)` 精准订阅，最快；
     * - **表达式支路**（如 `a + b`、x-for 内的 `item.name`）→ `collectDependencies` 自动收集读依赖后订阅。
     *
     * **为何表达式不走 `computedObjects.create`**：core 强制该 API 的 scope 只能是根/绝对路径，
     * 无法注入 x-for 的局部 `item`（见 core `computed/computedObjects.ts`）。
     * 故在此用 `store.collectDependencies` + `store.watch(deps)` 自建，与 core 的 `SyncComputedObject` 同构。
     *
     * 两条支路都把回调经 `engine.scheduler` 微任务合并：watcher 仅"标脏"，
     * flush 时重新求值并 patch——同 tick 多次变更只更新一次。
     *
     * @returns 当前值（供指令 `compile` 初始渲染）
     */
    watch(value: string, listener: ScopeWatchListener, options?: ScopeWatchOptions): any;
    /**
     * 路径支路：精准订阅指定路径（支持 core 通配符，如 `items.*` 单层、`items.**` 递归）。
     *
     * - 纯路径走 `store.watch(path)` 精准订阅，最快；
     * - path 含通配符时，`read()` 返回值无意义（getVal 取不到通配段），调用方应忽略返回值、
     *   仅依赖回调触发（如 x-for 监听 `items.*` 仅用于触发 render）。
     *
     * 公开供 x-for 等指令订阅通配路径——`scope.watch` 对含 `*` 的路径会误判为表达式走
     * `with` 求值（`with(scope){return items.*}` 语法错），故通配须绕开表达式支路直连此处。
     *
     * `options` 透传给 `store.watch`（如 `depth` 后代钻取深度，供属性展开订阅对象内部键变更，ADR-0043）。
     */
    watchPath(path: string, listener: ScopeWatchListener, options?: ScopeWatchOptions): any;
    /**
     * 调用方视图是否把该简单路径解析到 **store 根**（ADR-0108 传递绑定的订阅路由）。
     *
     * 调用方 x-data 局部变量挂在 `$scopes.<id>` 下——读代理收集到的依赖路径会带 `$scopes.<id>`
     * 前缀；依赖恰为该路径本身即说明未被局部域遮蔽，可退回 {@link watchPath} 精准订阅，
     * 使 `depth` 的键级响应（对象键删除、后代修改）与既有语义一致。
     *
     * 读不到（未定义）或形态不认时返回 false → 交表达式支路（宽松求值 + 精确路径订阅）。
     */
    private _callerViewIsStorePath;
    /**
     * 表达式支路：collectDependencies 自建。
     *
     * 1. `new Function` 把表达式编译为带 `scope` 形参的 getter；
     * 2. 在聚合作用域上求值一次，期间由 `collectDependencies` 收集读依赖；
     * 3. 用收集到的依赖路径订阅，回调仅标脏，flush 时重新求值。
     *
     * **宽松求值**：getter 抛错（如引用了不存在的局部变量 `a`、x-data 键被运行时删除）时，
     * 记日志并返回 `undefined`——与路径支路读不到键返回 `undefined` 行为一致，避免单个坏表达式
     * 中断整个编译/刷新。`collectDependencies` 用同一安全包装：抛错前已读到的依赖仍被收集。
     */
    private watchExpression;
    /**
     * 同步重跑本作用域注册的全部 update 闭包，并递归刷新所有子作用域。
     *
     * 用途：x-for 复用项时，项内 locals 字段（item / $index / $end 等）已原地更新，
     * 需让项内全部绑定（含 `$end` 这类订阅为空、store 不会自动触发的 watcher）重新求值并 patch DOM。
     *
     * 同步直跑、不进 scheduler：render 自身已在 scheduler flush 内执行，update 闭包内的 listener
     * 直接 patch DOM，避免双重调度；同步也保证 render 返回时 DOM 已是最新。
     *
     * 递归 children 覆盖项内嵌套 x-for（触发其 render）、eager x-if 子树、x-text 等所有子绑定。
     * 已 destroy 的子作用域已从 children 移除，自然跳过。
     */
    refresh(): void;
    /**
     * 读取表达式/路径的当前值（不建立订阅）。
     *
     * 供 x-for 等"已在 `created` 自行订阅、仅需在回调中重读最新值"的指令使用。
     * 求值方式与 `watch` 保持一致：纯路径走 `getVal`，否则走 `with(scope)` 表达式求值
     * （使 `items.filter(x => x.active)` 这类表达式能取到经筛选/映射后的数组，
     * 而非被 `getVal` 当作点分路径读成 undefined）。
     *
     * @returns 表达式当前值；求值异常时记录日志并返回 undefined（由调用方做数组化等兜底）
     */
    read(value: string): any;
    /**
     * 写回落点解析（ADR-0075 读写对称）：把简单路径的写入**经 getContext 聚合视图透传**——
     * 单段路径直接赋值（Proxy set 陷阱就近命中：本层 locals > x-data 域 > 沿父视图链，
     * 边界/基准语义由视图已有的实现承担），全链未命中等价落 store 根（与旧直写行为兼容）。
     * 多段路径首键命中域时取**域内成员对象**对余段 setVal（写入留域内），否则落根 setVal
     * （保持旧「根上自动建中间节点」语义）。
     *
     * 修复 x-model / x-resizable / x-splitter 等指令「读局部、写全局」的基准分裂：
     * 读方向经 `watch` 表达式支路命中域、写方向直写根——现在同走聚合视图，读写同源。
     *
     * 仅供指令的写回快通道使用（须简单路径）；调用方持有的 flags/等值短路等防循环簿记不变。
     */
    writeThrough(path: string, value: any): void;
    /**
     * 编译：依次执行指令的 `created`（建立订阅）→ `compile`（初始渲染）。
     *
     * `created` 必须先于 `compile` 执行——`watch` 在 created 中建立，
     * 随后 compile 用 `watch` 返回的当前值做首次 DOM 写入。
     */
    compile(): void;
    /**
     * 串行执行某阶段的组件生命周期钩子（ADR-0022 决策三 + 决策二-3 修订）。
     *
     * 每个 hook 用 `getMethodThis()` 返回的 **Proxy** 作 this（与 method 的 this 完全统一：
     * data=getContext 视图、state、engine、scope、method 名直调、$parent 等）。单个 hook 抛错
     * try-catch 记 error 不阻断后续 hook（容错）。hooks 为 null（非组件 scope）或该阶段无 hook
     * 时静默无副作用。
     */
    private _runHooks;
    /**
     * 串行执行指令生命周期：先全部 created，再全部 compile。
     * 同一阶段的指令按优先级顺序（已由 `_createDirectives` 排好）。
     *
     * **容错收集**（ADR-0118 决策 1）：单条指令 created/compile 抛错不再中断整个编译——
     * 收集进 `scope.errors` + logger.error 后继续后续指令（编译失败半成品树仍尽量呈现）。
     * 抛错的阶段不广播对应生命周期事件（created 失败即未 created）。
     */
    runDirectives(directives: AutoSparkDirectiveBase[]): void;
    /**
     * 销毁：先从父级脱离，再递归销毁子作用域（子树 watcher 批量 off），
     * 然后 off 自身 watcher，最后触发各指令的 destroy 钩子。
     */
    destroy(): void;
}
