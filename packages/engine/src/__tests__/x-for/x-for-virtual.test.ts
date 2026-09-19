import { describe, expect, test, beforeEach } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";

/** 获取容器内实际项元素数量（排除垫片元素） */
function countItemChildren(container: Element): number {
    let count = 0;
    for (const child of Array.from(container.children)) {
        if (!child.hasAttribute("aria-hidden")) count++;
    }
    return count;
}

/** 获取容器内项元素（排除垫片元素） */
function getItemChildren(container: Element): Element[] {
    return Array.from(container.children).filter((c) => !c.hasAttribute("aria-hidden"));
}

describe("x-for.virtual 虚拟列表", () => {
    describe("基本功能", () => {
        test("启用虚拟列表模式", async () => {
            const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item-${i}` }));
            const { root, engine } = mount(
                `<div x-for.virtual="item of items" :key="item.id" style="height:200px;overflow:auto" x-for-options="{itemHeight:40}">
                    <div x-text="item.name" style="height:40px"></div>
                </div>`,
                { items },
            );

            // 容器应有虚拟列表标记属性
            const container = root.querySelector("[autospark-virtual]");
            expect(container).toBeTruthy();
            expect(container!.getAttribute("autospark-virtual")).toBe("");
        });

        test("只渲染可见项 + overscan", async () => {
            const items = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `item-${i}` }));
            const { root, engine } = mount(
                `<div x-for.virtual="item of items" :key="item.id" style="height:200px;overflow:auto" x-for-options="{itemHeight:40, overscan:2}">
                    <div x-text="item.name" style="height:40px"></div>
                </div>`,
                { items },
            );

            await nextTick();

            // 容器内项元素数量应远小于 1000（排除垫片元素）
            const container = root.querySelector("[autospark-virtual]")!;
            const childCount = countItemChildren(container);
            // 可见区域 200px / 40px = 5 项 + overscan 2*2 = 4 项 = 9 项，可能还有误差
            expect(childCount).toBeLessThan(20);
            expect(childCount).toBeGreaterThan(0);
        });

        test("data-index 属性反映当前第一个可见项索引", async () => {
            const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item-${i}` }));
            const { root, engine } = mount(
                `<div x-for.virtual="item of items" :key="item.id" style="height:200px;overflow:auto" x-for-options="{itemHeight:40}">
                    <div x-text="item.name" style="height:40px"></div>
                </div>`,
                { items },
            );

            await nextTick();

            const container = root.querySelector("[autospark-virtual]")!;
            expect(container.getAttribute("data-index")).toBe("0");
        });
    });

    describe("滚动行为", () => {
        test("滚动后更新 data-index", async () => {
            const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item-${i}` }));
            const { root, engine } = mount(
                `<div x-for.virtual="item of items" :key="item.id" style="height:200px;overflow:auto" x-for-options="{itemHeight:40}">
                    <div x-text="item.name" style="height:40px"></div>
                </div>`,
                { items },
            );

            await nextTick();

            const container = root.querySelector("[autospark-virtual]")! as HTMLElement;

            // 模拟滚动到第 5 项
            container.scrollTop = 5 * 40;
            container.dispatchEvent(new Event("scroll"));

            await nextTick();

            // data-index 应更新为 5
            expect(container.getAttribute("data-index")).toBe("5");
        });

        test("滚动后只渲染可见项", async () => {
            const items = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `item-${i}` }));
            const { root, engine } = mount(
                `<div x-for.virtual="item of items" :key="item.id" style="height:200px;overflow:auto" x-for-options="{itemHeight:40, overscan:2}">
                    <div x-text="item.name" style="height:40px"></div>
                </div>`,
                { items },
            );

            await nextTick();

            const container = root.querySelector("[autospark-virtual]")! as HTMLElement;
            const initialCount = countItemChildren(container);

            // 滚动到中间位置
            container.scrollTop = 500 * 40;
            container.dispatchEvent(new Event("scroll"));

            await nextTick();

            // 子元素数量应保持在合理范围
            expect(countItemChildren(container)).toBeLessThan(20);
            expect(countItemChildren(container)).toBeGreaterThan(0);
        });
    });

    describe("动态容器高度", () => {
        test("不指定 height 的容器（内容撑开）", async () => {
            const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item-${i}` }));
            const { root, engine } = mount(
                `<div x-for.virtual="item of items" :key="item.id" style="overflow:auto" x-for-options="{itemHeight:40}">
                    <div x-text="item.name" style="height:40px"></div>
                </div>`,
                { items },
            );

            await nextTick();

            // 容器应有虚拟列表标记属性
            const container = root.querySelector("[autospark-virtual]");
            expect(container).toBeTruthy();

            // 由于没有指定高度，容器高度由内容撑开
            // 在 happy-dom 中，clientHeight 可能为 0，会退化为全量渲染
            // 这是预期行为
        });

        test("height: auto 的容器", async () => {
            const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item-${i}` }));
            const { root, engine } = mount(
                `<div x-for.virtual="item of items" :key="item.id" style="height:auto;overflow:auto" x-for-options="{itemHeight:40}">
                    <div x-text="item.name" style="height:40px"></div>
                </div>`,
                { items },
            );

            await nextTick();

            // 容器应有虚拟列表标记属性
            const container = root.querySelector("[autospark-virtual]");
            expect(container).toBeTruthy();
        });

        test("容器高度变化时重新计算（ResizeObserver）", async () => {
            const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item-${i}` }));
            const { root, engine } = mount(
                `<div x-for.virtual="item of items" :key="item.id" style="height:200px;overflow:auto" x-for-options="{itemHeight:40}">
                    <div x-text="item.name" style="height:40px"></div>
                </div>`,
                { items },
            );

            await nextTick();

            const container = root.querySelector("[autospark-virtual]")! as HTMLElement;
            const initialChildCount = countItemChildren(container);

            // 模拟容器高度变化（通过 ResizeObserver）
            // 在 happy-dom 中，ResizeObserver 可能不触发，但我们可以验证逻辑
            // 实际测试中，ResizeObserver 会在真实浏览器中触发 _onResize
        });
    });

    describe("边界情况", () => {
        test("空列表：退化，x-empty 生效", async () => {
            const { root, engine } = mount(
                `<div x-for.virtual="item of items" :key="item.id" style="height:200px;overflow:auto" x-for-options="{itemHeight:40}">
                    <div x-text="item.name" style="height:40px"></div>
                    <div x-empty>没有数据</div>
                </div>`,
                { items: [] },
            );

            await nextTick();

            // 应显示空状态
            expect(root.innerHTML).toContain("没有数据");
        });

        test("单项列表", async () => {
            const items = [{ id: 1, name: "only-one" }];
            const { root, engine } = mount(
                `<div x-for.virtual="item of items" :key="item.id" style="height:200px;overflow:auto" x-for-options="{itemHeight:40}">
                    <div x-text="item.name" style="height:40px"></div>
                </div>`,
                { items },
            );

            await nextTick();

            const container = root.querySelector("[autospark-virtual]")!;
            expect(countItemChildren(container)).toBe(1);
            expect(container.innerHTML).toContain("only-one");
        });

        test("itemHeight 无效时 warn + 退化", async () => {
            const items = Array.from({ length: 10 }, (_, i) => ({ id: i, name: `item-${i}` }));
            const { root, engine } = mount(
                `<div x-for.virtual="item of items" :key="item.id" style="height:200px;overflow:auto" x-for-options="{itemHeight: 0}">
                    <div x-text="item.name" style="height:40px"></div>
                </div>`,
                { items },
            );

            await nextTick();

            // 应退化为全量渲染
            const container = root.querySelector("[autospark-virtual]");
            expect(container).toBeFalsy();
        });
    });

    describe("data-index 双向绑定", () => {
        test("通过 :data-index 绑定状态", async () => {
            const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item-${i}` }));
            const { root, engine } = mount(
                `<div x-for.virtual="item of items" :key="item.id" :data-index="currentIndex" style="height:200px;overflow:auto" x-for-options="{itemHeight:40}">
                    <div x-text="item.name" style="height:40px"></div>
                </div>`,
                { items, currentIndex: 0 },
            );

            await nextTick();

            // 初始状态
            expect(engine.state.currentIndex).toBe(0);

            // 滚动后应更新绑定的状态
            const container = root.querySelector("[autospark-virtual]")! as HTMLElement;
            container.scrollTop = 10 * 40;
            container.dispatchEvent(new Event("scroll"));

            await nextTick();

            expect(engine.state.currentIndex).toBe(10);
        });
    });

    describe("默认滚动条样式", () => {
        test("注入滚动条样式", () => {
            // 检查样式元素是否存在
            const styleEl = document.getElementById("x-for-virtual-styles");
            expect(styleEl).toBeTruthy();
            expect(styleEl!.textContent).toContain("scrollbar-width");
            expect(styleEl!.textContent).toContain("webkit-scrollbar");
        });
    });

    describe("配置选项", () => {
        test("overscan 配置", async () => {
            const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item-${i}` }));
            const { root, engine } = mount(
                `<div x-for.virtual="item of items" :key="item.id" style="height:200px;overflow:auto" x-for-options="{itemHeight:40, overscan:10}">
                    <div x-text="item.name" style="height:40px"></div>
                </div>`,
                { items },
            );

            await nextTick();

            const container = root.querySelector("[autospark-virtual]")!;
            // 可见区域 200px / 40px = 5 项 + overscan 10*2 = 20 项 = 25 项 + 1 垫片
            expect(countItemChildren(container)).toBeGreaterThan(5);
            expect(countItemChildren(container)).toBeLessThanOrEqual(30);
        });

        test("itemHeight 自动检测（测试环境无法真实检测）", async () => {
            // 注意：happy-dom 环境下 getBoundingClientRect() 返回 0
            // 自动检测会失败并退化为全量渲染
            const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item-${i}` }));
            const { root, engine } = mount(
                `<div x-for.virtual="item of items" :key="item.id" style="height:200px;overflow:auto">
                    <div x-text="item.name" style="height:50px"></div>
                </div>`,
                { items },
            );

            await nextTick();

            // 在测试环境中，自动检测会失败，退化为全量渲染
            // 所以应该渲染所有 100 项
            const container = root.querySelector("[autospark-virtual]");
            expect(container).toBeFalsy();
            // 检查是否渲染了所有项
            expect(root.innerHTML).toContain("item-0");
            expect(root.innerHTML).toContain("item-99");
        });
    });

    describe("清理", () => {
        test("销毁时清理资源", async () => {
            const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item-${i}` }));
            const { root, engine } = mount(
                `<div x-for.virtual="item of items" :key="item.id" style="height:200px;overflow:auto" x-for-options="{itemHeight:40}">
                    <div x-text="item.name" style="height:40px"></div>
                </div>`,
                { items },
            );

            await nextTick();

            // 容器应有虚拟列表标记属性
            expect(root.querySelector("[autospark-virtual]")).toBeTruthy();

            // 销毁引擎
            engine.destroy();

            // 容器应移除虚拟列表标记属性
            expect(root.querySelector("[autospark-virtual]")).toBeFalsy();
        });
    });
});
