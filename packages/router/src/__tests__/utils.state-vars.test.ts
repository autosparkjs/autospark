/**
 * `state.$` 插值变量提取与路由优先级的单元测试（ADR-0122）
 */

import { describe, it, expect } from "bun:test";
import { getStateVars } from "@/utils/getStateVars";
import { getRouteVars } from "@/utils/getRouteVars";
import type { AutoSparkMatchedRouteItem } from "@/types/routes";

function createMatched(): AutoSparkMatchedRouteItem {
    return {
        // @ts-ignore
        route: {
            name: "user",
            path: "/user/:id",
            meta: { title: "meta-title" },
        },
        params: { id: "42", language: "zh" },
        query: { q: "1" },
        state: { tenant: "nav-tenant" },
        path: "/user/42",
        url: "/user/42?q=1",
        hash: "hash",
        id: 1,
    };
}

describe("getStateVars", () => {
    it("只提取自有可枚举的原始值成员，跳过 route / 对象 / 函数 / null / undefined", () => {
        const router: any = {
            engine: {
                state: {
                    $: {
                        language: "en",
                        version: 2,
                        compact: true,
                        route: { path: "/" },
                        flags: { theme: "dark" },
                        fn: () => {},
                        nil: null,
                        missing: undefined,
                    },
                },
            },
        };

        expect(getStateVars(router)).toEqual({
            language: "en",
            version: 2,
            compact: true,
        });
    });

    it("engine 缺失或 state.$ 不存在时静默返回空对象", () => {
        expect(getStateVars({} as any)).toEqual({});
        expect(getStateVars({ engine: {} } as any)).toEqual({});
        expect(getStateVars(undefined)).toEqual({});
    });

    it("兼容只暴露 store 的最小 engine stub", () => {
        const router: any = { engine: { store: { state: { $: { language: "zh" } } } } };
        expect(getStateVars(router)).toEqual({ language: "zh" });
    });
});

describe("getRouteVars", () => {
    it("metaVars 为最底层：路由侧同名变量（meta / params / 导航 state）优先", () => {
        const vars = getRouteVars(createMatched(), {
            name: "meta-name",
            language: "en",
            title: "meta-var-title",
            tenant: "meta-tenant",
            id: "0",
            extra: "x",
        });

        expect(vars.name).toBe("user");
        expect(vars.language).toBe("zh");
        expect(vars.title).toBe("meta-title");
        expect(vars.tenant).toBe("nav-tenant");
        expect(vars.id).toBe("42");
        expect(vars.extra).toBe("x");
    });

    it("缺省 metaVars 时行为不变", () => {
        const vars = getRouteVars(createMatched());
        expect(vars).not.toHaveProperty("extra");
        expect(vars.name).toBe("user");
    });
});
