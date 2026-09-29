import { AutoSparkDirectiveBase } from "../base";
import {
    iconRegistry,
    refreshIconStyle,
    ICON_BASE_CLASS,
    ICON_BADGE_CLASS,
    ICON_BUTTON_CLASS,
    GLOBAL_SYMBOL_PREFIX,
    DEFAULT_ICON_STROKE_WIDTH,
    ICON_NAME_RE,
    normalizeStrokeWidth,
    type IconChangeAction,
} from "../../icons/registry";
import { resolveIconName } from "../../icons/domain";
import { SVG_NS } from "../../icons/symbol";

/** 未命中 warn 按 name 去重（响应式重渲染不刷屏） */
const missWarned = new Set<string>();

/** badge 无效值 warn 按 String(v) 去重（动态重渲染不刷屏） */
const badgeWarned = new Set<string>();

/**
 * x-icon：图标渲染指令（ADR-0058 symbol 机制，取代 ADR-0046/0047 的 mask 管线）。
 *
 * 宿主元素不变，注入唯一子节点 `<svg aria-hidden><use href="#as-…"/></svg>`（撑满宿主）。
 * 名字解析走**图标域**（scope 链就近 → 全局注册表兜底，与 getComponent 同构）；**值两栖**
 * ——表达式求值优先，求值空/非法时原值形匹配才回退字面量（裸名不是合法 JS，状态命中优先、
 * 字面量为空值兜底），值为响应式表达式（切换即换图标）。**待定名**（已声明未到达）空占位；
 * 未命中 warn + 渲染**默认图标**（缺图不破相）；注册/远程到达/失败经变更总线按名唤醒重渲染。
 *
 * **颜色主权在宿主**：currentColor 经 CSS 继承直达 use 内容——`color` 选项内联 `color`
 * 覆盖（原 `background-color` 语义随 mask 下线，ADR-0058 决策 6）；`strokeWidth` 经
 * `--as-icon-sw` 变量（收集期已剥离全部 stroke-width，CSS 继承覆盖永远可靠）；`size` /
 * `padding` / `badge` / `button` / `pointer` 为盒模型层选项照旧（ADR-0049 不受影响）。
 */
export class IconDirective extends AutoSparkDirectiveBase {
    static override readonly priority = 0;
    static override readonly singleton = true;

    private destroyed = false;
    /** use 元素（created 期随载体 svg 一次性创建；SSR 无 document 为 null） */
    private useEl: SVGUseElement | null = null;
    /** 待定/未命中的请求名（变更总线按名唤醒重渲染） */
    private missName: string | null = null;
    /** 当前渲染名（registry delete 联动回退默认图标） */
    private activeName: string | null = null;
    /** 最近一次渲染值（全局配置变更广播时重渲染用） */
    private lastRaw = "";
    /** 变更总线退订句柄 */
    private offChange: (() => void) | null = null;

    override created() {
        if (this.value == null || this.value === "") return;
        // 惰性建表（幂等）：基础 .as-icon 规则（含 --as-icon-sw 变量）+ badge/button 修饰规则
        refreshIconStyle();
        this.el?.classList.add(ICON_BASE_CLASS);
        this._ensureIconSvg();
        this.offChange = iconRegistry.onChange((name, action) => this._onIconChange(name, action));
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
        this._applyStaticStyle();
        if (!raw) {
            this.missName = null;
            this.activeName = null;
            this._applyHref(null);
            return;
        }
        const res = resolveIconName(this.binding, raw);
        if (res.kind === "href") {
            this.missName = null;
            this.activeName = raw;
            this._applyHref(res.href);
            return;
        }
        if (res.kind === "pending") {
            this.missName = raw;
            this.activeName = null;
            this._applyHref(null);
            return;
        }
        if (!missWarned.has(raw)) {
            missWarned.add(raw);
        }
        this.missName = raw;
        const fallback = iconRegistry.has("default") ? "default" : null;
        // activeName 记 default：default 被删（含同名覆盖变更）时唤醒本实例重渲染（对称回退空占位）
        this.activeName = fallback;
        this._applyHref(fallback ? `#${GLOBAL_SYMBOL_PREFIX}${fallback}` : null);
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
     * badge 选项归一化（标量三形态，**形态即启用**）：boolean true / number 板 padding
     * （→ px，须 ≥ 0 且有限，否则 warn + 按 true）/ string 板 padding（CSS 值直传，
     * 空串按布尔 true）。false / null / undefined 未启用；其他类型 warn 剪枝为未启用。
     * 返回 null = 未启用；pad null = 板 padding 走「显式 padding 选项 > 默认 0.3em」链
     * （badge 带值时压倒独立 padding 选项——badge 的值就是板 padding 的就近声明）。
     */
    private _badge(): { pad: string | null } | null {
        const v = this._opt("badge");
        if (v == null || v === false) return null;
        if (v === true) return { pad: null };
        if (typeof v === "number") {
            if (Number.isFinite(v) && v >= 0) return { pad: `${v}px` };
            this._warnBadge(v, "板 padding 须为非负数字，按默认 padding 渲染");
            return { pad: null };
        }
        if (typeof v === "string") {
            const pad = v.trim();
            if (pad === "") return { pad: null };
            return { pad };
        }
        this._warnBadge(v, "仅支持 boolean | number（板 padding px）| string（板 padding 值），已忽略");
        return null;
    }

    /** badge 无效值 warn（按 String(v) 去重） */
    private _warnBadge(v: unknown, why: string): void {
        const key = String(v);
        if (!badgeWarned.has(key)) {
            badgeWarned.add(key);
            this.warn(`badge 选项 "${key}" 无效：${why}`);
        }
    }

    /**
     * 选项静态样式（每次渲染重放，对称写/清——全局配置变更可回收旧值）：
     * size 默认 1em 走基础规则、padding 默认无、color 默认 currentColor（继承），均为显式声明才内联。
     * strokeWidth：与生效默认一致零内联（基础规则 `var(--as-icon-sw,1.25)` 兜底），非默认才
     * 内联变量覆盖。修饰：badge 挂修饰类（规则常驻基础样式表，标量三形态）；button 挂修饰类
     * （载体动效，ADR-0049——有板挂 wrapper 作用于板、无板挂宿主作用于图形，载体唯一不双挂）；
     * pointer 内联 cursor。读取走四级配置链（指令 > 宿主 > 全局 > 内置）。
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
        let paddingCss =
            typeof padding === "number" && padding >= 0
                ? `${padding}px`
                : typeof padding === "string" && padding.trim() !== ""
                  ? padding
                  : null;
        const badge = this._badge();
        const wantButton = this._opt("button") === true;
        // badge:true（无内嵌 pad）的内置默认 padding（板与图形的间距，总占位 = size + 2×padding）：
        // 四级链均未声明时补 0.3em——显式 padding 声明（含 0）优先
        if (paddingCss === null && badge && badge.pad === null) paddingCss = "0.3em";
        // padding 落点：badge 时作用于**包裹层**（图形恒 size）；非 badge 照旧内联宿主。
        // badge 带值时其值压倒独立 padding 选项——badge 的值就是板 padding 的就近声明
        let wrapPad: string | null = null;
        if (badge) {
            wrapPad = badge.pad ?? paddingCss;
            el.style.removeProperty("padding");
        } else {
            if (paddingCss) el.style.padding = paddingCss;
            else el.style.removeProperty("padding");
        }
        // 包裹层调度（幂等，对称写/清——全局配置变更拆包/重包均收敛）
        this.engine.scheduler.schedule(() => {
            if (this.destroyed) return;
            this._applyBadgeWrap(badge !== null);
            if (badge === null) return; // 未启用：拆包还原即收敛
            const w = this.el?.parentElement;
            if (!w) return;
            if (wrapPad) w.style.padding = wrapPad;
            else w.style.removeProperty("padding");
            // button 载体唯一：有板归板（wrapper 整体动效）
            w.classList.toggle(ICON_BUTTON_CLASS, wantButton);
        });
        // button 载体唯一：有板归板（wrapper 类在回调中挂）、无板归图形——宿主侧同步
        // 对称写/清（挂载即生效，不经微任务）
        el.classList.toggle(ICON_BUTTON_CLASS, wantButton && badge === null);
        // color 选项：currentColor 继承体系（内联 color 即换图形颜色）
        const color = this._opt("color");
        if (typeof color === "string" && color.trim() !== "") el.style.color = color;
        else el.style.removeProperty("color");
        // pointer 修饰：可点击语义的手型光标（内联对称写/清）
        if (this._opt("pointer") === true) el.style.cursor = "pointer";
        else el.style.removeProperty("cursor");
        // strokeWidth：CSS 继承直达 use shadow 内容（收集期已剥离全部 stroke-width）
        const sw = this._strokeWidth();
        if (sw === this._defaultSw()) el.style.removeProperty("--as-icon-sw");
        else el.style.setProperty("--as-icon-sw", String(sw));
    }

    /**
     * badge 包裹层挂/拆（幂等）：badge 启用时为宿主包一层同类名 wrapper（wrapper 自身
     * 做淡色圆角板，图形子元素完整渲染不受板影响）；未启用时拆包还原。拆包用 `replaceWith`
     * 保留宿主位置；wrapper 随子树消亡（x-if detach 等以子树为单位）。
     */
    private _applyBadgeWrap(want: boolean): void {
        const el = this.el;
        const parent = el?.parentElement;
        if (!el) return;
        if (want) {
            if (!parent) return; // 未挂载（重渲染路径重试）
            if (parent.classList.contains(ICON_BADGE_CLASS)) return; // 已包
            const w = document.createElement("span");
            w.className = ICON_BADGE_CLASS;
            parent.insertBefore(w, el);
            w.appendChild(el);
        } else if (parent?.classList.contains(ICON_BADGE_CLASS)) {
            parent.replaceWith(el);
        }
    }
}
