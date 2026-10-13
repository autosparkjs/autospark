import { describe, expect, test } from "bun:test";
import "../setup";
import { AutoSpark } from "../../engine/engine";

/**
 * AutoSpark 第一参「挂载根」输入测试：HTMLElement 或 CSS 选择器串。
 *
 * 覆盖：选择器命中（首命中元素挂载 + 打根标识 + 首渲）、选择器无命中 throw、
 * 命中非 HTMLElement（SVG）throw、非 HTMLElement 非串入参 throw。
 */

/** 临时挂进 document.body 的根（选择器须从 document 起查），用后即移 */
function attach(html: string): HTMLElement {
    const root = document.createElement("div");
    root.innerHTML = html.trim();
    document.body.appendChild(root);
    return root;
}

describe("AutoSpark 第一参：HTMLElement | 选择器串", () => {
    test("选择器（#id）：命中元素挂载并完成首渲", () => {
        const host = attach(`<div id="app"><span x-text="name"></span></div>`);
        const engine = new AutoSpark("#app", { name: "zhang" });
        const app = host.querySelector("#app") as HTMLElement;
        expect(engine.el).toBe(app);
        expect(app.getAttribute("data-autospark")).toBe("");
        expect(app.querySelector("span")!.textContent).toBe("zhang");
        engine.destroy();
        host.remove();
    });

    test("选择器（class 选择器）：多命中时取第一个", () => {
        const host = attach(`<div class="mount"><span x-text="n"></span></div>
             <div class="mount"><span x-text="n"></span></div>`);
        const engine = new AutoSpark(".mount", { n: 1 });
        const all = host.querySelectorAll(".mount");
        expect(engine.el).toBe(all[0] as HTMLElement);
        expect(all[0]!.querySelector("span")!.textContent).toBe("1");
        expect(all[1]!.getAttribute("data-autospark")).toBeNull();
        engine.destroy();
        host.remove();
    });

    test("选择器无命中：throw（含选择器原文）", () => {
        expect(() => new AutoSpark("#not-here", {})).toThrow(/#not-here/);
    });

    test("选择器命中非 HTMLElement（svg）：throw", () => {
        const host = attach(`<svg id="ico"></svg>`);
        expect(() => new AutoSpark("#ico", {})).toThrow(/Root element/);
        host.remove();
    });

    test("非法选择器串：querySelector 自身语法错抛出", () => {
        expect(() => new AutoSpark("::bogus::", {})).toThrow();
    });

    test("非 HTMLElement 非串入参：throw（保留原错误文案）", () => {
        expect(() => new AutoSpark(null as any, {})).toThrow(
            /Root element must be an HTMLElement/,
        );
    });
});
