/**
 * props 字面量键的合法形态化：裸标识符原样、其余（含连字符等非法字符）JSON.stringify
 * 引号化。引擎值解析对「引号键 + 表达式值」组合的成员求值会静默丢弃——表达式值成员
 * 必须裸键（button 实测 { "checkValues": (cv) } 丢、{ checkValues: (cv) } 注入成功）。
 */
export function propKey(name: string): string {
    return /^[A-Za-z_$][\w$]*$/.test(name) ? name : JSON.stringify(name);
}
