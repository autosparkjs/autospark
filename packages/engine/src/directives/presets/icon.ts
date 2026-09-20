import { AutoSparkDirectiveBase } from "../base";
import {
    iconRegistry,
    refreshIconStyle,
    ICON_BASE_CLASS,
    ICON_BADGE_CLASS,
    ICON_BUTTON_CLASS,
    type IconChangeAction,
} from "../../icons/registry";
import {
    DEFAULT_ICON_STROKE_WIDTH,
    ICON_NAME_RE,
    REMOTE_ICON_RE,
    normalizeStrokeWidth,
    fetchRemoteIcon,
    getCachedRemoteIcon,
    iconDataUrl,
} from "../../icons/factory";

/** 未命中 warn 按 name 去重（响应式重渲染不刷屏） */
const missWarned = new Set<string>();

/** badge 无效值 warn 按 String(v) 去重（动态重渲染不刷屏） */
const badgeWarned = new Set<string>();

/** 远程规则样式表 id（指令自管，与注册表的 autospark-icons 分离——互不耦合脏标记） */
const REMOTE_STYLE_ID = "autospark-icons-remote";
/** 远程规则载体属性名（属性选择器值可直书原始 `集/名`——零编码零碰撞，区别于类名的 ident 约束） */
const REMOTE_ATTR = "data-as-icon";

/**
 * x-icon：图标渲染指令（ADR-0046 本地物种 / ADR-0047 远程物种）。
 *
 * 值两形态（求值后判定通道，本地图标名受 CSS ident 约束天然不含 `/`，零冲突）：
 * - **本地名**：查全局注册表 → 命中挂裸名类（`as-icon <名>`，类规则引用 `:root` 变量）；
 *   未命中 warn + 渲染默认图标（保留尺寸），注册后经变更通知自动补渲染；删除回退默认图标。
 * - **远程形**（`mdi/home`，仅斜杠——冒号形已废除）：fetch 裸 `.svg` → 规范形 → URL 工厂 →
 *   **升格为属性选择器规则**（`.as-icon[data-as-icon="集/名"]`，进指令自管样式表）——实例只挂
 *   `data-as-icon` 短属性复用同一条规则，非默认 sw 才内联工厂产物（与本地物种同构；远程名
 *   非法 ident，故不走类名/变量体系）。加载中空占位、失败默认图标、重取保旧图；竞态以序号
 *   丢弃（对齐 AsyncSourceRunner 骨架——共享 in-flight 缓存使 per-instance abort 反而误伤他人，
 *   序号 + destroyed 即家族 action 形态的先例姿态）。
 *
 * **颜色主权在宿主**：mask 只取 alpha 通道，实际颜色 = 宿主 `background-color`（基础规则
 * `currentColor`，随文字色）；`color` 选项内联覆盖。`size` 默认 1em（数字 → px、字符串直传）、
 * `padding` 同规则；非默认 `strokeWidth` → 内联 mask-image 以工厂产物覆盖类规则
 * （变体 CSS 变量命名需编码 `1.25→1_25`，已否决）。
 */
export class IconDirective extends AutoSparkDirectiveBase {
    static override readonly priority = 0;
    static override readonly singleton = true;

    /** 确保远程规则样式表存在（惰性，SSR 无 document 守卫）并返回其元素 */
    private static _remoteStyle(): HTMLStyleElement | null {
        if (typeof document === "undefined" || !document.head) return null;
        let style = document.getElementById(REMOTE_STYLE_ID) as HTMLStyleElement | null;
        if (!style) {
            style = document.createElement("style");
            style.id = REMOTE_STYLE_ID;
            document.head.appendChild(style);
        }
        return style;
    }

    /**
     * 取回升格：生成 `.as-icon[data-as-icon="集/名"]` 规则注入指令自管样式表（幂等——
     * **样式表本身即登记表**，规则已存在则跳过，不设缓存机制）。首个实例取回后升格，
     * 后续实例**复用同一条规则**（只挂 `data-as-icon` 短属性，DOM 不背整份内联 data URL）
     * ——与本地物种「类规则 + 变量」的共享形态对齐。会话级只增不删（远程缓存不可变）。
     */
    private static _promoteRemoteRule(key: string, dataUrl: string): void {
        const style = IconDirective._remoteStyle();
        if (!style) return;
        // key 字符集 [a-z0-9-/]，无引号字符——属性值直书安全
        const selector = `.as-icon[${REMOTE_ATTR}="${key}"]`;
        if (style.textContent.includes(selector)) return;
        style.textContent += `\n${selector}{-webkit-mask-image:url("${dataUrl}");mask-image:url("${dataUrl}")}`;
    }

    /** 渲染序号：值切换/destroy 递增，在途异步结果作废（竞态丢弃） */
    private seq = 0;
    private destroyed = false;
    /** 当前挂在 class 上的图标名（真实名或 default 占位）；null = 空占位/远程内联 */
    private shownName: string | null = null;
    /** 未命中的本地请求名（add 后唤醒重试，ADR-0046 决策 9） */
    private missName: string | null = null;
    /** 曾成功渲染过任何图标（首取空占位 vs 重取保旧图的判定） */
    private hasVisual = false;
    /** 远程在途标志（联动重渲染让位于在途结果，避免覆盖） */
    private remotePending = false;
    /** 最近一次渲染值（全局配置变更广播时重渲染用） */
    private lastRaw = "";
    /** 注册表变更退订句柄 */
    private offChange: (() => void) | null = null;

    override created() {
        if (this.value == null || this.value === "") return;
        // 惰性建表（幂等脏标记）：远程-only 场景无注册表变更，首渲染也要有 .as-icon 基础规则
        refreshIconStyle();
        this.offChange = iconRegistry.onChange((name, action) => this._onRegistryChange(name, action));
        // 值两栖（表达式优先，字面量回退）：裸图标名（close）/ 远程形（mdi/home 是除法）
        // 不是合法 JS 表达式——求值抛错时原值作字面量；求值为空（null/undefined/NaN/""）
        // 时原值**形匹配**（图标名/远程形）才回退字面量
        //（`state.icon` 之类含点形态不回退，维持空占位，避免误导性未注册 warn）。
        // 状态命中优先：state.close 有值用值，字面量只是空值兜底。
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

    /** 求值结果 → 渲染值：空值时原值形匹配则回退字面量，否则空占位 */
    private _valueOf(v: unknown): string {
        if (v == null || v === "" || (typeof v === "number" && Number.isNaN(v))) {
            const raw = String(this.value ?? "").trim();
            return ICON_NAME_RE.test(raw) || REMOTE_ICON_RE.test(raw) ? raw : "";
        }
        return String(v);
    }

    override destroy() {
        this.destroyed = true;
        this.seq++;
        this.offChange?.();
        this.offChange = null;
    }

    /** 注册表变更联动：miss 唤醒 / 删除回退 / 全局配置变更重渲染 */
    private _onRegistryChange(name: string, action: IconChangeAction): void {
        if (this.destroyed) return;
        if (action === "options") {
            // 全局默认变更：远程规则按旧默认 sw 烘焙——清空重升格（首渲染重建），再重渲染当前值。
            // 多实例各自清一次无害（后清者使先升格的规则作废、自身渲染再升格，收敛为一条新规则）
            const remoteStyle = document.getElementById(REMOTE_STYLE_ID);
            if (remoteStyle) remoteStyle.textContent = "";
            if (this.lastRaw) this._render(this.lastRaw);
            return;
        }
        if (this.remotePending) return;
        if (name === this.missName || name === this.shownName) {
            this._renderLocal(name);
        }
    }

    /** 值渲染入口：空值 → 空占位；远程形 → 远程通道；其余 → 本地通道 */
    private _render(raw: string): void {
        this.lastRaw = raw;
        if (this.destroyed) return;
        this._applyStaticStyle();
        const seq = ++this.seq;
        if (!raw) {
            this.missName = null;
            this.remotePending = false;
            this.hasVisual = false;
            this._applyClasses(null);
            this._clearRemoteAttr();
            this._applyInlineMask(null);
            return;
        }
        if (REMOTE_ICON_RE.test(raw)) {
            this._renderRemote(raw, seq);
        } else {
            this.remotePending = false;
            this._renderLocal(raw);
        }
    }

    /** 本地通道：命中挂类走变量；未命中 warn + 默认图标（default 也被删则空占位） */
    private _renderLocal(name: string): void {
        this.missName = null;
        this._clearRemoteAttr();
        if (iconRegistry.has(name)) {
            this.hasVisual = true;
            this._applyClasses(name);
            this._applyStrokeWidth(name, iconRegistry.getSvg(name)!);
            return;
        }
        if (!missWarned.has(name)) {
            missWarned.add(name);
        }
        this.missName = name;
        const fallback = iconRegistry.has("default") ? "default" : null;
        if (fallback) this.hasVisual = true;
        this._applyClasses(fallback);
        this._applyInlineMask(null);
    }

    /** 远程通道（ADR-0047/0048）：规则化复用——取回升格为属性选择器规则，实例只挂短属性 */
    private _renderRemote(key: string, seq: number): void {
        this.missName = null;
        // 内存 → 持久层（命中注回内存，二次访问零网络同步渲染）
        const cached = getCachedRemoteIcon(key, iconRegistry.baseUrl);
        if (cached) {
            this.remotePending = false;
            this.hasVisual = true;
            this._applyClasses(null);
            // 规则按生效默认 sw 烘焙（全局配置层）——默认路径保持规则共享，指令级覆盖才内联
            IconDirective._promoteRemoteRule(key, iconDataUrl(`remote/${key}`, cached, this._defaultSw()));
            this._applyRemote(key, cached);
            return;
        }
        if (!this.hasVisual) this._applyClasses(null);
        this.remotePending = true;
        fetchRemoteIcon(key, iconRegistry.baseUrl).then(
            (svg) => {
                if (this.destroyed || seq !== this.seq) return;
                this.remotePending = false;
                this.hasVisual = true;
                this._applyClasses(null);
                IconDirective._promoteRemoteRule(key, iconDataUrl(`remote/${key}`, svg, this._defaultSw()));
                this._applyRemote(key, svg);
            },
            (err: unknown) => {
                if (this.destroyed || seq !== this.seq) return;
                this.remotePending = false;
                const fallback = iconRegistry.has("default") ? "default" : null;
                if (fallback) this.hasVisual = true;
                this._applyClasses(fallback);
                this._clearRemoteAttr();
                this._applyInlineMask(null);
            },
        );
    }

    /**
     * 远程实例落点：挂 `data-as-icon` 短属性（默认 sw 由属性规则承载，清内联）；
     * 指令级 sw 覆盖才内联工厂产物（与本地物种同构）。
     */
    private _applyRemote(key: string, canonicalSvg: string): void {
        this.el?.setAttribute(REMOTE_ATTR, key);
        this._applyStrokeWidth(`remote/${key}`, canonicalSvg);
    }

    /** 摘除远程载体属性（离开远程通道：切本地 / 空值 / 失败回退） */
    private _clearRemoteAttr(): void {
        this.el?.removeAttribute(REMOTE_ATTR);
    }

    /**
     * 生效 strokeWidth：与生效默认一致走规则（清内联——本地类规则 / 远程属性规则均按默认烘焙）；
     * 指令级覆盖才内联工厂产物。生效默认 = 全局配置（`AutoSpark.icons.options.strokeWidth`）?? 内置 1.25。
     */
    private _applyStrokeWidth(cacheKey: string, canonicalSvg: string): void {
        const sw = this._strokeWidth();
        this._applyInlineMask(
            sw === this._defaultSw() ? null : iconDataUrl(cacheKey, canonicalSvg, sw),
        );
    }

    /** 生效默认 sw（全局配置层，参与规则烘焙与「是否内联」的判定基准） */
    private _defaultSw(): number {
        return (
            normalizeStrokeWidth(iconRegistry.options?.strokeWidth) ?? DEFAULT_ICON_STROKE_WIDTH
        );
    }

    /** 指令级 sw（含宿主回退）> 生效默认 */
    private _strokeWidth(): number {
        return normalizeStrokeWidth(this._opt("strokeWidth")) ?? this._defaultSw();
    }

    /** 四级配置链读取：指令选项 > 宿主选项（ADR-0007 回退）> 全局默认（icons.options）> undefined（内置默认由各消费点自理） */
    private _opt(key: string): unknown {
        const v = this.getOption(key);
        if (v !== undefined) return v;
        return iconRegistry.options?.[key];
    }

    /** class 管理：恒挂基础类；摘旧名类、挂新名类（null = 仅基础类的空占位） */
    private _applyClasses(name: string | null): void {
        const el = this.el;
        if (!el) return;
        el.classList.add(ICON_BASE_CLASS);
        if (this.shownName && this.shownName !== name) el.classList.remove(this.shownName);
        if (name && name !== this.shownName) el.classList.add(name);
        this.shownName = name;
    }

    /**
     * 内联 mask-image（非默认 sw / 远程物种）；null = 清除（类规则接管或空占位）。
     * **必须包 `url("...")`**——裸 data URL 字符串是非法 CSS 图像值，真实浏览器 CSSOM
     * 静默拒绝（宽松实现会照存，测试需断言带包装形态）。
     */
    private _applyInlineMask(url: string | null): void {
        const el = this.el;
        if (!el) return;
        if (url) {
            const css = `url("${url}")`;
            el.style.setProperty("-webkit-mask-image", css);
            el.style.setProperty("mask-image", css);
        } else {
            el.style.removeProperty("-webkit-mask-image");
            el.style.removeProperty("mask-image");
        }
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
     * size 默认 1em 走基础规则、padding 默认无、color 默认 currentColor，均为显式声明才内联。
     * 修饰：badge 挂修饰类（规则常驻基础样式表，标量三形态——true / number 板 padding /
     * string 板 padding）；button 挂修饰类（载体动效，ADR-0049——有板挂 wrapper 作用于板、
     * 无板挂宿主作用于图形，载体唯一不双挂）；pointer 内联 cursor。
     * 读取走四级配置链（指令 > 宿主 > 全局 > 内置）。
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
        // padding 落点：badge 时作用于**包裹层**（图形恒 size——宿主 padding 会同步放大
        // mask 绘制区（contain 于 border box）导致图形缩放）；非 badge 照旧内联宿主。
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
        const color = this._opt("color");
        if (typeof color === "string" && color.trim() !== "") el.style.backgroundColor = color;
        else el.style.removeProperty("background-color");
        // pointer 修饰：可点击语义的手型光标（内联对称写/清）
        if (this._opt("pointer") === true) el.style.cursor = "pointer";
        else el.style.removeProperty("cursor");
    }

    /**
     * badge 包裹层挂/拆（幂等）：badge 启用时为宿主包一层同类名 wrapper（wrapper 自身
     * 做淡色圆角板——宿主 mask 裁整个元素渲染，板必须由不受 mask 影响的独立盒承载，
     * 图标子元素完整渲染不受板影响）；未启用时拆包还原。拆包用 `replaceWith` 保留宿主
     * 位置；wrapper 随子树消亡（x-if detach 等以子树为单位）。
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
