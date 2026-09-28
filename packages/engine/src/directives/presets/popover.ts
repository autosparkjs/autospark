import type { AutoSpark } from "../../engine";
import type { OverlayConfig } from "../../overlay/types";
import { normalizeAtConfig } from "../../overlay/types";
import { registerShellStyles } from "../../overlay/wrappers";
import { OverlayDirective } from "./overlay";

/**
 * x-popover：覆盖物消费者的**悬浮形态**（ADR-0060）——{@link OverlayDirective} 薄子类。
 *
 * 与 x-dialog 的唯一形态差异是**触发模型**：宿主不再是纯声明点（家族「纯状态驱动」原则的
 * 显式偏离，ADR-0060），而是**悬浮触发器**——mouseenter 显示、指针离开「宿主∪面板」共享
 * hover 域后关闭。查找/防护/等待/props/配置链/插槽/锚定定位全部继承基座。
 *
 * - **触发**：mouseenter/mouseleave 语义（不冒泡——悬浮意图，非字面 mouseover）；
 *   `delayShow`（默认 200ms）悬浮意图延迟、`delayHide`（默认 150ms）关闭宽限，均 0 即无延迟，
 *   经 `getOption` 三层链读取（`x-popover-options` 整包 / 成员属性表达式 / 宿主选项）；
 * - **共享 hover 域**（ADR-0060）：宿主与面板在 DOM 上分离（面板渲染进 body 容器），双向
 *   mouseenter/mouseleave 让「宿主↔面板」互移不闪关；leave 的 relatedTarget 与 delayHide
 *   到期是仅有的两个关闭判定点，域内豁免、域外关闭；
 * - **hover 链（嵌套）**：子 popover 声明在父面板内（面板同在 body 容器、DOM 兄弟），经
 *   document 级打开中注册表把后代 popover 的域并入祖先域——指针位于任一后代 popover 上时
 *   祖先保持打开；后代关闭（含 ESC 关子）后祖先经最后指针坐标 `elementFromPoint` 重估，
 *   已出域才关闭（防 ESC 关子后父级残留）；
 * - **值语义**：指令值不参与驱动（悬浮模型无 visible 真相源），非空值 warn；
 *   同宿主多 popover 声明 warn（驱动源重合将同开），不去重不拦截。
 *
 * 关闭触点：共享域离开（delayHide 宽限）+ ESC（打开栈栈顶，机制继承）。无 visible 写回
 * （`_makeCloseRequest` 恒 null——关闭即 UI 关闭，无状态善后）。
 */
/** delayShow 默认（ms）：悬浮意图延迟——快速掠过宿主不触发 */
const DEFAULT_DELAY_SHOW = 200;
/** delayHide 默认（ms）：宿主↔面板间隙穿越与手部抖动的关闭宽限 */
const DEFAULT_DELAY_HIDE = 150;

/**
 * 打开中的 popover 消费者注册表（document 级静态，多 engine 共享——对齐打开栈先例）：
 * hover 链判定（后代 popover 的域并入祖先域）与「后代关闭后祖先重估」的基础设施。
 * 登记于实例打开（`_attachInstance`）、移除于实例关闭/消费者销毁——恒只含活跃消费者。
 */
const openPopovers = new Set<PopoverDirective>();

export class PopoverDirective extends OverlayDirective {
    /** 形态键（ADR-0062）：引擎级默认 shell 的配置键（options.overlay.popover.shell） */
    protected override readonly overlayKind = "popover";

    /** warn 消息前缀指令名：继承基座的 warn（未找到组件/props 等）按自身指令名提示 */
    protected override directiveLabel = "x-popover";

    /** 类级初始化：注入 shell 默认视觉样式（幂等；含裸面板 z-index，样式随面板 shell 迁移 ADR-0062） */
    static override initialize(_engine: AutoSpark): void {
        registerShellStyles();
    }

    // ── 触发状态 ──────────────────────────────────────────────────────

    /** delayShow 计时器（悬浮意图延迟；leave 取消） */
    private _showTimer: ReturnType<typeof setTimeout> | null = null;
    /** delayHide 计时器（关闭宽限；域内 mouseenter 取消） */
    private _hideTimer: ReturnType<typeof setTimeout> | null = null;
    /** 指针最后已知坐标（祖先重估 elementFromPoint 反查用——实例关闭后指针未动坐标仍准确） */
    private _lastPointer: { x: number; y: number } | null = null;
    /** 活跃实例的 overlay:close 广播退订（实例关闭/消费者销毁时退订） */
    private _unsubClose: (() => void) | null = null;

    override created(): void {
        // 基座：选项表达式统一管道 + props 通道（ADR-0007 修订 / ADR-0052 v2.3）
        super.created();
        if (!this.attr) {
            this.warn(
                "x-popover: 缺少组件名 attr（x-popover:名称），无法查找覆盖物组件，指令被忽略",
            );
            return;
        }
        // 悬浮触发模型下指令值不参与驱动（ADR-0060）：显示由宿主 mouseenter 驱动，
        // 无 visible 真相源——非空值按误用提示（失效可发现，不静默吞）
        const raw = String(this.value ?? "").trim();
        if (raw) {
            this.warn(
                `x-popover:${this.attr}: 指令值不参与驱动（悬浮触发模型，显示由宿主 mouseenter 驱动），已忽略值 "${raw}"`,
            );
        }
        // 同宿主多 popover（对齐基座 singleton=false 的「用户错误不去重」哲学）：悬浮驱动源
        // 唯一重合——同一份 hover 将同时打开全部面板，warn 可发现、不拦截
        const siblings = this.binding.directives.filter((d) => d instanceof PopoverDirective);
        if (siblings.length > 1) {
            this.warn(
                `x-popover:${this.attr}: 同宿主声明了 ${siblings.length} 个 popover 消费者，悬浮驱动源重合，hover 将同时打开全部面板`,
            );
        }
        // 触发监听：mouseenter/mouseleave 不冒泡——悬浮意图语义（字面 mouseover 会在宿主
        // 子元素间移动时反复触发）。宿主监听随宿主 DOM 生死，destroy 显式摘除。
        this.el.addEventListener("mouseenter", this._onEnter);
        this.el.addEventListener("mouseleave", this._onLeave);
    }

    /** 消费者销毁：清触发设施 + 打开中的实例直接请求关闭（无写回目标） */
    override destroy(): void {
        this._teardownTriggers();
        const inst = this._overlayInstance;
        this._overlayInstance = null;
        if (inst && !inst.destroyed && inst.visible) inst.requestClose("consumer-destroyed");
        super.destroy();
    }

    // ── 形态差异（对基座的全部覆写点）──────────────────────────────────

    /** 打开：基座实例化后登记面板监听 + 注册表 + 关闭订阅（等待重试路径复用同一后置登记） */
    protected override _open(): void {
        this._unsubInstanceClose();
        this._instantiate(this.overlayName, this._props);
        this._attachInstance();
    }

    /** 等待的组件就绪重试：基座已守卫 _driveOn（等待期间 hover 已离开则放弃），补后置登记 */
    protected override _retryPendingComponent(): void {
        super._retryPendingComponent();
        this._attachInstance();
    }

    /** 默认锚 = 宿主元素自身（元素引用两栖形态）；placement 默认 'bottom' + flip 兜底。
     *  `x-popover-options.at` 显式配置时**成员级覆盖**：用户写出的成员生效，缺省成员回退
     *  （selector 缺省宿主、placement 缺省 bottom）——部分锚对象（如只写 placement）不丢锚、
     *  不退居中（换锚只改位置，不改变触发关系——ADR-0060） */
    protected override _resolveConfig(optionLayer: Record<string, any>): OverlayConfig {
        const config = super._resolveConfig(optionLayer);
        const at = normalizeAtConfig(config.at) ?? {};
        at.selector ??= this.el;
        at.placement ??= "bottom";
        config.at = at;
        return config;
    }

    // ── 悬浮触发模型（ADR-0060）───────────────────────────────────────

    /** 活跃实例存活（已开且未销毁） */
    private _isInstanceAlive(): boolean {
        const inst = this._overlayInstance;
        return !!inst && !inst.destroyed && inst.visible;
    }

    /** 宿主进入：取消挂起关闭 → 已开防重 → delayShow 计时（0 立即）打开 */
    private _onEnter = (e: MouseEvent): void => {
        this._recordPointer(e);
        this._clearHideTimer();
        if (this._isInstanceAlive()) return;
        const delay = this._resolveDelay("delayShow", DEFAULT_DELAY_SHOW);
        this._clearShowTimer();
        if (delay > 0) {
            this._showTimer = setTimeout(() => {
                this._showTimer = null;
                this._openNow();
            }, delay);
        } else {
            this._openNow();
        }
    };

    /** 宿主离开：show 计时取消；relatedTarget 已入域（面板/后代 popover）豁免，否则 delayHide 宽限后关 */
    private _onLeave = (e: MouseEvent): void => {
        this._recordPointer(e);
        this._clearShowTimer();
        this._scheduleClose(e);
    };

    /** 面板进入：取消挂起关闭（宿主↔面板互移不闪关的对面侧） */
    private _onPanelEnter = (e: MouseEvent): void => {
        this._recordPointer(e);
        this._clearHideTimer();
    };

    /** 面板离开：与宿主离开同一判定（relatedTarget 域内豁免 / delayHide 宽限） */
    private _onPanelLeave = (e: MouseEvent): void => {
        this._recordPointer(e);
        this._scheduleClose(e);
    };

    private _openNow(): void {
        this._driveOn = true;
        this._open();
    }

    /**
     * 离开调度：relatedTarget 在共享 hover 域（宿主∪面板∪后代 popover 域）内豁免并清除
     * 挂起关闭；否则 delayHide 到期关闭（到期不再重估——宽限期内回到域内会触发域内
     * mouseenter 已清定时器）。
     */
    private _scheduleClose(e: MouseEvent): void {
        const related = e.relatedTarget instanceof Element ? e.relatedTarget : null;
        if (related && this._inZone(related)) {
            this._clearHideTimer();
            return;
        }
        const delay = this._resolveDelay("delayHide", DEFAULT_DELAY_HIDE);
        this._clearHideTimer();
        if (delay > 0) {
            this._hideTimer = setTimeout(() => {
                this._hideTimer = null;
                this._closeNow();
            }, delay);
        } else {
            this._closeNow();
        }
    }

    private _closeNow(): void {
        this._driveOn = false;
        this._close(); // 基座：UI 关闭（无写回目标）→ overlay:close 广播 → _onInstanceClosed 善后
    }

    /**
     * 共享 hover 域判定（ADR-0060 hover 链）：宿主 ∪ 活跃面板 ∪ 后代 popover 的域（递归）。
     * 后代 = 注册表中宿主落在本消费者域内的打开消费者——面板虽与宿主、父面板互为 DOM
     * 兄弟（body 容器），链判定让指针穿越「父面板→子宿主→子面板」全程不闪关。
     */
    private _inZone(target: Element | null): boolean {
        if (!target) return false;
        const zones = new Set<HTMLElement>();
        this._collectZone(zones);
        for (const z of zones) {
            if (z === target || z.contains(target)) return true;
        }
        return false;
    }

    /** 递归收集本消费者的完整 hover 域（into 去重兼防环） */
    private _collectZone(into: Set<HTMLElement>): void {
        into.add(this.el);
        const inst = this._overlayInstance;
        if (inst && !inst.destroyed && inst.el) into.add(inst.el);
        for (const other of openPopovers) {
            if (other === this || into.has(other.el)) continue;
            // 后代判定：其宿主落在我已收集的域（活跃面板或更深后代域）内
            for (const z of into) {
                if (z.contains(other.el)) {
                    other._collectZone(into);
                    break;
                }
            }
        }
    }

    /**
     * 后代关闭后的重估（防祖先残留）：指针最后已知坐标经 elementFromPoint 反查现命中元素，
     * 已出域才关闭。场景——ESC 关子后指针物理位于子面板原位置（父面板上方或其外），
     * mouseleave 已被链豁免、不会再触发，唯一可靠的重估时机是后代关闭通知。
     */
    private _reevaluate(): void {
        if (!this._isInstanceAlive()) return;
        const p = this._lastPointer;
        const hit =
            p && typeof document !== "undefined" ? document.elementFromPoint(p.x, p.y) : null;
        if (hit && this._inZone(hit)) {
            this._clearHideTimer();
            return;
        }
        this._closeNow();
    }

    /**
     * 实例关闭统一善后（ESC/hover 离开/close action/销毁全路径）：注册表移除 + 清触发
     * 设施 + 同步驱动态 + 通知祖先链重估（ESC 关子后父不残留）。订阅在 close 开始的
     * overlay:close 广播上触发——此刻面板 DOM 尚在（leave 动画未播）。
     */
    private _onInstanceClosed(): void {
        this._unsubInstanceClose();
        openPopovers.delete(this);
        this._clearHideTimer();
        this._clearShowTimer();
        this._driveOn = false;
        this._overlayInstance = null;
        this._notifyAncestors();
    }

    /** 通知祖先：本消费者宿主落在其活跃面板子树内的打开消费者逐个重估 */
    private _notifyAncestors(): void {
        for (const other of openPopovers) {
            if (other === this) continue;
            const panel = other._overlayInstance?.el;
            if (panel && panel.contains(this.el)) other._reevaluate();
        }
    }

    // ── 内部设施 ──────────────────────────────────────────────────────

    /** 实例打开后的后置登记：面板监听（共享域对面侧）+ 注册表 + overlay:close 订阅 */
    private _attachInstance(): void {
        const inst = this._overlayInstance;
        if (!inst || inst.destroyed || !inst.el) return; // 未命中等待路径：实例未产生，重试再登记
        inst.el.addEventListener("mouseenter", this._onPanelEnter);
        inst.el.addEventListener("mouseleave", this._onPanelLeave);
        openPopovers.add(this);
        const sub = (this.engine as any).on("overlay:close", (m: any) => {
            const payload = m?.payload ?? m;
            if (payload?.instance === inst) this._onInstanceClosed();
        });
        this._unsubClose = typeof sub === "function" ? sub : () => sub.off();
    }

    /** 读取延迟配置（getOption 三层链：成员表达式 > 指令选项 > 宿主选项），非法值 warn 回退默认 */
    private _resolveDelay(key: "delayShow" | "delayHide", fallback: number): number {
        const raw = this.getOption(key);
        if (raw === undefined || raw === null || raw === "") return fallback;
        const n = Number(raw);
        if (!Number.isFinite(n) || n < 0) {
            this.warn(
                `x-popover:${this.attr}: ${key} 须为非负数字（ms），已按默认 ${fallback}ms 处理`,
            );
            return fallback;
        }
        return n;
    }

    private _recordPointer(e: MouseEvent): void {
        this._lastPointer = { x: e.clientX, y: e.clientY };
    }

    private _clearShowTimer(): void {
        if (this._showTimer) {
            clearTimeout(this._showTimer);
            this._showTimer = null;
        }
    }

    private _clearHideTimer(): void {
        if (this._hideTimer) {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
        }
    }

    private _unsubInstanceClose(): void {
        if (this._unsubClose) {
            this._unsubClose();
            this._unsubClose = null;
        }
    }

    /** 触发设施整体清理（消费者销毁）：宿主监听 + 双计时器 + 关闭订阅 + 注册表 */
    private _teardownTriggers(): void {
        this.el.removeEventListener("mouseenter", this._onEnter);
        this.el.removeEventListener("mouseleave", this._onLeave);
        this._clearShowTimer();
        this._clearHideTimer();
        this._unsubInstanceClose();
        openPopovers.delete(this);
    }
}
