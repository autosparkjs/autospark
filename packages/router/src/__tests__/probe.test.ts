import { describe, it, expect } from "bun:test";
import { setupTestEnvironment } from "./test-setup";

setupTestEnvironment();
const win = (globalThis as any).window;
(globalThis as any).HTMLElement = win.HTMLElement;
(globalThis as any).Event = win.Event;
(globalThis as any).history = win.history;
(globalThis as any).location = win.location;

function mockResponse(view: string) {
    return {
        ok: true, status: 200, statusText: "OK",
        text: async () => view,
        json: async () => ({}),
    } as any;
}

async function createRouter(routes: any[], opts: any = {}) {
    const { AutoSparkRouter } = await import("@/router");
    const host = document.createElement("div");
    const outlet = document.createElement("div");
    outlet.setAttribute("data-autospark-outlet", "");
    host.appendChild(outlet);
    document.body.appendChild(host);
    const engine = {
        getComponentDeclaration: () => ({ name: "autospark.outlet" }),
        getComponent: (el: HTMLElement) => ({ data: { views: [], ephemeral: { hash: "", html: "", ready: false }, active: "" } }),
        data: () => { },
        destroy() { },
    } as any;
    const router = new AutoSparkRouter(host, { engine, routes, ...opts });
    await new Promise((r) => setTimeout(r, 80));
    return router;
}

const routes = [
    { name: "home", path: "/" },
    { name: "user", path: "/user" },
    { name: "profile", path: "/profile" },
    { name: "async", path: "/async" },
    { name: "not-found", path: "*" },
];

describe("probe", () => {
    it("beforeRoute returning string: does it redirect?", async () => {
        const mockFetch = (globalThis as any).fetch = async (u: any) => mockResponse(`<div>${String(u)}</div>`);
        win.history.replaceState(null, "", "/");
        const router = await createRouter(routes);
        router.hooks.add("beforeRoute", ({ to }: any) => {
            const p = to[to.length - 1]?.path;
            console.log("PROBE hook fired, p=", p);
            if (p === "/user") return "/profile";
            return true;
        });
        router.push("/user");
        await new Promise((r) => setTimeout(r, 200));
        console.log("PROBE redirect: location=", win.location.pathname,
            "current last route=", router.routes.current?.[router.routes.current.length - 1]?.route?.path);
        router.detach();
        expect(true).toBe(true);
    });

    it("beforeRoute returning false cancels?", async () => {
        win.history.replaceState(null, "", "/");
        const router = await createRouter(routes);
        let hookFired = 0;
        let rendered = 0;
        router.hooks.add("beforeRoute", ({ to }: any) => {
            hookFired++;
            const p = to[to.length - 1]?.path;
            console.log("PROBE cancel hook fired, p=", p);
            if (p === "/user") return false;
            return true;
        });
        router.hooks.add("beforeRender", () => { rendered++; });
        router.on("navigation:cancel", () => console.log("PROBE cancel event"));
        router.on("navigation:end", () => console.log("PROBE nav end event"));
        router.push("/user");
        await new Promise((r) => setTimeout(r, 200));
        console.log("PROBE cancel: location=", win.location.pathname,
            "current last route=", router.routes.current?.[router.routes.current.length - 1]?.route?.path,
            "hookFired=", hookFired, "beforeRenderCount=", rendered);
        router.detach();
    });

    it("hook ordering & args shape", async () => {
        win.history.replaceState(null, "", "/");
        const router = await createRouter(routes);
        const order: string[] = [];
        router.hooks.add("beforeRoute", (args: any) => { order.push("beforeRoute:" + JSON.stringify(Object.keys(args))); return true; });
        router.hooks.add("beforeRender", (args: any) => { order.push("beforeRender:" + JSON.stringify(Object.keys(args))); });
        router.hooks.add("afterRoute", (args: any) => { order.push("afterRoute:" + JSON.stringify(Object.keys(args))); });
        router.hooks.add("afterRender", (args: any) => { order.push("afterRender:" + JSON.stringify(Object.keys(args))); });
        router.push("/user");
        await new Promise((r) => setTimeout(r, 250));
        console.log("PROBE order:", JSON.stringify(order, null, 0));
        console.log("PROBE current:", JSON.stringify(router.routes.current?.map((m: any) => ({
            id: m.id, url: m.url, path: m.path, routePath: m.route?.path, params: m.params, query: m.query,
        }))));
        router.detach();
    });

    it("routes table shape", async () => {
        win.history.replaceState(null, "", "/");
        const router = await createRouter(routes);
        console.log("PROBE routes.root children:", JSON.stringify(router.routes.root?.children?.map((c: any) => ({ path: c.path, name: c.name }))));
        console.log("PROBE routes props:", Object.keys(router.routes));
        router.detach();
    });
});
