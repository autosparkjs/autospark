import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { AutoSpark } from "autospark";
import { bootstrapRouterPlugin } from "@/plugin/bootstrap";

/**
 * 数据本地化挂载链回归（ADR-0013 决策 2/3 + ADR-0136 清单唯一源）。
 *
 * 锁定三个曾踩实的回归点（demo `language-data.html` 同形态）：
 * 1. **getLanguageUrl 钩子透传**——钩子是路由配置面键，声明在 `routes` 配置对象内
 *    经挂载矩阵透传（engine options 顶层声明会被 `resolveMountOptions` 静默丢弃——
 *    曾致数据本地化整体失效的陷阱，本测试即回归锁）；
 * 2. **清单唯一源链**——router options 未显式传 `languages` 时，挂载期自动取
 *    `options.i18n.languages`；
 * 3. **启用后 data 通道发出请求**（重写与缓存隔离的纯函数面由
 *    `features.language.test.ts` 的 rewriteUrl 用例覆盖）。
 *
 * DOM 文本渲染断言刻意不做：happy-dom 下 view 编译挂载时序不稳定（真实浏览器为准），
 * 渲染正确性由 renderers/base 系列测试与 demo 人工验收承担。
 */

/** 测试 DOM 环境（router.attach.test.ts 同款最小形态） */
function createTestDOM() {
    const { Window } = require("happy-dom");
    const win = new Window({ url: "http://localhost/" });
    for (const key of ["window", "document", "history", "location", "Event", "CustomEvent", "HTMLElement", "URLSearchParams"]) {
        (globalThis as any)[key] = (win as any)[key];
    }
    const host = document.createElement("div") as HTMLElement;
    document.body.appendChild(host);
    return host;
}

describe("数据本地化挂载链（ADR-0136 回归锁）", () => {
    let host: HTMLElement;
    let engine: AutoSpark<any>;
    let router: any;
    let fetchLog: string[];
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        host = createTestDOM();
        fetchLog = [];
        const fake = async (input: any): Promise<Response> => {
            const url = typeof input === "string" ? input : String(input?.url ?? "");
            fetchLog.push(url);
            const body = url.includes("profile.html")
                ? '<section><span x-text="name"></span></section>'
                : JSON.stringify({ name: "Ada Lovelace" });
            return new Response(body, { status: 200 });
        };
        (globalThis as any).fetch = fake;
        (globalThis as any).window.fetch = fake;
    });

    afterEach(() => {
        router?.detach?.();
        (globalThis as any).fetch = originalFetch;
        document.body.innerHTML = "";
    });

    it("钩子经 routes 配置对象透传 + i18n 清单链 + data 请求发出", async () => {
        // 完整插件自举形态（对齐 demo）：x-outlet transform、出口组件注册、
        // mountRouter 全链经插件生效
        bootstrapRouterPlugin();
        host.innerHTML = '<div x-outlet></div>';
        engine = new AutoSpark(host, {}, {
            // 清单唯一源（ADR-0136）：router options 未显式传 languages 时挂载期自动取用
            i18n: {
                languages: [
                    { code: "en", name: "English" },
                    { code: "zh-CN", name: "简体中文" },
                ],
            },
            routes: {
                mode: "hash",
                // 钩子属路由配置面：声明在 routes 配置对象内（顶层声明会被挂载矩阵丢弃）
                getLanguageUrl: (language: any, url: string, type: string) => {
                    if (type !== "data") return url;
                    if (language.code === "en") return url;
                    return url.replace(/(\.\w+)?$/, `_${language.code}$1`);
                },
                routes: [
                    { path: "/", redirect: "/profile" },
                    {
                        path: "/profile",
                        title: "Profile",
                        view: "/views/profile.html",
                        data: "/api/profile.json",
                    },
                ],
            },
        });
        router = (host as any).router;
        expect(router).toBeDefined();
        // 回归点 2：清单唯一源链（i18n.languages 自动传递）
        expect(router.options.languages).toEqual(engine.options.i18n?.languages);
        // 回归点 1：钩子经 routes 配置对象透传（顶层声明会被 resolveMountOptions 丢弃）
        expect(typeof router.options.getLanguageUrl).toBe("function");
        // 多语言启用 + 语言分量入缓存 hash（缓存隔离前提）
        expect(router.language.enabled).toBe(true);
        // 回归点 3：data 通道请求发出（重写正确性由 features.language.test.ts 覆盖）
        const start = Date.now();
        while (fetchLog.length === 0 && Date.now() - start < 3000) {
            await new Promise((r) => setTimeout(r, 50));
        }
        expect(fetchLog.some((u) => u.includes("profile.json"))).toBe(true);
    });
});
