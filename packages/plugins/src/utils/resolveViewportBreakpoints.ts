/**
 * 断点阈值表解析（自 engine features/viewport/manager 复制纯函数与依赖，ADR-0008 决策 3）：
 * `options.viewport.breakpoints` → 内置缺省表；非法项 warn + 忽略；整表无有效项回退内置 + warn。
 */
import { VIEWPORT_TIERS, type ViewportTier } from "./viewportTiers";

/** 内置缺省阈值表（Bootstrap 5 对齐；xs 无阈值不入表，ADR-0101 决策 3） */
export const DEFAULT_VIEWPORT_BREAKPOINTS: Record<string, number> = {
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
};

/** 阈值/px 归一：number | 裸数字串 | `Npx` 串 → px number（rem/% 等依赖布局基准不收） */
function parsePx(raw: unknown): number | null {
    if (typeof raw === "number") return Number.isFinite(raw) && raw > 0 ? raw : null;
    if (typeof raw === "string") {
        const s = raw.trim();
        if (/^\d+(\.\d+)?px?$/.test(s)) return parseFloat(s);
    }
    return null;
}

/** 解析产物：档位序列与对应阈值序列（同步升序） */
export interface ResolvedViewportBreakpoints {
    tiers: ViewportTier[];
    thresholds: number[];
}

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
