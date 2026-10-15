import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { AutoSparkRouter } from "@/router";

/**
 * 创建测试用的 DOM 环境
 */
function createTestDOM() {
    const { Window } = require("happy-dom");
    const win = new Window({ url: "http://localhost/" });

    // 设置全局对象 - 每次测试重新设置，确保干净状态
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

/** 在未显式提供 engine 时注入 stub */
function stubEnginePass(options: any) {
    if (options && typeof options === "object" && !Array.isArray(options) && options.engine) {
        return options;
    }
    if (options && typeof options === "object" && !Array.isArray(options)) {
        return { ...options, engine: stubEngine() };
    }
    // 数组/单对象/字符串/函数格式：包成带 routes 的配置
    return { routes: options, engine: stubEngine() };
}

/**
 * 动态导入 AutoSparkRouter 以避免加载时的依赖问题。
 * 构造函数自 89515f9 起自动 attach()，不得重复调用（抛 Already attached）；
 * attach 链异步完成，需等待路由表加载与初始导航结束。
 */
async function createRouter(host: HTMLElement, options: any) {
    const { AutoSparkRouter } = await import("@/router");
    // 渲染链路要求宿主内存在出口元素
    if (!host.querySelector("[data-autospark-outlet]")) {
        const outlet = document.createElement("div");
        outlet.setAttribute("data-autospark-outlet", "");
        host.appendChild(outlet);
    }
    const router = new AutoSparkRouter(host, stubEnginePass(options));
    await new Promise((resolve) => setTimeout(resolve, 80));
    return router;
}

/** 取 matched 数组末项（最深匹配） */
function lastMatched(router: AutoSparkRouter) {
    const current = router.routes.current ?? [];
    return current[current.length - 1];
}

/** 等待导航链（匹配→渲染→current 置位）完成 */
function waitNav(ms = 100) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("AutoSparkRouter navigation API", () => {
    let host: HTMLElement;
    let router: AutoSparkRouter;

    const routes = [
        { name: "home", path: "/" },
        { name: "user", path: "/user" },
        { name: "user-detail", path: "/user/:id" },
        { name: "settings", path: "/settings" },
        { name: "not-found", path: "*" },
    ];

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

    describe("编程式导航方法", () => {
        it("push('/user') 应该导航到 /user 并更新 current", async () => {
            router = await createRouter(host, { routes });

            router.push("/user");
            await waitNav();

            // current 是 matched 数组，末项为最深匹配
            const matched = lastMatched(router);
            expect(matched).toBeDefined();
            expect(matched!.route!.name).toBe("user");
            expect(router.location.pathname).toBe("/user");
        });

        it("replace('/user') 应该替换当前历史记录而不是新增", async () => {
            router = await createRouter(host, { routes });

            // 先 push 到一个路径
            router.push("/user");
            await waitNav();
            expect(lastMatched(router)!.route!.name).toBe("user");

            // replace 到另一个路径
            router.replace("/settings");
            await waitNav();

            const matched = lastMatched(router);
            expect(matched).toBeDefined();
            expect(matched!.route!.name).toBe("settings");
            expect(router.location.pathname).toBe("/settings");
        });

        it("back() 应该返回上一页", async () => {
            router = await createRouter(host, { routes });

            // 先导航到某个路径
            router.push("/user");
            await waitNav();
            expect(lastMatched(router)!.route!.name).toBe("user");

            // 再导航到另一个路径
            router.push("/settings");
            await waitNav();
            expect(lastMatched(router)!.route!.name).toBe("settings");

            // back 应该返回到 /user
            router.back();
            await waitNav();

            expect(lastMatched(router)!.route!.name).toBe("user");
        });

        it("forward() 应该前进到下一页", async () => {
            router = await createRouter(host, { routes });

            // 先导航到两个路径
            router.push("/user");
            await waitNav();
            router.push("/settings");
            await waitNav();

            // 回退到 /user
            router.back();
            await waitNav();
            expect(lastMatched(router)!.route!.name).toBe("user");

            // forward 应该前进到 /settings
            router.forward();
            await waitNav();

            expect(lastMatched(router)!.route!.name).toBe("settings");
        });

        it("go(-1) 应该返回上一页（等价于 back）", async () => {
            router = await createRouter(host, { routes });

            // 导航到不同路径
            router.push("/user");
            await waitNav();
            router.push("/settings");
            await waitNav();

            expect(lastMatched(router)!.route!.name).toBe("settings");

            // go(-1) 应该返回到 /user
            router.go(-1);
            await waitNav();

            expect(lastMatched(router)!.route!.name).toBe("user");
        });

        it("go(1) 应该前进一页（等价于 forward）", async () => {
            router = await createRouter(host, { routes });

            router.push("/user");
            await waitNav();
            router.push("/settings");
            await waitNav();
            router.back();
            await waitNav();

            expect(lastMatched(router)!.route!.name).toBe("user");

            // go(1) 应该前进到 /settings
            router.go(1);
            await waitNav();

            expect(lastMatched(router)!.route!.name).toBe("settings");
        });

        it("导航方法应该触发 onRouteUpdate 回调", async () => {
            router = await createRouter(host, { routes });

            // 收集路由匹配事件（onRouteUpdate 匹配完成后发出 navigation:matched，
            // detail 为 { fromRoute, toRoute }，toRoute 末项为最深匹配）
            const routeChanges: any[] = [];
            router.on("navigation:matched", (detail: any) => {
                routeChanges.push(detail);
            });

            router.push("/user");
            await waitNav();

            // 应该有匹配事件被触发
            expect(routeChanges.length).toBeGreaterThan(0);
            const toRoute = routeChanges[routeChanges.length - 1].toRoute ?? [];
            expect(toRoute[toRoute.length - 1]?.route?.name).toBe("user");
        });

        it("导航方法应该更新 current.route、current.params、current.query 属性", async () => {
            router = await createRouter(host, { routes });

            router.push("/user/42?tab=profile");
            await waitNav();

            // current 是 matched 数组：末项为最深匹配（携带 params），
            // query 解析在匹配链上（逐层传递）
            const matched = lastMatched(router);
            expect(matched).toBeDefined();
            expect(matched!.route!.name).toBe("user-detail");
            expect(matched!.params).toEqual({ id: "42" });
            const current = router.routes.current ?? [];
            const withQuery = current.find((m) => m.query && Object.keys(m.query).length > 0);
            expect(withQuery).toBeDefined();
            expect({ ...withQuery!.query }).toEqual({ tab: "profile" });
        });
    });

    describe("导航状态管理", () => {
        it("isNavigating 属性应该存在且默认为 false", async () => {
            router = await createRouter(host, { routes });

            expect(router.isNavigating).toBe(false);
        });

        it("导航过程中 isNavigating 应该被正确管理", async () => {
            router = await createRouter(host, { routes });

            // 收集 navigation:end 事件来验证导航完成（router 实例事件，mitt）
            let navEndFired = false;
            router.on("navigation:end", () => {
                navEndFired = true;
            });

            router.push("/user");
            await waitNav();

            // 导航完成后 isNavigating 应该回到 false
            expect(navEndFired).toBe(true);
            expect(router.isNavigating).toBe(false);
        });
    });

    describe("导航事件系统", () => {
        it("push 应该触发 navigation/start 和 navigation/end 事件", async () => {
            router = await createRouter(host, { routes });

            const navStarts: any[] = [];
            const navEnds: any[] = [];

            // 导航事件为 router 实例事件（mitt）：navigation:start / navigation:end，
            // detail 为 history 库的 Update（{ action, location }）
            router.on("navigation:start", (detail: any) => {
                navStarts.push(detail);
            });
            router.on("navigation:end", (detail: any) => {
                navEnds.push(detail);
            });

            router.push("/user");
            await waitNav();

            expect(navStarts.length).toBe(1);
            expect(navStarts[0].location.pathname).toBe("/user");
            expect(navStarts[0].action.toLowerCase()).toBe("push");

            expect(navEnds.length).toBe(1);
            expect(navEnds[0].location).toBeDefined();
            expect(navEnds[0].action.toLowerCase()).toBe("push");
        });

        it("replace 应该触发带 replace 类型的导航事件", async () => {
            router = await createRouter(host, { routes });

            const navStarts: any[] = [];

            router.on("navigation:start", (detail: any) => {
                navStarts.push(detail);
            });

            router.replace("/settings");
            await waitNav();

            expect(navStarts.length).toBe(1);
            expect(navStarts[0].action.toLowerCase()).toBe("replace");
        });

        it("back/forward/go 应该触发带 pop 类型的导航事件", async () => {
            router = await createRouter(host, { routes });

            router.push("/user");
            await waitNav();
            router.push("/settings");
            await waitNav();

            const navStarts: any[] = [];

            router.on("navigation:start", (detail: any) => {
                navStarts.push(detail);
            });

            router.back();
            await waitNav();

            expect(navStarts.length).toBe(1);
            expect(navStarts[0].action.toLowerCase()).toBe("pop");
        });
    });
});
