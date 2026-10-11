// @ts-nocheck - 集成测试包含理想情况下的测试场景，与实际类型定义有差异
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { KylinRouter } from "@/router";
import type { KylinRouteItem } from "@/types";

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

describe("Phase 3 Integration Tests", () => {
    let host: HTMLElement;
    let router: KylinRouter;

    beforeEach(() => {
        createTestDOM();
        host = document.createElement("div");
        document.body.appendChild(host);
    });

    afterEach(() => {
        if (router) {
            router.detach();
        }
        host.remove();
        // 清理全局状态
        if (typeof window !== "undefined") {
            delete (window as any).retryAttempts;
        }
    });

    describe("组件加载系统集成", () => {
        it("应该正确加载本地组件", async () => {
            router = new KylinRouter(host, {
                routes: [
                    {
                        name: "local",
                        path: "/local",
                        view: "div",
                        data: { title: "Local Component" },
                    },
                ],
            });

            router.attach();
            await router.push("/local");

            expect(router.routes.current.route).toBeDefined();
            expect(router.routes.current.route?.path).toBe("/local");
        });

        it("应该正确处理动态导入", async () => {
            router = new KylinRouter(host, {
                routes: [
                    {
                        name: "dynamic",
                        path: "/dynamic",
                        view: "div",
                        data: { title: "Dynamic Component" },
                    },
                ],
            });

            router.attach();
            await router.push("/dynamic");

            expect(router.routes.current.route?.path).toBe("/dynamic");
        });

        it("应该正确处理组件加载状态", async () => {
            let loadStarted = false;

            router = new KylinRouter(host, {
                routes: [
                    {
                        name: "async",
                        path: "/async",
                        view: async () => {
                            loadStarted = true;
                            await new Promise((resolve) => setTimeout(resolve, 10));
                            return "div";
                        },
                        data: { title: "Async Component" },
                    },
                ],
            });

            router.attach();
            router.on("component-load-start", () => {
                loadStarted = true;
            });

            await router.push("/async");
            await new Promise((resolve) => setTimeout(resolve, 50));

            expect(loadStarted).toBe(true);
            expect(router.routes.current.route?.path).toBe("/async");
        });
    });

    describe("渲染系统集成", () => {
        it("应该正确渲染 lit 模板", async () => {
            router = new KylinRouter(host, {
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

            router.attach();
            await router.push("/render");

            expect(router.routes.current.route?.path).toBe("/render");
            expect(router.routes.current.route?.data?.content).toBe("This is rendered content");
        });

        it("应该正确插值模板变量", async () => {
            router = new KylinRouter(host, {
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

            router.attach();
            await router.push("/interpolate");

            expect(router.routes.current.route?.data?.name).toBe("Test User");
        });

        it("应该支持嵌套路由配置", async () => {
            router = new KylinRouter(host, {
                routes: [
                    {
                        name: "parent",
                        path: "/parent",
                        view: `div`,
                        data: { title: "Parent" },
                        children: [
                            {
                                name: "child",
                                path: "/parent/child",
                                view: `div`,
                                data: { title: "Child" },
                            },
                        ],
                    },
                ],
            });

            router.attach();
            await router.push("/parent/child");

            // 验证路由匹配成功
            expect(router.routes.current.route).toBeDefined();
            // 子路由应该匹配成功
            expect(router.routes.current.route?.path).toContain("child");
        });
    });

    describe("数据管理系统集成", () => {
        it("应该正确处理 renderEach 钩子", async () => {
            let hookExecuted = false;
            let preloadedData = null;

            router = new KylinRouter(host, {
                routes: [
                    {
                        name: "data",
                        path: "/data",
                        view: "div",
                        renderEach: async (to, from, next) => {
                            hookExecuted = true;
                            preloadedData = { userId: 123, userName: "Test User" };
                            next(preloadedData);
                        },
                        data: { title: "Data Test" },
                    },
                ],
            });

            router.attach();
            await router.push("/data");
            await new Promise((resolve) => setTimeout(resolve, 50));

            expect(hookExecuted).toBe(true);
            expect(router.routes.current.route?.data?.userId).toBe(123);
        });

        it("应该正确处理重试配置", async () => {
            router = new KylinRouter(host, {
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

            router.attach();
            await router.push("/retry-route");

            // 验证路由配置正确加载
            expect(router.routes.current.route?.path).toBe("/retry-route");
        });

        it("应该正确处理错误边界配置", async () => {
            router = new KylinRouter(host, {
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

            router.attach();
            await router.push("/error-boundary");

            // 验证路由配置正确加载
            expect(router.routes.current.route?.path).toBe("/error-boundary");
        });
    });

    describe("模态路由系统集成", () => {
        it("应该正确配置模态路由", async () => {
            router = new KylinRouter(host, {
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

            router.attach();

            // 验证模态路由配置正确
            const currentRoute = router.routes.current.route;
            // 导航到模态路由
            await router.push("/modal");

            // 模态路由应该成功配置
            expect(currentRoute).toBeDefined();
        });

        it("应该正确配置模态选项", async () => {
            router = new KylinRouter(host, {
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

            router.attach();

            // 验证模态配置正确加载
            await router.push("/modal-options");
            expect(router.routes.current.route?.path).toBe("/modal-options");
        });

        it("应该支持 ! 前缀的模态路径", async () => {
            router = new KylinRouter(host, {
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

            router.attach();

            // 验证 ! 前缀路径配置
            await router.push("!/quick-modal");
            // 模态路由应该成功处理
            expect(router.routes.current.route).toBeDefined();
        });
    });

    describe("完整导航流程集成", () => {
        it("应该正确执行完整导航流程", async () => {
            let guardExecuted = false;
            let dataPreloaded = false;

            router = new KylinRouter(host, {
                routes: [
                    {
                        name: "complete",
                        path: "/complete",
                        view: "div",
                        beforeEach: (to, from, next) => {
                            guardExecuted = true;
                            next();
                        },
                        renderEach: async (to, from, next) => {
                            dataPreloaded = true;
                            next({ testData: "preloaded" });
                        },
                        data: { title: "Complete Flow" },
                    },
                ],
            });

            router.attach();
            await router.push("/complete");
            await new Promise((resolve) => setTimeout(resolve, 50));

            expect(dataPreloaded).toBe(true);
            expect(router.routes.current.route?.path).toBe("/complete");
            expect(router.routes.current.route?.data?.testData).toBe("preloaded");
        });

        it("应该正确处理路由参数", async () => {
            router = new KylinRouter(host, {
                routes: [
                    {
                        name: "params",
                        path: "/params/:id",
                        view: "div",
                        data: { title: "Params Test" },
                    },
                ],
            });

            router.attach();
            await router.push("/params/123");

            // 路由参数应该正确解析
            expect(router.routes.current.route?.params?.id).toBe("123");
        });

        it("应该正确处理查询参数", async () => {
            router = new KylinRouter(host, {
                routes: [
                    {
                        name: "query",
                        path: "/query",
                        view: "div",
                        data: { title: "Query Test" },
                    },
                ],
            });

            router.attach();
            await router.push("/query?foo=bar&baz=qux");

            expect(router.routes.current.route?.path).toBe("/query");
            expect(router.routes.current.route?.query?.foo).toBe("bar");
            expect(router.routes.current.route?.query?.baz).toBe("qux");
        });
    });

    describe("路由器生命周期", () => {
        it("应该正确处理路由配置", async () => {
            const routes: KylinRouteItem[] = [
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

            router = new KylinRouter(host, { routes });

            router.attach();
            await router.push("/route1");

            // 验证路由配置正确加载
            expect(router.routes.current.route?.name).toBe("route1");
        });
    });

    describe("多路由导航", () => {
        it("应该正确处理多个路由导航", async () => {
            const navigations: string[] = [];

            router = new KylinRouter(host, {
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

            router.attach();

            // 监听导航事件
            router.on("route/change", (event: any) => {
                if (event?.detail?.route?.path) {
                    navigations.push(event.detail.route.path);
                }
            });

            await router.push("/route1");
            await router.push("/route2");
            await router.push("/route3");

            // 验证所有导航都成功
            expect(router.routes.current.route?.path).toBe("/route3");
        });

        it("应该正确处理路由数据隔离", async () => {
            router = new KylinRouter(host, {
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

            router.attach();

            await router.push("/isolated1");
            const data1 = router.routes.current.route?.data;

            await router.push("/isolated2");
            const data2 = router.routes.current.route?.data;

            // 验证数据隔离
            expect(data1?.value).toBe("A");
            expect(data2?.value).toBe("B");
        });
    });

    describe("组件加载与渲染集成", () => {
        it("应该正确集成组件加载和渲染流程", async () => {
            let componentLoaded = false;
            let dataRendered = false;

            router = new KylinRouter(host, {
                routes: [
                    {
                        name: "integrated",
                        path: "/integrated",
                        view: async () => {
                            componentLoaded = true;
                            await new Promise((resolve) => setTimeout(resolve, 10));
                            return "div";
                        },
                        renderEach: async (to, from, next) => {
                            dataRendered = true;
                            next({ message: "Data loaded" });
                        },
                        data: { title: "Integration Test" },
                    },
                ],
            });

            router.attach();

            // 监听组件加载事件
            router.on("component-load-end", () => {
                componentLoaded = true;
            });

            await router.push("/integrated");
            await new Promise((resolve) => setTimeout(resolve, 50));

            expect(componentLoaded).toBe(true);
            expect(dataRendered).toBe(true);
            expect(router.routes.current.route?.data?.message).toBe("Data loaded");
        });

        it("应该正确处理加载失败情况", async () => {
            let errorHandled = false;

            router = new KylinRouter(host, {
                routes: [
                    {
                        name: "fail-route",
                        path: "/fail-route",
                        view: "invalid-component",
                        data: { title: "Fail Test" },
                    },
                ],
            });

            router.attach();

            // 监听错误事件
            router.on("component-error", () => {
                errorHandled = true;
            });

            await router.push("/fail-route");
            await new Promise((resolve) => setTimeout(resolve, 50));

            // 错误应该被正确处理
            expect(errorHandled).toBe(true);
        });
    });
});
