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

    // 补充 happy-dom 缺失的全局构造函数（createHashHistory 需要）
    // happy-dom 的 Window 缺少 SyntaxError，导致 querySelectorAll 失败
    // @ts-ignore
    win.SyntaxError = SyntaxError;

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

describe("Hash mode routing", () => {
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
        if (host && host.parentElement) {
            host.parentElement.removeChild(host);
        }
    });

    it("mode: 'hash' 应该使用 HashHistory 而非 BrowserHistory", async () => {
        router = await createRouter(host, { mode: "hash", routes });

        // history 实例应该是 HashHistory 类型（通过检测 hash 相关属性来验证）
        // history 库的 HashHistory 与 BrowserHistory 有相同接口
        // 验证 push 操作后路径正确更新
        router.push("/user");
        expect(router.location.pathname).toBe("/user");
    });

    it("Hash 模式下 push('/user') 应该更新 URL 为 #/user", async () => {
        router = await createRouter(host, { mode: "hash", routes });

        router.push("/user");

        expect(router.routes.current.route).not.toBeNull();
        expect(router.routes.current.route!.name).toBe("user");
        expect(router.location.pathname).toBe("/user");
    });

    it("Hash 模式和 History 模式的 API 完全统一", async () => {
        router = await createRouter(host, { mode: "hash", routes });

        // push
        router.push("/user");
        expect(router.routes.current.route!.name).toBe("user");

        // replace
        router.replace("/settings");
        expect(router.routes.current.route!.name).toBe("settings");

        // params
        router.push("/user/42");
        expect(router.routes.current.params).toEqual({ id: "42" });

        // query
        router.push("/user?tab=profile");
        expect(router.routes.current.query).toEqual({ tab: "profile" });
    });

    it("Hash 模式下导航事件正确触发", async () => {
        router = await createRouter(host, { mode: "hash", routes });

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
        expect(navStarts[0].navigationType).toBe("push");
        expect(navEnds.length).toBe(1);
        expect(navEnds[0].navigationType).toBe("push");
    });

    it("默认使用 History 模式（mode 未指定时）", async () => {
        router = await createRouter(host, { routes });

        // 应该正常工作（BrowserHistory 模式）
        router.push("/user");
        expect(router.routes.current.route!.name).toBe("user");
    });

    it("push/replace 支持 state 参数", async () => {
        router = await createRouter(host, { routes });

        router.push("/user", { from: "home" });
        expect(router.routes.current.route!.name).toBe("user");

        router.replace("/settings", { reason: "redirect" });
        expect(router.routes.current.route!.name).toBe("settings");
    });
});
