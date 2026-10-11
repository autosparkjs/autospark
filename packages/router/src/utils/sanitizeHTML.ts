/**
 * 安全清理 HTML - 移除危险的 HTML 元素和属性
 *
 * @param html - 原始 HTML 字符串
 * @returns 清理后的安全 HTML
 *
 * @example
 * ```ts
 * const unsafe = '<script>alert("xss")</script><p>Hello</p>';
 * const safe = sanitizeHTML(unsafe); // "<p>Hello</p>"
 * ```
 */
export function sanitizeHTML(html: string): string {
    // 移除 <script> 标签及其内容
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

    // 移除危险的 HTML 事件处理属性（如 onclick、onerror）
    html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");
    html = html.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, "");

    // 移除 javascript: 协议的链接
    html = html.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
    html = html.replace(/href\s*=\s*javascript:[^\s>]*/gi, 'href="#"');

    // 移除 iframe、object、embed、form 等可能危险的标签
    html = html.replace(/<(iframe|object|embed|form)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, "");
    html = html.replace(/<(iframe|object|embed|form)\b[^>]*/gi, "");

    return html;
}
