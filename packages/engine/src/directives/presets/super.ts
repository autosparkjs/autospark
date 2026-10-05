import { AutoSparkDirectiveBase } from "../base";
import type { AutoSparkScope } from "../../scope";
import type { SuperInlet } from "../../utils/slot";

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
export class SuperDirective extends AutoSparkDirectiveBase {
    /** 元素名形态（ADR-0084 首例）：元素名即触发（`<x-super></x-super>`），无属性形态 */
    static override readonly elementName = "x-super";
    static override readonly singleton = true;
    /** 标记子树 = 未闭合误写防御位（合法标记恒空）——不进通用 walk，compile 期 warn */
    static override ownsChildren(): boolean {
        return true;
    }

    /** 命中的 super 句柄（null = 插槽内容之外，两级缺席之一：warn + 空壳保留） */
    private inlet: SuperInlet | null = null;
    /** 本次展开的 fallback scopes（parent=出口 binding 级联；本 destroy 兜底调用方先亡场景） */
    private fallbackScopes: AutoSparkScope[] = [];

    override created(): void {
        this.inlet = this.binding.findSuperInlet();
    }

    override compile(): void {
        const tpl = this.template;
        if (tpl) {
            // 未闭合误写防御：合法标记恒空；子节点存在 = `<x-super>xxx` 未闭合形态
            //（ownsChildren 已拦截不编译不进 DOM），warn 指引双标签写法
            const source = tpl instanceof HTMLTemplateElement ? tpl.content : tpl;
            if (source.childNodes.length > 0) {
                this.engine.logger.warn(
                    `x-super: 标记应为双标签空元素写法（<x-super></x-super>），其子节点已忽略（HTML 解析器不认未知元素自闭合，ADR-0084）`,
                );
            }
        }
        if (!this.inlet) {
            // 两级缺席之一：位置错——插槽内容之外（fallback 内 / 普通模板），保留空壳
            this.engine.logger.warn(
                `x-super: 仅在插槽内容内生效（此处无 super 句柄），标记保留为空元素（ADR-0084）`,
            );
            return;
        }
        const { nodes, scopes } = this.inlet();
        this.fallbackScopes = scopes;
        for (const n of nodes) this.el.appendChild(n);
    }

    override destroy(): void {
        // 级联兜底：出口（parent 链根）先亡时 scope.destroyed 幂等 no-op；调用方先亡
        //（内容投影随 caller 销毁、出口仍活）时由此显式回收，防僵尸 watcher
        for (const s of this.fallbackScopes) s.destroy();
        this.fallbackScopes = [];
        this.inlet = null;
    }
}
