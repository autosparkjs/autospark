import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { AutoSparkRouter } from "@/router";
import {
    LanguageManager,
    applyLanguageSuffix,
    normalizeLanguageTag,
} from "@/features/language";

/**
 * 多语言内容通道（ADR-0013）测试
 *
 * 覆盖面：
 * - 内置后缀规则矩阵（决策 3）
 * - auto 三级解析（决策 4）
 * - rewriteUrl 调度：默认矩阵 / 钩子接管与 null 语义（决策 2）
 * - router 集成：启动注入 $.language 与 document.lang（决策 4/8）、
 *   切换 = 完整导航管线重入（不写历史、绕过同 URL 去重）（决策 5）、
 *   缓存按语言隔离（决策 6）、routes 通道重写（决策 2）
 */

// ========================================================================
// 纯函数：内置后缀规则矩阵
// ========================================================================

describe("applyLanguageSuffix 内置后缀规则（ADR-0013 决策 3）", () => {
    it("末段扩展名前插 _{code}", () => {
        expect(applyLanguageSuffix("x.html", "zh-CN")).toBe("x_zh-CN.html");
        expect(applyLanguageSuffix("/a/x.html", "zh-CN")).toBe("/a/x_zh-CN.html");
        expect(applyLanguageSuffix("https://cdn.example.com/a/x.html", "en")).toBe(
            "https://cdn.example.com/a/x_en.html",
        );
    });

    it("无扩展名末段同插", () => {
        expect(applyLanguageSuffix("/a/x", "zh-CN")).toBe("/a/x_zh-CN");
        expect(applyLanguageSuffix("pages/index", "en")).toBe("pages/index_en");
    });

    it("query 与 hash 原样保留在末尾", () => {
        expect(applyLanguageSuffix("/a/x.html?k=1&q=2", "zh-CN")).toBe("/a/x_zh-CN.html?k=1&q=2");
        expect(applyLanguageSuffix("/a/x.html#frag", "zh-CN")).toBe("/a/x_zh-CN.html#frag");
        expect(applyLanguageSuffix("/a/x.html?a=1#f", "zh-CN")).toBe("/a/x_zh-CN.html?a=1#f");
    });

    it("根路径与目录形 URL 不重写", () => {
        expect(applyLanguageSuffix("/", "zh-CN")).toBe("/");
        expect(applyLanguageSuffix("/a/", "zh-CN")).toBe("/a/");
        expect(applyLanguageSuffix("", "zh-CN")).toBe("");
    });

    it("code 原样使用，无 -/_ 转换魔法", () => {
        expect(applyLanguageSuffix("x.html", "zh-CN")).toBe("x_zh-CN.html");
        expect(applyLanguageSuffix("x.html", "pt-BR")).toBe("x_pt-BR.html");
    });

    it("dotfile（.html）按无扩展名处理", () => {
        expect(applyLanguageSuffix("/a/.html", "zh-CN")).toBe("/a/.html_zh-CN");
    });

    it("normalizeLanguageTag 大小写与 -/_ 归一", () => {
        expect(normalizeLanguageTag("zh_cn")).toBe("zh-cn");
        expect(normalizeLanguageTag("ZH-CN")).toBe("zh-cn");
    });
});

// ========================================================================
// LanguageManager：三级解析
// ========================================================================

/** 语言管理器单测的最小 router 桩（resolve/rewriteUrl 只依赖 options.languages 与钩子） */
function fakeRouter(languages: any[], getLanguageUrl?: any): { router: any; manager: LanguageManager } {
    const router: any = {
        options: { languages, ...(getLanguageUrl ? { getLanguageUrl } : {}) },
        logger: { debug: () => {}, warn: () => {}, error: () => {} },
    };
    return { router, manager: new LanguageManager(router) };
}

/** 覆写 navigator 语言偏好（测试完恢复） */
const originalNavigator = globalThis.navigator;
function stubNavigator(tags: string[] | undefined): void {
    Object.defineProperty(globalThis, "navigator", {
        value: tags === undefined ? undefined : { languages: tags },
        configurable: true,
    });
}

afterEach(() => {
    Object.defineProperty(globalThis, "navigator", {
        value: originalNavigator,
        configurable: true,
    });
});

describe("LanguageManager 三级解析（ADR-0013 决策 4）", () => {
    it("① tag 全等（大小写与 -/_ 归一）命中清单原文", () => {
        const { manager } = fakeRouter([
            { code: "en" },
            { code: "zh-CN" },
        ]);
        stubNavigator(["zh_cn"]);
        expect(manager.resolve()).toBe("zh-CN");
        stubNavigator(["ZH-CN"]);
        expect(manager.resolve()).toBe("zh-CN");
    });

    it("② 主语言子标签相同：navigator zh-HK 命中配置 zh-CN", () => {
        const { manager } = fakeRouter([
            { code: "en" },
            { code: "zh-CN" },
        ]);
        stubNavigator(["zh-HK"]);
        expect(manager.resolve()).toBe("zh-CN");
        // 完整 tag 配置与纯语言 tag 配置均可被主子标签命中
        const plain = fakeRouter([{ code: "zh" }]);
        stubNavigator(["zh-HK"]);
        expect(plain.manager.resolve()).toBe("zh");
    });

    it("③ 回退 languages[0]", () => {
        const { manager } = fakeRouter([
            { code: "en" },
            { code: "zh-CN" },
        ]);
        stubNavigator(["fr", "de"]);
        expect(manager.resolve()).toBe("en");
        stubNavigator(undefined);
        expect(manager.resolve()).toBe("en");
    });

    it("按浏览器偏好序逐 tag 匹配", () => {
        const { manager } = fakeRouter([
            { code: "en" },
            { code: "zh-CN" },
        ]);
        stubNavigator(["zh-HK", "en-GB"]);
        expect(manager.resolve()).toBe("zh-CN");
        stubNavigator(["en-GB", "zh-HK"]);
        expect(manager.resolve()).toBe("en");
    });

    it("具体输入值归一命中即原样采用（清单原文）；未命中视同 auto 再解析", () => {
        const { manager } = fakeRouter([
            { code: "en" },
            { code: "zh-CN" },
        ]);
        stubNavigator(["en"]);
        expect(manager.resolve("zh_cn")).toBe("zh-CN");
        expect(manager.resolve("zh-TW")).toBe("en"); // 未命中 → auto → 浏览器语言
        expect(manager.resolve("auto")).toBe("en");
    });

    it("未启用（空清单）解析为空串", () => {
        const { manager } = fakeRouter([]);
        expect(manager.resolve()).toBe("");
        expect(manager.enabled).toBe(false);
    });
});

// ========================================================================
// LanguageManager：重写调度
// ========================================================================

describe("rewriteUrl 调度（ADR-0013 决策 2）", () => {
    it("未启用 / 未解析时原样返回", () => {
        const { manager } = fakeRouter([]);
        expect(manager.rewriteUrl("/a/x.html", "view")).toBe("/a/x.html");
        const enabled = fakeRouter([{ code: "en" }, { code: "zh-CN" }]);
        expect(enabled.manager.rewriteUrl("/a/x.html", "view")).toBe("/a/x.html"); // 未 bootstrap，无 _current
    });

    it("默认矩阵：view/routes 重写、data 不重写、默认语言免重写", () => {
        const { manager } = fakeRouter([{ code: "en" }, { code: "zh-CN" }]);
        (manager as any)._current = "zh-CN";
        expect(manager.rewriteUrl("/a/x.html", "view")).toBe("/a/x_zh-CN.html");
        expect(manager.rewriteUrl("/a/routes.json", "routes")).toBe("/a/routes_zh-CN.json");
        expect(manager.rewriteUrl("/api/x", "data")).toBe("/api/x");
        (manager as any)._current = "en";
        expect(manager.isDefault).toBe(true);
        expect(manager.rewriteUrl("/a/x.html", "view")).toBe("/a/x.html");
    });

    it("钩子接管：三通道（含 data）都走钩子，默认语言不豁免", () => {
        const calls: Array<[string, string]> = [];
        const { manager } = fakeRouter(
            [{ code: "en" }, { code: "zh-CN" }],
            (language: any, url: string, type: string) => {
                calls.push([url, type]);
                return type === "data" ? url : `${url}?lang=${language.code}`;
            },
        );
        (manager as any)._current = "en";
        expect(manager.rewriteUrl("/a/x.html", "view")).toBe("/a/x.html?lang=en");
        expect(manager.rewriteUrl("/api/x", "data")).toBe("/api/x");
        expect(manager.rewriteUrl("/a/routes.json", "routes")).toBe("/a/routes.json?lang=en");
        expect(calls).toEqual([
            ["/a/x.html", "view"],
            ["/api/x", "data"],
            ["/a/routes.json", "routes"],
        ]);
    });

    it("钩子返回 null/undefined = 该次不重写、用原 URL（而非回退内置规则）", () => {
        const { manager } = fakeRouter(
            [{ code: "en" }, { code: "zh-CN" }],
            () => null,
        );
        (manager as any)._current = "zh-CN";
        expect(manager.rewriteUrl("/a/x.html", "view")).toBe("/a/x.html");
        expect(manager.rewriteUrl("/a/routes.json", "routes")).toBe("/a/routes.json");
    });
});

// ========================================================================
// router 集成
// ========================================================================

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

/** 带 store 的 engine stub：$.language 注入与 watch 的测试基座 */
function stubEngineWithStore() {
    const state: any = { $: {} };
    const listeners: Array<{ path: string; cb: () => void }> = [];
    const store = {
        state,
        watch(path: string, cb: () => void) {
            const entry = { path, cb };
            listeners.push(entry);
            return {
                off: () => {
                    const i = listeners.indexOf(entry);
                    if (i >= 0) listeners.splice(i, 1);
                },
            };
        },
    };
    const engine: any = {
        getComponentDeclaration: () => ({ name: "autospark.outlet" }),
        getComponent: () => ({
            data: { views: [], ephemeral: { hash: "", html: "", ready: false }, active: "" },
        }),
        data: () => {},
        destroy() {},
        store,
        /** 模拟响应式代理的嵌套写入通知 */
        __notify(path: string) {
            listeners.filter((l) => l.path === path).forEach((l) => l.cb());
        },
    };
    return engine;
}

async function createRouter(host: HTMLElement, options: any) {
    const { AutoSparkRouter } = await import("@/router");
    if (!host.querySelector("[data-autospark-outlet]")) {
        const outlet = document.createElement("div");
        outlet.setAttribute("data-autospark-outlet", "");
        host.appendChild(outlet);
    }
    const engine = stubEngineWithStore();
    const router = new AutoSparkRouter(host, { ...options, engine });
    await new Promise((resolve) => setTimeout(resolve, 80));
    return { router, engine };
}

/** 模拟用户赋值 $.language（写入 + 响应式通知） */
function assignLanguage(engine: any, value: string) {
    engine.store.state.$.language = value;
    engine.__notify("$.language");
}

describe("多语言 router 集成（ADR-0013）", () => {
    let host: HTMLElement;
    let router: AutoSparkRouter | undefined;

    beforeEach(() => {
        host = createTestDOM();
        stubNavigator(["zh-CN"]);
    });

    afterEach(() => {
        router?.detach();
        router = undefined;
        if (host && host.parentElement) host.parentElement.removeChild(host);
        Object.defineProperty(globalThis, "navigator", {
            value: originalNavigator,
            configurable: true,
        });
    });

    describe("启动解析与注入（决策 4/8）", () => {
        it("auto 解析后写入 $.language 与 document.documentElement.lang，早于路由表 fetch", async () => {
            const fetched: string[] = [];
            const originalFetch = globalThis.fetch;
            (globalThis as any).fetch = async (url: any) => {
                fetched.push(String(url));
                return {
                    ok: true,
                    status: 200,
                    statusText: "OK",
                    json: async () => [{ path: "/", view: "pages/home.html" }],
                    text: async () => "[]",
                } as any;
            };
            try {
                const created = await createRouter(host, {
                    routes: "routes.json",
                    languages: [{ code: "en" }, { code: "zh-CN" }],
                });
                router = created.router;
                // languages[0] 是 en，浏览器语言 zh-CN 经主子标签命中 zh-CN
                expect(created.engine.store.state.$.language).toBe("zh-CN");
                expect(document.documentElement.lang).toBe("zh-CN");
                // 路由表 fetch 已按已解析语言重写（routes 通道，非默认语言）
                expect(fetched[0]).toBe("routes_zh-CN.json");
            } finally {
                (globalThis as any).fetch = originalFetch;
            }
        });

        it("默认语言（languages[0]）免重写", async () => {
            stubNavigator(["en"]);
            const fetched: string[] = [];
            const originalFetch = globalThis.fetch;
            (globalThis as any).fetch = async (url: any) => {
                fetched.push(String(url));
                return {
                    ok: true,
                    status: 200,
                    statusText: "OK",
                    json: async () => [{ path: "/" }],
                    text: async () => "[]",
                } as any;
            };
            try {
                const created = await createRouter(host, {
                    routes: "routes.json",
                    languages: [{ code: "en" }, { code: "zh-CN" }],
                });
                router = created.router;
                expect(created.engine.store.state.$.language).toBe("en");
                expect(fetched[0]).toBe("routes.json");
            } finally {
                (globalThis as any).fetch = originalFetch;
            }
        });

        it("未启用多语言：不注入 $.language", async () => {
            const created = await createRouter(host, { routes: [{ path: "/" }] });
            router = created.router;
            expect(created.engine.store.state.$.language).toBeUndefined();
            expect(router.language.enabled).toBe(false);
        });
    });

    describe("切换语义（决策 5）", () => {
        it("赋值 $.language 触发完整导航管线重入：视图按新语言重载、地址栏不变、去重放行", async () => {
            const fetched: string[] = [];
            const originalFetch = globalThis.fetch;
            (globalThis as any).fetch = async (url: any) => {
                fetched.push(String(url));
                return {
                    ok: true,
                    status: 200,
                    statusText: "OK",
                    json: async () => [{ path: "/", view: "pages/home.html" }],
                    text: async () => "<div>page</div>",
                } as any;
            };
            let startCount = 0;
            try {
                const created = await createRouter(host, {
                    routes: [{ path: "/", view: "pages/home.html" }],
                    languages: [{ code: "en" }, { code: "zh-CN" }],
                });
                router = created.router;
                router.on("navigation:start", () => startCount++);
                const startEvents = startCount;
                const hrefBefore = (globalThis as any).location.href;
                // 启动导航已按 zh-CN 取视图（非默认语言 → 重写）
                expect(fetched).toContain("pages/home_zh-CN.html");

                // 切换到 en（默认语言）
                assignLanguage(created.engine, "en");
                await new Promise((resolve) => setTimeout(resolve, 80));

                // 完整管线重入：navigation:start 再触发；视图按 en 重取（免重写）
                expect(startCount).toBeGreaterThan(startEvents);
                expect(fetched.filter((u) => u === "pages/home.html").length).toBe(1);
                // 不写 history、地址栏不变
                expect((globalThis as any).location.href).toBe(hrefBefore);
                expect(created.engine.store.state.$.language).toBe("en");
                expect(document.documentElement.lang).toBe("en");

                // 切换到 zh-CN（非默认语言）：重写生效
                fetched.length = 0;
                assignLanguage(created.engine, "zh-CN");
                await new Promise((resolve) => setTimeout(resolve, 80));
                expect(fetched.filter((u) => u === "pages/home_zh-CN.html").length).toBe(1);
            } finally {
                (globalThis as any).fetch = originalFetch;
            }
        });

        it("在途导航中切换语言：同 URL 去重被放行标记绕过", async () => {
            // 视图 fetch 挂起在 gate 上，使启动导航保持在途（_currentNavUrl === "/"）；
            // 此时切换语言的重入目标 URL 相同——无放行标记会在去重门被取消
            let releaseGate!: () => void;
            const gate = new Promise<void>((resolve) => (releaseGate = resolve));
            const fetched: string[] = [];
            const originalFetch = globalThis.fetch;
            (globalThis as any).fetch = async (url: any) => {
                const u = String(url);
                fetched.push(u);
                return {
                    ok: true,
                    status: 200,
                    statusText: "OK",
                    json: async () => [{ path: "/" }],
                    text: async () => {
                        await gate;
                        return "<div>page</div>";
                    },
                } as any;
            };
            try {
                const created = await createRouter(host, {
                    routes: [{ path: "/", view: "pages/home.html" }],
                    languages: [{ code: "en" }, { code: "zh-CN" }],
                });
                router = created.router;
                // 启动导航在途，已按 zh-CN 发起视图请求
                expect(fetched).toContain("pages/home_zh-CN.html");
                expect(fetched).not.toContain("pages/home.html");

                // 在途切换到 en：重入同 URL 须被放行（en 为默认语言，视图 URL 免重写）
                assignLanguage(created.engine, "en");
                await new Promise((resolve) => setTimeout(resolve, 40));
                expect(fetched).toContain("pages/home.html");

                releaseGate();
                await new Promise((resolve) => setTimeout(resolve, 80));
                expect(created.engine.store.state.$.language).toBe("en");
                expect(document.documentElement.lang).toBe("en");
            } finally {
                (globalThis as any).fetch = originalFetch;
            }
        });

        it("赋值不在清单中的语言：warn 并回写原值，不触发导航", async () => {
            const warns: string[] = [];
            const created = await createRouter(host, {
                routes: [{ path: "/" }],
                languages: [{ code: "en" }, { code: "zh-CN" }],
            });
            router = created.router;
            router.logger.warn = ((msg: any) => warns.push(String(msg))) as any;
            let startCount = 0;
            router.on("navigation:start", () => startCount++);
            const startEvents = startCount;

            assignLanguage(created.engine, "fr");
            await new Promise((resolve) => setTimeout(resolve, 40));

            expect(warns.length).toBeGreaterThan(0);
            expect(created.engine.store.state.$.language).toBe("zh-CN"); // 回写启动解析值
            expect(startCount).toBe(startEvents);
        });

        it("赋值 auto：再解析（浏览器语言）", async () => {
            stubNavigator(["zh-CN"]);
            const created = await createRouter(host, {
                routes: [{ path: "/" }],
                languages: [{ code: "en" }, { code: "zh-CN" }],
            });
            router = created.router;
            // 先切到 en，再赋 auto → 依浏览器语言解析回 zh-CN
            assignLanguage(created.engine, "en");
            await new Promise((resolve) => setTimeout(resolve, 40));
            expect(created.engine.store.state.$.language).toBe("en");

            assignLanguage(created.engine, "auto");
            await new Promise((resolve) => setTimeout(resolve, 40));
            expect(created.engine.store.state.$.language).toBe("zh-CN");
        });
    });

    describe("缓存与视图条目按语言隔离（决策 6）", () => {
        it("数据缓存键含语言分量：切换后重取，切回命中旧语言缓存", async () => {
            let dataFetchCount = 0;
            const originalFetch = globalThis.fetch;
            (globalThis as any).fetch = async (url: any) => {
                const u = String(url);
                if (u.endsWith(".json") && u.includes("data")) {
                    dataFetchCount++;
                }
                if (u.includes("routes") || u.endsWith("routes.json")) {
                    return {
                        ok: true,
                        status: 200,
                        statusText: "OK",
                        json: async () => [{ path: "/", view: "pages/home.html", data: "data/x.json" }],
                        text: async () => "[]",
                    } as any;
                }
                return {
                    ok: true,
                    status: 200,
                    statusText: "OK",
                    json: async () => ({ hello: u }),
                    text: async () => "<div>page</div>",
                } as any;
            };
            try {
                const created = await createRouter(host, {
                    routes: [
                        {
                            path: "/",
                            view: "pages/home.html",
                            // 数据缓存须在数据选项对象形态上声明（DataLoader 选项合并来源）
                            data: { from: "data/x.json", cache: 60000 },
                        },
                    ],
                    languages: [{ code: "en" }, { code: "zh-CN" }],
                });
                router = created.router;
                await new Promise((resolve) => setTimeout(resolve, 40));
                const firstCount = dataFetchCount;
                expect(firstCount).toBe(1);

                // 切到 en：缓存键含 @en → 未命中 → 重取
                assignLanguage(created.engine, "en");
                await new Promise((resolve) => setTimeout(resolve, 60));
                expect(dataFetchCount).toBe(2);

                // 切回 zh-CN：旧语言缓存条目仍有效 → 命中不重取
                assignLanguage(created.engine, "zh-CN");
                await new Promise((resolve) => setTimeout(resolve, 60));
                expect(dataFetchCount).toBe(2);
            } finally {
                (globalThis as any).fetch = originalFetch;
            }
        });

        it("matched.hash 含语言分量（keepAlive/视图条目键隔离）", async () => {
            const created = await createRouter(host, {
                routes: [{ path: "/", view: "pages/home.html" }],
                languages: [{ code: "en" }, { code: "zh-CN" }],
            });
            router = created.router;
            const hashZh = (router.routes.current ?? []).slice(-1)[0]?.hash ?? "";
            expect(hashZh.endsWith("@zh-CN")).toBe(true);

            assignLanguage(created.engine, "en");
            await new Promise((resolve) => setTimeout(resolve, 60));
            const hashEn = (router.routes.current ?? []).slice(-1)[0]?.hash ?? "";
            expect(hashEn.endsWith("@en")).toBe(true);
            expect(hashEn).not.toBe(hashZh);
        });
    });

    describe("routes 通道（决策 2）", () => {
        it("远程子表按语言化 URL 请求", async () => {
            const fetched: string[] = [];
            const originalFetch = globalThis.fetch;
            const respond = (body: any) => ({
                ok: true,
                status: 200,
                statusText: "OK",
                json: async () => body,
                text: async () => "[]",
            }) as any;
            (globalThis as any).fetch = async (url: any) => {
                fetched.push(String(url));
                if (String(url) === "/routes_zh-CN.json") {
                    return respond([
                        { path: "/products", children: true },
                    ]);
                }
                return respond([{ path: "detail", view: "pages/detail.html" }]);
            };
            try {
                const created = await createRouter(host, {
                    routes: [{ path: "/", children: true }],
                    languages: [{ code: "en" }, { code: "zh-CN" }],
                });
                router = created.router;
                // 整表 + 子表都按 zh-CN 重写（浏览器语言 zh-CN）
                expect(fetched).toContain("/routes_zh-CN.json");
                expect(fetched).toContain("/products/routes_zh-CN.json");
                // 等子表展开后可匹配深层路由（matched.url 为累积完整路径）
                await created.router.routes.whenExpanded(2000);
                expect(created.router.routes.match("/products/detail")?.slice(-1)[0]?.url).toBe(
                    "/products/detail",
                );
            } finally {
                (globalThis as any).fetch = originalFetch;
            }
        });
    });

    describe("未启用多语言（决策 1 边界）", () => {
        it("无 languages：加载 URL 不受语言层影响", async () => {
            const fetched: string[] = [];
            const originalFetch = globalThis.fetch;
            (globalThis as any).fetch = async (url: any) => {
                fetched.push(String(url));
                return {
                    ok: true,
                    status: 200,
                    statusText: "OK",
                    json: async () => [{ path: "/", view: "pages/home.html" }],
                    text: async () => "<div>page</div>",
                } as any;
            };
            try {
                const created = await createRouter(host, {
                    routes: [{ path: "/", view: "pages/home.html" }],
                });
                router = created.router;
                await new Promise((resolve) => setTimeout(resolve, 40));
                expect(fetched).toContain("pages/home.html");
                expect(fetched.some((u) => u.includes("_zh-CN"))).toBe(false);
            } finally {
                (globalThis as any).fetch = originalFetch;
            }
        });
    });
});
