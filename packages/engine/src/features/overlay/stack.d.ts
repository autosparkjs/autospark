/**
 * 打开栈（ADR-0052 决策 20）：document 级共享的**打开实例顺序栈**。
 *
 * - **所有 engine 的实例同栈同权**（声明式与命令式同权入栈）——ESC 是键盘全局事件、无 DOM
 *   分层可用，跨 engine 的「只关最上层」必须全局协调（对齐 icons 的 document 级先例）。
 * - ESC 监听 document 级单例：首实例入栈注册、栈清空注销；触发时仅对**全局栈顶**实例走
 *   「请求关闭」流程——嵌套打开（确认框叠对话框）时只关最上层，多 engine 并存也不连环关。
 * - 遮罩点击不依赖本栈：DOM 层叠天然让点击命中最上层的遮罩。
 * - 依赖倒置：本模块不 import OverlayInstance（避免循环），栈成员只需满足最小接口。
 * - 修订共识 5 后无 singleton 保活态——实例全部「打开中」，栈序 = 层叠序。
 */
/** 栈成员最小接口（OverlayInstance 结构性满足） */
export interface OpenStackEntry {
    /** 请求关闭（「请求关闭」统一语义的入口，source 标识触点） */
    requestClose(source: string): void;
}
/** 实例入栈（幂等：已在栈内则保持原位不重复——单例隐藏态复用不重复入栈）+ 确保监听就绪。 */
export declare function pushOpenInstance(inst: OpenStackEntry): void;
/** 实例出栈；栈清空时注销 ESC 监听。 */
export declare function removeOpenInstance(inst: OpenStackEntry): void;
/** 当前全局栈顶（无打开实例时 undefined）；测试辅助。 */
export declare function getTopOpenInstance(): OpenStackEntry | undefined;
