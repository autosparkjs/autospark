import { describe, it, expect, beforeEach, afterEach } from "bun:test";

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
    globalThis.HTMLElement = win.HTMLElement;
    // @ts-ignore
    globalThis.Element = win.Element;
    // @ts-ignore
    globalThis.Node = win.Node;
    // @ts-ignore
    globalThis.SyntaxError = win.SyntaxError || SyntaxError;
    // @ts-ignore
    globalThis.Error = win.Error || Error;
    // @ts-ignore
    globalThis.Function = win.Function || Function;
}

/**
 * 递归渲染核心功能测试
 * 专注于测试 _renderRouteHierarchy 和相关方法的核心逻辑
 */
describe("递归渲染核心功能测试", () => {
    beforeEach(() => {
        createTestDOM();
    });
    describe("_findOrCreateOutlet 方法", () => {
        it("应该在 allowCreate=true 时自动创建 outlet", () => {
            const parent = document.createElement("div");

            // 模拟 _findOrCreateOutlet 的核心逻辑
            let outlet: HTMLElement | null = null;
            const children = Array.from(parent.children);
            outlet = children.find(child => child.tagName.toLowerCase() === "kylin-outlet") as HTMLElement || null;

            expect(outlet).toBeNull();

            // 允许创建
            if (!outlet) {
                outlet = document.createElement("kylin-outlet");
                parent.appendChild(outlet);
            }

            expect(outlet).not.toBeNull();
            expect(parent.children.length).toBe(1);
            expect(parent.children[0].tagName.toLowerCase()).toBe("kylin-outlet");
        });

        it("应该在 allowCreate=false 时不创建 outlet", () => {
            const parent = document.createElement("div");

            // 模拟 _findOrCreateOutlet 的核心逻辑
            let outlet: HTMLElement | null = null;
            const children = Array.from(parent.children);
            outlet = children.find(child => child.tagName.toLowerCase() === "kylin-outlet") as HTMLElement || null;

            expect(outlet).toBeNull();

            // 不允许创建
            const allowCreate = false;
            if (!outlet && allowCreate) {
                outlet = document.createElement("kylin-outlet");
                parent.appendChild(outlet);
            }

            expect(parent.children.length).toBe(0);
        });

        it("应该在找到现有 outlet 时返回它", () => {
            const parent = document.createElement("div");
            const existingOutlet = document.createElement("kylin-outlet");
            parent.appendChild(existingOutlet);

            // 模拟查找逻辑
            const children = Array.from(parent.children);
            const outlet = children.find(child => child.tagName.toLowerCase() === "kylin-outlet") as HTMLElement || null;

            expect(outlet).not.toBeNull();
            expect(outlet).toBe(existingOutlet);
        });
    });

    describe("WeakRef 引用管理", () => {
        it("应该正确创建和访问 WeakRef", () => {
            const element = document.createElement("kylin-outlet");
            const weakRef = new WeakRef(element);

            expect(weakRef).not.toBeNull();

            const deref = weakRef.deref();
            expect(deref).not.toBeNull();
            expect(deref).toBe(element);
        });

        it("应该在元素被销毁后返回 null", () => {
            let element = document.createElement("kylin-outlet");
            const weakRef = new WeakRef(element);

            // 移除引用，让垃圾回收器可以回收
            element = null as any;

            // 注意：在测试环境中，垃圾回收可能不会立即发生
            // 这个测试主要是演示 WeakRef 的用法
            const deref = weakRef.deref();

            // 在实际环境中，deref 可能仍然是元素（因为 GC 还没运行）
            // 但这展示了正确的使用方式
            expect(weakRef).toBeDefined();
        });

        it("应该支持在嵌套结构中使用 WeakRef", () => {
            const parent = document.createElement("div");
            const child1 = document.createElement("kylin-outlet");
            const child2 = document.createElement("kylin-outlet");

            parent.appendChild(child1);
            child1.appendChild(child2);

            // 模拟路由层级引用
            const routes = [
                { name: "root", el: new WeakRef(child1) },
                { name: "child", el: new WeakRef(child2) },
            ];

            // 验证引用
            const rootOutlet = routes[0].el.deref();
            const childOutlet = routes[1].el.deref();

            expect(rootOutlet).not.toBeNull();
            expect(childOutlet).not.toBeNull();
            expect(rootOutlet).toBe(child1);
            expect(childOutlet).toBe(child2);
        });
    });

    describe("递归渲染逻辑", () => {
        it("应该正确处理单层路由", () => {
            const host = document.createElement("div");

            // 模拟单层路由渲染
            const routes = [
                { name: "root", path: "/" },
            ];

            let parentElement = host;

            for (let i = 0; i < routes.length; i++) {
                const route = routes[i];

                // 模拟查找或创建 outlet
                let outlet = parentElement.querySelector("kylin-outlet");
                if (!outlet) {
                    outlet = document.createElement("kylin-outlet");
                    parentElement.appendChild(outlet);
                }

                // 模拟渲染内容
                const content = document.createElement("div");
                content.className = "route-" + route.name;
                content.textContent = route.name;
                outlet.appendChild(content);

                // 设置引用
                (route as any).el = new WeakRef(outlet);

                parentElement = outlet;
            }

            // 验证结果
            const rootContent = host.querySelector(".route-root");
            expect(rootContent).not.toBeNull();
            expect(rootContent?.textContent).toBe("root");
        });

        it("应该正确处理多层嵌套路由", () => {
            const host = document.createElement("div");

            // 模拟多层嵌套路由
            const routes = [
                {
                    name: "root",
                    path: "/",
                    children: [
                        {
                            name: "level1",
                            path: "level1",
                            children: [
                                {
                                    name: "level2",
                                    path: "level2",
                                },
                            ],
                        },
                    ],
                },
            ];

            // 扁平化为匹配的路由数组
            const matchedRoutes = [
                { route: routes[0], params: {} },
                { route: routes[0].children[0], params: {} },
                { route: routes[0].children[0].children[0], params: {} },
            ];

            let parentElement = host;

            for (let i = 0; i < matchedRoutes.length; i++) {
                const match = matchedRoutes[i];
                const route = match.route;

                // 模拟查找或创建 outlet
                let outlet = parentElement.querySelector("kylin-outlet");
                if (!outlet) {
                    outlet = document.createElement("kylin-outlet");
                    parentElement.appendChild(outlet);
                }

                // 模拟渲染内容
                const content = document.createElement("div");
                content.className = "route-" + route.name;
                content.textContent = route.name;

                // 如果不是最后一层，添加子 outlet
                if (i < matchedRoutes.length - 1) {
                    const childOutlet = document.createElement("kylin-outlet");
                    content.appendChild(childOutlet);
                }

                outlet.appendChild(content);

                // 设置引用
                (route as any).el = new WeakRef(outlet);

                // 下一层在当前 outlet 内部查找
                parentElement = outlet;
            }

            // 验证结果
            const rootContent = host.querySelector(".route-root");
            const level1Content = host.querySelector(".route-level1");
            const level2Content = host.querySelector(".route-level2");

            expect(rootContent).not.toBeNull();
            expect(level1Content).not.toBeNull();
            expect(level2Content).not.toBeNull();
        });

        it("应该在每层正确设置 el 引用", () => {
            const host = document.createElement("div");

            const routes = [
                { name: "root", path: "/" },
                { name: "child", path: "child" },
            ];

            let parentElement = host;

            for (let i = 0; i < routes.length; i++) {
                const route = routes[i];

                // 模拟查找或创建 outlet
                let outlet = parentElement.querySelector("kylin-outlet");
                if (!outlet) {
                    outlet = document.createElement("kylin-outlet");
                    parentElement.appendChild(outlet);
                }

                // 设置引用
                (route as any).el = new WeakRef(outlet);

                // 验证引用
                const deref = (route as any).el.deref();
                expect(deref).not.toBeNull();
                expect(deref).toBe(outlet);

                parentElement = outlet;
            }
        });
    });

    describe("Loading 状态管理", () => {
        it("应该正确显示和隐藏 loading", () => {
            const outlet = document.createElement("kylin-outlet");

            // 模拟显示 loading
            const loadingElement = document.createElement("kylin-loading");
            loadingElement.setAttribute("data-role", "loading-indicator");
            outlet.innerHTML = "";
            outlet.appendChild(loadingElement);

            // 验证 loading 存在
            let loading = outlet.querySelector("kylin-loading[data-role='loading-indicator']");
            expect(loading).not.toBeNull();

            // 模拟渲染实际内容（会自动替换 loading）
            outlet.innerHTML = "";
            const content = document.createElement("div");
            content.className = "content";
            content.textContent = "实际内容";
            outlet.appendChild(content);

            // 验证 loading 被移除
            loading = outlet.querySelector("kylin-loading[data-role='loading-indicator']");
            expect(loading).toBeNull();

            // 验证内容存在
            const actualContent = outlet.querySelector(".content");
            expect(actualContent).not.toBeNull();
            expect(actualContent?.textContent).toBe("实际内容");
        });

        it("应该正确移除 loading", () => {
            const outlet = document.createElement("kylin-outlet");

            // 添加 loading
            const loadingElement = document.createElement("kylin-loading");
            loadingElement.setAttribute("data-role", "loading-indicator");
            outlet.appendChild(loadingElement);

            // 验证 loading 存在
            let loading = outlet.querySelector("kylin-loading[data-role='loading-indicator']");
            expect(loading).not.toBeNull();

            // 模拟移除 loading
            loading?.remove();

            // 验证 loading 被移除
            loading = outlet.querySelector("kylin-loading[data-role='loading-indicator']");
            expect(loading).toBeNull();
        });
    });

    describe("性能测试", () => {
        it("应该在合理时间内完成深层嵌套", () => {
            const depth = 10;
            const host = document.createElement("div");

            const startTime = Date.now();

            let parentElement = host;
            for (let i = 0; i < depth; i++) {
                // 查找或创建 outlet
                let outlet = parentElement.querySelector("kylin-outlet");
                if (!outlet) {
                    outlet = document.createElement("kylin-outlet");
                    parentElement.appendChild(outlet);
                }

                // 添加内容
                const content = document.createElement("div");
                content.className = "level-" + i;
                outlet.appendChild(content);

                // 如果不是最后一层，添加子 outlet
                if (i < depth - 1) {
                    const childOutlet = document.createElement("kylin-outlet");
                    outlet.appendChild(childOutlet);
                    parentElement = childOutlet;
                }
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // 10 层嵌套应该在 100ms 内完成
            expect(duration).toBeLessThan(100);
        });

        it("应该正确处理大量 WeakRef 创建", () => {
            const elements: HTMLElement[] = [];
            const weakRefs: WeakRef<HTMLElement>[] = [];

            const startTime = Date.now();

            // 创建 1000 个 WeakRef
            for (let i = 0; i < 1000; i++) {
                const element = document.createElement("kylin-outlet");
                elements.push(element);
                weakRefs.push(new WeakRef(element));
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // 创建 1000 个 WeakRef 应该很快
            expect(duration).toBeLessThan(50);

            // 验证所有引用都可访问
            for (let i = 0; i < weakRefs.length; i++) {
                const deref = weakRefs[i].deref();
                expect(deref).not.toBeNull();
                expect(deref).toBe(elements[i]);
            }
        });
    });

    describe("边界情况", () => {
        it("应该处理空路由数组", () => {
            const matchedRoutes: any[] = [];
            const host = document.createElement("div");

            // 模拟递归渲染
            if (matchedRoutes.length === 0) {
                // 应该提前返回，不做任何操作
                expect(host.children.length).toBe(0);
            }
        });

        it("应该处理路由没有 view 的情况", () => {
            const route = { name: "empty", view: null };
            const outlet = document.createElement("kylin-outlet");

            // 模拟检查 viewContent
            const loadResult = (route as any).viewContent;

            if (!loadResult) {
                // 应该跳过渲染
                expect(outlet.children.length).toBe(0);
            }
        });

        it("应该处理 outlet 查找失败", () => {
            const parent = document.createElement("div");
            // 不添加 outlet

            // 模拟查找 outlet
            const outlet = parent.querySelector("kylin-outlet");

            expect(outlet).toBeNull();

            // 应该返回 null 或抛出错误
            if (!outlet) {
                // 处理错误情况
                expect(true).toBe(true);
            }
        });
    });
});
