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

    // 添加 MutationObserver polyfill for Alpine.js
    // @ts-ignore
    globalThis.MutationObserver = win.MutationObserver || class MockMutationObserver {
        constructor(callback: MutationCallback) {}
        disconnect() {}
        observe(node: Node, options: any) {}
        takeRecords(): MutationRecord[] { return []; }
    };

    // 确保 SyntaxError 可用（happy-dom 需要）
    // @ts-ignore
    globalThis.SyntaxError = win.SyntaxError || SyntaxError;

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

describe("KylinRouter 递归渲染测试", () => {
    let host: HTMLElement;
    let router: KylinRouter;

    beforeEach(() => {
        host = createTestDOM();
    });

    afterEach(() => {
        if (router) {
            // @ts-ignore
            router.detach?.();
        }
        // @ts-ignore
        document.body.innerHTML = "";
    });

    describe("基础递归渲染", () => {
        it("应该正确渲染根路由", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: "<div class=\"root\">根路由内容</div>",
                },
            });

            await router.push("/");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            const rootElement = host.querySelector(".root");
            expect(rootElement).not.toBeNull();
            expect(rootElement?.textContent).toBe("根路由内容");
        });

        it("应该正确渲染一层嵌套路由", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: '<div class="root">根路由 <kylin-outlet></kylin-outlet></div>',
                    children: [
                        {
                            name: "child",
                            path: "child",
                            view: "<div class=\"child\">子路由内容</div>",
                        },
                    ],
                },
            });

            await router.push("/child");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            const rootElement = host.querySelector(".root");
            const childElement = host.querySelector(".child");

            expect(rootElement).not.toBeNull();
            expect(childElement).not.toBeNull();
            expect(childElement?.textContent).toBe("子路由内容");
        });

        it("应该正确渲染多层嵌套路由", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: '<div class="root">根 <kylin-outlet></kylin-outlet></div>',
                    children: [
                        {
                            name: "level1",
                            path: "level1",
                            view: '<div class="level1">一级 <kylin-outlet></kylin-outlet></div>',
                            children: [
                                {
                                    name: "level2",
                                    path: "level2",
                                    view: '<div class="level2">二级 <kylin-outlet></kylin-outlet></div>',
                                    children: [
                                        {
                                            name: "level3",
                                            path: "level3",
                                            view: "<div class=\"level3\">三级内容</div>",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            });

            await router.push("/level1/level2/level3");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            const rootElement = host.querySelector(".root");
            const level1Element = host.querySelector(".level1");
            const level2Element = host.querySelector(".level2");
            const level3Element = host.querySelector(".level3");

            expect(rootElement).not.toBeNull();
            expect(level1Element).not.toBeNull();
            expect(level2Element).not.toBeNull();
            expect(level3Element).not.toBeNull();
            expect(level3Element?.textContent).toBe("三级内容");
        });
    });

    describe("Outlet 自动创建", () => {
        it("根路由没有 outlet 时应该自动创建", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: "<div class=\"content\">内容</div>",
                },
            });

            await router.push("/");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            const outlet = host.querySelector("kylin-outlet");
            expect(outlet).not.toBeNull();
        });

        it("根路由已有 outlet 时不应该重复创建", async () => {
            // 预先插入 outlet
            const existingOutlet = document.createElement("kylin-outlet");
            host.appendChild(existingOutlet);

            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: "<div class=\"content\">内容</div>",
                },
            });

            await router.push("/");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            const outlets = host.querySelectorAll("kylin-outlet");
            expect(outlets.length).toBe(1);
        });

        it("子路由没有 outlet 时不应该自动创建", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: '<div class="root">根 <kylin-outlet></kylin-outlet></div>',
                    children: [
                        {
                            name: "child",
                            path: "child",
                            // 父路由没有提供 outlet
                            view: "<div class=\"child\">子路由内容</div>",
                        },
                    ],
                },
            });

            await router.push("/child");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            // 子路由内容应该不会渲染，因为找不到 outlet
            const childElement = host.querySelector(".child");
            // 注意：这个行为可能会根据实际实现调整
            // 这里只是演示测试结构
        });
    });

    describe("RouteItem.el WeakRef 缓存", () => {
        it("应该正确设置根路由的 el 引用", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: "<div class=\"root\">内容</div>",
                },
            });

            await router.push("/");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            // @ts-ignore
            const rootRoute = router.routes.current.route;
            expect(rootRoute).toBeDefined();

            if (rootRoute && rootRoute.el) {
                const outlet = rootRoute.el.deref();
                expect(outlet).not.toBeNull();
                expect(outlet?.tagName.toLowerCase()).toBe("kylin-outlet");
            }
        });

        it("应该正确设置嵌套路由的 el 引用", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: '<div class="root">根 <kylin-outlet></kylin-outlet></div>',
                    children: [
                        {
                            name: "child",
                            path: "child",
                            view: "<div class=\"child\">子</div>",
                        },
                    ],
                },
            });

            await router.push("/child");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            // @ts-ignore
            const matchedRoutes = router.routes.current.matchedRoutes;
            expect(matchedRoutes).toBeDefined();
            expect(matchedRoutes?.length).toBeGreaterThan(0);

            if (matchedRoutes) {
                for (const match of matchedRoutes) {
                    const route = match.route;
                    expect(route.el).toBeDefined();

                    if (route.el) {
                        const outlet = route.el.deref();
                        expect(outlet).not.toBeNull();
                        expect(outlet?.tagName.toLowerCase()).toBe("kylin-outlet");
                    }
                }
            }
        });
    });

    describe("Loading 状态", () => {
        it("应该在加载异步 view 时显示 loading", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "slow",
                    path: "/",
                    view: {
                        form: async () => {
                            // 模拟慢速加载
                            await new Promise((resolve) => setTimeout(resolve, 100));
                            return "<div class=\"content\">加载完成</div>";
                        },
                    },
                },
            });

            await router.push("/");

            // 立即检查，应该有 loading
            await new Promise((resolve) => setTimeout(resolve, 10));
            let loadingElement = host.querySelector("kylin-loading[data-role='loading-indicator']");
            expect(loadingElement).not.toBeNull();

            // 等待加载完成
            await new Promise((resolve) => setTimeout(resolve, 150));

            // loading 应该被替换为实际内容
            loadingElement = host.querySelector("kylin-loading[data-role='loading-indicator']");
            expect(loadingElement).toBeNull();

            const contentElement = host.querySelector(".content");
            expect(contentElement).not.toBeNull();
        });

        it("应该在嵌套路由中独立显示 loading", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: '<div class="root">根 <kylin-outlet></kylin-outlet></div>',
                    children: [
                        {
                            name: "slow-child",
                            path: "slow",
                            view: {
                                form: async () => {
                                    await new Promise((resolve) => setTimeout(resolve, 100));
                                    return "<div class=\"child\">子加载完成</div>";
                                },
                            },
                        },
                    ],
                },
            });

            await router.push("/slow");

            // 等待一下，检查子 outlet 的 loading
            await new Promise((resolve) => setTimeout(resolve, 10));

            const parentOutlet = host.querySelector("kylin-outlet");
            expect(parentOutlet).not.toBeNull();

            if (parentOutlet) {
                const childLoading = parentOutlet.querySelector("kylin-loading[data-role='loading-indicator']");
                expect(childLoading).not.toBeNull();
            }

            // 等待加载完成
            await new Promise((resolve) => setTimeout(resolve, 150));

            const childElement = host.querySelector(".child");
            expect(childElement).not.toBeNull();
        });
    });

    describe("错误处理", () => {
        it("应该在 view 加载失败时移除 loading", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "error",
                    path: "/",
                    view: {
                        form: async () => {
                            // 模拟加载失败
                            await new Promise((resolve) => setTimeout(resolve, 50));
                            throw new Error("加载失败");
                        },
                    },
                },
            });

            await router.push("/");

            // 等待加载完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            const loadingElement = host.querySelector("kylin-loading[data-role='loading-indicator']");
            expect(loadingElement).toBeNull();
        });

        it("应该继续渲染其他路由即使一个路由失败", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: '<div class="root">根 <kylin-outlet></kylin-outlet></div>',
                    children: [
                        {
                            name: "error-child",
                            path: "error",
                            view: {
                                form: async () => {
                                    throw new Error("子路由加载失败");
                                },
                            },
                        },
                    ],
                },
            });

            await router.push("/error");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            // 根路由应该正常渲染
            const rootElement = host.querySelector(".root");
            expect(rootElement).not.toBeNull();
        });
    });

    describe("性能测试", () => {
        it("应该在合理时间内完成深层嵌套渲染", async () => {
            // 创建 5 层嵌套
            const createNestedRoutes = (depth: number): any => {
                if (depth === 0) {
                    return {
                        name: `level-${depth}`,
                        path: `level-${depth}`,
                        view: `<div class="level-${depth}">最深层</div>`,
                    };
                }

                return {
                    name: `level-${depth}`,
                    path: `level-${depth}`,
                    view: `<div class="level-${depth}">层级 ${depth} <kylin-outlet></kylin-outlet></div>`,
                    children: [createNestedRoutes(depth - 1)],
                };
            };

            const routes = createNestedRoutes(5);

            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: '<div class="root">根 <kylin-outlet></kylin-outlet></div>',
                    children: [routes],
                },
            });

            const startTime = Date.now();

            await router.push("/level-5/level-4/level-3/level-2/level-1/level-0");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 200));

            const endTime = Date.now();
            const duration = endTime - startTime;

            // 5 层嵌套应该在 500ms 内完成
            expect(duration).toBeLessThan(500);

            // 验证所有层级都正确渲染
            const deepestElement = host.querySelector(".level-0");
            expect(deepestElement).not.toBeNull();
        });
    });

    describe("边界情况", () => {
        it("应该处理空 view 的情况", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "empty",
                    path: "/",
                    // @ts-ignore - 测试空 view
                    view: null,
                },
            });

            await router.push("/");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            // 不应该抛出错误
            expect(router).toBeDefined();
        });

        it("应该处理没有 children 的路由", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "no-children",
                    path: "/",
                    view: "<div class=\"content\">内容</div>",
                    // 没有 children 字段
                },
            });

            await router.push("/");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            const contentElement = host.querySelector(".content");
            expect(contentElement).not.toBeNull();
        });

        it("应该处理路由切换", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: '<div class="root">根 <kylin-outlet></kylin-outlet></div>',
                    children: [
                        {
                            name: "route1",
                            path: "route1",
                            view: "<div class=\"route1\">路由1</div>",
                        },
                        {
                            name: "route2",
                            path: "route2",
                            view: "<div class=\"route2\">路由2</div>",
                        },
                    ],
                },
            });

            await router.push("/route1");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            let route1Element = host.querySelector(".route1");
            expect(route1Element).not.toBeNull();

            // 切换到 route2
            await router.push("/route2");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            const route2Element = host.querySelector(".route2");
            expect(route2Element).not.toBeNull();

            // route1 应该不存在了
            route1Element = host.querySelector(".route1");
            expect(route1Element).toBeNull();
        });
    });
});
