import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { KylinRouter } from "@/router";
import { createTestDOM, createRouter } from "./common";

describe("嵌套路由渲染", () => {
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

    it("应该正确渲染一层嵌套路由", async () => {
        router = await createRouter(host, win, {
            routes: {
                name: "app",
                path: "/",
                view: '<div class="app">App <kylin-outlet></kylin-outlet></div>',
                children: [
                    {
                        name: "dashboard",
                        path: "dashboard",
                        view: '<div class="dashboard">Dashboard</div>',
                    },
                ],
            },
        });

        router.push("/dashboard");
        await new Promise((resolve) => setTimeout(resolve, 100));

        const appElement = host.querySelector(".app");
        const dashboardElement = host.querySelector(".dashboard");
        expect(appElement).not.toBeNull();
        expect(dashboardElement).not.toBeNull();
    });

    it("应该正确渲染多层嵌套路由", async () => {
        router = await createRouter(host, win, {
            routes: {
                name: "root",
                path: "/",
                view: '<div class="root">Root <kylin-outlet></kylin-outlet></div>',
                children: [
                    {
                        name: "level1",
                        path: "level1",
                        view: '<div class="level1">Level1 <kylin-outlet></kylin-outlet></div>',
                        children: [
                            {
                                name: "level2",
                                path: "level2",
                                view: '<div class="level2">Level2 <kylin-outlet></kylin-outlet></div>',
                                children: [
                                    {
                                        name: "level3",
                                        path: "level3",
                                        view: '<div class="level3">Level3 Content</div>',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        });

        router.push("/level1/level2/level3");
        await new Promise((resolve) => setTimeout(resolve, 150));

        const rootElement = host.querySelector(".root");
        const level1Element = host.querySelector(".level1");
        const level2Element = host.querySelector(".level2");
        const level3Element = host.querySelector(".level3");

        expect(rootElement).not.toBeNull();
        expect(level1Element).not.toBeNull();
        expect(level2Element).not.toBeNull();
        expect(level3Element).not.toBeNull();
        expect(level3Element?.textContent).toBe("Level3 Content");
    });

    it("应该正确渲染混合嵌套路由（有参数化子路由）", async () => {
        router = await createRouter(host, win, {
            routes: {
                name: "app",
                path: "/",
                view: '<div class="app">App <kylin-outlet></kylin-outlet></div>',
                children: [
                    {
                        name: "users",
                        path: "users",
                        view: '<div class="users">Users <kylin-outlet></kylin-outlet></div>',
                        children: [
                            {
                                name: "user-detail",
                                path: ":id",
                                view: '<div class="user-detail">User {{ $params.id }}</div>',
                            },
                        ],
                    },
                ],
            },
        });

        router.push("/users/42");
        await new Promise((resolve) => setTimeout(resolve, 150));

        const appElement = host.querySelector(".app");
        const usersElement = host.querySelector(".users");
        const userDetailElement = host.querySelector(".user-detail");

        expect(appElement).not.toBeNull();
        expect(usersElement).not.toBeNull();
        expect(userDetailElement).not.toBeNull();
    });
});

describe("多级路由切换", () => {
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

    it("应该支持从深层路由直接跳转到根路由", async () => {
        router = await createRouter(host, win, {
            routes: {
                name: "root",
                path: "/",
                view: '<div class="root">Root <kylin-outlet></kylin-outlet></div>',
                children: [
                    {
                        name: "level1",
                        path: "level1",
                        view: '<div class="level1">Level1 <kylin-outlet></kylin-outlet></div>',
                        children: [
                            {
                                name: "level2",
                                path: "level2",
                                view: '<div class="level2">Level2</div>',
                            },
                        ],
                    },
                ],
            },
        });

        router.push("/level1/level2");
        await new Promise((resolve) => setTimeout(resolve, 50));

        router.push("/");
        await new Promise((resolve) => setTimeout(resolve, 50));

        const rootElement = host.querySelector(".root");
        const level2Element = host.querySelector(".level2");

        expect(rootElement).not.toBeNull();
        expect(level2Element).toBeNull();
    });

    it("应该支持从根路由跳转到深层路由", async () => {
        router = await createRouter(host, win, {
            routes: {
                name: "root",
                path: "/",
                view: '<div class="root">Root <kylin-outlet></kylin-outlet></div>',
                children: [
                    {
                        name: "level1",
                        path: "level1",
                        view: '<div class="level1">Level1 <kylin-outlet></kylin-outlet></div>',
                        children: [
                            {
                                name: "level2",
                                path: "level2",
                                view: '<div class="level2">Level2</div>',
                            },
                        ],
                    },
                ],
            },
        });

        router.push("/");
        await new Promise((resolve) => setTimeout(resolve, 50));

        router.push("/level1/level2");
        await new Promise((resolve) => setTimeout(resolve, 50));

        const rootElement = host.querySelector(".root");
        const level1Element = host.querySelector(".level1");
        const level2Element = host.querySelector(".level2");

        expect(rootElement).not.toBeNull();
        expect(level1Element).not.toBeNull();
        expect(level2Element).not.toBeNull();
    });

    it("应该支持同层级之间的路由切换", async () => {
        router = await createRouter(host, win, {
            routes: {
                name: "root",
                path: "/",
                view: '<div class="root">Root <kylin-outlet></kylin-outlet></div>',
                children: [
                    { name: "a", path: "a", view: '<div class="a">Page A</div>' },
                    { name: "b", path: "b", view: '<div class="b">Page B</div>' },
                    { name: "c", path: "c", view: '<div class="c">Page C</div>' },
                ],
            },
        });

        router.push("/a");
        await new Promise((resolve) => setTimeout(resolve, 50));

        router.push("/b");
        await new Promise((resolve) => setTimeout(resolve, 50));

        router.push("/c");
        await new Promise((resolve) => setTimeout(resolve, 50));

        const rootElement = host.querySelector(".root");
        const cElement = host.querySelector(".c");
        const aElement = host.querySelector(".a");

        expect(rootElement).not.toBeNull();
        expect(cElement).not.toBeNull();
        expect(aElement).toBeNull();
    });
});
