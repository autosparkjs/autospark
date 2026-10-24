/**
 * 通知族内置组件模板注册表（@autospark/plugins ADR-0001；自 engine components/index.ts
 * 种子表随插件迁入）：bootstrap 自举时整表注册进 `AutoSpark.components` 全局声明表
 * （ADR-0111 查询期委托——晚注册天然生效，跨 engine 共享全局 def 缓存）。
 *
 * 注册名统一 `autospark.` 点前缀（ADR-0094 命名空间），与用户业务组件零冲突；用户同名
 * 覆盖走 `options.components`（优先级高于插件表）。
 */
import SHELL_TEMPLATE from "./components/notification-shell.html?raw";
import TOAST_TEMPLATE from "./components/toast.html?raw";
import TASK_TEMPLATE from "./components/task.html?raw";
import CONFIRM_TEMPLATE from "./components/confirm.html?raw";
import { SHELL_PRESET_NAME, presetComponentName } from "./preset-names";

/** 通知族内置组件表：预设名 → 模板字符串（bootstrap 逐条注册，已有同名则跳过） */
export const NOTIFICATION_COMPONENTS: Record<string, string> = {
    [SHELL_PRESET_NAME]: SHELL_TEMPLATE,
    [presetComponentName("toast")]: TOAST_TEMPLATE,
    [presetComponentName("task")]: TASK_TEMPLATE,
    [presetComponentName("confirm")]: CONFIRM_TEMPLATE,
};
