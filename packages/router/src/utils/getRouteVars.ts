import type { KylinMatchedRouteItem } from "@/types";

/**
 * 从路由匹配项中提取并合并所有路由相关的变量
 * @param {KylinMatchedRouteItem} route - 路由匹配项对象
 * @returns {Object} 包含路由名称、哈希、路径、URL以及合并后的参数、查询和元数据的对象
 */
export function getRouteVars(route: KylinMatchedRouteItem): Record<string, any> {
    return {
        name: route.route.name,
        path: route.path,
        curPath: route.path,
        url: route.url,
        timestamp: Date.now(),
        query: new URLSearchParams(route.query).toString(),
        ...route.route.meta,
        ...route.params,
        ...route.state,
    };
}
