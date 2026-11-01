/**
 * REST 默认映射表与请求执行管线（ADR-0011）。
 *
 * 规则只产出 {@link RequestDesc}（四字段封顶）；序列化 / 合并 / fetch / 解包 / 错误包装
 * 统一在 {@link executeRequest}——自定义映射与默认映射走同一条执行管线（DRY）。
 */
import { ResourceError, type RequestDesc, type ResourceMapping, type ResourceRequestOptions } from "./types";

/**
 * 通用条件选项归一化（`ResourceCondition` → query 对象）：条件形态方法共用的唯一机制。
 *
 * - `where` 对象形态**逐键展开**进 query（`{status:"open"}` → `status=open`）；
 * - `where` 字符串形态作为单一 `where` 参数直传（后端方言解释，空串跳过）；
 * - `order` / `page` / `pageSize` 与其余任意键**原样透传**（getMany 既有约定不变）；
 *   数组值仍走 buildQuery 的逗号连接约定（`where:{tags:["a","b"]}` → `tags=a,b`）。
 */
export function conditionQuery(options: Record<string, any> = {}): Record<string, any> {
    const { where, ...rest } = options;
    const query: Record<string, any> = { ...rest };
    if (where != null && typeof where === "object") Object.assign(query, where);
    else if (typeof where === "string" && where !== "") query.where = where;
    return query;
}

/**
 * 默认 REST 映射表（可经 `options.resources.mapping` / 资源定义内联 `mapping` 按方法覆盖）：
 *
 * - `get(id)` → `GET {url}/{id}`（id 直接拼接，数字/字符串均可）；`get(options)` →
 *   `GET {url}?{conditionQuery 序列化}`（**条件形态**——非空普通对象实参即通用条件选项，
 *   返回单条还是集合由后端解释）；
 * - `getMany(options?)` → `GET {url}?{conditionQuery 序列化}`——通用条件选项
 *   `{where?, order?, page?, pageSize?, ...其余任意键}`，分页字段仅传入时出现（对齐响应壳
 *   约定），find 已裁撤——条件过滤统一走 `where`；
 * - `add(data | [data...])` → `POST {url}`——body 原样（数组一次发）；
 * - `update(data | [data...], options?)` → `PUT` 系（body 恒原样，数组一次发）：
 *   显式 `options` → `PUT {url}?{conditionQuery 序列化}`（条件更新，**优先于 id 路由**——
 *   显式传条件即按条件更新集合的意图）；数组 → `PUT {url}`（批量一次发）；对象含 `id` →
 *   `PUT {url}/{id}`；其余退化 `PUT {url}`。PATCH 语义按方法覆写自定；
 * - `delete(id | [id...])` → 单个 `DELETE {url}/{id}`；批量 `DELETE {url}?ids=1,2,3`；
 *   `delete(options)` → `DELETE {url}?{conditionQuery 序列化}`（**条件形态**——非空普通对象
 *   实参即通用条件选项；`{where:{ids:[1,2]}}` 经序列化约定自然得 `?ids=1,2`）。
 */
export const DEFAULT_REST_MAPPING: ResourceMapping = {
    get: (url, idOrOptions) =>
        // 条件形态：非空普通对象实参即通用条件选项（数组不属条件，沿用路径拼接的既有退化行为）
        idOrOptions != null && typeof idOrOptions === "object" && !Array.isArray(idOrOptions)
            ? { method: "GET", url, query: conditionQuery(idOrOptions) }
            : { method: "GET", url: `${url}/${idOrOptions}` },
    getMany: (url, options = {}) => ({ method: "GET", url, query: conditionQuery(options) }),
    add: (url, data) => ({ method: "POST", url, body: data }),
    update: (url, data, options) => {
        // 条件更新优先：显式 options 即「按条件更新集合」的显式意图（数组体亦可条件更新）
        if (options != null && typeof options === "object") {
            return { method: "PUT", url, query: conditionQuery(options), body: data };
        }
        if (Array.isArray(data)) return { method: "PUT", url, body: data };
        const id = (data as { id?: unknown } | null | undefined)?.id;
        return id != null ? { method: "PUT", url: `${url}/${id}`, body: data } : { method: "PUT", url, body: data };
    },
    delete: (url, idOrOptions) => {
        // 条件形态：非空普通对象实参即通用条件选项（{where:{ids:[1,2]}} → ?ids=1,2）
        if (idOrOptions != null && typeof idOrOptions === "object" && !Array.isArray(idOrOptions)) {
            return { method: "DELETE", url, query: conditionQuery(idOrOptions) };
        }
        return Array.isArray(idOrOptions)
            ? { method: "DELETE", url, query: { ids: idOrOptions.join(",") } }
            : { method: "DELETE", url: `${url}/${idOrOptions}` };
    },
};

/**
 * query 对象序列化为 querystring（不含 `?` 前缀）。
 *
 * - 简单值 `key=value`（URLSearchParams 编码）；
 * - 数组值**逗号连接**（`ids=1,2,3` / `tags=a,b`，与 delete 批量语义一致）；
 * - `undefined` / `null` 跳过（分页字段未启用时不出现）；嵌套结构不承诺通用序列化
 *   （自定义规则可把任意 query 直接拼进 url 自行处理）。
 */
export function buildQuery(query: Record<string, any>): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        const str = Array.isArray(value) ? value.join(",") : String(value);
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(str)}`);
    }
    return parts.join("&");
}

/**
 * 执行请求描述符（统一管线）：
 *
 * 1. 拼 url：`baseUrl + desc.url`（desc.url 以 http(s) 开头时视为绝对地址，跳过 baseUrl）；
 * 2. query 序列化追加、headers 逐请求合并、body JSON 化（Content-Type: application/json）；
 * 3. fetch（选项缺省回退 globalThis.fetch）；网络错误 reject ResourceError（status=0）；
 * 4. 非 2xx reject ResourceError（status/url/method 携带）；
 * 5. 204/无内容 → null；其余 `res.json()`；
 * 6. `unwrap(data, desc)`（缺省恒等）——解包抛错同样 reject。
 *
 * @param desc 映射规则产出的请求描述符
 * @param opts 已按三层回退解析的最终请求选项（baseUrl/fetch/headers/unwrap）
 */
export async function executeRequest(
    desc: RequestDesc,
    opts: ResourceRequestOptions = {},
): Promise<any> {
    // desc.url 为绝对地址时跳过 baseUrl（资源定义可直接写完整地址）
    const fullUrl =
        /^https?:\/\//i.test(desc.url) || !opts.baseUrl
            ? desc.url
            : `${String(opts.baseUrl).replace(/\/+$/, "")}/${desc.url.replace(/^\/+/, "")}`;
    const qs = desc.query ? buildQuery(desc.query) : "";
    const url = qs ? `${fullUrl}${fullUrl.includes("?") ? "&" : "?"}${qs}` : fullUrl;

    const headers: Record<string, string> = { ...opts.headers };
    let body: string | undefined;
    if (desc.body !== undefined) {
        body = JSON.stringify(desc.body);
        if (!Object.keys(headers).some((k) => k.toLowerCase() === "content-type")) {
            headers["Content-Type"] = "application/json";
        }
    }

    const doFetch = opts.fetch ?? globalThis.fetch;
    let res: Response;
    try {
        res = await doFetch(url, { method: desc.method, headers, body });
    } catch (e: any) {
        throw new ResourceError(
            `资源请求网络错误: ${desc.method} ${url} (${e?.message ?? e})`,
            0,
            url,
            desc.method,
        );
    }
    if (!res.ok) {
        throw new ResourceError(
            `资源请求失败: ${desc.method} ${url} → ${res.status} ${res.statusText}`,
            res.status,
            url,
            desc.method,
        );
    }
    if (res.status === 204) return null;
    const text = await res.text();
    const data = text === "" ? null : JSON.parse(text);
    return opts.unwrap ? opts.unwrap(data, desc) : data;
}
