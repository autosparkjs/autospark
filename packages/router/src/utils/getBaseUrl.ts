/**
 * 获取当前页面的 base URL
 *
 * 从 window.location.pathname 提取基础路径：
 * - 移除路径末尾的 .html 或 .htm 文件名
 * - 保留目录路径（如 /app/ 或 /myapp/）
 * - 对于根路径返回 /
 * - 对于无文件名的路径返回当前路径
 *
 * @returns Base URL 字符串
 *
 * @example
 * ```ts
 * // 当前路径: /index.html
 * getBaseUrl() // "/"
 *
 * // 当前路径: /app/index.html
 * getBaseUrl() // "/app/"
 *
 * // 当前路径: /app/
 * getBaseUrl() // "/app/"
 *
 * // 当前路径: /app/v1/
 * getBaseUrl() // "/app/v1/"
 *
 * // 当前路径: /
 * getBaseUrl() // "/"
 * ```
 */
export function getBaseUrl(): string {
    const pathname = window.location.pathname;

    // 如果路径以 .html 或 .htm 结尾，移除文件名
    if (pathname.endsWith('.html') || pathname.endsWith('.htm')) {
        // 查找最后一个斜杠的位置
        const lastSlashIndex = pathname.lastIndexOf('/');

        if (lastSlashIndex === 0) {
            // 路径格式为 /index.html，返回根路径
            return '/';
        }

        // 返回目录路径（保留末尾斜杠）
        return pathname.substring(0, lastSlashIndex + 1);
    }

    // 如果路径以斜杠结尾，直接返回
    if (pathname.endsWith('/')) {
        return pathname;
    }

    // 如果路径不以斜杠结尾但也不是文件名，添加斜杠
    if (pathname.length > 0 && pathname !== '/') {
        return pathname + '/';
    }

    // 默认返回根路径
    return '/';
}

/**
 * 从文档 `<base href>` 标签推断应用 base（ADR-0006 动态入口信号源）
 *
 * 动态入口（服务端渲染入口 HTML、URL 无文件名，如 /shop）下，深层直达/刷新的 URL
 * 不含「应用前缀到哪结束」的信号——getBaseUrl 的目录规则会把路由路径误判为目录。
 * 服务端在入口模板注入 `<base href="/shop/">` 即可携带挂载路径（HTML 标准、SSR 天然
 * 知道），顺带修复动态入口页相对路径资源的解析。
 *
 * 仅当页面真有 `<base>` 标签时才采纳：无标签时 document.baseURI 等于文档 URL
 * （含路由路径），采纳会把路由路径误当 base。返回形态对齐 getBaseUrl（非根带尾斜杠）。
 */
export function getDocumentBase(): string | null {
    if (typeof document === "undefined" || !document.querySelector("base")) {
        return null;
    }
    try {
        const pathname = new URL(document.baseURI).pathname;
        if (!pathname || pathname === "/") {
            return "/";
        }
        return pathname.endsWith("/") ? pathname : pathname + "/";
    } catch {
        return null;
    }
}
