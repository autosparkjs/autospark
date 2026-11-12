/**
 * breadcrumb 组件插件测试（组件库 P1 导航件，ADR-0018 清单权威表 navigation 行）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + 主题档位继承（autospark.base）；
 * - items 数据驱动渲染：链接项/当前项双分支、末项 aria-current="page"、icon、items 状态变化跟随；
 * - 分隔符 separator：缺省文本 / arrow 图标 / 自定义字符，末项分隔符隐藏；
 * - precompile 元素名变换：<x-breadcrumb> → 真 nav 宿主 + 静态属性折叠；
 * - 子元素声明形态：<x-breadcrumb-item> → data-items JSON 通道（字面量数组 props 死环规避）；
 * - 样式通道：三级回退链 + 暗色兜底变体（模板断言，空白归一化）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { BREADCRUMB_NAME, bootstrapBreadcrumbPlugin } from "../../../components/navigation/breadcrumb/index";

/** 组件模板字符串（空白归一化后断言——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
    ((AutoSpark as { components: Record<string, string> }).components[BREADCRUMB_NAME] as string).replace(/\s+/g, " ");

describe("注册面（组件形态官方样板）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.breadcrumb 模板字符串 + 主题档位继承", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[BREADCRUMB_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${BREADCRUMB_NAME}"`);
        expect(template).toContain('x-define:inherit="autospark.base"'); // 主题档位继承（ADR-0134）
    });

    test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[BREADCRUMB_NAME];
        bootstrapBreadcrumbPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[BREADCRUMB_NAME]).toBe(before);
    });
});

describe("items 数据驱动渲染（状态引用注入）", () => {
    test("链接项/当前项双分支：href 在场为真 a，缺席为纯文本；label 经插值渲染", async () => {
        const { root } = mount(
            `<nav x-component:autospark.breadcrumb="{ items: crumbs }"></nav>`,
            {
                crumbs: [
                    { label: "首页", href: "/" },
                    { label: "订单列表", href: "/orders" },
                    { label: "订单详情" },
                ],
            },
        );
        await nextTick();
        expect(root.querySelectorAll(".asc-breadcrumb-item").length).toBe(3);
        const links = root.querySelectorAll(".asc-breadcrumb-link");
        expect(links.length).toBe(2); // 前两项带 href → a 分支
        expect(links[0]!.getAttribute("href")).toBe("/");
        expect(links[1]!.getAttribute("href")).toBe("/orders");
        expect(links[0]!.textContent).toContain("首页");
        const current = root.querySelector(".asc-breadcrumb-current")!;
        expect(current).toBeTruthy(); // 末项无 href → 纯文本分支
        expect(current.textContent).toContain("订单详情");
    });

    test("末项当前页语义：末项恒 aria-current=page（含 href 形态），非末项无该属性", async () => {
        const { root } = mount(
            `<nav x-component:autospark.breadcrumb="{ items: crumbs }"></nav>`,
            { crumbs: [{ label: "首页", href: "/" }, { label: "末项（带 href）", href: "/last" }] },
        );
        await nextTick();
        const items = root.querySelectorAll(".asc-breadcrumb-item");
        expect(items[0]!.querySelector("[aria-current]")).toBe(null); // 非末项无标注
        const lastCrumb = items[1]!.querySelector(".asc-breadcrumb-link")!; // 带 href 的末项走 a 分支
        expect(lastCrumb.getAttribute("aria-current")).toBe("page");
    });

    test("items 状态变化跟随：push 新项后渲染追加（x-for 指令值通道响应）", async () => {
        const { root, engine } = mount(
            `<nav x-component:autospark.breadcrumb="{ items: crumbs }"></nav>`,
            { crumbs: [{ label: "首页", href: "/" }, { label: "列表", href: "/list" }] },
        );
        await nextTick();
        expect(root.querySelectorAll(".asc-breadcrumb-item").length).toBe(2);
        engine.store.state.crumbs.push({ label: "详情" });
        await nextTick();
        expect(root.querySelectorAll(".asc-breadcrumb-item").length).toBe(3);
        // 末项语义迁移：新末项（无 href）承接 aria-current
        const current = root.querySelector(".asc-breadcrumb-current")!;
        expect(current.getAttribute("aria-current")).toBe("page");
        expect(current.textContent).toContain("详情");
    });

    test("项级 icon：x-icon 值通道渲染图标位", async () => {
        const { root } = mount(
            `<nav x-component:autospark.breadcrumb="{ items: crumbs }"></nav>`,
            { crumbs: [{ label: "收藏", href: "/fav", icon: "star" }, { label: "详情" }] },
        );
        await nextTick();
        expect(root.querySelector(".asc-breadcrumb-icon")).toBeTruthy();
    });
});

describe("分隔符（separator）", () => {
    test("缺省 /：文本形态分隔符逐项在场（末项经 CSS :last-child 隐藏，DOM 仍在）", async () => {
        const { root } = mount(
            `<nav x-component:autospark.breadcrumb="{ items: crumbs }"></nav>`,
            { crumbs: [{ label: "首页", href: "/" }, { label: "库", href: "/lib" }, { label: "组件" }] },
        );
        await nextTick();
        const texts = root.querySelectorAll(".asc-breadcrumb-sep-text");
        expect(texts.length).toBe(3); // 每项一枚（末项 CSS 隐藏不摘 DOM）
        expect(texts[0]!.textContent).toBe("/");
        expect(root.querySelector(".asc-breadcrumb-sep-icon")).toBe(null); // 图标形态未启用
    });

    test("arrow 形态：x-icon 内置箭头在场、文本形态退场", async () => {
        const { root } = mount(
            `<nav x-component:autospark.breadcrumb="{ items: crumbs, separator: 'arrow' }"></nav>`,
            { crumbs: [{ label: "首页", href: "/" }, { label: "详情" }] },
        );
        await nextTick();
        expect(root.querySelector(".asc-breadcrumb-sep-icon")).toBeTruthy();
        expect(root.querySelector(".asc-breadcrumb-sep-text")).toBe(null);
    });

    test("自定义字符：任意字符串原样渲染", async () => {
        const { root } = mount(
            `<nav x-component:autospark.breadcrumb="{ items: crumbs, separator: '·' }"></nav>`,
            { crumbs: [{ label: "首页", href: "/" }, { label: "详情" }] },
        );
        await nextTick();
        expect(root.querySelector(".asc-breadcrumb-sep-text")!.textContent).toBe("·");
    });

    test("末项分隔符隐藏规则（模板断言）", () => {
        expect(tpl()).toContain(".asc-breadcrumb-item:last-child .asc-breadcrumb-sep { display: none; }");
    });
});

describe("元素名快速写法（precompile 变换）", () => {
    test("<x-breadcrumb> 替换为真 nav 宿主 + 静态属性折叠 props（autostart:false 断言变换产物）", () => {
        const { root } = mount(
            `<div><x-breadcrumb separator="arrow"><span>占位</span></x-breadcrumb></div>`,
            {},
            { autostart: false },
        );
        const host = root.children[0]!.children[0]!;
        expect(host.tagName).toBe("NAV"); // nav 地标语义保真（link 变换同款路线）
        const attrOf = (el: Element, name: string): string | undefined =>
            [...el.attributes].find((a) => a.name === name)?.value;
        const props = attrOf(host, "x-component:autospark.breadcrumb")!;
        expect(props).toContain('separator: "arrow"'); // 静态字符串折叠
        expect(host.querySelector("span")!.textContent).toBe("占位"); // 子内容随迁
    });

    test("<x-breadcrumb-item> 子元素声明：折叠为 items JSON 落 data-items + 声明元素摘除 + 渲染还原", async () => {
        const { root } = mount(
            `<div><x-breadcrumb>
                <x-breadcrumb-item label="首页" href="/" icon="home"></x-breadcrumb-item>
                <x-breadcrumb-item label="组件库" href="/components"></x-breadcrumb-item>
                <x-breadcrumb-item label="Breadcrumb"></x-breadcrumb-item>
            </x-breadcrumb></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("nav.asc-breadcrumb")!;
        expect(host).toBeTruthy();
        expect(root.querySelector("x-breadcrumb-item")).toBe(null); // 声明元素不残留
        expect(root.querySelectorAll(".asc-breadcrumb-item").length).toBe(3);
        expect(root.querySelectorAll(".asc-breadcrumb-link").length).toBe(2);
        expect(root.querySelector(".asc-breadcrumb-current")!.textContent).toContain("Breadcrumb");
        expect(root.querySelector(".asc-breadcrumb-icon")).toBeTruthy(); // icon 折叠进 JSON 通道
    });

    test(":items 状态引用在场：data-items 不落盘（props 优先）+ 声明子元素仍摘除", async () => {
        const { root } = mount(
            `<div><x-breadcrumb :items="crumbs"><x-breadcrumb-item label="声明形态被忽略"></x-breadcrumb-item></x-breadcrumb></div>`,
            { crumbs: [{ label: "状态引用" }] },
        );
        await nextTick();
        const host = root.querySelector("nav.asc-breadcrumb")!;
        expect(host.hasAttribute("data-items")).toBe(false);
        expect(root.querySelector("x-breadcrumb-item")).toBe(null);
        expect(root.querySelectorAll(".asc-breadcrumb-item").length).toBe(1);
        expect(root.querySelector(".asc-breadcrumb-item")!.textContent).toContain("状态引用");
    });

    test("裸 items 属性（JSON 字符串）走 data-items 通道（不进 props 值对象——字面量数组死环规避）", async () => {
        const { root } = mount(
            `<div><x-breadcrumb items='[{"label":"JSON 形态","href":"/json"}]'></x-breadcrumb></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-breadcrumb-link")!.getAttribute("href")).toBe("/json");
        expect(root.querySelector(".asc-breadcrumb-link")!.textContent).toContain("JSON 形态");
    });
});

describe("样式通道（模板断言）", () => {
    test("三级回退链 + 暗色兜底变体（主题合规红线，ADR-0129）", () => {
        const t = tpl();
        expect(t).toContain("color: var(--auto-secondary-color, var(--asc-breadcrumb-color, rgba(0, 0, 0, 0.55)));");
        expect(t).toContain("color: var(--auto-primary-color, var(--asc-breadcrumb-link, #009aff));");
        expect(t).toContain("color: var(--auto-color, var(--asc-breadcrumb-current, #606060));");
        expect(t).toContain("[dark] .asc-breadcrumb-link,");
        expect(t).toContain("[data-dark] .asc-breadcrumb-sep {");
    });
});
