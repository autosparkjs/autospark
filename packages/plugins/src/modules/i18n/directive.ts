/**
 * x-locales 指令（ADR-0136 决策三）：元素级字典声明——script 块的属性形态补充覆盖。
 *
 * - **Compile 静态**：`created`（编译期）经 `scope.read` 求值一次任意表达式（对象字面量 /
 *   状态路径初值 / 函数返回均可），挂自身 scope 的 WeakMap 字典层，**不订阅后续变化**
 *   （字典是模板结构性数据非动态 UI 状态）。
 * - 同元素与 locales script 并存时 x-locales 胜——scriptType transformer 先收集、
 *   指令编译后写，合并语义后者覆盖同键（ADR-0136 决策三，天然成立）。
 * - 查表优先级高于祖先与全局层（就近覆盖总原则）。
 *
 * 以 spec 形态经 `AutoSpark.directive(spec)` 注册（installPlugin 回调体，先于首编译）。
 */
import { DirectiveKind } from "autospark";
import type { AutoSparkDirectiveBase, DirectiveSpec } from "autospark";
import { collectScopeDict } from "./translate";

export function createLocalesDirective(): DirectiveSpec {
    return {
        name: "locales",
        kind: DirectiveKind.Compile,
        created(this: AutoSparkDirectiveBase) {
            const raw = this.value;
            if (raw == null || raw === "") return;
            // 编译期求值一次（scope.read：字面量 / 状态路径初值 / 函数返回均可）
            const dict = this.binding.read(raw);
            if (dict == null) return;
            if (typeof dict !== "object" || Array.isArray(dict)) {
                this.engine.logger.warn(
                    `x-locales: 值须为字典对象（原文 → {语言码: 译文}），已忽略: ${typeof dict}`,
                );
                return;
            }
            collectScopeDict(this.binding, dict as Record<string, any>);
        },
    };
}
