import { describe, it, expect, beforeEach } from "bun:test";
import { createTestDOM } from "./render/common";

describe("调试 Lit 组件渲染", () => {
    let host: HTMLElement;
    let win: any;

    beforeEach(() => {
        const setup = createTestDOM();
        host = setup.host;
        win = setup.win;
    });

    it("直接测试 KylinSlot 组件渲染", async () => {
        // 动态导入组件
        const { KylinSlot } = await import("@/components/Slot");
        const { KylinOutlet } = await import("@/components/Outlet");

        // 确保组件已注册
        if (!win.customElements.get("kylin-slot")) {
            win.customElements.define("kylin-slot", KylinSlot);
        }
        if (!win.customElements.get("kylin-outlet")) {
            win.customElements.define("kylin-outlet", KylinOutlet);
        }

        // 创建 outlet
        const outlet = document.createElement("kylin-outlet") as any;
        host.appendChild(outlet);

        console.log("=== 创建 outlet 后 ===");
        console.log("outlet outerHTML:", outlet.outerHTML);
        console.log("outlet innerHTML:", outlet.innerHTML);

        // 创建 slot
        const slot = document.createElement("kylin-slot") as any;
        slot.id = "test-slot";
        outlet.appendChild(slot);

        console.log("\n=== 创建 slot 后 ===");
        console.log("slot outerHTML:", slot.outerHTML);
        console.log("slot innerHTML:", slot.innerHTML);
        console.log("slot loading?:", slot.loading);

        // 等待 Lit 组件更新
        await slot.updateComplete;

        console.log("\n=== updateComplete 后 ===");
        console.log("slot outerHTML:", slot.outerHTML);
        console.log("slot innerHTML:", slot.innerHTML);

        // 调用 resolve 方法设置内容
        slot.resolve('<div class="test">Test Content</div>', {
            hash: "test-data",
            value: { message: "Test" },
        });

        console.log("\n=== resolve 后 ===");
        console.log("slot outerHTML:", slot.outerHTML);
        console.log("slot innerHTML:", slot.innerHTML);
        console.log("slot _viewContent state:", slot._viewContent);

        // 等待更新
        await slot.updateComplete;

        console.log("\n=== resolve updateComplete 后 ===");
        console.log("slot outerHTML:", slot.outerHTML);
        console.log("slot innerHTML:", slot.innerHTML);

        // 查找测试元素
        const testDiv = slot.querySelector(".test");
        console.log("\ntestDiv 存在?", !!testDiv);
        console.log("testDiv textContent:", testDiv?.textContent);
        console.log("testDiv outerHTML:", testDiv?.outerHTML);

        // 验证
        expect(testDiv).not.toBeNull();
        expect(testDiv?.textContent).toBe("Test Content");
    });

    it("测试 KylinSlot 的 loading 状态", async () => {
        const { KylinSlot } = await import("@/components/Slot");
        const { KylinOutlet } = await import("@/components/Outlet");

        // 确保组件已注册
        if (!win.customElements.get("kylin-slot")) {
            win.customElements.define("kylin-slot", KylinSlot);
        }
        if (!win.customElements.get("kylin-outlet")) {
            win.customElements.define("kylin-outlet", KylinOutlet);
        }

        const outlet = document.createElement("kylin-outlet") as any;
        host.appendChild(outlet);

        const slot = document.createElement("kylin-slot") as any;
        slot.id = "test-loading-slot";
        slot.loading = true;
        outlet.appendChild(slot);

        await slot.updateComplete;

        console.log("\n=== loading 状态 ===");
        console.log("slot outerHTML:", slot.outerHTML);
        console.log("slot innerHTML:", slot.innerHTML);

        // 应该显示 kylin-loading
        const loadingElement = slot.querySelector("kylin-loading");
        console.log("loadingElement 存在?", !!loadingElement);
        expect(loadingElement).not.toBeNull();

        // 设置为非 loading 状态
        slot.loading = false;
        await slot.updateComplete;

        console.log("\n=== 非 loading 状态 ===");
        console.log("slot outerHTML:", slot.outerHTML);
        console.log("slot innerHTML:", slot.innerHTML);
    });

    it("测试 KylinSlot 的 Alpine 数据绑定", async () => {
        const { KylinSlot } = await import("@/components/Slot");
        const { KylinOutlet } = await import("@/components/Outlet");
        const Alpine = (await import("alpinejs")).default;

        // 确保组件已注册
        if (!win.customElements.get("kylin-slot")) {
            win.customElements.define("kylin-slot", KylinSlot);
        }
        if (!win.customElements.get("kylin-outlet")) {
            win.customElements.define("kylin-outlet", KylinOutlet);
        }

        const outlet = document.createElement("kylin-outlet") as any;
        host.appendChild(outlet);

        const slot = document.createElement("kylin-slot") as any;
        slot.id = "test-alpine-slot";
        outlet.appendChild(slot);

        await slot.updateComplete;

        // 设置内容和数据
        slot.resolve(
            '<div class="user" x-text="`User ${id}`"></div>',
            {
                hash: "test-user",
                value: { id: "123" },
            },
        );

        await slot.updateComplete;

        console.log("\n=== resolve 后 ===");
        console.log("slot outerHTML:", slot.outerHTML);
        console.log("slot innerHTML:", slot.innerHTML);
        console.log("slot x-data:", slot.getAttribute("x-data"));

        // 手动初始化 Alpine
        Alpine.initTree(slot);
        await new Promise((resolve) => setTimeout(resolve, 0));

        console.log("\n=== Alpine 初始化后 ===");
        console.log("slot outerHTML:", slot.outerHTML);
        console.log("slot innerHTML:", slot.innerHTML);

        const userDiv = slot.querySelector(".user");
        console.log("userDiv textContent:", userDiv?.textContent);

        // 注意：由于 id 是在 Alpine 数据中，但 x-data 属性设置为 "test-user"
        // 实际的数据应该是通过 Alpine.data("test-user") 注册的
        // 所以这里可能不会显示 "User 123"，而是原始内容
    });
});
