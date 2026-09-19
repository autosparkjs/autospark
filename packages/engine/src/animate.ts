/**
 * 结构指令进出场动画（ADR-0039）：Vue 同构的六类名 CSS 生命周期 + 内置 fade/slide/expand。
 *
 * 服务挂 engine 实例（`engine.animate`），**不对消费者文档化**（内部 API，ADR-0039 决策 5）——
 * 后续 x-teleport / x-loading / x-tree 等接入只需加挂点。
 *
 * ## 六类名契约（决策 2）
 *
 * 进场：挂 `{name}-enter-from` + `{name}-enter-active` → 强制 reflow → 摘 from 挂
 * `{name}-enter-to` → 结束全摘；出场镜像（`leave-*`）。自定义动画 = 用户按此约定写 CSS
 * （transition 型 / keyframe 型皆可），传名即用、零注册 API。
 *
 * ## 高度型内置动画 expand（决策 13）
 *
 * 类名型动画 transition 的是 transform/opacity——**不参与布局**，展开/折叠类场景（树、
 * 手风琴）的后续节点会瞬时跳位。`expand` 为 height 0 ↔ 测量高度 + opacity 的 inline
 * 过渡（from/to 是动态测量值，静态 CSS 类无法表达），布局高度参与过渡、后续节点平滑
 * 跟随；同元素多子节点场景不受 grid 0fr/1fr 配方的「单子元素」约束。
 *
 * ## 结束检测（决策 4）
 *
 * `transitionend` / `animationend`（过滤 `e.target === el`，防冒泡误判）+ 超时兜底
 * （computed duration+delay 与配置 duration+delay 取最大 + buffer）。computed 与配置
 * 均为 0 时（无动画环境 / 用户 CSS 降级 reduced-motion）下一宏任务即完成——降级天然兼容（决策 11）。
 *
 * ## 抢占（决策 7）
 *
 * 同元素动画互斥（Map 跟踪）：`enter`/`leave` 起手先 `cancel` 在播动画。**cancel = 同步完成**：
 * 若在播的是携带延迟移除回调（onDone）的离场，立即执行 onDone（完成 DOM 移除）——调用方随后
 * 按新状态全新挂载，语义干净。enter 无 onDone，cancel 仅清类/定时器。
 */

/** 单相（enter/leave）动画的解析结果 */
export interface PhaseAnim {
    /** 动画名（六类名的 `{name}` 前缀），如 fade / slide / 用户自定义名 */
    name: string;
    /** 时长 ms（经 inline style 同时覆盖 transition-* 与 animation-*，决策 3） */
    duration?: number;
    /** 延迟 ms */
    delay?: number;
    /** 缓动函数 */
    easing?: string;
}

/** animate 选项的解析结果：enter/leave 各自的相配置；null = 该相禁用（或无动画） */
export interface ResolvedAnimate {
    enter: PhaseAnim | null;
    leave: PhaseAnim | null;
}

/**
 * 解析 animate 选项（决策 3）：三形态——
 * - 字符串 `'fade'`：进出同名；
 * - 对象 `{name,duration,delay,easing}`：基础字段施于两相；
 * - 分相覆盖 `{enter:'slide', leave:false}`：相值各自接受 字符串 | 对象 | false（单相禁用），
 *   显式键胜出、缺相回退基础字段。无 name（基础与相均无）即该相无动画。
 */
export function resolveAnimate(option: unknown): ResolvedAnimate {
    if (option == null || option === false || option === "") {
        return { enter: null, leave: null };
    }
    if (typeof option === "string") {
        const phase: PhaseAnim = { name: option };
        return { enter: phase, leave: { ...phase } };
    }
    if (typeof option !== "object") return { enter: null, leave: null };
    const o = option as Record<string, any>;
    const base: Partial<PhaseAnim> = {};
    if (o.name != null) base.name = String(o.name);
    if (o.duration != null) base.duration = Number(o.duration);
    if (o.delay != null) base.delay = Number(o.delay);
    if (o.easing != null) base.easing = String(o.easing);
    return {
        enter: resolvePhase(o.enter, base),
        leave: resolvePhase(o.leave, base),
    };
}

/** 分相解析：false 禁用；缺省回退基础字段（有 name 才有效）；字符串即 name；对象并入基础 */
function resolvePhase(v: unknown, base: Partial<PhaseAnim>): PhaseAnim | null {
    if (v === false) return null;
    let name = base.name;
    let { duration, delay, easing } = base;
    if (typeof v === "string") {
        name = v;
    } else if (typeof v === "object") {
        const o = v as Record<string, any>;
        if (o.name != null) name = String(o.name);
        if (o.duration != null) duration = Number(o.duration);
        if (o.delay != null) delay = Number(o.delay);
        if (o.easing != null) easing = String(o.easing);
    }
    if (name == null) return null;
    const phase: PhaseAnim = { name };
    if (duration != null) phase.duration = duration;
    if (delay != null) phase.delay = delay;
    if (easing != null) phase.easing = easing;
    return phase;
}

/** 高度型内置动画名（决策 13）：expand 走 inline 高度过渡分支（不挂类、无需类 CSS） */
const HEIGHT_ANIM_NAMES = new Set(["expand"]);

/** 内置动画样式（决策 12）：transition 型、裸类名（可被用户同名 CSS 覆盖）、无命名空间前缀 */
const BUILTIN_ANIMATE_CSS = ".fade-enter-active,.fade-leave-active{transition:opacity .3s ease}.fade-enter-from,.fade-leave-to{opacity:0}.fade-enter-to,.fade-leave-from{opacity:1}.slide-enter-active,.slide-leave-active{transition:transform .3s ease,opacity .3s ease}.slide-enter-from,.slide-leave-to{opacity:0;transform:translateY(-12px)}.slide-enter-to,.slide-leave-from{opacity:1;transform:translateY(0)}";


/** 内置样式 `<style>` 元素 id（幂等注入：多 engine 实例共享 document，防重复） */
const ANIMATE_STYLE_ID = "autospark-animate-styles";

/** 幂等注入内置动画样式（engine 构造期调用一次；已存在则跳过） */
function ensureAnimateStyles() {
    if (typeof document === "undefined") return;
    if (document.getElementById(ANIMATE_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = ANIMATE_STYLE_ID;
    style.textContent = BUILTIN_ANIMATE_CSS;
    document.head.appendChild(style);
}

/** 进行中的动画记录（同元素互斥的载体，engine 存活期内数量有限，强引用可接受） */
interface AnimRecord {
    el: HTMLElement;
    /** 当前挂着的生命周期类（finish 时全摘） */
    classes: string[];
    kind: "enter" | "leave";
    /** 离场的延迟移除回调（cancel/finish 时执行——DOM 真正离开的时点） */
    onDone?: () => void;
    /** 超时兜底定时器 */
    timer: ReturnType<typeof setTimeout>;
    /** inline 覆盖备份：[属性, 原值]（finish 时还原，不污染用户内联样式） */
    inlineBackup: [string, string][];
    /** 事件处理器引用（finish 时移除监听） */
    onEnd: ((e: Event) => void) | null;
}

/** 超时兜底的固定 buffer（ms）：覆盖 transition 启动帧与计时误差 */
const TIMEOUT_BUFFER = 50;

/**
 * 进出场动画服务（engine 实例级）。指令无关接口：
 * `enter(el, phase)` / `leave(el, phase, onDone)` / `cancel(el)` / `dispose()`。
 */
export class AutoSparkAnimator {
    /** 进行中动画：el → 记录（同元素互斥、后者抢占，决策 7） */
    private active = new Map<HTMLElement, AnimRecord>();

    constructor() {
        ensureAnimateStyles();
    }

    /**
     * 进场动画：挂 enter-from + enter-active → reflow → 摘 from 挂 to → 结束全摘。
     * 起手抢占在播动画（含同步完成待决离场）。
     * @returns 是否启动了动画（phase 为 null 即未配置 → false，调用方直接同步处理）
     */
    enter(el: HTMLElement, phase: PhaseAnim | null): boolean {
        return this._start(el, phase, "enter");
    }

    /**
     * 离场动画：挂 leave-from + leave-active → reflow → 摘 from 挂 to → 结束全摘 + onDone()
     * （onDone 承载真正的 DOM 移除——离场动画的本质是延迟移除）。
     * @returns 是否启动了动画（false 时调用方应立即执行 onDone 同步移除）
     */
    leave(el: HTMLElement, phase: PhaseAnim | null, onDone: () => void): boolean {
        return this._start(el, phase, "leave", onDone);
    }

    /**
     * 取消在播动画（抢占的实现面）：清类/定时器/监听、还原 inline。
     * **cancel = 同步完成**：若在播离场携带 onDone，立即执行（DOM 移除到位），调用方随后
     * 按新状态全新挂载——中断语义干净（决策 7）。无在播动画时 no-op。
     */
    cancel(el: HTMLElement) {
        const rec = this.active.get(el);
        if (rec) this._finish(rec, true);
    }

    /** engine 销毁：取消全部在播（离场 onDone 同步完成，DOM 随销毁清理） */
    dispose() {
        for (const rec of Array.from(this.active.values())) {
            this._finish(rec, true);
        }
        this.active.clear();
    }

    // ── 内部 ──────────────────────────────────────────────────────────

    private _start(
        el: HTMLElement,
        phase: PhaseAnim | null,
        kind: "enter" | "leave",
        onDone?: () => void,
    ): boolean {
        if (!phase || !phase.name) return false;
        // 高度型内置动画走独立分支（决策 13）：from/to 是动态测量值，不经类名契约
        if (HEIGHT_ANIM_NAMES.has(phase.name)) {
            return this._startHeight(el, phase, kind, onDone);
        }
        this.cancel(el); // 抢占在播（决策 7）
        const n = phase.name;
        const fromCls = `${n}-${kind}-from`;
        const activeCls = `${n}-${kind}-active`;
        const toCls = `${n}-${kind}-to`;
        const inlineBackup = this._applyInline(el, phase);
        // ① 起始帧：from + active（reflow 前浏览器尚未计算 from 态）
        el.classList.add(fromCls, activeCls);
        // ② 强制 reflow：确保 from 态被计算，transition 才会在摘 from 时触发
        void (el as HTMLElement).offsetWidth;
        // ③ 目标帧：摘 from 挂 to（transition/animation 由此启动）
        el.classList.remove(fromCls);
        el.classList.add(toCls);

        const rec: AnimRecord = {
            el,
            classes: [activeCls, toCls],
            kind,
            onDone,
            timer: null as unknown as ReturnType<typeof setTimeout>,
            inlineBackup,
            onEnd: null,
        };
        this._registerEnd(rec, phase);
        return true;
    }

    /**
     * 高度型动画（内置 expand，决策 13）：height 0 ↔ 自然高度 + opacity 同链 inline 过渡。
     *
     * - enter：此刻元素已 display 可见且无 height 残留（调用方刚恢复显示 / cancel 已还原
     *   抢占期的 inline）→ 测量自然高度 → 起始帧 height:0/opacity:0 → reflow → 目标帧
     *   height:测量值/opacity:1；
     * - leave：锁定当前自然高度 → 过渡到 0（onDone 延迟真正的隐藏/移除，与类名型契约一致）；
     * - 测量值为 0（空容器 / 无布局环境）→ 返回 false，调用方同步处理（契约同 phase=null）；
     * - box-sizing 动画期强制 border-box：height 数值与 offsetHeight（border-box 渲染高）
     *   语义对齐，content-box 下 padding/border 不产生测量误差；finish 经 inline 备份还原。
     */
    private _startHeight(
        el: HTMLElement,
        phase: PhaseAnim,
        kind: "enter" | "leave",
        onDone?: () => void,
    ): boolean {
        this.cancel(el); // 抢占在播（决策 7；含还原其在播期的 inline 覆盖后再测量）
        const natural = el.offsetHeight;
        if (natural <= 0) return false; // 无高度可过渡（happy-dom 等）→ 调用方同步处理
        const duration = phase.duration ?? 300;
        const easing = phase.easing ?? "ease";
        const delay = phase.delay ?? 0;
        const style = el.style as unknown as Record<string, string>;
        const inlineBackup: [string, string][] = ["height", "overflow", "opacity", "boxSizing", "transition"].map(
            (p) => [p, style[p] ?? ""],
        );
        const transitionValue = `height ${duration}ms ${easing} ${delay}ms, opacity ${duration}ms ${easing} ${delay}ms`;
        style.overflow = "hidden";
        style.boxSizing = "border-box";
        style.transition = transitionValue;
        if (kind === "enter") {
            // 起始帧：0 高全透明 → reflow 计算起始态 → 目标帧启动过渡
            style.height = "0px";
            style.opacity = "0";
            void el.offsetWidth;
            style.height = `${natural}px`;
            style.opacity = "1";
        } else {
            // 起始帧：锁定当前自然高（reflow 生效）→ 目标帧收起到 0
            style.height = `${natural}px`;
            style.opacity = "1";
            void el.offsetWidth;
            style.height = "0px";
            style.opacity = "0";
        }
        const rec: AnimRecord = {
            el,
            classes: [],
            kind,
            onDone,
            timer: null as unknown as ReturnType<typeof setTimeout>,
            inlineBackup,
            onEnd: null,
        };
        // 实际生效时长（默认 300 已并入）传给超时兜底——环境读不到 computed 时仍能按时收口
        this._registerEnd(rec, { ...phase, duration });
        return true;
    }

    /**
     * 结束检测注册（决策 4，类名型 / 高度型两路径共用）：事件（过滤 target + 属性归属，
     * 收齐全部分属事件）+ 超时兜底。多属性过渡（如 `transition: height .3s, opacity .3s`）
     * 会按属性各发一个 transitionend——**先到者不得提前终结**（否则长属性动画半途被摘类/
     * 还原 inline，布局属性如 height 会停在中途高度）。期望事件数从 computed
     * transition-property / animation-name 解析；不可得（happy-dom 等）时退化为
     * 单事件即结束（旧语义，测试驱动路径）。total=0（无动画环境 / reduced-motion
     * 降级）：下一宏任务即完成，不空等。
     */
    private _registerEnd(rec: AnimRecord, phase: PhaseAnim): void {
        const el = rec.el;
        const transitionProps = parsePropertyNames(readComputed(el, "transitionProperty"));
        const animationNames = parsePropertyNames(readComputed(el, "animationName"));
        const expected = transitionProps.length + animationNames.length;
        const need = expected > 0 ? expected : 1;
        let received = 0;
        const total = Math.max(computedMaxDuration(el), (phase.duration ?? 0) + (phase.delay ?? 0));
        const timeout = total > 0 ? total + TIMEOUT_BUFFER : 0;
        rec.onEnd = (e: Event) => {
            if (e.target !== el) return; // 冒泡的子孙事件不算（决策 4）
            if (e.type === "transitionend") {
                const name = (e as TransitionEvent).propertyName;
                // 只认已知过渡属性的事件；'all' 无法枚举 → 不过滤
                if (
                    transitionProps.length &&
                    transitionProps[0] !== "all" &&
                    !transitionProps.includes(name)
                )
                    return;
            } else {
                const name = (e as AnimationEvent).animationName;
                if (animationNames.length && !animationNames.includes(name)) return;
            }
            if (++received >= need) this._finish(rec, false);
        };
        el.addEventListener("transitionend", rec.onEnd);
        el.addEventListener("animationend", rec.onEnd);
        rec.timer = setTimeout(() => this._finish(rec, false), timeout);
        this.active.set(el, rec);
    }

    /** finish / cancel 共用清理：摘类、还原 inline、清定时器与监听、执行 onDone */
    private _finish(rec: AnimRecord, _canceled: boolean) {
        if (!this.active.has(rec.el)) return;
        this.active.delete(rec.el);
        clearTimeout(rec.timer);
        if (rec.onEnd) {
            rec.el.removeEventListener("transitionend", rec.onEnd);
            rec.el.removeEventListener("animationend", rec.onEnd);
        }
        for (const c of rec.classes) rec.el.classList.remove(c);
        // 还原 inline 覆盖（有备份才写——避免覆盖用户自己设的内联样式）
        for (const [prop, prev] of rec.inlineBackup) {
            (rec.el.style as unknown as Record<string, string>)[prop] = prev;
        }
        // 离场的 onDone 无论自然结束还是抢占取消都执行（cancel=同步完成，决策 7）
        rec.onDone?.();
    }

    /**
     * 配置的 duration/delay/easing 经 inline style 同时覆盖 transition-* 与 animation-*
     * （自定义动画两种基底都存在，决策 3/4）。返回备份供 finish 还原。
     */
    private _applyInline(el: HTMLElement, phase: PhaseAnim): [string, string][] {
        const style = el.style as unknown as Record<string, string>;
        const entries: [string, string | null][] = [
            ["transitionDuration", phase.duration != null ? `${phase.duration}ms` : null],
            ["transitionDelay", phase.delay != null ? `${phase.delay}ms` : null],
            ["transitionTimingFunction", phase.easing ?? null],
            ["animationDuration", phase.duration != null ? `${phase.duration}ms` : null],
            ["animationDelay", phase.delay != null ? `${phase.delay}ms` : null],
            ["animationTimingFunction", phase.easing ?? null],
        ];
        const backup: [string, string][] = [];
        for (const [prop, value] of entries) {
            if (value == null) continue;
            backup.push([prop, style[prop] ?? ""]);
            style[prop] = value;
        }
        return backup;
    }
}

/** 安全读取 computed 样式属性（无 getComputedStyle / 抛错环境返回 undefined） */
function readComputed(el: HTMLElement, prop: string): string | undefined {
    try {
        const cs = window.getComputedStyle(el);
        return (cs as unknown as Record<string, string>)[prop] ?? undefined;
    } catch {
        return undefined;
    }
}

/** 解析 computed 属性/动画名列表（"grid-template-rows, opacity" → 小写去空）；none/空 → [] */
function parsePropertyNames(value: string | undefined): string[] {
    if (!value) return [];
    const list = value
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s && s !== "none");
    return list;
}

/**
 * computed 动画总时长（ms）：transition 与 animation 的 duration+delay 各自求和取最大。
 * 多段值（"0.3s, 0.5s"）取最大段。无动画环境（happy-dom 等）返回 0 → 超时兜底退化为下一宏任务。
 */
function computedMaxDuration(el: HTMLElement): number {
    let max = 0;
    try {
        const cs = window.getComputedStyle(el);
        max = Math.max(
            max,
            parseDurationList(cs.transitionDuration) + parseDurationList(cs.transitionDelay),
            parseDurationList(cs.animationDuration) + parseDurationList(cs.animationDelay),
        );
    } catch {
        // 无 getComputedStyle 环境：交由配置侧兜底
    }
    return max;
}

/** 解析 CSS 时长列表（"0.3s, 0.5s"）为最大毫秒值 */
function parseDurationList(value: string | undefined | null): number {
    if (!value) return 0;
    let max = 0;
    for (const seg of String(value).split(",")) {
        const s = seg.trim();
        if (!s) continue;
        const n = s.endsWith("ms") ? parseFloat(s) : parseFloat(s) * 1000;
        if (Number.isFinite(n) && n > max) max = n;
    }
    return max;
}
