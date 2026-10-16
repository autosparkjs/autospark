/**
 * 通知族预设组件名（自 engine components/index.ts 随插件迁入）：
 * 注册名与种子表同处定义（本目录 bootstrap.ts 的注册表），杜绝 drift。
 */

/** 通知外壳族根的预设名（type 链末端 fallback 查找名；原 base 更名，ADR-0097） */
export const SHELL_PRESET_NAME = "autospark.notifications.shell";

/** 内置语义 type → 预设组件名（`types[type].render` 未配置时的默认查找名） */
export function presetComponentName(type: string): string {
    return `autospark.notifications.${type}`;
}
