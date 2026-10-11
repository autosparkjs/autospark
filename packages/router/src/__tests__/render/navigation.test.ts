import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { KylinRouter } from "@/router";
import { createTestDOM, createRouter } from "./common";

describe("导航回退", () => {
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

    it("应该支持 back() 回退到上一个路由", async () => {
        router = await createRouter(host, win, {
            routes: [
                { name: "home", path: "/", view: '<div class="home">Home</div>' },
                { name: "page1", path: "/page1", view: '<div class="page1">Page 1</div>' },
                { name: "page2", path: "/page2", view: '<div class="page2">Page 2</div>' },
            ],
        });

        router.push("/");
        await new Promise((resolve) => setTimeout(resolve, 50));

        router.push("/page1");
        await new Promise((resolve) => setTimeout(resolve, 50));

        router.push("/page2");
        await new Promise((resolve) => setTimeout(resolve, 50));

        router.back();
        await new Promise((resolve) => setTimeout(resolve, 50));

        const page1Element = host.querySelector(".page1");
        const page2Element = host.querySelector(".page2");

        expect(page1Element).not.toBeNull();
        expect(page2Element).toBeNull();
    });

    it("应该支持 forward() 前进到下一个路由", async () => {
        router = await createRouter(host, win, {
            routes: [
                { name: "home", path: "/", view: '<div class="home">Home</div>' },
                { name: "page1", path: "/page1", view: '<div class="page1">Page 1</div>' },
            ],
        });

        router.push("/page1");
        await new Promise((resolve) => setTimeout(resolve, 50));

        router.back();
        await new Promise((resolve) => setTimeout(resolve, 50));

        router.forward();
        await new Promise((resolve) => setTimeout(resolve, 50));

        const page1Element = host.querySelector(".page1");
        expect(page1Element).not.toBeNull();
    });

    it("应该支持 go() 跳转指定步数", async () => {
        router = await createRouter(host, win, {
            routes: [
                { name: "home", path: "/", view: '<div class="home">Home</div>' },
                { name: "page1", path: "/page1", view: '<div class="page1">Page 1</div>' },
                { name: "page2", path: "/page2", view: '<div class="page2">Page 2</div>' },
            ],
        });

        router.push("/page1");
        await new Promise((resolve) => setTimeout(resolve, 50));

        router.push("/page2");
        await new Promise((resolve) => setTimeout(resolve, 50));

        router.go(-2);
        await new Promise((resolve) => setTimeout(resolve, 50));

        const homeElement = host.querySelector(".home");
        const page1Element = host.querySelector(".page1");
        const page2Element = host.querySelector(".page2");

        expect(homeElement).not.toBeNull();
        expect(page1Element).toBeNull();
        expect(page2Element).toBeNull();
    });
});

describe("路由参数变化", () => {
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

    it("应该正确处理参数值变化", async () => {
        router = await createRouter(host, win, {
            routes: [
                {
                    name: "user",
                    path: "/user/:id",
                    view: () => {
                        return `<div class="user">User {{ $params.id }}</div>`;
                    },
                },
            ],
        });

        router.push("/user/123");
        await new Promise((resolve) => setTimeout(resolve, 50));

        router.push("/user/456");
        await new Promise((resolve) => setTimeout(resolve, 50));

        const userElement = host.querySelector(".user");
        expect(userElement).not.toBeNull();
    });

    it("应该支持查询参数变化", async () => {
        router = await createRouter(host, win, {
            routes: [
                {
                    name: "search",
                    path: "/search",
                    view: '<div class="search">Search</div>',
                },
            ],
        });

        router.push("/search?q=test");
        await new Promise((resolve) => setTimeout(resolve, 50));

        router.push("/search?q=another");
        await new Promise((resolve) => setTimeout(resolve, 50));

        const searchElement = host.querySelector(".search");
        expect(searchElement).not.toBeNull();
    });
});
