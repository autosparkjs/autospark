import { AutoSparkDirectiveBase } from "../features/directive/base";
import { isSimpleStatePath, type AutoSparkScope } from "../engine/scope";
import type { AutoSpark } from "../engine/engine";
import { injectStylesheet } from "../utils/injectStylesheet";

/**
 * x-container：响应式容器（ADR-0101）。
 *
 * Bootstrap `.container` 心智的断点容器：宿主获得 `width:100%` + **按档 max-width** +
 * 居中（`margin-inline:auto`，默认开不可关）+ gutter（CSS 变量
 * `--autospark-container-gutter`，缺省 0.75rem）的视觉契约。
 *
 * **值双态**（x-resizable 先例）：留空 = 纯视觉容器；简单状态路径 = 响应式状态源——当前档名
 * （字符串）随切换实时**单向写回**（`scope.writeThrough`，档位是测量真相、外部写不解释）。
 * 宿主无论是否绑定值均常驻 `data-breakpoint="<档名>"`（纯 CSS 子代选择器与测试的暴露面）。
 *
 * **断点档位**：mobile-forward `min-width` 区间——宽度 ≥ 阈值即命中，当前档 = 命中档中
 * 最大者；xs 是 < sm 的隐含兜底档（无阈值，写入阈值表 warn + 忽略）。默认表 Bootstrap 5
 * 对齐：阈值 sm:576 / md:768 / lg:992 / xl:1200 / xxl:1400，max-width 100% / 540 / 720 /
 * 960 / 1140 / 1320。
 *
 * **判定基准恒视口宽度**（修订记录 2026-10-11 裁剪 `.self`）：视觉约束走纯 CSS media
 * query（全局样式表一份、零 JS 布局开销），档位状态走 matchMedia 按档 mql 监听（跨越才
 * 触发）。CSS 原生 container query 亦否决（无法样式化容器自身、须加 wrapper 侵入 DOM、
 * size containment 副作用，ADR-0101 决策 4）。
 *
 * **选项两表分离**（`breakpoints` 阈值表 + `maxWidths` 按档表，整表替换不合并），
 * 三级回退：`x-container-options` / 宿主 `x-options`（getOption 链）→ 引擎
 * `options.container` → 内置缺省表。自定义表按内容哈希去重生成 scoped `<style>`
 * （CSS 自定义属性不能参数化 media query，自定义阈值无法共享全局表）。
 *
 * **事件**：档位跨越时派发 `viewport:change`（冒号命名空间家族惯例），`detail = { from, to }`，
 * **向下传播**——容器子树内声明 `@viewport:change` 的后代元素逐个收到（先下行），宿主再
 * 冒泡上行（祖先监听）；初始同步不派发——监听编译期建立，编译期派发受指令编译顺序影响
 * 不可靠，初值经写回 / `data-breakpoint` 读取。
 *
 * `.fluid` 修饰符关闭按档 max-width（恒 100% 通栏），档位判定 / data-breakpoint / 写回
 * 照常——「纯状态探针 + 无约束容器」用法。
 */

/** 档位名（xs = < sm 的隐含兜底档，无阈值） */
export type ContainerTier = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

/** 档位升序全集（判定与校验用） */
export const CONTAINER_TIERS: readonly ContainerTier[] = ["xs", "sm", "md", "lg", "xl", "xxl"];

/** 内置缺省阈值表（Bootstrap 5 对齐；xs 无阈值不入表，ADR-0101 决策 3） */
export const DEFAULT_CONTAINER_BREAKPOINTS: Record<string, number> = {
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
};

/** 内置缺省按档 max-width 表（xs 档 = 100% 无约束） */
export const DEFAULT_CONTAINER_MAX_WIDTHS: Record<string, string> = {
    xs: "100%",
    sm: "540px",
    md: "720px",
    lg: "960px",
    xl: "1140px",
    xxl: "1320px",
};

/**
 * 引擎级全局默认（`options.container`，ADR-0101 决策 5）：断点两表，被实例
 * `x-container-options` / 宿主 `x-options` 同名键**整表覆盖**（回退不合并，ADR-0007 惯例）。
 * 构造期配置语义：运行时突变不生效（options 家族纪律）。
 */
export interface ContainerGlobalOptions {
    /** 档位阈值表（number 按 px / 裸数字或 `Npx` 串；xs 无效——隐含兜底档无阈值） */
    breakpoints?: Record<string, number | string>;
    /** 按档 max-width 表（number 按 px / 任意 CSS 长度串） */
    maxWidths?: Record<string, number | string>;
}

/** 生效断点表（归一后纯数据：判定 / CSS 生成 / 哈希去重共用） */
export interface ResolvedContainerTables {
    /** 升序档位（不含 xs） */
    tiers: ContainerTier[];
    /** 与 tiers 对齐的 px 阈值 */
    thresholds: number[];
    /** 档名 → CSS max-width 值串（缺档无规则——CSS 级联语义：低档规则延续） */
    maxWidths: Record<string, string>;
    /** 是否与内置缺省表完全一致（一致则共享全局样式表，无 scoped style） */
    isDefault: boolean;
    /** 按档 media 规则文本（指纹身份——内置一致时相等；选择器为基类单类形态） */
    cssText: string;
}

/** 阈值/px 长度归一：number | 裸数字串 | `Npx` 串 → px number（x-resizable parseCssLength 同语义；rem/% 等依赖布局基准不收） */
function parsePx(raw: unknown): number | null {
    if (typeof raw === "number") return Number.isFinite(raw) && raw > 0 ? raw : null;
    if (typeof raw === "string") {
        const s = raw.trim();
        if (/^\d+(\.\d+)?px?$/.test(s)) return parseFloat(s);
    }
    return null;
}

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
    tiers: ContainerTier[],
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
    DEFAULT_CONTAINER_MAX_WIDTHS,
    "",
);

/** 字符串指纹（djb2 → base36）：自定义断点表 scoped style 去重键（styleBind hash36 同法） */
function hash36(s: string): string {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
}

/**
 * 解析生效断点表（三级回退整表替换，ADR-0101 决策 5）：
 * `x-container-options` / 宿主 `x-options`（read 链）→ `options.container` → 内置缺省表。
 * 非法项 warn + 忽略（xs 入阈值表 / 未知档名 / 非 px 阈值 / 非 CSS 宽度值）；整表无有效
 * 项回退内置缺省表 + warn。纯函数（单测直击）。
 */
export function resolveContainerTables(
    read: (key: "breakpoints" | "maxWidths") => any,
    global?: ContainerGlobalOptions,
    warn?: (msg: string) => void,
): ResolvedContainerTables {
    const pick = (
        key: "breakpoints" | "maxWidths",
        fallback: Record<string, any>,
    ): Record<string, any> => {
        for (const src of [read(key), global?.[key]]) {
            if (src != null && typeof src === "object" && !Array.isArray(src)) return src;
        }
        return fallback;
    };
    // 阈值表：档名校验（xs/未知档 warn 忽略）+ px 归一 + 升序排序
    const bpEntries: [ContainerTier, number][] = [];
    for (const [name, raw] of Object.entries(pick("breakpoints", DEFAULT_CONTAINER_BREAKPOINTS))) {
        if (name === "xs") {
            warn?.(`x-container: xs 是 < sm 的隐含兜底档（无阈值），breakpoints 中的 xs 已忽略`);
            continue;
        }
        if (!(CONTAINER_TIERS as readonly string[]).includes(name)) {
            warn?.(`x-container: 未知档位 "${name}"（合法：sm/md/lg/xl/xxl），已忽略`);
            continue;
        }
        const px = parsePx(raw);
        if (px == null) {
            warn?.(`x-container: 阈值 ${name} 值 "${String(raw)}" 无法解析为 px，已忽略`);
            continue;
        }
        bpEntries.push([name as ContainerTier, px]);
    }
    if (bpEntries.length === 0) {
        warn?.("x-container: breakpoints 无任何有效项，回退内置缺省表");
        for (const [name, px] of Object.entries(DEFAULT_CONTAINER_BREAKPOINTS)) {
            bpEntries.push([name as ContainerTier, px]);
        }
    }
    bpEntries.sort((a, b) => a[1] - b[1]);
    const tiers = bpEntries.map((e) => e[0]);
    const thresholds = bpEntries.map((e) => e[1]);
    // max-width 表：档名校验 + CSS 值归一（number 按 px）
    const maxWidths: Record<string, string> = {};
    for (const [name, raw] of Object.entries(pick("maxWidths", DEFAULT_CONTAINER_MAX_WIDTHS))) {
        if (!(CONTAINER_TIERS as readonly string[]).includes(name)) {
            warn?.(`x-container: maxWidths 未知档位 "${name}"，已忽略`);
            continue;
        }
        const css = toCssWidth(raw);
        if (css == null) {
            warn?.(`x-container: maxWidths.${name} 值 "${String(raw)}" 无法解析为 CSS 宽度，已忽略`);
            continue;
        }
        maxWidths[name] = css;
    }
    if (Object.keys(maxWidths).length === 0) {
        warn?.("x-container: maxWidths 无任何有效项，回退内置缺省表");
        Object.assign(maxWidths, DEFAULT_CONTAINER_MAX_WIDTHS);
    }
    const cssText = buildTierCss(tiers, thresholds, maxWidths, "");
    return { tiers, thresholds, maxWidths, isDefault: cssText === DEFAULT_TIER_CSS, cssText };
}

// ── 样式注入 ─────────────────────────────────────────────────────────────

/** 全局样式表 id（幂等；多 engine 共享、dispose 不移除——对齐 x-resizable 惯例） */
const CONTAINER_STYLE_ID = "autospark-container-styles";

/** .fluid 中立化规则：双类特异性压过全局单类 media 规则（max-width 恒无约束） */
const NEUTRALIZE_CSS =
    ".autospark-container.autospark-container-fluid{max-width:none;}";

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
 * x-container 指令（ADR-0101）：Compile kind（编译期装配类/样式与值绑定 + mql 订阅），
 * 非结构指令、不 ownsChildren，与 x-if / x-show / x-for 正交。
 */
export class ContainerDirective extends AutoSparkDirectiveBase {
    static override readonly priority = 0;
    static override readonly singleton = true;

    /** 类级初始化：注入容器全局样式（幂等） */
    static override initialize(_engine: AutoSpark): void {
        registerContainerStyles();
    }

    /** 生效断点表 */
    private _tables: ResolvedContainerTables | null = null;
    /** .fluid：关按档 max-width（档位判定照常） */
    private _fluid = false;
    /** 档名写回路径（简单路径才有；其余形态 warn 一次忽略——写回需要可寻址落点） */
    private _statePath: string | null = null;
    /** 当前档（null = 未定） */
    private _tier: ContainerTier | null = null;
    /** 视口模式 mql 订阅（destroy 反注册） */
    private _mqls: { mql: MediaQueryList; onChange: () => void }[] = [];
    /** 自定义表 scoped style 指纹（destroy 减引用） */
    private _styleKey: string | null = null;
    private _destroyed = false;
    /** 非简单路径 warn 一次 */
    private _warnedPath = false;

    override created(): void {
        this._watchOptionExprs();
        this._tables = resolveContainerTables(
            (key) => this.getOption(key),
            this.engine.options.container,
            (m) => this.warn(m),
        );
        this._fluid = this.getOption("fluid") === true;

        // 类装配：基础契约类 + .fluid 中立类 + 自定义表指纹类（fluid 恒无约束，不吃 media 规则）
        this.el.classList.add("autospark-container");
        if (this._fluid) this.el.classList.add("autospark-container-fluid");
        if (!this._fluid && !this._tables.isDefault) {
            this._styleKey = hash36(this._tables.cssText);
            acquireCustomStyle(
                this._styleKey,
                buildTierCss(
                    this._tables.tiers,
                    this._tables.thresholds,
                    this._tables.maxWidths,
                    `autospark-container-${this._styleKey}`,
                ),
            );
            this.el.classList.add(`autospark-container-${this._styleKey}`);
        }

        // 值双态：留空 = 纯视觉容器；非简单路径 warn 一次忽略（无读方向可降级，区别于 x-resizable）
        const raw = String(this.value ?? "").trim();
        if (raw !== "") {
            if (isSimpleStatePath(raw)) this._statePath = raw;
            else if (!this._warnedPath) {
                this._warnedPath = true;
                this.warn(
                    `x-container: 值 "${raw}" 非简单状态路径，档名写回已忽略（写回须绑定可寻址路径，ADR-0101 决策 1）`,
                );
            }
        }

        // 首值同步可立即求值（matchMedia 先于挂载可用）
        this._setupViewport();
    }

    override destroy(): void {
        this._destroyed = true;
        for (const { mql, onChange } of this._mqls) mql.removeEventListener?.("change", onChange);
        this._mqls = [];
        if (this._styleKey) {
            releaseCustomStyle(this._styleKey);
            this._styleKey = null;
        }
    }

    // ── 内部 ──────────────────────────────────────────────────────────

    /**
     * 应用档位变更：data-breakpoint + 档名写回 + viewport:change。
     * 同档不动作（档位记忆化）；**初值静默**（from = null 不派发——监听编译期建立，
     * 编译期派发受指令编译顺序影响不可靠，ADR-0101 决策 8）。
     */
    private _applyTier(tier: ContainerTier): void {
        const from = this._tier;
        if (from === tier) return;
        this._tier = tier;
        this.el.setAttribute("data-breakpoint", tier);
        if (this._statePath) {
            try {
                this.binding.writeThrough(this._statePath, tier);
            } catch (e: any) {
                this.warn(`x-container: 档名写回失败（"${this._statePath}"）: ${e?.message ?? e}`);
            }
        }
        if (from != null) {
            this._dispatchChange(from, tier);
        }
    }

    /**
     * 派发 viewport:change（**向下传播**，ADR-0101 修订记录 3）：先下后上——
     * ① **下行**：沿 scope 子树发现声明 `@viewport:change` 的后代元素，逐元素派发
     *    （不冒泡）——DOM 事件物理上只向上流，向下传播经 scope 树实现；响应视口变化的
     *    通常是容器内部组件，实际场景以向下为主；
     * ② **上行**：宿主派发冒泡（祖先 / 宿主自身监听）。
     * 每个监听元素恰好收到一次；嵌套容器各自独立派发——同刻跨档时后代监听会收到多层事件。
     */
    private _dispatchChange(from: ContainerTier, to: ContainerTier): void {
        const detail = { from, to };
        this._eachDownwardListener((el) => {
            if (el !== this.el) {
                el.dispatchEvent(new CustomEvent("viewport:change", { detail }));
            }
        });
        this.el.dispatchEvent(new CustomEvent("viewport:change", { detail, bubbles: true }));
    }

    /**
     * 沿 scope 子树收集声明 `@viewport:change` 的元素（`@` 属性编译期剥除，监听信息只在
     * scope 指令表；x-if / x-for 重建的子树 scope 随 children 增删，跨档时现走现得）。
     */
    private _eachDownwardListener(fn: (el: HTMLElement) => void): void {
        const visit = (scope: AutoSparkScope): void => {
            for (const d of scope.directives) {
                if (d.info.name === "on" && d.attr === "viewport:change") fn(d.el);
            }
            for (const child of scope.children) visit(child);
        };
        visit(this.binding);
    }

    /**
     * 视口判定：按档 mql 监听（单档 change 触发全量重读——正确处理一次跨越多档）+ 首值同步。
     * 视觉约束不经 JS（全局/自定义样式表的 media query 原生生效，零布局开销）。
     */
    private _setupViewport(): void {
        if (typeof matchMedia !== "function") {
            this.warn("x-container: 当前环境无 matchMedia，档位状态不可用（视觉约束仍经 CSS 生效）");
            return;
        }
        const entries = this._tables!.tiers.map((tier, i) => ({
            tier,
            mql: matchMedia(`(min-width:${this._tables!.thresholds[i]}px)`),
        }));
        const recompute = () => {
            let tier: ContainerTier = "xs";
            for (const e of entries) {
                if (e.mql.matches) tier = e.tier;
            }
            this._applyTier(tier);
        };
        for (const e of entries) {
            const onChange = () => recompute();
            e.mql.addEventListener?.("change", onChange);
            this._mqls.push({ mql: e.mql, onChange });
        }
        recompute();
    }
}
