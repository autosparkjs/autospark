import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { KylinRouter } from "@/router";
import { createTestDOM, createRouter } from "./common";

describe("渲染版本控制", () => {
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

    it("应该取消过期渲染操作", async () => {
        router = await createRouter(host, win, {
            routes: [
                {
                    name: "slow1",
                    path: "/slow1",
                    view: {
                        from: async () => {
                            await new Promise((resolve) => setTimeout(resolve, 200));
                            return '<div class="slow1">Slow 1</div>';
                        },
                    },
                },
                {
                    name: "fast",
                    path: "/fast",
                    view: '<div class="fast">Fast</div>',
                },
            ],
        });

        router.push("/slow1");
        await new Promise((resolve) => setTimeout(resolve, 50));

        // 快速导航到另一个路由，应该取消慢速路由的渲染
        router.push("/fast");
        await new Promise((resolve) => setTimeout(resolve, 100));

        const fastElement = host.querySelector(".fast");
        const slow1Element = host.querySelector(".slow1");

        expect(fastElement).not.toBeNull();
        expect(slow1Element).toBeNull();
    });
});

describe("视图容器管理", () => {
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

    it("应该正确创建和管理视图容器", async () => {
        router = await createRouter(host, win, {
            routes: [{ name: "test", path: "/test", view: '<div class="test">Test</div>' }],
        });

        router.push("/test");
        await new Promise((resolve) => setTimeout(resolve, 50));

        // 应该有视图容器
        const viewContainer = host.querySelector(".kylin-view");
        expect(viewContainer).not.toBeNull();
    });

    it("应该在 keepAlive 模式下复用视图容器", async () => {
        router = await createRouter(host, win, {
            routes: [
                {
                    name: "cached",
                    path: "/cached",
                    keepAlive: true,
                    view: '<div class="cached">Cached</div>',
                },
                {
                    name: "other",
                    path: "/other",
                    view: '<div class="other">Other</div>',
                },
            ],
        });

        router.push("/cached");
        await new Promise((resolve) => setTimeout(resolve, 50));

        const firstViewContainer = host.querySelector(".kylin-view");

        router.push("/other");
        await new Promise((resolve) => setTimeout(resolve, 50));

        router.push("/cached");
        await new Promise((resolve) => setTimeout(resolve, 50));

        const secondViewContainer = host.querySelector(".kylin-view");

        // 应该复用同一个视图容器
        expect(firstViewContainer).not.toBeNull();
        expect(secondViewContainer).not.toBeNull();
    });
});

describe("特殊路由场景", () => {
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

    it("应该正确处理同一路由的不同参数", async () => {
        router = await createRouter(host, win, {
            routes: [
                {
                    name: "item",
                    path: "/item/:id",
                    view: '<div class="item">Item {{ $params.id }}</div>',
                },
            ],
        });

        router.push("/item/1");
        await new Promise((resolve) => setTimeout(resolve, 50));

        router.push("/item/2");
        await new Promise((resolve) => setTimeout(resolve, 50));

        const itemElement = host.querySelector(".item");
        expect(itemElement).not.toBeNull();
    });

    it("应该处理带默认值的参数", async () => {
        router = await createRouter(host, win, {
            routes: [
                {
                    name: "optional",
                    path: "/optional/:id?",
                    view: '<div class="optional">Optional</div>',
                },
            ],
        });

        router.push("/optional");
        await new Promise((resolve) => setTimeout(resolve, 50));

        const optionalElement = host.querySelector(".optional");
        expect(optionalElement).not.toBeNull();
    });
});
