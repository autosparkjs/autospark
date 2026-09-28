import type { AutoSpark } from "../../engine";
import type { OverlayInstanceOptions, OverlayPositionerContext } from "../../overlay/instance";
import type { OverlayConfig } from "../../overlay/types";
import { normalizeAtConfig } from "../../overlay/types";
import { resolveAnchorEl } from "../../overlay/anchor";
import { getOverlayContainer } from "../../overlay/container";
import { registerShellStyles } from "../../overlay/wrappers";
import { VisibleOverlayDirective } from "./visible-overlay";
import type { ResizeDirection } from "./resize";

/**
 * x-drawer：覆盖物消费者的**贴边抽屉形态**（ADR-0063）——{@link VisibleOverlayDirective}
 * 平级薄子类（与 x-dialog 共享 visible 驱动四形态，ADR-0052 决策 6/7/8）。
 *
 * 双定位模式（经实例定位策略钩子整体接管，ADR-0063 修订——两种模式同构语义：
 * 「终态贴边固定 + 主流位移滑入」）：
 * - **屏幕贴边**（默认，无 `at`）：面板 fixed 贴视口对应边（贴边三边 inset），贴边轴
 *   全屏展开、短轴尺寸走 `--autospark-drawer-size`（默认 280px，CSS 变量可调）；
 * - **元素贴边锚定**（`at.selector` 命中）：面板终态贴锚元素**内侧**对应边（`right` =
 *   右缘对齐锚右缘、面板在锚内），恒不越界（外侧贴缘在锚旁空间不足时会伸到容器外）；
 *   **长轴 = 锚边长**（随锚/视口变化重同步），短轴同屏幕模式。
 *
 * placement 语义（复用 `at.placement`，四主方向）：
 * - 默认 `right`（不配置即 right，心智最简单）；
 * - 两模式只认 `top|bottom|left|right`——`auto` 与 `-start/-end` 后缀静默归一
 *   （内侧终态无「选位」概念；长轴铺满对齐后缀无意义）。
 *
 * 形态默认：
 * - **模态默认、`mask: false` 可关**（官方 mask 选项，ADR-0062）：无遮罩时关闭触点仅
 *   ESC / close action / 状态归假（outside-click 关闭是家族 fast-follow，不做）；
 *   `closeOnMask` 无遮罩时静默无效；
 * - **默认动画 `'drawer'`**：遮罩淡入淡出 + 面板位移滑入滑出（translate ±100%，主流
 *   drawer 形态语言，样式在 drawer-shell）；用户显式配置 `animate` 时整键尊重；
 * - **锚定无箭头**（drawer-shell 不渲染载体，`at.arrow: true` 静默无效）；`flip` /
 *   `offset` / `shift` 等浮动定位子键在内侧展开模型下无意义，静默忽略；
 * - **锚定未命中回退屏幕贴边**（非家族「退居中」——居中对抽屉形态无意义，ADR-0063 有意偏离）。
 *
 * 嵌套（drawer 内再开 drawer）零新机制：每次打开新实例（决策 9）DOM 追加序天然层叠、
 * ESC 打开栈只关栈顶（决策 20）、递归深度防护共享——子 drawer 声明在父组件模板内即可。
 */
/** 屏幕贴边合法主方向（锚定归一同款；非法值/缺省/auto 一律按默认方向处理） */
const DRAWER_MAIN_DIRECTIONS = new Set(["top", "bottom", "left", "right"]);
/** 屏幕贴边默认方向（业界惯例：右侧抽屉） */
const DEFAULT_DRAWER_PLACEMENT = "right";

export class DrawerDirective extends VisibleOverlayDirective {
    /** 形态键（ADR-0062）：引擎级默认 shell 的配置键（options.overlay.drawer.shell） */
    protected override readonly overlayKind = "drawer";

    /** warn 消息前缀指令名：继承基座的 warn（未找到组件/props 等）按自身指令名提示 */
    protected override directiveLabel = "x-drawer";

    /** 类级初始化：注入 shell 默认视觉样式（幂等；含抽屉形态与 'drawer' 动画 CSS） */
    static override initialize(_engine: AutoSpark): void {
        registerShellStyles();
    }

    /** 生效配置 stash（_resolveConfig 与 _modalMask/_positioner 同一次打开内先后执行） */
    private _config: OverlayConfig | null = null;

    // ── 折叠把手（ADR-0063 修订）──────────────────────────────────────

    /** 把手元素（实例外常驻——面板销毁后存活；null = 未建/已销毁） */
    private _toggleEl: HTMLElement | null = null;
    /** 最近 visible 驱动态（把手位置/箭头/裁切的分派依据） */
    private _toggleOn = false;
    /** 把手的视口监听清理（destroy 时摘除） */
    private _toggleCleanup: (() => void) | null = null;
    /** 展开态位置对齐帧句柄（与面板 enter 切换帧同调度；destroy/重入时撤销） */
    private _toggleFrame: number | null = null;
    private _toggleTimer: ReturnType<typeof setTimeout> | null = null;

    /**
     * 折叠把手挂载（ADR-0063 修订）：`toggle` 默认开启、`false` 显式关闭；仅反应式
     * （简单路径）形态生效——字面量/表达式形态状态不可写，把手点击无意义，不建。
     * 把手挂覆盖物容器（z 层级同源），圆心恒骑面板活动边线，几何见 `_positionToggle`。
     */
    override created(): void {
        super.created();
        if (this.options?.toggle === false) return;
        if (!this._visiblePath) return;
        const container = getOverlayContainer(this.engine);
        if (!container) return;
        const el = document.createElement("div");
        el.className = "autospark-drawer-toggle";
        el.addEventListener("click", () => this._onToggleClick());
        this._toggleEl = el;
        // 先定位再插入（避免 transition 从 0,0 滑到首位的闪移）
        this._positionToggle();
        container.appendChild(el);
        const onViewport = () => this._positionToggle();
        window.addEventListener("resize", onViewport);
        window.addEventListener("scroll", onViewport, true);
        this._toggleCleanup = () => {
            window.removeEventListener("resize", onViewport);
            window.removeEventListener("scroll", onViewport, true);
        };
    }

    /** 把手随指令销毁摘除（宿主脱离 / scope 死亡 / engine destroy 均达此处） */
    override destroy(): void {
        this._toggleCleanup?.();
        this._toggleCleanup = null;
        this._cancelToggleSync();
        this._toggleEl?.remove();
        this._toggleEl = null;
        super.destroy();
    }

    /**
     * 展开/折叠切换的把手同步点：**与面板动画同帧启动**。面板 enter 的 from→to
     * 切换经 rAF + 宏任务（新插入元素插入帧内切换不产生 transition，见 animate 机制），
     * 把手位置更新须对齐同一调度——立即更新会让把手先行 1~2 帧，视觉脱节；
     * 面板 leave 同步启动（已在文档中渲染），折叠保持立即更新。
     */
    protected override _open(): void {
        super._open();
        this._toggleOn = true;
        this._cancelToggleSync();
        this._toggleFrame = requestAnimationFrame(() => {
            this._toggleTimer = setTimeout(() => {
                this._toggleFrame = null;
                this._toggleTimer = null;
                this._positionToggle();
            }, 0);
        });
    }

    protected override _close(): void {
        super._close();
        this._toggleOn = false;
        this._cancelToggleSync();
        this._positionToggle();
    }

    /** 撤销待决的展开态对齐调度（重入开合/销毁时防过期位置写入） */
    private _cancelToggleSync(): void {
        if (this._toggleFrame != null) {
            cancelAnimationFrame(this._toggleFrame);
            this._toggleFrame = null;
        }
        if (this._toggleTimer != null) {
            clearTimeout(this._toggleTimer);
            this._toggleTimer = null;
        }
    }

    /**
     * 把手点击（折叠 ≡ visible 归假，无第三态）：展开态走实例请求关闭（与 ESC/遮罩
     * 同链——含简单路径回写）；折叠态直接写回 `true`（状态是唯一真相源，watch 驱动重开）。
     */
    private _onToggleClick(): void {
        if (this._toggleOn) {
            const inst = this._overlayInstance;
            if (inst && !inst.destroyed && inst.visible) inst.requestClose("toggle");
        } else {
            this._writeVisible(true);
        }
    }

    /**
     * 把手定位（fixed + left/top，CSS transition .3s 与面板同曲线滑移）：
     * - 圆心恒骑「活动边线」——展开态 = 面板**开口边线**（面板布局盒对侧边，offset 系
     *   布局值不含 transform，enter 动画期取值即终态）；折叠态 = 贴边线（屏幕模式 =
     *   视口边；锚定模式 = 锚内侧对应边）；
     * - 交叉轴沿边线居中（屏幕模式 = 视口中心；锚定模式 = 锚边中点）；
     * - 折叠态 `data-collapsed`（箭头翻转 + 半圆裁切的 CSS 钩子——朝外一半被裁，
     *   与屏幕模式「屏外不可见」统一为显式 clip-path）。
     */
    private _positionToggle(): void {
        const el = this._toggleEl;
        if (!el) return;
        const dir = this._screenPlacement();
        el.setAttribute("data-overlay-placement", dir);
        el.toggleAttribute("data-collapsed", !this._toggleOn);
        const horizontal = dir === "left" || dir === "right";
        // 半径（样式注入前 offsetWidth 为 0，回退默认 24px）
        const half = (horizontal ? el.offsetWidth || 24 : el.offsetHeight || 24) / 2;
        // 贴边线（折叠位）+ 居中基准：锚定模式取锚 rect，屏幕模式取视口
        const at = this._effectiveAt();
        const anchorEl = at ? resolveAnchorEl(at.selector, this.el) : null;
        const ar = anchorEl?.getBoundingClientRect();
        const vw = document.documentElement.clientWidth;
        const vh = document.documentElement.clientHeight;
        const edgeLine = ar
            ? (dir === "right" ? ar.right : dir === "left" ? ar.left : dir === "top" ? ar.top : ar.bottom)
            : (dir === "right" ? vw : dir === "left" ? 0 : dir === "top" ? 0 : vh);
        const crossCenter = ar
            ? (horizontal ? ar.top + ar.height / 2 : ar.left + ar.width / 2)
            : (horizontal ? vh / 2 : vw / 2);
        // 开口边线（展开位）：面板布局盒（offset 系不含 transform）对侧边
        let line = edgeLine;
        const panel = this._overlayInstance?.panel;
        if (this._toggleOn && panel) {
            if (dir === "right") line = panel.offsetLeft;
            else if (dir === "left") line = panel.offsetLeft + panel.offsetWidth;
            else if (dir === "top") line = panel.offsetTop + panel.offsetHeight;
            else line = panel.offsetTop;
        }
        if (horizontal) {
            el.style.left = `${line - half}px`;
            el.style.top = `${crossCenter - half}px`;
        } else {
            el.style.top = `${line - half}px`;
            el.style.left = `${crossCenter - half}px`;
        }
    }

    /**
     * 配置链出口叠加（ADR-0063）：
     * - 默认动画 `'drawer'`：仅当用户未在任一层（静态整包 / 成员表达式）显式配置 animate
     *   时注入——OVERLAY_DEFAULTS.animate='fade' 恒被合入，不能以合并产物判「未配置」；
     * - stash 生效配置（mask 选项读取源 + 屏幕贴边方向读取源）。
     */
    protected override _resolveConfig(optionLayer: Record<string, any>): OverlayConfig {
        const userAnimated =
            optionLayer.animate !== undefined || this._optionExprValues?.animate !== undefined;
        const config = super._resolveConfig(optionLayer);
        this._config = config;
        if (!userAnimated) config.animate = "drawer";
        return config;
    }

    /**
     * 模态默认、`mask: false` 可关（ADR-0063）：读官方 mask 选项（ADR-0062——遮罩显隐归
     * 引擎选项）。x-dialog 恒模态不受此影响（基座调用点按形态分派）。
     */
    protected override get _modalMask(): boolean {
        return this._config?.mask !== false;
    }

    /** 定位策略：屏幕贴边（默认/回退）+ 元素贴边锚定（长轴同步），ADR-0063 */
    protected override _positioner(): OverlayInstanceOptions["positioner"] {
        return (ctx) => this._positionDrawer(ctx);
    }

    // ── 定位（ADR-0063）──────────────────────────────────────────────

    /** 定位分派：锚定命中 → 元素贴边锚定；否则 → 屏幕贴边（at 配置了 selector 但未命中时 warn） */
    private _positionDrawer(ctx: OverlayPositionerContext): void {
        const { panel, anchor, anchorEl, registerCleanup, warn } = ctx;
        if (anchor && anchorEl) {
            this._applyAnchorEdge(panel, anchorEl, this._screenPlacement(), registerCleanup);
            return;
        }
        if (anchor) {
            // 有 at 配置但 selector 未命中：回退屏幕贴边（非家族「退居中」——抽屉居中无意义）
            warn(
                `x-drawer:${this.attr}: at "${String(anchor.selector ?? "")}" 未命中，退屏幕贴边（方向 ${this._screenPlacement()}，ADR-0063）`,
            );
        }
        this._applyScreenEdge(panel);
    }

    /**
     * 元素贴边锚定（ADR-0063 修订）：面板贴锚元素**内侧**对应边覆盖展开——placement 即
     * 展开起始边（`right` = 右缘对齐锚右缘、宽度向左展开朝容器中心），面板恒在锚内
     * 不越界。长轴 = 锚边长（随锚 resize / 视口 resize / 滚动重同步），短轴 inline
     * （{@link _shortAxisSize}）。展开起始边**固定**（不写对侧 inset），宽度/高度动画时
     * 另一缘随动——与屏幕贴边模式的展开语义同构。
     */
    private _applyAnchorEdge(
        panel: HTMLElement,
        anchorEl: HTMLElement,
        dir: string,
        registerCleanup: (fn: () => void) => void,
    ): void {
        const apply = () => {
            const r = anchorEl.getBoundingClientRect();
            // 长轴取 offset 系布局尺寸（getBoundingClientRect 在无布局环境不可靠）
            const long = (dir === "left" || dir === "right")
                ? `${anchorEl.offsetHeight}px`
                : `${anchorEl.offsetWidth}px`;
            // 清四向 inset 防方向切换残留（同实例重开方向可变）
            panel.style.left = panel.style.right = panel.style.top = panel.style.bottom = "";
            panel.style.position = "fixed";
            panel.style.margin = "0";
            if (dir === "left" || dir === "right") {
                // 左右：长轴 = 锚高；展开起始边固定（right 不写 left / left 不写 right）
                panel.style.top = `${r.top}px`;
                panel.style.height = long;
                panel.style.width = this._shortAxisSize();
                if (dir === "right") {
                    panel.style.right = `${document.documentElement.clientWidth - r.right}px`;
                } else {
                    panel.style.left = `${r.left}px`;
                }
            } else {
                // 上下：长轴 = 锚宽；top 固定展开向下 / bottom 固定展开向上
                panel.style.left = `${r.left}px`;
                panel.style.width = long;
                panel.style.height = this._shortAxisSize();
                if (dir === "top") {
                    panel.style.top = `${r.top}px`;
                } else {
                    panel.style.bottom = `${document.documentElement.clientHeight - r.bottom}px`;
                }
            }
            panel.setAttribute("data-overlay-placement", dir);
        };
        apply();
        // 重同步（floating-ui autoUpdate 的最小替代）：锚尺寸变化 + 视口 resize + 滚动
        // （fixed 坐标随视口，锚滚动后须重算）
        let ro: ResizeObserver | null = null;
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(apply);
            ro.observe(anchorEl);
        }
        const onViewport = () => apply();
        window.addEventListener("resize", onViewport);
        window.addEventListener("scroll", onViewport, true);
        registerCleanup(() => {
            ro?.disconnect();
            window.removeEventListener("resize", onViewport);
            window.removeEventListener("scroll", onViewport, true);
        });
    }

    /**
     * 屏幕贴边定位：fixed + 贴边三边 inset 写死（另一轴由 inset 对拉全屏展开）+ 短轴
     * inline（{@link _shortAxisSize}——配置值或 CSS 变量表达式，不依赖样式表注入时机）。
     * placement 同步写回（'drawer' 动画首帧方向依赖，ADR-0063）。
     */
    private _applyScreenEdge(panel: HTMLElement): void {
        const dir = this._screenPlacement();
        panel.style.position = "fixed";
        panel.style.margin = "0";
        if (dir === "left") {
            panel.style.top = "0";
            panel.style.bottom = "0";
            panel.style.left = "0";
        } else if (dir === "right") {
            panel.style.top = "0";
            panel.style.bottom = "0";
            panel.style.right = "0";
        } else if (dir === "top") {
            panel.style.top = "0";
            panel.style.left = "0";
            panel.style.right = "0";
        } else {
            panel.style.bottom = "0";
            panel.style.left = "0";
            panel.style.right = "0";
        }
        if (dir === "left" || dir === "right") {
            panel.style.width = this._shortAxisSize();
        } else {
            panel.style.height = this._shortAxisSize();
        }
        panel.setAttribute("data-overlay-placement", dir);
    }

    /**
     * resize 形态合法集（ADR-0064）：贴边内侧单边——placement 即贴边侧，可拖的是**内侧**
     * 对缘（left 抽屉贴左缘 → 内侧右缘 → `e`，类推）；角手柄对贴边形态无意义（长轴由
     * inset 对拉/锚定同步管理，不可拖）。
     */
    protected override _resizeAllowedHandles(): ResizeDirection[] | null {
        const dir = this._screenPlacement();
        return [dir === "left" ? "e" : dir === "right" ? "w" : dir === "top" ? "s" : "n"];
    }

    /**
     * resize 尺寸落点（ADR-0064）：只写短轴——长轴由贴边 inset 对拉（屏幕模式）/锚边同步
     * （锚定模式）管理，resize 不越权写（写了会破贴边展开语义）。
     */
    protected override _applyResize(
        panel: HTMLElement,
        width: number,
        height: number,
        dir: ResizeDirection,
    ): void {
        if (dir === "e" || dir === "w") panel.style.width = `${width}px`;
        else panel.style.height = `${height}px`;
    }

    /**
     * 短轴尺寸（`size` 选项，方向中立，ADR-0063）：`number`（px）或 CSS 长度字符串
     * （`'40%'` / `'20rem'` / 纯数字字符串按 px）；缺省回退 CSS 变量表达式
     * `var(--autospark-drawer-size, 280px)`——inline 恒写短轴（不依赖样式表注入时机），
     * 变量可调性保留。非法值 warn 回退默认。resize 启用后**会话内记忆值优先**（ADR-0064
     * 决策八：拖出尺寸重开沿用，用户改声明 `size` 不生效属预期——重置路径 = engine 重建）。
     */
    private _shortAxisSize(): string {
        if (this._resizeMem) {
            const placement = this._screenPlacement();
            const v =
                placement === "left" || placement === "right"
                    ? this._resizeMem.width
                    : this._resizeMem.height;
            if (Number.isFinite(v) && v > 0) return `${v}px`;
        }
        const raw = this._config?.size;
        const fallback = "var(--autospark-drawer-size, 280px)";
        if (raw == null || raw === "") return fallback;
        if (typeof raw === "number") {
            if (Number.isFinite(raw) && raw > 0) return `${raw}px`;
        } else if (typeof raw === "string") {
            const s = raw.trim();
            if (/^\d+(\.\d+)?$/.test(s)) return `${Number(s)}px`;
            if (s) return s;
        }
        this.warn(
            `x-drawer:${this.attr}: size 须为正数（px）或 CSS 长度字符串（如 '40%'），已按默认 280px 处理`,
        );
        return fallback;
    }

    /**
     * 生效 at 配置（三层回退：`_config`（打开期 resolve 产物）> 成员表达式层（
     * `x-drawer-options.at` 修饰符）> 静态整包层（`x-drawer-options` 内嵌 at））——
     * 折叠把手 created 期定位时 `_config` 尚空，须回退指令选项两层。
     */
    private _effectiveAt() {
        return normalizeAtConfig(
            this._config?.at ?? this._optionExprValues?.at ?? this.options?.at,
        );
    }

    /**
     * 屏幕贴边方向（复用 `at.placement`，ADR-0063）：主方向归一（`-start/-end` 静默剥离）；
     * 缺省 / `'auto'` / 非法值一律按默认方向（right，静默——「不配即 right」心智最简单，
     * 且 autoPlacement 屏幕模式无锚无从谈起）。
     */
    private _screenPlacement(): string {
        const at = this._effectiveAt();
        const raw = String(at?.placement ?? "").trim();
        if (raw === "" || raw === "auto") return DEFAULT_DRAWER_PLACEMENT;
        const main = raw.split("-")[0]!;
        return DRAWER_MAIN_DIRECTIONS.has(main) ? main : DEFAULT_DRAWER_PLACEMENT;
    }
}
