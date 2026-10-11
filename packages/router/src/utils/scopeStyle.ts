/**
 * Scoped CSS 样式隔离工具
 *
 * 功能：
 * - 解析 HTML 中的 <style> 标签
 * - 识别 scoped / global 属性
 * - 为 scoped 样式添加 #hash 前缀
 * - 解析 v-bind(dataProperty) 并转换为 CSS 变量
 * - 将所有 <style> 标签移到 HTML 内容最后
 *
 * @module utils/scopeStyle
 */

export interface ScopeStyleResult {
    /** 转换后的 HTML */
    html: string;
    /** 收集的 v-bind 变量名 */
    vBindVars: string[];
}

/**
 * 驼峰命名转短横命名
 * @example titleColor -> title-color
 * @example theme.primaryColor -> theme.primary-color
 */
function camelToKebab(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
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
 * 解析 v-bind 表达式，提取变量名
 * @param expression - v-bind 表达式，如 "titleColor" 或 "theme.primary"
 * @returns 变量名
 */
function parseVBindExpression(expression: string): string {
    // 移除可能的空格和引号
    const cleaned = expression.trim().replace(/^['"]|['"]$/g, "");
    return cleaned;
}

/**
 * 转换 v-bind 为 CSS var()
 * @param value - CSS 属性值
 * @param vBindVars - 收集 v-bind 变量的数组
 * @returns 转换后的值
 */
function transformVBind(value: string, vBindVars: string[]): string {
    // 匹配 v-bind(xxx) 或 v-bind(xxx, defaultValue)
    const vBindRegex = /v-bind\s*\(\s*([^),]+)(?:\s*,\s*([^)]+))?\s*\)/g;

    return value.replace(vBindRegex, (_, varExpr, defaultValue) => {
        const varName = parseVBindExpression(varExpr);
        vBindVars.push(varName);

        // 转换为短横命名
        const cssVarName = `--${camelToKebab(varName)}`;
        return defaultValue ? `var(${cssVarName}, ${defaultValue.trim()})` : `var(${cssVarName})`;
    });
}

/**
 * 转换 CSS 规则
 * @param css - CSS 规则文本
 * @param scopeId - scope ID
 * @param isScoped - 是否为 scoped 样式
 * @param vBindVars - 收集 v-bind 变量的数组
 * @returns 转换后的 CSS
 */
function transformCSS(
    css: string,
    scopeId: string,
    isScoped: boolean,
    vBindVars: string[],
): string {
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

        // 转换 v-bind
        const transformedDeclarations = transformVBind(declarations, vBindVars);

        transformed.push(`${transformedSelector} { ${transformedDeclarations} }`);
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
    const vBindVars: string[] = [];

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
    const transformedStyles = styles.map(({ content, attrs, isScoped, isGlobal }) => {
        const transformedContent = transformCSS(content, scopeId, isScoped, vBindVars);

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
        vBindVars: [...new Set(vBindVars)], // 去重
    };
}
