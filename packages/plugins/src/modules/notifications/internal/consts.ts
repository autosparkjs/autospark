/**
 * 通知插件私有保留键（ADR-0072；自 engine consts.ts 随插件迁入并私有化）：
 * NotificationManager 构造时注入 `store.state[NOTIFICATIONS_KEY] = { items, options }`。
 * engine 侧已随插件化删除该键——保留键契约归插件所有（未装插件时 engine 不再保留此键名）。
 */

/** $notifications 保留键：全局通知子系统的状态暴露容器（用户 state 树不得使用此命名） */
export const NOTIFICATIONS_KEY = "$notifications";
