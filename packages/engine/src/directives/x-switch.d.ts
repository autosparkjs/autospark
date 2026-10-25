import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { AutoDirectiveInfo } from "../features/directive/types";
/**
 * x-switch：分支选择。按**主表达式的值**多路选一渲染（ADR-0037）。
 *
 * ```html
 * <div x-switch="status">
 *     <div x-case="loading">加载中…</div>
 *     <div x-case="[error, fatal]">出错了</div>
 *     <div x-default>正常内容</div>
 * </div>
 * ```
 *
 * - **case 值是 relaxed-json 字面量**（非表达式）：`a` → 字符串 `"a"`、`1` → 数字、`true` →
 *   布尔、`[a, 2]` → 多值数组（命中任一）。编译期解析定死、零 watcher；`NaN` 经特判识别
 *   （relaxed-json 解析抛 not a float，同 ADR-0014 空值集先例）。动态比较（case 值须读状态）
 *   不是本指令职责——那是 x-if 分支链的多路能力（ADR-0034）。
 * - **主表达式求值一次**（单 watcher），与 case 字面量做 **SameValueZero** 比较（NaN 可匹配、
 *   ±0 相等；多值数组 `includes` 内部同算法，与空值集判定惯例 ADR-0014 一条线）。主值为
 *   对象/数组时退化为引用比较——字面量永不匹配，落 default/空态（仅原始值有意义）。
 * - **default 位置无关**（JS switch 心智）：先按文档顺序扫 case，全不中才落 default——
 *   default 写在中间不影响其后 case 的匹配。
 * - **宿主形态与 x-if 分支链同构**：宿主摘除 + 锚点注释占位，命中分支作为独立元素插到
 *   宿主原位（兄弟位，一跳差异同 ADR-0034）；非分支子元素不渲染（收集期 warn）。宿主
 *   **永无 then 态**（对比 x-if：主表达式真时展示宿主自身）——x-switch 的全部分支都在
 *   x-case / x-default 里。
 * - **两态**（`.keepalive` 修饰符 ≡ `x-switch-options="{keepalive:true}"`）：eager（默认）
 *   切换销毁/重建分支；keepalive 每分支独立保活（切回 reattach 状态保留）。
 * - 挂卸/锚点/保活机制委托共享基建 `BranchHost`（ADR-0037 决策 9）。
 *
 * 注意：首次求值 defer 到 microtask——`created` 在 compileElement 内同步执行，此时宿主
 * 尚未挂进父树（transformElement 的 appendChild 还没发生），detach 需要 parentNode（同 x-if）。
 */
export declare class SwitchDirective extends AutoSparkDirectiveBase {
    static readonly priority = 80;
    static readonly singleton = true;
    /** eager 模式才占有子树；`.keepalive` 不占有（保活分支，不重编译），对齐 x-if */
    static ownsChildren(info: AutoDirectiveInfo): boolean;
    /** 分支链共享基建：锚点管理 + 分支挂卸（eager/keepalive 两态） */
    private host;
    /**
     * 当前展示分支下标；null = 空（无匹配且无 default）或初始。
     * 空态重复 show 不早退——x-for 复用项 refresh 经 Pass3 外部重插已 detach 的宿主，
     * 须重放 detachHost（幂等）恢复，与 x-if 空态防御同构（ADR-0034 决策 9）。
     */
    private shown;
    /** 主表达式当前值缓存（watch 初始求值 + 变更回调写入） */
    private currentValue;
    /**
     * 首次求值守卫（ADR-0039 决策 6）：首次 show 为初次渲染，静默不动画；
     * 之后每次 show（状态变化引起）才播分支进出场。与 x-if / x-for / x-show 的同款守卫一致。
     */
    private firstApply;
    private get keepAliveMode();
    created(): void;
    destroy(): void;
    /**
     * 收集分支（ADR-0037 决策 1/6）：扫描宿主模板的**直接子元素**，识别 x-case / x-default。
     *
     * 模板只读契约（ADR-0002）——不摘除节点，`cloneNode(true)` 为冻结快照；分支不进结果 DOM
     * 由 compiler 剪枝层保证（两通道统一）。防呆（编译期 warn，运行时按既定语义执行）：
     * - 非分支子元素 → warn（不会渲染，随宿主离开 DOM）；
     * - 分支根含结构指令（ownsChildren 类：x-for / eager x-if / x-isolate）→ warn + 跳过该分支；
     * - 同元素 x-case + x-default → warn，按 x-case 处理；
     * - x-case 空值 → warn，按 x-default 兜底处理（对齐 x-else-if 空值惯例）；
     * - 多个兜底（x-default 重复 / 多个空 x-case 降级）→ warn，取第一个；
     * - x-default 带值 → warn，忽略值（裸属性形态为准）；
     * - 字面量 relaxed-json 解析失败（NaN 特判除外）→ warn + 跳过该分支。
     */
    private _collectBranches;
    /**
     * 命中判定（任一变化触发，scheduler 已按 tick 合并）：先按文档顺序扫 case 找匹配
     * （首个命中胜），全不中才落兜底——**default 位置无关**（JS switch 心智，ADR-0037 决策 4）。
     */
    private evaluate;
    /**
     * SameValueZero 判定（ADR-0037 决策 3）：单值 `===` 已把 ±0 视为相等，补 NaN 双查即得；
     * 多值数组走 `includes`（内部即 SameValueZero，与空值集判定 ADR-0014 一条线）。
     */
    private _matches;
    /**
     * 切换展示：>= 0 = 分支下标；null = 皆不渲染。
     *
     * 宿主**永无 then 态**（对比 x-if）：无论目标为何，先确保宿主摘除（幂等）给分支让位 /
     * 空态锚点占位。同目标幂等早退仅限非空分支（防销毁重建）；空态（null）重复不早退——
     * x-for 复用项 refresh 经 Pass3 外部重插宿主，须重放 detachHost 恢复（ADR-0034 决策 9）。
     *
     * 进出场动画（ADR-0039）：分支挂卸经 BranchHost 播 enter/leave（新旧分支短暂共处文档流，
     * 决策 8 共演）；宿主摘除本身不动画——宿主是空容器（分支标记已被剪枝），无用户可见内容。
     */
    private show;
}
