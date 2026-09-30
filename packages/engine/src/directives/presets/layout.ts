import { AutoSparkDirectiveBase } from "../base";
import type { AutoSpark } from "../../engine";
import type { AutoDirectiveInfo } from "../types";
import { relaxedToJson } from "../../utils/relaxedToJson";
import { ExpandableDirective } from "./expandable";

/**
 * x-layout：布局容器（ADR-0074）——grid 骨架 + x-pane 布局窗格。
 *
 * **结构契约**（ownsChildren）：宿主直接子元素中只认 `x-pane:参数` 标记的布局窗格，
 * 其余编译期剪枝 + warn（x-define 剪枝先例）；`<template>`/`<script>` 静默容忍。
 * content 窗格必需，缺失 warn + 降级（grid 照建、content 位以 `.` 空洞占位）。
 *
 * **grid 模板**（决策二）：编译期按「窗格存在性 × through 组合 × 侧窗格数」动态生成
 * `grid-template-areas` 与行/列模板（{@link buildLayoutGrid} 纯函数，回流复用同一真相）。
 * 列 = [left?] content(1fr) [right?]，行 = [header?] middle(1fr) [footer?]；
 * header 全宽是缺省态——sidebar 声明 through=up 才占据 header 行带、把 header 推向对侧。
 * 窗格元素即 grid item（`grid-area` 按参数定名），**永不 reparent**。
 *
 * **同侧多窗格**（决策七）：按 DOM 序进分割容器——**程序化组合 x-splitter**（容器挂
 * `x-splitter` 属性整体编译，窗格转面板语义：层内首窗格 data-size 定容、余者自适应，
 * 拖分隔条守恒分配；3+ 递归嵌套链）。分割窗格跳过默认行为注入（调节走分隔条、折叠走
 * 窗格显式 data-expandable 的 splitter 通道），不再吃 layout 的 gap（间距由分隔条承载）。
 * 容器是该侧唯一 grid item；**仅 DOM 首个窗格有 through 资格**。
 *
 * **响应式边界**（决策四）：存在性回流是唯一响应式维度——x-pane 编译期订阅同元素
 * x-if / x-show 的存在性表达式（scope.watch 双轨），变化 → 重算模板 + 被剔除窗格挂
 * `data-autospark-layout-absent`（`display:none!important` 契约）。x-if 的标准移除语义、
 * x-show 的显隐语义**不被接管**（属性原样保留给子树编译），x-pane 只读同一表达式。
 * through / gap / height / width / 窗格组合均编译期静态，变更需 engine.patch 重编
 * （ownsChildren → 宿主区域自动成为 patch 动态区域）。
 *
 * **窗格选项**（决策一，`x-pane-options` 整包 relaxed-json + `.up`/`.down` 修饰符等价）：
 * `{ height, width, through, expandable, resize }`——height 仅 header/footer 认（inline，
 * 显式优先于样式表）、width 仅 sidebar 认、through 仅侧栏且仅 DOM 首个认、expandable/resize
 * 布尔 opt-out（仅 sidebar 有默认注入可关）。未知键 / 无效组合 warn + 忽略该键。
 * 默认尺寸（header/footer 64px、sidebar 240px）经 CSS 变量落在窗格元素样式——不落 inline，
 * 用户 CSS 与窗格选项两条覆盖路都通（决策八）。
 *
 * **行为组合**（决策六，M3 阶段实施）：sidebar 默认注入 x-expandable（compose 程序化组合，
 * ADR-0070 先例）+ x-resize 内缘单方向手柄；显式声明优先于默认注入；注入实例的 options
 * 读同元素 `x-expandable-options`；拖拽跨折叠目标自动翻转折叠布尔。
 * header/footer 显式挂 `x-resize` 合法（auto 轨道跟随）；content 上挂 warn（1fr 轨道拖拽无效）。
 *
 * **嵌套零新机制**：窗格归属最近 x-layout 祖先，窗格内是正常编译子树
 * （嵌套 x-splitter / 子 layout / 任意指令照常）。
 */
export class LayoutDirective extends AutoSparkDirectiveBase {
    static override readonly priority = 0;
    static override readonly singleton = true;

    /** 结构指令：接管子树（收集窗格、剪枝非窗格、自行编译——grid item 不经通用 walk） */
    static override ownsChildren(_info: AutoDirectiveInfo): boolean {
        return true;
    }

    /** 类级初始化：注入全局样式（幂等） */
    static override initialize(_engine: AutoSpark): void {
        registerLayoutStyles();
    }

    // ── 编译期收集态 ──────────────────────────────────────────────────

    /** 窗格声明（词表内、未被剪枝者；与 _present/_paneEls 按索引对齐） */
    private _panes: PaneDecl[] = [];
    /** 各窗格存在性（created 订阅初值 + 回调维护；剔除 = false） */
    private _present: boolean[] = [];
    /** 窗格编译产物（compile 期填充；被 eager x-if 移除后保留死引用无碍——absent 已挂） */
    private _paneEls: (HTMLElement | null)[] = [];
    /** 侧容器（该侧 ≥2 窗格时创建；gridArea = 侧名） */
    private _sideContainers: Partial<Record<"left" | "right", HTMLElement>> = {};
    /** 宿主 gap（x-layout-options.gap；null = 0） */
    private _gap: string | null = null;
    /** 降级标记：content 缺失（grid 照用、content 位 `.` 空洞） */
    private _degraded = false;

    // ── 行为组合态（决策六，compose 注入）──────────────────────────────

    /** sidebar 的 expandable 组合实例（与 _panes 按索引对齐；null = 非侧栏/显式/opt-out） */
    private _composeInsts: (ExpandableDirective | null)[] = [];
    /** 各 sidebar 折叠态镜像（driver.get 判据 + 联动翻转检测） */
    private _collapsedSide: boolean[] = [];
    /** 各 sidebar 折叠前尺寸记忆（px；恢复链 lastSize → 声明宽 → 240 兜底） */
    private _lastSizes: (number | null)[] = [];
    /** resize 事件监听（destroy 移除） */
    private _onResizeMove = (ev: Event): void => this._onPaneResize(ev, false);
    private _onResizeEnd = (ev: Event): void => this._onPaneResize(ev, true);

    // ── 生命周期 ──────────────────────────────────────────────────────

    override created(): void {
        this._gap = this._readGap();
        this._collectPanes();
        this._setupPresence();
    }

    override compile(_context: Record<string, any>, _parent: HTMLElement): void {
        const host = this.el;
        host.classList.add("autospark-layout");
        if (this._panes.length === 0) return; // 全剪枝：空容器（收集期已 warn）
        // 语义序挂载：header → left 侧 → content → right 侧 → footer（grid 按 areas 定位，DOM 序无关）
        this._mountKind("header");
        this._mountSide("left");
        this._mountKind("content");
        this._mountSide("right");
        this._mountKind("footer");
        this._reflow();
        this._setupCompose();
        // resize ↔ 折叠联动监听（resize:* 宿主派发冒泡，ADR-0064 事件契约）
        this.el.addEventListener("resize:move", this._onResizeMove);
        this.el.addEventListener("resize:end", this._onResizeEnd);
    }

    override destroy(): void {
        this.el.removeEventListener("resize:move", this._onResizeMove);
        this.el.removeEventListener("resize:end", this._onResizeEnd);
        for (const inst of this._composeInsts) inst?.destroy();
        this._composeInsts = [];
        this._panes = [];
        this._present = [];
        this._paneEls = [];
        this._sideContainers = {};
    }

    // ── 窗格收集（created 期，模板只读）────────────────────────────────

    /**
     * 扫描宿主模板直接子元素：只认 x-pane 标记的窗格；非窗格渲染子元素 warn + 剪枝；
     * 词表外参数 / 非法修饰符 warn + 剪枝；header/content/footer 重复声明 warn + 后者剪枝。
     * 窗格快照克隆（模板只读契约），x-pane 家族属性在**克隆**上剥除（防窗格子树编译时
     * PaneDirective 空转）；x-if / x-show 属性原样保留（存在性语义归 If/ShowDirective，
     * Q14b 不接管承诺）。
     */
    private _collectPanes(): void {
        const tpl = this.template;
        if (!tpl) return;
        const seen: Partial<Record<PaneKind, true>> = {};
        const sideDecls: Partial<Record<"left" | "right", PaneDecl[]>> = {};
        for (const child of Array.from(tpl.children)) {
            if (child instanceof HTMLTemplateElement || child instanceof HTMLScriptElement)
                continue;
            const el = child as HTMLElement;
            const parsed = this._parsePaneDecl(el);
            if (parsed.type === "prune") continue; // warn 已发
            const decl = parsed.decl;
            if (decl.kind === "sidebar") {
                // 侧栏：through 资格 = DOM 首个（非首个声明 warn + 忽略，Q2/决策三）；
                // 资格在收集期定死（DOM 序），应用期首个 present 者携带已定资格
                const list = (sideDecls[decl.side!] ??= []);
                if ((decl.throughUp || decl.throughDown) && list.length > 0) {
                    this.warn(
                        `x-layout: 同侧第 ${list.length + 1} 个 sidebar 窗格上的 through 声明被忽略（仅 DOM 首个 sidebar 支持 through，ADR-0074 决策三）`,
                    );
                    decl.throughUp = false;
                    decl.throughDown = false;
                }
                list.push(decl);
            } else {
                if (seen[decl.kind]) {
                    this.warn(
                        `x-layout: 重复的 x-pane:${decl.kind} 声明被剪枝（该布局单元仅允许一个）`,
                    );
                    continue;
                }
                seen[decl.kind] = true;
            }
            this._panes.push(decl);
            this._present.push(true);
        }
        // content 必需（缺失 warn + 降级：grid 照建、content 位空洞，ADR-0074 决策三）
        if (!this._panes.some((p) => p.kind === "content")) {
            this._degraded = true;
            this.warn(
                "x-layout: 缺少必需的 x-pane:content 布局单元，已降级渲染（容器照建、中心区空缺）",
            );
        }
        if (this._panes.length === 0) {
            this.warn("x-layout: 未发现任何 x-pane 布局窗格，宿主将渲染为空容器");
        }
        // 侧分组后置处理（决策七 + 决策六的分界）：
        // - 同侧 ≥2 → grouped（窗格转面板语义：宽度声明改走 data-size、跳过默认行为注入——
        //   分隔条即调节通道，expandable 折叠由窗格显式 data-expandable 走 splitter 通道）
        // - 单窗格侧 → 默认注入 x-resize（编译期模板改写，克隆补 `x-resize.<向>` 修饰符属性，
        //   子树编译自然实例化 ResizeDirective——无值 = 纯 DOM 直改宽度，Q18-C 内部态；
        //   显式声明与 opt-out 均不补。内缘单方向：left 拖东缘（e）/ right 拖西缘（w）——
        //   w 依赖 x-resize 的 grid item 感知（父容器 display:grid 时豁免流内降级且免位置补偿）
        for (const list of Object.values(sideDecls)) {
            if (!list?.length) continue;
            if (list.length >= 2) {
                for (const d of list) d.grouped = true;
            } else {
                const d = list[0]!;
                if (!d.resizeExplicit && !d.resizeOptOut) {
                    d.template.setAttribute(`x-resize.${d.side === "right" ? "w" : "e"}`, "");
                    d.resizeInjected = true;
                }
            }
        }
    }

    /**
     * 解析单个子元素的 x-pane 声明。返回 pane（合法窗格，快照已剥 x-pane 家族属性）或
     * prune（非窗格 / 非法声明，warn 已发）。
     */
    private _parsePaneDecl(el: HTMLElement): PaneParseResult {
        // 定位 x-pane 主属性与 options 附属属性（DOM 属性名恒小写，冒号/句点保留）
        let main: { attr: string; modifiers: string[] } | null = null;
        let optionsRaw: string | null = null;
        const strip: string[] = [];
        for (const attr of Array.from(el.attributes)) {
            const name = attr.name;
            if (name === "x-pane" || name.startsWith("x-pane:")) {
                if (main) {
                    this.warn(`x-layout: 重复的 x-pane 主声明（"${name}"）被忽略，取首个`);
                    strip.push(name);
                    continue;
                }
                const rest = name.slice("x-pane".length + 1);
                const [attr, ...modifiers] = rest.split(".");
                main = { attr: attr ?? "", modifiers: modifiers.filter((m) => m.length > 0) };
            } else if (name === "x-pane-options") {
                optionsRaw = attr.value;
                strip.push(name);
            } else if (name.startsWith("x-pane-options.")) {
                // 成员表达式形态不支持（窗格选项编译期静态，决策一）——warn + 剥除防残留
                this.warn(
                    `x-layout: x-pane-options 成员属性形态（${name}）不支持——窗格选项为编译期静态整包声明，该属性已忽略`,
                );
                strip.push(name);
            }
        }
        if (!main) {
            // 非窗格：有 options 附属也无主声明，一并剪枝
            this.warn(
                `x-layout: 非 x-pane 子元素 <${el.localName}> 已被剪枝（布局容器只认 x-pane 布局单元，ADR-0074）`,
            );
            for (const n of strip) el.removeAttribute(n);
            return { type: "prune" };
        }
        const { attr, modifiers } = main;
        const kind = attr.trim() as PaneKind;
        if (!PANE_KINDS.includes(kind)) {
            this.warn(
                `x-layout: x-pane 参数 "${attr}" 不在布局单元词表内（header/content/sidebar/footer），该元素已剪枝`,
            );
            for (const n of strip) el.removeAttribute(n);
            return { type: "prune" };
        }

        const decl: PaneDecl = {
            kind,
            side: null,
            throughUp: false,
            throughDown: false,
            height: null,
            width: null,
            expandableOptOut: false,
            resizeOptOut: false,
            template: el.cloneNode(true) as HTMLElement,
            presenceExpr: null,
            expandableExplicit: false,
            expandableOpts: null,
            resizeExplicit: false,
        };
        // 修饰符分派：sidebar 的 .left/.right（缺省 .left，ADR-0074 决策一）+ .up/.down 简写
        if (kind === "sidebar") {
            const sideDecl = modifiers.find((m) => m === "left" || m === "right");
            decl.side = sideDecl ?? "left";
        }
        decl.throughUp = modifiers.includes("up");
        decl.throughDown = modifiers.includes("down");
        // 克隆上剥除 x-pane 家族（原模板不动；x-if/x-show 留给子树编译）
        for (const name of Array.from(decl.template.attributes).map((a) => a.name)) {
            if (
                name === "x-pane" ||
                name.startsWith("x-pane:") ||
                name === "x-pane-options" ||
                name.startsWith("x-pane-options.")
            ) {
                decl.template.removeAttribute(name);
            }
        }
        // options 整包解析（relaxed-json；修饰符 up/down 已并入布尔，选项里同名字段让位修饰符语义一致）
        if (optionsRaw != null && optionsRaw.trim() !== "") {
            let opts: Record<string, any> | null = null;
            try {
                const v = JSON.parse(relaxedToJson(optionsRaw));
                if (v && typeof v === "object" && !Array.isArray(v)) opts = v;
                else this.warn(`x-layout: x-pane-options 值 "${optionsRaw}" 须为对象，已忽略`);
            } catch {
                this.warn(
                    `x-layout: x-pane-options 值 "${optionsRaw}" 不是合法配置（relaxed-json），已忽略`,
                );
            }
            if (opts) this._applyPaneOptions(decl, opts);
        }
        // through 的 up/down 合法性：仅 sidebar（header/footer 上声明 warn + 忽略，决策三）
        if (kind !== "sidebar" && (decl.throughUp || decl.throughDown)) {
            this.warn(`x-layout: x-pane:${kind} 上的 through（.up/.down）仅 sidebar 支持，已忽略`);
            decl.throughUp = false;
            decl.throughDown = false;
        }
        // 存在性表达式（x-if 优先，共存 warn；属性原样保留——Q14b 不接管）
        const tpl2 = decl.template;
        const ifName = Array.from(tpl2.attributes).find(
            (a) => a.name === "x-if" || a.name.startsWith("x-if."),
        )?.name;
        const showName = Array.from(tpl2.attributes).find(
            (a) => a.name === "x-show" || a.name.startsWith("x-show."),
        )?.name;
        if (ifName) {
            decl.presenceExpr = (tpl2.getAttribute(ifName) ?? "").trim() || null;
            if (showName) {
                this.warn("x-layout: 同一窗格同时声明 x-if 与 x-show——以 x-if 为准，x-show 已忽略");
            }
        } else if (showName) {
            decl.presenceExpr = (tpl2.getAttribute(showName) ?? "").trim() || null;
        }
        // 行为指令显式检测（M3 消费）：显式 = 指令属性在场（含修饰符形态）——**options 附属属性
        // 不算显式**（Q25b：选项与「是否显式写指令属性」解耦；单独的 x-*-options 与默认注入合并）
        const hasAttr = (base: string): boolean =>
            Array.from(tpl2.attributes).some(
                (a) => a.name === base || a.name.startsWith(`${base}.`),
            );
        decl.expandableExplicit = hasAttr("x-expandable");
        decl.resizeExplicit = hasAttr("x-resize");
        // 无显式 expandable 时，x-expandable-options 由 layout 收集备用（Q25b：注入实例读它），
        // 并从克隆剥除（防无主指令的 options 残留歧义）；显式时保留原样（显式路径自洽）
        if (!decl.expandableExplicit) {
            const optAttr = Array.from(tpl2.attributes).find(
                (a) => a.name === "x-expandable-options",
            );
            if (optAttr) {
                decl.expandableOpts = parseJsonObject(
                    optAttr.value,
                    (msg) => this.warn(msg),
                    "x-expandable-options",
                );
                decl.template.removeAttribute("x-expandable-options");
            }
        }
        // content 上挂 x-resize：1fr 轨道钉死尺寸、拖拽必无效 → warn（Q24 修正案）
        if (kind === "content" && decl.resizeExplicit) {
            this.warn(
                "x-layout: content 窗格上的 x-resize 无效（content 轨道为 1fr，元素尺寸不可拖拽调节），该指令已忽略",
            );
            decl.resizeExplicit = false;
        }
        // 联动阈值（拖拽跨折叠目标 → 翻转折叠布尔，Q26）：minSize 声明值（px）；无 minSize = 0；
        // 非法值 warn + 从 opts 剔除（联动回落 0，expandable 也不收非法 minSize）
        decl.expandableMin =
            decl.expandableOpts?.minSize != null
                ? parsePxNumber(decl.expandableOpts.minSize)
                : null;
        if (decl.expandableOpts?.minSize != null && decl.expandableMin == null) {
            this.warn(
                `x-layout: x-expandable-options.minSize 值 "${decl.expandableOpts.minSize}" 非数字/px（拖拽折叠联动阈值仅支持 px），已忽略`,
            );
            delete decl.expandableOpts.minSize;
        }
        // resize 默认注入在 _collectPanes 分组判定后进行（分割窗格不注入——分隔条即调节通道）
        return { type: "pane", decl };
    }

    /** 窗格选项应用（词汇表 {height,width,through,expandable,resize}；无效组合 warn 忽略该键） */
    private _applyPaneOptions(decl: PaneDecl, opts: Record<string, any>): void {
        for (const [key, value] of Object.entries(opts)) {
            switch (key) {
                case "height":
                    if (decl.kind === "header" || decl.kind === "footer") {
                        decl.height = formatLength(value);
                        if (decl.height == null) {
                            this.warn(
                                `x-layout: x-pane-options.height 值 "${value}" 无法解析为 CSS 长度，已忽略`,
                            );
                        }
                    } else {
                        this.warn(
                            `x-layout: x-pane-options.height 仅 header/footer 窗格认读，已忽略`,
                        );
                    }
                    break;
                case "width":
                    if (decl.kind === "sidebar") {
                        decl.width = formatLength(value);
                        if (decl.width == null) {
                            this.warn(
                                `x-layout: x-pane-options.width 值 "${value}" 无法解析为 CSS 长度，已忽略`,
                            );
                        }
                    } else {
                        this.warn(`x-layout: x-pane-options.width 仅 sidebar 窗格认读，已忽略`);
                    }
                    break;
                case "through": {
                    if (decl.kind !== "sidebar") {
                        this.warn(`x-layout: x-pane-options.through 仅 sidebar 支持，已忽略`);
                        break;
                    }
                    const parts = String(value ?? "")
                        .split(/[,\s]+/)
                        .filter((s) => s !== "");
                    for (const p of parts) {
                        if (p === "up") decl.throughUp = true;
                        else if (p === "down") decl.throughDown = true;
                        else this.warn(`x-layout: through 值 "${p}" 非法（仅 up / down），已忽略`);
                    }
                    break;
                }
                case "expandable":
                    if (decl.kind !== "sidebar") {
                        this.warn(
                            `x-layout: x-pane-options.expandable 仅 sidebar 有默认注入可关，已忽略`,
                        );
                        break;
                    }
                    if (value === false) decl.expandableOptOut = true;
                    else if (value !== true) {
                        this.warn(
                            `x-layout: x-pane-options.expandable 仅支持布尔（状态绑定请显式写 x-expandable="路径"），已忽略`,
                        );
                    }
                    break;
                case "resize":
                    if (decl.kind !== "sidebar") {
                        this.warn(
                            `x-layout: x-pane-options.resize 仅 sidebar 有默认注入可关，已忽略`,
                        );
                        break;
                    }
                    if (value === false) decl.resizeOptOut = true;
                    else if (value !== true) {
                        this.warn(`x-layout: x-pane-options.resize 仅支持布尔，已忽略`);
                    }
                    break;
                default:
                    this.warn(
                        `x-layout: x-pane-options 的未知键 "${key}" 已忽略（词汇表：height/width/through/expandable/resize）`,
                    );
            }
        }
    }

    // ── 存在性订阅与回流（决策四）─────────────────────────────────────

    /** created 期订阅各窗格存在性表达式（scope.watch 双轨；返回值即初值） */
    private _setupPresence(): void {
        this._panes.forEach((decl, i) => {
            if (!decl.presenceExpr) return;
            const initial = this.binding.watch(decl.presenceExpr, ({ value }) => {
                this._present[i] = !!value;
                this._reflow();
            });
            this._present[i] = !!initial;
        });
    }

    /** 回流：重算 grid 模板 + absent 标记（窗格元素永不 reparent） */
    private _reflow(): void {
        if (this._panes.length === 0) return;
        this._applyGrid();
        this._paneEls.forEach((el, i) => {
            if (!el) return;
            if (this._present[i]) el.removeAttribute("data-autospark-layout-absent");
            else el.setAttribute("data-autospark-layout-absent", "");
        });
        // 侧容器：该侧全部窗格被剔除 → 容器一并 absent（防 grid-area 指向已消失的区域）
        for (const side of ["left", "right"] as const) {
            const container = this._sideContainers[side];
            if (!container) continue;
            const anyPresent = this._panes.some(
                (p, i) => p.kind === "sidebar" && p.side === side && this._present[i],
            );
            if (anyPresent) container.removeAttribute("data-autospark-layout-absent");
            else container.setAttribute("data-autospark-layout-absent", "");
        }
    }

    // ── grid 模板（纯函数 buildLayoutGrid 的应用点）───────────────────

    /** 由窗格现态派生 grid 模型 → 应用 rows/cols/areas/gap */
    private _applyGrid(): void {
        const firstSide = (side: "left" | "right"): PaneDecl | undefined =>
            this._panes.find((p, i) => p.kind === "sidebar" && p.side === side && this._present[i]);
        const left = firstSide("left");
        const right = firstSide("right");
        const model: LayoutGridModel = {
            header: this._panes.some((p, i) => p.kind === "header" && this._present[i]),
            footer: this._panes.some((p, i) => p.kind === "footer" && this._present[i]),
            content: this._panes.some((p, i) => p.kind === "content" && this._present[i]),
            left: this._panes.filter(
                (p, i) => p.kind === "sidebar" && p.side === "left" && this._present[i],
            ).length,
            right: this._panes.filter(
                (p, i) => p.kind === "sidebar" && p.side === "right" && this._present[i],
            ).length,
            ltUp: left?.throughUp ?? false,
            ltDown: left?.throughDown ?? false,
            rtUp: right?.throughUp ?? false,
            rtDown: right?.throughDown ?? false,
        };
        const t = buildLayoutGrid(model);
        const s = this.el.style;
        s.gridTemplateAreas = t.areas;
        s.gridTemplateRows = t.rows;
        s.gridTemplateColumns = t.cols;
        if (this._gap) s.gap = this._gap;
    }

    /** 编译挂载某 kind 的窗格（gridArea = kind；degraded 的 content 缺席） */
    private _mountKind(kind: PaneKind): void {
        this._panes.forEach((decl, i) => {
            if (decl.kind !== kind) return;
            const el = this._compilePane(decl, i);
            if (!el) return;
            el.style.gridArea = kind;
        });
    }

    /**
     * 编译挂载某侧的 sidebar 窗格：单个直挂 gridArea=side；≥2 个经 {@link buildSideSplitter}
     * 构建分割容器（x-splitter 属性 + 嵌套链）整体 temp 编译——splitter 在容器上自然实例化
     * （其 created 扫容器克隆子级收集面板快照，data-size 面板契约照常，决策七）。
     */
    private _mountSide(side: "left" | "right"): void {
        const indices = this._panes
            .map((p, i) => ({ p, i }))
            .filter(({ p }) => p.kind === "sidebar" && p.side === side);
        if (indices.length === 0) return;
        if (indices.length === 1) {
            const { p, i } = indices[0]!;
            const el = this._compilePane(p, i);
            if (el) el.style.gridArea = side;
            return;
        }
        const container = buildSideSplitter(indices.map(({ p }) => p));
        const temp = document.createElement("div");
        temp.appendChild(container);
        const nodes = this.engine.compiler.compileSubtree(this.el, temp, this.binding);
        const el = nodes.find((n) => n instanceof HTMLElement) as HTMLElement | undefined;
        if (!el) return;
        el.style.gridArea = side;
        this._sideContainers[side] = el;
        // 窗格 el 反查（absent 联动与 resize 事件反查用）：编译产物内按文档序对齐窗格声明
        const paneEls = [...el.querySelectorAll("[data-autospark-layout-pane]")];
        indices.forEach(({ i }, k) => {
            const pel = paneEls[k];
            if (pel instanceof HTMLElement) {
                if (!this._present[i]) pel.setAttribute("data-autospark-layout-absent", "");
                this._paneEls[i] = pel;
            }
        });
    }

    /** 编译单窗格子树（temp wrapper 技巧，splitter 先例）+ 契约属性与选项尺寸（分割窗格 width 走 data-size，不打 inline） */
    private _compilePane(decl: PaneDecl, index: number): HTMLElement | null {
        const temp = document.createElement("div");
        temp.appendChild(decl.template);
        const nodes = this.engine.compiler.compileSubtree(this.el, temp, this.binding);
        const el = nodes.find((n) => n instanceof HTMLElement) as HTMLElement | undefined;
        if (!el) return null;
        el.setAttribute("data-autospark-layout-pane", decl.kind);
        if (decl.height) el.style.height = decl.height;
        if (decl.width && !decl.grouped) el.style.width = decl.width;
        if (!this._present[index]) el.setAttribute("data-autospark-layout-absent", "");
        this._paneEls[index] = el;
        return el;
    }

    // ── 行为组合（决策六）─────────────────────────────────────────────

    /**
     * sidebar 默认注入 x-expandable（`ExpandableDirective.compose`，ADR-0070 splitter 同款）：
     * 折叠布尔真相由本指令持有（driver），把手/动画/事件全走 expandable 原生管线。
     * direction 由 sidebar 侧推导（用户声明接管 warn，对齐 splitter）；把手默认常驻
     * `showTrigger:'always'`（折叠态唯一重开触点）。显式声明 / opt-out 不注入。
     */
    private _setupCompose(): void {
        this._panes.forEach((decl, i) => {
            if (
                decl.kind !== "sidebar" ||
                decl.grouped ||
                decl.expandableExplicit ||
                decl.expandableOptOut
            )
                return;
            const el = this._paneEls[i];
            if (!el) return;
            const opts: Record<string, any> = { ...decl.expandableOpts };
            const dir = decl.side === "right" ? "right" : "left";
            if (opts.direction != null && opts.direction !== dir) {
                this.warn(
                    `x-layout: x-expandable-options.direction 由布局接管（按 sidebar 侧推导为 "${dir}"），声明被忽略`,
                );
            }
            opts.direction = dir;
            if (opts.showTrigger === undefined) opts.showTrigger = "always";
            this._collapsedSide[i] = false;
            this._lastSizes[i] = null;
            const inst = ExpandableDirective.compose(this.engine, this.binding, el, opts, {
                get: () => !this._collapsedSide[i],
                set: (v) => this._onDriverSet(i, v),
            });
            inst.created();
            inst.compile(undefined as any, el);
            this._composeInsts[i] = inst;
        });
    }

    /** 组合 driver 落点（把手点击翻转）：折叠记忆 lastSize、展开走恢复链（lastSize → 声明宽 → 240 兜底） */
    private _onDriverSet(i: number, expanded: boolean): void {
        const inst = this._composeInsts[i];
        if (!inst) return;
        if (expanded) {
            this._collapsedSide[i] = false;
            const declared = parsePxNumber(this._panes[i]!.width ?? "");
            const restore = this._lastSizes[i] ?? declared ?? 240;
            inst.composeSetMaxSize({ value: restore, unit: "px" });
            inst.composeSet(true);
        } else {
            this._collapsedSide[i] = true;
            inst.composeSet(false);
        }
    }

    /**
     * resize ↔ 折叠联动（Q26）：`resize:move` 持续记忆非折叠宽度（lastSize）；
     * `resize:end` 终值 ≤ 阈值（minSize，缺省 0）→ 翻转折叠布尔（终态由组合实例承接）。
     * 事件由 x-resize 派发冒泡（ADR-0064 契约），宿主级单一监听按 target 反查窗格。
     */
    private _onPaneResize(ev: Event, isEnd: boolean): void {
        const width = (ev as CustomEvent).detail?.width;
        if (!Number.isFinite(width)) return;
        const pane = (ev.target as HTMLElement | null)?.closest?.("[data-autospark-layout-pane]");
        if (!(pane instanceof HTMLElement)) return;
        const i = this._paneEls.indexOf(pane);
        const inst = i >= 0 ? this._composeInsts[i] : null;
        if (!inst) return;
        const threshold = this._panes[i]!.expandableMin ?? 0;
        if (!this._collapsedSide[i] && width > threshold) {
            this._lastSizes[i] = width;
        }
        if (isEnd && !this._collapsedSide[i] && width <= threshold) {
            this._collapsedSide[i] = true;
            inst.composeSet(false);
        }
    }

    // ── 宿主选项 ──────────────────────────────────────────────────────

    /** gap 解析（x-layout-options.gap）：number → px；string 原样作 CSS gap 值（决策二/七） */
    private _readGap(): string | null {
        const g = this.options?.gap;
        if (g == null) return null;
        if (typeof g === "number") {
            if (!Number.isFinite(g)) {
                this.warn(`x-layout: gap 值 ${g} 非有限数，已忽略`);
                return null;
            }
            return `${g}px`;
        }
        if (typeof g === "string" && g.trim() !== "") return g.trim();
        this.warn(`x-layout: gap 值 "${g}" 无法解析（须为 number 或 CSS gap 字符串），已忽略`);
        return null;
    }
}

// ── 类型与纯函数 ──────────────────────────────────────────────────────

/** 布局单元词表 */
export type PaneKind = "header" | "content" | "sidebar" | "footer";
const PANE_KINDS: PaneKind[] = ["header", "content", "sidebar", "footer"];

/** 窗格声明（编译期收集的冻结快照 + 派生配置） */
interface PaneDecl {
    kind: PaneKind;
    /** 仅 sidebar 有（缺省 .left） */
    side: "left" | "right" | null;
    throughUp: boolean;
    throughDown: boolean;
    /** x-pane-options.height/width（格式化后的 CSS 长度串；null = 未声明） */
    height: string | null;
    width: string | null;
    /** x-pane-options 布尔 opt-out（仅 sidebar 消费，M3） */
    expandableOptOut: boolean;
    resizeOptOut: boolean;
    /** 折叠联动阈值 px（x-expandable-options.minSize；null = 0——拖到 0 折叠；非法值已 warn 剔除回落 0） */
    expandableMin: number | null;
    /** resize 默认注入已补属性（诊断/测试用） */
    resizeInjected?: boolean;
    /** 同侧 ≥2 已分组为分割窗格（面板语义：data-size 声明、跳过默认行为注入） */
    grouped?: boolean;
    /** 冻结快照（cloneNode(true)，x-pane 家族属性已剥除；x-if/x-show 原样保留） */
    template: HTMLElement;
    /** 存在性表达式（x-if 优先；null = 恒存在） */
    presenceExpr: string | null;
    /** 显式行为指令检测（M3 消费） */
    expandableExplicit: boolean;
    expandableOpts: Record<string, any> | null;
    resizeExplicit: boolean;
}

type PaneParseResult = { type: "pane"; decl: PaneDecl } | { type: "prune" };

/**
 * 同侧多窗格的分割容器构建（纯函数，ADR-0074 决策七：程序化组合 x-splitter）。
 *
 * 每层容器挂 `x-splitter="'horizontal'"`，层内**首窗格声明 data-size**（宽度选项值或默认
 * 240px）为定容面板、其余为自适应面板——拖分隔条守恒分配；3+ 窗格递归嵌套链（余下窗格
 * 包进内层容器作为外层的自适应面板，每层各持一对「定容/自适应」）。分割窗格不再吃
 * layout 的 gap（间距由分隔条承载）与默认行为注入（调节走分隔条、折叠走窗格显式
 * `data-expandable` 的 splitter 通道，ADR-0070）。
 */
function buildSideSplitter(panes: PaneDecl[]): HTMLElement {
    const container = document.createElement("div");
    container.setAttribute("x-splitter", "'horizontal'");
    container.setAttribute("data-autospark-layout-side", "");
    const first = panes[0]!;
    first.template.setAttribute("data-size", first.width ?? "240px");
    container.appendChild(first.template);
    if (panes.length > 2) {
        container.appendChild(buildSideSplitter(panes.slice(1)));
    } else {
        container.appendChild(panes[1]!.template);
    }
    return container;
}

/** grid 模型（由窗格存在性 × through 派生；buildLayoutGrid 输入） */
export interface LayoutGridModel {
    header: boolean;
    footer: boolean;
    /** content 缺失（降级 `.` 空洞） */
    content: boolean;
    /** 该侧现存窗格数（0 = 列不存在） */
    left: number;
    right: number;
    /** 首个现存侧窗格的 through（资格随「首位」动态走） */
    ltUp: boolean;
    ltDown: boolean;
    rtUp: boolean;
    rtDown: boolean;
}

/** grid 模板产物（inline style 三件套的值） */
export interface LayoutGridTemplate {
    areas: string;
    rows: string;
    cols: string;
}

/**
 * grid 模板生成器（纯函数，ADR-0074 决策二；编译期与回流共用同一真相）。
 *
 * 列 = [left?] content(1fr) [right?]；行 = [header?] middle(1fr) [footer?]。
 * header/footer 行内：侧列被 through 占据（`left`/`right`），否则并入 header/footer
 * （非 through 侧窗格起于其下方——header 全宽是缺省态）；content 缺失降级为 `.` 空洞。
 * through=up 且无 header 行（无 header 窗格）时侧列自然全高，语义自洽无需特判。
 */
export function buildLayoutGrid(m: LayoutGridModel): LayoutGridTemplate {
    const names: string[] = [];
    const widths: string[] = [];
    if (m.left > 0) {
        names.push("left");
        widths.push("auto");
    }
    names.push("content");
    widths.push("1fr");
    if (m.right > 0) {
        names.push("right");
        widths.push("auto");
    }

    const cell = (col: string, row: "header" | "middle" | "footer"): string => {
        if (row === "middle") return col === "content" ? (m.content ? "content" : ".") : col;
        if (row === "header") {
            if (col === "left") return m.ltUp ? "left" : "header";
            if (col === "right") return m.rtUp ? "right" : "header";
            return m.header ? "header" : ".";
        }
        if (col === "left") return m.ltDown ? "left" : "footer";
        if (col === "right") return m.rtDown ? "right" : "footer";
        return m.footer ? "footer" : ".";
    };

    const heights: string[] = [];
    const matrix: string[][] = [];
    if (m.header) {
        matrix.push(names.map((n) => cell(n, "header")));
        heights.push("auto");
    }
    matrix.push(names.map((n) => cell(n, "middle")));
    heights.push("1fr");
    if (m.footer) {
        matrix.push(names.map((n) => cell(n, "footer")));
        heights.push("auto");
    }

    return {
        areas: matrix.map((r) => `"${r.join(" ")}"`).join(" "),
        rows: heights.join(" "),
        cols: widths.join(" "),
    };
}

// ── 工具 ──────────────────────────────────────────────────────────────

/** 选项长度值格式化：number → px；非空字符串原样（CSS 长度串）；非法 null */
function formatLength(v: any): string | null {
    if (typeof v === "number") return Number.isFinite(v) ? `${v}px` : null;
    if (typeof v === "string" && v.trim() !== "") return v.trim();
    return null;
}

/** px 数值解析（联动阈值用）：number 直接取；"120"/"120px" 串解析；其余 null */
function parsePxNumber(v: any): number | null {
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    if (typeof v === "string") {
        const m = /^(\d+(?:\.\d+)?)px$/i.exec(v.trim());
        return m ? parseFloat(m[1]!) : null;
    }
    return null;
}

/** options JSON 解析（relaxed-json；非对象 / 解析失败 warn 后返回 null） */
function parseJsonObject(
    raw: string,
    warn: (msg: string) => void,
    label: string,
): Record<string, any> | null {
    const s = raw.trim();
    if (s === "") return {};
    try {
        const v = JSON.parse(relaxedToJson(s));
        if (v && typeof v === "object" && !Array.isArray(v)) return v;
        warn(`${label} 值 "${raw}" 须为对象，已忽略`);
        return null;
    } catch {
        warn(`${label} 值 "${raw}" 不是合法配置（relaxed-json），已忽略`);
        return null;
    }
}

// ── 全局样式（类级 initialize 注入，幂等；ADR-0074 决策八）────────────

const LAYOUT_STYLE_ID = "autospark-layout-styles";
const LAYOUT_CSS = `
.autospark-layout{display:grid;position:relative;}
.autospark-layout>[data-autospark-layout-pane]{position:relative;min-width:0;min-height:0;}
/* 默认尺寸经 CSS 变量落在窗格元素——不落 inline（用户 CSS 可覆盖）；窗格选项走 inline（显式优先） */
.autospark-layout>[data-autospark-layout-pane="header"]{height:var(--autospark-layout-header-height,64px);}
.autospark-layout>[data-autospark-layout-pane="footer"]{height:var(--autospark-layout-footer-height,64px);}
.autospark-layout>[data-autospark-layout-pane="sidebar"]{width:var(--autospark-layout-sidebar-width,240px);}
/* 存在性剔除契约：压过 x-show 的 inline display（同一次 flush 内最终一致） */
.autospark-layout [data-autospark-layout-absent]{display:none!important;}
`;

/** 注入 layout 全局样式（幂等；多 engine 共享、destroy 不移除——全局样式惯例） */
export function registerLayoutStyles(): void {
    if (document.getElementById(LAYOUT_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = LAYOUT_STYLE_ID;
    style.textContent = LAYOUT_CSS;
    document.head.appendChild(style);
}
