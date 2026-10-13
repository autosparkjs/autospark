/**
 * 渲染层数据通道测试（回归：路由数据不注入视图）
 *
 * 数据通道的载体是 DataLoader 写入的 AsyncLoader 实例（非可调用体）——渲染层须经其内部
 * signal 取值，并把「路由数据 + 路由上下文（$params/$query/$state）」序列化进
 * `<script type="autospark/data">` 追加到视图 HTML 尾部（ADR-0032 / ADR-0002 决策 6）。
 * 本文件用 stub engine 驱动 outlet，直接断言各层视图挂载的 HTML 载荷。
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

/** 视图通道的 HTML 提取（renderers/html）依赖 DOMParser；test-setup 注册的 linkedom 版本
 *  在 happy-dom 文档下解析结果为空 body，此处换用同一 window 的 DOMParser（用毕还原） */
const originalDOMParser = (globalThis as any).DOMParser;

/** 视图挂载载荷（与 render 的 ViewPayload 同形） */
interface MountedView {
    hash: string;
    html: string;
    ready: boolean;
}

/**
 * 构造 fetch stub：视图通道取 `text()`（HTML），数据通道取 `json()`（JSON）
 */
function mockResponse(options: { data: Record<string, any>; view?: string }) {
    return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => options.view ?? '<div class="view-root"></div>',
        json: async () => options.data,
    } as any;
}

/** 从视图 HTML 尾部解析 autospark/data 脚本载荷 */
function parseDataScript(html: string): Record<string, any> | null {
    const marker = '<script type="autospark/data">';
    const start = html.indexOf(marker);
    if (start < 0) return null;
    const end = html.indexOf("</script>", start);
    const json = html.slice(start + marker.length, end);
    return JSON.parse(json);
}

/**
 * 构造 stub engine：按 outlet 宿主逐个给出组件读取面 + engine.data 直写通道（ADR-0003 决策 6）。
 * data(el, patch) 合并进出口数据域并同步落位「视图容器（data-view-hash）+ 其中的嵌套 outlet」，
 * 以复现真实管线（x-html.compile 编译远程模板 → 模板内 x-outlet 落地）的出口查找路径。
 */
function createEngineStub(rootOutlet: HTMLElement) {
    const comps = new WeakMap<HTMLElement, any>();
    const mounts: MountedView[] = [];

    /** 视图容器落位：已存在则补 ready 标记；不存在则创建（含嵌套 outlet） */
    function ensureContainer(outletEl: HTMLElement, view: MountedView) {
        const record: MountedView = { hash: view.hash, html: view.html || "", ready: !!view.ready };
        const existing = outletEl.querySelector(`[data-view-hash="${record.hash}"]`);
        if (existing) {
            existing.removeAttribute("data-stub-ready");
            if (record.ready) existing.setAttribute("data-stub-ready", "");
        } else {
            const viewHost = document.createElement("div");
            viewHost.setAttribute("data-view-hash", record.hash);
            if (record.ready) viewHost.setAttribute("data-stub-ready", "");
            const nestedOutlet = document.createElement("div");
            nestedOutlet.setAttribute("data-autospark-outlet", "");
            viewHost.appendChild(nestedOutlet);
            outletEl.appendChild(viewHost);
            comps.set(nestedOutlet, makeComp());
        }
        mounts.push(record);
    }

    function makeComp(): any {
        return {
            data: {
                views: [] as MountedView[],
                ephemeral: { hash: "", html: "", ready: false },
                active: "",
            },
        };
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
        engine: {
            // 短路 outlet 组件注册（避免 stub 需要完整 registerComponent 面）
            getComponentDeclaration: () => ({ name: "autospark.outlet" }),
            getComponent: (el: HTMLElement) => comps.get(el) ?? null,
            data: (el: HTMLElement, patch: Record<string, any>) => writeData(el, patch),
            destroy() { },
        } as any,
    };
}

async function createRouter(routes: any[], rootOutlet: HTMLElement) {
    const { AutoSparkRouter } = await import("@/router");
    const host = document.createElement("div");
    host.appendChild(rootOutlet);
    document.body.appendChild(host);
    const { engine, mounts } = createEngineStub(rootOutlet);
    const router = new AutoSparkRouter(host, { engine, base: "/shop", routes });
    // 等待 attach 完成（routes.load → loaders → history.listen）
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { router, mounts };
}

/** 最近一次导航中，指定 hash 的视图挂载载荷（ready=true） */
function mountedHtml(mounts: MountedView[], hash: string): string {
    const ready = mounts.filter((m) => m.hash === hash && m.ready);
    return ready.length > 0 ? ready[ready.length - 1].html : "";
}

describe("渲染层数据通道（autospark/data 注入）", () => {
    let mockFetch: ReturnType<typeof spyOn> | undefined;
    let router: any;

    const productsPayload = {
        meta: { title: "商品" },
        products: [
            { id: "p1", category: "gaming", name: "游戏手机" },
            { id: "p2", category: "smartphones", name: "智能手机" },
        ],
    };

    /** 三级路由链：products/:category/:id（与 example shop 同形） */
    const routes = [
        {
            path: "products",
            view: "pages/products.html",
            data: "data/products.json",
            children: [
                {
                    path: ":category",
                    default: true,
                    view: "pages/product-list.html",
                    data: "data/products.json",
                    params: { category: "smartphones" },
                    children: [
                        {
                            path: ":id",
                            view: "pages/product-detail.html",
                            data: {
                                from: async (context: any) =>
                                    productsPayload.products.find(
                                        (p) => p.id === context.params.id,
                                    ) ?? {},
                            },
                        },
                    ],
                },
            ],
        },
    ];

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
    });

    it("二级路由：视图挂载 HTML 应带 autospark/data 脚本，载荷含数据与 $params", async () => {
        mockFetch = spyOn(globalThis, "fetch").mockImplementation(async () =>
            mockResponse({ data: productsPayload }),
        );

        const outlet = document.createElement("div");
        outlet.setAttribute("data-autospark-outlet", "");
        const created = await createRouter(routes, outlet);
        router = created.router;

        await router.push("/shop/products/gaming");
        await new Promise((resolve) => setTimeout(resolve, 100));

        const categoryHash = router.routes.current[2].hash;
        const html = mountedHtml(created.mounts, categoryHash);
        // 数据脚本须落在视图元素根**内部**（顶层兄弟形态会被 x-html.compile 判为被丢弃的根元素）
        expect(html).toContain(
            '<div class="view-root"><script type="autospark/data">',
        );

        const payload = parseDataScript(html)!;
        // 路由数据（远程 JSON）
        expect(payload.products).toHaveLength(2);
        expect(payload.meta.title).toBe("商品");
        // 路由上下文（渲染层叠加，ADR-0002 决策 6）
        expect(payload.$params).toEqual({ category: "gaming" });
        expect(payload.$query).toEqual({});
        expect(payload.$state).toEqual({});
    });

    it("三级路由：每层视图各自拿到本层数据与参数", async () => {
        mockFetch = spyOn(globalThis, "fetch").mockImplementation(async () =>
            mockResponse({ data: productsPayload }),
        );

        const outlet = document.createElement("div");
        outlet.setAttribute("data-autospark-outlet", "");
        const created = await createRouter(routes, outlet);
        router = created.router;

        await router.push("/shop/products/gaming/p1");
        await new Promise((resolve) => setTimeout(resolve, 150));

        const current = router.routes.current;
        expect(current).toHaveLength(4);

        // 二级（:category）载荷：整份列表 + 分类参数
        const listPayload = parseDataScript(mountedHtml(created.mounts, current[2].hash));
        expect(listPayload?.$params).toEqual({ category: "gaming" });
        expect(listPayload?.products).toHaveLength(2);

        // 三级（:id）载荷：函数数据源命中的单品 + 两级参数
        const detailPayload = parseDataScript(mountedHtml(created.mounts, current[3].hash));
        expect(detailPayload?.id).toBe("p1");
        expect(detailPayload?.$params).toEqual({ category: "gaming", id: "p1" });
    });

    it("参数子路由切换：不同参数值须产生不同视图 hash 并重渲染（回归：切换分类不生效）", async () => {
        mockFetch = spyOn(globalThis, "fetch").mockImplementation(async () =>
            mockResponse({ data: productsPayload }),
        );

        const outlet = document.createElement("div");
        outlet.setAttribute("data-autospark-outlet", "");
        const created = await createRouter(routes, outlet);
        router = created.router;

        await router.push("/shop/products/gaming");
        await new Promise((resolve) => setTimeout(resolve, 100));

        const gamingHash = router.routes.current[2].hash;
        expect(parseDataScript(mountedHtml(created.mounts, gamingHash))!.$params).toEqual({
            category: "gaming",
        });

        // 切换到另一分类：URL 参数变化，视图 hash 必须不同（否则 keepAlive 复用旧视图导致切换无效）
        await router.push("/shop/products/smartphones");
        await new Promise((resolve) => setTimeout(resolve, 100));

        const smartphonesHash = router.routes.current[2].hash;
        expect(smartphonesHash).not.toBe(gamingHash);
        // 重新渲染了新分类的视图载荷（$params 为新值），而非仅激活旧视图
        const smartphonesPayload = parseDataScript(mountedHtml(created.mounts, smartphonesHash))!;
        expect(smartphonesPayload.$params).toEqual({ category: "smartphones" });
        expect(
            created.mounts.filter((m) => m.hash === smartphonesHash && m.ready).length,
        ).toBeGreaterThan(0);
    });

    it("路由无 data 时不注入数据脚本（保持既有契约）", async () => {
        mockFetch = spyOn(globalThis, "fetch").mockImplementation(async () =>
            mockResponse({ data: {} }),
        );

        const outlet = document.createElement("div");
        outlet.setAttribute("data-autospark-outlet", "");
        const created = await createRouter([{ path: "plain", view: "pages/plain.html" }], outlet);
        router = created.router;

        await router.push("/shop/plain");
        await new Promise((resolve) => setTimeout(resolve, 100));

        const current = router.routes.current;
        const html = mountedHtml(created.mounts, current[current.length - 1].hash);
        expect(html).not.toContain("autospark/data");
    });
});
