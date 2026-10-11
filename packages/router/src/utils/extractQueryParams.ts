/**
 * 提取查询参数
 *
 * 使用 URLSearchParams API 解析查询字符串
 *
 * @param search - location.search 字符串，如 ?id=123&name=test
 * @returns 查询参数对象；空字符串返回空对象
 */

export function extractQueryParams(search: string): Record<string, string> {
    if (!search) {
        return {};
    }

    const searchParams = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
        params[key] = value;
    });

    return params;
}
