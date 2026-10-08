import { setVal, getVal } from "autostore";
import { AutoSparkDirectiveBase } from "../features/directive/base";
import { isSimpleStatePath } from "../engine/scope";
import type { AutoSpark } from "../engine/engine";

/**
 * x-resize：宿主元素尺寸的拖拽调节指令（ADR-0064）。
 *
 * **可选值双向**（对齐 x-model 哲学）：
 * - 无值——纯 DOM：拖拽直改宿主 `style.width/height`（+ 定位元素 w/n 手柄的 left/top 补偿）；
 * - 有值（`x-resize="size"`）——双向绑定：拖拽中实时写回 `{width, height}`（px number，
 *   简单路径经落点解析逐段直写），外部改状态反向同步宿主（过 min/max 钳制、等值短路防循环）。
 *
 * **方向声明**（{@link RESIZE_DIRECTIONS} 八方向）：`handles` 选项（逗号串或数组）为主通道；
 * 修饰符 `x-resize.e.s.se` 解析期并入指令选项（ADR-0007——同名布尔键，本指令归一为方向集）。
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
 * x-resize 选项形态（`x-resize-options`）；覆盖物 `resize` 选项对象形态与之同构（ADR-0064 决策八）。
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
                warn?.(`x-resize: aspectRatio "${arRaw}" 无法解析为比值（如 '16:9'），已忽略`);
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
                warn?.(`x-resize: 约束 ${key} 值 "${String(raw)}" 无法解析为长度，已忽略`);
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
 * 归一方向集声明：`handles` 选项（逗号串/数组）+ 修饰符布尔键（`x-resize.e.s.se` 解析期并入
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
        else warn?.(`x-resize: 未知调节方向 "${raw}"（合法：n/s/e/w/ne/nw/se/sw），已忽略`);
    };
    const declared = opts?.handles;
    if (typeof declared === "string") declared.split(",").forEach((s) => s.trim() && add(s));
    else if (Array.isArray(declared)) declared.forEach((s) => add(String(s)));
    else if (declared != null) {
        warn?.(`x-resize: handles 须为逗号串或数组，已忽略: ${JSON.stringify(declared)}`);
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
[data-autospark-resize-handle]:hover::after,[data-autospark-resize-handle]:focus-visible::after{background:var(--autospark-resize-handle-color,#94a3b8);}
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
[data-autospark-resize-handle="se"]::after{left:2px;top:2px;width:5px;height:5px;background:var(--autospark-resize-handle-color,#94a3b8);clip-path:polygon(0 100%,100% 100%,100% 0);}
[data-autospark-resize-handle="sw"]{bottom:calc(-1 * var(--autospark-resize-handle-size,12px) / 2);left:calc(-1 * var(--autospark-resize-handle-size,12px) / 2);cursor:nesw-resize;}
[data-autospark-resize-handle="sw"]::after{right:2px;top:2px;width:5px;height:5px;background:var(--autospark-resize-handle-color,#94a3b8);clip-path:polygon(0 100%,0 0,100% 100%);}
[data-autospark-resize-handle="ne"]::after,[data-autospark-resize-handle="nw"]::after{width:5px;height:5px;background:var(--autospark-resize-handle-color,#94a3b8);}
[data-autospark-resize-handle="ne"]::after{right:2px;bottom:2px;clip-path:polygon(0 0,100% 0,100% 100%);}
[data-autospark-resize-handle="nw"]::after{left:2px;bottom:2px;clip-path:polygon(0 0,100% 0,0 100%);}
`;

/** 注入手柄全局样式（幂等；多 engine 共享、destroy 不移除——对齐全局样式惯例） */
export function registerResizeStyles(): void {
    if (document.getElementById(RESIZE_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = RESIZE_STYLE_ID;
    style.textContent = RESIZE_HANDLE_CSS;
    document.head.appendChild(style);
}

/**
 * x-resize 指令（ADR-0064）：宿主元素尺寸拖拽调节，Compile kind（编译期建绑定、
 * 挂载后微任务注入手柄——computed 检测需已连接文档）。动态启停用 x-if 包宿主表达。
 */
export class ResizeDirective extends AutoSparkDirectiveBase {
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
                `x-resize: 同元素存在 x-expandable，本指令已忽略（其内建单边 resize 为本指令能力子集，请迁移至 x-expandable-options.resize，ADR-0072）`,
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
                    `x-resize: 值 "${raw}" 非简单状态路径，退化为只读（状态→DOM 单向，写回须绑定对象路径，ADR-0064）`,
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
                `x-resize: 宿主非 absolute/fixed 定位，方向 ${dropped.join(",")} 需位置补偿已丢弃（完整 8 向请对定位元素使用），保留 ${final.join(",") || "（无）"}`,
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
            this.warn(`x-resize: 尺寸写回失败（"${this._sizePath}"）: ${e?.message ?? e}`);
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
