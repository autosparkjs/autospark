/**
 * 路由哈希生成工具
 * 用于生成唯一的路由标识符，支持字符串插值
 */

import { params as replaceParams } from "./params";
import { quickHash } from "./quickHash";

export type RouteHashVars =
    | "name" // 路由名称
    | "path" // 当前路由路径
    | "fullPath" // 当前完整路径
    | "url" // 当前完整路径
    | "query" // 路由查询字符串
    | "fullQuery" // 完整查询字符串，包括定义在路由中的所有查询
    | "timestamp";
/**
 *
 *
 *
 *
 * 生成路由哈希标识
 * @param route - 路由对象
 * @param fullPath - 当前完整路径
 * @param params - 当前路径参数
 * @param query - 当前查询参数
 * @returns 生成的哈希字符串
 */
export function generateRouteHash(hash: string | undefined, vars: Record<string, any>): string {
    // 使用默认值 "{path}" 如果未指定 hash
    const hashPattern = (hash || "{path}").replace(/\s+/g, ""); // 移除所有空白字符
    // 使用插值函数生成 hash
    const result = quickHash(replaceParams(hashPattern, vars));
    const isNotNumPreifx = isNaN(parseInt(result.substring(0, 1)));
    return isNotNumPreifx ? result : "h" + result;
}
