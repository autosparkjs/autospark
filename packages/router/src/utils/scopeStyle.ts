/**
 * Scoped CSS 样式隔离工具
 *
 * 功能：
 * - 解析 HTML 中的 <style> 标签
 * - 识别 scoped / global 属性
 * - 为 scoped 样式添加 #hash 前缀
 * - 将所有 <style> 标签移到 HTML 内容最后
 *
 * 历史注记：v-bind(expr) → CSS 变量的转换已随 Alpine 桥退役（ADR-0002）——
 * CSS 变量的响应式写入请改用 engine 的 :style / x-bind 指令。
 *
 * @module utils/scopeStyle
 */

export interface ScopeStyleResult {
    /** 转换后的 HTML */
    html: string;
}

/**
 * 检查选择器是否为根级选择器（不应被 scoped）
 */
function isRootSelector(selector: string): boolean {
    const trimmed = selector.trim();
    return /^(html|body|:root)(?:\[|\s|\.|#|:|$)/.test(trimmed);
}

/**
 * 转换 CSS 选择器，添加 scope 前缀
 * @param selector - 原始选择器
 * @param scopeId - scope ID
 * @returns 转换后的选择器
 */
function transformSelector(selector: string, scopeId: string): string {
    // 根级选择器保持不变
    if (isRootSelector(selector)) {
        return selector;
    }

    // 处理逗号分隔的选择器列表
    const selectors = selector.split(",").map((s) => s.trim());

    return selectors
        .map((s) => {
            if (isRootSelector(s)) return s;
            // 添加 scope 属性选择器前缀
            return `#${scopeId} ${s}`;
        })
        .join(", ");
}

/**
 * 转换 CSS 规则
 * @param css - CSS 规则文本
 * @param scopeId - scope ID
 * @param isScoped - 是否为 scoped 样式
 * @returns 转换后的 CSS
 */
function transformCSS(css: string, scopeId: string, isScoped: boolean): string {
    // global 样式不做转换
    if (!isScoped) {
        return css;
    }

    // 按 } 分割规则，保留 }
    const rules = css.split("}");
    const transformed: string[] = [];

    for (let i = 0; i < rules.length; i++) {
        const rule = rules[i].trim();
        if (!rule) continue;

        const braceIndex = rule.lastIndexOf("{");
        if (braceIndex === -1) {
            // 没有 { 的部分（如 @media 等），直接添加
            transformed.push(rule);
            if (i < rules.length - 1) transformed.push("}");
            continue;
        }

        const selector = rule.slice(0, braceIndex).trim();
        const declarations = rule.slice(braceIndex + 1).trim();

        // 转换选择器
        const transformedSelector = transformSelector(selector, scopeId);

        transformed.push(`${transformedSelector} { ${declarations} }`);
    }

    return transformed.join(" ");
}

/**
 * 处理 HTML 中的样式
 * @param html - 原始 HTML
 * @param scopeId - scope ID
 * @returns 处理结果
 */
export function scopeStyles(html: string, scopeId: string): ScopeStyleResult {
    // 匹配所有 <style> 标签
    const styleRegex = /<style(\s+[^>]*)?>([\s\S]*?)<\/style>/gi;
    const styles: Array<{ content: string; attrs: string; isScoped: boolean; isGlobal: boolean }> =
        [];
    let htmlWithoutStyles = html;

    // 提取所有 style 标签
    let match: RegExpExecArray | null;
    while ((match = styleRegex.exec(html)) !== null) {
        const fullMatch = match[0];
        const attrs = match[1] || "";
        const content = match[2];

        // 检查是否为 global
        const isGlobal = /\bglobal\b/.test(attrs);
        // 检查是否显式声明 scoped
        const hasScopedAttr = /\bscoped\b/.test(attrs);
        // 默认为 scoped（除非显式声明 global）
        const isScoped = !isGlobal && (hasScopedAttr || true);

        styles.push({ content, attrs, isScoped, isGlobal });

        // 从 HTML 中移除 style 标签
        htmlWithoutStyles = htmlWithoutStyles.replace(fullMatch, "");
    }

    // 转换样式
    const transformedStyles = styles.map(({ content, attrs, isScoped }) => {
        const transformedContent = transformCSS(content, scopeId, isScoped);

        // 移除 scoped 属性（已应用），保留 global 属性（用于标识）
        const cleanedAttrs = attrs
            .replace(/\bscoped\b/g, "")
            .replace(/\s+/g, " ")
            .trim();

        return `<style ${cleanedAttrs}>${transformedContent}</style>`;
    });

    // 将转换后的 style 标签添加到 HTML 最后
    const result = htmlWithoutStyles + transformedStyles.join("");

    return {
        html: result,
    };
}
