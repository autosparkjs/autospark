import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { KylinRouter } from "@/router";

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
    return new KylinRouter(host, options);
}

describe("KylinRouter attach/detach 功能", () => {
    let host: HTMLElement;
    let router: KylinRouter;

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
                notFound: { name: "404", path: "*" },
            });

            // 验证 options 属性存在且包含完整配置
            expect(router.options).toBeDefined();
            expect(router.options.routes).toEqual(routes);
            expect(router.options.mode).toBe("history");
            expect(router.options.notFound).toEqual({ name: "404", path: "*" });
        });

        it("测试 2: 新创建的实例 attached 应为 false", async () => {
            // 创建一个未 attached 的 router 实例
            router = await createRouter(host, { routes });

            // 这会在重构前失败（因为当前实现会自动 attach）
            // 在重构后，我们应该能创建未 attached 的实例
            expect(router.attached).toBe(false);
        });

        it("测试 3: 构造函数不应操作 DOM（不设置 host 属性、不调用 attach）", async () => {
            const hostElement = document.createElement("div");
            // @ts-ignore
            document.body.appendChild(hostElement);

            // 创建 router 但不期望它操作 DOM
            router = await createRouter(host, { routes });

            // 检查 host 元素是否未被修改
            expect(hostElement.hasAttribute("data-kylin-router")).toBe(false);
            expect((hostElement as any).router).toBeUndefined();

            // 清理
            // @ts-ignore
            document.body.removeChild(hostElement);
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
            expect(router3.options.routes.length).toBe(1);
        });
    });

    describe("任务 2: attach() 方法完整绑定逻辑", () => {
        it("测试 1: attach() 调用后 attached 应为 true", async () => {
            router = await createRouter(host, { routes });
            expect(router.attached).toBe(false);

            router.attach();
            expect(router.attached).toBe(true);
        });

        it("测试 2: attach() 应设置 host 属性并标记 data-kylin-router", async () => {
            router = await createRouter(host, { routes });

            router.attach();

            expect(router.host).toBe(host);
            expect(host.hasAttribute("data-kylin-router")).toBe(true);
        });

        it("测试 3: attach() 应在 host.router 上存储 router 实例", async () => {
            router = await createRouter(host, { routes });

            router.attach();

            expect((host as any).router).toBe(router);
        });

        it("测试 4: attach() 应开始监听 history 变化", async () => {
            router = await createRouter(host, { routes });

            router.attach();

            // 验证 _cleanups 数组不为空（说明已注册监听器）
            expect(router["_cleanups"].length).toBeGreaterThan(0);
        });

        it("测试 5: attach() 应设置 context provider", async () => {
            router = await createRouter(host, { routes });

            // Mock attachContextProvider 方法来验证调用
            let attachContextCalled = false;
            const originalAttachContext = router.attachContextProvider.bind(router);
            router.attachContextProvider = () => {
                attachContextCalled = true;
                originalAttachContext();
            };

            router.attach();

            expect(attachContextCalled).toBe(true);
        });

        it("测试 6: 重复调用 attach() 应抛出错误", async () => {
            router = await createRouter(host, { routes });

            router.attach();

            expect(() => router.attach()).toThrow("[KylinRouter] Already attached to a host element");
        });

        it("测试 7: 构造函数使用无效 host 应抛出错误", async () => {
            const invalidHost = null as unknown as HTMLElement;

            expect(() => new KylinRouter(invalidHost, { routes: [] })).toThrow();
        });
    });

    describe("任务 3: detach() 方法和路由方法状态检查", () => {
        it("测试 1: detach() 调用后 attached 应为 false", async () => {
            router = await createRouter(host, { routes });
            router.attach();

            expect(router.attached).toBe(true);

            router.detach();

            expect(router.attached).toBe(false);
        });

        it("测试 2: detach() 应清理 history 监听器", async () => {
            router = await createRouter(host, { routes });
            router.attach();

            expect(router["_cleanups"].length).toBeGreaterThan(0);

            router.detach();

            expect(router["_cleanups"].length).toBe(0);
        });

        it("测试 3: detach() 应移除 context provider", async () => {
            router = await createRouter(host, { routes });
            router.attach();

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
            router.attach();

            expect((host as any).router).toBe(router);

            router.detach();

            expect((host as any).router).toBeUndefined();
            expect(host.hasAttribute("data-kylin-router")).toBe(false);
        });

        it("测试 5: 未 attached 时调用 push 应抛出错误", async () => {
            router = await createRouter(host, { routes });

            expect(() => router.push("/user")).toThrow("[KylinRouter] Cannot navigate: router is not attached");
        });

        it("测试 6: 未 attached 时调用 replace 应抛出错误", async () => {
            router = await createRouter(host, { routes });

            expect(() => router.replace("/user")).toThrow("[KylinRouter] Cannot navigate: router is not attached");
        });

        it("测试 7: 未 attached 时调用 back 应抛出错误", async () => {
            router = await createRouter(host, { routes });

            expect(() => router.back()).toThrow("[KylinRouter] Cannot navigate: router is not attached");
        });

        it("测试 8: 未 attached 时调用 forward 应抛出错误", async () => {
            router = await createRouter(host, { routes });

            expect(() => router.forward()).toThrow("[KylinRouter] Cannot navigate: router is not attached");
        });

        it("测试 9: 未 attached 时调用 go 应抛出错误", async () => {
            router = await createRouter(host, { routes });

            expect(() => router.go(1)).toThrow("[KylinRouter] Cannot navigate: router is not attached");
        });

        it("测试 10: detach() 后再 attach 应该正常工作", async () => {
            router = await createRouter(host, { routes });

            // 第一次 attach
            router.attach();
            expect(router.attached).toBe(true);

            // detach
            router.detach();
            expect(router.attached).toBe(false);

            // 第二次 attach（重新使用同一个 host）
            router.attach();
            expect(router.attached).toBe(true);
            expect(router.host).toBe(host);
        });
    });
});
