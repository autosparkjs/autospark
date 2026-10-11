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

describe("KylinRouter 钩子系统完整集成测试", () => {
    let host: HTMLElement;
    let router: KylinRouter;

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

    describe("完整的导航流程与钩子执行顺序", () => {
        it("应该按照正确的顺序执行所有钩子类型和路由守卫", async () => {
            const order: string[] = [];

            const routes = [
                {
                    name: "target",
                    path: "/target",
                    beforeEnter: () => {
                        order.push("beforeEnter");
                        return true;
                    }
                }
            ];

            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("beforeEach", (to: any, from: any, next: any) => {
                order.push("beforeEach");
                next();
            });

            // @ts-ignore
            router.hooks.add("renderEach", (to: any, from: any, next: any) => {
                order.push("renderEach");
                next();
            });

            // @ts-ignore
            router.hooks.add("afterEach", (to: any, from: any) => {
                order.push("afterEach");
            });

            router.push("/target");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(order).toEqual([
                "beforeEach",
                "beforeEnter",
                "renderEach",
                "afterEach"
            ]);
        });

        it("应该在嵌套路由中正确执行所有钩子", async () => {
            const order: string[] = [];

            const routes = [
                {
                    name: "parent",
                    path: "/parent",
                    beforeEnter: () => {
                        order.push("parent-beforeEnter");
                        return true;
                    },
                    children: [
                        {
                            name: "child",
                            path: "child",
                            beforeEnter: () => {
                                order.push("child-beforeEnter");
                                return true;
                            }
                        }
                    ]
                }
            ];

            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("beforeEach", (to: any, from: any, next: any) => {
                order.push("beforeEach");
                next();
            });

            // @ts-ignore
            router.hooks.add("renderEach", (to: any, from: any, next: any) => {
                order.push("renderEach");
                next();
            });

            router.push("/parent/child");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(order).toEqual([
                "beforeEach",
                "parent-beforeEnter",
                "child-beforeEnter",
                "renderEach"
            ]);
        });

        it("应该在导航取消时停止执行后续钩子", async () => {
            const order: string[] = [];

            const routes = [
                {
                    name: "target",
                    path: "/target",
                    beforeEnter: () => {
                        order.push("beforeEnter");
                        return false;
                    }
                }
            ];

            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("beforeEach", (to: any, from: any, next: any) => {
                order.push("beforeEach");
                next();
            });

            // @ts-ignore
            router.hooks.add("renderEach", (to: any, from: any, next: any) => {
                order.push("renderEach");
                next();
            });

            // @ts-ignore
            router.hooks.add("afterEach", (to: any, from: any) => {
                order.push("afterEach");
            });

            router.push("/target");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(order).toEqual([
                "beforeEach",
                "beforeEnter"
            ]);
        });
    });

    describe("钩子与路由状态的交互", () => {
        it("应该正确传递 to 和 from 参数给所有钩子", async () => {
            const routes = [
                { name: "a", path: "/a" },
                { name: "b", path: "/b" }
            ];

            router = await createRouter(host, { routes });

            let capturedTo: any;
            let capturedFrom: any;

            // @ts-ignore
            router.hooks.add("beforeEach", (to: any, from: any, next: any) => {
                capturedTo = to;
                capturedFrom = from;
                next();
            });

            // 先导航到 /a
            router.push("/a");
            await new Promise(resolve => setTimeout(resolve, 50));

            // 再导航到 /b
            router.push("/b");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(capturedTo.name).toBe("b");
            expect(capturedFrom.name).toBe("a");
        });

        it("应该正确传递路由参数给钩子", async () => {
            const routes = [
                { name: "user", path: "/user/:id" }
            ];

            router = await createRouter(host, { routes });

            let capturedParams: any;

            // @ts-ignore
            router.hooks.add("beforeEach", (to: any, from: any, next: any) => {
                capturedParams = to.params;
                next();
            });

            router.push("/user/123");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(capturedParams).toEqual({ id: "123" });
        });

        it("应该正确传递查询参数给钩子", async () => {
            const routes = [
                { name: "search", path: "/search" }
            ];

            router = await createRouter(host, { routes });

            let capturedQuery: any;

            // @ts-ignore
            router.hooks.add("beforeEach", (to: any, from: any, next: any) => {
                capturedQuery = to.query;
                next();
            });

            router.push("/search?q=test&page=1");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(capturedQuery).toEqual({ q: "test", page: "1" });
        });
    });

    describe("错误处理和恢复", () => {
        it("应该处理钩子执行中的错误并继续导航", async () => {
            const routes = [
                { name: "target", path: "/target" }
            ];

            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("beforeEach", (to: any, from: any, next: any) => {
                throw new Error("Hook error");
            });

            // @ts-ignore
            router.hooks.add("beforeEach", (to: any, from: any, next: any) => {
                next();
            });

            router.push("/target");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 导航应该继续
            expect(router.routes.current.route!.name).toBe("target");
        });

        it("应该在 beforeEach 错误时取消导航", async () => {
            const routes = [
                { name: "home", path: "/" },
                { name: "target", path: "/target" }
            ];

            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("beforeEach", (to: any, from: any, next: any) => {
                if (to.path === "/target") {
                    next(false);
                } else {
                    next();
                }
            });

            router.push("/target");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 导航应该被取消
            expect(router.routes.current.route!.path).not.toBe("/target");
        });

        it("应该在路由守卫错误时取消导航", async () => {
            const routes = [
                { name: "home", path: "/" },
                {
                    name: "target",
                    path: "/target",
                    beforeEnter: () => {
                        throw new Error("Guard error");
                    }
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/target");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 导航应该被取消
            expect(router.routes.current.route!.path).not.toBe("/target");
        });

        it("应该在 renderEach 错误时继续渲染", async () => {
            const routes = [
                { name: "target", path: "/target" }
            ];

            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("renderEach", () => {
                throw new Error("RenderEach error");
            });

            // @ts-ignore
            router.hooks.add("renderEach", (to: any, from: any, next: any) => {
                next({ key: "value" });
            });

            router.push("/target");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 导航应该继续，并且包含第二个钩子的数据
            expect(router.routes.current.route!.name).toBe("target");
            expect(router.routes.current.route!.data).toEqual({ key: "value" });
        });

        it("应该在 afterEach 错误时不影响导航完成", async () => {
            const routes = [
                { name: "target", path: "/target" }
            ];

            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("afterEach", () => {
                throw new Error("AfterEach error");
            });

            router.push("/target");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 导航应该完成
            expect(router.routes.current.route!.name).toBe("target");
        });
    });

    describe("重定向功能集成", () => {
        it("应该在 beforeEach 重定向时正确处理", async () => {
            const routes = [
                { name: "redirect", path: "/redirect" },
                { name: "target", path: "/target" }
            ];

            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("beforeEach", (to: any, from: any, next: any) => {
                if (to.path === "/redirect") {
                    next("/target");
                } else {
                    next();
                }
            });

            router.push("/redirect");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 应该重定向到 /target
            expect(router.routes.current.route!.path).toBe("/target");
        });

        it("应该在 beforeEnter 重定向时正确处理", async () => {
            const routes = [
                {
                    name: "redirect",
                    path: "/redirect",
                    beforeEnter: () => "/target"
                },
                { name: "target", path: "/target" }
            ];

            router = await createRouter(host, { routes });
            router.push("/redirect");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 应该重定向到 /target
            expect(router.routes.current.route!.path).toBe("/target");
        });

        it("应该在重定向时执行目标路由的守卫", async () => {
            let guardExecuted = false;

            const routes = [
                {
                    name: "redirect",
                    path: "/redirect",
                    beforeEnter: () => "/target"
                },
                {
                    name: "target",
                    path: "/target",
                    beforeEnter: () => {
                        guardExecuted = true;
                        return true;
                    }
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/redirect");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 应该执行目标路由的守卫
            expect(guardExecuted).toBe(true);
            expect(router.routes.current.route!.path).toBe("/target");
        });
    });

    describe("数据预加载集成", () => {
        it("应该正确传递预加载数据给组件", async () => {
            const routes = [
                { name: "user", path: "/user/:id" }
            ];

            router = await createRouter(host, { routes });

            const preloadData = { userId: "123", userName: "Test User" };

            // @ts-ignore
            router.hooks.add("renderEach", (to: any, from: any, next: any) => {
                next(preloadData);
            });

            router.push("/user/123");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 数据应该被传递到路由
            expect(router.routes.current.route!.data).toEqual(preloadData);
        });

        it("应该合并来自多个钩子的预加载数据", async () => {
            const routes = [
                { name: "target", path: "/target" }
            ];

            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("renderEach", (to: any, from: any, next: any) => {
                next({ key1: "value1" });
            });

            // @ts-ignore
            router.hooks.add("renderEach", (to: any, from: any, next: any) => {
                next({ key2: "value2" });
            });

            router.push("/target");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 数据应该被合并
            expect(router.routes.current.route!.data).toEqual({
                key1: "value1",
                key2: "value2"
            });
        });

        it("应该支持异步数据预加载", async () => {
            const routes = [
                { name: "user", path: "/user" }
            ];

            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("renderEach", async (to: any, from: any, next: any) => {
                await new Promise(resolve => setTimeout(resolve, 50));
                next({ asyncData: "loaded" });
            });

            router.push("/user");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 异步数据应该被正确加载
            expect(router.routes.current.route!.data).toEqual({ asyncData: "loaded" });
        });
    });

    describe("复杂场景集成", () => {
        it("应该正确处理认证和权限检查", async () => {
            const isAuthenticated = () => false;
            const hasPermission = () => false;

            const routes = [
                { name: "home", path: "/" },
                {
                    name: "login",
                    path: "/login"
                },
                {
                    name: "profile",
                    path: "/profile",
                    beforeEnter: () => {
                        if (!isAuthenticated()) {
                            return "/login";
                        }
                        return true;
                    }
                },
                {
                    name: "admin",
                    path: "/admin",
                    beforeEnter: () => {
                        if (!hasPermission()) {
                            return "/login";
                        }
                        return true;
                    }
                }
            ];

            router = await createRouter(host, { routes });

            // 尝试访问受保护的路由
            router.push("/profile");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 应该重定向到登录页面
            expect(router.routes.current.route!.path).toBe("/login");
        });

        it("应该正确处理页面离开时的清理工作", async () => {
            let cleanupExecuted = false;

            const routes = [
                {
                    name: "source",
                    path: "/source",
                    afterLeave: () => {
                        cleanupExecuted = true;
                    }
                },
                { name: "target", path: "/target" }
            ];

            router = await createRouter(host, { routes });

            router.push("/source");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 50));

            router.push("/target");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // afterLeave 应该被调用
            expect(cleanupExecuted).toBe(true);
            expect(router.routes.current.route!.path).toBe("/target");
        });

        it("应该正确处理滚动到顶部等导航后操作", async () => {
            let scrollExecuted = false;

            const routes = [
                { name: "home", path: "/" },
                { name: "target", path: "/target" }
            ];

            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("afterEach", () => {
                scrollExecuted = true;
            });

            router.push("/target");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // afterEach 应该被调用
            expect(scrollExecuted).toBe(true);
        });
    });
});
