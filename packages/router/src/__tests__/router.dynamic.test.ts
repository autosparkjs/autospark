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

    // happy-dom Window 缺少 SyntaxError
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

describe("Dynamic route registration API", () => {
    let host: HTMLElement;
    let router: KylinRouter;

    const routes = [
        { name: "home", path: "/" },
        { name: "user", path: "/user" },
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

    it("addRoute(route) 应该添加新路由到路由表", async () => {
        router = await createRouter(host, { routes });

        // 添加新路由
        router.routes.add({ name: "settings", path: "/settings" });

        // 导航到新添加的路由
        router.push("/settings");

        expect(router.routes.current.route).not.toBeNull();
        expect(router.routes.current.route!.name).toBe("settings");
    });

    it("动态添加的路由与静态路由使用统一的优先级规则", async () => {
        router = await createRouter(host, { routes });

        // 先添加参数化路由，后添加静态路由 - 静态路由应优先匹配
        router.routes.add({ name: "user-detail", path: "/user/:id" });
        router.routes.add({ name: "user-profile", path: "/user/profile" });

        router.push("/user/profile");

        // 静态路由应该优先
        expect(router.routes.current.route).not.toBeNull();
        expect(router.routes.current.route!.name).toBe("user-profile");
    });

    it("removeRoute(name) 应该删除指定名称的路由", async () => {
        router = await createRouter(host, { routes });

        // 添加一个路由
        router.routes.add({ name: "settings", path: "/settings" });
        router.push("/settings");
        expect(router.routes.current.route!.name).toBe("settings");

        // 删除路由
        router.routes.remove("settings");

        // 导航到已删除的路由应该匹配通配符
        router.push("/settings");
        expect(router.routes.current.route!.name).toBe("not-found");
    });

    it("删除当前正在访问的路由时应该重定向到 404 路由", async () => {
        router = await createRouter(host, {
            routes,
            notFound: { name: "404", path: "*" },
        });

        router.routes.add({ name: "settings", path: "/settings" });
        router.push("/settings");
        expect(router.routes.current.route!.name).toBe("settings");

        // 删除当前访问的路由
        router.routes.remove("settings");

        // 应该重定向到 404 路由
        expect(router.routes.current.route!.name).toBe("404");
    });

    it("删除不存在的路由应该静默处理（不抛出错误）", async () => {
        router = await createRouter(host, { routes });

        // 删除不存在的路由不应抛错
        expect(() => router.routes.remove("nonexistent")).not.toThrow();
    });

    it("添加重复 name 的路由应该覆盖旧路由", async () => {
        router = await createRouter(host, { routes });

        // 添加路由
        router.routes.add({ name: "settings", path: "/settings" });
        router.push("/settings");
        expect(router.routes.current.route!.name).toBe("settings");

        // 覆盖同名路由到不同路径
        router.routes.add({ name: "settings", path: "/config" });
        router.push("/config");
        expect(router.routes.current.route!.name).toBe("settings");
        expect(router.location.pathname).toBe("/config");
    });
});
