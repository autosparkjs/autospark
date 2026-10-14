/**
 * 加载域公共层跳过单元测试（ADR-0004）
 *
 * 覆盖：
 * - fromIndex 语义：i < fromIndex 且该通道加载成功（_viewLoadState/_dataLoadState === "ok"）的层
 *   跳过加载，其余层（含失败层）正常加载
 * - 加载状态落账：成功 → "ok"、失败 → "error"、导航取消不写标记
 */

import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import type { AutoSparkRouter } from "../router";
import type { AutoSparkMatchedRouteItem } from "../types/routes";

import { setupTestEnvironment } from "./test-setup";

setupTestEnvironment();

let ViewLoader: any;
let DataLoader: any;

const mockLogger = {
    debug: () => {},
    error: () => {},
    info: () => {},
    warn: () => {},
};

function createMockRouter(): Partial<AutoSparkRouter> {
    return {
        debug: false,
        logger: mockLogger,
        //@ts-ignore
        renderers: [],
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
            base: "/",
            renderers: [],
            //@ts-ignore
            viewOptions: { timeout: 5000, cache: 0 },
            //@ts-ignore
            dataOptions: { timeout: 5000, cache: 0 },
        },
    };
}

function createMatched(
    path: string,
    channel: "view" | "data",
    source: any,
    id: number,
): AutoSparkMatchedRouteItem {
    return {
        route: {
            name: `r${id}`,
            path,
            ...(channel === "view" ? { view: source } : { data: source }),
        },
        params: {},
        query: {},
        state: {},
        path,
        url: path,
        hash: `hash_${path}_${id}`,
        id,
    };
}

const HTML = "<div>page</div>";

describe("加载域公共层跳过（ADR-0004）", () => {
    let fetchSpy: any;

    /** loadRoute 的成功/失败落账是 fire-and-forget promise 链（await allSettled 不含落账时序），断言前让出宏任务 */
    const settle = () => new Promise((r) => setTimeout(r, 20));

    /** 按 URL 分流响应：.json 走 JSON（DataLoader），其余走 HTML（ViewLoader） */
    const respondByExt = async (url: any) =>
        String(url).endsWith(".json")
            ? new Response('{"ok":1}', { status: 200, headers: { "Content-Type": "application/json" } })
            : new Response(HTML, { status: 200, headers: { "Content-Type": "text/html" } });

    beforeEach(async () => {
        if (!ViewLoader) {
            ({ ViewLoader } = await import("../features/viewLoader"));
            ({ DataLoader } = await import("../features/dataLoader"));
        }
        fetchSpy = spyOn(globalThis, "fetch").mockImplementation(respondByExt as any);
    });

    afterEach(() => {
        fetchSpy.mockRestore();
    });

    describe("ViewLoader", () => {
        it("加载成功应落账 _viewLoadState = 'ok'", async () => {
            const router = createMockRouter();
            const loader = new ViewLoader(router as any);
            const r1 = createMatched("/products", "view", "pages/products.html", 1);

            await loader.loadRoutes([r1], undefined, 0);
            await settle();

            //@ts-ignore
            expect(r1.route._viewLoadState).toBe("ok");
        });

        it("加载失败应落账 _viewLoadState = 'error'", async () => {
            fetchSpy.mockImplementation(async () => new Response("err", { status: 500 }));
            const router = createMockRouter();
            const loader = new ViewLoader(router as any);
            const r1 = createMatched("/products", "view", "pages/products.html", 1);

            await loader.loadRoutes([r1], undefined, 0);
            await settle();

            //@ts-ignore
            expect(r1.route._viewLoadState).toBe("error");
        });

        it("fromIndex 之前已成功的层应跳过加载（fetch 不触达）", async () => {
            const router = createMockRouter();
            const loader = new ViewLoader(router as any);
            const common = createMatched("/products", "view", "pages/products.html", 1);
            await loader.loadRoutes([common], undefined, 0);
            await settle();
            const callsAfterFirst = fetchSpy.mock.calls.length;

            const fresh = createMatched("/products/tablets", "view", "pages/product-list.html", 2);
            await loader.loadRoutes([common, fresh], undefined, 1);
            await settle();

            // 只有新增层发起请求，公共层复用
            expect(fetchSpy.mock.calls.length).toBe(callsAfterFirst + 1);
        });

        it("fromIndex 之前失败过的层公共也应重新加载", async () => {
            const router = createMockRouter();
            const loader = new ViewLoader(router as any);
            const failed = createMatched("/products", "view", "pages/products.html", 1);

            // 第一轮失败
            fetchSpy.mockImplementation(async () => new Response("err", { status: 500 }));
            await loader.loadRoutes([failed], undefined, 0);
            await settle();
            //@ts-ignore
            expect(failed.route._viewLoadState).toBe("error");

            // 第二轮恢复：失败层即使公共（i < fromIndex）也重试
            fetchSpy.mockImplementation(
                async () => new Response(HTML, { status: 200, headers: { "Content-Type": "text/html" } }),
            );
            const fresh = createMatched("/products/tablets", "view", "pages/product-list.html", 2);
            await loader.loadRoutes([failed, fresh], undefined, 1);
            await settle();

            //@ts-ignore
            expect(failed.route._viewLoadState).toBe("ok");
            // 失败层 + 新增层各一次请求
            expect(fetchSpy.mock.calls.length).toBe(3);
        });
    });

    describe("DataLoader", () => {
        it("加载成功应落账 _dataLoadState = 'ok'，fromIndex 之前已成功的层跳过", async () => {
            const router = createMockRouter();
            const loader = new DataLoader(router as any);
            const common = createMatched("/products", "data", "data/products.json", 1);

            await loader.loadRoutes([common], undefined, 0);
            await settle();
            //@ts-ignore
            expect(common.route._dataLoadState).toBe("ok");

            const callsAfterFirst = fetchSpy.mock.calls.length;
            const fresh = createMatched("/products/tablets", "data", "data/products.json", 2);
            await loader.loadRoutes([common, fresh], undefined, 1);
            await settle();

            expect(fetchSpy.mock.calls.length).toBe(callsAfterFirst + 1);
        });

        it("加载失败应落账 _dataLoadState = 'error'", async () => {
            fetchSpy.mockImplementation(async () => new Response("err", { status: 500 }));
            const router = createMockRouter();
            const loader = new DataLoader(router as any);
            const r1 = createMatched("/products", "data", "data/products.json", 1);

            await loader.loadRoutes([r1], undefined, 0);
            await settle();

            //@ts-ignore
            expect(r1.route._dataLoadState).toBe("error");
        });
    });
});
