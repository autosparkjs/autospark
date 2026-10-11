import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { KylinRouter } from "@/router";
import { createTestDOM, createRouter } from "./common";

describe("KeepAlive 缓存功能", () => {
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

    it("应该缓存启用了 keepAlive 的路由", async () => {
        let mountCount = 0;

        router = await createRouter(host, win, {
            debug: false,
            routes: {
                name: "root",
                path: "/",
                view: '<div class="root">Root <kylin-outlet></kylin-outlet></div>',
                children: [
                    {
                        name: "cached",
                        path: "cached",
                        keepAlive: true,
                        view: () => {
                            mountCount++;
                            return `<div class="cached">Cached ${mountCount}</div>`;
                        },
                    },
                    {
                        name: "other",
                        path: "other",
                        view: '<div class="other">Other Page</div>',
                    },
                ],
            },
        });

        // 第一次导航到 /cached
        router.push("/cached");
        await new Promise((resolve) => setTimeout(resolve, 100));
        const firstMountCount = mountCount;

        // 导航到 /other
        router.push("/other");
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 第二次导航到 /cached，应该复用缓存
        router.push("/cached");
        await new Promise((resolve) => setTimeout(resolve, 100));

        const cachedElement = host.querySelector(".cached");
        expect(cachedElement).not.toBeNull();
        // mountCount 应该等于第一次的值，说明没有重新渲染
        expect(mountCount).toBe(firstMountCount);
        expect(mountCount).toBeGreaterThan(0);
    });

    it("应该不缓存禁用了 keepAlive 的路由", async () => {
        let mountCount = 0;

        router = await createRouter(host, win, {
            debug: false,
            routes: {
                name: "root",
                path: "/",
                view: '<div class="root">Root <kylin-outlet></kylin-outlet></div>',
                children: [
                    {
                        name: "not-cached",
                        path: "not-cached",
                        keepAlive: false,
                        view: () => {
                            mountCount++;
                            return `<div class="not-cached">Not Cached ${mountCount}</div>`;
                        },
                    },
                    {
                        name: "other",
                        path: "other",
                        view: '<div class="other">Other Page</div>',
                    },
                ],
            },
        });

        router.push("/not-cached");
        await new Promise((resolve) => setTimeout(resolve, 100));
        const firstMountCount = mountCount;

        router.push("/other");
        await new Promise((resolve) => setTimeout(resolve, 100));

        router.push("/not-cached");
        await new Promise((resolve) => setTimeout(resolve, 100));

        const notCachedElement = host.querySelector(".not-cached");
        expect(notCachedElement).not.toBeNull();
        // keepAlive 禁用，每次都应该重新挂载
        // mountCount 应该比第一次多 1
        expect(mountCount).toBe(firstMountCount + 1);
        expect(mountCount).toBeGreaterThan(1);
    });

    it("应该支持嵌套路由的 keepAlive", async () => {
        let parentMountCount = 0;
        let childMountCount = 0;

        router = await createRouter(host, win, {
            routes: {
                name: "parent",
                path: "/",
                keepAlive: true,
                view: () => {
                    parentMountCount++;
                    return `<div class="parent">Parent ${parentMountCount} <kylin-outlet></kylin-outlet></div>`;
                },
                children: [
                    {
                        name: "child",
                        path: "child",
                        keepAlive: true,
                        view: () => {
                            childMountCount++;
                            return `<div class="child">Child ${childMountCount}</div>`;
                        },
                    },
                    {
                        name: "other-child",
                        path: "other",
                        view: '<div class="other-child">Other Child</div>',
                    },
                ],
            },
        });

        // 第一次导航到 /child
        router.push("/child");
        await new Promise((resolve) => setTimeout(resolve, 100));
        const firstParentMountCount = parentMountCount;
        const firstChildMountCount = childMountCount;

        // 导航到另一个子路由
        router.push("/other");
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 再次导航到 /child，应该复用缓存
        router.push("/child");
        await new Promise((resolve) => setTimeout(resolve, 100));

        const parentElement = host.querySelector(".parent");
        const childElement = host.querySelector(".child");

        expect(parentElement).not.toBeNull();
        expect(childElement).not.toBeNull();
        // 父路由应该保持不变
        expect(parentMountCount).toBe(firstParentMountCount);
        // 子路由应该保持不变
        expect(childMountCount).toBe(firstChildMountCount);
        // 验证只挂载了一次
        expect(parentMountCount).toBe(1);
        expect(childMountCount).toBe(1);
    });
});
