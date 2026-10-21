/**
 * 内置组件唯一注册面（ADR-0094）：全部内置组件的模板 `?raw` 导入、注册名常量与聚合种子表
 * 收敛于此——engine 单点引用，features 层零 `?raw` 导入（core→features 反向依赖清零，
 * 数据资产层被上层单向引用，ADR-0093）。
 *
 * 注册名**统一 `autospark.` 点前缀**（ADR-0094——与用户业务组件零命名冲突，引擎保留命名空间）：
 * - overlay 家族 shell：`autospark.dialog` / `autospark.popover` / `autospark.drawer` / `autospark.error`。
 * - 通知族已随通知插件迁出（@autospark/components ADR-0001）：`autospark.notifications.*`
 *   组件由插件自举注册，engine 零感知。
 *
 * 懒预编译纪律不变（ADR-0092）：本表只提供字符串模板，构造期经 `options.builtinComponents`
 * 注册位并入查找链，DOM 解析与 `<style global>` 注入随首次查找发生。
 */
import DIALOG_SHELL_TEMPLATE from "./dialog-shell.html?raw";
import DRAWER_SHELL_TEMPLATE from "./drawer-shell.html?raw";
import ERROR_TEMPLATE from "./error.html?raw";
import OVERLAY_TEMPLATE from "./overlay.html?raw";
import POPOVER_SHELL_TEMPLATE from "./popover-shell.html?raw";

// ── overlay 家族 shell 注册名（ADR-0094 点前缀化：全部内置组件统一 `autospark.` 命名空间，
//    与用户业务组件零冲突；UI_SHELL_COMPONENT_NAMES 映射退役）──

/** 模态面板外壳（dialog-shell.html；`mask: true` 形态） */
export const DIALOG_SHELL_NAME = "autospark.dialog";
/** 裸面板外壳（popover-shell.html；`mask: false` 形态） */
export const POPOVER_SHELL_NAME = "autospark.popover";
/** 抽屉外壳（drawer-shell.html） */
export const DRAWER_SHELL_NAME = "autospark.drawer";
/** 覆盖物结构骨架（overlay.html；header/body/footer + 七出口，ADR-0124） */
export const OVERLAY_COMPONENT_NAME = "autospark.overlay";
/** 内置错误呈现组件 */
export const ERROR_COMPONENT_NAME = "autospark.error";

/**
 * 内置组件种子表（ADR-0092 单文件化 → ADR-0094 注册位化 → ADR-0095 通知族单层化 →
 * ADR-0097 base 正名 shell + actions 子组件退役内联）：engine 构造期并入
 * `options.builtinComponents`（用户同名覆盖优先——展开序在后）。通知族组件
 * （autospark.notifications.*）已随通知插件迁出（@autospark/components ADR-0001），
 * overlay 家族 shell（dialog/popover/drawer 各为一组件一文件）保留。
 */
export const BUILTIN_COMPONENTS: Record<string, string> = {
    [DIALOG_SHELL_NAME]: DIALOG_SHELL_TEMPLATE,
    [POPOVER_SHELL_NAME]: POPOVER_SHELL_TEMPLATE,
    [DRAWER_SHELL_NAME]: DRAWER_SHELL_TEMPLATE,
    [OVERLAY_COMPONENT_NAME]: OVERLAY_TEMPLATE,
    [ERROR_COMPONENT_NAME]: ERROR_TEMPLATE,
};
