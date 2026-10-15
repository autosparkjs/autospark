import type { AutoSparkMatchedRouteItem } from "@/types/routes";
import { AutoSparkRouterViewRendererBase, type ViewRenderResult } from "./base";
import type { ViewRenderOptions } from "./types";
import { getDeclaredViewUrl } from "@/utils/rawPrefix";

/** 图片渲染器承接的文件扩展名（svg 为文本格式，亦按图片处理：以 `<img src>` 引用） */
export const IMAGE_EXTENSIONS = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".svg",
    ".bmp",
    ".ico",
    ".avif",
];

/**
 * 图片渲染器（ADR-0008 及其修订）：图片文件视图渲染为 `<img src="最终URL">`。
 *
 * 内置格式自动判定已随选择链修订移除——本渲染器现为**可选注册**的内置渲染器：
 * 显式加入 `options.renderers` 后按 `test()`（图片扩展名）探测生效。
 *
 * 忽略响应体（不做字节解析）；仍经 fetch 校验存在性（404 走加载错误）。
 * src 取插值 + base 前缀 + 剥除 `!` 前缀后的最终视图 URL（options.url）。
 */
export class AutoSparkImageViewRenderer extends AutoSparkRouterViewRendererBase {
    test(_response: Response, matched: AutoSparkMatchedRouteItem) {
        const url = getDeclaredViewUrl(matched);
        if (!url) return false;
        const pathname = url.split("?")[0].split("#")[0].toLowerCase();
        return IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
    }

    async render(
        response: Response,
        _matched: AutoSparkMatchedRouteItem,
        options: ViewRenderOptions,
    ): Promise<ViewRenderResult> {
        const src = options.url || response.url;
        const escaped = src
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;");
        return { value: `<img class="autospark-image-view" src="${escaped}" alt="">` };
    }
}
