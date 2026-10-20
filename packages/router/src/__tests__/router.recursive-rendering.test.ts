﻿﻿import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import type { AutoSparkRouter } from "@/router";

/**
 * 创建测试用的 DOM 环境
 */
function createTestDOM() {
    const { Window } = require("happy-dom");
    const win = new Window({ url: "http://localhost/" });

    // 设置全局对象
    // @ts-ignore
    globalThis.window = win;
    // @ts-ignore
    globalThis.document = win.document;
    // @ts-ignore
    globalThis.history = win.history;
    // @ts-ignore
    globalThis.location = win.location;
    // @ts-ignore
    globalThis.Event = win.Event;
    // @ts-ignore
    globalThis.CustomEvent = win.CustomEvent;
    // @ts-ignore
    globalThis.HTMLElement = win.HTMLElement;
    // @ts-ignore
    globalThis.URLSearchParams = win.URLSearchParams;
    // 模板渲染器的 HTML 提取依赖 DOMParser；preload 注册的 linkedom 版本在 happy-dom
    // 文档下解析结果为空 body，此处换用同一 window 的 DOMParser（与 render-data 测试一致）
    // @ts-ignore
    globalThis.DOMParser = win.DOMParser;

    // 添加 MutationObserver polyfill for Alpine.js
    // @ts-ignore
    globalThis.MutationObserver = win.MutationObserver || class MockMutationObserver {
        constructor(callback: MutationCallback) {}
        disconnect() {}
        observe(node: Node, options: any) {}
        takeRecords(): MutationRecord[] { return []; }
    };

    // 确保 SyntaxError 可用（happy-dom 需要）
    // @ts-ignore
    globalThis.SyntaxError = win.SyntaxError || SyntaxError;

    // 创建 host 元素
    // @ts-ignore
    const host = document.createElement("div") as HTMLElement;
    // @ts-ignore
    document.body.appendChild(host);
    return host;
}

/** 视图错误条目（render 层 ViewErrorEntry 同形） */
interface StubViewError {
    status: number;
    message: string;
}

/** 视图挂载记录（render 层 ViewPayload 同形） */
interface MountedView {
    hash: string;
    html: string;
    ready: boolean;
    error?: StubViewError | null;
}

/**
 * 功能性 engine stub：按 outlet 宿主逐个给出组件读取面 + engine.data 直写通道，
 * 并同步把数据域落位为 DOM——视图容器（data-view-hash）、未就绪 loading、就绪后
 * 注入视图 HTML 并激活其中的 x-outlet 嵌套出口（落为 data-autospark-outlet 宿主），
 * 复现真实管线（x-html.compile 编译模板 → x-outlet 落地）的出口查找路径。
 */
function createEngineStub() {
    const comps = new WeakMap<HTMLElement, any>();
    const mounts: MountedView[] = [];

    function makeComp(): any {
        return {
            data: {
                views: [] as MountedView[],
                ephemeral: { hash: "", html: "", ready: false, error: null },
                active: "",
            },
        };
    }

    /** 视图容器落位：未就绪显示 loading；就绪注入 HTML 并激活嵌套出口 */
    function ensureContainer(outletEl: HTMLElement, view: MountedView) {
        let viewHost = outletEl.querySelector(`[data-view-hash="${view.hash}"]`) as HTMLElement | null;
        if (!viewHost) {
            viewHost = document.createElement("div");
            viewHost.setAttribute("data-view-hash", view.hash);
            outletEl.appendChild(viewHost);
        }
        if (!view.ready) {
            // 错误条目（ADR-0012 决策 2）：出口内建错误块呈现，不写 loading 哨兵——
            // loading 已随错误落下关闭（loading:false），哨兵继续存在即行为错误
            viewHost.innerHTML = view.error
                ? `<div class="autospark-outlet-error" data-status="${view.error.status}"></div>`
                : `<autospark-loading data-role="loading-indicator"></autospark-loading>`;
        } else {
            viewHost.innerHTML = view.html || "";
            // 模拟编译激活：视图内 x-outlet 简写落地为 outlet 宿主
            viewHost.querySelectorAll("[x-outlet]").forEach((el) => {
                el.removeAttribute("x-outlet");
                el.setAttribute("data-autospark-outlet", "");
                if (!comps.has(el as HTMLElement)) comps.set(el as HTMLElement, makeComp());
            });
        }
        mounts.push({ hash: view.hash, html: String(view.html || ""), ready: !!view.ready, error: view.error ?? null });
    }

    /** engine.data 直写通道：合并数据域并同步视图容器（对齐真实组件行为） */
    function writeData(outletEl: HTMLElement, patch: Record<string, any>) {
        const comp = comps.get(outletEl);
        if (!comp) return;
        const state = comp.data;
        if (patch.ephemeral) {
            state.ephemeral = patch.ephemeral;
            // 临时通道：清空本出口既有视图容器后整体替换
            Array.from(outletEl.querySelectorAll("[data-view-hash]"))
                .filter((el) => el.parentElement === outletEl)
                .forEach((el) => el.remove());
            if (patch.ephemeral.hash) ensureContainer(outletEl, patch.ephemeral);
        }
        if (patch.views) {
            state.views = patch.views;
            for (const view of patch.views) ensureContainer(outletEl, view);
        }
        if (typeof patch.active === "string") state.active = patch.active;
    }

    return {
        comps,
        mounts,
        makeComp,
        engine: {
            getComponentDeclaration: () => ({ name: "autospark.outlet" }),
            getComponent: (el: HTMLElement) => comps.get(el) ?? null,
            data: (el: HTMLElement, patch: Record<string, any>) => writeData(el, patch),
            destroy() { },
        } as any,
    };
}

let lastEngineStub: ReturnType<typeof createEngineStub> | null = null;

/**
 * 动态导入 AutoSparkRouter。
 * 构造函数自 89515f9 起自动 attach()，不得重复调用；
 * attach 链异步完成，需等待路由表加载与初始导航结束。
 * 渲染链路要求宿主内存在出口元素（data-autospark-outlet 标记）。
 */
async function createRouter(host: HTMLElement, options: any) {
    const { AutoSparkRouter } = await import("@/router");
    let rootOutlet = host.querySelector("[data-autospark-outlet]") as HTMLElement | null;
    if (!rootOutlet) {
        rootOutlet = document.createElement("div");
        rootOutlet.setAttribute("data-autospark-outlet", "");
        host.appendChild(rootOutlet);
    }
    const stub = createEngineStub();
    stub.comps.set(rootOutlet, stub.makeComp());
    lastEngineStub = stub;
    const opts =
        options && typeof options === "object" && !Array.isArray(options)
            ? { ...options, engine: stub.engine }
            : { routes: options, engine: stub.engine };
    const router = new AutoSparkRouter(host, opts);
    await new Promise((resolve) => setTimeout(resolve, 80));
    return router;
}

/** 取 matched 数组末项（最深匹配） */
function lastMatched(router: AutoSparkRouter) {
    const current = router.routes.current ?? [];
    return current[current.length - 1];
}

/**
 * 读视图文本并剔除路由上下文脚本（autospark/data）载荷。
 * 渲染契约：路由上下文（$route/$params/…）以数据脚本形式注入视图元素根内部，
 * 脚本载荷会进入 textContent——业务文本断言须先剔除，只比对真实内容。
 */
function viewText(el: Element | null | undefined): string {
    if (!el) return "";
    const clone = el.cloneNode(true) as Element;
    clone.querySelectorAll('script[type="autospark/data"]').forEach((s) => s.remove());
    return (clone.textContent ?? "").trim();
}

/** 指定 hash 的挂载序列中，加载占位（ready:false）先于就绪内容（ready:true） */
function expectPlaceholderBeforeReady(hash: string) {
    const mounts = (lastEngineStub?.mounts ?? []).filter((m) => m.hash === hash);
    const placeholderIdx = mounts.findIndex((m) => !m.ready);
    const readyIdx = mounts.findIndex((m) => m.ready);
    expect(placeholderIdx).toBeGreaterThanOrEqual(0);
    expect(readyIdx).toBeGreaterThan(placeholderIdx);
}

describe("AutoSparkRouter 递归渲染测试", () => {
    let host: HTMLElement;
    let router: AutoSparkRouter;
    let mockFetch: ReturnType<typeof spyOn> | undefined;

    beforeEach(() => {
        host = createTestDOM();
    });

    afterEach(() => {
        mockFetch?.mockRestore();
        mockFetch = undefined;
        if (router) {
            try {
                // @ts-ignore
                router.detach?.();
            } catch {
                // detach 幂等性兜底
            }
            router = undefined as any;
        }
        // @ts-ignore
        document.body.innerHTML = "";
    });

    describe("基础递归渲染", () => {
        it("应该正确渲染根路由", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: "<div class=\"root\">根路由内容</div>",
                },
            });

            await router.push("/");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            const rootElement = host.querySelector(".root");
            expect(rootElement).not.toBeNull();
            expect(viewText(rootElement)).toBe("根路由内容");
        });

        it("应该正确渲染一层嵌套路由", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    // 嵌套出口新写法：x-outlet 简写（autospark-outlet 自定义元素已退役）
                    view: '<div class="root">根路由 <div x-outlet></div></div>',
                    children: [
                        {
                            name: "child",
                            path: "child",
                            view: "<div class=\"child\">子路由内容</div>",
                        },
                    ],
                },
            });

            await router.push("/child");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            const rootElement = host.querySelector(".root");
            const childElement = host.querySelector(".child");

            expect(rootElement).not.toBeNull();
            expect(childElement).not.toBeNull();
            expect(viewText(childElement)).toBe("子路由内容");
        });

        it("应该正确渲染多层嵌套路由", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: '<div class="root">根 <div x-outlet></div></div>',
                    children: [
                        {
                            name: "level1",
                            path: "level1",
                            view: '<div class="level1">一级 <div x-outlet></div></div>',
                            children: [
                                {
                                    name: "level2",
                                    path: "level2",
                                    view: '<div class="level2">二级 <div x-outlet></div></div>',
                                    children: [
                                        {
                                            name: "level3",
                                            path: "level3",
                                            view: "<div class=\"level3\">三级内容</div>",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            });

            await router.push("/level1/level2/level3");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            const rootElement = host.querySelector(".root");
            const level1Element = host.querySelector(".level1");
            const level2Element = host.querySelector(".level2");
            const level3Element = host.querySelector(".level3");

            expect(rootElement).not.toBeNull();
            expect(level1Element).not.toBeNull();
            expect(level2Element).not.toBeNull();
            expect(level3Element).not.toBeNull();
            expect(viewText(level3Element)).toBe("三级内容");
        });
    });

    describe("Outlet 自动创建", () => {
        it("根路由渲染后宿主内存在出口", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: "<div class=\"content\">内容</div>",
                },
            });

            await router.push("/");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            // 出口宿主标记（autospark-outlet 自定义元素已退役，锚点为 data-autospark-outlet）
            const outlet = host.querySelector("[data-autospark-outlet]");
            expect(outlet).not.toBeNull();
        });

        it("根路由已有 outlet 时不应该重复创建", async () => {
            // 预先插入 outlet（注入模式：应用模板自行声明出口）
            const existingOutlet = document.createElement("div");
            existingOutlet.setAttribute("data-autospark-outlet", "");
            host.appendChild(existingOutlet);

            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: "<div class=\"content\">内容</div>",
                },
            });

            await router.push("/");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            const outlets = host.querySelectorAll("[data-autospark-outlet]");
            expect(outlets.length).toBe(1);
        });

        it("子路由没有 outlet 时不应该自动创建", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: '<div class="root">根 <div x-outlet></div></div>',
                    children: [
                        {
                            name: "child",
                            path: "child",
                            // 子路由视图没有提供更深出口
                            view: "<div class=\"child\">子路由内容</div>",
                        },
                    ],
                },
            });

            await router.push("/child");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            // 子路由内容经根视图出口正常渲染；无更深匹配层，不新增出口
            const childElement = host.querySelector(".child");
            expect(childElement).not.toBeNull();
            // 出口总数 = 根出口 + 根视图内嵌套出口（子视图无出口，不额外创建）
            expect(host.querySelectorAll("[data-autospark-outlet]").length).toBe(2);
        });
    });

    describe("视图落位（出口引用，原 RouteItem.el WeakRef 语义）", () => {
        it("根路由渲染后视图落位于根出口（route.el 已随 outlet 数据域架构移除）", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: "<div class=\"root\">内容</div>",
                },
            });

            await router.push("/");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            // current 是 matched 数组，根匹配在首位
            const current = router.routes.current ?? [];
            const rootRoute = current[0]?.route;
            expect(rootRoute).toBeDefined();

            // 旧 route.el（WeakRef<HTMLElement>）已被 outlet 数据域架构取代：
            // 渲染产物经 engine.data 写出口数据域，视图容器就位即"出口引用"成立
            const rootOutlet = host.querySelector("[data-autospark-outlet]");
            expect(rootOutlet).not.toBeNull();
            expect(viewText(rootOutlet?.querySelector(".root"))).toBe("内容");
        });

        it("嵌套路由渲染后各层出口就位（route.el 已随 outlet 数据域架构移除）", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: '<div class="root">根 <div x-outlet></div></div>',
                    children: [
                        {
                            name: "child",
                            path: "child",
                            view: "<div class=\"child\">子</div>",
                        },
                    ],
                },
            });

            await router.push("/child");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            // current 本身就是 matched 数组：根在首位、子路由在末位
            const matchedRoutes = router.routes.current ?? [];
            expect(matchedRoutes?.length).toBe(2);
            expect(matchedRoutes?.[0]?.route?.name).toBe("root");
            expect(matchedRoutes?.[matchedRoutes.length - 1]?.route?.name).toBe("child");

            // 根出口与嵌套出口各自落位对应视图
            const rootOutlet = host.querySelector("[data-autospark-outlet]");
            expect(rootOutlet?.querySelector(".root")).not.toBeNull();
            const nestedOutlet = rootOutlet?.querySelector("[data-autospark-outlet]");
            expect(nestedOutlet).not.toBeNull();
            expect(viewText(nestedOutlet?.querySelector(".child"))).toBe("子");
        });
    });

    describe("Loading 状态", () => {
        it("应该在加载异步 view 时显示 loading", async () => {
            const slowHtml = '<div class="content">加载完成</div>';
            // 异步视图：URL 源 + 慢速 fetch（函数形态视图源当前不生效，见报告）
            mockFetch = spyOn(globalThis, "fetch").mockImplementation(async () => {
                await new Promise((resolve) => setTimeout(resolve, 100));
                return {
                    ok: true,
                    status: 200,
                    statusText: "OK",
                    text: async () => slowHtml,
                    json: async () => ({}),
                } as any;
            });

            router = await createRouter(host, {
                routes: {
                    name: "slow",
                    path: "/",
                    view: "views/slow.html",
                },
            });

            await router.push("/");

            // 等待加载完成
            await new Promise((resolve) => setTimeout(resolve, 300));

            // loading 契约：同一视图先挂加载占位（ready:false），就绪后再挂内容（ready:true）
            const matched = lastMatched(router);
            expect(matched).toBeDefined();
            expectPlaceholderBeforeReady(matched!.hash);

            // loading 应该被替换为实际内容
            const loadingElement = host.querySelector("autospark-loading[data-role='loading-indicator']");
            expect(loadingElement).toBeNull();

            const contentElement = host.querySelector(".content");
            expect(contentElement).not.toBeNull();
            expect(viewText(contentElement)).toBe("加载完成");
        });

        it("应该在嵌套路由中独立显示 loading", async () => {
            const childHtml = '<div class="child">子加载完成</div>';
            mockFetch = spyOn(globalThis, "fetch").mockImplementation(async () => {
                await new Promise((resolve) => setTimeout(resolve, 100));
                return {
                    ok: true,
                    status: 200,
                    statusText: "OK",
                    text: async () => childHtml,
                    json: async () => ({}),
                } as any;
            });

            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: '<div class="root">根 <div x-outlet></div></div>',
                    children: [
                        {
                            name: "slow-child",
                            path: "slow",
                            view: "views/slow-child.html",
                        },
                    ],
                },
            });

            await router.push("/slow");

            // 等待加载完成
            await new Promise((resolve) => setTimeout(resolve, 300));

            // 根出口存在且根视图已渲染
            const parentOutlet = host.querySelector("[data-autospark-outlet]");
            expect(parentOutlet).not.toBeNull();
            expect(host.querySelector(".root")).not.toBeNull();

            // 子层视图独立经历 占位 → 就绪 的 loading 过程
            const current = router.routes.current ?? [];
            expect(current.length).toBe(2);
            expectPlaceholderBeforeReady(current[1]!.hash);

            // 加载完成后 loading 移除、子内容就位
            expect(host.querySelector("autospark-loading[data-role='loading-indicator']")).toBeNull();
            const childElement = host.querySelector(".child");
            expect(childElement).not.toBeNull();
            expect(viewText(childElement)).toBe("子加载完成");
        });
    });

    describe("错误处理", () => {
        it("应该在 view 加载失败时移除 loading", async () => {
            mockFetch = spyOn(globalThis, "fetch").mockImplementation(async () => {
                await new Promise((resolve) => setTimeout(resolve, 50));
                return {
                    ok: false,
                    status: 500,
                    statusText: "Server Error",
                    text: async () => "",
                    json: async () => ({}),
                } as any;
            });

            router = await createRouter(host, {
                routes: {
                    name: "error",
                    path: "/",
                    view: "views/error.html",
                },
            });

            await router.push("/");

            // 等待加载完成
            await new Promise((resolve) => setTimeout(resolve, 200));

            const loadingElement = host.querySelector("autospark-loading[data-role='loading-indicator']");
            expect(loadingElement).toBeNull();
        });

        it("应该继续渲染其他路由即使一个路由失败", async () => {
            mockFetch = spyOn(globalThis, "fetch").mockImplementation(async () => {
                return {
                    ok: false,
                    status: 500,
                    statusText: "Server Error",
                    text: async () => "",
                    json: async () => ({}),
                } as any;
            });

            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: '<div class="root">根 <div x-outlet></div></div>',
                    children: [
                        {
                            name: "error-child",
                            path: "error",
                            view: "views/error-child.html",
                        },
                    ],
                },
            });

            await router.push("/error");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 200));

            // 根路由应该正常渲染
            const rootElement = host.querySelector(".root");
            expect(rootElement).not.toBeNull();
        });
    });

    describe("性能测试", () => {
        it("应该在合理时间内完成深层嵌套渲染", async () => {
            // 创建 5 层嵌套
            const createNestedRoutes = (depth: number): any => {
                if (depth === 0) {
                    return {
                        name: `level-${depth}`,
                        path: `level-${depth}`,
                        view: `<div class="level-${depth}">最深层</div>`,
                    };
                }

                return {
                    name: `level-${depth}`,
                    path: `level-${depth}`,
                    view: `<div class="level-${depth}">层级 ${depth} <div x-outlet></div></div>`,
                    children: [createNestedRoutes(depth - 1)],
                };
            };

            const routes = createNestedRoutes(5);

            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: '<div class="root">根 <div x-outlet></div></div>',
                    children: [routes],
                },
            });

            const startTime = Date.now();

            await router.push("/level-5/level-4/level-3/level-2/level-1/level-0");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 200));

            const endTime = Date.now();
            const duration = endTime - startTime;

            // 5 层嵌套应该在 500ms 内完成
            expect(duration).toBeLessThan(500);

            // 验证所有层级都正确渲染
            const deepestElement = host.querySelector(".level-0");
            expect(deepestElement).not.toBeNull();
        });
    });

    describe("边界情况", () => {
        it("应该处理空 view 的情况", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "empty",
                    path: "/",
                    // @ts-ignore - 测试空 view
                    view: null,
                },
            });

            await router.push("/");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            // 不应该抛出错误
            expect(router).toBeDefined();
        });

        it("应该处理没有 children 的路由", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "no-children",
                    path: "/",
                    view: "<div class=\"content\">内容</div>",
                    // 没有 children 字段
                },
            });

            await router.push("/");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            const contentElement = host.querySelector(".content");
            expect(contentElement).not.toBeNull();
        });

        it("应该处理路由切换", async () => {
            router = await createRouter(host, {
                routes: {
                    name: "root",
                    path: "/",
                    view: '<div class="root">根 <div x-outlet></div></div>',
                    children: [
                        {
                            name: "route1",
                            path: "route1",
                            view: "<div class=\"route1\">路由1</div>",
                        },
                        {
                            name: "route2",
                            path: "route2",
                            view: "<div class=\"route2\">路由2</div>",
                        },
                    ],
                },
            });

            await router.push("/route1");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            let route1Element = host.querySelector(".route1");
            expect(route1Element).not.toBeNull();

            // 切换到 route2
            await router.push("/route2");

            // 等待渲染完成
            await new Promise((resolve) => setTimeout(resolve, 100));

            const route2Element = host.querySelector(".route2");
            expect(route2Element).not.toBeNull();

            // route1 应该不存在了
            route1Element = host.querySelector(".route1");
            expect(route1Element).toBeNull();
        });
    });
});
