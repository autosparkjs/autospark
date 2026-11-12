import { describe, expect, test } from "bun:test";
import { AutoSpark } from "autospark";
import { AutoSparkRouter } from "@/router";

/**
 * router 语言清单自动传递（ADR-0136）：engine 是清单唯一源——router 未显式传
 * `options.languages` 时自动取 `engine.options.i18n.languages`，显式传入优先
 * （向后兼容，既有配置零破坏）。router 只读 options 字段，不依赖 i18n 插件在场。
 */
describe("router 语言清单自动传递（ADR-0136）", () => {
    test("未显式传 languages 时自动取 engine.options.i18n.languages", () => {
        const host = document.createElement("div");
        const engineEl = document.createElement("div");
        const engine = new AutoSpark(engineEl, {}, {
            i18n: { languages: [{ code: "en" }, { code: "zh-CN" }] },
        } as any);
        const router = new AutoSparkRouter(host, { engine, routes: [] } as any);
        expect(router.language.enabled).toBe(true);
        expect(router.language.languages.length).toBe(2);
        expect(router.language.languages[0].code).toBe("en");
        router.detach();
    });

    test("显式传入 languages 优先（不取 engine 清单）", () => {
        const host = document.createElement("div");
        const engineEl = document.createElement("div");
        const engine = new AutoSpark(engineEl, {}, {
            i18n: { languages: [{ code: "en" }] },
        } as any);
        const router = new AutoSparkRouter(host, {
            engine,
            routes: [],
            languages: [{ code: "fr" }],
        } as any);
        expect(router.language.languages.length).toBe(1);
        expect(router.language.languages[0].code).toBe("fr");
        router.detach();
    });

    test("engine 无 i18n.languages 时保持未启用（enabled=false）", () => {
        const host = document.createElement("div");
        const engineEl = document.createElement("div");
        const engine = new AutoSpark(engineEl, {});
        const router = new AutoSparkRouter(host, { engine, routes: [] } as any);
        expect(router.language.enabled).toBe(false);
        router.detach();
    });
});
