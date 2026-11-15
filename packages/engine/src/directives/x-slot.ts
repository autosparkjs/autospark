import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { AutoSparkScope } from "../engine/scope";
import { isBlankSlotCarrier, type SlotContent, type SuperInlet } from "../utils/slot";
import { SpreadBinder } from "./x-bind-spread";

/**
 * x-slot：插槽出口（ADR-0056）。
 *
 * 出现在**组件模板**内，声明内容投影的出口位置：
 * - `x-slot:header` / 裸 `x-slot`（= 默认出口 `"default"`）——属性参数承载出口名；
 * - 标记元素保留为真实包裹层（不剥标签）——出口位置即 DOM 位置；
 * - 出口子树 = **fallback**（无对应内容时在组件作用域编译）；
 * - 有对应内容时由内容侧投影填充，内容在**调用方作用域链**求值（不受 ADR-0053 封闭边界约束）；
 * - 作用域形参（出口值=对象字面量、内容值=解构简式）经共享 `locals` 容器注入 + `refresh` 刷新。
 *
 * 内容 map 沿 parent 链**就近**查找（嵌套组件各持独立 map）。持有者由 component/overlay
 * 的 `_instantiate` 懒收集后 stash。例外——插槽转发（ADR-0125）：持有者带
 * `x-component-options.slots` 声明时，名字按声明翻译（显式映射或 `*` 原名）继续上溯，
 * 每级持有者各自翻译逐级接力；并存降级（决策六）——持有者对本名声明转发时其直供段
 * 降级为回退候选（走完链无终局命中时最外层候选兜底），未声明名直供段恒优先。
 *
 * `ownsChildren`：出口子树不进通用 walk——由本指令在 compile 中选择「投影内容」或
 * 「fallback 编译」二选一，避免双重编译。
 *
 * 动态出口名（ADR-0107）：裸 `x-slot="表达式"` 值承名——求值为字符串即出口名；求值为
 * `{ name, params }` 对象则 name 为出口名、params 即形参取值表达式（单一值通道双形态
 * 分流）。名在 created 编译期求值一次静态绑定（不响应式，名变化靠 x-for 重建）；
 * params 走既有 watch 通道保持响应式。无效名 warn + fallback；动态出口不可消费 live
 * 活体段（warn + fallback，活体段仅静态出口可直挂）。
 *
 * 传递绑定（ADR-0108）：内容段携带 `bindingsExpr`（内容侧 `x-slot.bind` 载体）时，
 * 在**调用方作用域** watch 并以 x-bind 展开语义应用到出口元素（调用方赢：出口静态
 * 属性不做 reservedKeys 恒赢）。`.bind` 修饰符写在出口侧无意义 → warn 引导；
 * 裸 `x-slot.bind` 的值仍按动态出口名消费（ADR-0107 向后兼容）。
 *
 * template 出口载体（ADR-0137）：`<template x-slot:名>` 是出口标记的第二载体——
 * template 不进运行 DOM（无包裹层，产物经 fragment 原位展开、`data-slot` 锚点由首个
 * 元素根承接），按空/非空分流：有实质内容（纯空白/注释不算）= fallback 出口；空 =
 * 可选出口（未填充整出口不渲染）。载体上的属性（除 `x-slot` 标记与宿主配置家族）
 * 是**出口注入**集——在内容编译前写入每个元素根（`:class`/`@click`/`x-show` 原文
 * 随内容编译作为活指令生效），冲突调用方赢、class/style token 级合并；fallback 根
 * 同样注入；live 活体段豁免（跳过 + warn）。元素出口不受影响（包裹层 + fallback +
 * 不注入三不变）。
 */
export class SlotDirective extends AutoSparkDirectiveBase {
    /**
     * 介于结构指令（isolate=90/if=80/for=100）之下、component(70)/bind(50) 之间：
     * 出口填充在兄弟普通指令前完成，与 component 实例化错层（不同元素）。
     */
    static override readonly priority = 65;
    static override readonly singleton = true;
    /** 出口子树 = fallback 或投影内容，均不进通用 walk（ADR-0056 决策八） */
    static override ownsChildren(): boolean {
        return true;
    }

    /** 命中的内容段（null = 无内容，走 fallback） */
    private content: SlotContent | null = null;
    /** 内容的调用方基准 scope（内容 scope 的 parent） */
    private callerScope: AutoSparkScope | null = null;
    /** 形参容器（与内容 scope.locals 共享引用；出口侧 watch 后原地刷新） */
    private paramData: Record<string, any> | null = null;
    /** 已编译的内容 scopes（destroy 回收；幂等） */
    private contentScopes: AutoSparkScope[] = [];
    /** 动态名出口的编译期解析结果（ADR-0107）：null = 静态名模式或无效名 */
    private dynamicResolved: { name: string } | null = null;
    /** 动态名求值结果非法（ADR-0107 决策八）：恒按无内容处理（fallback），不写 data-slot */
    private dynamicInvalid = false;
    /** 出口名（名段重组后，ADR-0124）：compile 期写 data-slot 用 */
    private resolvedAttrName = "default";
    /**
     * 出口注入集（ADR-0137）：template 载体上的属性原文（静态 + 指令属性，`x-slot`
     * 标记与宿主配置家族已排除），created 期经 `consumeOutletInjectAttrs` 一次性抄录。
     * 元素载体恒 null——元素自身属性是自身样式，与注入意图不可区分，不注入。
     */
    private injectAttrs: Array<[string, string]> | null = null;
    /**
     * template 载体编译产物（ADR-0137）：投影 / fallback / live 段的最终节点列表 +
     * 锚点（首个元素根，承接 `data-slot`）。compile 期构建，编译器 ownsChildren
     * 返回点经 {@link takeOutletFragment} 组 fragment 原位展开挂入新父——template
     * 自身不进运行 DOM（无包裹层）。元素载体恒 null（走既有 el 内挂载路径）。
     */
    private outlet: { nodes: Node[]; anchor: HTMLElement | null } | null = null;

    override created(): void {
        // 名段重组（ADR-0124 点分出口名）：解析期按 "." 切修饰符，attr 只含首段——冒号形态
        // 下除 bind（绑定载体语义，ADR-0108，出口侧仅 warn）外的修饰符以 "." 并回出口名
        //（x-slot:actions.left → 出口名 "actions.left"）；无冒号形态修饰符无出口名语义（维持
        // 动态名/裸 default 语义不变）
        const attr = (this.attr ?? "").trim();
        const mods = attr !== "" ? (this.modifiers ?? []).filter((m) => m !== "bind") : [];
        const attrName = [attr, ...mods].filter((s) => s !== "").join(".");
        this.resolvedAttrName = attrName || "default";
        let name = attrName || "default";
        /** 动态名模式：形参取值表达式 = 整个指令值，形参取 value.params（ADR-0107） */
        let dynamic = false;
        const rawValue = this.value == null ? "" : String(this.value).trim();
        // ADR-0108：`.bind` 是调用方（使用处）内容侧的传递绑定语法，出口侧不承载透传语义
        if (this.modifiers?.includes("bind")) {
            if (attrName === "") {
                this.warn(
                    `x-slot.bind 是调用方（使用处）的传递绑定语法，出口侧不支持——请改用 x-bind（值非空时仍按动态出口名处理以兼容 ADR-0107，ADR-0108）`,
                );
            } else {
                this.warn(
                    `x-slot:${attrName}.bind 是调用方（使用处）的传递绑定语法，出口侧请改用 x-bind（修饰符已忽略，ADR-0108）`,
                );
            }
        }
        if (attrName === "" && rawValue !== "") {
            // 动态出口名（ADR-0107 决策二/三）：值承名，编译期求值一次静态绑定
            dynamic = true;
            const resolved = this.binding.read(rawValue);
            const r = resolved as Record<string, any> | null | undefined;
            if (typeof resolved === "string" && resolved.trim() !== "") {
                name = resolved.trim();
                this.dynamicResolved = { name };
            } else if (
                resolved != null &&
                typeof resolved === "object" &&
                !Array.isArray(resolved) &&
                typeof r?.name === "string" &&
                r.name.trim() !== ""
            ) {
                name = r.name.trim();
                this.dynamicResolved = { name };
            } else {
                this.dynamicInvalid = true;
                this.warn(
                    `x-slot: 动态出口名无效（"${rawValue}" 求值结果须为非空字符串或 { name, params } 对象），出口按无内容处理（渲染 fallback）（ADR-0107）`,
                );
            }
        }
        // 沿 parent 链就近找持有 slotContents 的 scope（嵌套组件隔离）；插槽转发（ADR-0125）：
        // 名字按持有者声明（slotForwarding：显式映射优先、`*` 通配原名）翻译后逐级接力上溯；
        // 并存降级（决策六）——声明转发的持有者其直供段降级为回退候选继续上溯，未声明名
        // 直供段终局即胜；未声明名字保持「首持有者即停」防穿透不变式（声明落点持有者即使
        // 无内容也构成边界）
        if (!this.dynamicInvalid) {
            let holder: AutoSparkScope | null = this.binding.parent;
            let lookup = name;
            /** 并存降级回退候选（ADR-0125 决策六）：声明转发的持有者集内直供段让位外层，
             * 走完链无终局命中时由**最后一个候选（最外层）**兜底——多级并存最外层赢 */
            let candidate: SlotContent | null = null;
            let candidateScope: AutoSparkScope | null = null;
            while (holder) {
                if (holder.slotContents || holder.slotForwarding) {
                    const hit = holder.slotContents?.get(lookup) ?? null;
                    const fw = holder.slotForwarding;
                    // 本级是否声明转发本名（显式映射或 `*` 通配）
                    const forwardedHere = fw ? fw.map.has(lookup) || fw.wildcard : false;
                    if (hit) {
                        if (dynamic && hit.mode === "live") {
                            // 动态出口不可消费活体段（ADR-0107 决策七）：live 段不可克隆/再编译，
                            // 多出口消费即 DOM reparent 静默丢失——warn + fallback
                            this.warn(
                                `x-slot: 动态出口 "${name}" 不可消费活体内容段（live 段仅静态出口可直挂），已按无内容处理（渲染 fallback）（ADR-0107）`,
                            );
                            break;
                        }
                        if (!forwardedHere) {
                            // 终局命中：本级未声明转发本名——直供段恒优先（现状不变式）
                            this.content = hit;
                            this.callerScope = holder.slotCallerScope ?? holder;
                            break;
                        }
                        // 并存降级：本级声明转发本名 → 直供段降级为回退候选，继续上溯
                        candidate = hit;
                        candidateScope = holder.slotCallerScope ?? holder;
                    }
                    const translated = fw
                        ? (fw.map.get(lookup) ?? (fw.wildcard ? lookup : null))
                        : null;
                    if (translated === null) {
                        break; // 持有者已定：无本名段且不转发 → 边界（候选兜底或 fallback，防穿透）
                    }
                    lookup = translated; // 转发接力：译名在上一级持有者继续查找
                }
                holder = holder.parent;
            }
            // 链走尽无终局命中：并存降级的候选按「最外层赢」兜底（无候选 → 出口 fallback）
            if (!this.content && candidate) {
                this.content = candidate;
                this.callerScope = candidateScope;
            }
        }

        // 作用域插槽：内容声明了形参 → 建共享容器 + 在**组件作用域** watch 出口值（假设③）。
        // 静态出口值即形参取值表达式；动态出口 watch 整个值表达式、形参取 value.params
        //（ADR-0107 决策三：name 编译期静态绑定不响应式，params 保持响应式）
        if (this.content && this.content.params.length > 0) {
            this.paramData = {};
            for (const k of this.content.params) this.paramData[k] = undefined;
            if (rawValue !== "") {
                const extract = (v: any): any =>
                    dynamic && v != null && typeof v === "object" && !Array.isArray(v)
                        ? (v as Record<string, any>).params
                        : v;
                const initial = this.binding.watch(rawValue, ({ value }) =>
                    this._applyParams(extract(value)),
                );
                this._applyParams(extract(initial));
            }
        }

        // 出口注入集抄录（ADR-0137 决策二）：template 载体的注入集已在编译期剥除并
        // stash（`compiler._stripOutletInjectAttrs`——指令属性若不剥会在 `display:none`
        // 载体上按通用管线实例化空转），此处一次性取走（生命周期均在 compileElement
        // 的 try 块内执行，时序安全）。
        if (this.template instanceof HTMLTemplateElement) {
            this.injectAttrs = this.engine.compiler.consumeOutletInjectAttrs(this.template) ?? [];
        }
    }

    override compile(): void {
        const tpl = this.template;
        // template 出口载体（ADR-0137）：独立分流——无包裹层（产物经 fragment 原位展开，
        // template 不进运行 DOM）+ 出口注入 + 空=可选出口；元素出口走既有路径零改动。
        if (tpl instanceof HTMLTemplateElement) {
            this._compileTemplateOutlet(tpl);
            return;
        }
        // 出口运行态标记：`x-slot` 属性随编译剥除，出口元素留 `data-slot`（=出口名）作
        // 稳定寻址锚——运行期 DOM 注入通道（如 x-foldable 折叠面板中继）据此定位出口。
        // 动态出口写求值结果名；无效名不写（ADR-0107 决策八）
        if (!this.dynamicInvalid) {
            this.el.dataset.slot = this.dynamicResolved?.name ?? this.resolvedAttrName;
        }
        if (this.content && this.callerScope) {
            // 传递绑定（ADR-0108）：内容侧 x-slot.bind 载体 → 调用方作用域 watch → 出口元素展开
            this._applyCallerBindings();
            // 活体段（ADR-0062 shell 机制）：引擎已编译的组件实例直挂出口——不克隆、不再编译、
            // 不建内容 scope（DOM 挂载不动 scope 上的 watcher/监听；销毁权责归构造方
            // OverlayInstance 对内容/shell 双 scope 的统一回收）
            if (this.content.mode === "live") {
                for (const n of this.content.nodes) this.el.appendChild(n);
                return;
            }
            // 投影：内容在调用方基准下编译、挂到出口元素（原出口子节点不进 DOM）。
            // super 句柄（ADR-0084）随内容 scope 注入——内容子树内 x-super 惰性取本段
            // fallback 的独立编译产物（多次出现各自展开；出口无 fallback 静默空）
            const inlet = this._makeSuperInlet();
            this.contentScopes = this.engine.compiler.compileSlotNodes(
                this.content.nodes,
                this.callerScope,
                this.paramData,
                this.el,
                (s) => {
                    s.superInlet = inlet;
                },
            );
            return;
        }
        // fallback：出口子树在组件作用域编译（出口 scope 链上即组件 data）
        const tplEl = this.template;
        if (!tplEl) return;
        this.engine.compiler.compileSubtree(this.el, tplEl, this.binding);
    }

    /**
     * 取走 template 载体编译产物（编译器 ownsChildren 返回点专用，ADR-0137）：
     * 产物组 DocumentFragment，transformElement 经 `appendChild(fragment)` 原位展开
     * 挂入新父——template 自身不进运行 DOM。空产物（可选出口未填充）= 空 fragment =
     * 出口静默消失。读后即清（幂等）；非 template 载体恒 null（走既有 el 内挂载）。
     */
    takeOutletFragment(): DocumentFragment | null {
        if (!this.outlet) return null;
        const frag = document.createDocumentFragment();
        for (const n of this.outlet.nodes) frag.appendChild(n);
        this.outlet = null;
        return frag;
    }

    /**
     * template 出口载体的编译分流（ADR-0137 决策一/二）。
     *
     * 与元素出口的三点差异：
     * - **无包裹层**：template 不进运行 DOM——产物（投影 / fallback / live 段）暂存
     *   {@link outlet}，由编译器经 fragment 原位展开；`data-slot` 锚点由首个元素根承接；
     * - **空 / 非空分流**：非空 = fallback 出口（未填充渲染 `.content` 子树，fallback 根
     *   同样注入——防「填充有样式、未填充裸奔」的跳变）；空（纯空白 / 注释）= 可选出口
     *   （未填充整出口不渲染，无锚点）；
     * - **出口注入**：created 期抄录的注入集在内容编译**前**写入每个元素根——`:class` /
     *   `@click` / `x-show` 等指令属性原文随内容编译管线作为活指令生效（调用方作用域求值）。
     */
    private _compileTemplateOutlet(tpl: HTMLTemplateElement): void {
        const slotName = this.dynamicInvalid
            ? null
            : (this.dynamicResolved?.name ?? this.resolvedAttrName);
        // 投影：内容段在调用方基准编译
        if (this.content && this.callerScope) {
            // 活体段（ADR-0062）：直挂产物、不克隆不再编译；出口注入跳过（活体元素生死归
            // 构造方，注入属性无人清理——ADR-0137 决策二 live 豁免）
            if (this.content.mode === "live") {
                if (this.injectAttrs && this.injectAttrs.length > 0) {
                    this.warn(
                        `x-slot: 活体内容段不参与出口注入（活体元素归构造方管理），注入属性已忽略（ADR-0137）`,
                    );
                }
                this._finishOutlet(
                    [...this.content.nodes],
                    this._firstElementRoot(this.content.nodes),
                    slotName,
                );
                return;
            }
            // 注入（活注入：先写属性原文、后编译）→ detached 容器编译 → 产物暂存。
            // 锚点取**编译产物**首根（编译是克隆语义，编译前节点的 dataset/绑定会随克隆丢弃；
            // 注入属性得以幸存正因 setAttribute 先于 cloneNode）
            this._applyOutletInjection(this.content.nodes);
            const holder = document.createElement("div");
            const inlet = this._makeSuperInlet();
            this.contentScopes = this.engine.compiler.compileSlotNodes(
                this.content.nodes,
                this.callerScope,
                this.paramData,
                holder,
                (s) => {
                    s.superInlet = inlet;
                },
            );
            const produced = Array.from(holder.childNodes);
            this._finishOutlet(produced, this._firstElementRoot(produced), slotName);
            // 传递绑定（ADR-0108）：template 出口无包裹层，出口的 DOM 代表 = 内容首根
            //（锚点）——绑定应用到锚点而非被替换的 template（方向语义不变：内容 → 出口）
            this._applyCallerBindings();
            return;
        }
        // 可选出口：无内容 + 空载体（纯空白 / 注释）→ 整出口不渲染（空产物、无锚点）
        if (isBlankSlotCarrier(tpl)) {
            this.outlet = { nodes: [], anchor: null };
            return;
        }
        // fallback：`.content` 子树在组件作用域编译——先克隆到中间 fragment（模板只读
        // 契约，ADR-0002）、注入 fallback 每个元素根，再经 compileSuperFallback 同款管线
        // 编译（元素走 compileChild 显式 parentScope——detached 克隆的 _linkParent 摸不到
        // 祖先 scope，直接 transformElement 会断链致插值读不到组件 data；注入的指令属性
        // 原文随编译生效）。锚点同样取编译产物首根。
        const staging = document.createDocumentFragment();
        for (const n of Array.from(tpl.content.childNodes)) staging.appendChild(n.cloneNode(true));
        this._applyOutletInjection(Array.from(staging.childNodes));
        const compiled = this.engine.compiler.compileSuperFallback(staging, this.binding);
        this.contentScopes = compiled.scopes; // destroy 回收（同时由出口 binding 级联，幂等）
        this._finishOutlet(compiled.nodes, this._firstElementRoot(compiled.nodes), slotName);
    }

    /** 固化 template 载体编译产物：锚点承接 `data-slot`、产物暂存待编译器组 fragment */
    private _finishOutlet(
        nodes: Node[],
        anchor: HTMLElement | null,
        slotName: string | null,
    ): void {
        if (slotName && anchor) anchor.dataset.slot = slotName;
        this.outlet = { nodes, anchor };
    }

    /** 节点序列中的首个元素节点（template 载体内容可多根，锚点取首元素根） */
    private _firstElementRoot(nodes: Node[]): HTMLElement | null {
        for (const n of nodes) {
            if (n instanceof HTMLElement) return n;
        }
        return null;
    }

    /**
     * 出口注入执行（ADR-0137 决策二）：注入集写入**每个元素根**（多根对称、无首根特判），
     * 返回首元素根（锚点候选）。纯文本 / 插值段无元素根可注入 → warn + 丢弃属性
     * （绝不静默造包裹层，守「最小 DOM」取舍）。
     */
    private _applyOutletInjection(nodes: Node[]): HTMLElement | null {
        const anchor = this._firstElementRoot(nodes);
        if (!this.injectAttrs || this.injectAttrs.length === 0) return anchor;
        let injectedAny = false;
        for (const n of nodes) {
            if (!(n instanceof HTMLElement)) continue;
            for (const [name, value] of this.injectAttrs) this._mergeInjectAttr(n, name, value);
            injectedAny = true;
        }
        if (!injectedAny) {
            this.warn(
                `x-slot: 出口 "${this.dynamicResolved?.name ?? this.resolvedAttrName}" 的注入属性无处安放（内容段无元素根），已丢弃（ADR-0137）`,
            );
        }
        return anchor;
    }

    /**
     * 单属性注入的冲突合并（ADR-0137）：**调用方赢**——内容根已有同名属性不被覆盖
     * （与传递绑定 ADR-0108 跨机制方向一致）；`class` / `style` 走 token / 声明级合并
     * （内容根已有保留 + 声明侧追加，语义对齐 SpreadBinder 的 diff 合并）。
     */
    private _mergeInjectAttr(target: Element, name: string, value: string): void {
        if (name === "class") {
            const base = target.getAttribute("class");
            if (!base) {
                target.setAttribute("class", value);
                return;
            }
            const tokens = new Set(base.split(/\s+/).filter(Boolean));
            for (const t of value.split(/\s+/).filter(Boolean)) tokens.add(t);
            target.setAttribute("class", Array.from(tokens).join(" "));
            return;
        }
        if (name === "style") {
            const base = target.getAttribute("style");
            if (!base) {
                target.setAttribute("style", value);
                return;
            }
            // 声明级合并：同名属性内容根赢（先写在场），声明侧仅补充新属性
            const decls = new Map<string, string>();
            for (const decl of base
                .split(";")
                .map((s) => s.trim())
                .filter(Boolean)) {
                const idx = decl.indexOf(":");
                if (idx > 0) decls.set(decl.slice(0, idx).trim().toLowerCase(), decl);
            }
            for (const decl of value
                .split(";")
                .map((s) => s.trim())
                .filter(Boolean)) {
                const idx = decl.indexOf(":");
                if (idx <= 0) continue;
                const prop = decl.slice(0, idx).trim().toLowerCase();
                if (!decls.has(prop)) decls.set(prop, decl);
            }
            target.setAttribute("style", Array.from(decls.values()).join("; "));
            return;
        }
        if (target.hasAttribute(name)) return; // 调用方赢：内容根同名属性不被覆盖
        target.setAttribute(name, value);
    }

    /**
     * 构造 super 句柄（ADR-0084）：内容子树内 x-super 标记的惰性 fallback 编译入口。
     *
     * 每次调用经 `compiler.compileSuperFallback` 在**出口 binding（组件作用域）**链上
     * 独立编译一份（同段多次出现各自展开、各挂各的 watcher）；fallback 事实源与既有
     * fallback 编译路径一致（普通出口 `childNodes` / `<template>` 出口 `.content`，
     * 继承覆盖已替换快照 → 天然展开继承覆盖层）；出口无 fallback 子树 → 静默空（Q8）。
     * 产物 scopes 的销毁：parent=出口 binding 级联 + SuperDirective.destroy 兜底（幂等）。
     */
    private _makeSuperInlet(): SuperInlet {
        return () => {
            const tpl = this.template;
            if (!tpl) return { nodes: [], scopes: [] };
            const source = tpl instanceof HTMLTemplateElement ? tpl.content : tpl;
            if (source.childNodes.length === 0) return { nodes: [], scopes: [] };
            return this.engine.compiler.compileSuperFallback(source, this.binding);
        };
    }

    /**
     * 应用内容侧传递绑定（ADR-0108）：`x-slot.bind` 表达式在**调用方作用域链**求值
     * （depth:2 键级响应，与 x-bind 展开同款订阅粒度），以 SpreadBinder 展开到出口元素。
     *
     * - 跨组件优先级：调用方赢——`template: null` 不收集出口静态属性的 reservedKeys
     *   恒赢集，出口自身静态属性可被覆盖；class/style 走既有 diff 合并（组件侧 token 保留、
     *   调用方追加/覆盖）。
     * - watch 挂 callerScope（watcher 由 scope 持有、随调用方卸载回收）；出口 destroy 后
     *   以 `this.content === null` 短路，回调空转、不再写已分离的出口元素。
     * - live 段恒无 bindingsExpr（引擎编程式构造），自然跳过。
     */
    private _applyCallerBindings(): void {
        const expr = this.content?.bindingsExpr;
        const caller = this.callerScope;
        if (!expr || !caller) return;
        const binder = new SpreadBinder({
            engine: this.engine,
            // template 载体（ADR-0137）：出口的 DOM 代表 = 内容首根（锚点）——绑定应用到
            // 锚点而非被替换的 template；元素载体照旧出口元素自身
            el: this.outlet?.anchor ?? this.el,
            template: null,
            getOption: () => undefined,
        });
        const initial = caller.watch(
            expr,
            ({ value }) => {
                if (!this.content) return; // 出口已销毁：watcher 存续期间空转
                binder.apply(value);
            },
            { depth: 2, context: "caller" },
        );
        binder.apply(initial);
    }

    /**
     * 出口值变化 → 形参容器原地更新 + 内容 scope 刷新（x-for 复用先例，ADR-0056 假设③）。
     *
     * `paramData` 引用永不替换（内容 scope.locals 已绑定该引用）；对象按 `paramData`
     * 键 `Object.assign`，非对象清空为 undefined。contentScopes 在 compile 后才填充——
     * created 期首调 refresh 为空操作，初值已就位供首次编译读取。
     */
    private _applyParams(value: any): void {
        if (!this.paramData) return;
        if (value != null && typeof value === "object" && !Array.isArray(value)) {
            for (const k of Object.keys(this.paramData)) {
                this.paramData[k] = (value as Record<string, any>)[k];
            }
        } else {
            for (const k of Object.keys(this.paramData)) {
                this.paramData[k] = undefined;
            }
        }
        for (const s of this.contentScopes) s.refresh();
    }

    override destroy(): void {
        // 内容 scopes 的 parent 是 caller（可能仍活着）——出口销毁时须显式回收；
        // 若 caller 已先级联销毁，scope.destroyed 幂等守卫使二次 destroy 为 no-op。
        for (const s of this.contentScopes) s.destroy();
        this.contentScopes = [];
        this.content = null;
        this.callerScope = null;
        this.paramData = null;
        this.dynamicResolved = null;
        this.dynamicInvalid = false;
        this.injectAttrs = null;
        this.outlet = null;
    }
}
