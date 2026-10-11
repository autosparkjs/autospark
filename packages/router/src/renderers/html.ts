import type { KylinMatchedRouteItem } from "@/types/routes";
import { KylinRouterViewRendererBase, type ViewRenderResult } from "./base";
import type { ViewRenderOptions } from "./types";
import { scopeStyles } from "@/utils/scopeStyle";

export class KylinRouterHTMLViewRenderer extends KylinRouterViewRendererBase {
    test(_response: Response, _matched: KylinMatchedRouteItem) {
        return true;
    }
    /**
     *
     * @param response
     */
    async render(
        response: Response,
        matched: KylinMatchedRouteItem,
        options: ViewRenderOptions,
    ): Promise<ViewRenderResult> {
        const html = await response.text();
        const { selector, scopedStyle, hash } = options;
        const renderResult: ViewRenderResult = { value: html.trim() };

        try {
            // 步骤 1: 解析 HTML 文档 - 使用全局 DOMParser 构造函数
            // @ts-ignore - 使用全局 DOMParser
            const doc = new DOMParser().parseFromString(html, "text/html");
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
            // 应用样式隔离（默认启用）
            if (scopedStyle !== false) {
                const result = scopeStyles(renderResult.value, hash);
                renderResult.value = result.html;
                // 将 scopeId 和 v-bind 变量保存到 signal.meta
                renderResult.meta = { vBindVars: result.vBindVars };
            }
        } catch (e: any) {
            this.router.logger.error(`视图内容提取失败: ${e.message}`);
        }
        return renderResult;
    }

    /**
     * 智能内容提取 - 从 HTML 中提取有效内容
     *
     * 支持多种内容提取策略，按优先级依次处理：
     * 1. **自定义选择器提取**：使用 `selector` 选项动态选择特定元素
     * 2. **完整 HTML 文档提取**：自动识别并提取 `<body>` 内容
     * 3. **data-outlet 元素提取**：识别并提取带 `data-outlet` 属性的元素内容
     *
     * ### 动态选择器
     *
     * 选择器支持参数插值，使用 `{key}` 语法访问路由参数：
     *
     * ```typescript
     * // 示例 1: 路径参数
     * selector = "[data-user-id={id}]"
     // matched.params = { id: "123" }
     * // 实际查询: "[data-user-id=123]"
     *
     * // 示例 2: 查询参数
     * selector = "[data-category={category}]"
     // matched.query = { category: "products" }
     * // 实际查询: "[data-category=products]"
     *
     * // 示例 3: 组合使用
     * selector = "#user-{id}-profile"
     // matched.params = { id: "123" }
     * // 实际查询: "#user-123-profile"
     * ```
     *
     * ### 提取逻辑
     *
     * 1. **HTML 解析**：使用 DOMParser 解析 HTML 字符串为文档对象
     * 2. **参数插值**：将选择器中的 `{key}` 占位符替换为实际参数值
     * 3. **元素选择**：使用解析后的选择器查询目标元素
     * 4. **内容提取**：返回选定元素的 innerHTML
     * 5. **样式隔离**：应用 scopedStyle 进行样式隔离（可选）
     * 6. **安全清理**：根据 allowUnsafe 选项清理不安全内容（可选）
     *
     * ### 选项说明
     *
     * - **selector** (string, 默认: "body"): CSS 选择器，支持参数插值
     * - **allowUnsafe** (boolean): 是否保留不安全的 HTML（如 `<script>` 标签）
     * - **scopedStyle** (boolean): 是否应用样式隔离，默认启用
     *
     * @param html - 原始 HTML 字符串
     * @param options - 视图选项，包含 selector、allowUnsafe、scopedStyle 等
     * @param signal - 异步信号，用于存储元数据（如 hash、vBindVars）
     * @param matched - 匹配的路由项，提供 params、query、state 等参数用于插值
     * @returns 提取并处理后的 HTML 字符串
     */
}
