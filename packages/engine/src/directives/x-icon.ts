import { AutoSparkDirectiveBase } from "../features/directive/base";
import {
    iconRegistry,
    refreshIconStyle,
    ICON_BASE_CLASS,
    ICON_CIRCLE_CLASS,
    ICON_RADIUS_CLASS,
    ICON_BUTTON_CLASS,
    GLOBAL_SYMBOL_PREFIX,
    DEFAULT_ICON_STROKE_WIDTH,
    ICON_NAME_RE,
    normalizeStrokeWidth,
    type IconChangeAction,
} from "../features/icons/registry";
import { resolveIconName } from "../features/icons/domain";
import { SVG_NS } from "../features/icons/symbol";

/** 未命中 warn 按 name 去重（响应式重渲染不刷屏） */
const missWarned = new Set<string>();

/** shape 无效值 warn 按 String(v) 去重（动态重渲染不刷屏） */
const shapeWarned = new Set<string>();

/** rotate 无效值 warn 按 String(v) 去重（动态重渲染不刷屏） */
const rotateWarned = new Set<string>();

/** rotate 动画 transition（常驻 svg 载体；时长经 --as-icon-rotate-duration 令牌可覆盖，不新增选项键） */
const ICON_ROTATE_TRANSITION = "transform var(--as-icon-rotate-duration, 0.3s) ease";

/**
 * 静态样式型选项键：成员表达式值变化时重放 `_applyStaticStyle`（表达式通道热应用）。
 * `circle` / `radius` 为修饰符快捷形态键（并入选项层后与 shape 等价）。
 */
const ICON_STYLE_OPTION_KEYS = new Set([
    "size",
    "color",
    "padding",
    "strokeWidth",
    "shape",
    "button",
    "pointer",
    "circle",
    "radius",
]);

/**
 * x-icon：图标渲染指令（ADR-0058 symbol 机制，取代 ADR-0046/0047 的 mask 管线）。
 *
 * 宿主元素不变，注入唯一子节点 `<svg aria-hidden><use href="#as-…"/></svg>`（撑满宿主）。
 * 名字解析走**图标域**（scope 链就近 → 全局注册表兜底，与 getComponentDeclaration 同构）；**值两栖**
 * ——表达式求值优先，求值空/非法时原值形匹配才回退字面量（裸名不是合法 JS，状态命中优先、
 * 字面量为空值兜底），值为响应式表达式（切换即换图标）。**待定名**（已声明未到达）空占位；
 * 未命中 warn + 渲染**默认图标**（缺图不破相）；注册/远程到达/失败经变更总线按名唤醒重渲染。
 *
 * **颜色主权在宿主**：currentColor 经 CSS 继承直达 use 内容——`color` 选项内联 `color`
 * 覆盖（原 `background-color` 语义随 mask 下线，ADR-0058 决策 6）；`strokeWidth` 经
 * `--as-icon-sw` 变量（收集期已剥离全部 stroke-width，CSS 继承覆盖永远可靠）；`size` /
 * `padding` / `shape` / `button` / `pointer` 为盒模型层选项（`shape` 底板形态枚举 +
 * `--auto-*` theme 令牌对接，ADR-0135；ADR-0049 载体动效不受影响）；`rotate` 旋转选项
 * （svg 载体应用 + transition 动画，见 `_applyRotate`）。
 */
export class IconDirective extends AutoSparkDirectiveBase {
    static override readonly priority = 0;
    static override readonly singleton = true;

    private destroyed = false;
    /** use 元素（created 期随载体 svg 一次性创建；SSR 无 document 为 null） */
    private useEl: SVGUseElement | null = null;
    /** svg 载体（rotate 旋转应用点；SSR 无 document 为 null） */
    private svgEl: SVGSVGElement | null = null;
    /** 最近应用的 rotate CSS 值（幂等缓存，null = 从未/当前未启用） */
    private lastRotateCss: string | null = null;
    /** 待定/未命中的请求名（变更总线按名唤醒重渲染） */
    private missName: string | null = null;
    /** 当前渲染名（registry delete 联动回退默认图标） */
    private activeName: string | null = null;
    /** 当前渲染图标的网格宽（ADR-0130 描边补偿：sw × grid/24；null = 不补偿） */
    private activeGrid: number | null = null;
    /** 最近一次渲染值（全局配置变更广播时重渲染用） */
    private lastRaw = "";
    /** 变更总线退订句柄 */
    private offChange: (() => void) | null = null;

    override created() {
        if (this.value == null || this.value === "") return;
        // 惰性建表（幂等）：基础 .as-icon 规则（含 --as-icon-sw 变量）+ shape/button 修饰规则
        refreshIconStyle();
        this.el?.classList.add(ICON_BASE_CLASS);
        this._ensureIconSvg();
        this.offChange = iconRegistry.onChange((name, action) => this._onIconChange(name, action));
        // 选项成员表达式订阅（rotate 热应用通道，ADR-0007 修订；须在初次应用前建立）
        this._watchOptionExprs();
        // 值两栖（表达式优先，字面量回退）：裸图标名不是合法 JS 表达式——求值抛错时原值作
        // 字面量；求值为空（null/undefined/NaN/""）时原值**形匹配**（图标名）才回退字面量
        //（含点形态不回退，维持空占位，避免误导性未注册 warn）。状态命中优先，字面量只是空值兜底。
        let initial: unknown;
        try {
            initial = this.binding.watch(this.value, ({ value }) =>
                this._render(this._valueOf(value)),
            );
        } catch {
            this._render(String(this.value).trim());
            return;
        }
        this._render(this._valueOf(initial));
    }

    /** 求值结果 → 渲染值：空值时原值形匹配（图标名）则回退字面量，否则空占位 */
    private _valueOf(v: unknown): string {
        if (v == null || v === "" || (typeof v === "number" && Number.isNaN(v))) {
            const raw = String(this.value ?? "").trim();
            return ICON_NAME_RE.test(raw) ? raw : "";
        }
        return String(v);
    }

    override destroy() {
        this.destroyed = true;
        this.offChange?.();
        this.offChange = null;
    }

    /** 变更总线联动：待定/未命中名到达补渲染、使用中名被删回退默认图标、全局配置变更重渲染 */
    private _onIconChange(name: string, action: IconChangeAction): void {
        if (this.destroyed) return;
        if (action === "options") {
            if (this.lastRaw) this._render(this.lastRaw);
            return;
        }
        if (name === this.missName || name === this.activeName) this._render(this.lastRaw);
    }

    /** 渲染序：空值/待定 → 空 use（无 href）；就绪 → href；未命中 → warn + 默认图标 */
    private _render(raw: string): void {
        this.lastRaw = raw;
        if (this.destroyed) return;
        if (!raw) {
            this.missName = null;
            this.activeName = null;
            this.activeGrid = null;
            this._applyHref(null);
            this._applyStaticStyle();
            return;
        }
        const res = resolveIconName(this.binding, raw);
        if (res.kind === "href") {
            this.missName = null;
            this.activeName = raw;
            this.activeGrid = res.grid;
            this._applyHref(res.href);
        } else if (res.kind === "pending") {
            this.missName = raw;
            this.activeName = null;
            this.activeGrid = null;
            this._applyHref(null);
        } else {
            if (!missWarned.has(raw)) {
                missWarned.add(raw);
            }
            this.missName = raw;
            const fallback = iconRegistry.has("default") ? "default" : null;
            // activeName 记 default：default 被删（含同名覆盖变更）时唤醒本实例重渲染（对称回退空占位）
            this.activeName = fallback;
            this.activeGrid = fallback ? (iconRegistry.getGrid(fallback) ?? null) : null;
            this._applyHref(fallback ? `#${GLOBAL_SYMBOL_PREFIX}${fallback}` : null);
        }
        // 静态样式重放置于解析后——网格补偿（ADR-0130）依赖本次解析出的 activeGrid
        this._applyStaticStyle();
    }

    /** 创建 use 渲染载体（宿主内唯一 `<svg><use/></svg>` 子节点；幂等） */
    private _ensureIconSvg(): void {
        const el = this.el;
        if (!el || this.useEl || typeof document === "undefined") return;
        const svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("aria-hidden", "true");
        const use = document.createElementNS(SVG_NS, "use");
        svg.appendChild(use);
        el.appendChild(svg);
        this.svgEl = svg;
        this.useEl = use;
    }

    /** href 写/清（无 href 的 use 渲染为空——待定与空占位的天然姿态） */
    private _applyHref(href: string | null): void {
        const use = this.useEl;
        if (!use) return;
        if (href) use.setAttribute("href", href);
        else use.removeAttribute("href");
    }

    /** 四级配置链读取：指令选项 > 宿主选项（ADR-0007 回退）> 全局默认（icons.options）> undefined（内置默认由各消费点自理） */
    private _opt(key: string): unknown {
        const v = this.getOption(key);
        if (v !== undefined) return v;
        return iconRegistry.options?.[key];
    }

    /** 生效默认 sw（全局配置层，「是否内联 --as-icon-sw」的判定基准） */
    private _defaultSw(): number {
        return (
            normalizeStrokeWidth(iconRegistry.options?.strokeWidth) ?? DEFAULT_ICON_STROKE_WIDTH
        );
    }

    /** 指令级 sw（含宿主回退）> 生效默认 */
    private _strokeWidth(): number {
        return normalizeStrokeWidth(this._opt("strokeWidth")) ?? this._defaultSw();
    }

    /**
     * shape 选项归一化（ADR-0135 纯枚举）：显式字符串值（`"none" | "circle" | "radius"`，
     * 空串宽容按 none）优先；未声明 / none / false 时查修饰符快捷形态（`.circle` /
     * `.radius` 并入选项为 true）；其余类型 / 拼写 warn 剪枝按未启用。
     * 返回 null = 未启用（≡ none，无背景）。
     */
    private _shape(): "circle" | "radius" | null {
        const v = this._opt("shape");
        if (typeof v === "string") {
            const s = v.trim();
            if (s === "circle" || s === "radius") return s;
            if (s === "none" || s === "") return null;
            this._warnShape(v, "值域为 none | circle | radius，已忽略");
            return null;
        }
        if (v == null || v === false) {
            if (this._opt("circle") === true) return "circle";
            if (this._opt("radius") === true) return "radius";
            return null;
        }
        this._warnShape(v, "仅支持字符串枚举 none | circle | radius（修饰符 .circle / .radius），已忽略");
        return null;
    }

    /** shape 无效值 warn（按 String(v) 去重） */
    private _warnShape(v: unknown, why: string): void {
        const key = String(v);
        if (!shapeWarned.has(key)) {
            shapeWarned.add(key);
            this.warn(`shape 选项 "${key}" 无效：${why}`);
        }
    }

    /**
     * 选项静态样式（每次渲染重放，对称写/清——全局配置变更可回收旧值）：
     * size 默认 `var(--auto-icon-size,1em)` 走基础规则（theme 令牌，ADR-0135）、padding
     * 默认无、color 默认 currentColor（继承），均为显式声明才内联。strokeWidth：与生效
     * 默认一致零内联（基础规则 `var(--as-icon-sw,1.25)` 兜底），非默认才内联变量覆盖。
     * 修饰：shape 挂形态修饰类（规则常驻基础样式表，板距默认经 `var(--auto-padding,0.3em)`
     * 令牌承接）；button 挂修饰类（载体动效，ADR-0049——有板挂 wrapper 作用于板、无板
     * 挂宿主作用于图形，载体唯一不双挂）；pointer 内联 cursor。读取走四级配置链
     * （指令 > 宿主 > 全局 > 内置）。
     */
    private _applyStaticStyle(): void {
        const el = this.el;
        if (!el) return;
        const size = this._opt("size");
        const sizeCss =
            typeof size === "number" && size > 0
                ? `${size}px`
                : typeof size === "string" && size.trim() !== ""
                  ? size
                  : null;
        if (sizeCss) {
            el.style.width = sizeCss;
            el.style.height = sizeCss;
        } else {
            el.style.removeProperty("width");
            el.style.removeProperty("height");
        }
        const padding = this._opt("padding");
        const paddingCss =
            typeof padding === "number" && padding >= 0
                ? `${padding}px`
                : typeof padding === "string" && padding.trim() !== ""
                  ? padding
                  : null;
        const shape = this._shape();
        const wantButton = this._opt("button") === true;
        // 板距落点（ADR-0135）：shape 启用时作用于**包裹层**（图形恒 size）——显式 padding
        // 声明内联压倒形态类的 var(--auto-padding,0.3em) 令牌默认（零内联纪律）；未启用
        // 照旧内联宿主（默认无 padding——无板即无板距）
        const wrapPad = shape !== null ? paddingCss : null;
        if (shape !== null) el.style.removeProperty("padding");
        else if (paddingCss) el.style.padding = paddingCss;
        else el.style.removeProperty("padding");
        // color 选项：currentColor 继承体系（内联 color 即换图形颜色）；指定色同时是底板
        // 浓板联动的触发态（色与浓度在包裹层调度中下到 wrapper，ADR-0135 决策三）
        const color = this._opt("color");
        const colorCss = typeof color === "string" && color.trim() !== "" ? color : null;
        if (colorCss) el.style.color = colorCss;
        else el.style.removeProperty("color");
        // 包裹层调度（幂等，对称写/清——全局配置变更拆包/重包均收敛）
        this.engine.scheduler.schedule(() => {
            if (this.destroyed) return;
            this._applyShapeWrap(shape);
            if (shape === null) return; // 未启用：拆包还原即收敛（wrapper 消亡，浓板变量随之回收）
            const w = this.el?.parentElement;
            if (!w) return;
            if (wrapPad) w.style.padding = wrapPad;
            else w.style.removeProperty("padding");
            // 浓板联动（ADR-0135 决策三）：指定 color 时底板同色相 8% 浓度——色与浓度都
            // 下到 wrapper（wrapper 是宿主父级，宿主内联到不了 wrapper 的 background /
            // currentColor 求值）；未指定对称清（板色回落类规则 5% currentColor 随文字色）
            if (colorCss) {
                w.style.color = colorCss;
                w.style.setProperty("--as-icon-mix", "8%");
            } else {
                w.style.removeProperty("color");
                w.style.removeProperty("--as-icon-mix");
            }
            // button 载体唯一：有板归板（wrapper 整体动效）
            w.classList.toggle(ICON_BUTTON_CLASS, wantButton);
        });
        // button 载体唯一：有板归板（wrapper 类在回调中挂）、无板归图形——宿主侧同步
        // 对称写/清（挂载即生效，不经微任务）
        el.classList.toggle(ICON_BUTTON_CLASS, wantButton && shape === null);
        // pointer 修饰：可点击语义的手型光标（内联对称写/清）
        if (this._opt("pointer") === true) el.style.cursor = "pointer";
        else el.style.removeProperty("cursor");
        // strokeWidth：CSS 继承直达 use shadow 内容（收集期已剥离全部 stroke-width）。
        // 网格补偿（ADR-0130）：CSS stroke-width 按 symbol 用户单位解释，非 24 网格图标
        // 视觉粗细按 grid/24 换算（16 网格 ×2/3、256 网格 ×1/10.67）；取 4 位小数防长尾。
        const sw = this._strokeWidth();
        const eff = this.activeGrid
            ? Math.round(((sw * this.activeGrid) / 24) * 1e4) / 1e4
            : sw;
        if (eff === this._defaultSw()) el.style.removeProperty("--as-icon-sw");
        else el.style.setProperty("--as-icon-sw", String(eff));
        // rotate 挂尾部（幂等缓存：图标名重渲染同值跳过；全局配置变更广播经本重放路径
        //热应用全局层 rotate）
        this._applyRotate();
    }

    /**
     * shape 底板包裹层挂/拆（幂等）：shape 启用时为宿主包一层形态类 wrapper（wrapper 自身
     * 做淡色板，图形子元素完整渲染不受板影响）；未启用时拆包还原；形态切换（circle ↔
     * radius）先拆后包。拆包用 `replaceWith` 保留宿主位置；wrapper 随子树消亡（x-if
     * detach 等以子树为单位）。
     */
    private _applyShapeWrap(want: "circle" | "radius" | null): void {
        const el = this.el;
        if (!el) return;
        if (want) {
            const cls = want === "circle" ? ICON_CIRCLE_CLASS : ICON_RADIUS_CLASS;
            let parent = el.parentElement;
            if (!parent) return; // 未挂载（重渲染路径重试）
            if (parent.classList.contains(cls)) return; // 已包同形态
            if (
                parent.classList.contains(ICON_CIRCLE_CLASS) ||
                parent.classList.contains(ICON_RADIUS_CLASS)
            ) {
                parent.replaceWith(el); // 异形态 wrapper：拆包（随后按新形态重包）
                parent = el.parentElement;
                if (!parent) return;
            }
            const w = document.createElement("span");
            w.className = cls;
            parent.insertBefore(w, el);
            w.appendChild(el);
        } else {
            const parent = el.parentElement;
            if (
                parent?.classList.contains(ICON_CIRCLE_CLASS) ||
                parent?.classList.contains(ICON_RADIUS_CLASS)
            ) {
                parent.replaceWith(el);
            }
        }
    }

    /**
     * 选项成员表达式变化钩子（ADR-0007 修订）：热应用两类成员——`rotate` 走 svg 载体
     * （`_applyRotate`，幂等缓存）；静态样式键（size / color / padding / strokeWidth /
     * shape / button / pointer）重放 `_applyStaticStyle`，使组件把 x-icon 选项对象经
     * 成员表达式透传后仍随状态响应（应用入口二通道——本钩子即时热应用 +
     * `_applyStaticStyle` 尾部重放承接全局配置变更广播）。
     */
    protected override _onOptionExprChange(key: string, _value: unknown): void {
        if (this.destroyed) return;
        if (key === "rotate") {
            this._applyRotate();
            return;
        }
        if (ICON_STYLE_OPTION_KEYS.has(key)) this._applyStaticStyle();
    }

    /**
     * rotate 选项归一化（绝对姿态语义——值即最终角度，跨圈显式 370/730，无最短路
     * 径换算）：有限 number（≠0）→ `${n}deg`；纯数字 string（"90" / "-45.5"）宽容
     * 同按 deg（表单 / x-model 通道形态，直传 CSS 成无单位角度被静默丢弃）；其余非空
     * string → 原样透传 CSS（"0.5turn"，非法单位由浏览器丢弃，与 size 同病同治）；
     * 0 / 空 / 未声明 / false → null（不启用）；其余类型（true / 对象 / NaN /
     * Infinity）warn 剪枝（按 String(v) 去重，对齐 shape 先例）。负数、超 360 合法。
     */
    private _rotateCss(): string | null {
        const v = this._opt("rotate");
        if (v == null || v === "" || v === 0 || v === false) return null;
        if (typeof v === "number") {
            if (Number.isFinite(v)) return `${v}deg`;
        } else if (typeof v === "string" && v.trim() !== "") {
            const s = v.trim();
            // 纯数字字符串（"90" / "-45.5"）宽容按 deg——表单 / x-model 通道的天然形态，
            // 直传 CSS 会成无单位 rotate(90) 被浏览器静默丢弃
            if (/^-?\d+(\.\d+)?$/.test(s)) return `${s}deg`;
            return s;
        }
        const key = String(v);
        if (!rotateWarned.has(key)) {
            rotateWarned.add(key);
            this.warn(
                `rotate 选项 "${key}" 无效：须为 number（按 deg）或非空 string（CSS 角度值），已忽略`,
            );
        }
        return null;
    }

    /**
     * 旋转应用（幂等，角度未变跳过）：应用点为 svg 载体——指令私有节点，不占宿主样式
     * 面、与 button/shape 动效（宿主/wrapper 层）完全隔离；图标名重渲染同值经缓存跳过
     * （svg 载体持久，不闪变）。启用时 transition 常驻 + transform 写目标角度；0° 起
     * 步（当前无 transform）先强制布局再写值——入场/再启用从 0° 动画到目标；更新走
     * transition 数值插值从当前角度续转（中断续转浏览器天然支持）；关闭（0/空）移除
     * transform，none 参与插值动画归零。从未声明前不写任何样式（零内联纪律）。
     */
    private _applyRotate(): void {
        const svg = this.svgEl;
        if (!svg || this.destroyed) return; // SSR 无载体（与 useEl 同姿态）
        const css = this._rotateCss();
        if (css === this.lastRotateCss) return; // 幂等双保险（watch 同值不回调，此处兜底）
        this.lastRotateCss = css;
        if (css) {
            svg.style.setProperty("transition", ICON_ROTATE_TRANSITION);
            if (!svg.style.getPropertyValue("transform")) {
                svg.getBoundingClientRect(); // 强制布局：确保 0° 起步（前值确立）触发 transition
            }
            svg.style.setProperty("transform", `rotate(${css})`);
        } else {
            svg.style.removeProperty("transform");
        }
    }
}
