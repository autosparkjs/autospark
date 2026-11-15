import type { ComponentDef } from "./component-def";

/**
 * 裸布尔属性 coerce（ADR-0117 2026-11-14 修订）：props 空值在注入点的布尔归一。
 *
 * HTML 布尔属性惯例（`<input disabled>` 存在即开启）在 DOM 层 attr.value 恒为 ""——
 * 裸属性与 `=""` 两形态不可区分，静态折叠层（inferStaticPropValue）原样保留空串。
 * 本函数在注入/更新收口处把**声明侧类型为 boolean 的键**的空串归一为 true：
 *
 * - 类型源（并集，无优先级——同键两处类型相异属组件作者错误，不设仲裁）：
 *   `def.defaults`（ADR-0092）值为 boolean 的键，或实例 data 域当前值为 boolean 的键
 *   （首注入时 data 域即 data() 求值初始值、props 尚未覆盖；更新流时为历史赋值产物——
 *   boolean 键的赋值历史恒为 boolean，判定稳定）；
 * - 仅空串触发：`"0"` / `"no"` 等其他假值字符串维持原样（不引入 HTML 属性枚举语义）；
 * - 非 boolean 键维持 ""——空串 props 通道完整保留（`label=""` 不受害）；
 * - 三通道统一（元素名静态折叠 / x-component-options.props / 值通道求值产物）：
 *   注入层无从区分空串来源（静态折叠、字面量与表达式求值产物同为 ""），对 boolean
 *   契约而言空串本就无意义值，统一归一（KISS，取舍见 ADR-0117 修订条目）；
 * - 不改入参，返回归一副本（无空串的快速路径原样返回同一引用）。
 */
export function coerceBareBooleanProps(
    def: ComponentDef,
    data: Record<string, any>,
    props: Record<string, any>,
): Record<string, any> {
    let hasEmpty = false;
    for (const key in props) {
        if (props[key] === "") {
            hasEmpty = true;
            break;
        }
    }
    if (!hasEmpty) return props;
    const coerced = { ...props };
    for (const key in coerced) {
        if (coerced[key] !== "") continue;
        const declared = def.defaults?.[key];
        if (declared === true || declared === false || data[key] === true || data[key] === false) {
            coerced[key] = true;
        }
    }
    return coerced;
}
