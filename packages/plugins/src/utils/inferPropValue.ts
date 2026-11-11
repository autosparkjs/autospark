/**
 * 静态属性值的类型推断（对齐引擎元素名形态 ADR-0117 的推断规则）：
 * 数字 / true / false / 宽松 JSON（失败回退原串）/ 原样字符串。
 */
export function inferPropValue(raw: string): unknown {
    const v = raw.trim();
    if (v === "") return "";
    if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    if (v === "true") return true;
    if (v === "false") return false;
    if (v.startsWith("{") || v.startsWith("[")) {
        try {
            return JSON.parse(v);
        } catch {
            return raw;
        }
    }
    return raw;
}
