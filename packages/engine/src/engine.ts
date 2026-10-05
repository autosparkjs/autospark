import type { AutoSparkEvents, AutoSparkOptions, AutoSparkVars } from "./types";
import type { ComponentDef } from "./directives/component-def";
import { DirectiveManager } from "./directives/manager";
import { AutoSparkCompiler } from "./compile/compiler";
import { AutoStore, ConfigManager, FastEvent, isAutoStore } from "autostore";
import type { AutoStoreOptions } from "autostore";
import type { AutoSparkScope } from "./scope";
import { UpdateScheduler } from "./scheduler";
import { RuntimeObserverDispatcher } from "./directives/runtime/dispatcher";
import { parseHtmlFragment, pickSingleRootElement } from "./utils/transformElement";
import { ActionManager } from "./actions/manager";
import type { AutoSparkAction } from "./actions/types";
import { recompileSubtree } from "./utils/recompileSubtree";
import { AutoSparkAnimator } from "./animate";
import {
    buildComponentDef,
    parseComponentDeclare,
    warnNestedResourceNodes,
} from "./compile/collect";
import {
    readInheritAttr,
    resolveComponentInheritance,
    PENDING_PARENT,
    type InheritResolveResult,
} from "./compile/inherit";
import { fetchHtml } from "./utils/fetchHtml";
import { injectGlobalComponentStyles, releaseEngineGlobalStyles } from "./utils/globalStyle";
import { iconRegistry, type IconRegistry } from "./icons/registry";
import { OverlayHandle } from "./overlay/handle";
import { removeOverlayContainer } from "./overlay/container";
import { TooltipManager } from "./tooltip/manager";
import type { TooltipAPI } from "./tooltip/types";
import { MessageManager } from "./messages/manager";
import { SHELL_TEMPLATE } from "./messages/shell";
import { MESSAGE_PRESET_COMPONENTS } from "./messages/presets";
import { PANEL_SHELL_TEMPLATE, DRAWER_SHELL_TEMPLATE } from "./overlay/wrappers";
import { BUILTIN_ERROR_COMPONENT, ensureErrorStyle } from "./builtinError";
import { ComponentInstance } from "./component-instance";

/**
 * 框架保留键：x-data 默认模式的私有响应式数据域在 store.state 下的容器键。
 *
 * engine 初始化自动注入 store.state[SCOPES_KEY] = {}（不存在时）。每个 x-data scope 的
 * 数据存于 store.state[SCOPES_KEY][scope.id]，借 store 响应式自动更新订阅者
 * （collectDependencies 收集 `$scopes.<id>.<field>` 精准路径，实现字段级细粒度更新）。
 *
 * **保留键**：用户 state 树不得使用 "$scopes" 命名，否则将被 engine 覆盖/冲突。
 */
export const SCOPES_KEY = "$scopes";

/**
 * 框架保留键（第二例，ADR-0072）：全局消息子系统的状态暴露容器。
 *
 * MessageManager 构造时注入 `store.state[MESSAGES_KEY] = { items, options }`：
 * - `items`：记录镜像（`shallow(items, 1)`——AutoSparkMessage 纯数据，写通道仅 manager，
 *   模板直写为违约自理）；
 * - `options`：生效全局配置**真身**（可直写——运行时修改对后续操作生效、已展示卡片不回溯）。
 *
 * **保留键**：用户 state 树不得使用 "$messages" 命名，否则将被 engine 覆盖/冲突。
 */
export const MESSAGES_KEY = "$messages";

/**
 * AutoStore Template 渲染引擎核心类
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
export class AutoSpark<
    State extends Record<string, any> = Record<string, any>,
> extends FastEvent.FastLiteEvent<AutoSparkEvents> {
    /**
     * 全局图标注册表（ADR-0046/0047）：document 级单例，多 engine 共享。
     * `add(name, svg)` 注册（同名覆盖 + warn 去重）、`delete(name)` 移除（不存在静默 false）、
     * 遍历产出名称字符串；`baseUrl` 为远程图标协议基址（`baseUrl/<图标集>/<图标名>.svg`，
     * 默认 Iconify 公共 API，不限于 Iconify——任何兼容服务可自托管）。
     * 声明入口三通道：模板 `x-icons.global`（ADR-0058）/ 本表编程注册 / 构造 `options.icons` 种子。
     */
    static readonly icons: IconRegistry = iconRegistry;

    /** 挂载容器（编译产物替换其子节点，容器本身保留） */
    readonly el: HTMLElement;
    /** 响应式数据源：engine 在 `_createStore` 内自建并拥有（destroy 时销毁）。ADR-0044 */
    readonly store: AutoStore<State>;
    readonly vars: AutoSparkVars = {};
    /**
     * engine 自建的默认 configManager（`_createStore` 补缺省时创建）。
     * destroy 时仅销毁此实例；消费者经 `storeOptions.configManager` 传入的不动（所有权对称，ADR-0044）。
     */
    private _ownedConfigManager: ConfigManager | null = null;

    /**
     * 重写基类 accessor：基类 options 是 getter，子类不得用实例属性遮蔽（TS2610），
     * 故以 getter 重写，返回合并类型（协变兼容基类 FastLiteEventOptions）。
     * 构造完成前 _fullOptions 未就绪时回退 super.options，规避基类构造期虚分派读到 undefined。
     */
    override get options(): AutoSparkOptions<State> {
        return super.options as AutoSparkOptions<State>;
    }
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
    /** 全局消息管理单元（ADR-0071）：`extends Map<string, SessionImpl>`（键恒为 string id，可枚举全部存活记录——`messages.sessions` 即本表正名视图）；公共入口经 `add/confirm/progressbar/load/save/...` / 本表 */
    readonly messages: MessageManager;
    /** 原始模板（深克隆根元素，保留指令属性作为编译只读输入） */
    readonly template: HTMLElement;
    /** 每个渲染元素对应的 Scope（销毁时遍历清理其 watcher） */
    readonly scopes = new Map<WeakRef<Node>, AutoSparkScope>();
    /**
     * 整个 engine 响应式数据驱动的核心：直接暴露 `store.state`（响应式根状态）。
     * 作为 scope 聚合视图（getContext）的根 fallback、模板表达式求值的最终数据源。
     */
    get state() {
        return this.store.state;
    }

    /** 是否已编译并挂载 */
    private pending = false;

    /**
     * @param el       挂载根元素（必须是 HTMLElement）
     * @param state    裸状态对象：engine 在 `_createStore` 内自建 AutoStore 并拥有、destroy 时销毁（ADR-0044）。
     *                 null/undefined 静默兜成空 store（不抛错，沿用 ADR-0009 决策 5）。
     * @param options  配置选项（`storeOptions` 恒消费，字段级默认见 `_createStore`）
     * @throws {Error} el 非 HTMLElement；state 为 AutoStore 实例（不再接受借用，ADR-0044）
     */
    constructor(el: HTMLElement, state: State, options?: Partial<AutoSparkOptions<State>>) {
        // 内置 error 组件（ADR-0065）：默认注册 options.components.error，用户同名声明展开覆盖
        //（组件查找链：局部 x-define > options.components，均天然优先于内置，无需特判）；
        // 样式幂等注入（document 级资产，与 icons 同纪律，engine.destroy 不清理）
        // 消息预设组件族（ADR-0083）：base/toast/task/confirm 四件同位注入——autospark.*
        // 点前缀为引擎保留命名空间，用户同名声明覆盖（同 error 先例）
        const { components: userComponents, ...restOptions } = (options ?? {}) as Partial<
            AutoSparkOptions<State>
        >;
        ensureErrorStyle();
        // 展开形态传入（super 参数类型为 FastLiteEventOptions，无 components 键——spread 免过剩检查）
        const init = {
            autostart: true,
            debug: false,
            actions: {},
            components: {
                error: BUILTIN_ERROR_COMPONENT,
                ...MESSAGE_PRESET_COMPONENTS,
                ...userComponents,
            },
        };
        super({ ...init, ...restOptions });
        if (!(el instanceof HTMLElement)) {
            throw new Error("Root element must be an HTMLElement");
        }
        this.el = el;
        this.store = this._createStore(state, options);
        // 注入框架保留键 $scopes（x-data 私有响应式域容器）；1 engine 1 store 约定下由 engine 负责
        this._ensureScopesState();
        // action 管理单元就位并扫描全局表：构造时传入的 options.actions 一次性规范化包装
        // （运行时 `engine.actions[name] = decl` 经 actions Proxy 的 set trap 规范化包装、
        // `<script type="autospark/actions">` 经 compiler 调 extractScript 规范化包装，
        // 三入口统一走 _normalize → buildAction，值恒为 ActionDesc 描述符，ADR-0036）
        this.actionsManager = new ActionManager(this);
        this.actionsManager.registerGlobals();
        // 图标种子（ADR-0046 决策 3）：构造期并入全局注册表（同名 warn + 覆盖），
        // 先于编译期模板定义生效（模板同名者后到覆盖）
        if (options?.icons) {
            for (const [name, svg] of Object.entries(options.icons)) iconRegistry.add(name, svg);
        }
        this.template = el.cloneNode(true) as HTMLElement;
        // engine 根标识（ADR-0060）：真实 DOM 上爬类查找（queryRelElement 的 ^ closest 与 ../ 爬升）
        // 遇此属性即止步，不越入相邻 engine 的 DOM。所有 engine 共通（app 根与 x-isolate 宿主一视同仁）。
        // 打点在 template 克隆之后——属性不进模板，不随编译产物浅克隆扩散到结果树其他元素。
        el.setAttribute("data-autospark", "");

        this.scheduler = new UpdateScheduler(this);
        this.compiler = new AutoSparkCompiler(this);
        this.directives = new DirectiveManager(this);
        this.dispatcher = new RuntimeObserverDispatcher(this);
        // 进出场动画服务（ADR-0039）：样式注入须早于首次状态变化驱动的挂卸
        this.animate = new AutoSparkAnimator();
        // 全局工具提示（ADR-0061）：须早于 autostart compile——编译期 title→data-tooltip
        // 转换依赖 manager 的 enabled 开关；委托监听/样式注入在构造内就位（tooltip: false 时全短路）
        this.tooltipManager = new TooltipManager(this);
        // UI 外壳注册表（ADR-0077）：内置四件种子 < 用户 options.uiShells 浅覆盖——构造期固化。
        // 内置模板来自 messages/renderers/shell 与 overlay/wrappers（叶子模块，无循环依赖）。
        // builtin 键集排除被用户接管的种子键（接管后的模板无引擎类名契约，按用户模板装配）
        const userUiShells =
            ((options as any)?.uiShells as Record<string, string> | undefined) ?? {};
        this._uiShells = {
            message: SHELL_TEMPLATE,
            dialog: PANEL_SHELL_TEMPLATE,
            popover: PANEL_SHELL_TEMPLATE,
            drawer: DRAWER_SHELL_TEMPLATE,
            ...userUiShells,
        };
        this._builtinUiShellKeys = new Set(
            ["message", "dialog", "popover", "drawer"].filter((k) => !(k in userUiShells)),
        );
        // 全局消息（ADR-0071）：引擎级子系统，容器/样式随首个消息懒建（messages: false 时
        // 构造即短路——add() warn + no-op）；配套 action（toast/confirm/task）的 handle 闭包
        // 经 engine 引用惰性触达本管理器，无初始化顺序约束
        this.messages = new MessageManager(this);
        if (this.options.autostart) {
            this.compile();
        }
        // 类级初始化：对所有注册指令类（不分 kind）调用 static initialize(engine)。
        // 须在 autostart compile 之后——runtime 指令的 initialize 会扫描已挂载的编译产物建 observer、
        // 注入全局样式等。autostart=false 时编译产物尚未挂载，observer 连接后由 start() 的
        // replaceChildren 触发 add 回调，照样生效。
        this.directives.initializeAll();
        // 启动 runtime 指令共享 observer 分发器：须在 initializeAll（含 injectStyles 等 FOUC 防御）
        // 之后、engine/ready 之前——初始扫描会同步触发首次 mounted，依赖样式已注入。
        this.dispatcher.start();
        this.emit("engine/ready", { el: this.el }, true);
    }

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
    private _createStore(
        state: State,
        options?: Partial<AutoSparkOptions<State>>,
    ): AutoStore<State> {
        if (isAutoStore(state)) {
            throw new Error(
                "AutoSpark no longer accepts an AutoStore instance. Pass plain state and configure the store via options.storeOptions instead (ADR-0044).",
            );
        }
        const storeOptions: AutoStoreOptions<State> = { ...options?.storeOptions, resetable: true };
        if (storeOptions.configManager == null) {
            this._ownedConfigManager = new ConfigManager({ load: () => ({}) });
            storeOptions.configManager = this._ownedConfigManager;
        }
        storeOptions.configKey = "";
        return new AutoStore(state as State, storeOptions);
    }

    // 显式注解：logger 的推断类型源自 autostore 传递依赖 flex-tools，声明发射不可移植（TS2742）；
    // 经 AutoStore 索引访问类型把引用面收敛到 autostore 本身。
    get logger(): AutoStore<any>["logger"] {
        return this.store.logger;
    }

    /**
     * 全局事件 action 表（来自 options.actions），作为 scope.getAction 查找链的终点。
     *
     * 值恒为 **ActionDesc 描述符**（ADR-0036：三入口写入时全量规范化，name 注入 + handle 包装），
     * 命令式直调取 `.handle(...)`。返回 Proxy：**赋值即自动规范化包装**——`engine.actions.save = decl`
     * （函数简写或对象写法）经规范化（获得 `actions/<name>/*` 生命周期广播）后写入底层
     * options.actions；读取、遍历、getAction 均透明（get 默认转发底层）。故 action 注册即追踪，
     * 无需手动包装。实现委托 actionsManager（src/actions/manager.ts）。
     */
    get actions(): Record<string, AutoSparkAction> {
        return this.actionsManager.proxy;
    }

    /**
     * 命令式工具提示（ADR-0061 决策 18）：`engine.tooltip.show(el, opts?)` / `hide()`。
     * 与悬停委托同一显示管道（配置解析/延迟/动画/事件全同构）；`opts` 与元素级保留键
     * 同构、单次生效。`options.tooltip: false` 时调用 warn + no-op（全关语义，决策 2）。
     */
    get tooltip(): TooltipAPI {
        return this.tooltipManager;
    }

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
     * - `options.components` 字符串 → **惰性**：首次查找未命中时经 `_resolveGlobalComponent` 预编译入表；
     * - `engine.registerComponent(code)` → **即时**：注册时解析入表。
     * 查找一律「先查表、未命中才读 `options.components`」——运行时注册因此**天然覆盖**构造期配置，
     * 无需失效缓存、无需把 def 序列化回字符串重解析（ADR-0086 决策三）。
     *
     * 记录 `null` 表示该名已查明未命中（不存在/解析失败），避免重复解析尝试。
     * 生命周期随 engine（destroy 自动回收）。
     */
    private _globalComponentDefs = new Map<string, ComponentDef | null>();
    /**
     * UI 外壳注册表私表（ADR-0077）：构造期合成（内置四件种子 < 用户 `options.uiShells`
     * 浅覆盖），**构造期固化**——运行时突变不失效缓存（换 shell 走消费者选择器）。
     */
    private _uiShells: Record<string, string>;
    /** uiShells 懒预编译缓存（name → { snapshot, def }；null = 已查明未命中，避免重复解析） */
    private _uiShellCache = new Map<
        string,
        { snapshot: HTMLElement; def: ComponentDef | null } | null
    >();
    /** 内置种子键集（wrapper 装配规则判据：内置模板自带引擎类名契约，用户模板零污染） */
    private _builtinUiShellKeys: ReadonlySet<string>;
    /**
     * 组件定义表（ADR-0022 决策二-1、决策七）：key=组件冻结快照根元素，value=ComponentDef。
     *
     * compiler `_collectComponent` 命中 x-component 时建 def，以快照根为 key 存入此表。
     * `getComponentDeclaration(name)` 返回 HTMLElement 快照（保持 x-loading 等消费者契约不变），x-component 实例化时
     * 经快照根反查本表取 def（setup/hooks/styles/parent/components）。定义 scope 链（嵌套私有子组件）经
     * `def.parent` / `def.components` 表达，与此表正交。WeakMap：scope 回收后 def 自动释放。
     */
    private _componentDefs = new WeakMap<HTMLElement, ComponentDef>();
    /**
     * x-import url 缓存（ADR-0022 决策六-3）：key=url，value=解析出的 HTMLElement 根数组
     * （fetched HTML 里的各 `<div x-component>` 顶级元素）。重复引用同一 url 命中缓存，免重复 fetch。
     * 循环 import 检测：fetch 中记录 url 到 `_importingUrls`，命中即 warn + 中断该链。
     */
    private _importUrlCache = new Map<string, HTMLElement[]>();
    /** 正在 fetch 的 url 集合（循环 import 检测，ADR-0022 决策六-4） */
    private _importingUrls = new Set<string>();
    /**
     * 远程覆盖注册的 warn 去重（ADR-0065 决策三）：同 url 缓存命中重跑注册循环时，
     * 「已有同名组件被覆盖」只警告一次（per 注册目标 per 组件名），避免 loader 多实例场景刷屏。
     * 全局目标用独立 Set；作用域目标 WeakMap（scope 销毁后条目自然释放）。
     */
    private _overrideWarnedScope = new WeakMap<AutoSparkScope, Set<string>>();
    private _overrideWarnedGlobal = new Set<string>();

    // action 管理单元已提炼至 src/actions/（manager.ts + buildAction.ts，承接 ADR-0010 的
    // utils 提炼）；三入口——构造函数 options.actions 扫描、actions Proxy 的 set trap、
    // compiler 提取 `<script type="autospark/actions">`——均经 ActionManager 统一包装。
    // engine 不再暴露公有 buildAction API（原为内部实现细节被误暴露）。

    /**
     * 确保 store.state[SCOPES_KEY] 存在（x-data 私有响应式域容器）。
     *
     * 1 engine 1 store 约定下由 engine 负责注入：不存在则建空对象（core 自动建响应式代理），
     * 已存在（用户预设/复用）则沿用。仅赋值一次；后续 x-data scope 向其写入 [id] 条目，
     * 永不整体替换该容器（DataDirective 同守"只 Object.assign 进 $scopes[id]、不整体替换"铁律）。
     */
    private _ensureScopesState() {
        const state = this.store.state as Record<string, any>;
        if (!Object.prototype.hasOwnProperty.call(state, SCOPES_KEY)) {
            state[SCOPES_KEY] = {};
        }
    }

    /**
     * 编译模板并把产物挂载到 `el`。
     *
     * compiler 基于 `template`（只读）重建一棵移除指令属性的新元素树，
     * 随后用 `el.replaceChildren(root)` 替换容器子节点——使产物进入文档，
     * watcher 才能作用在可见 DOM 上。
     */
    compile() {
        this.emit("engine/compile/before", { root: this.template });
        const root = this.compiler.compile();
        // 挂载编译产物的子节点（而非 root 本身）：engine.template 是 el 的深克隆（含外层容器），
        // 编译后的 root 是该容器的重建；取其子节点挂回 el，避免容器内多套一层容器克隆。
        this.el.replaceChildren(...Array.from(root.childNodes));
        this.pending = true;
        // 同步消化编译期排队的首次渲染：某些指令（如 x-for）的首次渲染依赖元素已挂载，
        // 在 created 中只能 schedule 到 microtask；此处 el 已挂载，立即 flush 使初始 DOM 同步可见。
        // 用 flushAll 持续消化 x-for 嵌套带来的级联首次渲染，使 mount 返回时各层级 DOM 均已就绪。
        this.scheduler.flushAll();
        this.emit("engine/compile/after", { root });
        return this;
    }

    /**
     * 启动引擎：尚未编译时编译挂载；已启动则幂等返回。
     */
    start() {
        if (!this.pending) {
            this.compile();
        }
        return this;
    }

    /**
     * 停止引擎：移除挂载的 DOM 并标记停止（不销毁订阅，可再次 `start`）。
     */
    stop() {
        // 显示中的 tooltip 同步隐藏（挂载 DOM 即将整体移除——断连兜底的事件前主动收口，ADR-0061 决策 13）
        this.tooltipManager.hideImmediate();
        this.el.replaceChildren();
        this.pending = false;
        return this;
    }

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
    data(el: HTMLElement, data: Record<string, any>) {
        const scope = this.findScopeByEl(el);
        if (!scope) {
            this.logger.warn(`engine.data: 元素未找到对应 scope，已忽略`);
            return;
        }
        if (scope._data) {
            // 主路径：合并 → 路径订阅自动驱动
            Object.assign(scope._data as Record<string, any>, data);
            this.emit("scope/data-updated", { id: scope.id, data });
            return;
        }
        // 无 data（el 原无 x-data）：新建 + 重建子树（A）
        const scopes = (this.store.state as Record<string, any>)[SCOPES_KEY] as Record<string, any>;
        if (!scopes[scope.id]) scopes[scope.id] = {};
        scope._data = scopes[scope.id];
        Object.assign(scope._data as Record<string, any>, data);
        // 失效本 scope 缓存视图（含新 data 层），子树重建后新子 scope 经 parent 链取到新视图
        scope.invalidateScopeView();
        recompileSubtree(scope, el);
        this.emit("scope/data-updated", { id: scope.id, data });
    }

    /**
     * 按 el 反查 scope，再沿 parent 链就近查找命名组件**声明**，到顶兜底全局组件（ADR-0022 决策五，
     * 承接 ADR-0021 决策 5/9；原名 `getComponent`，ADR-0080 更名——短名让位给实例读取）。
     *
     * 供 **Runtime 指令**（如 x-loading，无 binding/scope）消费 x-define 声明的组件：编译期元素建过 scope
     * 的才能被反查到（el 经 `engine.scopes` WeakRef 遍历 deref 比对，O(n)、低频可接受）。
     * Compile/Hybrid 消费指令应直接用 `this.binding.getComponentDeclaration(name)`，避免 O(n) 遍历。
     *
     * 消费者协议：命中则用组件替换默认 UI，未命中回退默认实现（组件兜底）。详见 ADR-0022。
     *
     * @param el   消费指令的宿主元素（须是建过 scope 的元素，否则反查不到）
     * @param name 组件名（消费者约定名，自由命名）
     * @returns 组件冻结快照 HTMLElement，或 undefined（el 无 scope / 链+全局均无该名组件）
     */
    getComponentDeclaration(el: HTMLElement, name: string): HTMLElement | undefined {
        const scope = this.findScopeByEl(el);
        return scope?.getComponentDeclaration(name);
    }

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
    getComponent(el: HTMLElement): ComponentInstance | undefined {
        let cur: HTMLElement | null = el;
        while (cur) {
            const scope = this.findScopeByEl(cur);
            if (scope?.isComponent) return new ComponentInstance(scope);
            cur = cur.parentElement;
        }
        return undefined;
    }

    /**
     * 全局组件兜底解析（ADR-0022 承接 ADR-0021 决策 9/10/11）：`scope.getComponentDeclaration` 到顶后委托本方法。
     *
     * 懒预编译：首次访问某全局组件时，把 `options.components[name]` 字符串入参解析为 DOM，按自动包装规则
     * （决策 10）规范化为「恰好一个带 `x-define` 的根元素」，存入 `_globalComponentCache`；后续命中直接
     * 返回缓存（消费者自管 `cloneNode(true)`）。解析失败/不存在 → 记 null 缓存 + 返回 undefined
     * （视为未命中，由消费者回退默认实现；记 null 避免重复解析尝试）。
     *
     * **不注入 x-scope**（决策 7 修订：scope 由消费编译路径 compileChild 内禀保证）。
     * **不回写 options.components**（不突变用户输入）。**运行时突变 options.components 不失效缓存**
     * （构造期配置语义，与 actions/sanitizer 等同纪律）。
     *
     * @param name 全局组件名
     * @returns 预编译根元素（未编译、含 x-define），或 undefined（无此全局组件/解析失败）
     */
    _resolveGlobalComponent(name: string): HTMLElement | undefined {
        if (this._globalComponentDefs.has(name)) {
            return this._globalComponentDefs.get(name)?.snapshot;
        }
        const components = this.options.components;
        const raw = components?.[name];
        if (typeof raw !== "string" || raw.trim() === "") {
            // 非字符串 / 空串 → 记 null（视为未命中），避免重复判定
            this._globalComponentDefs.set(name, null);
            return undefined;
        }
        let root: HTMLElement | null = null;
        try {
            root = this._wrapGlobalComponent(raw, name);
        } catch (e: any) {
            this.logger.warn(`全局组件 "${name}" 解析失败，视为未命中: ${e?.message ?? e}`);
            this._globalComponentDefs.set(name, null);
            return undefined;
        }
        if (!root) {
            this.logger.warn(`全局组件 "${name}" 解析为空，视为未命中`);
            this._globalComponentDefs.set(name, null);
            return undefined;
        }
        // 全局组件继承（ADR-0081 V1 边界修订，ADR-0083）：字符串入参带 x-define:inherit 时经
        // resolveComponentInheritance 编译期展开——子 def 独立构建后与父（沿全局表递归懒预
        // 编译，父可也是继承产物）合并。失败（父未命中 / 成环等）warn 已发，按未命中处理。
        const inherit = readInheritAttr(root);
        if (inherit !== null) {
            const childDef = buildComponentDef(root, name, (msg) => this.logger.warn(msg));
            const resolved = resolveComponentInheritance({
                componentEl: root,
                name,
                inherit,
                modifierOpen: false, // 全局字符串路径不解析 .open 修饰符（远程注册路径同款）
                childDef,
                lookupParent: (n) => this._globalDefForInherit(n),
                warn: (msg) => this.logger.warn(msg),
            });
            if (resolved && typeof resolved === "object") {
                this._globalComponentDefs.set(name, resolved);
                // def 注册统一走 registerComponentDef（快照反查 + global 样式注入收口，ADR-0087）
                this.registerComponentDef(resolved);
                // ADR-0085：懒预编译首解析成功即视为「注册」——发按名事件 + 排水。
                // 判据天然成立：函数入口已对「表中有条目」早返回，走到此处必为首解析。
                this._afterComponentRegistered(name, true);
                return resolved.snapshot;
            }
            this._globalComponentDefs.set(name, null);
            return undefined;
        }
        // 组装组件定义：提取 <script setup>/<style>、求值合并 setup、克隆洁净快照（剥离 script/style）。
        // 快照与 def 同源同次产出，一次入表供 x-loading（取快照）与 x-component（取 def）分别消费。
        const def = buildComponentDef(root, name, (msg) => this.logger.warn(msg));
        this._globalComponentDefs.set(name, def);
        // def 注册统一走 registerComponentDef（快照反查 + global 样式注入收口，ADR-0087）
        this.registerComponentDef(def);
        this._afterComponentRegistered(name, true);
        return def.snapshot;
    }

    /**
     * 继承解析的父 def 查找（ADR-0083 全局组件继承）：先触发父名懒预编译（父自身可带
     * inherit——递归展开），再取其 def；未命中返回 null（由 resolveComponentInheritance
     * warn + 拒绝注册）。
     */
    private _globalDefForInherit(name: string): ComponentDef | null {
        this._resolveGlobalComponent(name);
        return this.getGlobalComponentDef(name) ?? null;
    }

    /**
     * 解析 UI 外壳（ADR-0077 `options.uiShells` 注册表）：引擎级外壳表的懒预编译查询——
     * 内置种子（message/dialog/popover/drawer）与用户覆盖模板同管道：字符串经自动包装规则
     * （`_wrapGlobalComponent`）规范化 + `buildComponentDef` 一次产出快照与 def，缓存后命中直取。
     *
     * 解析链位于 getComponentDeclaration 链（scope 局部 → `options.components`）**之后**——用户自定义
     * 外壳优先，本表为引擎级兜底。构造期固化：运行时突变 `options.uiShells` 不失效缓存。
     *
     * @param name 外壳键（消费者裸名，如 'message' / 'dialog'）
     * @returns { snapshot, def }，或 null（键不存在/模板解析失败——消费者回退其内置默认）
     */
    _resolveUiShell(name: string): { snapshot: HTMLElement; def: ComponentDef | null } | null {
        if (this._uiShellCache.has(name)) {
            return this._uiShellCache.get(name) ?? null;
        }
        const raw = this._uiShells[name];
        if (typeof raw !== "string" || raw.trim() === "") {
            this._uiShellCache.set(name, null);
            return null;
        }
        let hit: { snapshot: HTMLElement; def: ComponentDef | null } | null = null;
        try {
            const root = this._wrapGlobalComponent(raw, name);
            if (root) {
                const def = buildComponentDef(root, name, (msg) => this.logger.warn(msg));
                hit = { snapshot: def.snapshot, def };
            }
        } catch (e: any) {
            this.logger.warn(`UI 外壳 "${name}" 解析失败，视为未命中: ${e?.message ?? e}`);
        }
        this._uiShellCache.set(name, hit);
        return hit;
    }

    /**
     * 是否内置种子外壳键（ADR-0077）：消费者 wrapper 装配规则判据——内置模板自带引擎类名
     * 契约（如消息双类名根）根即载体；用户模板（components 命中或 uiShells 用户键）包
     * wrapper，零引擎类污染。
     */
    _isBuiltinUiShell(name: string): boolean {
        return this._builtinUiShellKeys.has(name);
    }

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
    private _wrapGlobalComponent(html: string, name: string): HTMLElement | null {
        const frag = parseHtmlFragment(html);
        if (!frag) return null;
        const single = pickSingleRootElement(frag);
        if (single) {
            // 单顶级元素：已含 x-define 则尊重原值，否则打本 key 名
            if (!single.hasAttribute("x-define")) {
                single.setAttribute("x-define", name);
            }
            return single;
        }
        // 多顶级元素 / 元素+文本混排 / 纯文本：包一层 div
        const wrap = document.createElement("div");
        wrap.setAttribute("x-define", name);
        wrap.appendChild(frag);
        return wrap;
    }

    /**
     * 组件字符串归一化（ADR-0086）：`code` → 「恰好一个带 `x-define` 的根元素」+ 声明三元组。
     *
     * **严格单根契约**（与 `_wrapGlobalComponent` 的宽松自动包装分叉的那一半）：
     * | 输入形态 | 本方法（`registerComponent`） | `_wrapGlobalComponent`（`options.components`/`uiShells`） |
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
    private parseComponentCode(
        code: string,
        optsName?: string,
    ): { root: HTMLElement; name: string; modifierOpen: boolean; inherit: string | null } | null {
        const warn = (msg: string) => this.logger.warn(msg);
        if (typeof code !== "string" || code.trim() === "") {
            warn("engine.registerComponent: code 为空或非字符串，未注册");
            return null;
        }
        let frag: DocumentFragment | null = null;
        try {
            frag = parseHtmlFragment(code);
        } catch (e: any) {
            warn(`engine.registerComponent: code 解析失败，未注册: ${e?.message ?? e}`);
            return null;
        }
        if (!frag) {
            warn("engine.registerComponent: code 解析为空（不含任何节点），未注册");
            return null;
        }
        const root = pickSingleRootElement(frag);
        if (!root) {
            warn(
                `engine.registerComponent: code 须为恰好一个顶级根元素` +
                    `（多根 / 元素与文本混排 / 纯文本均不支持），未注册（ADR-0086）`,
            );
            return null;
        }
        const declared = parseComponentDeclare(root, warn);
        if (!declared) {
            warn(
                `engine.registerComponent: 根元素 <${root.tagName.toLowerCase()}> 缺少 x-define 声明，` +
                    `未注册（ADR-0086）`,
            );
            return null;
        }
        const expected = (optsName ?? "").trim();
        if (expected !== "" && expected !== declared.name) {
            warn(
                `engine.registerComponent: name "${expected}" 与 code 内 x-define "${declared.name}" ` +
                    `不一致，以内联名为准（ADR-0086）`,
            );
        }
        // 嵌套声明资源节点补 warn（不改变收集行为，见 warnNestedResourceNodes）
        warnNestedResourceNodes(root, warn);
        return {
            root,
            name: declared.name,
            modifierOpen: declared.modifierOpen,
            inherit: declared.inherit,
        };
    }

    /**
     * 自 `el`（含自身）沿 `parentElement` 向上取最近的 scope 根元素所属 scope。
     *
     * `findScopeByEl` 是**精确匹配**（`scope.el === el`），供 Runtime 指令「我自己的元素 → 我的 scope」
     * 用；声明处语义要求的是 x-define 那套「最近祖先 scope」归属（ADR-0022 决策：`_linkParent`
     * 同构），故此处自行上溯——否则传入一个普通容器元素会查不到而降级全局（可见域静默放大）。
     */
    private _findNearestScopeOf(el: HTMLElement): AutoSparkScope | undefined {
        for (let cur: HTMLElement | null = el; cur; cur = cur.parentElement) {
            const scope = this.findScopeByEl(cur);
            if (scope) return scope;
        }
        return undefined;
    }

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
    registerComponent(
        code: string,
        opts?: { name?: string; scope?: AutoSparkScope; el?: HTMLElement },
    ): ComponentDef | null {
        const warn = (msg: string) => this.logger.warn(msg);
        // ① 声明处归属：scope 与 el 同义，同时传入以 scope 为准
        let ownerScope: AutoSparkScope | null = null;
        if (opts?.scope) {
            if (opts.el) {
                warn(
                    "engine.registerComponent: scope 与 el 同时传入，以 scope 为准（el 忽略，ADR-0086）",
                );
            }
            ownerScope = opts.scope;
        } else if (opts?.el) {
            ownerScope = this._findNearestScopeOf(opts.el) ?? null;
            if (!ownerScope) {
                warn(
                    "engine.registerComponent: el 未对应任何 scope（含向上祖先），已降级为全局注册（ADR-0086）",
                );
            }
        }
        const owner = ownerScope; // const 别名：闭包内可安全窄化
        const global = owner === null;

        // ② 归一化 + 声明校验（严格单根、必带 x-define）
        const parsed = this.parseComponentCode(code, opts?.name);
        if (!parsed) return null;
        const { root, name, modifierOpen, inherit } = parsed;

        // ③ 覆盖 warn（per 注册目标 per 名去重——与 x-import 同款机制，ADR-0065 决策三）
        const existed = global
            ? this._globalComponentDefs.has(name) || this.options.components?.[name] != null
            : owner.components?.[name] != null;
        if (existed) {
            const warned = global
                ? this._overrideWarnedGlobal
                : (this._overrideWarnedScope.get(owner) ??
                  (() => {
                      const s = new Set<string>();
                      this._overrideWarnedScope.set(owner, s);
                      return s;
                  })());
            if (!warned.has(name)) {
                warned.add(name);
                warn(
                    `组件注册覆盖："${name}"（${global ? "全局组件表" : "作用域"}已有同名组件，已被覆盖，ADR-0086）`,
                );
            }
        }

        // ④ 组装子定义（declarerScope = 声明处；.open 修饰符并入边界声明）
        const childDef = buildComponentDef(root, name, warn, owner, modifierOpen);

        // ⑤ 登记尾巴（解析成功 / 无继承共用）：作用域挂 components（保 HTMLElement 契约）／全局入定义表
        const registerResolved = (resolved: ComponentDef): void => {
            this.registerComponentDef(resolved);
            if (owner) {
                if (!owner.components) owner.components = {};
                owner.components[name] = resolved.snapshot;
            } else {
                this._globalComponentDefs.set(name, resolved);
            }
        };

        // ⑥ 继承解析（与编译器 / x-import 同一管线）
        let finalDef: ComponentDef = childDef;
        if (inherit !== null) {
            const lookupParent = (pname: string): ComponentDef | null => {
                const snap = owner
                    ? (owner.getComponentDeclaration(pname) ??
                      this._resolveGlobalComponent(pname) ??
                      null)
                    : (this._resolveGlobalComponent(pname) ?? null);
                if (!snap) return null;
                return this.getComponentDef(snap) ?? this.getGlobalComponentDef(pname) ?? null;
            };
            const attempt = (): InheritResolveResult =>
                resolveComponentInheritance({
                    componentEl: root,
                    name,
                    inherit,
                    modifierOpen,
                    childDef,
                    lookupParent,
                    warn,
                    deferMissingParent: true,
                });
            const first = attempt();
            if (first === PENDING_PARENT) {
                warn(
                    `x-define "${name}": 父组件 "${inherit}" 暂未就绪，已挂起` +
                        `（父注册后自动解析，ADR-0083）`,
                );
                this.addPendingInherit(inherit, () => {
                    const retry = attempt();
                    if (retry === PENDING_PARENT) return false; // 同名注册不在可见链——继续等
                    if (retry) {
                        registerResolved(retry);
                        this._afterComponentRegistered(name, global); // 发事件 + 级联排水（ADR-0085）
                    }
                    return true; // 解析成功或终局失败（已 warn），均出队
                });
                return null; // 本次不注册；返回 null 与「终局拒绝」同形（调用方据 warn 区分）
            }
            if (!first) return null;
            finalDef = first;
        }
        registerResolved(finalDef);
        this._afterComponentRegistered(name, global); // 发事件 + 排水（ADR-0085）
        return finalDef;
    }

    /**
     * 动态 patch：修改模板片段并增量同步到运行树（ADR-0002）。
     *
     * 开发者在 `updater` 回调里就地修改 `engine.template` 的某个 scope 子树（回调入参即命中的
     * 模板元素），本方法据 `updater` 返回值决定重建范围，**只动 patch 目标子树，保留其余运行态**
     * （焦点/滚动/未提交输入）。selector 对 `engine.template` querySelector；命中须为 scope
     * （含指令或 `{{}}` 插值的元素；纯静态裸元素需挂 `x-scope` 哨兵）。
     *
     * **返回四态**（判定用 `===`/`typeof`，`undefined != null` 严格区分）：
     * - `void`/`undefined` 或 `=== templateEl` → **子树重建**（复用 `recompileSubtree`）
     * - 新 `Node`（`!== templateEl`）→ **替换自身**
     * - `string`（HTML）→ **替换自身**（`<template>` 解析，可多节点，空串=删除）
     * - `null` → **删除自身**
     *
     * **动态区域守卫**：patch 目标自身或祖先链含 ownsChildren 结构指令（x-for / eager x-if /
     * x-isolate / eager x-switch）→ 拒绝（运行侧结构非同构，正向桥不可靠）。
     *
     * updater 抛错则记日志、不重建；patch 后同步 `flushAll`，返回时 DOM 已更新。dispatcher 经
     * MutationObserver 自动处理新/旧节点的 runtime 指令 mount/unmount，patch 不直接操作。
     *
     * @param selector 对 `engine.template` 的 CSS 选择器（命中的须为 scope 元素）
     * @param updater  接收命中的模板元素，就地修改；返回值决定重建语义
     */
    patch(
        selector: string,
        updater: (templateEl: HTMLElement) => Node | string | null | undefined,
    ): this {
        const hit = this.template.querySelector(selector);
        if (!hit || !(hit instanceof HTMLElement)) {
            this.logger.warn(`engine.patch: selector "${selector}" 未命中模板元素`);
            return this;
        }
        const T = hit;
        if (this._isInDynamicRegion(T)) {
            this.logger.warn(
                `engine.patch: "${selector}" 处于动态区域（x-for/x-if/x-isolate），拒绝`,
            );
            return this;
        }
        const scope = this.compiler.getScopeByTemplate(T);
        if (!scope) {
            this.logger.warn(
                `engine.patch: "${selector}" 非 scope 元素（无指令/插值），需挂 x-scope`,
            );
            return this;
        }
        const el = scope.el;
        if (!el) {
            this.logger.warn(`engine.patch: "${selector}" 的 scope 已失效（运行元素被回收）`);
            return this;
        }
        this.emit("engine/patch/before", { selector, el });
        let R: Node | string | null | undefined;
        try {
            R = updater(T);
        } catch (e: any) {
            this.logger.error(`engine.patch updater 抛错，不重建: ${e?.message ?? e}`);
            return this;
        }
        if (R === null) {
            this._deleteSelf(scope, T, el);
        } else if (R === undefined || R === T) {
            recompileSubtree(scope, el);
        } else if (typeof R === "string") {
            const frag = parseHtmlFragment(R);
            const nodes = frag ? Array.from(frag.childNodes) : [];
            if (nodes.length === 0) {
                this._deleteSelf(scope, T, el);
            } else {
                this._replaceSelf(scope, T, el, nodes);
            }
        } else if (R instanceof Node) {
            this._replaceSelf(scope, T, el, [R]);
        } else {
            this.logger.warn(`engine.patch: updater 返回了非法类型（${typeof R}），已忽略`);
            return this;
        }
        this.scheduler.flushAll();
        this.emit("engine/patch/after", { selector });
        return this;
    }

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
    findScopeByEl(el: HTMLElement): AutoSparkScope | undefined {
        for (const scope of this.scopes.values()) {
            if (scope.el === el) return scope;
        }
        return undefined;
    }

    /**
     * 注册组件定义（ADR-0022 决策二-1）。compiler `_collectComponent` 建好 def 后调用，以快照根为 key 存入。
     *
     * 同时是**全局样式段注入的收口点**（ADR-0087）：五条注册路径（本地 x-define / 继承解析 /
     * x-import 远程 / 运行时注册 / 全局组件懒预编译）全走本方法——「凡注册必注入」，
     * global 段无实例化依赖，声明即生效。
     */
    registerComponentDef(def: ComponentDef): void {
        this._componentDefs.set(def.snapshot, def);
        injectGlobalComponentStyles(this, def);
    }

    /** 挂起的继承解析表（ADR-0083）：父名 → 待重试任务队列（父未就绪时压入，注册事件排水） */
    private _pendingInherits = new Map<string, Array<() => boolean>>();

    /**
     * 挂起一条继承解析（ADR-0083）：父组件未就绪（可能来自 x-import 异步加载）时由
     * compiler / 远程注册路径调用。任务约定：返回 `true` = 出队（解析成功或终局失败），
     * `false` = 继续等待（本次注册的同名组件不在子组件可见链上）。
     */
    addPendingInherit(parentName: string, task: () => boolean): void {
        const arr = this._pendingInherits.get(parentName) ?? [];
        arr.push(task);
        this._pendingInherits.set(parentName, arr);
    }

    /**
     * 排水挂起继承（ADR-0083）：组件注册后调用——重试等待该名的
     * 全部任务；任务注册的新组件经其自身注册路径递归排水（链式继承任意到达顺序逐级解锁）。
     */
    _drainPendingInherits(name: string): void {
        const tasks = this._pendingInherits.get(name);
        if (!tasks || tasks.length === 0) return;
        const keep = tasks.filter((task) => !task());
        if (keep.length > 0) this._pendingInherits.set(name, keep);
        else this._pendingInherits.delete(name);
    }

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
    _afterComponentRegistered(name: string, global: boolean): void {
        this.emit(`components/${name}/registered` as any, { name, global }, true);
        this._drainPendingInherits(name);
    }

    /** fetch 失败时提示仍未就绪的挂起继承名（ADR-0083 诊断补偿：typo 与异步未归的兜底线索） */
    private _warnPendingInheritsIfAny(reason: string): void {
        if (this._pendingInherits.size === 0) return;
        const names = [...this._pendingInherits.keys()].join("、");
        this.logger.warn(
            `x-define:inherit: ${reason}，以下父组件仍未就绪（疑为拼写错误或其来源加载失败）: ${names}`,
        );
    }

    /**
     * 经组件冻结快照根反查组件定义（ADR-0022）。
     *
     * `getComponentDeclaration(name)` 返回 HTMLElement 快照（保持 x-loading 等消费者契约不变）；x-component 实例化时
     * 经快照反查本方法取 def（setup/hooks/styles/parent/components）以注入组件语义。
     * 局部组件经 `_componentDefs`（WeakMap）；全局组件经 `_globalComponentDefCache`。
     */
    getComponentDef(snapshot: HTMLElement): ComponentDef | undefined {
        return this._componentDefs.get(snapshot);
    }

    /**
     * 取全局组件定义（ADR-0022 决策二-1；ADR-0086 单表）。`options.components` 惰性预编译或
     * `registerComponent` 即时注册时入表。供 x-component 实例化全局组件时取 setup/hooks/styles。
     */
    getGlobalComponentDef(name: string): ComponentDef | undefined {
        return this._globalComponentDefs.get(name) ?? undefined;
    }

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
    getOverlay(
        el: HTMLElement | null | undefined,
        name: string,
        options?: Record<string, any>,
    ): OverlayHandle | undefined {
        const scope = el ? this.findScopeByEl(el) : undefined;
        const snapshot = scope
            ? scope.getComponentDeclaration(name)
            : (this._resolveGlobalComponent(name) ?? undefined);
        if (!snapshot) {
            this.logger.warn(
                `engine.getOverlay("${name}"): 未找到覆盖物组件（${el ? "scope 链与全局" : "全局"}均未命中，ADR-0052 决策 15）`,
            );
            return undefined;
        }
        const def = this.getComponentDef(snapshot) ?? this.getGlobalComponentDef(name) ?? null;
        return new OverlayHandle(this, name, snapshot, def, options ?? null, scope ?? null);
    }

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
    async importComponentsFromUrl(
        url: string,
        ownerScope: AutoSparkScope | null,
        global: boolean,
        request?: RequestInit,
        signal?: AbortSignal,
    ): Promise<string[] | null> {
        // 缓存/循环检测 key（ADR-0065 决策九）：url + 序列化 request；无 request 退化为裸 url
        const cacheKey = request ? `${url}##${JSON.stringify(request)}` : url;
        // 循环 import 检测（决策六-4）
        if (this._importingUrls.has(cacheKey)) {
            this.logger.warn(`x-import: 检测到循环引用 "${url}"，已中断该导入链。`);
            return [];
        }
        // url 缓存命中：直接复用解析结果
        let elements: HTMLElement[];
        if (this._importUrlCache.has(cacheKey)) {
            elements = this._importUrlCache.get(cacheKey)!;
        } else {
            this._importingUrls.add(cacheKey);
            let html: string;
            try {
                html = await fetchHtml(url, signal, request);
            } catch (e: any) {
                this.logger.warn(`x-import: 加载 "${url}" 失败: ${e?.message ?? e}`);
                this._warnPendingInheritsIfAny(`远程加载 "${url}" 失败`);
                this._importingUrls.delete(cacheKey);
                return null;
            }
            this._importingUrls.delete(cacheKey);
            const frag = parseHtmlFragment(html);
            if (!frag) {
                this.logger.warn(`x-import: "${url}" 解析为空，无组件可注册。`);
                return null;
            }
            elements = Array.from(frag.children).filter(
                (n): n is HTMLElement => n instanceof HTMLElement && n.hasAttribute("x-define"),
            );
            this._importUrlCache.set(cacheKey, elements);
        }
        // 注册各组件
        const registered: string[] = [];
        for (const el of elements) {
            const name = (el.getAttribute("x-define") ?? "").trim() || "default";
            // 覆盖 warn（ADR-0065 决策三）：远程版覆盖已注册同名组件时警告（loader「以此 url 为准」
            // 与 x-import 同口径）；per 注册目标 per 名去重——缓存命中重跑注册循环不刷屏
            const existed = global
                ? this.options.components?.[name] != null || this._globalComponentDefs.has(name)
                : ownerScope?.components?.[name] != null;
            if (existed) {
                const warned = global
                    ? this._overrideWarnedGlobal
                    : (this._overrideWarnedScope.get(ownerScope!) ??
                      (() => {
                          const s = new Set<string>();
                          this._overrideWarnedScope.set(ownerScope!, s);
                          return s;
                      })());
                if (!warned.has(name)) {
                    warned.add(name);
                    this.logger.warn(
                        `远程组件覆盖注册："${name}"（${global ? "全局组件表" : "作用域"}已有同名组件，已被远程版覆盖，ADR-0065）`,
                    );
                }
            }
            // declarerScope：作用域注册挂 ownerScope（ADR-0053 declarer 基准）；全局注册无声明 scope → null
            const def = buildComponentDef(
                el,
                name,
                (msg) => this.logger.warn(msg),
                global ? null : (ownerScope ?? null),
            );
            // 注册尾巴（解析成功 / 无继承共用）：作用域挂 ownerScope.components；
            // 全局写全局组件定义表（ADR-0086 决策三：不再写 options.components + 清缓存重懒预编译
            // ——那会把 def 序列化成快照 outerHTML 再解析回来，快照已剥离的 <script setup>/<style>
            // 无法复原，setup/styles 会在往返中丢失；直接入表既保真又免一次解析）
            const registerResolved = (resolved: ComponentDef): void => {
                this.registerComponentDef(resolved);
                if (global) {
                    this._globalComponentDefs.set(name, resolved);
                } else if (ownerScope) {
                    if (!ownerScope.components) ownerScope.components = {};
                    ownerScope.components[name] = resolved.snapshot;
                }
            };
            // 继承解析（ADR-0081 + ADR-0083）：远程子组件继承本地/全局父——同一查找协议（ownerScope
            // 链就近 + 全局兜底；全局注册仅查全局）。终局失败 warn + 拒绝注册（不入 registered 清单）；
            // 父未就绪挂起 pending 表（父可能来自其他异步 url），registered 排水重试。
            // 远程路径本就不解析 .open 修饰符，传 false 一致。
            let finalDef: ComponentDef = def;
            const inherit = readInheritAttr(el);
            if (inherit !== null) {
                const lookupParent = (pname: string): ComponentDef | null => {
                    const snap = global
                        ? (this._resolveGlobalComponent(pname) ?? null)
                        : (ownerScope?.getComponentDeclaration(pname) ??
                          this._resolveGlobalComponent(pname) ??
                          null);
                    if (!snap) return null;
                    return this.getComponentDef(snap) ?? this.getGlobalComponentDef(pname) ?? null;
                };
                const attempt = (): InheritResolveResult =>
                    resolveComponentInheritance({
                        componentEl: el,
                        name,
                        inherit,
                        modifierOpen: false,
                        childDef: def,
                        lookupParent,
                        warn: (msg) => this.logger.warn(msg),
                        deferMissingParent: true,
                    });
                const first = attempt();
                if (first === PENDING_PARENT) {
                    this.logger.warn(
                        `x-define "${name}": 父组件 "${inherit}" 暂未就绪，已挂起（若来自 x-import 将在加载后自动解析，ADR-0083）`,
                    );
                    this.addPendingInherit(inherit, () => {
                        const retry = attempt();
                        if (retry === PENDING_PARENT) return false; // 同名注册不在可见链——继续等
                        if (retry) {
                            registerResolved(retry);
                            this._afterComponentRegistered(name, global); // 发事件 + 级联排水（ADR-0085）
                        }
                        return true; // 成功或终局失败（已 warn）均出队
                    });
                    continue; // 本次不注册、不入 registered 清单
                }
                if (!first) continue;
                finalDef = first;
            }
            registerResolved(finalDef);
            registered.push(name);
            // 发事件 + 排水（ADR-0085）：本组件可能是他处挂起继承等待的异步父
            this._afterComponentRegistered(name, global);
        }
        return registered;
    }

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
    private _replaceSelf(
        scope: AutoSparkScope,
        T: HTMLElement,
        el: HTMLElement,
        templateNodes: Node[],
    ) {
        // ① 模板侧先替换：templateNodes 进 engine.template，后续 _linkParent 沿新祖先链生效
        T.replaceWith(...templateNodes);
        // ② destroy 旧 scope（从 parent.children 移除 + 递归 off watcher + 指令 destroy）
        scope.destroy();
        // ③ 编译新节点建新 scope（HTMLElement 走 transformElement 递归 + 文本插值）
        let runtimeNodes: Node[];
        try {
            runtimeNodes = this.compiler.compileChildNodes(templateNodes, scope.parent);
        } catch (e: any) {
            this.logger.error(
                `engine.patch 编译失败，模板已变更但运行树可能未同步: ${e?.message ?? e}`,
            );
            return;
        }
        // ④ 运行侧替换；dispatcher 检测 add → runtime 指令 mounted（自动）
        el.replaceWith(...runtimeNodes);
    }

    /**
     * patch 删除自身：destroy scope + 模板/运行双侧移除（`null` 与空串共用同一路径）。
     *
     * dispatcher 检测 el remove → runtime 指令 unmounted（自动）。
     */
    private _deleteSelf(scope: AutoSparkScope, T: HTMLElement, el: HTMLElement) {
        scope.destroy();
        T.remove();
        el.remove();
    }

    /**
     * 动态区域判定：T 自身或祖先链上有 ownsChildren 结构指令（x-for / eager x-if / x-isolate / eager x-switch）。
     *
     * 这些区域的运行侧结构由指令运行时生成，与模板非同构，正向桥不可靠——patch 落入即拒绝。
     * 沿 templateScopeMap 上溯，O(树深)。
     */
    private _isInDynamicRegion(T: HTMLElement): boolean {
        let p: HTMLElement | null = T;
        while (p) {
            const scope = this.compiler.getScopeByTemplate(p);
            if (scope && this.compiler.scopeOwnsChildren(scope)) return true;
            p = p.parentElement;
        }
        return false;
    }

    /**
     * 彻底销毁引擎：清空调度队列、销毁所有 scope（off watcher + 删 computed）、
     * 移除挂载 DOM。
     *
     * **store 销毁纪律（ADR-0044）**：store 恒为 engine 自建，恒调 `store.destroy()` 回收其
     * computedObjects / 事件订阅 / Proxy 等 core 资源（内部先向 configManager 注销本 store）；
     * 随后仅销毁 engine 自建的默认 configManager，消费者经 `storeOptions.configManager`
     * 传入的不动（所有权对称）。
     */
    destroy(): void {
        this.emit("engine/destroy/before");
        // 类级销毁：对所有已 initialize 的指令类调用 static dispose(engine)。
        this.directives.disposeAll();
        // 断开 runtime 共享 observer + 卸载全部 live 实例（先于 DOM 清理，避免拆 DOM 时空转回调）
        this.dispatcher.dispose();
        this.scheduler.clear();
        // 取消全部在播动画（离场的延迟移除同步完成——先于 scope/DOM 清理，杜绝销毁后回调触 DOM）
        this.animate.dispose();
        for (const scope of this.scopes.values()) {
            scope.destroy();
        }
        this.scopes.clear();
        // 覆盖物容器整体移除（ADR-0052 决策 13）：实例 scope 已随上方 scope 树级联销毁
        removeOverlayContainer(this);
        // 工具提示收口（ADR-0061）：摘委托监听 + tooltip 容器整体移除 + 清计时器/兜底循环
        this.tooltipManager.dispose();
        // 消息收口（ADR-0071 决策 10/18）：全部立即销毁（无动画——离场的延迟移除已被上方
        // animate.dispose 同步完成）+ 消息容器整体移除 + 持久化终态 flush（keepalive 兜底）
        this.messages.dispose();
        this.el.replaceChildren();
        // 移除 engine 根标识（ADR-0060，与构造期打点对称）
        this.el.removeAttribute("data-autospark");
        this.pending = false;
        // store 恒为 engine 自建（ADR-0044）：销毁回收 core 资源；destroy 内部向 configManager 注销本 store
        // 全局组件定义表清空（ADR-0086：含运行时注册的组件——注册生命周期随 engine）
        this._globalComponentDefs.clear();
        // 组件全局样式段移除（ADR-0087）：只移除本 engine 贡献的段，不误伤共页其他 engine；
        // 段清空的容器连 <style> 元素一并移除
        releaseEngineGlobalStyles(this);
        // 挂起继承清表（ADR-0083）：未就绪的异步父任务随 engine 一并废弃
        this._pendingInherits.clear();
        this.store.destroy();
        // 仅销毁 engine 自建的默认 configManager（先 store 后 cm，保证注销次序）；消费者传入的不动
        if (this._ownedConfigManager) {
            this._ownedConfigManager.destroy();
            this._ownedConfigManager = null;
        }
        this.emit("engine/destroy/after");
    }
}
