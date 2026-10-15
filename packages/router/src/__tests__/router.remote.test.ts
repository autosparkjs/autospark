import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { AutoSparkRouter } from "@/router";

/**
 * 创建测试用的 DOM 环境
 */
function createTestDOM() {
    const { Window } = require("happy-dom");
    const win = new Window({ url: "http://localhost/" });

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
    // @ts-ignore
    win.SyntaxError = SyntaxError;

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

describe("Remote route loading", () => {
    let host: HTMLElement;
    let router: AutoSparkRouter;

    const baseRoutes = [
        { name: "home", path: "/" },
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

    it("routes 配置为函数时应该调用函数返回路由配置", async () => {
        const routeLoader = () => [
            { name: "home", path: "/" },
            { name: "about", path: "/about" },
            { name: "not-found", path: "*" },
        ];

        router = await createRouter(host, { routes: routeLoader });

        // 路由表应该包含函数返回的路由
        router.push("/about");
        await new Promise((resolve) => setTimeout(resolve, 100));
        const matched = lastMatched(router);
        expect(matched).toBeDefined();
        expect(matched!.route!.name).toBe("about");
    });

    it("routes 配置为异步函数时应该 await 后返回路由配置", async () => {
        const asyncRouteLoader = async () => {
            return [
                { name: "home", path: "/" },
                { name: "dashboard", path: "/dashboard" },
                { name: "not-found", path: "*" },
            ];
        };

        router = await createRouter(host, { routes: asyncRouteLoader });

        router.push("/dashboard");
        await new Promise((resolve) => setTimeout(resolve, 100));
        const matched = lastMatched(router);
        expect(matched).toBeDefined();
        expect(matched!.route!.name).toBe("dashboard");
    });

    // 待办：loadRemoteRoutes 属运行时路由表变更，ADR-0007 决策 7 划出本次范围
    it.skip("loadRemoteRoutes() 应该合并远程路由到现有路由表", async () => {
        router = await createRouter(host, { routes: baseRoutes });

        // 使用 loadRemoteRoutes 加载额外路由
        await router.routes.loadRemoteRoutes([
            { name: "settings", path: "/settings" },
            { name: "profile", path: "/profile" },
        ]);

        // 验证新路由可以匹配
        router.push("/settings");
        expect(router.routes.current.route!.name).toBe("settings");

        router.push("/profile");
        expect(router.routes.current.route!.name).toBe("profile");
    });

    it.skip("loadRemoteRoutes() 支持传入函数", async () => {
        router = await createRouter(host, { routes: baseRoutes });

        const loader = () => [
            { name: "reports", path: "/reports" },
        ];

        await router.routes.loadRemoteRoutes(loader);

        router.push("/reports");
        expect(router.routes.current.route!.name).toBe("reports");
    });

    it.skip("loadRemoteRoutes() 传入无效格式时应该抛出错误", async () => {
        router = await createRouter(host, { routes: baseRoutes });

        // 传入无效数据应该抛错
        await expect(router.routes.loadRemoteRoutes(null as any)).rejects.toThrow();
    });
});
