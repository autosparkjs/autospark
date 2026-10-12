import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { AutoSpark } from "../engine/engine";
import { injectStylesheet } from "../utils/injectStylesheet";
import { resolveViewportBreakpoints } from "../features/viewport/manager";
import {
    DEFAULT_VIEWPORT_MAX_WIDTHS,
    VIEWPORT_TIERS,
    type ViewportTier,
} from "../features/viewport/types";

/**
 * x-container：响应式容器（ADR-0101 立，ADR-0105 重写）。
 *
 * Bootstrap `.container` 心智的断点容器：宿主获得 `width:100%` + **按档 max-width** +
 * 居中（`margin-inline:auto`，默认开不可关）+ gutter（CSS 变量
 * `--autospark-container-gutter`，缺省 0.75rem）的视觉契约。
 *
 * **档位真相全局唯一**（ADR-0105）：断点判定收归全局 viewport 特性（`state.$.viewport`，
 * ViewportManager 监测），本指令**不做任何断点判定**——仅订阅 `$.viewport` 切换宿主常驻的
 * `data-breakpoint="<档名>"`（纯 CSS 子代选择器与测试的 DOM 暴露面）。值恒为纯视觉容器：
 * 无值写回、无 viewport:change——档位联动直接订阅 `$.viewport` 表达式（x-show / 插值 /
 * watch / x-effect 全通；域内 `x-data="{ $: ... }"` 会遮蔽全局读，保留键约定）。
 *
 * **视觉约束走纯 CSS media query**（零 JS 布局开销，ADR-0101 决策 4 沿用）：engine 生效
 * 阈值表（`options.viewport.breakpoints`，与 ViewportManager 同源）× 实例生效 maxWidths
 * 按内容指纹生成 media 规则——等值内置表时共享全局样式表，否则双类指纹 scoped `<style>`
 * （CSS 自定义属性不能参数化 media query，自定义表无法共享全局表）。
 *
 * **maxWidths 回退链**（整表替换不合并，ADR-0007 惯例）：实例 `x-container-options` /
 * 宿主 `x-options` → `options.viewport.maxWidths` → 内置缺省表。`.fluid` 修饰符关闭按档
 * max-width（恒 100% 通栏），`data-breakpoint` 照常——「纯状态探针 + 无约束容器」用法。
 */

/** max-width 值归一：number → `Npx`；非空字符串原样（CSS 长度全形态放行——进 CSS 不经数值比较） */
function toCssWidth(raw: unknown): string | null {
    if (typeof raw === "number") return Number.isFinite(raw) && raw > 0 ? `${raw}px` : null;
    if (typeof raw === "string" && raw.trim() !== "") return raw.trim();
    return null;
}

/**
 * 生成按档 media 规则（升序发射——同特异性下大档规则后发胜出；缺 maxWidth 的档不发规则）。
 *
 * @param scopedClass 空 → 目标基类（全局缺省表单类形态）；非空 → 双类选择器
 *                    （`.基类.指纹类`，特异性压过全局单类 media 规则，自定义表恒胜）
 */
function buildTierCss(
    tiers: ViewportTier[],
    thresholds: number[],
    maxWidths: Record<string, string>,
    scopedClass: string,
): string {
    const sel = scopedClass ? `.autospark-container.${scopedClass}` : ".autospark-container";
    let css = "";
    for (let i = 0; i < tiers.length; i++) {
        const w = maxWidths[tiers[i]];
        if (w == null) continue;
        css += `@media (min-width:${thresholds[i]}px){${sel}{max-width:${w};}}`;
    }
    return css;
}

/** 内置缺省表的规则文本（身份比较基准 + 全局样式表内容源） */
const DEFAULT_TIER_CSS = buildTierCss(
    ["sm", "md", "lg", "xl", "xxl"],
    [576, 768, 992, 1200, 1400],
    DEFAULT_VIEWPORT_MAX_WIDTHS,
    "",
);

/** 字符串指纹（djb2 → base36）：自定义表 scoped style 去重键（styleBind hash36 同法） */
function hash36(s: string): string {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
}

/**
 * 解析实例生效 maxWidths（ADR-0105 决策 5，回退不合并）：实例 `x-container-options` /
 * 宿主 `x-options`（read 链）→ `options.viewport.maxWidths` → 内置缺省表。非 CSS 宽度
 * 值 warn + 忽略；整表无有效项回退内置缺省表 + warn。纯函数（单测直击）。
 */
export function resolveContainerMaxWidths(
    read: (key: "maxWidths") => any,
    global?: Record<string, number | string>,
    warn?: (msg: string) => void,
): Record<string, string> {
    let source: Record<string, any> = DEFAULT_VIEWPORT_MAX_WIDTHS;
    for (const src of [read("maxWidths"), global]) {
        if (src != null && typeof src === "object" && !Array.isArray(src)) {
            source = src;
            break;
        }
    }
    const maxWidths: Record<string, string> = {};
    for (const [name, raw] of Object.entries(source)) {
        if (!(VIEWPORT_TIERS as readonly string[]).includes(name)) {
            warn?.(`x-container: maxWidths 未知档位 "${name}"，已忽略`);
            continue;
        }
        const css = toCssWidth(raw);
        if (css == null) {
            warn?.(
                `x-container: maxWidths.${name} 值 "${String(raw)}" 无法解析为 CSS 宽度，已忽略`,
            );
            continue;
        }
        maxWidths[name] = css;
    }
    if (Object.keys(maxWidths).length === 0) {
        warn?.("x-container: maxWidths 无任何有效项，回退内置缺省表");
        Object.assign(maxWidths, DEFAULT_VIEWPORT_MAX_WIDTHS);
    }
    return maxWidths;
}

// ── 样式注入 ─────────────────────────────────────────────────────────────

/** 全局样式表 id（幂等；多 engine 共享、dispose 不移除——对齐 x-resizable 惯例） */
const CONTAINER_STYLE_ID = "autospark-container-styles";

/** .fluid 中立化规则：双类特异性压过全局单类 media 规则（max-width 恒无约束） */
const NEUTRALIZE_CSS = ".autospark-container.autospark-container-fluid{max-width:none;}";

/** 注入容器全局样式（幂等）：基础契约 + 内置缺省表按档规则 + .fluid 中立化 */
export function registerContainerStyles(): void {
    injectStylesheet(
        ".autospark-container{width:100%;margin-inline:auto;padding-inline:var(--autospark-container-gutter,0.75rem);}" +
            DEFAULT_TIER_CSS +
            NEUTRALIZE_CSS,
        { id: CONTAINER_STYLE_ID },
    );
}

/** 自定义表 scoped style 注册表：指纹 → 共享 <style> + 引用计数（同表多实例共享一份） */
const CUSTOM_STYLES = new Map<string, { el: HTMLStyleElement; count: number }>();

function acquireCustomStyle(key: string, css: string): void {
    let rec = CUSTOM_STYLES.get(key);
    if (!rec) {
        const el = injectStylesheet(css, { id: `autospark-container-style-${key}` });
        if (!el) return; // SSR 无 document
        rec = { el, count: 0 };
        CUSTOM_STYLES.set(key, rec);
    }
    rec.count++;
}

function releaseCustomStyle(key: string): void {
    const rec = CUSTOM_STYLES.get(key);
    if (!rec) return;
    if (--rec.count <= 0) {
        rec.el.remove();
        CUSTOM_STYLES.delete(key);
    }
}

/**
 * x-container 指令（ADR-0101 立 / ADR-0105 重写）：Compile kind、singleton、priority 0，
 * 非结构指令、不 ownsChildren，与 x-if / x-show / x-for 正交。档位真相全局唯一
 * （`$.viewport`），本指令只装配视觉契约与消费档位。
 */
export class ContainerDirective extends AutoSparkDirectiveBase {
    static override readonly priority = 0;
    static override readonly singleton = true;

    /** 类级初始化：注入容器全局样式（幂等） */
    static override initialize(_engine: AutoSpark): void {
        registerContainerStyles();
    }

    /** 实例生效 max-width 表（回退链归一产物） */
    private _maxWidths: Record<string, string> = {};
    /** .fluid：关按档 max-width（档位通道照常） */
    private _fluid = false;
    /** 当前档（null = 未定——首值必写，此后同档短路） */
    private _tier: ViewportTier | null = null;
    /** 自定义表 scoped style 指纹（destroy 减引用） */
    private _styleKey: string | null = null;

    override created(): void {
        this._watchOptionExprs();
        this._maxWidths = resolveContainerMaxWidths(
            (key) => this.getOption(key),
            this.engine.options.viewport?.maxWidths,
            (m) => this.warn(m),
        );
        this._fluid = this.getOption("fluid") === true;

        // 类装配：基础契约类 + .fluid 中立类 + 自定义表指纹类（fluid 恒无约束，不吃 media 规则）
        this.el.classList.add("autospark-container");
        if (this._fluid) this.el.classList.add("autospark-container-fluid");
        if (!this._fluid) {
            // engine 生效阈值表（与 ViewportManager 同源）× 实例 maxWidths → 指纹身份；
            // 等值内置表时全局样式已覆盖，无需 scoped
            const tables = resolveViewportBreakpoints(this.engine.options.viewport?.breakpoints);
            const cssText = buildTierCss(tables.tiers, tables.thresholds, this._maxWidths, "");
            if (cssText !== DEFAULT_TIER_CSS) {
                this._styleKey = hash36(cssText);
                acquireCustomStyle(
                    this._styleKey,
                    buildTierCss(
                        tables.tiers,
                        tables.thresholds,
                        this._maxWidths,
                        `autospark-container-${this._styleKey}`,
                    ),
                );
                this.el.classList.add(`autospark-container-${this._styleKey}`);
            }
        }

        // 档位消费（ADR-0105）：订阅全局 $.viewport（测量真相，单向读）。初值即时同步
        // （manager 构造期已写入，首渲染无空档）；非档名值（用户违约写入 $）忽略。
        const isTier = (v: unknown): v is ViewportTier =>
            typeof v === "string" && (VIEWPORT_TIERS as readonly string[]).includes(v);
        this.binding.watch("$.viewport", ({ value }) => {
            if (isTier(value)) this._applyTier(value);
        });
        const initial = this.binding.read("$.viewport");
        if (isTier(initial)) this._applyTier(initial);
    }

    override destroy(): void {
        if (this._styleKey) {
            releaseCustomStyle(this._styleKey);
            this._styleKey = null;
        }
    }

    // ── 内部 ──────────────────────────────────────────────────────────

    /** 应用档位变更：data-breakpoint（同档不动作——档位记忆化；初值 from null 必写）。 */
    private _applyTier(tier: ViewportTier): void {
        if (this._tier === tier) return;
        this._tier = tier;
        this.el.setAttribute("data-breakpoint", tier);
    }
}
