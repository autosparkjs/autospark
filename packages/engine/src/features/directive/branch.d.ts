import type { AutoSparkDirectiveBase } from "./base";
import type { AutoSparkScope } from "../../engine/scope";
/**
 * 分支条目公共形态（ADR-0037 决策 9）：编译期冻结快照 + 运行态。
 *
 * x-if（ElseBranch：expr 条件表达式）与 x-switch（SwitchBranch：value 匹配字面量）
 * 的分支条目均扩展本接口——机制层（快照/挂卸/保活）同构，策略层（命中判定）各自实现。
 */
export interface BranchEntry {
    /** 编译期克隆的分支快照（保留指令属性、未编译；模板只读契约下的冻结副本，可反复克隆渲染） */
    template: HTMLElement;
    /** 已渲染的分支根元素（keepalive 保活留存、切回 reattach；eager 切走销毁置 null） */
    runtime: HTMLElement | null;
    /** 分支编译出的子 scope（keepalive 留存；eager 切走销毁置 null） */
    scope: AutoSparkScope | null;
}
/**
 * 分支链共享基建（ADR-0034 / 0037）：锚点管理 + 分支挂卸（eager/keepalive 两态）。
 *
 * IfDirective（x-else-if / x-else 条件链）与 SwitchDirective（x-case / x-default 值匹配）
 * 共同委托——分支「作为独立元素插到宿主原位（锚点前）」的渲染机制、eager 销毁重建 /
 * keepalive 每分支独立保活的两态语义，在本类一处实现、两指令受益。
 *
 * 宿主指令负责：分支收集（快照 + 防呆）、命中判定（evaluate 策略）、展示态机（show）；
 * 本类负责：锚点注释的生命周期、宿主摘除/重挂、单分支的编译挂载与按态卸载。
 */
export declare class BranchHost<TBranch extends BranchEntry = BranchEntry> {
    private readonly directive;
    private readonly isKeepAlive;
    /** 分支表（文档顺序，由宿主指令在编译期填充） */
    readonly branches: TBranch[];
    /** 锚点注释：宿主摘除时留在原位的 DOM 书签（常驻，紧邻宿主前；`parentNode` 恒为当前父） */
    private anchorComment;
    /**
     * @param directive   宿主指令（engine / binding / el 的来源；分支经 compileChild
     *                    编译后 scope 挂 `binding.children`，随宿主 scope.destroy 递归销毁）
     * @param isKeepAlive 保活模式判定（`.keepalive` 修饰符 ≡ 指令选项，ADR-0007；由宿主指令注入）
     */
    constructor(directive: AutoSparkDirectiveBase, isKeepAlive: () => boolean);
    /**
     * 确保锚点注释存在并定位在宿主前（懒创建）。
     * 宿主此时应在 DOM（ensureAnchor 在 detach 前 / reattach 时调用，el.parentNode 有效）。
     */
    ensureAnchor(): void;
    /** 摘除宿主：确保锚点（留在原位）后 el.remove()。宿主由指令 this.el 强引用保活，不 GC。 */
    detachHost(): void;
    /** 重挂宿主：若 el 已 detach（无父），插回锚点注释前。锚点常驻作书签。 */
    reattachHost(): void;
    /**
     * 挂载分支：命中分支作为独立元素插到锚点位置（宿主原位），经 compileChild 编译执行
     * （复用 x-for 项根机制：浅克隆 + 剥指令属性 + 建 scope 挂 binding 为子 + 继承 locals）。
     * keepalive 保活留存（b.runtime）直接 reattach（状态保留）；eager 首次/重建均重新编译快照。
     *
     * 进场动画（ADR-0039 决策 5 挂点）：keepalive 切回先同步完成待决离场（cancel=complete，
     * 决策 7）再重挂；两态挂载后均播 enter（`animate` 参数由宿主指令的 firstApply 守卫传入，
     * 首次渲染静默——决策 6）。
     */
    mountBranch(b: TBranch, animate?: boolean): void;
    /**
     * 卸载分支：keepalive 仅 detach（scope/watcher/引用留存，切回 reattach 状态保留）；
     * eager 销毁分支 scope（watcher off、从 binding.children 除名）+ 移除 DOM + 置空（下次重建）。
     *
     * 离场动画（ADR-0039）：eager 的 scope **立即销毁**（离场元素 inert，决策 9），DOM 移除经
     * 离场动画延迟；`b.runtime` 立即置 null——eager 切回必须走重新编译而非 reattach 在播元素，
     * 在播离场元素作为独立实体自行播完移除（与新编译元素短暂共处文档流，决策 8 共演）。
     */
    unmountBranch(b: TBranch, animate?: boolean): void;
    /** 读取宿主指令的 animate 配置并取相（enter/leave）；未配置返回 null（无动画，同步路径） */
    private _phase;
    /**
     * 指令销毁清理：移除锚点注释（宿主的兄弟节点，不会被 el.remove 带走）与各分支的
     * 渲染根（在宿主**外**——锚点位、宿主的兄弟，宿主子树销毁/移除不会带走它，须显式移除
     * 防孤儿节点）。分支 scope 已挂 binding.children，随宿主 scope.destroy 递归销毁。
     */
    destroy(): void;
}
