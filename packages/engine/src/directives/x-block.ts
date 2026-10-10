import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { AutoSpark } from "../engine/engine";
import type { AutoDirectiveInfo } from "../features/directive/types";
import { BLOCK_PANEL_NAME } from "../components";
import type { OverlayInstance } from "../features/overlay/instance";

/**
 * x-block：布局条（ADR-0098）——行内三段条状布局 + 溢出折叠。
 *
 * **双角色指令**（一名一义，attr 分流）：`x-block="row|column"`（attr 空）是容器实例，
 * ownsChildren 接管子树；`x-block:header|body|footer`（attr 非空）是分区标记——正常流程
 * 由容器在收集期剥除标记属性（永不实例化），孤儿场景（深层 / 无容器祖先）实例化本类 →
 * warn 诊断、元素照常编译（x-pane 名位标记同型，合一在本类）。
 *
 * **布局契约**（ADR-0098 决策三）：容器 flex + `align-items:stretch`（分区等高）、分区
 * 内部 `align-items:center`（内容交叉轴居中）——两级分离化解「等高」与「居中」的表面矛盾；
 * 三段 nowrap；body flex-grow:1 恒为弹性区，header/footer 默认收缩系数（**不设 shrink:0**，
 * 决策四修订——定容会让分区永不缩小、溢出折叠失灵）。值 = row|column
 * 表达式（响应式换轴重排，x-splitter 先例；非 "column" 一律归一 row）。分区按语义序
 * 渲染（header → body → footer，追加序即文档序，无需 CSS order）；body 缺失不 warn
 * 静默空渲染（用户裁决，否决 x-layout content 的 warn 先例）；重复分区首胜 + warn；
 * 未标记渲染子元素 warn + 丢弃，`<template>`/`<script>`/文本静默容忍。
 *
 * **选项**（编译期静态，gap/padding/align 不热应用）：
 * - `gap` / `padding`：number（px）/ CSS 长度串原样，非法 warn + 忽略；
 * - `align`：`start|center|end`（默认 start）——轴无关逻辑值，写 body 的 justify-content
 *   （CSS 变量承载）；left/right 等旧值 warn + 忽略；
 * - `overflow`：`false` 整体禁用溢出折叠（默认开启）；
 * - `delayShow` / `delayHide`：透传为分区触发按钮的 `x-popover-options`（popover 悬浮
 *   模型的开关延迟，缺省不注入——PopoverDirective 默认 200/150ms 生效）；
 * - `headerPlacement` / `footerPlacement`：分区弹出方位（floating-ui placement 值），
 *   显式配置 = 用户权威不再随轴翻转；未配置按轴推导默认（row：bottom-start/bottom-end，
 *   column：right-start/right-end），换轴热更经 popover 指令实例 options 重写。
 * - `bodyMinSize`：body 收缩下限（row 为宽 / column 为高，默认 120px）——容器缩小时
 *   body 优先吸收、压到下限后退出收缩（flex min 钳制），剩余压缩量全部落在 header/footer，
 *   两端被压溢出才触发折入（收缩次序：body 吸收 → 两端压缩 → 两端折入，决策三修订）。
 *
 * **溢出折叠**（ADR-0098 决策四/五/六）：**分区级溢出检测**（分区被 flex 压缩后自身主轴
 * scrollWidth/Height > client + 1px 容差——「尺寸较小」的直接信号；ResizeObserver + window
 * resize + 宿主 childList MutationObserver 三通道重估）驱动渐进收缩链——footer 溢出先收
 * footer、header 溢出再收 header，body 永不收（body 溢出由容器 overflow:hidden 恒挂裁切）。
 * 收缩 = 分区子节点 reparent 进 stash 容器（实例持有，DOM 态跨开关保留）+ 分区挂
 * `x-block-collapsed` 类（用户 CSS 断言面；触发按钮常驻分区、display 随类切换）。
 *
 * **弹出面板 = x-popover 指令全权接管**（ADR-0098 决策五修订二）：触发按钮在分区子树
 * 编译期预置并声明 `x-popover:autospark.popover`——PopoverDirective（ADR-0060 悬浮模型）
 * 完整接管开关 / 定位 / 动画 / shell 解析 / delayShow·delayHide / 组件等待重试，x-block
 * 零自建弹层管理。x-block 只补两件事：
 * - **内容注入**：订阅 `overlay:open` 广播，按 at.selector 认领本指令按钮打开的实例 →
 *   把 stash 挂入面板（活 DOM 内容无声明式投影通道，注入是唯一旁路）；
 * - **键盘通道**（共识 Q16）：按钮 keydown Enter/Space → 模拟 mouseenter/mouseleave
 *   （PopoverDirective 是纯 hover 模型；Escape 关闭由 shell 既有能力承担）。
 * **常驻语义**：内容折叠期间常驻 stash、开关仅显隐——覆盖物实例「关闭即销毁」（ADR-0052
 * 修订共识 5），故订阅 `overlay:close` 广播在面板 DOM 尚在时把 stash 摘回（脱离文档但
 * 完整保留），下次打开重新挂入——控件状态跨开关保留。
 *
 * **事件**：`block:collapse` / `block:expand`（宿主派发、冒泡，`detail = { part }`）。
 */

/** 分区参数词表（渲染语义序） */
export type BlockPart = "header" | "body" | "footer";
const PART_ORDER: BlockPart[] = ["header", "body", "footer"];

/** 容器契约类（全局样式选择器基准） */
const BLOCK_CLASS = "autospark-block";
/** 分区契约属性（`data-block-part="header|body|footer"`） */
const PART_ATTR = "data-block-part";
/** 收缩态标识类（ADR-0098 决策七：用户裁决 class 而非 data-*） */
const COLLAPSED_CLASS = "x-block-collapsed";
/** 分区内预置的 popover 触发按钮（编译期声明 x-popover，PopoverDirective 接管开关） */
const TRIGGER_CLASS = "autospark-block-trigger";

/** 溢出检测容差（px）：亚像素舍入不误触发 */
const OVERFLOW_TOLERANCE = 1;

/** 各分区收缩后的触发图标（全局 sprite 名，icons.ts 内置表） */
const PART_TRIGGER_ICON: Record<BlockPart, string> = { header: "menu", body: "more", footer: "more" };
const PART_TRIGGER_LABEL: Record<BlockPart, string> = { header: "菜单", body: "更多", footer: "更多" };

// 全局样式（类级 initialize 注入，幂等；CSS 变量定制视觉，ADR-0098）
const BLOCK_STYLE_ID = "autospark-block-styles";
const BLOCK_CSS = `
.autospark-block{display:flex;align-items:stretch;overflow:hidden;}
.autospark-block[data-direction="column"]{flex-direction:column;}
/* 分区：等高（stretch 由容器承担）+ 内容交叉轴居中；nowrap 契约；min-*:0 允许收缩与溢出检测准确。
   header/footer 不设 flex-shrink:0（ADR-0098 决策四修订）：三段随容器变窄等比压缩，分区被压溢出
   （自身 scrollWidth > clientWidth）即「尺寸较小」信号——定容收缩会让分区永不缩小、溢出折叠失灵 */
.autospark-block>[${PART_ATTR}]{display:flex;align-items:center;min-width:0;min-height:0;white-space:nowrap;}
/* body 恒弹性 + 收缩下限（ADR-0098 决策三修订，用户裁决）：容器缩小时 body 优先吸收（grow:1），
   压到 bodyMinSize 下限后 flex min 钳制使其退出收缩——剩余压缩量全部落在 header/footer，
   两端被压溢出才触发折入（收缩次序：body 吸收 → 两端压缩 → 两端折入）；
   align 选项经 CSS 变量落在 body 主轴 */
.autospark-block>[${PART_ATTR}="body"]{flex-grow:1;justify-content:var(--autospark-block-align,flex-start);}
.autospark-block[data-direction="row"]>[${PART_ATTR}="body"]{min-width:var(--autospark-block-body-min,120px);}
.autospark-block[data-direction="column"]>[${PART_ATTR}="body"]{min-height:var(--autospark-block-body-min,120px);}
/* 触发按钮常驻分区（编译期预置、x-popover 接管开关）：未收缩时隐藏（display:none 不响应 hover），
   收缩类挂上即显示——display 切换与收缩态单一真相（COLLAPSED_CLASS）绑定 */
.autospark-block>[${PART_ATTR}]>.${TRIGGER_CLASS}{display:none;}
.autospark-block>[${PART_ATTR}].${COLLAPSED_CLASS}>.${TRIGGER_CLASS}{display:inline-flex;}
/* 触发按钮视觉（引擎 chrome，样式自治；对齐 splitter divider / expandable trigger 契约） */
.autospark-block>[${PART_ATTR}]>.${TRIGGER_CLASS}{
  flex-shrink:0;align-items:center;justify-content:center;
  width:var(--autospark-block-trigger-size,24px);height:var(--autospark-block-trigger-size,24px);
  padding:0;border:none;background:transparent;color:inherit;cursor:pointer;border-radius:4px;
}
.autospark-block>[${PART_ATTR}]>.${TRIGGER_CLASS}>svg{width:16px;height:16px;stroke-width:1.5;}
.autospark-block>[${PART_ATTR}]>.${TRIGGER_CLASS}:hover{background:rgba(0,0,0,.06);}
.autospark-block>[${PART_ATTR}]>.${TRIGGER_CLASS}:focus-visible{outline:2px solid var(--autospark-block-trigger-focus,#94a3b8);outline-offset:-2px;}
/* 占位壳：收缩分区在宿主中的原位锚（承载触发按钮），视觉由分区通用规则承担 */
/* x-block 载体面板不显示指示箭头（用户裁决）：面板紧贴触发按钮，指向装饰冗余 */
[data-overlay="${BLOCK_PANEL_NAME}"] .autospark-overlay-arrow{display:none;}
`;

/** 注入 block 全局样式（幂等；多 engine 共享、destroy 不移除——对齐全局样式惯例） */
export function registerBlockStyles(): void {
    if (document.getElementById(BLOCK_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = BLOCK_STYLE_ID;
    style.textContent = BLOCK_CSS;
    document.head.appendChild(style);
}

/** 分区声明（编译期收集的冻结快照） */
interface PartDecl {
    part: BlockPart;
    /** 冻结快照（cloneNode(true)，模板只读契约——标记属性已剥除） */
    template: HTMLElement;
}

/** align 逻辑值 → CSS justify-content 值 */
const ALIGN_CSS: Record<string, string> = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
};

/**
 * 分区弹出面板的锚定方位（用户裁决）：row 轴 header=bottom-start（面板左对齐按钮）、
 * footer=bottom-end（右对齐）；column 轴对称翻转为右展（header=right-start / footer=right-end）。
 */
function derivePlacement(part: BlockPart, dir: "row" | "column"): string {
    const end = part === "footer" ? "end" : "start";
    return dir === "column" ? `right-${end}` : `bottom-${end}`;
}

/** floating-ui placement 合法词表（四基向 + 8 组合） */
const PLACEMENT_RE = /^(top|bottom|left|right)(-(start|end))?$/;

/**
 * x-block 指令（ADR-0098）：容器（attr 空）与分区标记（attr 非空，孤儿诊断）双角色。
 */
export class BlockDirective extends AutoSparkDirectiveBase {
    static override readonly priority = 0;
    static override readonly singleton = true;

    /** 结构指令：仅容器实例接管子树（分区标记不占——正常流程被容器剥除，孤儿照常编译） */
    static override ownsChildren(info: AutoDirectiveInfo): boolean {
        return !info.attr;
    }

    /** 类级初始化：注入全局样式（幂等） */
    static override initialize(_engine: AutoSpark): void {
        registerBlockStyles();
    }

    // ── 编译期收集态 ──────────────────────────────────────────────────

    /** 当前方向（表达式求值派生，非 "column" 一律 row——x-splitter 静默归一先例） */
    private _dir: "row" | "column" = "row";
    /** 分区声明（词表内首胜者；索引即 PART_ORDER 序） */
    private _parts: Partial<Record<BlockPart, PartDecl>> = {};
    /** 词表外的 x-block:* 标记（克隆快照；compile 期照常编译——孤儿实例 warn 诊断） */
    private _strays: HTMLElement[] = [];

    // ── 溢出折叠运行态 ────────────────────────────────────────────────

    /** 分区编译产物（compile 期填充；与 _parts 键对齐） */
    private _partEls: Partial<Record<BlockPart, HTMLElement>> = {};
    /** 各分区触发按钮（compile 期预置的 x-popover 宿主，开关由 PopoverDirective 接管） */
    private _triggers: Partial<Record<BlockPart, HTMLButtonElement>> = {};
    /** 当前收缩集（渐进链真相） */
    private _collapsed = new Set<BlockPart>();
    /** 各分区 stash 容器（收缩时收集子节点；脱离文档仍完整保留——常驻语义载体） */
    private _stash = new Map<BlockPart, HTMLElement>();
    /** 尺寸观察（真实浏览器通道；观察开始必发一次首回调——初始评估入口） */
    private _ro: ResizeObserver | null = null;
    /** 宿主 childList 观察（分区 x-if/x-show 存在性与内容动态变化的重估通道） */
    private _mo: MutationObserver | null = null;
    /** window resize 兜底通道（亦是测试驱动入口——happy-dom 无 RO 回调） */
    private _onWinResize = (): void => this._evaluate();
    /** 重估重入防护（收缩/展开动作会改变布局，防评估循环） */
    private _evaluating = false;
    /** 溢出折叠禁用（overflow:false） */
    private _overflowEnabled = true;

    // ── 弹出面板运行态（开关归 PopoverDirective，此处仅内容注入与抢救）──

    /** 当前打开的实例（overlay:open 认领；overlay:close 广播时清引用） */
    private _inst: OverlayInstance | null = null;
    /** 当前面板归属分区（哪端的按钮打开的） */
    private _openPart: BlockPart | null = null;
    /** overlay:open / overlay:close 广播退订（destroy 摘除） */
    private _unsubOpen: (() => void) | null = null;
    private _unsubClose: (() => void) | null = null;
    /** 微任务建连前被销毁（快速 x-if 切换防护，splitter 先例） */
    private _destroyed = false;

    // ── 生命周期 ──────────────────────────────────────────────────────

    override created(): void {
        // 分区标记实例（attr 非空）：正常流程已被容器剥除标记属性，走到这里即孤儿/非法参数
        if (this.attr) {
            if (!(PART_ORDER as string[]).includes(this.attr)) {
                this.warn(
                    `x-block:${this.attr}: 未知分区参数（词表 header|body|footer），本标记已忽略`,
                );
            } else {
                this.warn(
                    `x-block:${this.attr}: 仅可作为 x-block 容器的直接子元素使用（深层或无 x-block 祖先的声明无效），本标记已忽略`,
                );
            }
            return;
        }
        this._collectParts();
        this._applyStaticOptions();
        this._setupDirection();
        this._setupPanelRelay();
        this._setupOverflow();
    }

    override compile(_context: Record<string, any>, _parent: HTMLElement): void {
        const host = this.el;
        host.classList.add(BLOCK_CLASS);
        host.dataset.direction = this._dir;
        // 分区按语义序追加（header → body → footer，追加序即文档序，无需 CSS order）
        for (const part of PART_ORDER) {
            const decl = this._parts[part];
            if (!decl) continue;
            const el = this._compilePart(decl);
            if (el) host.appendChild(el);
        }
        // 词表外语法标记：照常编译（属性由编译器剥除，孤儿实例 warn 诊断）
        for (const tpl of this._strays) {
            const temp = document.createElement("div");
            temp.appendChild(tpl);
            this.engine.compiler.compileSubtree(this.el, temp, this.binding);
        }
        this._strays = [];
    }

    /** 结果树挂载后：打开观察通道（RO 首回调即初始评估） */
    override mounted(): void {
        if (this._destroyed) return;
        this._startObserving();
    }

    override destroy(): void {
        this._destroyed = true;
        this._teardownOverflow();
        if (this._inst && !this._inst.destroyed && this._inst.visible) {
            this._inst.requestClose("consumer-destroyed");
        }
        this._unsubOpen?.();
        this._unsubOpen = null;
        this._unsubClose?.();
        this._unsubClose = null;
        this._parts = {};
        this._strays = [];
        this._partEls = {};
        this._triggers = {};
        this._collapsed.clear();
        this._stash.clear();
    }

    // ── 分区收集（created 期，模板只读）────────────────────────────────

    /**
     * 扫描宿主模板直接子元素：只认 `x-block:词表参数` 标记的分区（重复首胜 + warn；
     * 标记属性从克隆快照剥除——防 BlockDirective 在分区上二次实例化）；未标记渲染子元素
     * warn + 丢弃（x-splitter/x-layout 家族先例）；`<template>`/`<script>`/文本静默容忍。
     * body 缺失不 warn（ADR-0098 决策二：弹性区缺席不构成误用）。
     */
    private _collectParts(): void {
        const tpl = this.template;
        if (!tpl) return;
        for (const child of Array.from(tpl.children)) {
            if (child instanceof HTMLTemplateElement || child instanceof HTMLScriptElement) {
                continue;
            }
            const el = child as HTMLElement;
            const marker = PART_ORDER.map((p) => `x-block:${p}`).find((n) => el.hasAttribute(n));
            if (!marker) {
                // x-block: 前缀但词表外（如 x-block:aside）：留给通用编译——BlockDirective(attr=aside)
                // 孤儿实例化后 warn「未知分区参数」（失效可发现），元素本体照常渲染
                const stray = Array.from(el.attributes).some((a) => a.name.startsWith("x-block:"));
                if (stray) {
                    this._strays.push(el.cloneNode(true) as HTMLElement);
                    continue;
                }
                this.warn(
                    `x-block: 未标记的子元素 <${el.localName}> 被丢弃——分区须以 x-block:header|body|footer 标记（ADR-0098 决策二）`,
                );
                continue;
            }
            const part = marker.slice("x-block:".length) as BlockPart;
            if (this._parts[part]) {
                this.warn(
                    `x-block:${part}: 重复分区声明，首个生效、其余丢弃`,
                );
                continue;
            }
            const snapshot = el.cloneNode(true) as HTMLElement;
            snapshot.removeAttribute(marker);
            this._parts[part] = { part, template: snapshot };
        }
    }

    /**
     * 编译单分段子树（temp wrapper 技巧，x-layout 先例）+ 契约属性 + **预置触发按钮**：
     * 按钮作为分区**内部**最后子节点进入编译管道（`x-popover:autospark.popover` 声明）——
     * PopoverDirective 正常实例化并全权接管开关/定位/动画/shell；未收缩时按钮
     * display:none（全局样式随 COLLAPSED_CLASS 切换）。delayShow/delayHide 经
     * x-block-options 声明时透传为按钮的 x-popover-options（PopoverDirective 的
     * getOption 回退链原生消费）；at.placement 初值按轴推导，换轴时经指令实例热更
     * （见 {@link _syncTriggerPlacements}）。
     */
    private _compilePart(decl: PartDecl): HTMLElement | null {
        decl.template.appendChild(this._buildTrigger(decl.part));
        const temp = document.createElement("div");
        temp.appendChild(decl.template);
        const nodes = this.engine.compiler.compileSubtree(this.el, temp, this.binding);
        const el = nodes.find((n) => n instanceof HTMLElement) as HTMLElement | undefined;
        if (!el) return null;
        el.setAttribute(PART_ATTR, decl.part);
        // 编译产物中的触发按钮：补挂键盘通道（PopoverDirective 纯 hover 模型的补偿，共识 Q16）
        const trigger = el.querySelector(`:scope > .${TRIGGER_CLASS}`) as HTMLButtonElement | null;
        if (trigger) {
            this._triggers[decl.part] = trigger;
            trigger.addEventListener("keydown", (e) => this._onTriggerKeydown(e, decl.part));
        }
        this._partEls[decl.part] = el;
        return el;
    }

    /** 触发按钮模板（编译期形态；图标走全局 sprite，expandable-trigger 先例） */
    private _buildTrigger(part: BlockPart): HTMLButtonElement {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = TRIGGER_CLASS;
        btn.setAttribute("aria-label", PART_TRIGGER_LABEL[part]);
        // 不加任何 tooltip 提示（title / data-tooltip 均不写）：hover 已弹出 popover 面板，
        // tooltip 会与之同时出现（用户裁决）；且 title 会触发 transformer 链前置转换器
        // first-match-wins 遮蔽后续指令 transformer（按钮上的 x-popover 将静默丢失）
        // ——可达性由 aria-label 承担。
        btn.setAttribute(`x-popover:${BLOCK_PANEL_NAME}`, "");
        btn.setAttribute("x-popover-options", this._popoverOptionsJson(part));
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("aria-hidden", "true");
        const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
        use.setAttribute("href", `#as-${PART_TRIGGER_ICON[part]}`);
        svg.appendChild(use);
        btn.appendChild(svg);
        return btn;
    }

    /** delayShow/delayHide 透传（x-block-options 声明才注入按钮选项；缺省走 PopoverDirective 默认） */
    private _popoverOptionsJson(part: BlockPart): string {
        const members = [`at:{placement:'${this._resolvePlacement(part)}'}`];
        const show = this.getOption("delayShow");
        const hide = this.getOption("delayHide");
        if (show !== undefined) members.push(`delayShow:${Number(show) || 0}`);
        if (hide !== undefined) members.push(`delayHide:${Number(hide) || 0}`);
        return `{${members.join(",")}}`;
    }

    /**
     * 分区弹出方位解析：`headerPlacement` / `footerPlacement` 显式配置 = 用户权威
     * （写什么用什么，不再随轴翻转）；未配置按轴推导默认（row：bottom-start/bottom-end，
     * column：right-start/right-end）。非法值 warn + 回退推导默认。
     */
    private _resolvePlacement(part: BlockPart): string {
        const key = part === "header" ? "headerPlacement" : "footerPlacement";
        const raw = this.getOption(key);
        if (raw != null && raw !== "") {
            const v = String(raw).trim();
            if (PLACEMENT_RE.test(v)) return v;
            this.warn(
                `x-block: ${key} 须为 floating-ui 方位值（如 bottom-start / right-end），收到 "${raw}" 已忽略（按轴推导默认）`,
            );
        }
        return derivePlacement(part, this._dir);
    }

    /**
     * 键盘通道（PopoverDirective 纯 hover 模型的补偿）：Enter/Space 模拟 mouseenter /
     * mouseleave 驱动开关（delayShow=0 时同步打开）；Escape 关闭由 shell 既有能力承担。
     */
    private _onTriggerKeydown(e: KeyboardEvent, part: BlockPart): void {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        const trigger = this._triggers[part];
        if (!trigger) return;
        trigger.dispatchEvent(
            new MouseEvent(this._openPart === part ? "mouseleave" : "mouseenter"),
        );
    }

    // ── 配置（编译期静态）─────────────────────────────────────────────

    /** gap / padding / align / bodyMinSize 静态应用（非法 warn + 忽略；不热应用） */
    private _applyStaticOptions(): void {
        const gap = this._resolveLength("gap");
        if (gap !== null) this.el.style.gap = gap;
        const padding = this._resolveLength("padding");
        if (padding !== null) this.el.style.padding = padding;
        // body 收缩下限（row 为宽、column 为高——CSS 按 data-direction 分支取同一变量）。
        // 单值长度严格校验（值进 flex min 钳制管线，非法会静默失效——不能像 gap/padding
        // 那样对字符串原样放行）
        this.el.style.setProperty("--autospark-block-body-min", this._resolveBodyMin());
        const align = this.getOption("align");
        if (align != null && align !== "") {
            const css = ALIGN_CSS[String(align)];
            if (css) {
                this.el.style.setProperty("--autospark-block-align", css);
            } else {
                this.warn(
                    `x-block: align 须为 start|center|end（轴无关逻辑值），收到 "${align}" 已忽略（默认 start）`,
                );
            }
        }
        this._overflowEnabled = this.getOption("overflow") !== false;
    }

    /** 长度选项解析（number≥0 按 px / 非空字符串原样；非法 warn 返回 null） */
    private _resolveLength(key: string): string | null {
        const raw = this.getOption(key);
        if (raw == null || raw === "") return null;
        if (typeof raw === "number") {
            if (Number.isFinite(raw) && raw >= 0) return `${raw}px`;
        } else if (typeof raw === "string" && raw.trim() !== "") {
            return raw.trim();
        }
        this.warn(`x-block: ${key} 须为非负数字（px）或 CSS 长度串，收到 "${raw}" 已忽略`);
        return null;
    }

    /**
     * body 收缩下限解析（`bodyMinSize`）：number≥0 按 px、string 限**单值长度**形态
     * （数字 + 可选单位——与 gap/padding 的任意 CSS 串不同，此值进 flex min 钳制管线，
     * 非法形态会静默失效使下限落空）。缺省/非法均回退默认 120px。
     */
    private _resolveBodyMin(): string {
        const raw = this.getOption("bodyMinSize");
        if (raw == null || raw === "") return "120px";
        if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) return `${raw}px`;
        if (
            typeof raw === "string" &&
            /^(\d+(\.\d+)?)(px|%|rem|em|vw|vh|ch)?$/i.test(raw.trim())
        ) {
            return raw.trim();
        }
        this.warn(
            `x-block: bodyMinSize 须为非负数字（px）或单值 CSS 长度（如 120 / "10rem"），收到 "${raw}" 已忽略（默认 120px）`,
        );
        return "120px";
    }

    // ── 方向（响应式换轴）─────────────────────────────────────────────

    /** 值表达式订阅（scope.watch 双轨；字面量经 with 求值即常量）+ 初值应用 */
    private _setupDirection(): void {
        const expr = String(this.value ?? "").trim() || "'row'";
        const initial = this.binding.watch(expr, ({ value }) => {
            this._applyDirection(value === "column" ? "column" : "row");
        });
        this._applyDirection(initial === "column" ? "column" : "row");
    }

    private _applyDirection(dir: "row" | "column"): void {
        this._dir = dir;
        if (this.el) this.el.dataset.direction = dir;
        this._syncTriggerPlacements();
    }

    /**
     * 换轴时热更触发按钮的弹出方位：按钮上的 PopoverDirective 实例经 scope 链定位，
     * 重写其指令选项 at.placement——_resolveConfig 每次打开现读（ADR-0052 v2.3 重开生效），
     * 下一次 hover 即按新轴展开；编译期初值由 _buildTrigger 注入。compile 前调用（初值
     * 应用）时 triggers 为空表自然跳过。
     */
    private _syncTriggerPlacements(): void {
        for (const part of PART_ORDER) {
            const trigger = this._triggers[part];
            if (!trigger) continue;
            const scope = this.engine.findScopeByEl(trigger);
            const inst = scope?.directives.find((d) => d.info.name === "popover");
            if (inst) {
                (inst as any).options.at = { placement: this._resolvePlacement(part) };
            }
        }
    }

    // ── 溢出折叠管线 ──────────────────────────────────────────────────

    /** 打开观察通道（RO + window resize + 宿主 childList MO；overflow:false 全不开） */
    private _setupOverflow(): void {
        if (!this._overflowEnabled) return;
        if (typeof ResizeObserver !== "undefined") {
            this._ro = new ResizeObserver(() => this._evaluate());
        }
        window.addEventListener("resize", this._onWinResize);
        if (typeof MutationObserver !== "undefined") {
            // childList：分区 x-if detach / x-show 挂卸、子内容增删——存在性变化的重估通道。
            // 回调宏任务化：evaluate 自身的收缩/回滚动作也改 childList，微任务直调会无限
            // 重入震荡（同轮收敛已由 evaluate 循环内完成，宏任务化只放行真实外部变化）
            this._mo = new MutationObserver(() => setTimeout(() => this._evaluate(), 0));
        }
    }

    /** mounted 后开启观察（RO 观察开始必发一次首回调 = 初始评估） */
    private _startObserving(): void {
        this._ro?.observe(this.el);
        this._mo?.observe(this.el, { childList: true, subtree: true });
    }

    /** 分区溢出测量（ADR-0098 决策四修订：分区级判据——分区被 flex 压缩后自身主轴
     *  scroll 超出 client 即「尺寸较小」；happy-dom 恒 0 → 恒不溢出） */
    private _partOverflow(part: BlockPart): boolean {
        const el = this._partEls[part];
        if (!el || el.parentElement !== this.el) return false;
        if (this._dir === "column") {
            return el.scrollHeight > el.clientHeight + OVERFLOW_TOLERANCE;
        }
        return el.scrollWidth > el.clientWidth + OVERFLOW_TOLERANCE;
    }

    /**
     * 溢出重估（渐进链，ADR-0098 决策四修订）：分区被压缩溢出时按 footer → header 收
     * （body 恒弹性永不收，body 溢出由容器 overflow:hidden 裁切）；不溢出时按 header →
     * footer 试展——试展后该分区仍溢出即**静默回滚**并停（事件只报站得稳的状态变迁，
     * 避免 expand 后立刻 collapse 的失衡序）。收缩释放空间会改变其余分区的压缩量，
     * 循环内现测现判，guard 防御异常布局下的死循环。
     */
    private _evaluate(): void {
        if (this._destroyed || !this._overflowEnabled || this._evaluating) return;
        this._evaluating = true;
        try {
            for (let guard = 0; guard < 4; guard++) {
                const next = this._collapsible("footer") && this._partOverflow("footer")
                    ? "footer"
                    : this._collapsible("header") && this._partOverflow("header")
                      ? "header"
                      : null;
                if (!next) break; // 终态：无可收分区（body 溢出交容器裁切）
                this._applyCollapse(next);
                this._emit(next, "collapse");
            }
            for (let guard = 0; guard < 4; guard++) {
                const back =
                    this._collapsed.has("header") ? "header" : this._collapsed.has("footer") ? "footer" : null;
                if (!back) break;
                this._applyExpand(back);
                if (this._partOverflow(back)) {
                    this._applyCollapse(back); // 回滚（静默——展开尝试不成立）
                    break;
                }
                this._emit(back, "expand");
            }
        } finally {
            this._evaluating = false;
        }
    }

    /** 可收缩判定：分区在场（编译产物存活且仍在宿主）且未收缩 */
    private _collapsible(part: BlockPart): boolean {
        return !this._collapsed.has(part) && this._partEls[part]?.parentElement === this.el;
    }

    /**
     * 收缩纯动作（无事件）：**整个分区元素**搬入 stash（Map 持有、脱离文档——用户对分区
     * 的 class / padding 等样式在面板内原样生效，开发者自行控制分区外观，用户裁决）；
     * 原位放引擎占位壳（同契约属性 + 收缩类）承载触发按钮——按钮从分区内移入占位壳
     * （DOM 搬移不掉 PopoverDirective 的监听与锚定引用，hover 照常开面板、锚点随按钮）。
     */
    private _applyCollapse(part: BlockPart): void {
        const el = this._partEls[part];
        const trigger = this._triggers[part];
        if (!el || this._collapsed.has(part)) return;
        const placeholder = document.createElement("div");
        placeholder.setAttribute(PART_ATTR, part);
        placeholder.classList.add(COLLAPSED_CLASS);
        el.before(placeholder);
        if (trigger) placeholder.appendChild(trigger);
        el.remove(); // 分区元素脱离文档（Map 持有，面板开时挂入面板——占位壳是原位锚）
        this._stash.set(part, el);
        el.classList.add(COLLAPSED_CLASS);
        this._collapsed.add(part);
    }

    /**
     * 展开纯动作（无事件）：先通知触发器「指针已离开」（PopoverDirective 按宽限调度
     * 关闭——relatedTarget 为 null 必关，面板开着时由 overlay:close 抢救通道摘回分区），
     * 再用分区元素**原位替换占位壳**（位置精确还原）+ 按钮搬回分区内 + 摘收缩类。
     */
    private _applyExpand(part: BlockPart): void {
        const el = this._partEls[part];
        if (!el || !this._collapsed.has(part)) return;
        this._triggers[part]?.dispatchEvent(new MouseEvent("mouseleave"));
        // 占位壳 = 分区元素在宿主中的位置锚（replaceWith 精确还原）；按钮随占位壳被移出
        // 文档（引用仍在 _triggers），搬回分区内恢复编译期形态
        const placeholder = this.el.querySelector(
            `:scope > [${PART_ATTR}="${part}"].${COLLAPSED_CLASS}`,
        );
        if (placeholder) placeholder.replaceWith(el);
        else this.el.appendChild(el);
        const trigger = this._triggers[part];
        if (trigger && trigger.parentElement !== el) el.appendChild(trigger);
        el.classList.remove(COLLAPSED_CLASS);
        // 必须出 stash 表：面板关闭广播的抢救遍历只摘 _stash 内的分区——已展开回原位的
        // 分区若残留表内，150ms 后 overlay:close 善后会把刚恢复的分区再次摘出文档
        this._stash.delete(part);
        this._collapsed.delete(part);
    }

    /** 宿主派发收缩/展开事件（冒泡，detail {part}——家族惯例） */
    private _emit(part: BlockPart, phase: "collapse" | "expand"): void {
        this.el.dispatchEvent(new CustomEvent(`block:${phase}`, { detail: { part }, bubbles: true }));
    }

    // ── 面板内容中继（overlay:open 注入 / overlay:close 抢救）──────────

    /**
     * 订阅 overlay 广播：**open** 时按 `config.at.selector` 反查分区（selector = 触发按钮，
     * 与 _triggers 表比对——PopoverDirective 的 mouseenter 监听先于本类注册，delayShow=0
     * 时同步打开使广播先于任何意图记录，故认领只信锚元素）→ stash 挂入面板（活 DOM 内容
     * 无声明式投影通道，注入是唯一旁路）；**close** 时在面板 DOM 尚在的窗口把 stash 摘回
     * （脱离文档但 Map 持有，子树 DOM 态完整保留——常驻语义载体）。
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
                const part = (Object.keys(this._triggers) as BlockPart[]).find(
                    (p) => this._triggers[p] === at?.selector,
                );
                if (!part || !this._stash.has(part)) return; // 非本指令按钮 / 分区未收缩
                this._inst = inst;
                this._openPart = part;
                const stash = this._stash.get(part);
                if (inst.panel && stash) inst.panel.appendChild(stash);
            }),
        );
        this._unsubClose = unwrap(
            (this.engine as any).on("overlay:close", (m: any) => {
                const payload = m?.payload ?? m;
                if (payload?.instance && payload.instance === this._inst) this._onPanelClosed();
            }),
        );
    }

    /** 面板关闭善后（leave 动画未播、面板 DOM 尚在——x-popover 同款时序）：stash 摘回 */
    private _onPanelClosed(): void {
        for (const stash of this._stash.values()) stash.remove();
        this._inst = null;
        this._openPart = null;
    }

    /** 溢出观察通道整体清理（destroy） */
    private _teardownOverflow(): void {
        this._ro?.disconnect();
        this._ro = null;
        this._mo?.disconnect();
        this._mo = null;
        window.removeEventListener("resize", this._onWinResize);
    }
}
