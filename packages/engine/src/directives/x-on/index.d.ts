import { AutoSparkDirectiveBase } from "../../features/directive/base";
/**
 * x-on 事件指令（singleton=false，priority=50）。
 *
 * `x-on:event` / `@event` 监听任意事件；响应函数统一抽象为 **Action**：
 * - **函数来源（Action 优先 + 表达式兜底）**：`@click="submit"` / `submit(args)` 先沿 scope 链查
 *   actions（局部 `<script type="autospark/actions">` → engine.actions），命中以 AutoSparkActionContext 为 this
 *   调用；否则退化到 `with(data)` 表达式求值（data 为聚合视图；`alert(1)`/`count++` 等仍可用）。详见 eval.ts。
 *
 * **修饰符管道**（按 descriptor.type 分派，见 modifiers/）：
 * - **option**（once/capture/passive）→ 合并进 addEventListener 第 3 参
 * - **guard**（self/ctrl/按键/鼠标/exact）→ 组成 AND 链，置于业务 handler 之前，任一 false 短路
 * - **wrapper**（debounce）→ 由外向内包裹整条管道（在 guard 之外），destroy 时 cancel 清理
 *
 * **生命周期**：`created` 一次性构造 handler 并 addEventListener（事件是 push 模型，无需
 * scheduler/collectDependencies）；`destroy` 清 wrapper cleanup + removeEventListener。
 */
export declare class OnDirective extends AutoSparkDirectiveBase {
    static readonly priority = 50;
    static readonly singleton = false;
    /** 最终挂到 addEventListener 的 handler（含 wrapper/guard 包装），destroy 时用于解绑 */
    private finalHandler;
    /** addEventListener 第 3 参（option 类修饰符合并结果），解绑须 capture 字段一致 */
    private listenerOptions;
    /** wrapper 注册的清理句柄（debounce timer 等），destroy 时调用 cancel */
    private cleanups;
    created(): void;
    destroy(): void;
}
