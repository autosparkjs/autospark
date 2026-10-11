import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { KylinRouter } from "@/router";
import { createTestDOM, createRouter } from "./common";

describe("错误渲染", () => {
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

    it("应该在视图加载失败时渲染错误页面", async () => {
        router = await createRouter(host, win, {
            routes: [
                {
                    name: "error",
                    path: "/error",
                    view: {
                        from: async () => {
                            throw new Error("View load failed");
                        },
                    },
                },
            ],
        });

        router.push("/error");
        await new Promise((resolve) => setTimeout(resolve, 150));

        // 应该有错误提示
        const errorContainer = host.querySelector(".kylin-error");
        expect(errorContainer).not.toBeNull();
    });

    it("应该在数据加载失败时继续渲染视图", async () => {
        router = await createRouter(host, win, {
            routes: [
                {
                    name: "partial-error",
                    path: "/partial-error",
                    data: {
                        from: async () => {
                            throw new Error("Data load failed");
                        },
                    },
                    view: '<div class="partial">Partial Content</div>',
                },
            ],
        });

        router.push("/partial-error");
        await new Promise((resolve) => setTimeout(resolve, 150));

        const partialElement = host.querySelector(".partial");
        expect(partialElement).not.toBeNull();
    });

    it("应该支持自定义错误页面", async () => {
        const customErrorElement = document.createElement("div");
        customErrorElement.className = "custom-error";
        customErrorElement.textContent = "Custom Error Page";

        router = await createRouter(host, win, {
            routes: [
                {
                    name: "fail",
                    path: "/fail",
                    view: {
                        from: async () => {
                            throw new Error("Fail");
                        },
                    },
                },
            ],
            errorPages: {
                500: customErrorElement,
            },
        });

        router.push("/fail");
        await new Promise((resolve) => setTimeout(resolve, 150));

        const customError = host.querySelector(".custom-error");
        expect(customError).not.toBeNull();
    });
});

describe("边界情况", () => {
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

    it("应该处理空视图", async () => {
        router = await createRouter(host, win, {
            routes: [
                {
                    name: "empty",
                    path: "/empty",
                    // @ts-ignore - 测试空视图
                    view: null,
                },
            ],
        });

        router.push("/empty");
        await new Promise((resolve) => setTimeout(resolve, 50));

        // 不应该抛出错误
        expect(router).toBeDefined();
    });

    it("应该处理未定义的视图", async () => {
        router = await createRouter(host, win, {
            routes: [
                {
                    name: "no-view",
                    path: "/no-view",
                    // 没有 view 字段
                },
            ],
        });

        router.push("/no-view");
        await new Promise((resolve) => setTimeout(resolve, 50));

        // 不应该抛出错误
        expect(router).toBeDefined();
    });

    it("应该处理特殊字符路径", async () => {
        router = await createRouter(host, win, {
            routes: [
                {
                    name: "special",
                    path: "/path-with-dashes_and_underscores",
                    view: '<div class="special">Special Path</div>',
                },
            ],
        });

        router.push("/path-with-dashes_and_underscores");
        await new Promise((resolve) => setTimeout(resolve, 50));

        const specialElement = host.querySelector(".special");
        expect(specialElement).not.toBeNull();
    });

    it("应该处理 Unicode 字符路径", async () => {
        router = await createRouter(host, win, {
            routes: [
                {
                    name: "unicode",
                    path: "/用户/:id",
                    view: '<div class="unicode">用户 {{ $params.id }}</div>',
                },
            ],
        });

        router.push("/用户/123");
        await new Promise((resolve) => setTimeout(resolve, 50));

        const unicodeElement = host.querySelector(".unicode");
        expect(unicodeElement).not.toBeNull();
    });
});
