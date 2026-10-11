import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { KylinRouter } from "@/router";

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
 * 动态导入 KylinRouter
 */
async function createRouter(host: HTMLElement, options: any) {
    const { KylinRouter } = await import("@/router");
    const router = new KylinRouter(host, options);
    router.attach();
    return router;
}

describe("KylinRouter 全局钩子系统", () => {
    let host: HTMLElement;
    let router: KylinRouter;

    const routes = [
        { name: "home", path: "/" },
        { name: "user", path: "/user" },
        { name: "profile", path: "/profile" },
        { name: "admin", path: "/admin" },
        { name: "redirect-target", path: "/redirect-target" },
        { name: "async", path: "/async" },
        { name: "protected", path: "/protected" },
        { name: "merge", path: "/merge" },
        { name: "user-detail", path: "/user/:id" },
        { name: "not-found", path: "*" }
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

    describe("beforeEach hooks", () => {
        it("应该按照注册顺序执行 beforeEach 钩子", async () => {
            router = await createRouter(host, { routes });
            const order: number[] = [];

            // @ts-ignore - 测试内部 hooks 属性
            router.hooks.add("beforeEach", (to, from, next) => {
                order.push(1);
                next();
            });
            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => {
                order.push(2);
                next();
            });
            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => {
                order.push(3);
                next();
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(order).toEqual([1, 2, 3]);
        });

        it("应该在调用 next(false) 时取消导航", async () => {
            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => {
                if (to.path === "/protected") {
                    next(false);
                } else {
                    next();
                }
            });

            router.push("/protected");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 导航应该被取消，保持在当前路径
            expect(router.routes.current.route!.path).not.toBe("/protected");
        });

        it("应该在调用 next('/path') 时重定向", async () => {
            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => {
                if (to.path === "/user") {
                    next("/profile");
                } else {
                    next();
                }
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 应该重定向到 /profile
            expect(router.routes.current.route!.path).toBe("/profile");
        });

        it("应该支持异步 beforeEach 钩子", async () => {
            router = await createRouter(host, { routes });
            let executed = false;

            // @ts-ignore
            router.hooks.add("beforeEach", async (to, from, next) => {
                await new Promise(resolve => setTimeout(resolve, 50));
                executed = true;
                next();
            });

            router.push("/async");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(executed).toBe(true);
            expect(router.routes.current.route!.path).toBe("/async");
        });

        it("应该在第一个钩子取消导航后停止执行后续钩子", async () => {
            router = await createRouter(host, { routes });
            const order: number[] = [];

            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => {
                order.push(1);
                next(false);
            });

            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => {
                order.push(2);
                next();
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(order).toEqual([1]);
        });

        it("应该在重定向后停止执行后续钩子", async () => {
            router = await createRouter(host, { routes });
            const order: number[] = [];

            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => {
                order.push(1);
                next("/redirect-target");
            });

            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => {
                order.push(2);
                next();
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(order).toEqual([1]);
            expect(router.routes.current.route!.path).toBe("/redirect-target");
        });

        it("应该正确传递 to 和 from 参数", async () => {
            router = await createRouter(host, { routes });

            let capturedTo: any;
            let capturedFrom: any;

            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => {
                capturedTo = to;
                capturedFrom = from;
                next();
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(capturedTo.path).toBe("/user");
            expect(capturedFrom).toBeDefined();
        });

        it("应该支持同步和异步钩子混合使用", async () => {
            router = await createRouter(host, { routes });
            const order: number[] = [];

            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => {
                order.push(1);
                next();
            });

            // @ts-ignore
            router.hooks.add("beforeEach", async (to, from, next) => {
                await new Promise(resolve => setTimeout(resolve, 30));
                order.push(2);
                next();
            });

            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => {
                order.push(3);
                next();
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(order).toEqual([1, 2, 3]);
        });
    });

    describe("renderEach hooks", () => {
        it("应该执行 renderEach 钩子并传递数据给组件", async () => {
            router = await createRouter(host, { routes });

            const testData = { userId: "123", userName: "Test" };

            // @ts-ignore
            router.hooks.add("renderEach", (to, from, next) => {
                next(testData);
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 数据应该被传递到当前路由
            expect(router.routes.current.route!.data).toEqual(testData);
        });

        it("应该合并来自多个 renderEach 钩子的数据", async () => {
            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("renderEach", (to, from, next) => {
                next({ key1: "value1" });
            });
            // @ts-ignore
            router.hooks.add("renderEach", (to, from, next) => {
                next({ key2: "value2" });
            });
            // @ts-ignore
            router.hooks.add("renderEach", (to, from, next) => {
                next({ key3: "value3" });
            });

            router.push("/merge");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(router.routes.current.route!.data).toEqual({
                key1: "value1",
                key2: "value2",
                key3: "value3"
            });
        });

        it("应该支持异步 renderEach 钩子", async () => {
            router = await createRouter(host, { routes });
            let executed = false;

            // @ts-ignore
            router.hooks.add("renderEach", async (to, from, next) => {
                await new Promise(resolve => setTimeout(resolve, 50));
                executed = true;
                next({ asyncData: "loaded" });
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(executed).toBe(true);
            expect(router.routes.current.route!.data).toEqual({ asyncData: "loaded" });
        });

        it("应该在 renderEach 钩子失败时继续渲染", async () => {
            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("renderEach", () => {
                throw new Error("Hook error");
            });

            // @ts-ignore
            router.hooks.add("renderEach", (to, from, next) => {
                next({ key: "value" });
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 导航应该继续，后续钩子的数据应该被传递
            expect(router.routes.current.route!.data).toEqual({ key: "value" });
        });

        it("应该支持直接返回数据而不调用 next", async () => {
            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("renderEach", (to, from, next) => {
                return { directData: "value" };
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(router.routes.current.route!.data).toEqual({ directData: "value" });
        });

        it("应该支持异步直接返回数据", async () => {
            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("renderEach", async (to, from, next) => {
                await new Promise(resolve => setTimeout(resolve, 30));
                return { asyncDirectData: "value" };
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(router.routes.current.route!.data).toEqual({ asyncDirectData: "value" });
        });

        it("应该在 renderEach 钩子中提供正确的 to 和 from 参数", async () => {
            router = await createRouter(host, { routes });

            let capturedTo: any;
            let capturedFrom: any;

            // @ts-ignore
            router.hooks.add("renderEach", (to, from, next) => {
                capturedTo = to;
                capturedFrom = from;
                next();
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(capturedTo.path).toBe("/user");
            expect(capturedFrom).toBeDefined();
        });

        it("应该处理 renderEach 钩子返回 undefined 的情况", async () => {
            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("renderEach", (to, from, next) => {
                return undefined;
            });

            // @ts-ignore
            router.hooks.add("renderEach", (to, from, next) => {
                next({ key: "value" });
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 应该只包含第二个钩子的数据
            expect(router.routes.current.route!.data).toEqual({ key: "value" });
        });

        it("应该支持同时使用 next 和直接返回", async () => {
            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("renderEach", (to, from, next) => {
                next({ nextData: "value" });
            });

            // @ts-ignore
            router.hooks.add("renderEach", (to, from, next) => {
                return { returnData: "value" };
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // next 的调用应该优先
            expect(router.routes.current.route!.data).toEqual({
                nextData: "value",
                returnData: "value"
            });
        });
    });

    describe("afterEach hooks", () => {
        it("应该在成功导航后执行 afterEach 钩子", async () => {
            router = await createRouter(host, { routes });
            let executed = false;

            // @ts-ignore
            router.hooks.add("afterEach", (to, from) => {
                executed = true;
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(executed).toBe(true);
        });

        it("不应该在导航被取消时执行 afterEach 钩子", async () => {
            router = await createRouter(host, { routes });
            let executed = false;

            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => {
                if (to.path === "/protected") {
                    next(false);
                } else {
                    next();
                }
            });

            // @ts-ignore
            router.hooks.add("afterEach", (to, from) => {
                executed = true;
            });

            router.push("/protected");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(executed).toBe(false);
        });

        it("应该在重定向后执行 afterEach 钩子", async () => {
            router = await createRouter(host, { routes });
            let executed = false;

            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => {
                if (to.path === "/user") {
                    next("/profile");
                } else {
                    next();
                }
            });

            // @ts-ignore
            router.hooks.add("afterEach", (to, from) => {
                executed = true;
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // afterEach 应该在最终路由（/profile）上执行
            expect(executed).toBe(true);
            expect(router.routes.current.route!.path).toBe("/profile");
        });

        it("应该按照注册顺序执行多个 afterEach 钩子", async () => {
            router = await createRouter(host, { routes });
            const order: number[] = [];

            // @ts-ignore
            router.hooks.add("afterEach", (to, from) => { order.push(1); });
            // @ts-ignore
            router.hooks.add("afterEach", (to, from) => { order.push(2); });
            // @ts-ignore
            router.hooks.add("afterEach", (to, from) => { order.push(3); });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(order).toEqual([1, 2, 3]);
        });

        it("应该支持异步 afterEach 钩子", async () => {
            router = await createRouter(host, { routes });
            let executed = false;

            // @ts-ignore
            router.hooks.add("afterEach", async (to, from) => {
                await new Promise(resolve => setTimeout(resolve, 50));
                executed = true;
            });

            router.push("/async");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(executed).toBe(true);
        });

        it("应该在 afterEach 钩子中提供正确的 to 和 from 参数", async () => {
            router = await createRouter(host, { routes });

            let capturedTo: any;
            let capturedFrom: any;

            // @ts-ignore
            router.hooks.add("afterEach", (to, from) => {
                capturedTo = to;
                capturedFrom = from;
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(capturedTo.path).toBe("/user");
            expect(capturedFrom).toBeDefined();
        });

        it("应该处理 afterEach 钩子中的错误", async () => {
            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("afterEach", (to, from) => {
                throw new Error("Hook error");
            });

            // @ts-ignore
            router.hooks.add("afterEach", (to, from) => {
                // 这个钩子应该仍然执行
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 导航应该完成，即使有钩子失败
            expect(router.routes.current.route!.path).toBe("/user");
        });
    });

    describe("钩子系统综合测试", () => {
        it("应该按照正确的顺序执行所有钩子类型", async () => {
            router = await createRouter(host, { routes });
            const order: string[] = [];

            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => { order.push("beforeEach"); next(); });
            // @ts-ignore
            router.hooks.add("renderEach", (to, from, next) => { order.push("renderEach"); next(); });
            // @ts-ignore
            router.hooks.add("afterEach", (to, from) => { order.push("afterEach"); });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(order).toEqual([
                "beforeEach",
                "renderEach",
                "afterEach"
            ]);
        });

        it("应该在每个钩子类型中维护独立的执行顺序", async () => {
            router = await createRouter(host, { routes });
            const order: string[] = [];

            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => { order.push("beforeEach-1"); next(); });
            // @ts-ignore
            router.hooks.add("renderEach", (to, from, next) => { order.push("renderEach-1"); next(); });
            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => { order.push("beforeEach-2"); next(); });
            // @ts-ignore
            router.hooks.add("afterEach", (to, from) => { order.push("afterEach-1"); });
            // @ts-ignore
            router.hooks.add("renderEach", (to, from, next) => { order.push("renderEach-2"); next(); });
            // @ts-ignore
            router.hooks.add("afterEach", (to, from) => { order.push("afterEach-2"); });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(order).toEqual([
                "beforeEach-1",
                "beforeEach-2",
                "renderEach-1",
                "renderEach-2",
                "afterEach-1",
                "afterEach-2"
            ]);
        });

        it("应该在钩子执行失败后继续执行其他类型的钩子", async () => {
            router = await createRouter(host, { routes });
            const order: string[] = [];

            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => {
                order.push("beforeEach");
                next();
            });

            // @ts-ignore
            router.hooks.add("renderEach", () => {
                throw new Error("RenderEach error");
            });

            // @ts-ignore
            router.hooks.add("afterEach", (to, from) => {
                order.push("afterEach");
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(order).toEqual(["beforeEach", "afterEach"]);
        });
    });

    describe("重定向循环检测", () => {
        it("应该检测无限重定向循环", async () => {
            router = await createRouter(host, { routes });
            let count = 0;

            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => {
                if (count < 15) {
                    count++;
                    next("/loop");
                } else {
                    next();
                }
            });

            // 由于路由表没有 /loop，这会触发 404
            // 但我们可以验证重定向计数没有无限增长
            router.push("/start");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 验证超过10次后停止（实际实现中的 MAX_REDIRECTS = 10）
            expect(count).toBeLessThanOrEqual(10);
        });

        it("应该在检测到循环时停止导航", async () => {
            router = await createRouter(host, { routes });
            let redirectCount = 0;

            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => {
                if (to.path !== "/end") {
                    redirectCount++;
                    next("/user"); // 重定向到 /user
                } else {
                    next();
                }
            });

            // 这个测试验证重定向循环检测机制
            // 实际的循环检测在路由器核心中实现
            router.push("/start");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 重定向次数应该被限制
            expect(redirectCount).toBeLessThan(20);
        });
    });

    describe("钩子管理 API", () => {
        it("应该支持添加钩子", async () => {
            router = await createRouter(host, { routes });

            const hook = (to: any, from: any, next: any) => {};

            // @ts-ignore
            router.addHook("beforeEach", hook);

            // @ts-ignore
            expect(router.hooks.beforeEach).toContain(hook);
        });

        it("应该支持移除钩子", async () => {
            router = await createRouter(host, { routes });

            const hook = (to: any, from: any, next: any) => {};

            // @ts-ignore
            router.hooks.add("beforeEach", hook);
            // @ts-ignore
            router.hooks.remove("beforeEach", hook);

            // @ts-ignore
            expect(router.hooks.beforeEach).not.toContain(hook);
        });

        it("应该支持清空指定类型的钩子", async () => {
            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => {});
            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => {});

            // @ts-ignore
            router.hooks.clear("beforeEach");

            // @ts-ignore
            expect(router.hooks.beforeEach.length).toBe(0);
        });

        it("应该支持清空所有钩子", async () => {
            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => {});
            // @ts-ignore
            router.hooks.add("renderEach", (to, from, next) => {});
            // @ts-ignore
            router.hooks.add("afterEach", (to, from) => {});

            // @ts-ignore
            router.hooks.clear();

            // @ts-ignore
            expect(router.hooks.beforeEach.length).toBe(0);
            // @ts-ignore
            expect(router.hooks.renderEach.length).toBe(0);
            // @ts-ignore
            expect(router.hooks.afterEach.length).toBe(0);
        });

        it("应该支持清空多个钩子类型", async () => {
            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("beforeEach", (to, from, next) => {});
            // @ts-ignore
            router.hooks.add("renderEach", (to, from, next) => {});
            // @ts-ignore
            router.hooks.add("afterEach", (to, from) => {});

            // @ts-ignore
            router.hooks.clear("beforeEach");
            // @ts-ignore
            router.hooks.clear("afterEach");

            // @ts-ignore
            expect(router.hooks.beforeEach.length).toBe(0);
            // @ts-ignore
            expect(router.hooks.renderEach.length).toBe(1); // 没有清空
            // @ts-ignore
            expect(router.hooks.afterEach.length).toBe(0);
        });
    });
});
