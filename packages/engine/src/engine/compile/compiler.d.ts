/**
 * 模板编译器
 *
 * 基于 transformElement 深度优先重建模板树：对每个含指令的元素，浅克隆（保留
 * 普通属性）、移除指令属性、创建 AutoSparkScope 并执行其指令生命周期。
 *
 * **浅克隆是安全的**：transformElement 命中 transformer 后会用返回的新元素替换原节点，
 * 并继续递归**原节点的子节点**挂到新元素下——因此子树会被完整重建（等价深克隆，
 * 但允许每个子节点各自走 transformer 处理）。
 *
 * 编译期通过 templateScopeMap 建立 scope 父子关系（向上查找最近指令祖先），
 * 并让子作用域继承父的 localData（供 x-for 注入的 item/index 向下传递到嵌套子元素）。
 */
import { AutoSparkScope } from "../scope";
import type { AutoSpark } from "../engine";
import { type OwnsChildrenResult } from "../../utils/transformElement";
import { type DataScriptStash } from "./dataScript";
import type { ComponentDataBasis, ComponentDef } from "../../features/component/component-def";
import { type SlotContent, type SuperFallback } from "../../utils/slot";
export declare class AutoSparkCompiler {
    readonly engine: AutoSpark;
    /** 编译期：原树模板元素 → scope 映射，用于建立 scope 父子关系与 localData 继承 */
    private templateScopeMap;
    /**
     * 编译期：scope → 数据脚本预扫产物（ADR-0032）。compileElement 在 scope.compile() 前
     * 写入，DataDirective.created()（优先级 200，compile 内最先执行）一次性消费后删除——
     * 每实例编译各写各的，无跨实例共享。
     */
    private dataScriptStash;
    /**
     * 元素名自动组件的响应式 props 剥除暂存（ADR-0117）。compileElement 在 scope 构建前
     * 把宿主模板上的 `:expr` props 属性临时剥除（防被通用管线误实例化为 bind 指令）并以
     * 模板元素为 key 暂存；生成类 created() 经 consumeAutoComponentProps 消费折叠进
     * props 值通道，finally 恢复原树（原模板不留痕，重编译幂等）。
     */
    private _autoComponentProps;
    /**
     * 覆盖物消费者指令名集合（惰性，来自注册表中 `overlayConsumer=true` 的指令类）。
     * 插槽归属剪枝据以判定「元素是否覆盖物宿主」——晚注册指令后首次调用时重建即可，
     * 集合内容在单次编译内不变。
     */
    private _overlayConsumerNames;
    constructor(engine: AutoSpark<any>);
    /**
     * 静态 `title` → `data-tooltip` 属性转换（ADR-0061 决策 4/5，**原地**作用于 clone——
     * 模板只读契约）：title 值转移、data-tooltip 已存在则仅剥 title（原生 tooltip 与自定义
     * 浮层同屏双显是 bug）；特性关闭（`options.tooltip: false`）时 title 原样保留（全关语义）。
     * 绑定形态 `:title` / `x-bind:title` 的重定向不在此处——由 BindDirective.created 承担。
     */
    private _convertTitleEl;
    private _getTransformers;
    /**
     * 覆盖物消费者指令名集合（注册表中 `overlayConsumer=true` 的类名，如 `dialog`）。
     * 惰性取一次——单次编译内注册表不变。
     */
    private _overlayDirectiveNames;
    /**
     * 元素是否为**覆盖物宿主**（带 `x-dialog` 等覆盖物消费者指令属性）。
     *
     * 只认指令正身与修饰符 / 属性参数形态（`x-dialog:名.foo` → `dialog`）；
     * `x-dialog-options` 等选项属性不命中（首段为 `dialog-options`）。
     */
    private _isOverlayConsumerHost;
    /**
     * 从 `from` 向上找最近的覆盖物宿主（插槽内容标记的上下文判定）。
     *
     * 遇 `x-define` / `x-component` 即停（组件模板上下文不是宿主内容——组件快照与
     * 组件实例的祖先链上可能出现组件指令，出口标记不得被误剪）。
     *
     * @returns 覆盖物宿主；不在覆盖物宿主子树内返回 null
     */
    private _nearestOverlayHost;
    /**
     * 是否为覆盖物宿主子树内的**插槽内容侧**节点（归属容器 / 内容标记）。
     *
     * 组件模板内的出口标记因上下文判定（最近祖先无覆盖物宿主、或遇 `x-define` 边界即停）
     * 不命中——本方法只管辖内容侧，出口侧照旧走通用编译。
     *
     * 纯判定、无副作用（可安全用于 transformer filter）。
     */
    private _matchOverlaySlotNode;
    /**
     * 覆盖物宿主子树内内容侧节点的编译处置（前置 transformer 与 compileOneChild 共用）。
     *
     * - 归属容器 `x-slots` → 无条件剪枝；宿主上无覆盖物消费者 → 错位 warn（Q13-1）；
     * - 内容标记是宿主直接子级 → 剪枝（收集通道在打开时从只读 template 克隆，Q6=A）；
     * - 内容标记在更深层 → 决策九忽略：剥标记属性、元素保留为普通内容并照常编译。
     */
    private _pruneOverlaySlotNode;
    /**
     * 元素是否带 x-define 声明属性（含修饰符形态，ADR-0053；指令名 ADR-0054）。
     *
     * 判定规则本体在 `collect.ts` 的 {@link hasComponentDeclareAttr}——与运行时注册
     * （`engine.registerComponent`，ADR-0086）共用同一实现，两条路径的门禁永不漂移。
     */
    private _matchComponentAttr;
    /**
     * 收集 x-define 命名组件定义（ADR-0022 承接 ADR-0021；指令名 ADR-0054 更名自 x-component）。
     *
     * 编译期前置 transformer 命中 x-define 元素时调用：把该元素**深克隆**为冻结快照，
     * 按名存入**最近祖先 scope** 的 `components`，然后返回 `null` 剪枝——组件元素及其子树
     * **不进结果 DOM、不建 scope、不实例化指令**。
     *
     * 消费者（x-loading/x-empty/x-error…）经 `scope.getComponentDeclaration(name)` 沿 parent 链就近取用本快照
     * （到顶兜底全局组件），clone 后编译渲染、替换其默认 UI（组件兜底）。详见 ADR-0022。
     *
     * **default 唯一性已放宽**（ADR-0022 决策四-4）：同名组件直接归属同一 scope 时 warn + 后者覆盖
     * （不再抛错）。沿 parent 链的就近覆盖由 getComponentDeclaration 就近原则处理。
     *
     * @param componentEl 原树中的 x-define 元素（只读编译输入，仅读取其属性与结构）
     * @returns 固定 `null`（剪枝，x-define 永不进结果 DOM）
     */
    private _collectComponent;
    /**
     * 收集 **global 声明**（`x-define.global` ≡ `x-define-options="{global:true}"`，ADR-0115）：
     * 跳过 owner 归属查找，编译期即时写入 engine 全局组件定义表（与 registerComponent 全局路径、
     * options.components 懒预编译、x-import.global 同表同生命周期；x-isolate 子引擎隔离）。
     *
     * 与局部路径的差异：
     * - 无祖先 scope 也允许（孤立声明是 global 的正当用途；非 global 孤立仍 warn 丢弃）；
     * - `declarerScope = null`——全局即脱离声明位置（与其余三条全局路径一致）；
     * - `dataContext:'declarer'` 对全局无意义：收集期 warn 一次 + 丢弃基准（回退 host）；
     * - 继承父查找**仅全局表**；父名只在声明处作用域链命中（全局未命中）时 fail-fast
     *   warn + 拒绝注册，不进 pending（否则永不出队）；全局也未就绪则挂起等全局注册事件；
     * - 注册尾巴（覆盖 warn / def 反查 / 样式注入 / 事件排水）统一收口 engine._registerGlobalDef。
     *
     * 嵌套在另一组件定义内的 global 声明经本收集器时，外层组件正被实例化编译——故注册时机为
     * 外层首次实例化（懒注册），每次实例化幂等覆盖，时序文档化（ADR-0115 决策 7）。
     */
    private _collectGlobalComponent;
    /**
     * 元素是否带 x-icons 声明属性（含修饰符）。命中形态：`x-icons`（正身）与
     * `x-icons.global` 等带 `.` 修饰符段的属性名；`x-icons-options`（指令选项属性）
     * **不是**声明形态——不命中（`x-icons-` 前缀与 `x-icons.` 修饰符前缀是两个不同边界，
     * 与 _matchComponentAttr 的边界规则同构）。
     */
    private _matchIconsAttr;
    /**
     * 收集 x-icons 图标集声明（ADR-0058 决策 3/4/5）。
     *
     * 编译期前置 transformer 命中 x-icons 元素时调用：内联通道为 template 内容的多个带
     * `id` 的 `<svg>` 子元素（每个 → 一个 symbol）；值简写 `x-icons="save,home"` 承载远程
     * 清单（等效 `x-icons-options.icons`），与内联**可合并**进同一图标域；`url` / `modify`
     * 走 `x-icons-options` 整包（relaxed-json 对象；选项成员属性不支持——纯静态声明）。
     * `.global` ≡ `global:true` 归全局；默认归最近祖先 scope；孤立声明**静默归全局**。
     * 登记交 `registerIconDecl`（令牌哈希去重 / 声明序所有权 / 待定名 / 远程 kick），
     * 然后返回 `null` 剪枝——声明元素永不进结果 DOM。
     *
     * @param iconEl    原树中的 x-icons 元素（只读编译输入）
     * @param fallbackOwner 直接子级编译通道（compileOneChild）传入的归属 scope——x-for 项
     *   模板 / patch 节点等**克隆链**的 parentElement 在快照根处断裂，沿链上溯找不到 scope，
     *   以本参数兜底（= 该通道编译所挂的 scope，语义即「最近祖先 scope」）；深层嵌套经
     *   templateScopeMap 命中快照根 scope，不走此兜底
     * @returns 固定 `null`（剪枝）
     */
    private _collectIcons;
    /**
     * 编译含 `{{}}` 的文本节点（文本插值，ADR-0004 决策 1/3）。
     *
     * 拆为「字面量段 + 表达式段」，每表达式段一个 text node + 一个 `scope.watch`；
     * 返回由段 text node 组成的 `DocumentFragment`（调用方 appendChild 搬入父）。
     *
     * **x-text / 非 compile 的 x-html 在场 → 返回 null（剪枝）**：x-text 整体覆写 textContent，
     * 若插值已建段 text node + watcher，首次 compile 后段 node 被清空成游离节点、watcher 仍订阅 →
     * 孤儿 watcher 泄漏。故编译期剪枝该文本节点（非「建了让 x-text 覆盖」）。见 ADR-0004 决策 5。
     *
     * **x-html.compile 例外（ADR-0017）**：compile 模式把注入内容作为子模板编译，其顶层文本插值
     * 应正常编译（由 recompileSubtree 注入），故 compile 模式的 html 指令不触发剪枝——宿主原生
     * 子节点反正被注入内容覆盖，无孤儿 watcher 风险。
     *
     * @returns DocumentFragment（段 text node 集合）；x-text / 非 compile 的 x-html 在场返回 null（剪枝）
     */
    private compileTextNode;
    /**
     * 属性插值 desugar（ADR-0004 决策 9-12）。
     *
     * 扫描 `el` 的非指令属性，对值含 `{{}}` 者：① 同属性已有显式 bind → 抛错（互斥）；
     * ② `removeAttribute` 移除原生平属性（防字面 `{{}}` 泄漏 DOM）；③ 合成表达式；
     * ④ 实例化 `BindDirective` 复用其五路 patch 分派（class diff / style / property /
     * boolean / 普通）。watcher 经 `scope.watch` 自动入 `scope.watchers`/`_updates`，
     * destroy/refresh 自动，无需手动登记。
     */
    private _compileAttrInterpolation;
    /**
     * x-model 元数据自动注入（ADR-0020）：含 x-model 的元素从 configManager schema 合成隐式 `@` 绑定。
     *
     * 与 `_compileAttrInterpolation` 并列，在 scope.compile() 后调用。合成知识封装在
     * `ModelDirective.synthesizeSchemaBindings` 静态方法（compiler 只管调用时机）。合成实体是
     * 标准 BindDirective 实例（复用 ADR-0019 全部能力）。无 x-model 的元素直接跳过。
     */
    private _synthesizeModelSchemaBindings;
    /**
     * 沿 parentElement 向上查找最近的已注册 scope（templateScopeMap）。
     * 与 `_linkParent` 查找逻辑一致，用于把 script action 挂到最近祖先作用域
     * （查好后作为入参传给 actionsManager.extractScript，见 _getTransformers）。
     */
    private _findNearestScope;
    /**
     * 编译整棵模板，返回重建后的根元素（已移除指令属性、各元素挂载 scope）。
     * 每次 compile 重建 templateScopeMap（编译期临时结构）。
     */
    compile(): HTMLElement;
    /**
     * 正向桥：模板元素 → scope（ADR-0002 决策 2）。
     *
     * 供 `engine.patch` 经 selector（对 `engine.template` querySelector）定位 patch 目标的 scope，
     * 再取 `scope.el` 得运行元素。仅含指令或 `{{}}` 插值的元素（有 scope）能命中；
     * 纯静态裸元素返回 undefined（需挂 `x-scope` 哨兵建 scope）。
     */
    getScopeByTemplate(templateEl: HTMLElement): AutoSparkScope | undefined;
    /**
     * 单条指令是否占有子树（ownsChildren）的纯判定谓词。
     *
     * 查指令类的静态 `ownsChildren(info)`。提取为谓词后，`scopeOwnsChildren`（boolean 查询）
     * 与 `_resolveOwnership`（需计数以检测多 owner 冲突）共用同一真相源。
     */
    private _ownsChildrenDirective;
    /**
     * scope 是否被任意结构指令（ownsChildren）占有子树——纯判定，不抛错。
     *
     * 供 `engine.patch` 的动态区域守卫（ADR-0002 决策 5）：patch 目标自身或祖先链上有
     * ownsChildren 指令（x-for / eager x-if / x-isolate / eager x-switch）即处于动态区域，
     * 正向桥不可靠，拒绝。
     */
    scopeOwnsChildren(scope: AutoSparkScope): boolean;
    /**
     * 编译单个模板元素（transformElement 回调）。
     *
     * - 无指令：原样返回，transformElement 会默认浅克隆并递归子节点；
     * - 有指令：浅克隆 + 移除指令属性 + 建 scope + 建立 parent 关系 + 继承 localData + 执行指令。
     * - 含结构指令（ownsChildren，如 x-for / eager x-if）：返回 `ownsChildren` 信号，
     *   让 transformElement 跳过该元素子节点的自动递归——子节点由指令自行编译，
     *   避免"正常通道编译一次 + 指令克隆再编译"的双重冲突。
     *
     * 同元素出现多个结构指令（如 `x-for` + eager `x-if`）会在 `_resolveOwnership` 中抛错。
     */
    compileElement(template: HTMLElement): HTMLElement | OwnsChildrenResult;
    /** noop 恢复闭包（_stripAutoComponentExprProps 未命中时的零成本返回） */
    private static readonly _NOOP_RESTORE;
    /**
     * 剥除元素名自动组件宿主上的 `:expr` props 属性（ADR-0117 编译期半程）。
     *
     * 元素名命中**本机制生成的自动组件类**时，把 `:key="expr"` 形态属性从模板临时剥除并
     * stash（key 为模板元素）；返回恢复闭包（finally 调用，原样写回 + 清 stash——原树不留痕，
     * 重编译幂等）。保留属性（`:class`/`:style`/`:id`/`:data-*` 等，isReservedElementAttr）
     * 不剥不折，留走既有 bind 属性绑定语义。非自动组件元素（含预设元素名指令 x-super）零开销跳过。
     */
    private _stripAutoComponentExprProps;
    /** 读取元素名自动组件宿主的响应式 props 暂存（生成类 created 一次性消费，读后即删） */
    consumeAutoComponentProps(template: HTMLElement): Record<string, string> | undefined;
    /** compileElement 主体（剥除恢复包裹后的原流程，见 compileElement） */
    private _compileElementInner;
    /**
     * 把数据脚本预扫产物交给 scope 的 DataDirective 消费（ADR-0032 决策 4）。
     *
     * 元素已有 x-data → stash 挂 WeakMap，由 DataDirective.created()（scope.compile 内
     * 按优先级最先执行）消费合并；无 x-data → 合成空值 DataDirective 入列——「脚本独立成立」
     * 等效 x-data。入列后按类静态 priority 重排（data=200 恒最先，保证先于兄弟指令注入，
     * 首渲即可读到数据；重排兼容未来更高优先级的自定义指令）。
     */
    private _applyDataScriptStash;
    /** 消费 scope 的数据脚本预扫产物（DataDirective.created 一次性读取，读后即删） */
    consumeDataScriptStash(scope: AutoSparkScope): DataScriptStash | undefined;
    /**
     * 判定某 scope 是否被结构指令占有子树（ownsChildren），并检测冲突。
     *
     * 任意指令类的静态 `ownsChildren(info)` 返回 true 即视为占有。同元素出现多个占有者
     * （如 `x-for` + eager `x-if`、`x-for` + eager `x-switch`）语义互斥——前者重复子树、
     * 后者条件销毁/挂卸子树——直接抛错（标题动态列出冲突指令名），提示改用不占子树的
     * 替代指令（`x-show` / `.keepalive` 变体）或外层包裹。
     */
    private _resolveOwnership;
    /**
     * 构建 removeDirectives 的 keepAttr 谓词：保留 Runtime/Hybrid 指令属性。
     *
     * 这些指令的属性须留在结果 DOM 上（供 static initialize 建立的 MutationObserver 检测、
     * 允许 DOM API 改值/删除），故编译期不剥除。Compile 指令属性照常剥除。
     *
     * 匹配规则：对每个 Runtime/Hybrid 指令名 `n`，保留 `x-${n}`、`x-${n}.*`（含修饰符形式，
     * 如 `x-loading.screen`）与 `x-${n}-options`（指令选项属性，ADR-0007——dispatcher 经
     * getDirectives 解析结果 DOM 建 Runtime 实例，选项属性被剥则手写声明失效）。
     * `.`/`-options` 边界避免 `x-loading` 误匹配 `x-loading-state`。
     * 仅考虑 `x-` 长前缀（Runtime 指令无 `@`/`:` 快捷形式）。
     */
    private _runtimeKeepAttr;
    /**
     * 编译单个子节点（compileSubtree / compileChildNodes 共用的单节点逻辑）。
     *
     * - **HTMLElement → `transformElement`**（递归子节点 + 文本插值，建 scope / 合成 scope）
     * - **含 `{{}}` 文本节点 → `compileTextNode`**（插值拆分，返回 DocumentFragment 或 null 剪枝）
     * - 其余文本/注释 → `cloneNode(true)`
     *
     * **x-else-if / x-else（ADR-0034）与 x-case / x-default（ADR-0037）分支标记在此统一剪枝**：
     * 分支是备选模板，任何子树编译通道（eager x-if 的 then / x-for 项 / 分支快照内部的孤儿分支）
     * 都不进结果 DOM。若放行走 `transformElement`，分支作为其**根**被前置剪枝 transformer 置 null
     * 会触发单根约束抛「根元素被丢弃」（作为非根子孙时剪枝无此问题，keepalive 主 walk 路径即如此）。
     *
     * **铁律：HTMLElement 必须走 `transformElement`（递归），不可用 `compileElement`**——后者只浅克隆，
     * 会丢失整棵子树与插值（patch 替换自身的关键正确性保证）。
     *
     * @param scope 顶层文本插值节点注册 watcher 所用 scope（其父元素 scope）
     * @returns 编译后节点 / DocumentFragment（多段插值）/ null（剪枝）
     */
    private compileOneChild;
    /**
     * 编译一组节点并返回运行节点列表（**不挂载**，挂载由调用方处理）。
     *
     * 供 `engine.patch` 替换自身：updater 返回的 `string`/`Node` 经解析为 templateNodes，
     * 本方法编译它们（HTMLElement 走 `transformElement` 递归、文本插值走 `compileTextNode`），
     * `DocumentFragment` 展开成实际子节点，收集为 runtimeNodes 供调用方 `replaceWith`。
     *
     * @param nodes  待编译的模板节点（通常来自 `parseHtmlFragment` 或 updater 返回的 Node）
     * @param scope  顶层文本插值节点的注册 scope（替换后挂父下，用父 scope）
     */
    compileChildNodes(nodes: Node[], scope: AutoSparkScope | null): Node[];
    /**
     * 编译某模板的全部子节点并挂到指定父元素，返回已编译节点列表。
     *
     * 共享给结构指令（eager x-if 编译/重建子树 / x-for 项 / engine.data 重建子树 / `engine.patch`
     * 子树重建）：单节点编译委托 `compileOneChild`，挂载用 `appendChild`。`compileTextNode` 可能
     * 返回 `DocumentFragment`（多段插值）或 `null`（x-text 在场剪枝）：fragment 搬入父后展开成实际
     * 子节点入 `nodes`（供 if.ts 精确移除）；null 跳过（剪枝）。
     *
     * @param scope 子树根的 scope，供直接文本子节点插值注册（项 scope / x-if scope 等）
     */
    compileSubtree(parentEl: HTMLElement, templateEl: HTMLElement, scope: AutoSparkScope): ChildNode[];
    /**
     * 编译插槽内容节点组并挂到出口元素（ADR-0056）。
     *
     * - **元素** → `compileChild`（显式 `parentScope` + `localData`，`configure` 置 `isSlotContent`）；
     * - **含 `{{}}` 文本** → 建轻量内容 scope（`isSlotContent` + 共享 `localData`）后 `compileTextNode`；
     * - **其余节点**（纯文本/注释等）→ 原样克隆挂载。
     *
     * 所有内容 scope 的 `parent` = `parentScope`（调用方基准），销毁经 SlotDirective 持引用回收
     * （幂等；同时随调用方 children 级联）。
     *
     * @param parentScope 调用方基准（x-component=宿主 scope / overlay=x-dialog binding）
     * @param localData   作用域形参容器（共享引用，出口侧 Object.assign 刷新；无参 null）
     * @param mountEl     出口元素（内容挂载点）
     * @param extraConfigure 额外 scope 预配置（ADR-0084）：在 `isSlotContent` 之后调用——
     *   super 句柄注入等（每内容 scope 一致携带，深层 x-super 沿链就近命中）
     * @returns 内容 scopes（供 SlotDirective.destroy 回收）
     */
    compileSlotNodes(nodes: Node[], parentScope: AutoSparkScope, localData: Record<string, any> | null, mountEl: HTMLElement, extraConfigure?: (scope: AutoSparkScope) => void): AutoSparkScope[];
    /**
     * 编译出口 fallback 子树为独立产物（ADR-0084 super 句柄的实现体）。
     *
     * 与 `compileSlotNodes`（内容侧：调用方作用域基准）对称，本方法在**出口 binding
     * （组件作用域）**链上离线编译 fallback 子节点——元素走 `compileChild`（显式
     * `parentScope` 兜底 detached 节点 `_linkParent` 挂不上链的问题）；插值文本建轻量
     * scope；其余原样克隆。每次调用独立编译（同段多个 x-super 各自展开、各挂各的
     * watcher）；产物不挂载（由 SuperDirective 挂入标记元素内）。
     *
     * @param source    fallback 事实源（出口元素 childNodes / `<template>` 出口的 `.content`）
     * @param baseScope 出口 binding scope（组件作用域基准 + 产物 scopes 的销毁级联父）
     */
    compileSuperFallback(source: ParentNode, baseScope: AutoSparkScope): SuperFallback;
    /**
     * 供 x-for 编译单个列表项的模板。
     *
     * 手动建根 scope 并注入 localData（item/index），再用 transformElement
     * 递归编译其子节点（嵌套 scope 经 _linkParent 挂为本 scope 子代并继承 localData）。
     *
     * @param itemTemplate 单个项的模板元素（x-for 子模板的克隆）
     * @param parentScope  x-for 所在 scope，项 scope 挂为其子（删项时递归销毁）
     * @param localData   注入该项的局部变量（{ item, index }）
     * @param reuseEl      复用既有项根 DOM 节点（移动复用场景）；缺省则克隆模板。
     *                     复用时保留项根节点身份（保住项根本身的焦点/属性），但其子树 DOM 会被
     *                     清空重建（旧 scope 已销毁）→ 子节点焦点丢失，彻底保留需 core 对象身份订阅。
     */
    /**
     * 注入组件语义到既有 scope（ADR-0022 决策二/三）。
     *
     * 供 x-component 复用宿主 scope 化身组件实例（宿主 scope 本身即组件实例 scope，不另建），以及
     * compileChild 在新建 scope 后调用。注入内容：
     * - `isComponent=true` + `componentName=def.name`；
     * - `data`：data 默认值先注入、props 后覆盖（R1=A 合并顺序），写入响应式 `$scopes[id]` 域
     *   （ADR-0057：data 双形态——工厂每实例调用、字面量深克隆，per-instance）；
     * - `methods`：注入 `scope.actions`（复用 x-on action 查找）；
     * - `hooks`：克隆到 `scope.hooks`（四阶段生命周期，每阶段数组克隆避免多实例共享引用）。
     *
     * @param scope 目标 scope（x-component 的宿主 scope，或 compileChild 新建的 scope）
     * @param def   组件定义
     * @param props x-component 传入的 props（覆盖 data 默认值；undefined 则只注入默认值）
     */
    injectComponentSemantics(scope: AutoSparkScope, def: ComponentDef, props?: Record<string, any>): void;
    /**
     * 实例化组件到既有 scope（ADR-0022 决策五，供 x-component）。
     *
     * 宿主 scope 化身组件实例（T4=B 宿主化身组件根），步骤：
     * 1. 注册组件快照根到 templateScopeMap（映射到宿主 scope），使快照子树编译时 _linkParent 能找到宿主 scope；
     * 2. 注入组件语义（data/methods/hooks）到宿主 scope；
     * 3. compileSubtree 编译组件快照子树到宿主元素（快照内指令建子 scope，watch 时读到注入的 data）；
     * 4. 补触发 created/mounted hooks（宿主 compile() 早于组件注入，hooks 须补触发）；
     * 5. flush 调度器消化首次渲染。
     *
     * @param hostScope   宿主 scope（化身组件实例 scope）
     * @param snapshot    组件冻结快照根
     * @param def         组件定义（可空：纯快照组件无 setup）
     * @param props       x-component 传入的 props（覆盖 data() 默认）
     * @param basis       数据基准（ADR-0053，x-component 解析链的结论）。缺省 undefined = 不施加边界语义
     *                    （现行为，供 overlay 等非 x-component 路径）：
     *                    - `'closed'`：封闭——hostScope 打数据边界标志，子树数据视图止于
     *                      自身 data/locals/props + engine.state（getContext/hasLocalContext/相对挂载三处收口）；
     *                    - `'declarer'`：数据视图挂声明处 scope（def.declarerScope；全局组件无声明
     *                      scope 或声明 scope 已销毁 → 退化为封闭 + warn 一次）；
     *                    - `'host'`：消费处上下文（结构 parent 链，= 无边界标志的现行为）。
     */
    instantiateComponent(hostScope: AutoSparkScope, snapshot: HTMLElement, def: ComponentDef | null, props?: Record<string, any>, basis?: ComponentDataBasis, 
    /**
     * 插槽内容 map（ADR-0056）：懒收集于 ComponentDirective._instantiate，stash 到宿主 scope
     * 供出口 SlotDirective 沿 parent 链查找。null/缺省 = 无内容（出口走 fallback）。
     */
    slotContents?: Map<string, SlotContent> | null, 
    /**
     * 插槽内容的调用方视图基准（ADR-0056）：x-component 传宿主 scope 自身
     * （isSlotContent 走 getCallerContext，保留 x-for item locals 又跳过组件 _data/边界）。
     */
    slotCallerScope?: AutoSparkScope | null): void;
    /**
     * 数据基准施加（ADR-0053）：instantiateComponent（宿主化身，x-component）与
     * instantiateDetachedComponent（独立 scope，overlay 家族）共享。
     *
     * 须早于 compileSubtree（子树 watch 首求值经 getContext 读到的视图必须已是基准后的视图）；
     * 施加后失效 scope 的 _scopeView 缓存。basis 缺省/`'host'` 不施加（结构 parent 链现行为）。
     */
    private _applyDataBasis;
    /**
     * 实例化组件到**独立 scope + 独立元素**（非宿主化身，ADR-0052 修订版——组件化统一）。
     *
     * 供 overlay 家族（OverlayDirective / OverlayInstance）：组件快照克隆编译为新 scope 的子树，
     * 与 instantiateComponent（宿主化身，x-component）共享语义注入（data()/props、methods、hooks）与
     * 数据基准施加管道，另补齐 styleBinds 订阅与 scoped CSS 挂载（compileChild 不含这两步）。
     *
     * @param template    组件冻结快照根的克隆（调用方 cloneNode，每次实例化独立）
     * @param parentScope 挂链父 scope（基准 declarer→声明处 / host→消费处；null→rootless）
     * @param def         组件定义（可 null：纯快照组件无 setup）
     * @param props       注入组件 data 域的 props（覆盖 data() 默认）
     * @param basis       数据基准（ADR-0053；undefined = 不施加边界语义）
     * @returns 编译产物（el = 编译根；scope = 实例 scope，随挂链销毁级联）
     */
    instantiateDetachedComponent(template: HTMLElement, parentScope: AutoSparkScope | null, def: ComponentDef | null, props?: Record<string, any>, basis?: ComponentDataBasis, 
    /** 插槽内容 map（ADR-0056，overlay 路径）——stash 到实例 scope，出口沿 parent 链查找 */
    slotContents?: Map<string, SlotContent> | null, 
    /** 插槽内容调用方视图基准（ADR-0056）：overlay 传 x-dialog 消费者 binding */
    slotCallerScope?: AutoSparkScope | null, 
    /** 求值上下文派生变量（ADR-0077 `$session` 通道）：x-for localData 同款——非响应式、
     *  不进 state、`$` 前缀不占用户命名空间；随编译建入块根求值上下文 */
    localData?: Record<string, any> | null): {
        el: HTMLElement;
        scope: AutoSparkScope;
    };
    /**
     * declarer 基准退化封闭的 warn 一次记录（ADR-0053）：按组件定义去重（def 多实例共享），
     * 防循环实例化场景刷屏。WeakSet 随 def 回收。
     */
    private _declarerFallbackWarned;
    /**
     * declarer 基准退化为封闭时的 warn（ADR-0053）：每个组件定义只 warn 一次。
     *
     * @param def   组件定义（可空：纯快照组件无 def，此时恒 warn——无去重载体）
     * @param reason 退化原因（进日志）
     */
    private _warnDeclarerFallback;
    /**
     * 为组件实例的 `<style>` bind 建立 CSS 变量订阅（ADR-0022 决策四-4.1）。
     *
     * 实现已下放公共 `bindStyleVars`（x-html.compile 样式通道复用同一实现）：watcher 进
     * `hostScope.watchers`，随 scope.destroy 自动 off（组件路径零额外卸载接线，返回值忽略）。
     *
     * @param scope  组件实例 scope（watcher 寄主，destroy 时统一 off）
     * @param rootEl 组件根元素（变量挂载点，每实例独立）
     * @param binds  bind 清单（编译期提取、多实例共享只读）
     */
    private _bindStyleVars;
    /**
     * 仅注入响应式 data（无组件语义，ADR-0021 决策 12-c 保留路径）。
     *
     * 供 x-loading 等非组件消费者：把 initialData 写入 `store.state.$scopes[scope.id]` 并令 scope.data
     * 指向它。块内指令 watch 首次求值即收集到 `$scopes.<id>.<field>` 精准路径。
     */
    injectInitialData(scope: AutoSparkScope, initialData: Record<string, any>): void;
    compileChild(itemTemplate: HTMLElement, parentScope: AutoSparkScope | null, localData: Record<string, any> | null, reuseEl?: HTMLElement, 
    /**
     * 编译前注入块根的**响应式** data（仿 DataDirective.applyLocal）。
     *
     * 与 localData（普通对象、非响应式）并列：在 `scope.compile()` 之前把数据写入
     * `store.state.$scopes[scope.id]` 并令 `scope.data` 指向它。块内指令 watch 首次求值时，
     * `getContext` 的 `_scopeView` 缓存即建成含 data 层的 Proxy，`collectDependencies`
     * 收集到 `$scopes.<id>.<field>` 精准路径——后续 `Object.assign` 进该响应式代理即字段级细粒度更新。
     *
     * 供 x-loading 等消费者把 config 注入块（ADR-0021 决策 12-c）；x-component 实例化组件时传入 props
     *（决策二-2，作为组件响应式状态域的覆盖值，后于 componentDef.state() 注入）。无此参则不注入。
     */
    initialData?: Record<string, any>, 
    /**
     * 组件定义（ADR-0022 决策二/三）：x-component 实例化组件时传入，注入组件语义：
     * - `data()`：先于 initialData 注入 scope.data（默认值，被 props 覆盖，决策 R1=A 合并顺序）；
     * - `methods`：注入 scope.actions（复用 x-on action 查找，this=ComponentMethodContext）；
     * - `hooks`：克隆到 scope.hooks（四阶段生命周期，compile/destroy 时触发）。
     * 无此参（x-for/loading 等非组件场景）则跳过组件语义注入。
     */
    componentDef?: ComponentDef, 
    /**
     * 数据基准（ADR-0053，instantiateDetachedComponent 的 overlay 路径传入）：须早于
     * compileSubtree / scope.compile() 施加（子树 watch 首求值读到的视图须已是基准后的视图）。
     * 缺省 = 不施加边界语义（现行为，x-component 走 instantiateComponent 的宿主化身路径）。
     */
    basis?: ComponentDataBasis, 
    /**
     * scope 预配置回调（ADR-0056）：在 scope 创建后、`compileSubtree`/`scope.compile()` 前调用。
     *
     * 供插槽内容路径设置 `isSlotContent`/`slotContents`——须在子树 watch 首次求值前就位，
     * 否则 getContext/hasLocalContext 走错视图分支。
     */
    configure?: (scope: AutoSparkScope) => void): {
        el: HTMLElement;
        scope: AutoSparkScope;
    };
    /**
     * 向上查找最近的已注册指令祖先 scope，把 scope 挂为其子，
     * 并继承祖先的 localData（让 item/index 向嵌套子元素传递）。
     */
    private _linkParent;
}
