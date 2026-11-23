/**
 * 边框派生对比度防回归断言（dark-optimization §4.5 修订；VSCode Modern 对齐后重标定）
 *
 * 边框 = 面板底混白恒定偏移（darkDerivedVars），结构上恒不与面板融合——本断言
 * 防两类回归：混色参数/基准被误改（数值格），以及改回固定标尺档使结构性保证
 * 丢失（结构格，39ca7a1 迁移曾把固定档错映射为与面板同色的 color-8）。
 *
 * 阈值口径：1.2 只立 dark（灰/彩两格）——VSCode 弱边框流派（panel.border #2B2B2B
 * 对 #1F1F1F 面板仅 1.19:1），混白 12% 实测灰域 1.45 / 彩域 1.31；light 为
 * 弱对比流派现状（gray-3 #E5E5E5 vs gray-0 ≈1.26，对齐 Light Modern 边框），
 * 只守非同色底线。计算复用 scripts/contrast-lib.ts，与实现同源。
 */
import { describe, expect, test } from "bun:test";
import { buildVars, contrast, resolveVar } from "../../scripts/contrast-lib";

describe("边框派生对比度（防回归）", () => {
    const light = buildVars("light", false);
    const lightColorized = buildVars("light", true);
    const dark = buildVars("dark", false);
    const darkColorized = buildVars("dark", true);

    /** 边框 fg 对指定背景 bg 的 WCAG 对比度 */
    const ratio = (table: Record<string, string>, fg: string, bg: string) =>
        contrast(resolveVar(fg, table), resolveVar(bg, table), resolveVar(bg, table));

    test("dark 边框/面板 ≥ 1.2（灰方向：面板底混白错开，曾因迁移回归 1:1 同色）", () => {
        expect(ratio(dark, "--auto-border-color", "--auto-bgcolor")).toBeGreaterThanOrEqual(1.2);
    });

    test("dark 边框/面板 ≥ 1.2（彩色暗底：派生对 theme-0 面板恒错开，非相邻档）", () => {
        expect(ratio(darkColorized, "--auto-border-color", "--auto-bgcolor")).toBeGreaterThanOrEqual(1.2);
    });

    test("light 边框/面板非同色（灰/彩两方向守融合底线，弱对比为 light 流派现状）", () => {
        expect(ratio(light, "--auto-border-color", "--auto-bgcolor")).toBeGreaterThan(1.05);
        expect(ratio(lightColorized, "--auto-border-color", "--auto-bgcolor")).toBeGreaterThan(1.05);
    });

    test("dark 边框 vs 次级/工作区/输入底非同色（全背景语义融合底线）", () => {
        for (const bg of ["--auto-secondary-bgcolor", "--auto-workspace-bgcolor", "--auto-input-bgcolor"]) {
            expect(ratio(dark, "--auto-border-color", bg)).toBeGreaterThan(1.05);
        }
    });

    test("dark 边框为面板底派生（结构不变量：值引用 --auto-panel-bgcolor，禁回固定标尺档）", () => {
        expect(dark["--auto-border-color"]).toContain("var(--auto-panel-bgcolor)");
    });
});
