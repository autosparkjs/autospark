/**
 * 渲染器机制专项测试（ADR-0008 及其修订）
 *
 * 覆盖：`!` raw 前缀工具、内置渲染器（Template/Raw/Json/Image）的 test()/render()、
 * 渲染器选择链（`!` 前缀 > 显式 renderer > 自定义 renderers > 模板兜底）、
 * 两级渲染降级链（失败 → 模板 → raw）、前缀剥除、outlet 模板 raw 通道。
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, spyOn } from "bun:test";
import type { AutoSparkRouter } from "../router";
import type { AutoSparkMatchedRouteItem } from "../types/routes";

import { setupTestEnvironment } from "./test-setup";
import { OUTLET_COMPONENT_CODE } from "../engine/outletComponent";
import { hasRawPrefix, stripRawPrefix, getDeclaredViewUrl } from "@/utils/rawPrefix";
import { AutoSparkTemplateViewRenderer } from "@/renderers/template";
import { AutoSparkRawViewRenderer } from "@/renderers/raw";
import { AutoSparkJsonViewRenderer } from "@/renderers/json";
import { AutoSparkImageViewRenderer } from "@/renderers/image";
import { AutoSparkRouterViewRendererBase } from "@/renderers/base";
import type { ViewRenderOptions } from "@/renderers/types";

setupTestEnvironment();

// test-setup 注册的 linkedom DOMParser 在 happy-dom 文档下解析结果为空 body；
// 模板渲染器（renderers/template）的 HTML 提取须换用同一 window 的 DOMParser（用毕还原）
const win = (globalThis as any).window;
const originalDOMParser = (globalThis as any).DOMParser;
beforeAll(() => {
    (globalThis as any).DOMParser = win.DOMParser;
});
afterAll(() => {
    (globalThis as any).DOMParser = originalDOMParser;
});

// 动态导入 ViewLoader，确保在 setupTestEnvironment 之后加载
let ViewLoader: any;
beforeEach(async () => {
    if (!ViewLoader) {
        const module = await import("../features/viewLoader");
        ViewLoader = module.ViewLoader;
    }
});

const mockLogger = {
    debug: () => {},
    error: () => {},
    info: () => {},
    warn: () => {},
};

/** 构造 fetch mock 兼容的 Response 形状（含 clone，供降级链重读） */
function createResponse(body: string, url = "http://example.com/view.html"): Response {
    const make = () => ({
        ok: true,
        status: 200,
        url,
        text: async () => body,
        clone: () => make(),
    });
    return make() as unknown as Response;
}

function createMatchedRoute(path: string, view: any, id: number = 1): AutoSparkMatchedRouteItem {
    return {
        route: {
            name: "test",
            path,
            view,
        },
        params: {},
        query: {},
        state: {},
        path,
        url: path,
        hash: `hash_${path}_${id}`,
        id,
    } as unknown as AutoSparkMatchedRouteItem;
}

function createMockRouter(extraOptions: Record<string, any> = {}): Partial<AutoSparkRouter> {
    return {
        debug: false,
        logger: mockLogger,
        routes: {
            current: {
                route: null,
                params: {},
                query: {},
                matchedRoutes: [],
            },
        },
        options: {
            base: "/",
            viewOptions: { timeout: 5000, cache: 0 },
            ...extraOptions,
        },
    } as unknown as Partial<AutoSparkRouter>;
}

/** 取加载完成后路由上的视图 signal 结果（测试断言用，规避类型面） */
function viewResult(matched: AutoSparkMatchedRouteItem): any {
    return ((matched.route as any)?._getView?.result ?? {}) as any;
}

describe("raw 前缀工具（ADR-0008 修订）", () => {
    it("`!` 前缀判定为强制 raw", () => {
        expect(hasRawPrefix("!/a.html")).toBe(true);
        expect(hasRawPrefix("!http://example.com/a.html?count=1")).toBe(true);
        expect(hasRawPrefix("/a.html")).toBe(false);
        expect(hasRawPrefix("")).toBe(false);
    });

    it("stripRawPrefix 仅剥除前导 `!`，业务 query 保留", () => {
        expect(stripRawPrefix("!/a.html")).toBe("/a.html");
        expect(stripRawPrefix("!/a.html?count=1")).toBe("/a.html?count=1");
        expect(stripRawPrefix("/a.html")).toBe("/a.html");
        expect(stripRawPrefix("!!/a")).toBe("!/a");
    });

    it("getDeclaredViewUrl 取声明的视图源字符串（含前缀形态）", () => {
        expect(getDeclaredViewUrl(createMatchedRoute("/a", "!/x/a.html"))).toBe("!/x/a.html");
        expect(getDeclaredViewUrl(createMatchedRoute("/a", { from: "!/x/a.html" }))).toBe(
            "!/x/a.html",
        );
        const fnRoute = createMatchedRoute("/a", () => "<div></div>");
        expect(getDeclaredViewUrl(fnRoute)).toBeUndefined();
    });
});

describe("内置渲染器（ADR-0008 及其修订）", () => {
    const router = createMockRouter() as AutoSparkRouter;

    it("Template：test 恒真，render 提取 body 内容", async () => {
        const renderer = new AutoSparkTemplateViewRenderer(router);
        expect(renderer.test(createResponse(""), createMatchedRoute("/a", "/x/a.html"))).toBe(true);
        const result = await renderer.render(
            createResponse("<body><div class='c'>Hi</div></body>"),
            createMatchedRoute("/a", "/x/a.html"),
            { hash: "h" } as ViewRenderOptions,
        );
        expect(result.value).toContain("Hi");
        expect(result.error).toBeFalsy();
    });

    it("Raw：声明 URL 带 `!` 前缀才 test 通过；render 原样透传并带 meta.raw", async () => {
        const renderer = new AutoSparkRawViewRenderer(router);
        expect(renderer.test(null as any, createMatchedRoute("/a", "!/x/a.html"))).toBe(true);
        expect(renderer.test(null as any, createMatchedRoute("/a", "/x/a.html"))).toBe(false);
        const result = await renderer.render(
            createResponse("<div><h1>原文</h1></div>"),
            createMatchedRoute("/a", "!/x/a.html"),
            { hash: "h" } as ViewRenderOptions,
        );
        expect(result.value).toBe("<div><h1>原文</h1></div>");
        expect(result.meta?.raw).toBe(true);
    });

    it("Json：.json 扩展名 test；render pretty-print + 转义；解析失败返回 error", async () => {
        const renderer = new AutoSparkJsonViewRenderer(router);
        expect(renderer.test(null as any, createMatchedRoute("/a", "/x/data.json"))).toBe(true);
        expect(renderer.test(null as any, createMatchedRoute("/a", "/x/data.json?count=1"))).toBe(
            true,
        );
        expect(renderer.test(null as any, createMatchedRoute("/a", "/x/a.html"))).toBe(false);

        const ok = await renderer.render(
            createResponse('{"b":1,"a":"<x>"}'),
            createMatchedRoute("/a", "/x/data.json"),
            { hash: "h" } as ViewRenderOptions,
        );
        expect(ok.value).toContain('<pre class="autospark-json-view">');
        expect(ok.value).toContain("&lt;x&gt;");
        expect(ok.value.indexOf('"b"')).toBeLessThan(ok.value.indexOf('"a"'));

        const bad = await renderer.render(
            createResponse("not json{"),
            createMatchedRoute("/a", "/x/data.json"),
            { hash: "h" } as ViewRenderOptions,
        );
        expect(bad.error).toBeTruthy();
    });

    it("Image：图片扩展名 test；render 产出 img 标签（src 取最终 URL 并转义）", async () => {
        const renderer = new AutoSparkImageViewRenderer(router);
        expect(renderer.test(null as any, createMatchedRoute("/a", "/x/pic.PNG"))).toBe(true);
        expect(renderer.test(null as any, createMatchedRoute("/a", "/x/pic.svg"))).toBe(true);
        expect(renderer.test(null as any, createMatchedRoute("/a", "/x/pic.png.html"))).toBe(false);

        const result = await renderer.render(
            createResponse("BINARY", "http://example.com/x/a.png"),
            createMatchedRoute("/a", "/x/a.png"),
            { hash: "h", url: "http://example.com/x/a.png?a=1&b=2" } as ViewRenderOptions,
        );
        expect(result.value).toBe(
            '<img class="autospark-image-view" src="http://example.com/x/a.png?a=1&amp;b=2" alt="">',
        );
    });
});

describe("渲染器选择链（ADR-0008 修订）", () => {
    let mockFetch: any;
    let viewLoader: any;

    const loadOnce = async (view: any, extraOptions: Record<string, any> = {}) => {
        viewLoader = new ViewLoader(createMockRouter(extraOptions) as AutoSparkRouter);
        const matched = createMatchedRoute("/r", view);
        await viewLoader.loadViews([matched]);
        await new Promise((resolve) => setTimeout(resolve, 30));
        return matched;
    };

    afterEach(() => {
        viewLoader?.cleanup?.();
        if (mockFetch) {
            mockFetch.mockRestore();
            mockFetch = undefined;
        }
    });

    it("`!` 前缀：fetch 剥除前缀（保留业务 query），内容原样输出且 meta.raw = true", async () => {
        const calledUrls: string[] = [];
        mockFetch = spyOn(globalThis, "fetch").mockImplementation(
            (async (url: any) => {
                calledUrls.push(String(url));
                return createResponse("<div>x-outlet-raw-content <h1>keep</h1></div>");
            }) as any,
        );
        const matched = await loadOnce("!http://example.com/page.html?count=1");
        expect(calledUrls).toEqual(["http://example.com/page.html?count=1"]);
        const signal = (matched.route as any)._getView;
        expect(signal.isFulfilled()).toBe(true);
        expect(signal.result.value).toContain("x-outlet-raw-content");
        expect(signal.result.meta?.raw).toBe(true);
    });

    it("`!` 前缀优先级最高：压过路由级显式 renderer 与自定义 renderers", async () => {
        mockFetch = spyOn(globalThis, "fetch").mockImplementation(
            (async () => createResponse("<div>raw-wins</div>")) as any,
        );
        class CustomRenderer extends AutoSparkRouterViewRendererBase {
            test() {
                return true;
            }
            render() {
                return Promise.resolve({ value: "custom-rendered" });
            }
        }
        const explicit = new AutoSparkTemplateViewRenderer(createMockRouter() as AutoSparkRouter);
        const matched = await loadOnce(
            { from: "!http://example.com/page.html", renderer: explicit },
            { renderers: [new CustomRenderer(createMockRouter() as AutoSparkRouter)] },
        );
        const signal = (matched.route as any)._getView;
        expect(signal.result.value).toBe("<div>raw-wins</div>");
        expect(signal.result.meta?.raw).toBe(true);
    });

    it("路由级显式 renderer 优先于自定义 renderers 与模板兜底", async () => {
        mockFetch = spyOn(globalThis, "fetch").mockImplementation(
            (async () => createResponse("<div>explicit</div>")) as any,
        );
        class CustomRenderer extends AutoSparkRouterViewRendererBase {
            test() {
                return true;
            }
            render() {
                return Promise.resolve({ value: "custom-rendered" });
            }
        }
        const explicit = new AutoSparkRawViewRenderer(createMockRouter() as AutoSparkRouter);
        const matched = await loadOnce(
            { from: "http://example.com/page.html", renderer: explicit },
            { renderers: [new CustomRenderer(createMockRouter() as AutoSparkRouter)] },
        );
        const signal = (matched.route as any)._getView;
        expect(signal.result.value).toBe("<div>explicit</div>");
        expect(signal.result.meta?.raw).toBe(true);
    });

    it("自定义 renderers（test 探测）优先于模板兜底", async () => {
        mockFetch = spyOn(globalThis, "fetch").mockImplementation(
            (async () => createResponse("<div>custom</div>")) as any,
        );
        class CustomRenderer extends AutoSparkRouterViewRendererBase {
            test() {
                return true;
            }
            render() {
                return Promise.resolve({ value: "custom-rendered" });
            }
        }
        const matched = await loadOnce("http://example.com/data.json", {
            renderers: [new CustomRenderer(createMockRouter() as AutoSparkRouter)],
        });
        expect(viewResult(matched).value).toBe("custom-rendered");
    });

    it("Json / Image 渲染器：显式注册后按 test() 探测生效（无自动格式判定）", async () => {
        mockFetch = spyOn(globalThis, "fetch").mockImplementation(
            (async (url: any) => {
                const u = String(url);
                if (u.endsWith(".json")) return createResponse('{"ok":true}');
                if (u.endsWith(".png")) return createResponse("BIN");
                return createResponse("<div><p>tpl</p></div>");
            }) as any,
        );
        const extra = {
            renderers: [
                new AutoSparkJsonViewRenderer(createMockRouter() as AutoSparkRouter),
                new AutoSparkImageViewRenderer(createMockRouter() as AutoSparkRouter),
            ],
        };
        const jsonMatched = await loadOnce("http://example.com/data.json", extra);
        expect(viewResult(jsonMatched).value).toContain("autospark-json-view");

        const imgMatched = await loadOnce("http://example.com/pic.png", extra);
        expect(viewResult(imgMatched).value).toContain("<img");
        expect(viewResult(imgMatched).value).toContain("pic.png");

        // 未注册时 .json 走模板兜底
        const tplMatched = await loadOnce("http://example.com/page.html");
        expect(viewResult(tplMatched).value).toContain("tpl");
        expect(viewResult(tplMatched).meta?.raw).toBeFalsy();
    });
});

describe("渲染降级链（ADR-0008：失败 → 模板 → raw）", () => {
    const router = createMockRouter() as AutoSparkRouter;
    let viewLoader: any;

    beforeEach(() => {
        viewLoader = new ViewLoader(router as AutoSparkRouter);
    });

    afterEach(() => {
        viewLoader?.cleanup?.();
    });

    it("选中渲染器失败 → 降级到模板渲染器", async () => {
        class BoomRenderer extends AutoSparkRouterViewRendererBase {
            test() {
                return true;
            }
            render() {
                return Promise.reject(new Error("boom"));
            }
        }
        (viewLoader as any).renderers = [new BoomRenderer(router)];
        const result = await (viewLoader as any).onResponse(
            createResponse("<div>body-ok</div>"),
            createMatchedRoute("/r", "http://example.com/page.html"),
            { hash: "h", url: "http://example.com/page.html" } as ViewRenderOptions,
        );
        expect(result.error).toBeFalsy();
        expect(result.value).toContain("body-ok");
        expect(result.meta?.raw).toBeFalsy();
    });

    it("模板也失败 → 落 raw 通道原样输出", async () => {
        class BoomRenderer extends AutoSparkRouterViewRendererBase {
            test() {
                return true;
            }
            render() {
                return Promise.reject(new Error("boom"));
            }
        }
        (viewLoader as any).renderers = [new BoomRenderer(router)];
        (viewLoader as any).defaultRenderer = {
            render: () => Promise.reject(new Error("template boom")),
            test: () => true,
        };
        const result = await (viewLoader as any).onResponse(
            createResponse("<div>raw-final</div>"),
            createMatchedRoute("/r", "http://example.com/page.html"),
            { hash: "h", url: "http://example.com/page.html" } as ViewRenderOptions,
        );
        expect(result.error).toBeFalsy();
        expect(result.value).toBe("<div>raw-final</div>");
        expect(result.meta?.raw).toBe(true);
    });

    it("全链失败返回 error；`!` 选中后链内去重（不重复进 raw）", async () => {
        const brokenTemplate = {
            render: () => Promise.reject(new Error("template boom")),
            test: () => true,
        };
        // 模板兜底替换为坏桩：非前缀视图选中坏模板 → 降级 raw 兜底成功（两级降级走通）
        (viewLoader as any).defaultRenderer = brokenTemplate;
        const fallbackRaw = await (viewLoader as any).onResponse(
            createResponse("<div>x</div>"),
            createMatchedRoute("/r", "http://example.com/page.html"),
            { hash: "h", url: "http://example.com/page.html" } as ViewRenderOptions,
        );
        expect(fallbackRaw.value).toBe("<div>x</div>");
        expect(fallbackRaw.meta?.raw).toBe(true);

        // `!` 前缀选中 raw 渲染器（替换为坏桩）：链 = [raw(坏桩), 坏模板]，
        // includes 去重不再重复入链 → 全链失败返回 error
        const rawCalls: number[] = [];
        const rawBroken = {
            render: () => {
                rawCalls.push(1);
                return Promise.reject(new Error("raw boom"));
            },
            test: () => true,
        };
        (viewLoader as any)._rawRenderer = rawBroken;
        const rawFailed = await (viewLoader as any).onResponse(
            createResponse("<div>y</div>"),
            createMatchedRoute("/r", "!http://example.com/page.html"),
            { hash: "h", url: "http://example.com/page.html" } as ViewRenderOptions,
        );
        expect(rawFailed.error).toBeTruthy();
        // 去重证明：raw 仅入链一次，失败后不重试（报出的是链上最后一次失败的错误）
        expect(rawCalls.length).toBe(1);
    });
});

describe("outlet 模板 raw 通道（ADR-0008）", () => {
    it("outlet 模板包含 raw 通道分支（普通 x-html 与 x-html.compile 互斥）", () => {
        expect(OUTLET_COMPONENT_CODE).toContain('x-show="!view.raw" x-html.compile="view.html"');
        expect(OUTLET_COMPONENT_CODE).toContain('x-show="!!view.raw" x-html="view.html"');
        expect(OUTLET_COMPONENT_CODE).toContain(
            'x-show="!ephemeral.raw" x-html.compile="ephemeral.html"',
        );
        expect(OUTLET_COMPONENT_CODE).toContain('x-show="!!ephemeral.raw" x-html="ephemeral.html"');
        expect(OUTLET_COMPONENT_CODE).toContain("raw: false");
    });
});
