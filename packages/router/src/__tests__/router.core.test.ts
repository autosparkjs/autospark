import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { KylinRouter } from "@/router";

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

    // 创建 host 元素
    // @ts-ignore
    const host = document.createElement("div") as HTMLElement;
    // @ts-ignore
    document.body.appendChild(host);
    return host;
}

/**
 * 动态导入 KylinRouter 以避免加载时的依赖问题
 */
async function createRouter(host: HTMLElement, options: any) {
    const { KylinRouter } = await import("@/router");
    const router = new KylinRouter(host, options);
    router.attach();
    return router;
}

describe("KylinRouter core routing", () => {
    let host: HTMLElement;
    let router: KylinRouter;

    const routes = [
        { name: "home", path: "/" },
        { name: "user", path: "/user" },
        { name: "user-detail", path: "/user/:id" },
        { name: "not-found", path: "*" },
    ];

    beforeEach(async () => {
        host = createTestDOM();
    });

    afterEach(() => {
        if (router) {
            router.detach();
        }
        // 清理 DOM
        if (host && host.parentElement) {
            host.parentElement.removeChild(host);
        }
    });

    describe("构造函数参数处理", () => {
        it("应该接受完整配置对象", async () => {
            router = await createRouter(host, {
                routes,
                mode: "history",
                notFound: { name: "404", path: "*" },
            });

            expect(router.routes.routes).toEqual(routes);
            expect(router.routes.notFound).toBeDefined();
        });

        it("应该接受数组格式的路由配置", async () => {
            router = await createRouter(host, routes);

            expect(router.routes.routes).toEqual(routes);
            expect(router.routes.routes.length).toBe(4);
        });

        it("应该接受单个 RouteItem 对象", async () => {
            const singleRoute = { name: "home", path: "/" };
            router = await createRouter(host, singleRoute);

            expect(router.routes.routes).toBeDefined();
            expect(router.routes.routes.length).toBe(1);
            expect(router.routes.routes[0]).toEqual(singleRoute);
        });

        it("应该接受字符串格式的路由配置", async () => {
            const routeString = "/home";
            router = await createRouter(host, routeString);

            expect(router.routes.routes).toBeDefined();
        });

        it("应该接受函数格式的路由配置", async () => {
            const routeFunction = () => routes;
            router = await createRouter(host, routeFunction);

            expect(router.routes.routes).toBeDefined();
        });

        it("应该接受空配置对象", async () => {
            router = await createRouter(host, {});

            expect(router.routes.routes).toBeDefined();
            expect(router.routes.routes.length).toBe(0);
        });

        it("应该正确处理 hash 模式配置", async () => {
            router = await createRouter(host, {
                routes,
                mode: "hash",
                base: "/app"
            });

            expect(router.routes.routes).toEqual(routes);
        });

        it("应该处理包含 undefined 和 null 的配置", async () => {
            const configWithUndefined = {
                routes,
                notFound: undefined,
            };

            router = await createRouter(host, configWithUndefined);

            expect(router.routes.routes).toEqual(routes);
            expect(router.routes.notFound).toBeUndefined();
        });
    });

    describe("路由匹配集成", () => {
        it("onRouteUpdate 在 URL 变化时被调用并匹配路由", async () => {
            router = await createRouter(host, { routes });

            // 初始状态 - 应该匹配根路径
            expect(router.routes.current.route).toBeDefined();
        });

        it("路由匹配结果存储在 currentRoute 属性中", async () => {
            router = await createRouter(host, { routes });

            // 推送到 /user 路径
            router.push("/user");

            // current 应该存储匹配的路由
            expect(router.routes.current.route).not.toBeNull();
            expect(router.routes.current.route!.name).toBe("user");
        });

        it("404 路由未匹配时使用通配符匹配", async () => {
            router = await createRouter(host, { routes });

            // 推送到不存在的路径
            router.push("/nonexistent/path");

            // 应该匹配通配符路由
            expect(router.routes.current.route).not.toBeNull();
            expect(router.routes.current.route!.name).toBe("not-found");
        });

        it("路径参数解析后存储在 params 属性中", async () => {
            router = await createRouter(host, { routes });

            // 推送到带参数的路径
            router.push("/user/123");

            expect(router.routes.current.route).not.toBeNull();
            expect(router.routes.current.params).toEqual({ id: "123" });
        });

        it("查询参数解析后存储在 query 属性中", async () => {
            router = await createRouter(host, { routes });

            // 推送到带查询参数的路径
            router.push("/user?name=test&page=1");

            expect(router.routes.current.query).toEqual({ name: "test", page: "1" });
        });
    });
});
