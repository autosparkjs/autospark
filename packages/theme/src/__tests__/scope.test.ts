import { describe, expect, test } from "bun:test";
import { ThemeScope } from "../scope";

/**
 * 主题标尺规则生成回归：dark 反转块此前要求 DOM 上存在 data-theme 属性才命中，
 * 而挂载链路（attach/autoAttach/connect）从不写该属性，导致局部作用域
 * dark+colorized 时继承全局未反转标尺、标尺映射整体反向（面板浅色/文字深色）。
 * 修复后规则仅由实例选择器 + [dark] 构成，实例 options.themeColor 即唯一主题源。
 */
describe("ThemeScope 主题标尺样式生成", () => {
    const scope = new ThemeScope({ id: "scopeA", autoConnect: false, autoAttach: false });
    const css = scope.toStyles();

    test("dark 反转标尺块不依赖 data-theme 属性即命中", () => {
        expect(css).toContain("[data-theme-scope='scopeA'][dark]{\n    color-scheme: dark;");
    });

    test("产物不含 data-theme 属性匹配与 :root 泄漏", () => {
        expect(css).not.toContain("data-theme=");
        expect(css).not.toContain(":root");
    });

    test("root scope 仍直接命中 :host/:root（全局通道无回归）", () => {
        const root = new ThemeScope({
            id: "root",
            cssSelector: [":host", ":root"],
            autoConnect: false,
            autoAttach: false,
        });
        const rootCss = root.toStyles();
        expect(rootCss).toContain(":host,:root{");
        expect(rootCss).toContain(":host,:root[dark]{");
    });

    test("update 切换主题色后标尺跟随新值（不再依赖属性形态一致）", () => {
        const scope = new ThemeScope({ id: "scopeT", autoConnect: false, autoAttach: false });
        const before = scope.toStyles();
        scope.update({ themeColor: "purple" });
        const after = scope.toStyles();
        expect(after).not.toEqual(before);
        expect(after).not.toContain("#1677ff");
    });
});
