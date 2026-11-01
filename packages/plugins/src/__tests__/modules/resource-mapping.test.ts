import { describe, expect, test } from "bun:test";
// 管线单元测试不依赖 DOM 全局，但保持与其他模块测试一致的导入形态
import "../../modules/resource";
import {
    DEFAULT_REST_MAPPING,
    buildQuery,
    conditionQuery,
    executeRequest,
} from "../../modules/resource";
import { ResourceError } from "../../modules/resource";

/**
 * REST 默认映射规则 + 请求执行管线单元测试（ADR-0011）：
 *
 * - 四条默认规则产出 RequestDesc 的形态逐条验证（url 拼接 / query / body / 批量 delete）；
 * - buildQuery：数组逗号连接（Q21）、undefined/null 跳过、编码；
 * - executeRequest：baseUrl 拼接与绝对地址跳过、headers/Content-Type、非 2xx →
 *   ResourceError（status/url/method 标量）、204 → null、unwrap 钩子、网络错误 status=0。
 */

/** 造 mock fetch：记录调用 + 可配置响应 */
function makeFetch(respond: () => Response) {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fn = (async (url: any, init?: any) => {
        calls.push({ url: String(url), init });
        return respond();
    }) as typeof fetch;
    return { fn, calls };
}

const ok = (data: any) => new Response(JSON.stringify(data), { status: 200 });

describe("默认 REST 映射规则（RequestDesc 产出形态）", () => {
    test("get(id) → GET {url}/{id}，id 直接拼接", () => {
        expect(DEFAULT_REST_MAPPING.get!("/api/orders", 42)).toEqual({
            method: "GET",
            url: "/api/orders/42",
        });
    });

    test("getMany(options) → GET + query（分页字段仅传入时出现，其余键即条件过滤）", () => {
        expect(DEFAULT_REST_MAPPING.getMany!("/api/orders")).toEqual({
            method: "GET",
            url: "/api/orders",
            query: {},
        });
        expect(DEFAULT_REST_MAPPING.getMany!("/api/orders", { page: 2, pageSize: 20 })).toEqual({
            method: "GET",
            url: "/api/orders",
            query: { page: 2, pageSize: 20 },
        });
        expect(
            DEFAULT_REST_MAPPING.getMany!("/api/orders", { status: "open", tags: ["a", "b"] }),
        ).toEqual({ method: "GET", url: "/api/orders", query: { status: "open", tags: ["a", "b"] } });
    });

    test("add(data | [data...]) → POST body 原样（数组一次发）", () => {
        expect(DEFAULT_REST_MAPPING.add!("/api/orders", { id: 1 })).toEqual({
            method: "POST",
            url: "/api/orders",
            body: { id: 1 },
        });
        expect(DEFAULT_REST_MAPPING.add!("/api/orders", [{ id: 1 }, { id: 2 }])).toEqual({
            method: "POST",
            url: "/api/orders",
            body: [{ id: 1 }, { id: 2 }],
        });
    });

    test("update(data) 对象含 id → PUT {url}/{id}，body 原样", () => {
        expect(DEFAULT_REST_MAPPING.update!("/api/orders", { id: 7, amount: 99 })).toEqual({
            method: "PUT",
            url: "/api/orders/7",
            body: { id: 7, amount: 99 },
        });
    });

    test("update([...]) 批量 → PUT {url}，数组体一次发", () => {
        expect(DEFAULT_REST_MAPPING.update!("/api/orders", [{ id: 1 }, { id: 2 }])).toEqual({
            method: "PUT",
            url: "/api/orders",
            body: [{ id: 1 }, { id: 2 }],
        });
    });

    test("update(data, options) 条件 → PUT {url}?query，条件优先于 id 路由（body 原样，数组亦可）", () => {
        expect(
            DEFAULT_REST_MAPPING.update!("/api/orders", { status: "closed" }, { tenant: "a" }),
        ).toEqual({ method: "PUT", url: "/api/orders", query: { tenant: "a" }, body: { status: "closed" } });
        expect(
            DEFAULT_REST_MAPPING.update!("/api/orders", [{ id: 1 }], { status: "open" }),
        ).toEqual({ method: "PUT", url: "/api/orders", query: { status: "open" }, body: [{ id: 1 }] });
    });

    test("update 无 id 无条件对象 → 退化 PUT {url} body 原样", () => {
        expect(DEFAULT_REST_MAPPING.update!("/api/orders", { a: 1 })).toEqual({
            method: "PUT",
            url: "/api/orders",
            body: { a: 1 },
        });
    });

    test("delete 单个 → DELETE {url}/{id}；批量 → ?ids=1,2,3（query 形态）", () => {
        expect(DEFAULT_REST_MAPPING.delete!("/api/orders", 7)).toEqual({
            method: "DELETE",
            url: "/api/orders/7",
        });
        expect(DEFAULT_REST_MAPPING.delete!("/api/orders", [1, 2, 3])).toEqual({
            method: "DELETE",
            url: "/api/orders",
            query: { ids: "1,2,3" },
        });
    });
});

describe("通用条件选项 conditionQuery（ResourceCondition 归一化）", () => {
    test("where 对象形态逐键展开；order/page/pageSize 原样透传", () => {
        expect(
            conditionQuery({ where: { status: "open", tags: ["a", "b"] }, order: "id desc", page: 2, pageSize: 20 }),
        ).toEqual({ status: "open", tags: ["a", "b"], order: "id desc", page: 2, pageSize: 20 });
    });

    test("where 字符串形态作为单一 where 参数直传（后端方言）；空串跳过", () => {
        expect(conditionQuery({ where: "amount>99" })).toEqual({ where: "amount>99" });
        expect(conditionQuery({ where: "", order: "id" })).toEqual({ order: "id" });
    });

    test("无 where 原样返回（getMany 既有约定不变）", () => {
        expect(conditionQuery({ page: 1, kw: "x" })).toEqual({ page: 1, kw: "x" });
        expect(conditionQuery()).toEqual({});
    });
});

describe("条件形态（get / delete 对象实参 + update 条件优先）", () => {
    test("get({where,order}) → GET {url}?query（where 展开）", () => {
        expect(DEFAULT_REST_MAPPING.get!("/api/orders", { where: { status: "open" }, order: "id desc" })).toEqual({
            method: "GET",
            url: "/api/orders",
            query: { status: "open", order: "id desc" },
        });
        expect(DEFAULT_REST_MAPPING.get!("/api/orders", { where: "amount>99" })).toEqual({
            method: "GET",
            url: "/api/orders",
            query: { where: "amount>99" },
        });
    });

    test("delete({where}) → DELETE {url}?query；{where:{ids:[..]}} 自然得 ids 逗号连接", () => {
        expect(DEFAULT_REST_MAPPING.delete!("/api/orders", { where: { status: "draft" } })).toEqual({
            method: "DELETE",
            url: "/api/orders",
            query: { status: "draft" },
        });
        expect(buildQuery(conditionQuery({ where: { ids: [1, 2] } }))).toBe("ids=1%2C2");
    });

    test("update(data, {where,order}) → PUT {url}?query（条件优先于 id 路由）", () => {
        expect(DEFAULT_REST_MAPPING.update!("/api/orders", { status: "closed" }, { where: "tenant=a", order: "id" })).toEqual({
            method: "PUT",
            url: "/api/orders",
            query: { where: "tenant=a", order: "id" },
            body: { status: "closed" },
        });
    });

    test("get 基元实参路径形态不受影响", () => {
        expect(DEFAULT_REST_MAPPING.get!("/api/orders", 42)).toEqual({ method: "GET", url: "/api/orders/42" });
        expect(DEFAULT_REST_MAPPING.delete!("/api/orders", [1, 2])).toEqual({
            method: "DELETE",
            url: "/api/orders",
            query: { ids: "1,2" },
        });
    });
});

describe("buildQuery 序列化", () => {
    test("数组值逗号连接（与 ids 语义一致，Q21）", () => {
        expect(buildQuery({ ids: [1, 2, 3], tags: ["a", "b"] })).toBe("ids=1%2C2%2C3&tags=a%2Cb");
    });

    test("undefined/null 跳过；简单值编码", () => {
        expect(buildQuery({ page: 2, pageSize: undefined, q: null, kw: "a b" })).toBe(
            "page=2&kw=a%20b",
        );
    });

    test("空对象 → 空串", () => {
        expect(buildQuery({})).toBe("");
    });
});

describe("executeRequest 执行管线", () => {
    test("baseUrl 拼接 + query 追加 + headers/Content-Type/body JSON 化", async () => {
        const { fn, calls } = makeFetch(() => ok({ done: true }));
        const data = await executeRequest(
            { method: "POST", url: "/orders", query: { page: 2 }, body: { a: 1 } },
            { baseUrl: "/api", fetch: fn, headers: { Authorization: "Bearer t" } },
        );
        expect(data).toEqual({ done: true });
        expect(calls.length).toBe(1);
        expect(calls[0]!.url).toBe("/api/orders?page=2");
        const init = calls[0]!.init as RequestInit;
        expect(init.method).toBe("POST");
        expect((init.headers as any)["Authorization"]).toBe("Bearer t");
        expect((init.headers as any)["Content-Type"]).toBe("application/json");
        expect(init.body).toBe('{"a":1}');
    });

    test("desc.url 为绝对地址时跳过 baseUrl；已有 query 的 url 用 & 追加", async () => {
        const { fn, calls } = makeFetch(() => ok(null));
        await executeRequest(
            { method: "GET", url: "https://cdn.example.com/o?x=1", query: { y: 2 } },
            { baseUrl: "/api", fetch: fn },
        );
        expect(calls[0]!.url).toBe("https://cdn.example.com/o?x=1&y=2");
    });

    test("非 2xx → reject ResourceError（status/url/method 标量，Q8）", async () => {
        const { fn, calls } = makeFetch(() => new Response("nope", { status: 404 }));
        await expect(
            executeRequest({ method: "GET", url: "/orders/9" }, { baseUrl: "/api", fetch: fn }),
        ).rejects.toMatchObject({
            name: "ResourceError",
            status: 404,
            url: "/api/orders/9",
            method: "GET",
        });
        expect(calls.length).toBe(1);
    });

    test("网络错误 → ResourceError status=0", async () => {
        const fn = (async () => {
            throw new Error("offline");
        }) as typeof fetch;
        await expect(
            executeRequest({ method: "GET", url: "/x" }, { fetch: fn }),
        ).rejects.toMatchObject({ name: "ResourceError", status: 0 });
    });

    test("204 / 空响应体 → null", async () => {
        const { fn } = makeFetch(() => new Response(null, { status: 204 }));
        expect(await executeRequest({ method: "DELETE", url: "/o/1" }, { fetch: fn })).toBeNull();
    });

    test("unwrap 钩子：剥壳 + 收 (data, desc) 双参（Q5）", async () => {
        const { fn } = makeFetch(() => ok({ code: 0, data: [1, 2], message: "ok" }));
        const seen: unknown[] = [];
        const data = await executeRequest(
            { method: "GET", url: "/orders" },
            {
                fetch: fn,
                unwrap: (d, desc) => {
                    seen.push(desc.method);
                    return (d as any).data;
                },
            },
        );
        expect(data).toEqual([1, 2]);
        expect(seen).toEqual(["GET"]);
    });

    test("ResourceError 是 Error 子类（可被 catch (e) 语义消费）", () => {
        const e = new ResourceError("m", 500, "/u", "POST");
        expect(e instanceof Error).toBe(true);
        expect(e.message).toBe("m");
    });
});
