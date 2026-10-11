import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { KylinRouter } from "@/router";

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

/**
 * 动态导入 KylinRouter 以避免加载时的依赖问题
 */
async function createRouter(host: HTMLElement, options: any) {
    const { KylinRouter } = await import("@/router");
    const router = new KylinRouter(host, options);
    router.attach();
    return router;
}

describe("KylinRouter navigation API", () => {
    let host: HTMLElement;
    let router: KylinRouter;

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
            router.detach();
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

            expect(router.routes.current.route).not.toBeNull();
            expect(router.routes.current.route!.name).toBe("user");
            expect(router.location.pathname).toBe("/user");
        });

        it("replace('/user') 应该替换当前历史记录而不是新增", async () => {
            router = await createRouter(host, { routes });

            // 先 push 到一个路径
            router.push("/user");
            expect(router.routes.current.route!.name).toBe("user");

            // replace 到另一个路径
            router.replace("/settings");

            expect(router.routes.current.route).not.toBeNull();
            expect(router.routes.current.route!.name).toBe("settings");
            expect(router.location.pathname).toBe("/settings");
        });

        it("back() 应该返回上一页", async () => {
            router = await createRouter(host, { routes });

            // 先导航到某个路径
            router.push("/user");
            expect(router.routes.current.route!.name).toBe("user");

            // 再导航到另一个路径
            router.push("/settings");
            expect(router.routes.current.route!.name).toBe("settings");

            // back 应该返回到 /user
            router.back();

            expect(router.routes.current.route!.name).toBe("user");
        });

        it("forward() 应该前进到下一页", async () => {
            router = await createRouter(host, { routes });

            // 先导航到两个路径
            router.push("/user");
            router.push("/settings");

            // 回退到 /user
            router.back();
            expect(router.routes.current.route!.name).toBe("user");

            // forward 应该前进到 /settings
            router.forward();

            expect(router.routes.current.route!.name).toBe("settings");
        });

        it("go(-1) 应该返回上一页（等价于 back）", async () => {
            router = await createRouter(host, { routes });

            // 导航到不同路径
            router.push("/user");
            router.push("/settings");

            expect(router.routes.current.route!.name).toBe("settings");

            // go(-1) 应该返回到 /user
            router.go(-1);

            expect(router.routes.current.route!.name).toBe("user");
        });

        it("go(1) 应该前进一页（等价于 forward）", async () => {
            router = await createRouter(host, { routes });

            router.push("/user");
            router.push("/settings");
            router.back();

            expect(router.routes.current.route!.name).toBe("user");

            // go(1) 应该前进到 /settings
            router.go(1);

            expect(router.routes.current.route!.name).toBe("settings");
        });

        it("导航方法应该触发 onRouteUpdate 回调", async () => {
            router = await createRouter(host, { routes });

            // 收集 route/change 事件
            const routeChanges: any[] = [];
            host.addEventListener("route/change", ((event: any) => {
                routeChanges.push(event.detail);
            }) as EventListener);

            router.push("/user");

            // 应该有 route/change 事件被触发
            expect(routeChanges.length).toBeGreaterThan(0);
            expect(routeChanges[routeChanges.length - 1].route.name).toBe("user");
        });

        it("导航方法应该更新 current.route、current.params、current.query 属性", async () => {
            router = await createRouter(host, { routes });

            router.push("/user/42?tab=profile");

            expect(router.routes.current.route).not.toBeNull();
            expect(router.routes.current.route!.name).toBe("user-detail");
            expect(router.routes.current.params).toEqual({ id: "42" });
            expect(router.routes.current.query).toEqual({ tab: "profile" });
        });
    });

    describe("导航状态管理", () => {
        it("isNavigating 属性应该存在且默认为 false", async () => {
            router = await createRouter(host, { routes });

            expect(router.isNavigating).toBe(false);
        });

        it("导航过程中 isNavigating 应该被正确管理", async () => {
            router = await createRouter(host, { routes });

            // 收集 navigation/end 事件来验证导航完成
            let navEndFired = false;
            host.addEventListener("navigation/end", () => {
                navEndFired = true;
            });

            router.push("/user");

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

            host.addEventListener("navigation/start", ((event: any) => {
                navStarts.push(event.detail);
            }) as EventListener);

            host.addEventListener("navigation/end", ((event: any) => {
                navEnds.push(event.detail);
            }) as EventListener);

            router.push("/user");

            expect(navStarts.length).toBe(1);
            expect(navStarts[0].path).toBe("/user");
            expect(navStarts[0].navigationType).toBe("push");

            expect(navEnds.length).toBe(1);
            expect(navEnds[0].location).toBeDefined();
            expect(navEnds[0].navigationType).toBe("push");
        });

        it("replace 应该触发带 replace 类型的导航事件", async () => {
            router = await createRouter(host, { routes });

            const navStarts: any[] = [];

            host.addEventListener("navigation/start", ((event: any) => {
                navStarts.push(event.detail);
            }) as EventListener);

            router.replace("/settings");

            expect(navStarts.length).toBe(1);
            expect(navStarts[0].navigationType).toBe("replace");
        });

        it("back/forward/go 应该触发带 pop 类型的导航事件", async () => {
            router = await createRouter(host, { routes });

            router.push("/user");
            router.push("/settings");

            const navStarts: any[] = [];

            host.addEventListener("navigation/start", ((event: any) => {
                navStarts.push(event.detail);
            }) as EventListener);

            router.back();

            expect(navStarts.length).toBe(1);
            expect(navStarts[0].navigationType).toBe("pop");
        });
    });
});
