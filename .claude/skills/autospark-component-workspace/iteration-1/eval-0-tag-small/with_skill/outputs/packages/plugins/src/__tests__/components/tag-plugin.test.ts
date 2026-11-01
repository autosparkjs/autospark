/**
 * tag 组件插件测试（ADR-0003 组件形态样板，对照 button-plugin.test.ts）：
 * - 全局表注册 + 化身渲染（type/size 变体数据属性落内层出口元素，化身路径约束 T4=B）；
 * - closable 交互：默认隐藏（x-show 行内 display:none 不摘 DOM）、点击 × 经
 *   methods.close 从 DOM 移除化身宿主。
 */
import "../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../helpers";
import { TAG_NAME } from "../../components/tag/index";

describe("tag 组件插件（ADR-0003 组件形态样板）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.tag 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[TAG_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${TAG_NAME}"`);
    });

    test("化身渲染：label 兜底文案 + type/size 变体数据属性落内层出口元素（T4=B）", async () => {
        const { root } = mount(
            `<span x-component:autospark.tag="{ label: '待发货', type: 'warning', size: 'lg' }"></span>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".asc-tag")!;
        expect(host.className).toContain("asc-tag");
        const inner = host.querySelector(".asc-tag-inner")!;
        expect(inner.getAttribute("data-type")).toBe("warning");
        expect(inner.getAttribute("data-size")).toBe("lg");
        expect(host.textContent).toContain("待发货");
    });

    test("插槽内容优先：使用处子内容替换 label 兜底文案", async () => {
        const { root } = mount(
            `<span x-component:autospark.tag="{ label: '被覆盖的兜底' }">自定义内容</span>`,
            {},
        );
        await nextTick();
        const host = root.querySelector(".asc-tag")!;
        expect(host.textContent).toContain("自定义内容");
        expect(host.textContent).not.toContain("被覆盖的兜底");
    });

    test("closable 默认隐藏：未开启时 × 按钮在场但行内 display:none（x-show 不摘 DOM）", async () => {
        const { root } = mount(`<span x-component:autospark.tag="{ label: '不可关闭' }"></span>`, {});
        await nextTick();
        const close = root.querySelector(".asc-tag-close")!;
        expect(close.style.display).toBe("none");
    });

    test("closable 开启可见：点击 × 经 methods.close 从 DOM 移除化身宿主", async () => {
        const { root } = mount(
            `<span x-component:autospark.tag="{ label: '可关闭', type: 'primary', closable: true }"></span>`,
            {},
        );
        await nextTick();
        const close = root.querySelector(".asc-tag-close")!;
        expect(close.style.display).not.toBe("none");
        close.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(root.querySelector(".asc-tag")).toBeNull();
    });
});
