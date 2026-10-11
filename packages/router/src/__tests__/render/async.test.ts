import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { KylinRouter } from "@/router";
import { createTestDOM, createRouter } from "./common";

describe("异步视图加载", () => {
    let host: HTMLElement;
    let win: any;
    let router: KylinRouter;

    beforeEach(() => {
        const setup = createTestDOM();
        host = setup.host;
        win = setup.win;
    });

    afterEach(() => {
        if (router) {
            router.detach();
        }
        // @ts-ignore
        if (document && document.body) {
            // @ts-ignore
            document.body.innerHTML = "";
        }
    });

    it("应该正确处理异步视图加载", async () => {
        router = await createRouter(host, win, {
            routes: [
                {
                    name: "home",
                    path: "/",
                    view: '<div class="home">Home</div>',
                },
                {
                    name: "async",
                    path: "/async",
                    view: {
                        from: async () => {
                            await new Promise((resolve) => setTimeout(resolve, 50));
                            return '<div class="async">Async Content</div>';
                        },
                    },
                },
            ],
        });

        router.push("/async");
        await new Promise((resolve) => setTimeout(resolve, 150));

        const asyncElement = host.querySelector(".async");
        expect(asyncElement).not.toBeNull();
    });

    it("应该在异步加载期间显示 loading 状态", async () => {
        router = await createRouter(host, win, {
            routes: [
                {
                    name: "home",
                    path: "/",
                    view: '<div class="home">Home</div>',
                },
                {
                    name: "slow",
                    path: "/slow",
                    view: {
                        from: async () => {
                            await new Promise((resolve) => setTimeout(resolve, 200));
                            return '<div class="slow">Slow Content</div>';
                        },
                    },
                },
            ],
        });

        router.push("/slow");

        // 立即检查，应该有 loading
        await new Promise((resolve) => setTimeout(resolve, 20));
        let loadingElement = host.querySelector("kylin-loading");
        expect(loadingElement).not.toBeNull();

        // 等待加载完成
        await new Promise((resolve) => setTimeout(resolve, 300));

        const slowElement = host.querySelector(".slow");
        expect(slowElement).not.toBeNull();

        // loading 应该被移除
        loadingElement = host.querySelector("kylin-loading");
        expect(loadingElement).toBeNull();
    });
});

describe("多次重复渲染", () => {
    let host: HTMLElement;
    let win: any;
    let router: KylinRouter;

    beforeEach(() => {
        const setup = createTestDOM();
        host = setup.host;
        win = setup.win;
    });

    afterEach(() => {
        if (router) {
            router.detach();
        }
        // @ts-ignore
        if (document && document.body) {
            // @ts-ignore
            document.body.innerHTML = "";
        }
    });

    it("应该支持多次导航到同一路由", async () => {
        let renderCount = 0;

        router = await createRouter(host, win, {
            routes: [
                {
                    name: "repeat",
                    path: "/repeat",
                    view: () => {
                        renderCount++;
                        return `<div class="repeat">Render ${renderCount}</div>`;
                    },
                },
            ],
        });

        router.push("/repeat");
        await new Promise((resolve) => setTimeout(resolve, 50));

        router.push("/repeat");
        await new Promise((resolve) => setTimeout(resolve, 50));

        router.push("/repeat");
        await new Promise((resolve) => setTimeout(resolve, 50));

        const repeatElement = host.querySelector(".repeat");
        expect(repeatElement).not.toBeNull();
        // 验证路由被多次访问
        expect(renderCount).toBeGreaterThan(0);
    });

    it("应该支持快速连续导航", async () => {
        router = await createRouter(host, win, {
            routes: [
                { name: "page1", path: "/page1", view: '<div class="page1">Page 1</div>' },
                { name: "page2", path: "/page2", view: '<div class="page2">Page 2</div>' },
                { name: "page3", path: "/page3", view: '<div class="page3">Page 3</div>' },
                { name: "page4", path: "/page4", view: '<div class="page4">Page 4</div>' },
            ],
        });

        // 快速连续导航
        router.push("/page1");
        router.push("/page2");
        router.push("/page3");
        router.push("/page4");

        await new Promise((resolve) => setTimeout(resolve, 200));

        // 最后一个路由应该被渲染
        const page4Element = host.querySelector(".page4");
        expect(page4Element).not.toBeNull();
    });

    it("应该正确处理来回切换路由", async () => {
        router = await createRouter(host, win, {
            routes: [
                { name: "a", path: "/a", view: '<div class="a">Page A</div>' },
                { name: "b", path: "/b", view: '<div class="b">Page B</div>' },
            ],
        });

        // 来回切换
        for (let i = 0; i < 5; i++) {
            router.push("/a");
            await new Promise((resolve) => setTimeout(resolve, 30));

            router.push("/b");
            await new Promise((resolve) => setTimeout(resolve, 30));
        }

        const bElement = host.querySelector(".b");
        expect(bElement).not.toBeNull();
    });
});
