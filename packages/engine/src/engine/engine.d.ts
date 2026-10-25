import type { AutoSparkEvents, AutoSparkMeta, AutoSparkOptions, AutoSparkPatchContent, AutoSparkPatchOptions, AutoSparkState } from "../types";
import type { ComponentDef } from "../features/component/component-def";
import { DirectiveManager } from "../features/directive/manager";
import type { DirectiveSpec } from "../features/directive/global-queue";
import { AutoSparkDirectiveBase } from "../features/directive/base";
import { AutoSparkCompiler } from "./compile/compiler";
import { AutoStore, FastEvent } from "autostore";
import type { AutoSparkScope } from "./scope";
import { UpdateScheduler } from "./scheduler";
import { RuntimeObserverDispatcher } from "../features/directive/runtime/dispatcher";
import { ActionManager } from "../features/action/manager";
import type { ActionDecl, AutoSparkAction } from "../features/action/types";
import { AutoSparkAnimator } from "../features/animate/animate";
import { type IconRegistry } from "../features/icons/registry";
import { OverlayHandle } from "../features/overlay/handle";
import { TooltipManager } from "../features/tooltip/manager";
import type { TooltipAPI } from "../features/tooltip/types";
import { ViewportManager } from "../features/viewport/manager";
import { ComponentInstance } from "../features/component/component-instance";
export { SCOPES_KEY } from "../consts";
/**
 * AutoSpark——全功能的响应式前端应用引擎核心类
 *
 * 以外部传入的 `AutoStore` 实例为响应式数据源，编译声明式模板并挂载到 DOM；
 * 状态变化时由各指令自行订阅、经 `scheduler` 微任务合并后做细粒度 patch。
 *
 * 生命周期：`compile`(编译挂载) → `stop`/`start`(暂停/恢复) → `destroy`(彻底清理)。
 *
 * @example
 * ```html
 * <div id="app">
 *   <span x-text="user.name"></span>
 * </div>
 * ```
 *
 * ```typescript
 * const app = new AutoSpark(document.getElementById("app")!, { user: { name: "zhang" } });
 * // 改 state 即自动更新 DOM
 * app.state.user.name = "li";
 * app.destroy();
 * ```
 */
export declare class AutoSpark<State extends Record<string, any> = Record<string, any>> extends FastEvent.FastLiteEvent<AutoSparkEvents> {
    /**
     * 全局图标注册表（ADR-0046/0047）：document 级单例，多 engine 共享。
     * `add(name, svg)` 注册（同名覆盖 + warn 去重）、`delete(name)` 移除（不存在静默 false）、
     * 遍历产出名称字符串；`baseUrl` 为远程图标协议基址（`baseUrl/<图标集>/<图标名>.svg`，
     * 默认 Iconify 公共 API，不限于 Iconify——任何兼容服务可自托管）。
     * 声明入口三通道：模板 `x-icons.global`（ADR-0058）/ 本表编程注册 / 构造 `options.icons` 种子。
     */
    static readonly icons: IconRegistry;
    /**
     * 插件全局组件声明表（ADR-0111 决策 5）：名字 → 模板字符串，**跨 engine 真全局**
     * （对照：`options.components` 是 engine 级注册位）。engine 查找链到顶查询期委托兜底
     * 查本表：`scope 局部 → options.components → 本表 → builtinComponents`；晚注册天然
     * 立即生效（无复制、无广播），命中时惰性预编译入全局 def 缓存（每组件名全局只编译
     * 一次，多 engine 共享编译产物）。同名后注册覆盖先注册。
     */
    static readonly components: Record<string, string>;
    /**
     * 插件全局 action 声明表（ADR-0111 决策 5）：声明形态（函数简写 | 对象写法），
     * **跨 engine 真全局**（对照：`options.actions` / `engine.actions` 是 engine 级）。
     * scope `getAction` 链末端兜底查本表：`scope 局部 script → engine → 本表`；命中即经
     * **触发 engine** 惰性物化（规范化 + buildAction 包装绑定本 engine 的总线与生命周期
     * 广播）——同一声明在多实例中各绑定各的触发上下文，声明无状态即可安全共享。
     */
    static readonly actions: Record<string, ActionDecl>;
    /**
     * 注册插件就绪回调（ADR-0111 决策 4，ADR-0114 补第二参）：对**每个 engine 构造完成后**
     * 各调一次（回调收 `(engine, autospark)`，时机 = `engine/ready` 事件发射处）；engine
     * 已存在时注册立即对所有存活 engine 各补调一次（retain 语义）；回调抛错隔离记日志；
     * engine destroy 摘出存活表。script 场景经 IIFE 全局 `AutoSpark.ready(fn)` 取用
     * （`$` 为插件脚本内形参缩写）。
     */
    static ready(fn: (engine: AutoSpark<any>, autospark: typeof AutoSpark) => void): void;
    /**
     * 注册预编译回调（ADR-0116）：对**在其注册之后构造**的每个 engine 各调一次，时机 =
     * 构造开头 el 解析后、template 克隆前——回调对 `engine.el` 的 DOM 预处理（简写
     * transform、默认出口插入等）进模板、随克隆参与首编译。**无 retain**：对已构造的
     * engine 不补调（错过即错过——首编译不可重放，晚注册的预处理无处生效）；回调抛错
     * 隔离记日志。script 场景经 IIFE 全局 `AutoSpark.precompile(fn)` 取用。
     */
    static precompile(fn: (engine: AutoSpark<any>, autospark: typeof AutoSpark) => void): void;
    /**
     * 定义外部指令并**立即加入安装队列**（定义即全局安装，ADR-0111 决策 5/8）——
     * 插件侧指令定义的**唯一入口**，双重载按实参形态分派：
     *
     * - **spec 重载** `$.directive(spec)`：最小键集（`name` 必填 / `kind` / `priority` /
     *   六个实例钩子），造类（继承 `AutoSparkDirectiveBase`）→ 安装器入插件机制的内存队列
     *   → 返回类本身（可组合、可测试）；
     * - **类重载** `$.directive(name, Cls)`：结构指令（`ownsChildren`）、元素名指令
     *   （`elementName`）、类级钩子（`static initialize`/`dispose`）、`singleton` 等超出
     *   spec 键集的高级形态——直接继承基类造类后安装。
     *
     * 两重载同语义：安装器在 engine 构造期被消费（先于首次编译）；晚定义广播全部存活
     * engine（Runtime 即时生效 / Compile 只影响未来编译）；撞名走 `DirectiveManager.install`
     * （撞预设名 warn + 跳过 / 撞自定义名 warn + 覆盖）。
     */
    static directive(spec: DirectiveSpec): typeof AutoSparkDirectiveBase;
    static directive(name: string, Cls: typeof AutoSparkDirectiveBase): void;
    /** 挂载容器（编译产物替换其子节点，容器本身保留） */
    readonly el: HTMLElement;
    /** 响应式数据源：engine 在 `_createStore` 内自建并拥有（destroy 时销毁）。ADR-0044 */
    readonly store: AutoStore<State & {
        $: AutoSparkMeta;
    }>;
    /**
     * engine 自建的默认 configManager（`_createStore` 补缺省时创建）。
     * destroy 时仅销毁此实例；消费者经 `storeOptions.configManager` 传入的不动（所有权对称，ADR-0044）。
     */
    private _ownedConfigManager;
    /**
     * 重写基类 accessor：基类 options 是 getter，子类不得用实例属性遮蔽（TS2610），
     * 故以 getter 重写，返回合并类型（协变兼容基类 FastLiteEventOptions）。
     * 构造完成前 _fullOptions 未就绪时回退 super.options，规避基类构造期虚分派读到 undefined。
     */
    get options(): AutoSparkOptions<State>;
    readonly compiler: AutoSparkCompiler;
    readonly directives: DirectiveManager;
    /** 微任务更新调度器（同 tick 多次变更合并为一次 patch） */
    readonly scheduler: UpdateScheduler;
    /** runtime 指令共享 observer 分发器（ADR-0003 决策 7）：单一 MutationObserver + 事件广播 */
    readonly dispatcher: RuntimeObserverDispatcher;
    /** action 管理单元：全局表注册/包装 + `<script type="autospark/actions">` 模板提取（src/actions/manager.ts） */
    readonly actionsManager: ActionManager;
    /**
     * 进出场动画服务（ADR-0039）：`animate.enter/leave/cancel`。**内部 API，不对消费者文档化**
     * （决策 5）——结构指令（x-if/x-show/x-for/x-switch）经挂点调用；后续 x-teleport/x-loading
     * 等接入免费。内置 fade/slide 样式随构造幂等注入 document.head。
     */
    readonly animate: AutoSparkAnimator;
    /** 全局工具提示管理单元（ADR-0061）：data-tooltip 约定消费面 + title 编译期转换开关；公共入口经 `tooltip` getter */
    readonly tooltipManager: TooltipManager;
    /** 全局视口档位管理单元（ADR-0105）：跨档写 `state.$.viewport` + 根元素 `data-viewport`；`options.viewport: false` 时整体短路 */
    readonly viewport: ViewportManager;
    /** 原始模板（深克隆根元素，保留指令属性作为编译只读输入） */
    readonly template: HTMLElement;
    /** 每个渲染元素对应的 Scope（销毁时遍历清理其 watcher） */
    readonly scopes: Map<WeakRef<Node>, AutoSparkScope>;
    /**
     * 整个 engine 响应式数据驱动的核心：直接暴露 `store.state`（响应式根状态）。
     * 作为 scope 聚合视图（getContext）的根 fallback、模板表达式求值的最终数据源。
     *
     * 顶层保留键 `$`（元状态容器，ADR-0105）已类型化为必选 `AutoSparkMeta`（ADR-0112）——
     * 例外：`options.viewport === false` 或环境无 matchMedia 时容器不注入（类型已知偏差）。
     */
    get state(): AutoSparkState<State>;
    /** 是否已编译并挂载 */
    private pending;
    /**
     * @param el       挂载根元素：HTMLElement 或 CSS 选择器串（如 `"#app"`，经
     *                 `document.querySelector` 解析，取命中的第一个元素）。
     * @param state    裸状态对象：engine 在 `_createStore` 内自建 AutoStore 并拥有、destroy 时销毁（ADR-0044）。
     *                 null/undefined 静默兜成空 store（不抛错，沿用 ADR-0009 决策 5）。
     * @param options  配置选项（`storeOptions` 恒消费，字段级默认见 `_createStore`）
     * @throws {Error} 选择器无命中 / 命中非 HTMLElement；或传入的 el 既非 HTMLElement 亦非串；
     *                 state 为 AutoStore 实例（不再接受借用，ADR-0044）
     */
    constructor(el: HTMLElement | string, state: State, options?: Partial<AutoSparkOptions<State>>);
    /**
     * 自建 store（ADR-0044）：engine 拥有创建权，以换取 configManager / configKey 的确定性——
     * x-bind `@` 配置绑定（ADR-0019）与 x-model 元数据注入（ADR-0020）依赖二者，外部传入的
     * store 上它们不可控（可能缺 cm / 落入全局默认 / configKey 已归一为 store.id）。
     *
     * - 传入 AutoStore 实例：**throw**（不再接受借用；迁移：改传裸状态 + `storeOptions`）。
     * - null/undefined：静默兜成空 store（沿用 ADR-0009 决策 5）。
     * - `storeOptions` 字段级默认（消费者显式传入优先，ADR-0044 三态）：
     *   - `configManager` 为 nullish → 补 `new ConfigManager({ load: () => ({}) })`（内存空 source，
     *     纯响应式 schema 注册表，无持久化、不注册全局）；传对象 = 消费者 cm；传 `false` = 完全关闭
     *     （`@` 绑定走三层降级）。null 视同缺省。
     *   - `configKey` 为 nullish → 补 `''`（fullKey 无前缀，`@` 左侧配置路径与状态路径同形）。
     */
    private _createStore;
    get logger(): AutoStore<any>["logger"];
    /**
     * 全局事件 action 表（来自 options.actions），作为 scope.getAction 查找链的终点。
     *
     * 值恒为 **ActionDesc 描述符**（ADR-0036：三入口写入时全量规范化，id 注入 + handle 包装），
     * 命令式直调取 `.handle(...)`。返回 Proxy：**赋值即自动规范化包装**——`engine.actions.save = decl`
     * （函数简写或对象写法）经规范化（获得 `actions/<name>/*` 生命周期广播）后写入底层
     * options.actions；读取、遍历、getAction 均透明（get 默认转发底层）。故 action 注册即追踪，
     * 无需手动包装。实现委托 actionsManager（src/actions/manager.ts）。
     */
    get actions(): Record<string, AutoSparkAction>;
    /**
     * 插件全局 action 惰性物化（ADR-0111 决策 5）：scope `getAction` 链末端查插件全局表
     * （`AutoSpark.actions`）命中时调用——把声明交给**本 engine** 的 ActionManager 注册
     * （Proxy set trap 规范化 + buildAction 包装，总线与生命周期广播绑定本 engine），返回
     * 物化后的描述符。同一声明在多实例中各绑定各的触发上下文；物化后即入本 engine 的
     * actions 表，后续查找走常规链。非法声明（error 已记）从插件表清除，避免重复报错；
     * 未命中返回 undefined。
     */
    materializePluginAction(name: string): AutoSparkAction | undefined;
    /**
     * 命令式工具提示（ADR-0061 决策 18）：`engine.tooltip.show(el, opts?)` / `hide()`。
     * 与悬停委托同一显示管道（配置解析/延迟/动画/事件全同构）；`opts` 与元素级保留键
     * 同构、单次生效。`options.tooltip: false` 时调用 warn + no-op（全关语义，决策 2）。
     */
    get tooltip(): TooltipAPI;
    /**
     * 全局组件定义表（ADR-0022 承接 ADR-0021 决策 11；ADR-0086 合并双缓存）：
     * key=组件名，value=ComponentDef（快照 + setup/hooks/styles 等元数据同源同次产出）。
     *
     * **单表**（原 `_globalComponentCache` 快照表与 `_globalComponentDefCache` 定义表合并）：
     * 两者同源同生命周期，分表只会带来「快照在、def 不在」的不一致态。快照经
     * {@link getGlobalComponentDef} 取 `def.snapshot` 派生，x-loading 等只需 DOM 的消费者
     * 契约不变（`getComponentDeclaration` 仍返回 HTMLElement）。
     *
     * **两种来源、两种时机**（ADR-0086 决策二）：
     * - 构造选项双注册位字符串（`options.components` > `options.builtinComponents`，ADR-0094）→
     *   **惰性**：首次查找未命中时经 `_resolveGlobalComponent` 预编译入表；
     * - `engine.registerComponent(code)` → **即时**：注册时解析入表。
     * 查找一律「先查表、未命中才读构造选项」——运行时注册因此**天然覆盖**构造期配置，
     * 无需失效缓存、无需把 def 序列化回字符串重解析（ADR-0086 决策三）。
     *
     * 记录 `null` 表示该名已查明未命中（不存在/解析失败），避免重复解析尝试。
     * 生命周期随 engine（destroy 自动回收）。
     */
    private _globalComponentDefs;
    /**
     * 组件定义表（ADR-0022 决策二-1、决策七）：key=组件冻结快照根元素，value=ComponentDef。
     *
     * compiler `_collectComponent` 命中 x-component 时建 def，以快照根为 key 存入此表。
     * `getComponentDeclaration(name)` 返回 HTMLElement 快照（保持 x-loading 等消费者契约不变），x-component 实例化时
     * 经快照根反查本表取 def（setup/hooks/styles/parent/components）。定义 scope 链（嵌套私有子组件）经
     * `def.parent` / `def.components` 表达，与此表正交。WeakMap：scope 回收后 def 自动释放。
     */
    private _componentDefs;
    /**
     * x-import url 缓存（ADR-0022 决策六-3）：key=url，value=解析出的 HTMLElement 根数组
     * （fetched HTML 里的各 `<div x-component>` 顶级元素）。重复引用同一 url 命中缓存，免重复 fetch。
     * 循环 import 检测：fetch 中记录 url 到 `_importingUrls`，命中即 warn + 中断该链。
     */
    private _importUrlCache;
    /** 正在 fetch 的 url 集合（循环 import 检测，ADR-0022 决策六-4） */
    private _importingUrls;
    /**
     * 远程覆盖注册的 warn 去重（ADR-0065 决策三）：同 url 缓存命中重跑注册循环时，
     * 「已有同名组件被覆盖」只警告一次（per 注册目标 per 组件名），避免 loader 多实例场景刷屏。
     * 全局目标用独立 Set；作用域目标 WeakMap（scope 销毁后条目自然释放）。
     */
    private _overrideWarnedScope;
    private _overrideWarnedGlobal;
    /**
     * x-import 作用域导入遇到声明自带 global（ADR-0115 决策 8「声明为准」）的冲突 warn
     * 去重：per 组件名一次（缓存命中重跑注册循环、多个作用域 x-import 重复拉到同一远程文档时
     * 不刷屏）。
     */
    private _declareGlobalWarned;
    /**
     * 确保 store.state[SCOPES_KEY] 存在（x-data 私有响应式域容器）。
     *
     * 1 engine 1 store 约定下由 engine 负责注入：不存在则建空对象（core 自动建响应式代理），
     * 已存在（用户预设/复用）则沿用。仅赋值一次；后续 x-data scope 向其写入 [id] 条目，
     * 永不整体替换该容器（DataDirective 同守"只 Object.assign 进 $scopes[id]、不整体替换"铁律）。
     */
    private _ensureScopesState;
    /**
     * 编译模板并把产物挂载到 `el`。
     *
     * compiler 基于 `template`（只读）重建一棵移除指令属性的新元素树，
     * 随后用 `el.replaceChildren(root)` 替换容器子节点——使产物进入文档，
     * watcher 才能作用在可见 DOM 上。
     */
    compile(): this;
    /**
     * 启动引擎：尚未编译时编译挂载；已启动则幂等返回。
     */
    start(): this;
    /**
     * 停止引擎：移除挂载的 DOM 并标记停止（不销毁订阅，可再次 `start`）。
     */
    stop(): this;
    /**
     * 运行时更新/创建数据（替代已废除的 x-data setAttribute 监听）。
     *
     * `data(el, data)` 合并进 el 对应 scope 的私有响应式域 `$scopes[scope.id]`：
     * - **scope 已有 data**（模板有 x-data）→ `Object.assign` 合并，路径订阅自动驱动更新
     *   （主路径，不动 DOM、不重订阅）。
     * - **scope 无 data**（el 原无 x-data）→ 新建 data + 失效本 scope 视图 + destroy 子树 +
     *   重新编译子树（A 方案：子树 DOM 重建）。因 watcher 的 `collectDependencies` 仅 created 跑一次，
     *   不覆盖新出现的 data，只能重建让子树重新订阅。
     *
     * 不支持 global 模式（x-data.global 仍由模板属性驱动；运行时改全局请直接操作 `store.state`）。
     *
     * @param el   渲染后的元素（须为 engine 注册的 scope.el）
     * @param data 要合并的普通对象（合并语义：只增改、不删已有键）
     */
    data(el: HTMLElement, data: Record<string, any>): void;
    /**
     * 按名查找组件**声明**（ADR-0022 决策五，承接 ADR-0021 决策 5/9；原名 `getComponent`，
     * ADR-0080 更名——短名让位给实例读取）。标准组件链（ADR-0094 签名升级）：
     *
     * - `el` 有值且反查到 scope → scope 链就近 + 全局兜底（协议不变）；
     * - `el` 省略**或反查失败** → 纯全局兜底（`options.components` > `options.builtinComponents`）
     *   ——不在任何 engine 内的元素等价于全局消费者，修复旧签名「反查失败不兜底」的不对称。
     *
     * 查找规则与 `getOverlay` 同构（参数形态不同——后者的 el 是定位锚、语义必需）。
     * 供 **Runtime 指令**（如 x-loading，无 binding/scope）与命令式消费：编译期元素建过 scope
     * 的才能被反查到（el 经 `engine.scopes` WeakRef 遍历 deref 比对，O(n)、低频可接受）。
     * Compile/Hybrid 消费指令应直接用 `this.binding.getComponentDeclaration(name)`，避免 O(n) 遍历。
     *
     * 消费者协议：命中则用组件替换默认 UI，未命中回退默认实现（组件兜底）。详见 ADR-0022。
     *
     * @param name 组件名（消费者约定名，自由命名；内置组件统一 `autospark.` 点前缀，如 "autospark.dialog"/"autospark.error"）
     * @param el   可选范围修饰——消费指令的宿主元素（须建过 scope，否则退纯全局）
     * @returns 组件冻结快照 HTMLElement，或 undefined（链+双注册位均无该名组件）
     */
    getComponentDeclaration(name: string, el?: HTMLElement): HTMLElement | undefined;
    /**
     * 读取组件**实例**（ADR-0080）：自任意元素沿 DOM parent 链向上找**最近的组件实例 scope**
     * （`isComponent`），以 ComponentInstance 门面返回——字段与组件内 `this` 同构
     * （el/name/data/props/globalState/methods/scope），心智一句话：**实例就是组件外的 this**。
     *
     * - **就近即止**：嵌套组件的内部元素返回内层实例；「这个按钮属于哪个组件」的自然问法；
     * - 冒泡对**覆盖物实例**天然无效（覆盖物渲染于 body 容器，触发处 DOM 链不通）——
     *   覆盖物用 `engine.getOverlay(el, name)` → OverlayHandle；
     * - 实现沿 parent 逐层 `findScopeByEl`（O(深度 × scope 总数)），页面脚本低频调用可接受；
     *   engine 边界天然不越——`findScopeByEl` 只查本 `engine.scopes`，x-isolate 子引擎查不到即止步。
     *
     * 不缓存实例列表（引擎无实例注册表），每次调用现算返回新门面对象。
     *
     * @param el 任意元素（通常是组件内某元素或 x-component 宿主自身）
     * @returns 最近组件实例的门面，或 undefined（el 在任何组件实例之外 / 不属于本 engine）
     */
    getComponent(el: HTMLElement): ComponentInstance | undefined;
    /**
     * 全局组件兜底解析（ADR-0022 承接 ADR-0021 决策 9/10/11；ADR-0111 扩展三层声明源）：
     * `scope.getComponentDeclaration` 到顶后委托本方法。
     *
     * 懒预编译：首次访问某全局组件时，把三层声明源（`options.components` > **插件全局表
     * `AutoSpark.components`** > `options.builtinComponents`，ADR-0111 决策 5 扩展 ADR-0094
     * 双注册位）中命中的字符串入参解析为 DOM，按自动包装规则（决策 10）规范化为「恰好一个带
     * `x-define` 的根元素」，存入 `_globalComponentDefs`；后续命中直接返回缓存（消费者自管
     * `cloneNode(true)`）。解析失败 → 记 null 缓存 + 返回 undefined（避免重复编译尝试）；
     * **各声明源均无 → 直接返回 undefined 不缓存**——三层查找 O(1) 可重复，插件表晚注册的
     * 组件对已查询过的名字同样立即生效（ADR-0111 决策 5 查询期委托的核心承诺）。
     *
     * **插件来源的编译产物共享**（ADR-0111 决策 5）：命中插件全局表时，def 额外写入
     * `features/plugin` 的全局缓存——每组件名全局只编译一次，其他 engine（含后建）直接取
     * 共享产物挂账（`registerComponentDef` 的 per-engine 样式注入 / 快照反查照常执行）。
     *
     * **不注入 x-scope**（决策 7 修订：scope 由消费编译路径 compileChild 内禀保证）。
     * **不回写 options.components**（不突变用户输入）。**运行时突变任一注册位不失效缓存**
     * （构造期配置语义，与 actions/sanitizer 等同纪律；插件表晚注册对未查询过的组件名天然生效）。
     * **builtin 标记**：def 构建时按「模板与内置种子表原版逐字相同」写入（命中点级接管判定，
     * 消费者据此分装配路径）。
     *
     * @param name 全局组件名
     * @returns 预编译根元素（未编译、含 x-define），或 undefined（无此全局组件/解析失败）
     */
    _resolveGlobalComponent(name: string): HTMLElement | undefined;
    /**
     * 继承解析的父 def 查找（ADR-0083 全局组件继承）：先触发父名懒预编译（父自身可带
     * inherit——递归展开），再取其 def；未命中返回 null（由 resolveComponentInheritance
     * warn + 拒绝注册）。
     */
    private _globalDefForInherit;
    /** 全局组件是否已有来源（定义表 / 双注册位 / 插件全局表任一命中）——运行时注册的覆盖 warn 判据。
     *  定义表的 null 是「编译过且失败」的缓存标记（懒预编译写入），不算已有来源——
     *  失败产物无有效内容，同名重新注册（含修复插件声明后）不应误报覆盖。 */
    private _hasGlobalComponentSource;
    /**
     * 全局组件快照 + def 组包（ADR-0094——原 `_resolveUiShell` 键映射退役后的剩余职责）：
     * 经全局组件表懒预编译（`_resolveGlobalComponent`——含继承解析与缓存）取快照，反查 def。
     * shell 等需要「快照 + 元数据」双件的包内消费者共用；查找语义即标准链（就近遮蔽、
     * `components` > `builtinComponents` 双注册位回退）。
     *
     * @param name 组件注册名（内置组件为裸键，如 'dialog' / 'popover'）
     * @returns { snapshot, def }，或 null（未命中/解析失败——消费者回退其内置默认）
     */
    _resolveGlobalComponentFull(name: string): {
        snapshot: HTMLElement;
        def: ComponentDef | null;
    } | null;
    /**
     * 全局组件自动包装（ADR-0022 承接 ADR-0021 决策 10；属性名 ADR-0054）：把字符串入参规范化为
     * 「恰好一个带 `x-define` 的根元素」。
     *
     * 规则（仅全局组件字符串入参适用；局部组件入参已是 DOM）：
     * | 输入形态 | 包装结果 |
     * |---|---|
     * | 单顶级元素、无 `x-define` | 根打本 key 名（`x-define="name"`） |
     * | 单顶级元素、**已含** `x-define` | 尊重原值不重命名 |
     * | 多顶级节点 / 元素+文本混排 | 包一层 `<div x-define="name">` |
     * | 纯文本无元素 | 包成 `<div x-define="name">文本` |
     *
     * 包装标签固定 `<div>`（YAGNI，不开放配置）。**不注入 x-scope**（决策 7 修订）。
     *
     * 单根判定复用 `pickSingleRootElement`（与 `registerComponent` 的严格路径同源，ADR-0086——
     * 两套规则只在「不单根时怎么办」分叉：此处包一层、严格路径 warn 拒绝）。
     *
     * @param html  全局组件字符串入参（已 trim 非空）
     * @param name  全局组件名（单根无 x-define 时用作根标签名）
     * @returns 规范化后的根元素；解析为空返回 null
     */
    private _wrapGlobalComponent;
    /**
     * 组件字符串归一化（ADR-0086）：`code` → 「恰好一个带 `x-define` 的根元素」+ 声明三元组。
     *
     * **严格单根契约**（与 `_wrapGlobalComponent` 的宽松自动包装分叉的那一半）：
     * | 输入形态 | 本方法（`registerComponent`） | `_wrapGlobalComponent`（`components`/`builtinComponents` 注册位） |
     * |---|---|---|
     * | 单根 + `x-define` | 原样为根 | 原样为根 |
     * | 单根、无 `x-define` | **warn + null**（注册路径要求自带声明） | 打本 key 名 |
     * | 多根 / 元素与文本混排 / 纯文本 | **warn + null** | 包一层 `<div x-define>` |
     *
     * 单根判定复用 `pickSingleRootElement`，声明解析复用 `parseComponentDeclare`（与编译期收集器
     * 同一实现）——「什么算合法声明」只有一处定义，运行时注册不与模板声明漂移。
     *
     * `optsName` 仅作校验：与串内 `x-define` 不一致时 warn，**仍以内联名为准**（串内声明是权威）。
     *
     * @param code     组件模板字符串（调用方契约：恰好一个带 x-define 的根元素）
     * @param optsName 可选的期望组件名（校验用，不参与命名）
     * @returns 归一化根元素 + 声明解析结果；任一校验不通过返回 `null`（已 warn）
     */
    private parseComponentCode;
    /**
     * 自 `el`（含自身）沿 `parentElement` 向上取最近的 scope 根元素所属 scope。
     *
     * `findScopeByEl` 是**精确匹配**（`scope.el === el`），供 Runtime 指令「我自己的元素 → 我的 scope」
     * 用；声明处语义要求的是 x-define 那套「最近祖先 scope」归属（ADR-0022 决策：`_linkParent`
     * 同构），故此处自行上溯——否则传入一个普通容器元素会查不到而降级全局（可见域静默放大）。
     */
    private _findNearestScopeOf;
    /**
     * 运行时注册组件（ADR-0086）：把一段组件模板字符串注册为全局组件或作用域组件。
     *
     * ```ts
     * engine.registerComponent(`
     *   <div x-define="panel">
     *     <div class="panel"><slot /></div>
     *     <style>.panel { border: 1px solid }</style>
     *   </div>
     * `);
     * ```
     *
     * **归属**（`scope` 与 `el` 同义——都是「声明处」）：
     * | 传入 | 注册目标 |
     * |---|---|
     * | 都不传 | 全局组件定义表，全域 `x-component` 可查 |
     * | `scope` | 挂 `scope.components`（仅该 scope 链内可见，`declarerScope` = 此 scope） |
     * | `el` | 自该元素向上取**最近的 scope 根**（含自身），与 x-define「最近祖先 scope」归属同构；查不到则 warn 后降级为全局 |
     * | `scope` + `el` | 以 `scope` 为准并 warn |
     *
     * **声明为准**（ADR-0115 决策 8）：code 根元素自带 `x-define.global` 或
     * `x-define-options="{global:true}"` 时，`scope`/`el` 目标被忽略（warn 一次），
     * 一律注册为全局组件——global 是定义自身属性；入口本就全局时该标记冗余，静默接受。
     *
     * **覆盖语义**：同名后注册覆盖先注册（per 名去重 warn）；**已实例化的组件不热替换**——
     * 实例持有自己的克隆，仅后续 `x-component` 实例化取到新定义。
     *
     * **继承**：`x-define:inherit` 在注册层解析（复用编译期/x-import 同一 `resolveComponentInheritance`
     * 管线，父查找 = scope 链就近 + 全局兜底），父未就绪时挂起待 `components/<父名>/registered`
     * 排水重试（ADR-0083）——故注册所得组件与 `options.components` 平齐地支持继承。
     *
     * **只注册不注销**：无 `unregisterComponent`——作用域注册挂在 `scope.components` 上，随 scope
     * 对象一并失去引用而回收（scope 销毁不逐项清表，但该 scope 已脱活链、无处可达）；
     * 全局注册随 `destroy()` 丢弃。
     *
     * @param code 组件模板字符串（须恰好一个带 `x-define` 的根元素）
     * @param opts `name` 仅校验（以内联名为准）/ `scope` 声明处 scope / `el` 声明处元素锚点
     * @returns 已登记的组件定义（继承已解析）；校验或解析失败返回 `null`（已 warn）
     */
    registerComponent(code: string, opts?: {
        name?: string;
        scope?: AutoSparkScope;
        el?: HTMLElement;
    }): ComponentDef | null;
    /**
     * 动态 patch：修改模板片段并增量同步到运行树（ADR-0002）。
     *
     * 开发者在 `updater` 回调里就地修改 `engine.template` 的某个 scope 子树（回调入参即命中的
     * 模板元素），本方法据 `updater` 返回值决定重建范围，**只动 patch 目标子树，保留其余运行态**
     * （焦点/滚动/未提交输入）。selector 对 `engine.template` querySelector；命中须为 scope
     * （含指令或 `{{}}` 插值的元素；纯静态裸元素需挂 `x-scope` 哨兵）。
     *
     * **`replace` 模式返回四态**（判定用 `===`/`typeof`，`undefined != null` 严格区分；
     * 仅函数内容适用，string/Node 直投等价 updater 返回该内容）：
     * - `void`/`undefined` 或 `=== templateEl` → **子树重建**（复用 `recompileSubtree`）
     * - 新 `Node`（`!== templateEl`）→ **替换自身**
     * - `string`（HTML）→ **替换自身**（`<template>` 解析，可多节点，空串=删除）
     * - `null` → **删除自身**
     *
     * **内容投放模式**（ADR-0109，`options.mode`，缺省 `replace`）：
     * - `replace`：内容**替换 T 本身**（上方四态；空串直投=删除）
     * - `inner`：清空 T 全部子级（旧子 scope 逐个 destroy）后放入新内容，T 自身及指令保留；
     *   空串 = 仅清空（等价 `innerHTML=''`）
     * - `prepend` / `append`：插入为 T 的第一个/最后一个子节点（多节点全插，T 自身保留）；
     *   空串 = no-op。`options.ref` 指定**容器内**锚点（CSS 选择器，须命中 scope 元素）时
     *   改插到锚点前（prepend）/后（append）；ref 为空 = 容器首尾，未命中/非 scope =
     *   warn no-op（inner/replace 忽略 ref）。插入节点挂 **T 的 scope**（继承其数据上下文；
     *   replace 挂 `scope.parent`）
     * - 插入模式**编译先行**：新内容编译成功才动两侧 DOM，失败零副作用（回滚编译期新建 scope）
     * - 函数 + 插入模式：返回 string/Node 即待插入内容；`undefined`/`T` 静默 no-op；
     *   `null` warn（replace 的删除语义在此无意义）
     *
     * **动态区域守卫**：patch 目标自身或祖先链含 ownsChildren 结构指令（x-for / eager x-if /
     * x-isolate / eager x-switch）→ 拒绝（运行侧结构非同构，正向桥不可靠）。
     *
     * updater 抛错则记日志、不重建；非法 `mode` 值 warn + no-op（options 未知键静默忽略）；
     * patch 后同步 `flushAll`，返回时 DOM 已更新。dispatcher 经 MutationObserver 自动处理
     * 新/旧节点的 runtime 指令 mount/unmount，patch 不直接操作。
     *
     * @param selector 对 `engine.template` 的 CSS 选择器（命中的须为 scope 元素）
     * @param content  待投放内容：string（HTML 片段）/ Node（引擎接管移入模板树）/ updater 回调
     * @param options  选项（`mode` 投放模式缺省 `replace`；`ref` 容器内锚点选择器；ADR-0109）
     */
    patch(selector: string, content: AutoSparkPatchContent, options?: AutoSparkPatchOptions): this;
    /** 解析 HTML 片段为模板节点数组（空/纯空白 → 空数组） */
    private _parseNodes;
    /**
     * 插入模式（inner/prepend/append，ADR-0109）共用实现：**编译先行**，成功才动两侧 DOM
     * （编译失败回滚编译期新建 scope，模板/运行树零副作用）。
     *
     * - ref 锚点解析最前置（失败 warn + no-op，发生在任何副作用之前）；
     * - `inner`：先销毁旧子 scope（快照迭代——编译期新建的 scope 已入 children 不受波及；
     *   destroy 自摘 parent.children），再 `replaceChildren` 双侧换装；T 自身及其指令保留；
     * - `prepend` / `append`：模板 T / 运行 el 双侧同位插入首/末子级；有 ref 锚点时改为
     *   锚点前/后（锚点为容器内 scope 子元素，模板/运行化身成对可得）。
     *
     * 插入顶层节点挂 **T 的 scope**（不同于 replace 的 `scope.parent`——T 自身保留在树中）。
     * 调用方保证 mode ∈ {inner, prepend, append}；ref 仅 prepend/append 有意义。
     */
    private _insertInto;
    /**
     * ref 锚点解析（ADR-0109）：容器 T 内按选择器命中元素，且须为 scope 元素（有正向桥，
     * 模板/运行化身成对可得；纯静态子元素无运行映射——与容器资格同口径，指引挂 `x-scope`）。
     * 未命中/非 scope → warn + 返回 null（调用方 no-op）。
     */
    private _resolveRefAnchor;
    /**
     * 插入模式的字符串内容解析分发：空片段按模式退化——`inner`=仅清空（等价 `innerHTML=''`）、
     * `prepend`/`append`=no-op。
     */
    private _insertParsed;
    /**
     * 遍历 scopes 查找 `scope.el === el` 的 scope。
     *
     * engine.scopes 以 WeakRef 为 key，无法直接 get(el)，只能遍历 values 做 deref 比较（O(n)）。
     * 低频 API（engine.data / 块消费编译），O(n) 可接受。
     *
     * 公开供 Runtime 指令（如 x-loading）消费组件（x-define 声明）时取得宿主 scope 作组件编译的 parentScope
     * （Runtime 指令无 binding，需经 el 反查）。Compile/Hybrid 指令直接用 `this.binding`。
     * 亦用于 `engine.getComponentDeclaration` 的全局组件兜底（`scope.getComponentDeclaration` 到顶委托 `engine._resolveGlobalComponent`）。
     */
    findScopeByEl(el: HTMLElement): AutoSparkScope | undefined;
    /**
     * 注册组件定义（ADR-0022 决策二-1）。compiler `_collectComponent` 建好 def 后调用，以快照根为 key 存入。
     *
     * 同时是**全局样式段注入的收口点**（ADR-0087）：五条注册路径（本地 x-define / 继承解析 /
     * x-import 远程 / 运行时注册 / 全局组件懒预编译）全走本方法——「凡注册必注入」，
     * global 段无实例化依赖，声明即生效。
     */
    registerComponentDef(def: ComponentDef): void;
    /**
     * 模板全局声明注册收口（ADR-0115）：编译期 `_collectComponent` 命中 `x-define.global`
     * （或 `x-define-options="{global:true}"`）时调用。与 {@link registerComponent} 全局路径
     * 同一语义三件套——覆盖 warn 一次（per 名去重，克隆/多实例重注册不刷屏）、
     * {@link registerComponentDef}（快照反查 + global 样式注入收口）、入全局组件定义表、
     * `_afterComponentRegistered(name, true)`（凡注册必发事件、必排水）。区别仅在调用方已直接
     * 持有 ComponentDef（模板 DOM 收集通道，非字符串严格契约通道），故不复刻字符串归一化。
     */
    _registerGlobalDef(name: string, def: ComponentDef): void;
    /** 挂起的继承解析表（ADR-0083）：父名 → 待重试任务队列（父未就绪时压入，注册事件排水） */
    private _pendingInherits;
    /**
     * 挂起一条继承解析（ADR-0083）：父组件未就绪（可能来自 x-import 异步加载）时由
     * compiler / 远程注册路径调用。任务约定：返回 `true` = 出队（解析成功或终局失败），
     * `false` = 继续等待（本次注册的同名组件不在子组件可见链上）。
     */
    addPendingInherit(parentName: string, task: () => boolean): void;
    /**
     * 排水挂起继承（ADR-0083）：组件注册后调用——重试等待该名的
     * 全部任务；任务注册的新组件经其自身注册路径递归排水（链式继承任意到达顺序逐级解锁）。
     */
    _drainPendingInherits(name: string): void;
    /**
     * 注册成功后的统一后置（ADR-0085）：发按名注册事件（retain）+ 排水挂起继承。
     *
     * 五条注册路径（本地普通 / 本地继承即时 / 挂起排水重试、远程普通 / 挂起排水重试、
     * 全局组件懒预编译首解析）全走本方法——「凡注册必发事件、必排水」是结构不变量，
     * 新增注册路径只调它，不可能只做其一。
     *
     * 事件键 = `components/${name}/registered`，载荷 `{ name, global }`，**retain=true**
     * （订阅晚于注册也立即补发，组件依赖方不漏听；通配符订阅即补发全部已注册名）。
     * 先发事件（retain 落盘）再排水：排水重试注册的新组件经
     * 自身路径递归走本方法，链式解锁收敛。旧单数全局事件 `component/registered` 已移除。
     */
    _afterComponentRegistered(name: string, global: boolean): void;
    /** fetch 失败时提示仍未就绪的挂起继承名（ADR-0083 诊断补偿：typo 与异步未归的兜底线索） */
    private _warnPendingInheritsIfAny;
    /**
     * 经组件冻结快照根反查组件定义（ADR-0022）。
     *
     * `getComponentDeclaration(name)` 返回 HTMLElement 快照（保持 x-loading 等消费者契约不变）；x-component 实例化时
     * 经快照反查本方法取 def（setup/hooks/styles/parent/components）以注入组件语义。
     * 局部组件经 `_componentDefs`（WeakMap）；全局组件经 `_globalComponentDefCache`。
     */
    getComponentDef(snapshot: HTMLElement): ComponentDef | undefined;
    /**
     * 取全局组件定义（ADR-0022 决策二-1；ADR-0086 单表）。`options.components` 惰性预编译或
     * `registerComponent` 即时注册时入表。供 x-component 实例化全局组件时取 setup/hooks/styles。
     */
    getGlobalComponentDef(name: string): ComponentDef | undefined;
    /**
     * 命令式消费入口（ADR-0052 修订版 共识 10）：`getOverlay(el, name, options?)` → 定义句柄。
     *
     * **镜像 `getComponentDeclaration` 查找协议**：`el` 起 scope 链就近查找（内层同名组件遮蔽外层）
     * + `options.components` 全局兜底；省略 `el` 仅查全局。覆盖物内容 = 任意组件
     * （x-define 声明 / 全局注册 / x-import 加载），本方法返回 OverlayHandle 供
     * `open()` / `close()`。未命中 warn + 返回 undefined。
     *
     * @param el      查找锚点起点元素（起 scope 链查找）；省略/null 仅查全局
     * @param name    覆盖物组件名
     * @param options 消费者配置级（等价声明式 x-dialog-options，合并链中层）
     */
    getOverlay(el: HTMLElement | null | undefined, name: string, options?: Record<string, any>): OverlayHandle | undefined;
    /**
     * 从远程 url 加载组件定义并注册（ADR-0022 决策六，供 x-import）。
     *
     * - fetch url（经 `fetchHtml`，复用 x-isolate fetch 逻辑）→ 解析 HTML 得 `<div x-define>` 顶级元素；
     * - 按 url 缓存解析结果（重复引用免重复 fetch）；循环 import 检测（url 在途 → warn + 中断）；
     * - 各 x-define 元素经 `buildComponentDef` 提取 `<script setup>`/`<style>` + 组装 def；
     * - 注册：global=true → 全局（`options.components` 懒预编译路径，写入 options + 清缓存让其重解析）；
     *   global=false → 作用域（挂 ownerScope.components）；
     * - 注册后发 `components/<名>/registered`（retain，ADR-0085），供 pending 的 x-component / 组件依赖方获知；
     * - 失败 warn + 视为未注册（不阻断其余组件）。
     *
     * @param url        远程组件 HTML url
     * @param ownerScope 作用域注册的目标 scope（global=false 时挂此；global=true 时忽略）
     * @param global     是否注册为全局组件（.global 修饰符）
     * @param request    额外 fetch 参数（ADR-0065 决策五：loader 的 request 整包透传 requestInit；
     *                   参与 url 缓存 key——同 url 不同请求参数不串缓存，无 request 退化为裸 url）
     * @param signal     可选中止信号（ADR-0065 决策四：loader url 响应式变化时 abort 旧请求）
     * @returns 已注册的组件名数组；**null = 加载失败**（fetch 非 2xx/网络错误/解析为空——与
     *          「成功但无组件」的空数组区分，供 loader 给出准确 error 文案，ADR-0065）
     */
    importComponentsFromUrl(url: string, ownerScope: AutoSparkScope | null, global: boolean, request?: RequestInit, signal?: AbortSignal): Promise<string[] | null>;
    /**
     * patch 替换自身：用 `templateNodes` 替换 T（模板侧 + 运行侧），destroy 旧 scope、编译新节点。
     *
     * 顺序（经评审验证）：① 模板侧先 replaceWith（新节点进 engine.template，`compileElement` 的
     * `_linkParent` 能沿新祖先链找到父 scope）→ ② destroy 旧 scope（watcher 立即 off，降低新旧
     * scope 瞬时重叠）→ ③ 编译 templateNodes 建新 scope → ④ 运行侧 replaceWith。
     *
     * @param scope         T 对应的旧 scope
     * @param T             模板侧被替换元素
     * @param el            运行侧被替换元素（scope.el）
     * @param templateNodes 替换 T 的新模板节点（来自 parseHtmlFragment 或 updater 返回的 Node）
     */
    private _replaceSelf;
    /**
     * patch 删除自身：destroy scope + 模板/运行双侧移除（`null` 与空串共用同一路径）。
     *
     * dispatcher 检测 el remove → runtime 指令 unmounted（自动）。
     */
    private _deleteSelf;
    /**
     * 动态区域判定：T 自身或祖先链上有 ownsChildren 结构指令（x-for / eager x-if / x-isolate / eager x-switch）。
     *
     * 这些区域的运行侧结构由指令运行时生成，与模板非同构，正向桥不可靠——patch 落入即拒绝。
     * 沿 templateScopeMap 上溯，O(树深)。
     */
    private _isInDynamicRegion;
    /**
     * 彻底销毁引擎：清空调度队列、销毁所有 scope（off watcher + 删 computed）、
     * 移除挂载 DOM。
     *
     * **store 销毁纪律（ADR-0044）**：store 恒为 engine 自建，恒调 `store.destroy()` 回收其
     * computedObjects / 事件订阅 / Proxy 等 core 资源（内部先向 configManager 注销本 store）；
     * 随后仅销毁 engine 自建的默认 configManager，消费者经 `storeOptions.configManager`
     * 传入的不动（所有权对称）。
     */
    destroy(): void;
}
