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
 * 动态导入 AutoSparkRouter。
 * 构造函数自动 attach()，不得重复调用；attach 链异步完成，需等待。
 */
async function createRouter(host: HTMLElement, options: any) {
    const { AutoSparkRouter } = await import("@/router");
    if (!host.querySelector("[data-autospark-outlet]")) {
        const outlet = document.createElement("div");
        outlet.setAttribute("data-autospark-outlet", "");
        host.appendChild(outlet);
    }
    const router = new AutoSparkRouter(host, { engine: stubEngine(), ...options });
    await new Promise((resolve) => setTimeout(resolve, 80));
    return router;
}

/** 取 matched 数组末项 */
function lastMatched(router: AutoSparkRouter) {
    const current = router.routes.current ?? [];
    return current[current.length - 1];
}

/** 等待导航结束（cancel 与 end 都算一轮导航结束） */
function waitNav(ms = 120) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("AutoSparkRouter 路由级守卫系统", () => {
    let host: HTMLElement;
    let router: AutoSparkRouter;

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

    describe("路由级 beforeRoute 守卫（原 beforeEnter）", () => {
        it("应该在进入路由前执行路由级 beforeRoute 守卫", async () => {
            const routes = [
                {
                    name: "protected",
                    path: "protected",
                    beforeRoute: () => {
                        return true;
                    }
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/protected");

            await waitNav();

            expect(lastMatched(router)?.route?.name).toBe("protected");
        });

        it("应该在守卫返回 false 时拦截渲染", async () => {
            let rendered = false;
            let cancelled = false;
            const routes = [
                {
                    name: "home",
                    path: "/"
                },
                {
                    name: "protected",
                    path: "protected",
                    beforeRoute: () => false
                }
            ];

            router = await createRouter(host, { routes });
            router.hooks.add("beforeRender", () => { rendered = true; });
            router.on("navigation:cancel", () => { cancelled = true; });
            router.push("/protected");

            await waitNav();

            // 拦截语义：渲染被跳过、navigation:cancel 事件触发
            // （URL 与 routes.current 仍会更新——历史条目在守卫前已落）
            expect(rendered).toBe(false);
            expect(cancelled).toBe(true);
        });

        it("应该在守卫返回路径字符串时重定向", async () => {
            const routes = [
                {
                    name: "redirect",
                    path: "redirect",
                    beforeRoute: () => "/target"
                },
                {
                    name: "target",
                    path: "target"
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/redirect");

            // 等待导航完成（含改道引发的第二轮导航）
            await waitNav(200);

            expect(lastMatched(router)?.route?.name).toBe("target");
        });

        it("应该支持异步守卫", async () => {
            let guardExecuted = false;

            const routes = [
                {
                    name: "async",
                    path: "async",
                    beforeRoute: async () => {
                        await new Promise(resolve => setTimeout(resolve, 50));
                        guardExecuted = true;
                        return true;
                    }
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/async");

            await waitNav(200);

            expect(guardExecuted).toBe(true);
            expect(lastMatched(router)?.route?.name).toBe("async");
        });

        it("应该正确传递 to 和 from 参数给守卫", async () => {
            let capturedTo: any;
            let capturedFrom: any;

            const routes = [
                { name: "home", path: "/" },
                {
                    name: "target",
                    path: "target",
                    beforeRoute: (args: any) => {
                        capturedTo = args.to;
                        capturedFrom = args.from;
                        return true;
                    }
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/target");

            await waitNav();

            expect(capturedTo).toBeInstanceOf(Array);
            expect(capturedTo[capturedTo.length - 1].path).toBe("/target");
            expect(capturedFrom).toBeInstanceOf(Array);
        });

        it("守卫抛出错误时应跳过该守卫（不阻断导航）", async () => {
            const routes = [
                { name: "home", path: "/" },
                {
                    name: "error",
                    path: "error",
                    beforeRoute: () => {
                        throw new Error("Guard error");
                    }
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/error");

            await waitNav();

            // 守卫错误默认被忽略（ignoreErrors 缺省 true），导航继续完成
            expect(lastMatched(router)?.route?.name).toBe("error");
        });
    });

    describe("嵌套路由守卫", () => {
        it("应该在嵌套路由中按照父→子顺序执行守卫", async () => {
            const order: string[] = [];

            const routes = [
                {
                    name: "parent",
                    path: "parent",
                    beforeRoute: () => {
                        order.push("parent");
                        return true;
                    },
                    children: [
                        {
                            name: "child",
                            path: "child",
                            beforeRoute: () => {
                                order.push("child");
                                return true;
                            }
                        }
                    ]
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/parent/child");

            await waitNav();

            expect(order).toEqual(["parent", "child"]);
        });

        it("应该在多层嵌套路由中正确执行守卫", async () => {
            const order: string[] = [];

            const routes = [
                {
                    name: "level1",
                    path: "level1",
                    beforeRoute: () => {
                        order.push("level1");
                        return true;
                    },
                    children: [
                        {
                            name: "level2",
                            path: "level2",
                            beforeRoute: () => {
                                order.push("level2");
                                return true;
                            },
                            children: [
                                {
                                    name: "level3",
                                    path: "level3",
                                    beforeRoute: () => {
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

            await waitNav();

            expect(order).toEqual(["level1", "level2", "level3"]);
        });

        it("应该支持混合的同步和异步守卫", async () => {
            const order: string[] = [];

            const routes = [
                {
                    name: "parent",
                    path: "parent",
                    beforeRoute: () => {
                        order.push("parent-sync");
                        return true;
                    },
                    children: [
                        {
                            name: "child",
                            path: "child",
                            beforeRoute: async () => {
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

            await waitNav(200);

            expect(order).toEqual(["parent-sync", "child-async"]);
        });

        it("应该在父路由守卫失败时停止执行子路由守卫", async () => {
            const order: string[] = [];

            const routes = [
                {
                    name: "parent",
                    path: "parent",
                    beforeRoute: () => {
                        order.push("parent");
                        return false;
                    },
                    children: [
                        {
                            name: "child",
                            path: "child",
                            beforeRoute: () => {
                                order.push("child");
                                return true;
                            }
                        }
                    ]
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/parent/child");

            await waitNav();

            // 只有父路由守卫被执行（串行执行，false 即中断）
            expect(order).toEqual(["parent"]);
        });
    });

    describe("路由级 afterRoute 守卫（原 afterLeave 语义已并入 afterRoute）", () => {
        it("应该在导航完成后执行目标路由的 afterRoute 守卫", async () => {
            let guardExecuted = false;

            const routes = [
                {
                    name: "source",
                    path: "source",
                },
                {
                    name: "target",
                    path: "target",
                    afterRoute: () => {
                        guardExecuted = true;
                    }
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/source");

            await waitNav(120);

            router.push("/target");

            await waitNav();

            expect(guardExecuted).toBe(true);
            expect(lastMatched(router)?.route?.name).toBe("target");
        });

        it("应该支持异步 afterRoute 守卫", async () => {
            let guardExecuted = false;

            const routes = [
                { name: "source", path: "source" },
                {
                    name: "target",
                    path: "target",
                    afterRoute: async () => {
                        await new Promise(resolve => setTimeout(resolve, 50));
                        guardExecuted = true;
                    }
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/source");

            await waitNav(120);

            router.push("/target");

            await waitNav(200);

            expect(guardExecuted).toBe(true);
        });

        it("应该正确传递 to 参数给 afterRoute 守卫", async () => {
            let capturedTo: any;

            const routes = [
                { name: "source", path: "source" },
                {
                    name: "target",
                    path: "target",
                    afterRoute: (args: any) => {
                        capturedTo = args.to;
                    }
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/source");

            await waitNav(120);

            router.push("/target");

            await waitNav();

            expect(capturedTo).toBeInstanceOf(Array);
            expect(capturedTo[capturedTo.length - 1].route?.name).toBe("target");
        });

        it("afterRoute 守卫抛出错误时导航应继续完成", async () => {
            const routes = [
                { name: "source", path: "source" },
                {
                    name: "target",
                    path: "target",
                    afterRoute: () => {
                        throw new Error("Guard error");
                    }
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/source");

            await waitNav(120);

            router.push("/target");

            await waitNav();

            // 导航应该继续完成，即使 afterRoute 失败
            expect(lastMatched(router)?.route?.name).toBe("target");
        });
    });

    describe("守卫与全局钩子的交互", () => {
        it("应该按照正确的顺序执行全局钩子和路由守卫", async () => {
            const order: string[] = [];

            const routes = [
                {
                    name: "protected",
                    path: "protected",
                    beforeRoute: () => {
                        order.push("route-beforeRoute");
                        return true;
                    }
                }
            ];

            router = await createRouter(host, { routes });

            // 全局钩子先于路由项级钩子执行（_runHooks: 全局在前）
            router.hooks.add("beforeRoute", () => {
                order.push("global-beforeRoute");
                return true;
            });

            router.push("/protected");

            await waitNav();

            expect(order).toEqual(["global-beforeRoute", "route-beforeRoute"]);
        });

        it("应该在全局 beforeRoute 钩子取消后不执行路由守卫", async () => {
            let guardExecuted = false;

            const routes = [
                {
                    name: "protected",
                    path: "protected",
                    beforeRoute: () => {
                        guardExecuted = true;
                        return true;
                    }
                }
            ];

            router = await createRouter(host, { routes });

            router.hooks.add("beforeRoute", () => {
                return false;
            });

            router.push("/protected");

            await waitNav();

            expect(guardExecuted).toBe(false);
        });

        it("守卫拦截后应触发 navigation:cancel 且不渲染", async () => {
            let rendered = false;
            let cancelled = false;

            const routes = [
                { name: "home", path: "/" },
                {
                    name: "protected",
                    path: "protected",
                    beforeRoute: () => false
                }
            ];

            router = await createRouter(host, { routes });

            router.hooks.add("beforeRender", () => { rendered = true; });
            router.on("navigation:cancel", () => { cancelled = true; });

            router.push("/protected");

            await waitNav();

            // 拦截语义（实现现状）：渲染被跳过 + cancel 事件；
            // afterRoute 在 finally 中无条件执行（导航已产生历史条目）
            expect(rendered).toBe(false);
            expect(cancelled).toBe(true);
        });
    });

    describe("守卫错误处理", () => {
        it("挂起的守卫不应使导航永久阻塞（超时后忽略并继续）", async () => {
            let navigated = false;

            const routes = [
                {
                    name: "timeout",
                    path: "timeout",
                    beforeRoute: () => {
                        return new Promise(() => {
                            // 永不 resolve，模拟挂起
                        });
                    }
                },
                {
                    name: "after",
                    path: "after"
                }
            ];

            // hookOptions.timeout 缺省 3000ms，用例内调小以缩短等待
            router = await createRouter(host, {
                routes,
                hookOptions: { timeout: 50 },
            });
            router.hooks.add("afterRoute", () => { navigated = true; });

            router.push("/timeout");

            // 等待超时触发（50ms）+ 一轮调度
            await waitNav(200);

            // 挂起守卫超时后被忽略，导航继续完成（afterRoute 在 finally 执行）
            expect(navigated).toBe(true);
        });
    });
});
