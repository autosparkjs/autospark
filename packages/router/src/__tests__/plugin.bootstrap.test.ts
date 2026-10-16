/**
 * router 插件自举专项测试（ADR-0011 / ADR-0116）
 *
 * 覆盖：
 * - 挂载矩阵四分支（sniff engine.options）：routes:false 显式禁用 / routes 有值 /
 *   无 routes + autoDiscoverRoutes:true（默认壳表 + 整表发现）/ 都没有（静默不挂载）
 * - precompile 挂载路径 DOM 预处理：默认出口插入 + x-outlet 简写 transform
 * - $.route 路由快照：导航 commit 后写入 engine.store.state.$.route（四字段）
 * - AutoSpark.precompile 语义：fire-once per engine、无 retain（晚注册不回溯）
 *
 * 注意：包入口（src/index.ts）的模块副作用才是 bootstrapRouterPlugin()——直接导
 * 入 "@/router"（类定义文件）不会注册插件，故本文件显式加载 "@/index" 模拟产品
 * 加载顺序（先于任何 engine 构造）。
 */

import { describe, it, expect, afterEach } from "bun:test";
import { AutoSparkRouter } from "@/router";
import { setupTestEnvironment } from "./test-setup";

setupTestEnvironment();

// 加载 router 包入口：模块加载即注册 precompile / ready 双回调（双路径：此时
// globalThis.AutoSpark 不存在，走 __AUTOSPARK_PLUGINS__ 预加载队列，首个 engine
// 构造期 drain——注册恰赶在该 engine 的 precompile fire 之前）
await import("@/index");

const win = (globalThis as any).window;

const nextTick = () => new Promise<void>((r) => setTimeout(r, 0));

/** attach 异步链等待（router.core 的 80ms 模式：表加载 + 首导航） */
const attachWait = () => new Promise<void>((r) => setTimeout(r, 80));

/** 轮询等待条件成立（attach 链时序的确定性兜底） */
async function until(cond: () => boolean, timeout = 1000): Promise<void> {
    const start = Date.now();
    while (!cond()) {
        if (Date.now() - start > timeout) throw new Error("until: 条件等待超时");
        await new Promise((r) => setTimeout(r, 10));
    }
}

// ── 测试基座 ──────────────────────────────────────────────────────────────────

/** 用例内待清理资源（router.detach / engine.destroy / fetch 还原），afterEach 逆序执行 */
let cleanups: Array<() => void> = [];

function onCleanup(fn: () => void): void {
    cleanups.push(fn);
}

afterEach(() => {
    for (const fn of cleanups.reverse()) {
        try {
            fn();
        } catch {
            /* 各资源清理互相独立 */
        }
    }
    cleanups = [];
    document.body.innerHTML = "";
    // 基准 realm history 跨用例共享：replaceState 重置，避免上一用例 URL 泄漏
    win.history.replaceState(null, "", "/");
});

/**
 * 构造带 options 的真实 engine（走插件自举：precompile / ready 回调在构造期触发）。
 * 挂载分支下 router 由 ready 回调创建并开始 attach 异步链（host.router 可取）。
 */
async function bootEngine(options: Record<string, any>, tpl = "") {
    const { AutoSpark } = await import("autospark");
    const host = document.createElement("div");
    if (tpl) host.innerHTML = tpl;
    document.body.appendChild(host);
    const engine: any = new AutoSpark(host, {}, options as any);
    onCleanup(() => {
        try {
            (host as any).router?.detach?.();
        } catch {
            /* 独立清理 */
        }
        try {
            engine.destroy?.();
        } catch {
            /* 独立清理 */
        }
    });
    return { host, engine };
}

/** fetch stub：记录调用 URL；routes.json 可定制应答，其余一律 404 空文本 */
function mockFetch(routesJson?: unknown) {
    const calls: string[] = [];
    const original = globalThis.fetch;
    (globalThis as any).fetch = async (url: any) => {
        const u = String(url);
        calls.push(u);
        if (routesJson !== undefined && u.includes("routes.json")) {
            return {
                ok: true,
                status: 200,
                statusText: "OK",
                json: async () => routesJson,
                text: async () => JSON.stringify(routesJson),
            } as any;
        }
        return {
            ok: false,
            status: 404,
            statusText: "Not Found",
            json: async () => {
                throw new Error("404");
            },
            text: async () => "",
        } as any;
    };
    onCleanup(() => {
        (globalThis as any).fetch = original;
    });
    return calls;
}

const ROUTES = [
    { name: "home", path: "/" },
    { name: "user", path: "/user/:id" },
];

// ── 挂载矩阵（ADR-0011） ──────────────────────────────────────────────────────

describe("router 插件自举：挂载矩阵（ADR-0011）", () => {
    it("routes: false 显式禁用：不挂载，precompile 不做出口预处理", async () => {
        mockFetch();
        const { host } = await bootEngine({ routes: false }, `<div x-outlet></div>`);
        await nextTick();

        expect((host as any).router).toBeUndefined();
        // 出口预处理未执行：简写未被改写激活（无组件实例化出口落地）
        expect(host.querySelector("[data-autospark-outlet]")).toBeNull();
    });

    it("routes 有值：挂载该表，autoDiscoverRoutes 不触发（零 routes.json 探测）", async () => {
        const calls = mockFetch();
        const { host, engine } = await bootEngine({ routes: ROUTES });
        await attachWait();

        const router = (host as any).router;
        expect(router).toBeInstanceOf(AutoSparkRouter);
        expect(router.engine).toBe(engine);
        // 显式表生效
        expect(router.routes.namedRouteItems?.size).toBe(2);
        expect(router.routes.match("/user/42")?.slice(-1)[0]?.route?.name).toBe("user");
        // 发现未触发：整表探测零调用
        expect(calls.filter((u) => u.includes("routes.json"))).toEqual([]);
        // precompile 出口预处理：默认出口已插入并随首编译激活
        expect(host.querySelector("[data-autospark-outlet]")).toBeTruthy();
    });

    it("无 routes + autoDiscoverRoutes: true：挂默认壳表并整表发现（ADR-0010 根探测）", async () => {
        mockFetch([{ name: "home", path: "/" }, { name: "about", path: "/about" }]);
        const { host, engine } = await bootEngine({ autoDiscoverRoutes: true });
        await attachWait();

        const router = (host as any).router;
        expect(router).toBeInstanceOf(AutoSparkRouter);
        expect(router.engine).toBe(engine);
        expect(router.options.autoDiscoverRoutes).toBe(true);
        // 发现的整表被采用（壳表被替换）
        expect(router.routes.match("/about")?.slice(-1)[0]?.route?.name).toBe("about");
        expect(host.querySelector("[data-autospark-outlet]")).toBeTruthy();
    });

    it("都没有：静默不挂载（纯 engine 应用零影响）", async () => {
        const calls = mockFetch();
        const { host } = await bootEngine({}, `<span>plain</span>`);
        await nextTick();

        expect((host as any).router).toBeUndefined();
        expect(host.querySelector("[data-autospark-outlet]")).toBeNull();
        expect(calls).toEqual([]);
    });
});

// ── precompile 挂载路径 DOM 预处理（ADR-0011） ────────────────────────────────

describe("router 插件自举：precompile DOM 预处理", () => {
    it("x-outlet 简写在首编译前 transform：值透传为 props，组件随首编译激活", async () => {
        mockFetch();
        const { host, engine } = await bootEngine(
            { routes: ROUTES },
            `<div x-outlet="{ keepAlive: true }"></div>`,
        );
        await attachWait();

        // 组件实例化出口落地，且简写值透传生效（props 缺省 keepAlive=false → 此处 true）
        const outlet = host.querySelector("[data-autospark-outlet]") as HTMLElement | null;
        expect(outlet).toBeTruthy();
        expect(engine.getComponent(outlet)?.data?.keepAlive).toBe(true);
    });

    it("宿主无出口声明时补默认出口（随克隆参与首编译）", async () => {
        mockFetch();
        const { host } = await bootEngine({ routes: ROUTES });
        await attachWait();

        expect(host.querySelector("[data-autospark-outlet]")).toBeTruthy();
    });
});

// ── $.route 路由快照（ADR-0011） ──────────────────────────────────────────────

describe("router 插件自举：$.route 路由快照（ADR-0011）", () => {
    it("commit 后写入 state.$.route（path/fullPath/params/query 四字段）", async () => {
        mockFetch();
        const { host, engine } = await bootEngine({ routes: ROUTES });
        await attachWait();

        const router = (host as any).router as AutoSparkRouter;
        const state = engine.store.state;

        // 首导航 commit："/" 的快照已就位
        expect(state.$.route).toBeTruthy();
        expect(state.$.route.path).toBe("/");
        expect(state.$.route.fullPath).toBe("/");
        expect(state.$.route.params).toEqual({});
        expect(state.$.route.query).toEqual({});

        // 带参数路由导航：快照随 commit 更新（经 store 响应式代理写入）
        router.push("/user/42?q=hello");
        await until(() => state.$.route?.fullPath === "/user/42?q=hello");

        expect(state.$.route.path).toBe("/user/42");
        expect(state.$.route.fullPath).toBe("/user/42?q=hello");
        expect(state.$.route.params).toEqual({ id: "42" });
        expect(state.$.route.query).toEqual({ q: "hello" });
    });
});

// ── AutoSpark.precompile 语义（ADR-0116） ─────────────────────────────────────

describe("AutoSpark.precompile 语义（ADR-0116）", () => {
    it("无 retain：晚注册对已构造 engine 不补调；后续构造各触发一次（fire-once per engine）", async () => {
        mockFetch();
        await bootEngine({ routes: false }); // engine E1：构造期回调表尚不含 spy
        await nextTick();

        let calls = 0;
        const { AutoSpark } = await import("autospark");
        AutoSpark.precompile(() => {
            calls++;
        });
        expect(calls).toBe(0); // 无 retain：不回溯已存活的 engine

        await bootEngine({ routes: false }); // engine E2
        await nextTick();
        expect(calls).toBe(1); // E2 构造早期触发一次
    });
});
