import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { KylinRouter } from "@/router";
import { isInternalLink, isDangerousProtocol } from "@/components/Link";

/**
 * 创建测试用的 DOM 环境
 */
function createTestDOM() {
    const { Window } = require("happy-dom");
    const win = new Window({ url: "http://localhost/" });

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

    // @ts-ignore
    const host = document.createElement("div") as HTMLElement;
    // @ts-ignore
    document.body.appendChild(host);
    return host;
}

async function createRouter(host: HTMLElement, options: any) {
    const { KylinRouter } = await import("@/router");
    return new KylinRouter(host, options);
}

/**
 * 模拟 handleClick 逻辑的纯函数版本
 * 避免在测试中实例化 LitElement（happy-dom 兼容性问题）
 */
function simulateHandleClick(
    to: string,
    replace: boolean,
    router: KylinRouter | undefined,
    event: Event,
) {
    // 安全检查：拒绝危险协议
    if (isDangerousProtocol(to)) {
        event.preventDefault();
        return;
    }

    // 判断是否为内部路由
    if (!isInternalLink(to)) {
        return;
    }

    // 内部路由处理
    if (!router) {
        return;
    }

    event.preventDefault();

    if (replace) {
        router.replace(to);
    } else {
        router.push(to);
    }
}

describe("KylinLinkElement", () => {
    let host: HTMLElement;
    let router: KylinRouter;

    const routes = [
        { name: "home", path: "/" },
        { name: "user", path: "/user" },
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

    describe("isInternalLink 纯函数测试", () => {
        it("以 / 开头的路径应为内部路由", () => {
            expect(isInternalLink("/user")).toBe(true);
            expect(isInternalLink("/settings/profile")).toBe(true);
            expect(isInternalLink("/")).toBe(true);
        });

        it("外部链接不应为内部路由", () => {
            expect(isInternalLink("https://external.com")).toBe(false);
            expect(isInternalLink("http://example.com")).toBe(false);
        });

        it("空字符串不应为内部路由", () => {
            expect(isInternalLink("")).toBe(false);
        });

        it("相对路径不以 / 开头不应为内部路由", () => {
            expect(isInternalLink("relative/path")).toBe(false);
        });
    });

    describe("isDangerousProtocol 纯函数测试", () => {
        it("javascript: 协议应被识别为危险", () => {
            expect(isDangerousProtocol("javascript:alert('xss')")).toBe(true);
            expect(isDangerousProtocol("JAVASCRIPT:void(0)")).toBe(true);
        });

        it("data: 协议应被识别为危险", () => {
            expect(isDangerousProtocol("data:text/html,<h1>test</h1>")).toBe(true);
            expect(isDangerousProtocol("DATA:image/png;base64,abc")).toBe(true);
        });

        it("正常路径不应被识别为危险", () => {
            expect(isDangerousProtocol("/user")).toBe(false);
            expect(isDangerousProtocol("https://example.com")).toBe(false);
        });
    });

    describe("内部路由导航", () => {
        it("点击 <kylin-link to=\"/user\"> 应该调用 router.push('/user')", async () => {
            router = await createRouter(host, { routes });

            const clickEvent = new Event("click", { cancelable: true });
            simulateHandleClick("/user", false, router, clickEvent);

            expect(router.routes.current.route).not.toBeNull();
            expect(router.routes.current.route!.name).toBe("user");
        });

        it("点击 <kylin-link to=\"/user\" replace> 应该调用 router.replace('/user')", async () => {
            router = await createRouter(host, { routes });

            // 先导航到一个路径建立初始状态
            router.push("/settings");

            // 监听 navigation/start 事件来验证 replace 类型
            let navType: string | undefined;
            host.addEventListener("navigation/start", ((event: any) => {
                navType = event.detail.navigationType;
            }) as EventListener);

            const clickEvent = new Event("click", { cancelable: true });
            simulateHandleClick("/user", true, router, clickEvent);

            expect(navType).toBe("replace");
            expect(router.routes.current.route!.name).toBe("user");
        });

        it("内部路由应该阻止默认的链接跳转行为", async () => {
            router = await createRouter(host, { routes });

            const clickEvent = new Event("click", { cancelable: true });
            simulateHandleClick("/user", false, router, clickEvent);

            expect(clickEvent.defaultPrevented).toBe(true);
        });
    });

    describe("外部链接处理", () => {
        it('点击 <kylin-link to="https://external.com"> 不应使用 router 导航', async () => {
            router = await createRouter(host, { routes });

            router.push("/settings");
            const routeBefore = router.routes.current.route!.name;

            const clickEvent = new Event("click", { cancelable: true });
            simulateHandleClick("https://external.com", false, router, clickEvent);

            expect(router.routes.current.route!.name).toBe(routeBefore);
            expect(clickEvent.defaultPrevented).toBe(false);
        });

        it('点击 <kylin-link to="http://example.com"> 不应使用 router 导航', async () => {
            router = await createRouter(host, { routes });

            router.push("/user");
            const routeBefore = router.routes.current.route!.name;

            const clickEvent = new Event("click", { cancelable: true });
            simulateHandleClick("http://example.com", false, router, clickEvent);

            expect(router.routes.current.route!.name).toBe(routeBefore);
            expect(clickEvent.defaultPrevented).toBe(false);
        });
    });

    describe("降级处理", () => {
        it("<kylin-link> 在未获取到 router 实例时应该降级为普通链接", () => {
            const clickEvent = new Event("click", { cancelable: true });
            simulateHandleClick("/user", false, undefined, clickEvent);

            // 没有 router 时不应阻止默认行为（降级为普通 <a> 标签）
            expect(clickEvent.defaultPrevented).toBe(false);
        });
    });

    describe("安全性", () => {
        it("应该拒绝 javascript: 协议的链接", async () => {
            router = await createRouter(host, { routes });

            router.push("/user");
            const routeBefore = router.routes.current.route!.name;

            const clickEvent = new Event("click", { cancelable: true });
            simulateHandleClick("javascript:alert('xss')", false, router, clickEvent);

            expect(router.routes.current.route!.name).toBe(routeBefore);
            expect(clickEvent.defaultPrevented).toBe(true);
        });

        it("应该拒绝 data: 协议的链接", async () => {
            router = await createRouter(host, { routes });

            router.push("/settings");
            const routeBefore = router.routes.current.route!.name;

            const clickEvent = new Event("click", { cancelable: true });
            simulateHandleClick("data:text/html,<h1>test</h1>", false, router, clickEvent);

            expect(router.routes.current.route!.name).toBe(routeBefore);
            expect(clickEvent.defaultPrevented).toBe(true);
        });
    });
});
