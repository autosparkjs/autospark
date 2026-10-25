import type { AutoSpark } from "../../engine/engine";
import type { AutoSparkScope } from "../../engine/scope";
/**
 * 构造事件业务 handler：**Action 优先 + 表达式兜底**。
 *
 * **关键：Action 查找延迟到事件触发时**（闭包内调 `scope.getAction`）——因 actions 可能在
 * 指令 `created` 之后才注册（`engine.actions` 赋值、`<script type="autospark/actions">` 注入均晚于
 * 编译）。若在 created 时缓存 action 引用，会查到 undefined 误走表达式。
 *
 * 仅"表达式编译"（`new Function`，expr 不变）与"args 求值器"在 created 时一次性完成。
 *
 * 求值异常均记 `engine.logger.error` 不中断（复用 `scope.ts` watchExpression 宽松求值模式）。
 *
 * @returns `(event) => void` 闭包，捕获 engine/scope/el/$options
 */
export declare function createEvalHandler(expr: string, engine: AutoSpark, scope: AutoSparkScope, el: HTMLElement, directiveOptions: Record<string, any> | undefined, hostOptions: Record<string, any> | null | undefined): (event: Event) => any;
