import { describe, it, expect, beforeEach, afterEach } from "bun:test";
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

    // 创建 host 元素
    // @ts-ignore
    const host = document.createElement("div") as HTMLElement;
    // @ts-ignore
    document.body.appendChild(host);
    return host;
}

/** 最小 engine stub：注入模式下跳过自建管线 */
function stubEngine() {
    return {
        getComponentDeclaration: () => ({ name: "autospark.outlet" }),
        getComponent: () => ({
            data: { views: [], ephemeral: { hash: "", html: "", ready: false }, active: "" },
        }),
        data: () => { },
        destroy() { },
    } as any;
}

/**
 * 动态导入 AutoSparkRouter。
 * 构造函数自 89515f9 起自动 attach()，不得重复调用（抛 Already attached）；
 * attach 链异步完成，需等待路由表加载与初始导航结束后再注册钩子/导航。
 */
async function createRouter(host: HTMLElement, options: any) {
    const { AutoSparkRouter } = await import("@/router");
    // 渲染链路要求宿主内存在出口元素
    if (!host.querySelector("[data-autospark-outlet]")) {
        const outlet = document.createElement("div");
        outlet.setAttribute("data-autospark-outlet", "");
        host.appendChild(outlet);
    }
    const router = new AutoSparkRouter(host, { engine: stubEngine(), ...options });
    await new Promise((resolve) => setTimeout(resolve, 80));
    return router;
}

/** 取 matched 数组末项（最深匹配） */
function lastMatched(router: AutoSparkRouter) {
    const current = router.routes.current ?? [];
    return current[current.length - 1];
}

/** 等待导航结束（cancel 与 end 都算一轮导航结束） */
function waitNav(ms = 120) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("AutoSparkRouter 钩子系统完整集成测试", () => {
    let host: HTMLElement;
    let router: AutoSparkRouter;

    beforeEach(async () => {
        host = createTestDOM();
    });

    afterEach(() => {
        if (router) {
            try {
                router.detach();
            } catch (e) {
                // 忽略 detach 错误
            }
            router = undefined as any;
        }
        // 清理 DOM
        if (host && host.parentElement) {
            host.parentElement.removeChild(host);
        }
    });

    describe("完整的导航流程与钩子执行顺序", () => {
        it("应该按照正确的顺序执行所有钩子类型和路由守卫", async () => {
            const order: string[] = [];

            const routes = [
                {
                    name: "target",
                    path: "/target",
                    // beforeRender 需视图成功加载才触发；函数视图避免远程 fetch
                    view: () => "<div>target</div>",
                    // 路由级守卫：beforeEnter 已更名为 beforeRoute（返回 false 拦截、字符串改道）
                    beforeRoute: () => {
                        order.push("beforeEnter");
                        return true;
                    }
                }
            ];

            router = await createRouter(host, { routes });

            // 全局钩子：beforeEach → beforeRoute、renderEach → beforeRender、afterEach → afterRoute
            // @ts-ignore
            router.hooks.add("beforeRoute", () => {
                order.push("beforeEach");
                return true;
            });

            // @ts-ignore
            router.hooks.add("beforeRender", () => {
                order.push("renderEach");
            });

            // @ts-ignore
            router.hooks.add("afterRoute", () => {
                order.push("afterEach");
            });

            router.push("/target");

            // 等待导航完成
            await waitNav();

            expect(order).toEqual([
                "beforeEach",
                "beforeEnter",
                "renderEach",
                "afterEach"
            ]);
        });

        it("应该在嵌套路由中正确执行所有钩子", async () => {
            const order: string[] = [];

            const routes = [
                {
                    name: "parent",
                    path: "/parent",
                    beforeRoute: () => {
                        order.push("parent-beforeEnter");
                        return true;
                    },
                    children: [
                        {
                            name: "child",
                            path: "child",
                            // beforeRender 需视图成功加载才触发
                            view: () => "<div>child</div>",
                            beforeRoute: () => {
                                order.push("child-beforeEnter");
                                return true;
                            }
                        }
                    ]
                }
            ];

            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("beforeRoute", () => {
                order.push("beforeEach");
                return true;
            });

            // @ts-ignore
            router.hooks.add("beforeRender", () => {
                order.push("renderEach");
            });

            router.push("/parent/child");

            // 等待导航完成
            await waitNav();

            expect(order).toEqual([
                "beforeEach",
                "parent-beforeEnter",
                "child-beforeEnter",
                "renderEach"
            ]);
        });

        it("应该在导航取消时停止执行后续钩子", async () => {
            const order: string[] = [];
            let cancelled = false;

            const routes = [
                {
                    name: "target",
                    path: "/target",
                    view: () => "<div>target</div>",
                    beforeRoute: () => {
                        order.push("beforeEnter");
                        return false;
                    }
                }
            ];

            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("beforeRoute", () => {
                order.push("beforeEach");
                return true;
            });

            // @ts-ignore
            router.hooks.add("beforeRender", () => {
                order.push("renderEach");
            });

            router.on("navigation:cancel", () => { cancelled = true; });

            router.push("/target");

            // 等待导航完成
            await waitNav();

            // 拦截语义：守卫链在 beforeEnter 处中断，renderEach 不执行、cancel 事件触发；
            // afterRoute 在 finally 中无条件执行（导航已产生历史条目），不再属于“后续钩子”语义
            expect(order).toEqual([
                "beforeEach",
                "beforeEnter"
            ]);
            expect(cancelled).toBe(true);
        });
    });

    describe("钩子与路由状态的交互", () => {
        it("应该正确传递 to 和 from 参数给所有钩子", async () => {
            const routes = [
                { name: "a", path: "/a" },
                { name: "b", path: "/b" }
            ];

            router = await createRouter(host, { routes });

            let capturedTo: any;
            let capturedFrom: any;

            // beforeRoute 钩子参数为单对象 { to, from }，to/from 均为 matched 数组
            // @ts-ignore
            router.hooks.add("beforeRoute", (args: any) => {
                capturedTo = args.to;
                capturedFrom = args.from;
                return true;
            });

            // 先导航到 /a
            router.push("/a");
            await waitNav(60);

            // 再导航到 /b
            router.push("/b");

            // 等待导航完成
            await waitNav();

            // matched 数组末项为最深匹配
            expect(capturedTo[capturedTo.length - 1].route.name).toBe("b");
            expect(capturedFrom[capturedFrom.length - 1].route.name).toBe("a");
        });

        it("应该正确传递路由参数给钩子", async () => {
            const routes = [
                { name: "user", path: "/user/:id" }
            ];

            router = await createRouter(host, { routes });

            let capturedParams: any;

            // @ts-ignore
            router.hooks.add("beforeRoute", (args: any) => {
                const to = args.to;
                capturedParams = to[to.length - 1].params;
                return true;
            });

            router.push("/user/123");

            // 等待导航完成
            await waitNav();

            expect(capturedParams).toEqual({ id: "123" });
        });

        it("应该正确传递查询参数给钩子", async () => {
            const routes = [
                { name: "search", path: "/search" }
            ];

            router = await createRouter(host, { routes });

            let capturedQuery: any;

            // @ts-ignore
            router.hooks.add("beforeRoute", (args: any) => {
                const to = args.to;
                // query 解析在匹配链的根项上
                const withQuery = to.find((m: any) => m.query && Object.keys(m.query).length > 0);
                capturedQuery = withQuery?.query;
                return true;
            });

            router.push("/search?q=test&page=1");

            // 等待导航完成
            await waitNav();

            expect({ ...capturedQuery }).toEqual({ q: "test", page: "1" });
        });
    });

    describe("错误处理和恢复", () => {
        it("应该处理钩子执行中的错误并继续导航", async () => {
            const routes = [
                { name: "target", path: "/target" }
            ];

            router = await createRouter(host, { routes });

            // 钩子错误默认被忽略（ignoreErrors 缺省 true），后续钩子继续执行
            // @ts-ignore
            router.hooks.add("beforeRoute", () => {
                throw new Error("Hook error");
            });

            // @ts-ignore
            router.hooks.add("beforeRoute", () => {
                return true;
            });

            router.push("/target");

            // 等待导航完成
            await waitNav();

            // 导航应该继续
            expect(lastMatched(router)!.route!.name).toBe("target");
        });

        it("应该在 beforeRoute 返回 false 时取消导航", async () => {
            const routes = [
                { name: "home", path: "/" },
                { name: "target", path: "/target", view: () => "<div>target</div>" }
            ];

            router = await createRouter(host, { routes });

            let cancelled = false;
            let rendered = false;

            // next(false) 语义迁移为 return false
            // @ts-ignore
            router.hooks.add("beforeRoute", (args: any) => {
                const to = args.to;
                if (to[to.length - 1].path === "/target") {
                    return false;
                }
                return true;
            });

            // @ts-ignore
            router.hooks.add("beforeRender", () => { rendered = true; });
            router.on("navigation:cancel", () => { cancelled = true; });

            router.push("/target");

            // 等待导航完成
            await waitNav();

            // 导航应该被取消：渲染被跳过、cancel 事件触发
            // （URL 与 routes.current 仍会更新——历史条目在守卫前已落）
            expect(cancelled).toBe(true);
            expect(rendered).toBe(false);
        });

        it("路由守卫抛出错误时应跳过该守卫（不阻断导航）", async () => {
            const routes = [
                { name: "home", path: "/" },
                {
                    name: "target",
                    path: "/target",
                    beforeRoute: () => {
                        throw new Error("Guard error");
                    }
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/target");

            // 等待导航完成
            await waitNav();

            // 守卫错误默认被忽略（ignoreErrors 缺省 true），导航继续完成
            expect(lastMatched(router)!.path).toBe("/target");
        });

        it("应该在 beforeRender 错误时继续渲染", async () => {
            let secondHookRan = false;
            const routes = [
                { name: "target", path: "/target", view: () => "<div>target</div>" }
            ];

            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("beforeRender", () => {
                throw new Error("RenderEach error");
            });

            // @ts-ignore
            router.hooks.add("beforeRender", () => {
                secondHookRan = true;
            });

            router.push("/target");

            // 等待导航完成
            await waitNav();

            // 导航应该继续，第二个钩子仍被执行
            // （renderEach 的 next(data) 数据通道已随新钩子签名废弃，见数据预加载一节）
            expect(lastMatched(router)!.route!.name).toBe("target");
            expect(secondHookRan).toBe(true);
        });

        it("应该在 afterRoute 错误时不影响导航完成", async () => {
            const routes = [
                { name: "target", path: "/target" }
            ];

            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("afterRoute", () => {
                throw new Error("AfterEach error");
            });

            router.push("/target");

            // 等待导航完成
            await waitNav();

            // 导航应该完成
            expect(lastMatched(router)!.route!.name).toBe("target");
        });
    });

    describe("重定向功能集成", () => {
        it("应该在 beforeRoute 重定向时正确处理", async () => {
            const routes = [
                { name: "redirect", path: "/redirect" },
                { name: "target", path: "/target" }
            ];

            router = await createRouter(host, { routes });

            // next("/target") 语义迁移为返回路径字符串（改道）
            // @ts-ignore
            router.hooks.add("beforeRoute", (args: any) => {
                const to = args.to;
                if (to[to.length - 1].path === "/redirect") {
                    return "/target";
                }
                return true;
            });

            router.push("/redirect");

            // 等待导航完成（含改道引发的第二轮导航）
            await waitNav(200);

            // 应该重定向到 /target
            expect(lastMatched(router)!.path).toBe("/target");
        });

        it("应该在 beforeRoute 路由守卫重定向时正确处理", async () => {
            const routes = [
                {
                    name: "redirect",
                    path: "/redirect",
                    beforeRoute: () => "/target"
                },
                { name: "target", path: "/target" }
            ];

            router = await createRouter(host, { routes });
            router.push("/redirect");

            // 等待导航完成（含改道引发的第二轮导航）
            await waitNav(200);

            // 应该重定向到 /target
            expect(lastMatched(router)!.path).toBe("/target");
        });

        it("应该在重定向时执行目标路由的守卫", async () => {
            let guardExecuted = false;

            const routes = [
                {
                    name: "redirect",
                    path: "/redirect",
                    beforeRoute: () => "/target"
                },
                {
                    name: "target",
                    path: "/target",
                    beforeRoute: () => {
                        guardExecuted = true;
                        return true;
                    }
                }
            ];

            router = await createRouter(host, { routes });
            router.push("/redirect");

            // 等待导航完成（含改道引发的第二轮导航）
            await waitNav(200);

            // 应该执行目标路由的守卫
            expect(guardExecuted).toBe(true);
            expect(lastMatched(router)!.path).toBe("/target");
        });
    });

    describe("数据预加载集成", () => {
        it("应该正确传递预加载数据给组件", async () => {
            const preloadData = { userId: "123", userName: "Test User" };

            const routes = [
                // renderEach next(data) 通道已废弃；预加载数据改由路由 data 数据源（DataLoader）承载
                { name: "user", path: "/user/:id", data: () => preloadData }
            ];

            router = await createRouter(host, { routes });

            router.push("/user/123");

            // 等待导航完成
            await waitNav();

            // 数据经 DataLoader 写入路由项的 AsyncLoader signal
            const loader = (lastMatched(router)!.route as any)?._getData;
            expect(loader).toBeDefined();
            expect(loader.signal.result).toEqual(preloadData);
        });

        it("应该合并来自多个钩子的预加载数据", async () => {
            const routes = [
                {
                    name: "target",
                    path: "/target",
                    view: () => "<div>target</div>",
                    data: () => ({})
                }
            ];

            router = await createRouter(host, { routes });

            // beforeRender 钩子收到已加载的路由数据对象，可向其合并预加载字段
            // @ts-ignore
            router.hooks.add("beforeRender", (args: any) => {
                Object.assign(args.data, { key1: "value1" });
            });

            // @ts-ignore
            router.hooks.add("beforeRender", (args: any) => {
                Object.assign(args.data, { key2: "value2" });
            });

            router.push("/target");

            // 等待导航完成
            await waitNav();

            // 数据应该被合并（与 DataLoader signal 结果为同一对象引用）
            const loader = (lastMatched(router)!.route as any)?._getData;
            expect(loader.signal.result).toEqual({
                key1: "value1",
                key2: "value2"
            });
        });

        it("应该支持异步数据预加载", async () => {
            const routes = [
                {
                    name: "user",
                    path: "/user",
                    data: async () => {
                        await new Promise(resolve => setTimeout(resolve, 50));
                        return { asyncData: "loaded" };
                    }
                }
            ];

            router = await createRouter(host, { routes });

            router.push("/user");

            // 等待导航完成
            await waitNav();

            // 异步数据应该被正确加载
            const loader = (lastMatched(router)!.route as any)?._getData;
            expect(loader.signal.result).toEqual({ asyncData: "loaded" });
        });
    });

    describe("复杂场景集成", () => {
        it("应该正确处理认证和权限检查", async () => {
            const isAuthenticated = () => false;
            const hasPermission = () => false;

            const routes = [
                { name: "home", path: "/" },
                {
                    name: "login",
                    path: "/login"
                },
                {
                    name: "profile",
                    path: "/profile",
                    beforeRoute: () => {
                        if (!isAuthenticated()) {
                            return "/login";
                        }
                        return true;
                    }
                },
                {
                    name: "admin",
                    path: "/admin",
                    beforeRoute: () => {
                        if (!hasPermission()) {
                            return "/login";
                        }
                        return true;
                    }
                }
            ];

            router = await createRouter(host, { routes });

            // 尝试访问受保护的路由
            router.push("/profile");

            // 等待导航完成（含改道引发的第二轮导航）
            await waitNav(200);

            // 应该重定向到登录页面
            expect(lastMatched(router)!.path).toBe("/login");
        });

        it("应该正确处理页面离开时的清理工作", async () => {
            let cleanupExecuted = false;

            const routes = [
                { name: "source", path: "/source" },
                // afterLeave 语义已并入目标路由的 afterRoute（见 router.guards.test.ts 同款迁移）
                {
                    name: "target",
                    path: "/target",
                    afterRoute: () => {
                        cleanupExecuted = true;
                    }
                }
            ];

            router = await createRouter(host, { routes });

            router.push("/source");

            // 等待导航完成
            await waitNav(60);

            router.push("/target");

            // 等待导航完成
            await waitNav();

            // afterRoute 应该被调用
            expect(cleanupExecuted).toBe(true);
            expect(lastMatched(router)!.path).toBe("/target");
        });

        it("应该正确处理滚动到顶部等导航后操作", async () => {
            let scrollExecuted = false;

            const routes = [
                { name: "home", path: "/" },
                { name: "target", path: "/target" }
            ];

            router = await createRouter(host, { routes });

            // @ts-ignore
            router.hooks.add("afterRoute", () => {
                scrollExecuted = true;
            });

            router.push("/target");

            // 等待导航完成
            await waitNav();

            // afterRoute 应该被调用
            expect(scrollExecuted).toBe(true);
        });
    });
});
