/**
 * 全局图标注册表（ADR-0046 决策 2/8/10 → ADR-0058 决策 7 收窄）。
 *
 * `IconRegistry extends Set`：`AutoSpark.icons` 静态暴露的 document 级单例，多 engine 共享
 * ——图标域的**全局兜底层**（scope 链无命中时 x-icon 落到本表）。遍历产出**名称字符串**
 * （SVG 数据不外露）；`add(name, svg)` 双参注册（内部注入全局 symbol `as-{name}`，同名
 * 静默覆盖——ADR-0058 决策 12）；移除仅 `delete`（同步摘除 symbol）。
 *
 * API 面（ADR-0058）：保留 add / delete / 遍历 / `onChange` 变更通知（miss 唤醒依赖）/
 * `options` 全局默认配置；**删除** baseUrl / persist / prefetch / 并发限流（随 per-icon
 * 远程物种移除）。`engine.destroy()` 不清理本表与 sprite（document 级资产纪律）。
 *
 * 变更总线（ADR-0058 决策 11）：除本表 add/delete/options 外，scope 局部 symbol 注入与
 * 远程到达/失败也经 `emitChange` 广播——x-icon 待定/未命中实例按名唤醒重渲染的统一出口。
 *
 * 样式下发：`<style id="autospark-icons">` 惰性建表（SSR 守卫），内容为**静态常量**——
 * 基础 `.as-icon` 规则（含 `--as-icon-sw` 描边宽度变量）+ badge / button 修饰规则。
 * 无每图标规则、无规则烘焙（symbol 机制下渲染走 `<use>`，零样式表登记）。
 */
import { injectSymbol, normalizeSvgSpec, removeSymbol } from "./symbol";

/** 图标样式表 id（document 级共享） */
const ICON_STYLE_ID = "autospark-icons";
/** 全局 symbol id 前缀（`as-{name}`；`as-` 为引擎保留前缀，页面手写 svg id 避让） */
export const GLOBAL_SYMBOL_PREFIX = "as-";
/** 基础类名（保留名，禁作图标名） */
export const ICON_BASE_CLASS = "as-icon";
/** badge 修饰类名（保留名——`badge` 选项挂类承载，规则常驻基础样式表） */
export const ICON_BADGE_CLASS = "as-icon-badge";
/** button 修饰类名（保留名——`button` 选项挂类承载，规则常驻基础样式表，ADR-0049） */
export const ICON_BUTTON_CLASS = "as-icon-button";
/** 保留名集合（ADR-0046 决策 10 沿用） */
const RESERVED_NAMES = new Set([ICON_BASE_CLASS, ICON_BADGE_CLASS, ICON_BUTTON_CLASS]);

export type IconChangeAction = "add" | "delete" | "options";
export type IconChangeListener = (name: string, action: IconChangeAction) => void;

/** 图标渲染选项（全局默认配置 `AutoSpark.icons.options` 的形态） */
export interface IconOptions {
    strokeWidth?: number | string;
    size?: number | string;
    color?: string;
    padding?: number | string;
    /**
     * 修饰：图标底板——圆角矩形背景（包裹层通道）。标量三形态（形态即启用）：true 开关
     * （板 padding 走「显式 padding 选项 > 默认 0.3em」）、number 板 padding（→ px，须 ≥ 0）、
     * string 板 padding（CSS 值直传，空串按 true）。
     */
    badge?: boolean | number | string;
    /** 修饰：图标按钮——hover/press 交互动效（载体动效型，隐含 pointer，ADR-0049） */
    button?: boolean;
    /** 修饰：手型光标（`cursor: pointer`，可点击语义） */
    pointer?: boolean;
}

/** 默认描边宽度（`.as-icon` 基础规则 `--as-icon-sw` 变量的兜底值，ADR-0058 决策 6） */
export const DEFAULT_ICON_STROKE_WIDTH = 1.25;

/** 本地图标名约束（CSS ident；symbol id 体系沿用——收紧无成本且天然挡住旧 `集/名` 值形误用） */
export const ICON_NAME_RE = /^[A-Za-z_-][A-Za-z0-9_-]*$/;

/** 图标名校验：CSS ident + 非保留名（声明侧与注册表共用） */
export function isValidIconName(name: string): boolean {
    return typeof name === "string" && ICON_NAME_RE.test(name) && !RESERVED_NAMES.has(name);
}

/** strokeWidth 值归一化：合法正数返回数值，否则 null（由调用方决定回退到哪层默认） */
export function normalizeStrokeWidth(v: unknown): number | null {
    const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
}

function warn(msg: string): void {
    console.warn(`[autospark/icons] ${msg}`);
}

export class IconRegistry extends Set<string> {
    private _options: IconOptions = {};
    /**
     * 全局图标默认配置（配置链第三级：指令选项 > 宿主选项 > 本配置 > 内置默认）。
     * **整体赋值**（`icons.options = {...}`）广播 `options` 变更重渲染已渲染实例（描边宽度
     * 经 `--as-icon-sw` 变量即时换挡）；深修改不广播，仅影响后续渲染——主题切换请整体赋值。
     */
    get options(): IconOptions {
        return this._options;
    }
    set options(v: IconOptions) {
        this._options = v && typeof v === "object" ? v : {};
        for (const fn of this.listeners) fn("", "options");
    }

    /** name → 原始 svg 串（内部存储，getSvg 外露） */
    private svgs = new Map<string, string>();
    /** 变更监听器 */
    private listeners = new Set<IconChangeListener>();

    /**
     * 注册图标（扩展 Set 契约的双参形态）：归一化 → 注入全局 symbol `as-{name}`。
     * 校验失败（非法名/保留名/无 svg）warn + 拒绝；**同名静默覆盖**（ADR-0058 决策 12——
     * 模板克隆幂等重收集不再刷屏）。
     */
    override add(name: string, svg: string): this {
        if (!isValidIconName(name)) {
            warn(
                `图标名 "${name}" 非法（须为 CSS ident：[A-Za-z0-9_-] 且非数字开头）或为保留名（${ICON_BASE_CLASS} 等），已拒绝注册`,
            );
            return this;
        }
        if (typeof svg !== "string" || !svg.includes("<svg")) {
            warn(`图标 "${name}" 的 SVG 数据无效（未找到 <svg>），已拒绝注册`);
            return this;
        }
        const spec = normalizeSvgSpec(svg);
        if (!spec) {
            warn(`图标 "${name}" 的 SVG 数据无效（无法解析 root 标签），已拒绝注册`);
            return this;
        }
        this.svgs.set(name, svg);
        super.add(name);
        injectSymbol(GLOBAL_SYMBOL_PREFIX + name, spec);
        this.emitChange(name, "add");
        return this;
    }

    /** 移除图标（Set 契约：不存在的名称静默返回 false）；摘除 symbol，使用中实例经变更通知回退默认图标 */
    override delete(name: string): boolean {
        if (typeof name !== "string" || !super.delete(name)) return false;
        this.svgs.delete(name);
        removeSymbol(GLOBAL_SYMBOL_PREFIX + name);
        this.emitChange(name, "delete");
        return true;
    }

    /** 取原始 svg 串（声明入参原样；symbol 是渲染产物）；不存在返回 undefined */
    getSvg(name: string): string | undefined {
        return this.svgs.get(name);
    }

    /** 订阅图标域变更（全局 add/delete/options + 局部 symbol 注入/远程到达）；返回退订函数 */
    onChange(listener: IconChangeListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * 图标域变更总线出口（ADR-0058 决策 11）：本表 add/delete 与 options setter 之外，
     * **scope 局部 symbol 注入与远程到达/失败**也经此广播——x-icon 按名唤醒的统一通道。
     */
    emitChange(name: string, action: IconChangeAction): void {
        for (const fn of this.listeners) fn(name, action);
    }
}

// ── 样式下发（静态常量规则，ADR-0058 决策 6）──────────────────────────────────

let iconStyleEl: HTMLStyleElement | null = null;

/**
 * 基础 .as-icon 规则：默认 1em 方寸 + `--as-icon-sw` 描边宽度变量（生效宽度四级链算出，
 * 非默认才内联变量覆盖——CSS stroke-width 继承直达 use shadow 内容，收集期已剥离全部
 * stroke-width 故覆盖永远可靠）。`> svg` 子节点撑满宿主（use 渲染载体）。
 * 排版免疫（显式 width/height 已天然免疫 grid/flex 的 stretch——其只作用于 auto 尺寸）：
 * - `box-sizing:content-box`：免疫全局 `*{border-box}` reset——padding 语义恒定为
 *   「图形区（size）之外加内边距」，总占位 = size + 2×padding；
 * - `flex:none`：flex 容器内不伸不缩——flex-shrink 默认 1 且空内容 min-width:auto=0。
 */
const BASE_RULE =
    `.${ICON_BASE_CLASS}{display:inline-block;box-sizing:content-box;flex:none;aspect-ratio:1;` +
    `width:1em;height:1em;vertical-align:-.125em;stroke-width:var(--as-icon-sw,${DEFAULT_ICON_STROKE_WIDTH})}` +
    `.${ICON_BASE_CLASS}>svg{width:100%;height:100%;display:block}`;

/**
 * badge 修饰规则（`badge` 选项，常驻基础样式表）：圆角矩形背景板，包裹层通道（指令为
 * badge 实例包裹一层同类名 wrapper，wrapper 自身做板）。板色 `color-mix(currentColor 5%)`
 * 跟随文字色级联；排版免疫与宿主同构（flex:none + height:fit-content 防 stretch + 比例保险）。
 */
const BADGE_RULE =
    `.${ICON_BADGE_CLASS}{display:inline-flex;flex:none;aspect-ratio:1;height:fit-content;border-radius:25%;` +
    "background:color-mix(in srgb,currentColor 5%,transparent)}";

/**
 * button 修饰规则（`button` 选项，常驻基础样式表，ADR-0049 载体动效型）：hover/press 纯
 * CSS 交互态，动效作用于既有视觉载体（非 badge = 图形 brightness 加深 + press 缩放；
 * badge = 板色三梯度加深 + wrapper 整体缩放），pointer 隐含。自定义走同名 CSS 覆盖。
 */
const BUTTON_HOST_RULE =
    `.${ICON_BASE_CLASS}.${ICON_BUTTON_CLASS}{transition:filter .15s ease,transform .15s ease;cursor:pointer}` +
    `.${ICON_BASE_CLASS}.${ICON_BUTTON_CLASS}:hover{filter:brightness(.75)}` +
    `.${ICON_BASE_CLASS}.${ICON_BUTTON_CLASS}:active{transform:scale(.9)}`;
const BUTTON_BADGE_RULE =
    `.${ICON_BADGE_CLASS}.${ICON_BUTTON_CLASS}{transition:background .15s ease,transform .15s ease;cursor:pointer}` +
    `.${ICON_BADGE_CLASS}.${ICON_BUTTON_CLASS}:hover{background:color-mix(in srgb,currentColor 10%,transparent)}` +
    `.${ICON_BADGE_CLASS}.${ICON_BUTTON_CLASS}:active{background:color-mix(in srgb,currentColor 15%,transparent);transform:scale(.94)}`;

/** 惰性建表（幂等；SSR 无 document 守卫）。内容为静态常量，建表后不再变更。 */
export function refreshIconStyle(): void {
    if (typeof document === "undefined" || !document.head) return;
    if (iconStyleEl && iconStyleEl.isConnected) return;
    iconStyleEl = (document.getElementById(ICON_STYLE_ID) as HTMLStyleElement | null) ?? null;
    if (!iconStyleEl) {
        iconStyleEl = document.createElement("style");
        iconStyleEl.id = ICON_STYLE_ID;
        document.head.appendChild(iconStyleEl);
    }
    iconStyleEl.textContent = [BASE_RULE, BADGE_RULE, BUTTON_HOST_RULE, BUTTON_BADGE_RULE].join("\n");
}

/** 全局图标注册表单例（`AutoSpark.icons` 静态暴露同一实例） */
export const iconRegistry = new IconRegistry();

/** 内置图标 SVG 片段模板：统一 stroke 型开标签（width/height/class 不写，symbol 归一化承载） */
const SVG_BEGIN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"  stroke-linecap="round" stroke-linejoin="round">`;
const SVG_END = `</svg>`;

// 内置默认图标（ADR-0046 决策 8 沿用）：未命中（未声明或已删除）的替换渲染——「缺图不破相」。
// 以条目 default 驻注册表：可被用户同名覆盖自定义；delete("default") 后未命中退回空占位。
// 另有内置常用图标 no / yes / warn / error / arrow / info / file，同纪律（可同名覆盖、可 delete）。
const icon_svgdatas=[
    ["default",`<rect x="5" y="5" width="14" height="14" rx="3"/>`],
    ["no",`<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`],
    ["yes",`<path d="M20 6 9 17l-5-5"/>`],
    ["warn",`<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>`],
    ["error",`<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>`],
    ["arrow",`<path d="m9 18 6-6-6-6"/>`],
    ["info",`<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>`],
    ["file",`<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/>`],
    ["refresh",`<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>`],
    ["success",`<circle cx="12" cy="12" r="10"/><path d="m16 9-5.5 5.5L8 12"/>`],
    ["copy",`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>`],
    ["external",`<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>`],
    ["unchecked",`<rect width="18" height="18" x="3" y="3" rx="2"/>`],
    ["checked",`<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m16 9-5.5 5.5L8 12"/>`],
    ["semi-checked",`<rect width="18" height="18" x="3" y="3" rx="2" /><rect x="8" y="8" width="8" height="8" rx="1" fill="currentColor" stroke="none" />`],
    ["loading",`<g><animateTransform  attributeName="transform"  attributeType="XML"  type="rotate" from="0 12 12" to="360 12 12" dur="1.5s" repeatCount="indefinite" 
        />
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
        <path d="M21 3v5h-5"/>
      </g>`],
    ["unknown",`<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M12 17h.01"/><path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3"/>`],
    ["folder-open",`<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>`],
    ["folder",`<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>`],
    ["file-error",`<path d="M11 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v5"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="m15 17 5 5"/><path d="m20 17-5 5"/>`]
] as const 


icon_svgdatas.forEach(([name,svg])=>{
    iconRegistry.add(name,`${SVG_BEGIN}${svg}${SVG_END}`)
})









  