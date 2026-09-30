import { setVal } from "autostore";
import { AutoSparkDirectiveBase } from "../base";
import { isSimpleStatePath } from "../../scope";
import type { AutoSpark } from "../../engine";
import type { AutoDirectiveInfo } from "../types";
import { ExpandableDirective } from "./expandable";

/**
 * x-splitter：分割器（ADR-0067）——两面板（Pane）分割布局 + 分隔条（Divider）拖拽调节。
 *
 * **结构契约**（ownsChildren，ADR-0067 决策一）：宿主只认**两个渲染子元素**为面板
 * （`<template>`/`<script>` 非渲染元素静默容忍，不计数不编译）；多余渲染子元素 warn + 丢弃
 * （x-tree「多余 warn 丢弃」先例）；不足两个 warn 后退化为普通编译（内容不丢）。
 * 分隔条是引擎注入的真实元素（可聚焦、承载折叠把手），位于两面板之间。
 *
 * **值 = direction 表达式**（ADR-0067 决策二）：`x-splitter="'horizontal'"`（引号字符串字面量）
 * 或状态路径 / 表达式；求值非 `'vertical'` 一律按 `horizontal` 静默归一（表达式空窗期 undefined
 * 友好；drawer 静默归一先例）。切换 = 换轴重排：布局属性切换（CSS 按 data-direction 分派）+
 * 定容面板 inline 尺寸同值换轴重写（width ↔ height），面板/分隔条 DOM 不重建。
 *
 * **面板契约**（ADR-0067 决策三）：
 * - **定容面板（Sized Pane）**：声明 `data-size`（CSS 长度全形态：`"300"`/`"300px"`/`"30%"`/
 *   `"20rem"`，纯数字按 px）；至多一个——两个都声明 warn + 第二个按自适应处理；
 * - **自适应面板（Auto Pane）**：无 `data-size`，恒 flex:1 吸收剩余空间（可被拖拽压至 0，
 *   无防挤压下限——保底需求用 sized 的 `data-max-size` 表达）；
 * - `data-min-size` / `data-max-size` 仅定容面板认（auto 面板上声明 warn + 忽略）；
 *   混用单位允许（钳制统一换算 px 比较）；**初始声明值不钳制**（声明即真相，对齐 drawer
 *   `size`「配置值整键生效」先例），拖拽钳制恒遵守；
 * - 绑定形态 `:data-size` / `:data-min-size` / `:data-max-size`：编译期剥除（防 BindDirective
 *   双通道）、由本指令 watch——**简单可写路径**获得双向（拖拽/折叠写回状态）；表达式形态
 *   warn 一次 + 单向降级（状态→DOM 照常），把手点击走 UI-only 折叠（drawer「请求关闭」
 *   已知边界先例：下次状态变更重求值会拉回）。
 *
 * **双向防递归**（ADR-0067 决策六，三防线）：拖拽写回经 setVal → 自身 watcher 触发外部同步
 * → ① 拖拽/键盘会话期抑制（active 即跳过）+ ② 等值短路（px 相等不重应用）+ ③ 写回值经统一
 * 格式化（px 整数 / 其余两位小数），循环不可达。
 *
 * **写回保持声明单位**（ADR-0067 决策四）：`"30%"` 拖后写回 `"37.2%"`——单位是布局意图，
 * 拖拽不篡改；px 写 number（整数）、其余写 string（两位小数）。百分比基准 = 宿主主轴
 * clientWidth/Height；rem/em/vw/vh 按根字号/面板字号/视口换算。
 *
 * **分隔条**（ADR-0067 决策五）：真实元素 `role="separator"` + `tabindex=0`（键盘方向键
 * ±1px / Shift ±10px = 分隔条几何位移方向）；视觉 2px（`--autospark-splitter-divider-size`）、
 * 命中区 10px（`--autospark-splitter-hit-size`）；双 auto 静态形态（无 sized 面板）下分隔条
 * 仅视觉分界（data-static，不可聚焦不可拖、data-expandable 不适用）。
 *
 * **折叠 = 组合 x-expandable**（ADR-0070，决策七修订）：定容面板声明 `data-expandable`
 * 启用（空属性全默认 / JSON 透传 options；自适应面板 warn + 忽略）——面板上实例化
 * x-expandable（`ExpandableDirective.compose`），把手/动画/事件全走其原生管线。
 * **折叠布尔为真相**（组合实例持有；本指令的派生检测收敛为「拖拽/外部写值跨折叠目标 →
 * 翻转布尔」单点）；折叠目标 = options 的 `minSize`（`data-minimize-size` 与 `collapsible`
 * 选项已删除）；`direction` 按 sized 位次推导（首位 `left`/`top`、次位 `right`/`bottom`），
 * 展开尺寸由 lastSize 恢复链经 `composeSetMaxSize` 供给（options 中 `direction`/`maxSize`
 * 声明无效 warn）；面板把手默认 `showTrigger:'always'`（hover 感应边条与分隔条拖拽命中区
 * 冲突）。初始声明尺寸等于折叠目标即初始折叠（无动画不派发）。旧分隔条把手与
 * `splitter:collapse/expand` 事件已删除——事件走 `expandable:collapse/expand`（面板派发
 * 冒泡，宿主监听靠冒泡）。
 *
 * **事件**（ADR-0067 决策九）：`splitter:resize`（拖拽 end 时，detail `{ size }`）——
 * 宿主派发、DOM 冒泡，`@splitter:resize="..."` 监听。
 *
 * **嵌套零新机制**：子 splitter 声明在某面板内部，随子树编译自然生效。
 * 代价（决策一）：`engine.patch` 拒绝落入 splitter 子树（ownsChildren 动态区域防护）。
 * 样式经类级 `initialize` 全局注入（幂等，resize/toast 先例）。
 */

/** 长度声明（解析后形态）：数值 + 单位（px/%/rem/em/vw/vh） */
interface LengthDecl {
    value: number;
    unit: string;
}

/** CSS 长度串解析（纯数字按 px）；非法返回 null */
const LENGTH_RE = /^(-?(?:\d+(?:\.\d+)?))\s*(px|%|rem|em|vw|vh)?$/i;
function parseLength(raw: unknown): LengthDecl | null {
    if (typeof raw === "number") {
        return Number.isFinite(raw) ? { value: raw, unit: "px" } : null;
    }
    if (typeof raw !== "string") return null;
    const m = LENGTH_RE.exec(raw.trim());
    if (!m) return null;
    const value = parseFloat(m[1]!);
    return Number.isFinite(value) ? { value, unit: (m[2] ?? "px").toLowerCase() } : null;
}

/** CSS 值形态（写 inline style）：px 整数、其余两位小数 */
function formatCss(d: LengthDecl): string {
    return d.unit === "px"
        ? `${Math.round(d.value)}px`
        : `${Math.round(d.value * 100) / 100}${d.unit}`;
}

/** 状态写回形态（保持声明单位）：px 写 number（整数）、其余写 string（两位小数） */
function formatState(d: LengthDecl): number | string {
    return d.unit === "px" ? Math.round(d.value) : `${Math.round(d.value * 100) / 100}${d.unit}`;
}

/** 单位换算上下文（会话开始时快照一次——会话内恒定，消灭每帧读布局） */
interface UnitContext {
    /** 宿主主轴内容尺寸（% 基准） */
    container: number;
    rootFont: number;
    elFont: number;
    vw: number;
    vh: number;
}

/** 声明值 → px（钳制比较与拖拽数学用） */
function toPx(d: LengthDecl, ctx: UnitContext): number {
    switch (d.unit) {
        case "%":
            return (d.value / 100) * ctx.container;
        case "rem":
            return d.value * ctx.rootFont;
        case "em":
            return d.value * ctx.elFont;
        case "vw":
            return (d.value / 100) * ctx.vw;
        case "vh":
            return (d.value / 100) * ctx.vh;
        default:
            return d.value;
    }
}

/** px → 声明单位（写回换算，保持声明单位） */
function fromPx(px: number, unit: string, ctx: UnitContext): LengthDecl {
    switch (unit) {
        case "%":
            return { value: ctx.container > 0 ? (px / ctx.container) * 100 : 0, unit };
        case "rem":
            return { value: ctx.rootFont > 0 ? px / ctx.rootFont : 0, unit };
        case "em":
            return { value: ctx.elFont > 0 ? px / ctx.elFont : 0, unit };
        case "vw":
            return { value: ctx.vw > 0 ? (px / ctx.vw) * 100 : 0, unit };
        case "vh":
            return { value: ctx.vh > 0 ? (px / ctx.vh) * 100 : 0, unit };
        default:
            return { value: px, unit: "px" };
    }
}

/** 方向类型 */
export type SplitterDirection = "horizontal" | "vertical";

/** 面板声明（编译期收集的冻结快照 + 绑定表达式） */
interface PaneDecl {
    /** 文档序内索引（0 = 分隔条前、1 = 分隔后） */
    index: 0 | 1;
    /** 冻结快照（cloneNode(true)，模板只读契约——绑定属性已剥除） */
    template: HTMLElement;
    /** :data-size 绑定表达式（null = 静态/未声明） */
    sizeExpr: string | null;
    /** data-size 静态声明 */
    sizeStatic: LengthDecl | null;
    minExpr: string | null;
    minStatic: LengthDecl | null;
    maxExpr: string | null;
    maxStatic: LengthDecl | null;
    /** data-expandable 声明的透传 options（null = 未声明；{} = 空属性全默认） */
    expandable: Record<string, any> | null;
}

/** 拖拽/键盘会话快照（会话内约束与换算基准恒定——对齐 ResizeSession constraints 模式） */
interface SplitSession {
    /** 指针起点（clientX/Y；键盘会话无增量概念，恒 0） */
    pointerStart: number;
    /** 会话初 sized 面板 px（指针通道的绝对式基准，恒定不随应用更新） */
    basePx: number;
    /** 会话内递进尺寸 px（键盘步进在最新值上继续；指针通道每帧绝对式重算覆盖） */
    curPx: number;
    /** 换算基准快照 */
    ctx: UnitContext;
    /** 生效钳制（px；null = 无界） */
    minPx: number | null;
    maxPx: number | null;
    /** 写回单位（保持声明单位） */
    unit: string;
    /** 键盘会话标志（keyup/blur 收尾） */
    keyboard: boolean;
}

// 全局样式（类级 initialize 注入，幂等；CSS 变量定制视觉，ADR-0067 决策十）
const SPLITTER_STYLE_ID = "autospark-splitter-styles";
const SPLITTER_CSS = `
.autospark-splitter{display:flex;min-width:0;min-height:0;overflow:hidden;}
.autospark-splitter[data-direction="vertical"]{flex-direction:column;}
/* 面板：自适应恒 flex:1 吸收剩余空间（可压至 0）；定容 flex-basis 交还 inline 主轴尺寸 */
.autospark-splitter>[data-autospark-splitter-pane]{flex:1 1 0px;min-width:0;min-height:0;}
.autospark-splitter>[data-autospark-splitter-pane][data-autospark-splitter-sized]{flex:0 0 auto;}
.autospark-splitter-divider{position:relative;flex:0 0 auto;touch-action:none;user-select:none;-webkit-user-select:none;}
.autospark-splitter-divider::after{content:"";position:absolute;background:var(--autospark-splitter-color,transparent);transition:background .15s;}
.autospark-splitter[data-direction="horizontal"]>.autospark-splitter-divider{width:var(--autospark-splitter-hit-size,4px);cursor:col-resize;}
.autospark-splitter[data-direction="horizontal"]>.autospark-splitter-divider::after{top:0;bottom:0;left:calc(50% - var(--autospark-splitter-divider-size,2px)/2);width:var(--autospark-splitter-divider-size,2px);}
.autospark-splitter[data-direction="vertical"]>.autospark-splitter-divider{height:var(--autospark-splitter-hit-size,4px);cursor:row-resize;}
.autospark-splitter[data-direction="vertical"]>.autospark-splitter-divider::after{left:0;right:0;top:calc(50% - var(--autospark-splitter-divider-size,2px)/2);height:var(--autospark-splitter-divider-size,2px);}
.autospark-splitter-divider:hover::after,.autospark-splitter-divider:focus-visible::after{background:var(--autospark-splitter-color-hover,#94a3b8);}
.autospark-splitter-divider:focus-visible{outline:none;}
.autospark-splitter-divider[data-static]{cursor:default;}
/* 组合把手（ADR-0070）：x-expandable 的感应边条在本语境被抑制——24px 边条会整体遮挡
   分隔条拖拽命中区；感应面由分隔条本身充当（divider:hover 经桥接类显形把手，见
   _buildDivider），把手本体 hover/聚焦照常显形（共享契约） */
.autospark-splitter>.autospark-expandable>.autospark-expandable-edge{display:none!important;}
/* 折叠动画的 transition 规则由组合的 x-expandable 提供（.autospark-expandable[data-animating]，
   把手视觉在共享把手模块）——本指令只保留拖拽/键盘会话的强制禁用（优先级压过动画通道） */
.autospark-splitter[data-dragging]>[data-autospark-splitter-pane]{transition:none!important;}
`;

/** 注入 splitter 全局样式（幂等；多 engine 共享、destroy 不移除——对齐全局样式惯例） */
export function registerSplitterStyles(): void {
    if (document.getElementById(SPLITTER_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = SPLITTER_STYLE_ID;
    style.textContent = SPLITTER_CSS;
    document.head.appendChild(style);
}

/** 把手滑轨定位的样式表钳制形态见 SPLITTER_CSS（inline 只写 --as-rail 坐标变量） */

/**
 * x-splitter 指令（ADR-0067）：Compile 类结构指令（ownsChildren——剥伪绑定后自行编译
 * 两面板、注入分隔条）。实现结构见类头注释。
 */
export class SplitterDirective extends AutoSparkDirectiveBase {
    static override readonly priority = 0;
    static override readonly singleton = true;

    /** 结构指令：接管子树（编译两面板 + 注入分隔条，多余渲染子元素 warn 丢弃） */
    static override ownsChildren(_info: AutoDirectiveInfo): boolean {
        return true;
    }

    /** 类级初始化：注入全局样式（幂等） */
    static override initialize(_engine: AutoSpark): void {
        registerSplitterStyles();
    }

    // ── 编译期收集态 ──────────────────────────────────────────────────

    /** 当前方向（表达式求值派生，非 vertical 一律 horizontal） */
    private _dir: SplitterDirection = "horizontal";
    /** 面板声明（1~2 个；length < 2 = 已降级普通编译） */
    private _panes: PaneDecl[] = [];
    /** sized 面板在其间的序（0 = 分隔条前；null = 无 sized（双 auto 静态形态）） */
    private _sizedIndex: 0 | 1 | null = null;

    // ── 运行态 ────────────────────────────────────────────────────────

    /** 面板编译产物（compile 期填充；与 _panes 对齐） */
    private _paneEls: HTMLElement[] = [];
    /** 分隔条元素 */
    private _divider: HTMLElement | null = null;
    /** 折叠组合实例（sized 面板声明 data-expandable 时创建，ADR-0070） */
    private _composeInst: ExpandableDirective | null = null;
    /** 折叠目标（组合 options 的 minSize 解析；null = 0 隐藏——slide 通道） */
    private _paneMinDecl: LengthDecl | null = null;
    /** sized 面板当前声明值（唯一内部真相；null = 无 sized） */
    private _curSize: LengthDecl | null = null;
    /** 折叠前尺寸记忆（实例状态；engine destroy 随实例回收） */
    private _lastSize: LengthDecl | null = null;
    /** sized 尺寸的可写状态路径（null = 静态声明或表达式降级） */
    private _sizePath: string | null = null;
    /** 表达式降级 warn 已发（一次） */
    private _warnedReadonly = false;
    /** UI-only 折叠 warn 已发（一次） */
    private _warnedUiOnly = false;
    /** 当前折叠态（组合布尔的本地镜像——拖拽/外部写值跨目标检测与恢复链判据） */
    private _collapsed = false;
    /** 进行中的拖拽/键盘会话（null = 空闲） */
    private _session: SplitSession | null = null;
    /** 键盘会话所在元素（keyup/blur 收尾判定） */
    private _kbTarget: HTMLElement | null = null;
    /** 微任务建连前被销毁（快速 x-if 切换防护） */
    private _destroyed = false;

    // ── 生命周期 ──────────────────────────────────────────────────────

    override created(): void {
        this._collectPanes();
        this._setupDirection();
        if (this._panes.length === 2) this._setupSizeBinding();
    }

    override compile(_context: Record<string, any>, _parent: HTMLElement): void {
        if (this._panes.length !== 2 || !this.template) {
            // 降级：不足两个面板，全部子节点普通编译（内容不丢）
            this.engine.compiler.compileSubtree(this.el, this.template!, this.binding);
            return;
        }
        // 组装：pane1 → divider → pane2（compileSubtree 恒 appendChild，按序追加即文档序）
        this._compilePane(0);
        this._buildDivider();
        this._compilePane(1);
        // 布局身份与初始尺寸（host 属性/类 + pane inline；allowTarget——初始折叠场景
        // 面板宽度先行落位，组合实例的初始滑出才有 extent 可测）
        this._applyDirection(this._dir, true);
        if (this._sizedIndex != null && this._curSize) {
            this._applySize(this._curSize, true);
        }
        this._setupCompose();
    }

    override destroy(): void {
        this._destroyed = true;
        this._session = null;
        this._kbTarget = null;
        this._composeInst?.destroy();
        this._composeInst = null;
    }

    // ── 面板收集（created 期，模板只读）────────────────────────────────

    /**
     * 扫描宿主模板直接子元素：只认两个渲染元素为面板（`<template>`/`<script>` 静默容忍
     * 不计数不编译）；多余渲染子元素 warn + 丢弃（x-tree 先例）；空白文本静默、非空白文本
     * warn 丢弃。冻结快照 clone（模板只读契约），绑定形态伪属性剥除（防 BindDirective 双通道）。
     */
    private _collectPanes(): void {
        const tpl = this.template;
        if (!tpl) return;
        for (const child of Array.from(tpl.children)) {
            // 非渲染元素静默容忍（不计数、不进结果 DOM）
            if (child instanceof HTMLTemplateElement || child instanceof HTMLScriptElement) {
                continue;
            }
            if (this._panes.length >= 2) {
                this.warn(
                    `x-splitter: 多余的子元素 <${child.localName}> 被丢弃——宿主只允许两个面板（ADR-0067 决策一）`,
                );
                continue;
            }
            this._panes.push(this._declarePane(child as HTMLElement, this._panes.length as 0 | 1));
        }
        if (this._panes.length < 2) {
            this.warn(
                `x-splitter: 宿主至少需要两个面板子元素（实际 ${this._panes.length} 个），已退化为普通编译`,
            );
        }
    }

    /** 单面板声明：克隆冻结快照 + 解析 data-size 家族（静态/绑定两形态）+ 剥除绑定伪属性 */
    private _declarePane(el: HTMLElement, index: 0 | 1): PaneDecl {
        const decl: PaneDecl = {
            index,
            template: el.cloneNode(true) as HTMLElement,
            sizeExpr: null,
            sizeStatic: null,
            minExpr: null,
            minStatic: null,
            maxExpr: null,
            maxStatic: null,
            expandable: null,
        };
        const read = (name: string): { expr: string | null; staticValue: LengthDecl | null } => {
            const bound =
                decl.template.getAttribute(`:${name}`) ??
                decl.template.getAttribute(`x-bind:${name}`);
            if (bound != null) {
                // 绑定形态：剥除（本指令自行 watch，防 BindDirective 双通道编译）
                decl.template.removeAttribute(`:${name}`);
                decl.template.removeAttribute(`x-bind:${name}`);
                return { expr: bound.trim(), staticValue: null };
            }
            const raw = decl.template.getAttribute(name);
            return { expr: null, staticValue: raw != null ? parseLength(raw) : null };
        };
        const size = read("data-size");
        const min = read("data-min-size");
        const max = read("data-max-size");
        decl.sizeExpr = size.expr;
        decl.sizeStatic = size.staticValue;
        decl.minExpr = min.expr;
        decl.minStatic = min.staticValue;
        decl.maxExpr = max.expr;
        decl.maxStatic = max.staticValue;
        // data-expandable（折叠组合声明，ADR-0070）：空属性 = 全默认；JSON 对象 = 透传
        // options。绑定形态不支持（warn + 忽略）；解析失败 warn + 按空对象（仍启用）
        if (
            decl.template.getAttribute(":data-expandable") ||
            decl.template.getAttribute("x-bind:data-expandable")
        ) {
            decl.template.removeAttribute(":data-expandable");
            decl.template.removeAttribute("x-bind:data-expandable");
            this.warn(
                `x-splitter: :data-expandable 绑定形态不支持（options 为静态声明），已按未声明处理`,
            );
        } else {
            const rawExp = decl.template.getAttribute("data-expandable");
            if (rawExp != null) {
                decl.template.removeAttribute("data-expandable");
                decl.expandable = {};
                const s = rawExp.trim();
                if (s !== "") {
                    try {
                        const v = JSON.parse(s);
                        if (v && typeof v === "object" && !Array.isArray(v)) {
                            decl.expandable = v;
                        } else {
                            this.warn(
                                `x-splitter: data-expandable 值 "${rawExp}" 须为 options JSON 对象，已按默认参数处理`,
                            );
                        }
                    } catch {
                        this.warn(
                            `x-splitter: data-expandable 值 "${rawExp}" 不是合法 JSON，已按默认参数处理`,
                        );
                    }
                }
            }
        }
        // 非法静态值 warn（有绑定表达式者豁免——表达式非法值运行时按无约束处理）
        for (const [label, parsed, expr] of [
            ["data-size", size.staticValue, size.expr],
            ["data-min-size", min.staticValue, min.expr],
            ["data-max-size", max.staticValue, max.expr],
        ] as const) {
            const raw = decl.template.getAttribute(label);
            if (raw != null && parsed == null && expr == null) {
                this.warn(
                    `x-splitter: ${label} 值 "${raw}" 无法解析为 CSS 长度（支持 px/%/rem/em/vw/vh），已忽略`,
                );
            }
        }
        return decl;
    }

    /** 编译单个面板到宿主（temp wrapper 技巧：compileSubtree 只认模板子节点） */
    private _compilePane(index: 0 | 1): void {
        const decl = this._panes[index]!;
        const temp = document.createElement("div");
        temp.appendChild(decl.template);
        const nodes = this.engine.compiler.compileSubtree(this.el, temp, this.binding);
        const pane = nodes.find((n) => n instanceof HTMLElement) as HTMLElement | undefined;
        if (!pane) return;
        pane.setAttribute("data-autospark-splitter-pane", "");
        // 定容面板契约属性（flex-basis 交还 inline 主轴尺寸的 CSS 钩子）
        if (
            this._panes[index] != null &&
            (this._panes[index]!.sizeExpr != null || this._panes[index]!.sizeStatic != null)
        ) {
            pane.setAttribute("data-autospark-splitter-sized", "");
        }
        this._paneEls[index] = pane;
    }

    // ── direction ─────────────────────────────────────────────────────

    /** direction 解析：引号字符串字面量静态生效；否则作表达式 watch（非 vertical 静默归一） */
    private _setupDirection(): void {
        const raw = String(this.value ?? "").trim();
        if (raw === "") return;
        const quoted = /^(['"])(.*)\1$/.exec(raw);
        if (quoted) {
            this._dir = this._normalizeDir(quoted[2] ?? "");
            return;
        }
        const initial = this.binding.watch(raw, ({ value }) => {
            this._applyDirection(this._normalizeDir(typeof value === "string" ? value : ""), false);
        });
        this._dir = this._normalizeDir(typeof initial === "string" ? initial : "");
    }

    /** 非 'vertical' 一律 horizontal（表达式空窗期 undefined 友好，静默归一） */
    private _normalizeDir(v: string): SplitterDirection {
        return v === "vertical" ? "vertical" : "horizontal";
    }

    /** 应用方向：host 属性/类 + sized 尺寸换轴重写 + 分隔条/把手方向分派 */
    private _applyDirection(dir: SplitterDirection, initial: boolean): void {
        const changed = this._dir !== dir || initial;
        this._dir = dir;
        this.el.classList.add("autospark-splitter");
        this.el.setAttribute("data-direction", dir);
        if (this._divider) {
            this._divider.setAttribute(
                "aria-orientation",
                dir === "horizontal" ? "vertical" : "horizontal",
            );
        }
        // sized 尺寸换轴重写（同值 width ↔ height；size 声明轴中立）——先清旧轴 inline，
        // 避免旧轴值钉死新方向的交叉轴布局
        if (!initial && changed && this._sizedIndex != null) {
            const pane = this._paneEls[this._sizedIndex];
            if (pane) pane.style.removeProperty(dir === "horizontal" ? "height" : "width");
            // 组合实例换轴：清滑出痕迹（负 margin/transform）后按当前态重应用终态
            this._composeInst?.composeSetDirection(this._expandableDir());
            if (!this._collapsed && this._curSize) this._applySize(this._curSize);
        }
    }

    // ── data-size 家族绑定 ────────────────────────────────────────────

    /** sized 面板识别 + size/min/max 订阅（简单路径双向；表达式单向降级） */
    private _setupSizeBinding(): void {
        let sized: PaneDecl | null = null;
        for (const p of this._panes) {
            if (p.sizeExpr != null || p.sizeStatic != null) {
                if (sized == null) {
                    sized = p;
                } else {
                    this.warn(
                        `x-splitter: 第二个声明 data-size 的面板按自适应处理（至多一个定容面板，ADR-0067 决策三）`,
                    );
                }
            } else if (
                p.minExpr != null ||
                p.minStatic != null ||
                p.maxExpr != null ||
                p.maxStatic != null ||
                p.expandable != null
            ) {
                this.warn(
                    `x-splitter: data-min-size/data-max-size/data-expandable 仅定容面板（声明 data-size 者）认读，自适应面板上的声明已忽略`,
                );
            }
        }
        if (sized == null) return; // 双 auto 静态形态：分隔条 data-static（_buildDivider 判定）
        this._sizedIndex = sized.index;
        this._curSize = sized.sizeStatic;
        // 唯一化：非 sized 面板的 size 声明清零（2 sized 降级后按 auto 处理——编译期
        // sized 契约属性与运行期判定同源，不残留第二声明）
        for (const p of this._panes) {
            if (p !== sized) {
                p.sizeExpr = null;
                p.sizeStatic = null;
                p.minExpr = null;
                p.minStatic = null;
                p.maxExpr = null;
                p.maxStatic = null;
                p.expandable = null;
            }
        }

        // size 订阅
        if (sized.sizeExpr != null) {
            const expr = sized.sizeExpr;
            if (isSimpleStatePath(expr)) {
                this._sizePath = expr;
            } else if (!this._warnedReadonly) {
                // 表达式只读降级（对齐 x-model/x-resize 先例）
                this._warnedReadonly = true;
                this.warn(
                    `x-splitter: :data-size 值 "${expr}" 非简单状态路径，退化为单向（状态→DOM；拖拽/折叠写回须绑定对象路径）`,
                );
            }
            const initial = this.binding.watch(expr, ({ value }) => this._applyFromState(value));
            if (this._curSize == null) this._curSize = this._parseStateLength(initial);
        }
        // min/max 订阅（生效值缓存——钳制会话开始时取快照；表达式形态不支持，静态值兜底）
        if (sized.minExpr != null && isSimpleStatePath(sized.minExpr)) {
            const initial = this.binding.watch(sized.minExpr, ({ value }) => {
                this._minBound = this._parseStateLength(value);
            });
            this._minBound = this._parseStateLength(initial);
        }
        if (sized.maxExpr != null && isSimpleStatePath(sized.maxExpr)) {
            const initial = this.binding.watch(sized.maxExpr, ({ value }) => {
                this._maxBound = this._parseStateLength(value);
            });
            this._maxBound = this._parseStateLength(initial);
        }
    }

    /** 状态值 → 长度声明（number=px；string 解析；非法 null） */
    private _parseStateLength(v: any): LengthDecl | null {
        if (v == null) return null;
        return parseLength(v);
    }

    /** min/max 绑定现值缓存（订阅回调维护；null = 未绑定或值非法） */
    private _minBound: LengthDecl | null = null;
    private _maxBound: LengthDecl | null = null;

    /** 现读 min/max 生效值（绑定现值优先、静态声明兜底；null = 无界） */
    private _readBound(kind: "min" | "max"): LengthDecl | null {
        const s = this._panes[this._sizedIndex!];
        if (!s) return null;
        const bound = kind === "min" ? this._minBound : this._maxBound;
        if (bound != null) return bound;
        return kind === "min" ? s.minStatic : s.maxStatic;
    }

    /**
     * 折叠目标（组合 options 的 minSize，ADR-0070）：null = 无声明 → 折叠 = 0（隐藏，
     * slide 负 margin 通道）；有声明 → 折叠 = 该尺寸（收缩迷你形态）。
     */
    private _collapseTarget(): LengthDecl | null {
        return this._paneMinDecl;
    }

    // ── 分隔条与把手 ──────────────────────────────────────────────────

    /** 构建分隔条（双 auto 静态形态：data-static——不可聚焦不可拖、无把手） */
    private _buildDivider(): void {
        const divider = document.createElement("div");
        divider.className = "autospark-splitter-divider";
        divider.setAttribute("role", "separator");
        divider.setAttribute("data-autospark-splitter-divider", "");
        this.el.appendChild(divider);
        this._divider = divider;
        if (this._sizedIndex == null) {
            divider.setAttribute("data-static", "");
            return;
        }
        divider.tabIndex = 0;
        divider.setAttribute("aria-label", "调节分隔");
        divider.addEventListener("pointerdown", this._onPointerDown);
        divider.addEventListener("keydown", this._onKeyDown);
        divider.addEventListener("keyup", this._endKeyboard);
        divider.addEventListener("blur", this._endKeyboard);
        // hover 桥接（showTrigger:'hover' 默认，ADR-0070 修订）：分隔条本身充当全长感应线
        // ——enter/leave 经组合接缝置位把手 data-edge-hover（统一桥接契约）；x-expandable
        // 感应边条在 splitter 语境被样式表抑制，理由见 _setupCompose。always 模式无副作用（恒显）
        divider.addEventListener("mouseenter", () => {
            this._composeInst?.composeSetEdgeHover(true);
        });
        divider.addEventListener("mouseleave", () => {
            this._composeInst?.composeSetEdgeHover(false);
        });
    }

    // ── 折叠组合（ADR-0070）───────────────────────────────────────────

    /** 组合实例的收起方向：按 sized 位次推导（首位向主端收、次位向对端收） */
    private _expandableDir(): "left" | "right" | "top" | "bottom" {
        const first = this._sizedIndex === 0;
        return this._dir === "horizontal" ? (first ? "left" : "right") : first ? "top" : "bottom";
    }

    /**
     * 组合实例装配（compile 末尾）：sized 面板声明 `data-expandable` → 面板上实例化
     * x-expandable（把手/动画/事件全管线）。**折叠布尔为真相**：driver 由本指令持有——
     * get 供初值（初始声明 == 折叠目标即初始折叠），set 承接把手翻转（记忆 lastSize/
     * 状态写回后再经 composeSet 驱动全管线）。初始应用微任务与模板形态同一时机语义
     * （无动画、不派发事件）。options 接管语义：direction 按位次推导、maxSize 由
     * lastSize 恢复链供给（声明无效 warn）；面板把手默认 `showTrigger:'always'`。
     */
    private _setupCompose(): void {
        if (this._sizedIndex == null) return;
        const decl = this._panes[this._sizedIndex]!;
        if (decl.expandable == null) return;
        const pane = this._paneEls[this._sizedIndex];
        if (!pane) return;
        const opts: Record<string, any> = { ...decl.expandable };
        for (const k of ["direction", "maxSize", "resize"] as const) {
            if (k in opts) {
                this.warn(
                    `x-splitter: data-expandable 的 "${k}" 由分割器接管（direction 按 sized 位次推导、展开尺寸由 lastSize 恢复链决定、面板调节走分隔条拖拽），声明被忽略`,
                );
                delete opts[k];
            }
        }
        opts.direction = this._expandableDir(); // 推导方向注入（初始装配；换轴走 composeSetDirection）
        // 显隐默认 'hover'（用户裁决）：x-expandable 的感应边条在 splitter 语境被样式表
        // 抑制（会整体遮挡分隔条拖拽命中区）——感应面由分隔条本身充当（hover 桥接见
        // _buildDivider）；折叠态把手恒显（滑出折叠 dock 规则 / 收缩态折叠目标触达）
        if (opts.showTrigger === undefined) opts.showTrigger = "hover";
        // 把手中分分隔条：注入分隔条宽度一半的偏移（offset 固定轴语义 + = 右/下）——
        // 与 sized 位次相关：首位面板分隔条在其跨轴正方向（+half）、次位在负方向（−half）；
        // 用户显式声明 offset 则尊重不覆盖
        if (opts.offset === undefined) {
            const hitHalf = "var(--autospark-splitter-hit-size, 4px) / 2";
            opts.offset = this._sizedIndex === 0 ? `calc(${hitHalf})` : `calc(-1 * ${hitHalf})`;
        }
        this._paneMinDecl = opts.minSize != null ? parseLength(opts.minSize) : null;
        this._collapsed = this._curSize != null && this._isCollapseTarget(this._curSize);
        this._composeInst = ExpandableDirective.compose(
            this.engine,
            this.binding,
            pane,
            opts,
            { get: () => !this._collapsed, set: (v) => this._onDriverSet(v) },
        );
        this._composeInst.created();
        this._composeInst.compile(undefined as any, pane);
    }

    /**
     * 组合 driver 落点（把手点击/键盘翻转，ADR-0070 决策三）：折叠前记忆 lastSize
     * （实例状态），展开走恢复链（lastSize → 声明值[非折叠值] → 200px 兜底）经
     * composeSetMaxSize 喂给组合实例；绑定形态同步写回状态（watcher 回流被等值短路吸收）。
     */
    private _onDriverSet(expanded: boolean): void {
        if (this._sizedIndex == null || this._composeInst == null) return;
        // 表达式形态尺寸（不可写）：UI-only warn 一次
        if (
            !this._sizePath &&
            this._panes[this._sizedIndex]?.sizeExpr != null &&
            !this._warnedUiOnly
        ) {
            this._warnedUiOnly = true;
            this.warn(
                `x-splitter: :data-size 为表达式形态（不可写），本次折叠/展开仅作用于 UI，状态变更后会被拉回`,
            );
        }
        if (expanded) {
            const restore = this._restoreDecl();
            this._curSize = restore;
            this._collapsed = false;
            this._composeInst.composeSetMaxSize(restore);
            this._composeInst.composeSet(true);
        } else {
            if (this._curSize && !this._isCollapseTarget(this._curSize)) {
                this._lastSize = this._curSize;
            }
            this._curSize = this._collapseTarget() ?? {
                value: 0,
                unit: this._curSize?.unit ?? "px",
            };
            this._collapsed = true;
            this._composeInst.composeSet(false);
        }
        if (this._sizePath) {
            try {
                setVal(
                    this.engine.store.state,
                    this._sizePath.split(this.engine.store.delimiter),
                    formatState(this._curSize),
                );
            } catch (e: any) {
                this.warn(`x-splitter: 尺寸写回失败（"${this._sizePath}"）: ${e?.message ?? e}`);
            }
        }
    }

    /** 展开恢复链：lastSize → 声明值（仅非折叠态值）→ 200px 兜底 */
    private _restoreDecl(): LengthDecl {
        const declared = this._panes[this._sizedIndex!]!.sizeStatic;
        const target = this._collapseTarget();
        const declaredRestorable =
            !!declared &&
            declared.value > 0 &&
            !(target && declared.value === target.value && declared.unit === target.unit);
        return this._lastSize ?? (declaredRestorable ? declared! : null) ?? { value: 200, unit: "px" };
    }

    // ── 尺寸应用与写回 ────────────────────────────────────────────────

    /**
     * 应用尺寸（普通尺寸通道：inline 直写 + 簿记）。**折叠目标值不经此写**——终态由
     * 组合实例承担（slide 负 margin / 收缩写 minSize）；allowTarget 服务初始应用
     * （初始折叠场景面板宽度先行落位，组合实例初始滑出才有 extent 可测）。
     */
    private _applySize(d: LengthDecl, allowTarget = false): void {
        const idx = this._sizedIndex;
        const pane = idx != null ? this._paneEls[idx] : undefined;
        if (!pane) return;
        if (!allowTarget && this._isCollapseTarget(d)) return;
        this._curSize = d;
        pane.style[this._dir === "horizontal" ? "width" : "height"] = formatCss(d);
    }

    /** 外部状态 → DOM（反向通道）：会话期抑制 + 等值短路（防递归）+ 跨折叠目标驱动组合实例 */
    private _applyFromState(value: any): void {
        if (this._destroyed || value == null || this._sizedIndex == null) return;
        if (this._session) return; // 会话抑制：拖拽优先
        const d = this._parseStateLength(value);
        if (d == null) return;
        // 跨折叠目标（ADR-0070 派生检测单点）：目标值 → 折叠；非目标值 → 展开 + 应用尺寸
        if (this._composeInst != null && this._isCollapseTarget(d)) {
            if (this._collapsed) return; // 已折叠，等值短路
            if (this._curSize && !this._isCollapseTarget(this._curSize)) {
                this._lastSize = this._curSize;
            }
            this._curSize = this._collapseTarget() ?? { value: 0, unit: d.unit };
            this._collapsed = true;
            this._composeInst.composeSet(false);
            return;
        }
        const cur = this._curSize;
        if (!this._collapsed && cur && cur.value === d.value && cur.unit === d.unit) {
            return; // 等值短路
        }
        if (this._composeInst != null && this._collapsed) {
            // 折叠态收到非目标尺寸 → 展开（组合实例写 inline，本指令同步簿记）
            this._composeInst.composeSetMaxSize(d);
            this._curSize = d;
            this._collapsed = false;
            this._composeInst.composeSet(true);
            return;
        }
        this._applySize(d);
    }

    // ── 指针拖拽（1-D 会话，对齐 ResizeSession 模式）──────────────────

    private _onPointerDown = (ev: PointerEvent): void => {
        if (this._destroyed || this._sizedIndex == null) return;
        if ((ev as any).button > 0) return;
        ev.preventDefault();
        const divider = this._divider!;
        this._beginSession(ev, false);
        try {
            divider.setPointerCapture?.(ev.pointerId);
        } catch {
            /* 降级环境无 capture：listener 挂分隔条本体，拖出即止 */
        }
        const move = (e: PointerEvent) => this._onPointerMove(e);
        const up = () => {
            divider.removeEventListener("pointermove", move as EventListener);
            divider.removeEventListener("pointerup", up);
            divider.removeEventListener("pointercancel", up);
            try {
                divider.releasePointerCapture?.(ev.pointerId);
            } catch {
                /* 同上 */
            }
            this._endSession();
        };
        divider.addEventListener("pointermove", move as EventListener);
        divider.addEventListener("pointerup", up);
        divider.addEventListener("pointercancel", up);
    };

    private _onPointerMove = (ev: PointerEvent): void => {
        const s = this._session;
        if (!s || s.keyboard) return;
        // 绝对式数学：会话初值 + 总位移（不基于上一轮 clamp 产物递进——残差不累积）；
        // 方向语义：sized 在前 → 分隔条右/下移 = 增；sized 在后 → 反向
        const pos = this._dir === "horizontal" ? ev.clientX : ev.clientY;
        const total = pos - s.pointerStart;
        this._applyPx(s.basePx + (this._sizedIndex === 0 ? total : -total));
    };

    /** 会话开始：快照换算基准与钳制（会话内恒定，消灭每帧 reflow） */
    private _beginSession(ev: PointerEvent | null, keyboard: boolean): void {
        const pane = this._paneEls[this._sizedIndex!]!;
        const prop = this._dir === "horizontal" ? "width" : "height";
        // 起始 px：inline 数值优先（亚像素精确、无布局环境可用），布局值兜底（% 声明的真实渲染值）
        const inline = parseFloat(pane.style[prop]);
        const rect = pane.getBoundingClientRect();
        const basePx = Number.isFinite(inline)
            ? inline
            : Number.isFinite(rect[prop])
              ? rect[prop]
              : 0;
        const host = this.el;
        const cs = typeof getComputedStyle === "function" ? getComputedStyle(pane) : null;
        const ctx: UnitContext = {
            container: this._dir === "horizontal" ? host.clientWidth : host.clientHeight,
            rootFont:
                typeof getComputedStyle === "function"
                    ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
                    : 16,
            elFont: (cs && parseFloat(cs.fontSize)) || 16,
            vw: typeof window !== "undefined" ? window.innerWidth : 0,
            vh: typeof window !== "undefined" ? window.innerHeight : 0,
        };
        const minD = this._readBound("min");
        const maxD = this._readBound("max");
        this._session = {
            pointerStart: ev ? (this._dir === "horizontal" ? ev.clientX : ev.clientY) : 0,
            basePx,
            curPx: basePx,
            ctx,
            minPx: minD ? toPx(minD, ctx) : null,
            maxPx: maxD ? toPx(maxD, ctx) : null,
            unit: this._curSize?.unit ?? "px",
            keyboard,
        };
        host.setAttribute("data-dragging", "");
    }

    /** 会话内调节落点（钳制 → 递进记账 → 跨目标翻转检测 → 应用 → 写回；end 时派发 resize） */
    private _applyPx(rawPx: number): void {
        const s = this._session;
        if (!s || this._sizedIndex == null) return;
        let px = rawPx;
        if (s.minPx != null && px < s.minPx) px = s.minPx;
        if (s.maxPx != null && px > s.maxPx) px = s.maxPx;
        if (px < 0) px = 0;
        s.curPx = px;
        const d = fromPx(px, s.unit, s.ctx);
        if (this._composeInst != null) {
            // 拖拽跨折叠目标（ADR-0070 派生检测单点）：翻转载体布尔，终态由组合实例承接
            // （composeSet 恒瞬时——data-dragging 强制禁用 transition）
            const toCollapsed = this._isCollapseTarget(d);
            if (toCollapsed !== this._collapsed) {
                this._collapsed = toCollapsed;
                if (toCollapsed) {
                    this._curSize = this._collapseTarget() ?? { value: 0, unit: s.unit };
                    this._composeInst.composeSet(false, false);
                } else {
                    this._curSize = d;
                    this._composeInst.composeSetMaxSize(d);
                    this._composeInst.composeSet(true, false);
                }
            } else if (!toCollapsed) {
                this._applySize(d);
            }
        } else {
            this._applySize(d);
        }
        this._writeSizeThrottled(d);
    }

    /** 拖拽/键盘中的写回（实时；响应式下游由调度器合并） */
    private _writeSizeThrottled(d: LengthDecl): void {
        if (this._sizePath) {
            try {
                setVal(
                    this.engine.store.state,
                    this._sizePath.split(this.engine.store.delimiter),
                    formatState(d),
                );
            } catch {
                /* 会话内静默——end 时最终值仍会写一次 */
            }
        }
    }

    /** 会话结束：摘 data-dragging + splitter:resize 事件（最终值） */
    private _endSession(): void {
        const s = this._session;
        if (!s) return;
        this._session = null;
        this._kbTarget = null;
        this.el.removeAttribute("data-dragging");
        if (this._curSize) {
            this.el.dispatchEvent(
                new CustomEvent("splitter:resize", {
                    detail: { size: formatState(this._curSize) },
                    bubbles: true,
                }),
            );
        }
    }

    // ── 键盘微调（方向键 = 分隔条几何位移方向，±1px / Shift ±10px）─────

    private _onKeyDown = (ev: KeyboardEvent): void => {
        if (this._destroyed || this._sizedIndex == null) return;
        const step = ev.shiftKey ? 10 : 1;
        let delta = 0; // 分隔条位移量（px，正向 = 右/下移）
        switch (ev.key) {
            case "ArrowRight":
                delta = this._dir === "horizontal" ? step : 0;
                break;
            case "ArrowLeft":
                delta = this._dir === "horizontal" ? -step : 0;
                break;
            case "ArrowDown":
                delta = this._dir === "vertical" ? step : 0;
                break;
            case "ArrowUp":
                delta = this._dir === "vertical" ? -step : 0;
                break;
            default:
                return;
        }
        if (delta === 0) return;
        ev.preventDefault();
        if (!this._session) this._beginSession(null, true);
        if (!this._session) return;
        this._kbTarget = this._divider;
        // 方向语义：sized 在前 → 分隔条右/下移 = 增；sized 在后 → 反向（键盘递进式）
        const directed = this._sizedIndex === 0 ? delta : -delta;
        this._applyPx(this._session.curPx + directed);
    };

    private _endKeyboard = (): void => {
        if (!this._session?.keyboard) return;
        this._endSession();
    };

    /** 声明值是否为折叠目标（跨目标翻转检测与 lastSize 记忆判据共用） */
    private _isCollapseTarget(d: LengthDecl): boolean {
        const target = this._collapseTarget();
        return target ? d.value === target.value && d.unit === target.unit : d.value === 0;
    }
}
