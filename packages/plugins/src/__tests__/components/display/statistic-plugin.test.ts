/**
 * statistic 组件插件测试（组件库 P2 展示轻件，ADR-0018 清单权威表 display 行）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + 主题档位继承（autospark.base）；
 * - 数值格式化（Intl.NumberFormat JS 直写通道）：number 千分位 / precision 修约 /
 *   grouping 开关 / groupSeparator 自定义分组符 / string 原样直出；
 * - 语言环境联动：`$.language` 全局状态驱动（de 与 zh 分组符差异断言）+ 语言切换
 *   即时重算（watch 表达式依赖收集）；
 * - title / prefix / suffix（props 与插槽双通道）+ valueStyle 内联样式应用；
 * - value 变化响应（状态绑定驱动重算）+ 样式通道字符串断言（button 范式 ADR-0012）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { STATISTIC_NAME, bootstrapStatisticPlugin } from "../../../components/display/statistic/index";

/** 组件模板字符串（空白归一化后断言——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
    ((AutoSpark as { components: Record<string, string> }).components[STATISTIC_NAME] as string).replace(/\s+/g, " ");

/** 数值文本（.asc-statistic-value-text 的 textContent——JS 直写通道产物） */
const valueText = (root: Element): string => root.querySelector(".asc-statistic-value-text")!.textContent!;

describe("注册面（组件形态官方样板）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.statistic 模板字符串 + 主题档位继承", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[STATISTIC_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${STATISTIC_NAME}"`);
        expect(template).toContain('x-define:inherit="autospark.base"'); // 主题档位继承（ADR-0134）
    });

    test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[STATISTIC_NAME];
        bootstrapStatisticPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[STATISTIC_NAME]).toBe(before);
    });
});

describe("数值格式化（Intl.NumberFormat JS 直写）", () => {
    test("number 千分位：zh 缺省语言环境（逗号分组）", async () => {
        const { root } = mount(
            `<div x-component:autospark.statistic="{ value: n }"></div>`,
            { n: 1234567.89 },
        );
        await nextTick();
        expect(valueText(root)).toBe("1,234,567.89");
    });

    test("precision 修约：小数位补齐与四舍五入", async () => {
        const a = mount(
            `<div x-component:autospark.statistic="{ value: n, precision: 2 }"></div>`,
            { n: 1234.5 },
        );
        await nextTick();
        expect(valueText(a.root)).toBe("1,234.50");
        const b = mount(
            `<div x-component:autospark.statistic="{ value: n, precision: 0 }"></div>`,
            { n: 1234.56 },
        );
        await nextTick();
        expect(valueText(b.root)).toBe("1,235");
    });

    test("grouping=false：千分位关闭（纯数字串）", async () => {
        const { root } = mount(
            `<div x-component:autospark.statistic="{ value: n, grouping: false }"></div>`,
            { n: 1234567 },
        );
        await nextTick();
        expect(valueText(root)).toBe("1234567");
    });

    test("groupSeparator 自定义分组符：替换 locale 缺省分组符", async () => {
        const { root } = mount(
            `<div x-component:autospark.statistic="{ value: n, groupSeparator: '_' }"></div>`,
            { n: 1234567 },
        );
        await nextTick();
        expect(valueText(root)).toBe("1_234_567");
    });

    test("string value 原样直出（不经 Intl 格式化）", async () => {
        const { root } = mount(
            `<div x-component:autospark.statistic="{ value: s }"></div>`,
            { s: "1,234 567（原样）" },
        );
        await nextTick();
        expect(valueText(root)).toBe("1,234 567（原样）");
    });

    test("value 变化响应：状态绑定驱动重算（JS 直写通道）", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.statistic="{ value: n }"></div>`,
            { n: 1024 },
        );
        await nextTick();
        expect(valueText(root)).toBe("1,024");
        engine.store.state.n = 2048;
        await nextTick();
        expect(valueText(root)).toBe("2,048");
    });
});

describe("语言环境联动（$.language 可选联动，未装 i18n 回退 zh）", () => {
    // state.$ 是框架保留键（ADR-0105）：mount 状态里的 $ 用户数据被剥除，
    // 语言注入须运行时经代理写创建（i18n ensureLanguage 同款通道）
    test("$.language 在场：按语言环境格式化（de 点分组 + 逗号小数）", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.statistic="{ value: n }"></div>`,
            { n: 1234567.89 },
        );
        (engine.store.state as any).$ = { language: "de" };
        await nextTick();
        expect(valueText(root)).toBe("1.234.567,89");
    });

    test("语言切换即时重算：$.language 写入触发 watch 表达式依赖（zh ↔ de）", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.statistic="{ value: n }"></div>`,
            { n: 1234567.89 },
        );
        await nextTick();
        expect(valueText(root)).toBe("1,234,567.89"); // 缺席回退 zh
        const state = engine.store.state as any;
        state.$ = { language: "zh" };
        await nextTick();
        expect(valueText(root)).toBe("1,234,567.89");
        state.$.language = "de"; // 子键写入（容器已建，i18n 语言切换同款路径）
        await nextTick();
        expect(valueText(root)).toBe("1.234.567,89");
    });

    test("$.language 缺席：回退 zh 缺省（依赖松弛不强制）", async () => {
        const { root } = mount(
            `<div x-component:autospark.statistic="{ value: n }"></div>`,
            { n: 1234567 },
        );
        await nextTick();
        expect(valueText(root)).toBe("1,234,567");
    });
});

describe("title / prefix / suffix / valueStyle", () => {
    test("title props 渲染 + 空值不占位（:empty 通道）", async () => {
        const { root } = mount(
            `<div x-component:autospark.statistic="{ value: n, title: '活跃用户' }"></div>`,
            { n: 1024 },
        );
        await nextTick();
        expect(root.querySelector(".asc-statistic-title")!.textContent).toBe("活跃用户");
        const bare = mount(
            `<div x-component:autospark.statistic="{ value: n }"></div>`,
            { n: 1024 },
        );
        await nextTick();
        expect(bare.root.querySelector(".asc-statistic-title")!.textContent).toBe("");
    });

    test("prefix / suffix props：前后缀文本在场", async () => {
        const { root } = mount(
            `<div x-component:autospark.statistic="{ value: n, prefix: '¥', suffix: '元' }"></div>`,
            { n: 8888 },
        );
        await nextTick();
        expect(root.querySelector(".asc-statistic-prefix")!.textContent).toBe("¥");
        expect(root.querySelector(".asc-statistic-suffix")!.textContent).toBe("元");
    });

    test("prefix / suffix 插槽整体重载（槽内容优先于 props 兜底）", async () => {
        const { root } = mount(
            `<div x-component:autospark.statistic="{ value: n, prefix: '¥' }">` +
                `<template x-slot:prefix><b class="custom-prefix">$</b></template>` +
                `</div>`,
            { n: 100 },
        );
        await nextTick();
        expect(root.querySelector(".custom-prefix")!.textContent).toBe("$");
        expect(root.querySelector(".asc-statistic-prefix")!.textContent).toContain("$"); // 槽投影进出口
        expect(root.querySelector(".asc-statistic-prefix")!.textContent).not.toContain("¥"); // props 兜底让位
    });

    test("valueStyle 内联样式：数值区色/字重应用（camelCase 通道）", async () => {
        const { root } = mount(
            `<div x-component:autospark.statistic="{ value: n, valueStyle: vs }"></div>`,
            { n: 1024, vs: { color: "#ff4d4f", fontWeight: 700 } },
        );
        await nextTick();
        const valueEl = root.querySelector(".asc-statistic-value") as HTMLElement;
        expect(valueEl.style.color).toBe("#ff4d4f");
        expect(valueEl.style.fontWeight).toBe("700");
    });

    test("valueStyle 变化跟随：状态替换驱动重应用（先清后写幂等）", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.statistic="{ value: n, valueStyle: vs }"></div>`,
            { n: 1024, vs: { color: "#009aff" } },
        );
        await nextTick();
        const valueEl = root.querySelector(".asc-statistic-value") as HTMLElement;
        expect(valueEl.style.color).toBe("#009aff");
        engine.store.state.vs = { color: "#22c55e" };
        await nextTick();
        expect(valueEl.style.color).toBe("#22c55e");
    });
});

describe("元素名快速写法（ADR-0117 自动组件 / ADR-0133 反查）", () => {
    test("<x-statistic> 静态属性折叠 props（数字类型推断）+ 化身渲染", async () => {
        const { root } = mount(
            `<div><x-statistic value="1024" title="静态数值"></x-statistic></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".asc-statistic")!;
        expect(host).toBeTruthy();
        expect(host.hasAttribute("value")).toBe(false); // 静态属性已折叠进 props
        expect(valueText(root)).toBe("1,024");
        expect(root.querySelector(".asc-statistic-title")!.textContent).toBe("静态数值");
    });
});

describe("样式通道（button 范式 ADR-0012）", () => {
    test("三级回退链 + 大号数值字重 + 暗色兜底（ADR-0129）", () => {
        const t = tpl();
        expect(t).toContain("font-size: var(--auto-font-size, var(--asc-statistic-font-size, 0.875rem));");
        expect(t).toContain("font-variant-numeric: tabular-nums;"); // 等宽数字
        expect(t).toContain("color: var(--auto-color, var(--asc-statistic-value-color, #303030));");
        expect(t).toContain(".asc-statistic-prefix:empty,");
        expect(t).toContain('[dark] .asc-statistic-value,');
        expect(t).toContain('[data-dark] .asc-statistic-title {');
    });
});
