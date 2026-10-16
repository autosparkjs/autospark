/**
 * @autospark/components 通知插件入口（ADR-0001）：通知子系统自 engine 迁出的落点。
 *
 * 模块加载即自举（`bootstrapNotificationsPlugin()`）：双路径注册——`globalThis.AutoSpark.ready`
 * 存在则直接注册，否则推 `__AUTOSPARK_PLUGINS__` 预加载队列（ADR-0114）兜底双加载顺序。
 * ready 序列：注册 4 内置组件模板（全局组件表，用户同名声明优先）→ 构造 NotificationManager
 * （读 `options.notifications`）→ 挂 `engine.notifications` → 注册 toast/confirm/task 三件套
 * action（engine.actions Proxy set，占用检查）→ 监听 `engine/destroy/before` 清理容器。
 *
 * IIFE 产物全局名 `AutoSparkNotifications`（autospark.notifications.js）；ESM 产物具名导出
 * `bootstrapNotificationsPlugin()`。类型面扩展见 ./types/augment.ts（副作用导入）。
 */
import "./types/augment";

// 公开面（ADR-0001 决策 4）：全部通知类型（含运行时常量，对齐原 engine
// `export * from features/notifications/types` 面）+ NotificationManager + 自举入口
export * from "./runtime/types";
export { NotificationManager } from "./runtime/manager";
export type { NotificationEntry } from "./runtime/manager";
export { bootstrapNotificationsPlugin } from "./bootstrap";
export { NOTIFICATION_COMPONENTS } from "./components";
export { SHELL_PRESET_NAME, presetComponentName } from "./preset-names";

// 模块加载即自举（沿 router 插件先例：置于入口尾部）
import { bootstrapNotificationsPlugin } from "./bootstrap";
bootstrapNotificationsPlugin();
