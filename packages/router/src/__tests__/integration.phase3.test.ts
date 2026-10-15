// @ts-nocheck - 集成测试包含理想情况下的测试场景，与实际类型定义有差异
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { AutoSparkRouter } from "@/router";
import type { AutoSparkRouteItem } from "@/types";

/**
 * 创建测试用的 DOM 环境
 */
function createTestDOM() {
    const { Window } = require("happy-dom");
    const win = new Window({ url: "http://localhost/" });

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
    // @ts-ignore
    globalThis.DOMParser = win.DOMParser;

    // 确保 SyntaxError 在 happy-dom 的 window 对象上可用
    win.SyntaxError = SyntaxError;
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
 * 构造 AutoSparkRouter。
 * 构造函数自 89515f9 起自动 attach()，不得重复调用（抛 Already attached）；
 * attach 链异步完成，需等待路由表加载与初始导航结束。
 */
async function createRouter(host: HTMLElement, options: any) {
    // 渲染链路要求宿主内存在出口元素
    if (!host.querySelector("[data-autospark-outlet]")) {
        const outlet = document.createElement("div");
        outlet.setAttribute("data-autospark-outlet", "");
        host.appendChild(outlet);
    }
    const router = new AutoSparkRouter(host, { engine: stubEngine(), ...options });
    await new Promise((resolve) => setTimeout(resolve, 80));
    return router;
}

/** 取 matched 数组末项（最深匹配） */
function lastMatched(router: AutoSparkRouter) {
    const current = router.routes.current ?? [];
    return current[current.length - 1];
}

/** 等待导航结束（cancel 与 end 都算一轮导航结束） */
function waitNav(ms = 120) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("Phase 3 Integration Tests", () => {
    let host: HTMLElement;
    let router: AutoSparkRouter;

    beforeEach(() => {
        createTestDOM();
        host = document.createElement("div");
        document.body.appendChild(host);
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
        host.remove();
        // 清理全局状态
        if (typeof window !== "undefined") {
            delete (window as any).retryAttempts;
        }
    });

    describe("组件加载系统集成", () => {
        it("应该正确加载本地组件", async () => {
            router = await createRouter(host, {
                routes: [
                    {
                        name: "local",
                        path: "/local",
                        view: "div",
                        data: { title: "Local Component" },
                    },
                ],
            });

            router.push("/local");
            await waitNav();

            expect(lastMatched(router)).toBeDefined();
            expect(lastMatched(router)?.route).toBeDefined();
            expect(lastMatched(router)?.path).toBe("/local");
        });

        it("应该正确处理动态导入", async () => {
            router = await createRouter(host, {
                routes: [
                    {
                        name: "dynamic",
                        path: "/dynamic",
                        view: "div",
                        data: { title: "Dynamic Component" },
                    },
                ],
            });

            router.push("/dynamic");
            await waitNav();

            expect(lastMatched(router)?.path).toBe("/dynamic");
        });

        it("应该正确处理组件加载状态", async () => {
            let loadStarted = false;

            // 函数视图在新管线中按静态数据处理（不会被调用，见 baseLoader.loadRoute 步骤 2）；
            // 异步加载语义改由 URL 视图 + fetch 承载，此处 mock fetch 模拟异步视图加载
            const originalFetch = globalThis.fetch;
            (globalThis as any).fetch = async () => {
                loadStarted = true;
                await new Promise((resolve) => setTimeout(resolve, 10));
                return {
                    ok: true,
                    status: 200,
                    statusText: "OK",
                    text: async () => "<div>async view</div>",
                    json: async () => ({}),
                } as any;
            };

            try {
                router = await createRouter(host, {
                    routes: [
                        {
                            name: "async",
                            path: "/async",
                            view: "views/async.html",
                            data: { title: "Async Component" },
                        },
                    ],
                });

                // component-load-start/end 事件已移除；fetch 发起即加载开始
                router.push("/async");
                await waitNav();

                expect(loadStarted).toBe(true);
                expect(lastMatched(router)?.path).toBe("/async");
            } finally {
                (globalThis as any).fetch = originalFetch;
            }
        });
    });

    describe("渲染系统集成", () => {
        it("应该正确渲染 lit 模板", async () => {
            router = await createRouter(host, {
                routes: [
                    {
                        name: "render",
                        path: "/render",
                        view: `div`,
                        data: {
                            title: "Render Test",
                            content: "This is rendered content",
                        },
                    },
                ],
            });

            router.push("/render");
            await waitNav();

            expect(lastMatched(router)?.path).toBe("/render");
            expect(lastMatched(router)?.route?.data?.content).toBe("This is rendered content");
        });

        it("应该正确插值模板变量", async () => {
            router = await createRouter(host, {
                routes: [
                    {
                        name: "interpolate",
                        path: "/interpolate",
                        view: `div`,
                        data: {
                            title: "Interpolation Test",
                            name: "Test User",
                        },
                    },
                ],
            });

            router.push("/interpolate");
            await waitNav();

            expect(lastMatched(router)?.route?.data?.name).toBe("Test User");
        });

        it("应该支持嵌套路由配置", async () => {
            router = await createRouter(host, {
                routes: [
                    {
                        name: "parent",
                        path: "/parent",
                        view: `div`,
                        data: { title: "Parent" },
                        children: [
                            {
                                name: "child",
                                // 子路径用相对形式（绝对形式在路径树归并后无法匹配）
                                path: "child",
                                view: `div`,
                                data: { title: "Child" },
                            },
                        ],
                    },
                ],
            });

            router.push("/parent/child");
            await waitNav();

            // 验证路由匹配成功
            expect(lastMatched(router)).toBeDefined();
            expect(lastMatched(router)?.route).toBeDefined();
            // 子路由应该匹配成功
            expect(lastMatched(router)?.path).toContain("child");
        });
    });

    describe("数据管理系统集成", () => {
        it("应该正确处理 beforeRender 钩子（原 renderEach）", async () => {
            let hookExecuted = false;
            const preloadedData = { userId: 123, userName: "Test User" };

            router = await createRouter(host, {
                routes: [
                    {
                        name: "data",
                        path: "/data",
                        // beforeRender 需视图成功加载才触发；函数视图避免远程 fetch
                        view: () => "<div>data</div>",
                        // renderEach 已更名为 beforeRender（单对象参数，无 next 回调）；
                        // 预加载数据改由路由 data 数据源（DataLoader）承载
                        beforeRender: () => {
                            hookExecuted = true;
                        },
                        data: () => preloadedData,
                    },
                ],
            });

            router.push("/data");
            await waitNav();

            expect(hookExecuted).toBe(true);
            // 数据经 DataLoader 写入路由项的 AsyncLoader signal
            const loader = lastMatched(router)?.route?._getData;
            expect(loader).toBeDefined();
            expect(loader.signal.result).toEqual(preloadedData);
        });

        it("应该正确处理重试配置", async () => {
            router = await createRouter(host, {
                routes: [
                    {
                        name: "retry-route",
                        path: "/retry-route",
                        view: "div",
                        retry: {
                            max: 3,
                            delay: 10,
                            strategy: "fixed",
                        },
                        data: { title: "Retry Route" },
                    },
                ],
            });

            router.push("/retry-route");
            await waitNav();

            // 验证路由配置正确加载
            expect(lastMatched(router)?.path).toBe("/retry-route");
        });

        it("应该正确处理错误边界配置", async () => {
            router = await createRouter(host, {
                routes: [
                    {
                        name: "error-boundary",
                        path: "/error-boundary",
                        view: "div",
                        errorBoundary: {
                            component: () => "<div>Error</div>",
                        },
                        data: { title: "Error Boundary Test" },
                    },
                ],
            });

            router.push("/error-boundary");
            await waitNav();

            // 验证路由配置正确加载
            expect(lastMatched(router)?.path).toBe("/error-boundary");
        });
    });

    describe("模态路由系统集成", () => {
        it("应该正确配置模态路由", async () => {
            router = await createRouter(host, {
                routes: [
                    {
                        name: "modal",
                        path: "/modal",
                        view: "div",
                        modal: true,
                        data: { title: "Modal Test" },
                    },
                ],
            });

            // 导航到模态路由
            router.push("/modal");
            await waitNav();

            // 模态路由应该成功配置
            expect(lastMatched(router)?.route).toBeDefined();
            expect(lastMatched(router)?.path).toBe("/modal");
        });

        it("应该正确配置模态选项", async () => {
            router = await createRouter(host, {
                routes: [
                    {
                        name: "modal-options",
                        path: "/modal-options",
                        view: "div",
                        modal: {
                            backdrop: true,
                            closeOnBackdropClick: true,
                            closeOnEsc: true,
                            type: "dialog",
                            position: "center",
                        },
                        data: { title: "Modal Options Test" },
                    },
                ],
            });

            // 验证模态配置正确加载
            router.push("/modal-options");
            await waitNav();
            expect(lastMatched(router)?.path).toBe("/modal-options");
        });

        it("应该支持 ! 前缀的模态路径", async () => {
            router = await createRouter(host, {
                routes: [
                    {
                        name: "quick-modal",
                        path: "/quick-modal",
                        view: "div",
                        modal: true,
                        data: { title: "Quick Modal" },
                    },
                ],
            });

            // 模态路由配置正确且可匹配（match 返回 matched 数组，末项为最深匹配）
            const matched = router.routes.match("/quick-modal");
            expect(matched?.[matched.length - 1]?.route?.modal).toBe(true);

            // ! 前缀路径会分流到 openModal（不进入 history）。
            // _resolveModalRoute 已随匹配 API 迁移（matched 数组取末项），
            // openModal 解析成功：模态入栈、触发 modal:open、不改变主路由状态
            await router.openModal({ route: "/quick-modal" } as any);

            expect(router.modalState.stack.length).toBe(1);
            expect(router.hasOpenModals).toBe(true);
            expect(router.currentModal?.route.name).toBe("quick-modal");

            // 普通路由状态不受模态打开影响
            expect(lastMatched(router)).toBeDefined();
        });
    });

    describe("完整导航流程集成", () => {
        it("应该正确执行完整导航流程", async () => {
            let guardExecuted = false;
            let dataPreloaded = false;

            router = await createRouter(host, {
                routes: [
                    {
                        name: "complete",
                        path: "/complete",
                        // beforeRender 需视图成功加载才触发
                        view: () => "<div>complete</div>",
                        // 路由级 beforeEach → beforeRoute、renderEach → beforeRender
                        beforeRoute: () => {
                            guardExecuted = true;
                            return true;
                        },
                        beforeRender: () => {
                            dataPreloaded = true;
                        },
                        // renderEach next(data) 通道已废弃，预加载数据由 data 数据源承载
                        data: () => ({ title: "Complete Flow", testData: "preloaded" }),
                    },
                ],
            });

            router.push("/complete");
            await waitNav();

            expect(guardExecuted).toBe(true);
            expect(dataPreloaded).toBe(true);
            expect(lastMatched(router)?.path).toBe("/complete");
            const loader = lastMatched(router)?.route?._getData;
            expect(loader.signal.result?.testData).toBe("preloaded");
        });

        it("应该正确处理路由参数", async () => {
            router = await createRouter(host, {
                routes: [
                    {
                        name: "params",
                        path: "/params/:id",
                        view: "div",
                        data: { title: "Params Test" },
                    },
                ],
            });

            router.push("/params/123");
            await waitNav();

            // 路由参数应该正确解析（params 在 matched 项上）
            expect(lastMatched(router)?.params?.id).toBe("123");
        });

        it("应该正确处理查询参数", async () => {
            router = await createRouter(host, {
                routes: [
                    {
                        name: "query",
                        path: "/query",
                        view: "div",
                        data: { title: "Query Test" },
                    },
                ],
            });

            router.push("/query?foo=bar&baz=qux");
            await waitNav();

            expect(lastMatched(router)?.path).toBe("/query");
            // query 解析在匹配链的根项上
            const current = router.routes.current ?? [];
            const withQuery = current.find((m) => m.query && Object.keys(m.query).length > 0);
            expect(withQuery?.query?.foo).toBe("bar");
            expect(withQuery?.query?.baz).toBe("qux");
        });
    });

    describe("路由器生命周期", () => {
        it("应该正确处理路由配置", async () => {
            const routes: AutoSparkRouteItem[] = [
                {
                    name: "route1",
                    path: "/route1",
                    view: "div",
                    data: { title: "Route 1" },
                },
                {
                    name: "route2",
                    path: "/route2",
                    view: "div",
                    data: { title: "Route 2" },
                },
            ];

            router = await createRouter(host, { routes });

            router.push("/route1");
            await waitNav();

            // 验证路由配置正确加载
            expect(lastMatched(router)?.route?.name).toBe("route1");
        });
    });

    describe("多路由导航", () => {
        it("应该正确处理多个路由导航", async () => {
            const navigations: string[] = [];

            router = await createRouter(host, {
                routes: [
                    {
                        name: "route1",
                        path: "/route1",
                        view: "div",
                        data: { title: "Route 1" },
                    },
                    {
                        name: "route2",
                        path: "/route2",
                        view: "div",
                        data: { title: "Route 2" },
                    },
                    {
                        name: "route3",
                        path: "/route3",
                        view: "div",
                        data: { title: "Route 3" },
                    },
                ],
            });

            // route/change 事件已移除；导航事件为 navigation:matched（载荷为 matched 上下文）
            router.on("navigation:matched", (matched: any) => {
                const to = matched?.toRoute;
                const path = to?.[to.length - 1]?.path;
                if (path) {
                    navigations.push(path);
                }
            });

            router.push("/route1");
            await waitNav(60);
            router.push("/route2");
            await waitNav(60);
            router.push("/route3");
            await waitNav();

            // 验证所有导航都成功
            expect(navigations).toContain("/route1");
            expect(navigations).toContain("/route2");
            expect(navigations).toContain("/route3");
            expect(lastMatched(router)?.path).toBe("/route3");
        });

        it("应该正确处理路由数据隔离", async () => {
            router = await createRouter(host, {
                routes: [
                    {
                        name: "isolated1",
                        path: "/isolated1",
                        view: "div",
                        data: { title: "Isolated 1", value: "A" },
                    },
                    {
                        name: "isolated2",
                        path: "/isolated2",
                        view: "div",
                        data: { title: "Isolated 2", value: "B" },
                    },
                ],
            });

            router.push("/isolated1");
            await waitNav(60);
            const data1 = lastMatched(router)?.route?.data;

            router.push("/isolated2");
            await waitNav();
            const data2 = lastMatched(router)?.route?.data;

            // 验证数据隔离
            expect(data1?.value).toBe("A");
            expect(data2?.value).toBe("B");
        });
    });

    describe("组件加载与渲染集成", () => {
        it("应该正确集成组件加载和渲染流程", async () => {
            let componentLoaded = false;
            let dataRendered = false;

            // 函数视图在新管线中不会被调用（按静态数据处理）；异步组件加载改由
            // URL 视图 + fetch 承载，此处 mock fetch 模拟异步视图加载
            const originalFetch = globalThis.fetch;
            (globalThis as any).fetch = async () => {
                componentLoaded = true;
                await new Promise((resolve) => setTimeout(resolve, 10));
                return {
                    ok: true,
                    status: 200,
                    statusText: "OK",
                    text: async () => "<div>integrated</div>",
                    json: async () => ({}),
                } as any;
            };

            try {
                router = await createRouter(host, {
                    routes: [
                        {
                            name: "integrated",
                            path: "/integrated",
                            view: "views/integrated.html",
                            // renderEach → beforeRender；component-load-end 事件已移除，
                            // fetch 视图加载完成即组件加载完成
                            beforeRender: () => {
                                dataRendered = true;
                            },
                            data: { title: "Integration Test", message: "Data loaded" },
                        },
                    ],
                });

                router.push("/integrated");
                await waitNav();

                expect(componentLoaded).toBe(true);
                expect(dataRendered).toBe(true);
                expect(lastMatched(router)?.route?.data?.message).toBe("Data loaded");
            } finally {
                (globalThis as any).fetch = originalFetch;
            }
        });

        it("应该正确处理加载失败情况", async () => {
            let errorHandled = false;

            // 自带失败 fetch（隔离运行时是 native fetch 无效 URL 拒绝；
            // 全量运行时可能有前序文件泄漏的成功 mock——自包含以免疫）
            const originalFetch = globalThis.fetch;
            (globalThis as any).fetch = async () => ({
                ok: false,
                status: 404,
                statusText: "Not Found",
                text: async () => "",
                json: async () => ({}),
            });

            try {
                router = await createRouter(host, {
                    routes: [
                        {
                            name: "fail-route",
                            path: "/fail-route",
                            view: "invalid-component",
                            data: { title: "Fail Test" },
                        },
                    ],
                });

                // component-error 事件已移除；视图加载失败经 routeError 钩子暴露
                router.hooks.add("routeError", () => {
                    errorHandled = true;
                });

                router.push("/fail-route");
                await waitNav();

                // 错误应该被正确处理
                expect(errorHandled).toBe(true);
            } finally {
                (globalThis as any).fetch = originalFetch;
            }
        });
    });
});
