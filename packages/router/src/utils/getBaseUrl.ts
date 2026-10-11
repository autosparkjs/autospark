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
