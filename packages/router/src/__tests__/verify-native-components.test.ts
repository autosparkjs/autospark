import { describe, it, expect, beforeEach } from "bun:test";

/**
 * 创建测试用的 DOM 环境
 */
function createTestDOM() {
    const { Window } = require("happy-dom");
    const win = new Window({ url: "http://localhost/" });

    // @ts-ignore
    globalThis.window = win;
    // @ts-ignore
    globalThis.document = win.document;
    // @ts-ignore
    globalThis.HTMLElement = win.HTMLElement;
    // @ts-ignore
    globalThis.Element = win.Element;
    // @ts-ignore
    globalThis.Node = win.Node;
    // @ts-ignore
    globalThis.Event = win.Event;
    // @ts-ignore
    globalThis.CustomEvent = win.CustomEvent;
    // @ts-ignore
    globalThis.customElements = win.customElements;
    // @ts-ignore
    globalThis.CSSStyleSheet = win.CSSStyleSheet;

    return win.document;
}

describe("原生 Web Components 验证", () => {
    let document: any;

    beforeEach(() => {
        document = createTestDOM();
    });

    it("KylinLink 组件应该能正确导入", async () => {
        const { KylinLink } = await import("@/components/Link");
        expect(KylinLink).toBeDefined();
        expect(KylinLink.name).toBe("KylinLink");
    });

    it("KylinOutlet 组件应该能正确导入", async () => {
        const { KylinOutlet } = await import("@/components/Outlet");
        expect(KylinOutlet).toBeDefined();
        expect(KylinOutlet.name).toBe("KylinOutlet");
    });

    it("KylinRouterElementBase 组件应该能正确导入", async () => {
        const { KylinRouterElementBase } = await import("@/components/Base");
        expect(KylinRouterElementBase).toBeDefined();
        expect(KylinRouterElementBase.name).toBe("KylinRouterElementBase");
    });

    it("kylin-link 自定义元素应该能正确创建", async () => {
        const link = document.createElement("kylin-link");
        expect(link).toBeDefined();
        expect(link.tagName.toLowerCase()).toBe("kylin-link");
    });

    it("kylin-outlet 自定义元素应该能正确创建", async () => {
        const outlet = document.createElement("kylin-outlet");
        expect(outlet).toBeDefined();
        expect(outlet.tagName.toLowerCase()).toBe("kylin-outlet");
    });

    it("kylin-link 和 kylin-outlet 自定义元素应该能正确创建", async () => {
        const link = document.createElement("kylin-link");
        const outlet = document.createElement("kylin-outlet");
        expect(link.tagName.toLowerCase()).toBe("kylin-link");
        expect(outlet.tagName.toLowerCase()).toBe("kylin-outlet");
    });

    it("组件应该能正确通过 HTML 属性设置", async () => {
        // 使用 HTML 属性设置（更符合原生 Web Components 的使用方式）
        const link = document.createElement("kylin-link");
        link.setAttribute("to", "/test");
        link.setAttribute("target", "_blank");

        const outlet = document.createElement("kylin-outlet");
        outlet.setAttribute("layout", "tabs");
        outlet.setAttribute("keepalive", "");

        // 验证 HTML 属性设置成功
        expect(link.getAttribute("to")).toBe("/test");
        expect(link.getAttribute("target")).toBe("_blank");
        expect(outlet.getAttribute("layout")).toBe("tabs");
        expect(outlet.getAttribute("keepalive")).toBe("");
    });
});
