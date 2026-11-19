/**
 * 对比度计算与变量表构建（CLI 校准脚本与 bun test 防回归断言共享）
 *
 * 与实现同源：直接 import src/vars 变量模块 + 从 palette.less 提取灰阶字面值，
 * 变量改动后消费方自动跟随。color-mix(in srgb) 按 CSS 规范在 sRGB（非线性）分量上
 * 线性插值复刻，带 alpha 的颜色先与底色合成再计算 WCAG 对比度。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
    derivedVars,
    darkDerivedVars,
    lightColorVars,
    lightColorizedColorVars,
    darkColorVars,
    darkColorizedColorVars,
} from "../src/vars";
import { generateThemeColorVars } from "../src/utils/generateThemeColorVars";
import { presetThemes } from "../src/presets";

/* --------------------------------- 颜色工具 --------------------------------- */

export type RGBA = [number, number, number, number]; // r/g/b/a，分量 0~1

/** 少量命名色（变量值中出现的） */
const NAMED_COLORS: Record<string, string> = {
    gray: "#808080",
    white: "#ffffff",
    black: "#000000",
    transparent: "#00000000",
};

/** hsl(H S% L%[/ A%]) → rgb，标准 CSS 算法 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(Math.min(k(n) - 3, 9 - k(n)), 1));
    return [f(0), f(8), f(4)];
}

/** 解析 CSS 颜色字面值为 RGBA（支持 #hex / hsl() / 命名色） */
function parseColor(input: string): RGBA {
    let s = input.trim();
    const imp = s.endsWith("!important");
    if (imp) s = s.slice(0, -"!important".length).trim();

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
    const hsl = s.match(/^hsl\(\s*([\d.]+)[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*\/\s*([\d.]+)%?)?\)$/);
    if (hsl) {
        const [r, g, b] = hslToRgb(+hsl[1], +hsl[2], +hsl[3]);
        return [r, g, b, hsl[4] !== undefined ? +hsl[4] : 1];
    }
    if (s in NAMED_COLORS) return parseColor(NAMED_COLORS[s]);
    throw new Error(`无法解析颜色: ${input}`);
}

/**
 * color-mix(in srgb, A, B P%)：CSS 规范在预乘 alpha 空间对 sRGB 分量线性插值，
 * 再除以结果 alpha 还原为非预乘形态（如 color-mix(red, transparent 50%) = rgba(255,0,0,.5)）。
 */
function srgbMix(a: RGBA, b: RGBA, pctOfB: number): RGBA {
    const t = pctOfB / 100;
    const mixed = [0, 1, 2, 3].map((i) => {
        const pa = a[i] * a[3]; // premultiply
        const pb = b[i] * b[3];
        return pa * (1 - t) + pb * t;
    }) as RGBA;
    if (mixed[3] === 0) return [0, 0, 0, 0];
    return [mixed[0] / mixed[3], mixed[1] / mixed[3], mixed[2] / mixed[3], mixed[3]];
}

/** 前景叠底（底默认不透明；此处仅一层的合成足够本场景） */
function flatten(fg: RGBA, bg: RGBA): RGBA {
    const bgOpaque: RGBA = [bg[0] * bg[3], bg[1] * bg[3], bg[2] * bg[3], 1];
    return [
        fg[0] * fg[3] + bgOpaque[0] * (1 - fg[3]),
        fg[1] * fg[3] + bgOpaque[1] * (1 - fg[3]),
        fg[2] * fg[3] + bgOpaque[2] * (1 - fg[3]),
        1,
    ];
}

/** WCAG 相对亮度 */
function relLum(c: RGBA): number {
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

/* ------------------------------- 变量链解析 ------------------------------- */

/**
 * 递归解析变量值中的 var() 引用与 color-mix()，返回 RGBA。
 * seen: 记录解析轨迹用于报错定位（循环引用检测）。
 */
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

/* -------------------------------- 变量表构建 -------------------------------- */

/** 从 colors.less 提取灰阶字面值（--x-color-gray-0..9，hex 或 hsl），与样式源同源 */
function loadGrayScale(): Record<string, string> {
    const less = readFileSync(join(import.meta.dir, "../src/styles/colors.less"), "utf-8");
    const vars: Record<string, string> = {};
    for (const m of less.matchAll(/(--x-color-gray-\d+):\s*(hsl\([^)]+\)|#[0-9a-fA-F]{3,8})/g)) {
        vars[m[1]] = m[2];
    }
    return vars;
}

export type Mode = "light" | "dark";

/** 语义色默认种子（与 ThemeScope 构造默认值一致；primary 为 var() 引用豁免梯度化） */
const SEMANTIC_SEEDS: Record<string, string> = {
    primary: "var(--auto-theme-color)",
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#71717a",
};

/** 模拟 CSS 级联构建某模式下的完整变量表（顺序即覆盖顺序） */
export function buildVars(mode: Mode, colorized: boolean, themeColor = presetThemes.blue.color): Record<string, string> {
    const table: Record<string, string> = {};
    Object.assign(table, loadGrayScale());
    // 主题梯度：dark 下 reverse（0 最深），与 _createThemeColorVars 一致
    Object.assign(table, generateThemeColorVars(themeColor, { prefix: "--x-color-theme-", reverse: mode === "dark" }));
    // 模式块恒声明（含 plain/tinted 别名层），colorized 块仅覆盖色彩两键（与注入级联一致）
    Object.assign(table, lightColorVars);
    if (mode === "dark") Object.assign(table, darkColorVars);
    if (colorized) Object.assign(table, lightColorizedColorVars, mode === "dark" ? darkColorizedColorVars : {});
    Object.assign(table, derivedVars);
    if (mode === "dark") Object.assign(table, darkDerivedVars);
    // 语义色：与 _generateSemanticColorStyles 同构（标尺 + light 直引种子 / dark 提亮第 3 档）
    for (const [name, seed] of Object.entries(SEMANTIC_SEEDS)) {
        if (seed.startsWith("var(")) {
            table[`--x-color-${name}`] = seed;
            continue;
        }
        Object.assign(table, generateThemeColorVars(seed, { prefix: `--x-color-${name}-` }));
        table[`--x-color-${name}`] = seed;
    }
    if (mode === "dark") {
        for (const name of ["success", "warning", "danger", "info"]) {
            table[`--x-color-${name}`] = `var(--x-color-${name}-3)`;
        }
    }
    return table;
}
