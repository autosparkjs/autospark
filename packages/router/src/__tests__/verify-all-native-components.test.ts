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

describe("新增原生组件验证", () => {
    let document: any;

    beforeEach(() => {
        document = createTestDOM();
    });

    it("KylinLoading 组件应该能正确导入", async () => {
        const { KylinLoading } = await import("@/components/Loading");
        expect(KylinLoading).toBeDefined();
        expect(KylinLoading.name).toBe("KylinLoading");
    });

    it("KylinFeedback 组件应该能正确导入", async () => {
        const { KylinFeedback } = await import("@/components/Feedback");
        expect(KylinFeedback).toBeDefined();
        expect(KylinFeedback.name).toBe("KylinFeedback");
    });

    it("KylinViewMeta 组件应该能正确导入", async () => {
        const { KylinViewMeta } = await import("@/components/ViewMeta");
        expect(KylinViewMeta).toBeDefined();
        expect(KylinViewMeta.name).toBe("KylinViewMeta");
    });

    it("kylin-loading 自定义元素应该能正确创建", async () => {
        const loading = document.createElement("kylin-loading");
        expect(loading).toBeDefined();
        expect(loading.tagName.toLowerCase()).toBe("kylin-loading");
    });

    it("kylin-feedback 自定义元素应该能正确创建", async () => {
        const feedback = document.createElement("kylin-feedback");
        expect(feedback).toBeDefined();
        expect(feedback.tagName.toLowerCase()).toBe("kylin-feedback");
    });

    it("kylin-view-meta 自定义元素应该能正确创建", async () => {
        const meta = document.createElement("kylin-view-meta");
        expect(meta).toBeDefined();
        expect(meta.tagName.toLowerCase()).toBe("kylin-view-meta");
    });

    it("KylinViewMeta 应该支持 get/set 方法", async () => {
        const { KylinViewMeta } = await import("@/components/ViewMeta");
        const meta = new KylinViewMeta();
        meta.set("title", "测试标题");
        expect(meta.get("title")).toBe("测试标题");
        expect(meta.has("title")).toBe(true);
    });

    it("KylinLoading message 属性应该能正确设置", async () => {
        const loading = document.createElement("kylin-loading") as any;
        loading.setAttribute("message", "加载中...");
        expect(loading.getAttribute("message")).toBe("加载中...");
    });

    it("KylinFeedback 应该支持各种属性设置", async () => {
        const feedback = document.createElement("kylin-feedback") as any;
        feedback.setAttribute("type", "error");
        feedback.setAttribute("message", "错误消息");
        feedback.setAttribute("closeable", "");

        expect(feedback.getAttribute("type")).toBe("error");
        expect(feedback.getAttribute("message")).toBe("错误消息");
        expect(feedback.getAttribute("closeable")).toBe("");
    });

    it("所有新组件都应该不继承 LitElement", async () => {
        const { KylinLoading, KylinFeedback, KylinViewMeta } = await import("@/components");
        const { LitElement } = await import("lit");

        const loading = new KylinLoading();
        const feedback = new KylinFeedback();
        const meta = new KylinViewMeta();

        expect(loading instanceof LitElement).toBe(false);
        expect(feedback instanceof LitElement).toBe(false);
        expect(meta instanceof LitElement).toBe(false);
    });
});
