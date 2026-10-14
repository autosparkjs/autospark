import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { AutoSparkRouter } from "@/router";

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
 * 构造函数自 89515f9 起自动 attach()（同步完成绑定，异步完成路由表加载）。
 */
async function createRouter(host: HTMLElement, options: any) {
    const { AutoSparkRouter } = await import("@/router");
    if (!host.querySelector("[data-autospark-outlet]")) {
        const outlet = document.createElement("div");
        outlet.setAttribute("data-autospark-outlet", "");
        host.appendChild(outlet);
    }
    // 字符串路由配置会触发 fetch；无网络场景下兜底为空表
    const originalFetch = globalThis.fetch;
    (globalThis as any).fetch = async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => [],
        text: async () => "[]",
    });
    try {
        const opts =
            options && typeof options === "object" && !Array.isArray(options)
                ? { engine: stubEngine(), ...options }
                : { engine: stubEngine(), routes: options };
        return new AutoSparkRouter(host, opts);
    } finally {
        (globalThis as any).fetch = originalFetch;
    }
}

describe("AutoSparkRouter attach/detach 功能", () => {
    let host: HTMLElement;
    let router: AutoSparkRouter;

    const routes = [
        { name: "home", path: "/" },
        { name: "user", path: "/user" },
        { name: "user-detail", path: "/user/:id" },
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
        // 清理 DOM
        if (host && host.parentElement) {
            host.parentElement.removeChild(host);
        }
    });

    describe("任务 1: options 和 attached 属性", () => {
        it("测试 1: 构造函数接收配置后，options 属性应包含解析后的完整配置", async () => {
            router = await createRouter(host, {
                routes,
                mode: "history",
            });

            // 验证 options 属性存在且包含完整配置
            expect(router.options).toBeDefined();
            expect(router.options.routes).toEqual(routes);
            expect(router.options.mode).toBe("history");
        });

        it("测试 2: 构造函数自动 attach，路由表加载完成后 attached 为 true", async () => {
            router = await createRouter(host, { routes });

            // attached 在 routes.load() 链完成后置位；内存路由表只需微任务，
            // 但 createRouter 内部已有 await，此处再等一拍确保确定性
            await new Promise((resolve) => setTimeout(resolve, 80));
            expect(router.attached).toBe(true);
        });

        it("测试 3: 构造函数应设置 host 属性并标记 data-autospark-router", async () => {
            router = await createRouter(host, { routes });

            expect(router.host).toBe(host);
            expect(host.hasAttribute("data-autospark-router")).toBe(true);
            expect((host as any).router).toBe(router);
        });

        it("测试 4: 构造函数应正确解析各种格式的 options（数组、字符串、对象等）", async () => {
            // 为这些测试创建临时 host 元素
            const tempHost1 = document.createElement("div");
            const tempHost2 = document.createElement("div");
            const tempHost3 = document.createElement("div");

            // 测试数组格式
            let router1 = await createRouter(tempHost1, routes);
            expect(router1.options.routes).toEqual(routes);
            expect(router1.options.routes.length).toBe(3);

            // 测试字符串格式
            let router2 = await createRouter(tempHost2, "/home");
            expect(router2.options.routes).toBeDefined();

            // 测试单个 RouteItem 对象
            const singleRoute = { name: "home", path: "/" };
            let router3 = await createRouter(tempHost3, singleRoute);
            expect(router3.options.routes).toBeDefined();

            router1.detach();
            router2.detach();
            router3.detach();
            tempHost1.remove();
            tempHost2.remove();
            tempHost3.remove();
        });
    });

    describe("任务 2: attach() 方法完整绑定逻辑", () => {
        it("测试 1: attach() 已在构造时调用，attached 应为 true", async () => {
            router = await createRouter(host, { routes });
            // attached 在 routes.load() 链完成后置位
            await new Promise((resolve) => setTimeout(resolve, 80));
            expect(router.attached).toBe(true);
        });

        it("测试 2: attach() 应开始监听 history 变化", async () => {
            router = await createRouter(host, { routes });

            // 等待 attach 链完成（history.listen 在 routes.load() 之后注册）
            await new Promise((resolve) => setTimeout(resolve, 80));

            // 验证 _cleanups 数组不为空（说明已注册监听器）
            expect(router["_cleanups"].length).toBeGreaterThan(0);
        });

        it("测试 3: attach() 应设置 context provider", async () => {
            // Mock attachContextProvider 方法：验证构造 attach 链是否调用
            // （挂接发生在 routes.load() 之后，需在构造前打桩）
            const { AutoSparkRouter } = await import("@/router");
            let attachContextCalled = false;
            const original = (AutoSparkRouter.prototype as any).attachContextProvider;
            (AutoSparkRouter.prototype as any).attachContextProvider = function () {
                attachContextCalled = true;
                return original?.apply(this, arguments);
            };
            try {
                router = await createRouter(host, { routes });
                await new Promise((resolve) => setTimeout(resolve, 80));
                expect(attachContextCalled).toBe(true);
            } finally {
                (AutoSparkRouter.prototype as any).attachContextProvider = original;
            }
        });

        it("测试 4: 重复调用 attach() 应抛出错误", async () => {
            router = await createRouter(host, { routes });
            // attached 置位前重复调用不会命中防重（attached 仍为 false），需等链完成
            await new Promise((resolve) => setTimeout(resolve, 80));

            expect(() => router.attach()).toThrow("Already attached to a host element");
        });

        it("测试 5: 构造函数使用无效 host 应抛出错误", async () => {
            const invalidHost = null as unknown as HTMLElement;

            expect(() => new AutoSparkRouter(invalidHost, { routes: [] })).toThrow();
        });
    });

    describe("任务 3: detach() 方法和路由方法状态检查", () => {
        it("测试 1: detach() 调用后 attached 应为 false", async () => {
            router = await createRouter(host, { routes });
            // 等待 attach 链完成（attached 在 routes.load() 之后置位）
            await new Promise((resolve) => setTimeout(resolve, 80));

            expect(router.attached).toBe(true);

            router.detach();

            expect(router.attached).toBe(false);
        });

        it("测试 2: detach() 应清理 history 监听器", async () => {
            router = await createRouter(host, { routes });
            // 等待 attach 链完成（history.listen 在 routes.load() 之后注册）
            await new Promise((resolve) => setTimeout(resolve, 80));

            expect(router["_cleanups"].length).toBeGreaterThan(0);

            router.detach();

            expect(router["_cleanups"].length).toBe(0);
        });

        it("测试 3: detach() 应移除 context provider", async () => {
            router = await createRouter(host, { routes });
            await new Promise((resolve) => setTimeout(resolve, 80));

            // Mock removeContextProvider 方法来验证调用
            let removeContextCalled = false;
            const originalRemoveContext = router.removeContextProvider.bind(router);
            router.removeContextProvider = () => {
                removeContextCalled = true;
                originalRemoveContext();
            };

            router.detach();

            expect(removeContextCalled).toBe(true);
        });

        it("测试 4: detach() 应清理 host 上的 router 引用", async () => {
            router = await createRouter(host, { routes });
            await new Promise((resolve) => setTimeout(resolve, 80));

            expect((host as any).router).toBe(router);

            router.detach();

            expect((host as any).router).toBeUndefined();
            expect(host.hasAttribute("data-autospark-router")).toBe(false);
        });

        it("测试 5: detach() 后调用 push 应抛出错误", async () => {
            router = await createRouter(host, { routes });
            router.detach();

            expect(() => router.push("/user")).toThrow("[AutoSparkRouter] Cannot navigate: router is not attached");
        });

        it("测试 6: detach() 后调用 replace 应抛出错误", async () => {
            router = await createRouter(host, { routes });
            router.detach();

            expect(() => router.replace("/user")).toThrow("[AutoSparkRouter] Cannot navigate: router is not attached");
        });

        it("测试 7: detach() 后调用 back 应抛出错误", async () => {
            router = await createRouter(host, { routes });
            router.detach();

            expect(() => router.back()).toThrow("[AutoSparkRouter] Cannot navigate: router is not attached");
        });

        it("测试 8: detach() 后调用 forward 应抛出错误", async () => {
            router = await createRouter(host, { routes });
            router.detach();

            expect(() => router.forward()).toThrow("[AutoSparkRouter] Cannot navigate: router is not attached");
        });

        it("测试 9: detach() 后调用 go 应抛出错误", async () => {
            router = await createRouter(host, { routes });
            router.detach();

            expect(() => router.go(1)).toThrow("[AutoSparkRouter] Cannot navigate: router is not attached");
        });

        it("测试 10: detach() 后再 attach 应该正常工作", async () => {
            router = await createRouter(host, { routes });
            // 等待 attach 链完成（attached 在 routes.load() 之后置位，detach 依赖它）
            await new Promise((resolve) => setTimeout(resolve, 80));

            expect(router.attached).toBe(true);

            // detach
            router.detach();
            expect(router.attached).toBe(false);

            // 第二次 attach（重新使用同一个 host）——attached 异步置位
            router.attach();
            expect(router.host).toBe(host);

            // 等待 attach 链完成（后续 afterEach 的 detach 依赖 attached 状态）
            await new Promise((resolve) => setTimeout(resolve, 80));
            expect(router.attached).toBe(true);
        });
    });
});
