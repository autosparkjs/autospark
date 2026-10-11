import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { KylinRouter } from "@/router";
import { createTestDOM, createRouter } from "./common";

describe("默认路由和重定向", () => {
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

    it("应该在访问根路径时渲染默认路由", async () => {
        router = await createRouter(host, win, {
            routes: [
                {
                    name: "home",
                    path: "/",
                    view: '<div class="home">Home Page</div>',
                },
                {
                    name: "about",
                    path: "/about",
                    view: '<div class="about">About Page</div>',
                },
            ],
        });

        router.push("/");
        await new Promise((resolve) => setTimeout(resolve, 100));

        const homeElement = host.querySelector(".home");
        expect(homeElement).not.toBeNull();
    });

    it("应该在路由未匹配时渲染 404 页面", async () => {
        router = await createRouter(host, win, {
            routes: [
                { name: "home", path: "/", view: '<div class="home">Home</div>' },
                { name: "404", path: "*", view: '<div class="not-found">404 Not Found</div>' },
            ],
        });

        router.push("/nonexistent");
        await new Promise((resolve) => setTimeout(resolve, 100));

        const notFoundElement = host.querySelector(".not-found");
        expect(notFoundElement).not.toBeNull();
    });

    it("应该支持 beforeEnter 重定向", async () => {
        router = await createRouter(host, win, {
            debug: false,
            routes: {
                name: "root",
                path: "/",
                view: '<div class="root">Root <kylin-outlet></kylin-outlet></div>',
                children: [
                    {
                        name: "old-route",
                        path: "old",
                        beforeEnter: () => "/new",
                    },
                    {
                        name: "new-route",
                        path: "new",
                        view: '<div class="new">New Route</div>',
                    },
                ],
            },
        });

        router.push("/old");
        await new Promise((resolve) => setTimeout(resolve, 150));

        const newElement = host.querySelector(".new");
        expect(newElement).not.toBeNull();
    });
});
