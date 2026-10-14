/**
 * 远程子表地址解析（ADR-0007 决策 2）
 *
 * 三级判定：
 *
 * | 形态 | 示例 | base | 祖先路由路径 |
 * |---|---|---|---|
 * | 含协议 | `http://…`、`//host/…` | 不拼 | 不拼 |
 * | `/` 开头 | `/shared/a.json` | 拼 | 不拼 |
 * | 其他 | `a.json`、`sub/a.json` | 拼 | 拼 |
 *
 * 「绝对路径」只意味着不继承父路由的位置，不意味着逃出部署根——故 `/` 开头仍拼 base。
 *
 * 插值变量集**封闭**为 `{path}`（祖先+自身的完整路由路径）、`{name}`、`{meta.*}`、`{timestamp}`，
 * **绝对路径亦参与插值**。不提供 `{params.*}` `{query.*}` `{url}` `{state.*}`——
 * 插值发生在初始化期，那时没有 matched route，运行时变量无从取值。
 */

import { joinPath } from "./joinPath";
import { prefixBaseUrl } from "./prefixBaseUrl";
import { params } from "./params";

/** 插值上下文：路由项自身的声明 + 祖先累积路径 */
export interface ChildrenUrlContext {
    /** 祖先+自身的完整路由路径，如 `/products` */
    path: string;
    name?: string;
    meta?: Record<string, any>;
    /** `children: true` 时使用的文件名，缺省 `"routes.json"` */
    routesFile?: string;
}

/** 含协议（`http://`、`https://`、`//host/…`）*/
function hasProtocol(url: string): boolean {
    return url.includes("://") || url.startsWith("//");
}

/** 按 `.` 分隔的路径取值，取不到返回 undefined */
function getByPath(source: any, keyPath: string): any {
    return keyPath.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), source);
}

/**
 * 插值：`{meta.xxx}` 先行替换（`meta` 为嵌套取值），其余变量走既有 `params` 工具。
 *
 * 未知的简单变量（如 `{foo}`）被 `params` 替换为空串；带点的未知键（如 `{params.id}`）
 * 不匹配 `params` 的字符集，原样保留——不静默吞掉。
 */
function interpolate(url: string, ctx: ChildrenUrlContext): string {
    const withMeta = url.replace(/\{\s*meta\.([\w.]+)\s*\}/g, (_match, keyPath: string) => {
        const value = getByPath(ctx.meta, keyPath);
        return value == null ? "" : String(value);
    });
    return params(withMeta, {
        path: ctx.path,
        name: ctx.name ?? "",
        timestamp: Date.now(),
    });
}

/**
 * 解析远程子表的最终请求地址
 *
 * @param source - 原始声明：字符串地址，或 `true`（约定子表）
 * @param ctx - 插值上下文
 * @param base - 应用部署根（`options.base`）
 */
export function resolveChildrenUrl(
    source: string | true,
    ctx: ChildrenUrlContext,
    base?: string,
): string {
    const raw = source === true ? ctx.routesFile || "routes.json" : source;
    const interpolated = interpolate(raw, ctx);
    // 含协议的绝对地址不继承父路由位置；`/` 开头亦不继承（但仍拼 base）
    const joined = hasProtocol(interpolated)
        ? interpolated
        : interpolated.startsWith("/")
          ? interpolated
          : joinPath(ctx.path, interpolated);
    return prefixBaseUrl(joined, base);
}
