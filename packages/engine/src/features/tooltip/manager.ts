import type { AutoSpark } from "../../engine/engine";
import { resolveAnimate } from "../animate/animate";
import { sanitizeHtml } from "../../utils/sanitize";
import { applyFloatingPosition } from "../../utils/floating";
import { parseTooltipValue, TOOLTIP_DEFAULTS, type TooltipOptions } from "./types";
import {
    getTooltipContainer,
    removeTooltipContainer,
    TOOLTIP_ARROW_CLASS,
    TOOLTIP_CLASS,
    TOOLTIP_PLACEMENT_ATTR,
    TOOLTIP_BORDER_ATTR,
} from "./container";
import { injectTooltipStyles } from "./styles";

/**
 * TooltipManager：全局工具提示引擎级子系统（ADR-0061 决策 1）。
 *
 * 属性约定驱动——引擎树内任意元素带 `title`（编译期已转换为 `data-tooltip`，决策 4）或
 * 手写 `data-tooltip` 即生效，无 x-* 声明。本类负责**消费侧**：
 *
 * - **委托监听**（决策 10）：`mouseover`/`mouseout` + `focusin`/`focusout`（键盘可达，决策 12）
 *   挂 engine 根；命中 `e.target.closest("[data-tooltip]")` 取最近祖先。overlay 容器等
 *   body 侧渲染产物经 `attachDelegationRoot` 追加监听点（决策 15——dialog 内 title 不退回原生）。
 * - **嵌套引擎归属过滤**：命中元素 `closest("[data-autospark]")` 须为本 engine 根（或注册的
 *   额外监听点内）——x-isolate 内部元素只由 isolate 自身引擎响应，防双显。
 * - **单例浮层**（决策 11）：每引擎一个共享 tip 元素常驻容器（隐藏 display:none），内容随
 *   悬停目标切换；`showDelay`/`hideDelay` 延迟防抖，期间重新进入取消隐藏（跨目标快速移动
 *   不闪烁）；移入浮层内取消隐藏（可交互 tooltip）。
 * - **悬停时现读属性**（决策 6）：`:data-tooltip` 插值更新后下次悬停即新内容，显示中不热更。
 * - **断连兜底**（决策 13）：显示期间 rAF 检查触发元素 `isConnected`——x-for 回收/patch/
 *   DOM 移除无事件可感知，断连立即隐藏。
 * - **动画**（决策 16）：显隐经 `engine.animate`（ADR-0039 指令无关服务）驱动，默认
 *   `'slide'`（方向自适应覆写层见 styles.ts）。
 * - **事件双通道**（决策 17）：`tooltip:show`/`tooltip:hide` 引擎总线 + 浮层元素
 *   dispatchEvent，payload `{ el, tip }`；一切隐藏路径均广播 hide。
 * - **命令式**（决策 18）：`engine.tooltip.show(el, opts?)` / `hide()`；`options.tooltip:
 *   false` 时整体不初始化（不注样式、不挂监听），命令式调用 warn + no-op（决策 2 全关语义）。
 */
export class TooltipManager {
    readonly engine: AutoSpark<any>;
    /** 特性开关（options.tooltip !== false）；false 时构造即短路——样式/监听/容器全不就位 */
    readonly enabled: boolean;

    /** 全局默认配置（options.tooltip 配置对象；缺省空对象走 TOOLTIP_DEFAULTS） */
    private _globalOptions: TooltipOptions;

    // ── 状态机：idle → waiting-show → shown → waiting-hide → idle ──
    private _state: "idle" | "waiting-show" | "shown" | "waiting-hide" = "idle";
    /** 当前触发元素（shown / waiting-hide 期间有效；waiting-show 为待显示目标） */
    private _currentTarget: HTMLElement | null = null;
    /** 上一触发元素（离场动画播中鼠标回到浮层时的恢复目标，决策 11 可交互 tooltip） */
    private _lastTarget: HTMLElement | null = null;
    /** 显示时已解析的配置（leave 动画相在隐藏时复用，避免二次解析） */
    private _activeLeave: ReturnType<typeof resolveAnimate>["leave"] = null;
    private _showTimer: ReturnType<typeof setTimeout> | null = null;
    private _hideTimer: ReturnType<typeof setTimeout> | null = null;
    private _rafId: number | null = null;
    /** 浮层定位 cleanup（autoUpdate），隐藏时统一执行 */
    private _cleanups: Array<() => void> = [];

    /** 单例浮层元素（懒建；常驻容器，display:none 切换可见性） */
    private _tip: HTMLElement | null = null;
    /** engine 根之外的委托监听点（overlay 容器等 body 侧渲染产物，决策 15） */
    private _extraRoots = new Set<HTMLElement>();

    constructor(engine: AutoSpark<any>) {
        this.engine = engine;
        const cfg = engine.options.tooltip;
        this.enabled = cfg !== false;
        this._globalOptions = cfg === false || cfg == null ? {} : cfg;
        if (!this.enabled) return;
        injectTooltipStyles();
        // 委托监听（决策 10/12）：mouseover/mouseout 冒泡委托 + focusin/focusout 键盘同管道
        const el = engine.el;
        el.addEventListener("mouseover", this._handleEnter);
        el.addEventListener("mouseout", this._handleLeave);
        el.addEventListener("focusin", this._handleEnter);
        el.addEventListener("focusout", this._handleLeave);
    }

    // ── 命令式 API（ADR-0061 决策 18；engine.tooltip getter 的窄面） ──

    /**
     * 命令式显示：与委托同一管道（配置解析/延迟/动画/事件全同构），`opts` 与元素级保留键
     * 同构、单次生效，覆盖该元素属性解析结果（`content` 键可无 DOM 属性注入内容）。
     * `options.tooltip: false` 时 warn + no-op（全关语义，决策 2）。
     */
    show(el: HTMLElement, opts?: TooltipOptions): void {
        if (!this.enabled) {
            this.engine.logger.warn(
                "engine.tooltip.show: tooltip 特性已通过 options.tooltip: false 关闭，调用被忽略",
            );
            return;
        }
        this._requestShow(el, opts, true);
    }

    /** 命令式隐藏：立即（不走 hideDelay）；未显示时 no-op。false 时 warn + no-op。 */
    hide(): void {
        if (!this.enabled) {
            this.engine.logger.warn(
                "engine.tooltip.hide: tooltip 特性已通过 options.tooltip: false 关闭，调用被忽略",
            );
            return;
        }
        if (this._state === "shown" || this._state === "waiting-hide") this._hide(true);
        else this._cancelPendingShow();
    }

    /**
     * 追加委托监听点（决策 15）：overlay 容器等 body 侧渲染产物——其中的 `title`/
     * `data-tooltip` 元素同样获得工具提示（否则 dialog 内容退回原生 tooltip）。
     * 幂等；过滤规则豁免：额外监听点内元素不做 `data-autospark` 归属判定（容器本就
     * 属于本引擎的渲染产物）。
     */
    attachDelegationRoot(root: HTMLElement): void {
        if (!this.enabled || this._extraRoots.has(root)) return;
        this._extraRoots.add(root);
        root.addEventListener("mouseover", this._handleEnter);
        root.addEventListener("mouseout", this._handleLeave);
        root.addEventListener("focusin", this._handleEnter);
        root.addEventListener("focusout", this._handleLeave);
    }

    /** engine.stop()：同步立即隐藏（不留离场动画——挂载 DOM 即将整体移除） */
    hideImmediate(): void {
        if (this._state !== "idle") this._hide(false);
        this._cancelPendingShow();
    }

    /** engine.destroy()：摘除监听与容器、清计时器/兜底循环（动画由 engine.animate.dispose 统一收口） */
    dispose(): void {
        const el = this.engine.el;
        el.removeEventListener("mouseover", this._handleEnter);
        el.removeEventListener("mouseout", this._handleLeave);
        el.removeEventListener("focusin", this._handleEnter);
        el.removeEventListener("focusout", this._handleLeave);
        for (const root of this._extraRoots) {
            root.removeEventListener("mouseover", this._handleEnter);
            root.removeEventListener("mouseout", this._handleLeave);
            root.removeEventListener("focusin", this._handleEnter);
            root.removeEventListener("focusout", this._handleLeave);
        }
        this._extraRoots.clear();
        this._clearTimers();
        this._stopWatch();
        removeTooltipContainer(this.engine);
        this._tip = null;
        this._state = "idle";
        this._currentTarget = null;
    }

    // ── 委托事件处理 ──

    private _handleEnter = (e: Event): void => {
        if (!this.enabled) return;
        const source = e.target as Element | null;
        const target = source?.closest?.("[data-tooltip]") as HTMLElement | null;
        if (!target) {
            // 移入浮层内（可交互 tooltip）：
            // - waiting-hide：取消延迟隐藏，恢复显示态；
            // - 离场动画播中（idle 且浮层可见）：取消离场、按上一目标重播显示。
            if (this._tip && source != null && this._tip.contains(source)) {
                if (this._state === "waiting-hide") {
                    this._clearTimer("_hideTimer");
                    this._state = "shown";
                } else if (
                    this._state === "idle" &&
                    this._lastTarget &&
                    this._tip.style.display !== "none"
                ) {
                    this._requestShow(this._lastTarget, undefined, false);
                }
            }
            return;
        }
        if (!this._isOwned(target)) return;
        // 同目标内部移动（子元素间伪入场）：已显示/已计时则忽略
        if (target === this._currentTarget && (this._state === "shown" || this._state === "waiting-show")) {
            return;
        }
        this._requestShow(target, undefined, false);
    };

    private _handleLeave = (e: Event): void => {
        if (!this.enabled) return;
        const source = e.target as Element | null;
        const related = (e as FocusEvent).relatedTarget as Element | null;
        const target = source?.closest?.("[data-tooltip]") as HTMLElement | null;
        if (!target) {
            // 浮层内移出（related 不回到浮层）：可交互 tooltip 的出口——延迟隐藏
            if (
                this._tip &&
                source != null &&
                this._tip.contains(source) &&
                !(related && this._tip.contains(related))
            ) {
                this._scheduleHide();
            }
            return;
        }
        if (target !== this._currentTarget) return;
        if (!this._isOwned(target)) return;
        // relatedTarget 仍在触发元素内（内部伪离场）或已移入浮层：不进入隐藏流程
        if (related && (target.contains(related) || this._tip?.contains(related))) return;
        if (this._state === "waiting-show") {
            // 显示延迟期间移出：取消计时回 idle
            this._cancelPendingShow();
            return;
        }
        if (this._state !== "shown") return;
        this._scheduleHide();
    };

    /** 延迟隐藏出口（触发元素移出与浮层移出共用）：hideDelay 计时后 _hide（0 = 立即） */
    private _scheduleHide(): void {
        const { hideDelay } = this._resolveOptions({});
        if (hideDelay > 0) {
            this._clearTimer("_hideTimer");
            this._state = "waiting-hide";
            this._hideTimer = setTimeout(() => {
                this._hideTimer = null;
                this._hide(true);
            }, hideDelay);
        } else {
            this._hide(true);
        }
    }

    // ── 显示/隐藏管道 ──

    /**
     * 显示请求（委托与命令式唯一入口）：解析属性 → 空内容静默 → showDelay 计时 → 渲染显示。
     * shown/waiting-hide 状态下的新目标 = 单例切换（取消在播离场，直接换内容重定位）。
     */
    private _requestShow(target: HTMLElement, override: TooltipOptions | undefined, immediate: boolean): void {
        const warn = (m: string) => this.engine.logger.warn(m);
        // 命令式 content 显式注入时优先于属性解析（决策 18：无 DOM 属性也能注入内容）
        const parsed =
            override?.content != null
                ? { content: override.content, options: {} as TooltipOptions }
                : parseTooltipValue(target.getAttribute("data-tooltip") ?? "", warn);
        if (!parsed) return; // 空值/解析失败：静默不显示（决策 6 空值语义）
        const options = this._resolveOptions(parsed.options, override);
        const sanitize = this.engine.options.sanitizer ?? sanitizeHtml;
        const content = sanitize(String(parsed.content));
        if (!content.trim()) return;

        this._clearTimers();
        // 单例切换：shown/waiting-hide 下的新目标、或离场动画播中（idle 且浮层可见——鼠标
        // 回到浮层的恢复路径）——取消在播离场（cancel 同步完成 onDone：display:none + cleanup），
        // 随后全新显示
        if (
            this._state === "shown" ||
            this._state === "waiting-hide" ||
            (this._state === "idle" && this._tip && this._tip.style.display !== "none")
        ) {
            this._teardownTip(false);
        }
        this._currentTarget = target;

        const showDelay = immediate ? (override?.showDelay ?? options.showDelay) : options.showDelay;
        if (showDelay > 0) {
            this._state = "waiting-show";
            this._showTimer = setTimeout(() => {
                this._showTimer = null;
                this._show(target, content, options);
            }, showDelay);
        } else {
            this._show(target, content, options);
        }
    }

    /** tooltip 箭头默认让位间距（px）：载体 10×10 菱形露出高 ≈8.5px（半对角，视觉大于 overlay
     *  的 6px 让位），尖端轻微搭住锚边缘（越界 ≈0.5px）——styles.ts 的载体尺寸与覆盖层同心
     *  嵌入（8.49px < padding 7 + 行盒留白）与此值配套，调整须同步 */
    static readonly ARROW_DEFAULT_OFFSET = 8;

    /** 渲染 + 定位 + 进场动画 + show 广播（此刻才真正切换状态为 shown） */
    private _show(target: HTMLElement, content: string, options: ResolvedOptions): void {
        if (this._currentTarget !== target) return; // 计时期间目标已切换
        const tip = this._ensureTip();
        this._renderTip(tip, options, content);
        tip.style.display = "block";
        // 箭头开启且未显式配置 offset → tooltip 侧默认让位 8px（12×12 载体配套，露出更大——
        // 通用底座的 6px 默认是 overlay 的 8×8 载体几何，不适用）
        const position =
            options.offset == null && options.arrow !== false
                ? { ...options, offset: TooltipManager.ARROW_DEFAULT_OFFSET }
                : options;
        applyFloatingPosition(
            target,
            tip,
            position,
            (fn) => this._cleanups.push(fn),
            {
                placementAttr: TOOLTIP_PLACEMENT_ATTR,
                arrowSelector: `:scope > .${TOOLTIP_ARROW_CLASS}`,
            },
        );
        this._applyOverflowClamp(tip);
        const resolved = resolveAnimate(options.animate);
        this._activeLeave = resolved.leave;
        this.engine.animate.enter(tip, resolved.enter);
        this._state = "shown";
        this._emit("tooltip:show", target);
        this._startWatch(target);
    }

    /**
     * 隐藏（决策 17：一切隐藏路径终点）。`runLeave` = 是否播离场动画（stop 断连兜底等
     * 场景同步摘除）。hide 广播在发起时（语义对齐 overlay:close 的请求时点）。
     */
    private _hide(runLeave: boolean): void {
        this._clearTimers();
        this._stopWatch();
        const target = this._currentTarget;
        this._state = "idle";
        this._currentTarget = null;
        if (target) this._lastTarget = target; // 离场播中回到浮层的恢复目标
        if (!this._tip) return;
        if (target) this._emit("tooltip:hide", target);
        const leave = runLeave ? this._activeLeave : null;
        const started = leave ? this.engine.animate.leave(this._tip, leave, () => this._teardownTip(true)) : false;
        if (!started) this._teardownTip(true);
    }

    /** 浮层复位：display:none + 定位 cleanup（autoUpdate 循环必须停，否则残留滚动监听） */
    private _teardownTip(clearTarget: boolean): void {
        for (const fn of this._cleanups) fn();
        this._cleanups = [];
        if (this._tip) {
            this.engine.animate.cancel(this._tip); // 在播离场抢占（cancel = 同步完成 onDone 重入守卫）
            this._tip.style.display = "none";
        }
        if (clearTarget) this._currentTarget = null;
    }

    // ── 断连兜底（决策 13）：显示期间 rAF 检查 isConnected——DOM 移除无事件可感知 ──

    private _startWatch(target: HTMLElement): void {
        this._stopWatch();
        if (typeof requestAnimationFrame === "undefined") return; // 无 rAF 环境（SSR 等）无兜底，文档注明
        // 基线 = 显示瞬间的连接态：只对「曾连接 → 断开」的跳变触发兜底——
        // detached 树内的悬停/命令式 show（测试挂载、离屏构建）不该被误杀
        let prevConnected = target.isConnected;
        const loop = () => {
            if (this._currentTarget !== target) return; // 已切换/已隐藏
            if (this._state !== "shown" && this._state !== "waiting-hide") return;
            const connected = target.isConnected;
            if (prevConnected && !connected) {
                this._hide(false); // 断连立即同步隐藏（无动画——锚已不在）
                return;
            }
            prevConnected = connected;
            this._rafId = requestAnimationFrame(loop);
        };
        this._rafId = requestAnimationFrame(loop);
    }

    private _stopWatch(): void {
        if (this._rafId != null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }

    // ── 解析/归属/工具 ──

    /**
     * 大内容溢出截断（ADR-0061 决策 8 maxWidth/maxHeight）：内容先按 max-width wrap、
     * 超出 max-height 的部分经 **-webkit-line-clamp** 截断并显示省略号（…）——对纯文本与
     * 富 HTML 内联内容均优雅（浏览器渲染省略号，无需 JS 拼接）。
     *
     * 显示帧**同步测量**（display block 后读 clientHeight 强制 reflow，无闪烁）：
     * `scrollHeight > clientHeight`（有溢出）→ 行数 = ⌊内容区高 / 行高⌋ 并切换 -webkit-box。
     * 无溢出保持默认 block（避免 -webkit-box 对无溢出内容的布局副作用）。
     * happy-dom 等无布局环境 clientHeight=0 → 判定无溢出跳过（真实浏览器行为为准）。
     */
    private _applyOverflowClamp(tip: HTMLElement): void {
        if (tip.scrollHeight <= tip.clientHeight + 1) return;
        const cs = window.getComputedStyle(tip);
        const linePx = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5 || 19.5;
        const contentH = tip.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
        const lines = Math.max(1, Math.floor(contentH / linePx));
        // 矩形裁剪只在此路径打开（-webkit-line-clamp 生效前提）：箭头露出段必被一并裁掉，
        // 显式移除载体防边缘残影（ADR-0061 修订 9）
        tip.style.overflow = "hidden";
        tip.querySelector(`:scope > .${TOOLTIP_ARROW_CLASS}`)?.remove();
        tip.style.display = "-webkit-box";
        tip.style.webkitBoxOrient = "vertical";
        tip.style.setProperty("-webkit-line-clamp", String(lines));
    }

    private _resolveOptions(elementLayer: TooltipOptions, override?: TooltipOptions): ResolvedOptions {
        return {
            ...TOOLTIP_DEFAULTS,
            ...this._globalOptions,
            ...elementLayer,
            ...override,
        } as ResolvedOptions;
    }

    /**
     * 嵌套引擎归属过滤（决策 13）：命中元素须属本引擎树（`data-autospark` 根标识，
     * ADR-0060）或注册的额外监听点（overlay 容器——渲染产物不具根标识，豁免）。
     */
    private _isOwned(target: Element): boolean {
        if (target.closest("[data-autospark]") === this.engine.el) return true;
        for (const root of this._extraRoots) {
            if (root.contains(target)) return true;
        }
        return false;
    }

    /** 单例浮层懒建（容器随之懒建；初建 display:none——styles.ts 默认态）。容器同时注册为
     *  委托监听点——浮层内 mouseover/out 事件（可交互 tooltip 的取消/出口）只有容器能收到：
     *  浮层挂 body 下，引擎根监听不可达（overlay 容器同构先例）。 */
    private _ensureTip(): HTMLElement {
        let tip = this._tip;
        if (!tip) {
            tip = document.createElement("div");
            tip.className = TOOLTIP_CLASS;
            const container = getTooltipContainer(this.engine)!;
            container.appendChild(tip);
            this.attachDelegationRoot(container);
            this._tip = tip;
        }
        return tip;
    }

    /** 重绘浮层（每次显示全量重置——上一目标的类名/边框标记/箭头/内容/clamp 状态不残留） */
    private _renderTip(tip: HTMLElement, options: ResolvedOptions, content: string): void {
        tip.className = options.className ? `${TOOLTIP_CLASS} ${options.className}` : TOOLTIP_CLASS;
        if (options.border !== false) tip.setAttribute(TOOLTIP_BORDER_ATTR, "");
        else tip.removeAttribute(TOOLTIP_BORDER_ATTR);
        // placement 不清空：保留上一方向（新方向由定位管线写回）——箭头侧 padding 依赖该
        // 属性，清空会让 padding 闪回基础值、显示首帧内容跳动
        // 大内容约束（决策 8 maxWidth/maxHeight）：元素级 inline 覆盖 CSS 变量默认（70vw/70vh）；
        // 数字 = px、字符串原样透传 CSS
        tip.style.maxWidth = options.maxWidth != null ? formatSize(options.maxWidth) : "";
        tip.style.maxHeight = options.maxHeight != null ? formatSize(options.maxHeight) : "";
        tip.style.removeProperty("display"); // 恢复 styles.ts 默认 none（display 由 _show/_hide 管理）
        tip.style.removeProperty("overflow"); // 上一目标若走了截断路径，不得残留裁剪（会剪掉箭头露出段）
        tip.style.removeProperty("-webkit-line-clamp");
        tip.style.removeProperty("-webkit-box-orient");
        tip.innerHTML = "";
        if (options.arrow !== false) {
            const arrow = document.createElement("div");
            arrow.className = TOOLTIP_ARROW_CLASS;
            tip.appendChild(arrow);
        }
        tip.insertAdjacentHTML("beforeend", content);
    }

    /** 双通道事件（决策 17）：引擎总线 + 浮层元素 dispatchEvent（body 侧，树内收不到冒泡） */
    private _emit(type: "tooltip:show" | "tooltip:hide", el: HTMLElement): void {
        const detail = { el, tip: this._tip! };
        this.engine.emit(type, detail);
        this._tip?.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
    }

    private _cancelPendingShow(): void {
        this._clearTimer("_showTimer");
        if (this._state === "waiting-show") {
            this._state = "idle";
            this._currentTarget = null;
        }
    }

    private _clearTimer(key: "_showTimer" | "_hideTimer"): void {
        if (this[key] != null) {
            clearTimeout(this[key]!);
            this[key] = null;
        }
    }

    private _clearTimers(): void {
        this._clearTimer("_showTimer");
        this._clearTimer("_hideTimer");
    }
}

/** 合并后的生效配置（默认层齐全，供动画/定位直接消费） */
type ResolvedOptions = TooltipOptions & typeof TOOLTIP_DEFAULTS;

/** 尺寸值格式化（maxWidth/maxHeight）：数字 → px，字符串原样透传 CSS */
function formatSize(v: number | string): string {
    return typeof v === "number" ? `${v}px` : v;
}
