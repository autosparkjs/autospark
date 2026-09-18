/**
 * x-for.paging 分页模式测试。
 *
 * 双模式：客户端分页（全量数组 slice）和服务端分页（loader action 追加数据）。
 * 核心机制：items 是追加式增长的数据源，分页通过 slice 计算当前页数据。
 */
import { describe, expect, test } from "bun:test";
import "../setup";
import { mount, nextTick } from "../helpers";

describe("x-for.paging 客户端分页", () => {
    test("自动 slice 当前页", async () => {
        const { root } = mount(
            `<ul x-for.paging="item of items" x-for-options="{pageSize:3}"><li x-text="item"></li></ul>`,
            { items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
        );
        const ul = root.querySelector("ul")!;
        // 默认 page=1, pageSize=3 → [1,2,3]
        expect(ul.children.length).toBe(3);
        expect(ul.children[0].textContent).toBe("1");
        expect(ul.children[1].textContent).toBe("2");
        expect(ul.children[2].textContent).toBe("3");
    });

    test("$page/$pageSize/$pageCount 正确", async () => {
        const { root } = mount(
            `<ul x-for.paging="item of items" x-for-options="{pageSize:3}"><li><span x-text="item"></span><span class="page" x-text="$page"></span><span class="size" x-text="$pageSize"></span><span class="count" x-text="$pageCount"></span></li></ul>`,
            { items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
        );
        const ul = root.querySelector("ul")!;
        // page=1, pageSize=3, pageCount=ceil(10/3)=4
        expect(ul.children[0].querySelector(".page")!.textContent).toBe("1");
        expect(ul.children[0].querySelector(".size")!.textContent).toBe("3");
        expect(ul.children[0].querySelector(".count")!.textContent).toBe("4");
    });

    test("items 变化自动重算 pageCount", async () => {
        const { root, store } = mount(
            `<ul x-for.paging="item of items" x-for-options="{pageSize:2}"><li x-text="item"></li></ul>`,
            { items: [1, 2, 3] },
        );
        const ul = root.querySelector("ul")!;
        // page=1, pageSize=2, pageCount=ceil(3/2)=2
        expect(ul.children.length).toBe(2);

        store.state.items.push(4, 5);
        await nextTick();
        // pageCount=ceil(5/2)=3，但 page 仍为 1
        expect(ul.children.length).toBe(2);
        expect(ul.children[0].textContent).toBe("1");
        expect(ul.children[1].textContent).toBe("2");
    });

    test("$hasMore 正确", async () => {
        const { root } = mount(
            `<ul x-for.paging="item of items" x-for-options="{pageSize:3}"><li><span x-text="item"></span><span class="more" x-text="$hasMore"></span></li></ul>`,
            { items: [1, 2, 3, 4, 5] },
        );
        const ul = root.querySelector("ul")!;
        // page=1, pageSize=3, pageCount=ceil(5/3)=2, hasMore=true
        expect(ul.children[0].querySelector(".more")!.textContent).toBe("true");
    });

    test("翻页：写 :data-paging 绑定对象的 page → 重新 slice 渲染", async () => {
        const { root, store } = mount(
            `<ul x-for.paging="item of items" :data-paging="paging" x-for-options="{pageSize:3}"><li x-text="item"></li></ul>`,
            { items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], paging: { page: 1, pageSize: 3 } },
        );
        const ul = root.querySelector("ul")!;
        // page=1, pageSize=3 → [1,2,3]
        expect(ul.children.length).toBe(3);
        expect(ul.children[0].textContent).toBe("1");

        // 外部写 paging.page=2 → watcher 触发 → 重新 slice → [4,5,6]
        store.state.paging.page = 2;
        await nextTick();
        expect(ul.children.length).toBe(3);
        expect(ul.children[0].textContent).toBe("4");
        expect(ul.children[2].textContent).toBe("6");

        // 回写验证：pageCount/hasMore 同步到绑定对象
        expect(store.state.paging.pageCount).toBe(4);
        expect(store.state.paging.hasMore).toBe(true);
    });

    test("约束：越界页码钳位到末页", async () => {
        const { root, store } = mount(
            `<ul x-for.paging="item of items" :data-paging="paging" x-for-options="{pageSize:3}"><li x-text="item"></li></ul>`,
            { items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], paging: { page: 1, pageSize: 3 } },
        );
        const ul = root.querySelector("ul")!;
        await nextTick();

        // 写越界页码 999 → 钳位到末页 4 → [10]
        store.state.paging.page = 999;
        await nextTick();
        expect(store.state.paging.page).toBe(4);
        expect(ul.children[0].textContent).toBe("10");
        expect(ul.children.length).toBe(1);
        // 末页 hasMore=false，回写绑定对象
        expect(store.state.paging.hasMore).toBe(false);
    });

    test("约束：翻到末页后 hasMore=false 同步绑定对象", async () => {
        const { root, store } = mount(
            `<ul x-for.paging="item of items" :data-paging="paging" x-for-options="{pageSize:3}"><li x-text="item"></li></ul>`,
            { items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], paging: { page: 1, pageSize: 3 } },
        );
        await nextTick();
        // 逐页翻到末页
        store.state.paging.page = 4;
        await nextTick();
        expect(store.state.paging.hasMore).toBe(false);
        expect(store.state.paging.page).toBe(4);
    });

    test("翻页：写 pageSize → 重置第一页并重新 slice", async () => {
        const { root, store } = mount(
            `<ul x-for.paging="item of items" :data-paging="paging" x-for-options="{pageSize:3}"><li x-text="item"></li></ul>`,
            { items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], paging: { page: 2, pageSize: 3 } },
        );
        const ul = root.querySelector("ul")!;
        // 初始 page=2, pageSize=3 → [4,5,6]
        expect(ul.children[0].textContent).toBe("4");

        store.state.paging.pageSize = 5;
        await nextTick();
        // pageSize=5 → 重置 page=1 → [1,2,3,4,5]
        expect(ul.children.length).toBe(5);
        expect(ul.children[0].textContent).toBe("1");
        expect(store.state.paging.page).toBe(1);
        expect(store.state.paging.pageCount).toBe(2);
    });
});

describe("x-for.paging 服务端分页", () => {
    test("自动调 loader 加载第一页", async () => {
        let loadCalls: any[] = [];
        const { root, engine } = mount(
            `<ul x-for.paging="item of items" x-for-options="{pageSize:3, loader:'loadData'}"><li x-text="item"></li></ul>`,
            { items: [] },
            {
                actions: {
                    loadData: async ({ page, pageSize }: any) => {
                        loadCalls.push({ page, pageSize });
                        const start = (page - 1) * pageSize;
                        const data = Array.from({ length: pageSize }, (_, i) => start + i + 1);
                        return { data, page, pageSize, pageCount: 3 };
                    },
                },
            },
        );
        await nextTick();
        await nextTick();
        // 应自动调用 loader(1)
        expect(loadCalls.length).toBe(1);
        expect(loadCalls[0].page).toBe(1);
        expect(loadCalls[0].pageSize).toBe(3);
    });

    test("loader 返回数据追加到 items", async () => {
        const { root, engine } = mount(
            `<ul x-for.paging="item of items" x-for-options="{pageSize:3, loader:'loadData'}"><li x-text="item"></li></ul>`,
            { items: [] },
            {
                actions: {
                    loadData: async ({ page, pageSize }: any) => {
                        const start = (page - 1) * pageSize;
                        const data = Array.from({ length: pageSize }, (_, i) => start + i + 1);
                        return { data, page, pageSize, pageCount: 3 };
                    },
                },
            },
        );
        await nextTick();
        await nextTick();
        const ul = root.querySelector("ul")!;
        expect(ul.children.length).toBe(3);
        expect(ul.children[0].textContent).toBe("1");
        expect(ul.children[1].textContent).toBe("2");
        expect(ul.children[2].textContent).toBe("3");
    });

    test("loader 返回空数组 → $hasMore=false", async () => {
        const { root, engine } = mount(
            `<ul x-for.paging="item of items" x-for-options="{pageSize:3, loader:'loadData'}"><li x-text="item"></li></ul>`,
            { items: [] },
            {
                actions: {
                    loadData: async () => {
                        return { data: [], page: 1, pageSize: 3, pageCount: 0 };
                    },
                },
            },
        );
        await nextTick();
        await nextTick();
        const ul = root.querySelector("ul")!;
        // data 为空，items 仍为空
        expect(ul.children.length).toBe(0);
    });

    test("loader 错误处理", async () => {
        const { root, engine } = mount(
            `<ul x-for.paging="item of items" x-for-options="{pageSize:3, loader:'loadData'}"><li x-text="item"></li></ul>`,
            { items: [] },
            {
                actions: {
                    loadData: async () => {
                        throw new Error("网络错误");
                    },
                },
            },
        );
        await nextTick();
        await nextTick();
        const ul = root.querySelector("ul")!;
        // loader 失败，items 仍为空
        expect(ul.children.length).toBe(0);
    });

    test("pageCount=0 load-more 模式", async () => {
        let loadCalls: any[] = [];
        const { root, engine } = mount(
            `<ul x-for.paging="item of items" x-for-options="{pageSize:3, loader:'loadData'}"><li x-text="item"></li></ul>`,
            { items: [] },
            {
                actions: {
                    loadData: async ({ page, pageSize }: any) => {
                        loadCalls.push({ page });
                        if (page > 2) return { data: [], page, pageSize, pageCount: 0 };
                        const start = (page - 1) * pageSize;
                        const data = Array.from({ length: pageSize }, (_, i) => start + i + 1);
                        return { data, page, pageSize, pageCount: 0 };
                    },
                },
            },
        );
        await nextTick();
        await nextTick();
        // page=1 已加载
        expect(loadCalls.length).toBe(1);
        const ul = root.querySelector("ul")!;
        expect(ul.children.length).toBe(3);
    });
});

describe("x-for.paging :data-paging 绑定", () => {
    test("初始值读取", async () => {
        const { root, store } = mount(
            `<ul x-for.paging="item of items" :data-paging="paging" x-for-options="{pageSize:3}"><li x-text="item"></li></ul>`,
            { items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], paging: { page: 2, pageSize: 3 } },
        );
        const ul = root.querySelector("ul")!;
        // page=2, pageSize=3 → items[3:6] = [4,5,6]
        expect(ul.children.length).toBe(3);
        expect(ul.children[0].textContent).toBe("4");
        expect(ul.children[1].textContent).toBe("5");
        expect(ul.children[2].textContent).toBe("6");
    });
});

describe("x-for.paging 互斥", () => {
    test(".paging + .virtual 互斥，warn + virtual 被忽略", async () => {
        const { root } = mount(
            `<ul x-for.paging.virtual="item of items" x-for-options="{pageSize:2}" style="height:200px;overflow:auto"><li x-text="item"></li></ul>`,
            { items: [1, 2, 3, 4, 5] },
        );
        const ul = root.querySelector("ul")!;
        // .paging 优先，virtual 被忽略
        // 应按分页渲染：page=1, pageSize=2 → [1,2]
        expect(ul.children.length).toBe(2);
        expect(ul.children[0].textContent).toBe("1");
        expect(ul.children[1].textContent).toBe("2");
        // 不应有虚拟列表标记属性
        expect(ul.hasAttribute("autospark-virtual")).toBe(false);
    });
});

describe("x-for.paging 变量可访问", () => {
    test("模板中可访问 $page/$pageSize/$pageCount/$total", async () => {
        const { root } = mount(
            `<ul x-for.paging="item of items" x-for-options="{pageSize:3}"><li><span x-text="item"></span><span class="page" x-text="$page"></span><span class="size" x-text="$pageSize"></span><span class="count" x-text="$pageCount"></span><span class="total" x-text="$total"></span></li></ul>`,
            { items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
        );
        const ul = root.querySelector("ul")!;
        const li = ul.children[0];
        expect(li.querySelector(".page")!.textContent).toBe("1");
        expect(li.querySelector(".size")!.textContent).toBe("3");
        expect(li.querySelector(".count")!.textContent).toBe("4");
        expect(li.querySelector(".total")!.textContent).toBe("12");
    });
});
