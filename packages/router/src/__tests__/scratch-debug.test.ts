import { it } from "bun:test";
import { setupTestEnvironment } from "./test-setup";

setupTestEnvironment();

const win = (globalThis as any).window;
for (const key of [
    "HTMLElement", "HTMLScriptElement", "HTMLStyleElement", "HTMLTemplateElement",
    "SVGElement", "DocumentFragment", "ShadowRoot", "Text", "Comment",
    "NodeFilter", "TreeWalker", "Range",
    "Event", "MouseEvent", "KeyboardEvent", "CustomEvent", "PointerEvent",
    "getComputedStyle", "customElements", "CSSStyleSheet",
] as const) {
    if ((globalThis as any)[key] === undefined && (win as any)[key] !== undefined) {
        (globalThis as any)[key] = (win as any)[key];
    }
}

const nextTick = () => new Promise<void>((r) => setTimeout(r, 0));

it("scratch: dump tabs html", async () => {
    const { AutoSpark } = await import("autospark");
    const { OUTLET_COMPONENT_CODE, OUTLET_COMPONENT_NAME, registerOutletComponent } = await import("@/engine/outletComponent");
    const { transformXOutlet } = await import("@/engine/xOutlet");

    const host = document.createElement("div");
    host.setAttribute("data-autospark-router", "");
    host.innerHTML = `<div x-outlet="{ mode: 'tabs' }"></div>`;
    transformXOutlet(host);
    document.body.appendChild(host);
    (host as any).router = { push: () => { } };

    const engine = new AutoSpark(host, {}, {
        components: { [OUTLET_COMPONENT_NAME]: OUTLET_COMPONENT_CODE },
    });
    registerOutletComponent(engine);

    const outlet = host.querySelector("[data-autospark-outlet]") as unknown as HTMLElement;
    engine.data(outlet, {
        views: [
            { hash: "ha", url: "/a", title: "A 页", html: "<div>A</div>", ready: true },
            { hash: "hb", url: "/b", title: "B 页", html: "<div>B</div>", ready: true },
        ],
        active: "ha",
    });
    await nextTick();

    const tabsBar = outlet.querySelector(".autospark-outlet-tabs") as HTMLElement;
    console.log("TABS HTML:", tabsBar.outerHTML);
    const comp = engine.getComponent(outlet);
    console.log("comp.data.active:", comp.data.active);
    console.log("comp.data.views.length:", comp.data.views.length);
    document.body.innerHTML = "";
});
