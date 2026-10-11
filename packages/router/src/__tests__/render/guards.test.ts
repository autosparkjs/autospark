import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { KylinRouter } from "@/router";
import { createTestDOM, createRouter } from "./common";

describe("路由守卫与渲染交互", () => {
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

    it("应该在 beforeEnter 返回 false 时阻止渲染", async () => {
        let shouldBlock = true;

        router = await createRouter(host, win, {
            routes: [
                {
                    name: "home",
                    path: "/",
                    view: '<div class="home">Home</div>',
                },
                {
                    name: "blocked",
                    path: "/blocked",
                    beforeEnter: () => !shouldBlock,
                    view: '<div class="blocked">Blocked</div>',
                },
            ],
        });

        router.push("/blocked");
        await new Promise((resolve) => setTimeout(resolve, 50));

        const blockedElement = host.querySelector(".blocked");
        // 应该被阻止渲染
        expect(blockedElement).toBeNull();
    });

    it("应该在 beforeEnter 返回重定向路径时重定向", async () => {
        router = await createRouter(host, win, {
            routes: [
                {
                    name: "redirect-source",
                    path: "/redirect-source",
                    beforeEnter: () => "/redirect-target",
                    view: '<div class="source">Source</div>',
                },
                {
                    name: "redirect-target",
                    path: "/redirect-target",
                    view: '<div class="target">Target</div>',
                },
            ],
        });

        router.push("/redirect-source");
        await new Promise((resolve) => setTimeout(resolve, 100));

        const sourceElement = host.querySelector(".source");
        const targetElement = host.querySelector(".target");

        expect(sourceElement).toBeNull();
        expect(targetElement).not.toBeNull();
    });

    it("应该支持异步 beforeEnter 守卫", async () => {
        router = await createRouter(host, win, {
            routes: [
                {
                    name: "async-guard",
                    path: "/async-guard",
                    beforeEnter: async () => {
                        await new Promise((resolve) => setTimeout(resolve, 50));
                        return true;
                    },
                    view: '<div class="async-guard">Async Guard</div>',
                },
            ],
        });

        router.push("/async-guard");
        await new Promise((resolve) => setTimeout(resolve, 100));

        const asyncGuardElement = host.querySelector(".async-guard");
        expect(asyncGuardElement).not.toBeNull();
    });
});

describe("渲染钩子", () => {
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

    it("应该在渲染前执行 beforeRender 钩子", async () => {
        let beforeRenderExecuted = false;

        router = await createRouter(host, win, {
            routes: [{ name: "test", path: "/test", view: '<div class="test">Test</div>' }],
        });

        // @ts-ignore
        router.hooks.add("beforeRender", () => {
            beforeRenderExecuted = true;
        });

        router.push("/test");
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(beforeRenderExecuted).toBe(true);
    });

    it("应该在渲染后执行 afterRender 钩子", async () => {
        let afterRenderExecuted = false;

        router = await createRouter(host, win, {
            routes: [{ name: "test", path: "/test", view: '<div class="test">Test</div>' }],
        });

        // @ts-ignore
        router.hooks.add("afterRender", () => {
            afterRenderExecuted = true;
        });

        router.push("/test");
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(afterRenderExecuted).toBe(true);
    });

    it("应该支持异步 beforeRender 钩子", async () => {
        let asyncBeforeRenderExecuted = false;

        router = await createRouter(host, win, {
            routes: [{ name: "test", path: "/test", view: '<div class="test">Test</div>' }],
        });

        // @ts-ignore
        router.hooks.add("beforeRender", async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
            asyncBeforeRenderExecuted = true;
        });

        router.push("/test");
        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(asyncBeforeRenderExecuted).toBe(true);
    });
});
