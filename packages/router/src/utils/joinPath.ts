/**
 * 安全地连接两个 URL 路径
 * 自动处理斜杠，避免重复或遗漏
 *
 * @param base - 基础路径
 * @param path - 要连接的路径
 * @returns 连接后的完整路径
 *
 * @example
 * ```ts
 * joinPath('/api', '/users')      // '/api/users'
 * joinPath('/api/', 'users')      // '/api/users'
 * joinPath('/api/', '/users')     // '/api/users'
 * joinPath('', '/users')          // '/users'
 * joinPath('/api', '')            // '/api'
 * ```
 */
export function joinPath(base: string, path: string): string {
  // 移除 base 结尾的斜杠
  const cleanBase = base.replace(/\/+$/, '');
  // 移除 path 开头的斜杠
  const cleanPath = path.replace(/^\/+/, '');

  // 如果 base 为空，直接返回 path
  if (!cleanBase) {
    return `/${cleanPath}`;
  }

  // 如果 path 为空，确保返回有效路径
  if (!cleanPath) {
    return cleanBase || "/";  // 如果 base 也为空，返回根路径
  }

  // 用单个斜杠连接
  return `${cleanBase}/${cleanPath}`;
}
