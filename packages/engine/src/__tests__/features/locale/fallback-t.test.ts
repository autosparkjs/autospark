import { describe, expect, test } from "bun:test";
import "../../setup";
import { mount, nextTick } from "../../helpers";

/**
 * 兜底 t（ADR-0136 核心翻译接缝）：未装 i18n 插件时表达式环境的 `t` 恒可用——
 * 恒等 + params 插值（求值器经 getter 函数参数注入，with 链上无 `t` 标识符才落到
 * 该参数）；命令式 `actions.t` 缺省描述符分派 `engine.translate` 槽（用户同名先占）。
 */
describe("兜底 t 与翻译实现槽（ADR-0136）", () => {
    test("恒等兜底：无字典时 t 返回键本身", () => {
        const { root } = mount(`<div><span x-text="t('hello')"></span></div>`, {});
        expect(root.querySelector("span")!.textContent).toBe("hello");
    });

    test("兜底带插值：t(key, args) 走 params", () => {
        const { root } = mount(`<div><span x-text="t('我有{}辆车', 5)"></span></div>`, {});
        expect(root.querySelector("span")!.textContent).toBe("我有5辆车");
    });

    test("表达式支路响应式：状态变化重新求值", async () => {
        const { root, engine } = mount(`<div><span x-text="t('n={}', n)"></span></div>`, { n: 1 });
        expect(root.querySelector("span")!.textContent).toBe("n=1");
        engine.state.n = 2;
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("n=2");
    });

    test("x-on 表达式内可用 t（事件求值器同样注入）", async () => {
        const { root, engine } = mount(
            `<div><button @click="msg = t('clicked {}', 1)"></button><span x-text="msg"></span></div>`,
            { msg: "" },
        );
        (root.querySelector("button") as HTMLElement).click();
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("clicked 1");
        void engine;
    });

    test("actions.t 缺省描述符存在且分派槽", () => {
        const { engine } = mount(`<div></div>`, {});
        const desc = (engine.actions as any).t;
        expect(desc?.id).toBe("t");
        expect(desc?.handle("x{}y", 1)).toBe("x1y");
    });

    test("用户 options.actions.t 先占（缺省不覆盖）", () => {
        const { engine } = mount(`<div></div>`, {}, { actions: { t: () => "user-t" } });
        expect((engine.actions as any).t.handle()).toBe("user-t");
    });

    test("双通道独立：用户 actions.t 不接管表达式 t（表达式恒为内置）", () => {
        const { root, engine } = mount(
            `<div><span x-text="t('hi')"></span></div>`,
            {},
            { actions: { t: () => "user-t" } },
        );
        expect(root.querySelector("span")!.textContent).toBe("hi");
        expect((engine.actions as any).t.handle()).toBe("user-t");
        void engine;
    });

    test("槽覆写升级：表达式 t 动态分派新实现（重求值后生效）", async () => {
        const { root, engine } = mount(`<div><span x-text="t('v={}', n)"></span></div>`, { n: 1 });
        expect(root.querySelector("span")!.textContent).toBe("v=1");
        engine.translate = (_scope, key, ...args) => `[${key}|${args.join(",")}]`;
        engine.state.n = 2; // 触发重求值 → 走新槽
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("[v={}|2]");
    });
});
