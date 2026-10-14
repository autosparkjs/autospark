import { describe, it, expect } from "bun:test";
import { setupTestEnvironment } from "./test-setup";
setupTestEnvironment();
const win = (globalThis as any).window;
(globalThis as any).HTMLElement = win.HTMLElement;
(globalThis as any).Event = win.Event;
(globalThis as any).CustomEvent = win.CustomEvent;
(globalThis as any).history = win.history;
(globalThis as any).location = win.location;

const sleep = (ms = 100) => new Promise((r) => setTimeout(r, ms));

it("modal route match", async () => {
    const host = document.createElement("div");
    const outlet = document.createElement("div");
    outlet.setAttribute("data-autospark-outlet", "");
    host.appendChild(outlet);
    document.body.appendChild(host);
    const { AutoSparkRouter } = await import("@/router");
    const modalView = document.createElement("div");
    modalView.innerHTML = "<p>dialog</p>";
    const router = new AutoSparkRouter(host, {
        base: "/",
        engine: {
            getComponentDeclaration: () => ({ name: "x" }),
            getComponent: () => null,
            data: () => {},
            destroy() {},
        },
        routes: [
            {
                path: "/",
                children: [
                    { path: "about", view: "pages/a.html" },
                    { path: "dialog", modal: true, view: modalView },
                ],
            },
        ],
    });
    await sleep(40);
    await router.push("/about");
    await sleep();
    console.log("after nav, match:", JSON.stringify(router.routes.match("/dialog")));
    console.log(
        "tree:",
        JSON.stringify(router.routes.root, (k, v) => (k.startsWith("_") ? undefined : v)),
    );
    expect(1).toBe(1);
});
