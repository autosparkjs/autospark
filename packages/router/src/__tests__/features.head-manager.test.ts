/**
 * SEO head 管理测试（features/headManager）
 *
 * 用 stub engine 驱动 outlet（对齐 features.render-data.test.ts 的模式）：
 * `engine.data` 直写数据域并同步落位 `[data-view-hash]` 视图容器（含嵌套 outlet），
 * 同时把视图 HTML 解析进容器——使 `<autospark-view-meta>` 真实存在于运行 DOM，
 * 从而同时覆盖阶段 A（路由级声明）与阶段 B（视图级 ViewMeta 覆盖）。
 */

import { describe, it, expect, beforeEach, afterEach, afterAll } from "bun:test";
import { setupTestEnvironment } from "./test-setup";

setupTestEnvironment();

/** mockView 挂的 fetch mock 在用例间共享，文件结束后必须还原——
 *  否则泄漏给后续文件（bun 同进程顺序跑），让「视图加载失败」类用例假性成功 */
const originalFetch = globalThis.fetch;
afterAll(() => {
    (globalThis as any).fetch = originalFetch;
});

const win = (globalThis as any).window;
(globalThis as any).HTMLElement = win.HTMLElement;
(globalThis as any).Event = win.Event;
(globalThis as any).CustomEvent = win.CustomEvent;
(globalThis as any).history = win.history;
(globalThis as any).location = win.location;
(globalThis as any).DOMParser = win.DOMParser;

const sleep = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

function meta(name: string) {
    return document.head.querySelector(`meta[name="${name}"]`);
}
function og(property: string) {
    return document.head.querySelector(`meta[property="${property}"]`);
}
function canonical() {
    return document.head.querySelector('link[rel="canonical"]');
}
function jsonLdScript() {
    return document.head.querySelector('script[type="application/ld+json"]');
}

/**
 * 设置「当前视图 HTML」并挂上 fetch mock（路由的 view 用字符串路径，加载时统一走此 mock）。
 * 便于测试中途更换视图内容（keepAlive 复用场景）。
 */
let currentHtml = "";
function mockView(html: string) {
    currentHtml = html;
    (globalThis as any).fetch = async () =>
        ({
            ok: true,
            status: 200,
            statusText: "OK",
            text: async () => currentHtml,
            json: async () => ({}),
        }) as any;
}

/** 创建 stub engine：engine.data 合并数据域 + 落位视图容器（含嵌套 outlet）并插入 HTML 内容 */
function createEngineStub(rootOutlet: HTMLElement) {
    const comps = new WeakMap<HTMLElement, any>();
    const makeComp = () => ({
        data: {
            views: [] as any[],
            ephemeral: { hash: "", html: "", ready: false },
            active: "",
        },
    });

    function ensureContainer(outletEl: HTMLElement, entry: any) {
        let host = outletEl.querySelector(`[data-view-hash="${entry.hash}"]`);
        if (!host) {
            host = document.createElement("div");
            host.setAttribute("data-view-hash", entry.hash);
            const content = document.createElement("div");
            host.appendChild(content);
            const nestedOutlet = document.createElement("div");
            nestedOutlet.setAttribute("data-autospark-outlet", "");
            host.appendChild(nestedOutlet);
            outletEl.appendChild(host);
            comps.set(nestedOutlet, makeComp());
        }
        (host.firstElementChild as HTMLElement).innerHTML = entry.ready
            ? entry.html || ""
            : "";
    }

    function writeData(outletEl: HTMLElement, patch: Record<string, any>) {
        const comp = comps.get(outletEl);
        if (!comp) return;
        if (patch.ephemeral) {
            comp.data.ephemeral = patch.ephemeral;
            outletEl.querySelectorAll("[data-view-hash]").forEach((el) => el.remove());
            ensureContainer(outletEl, patch.ephemeral);
        }
        if (patch.views) {
            comp.data.views = patch.views;
            for (const entry of patch.views) ensureContainer(outletEl, entry);
        }
        if (typeof patch.active === "string") comp.data.active = patch.active;
    }

    comps.set(rootOutlet, makeComp());

    return {
        engine: {
            // 短路 outlet 组件注册（stub 不需要完整 registerComponent 面）
            getComponentDeclaration: () => ({ name: "autospark.outlet" }),
            getComponent: (el: HTMLElement) => comps.get(el) ?? null,
            data: (el: HTMLElement, patch: Record<string, any>) => writeData(el, patch),
            destroy() {},
        } as any,
    };
}

async function createRouter(routes: any[], options: any = {}) {
    const { AutoSparkRouter } = await import("@/router");
    const host = document.createElement("div");
    const outlet = document.createElement("div");
    outlet.setAttribute("data-autospark-outlet", "");
    host.appendChild(outlet);
    document.body.appendChild(host);
    const { engine } = createEngineStub(outlet);
    // base 显式固定为 "/"：默认的 getBaseUrl 会按当前 URL 目录推断，
    // 上一测试遗留的深层路径会让下一测试的 base 被误判成 "/parent/child/"
    const router = new AutoSparkRouter(host, { engine, base: "/", routes, ...options });
    // 等待 attach 完成（routes.load → loaders → history.listen）与初始导航
    await sleep(40);
    return router;
}

/** 种子 head：标题 + description + canonical（用于验证 adopt / restore 语义） */
function seedHead() {
    document.head.innerHTML =
        '<meta charset="UTF-8"><title>种子标题</title>' +
        '<meta name="description" content="种子描述">' +
        '<link rel="canonical" href="https://seed.example.com/">';
}

const VIEW_FILE = "pages/view.html";

describe("SEO head 管理", () => {
    let router: any;

    beforeEach(() => {
        seedHead();
        currentHtml = "";
        // 复位 URL，避免上一测试遗留的深层路径影响本测试的初始导航
        (globalThis as any).history.replaceState(null, "", "/");
    });

    afterEach(async () => {
        await sleep(30);
        router?.detach?.();
        router = undefined;
        document.body.innerHTML = "";
    });

    describe("阶段 A：路由级声明", () => {
        it("路由未声明标题时保持种子标题", async () => {
            mockView("<div>首页</div>");
            router = await createRouter([{ path: "/", view: VIEW_FILE }]);

            await router.push("/");
            await sleep();

            expect(document.title).toBe("种子标题");
        });

        it("route.title 写入 document.title", async () => {
            mockView("<div>关于</div>");
            router = await createRouter([
                { path: "/", children: [{ path: "about", title: "关于页", view: VIEW_FILE }] },
            ]);

            await router.push("/about");
            await sleep();

            expect(document.title).toBe("关于页");
        });

        it("meta.title 覆盖 route.title", async () => {
            mockView("<div>设置</div>");
            router = await createRouter([
                {
                    path: "/",
                    children: [
                        {
                            path: "settings",
                            title: "路由标题",
                            meta: { title: "META 标题" },
                            view: VIEW_FILE,
                        },
                    ],
                },
            ]);

            await router.push("/settings");
            await sleep();

            expect(document.title).toBe("META 标题");
        });

        it("titleTemplate 格式化标题", async () => {
            mockView("<div>关于</div>");
            router = await createRouter(
                [{ path: "/", children: [{ path: "about", title: "关于", view: VIEW_FILE }] }],
                { head: { titleTemplate: "%s - 麒麟商店" } },
            );

            await router.push("/about");
            await sleep();

            expect(document.title).toBe("关于 - 麒麟商店");
        });

        it("description / canonical / robots 注入并带管理标记", async () => {
            mockView("<div>产品</div>");
            router = await createRouter([
                {
                    path: "/",
                    children: [
                        {
                            path: "product",
                            title: "产品页",
                            meta: {
                                description: "麒麟手机产品列表",
                                canonical: "/product",
                                robots: "index, follow",
                            },
                            view: VIEW_FILE,
                        },
                    ],
                },
            ]);

            await router.push("/product");
            await sleep();

            const desc = meta("description");
            expect(desc?.getAttribute("content")).toBe("麒麟手机产品列表");
            expect(desc?.hasAttribute("data-autospark-seo")).toBe(true);

            expect(canonical()?.getAttribute("href")).toBe("/product");

            expect(meta("robots")?.getAttribute("content")).toBe("index, follow");
        });

        it("siteUrl 把相对 canonical 解析为绝对地址", async () => {
            mockView("<div>关于</div>");
            router = await createRouter(
                [
                    {
                        path: "/",
                        children: [{ path: "about", meta: { canonical: "/about" }, view: VIEW_FILE }],
                    },
                ],
                { head: { siteUrl: "https://example.com" } },
            );

            await router.push("/about");
            await sleep();

            expect(canonical()?.getAttribute("href")).toBe("https://example.com/about");
        });

        it("父 → 子合并：子继承父声明的 description / canonical", async () => {
            mockView("<div>详情</div>");
            router = await createRouter([
                {
                    path: "/",
                    children: [
                        {
                            path: "parent",
                            meta: { description: "父层描述", canonical: "/parent" },
                            view: VIEW_FILE,
                            children: [{ path: "child", title: "子页", view: VIEW_FILE }],
                        },
                    ],
                },
            ]);

            await router.push("/parent/child");
            await sleep();

            expect(meta("description")?.getAttribute("content")).toBe("父层描述");
            expect(canonical()?.getAttribute("href")).toBe("/parent");
            expect(document.title).toBe("子页");
        });

        it("子覆盖父的 description", async () => {
            mockView("<div>详情</div>");
            router = await createRouter([
                {
                    path: "/",
                    children: [
                        {
                            path: "parent",
                            meta: { description: "父层描述" },
                            view: VIEW_FILE,
                            children: [
                                { path: "child", meta: { description: "子层描述" }, view: VIEW_FILE },
                            ],
                        },
                    ],
                },
            ]);

            await router.push("/parent/child");
            await sleep();

            expect(meta("description")?.getAttribute("content")).toBe("子层描述");
        });

        it("Open Graph 标签注入（对象键自动补 og: 前缀）", async () => {
            mockView("<div>商品</div>");
            router = await createRouter([
                {
                    path: "/",
                    children: [
                        {
                            path: "shop",
                            meta: { og: { title: "麒麟商店", image: "/hero.png" } },
                            view: VIEW_FILE,
                        },
                    ],
                },
            ]);

            await router.push("/shop");
            await sleep();

            expect(og("og:title")?.getAttribute("content")).toBe("麒麟商店");
            expect(og("og:image")?.getAttribute("content")).toBe("/hero.png");
        });

        it("Open Graph 对象键逐键合并（子补 og:image，保留父的 og:title）", async () => {
            mockView("<div>详情</div>");
            router = await createRouter([
                {
                    path: "/",
                    children: [
                        {
                            path: "parent",
                            meta: { og: { title: "父层标题" } },
                            view: VIEW_FILE,
                            children: [
                                { path: "child", meta: { og: { image: "/child.png" } }, view: VIEW_FILE },
                            ],
                        },
                    ],
                },
            ]);

            await router.push("/parent/child");
            await sleep();

            expect(og("og:title")?.getAttribute("content")).toBe("父层标题");
            expect(og("og:image")?.getAttribute("content")).toBe("/child.png");
        });

        it("JSON-LD 结构化数据注入", async () => {
            mockView("<div>首页</div>");
            router = await createRouter([
                {
                    path: "/",
                    meta: {
                        jsonLd: {
                            "@context": "https://schema.org",
                            "@type": "WebSite",
                            name: "麒麟商店",
                        },
                    },
                    view: VIEW_FILE,
                },
            ]);

            await router.push("/");
            await sleep();

            const script = jsonLdScript();
            expect(script).not.toBeNull();
            expect(script?.hasAttribute("data-autospark-seo")).toBe(true);
            const payload = JSON.parse(script?.textContent ?? "null");
            expect(payload["@type"]).toBe("WebSite");
            expect(payload.name).toBe("麒麟商店");
        });

        it("未声明的动态字段被主动清除（noindex / canonical 不跨路由残留）", async () => {
            mockView("<div>B</div>");
            router = await createRouter([
                {
                    path: "/",
                    children: [
                        {
                            path: "a",
                            meta: { canonical: "/a", robots: "noindex, nofollow" },
                            view: VIEW_FILE,
                        },
                        { path: "b", view: VIEW_FILE },
                    ],
                },
            ]);

            await router.push("/a");
            await sleep();
            expect(canonical()?.getAttribute("href")).toBe("/a");
            expect(meta("robots")?.getAttribute("content")).toBe("noindex, nofollow");

            await router.push("/b");
            await sleep();
            expect(canonical()?.getAttribute("href")).toBe("https://seed.example.com/");
            expect(meta("robots")).toBeNull();
        });

        it("404 未匹配路由自动 noindex", async () => {
            mockView("<div>首页</div>");
            router = await createRouter([{ path: "/", title: "首页", view: VIEW_FILE }]);

            await router.push("/nonexistent");
            await sleep();

            expect(meta("robots")?.getAttribute("content")).toBe("noindex, nofollow");
        });
    });

    describe("关闭开关", () => {
        it("head: false 时完全不读写 <head>", async () => {
            mockView("<div>关于</div>");
            router = await createRouter(
                [
                    {
                        path: "/",
                        children: [
                            { path: "about", title: "关于", meta: { description: "D" }, view: VIEW_FILE },
                        ],
                    },
                ],
                { head: false },
            );

            await router.push("/about");
            await sleep();

            expect(document.title).toBe("种子标题");
            expect(meta("description")?.getAttribute("content")).toBe("种子描述");
            expect(document.head.querySelectorAll("[data-autospark-seo]").length).toBe(0);
        });

        it("meta.seo: false 关闭单路由管理（撤销此前写入，回到种子状态）", async () => {
            mockView("<div>B</div>");
            router = await createRouter([
                {
                    path: "/",
                    children: [
                        {
                            path: "a",
                            title: "A 页",
                            meta: { description: "A 描述", canonical: "/a" },
                            view: VIEW_FILE,
                        },
                        { path: "b", meta: { seo: false }, view: VIEW_FILE },
                    ],
                },
            ]);

            await router.push("/a");
            await sleep();
            expect(document.title).toBe("A 页");
            expect(canonical()?.getAttribute("href")).toBe("/a");

            await router.push("/b");
            await sleep();
            expect(document.title).toBe("种子标题");
            expect(meta("description")?.getAttribute("content")).toBe("种子描述");
            expect(canonical()?.getAttribute("href")).toBe("https://seed.example.com/");
            expect(document.head.querySelectorAll("[data-autospark-seo]").length).toBe(0);
        });
    });

    describe("阶段 B：视图级 ViewMeta 覆盖", () => {
        it("路由未声明时，ViewMeta 独立声明生效", async () => {
            mockView(
                '<div class="detail"><autospark-view-meta title="详情标题" description="详情描述" /></div>',
            );
            router = await createRouter([
                { path: "/", children: [{ path: "detail", view: VIEW_FILE }] },
            ]);

            await router.push("/detail");
            await sleep();

            expect(document.title).toBe("详情标题");
            expect(meta("description")?.getAttribute("content")).toBe("详情描述");
        });

        it("ViewMeta 覆盖路由声明的标题与描述", async () => {
            mockView(
                '<div class="detail"><autospark-view-meta title="视图标题" description="视图描述" /></div>',
            );
            router = await createRouter(
                [
                    {
                        path: "/",
                        children: [
                            {
                                path: "detail",
                                title: "路由标题",
                                meta: { description: "路由描述" },
                                view: VIEW_FILE,
                            },
                        ],
                    },
                ],
                { head: { titleTemplate: "%s - 站点" } },
            );

            await router.push("/detail");
            await sleep();

            expect(document.title).toBe("视图标题 - 站点");
            expect(meta("description")?.getAttribute("content")).toBe("视图描述");
        });

        it("ViewMeta 的 og（JSON 属性）与 canonical 生效", async () => {
            mockView(
                '<div class="shop"><autospark-view-meta canonical="/shop" og=\'{"title":"麒麟商店"}\' /></div>',
            );
            router = await createRouter(
                [{ path: "/", children: [{ path: "shop", view: VIEW_FILE }] }],
                { head: { siteUrl: "https://example.com" } },
            );

            await router.push("/shop");
            await sleep();

            expect(canonical()?.getAttribute("href")).toBe("https://example.com/shop");
            expect(og("og:title")?.getAttribute("content")).toBe("麒麟商店");
        });

        it("ViewMeta 的 seo=false 撤销本路由 head 管理", async () => {
            mockView('<div class="off"><autospark-view-meta seo="false" title="不该出现" /></div>');
            router = await createRouter([
                {
                    path: "/",
                    children: [
                        {
                            path: "off",
                            title: "路由标题",
                            meta: { description: "路由描述" },
                            view: VIEW_FILE,
                        },
                    ],
                },
            ]);

            await router.push("/off");
            await sleep();

            expect(document.title).toBe("种子标题");
            expect(meta("description")?.getAttribute("content")).toBe("种子描述");
            expect(document.head.querySelectorAll("[data-autospark-seo]").length).toBe(0);
        });

        it("keepAlive 缓存的旧视图 ViewMeta 不会被误采", async () => {
            mockView('<div class="a"><autospark-view-meta title="A 视图标题" /></div>');
            router = await createRouter([
                {
                    path: "/",
                    children: [
                        { path: "a", keepAlive: true, view: VIEW_FILE },
                        { path: "b", keepAlive: true, view: VIEW_FILE },
                    ],
                },
            ]);

            await router.push("/a");
            await sleep();
            expect(document.title).toBe("A 视图标题");

            // 切到 b：换视图内容（keepAlive 使 a 的容器与 ViewMeta 仍留在 DOM）
            mockView('<div class="b"><autospark-view-meta title="B 视图标题" /></div>');
            await router.push("/b");
            await sleep();
            expect(document.title).toBe("B 视图标题");
        });
    });

    describe("生命周期与特殊场景", () => {
        it("模态路由不触发 head 管理（标题保持底页）", async () => {
            mockView("<div>关于</div>");
            const dialogRoute: any = { path: "/dialog", modal: true, view: document.createElement("div") };
            dialogRoute.view.innerHTML = "<autospark-view-meta title='模态标题' />";

            router = await createRouter([
                {
                    path: "/",
                    children: [
                        { path: "about", title: "关于页", view: VIEW_FILE },
                        dialogRoute,
                    ],
                },
            ]);

            await router.push("/about");
            await sleep();
            const titleBefore = document.title;
            expect(titleBefore).toBe("关于页");

            // _initModals 未在 attach 中调用，测试手动补上模态容器
            (router as any).modalContainer = document.createElement("div");
            document.body.appendChild((router as any).modalContainer);

            // 模态导航不经 onRouteUpdate：直接盯住阶段 A 的入口不应被调用
            let phaseACalls = 0;
            const original = router._headApplyRoutePhase.bind(router);
            router._headApplyRoutePhase = (...args: any[]) => {
                phaseACalls++;
                return original(...args);
            };

            await router.openModal({ route: dialogRoute });
            await sleep();

            expect(phaseACalls).toBe(0);
            expect(document.title).toBe(titleBefore);
        });

        it("detach 撤销全部写入（受管标签移除 / 种子还原）", async () => {
            mockView("<div>关于</div>");
            router = await createRouter([
                {
                    path: "/",
                    children: [
                        {
                            path: "about",
                            title: "关于页",
                            meta: { description: "关于描述", canonical: "/about" },
                            view: VIEW_FILE,
                        },
                    ],
                },
            ]);

            await router.push("/about");
            await sleep();
            expect(document.title).toBe("关于页");

            router.detach();
            router = undefined;

            expect(document.title).toBe("种子标题");
            expect(meta("description")?.getAttribute("content")).toBe("种子描述");
            expect(canonical()?.getAttribute("href")).toBe("https://seed.example.com/");
            expect(document.head.querySelectorAll("[data-autospark-seo]").length).toBe(0);
        });

        it("hash 模式 attach 时一次性告警", async () => {
            mockView("<div>关于</div>");
            const warnings: string[] = [];
            const logger = {
                debug: () => {},
                info: () => {},
                warn: (message: string) => warnings.push(String(message)),
                error: () => {},
            };

            router = await createRouter(
                [{ path: "/", children: [{ path: "about", view: VIEW_FILE }] }],
                { mode: "hash", logger },
            );

            expect(warnings.some((w) => w.includes("hash"))).toBe(true);
        });
    });
});
