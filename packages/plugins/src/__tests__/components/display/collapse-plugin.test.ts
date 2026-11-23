/**
 * collapse 组件插件测试（组件库 P2 展示件，ADR-0018 清单权威表 display 行 / 决策 3
 * 裁定入清单：x-foldable 单面板 + 「组 + 互斥手风琴」增量）：
 * - 组件形态官方样板：全局表注册 + 主题档位继承（autospark.base）+ x-foldable 边界声明；
 * - items 数据形态：headers 渲染（title/disabled）+ content HTML 字符串（x-html）；
 * - 值通道：value 受控开合（data-open 属性 + aria-expanded 同步通道）、点击切换
 *   change detail={value} + input 回写、accordion 互斥、el.value 劫持桥；
 * - 子元素声明形态：precompile 展开为面板结构（item/header/content 三层 + 子内容随迁）、
 *   默认插槽投影（消费者作用域绑定可用）、声明面板切换与禁用拦截；
 * - 展开图标位置（expandIconPosition）绑定 + grid 高度过渡样式（模板断言）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { COLLAPSE_NAME, bootstrapCollapsePlugin } from "../../../components/display/collapse/index";

/** 组件模板字符串（空白归一化后断言——oxfmt 折行使逐字匹配假红） */
const tpl = () =>
    ((AutoSpark as { components: Record<string, string> }).components[COLLAPSE_NAME] as string).replace(/\s+/g, " ");

/** 按面板 key 取面板容器 */
const itemOf = (root: Element, key: string) =>
    root.querySelector(`.asc-collapse-item[data-key="${key}"]`);

/** 按面板 key 取头部按钮 */
const headerOf = (root: Element, key: string) =>
    root.querySelector(`.asc-collapse-header[data-key="${key}"]`) as HTMLButtonElement | null;

describe("注册面（组件形态官方样板）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.collapse 模板字符串 + 主题档位继承", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[COLLAPSE_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${COLLAPSE_NAME}"`);
        expect(template).toContain('x-define:inherit="autospark.base"'); // 主题档位继承（ADR-0134）
    });

    test("bootstrap 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[COLLAPSE_NAME];
        bootstrapCollapsePlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[COLLAPSE_NAME]).toBe(before);
    });

    test("面板开合自实现 CSS 高度过渡（grid-rows 收张动画）", () => {
        const t = tpl();
        expect(t).toContain("grid-template-rows: 0fr");
        expect(t).toContain("grid-template-rows: 1fr");
        expect(t).toContain(".asc-collapse-item[data-open] > .asc-collapse-content");
    });
});

describe("items 数据形态", () => {
    test("渲染：面板逐项生成（title 经 {{}}），disabled 原生禁用，content HTML 字符串经 x-html", async () => {
        const { root } = mount(
            `<div x-component:autospark.collapse="{ items: panels }"></div>`,
            {
                panels: [
                    { key: "a", title: "面板一", content: "<b>内容A</b>" },
                    { key: "b", title: "面板二", content: "<p>内容B</p>" },
                    { key: "c", title: "禁用面板", disabled: true, content: "C" },
                ],
            },
        );
        await nextTick();
        const items = root.querySelectorAll(".asc-collapse-item");
        expect(items.length).toBe(3);
        expect(items[0]!.querySelector(".asc-collapse-title")!.textContent).toContain("面板一");
        expect(items[0]!.querySelector(".asc-collapse-inner b")!.textContent).toBe("内容A"); // x-html 渲染
        expect(headerOf(root, "c")!.disabled).toBe(true); // 原生禁用
    });

    test("value 受控开合：注入 key 集驱动 data-open 属性 + aria-expanded 同步通道", async () => {
        const { root } = mount(
            `<div x-component:autospark.collapse="{ items: panels, value: open }"></div>`,
            {
                panels: [
                    { key: "a", title: "A", content: "内容A" },
                    { key: "b", title: "B", content: "内容B" },
                ],
                open: ["a"],
            },
        );
        await nextTick();
        expect(itemOf(root, "a")!.hasAttribute("data-open")).toBe(true);
        expect(itemOf(root, "b")!.hasAttribute("data-open")).toBe(false);
        expect(headerOf(root, "a")!.getAttribute("aria-expanded")).toBe("true");
        expect(headerOf(root, "b")!.getAttribute("aria-expanded")).toBe("false");
    });

    test("点击切换：change 冒泡 detail={value} + input 派发 + data-open/aria 同步迁移", async () => {
        const changes: unknown[] = [];
        const { root, engine } = mount(
            `<div @change="changes.push($event.detail)">
                <div x-model="open" x-component:autospark.collapse="{ items: panels }"></div>
            </div>`,
            {
                panels: [
                    { key: "a", title: "A", content: "内容A" },
                    { key: "b", title: "B", content: "内容B" },
                ],
                open: [],
                changes,
            },
        );
        await nextTick();
        headerOf(root, "a")!.click();
        await nextTick();
        expect(changes).toEqual([{ value: ["a"] }]); // change detail={value}（新 key 数组）
        expect(engine.store.state.open).toEqual(["a"]); // input 派发 → x-model 回写
        expect(itemOf(root, "a")!.hasAttribute("data-open")).toBe(true);
        expect(headerOf(root, "a")!.getAttribute("aria-expanded")).toBe("true");
        // 再点关掉：移除 key
        headerOf(root, "a")!.click();
        await nextTick();
        expect(changes).toEqual([{ value: ["a"] }, { value: [] }]);
        expect(itemOf(root, "a")!.hasAttribute("data-open")).toBe(false);
    });

    test("accordion 互斥：开新面板关闭已开面板（同时仅一开）；禁用面板点击无效", async () => {
        const changes: unknown[] = [];
        const { root } = mount(
            `<div @change="changes.push($event.detail)">
                <div x-component:autospark.collapse="{ items: panels, accordion: true, value: ['a'] }"></div>
            </div>`,
            {
                panels: [
                    { key: "a", title: "A", content: "内容A" },
                    { key: "b", title: "B", content: "内容B" },
                    { key: "c", title: "禁用", disabled: true, content: "C" },
                ],
                changes,
            },
        );
        await nextTick();
        headerOf(root, "b")!.click();
        await nextTick();
        expect(changes).toEqual([{ value: ["b"] }]); // 互斥：a 关、b 开（新集只含 b）
        expect(itemOf(root, "a")!.hasAttribute("data-open")).toBe(false);
        expect(itemOf(root, "b")!.hasAttribute("data-open")).toBe(true);
        headerOf(root, "c")!.click(); // 原生 disabled：click 不派发
        await nextTick();
        expect(changes.length).toBe(1); // 禁用面板不动作
    });

    test("el.value 劫持桥：读 = key 数组快照；写 = 数组/分隔字符串归一（静默受控）", async () => {
        const changes: unknown[] = [];
        const { root } = mount(
            `<div @change="changes.push($event.detail)">
                <div x-component:autospark.collapse="{ items: panels }"></div>
            </div>`,
            {
                panels: [
                    { key: "a", title: "A", content: "内容A" },
                    { key: "b", title: "B", content: "内容B" },
                ],
                changes,
            },
        );
        await nextTick();
        const host = root.querySelector(".asc-collapse") as unknown as { value: unknown };
        expect(host.value).toEqual([]); // 读 = 数组快照
        (host as { value: unknown }).value = "a, b"; // 写 = 分隔字符串归一
        await nextTick();
        expect(itemOf(root, "a")!.hasAttribute("data-open")).toBe(true);
        expect(itemOf(root, "b")!.hasAttribute("data-open")).toBe(true);
        expect(changes).toEqual([]); // 桥写静默（受控语义，不广播）
    });

    test("props value 受控单向：state 数组整体替换 → 开合集迁移（无点击不广播）", async () => {
        const changes: unknown[] = [];
        const { root, engine } = mount(
            `<div @change="changes.push($event.detail)">
                <div x-component:autospark.collapse="{ items: panels, value: open }"></div>
            </div>`,
            {
                panels: [
                    { key: "a", title: "A", content: "内容A" },
                    { key: "b", title: "B", content: "内容B" },
                ],
                open: [],
                changes,
            },
        );
        await nextTick();
        engine.store.state.open = ["b"];
        await nextTick();
        expect(itemOf(root, "b")!.hasAttribute("data-open")).toBe(true);
        expect(changes).toEqual([]); // props 驱动不广播（防回环）
    });
});

describe("子元素声明形态（precompile 展开）", () => {
    test("声明展开：面板三层结构（item/header/content+inner）+ 子内容随迁 + 声明元素摘除", async () => {
        const { root } = mount(
            `<div><x-collapse>
                <x-collapse-item key="a" title="面板一"><span class="c1">内容一</span></x-collapse-item>
                <x-collapse-item key="b" title="面板二"><span class="c2">内容二</span></x-collapse-item>
                <x-collapse-item key="c" title="禁用" disabled>内容三</x-collapse-item>
            </x-collapse></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector("x-collapse-item")).toBe(null); // 声明元素不残留
        expect(root.querySelectorAll(".asc-collapse-item").length).toBe(3);
        const first = itemOf(root, "a")!;
        expect(first.querySelector(".asc-collapse-header")!.getAttribute("data-key")).toBe("a");
        expect(first.querySelector(".asc-collapse-title")!.textContent).toBe("面板一");
        expect(first.querySelector(".asc-collapse-inner .c1")!.textContent).toBe("内容一"); // 子内容随迁
        expect(headerOf(root, "c")!.disabled).toBe(true); // 裸 disabled 归一原生禁用
        expect(first.querySelector(".asc-collapse-icon")).toBeTruthy(); // 展开图标（arrow）
    });

    test("声明面板切换：投影结构经默认插槽落组件树、根委托点击开合 + value 受控初值", async () => {
        const changes: unknown[] = [];
        const { root } = mount(
            `<div @change="changes.push($event.detail)">
                <x-collapse :value="open">
                    <x-collapse-item key="a" title="A"><span class="ca">A 内容</span></x-collapse-item>
                    <x-collapse-item key="b" title="B"><span class="cb">B 内容</span></x-collapse-item>
                </x-collapse>
            </div>`,
            { open: ["b"], changes },
        );
        await nextTick();
        expect(itemOf(root, "b")!.hasAttribute("data-open")).toBe(true); // props value 初值开合
        expect(itemOf(root, "a")!.hasAttribute("data-open")).toBe(false);
        headerOf(root, "a")!.click();
        await nextTick();
        expect(changes).toEqual([{ value: ["b", "a"] }]); // 追加（非手风琴）
        expect(itemOf(root, "a")!.hasAttribute("data-open")).toBe(true);
    });

    test("投影面板内容绑定可用（消费者作用域编译）+ accordion 静态折叠", async () => {
        const changes: unknown[] = [];
        const { root, engine } = mount(
            `<div @change="changes.push($event.detail)">
                <x-collapse accordion>
                    <x-collapse-item key="a" title="A">计数：{{ count }}</x-collapse-item>
                    <x-collapse-item key="b" title="B">静态内容 B</x-collapse-item>
                </x-collapse>
            </div>`,
            { count: 7, changes },
        );
        await nextTick();
        const inner = itemOf(root, "a")!.querySelector(".asc-collapse-inner")!;
        expect(inner.textContent).toContain("计数：7"); // 投影内容在消费者作用域求值
        engine.store.state.count = 8;
        await nextTick();
        expect(inner.textContent).toContain("计数：8"); // 绑定响应
        headerOf(root, "a")!.click();
        headerOf(root, "b")!.click();
        await nextTick();
        expect(changes).toEqual([{ value: ["a"] }, { value: ["b"] }]); // accordion 互斥（静态折叠 props）
    });

    test("裸 items JSON 属性走 data-items 通道（不进 props 值对象——字面量数组死环规避）", async () => {
        const { root } = mount(
            `<div><x-collapse items='[{"key":"a","title":"JSON 面板","content":"<i>内容</i>"}]'></x-collapse></div>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-collapse-title")!.textContent).toContain("JSON 面板");
        expect(root.querySelector(".asc-collapse-inner i")).toBeTruthy(); // content x-html 渲染
    });
});

describe("变体与样式（模板断言）", () => {
    test("expandIconPosition 绑定落 body（T4=B）+ start 形态块在场", () => {
        const t = tpl();
        expect(t).toContain(':data-expand-position="expandIconPosition"');
        expect(t).toContain('.asc-collapse-body[data-expand-position="start"] .asc-collapse-header');
    });

    test("组级边框/暗色兜底变体在场（ADR-0129）+ prefers-reduced-motion 停播", () => {
        const t = tpl();
        expect(t).toContain("[dark] .asc-collapse-body,");
        expect(t).toContain("[data-dark] .asc-collapse-header:disabled");
        expect(t).toContain("prefers-reduced-motion: reduce");
    });
});
