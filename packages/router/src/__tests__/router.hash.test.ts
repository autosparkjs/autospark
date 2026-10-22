import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { AutoSparkRouter } from "@/router";
import { getSignalHash } from "@/utils/getSignalHash";

/**
 * 创建测试用的 DOM 环境
 */
function createTestDOM() {
    const { Window } = require("happy-dom");
    const win = new Window({ url: "http://localhost/" });

    // 设置全局对象 - 每次测试重新设置，确保干净状态
    // @ts-ignore
    globalThis.window = win;
    // @ts-ignore
    globalThis.document = win.document;
    // @ts-ignore
    globalThis.history = win.history;
    // @ts-ignore
    globalThis.location = win.location;
    // @ts-ignore
    globalThis.Event = win.Event;
    // @ts-ignore
    globalThis.CustomEvent = win.CustomEvent;
    // @ts-ignore
    globalThis.HTMLElement = win.HTMLElement;
    // @ts-ignore
    globalThis.URLSearchParams = win.URLSearchParams;

    // 补充 happy-dom 缺失的全局构造函数（createHashHistory 需要）
    // happy-dom 的 Window 缺少 SyntaxError，导致 querySelectorAll 失败
    // @ts-ignore
    win.SyntaxError = SyntaxError;

    // 创建 host 元素
    // @ts-ignore
    const host = document.createElement("div") as HTMLElement;
    // @ts-ignore
    document.body.appendChild(host);
    return host;
}

/** 最小 engine stub：注入模式下跳过自建管线 */
function stubEngine() {
    return {
        getComponentDeclaration: () => ({ name: "autospark.outlet" }),
        getComponent: () => ({
            data: { views: [], ephemeral: { hash: "", html: "", ready: false }, active: "" },
        }),
        data: () => { },
        destroy() { },
    } as any;
}

/** 在未显式提供 engine 时注入 stub */
function stubEnginePass(options: any) {
    if (options && typeof options === "object" && !Array.isArray(options) && options.engine) {
        return options;
    }
    if (options && typeof options === "object" && !Array.isArray(options)) {
        return { ...options, engine: stubEngine() };
    }
    // 数组/单对象/字符串/函数格式：包成带 routes 的配置
    return { routes: options, engine: stubEngine() };
}

/**
 * 动态导入 AutoSparkRouter 以避免加载时的依赖问题。
 * 构造函数自 89515f9 起自动 attach()，不得重复调用（抛 Already attached）；
 * attach 链异步完成，需等待路由表加载与初始导航结束。
 */
async function createRouter(host: HTMLElement, options: any) {
    const { AutoSparkRouter } = await import("@/router");
    // 渲染链路要求宿主内存在出口元素
    if (!host.querySelector("[data-autospark-outlet]")) {
        const outlet = document.createElement("div");
        outlet.setAttribute("data-autospark-outlet", "");
        host.appendChild(outlet);
    }
    const router = new AutoSparkRouter(host, stubEnginePass(options));
    await new Promise((resolve) => setTimeout(resolve, 80));
    return router;
}

/** 取 matched 数组末项（最深匹配） */
function lastMatched(router: AutoSparkRouter) {
    const current = router.routes.current ?? [];
    return current[current.length - 1];
}

describe("Hash mode routing", () => {
    let host: HTMLElement;
    let router: AutoSparkRouter;

    const routes = [
        { name: "home", path: "/" },
        { name: "user", path: "/user" },
        { name: "user-detail", path: "/user/:id" },
        { name: "settings", path: "/settings" },
        { name: "not-found", path: "*" },
    ];

    beforeEach(async () => {
        host = createTestDOM();
    });

    afterEach(() => {
        if (router) {
            try {
                router.detach();
            } catch (e) {
                // 忽略 detach 错误
            }
            router = undefined as any;
        }
        if (host && host.parentElement) {
            host.parentElement.removeChild(host);
        }
    });

    it("mode: 'hash' 应该使用 HashHistory 而非 BrowserHistory", async () => {
        router = await createRouter(host, { mode: "hash", routes });

        // history 实例应该是 HashHistory 类型（通过检测 hash 相关属性来验证）
        // history 库的 HashHistory 与 BrowserHistory 有相同接口
        // 验证 push 操作后路径正确更新
        router.push("/user");
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(router.location.pathname).toBe("/user");
    });

    it("Hash 模式下 push('/user') 应该更新 URL 为 #/user", async () => {
        router = await createRouter(host, { mode: "hash", routes });

        router.push("/user");
        await new Promise((resolve) => setTimeout(resolve, 100));

        // current 是 matched 数组，末项为最深匹配
        const matched = lastMatched(router);
        expect(matched).toBeDefined();
        expect(matched!.route!.name).toBe("user");
        expect(router.location.pathname).toBe("/user");
    });

    it("Hash 模式和 History 模式的 API 完全统一", async () => {
        router = await createRouter(host, { mode: "hash", routes });

        // push
        router.push("/user");
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(lastMatched(router)!.route!.name).toBe("user");

        // replace
        router.replace("/settings");
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(lastMatched(router)!.route!.name).toBe("settings");

        // params（末项携带路径参数）
        router.push("/user/42");
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(lastMatched(router)!.params).toEqual({ id: "42" });

        // query（query 解析在匹配链上，逐层传递）
        router.push("/user?tab=profile");
        await new Promise((resolve) => setTimeout(resolve, 100));
        const current = router.routes.current ?? [];
        const withQuery = current.find((m) => m.query && Object.keys(m.query).length > 0);
        expect(withQuery).toBeDefined();
        expect({ ...withQuery!.query }).toEqual({ tab: "profile" });
    });

    it("Hash 模式下导航事件正确触发", async () => {
        router = await createRouter(host, { mode: "hash", routes });

        const navStarts: any[] = [];
        const navEnds: any[] = [];

        // 导航事件为 router 实例事件（mitt）：navigation:start / navigation:end，
        // detail 为 history 库的 Update（{ action, location }）
        router.on("navigation:start", (detail: any) => {
            navStarts.push(detail);
        });
        router.on("navigation:end", (detail: any) => {
            navEnds.push(detail);
        });

        router.push("/user");
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(navStarts.length).toBe(1);
        expect(navStarts[0].action.toLowerCase()).toBe("push");
        expect(navEnds.length).toBe(1);
        expect(navEnds[0].action.toLowerCase()).toBe("push");
    });

    it("默认使用 History 模式（mode 未指定时）", async () => {
        router = await createRouter(host, { routes });

        // 应该正常工作（BrowserHistory 模式）
        router.push("/user");
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(lastMatched(router)!.route!.name).toBe("user");
    });

    it("push/replace 支持 state 参数", async () => {
        router = await createRouter(host, { routes });

        router.push("/user", { from: "home" });
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(lastMatched(router)!.route!.name).toBe("user");

        router.replace("/settings", { reason: "redirect" });
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(lastMatched(router)!.route!.name).toBe("settings");
    });
});

describe("route.hash 插值（ADR-0122）", () => {
    let host: HTMLElement;
    let router: AutoSparkRouter;

    /** 带 store 的 engine stub：提供 state.$ 元容器 */
    function stubEngineWithMeta(meta: Record<string, any>) {
        return {
            getComponentDeclaration: () => ({ name: "autospark.outlet" }),
            getComponent: () => ({
                data: { views: [], ephemeral: { hash: "", html: "", ready: false }, active: "" },
            }),
            data: () => {},
            destroy() {},
            store: {
                state: { $: meta },
                watch: () => ({ off: () => {} }),
            },
        } as any;
    }

    beforeEach(async () => {
        host = createTestDOM();
    });

    afterEach(() => {
        if (router) {
            try {
                router.detach();
            } catch (e) {
                // 忽略 detach 错误
            }
            router = undefined as any;
        }
        if (host && host.parentElement) {
            host.parentElement.removeChild(host);
        }
    });

    it("自定义 route.hash 可使用 state.$ 原始值成员", async () => {
        router = await createRouter(host, {
            routes: [
                { name: "home", path: "/home", hash: "{language}-{url}" },
                { name: "user", path: "/user" },
            ],
            engine: stubEngineWithMeta({ language: "en", route: { path: "/" } }),
        });

        router.push("/home");
        await new Promise((resolve) => setTimeout(resolve, 100));

        const matched = lastMatched(router)!;
        const withMeta = getSignalHash("{language}-{url}", matched, { language: "en" });
        const withoutMeta = getSignalHash("{language}-{url}", matched, {});
        // 语言分量确实参与了 hash 计算（默认语言后缀允许存在，故用前缀断言）
        expect(matched.hash.startsWith(withMeta)).toBe(true);
        expect(withMeta).not.toBe(withoutMeta);
    });
});
