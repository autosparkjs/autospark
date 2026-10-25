import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { AutoDirectiveInfo } from "../features/directive/types";
import type { AutoSparkScope } from "../engine/scope";
import type { AutoSpark } from "../engine/engine";
import { type ResolvedAnimate } from "../features/animate/animate";
/** 行内运行时实体：一个已渲染的节点行（ADR-0040） */
interface TreeNodeEntry {
    /** 复用 key（idField 值，无 id 回退层级路径） */
    key: unknown;
    /** 节点数据（响应式代理引用，复用时原地更新 localData 后 refresh） */
    node: any;
    /** 兄弟内序号（变 → json 子层 watch 路径失效 → 销毁重建，P1 简化） */
    index: number;
    /** 行根元素（节点模板编译产物，带 data-x-tree-row 标记） */
    row: HTMLElement;
    /** 行 scope（watcher 归属：子层渲染器的 watch 挂在此，行销毁级联清理） */
    scope: AutoSparkScope;
    /** localData（node + 循环变量；复用 Object.assign 原地更新，禁止换引用） */
    localData: Record<string, any>;
    /** 行内子容器元素（模板缺 x-tree-children 时为 null——该模板不递归） */
    childrenEl: HTMLElement | null;
    /** 本行模板自身是否声明了 toggle 触点标记（createEntry 时缓存——此时子容器已清空，
     *  查询不会误命中孙行的标记；整行 toggle 与标记收窄的判定依据，决策 10） */
    hasToggle: boolean;
    /** 本行模板自身是否声明了 check 复选触点标记（缓存时机同 hasToggle，决策 10） */
    hasCheck: boolean;
    /** 子层渲染器（展开且已建立时非空；eager 折叠销毁置空、keepalive 保活留存） */
    sub: TreeLayerRenderer | null;
    /** 当前子容器展示态（数据先行模型的 DOM 侧镜像，syncVisibility 的 diff 基准） */
    shown: boolean;
    /** 懒加载在途标志（ADR-0090 决策 6：去重挂行生命周期——同次展开不重发；
     *  eager 折叠销毁子层时同步清 → 再展开重发即免 API 重试，keepalive 保留） */
    loading: boolean;
    /** 懒加载错误态（ADR-0090 修订决策 6：fail 通道；null = 无错）。挂行生命周期——
     *  eager 折叠清、keepalive 保留；成功结算 / 重发（重展开、失效重载）即清 */
    error: Error | null;
    /** 错误接管前的宿主 data-tooltip 原值（undefined = 未接管；null = 原本不存在，清除时还原） */
    prevTooltip: string | null | undefined;
}
/**
 * 层渲染器：一个子容器（或根容器）内同级节点行的渲染单元。
 *
 * 职责（ADR-0040 决策 8）：行列表 key-diff（复用/新建/销毁）+ 各行子容器显隐同步
 * （展开回退合成 + 惰性写回后由 watcher 驱动）。逐层细粒度订阅
 * （childrenPath / .\* / .\*.expandField 三类 watcher）。
 *
 * watcher 归属 ownerScope（根层 = 指令 binding / 子层 = 父行 scope）：scope.destroy
 * 时统一 off；行销毁经 destroyEntry 显式递归（sub.destroy → scope.destroy → row.remove）。
 */
declare class TreeLayerRenderer {
    /** 宿主指令（模板/配置/引擎设施的来源） */
    private directive;
    /** 行插入目标容器（根层 = x-tree 宿主 / 子层 = 父行内子容器） */
    private containerEl;
    /** watcher 归属 scope（销毁级联 off） */
    private ownerScope;
    /** 本层 children 数组的 state 路径（根层 = 数据路径；子层逐层拼接；表达式数据源的深层 = null 无路径可订阅） */
    private childrenPath;
    /** 本层层级（根 = 0） */
    private level;
    /** 根到本层父节点的数据链（循环引用防呆：本层节点出现在链中 → warn + 跳过） */
    private ancestors;
    /** 父节点数据引用（根层 null，注入 $parent） */
    private parentEntry;
    /** 本层行索引：key → entry（文档序由 render 末尾重排保证） */
    readonly entries: Map<unknown, TreeNodeEntry>;
    /** 首次渲染标志：首渲中的显隐定位不播动画（ADR-0039 决策 6 首渲静默） */
    private firstRender;
    /** 已销毁标志：拦截 destroy 后仍被 scheduler 执行的 pending 回调（同一 flush 内的入队） */
    private dead;
    /** 本层订阅的退订函数（scope.watchers 段切片——eager 折叠销毁子层时显式退订，
     *  不能只靠行 scope 级联：子层 watcher 挂在**父行** scope 上，父行不销毁） */
    private unsubs;
    /** 通配订阅是否已建（根层数据异步到达时延迟补订——watchPath 通配在数据 undefined
     *  时 getVal 抛错，autostore 边界；子层数据必已就绪，构造期即订） */
    private wildcardsWatched;
    constructor(
    /** 宿主指令（模板/配置/引擎设施的来源） */
    directive: TreeDirective, 
    /** 行插入目标容器（根层 = x-tree 宿主 / 子层 = 父行内子容器） */
    containerEl: HTMLElement, 
    /** watcher 归属 scope（销毁级联 off） */
    ownerScope: AutoSparkScope, 
    /** 本层 children 数组的 state 路径（根层 = 数据路径；子层逐层拼接；表达式数据源的深层 = null 无路径可订阅） */
    childrenPath: string | null, 
    /** 本层层级（根 = 0） */
    level: number, 
    /** 根到本层父节点的数据链（循环引用防呆：本层节点出现在链中 → warn + 跳过） */
    ancestors: any[], 
    /** 父节点数据引用（根层 null，注入 $parent） */
    parentEntry: TreeNodeEntry | null);
    /** 本层 children 数据（经指令抽象读取，隔离字段配置差异） */
    private readChildren;
    /** 订阅并记录退订函数（切片 ownerScope.watchers 新增段） */
    private _track;
    /** 建立本层订阅：路径本体经 watchPath 直通（含数组索引数字段——scope.watch 双轨会把
     *  数字段误判为表达式走 with 求值，`nodes.0.children` 语法错；单段路径在数据 undefined
     *  时 getVal 安全返回 undefined，异步数据场景可构造期即订）；通配系列见 ensureWildcards */
    private _watch;
    /** 通配订阅（`.*` / `.*.expandField`）：数据就绪后才能建立。单根数据的根层特判：
     *  根层行即数据源本身（归一化包装数组在 state 无对应），显隐订阅直接下钻 expandField——
     *  `nodes.*.expand` 对对象键通配（nodes.id.expand 等）不含根对象自身。
     *  字段订阅（children/loaded/icon，ADR-0090 决策 7）同此特判：在途/错误结算 + 行局部刷新
     *  （localData 非响应式，$children/$leaf/$icon/$loading/$error 须显式刷——同刷 $expanded 模式）。 */
    ensureWildcards(): void;
    /** 懒加载字段（ADR-0090）：children 到达 → 自动置 loaded=true + 结算在途；loaded 写 false → 失效重载 */
    private onLazyData;
    /** 本层全部行局部刷新（icon 字段变化等轻量路径——不结算在途） */
    private refreshRows;
    /** 单行 localData 重算 + refresh（buildLocalData 带当前在途/错误态，$children/$leaf/$icon/$loading/$error 同步） */
    private refreshRow;
    /**
     * 行列表渲染：按 key diff（同 key 同 index 复用原地更新；异 index / 新 key 销毁重建——
     * P1 不做 x-for rebindItem 式行根 DOM 复用，树场景移动少见，留作 v2 优化点）。
     */
    render(): void;
    /**
     * 显隐同步（展开 watcher 回调）：遍历本层行，比对有效展开态与 DOM 侧镜像，
     * 差异行切换子容器显隐（带动画）+ 更新 $expanded 并 refresh（箭头方向等行内绑定）。
     * O(本层行数)，不依赖 watcher 回调参数定位具体行。
     */
    syncVisibility(): void;
    /** 展示子容器：keepalive 复用既有子层；eager（或首次）重建；display 恢复 + enter 动画 */
    private show;
    /** 隐藏子容器：leave 动画延迟最终态（display:none；eager 销毁子层——DOM inert 播完即清） */
    private hide;
    /** 销毁单行：递归销毁子层 → 行 scope.destroy（级联子层 watcher）→ 移除 DOM */
    destroyEntry(key: unknown): void;
    /** 仅清空本层全部行（不动 watcher、不置 dead）——根层空态（undefined / []）用：
     *  根层一旦建立常驻到指令销毁（空态退订本体 watcher 会让后续数据到达失聪）。 */
    clearRows(): void;
    /** 销毁本层全部（指令 destroy / eager 折叠 / 父行销毁级联）。
     *  显式退订本层 watcher——子层 watcher 挂在父行 scope 上，父行不销毁时
     *  scope.destroy 级联够不到；不退订则折叠销毁后父对象变更通知仍会触发本层
     *  render 重建全部行（折叠视觉失效）。幂等（dead 早退；退订函数残留于
     *  ownerScope.watchers 为死引用，scope.destroy 再调一次 unwatch 无害）。 */
    destroy(): void;
}
/**
 * x-tree：树形渲染（ADR-0040）——嵌套子容器递归渲染，DOM 即树。
 *
 * ```html
 * <ul x-tree="node of nodes" x-tree-options="{ defaultExpandLevel: 2, animate: 'slide' }">
 *   <li x-tree-node>
 *     <span x-tree-toggle x-text="$expanded ? '▾' : '▸'"></span>
 *     <span x-text="node.title"></span>
 *     <ul x-tree-children></ul>
 *   </li>
 *   <li x-empty>暂无数据</li>
 * </ul>
 * ```
 *
 * - **结构（决策 1）**：嵌套式子容器——`x-tree-children` 标记子节点渲染点，引擎对展开
 *   路径递归套用同一节点模板；缩进由 DOM 嵌套天然承担。容器直接子元素只认 `x-tree-node`
 *   （无值标记，值 warn 忽略）与 `x-empty`，其余 warn 丢弃（数据脚本静默跳过，同 x-for）。
 * - **节点模板三级优先（决策 3）**：原地 `x-tree-node` > `tree-node` 组件（scope 链就近 +
 *   全局兜底，getComponentDeclaration 惯例）> 内置默认模板（缩进 + 箭头 + nameField 字段）。
 * - **模板属性改写**：`x-tree-children` / `x-tree-toggle` 在收集期改写为 `data-x-tree-*`
 *   保留属性（编译会剥除全部 `x-*` 指令属性，运行时 click 委托 / 子容器定位需可寻址），
 *   行根打 `data-x-tree-row`（click 委托 closest 定位行）。
 * - **数据归一化（决策 5）**：单根对象归一为根数组；id 重复 / 循环引用 warn。key 唯一来源
 *   `idField`（`:key` warn 忽略），无 id 回退层级路径。只接受嵌套（childrenField）格式——
 *   平铺建树已移除（实现期修订三，ADR-0040 决策 5：建树是数据转换职责，归数据层处理）。
 * - **展开回退 + 惰性写回（决策 7）**：有效展开态 = `expandField 有值 ? !!值 :
 *   level + 1 < defaultExpandLevel`（default=1 即根层可见、根不展开）；**回退永不落盘**，
 *   仅用户 toggle 时刻写 `node[expandField] = !有效值`（数据先行，watcher 驱动显隐切换）。
 * - **折叠两态（决策 8）**：默认 eager（折叠 leave 动画播完后销毁子层——DOM inert 语义，
 *   ADR-0039 决策 9）；`.keepalive` 折叠仅 `display:none` 保活。display 翻转不走 x-if 的
 *   detach/锚点机制（子容器位置固定，且留文档流才可播 CSS 过渡）。
 * - **动画（决策 9，修订）**：子容器**整体** enter/leave（组动画非逐行），接入 ADR-0039
 *   Animator，`animate` 选项三形态照常；默认 `expand`（高度过渡——展开/折叠推动后续节点
 *   平滑跟进而非瞬跳，类名型 transform/opacity 动画不参与布局做不到）；首渲静默、连点抢占、
 *   eager 离场 inert 全部继承。
 * - **交互（决策 10 + P2/P3 交付）**：click 委托三路分流——① `x-tree-check` 标记元素 →
 *   复选（checkedField 写回 + cascade 级联：向下子孙全勾/全消、向上祖先重算；`$indeterminate`
 *   半选派生不落盘）；② `x-tree-toggle` 标记元素 → 展开/折叠（自定义模板收窄触点）；
 *   ③ 启用选中（配置 `selectedField`）后整行 → 选中（单选 toggle + 清全树 / `multiSelect`）。
 *   内置默认模板恒整行点击展开/折叠（修订七：启用选中时点行 = 选中 + 展开，antd 心智——
 *   收窄到标记是自定义模板的语义）。复选启用双通道（修订五）：自定义模板声明 `x-tree-check`
 *   标记（标记即交互）或零模板场景 `checkedField` 显式声明（选项即标记，默认模板自动带三态
 *   触点——与 selectedField 对称）。拖拽（`draggable: true`）：行根 draggable + HTML5 DnD
 *   委托，三态定位（上/下 1/4 边缘线、中段收纳）+ 环检测（拖入自身子孙拒绝），数据 splice
 *   写回驱动重渲染。
 * - **事件（决策 11 + ADR-0090 修订）**：`tree:expand` / `tree:collapse` / `tree:select`
 *   （detail `{id, node, level}`）、`tree:check`（另带 `checked`）、`tree:load`（懒加载请求，
 *   另带 `fail(err)` 失败回调）、`tree:loaded`（懒加载完成，另带 `children` 到达快照）、
 *   `tree:drop`（detail `{source, target, position}` 三段式），均冒泡，命名对齐 action 广播惯例。
 * - **空态（决策 12）**：`x-empty` 只认真空数组 `[]`（undefined 不认领——留给未来 loading）。
 * - **响应式颗粒度**：逐层细粒度（每层三个 watcher：childrenPath / .\* / .\*.expandField，
 *   expand 变化只切显隐不 diff 行；行内字段级更新由项内 watcher 细粒度 patch，同 x-for）；
 *   数据源为表达式（非纯路径）时仅结构变化可响应（表达式 watch 收集不到 expandField
 *   依赖——warn 提示用纯路径）。
 */
export declare class TreeDirective extends AutoSparkDirectiveBase {
    static readonly priority = 100;
    static readonly singleton = true;
    /** x-tree 永远占有子树：容器子元素是节点模板 / 空态模板，由本指令收集克隆，通用 walk 不得递归 */
    static ownsChildren(_info: AutoDirectiveInfo): boolean;
    /** 注入默认树样式（幂等；多 engine 实例共享 document） */
    static initialize(_engine: AutoSpark): void;
    private itemName;
    private indexName;
    private nodesPath;
    idField: string;
    childrenField: string;
    expandField: string;
    /** 选中字段（配置存在才启用选中交互——它改变整行点击语义，决策 10） */
    private selectedField;
    /** 多选模式（单选默认：写本行 + 清全树其他选中） */
    private multiSelect;
    /** 复选字段（默认 "checked"；显式声明（或模板 x-tree-check 标记）启用复选交互） */
    checkedField: string;
    /** checkedField 是否经选项显式声明（零模板场景的启用信号——默认模板据此带触点） */
    private checkDeclared;
    /** 复选级联（父→子孙全勾/全消、子→祖先重算；false 各节点独立） */
    private cascade;
    /** 拖拽启用（行根 draggable + DnD 委托 + 三态定位，决策 10/P3） */
    private draggable;
    /** 加载指示字段（懒加载判据，默认 "loaded"；值严格 false 即未加载，ADR-0090 决策 1） */
    loadedField: string;
    /** 节点图标覆盖字段（默认模板 $icon 的覆盖来源，默认 "icon"；单名或 "close,open" 对，ADR-0090） */
    iconField: string;
    /** 默认模板是否渲染节点图标（icon 选项，默认 true；false = 回到无图标布局，ADR-0090 决策 10） */
    showIcon: boolean;
    private nameField;
    private defaultExpandLevel;
    keepalive: boolean;
    /** animate 选项解析结果（enter/leave 各相；未配置时默认 expand 高度过渡，见 resolveConfig） */
    anim: ResolvedAnimate;
    /** 节点模板快照（已属性改写：data-x-tree-* + 行根标记；克隆自三级优先胜出者） */
    private nodeTemplate;
    /** x-empty 空态模板快照（文档序） */
    private emptyTemplates;
    private emptyNodes;
    private emptyScopes;
    /** 行根 → entry 运行时映射（click 委托定位） */
    private rowMap;
    /** 根层渲染器 */
    private rootLayer;
    /** 首渲静默标志（microtask 首渲期间为 true，此后显隐变化才动画） */
    private firstCompile;
    /** 复选交互启用（模板声明 data-x-tree-check 触点，resolveNodeTemplate 判定） */
    private checkEnabled;
    /** 节点模板是否递归（含 x-tree-children）——懒加载触发门（ADR-0090 决策 5：非递归
     *  模板无子容器可填充，不发 tree:load） */
    private recurses;
    /** 三级兜底用了内置默认模板（整行 toggle 语义恒定——启用选中时点行 = 选中 + 展开） */
    private usedDefaultTemplate;
    /** 拖拽源行（dragstart 记录、drop/dragend 清除；null = 非拖拽中） */
    private dragEntry;
    /** 当前挂三态指示的行（dragover 切换、结束清除） */
    private dropMarkRow;
    /** 容器级 click 委托（arrow function 绑定 this，destroy 移除） */
    private onClick;
    /** 容器级 DnD 委托（draggable 启用时挂载） */
    private onDragStart;
    private onDragOver;
    private onDragLeave;
    private onDrop;
    private onDragEnd;
    created(): void;
    destroy(): void;
    /** 解析 "node of nodes"（of 必写，对齐 x-for；node,index 自定义序号名可选）+ 冲突防呆 */
    private parse;
    /** 指令选项一次性解析（回退链 getOption，ADR-0007）+ 非法值防呆 */
    private resolveConfig;
    /** 节点模板三级优先：原地 x-tree-node > tree-node 组件 > 内置默认（决策 3） */
    private resolveNodeTemplate;
    /**
     * 模板快照属性改写：`x-tree-children` / `x-tree-toggle` / `x-tree-check` → `data-x-tree-*`
     * （编译剥除全部 x-* 指令属性，运行时 click 委托 / 子容器定位需保留可寻址标记），
     * 行根打 data-x-tree-row。
     */
    private rewriteMarks;
    /** 数据源是否纯状态路径（决定订阅通道；含索引数字段仍是合法路径） */
    isSimplePath(path: string): boolean;
    /** 根层数据：归一化（单根→数组）。undefined/null 返回 null（不认领空态）。
     *  单根时根数组是**归一化包装**（state 里是对象、无数字键）——子层路径不可经
     *  `nodes.0` 索引段（不存在），经 nextChildrenPath 的 singleRoot 分支直接下钻 */
    private normalizeRoots;
    /** 数据源为单根对象（normalizeRoots 检测更新）——子层路径拼接与根层显隐订阅的特判依据 */
    singleRoot: boolean;
    /** 某节点的子数据（读 childrenField；根层 parent=null 时返回归一化根数组） */
    childrenOf(parentNode: any): any[];
    /** 子层的 children 数组 state 路径（逐层拼接含 index——index 变的复用分支已销毁重建，
     *  路径恒有效；单根数据的根层子路径直接下钻 childrenField——归一化包装数组在 state
     *  中无对应（nodes.0 不存在），不可经索引段；表达式数据源的深层无纯路径可订阅，
     *  返回 null 仅结构变化可响应） */
    nextChildrenPath(parentPath: string | null, index: number): string | null;
    /** 节点复用 key：idField 值；缺省回退层级路径（父 key + 序号） */
    evalKey(node: any, parentKey: unknown, index: number): unknown;
    /** 有效展开态（决策 7）：expandField 有值用值（undefined 视为无值），否则按层级回退
     *  （defaultExpandLevel=N 即前 N 层可见：level ≤ N-2 的节点回退展开） */
    effectiveExpanded(node: any, level: number): boolean;
    /** 懒加载未就绪判据（ADR-0090 决策 1）：值严格 false——字段不存在（undefined）天然
     *  非懒加载节点，无需单独存在性检查；true / 其他值均视为已加载或不适用 */
    isUnloaded(node: any): boolean;
    /** 节点局部数据：自定义变量名 + 循环变量（$ 前缀，对齐 x-for 派生变量惯例；
     *  $indeterminate 半选 / $loading 在途 / $error 错误 / $icon 图标均为派生值不落盘，
     *  ADR-0040 决策 13、ADR-0090 决策 6/10 及修订）。$leaf 对未加载节点恒假（决策 1：未加载 ≠ 叶子） */
    buildLocalData(node: any, index: number, length: number, level: number, parent: any, loading?: boolean, error?: Error | null): Record<string, any>;
    /** 节点图标状态机（$icon 派生，不落盘，ADR-0090 决策 11 + 修订）：
     *  loading > 错误 file-error > 未加载 unknown > node[iconField] 覆盖 > 有子 folder/folder-open > 叶子 file。
     *  覆盖值 "close,open" 逗号对按 $expanded 取项（单名两态同图；叶子静默取首项）。 */
    computeIcon(node: any, expanded: boolean, leaf: boolean, loading: boolean, error?: Error | null): string;
    /** 派生图标重算（$icon 依赖 localData 中 $expanded/$leaf/$loading 与 entry.error 当前值）：
     *  展开态 / 在途态 / 错误态变化处调用，随后由调用方 scope.refresh（ADR-0090） */
    syncIcon(entry: TreeNodeEntry): void;
    /** 错误态同步（ADR-0090 修订）：localData `$error` 派生量 + 行 `data-x-tree-error` 样式钩子
     *  （默认模板经注入 CSS 变红，自定义模板可自行选样式）+ `data-tooltip = 错误消息`
     *  （接管前保存宿主原值，清除时还原）。tooltip 走全局委托系统（ADR-0061），运行时属性
     *  即生效；调用方随后须 scope.refresh（或经 refreshRow 重算） */
    syncError(entry: TreeNodeEntry): void;
    /** 懒加载请求（ADR-0090 决策 5/6）：门 = 未加载 && 有效展开 && 模板递归，在途去重。
     *  幂等入口（show 展开过渡 / createEntry 初定位 / 失效重载均经此）——重发即清错误态。 */
    requestLoad(entry: TreeNodeEntry): void;
    /** 广播懒加载请求（detail 另带 fail 回调——宿主取数失败时调用挂错误态，ADR-0090 修订决策 6） */
    private emitLoad;
    /** 宿主失败回调（tree:load detail.fail）：错误挂行——在途结算、行挂红图标（file-error）
     *  与 data-tooltip。行已销毁或无在途请求（迟到回调）→ 忽略 */
    private markError;
    /** 加载完成自动翻转（ADR-0090 修订决策 4）：children 到达即置 loaded=true——宿主只写
     *  children，零字段管理。只读数据等写入失败边界按节点去重 warn（防重试循环） */
    private flipWarned;
    markLoaded(node: any): void;
    /** 半选派生（不落盘）：未全勾 && 子树存在勾选痕迹（子勾选或子半选），决策 13 */
    computeIndeterminate(node: any): boolean;
    /**
     * 新建一行：克隆模板 → compileChild（建 scope/订阅）→ 定位子容器 → 显隐初定位。
     * 初定位**不播动画**（新增已展开行的子容器直接呈现；重展开路径走 LayerRenderer.show 才动画）。
     * @param layerChildrenPath 所在层的 children 数组路径（子层 watch 路径拼接基准）
     */
    createEntry(node: any, key: unknown, index: number, length: number, level: number, layerChildrenPath: string | null, ancestors: any[], parentEntry: TreeNodeEntry | null, ownerScope: AutoSparkScope): TreeNodeEntry;
    /** 建立并首渲某行的子层渲染器（createEntry 初定位与 show 重展开共用） */
    mountSubLayer(entry: TreeNodeEntry, layerChildrenPath: string | null, ancestors: any[]): TreeLayerRenderer;
    /** 行销毁后的映射清理（WeakMap 无需显式删，保留方法做防御性清引用） */
    forgetRow(row: HTMLElement): void;
    /** 根层渲染器工厂（根容器 = 宿主；watcher 挂指令 binding，指令 destroy 级联） */
    private makeRootLayer;
    /** 根渲染入口：undefined 清场（不认领）、真空挂 empty、正常走根层 diff。
     *  根层一旦建立常驻（clearRows 只清行不退订——空态退订本体 watcher 会让
     *  后续数据到达失聪），destroy 到指令销毁时才发生。 */
    rootRender(): void;
    /** 挂载空态（对齐 x-for mountSpecial：克隆编译 + 文档序 append；空对象 localData → 绑定回退父作用域） */
    private mountEmpty;
    private destroyEmpty;
    /** 容器级 click 委托：closest 定位最近行（孙行点击天然命中孙行）→ 三路分流（决策 10）：
     *  ① check 触点（模板声明 data-x-tree-check，仅标记元素）→ 复选；
     *  ② toggle：启用选中后收窄到 data-x-tree-toggle 标记（点箭头只展开）；未启用保持
     *     整行 toggle（hit 必属本行——target 最近行是本行，孙行标记不会出现在祖先链上）；
     *  ③ select：启用选中后整行（非 check / 非 toggle 标记区）→ 选中。 */
    private handleNodeClick;
    /** 展开切换（决策 7 惰性写回 + 决策 11 事件广播）：写数据先行，显隐由 watcher 驱动 */
    private toggleExpand;
    /** 节点选中（P2，决策 10）：单选 toggle 本行 + 清全树其他选中（数据层递归——折叠行
     *  重展开时状态已对）；多选只 toggle 本行。写数据先行，受影响行显式 refresh（字段初始
     *  undefined 时表达式依赖收集不到新增属性——autostore 边界，同 expandField 走通配的因） */
    private selectNode;
    /** 递归清空全树选中（单选语义：选新必清旧；折叠子树一并清——数据层操作），返回被清节点 */
    private clearAllSelected;
    /** 刷新数据引用对应的已渲染行（未渲染跳过——重展开时 buildLocalData 重算） */
    private refreshRowsOf;
    /**
     * 复选切换（P2，决策 10）：写本行 + 级联（cascade，默认开）——
     * 向下：子孙全勾 / 全消（数据层递归，折叠子树同样生效）；
     * 向上：沿 $parent 链重算各祖先 checked（全部子勾选才勾）+ 刷新已渲染行的 $indeterminate
     * （半选是派生值不落盘，须随级联手动同步 localData——对齐 syncVisibility 更新 $expanded
     * 的模式）；cascade:false 时只写本行。
     */
    private toggleCheck;
    /** 向下级联：子孙全勾 / 全消（数据层递归写），返回被写节点 */
    private cascadeDown;
    /** 向上级联：沿祖先链重算 checked（全部子勾选）+ 刷新已渲染行 $indeterminate。
     *  祖先行必然存活（嵌套结构：子行渲染的前提是父行展开存在），数据引用 → 行经
     *  findRenderedRow；行销毁等异常边界直接截断（重展开时 buildLocalData 重算）。 */
    private refreshAncestors;
    /** 数据引用 → 已渲染行（未渲染返回 null：折叠 / 已销毁，重展开时 buildLocalData 重算） */
    private findRenderedRow;
    /** 迭代全部存活行（根层 → 递归各子层；行数有限，遍历成本可接受） */
    private iterLayer;
    /** 拖起：记源行（容器委托；draggable 行根才发） */
    private handleDragStart;
    /** 拖过行：三态定位（上 1/4 before / 下 1/4 after / 中段 inside）+ 环检测 + 指示 */
    private handleDragOver;
    /** 三态定位：鼠标 Y 相对**行线**高度的分段（上 25% before / 下 25% after / 中段 inside）。
     *  行线 = 行根顶至子容器顶：行根（li）的 rect 含已展开子树——按 li 全高分段会把
     *  inside / after 区挤进子树区域（孙及更深后代占高时，悬停自身行线只落 before，
     *  节点无法接受拖入）。子树区域归子行各自三段，互不抢占 */
    private dropPosition;
    /** 三态指示（互斥单行）：清旧标 + 新行挂类 */
    private markDrop;
    private clearDropMark;
    /** dragleave：离开行边界清指示（dragover 会随即重标，低成本幂等） */
    private handleDragLeave;
    /** 落点：数据写回移动（先移除后插入，同父索引偏移修正）→ watcher 驱动 diff 重渲染 */
    private handleDrop;
    /** 数据移动：源 splice 出原位 → 按 before / after / inside 插入目标位（inside 收纳 + 展开目标） */
    private moveNode;
    /** target 是否在 ancestor 的子树内（环检测：拖入自身子孙会成环） */
    private isDescendantOf;
    /** DnD 事件 → 行 entry（closest 定位；未命中 / 容器外返回 null） */
    private entryFromEvent;
    /** 树事件广播（决策 11）：tree:expand / tree:collapse / tree:select / tree:check /
     *  tree:load / tree:loaded（ADR-0090），detail {id, node, level}（check 另带 checked、
     *  load 另带 fail 回调、loaded 另带 children），冒泡；tree:drop 的三段式 detail 见 handleDrop。
     *  非 private：层渲染器的懒加载结算路径也经此广播 */
    emitTreeEvent(type: string, entry: TreeNodeEntry, extra?: Record<string, any>): void;
    /** warn 统一出口（带指令前缀，覆盖基类 warn；消息已自带 ADR 编号时不重复挂 ADR-0040） */
    warn(message: string): void;
}
export {};
