import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { AutoSparkRouteTable } from "@/features/routes";
import { resolveChildrenUrl } from "@/utils/resolveChildrenUrl";
import { matchRoute } from "@/utils/matchRoute";
import type { AutoSparkRouteItem } from "@/types";

/**
 * 构造一个最小 router 桩：AutoSparkRouteTable 只消费 options / emit / logger
 */
function makeTable(routes: any, options: any = {}) {
    const emitted: Array<{ name: string; payload: any }> = [];
    const router: any = {
        options: { routes, base: "/", ...options },
        emit: (name: string, payload: any) => emitted.push({ name, payload }),
        logger: { warn: () => {}, error: () => {}, debug: () => {} },
    };
    return { table: new AutoSparkRouteTable(router as any), emitted };
}

/** 安装 fetch 桩：按 URL 返回 JSON 或 reject */
function stubFetch(handler: (url: string) => any) {
    const original = globalThis.fetch;
    globalThis.fetch = ((url: any) => {
        const result = handler(String(url));
        if (result instanceof Error) return Promise.reject(result);
        return Promise.resolve({ ok: true, statusText: "OK", json: () => Promise.resolve(result) });
    }) as any;
    return () => {
        globalThis.fetch = original;
    };
}

describe("resolveChildrenUrl", () => {
    it("相对路径拼祖先路由路径", () => {
        expect(
            resolveChildrenUrl("a.json", { path: "/products" }, "/"),
        ).toBe("/products/a.json");
    });

    it("相对路径同时拼 base 与祖先路径", () => {
        expect(
            resolveChildrenUrl("sub/a.json", { path: "/products" }, "/app"),
        ).toBe("/app/products/sub/a.json");
    });

    it("绝对路径不继承父路由位置，但仍拼 base", () => {
        expect(
            resolveChildrenUrl("/shared/a.json", { path: "/products" }, "/app"),
        ).toBe("/app/shared/a.json");
    });

    it("含协议的地址原样返回", () => {
        expect(
            resolveChildrenUrl("https://cdn.example.com/a.json", { path: "/products" }, "/app"),
        ).toBe("https://cdn.example.com/a.json");
    });

    it("children: true 取 routesFile，缺省 routes.json", () => {
        expect(resolveChildrenUrl(true, { path: "/products" }, "/")).toBe("/products/routes.json");
        expect(
            resolveChildrenUrl(true, { path: "/products", routesFile: "index.json" }, "/"),
        ).toBe("/products/index.json");
    });

    it("插值：{path} {name} {meta.*}，绝对路径亦参与插值", () => {
        expect(
            resolveChildrenUrl(
                "{path}/{name}.json",
                { path: "/products", name: "list", meta: { v: 2 } },
                "/",
            ),
        ).toBe("/products/list.json");
        expect(
            resolveChildrenUrl(
                "/shared/{name}-{meta.v}.json",
                { path: "/products", name: "list", meta: { v: 2 } },
                "/",
            ),
        ).toBe("/shared/list-2.json");
    });

    it("运行时变量不提供：带点的未知键原样保留（不静默吞掉）", () => {
        expect(
            resolveChildrenUrl("{params.id}.json", { path: "/products" }, "/"),
        ).toBe("/products/{params.id}.json");
    });
});

describe("远程子表展开", () => {
    let restore: () => void;
    const requested: string[] = [];

    beforeEach(() => {
        requested.length = 0;
    });
    afterEach(() => {
        restore?.();
    });

    it("骨架立即可用，远程子表在后台展开后就地挂载", async () => {
        restore = stubFetch((url) => {
            requested.push(url);
            return [{ path: "detail", name: "detail" }];
        });
        const { table, emitted } = makeTable([
            { path: "products", children: "a.json" },
        ]);
        await table.load();

        // 骨架：尚未展开，节点退化为无子路由但自身可匹配
        expect(table.hasPending()).toBe(true);
        const skeleton = matchRoute("/products/detail", table.root);
        expect(skeleton.slice(1).some((m) => m.route !== undefined)).toBe(true);

        await table.whenExpanded();
        expect(requested).toEqual(["/products/a.json"]);
        expect(table.hasPending()).toBe(false);
        expect(emitted.map((e) => e.name)).toContain("routes:expanded");

        // 展开后子路由可匹配
        const after = matchRoute("/products/detail", table.root);
        expect(after[after.length - 1].route?.name).toBe("detail");
    });

    it("children: true 等价于 options.routesFile", async () => {
        restore = stubFetch((url) => {
            requested.push(url);
            return { path: "list" };
        });
        const { table } = makeTable([{ path: "products", children: true }], {
            routesFile: "index.json",
        });
        await table.load();
        await table.whenExpanded();
        expect(requested).toEqual(["/products/index.json"]);
    });

    it("远程子项支持递归嵌套（子树可独立分发）", async () => {
        restore = stubFetch((url) => {
            requested.push(url);
            if (url === "/products/a.json") return [{ path: "x", children: "b.json" }];
            return [{ path: "y" }];
        });
        const { table } = makeTable([{ path: "products", children: "a.json" }]);
        await table.load();
        await table.whenExpanded();
        expect(requested).toEqual(["/products/a.json", "/products/x/b.json"]);
        const matched = matchRoute("/products/x/y", table.root);
        expect(matched[matched.length - 1].route?.path).toBe("y");
    });

    it("单个子表失败只局部降级，表其余部分照常可用", async () => {
        restore = stubFetch((url) => {
            if (url === "/products/a.json") return new Error("boom");
            return [{ path: "about" }];
        });
        const { table, emitted } = makeTable([
            { path: "products", children: "a.json" },
            { path: "about", children: "about.json" },
        ]);
        await table.load();
        await table.whenExpanded();

        const products = (table.root.children as AutoSparkRouteItem[]).find(
            (r) => r.path === "products",
        )!;
        expect(products._childrenState).toBe("error");
        expect(products.children).toEqual([]);

        const error = emitted.find((e) => e.name === "routes:error");
        expect(error?.payload.path).toBe("products");
        expect(error?.payload.url).toBe("/products/a.json");

        // 兄弟分支不受影响
        const about = (table.root.children as AutoSparkRouteItem[]).find(
            (r) => r.path === "about",
        )!;
        expect(about._childrenState).toBe("ok");
        const matched = matchRoute("/about/about", table.root);
        expect(matched[matched.length - 1].route?.path).toBe("about");
    });

    it("深度触顶时残余节点降级为 error", async () => {
        restore = stubFetch(() => [{ path: "next", children: "again.json" }]);
        const { table } = makeTable([{ path: "a", children: "1.json" }], {
            maxChildrenDepth: 3,
        });
        await table.load();
        await table.whenExpanded();
        // 触顶节点自身已展开成功，其子节点（第 4 层）被截断
        expect(table.hasPending()).toBe(false);
        let depth = 0;
        let node: AutoSparkRouteItem | undefined = (table.root.children as AutoSparkRouteItem[])[0];
        while (node && Array.isArray(node.children) && node.children.length > 0) {
            depth++;
            node = node.children[0];
        }
        expect(depth).toBe(3);
    });

    it("远程子项补跑选项继承（进入 namedRouteItems）", async () => {
        restore = stubFetch(() => [{ path: "detail", name: "remote-detail" }]);
        const { table } = makeTable([{ path: "products", children: "a.json" }], {
            routeOptions: { keepAlive: true, timeout: 1234 },
        });
        await table.load();
        await table.whenExpanded();
        expect(table.namedRouteItems?.has("remote-detail")).toBe(true);
        const named = table.namedRouteItems?.get("remote-detail")?.deref();
        expect(named?.keepAlive).toBe(true);
        expect(named?.timeout).toBe(1234);
    });

    it("同一地址被多处引用时路由项对象彼此独立", async () => {
        restore = stubFetch(() => [{ path: "shared" }]);
        const { table } = makeTable([
            { path: "a", children: "/common/x.json" },
            { path: "b", children: "/common/x.json" },
        ]);
        await table.load();
        await table.whenExpanded();
        const children = table.root.children as AutoSparkRouteItem[];
        const childA = (children[0].children as AutoSparkRouteItem[])[0];
        const childB = (children[1].children as AutoSparkRouteItem[])[0];
        expect(childA).not.toBe(childB);
    });

    it("无远程子表时 load() 后即无待展开节点且不阻塞", async () => {
        restore = stubFetch(() => {
            throw new Error("不应发起请求");
        });
        const { table, emitted } = makeTable([{ path: "products", children: [{ path: "detail" }] }]);
        await table.load();
        expect(table.hasPending()).toBe(false);
        expect(emitted.map((e) => e.name)).toContain("routes:expanded");
    });
});
