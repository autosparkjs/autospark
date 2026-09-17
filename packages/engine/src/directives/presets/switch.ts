// oxlint-disable no-unused-expressionsimport { relaxedToJson } from "../../utils/relaxedToJson";
import { AutoSparkDirectiveBase } from "../base";
import type { AutoDirectiveInfo } from "../types";
import { BranchHost, type BranchEntry } from "../branch";
import { getDirectives } from "../utils/getDirectives";

/**
 * 分支选择（x-case / x-default）条目：编译期收集的冻结快照 + 匹配字面量 + 运行态（ADR-0037）。
 */
interface SwitchBranch extends BranchEntry {
    /** x-case 的 relaxed-json 字面量值（多值数组或标量）；兜底分支无意义 */
    value: unknown;
    /** 值是否为多值数组（命中判定走 includes） */
    multiple: boolean;
    /** 裸 x-default 兜底（含 x-case 空值降级）：值匹配全不中时落此，位置无关 */
    isDefault: boolean;
}

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
export class SwitchDirective extends AutoSparkDirectiveBase {
    static override readonly priority = 80;
    static override readonly singleton = true;

    /** eager 模式才占有子树；`.keepalive` 不占有（保活分支，不重编译），对齐 x-if */
    static override ownsChildren(info: AutoDirectiveInfo): boolean {
        return info.options?.keepalive !== true;
    }

    /** 分支链共享基建：锚点管理 + 分支挂卸（eager/keepalive 两态） */
    private host = new BranchHost<SwitchBranch>(this, () => this.keepAliveMode);
    /**
     * 当前展示分支下标；null = 空（无匹配且无 default）或初始。
     * 空态重复 show 不早退——x-for 复用项 refresh 经 Pass3 外部重插已 detach 的宿主，
     * 须重放 detachHost（幂等）恢复，与 x-if 空态防御同构（ADR-0034 决策 9）。
     */
    private shown: number | null = null;
    /** 主表达式当前值缓存（watch 初始求值 + 变更回调写入） */
    private currentValue: unknown;
    /**
     * 首次求值守卫（ADR-0039 决策 6）：首次 show 为初次渲染，静默不动画；
     * 之后每次 show（状态变化引起）才播分支进出场。与 x-if / x-for / x-show 的同款守卫一致。
     */
    private firstApply = true;

    private get keepAliveMode(): boolean {
        // `.keepalive` modifier 与 x-switch-options="{keepalive:true}" 经 getOption 等价（ADR-0007）
        return !!this.getOption("keepalive");
    }

    override created() {
        if (this.value == null || `${this.value}`.trim() === "") {
            this.engine.logger.warn(`x-switch: 缺少匹配表达式，不渲染任何分支（ADR-0037）`);
            return;
        }
        this._collectBranches();
        this.currentValue = this.binding.watch(this.value, ({ value }) => {
            this.currentValue = value;
            this.evaluate();
        });
        // 首次求值 defer 到 microtask：created 在 compileElement 内同步跑，宿主尚未挂进父树
        // （transformElement 的 appendChild 还没发生），detach/插分支需要锚点 parentNode。同 x-if。
        this.engine.scheduler.schedule(() => this.evaluate());
    }

    override destroy() {
        // 清理锚点注释与各分支渲染根（DOM 在宿主外，须显式移除）——机制见 BranchHost.destroy
        this.host.destroy();
    }

    /**
     * 收集分支（ADR-0037 决策 1/6）：扫描宿主模板的**直接子元素**，识别 x-case / x-default。
     *
     * 模板只读契约（ADR-0002）——不摘除节点，`cloneNode(true)` 为冻结快照；分支不进结果 DOM
     * 由 compiler 剪枝层保证（两通道统一）。防呆（编译期 warn，运行时按既定语义执行）：
     * - 非分支子元素 → warn（不会渲染，随宿主离开 DOM）；
     * - 分支根含结构指令（ownsChildren 类：x-for / eager x-if / x-slot）→ warn + 跳过该分支；
     * - 同元素 x-case + x-default → warn，按 x-case 处理；
     * - x-case 空值 → warn，按 x-default 兜底处理（对齐 x-else-if 空值惯例）；
     * - 多个兜底（x-default 重复 / 多个空 x-case 降级）→ warn，取第一个；
     * - x-default 带值 → warn，忽略值（裸属性形态为准）；
     * - 字面量 relaxed-json 解析失败（NaN 特判除外）→ warn + 跳过该分支。
     */
    private _collectBranches() {
        const tpl = this.template;
        if (!tpl) return;
        // 兜底是否已收集（含 x-case 空值降级）：首个生效，后续 warn + 跳过
        let fallbackSeen = false;
        for (const child of Array.from(tpl.children)) {
            const isCase = child.hasAttribute("x-case");
            const isDefault = child.hasAttribute("x-default");
            if (!isCase && !isDefault) {
                this.engine.logger.warn(
                    `x-switch: 非分支子元素不会渲染（仅 x-case / x-default 直接子元素生效，ADR-0037）`,
                );
                continue;
            }
            if (isCase && isDefault) {
                this.engine.logger.warn(
                    `x-switch: 同一元素同时声明 x-case 与 x-default，按 x-case 处理（ADR-0037）`,
                );
            }
            // 分支根含结构指令：分支命中时须作为单根元素插锚点位，「分支根循环/再条件化」语义
            // 混乱 → warn + 跳过该分支（分支照常被剪枝层摘出，ADR-0034 决策 6 同款）
            const structural = getDirectives(child as HTMLElement).some((info) => {
                const cls = this.engine.directives.get(info.name);
                return !!cls?.ownsChildren?.(info);
            });
            if (structural) {
                this.engine.logger.warn(
                    `x-switch: 分支根上声明了结构指令（x-for/eager x-if/x-slot 等 ownsChildren 类），该分支被跳过（ADR-0037）`,
                );
                continue;
            }
            // —— 兜底分支收集（x-default 裸属性 / x-case 空值降级）——
            const caseRaw = isCase ? (child.getAttribute("x-case") ?? "").trim() : "";
            if (!isCase || caseRaw === "") {
                if (!isCase) {
                    // x-default 带值：值无意义 → warn + 忽略（裸属性形态为准）
                    const defRaw = (child.getAttribute("x-default") ?? "").trim();
                    if (defRaw !== "") {
                        this.engine.logger.warn(
                            `x-switch: x-default 的值被忽略（兜底分支无匹配值，裸属性形态为准，ADR-0037）`,
                        );
                    }
                } else {
                    this.engine.logger.warn(
                        `x-switch: x-case 缺少匹配值，按 x-default 兜底处理（ADR-0037）`,
                    );
                }
                if (fallbackSeen) {
                    this.engine.logger.warn(
                        `x-switch: 重复的兜底分支，首个生效（ADR-0037）`,
                    );
                    continue;
                }
                fallbackSeen = true;
                this.host.branches.push({
                    value: undefined,
                    multiple: false,
                    isDefault: true,
                    template: child.cloneNode(true) as HTMLElement,
                    runtime: null,
                    scope: null,
                });
                continue;
            }
            // —— case 分支：relaxed-json 字面量解析 ——

            // NaN 特判：relaxed-json 解析抛 not a float（ADR-0014 同源限制），按 NaN 字面量识别
            // —— x-case="NaN" 可命中主值 NaN（SameValueZero）
            let parsed: unknown;
            if (caseRaw === "NaN") {
                parsed = Number.NaN;
            } else {
                try {
                    parsed = JSON.parse(relaxedToJson(caseRaw));
                } catch {
                    this.engine.logger.warn(
                        `x-switch: x-case 值 "${caseRaw}" 不是合法的 relaxed-json 字面量，该分支被跳过（ADR-0037）`,
                    );
                    continue;
                }
            }
            this.host.branches.push({
                value: parsed,
                multiple: Array.isArray(parsed),
                isDefault: false,
                template: child.cloneNode(true) as HTMLElement,
                runtime: null,
                scope: null,
            });
        }
    }

    /**
     * 命中判定（任一变化触发，scheduler 已按 tick 合并）：先按文档顺序扫 case 找匹配
     * （首个命中胜），全不中才落兜底——**default 位置无关**（JS switch 心智，ADR-0037 决策 4）。
     */
    private evaluate() {
        const v = this.currentValue;
        let hit: number | null = null;
        let fallback: number | null = null;
        const branches = this.host.branches;
        for (let i = 0; i < branches.length; i++) {
            const b = branches[i]!;
            if (b.isDefault) {
                if (fallback == null) fallback = i;
                continue;
            }
            if (this._matches(b, v)) {
                hit = i;
                break;
            }
        }
        this.show(hit ?? fallback);
    }

    /**
     * SameValueZero 判定（ADR-0037 决策 3）：单值 `===` 已把 ±0 视为相等，补 NaN 双查即得；
     * 多值数组走 `includes`（内部即 SameValueZero，与空值集判定 ADR-0014 一条线）。
     */
    private _matches(b: SwitchBranch, v: unknown): boolean {
        if (b.multiple) return Array.isArray(b.value) && b.value.includes(v as never);
        const x = b.value;
        return x === v || (Number.isNaN(x as number) && Number.isNaN(v as number));
    }

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
    private show(target: number | null) {
        const animate = !this.firstApply;
        if (this.shown === target && target !== null) return;
        this.firstApply = false;
        const was = this.shown;
        this.shown = target;
        if (was != null) this.host.unmountBranch(this.host.branches[was]!, animate);
        this.host.detachHost();
        if (target != null) this.host.mountBranch(this.host.branches[target]!, animate);
    }
}
