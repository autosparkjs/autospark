const htmlTagRegex = /<[^>]+>/;

/**
 *
 */
export function isUrlSource(urlString: any): boolean {
    if (typeof urlString !== "string" || urlString.trim() === "") {
        return false;
    }
    const url = urlString.trim();
    // url：单行
    if (url.includes("\n")) return false;
    // 是否包含了简单的标签
    if (htmlTagRegex.test(url)) return false;
    return true;
}
