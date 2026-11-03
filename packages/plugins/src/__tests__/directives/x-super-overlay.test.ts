/** x-super overlay 路径用例——自 engine x-super.test 迁入（依赖外移的 x-dialog） */
import { describe, expect, test } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";
import { afterEach } from "bun:test";

const engines: any[] = [];
const mountSuper = (html: string, state: any, options?: any) => {
    const m = mount(html, state, options);
    engines.push(m.engine);
    return m;
};

afterEach(() => {
    while (engines.length) engines.pop()?.destroy();
});
import "../../directives/overlay/index";

describe("x-super overlay 路径（ADR-0084，迁入）", () => {
    test("overlay 路径：x-dialog 内容里的 x-super 同语法生效", async () => {
        const { root, engine } = mountSuper(
            `<div id="app">
                <div x-scope>
                    <div x-define="confirm">
                        <div class="body"><div class="slot" x-slot>默认正文</div></div>
                    </div>
                    <button id="t" x-dialog:confirm="ui.open">
                        打开
                        <div x-slot><x-super></x-super>要确认吗？</div>
                    </button>
                </div>
            </div>`,
            { ui: { open: false } },
            { animate: false },
        );
        engine.state.ui.open = true;
        await nextTick();
        const mask = document.querySelector(`.autospark-dialog-mask [data-overlay="confirm"]`)?.parentElement;
        expect(mask).not.toBeNull();
        const slot = mask!.querySelector(".slot")!;
        // 覆盖物出口 fallback 展开进标记 + 内容文本照常投影
        expect(slot.querySelector("x-super")!.textContent).toBe("默认正文");
        expect(slot.textContent).toInclude("要确认吗？");
    });
});
