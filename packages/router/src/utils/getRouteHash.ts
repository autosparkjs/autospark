import type { AutoSparkMatchedRouteItem } from "@/types";
import { getSignalHash } from "./getSignalHash";

/**
 * 生成路由哈希和其变量的辅助函数
 *
 * 默认模板为 "{url}"（解析后的实际 URL）：参数化路由（:param）每个参数取值都必须
 * 产生独立 hash——视图缓存/keepAlive 复用按 hash 判定，若参数取值坍缩为同一 hash，
 * 参数变化时会被误判为「同视图复用」而跳过重渲染（表现为子路由切换不生效）。
 * 注意不能用 "{path}" 作默认：matched.path 是路由模式路径（如 /products/:category），
 * 不含实际参数值。
 *
    "name" // 路由名称
     "path" // 当前路由路径
     "curPath" // 当前完整路径
    "url" // 当前完整路径
     "query" // 路由查询字符串
     "timestamp";

 */
export function getRouteHash(matched: AutoSparkMatchedRouteItem) {
    const hash = matched?.route?.hash || "{url}";
    return getSignalHash(hash, matched);
}
