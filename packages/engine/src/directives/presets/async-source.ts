/**
 * 异步源家族的纯函数层（ADR-0033 / 0035）：值形态判定、url 插值表达式构造、
 * action 引用解析、响应映射（对象-only + path 提取——x-data 物种专用）。
 *
 * 家族两物种共用同一套骨架（`AsyncSourceRunner` 取数执行器），物种差异集中在
 * **值形态判定**（x-data 的值是数据声明；x-html 的值本就是表达式）与**响应消费**
 * （对象落域 vs text 注入）。
 *
 * 编排（元状态 / x-fallback / x-loading 合成）在物种指令内——它们依赖容器 /
 * attachedKeys / 渲染通道等私有状态；本模块只承载可独立复用的判定与变换
 * （compiler 的 x-fallback 剪枝 transformer、data.ts / html.ts 均消费本层）。
 */
import { getVal } from "autostore";

/** x-data 值的三种形态（ADR-0033 决策 1） */
export type DataForm = "literal" | "url" | "action";

/**
 * x-data 值形态三分发（ADR-0033 决策 1）：
 *
 * - `literal`：空串或 `{` 开头（对象字面量，走既有 relaxed-json / 数据脚本管道）；
 * - `url`：`/`、`//`、`http://`、`https://`、`./`、`../` 开头（fetch 取数）；
 * - `action`：`标识符` 或 `标识符(实参)`（getAction 链执行取数）；
 * - 其余归 `literal`——维持现状姿态（parse 失败 warn + 空对象）。
 *
 * **裸词相对 url 不支持**（`api/books` 与 action 名不可判定）——相对路径须 `./` 前缀。
 */
export function detectDataForm(raw: string): DataForm {
    const t = raw.trim();
    if (t === "" || t.startsWith("{")) return "literal";
    if (/^(?:https?:\/\/|\/\/|\/|\.\/|\.\.\/)/.test(t)) return "url";
    if (/^[\w$]+\s*(?:\([\s\S]*\))?$/.test(t)) return "action";
    return "literal";
}

/** x-data 值是否为异步形态（url / action）——compiler 剪枝 transformer 与 data.ts 共用 */
export function isAsyncDataValue(raw: string): boolean {
    const form = detectDataForm(raw);
    return form === "url" || form === "action";
}

/**
 * x-html 值是否为异步形态（ADR-0035 决策 1）——compiler 剪枝 transformer 与 html.ts 共用。
 *
 * 与 x-data 判定的关键差异：**action 形态必须带调用括号**（`loadPartial(lang)` /
 * `loadPartial()`）——x-html 的值本就是表达式，裸词（`x-html="content"`）是读状态键的
 * 最常见用法、不可劫持；而带括号的单段标识符调用在表达式通道本就失败（with 求值视图
 * 不展开 scope.actions），改走 action 链是零破坏的语义升级。多段 / 链式调用
 * （`Math.ceil(x)`、`s.trim()`）含 `.` 不匹配，保持表达式。
 */
export function isAsyncHtmlValue(raw: string): boolean {
    const t = raw.trim();
    if (t === "" || t.startsWith("{")) return false;
    if (/^(?:https?:\/\/|\/\/|\/|\.\/|\.\.\/)/.test(t)) return true;
    return /^[\w$]+\s*\([\s\S]*\)$/.test(t);
}

/**
 * 取元素的指令属性值（含修饰符变体）：`x-html` 与 `x-html.compile` 均命中。
 *
 * x-fallback 剪枝 transformer 消费——宿主判定（异步 x-data / 异步 x-html）须兼容
 * 修饰符形态（`x-html.compile="url"` / `x-data.global="/api/x"`）。
 */
export function getDirectiveAttrValue(el: HTMLElement, name: string): string | null {
    for (const attr of el.getAttributeNames()) {
        if (attr === name || attr.startsWith(name + ".")) return el.getAttribute(attr);
    }
    return null;
}

/**
 * url 插值 → watch 表达式：`'/api/books?order={book.order}'` 转为模板字面量
 *
 * ```ts
 * "`/api/books?order=${encodeURIComponent(book.order)}`"
 * ```
 *
 * - 单花括号 `{expr}`（RFC 6570 URI Template 同构），与模板 mustache `{{}}`（渲染到 DOM）分区；
 * - 求值于宿主聚合视图（scope.watch 表达式支路，依赖自动收集）；
 * - 插值段值默认 `encodeURIComponent`（决策 5）；URL 其余部分原样。
 */
export function buildUrlWatchExpr(raw: string): string {
    return (
        "`" +
        raw.replace(/\{([^{}]+)\}/g, (_, expr: string) => `\${encodeURIComponent(${expr.trim()})}`) +
        "`"
    );
}

/**
 * action 引用解析：`loadBooks` / `loadBooks(1, order)` → `{ name, argsExpr }`。
 *
 * 实参为**表达式**（多实参逗号分隔，经 `[(exprs)]` 数组字面量 watch——依赖变化对称重执行，ADR-0033 决策 6）。
 */
export function parseActionRef(raw: string): { name: string; argsExpr: string | null } {
    const m = /^([\w$]+)\s*(?:\(([\s\S]*)\))?$/.exec(raw.trim());
    if (!m) return { name: raw.trim(), argsExpr: null };
    const args = m[2] !== undefined && m[2].trim() !== "" ? m[2] : null;
    return { name: m[1]!, argsExpr: args };
}

/**
 * 响应映射（ADR-0033 决策 2，**x-data 物种专用**）：对象-only + `path` 提取。
 *
 * - `path` 选项（字符串）经 `getVal` 从响应结构下钻提取子对象；
 * - 最终值非对象（裸数组 / 标量 / null / undefined，含提取失败）→ 错误（与加载失败同级姿态）；
 * - 纯函数：错误以值返回，日志与 $error 落地由调用方（DataDirective.arrive）执行。
 *
 * x-html 物种不消费本函数——text-only（`res.text()` 直取，action 返回非字符串按
 * 加载失败处理，ADR-0035 决策 2）。
 */
export function mapResponse(
    result: unknown,
    path: unknown,
): { ok: true; data: Record<string, any> } | { ok: false; error: Error } {
    let value = result;
    const pathStr = typeof path === "string" ? path.trim() : "";
    if (pathStr !== "") {
        try {
            value = getVal(result as any, pathStr);
        } catch {
            value = undefined; // 提取路径断裂（中间非对象等）→ 按非对象姿态
        }
    }
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        const shape = Array.isArray(value) ? "array" : value === null ? "null" : typeof value;
        return {
            ok: false,
            error: new TypeError(
                `异步结果须为对象${pathStr !== "" ? `（path "${pathStr}" 提取后）` : ""}，实际得到 ${shape}`,
            ),
        };
    }
    return { ok: true, data: value as Record<string, any> };
}
