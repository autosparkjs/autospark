import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { AutoSparkRouter } from "@/router";

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

/** 取 matched 数组末项 */
function lastMatched(router: AutoSparkRouter) {
    const current = router.routes.current ?? [];
    return current[current.length - 1];
}

describe("AutoSparkRouter core routing", () => {
    let host: HTMLElement;
    let router: AutoSparkRouter;

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
            router = undefined as any;
        }
        // 清理 DOM
        if (host && host.parentElement) {
            host.parentElement.removeChild(host);
        }
    });

    describe("构造函数参数处理", () => {
        // 规范化会合并路径树（/ 并入根、/user 与 /user/:id 并成一个 user 节点），
        // 故不直接断言 children.length，改用命名路由缓存与实际匹配验证
        it("应该接受完整配置对象", async () => {
            router = await createRouter(host, {
                routes,
                mode: "history",
            });

            expect(router.routes.root).toBeDefined();
            expect(router.routes.namedRouteItems?.size).toBe(4);
            expect(router.mode).toBe("history");
            // 四条命名路由均可匹配（match 返回 matched 数组，根项在首位，最深匹配在末位）
            expect(router.routes.match("/")?.[router.routes.match("/")!.length - 1]?.route?.name).toBe("home");
            expect(router.routes.match("/user")?.slice(-1)[0]?.route?.name).toBe("user");
            expect(router.routes.match("/user/123")?.slice(-1)[0]?.route?.name).toBe("user-detail");
            expect(router.routes.match("/nope")?.slice(-1)[0]?.route?.name).toBe("not-found");
        });

        it("应该接受数组格式的路由配置", async () => {
            router = await createRouter(host, routes);

            expect(router.routes.namedRouteItems?.size).toBe(4);
            expect(router.routes.match("/user")?.slice(-1)[0]?.route?.name).toBe("user");
        });

        it("应该接受单个 RouteItem 对象", async () => {
            const singleRoute = { name: "home", path: "home" };
            router = await createRouter(host, singleRoute);

            expect(router.routes.namedRouteItems?.size).toBe(1);
            expect(router.routes.match("/home")?.slice(-1)[0]?.route?.name).toBe("home");
        });

        it("字符串格式配置经 fetch 加载路由表 JSON", async () => {
            // 字符串配置 = 以该 URL fetch 路由表 JSON
            const originalFetch = globalThis.fetch;
            let fetchedUrl = "";
            (globalThis as any).fetch = async (url: any) => {
                fetchedUrl = String(url);
                return {
                    ok: true,
                    status: 200,
                    statusText: "OK",
                    json: async () => routes,
                    text: async () => JSON.stringify(routes),
                } as any;
            };
            try {
                router = await createRouter(host, "/api/routes.json");
                expect(fetchedUrl).toBe("/api/routes.json");
                expect(router.routes.namedRouteItems?.size).toBe(4);
            } finally {
                (globalThis as any).fetch = originalFetch;
            }
        });

        it("应该接受函数格式的路由配置", async () => {
            const routeFunction = () => routes;
            router = await createRouter(host, routeFunction);

            expect(router.routes.namedRouteItems?.size).toBe(4);
        });

        it("应该接受空配置对象", async () => {
            router = await createRouter(host, {} as any);

            expect(router.routes.root).toBeDefined();
            expect(router.routes.root.path).toBe("/");
            expect(router.routes.namedRouteItems?.size ?? 0).toBe(0);
        });

        it("应该正确处理 hash 模式配置", async () => {
            router = await createRouter(host, {
                routes,
                mode: "hash",
                base: "/app",
            });

            expect(router.mode).toBe("hash");
            expect(router.routes.namedRouteItems?.size).toBe(4);
        });

        it("应该处理包含 undefined 的配置", async () => {
            const configWithUndefined = {
                routes,
                home: undefined,
            };

            router = await createRouter(host, configWithUndefined);

            expect(router.routes.namedRouteItems?.size).toBe(4);
            // Object.assign 会用 undefined 覆盖缺省——使用处（home()）以 || "/" 兜底
            expect(router.options.home || "/").toBe("/");
        });
    });

    describe("路由匹配集成", () => {
        it("onRouteUpdate 在 URL 变化时被调用并匹配路由", async () => {
            router = await createRouter(host, { routes });

            // 初始导航后 current 已填充——末项为根匹配
            expect(lastMatched(router)).toBeDefined();
            expect(lastMatched(router)!.route).toBeDefined();
        });

        it("路由匹配结果存储在 routes.current 属性中", async () => {
            router = await createRouter(host, { routes });

            // 推送到 /user 路径
            router.push("/user");
            await new Promise((resolve) => setTimeout(resolve, 100));

            // current 是 matched 数组，末项为最深匹配
            const matched = lastMatched(router);
            expect(matched).toBeDefined();
            expect(matched!.route!.name).toBe("user");
        });

        it("404 路由未匹配时使用通配符匹配", async () => {
            router = await createRouter(host, { routes });

            // 推送到不存在的路径（"*" 为单层通配，故用单段路径）
            router.push("/nonexistent");
            await new Promise((resolve) => setTimeout(resolve, 100));

            // 应该匹配通配符路由
            const matched = lastMatched(router);
            expect(matched).toBeDefined();
            expect(matched!.route?.name).toBe("not-found");
        });

        it("路径参数解析后存储在 params 属性中", async () => {
            router = await createRouter(host, { routes });

            // 推送到带参数的路径
            router.push("/user/123");
            await new Promise((resolve) => setTimeout(resolve, 100));

            const matched = lastMatched(router);
            expect(matched).toBeDefined();
            expect(matched!.params).toEqual({ id: "123" });
        });

        it("查询参数解析后存储在 query 属性中", async () => {
            router = await createRouter(host, { routes });

            // 推送到带查询参数的路径
            router.push("/user?name=test&page=1");
            await new Promise((resolve) => setTimeout(resolve, 100));

            // query 解析在匹配链的根项上（子项由 matchRoute 逐层传递）
            const current = router.routes.current ?? [];
            const withQuery = current.find((m) => m.query && Object.keys(m.query).length > 0);
            expect(withQuery).toBeDefined();
            expect({ ...withQuery!.query }).toEqual({ name: "test", page: "1" });
        });
    });
});
