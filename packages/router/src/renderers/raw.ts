import type { AutoSparkMatchedRouteItem } from "@/types/routes";
import { AutoSparkRouterViewRendererBase, type ViewRenderResult } from "./base";
import type { ViewRenderOptions } from "./types";
import { getDeclaredViewUrl, hasRawPrefix } from "@/utils/rawPrefix";

/**
 * raw 渲染器（ADR-0008 及其修订）：零加工，响应体原样字符串输出。
 *
 * 两条触发路径：
 * - 视图 URL 带 `!` 前缀（如 `!/path/page.html`）——强制 raw 渲染，最高优先级，
 *   在选择链第 0 级直接选中（fetch 前前缀已剥除）；
 * - 渲染降级链的末站——任何渲染器加工失败且模板渲染也失败时，原样兜底输出。
 *
 * 产物带 `meta.raw = true`，经渲染层贯通至出口数据域：raw 视图由 outlet 以普通
 * `x-html` 直接 innerHTML 挂载，不经 engine 编译（性能动机，非安全隔离）。
 */
export class AutoSparkRawViewRenderer extends AutoSparkRouterViewRendererBase {
    test(_response: Response, matched: AutoSparkMatchedRouteItem) {
        return hasRawPrefix(getDeclaredViewUrl(matched) ?? "");
    }

    async render(
        response: Response,
        _matched: AutoSparkMatchedRouteItem,
        _options: ViewRenderOptions,
    ): Promise<ViewRenderResult> {
        const text = await response.text();
        return { value: text, meta: { raw: true } };
    }
}
