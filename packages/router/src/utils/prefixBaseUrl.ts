import { joinPath } from "./joinPath";

export function prefixBaseUrl(url: string, base: string | undefined) {
    // 如果是完整 URL（包含 :// 或以 // 开头），保持不变
    if (url.includes("://") || url.startsWith("//")) {
        return url;
    }

    // 获取 base URL
    const baseUrl = base || "";
    if (!baseUrl || baseUrl === "/") {
        // base 为空或根路径，直接返回原 URL
        return url;
    }

    // 如果 URL 以 / 开头（绝对路径），检查是否需要添加 base 前缀
    if (url.startsWith("/")) {
        // 检查是否已经包含 base 前缀
        if (url.startsWith(baseUrl)) {
            return url;
        }
        // 添加 base 前缀
        return joinPath(baseUrl, url);
    }

    // 相对路径，直接添加 base 前缀
    return joinPath(baseUrl, url);
}
