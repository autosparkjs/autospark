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
 * 基础 `.as-icon` 规则（含 `--as-icon-sw` 描边宽度变量 + `--auto-icon-size` 令牌默认）+
 * shape / button 修饰规则（ADR-0135）。无每图标规则、无规则烘焙（symbol 机制下渲染走
 * `<use>`，零样式表登记）。
 */
import { injectSymbol, normalizeSvgSpec, removeSymbol } from "./symbol";
import { injectStylesheet } from "../../utils/injectStylesheet";

/** 图标样式表 id（document 级共享） */
const ICON_STYLE_ID = "autospark-icons";
/** 全局 symbol id 前缀（`as-{name}`；`as-` 为引擎保留前缀，页面手写 svg id 避让） */
export const GLOBAL_SYMBOL_PREFIX = "as-";
/** 基础类名（保留名，禁作图标名） */
export const ICON_BASE_CLASS = "as-icon";
/** circle 底板修饰类名（保留名——`shape:"circle"` / `.circle` 修饰符挂类承载，ADR-0135） */
export const ICON_CIRCLE_CLASS = "as-icon-circle";
/** radius 底板修饰类名（保留名——`shape:"radius"` / `.radius` 修饰符挂类承载，ADR-0135） */
export const ICON_RADIUS_CLASS = "as-icon-radius";
/** button 修饰类名（保留名——`button` 选项挂类承载，规则常驻基础样式表，ADR-0049） */
export const ICON_BUTTON_CLASS = "as-icon-button";
/** 保留名集合（ADR-0046 决策 10 沿用） */
const RESERVED_NAMES = new Set([
    ICON_BASE_CLASS,
    ICON_CIRCLE_CLASS,
    ICON_RADIUS_CLASS,
    ICON_BUTTON_CLASS,
]);

export type IconChangeAction = "add" | "delete" | "options";
export type IconChangeListener = (name: string, action: IconChangeAction) => void;

/** 图标渲染选项（全局默认配置 `AutoSpark.icons.options` 的形态） */
export interface IconOptions {
    strokeWidth?: number | string;
    size?: number | string;
    color?: string;
    padding?: number | string;
    /**
     * 修饰：图标底板形态（ADR-0135）——`none`（≡ 未声明，无背景）/ `circle`（正圆）/
     * `radius`（主题圆角 `var(--auto-border-radius,4px)`）；修饰符快捷 `.circle` / `.radius`。
     * 板距走「显式 padding 选项 > `var(--auto-padding,0.3em)`」（仅启用态，无板即无板距）。
     */
    shape?: "none" | "circle" | "radius";
    /** 修饰：图标按钮——hover/press 交互动效（载体动效型，隐含 pointer，ADR-0049） */
    button?: boolean;
    /** 修饰：手型光标（`cursor: pointer`，可点击语义） */
    pointer?: boolean;
    /**
     * 图标归一化总开关（ADR-0130）：`false` 关闭全部风格对齐（四件套补齐/颜色规约/网格
     * 补偿）；默认开启。逐图标逃逸走 svg 根的 `data-raw` 标志（不在此配置）。
     */
    normalize?: boolean;
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
    /** name → 网格宽（ADR-0130 渲染期描边补偿用；声明与产物分离——原始串不带此派生值） */
    private grids = new Map<string, number | null>();
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
        const spec = normalizeSvgSpec(svg, {
            normalize: this._options.normalize !== false,
            name,
        });
        if (!spec) {
            warn(`图标 "${name}" 的 SVG 数据无效（无法解析 root 标签），已拒绝注册`);
            return this;
        }
        this.svgs.set(name, svg);
        this.grids.set(name, spec.grid ?? null);
        super.add(name);
        injectSymbol(GLOBAL_SYMBOL_PREFIX + name, spec);
        this.emitChange(name, "add");
        return this;
    }

    /** 移除图标（Set 契约：不存在的名称静默返回 false）；摘除 symbol，使用中实例经变更通知回退默认图标 */
    override delete(name: string): boolean {
        if (typeof name !== "string" || !super.delete(name)) return false;
        this.svgs.delete(name);
        this.grids.delete(name);
        removeSymbol(GLOBAL_SYMBOL_PREFIX + name);
        this.emitChange(name, "delete");
        return true;
    }

    /** 取原始 svg 串（声明入参原样；symbol 是渲染产物）；不存在返回 undefined */
    getSvg(name: string): string | undefined {
        return this.svgs.get(name);
    }

    /** 取图标网格宽（ADR-0130 渲染期描边补偿用）；未注册返回 undefined，无补偿语义为 null */
    getGrid(name: string): number | null | undefined {
        return this.grids.get(name);
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
 * 基础 .as-icon 规则：默认方寸走 `--auto-icon-size` theme 令牌 var() 承载（无 theme 回落
 * 1em；祖先 `data-size` 档位覆盖令牌即自动生效，ADR-0135——显式 size 声明才 JS 内联压倒）
 * + `--as-icon-sw` 描边宽度变量（生效宽度四级链算出，非默认才内联变量覆盖——CSS
 * stroke-width 继承直达 use shadow 内容，收集期已剥离全部 stroke-width 故覆盖永远可靠）。
 * `> svg` 子节点撑满宿主（use 渲染载体）。
 * 排版免疫（显式 width/height 已天然免疫 grid/flex 的 stretch——其只作用于 auto 尺寸）：
 * - `box-sizing:content-box`：免疫全局 `*{border-box}` reset——padding 语义恒定为
 *   「图形区（size）之外加内边距」，总占位 = size + 2×padding；
 * - `flex:none`：flex 容器内不伸不缩——flex-shrink 默认 1 且空内容 min-width:auto=0。
 */
const BASE_RULE =
    `.${ICON_BASE_CLASS}{display:inline-block;box-sizing:content-box;flex:none;aspect-ratio:1;` +
    `width:var(--auto-icon-size,1em);height:var(--auto-icon-size,1em);vertical-align:-.125em;` +
    `stroke-width:var(--as-icon-sw,${DEFAULT_ICON_STROKE_WIDTH})}` +
    `.${ICON_BASE_CLASS}>svg{width:100%;height:100%;display:block}`;

/**
 * shape 底板修饰规则（`shape` 选项，常驻基础样式表，ADR-0135）：两形态 wrapper 公共板
 * （淡色背景 + 板距 `--auto-padding` 令牌 var 默认）+ 各自圆角（circle 正圆 50% 形态固有值、
 * radius 主题圆角令牌）。板色浓度经 `--as-icon-mix` 变量：默认 5% currentColor 随宿主文字色
 * 级联；指定 `color` 选项时指令在 wrapper 内联指定色 + 8% 浓度（浓板联动，决策三）。
 * 排版免疫与宿主同构（flex:none + height:fit-content 防 stretch + 比例保险）。
 */
const SHAPE_COMMON_RULE =
    `.${ICON_CIRCLE_CLASS},.${ICON_RADIUS_CLASS}{display:inline-flex;flex:none;aspect-ratio:1;` +
    `height:fit-content;padding:var(--auto-padding,0.3em);` +
    "background:color-mix(in srgb,currentColor var(--as-icon-mix,5%),transparent)}";
const SHAPE_CIRCLE_RULE = `.${ICON_CIRCLE_CLASS}{border-radius:50%}`;
const SHAPE_RADIUS_RULE = `.${ICON_RADIUS_CLASS}{border-radius:var(--auto-border-radius,4px)}`;

/**
 * button 修饰规则（`button` 选项，常驻基础样式表，ADR-0049 载体动效型）：hover/press 纯
 * CSS 交互态，动效作用于既有视觉载体（无底板 = 图形 brightness 加深 + press 缩放；
 * shape 底板 = 板色三梯度加深 + wrapper 整体缩放），pointer 隐含。自定义走同名 CSS 覆盖。
 * 板梯度经 `calc(基准 + 梯度)` 单公式自适应浓度基准（默认态 5→10→15、浓板态 8→13→18，
 * ADR-0135 决策三——不为浓板特调第二套值）。
 */
const BUTTON_HOST_RULE =
    `.${ICON_BASE_CLASS}.${ICON_BUTTON_CLASS}{transition:filter .15s ease,transform .15s ease;cursor:pointer}` +
    `.${ICON_BASE_CLASS}.${ICON_BUTTON_CLASS}:hover{filter:brightness(.75)}` +
    `.${ICON_BASE_CLASS}.${ICON_BUTTON_CLASS}:active{transform:scale(.9)}`;
const BUTTON_SHAPE_RULE =
    `.${ICON_CIRCLE_CLASS}.${ICON_BUTTON_CLASS},.${ICON_RADIUS_CLASS}.${ICON_BUTTON_CLASS}` +
    "{transition:background .15s ease,transform .15s ease;cursor:pointer}" +
    `.${ICON_CIRCLE_CLASS}.${ICON_BUTTON_CLASS}:hover,.${ICON_RADIUS_CLASS}.${ICON_BUTTON_CLASS}:hover` +
    "{background:color-mix(in srgb,currentColor calc(var(--as-icon-mix,5%) + 5%),transparent)}" +
    `.${ICON_CIRCLE_CLASS}.${ICON_BUTTON_CLASS}:active,.${ICON_RADIUS_CLASS}.${ICON_BUTTON_CLASS}:active` +
    "{background:color-mix(in srgb,currentColor calc(var(--as-icon-mix,5%) + 10%),transparent);" +
    "transform:scale(.94)}";

/** 惰性建表（幂等；SSR 无 document 守卫）。内容为静态常量，建表后不再变更。 */
export function refreshIconStyle(): void {
    // 缓存表已连文档即免重写（内容是静态常量，重复覆写徒增样式重算）
    if (iconStyleEl && iconStyleEl.isConnected) return;
    iconStyleEl =
        injectStylesheet(
            () =>
                [
                    BASE_RULE,
                    SHAPE_COMMON_RULE,
                    SHAPE_CIRCLE_RULE,
                    SHAPE_RADIUS_RULE,
                    BUTTON_HOST_RULE,
                    BUTTON_SHAPE_RULE,
                ].join("\n"),
            { id: ICON_STYLE_ID, mode: "replace" },
        ) ?? null;
}

/** 全局图标注册表单例（`AutoSpark.icons` 静态暴露同一实例） */
export const iconRegistry = new IconRegistry();

// 内置图标数据自本文件出仓至顶层 src/icons.ts（ADR-0093 决策 6——纯数据面，
// 加图标只改数据文件）；此处仅保留注册动作（机制）。
import { SVG_BEGIN, SVG_END, icon_svgdatas } from "../../icons";

// 内置默认图标（ADR-0046 决策 8 沿用）：未命中（未声明或已删除）的替换渲染——「缺图不破相」。
// 以条目 default 驻注册表：可被用户同名覆盖自定义；delete("default") 后未命中退回空占位。
icon_svgdatas.forEach(([name, svg]) => {
    iconRegistry.add(name, `${SVG_BEGIN}${svg}${SVG_END}`);
});








  