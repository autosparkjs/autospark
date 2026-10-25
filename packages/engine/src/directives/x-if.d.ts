import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { AutoDirectiveInfo } from "../features/directive/types";
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
export declare class IfDirective extends AutoSparkDirectiveBase {
    static readonly priority = 80;
    static readonly singleton = true;
    /** eager 模式才占有子树；`.keepalive`/`x-if-options="{keepalive:true}"` 不占有（保活子树，不重编译） */
    static ownsChildren(info: AutoDirectiveInfo): boolean;
    /** eager 模式下本指令编译挂载的子树节点，false 时按此精确移除 */
    private subtreeNodes;
    /**
     * 分支链共享基建（ADR-0037 决策 9）：锚点管理 + 分支挂卸（eager/keepalive 两态）。
     * 本指令保留：then 态（宿主自身展示）、短路 evaluate、主/分支表达式多 watcher。
     */
    private host;
    /** 条件分支链（编译期收集，文档顺序）；空数组 = 无分支（纯 x-if，行为与既往一致） */
    private get branches();
    /** 各 elseif 分支的当前真值缓存（与 branches 下标对齐；裸 else 兜底无条目） */
    private branchValues;
    /** 主表达式当前真值缓存 */
    private condValue;
    /** 动画配置缓存（DRY：避免每次事件重复 resolveAnimate + getOption） */
    private _anim;
    /**
     * 首次求值守卫（ADR-0039 决策 6）：首次 show 为初次渲染，静默不动画；
     * 之后每次 show（状态变化引起）才播进出场。与 x-switch / x-for / x-show 的同款守卫一致。
     */
    private firstApply;
    /**
     * 当前展示态：-1 = 宿主（then）；>= 0 = 分支下标；null = 空（皆不渲染）或初始。
     * 空态与初始共用 null（卸载路径同路）：空态的重复 show **不早退**——x-for 复用项 refresh
     * 会经 Pass3 把已 detach 的宿主外部重插 DOM，须无条件重放 detach（各操作自幂等）。
     */
    private shown;
    private get keepAliveMode();
    created(): void;
    destroy(): void;
    /**
     * 收集条件分支（ADR-0034）：扫描宿主模板的**直接子元素**，识别 x-else-if / x-else。
     *
     * 模板只读契约（ADR-0002）——不摘除节点，`cloneNode(true)` 为冻结快照；分支不进结果 DOM
     * 由 compiler 剪枝层保证（两通道统一）。防呆（编译期 warn，运行时按既定语义执行）：
     * - 分支根含结构指令（ownsChildren 类：x-for / eager x-if / x-isolate）→ warn + 跳过该分支；
     * - 裸 x-else 之后仍声明分支 → warn（其后分支永不匹配，短路语义不变）；
     * - 同元素 x-else + x-else-if → warn，按 x-else-if 处理；
     * - x-else-if 空值 → warn，按裸 x-else 兜底处理。
     */
    private _collectBranches;
    /**
     * 从头重算整链（任一表达式变化触发，scheduler 已按 tick 合并）：
     * 主表达式真 → then（宿主）；假 → 文档顺序首个真的 elseif；全假有兜底 → 兜底；全假无兜底 → 空。
     */
    private evaluate;
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
    private show;
    /**
     * keepalive：宿主离场——与 eager 同权播离场动画（ADR-0039 决策 11），detachHost 延迟到播完
     *（宿主留在 DOM 播动画；scope/watcher 本就保活，无 inert 问题）。
     */
    private leaveHost;
    /** keepalive：宿主进场——重挂（reattach 对有父者 no-op，含刚被 cancel 完成摘除的场景）后播 enter */
    private enterHost;
    /**
     * eager：挂载 then——重挂宿主 + 编译子树（仅未挂载时，防重复编译）+ 播进场动画（ADR-0039）。
     * 分支子元素由 compileOneChild 统一剪枝。中断场景（离场中被 cancel 同步完成清场）下
     * subtreeNodes 已清空，走全新编译。
     */
    private mountThen;
    /**
     * eager：卸载 then——销毁子 scope（子树 watcher 批量 off）+ 精确移除自身挂载的节点 + 摘宿主。
     * 仅操作自身挂载的 subtreeNodes，子树 scope 经 binding.children 由 scope.destroy 递归清理。
     *
     * 进出场动画（ADR-0039 决策 9）：scope **立即销毁**（离场宿主 inert），DOM 移除（子树节点 +
     * detachHost）延迟到离场动画播完；subtreeNodes 记账同样延迟清空——中断路径经 show 起手的
     * cancel 同步执行 done（清子树 + 摘宿主）后，mountThen 方能全新编译（防新旧子树共存）。
     */
    private unmountThen;
    /**
     * 销毁当前作用域的全部子作用域（仅子树），不动自身控制 watcher。
     * ownsChildren 保证本 scope 的 children 恰为编译出的子树 scope 集合。
     */
    private destroyChildren;
}
