import { afterEach, describe, expect, test } from "bun:test";
import "../setup";
import { mount as _mount } from "../helpers";
import { AutoSpark } from "../../engine/engine";

// 测试卫生：泄漏 engine 统一 afterEach 清场（同 x-on.test.ts）
const engines: any[] = [];
const mount = ((...args: Parameters<typeof _mount>) => {
    const m = _mount(...args);
    engines.push(m.engine);
    return m;
}) as typeof _mount;
afterEach(() => {
    while (engines.length) {
        const e = engines.pop() as any;
        if (e.__testDestroyed) continue;
        e.__testDestroyed = true;
        e.destroy();
    }
});

/**
 * 自定义 script type 注册表（ADR-0132）：`AutoSpark.scriptType` 注册 → 编译期 transformer
 * 派发（handler 收最近 scope）→ 剪枝；未注册 warn + 剪枝；非法注册拒绝；重复注册覆盖。
 *
 * 注册表是类静态全局 Map（查询期委托），各用例用唯一 type 名防串扰、不清理（无 delete API）。
 */

describe("script-type 注册与派发", () => {
    test("已注册 handler：编译期命中、收 script/scope/engine、script 剪枝", () => {
        const received: Record<string, unknown> = {};
        AutoSpark.scriptType("autospark/test-res-1", (script, scope, engine) => {
            received.text = script.textContent?.trim();
            received.scopeDefined = scope !== undefined;
            received.engineName = engine.constructor.name;
        });
        const { root } = mount(
            `<div x-data="{}"><button>x</button><script type="autospark/test-res-1">{ a: 1 }</script></div>`,
            {},
        );
        expect(received.text).toBe("{ a: 1 }");
        expect(received.scopeDefined).toBe(true);
        expect(received.engineName).toBe("AutoSpark");
        expect(root.querySelector("script")).toBeNull();
    });

    test("顶层游离声明：scope 为 undefined、handler 仍命中", () => {
        let scopeDefined: boolean | null = null;
        AutoSpark.scriptType("autospark/test-res-2", (_script, scope) => {
            scopeDefined = scope !== undefined;
        });
        mount(`<script type="autospark/test-res-2">{}</script>`, {});
        expect(scopeDefined).toBe(false);
    });

    test("未注册的 autospark/* 类型：warn + 剪枝不进渲染 DOM", () => {
        const warns: string[] = [];
        const origWarn = console.warn;
        console.warn = (...args: any[]) => warns.push(String(args[0]));
        try {
            const { root, engine } = mount(
                `<div><script type="autospark/test-unknown-x">hello</script></div>`,
                {},
            );
            expect(root.querySelector("script")).toBeNull();
            expect(warns.some((w) => w.includes("test-unknown-x"))).toBe(true);
            expect((engine as any).logger).toBeTruthy();
        } finally {
            console.warn = origWarn;
        }
    });

    test("晚注册（engine 构造后）对后续 engine 编译生效（类静态查询期委托）", () => {
        mount(`<div>first</div>`, {}); // 先构造一个 engine（注册前）
        let hits = 0;
        AutoSpark.scriptType("autospark/test-res-3", () => hits++);
        mount(`<div><script type="autospark/test-res-3">{}</script></div>`, {});
        expect(hits).toBe(1);
    });

    test("重复注册同名：warn + 后者覆盖", () => {
        const order: string[] = [];
        AutoSpark.scriptType("autospark/test-res-4", () => order.push("first"));
        const warns: string[] = [];
        const origWarn = console.warn;
        console.warn = (...args: any[]) => warns.push(String(args[0]));
        try {
            AutoSpark.scriptType("autospark/test-res-4", () => order.push("second"));
        } finally {
            console.warn = origWarn;
        }
        expect(warns.some((w) => w.includes("覆盖"))).toBe(true);
        mount(`<div><script type="autospark/test-res-4">{}</script></div>`, {});
        expect(order).toEqual(["second"]);
    });
});

describe("script-type 注册校验（拒绝路径）", () => {
    test("无 autospark/ 前缀：拒绝注册（不进注册表）", () => {
        const warns: string[] = [];
        const origWarn = console.warn;
        console.warn = (...args: any[]) => warns.push(String(args[0]));
        try {
            AutoSpark.scriptType("foo/bar", () => {});
            AutoSpark.scriptType("autospark/Big", () => {}); // 非 kebab 小写
        } finally {
            console.warn = origWarn;
        }
        expect(warns.filter((w) => w.includes("非法"))).toHaveLength(2);
    });

    test("内置名（actions/data/setup）：拒绝注册", () => {
        const warns: string[] = [];
        const origWarn = console.warn;
        console.warn = (...args: any[]) => warns.push(String(args[0]));
        try {
            AutoSpark.scriptType("autospark/actions", () => {});
            AutoSpark.scriptType("autospark/data", () => {});
            AutoSpark.scriptType("autospark/setup", () => {});
        } finally {
            console.warn = origWarn;
        }
        expect(warns.filter((w) => w.includes("内置"))).toHaveLength(3);
    });

    test("handler 非函数：拒绝注册", () => {
        const warns: string[] = [];
        const origWarn = console.warn;
        console.warn = (...args: any[]) => warns.push(String(args[0]));
        try {
            AutoSpark.scriptType("autospark/test-res-5", undefined as any);
        } finally {
            console.warn = origWarn;
        }
        expect(warns.some((w) => w.includes("函数"))).toBe(true);
    });

    test("内置通道不受派发影响：autospark/actions 照常提取", () => {
        const { root, engine } = mount(
            `<div x-data="{}"><button @click="f()">x</button><script type="autospark/actions">{ f(){ this.store.state.n = 1 } }</script></div>`,
            { n: 0 },
        );
        root.querySelector("button")!.click();
        expect(engine.state.n).toBe(1);
        expect(root.querySelector("script")).toBeNull();
    });
});
