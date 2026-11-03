/** x-model 域写回驱动 x-splitter 换轴用例——自 engine write-through.test 迁入（依赖外移的 x-splitter） */
import { describe, expect, test } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import { afterEach } from "bun:test";

const engines: any[] = [];
const roots: HTMLElement[] = [];
const mountWith = (html: string, state: any = {}) => {
    const m = mount(html, state);
    document.body.appendChild(m.root);
    roots.push(m.root);
    engines.push(m.engine);
    return m;
};

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
    while (roots.length) roots.pop()?.remove();
});
// 显式引入 layout 家族插件（x-splitter 组合被测方）
import "../../directives/layout/index";

describe("x-model 写回落点：splitter 换轴（迁入）", () => {
    test("radio + x-splitter direction（direction demo 场景）：域写回驱动换轴", async () => {
        const m = mountWith(
            `<div id="app"><div x-data="{ dir: 'horizontal' }">
                <label><input id="r-v" type="radio" value="vertical" x-model="dir" /> 上下</label>
                <div id="host" x-splitter="dir">
                    <div id="p1" data-size="140px"><span>a</span></div>
                    <div id="p2"><span>b</span></div>
                </div>
            </div></div>`,
            {},
        );
        await nextTick();
        const host = m.root.querySelector("#host")!;
        const radio = m.root.querySelector("#r-v") as HTMLInputElement;
        radio.checked = true;
        radio.dispatchEvent(new Event("input", { bubbles: true }));
        await nextTick();
        expect(host.getAttribute("data-direction")).toBe("vertical");
        // 定容尺寸同值换轴重写（width 清、height 140px）
        expect((m.root.querySelector("#p1") as HTMLElement).style.width).toBe("");
        expect((m.root.querySelector("#p1") as HTMLElement).style.height).toBe("140px");
    });
});
