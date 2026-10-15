/**
 * autospark.outlet 组件集成测试（真实 engine，ADR-0003）
 *
 * 覆盖：
 * - x-outlet 简写值透传为 props 表达式（决策 1）
 * - props 缺省值（keepAlive=false / mode=stack）
 * - 视图清单 engine.data 直写 + x-show 缓存语义（决策 6：缓存 = DOM 常驻 + display:none）
 * - tabs 页签条渲染、点击导航、关闭语义（决策 3/4）
 * - 内建样式注入（决策 5）
 */

import { describe, it, expect, afterEach } from "bun:test";
import { setupTestEnvironment } from "./test-setup";

setupTestEnvironment();

const win = (globalThis as any).window;
// engine 编译/运行期引用的一组 DOM 全局（构造器/工具函数）：从 happy-dom 的 Window 桥接。
// 仅补缺，不覆盖 test-setup 已注册的 window/document/Node/MutationObserver 等。
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

/** 等待 scheduler 的 microtask flush（与 engine 测试 helpers 同款） */
const nextTick = () => new Promise<void>((r) => setTimeout(r, 0));

interface BootResult {
    host: HTMLElement;
    engine: any;
    outlet: HTMLElement;
    pushCalls: string[];
}

/**
 * 以自建 engine 模式装配出口（对齐 engineHost：transformXOutlet → 构造 components 注册）。
 * host 带 data-autospark-router 标记并挂 .router stub（组件 _findRouter 的向上遍历协议）。
 */
async function boot(outletTpl: string): Promise<BootResult> {
    const { AutoSpark } = await import("autospark");
    const { OUTLET_COMPONENT_CODE, OUTLET_COMPONENT_NAME, registerOutletComponent } =
        await import("@/engine/outletComponent");
    const { transformXOutlet } = await import("@/engine/xOutlet");

    const host = document.createElement("div");
    host.setAttribute("data-autospark-router", "");
    host.innerHTML = outletTpl;
    transformXOutlet(host);
    document.body.appendChild(host);

    const pushCalls: string[] = [];
    (host as any).router = { push: (url: string) => pushCalls.push(url) };

    const engine = new AutoSpark(host, {}, {
        components: { [OUTLET_COMPONENT_NAME]: OUTLET_COMPONENT_CODE },
    });
    // 触发内建样式注入（组件已经构造 components 命中，注册探测跳过）
    registerOutletComponent(engine);

    const outlet = host.querySelector("[data-autospark-outlet]") as unknown as HTMLElement;
    return { host, engine, outlet, pushCalls };
}

/** 写入两个就绪视图并激活第一个 */
function seedViews(engine: any, outlet: HTMLElement) {
    engine.data(outlet, {
        views: [
            { hash: "ha", url: "/a", title: "A 页", html: "<div>A</div>", ready: true },
            { hash: "hb", url: "/b", title: "B 页", html: "<div>B</div>", ready: true },
        ],
        active: "ha",
    });
}

function viewHost(outlet: HTMLElement, hash: string): HTMLElement | null {
    return outlet.querySelector(`.autospark-outlet-views [data-view-hash="${hash}"]`);
}

function click(el: Element) {
    el.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true }));
}

afterEach(() => {
    document.body.innerHTML = "";
});

describe("autospark.outlet 组件（ADR-0003）", () => {
    it("props 缺省值：mode=stack、keepAlive=false；stack 模式不渲染页签条", async () => {
        const { engine, outlet } = await boot(`<div x-outlet></div>`);
        await nextTick();

        const comp = engine.getComponent(outlet);
        expect(comp.data.mode).toBe("stack");
        expect(comp.data.keepAlive).toBe(false);

        seedViews(engine, outlet);
        await nextTick();
        const tabsBar = outlet.querySelector(".autospark-outlet-tabs") as HTMLElement;
        expect(tabsBar.style.display).toBe("none");
    });

    it("x-outlet 简写值透传为 props 表达式", async () => {
        const { engine, outlet } = await boot(
            `<div x-outlet="{ mode: 'tabs', keepAlive: true }"></div>`,
        );
        await nextTick();

        const comp = engine.getComponent(outlet);
        expect(comp.data.mode).toBe("tabs");
        expect(comp.data.keepAlive).toBe(true);

        seedViews(engine, outlet);
        await nextTick();
        const tabsBar = outlet.querySelector(".autospark-outlet-tabs") as HTMLElement;
        expect(tabsBar.style.display).not.toBe("none");
    });

    it("视图清单：缓存 = DOM 常驻 + display:none，切回原样复用（节点保留）", async () => {
        const { engine, outlet } = await boot(`<div x-outlet="{ keepAlive: true }"></div>`);
        seedViews(engine, outlet);
        await nextTick();

        const hostA = viewHost(outlet, "ha")!;
        const hostB = viewHost(outlet, "hb")!;
        expect(hostA).toBeTruthy();
        expect(hostB).toBeTruthy();
        expect(hostA.style.display).not.toBe("none");
        expect(hostB.style.display).toBe("none");

        // 切到 b 再切回 a：DOM 节点保留（缓存非数据概念，仅显隐切换）
        engine.data(outlet, { active: "hb" });
        await nextTick();
        expect(viewHost(outlet, "ha")!.style.display).toBe("none");
        expect(viewHost(outlet, "hb")!.style.display).not.toBe("none");

        engine.data(outlet, { active: "ha" });
        await nextTick();
        expect(viewHost(outlet, "ha")).toBe(hostA);
        expect(viewHost(outlet, "ha")!.style.display).not.toBe("none");
    });

    it("tabs 页签条：标题渲染、active 类、点击走 router 导航", async () => {
        const { engine, outlet, pushCalls } = await boot(`<div x-outlet="{ mode: 'tabs' }"></div>`);
        seedViews(engine, outlet);
        await nextTick();

        const tabs = outlet.querySelectorAll(".autospark-outlet-tab");
        expect(tabs).toHaveLength(2);
        expect(tabs[0].querySelector(".autospark-outlet-tab-title")!.textContent).toBe("A 页");
        expect(tabs[1].querySelector(".autospark-outlet-tab-title")!.textContent).toBe("B 页");
        expect(tabs[0].classList.contains("is-active")).toBe(true);
        expect(tabs[1].classList.contains("is-active")).toBe(false);

        // 点击非 active 页签 → router.push 其 url
        click(tabs[1]);
        expect(pushCalls).toEqual(["/b"]);

        // 点击 active 页签不导航
        click(tabs[0]);
        expect(pushCalls).toEqual(["/b"]);
    });

    it("页签关闭：关闭非 active 仅销毁；关闭 active 导航到相邻页签；唯一页签无关闭按钮", async () => {
        const { engine, outlet, pushCalls } = await boot(`<div x-outlet="{ mode: 'tabs' }"></div>`);
        seedViews(engine, outlet);
        await nextTick();

        // 关闭非 active 页签 b：清单移除 + DOM 销毁，无导航
        const closeB = outlet
            .querySelectorAll(".autospark-outlet-tab")[1]
            .querySelector(".autospark-outlet-tab-close")!;
        click(closeB);
        await nextTick();

        const comp = engine.getComponent(outlet);
        expect(comp.data.views.map((v: any) => v.hash)).toEqual(["ha"]);
        expect(viewHost(outlet, "hb")).toBeNull();
        expect(pushCalls).toEqual([]);

        // 唯一页签：关闭按钮隐藏（x-show 语义：DOM 常驻 + display:none）
        const closeBtn = outlet.querySelector(".autospark-outlet-tab-close") as HTMLElement;
        expect(closeBtn.style.display).toBe("none");

        // 重新补一个页签后关闭 active 页签 a：导航到相邻（b）
        engine.data(outlet, {
            views: [
                ...comp.data.views,
                { hash: "hb", url: "/b", title: "B 页", html: "<div>B</div>", ready: true },
            ],
        });
        await nextTick();
        const closeA = outlet
            .querySelectorAll(".autospark-outlet-tab")[0]
            .querySelector(".autospark-outlet-tab-close")!;
        click(closeA);
        await nextTick();

        expect(comp.data.views.map((v: any) => v.hash)).toEqual(["hb"]);
        expect(pushCalls).toEqual(["/b"]);
        // 关闭按钮点击不冒泡触发页签导航（push 仅一次）
        expect(pushCalls).toHaveLength(1);
    });

    it("临时通道：ephemeral 槽随 active 指向显隐", async () => {
        const { engine, outlet } = await boot(`<div x-outlet></div>`);
        await nextTick();

        engine.data(outlet, {
            ephemeral: { hash: "tmp", html: "<div>T</div>", ready: true },
            active: "tmp",
        });
        await nextTick();

        const slot = outlet.querySelector(".autospark-outlet-ephemeral") as HTMLElement;
        expect(slot.style.display).not.toBe("none");

        engine.data(outlet, { active: "" });
        await nextTick();
        expect(slot.style.display).toBe("none");
    });

    it("内建 tab 条样式经 injectStylesheet 注入（同 id 幂等）", async () => {
        const { OUTLET_STYLES_ID } = await import("@/engine/outletComponent");
        await boot(`<div x-outlet></div>`);
        const style = document.getElementById(OUTLET_STYLES_ID);
        expect(style).toBeTruthy();
        expect(style!.textContent).toContain(".autospark-outlet-tab");
    });
});
