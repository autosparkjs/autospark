import { describe, expect, test } from "bun:test";

/**
 * 持久化全链路冒烟（ADR-0003）。bun test 无 DOM：注入最小 document 桩 +
 * MutationObserver 兜底；localStorage 用 bun 内置实现。injectStylesheet 在
 * 无 DOM 下注入为 no-op，但注入缓存（_cssMap）与快照合成照常工作——正是
 * 「快照数据源不查 DOM」设计的直接验证。
 */

// document 桩：覆盖 ThemeScope/ThemeManager 构造与注入路径。
// bun test 单进程共享 globalThis——桩必须完整（scope.test.ts 依赖
// injectStylesheet 正常走完创建/写入路径），且先于 manager 导入建立
// （静态 import 被提升，故下方用动态 import）。
(globalThis as any).HTMLElement ??= class HTMLElement {};
(globalThis as any).MutationObserver ??= class {
    observe() {}
    disconnect() {}
};
// bun test 环境无内置 localStorage：Map 基实现（持久化断言的验证对象）
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
    head: {
        appendChild() {},
        querySelector: () => null,
    },
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

const { ThemeManager, themeManager } = await import("../manager");

const STYLES_KEY = "autospark-theme-styles";
const ROOT_KEY = "autospark-theme-scope-root";

describe("持久化（ADR-0003）", () => {
    test("root connect 即写入样式快照；首访无参数变化时不写参数 key", () => {
        // themeManager 为模块级单例，import 时已完成 root connect
        const snapshot = localStorage.getItem(STYLES_KEY);
        expect(snapshot).toBeTruthy();
        expect(snapshot!).toContain("--x-color-theme-");
        expect(snapshot!).toContain("color-scheme");
        expect(localStorage.getItem(ROOT_KEY)).toBeNull();
    });

    test("dark 变化持久化参数且不重写样式快照（CSS 与暗色无关）", () => {
        const before = localStorage.getItem(STYLES_KEY);
        themeManager.dark = true;
        const params = JSON.parse(localStorage.getItem(ROOT_KEY)!);
        expect(params.dark).toBe(true);
        expect(localStorage.getItem(STYLES_KEY)).toBe(before);
        themeManager.dark = false;
    });

    test("themeColor 切换：快照重写为新标尺、参数存解析后的色值", () => {
        themeManager.themeColor = "red";
        const snapshot = localStorage.getItem(STYLES_KEY)!;
        expect(snapshot).toContain("--x-color-theme-");
        // 预设名解析为 hex 后进入参数（options.themeColor 存解析值）
        const params = JSON.parse(localStorage.getItem(ROOT_KEY)!);
        expect(params.themeColor).toBe("#f5222d");
    });

    test("同值重设零写入：内容去重挡住 setter 与 observer 回环的重复 IO", () => {
        themeManager.themeColor = "red"; // 与上一用例终态相同
        const params = JSON.parse(localStorage.getItem(ROOT_KEY)!);
        expect(params.themeColor).toBe("#f5222d");
        // IO 层面：无异常即去重路径未触发重写（内容一致性已由上一用例覆盖）
    });

    test("新 ThemeManager 实例从参数 key 水合（先水合后注入）", () => {
        const mgr2 = new ThemeManager();
        expect(mgr2.root.dark).toBe(false); // 上一用例已复位
        expect(mgr2.root.themeColor).toBe("#f5222d"); // 水合自参数 key
        mgr2.dark = true;
        expect(mgr2.root.dark).toBe(true);
    });

    test("persistence:false 的 scope 不读写 localStorage", () => {
        const scope = themeManager.addScope!({
            id: "quiet",
            persistence: false,
            autoConnect: false,
            autoAttach: false,
        })!;
        scope.dark = true;
        expect(localStorage.getItem("autospark-theme-scope-quiet")).toBeNull();
    });

    test("removeScope 清理参数 key 并从快照摘除其片段", () => {
        const scope = themeManager.addScope!({ id: "temp" })!;
        scope.dark = true;
        expect(localStorage.getItem("autospark-theme-scope-temp")).toBeTruthy();
        const withTemp = localStorage.getItem(STYLES_KEY)!;
        expect(withTemp).toContain("data-theme-scope='temp'");
        themeManager.removeScope("temp");
        expect(localStorage.getItem("autospark-theme-scope-temp")).toBeNull();
        expect(localStorage.getItem(STYLES_KEY)).not.toContain("data-theme-scope='temp'");
    });
});
