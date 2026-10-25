import { AutoSparkDirectiveBase, type RuntimeDirective } from "../features/directive/base";
import type { AutoSpark } from "../engine/engine";
export declare class LoadingDirective extends AutoSparkDirectiveBase implements RuntimeDirective {
    /** 运行时指令：走 observer 通道（由 engine 级 RuntimeObserverDispatcher 驱动，见 ADR-0003 决策 7） */
    static readonly kind: 1;
    /**
     * 类级初始化：注入全局样式。
     *
     * observer 通道（observer + 实例表 + 初始扫描）已移交 engine 级 RuntimeObserverDispatcher，
     * 指令不再自建。样式注入须在 dispatcher 初始扫描（触发首次 mounted → mountOverlay）**之前**完成
     * ——FOUC 防御；initializeAll 在 dispatcher.start() 之前调用，顺序保证。幂等（stylesInjected）。
     */
    static initialize(_engine: AutoSpark): void;
    /** 当前已挂载的覆盖层（= 编译后的块根；未挂载时为 null）；delay 窗口期内仍为 null */
    private overlay;
    /** 已挂载覆盖层对应的块 scope（attrChanged 细粒度 patch 其 data；unmount 时 destroy） */
    private blockScope;
    /** delay 定时器句柄（延迟挂载未触发时存在） */
    private delayTimer;
    /** 解析后的配置（mounted 中赋值，definite assignment） */
    private config;
    /** value 当前值的读取函数（路径支路 getVal / 表达式支路 with(state) 求值） */
    private _read;
    /** 未注册名的合成透传 descriptor 缓存（按名复用，ADR-0038 决策 4；随实例生死） */
    private _synthetics;
    /** 元素挂载（dispatcher 检测到 add / 初始扫描）：解析配置 + 字面量/反应式分流 + 首渲 */
    mounted(): void;
    /**
     * 判定 value 是否为字面量布尔。
     *
     * - 空（裸 `x-loading` / 未指定 value）≡ `true`：符合"加了就显示"的直觉；
     * - `true` / `false`（大小写不敏感）为特殊布尔字面量，**非**状态路径——便于静态快速控制显隐；
     * - 其余返回 null → 走反应式（`engine.store` 全局路径/表达式）。
     *
     * @returns true/false 表示字面量静态显隐；null 表示走反应式订阅
     */
    private resolveLiteral;
    /** 元素移除（dispatcher 检测到 remove）：清理订阅 / 定时器 / 覆盖层 DOM */
    unmounted(): void;
    /**
     * 属性值变化（dispatcher 检测到 setAttribute）：细粒度 patch，不重编译块（ADR-0021 决策 12-(d)）。
     *
     * 解析新 config 后：
     * - **视觉字段**（message/color/bgColor/opacity）→ `Object.assign` 进块 data，块内绑定经
     *   响应式字段级细粒度更新；同时重算壳样式（bg/opacity 既是 data 值、又是 overlay 背景）写回块根；
     * - **value** → 重判显隐（show/hide），delay 重置定时器；
     * - **selector** → 变化需移位，重建 overlay（块随之重编译重注入）。
     *
     * 仅当 selector 变化（须移位）或覆盖层尚未挂载时走重建；否则走细粒度 patch，保留已编译块。
     */
    /**
     * 属性值变化（dispatcher 检测到 setAttribute）：重建 overlay（ADR-0021 决策 12-d）。
     *
     * 解析新 config 后整体 teardown + remount：块随新 config 重新编译、data 重新注入、
     * 壳样式重算。**不细粒度 patch 既有块**——attrChanged 是编程式 setAttribute 的罕见路径，
     * 重建最简且正确（避免块已编译的 data/订阅与 dispatcher 时序耦合）。块内 message/color
     * 等随新 config 重新编译即取新值。
     */
    attrChanged(newVal: string, _oldVal?: string): void;
    /**
     * 建立 value 订阅（engine.store 全局，无 scope）。
     *
     * - 路径支路（isSimpleStatePath）→ `store.watch(path)` 精准订阅，`getVal` 读当前值；
     * - 表达式支路（如 `a && !b`）→ `collectDependencies` 收集读依赖后订阅（仅全局 state，
     *   不支持 scope 局部变量）。回调经 toggle 显隐。
     */
    private _bindValue;
    /** 清理本实例全部资源：off watcher + 清 delay 定时器 + 销毁块 scope + 移除覆盖层 DOM */
    private _teardown;
    /**
     * 解析指令值：对象语法 → 配置绑定；否则 → 快速绑定（整值即 value）。
     *
     * 指令选项层（`x-loading-options`，ADR-0007 解析期合并进 `this.options`）承载**视觉字段**
     * 补充配置（message/color/bgColor/opacity/delay/selector）——异步源指令（x-data/x-html）
     * 合成的 `loading:{...}` 选项经此接线生效（ADR-0033/0035）。合并方向：属性值**内联声明
     * 优先**（`x-loading="{value,...}"` 是主语义，`-options` 是补充层，不覆盖主声明）。
     */
    private parseConfig;
    /** 解析对象配置（relaxedToJson）；非对象/抛错 → warn + 空 value */
    private parseObject;
    /** 显隐总入口 */
    private toggle;
    /**
     * 显示覆盖层。
     *
     * 已挂载（overlay 非空）或延迟窗口期内（delayTimer 非空）直接返回，防重复。
     * delay>0 时 setTimeout 延迟挂载；否则立即挂载。
     */
    private show;
    /**
     * 隐藏：取消未触发的延迟挂载；移除已挂载的覆盖层（含块 scope 回收）。
     *
     * delay 窗口内回 false → 定时器取消、覆盖层从未挂载（防闪烁）。已挂载则销毁块 scope +
     * 移除覆盖层 DOM（重建式显隐，非 display 隐藏——与既有语义一致）。
     */
    private hide;
    /**
     * 是否进度条模式：`.progressbar` 修饰符启用（v1 **仅修饰符入口**——不读配置字段，
     * `x-loading-options` 里的同名键不生效；修饰符形态的运行时改值本就不触发 attrChanged，
     * 与 `.screen` 同款已知限制）。
     */
    private _isProgressbar;
    /**
     * 解析进度条模式内置条模板（不走 `getComponentDeclaration('loading')`——自定义组件的领域语义是
     * 「遮罩内容的替换」，条无内容可替换，故条模式**忽略自定义组件**，文档声明该边界）。
     * 与 {@link _resolveLoadingComponent} 的 DEFAULT_BLOCK 支路同构：字符串模板现解析取单根。
     */
    private _resolveProgressbarBlock;
    /**
     * 构建并挂载覆盖层（= 编译后的组件根）到目标元素（ADR-0022 承接 ADR-0021 决策 12）。
     *
     * 渲染统一走「编译组件」路径：取组件 = `getComponentDeclaration('loading') ?? DEFAULT_BLOCK`，深克隆 → 经 compileChild
     * 编译挂载（parentScope 为宿主 scope 使组件继承宿主数据上下文；**config 经 compileChild 第 5 参      * initialData 在 compile 前注入 data**，确保组件内 watch 首次求值即收集到 `$scopes.<id>.<field>`
     * 精准路径，后续 attrChanged 可字段级细粒度更新）→ 注入壳样式到组件根 → 挂到 target。
     *
     * 进度条模式（`.progressbar`）改取内置条模板 {@link _resolveProgressbarBlock}，其余路径相同。
     */
    private mountOverlay;
    /**
     * 解析 loading 块快照：自定义块优先（宿主 scope 链 + 全局兜底），未命中回退 DEFAULT_BLOCK。
     *
     * DEFAULT_BLOCK 是字符串模板，每次解析为新的根元素（无缓存需求——仅作兜底，自定义组件才走
     * engine 全局缓存）。返回的快照形态与自定义组件一致（含 x-define、未编译、保留指令属性）。
     */
    private _resolveLoadingComponent;
    /**
     * 注入覆盖层壳样式到块根（决策 12-(b)）：定位/铺满/背景/zindex/screen。
     *
     * 追加在块作者声明样式之后（覆盖定位冲突）。「覆盖层」语义由指令保证，块作者只管装内容。
     * screen 修饰符 → position:fixed 撑满视口；否则 position:absolute 撑满宿主（须宿主定位）。
     *
     * **进度条模式分支**：不铺遮罩——只注入定位（贴顶；screen → fixed 贴视口顶）、轨道底色
     * （`bgColor`+`opacity` 显式配置 → `rgba(bgColor, opacity)`，ADR-001 同通道；**两者皆缺省**
     * → 浅轨 {@link PROGRESSBAR_DEFAULT_TRACK}，深轨压暗段色）与段色（`style.color` →
     * currentColor，ADR-002 同通道）；贴顶/高度/裁剪/不拦截交互等静态布局归注入样式表
     * （height 留 CSS 变量供覆盖）。
     */
    private _applyShellStyle;
    /**
     * 构造注入块 data 的 config 视图（八字段：原七字段 + actions，决策 12-(c) Q7 / ADR-0038 决策 2）。
     *
     * `value` 是表达式串（如 `"order.isSubmit"`）——块内若 x-if="value" 期待布尔会拿到字符串，
     * 属已知脚枪（value 是宿主显隐逻辑，控制 overlay 挂载与否，非块内消费字段），文档已标注。
     * `actions` 为挂载时解析的动作按钮视图 `[{name, title}]`（见 {@link _actionsData}）。
     */
    private _configData;
    /**
     * 解析动作按钮数据视图：`[{name, title}]`（ADR-0038 决策 2）。
     *
     * 挂载时经 getAction 链解析 `title = ActionDesc.title ?? name`（内置 close 自带「关闭」，
     * 后注册的显示 name 兜底——快照语义、不做响应式追踪，attrChanged 重建时重新解析）。
     * 查找基准与 parentScope 同源（宿主 scope 链；宿主无 scope 时直接查全局表）。
     */
    private _actionsData;
    /**
     * 校验 actions 配置字段：须为字符串数组（ADR-0038 决策 1）。
     *
     * 非数组 / 缺失 → undefined（无按钮行）；数组内非（非空）字符串元素 warn 剪枝。
     */
    private _parseActionNames;
    /**
     * 取未注册 id 的合成透传 descriptor（ADR-0038 决策 4，与 ADR-0036 决策 7 内置信号型同构）：
     * `{id, title: id, handle: (p) => p}` 经 buildAction 包装（local=false → 总线 + DOM 双发），
     * 按 id 缓存复用。让未注册 id 同样走完整双通道广播——pending+resolved 同 tick、无 rejected。
     */
    private _syntheticAction;
    /**
     * 覆盖层级 click 委托（ADR-0038 决策 3）：块内任意 `data-action="<name>"` 元素点击即触发。
     *
     * 逐次现查（与 x-on「查找延迟到触发时」同哲学）：已注册走真 action（getAction 链——块
     * scope 的 parent 是宿主 scope，局部/全局 action 均可达），未注册走合成透传 descriptor，
     * 均以标准 AutoSparkActionContext（el=被点元素）调用 → buildAction 双通道广播。
     * 随后按 hide 约定键（决策 5，点击时现读 `desc.hide !== false`）自动隐藏（决策 6：
     * **先完整广播再移除**——监听方同步跑完；async 到 pending 即隐藏不等待 resolved）。
     */
    private _onOverlayClick;
    /**
     * 解析覆盖层挂载目标元素（经 {@link queryRelElement} 相对查询）。
     *
     * - 无 selector → 宿主元素 `this.el`；
     * - 其余按相对语法解析：普通选择器在宿主后代上查、`'../'` 父级爬升、`'/'` 全局、`'^'` closest；
     * - 未命中 / 非法选择器 → 回退宿主（命中失败不抛错、记 warn）。
     */
    private resolveTarget;
}
