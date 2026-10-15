import type { AutoSparkMatchedRouteItem } from "@/types/routes";
import { AutoSparkRouterViewRendererBase, type ViewRenderResult } from "./base";
import type { ViewRenderOptions } from "./types";
import { getDeclaredViewUrl } from "@/utils/rawPrefix";

/** JSON 渲染器承接的文件扩展名 */
const JSON_EXTENSIONS = [".json"];

/**
 * JSON 渲染器（ADR-0008 及其修订）：`.json` 视图渲染为 `<pre>` 内 pretty-print 文本。
 *
 * 内置格式自动判定已随选择链修订移除——本渲染器现为**可选注册**的内置渲染器：
 * 显式加入 `options.renderers` 后按 `test()`（`.json` 扩展名）探测生效。
 *
 * 零依赖（2 格缩进 + HTML 转义）；解析失败按渲染失败处理（返回 error），
 * 交由渲染降级链（模板 → raw）处置。
 */
export class AutoSparkJsonViewRenderer extends AutoSparkRouterViewRendererBase {
    test(_response: Response, matched: AutoSparkMatchedRouteItem) {
        const url = getDeclaredViewUrl(matched);
        if (!url) return false;
        const pathname = url.split("?")[0].split("#")[0].toLowerCase();
        return JSON_EXTENSIONS.some((ext) => pathname.endsWith(ext));
    }

    async render(
        response: Response,
        _matched: AutoSparkMatchedRouteItem,
        _options: ViewRenderOptions,
    ): Promise<ViewRenderResult> {
        const text = await response.text();
        let parsed: any;
        try {
            parsed = JSON.parse(text);
        } catch (e: any) {
            // 解析失败按渲染失败处理（error 优先于 value），交由渲染降级链处置
            return { value: text, error: new Error(`JSON 视图解析失败: ${e.message}`) };
        }
        const pretty = JSON.stringify(parsed, null, 2);
        const escaped = pretty
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        return { value: `<pre class="autospark-json-view">${escaped}</pre>` };
    }
}
