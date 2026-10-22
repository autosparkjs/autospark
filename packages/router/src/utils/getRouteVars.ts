import type { AutoSparkMatchedRouteItem } from "@/types";

/**
 * 从路由匹配项中提取并合并所有路由相关的变量
 *
 * `metaVars`（`engine.state.$` 的原始值成员，见 ADR-0122）为**最底层**：
 * 路由侧同名变量（meta / params / 导航 state 等）一律优先。
 *
 * @param {AutoSparkMatchedRouteItem} route - 路由匹配项对象
 * @param {Record<string, any>} metaVars - 元状态插值变量（可缺省）
 * @returns {Object} 包含路由名称、哈希、路径、URL以及合并后的参数、查询和元数据的对象
 */
export function getRouteVars(
    route: AutoSparkMatchedRouteItem,
    metaVars?: Record<string, any>,
): Record<string, any> {
    return {
        ...metaVars,
        name: route.route?.name,
        path: route.path,
        curPath: route.path,
        url: route.url,
        timestamp: Date.now(),
        query: new URLSearchParams(route.query).toString(),
        ...route.route?.meta,
        ...route.params,
        ...route.state,
    };
}
