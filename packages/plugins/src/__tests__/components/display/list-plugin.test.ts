/**
 * list 组件插件测试（组件库 P1，ADR-0018 清单权威表 display 行）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + items 状态引用注入（字面量数组死环
 *   规避，ADR-0019 后果 2）+ 内部 x-for 装配（默认行 label/title/name/value 探测）；
 * - 作用域插槽自定义行：row 出口（virtual/普通双分叉统一走动态名对象形态
 *   `{ name, params }`，ADR-0107——绕开同名出口静态去重，ADR-0056）+ 形参
 *   `{ item, $index }` 项作用域求值 + 调用方解构消费 + 行内事件原生冒泡；
 * - 空态：x-empty special（items 空数组）+ empty 组件组合消费 + empty 插槽整体重载；
 * - 变体通道（bordered/split/virtual）+ loading 经绑定通道组合引擎 x-loading 覆盖层；
 * - 样式通道字符串断言（button 范式 ADR-0012）+ 元素名快速写法 <x-list>。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import "../../../components/display/empty/index"; // 空态兜底组合依赖（跨插件，测试在场注册）
import { LIST_NAME, bootstrapListPlugin } from "../../../components/display/list/index";

describe("list 组件插件（ADR-0018 P1 display）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.list 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[LIST_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${LIST_NAME}"`);
        expect(template).toContain(`x-define:inherit="autospark.base"`); // 主题档位继承（ADR-0134）
        expect(template).toContain(`x-for="item of items"`); // 内部 x-for 装配（ADR-0018 决策 2）
    });

    test("化身渲染：items 状态引用注入 → 默认行渲染（label 键探测）", async () => {
        const { root } = mount(
            `<div x-component:autospark.list="{ items: users }"></div>`,
            { users: [{ label: "张三" }, { label: "李四" }, { label: "王五" }] },
        );
        await nextTick();
        const inner = root.querySelector(".asc-list-inner")!;
        expect(inner).toBeTruthy();
        const items = Array.from(root.querySelectorAll(".asc-list-item"));
        expect(items.length).toBe(3);
        expect(items[0].querySelector(".asc-list-item-text")!.textContent).toBe("张三");
        expect(items[1].querySelector(".asc-list-item-text")!.textContent).toBe("李四");
    });

    test("默认行四键探测：title / name / value 依次兜底 + 标量直出", async () => {
        const { root } = mount(
            `<div x-component:autospark.list="{ items: mixed }"></div>`,
            {
                mixed: [
                    { title: "标题键" },
                    { name: "名称键" },
                    { value: "值键" },
                    "标量项",
                ],
            },
        );
        await nextTick();
        const texts = Array.from(root.querySelectorAll(".asc-list-item-text")).map((n) => n.textContent);
        expect(texts).toEqual(["标题键", "名称键", "值键", "标量项"]);
    });

    test("作用域插槽自定义行：{ item, $index } 解构消费 + 调用方作用域求值", async () => {
        const { root } = mount(
            `<div x-component:autospark.list="{ items: users }">` +
                `<template x-slot:row="{ item, $index }">` +
                `<b class="row-name" x-text="item.name"></b>` +
                `<span class="row-idx" x-text="$index + 1"></span>` +
                `<span class="row-outer" x-text="prefix"></span>` +
                `</template>` +
                `</div>`,
            { users: [{ name: "甲" }, { name: "乙" }], prefix: "调用方" },
        );
        await nextTick();
        const rows = Array.from(root.querySelectorAll(".asc-list-item"));
        expect(rows.length).toBe(2);
        expect(rows[0].querySelector(".row-name")!.textContent).toBe("甲"); // 形参注入
        expect(rows[1].querySelector(".row-idx")!.textContent).toBe("2"); // $index 形参
        expect(rows[0].querySelector(".row-outer")!.textContent).toBe("调用方"); // 调用方作用域链回退
        expect(rows[0].querySelector(".asc-list-item-text")).toBeNull(); // 默认行让位
    });

    test("行内事件原生冒泡：插槽行内容 @click 在调用方作用域触发", async () => {
        const clicked: string[] = [];
        const { root, engine } = mount(
            `<div x-component:autospark.list="{ items: users }">` +
                `<template x-slot:row="{ item }">` +
                `<button class="row-btn" @click="picked = item.name">选 {{ item.name }}</button>` +
                `</template>` +
                `</div>`,
            { users: [{ name: "甲" }], picked: "" },
        );
        await nextTick();
        (root.querySelector(".row-btn") as HTMLElement).click();
        await nextTick();
        expect(engine.store.state.picked).toBe("甲");
        void clicked;
    });

    test("items 响应式：整体替换驱动行数/内容变化（状态引用链路；原地 push 不触发为引擎跨域信号边界，文档披露）", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.list="{ items: users }"></div>`,
            { users: [{ label: "一" }] },
        );
        await nextTick();
        expect(root.querySelectorAll(".asc-list-item").length).toBe(1);
        engine.store.state.users = [{ label: "一" }, { label: "二" }]; // 整体替换（增行）
        await nextTick();
        expect(root.querySelectorAll(".asc-list-item").length).toBe(2);
        engine.store.state.users = [{ label: "新" }]; // 整体替换（减行换内容）
        await nextTick();
        expect(root.querySelectorAll(".asc-list-item").length).toBe(1);
        expect(root.querySelector(".asc-list-item-text")!.textContent).toBe("新");
    });
});

describe("空态（x-empty special + autospark.empty 组合）", () => {
    test("items 空数组：empty 组件兜底渲染（i18n 缺省文案「暂无数据」）+ 行不渲染", async () => {
        const { root } = mount(
            `<div x-component:autospark.list="{ items: users }"></div>`,
            { users: [] },
        );
        await nextTick();
        expect(root.querySelector(".asc-list-item")).toBeNull();
        const emptyHost = root.querySelector(".asc-list-empty .asc-empty")!;
        expect(emptyHost).toBeTruthy(); // 组合消费 autospark.empty
        expect(emptyHost.querySelector(".asc-empty-desc")!.textContent).toBe("暂无数据");
    });

    test("empty 插槽整体重载：自定义空态替换 empty 组件兜底", async () => {
        const { root } = mount(
            `<div x-component:autospark.list="{ items: users }">` +
                `<template x-slot:empty><div class="custom-empty">一条都没有</div></template>` +
                `</div>`,
            { users: [] },
        );
        await nextTick();
        expect(root.querySelector(".custom-empty")!.textContent).toBe("一条都没有");
        expect(root.querySelector(".asc-empty")).toBeNull(); // 兜底组件让位
    });

    test("空 → 有数据切换：空态拆除、行挂载（special 互斥）", async () => {
        const { root, engine } = mount(
            `<div x-component:autospark.list="{ items: users }"></div>`,
            { users: [] },
        );
        await nextTick();
        expect(root.querySelector(".asc-empty")).toBeTruthy();
        engine.store.state.users = [{ label: "来了" }];
        await nextTick();
        expect(root.querySelector(".asc-empty")).toBeNull();
        expect(root.querySelectorAll(".asc-list-item").length).toBe(1);
    });
});

describe("变体与 loading 通道", () => {
    test("bordered 缺省有框 / false 取反落 data-borderless（假值属性移除家族约定）", async () => {
        const { root } = mount(
            `<div x-component:autospark.list="{ items: users }"></div>`,
            { users: [{ label: "甲" }] },
        );
        await nextTick();
        expect(root.querySelector(".asc-list-inner")!.hasAttribute("data-borderless")).toBe(false);
        const bare = mount(
            `<div x-component:autospark.list="{ items: users, bordered: false }"></div>`,
            { users: [{ label: "甲" }] },
        );
        await nextTick();
        expect(bare.root.querySelector(".asc-list-inner")!.getAttribute("data-borderless")).toBe("true");
    });

    test("split 分隔线开关：缺省 data-split 在场 / false 移除", async () => {
        const { root } = mount(
            `<div x-component:autospark.list="{ items: users, split: false }"></div>`,
            { users: [{ label: "甲" }, { label: "乙" }] },
        );
        await nextTick();
        expect(root.querySelector(".asc-list-inner")!.hasAttribute("data-split")).toBe(false);
        const plain = mount(
            `<div x-component:autospark.list="{ items: users }"></div>`,
            { users: [{ label: "甲" }] },
        );
        await nextTick();
        expect(plain.root.querySelector(".asc-list-inner")!.getAttribute("data-split")).toBe("true");
    });

    test("virtual=true：data-virtual 落 inner + 定高滚动容器分叉渲染（策略缺位退化全量，行仍正确）", async () => {
        const { root } = mount(
            `<div x-component:autospark.list="{ items: users, virtual: true }"></div>`,
            { users: Array.from({ length: 5 }, (_, i) => ({ label: `行${i + 1}` })) },
        );
        await nextTick();
        expect(root.querySelector(".asc-list-inner")!.getAttribute("data-virtual")).toBe("true");
        const items = Array.from(root.querySelectorAll(".asc-list-item"));
        expect(items.length).toBe(5); // 未加载 virtual 插件 → 策略缺位 warn 退化全量渲染（降级不失效）
        expect(items[4].querySelector(".asc-list-item-text")!.textContent).toBe("行5");
    });

    test("loading=true：经绑定通道组合引擎 x-loading 覆盖层（铺满列表）", async () => {
        const { root } = mount(
            `<div x-component:autospark.list="{ items: users, loading: busy }"></div>`,
            { users: [{ label: "甲" }], busy: true },
        );
        await nextTick();
        await nextTick(); // 绑定写字面量 → dispatcher 察觉属性 → overlay 挂载（跨微任务）
        const overlay = root.querySelector(".asc-list-inner > .x-loading-overlay");
        expect(overlay).toBeTruthy();
    });
});

describe("样式通道（button 范式 ADR-0012）", () => {
    test("三级回退链 + split 相邻行选择器 + 虚拟容器定高 + 暗色兜底（ADR-0129）", () => {
        const t = ((AutoSpark as { components: Record<string, string> }).components[LIST_NAME] as string)
            .replace(/\s+/g, " "); // ?raw CSS 断言空白归一化（oxfmt 折行防假红）
        expect(t).toContain("font-size: var(--auto-font-size, var(--asc-list-font-size, 0.875rem));");
        expect(t).toContain("background: var(--auto-bgcolor, var(--asc-list-bg, #ffffff));");
        expect(t).toContain('.asc-list-inner[data-borderless="true"] { --asc-line: transparent; }');
        expect(t).toContain('.asc-list-inner[data-split="true"] .asc-list-item + .asc-list-item {');
        expect(t).toContain("height: var(--asc-list-virtual-height, 20em);");
        expect(t).toContain('[dark] .asc-list-inner, [data-dark] .asc-list-inner {');
        expect(t).toContain("background: var(--auto-bgcolor, var(--asc-list-bg, #3a3a3a));");
    });
});

describe("元素名快速写法（ADR-0117 自动组件 / ADR-0133 反查）", () => {
    test("<x-list> 静态属性折叠 props（split 形态；items 动态注入走指令值形态）", async () => {
        const { root } = mount(
            `<div><x-list split="false"></x-list></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".asc-list")!;
        expect(host).toBeTruthy();
        expect(root.querySelector(".asc-list-inner")!.hasAttribute("data-split")).toBe(false);
        expect(host.hasAttribute("split")).toBe(false); // 静态属性已折叠进 props
    });
});

describe("installPlugin 自举（ADR-0003）", () => {
    test("bootstrapListPlugin 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[LIST_NAME];
        bootstrapListPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[LIST_NAME]).toBe(before);
    });
});
