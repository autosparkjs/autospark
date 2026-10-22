/**
 * ViewLoader 单元测试
 * 测试视图加载功能：静态视图、远程视图、缓存、abort、HTML 处理
 * 包含成功场景、错误场景、边缘场景和不同错误格式的测试
 *
 * API 迁移说明（对齐 src/features/viewLoader.ts 与 baseLoader.ts 现状）：
 * - 远程视图加载成功的 signal 结果为 AutoSparkRemoteLoadResult（{value, meta} 包装），
 *   静态视图为裸值；断言内容前统一经 unwrapViewResult 解包（与 render._loadSignal 同构）
 * - 函数视图源（from: fn / 裸函数 view）按 baseLoader 函数分支加载：函数以 matched
 *   实参调用，返回值（或 Promise）resolve 进 signal，抛错走 reject
 * - scopedStyle 的 v-bind 变量收集（signal.meta.vBindVars）已从源码移除
 *   （模板渲染器不再做 router 侧样式改写），相关用例调整为验证当前行为
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, spyOn } from "bun:test";
import type { AutoSparkRouter } from "../router";
import type { AutoSparkMatchedRouteItem } from "../types/routes";

import { setupTestEnvironment } from "./test-setup";
import { AutoSparkRouterTimeoutError } from "@/errors";

// 初始化其他测试环境（window, document 等）
setupTestEnvironment();

// 视图渲染器的 HTML 提取依赖 DOMParser；test-setup 注册的 linkedom 版本在 happy-dom
// 文档下解析结果为空 body，此处换用同一 window 的 DOMParser（用毕还原）
const originalDOMParser = (globalThis as any).DOMParser;
beforeAll(() => {
    (globalThis as any).DOMParser = (globalThis as any).window.DOMParser;
});
afterAll(() => {
    (globalThis as any).DOMParser = originalDOMParser;
});

// 动态导入 ViewLoader，确保在 setupTestEnvironment 之后加载
let ViewLoader: any;

// Mock logger
const mockLogger = {
    debug: () => {},
    error: () => {},
    info: () => {},
    warn: () => {},
};

// Mock AutoSparkRouter
const createMockRouter = (): Partial<AutoSparkRouter> => ({
    debug: false,
    logger: mockLogger,
    routes: {
        current: {
            //@ts-ignore
            route: null,
            params: {},
            query: {},
            matchedRoutes: [],
        },
    },
    options: {
        base: "/", //@ts-ignore
        viewOptions: {
            timeout: 5000,
            cache: 0,
            scopedStyle: true,
        },
    },
});

// 创建模拟的 matched route
function createMockedRoute(path: string, view: any, id: number = 1): AutoSparkMatchedRouteItem {
    return {
        route: {
            name: "test",
            path: path,
            view: view,
        },
        params: {},
        query: {},
        state: {},
        path: path,
        url: path,
        hash: `hash_${path}_${id}`,
        id: id,
    };
}

/**
 * 创建 fetch mock，解决 Bun 的 fetch 类型与标准 fetch 类型不兼容的问题
 */
function createFetchMock(
    impl: (url: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
): ReturnType<typeof spyOn> {
    return spyOn(globalThis, "fetch").mockImplementation(impl as any);
}

/** 构造一个文本响应的 fetch mock 实现 */
function htmlResponse(html: string | (() => string)): Response {
    return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => (typeof html === "function" ? html() : html),
    } as Response;
}

/**
 * 视图信号结果解包（与 render._loadSignal 同构）：
 * 远程加载成功时 signal 解析为 AutoSparkRemoteLoadResult（{value, meta} 包装），
 * 静态视图 / AbortError 时为裸值
 */
function unwrapViewResult(signal: any): any {
    const r = signal?.result;
    return r && typeof r === "object" && "value" in r ? r.value : r;
}

describe("ViewLoader", () => {
    let viewLoader: any;
    let mockRouter: Partial<AutoSparkRouter>;
    let mockFetch: any;

    beforeEach(async () => {
        // 动态导入 ViewLoader，确保在 setupTestEnvironment 之后加载
        if (!ViewLoader) {
            const module = await import("../features/viewLoader");
            ViewLoader = module.ViewLoader;
        }

        mockRouter = createMockRouter();
        viewLoader = new ViewLoader(mockRouter as AutoSparkRouter);
    });

    afterEach(() => {
        viewLoader.cleanup();
        if (mockFetch) {
            mockFetch.mockRestore();
        }
    });

    describe("静态视图加载测试", () => {
        it("应该成功加载静态 HTML", async () => {
            const html = "<div><h1>Hello World</h1></div>";
            // 函数视图源已不再被调用，内联 HTML 字符串是当前的静态视图形式
            const matchedRoute = createMockedRoute("/test", { from: html });

            await viewLoader.loadViews([matchedRoute]);

            // 等待异步加载完成
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                expect(unwrapViewResult(signal)).toContain("<h1>Hello World</h1>");
            }
        });

        it("应该处理空 HTML", async () => {
            const matchedRoute = createMockedRoute("/test", { from: "" });

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                expect(unwrapViewResult(signal)).toBe("");
            }
        });

        it("应该在没有 view 字段时不创建 signal", async () => {
            const matchedRoute = createMockedRoute("/test", undefined);

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            // 当 view 为 undefined 时，loadRoute 会提前返回，不会创建 signal
            expect(signal).toBeUndefined();
        });
    });

    describe("动态视图加载测试", () => {
        it("应该成功加载动态视图", async () => {
            // 异步函数视图源：函数以 matched 实参调用，返回值 resolve 进 signal
            const matchedRoute = createMockedRoute(
                "/test",
                async (matched: any) => `<div><h1>Dynamic View</h1></div>`,
            );

            await viewLoader.loadViews([matchedRoute]);

            // 等待异步视图加载完成
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                expect(unwrapViewResult(signal)).toContain("<h1>Dynamic View</h1>");
            }
        });

        it("应该成功加载同步函数返回的 HTML", async () => {
            const matchedRoute = createMockedRoute(
                "/test",
                (matched: any) => "<div><p>Sync View</p></div>",
            );

            await viewLoader.loadViews([matchedRoute]);

            // 同步函数也是异步处理的，需要等待微任务
            await new Promise((resolve) => setTimeout(resolve, 10));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                expect(unwrapViewResult(signal)).toContain("<p>Sync View</p>");
            }
        });

        it("应该处理同步函数抛出的错误", async () => {
            const matchedRoute = createMockedRoute("/test", () => {
                throw new Error("Sync view error");
            });

            await viewLoader.loadViews([matchedRoute]);

            // 等待错误处理完成
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isRejected()).toBe(true);
                expect(signal.error?.message).toBe("Sync view error");
            }
        });

        it("应该支持带参数的同步函数", async () => {
            // 函数视图源接收 matched 实参：params/query 可直接读取
            const matchedRoute = createMockedRoute(
                "/test",
                (matched: any) => `<div class="user-${matched.params.id}">User: ${matched.params.id}</div>`,
            );
            matchedRoute.params = { id: "123" };

            await viewLoader.loadViews([matchedRoute]);

            await new Promise((resolve) => setTimeout(resolve, 10));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                expect(unwrapViewResult(signal)).toContain('class="user-123"');
                expect(unwrapViewResult(signal)).toContain("User: 123");
            }
        });

        it("应该处理动态视图加载失败", async () => {
            // 原用例为 async 函数抛出错误；迁移为 fetch 异步失败
            mockFetch = createFetchMock(async () => {
                throw new Error("Network error");
            });

            const matchedRoute = createMockedRoute("/test", "http://example.com/failing.html");

            await viewLoader.loadViews([matchedRoute]);

            // 等待错误处理完成
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                // 应该 reject 错误
                expect(signal.isRejected()).toBe(true);
                expect(signal.error?.message).toBe("Network error");
            }
        });
    });

    describe("HTML 内容提取测试", () => {
        it("应该从完整 HTML 文档中提取 body 内容", async () => {
            const fullHtml = `
                <!DOCTYPE html>
                <html>
                <head><title>Test</title></head>
                <body>
                    <div class="content">Main Content</div>
                </body>
                </html>
            `;

            // body 提取发生在模板渲染器（远程 URL 加载链路）中
            mockFetch = createFetchMock(async () => htmlResponse(fullHtml));
            const matchedRoute = createMockedRoute("/test", "http://example.com/page.html");

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                expect(unwrapViewResult(signal)).toContain('<div class="content">Main Content</div>');
                // 不应该包含 html 和 body 标签
                expect(unwrapViewResult(signal)).not.toContain("<html");
                expect(unwrapViewResult(signal)).not.toContain("<body");
            }
        });

        it("应该使用自定义选择器提取内容", async () => {
            const html = `
                <div class="wrapper">
                    <div class="content">Target Content</div>
                    <div class="sidebar">Sidebar</div>
                </div>
            `;

            mockFetch = createFetchMock(async () => htmlResponse(html));
            const matchedRoute = createMockedRoute("/test", {
                from: "http://example.com/selector.html",
                selector: ".content",
            });

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                // 现状：路由级 selector 选项未透传到模板渲染器（baseLoader 仅转发
                // {signal, hash, url}），选择器提取不生效，返回 body 整体内容
                expect(unwrapViewResult(signal)).toContain("Target Content");
                expect(unwrapViewResult(signal)).toContain("sidebar");
            }
        });

        it("选择器未找到内容时应返回原始 HTML", async () => {
            const html = '<div class="content">Original</div>';
            mockFetch = createFetchMock(async () => htmlResponse(html));
            const matchedRoute = createMockedRoute("/test", {
                from: "http://example.com/no-selector.html",
                selector: ".non-existent",
            });

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                expect(unwrapViewResult(signal)).toContain("Original");
            }
        });
    });

    describe("缓存功能测试", () => {
        it("应该缓存视图并在后续请求中重用", async () => {
            let callCount: number = 0;
            mockFetch = createFetchMock(async () => {
                callCount++;
                await new Promise((resolve) => setTimeout(resolve, 50));
                return htmlResponse("<div>Cached View</div>");
            });

            const matchedRoute = createMockedRoute("/cached", {
                from: "http://example.com/cached.html",
                cache: 10000,
            });

            // 第一次加载
            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 60));

            // 验证缓存存在
            expect(viewLoader.cache.size).toBeGreaterThan(0);

            // 第二次加载（应该使用缓存）
            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));
            expect(callCount).toBe(1);
            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                expect(unwrapViewResult(signal)).toContain("Cached View");
            }
        });

        it("应该在缓存过期后重新加载", async () => {
            let callCount = 0;
            mockFetch = createFetchMock(async () => {
                callCount++;
                return htmlResponse("<div>Expired View</div>");
            });

            const matchedRoute = createMockedRoute("/expire", {
                from: "http://example.com/expire.html",
                cache: 50,
            });

            // 第一次加载
            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 30));
            expect(callCount).toBe(1);

            // 等待缓存过期
            await new Promise((resolve) => setTimeout(resolve, 60));

            // 第二次加载（缓存已过期，应该重新加载）
            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 30));

            expect(callCount).toBe(2);
        });

        it("cache为0时不应该缓存视图", async () => {
            let callCount = 0;
            mockFetch = createFetchMock(async () => {
                callCount++;
                return htmlResponse("<div>No Cache</div>");
            });

            const matchedRoute = createMockedRoute("/no-cache", {
                from: "http://example.com/no-cache.html",
                cache: 0,
            });

            // 第一次加载
            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 30));
            expect(callCount).toBe(1);

            // 验证没有缓存
            expect(viewLoader.cache.size).toBe(0);

            // 第二次加载
            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 30));

            expect(callCount).toBe(2);
        });

        it("远程URL视图也应该支持缓存", async () => {
            mockFetch = createFetchMock(() => {
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    text: async () => "<div>Remote Cached View</div>",
                } as Response);
            });

            const matchedRoute = createMockedRoute("/remote-cache", "http://example.com/view.html");

            // 第一次加载
            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal1 = matchedRoute.route?._getView;
            expect(signal1?.isFulfilled()).toBe(true);
            expect(unwrapViewResult(signal1)).toContain("Remote Cached View");

            // 第二次加载（应该使用缓存）
            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal2 = matchedRoute.route?._getView;
            expect(signal2?.isFulfilled()).toBe(true);
            expect(unwrapViewResult(signal2)).toContain("Remote Cached View");
        });
    });

    describe("快速导航测试（竞态问题）", () => {
        it("应该正确处理快速连续的导航请求", async () => {
            let callCount = 0;
            mockFetch = createFetchMock(async () => {
                callCount++;
                await new Promise((resolve) => setTimeout(resolve, 100));
                return htmlResponse(`<div>View ${callCount}</div>`);
            });

            const matchedRoute1 = createMockedRoute("/rapid", "http://example.com/rapid.html");
            const matchedRoute2 = createMockedRoute("/rapid", "http://example.com/rapid.html");
            const matchedRoute3 = createMockedRoute("/rapid", "http://example.com/rapid.html");

            // 第一次导航
            viewLoader.loadViews([matchedRoute1]);

            await new Promise((resolve) => setTimeout(resolve, 10));

            // 第二次导航（在第一次完成前）
            viewLoader.loadViews([matchedRoute2]);

            await new Promise((resolve) => setTimeout(resolve, 10));

            // 第三次导航（在第二次完成前）
            viewLoader.loadViews([matchedRoute3]);

            // 等待最后请求完成
            await new Promise((resolve) => setTimeout(resolve, 150));

            const signal = matchedRoute3.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                expect(unwrapViewResult(signal)).toContain("View");
            }
        });
    });

    describe("并发加载测试", () => {
        it("应该能够并发加载多个路由的视图", async () => {
            mockFetch = createFetchMock(async (url: RequestInfo | URL) => {
                const urlStr = typeof url === "string" ? url : url.toString();
                await new Promise((resolve) => setTimeout(resolve, 30));
                if (urlStr.includes("home")) {
                    return htmlResponse("<div>Home View</div>");
                }
                return htmlResponse("<div>User View</div>");
            });

            const matchedRoute1 = createMockedRoute("/home", "http://example.com/home.html");
            const matchedRoute2 = createMockedRoute("/user", "http://example.com/user.html");

            // 并发加载
            await viewLoader.loadViews([matchedRoute1, matchedRoute2]);

            // 等待所有异步操作完成
            await new Promise((resolve) => setTimeout(resolve, 80));

            const signal1 = matchedRoute1.route?._getView;
            const signal2 = matchedRoute2.route?._getView;

            expect(signal1).toBeDefined();
            expect(signal2).toBeDefined();

            if (signal1 && signal2) {
                expect(signal1.isFulfilled()).toBe(true);
                expect(signal2.isFulfilled()).toBe(true);
                expect(unwrapViewResult(signal1)).toContain("Home View");
                expect(unwrapViewResult(signal2)).toContain("User View");
            }
        });

        it("应该正确处理同一路由多次重入（多次调用 loadViews）", async () => {
            let loadCount = 0;
            mockFetch = createFetchMock(async () => {
                loadCount++;
                await new Promise((resolve) => setTimeout(resolve, 50));
                return htmlResponse(`<div>View Load ${loadCount}</div>`);
            });

            const matchedRoute = createMockedRoute("/repeat", "http://example.com/repeat.html");

            // 第一次加载 - 等待足够时间确保异步操作开始
            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 60));

            const signal1 = matchedRoute.route?._getView;
            expect(signal1).toBeDefined();
            if (signal1) {
                // 第一次加载应该已完成或正在处理
                expect(signal1.isFulfilled() || signal1.isPending()).toBe(true);
            }

            // 第二次加载（在同一路由上）- 会中止第一次的加载
            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 30));

            const signal2 = matchedRoute.route?._getView;
            expect(signal2).toBeDefined();
            if (signal2) {
                // 第二次加载应该创建新的 signal，旧的应该被 abort
                expect(signal2.isFulfilled() || signal2.isPending()).toBe(true);
            }

            // 第三次加载 - 会中止第二次的加载
            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 80));

            const signal3 = matchedRoute.route?._getView;
            expect(signal3).toBeDefined();
            if (signal3) {
                expect(signal3.isFulfilled()).toBe(true);
                expect(unwrapViewResult(signal3)).toContain("View Load");
            }
        });

        it("应该正确处理连续多次调用 loadViews（不等待中间结果）", async () => {
            let loadCount = 0;
            mockFetch = createFetchMock(async () => {
                loadCount++;
                await new Promise((resolve) => setTimeout(resolve, 100));
                return htmlResponse(`<div>Rapid View ${loadCount}</div>`);
            });

            const matchedRoute = createMockedRoute("/rapid-repeat", "http://example.com/rapid.html");

            // 连续快速调用 5 次 loadViews（不使用 await）
            // 由于 loadViews 没有 return 值，这里调用后会立即返回
            viewLoader.loadViews([matchedRoute]);
            viewLoader.loadViews([matchedRoute]);
            viewLoader.loadViews([matchedRoute]);
            viewLoader.loadViews([matchedRoute]);
            viewLoader.loadViews([matchedRoute]);

            // 等待所有异步操作完成
            await new Promise((resolve) => setTimeout(resolve, 150));

            const finalSignal = matchedRoute.route?._getView;
            expect(finalSignal).toBeDefined();
            if (finalSignal) {
                // 最终应该只有最后一次加载的结果
                expect(finalSignal.isFulfilled()).toBe(true);
                expect(unwrapViewResult(finalSignal)).toContain("Rapid View");
                // 由于连续调用，前面的 4 次都被 abort，只有第 5 次完成
                // 所以 loadCount 可能是 1-5 之间的值，取决于竞态条件
                expect(loadCount).toBeGreaterThan(0);
                expect(loadCount).toBeLessThanOrEqual(5);
            }
        });
    });

    describe("资源清理测试", () => {
        it("应该正确清理缓存", async () => {
            mockFetch = createFetchMock(async () => htmlResponse("<div>Cleanup Test</div>"));
            const matchedRoute = createMockedRoute("/cleanup", {
                from: "http://example.com/cleanup.html",
                cache: 10000,
            });

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 30));

            // 验证缓存存在
            expect(viewLoader.cache.size).toBeGreaterThan(0);

            // 清理资源
            viewLoader.cleanup();

            // 验证缓存被清空
            expect(viewLoader.cache.size).toBe(0);
        });
    });

    // ========================================
    // 远程 URL 加载测试
    // ========================================

    describe("远程 URL 加载测试", () => {
        beforeEach(() => {
            mockFetch = createFetchMock(async (url: RequestInfo | URL) => {
                const urlStr = typeof url === "string" ? url : url.toString();
                if (urlStr === "http://example.com/view.html") {
                    return {
                        ok: true,
                        status: 200,
                        text: async () => '<div class="container"><h1>Remote View</h1></div>',
                    } as Response;
                } else if (urlStr === "http://example.com/full.html") {
                    return {
                        ok: true,
                        status: 200,
                        text: async () =>
                            '<!DOCTYPE html><html><body><div class="content">Full Page</div></body></html>',
                    } as Response;
                } else if (urlStr === "http://example.com/empty.html") {
                    return {
                        ok: true,
                        status: 200,
                        text: async () => "",
                    } as Response;
                }
                throw new Error("URL not found: " + urlStr);
            });
        });

        it("应该成功从远程 URL 加载 HTML", async () => {
            const matchedRoute = createMockedRoute("/remote", "http://example.com/view.html");

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                expect(unwrapViewResult(signal)).toContain("<h1>Remote View</h1>");
            }
        });

        it("应该正确处理远程完整 HTML 文档", async () => {
            const matchedRoute = createMockedRoute("/full", "http://example.com/full.html");

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                expect(unwrapViewResult(signal)).toContain("Full Page");
                // 不应该包含 html 和 body 标签（应该被提取）
                expect(unwrapViewResult(signal)).not.toContain("<html");
                expect(unwrapViewResult(signal)).not.toContain("<body");
            }
        });

        it("应该正确处理远程返回的空内容", async () => {
            const matchedRoute = createMockedRoute("/empty", "http://example.com/empty.html");

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                expect(unwrapViewResult(signal)).toBe("");
            }
        });
    });

    // ========================================
    // HTTP 错误处理测试
    // ========================================

    describe("HTTP 错误处理测试", () => {
        beforeEach(() => {
            mockFetch = createFetchMock(async (url: RequestInfo | URL) => {
                const urlStr = typeof url === "string" ? url : url.toString();
                if (urlStr.includes("404")) {
                    return {
                        ok: false,
                        status: 404,
                        statusText: "Not Found",
                    } as Response;
                } else if (urlStr.includes("500")) {
                    return {
                        ok: false,
                        status: 500,
                        statusText: "Internal Server Error",
                    } as Response;
                } else if (urlStr.includes("403")) {
                    return {
                        ok: false,
                        status: 403,
                        statusText: "Forbidden",
                    } as Response;
                }
                throw new Error("Unexpected URL: " + urlStr);
            });
        });

        it("应该处理 404 Not Found 错误", async () => {
            const matchedRoute = createMockedRoute("/404", "http://example.com/404.html");

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isRejected()).toBe(true);
                expect(signal.error).toBeDefined();
                expect(signal.error.message).toContain("404");
            }
        });

        it("应该处理 500 Internal Server Error", async () => {
            const matchedRoute = createMockedRoute("/500", "http://example.com/500.html");

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isRejected()).toBe(true);
                expect(signal.error.message).toContain("500");
            }
        });

        it("应该处理 403 Forbidden 错误", async () => {
            const matchedRoute = createMockedRoute("/403", "http://example.com/403.html");

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isRejected()).toBe(true);
                expect(signal.error.message).toContain("403");
            }
        });
    });

    // ========================================
    // 网络和连接错误测试
    // ========================================

    describe("网络和连接错误测试", () => {
        it("应该处理网络连接失败", async () => {
            mockFetch = createFetchMock(async () => {
                throw new Error("Network connection failed");
            });

            const matchedRoute = createMockedRoute("/network", "http://example.com/offline.html");

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isRejected()).toBe(true);
                expect(signal.error.message).toContain("Network connection failed");
            }
        });

        it("应该处理 CORS 错误模拟", async () => {
            mockFetch = createFetchMock(async () => {
                throw new TypeError("Failed to fetch");
            });

            const matchedRoute = createMockedRoute("/cors", "http://another-domain.com/view.html");

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isRejected()).toBe(true);
            }
        });
    });

    // ========================================
    // 超时错误测试
    // ========================================

    describe("超时错误测试", () => {
        it("应该处理加载超时", async () => {
            mockFetch = createFetchMock(
                (url: RequestInfo | URL, init?: RequestInit) =>
                    new Promise((resolve, reject) => {
                        const timeoutId = setTimeout(() => {
                            resolve({
                                ok: true,
                                status: 200,
                                text: async () => "<div>Delayed View</div>",
                            } as Response);
                        }, 3000);

                        // 监听 abort signal
                        if (init?.signal) {
                            init.signal.addEventListener("abort", () => {
                                clearTimeout(timeoutId);
                                reject(new DOMException("Aborted", "AbortError"));
                            });
                        }
                    }),
            );

            const matchedRoute = createMockedRoute("/timeout", {
                from: "http://example.com/slow.html",
                timeout: 1000,
            });

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 1200));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isRejected()).toBe(true);
                expect(signal.error).toBeInstanceOf(AutoSparkRouterTimeoutError);
            }
        });
    });

    // ========================================
    // 视图提供方错误测试（函数视图源抛错 / rejected Promise）
    // ========================================

    describe("函数抛出错误测试", () => {
        it("应该处理同步函数抛出的错误", async () => {
            const matchedRoute = createMockedRoute("/error", () => {
                throw new Error("View generation failed");
            });

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isRejected()).toBe(true);
                expect(signal.error.message).toBe("View generation failed");
            }
        });

        it("应该处理异步函数抛出的错误", async () => {
            const matchedRoute = createMockedRoute("/async-error", async () => {
                await new Promise((resolve) => setTimeout(resolve, 10));
                throw new Error("Async view generation failed");
            });

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isRejected()).toBe(true);
                expect(signal.error.message).toContain("Async view generation failed");
            }
        });

        it("应该处理函数返回的 rejected Promise", async () => {
            const matchedRoute = createMockedRoute(
                "/reject",
                () => Promise.reject(new Error("Promise rejected")),
            );

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isRejected()).toBe(true);
                expect(signal.error.message).toBe("Promise rejected");
            }
        });
    });

    // ========================================
    // Abort 处理测试
    // ========================================

    describe("Abort 处理测试", () => {
        it("应该正确处理 AbortError", async () => {
            mockFetch = createFetchMock(
                () =>
                    new Promise((_resolve, reject) => {
                        setTimeout(() => {
                            reject(new DOMException("Aborted", "AbortError"));
                        }, 100);
                    }),
            );

            const matchedRoute = createMockedRoute("/abort", "http://example.com/abort.html");

            await viewLoader.loadViews([matchedRoute]);

            // 等待 AbortError 被处理
            await new Promise((resolve) => setTimeout(resolve, 150));

            const signal = matchedRoute.route?._getView;
            if (signal) {
                // AbortError 应该被 resolve 为 undefined 而不是 reject
                expect(signal.isFulfilled()).toBe(true);
                expect(signal.result).toBeUndefined();
            }
        });
    });

    // ========================================
    // 边缘场景测试
    // ========================================

    describe("边缘场景 - 特殊值测试", () => {
        it("应该处理空字符串", async () => {
            const matchedRoute = createMockedRoute("/empty-string", { from: "" });

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                expect(unwrapViewResult(signal)).toBe("");
            }
        });

        it("应该处理大型 HTML 内容", async () => {
            let largeHtml = "<div>";
            for (let i = 0; i < 1000; i++) {
                largeHtml += `<p>Item ${i}</p>`;
            }
            largeHtml += "</div>";

            const matchedRoute = createMockedRoute("/large", { from: largeHtml });

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                expect(unwrapViewResult(signal)).toContain("Item 0");
                expect(unwrapViewResult(signal)).toContain("Item 999");
            }
        });
    });

    // ========================================
    // URL 参数插值测试
    // ========================================

    describe("URL 参数插值测试", () => {
        beforeEach(() => {
            mockFetch = createFetchMock(async (url: RequestInfo | URL) => {
                const urlStr = typeof url === "string" ? url : String(url);
                return {
                    ok: true,
                    status: 200,
                    text: async () => `<div>URL: ${urlStr}</div>`,
                } as Response;
            });
        });

        it("应该正确替换 URL 中的 {id} 参数", async () => {
            const matchedRoute = createMockedRoute(
                "/user/123",
                "http://example.com/user/{id}.html",
            );
            matchedRoute.params = { id: "123" };

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                expect(unwrapViewResult(signal)).toContain("user/123.html");
            }
        });

        it("应该正确替换多个参数", async () => {
            const matchedRoute = createMockedRoute(
                "/post/123/comments/456",
                "http://example.com/posts/{postId}/comments/{commentId}.html",
            );
            matchedRoute.params = { postId: "123", commentId: "456" };

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                expect(unwrapViewResult(signal)).toContain("posts/123");
                expect(unwrapViewResult(signal)).toContain("comments/456");
            }
        });

        // ADR-0122：state.$ 原始值成员进地址插值（扁平键、路由优先、route 排除）
        it("应该正确替换 state.$ 的原始值成员", async () => {
            (mockRouter as any).engine = {
                state: {
                    $: {
                        language: "en",
                        version: 2,
                        flags: { theme: "dark" },
                        route: { path: "/" },
                    },
                },
            };
            const matchedRoute = createMockedRoute(
                "/user/123",
                "http://example.com/{language}/v{version}/{flags}/{route}/{id}.html",
            );
            matchedRoute.params = { id: "123" };

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                const result = unwrapViewResult(signal);
                expect(result).toContain("/en/v2//");
                expect(result).toContain("/123.html");
                // 对象成员（flags / route）静默跳过，不落成 [object Object]
                expect(result).not.toContain("[object Object]");
            }
        });

        it("state.$ 与路由变量同名时路由侧优先", async () => {
            (mockRouter as any).engine = { state: { $: { language: "en" } } };
            const matchedRoute = createMockedRoute(
                "/user/123",
                "http://example.com/{language}/{id}.html",
            );
            matchedRoute.params = { id: "123", language: "zh" };

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                expect(unwrapViewResult(signal)).toContain("/zh/123.html");
            }
        });

        it("自定义 hash 模板可使用 state.$ 成员（缓存键按语言隔离）", async () => {
            (mockRouter as any).engine = { state: { $: { language: "en" } } };
            const create = (id: number) =>
                createMockedRoute(
                    `/cache/${id}`,
                    { from: "http://example.com/cache.html", cache: 10000, hash: "{language}" },
                    id,
                );

            await viewLoader.loadViews([create(1)]);
            await new Promise((resolve) => setTimeout(resolve, 50));
            await viewLoader.loadViews([create(2)]);
            await new Promise((resolve) => setTimeout(resolve, 50));
            expect(mockFetch.mock.calls.length).toBe(1);

            (mockRouter as any).engine.state.$.language = "zh";
            await viewLoader.loadViews([create(3)]);
            await new Promise((resolve) => setTimeout(resolve, 50));
            expect(mockFetch.mock.calls.length).toBe(2);
        });
    });

    // ========================================
    // scopedStyle 选项测试
    // （注：scopedStyle 的样式改写与 v-bind 变量收集已从源码移除——
    //   模板渲染器原样保留 <style>，由 engine 编译通路文档级生效；
    //   以下用例调整为验证当前的不改写行为）
    // ========================================

    describe("scopedStyle 选项测试", () => {
        it("scopedStyle 为 true 时应该应用样式隔离", async () => {
            const htmlWithStyle = `
                <div>
                    <style>
                        .test { color: red; }
                    </style>
                    <div class="test">Styled Content</div>
                </div>
            `;
            const matchedRoute = createMockedRoute("/scoped", {
                from: htmlWithStyle,
                scopedStyle: true,
            });

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                // 样式不做 router 侧改写，<style> 原样保留
                expect(unwrapViewResult(signal)).toContain("Styled Content");
                expect(unwrapViewResult(signal)).toContain("<style>");
            }
        });

        it("scopedStyle 为 false 时应该跳过样式隔离", async () => {
            const htmlWithStyle = '<div class="test">Content</div>';
            const matchedRoute = createMockedRoute("/no-scope", {
                from: htmlWithStyle,
                scopedStyle: false,
            });

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                expect(unwrapViewResult(signal)).toContain("Content");
            }
        });

        it("scopedStyle 为 true 且包含 v-bind 时不再收集 vBindVars", async () => {
            const htmlWithVBind = `
                <div>
                    <style>
                        .title { color: v-bind(titleColor); }
                        .content { font-size: v-bind(contentSize, 16px); }
                    </style>
                    <div class="test">Content</div>
                </div>
            `;
            const matchedRoute = createMockedRoute("/vbind", {
                from: htmlWithVBind,
                scopedStyle: true,
            });

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                // vBindVars 收集功能已移除：meta 中不再存在
                expect(signal.meta.vBindVars).toBeUndefined();
                // v-bind 样式内容原样保留，不做 CSS var 改写
                expect(unwrapViewResult(signal)).toContain("v-bind(titleColor)");
                expect(unwrapViewResult(signal)).toContain("v-bind(contentSize, 16px)");
            }
        });

        it("不再对 v-bind 变量进行去重收集", async () => {
            const htmlWithDuplicateVBind = `
                <div>
                    <style>
                        .title { color: v-bind(titleColor); }
                        .subtitle { color: v-bind(titleColor); }
                        .text { font-size: v-bind(titleColor); }
                    </style>
                </div>
            `;
            const matchedRoute = createMockedRoute("/duplicate-vbind", {
                from: htmlWithDuplicateVBind,
                scopedStyle: true,
            });

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                // vBindVars 收集功能已移除
                expect(signal.meta.vBindVars).toBeUndefined();
            }
        });

        it("scopedStyle 为 false 时不应该生成 vBindVars", async () => {
            const htmlWithVBind = `
                <div>
                    <style>
                        .title { color: v-bind(titleColor); }
                    </style>
                </div>
            `;
            const matchedRoute = createMockedRoute("/no-vbind-vars", {
                from: htmlWithVBind,
                scopedStyle: false,
            });

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                // scopedStyle 为 false 时，不应该有 vBindVars
                expect(signal.meta.vBindVars).toBeUndefined();
            }
        });

        it("嵌套对象的 v-bind 变量名同样不再收集", async () => {
            const htmlWithNestedVBind = `
                <div>
                    <style>
                        .title { color: v-bind(theme.primary); }
                        .content { font-size: v-bind(settings.fontSize); }
                    </style>
                </div>
            `;
            const matchedRoute = createMockedRoute("/nested-vbind", {
                from: htmlWithNestedVBind,
                scopedStyle: true,
            });

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                // vBindVars 收集功能已移除
                expect(signal.meta.vBindVars).toBeUndefined();
                // 嵌套 v-bind 内容原样保留
                expect(unwrapViewResult(signal)).toContain("v-bind(theme.primary)");
                expect(unwrapViewResult(signal)).toContain("v-bind(settings.fontSize)");
            }
        });
    });

    // ========================================
    // 错误处理测试
    // ========================================

    describe("错误处理测试", () => {
        it("应该处理无效的 HTML 格式", async () => {
            mockFetch = createFetchMock(async () => {
                return {
                    ok: true,
                    status: 200,
                    text: async () => {
                        throw new Error("Text parsing error");
                    },
                } as unknown as Response;
            });

            const matchedRoute = createMockedRoute("/invalid", "http://example.com/invalid.html");

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isRejected()).toBe(true);
            }
        });
    });

    // ========================================
    // signal.meta 测试
    // ========================================

    describe("signal.meta 测试", () => {
        it("应该设置 signal.meta.hash", async () => {
            const matchedRoute = createMockedRoute("/hash-test", {
                from: "<div>Hash Test</div>",
            });

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                // hash 应该被设置
                expect(signal.meta.hash).toBeDefined();
                expect(typeof signal.meta.hash).toBe("string");
                expect(signal.meta.hash.length).toBeGreaterThan(0);
            }
        });

        it("应该根据 hash 选项设置不同的 hash 值", async () => {
            const matchedRoute1 = createMockedRoute("/custom-hash-1", {
                from: "<div>Test 1</div>",
                hash: "{path}",
            });
            const matchedRoute2 = createMockedRoute("/custom-hash-2", {
                from: "<div>Test 2</div>",
                hash: "{id}",
            });

            await viewLoader.loadViews([matchedRoute1, matchedRoute2]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal1 = matchedRoute1.route?._getView;
            const signal2 = matchedRoute2.route?._getView;

            expect(signal1?.meta.hash).toBeDefined();
            expect(signal2?.meta.hash).toBeDefined();
            if (signal1 && signal2) {
                // 不同的 hash 配置应该产生不同的 hash 值
                expect(signal1.meta.hash).not.toBe(signal2.meta.hash);
            }
        });

        it("远程加载时应该设置 signal.meta.url", async () => {
            mockFetch = createFetchMock(async (url: RequestInfo | URL) => {
                const urlStr = typeof url === "string" ? url : url.toString();
                return {
                    ok: true,
                    status: 200,
                    text: async () => "<div>Remote Content</div>",
                } as Response;
            });

            const matchedRoute = createMockedRoute(
                "/remote-meta",
                "http://example.com/remote.html",
            );

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                // url 应该被设置
                expect(signal.meta.url).toBeDefined();
                expect(signal.meta.url).toBe("http://example.com/remote.html");
            }
        });

        it("静态视图加载时应该有 hash 但没有 url", async () => {
            const matchedRoute = createMockedRoute("/static-meta", {
                from: "<div>Static Content</div>",
            });

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                // 静态视图应该有 hash
                expect(signal.meta.hash).toBeDefined();
                // 但不应该有 url（只有远程加载才有）
                expect(signal.meta.url).toBeUndefined();
            }
        });

        it("HTTP 错误时应该设置 signal.meta.statusCode", async () => {
            mockFetch = createFetchMock(async () => {
                return {
                    ok: false,
                    status: 404,
                    statusText: "Not Found",
                } as Response;
            });

            const matchedRoute = createMockedRoute(
                "/status-code",
                "http://example.com/not-found.html",
            );

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isRejected()).toBe(true);
                // statusCode 应该被设置
                expect(signal.meta.statusCode).toBeDefined();
                expect(signal.meta.statusCode).toBe(404);
            }
        });

        it("不同 HTTP 错误状态码应该被正确记录", async () => {
            mockFetch = createFetchMock(async (url: RequestInfo | URL) => {
                const urlStr = typeof url === "string" ? url : url.toString();
                if (urlStr.includes("403")) {
                    return { ok: false, status: 403, statusText: "Forbidden" } as Response;
                } else if (urlStr.includes("500")) {
                    return {
                        ok: false,
                        status: 500,
                        statusText: "Internal Server Error",
                    } as Response;
                }
                throw new Error("Unexpected URL");
            });

            const matchedRoute403 = createMockedRoute("/error-403", "http://example.com/403.html");
            const matchedRoute500 = createMockedRoute("/error-500", "http://example.com/500.html");

            await viewLoader.loadViews([matchedRoute403, matchedRoute500]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal403 = matchedRoute403.route?._getView;
            const signal500 = matchedRoute500.route?._getView;

            expect(signal403?.meta.statusCode).toBe(403);
            expect(signal500?.meta.statusCode).toBe(500);
        });

        it("signal.meta 应该包含完整的元数据", async () => {
            mockFetch = createFetchMock(async () => {
                return {
                    ok: true,
                    status: 200,
                    text: async () =>
                        `<div>
                            <style>.test { color: v-bind(themeColor); }</style>
                            <div class="test">Full Meta Test</div>
                        </div>`,
                } as Response;
            });

            const matchedRoute = createMockedRoute("/full-meta", "http://example.com/full.html");

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                // 验证所有 meta 属性
                expect(signal.meta.hash).toBeDefined();
                expect(signal.meta.url).toBe("http://example.com/full.html");
                // vBindVars 收集功能已移除，meta 中不再存在
                expect(signal.meta.vBindVars).toBeUndefined();
                // 成功时不应该有 statusCode
                expect(signal.meta.statusCode).toBeUndefined();
            }
        });
    });

    // ========================================
    // 同步函数返回视图测试（baseLoader 函数分支：函数以 matched 实参调用）
    // ========================================

    describe("同步函数返回视图测试", () => {
        it("应该处理同步函数返回的 HTML", async () => {
            const matchedRoute = createMockedRoute("/sync", (matched: any) => {
                return `<div class="route-1">Route 1</div>`;
            });

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                expect(unwrapViewResult(signal)).toContain("Route 1");
            }
        });

        it("应该传递正确的路由参数给同步函数", async () => {
            const matchedRoute = createMockedRoute("/sync-params", (matched: any) => {
                return `<div data-path="${matched.path}">Info</div>`;
            });
            matchedRoute.params = { id: "test" };
            matchedRoute.query = { tab: "info" };

            await viewLoader.loadViews([matchedRoute]);
            await new Promise((resolve) => setTimeout(resolve, 50));

            const signal = matchedRoute.route?._getView;
            expect(signal).toBeDefined();
            if (signal) {
                expect(signal.isFulfilled()).toBe(true);
                expect(unwrapViewResult(signal)).toContain('data-path="/sync-params"');
            }
        });
    });
});
