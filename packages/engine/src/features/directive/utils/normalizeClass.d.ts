/**
 * 将任意 class 绑定值规范化为类名 token 集合。
 *
 * 供 `x-bind:class`（及 `x-class` / `:class` 别名）使用。整值表达式求值后，结果可能是：
 *
 * - **字符串**：按空白拆分为多个类名（`className` 本就是空格分隔语义），
 *   如 `"btn primary"` → `{btn, primary}`
 * - **对象**：键为类名、值为 truthy 时应用该键（多条件开关场景），
 *   如 `{active: isActive, disabled: isDisabled}`；值判定为 **truthy**，非严格 `=== true`
 * - **数组**：逐项递归归一并集（Vue 数组语法，ADR-0043 数组扩展）——项可为字符串 /
 *   对象 / 嵌套数组混排，`falsy` 项跳过（`[cond && 'on', 'btn']` 条件类惯用法）
 * - **数字**：`toString` 作为单个类名，如 `7` → `{7}`
 * - **falsy**（`null` / `undefined` / `false` / `true` / `""`）：产出空集合
 *   （boolean 不作类名）
 *
 * 作为纯函数独立于指令，便于 `x-bind:class` 与潜在独立 ClassDirective 共用（DRY）。
 *
 * @param value 表达式求值结果（任意类型）
 * @returns     类名 token 集合（去重）
 */
export declare function normalizeClass(value: any): Set<string>;
