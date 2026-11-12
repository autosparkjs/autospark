/**
 * link 组件插件测试（组件库 P0 轻件，ADR-0019）：
 * - 组件形态官方样板：全局表注册 + 化身渲染 + 语义色变体通道（button 范式 ADR-0012）；
 * - href / target / rel 原生属性同步（化身路径约束的 JS 通道）与 _blank 安全补 noopener；
 * - disabled 链路：摘 href + aria-disabled + 点击拦截；
 * - precompile 元素名变换：<x-link> 折叠 props 并替换为真 a 元素（ADR-0133 止血范式）。
 */
import "../../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../../helpers";
import { LINK_NAME, bootstrapLinkPlugin } from "../../../components/general/link/index";

describe("link 组件插件（ADR-0019 P0 轻件）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.link 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[LINK_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${LINK_NAME}"`);
        expect(template).toContain(`x-define:inherit="autospark.base"`); // 主题档位继承（ADR-0134）
    });

    test("化身渲染：宿主为 a 元素 + label 文案 + 语义色变体落 body", async () => {
        const { root } = mount(
            `<a x-component:autospark.link="{ label: '文档中心', href: 'https://example.com' }"></a>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("a.asc-link")!;
        expect(host).toBeTruthy();
        expect(host.querySelector(".asc-link-body")!.getAttribute("data-type")).toBe("primary"); // 缺省主色
        expect(host.textContent).toContain("文档中心");
    });

    test("插槽内容优先于 label 兜底", async () => {
        const { root } = mount(
            `<a x-component:autospark.link="{ href: '#' }">插槽链接</a>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-link-label")!.textContent).toContain("插槽链接");
    });

    test("语义色轴：default 中性档 + 下划线档位落 body 数据属性", async () => {
        const { root } = mount(
            `<a x-component:autospark.link="{ label: '中性', type: 'default', underline: 'always' }"></a>`,
            {},
        );
        await nextTick();
        const body = root.querySelector(".asc-link-body")!;
        expect(body.getAttribute("data-type")).toBe("default");
        expect(body.getAttribute("data-underline")).toBe("always");
    });

    test("样式通道：语义色对齐 button 范式（--asc-tone 中转 + 三级回退链 + 暗色兜底）", () => {
        const t = ((AutoSpark as { components: Record<string, string> }).components[LINK_NAME] as string)
            .replace(/\s+/g, " ");
        expect(t).toContain('.asc-link:has(> .asc-link-body[data-type="danger"]) { --asc-tone: var(--auto-danger-color, var(--asc-link-danger,');
        expect(t).toContain('.asc-link:has(> .asc-link-body[data-type="default"]) { --asc-tone: var(--auto-color, var(--asc-link-color,');
        expect(t).toContain('.asc-link:has(> .asc-link-body[data-underline="always"]) { text-decoration: underline; }');
        expect(t).toContain('[dark] .asc-link:has(> .asc-link-body[data-type="danger"]),');
    });
});

describe("原生属性同步（化身路径约束 JS 通道）", () => {
    test("href/target 同步宿主 a；href 空为非链接态（无 href 属性）", async () => {
        const { root } = mount(
            `<a x-component:autospark.link="{ label: '外链', href: 'https://example.com', target: '_blank' }"></a>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("a.asc-link")!;
        expect(host.getAttribute("href")).toBe("https://example.com");
        expect(host.getAttribute("target")).toBe("_blank");
        expect(host.getAttribute("rel")).toBe("noopener"); // _blank 自动补安全默认

        const plain = mount(`<a x-component:autospark.link="{ label: '提示态' }"></a>`, {});
        await nextTick();
        const plainHost = plain.root.querySelector("a.asc-link")!;
        expect(plainHost.hasAttribute("href")).toBe(false);
        expect(plainHost.hasAttribute("target")).toBe(false);
    });

    test("target=_blank 显式 rel 优先（自动补全不覆盖）", async () => {
        const { root } = mount(
            `<a rel="external" x-component:autospark.link="{ label: '显式', href: 'https://example.com', target: '_blank' }"></a>`,
            {},
        );
        await nextTick();
        expect(root.querySelector("a.asc-link")!.getAttribute("rel")).toBe("external");
    });

    test("disabled：摘 href + aria-disabled 标注 + 点击被拦截（defaultPrevented）", async () => {
        const { root, engine } = mount(
            `<a x-component:autospark.link="{ label: '禁用', href: '/go', disabled: true }"></a>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("a.asc-link")!;
        expect(host.hasAttribute("href")).toBe(false); // 不可达
        expect(host.getAttribute("aria-disabled")).toBe("true");
        let fired = false;
        host.addEventListener("click", () => { fired = true; });
        const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
        host.dispatchEvent(ev);
        expect(fired).toBe(true); // 事件本身仍冒泡（监听可达），仅默认导航动作被拦
        expect(ev.defaultPrevented).toBe(true);

        // 恢复：disabled 翻 false → href 写回、aria 摘除
        const hostScope = engine.getComponent(host);
        (hostScope as unknown as { data: Record<string, unknown> }).data.disabled = false;
        await nextTick();
        expect(host.getAttribute("href")).toBe("/go");
        expect(host.hasAttribute("aria-disabled")).toBe(false);
    });

    test("icon 渲染：字符串与对象 { name } 双形态均出图标位", async () => {
        const { root } = mount(
            `<a x-component:autospark.link="{ label: '外链', icon: 'external' }"></a>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-link-icon")).toBeTruthy();
        // 对象形态经状态引用注入（button tags 同款规避）：引擎对值对象内的字面量
        // 对象/数组 props 存在 _propsEqual 引用比较死循环缺陷（修复在途），引用形态稳定
        const obj = mount(
            `<a x-component:autospark.link="{ label: '对象', icon: ic }"></a>`,
            { ic: { name: "file" } },
        );
        await nextTick();
        expect(obj.root.querySelector(".asc-link-icon")).toBeTruthy();
    });
});

describe("元素名快速写法（precompile 变换，ADR-0133 止血范式）", () => {
    test("<x-link> 静态属性折叠 props + 宿主替换为真 a 元素（原生导航语义保真）", async () => {
        const { root } = mount(
            `<div><x-link id="lk" href="https://example.com" label="标签写法" type="danger">子内容</x-link></div>`,
            {},
        );
        await nextTick();
        const host = root.querySelector("#lk") as HTMLAnchorElement;
        expect(host.tagName).toBe("A"); // 宿主已替换为真 a（x-link 化身丢原生语义的家族教训）
        expect(host.hasAttribute("label")).toBe(false); // 静态属性已被折叠（不残留在宿主）
        expect(host.getAttribute("href")).toBe("https://example.com"); // props 经 mounted 同步回宿主
        expect(host.querySelector(".asc-link-body")!.getAttribute("data-type")).toBe("danger");
        expect(host.textContent).toContain("子内容"); // 子内容随迁为默认插槽（插槽优先，label 兜底不渲染）
        expect(host.textContent).not.toContain("标签写法");
    });

    test(":href 响应式项以原始表达式拼进 props 值对象", async () => {
        const { root, engine } = mount(
            `<div><x-link :href="url" label="动态"></x-link></div>`,
            { url: "https://a.dev" },
        );
        await nextTick();
        const host = root.querySelector("a.asc-link")!;
        expect(host.getAttribute("href")).toBe("https://a.dev");
        engine.store.state.url = "https://b.dev"; // 响应式 props → watch 同步宿主
        await nextTick();
        expect(host.getAttribute("href")).toBe("https://b.dev");
    });
});

describe("installPlugin 自举（ADR-0003）", () => {
    test("bootstrapLinkPlugin 幂等：重复调用不覆盖（同键赋值幂等）", () => {
        const before = (AutoSpark as { components: Record<string, string> }).components[LINK_NAME];
        bootstrapLinkPlugin();
        expect((AutoSpark as { components: Record<string, string> }).components[LINK_NAME]).toBe(before);
    });
});
