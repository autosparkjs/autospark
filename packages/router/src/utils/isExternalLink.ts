/**
 * 判断一个 URL 是否是外部链接
 * 通过比较 URL 的协议、主机名和端口来确定
 *
 * @param url - 要检查的 URL 字符串
 * @returns 如果是外部链接返回 true，否则返回 false
 *
 * @example
 * ```ts
 * // 假设当前页面是 https://example.com:8080
 * isExternalLink('https://other.com')           // true
 * isExternalLink('https://example.com:8080')    // false
 * isExternalLink('/relative/path')              // false
 * isExternalLink('//protocol-relative.com')     // true
 * isExternalLink('mailto:test@example.com')     // true
 * ```
 */
export function isExternalLink(url: string): boolean {
  // 空值或仅包含空格视为内部链接
  if (!url || !url.trim()) {
    return false;
  }

  // 处理协议相对 URL (如 //example.com)
  if (url.startsWith('//')) {
    const { hostname } = window.location;
    const link = document.createElement('a');
    link.href = url;
    return link.hostname !== hostname;
  }

  // 处理其他协议 (如 mailto:, tel:, javascript:)
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    const link = document.createElement('a');
    link.href = url;
    // 如果协议不是 http/https，视为外部链接
    if (link.protocol !== 'http:' && link.protocol !== 'https:') {
      return true;
    }
    // 比较 hostname 和 port
    return (
      link.hostname !== window.location.hostname ||
      link.port !== window.location.port
    );
  }

  // 相对路径（以 / 开头或无协议）视为内部链接
  return false;
}
