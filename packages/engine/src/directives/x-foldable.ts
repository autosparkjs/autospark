import { AutoSparkDirectiveBase, DirectiveKind } from "../features/directive/base";
import type { AutoSpark } from "../engine/engine";
import type { AutoSparkScope } from "../engine/scope";
import type { OverlayInstance } from "../features/overlay/instance";
import { injectStylesheet } from "../utils/injectStylesheet";

/**
 * x-foldable：溢出折叠容器（ADR-0098 重写版，与旧三段分区模型无承继）。
 *
 * **布局契约**：宿主 `display:flex` + `nowrap` + `align-items:center`；全部直接子元素
 * **强制 `flex-grow:0` / `flex-shrink:0`**（引擎全局样式唯一决定，不提供 data-grow /
 * data-shrink 伸缩直通——自动伸缩子元素的主轴尺寸是拉伸后的布局宽而非自然宽，会污染
 * `_contentMain` 求和判据使溢出计算失效；空间分配交给折叠机制而非 flex 压缩/拉伸）。
 *
 * **指令值 = 轴**（响应式）：裸词 `row` / `column` 按字面量（书写主轴场景，非法字面量
 * warn + 保持 row）；其余按 scope 表达式求值（结果 "column" → column，其余归一 row，
 * 静默归一如 x-splitter 先例），状态变化换轴——换轴时折叠子元素全部按原位锚复位后
 * 按新轴全量重算。
 *
 * **溢出折叠**（核心机制，对齐无关判据 + 步进收敛）：shrink:0 + nowrap 下「是否溢出」
 * 判据 = **可见子元素 + 触发按钮的主轴尺寸求和 + gap** > 主轴内容可用宽（`_contentMain`
 * vs `_clientMain`——后者 = client 尺寸减主轴 padding：子元素布局在 content box 内）。
 * 不读 `scrollWidth`：start 对齐溢出态它虽等于内容宽，但 flex-end 等主轴对齐下溢出
 * 向起始侧（负方向）不计入、不溢出态又取 max(内容, client)，两态皆不可靠。步进循环
 * 每步一次真实布局：溢出 → 折叠最后一个**可见**子元素（缓存自然尺寸 + 原位锚，真实
 * 搬移出文档存 stash）；有富余 → 从栈顶试恢复（真实放回后按 `_contentMain` 复验，
 * 放不下同帧折回本人并停步；防「多折一个」的自愈回看）。grow 只在正剩余空间生效而
 * 折叠只发生在溢出态，故缓存测量不受 grow 拉伸污染。宿主 `min-width`（column 对称
 * `min-height`）= 触发按钮尺寸（写入后不撤，保证按钮永不被挤没）。
 *
 * **触发通道**（ResizeObserver 宿主 + 子元素 / MutationObserver childList + 换轴属性 /
 * window resize 兜底）任一变化即全量重算——「绑定生效但布局不跟随」
 * 的静默失效零容忍（子元素增删、伸缩比值变化、内容尺寸变化全部跟随）。
 *
 * **弹出面板**：溢出时宿主末尾显示 more 触发按钮（内置 `more` 图标 + aria-label，键盘
 * Enter/Space 等价开关），声明 `x-popover` 交由 PopoverDirective（ADR-0060 hover 模型）
 * 全权接管开关/定位/动画。**面板容器默认 = popover 内置 `autospark.popover` shell**
 * （自带边框/箭头载体/默认出口；锚定模式 arrow 默认开启）——不克隆宿主、宿主样式不延续；
 * `x-foldable-options.shell` 显式指定组件名时才以用户外壳为容器（须自带默认出口）。
 * `x-foldable-options.popover` 对象整包透传合并进触发按钮的 `x-popover-options`（用户值
 * 优先——可配 arrow / delayShow / delayHide / at 等）。折叠子元素经 `overlay:open`
 * 广播认领后挂入面板出口（出口打 `autospark-foldable-panel` 类获得垂直堆叠布局与兜底
 * gap），`overlay:close` 动画窗口内摘回 stash（脱离文档持有，控件状态跨开关保留）。
 *
 * **不做**（v1 裁决）：无事件广播、无 more 定制入口、`x-foldable-options` 仅 `shell` /
 * `popover` 两键。
 *
 * **Hybrid 双实例分工**（ADR-0098 决策 5）：scope 实例管编译期装配（轴订阅/触发
 * 按钮——created/compile/destroy）；observer 实例管运行期（观察通道/折叠重估/面板中继/
 * 键盘外其余全部——mounted/unmounted，由 RuntimeObserverDispatcher 收录 Hybrid 派发）。
 * 两实例字段互不共享，跨实例状态一律收敛 DOM：轴真相 `data-direction`（scope 写、
 * observer 经子树 MO 感知换轴），面板开关真相触发按钮 `dataset.panelOpen`（中继写、
 * 键盘 handler 读）。
 */

/** 容器契约类（全局样式选择器基准） */
const FOLDABLE_CLASS = "autospark-foldable";
/** 面板出口类（中继挂入折叠子元素时打在出口上；垂直堆叠布局 + 兜底 gap） */
const PANEL_CLASS = "autospark-foldable-panel";
/** more 触发按钮（容器直接子元素，flex-shrink:0；未溢出 display:none 不参与布局不计 gap） */
const TRIGGER_CLASS = "autospark-foldable-trigger";

/**
 * 共享空内容组件名（点自由名——`x-popover:名` attr 经修饰符语法解析，点号会被截断）。
 * popover 通道要求 attr 必填（内容组件），实际内容由指令经 overlay 广播挂入面板出口，
 * 此载体仅满足通道契约；`display:contents` 不产生盒子、不参与面板布局。
 */
const CONTENT_COMPONENT_NAME = "autospark-foldable-content";

// 全局样式（类级 initialize 注入，幂等；CSS 变量定制视觉）
const FOLDABLE_STYLE_ID = "autospark-foldable-styles";
const FOLDABLE_CSS = `
.autospark-foldable{display:flex;flex-wrap:nowrap;align-items:center;overflow:hidden;}
.autospark-foldable[data-direction="column"]{flex-direction:column;}
/* 子元素强制不伸不缩（grow:0/shrink:0 是溢出判据的布局数学前提——伸缩态 offsetWidth
   是拉伸布局宽而非自然宽，求和判据失效；引擎不提供伸缩直通出口，用户须改布局结构） */
.autospark-foldable>:not(.${TRIGGER_CLASS}){flex-grow:0;flex-shrink:0;}
/* more 触发按钮：未溢出 display:none（不参与 flex 布局、不计 gap），溢出时由指令切
   inline-flex——显示与折叠态单一真相在指令。order 把按钮视觉恒排末尾（DOM 上按钮在
   compile 期先于模板子元素 append、恒居首位——more 语义要求溢出时出现在行尾，flex
   order 免 DOM 移动、不扰动子元素序与折叠锚） */
.autospark-foldable>.${TRIGGER_CLASS}{
  display:none;order:9999;flex-grow:0;flex-shrink:0;align-items:center;justify-content:center;
  width:var(--autospark-foldable-trigger-size,24px);height:var(--autospark-foldable-trigger-size,24px);
  padding:0;border:none;background:transparent;color:inherit;cursor:pointer;border-radius:4px;
}
.autospark-foldable>.${TRIGGER_CLASS}>svg{width:16px;height:16px;stroke-width:1.5;}
/* column 轴：more 图标旋转 90°（横排省略号转竖排——与纵向主轴、底部按钮、右侧弹出
   面板的视觉语义一致；data-direction 是轴的单一真相，换轴经 dataset 写入自动跟随） */
.autospark-foldable[data-direction="column"]>.${TRIGGER_CLASS}>svg{transform:rotate(90deg);}
.autospark-foldable>.${TRIGGER_CLASS}:hover{background:rgba(0,0,0,.06);}
.autospark-foldable>.${TRIGGER_CLASS}:focus-visible{outline:2px solid var(--autospark-foldable-trigger-focus,#94a3b8);outline-offset:-2px;}
/* 面板出口（中继挂入时打类）：折叠子元素垂直堆叠 + 引擎兜底 gap（内置 popover shell
   不预设内容布局；CSS 变量 --autospark-foldable-panel-gap 定制）。双类自并提权压过
   用户 shell 类的同轴样式。边框/箭头/z-index 归 shell（默认内置 autospark.popover） */
.${PANEL_CLASS}.${PANEL_CLASS}{
  display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;
  gap:var(--autospark-foldable-panel-gap,4px);
}
/* x-resizable 组合适配：本容器 overflow:hidden 会裁掉外伸半边的调节手柄（x-resizable
   全局样式手柄跨边缘 -thickness/2），交互热区残缺——容器内重置为全内贴边（e/w 横向、
   n/s 纵向对称；优先级同源后注入胜出） */
.autospark-foldable>[data-autospark-resize-handle="e"]{right:0;}
.autospark-foldable>[data-autospark-resize-handle="w"]{left:0;}
.autospark-foldable>[data-autospark-resize-handle="n"]{top:0;}
.autospark-foldable>[data-autospark-resize-handle="s"]{bottom:0;}
`;

/** 注入 block 全局样式（幂等；多 engine 共享、destroy 不移除——对齐全局样式惯例） */
export function registerFoldableStyles(): void {
    injectStylesheet(FOLDABLE_CSS, { id: FOLDABLE_STYLE_ID });
}

/**
 * x-foldable 指令（ADR-0098 重写版）：溢出折叠容器。
 */
export class FoldableDirective extends AutoSparkDirectiveBase {
    static override readonly priority = 0;
    static override readonly singleton = true;
    /** Hybrid：scope 通道管编译期装配（shell 解析/触发按钮/选项透传）+ observer 通道管生命周期（观察器启停） */
    static override readonly kind = DirectiveKind.Hybrid;

    /** 类级初始化：注入全局样式 + 注册共享空内容组件（幂等，per engine 一次） */
    static override initialize(engine: AutoSpark): void {
        registerFoldableStyles();
        engine.registerComponent(
            `<div x-define="${CONTENT_COMPONENT_NAME}" style="display:contents"></div>`,
            { name: CONTENT_COMPONENT_NAME },
        );
    }

    // ── 运行态 ────────────────────────────────────────────────────────

    /** 当前轴（值表达式求值派生；非 "column" 一律归一 row） */
    private _dir: "row" | "column" = "row";
    /** more 触发按钮（编译期预置的 x-popover 宿主，开关归 PopoverDirective） */
    private _trigger: HTMLButtonElement | null = null;
    /** 面板外壳组件名（仅 x-foldable-options.shell 显式指定时非空；写入触发按钮的 x-popover-options.shell，缺省走 popover 内置 shell） */
    private _shellName = "";
    /** 折叠子元素栈（push 序 = 折叠序 = DOM 逆序；栈顶 = DOM 最靠前的折叠元素） */
    private _stash: HTMLElement[] = [];
    /** 各折叠元素的原位锚（折叠时刻的 nextSibling；复位按 LIFO + 锚精确还原） */
    private _anchors = new Map<HTMLElement, ChildNode | null>();
    /** 各折叠元素的自然主轴尺寸缓存（溢出态测量值——grow 不污染，见文件头论证） */
    private _cache = new Map<HTMLElement, number>();
    /** 尺寸观察（宿主 + 子元素；观察开始必发一次首回调——初始评估入口） */
    private _ro: ResizeObserver | null = null;
    /** 宿主子树观察（childList 增删 + 换轴 data-direction 属性变化的重估通道） */
    private _mo: MutationObserver | null = null;
    /** window resize 兜底通道（亦是测试驱动入口——happy-dom 无 RO 回调） */
    private _onWinResize = (): void => this._reconcile();
    /** 重估重入防护（折叠/恢复动作会改变布局，防评估循环） */
    private _reconciling = false;
    /** 微任务建连前被销毁（快速 x-if 切换防护，splitter 先例） */
    private _destroyed = false;
    /** min 尺寸已写入值（同值不重写——防宿主 RO 循环） */
    private _minWritten = "";
    /** 当前打开的实例（overlay:open 认领；overlay:close 广播时清引用；面板开关真相在触发按钮 dataset.panelOpen——中继写、键盘通道读，跨实例共享走 DOM） */
    private _inst: OverlayInstance | null = null;
    /** overlay:open / overlay:close 广播退订（destroy 摘除） */
    private _unsubOpen: (() => void) | null = null;
    private _unsubClose: (() => void) | null = null;

    // ── 生命周期 ──────────────────────────────────────────────────────

    override created(): void {
        // 新设计无参数形态（旧三段分区标记已随重构废除），attr 非空即误用
        if (this.attr) {
            this.warn(
                `x-foldable:${this.attr}: 不支持的参数形态（x-foldable 为无参容器指令，轴由值声明 row|column），本标记已忽略`,
            );
            return;
        }
        this._setupAxis();
    }

    override compile(_context: Record<string, any>, _parent: HTMLElement): void {
        const host = this.el;
        host.classList.add(FOLDABLE_CLASS);
        host.dataset.direction = this._dir;
        this._resolveShellName();
        this._buildTrigger();
    }

    /**
     * 结果树挂载后（observer 通道实例）：打开观察通道 + 子元素契约落样式 + 初始折叠评估。
     *
     * Hybrid 双实例注意：本钩子跑在 observer 实例上，scope 实例编译期装配的触发按钮与
     * 轴标记须**经 DOM 找回**（两实例字段互不共享）——触发按钮按契约类在宿主子元素中
     * 查找，轴从 `data-direction` 读回（dataset 是轴的单一真相）。
     */
    override mounted(): void {
        if (this._destroyed) return;
        this._trigger =
            (Array.from(this.el.children).find(
                (c) => c instanceof HTMLElement && c.classList.contains(TRIGGER_CLASS),
            ) as HTMLButtonElement | undefined) ?? null;
        this._dir = this.el.dataset.direction === "column" ? "column" : "row";
        this._setupPanelRelay();
        this._startObserving();
        this._reconcile();
    }

    /** observer 通道实例销毁（元素移出引擎根 / dispatcher dispose）：共享善后 */
    override unmounted(): void {
        this._teardown();
    }

    /** scope 通道实例销毁（scope 销毁 / 编译产物剥除）：共享善后（幂等，两侧调用安全） */
    override destroy(): void {
        this._destroyed = true;
        this._teardown();
    }

    /** 运行态善后（两通道实例共用，幂等）：断开观察器、退订中继、关闭面板、清折叠栈 */
    private _teardown(): void {
        this._ro?.disconnect();
        this._ro = null;
        this._mo?.disconnect();
        this._mo = null;
        window.removeEventListener("resize", this._onWinResize);
        if (this._inst && !this._inst.destroyed && this._inst.visible) {
            this._inst.requestClose("consumer-destroyed");
        }
        this._unsubOpen?.();
        this._unsubOpen = null;
        this._unsubClose?.();
        this._unsubClose = null;
        this._stash = [];
        this._anchors.clear();
        this._cache.clear();
        this._trigger = null;
        this._inst = null;
    }

    // ── 轴（值表达式订阅 + 字面量分流）────────────────────────────────

    /**
     * 指令值解析：裸词 `row` / `column` 按字面量（主轴几乎不动态切换，字面量书写免引号）；
     * 其余按 scope 表达式订阅（状态驱动换轴，Q7 裁决），结果 "column" → column、其余归一
     * row（静默归一——过渡态 undefined 不构成误用，x-splitter 先例）。
     */
    private _setupAxis(): void {
        const raw = String(this.value ?? "").trim();
        if (raw === "row" || raw === "column") {
            this._applyDir(raw);
            return;
        }
        const expr = raw || "'row'";
        const initial = this.binding.watch(expr, ({ value }) => {
            this._applyDir(value === "column" ? "column" : "row");
        });
        this._applyDir(initial === "column" ? "column" : "row");
    }

    private _applyDir(dir: "row" | "column"): void {
        if (dir === this._dir && this.el?.dataset.direction === dir) return;
        this._dir = dir;
        // 轴单一真相在 dataset：observer 实例经子树 MO 感知换轴并做复位+重算（本实例
        // 不动 stash——Hybrid 双实例状态隔离，scope 侧折叠会把元素折进无人认领的栈）
        if (this.el) this.el.dataset.direction = dir;
        this._syncTriggerPlacement();
    }

    /** 换轴热更触发按钮弹出方位（row：面板右对齐按钮下方；column：对称右侧） */
    private _syncTriggerPlacement(): void {
        const trigger = this._trigger;
        if (!trigger) return;
        const scope = this.engine.findScopeByEl(trigger);
        const inst = scope?.directives.find((d) => d.info.name === "popover");
        if (inst) {
            (inst as any).options.at = { placement: this._placement() };
        }
    }

    /** 面板弹出方位（more 恒在主轴末端：row 下方右对齐 / column 右侧下对齐） */
    private _placement(): string {
        return this._dir === "column" ? "right-end" : "bottom-end";
    }

    // ── 编译期装配（shell 解析 + 触发按钮）───────────────────────────

    /**
     * 面板外壳解析：**默认无壳**——popover 解析链回退内置 `autospark.popover` 种子 shell
     * （自带边框/出口/arrow 载体，锚定模式箭头默认开启），宿主样式不再克隆延续；
     * `x-foldable-options.shell` 显式指定组件名时才以用户外壳为面板容器（查找走 popover
     * 的 scope 链 + 全局组件表协议，须自带默认出口）。非法值 warn + 维持无壳默认。
     */
    private _resolveShellName(): void {
        const explicit = this.getOption("shell");
        if (explicit == null || explicit === "") return;
        if (typeof explicit === "string" && explicit.trim() !== "") {
            this._shellName = explicit.trim();
            return;
        }
    }

    /**
     * more 触发按钮（编译期形态；图标走全局 sprite）：声明 `x-popover:共享空内容组件`
     * （attr 必填的通道契约，实际内容由 overlay 广播挂入）+ `x-popover-options`（默认仅
     * `at.placement` 按轴初值、换轴经 {@link _syncTriggerPlacement} 热更；`x-foldable-options.popover`
     * 对象整包透传合并——用户值优先，可配 arrow / delayShow / delayHide / at 等 x-popover
     * 全量选项）。键盘 Enter/Space 模拟 mouseenter/mouseleave（hover 模型补偿）。
     */
    private _buildTrigger(): void {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = TRIGGER_CLASS;
        btn.setAttribute("aria-label", "更多");
        btn.setAttribute("aria-haspopup", "true");
        btn.setAttribute(`x-popover:${CONTENT_COMPONENT_NAME}`, "");
        const popoverOpts: Record<string, any> = { at: { placement: this._placement() } };
        if (this._shellName) popoverOpts.shell = this._shellName;
        const pass = this.getOption("popover");
        if (pass != null) {
            if (typeof pass === "object" && !Array.isArray(pass)) {
                Object.assign(popoverOpts, pass);
            } else {
                this.warn(
                    `x-foldable: x-foldable-options.popover 须为对象（整包透传合并进触发按钮的 x-popover-options），当前形态已忽略`,
                );
            }
        }
        btn.setAttribute("x-popover-options", JSON.stringify(popoverOpts));
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("aria-hidden", "true");
        const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
        use.setAttribute("href", "#as-more");
        svg.appendChild(use);
        btn.appendChild(svg);
        // 不加 tooltip（title / data-tooltip 均不写）：hover 已弹出面板会与之同时出现；
        // 且 title 会触发 transformer 链 first-match-wins 遮蔽按钮上的 x-popover（旧实现教训）
        btn.addEventListener("keydown", (e) => this._onTriggerKeydown(e));
        const temp = document.createElement("div");
        temp.appendChild(btn);
        const nodes = this.engine.compiler.compileSubtree(this.el, temp, this.binding);
        const compiled = nodes.find(
            (n) => n instanceof HTMLElement && (n as HTMLElement).classList.contains(TRIGGER_CLASS),
        ) as HTMLButtonElement | undefined;
        if (!compiled) return;
        // scope 链挂接：compileSubtree 的 scope 参数只服务文本插值，元素走 transformElement
        // 在 detached temp 下建独立 rootless scope——shell 解析（popover 打开时沿 scope 链
        // getComponentDeclaration 找克隆壳注册）走不到宿主 scope，须显式挂回（否则回退内置 shell）
        const triggerScope = this.engine.findScopeByEl(compiled);
        if (triggerScope) (this.binding as AutoSparkScope).addChild(triggerScope);
        this._trigger = compiled;
        this.el.appendChild(compiled);
    }

    /** 键盘通道：Enter/Space 按面板开关状态模拟 hover 进出（delayShow=0 时同步开）。
     *  开关真相在触发按钮 dataset.panelOpen（中继写、此处读——keydown 监听挂在中继
     *  所属实例之外，Hybrid 双实例不共享字段，状态收敛到 DOM） */
    private _onTriggerKeydown(e: KeyboardEvent): void {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        this._trigger?.dispatchEvent(
            new MouseEvent(
                this._trigger.dataset.panelOpen === "1" ? "mouseleave" : "mouseenter",
            ),
        );
    }

    /** 宿主直接子元素清单（元素节点；排除触发按钮与 x-resizable 手柄——手柄是宿主真实
        子元素（`data-autospark-resize-handle` 契约属性）但 absolute 定位不占 flex 流，
        不参与折叠候选与求和） */
    private _childItems(): HTMLElement[] {
        return Array.from(this.el.children).filter(
            (n): n is HTMLElement =>
                n instanceof HTMLElement &&
                !n.classList.contains(TRIGGER_CLASS) &&
                !n.hasAttribute("data-autospark-resize-handle"),
        );
    }

    // ── 观察通道（尺寸 / DOM 结构 / 属性 / resize）─────────────────────

    /** 打开观察通道（RO + window resize + 宿主子树 MO；回调统一宏任务化防自触发重入） */
    private _startObserving(): void {
        if (typeof ResizeObserver !== "undefined") {
            // RO 是「后果」通道：折叠/恢复改变布局 → RO 重触发。稳定收敛靠步进算法的
            // 单调性（fold 前富余严格小于被折元素宽，恢复判定必不成立，无数学交替；
            // 不做熔断的论证见 _reconcile）
            this._ro = new ResizeObserver(() => this._reconcile());
            this._ro.observe(this.el);
            this._syncChildRO();
        }
        window.addEventListener("resize", this._onWinResize);
        if (typeof MutationObserver !== "undefined") {
            // attributeFilter 之外再按 mutation 记录过滤一次（childList / 目标属性才重估；
            // 其余属性写入——含本指令自身的样式写入——直接忽略，防自feed重估）。
            // data-direction 是换轴通道：scope 实例响应式换轴只写 dataset，本实例在此感知
            this._mo = new MutationObserver((muts) => {
                const relevant = muts.some(
                    (m) =>
                        m.type === "childList" ||
                        (m.type === "attributes" && m.attributeName === "data-direction"),
                );
                if (!relevant) return;
                setTimeout(() => {
                    if (this._destroyed) return;
                    this._syncAxisFromDom();
                    this._syncChildRO();
                    this._reconcile();
                }, 0);
            });
            this._mo.observe(this.el, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ["data-direction"],
            });
        }
    }

    /** 换轴感知（dataset.direction 单一真相——scope 实例写、本实例读）：换轴时折叠子元素全部按原位锚复位后按新轴全量重算 */
    private _syncAxisFromDom(): void {
        const dir = this.el.dataset.direction === "column" ? "column" : "row";
        if (dir === this._dir) return;
        this._dir = dir;
        if (this._stash.length > 0) this._restoreAll();
        this._reconcile();
    }

    /** 子元素尺寸观察同步（子元素增删后补挂 RO；detached 元素 RO 自动静默，无需摘除） */
    private _syncChildRO(): void {
        if (!this._ro) return;
        for (const el of this._childItems()) this._ro.observe(el);
    }

    // ── 折叠核心（步进收敛，每步一次真实布局）──────────────────────────

    /**
     * 内容主轴自然宽（**对齐无关**的溢出判据）：可见子元素 + 触发按钮（显示时）的主轴
     * 尺寸求和 + gap×(n-1)。`scrollWidth` 在非 start 主轴对齐下失真——flex-end 溢出向
     * 起始侧（负方向），负溢出不计入 scrollWidth（scroll > client 恒假，右对齐工具栏
     * 永不折叠）——判据不得依赖 scroll 尺寸；元素级求和（offsetWidth/offsetHeight）
     * 对齐无关。
     */
    private get _contentMain(): number {
        const kids: HTMLElement[] = [];
        for (const el of this._childItems()) if (!this._hidden(el)) kids.push(el);
        if (this._trigger && this._trigger.style.display === "inline-flex") kids.push(this._trigger);
        const gap = this._mainGap();
        let sum = 0;
        for (const el of kids) sum += this._sizeOf(el);
        return sum + gap * Math.max(0, kids.length - 1);
    }

    /**
     * 主轴内容可用宽：client 尺寸**减主轴 padding**——clientWidth/clientHeight 含
     * padding，而 flex 子元素布局在 content box 内，判据分母是内容区而非 client 区
     *（不减则阈值宽出 padding，临界态少折、按钮被 overflow:hidden 裁切）。
     * computed padding 恒为 px 解析值；空值（异常环境）归零。
     */
    private get _clientMain(): number {
        const cs = getComputedStyle(this.el);
        const px = (v: string): number => {
            const n = Number.parseFloat(v);
            return Number.isFinite(n) ? n : 0;
        };
        const pad =
            this._dir === "column"
                ? px(cs.paddingTop) + px(cs.paddingBottom)
                : px(cs.paddingLeft) + px(cs.paddingRight);
        const client = this._dir === "column" ? this.el.clientHeight : this.el.clientWidth;
        return client - pad;
    }

    private _sizeOf(el: HTMLElement): number {
        return this._dir === "column" ? el.offsetHeight : el.offsetWidth;
    }

    /** 主轴 gap（用户 CSS 承载，引擎不预设；normal 解析为 NaN 归零） */
    private _mainGap(): number {
        const cs = getComputedStyle(this.el);
        const raw = this._dir === "column" ? cs.rowGap : cs.columnGap;
        const n = Number.parseFloat(raw);
        return Number.isFinite(n) ? n : 0;
    }

    /**
     * 子元素可见性（display:none 不占布局——折叠候选与恢复判定都跳过）。
     *
     * detached 元素（stash 中）的 getComputedStyle 在浏览器与 happy-dom 均返回空样式
     * 表——恢复判定对栈内元素失明会把隐藏者错误放回。文档内以 computed 为权威；
     * 空值（detached）以内联 display 兜底（x-show 等运行期隐藏均落内联；类规则
     * display:none 对脱离文档元素两法皆不可判，按可见处理——放回后再经文档内
     * 重估通道纠正，不破坏收敛）。
     */
    private _hidden(el: HTMLElement): boolean {
        const computed = getComputedStyle(el).display;
        if (computed !== "") return computed === "none";
        return el.style.display === "none";
    }

    /**
     * 折叠重估：溢出 → 折叠最后一个可见子元素（缓存自然尺寸 + 原位锚，真实搬移出文档；
     * more 按钮显示、宿主 min 尺寸写入）；有富余 → 从栈顶试恢复（`scroll + gap + 缓存 ≤
     * client` 才放回，失败即停；隐藏者跳过留栈，等可见后自然回位）。每步重读真实布局，
     * more 显隐 / gap / 动态内容的耦合被循环自然吸收；guard 防御意外死循环。
     *
     * **不做振荡熔断**（初版有 `_settle` 深度回访熔断，已移除）：步进算法本身单调（fold
     * 前富余严格小于被折元素宽，恢复判定必不成立，决策 4 论证）——自触发 RO 链数学上
     * 收敛，每轮 guard 上限兜底单轮死循环；而「深度回访即熔断」会把**用户正常来回拖动**
     * （5→3→5）误判为拉锯——宿主宽度变化的唯一驱动若只是 RO（如滑块改 style.width），
     * 熔断后无外部输入解锁、机制永久静默。理论病态（宿主 CSS 尺寸依赖折叠态的深度拉锯）
     * 由 guard 上限表现为可见抖动，可发现可修，不再静默熔断。
     */
    private _reconcile(): void {
        if (this._destroyed || this._reconciling) return;
        this._reconciling = true;
        try {
            // 上限循环外定死（循环内折叠会使现存子元素减少，重算上限会收紧余量）
            const guardMax = this._childItems().length + 2;
            for (let guard = 0; guard < guardMax; guard++) {
                if (this._contentMain > this._clientMain) {
                    if (!this._foldOne()) break;
                    continue;
                }
                if (this._stash.length > 0) {
                    if (!this._restoreOne()) break;
                    continue;
                }
                break;
            }
        } finally {
            this._reconciling = false;
        }
    }

    /** 折叠一步：末个可见子元素出文档入栈；无可折叠者返回 false（溢出交 overflow:hidden 裁切） */
    private _foldOne(): boolean {
        const items = this._childItems();
        for (let i = items.length - 1; i >= 0; i--) {
            const el = items[i]!; // i < length 已保证索引存在（noUncheckedIndexedAccess 断言）
            if (this._hidden(el)) continue;
            this._cache.set(el, this._sizeOf(el));
            this._anchors.set(el, el.nextSibling);
            el.remove();
            this._stash.push(el);
            this._showTrigger(true);
            this._writeMinSize();
            return true;
        }
        return false;
    }

    /**
     * 恢复一步：栈顶起找首个可见者放回原位，实测放不下则同帧折回并停步。
     *
     * 恢复判定用**实测法**（真实放回 → 读内容求和溢出 → 放不下折回本人）：理论判定
     * `scroll + gap + cached ≤ client` 两条死路——不溢出态 scrollWidth = clientWidth
     * （scrollable overflow 取较大者）恒假；flex-end 右对齐下溢出向起始侧（负方向）
     * scrollWidth 又漏记负溢出。放回后按 `_contentMain`（对齐无关求和）校验；放回-
     * 校验-折回在同一同步块完成，无渲染帧间闪动；折回后停步（防振荡）。
     */
    private _restoreOne(): boolean {
        for (let i = this._stash.length - 1; i >= 0; i--) {
            const el = this._stash[i]!; // i >= 0 且 < length（noUncheckedIndexedAccess 断言）
            // 面板开态：栈内元素可能正展示于弹出面板（DOM 已挂入 body 侧面板出口，不在
            // 宿主子树）——放回宿主会当场抽走面板内容，且与后续折叠步在 guard 循环内互
            // 相拉锯（restore↔fold 振荡）。跳过；面板关闭（overlay:close 摘回 detached
            // 持有）后 isConnected 归 false，下一轮重估自然按需回位
            if (el.isConnected && !this.el.contains(el)) continue;
            if (this._hidden(el)) continue;
            this._stash.splice(i, 1);
            this._insertBack(el);
            if (this._contentMain > this._clientMain) {
                // 放不下：折回本人（缓存/锚在 _insertBack 已清，原地重记——放回态布局宽
                // 即自然宽，grow 不污染同决策 4 论证），本轮停步
                this._cache.set(el, this._sizeOf(el));
                this._anchors.set(el, el.nextSibling);
                el.remove();
                this._stash.push(el);
                return false;
            }
            if (this._stash.length === 0) this._showTrigger(false);
            return true;
        }
        return false;
    }

    /** 按原位锚复位（锚失效——运行时外部 DOM 变动——退化为尾插；触发按钮 DOM 恒居首位、
        视觉序由 flex order 承担，尾插 = appendChild 即视觉末尾） */
    private _insertBack(el: HTMLElement): void {
        const anchor = this._anchors.get(el) ?? null;
        if (anchor && anchor.parentNode === this.el) {
            this.el.insertBefore(el, anchor);
        } else {
            this.el.appendChild(el);
        }
        this._anchors.delete(el);
        this._cache.delete(el);
    }

    /** 换轴复位：全部折叠元素按 LIFO + 锚还原（锚在 DOM 未动时恒有效），再走全量重算 */
    private _restoreAll(): void {
        while (this._stash.length > 0) {
            this._insertBack(this._stash.pop()!);
        }
        this._showTrigger(false);
    }

    /** more 按钮显隐（display 切换单一真相在指令；未溢出时不参与 flex 不计 gap） */
    private _showTrigger(show: boolean): void {
        if (this._trigger) this._trigger.style.display = show ? "inline-flex" : "";
    }

    /**
     * 宿主 min 尺寸 = 触发按钮主轴尺寸 + 宿主主轴 padding/border（按钮**完整外沿占位**——
     * 写入后不撤，保证极窄态按钮不被宿主 padding/border 挤裁；同值不重写）。
     * computed padding/border 恒为 px 解析值；空值（异常环境）归零（同 {@link _clientMain}）。
     */
    private _writeMinSize(): void {
        if (!this._trigger) return;
        const cs = getComputedStyle(this.el);
        const px = (v: string): number => {
            const n = Number.parseFloat(v);
            return Number.isFinite(n) ? n : 0;
        };
        const edge =
            this._dir === "column"
                ? px(cs.paddingTop) +
                  px(cs.paddingBottom) +
                  px(cs.borderTopWidth) +
                  px(cs.borderBottomWidth)
                : px(cs.paddingLeft) +
                  px(cs.paddingRight) +
                  px(cs.borderLeftWidth) +
                  px(cs.borderRightWidth);
        const value = `${this._sizeOf(this._trigger) + edge}px`;
        const key = `${this._dir}:${value}`;
        if (key === this._minWritten) return;
        this._minWritten = key;
        if (this._dir === "column") this.el.style.minHeight = value;
        else this.el.style.minWidth = value;
    }

    // ── 面板内容中继（overlay:open 注入 / overlay:close 抢救）──────────

    /**
     * 订阅 overlay 广播：**open** 时按 `config.at.selector` 认领本指令触发按钮打开的实例
     * （selector = 按钮，PopoverDirective 缺省锚 = 宿主自身）→ 折叠子元素按 DOM 序挂入
     * 面板出口（活 DOM 无声明式投影通道，注入是唯一旁路；出口 display:contents 透明）；
     * **close** 时在面板 DOM 尚在的窗口把子元素摘回（脱离文档持有——覆盖物实例关闭即
     * 销毁 ADR-0052 修订共识 5，控件状态跨开关保留）。
     */
    private _setupPanelRelay(): void {
        const unwrap = (sub: any): (() => void) =>
            typeof sub === "function" ? sub : () => sub.off();
        this._unsubOpen = unwrap(
            (this.engine as any).on("overlay:open", (m: any) => {
                const payload = m?.payload ?? m;
                const inst = payload?.instance as OverlayInstance | undefined;
                if (!inst || this._destroyed) return;
                const at = (inst as any).config?.at;
                if (at?.selector !== this._trigger || this._stash.length === 0) return;
                this._inst = inst;
                if (this._trigger) this._trigger.dataset.panelOpen = "1";
                const panel = (inst as any).panel as HTMLElement | undefined;
                if (!panel) return;
                // 注入 defer 到微任务（ADR-0124）：overlay:open 在 _show() 同步派发，而内嵌
                // autospark.overlay 的 shell 其 overlay 组件实例化 defer 到 scheduler 微任务
                // （x-component 通道四惯例）——同步寻址时出口尚未编译，子元素会落壳根（overlay
                // 骨架之外）。schedule 与实例化同轮 FIFO 排后，寻址时出口已就位。
                this.engine.scheduler.schedule(() => {
                    if (this._destroyed || this._inst !== inst) return; // 关闭竞态守卫
                    // 出口寻址用编译后标记 data-slot（x-slot 属性已剥除，编译产物不可寻址）；
                    // 定名 default——overlay 骨架多出口并存（header/body/footer/...），
                    // 无名首查 [data-slot] 会命中文档序靠前的 header 出口
                    const outlet = panel.querySelector('[data-slot="default"]') ?? panel;
                    // 出口挂面板布局类（列堆叠 + gap 兜底——内置/自定义 shell 均不预设折叠
                    // 面板布局；类幂等 add，显式 shell 自带面板类样式时按优先级覆盖）
                    outlet.classList.add(PANEL_CLASS);
                    // stash push 序 = DOM 逆序，倒序挂入即还原文档序
                    for (const el of [...this._stash].reverse()) outlet.appendChild(el);
                });
            }),
        );
        this._unsubClose = unwrap(
            (this.engine as any).on("overlay:close", (m: any) => {
                const payload = m?.payload ?? m;
                if (payload?.instance && payload.instance === this._inst) this._onPanelClosed();
            }),
        );
    }

    /** 面板关闭善后（leave 动画未播、面板 DOM 尚在——x-popover 同款时序）：子元素摘回 */
    private _onPanelClosed(): void {
        for (const el of this._stash) el.remove();
        this._inst = null;
        if (this._trigger) delete this._trigger.dataset.panelOpen;
    }
}
