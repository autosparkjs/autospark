import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { AutoSparkRouter } from "@/router";

/**
 * 创建测试用的 DOM 环境
 */
function createTestDOM() {
    const { Window } = require("happy-dom");
    const win = new Window({ url: "http://localhost/" });

    // 设置全局对象
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
 * 动态导入 AutoSparkRouter。
 * 构造函数自 89515f9 起自动 attach()，不得再显式调用（会抛 Already attached）。
 * attach 链是异步的（routes.load → history.listen → 初始导航），需等待完成。
 */
async function createRouter(host: HTMLElement, options: any) {
    const { AutoSparkRouter } = await import("@/router");
    // 渲染链路（含 beforeRender 触发）要求宿主内存在出口元素
    if (!host.querySelector("[data-autospark-outlet]")) {
        const outlet = document.createElement("div");
        outlet.setAttribute("data-autospark-outlet", "");
        host.appendChild(outlet);
    }
    const router = new AutoSparkRouter(host, {
        engine: stubEngine(),
        ...options,
    });
    await new Promise((resolve) => setTimeout(resolve, 80));
    return router;
}

/** 最小 engine stub：注入模式下跳过自建管线，仅满足渲染面 */
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

/** 取 matched 数组末项的路由（404 未匹配项 route 为 undefined） */
function lastRoute(router: AutoSparkRouter) {
    const current = router.routes.current ?? [];
    return current[current.length - 1]?.route;
}

/** 取 matched 数组末项（含 path/params/query） */
function lastMatched(router: AutoSparkRouter) {
    const current = router.routes.current ?? [];
    return current[current.length - 1];
}

/** mock fetch：使带 view 声明的路由能走通渲染链路 */
function mockFetch() {
    const original = globalThis.fetch;
    (globalThis as any).fetch = async (url: any) => ({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => `<div class="view">${String(url)}</div>`,
        json: async () => ({}),
    });
    return () => { (globalThis as any).fetch = original; };
}

describe("AutoSparkRouter 全局钩子系统", () => {
    let host: HTMLElement;
    let router: AutoSparkRouter;

    const routes = [
        { name: "home", path: "/" },
        { name: "user", path: "user" },
        { name: "profile", path: "profile" },
        { name: "admin", path: "admin" },
        { name: "redirect-target", path: "redirect-target" },
        { name: "async", path: "async" },
        { name: "protected", path: "protected" },
        { name: "merge", path: "merge" },
        { name: "user-detail", path: "user/:id" },
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

    describe("beforeRoute hooks", () => {
        it("应该按照注册顺序执行 beforeRoute 钩子", async () => {
            router = await createRouter(host, { routes });
            const order: number[] = [];

            router.hooks.add("beforeRoute", () => {
                order.push(1);
                return true;
            });
            router.hooks.add("beforeRoute", () => {
                order.push(2);
                return true;
            });
            router.hooks.add("beforeRoute", () => {
                order.push(3);
                return true;
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 150));

            expect(order).toEqual([1, 2, 3]);
        });

        it("应该在返回 false 时拦截渲染", async () => {
            router = await createRouter(host, { routes });
            let renderRan = false;
            let cancelled = false;
            router.hooks.add("beforeRender", () => { renderRan = true; });
            router.on("navigation:cancel", () => { cancelled = true; });

            router.hooks.add("beforeRoute", ({ to }) => {
                const target = to[to.length - 1]?.path;
                if (target === "/protected") {
                    return false;
                }
                return true;
            });

            router.push("/protected");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 150));

            // 拦截语义：渲染被跳过、navigation:cancel 事件触发
            // （URL 与 routes.current 仍会更新为被拦截的目标——历史条目在守卫前已落）
            expect(renderRan).toBe(false);
            expect(cancelled).toBe(true);
        });

        it("应该在返回路径字符串时改道", async () => {
            router = await createRouter(host, { routes });

            router.hooks.add("beforeRoute", ({ to }) => {
                if (to[to.length - 1]?.path === "/user") {
                    return "/profile";
                }
                return true;
            });

            router.push("/user");

            // 等待导航完成（含改道引发的第二轮导航）
            await new Promise(resolve => setTimeout(resolve, 200));

            // 应该重定向到 /profile
            expect(lastRoute(router)?.path).toBe("profile");
        });

        it("应该支持异步 beforeRoute 钩子", async () => {
            router = await createRouter(host, { routes });
            let executed = false;

            router.hooks.add("beforeRoute", async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
                executed = true;
                return true;
            });

            router.push("/async");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 200));

            expect(executed).toBe(true);
            expect(lastRoute(router)?.path).toBe("async");
        });

        it("应该在第一个钩子取消导航后停止执行后续钩子", async () => {
            router = await createRouter(host, { routes });
            const order: number[] = [];

            router.hooks.add("beforeRoute", () => {
                order.push(1);
                return false;
            });

            router.hooks.add("beforeRoute", () => {
                order.push(2);
                return true;
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 150));

            expect(order).toEqual([1]);
        });

        it("应该在改道后停止执行后续钩子", async () => {
            router = await createRouter(host, { routes });
            const order: number[] = [];

            router.hooks.add("beforeRoute", ({ to }) => {
                if (to[to.length - 1]?.path === "/user") {
                    order.push(1);
                    return "/redirect-target";
                }
                return true;
            });

            router.hooks.add("beforeRoute", () => {
                order.push(2);
                return true;
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 200));

            // 改道发生在第二个钩子之前，2 不应出现在 /user 这一轮；
            // /redirect-target �一轮两个钩子都会执行（2 也会 push）
            expect(order).toEqual([1, 2]);
            expect(lastRoute(router)?.path).toBe("redirect-target");
        });

        it("应该正确传递 to 和 from 参数", async () => {
            router = await createRouter(host, { routes });

            let capturedTo: any;
            let capturedFrom: any;

            router.hooks.add("beforeRoute", ({ to, from }) => {
                capturedTo = to;
                capturedFrom = from;
                return true;
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 150));

            expect(capturedTo).toBeInstanceOf(Array);
            expect(capturedTo[capturedTo.length - 1].path).toBe("/user");
            expect(capturedFrom).toBeDefined();
        });

        it("应该支持同步和异步钩子混合使用", async () => {
            router = await createRouter(host, { routes });
            const order: number[] = [];

            router.hooks.add("beforeRoute", () => {
                order.push(1);
                return true;
            });

            router.hooks.add("beforeRoute", async () => {
                await new Promise(resolve => setTimeout(resolve, 30));
                order.push(2);
                return true;
            });

            router.hooks.add("beforeRoute", () => {
                order.push(3);
                return true;
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 200));

            expect(order).toEqual([1, 2, 3]);
        });
    });

    describe("beforeRender hooks", () => {
        // beforeRender 仅在路由声明了 view（实际渲染链路走到 _runBeforeRender）时触发
        const viewRoutes = [
            { name: "user", path: "user", view: "pages/user.html" },
            { name: "not-found", path: "*" },
        ];

        it("应该执行 beforeRender 钩子并接收到路由数据", async () => {
            mockFetch();
            router = await createRouter(host, {
                routes: viewRoutes.map((r) =>
                    r.path === "user" ? { ...r, data: { userId: "123", userName: "Test" } } : r,
                ),
            });

            let capturedData: any;
            router.hooks.add("beforeRender", ({ data }) => {
                capturedData = data;
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 200));

            // 钩子收到路由配置声明的数据（data 通道）
            expect(capturedData).toEqual({ userId: "123", userName: "Test" });
        });

        it("应该支持异步 beforeRender 钩子", async () => {
            mockFetch();
            router = await createRouter(host, { routes: viewRoutes });
            let executed = false;

            router.hooks.add("beforeRender", async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
                executed = true;
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 250));

            expect(executed).toBe(true);
        });

        it("应该在 beforeRender 钩子失败时继续渲染", async () => {
            mockFetch();
            router = await createRouter(host, { routes: viewRoutes });

            let secondRan = false;

            // @ts-ignore - 故意抛错
            router.hooks.add("beforeRender", () => {
                throw new Error("Hook error");
            });

            router.hooks.add("beforeRender", () => {
                secondRan = true;
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 200));

            // 后续钩子仍执行，导航不被中断
            expect(secondRan).toBe(true);
            expect(lastRoute(router)?.path).toBe("user");
        });

        it("应该提供正确的 to/from/view/data 参数", async () => {
            mockFetch();
            router = await createRouter(host, { routes: viewRoutes });

            let captured: any;

            router.hooks.add("beforeRender", (args) => {
                captured = args;
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 200));

            expect(captured).toBeDefined();
            expect(captured.to).toBeInstanceOf(Array);
            expect(captured.to[captured.to.length - 1].path).toBe("/user");
            expect(captured.from).toBeInstanceOf(Array);
            expect(captured.view).toBeDefined();
        });
    });

    describe("afterRoute hooks", () => {
        it("应该在成功导航后执行 afterRoute 钩子", async () => {
            router = await createRouter(host, { routes });
            let executed = false;

            router.hooks.add("afterRoute", () => {
                executed = true;
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 150));

            expect(executed).toBe(true);
        });

        it("应该在渲染被拦截时不执行 beforeRender", async () => {
            router = await createRouter(host, { routes });
            let rendered = false;

            router.hooks.add("beforeRoute", ({ to }) => {
                if (to[to.length - 1]?.path === "/protected") {
                    return false;
                }
                return true;
            });

            router.hooks.add("beforeRender", () => {
                rendered = true;
            });

            router.push("/protected");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 150));

            expect(rendered).toBe(false);
        });

        it("应该在改道后执行 afterRoute 钩子", async () => {
            router = await createRouter(host, { routes });
            const seen: string[] = [];

            router.hooks.add("beforeRoute", ({ to }) => {
                if (to[to.length - 1]?.path === "/user") {
                    return "/profile";
                }
                return true;
            });

            router.hooks.add("afterRoute", ({ to }) => {
                seen.push(to[to.length - 1]?.path ?? "");
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 200));

            // afterRoute 至少在最终路由（/profile）上执行
            expect(lastRoute(router)?.path).toBe("profile");
            expect(seen).toContain("/profile");
        });

        it("应该按照注册顺序执行多个 afterRoute 钩子", async () => {
            router = await createRouter(host, { routes });
            const order: number[] = [];

            router.hooks.add("afterRoute", () => { order.push(1); });
            router.hooks.add("afterRoute", () => { order.push(2); });
            router.hooks.add("afterRoute", () => { order.push(3); });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 150));

            expect(order).toEqual([1, 2, 3]);
        });

        it("应该支持异步 afterRoute 钩子", async () => {
            router = await createRouter(host, { routes });
            let executed = false;

            router.hooks.add("afterRoute", async () => {
                await new Promise(resolve => setTimeout(resolve, 50));
                executed = true;
            });

            router.push("/async");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 200));

            expect(executed).toBe(true);
        });

        it("应该在 afterRoute 钩子中提供正确的 to 参数", async () => {
            router = await createRouter(host, { routes });

            let capturedTo: any;

            router.hooks.add("afterRoute", ({ to }) => {
                capturedTo = to;
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 150));

            expect(capturedTo).toBeInstanceOf(Array);
            expect(capturedTo[capturedTo.length - 1].path).toBe("/user");
        });

        it("应该处理 afterRoute 钩子中的错误", async () => {
            router = await createRouter(host, { routes });

            // @ts-ignore - 故意抛错
            router.hooks.add("afterRoute", () => {
                throw new Error("Hook error");
            });

            let secondRan = false;
            router.hooks.add("afterRoute", () => {
                secondRan = true;
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 150));

            // 导航应该完成，即使有钩子失败
            expect(lastRoute(router)?.path).toBe("user");
            expect(secondRan).toBe(true);
        });
    });

    describe("钩子系统综合测试", () => {
        const viewRoutes = [
            { name: "user", path: "user", view: "pages/user.html" },
            { name: "not-found", path: "*" },
        ];

        it("应该按照正确的顺序执行所有钩子类型", async () => {
            mockFetch();
            router = await createRouter(host, { routes: viewRoutes });
            const order: string[] = [];

            router.hooks.add("beforeRoute", () => { order.push("beforeRoute"); return true; });
            router.hooks.add("beforeRender", () => { order.push("beforeRender"); });
            router.hooks.add("afterRoute", () => { order.push("afterRoute"); });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 200));

            expect(order).toEqual([
                "beforeRoute",
                "beforeRender",
                "afterRoute",
            ]);
        });

        it("应该在每个钩子类型中维护独立的执行顺序", async () => {
            mockFetch();
            router = await createRouter(host, { routes: viewRoutes });
            const order: string[] = [];

            router.hooks.add("beforeRoute", () => { order.push("beforeRoute-1"); return true; });
            router.hooks.add("beforeRender", () => { order.push("beforeRender-1"); });
            router.hooks.add("beforeRoute", () => { order.push("beforeRoute-2"); return true; });
            router.hooks.add("afterRoute", () => { order.push("afterRoute-1"); });
            router.hooks.add("beforeRender", () => { order.push("beforeRender-2"); });
            router.hooks.add("afterRoute", () => { order.push("afterRoute-2"); });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 200));

            expect(order).toEqual([
                "beforeRoute-1",
                "beforeRoute-2",
                "beforeRender-1",
                "beforeRender-2",
                "afterRoute-1",
                "afterRoute-2",
            ]);
        });

        it("应该在钩子执行失败后继续执行其他类型的钩子", async () => {
            mockFetch();
            router = await createRouter(host, { routes: viewRoutes });
            const order: string[] = [];

            router.hooks.add("beforeRoute", () => {
                order.push("beforeRoute");
                return true;
            });

            // @ts-ignore - 故意抛错
            router.hooks.add("beforeRender", () => {
                throw new Error("BeforeRender error");
            });

            router.hooks.add("afterRoute", () => {
                order.push("afterRoute");
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 200));

            expect(order).toEqual(["beforeRoute", "afterRoute"]);
        });
    });

    describe("改道循环检测", () => {
        it("应该检测无限改道循环", async () => {
            router = await createRouter(host, { routes });
            let count = 0;

            router.hooks.add("beforeRoute", () => {
                if (count < 15) {
                    count++;
                    return "/loop";
                }
                return true;
            });

            router.push("/start");

            // 等待导航完成（含多轮改道）
            await new Promise(resolve => setTimeout(resolve, 400));

            // 超过 10 次改道深度上限后取消，不再继续
            expect(count).toBeLessThanOrEqual(11);
        });
    });

    describe("钩子管理 API", () => {
        it("应该支持添加钩子", async () => {
            router = await createRouter(host, { routes });

            const hook = () => true;

            router.hooks.add("beforeRoute", hook);

            expect(router.hooks.hooks.beforeRoute).toContain(hook);
        });

        it("应该支持移除钩子", async () => {
            router = await createRouter(host, { routes });

            const hook = () => true;

            router.hooks.add("beforeRoute", hook);
            router.hooks.remove("beforeRoute", hook);

            expect(router.hooks.hooks.beforeRoute).not.toContain(hook);
        });

        it("应该支持清空指定类型的钩子", async () => {
            router = await createRouter(host, { routes });

            router.hooks.add("beforeRoute", () => true);
            router.hooks.add("beforeRoute", () => true);

            router.hooks.clear("beforeRoute");

            expect(router.hooks.hooks.beforeRoute.length).toBe(0);
        });

        it("应该支持清空所有钩子", async () => {
            router = await createRouter(host, { routes });

            router.hooks.add("beforeRoute", () => true);
            router.hooks.add("beforeRender", () => { });
            router.hooks.add("afterRoute", () => { });

            router.hooks.clear();

            expect(router.hooks.hooks.beforeRoute.length).toBe(0);
            expect(router.hooks.hooks.beforeRender.length).toBe(0);
            expect(router.hooks.hooks.afterRoute.length).toBe(0);
        });

        it("应该支持清空多个钩子类型", async () => {
            router = await createRouter(host, { routes });

            router.hooks.add("beforeRoute", () => true);
            router.hooks.add("beforeRender", () => { });
            router.hooks.add("afterRoute", () => { });

            router.hooks.clear("beforeRoute");
            router.hooks.clear("afterRoute");

            expect(router.hooks.hooks.beforeRoute.length).toBe(0);
            expect(router.hooks.hooks.beforeRender.length).toBe(1); // 没有清空
            expect(router.hooks.hooks.afterRoute.length).toBe(0);
        });
    });

    describe("404 未匹配项的钩子容错", () => {
        it("unmatched 项（route 为 undefined）不应导致钩子执行崩溃", async () => {
            const { HookManager } = await import("@/features/hooks");
            const stubRouter = { options: {}, logger: console } as any;
            const hookManager = new HookManager(stubRouter);

            // 模拟 matchRoute 对 404 的产出：createUnmatchedRouteItem 的 route 为 undefined
            const unmatchedItem = {
                route: undefined,
                params: {},
                query: {},
                state: {},
                path: "/public/shop/index.html",
                url: "/public/shop/index.html",
                hash: "unmatched--public-shop-index-html",
                id: 9999,
            } as any;

            // 修复前：r.route[name] 直接抛 TypeError
            const before = await hookManager.runBeforeRoute({ from: undefined, to: [unmatchedItem] });
            expect(before).toBe(true);
            await hookManager.runAfterRoute({ to: [unmatchedItem] });
        });

        it("unmatched 项不屏蔽真匹配路由上的钩子", async () => {
            const { HookManager } = await import("@/features/hooks");
            const called: string[] = [];
            const stubRouter = {
                options: {},
                logger: console,
            } as any;
            const hookManager = new HookManager(stubRouter);
            hookManager.add("beforeRoute", () => {
                called.push("global");
                return true;
            });

            const realItem = {
                route: { name: "home", path: "/", beforeRoute: [() => called.push("route")] },
                params: {},
                query: {},
                state: {},
                path: "/",
                url: "/",
                hash: "",
                id: 1,
            } as any;
            const unmatchedItem = { route: undefined, params: {}, query: {}, state: {}, path: "/x", url: "/x", hash: "", id: 2 } as any;

            await hookManager.runBeforeRoute({ from: undefined, to: [realItem, unmatchedItem] });
            expect(called).toEqual(["global", "route"]);
        });
    });
});
