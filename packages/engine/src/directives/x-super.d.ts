import { AutoSparkDirectiveBase } from "../features/directive/base";
/**
 * x-super：插槽 fallback 展开标记（ADR-0084）。
 *
 * 引擎首个**元素名形态**指令（`static elementName = "x-super"`，无属性形态）：
 * 出现在插槽内容内任意深度时，把**本段所覆盖出口的最终生效 fallback**（含继承覆盖层，
 * ADR-0081 三层链）展开进标记元素内部——标记元素保留为包裹层（与出口标记对称，
 * `x-super { display: contents; }` 可消布局影响）。
 *
 * - 语义恒**自引用无名**（header 内容内的标记 = header 出口的 fallback，不跨段）；
 * - 多次出现**各自独立编译展开**（独立 watcher，响应式语义与单份一致）；
 * - 展开的 fallback 恒**组件作用域**求值、不接收作用域形参（与形参正交并存）；
 * - 两级缺席（ADR-0084 决策二）：插槽内容之外（句柄缺席）→ warn + 空壳保留；
 *   出口无 fallback 子树 → 静默展开为空；
 * - 未闭合误写防御：HTML 解析器不认未知元素自闭合（`<x-super/>` 斜杠被忽略、吞后续
 *   兄弟节点），标记带子节点 → warn + 子节点不编译不进 DOM（ownsChildren 拦截）。
 *
 * 句柄经 SlotDirective 编译内容时注入内容 scope（compiler.compileSlotNodes 的
 * extraConfigure），沿 scope 链就近查找（组件实例边界已遮蔽——instantiateComponent/
 * Detached 置 null，嵌套组件模板内的 x-super 不穿透外层句柄、归各自出口解析）。
 */
export declare class SuperDirective extends AutoSparkDirectiveBase {
    /** 元素名形态（ADR-0084 首例）：元素名即触发（`<x-super></x-super>`），无属性形态 */
    static readonly elementName = "x-super";
    static readonly singleton = true;
    /** 标记子树 = 未闭合误写防御位（合法标记恒空）——不进通用 walk，compile 期 warn */
    static ownsChildren(): boolean;
    /** 命中的 super 句柄（null = 插槽内容之外，两级缺席之一：warn + 空壳保留） */
    private inlet;
    /** 本次展开的 fallback scopes（parent=出口 binding 级联；本 destroy 兜底调用方先亡场景） */
    private fallbackScopes;
    created(): void;
    compile(): void;
    destroy(): void;
}
