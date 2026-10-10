import { AutoSparkDirectiveBase, DirectiveKind } from "../features/directive/base";
import type { AutoSpark } from "../engine/engine";
import type { AutoSparkScope } from "../engine/scope";
import { buildComponentDef } from "../engine/compile/collect";
import type { OverlayInstance } from "../features/overlay/instance";

/**
 * x-block：溢出折叠容器（ADR-0098 重写版，与旧三段分区模型无承继）。
 *
 * **布局契约**：宿主 `display:flex` + `nowrap` + `align-items:center`；全部直接子元素默认
 * `flex-grow:0` / `flex-shrink:0`（不伸不缩，溢出交给折叠机制而非压缩）；子元素以
 * `data-grow` / `data-shrink` 契约属性直通 CSS `flex-grow` / `flex-shrink`（只写属性 = 1，
 * 显式数值原样、`"0"` = 显式关闭、非法/负值 warn + 回退 1；两属性互相独立、无隐含，
 * 无豁免类别——所有子元素均可被折叠）。
 *
 * **指令值 = 轴**（响应式）：裸词 `row` / `column` 按字面量（书写主轴场景，非法字面量
 * warn + 保持 row）；其余按 scope 表达式求值（结果 "column" → column，其余归一 row，
 * 静默归一如 x-splitter 先例），状态变化换轴——换轴时折叠子元素全部按原位锚复位后
 * 按新轴全量重算。
 *
 * **溢出折叠**（核心机制，布局数学直读 + 步进收敛）：shrink:0 + nowrap 保证溢出态下
 * `scrollWidth` = Σ子元素自然宽 + gap——「是否溢出」直读 `scrollMain > clientMain`，
 * 无需逐元素理论求和。步进循环每步一次真实布局：溢出 → 折叠最后一个**可见**子元素
 * （缓存自然尺寸 + 原位锚，真实搬移出文档存 stash）；有富余 → 从栈顶试恢复（
 * `scroll + gap + 缓存尺寸 ≤ client` 才放回，失败即停；防「多折一个」的自愈回看）。
 * grow 只在正剩余空间生效而折叠只发生在溢出态，故缓存测量不受 grow 拉伸污染。
 * 宿主 `min-width`（column 对称 `min-height`）= 触发按钮尺寸（写入后不撤，保证按钮
 * 永不被挤没）。
 *
 * **触发通道**（ResizeObserver 宿主 + 子元素 / MutationObserver childList + data-grow·
 * data-shrink 属性 / window resize 兜底）任一变化即全量重算——「绑定生效但布局不跟随」
 * 的静默失效零容忍（子元素增删、伸缩比值变化、内容尺寸变化全部跟随）。
 *
 * **弹出面板**：溢出时宿主末尾显示 more 触发按钮（内置 `more` 图标 + aria-label，键盘
 * Enter/Space 等价开关），声明 `x-popover` 交由 PopoverDirective（ADR-0060 hover 模型）
 * 全权接管开关/定位/动画。**面板外壳 = 宿主元素浅克隆**（清洗指令/绑定属性后加
 * `autospark-block-panel` 标识类 + 内嵌 `x-slot` 出口，编程式注册为组件）——用户在宿主
 * 类上的样式上下文（gap、后代选择器、主题变量）在面板内原样延续；`x-block-options.shell`
 * 可指定自定义外壳组件名（须提供默认出口）替换默认克隆壳。折叠子元素经 `overlay:open`
 * 广播认领后挂入面板出口，`overlay:close` 动画窗口内摘回 stash（脱离文档持有，控件
 * 状态跨开关保留）。
 *
 * **不做**（v1 裁决）：无事件广播、无 more 定制入口、`x-block-options` 仅 `shell` 一键。
 */

/** 容器契约类（全局样式选择器基准） */
const BLOCK_CLASS = "autospark-block";
/** 面板标识类（宿主浅克隆壳承载；面板内垂直堆叠布局挂此类） */
const PANEL_CLASS = "autospark-block-panel";
/** more 触发按钮（容器直接子元素，flex-shrink:0；未溢出 display:none 不参与布局不计 gap） */
const TRIGGER_CLASS = "autospark-block-trigger";

/**
 * 共享空内容组件名（点自由名——`x-popover:名` attr 经修饰符语法解析，点号会被截断）。
 * popover 通道要求 attr 必填（内容组件），实际内容由指令经 overlay 广播挂入面板出口，
 * 此载体仅满足通道契约；`display:contents` 不产生盒子、不参与面板布局。
 */
const CONTENT_COMPONENT_NAME = "autospark-block-content";

// 全局样式（类级 initialize 注入，幂等；CSS 变量定制视觉）
const BLOCK_STYLE_ID = "autospark-block-styles";
const BLOCK_CSS = `
.autospark-block{display:flex;flex-wrap:nowrap;align-items:center;overflow:hidden;}
.autospark-block[data-direction="column"]{flex-direction:column;}
/* 子元素默认不伸不缩（shrink:0 是溢出检测的布局数学前提）；data-grow/data-shrink 经
   指令写内联样式直通，优先级天然高于本默认 */
.autospark-block>:not(.${TRIGGER_CLASS}){flex-grow:0;flex-shrink:0;}
/* more 触发按钮：未溢出 display:none（不参与 flex 布局、不计 gap），溢出时由指令切
   inline-flex——显示与折叠态单一真相在指令 */
.autospark-block>.${TRIGGER_CLASS}{
  display:none;flex-grow:0;flex-shrink:0;align-items:center;justify-content:center;
  width:var(--autospark-block-trigger-size,24px);height:var(--autospark-block-trigger-size,24px);
  padding:0;border:none;background:transparent;color:inherit;cursor:pointer;border-radius:4px;
}
.autospark-block>.${TRIGGER_CLASS}>svg{width:16px;height:16px;stroke-width:1.5;}
.autospark-block>.${TRIGGER_CLASS}:hover{background:rgba(0,0,0,.06);}
.autospark-block>.${TRIGGER_CLASS}:focus-visible{outline:2px solid var(--autospark-block-trigger-focus,#94a3b8);outline-offset:-2px;}
/* 面板（宿主浅克隆壳）：垂直堆叠折叠子元素；gap 由宿主克隆携带的用户样式（类规则或
   内联 style）天然命中，无需引擎预设 */
.${PANEL_CLASS}{display:flex;flex-direction:column;align-items:stretch;}
/* 出口透明化：折叠子元素直接参与面板 flex 布局（gap 生效面 = 面板根） */
.${PANEL_CLASS}>[x-slot]{display:contents;}
/* 面板边框兜底（复刻 popover-shell 的 data-overlay-border 内置视觉；config.border 可关，
   宿主克隆携带的用户类样式按优先级覆盖） */
.${PANEL_CLASS}[data-overlay-border]{
  border:1px solid var(--autospark-overlay-border,rgba(0,0,0,.1));
  background:var(--autospark-overlay-bg,#fff);
  box-shadow:0 8px 30px rgba(0,0,0,.18);
  border-radius:var(--autospark-overlay-radius,8px);
}
/* overlay 容器直下的面板 z-index 契约（克隆壳无 autospark-dialog 类，须自带） */
[data-autospark-overlays]>.${PANEL_CLASS}{z-index:var(--autospark-overlay-z,1000);}
`;

/** 注入 block 全局样式（幂等；多 engine 共享、destroy 不移除——对齐全局样式惯例） */
export function registerBlockStyles(): void {
    if (document.getElementById(BLOCK_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = BLOCK_STYLE_ID;
    style.textContent = BLOCK_CSS;
    document.head.appendChild(style);
}

/** 克隆壳组件名序号（每宿主一份壳组件，模块级递增保证唯一） */
let shellSeq = 0;

/** 已 warn 过的非法伸缩比值（el + 属性名——重算通道高频复入，warn 只报一次） */
const ratioWarned = new WeakMap<HTMLElement, Set<string>>();

/**
 * x-block 指令（ADR-0098 重写版）：溢出折叠容器。
 */
export class BlockDirective extends AutoSparkDirectiveBase {
    static override readonly priority = 0;
    static override readonly singleton = true;
    /** Hybrid：scope 通道管编译期装配（克隆壳/触发按钮）+ observer 通道管生命周期（观察器启停） */
    static override readonly kind = DirectiveKind.Hybrid;

    /** 类级初始化：注入全局样式 + 注册共享空内容组件（幂等，per engine 一次） */
    static override initialize(engine: AutoSpark): void {
        registerBlockStyles();
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
    /** 面板外壳组件名（克隆壳或用户指定；写入触发按钮的 x-popover-options.shell） */
    private _shellName = "";
    /** 折叠子元素栈（push 序 = 折叠序 = DOM 逆序；栈顶 = DOM 最靠前的折叠元素） */
    private _stash: HTMLElement[] = [];
    /** 各折叠元素的原位锚（折叠时刻的 nextSibling；复位按 LIFO + 锚精确还原） */
    private _anchors = new Map<HTMLElement, ChildNode | null>();
    /** 各折叠元素的自然主轴尺寸缓存（溢出态测量值——grow 不污染，见文件头论证） */
    private _cache = new Map<HTMLElement, number>();
    /** 尺寸观察（宿主 + 子元素；观察开始必发一次首回调——初始评估入口） */
    private _ro: ResizeObserver | null = null;
    /** 宿主子树观察（childList 增删 + data-grow/data-shrink 属性变化的重估通道） */
    private _mo: MutationObserver | null = null;
    /** window resize 兜底通道（外部输入源——解锁振荡熔断；亦是测试驱动入口——happy-dom 无 RO 回调） */
    private _onWinResize = (): void => this._reconcile("ext");
    /** RO 链内的 stash 深度历史（振荡检测——折叠/恢复会改布局，自适应宽宿主下 RO 可能被反噬重触发） */
    private _settle = new Set<number>();
    /** 振荡熔断（RO 后果链停止重估；外部输入解锁） */
    private _fused = false;
    /** 重估重入防护（折叠/恢复动作会改变布局，防评估循环） */
    private _reconciling = false;
    /** 微任务建连前被销毁（快速 x-if 切换防护，splitter 先例） */
    private _destroyed = false;
    /** min 尺寸已写入值（同值不重写——防宿主 RO 循环） */
    private _minWritten = "";
    /** 面板当前打开（键盘通道的状态真相；overlay 广播认领时翻转） */
    private _panelOpen = false;
    /** 当前打开的实例（overlay:open 认领；overlay:close 广播时清引用） */
    private _inst: OverlayInstance | null = null;
    /** overlay:open / overlay:close 广播退订（destroy 摘除） */
    private _unsubOpen: (() => void) | null = null;
    private _unsubClose: (() => void) | null = null;

    // ── 生命周期 ──────────────────────────────────────────────────────

    override created(): void {
        // 新设计无参数形态（旧三段分区标记已随重构废除），attr 非空即误用
        if (this.attr) {
            this.warn(
                `x-block:${this.attr}: 不支持的参数形态（x-block 为无参容器指令，轴由值声明 row|column），本标记已忽略`,
            );
            return;
        }
        this._setupAxis();
        this._setupPanelRelay();
    }

    override compile(_context: Record<string, any>, _parent: HTMLElement): void {
        const host = this.el;
        host.classList.add(BLOCK_CLASS);
        host.dataset.direction = this._dir;
        this._buildShellComponent();
        this._buildTrigger();
    }

    /** 结果树挂载后：打开观察通道 + 子元素契约落样式 + 初始折叠评估 */
    override mounted(): void {
        if (this._destroyed) return;
        this._startObserving();
        this._applyChildContracts();
        this._reconcile("ext");
    }

    override destroy(): void {
        this._destroyed = true;
        this._ro?.disconnect();
        this._ro = null;
        this._mo?.disconnect();
        this._mo = null;
        window.removeEventListener("resize", this._onWinResize);
        this._settle.clear();
        this._fused = false;
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
        if (this.el) this.el.dataset.direction = dir;
        this._syncTriggerPlacement();
        if (this._stash.length > 0) this._restoreAll();
        this._reconcile("ext");
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

    // ── 编译期装配（克隆壳 + 触发按钮）────────────────────────────────

    /**
     * 面板外壳组件（编译期编程式注册）：宿主模板元素浅克隆 → 清洗（剥离 `x-*` / `:*` /
     * `@*` / 含 `{{}}` 的属性与容器契约类——壳会经组件编译且 shell scope rootless，残留
     * 绑定会误求值）→ 加面板标识类 + 内嵌 `x-slot` 出口 → buildComponentDef + 注册进
     * 宿主 scope 的 components 表（popover shell 解析走 scope 链，随 scope 生死、零全局污染）。
     * `x-block-options.shell` 显式指定时跳过克隆（用户外壳权威）。
     */
    private _buildShellComponent(): void {
        const explicit = this.getOption("shell");
        if (explicit != null && explicit !== "") {
            if (typeof explicit === "string" && explicit.trim() !== "") {
                this._shellName = explicit.trim();
                return;
            }
            this.warn(
                `x-block: shell 须为非空组件名（字符串），收到 "${explicit}" 已忽略（默认宿主克隆壳）`,
            );
        }
        const tpl = this.template;
        if (!tpl) {
            this.warn("x-block: 缺少模板元素，无法构建面板克隆壳（面板回退内置默认 shell）");
            return;
        }
        const clone = tpl.cloneNode(false) as HTMLElement;
        for (const attr of Array.from(clone.attributes)) {
            const dynamic =
                /^[x:@]/.test(attr.name) || (attr.value.includes("{{") && attr.value.includes("}}"));
            if (dynamic) clone.removeAttribute(attr.name);
        }
        clone.classList.remove(BLOCK_CLASS);
        clone.classList.add(PANEL_CLASS);
        const outlet = document.createElement("div");
        outlet.setAttribute("x-slot", "");
        clone.appendChild(outlet);
        const name = `autospark-block-shell-${++shellSeq}`;
        const warn = (msg: string) => this.warn(msg);
        const def = buildComponentDef(clone, name, warn, this.binding as AutoSparkScope);
        this.engine.registerComponentDef(def);
        const scope = this.binding as unknown as { components?: Record<string, HTMLElement> };
        if (!scope.components) scope.components = {};
        scope.components[name] = def.snapshot;
        this._shellName = name;
    }

    /**
     * more 触发按钮（编译期形态；图标走全局 sprite）：声明 `x-popover:共享空内容组件`
     * （attr 必填的通道契约，实际内容由 overlay 广播挂入）+ `x-popover-options`（shell =
     * 克隆壳/用户外壳名，at.placement 按轴初值、换轴经 {@link _syncTriggerPlacement} 热更）。
     * 键盘 Enter/Space 模拟 mouseenter/mouseleave（PopoverDirective 纯 hover 模型的补偿）。
     */
    private _buildTrigger(): void {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = TRIGGER_CLASS;
        btn.setAttribute("aria-label", "更多");
        btn.setAttribute("aria-haspopup", "true");
        btn.setAttribute(`x-popover:${CONTENT_COMPONENT_NAME}`, "");
        btn.setAttribute(
            "x-popover-options",
            `{shell:'${this._shellName}',at:{placement:'${this._placement()}'}}`,
        );
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
        this._trigger = compiled;
        this.el.appendChild(compiled);
    }

    /** 键盘通道：Enter/Space 按面板开关状态模拟 hover 进出（delayShow=0 时同步开） */
    private _onTriggerKeydown(e: KeyboardEvent): void {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        this._trigger?.dispatchEvent(
            new MouseEvent(this._panelOpen ? "mouseleave" : "mouseenter"),
        );
    }

    // ── 子元素伸缩契约（data-grow / data-shrink 直通）──────────────────

    /** 全量子元素契约落内联样式（mounted 初始 + DOM 变化后重跑；同值不重写——写自身即
        mutation，重写会在 MO 通道上自feed成宏任务风暴） */
    private _applyChildContracts(): void {
        for (const el of this._childItems()) {
            const grow = this._parseRatio(el, "data-grow");
            if (grow !== undefined && el.style.flexGrow !== String(grow)) {
                el.style.flexGrow = String(grow);
            }
            const shrink = this._parseRatio(el, "data-shrink");
            if (shrink !== undefined && el.style.flexShrink !== String(shrink)) {
                el.style.flexShrink = String(shrink);
            }
        }
    }

    /**
     * 比值属性解析（出现 = 1，显式数值原样，"0" = 显式关闭；非法/负 warn + 回退 1——
     * 重算通道高频复入，per 元素 per 属性只 warn 一次）。
     */
    private _parseRatio(el: HTMLElement, name: string): number | undefined {
        if (!el.hasAttribute(name)) return undefined;
        const raw = (el.getAttribute(name) ?? "").trim();
        if (raw === "") return 1;
        const n = Number(raw);
        if (Number.isFinite(n) && n >= 0) return n;
        const warned = ratioWarned.get(el);
        if (!warned?.has(name)) {
            this.warn(
                `x-block: ${name} 须为非负数值（缺省 1），收到 "${raw}" 已回退 1`,
            );
            if (!warned) ratioWarned.set(el, new Set([name]));
            else warned.add(name);
        }
        return 1;
    }

    /** 宿主直接子元素清单（元素节点；排除触发按钮） */
    private _childItems(): HTMLElement[] {
        return Array.from(this.el.children).filter(
            (n): n is HTMLElement =>
                n instanceof HTMLElement && !n.classList.contains(TRIGGER_CLASS),
        );
    }

    // ── 观察通道（尺寸 / DOM 结构 / 属性 / resize）─────────────────────

    /** 打开观察通道（RO + window resize + 宿主子树 MO；回调统一宏任务化防自触发重入） */
    private _startObserving(): void {
        if (typeof ResizeObserver !== "undefined") {
            // RO 是「后果」通道：折叠/恢复改变布局 → RO 重触发。稳定收敛靠步进算法的
            // 单调性（fold 前富余严格小于被折元素宽，恢复判定必不成立，无数学交替），
            // 病态拉锯（用户 CSS 使宿主尺寸依赖折叠态）由 _settle 熔断兜底（见 _reconcile）
            this._ro = new ResizeObserver(() => this._reconcile("ro"));
            this._ro.observe(this.el);
            this._syncChildRO();
        }
        window.addEventListener("resize", this._onWinResize);
        if (typeof MutationObserver !== "undefined") {
            // attributeFilter 之外再按 mutation 记录过滤一次（childList / 目标属性才重估；
            // 其余属性写入——含本指令自身的样式写入——直接忽略，防自feed重估）
            this._mo = new MutationObserver((muts) => {
                const relevant = muts.some(
                    (m) =>
                        m.type === "childList" ||
                        (m.type === "attributes" &&
                            (m.attributeName === "data-grow" ||
                                m.attributeName === "data-shrink")),
                );
                if (!relevant) return;
                setTimeout(() => {
                    if (this._destroyed) return;
                    this._applyChildContracts();
                    this._syncChildRO();
                    this._reconcile("ext");
                }, 0);
            });
            this._mo.observe(this.el, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ["data-grow", "data-shrink"],
            });
        }
    }

    /** 子元素尺寸观察同步（子元素增删后补挂 RO；detached 元素 RO 自动静默，无需摘除） */
    private _syncChildRO(): void {
        if (!this._ro) return;
        for (const el of this._childItems()) this._ro.observe(el);
    }

    // ── 折叠核心（步进收敛，每步一次真实布局）──────────────────────────

    /** 主轴读数（row 为宽 / column 为高） */
    private get _scrollMain(): number {
        return this._dir === "column" ? this.el.scrollHeight : this.el.scrollWidth;
    }

    private get _clientMain(): number {
        return this._dir === "column" ? this.el.clientHeight : this.el.clientWidth;
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

    /** 子元素可见性（display:none 不占布局——折叠候选与恢复判定都跳过） */
    private _hidden(el: HTMLElement): boolean {
        return getComputedStyle(el).display === "none";
    }

    /**
     * 折叠重估（按触发源分派）：溢出 → 折叠最后一个可见子元素（缓存自然尺寸 + 原位锚，
     * 真实搬移出文档；more 按钮显示、宿主 min 尺寸写入）；有富余 → 从栈顶试恢复（
     * `scroll + gap + 缓存 ≤ client` 才放回，失败即停；隐藏者跳过留栈，等可见后自然回位）。
     * 每步重读真实布局，more 显隐 / gap / 动态内容的耦合被循环自然吸收；guard 防御意外
     * 死循环。
     *
     * **振荡熔断**（`ro` 源专属）：折叠/恢复改变布局，自适应宽宿主（client 依赖内容）下
     * RO 可能被反噬重触发。步进算法本身单调（fold 前富余严格小于被折元素宽，恢复判定
     * 必不成立），但用户 CSS 病态构造（宿主尺寸依赖折叠态）可致深度拉锯——RO 链内 stash
     * 深度**回访**（A-B-A 模式）即熔断，直到下一个外部输入（resize / childList / 属性 /
     * 换轴）解锁。`ext` 源是用户意图，永不熔断且解锁。
     */
    private _reconcile(source: "ro" | "ext" = "ext"): void {
        if (this._destroyed || this._reconciling) return;
        if (source === "ro") {
            if (this._fused) return;
        } else {
            this._fused = false;
            this._settle.clear();
        }
        this._reconciling = true;
        try {
            // 上限循环外定死（循环内折叠会使现存子元素减少，重算上限会收紧余量）
            const guardMax = this._childItems().length + 2;
            for (let guard = 0; guard < guardMax; guard++) {
                if (this._scrollMain > this._clientMain) {
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
        if (source === "ro") {
            if (this._settle.has(this._stash.length)) {
                this._fused = true;
            } else {
                this._settle.add(this._stash.length);
            }
        }
    }

    /** 折叠一步：末个可见子元素出文档入栈；无可折叠者返回 false（溢出交 overflow:hidden 裁切） */
    private _foldOne(): boolean {
        const items = this._childItems();
        for (let i = items.length - 1; i >= 0; i--) {
            const el = items[i];
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

    /** 恢复一步：栈顶起找首个可见者，确有富余才放回原位；放不下即停（防振荡） */
    private _restoreOne(): boolean {
        const gap = this._mainGap();
        for (let i = this._stash.length - 1; i >= 0; i--) {
            const el = this._stash[i];
            if (this._hidden(el)) continue;
            const cached = this._cache.get(el) ?? 0;
            if (this._scrollMain + gap + cached > this._clientMain) return false;
            this._stash.splice(i, 1);
            this._insertBack(el);
            if (this._stash.length === 0) this._showTrigger(false);
            return true;
        }
        return false;
    }

    /** 按原位锚复位（锚失效——运行时外部 DOM 变动——退化为尾插） */
    private _insertBack(el: HTMLElement): void {
        const anchor = this._anchors.get(el) ?? null;
        if (anchor && anchor.parentNode === this.el) {
            this.el.insertBefore(el, anchor);
        } else {
            this.el.insertBefore(el, this._trigger);
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

    /** 宿主 min 尺寸 = 触发按钮主轴尺寸（写入后不撤——保证按钮永不被挤没；同值不重写） */
    private _writeMinSize(): void {
        if (!this._trigger) return;
        const px = `${this._sizeOf(this._trigger)}px`;
        const key = `${this._dir}:${px}`;
        if (key === this._minWritten) return;
        this._minWritten = key;
        if (this._dir === "column") this.el.style.minHeight = px;
        else this.el.style.minWidth = px;
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
                this._panelOpen = true;
                const panel = (inst as any).panel as HTMLElement | undefined;
                if (!panel) return;
                const outlet = panel.querySelector("[x-slot]") ?? panel;
                // stash push 序 = DOM 逆序，倒序挂入即还原文档序
                for (const el of [...this._stash].reverse()) outlet.appendChild(el);
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
        this._panelOpen = false;
    }
}
