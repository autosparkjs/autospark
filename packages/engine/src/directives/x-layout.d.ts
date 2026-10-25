import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { AutoSpark } from "../engine/engine";
import type { AutoDirectiveInfo } from "../features/directive/types";
/**
 * x-layout：布局容器（ADR-0074）——grid 骨架 + x-pane 布局窗格。
 *
 * **结构契约**（ownsChildren）：宿主直接子元素中只认 `x-pane:参数` 标记的布局窗格，
 * 其余编译期剪枝 + warn（x-define 剪枝先例）；`<template>`/`<script>` 静默容忍。
 * content 窗格必需，缺失 warn + 降级（grid 照建、content 位以 `.` 空洞占位）。
 *
 * **grid 模板**（决策二）：编译期按「窗格存在性 × through 组合 × 侧窗格数」动态生成
 * `grid-template-areas` 与行/列模板（{@link buildLayoutGrid} 纯函数，回流复用同一真相）。
 * 列 = [left?] content(1fr) [right?]，行 = [header?] middle(1fr) [footer?]；
 * header 全宽是缺省态——sidebar 声明 through=up 才占据 header 行带、把 header 推向对侧。
 * 窗格元素即 grid item（`grid-area` 按参数定名），**永不 reparent**。
 *
 * **同侧多窗格**（决策七）：按 DOM 序进分割容器——**程序化组合 x-splitter**（容器挂
 * `x-splitter` 属性整体编译，窗格转面板语义：层内首窗格 data-size 定容、余者自适应，
 * 拖分隔条守恒分配；3+ 递归嵌套链）。分割窗格跳过默认行为注入（调节走分隔条、折叠走
 * 窗格显式 data-expandable 的 splitter 通道），不再吃 layout 的 gap（间距由分隔条承载）。
 * 容器是该侧唯一 grid item；**仅 DOM 首个窗格有 through 资格**。
 *
 * **响应式边界**（决策四）：存在性回流是唯一响应式维度——x-pane 编译期订阅同元素
 * x-if / x-show 的存在性表达式（scope.watch 双轨），变化 → 重算模板 + 被剔除窗格挂
 * `data-autospark-layout-absent`（`display:none!important` 契约）。x-if 的标准移除语义、
 * x-show 的显隐语义**不被接管**（属性原样保留给子树编译），x-pane 只读同一表达式。
 * through / gap / height / width / 窗格组合均编译期静态，变更需 engine.patch 重编
 * （ownsChildren → 宿主区域自动成为 patch 动态区域）。
 *
 * **窗格选项**（决策一，`x-pane-options` 整包 relaxed-json + `.up`/`.down` 修饰符等价）：
 * `{ height, width, through, expandable, resize }`——height 仅 header/footer 认（inline，
 * 显式优先于样式表）、width 仅 sidebar 认、through 仅侧栏且仅 DOM 首个认、expandable/resize
 * 布尔 opt-out（仅 sidebar 有默认注入可关）。未知键 / 无效组合 warn + 忽略该键。
 * 默认尺寸（header/footer 64px、sidebar 240px）经 CSS 变量落在窗格元素样式——不落 inline，
 * 用户 CSS 与窗格选项两条覆盖路都通（决策八）。
 *
 * **行为组合**（决策六，M3 阶段实施）：sidebar 默认注入 x-expandable（compose 程序化组合，
 * ADR-0070 先例）+ x-resizable 内缘单方向手柄；显式声明优先于默认注入；注入实例的 options
 * 读同元素 `x-expandable-options`；拖拽跨折叠目标自动翻转折叠布尔。
 * header/footer 显式挂 `x-resizable` 合法（auto 轨道跟随）；content 上挂 warn（1fr 轨道拖拽无效）。
 *
 * **嵌套零新机制**：窗格归属最近 x-layout 祖先，窗格内是正常编译子树
 * （嵌套 x-splitter / 子 layout / 任意指令照常）。
 */
export declare class LayoutDirective extends AutoSparkDirectiveBase {
    static readonly priority = 0;
    static readonly singleton = true;
    /** 结构指令：接管子树（收集窗格、剪枝非窗格、自行编译——grid item 不经通用 walk） */
    static ownsChildren(_info: AutoDirectiveInfo): boolean;
    /** 类级初始化：注入全局样式（幂等） */
    static initialize(_engine: AutoSpark): void;
    /** 窗格声明（词表内、未被剪枝者；与 _present/_paneEls 按索引对齐） */
    private _panes;
    /** 各窗格存在性（created 订阅初值 + 回调维护；剔除 = false） */
    private _present;
    /** 窗格编译产物（compile 期填充；被 eager x-if 移除后保留死引用无碍——absent 已挂） */
    private _paneEls;
    /** 侧容器（该侧 ≥2 窗格时创建；gridArea = 侧名） */
    private _sideContainers;
    /** 宿主 gap（x-layout-options.gap；null = 0） */
    private _gap;
    /** 降级标记：content 缺失（grid 照用、content 位 `.` 空洞） */
    private _degraded;
    /** sidebar 的 expandable 组合实例（与 _panes 按索引对齐；null = 非侧栏/显式/opt-out） */
    private _composeInsts;
    /** 各 sidebar 折叠态镜像（driver.get 判据 + 联动翻转检测） */
    private _collapsedSide;
    /** 各 sidebar 折叠前尺寸记忆（px；恢复链 lastSize → 声明宽 → 240 兜底） */
    private _lastSizes;
    /** resize 事件监听（destroy 移除） */
    private _onResizeMove;
    private _onResizeEnd;
    created(): void;
    compile(_context: Record<string, any>, _parent: HTMLElement): void;
    destroy(): void;
    /**
     * 扫描宿主模板直接子元素：只认 x-pane 标记的窗格；非窗格渲染子元素 warn + 剪枝；
     * 词表外参数 / 非法修饰符 warn + 剪枝；header/content/footer 重复声明 warn + 后者剪枝。
     * 窗格快照克隆（模板只读契约），x-pane 家族属性在**克隆**上剥除（防窗格子树编译时
     * PaneDirective 空转）；x-if / x-show 属性原样保留（存在性语义归 If/ShowDirective，
     * Q14b 不接管承诺）。
     */
    private _collectPanes;
    /**
     * 解析单个子元素的 x-pane 声明。返回 pane（合法窗格，快照已剥 x-pane 家族属性）或
     * prune（非窗格 / 非法声明，warn 已发）。
     */
    private _parsePaneDecl;
    /** 窗格选项应用（词汇表 {height,width,through,expandable,resize}；无效组合 warn 忽略该键） */
    private _applyPaneOptions;
    /** created 期订阅各窗格存在性表达式（scope.watch 双轨；返回值即初值） */
    private _setupPresence;
    /** 回流：重算 grid 模板 + absent 标记（窗格元素永不 reparent） */
    private _reflow;
    /** 由窗格现态派生 grid 模型 → 应用 rows/cols/areas/gap */
    private _applyGrid;
    /** 编译挂载某 kind 的窗格（gridArea = kind；degraded 的 content 缺席） */
    private _mountKind;
    /**
     * 编译挂载某侧的 sidebar 窗格：单个直挂 gridArea=side；≥2 个经 {@link buildSideSplitter}
     * 构建分割容器（x-splitter 属性 + 嵌套链）整体 temp 编译——splitter 在容器上自然实例化
     * （其 created 扫容器克隆子级收集面板快照，data-size 面板契约照常，决策七）。
     */
    private _mountSide;
    /** 编译单窗格子树（temp wrapper 技巧，splitter 先例）+ 契约属性与选项尺寸（分割窗格 width 走 data-size，不打 inline） */
    private _compilePane;
    /**
     * sidebar 默认注入 x-expandable（`ExpandableDirective.compose`，ADR-0070 splitter 同款）：
     * 折叠布尔真相由本指令持有（driver），把手/动画/事件全走 expandable 原生管线。
     * direction 由 sidebar 侧推导（用户声明接管 warn，对齐 splitter）；把手默认常驻
     * `showTrigger:'always'`（折叠态唯一重开触点）。显式声明 / opt-out 不注入。
     */
    private _setupCompose;
    /** 组合 driver 落点（把手点击翻转）：折叠记忆 lastSize、展开走恢复链（lastSize → 声明宽 → 240 兜底） */
    private _onDriverSet;
    /**
     * resize ↔ 折叠联动（Q26）：`resize:move` 持续记忆非折叠宽度（lastSize）；
     * `resize:end` 终值 ≤ 阈值（minSize，缺省 0）→ 翻转折叠布尔（终态由组合实例承接）。
     * 事件由 x-resizable 派发冒泡（ADR-0064 契约），宿主级单一监听按 target 反查窗格。
     */
    private _onPaneResize;
    /** gap 解析（x-layout-options.gap）：number → px；string 原样作 CSS gap 值（决策二/七） */
    private _readGap;
}
/** 布局单元词表 */
export type PaneKind = "header" | "content" | "sidebar" | "footer";
/** grid 模型（由窗格存在性 × through 派生；buildLayoutGrid 输入） */
export interface LayoutGridModel {
    header: boolean;
    footer: boolean;
    /** content 缺失（降级 `.` 空洞） */
    content: boolean;
    /** 该侧现存窗格数（0 = 列不存在） */
    left: number;
    right: number;
    /** 首个现存侧窗格的 through（资格随「首位」动态走） */
    ltUp: boolean;
    ltDown: boolean;
    rtUp: boolean;
    rtDown: boolean;
}
/** grid 模板产物（inline style 三件套的值） */
export interface LayoutGridTemplate {
    areas: string;
    rows: string;
    cols: string;
}
/**
 * grid 模板生成器（纯函数，ADR-0074 决策二；编译期与回流共用同一真相）。
 *
 * 列 = [left?] content(1fr) [right?]；行 = [header?] middle(1fr) [footer?]。
 * header/footer 行内：侧列被 through 占据（`left`/`right`），否则并入 header/footer
 * （非 through 侧窗格起于其下方——header 全宽是缺省态）；content 缺失降级为 `.` 空洞。
 * through=up 且无 header 行（无 header 窗格）时侧列自然全高，语义自洽无需特判。
 */
export declare function buildLayoutGrid(m: LayoutGridModel): LayoutGridTemplate;
/** 注入 layout 全局样式（幂等；多 engine 共享、destroy 不移除——全局样式惯例） */
export declare function registerLayoutStyles(): void;
