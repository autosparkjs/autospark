// oxlint-disable no-unused-expressions
import { AutoSparkDirectiveBase } from "../base";
import type { AutoDirectiveInfo } from "../types";
import type { AutoSparkScope } from "../../scope";
import { BranchHost, type BranchEntry } from "../branch";
import { getDirectives } from "../utils/getDirectives";
import { resolveAnimate } from "../../animate";

/**
 * 条件分支（x-else-if / x-else）条目：编译期收集的冻结快照 + 运行态（ADR-0034）。
 */
interface ElseBranch extends BranchEntry {
    /** elseif 条件表达式；null = 裸 x-else 兜底（恒真，链末位） */
    expr: string | null;
}

/**
 * x-if：条件存在性。元素本身随条件**离开/回到 DOM**（detach/reattach），非 display:none。
 *
 * 两态（由 `.keepalive` 修饰符切换）均**摘除宿主 + 锚点注释占位**，区别在子树保活与否：
 *
 * - **eager（默认 `x-if="expr"`）**——结构指令（ownsChildren）。
 *   - true → 编译并挂载子树（经 `compiler.compileSubtree`）；
 *   - false → 摘除宿主（el.remove）+ 锚点注释占位 + 销毁子 scope（子树 watcher 一并 off）。
 *   - 控制订阅留在自身 scope（永活），仅 destroy/recreate **子** scope，避免"自杀"；
 *   - 与 x-for 同元素禁止（语义冲突，compiler 抛错），改用 `x-show`/`x-if.keepalive`（均不占子树）或外层包裹。
 *
 * - **keepalive（`x-if.keepalive`）**——摘宿主但**保活子树与 watcher**，true 时原宿主 reattach（状态保留）。
 *   不占 ownsChildren，可与 x-for 共存（x-for 独占子树，本指令只切容器存在性）。
 *
 * **条件分支链（ADR-0034）**：宿主的**直接子元素**中带 `x-else-if="expr"` / 裸 `x-else` 者为分支——
 * 编译期（created）克隆为冻结快照、建立短路求值链；运行时任一表达式变化从头重算：
 * 主表达式真 → 宿主（then 内容）挂载；假 → 按文档顺序取首个真的 elseif 分支；全假且有裸
 * x-else → 兜底分支；全假无兜底 → 皆不渲染（仅锚点占位）。命中的分支作为**独立元素插到
 * 锚点位置**（宿主原位）正常编译执行；分支元素本身经 compiler 剪枝层永不进 then 子树。
 * eager 切换销毁/重建分支（与 then 同权）；keepalive 下**每分支独立保活**（切回状态保留）。
 *
 * **宿主 scope 兼任锚点**：控制 watcher 留 `this.binding`，detach 期间由 `parent.children` 强引用
 * 保活、照常触发——无需独立锚点 scope 类型。锚点注释与分支挂卸由共享基建 `BranchHost` 持有
 * （ADR-0037 决策 9，与 x-switch 同构），作 reattach 的 DOM 书签（`parentNode` 恒为当前父，
 * 重插位稳定）。详见 ADR-0016 / ADR-0034 / ADR-0037。
 *
 * 注意：首次求值须 defer 到 microtask——`created` 在 compileElement 内同步执行，此时宿主
 * 尚未挂进父树（transformElement 的 appendChild 还没发生），detach 需要 parentNode。
 *
 * 与 x-show 的区别：x-if 切**存在性**（detach，宿主离开 DOM，不被表单提交/`:nth-child` 计数/
 * `querySelector` 命中）；x-show 切**可见性**（display:none，宿主永留 DOM）。x-show 是独立指令，
 * 不再是 `x-if.keep` 的别名。
 */
export class IfDirective extends AutoSparkDirectiveBase {
    static override readonly priority = 80;
    static override readonly singleton = true;

    /** eager 模式才占有子树；`.keepalive`/`x-if-options="{keepalive:true}"` 不占有（保活子树，不重编译） */
    static override ownsChildren(info: AutoDirectiveInfo): boolean {
        // keepalive 经解析期注入为 info.options.keepalive（modifier 与指令选项等价，ADR-0007）。
        // 静态方法早于 scope 实例，仅读指令级 options，不支持 x-options 宿主回退（编译期局限）。
        return info.options?.keepalive !== true;
    }

    /** eager 模式下本指令编译挂载的子树节点，false 时按此精确移除 */
    private subtreeNodes: ChildNode[] = [];
    /**
     * 分支链共享基建（ADR-0037 决策 9）：锚点管理 + 分支挂卸（eager/keepalive 两态）。
     * 本指令保留：then 态（宿主自身展示）、短路 evaluate、主/分支表达式多 watcher。
     */
    private host = new BranchHost<ElseBranch>(this, () => this.keepAliveMode);
    /** 条件分支链（编译期收集，文档顺序）；空数组 = 无分支（纯 x-if，行为与既往一致） */
    private get branches(): ElseBranch[] {
        return this.host.branches;
    }
    /** 各 elseif 分支的当前真值缓存（与 branches 下标对齐；裸 else 兜底无条目） */
    private branchValues: boolean[] = [];
    /** 主表达式当前真值缓存 */
    private condValue = false;
    /**
     * 首次求值守卫（ADR-0039 决策 6）：首次 show 为初次渲染，静默不动画；
     * 之后每次 show（状态变化引起）才播进出场。与 x-switch / x-for / x-show 的同款守卫一致。
     */
    private firstApply = true;
    /**
     * 当前展示态：-1 = 宿主（then）；>= 0 = 分支下标；null = 空（皆不渲染）或初始。
     * 空态与初始共用 null（卸载路径同路）：空态的重复 show **不早退**——x-for 复用项 refresh
     * 会经 Pass3 把已 detach 的宿主外部重插 DOM，须无条件重放 detach（各操作自幂等）。
     */
    private shown: number | null = null;

    private get keepAliveMode(): boolean {
        // `.keepalive` modifier 与 x-if-options="{keepalive:true}" 经 getOption 等价（ADR-0007）
        return !!this.getOption("keepalive");
    }

    override created() {
        if (this.value == null) return;
        this._collectBranches();
        this.condValue = !!this.binding.watch(this.value, ({ value }) => {
            this.condValue = !!value;
            this.evaluate();
        });
        // 每个 elseif 分支表达式独立订阅：任一变化从头重算整链（短路序不变）
        for (let i = 0; i < this.branches.length; i++) {
            const expr = this.branches[i]!.expr;
            if (expr == null) continue; // 裸 x-else 兜底无表达式
            this.branchValues[i] = !!this.binding.watch(expr, ({ value }) => {
                this.branchValues[i] = !!value;
                this.evaluate();
            });
        }
        // 首次求值 defer 到 microtask：created 在 compileElement 内同步跑，宿主尚未挂进父树
        // （transformElement 的 appendChild 还没发生），detach/插分支需要锚点 parentNode。同 x-for 首渲 defer。
        this.engine.scheduler.schedule(() => this.evaluate());
    }

    override destroy() {
        // 清理锚点注释与各分支渲染根（DOM 在宿主外，须显式移除；scope 侧随宿主
        // scope.destroy 递归销毁）——机制见 BranchHost.destroy
        this.host.destroy();
    }

    /**
     * 收集条件分支（ADR-0034）：扫描宿主模板的**直接子元素**，识别 x-else-if / x-else。
     *
     * 模板只读契约（ADR-0002）——不摘除节点，`cloneNode(true)` 为冻结快照；分支不进结果 DOM
     * 由 compiler 剪枝层保证（两通道统一）。防呆（编译期 warn，运行时按既定语义执行）：
     * - 分支根含结构指令（ownsChildren 类：x-for / eager x-if / x-slot）→ warn + 跳过该分支；
     * - 裸 x-else 之后仍声明分支 → warn（其后分支永不匹配，短路语义不变）；
     * - 同元素 x-else + x-else-if → warn，按 x-else-if 处理；
     * - x-else-if 空值 → warn，按裸 x-else 兜底处理。
     */
    private _collectBranches() {
        const tpl = this.template;
        if (!tpl) return;
        let fallbackSeen = false;
        for (const child of Array.from(tpl.children)) {
            const isElse = child.hasAttribute("x-else");
            const isElseIf = child.hasAttribute("x-else-if");
            if (!isElse && !isElseIf) continue;
            if (isElse && isElseIf) {
                this.engine.logger.warn(
                    `x-if: 同一元素同时声明 x-else 与 x-else-if，按 x-else-if 处理（ADR-0034）`,
                );
            }
            // 分支根含结构指令：分支命中时须作为单根元素插锚点位，「分支根循环/再条件化」语义
            // 混乱 → warn + 跳过该分支（分支照常被剪枝层摘出 then 子树）
            const structural = getDirectives(child as HTMLElement).some((info) => {
                const cls = this.engine.directives.get(info.name);
                return !!cls?.ownsChildren?.(info);
            });
            if (structural) {
                this.engine.logger.warn(
                    `x-if: 分支根上声明了结构指令（x-for/eager x-if/x-slot 等 ownsChildren 类），该分支被跳过（ADR-0034）`,
                );
                continue;
            }
            if (fallbackSeen) {
                this.engine.logger.warn(
                    `x-if: 裸 x-else 之后仍声明分支，其后分支永不匹配（x-else 应为最后一个分支，ADR-0034）`,
                );
            }
            let expr: string | null = null;
            if (isElseIf) {
                expr = (child.getAttribute("x-else-if") ?? "").trim();
                if (expr === "") {
                    this.engine.logger.warn(
                        `x-if: x-else-if 缺少条件表达式，按 x-else 兜底处理（ADR-0034）`,
                    );
                    expr = null;
                }
            }
            if (expr == null) fallbackSeen = true;
            this.branches.push({
                expr,
                template: child.cloneNode(true) as HTMLElement,
                runtime: null,
                scope: null,
            });
        }
    }

    /**
     * 从头重算整链（任一表达式变化触发，scheduler 已按 tick 合并）：
     * 主表达式真 → then（宿主）；假 → 文档顺序首个真的 elseif；全假有兜底 → 兜底；全假无兜底 → 空。
     */
    private evaluate() {
        if (this.condValue) {
            this.show(-1);
            return;
        }
        let hit: number | null = null;
        for (let i = 0; i < this.branches.length; i++) {
            const expr = this.branches[i]!.expr;
            if (expr == null || this.branchValues[i]) {
                hit = i; // 裸 x-else 恒真兜底（链到此处必中）
                break;
            }
        }
        this.show(hit);
    }

    /**
     * 切换展示：-1 = 宿主（then）；>= 0 = 分支下标；null = 皆不渲染。
     *
     * 幂等早退仅限 then / 分支的重复目标（防销毁重建）；空态（null）重复不早退——x-for 复用项
     * refresh 会经 Pass3 把已 detach 的宿主**外部重插** DOM（entry.nodes 全量 insertBefore 不感知
     * x-if 状态），空态须重放 detachHost（幂等：有父摘、无父 no-op）恢复。
     *
     * 空态 → then 的切换**尊重宿主现状**（不先摘再按锚插回）：Pass3 可能把宿主摆到了正确位置，
     * reattachHost 对有父者 no-op 即可；先拆会按「重排后已错位的旧锚」插回，反而错位。
     *
     * 进出场动画（ADR-0039）：`animate` = 非首次渲染（决策 6）。每次 show 起手先 `cancel` 宿主
     * 在播动画——若为携带延迟移除的离场则**同步完成**（清子树 + detachHost，决策 7），随后按新
     * 状态全新挂载（mountThen 重新编译不被在播元素/旧子树污染）。
     */
    private show(target: number | null) {
        const animate = !this.firstApply;
        if (this.shown === target && target !== null) return;
        this.firstApply = false;
        // 抢占在播（离场 → 同步完成延迟移除；进场 → 仅清类）
        if (this.el) this.engine.animate.cancel(this.el);
        const was = this.shown;
        this.shown = target;
        // 1) 卸载当前
        if (was === -1) {
            // then 展示中 → 完整卸载（eager 销毁子树并摘宿主 / keepalive 仅摘宿主保活子树）
            this.keepAliveMode ? this.leaveHost(animate) : this.unmountThen(animate);
        } else if (was != null) {
            this.host.unmountBranch(this.branches[was]!, animate);
        } else if (target == null) {
            // 空态（含初始）且目标仍为空：重放摘除（防御 x-for Pass3 外部插回；cancel 已完成待决离场，此处幂等）
            this.host.detachHost();
        } else if (target !== -1) {
            // 空/初始 → 分支：宿主须摘除给分支让位，锚点亦由 detachHost 确立（分支插锚前）
            this.keepAliveMode ? this.leaveHost(animate) : this.unmountThen(animate);
        }
        // 空/初始 → then（target === -1）：不摘——尊重宿主现状（Pass3 可能已摆到位），reattach 有父 no-op
        // 2) 挂载目标（null 仅卸载，锚点占位）
        if (target === -1) {
            this.keepAliveMode ? this.enterHost(animate) : this.mountThen(animate);
        } else if (target != null) {
            this.host.mountBranch(this.branches[target]!, animate);
        }
    }

    /**
     * keepalive：宿主离场——与 eager 同权播离场动画（ADR-0039 决策 11），detachHost 延迟到播完
     *（宿主留在 DOM 播动画；scope/watcher 本就保活，无 inert 问题）。
     */
    private leaveHost(animate: boolean) {
        const el = this.el;
        if (!el) return;
        const done = () => this.host.detachHost();
        const phase = animate ? resolveAnimate(this.getOption("animate")).leave : null;
        if (!phase || !this.engine.animate.leave(el, phase, done)) done();
    }

    /** keepalive：宿主进场——重挂（reattach 对有父者 no-op，含刚被 cancel 完成摘除的场景）后播 enter */
    private enterHost(animate: boolean) {
        this.host.reattachHost();
        if (animate && this.el) {
            this.engine.animate.enter(this.el, resolveAnimate(this.getOption("animate")).enter);
        }
    }

    // —— 锚点管理（ensureAnchor / detachHost / reattachHost）与分支挂卸（mountBranch /
    // unmountBranch）已抽至 BranchHost 共享基建（ADR-0037 决策 9），本指令经 this.host 委托 ——

    /**
     * eager：挂载 then——重挂宿主 + 编译子树（仅未挂载时，防重复编译）+ 播进场动画（ADR-0039）。
     * 分支子元素由 compileOneChild 统一剪枝。中断场景（离场中被 cancel 同步完成清场）下
     * subtreeNodes 已清空，走全新编译。
     */
    private mountThen(animate: boolean) {
        const el = this.el;
        const tpl = this.template;
        if (!el || !tpl) return;
        this.host.reattachHost();
        if (this.subtreeNodes.length === 0) {
            this.subtreeNodes = this.engine.compiler.compileSubtree(el, tpl, this.binding);
        }
        if (animate) {
            this.engine.animate.enter(el, resolveAnimate(this.getOption("animate")).enter);
        }
    }

    /**
     * eager：卸载 then——销毁子 scope（子树 watcher 批量 off）+ 精确移除自身挂载的节点 + 摘宿主。
     * 仅操作自身挂载的 subtreeNodes，子树 scope 经 binding.children 由 scope.destroy 递归清理。
     *
     * 进出场动画（ADR-0039 决策 9）：scope **立即销毁**（离场宿主 inert），DOM 移除（子树节点 +
     * detachHost）延迟到离场动画播完；subtreeNodes 记账同样延迟清空——中断路径经 show 起手的
     * cancel 同步执行 done（清子树 + 摘宿主）后，mountThen 方能全新编译（防新旧子树共存）。
     */
    private unmountThen(animate: boolean) {
        const el = this.el;
        if (!el) return;
        this.destroyChildren();
        const nodes = this.subtreeNodes; // 不清账：done 到点再清（见上）
        const done = () => {
            for (const node of nodes) node.remove();
            this.subtreeNodes = [];
            this.host.detachHost();
        };
        const phase = animate ? resolveAnimate(this.getOption("animate")).leave : null;
        if (!phase || !this.engine.animate.leave(el, phase, done)) done();
    }

    /**
     * 销毁当前作用域的全部子作用域（仅子树），不动自身控制 watcher。
     * ownsChildren 保证本 scope 的 children 恰为编译出的子树 scope 集合。
     */
    private destroyChildren() {
        const children: Set<AutoSparkScope> = this.binding.children;
        for (const child of children) child.destroy();
        children.clear();
    }
}
