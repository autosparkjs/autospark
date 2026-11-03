/** x-slot 传递绑定的 overlay 通道用例——自 engine x-slot.test 迁入（依赖外移的 x-dialog） */
import { describe, expect, test } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import { AutoSpark } from "autospark";
import { afterEach } from "bun:test";

function mountCaptureWarn(html: string, state: any, options?: any) {
    const root = document.createElement("div");
    root.innerHTML = html.trim();
    const engine = new AutoSpark(root, state, { autostart: false, ...options });
    const warns: string[] = [];
    (engine.logger as any).warn = (msg: any) => warns.push(String(msg));
    engine.compile();
    return { root, engine, warns };
}
const engines: any[] = [];
const mountSlot = (html: string, state: any, options?: any) => {
    const m = mount(html, state, options);
    engines.push(m.engine);
    return m;
};

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
});
import "../../directives/overlay/index";

describe("x-slot 传递绑定 overlay 通道（ADR-0108，迁入）", () => {
const maskOf = (name: string): HTMLElement | null =>        document.querySelector(`.autospark-dialog-mask [data-overlay="${name}"]`)?.parentElement ?? null;
    test("overlay 通道：x-dialog 内 x-slot.bind 同样透传到出口元素", async () => {
        const { root, engine } = mountSlot(
            `<div x-scope>
                <div x-define="confirm"><div class="body"><div x-slot>默认正文</div></div></div>
                <button id="t" x-dialog:confirm="ui.open">
                    打开
                    <div x-slot x-slot.bind="{ 'data-o': od }">要确认吗？</div>
                </button>
            </div>`,
            { ui: { open: false }, od: "O1" },
            { animate: false },
        );
        expect(root.querySelector("#t [data-o]")).toBeNull(); // 标记子节点剪枝不进宿主
        engine.state.ui.open = true;
        await nextTick();
        const mask = maskOf("confirm")!;
        expect(mask).not.toBeNull();
        expect(mask.textContent).toInclude("要确认吗？");
        const outlet = mask.querySelector("[data-o]")!;
        expect(outlet).not.toBeNull();
        expect(outlet.getAttribute("data-o")).toBe("O1");
    });
});
