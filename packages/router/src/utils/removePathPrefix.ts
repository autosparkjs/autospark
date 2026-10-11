/**
 * 移除路径的前缀
 *
 * 安全地移除 URL 路径的前缀部分
 * 自动处理斜杠，避免重复或遗漏
 *
 * @param path - 原始路径
 * @param prefix - 要移除的前缀
 * @returns 移除前缀后的路径
 *
 * @example
 * ```ts
 * removePathPrefix('/users', '')                    // '/users'
 * removePathPrefix('/api/users', '/api')            // '/users'
 * removePathPrefix('/api/users', '/api/')           // '/users'
 * removePathPrefix('api/users', 'api')              // '/users'
 * removePathPrefix('/api/users', '/v1')             // '/api/users' (前缀不匹配)
 * removePathPrefix('/', '/')                        // '/'
 * removePathPrefix('', '/api')                      // ''
 * ```
 */
export function removePathPrefix(path: string, prefix: string | undefined): string {
    // 如果前缀为空，直接返回原路径
    if (!prefix) {
        return path;
    }

    // 如果路径为空，直接返回空字符串
    if (!path) {
        return "";
    }

    // 标准化前缀：确保不以 / 结尾
    const normalizedPrefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;

    // 标准化路径：确保以 / 开头（除非是空路径）
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    // 检查路径是否以前缀开头
    if (normalizedPath === normalizedPrefix) {
        // 如果路径完全等于前缀，返回根路径
        return "/";
    }

    // 如果路径以前缀 + / 开头，则移除前缀
    if (normalizedPath.startsWith(normalizedPrefix + "/")) {
        const remaining = normalizedPath.slice(normalizedPrefix.length);
        // 确保结果以 / 开头
        return remaining.startsWith("/") ? remaining : `/${remaining}`;
    }

    // 如果前缀不匹配，返回原路径（保持标准化格式）
    return normalizedPath;
}
