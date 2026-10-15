/**
 * raw 强制前缀工具（ADR-0008 修订）
 *
 * 视图 URL 以 `!` 开头（如 `!/path/page.html`）表示强制 raw 渲染——跳过一切内容
 * 加工、原样输出，**优先级最高**（高于路由级显式渲染器）。前缀独立于 URL 查询串，
 * 与业务 query（如 `?count=1`）零冲突；是给 router 的指令，fetch 前剥除，
 * 服务器收到干净 URL。
 */

import type { AutoSparkMatchedRouteItem } from "@/types/routes";

/** raw 强制渲染的 URL 前缀 */
const RAW_PREFIX = "!";

/** 判定视图 URL 是否带 raw 强制前缀（基于路由声明的视图源字符串，非 fetch 后地址） */
export function hasRawPrefix(url: string): boolean {
    return url.startsWith(RAW_PREFIX);
}

/** 剥除视图 URL 的 raw 强制前缀（无前缀原样返回） */
export function stripRawPrefix(url: string): string {
    return hasRawPrefix(url) ? url.slice(RAW_PREFIX.length) : url;
}

/**
 * 取路由声明的视图源 URL（仅字符串形态；HTMLElement / 函数源无渲染器选择语义）
 *
 * 优先读加载域合并后的 `_viewOptions.from`，未就位时回退 `route.view` 原始声明
 * （兼容 options 对象形态 `{ from }`）。
 */
export function getDeclaredViewUrl(matched: AutoSparkMatchedRouteItem): string | undefined {
    const route = matched.route as any;
    if (!route) return undefined;
    const from = route._viewOptions?.from ?? route.view;
    if (typeof from === "string") return from;
    if (from && typeof from === "object" && typeof from.from === "string") return from.from;
    return undefined;
}
