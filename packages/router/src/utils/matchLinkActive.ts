/**
 * auto-link 链接激活态匹配（ADR-0121）
 *
 * 链接 `to` 与当前路由路径的匹配判定，返回命中形态供类与 aria-current 分级消费：
 * - "exact"：规范化后完全相等（`aria-current="page"` 仅此形态设置）
 * - "prefix"：当前路径以 `to` 为前缀且按 `/` 段对齐（父级导航高亮）
 * - false：不命中
 *
 * 规范化复用路由匹配语义（D-07 去尾斜杠 / D-08 不分大小写）；query 与 hash
 * 由调用方剥离（本函数只收 path），`to` 带 query/hash 时取 path 部分参与比较。
 * `to="/"` 特例仅在根路径精确命中——按段边界规则它本就无法前缀命中，显式表达。
 */

/** 激活命中形态 */
export type LinkActiveMatch = "exact" | "prefix" | false;

/**
 * 激活匹配规范化：去空白、确保以 / 开头、去尾斜杠、转小写（D-07/D-08）
 */
function normalizeActivePath(path: string): string {
    let normalized = path.trim().toLowerCase();
    if (!normalized.startsWith("/")) {
        normalized = "/" + normalized;
    }
    normalized = normalized.replace(/\/+$/, "");
    return normalized === "" ? "/" : normalized;
}

/**
 * 判定链接 `to` 相对当前路由路径的激活形态
 *
 * @param to - 链接目标（`to` 属性原值，可含 query/hash，仅 path 部分参与）
 * @param currentPath - 当前路由路径（`$.route.path` 同源：剥 base 后的 pathname）
 */
export function matchLinkActive(to: string, currentPath: string): LinkActiveMatch {
    // 空 to / 非内部路径（外部链接含 ://，不以 / 开头）永不参与
    if (!to || !to.trim().startsWith("/")) return false;
    const target = normalizeActivePath(to.split(/[?#]/)[0]);
    const current = normalizeActivePath(currentPath.split(/[?#]/)[0]);
    if (target === "/") {
        return current === "/" ? "exact" : false;
    }
    if (target === current) return "exact";
    // 段边界前缀：/guide 命中 /guide/foo，不命中 /guides
    return current.startsWith(target) && current.charAt(target.length) === "/" ? "prefix" : false;
}
