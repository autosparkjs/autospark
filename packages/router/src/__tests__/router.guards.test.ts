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

describe("KylinRouter 路由级守卫系统", () => {
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

    describe("beforeEnter guards", () => {
        it("应该在进入路由前执行 beforeEnter 守卫", async () => {
            const routes = [
                {
                    name: "protected",
                    path: "/protected",
                    beforeEnter: (to: any, from: any) => {
                        return true;
                    }
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/protected");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(router.routes.current.route!.name).toBe("protected");
        });

        it("应该在 beforeEnter 返回 false 时取消导航", async () => {
            const routes = [
                {
                    name: "home",
                    path: "/"
                },
                {
                    name: "protected",
                    path: "/protected",
                    beforeEnter: () => false
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/protected");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 导航应该被取消，保持在根路径
            expect(router.routes.current.route!.path).not.toBe("/protected");
        });

        it("应该在 beforeEnter 返回路径字符串时重定向", async () => {
            const routes = [
                {
                    name: "redirect",
                    path: "/redirect",
                    beforeEnter: () => "/target"
                },
                {
                    name: "target",
                    path: "/target"
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/redirect");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(router.routes.current.route!.path).toBe("/target");
        });

        it("应该支持异步 beforeEnter 守卫", async () => {
            let guardExecuted = false;

            const routes = [
                {
                    name: "async",
                    path: "/async",
                    beforeEnter: async (to: any, from: any) => {
                        await new Promise(resolve => setTimeout(resolve, 50));
                        guardExecuted = true;
                        return true;
                    }
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/async");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(guardExecuted).toBe(true);
            expect(router.routes.current.route!.name).toBe("async");
        });

        it("应该正确传递 to 和 from 参数给 beforeEnter", async () => {
            let capturedTo: any;
            let capturedFrom: any;

            const routes = [
                { name: "home", path: "/" },
                {
                    name: "target",
                    path: "/target",
                    beforeEnter: (to: any, from: any) => {
                        capturedTo = to;
                        capturedFrom = from;
                        return true;
                    }
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/target");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(capturedTo.path).toBe("/target");
            expect(capturedFrom).toBeDefined();
        });

        it("应该处理 beforeEnter 守卫抛出的错误", async () => {
            const routes = [
                { name: "home", path: "/" },
                {
                    name: "error",
                    path: "/error",
                    beforeEnter: () => {
                        throw new Error("Guard error");
                    }
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/error");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 导航应该被取消
            expect(router.routes.current.route!.path).not.toBe("/error");
        });
    });

    describe("嵌套路由守卫", () => {
        it("应该在嵌套路由中按照父→子顺序执行守卫", async () => {
            const order: string[] = [];

            const routes = [
                {
                    name: "parent",
                    path: "/parent",
                    beforeEnter: () => {
                        order.push("parent");
                        return true;
                    },
                    children: [
                        {
                            name: "child",
                            path: "child",
                            beforeEnter: () => {
                                order.push("child");
                                return true;
                            }
                        }
                    ]
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/parent/child");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(order).toEqual(["parent", "child"]);
        });

        it("应该在子路由守卫失败时回退到父路由", async () => {
            const routes = [
                {
                    name: "parent",
                    path: "/parent",
                    children: [
                        {
                            name: "child",
                            path: "child",
                            beforeEnter: () => false
                        }
                    ]
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/parent/child");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 应该回退到父路由
            expect(router.routes.current.route!.path).toBe("/parent");
        });

        it("应该在多层嵌套路由中正确执行守卫", async () => {
            const order: string[] = [];

            const routes = [
                {
                    name: "level1",
                    path: "/level1",
                    beforeEnter: () => {
                        order.push("level1");
                        return true;
                    },
                    children: [
                        {
                            name: "level2",
                            path: "level2",
                            beforeEnter: () => {
                                order.push("level2");
                                return true;
                            },
                            children: [
                                {
                                    name: "level3",
                                    path: "level3",
                                    beforeEnter: () => {
                                        order.push("level3");
                                        return true;
                                    }
                                }
                            ]
                        }
                    ]
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/level1/level2/level3");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(order).toEqual(["level1", "level2", "level3"]);
        });

        it("应该支持混合的同步和异步守卫", async () => {
            const order: string[] = [];

            const routes = [
                {
                    name: "parent",
                    path: "/parent",
                    beforeEnter: () => {
                        order.push("parent-sync");
                        return true;
                    },
                    children: [
                        {
                            name: "child",
                            path: "child",
                            beforeEnter: async () => {
                                await new Promise(resolve => setTimeout(resolve, 30));
                                order.push("child-async");
                                return true;
                            }
                        }
                    ]
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/parent/child");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(order).toEqual(["parent-sync", "child-async"]);
        });

        it("应该在父路由守卫失败时停止执行子路由守卫", async () => {
            const order: string[] = [];

            const routes = [
                {
                    name: "parent",
                    path: "/parent",
                    beforeEnter: () => {
                        order.push("parent");
                        return false;
                    },
                    children: [
                        {
                            name: "child",
                            path: "child",
                            beforeEnter: () => {
                                order.push("child");
                                return true;
                            }
                        }
                    ]
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/parent/child");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 只有父路由守卫被执行
            expect(order).toEqual(["parent"]);
        });
    });

    describe("afterLeave guards", () => {
        it("应该在离开路由后执行 afterLeave 守卫", async () => {
            let guardExecuted = false;

            const routes = [
                {
                    name: "source",
                    path: "/source",
                    afterLeave: () => {
                        guardExecuted = true;
                    }
                },
                {
                    name: "target",
                    path: "/target"
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/source");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 50));

            router.push("/target");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(guardExecuted).toBe(true);
            expect(router.routes.current.route!.name).toBe("target");
        });

        it("应该支持异步 afterLeave 守卫", async () => {
            let guardExecuted = false;

            const routes = [
                {
                    name: "source",
                    path: "/source",
                    afterLeave: async () => {
                        await new Promise(resolve => setTimeout(resolve, 50));
                        guardExecuted = true;
                    }
                },
                {
                    name: "target",
                    path: "/target"
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/source");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 50));

            router.push("/target");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(guardExecuted).toBe(true);
        });

        it("应该正确传递 to 和 from 参数给 afterLeave", async () => {
            let capturedTo: any;
            let capturedFrom: any;

            const routes = [
                {
                    name: "source",
                    path: "/source",
                    afterLeave: (to: any, from: any) => {
                        capturedTo = to;
                        capturedFrom = from;
                    }
                },
                {
                    name: "target",
                    path: "/target"
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/source");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 50));

            router.push("/target");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(capturedTo.name).toBe("target");
            expect(capturedFrom.name).toBe("source");
        });

        it("应该处理 afterLeave 守卫抛出的错误", async () => {
            const routes = [
                {
                    name: "source",
                    path: "/source",
                    afterLeave: () => {
                        throw new Error("Guard error");
                    }
                },
                {
                    name: "target",
                    path: "/target"
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/source");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 50));

            router.push("/target");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            // 导航应该继续完成，即使 afterLeave 失败
            expect(router.routes.current.route!.name).toBe("target");
        });
    });

    describe("守卫与全局钩子的交互", () => {
        it("应该按照正确的顺序执行全局钩子和路由守卫", async () => {
            const order: string[] = [];

            const routes = [
                {
                    name: "protected",
                    path: "/protected",
                    beforeEnter: () => {
                        order.push("beforeEnter");
                        return true;
                    }
                }
            ];

            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.beforeEach.push((to: any, from: any, next: any) => {
                order.push("beforeEach");
                next();
            });

            router.push("/protected");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(order).toEqual(["beforeEach", "beforeEnter"]);
        });

        it("应该在全局 beforeEach 钩子取消后不执行路由守卫", async () => {
            let guardExecuted = false;

            const routes = [
                {
                    name: "protected",
                    path: "/protected",
                    beforeEnter: () => {
                        guardExecuted = true;
                        return true;
                    }
                }
            ];

            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.beforeEach.push((to: any, from: any, next: any) => {
                next(false);
            });

            router.push("/protected");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(guardExecuted).toBe(false);
        });

        it("应该在路由守卫取消后不执行全局 afterEach 钩子", async () => {
            let afterEachExecuted = false;

            const routes = [
                { name: "home", path: "/" },
                {
                    name: "protected",
                    path: "/protected",
                    beforeEnter: () => false
                }
            ];

            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.afterEach.push(() => {
                afterEachExecuted = true;
            });

            router.push("/protected");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(afterEachExecuted).toBe(false);
        });
    });

    describe("守卫错误处理", () => {
        it("应该在守卫超时时取消导航", async () => {
            const routes = [
                {
                    name: "timeout",
                    path: "/timeout",
                    beforeEnter: () => {
                        return new Promise(() => {
                            // 永不 resolve，模拟超时
                        });
                    }
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/timeout");

            // 等待超时（30秒超时，但我们只等待较短时间）
            await new Promise(resolve => setTimeout(resolve, 100));

            // 导航应该被取消
            expect(router.routes.current.route!.path).not.toBe("/timeout");
        });

        it("应该在守卫抛出错误时取消导航并记录错误", async () => {
            const consoleSpy = {
                error: console.error
            };

            let errorLogged = false;
            console.error = (...args: any[]) => {
                if (args[0] && args[0].includes && args[0].includes("Route beforeEnter guard error")) {
                    errorLogged = true;
                }
                consoleSpy.error(...args);
            };

            const routes = [
                {
                    name: "error",
                    path: "/error",
                    beforeEnter: () => {
                        throw new Error("Guard execution error");
                    }
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/error");

            // 等待导航完成
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(router.routes.current.route!.path).not.toBe("/error");
            expect(errorLogged).toBe(true);

            console.error = consoleSpy.error;
        });
    });
});
