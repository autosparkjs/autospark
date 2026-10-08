import type { AutoSpark } from "../../engine";
import type { OverlayInstanceOptions, OverlayPositionerContext } from "../../overlay/instance";
import type { OverlayConfig } from "../../overlay/types";
import { normalizeAtConfig } from "../../overlay/types";
import { resolveAnchorEl } from "../../overlay/anchor";
import { getOverlayContainer } from "../../overlay/container";
import { registerShellStyles } from "../../overlay/wrappers";
import { VisibleOverlayDirective } from "./visible-overlay";
import { createCollapseTrigger, registerTriggerStyles } from "./expandable-trigger";
import { ExpandableDirective } from "./expandable";

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

    /** 类级初始化：注入 shell 默认视觉样式 + 共享把手样式（均幂等；ADR-0070 把手组合） */
    static override initialize(engine: AutoSpark): void {
        registerShellStyles(engine);
        registerTriggerStyles();
    }

    /** 生效配置 stash（_resolveConfig 与 _modalMask/_positioner 同一次打开内先后执行） */
    private _config: OverlayConfig | null = null;

    // ── 抽屉把手（trigger，ADR-0063 修订）────────────────────────────

    /** 把手元素（实例外常驻——面板销毁后存活；null = 未建/已销毁） */
    private _triggerEl: HTMLElement | null = null;
    /** 最近 visible 驱动态（把手位置/箭头/裁切的分派依据） */
    private _triggerOn = false;
    /** 把手的视口监听清理（destroy 时摘除） */
    private _triggerCleanup: (() => void) | null = null;
    /** 感应边条（showTrigger:'hover' 时创建；全长活动边线感应，置于把手之前的兄弟） */
    private _edgeEl: HTMLElement | null = null;
    /** 展开态位置对齐帧句柄（与面板 enter 切换帧同调度；destroy/重入时撤销） */
    private _triggerFrame: number | null = null;
    private _triggerTimer: ReturnType<typeof setTimeout> | null = null;
    /** resize 会话的把手跟随帧句柄（合帧——每帧调节只重定位一次） */
    private _resizeSyncFrame: number | null = null;

    /**
     * 把手挂载（ADR-0070：把手机制组合 x-expandable 共享把手模块——元素/箭头矩阵/
     * 键盘管线唯一实现，`expandable` 选项承接旧 `trigger`；ADR-0063 修订的常驻语义
     * 保留）：默认开启、`false` 显式关闭；仅反应式（简单路径）形态生效——字面量/
     * 表达式形态状态不可写，把手点击无意义，不建。把手挂覆盖物容器（z 层级同源），
     * 圆心恒骑面板活动边线，几何见 `_positionTrigger`。drawer 语境把手**恒常驻**
     * （折叠态唯一重开触点——共享模块「滑出折叠常驻」规则的覆盖场景）。
     */
    override created(): void {
        super.created();
        if (this.getOption("expandable") === false) return;
        if (!this._visiblePath) return;
        const container = getOverlayContainer(this.engine);
        if (!container) return;
        const el = createCollapseTrigger({
            direction: this._screenPlacement(),
            onActivate: () => this._onTriggerClick(),
            label: "抽屉展开/折叠",
        });
        // 显隐策略（expandable.showTrigger，默认 'hover'——用户裁决，ADR-0063 修订注记）：
        // 展开态隐藏、hover/聚焦显形（无边条感应——折叠态恒显使「寻找隐藏把手」场景
        // 不存在，把手位置沿面板边线可预测）；折叠态恒显（唯一重开触点）；触屏恒显。
        // 非法值 warn 回退 hover
        const rawShow = this.getOption("expandable")?.showTrigger;
        if (rawShow != null && rawShow !== "hover" && rawShow !== "always") {
            this.warn(
                `x-drawer:${this.attr}: expandable.showTrigger 值 "${rawShow}" 无效（hover/always），已回退 hover`,
            );
        }
        el.setAttribute("data-show-trigger", rawShow === "always" ? "always" : "hover");
        // 感应边条（hover 模式，ADR-0070 修订）：与 x-expandable 同款全长感应——覆盖抽屉
        // 活动边线（展开态 = 面板开口边、折叠态 = 屏幕/锚边，几何随把手同步），厚 24px
        // 跨边内外各 12px。插入把手**之前**（共享 `.edge:hover ~ .trigger` 显形规则的
        // 兄弟序前提）；样式在 drawer-shell（fixed + 显示分派），几何在 _positionTrigger。
        // **resize 启用时抑制**（ADR-0070 修订，Q4=A 静态判定）：边条 z(overlay+1) 盖过
        // 面板内 resize 手柄（panel stacking context 封顶，无法抬层）会拦截拖拽——此时
        // 手柄本身充当全长感应线（桥接见 _attachResize），成员表达式动态启用 resize 的
        // 边缘场景不覆盖（文档注明）
        if (rawShow !== "always" && !this.getOption("resize")) {
            const edge = document.createElement("div");
            edge.className = "autospark-expandable-edge";
            edge.setAttribute("aria-hidden", "true");
            edge.setAttribute("data-show-trigger", "hover");
            this._edgeEl = edge;
        }
        // **resize 让位语义**（ADR-0070 修订）：把手 z(overlay+1) 高于面板内 resize 手柄
        // （panel stacking context 封顶 ≤1000）——开口边中央（pos 默认 '50%' 恰在此）抓手柄
        // 拖拽命中的是把手而非手柄，resize 无法启动（hover 模式把手隐形，症状为「神秘
        // 折叠」）。让位：resize 启用且指针落在手柄带内 → 转发 pointerdown 给手柄（启动
        // resize 会话）+ 抑制本次 click（折叠不触发）；把手外半（面板外侧突出部）照常折叠
        el.addEventListener("pointerdown", (ev) => this._onTriggerPointerDown(ev));
        this._triggerEl = el;
        // 先定位再插入（避免 transition 从 0,0 滑到首位的闪移）
        this._positionTrigger();
        if (this._edgeEl) container.appendChild(this._edgeEl);
        container.appendChild(el);
        const onViewport = () => this._positionTrigger();
        window.addEventListener("resize", onViewport);
        window.addEventListener("scroll", onViewport, true);
        this._triggerCleanup = () => {
            window.removeEventListener("resize", onViewport);
            window.removeEventListener("scroll", onViewport, true);
        };
    }

    /**
     * 选项成员表达式热应用（ADR-0007 修订钩子）：`expandable`（pos 坐标）变化即重定位
     * ——把手常驻（面板销毁后仍存活），不热应用则折叠态可能长期停在过期坐标（props
     * 热应用由 overlay 基座专管订阅，此处只补坐标维度）。
     */
    protected override _onOptionExprChange(key: string, _value: any): void {
        if (key === "expandable") this._positionTrigger();
    }

    /** 把手随指令销毁摘除（宿主脱离 / scope 死亡 / engine destroy 均达此处） */
    override destroy(): void {
        this._triggerCleanup?.();
        this._triggerCleanup = null;
        this._cancelTriggerSync();
        this._edgeEl?.remove();
        this._edgeEl = null;
        this._triggerEl?.remove();
        this._triggerEl = null;
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
        this._triggerOn = true;
        this._cancelTriggerSync();
        this._triggerFrame = requestAnimationFrame(() => {
            this._triggerTimer = setTimeout(() => {
                this._triggerFrame = null;
                this._triggerTimer = null;
                this._positionTrigger();
            }, 0);
        });
    }

    protected override _close(): void {
        super._close();
        this._triggerOn = false;
        this._cancelTriggerSync();
        this._positionTrigger();
    }

    /** 撤销待决的展开态对齐调度（重入开合/销毁时防过期位置写入） */
    private _cancelTriggerSync(): void {
        if (this._triggerFrame != null) {
            cancelAnimationFrame(this._triggerFrame);
            this._triggerFrame = null;
        }
        if (this._triggerTimer != null) {
            clearTimeout(this._triggerTimer);
            this._triggerTimer = null;
        }
        if (this._resizeSyncFrame != null) {
            cancelAnimationFrame(this._resizeSyncFrame);
            this._resizeSyncFrame = null;
        }
    }

    /** resize 让位转发后抑制的 click 标记（真实浏览器由 pointerdown preventDefault 抑制
     *  兼容鼠标事件，测试环境手动派发 click 需标志位兜底——双保险） */
    private _suppressTriggerClick = false;

    /**
     * 把手 pointerdown 让位判定（resize 启用 + 展开态）：指针落在手柄带内（getBoundingClientRect
     * 即手柄带几何）→ 转发 pointerdown 给手柄（resize 会话以原 pointerId 启动，client 坐标
     * 保真）+ preventDefault（真实浏览器抑制兼容鼠标事件链 → click 不触发）+ 标志位兜底；
     * 指针在把手外半（面板外侧突出部，手柄带之外）→ 不干预，照常走 click 折叠。
     */
    private _onTriggerPointerDown(ev: PointerEvent | MouseEvent): void {
        if (!this._config?.resize || !this._triggerOn) return;
        const handle = this._overlayInstance?.panel?.querySelector(
            "[data-autospark-resize-handle]",
        ) as HTMLElement | null;
        if (!handle) return;
        const r = handle.getBoundingClientRect();
        const inBand =
            r.width + r.height > 0 &&
            ev.clientX >= r.left &&
            ev.clientX <= r.right &&
            ev.clientY >= r.top &&
            ev.clientY <= r.bottom;
        if (!inBand) return;
        ev.preventDefault();
        this._suppressTriggerClick = true;
        handle.dispatchEvent(
            new MouseEvent("pointerdown", {
                bubbles: true,
                clientX: ev.clientX,
                clientY: ev.clientY,
                button: 0,
            }),
        );
    }

    /**
     * 把手点击（折叠 ≡ visible 归假，无第三态）：展开态走实例请求关闭（与 ESC/遮罩
     * 同链——含简单路径回写）；折叠态直接写回 `true`（状态是唯一真相源，watch 驱动重开）。
     * resize 让位转发的 pointerdown 不触发折叠（标志位消费）。
     */
    private _onTriggerClick(): void {
        if (this._suppressTriggerClick) {
            this._suppressTriggerClick = false;
            return;
        }
        if (this._triggerOn) {
            const inst = this._overlayInstance;
            if (inst && !inst.destroyed && inst.visible) inst.requestClose("trigger");
        } else {
            this._writeVisible(true);
        }
    }

    /**
     * 把手定位（fixed + left/top，CSS transition .3s 与面板同曲线滑移）：
     * - 圆心恒骑「活动边线」——展开态 = 面板**开口边线**（面板布局盒对侧边，offset 系
     *   布局值不含 transform，enter 动画期取值即终态）；折叠态 = 贴边线（屏幕模式 =
     *   视口边；锚定模式 = 锚内侧对应边）；
     * - 沿边线滑轨位置由 `expandable.pos` 坐标决定（{@link _triggerCross}，默认居中）；
     * - `data-direction` = placement（共享箭头矩阵/半圆裁切的 CSS 钩子——属性随身）；
     *   折叠态 `data-collapsed` + `data-half`（半圆形态判据，共享把手视觉）。
     */
    private _positionTrigger(): void {
        const el = this._triggerEl;
        if (!el) return;
        const dir = this._screenPlacement();
        el.setAttribute("data-direction", dir);
        el.toggleAttribute("data-collapsed", !this._triggerOn);
        el.toggleAttribute("data-half", !this._triggerOn);
        const horizontal = dir === "left" || dir === "right";
        // 半径（样式注入前 offsetWidth 为 0，回退默认 20px——共享把手契约直径）
        const half = (horizontal ? el.offsetWidth || 20 : el.offsetHeight || 20) / 2;
        // 贴边线（折叠位）+ 滑轨长度：锚定模式取锚 rect，屏幕模式取视口
        const at = this._effectiveAt();
        const anchorEl = at ? resolveAnchorEl(at.selector, this.el) : null;
        const ar = anchorEl?.getBoundingClientRect();
        const vw = document.documentElement.clientWidth;
        const vh = document.documentElement.clientHeight;
        const edgeLine = ar
            ? (dir === "right" ? ar.right : dir === "left" ? ar.left : dir === "top" ? ar.top : ar.bottom)
            : (dir === "right" ? vw : dir === "left" ? 0 : dir === "top" ? 0 : vh);
        const lineLen = ar ? (horizontal ? ar.height : ar.width) : horizontal ? vh : vw;
        // 滑轨锚定基准（视口系起点）：锚定模式 = 锚边起点（fixed 坐标须加锚偏移，
        // 否则相对锚边的坐标会被当视口坐标、把手渲染到锚外）；屏幕模式 = 0（视口边）
        const railOrigin = ar ? (horizontal ? ar.top : ar.left) : 0;
        const cross = this._triggerCross(lineLen, half);
        // 开口边线（展开位）：面板布局盒（offset 系不含 transform）对侧边
        let line = edgeLine;
        const panel = this._overlayInstance?.panel;
        if (this._triggerOn && panel) {
            if (dir === "right") line = panel.offsetLeft;
            else if (dir === "left") line = panel.offsetLeft + panel.offsetWidth;
            else if (dir === "top") line = panel.offsetTop + panel.offsetHeight;
            else line = panel.offsetTop;
        }
        if (horizontal) {
            el.style.left = `${line - half}px`;
            el.style.top = `${railOrigin + cross - half}px`;
        } else {
            el.style.top = `${line - half}px`;
            el.style.left = `${railOrigin + cross - half}px`;
        }
        // 感应边条几何与把手同一 `line`/滑轨基准：覆盖整条活动边线（厚 24px 跨边内外
        // 各 12px）——展开态贴面板开口边、折叠态贴屏幕/锚边，与把手同点集同步
        const edge = this._edgeEl;
        if (edge) {
            if (horizontal) {
                edge.style.left = `${line - 12}px`;
                edge.style.top = `${railOrigin}px`;
                edge.style.width = "24px";
                edge.style.height = `${lineLen}px`;
            } else {
                edge.style.top = `${line - 12}px`;
                edge.style.left = `${railOrigin}px`;
                edge.style.height = "24px";
                edge.style.width = `${lineLen}px`;
            }
        }
    }

    /**
     * 把手沿边线滑轨坐标（`expandable` 选项的 `pos`，ADR-0063 修订 + ADR-0070 更名）：
     * **边缘锚定模型**——坐标沿滑轨一维（左右抽屉 = top、上下抽屉 = left，由 placement
     * 决定），正距主边（top/left）、负距对面边（bottom/right）的绝对距离；`true`/缺省 =
     * 居中（语法糖 ≡ `'50%'`）。解析：number = px；string = CSS 长度（`'20%'` / `'100px'`
     * / `'2rem'` / `'10vw'`，纯数字字符串按 px；% 基准 = 滑轨长度——屏幕模式视口长轴 /
     * 锚定模式锚边长）。非法值 warn 回退居中；`0` 是合法坐标（距主边 0）。结果静默钳制
     * 到 `[half, 滑轨长 - half]`——把手是唯一的重开触发点，越出滑轨即抽屉不可达（功能性
     * 死锁），钳制而非放任。
     */
    private _triggerCross(lineLen: number, half: number): number {
        const rawOpt = this.getOption("expandable");
        const raw = rawOpt != null && typeof rawOpt === "object" ? (rawOpt as any).pos : rawOpt;
        let dist = this._parseTriggerDist(raw, lineLen);
        if (dist == null) {
            this.warn(
                `x-drawer:${this.attr}: expandable.pos 须为 true/数字（px）或 CSS 长度字符串（如 '-20%'），已按居中处理`,
            );
            dist = lineLen / 2;
        }
        return Math.min(Math.max(dist, half), lineLen - half);
    }

    /** expandable.pos 取值 → 距主边的 px 距离（边缘锚定换算：负值 = 距对面边）；非法返回 null */
    private _parseTriggerDist(raw: any, lineLen: number): number | null {
        if (raw == null || raw === true || raw === "") return lineLen / 2;
        if (raw === false) return null; // 不可达（created 已拦），防御性按非法处理
        const toDist = (px: number) => (px >= 0 ? px : lineLen - Math.min(-px, lineLen));
        if (typeof raw === "number") {
            return Number.isFinite(raw) ? toDist(raw) : null;
        }
        if (typeof raw !== "string") return null;
        const m = /^(-?[\d.]+)\s*(%|px|rem|em|vw|vh)?$/i.exec(raw.trim());
        if (!m) return null;
        const v = parseFloat(m[1]!);
        if (!Number.isFinite(v)) return null;
        switch ((m[2] ?? "px").toLowerCase()) {
            case "%": return toDist((v / 100) * lineLen);
            case "rem": return toDist(v * this._rootFontSize());
            case "em": return toDist(v * this._elFontSize());
            case "vw": return toDist((v / 100) * window.innerWidth);
            case "vh": return toDist((v / 100) * window.innerHeight);
            default: return toDist(v); // px / 纯数字
        }
    }

    /** 根字号 px（rem 基准；取不到回退 16） */
    private _rootFontSize(): number {
        return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    }

    /** 把手段字号 px（em 基准；取不到回退根字号） */
    private _elFontSize(): number {
        const el = this._triggerEl;
        return (el && parseFloat(getComputedStyle(el).fontSize)) || this._rootFontSize();
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
     * resize 装配（ADR-0073 迁移）：**面板上组合 x-expandable 的 resize 通道**（enable:
     * false 退化形态 = 纯单边 resize 壳，ADR-0072）替代 overlay 侧 `_attachResize`——
     * 方向 = placement（right → w…，与旧形态合法集同构）、写路径只写短轴（长轴由贴边
     * inset 对拉/锚定同步管理）、`resize:*` 事件派发**指令宿主**（eventTarget 参数，
     * `@resize:end` 监听位置不变）、拖出短轴经 driver.resized 进会话记忆（`_resizeMem`，
     * ADR-0064 决策八保留）并调度把手跟随（rAF 合帧）。手柄桥接显形把手（data-edge-hover
     * 统一契约）；把手 pointerdown 让位转发见 `_onTriggerPointerDown`。dialog 的四角
     * resize 不适用单边语义，overlay 层 `_attachResize` 为其保留。
     */
    protected override _attachResize(ctx: {
        panel: HTMLElement;
        config: OverlayConfig;
        registerCleanup: (fn: () => void) => void;
    }): void {
        const cfg = ctx.config.resize;
        if (cfg == null || cfg === false) return;
        const placement = this._screenPlacement();
        const opts =
            cfg === true
                ? { enable: false, resize: true, direction: placement }
                : {
                      enable: false,
                      resize: { ...(cfg as Record<string, any>) },
                      direction: placement,
                  };
        const horizontal = placement === "left" || placement === "right";
        const inst = ExpandableDirective.compose(
            this.engine,
            this.binding,
            ctx.panel,
            opts,
            {
                get: () => false, // 折叠功能关闭（退化形态）——开合归 visible 归假，与 resize 无关
                set: () => {},
                resized: (decl) => {
                    // 会话记忆（ADR-0064 决策八）+ 把手跟随（rAF 合帧，调节改变开口边线）
                    this._resizeMem = horizontal
                        ? { width: decl.value, height: this._resizeMem?.height ?? 0 }
                        : { width: this._resizeMem?.width ?? 0, height: decl.value };
                    this._scheduleTriggerFollow();
                },
            },
            this.el,
        );
        inst.created();
        inst.compile(undefined as any, ctx.panel);
        ctx.registerCleanup(() => inst.destroy());
        // 手柄桥接显形（hover/focus 置位把手 data-edge-hover 统一契约）。手柄随面板每次
        // 打开重建，此处每次接线（旧监听随旧面板 DOM 消亡）
        const handles = ctx.panel.querySelectorAll<HTMLElement>("[data-autospark-resize-handle]");
        if (!handles.length) return;
        const set = (on: boolean) => this._triggerEl?.toggleAttribute("data-edge-hover", on);
        for (const h of handles) {
            h.addEventListener("mouseenter", () => set(true));
            h.addEventListener("mouseleave", () => set(false));
            h.addEventListener("focus", () => set(true));
            h.addEventListener("blur", () => set(false));
        }
    }

    /** 把手跟随帧调度（rAF 合帧——每帧调节只重定位一次；.3s transition 平滑跟随） */
    private _scheduleTriggerFollow(): void {
        if (this._triggerEl == null || !this._triggerOn || this._resizeSyncFrame != null) return;
        this._resizeSyncFrame = requestAnimationFrame(() => {
            this._resizeSyncFrame = null;
            this._positionTrigger();
        });
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
