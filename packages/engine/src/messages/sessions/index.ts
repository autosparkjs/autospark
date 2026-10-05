export { MessageSessionBase } from "./base";
export { MessageToastSession, type ToastMessageProps } from "./toast";
export { MessageTaskSession, type TaskMessageProps } from "./task";
export { MessageConfirmSession, type ConfirmMessageProps } from "./confirm";
export { DEAD_SESSION, type MessageSessionFactory } from "./types";

/**
 * 消息会话 class 家族（ADR-0083，取代 ADR-0077 的「闭包全集方法 + 类型窄化」实现）：
 * 单条消息**渲染生命周期的行为句柄**——`add()` 内部按 type `switch` 实例化子类，**类型面
 * 与运行时面统一**（基类实例不携带 task/confirm 域方法）。一文件一类，且**行为与渲染模板
 * 同文件**（ADR-0083 变体 A 聚合——type 维度单一落点；跨 type 的注册面在 messages/presets.ts）：
 *
 * - `base.ts`——`MessageSessionBase` 基类：跨态生命周期面（show / hide / remove / update /
 *   cancel + 只读 getter）；自定义 type 的返回类型即它；
 * - `toast.ts` / `task.ts` / `confirm.ts`——三个内置 type 子类（Task 七方法 / Confirm 三方法
 *   + thenable）；
 * - `types.ts`——`MessageSessionFactory` factory 函数类型 + `DEAD_SESSION` 死会话哨兵。
 */
