import type { WrapperModifierDesc } from "../types";
/**
 * `.feedback`：async action 执行反馈（ADR-0008）。
 *
 * `@click.feedback="save"` 启用后，捕获 business handler 的返回值（action 返回的 Promise），
 * 自动在目标元素加 `pending`/`resolved`/`rejected` 类，可选叠加 x-loading overlay。
 *
 * **信号源 = 返回值捕获**（非订阅全局 `actions/<name>/*` 事件）：
 * - 全局事件按 name 广播，致同名 action 多元素串扰（点其一、订阅者全亮）；
 * - 返回值捕获精确到本次触发，统一同步/异步的「开始」语义。
 *
 * **同步/异步统一**（ADR-0013）：同步成功 settle resolved、同步抛错 settle rejected、
 * async enter(pending 常驻) + 终态。**终态一致**（减少心智负担），pending 仅 async（同步无加载窗口，
 * 强加 pending 会瞬时闪烁）。同步抛错经 eval.ts action catch rethrow 冒泡至此（eval 已 logger），
 * settle rejected 后吞掉不 rethrow——无 .feedback 时由 OnDirective/debounce 兜底防 uncaught。
 *
 * **`order: Infinity`** 固定 wrapper 链最内层（最靠近 business），确保拿到原始返回值；
 * 若居 debounce 等异步 wrapper 外层，`next(event)` 拿到的是异步 wrapper 返回的 undefined。
 *
 * **状态机**：pending 常驻 → resolved/rejected 终态 → `timeout` 后清终态类（`timeout:0` 终态常驻）。
 * pending 类**不受 timeout 清除**（action 在跑就显，清除会制造"没在跑"假象）。
 *
 * **重入**（pending 中再触发）：`gen` 单调递增，Promise 回调校验 `my === gen` 才生效，
 * 旧 Promise 的 resolve/reject 被忽略（旧 Promise 不取消，仅元素侧忽略）。
 *
 * **配置**经 `x-on-options="{feedback:{...}}"` 或宿主 `x-options`（两层回退，ADR-0007）：
 * `{ at, timeout, pendingClass, resolvedClass, rejectedClass, loading }`。`.feedback` 裸修饰符 = 全默认。
 */
declare const _default: WrapperModifierDesc;
export default _default;
