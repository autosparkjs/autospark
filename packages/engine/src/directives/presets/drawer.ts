import type { AutoSpark } from "../../engine";
import type { OverlayInstanceOptions, OverlayPositionerContext } from "../../overlay/instance";
import type { OverlayConfig } from "../../overlay/types";
import { normalizeAtConfig } from "../../overlay/types";
import { applyAnchorPosition } from "../../overlay/anchor";
import { registerShellStyles } from "../../overlay/wrappers";
import { VisibleOverlayDirective } from "./visible-overlay";

/**
 * x-drawer：覆盖物消费者的**贴边抽屉形态**（ADR-0063）——{@link VisibleOverlayDirective}
 * 平级薄子类（与 x-dialog 共享 visible 驱动四形态，ADR-0052 决策 6/7/8）。
 *
 * 双定位模式（经实例定位策略钩子整体接管，ADR-0063）：
 * - **屏幕贴边**（默认，无 `at`）：面板 fixed 贴视口对应边滑入滑出，贴边轴全屏展开、
 *   短轴尺寸走 `--autospark-drawer-size`（默认 320px，CSS 变量可调）；
 * - **元素贴边锚定**（`at.selector` 命中）：面板贴锚元素对应边**外侧**，**长轴 = 锚边长**
 *   （JS 同步、随锚 resize 重同步），短轴仍走 CSS 变量、不钳制到锚内。
 *
 * placement 语义（复用 `at.placement`，四主方向）：
 * - 默认 `right`（不配置即 right，心智最简单）；
 * - 屏幕模式只认 `top|bottom|left|right`——`auto` 与 `-start/-end` 后缀静默归一
 *   （autoPlacement 无锚无从谈起；长轴铺满对齐后缀无意义）；
 * - 锚定模式 `auto` 维持 floating-ui autoPlacement 语义（方向定位完成后再同步长轴）。
 *
 * 形态默认：
 * - **模态默认、`mask: false` 可关**（官方 mask 选项，ADR-0062）：无遮罩时关闭触点仅
 *   ESC / close action / 状态归假（outside-click 关闭是家族 fast-follow，不做）；
 *   `closeOnMask` 无遮罩时静默无效；
 * - **默认动画 `'drawer'`**：遮罩淡入淡出 + 面板按 placement 方向滑动（±100%，样式在
 *   drawer-shell）；用户显式配置 `animate` 时整键尊重；
 * - **锚定 `flip` 默认关**（方向是明确指定，空间不足不翻转；显式 `at.flip` 恒尊重）、
 *   **无箭头**（drawer-shell 不渲染载体，`at.arrow: true` 静默无效）；
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
            const raw = String(anchor.placement ?? "auto").trim();
            if (raw !== "auto") {
                // 主方向归一（-start/-end 静默剥离——长轴铺满锚边，对齐后缀无意义，ADR-0063）。
                // 首帧同步写 placement（动画方向不闪）+ 长轴初值；最终值由定位管线写回
                // （flip 显式开启时可能修正，onPositioned 随之重同步）。
                const main = raw.split("-")[0]!;
                anchor.placement = DRAWER_MAIN_DIRECTIONS.has(main)
                    ? main
                    : DEFAULT_DRAWER_PLACEMENT;
                panel.setAttribute("data-overlay-placement", anchor.placement);
                this._syncLongAxis(panel, anchor.placement, anchorEl);
            }
            applyAnchorPosition(anchor, anchorEl, panel, registerCleanup, {
                // 方向是用户明确指定，空间不足不翻转（显式 at.flip 恒尊重，ADR-0063）
                flipDefault: false,
                onPositioned: (placement) =>
                    this._syncLongAxis(panel, String(placement).split("-")[0]!, anchorEl),
            });
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
     * 短轴尺寸（`size` 选项，方向中立，ADR-0063）：`number`（px）或 CSS 长度字符串
     * （`'40%'` / `'20rem'` / 纯数字字符串按 px）；缺省回退 CSS 变量表达式
     * `var(--autospark-drawer-size, 320px)`——inline 恒写短轴（不依赖样式表注入时机），
     * 变量可调性保留。非法值 warn 回退默认。
     */
    private _shortAxisSize(): string {
        const raw = this._config?.size;
        const fallback = "var(--autospark-drawer-size, 320px)";
        if (raw == null || raw === "") return fallback;
        if (typeof raw === "number") {
            if (Number.isFinite(raw) && raw > 0) return `${raw}px`;
        } else if (typeof raw === "string") {
            const s = raw.trim();
            if (/^\d+(\.\d+)?$/.test(s)) return `${Number(s)}px`;
            if (s) return s;
        }
        this.warn(
            `x-drawer:${this.attr}: size 须为正数（px）或 CSS 长度字符串（如 '40%'），已按默认 320px 处理`,
        );
        return fallback;
    }

    /**
     * 屏幕贴边方向（复用 `at.placement`，ADR-0063）：主方向归一（`-start/-end` 静默剥离）；
     * 缺省 / `'auto'` / 非法值一律按默认方向（right，静默——「不配即 right」心智最简单，
     * 且 autoPlacement 屏幕模式无锚无从谈起）。
     */
    private _screenPlacement(): string {
        const at = normalizeAtConfig(this._config?.at);
        const raw = String(at?.placement ?? "").trim();
        if (raw === "" || raw === "auto") return DEFAULT_DRAWER_PLACEMENT;
        const main = raw.split("-")[0]!;
        return DRAWER_MAIN_DIRECTIONS.has(main) ? main : DEFAULT_DRAWER_PLACEMENT;
    }

    /**
     * 锚定轴同步（ADR-0063）：长轴 = 锚边长（inline 覆盖拉伸，autoUpdate 随锚 resize
     * 经 onPositioned 重同步）；短轴 inline（{@link _shortAxisSize}——size 配置值或 CSS
     * 变量表达式）。不钳制到视口/锚内——锚比抽屉短轴窄时允许溢出（共识 Q7-2）。
     */
    private _syncLongAxis(panel: HTMLElement, main: string, anchorEl: HTMLElement): void {
        if (main === "left" || main === "right") {
            panel.style.height = `${anchorEl.offsetHeight}px`;
            panel.style.width = this._shortAxisSize();
        } else if (main === "top" || main === "bottom") {
            panel.style.width = `${anchorEl.offsetWidth}px`;
            panel.style.height = this._shortAxisSize();
        }
    }
}
