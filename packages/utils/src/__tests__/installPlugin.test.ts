/**
 * installPlugin 双路径自举单测（utils ADR-0001）：直取注册 / 预加载队列 /
 * 冻结守卫三路径的行为锁——插件家族（plugins / router / theme）共用的注册契约。
 */
import { describe, expect, test, afterEach } from "bun:test";
import { installPlugin } from "../installPlugin";

const g = globalThis as { AutoSpark?: any; __AUTOSPARK_PLUGINS__?: any[] };

afterEach(() => {
    delete g.AutoSpark;
    delete g.__AUTOSPARK_PLUGINS__;
});

describe("installPlugin（双路径自举）", () => {
    test("直路径：probe 命中函数 → 立即注册，不入队", () => {
        const marks: string[] = [];
        g.AutoSpark = { ready: (cb: () => void) => { marks.push("ready-registered"); } };
        g.__AUTOSPARK_PLUGINS__ = [];
        installPlugin("demo", "ready", (ns) => ns.ready(() => {}));
        expect(marks).toEqual(["ready-registered"]);
        expect(g.__AUTOSPARK_PLUGINS__).toEqual([]);
    });

    test("直路径：非函数 probe（components/actions/icons）非空即命中", () => {
        const marks: string[] = [];
        g.AutoSpark = { components: { "autospark.button": {} } };
        installPlugin("demo", "components", () => marks.push("hit"));
        expect(marks).toEqual(["hit"]);
    });

    test("队列路径：全局未加载 → 仅 register 回调入队（不排整包），drain 时以命名空间回放", () => {
        const marks: string[] = [];
        installPlugin("demo", "ready", (ns) => marks.push(`register:${ns?.tag}`));
        expect(g.__AUTOSPARK_PLUGINS__).toHaveLength(1);
        expect(g.__AUTOSPARK_PLUGINS__![0]).toBeTypeOf("function");
        // engine 构造 drain：插件体收 (engine, autospark) 双参——第二参即命名空间
        g.__AUTOSPARK_PLUGINS__![0]({ engine: 1 }, { tag: "ns" });
        expect(marks).toEqual(["register:ns"]);
    });

    test("冻结守卫：队列已消费且全局不可达 → console.error 响而不哑", () => {
        const errors: string[] = [];
        const original = console.error;
        console.error = (msg: unknown) => errors.push(String(msg));
        try {
            const frozen: never[] = [];
            Object.freeze(frozen);
            g.__AUTOSPARK_PLUGINS__ = frozen;
            installPlugin("demo", "ready", () => {});
        } finally {
            console.error = original;
        }
        expect(errors.some((m) => m.includes("demo") && m.includes("插件未注册"))).toBe(true);
    });
});
