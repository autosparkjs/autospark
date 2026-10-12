import { META_KEY, META_MARK } from "../../consts";
import type { AutoSpark } from "../../engine/engine";
import {
    DEFAULT_VIEWPORT_BREAKPOINTS,
    VIEWPORT_TIERS,
    type ResolvedViewportBreakpoints,
    type ViewportTier,
} from "./types";

/**
 * viewport 全局视口特性（ADR-0105）。
 *
 * 档位判定是全局事实：每 engine 一例 ViewportManager，按档 mql 监听视口宽度，当前档
 * （命中档中最大者，xs 为 < sm 的隐含兜底档）作为全局响应式真相写入 `state.$.viewport`
 * （`$` 元状态容器首个居民），并在 engine 根元素常驻 `data-viewport="<档名>"` 作 CSS
 * 属性选择器钩子。x-container 等消费者只订阅 `$.viewport`，不再自建监测（ADR-0101 的
 * 实例 mql / 实例级 breakpoints / 写回 / viewport:change 已随之废除）。
 *
 * `options.viewport` 三态：缺省开启内置 Bootstrap 5 表 / `false` 整体关闭（不建 mql、
 * 不写 `$`、不挂根属性）/ 配置对象（`breakpoints` 为 engine 级唯一阈值真相）。
 * 构造期同步注入初值（消灭首渲染空档）；只读约定——外部写不解释、跨档自然覆盖。
 */

/** 阈值/px 归一：number | 裸数字串 | `Npx` 串 → px number（rem/% 等依赖布局基准不收） */
function parsePx(raw: unknown): number | null {
    if (typeof raw === "number") return Number.isFinite(raw) && raw > 0 ? raw : null;
    if (typeof raw === "string") {
        const s = raw.trim();
        if (/^\d+(\.\d+)?px?$/.test(s)) return parseFloat(s);
    }
    return null;
}

/**
 * 解析生效阈值表（ADR-0105 决策 4）：`options.viewport.breakpoints` → 内置缺省表。
 * 非法项 warn + 忽略（xs 入表 / 未知档名 / 非 px 阈值）；整表无有效项回退内置 + warn。
 * 纯函数（单测直击）。
 */
export function resolveViewportBreakpoints(
    raw: Record<string, number | string> | undefined,
    warn?: (msg: string) => void,
): ResolvedViewportBreakpoints {
    const source =
        raw != null && typeof raw === "object" && !Array.isArray(raw)
            ? raw
            : DEFAULT_VIEWPORT_BREAKPOINTS;
    const entries: [ViewportTier, number][] = [];
    for (const [name, value] of Object.entries(source)) {
        if (name === "xs") {
            warn?.(`viewport: xs 是 < sm 的隐含兜底档（无阈值），breakpoints 中的 xs 已忽略`);
            continue;
        }
        if (!(VIEWPORT_TIERS as readonly string[]).includes(name)) {
            warn?.(`viewport: 未知档位 "${name}"（合法：sm/md/lg/xl/xxl），已忽略`);
            continue;
        }
        const px = parsePx(value);
        if (px == null) {
            warn?.(`viewport: 阈值 ${name} 值 "${String(value)}" 无法解析为 px，已忽略`);
            continue;
        }
        entries.push([name as ViewportTier, px]);
    }
    if (entries.length === 0) {
        warn?.("viewport: breakpoints 无任何有效项，回退内置缺省表");
        for (const [name, px] of Object.entries(DEFAULT_VIEWPORT_BREAKPOINTS)) {
            entries.push([name as ViewportTier, px]);
        }
    }
    entries.sort((a, b) => a[1] - b[1]);
    return { tiers: entries.map((e) => e[0]), thresholds: entries.map((e) => e[1]) };
}

/** 档位 mql 订阅条目（destroy 反注册） */
interface MqlEntry {
    mql: MediaQueryList;
    onChange: () => void;
}

/**
 * ViewportManager：全局视口档位监测（ADR-0105）。
 *
 * engine 构造期装配（对齐 TooltipManager / NotificationManager 惯例）；每 engine 一例、
 * 不取进程级单例（mql 为浏览器原生对象、每 engine 份开销可忽略，单例反引入共享可变
 * 状态与多配置冲突）。`options.viewport: false` 构造即短路（enabled false，全 no-op）。
 */
export class ViewportManager {
    private readonly engine: AutoSpark;
    /** 当前档（null = 未定——首值必写，此后同档短路） */
    private _tier: ViewportTier | null = null;
    private _mqls: MqlEntry[] = [];
    private _enabled = false;

    constructor(engine: AutoSpark) {
        this.engine = engine;
        if (engine.options.viewport === false) return;
        const tables = resolveViewportBreakpoints(engine.options.viewport?.breakpoints, (m) =>
            engine.logger.warn(m),
        );
        this._enabled = this._setup(tables);
    }

    /** 是否已启用（`options.viewport: false` 或无 matchMedia 时 false） */
    get enabled(): boolean {
        return this._enabled;
    }

    /** engine.destroy()：反注册 mql + 摘根元素属性（`$.viewport` 残留——destroy 不清保留键） */
    dispose(): void {
        for (const { mql, onChange } of this._mqls.splice(0)) {
            mql.removeEventListener?.("change", onChange);
        }
        if (this._enabled) {
            this.engine.el.removeAttribute("data-viewport");
        }
        this._enabled = false;
    }

    // ── 内部 ──────────────────────────────────────────────────────────

    /**
     * 元容器注入（ADR-0105 决策 1，严格保留键语义）：state.$ 缺失 → 注入
     * `{ viewport }` 空容器（挂 META_MARK 框架所有物标记）；已有框架标记 → 复用；
     * 用户注入（无标记）→ warn + delete + 重建。
     */
    private _ensureMetaContainer(): Record<string, any> {
        const state = this.engine.store.state as Record<string, any>;
        const existing = state[META_KEY];
        if (
            existing != null &&
            typeof existing === "object" &&
            (existing as any)[META_MARK] === META_MARK
        ) {
            return existing as Record<string, any>;
        }
        if (existing != null) {
            this.engine.logger.warn(
                `state.${META_KEY} 是框架保留键（引擎内部状态元容器），用户数据已删除（ADR-0105）`,
            );
            delete state[META_KEY];
        }
        const meta: Record<string | symbol, any> = {};
        // 框架所有物标记：Symbol 键普通赋值（经 store 代理可读，LOCAL_PATHS 同法）
        (meta as any)[META_MARK] = META_MARK;
        state[META_KEY] = meta;
        // 从 state 重读代理再返回：后续跨档写 viewport 须经 store 响应式代理（写本地裸
        // 引用不触发订阅通知——本用例首跑实测踩坑）
        return state[META_KEY] as Record<string, any>;
    }

    /**
     * 启动监测：元容器注入 + 按档 mql 监听 + 首值同步（构造期写 `$.viewport` 初值与
     * 根元素 `data-viewport`，消灭首渲染空档）。无 matchMedia 环境 warn + 返回 false。
     */
    private _setup(tables: ResolvedViewportBreakpoints): boolean {
        if (typeof matchMedia !== "function") {
            this.engine.logger.warn("viewport: 当前环境无 matchMedia，视口档位状态不可用");
            return false;
        }
        const meta = this._ensureMetaContainer();
        const entries = tables.tiers.map((tier, i) => ({
            tier,
            mql: matchMedia(`(min-width:${tables.thresholds[i]}px)`),
        }));
        const apply = (tier: ViewportTier): void => {
            if (this._tier === tier) return;
            this._tier = tier;
            meta.viewport = tier;
            this.engine.el.setAttribute("data-viewport", tier);
        };
        // 单档 change 触发全量重读——正确处理一次跨越多档
        const recompute = () => {
            let tier: ViewportTier = "xs";
            for (const e of entries) {
                if (e.mql.matches) tier = e.tier;
            }
            apply(tier);
        };
        for (const e of entries) {
            const onChange = () => recompute();
            e.mql.addEventListener?.("change", onChange);
            this._mqls.push({ mql: e.mql, onChange });
        }
        recompute();
        return true;
    }
}
