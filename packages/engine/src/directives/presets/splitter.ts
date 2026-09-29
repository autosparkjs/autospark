import { setVal } from "autostore";
import { AutoSparkDirectiveBase } from "../base";
import { isSimpleStatePath } from "../../scope";
import type { AutoSpark } from "../../engine";
import type { AutoDirectiveInfo } from "../types";

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
 * 仅视觉分界（data-static，不可聚焦不可拖、collapsible 不生效）。
 *
 * **折叠**（ADR-0067 决策七 + 修订）：`collapsible` 容器级选项，默认 `false`。
 * **折叠 ≡ 纯派生态**（无独立 collapsed 真相源，drawer「折叠 ≡ visible 归假」同构）：
 * 折叠目标 = `data-minimize-size` 声明（面板保留最小化可见形态）或缺省 **0**（隐藏）——
 * 折叠态判定 = 当前尺寸等于折叠目标（声明值全等），初始声明即折叠目标则初始折叠
 * （不派发事件）。`collapsible` 三态坐标化（对齐 drawer trigger）：`true` ≡ `'50%'` 居中 /
 * `number` px / `string` CSS 长度——把手沿分隔条长轴一维定位，正距主端、负距对端，
 * **纯 CSS 钳制**（样式表 `max()/min()`，越界静默钳到 `[half, rail − half]`——把手是唯一
 * 重开触发点永可达），非法值 warn 回退居中。把手点击：折叠前记忆 lastSize（实例状态，
 * engine destroy 随 instance 回收）、展开恢复；折叠写目标值 **绕过 min 钳制**（折叠目标
 * 是特殊语义值）。箭头 = 内置全局图标 `arrow`（`<use href="#as-arrow">`，用户同名覆盖
 * 自动跟随），指向下一步动作的分隔条位移方向、随折叠态翻转（`data-collapsed` 为
 * **存在性属性**——恒 setAttribute(String) 会让 "false" 命中 CSS 选择器，箭头恒折叠向）。
 * 把手是分隔条子元素，天然随分隔条滑移（drawer 的实例外重定位复杂度被 DOM 嵌套消解）；
 * 指针流拦截把手 pointerdown（分隔条的 preventDefault 会抑制合成 click，见 _buildTrigger）。
 *
 * **动画**（ADR-0067 决策八）：transition 绑定「折叠态翻转」而非尺寸变更——跨 0 边界的
 * 变更（把手/键盘/外部写 0 或恢复）都动画，非跨 0 变更（含拖拽全程）瞬时；拖拽会话期
 * 强制禁用。时长 `--autospark-splitter-duration`（默认 .25s）。
 *
 * **事件**（ADR-0067 决策九）：`splitter:resize`（拖拽 end 时，detail `{ size }`）/
 * `splitter:collapse` / `splitter:expand`（折叠态翻转时，detail `{ size: 0 | 恢复值 }`）；
 * 宿主派发、DOM 冒泡，`@splitter:resize="..."` 监听；初始折叠态不派发（事件只反馈变更）。
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
    /** data-minimize-size：折叠目标尺寸（缺省折叠 = 0 隐藏） */
    minimizeExpr: string | null;
    minimizeStatic: LengthDecl | null;
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
    /** 会话前折叠态（end 时判定翻转派发事件） */
    wasCollapsed: boolean;
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
.autospark-splitter>[data-autospark-splitter-pane][data-collapsed]{overflow:hidden;}
.autospark-splitter-divider{position:relative;flex:0 0 auto;touch-action:none;user-select:none;-webkit-user-select:none;}
.autospark-splitter-divider::after{content:"";position:absolute;background:var(--autospark-splitter-color,transparent);transition:background .15s;}
.autospark-splitter[data-direction="horizontal"]>.autospark-splitter-divider{width:var(--autospark-splitter-hit-size,4px);cursor:col-resize;}
.autospark-splitter[data-direction="horizontal"]>.autospark-splitter-divider::after{top:0;bottom:0;left:calc(50% - var(--autospark-splitter-divider-size,2px)/2);width:var(--autospark-splitter-divider-size,2px);}
.autospark-splitter[data-direction="vertical"]>.autospark-splitter-divider{height:var(--autospark-splitter-hit-size,4px);cursor:row-resize;}
.autospark-splitter[data-direction="vertical"]>.autospark-splitter-divider::after{left:0;right:0;top:calc(50% - var(--autospark-splitter-divider-size,2px)/2);height:var(--autospark-splitter-divider-size,2px);}
.autospark-splitter-divider:hover::after,.autospark-splitter-divider:focus-visible::after{background:var(--autospark-splitter-color-hover,#94a3b8);}
.autospark-splitter-divider:focus-visible{outline:none;}
.autospark-splitter-divider[data-static]{cursor:default;}
.autospark-splitter-trigger{position:absolute;z-index:5;width:var(--autospark-splitter-trigger-size,20px);height:var(--autospark-splitter-trigger-size,20px);border-radius:50%;border:1px solid var(--autospark-splitter-trigger-border,#cbd5e1);background:var(--autospark-splitter-trigger-bg,#fff);box-shadow:0 1px 3px rgba(0,0,0,.1);cursor:pointer;display:flex;align-items:center;justify-content:center;user-select:none;-webkit-user-select:none;transition:border-color .15s,background .15s;color:var(--autospark-splitter-trigger-fg,#64748b);}
/* 箭头 = 全局图标 arrow（内置 ›，基朝向指右，currentColor 继承把手 color）；
   旋转矩阵挂 svg（纯旋转，flex 居中不受干扰）；颜色走 --autospark-splitter-trigger-fg */
.autospark-splitter-trigger>svg{width:var(--autospark-splitter-trigger-icon-size,12px);height:var(--autospark-splitter-trigger-icon-size,12px);stroke-width:1.5;transition:transform .15s;}
.autospark-splitter-trigger:hover{border-color:var(--autospark-splitter-trigger-border-hover,#94a3b8);background:var(--autospark-splitter-trigger-bg-hover,#f8fafc);}
/* 把手滑轨定位（ADR-0067 决策七）：inline 只写坐标变量 --as-rail 与 data-rail-negative 属性，
   定位与钳制全在样式表。坐标语义 = 把手**圆心**距主端的距离：钳制圆心到 [half, rail − half]
   （把手是唯一重开触发点永可达）后顶边 = 圆心 − half——漏掉 − half 会让圆心恒偏 half
   （默认居中时肉眼可见偏下/偏右），且 coord 钳到 rail − half 时圆心探出轨道末端 */
.autospark-splitter-trigger{--as-rail-half:calc(var(--autospark-splitter-trigger-size,20px)/2);}
.autospark-splitter[data-direction="horizontal"]>.autospark-splitter-divider>.autospark-splitter-trigger{left:calc(50% - var(--autospark-splitter-trigger-size,20px)/2);top:calc(max(var(--as-rail-half),min(calc(100% - var(--as-rail-half)),var(--as-rail,50%))) - var(--as-rail-half));}
.autospark-splitter[data-direction="horizontal"]>.autospark-splitter-divider>.autospark-splitter-trigger[data-rail-negative]{top:auto;bottom:calc(max(var(--as-rail-half),min(calc(100% - var(--as-rail-half)),var(--as-rail,50%))) - var(--as-rail-half));}
.autospark-splitter[data-direction="vertical"]>.autospark-splitter-divider>.autospark-splitter-trigger{top:calc(50% - var(--autospark-splitter-trigger-size,20px)/2);left:calc(max(var(--as-rail-half),min(calc(100% - var(--as-rail-half)),var(--as-rail,50%))) - var(--as-rail-half));}
.autospark-splitter[data-direction="vertical"]>.autospark-splitter-divider>.autospark-splitter-trigger[data-rail-negative]{left:auto;right:calc(max(var(--as-rail-half),min(calc(100% - var(--as-rail-half)),var(--as-rail,50%))) - var(--as-rail-half));}
/* 箭头 = 下一步动作的分隔条位移方向（决策九）：基箭头指右，按 data-side/data-collapsed/data-direction 旋转（作用于 svg） */
.autospark-splitter-trigger[data-side="first"]>svg{transform:rotate(180deg);}
.autospark-splitter-trigger[data-side="first"][data-collapsed]>svg{transform:rotate(0deg);}
.autospark-splitter-trigger[data-side="last"]>svg{transform:rotate(0deg);}
.autospark-splitter-trigger[data-side="last"][data-collapsed]>svg{transform:rotate(180deg);}
.autospark-splitter[data-direction="vertical"]>.autospark-splitter-divider>.autospark-splitter-trigger[data-side="first"]>svg{transform:rotate(-90deg);}
.autospark-splitter[data-direction="vertical"]>.autospark-splitter-divider>.autospark-splitter-trigger[data-side="first"][data-collapsed]>svg{transform:rotate(90deg);}
.autospark-splitter[data-direction="vertical"]>.autospark-splitter-divider>.autospark-splitter-trigger[data-side="last"]>svg{transform:rotate(90deg);}
.autospark-splitter[data-direction="vertical"]>.autospark-splitter-divider>.autospark-splitter-trigger[data-side="last"][data-collapsed]>svg{transform:rotate(-90deg);}
/* 折叠态翻转动画（决策八）：sized 面板主轴尺寸过渡 + slide 隐藏的 margin 位移；
   拖拽/键盘会话（data-dragging）强制禁用 */
.autospark-splitter>[data-autospark-splitter-pane][data-animating]{transition:width var(--autospark-splitter-duration,.25s) ease,height var(--autospark-splitter-duration,.25s) ease,margin var(--autospark-splitter-duration,.25s) ease;}
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
    /** 折叠把手（collapsible 时创建） */
    private _trigger: HTMLElement | null = null;
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
    /** 首值哨兵（初始应用不派发折叠/展开事件） */
    private _initialized = false;
    /** 当前折叠态（size==0 派生缓存） */
    private _collapsed = false;
    /** 进行中的拖拽/键盘会话（null = 空闲） */
    private _session: SplitSession | null = null;
    /** 键盘会话所在元素（keyup/blur 收尾判定） */
    private _kbTarget: HTMLElement | null = null;
    /** 动画摘除兜底计时器 */
    private _animTimer: ReturnType<typeof setTimeout> | null = null;
    /** 微任务建连前被销毁（快速 x-if 切换防护） */
    private _destroyed = false;

    // ── 生命周期 ──────────────────────────────────────────────────────

    override created(): void {
        // 选项成员表达式管道（collapsible 坐标可表达式化；热应用见 _onOptionExprChange）
        this._watchOptionExprs();
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
        // 布局身份与初始尺寸（host 属性/类 + pane inline）
        this._applyDirection(this._dir, true);
        if (this._sizedIndex != null && this._curSize) {
            this._applySize(this._curSize, false);
        }
        this._initialized = true;
    }

    override destroy(): void {
        this._destroyed = true;
        this._session = null;
        this._kbTarget = null;
        if (this._animTimer != null) {
            clearTimeout(this._animTimer);
            this._animTimer = null;
        }
    }

    /** 选项成员表达式热应用：collapsible 坐标变化即重定位把手（drawer trigger 同款） */
    protected override _onOptionExprChange(key: string, _value: any): void {
        if (key === "collapsible") this._positionTrigger();
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
            minimizeExpr: null,
            minimizeStatic: null,
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
        const minimize = read("data-minimize-size");
        decl.sizeExpr = size.expr;
        decl.sizeStatic = size.staticValue;
        decl.minExpr = min.expr;
        decl.minStatic = min.staticValue;
        decl.maxExpr = max.expr;
        decl.maxStatic = max.staticValue;
        decl.minimizeExpr = minimize.expr;
        decl.minimizeStatic = minimize.staticValue;
        // 非法静态值 warn（有绑定表达式者豁免——表达式非法值运行时按无约束处理）
        for (const [label, parsed, expr] of [
            ["data-size", size.staticValue, size.expr],
            ["data-min-size", min.staticValue, min.expr],
            ["data-max-size", max.staticValue, max.expr],
            ["data-minimize-size", minimize.staticValue, minimize.expr],
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
        if (!initial && changed && this._sizedIndex != null && this._curSize) {
            const pane = this._paneEls[this._sizedIndex];
            if (pane) pane.style.removeProperty(dir === "horizontal" ? "height" : "width");
            this._applySize(this._curSize, false);
        }
        this._positionTrigger();
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
                p.minimizeExpr != null ||
                p.minimizeStatic != null
            ) {
                this.warn(
                    `x-splitter: data-min-size/data-max-size/data-minimize-size 仅定容面板（声明 data-size 者）认读，自适应面板上的声明已忽略`,
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
                p.minimizeExpr = null;
                p.minimizeStatic = null;
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
        // minimize 订阅（折叠目标）
        if (sized.minimizeExpr != null && isSimpleStatePath(sized.minimizeExpr)) {
            const initial = this.binding.watch(sized.minimizeExpr, ({ value }) => {
                this._minimizeBound = this._parseStateLength(value);
            });
            this._minimizeBound = this._parseStateLength(initial);
        }
    }

    /** 状态值 → 长度声明（number=px；string 解析；非法 null） */
    private _parseStateLength(v: any): LengthDecl | null {
        if (v == null) return null;
        return parseLength(v);
    }

    /** min/max/折叠目标绑定现值缓存（订阅回调维护；null = 未绑定或值非法） */
    private _minBound: LengthDecl | null = null;
    private _maxBound: LengthDecl | null = null;
    private _minimizeBound: LengthDecl | null = null;

    /** 现读 min/max 生效值（绑定现值优先、静态声明兜底；null = 无界） */
    private _readBound(kind: "min" | "max"): LengthDecl | null {
        const s = this._panes[this._sizedIndex!];
        if (!s) return null;
        const bound = kind === "min" ? this._minBound : this._maxBound;
        if (bound != null) return bound;
        return kind === "min" ? s.minStatic : s.maxStatic;
    }

    /**
     * 折叠目标（data-minimize-size 声明或绑定现值）：null = 无声明 → 折叠 = 0（隐藏）；
     * 有声明 → 折叠 = 该尺寸（面板保留最小化可见形态）。
     */
    private _collapseTarget(): LengthDecl | null {
        const s = this._panes[this._sizedIndex!];
        if (!s) return null;
        if (this._minimizeBound != null) return this._minimizeBound;
        return s.minimizeStatic;
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
        this._buildTrigger(divider);
    }

    /**
     * 折叠把手（collapsible 三态坐标化，ADR-0067 决策七）：分隔条子元素（天然随分隔条
     * 滑移）；沿长轴一维定位 inline（正距主端 top/left、负距对端 bottom/right），
     * 纯 CSS min()/max() 钳制；侧向居中走样式表。创建以 created 期为断（表达式动态
     * false → 真值不补建，drawer 同款）。
     *
     * **指针流拦截**：把手 pointerdown `stopPropagation`——分隔条的 pointerdown 监听
     * 含 `preventDefault()`（拖拽会话前置），而 pointerdown 的 preventDefault 会抑制
     * 后续合成的兼容性鼠标事件（mousedown/mouseup/**click**），把手 click 永不触发
     * （dispatchEvent 直接派发 click 的测试绕过合成链，暴露不出此问题）。
     * 键盘 Enter/Space 兑现 role=button 语义。
     */
    private _buildTrigger(divider: HTMLElement): void {
        const raw = this.getOption("collapsible");
        if (raw === false || raw == null) return;
        const trigger = document.createElement("div");
        trigger.className = "autospark-splitter-trigger";
        trigger.setAttribute("role", "button");
        trigger.setAttribute("aria-label", "折叠/展开面板");
        trigger.tabIndex = 0;
        // 箭头 = 全局图标 arrow（内置条目，registry.add 时已注入 sprite `as-arrow`；
        // use 文档全局解析——用户同名覆盖 arrow 自动跟随）
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("aria-hidden", "true");
        const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
        use.setAttribute("href", "#as-arrow");
        svg.appendChild(use);
        trigger.appendChild(svg);
        trigger.addEventListener("pointerdown", (ev) => ev.stopPropagation());
        trigger.addEventListener("click", () => this._toggleFold());
        trigger.addEventListener("keydown", (ev) => {
            if (ev.key !== "Enter" && ev.key !== " ") return;
            ev.preventDefault();
            this._toggleFold();
        });
        this._trigger = trigger;
        divider.appendChild(trigger);
        this._positionTrigger();
    }

    /** 把手定位：inline 只写坐标变量 --as-rail + data-rail-negative 属性（定位/钳制归样式表） */
    private _positionTrigger(): void {
        const t = this._trigger;
        if (!t) return;
        const side = this._sizedIndex === 1 ? "last" : "first";
        t.setAttribute("data-side", side);
        // 存在性语义：恒 setAttribute(String) 会让 "false" 也命中 CSS [data-collapsed]——箭头恒显示折叠方向
        t.toggleAttribute("data-collapsed", this._collapsed);
        const rail = this._parseRailCoord();
        if (rail == null) return; // warn 已发，回退居中
        t.style.setProperty("--as-rail", rail.value);
        t.toggleAttribute("data-rail-negative", rail.negative);
    }

    /**
     * collapsible 坐标解析（边缘锚定模型，对齐 drawer trigger）：`true` ≡ `'50%'`；
     * number = px（0 合法）；string = CSS 长度（负号 = 距对端）。非法 warn 回退居中（null）。
     */
    private _parseRailCoord(): { value: string; negative: boolean } | null {
        const raw = this.getOption("collapsible");
        if (raw === true || raw == null || raw === "") return { value: "50%", negative: false };
        let v: string;
        let negative = false;
        if (typeof raw === "number") {
            if (!Number.isFinite(raw)) v = "50%";
            else {
                negative = raw < 0;
                v = `${Math.abs(raw)}px`;
            }
        } else if (typeof raw === "string") {
            const s = raw.trim();
            const m = /^(-?[\d.]+)\s*(%|px|rem|em|vw|vh)?$/i.exec(s);
            if (!m) {
                this.warn(
                    `x-splitter: collapsible 值 "${raw}" 无法解析为坐标（true/数字 px/CSS 长度串），已按居中处理`,
                );
                return { value: "50%", negative: false };
            }
            negative = m[1]!.startsWith("-");
            v = `${m[1]!.replace("-", "")}${m[2]?.toLowerCase() ?? "px"}`;
        } else {
            v = "50%";
        }
        return { value: v, negative };
    }

    // ── 尺寸应用与写回 ────────────────────────────────────────────────

    /** 应用尺寸：inline 写入 + 折叠态派生 + 跨 0 动画 + 翻转事件 */
    private _applySize(d: LengthDecl, animate: boolean): void {
        const idx = this._sizedIndex;
        const pane = idx != null ? this._paneEls[idx] : undefined;
        if (!pane) return;
        const from0 = this._collapsed;
        const to0 = this._isCollapseTarget(d);
        // 折叠目标为 0（显式声明 "0" 或未声明 minimize）→ **slide 隐藏**：宽度保持、负 margin
        // 拉回占位——面板整体滑出容器（内容不挤压）；目标 >0 → 收缩到最小化尺寸。
        // 初始应用（未 initialized）无几何可滑，恒走收缩通道（静态 0 宽）。
        const target = this._collapseTarget();
        const slideHide = to0 && this._initialized && (!target || target.value === 0);
        const prop = this._dir === "horizontal" ? "width" : "height";
        const marginProp = this._marginProp;
        this._curSize = d;
        if (slideHide) {
            // 滑出距离 = 面板当前主轴宽度（inline 精确值优先，布局值兜底）；宽度本身不动
            const inline = parseFloat(pane.style[prop]);
            const dist =
                Number.isFinite(inline) && inline > 0
                    ? inline
                    : pane.getBoundingClientRect()[
                          this._dir === "horizontal" ? "width" : "height"
                      ] || 0;
            pane.style[marginProp] = `-${dist}px`;
        } else {
            pane.style.removeProperty(marginProp);
            pane.style[prop] = formatCss(d);
        }
        pane.toggleAttribute("data-collapsed", to0);
        this._collapsed = to0;
        // 存在性语义：恒 setAttribute(String) 会让 "false" 也命中 CSS [data-collapsed]——箭头恒显示折叠方向
        this._trigger?.toggleAttribute("data-collapsed", to0);
        // 跨折叠态翻转动画（决策八）：非跨态变更瞬时；拖拽会话期 animate=false 恒成立
        if (animate && from0 !== to0 && !this._session) this._playAnimation(pane);
        // 翻转事件（初始不派发；会话中的跨态由 _endSession 统一派发，防双发）
        if (this._initialized && from0 !== to0 && !this._session) {
            this.el.dispatchEvent(
                new CustomEvent(to0 ? "splitter:collapse" : "splitter:expand", {
                    detail: { size: formatState(d) },
                    bubbles: true,
                }),
            );
        }
    }

    /** 挂动画类（data-animating → CSS transition），transitionend/兜底超时摘除 */
    private _playAnimation(pane: HTMLElement): void {
        if (this._animTimer != null) clearTimeout(this._animTimer);
        pane.setAttribute("data-animating", "");
        const done = () => {
            pane.removeAttribute("data-animating");
            if (this._animTimer != null) {
                clearTimeout(this._animTimer);
                this._animTimer = null;
            }
        };
        pane.addEventListener("transitionend", done, { once: true });
        // transitionend 不触发的环境（无布局/happy-dom/被禁用）兜底摘除
        this._animTimer = setTimeout(done, 600);
    }

    /** 外部状态 → DOM（反向通道）：会话期抑制 + 等值短路（防递归三防线之二） */
    private _applyFromState(value: any): void {
        if (this._destroyed || value == null || this._sizedIndex == null) return;
        if (this._session) return; // 会话抑制：拖拽优先
        const d = this._parseStateLength(value);
        if (d == null) return;
        const cur = this._curSize;
        if (cur && cur.value === d.value && cur.unit === d.unit) return; // 等值短路
        this._applySize(d, true);
    }

    /** 统一写入出口（把手/键盘折叠路径）：绑定路径写状态；静态/降级直写 DOM */
    private _writeSize(d: LengthDecl): void {
        if (this._sizePath) {
            try {
                setVal(
                    this.engine.store.state,
                    this._sizePath.split(this.engine.store.delimiter),
                    formatState(d),
                );
                return; // watcher → _applyFromState 完成应用（微任务）
            } catch (e: any) {
                this.warn(`x-splitter: 尺寸写回失败（"${this._sizePath}"）: ${e?.message ?? e}`);
            }
        }
        // 静态声明 / 表达式降级：UI-only 直写（降级时 warn 一次）
        if (
            !this._sizePath &&
            this._panes[this._sizedIndex!]?.sizeExpr != null &&
            !this._warnedUiOnly
        ) {
            this._warnedUiOnly = true;
            this.warn(
                `x-splitter: :data-size 为表达式形态（不可写），本次折叠/展开仅作用于 UI，状态变更后会被拉回`,
            );
        }
        this._applySize(d, true);
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
            wasCollapsed: this._collapsed,
            keyboard,
        };
        host.setAttribute("data-dragging", "");
    }

    /** 会话内调节落点（钳制 → 递进记账 → 应用 → 写回；事件 end 时派发） */
    private _applyPx(rawPx: number): void {
        const s = this._session;
        if (!s || this._sizedIndex == null) return;
        let px = rawPx;
        if (s.minPx != null && px < s.minPx) px = s.minPx;
        if (s.maxPx != null && px > s.maxPx) px = s.maxPx;
        if (px < 0) px = 0;
        s.curPx = px;
        const d = fromPx(px, s.unit, s.ctx);
        this._applySize(d, false);
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

    /** 会话结束：摘 data-dragging + splitter:resize 事件（最终值）+ 翻转事件判定 */
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
            // 拖拽跨 0 翻转（会话中动画被抑制）补事件：折叠态由 _applySize 派生，
            // 此处补派发翻转事件（_initialized 时）
            if (this._initialized && s.wasCollapsed !== this._collapsed) {
                this.el.dispatchEvent(
                    new CustomEvent(this._collapsed ? "splitter:collapse" : "splitter:expand", {
                        detail: { size: formatState(this._curSize) },
                        bubbles: true,
                    }),
                );
            }
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

    // ── 折叠/展开 ─────────────────────────────────────────────────────

    /**
     * 把手点击翻转：折叠 ≡ size=0 纯派生（无独立 collapsed 真相源）。折叠前记忆
     * lastSize（实例状态），展开恢复；记忆缺失（初始即 0）回退 data-size 声明值。
     * 折叠写 0 绕过 min 钳制（0 是特殊语义值）。
     */
    private _toggleFold(): void {
        if (this._sizedIndex == null) return;
        if (this._collapsed) {
            // 恢复链：lastSize → 声明值（仅非折叠态值——0 或 minimize 目标是折叠声明非可恢复尺寸）→ 默认 200px
            const declared = this._panes[this._sizedIndex]!.sizeStatic;
            const target = this._collapseTarget();
            const declaredRestorable =
                declared &&
                declared.value > 0 &&
                !(target && declared.value === target.value && declared.unit === target.unit);
            const restore = this._lastSize ??
                (declaredRestorable ? declared : null) ?? { value: 200, unit: "px" };
            this._writeSize(restore);
        } else {
            // 折叠目标：minimize 声明（面板保留最小化形态）或缺省 0（隐藏）——均绕过 min 钳制
            if (this._curSize && !this._isCollapseTarget(this._curSize)) {
                this._lastSize = this._curSize;
            }
            const target = this._collapseTarget();
            this._writeSize(target ?? { value: 0, unit: this._curSize?.unit ?? "px" });
        }
    }

    /** 声明值是否为折叠目标（判定与记忆共用） */
    private _isCollapseTarget(d: LengthDecl): boolean {
        const target = this._collapseTarget();
        return target ? d.value === target.value && d.unit === target.unit : d.value === 0;
    }

    /**
     * slide 隐藏的位移通道（负 margin 拉回占位，面板内容盒保持原宽整体滑出容器）：
     * sized 在前 → 左/上缘滑出（margin-left/top），在后 → 右/下缘（margin-right/bottom）。
     */
    private get _marginProp(): string {
        const first = this._sizedIndex === 0;
        if (this._dir === "horizontal") return first ? "margin-left" : "margin-right";
        return first ? "margin-top" : "margin-bottom";
    }
}
