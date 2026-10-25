/**
 * 插值（Mustache `{{ }}`）解析与表达式合成
 *
 * `{{ expr }}` 覆盖**文本节点**与**属性值**两个表面。本模块仅提供纯函数：
 * - 把文本解析为「字面量段 / 表达式段」序列；
 * - 属性值合成（整体单段透传原值 / 混合段 concat + nullish 强转）；
 * - raw-text 元素判定（SCRIPT/STYLE 不插值）。
 *
 * 反应式由 compiler 经 `scope.watch` 接入（复用 `watchExpression` + `collectDependencies`），
 * 本模块不涉及订阅。见 ADR-0004。
 */
export type LiteralSegment = {
    literal: string;
};
export type ExprSegment = {
    expr: string;
};
export type Segment = LiteralSegment | ExprSegment;
/** 文本是否含 `{{ }}`（供 filter/门控探测，安全可重复调用） */
export declare function hasMustache(text: string | null | undefined): boolean;
/**
 * 解析插值文本为段序列。
 *
 * - 纯字面量（无 `{{}}`）→ 返回 `null`（调用方按整段字面量处理）；
 * - 否则返回段数组：字面量段保留原始文本，表达式段去两端空白；
 * - `{{}}` / `{{ }}`（空表达式）→ 保留原始字面量（不作为表达式段，避免求值空串）。
 *
 * @returns 段数组（至少含一个表达式段）；无插值返回 null
 */
export declare function parseInterpolation(text: string): Segment[] | null;
/**
 * 合成属性插值表达式（desugar-to-x-bind）。
 *
 * - **整体单段**（整个值恰为单个 `{{E}}`，无字面量）→ 返回原始 `E`。
 *   透传原值让 `BindDirective` 类型分派拿到**原生值**：boolean 拿 bool、class 拿对象/数组、
 *   property 拿原生类型——规避 `disabled="{{flag}}"` 在 `false` 时合成字符串 `"false"` 恒真、
 *   照样禁用的 HTML boolean 坑（见 ADR-0004 决策 10）。
 * - **混合段**（字面量 + ≥1 表达式）→ concat，每表达式段 nullish→`''` 强转 `(E==null?"":E)`，
 *   靠 `+` 隐式 stringify；字面量段用 `JSON.stringify` 包裹（安全转义引号/反斜杠）。
 *
 * 表达式段 `E` 被求值两次（三元两处）——`collectDependencies` 按路径去重，无重复订阅，
 * 表达式假定无副作用。
 */
export declare function synthAttrExpr(value: string): string;
/** 元素是否为 raw-text 元素（其文本不插值） */
export declare function isRawTextElement(el: Element | null | undefined): boolean;
