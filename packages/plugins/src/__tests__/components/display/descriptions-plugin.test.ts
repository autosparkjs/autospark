/**
 * descriptions 组件插件测试（组件库 P2 展示轻件，ADR-0018 清单权威表 display 行）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + items 状态引用注入（字面量数组死环
 *   规避，ADR-0019 后果 2）+ 内部 x-for 装配 + 主题档位继承（autospark.base）；
 * - span 跨项位（克隆体 :style 内联 grid-column）/ columns 列数网格（JS 通道写
 *   body 容器）/ bordered 表格形态 / layout 标签排布 / title 空值不占位；
 * - precompile 元素名变换：<x-descriptions> → div 宿主 + 静态属性折叠；
 * - 子元素声明形态：<x-descriptions-item> → data-items JSON 通道（breadcrumb 范式）；
 * - 样式通道字符串断言（button 范式 ADR-0012）+ 暗色兜底变体。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import {
    DESCRIPTIONS_NAME,
    bootstrapDescriptionsPlugin,
} from "../../../components/display/descriptions/index";

/** 组件模板字符串（空白归一化后断言——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
    ((AutoSpark as { components: Record<string, string> }).components[DESCRIPTIONS_NAME] as string).replace(/\s+/g, " ");

describe("注册面（组件形态官方样板）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.descriptions 模板字符串 + 主题档位继承", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[DESCRIPTIONS_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${DESCRIPTIONS_NAME}"`);
        expect(template).toContain('x-define:inherit="autospark.base"'); // 主题档位继承（ADR-0134）
        expect(template).toContain('x-for="item of items"'); // 内部 x-for 装配（ADR-0018 决策 2）
    });

    test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[DESCRIPTIONS_NAME];
        bootstrapDescriptionsPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[DESCRIPTIONS_NAME]).toBe(before);
    });
});

describe("items 数据驱动渲染（状态引用注入）", () => {
    test("键值对渲染：label / value 逐项在场", async () => {
        const { root } = mount(
            `<div x-component:autospark.descriptions="{ items: rows }"></div>`,
            {
                rows: [
                    { label: "姓名", value: "张三" },
                    { label: "账号", value: "auto-1024" },
                ],
            },
        );
        await nextTick();
        expect(root.querySelectorAll(".asc-descriptions-item").length).toBe(2);
        const labels = Array.from(root.querySelectorAll(".asc-descriptions-label")).map((n) => n.textContent);
        expect(labels).toEqual(["姓名", "账号"]);
        const values = Array.from(root.querySelectorAll(".asc-descriptions-value")).map((n) => n.textContent);
        expect(values).toEqual(["张三", "auto-1024"]);
    });

    test("items 响应式：数组整体替换驱动重渲（原地变更不触发为引擎跨域信号边界，文档披露）", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.descriptions="{ items: rows }"></div>`,
            { rows: [{ label: "一", value: "1" }] },
        );
        await nextTick();
        expect(root.querySelectorAll(".asc-descriptions-item").length).toBe(1);
        engine.store.state.rows = [
            { label: "一", value: "1" },
            { label: "二", value: "2" },
        ];
        await nextTick();
        expect(root.querySelectorAll(".asc-descriptions-item").length).toBe(2);
    });

    test("span 跨项位：克隆体 :style 内联 grid-column span N（缺省 1 不落 span）", async () => {
        const { root } = mount(
            `<div x-component:autospark.descriptions="{ items: rows }"></div>`,
            {
                rows: [
                    { label: "全宽行", value: "跨两列", span: 2 },
                    { label: "常规", value: "一列" },
                ],
            },
        );
        await nextTick();
        const items = Array.from(root.querySelectorAll(".asc-descriptions-item"));
        expect(items[0]!.getAttribute("style")).toContain("grid-column: span 2");
        expect(items[1]!.getAttribute("style")).toContain("grid-column: span 1");
    });
});

describe("布局通道（columns / layout / bordered / title）", () => {
    test("columns 列数：JS 通道写 body 容器网格模板（缺省 3）", async () => {
        const { root } = mount(
            `<div x-component:autospark.descriptions="{ items: rows }"></div>`,
            { rows: [{ label: "甲", value: "1" }] },
        );
        await nextTick();
        const body = root.querySelector(".asc-descriptions-body") as HTMLElement;
        expect(body.style.gridTemplateColumns).toContain("repeat(3, minmax(0, 1fr))");
    });

    test("columns 自定义：2 列网格模板 + columns 变化跟随（watch 重同步）", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.descriptions="{ items: rows, columns: cols }"></div>`,
            { rows: [{ label: "甲", value: "1" }], cols: 2 },
        );
        await nextTick();
        const body = root.querySelector(".asc-descriptions-body") as HTMLElement;
        expect(body.style.gridTemplateColumns).toContain("repeat(2, minmax(0, 1fr))");
        engine.store.state.cols = 4;
        await nextTick();
        expect(body.style.gridTemplateColumns).toContain("repeat(4, minmax(0, 1fr))");
    });

    test("bordered 缺省简洁形态 / true 表格形态（data-bordered 通道）", async () => {
        const { root } = mount(
            `<div x-component:autospark.descriptions="{ items: rows }"></div>`,
            { rows: [{ label: "甲", value: "1" }] },
        );
        await nextTick();
        expect(root.querySelector(".asc-descriptions-body")!.getAttribute("data-bordered")).toBe("false");
        const bordered = mount(
            `<div x-component:autospark.descriptions="{ items: rows, bordered: true }"></div>`,
            { rows: [{ label: "甲", value: "1" }] },
        );
        await nextTick();
        expect(bordered.root.querySelector(".asc-descriptions-body")!.getAttribute("data-bordered")).toBe("true");
    });

    test("layout：horizontal 缺省 / vertical 标签在上（data-layout 通道）", async () => {
        const { root } = mount(
            `<div x-component:autospark.descriptions="{ items: rows, layout: 'vertical' }"></div>`,
            { rows: [{ label: "甲", value: "1" }] },
        );
        await nextTick();
        expect(root.querySelector(".asc-descriptions-body")!.getAttribute("data-layout")).toBe("vertical");
        const plain = mount(
            `<div x-component:autospark.descriptions="{ items: rows }"></div>`,
            { rows: [{ label: "甲", value: "1" }] },
        );
        await nextTick();
        expect(plain.root.querySelector(".asc-descriptions-body")!.getAttribute("data-layout")).toBe("horizontal");
    });

    test("title 渲染 + 空值不占位（:empty 通道）", async () => {
        const { root } = mount(
            `<div x-component:autospark.descriptions="{ items: rows, title: '订单信息' }"></div>`,
            { rows: [{ label: "甲", value: "1" }] },
        );
        await nextTick();
        expect(root.querySelector(".asc-descriptions-head")!.textContent).toBe("订单信息");
        const bare = mount(
            `<div x-component:autospark.descriptions="{ items: rows }"></div>`,
            { rows: [{ label: "甲", value: "1" }] },
        );
        await nextTick();
        expect(bare.root.querySelector(".asc-descriptions-head")!.textContent).toBe("");
    });
});

describe("元素名快速写法（precompile 变换，breadcrumb 范式）", () => {
    test("<x-descriptions> 替换为 div 宿主 + 静态属性折叠 props（autostart:false 断言变换产物）", () => {
        const { root } = mount(
            `<div><x-descriptions columns="2" title="静态标题"><span>占位</span></x-descriptions></div>`,
            {},
            { autostart: false },
        );
        const host = root.children[0]!.children[0]!;
        expect(host.tagName).toBe("DIV"); // 替换为 div（无地标语义载体）
        const attrOf = (el: Element, name: string): string | undefined =>
            [...el.attributes].find((a) => a.name === name)?.value;
        const props = attrOf(host, "x-component:autospark.descriptions")!;
        expect(props).toContain("columns: 2"); // 静态数字折叠（类型推断）
        expect(props).toContain('title: "静态标题"');
        expect(host.querySelector("span")!.textContent).toBe("占位"); // 子内容随迁
    });

    test("<x-descriptions-item> 子元素声明：折叠为 items JSON 落 data-items + 声明元素摘除 + 渲染还原", async () => {
        const { root } = mount(
            `<div><x-descriptions title="个人信息">
                <x-descriptions-item label="姓名">张三</x-descriptions-item>
                <x-descriptions-item label="备注" span="2">跨两列</x-descriptions-item>
            </x-descriptions></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("div.asc-descriptions")!;
        expect(host).toBeTruthy();
        expect(root.querySelector("x-descriptions-item")).toBe(null); // 声明元素不残留
        expect(root.querySelectorAll(".asc-descriptions-item").length).toBe(2);
        expect(root.querySelector(".asc-descriptions-label")!.textContent).toBe("姓名");
        expect(root.querySelector(".asc-descriptions-value")!.textContent).toBe("张三");
        const items = root.querySelectorAll(".asc-descriptions-item");
        expect(items[1]!.getAttribute("style")).toContain("grid-column: span 2"); // span 数字推断经 JSON 通道
        expect(host.hasAttribute("data-items")).toBe(false); // mounted 消费后摘除
    });

    test(":items 状态引用在场：data-items 不落盘（props 优先）+ 声明子元素仍摘除", async () => {
        const { root } = mount(
            `<div><x-descriptions :items="rows"><x-descriptions-item label="声明形态被忽略">忽略</x-descriptions-item></x-descriptions></div>`,
            { rows: [{ label: "状态引用", value: "1" }] },
        );
        await nextTick();
        const host = root.querySelector("div.asc-descriptions")!;
        expect(host.hasAttribute("data-items")).toBe(false);
        expect(root.querySelector("x-descriptions-item")).toBe(null);
        expect(root.querySelectorAll(".asc-descriptions-item").length).toBe(1);
        expect(root.querySelector(".asc-descriptions-value")!.textContent).toBe("1");
    });

    test("裸 items 属性（JSON 字符串）走 data-items 通道（不进 props 值对象——字面量数组死环规避）", async () => {
        const { root } = mount(
            `<div><x-descriptions items='[{"label":"JSON 形态","value":"42"}]'></x-descriptions></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-descriptions-label")!.textContent).toBe("JSON 形态");
        expect(root.querySelector(".asc-descriptions-value")!.textContent).toBe("42");
    });
});

describe("样式通道（button 范式 ADR-0012）", () => {
    test("三级回退链 + bordered 间隙显线 + 冒号引导 + 暗色兜底（ADR-0129）", () => {
        const t = tpl();
        expect(t).toContain("font-size: var(--auto-font-size, var(--asc-descriptions-font-size, 0.875rem));");
        expect(t).toContain('content: "：";'); // 简洁 horizontal 冒号引导
        expect(t).toContain('.asc-descriptions-body[data-bordered="true"] {'); // 间隙显线表格形态
        expect(t).toContain('background: var(--auto-secondary-bgcolor, var(--asc-descriptions-label-bg, #fafafa));');
        expect(t).toContain('[dark] .asc-descriptions-body[data-bordered="true"] .asc-descriptions-label,');
        expect(t).toContain('[data-dark] .asc-descriptions-value {');
    });
});
