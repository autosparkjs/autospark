import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { AutoSparkRouter } from "@/router";
import { isInternalLink, isDangerousProtocol, AutoSparkLink } from "@/components/Link";
import { matchLinkActive } from "@/utils/matchLinkActive";

/**
 * 基准 realm（test-setup preload 建立的 happy-dom 全局）。
 *
 * auto-link 在模块加载期注册进基准 customElements；下方纯函数用例的 createTestDOM
 * 会用「每用例新建 Window」替换全局。委托/组件用例依赖基准 realm（customElements
 * 注册表 + 类原型链一致），beforeEach 里 restoreBaseRealm 切回。
 *
 * 注意：bun 按文件交错「求值模块 → 跑用例」，先跑的文件会把全局替换成它自己的
 * Window，本文件模块求值时再快照全局拿到的就是被污染的 realm——故从
 * test-setup 在 preload 期锚定的 __AUTOSPARK_PRELOAD_REALM__ 取（缺省回退即时快照）。
 */
const REALM_KEYS = [
    "window",
    "document",
    "history",
    "location",
    "Event",
    "CustomEvent",
    "MouseEvent",
    "HTMLElement",
    "HTMLAnchorElement",
    "URLSearchParams",
    "customElements",
] as const;
const baseRealm = ((globalThis as any).__AUTOSPARK_PRELOAD_REALM__ ??
    Object.fromEntries(REALM_KEYS.map((key) => [key, (globalThis as any)[key]]))) as Record<
    (typeof REALM_KEYS)[number],
    any
>;

function restoreBaseRealm() {
    for (const key of REALM_KEYS) {
        (globalThis as any)[key] = baseRealm[key];
    }
}

/**
 * 创建测试用的 DOM 环境（每用例独立 Window，供纯函数用例使用）
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
    globalThis.MouseEvent = win.MouseEvent;
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

/** 最小 engine stub：注入模式下跳过自建管线（与 router.core.test.ts 同款） */
function stubEngine() {
    return {
        getComponentDeclaration: () => ({ name: "autospark.outlet" }),
        getComponent: () => ({
            data: { views: [], ephemeral: { hash: "", html: "", ready: false }, active: "" },
        }),
        data: () => {},
        destroy() {},
    } as any;
}

/**
 * 动态导入 AutoSparkRouter；构造函数自动 attach()，attach 链异步完成——
 * 渲染链路要求宿主内存在出口元素，注入 stub engine 并等待链路落地。
 */
async function createRouter(host: HTMLElement, options: any) {
    const { AutoSparkRouter } = await import("@/router");
    if (!host.querySelector("[data-autospark-outlet]")) {
        const outlet = host.ownerDocument!.createElement("div");
        outlet.setAttribute("data-autospark-outlet", "");
        host.appendChild(outlet);
    }
    const merged =
        options && typeof options === "object" && !Array.isArray(options)
            ? { ...options, engine: stubEngine() }
            : { routes: options, engine: stubEngine() };
    const router = new AutoSparkRouter(host, merged);
    await new Promise((resolve) => setTimeout(resolve, 80));
    return router;
}

/** 当前路由名（routes.current 是 matched 数组，末项为最深匹配） */
function currentRouteName(router: AutoSparkRouter): string | undefined {
    const current = (router.routes as any).current as any[] | undefined;
    return current?.[current.length - 1]?.route?.name;
}

/**
 * 包装 push/replace 记录调用（保留真实导航行为），断言"哪个方法、什么路径"用
 */
function recordNavigation(router: AutoSparkRouter) {
    const calls: Array<{ method: "push" | "replace"; path: string }> = [];
    const originalPush = router.push.bind(router);
    const originalReplace = router.replace.bind(router);
    (router as any).push = (path: string, state?: any) => {
        calls.push({ method: "push", path });
        return originalPush(path, state);
    };
    (router as any).replace = (path: string, state?: any) => {
        calls.push({ method: "replace", path });
        return originalReplace(path, state);
    };
    return calls;
}

/** 在目标元素上派发一次可冒泡的点击 */
function click(target: Element, init: MouseEventInit = {}): MouseEvent {
    const event = new MouseEvent("click", { bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
}

/**
 * 模拟 handleClick 逻辑的纯函数版本（组件 handleClick 的镜像，快速校验分支语义）
 */
function simulateHandleClick(
    to: string,
    replace: boolean,
    router: AutoSparkRouter | undefined,
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

describe("AutoSparkLink（auto-link）纯函数与点击语义", () => {
    let host: HTMLElement;
    let router: AutoSparkRouter;

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
            router = undefined as any;
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
        it('点击 <auto-link to="/user"> 应该调用 router.push(\'/user\')', async () => {
            router = await createRouter(host, { routes });
            await new Promise((resolve) => setTimeout(resolve, 50));

            const clickEvent = new Event("click", { cancelable: true });
            simulateHandleClick("/user", false, router, clickEvent);
            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(currentRouteName(router)).toBe("user");
        });

        it('点击 <auto-link to="/user" replace> 应该调用 router.replace(\'/user\')', async () => {
            router = await createRouter(host, { routes });

            // 先导航到一个路径建立初始状态
            router.push("/settings");
            await new Promise((resolve) => setTimeout(resolve, 100));

            const clickEvent = new Event("click", { cancelable: true });
            simulateHandleClick("/user", true, router, clickEvent);
            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(currentRouteName(router)).toBe("user");
        });

        it("内部路由应该阻止默认的链接跳转行为", async () => {
            router = await createRouter(host, { routes });

            const clickEvent = new Event("click", { cancelable: true });
            simulateHandleClick("/user", false, router, clickEvent);

            expect(clickEvent.defaultPrevented).toBe(true);
        });
    });

    describe("外部链接处理", () => {
        it('点击 <auto-link to="https://external.com"> 不应使用 router 导航', async () => {
            router = await createRouter(host, { routes });

            router.push("/settings");
            await new Promise((resolve) => setTimeout(resolve, 100));
            const routeBefore = currentRouteName(router);

            const clickEvent = new Event("click", { cancelable: true });
            simulateHandleClick("https://external.com", false, router, clickEvent);
            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(currentRouteName(router)).toBe(routeBefore);
            expect(clickEvent.defaultPrevented).toBe(false);
        });

        it('点击 <auto-link to="http://example.com"> 不应使用 router 导航', async () => {
            router = await createRouter(host, { routes });

            router.push("/user");
            await new Promise((resolve) => setTimeout(resolve, 100));
            const routeBefore = currentRouteName(router);

            const clickEvent = new Event("click", { cancelable: true });
            simulateHandleClick("http://example.com", false, router, clickEvent);
            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(currentRouteName(router)).toBe(routeBefore);
            expect(clickEvent.defaultPrevented).toBe(false);
        });
    });

    describe("降级处理", () => {
        it("<auto-link> 在未获取到 router 实例时应该降级为普通链接", () => {
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
            await new Promise((resolve) => setTimeout(resolve, 100));
            const routeBefore = currentRouteName(router);

            const clickEvent = new Event("click", { cancelable: true });
            simulateHandleClick("javascript:alert('xss')", false, router, clickEvent);
            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(currentRouteName(router)).toBe(routeBefore);
            expect(clickEvent.defaultPrevented).toBe(true);
        });

        it("应该拒绝 data: 协议的链接", async () => {
            router = await createRouter(host, { routes });

            router.push("/settings");
            await new Promise((resolve) => setTimeout(resolve, 100));
            const routeBefore = currentRouteName(router);

            const clickEvent = new Event("click", { cancelable: true });
            simulateHandleClick("data:text/html,<h1>test</h1>", false, router, clickEvent);
            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(currentRouteName(router)).toBe(routeBefore);
            expect(clickEvent.defaultPrevented).toBe(true);
        });
    });
});

describe("matchLinkActive 纯函数（ADR-0121 激活态匹配）", () => {
    it("精确命中", () => {
        expect(matchLinkActive("/user", "/user")).toBe("exact");
        expect(matchLinkActive("/", "/")).toBe("exact");
    });

    it("段边界前缀命中", () => {
        expect(matchLinkActive("/guide", "/guide/intro")).toBe("prefix");
        expect(matchLinkActive("/guide", "/guide/intro/advanced")).toBe("prefix");
    });

    it("非段边界前缀不命中", () => {
        expect(matchLinkActive("/guide", "/guides")).toBe(false);
        expect(matchLinkActive("/guide", "/guide-x")).toBe(false);
    });

    it('to="/" 仅根路径精确命中，不做前缀', () => {
        expect(matchLinkActive("/", "/guide")).toBe(false);
        expect(matchLinkActive("/", "/")).toBe("exact");
    });

    it("规范化：尾斜杠与大小写（D-07/D-08）", () => {
        expect(matchLinkActive("/Guide/", "/guide")).toBe("exact");
        expect(matchLinkActive("/user", "/user/")).toBe("exact");
    });

    it("to 的 query/hash 只取 path 部分参与比较", () => {
        expect(matchLinkActive("/user?tab=2", "/user?tab=1")).toBe("exact");
        expect(matchLinkActive("/guide#top", "/guide")).toBe("exact");
    });

    it("空 to 与外部链接不参与", () => {
        expect(matchLinkActive("", "/user")).toBe(false);
        expect(matchLinkActive("https://example.com/x", "/x")).toBe(false);
        expect(matchLinkActive("relative", "/relative")).toBe(false);
    });
});

describe("auto-link 激活态（ADR-0121）", () => {
    let host: HTMLElement;
    let router: AutoSparkRouter;

    const routes = [
        { name: "home", path: "/" },
        { name: "guide", path: "/guide" },
        { name: "guide-intro", path: "/guide/intro" },
        { name: "guides", path: "/guides" },
        { name: "user", path: "/user" },
        { name: "not-found", path: "*" },
    ];

    beforeEach(async () => {
        restoreBaseRealm();
        baseRealm.window.history.replaceState(null, "", "/");
        host = baseRealm.document.createElement("div");
        baseRealm.document.body.appendChild(host);
        router = await createRouter(host, { routes });
    });

    afterEach(() => {
        if (router) {
            router.detach();
            router = undefined as any;
        }
        if (host && host.parentElement) {
            host.parentElement.removeChild(host);
        }
    });

    function makeLink(to: string, attrs: Record<string, string> = {}): AutoSparkLink {
        const link = baseRealm.document.createElement("auto-link") as AutoSparkLink;
        link.setAttribute("to", to);
        for (const [key, value] of Object.entries(attrs)) {
            link.setAttribute(key, value);
        }
        host.appendChild(link);
        return link;
    }

    async function pushAndWait(path: string) {
        router.push(path);
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    it("初始 commit 后精确命中：宿主 active + 内层 aria-current", async () => {
        await pushAndWait("/user");
        const link = makeLink("/user");
        expect(link.classList.contains("active")).toBe(true);
        expect(link.querySelector("a")!.getAttribute("aria-current")).toBe("page");
    });

    it("导航翻转：前缀命中不加 aria-current，段外与根不命中", async () => {
        await pushAndWait("/guide/intro");
        const exact = makeLink("/guide/intro");
        const parent = makeLink("/guide");
        const sibling = makeLink("/guides");
        const root = makeLink("/");

        expect(exact.classList.contains("active")).toBe(true);
        expect(exact.querySelector("a")!.getAttribute("aria-current")).toBe("page");
        expect(parent.classList.contains("active")).toBe(true);
        expect(parent.querySelector("a")!.getAttribute("aria-current")).toBeNull();
        expect(sibling.classList.contains("active")).toBe(false);
        expect(root.classList.contains("active")).toBe(false);
    });

    it("失配移除：离开后 active 与 aria-current 撤下", async () => {
        await pushAndWait("/user");
        const link = makeLink("/user");
        expect(link.classList.contains("active")).toBe(true);

        await pushAndWait("/guide");
        expect(link.classList.contains("active")).toBe(false);
        expect(link.querySelector("a")!.hasAttribute("aria-current")).toBe(false);
    });

    it("query 与 hash 不参与匹配", async () => {
        await pushAndWait("/user?tab=1#top");
        const pathOnly = makeLink("/user");
        const withQuery = makeLink("/user?tab=2");
        expect(pathOnly.classList.contains("active")).toBe(true);
        expect(withQuery.classList.contains("active")).toBe(true);
    });

    it("规范化：to 的大小写与尾斜杠不影响精确命中", async () => {
        await pushAndWait("/guide");
        const link = makeLink("/GUIDE/");
        expect(link.classList.contains("active")).toBe(true);
    });

    it("不破坏宿主既有类名", async () => {
        await pushAndWait("/user");
        const link = makeLink("/user", { class: "foo bar" });
        expect(link.classList.contains("foo")).toBe(true);
        expect(link.classList.contains("bar")).toBe(true);
        expect(link.classList.contains("active")).toBe(true);
    });

    it("外部链接永不 active", async () => {
        await pushAndWait("/user");
        const link = makeLink("https://example.com/user");
        expect(link.classList.contains("active")).toBe(false);
    });

    it("to 属性变更即重评激活态", async () => {
        await pushAndWait("/user");
        const link = makeLink("/guide");
        expect(link.classList.contains("active")).toBe(false);
        link.setAttribute("to", "/user");
        expect(link.classList.contains("active")).toBe(true);
    });

    it("断开连接后不再翻转激活态", async () => {
        await pushAndWait("/user");
        const link = makeLink("/guide");
        expect(link.classList.contains("active")).toBe(false);
        link.remove();

        await pushAndWait("/guide");
        expect(link.classList.contains("active")).toBe(false);
    });

    it("base 前缀剥除后参与匹配", async () => {
        router.detach();
        host.parentElement?.removeChild(host);
        host = baseRealm.document.createElement("div");
        baseRealm.document.body.appendChild(host);
        router = await createRouter(host, { routes, base: "/app" });

        await pushAndWait("/app/user");
        const link = makeLink("/user");
        expect(link.classList.contains("active")).toBe(true);
    });
});

describe("全局 <a> 拦截（文档级委托，ADR-0009）", () => {
    let host: HTMLElement;
    let router: AutoSparkRouter;
    let calls: Array<{ method: "push" | "replace"; path: string }>;

    const routes = [
        { name: "home", path: "/" },
        { name: "user", path: "/user" },
        { name: "settings", path: "/settings" },
        { name: "not-found", path: "*" },
    ];

    beforeEach(async () => {
        // 委托/组件用例依赖基准 realm（auto-link 注册表 + 类原型链）
        restoreBaseRealm();
        // 基准 realm 的 history 跨用例共享：重置 URL，避免 getBaseUrl 的目录推断
        // 把上一用例 push 过的路径（如 /user → "/user/"）误当 base
        baseRealm.window.history.replaceState(null, "", "/");
        host = baseRealm.document.createElement("div");
        baseRealm.document.body.appendChild(host);
        router = await createRouter(host, { routes });
        calls = recordNavigation(router);
    });

    afterEach(() => {
        if (router) {
            router.detach();
            router = undefined as any;
        }
        if (host && host.parentElement) {
            host.parentElement.removeChild(host);
        }
    });

    function anchor(href?: string, attrs: Record<string, string> = {}): HTMLAnchorElement {
        const el = baseRealm.document.createElement("a");
        if (href !== undefined) el.setAttribute("href", href);
        for (const [key, value] of Object.entries(attrs)) {
            el.setAttribute(key, value);
        }
        host.appendChild(el);
        return el;
    }

    async function expectNavigated(
        el: Element,
        expected: { method: "push" | "replace"; path: string },
        init: MouseEventInit = {},
    ) {
        const event = click(el, init);
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(calls).toEqual([expected]);
        return event;
    }

    describe("接管与路径归一", () => {
        it("内部路径点击应被接管为 push", async () => {
            const el = anchor("/user");
            const event = await expectNavigated(el, { method: "push", path: "/user" });
            expect(event.defaultPrevented).toBe(true);
            expect(currentRouteName(router)).toBe("user");
        });

        it("href 内含 base 前缀时应剥除后 push", async () => {
            router.detach();
            host.parentElement?.removeChild(host);
            host = baseRealm.document.createElement("div");
            baseRealm.document.body.appendChild(host);
            router = await createRouter(host, { routes, base: "/app" });
            calls = recordNavigation(router);

            const el = anchor("/app/user");
            const event = await expectNavigated(el, { method: "push", path: "/user" });
            expect(event.defaultPrevented).toBe(true);
            expect(currentRouteName(router)).toBe("user");
        });

        it("search 与 hash 应保留在 push 目标中", async () => {
            const el = anchor("/user?tab=1#top");
            await expectNavigated(el, { method: "push", path: "/user?tab=1#top" });
        });

        it("相对路径应解析为绝对路径后接管", async () => {
            const el = anchor("user");
            await expectNavigated(el, { method: "push", path: "/user" });
        });
    });

    describe("放行矩阵（交还浏览器默认行为）", () => {
        const cases: Array<[string, () => HTMLAnchorElement, MouseEventInit]> = [
            ["ctrl+点击", () => anchor("/user"), { ctrlKey: true }],
            ["meta+点击", () => anchor("/user"), { metaKey: true }],
            ["shift+点击", () => anchor("/user"), { shiftKey: true }],
            ["alt+点击", () => anchor("/user"), { altKey: true }],
            ["中键点击", () => anchor("/user"), { button: 1 }],
            ["右键点击", () => anchor("/user"), { button: 2 }],
            ['target="_blank"', () => anchor("/user", { target: "_blank" }), {}],
            ['target="_top"', () => anchor("/user", { target: "_top" }), {}],
            ["download 属性", () => anchor("/user", { download: "" }), {}],
            ['rel 含 external', () => anchor("/user", { rel: "external noopener" }), {}],
            ["纯页内锚点", () => anchor("#section"), {}],
            ["mailto: 协议", () => anchor("mailto:someone@example.com"), {}],
            ["tel: 协议", () => anchor("tel:+1234567890"), {}],
            ["跨域链接", () => anchor("https://example.com/user"), {}],
            ["无 href", () => anchor(undefined), {}],
        ];

        for (const [label, make, init] of cases) {
            it(`${label} 不接管、不阻止默认行为`, async () => {
                const el = make();
                const event = click(el, init);
                await new Promise((resolve) => setTimeout(resolve, 100));
                expect(calls).toEqual([]);
                expect(event.defaultPrevented).toBe(false);
            });
        }
    });

    describe("边界", () => {
        it("已被 preventDefault 的事件不再接管", async () => {
            const el = anchor("/user");
            const event = new MouseEvent("click", { bubbles: true, cancelable: true });
            event.preventDefault();
            el.dispatchEvent(event);
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(calls).toEqual([]);
        });

        it("宿主子树外的锚点不归本 router 管", async () => {
            const outside = baseRealm.document.createElement("a");
            outside.setAttribute("href", "/user");
            baseRealm.document.body.appendChild(outside);
            try {
                const event = click(outside);
                await new Promise((resolve) => setTimeout(resolve, 100));
                expect(calls).toEqual([]);
                expect(event.defaultPrevented).toBe(false);
            } finally {
                outside.parentElement?.removeChild(outside);
            }
        });

        it("javascript: 危险协议被拦截且不导航", async () => {
            const el = anchor("javascript:alert(1)");
            const event = click(el);
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(calls).toEqual([]);
            expect(event.defaultPrevented).toBe(true);
            expect(currentRouteName(router)).not.toBe("user");
        });

        it("data: 危险协议被拦截且不导航", async () => {
            const el = anchor("data:text/html,<h1>x</h1>");
            const event = click(el);
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(calls).toEqual([]);
            expect(event.defaultPrevented).toBe(true);
        });
    });

    describe("auto-link 组件路径（委托命中自定义元素）", () => {
        it("点击 auto-link 内层 <a> 应由组件接管 push", async () => {
            const link = baseRealm.document.createElement("auto-link") as AutoSparkLink;
            link.setAttribute("to", "/user");
            link.textContent = "去用户页";
            host.appendChild(link);
            expect(link instanceof AutoSparkLink).toBe(true);

            const inner = link.querySelector("a")!;
            expect(inner.getAttribute("href")).toBe("/user");

            const event = await expectNavigated(inner, { method: "push", path: "/user" });
            expect(event.defaultPrevented).toBe(true);
            expect(currentRouteName(router)).toBe("user");
        });

        it("auto-link 带 replace 属性时走 replace", async () => {
            const link = baseRealm.document.createElement("auto-link") as AutoSparkLink;
            link.setAttribute("to", "/user");
            link.setAttribute("replace", "");
            host.appendChild(link);

            const event = await expectNavigated(link.querySelector("a")!, {
                method: "replace",
                path: "/user",
            });
            expect(event.defaultPrevented).toBe(true);
        });

        it("auto-link 的 to 渲染内层 href 时带 base 前缀，导航剥回", async () => {
            router.detach();
            host.parentElement?.removeChild(host);
            host = baseRealm.document.createElement("div");
            baseRealm.document.body.appendChild(host);
            router = await createRouter(host, { routes, base: "/app" });
            calls = recordNavigation(router);

            const link = baseRealm.document.createElement("auto-link") as AutoSparkLink;
            link.setAttribute("to", "/user");
            host.appendChild(link);

            const inner = link.querySelector("a")!;
            expect(inner.getAttribute("href")).toBe("/app/user");

            await expectNavigated(inner, { method: "push", path: "/user" });
            expect(currentRouteName(router)).toBe("user");
        });
    });
});
