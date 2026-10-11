import type { KylinMatchedRouteItem } from "@/types";
import { getRouteVars } from "./getRouteVars";
import { params as replaceParams } from "./params";
import { quickHash } from "./quickHash";

/**
 * 生成路由哈希和其变量的辅助函数
    "name"      // 路由名称
    "path"      // 当前路由路径
    "curPath"   // 当前完整路径
    "url"       // 当前完整路径
    "query"     // 路由查询字符串
    "timestamp";
 */
export function getSignalHash(hash: string, matched: KylinMatchedRouteItem) {
    const vars = getRouteVars(matched);
    const result = quickHash(replaceParams(hash, vars));
    const isNotNumPreifx = isNaN(parseInt(result.substring(0, 1)));
    return isNotNumPreifx ? result : "h" + result;
}
