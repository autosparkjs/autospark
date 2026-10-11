/**
 * 将 URL 转换为 JSON 格式的路径
 * - 先移除查询参数（?xxx）和锚点（#xxx）
 * - 如果路径包含任意扩展名（如 .html, .asp, .php, .jsp 等），则将扩展名替换为 .json
 * - 如果路径以 / 结尾，则添加 data.json
 * - 如果路径没有扩展名，则自动添加 .json
 *
 * @param url - 原始 URL 字符串
 * @returns 处理后的 URL 字符串（不含查询参数和锚点）
 */
export function getJsonFileFromUrl(url: string): string {
    // 去除首尾空格
    let trimmedUrl = url.trim();

    // 移除查询参数（?后面内容）
    const queryIndex = trimmedUrl.indexOf("?");
    if (queryIndex !== -1) {
        trimmedUrl = trimmedUrl.substring(0, queryIndex);
    }

    // 移除锚点（#后面内容）
    const hashIndex = trimmedUrl.indexOf("#");
    if (hashIndex !== -1) {
        trimmedUrl = trimmedUrl.substring(0, hashIndex);
    }

    // 处理路径部分
    let path = trimmedUrl;

    // 检查是否以 / 结尾
    if (path.endsWith("/")) {
        path = path + "data.json";
    }
    // 检查是否包含扩展名（最后一个点后面没有斜杠）
    else {
        const lastSlashIndex = path.lastIndexOf("/");
        const lastDotIndex = path.lastIndexOf(".");

        // 如果存在扩展名（点在斜杠之后）
        if (lastDotIndex !== -1 && lastDotIndex > lastSlashIndex) {
            // 将扩展名替换为 .json
            path = path.substring(0, lastDotIndex) + ".json";
        } else {
            // 没有扩展名，添加 .json
            path = path + ".json";
        }
    }

    return path;
}

/**
 * 
 
// 测试各种扩展名
console.log(getJsonFileFromUrl("https://example.com/page.html"));
// 输出: https://example.com/page.json

console.log(getJsonFileFromUrl("https://example.com/page.asp"));
// 输出: https://example.com/page.json

console.log(getJsonFileFromUrl("https://example.com/page.php"));
// 输出: https://example.com/page.json

console.log(getJsonFileFromUrl("https://example.com/page.jsp"));
// 输出: https://example.com/page.json

console.log(getJsonFileFromUrl("https://example.com/page.aspx"));
// 输出: https://example.com/page.json

console.log(getJsonFileFromUrl("https://example.com/api/data.ashx"));
// 输出: https://example.com/api/data.json

console.log(getJsonFileFromUrl("https://example.com/style.css"));
// 输出: https://example.com/style.json

console.log(getJsonFileFromUrl("https://example.com/script.js"));
// 输出: https://example.com/script.json

// 带查询参数的
console.log(getJsonFileFromUrl("https://example.com/page.asp?id=123"));
// 输出: https://example.com/page.json

console.log(getJsonFileFromUrl("https://example.com/data.php?action=view"));
// 输出: https://example.com/data.json

// 以 / 结尾的
console.log(getJsonFileFromUrl("https://example.com/folder/"));
// 输出: https://example.com/folder/data.json

// 没有扩展名的
console.log(getJsonFileFromUrl("https://example.com/api/data"));
// 输出: https://example.com/api/data.json

// 带锚点的
console.log(getJsonFileFromUrl("https://example.com/page.html#section"));
// 输出: https://example.com/page.json

// 复杂情况
console.log(getJsonFileFromUrl("https://example.com/api/user.asp?id=1&name=test#top"));
// 输出: https://example.com/api/user.json
*/
