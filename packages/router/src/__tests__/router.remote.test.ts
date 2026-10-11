import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { KylinRouter } from "@/router";

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

async function createRouter(host: HTMLElement, options: any) {
    const { KylinRouter } = await import("@/router");
    const router = new KylinRouter(host, options);
    router.attach();
    return router;
}

describe("Remote route loading", () => {
    let host: HTMLElement;
    let router: KylinRouter;

    const baseRoutes = [
        { name: "home", path: "/" },
        { name: "not-found", path: "*" },
    ];

    beforeEach(async () => {
        host = createTestDOM();
    });

    afterEach(() => {
        if (router) {
            router.detach();
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
        expect(router.routes.current.route).not.toBeNull();
        expect(router.routes.current.route!.name).toBe("about");
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
        expect(router.routes.current.route).not.toBeNull();
        expect(router.routes.current.route!.name).toBe("dashboard");
    });

    it("loadRemoteRoutes() 应该合并远程路由到现有路由表", async () => {
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

    it("loadRemoteRoutes() 支持传入函数", async () => {
        router = await createRouter(host, { routes: baseRoutes });

        const loader = () => [
            { name: "reports", path: "/reports" },
        ];

        await router.routes.loadRemoteRoutes(loader);

        router.push("/reports");
        expect(router.routes.current.route!.name).toBe("reports");
    });

    it("loadRemoteRoutes() 传入无效格式时应该抛出错误", async () => {
        router = await createRouter(host, { routes: baseRoutes });

        // 传入无效数据应该抛错
        await expect(router.routes.loadRemoteRoutes(null as any)).rejects.toThrow();
    });
});
