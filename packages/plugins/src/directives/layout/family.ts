/**
 * layout 家族五指令（x-resizable / x-expandable / x-splitter / x-layout + x-pane）类工厂
 * （autospark.layout.js 的家族核心，ADR-0128 外移 / plugins ADR-0008 批次 3）。
 *
 * **家族单工厂**：x-layout / x-splitter 以 `ExpandableDirective.compose` 静态方法程序化组合、
 * x-layout 引用 PaneDirective——类引用连通团在类工厂形态下无法跨文件共享类，故五类一闭包
 * （类互见零改造）；ResizeSession 等模块级共享本文件顶层（产物内单份，ADR-0009 粒度原则）。
 * 语义零漂移，全量平移自 engine src/directives/（ADR-0064/0067/0069/0072/0074 及后续修订）。
 */
import type {
    AutoSpark,
    AutoSparkScope,
    AutoDirectiveInfo,
    AutoSparkDirectiveBase,
} from "autospark";
import { setVal } from "../../utils/setVal";
import { getVal } from "../../utils/getVal";
import { isSimpleStatePath } from "../../utils/isSimpleStatePath";
import { injectStylesheet } from "../../utils/injectStylesheet";
import { createCollapseTrigger } from "../../utils/expandable-trigger";
import { parseRailCoord } from "../../utils/expandable-trigger";
import { registerTriggerStyles } from "../../utils/expandable-trigger";
import { SHARED_TRIGGER_CSS } from "../../utils/expandable-trigger";
import { relaxedToJson } from "../../utils/relaxedToJson";
import { installPlugin } from "@autospark/utils";

/* ══════════ 自 engine x-resizable.ts 平移（模块级：常量/函数/非指令类） ══════════ */
/**
 * x-resizable：宿主元素尺寸的拖拽调节指令（ADR-0064）。
 *
 * **可选值双向**（对齐 x-model 哲学）：
 * - 无值——纯 DOM：拖拽直改宿主 `style.width/height`（+ 定位元素 w/n 手柄的 left/top 补偿）；
 * - 有值（`x-resizable="size"`）——双向绑定：拖拽中实时写回 `{width, height}`（px number，
 *   简单路径经落点解析逐段直写），外部改状态反向同步宿主（过 min/max 钳制、等值短路防循环）。
 *
 * **方向声明**（{@link RESIZE_DIRECTIONS} 八方向）：`handles` 选项（逗号串或数组）为主通道；
 * 修饰符 `x-resizable.e.s.se` 解析期并入指令选项（ADR-0007——同名布尔键，本指令归一为方向集）。
 * 默认 `e,s,se`（流内自然最大集——流内元素左/上边缘锚定布局位，反向拖拽需补偿 left/top，
 * 完整 8 向仅对 `absolute/fixed` 定位元素开放；非自然方向编译期丢弃 + warn）。
 *
 * **钳制管线**（{@link clampSize}）：raw Δ → snap 吸附 → aspectRatio 等比 → min/max 钳制
 * （钳制恒最后，约束是硬边界）。约束来源回退链：指令选项（number px | CSS 长度串）→
 * 宿主 computed `min-width/max-width`（CSS 声明的约束天然生效，指令选项显式值优先）。
 *
 * **事件**：`resize:start` / `resize:move` / `resize:end`（冒号命名空间对齐 `tree:*` 家族惯例），
 * 宿主派发、冒泡，`detail = { width, height, handle }`；键盘微调（方向键 ±1px / Shift ±10px）
 * 同管线同事件。
 *
 * **手柄**是宿主真实子元素（`data-autospark-resize-handle="<方向>"` 契约，不参与子树重编译），
 * 编译后微任务注入（挂载后 computed 检测才可靠，对齐 x-teleport 先例）。样式经类级
 * `initialize` 全局注入（幂等），CSS 变量 `--autospark-resize-handle-*` 定制。
 * 覆盖物侧（drawer/dialog 的 `resize` 选项）复用 {@link ResizeSession} 核心，写路径走
 * shell 面板（见 OverlayDirective `_attachResize`）。
 */

/** 八方向枚举：n/s/e/w 四边 + ne/nw/se/sw 四角（北=上） */
export type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

/** 全部合法方向（校验与归一用） */
export const RESIZE_DIRECTIONS = new Set<string>(["n", "s", "e", "w", "ne", "nw", "se", "sw"]);

/** 流内自然方向：流内元素左/上边缘锚定布局位，仅这三向拖拽无需位置补偿（ADR-0064 决策四） */
const FLOW_SAFE_DIRECTIONS = new Set<string>(["e", "s", "se"]);

/** 默认方向集：流内自然最大集 */
export const DEFAULT_RESIZE_HANDLES: ResizeDirection[] = ["e", "s", "se"];

/** 方向是否影响宽度 / 高度（钳制与补偿数学用） */
const AFFECTS_W = (d: string) => d.includes("e") || d.includes("w");
const AFFECTS_H = (d: string) => d.includes("n") || d.includes("s");

/**
 * x-resizable 选项形态（`x-resizable-options`）；覆盖物 `resize` 选项对象形态与之同构（ADR-0064 决策八）。
 */
export interface ResizeOptions {
    /** 方向集（逗号串或数组）；缺省 `e,s,se` */
    handles?: string | string[];
    /** 最小宽度：number（px）| CSS 长度串；缺省回退宿主 computed min-width */
    minWidth?: number | string;
    /** 最大宽度：同上；缺省回退宿主 computed max-width */
    maxWidth?: number | string;
    /** 最小高度：同上；缺省回退宿主 computed min-height */
    minHeight?: number | string;
    /** 最大高度：同上；缺省回退宿主 computed max-height */
    maxHeight?: number | string;
    /** 等比锁定（宽/高数值，如 `16/9` relaxed-json 可直接算）；缺省不锁 */
    aspectRatio?: number;
    /** 网格吸附步进（px，默认 0 关闭） */
    snap?: number;
    [key: string]: any;
}

/** 生效约束（全部已换算 px；null = 该轴无约束） */
export interface ResizeConstraints {
    minWidth: number | null;
    maxWidth: number | null;
    minHeight: number | null;
    maxHeight: number | null;
    snap: number;
    aspectRatio: number;
}

/** 无约束基线（克隆起点） */
export const NO_CONSTRAINTS: ResizeConstraints = {
    minWidth: null,
    maxWidth: null,
    minHeight: null,
    maxHeight: null,
    snap: 0,
    aspectRatio: 0,
};

/** 数值钳制（null 视为无界） */
const num = (v: number | null | undefined): number | null =>
    v == null || !Number.isFinite(v) ? null : v;
const clampNum = (v: number, min: number | null, max: number | null): number => {
    if (min != null && v < min) return min;
    if (max != null && v > max) return max;
    return v;
};

/** CSS 长度值 → px 数值：number 直用；字符串仅裸数字与 `px` 后缀可解析（rem/% 等依赖布局基准，须由 computed 层换算） */
function parseCssLength(raw: unknown): number | null {
    if (typeof raw === "number") return Number.isFinite(raw) && raw >= 0 ? raw : null;
    if (typeof raw === "string") {
        const s = raw.trim();
        if (/^\d+(\.\d+)?px?$/.test(s)) return parseFloat(s);
        return null;
    }
    return null;
}

/** computed style 的 min/max 读取（'none'/空 → null；px 值 parseFloat） */
function computedBound(cs: CSSStyleDeclaration | null, key: string): number | null {
    const raw = cs ? cs.getPropertyValue(key) : "";
    if (!raw || raw === "none" || raw === "auto") return null;
    const v = parseFloat(raw);
    return Number.isFinite(v) && v > 0 ? v : null;
}

/**
 * 解析生效约束（回退链：指令选项 → 宿主 computed min/max，ADR-0064 决策五）。
 *
 * 选项值支持 `number`（px）与 CSS 长度串（`'10rem'` 经 getComputedStyle 的临时探针换算 px；
 * 裸数字/px 串直取）；computed 层天然是 px。非法值 warn（由调用方传入 warn 通道）后按无约束处理。
 */
export function resolveResizeConstraints(
    opts: ResizeOptions | null | undefined,
    target: HTMLElement | null,
    warn?: (msg: string) => void,
): ResizeConstraints {
    const c: ResizeConstraints = { ...NO_CONSTRAINTS };
    if (opts) {
        c.snap = num(opts.snap as number) ?? 0;
        if (c.snap < 0) c.snap = 0;
        // aspectRatio 两形态：number（宽/高比）| 比值串 `'16:9'` / `'4/3'`（直觉表达；
        // relaxed-json 是裸值透传不支持除法表达式——`{aspectRatio:16/9}` 整包写法不可用）
        const arRaw = opts.aspectRatio;
        if (typeof arRaw === "string") {
            const m = arRaw.trim().match(/^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/);
            const w = m ? Number(m[1]) : NaN;
            const h = m ? Number(m[2]) : NaN;
            if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
                c.aspectRatio = w / h;
            } else if (arRaw.trim() !== "") {
                warn?.(`x-resizable: aspectRatio "${arRaw}" 无法解析为比值（如 '16:9'），已忽略`);
            }
        } else {
            const ar = num(arRaw as number);
            if (ar != null && ar > 0) c.aspectRatio = ar;
        }
        for (const [key, out] of [
            ["minWidth", "minWidth"],
            ["maxWidth", "maxWidth"],
            ["minHeight", "minHeight"],
            ["maxHeight", "maxHeight"],
        ] as const) {
            const raw = opts[key];
            if (raw == null) continue;
            const direct = parseCssLength(raw);
            if (direct != null) {
                c[out] = direct;
                continue;
            }
            // CSS 长度串（rem/% 等）：临时探针经 computed 换算 px（挂载后可用；未挂载 warn 后放弃）
            const px = probeCssLength(target, String(raw));
            if (px != null) {
                c[out] = px;
            } else {
                warn?.(`x-resizable: 约束 ${key} 值 "${String(raw)}" 无法解析为长度，已忽略`);
            }
        }
    }
    // 回退层：computed min/max-width/height（CSS 声明的约束天然生效；选项显式值优先阻断回退）
    if (target) {
        const cs = typeof getComputedStyle === "function" ? getComputedStyle(target) : null;
        if (c.minWidth == null) c.minWidth = computedBound(cs, "min-width");
        if (c.maxWidth == null) c.maxWidth = computedBound(cs, "max-width");
        if (c.minHeight == null) c.minHeight = computedBound(cs, "min-height");
        if (c.maxHeight == null) c.maxHeight = computedBound(cs, "max-height");
    }
    return c;
}

/** CSS 长度串探针：临时挂到 target（或 body）上经 computed 换算 px；不可解析返回 null */
function probeCssLength(target: HTMLElement | null, value: string): number | null {
    const probe = document.createElement("div");
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.width = value;
    const host = target?.isConnected ? target : document.body;
    if (!host) return null;
    try {
        host.appendChild(probe);
        const px = parseFloat(getComputedStyle(probe).width);
        return Number.isFinite(px) && px >= 0 ? px : null;
    } catch {
        return null;
    } finally {
        probe.remove();
    }
}

/**
 * 钳制管线（ADR-0064 决策五）：snap 吸附 → aspectRatio 等比 → min/max 钳制。
 * 纯函数（单测直击）。等比时**主轴优先**：横向手柄（含角）以宽为主轴、高 = 宽/比；
 * 纯纵向手柄（n/s）以高为主轴、宽 = 高×比；snap 只作用主轴（从轴由比例派生），
 * min/max 恒最后（硬边界——clamp 改变主轴后从轴随之重算，从轴被 clamp 时比值为软约束让位）。
 */
export function clampSize(
    width: number,
    height: number,
    handle: ResizeDirection,
    c: ResizeConstraints,
): { width: number; height: number } {
    const snap = (v: number) => (c.snap > 0 ? Math.round(v / c.snap) * c.snap : v);
    if (c.aspectRatio > 0) {
        if (handle === "n" || handle === "s") {
            const h = clampNum(snap(height), c.minHeight, c.maxHeight);
            return { width: clampNum(h * c.aspectRatio, c.minWidth, c.maxWidth), height: h };
        }
        const w = clampNum(snap(width), c.minWidth, c.maxWidth);
        return { width: w, height: clampNum(w / c.aspectRatio, c.minHeight, c.maxHeight) };
    }
    return {
        width: clampNum(snap(width), c.minWidth, c.maxWidth),
        height: clampNum(snap(height), c.minHeight, c.maxHeight),
    };
}

/**
 * 归一方向集声明：`handles` 选项（逗号串/数组）+ 修饰符布尔键（`x-resizable.e.s.se` 解析期并入
 * 指令选项的同名 `true` 键，ADR-0007）合并去重；非法值 warn 剪枝；两者皆无 → 默认 `e,s,se`。
 */
export function resolveHandles(
    opts: Record<string, any> | null | undefined,
    warn?: (msg: string) => void,
): ResizeDirection[] {
    const out = new Set<string>();
    const add = (raw: string) => {
        const d = raw.trim().toLowerCase();
        if (RESIZE_DIRECTIONS.has(d)) out.add(d);
        else warn?.(`x-resizable: 未知调节方向 "${raw}"（合法：n/s/e/w/ne/nw/se/sw），已忽略`);
    };
    const declared = opts?.handles;
    if (typeof declared === "string") declared.split(",").forEach((s) => s.trim() && add(s));
    else if (Array.isArray(declared)) declared.forEach((s) => add(String(s)));
    else if (declared != null) {
        warn?.(`x-resizable: handles 须为逗号串或数组，已忽略: ${JSON.stringify(declared)}`);
    }
    // 修饰符糖：选项中值为 true 且命中方向枚举的键（ADR-0007 修饰符并入形态）
    if (opts) {
        for (const k of Object.keys(opts)) {
            if (opts[k] === true && RESIZE_DIRECTIONS.has(k)) out.add(k);
        }
    }
    if (out.size === 0 && declared == null) return [...DEFAULT_RESIZE_HANDLES];
    return [...out] as ResizeDirection[];
}

/**
 * 读元素定位值（left/top，**定位坐标系**——相对 offsetParent）：inline px 优先、
 * computed used value 兜底。
 *
 * 不用 `getBoundingClientRect`（视口坐标系）：把它写回 `style.left` 会把元素瞬移到
 * 错误坐标系（offsetParent 非_BODY 时差一个容器偏移）——w/n 手柄拖拽「越拖越跳」的根因。
 * computed 的 left/top 对定位元素恒为 px（used value，相对定位祖先），无 inline 也可用。
 */
function readPositionValue(el: HTMLElement): { left: number; top: number } {
    const read = (inline: string, key: "left" | "top"): number => {
        if (/^-?\d+(\.\d+)?px$/.test(inline.trim())) return parseFloat(inline);
        const cs = typeof getComputedStyle === "function" ? getComputedStyle(el) : null;
        const v = cs ? parseFloat(cs.getPropertyValue(key)) : NaN;
        return Number.isFinite(v) ? v : 0;
    };
    return { left: read(el.style.left, "left"), top: read(el.style.top, "top") };
}

/**
 * 读元素当前尺寸（px）：**inline px 精确值优先**，布局值（offset 系）兜底。
 *
 * 精确优先的三个理由（拖拽跳动的修复面）：
 * 1. offsetWidth 是布局取整值——亚像素尺寸（380.4px）读回 380，双向绑定的 watcher 会误判
 *    「值变了」而二次写 style（视觉抖动源）；
 * 2. content-box 元素的 offsetWidth 含 padding/border，与 `style.width` 语义错位——新会话起始
 *    尺寸凭空多出边距量，多次拖放越跳越多；
 * 3. 读 offset 系触发强制同步布局（reflow）——拖拽每帧读一次即每帧回流；读 inline 字符串零成本。
 * 兜底链：inline px（精确）→ offset 系（无 inline 声明时的布局真值，如 width:auto）→ 0。
 */
export function readElementSize(el: HTMLElement): { width: number; height: number } {
    const inlinePx = (s: string): number | null =>
        /^-?\d+(\.\d+)?px$/.test(s.trim()) ? parseFloat(s) : null;
    const read = (styleVal: string, layoutVal: number): number => {
        const px = inlinePx(styleVal);
        if (px != null) return px;
        return layoutVal > 0 ? layoutVal : parseFloat(styleVal) || 0;
    };
    return {
        width: read(el.style.width, el.offsetWidth),
        height: read(el.style.height, el.offsetHeight),
    };
}

/** 手柄会话起始快照（补偿数学的基准；_dir 为本会话方向，事件派发与键盘通道共用） */
interface SessionStart {
    /** 指针起点 */
    x: number;
    y: number;
    /** 会话内递进尺寸（每轮应用后更新——键盘多次按键/连续 move 的下一轮起点） */
    width: number;
    height: number;
    /** 会话初值尺寸（**不随递进更新**——w/n 补偿与等比联动写入的基准） */
    w0: number;
    h0: number;
    left: number;
    top: number;
    _dir?: ResizeDirection;
}

/**
 * 尺寸调节会话（per-目标控制器，普通元素与覆盖物面板共用，ADR-0064）：
 * 手柄 DOM 生命周期 + Pointer Events 拖拽状态机 + 键盘微调 + `resize:*` 事件派发。
 * **写路径经 `apply` 回调外置**（普通元素写宿主 style + 定位补偿；overlay 写 shell 面板短轴），
 * 钳制/手柄/指针核心逻辑两消费面共享。
 */
export class ResizeSession {
    /** 手柄元素清单（attach 时创建） */
    private _handles: HTMLElement[] = [];
    /** 进行中的会话起始快照（null = 空闲） */
    private _start: SessionStart | null = null;
    /** 键盘会话所在手柄（null = 无键盘会话） */
    private _kbHandle: HTMLElement | null = null;
    /** 本会话约束快照（会话开始时取一次——move 中不重复 getComputedStyle，消灭每帧 reflow） */
    private _c: ResizeConstraints | null = null;
    private _destroyed = false;

    constructor(
        private readonly opts: {
            /** 尺寸读写目标（普通元素 = 宿主；overlay = shell 面板） */
            target: HTMLElement;
            /** `resize:*` 事件派发目标（overlay = 指令宿主，绑定语法不变，ADR-0064 决策七） */
            eventTarget: HTMLElement;
            /** 已校验合法的方向集 */
            handles: ResizeDirection[];
            /** 现读生效约束（每次手势开始时取一次——选项/配置可随重开变化） */
            constraints: () => ResizeConstraints;
            /** 尺寸落点（写路径差异点；start 为会话起始 rect 快照，供 w/n 补偿） */
            apply: (
                width: number,
                height: number,
                handle: ResizeDirection,
                start: SessionStart,
            ) => void;
            /** 每次应用后的回调（写回状态 / 更新会话记忆；overlay 与普通元素各自消费） */
            onApplied?: (width: number, height: number, handle: ResizeDirection) => void;
            warn: (msg: string) => void;
        },
    ) {}

    /** 是否有活跃拖拽/键盘会话（外部→DOM 反向通道的跳过判据） */
    get active(): boolean {
        return this._start != null || this._kbHandle != null;
    }

    /** 创建手柄并绑定交互（幂等：重复调用跳过） */
    attach(): void {
        if (this._destroyed || this._handles.length) return;
        for (const dir of this.opts.handles) {
            const h = document.createElement("span");
            h.setAttribute("data-autospark-resize-handle", dir);
            h.tabIndex = 0;
            h.setAttribute("role", "separator");
            if (dir === "n" || dir === "s") h.setAttribute("aria-orientation", "horizontal");
            else if (dir === "e" || dir === "w") h.setAttribute("aria-orientation", "vertical");
            h.setAttribute("aria-label", `调节尺寸 ${dir}`);
            h.addEventListener("pointerdown", (ev) => this._onPointerDown(ev, dir, h));
            h.addEventListener("keydown", (ev) => this._onKeyDown(ev, dir, h));
            h.addEventListener("keyup", () => this._endKeyboard());
            h.addEventListener("blur", () => this._endKeyboard());
            this.opts.target.appendChild(h);
            this._handles.push(h);
        }
    }

    /** 销毁：中断会话、移除手柄（目标随 DOM 销毁时手柄随之而去，此调用保证幂等干净） */
    destroy(): void {
        this._destroyed = true;
        this._start = null;
        this._kbHandle = null;
        this._c = null;
        for (const h of this._handles) h.remove();
        this._handles = [];
    }

    // ── Pointer Events 拖拽（setPointerCapture 解决移出跟踪）────────────

    private _onPointerDown(ev: PointerEvent, dir: ResizeDirection, handle: HTMLElement): void {
        // button 判定放宽（> 0 才拒）：模拟/降级环境的事件可能无 button 字段
        if (this._destroyed || (ev as any).button > 0) return;
        ev.preventDefault();
        this._begin(dir, ev.clientX, ev.clientY);
        try {
            handle.setPointerCapture?.(ev.pointerId);
        } catch {
            /* 降级环境无 capture：listener 挂手柄本体，拖出即止（可接受的最小行为） */
        }
        const move = (e: PointerEvent) => this._move(e.clientX, e.clientY);
        const up = () => {
            handle.removeEventListener("pointermove", move as EventListener);
            handle.removeEventListener("pointerup", up);
            handle.removeEventListener("pointercancel", up);
            try {
                handle.releasePointerCapture?.(ev.pointerId);
            } catch {
                /* 同上 */
            }
            this._end();
        };
        handle.addEventListener("pointermove", move as EventListener);
        handle.addEventListener("pointerup", up);
        handle.addEventListener("pointercancel", up);
    }

    /** 会话开始：快照起始尺寸/定位/约束与起点坐标，派发 resize:start */
    private _begin(dir: ResizeDirection, x: number, y: number): void {
        const el = this.opts.target;
        const size = readElementSize(el);
        const pos = readPositionValue(el);
        this._c = this.opts.constraints(); // 会话内约束恒定（含 getComputedStyle 的 reflow 只付一次）
        this._start = {
            x,
            y,
            width: size.width,
            height: size.height,
            w0: size.width,
            h0: size.height,
            left: pos.left,
            top: pos.top,
            _dir: dir,
        };
        this._dispatch("resize:start", dir);
    }

    private _move(clientX: number, clientY: number): void {
        const s = this._start;
        if (!s || this._destroyed) return;
        const dir = this._currentDir;
        const dx = clientX - s.x;
        const dy = clientY - s.y;
        // 方向语义：e/s 缘外扩为增；w/n 缘外扩（指针向左/上）为增（宽高取反）
        const dw = dir.includes("e") ? dx : dir.includes("w") ? -dx : 0;
        const dh = dir.includes("s") ? dy : dir.includes("n") ? -dy : 0;
        // 绝对式数学：初值 + 总位移（不基于上一轮 clamp 产物递进——snap/等比把上一轮归格的
        // 残差带进下一轮会造成格点间跳变；键盘通道无总位移概念，仍走递进）
        this._applyClamped(s.w0 + dw, s.h0 + dh, dir);
    }

    /** 会话结束：派发 resize:end（detail 为最终值），弃约束快照 */
    private _end(): void {
        if (!this._start) return;
        const dir = this._currentDir;
        this._start = null;
        this._c = null;
        const size = readElementSize(this.opts.target);
        this._dispatch("resize:end", dir, size.width, size.height);
    }

    /** 当前会话方向（start 快照携带，pointer 与键盘通道同源） */
    private get _currentDir(): ResizeDirection {
        return this._start?._dir ?? "se";
    }

    // ── 键盘微调（±1px / Shift ±10px，同钳制管线，ADR-0064 决策一）──────

    private _kbDir: ResizeDirection | null = null;

    private _onKeyDown(ev: KeyboardEvent, dir: ResizeDirection, handle: HTMLElement): void {
        const key = ev.key;
        const step = ev.shiftKey ? 10 : 1;
        let dw = 0;
        let dh = 0;
        switch (key) {
            case "ArrowRight":
                dw = dir.includes("e") ? step : dir.includes("w") ? -step : 0;
                break;
            case "ArrowLeft":
                dw = dir.includes("e") ? -step : dir.includes("w") ? step : 0;
                break;
            case "ArrowDown":
                dh = dir.includes("s") ? step : dir.includes("n") ? -step : 0;
                break;
            case "ArrowUp":
                dh = dir.includes("s") ? -step : dir.includes("n") ? step : 0;
                break;
            case "Home":
            case "End":
                return;
            default:
                return;
        }
        ev.preventDefault();
        if (this._destroyed) return;
        if (!this._kbHandle) {
            // 键盘会话：start+move 成对（每键一次完整调节，keyup/blur 收尾 end）
            const el = this.opts.target;
            this._c = this.opts.constraints(); // 会话内约束恒定（同 pointer 会话）
            const size = readElementSize(el);
            const pos = readPositionValue(el);
            this._start = {
                x: 0,
                y: 0,
                width: size.width,
                height: size.height,
                w0: size.width,
                h0: size.height,
                left: pos.left,
                top: pos.top,
                _dir: dir,
            };
            this._kbHandle = handle;
            this._kbDir = dir;
            this._dispatch("resize:start", dir);
        }
        const s = this._start!;
        this._applyClamped(s.width + dw, s.height + dh, dir);
    }

    private _endKeyboard(): void {
        if (!this._kbHandle) return;
        this._kbHandle = null;
        this._kbDir = null;
        const dir = this._currentDir;
        this._start = null;
        this._c = null;
        const size = readElementSize(this.opts.target);
        this._dispatch("resize:end", dir, size.width, size.height);
    }

    // ── 应用与派发 ─────────────────────────────────────────────────────

    /** 钳制 → apply → onApplied → resize:move（start 快照随 dw/dh 递进——键盘多次按键累积在同一会话内） */
    private _applyClamped(rawW: number, rawH: number, dir: ResizeDirection): void {
        const s = this._start!;
        const c = this._c ?? this.opts.constraints();
        const { width, height } = clampSize(rawW, rawH, dir, c);
        // 会话内尺寸快照随应用递进（后续 move/按键在最新值上继续；w/n 补偿基准仍用起始 rect）
        s.width = width;
        s.height = height;
        this.opts.apply(width, height, dir, s);
        this.opts.onApplied?.(width, height, dir);
        this._dispatch("resize:move", dir, width, height);
    }

    /** 对外应用（外部→DOM 反向通道复用钳制与写路径；不走事件） */
    applyExternal(width: number, height: number): void {
        const c = this.opts.constraints();
        const { width: w, height: h } = clampSize(width, height, "se", c);
        const el = this.opts.target;
        const size = readElementSize(el);
        const pos = readPositionValue(el);
        this.opts.apply(w, h, "se", {
            x: 0,
            y: 0,
            width: size.width,
            height: size.height,
            w0: size.width,
            h0: size.height,
            left: pos.left,
            top: pos.top,
            _dir: "se",
        });
    }

    private _dispatch(
        name: "resize:start" | "resize:move" | "resize:end",
        handle: ResizeDirection,
        width?: number,
        height?: number,
    ): void {
        const size =
            width != null ? { width, height: height ?? 0 } : readElementSize(this.opts.target);
        this.opts.eventTarget.dispatchEvent(
            new CustomEvent(name, {
                detail: { width: size.width, height: size.height, handle },
                bubbles: true,
            }),
        );
    }
}

// 手柄全局样式（类级 initialize 注入，幂等；CSS 变量定制视觉，ADR-0064 决策六）
const RESIZE_STYLE_ID = "autospark-resize-styles";
const RESIZE_HANDLE_CSS = `
[data-autospark-resize-handle]{position:absolute;z-index:10;touch-action:none;user-select:none;}
[data-autospark-resize-handle]::after{content:"";position:absolute;background:transparent;border-radius:2px;transition:background .15s;}
[data-autospark-resize-handle]:hover::after,[data-autospark-resize-handle]:focus-visible::after{background:var(--autospark-resize-handle-color,rgba(96,96,96,0.55));}
[data-autospark-resize-handle="n"],[data-autospark-resize-handle="s"]{left:8px;right:8px;height:var(--autospark-resize-handle-thickness,10px);cursor:ns-resize;}
[data-autospark-resize-handle="n"]{top:calc(-1 * var(--autospark-resize-handle-thickness,10px) / 2);}
[data-autospark-resize-handle="n"]::after,[data-autospark-resize-handle="s"]::after{left:0;right:0;top:calc(50% - 1px);height:2px;}
[data-autospark-resize-handle="s"]{bottom:calc(-1 * var(--autospark-resize-handle-thickness,10px) / 2);}
[data-autospark-resize-handle="e"],[data-autospark-resize-handle="w"]{top:8px;bottom:8px;width:var(--autospark-resize-handle-thickness,10px);cursor:ew-resize;}
[data-autospark-resize-handle="e"]{right:calc(-1 * var(--autospark-resize-handle-thickness,10px) / 2);}
[data-autospark-resize-handle="e"]::after,[data-autospark-resize-handle="w"]::after{top:0;bottom:0;left:calc(50% - 1px);width:2px;}
[data-autospark-resize-handle="w"]{left:calc(-1 * var(--autospark-resize-handle-thickness,10px) / 2);}
[data-autospark-resize-handle="ne"],[data-autospark-resize-handle="nw"],[data-autospark-resize-handle="se"],[data-autospark-resize-handle="sw"]{width:var(--autospark-resize-handle-size,12px);height:var(--autospark-resize-handle-size,12px);}
[data-autospark-resize-handle="ne"]{top:calc(-1 * var(--autospark-resize-handle-size,12px) / 2);right:calc(-1 * var(--autospark-resize-handle-size,12px) / 2);cursor:nesw-resize;}
[data-autospark-resize-handle="nw"]{top:calc(-1 * var(--autospark-resize-handle-size,12px) / 2);left:calc(-1 * var(--autospark-resize-handle-size,12px) / 2);cursor:nwse-resize;}
[data-autospark-resize-handle="se"]{bottom:calc(-1 * var(--autospark-resize-handle-size,12px) / 2);right:calc(-1 * var(--autospark-resize-handle-size,12px) / 2);cursor:nwse-resize;}
[data-autospark-resize-handle="se"]::after{left:2px;top:2px;width:5px;height:5px;background:var(--autospark-resize-handle-color,rgba(96,96,96,0.55));clip-path:polygon(0 100%,100% 100%,100% 0);}
[data-autospark-resize-handle="sw"]{bottom:calc(-1 * var(--autospark-resize-handle-size,12px) / 2);left:calc(-1 * var(--autospark-resize-handle-size,12px) / 2);cursor:nesw-resize;}
[data-autospark-resize-handle="sw"]::after{right:2px;top:2px;width:5px;height:5px;background:var(--autospark-resize-handle-color,rgba(96,96,96,0.55));clip-path:polygon(0 100%,0 0,100% 100%);}
[data-autospark-resize-handle="ne"]::after,[data-autospark-resize-handle="nw"]::after{width:5px;height:5px;background:var(--autospark-resize-handle-color,rgba(96,96,96,0.55));}
/* 暗色兜底变体（ADR-0129）：手柄色属非映射声明（保持两级），兜底按 theme 校准切换 */
[dark] [data-autospark-resize-handle]::after,[data-dark] [data-autospark-resize-handle]::after{background:var(--autospark-resize-handle-color,rgba(250,250,250,0.55));}
[dark] [data-autospark-resize-handle]:hover::after,[data-dark] [data-autospark-resize-handle]:focus-visible::after{background:var(--autospark-resize-handle-color,rgba(250,250,250,0.75));}
[data-autospark-resize-handle="ne"]::after{right:2px;bottom:2px;clip-path:polygon(0 0,100% 0,100% 100%);}
[data-autospark-resize-handle="nw"]::after{left:2px;bottom:2px;clip-path:polygon(0 0,100% 0,0 100%);}
`;

/** 注入手柄全局样式（幂等；多 engine 共享、destroy 不移除——对齐全局样式惯例） */
export function registerResizeStyles(): void {
    injectStylesheet(RESIZE_HANDLE_CSS, { id: RESIZE_STYLE_ID });
}

/**
 * x-resizable 指令（ADR-0064）：宿主元素尺寸拖拽调节，Compile kind（编译期建绑定、
 * 挂载后微任务注入手柄——computed 检测需已连接文档）。动态启停用 x-if 包宿主表达。
 */

/* ══════════ 自 engine x-expandable.ts 平移（模块级：常量/函数/非指令类） ══════════ */
/**
 * x-expandable：展开折叠（ADR-0069）——宿主元素的通用展开/折叠指令，值为**显式展开态布尔**
 * （true=展开）双向绑定；**全引擎折叠机制唯一实现**（ADR-0070 组合落定：x-splitter 面板
 * `data-expandable` 全机制组合、x-drawer 经共享把手模块统一把手层）。
 *
 * **值形态**（决策二）：简单路径（如 `ui.open`）双向——点击把手经 setVal 回写翻转
 * （x-model 防循环纪律：watcher 等值短路）；复杂表达式 warn 一次 + **只读降级**（点击
 * no-op，不本地假切换——UI 与状态背离是隐性 bug 源）；`true`/`false` 字面量（裸或引号）
 * 恒定态；空值 warn + 指令不作为。
 *
 * **direction = 收起方向**（决策三，停靠边）：`left`=向左收起（把手骑活动边=右边缘）、
 * 默认 `left`；top/bottom 走 height 轴。
 *
 * **折叠双通道由 minSize 分派**（决策四）：
 * - `minSize=0`（默认）= **滑出折叠**，宽度/高度**保持不改**，终态持续保持不归零：
 *   - `collapse:'margin'`（默认）：inline 负 margin 滑出（占位归零、兄弟流入、内容不挤压，
 *     与 splitter slide 通道同构）；需要父容器 `overflow:hidden` 裁剪（见「父容器注入」）。
 *   - `collapse:'slide'`：`translateX/Y(±100%)` 平移（占位不变，服务 fixed 覆盖形态）。
 * - `minSize>0` = 纯尺寸收缩（width/height 过渡至 minSize），子内容**不隐藏**。
 * 展开：maxSize 有值写 inline 尺寸、缺省**移除** inline 尺寸让 CSS 决定（不快照记忆）；
 * auto↔数值的展开/折叠动画经全局 `interpolate-size: allow-keywords` 渐进增强
 * （Chrome 129+/Safari 18.2+ 生效，不支持浏览器瞬跳——需要确定性动画显式声明 maxSize）。
 *
 * **渐变遮盖**（`fadeSize`，默认 0 不启用）：>0 时收缩折叠态在活动边显示渐隐层
 * （宿主 ::before，零 DOM），指示内容被截断（业界惯例）；显示判据 `data-shrunk`
 * （仅收缩折叠挂的宿主级标记，兼作页面 CSS 感知收缩态的通用钩子）。
 * 初始值 false：编译期挂终态、**无动画**（splitter「初始折叠不派发事件」惯例）；margin
 * 通道的滑出距离依赖布局测量，整体推迟到编译后微任务（x-resizable 先例——元素挂载后执行）。
 *
 * **子内容隐藏**（决策五）：滑出折叠态经 `[data-collapsed] > :not(把手){visibility:hidden}`
 * 隐藏——**宿主自身不能 overflow:hidden**（宽度保持的盒子会把 absolute 把手一并裁掉）；
 * 编译后微任务检测宿主 overflow 非 visible（hidden/clip/auto/scroll 任一轴）warn 一次
 * （裁掉/滚走骑边把手防线，overflow 需求由内层包裹承载）。宿主 `data-collapsed` 仅滑出
 * 折叠挂（内容隐藏钩子），把手 `data-collapsed` 独立挂（箭头翻转，minSize>0 折叠也翻转
 * ——两处分离，splitter 先例）。
 *
 * **把手**（决策六 + ADR-0070 共享模块）：构建/箭头矩阵/半圆视觉在 expandable-trigger.ts
 * 唯一实现（20px 圆 + 全局图标 `arrow`、role=button、Enter/Space、指针 stopPropagation，
 * drawer 为第二消费者）；滑轨坐标 `pos` 三态（`'center'` 默认 ≡ `'50%'` / number=px /
 * CSS 长度串负值距对端，越界样式表钳制——把手是唯一重开触点）；`offset` 额外偏移
 * （固定轴语义：+ = 把手跨轴正方向右/下，负值反向——splitter 注入分隔条宽度一半
 * 使把手中分分隔条）。
 * **显隐策略**（`showTrigger`，默认 `'hover'`）：opacity 隐藏不丢命中；感应边条覆盖
 * 整条活动边线（pos 自定义后把手位置不可预知；启用内建 resize 时感应载体让位手柄带，
 * 见「内建单边 resize」——两者同骑一条边线）；常驻仅限滑出折叠（minSize=0——
 * 感应载体随宿主隐藏）与触屏，minSize>0 收缩折叠保持 hover 控制；Tab 聚焦显形；
 * `'always'` 恒常驻。
 * **动态挂载（reparent）**：展开态挂宿主骑活动边；滑出折叠**完成后**（transitionend /
 * 600ms 兜底）移入父容器贴停靠边内侧（宿主滑出后其内子元素随容器裁剪，把手外迁保常驻
 * 可达）；展开动画**启动前**移回宿主。两态定位全 CSS 化（`--as-pos` 变量 + 样式表
 * 钳制，splitter 手法）：展开态相对宿主（rail=活动边长）、折叠态相对父容器（rail=停靠
 * 边长）——同名变量两套规则，reparent 零 JS 测量（实施修订：较 ADR 草案的 rect 快照
 * 反算更简，happy-dom 无布局可测）。`minSize>0` 折叠**永不迁移**（宿主不滑出）。
 *
 * **父容器注入**（决策七）：margin 通道需要父容器裁剪滑出部分。默认
 * `injectOverflow:true` **折叠期间**由指令注入——折叠开始挂 `data-autospark-expandable-clip`
 * （overflow:hidden；父容器本为 hidden/clip 幂等跳过）+ `data-autospark-expandable-dock`
 * （position:relative，把手 reparent 的定位上下文，恒注入），**保持至展开动画完成后**
 * （属性驱动，用户 inline/类样式不受影响；多实例共享父容器 WeakMap 引用计数、最后一个
 * 展开完成才摘）；原值 `auto/scroll` 滚动条折叠期间暂失为已知副作用。`false` 显式禁用
 * 后回落检测：父容器 computed overflow 非 hidden/clip 时 warn 一次、用户自负。
 *
 * **内建单边 resize**（ADR-0072）：`resize` 选项启用单边调节（方向由折叠方向自动推导、
 * 复用 x-resizable 的 ResizeSession 核心、拖出尺寸接管 `_maxDecl` 展开尺寸真相；同元素
 * x-resizable 互斥自失效——边线交互单指令独占）。**把手与手柄同骑活动边线，两层协调**：
 * ① *把手压手柄之上*（宿主挂 `data-resize` → 样式表抬至 z11：手柄带 z10 全长覆盖边线，
 * 压住 z5 把手会让调节线横穿把手圆面、把手圆面区命中被拦 → hover 模式下把手不可见且
 * 折叠不可点）；② *手柄 hover 桥接显形*（`data-edge-hover` 统一契约，splitter/drawer
 * 同款）：感应边条 z4 被手柄带完全盖住收不到 hover，hover 模式的边线感应由手柄转译。
 *
 * **事件**（决策八）：`expandable:expand` / `expandable:collapse`（宿主派发、DOM 冒泡、
 * detail `{ size }`——展开为 maxSize 格式化值或 null，折叠为 0 或 minSize 格式化值）；
 * 初始应用不派发。
 *
 * **静态特性**（决策一）：Compile（编译期 createElement 注入把手——不在模板树、天然
 * 不被 walk，无需 ownsChildren）、priority 50（bind/on 同级）、singleton。
 */
export type ExpandableDirection = "left" | "right" | "top" | "bottom";
export type ExpandableMode = "margin" | "slide";

/** 方向合法值集 */
const DIRECTIONS: readonly ExpandableDirection[] = ["left", "right", "top", "bottom"];
/** 滑出通道合法值集 */
const MODES: readonly ExpandableMode[] = ["margin", "slide"];

/** 滑出折叠的 transform 位移（slide 通道，% 相对自身——无需布局测量） */
const SLIDE_TRANSFORMS: Record<ExpandableDirection, string> = {
    left: "translateX(-100%)",
    right: "translateX(100%)",
    top: "translateY(-100%)",
    bottom: "translateY(100%)",
};

/** 滑出折叠的负 margin 属性（margin 通道，按收起方向分派） */
const MARGIN_PROPS: Record<ExpandableDirection, string> = {
    left: "margin-left",
    right: "margin-right",
    top: "margin-top",
    bottom: "margin-bottom",
};

/**
 * 父容器注入引用计数（决策七）：父元素 → 活跃折叠实例数；归零摘除 dock/clip 属性
 * （多实例共享父容器时最后一个展开完成才恢复原值）。
 */
const dockCounts = new WeakMap<HTMLElement, number>();

/** 滑轨钳制表达式（把手圆心坐标钳到 [half, rail−half]，splitter 手法）：定义一次复用 */
const RAIL_CLAMP = "max(var(--as-pos-half),min(calc(100% - var(--as-pos-half)),var(--as-pos,50%)))";

// 全局样式（类级 initialize 注入，幂等；CSS 变量定制视觉，对齐 splitter 惯例）。
// 把手基座/箭头矩阵/半圆视觉在共享模块（ADR-0070，registerTriggerStyles 注入），
// 本文件只承载宿主级规则与显隐/定位策略
const EXPANDABLE_STYLE_ID = "autospark-expandable-styles";
const EXPANDABLE_CSS = `
${SHARED_TRIGGER_CSS}
/* 宿主：滑出折叠子内容隐藏（visibility 不触发子树 reflow，把手排除——宿主不可自身
   overflow:hidden：宽度保持的盒子会把把手一并裁掉，ADR-0069 决策五）。
   把手 absolute 定位上下文不在此强制（JS 微任务补——CSS 强写 position:relative 会覆盖
   fixed/absolute 宿主，而 fixed 覆盖形态恰是 slide 通道的目标场景） */
.autospark-expandable[data-collapsed]>:not(.autospark-expandable-trigger){visibility:hidden;}
/* 展开尺寸缺省（maxSize 不设）= 移除 inline 尺寸回落 auto——auto 与数值默认不可插值
   （瞬跳无动画）；allow-keywords 启用 auto↔数值过渡（Chrome 129+/Safari 18.2+，
   不支持浏览器渐进降级瞬跳、不劣化——需要确定性动画请显式声明 maxSize） */
.autospark-expandable{interpolate-size:allow-keywords;}
/* 折叠态翻转动画（决策四）：margin（滑出）/ width/height（收缩）/ transform（slide）统一时长 */
.autospark-expandable[data-animating]{transition:width var(--autospark-expandable-duration,.25s) ease,height var(--autospark-expandable-duration,.25s) ease,margin var(--autospark-expandable-duration,.25s) ease,transform var(--autospark-expandable-duration,.25s) ease;}
/* 把手显隐策略（opacity 归本指令——drawer 恒常驻不走此处，ADR-0070）：默认隐藏
   （opacity:0 不丢命中，可点可聚焦）；**常驻仅限滑出折叠**（minSize=0：宿主滑出后
   边条感应载体随宿主 visibility 隐藏，把手是唯一重开触点必须常驻）——两阶段选择器：
   动画期间把手尚在宿主内（宿主 data-collapsed 已挂）+ 终态 reparent 后（父容器 dock；
   多实例时仅命中 dock 直接子的折叠把手，展开态把手不受影响）。minSize>0 收缩折叠
   宿主可见、边条感应仍在——把手保持 hover 显隐控制（动画期间由 data-animating 规则
   保持显形）。触屏（hover:none）常驻、Tab 聚焦显形；always = 恒常驻（宿主级属性）。
   同规则承载滑轨钳制表达式变量（越界静默钳到 [half, rail−half]——把手是唯一重开触点） */
.autospark-expandable>.autospark-expandable-trigger,
[data-autospark-expandable-dock]>.autospark-expandable-trigger{--as-pos-clamp:${RAIL_CLAMP};opacity:0;}
/* 把手显隐策略（showTrigger，默认 hover）：opacity:0 不丢命中（可点可聚焦）；
   **常驻仅限滑出折叠**（minSize=0：宿主滑出后边条感应载体随宿主 visibility 隐藏，
   把手是唯一重开触点必须常驻）——两阶段选择器：动画期间把手尚在宿主内（宿主
   data-collapsed 已挂）+ 终态 reparent 后（父容器 dock；多实例时仅命中 dock 直接子的
   折叠把手，展开态把手不受影响）。minSize>0 收缩折叠宿主可见、边条感应仍在——
   把手保持 hover 显隐控制（动画期间由 data-animating 规则保持显形）。
   触屏（hover:none）常驻、Tab 聚焦显形；always = 恒常驻（宿主级属性） */
.autospark-expandable[data-collapsed]>.autospark-expandable-trigger[data-collapsed],
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-collapsed],
.autospark-expandable-trigger:focus-visible{opacity:1;}
.autospark-expandable[data-show-trigger="always"]>.autospark-expandable-trigger{opacity:1;}
.autospark-expandable[data-animating]>.autospark-expandable-trigger{opacity:1;}
/* 边线交互元素桥接显形（ADR-0070 修订 + ADR-0072 契约收敛）：活动边上存在另一交互
   元素（分隔条 / resize 手柄）时，元素 hover 即为感应事件——消费方置位把手 data-edge-hover
   属性显形（统一契约：splitter 分隔条桥接 / drawer 面板手柄桥接；**同元素**边线元素只有
   内建单边 resize 手柄一种，由本指令 _bridgeHandleHover 自行接线）；hover 模式下生效，
   always 模式无副作用（恒显） */
.autospark-expandable-trigger[data-edge-hover]{opacity:1;}
@media (hover: hover) {
  .autospark-expandable-trigger:hover{opacity:1;}
}
@media (hover: none) {
  .autospark-expandable-trigger{opacity:1;}
}
/* 感应边条（showTrigger:'hover'）：贴活动边线整条、厚 24px（跨边内外各 12px）——
   pos 自定义把手位置后不可预知，鼠标移到边线任何位置都应显形把手；hover 模式
   展开态启用（折叠态随宿主 data-collapsed 的 visibility 规则隐藏、触屏不启用）。
   边条遮挡边线附近内容的点击（hover 模式固有代价）。z-index 低于把手（把手区
   hover 直接命中把手本体） */
.autospark-expandable-edge{position:absolute;display:none;z-index:4;}
@media (hover: hover) {
  .autospark-expandable[data-show-trigger="hover"]>.autospark-expandable-edge{display:block;}
  .autospark-expandable-edge:hover~.autospark-expandable-trigger{opacity:1;}
}
.autospark-expandable[data-direction="left"]>.autospark-expandable-edge{right:-12px;top:0;bottom:0;width:24px;}
.autospark-expandable[data-direction="right"]>.autospark-expandable-edge{left:-12px;top:0;bottom:0;width:24px;}
.autospark-expandable[data-direction="top"]>.autospark-expandable-edge{bottom:-12px;left:0;right:0;height:24px;}
.autospark-expandable[data-direction="bottom"]>.autospark-expandable-edge{top:-12px;left:0;right:0;height:24px;}
/* 内建单边 resize 层级（ADR-0072 修订：把手压手柄之上）：把手与手柄**同骑活动边线**
   ——手柄带 z10 全长覆盖边线，z5 把手被压在下：调节线（2px）横穿把手圆面、把手圆面区
   命中被手柄拦走（hover 模式下把手又不可见 → 折叠不可点）。宿主挂 data-resize 时把把手
   抬至 z11 全量盖过调节线，调节线在把手 20px 之外照常拖拽（边线交互唯一入口的把手优先，
   与 drawer 让位语义的方向相反：drawer 的把手在覆盖物容器、层级封顶抬不动只能让位）。
   感应载体同步让位：边条（z4）被手柄带完全盖住收不到 hover，hover 模式「移到边线即见
   把手」改由手柄桥接承担（_bridgeHandleHover → data-edge-hover） */
.autospark-expandable[data-resize]>.autospark-expandable-trigger{z-index:11;}
/* 渐变遮盖（fadeSize>0，收缩折叠态）：贴活动边线的渐隐层，指示内容被截断（业界惯例）。
   宿主 ::before（零 DOM）；data-shrunk 仅收缩折叠挂（滑出折叠走 data-collapsed）——
   折叠态渐显、展开摘属性渐隐（复用 --autospark-expandable-duration）；pointer-events
   关闭不挡交互；z-index 低于边条(4)/把手(5)。厚度经 --as-fade-size（JS 写值 CSS 消费），
   颜色经 --autospark-expandable-fade-color 定制（默认 slate 半透明） */
.autospark-expandable[data-fade]::before{content:"";position:absolute;z-index:2;pointer-events:none;opacity:0;transition:opacity var(--autospark-expandable-duration,.25s) ease;}
.autospark-expandable[data-fade][data-direction="left"]::before{right:0;top:0;bottom:0;width:var(--as-fade-size,0px);background:linear-gradient(to left,var(--auto-bgcolor, var(--autospark-expandable-fade-color,#fff)),transparent);}
.autospark-expandable[data-fade][data-direction="right"]::before{left:0;top:0;bottom:0;width:var(--as-fade-size,0px);background:linear-gradient(to right,var(--auto-bgcolor, var(--autospark-expandable-fade-color,#fff)),transparent);}
.autospark-expandable[data-fade][data-direction="top"]::before{bottom:0;left:0;right:0;height:var(--as-fade-size,0px);background:linear-gradient(to top,var(--auto-bgcolor, var(--autospark-expandable-fade-color,#fff)),transparent);}
.autospark-expandable[data-fade][data-direction="bottom"]::before{top:0;left:0;right:0;height:var(--as-fade-size,0px);background:linear-gradient(to bottom,var(--auto-bgcolor, var(--autospark-expandable-fade-color,#fff)),transparent);}
/* 暗色兜底变体（ADR-0129）：fade 遮罩色兜底切换为 theme 默认暗色校准值（变量链不变） */
[dark] .autospark-expandable[data-fade][data-direction="left"]::before,[data-dark] .autospark-expandable[data-fade][data-direction="left"]::before{background:linear-gradient(to left,var(--auto-bgcolor, var(--autospark-expandable-fade-color,#606060)),transparent);}
[dark] .autospark-expandable[data-fade][data-direction="right"]::before,[data-dark] .autospark-expandable[data-fade][data-direction="right"]::before{background:linear-gradient(to right,var(--auto-bgcolor, var(--autospark-expandable-fade-color,#606060)),transparent);}
[dark] .autospark-expandable[data-fade][data-direction="top"]::before,[data-dark] .autospark-expandable[data-fade][data-direction="top"]::before{background:linear-gradient(to top,var(--auto-bgcolor, var(--autospark-expandable-fade-color,#606060)),transparent);}
[dark] .autospark-expandable[data-fade][data-direction="bottom"]::before,[data-dark] .autospark-expandable[data-fade][data-direction="bottom"]::before{background:linear-gradient(to bottom,var(--auto-bgcolor, var(--autospark-expandable-fade-color,#606060)),transparent);}
.autospark-expandable[data-fade][data-shrunk]::before{opacity:1;}
/* 把手展开态定位（宿主内）：**圆心骑活动边线**（一半突出宿主外）+ 沿边滑轨
   （--as-pos 圆心坐标，负值距对端）——滑出全程圆心恒贴边线，reparent 零跳变。
   offset（--as-offset，固定轴语义）：把手沿边线法线的额外偏移，+ = 轴向正方向
   （left/right 方向 = 向右、top/bottom 方向 = 向下）——splitter 注入分隔条宽度
   一半使把手中分分隔条（首位 + / 次位 −），展开态与 dock 态跨轴属性方向相反
   （活动边翻边）故符号逐规则固定 */
.autospark-expandable[data-direction="left"]>.autospark-expandable-trigger{right:calc(-1*var(--as-pos-half) - var(--as-offset,0px));top:calc(var(--as-pos-clamp) - var(--as-pos-half));}
.autospark-expandable[data-direction="left"]>.autospark-expandable-trigger[data-pos-negative]{top:auto;bottom:calc(var(--as-pos-clamp) - var(--as-pos-half));}
.autospark-expandable[data-direction="right"]>.autospark-expandable-trigger{left:calc(-1*var(--as-pos-half) + var(--as-offset,0px));top:calc(var(--as-pos-clamp) - var(--as-pos-half));}
.autospark-expandable[data-direction="right"]>.autospark-expandable-trigger[data-pos-negative]{top:auto;bottom:calc(var(--as-pos-clamp) - var(--as-pos-half));}
.autospark-expandable[data-direction="top"]>.autospark-expandable-trigger{bottom:calc(-1*var(--as-pos-half) - var(--as-offset,0px));left:calc(var(--as-pos-clamp) - var(--as-pos-half));}
.autospark-expandable[data-direction="top"]>.autospark-expandable-trigger[data-pos-negative]{left:auto;right:calc(var(--as-pos-clamp) - var(--as-pos-half));}
.autospark-expandable[data-direction="bottom"]>.autospark-expandable-trigger{top:calc(-1*var(--as-pos-half) + var(--as-offset,0px));left:calc(var(--as-pos-clamp) - var(--as-pos-half));}
.autospark-expandable[data-direction="bottom"]>.autospark-expandable-trigger[data-pos-negative]{left:auto;right:calc(var(--as-pos-clamp) - var(--as-pos-half));}
/* 半圆折叠态（滑出折叠）由把手自带 data-half 承载（_applyExpanded 挂摘）——视觉规则
   在共享模块；minSize>0 收缩折叠不挂 data-half（全圆、图标不缩放不平移，只翻转指向） */
/* 把手折叠态定位（reparent 至父容器后）：**圆心骑停靠边线**——外一半被父容器
   overflow 裁掉呈半圆（drawer 把手折叠态形态）；rail=父容器边长；
   与展开态规则天然互斥（把手同一时刻只在一处），同名 --as-pos 变量复用 */
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="left"]{left:calc(-1*var(--as-pos-half) + var(--as-offset,0px));top:calc(var(--as-pos-clamp) - var(--as-pos-half));}
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="left"][data-pos-negative]{top:auto;bottom:calc(var(--as-pos-clamp) - var(--as-pos-half));}
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="right"]{right:calc(-1*var(--as-pos-half) - var(--as-offset,0px));top:calc(var(--as-pos-clamp) - var(--as-pos-half));}
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="right"][data-pos-negative]{top:auto;bottom:calc(var(--as-pos-clamp) - var(--as-pos-half));}
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="top"]{top:calc(-1*var(--as-pos-half) + var(--as-offset,0px));left:calc(var(--as-pos-clamp) - var(--as-pos-half));}
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="top"][data-pos-negative]{left:auto;right:calc(var(--as-pos-clamp) - var(--as-pos-half));}
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="bottom"]{bottom:calc(-1*var(--as-pos-half) - var(--as-offset,0px));left:calc(var(--as-pos-clamp) - var(--as-pos-half));}
[data-autospark-expandable-dock]>.autospark-expandable-trigger[data-direction="bottom"][data-pos-negative]{left:auto;right:calc(var(--as-pos-clamp) - var(--as-pos-half));}
/* 父容器注入（决策七，折叠期间挂、展开完成摘）：dock=把手 reparent 定位上下文（恒注入）、
   clip=滑出溢出裁剪（injectOverflow 通道，父容器本为 hidden/clip 时不挂——幂等） */
[data-autospark-expandable-dock]{position:relative;}
[data-autospark-expandable-clip]{overflow:hidden;}
`;

/** 注入 x-expandable 全局样式（幂等；多 engine 共享、destroy 不移除——全局样式惯例） */
export function registerExpandableStyles(): void {
    injectStylesheet(EXPANDABLE_CSS, { id: EXPANDABLE_STYLE_ID });
}

/**
 * x-expandable 指令（ADR-0069）：Compile 类（priority 50、singleton、无 ownsChildren——
 * 把手 createElement 注入不在模板树，天然不被编译；宿主子树照常编译）。实现结构见类头注释。
 */

/* ══════════ 自 engine x-splitter.ts 平移（模块级：常量/函数/非指令类） ══════════ */
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
.autospark-splitter-divider:hover::after,.autospark-splitter-divider:focus-visible::after{background:var(--autospark-splitter-color-hover,rgba(96,96,96,0.55));}
/* 暗色兜底变体（ADR-0129）：分隔条 hover 色属非映射声明（保持两级），兜底按 theme 校准切换 */
[dark] .autospark-splitter-divider:hover::after,[dark] .autospark-splitter-divider:focus-visible::after,[data-dark] .autospark-splitter-divider:hover::after,[data-dark] .autospark-splitter-divider:focus-visible::after{background:var(--autospark-splitter-color-hover,rgba(250,250,250,0.55));}
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
    injectStylesheet(SPLITTER_CSS, { id: SPLITTER_STYLE_ID });
}

/** 把手滑轨定位的样式表钳制形态见 SPLITTER_CSS（inline 只写 --as-rail 坐标变量） */

/**
 * x-splitter 指令（ADR-0067）：Compile 类结构指令（ownsChildren——剥伪绑定后自行编译
 * 两面板、注入分隔条）。实现结构见类头注释。
 */

/* ══════════ 自 engine x-layout.ts 平移（模块级：常量/函数/非指令类） ══════════ */
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

// ── 类型与纯函数 ──────────────────────────────────────────────────────

/** 布局单元词表 */
export type PaneKind = "header" | "content" | "sidebar" | "footer";
const PANE_KINDS: PaneKind[] = ["header", "content", "sidebar", "footer"];

/** 窗格声明（编译期收集的冻结快照 + 派生配置） */
interface PaneDecl {
    kind: PaneKind;
    /** 仅 sidebar 有（缺省 .left） */
    side: "left" | "right" | null;
    throughUp: boolean;
    throughDown: boolean;
    /** x-pane-options.height/width（格式化后的 CSS 长度串；null = 未声明） */
    height: string | null;
    width: string | null;
    /** x-pane-options 布尔 opt-out（仅 sidebar 消费，M3） */
    expandableOptOut: boolean;
    resizeOptOut: boolean;
    /** 折叠联动阈值 px（x-expandable-options.minSize；null = 0——拖到 0 折叠；非法值已 warn 剔除回落 0） */
    expandableMin: number | null;
    /** resize 默认注入已补属性（诊断/测试用） */
    resizeInjected?: boolean;
    /** 同侧 ≥2 已分组为分割窗格（面板语义：data-size 声明、跳过默认行为注入） */
    grouped?: boolean;
    /** 冻结快照（cloneNode(true)，x-pane 家族属性已剥除；x-if/x-show 原样保留） */
    template: HTMLElement;
    /** 存在性表达式（x-if 优先；null = 恒存在） */
    presenceExpr: string | null;
    /** 显式行为指令检测（M3 消费） */
    expandableExplicit: boolean;
    expandableOpts: Record<string, any> | null;
    resizeExplicit: boolean;
}

type PaneParseResult = { type: "pane"; decl: PaneDecl } | { type: "prune" };

/**
 * 同侧多窗格的分割容器构建（纯函数，ADR-0074 决策七：程序化组合 x-splitter）。
 *
 * 每层容器挂 `x-splitter="'horizontal'"`，层内**首窗格声明 data-size**（宽度选项值或默认
 * 240px）为定容面板、其余为自适应面板——拖分隔条守恒分配；3+ 窗格递归嵌套链（余下窗格
 * 包进内层容器作为外层的自适应面板，每层各持一对「定容/自适应」）。分割窗格不再吃
 * layout 的 gap（间距由分隔条承载）与默认行为注入（调节走分隔条、折叠走窗格显式
 * `data-expandable` 的 splitter 通道，ADR-0070）。
 */
function buildSideSplitter(panes: PaneDecl[]): HTMLElement {
    const container = document.createElement("div");
    container.setAttribute("x-splitter", "'horizontal'");
    container.setAttribute("data-autospark-layout-side", "");
    const first = panes[0]!;
    first.template.setAttribute("data-size", first.width ?? "240px");
    container.appendChild(first.template);
    if (panes.length > 2) {
        container.appendChild(buildSideSplitter(panes.slice(1)));
    } else {
        container.appendChild(panes[1]!.template);
    }
    return container;
}

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
export function buildLayoutGrid(m: LayoutGridModel): LayoutGridTemplate {
    const names: string[] = [];
    const widths: string[] = [];
    if (m.left > 0) {
        names.push("left");
        widths.push("auto");
    }
    names.push("content");
    widths.push("1fr");
    if (m.right > 0) {
        names.push("right");
        widths.push("auto");
    }

    const cell = (col: string, row: "header" | "middle" | "footer"): string => {
        if (row === "middle") return col === "content" ? (m.content ? "content" : ".") : col;
        if (row === "header") {
            if (col === "left") return m.ltUp ? "left" : "header";
            if (col === "right") return m.rtUp ? "right" : "header";
            return m.header ? "header" : ".";
        }
        if (col === "left") return m.ltDown ? "left" : "footer";
        if (col === "right") return m.rtDown ? "right" : "footer";
        return m.footer ? "footer" : ".";
    };

    const heights: string[] = [];
    const matrix: string[][] = [];
    if (m.header) {
        matrix.push(names.map((n) => cell(n, "header")));
        heights.push("auto");
    }
    matrix.push(names.map((n) => cell(n, "middle")));
    heights.push("1fr");
    if (m.footer) {
        matrix.push(names.map((n) => cell(n, "footer")));
        heights.push("auto");
    }

    return {
        areas: matrix.map((r) => `"${r.join(" ")}"`).join(" "),
        rows: heights.join(" "),
        cols: widths.join(" "),
    };
}

// ── 工具 ──────────────────────────────────────────────────────────────

/** 选项长度值格式化：number → px；非空字符串原样（CSS 长度串）；非法 null */
function formatLength(v: any): string | null {
    if (typeof v === "number") return Number.isFinite(v) ? `${v}px` : null;
    if (typeof v === "string" && v.trim() !== "") return v.trim();
    return null;
}

/** px 数值解析（联动阈值用）：number 直接取；"120"/"120px" 串解析；其余 null */
function parsePxNumber(v: any): number | null {
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    if (typeof v === "string") {
        const m = /^(\d+(?:\.\d+)?)px$/i.exec(v.trim());
        return m ? parseFloat(m[1]!) : null;
    }
    return null;
}

/** options JSON 解析（relaxed-json；非对象 / 解析失败 warn 后返回 null） */
function parseJsonObject(
    raw: string,
    warn: (msg: string) => void,
    label: string,
): Record<string, any> | null {
    const s = raw.trim();
    if (s === "") return {};
    try {
        const v = JSON.parse(relaxedToJson(s));
        if (v && typeof v === "object" && !Array.isArray(v)) return v;
        warn(`${label} 值 "${raw}" 须为对象，已忽略`);
        return null;
    } catch {
        warn(`${label} 值 "${raw}" 不是合法配置（relaxed-json），已忽略`);
        return null;
    }
}

// ── 全局样式（类级 initialize 注入，幂等；ADR-0074 决策八）────────────

const LAYOUT_STYLE_ID = "autospark-layout-styles";
const LAYOUT_CSS = `
.autospark-layout{display:grid;position:relative;}
.autospark-layout>[data-autospark-layout-pane]{position:relative;min-width:0;min-height:0;}
/* 默认尺寸经 CSS 变量落在窗格元素——不落 inline（用户 CSS 可覆盖）；窗格选项走 inline（显式优先） */
.autospark-layout>[data-autospark-layout-pane="header"]{height:var(--autospark-layout-header-height,64px);}
.autospark-layout>[data-autospark-layout-pane="footer"]{height:var(--autospark-layout-footer-height,64px);}
.autospark-layout>[data-autospark-layout-pane="sidebar"]{width:var(--autospark-layout-sidebar-width,240px);}
/* 存在性剔除契约：压过 x-show 的 inline display（同一次 flush 内最终一致） */
.autospark-layout [data-autospark-layout-absent]{display:none!important;}
`;

/** 注入 layout 全局样式（幂等；多 engine 共享、destroy 不移除——全局样式惯例） */
export function registerLayoutStyles(): void {
    injectStylesheet(LAYOUT_CSS, { id: LAYOUT_STYLE_ID });
}

/* ══════════ 自 engine x-pane.ts 平移（模块级：常量/函数/非指令类） ══════════ */
/**
 * x-pane：布局窗格名位标记（ADR-0074）。
 *
 * `x-pane:参数` 声明 x-layout 的布局单元（词表 `header | content | sidebar | footer`；
 * `sidebar` 必带 `.left` / `.right` 修饰符，缺省按 `.left`；`.up` / `.down` 为 through
 * 简写修饰符——解析期并入指令选项，与 `x-pane-options={through:"up,down"}` 等价）。
 *
 * **本类是名位标记**（x-else-if / x-tree-node 先例）：窗格的收集、剪枝、grid 模板生成、
 * 存在性订阅与行为组合全部由父级 x-layout（LayoutDirective，ownsChildren）在编译期接管——
 * layout 收集快照时会剥除直接子级上的 x-pane 属性，故 layout 内的本类**永不实例化**。
 * 本类仅为两处兜底而注册：
 * 1. 深层 / 孤儿 x-pane（无 layout 祖先）：属性被正常剥除并实例化本类 → warn 诊断，
 *    子树照常编译（无结构副作用）；
 * 2. 让 `x-pane` 成为注册表合法名（DirectiveManager 一名一指令，防被未来同名注册静默顶掉）。
 */

/**
 * layout 家族指令类工厂：基类由调用方注入，返回五个可直接经 `$.directive(name, Cls)`
 * 类重载安装的指令类。
 */
export function createLayoutDirectives(
    Base: typeof AutoSparkDirectiveBase,
): {
    resizable: typeof AutoSparkDirectiveBase;
    expandable: typeof AutoSparkDirectiveBase;
    splitter: typeof AutoSparkDirectiveBase;
    layout: typeof AutoSparkDirectiveBase;
    pane: typeof AutoSparkDirectiveBase;
} {
    /* ══════════ ResizableDirective（engine x-resizable.ts） ══════════ */
    class ResizableDirective extends Base {
        static override readonly priority = 0;
        static override readonly singleton = true;

        /** 类级初始化：注入手柄全局样式（幂等） */
        static override initialize(_engine: AutoSpark): void {
            registerResizeStyles();
        }

        /** 可写回的尺寸状态路径（简单路径形态才有；表达式只读降级） */
        private _sizePath: string | null = null;
        /** 调节会话（挂载后微任务创建；destroy 置 null） */
        private _session: ResizeSession | null = null;
        /** 微任务建连前被销毁（快速 x-if 切换） */
        private _destroyed = false;
        /** 只读降级 warn 一次（对齐 x-model 只读降级词条） */
        private _warnedReadonly = false;
        /** 同元素互斥失效标记（ADR-0072）：宿主同时声明 x-expandable 时本指令自失效 */
        private _dead = false;

        override created(): void {
            // 同元素互斥（ADR-0072，Q1=A）：x-expandable 内建单边 resize（本指令能力的单边
            // 子集，迁移路径 = x-expandable-options.resize）——同元素声明时本指令自失效，
            // 单点 warn，消灭把手/手柄/边条三层的命中抢夺
            if (this.binding.directives.some((d) => d.info.name === "expandable")) {
                this._dead = true;
                this.warn(
                    `x-resizable: 同元素存在 x-expandable，本指令已忽略（其内建单边 resize 为本指令能力子集，请迁移至 x-expandable-options.resize，ADR-0072）`,
                );
                return;
            }
            // 选项成员表达式管道（handles/minWidth 等可表达式化，配置成员不热应用——
            // 手势开始时现读 getOption，值变自然生效）
            this._watchOptionExprs();
            const raw = String(this.value ?? "").trim();
            if (raw === "") return;
            if (!isSimpleStatePath(raw)) {
                // 表达式只读降级：状态→DOM 照常，DOM→state 静默
                if (!this._warnedReadonly) {
                    this._warnedReadonly = true;
                    this.warn(
                        `x-resizable: 值 "${raw}" 非简单状态路径，退化为只读（状态→DOM 单向，写回须绑定对象路径，ADR-0064）`,
                    );
                }
                const initial = this.binding.watch(raw, ({ value }) => this._applyFromState(value));
                this._applyFromState(initial);
                return;
            }
            this._sizePath = raw;
            // 订阅分流（ADR-0043 语义边界适配：表达式支路无 depth 概念，依赖止于对象引用）：
            // - 无局部上下文：精准订阅 + depth:2（对象内部 width/height 键深层触发）；
            // - 有局部上下文（x-data 域等祖先）：简单路径也被分流到表达式支路（只收集 box 引用，
            //   内部键变化不触发——双向反向通道在此场景失效）——补两条**子键路径**订阅
            //   （表达式深读 box.width，依赖即含内部键），回调经落点解析重取完整对象。
            if (this._hasLocalContext()) {
                const d = this.engine.store.delimiter;
                this.binding.watch(`${raw}${d}width`, () =>
                    this._applyFromState(this._readSizeEntry()?.leaf),
                );
                this.binding.watch(`${raw}${d}height`, () =>
                    this._applyFromState(this._readSizeEntry()?.leaf),
                );
                this._applyFromState(this._readSizeEntry()?.leaf);
            } else {
                const initial = this.binding.watch(raw, ({ value }) => this._applyFromState(value), {
                    depth: 2,
                });
                this._applyFromState(initial);
            }
        }

        /** 编译完成后微任务建连（结果树已挂载，computed 检测可靠——对齐 x-teleport 先例） */
        override compile(): void {
            if (this._dead) return;
            Promise.resolve().then(() => this._setup());
        }

        override destroy(): void {
            this._destroyed = true;
            this._session?.destroy();
            this._session = null;
        }

        // ── 内部 ──────────────────────────────────────────────────────────

        /** 建会话：方向归一 → 流内降级 → 定位锚补齐 → 手柄注入 */
        private _setup(): void {
            if (this._destroyed || this._session) return;
            const el = this.el;
            if (!el || !el.isConnected) {
                // 未连接（teleport 等特殊时序）：不建手柄，绑定通道仍在
                return;
            }
            const handles = resolveHandles(this.options, (m) => this.warn(m));
            // 流内降级（ADR-0064 决策四）：非 absolute/fixed 丢弃非自然方向 + warn。
            // grid item 豁免（ADR-0072）：父容器 display:grid 时轨道定位下 width 单写即对缘让位
            // （免 left 补偿跟手），`w` 方向放行且不做定位补偿（_applyToEl 的 positioned 分支天然
            // 跳过）；`n` 仍保守丢弃——行轨道下顶缘跟手性不保证（首行场景顶缘锚定）。
            const positioned =
                typeof getComputedStyle === "function" &&
                ["absolute", "fixed"].includes(getComputedStyle(el).position);
            const gridItem =
                !positioned &&
                el.parentElement != null &&
                typeof getComputedStyle === "function" &&
                getComputedStyle(el.parentElement).display === "grid";
            const flowSafe = (d: string): boolean =>
                FLOW_SAFE_DIRECTIONS.has(d) || (gridItem && d === "w");
            const dropped = handles.filter((d) => !positioned && !flowSafe(d));
            const final = handles.filter((d) => !dropped.includes(d));
            if (dropped.length) {
                this.warn(
                    `x-resizable: 宿主非 absolute/fixed 定位，方向 ${dropped.join(",")} 需位置补偿已丢弃（完整 8 向请对定位元素使用），保留 ${final.join(",") || "（无）"}`,
                );
            }
            if (final.length === 0) return;
            // 手柄定位锚：宿主无 inline position 且非定位形态时补 relative（仅作 containing
            // block，不改文档流布局——ADR-0064 修订注：与「反向拖拽位置补偿」无关，relative
            // 无 left/top 零视觉影响）。inline 判定而非 computed：样式表已给 relative 的元素
            // 锚定已好，不覆盖用户声明
            if (!positioned && !el.style.position) {
                el.style.position = "relative";
            }
            const readOpts = () =>
                resolveResizeConstraints(
                    {
                        minWidth: this.getOption("minWidth"),
                        maxWidth: this.getOption("maxWidth"),
                        minHeight: this.getOption("minHeight"),
                        maxHeight: this.getOption("maxHeight"),
                        aspectRatio: this.getOption("aspectRatio"),
                        snap: this.getOption("snap"),
                    },
                    el,
                    (m) => this.warn(m),
                );
            this._session = new ResizeSession({
                target: el,
                eventTarget: el,
                handles: final,
                constraints: readOpts,
                apply: (w, h, dir, start) => this._applyToEl(el, w, h, dir, start, positioned),
                onApplied: (w, h) => this._writeBack(w, h),
                warn: (m) => this.warn(m),
            });
            this._session.attach();
            // 建连前到达的状态初值（watch 首值早于手柄微任务）：补应用一次（等值短路内建）
            if (this._pendingSize) {
                const p = this._pendingSize;
                this._pendingSize = null;
                this._applyFromState(p);
            }
        }

        /**
         * 普通元素写路径：直改 inline 尺寸 + 定位元素 w/n 手柄的对缘补偿（右/下缘不动）。
         * 写入判定 = 手柄影响该轴 **或值偏离会话初值**（aspectRatio 等比联动的从轴也要写；
         * height:auto 的元素不受同值写入钉死——初值不变不写）。
         */
        private _applyToEl(
            el: HTMLElement,
            w: number,
            h: number,
            dir: ResizeDirection,
            start: { w0: number; h0: number; left: number; top: number },
            positioned: boolean,
        ): void {
            if (AFFECTS_W(dir) || w !== start.w0) el.style.width = `${w}px`;
            if (AFFECTS_H(dir) || h !== start.h0) el.style.height = `${h}px`;
            if (positioned) {
                // w 缘拖宽 Δ：左缘左移 Δ 保持右缘不动（会话初值 rect 为基准，不随递进污染）
                if (dir.includes("w")) el.style.left = `${start.left + start.w0 - w}px`;
                if (dir.includes("n")) el.style.top = `${start.top + start.h0 - h}px`;
            }
        }

        /** 拖拽写回：实时（每应用一次写一次；简单路径落点解析直写，响应式天然合并下游） */
        private _writeBack(w: number, h: number): void {
            if (!this._sizePath) return;
            const entry = this._resolveSizeEntry();
            if (!entry) return;
            if (entry.local) {
                if (entry.leaf != null && typeof entry.leaf === "object") {
                    entry.leaf.width = w;
                    entry.leaf.height = h;
                }
                return;
            }
            try {
                setVal(this.engine.store.state, [...entry.segs, "width"], w);
                setVal(this.engine.store.state, [...entry.segs, "height"], h);
            } catch (e: any) {
                this.warn(`x-resizable: 尺寸写回失败（"${this._sizePath}"）: ${e?.message ?? e}`);
            }
        }

        /** 沿 scope 链探测是否存在局部上下文（locals / x-data 域——决定 watch 分流走向） */
        private _hasLocalContext(): boolean {
            let s: any = this.binding;
            while (s) {
                if (s.locals || s._data) return true;
                s = s.parent;
            }
            return false;
        }

        /**
         * 尺寸状态落点解析（读方向共用）：沿链找首段键的容器（locals → x-data 域）逐段下钻，
         * 全链无局部落点 → 全局 state（getVal 读取）。返回叶对象（尺寸对象本体）。
         */
        private _resolveSizeEntry(): { segs: string[]; leaf: any; local: boolean } | null {
            const segs = this._sizePath!.split(this.engine.store.delimiter);
            let s: any = this.binding;
            while (s) {
                const container =
                    s.locals && segs[0]! in s.locals
                        ? s.locals
                        : s._data && segs[0]! in s._data
                          ? s._data
                          : null;
                if (container) {
                    let obj: any = container;
                    for (let i = 0; i < segs.length - 1; i++) {
                        obj = obj?.[segs[i]!];
                        if (obj == null) return null; // 中途断裂：落点不完整
                    }
                    return { segs, leaf: obj?.[segs[segs.length - 1]!], local: true };
                }
                s = s.parent;
            }
            return {
                segs,
                leaf: getVal(this.engine.store.state, segs as any),
                local: false,
            };
        }

        /** 读方向便捷出口（子键订阅回调重取完整对象） */
        private _readSizeEntry(): { leaf: any } | null {
            return this._resolveSizeEntry();
        }

        /** 外部状态 → 宿主（反向通道）：会话中跳过（拖拽优先）；等值短路；过钳制管线 */
        private _applyFromState(value: any): void {
            if (this._destroyed || value == null || typeof value !== "object") return;
            if (this._session?.active) return;
            const w = Number((value as any).width);
            const h = Number((value as any).height);
            if (!Number.isFinite(w) && !Number.isFinite(h)) return;
            // 微任务建连前到达的初值：暂存待 _setup 后应用（无值形态初值走 inline 声明尺寸）
            if (!this._session) {
                this._pendingSize = { width: w, height: h };
                return;
            }
            const cur = readElementSize(this.el);
            if (cur.width === w && cur.height === h) return; // 等值短路（写回触发的自身 watch）
            this._session.applyExternal(
                Number.isFinite(w) ? w : cur.width,
                Number.isFinite(h) ? h : cur.height,
            );
        }

        /** 建连前到达的状态初值（_setup 末尾应用一次） */
        private _pendingSize: { width: number; height: number } | null = null;
    }

    /* ══════════ ExpandableDirective（engine x-expandable.ts） ══════════ */
    class ExpandableDirective extends Base {
        static override readonly priority = 50;
        static override readonly singleton = true;

        /** 类级初始化：注入全局样式（共享把手 + 本指令宿主级规则，均幂等） */
        static override initialize(_engine: AutoSpark): void {
            registerTriggerStyles();
            registerExpandableStyles();
        }

        // ── 配置（created 期静态读取，optionExprs 求值层已并入 getOption）────────

        /** 收起方向（停靠边），默认 left */
        private _dir: ExpandableDirection = "left";
        /** 把手显隐策略（showTrigger）：hover=边线感应显形（默认）；always=恒常驻 */
        private _showTrigger: "hover" | "always" = "hover";
        /** 滑出通道（仅 minSize=0 折叠生效），默认 margin */
        private _mode: ExpandableMode = "margin";
        /** maxSize 展开尺寸声明（null = 缺省：展开时移除 inline 尺寸、CSS 决定） */
        private _maxDecl: { value: number; unit: string } | null = null;
        /** minSize 折叠尺寸声明（null 或 ≤0 = 滑出折叠；>0 = 尺寸收缩） */
        private _minDecl: { value: number; unit: string } | null = null;
        /** 渐变遮盖厚度声明（null 或 ≤0 = 不启用；>0 = 收缩折叠态活动边渐隐遮盖） */
        private _fadeDecl: { value: number; unit: string } | null = null;
        /** 把手额外偏移（null = 未配置；非 "0px" 值写 --as-offset 供两态定位规则消费） */
        private _offsetCss: string | null = null;
        /** 折叠功能开关（enable 选项，默认 true）：false 时退化形态——不建把手、值绑定不订阅 */
        private _enable = true;
        /** 单边 resize 启用（resize 选项，默认关闭；修饰符 .resize 同效） */
        private _resizeOn = false;
        /** resize 透传约束（ResizeOptions 剥离 handles/aspectRatio 后的剩余键） */
        private _resizeOpts: Record<string, any> | null = null;
        /** 单边 resize 会话（复用 x-resizable 的 ResizeSession 核心，ADR-0072） */
        private _resizeSession: ResizeSession | null = null;

        // ── 运行态 ──────────────────────────────────────────────────────────

        /** 当前展开态（UI 真相；watcher 等值短路的判据） */
        private _expanded = true;
        /** 双向回写路径（null = 字面量恒态或表达式只读降级——点击 no-op） */
        private _expandedPath: string | null = null;
        /** 值为空 → 指令不作为（不建把手） */
        private _dead = false;
        /** 表达式只读降级 warn 已发（一次） */
        private _warnedReadonly = false;
        /** injectOverflow=false 的父容器检测 warn 已发（一次） */
        private _warnedOverflow = false;
        /** 宿主 overflow 非 visible 的检测 warn 已发（一次） */
        private _warnedHostOverflow = false;
        /** 初始应用哨兵（初始态不派发事件） */
        private _initialized = false;
        /** 把手元素 */
        private _trigger: HTMLElement | null = null;
        /** 感应边条（showTrigger:'hover' 展开态整条边线感应，把手的前置兄弟） */
        private _edge: HTMLElement | null = null;
        /** 把手当前是否 reparent 在父容器（折叠滑出终态） */
        private _docked = false;
        /** 本指令写过主轴 inline 尺寸（maxSize/minSize 应用时置位——展开移除仅限自己写过的，
            用户模板自带 inline 尺寸不动） */
        private _ownSizeProp = false;
        /** 本实例已注入父容器（dock/clip 计数所有权） */
        private _injected = false;
        /** 动画摘除兜底计时器 */
        private _animTimer: ReturnType<typeof setTimeout> | null = null;
        /** 微任务初始应用前被销毁（快速 x-if 切换防护） */
        private _destroyed = false;

        // ── 生命周期 ──────────────────────────────────────────────────────

        // ── 组合通道（ADR-0070 决策三：宿主指令以内部布尔源驱动）──────────────

        /** 组合驱动器（null = 模板值绑定形态）：get 取初值；set 承接把手翻转（组合方仲裁尺寸写回后再驱动本指令） */
        private _driver: {
            get(): boolean;
            set(expanded: boolean): void;
            resized?(decl: { value: number; unit: string }): void;
        } | null = null;
        /** resize:* 事件派发目标（默认宿主；组合方可指定——drawer 用指令宿主保持监听位置） */
        private _eventTarget: HTMLElement | null = null;

        /**
         * 组合实例化（ADR-0070）：在 el 上以内部布尔源驱动本指令——**旁路模板值绑定**
         * （折叠布尔真相由组合方持有：把手点击经 driver.set 仲裁，组合方完成 lastSize
         * 记忆/状态写回后经 composeSet 驱动全管线）。生命周期由组合方顺序驱动
         * （created → compile → destroy；compile 的初始应用微任务与模板形态同一时机语义）。
         *
         * @param eventTarget resize:* 事件派发目标（可选，默认宿主 el——drawer 迁移用指令
         *                    宿主承接以保持 @resize:end 监听位置不变，ADR-0073）
         */
        static compose(
            engine: AutoSpark,
            binding: AutoSparkScope,
            el: HTMLElement,
            options: Record<string, any> | undefined,
            driver: {
                get(): boolean;
                set(expanded: boolean): void;
                /** resize 写回路由钩子（可选，ADR-0073）：内建单边 resize 应用后以拖出声明回调——组合方接管尺寸真相（splitter 同步 _curSize/lastSize/状态写回；drawer 记 _resizeMem） */
                resized?(decl: { value: number; unit: string }): void;
            },
            eventTarget?: HTMLElement,
        ): ExpandableDirective {
            const inst = new ExpandableDirective(engine, binding, {
                name: "expandable",
                attr: "x-expandable",
                value: "",
                options,
            } as any);
            inst.el = el; // 组合宿主（构造默认取 binding.el = 组合方宿主，须改指面板）
            inst._driver = driver;
            inst._eventTarget = eventTarget ?? el;
            return inst;
        }

        /** 组合面：外部翻转折叠态（真相变更 → 动画/事件/reparent 全管线；animate=false 服务拖拽会话瞬时） */
        composeSet(expanded: boolean, animate = true): void {
            if (this._destroyed) return;
            this._applyExpanded(expanded, animate);
        }

        /** 组合面：动态设置展开尺寸声明（splitter lastSize 恢复链专用；null = 缺省移除语义） */
        composeSetMaxSize(decl: { value: number; unit: string } | null): void {
            this._maxDecl = decl;
        }

        /** 组合面：边线交互元素 hover 桥接显形（splitter 分隔条 hover 桥接专用） */
        composeSetEdgeHover(on: boolean): void {
            this._trigger?.toggleAttribute("data-edge-hover", on);
        }

        /**
         * 组合面：收起方向变更（splitter 换轴重排）——清滑出痕迹（四向负 margin/transform，
         * 旧轴 inline 尺寸由组合方先行清理）后按当前态重应用终态。
         */
        composeSetDirection(dir: ExpandableDirection): void {
            if (this._destroyed || this._driver == null || dir === this._dir) return;
            for (const p of ["margin-left", "margin-right", "margin-top", "margin-bottom"]) {
                this.el.style.removeProperty(p);
            }
            this.el.style.removeProperty("transform");
            this._dir = dir;
            this.el.setAttribute("data-direction", dir);
            this._trigger?.setAttribute("data-direction", dir);
            this._applyExpanded(this._expanded, false);
        }

        override created(): void {
            // 选项成员表达式管道（pos 坐标可表达式化；热应用见 _onOptionExprChange）
            this._watchOptionExprs();
            this._readOptions();
            this._readEnableResize();
            if (this._dead) return;
            if (this._driver) {
                this._expanded = this._driver.get(); // 组合形态：初值由驱动器提供（旁路值绑定）
            } else if (this._enable) {
                this._setupValue();
            }
        }

        /**
         * enable / resize 选项（ADR-0072）：`enable: false` 关闭折叠功能（不建把手、值绑定
         * 不订阅——退化为 resize 壳）；`resize`（boolean | 对象，修饰符 `.resize` 同效）启用
         **单边调节**——方向 = 活动边法线自动推导，`handles`/`aspectRatio` 子键不适用
         * warn 忽略；双关 → warn + 指令完全不作为。
         */
        private _readEnableResize(): void {
            if (this.getOption("enable") === false) this._enable = false;
            const raw = this.getOption("resize");
            if (raw === true) {
                this._resizeOn = true;
            } else if (raw != null && typeof raw === "object") {
                this._resizeOn = true;
                if ("handles" in raw || "aspectRatio" in raw) {
                    this.warn(
                        `x-expandable: resize 的 handles/aspectRatio 子键不适用于单边语义（方向由折叠方向自动推导），已忽略`,
                    );
                }
                const { handles: _h, aspectRatio: _a, ...rest } = raw as Record<string, any>;
                this._resizeOpts = rest;
            } else if (raw != null && raw !== false && raw !== "") {
                this.warn(`x-expandable: resize 值须为 true/false 或选项对象，已忽略`);
            }
            if (!this._enable && !this._resizeOn) {
                this.warn(
                    `x-expandable: enable 与 resize 均未启用，指令不作为（请至少启用其一或移除指令）`,
                );
                this._dead = true;
            }
        }

        override compile(): void {
            if (this._dead) return;
            // 宿主身份（退化态也保留：resize 手柄定位 CSS 按 data-direction 分派）
            this.el.classList.add("autospark-expandable");
            this.el.setAttribute("data-direction", this._dir);
            // 内建 resize 标记：样式表据此把把手抬到手柄之上（同一活动边线两层交互元素同宿主，
            // ADR-0072 修订）——手柄 z10 全长带会盖住 z5 把手，折叠不可点
            if (this._resizeOn) this.el.setAttribute("data-resize", "");
            if (this._enable) {
                // 渐变遮盖（fadeSize>0）：启用标记 + 厚度变量（JS 写值 CSS 消费，无布局测量）
                if (this._fadeDecl && this._fadeDecl.value > 0) {
                    this.el.setAttribute("data-fade", "");
                    this.el.style.setProperty("--as-fade-size", this._formatCss(this._fadeDecl));
                }
                this._buildTrigger();
                // 初始展开 + maxSize 有值：写 inline 展开尺寸（无布局依赖，编译期即可）
                if (this._expanded && this._maxDecl) {
                    this.el.style[this._sizeProp as "width"] = this._formatCss(this._maxDecl);
                    this._ownSizeProp = true;
                }
            }
            // 初始折叠：margin 通道的滑出距离与父容器检测依赖布局测量，推迟到编译后微任务
            // （x-resizable 先例——元素挂载后执行；slide 通道 transform % 相对自身本可编译期写，
            //  统一走微任务保持路径单一）。无动画（splitter「初始折叠不派发事件」惯例）。
            // 同微任务补把手/手柄定位上下文：宿主 computed position 为 static 才 inline 补
            // relative（fixed/absolute 宿主不动——slide 通道的目标覆盖形态）。
            Promise.resolve().then(() => {
                if (this._destroyed) return;
                this._ensurePositionContext();
                if (this._enable) {
                    this._warnHostOverflow();
                    if (!this._expanded) {
                        this._applyExpanded(false, false);
                    }
                    this._initialized = true;
                }
            });
            if (this._resizeOn) this._setupResize();
        }

        override destroy(): void {
            this._destroyed = true;
            if (this._animTimer != null) {
                clearTimeout(this._animTimer);
                this._animTimer = null;
            }
            this._resizeSession?.destroy();
            this._resizeSession = null;
            this._releaseParentInjection();
            this._edge?.remove();
            this._edge = null;
            this._trigger?.remove();
            this._trigger = null;
        }

        /** 选项成员表达式热应用：pos 坐标 / offset 偏移变化即重定位把手（splitter collapsible 同款） */
        protected override _onOptionExprChange(key: string, _value: any): void {
            if (key === "pos" || key === "offset") this._positionTrigger();
        }

        // ── 配置读取 ──────────────────────────────────────────────────────

        /** direction / collapse / maxSize / minSize 静态读取（非法值 warn 回退默认） */
        private _readOptions(): void {
            const rawDir = this.getOption("direction");
            if (rawDir != null && rawDir !== "") {
                const v = typeof rawDir === "string" ? (rawDir.trim() as ExpandableDirection) : (null as any);
                if (typeof rawDir === "string" && DIRECTIONS.includes(v)) {
                    this._dir = v;
                } else {
                    this.warn(
                        `x-expandable: direction 值 "${rawDir}" 无效（left/right/top/bottom），已回退 left`,
                    );
                }
            }
            const rawMode = this.getOption("collapse");
            if (rawMode != null && rawMode !== "") {
                if (rawMode === "slide" || rawMode === "margin") {
                    this._mode = rawMode;
                } else {
                    this.warn(`x-expandable: collapse 值 "${rawMode}" 无效（margin/slide），已回退 margin`);
                }
            }
            const rawVis = this.getOption("showTrigger");
            if (rawVis != null && rawVis !== "") {
                if (rawVis === "hover" || rawVis === "always") {
                    this._showTrigger = rawVis;
                } else {
                    this.warn(
                        `x-expandable: showTrigger 值 "${rawVis}" 无效（hover/always），已回退 hover`,
                    );
                }
            }
            for (const [key, setter] of [
                ["maxSize", (d: any) => (this._maxDecl = d)],
                ["minSize", (d: any) => (this._minDecl = d)],
                ["fadeSize", (d: any) => (this._fadeDecl = d)],
            ] as const) {
                const raw = this.getOption(key);
                if (raw == null || raw === "") continue;
                const d = this._parseLength(raw);
                if (d == null) {
                    this.warn(
                        `x-expandable: ${key} 值 "${raw}" 无法解析为 CSS 长度（支持 px/%/rem/em/vw/vh），已忽略`,
                    );
                } else setter(d);
            }
            const rawOffset = this.getOption("offset");
            if (rawOffset != null && rawOffset !== "") {
                const o = this._parseOffset(rawOffset);
                if (o == null) {
                    this.warn(
                        `x-expandable: offset 值 "${rawOffset}" 无法解析为偏移长度（number px/CSS 长度/calc() 表达式），已忽略`,
                    );
                } else if (o !== "0px") {
                    this._offsetCss = o;
                }
            }
        }

        /**
         * offset 解析（**固定轴语义**：+ = 把手跨轴的正方向——left/right 方向 = 向右、
         * top/bottom 方向 = 向下；负值反向）：number = px；string = CSS 长度（负值合法）
         * 或 `calc()`/`var()` 表达式原样透传（splitter 注入分隔条宽度补偿的载体）；非法 null。
         */
        private _parseOffset(raw: unknown): string | null {
            if (typeof raw === "number") return Number.isFinite(raw) ? `${raw}px` : null;
            if (typeof raw !== "string") return null;
            const s = raw.trim();
            if (s === "") return null;
            const d = this._parseLength(s);
            if (d) return this._formatCss(d);
            if (/^(calc|var)\(/i.test(s) && /^[\w\s\-+*/().,%]*$/.test(s)) return s;
            return null;
        }

        /** CSS 长度解析（number=px；非法 null）——splitter parseLength 同款 */
        private _parseLength(raw: unknown): { value: number; unit: string } | null {
            if (typeof raw === "number") {
                return Number.isFinite(raw) ? { value: raw, unit: "px" } : null;
            }
            if (typeof raw !== "string") return null;
            const m = /^(-?(?:\d+(?:\.\d+)?))\s*(px|%|rem|em|vw|vh)?$/i.exec(raw.trim());
            if (!m) return null;
            const value = parseFloat(m[1]!);
            return Number.isFinite(value) ? { value, unit: (m[2] ?? "px").toLowerCase() } : null;
        }

        /** CSS 值形态（写 inline）：px 整数、其余两位小数 */
        private _formatCss(d: { value: number; unit: string }): string {
            return d.unit === "px"
                ? `${Math.round(d.value)}px`
                : `${Math.round(d.value * 100) / 100}${d.unit}`;
        }

        // ── 值绑定 ────────────────────────────────────────────────────────

        /** 值解析：空 warn 不作为 / 字面量恒态 / 简单路径双向 / 表达式只读降级 */
        private _setupValue(): void {
            const raw = String(this.value ?? "").trim();
            if (raw === "") {
                this.warn(`x-expandable: 值须为展开状态路径或表达式（如 x-expandable="ui.open"），指令未生效`);
                this._dead = true;
                return;
            }
            // 字面量：裸或引号包裹的 true/false（恒定态，点击 no-op）
            const quoted = /^(['"])(.*)\1$/.exec(raw);
            const lit = quoted?.[2] ?? raw;
            if (lit === "true" || lit === "false") {
                this._expanded = lit === "true";
                return;
            }
            if (!isSimpleStatePath(raw) && !this._warnedReadonly) {
                this._warnedReadonly = true;
                this.warn(
                    `x-expandable: 值 "${raw}" 非简单状态路径，退化为只读（状态→DOM 照常；点击把手不回写）`,
                );
            } else if (isSimpleStatePath(raw)) {
                this._expandedPath = raw;
            }
            const initial = this.binding.watch(raw, ({ value }) => this._applyFromState(value));
            this._expanded = !!initial;
        }

        /** 外部状态 → DOM（watcher 回调）：等值短路（防循环——点击回写触发的回流在此被吸收） */
        private _applyFromState(value: any): void {
            if (this._destroyed || value == null) return;
            const expanded = !!value;
            if (expanded === this._expanded) return; // 等值短路
            this._applyExpanded(expanded, true);
        }

        /** 把手点击：组合形态翻转仲裁权在组合方；模板形态仅双向路径回写（字面量/只读降级 no-op） */
        private _toggle(): void {
            if (this._destroyed) return;
            if (this._driver) {
                this._driver.set(!this._expanded);
                return;
            }
            if (this._expandedPath == null) return;
            try {
                setVal(
                    this.engine.store.state,
                    this._expandedPath.split(this.engine.store.delimiter),
                    !this._expanded,
                );
            } catch (e: any) {
                this.warn(`x-expandable: 状态写回失败（"${this._expandedPath}"）: ${e?.message ?? e}`);
            }
        }

        /**
         * 把手 absolute 定位上下文保障：宿主 computed position 为 static 时 inline 补
         * `position:relative`（微任务挂载后检测——detached 元素 computed 不可靠）。fixed /
         * absolute / 用户显式定位**不动**（slide 通道的目标覆盖形态是 fixed 宿主，CSS 强写
         * relative 会把它覆盖掉）。
         */
        private _ensurePositionContext(): void {
            const el = this.el;
            if (typeof getComputedStyle !== "function") return;
            const pos = getComputedStyle(el).position;
            // 空串视同 static（happy-dom 对未声明属性返回空串；默认值本就是 static）——
            // fixed/absolute/sticky 宿主已是定位上下文，不动（slide 通道目标形态）
            if (pos === "static" || pos === "") {
                el.style.position = "relative";
            }
        }

        /**
         * 宿主 overflow 检测（编译后微任务、warn 一次）：hidden/clip 会裁掉骑边把手突出的
         * 外半圆，auto/scroll 会把把手随内容滚走（把手是唯一重开触点）——overflow 需求
         * （裁溢出 / 内部滚动）应由**内层包裹**承载，宿主保持 visible。正向枚举而非
         * `!== "visible"`：happy-dom 对未声明属性返回空串，负向判定会误报。
         */
        private _warnHostOverflow(): void {
            if (this._warnedHostOverflow || typeof getComputedStyle !== "function") return;
            const cs = getComputedStyle(this.el);
            const clipped = [cs.overflow, cs.overflowX, cs.overflowY].some(
                (v) => v === "hidden" || v === "clip" || v === "auto" || v === "scroll",
            );
            if (!clipped) return;
            this._warnedHostOverflow = true;
            this.warn(
                `x-expandable: 宿主声明了 overflow "${cs.overflow}"——会裁掉骑边把手突出的外半圆或把把手随内容滚走（把手是唯一重开触点）；overflow 需求请由内层包裹承载（子内容包一层声明 overflow，宿主保持 visible）`,
            );
        }

    /** 手柄桥接接线落点：**同元素**边线交互元素只有内建单边 resize 手柄一种（x-resizable 已随
         *  ADR-0072 互斥移除），由 `_bridgeHandleHover` 在装配期接线；跨元素桥接（splitter
         *  分隔条 / drawer 面板手柄）仍在消费方各自接线。 */

        // ── 把手 ──────────────────────────────────────────────────────────

        /** 构建把手（共享把手模块统一构建——元素/箭头/键盘管线唯一实现；点击行为本指令接线） */
        private _buildTrigger(): void {
            const trigger = createCollapseTrigger({
                direction: this._dir,
                onActivate: () => this._toggle(),
            });
            this._trigger = trigger;
            // 感应边条：createElement 注入不在模板树、天然不被编译（把手同款）；必须置于
            // 把手**之前**（兄弟选择器 .edge:hover ~ .trigger 显形的前提）。
            // showTrigger:'hover' 时覆盖整条活动边线——pos 自定义把手位置后不可预知，
            // 鼠标移到边线任何位置都应显形把手
            const edge = document.createElement("div");
            edge.className = "autospark-expandable-edge";
            edge.setAttribute("aria-hidden", "true");
            this._edge = edge;
            this.el.appendChild(edge);
            this.el.appendChild(trigger);
            this._positionTrigger();
        }

        /** 把手定位：inline 只写坐标变量 --as-pos/--as-offset + data-pos-negative（定位/钳制/偏移归样式表两态规则） */
        private _positionTrigger(): void {
            const t = this._trigger;
            if (!t) return;
            t.setAttribute("data-direction", this._dir);
            // 显隐策略挂宿主级（感应边条与把手两处消费；折叠态常驻走把手自身 data-collapsed，
            // 不依赖本属性——reparent 后宿主级规则不命中无碍）
            this.el.setAttribute("data-show-trigger", this._showTrigger);
            const pos = this._parsePos();
            t.style.setProperty("--as-pos", pos.value);
            t.toggleAttribute("data-pos-negative", pos.negative);
            // offset 附加偏移（变量随身——reparent 后仍生效；未配置摘除回退 0px 默认）
            if (this._offsetCss) t.style.setProperty("--as-offset", this._offsetCss);
            else t.style.removeProperty("--as-offset");
            t.toggleAttribute("data-collapsed", !this._expanded);
        }

        /**
         * pos 坐标解析（边缘锚定模型，共享模块 parseRailCoord——drawer 等消费方同源）：
         * 非法 warn 回退居中（消息文案属本指令语境）。
         */
        private _parsePos(): { value: string; negative: boolean } {
            const raw = this.getOption("pos");
            const parsed = parseRailCoord(raw);
            if (!parsed) {
                this.warn(
                    `x-expandable: pos 值 "${raw}" 无法解析为坐标（center/数字 px/CSS 长度串），已按居中处理`,
                );
                return { value: "50%", negative: false };
            }
            return parsed;
        }

        // ── 折叠/展开应用（核心） ─────────────────────────────────────────

        /** 主轴尺寸属性：left/right → width、top/bottom → height */
        private get _sizeProp(): "width" | "height" {
            return this._dir === "top" || this._dir === "bottom" ? "height" : "width";
        }

        /** 滑出负 margin 属性（按收起方向分派：向哪边收起抵消哪边占位） */
        private get _marginProp(): "margin-left" | "margin-right" | "margin-top" | "margin-bottom" {
            return MARGIN_PROPS[this._dir] as any;
        }

        /** 是否滑出折叠形态（minSize 未声明或 ≤0） */
        private _isSlideCollapse(): boolean {
            return this._minDecl == null || this._minDecl.value <= 0;
        }

        /** 滑出距离：主轴 inline 数值优先（亚像素精确、无布局环境可用），布局 rect 兜底 */
        private _readExtent(): number {
            const prop = this._sizeProp;
            const inline = parseFloat(this.el.style[prop]);
            if (Number.isFinite(inline) && inline > 0) return inline;
            const rect = this.el.getBoundingClientRect();
            return rect[prop] || 0;
        }

        /** 应用展开/折叠终态（决策四双通道 + 决策六 reparent + 决策七注入 + 决策八事件） */
        private _applyExpanded(expanded: boolean, animate: boolean): void {
            const el = this.el;
            const from = this._expanded;
            const slideHide = !expanded && this._isSlideCollapse();
            this._expanded = expanded;
            // 宿主 data-collapsed 仅滑出折叠挂（子内容隐藏钩子）；data-shrunk 仅收缩折叠挂
            // （fadeSize 遮盖的显示判据 + 页面 CSS 感知收缩态的通用钩子——此前缺失）。
            // 把手 data-collapsed 独立挂（箭头翻转，minSize>0 折叠也翻转）——两处分离，splitter 先例
            el.toggleAttribute("data-collapsed", slideHide);
            el.toggleAttribute("data-shrunk", !expanded && !slideHide);
            this._trigger?.toggleAttribute("data-collapsed", !expanded);
            // 半圆形态判据（共享把手视觉）：仅滑出折叠挂——minSize>0 收缩折叠全圆不挂
            // （图标不缩放不平移，只翻转指向）；reparent 后属性随身生效
            this._trigger?.toggleAttribute("data-half", slideHide);

            if (expanded) {
                // 展开：清滑出痕迹 + 恢复尺寸（maxSize 有值写 inline、缺省移除**本指令写过的**
                // inline 让 CSS 决定——不快照；用户模板自带 inline 不动）
                this._clearSlide();
                if (this._maxDecl) {
                    el.style[this._sizeProp] = this._formatCss(this._maxDecl) as any;
                    this._ownSizeProp = true;
                } else if (this._ownSizeProp) {
                    el.style.removeProperty(this._sizeProp);
                    this._ownSizeProp = false;
                }
                // 把手迁回宿主须在**动画启动前**（ADR-0069 决策六——此刻宿主活动边在停靠边，位置连续）
                this._undockTrigger();
            } else if (slideHide) {
                // 折叠 = 滑出（minSize=0）：尺寸保持不改，终态持续保持
                this._dockParent();
                if (this._mode === "slide") {
                    el.style.removeProperty(this._marginProp);
                    el.style.transform = SLIDE_TRANSFORMS[this._dir];
                } else {
                    el.style.removeProperty("transform");
                    el.style[this._marginProp] = `-${this._readExtent()}px` as any;
                }
            } else {
                // 折叠 = 尺寸收缩（minSize>0）：纯尺寸动画，无滑出无隐藏，把手不迁移
                this._clearSlide();
                el.style[this._sizeProp] = this._formatCss(this._minDecl!) as any;
                this._ownSizeProp = true;
            }

            // 态翻转：动画（滑出折叠的把手 reparent 在动画完成后）；初始应用（from === expanded
            // ——created 已把 _expanded 同步为初值）无动画、直接迁移（_dockTrigger 幂等，重复
            // 折叠调用不重复移动）
            if (from !== expanded) {
                if (animate) {
                    if (slideHide) this._playAnimation(() => this._dockTrigger());
                    else this._playAnimation();
                } else if (slideHide) {
                    this._dockTrigger();
                }
                // 翻转事件（初始应用不派发——事件只反馈变更）
                if (this._initialized) {
                    el.dispatchEvent(
                        new CustomEvent(expanded ? "expandable:expand" : "expandable:collapse", {
                            detail: { size: this._detailSize(expanded) },
                            bubbles: true,
                        }),
                    );
                }
            } else if (slideHide) {
                this._dockTrigger();
            }
        }

        /** 清滑出痕迹（负 margin / transform / 父容器注入释放） */
        private _clearSlide(): void {
            this.el.style.removeProperty(this._marginProp);
            this.el.style.removeProperty("transform");
            this._releaseParentInjection();
        }

        /** 事件 detail.size：展开 = maxSize 格式化值或 null（无约束）；折叠 = 0 或 minSize */
        private _detailSize(expanded: boolean): number | string | null {
            if (expanded) return this._maxDecl ? this._formatCss(this._maxDecl) : null;
            return this._minDecl && this._minDecl.value > 0 ? this._formatCss(this._minDecl) : 0;
        }

        /** 挂动画属性（data-animating → CSS transition），transitionend/兜底超时摘除 + 完成回调 */
        private _playAnimation(onDone?: () => void): void {
            if (this._animTimer != null) clearTimeout(this._animTimer);
            this.el.setAttribute("data-animating", "");
            const done = () => {
                this.el.removeAttribute("data-animating");
                if (this._animTimer != null) {
                    clearTimeout(this._animTimer);
                    this._animTimer = null;
                }
                onDone?.();
            };
            this.el.addEventListener("transitionend", done, { once: true });
            // transitionend 不触发的环境（无布局/happy-dom/被禁用）兜底摘除——600ms 后仍执行 reparent
            this._animTimer = setTimeout(done, 600);
        }

        // ── 内建单边 resize（ADR-0072）────────────────────────────────────

        /**
         * 单边 resize 装配（复用 x-resizable 的 ResizeSession 核心——overlay 家族同款复用面）：
         * 方向 = 活动边法线自动推导（left → e / right → w / top → s / bottom → n），手柄骑
         * 活动边线。本指令独占边线交互（同元素 x-resizable 已被互斥），把手/手柄/边条无跨指令
         * 抢夺。约束经 resolveResizeConstraints 透传（min/max/snap；handles/aspectRatio 已在
         * 选项读取时剥离）。手柄与把手同骑边线时的两层协调：把手压手柄之上（宿主 data-resize
         * → 样式表抬 z，命中与视觉都不被调节线拦），手柄 hover 桥接触发显形把手。
         */
        private _setupResize(): void {
            const dir: ResizeDirection =
                this._dir === "left"
                    ? "e"
                    : this._dir === "right"
                      ? "w"
                      : this._dir === "top"
                        ? "s"
                        : "n";
            this._resizeSession = new ResizeSession({
                target: this.el,
                eventTarget: this._eventTarget ?? this.el,
                handles: [dir],
                constraints: () =>
                    resolveResizeConstraints(this._resizeOpts, this.el, (m) => this.warn(m)),
                apply: (width, height) => this._applyResized(width, height),
                warn: (m) => this.warn(m),
            });
            this._resizeSession.attach();
            this._bridgeHandleHover();
        }

        /**
         * 手柄 → 把手 hover 桥接（`data-edge-hover` 统一契约，splitter 分隔条 / drawer 面板
         * 手柄同款）：感应边条（z4）被手柄带（z10 全长）完全盖住收不到 hover，hover 模式
         * 「鼠标移到边线任何位置把手即淡入」须由手柄转译——否则启用 resize 后把手只剩命中
         * （不可见但可点）一条退路。enable:false 退化形态无把手，直接跳过。
         * 监听器随手柄/把手同生命周期消亡，无需显式解绑（与 drawer 面板手柄桥接同款）。
         */
        private _bridgeHandleHover(): void {
            const t = this._trigger;
            if (!t) return;
            const set = (on: boolean) => t.toggleAttribute("data-edge-hover", on);
            for (const h of this.el.querySelectorAll<HTMLElement>("[data-autospark-resize-handle]")) {
                h.addEventListener("mouseenter", () => set(true));
                h.addEventListener("mouseleave", () => set(false));
                h.addEventListener("focus", () => set(true));
                h.addEventListener("blur", () => set(false));
            }
        }

        /** resize 写路径：直写主轴 inline 尺寸 + **接管 maxSize**（Q4=A：拖出值成为展开尺寸
         *  真相——折叠/展开/detail.size 全走既有 maxSize 管线，零新增状态）；组合形态经
         *  driver.resized 路由（splitter 同步尺寸簿记 / drawer 记会话记忆） */
        private _applyResized(width: number, height: number): void {
            const v = Math.round(this._sizeProp === "width" ? width : height);
            this.el.style[this._sizeProp] = `${v}px`;
            const decl = { value: v, unit: "px" };
            this._maxDecl = decl;
            this._ownSizeProp = true;
            this._driver?.resized?.(decl);
        }

        // ── 父容器注入（决策七） ──────────────────────────────────────────

        /** injectOverflow 默认 true（显式 false 才禁用） */
        private _shouldInjectOverflow(): boolean {
            return this.getOption("injectOverflow") !== false;
        }

        /** 父容器 computed overflow 是否已裁剪（hidden/clip 任一轴） */
        private _parentClips(parent: HTMLElement): boolean {
            if (typeof getComputedStyle !== "function") return false;
            const cs = getComputedStyle(parent);
            return [cs.overflow, cs.overflowX, cs.overflowY].some((v) => v === "hidden" || v === "clip");
        }

        /** 折叠期间注入：dock（定位上下文，恒挂）+ clip（overflow，注入通道开启且父容器未裁剪时挂） */
        private _dockParent(): void {
            if (this._injected) return; // 幂等（本实例）
            const parent = this.el.parentElement;
            if (!parent) return;
            dockCounts.set(parent, (dockCounts.get(parent) ?? 0) + 1);
            parent.setAttribute("data-autospark-expandable-dock", "");
            if (this._shouldInjectOverflow()) {
                if (!this._parentClips(parent)) {
                    parent.setAttribute("data-autospark-expandable-clip", "");
                }
            } else if (!this._warnedOverflow && !this._parentClips(parent)) {
                // 禁用注入回落检测（决策七）：warn 一次、用户自负
                this._warnedOverflow = true;
                this.warn(
                    `x-expandable: injectOverflow 已禁用且父容器 overflow 非 hidden/clip——滑出折叠过程宿主将溢出父容器可见，请自行处理裁剪`,
                );
            }
            this._injected = true;
        }

        /** 展开完成后释放（引用计数归零才摘属性——多实例共享父容器） */
        private _releaseParentInjection(): void {
            if (!this._injected) return;
            this._injected = false;
            const parent = this.el.parentElement;
            if (!parent) return;
            const n = (dockCounts.get(parent) ?? 1) - 1;
            if (n <= 0) {
                dockCounts.delete(parent);
                parent.removeAttribute("data-autospark-expandable-dock");
                parent.removeAttribute("data-autospark-expandable-clip");
            } else {
                dockCounts.set(parent, n);
            }
        }

        // ── 把手 reparent（决策六：展开态宿主内 / 滑出折叠终态父容器内） ──

        /** 把手移入父容器（折叠滑出完成后；CSS 折叠态规则接管定位，零 JS 测量） */
        private _dockTrigger(): void {
            const t = this._trigger;
            const parent = this.el.parentElement;
            if (!t || !parent || this._destroyed) return;
            if (t.parentElement !== parent) parent.appendChild(t);
            this._docked = true;
        }

        /** 把手移回宿主（展开动画启动前；清 inline 无需——两态定位全在样式表） */
        private _undockTrigger(): void {
            const t = this._trigger;
            if (!t || !this._docked) return;
            this.el.appendChild(t);
            this._docked = false;
        }
    }

    /* ══════════ SplitterDirective（engine x-splitter.ts） ══════════ */
    class SplitterDirective extends Base {
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
                    // 表达式只读降级（对齐 x-model/x-resizable 先例）
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

    /* ══════════ LayoutDirective（engine x-layout.ts） ══════════ */
    class LayoutDirective extends Base {
        static override readonly priority = 0;
        static override readonly singleton = true;

        /** 结构指令：接管子树（收集窗格、剪枝非窗格、自行编译——grid item 不经通用 walk） */
        static override ownsChildren(_info: AutoDirectiveInfo): boolean {
            return true;
        }

        /** 类级初始化：注入全局样式（幂等） */
        static override initialize(_engine: AutoSpark): void {
            registerLayoutStyles();
        }

        // ── 编译期收集态 ──────────────────────────────────────────────────

        /** 窗格声明（词表内、未被剪枝者；与 _present/_paneEls 按索引对齐） */
        private _panes: PaneDecl[] = [];
        /** 各窗格存在性（created 订阅初值 + 回调维护；剔除 = false） */
        private _present: boolean[] = [];
        /** 窗格编译产物（compile 期填充；被 eager x-if 移除后保留死引用无碍——absent 已挂） */
        private _paneEls: (HTMLElement | null)[] = [];
        /** 侧容器（该侧 ≥2 窗格时创建；gridArea = 侧名） */
        private _sideContainers: Partial<Record<"left" | "right", HTMLElement>> = {};
        /** 宿主 gap（x-layout-options.gap；null = 0） */
        private _gap: string | null = null;
        /** 降级标记：content 缺失（grid 照用、content 位 `.` 空洞） */
        private _degraded = false;

        // ── 行为组合态（决策六，compose 注入）──────────────────────────────

        /** sidebar 的 expandable 组合实例（与 _panes 按索引对齐；null = 非侧栏/显式/opt-out） */
        private _composeInsts: (ExpandableDirective | null)[] = [];
        /** 各 sidebar 折叠态镜像（driver.get 判据 + 联动翻转检测） */
        private _collapsedSide: boolean[] = [];
        /** 各 sidebar 折叠前尺寸记忆（px；恢复链 lastSize → 声明宽 → 240 兜底） */
        private _lastSizes: (number | null)[] = [];
        /** resize 事件监听（destroy 移除） */
        private _onResizeMove = (ev: Event): void => this._onPaneResize(ev, false);
        private _onResizeEnd = (ev: Event): void => this._onPaneResize(ev, true);

        // ── 生命周期 ──────────────────────────────────────────────────────

        override created(): void {
            this._gap = this._readGap();
            this._collectPanes();
            this._setupPresence();
        }

        override compile(_context: Record<string, any>, _parent: HTMLElement): void {
            const host = this.el;
            host.classList.add("autospark-layout");
            if (this._panes.length === 0) return; // 全剪枝：空容器（收集期已 warn）
            // 语义序挂载：header → left 侧 → content → right 侧 → footer（grid 按 areas 定位，DOM 序无关）
            this._mountKind("header");
            this._mountSide("left");
            this._mountKind("content");
            this._mountSide("right");
            this._mountKind("footer");
            this._reflow();
            this._setupCompose();
            // resize ↔ 折叠联动监听（resize:* 宿主派发冒泡，ADR-0064 事件契约）
            this.el.addEventListener("resize:move", this._onResizeMove);
            this.el.addEventListener("resize:end", this._onResizeEnd);
        }

        override destroy(): void {
            this.el.removeEventListener("resize:move", this._onResizeMove);
            this.el.removeEventListener("resize:end", this._onResizeEnd);
            for (const inst of this._composeInsts) inst?.destroy();
            this._composeInsts = [];
            this._panes = [];
            this._present = [];
            this._paneEls = [];
            this._sideContainers = {};
        }

        // ── 窗格收集（created 期，模板只读）────────────────────────────────

        /**
         * 扫描宿主模板直接子元素：只认 x-pane 标记的窗格；非窗格渲染子元素 warn + 剪枝；
         * 词表外参数 / 非法修饰符 warn + 剪枝；header/content/footer 重复声明 warn + 后者剪枝。
         * 窗格快照克隆（模板只读契约），x-pane 家族属性在**克隆**上剥除（防窗格子树编译时
         * PaneDirective 空转）；x-if / x-show 属性原样保留（存在性语义归 If/ShowDirective，
         * Q14b 不接管承诺）。
         */
        private _collectPanes(): void {
            const tpl = this.template;
            if (!tpl) return;
            const seen: Partial<Record<PaneKind, true>> = {};
            const sideDecls: Partial<Record<"left" | "right", PaneDecl[]>> = {};
            for (const child of Array.from(tpl.children)) {
                if (child instanceof HTMLTemplateElement || child instanceof HTMLScriptElement)
                    continue;
                const el = child as HTMLElement;
                const parsed = this._parsePaneDecl(el);
                if (parsed.type === "prune") continue; // warn 已发
                const decl = parsed.decl;
                if (decl.kind === "sidebar") {
                    // 侧栏：through 资格 = DOM 首个（非首个声明 warn + 忽略，Q2/决策三）；
                    // 资格在收集期定死（DOM 序），应用期首个 present 者携带已定资格
                    const list = (sideDecls[decl.side!] ??= []);
                    if ((decl.throughUp || decl.throughDown) && list.length > 0) {
                        this.warn(
                            `x-layout: 同侧第 ${list.length + 1} 个 sidebar 窗格上的 through 声明被忽略（仅 DOM 首个 sidebar 支持 through，ADR-0074 决策三）`,
                        );
                        decl.throughUp = false;
                        decl.throughDown = false;
                    }
                    list.push(decl);
                } else {
                    if (seen[decl.kind]) {
                        this.warn(
                            `x-layout: 重复的 x-pane:${decl.kind} 声明被剪枝（该布局单元仅允许一个）`,
                        );
                        continue;
                    }
                    seen[decl.kind] = true;
                }
                this._panes.push(decl);
                this._present.push(true);
            }
            // content 必需（缺失 warn + 降级：grid 照建、content 位空洞，ADR-0074 决策三）
            if (!this._panes.some((p) => p.kind === "content")) {
                this._degraded = true;
                this.warn(
                    "x-layout: 缺少必需的 x-pane:content 布局单元，已降级渲染（容器照建、中心区空缺）",
                );
            }
            if (this._panes.length === 0) {
                this.warn("x-layout: 未发现任何 x-pane 布局窗格，宿主将渲染为空容器");
            }
            // 侧分组后置处理（决策七 + 决策六的分界）：
            // - 同侧 ≥2 → grouped（窗格转面板语义：宽度声明改走 data-size、跳过默认行为注入——
            //   分隔条即调节通道，expandable 折叠由窗格显式 data-expandable 走 splitter 通道）
            // - 单窗格侧 → 默认注入 x-resizable（编译期模板改写，克隆补 `x-resizable.<向>` 修饰符属性，
            //   子树编译自然实例化 ResizableDirective——无值 = 纯 DOM 直改宽度，Q18-C 内部态；
            //   显式声明与 opt-out 均不补。内缘单方向：left 拖东缘（e）/ right 拖西缘（w）——
            //   w 依赖 x-resizable 的 grid item 感知（父容器 display:grid 时豁免流内降级且免位置补偿）
            for (const list of Object.values(sideDecls)) {
                if (!list?.length) continue;
                if (list.length >= 2) {
                    for (const d of list) d.grouped = true;
                } else {
                    const d = list[0]!;
                    if (!d.resizeExplicit && !d.resizeOptOut) {
                        d.template.setAttribute(`x-resizable.${d.side === "right" ? "w" : "e"}`, "");
                        d.resizeInjected = true;
                    }
                }
            }
        }

        /**
         * 解析单个子元素的 x-pane 声明。返回 pane（合法窗格，快照已剥 x-pane 家族属性）或
         * prune（非窗格 / 非法声明，warn 已发）。
         */
        private _parsePaneDecl(el: HTMLElement): PaneParseResult {
            // 定位 x-pane 主属性与 options 附属属性（DOM 属性名恒小写，冒号/句点保留）
            let main: { attr: string; modifiers: string[] } | null = null;
            let optionsRaw: string | null = null;
            const strip: string[] = [];
            for (const attr of Array.from(el.attributes)) {
                const name = attr.name;
                if (name === "x-pane" || name.startsWith("x-pane:")) {
                    if (main) {
                        this.warn(`x-layout: 重复的 x-pane 主声明（"${name}"）被忽略，取首个`);
                        strip.push(name);
                        continue;
                    }
                    const rest = name.slice("x-pane".length + 1);
                    const [attr, ...modifiers] = rest.split(".");
                    main = { attr: attr ?? "", modifiers: modifiers.filter((m) => m.length > 0) };
                } else if (name === "x-pane-options") {
                    optionsRaw = attr.value;
                    strip.push(name);
                } else if (name.startsWith("x-pane-options.")) {
                    // 成员表达式形态不支持（窗格选项编译期静态，决策一）——warn + 剥除防残留
                    this.warn(
                        `x-layout: x-pane-options 成员属性形态（${name}）不支持——窗格选项为编译期静态整包声明，该属性已忽略`,
                    );
                    strip.push(name);
                }
            }
            if (!main) {
                // 非窗格：有 options 附属也无主声明，一并剪枝
                this.warn(
                    `x-layout: 非 x-pane 子元素 <${el.localName}> 已被剪枝（布局容器只认 x-pane 布局单元，ADR-0074）`,
                );
                for (const n of strip) el.removeAttribute(n);
                return { type: "prune" };
            }
            const { attr, modifiers } = main;
            const kind = attr.trim() as PaneKind;
            if (!PANE_KINDS.includes(kind)) {
                this.warn(
                    `x-layout: x-pane 参数 "${attr}" 不在布局单元词表内（header/content/sidebar/footer），该元素已剪枝`,
                );
                for (const n of strip) el.removeAttribute(n);
                return { type: "prune" };
            }

            const decl: PaneDecl = {
                kind,
                side: null,
                throughUp: false,
                throughDown: false,
                height: null,
                width: null,
                expandableOptOut: false,
                resizeOptOut: false,
                template: el.cloneNode(true) as HTMLElement,
                presenceExpr: null,
                expandableExplicit: false,
                expandableOpts: null,
                resizeExplicit: false,
            };
            // 修饰符分派：sidebar 的 .left/.right（缺省 .left，ADR-0074 决策一）+ .up/.down 简写
            if (kind === "sidebar") {
                const sideDecl = modifiers.find((m) => m === "left" || m === "right");
                decl.side = sideDecl ?? "left";
            }
            decl.throughUp = modifiers.includes("up");
            decl.throughDown = modifiers.includes("down");
            // 克隆上剥除 x-pane 家族（原模板不动；x-if/x-show 留给子树编译）
            for (const name of Array.from(decl.template.attributes).map((a) => a.name)) {
                if (
                    name === "x-pane" ||
                    name.startsWith("x-pane:") ||
                    name === "x-pane-options" ||
                    name.startsWith("x-pane-options.")
                ) {
                    decl.template.removeAttribute(name);
                }
            }
            // options 整包解析（relaxed-json；修饰符 up/down 已并入布尔，选项里同名字段让位修饰符语义一致）
            if (optionsRaw != null && optionsRaw.trim() !== "") {
                let opts: Record<string, any> | null = null;
                try {
                    const v = JSON.parse(relaxedToJson(optionsRaw));
                    if (v && typeof v === "object" && !Array.isArray(v)) opts = v;
                    else this.warn(`x-layout: x-pane-options 值 "${optionsRaw}" 须为对象，已忽略`);
                } catch {
                    this.warn(
                        `x-layout: x-pane-options 值 "${optionsRaw}" 不是合法配置（relaxed-json），已忽略`,
                    );
                }
                if (opts) this._applyPaneOptions(decl, opts);
            }
            // through 的 up/down 合法性：仅 sidebar（header/footer 上声明 warn + 忽略，决策三）
            if (kind !== "sidebar" && (decl.throughUp || decl.throughDown)) {
                this.warn(`x-layout: x-pane:${kind} 上的 through（.up/.down）仅 sidebar 支持，已忽略`);
                decl.throughUp = false;
                decl.throughDown = false;
            }
            // 存在性表达式（x-if 优先，共存 warn；属性原样保留——Q14b 不接管）
            const tpl2 = decl.template;
            const ifName = Array.from(tpl2.attributes).find(
                (a) => a.name === "x-if" || a.name.startsWith("x-if."),
            )?.name;
            const showName = Array.from(tpl2.attributes).find(
                (a) => a.name === "x-show" || a.name.startsWith("x-show."),
            )?.name;
            if (ifName) {
                decl.presenceExpr = (tpl2.getAttribute(ifName) ?? "").trim() || null;
                if (showName) {
                    this.warn("x-layout: 同一窗格同时声明 x-if 与 x-show——以 x-if 为准，x-show 已忽略");
                }
            } else if (showName) {
                decl.presenceExpr = (tpl2.getAttribute(showName) ?? "").trim() || null;
            }
            // 行为指令显式检测（M3 消费）：显式 = 指令属性在场（含修饰符形态）——**options 附属属性
            // 不算显式**（Q25b：选项与「是否显式写指令属性」解耦；单独的 x-*-options 与默认注入合并）
            const hasAttr = (base: string): boolean =>
                Array.from(tpl2.attributes).some(
                    (a) => a.name === base || a.name.startsWith(`${base}.`),
                );
            decl.expandableExplicit = hasAttr("x-expandable");
            decl.resizeExplicit = hasAttr("x-resizable");
            // 无显式 expandable 时，x-expandable-options 由 layout 收集备用（Q25b：注入实例读它），
            // 并从克隆剥除（防无主指令的 options 残留歧义）；显式时保留原样（显式路径自洽）
            if (!decl.expandableExplicit) {
                const optAttr = Array.from(tpl2.attributes).find(
                    (a) => a.name === "x-expandable-options",
                );
                if (optAttr) {
                    decl.expandableOpts = parseJsonObject(
                        optAttr.value,
                        (msg) => this.warn(msg),
                        "x-expandable-options",
                    );
                    decl.template.removeAttribute("x-expandable-options");
                }
            }
            // content 上挂 x-resizable：1fr 轨道钉死尺寸、拖拽必无效 → warn（Q24 修正案）
            if (kind === "content" && decl.resizeExplicit) {
                this.warn(
                    "x-layout: content 窗格上的 x-resizable 无效（content 轨道为 1fr，元素尺寸不可拖拽调节），该指令已忽略",
                );
                decl.resizeExplicit = false;
            }
            // 联动阈值（拖拽跨折叠目标 → 翻转折叠布尔，Q26）：minSize 声明值（px）；无 minSize = 0；
            // 非法值 warn + 从 opts 剔除（联动回落 0，expandable 也不收非法 minSize）
            decl.expandableMin =
                decl.expandableOpts?.minSize != null
                    ? parsePxNumber(decl.expandableOpts.minSize)
                    : null;
            if (decl.expandableOpts?.minSize != null && decl.expandableMin == null) {
                this.warn(
                    `x-layout: x-expandable-options.minSize 值 "${decl.expandableOpts.minSize}" 非数字/px（拖拽折叠联动阈值仅支持 px），已忽略`,
                );
                delete decl.expandableOpts.minSize;
            }
            // resize 默认注入在 _collectPanes 分组判定后进行（分割窗格不注入——分隔条即调节通道）
            return { type: "pane", decl };
        }

        /** 窗格选项应用（词汇表 {height,width,through,expandable,resize}；无效组合 warn 忽略该键） */
        private _applyPaneOptions(decl: PaneDecl, opts: Record<string, any>): void {
            for (const [key, value] of Object.entries(opts)) {
                switch (key) {
                    case "height":
                        if (decl.kind === "header" || decl.kind === "footer") {
                            decl.height = formatLength(value);
                            if (decl.height == null) {
                                this.warn(
                                    `x-layout: x-pane-options.height 值 "${value}" 无法解析为 CSS 长度，已忽略`,
                                );
                            }
                        } else {
                            this.warn(
                                `x-layout: x-pane-options.height 仅 header/footer 窗格认读，已忽略`,
                            );
                        }
                        break;
                    case "width":
                        if (decl.kind === "sidebar") {
                            decl.width = formatLength(value);
                            if (decl.width == null) {
                                this.warn(
                                    `x-layout: x-pane-options.width 值 "${value}" 无法解析为 CSS 长度，已忽略`,
                                );
                            }
                        } else {
                            this.warn(`x-layout: x-pane-options.width 仅 sidebar 窗格认读，已忽略`);
                        }
                        break;
                    case "through": {
                        if (decl.kind !== "sidebar") {
                            this.warn(`x-layout: x-pane-options.through 仅 sidebar 支持，已忽略`);
                            break;
                        }
                        const parts = String(value ?? "")
                            .split(/[,\s]+/)
                            .filter((s) => s !== "");
                        for (const p of parts) {
                            if (p === "up") decl.throughUp = true;
                            else if (p === "down") decl.throughDown = true;
                            else this.warn(`x-layout: through 值 "${p}" 非法（仅 up / down），已忽略`);
                        }
                        break;
                    }
                    case "expandable":
                        if (decl.kind !== "sidebar") {
                            this.warn(
                                `x-layout: x-pane-options.expandable 仅 sidebar 有默认注入可关，已忽略`,
                            );
                            break;
                        }
                        if (value === false) decl.expandableOptOut = true;
                        else if (value !== true) {
                            this.warn(
                                `x-layout: x-pane-options.expandable 仅支持布尔（状态绑定请显式写 x-expandable="路径"），已忽略`,
                            );
                        }
                        break;
                    case "resize":
                        if (decl.kind !== "sidebar") {
                            this.warn(
                                `x-layout: x-pane-options.resize 仅 sidebar 有默认注入可关，已忽略`,
                            );
                            break;
                        }
                        if (value === false) decl.resizeOptOut = true;
                        else if (value !== true) {
                            this.warn(`x-layout: x-pane-options.resize 仅支持布尔，已忽略`);
                        }
                        break;
                    default:
                        this.warn(
                            `x-layout: x-pane-options 的未知键 "${key}" 已忽略（词汇表：height/width/through/expandable/resize）`,
                        );
                }
            }
        }

        // ── 存在性订阅与回流（决策四）─────────────────────────────────────

        /** created 期订阅各窗格存在性表达式（scope.watch 双轨；返回值即初值） */
        private _setupPresence(): void {
            this._panes.forEach((decl, i) => {
                if (!decl.presenceExpr) return;
                const initial = this.binding.watch(decl.presenceExpr, ({ value }) => {
                    this._present[i] = !!value;
                    this._reflow();
                });
                this._present[i] = !!initial;
            });
        }

        /** 回流：重算 grid 模板 + absent 标记（窗格元素永不 reparent） */
        private _reflow(): void {
            if (this._panes.length === 0) return;
            this._applyGrid();
            this._paneEls.forEach((el, i) => {
                if (!el) return;
                if (this._present[i]) el.removeAttribute("data-autospark-layout-absent");
                else el.setAttribute("data-autospark-layout-absent", "");
            });
            // 侧容器：该侧全部窗格被剔除 → 容器一并 absent（防 grid-area 指向已消失的区域）
            for (const side of ["left", "right"] as const) {
                const container = this._sideContainers[side];
                if (!container) continue;
                const anyPresent = this._panes.some(
                    (p, i) => p.kind === "sidebar" && p.side === side && this._present[i],
                );
                if (anyPresent) container.removeAttribute("data-autospark-layout-absent");
                else container.setAttribute("data-autospark-layout-absent", "");
            }
        }

        // ── grid 模板（纯函数 buildLayoutGrid 的应用点）───────────────────

        /** 由窗格现态派生 grid 模型 → 应用 rows/cols/areas/gap */
        private _applyGrid(): void {
            const firstSide = (side: "left" | "right"): PaneDecl | undefined =>
                this._panes.find((p, i) => p.kind === "sidebar" && p.side === side && this._present[i]);
            const left = firstSide("left");
            const right = firstSide("right");
            const model: LayoutGridModel = {
                header: this._panes.some((p, i) => p.kind === "header" && this._present[i]),
                footer: this._panes.some((p, i) => p.kind === "footer" && this._present[i]),
                content: this._panes.some((p, i) => p.kind === "content" && this._present[i]),
                left: this._panes.filter(
                    (p, i) => p.kind === "sidebar" && p.side === "left" && this._present[i],
                ).length,
                right: this._panes.filter(
                    (p, i) => p.kind === "sidebar" && p.side === "right" && this._present[i],
                ).length,
                ltUp: left?.throughUp ?? false,
                ltDown: left?.throughDown ?? false,
                rtUp: right?.throughUp ?? false,
                rtDown: right?.throughDown ?? false,
            };
            const t = buildLayoutGrid(model);
            const s = this.el.style;
            s.gridTemplateAreas = t.areas;
            s.gridTemplateRows = t.rows;
            s.gridTemplateColumns = t.cols;
            if (this._gap) s.gap = this._gap;
        }

        /** 编译挂载某 kind 的窗格（gridArea = kind；degraded 的 content 缺席） */
        private _mountKind(kind: PaneKind): void {
            this._panes.forEach((decl, i) => {
                if (decl.kind !== kind) return;
                const el = this._compilePane(decl, i);
                if (!el) return;
                el.style.gridArea = kind;
            });
        }

        /**
         * 编译挂载某侧的 sidebar 窗格：单个直挂 gridArea=side；≥2 个经 {@link buildSideSplitter}
         * 构建分割容器（x-splitter 属性 + 嵌套链）整体 temp 编译——splitter 在容器上自然实例化
         * （其 created 扫容器克隆子级收集面板快照，data-size 面板契约照常，决策七）。
         */
        private _mountSide(side: "left" | "right"): void {
            const indices = this._panes
                .map((p, i) => ({ p, i }))
                .filter(({ p }) => p.kind === "sidebar" && p.side === side);
            if (indices.length === 0) return;
            if (indices.length === 1) {
                const { p, i } = indices[0]!;
                const el = this._compilePane(p, i);
                if (el) el.style.gridArea = side;
                return;
            }
            const container = buildSideSplitter(indices.map(({ p }) => p));
            const temp = document.createElement("div");
            temp.appendChild(container);
            const nodes = this.engine.compiler.compileSubtree(this.el, temp, this.binding);
            const el = nodes.find((n) => n instanceof HTMLElement) as HTMLElement | undefined;
            if (!el) return;
            el.style.gridArea = side;
            this._sideContainers[side] = el;
            // 窗格 el 反查（absent 联动与 resize 事件反查用）：编译产物内按文档序对齐窗格声明
            const paneEls = [...el.querySelectorAll("[data-autospark-layout-pane]")];
            indices.forEach(({ i }, k) => {
                const pel = paneEls[k];
                if (pel instanceof HTMLElement) {
                    if (!this._present[i]) pel.setAttribute("data-autospark-layout-absent", "");
                    this._paneEls[i] = pel;
                }
            });
        }

        /** 编译单窗格子树（temp wrapper 技巧，splitter 先例）+ 契约属性与选项尺寸（分割窗格 width 走 data-size，不打 inline） */
        private _compilePane(decl: PaneDecl, index: number): HTMLElement | null {
            const temp = document.createElement("div");
            temp.appendChild(decl.template);
            const nodes = this.engine.compiler.compileSubtree(this.el, temp, this.binding);
            const el = nodes.find((n) => n instanceof HTMLElement) as HTMLElement | undefined;
            if (!el) return null;
            el.setAttribute("data-autospark-layout-pane", decl.kind);
            if (decl.height) el.style.height = decl.height;
            if (decl.width && !decl.grouped) el.style.width = decl.width;
            if (!this._present[index]) el.setAttribute("data-autospark-layout-absent", "");
            this._paneEls[index] = el;
            return el;
        }

        // ── 行为组合（决策六）─────────────────────────────────────────────

        /**
         * sidebar 默认注入 x-expandable（`ExpandableDirective.compose`，ADR-0070 splitter 同款）：
         * 折叠布尔真相由本指令持有（driver），把手/动画/事件全走 expandable 原生管线。
         * direction 由 sidebar 侧推导（用户声明接管 warn，对齐 splitter）；把手默认常驻
         * `showTrigger:'always'`（折叠态唯一重开触点）。显式声明 / opt-out 不注入。
         */
        private _setupCompose(): void {
            this._panes.forEach((decl, i) => {
                if (
                    decl.kind !== "sidebar" ||
                    decl.grouped ||
                    decl.expandableExplicit ||
                    decl.expandableOptOut
                )
                    return;
                const el = this._paneEls[i];
                if (!el) return;
                const opts: Record<string, any> = { ...decl.expandableOpts };
                const dir = decl.side === "right" ? "right" : "left";
                if (opts.direction != null && opts.direction !== dir) {
                    this.warn(
                        `x-layout: x-expandable-options.direction 由布局接管（按 sidebar 侧推导为 "${dir}"），声明被忽略`,
                    );
                }
                opts.direction = dir;
                if (opts.showTrigger === undefined) opts.showTrigger = "always";
                this._collapsedSide[i] = false;
                this._lastSizes[i] = null;
                const inst = ExpandableDirective.compose(this.engine, this.binding, el, opts, {
                    get: () => !this._collapsedSide[i],
                    set: (v) => this._onDriverSet(i, v),
                });
                inst.created();
                inst.compile(undefined as any, el);
                this._composeInsts[i] = inst;
            });
        }

        /** 组合 driver 落点（把手点击翻转）：折叠记忆 lastSize、展开走恢复链（lastSize → 声明宽 → 240 兜底） */
        private _onDriverSet(i: number, expanded: boolean): void {
            const inst = this._composeInsts[i];
            if (!inst) return;
            if (expanded) {
                this._collapsedSide[i] = false;
                const declared = parsePxNumber(this._panes[i]!.width ?? "");
                const restore = this._lastSizes[i] ?? declared ?? 240;
                inst.composeSetMaxSize({ value: restore, unit: "px" });
                inst.composeSet(true);
            } else {
                this._collapsedSide[i] = true;
                inst.composeSet(false);
            }
        }

        /**
         * resize ↔ 折叠联动（Q26）：`resize:move` 持续记忆非折叠宽度（lastSize）；
         * `resize:end` 终值 ≤ 阈值（minSize，缺省 0）→ 翻转折叠布尔（终态由组合实例承接）。
         * 事件由 x-resizable 派发冒泡（ADR-0064 契约），宿主级单一监听按 target 反查窗格。
         */
        private _onPaneResize(ev: Event, isEnd: boolean): void {
            const width = (ev as CustomEvent).detail?.width;
            if (!Number.isFinite(width)) return;
            const pane = (ev.target as HTMLElement | null)?.closest?.("[data-autospark-layout-pane]");
            if (!(pane instanceof HTMLElement)) return;
            const i = this._paneEls.indexOf(pane);
            const inst = i >= 0 ? this._composeInsts[i] : null;
            if (!inst) return;
            const threshold = this._panes[i]!.expandableMin ?? 0;
            if (!this._collapsedSide[i] && width > threshold) {
                this._lastSizes[i] = width;
            }
            if (isEnd && !this._collapsedSide[i] && width <= threshold) {
                this._collapsedSide[i] = true;
                inst.composeSet(false);
            }
        }

        // ── 宿主选项 ──────────────────────────────────────────────────────

        /** gap 解析（x-layout-options.gap）：number → px；string 原样作 CSS gap 值（决策二/七） */
        private _readGap(): string | null {
            const g = this.options?.gap;
            if (g == null) return null;
            if (typeof g === "number") {
                if (!Number.isFinite(g)) {
                    this.warn(`x-layout: gap 值 ${g} 非有限数，已忽略`);
                    return null;
                }
                return `${g}px`;
            }
            if (typeof g === "string" && g.trim() !== "") return g.trim();
            this.warn(`x-layout: gap 值 "${g}" 无法解析（须为 number 或 CSS gap 字符串），已忽略`);
            return null;
        }
    }

    /* ══════════ PaneDirective（engine x-pane.ts） ══════════ */
    class PaneDirective extends Base {
        static override readonly priority = 0;
        static override readonly singleton = true;

        override created(): void {
            // 合法窗格由 layout 接管（永不走到这里）；实例化即孤儿——宿主不是 layout 容器
            // （layout.compile 先于窗格子树编译给宿主打 autospark-layout 类，此处类即真相）
            const host = this.el.parentElement;
            if (!host || !host.classList.contains("autospark-layout")) {
                this.warn(
                    "x-pane: 仅可作为 x-layout 的直接子元素使用（深层或无 x-layout 祖先的声明无效），本标记已忽略",
                );
            }
        }
    }

    return {
        resizable: ResizableDirective,
        expandable: ExpandableDirective,
        splitter: SplitterDirective,
        layout: LayoutDirective,
        pane: PaneDirective,
    };
}

/** 双路径自举（ADR-0114 单点 installPlugin）：注册家族五指令 */
export function bootstrapLayoutFamily(): void {
    installPlugin((autospark) => {
        const classes = createLayoutDirectives(autospark.AutoSparkDirectiveBase);
        for (const name of ["resizable", "expandable", "splitter", "layout", "pane"] as const) {
            autospark.directive(name, classes[name]);
        }
    });
}

// 模块加载即自举（聚合入口 import 副作用触发；对称 decorate 家族）
bootstrapLayoutFamily();
