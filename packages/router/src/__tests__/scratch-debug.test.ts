import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { setupTestEnvironment } from "./test-setup";

setupTestEnvironment();
const win = (globalThis as any).window;
(globalThis as any).HTMLElement = win.HTMLElement;
(globalThis as any).Event = win.Event;
(globalThis as any).CustomEvent = win.CustomEvent;
(globalThis as any).history = win.history;
(globalThis as any).location = win.location;
(globalThis as any).DOMParser = win.DOMParser;

const sleep = (ms = 100) => new Promise((r) => setTimeout(r, ms));

function createEngineStub(rootOutlet: HTMLElement) {
    const comps = new WeakMap<HTMLElement, any>();
    const makeComp = () => ({
        data: { views: [] as any[], ephemeral: { hash: "", html: "", ready: false }, active: "" },
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
        (host.firstElementChild as HTMLElement).innerHTML = entry.ready ? entry.html || "" : "";
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
    const router = new AutoSparkRouter(host, { engine, routes, ...options });
    await sleep(40);
    return router;
}

let currentHtml = "";
const view = () => ({ from: async () => currentHtml });

function seedHead() {
    document.head.innerHTML =
        '<meta charset="UTF-8"><title>种子标题</title>' +
        '<meta name="description" content="种子描述">' +
        '<link rel="canonical" href="https://seed.example.com/">';
}

describe("debug", () => {
    let router: any;
    beforeEach(() => {
        seedHead();
        currentHtml = "";
    });
    afterEach(async () => {
        await sleep(30);
        router?.detach?.();
        router = undefined;
        document.body.innerHTML = "";
    });

    it("first: 父→子合并（passes in real file）", async () => {
        currentHtml = "<div>详情</div>";
        router = await createRouter([
            {
                path: "/",
                children: [
                    {
                        path: "parent",
                        meta: { description: "父层描述", canonical: "/parent" },
                        view: view(),
                        children: [{ path: "child", title: "子页", view: view() }],
                    },
                ],
            },
        ]);
        await router.push("/parent/child");
        await sleep();
        console.log("T1 title:", JSON.stringify(document.title), "desc:", meta("description")?.getAttribute("content"));
    });

    it("second: 子覆盖父（fails in real file）", async () => {
        currentHtml = "<div>详情</div>";
        router = await createRouter([
            {
                path: "/",
                children: [
                    {
                        path: "parent",
                        meta: { description: "父层描述" },
                        view: view(),
                        children: [{ path: "child", meta: { description: "子层描述" }, view: view() }],
                    },
                ],
            },
        ]);
        const navLog: string[] = [];
        router.on("navigation:end", () => navLog.push("end"));
        router.on("navigation:cancel", () => navLog.push("cancel"));
        await router.push("/parent/child");
        await sleep();
        console.log("T2 navLog:", JSON.stringify(navLog));
        console.log(
            "T2 current:",
            JSON.stringify(
                router.routes.current.map((m: any) => ({
                    hasRoute: !!m.route,
                    path: m.route?.path,
                    meta: m.route?.meta,
                    hash: m.hash,
                })),
            ),
        );
        console.log("T2 routeDecl:", JSON.stringify((router as any)._headRouteDecl));
        console.log("T2 tags:", (router as any)._headTags?.map((t: any) => [t.created, t.el.outerHTML]));
        console.log("T2 location:", router.location.pathname);
        console.log(
            "T2 root:",
            JSON.stringify(router.routes.root, (k, v) => (k.startsWith("_") ? undefined : v)),
        );
        const m = router.routes.match("/parent/child");
        console.log(
            "T2 match:",
            JSON.stringify((m || []).map((x: any) => ({ hasRoute: !!x.route, path: x.route?.path }))),
        );
        console.log("T2 base:", JSON.stringify((router as any).options.base));
        expect(1).toBe(1);
    });

    it("third: ViewMeta 独立声明", async () => {
        currentHtml = '<div class="detail"><autospark-view-meta title="详情标题" description="详情描述" /></div>';
        router = await createRouter([{ path: "/", children: [{ path: "detail", view: view() }] }]);
        await router.push("/detail");
        await sleep();
        console.log("T3 title:", JSON.stringify(document.title));
        console.log("T3 routeDecl:", JSON.stringify((router as any)._headRouteDecl));
        console.log("T3 viewDecl:", JSON.stringify(collectViewDebug(router, router.routes.current)));
        console.log("T3 metas:", router.host.querySelectorAll("autospark-view-meta").length);
        console.log("T3 DOM:", router.host.innerHTML);
        expect(1).toBe(1);
    });
});

function meta(name: string) {
    return document.head.querySelector(`meta[name="${name}"]`);
}

function collectViewDebug(router: any, toRoute: any) {
    const host = router.host;
    const metas = host.querySelectorAll("autospark-view-meta");
    const out: any = { found: 0, perLayer: [] };
    for (const m of toRoute) {
        const hits: any[] = [];
        for (const el of Array.from(metas)) {
            let node: Element | null = el;
            while (node && node !== host) {
                const h = node.getAttribute?.("data-view-hash");
                if (h != null) {
                    hits.push({ hash: h, matches: h === m.hash, viewHash: m.hash, routePath: m.route?.path });
                    break;
                }
                node = node.parentElement;
            }
        }
        out.perLayer.push({ route: m.route?.path, hash: m.hash, hits });
    }
    return out;
}
