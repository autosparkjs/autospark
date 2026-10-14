import { describe, expect, test } from "bun:test";
import { ThemeScope } from "../scope";

/**
 * 主题标尺规则生成回归：dark 反转块此前要求 DOM 上存在 data-theme 属性才命中，
 * 而挂载链路（attach/autoAttach/connect）从不写该属性，导致局部作用域
 * dark+colorized 时继承全局未反转标尺、标尺映射整体反向（面板浅色/文字深色）。
 * 修复后规则仅由实例选择器 + [dark]/[data-dark] 构成，实例 options.themeColor 即唯一主题源。
 */
describe("ThemeScope 主题标尺样式生成", () => {
    const scope = new ThemeScope({ id: "scopeA", autoConnect: false, autoAttach: false });
    const css = scope.toStyles();

    test("dark 反转标尺块不依赖 data-theme 属性即命中（data-dark 收敛到作用域子树）", () => {
        expect(css).toContain(
            "[data-theme-scope='scopeA'][dark],[data-theme-scope='scopeA'][data-dark],[data-theme-scope='scopeA'] [data-dark]{\n    color-scheme: dark;",
        );
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
        expect(rootCss).toContain(":host,:root,[data-light]{");
        expect(rootCss).toContain(":host,:root[dark],[data-dark]{");
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

/**
 * 独立样式域：data-light / data-dark / data-colorized / data-uncolored 四属性
 * 手动通道，与作用域元素上的 [dark]/[colorized]（JS setter 通道）长期并存。
 * 根域（:host/:root）裸追加；作用域收敛为「自身+后代」两式（跨作用域裸命中
 * 会错拿别的作用域的字面量梯度）。暗色/彩色块恒在亮色块之后、-colors/-semantics
 * 注入于 -vars 之后、darkColorVars 带 !important——平特异性靠顺序胜出。
 */
describe("独立样式域 data-* 手动通道", () => {
    const root = new ThemeScope({
        id: "root",
        cssSelector: [":host", ":root"],
        autoConnect: false,
        autoAttach: false,
    });
    const rootCss = root.toStyles();
    const scope = new ThemeScope({ id: "scopeD", autoConnect: false, autoAttach: false });
    const scopeCss = scope.toStyles();

    test("暗色块与多彩块均带受限 data-* 替选择器（root 裸追加、作用域收敛）", () => {
        expect(rootCss).toContain(":host,:root[dark],[data-dark]{");
        expect(rootCss).toContain(":host,:root[colorized],[data-colorized]{");
        expect(scopeCss).toContain(
            "[data-theme-scope='scopeD'][dark],[data-theme-scope='scopeD'][data-dark],[data-theme-scope='scopeD'] [data-dark]{",
        );
        expect(scopeCss).toContain(
            "[data-theme-scope='scopeD'][colorized],[data-theme-scope='scopeD'][data-colorized],[data-theme-scope='scopeD'] [data-colorized]{",
        );
    });

    test("data-light 追加到基色块（含 color-scheme: light，完整亮域）", () => {
        expect(rootCss).toContain(":host,:root,[data-light]{\n    color-scheme: light;");
        expect(scopeCss).toContain(
            "[data-theme-scope='scopeD'],[data-theme-scope='scopeD'][data-light],[data-theme-scope='scopeD'] [data-light]{\n    color-scheme: light;",
        );
    });

    test("data-light 同样追加到主题标尺与语义色亮色块", () => {
        // 主题标尺亮色块（-colors 注入内容）
        expect(rootCss).toContain(":host,:root,[data-light]{\n    color-scheme: light;\n");
        // 语义色亮色块（-semantics 注入内容）
        const scopeB = new ThemeScope({ id: "scopeL", autoConnect: false, autoAttach: false });
        scopeB.update({ primary: "#123456" });
        const css = scopeB.generate();
        expect(css).toContain(
            "[data-theme-scope='scopeL'],[data-theme-scope='scopeL'][data-light],[data-theme-scope='scopeL'] [data-light]{",
        );
    });

    test("暗色+多彩块：root 四组合裸写；作用域为自身四组合 + 后代守卫", () => {
        expect(rootCss).toContain(
            ":host,:root[dark][colorized],[dark][data-colorized],[data-dark][colorized],[data-dark][data-colorized]{",
        );
        expect(scopeCss).toContain(
            "[data-theme-scope='scopeD'][dark][colorized],[data-theme-scope='scopeD'][dark][data-colorized],[data-theme-scope='scopeD'][data-dark][colorized],[data-theme-scope='scopeD'][data-dark][data-colorized],[data-theme-scope='scopeD'] [data-dark][colorized],[data-theme-scope='scopeD'] [data-dark][data-colorized]{",
        );
    });

    test("无彩块（data-uncolored）：root 裸追加、作用域含自身式", () => {
        expect(rootCss).toContain("[data-uncolored]{");
        expect(scopeCss).toContain(
            "[data-theme-scope='scopeD'],[data-theme-scope='scopeD'][data-uncolored],[data-theme-scope='scopeD'] [data-uncolored]{",
        );
    });

    test("模式块声明 plain/tinted 双别名层（data-uncolored / data-colorized 的语境基础）", () => {
        // 亮模式块：灰色方向 + 多彩映射别名
        expect(rootCss).toContain("--x-plain-color-0:var(--x-color-gray-9)");
        expect(rootCss).toContain("--x-tinted-bgcolor-1:var(--x-color-theme-1)");
        // 暗模式块：暗方向别名带 !important（同元素压过亮块）
        expect(rootCss).toContain("--x-plain-color-0:var(--x-color-gray-0) !important");
        expect(rootCss).toContain(
            "--x-tinted-bgcolor-1:color-mix(in srgb, var(--x-color-theme-0), black 30%) !important",
        );
        // 实际值引用灰色别名；彩色块引用 tinted 别名
        expect(rootCss).toContain("--x-color-0:var(--x-plain-color-0)");
        expect(rootCss).toContain("--x-color-0:var(--x-tinted-color-0)");
    });

    test("无彩块内容为 plain 别名引用（普通权重，模式随语境）", () => {
        const idxUncolored = rootCss.indexOf("[data-uncolored]{");
        expect(idxUncolored).toBeGreaterThan(-1);
        const end = rootCss.indexOf("}", idxUncolored);
        const block = rootCss.slice(idxUncolored, end);
        expect(block).toContain("--x-color-0:var(--x-plain-color-0)");
        expect(block).toContain("--x-bgcolor-9:var(--x-plain-bgcolor-9)");
        expect(block).not.toContain("!important");
    });

    test("作用域组合守卫特异性高于作用域暗色块（防 data-dark+data-colorized 降级为灰）", () => {
        const darkIdx = scopeCss.indexOf(
            "[data-theme-scope='scopeD'][data-dark],[data-theme-scope='scopeD'] [data-dark]{",
        );
        const guardIdx = scopeCss.indexOf(
            "[data-theme-scope='scopeD'] [data-dark][data-colorized]{",
        );
        expect(darkIdx).toBeGreaterThan(-1);
        expect(guardIdx).toBeGreaterThan(darkIdx);
    });

    test("裸 data-* 追加不给局部作用域产物引入 :root（既有泄漏约束不回归）", () => {
        expect(scopeCss).not.toContain(":root");
    });

    /**
     * 派生层自举回归（data-dark / data-colorized / data-uncolored 切换不可见的根因）：
     * 自定义属性 var() 在「声明所在元素」计算值期替换、后代继承已替换值。派生层
     * --auto-*（组件消费端）引用 --x-color-… 与 --x-bgcolor-…，此前仅声明在
     * :host/:root/[data-light] —— data-dark/colorized/uncolored 后代只自举了 --x-*
     * 基层，继承的 --auto-* 仍是根域（亮/灰）已替换值，维度切换对组件不可见。
     * 修复：派生层一并声明到四个手动通道元素自身，--auto-* 按其自身 --x-* 重新替换。
     */
    test("派生层 --auto-* 声明覆盖四个手动通道选择器（data-* 维度切换对组件可见）", () => {
        for (const css of [rootCss, scopeCss]) {
            // 找到「选择器含 data-dark 且块体含 --auto-color」的派生层块，校验四属性齐全
            const blocks = css.split(/(?<=\})\s*(?=[^{}]*\{)/);
            const derived = blocks.find(
                (b) => /\[data-dark\]/.test(b.split("{")[0]) && /--auto-color:/.test(b),
            );
            expect(derived).toBeDefined();
            const sel = derived!.split("{")[0];
            expect(sel).toContain("[data-light]");
            expect(sel).toContain("[data-dark]");
            expect(sel).toContain("[data-colorized]");
            expect(sel).toContain("[data-uncolored]");
            // 派生层引用本元素的 --x-*（而非硬编码），才能按自身维度重新替换
            expect(derived).toContain("--auto-color:var(--x-color-1)");
            expect(derived).toContain("--auto-bgcolor:var(--x-bgcolor-0)");
        }
    });

    test("派生层块置于暗色派生块之前（暗色 !important 覆盖靠后者胜出不回归）", () => {
        // 定位「四属性派生层块」（选择器含全部 data-* 替选择器），而非基亮块
        const idxDerived = rootCss.indexOf(
            ":host,:root,[data-light],[data-dark],[data-colorized],[data-uncolored]{",
        );
        expect(idxDerived).toBeGreaterThan(-1);
        expect(rootCss.slice(idxDerived)).toContain("--auto-color:");
        // 暗色派生块（--auto-selected-color 暗覆盖）必须在其后
        const idxDarkDerived = rootCss.indexOf(":host,:root[dark],[data-dark]{", idxDerived);
        expect(idxDarkDerived).toBeGreaterThan(idxDerived);
    });
});
