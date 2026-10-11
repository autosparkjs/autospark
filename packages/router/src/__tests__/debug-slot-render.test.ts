import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { KylinRouter } from "@/router";
import { createTestDOM, createRouter } from "./render/common";

describe("调试 Slot 渲染和 Alpine.js 初始化", () => {
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

    it("调试: 查看 lastViewSlot 的详细状态", async () => {
        router = await createRouter(host, win, {
            routes: [
                { name: "home", path: "/", view: '<div class="home">Home</div>' },
                {
                    name: "user",
                    path: "/user/:id",
                    view: '<div class="user">User {{id}}</div>',
                },
            ],
        });

        console.log("=== 初始状态 ===");
        console.log("host outerHTML:", host.outerHTML);

        // 等待初始导航完成
        await router.isStopNavigating();

        console.log("\n=== 初始导航后 ===");
        console.log("lastViewSlot 存在?", !!router.lastViewSlot);
        console.log("lastViewSlot:", router.lastViewSlot);
        console.log("lastViewSlot outerHTML:", router.lastViewSlot?.outerHTML);
        console.log("lastViewSlot innerHTML:", router.lastViewSlot?.innerHTML);
        console.log("lastViewSlot shadowRoot:", router.lastViewSlot?.shadowRoot);
        console.log("lastViewSlot x-data:", router.lastViewSlot?.getAttribute("x-data"));

        // 导航到 user 路由
        console.log("\n=== 导航到 /user/123 ===");
        router.push("/user/123");
        await router.isStopNavigating();

        console.log("\n=== user 导航后 ===");
        console.log("lastViewSlot 存在?", !!router.lastViewSlot);
        console.log("lastViewSlot:", router.lastViewSlot);
        console.log("lastViewSlot outerHTML:", router.lastViewSlot?.outerHTML);
        console.log("lastViewSlot innerHTML:", router.lastViewSlot?.innerHTML);
        console.log("lastViewSlot x-data:", router.lastViewSlot?.getAttribute("x-data"));
        console.log("lastViewSlot loading:", router.lastViewSlot?.loading);
        console.log("lastViewSlot active:", router.lastViewSlot?.active);

        // 尝试手动初始化 Alpine
        console.log("\n=== 尝试手动初始化 Alpine ===");
        const Alpine = (await import("alpinejs")).default;
        console.log("Alpine 可用?", !!Alpine);

        // 手动初始化 Alpine 树
        if (router.lastViewSlot) {
            console.log("调用 Alpine.initTree(router.lastViewSlot)");
            Alpine.initTree(router.lastViewSlot);

            // 等待一帧
            await new Promise((resolve) => setTimeout(resolve, 0));

            console.log("Alpine 初始化后:");
            console.log("lastViewSlot innerHTML:", router.lastViewSlot?.innerHTML);
            console.log("lastViewSlot outerHTML:", router.lastViewSlot?.outerHTML);
        }

        // 检查 host 的完整结构
        console.log("\n=== host 完整结构 ===");
        console.log("host outerHTML:", host.outerHTML);
        console.log("host innerHTML:", host.innerHTML);

        // 查找 outlet
        const outlet = host.querySelector("kylin-outlet");
        console.log("\noutlet 存在?", !!outlet);
        if (outlet) {
            console.log("outlet innerHTML:", outlet.innerHTML);
            console.log("outlet children:", outlet.children.length);
            console.log("outlet childTags:", Array.from(outlet.children).map((c: any) => c.tagName));
        }
    });

    it("调试: 直接检查 Alpine 是否能处理 slot 内容", async () => {
        const Alpine = (await import("alpinejs")).default;

        // 创建一个模拟 kylin-slot 的元素
        const mockSlot = document.createElement("div");
        mockSlot.setAttribute("x-data", "{ id: 'test123' }");
        mockSlot.innerHTML = '<div class="user">User {{id}}</div>';
        host.appendChild(mockSlot);

        console.log("\n=== 模拟 slot 创建 ===");
        console.log("mockSlot innerHTML:", mockSlot.innerHTML);

        // 初始化 Alpine
        Alpine.initTree(mockSlot);
        await new Promise((resolve) => setTimeout(resolve, 0));

        console.log("Alpine 初始化后:");
        console.log("mockSlot innerHTML:", mockSlot.innerHTML);

        const userDiv = mockSlot.querySelector(".user");
        console.log("userDiv textContent:", userDiv?.textContent);
        console.log("userDiv innerHTML:", userDiv?.innerHTML);

        // 注意：{{id}} 不会被 Alpine 自动转换，除非使用 x-text 指令
        // 所以这里应该看到原始的 {{id}} 文本
    });

    it("调试: 使用 x-text 而不是 {{ }} 语法", async () => {
        const Alpine = (await import("alpinejs")).default;

        // 创建一个使用 x-text 的元素
        const testDiv = document.createElement("div");
        testDiv.setAttribute("x-data", "{ id: '456' }");
        testDiv.innerHTML = '<div class="user" x-text="`User ${id}`"></div>';
        host.appendChild(testDiv);

        console.log("\n=== 使用 x-text 指令 ===");
        console.log("testDiv innerHTML:", testDiv.innerHTML);

        // 初始化 Alpine
        Alpine.initTree(testDiv);
        await new Promise((resolve) => setTimeout(resolve, 0));

        console.log("Alpine 初始化后:");
        console.log("testDiv innerHTML:", testDiv.innerHTML);

        const userDiv = testDiv.querySelector(".user");
        console.log("userDiv textContent:", userDiv?.textContent);
        expect(userDiv?.textContent).toBe("User 456");
    });

    it("调试: 检查 KylinSlot 组件的渲染", async () => {
        router = await createRouter(host, win, {
            routes: [
                { name: "home", path: "/", view: '<div class="home">Home</div>' },
                {
                    name: "user",
                    path: "/user/:id",
                    // 使用 x-text 而不是 {{ }}
                    view: '<div class="user" x-text="`User ${id}`"></div>',
                },
            ],
        });

        await router.isStopNavigating();

        console.log("\n=== 检查初始渲染 ===");
        const homeSlot = router.lastViewSlot;
        console.log("homeSlot 存在?", !!homeSlot);
        console.log("homeSlot outerHTML:", homeSlot?.outerHTML);
        console.log("homeSlot innerHTML:", homeSlot?.innerHTML);

        // 导航到 user 路由
        router.push("/user/123");
        await router.isStopNavigating();

        console.log("\n=== user 路由渲染 ===");
        const userSlot = router.lastViewSlot;
        console.log("userSlot 存在?", !!userSlot);
        console.log("userSlot outerHTML:", userSlot?.outerHTML);
        console.log("userSlot innerHTML:", userSlot?.innerHTML);
        console.log("userSlot x-data:", userSlot?.getAttribute("x-data"));

        // 检查是否有 .user 元素
        const userElement = userSlot?.querySelector(".user");
        console.log("userElement 存在?", !!userElement);
        if (userElement) {
            console.log("userElement x-text:", userElement.getAttribute("x-text"));
            console.log("userElement textContent:", userElement.textContent);
        }

        // 尝试等待更长时间
        await new Promise((resolve) => setTimeout(resolve, 100));

        console.log("\n=== 等待 100ms 后 ===");
        console.log("userSlot outerHTML:", userSlot?.outerHTML);
        console.log("userElement textContent:", userSlot?.textContent);
    });
});
