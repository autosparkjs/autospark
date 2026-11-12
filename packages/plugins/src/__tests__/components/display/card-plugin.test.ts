/**
 * card 组件插件测试（组件库 P0 / display 分类首件，ADR-0019）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + 结构四段（head/body/footer/extra）；
 * - 插槽投影：默认插槽（body）、具名插槽（header 整体重载 / extra / footer）；
 * - 可折叠头部（collapsible 组合 x-show）：点击翻转 + collapse 事件冒泡；
 * - 变体数据属性通道（bordered/hoverable）+ 样式通道字符串断言；
 * - 元素名快速写法 <x-card>（ADR-0117/0133 懒预编译反查）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { CARD_NAME, bootstrapCardPlugin } from "../../../components/display/card/index";

describe("card 组件插件（ADR-0019 P0）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.card 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[CARD_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${CARD_NAME}"`);
        expect(template).toContain(`x-define:inherit="autospark.base"`); // 主题档位继承（ADR-0134）
    });

    test("化身渲染：title 落头、默认插槽落 body、四段结构齐备", async () => {
        const { root } = mount(
            `<div x-component:autospark.card="{ title: '卡片标题' }">正文内容</div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".asc-card")!;
        expect(host).toBeTruthy();
        expect(host.querySelector(".asc-card-inner")).toBeTruthy();
        expect(host.querySelector(".asc-card-head-main")!.textContent).toBe("卡片标题");
        expect(host.querySelector(".asc-card-body")!.textContent).toBe("正文内容");
        expect(host.querySelector(".asc-card-arrow")).toBeNull(); // 不可折叠无箭头
    });

    test("具名插槽：header 整体重载 + extra + footer 投影", async () => {
        const { root } = mount(
            `<div x-component:autospark.card="{ title: '被覆盖的标题' }">` +
                `<template x-slot:header><b>自定义头</b></template>` +
                `<template x-slot:extra><i>更多</i></template>` +
                `<template x-slot:footer><span>底部动作</span></template>` +
                `正文</div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-card-head-main")!.textContent).toBe("自定义头"); // 槽内容优先于 title 兜底
        expect(root.querySelector(".asc-card-head-main")!.textContent).not.toContain("被覆盖的标题");
        expect(root.querySelector(".asc-card-extra")!.textContent).toBe("更多");
        expect(root.querySelector(".asc-card-footer")!.textContent).toBe("底部动作");
    });

    test("变体数据属性：bordered 取反落 borderless（假值属性移除家族约定），hoverable 落 inner", async () => {
        const { root } = mount(
            `<div x-component:autospark.card="{ title: 'T', bordered: false, hoverable: true, collapsible: true, collapsed: false }"></div>`,
            {},
        );
        await nextTick();
        const inner = root.querySelector(".asc-card-inner")!;
        expect(inner.getAttribute("data-borderless")).toBe("true"); // bordered=false 取反为 borderless=true
        expect(inner.getAttribute("data-hoverable")).toBe("true");
        const plain = mount(`<div x-component:autospark.card="{ title: 'T' }"></div>`, {});
        await nextTick();
        const plainInner = plain.root.querySelector(".asc-card-inner")!;
        expect(plainInner.hasAttribute("data-borderless")).toBe(false); // 缺省有边框（属性移除）
        expect(plainInner.hasAttribute("data-hoverable")).toBe(false);
        const head = root.querySelector(".asc-card-head")!;
        expect(head.getAttribute("data-collapsible")).toBe("true");
        expect(head.hasAttribute("data-collapsed")).toBe(false); // 假值属性移除（绑定家族约定）
        expect(root.querySelector(".asc-card-arrow")).toBeTruthy(); // 可折叠出箭头
    });
});

describe("可折叠头部（collapsible 组合 x-show）", () => {
    test("点击标题区：body/footer 隐藏（display:none）+ collapse 事件冒泡 detail", async () => {
        const events: Array<Record<string, unknown>> = [];
        const { root } = mount(
            `<div x-component:autospark.card="{ title: '可折叠', collapsible: true }">` +
                `<template x-slot:footer><span>F</span></template>` +
                `内容</div>`,
            {},
        );
        await nextTick();
        root.addEventListener("collapse", (e) => { events.push((e as CustomEvent).detail as Record<string, unknown>); });
        const toggle = root.querySelector(".asc-card-toggle") as HTMLElement;
        const body = root.querySelector(".asc-card-body") as HTMLElement;
        const footer = root.querySelector(".asc-card-footer") as HTMLElement;

        toggle.click();
        await nextTick();
        expect(events.length).toBe(1);
        expect(events[0].collapsed).toBe(true);
        expect(body.style.display).toBe("none"); // x-show display:none
        expect(footer.style.display).toBe("none");
        expect(root.querySelector(".asc-card-head")!.getAttribute("data-collapsed")).toBe("true");

        toggle.click();
        await nextTick();
        expect(events.length).toBe(2);
        expect(events[1].collapsed).toBe(false);
        expect(body.style.display).not.toBe("none");
        expect(root.querySelector(".asc-card-head")!.hasAttribute("data-collapsed")).toBe(false);
    });

    test("collapsed 外部受控：props 翻转驱动显隐（不广播 collapse——防回环）", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.card="{ title: '受控', collapsible: true, collapsed: shut }">内容</div>`,
            { shut: true },
        );
        await nextTick();
        const body = root.querySelector(".asc-card-body") as HTMLElement;
        expect(body.style.display).toBe("none"); // 初始折叠
        engine.store.state.shut = false; // 外部展开
        await nextTick();
        expect(body.style.display).not.toBe("none");
        expect(root.querySelector(".asc-card-head")!.hasAttribute("data-collapsed")).toBe(false);
    });

    test("不可折叠时点击头部无动作（无 collapse 事件）", async () => {
        const { root } = mount(
            `<div x-component:autospark.card="{ title: '静止' }">内容</div>`,
            {},
        );
        await nextTick();
        let fired = false;
        root.addEventListener("collapse", () => { fired = true; });
        (root.querySelector(".asc-card-toggle") as HTMLElement).click();
        await nextTick();
        expect(fired).toBe(false);
        expect((root.querySelector(".asc-card-body") as HTMLElement).style.display).not.toBe("none");
    });
});

describe("样式通道（button 范式 ADR-0012）", () => {
    test("三级回退链 + 阴影走 data-shadow 通道 + 暗色兜底（ADR-0129）", () => {
        const t = ((AutoSpark as { components: Record<string, string> }).components[CARD_NAME] as string)
            .replace(/\s+/g, " "); // ?raw CSS 断言空白归一化（oxfmt 折行防假红）
        expect(t).toContain("background: var(--auto-bgcolor, var(--asc-card-bg, #ffffff));");
        expect(t).toContain("box-shadow: var(--auto-shadow, var(--asc-card-shadow, 0 1px 2px rgba(0, 0, 0, 0.04)));");
        expect(t).toContain('.asc-card-inner[data-borderless="true"] { --asc-line: transparent; }');
        expect(t).toContain('.asc-card-inner[data-hoverable="true"]:hover {');
        expect(t).toContain('[dark] .asc-card-inner, [data-dark] .asc-card-inner {');
        expect(t).toContain("--asc-line: var(--auto-border-color, var(--asc-card-border-color, #4d4d4d));");
    });
});

describe("元素名快速写法（ADR-0117 自动组件 / ADR-0133 反查）", () => {
    test("<x-card> 静态属性折叠 props + 子内容为默认插槽", async () => {
        const { root } = mount(
            `<div><x-card title="标签写法" collapsible="true">标签体内容</x-card></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".asc-card")!;
        expect(host).toBeTruthy();
        expect(host.querySelector(".asc-card-head-main")!.textContent).toBe("标签写法");
        expect(host.querySelector(".asc-card-body")!.textContent).toBe("标签体内容");
        expect(host.querySelector(".asc-card-head")!.getAttribute("data-collapsible")).toBe("true");
        expect(host.hasAttribute("title")).toBe(false); // 静态属性已折叠进 props
    });
});

describe("installPlugin 自举（ADR-0003）", () => {
    test("bootstrapCardPlugin 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[CARD_NAME];
        bootstrapCardPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[CARD_NAME]).toBe(before);
    });
});
