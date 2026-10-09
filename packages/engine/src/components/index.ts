/**
 * 内置组件唯一注册面（ADR-0094）：全部内置组件的模板 `?raw` 导入、注册名常量与聚合种子表
 * 收敛于此——engine 单点引用，features 层零 `?raw` 导入（core→features 反向依赖清零，
 * 数据资产层被上层单向引用，ADR-0093）。
 *
 * 注册名**统一 `autospark.` 点前缀**（ADR-0094——与用户业务组件零命名冲突，引擎保留命名空间）：
 * - overlay 家族 shell：`autospark.dialog` / `autospark.popover` / `autospark.drawer` / `autospark.error`；
 * - 通知族：`autospark.notifications.base`（族根，外观容器 + 内容结构合一，ADR-0095 单层化）及
 *   `autospark.notifications.<type>`——type 是开放集合（用户可扩展）。
 *
 * 懒预编译纪律不变（ADR-0092）：本表只提供字符串模板，构造期经 `options.builtinComponents`
 * 注册位并入查找链，DOM 解析与 `<style global>` 注入随首次查找发生。
 */
import ACTIONS_TEMPLATE from "./actions.html?raw";
import BASE_TEMPLATE from "./notification-shell.html?raw";
import CONFIRM_TEMPLATE from "./confirm.html?raw";
import DIALOG_SHELL_TEMPLATE from "./dialog-shell.html?raw";
import DRAWER_SHELL_TEMPLATE from "./drawer-shell.html?raw";
import ERROR_TEMPLATE from "./error.html?raw";
import POPOVER_SHELL_TEMPLATE from "./popover-shell.html?raw";
import TASK_TEMPLATE from "./task.html?raw";
import TOAST_TEMPLATE from "./toast.html?raw";

// ── 通知族预设名（自 notifications/types.ts 迁入——注册名与种子表同处定义，杜绝 drift；
//    原「防 sessions 循环」理由随 presets.ts 退役失效，components 为更底层叶子，方向单向）──

/** actions 组件的预设名（type 模板内 `x-component:autospark.notifications.actions` 组合消费） */
export const ACTIONS_PRESET_NAME = "autospark.notifications.actions";

/** base 组件的预设名（type 链末端 fallback 查找名，ADR-0088） */
export const BASE_PRESET_NAME = "autospark.notifications.base";

/** 内置语义 type → 预设组件名（`types[type].render` 未配置时的默认查找名） */
export function presetComponentName(type: string): string {
    return `autospark.notifications.${type}`;
}

// ── overlay 家族 shell 注册名（ADR-0094 点前缀化：全部内置组件统一 `autospark.` 命名空间，
//    与用户业务组件零冲突；UI_SHELL_COMPONENT_NAMES 映射退役）──

/** 模态面板外壳（dialog-shell.html；`mask: true` 形态） */
export const DIALOG_SHELL_NAME = "autospark.dialog";
/** 裸面板外壳（popover-shell.html；`mask: false` 形态） */
export const POPOVER_SHELL_NAME = "autospark.popover";
/** 抽屉外壳（drawer-shell.html） */
export const DRAWER_SHELL_NAME = "autospark.drawer";
/** 内置错误呈现组件 */
export const ERROR_COMPONENT_NAME = "autospark.error";

/**
 * 内置组件种子表（ADR-0092 单文件化 → ADR-0094 注册位化 → ADR-0095 通知族单层化）：engine
 * 构造期并入 `options.builtinComponents`（用户同名覆盖优先——展开序在后）。通知族根
 * `autospark.notifications.base`（notification-shell.html——外观容器 + 内容结构合一，
 * ADR-0095）与 overlay 家族 shell（dialog/popover/drawer 各为一组件一文件）并存。
 */
export const BUILTIN_COMPONENTS: Record<string, string> = {
    [ACTIONS_PRESET_NAME]: ACTIONS_TEMPLATE,
    [BASE_PRESET_NAME]: BASE_TEMPLATE,
    [presetComponentName("toast")]: TOAST_TEMPLATE,
    [presetComponentName("task")]: TASK_TEMPLATE,
    [presetComponentName("confirm")]: CONFIRM_TEMPLATE,
    [DIALOG_SHELL_NAME]: DIALOG_SHELL_TEMPLATE,
    [POPOVER_SHELL_NAME]: POPOVER_SHELL_TEMPLATE,
    [DRAWER_SHELL_NAME]: DRAWER_SHELL_TEMPLATE,
    [ERROR_COMPONENT_NAME]: ERROR_TEMPLATE,
};
