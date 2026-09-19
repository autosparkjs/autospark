import { describe, expect, spyOn, test } from "bun:test";
import "./setup";
import { AutoStore, ConfigManager } from "autostore";
import { AutoSpark } from "../engine";
import { nextTick } from "./helpers";

/**
 * AutoSpark 第二参「裸状态」输入测试（ADR-0044：store 所有权收归 engine）。
 *
 * 覆盖：自建 store 与首渲、实例入参 throw、storeOptions 恒透传（configManager 三态 /
 * configKey 默认 ''）、静默兜空、destroy 恒销毁 store 与自建 configManager。
 */

describe("AutoSpark 第二参：裸状态（ADR-0044）", () => {
    test("裸状态对象：engine 自建 store 并完成首渲", () => {
        const root = document.createElement("div");
        root.innerHTML = `<span x-text="name"></span>`;
        const engine = new AutoSpark(root, { name: "zhang" });
        expect(engine.store).toBeInstanceOf(AutoStore);
        expect(root.querySelector("span")!.textContent).toBe("zhang");
        engine.destroy();
    });

    test("裸状态对象：经 engine.state 响应式更新生效（种子对象已失效，唯句柄响应式）", async () => {
        const root = document.createElement("div");
        root.innerHTML = `<span x-text="count"></span>`;
        const engine = new AutoSpark(root, { count: 0 });
        expect(root.querySelector("span")!.textContent).toBe("0");
        engine.state.count = 42; // 响应式状态句柄（engine.state 的 Proxy）
        await nextTick();
        expect(root.querySelector("span")!.textContent).toBe("42");
        engine.destroy();
    });

    test("AutoStore 实例：throw（不再接受借用，ADR-0044）", () => {
        const root = document.createElement("div");
        root.innerHTML = `<span x-text="name"></span>`;
        const store = new AutoStore({ name: "li" });
        expect(() => new AutoSpark(root, store as any)).toThrow(
            /no longer accepts an AutoStore instance/,
        );
        store.destroy();
    });

    test("destroy：恒销毁自建 store（engine 拥有，无借用分流）", () => {
        const root = document.createElement("div");
        root.innerHTML = `<span x-text="name"></span>`;
        const engine = new AutoSpark(root, { name: "zhang" });
        const spy = spyOn(engine.store, "destroy");
        engine.destroy();
        expect(spy).toHaveBeenCalledTimes(1);
    });

    test("storeOptions：恒透传给 new AutoStore(state, storeOptions)", () => {
        const root = document.createElement("div");
        root.innerHTML = `<span x-text="name"></span>`;
        const engine = new AutoSpark(
            root,
            { name: "zhang" },
            {
                storeOptions: { debug: true },
            },
        );
        expect((engine.store as any).options.debug).toBe(true);
        engine.destroy();
    });

    test("null：静默兜空 store，不抛错（沿用 ADR-0009 决策 5）", () => {
        const root = document.createElement("div");
        root.innerHTML = `<span>static</span>`;
        const engine = new AutoSpark(root, null as any);
        expect(engine.store).toBeInstanceOf(AutoStore);
        expect(root.querySelector("span")!.textContent).toBe("static");
        engine.destroy();
    });

    test("undefined：静默兜空 store，不抛错", () => {
        const root = document.createElement("div");
        root.innerHTML = `<span>static</span>`;
        const engine = new AutoSpark(root, undefined as any);
        expect(engine.store).toBeInstanceOf(AutoStore);
        engine.destroy();
    });
});

describe("AutoSpark configManager / configKey 默认（ADR-0044 三态）", () => {
    test("缺省：engine 补内存空 ConfigManager，configKey 默认空串", () => {
        const root = document.createElement("div");
        root.innerHTML = `<span x-text="name"></span>`;
        const engine = new AutoSpark(root, { name: "zhang" });
        expect(engine.store.configManager).toBeInstanceOf(ConfigManager);
        expect(engine.store.configKey).toBe("");
        engine.destroy();
    });

    test("显式传入：消费者 configManager 原样生效且 destroy 不销毁 cm；configKey 恒覆盖为空串", () => {
        const root = document.createElement("div");
        root.innerHTML = `<span x-text="name"></span>`;
        const cm = new ConfigManager({ load: () => ({}) });
        const engine = new AutoSpark(
            root,
            { name: "zhang" },
            {
                storeOptions: { configManager: cm, configKey: "network" },
            },
        );
        expect(engine.store.configManager).toBe(cm);
        // configKey 恒空（无条件覆盖）：引擎自建 store 的 fullKey 恒无前缀（确定性），
        // 显式传入的 configKey 不生效（ADR-0044 三态之「显式 configKey 生效」已废止）
        expect(engine.store.configKey).toBe("");
        const spy = spyOn(cm, "destroy");
        engine.destroy();
        expect(spy).not.toHaveBeenCalled();
        cm.destroy();
    });

    test("false：完全关闭 configManager（不建实例，@ 绑定走三层降级）", () => {
        const root = document.createElement("div");
        root.innerHTML = `<span x-text="name"></span>`;
        const engine = new AutoSpark(
            root,
            { name: "zhang" },
            {
                storeOptions: { configManager: false },
            },
        );
        expect(engine.store.configManager).toBeUndefined();
        engine.destroy();
    });

    test("destroy：engine 自建的默认 configManager 随之销毁", () => {
        const root = document.createElement("div");
        root.innerHTML = `<span x-text="name"></span>`;
        const engine = new AutoSpark(root, { name: "zhang" });
        const cm = engine.store.configManager!;
        const spy = spyOn(cm, "destroy");
        engine.destroy();
        expect(spy).toHaveBeenCalledTimes(1);
    });
});
