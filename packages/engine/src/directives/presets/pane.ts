import { AutoSparkDirectiveBase } from "../base";

/**
 * x-pane：布局窗格名位标记（ADR-0074）。
 *
 * `x-pane:参数` 声明 x-layout 的布局单元（词表 `header | content | sidebar | footer`；
 * `sidebar` 必带 `.left` / `.right` 修饰符，缺省按 `.left`；`.up` / `.down` 为 through
 * 简写修饰符——解析期并入指令选项，与 `x-pane-options={through:"up,down"}` 等价）。
 *
 * **本类是名位标记**（x-else-if / x-tree-node 先例）：窗格的收集、剪枝、grid 模板生成、
 * 存在性订阅与行为组合全部由父级 x-layout（LayoutDirective，ownsChildren）在编译期接管——
 * layout 收集快照时会剥除直接子级上的 x-pane 属性，故 layout 内的本类**永不实例化**。
 * 本类仅为两处兜底而注册：
 * 1. 深层 / 孤儿 x-pane（无 layout 祖先）：属性被正常剥除并实例化本类 → warn 诊断，
 *    子树照常编译（无结构副作用）；
 * 2. 让 `x-pane` 成为注册表合法名（DirectiveManager 一名一指令，防被未来同名注册静默顶掉）。
 */
export class PaneDirective extends AutoSparkDirectiveBase {
    static override readonly priority = 0;
    static override readonly singleton = true;

    override created(): void {
        // 合法窗格由 layout 接管（永不走到这里）；实例化即孤儿——宿主不是 layout 容器
        // （layout.compile 先于窗格子树编译给宿主打 autospark-layout 类，此处类即真相）
        const host = this.el.parentElement;
        if (!host || !host.classList.contains("autospark-layout")) {
            this.warn(
                "x-pane: 仅可作为 x-layout 的直接子元素使用（深层或无 x-layout 祖先的声明无效），本标记已忽略",
            );
        }
    }
}
