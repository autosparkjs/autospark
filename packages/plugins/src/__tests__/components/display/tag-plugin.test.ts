/**
 * tag 组件插件测试（组件库 P0，ADR-0019）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + 语义色/形态正交变体通道（button 范式）；
 * - icon 双形态（字符串 / { name } 对象）；
 * - closable 关闭链路：close 事件冒泡（cancelable，detail = { event }）+
 *   未 preventDefault 自动隐藏（closed 通道）/ preventDefault 外部接管；
 * - 元素名快速写法 <x-tag>（ADR-0117/0133 懒预编译反查）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { TAG_NAME, bootstrapTagPlugin } from "../../../components/display/tag/index";

describe("tag 组件插件（ADR-0019 P0）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.tag 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[TAG_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${TAG_NAME}"`);
        expect(template).toContain(`x-define:inherit="autospark.base"`); // 主题档位继承（ADR-0134）
    });

    test("化身渲染：插槽文字落 label 出口 + 缺省变体落 body 数据属性", async () => {
        const { root } = mount(
            `<span x-component:autospark.tag="{}">进行中</span>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("span.asc-tag")!;
        expect(host).toBeTruthy();
        expect(host.querySelector(".asc-tag-label")!.textContent).toBe("进行中");
        const body = host.querySelector(".asc-tag-body")!;
        expect(body.getAttribute("data-type")).toBe("default"); // 缺省中性档
        expect(body.getAttribute("data-variant")).toBe("light"); // 缺省淡底形态
        expect(body.hasAttribute("data-closed")).toBe(false); // 假值属性移除（绑定家族约定）
    });

    test("语义色/形态正交：type 与 variant 独立落 body 数据属性", async () => {
        const { root } = mount(
            `<span x-component:autospark.tag="{ type: 'danger', variant: 'solid' }">失败</span>`,
            {},
        );
        await nextTick();
        const body = root.querySelector(".asc-tag-body")!;
        expect(body.getAttribute("data-type")).toBe("danger");
        expect(body.getAttribute("data-variant")).toBe("solid");
    });

    test("icon 双形态：字符串图标名与 { name } 对象均出图标位", async () => {
        const { root } = mount(
            `<span x-component:autospark.tag="{ icon: 'star' }">星标</span>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-tag-icon")).toBeTruthy();
        const obj = mount(
            `<span x-component:autospark.tag="{ icon: ic }">对象</span>`,
            { ic: { name: "info" } }, // 引用注入规避字面量对象 props 死环（家族已知缺陷修复在途）
        );
        await nextTick();
        expect(obj.root.querySelector(".asc-tag-icon")).toBeTruthy();
    });
});

describe("closable 关闭链路", () => {
    test("关闭钮点击：close 事件冒泡（detail 含原始事件）+ 自动置 closed 隐藏通道", async () => {
        const { root } = mount(
            `<span x-component:autospark.tag="{ closable: true }">可关闭</span>`,
            {},
        );
        await nextTick();
        let detail: Record<string, unknown> | undefined;
        root.addEventListener("close", (e) => { detail = (e as CustomEvent).detail as Record<string, unknown>; });
        const close = root.querySelector(".asc-tag-close") as HTMLElement;
        expect(close).toBeTruthy();

        close.click();
        await nextTick();
        expect(detail).toBeTruthy();
        expect((detail as { event: unknown }).event).toBeTruthy(); // detail = { event } 原始点击事件
        expect(root.querySelector(".asc-tag-body")!.getAttribute("data-closed")).toBe("true"); // 自动隐藏通道
    });

    test("preventDefault 外部接管：close 事件可达但不自动隐藏", async () => {
        const { root } = mount(
            `<span x-component:autospark.tag="{ closable: true }">受控关闭</span>`,
            {},
        );
        await nextTick();
        root.addEventListener("close", (e) => { e.preventDefault(); });
        (root.querySelector(".asc-tag-close") as HTMLElement).click();
        await nextTick();
        expect(root.querySelector(".asc-tag-body")!.hasAttribute("data-closed")).toBe(false); // 外部接管关闭时机
    });

    test("closed 受控重现：外部翻 false 摘除隐藏通道", async () => {
        const { root, engine } = mount(
            `<span x-component:autospark.tag="{ closable: true, closed: shut }">标签</span>`,
            { shut: true },
        );
        await nextTick();
        expect(root.querySelector(".asc-tag-body")!.getAttribute("data-closed")).toBe("true");
        engine.store.state.shut = false; // 受控重现
        await nextTick();
        expect(root.querySelector(".asc-tag-body")!.hasAttribute("data-closed")).toBe(false);
    });
});

describe("样式通道（button 范式 ADR-0012）", () => {
    test("语义色 --asc-tone 中转 + 三级回退链 + 暗色兜底（ADR-0129）", () => {
        const t = ((AutoSpark as { components: Record<string, string> }).components[TAG_NAME] as string)
            .replace(/\s+/g, " "); // ?raw CSS 断言空白归一化（oxfmt 折行防假红）
        expect(t).toContain('.asc-tag:has(> .asc-tag-body[data-type="danger"]) { --asc-tone: var(--auto-danger-color, var(--asc-tag-danger, #ef4444)); }');
        expect(t).toContain('.asc-tag:has(> .asc-tag-body[data-type="default"]) { --asc-tone: var(--auto-color, var(--asc-tag-color, #606060)); }');
        expect(t).toContain('.asc-tag:has(> .asc-tag-body[data-variant="solid"]) {');
        expect(t).toContain(".asc-tag:has(> .asc-tag-body[data-closed=\"true\"]) { display: none; }");
        expect(t).toContain("[dark] .asc-tag:has(> .asc-tag-body[data-type=\"danger\"]),");
        expect(t).toContain("--asc-tone: var(--auto-danger-color, var(--asc-tag-danger, #e6696a));");
    });
});

describe("元素名快速写法（ADR-0117 自动组件 / ADR-0133 反查）", () => {
    test("<x-tag> 静态属性折叠 props + 子内容为默认插槽", async () => {
        const { root } = mount(
            `<div><x-tag type="success" variant="outline">成功</x-tag></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".asc-tag")!;
        expect(host).toBeTruthy();
        expect(host.querySelector(".asc-tag-label")!.textContent).toBe("成功");
        const body = host.querySelector(".asc-tag-body")!;
        expect(body.getAttribute("data-type")).toBe("success");
        expect(body.getAttribute("data-variant")).toBe("outline");
        expect(host.hasAttribute("type")).toBe(false); // 静态属性已折叠进 props
    });
});

describe("installPlugin 自举（ADR-0003）", () => {
    test("bootstrapTagPlugin 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[TAG_NAME];
        bootstrapTagPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[TAG_NAME]).toBe(before);
    });
});
