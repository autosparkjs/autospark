import type { AutoSparkDirectiveBase } from "./base";
import type { AutoSparkScope } from "../scope";
import { resolveAnimate, type PhaseAnim } from "../animate";

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
export class BranchHost<TBranch extends BranchEntry = BranchEntry> {
    /** 分支表（文档顺序，由宿主指令在编译期填充） */
    readonly branches: TBranch[] = [];

    /** 锚点注释：宿主摘除时留在原位的 DOM 书签（常驻，紧邻宿主前；`parentNode` 恒为当前父） */
    private anchorComment: Comment | null = null;

    /**
     * @param directive   宿主指令（engine / binding / el 的来源；分支经 compileChild
     *                    编译后 scope 挂 `binding.children`，随宿主 scope.destroy 递归销毁）
     * @param isKeepAlive 保活模式判定（`.keepalive` 修饰符 ≡ 指令选项，ADR-0007；由宿主指令注入）
     */
    constructor(
        private readonly directive: AutoSparkDirectiveBase,
        private readonly isKeepAlive: () => boolean,
    ) {}

    /**
     * 确保锚点注释存在并定位在宿主前（懒创建）。
     * 宿主此时应在 DOM（ensureAnchor 在 detach 前 / reattach 时调用，el.parentNode 有效）。
     */
    ensureAnchor() {
        const el = this.directive.el;
        if (!el || this.anchorComment) return;
        // 用 parentNode（而非 isConnected）判定挂载状态：测试与部分宿主中 root 可能脱离
        // document，此时 isConnected 恒 false 会误判。parentNode 非空即代表已在某父节点下。
        if (!el.parentNode) return;
        // 注释内容带 x- 前缀（x-if / x-switch），便于 DOM 检视时识别归属指令
        this.anchorComment = document.createComment(`x-${this.directive.info.name}`);
        el.parentNode.insertBefore(this.anchorComment, el);
    }

    /** 摘除宿主：确保锚点（留在原位）后 el.remove()。宿主由指令 this.el 强引用保活，不 GC。 */
    detachHost() {
        const el = this.directive.el;
        if (!el) return;
        this.ensureAnchor();
        if (el.parentNode) el.remove();
    }

    /** 重挂宿主：若 el 已 detach（无父），插回锚点注释前。锚点常驻作书签。 */
    reattachHost() {
        const el = this.directive.el;
        if (!el) return;
        this.ensureAnchor();
        const anchor = this.anchorComment;
        if (!el.parentNode && anchor?.parentNode) {
            anchor.parentNode.insertBefore(el, anchor);
        }
    }

    /**
     * 挂载分支：命中分支作为独立元素插到锚点位置（宿主原位），经 compileChild 编译执行
     * （复用 x-for 项根机制：浅克隆 + 剥指令属性 + 建 scope 挂 binding 为子 + 继承 locals）。
     * keepalive 保活留存（b.runtime）直接 reattach（状态保留）；eager 首次/重建均重新编译快照。
     *
     * 进场动画（ADR-0039 决策 5 挂点）：keepalive 切回先同步完成待决离场（cancel=complete，
     * 决策 7）再重挂；两态挂载后均播 enter（`animate` 参数由宿主指令的 firstApply 守卫传入，
     * 首次渲染静默——决策 6）。
     */
    mountBranch(b: TBranch, animate = true) {
        const anchor = this.anchorComment;
        if (!anchor?.parentNode) return; // 宿主无父（root 脱离 document）——防御
        const anim = this.directive.engine.animate;
        if (b.runtime) {
            // keepalive 切回：保活的分支根 reattach（子树与 watcher 未销毁，状态保留）。
            // 抢占待决离场（若有）：其 onDone（remove）同步完成后再重挂
            anim.cancel(b.runtime);
            anchor.parentNode.insertBefore(b.runtime, anchor);
            if (animate) anim.enter(b.runtime, this._phase("enter"));
            return;
        }
        const { directive } = this;
        const { el, scope } = directive.engine.compiler.compileChild(
            b.template,
            directive.binding,
            // locals 透传 binding 引用（可空）：与 _linkParent 自动继承语义一致——无局部数据
            // 则保持 null，不建空 Proxy 层、不影响 watch 双轨分流
            directive.binding.locals,
        );
        anchor.parentNode.insertBefore(el, anchor);
        b.runtime = el;
        b.scope = scope;
        if (animate) anim.enter(el, this._phase("enter"));
    }

    /**
     * 卸载分支：keepalive 仅 detach（scope/watcher/引用留存，切回 reattach 状态保留）；
     * eager 销毁分支 scope（watcher off、从 binding.children 除名）+ 移除 DOM + 置空（下次重建）。
     *
     * 离场动画（ADR-0039）：eager 的 scope **立即销毁**（离场元素 inert，决策 9），DOM 移除经
     * 离场动画延迟；`b.runtime` 立即置 null——eager 切回必须走重新编译而非 reattach 在播元素，
     * 在播离场元素作为独立实体自行播完移除（与新编译元素短暂共处文档流，决策 8 共演）。
     */
    unmountBranch(b: TBranch, animate = true) {
        if (!b.runtime) return;
        const el = b.runtime;
        const anim = this.directive.engine.animate;
        if (this.isKeepAlive()) {
            // keepalive：scope/watcher/引用留存，仅摘 DOM（有动画则延迟摘）
            const ok = animate && anim.leave(el, this._phase("leave"), () => el.remove());
            if (!ok) el.remove();
            return;
        }
        // eager：scope 立即销毁 + 记账立即置空；DOM 移除延迟到离场动画完成（或同步）
        b.scope?.destroy();
        b.scope = null;
        b.runtime = null;
        const ok = animate && anim.leave(el, this._phase("leave"), () => el.remove());
        if (!ok) el.remove();
    }

    /** 读取宿主指令的 animate 配置并取相（enter/leave）；未配置返回 null（无动画，同步路径） */
    private _phase(which: "enter" | "leave"): PhaseAnim | null {
        return resolveAnimate(this.directive.getOption("animate"))[which];
    }

    /**
     * 指令销毁清理：移除锚点注释（宿主的兄弟节点，不会被 el.remove 带走）与各分支的
     * 渲染根（在宿主**外**——锚点位、宿主的兄弟，宿主子树销毁/移除不会带走它，须显式移除
     * 防孤儿节点）。分支 scope 已挂 binding.children，随宿主 scope.destroy 递归销毁。
     */
    destroy() {
        this.anchorComment?.remove();
        this.anchorComment = null;
        for (const b of this.branches) b.runtime?.remove();
    }
}
