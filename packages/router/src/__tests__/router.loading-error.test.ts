import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import type { AutoSparkRouter } from "@/router";

/**
 * ADR-0012 单测：加载覆盖层（两层配置合并 + 门控显隐）、errorPages 优先与兜底分流、
 * 404 未匹配呈现、retry 重载语义。
 *
 * engine stub 与递归渲染测试同构（数据域直写 → DOM 落位）：未就绪且无 error 的视图
 * 写 loading 哨兵；错误条目写错误示意（loading 已随错误关闭，哨兵继续存在即行为错误）。
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
    globalThis.DOMParser = win.DOMParser;
    // @ts-ignore
    globalThis.MutationObserver = win.MutationObserver || class MockMutationObserver {
        constructor(_callback: MutationCallback) { }
        disconnect() { }
        observe(_node: Node, _options: any) { }
        takeRecords(): MutationRecord[] { return []; }
    };
    // @ts-ignore
    globalThis.SyntaxError = win.SyntaxError || SyntaxError;

    // @ts-ignore
    const host = document.createElement("div") as HTMLElement;
    // @ts-ignore
    document.body.appendChild(host);
    return host;
}

interface StubViewError {
    status: number;
    message: string;
}

interface MountedView {
    hash: string;
    url?: string;
    title?: string;
    html: string;
    ready: boolean;
    raw?: boolean;
    loading?: boolean;
    loadingOptions?: string;
    error?: StubViewError | null;
}

/** 功能性 engine stub：数据域直写通道 + 同步 DOM 落位（loading 哨兵 / 错误示意 / 就绪内容） */
function createEngineStub() {
    const comps = new WeakMap<HTMLElement, any>();
    const mounts: Array<MountedView & { channel: "views" | "ephemeral" }> = [];

    function makeComp(): any {
        return {
            data: {
                views: [] as MountedView[],
                ephemeral: { hash: "", html: "", ready: false, error: null } as MountedView,
                active: "",
            },
        };
    }

    function ensureContainer(outletEl: HTMLElement, view: MountedView) {
        let viewHost = outletEl.querySelector(`[data-view-hash="${view.hash}"]`) as HTMLElement | null;
        if (!viewHost) {
            viewHost = document.createElement("div");
            viewHost.setAttribute("data-view-hash", view.hash);
            outletEl.appendChild(viewHost);
        }
        if (!view.ready) {
            // 门控语义（ADR-0012 决策 1）：loading 开启 → 哨兵；错误条目 → 错误示意
            // （loading 已随错误关闭）；loading:false 等待期 → 空白（出口无任何指示）
            viewHost.innerHTML = view.error
                ? `<div class="autospark-outlet-error" data-status="${view.error.status}"></div>`
                : view.loading
                    ? `<autospark-loading data-role="loading-indicator"></autospark-loading>`
                    : "";
        } else {
            viewHost.innerHTML = view.html || "";
        }
    }

    function writeData(outletEl: HTMLElement, patch: Record<string, any>) {
        const comp = comps.get(outletEl);
        if (!comp) return;
        const state = comp.data;
        if (patch.ephemeral) {
            state.ephemeral = patch.ephemeral;
            Array.from(outletEl.querySelectorAll("[data-view-hash]"))
                .filter((el) => el.parentElement === outletEl)
                .forEach((el) => el.remove());
            if (patch.ephemeral.hash) ensureContainer(outletEl, patch.ephemeral);
            mounts.push({ ...patch.ephemeral, channel: "ephemeral" });
        }
        if (patch.views) {
            state.views = patch.views;
            for (const view of patch.views) ensureContainer(outletEl, view);
            for (const view of patch.views) mounts.push({ ...view, channel: "views" });
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

function lastMatched(router: AutoSparkRouter) {
    const current = router.routes.current ?? [];
    return current[current.length - 1];
}

/** 读根出口数据域（stub 记录面） */
function outletData(host: HTMLElement) {
    const root = host.querySelector("[data-autospark-outlet]") as HTMLElement;
    return lastEngineStub!.comps.get(root)!.data as {
        views: MountedView[];
        ephemeral: MountedView;
        active: string;
    };
}

const LOADING_DEFAULTS = { delay: 200, bgColor: "white", opacity: 0.6 };

/** fetch spy 辅助：mockImplementation 签名与全局 fetch（含 preconnect）的类型差异收敛 */
function spyOnFetch(impl: () => Promise<any>) {
    return spyOn(globalThis, "fetch").mockImplementation(impl as any);
}

function fetchResponse(overrides: Record<string, any> = {}) {
    return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => "",
        json: async () => ({}),
        ...overrides,
    } as any;
}

describe("AutoSparkRouter 加载指示与错误呈现（ADR-0012）", () => {
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

    describe("两层加载配置合并（决策 1）", () => {
        it("缺省 loading 时占位走内置默认（delay/bgColor/opacity），门控开启", async () => {
            mockFetch = spyOnFetch(async () => {
                await new Promise((resolve) => setTimeout(resolve, 150));
                return fetchResponse();
            });

            router = await createRouter(host, {
                routes: { name: "slow", path: "/", view: "views/slow.html" },
            });

            // createRouter 内部已等待 80ms：占位已落、慢速视图仍未就绪
            const eph = outletData(host).ephemeral;
            expect(eph.ready).toBe(false);
            expect(eph.error ?? null).toBeNull();
            expect(eph.loading).toBe(true);
            expect(JSON.parse(eph.loadingOptions!)).toEqual(LOADING_DEFAULTS);

            // 门控开启：出口呈现 loading 哨兵
            expect(host.querySelector("autospark-loading[data-role='loading-indicator']")).not.toBeNull();

            // 加载完成后指示随就绪移除
            await new Promise((resolve) => setTimeout(resolve, 200));
            expect(host.querySelector("autospark-loading[data-role='loading-indicator']")).toBeNull();
            expect(outletData(host).ephemeral.ready).toBe(true);
        });

        it("loading 为 string 时作为文案覆盖默认（其余默认项保留）", async () => {
            mockFetch = spyOnFetch(async () => {
                await new Promise((resolve) => setTimeout(resolve, 150));
                return fetchResponse();
            });

            router = await createRouter(host, {
                routes: { name: "m", path: "/", view: "views/m.html", loading: "拼命加载中…" },
            });

            const opts = JSON.parse(outletData(host).ephemeral.loadingOptions!);
            expect(opts).toEqual({ ...LOADING_DEFAULTS, message: "拼命加载中…" });
        });

        it("loading 为对象时逐字段覆盖默认", async () => {
            mockFetch = spyOnFetch(async () => {
                await new Promise((resolve) => setTimeout(resolve, 150));
                return fetchResponse();
            });

            router = await createRouter(host, {
                routes: {
                    name: "o",
                    path: "/",
                    view: "views/o.html",
                    loading: { message: "加载中", delay: 50, bgColor: "black" },
                },
            });

            const opts = JSON.parse(outletData(host).ephemeral.loadingOptions!);
            expect(opts).toEqual({ ...LOADING_DEFAULTS, message: "加载中", delay: 50, bgColor: "black" });
        });

        it("loading: false 显式关闭本路由的加载指示", async () => {
            mockFetch = spyOnFetch(async () => {
                await new Promise((resolve) => setTimeout(resolve, 150));
                return fetchResponse();
            });

            router = await createRouter(host, {
                routes: { name: "off", path: "/", view: "views/off.html", loading: false },
            });

            const eph = outletData(host).ephemeral;
            expect(eph.loading).toBe(false);
            expect(eph.loadingOptions).toBe("");
            // 门控关闭：出口无任何加载指示
            expect(host.querySelector("autospark-loading[data-role='loading-indicator']")).toBeNull();

            await new Promise((resolve) => setTimeout(resolve, 200));
            expect(outletData(host).ephemeral.ready).toBe(true);
        });
    });

    describe("errorPages 优先与兜底分流（决策 4）", () => {
        const errorView = "views/error.html";

        function mockServerError() {
            mockFetch = spyOnFetch(async () => {
                await new Promise((resolve) => setTimeout(resolve, 30));
                return fetchResponse({ ok: false, status: 500, statusText: "Server Error" });
            });
        }

        it("显式命中 errorPages[status] → 错误页处理器产物作 ready 视图挂载", async () => {
            mockServerError();
            router = await createRouter(host, {
                routes: { name: "error", path: "/", view: errorView },
                errorPages: {
                    "500": () => {
                        const el = document.createElement("div");
                        el.className = "custom-error";
                        el.textContent = "自定义 500 错误页";
                        return el;
                    },
                },
            });
            await router.push("/");
            await new Promise((resolve) => setTimeout(resolve, 150));

            const eph = outletData(host).ephemeral;
            expect(eph.ready).toBe(true);
            expect(eph.error ?? null).toBeNull();
            expect(eph.html).toContain("custom-error");
            // DOM：错误页内容呈现，loading 哨兵已移除
            expect(host.querySelector(".custom-error")).not.toBeNull();
            expect(host.querySelector("autospark-loading[data-role='loading-indicator']")).toBeNull();
        });

        it("status 未命中但配置了 [\"*\"] → 兜底处理器接管", async () => {
            mockServerError();
            router = await createRouter(host, {
                routes: { name: "error", path: "/", view: errorView },
                errorPages: {
                    "*": () => {
                        const el = document.createElement("div");
                        el.className = "fallback-error";
                        el.textContent = "通用错误页";
                        return el;
                    },
                },
            });
            await router.push("/");
            await new Promise((resolve) => setTimeout(resolve, 150));

            const eph = outletData(host).ephemeral;
            expect(eph.ready).toBe(true);
            expect(eph.error ?? null).toBeNull();
            expect(host.querySelector(".fallback-error")).not.toBeNull();
        });

        it("未配置 / 未命中 errorPages → 落 view.error 走出口内建错误块", async () => {
            mockServerError();
            router = await createRouter(host, {
                routes: { name: "error", path: "/", view: errorView },
            });
            await router.push("/");
            await new Promise((resolve) => setTimeout(resolve, 150));

            const eph = outletData(host).ephemeral;
            expect(eph.ready).toBe(false);
            expect(eph.loading).toBe(false);
            expect(eph.error?.status).toBe(500);
            expect(typeof eph.error?.message).toBe("string");
            // DOM：错误示意呈现，loading 哨兵已移除
            expect(host.querySelector(".autospark-outlet-error[data-status='500']")).not.toBeNull();
            expect(host.querySelector("autospark-loading[data-role='loading-indicator']")).toBeNull();
        });

        it("配置了其他 status 的 errorPages（如 404）对 500 不生效 → 内建错误块", async () => {
            mockServerError();
            router = await createRouter(host, {
                routes: { name: "error", path: "/", view: errorView },
                errorPages: {
                    "404": () => {
                        const el = document.createElement("div");
                        el.className = "not-found";
                        return el;
                    },
                },
            });
            await router.push("/");
            await new Promise((resolve) => setTimeout(resolve, 150));

            const eph = outletData(host).ephemeral;
            expect(eph.ready).toBe(false);
            expect(eph.error?.status).toBe(500);
            expect(host.querySelector(".not-found")).toBeNull();
        });
    });

    describe("404 未匹配呈现（决策 2）", () => {
        it("未匹配 URL 在所在出口落 404 错误条目（动作仅返回）", async () => {
            router = await createRouter(host, {
                routes: { name: "home", path: "/", view: "<div class=\"home\">首页</div>" },
            });

            await router.push("/not-exist");
            await new Promise((resolve) => setTimeout(resolve, 150));

            const matched = lastMatched(router);
            expect(matched).toBeDefined();
            // 未匹配条目 hash 形如 unmatched-<fullPath>
            expect(matched!.hash).toContain("unmatched");

            // 404 落 views 通道（_mountView 强制）
            const entry = outletData(host).views.find((v) => v.hash === matched!.hash);
            expect(entry).toBeDefined();
            expect(entry!.ready).toBe(false);
            expect(entry!.loading).toBe(false);
            expect(entry!.error?.status).toBe(404);
            expect(entry!.error?.message).toContain("/not-exist");

            // DOM：404 错误示意呈现，无 loading 哨兵
            expect(host.querySelector(".autospark-outlet-error[data-status='404']")).not.toBeNull();
            expect(host.querySelector("autospark-loading[data-role='loading-indicator']")).toBeNull();
        });
    });

    describe("retry 重载语义（决策 3）", () => {
        it("错误后 retry() 重跑失败层并恢复视图（ephemeral 通道）", async () => {
            let call = 0;
            mockFetch = spyOnFetch(async () => {
                call++;
                await new Promise((resolve) => setTimeout(resolve, 30));
                if (call === 1) {
                    return fetchResponse({ ok: false, status: 500, statusText: "Server Error" });
                }
                return fetchResponse({ text: async () => "<div class=\"content\">恢复成功</div>" });
            });

            router = await createRouter(host, {
                routes: { name: "flaky", path: "/", view: "views/flaky.html" },
            });
            await new Promise((resolve) => setTimeout(resolve, 100));

            // 首次加载失败：错误条目落位
            expect(outletData(host).ephemeral.error?.status).toBe(500);

            router.retry();
            await new Promise((resolve) => setTimeout(resolve, 300));

            // 重试成功：视图恢复、错误清除、内容就位
            const eph = outletData(host).ephemeral;
            expect(call).toBe(2);
            expect(eph.ready).toBe(true);
            expect(eph.error ?? null).toBeNull();
            expect(host.querySelector(".content")?.textContent).toContain("恢复成功");
            expect(host.querySelector("autospark-loading[data-role='loading-indicator']")).toBeNull();
        });

        it("keepAlive 视图的错误条目经 retry 在 views 通道恢复", async () => {
            let call = 0;
            mockFetch = spyOnFetch(async () => {
                call++;
                await new Promise((resolve) => setTimeout(resolve, 30));
                if (call === 1) {
                    return fetchResponse({ ok: false, status: 500, statusText: "Server Error" });
                }
                return fetchResponse({ text: async () => "<div class=\"content\">缓存视图恢复</div>" });
            });

            router = await createRouter(host, {
                routes: { name: "cached", path: "/", view: "views/cached.html", keepAlive: true },
            });
            await new Promise((resolve) => setTimeout(resolve, 100));

            const data = outletData(host);
            expect(data.views).toHaveLength(1);
            expect(data.views[0]!.error?.status).toBe(500);

            router.retry();
            await new Promise((resolve) => setTimeout(resolve, 300));

            const entry = outletData(host).views[0]!;
            expect(call).toBe(2);
            expect(entry.ready).toBe(true);
            expect(entry.error ?? null).toBeNull();
            expect(host.querySelector(".content")?.textContent).toContain("缓存视图恢复");
        });

        it("无错误链上调用 retry() 不抛错（幂等安全）", async () => {
            router = await createRouter(host, {
                routes: { name: "ok", path: "/", view: "<div class=\"ok\">正常</div>" },
            });
            await router.push("/");
            await new Promise((resolve) => setTimeout(resolve, 100));

            expect(() => router.retry()).not.toThrow();
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(host.querySelector(".ok")).not.toBeNull();
        });
    });
});
