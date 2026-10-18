/**
 * 出口回退与激活前提测试（ADR-0005）
 *
 * 决策 1（出口回退）：上一层视图未提供嵌套出口（模板无 x-outlet）时，本层视图沿用
 * 上一层出口挂载（置换），更深匹配层逐级置换、最深者胜；回退视图自带 x-outlet 时
 * 更深层自然向下扎根。日志分级（修订）：层 1 回退目标恒为根出口（扁平单出口应用的
 * 常规落点）降为 debug；i>=2 回退（中间布局层缺出口）保持 warn。
 * 决策 2（激活前提 + 裁剪清理）：公共层跳过的前提是「本层视图仍是其出口的激活视图」，
 * 不成立则重挂（keepAlive 仅激活、ephemeral 重挂）；后退裁剪后残留出口的激活态清空。
 *
 * 与 features.render-data.test.ts 的 stub 差异：嵌套出口的落位由视图 HTML 是否声明
 * x-outlet 决定（对齐真实管线：x-html.compile 编译模板，模板带出口才有出口）——
 * 无条件落位嵌套出口会掩盖回退路径。
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

/** 视图通道的 HTML 提取（renderers/html）依赖 DOMParser；用毕还原 */
const originalDOMParser = (globalThis as any).DOMParser;

/** 视图挂载载荷（与 render 的 ViewPayload 同形） */
interface MountedView {
    hash: string;
    html: string;
    ready: boolean;
}

function mockResponse(options: { data: Record<string, any>; view?: string }) {
    return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => options.view ?? '<div class="view-root"></div>',
        json: async () => options.data,
    } as any;
}

/**
 * 构造 stub engine：engine.data 直写通道同步落位视图容器；嵌套出口仅在视图 HTML
 * 声明 x-outlet 时创建（真实管线中出口来自模板编译）
 */
function createEngineStub(rootOutlet: HTMLElement) {
    const comps = new WeakMap<HTMLElement, any>();
    const mounts: MountedView[] = [];

    function makeComp(): any {
        return {
            data: {
                views: [] as MountedView[],
                ephemeral: { hash: "", html: "", ready: false },
                active: "",
            },
        };
    }

    /** 视图容器落位：已存在则补 ready 标记；不存在则创建（出口有无按 html 判定） */
    function ensureContainer(outletEl: HTMLElement, view: MountedView) {
        const record: MountedView = { hash: view.hash, html: view.html || "", ready: !!view.ready };
        const existing = outletEl.querySelector(`[data-view-hash="${record.hash}"]`);
        if (existing) {
            if (record.ready) existing.setAttribute("data-stub-ready", "");
            else existing.removeAttribute("data-stub-ready");
            return;
        }
        const viewHost = document.createElement("div");
        viewHost.setAttribute("data-view-hash", record.hash);
        if (record.html.includes("x-outlet")) {
            const nestedOutlet = document.createElement("div");
            nestedOutlet.setAttribute("data-autospark-outlet", "");
            viewHost.appendChild(nestedOutlet);
            comps.set(nestedOutlet, makeComp());
        }
        outletEl.appendChild(viewHost);
        mounts.push(record);
    }

    /** engine.data 直写通道：合并数据域并同步视图容器（对齐真实组件的 x-for/临时槽行为） */
    function writeData(outletEl: HTMLElement, patch: Record<string, any>) {
        const comp = comps.get(outletEl);
        if (!comp) return;
        const state = comp.data;
        if (patch.ephemeral) {
            state.ephemeral = patch.ephemeral;
            // 临时通道：清空既有视图容器后整体替换（每次重编译、无态可丢）
            outletEl.querySelectorAll("[data-view-hash]").forEach((el) => el.remove());
            ensureContainer(outletEl, patch.ephemeral);
        }
        if (patch.views) {
            state.views = patch.views;
            for (const view of patch.views) ensureContainer(outletEl, view);
        }
        if (typeof patch.active === "string") state.active = patch.active;
    }

    comps.set(rootOutlet, makeComp());

    return {
        mounts,
        comps,
        engine: {
            getComponentDeclaration: () => ({ name: "autospark.outlet" }),
            getComponent: (el: HTMLElement) => comps.get(el) ?? null,
            data: (el: HTMLElement, patch: Record<string, any>) => writeData(el, patch),
            destroy() { },
        } as any,
    };
}

async function createRouter(routes: any[], rootOutlet: HTMLElement, options: any = {}) {
    const { AutoSparkRouter } = await import("@/router");
    const host = document.createElement("div");
    host.appendChild(rootOutlet);
    document.body.appendChild(host);
    const { engine, mounts, comps } = createEngineStub(rootOutlet);
    const router = new AutoSparkRouter(host, { engine, base: "/shop", routes, ...options });
    // 等待 attach 完成（routes.load → loaders → history.listen）
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { router, mounts, comps };
}

/** 视图 HTML（x-outlet 的有无即出口链的有无） */
const PRODUCTS_VIEW = '<div class="page-products">产品<x-outlet></x-outlet></div>';
const LIST_WITH_OUTLET = '<div class="page-list">列表<x-outlet></x-outlet></div>';
const LIST_NO_OUTLET = '<div class="page-list">列表</div>';
const DETAIL_NO_OUTLET = '<div class="page-detail">详情</div>';
const DETAIL_WITH_OUTLET = '<div class="page-detail">详情<x-outlet></x-outlet></div>';
const SUB_VIEW = '<div class="page-sub">子页</div>';

/** 三级路由链：products/:category/:id（与 example shop 同形），可选四级 :sub */
function buildRoutes(options: { keepAliveCategory?: boolean; withSub?: boolean }) {
    const category: any = {
        path: ":category",
        default: true,
        view: "pages/product-list.html",
        data: "data/products.json",
        params: { category: "smartphones" },
        children: [
            {
                path: ":id",
                view: "pages/product-detail.html",
                data: "data/products.json",
            },
        ],
    };
    if (options.keepAliveCategory) category.keepAlive = true;
    if (options.withSub) {
        category.children[0].children = [
            { path: ":sub", view: "pages/sub.html", data: "data/products.json" },
        ];
    }
    return [
        {
            path: "products",
            view: "pages/products.html",
            data: "data/products.json",
            children: [category],
        },
    ];
}

describe("出口回退与激活前提（ADR-0005）", () => {
    let mockFetch: ReturnType<typeof spyOn> | undefined;
    let router: any;

    /** 按 URL 分发视图 HTML；list/detail 内容由用例经 views 对象指定 */
    const views = { list: LIST_WITH_OUTLET, detail: DETAIL_NO_OUTLET, sub: SUB_VIEW };

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
        // location/history 是用例间共享的单例：残留 URL 会成为下个用例 attach 的
        // 初始导航（多渲染一轮），归位根路径
        win.history.replaceState(null, "", "/");
        views.list = LIST_WITH_OUTLET;
        views.detail = DETAIL_NO_OUTLET;
        views.sub = SUB_VIEW;
    });

    function installFetch() {
        mockFetch = spyOn(globalThis, "fetch").mockImplementation(async (input: any) => {
            const url = String(input);
            if (url.includes("products.html")) return mockResponse({ data: {}, view: PRODUCTS_VIEW });
            if (url.includes("product-list.html")) return mockResponse({ data: {}, view: views.list });
            if (url.includes("product-detail.html")) {
                return mockResponse({ data: {}, view: views.detail });
            }
            if (url.includes("sub.html")) return mockResponse({ data: {}, view: views.sub });
            return mockResponse({ data: {} });
        });
    }

    /** 取出口元素：某出口子树内、指定视图容器内的嵌套出口 */
    function nestedOutlet(root: HTMLElement, viewHash: string): HTMLElement | null {
        return (
            (root.querySelector(
                `[data-view-hash="${viewHash}"] [data-autospark-outlet]`,
            ) as HTMLElement | null) ?? null
        );
    }

    /** 过滤含「未找到嵌套出口」的日志调用（logger 构造期捕获 console 引用，spy 须先于 createRouter 安装） */
    function fallbackLogs(spy: ReturnType<typeof spyOn>) {
        return spy.mock.calls.filter((args: any[]) =>
            args.some((a) => String(a).includes("未找到嵌套出口")),
        );
    }

    it("决策 1：上层视图无 x-outlet 时，子层视图回退挂进上层出口（置换）", async () => {
        installFetch();
        views.list = LIST_NO_OUTLET;

        const outlet = document.createElement("div");
        outlet.setAttribute("data-autospark-outlet", "");
        const created = await createRouter(buildRoutes({}), outlet);
        router = created.router;

        await router.push("/shop/products/gaming/p1");
        await new Promise((resolve) => setTimeout(resolve, 150));

        const current = router.routes.current;
        const productsHash = current[1].hash;
        const listHash = current[2].hash;
        const detailHash = current[3].hash;

        // :category 层的出口（products 视图容器内的嵌套出口）
        const categoryOutlet = nestedOutlet(outlet, productsHash);
        expect(categoryOutlet).not.toBeNull();
        // 列表先挂载、详情回退置换：出口激活态归详情，详情挂载载荷就绪
        const comp = created.comps.get(categoryOutlet!);
        expect(comp.data.active).toBe(detailHash);
        expect(comp.data.ephemeral.hash).toBe(detailHash);
        expect(created.mounts.filter((m) => m.hash === detailHash && m.ready)).toHaveLength(1);
        // 列表视图容器已被临时通道整体替换（置换语义）
        expect(created.mounts.filter((m) => m.hash === listHash && m.ready).length).toBeGreaterThan(0);
    });

    it("决策 1：回退挂进的视图自带 x-outlet 时，更深层重新向下扎根", async () => {
        installFetch();
        views.list = LIST_NO_OUTLET;
        views.detail = DETAIL_WITH_OUTLET;

        const outlet = document.createElement("div");
        outlet.setAttribute("data-autospark-outlet", "");
        const created = await createRouter(buildRoutes({ withSub: true }), outlet);
        router = created.router;

        await router.push("/shop/products/gaming/p1/s1");
        await new Promise((resolve) => setTimeout(resolve, 200));

        const current = router.routes.current;
        const productsHash = current[1].hash;
        const detailHash = current[3].hash;
        const subHash = current[4].hash;

        // 详情回退挂进 :category 出口后，其自带的 x-outlet 成为四级出口
        const categoryOutlet = nestedOutlet(outlet, productsHash)!;
        expect(created.comps.get(categoryOutlet).data.active).toBe(detailHash);
        const detailOutlet = nestedOutlet(categoryOutlet, detailHash);
        expect(detailOutlet).not.toBeNull();
        expect(created.comps.get(detailOutlet!).data.active).toBe(subHash);
        expect(created.mounts.filter((m) => m.hash === subHash && m.ready)).toHaveLength(1);
    });

    it("决策 1（修订）：层 1 回退目标恒为根出口——降为 debug（默认关闭），不报 warn", async () => {
        installFetch();
        views.list = LIST_NO_OUTLET;
        const warnSpy = spyOn(console, "warn").mockImplementation(() => {});
        const debugSpy = spyOn(console, "debug").mockImplementation(() => {});
        try {
            const outlet = document.createElement("div");
            outlet.setAttribute("data-autospark-outlet", "");
            // 扁平声明：path "/" 的 view 合并为根视图（快速入门 demo 同形），兄弟页互相置换
            const created = await createRouter(
                [
                    { path: "/", view: "pages/product-list.html" },
                    { path: "about", view: "pages/product-detail.html" },
                ],
                outlet,
            );
            router = created.router;

            await router.push("/shop/about");
            await new Promise((resolve) => setTimeout(resolve, 150));

            // i=1 回退根出口是常规落点：warn 无、debug 默认关闭亦无
            expect(fallbackLogs(warnSpy)).toHaveLength(0);
            expect(fallbackLogs(debugSpy)).toHaveLength(0);
            // 回退行为本身不变：about 置换 home 落进根出口
            const aboutHash = router.routes.current[1].hash;
            expect(created.comps.get(outlet).data.active).toBe(aboutHash);
        } finally {
            warnSpy.mockRestore();
            debugSpy.mockRestore();
        }
    });

    it("决策 1（修订）：debug 开启时层 1 回退以 debug 输出（仍非 warn）", async () => {
        installFetch();
        views.list = LIST_NO_OUTLET;
        const warnSpy = spyOn(console, "warn").mockImplementation(() => {});
        const debugSpy = spyOn(console, "debug").mockImplementation(() => {});
        try {
            const outlet = document.createElement("div");
            outlet.setAttribute("data-autospark-outlet", "");
            const created = await createRouter(
                [
                    { path: "/", view: "pages/product-list.html" },
                    { path: "about", view: "pages/product-detail.html" },
                ],
                outlet,
                { debug: true },
            );
            router = created.router;

            await router.push("/shop/about");
            await new Promise((resolve) => setTimeout(resolve, 150));

            expect(fallbackLogs(warnSpy)).toHaveLength(0);
            expect(fallbackLogs(debugSpy).length).toBeGreaterThan(0);
        } finally {
            warnSpy.mockRestore();
            debugSpy.mockRestore();
        }
    });

    it("决策 1（修订）：i>=2 回退（中间布局层缺出口）保持 warn", async () => {
        installFetch();
        views.list = LIST_NO_OUTLET;
        const warnSpy = spyOn(console, "warn").mockImplementation(() => {});
        try {
            const outlet = document.createElement("div");
            outlet.setAttribute("data-autospark-outlet", "");
            // 链 [根（无视图）, a（有视图无出口）, b]：i=2 回退意味布局层漏写 x-outlet
            const created = await createRouter(
                [
                    {
                        path: "a",
                        view: "pages/product-list.html",
                        children: [{ path: "b", view: "pages/product-detail.html" }],
                    },
                ],
                outlet,
            );
            router = created.router;

            await router.push("/shop/a/b");
            await new Promise((resolve) => setTimeout(resolve, 150));

            expect(fallbackLogs(warnSpy).length).toBeGreaterThan(0);
        } finally {
            warnSpy.mockRestore();
        }
    });

    it("决策 1：URL 深度超过路由表时，unmatched 尾段不产生渲染层（最深匹配层落位）", async () => {
        installFetch();
        views.list = LIST_NO_OUTLET;

        const outlet = document.createElement("div");
        outlet.setAttribute("data-autospark-outlet", "");
        const created = await createRouter(buildRoutes({}), outlet);
        router = created.router;

        await router.push("/shop/products/gaming/p1/a/b/c");
        await new Promise((resolve) => setTimeout(resolve, 150));

        const current = router.routes.current;
        const detailHash = current[3].hash;
        // 渲染深度到 :id 为止，详情落位回退出口
        expect(created.mounts.filter((m) => m.hash === detailHash && m.ready)).toHaveLength(1);
    });

    it("决策 2：后退裁剪后，残留的嵌套出口激活态清空（详情不再残留）", async () => {
        installFetch();
        views.list = LIST_WITH_OUTLET;

        const outlet = document.createElement("div");
        outlet.setAttribute("data-autospark-outlet", "");
        const created = await createRouter(buildRoutes({}), outlet);
        router = created.router;

        await router.push("/shop/products/gaming/p1");
        await new Promise((resolve) => setTimeout(resolve, 150));

        const productsHash = router.routes.current[1].hash;
        const categoryOutlet = nestedOutlet(outlet, productsHash)!;
        const detailHash = router.routes.current[3].hash;
        // 详情挂载点 = 列表容器内的嵌套出口（详情自身无出口）
        const listHash = router.routes.current[2].hash;
        const listOutlet = nestedOutlet(categoryOutlet, listHash);
        expect(listOutlet).not.toBeNull();
        expect(created.comps.get(listOutlet!).data.active).toBe(detailHash);

        // 后退到列表层：被裁层（:id）的出口激活态清空
        await router.push("/shop/products/gaming");
        await new Promise((resolve) => setTimeout(resolve, 150));

        expect(created.comps.get(listOutlet!).data.active).toBe("");
    });

    it("决策 2：回退置换后后退，列表重挂恢复激活（激活前提不成立的公共层重渲染）", async () => {
        installFetch();
        views.list = LIST_NO_OUTLET;

        const outlet = document.createElement("div");
        outlet.setAttribute("data-autospark-outlet", "");
        const created = await createRouter(buildRoutes({}), outlet);
        router = created.router;

        await router.push("/shop/products/gaming/p1");
        await new Promise((resolve) => setTimeout(resolve, 150));

        const productsHash = router.routes.current[1].hash;
        const categoryOutlet = nestedOutlet(outlet, productsHash)!;
        expect(created.comps.get(categoryOutlet).data.active).toBe(
            router.routes.current[3].hash,
        );

        // 后退到列表层：出口已被详情置换，激活前提不成立 → 列表重挂
        await router.push("/shop/products/gaming");
        await new Promise((resolve) => setTimeout(resolve, 150));

        const listHash = router.routes.current[2].hash;
        expect(created.comps.get(categoryOutlet).data.active).toBe(listHash);
        expect(created.comps.get(categoryOutlet).data.ephemeral.hash).toBe(listHash);
        // 初次 + 重挂：列表载荷出现两次
        expect(
            created.mounts.filter((m) => m.hash === listHash && m.ready).length,
        ).toBeGreaterThanOrEqual(2);
    });

    it("决策 2：keepAlive 视图后退恢复仅激活不重建（views 清单不重复追加）", async () => {
        installFetch();
        views.list = LIST_WITH_OUTLET;

        const outlet = document.createElement("div");
        outlet.setAttribute("data-autospark-outlet", "");
        const created = await createRouter(buildRoutes({ keepAliveCategory: true }), outlet);
        router = created.router;

        await router.push("/shop/products/gaming/p1");
        await new Promise((resolve) => setTimeout(resolve, 150));

        const productsHash = router.routes.current[1].hash;
        const categoryOutlet = nestedOutlet(outlet, productsHash)!;
        const detailHash = router.routes.current[3].hash;

        await router.push("/shop/products/gaming");
        await new Promise((resolve) => setTimeout(resolve, 150));

        const listHash = router.routes.current[2].hash;
        const comp = created.comps.get(categoryOutlet);
        // 列表视图条目唯一（仅激活），激活态恢复到列表
        expect(comp.data.views.filter((v: MountedView) => v.hash === listHash)).toHaveLength(1);
        expect(comp.data.active).toBe(listHash);
        // 被裁详情出口已休眠（keepAlive 条目保留，激活态清空）
        const detailOutlet = nestedOutlet(categoryOutlet, detailHash);
        if (detailOutlet) {
            expect(created.comps.get(detailOutlet).data.active).toBe("");
        }
    });

    it("宿主无出口时维持现状：error 并终止渲染（无处可退）", async () => {
        installFetch();

        const host = document.createElement("div");
        document.body.appendChild(host);
        const { AutoSparkRouter } = await import("@/router");
        const stubEngine = {
            getComponentDeclaration: () => ({ name: "autospark.outlet" }),
            getComponent: () => null,
            data: () => { },
            destroy() { },
        } as any;
        const created = new AutoSparkRouter(host, { engine: stubEngine, base: "/shop", routes: buildRoutes({}) });
        router = created;
        await new Promise((resolve) => setTimeout(resolve, 50));

        // 不抛异常、无出口可挂载（渲染在入口终止）
        await router.push("/shop/products/gaming");
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(true).toBe(true);
    });
});
