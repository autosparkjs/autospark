import type { AutoSparkMatchedRouteItem } from "@/types/routes";
import { AutoSparkRouterViewRendererBase, type ViewRenderResult } from "./base";
import type { ViewRenderOptions } from "./types";
import { transformXOutlet } from "@/engine/xOutlet";

/**
 * 模板渲染器（ADR-0008）：`.html` / `.htm` 及其余一切格式的内置默认渲染器。
 *
 * 产物交 engine `x-html.compile` 编译激活——全响应式。
 * `test()` 恒真：既是内置格式链的末位兜底，也是渲染降级链（渲染失败 → 模板 → raw）的中间站。
 */
export class AutoSparkTemplateViewRenderer extends AutoSparkRouterViewRendererBase {
    test(_response: Response, _matched: AutoSparkMatchedRouteItem) {
        return true;
    }
    async render(
        response: Response,
        matched: AutoSparkMatchedRouteItem,
        options: ViewRenderOptions,
    ): Promise<ViewRenderResult> {
        const html = await response.text();
        const { selector } = options;
        const renderResult: ViewRenderResult = { value: html.trim() };

        try {
            // 步骤 1: 解析 HTML 文档 - 使用全局 DOMParser 构造函数
            // @ts-ignore - 使用全局 DOMParser
            const doc = new DOMParser().parseFromString(html, "text/html");
            // 步骤 2: x-outlet 简写预处理（编译前改写为 x-component:autospark.outlet，
            // 远程模板中的嵌套出口声明在此激活）
            transformXOutlet(doc);
            // 产物从改写后的 doc 序列化（原实现取原始字符串，简写改写会丢失）
            renderResult.value = doc.body.innerHTML.trim();
            // 步骤 3: 如果提供了自定义选择器，使用它
            if (typeof selector === "string" && selector.length > 0) {
                try {
                    const element = doc.querySelector(
                        selector.params({
                            ...matched.params,
                            ...matched.query,
                            ...matched.state,
                        }),
                    );
                    if (element) {
                        renderResult.value = element.innerHTML;
                    }
                } catch (e: any) {
                    this.router.logger.warn(`Invalid selector: ${selector}, ${e.message}`);
                }
            }
            // 样式不做 router 侧改写：<style> 原样保留，经 x-html.compile 挂载后
            // 由 engine 编译通路（innerHTML 注入）文档级生效
        } catch (e: any) {
            this.router.logger.error(`视图内容提取失败: ${e.message}`);
        }
        return renderResult;
    }
}
