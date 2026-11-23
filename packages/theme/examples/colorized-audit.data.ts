/**
 * 多彩模式（colorized）审核数据。
 *
 * 示例侧浏览器可用：与 scripts/contrast-lib.ts 使用同一套变量表构建顺序与
 * color-mix/var() 解析口径，但不依赖 node:fs（灰阶字面量不参与 colorized 解析，
 * 因此此处无需镜像 styles/colors.less）。
 *
 * 用途：一次性算出 12 个预设 × light/dark colorized 的关键对比度，供审核页
 * 的矩阵表渲染；页面上的实时区块仍直接读取当前 CSS 变量，两者互为对照。
 */
import {
    darkColorVars,
    darkColorizedColorVars,
    darkDerivedVars,
    derivedVars,
    lightColorVars,
    lightColorizedColorVars,
} from "../src/vars";
import { generateThemeColorVars } from "../src/utils/generateThemeColorVars";
import { presetThemes } from "../src/presets";

/* --------------------------------- 颜色工具 --------------------------------- */

export type RGBA = [number, number, number, number]; // r/g/b/a，分量 0~1

const NAMED_COLORS: Record<string, string> = {
    gray: "#808080",
    white: "#ffffff",
    black: "#000000",
    transparent: "#00000000",
};

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(Math.min(k(n) - 3, 9 - k(n)), 1));
    return [f(0), f(8), f(4)];
}

/** 解析 #hex / rgb() / rgba() / hsl() / color(srgb …) / 命名色 */
export function parseColor(input: string): RGBA {
    let s = input.trim();
    if (s.endsWith("!important")) s = s.slice(0, -"!important".length).trim();

    if (s.startsWith("#")) {
        const hex = s.slice(1);
        const full =
            hex.length === 3 || hex.length === 4
                ? hex.split("").map((c) => c + c).join("")
                : hex;
        return [
            parseInt(full.slice(0, 2), 16) / 255,
            parseInt(full.slice(2, 4), 16) / 255,
            parseInt(full.slice(4, 6), 16) / 255,
            full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1,
        ];
    }

    const rgb = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/);
    if (rgb) {
        return [
            +rgb[1] / 255,
            +rgb[2] / 255,
            +rgb[3] / 255,
            rgb[4] === undefined ? 1 : rgb[4].endsWith("%") ? +rgb[4].slice(0, -1) / 100 : +rgb[4],
        ];
    }

    const srgb = s.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/);
    if (srgb) {
        return [
            +srgb[1],
            +srgb[2],
            +srgb[3],
            srgb[4] === undefined ? 1 : srgb[4].endsWith("%") ? +srgb[4].slice(0, -1) / 100 : +srgb[4],
        ];
    }

    const hsl = s.match(/^hsl\(\s*([\d.]+)[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*\/\s*([\d.]+)%?)?\)$/);
    if (hsl) {
        const [r, g, b] = hslToRgb(+hsl[1], +hsl[2], +hsl[3]);
        return [r, g, b, hsl[4] !== undefined ? +hsl[4] : 1];
    }

    if (s in NAMED_COLORS) return parseColor(NAMED_COLORS[s]);
    throw new Error(`无法解析颜色: ${input}`);
}

/** color-mix(in srgb, A, B P%)：预乘 alpha 的 sRGB 线性插值 */
function srgbMix(a: RGBA, b: RGBA, pctOfB: number): RGBA {
    const t = pctOfB / 100;
    const mixed = [0, 1, 2, 3].map((i) => {
        const pa = a[i] * a[3];
        const pb = b[i] * b[3];
        return pa * (1 - t) + pb * t;
    }) as RGBA;
    if (mixed[3] === 0) return [0, 0, 0, 0];
    return [mixed[0] / mixed[3], mixed[1] / mixed[3], mixed[2] / mixed[3], mixed[3]];
}

/** 前景叠底（底默认不透明） */
export function flatten(fg: RGBA, bg: RGBA): RGBA {
    const bgOpaque: RGBA = [bg[0] * bg[3], bg[1] * bg[3], bg[2] * bg[3], 1];
    return [
        fg[0] * fg[3] + bgOpaque[0] * (1 - fg[3]),
        fg[1] * fg[3] + bgOpaque[1] * (1 - fg[3]),
        fg[2] * fg[3] + bgOpaque[2] * (1 - fg[3]),
        1,
    ];
}

/** WCAG 相对亮度 */
export function relLum(c: RGBA): number {
    const lin = c.slice(0, 3).map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/** WCAG 对比度（两色均先与各自底合成后比较） */
export function contrast(fg: RGBA, fgBase: RGBA, bg: RGBA): number {
    const l1 = relLum(flatten(fg, fgBase));
    const l2 = relLum(flatten(bg, bg));
    const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
    return (hi + 0.05) / (lo + 0.05);
}

/** CIE L*（由相对亮度反推，0 黑 ~ 100 白） */
export function lstar(c: RGBA): number {
    const y = relLum(c);
    const f = y > 0.008856451679 ? Math.cbrt(y) : 7.787037037 * y + 16 / 116;
    return 116 * f - 16;
}

/** RGB → HSL（h 0~360，s/l 0~100） */
export function toHsl(c: RGBA): { h: number; s: number; l: number } {
    const [r, g, b] = c;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    let h = 0;
    if (d !== 0) {
        if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
        if (h < 0) h += 360;
    }
    return { h, s: s * 100, l: l * 100 };
}

export function hue(c: RGBA): number {
    return toHsl(c).h;
}

/** 环形色相差（0~180） */
export function hueDelta(a: number, b: number): number {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
}

export function hex(c: RGBA): string {
    const rgb =
        "#" +
        c
            .slice(0, 3)
            .map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0"))
            .join("");
    return c[3] < 0.999 ? `${rgb} / ${Math.round(c[3] * 100)}%` : rgb;
}

/* ------------------------------- 变量链解析 ------------------------------- */

/** 递归解析变量值中的 var() 引用与 color-mix()，返回 RGBA */
export function resolveVar(name: string, table: Record<string, string>, seen = new Set<string>()): RGBA {
    if (seen.has(name)) throw new Error(`变量循环引用: ${[...seen, name].join(" → ")}`);
    seen.add(name);
    const raw = table[name];
    if (raw === undefined) throw new Error(`变量未定义: ${name}`);

    const evalExpr = (expr: string): RGBA => {
        const s = expr.trim().replace(/!important$/, "").trim();
        const mix = s.match(/^color-mix\(in srgb,\s*(.+?),\s*([^,]+?)\s+(\d+(?:\.\d+)?)%\s*\)$/);
        if (mix) {
            const a = evalExpr(mix[1]);
            const b = evalExpr(mix[2]);
            return srgbMix(a, b, +mix[3]);
        }
        const v = s.match(/^var\((--[\w-]+)\)$/);
        if (v) return resolveVar(v[1], table, seen);
        return parseColor(s);
    };
    return evalExpr(raw);
}

/** 构建某模式 + colorized 下的变量表（与 scripts/contrast-lib.ts 同序） */
export function buildColorizedVars(mode: "light" | "dark", themeColor: string): Record<string, string> {
    const table: Record<string, string> = {};
    // dark 下主题梯度反转（0 最深），与运行时 _createThemeColorVars 一致
    Object.assign(table, generateThemeColorVars(themeColor, { prefix: "--x-color-theme-", reverse: mode === "dark" }));
    Object.assign(table, lightColorVars);
    if (mode === "dark") Object.assign(table, darkColorVars);
    Object.assign(table, lightColorizedColorVars);
    if (mode === "dark") Object.assign(table, darkColorizedColorVars);
    Object.assign(table, derivedVars);
    if (mode === "dark") Object.assign(table, darkDerivedVars);
    return table;
}

/* --------------------------------- 审核矩阵 --------------------------------- */

export type MetricKey =
    | "textPanel"
    | "textWorkspace"
    | "secondaryPanel"
    | "accentPanel"
    | "selected"
    | "input"
    | "borderPanel"
    | "panelWorkspace";

export type Metric = {
    key: MetricKey;
    label: string;
    ratio: number;
    min: number;
    pass: boolean;
};

export type AuditRow = {
    preset: string;
    title: string;
    seed: string;
    mode: "light" | "dark";
    metrics: Metric[];
    panelHex: string;
    workspaceHex: string;
    textHex: string;
    accentHex: string;
    inputHex: string;
    borderHex: string;
    selectedBgHex: string;
    panelLstar: number;
    passCount: number;
};

const METRIC_DEFS: Array<{ key: MetricKey; label: string; min: number }> = [
    { key: "textPanel", label: "正文·面板", min: 4.5 },
    { key: "textWorkspace", label: "正文·工作区", min: 4.5 },
    { key: "secondaryPanel", label: "次要·面板", min: 4.5 },
    { key: "accentPanel", label: "强调·面板", min: 4.5 },
    { key: "selected", label: "选中文字·底", min: 4.5 },
    { key: "input", label: "输入文字·底", min: 4.5 },
    { key: "borderPanel", label: "边框·面板", min: 1.2 },
    { key: "panelWorkspace", label: "面板·工作区", min: 1.2 },
];

function buildRow(
    preset: string,
    title: string,
    seed: string,
    mode: "light" | "dark",
): AuditRow {
    const table = buildColorizedVars(mode, seed);
    const g = (v: string) => resolveVar(v, table);

    const panel = g("--auto-bgcolor");
    const workspace = g("--auto-workspace-bgcolor");
    const text = g("--auto-color");
    const secondary = g("--auto-secondary-color");
    const accent = g("--auto-theme-color");
    const selectedText = g("--auto-selected-color");
    const selectedBg = flatten(g("--auto-selected-bgcolor"), panel);
    const inputBg = g("--auto-input-bgcolor");
    const border = g("--auto-border-color");

    const ratios: Record<MetricKey, number> = {
        textPanel: contrast(text, panel, panel),
        textWorkspace: contrast(text, workspace, workspace),
        secondaryPanel: contrast(secondary, panel, panel),
        accentPanel: contrast(accent, panel, panel),
        selected: contrast(selectedText, selectedBg, selectedBg),
        input: contrast(text, inputBg, inputBg),
        borderPanel: contrast(border, panel, panel),
        panelWorkspace: contrast(panel, workspace, workspace),
    };

    const metrics = METRIC_DEFS.map(({ key, label, min }) => {
        const ratio = ratios[key];
        return { key, label, ratio, min, pass: ratio >= min };
    });

    return {
        preset,
        title,
        seed,
        mode,
        metrics,
        panelHex: hex(panel),
        workspaceHex: hex(workspace),
        textHex: hex(text),
        accentHex: hex(accent),
        inputHex: hex(inputBg),
        borderHex: hex(border),
        selectedBgHex: hex(selectedBg),
        panelLstar: lstar(panel),
        passCount: metrics.filter((m) => m.pass).length,
    };
}

export const auditMatrix: AuditRow[] = Object.entries(presetThemes).flatMap(([name, theme]) =>
    (["light", "dark"] as const).map((mode) =>
        buildRow(name, theme.title ?? name, theme.color, mode),
    ),
);

export type Summary = {
    mode: "light" | "dark";
    key: MetricKey;
    label: string;
    pass: number;
    total: number;
};

export function summarize(rows: AuditRow[]): Summary[] {
    const out: Summary[] = [];
    for (const mode of ["light", "dark"] as const) {
        for (const def of METRIC_DEFS) {
            const scoped = rows.filter((r) => r.mode === mode);
            out.push({
                mode,
                key: def.key,
                label: def.label,
                pass: scoped.filter((r) => r.metrics.find((m) => m.key === def.key)?.pass).length,
                total: scoped.length,
            });
        }
    }
    return out;
}

export const auditSummary = summarize(auditMatrix);
