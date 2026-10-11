/**
 * 参数解析工具
 *
 * 提供路径参数和查询参数的解析功能：
 * - parsePathParams: 解析路径中的动态参数
 * - extractQueryParams: 提取 URL 查询参数
 * - compilePathPattern: 编译路径模式为正则表达式
 *
 * 按照 CONTEXT.md 决策 D-02、D-06 实现参数解析策略：
 * - D-02: 同时支持 :param 和 <param> 语法
 * - D-06: 支持路由级参数验证，正则约束（如 /user/:id(\d+)）
 */

/**
 * 编译路径模式为正则表达式
 *
 * 将 :param 和 <param> 转换为捕获组
 * 支持正则约束：:param(regex) 或 <param(regex)>
 *
 * @param pattern - 路由模式字符串
 * @returns 编译后的正则表达式和参数名列表
 */
export function compilePathPattern(pattern: string): { regex: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];
    const segments = pattern.split("/").filter(Boolean);
    const regexParts: string[] = [];

    for (const segment of segments) {
        if (segment === "*") {
            regexParts.push(".*");
            continue;
        }

        // 冒号语法: :name 或 :name(regex)
        const colonMatch = segment.match(/^:(\w+)(?:\((.+)\))?$/);
        if (colonMatch) {
            paramNames.push(colonMatch[1]);
            regexParts.push(`(${colonMatch[2] || "[^/]+"})`);
            continue;
        }

        // 尖括号语法: <name> 或 <name(regex)>
        const angleMatch = segment.match(/^<(\w+)(?:\((.+)\))?>$/);
        if (angleMatch) {
            paramNames.push(angleMatch[1]);
            regexParts.push(`(${angleMatch[2] || "[^/]+"})`);
            continue;
        }

        // 静态段 - 转义正则特殊字符并转为小写
        regexParts.push(segment.toLowerCase().replace(/[.+^${}()|[\]\\]/g, "\\$&"));
    }

    const regexBody = regexParts.map((p) => "/" + p).join("");
    return {
        regex: new RegExp(`^${regexBody}/?$`, "i"),
        paramNames,
    };
}

/**
 * 解析路径参数
 *
 * 从实际 URL 路径中根据路由模式提取动态参数
 *
 * @param pattern - 路由模式，如 /user/:id
 * @param pathname - 实际路径，如 /user/123
 * @returns 参数对象，如 { id: '123' }；不匹配时返回空对象
 */
export function parsePathParams(pattern: string, pathname: string): Record<string, string> {
    const { regex, paramNames } = compilePathPattern(pattern);

    // 规范化 pathname（移除末尾斜杠）
    const normalized = pathname.replace(/\/+$/, "") || "/";
    const match = normalized.match(regex);

    if (!match) {
        return {};
    }

    const params: Record<string, string> = {};
    paramNames.forEach((name, index) => {
        const value = match[index + 1];
        if (value !== undefined) {
            params[name] = value;
        }
    });

    return params;
}
