/** 模态面板外壳（dialog-shell.html；`mask: true` 形态） */
export declare const DIALOG_SHELL_NAME = "autospark.dialog";
/** 裸面板外壳（popover-shell.html；`mask: false` 形态） */
export declare const POPOVER_SHELL_NAME = "autospark.popover";
/** 抽屉外壳（drawer-shell.html） */
export declare const DRAWER_SHELL_NAME = "autospark.drawer";
/** 覆盖物结构骨架（overlay.html；header/body/footer + 七出口，ADR-0124） */
export declare const OVERLAY_COMPONENT_NAME = "autospark.overlay";
/** 内置错误呈现组件 */
export declare const ERROR_COMPONENT_NAME = "autospark.error";
/**
 * 内置组件种子表（ADR-0092 单文件化 → ADR-0094 注册位化 → ADR-0095 通知族单层化 →
 * ADR-0097 base 正名 shell + actions 子组件退役内联）：engine 构造期并入
 * `options.builtinComponents`（用户同名覆盖优先——展开序在后）。通知族组件
 * （autospark.notifications.*）已随通知插件迁出（@autospark/plugins ADR-0001），
 * overlay 家族 shell（dialog/popover/drawer 各为一组件一文件）保留。
 */
export declare const BUILTIN_COMPONENTS: Record<string, string>;
