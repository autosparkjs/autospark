/**
 * tag 组件插件测试（ADR-0003 组件形态）：
 * - 全局组件表注册 + 化身渲染（props 变体经内层出口元素 data-* 承载，T4=B 约束）；
 * - closable 关闭钮渲染门控 + close 方法（组件事件 close 派发 + DOM 移除）。
 */
import "../setup";
import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { mount, nextTick } from "../helpers";
import { TAG_NAME } from "../../components/tag/index";

describe("tag 组件插件（ADR-0003 组件形态）", () => {
    test("模块加载即注册：插件全局组件表含 autospark.tag 模板字符串", () => {
        const template = (AutoSpark as { components: Record<string, string> }).components[TAG_NAME];
        expect(typeof template).toBe("string");
        expect(template).toContain(`x-define="${TAG_NAME}"`);
    });

    test("化身渲染：props 默认值生效（default/md/无关闭钮）+ label 兜底文案", async () => {
        const { root } = mount(`<span x-component:autospark.tag="{ label: '待审核' }"></span>`, {});
        await nextTick();
        const host = root.querySelector("span")!;
        expect(host.className).toContain("asc-tag");
        const label = host.querySelector(".asc-tag-label")!;
        expect(label.getAttribute("data-type")).toBe("default");
        expect(label.getAttribute("data-size")).toBe("md");
        expect(host.textContent).toContain("待审核");
        const close = host.querySelector(".asc-tag-close")!;
        expect(close).toBeTruthy();
        // x-show 隐藏不摘 DOM——closable=false 时经 display:none 收起
        expect(close.style.display).toBe("none");
    });

    test("变体承载：type/size props 落到插槽出口元素的 data-*（:has() 驱动宿主外观）", async () => {
        const { root } = mount(
            `<span x-component:autospark.tag="{ label: '已完成', type: 'success', size: 'sm' }"></span>`,
            {},
        );
        await nextTick();
        const label = root.querySelector(".asc-tag-label")!;
        expect(label.getAttribute("data-type")).toBe("success");
        expect(label.getAttribute("data-size")).toBe("sm");
    });

    test("closable：点 × 派发组件事件 close（detail 含 label/type）并从 DOM 移除", async () => {
        const events: Array<Record<string, unknown>> = [];
        const { root } = mount(
            `<div @close="closings.push($event.detail)">` +
                `<span x-component:autospark.tag="{ label: '草稿', type: 'warning', closable: true }"></span>` +
                `</div>`,
            { closings: events },
        );
        await nextTick();
        const host = root.querySelector(".asc-tag")!;
        expect(host.querySelector(".asc-tag-close")!.style.display).not.toBe("none");
        host.querySelector(".asc-tag-close")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextTick();
        expect(root.querySelector(".asc-tag")).toBeNull();
        expect(events.length).toBe(1);
        expect(events[0].label).toBe("草稿");
        expect(events[0].type).toBe("warning");
    });

    test("插槽覆盖：宿主裸子节点提供内容时覆盖 label 兜底", async () => {
        const { root } = mount(
            `<span x-component:autospark.tag="{ type: 'success' }"><b>已</b>完成</span>`,
            {},
        );
        await nextTick();
        expect(root.querySelector(".asc-tag")!.textContent).toContain("已完成");
        expect(root.querySelector(".asc-tag")!.textContent).not.toContain("标签");
    });
});
