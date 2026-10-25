import { describe, expect, test, afterAll } from "bun:test";

/**
 * theme 插件自举单测（theme ADR-0007）：模块加载期单例挂载 + ready 注入 +
 * state.$.theme 七键投影与 watch("$.theme.*") 单向回写（Q10 定谳）全链路。
 *
 * bun test 无 DOM：注入最小 document 桩（同 persistence.test.ts 惯例），先于
 * plugin 导入建立。ready 接线经真实 AutoStore 验证（watch 通配符语义是本测试
 * 的锚定对象——collectDependencies 断链类陷阱必须在真实响应式层实证）。
 */

// document 桩：覆盖 ThemeManager/ThemeScope 构造与注入路径（先于动态 import）
(globalThis as any).HTMLElement ??= class HTMLElement {};
(globalThis as any).MutationObserver ??= class {
    observe() {}
    disconnect() {}
};
const storage = new Map<string, string>();
(globalThis as any).localStorage ??= {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => void storage.set(k, v),
    removeItem: (k: string) => void storage.delete(k),
    clear: () => storage.clear(),
};
(globalThis as any).document ??= {
    documentElement: {
        ownerDocument: null,
        setAttribute() {},
        removeAttribute() {},
        querySelectorAll: () => [],
    },
    head: { appendChild() {}, querySelector: () => null },
    body: { appendChild() {}, removeChild() {} },
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({
        id: "",
        innerHTML: "",
        style: { display: "" },
        appendChild() {},
        remove() {},
    }),
};

import { AutoStore } from "autostore";
import { presetThemes } from "../presets";

/** 最小 engine 桩：mountTheme 只触碰 store / state / on 三面 */
function makeFakeEngine() {
    const store = new AutoStore({ $: {} } as any);
    const events: Array<{ ev: string; cb: () => void }> = [];
    const engine: any = {
        store,
        state: store.state,
        on: (ev: string, cb: () => void) => events.push({ ev, cb }),
        options: {},
    };
    return { engine, store, events };
}

// 自举不预设 globalThis.AutoSpark——无论单文件或全套件执行（导入序不定），插件体
// 恒走队列路径；下方 drain 回放即「engine 构造 drain」语义（ADR-0114），时序更真实
const { engine, events } = makeFakeEngine();

const { themeManager } = await import("../plugin");

// drain：队列中所有 register 回调以 (engine, 命名空间) 回放——命名空间即 fake ready 载体
const pluginQueue: Array<(engine: any, ns: any) => void> =
    (globalThis as any).__AUTOSPARK_PLUGINS__ ?? [];
for (const register of pluginQueue) register(engine, { ready: (cb: (e: any) => void) => cb(engine) });

/** 单例初值快照：用例后还原，防跨文件漂移（单例进程级共享） */
const SNAPSHOT = {
    dark: themeManager.dark,
    themeColor: themeManager.themeColor,
    size: themeManager.size,
    spacing: themeManager.spacing,
    shadow: themeManager.shadow,
    radius: themeManager.radius,
    colorized: themeManager.colorized,
};

afterAll(() => {
    Object.assign(themeManager, SNAPSHOT);
});

/** autostore watch 通知时序兜底（同步路径为主，微任务级延迟不误判） */
const flush = () => Promise.resolve();

describe("theme 插件自举（ADR-0007）", () => {
    test("模块加载期：单例创建并挂全局 AutoSparkThemeManager（引入即生效）", () => {
        expect(themeManager).toBeInstanceOf(Object);
        expect((globalThis as any).AutoSparkThemeManager).toBe(themeManager);
    });

    test("ready：engine.themeManager 注入单例引用（纯引用，不构造）", () => {
        expect((engine as any).themeManager).toBe(themeManager);
    });

    test("ready：state.$.theme 七键投影以 manager 当前值播种", () => {
        const projection = (engine as any).state.$.theme;
        expect(projection).toEqual({
            dark: SNAPSHOT.dark,
            themeColor: SNAPSHOT.themeColor,
            size: SNAPSHOT.size,
            spacing: SNAPSHOT.spacing,
            shadow: SNAPSHOT.shadow,
            radius: SNAPSHOT.radius,
            colorized: SNAPSHOT.colorized,
        });
    });

    test("watch($.theme.*)：投影键写入同步 manager 同维度（dark → themeManager.dark）", async () => {
        (engine as any).state.$.theme.dark = true;
        await flush();
        expect(themeManager.dark).toBe(true);

        (engine as any).state.$.theme.spacing = "large";
        await flush();
        expect(themeManager.spacing).toBe("large");

        (engine as any).state.$.theme.themeColor = "red";
        await flush();
        // manager setter 按预设表归一化（既有语义）：预设名 "red" → 标尺 hex
        expect(themeManager.themeColor).toBe(presetThemes.red.color);
    });

    test("守卫：同值写入短路 / 未知键不落 / delete 语义不落", async () => {
        // 同值守卫：dark 已为 true，重复写入幂等（不抛不重放 DOM 注入）
        (engine as any).state.$.theme.dark = true;
        await flush();
        expect(themeManager.dark).toBe(true);

        // 未知键：不触碰 manager（不抛错即守卫放行语义）
        (engine as any).state.$.theme.unknownKey = "x";
        await flush();

        // delete：value undefined 不落 manager（dark 保持 true）
        delete (engine as any).state.$.theme.dark;
        await flush();
        expect(themeManager.dark).toBe(true);
    });

    test("Q10 定谳（单向同步）：manager 直改不回写投影", async () => {
        themeManager.colorized = !SNAPSHOT.colorized;
        await flush();
        expect((engine as any).state.$.theme.colorized).toBe(SNAPSHOT.colorized); // 投影不随动
        expect(themeManager.colorized).toBe(!SNAPSHOT.colorized); // manager 本体已变
    });

    test("destroy 摘线：engine/destroy/before 后投影写入不再回写 manager", async () => {
        const destroyHook = events.find((e) => e.ev === "engine/destroy/before");
        expect(destroyHook).toBeDefined();
        destroyHook!.cb();

        (engine as any).state.$.theme.dark = false;
        await flush();
        expect(themeManager.dark).toBe(true); // 摘线后写入不再触达 manager
    });
});
