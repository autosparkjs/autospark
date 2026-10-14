/**
 * 入口文档导航测试（ADR-0006 修订版）
 *
 * 直开应用载体 HTML（pathname 以 .html/.htm 结尾——如 /public/shop/index.html、
 * /shop/a.html、/shop/x/y/z.html）时，attach 初始导航先试真实匹配（路由 path 带
 * .html 的合法场景正常渲染），仅 unmatched 才 replace 到 home 路径（地址栏归位
 * base 根）；未显式 base 时 getBaseUrl 推断入口文件所在目录为 base（目录规则）。
 */

import { describe, it, expect, afterEach, beforeAll, afterAll, spyOn } from "bun:test";
import { setupTestEnvironment } from "./test-setup";

setupTestEnvironment();

// test-setup 只注册 window/document/Node 等基础全局；路由依赖的构造器与 history/location 在此补齐
const win = (globalThis as any).window;
(globalThis as any).HTMLElement = win.HTMLElement;
(globalThis as any).Event = win.Event;
(globalThis as any).CustomEvent = win.CustomEvent;
(globalThis as any).history = win.history;
(globalThis as any).location = win.location;

const originalDOMParser = (globalThis as any).DOMParser;

function mockResponse(options: { view: string }) {
    return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => options.view,
        json: async () => ({}),
    } as any;
}

async function createRouter(routes: any[], base?: string) {
    const { AutoSparkRouter } = await import("@/router");
    const host = document.createElement("div");
    const outlet = document.createElement("div");
    outlet.setAttribute("data-autospark-outlet", "");
    host.appendChild(outlet);
    document.body.appendChild(host);
    const engine = {
        getComponentDeclaration: () => ({ name: "autospark.outlet" }),
        getComponent: (el: HTMLElement) => {
            if (el === outlet) {
                return {
                    data: {
                        views: [],
                        ephemeral: { hash: "", html: "", ready: false },
                        active: "",
                    },
                };
            }
            return null;
        },
        data: (el: HTMLElement, patch: Record<string, any>) => {
            const comp = engine.getComponent(el);
            if (!comp) return;
            if (patch.ephemeral) comp.data.ephemeral = patch.ephemeral;
            if (patch.views) comp.data.views = patch.views;
            if (typeof patch.active === "string") comp.data.active = patch.active;
        },
        destroy() { },
    } as any;
    // base 可省略：模拟「未显式设置」——getBaseUrl 缺省推断生效
    // （键值 undefined 会被 Object.assign 覆盖缺省值，必须省略键而非传 undefined）
    const options: any = { engine, routes };
    if (base !== undefined) options.base = base;
    const router = new AutoSparkRouter(host, options);
    // 等待 attach 完成（routes.load → loaders → history.listen → 初始导航）
    await new Promise((resolve) => setTimeout(resolve, 80));
    return { router };
}

/** 含根级 default 首页的最小路由表 */
const homeRoutes = [
    { path: "home", default: true, view: "pages/home.html", data: "data/home.json" },
    { path: "products", view: "pages/products.html" },
];

describe("入口文档导航（ADR-0006）", () => {
    let mockFetch: ReturnType<typeof spyOn> | undefined;
    let router: any;

    beforeAll(() => {
        (globalThis as any).DOMParser = win.DOMParser;
    });

    afterAll(() => {
        (globalThis as any).DOMParser = originalDOMParser;
    });

    afterEach(() => {
        mockFetch?.mockRestore();
        mockFetch = undefined;
        router?.detach?.();
        router = undefined;
        document.body.innerHTML = "";
        // <base href> 信号源是用例间共享的文档级状态，用毕移除
        document.querySelector("base")?.remove();
        // location/history 是用例间共享的单例，归位根路径
        win.history.replaceState(null, "", "/");
    });

    function installFetch() {
        mockFetch = spyOn(globalThis, "fetch").mockImplementation(async (input: any) => {
            const url = String(input);
            if (url.includes("home.html")) return mockResponse({ view: '<div class="page-home">首页</div>' });
            if (url.includes("products.html")) {
                return mockResponse({ view: '<div class="page-products">产品</div>' });
            }
            return mockResponse({ view: '<div class="view-root"></div>' });
        });
    }

    it("直开任意静态前缀的载体（/public/shop/index.html）→ 地址栏归位 base 根并渲染首页", async () => {
        installFetch();
        win.history.replaceState(null, "", "/public/shop/index.html");

        const created = await createRouter(homeRoutes, "/shop");
        router = created.router;

        // 地址栏归位 base 根（home() = replace(joinPath(base, home))）
        expect(win.location.pathname).toBe("/shop");
        // 首页视图经根级 default 展开渲染
        const current = router.routes.current;
        expect(current[current.length - 1].route?.path).toBe("home");
    });

    it("直开 base 对齐的载体（/shop/index.html）→ 同样归位 base 根", async () => {
        installFetch();
        win.history.replaceState(null, "", "/shop/index.html");

        const created = await createRouter(homeRoutes);
        router = created.router;

        expect(win.location.pathname).toBe("/shop");
        const current = router.routes.current;
        expect(current[current.length - 1].route?.path).toBe("home");
    });

    it("正常路由路径直开不受影响（不归位、按 URL 匹配渲染）", async () => {
        installFetch();
        win.history.replaceState(null, "", "/shop/products");

        const created = await createRouter(homeRoutes, "/shop");
        router = created.router;

        // 地址栏保持原样，按 URL 匹配到 products
        expect(win.location.pathname).toBe("/shop/products");
        const current = router.routes.current;
        expect(current[current.length - 1].route?.path).toBe("products");
    });

    it("未显式 base：直开 /shop/a.html → getBaseUrl 推断目录为 base，归位 /shop", async () => {
        installFetch();
        win.history.replaceState(null, "", "/shop/a.html");

        const created = await createRouter(homeRoutes);
        router = created.router;

        // base 由 getBaseUrl 推断为入口文件所在目录 /shop/，归位即落目录根
        expect(win.location.pathname).toBe("/shop");
        const current = router.routes.current;
        expect(current[current.length - 1].route?.path).toBe("home");
    });

    it("未显式 base：直开 /shop/x/y/z.html → 归位所在目录 /shop/x/y", async () => {
        installFetch();
        win.history.replaceState(null, "", "/shop/x/y/z.html");

        const created = await createRouter(homeRoutes);
        router = created.router;

        expect(win.location.pathname).toBe("/shop/x/y");
        const current = router.routes.current;
        expect(current[current.length - 1].route?.path).toBe("home");
    });

    it("路由 path 带 .html 的合法场景：匹配命中则正常渲染，不归位", async () => {
        installFetch();
        win.history.replaceState(null, "", "/shop/a.html");

        const htmlRoutes = [
            ...homeRoutes,
            { path: "a.html", view: "pages/a.html" },
        ];
        const created = await createRouter(htmlRoutes, "/shop");
        router = created.router;

        // .html 直开但路由表命中 → 按路由渲染（先试匹配后归位）
        expect(win.location.pathname).toBe("/shop/a.html");
        const current = router.routes.current;
        expect(current[current.length - 1].route?.path).toBe("a.html");
    });

    it("动态入口（场景 A）：/shop 直开 + 显式 base → 根判定走 home 渲染首页", async () => {
        installFetch();
        win.history.replaceState(null, "", "/shop");

        const created = await createRouter(homeRoutes, "/shop");
        router = created.router;

        expect(win.location.pathname).toBe("/shop");
        const current = router.routes.current;
        expect(current[current.length - 1].route?.path).toBe("home");
    });

    it("动态入口（场景 B）：/shop 直开 + 未显式 base → getBaseUrl 目录推断，渲染首页", async () => {
        installFetch();
        win.history.replaceState(null, "", "/shop");

        const created = await createRouter(homeRoutes);
        router = created.router;

        // getBaseUrl("/shop") = "/shop/"（非 .html、非尾斜杠 → 加斜杠），剥离后为根 → home
        expect(win.location.pathname).toBe("/shop");
        const current = router.routes.current;
        expect(current[current.length - 1].route?.path).toBe("home");
    });

    it("动态入口（场景 E）：深层直达 + <base href> 信号 → base 取标签，正常渲染深层路由", async () => {
        installFetch();
        win.history.replaceState(null, "", "/shop/products");
        // 服务端在动态入口模板注入挂载路径（HTML 标准信号源）
        const baseEl = document.createElement("base");
        baseEl.setAttribute("href", "/shop/");
        document.head.appendChild(baseEl);

        const created = await createRouter(homeRoutes);
        router = created.router;

        // 无 <base> 信号时 getBaseUrl("/shop/products") 会误判 base=/shop/products/ → 断裂；
        // <base href> 存在时优先采纳 → 深层直达正常匹配渲染
        expect(win.location.pathname).toBe("/shop/products");
        const current = router.routes.current;
        expect(current[current.length - 1].route?.path).toBe("products");
    });
});
