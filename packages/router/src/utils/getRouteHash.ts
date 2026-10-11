import type { KylinMatchedRouteItem } from "@/types";
import { getSignalHash } from "./getSignalHash";

/**
 * 生成路由哈希和其变量的辅助函数
 *  "name" // 路由名称
     "path" // 当前路由路径
     "curPath" // 当前完整路径
    "url" // 当前完整路径
     "query" // 路由查询字符串
     "timestamp";

 */
export function getRouteHash(matched: KylinMatchedRouteItem) {
    const hash = matched?.route?.hash || "{path}";
    return getSignalHash(hash, matched);
}
