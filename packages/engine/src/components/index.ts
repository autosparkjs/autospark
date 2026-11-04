/**
 * 内置组件唯一注册面（ADR-0094）：全部内置组件的模板 `?raw` 导入、注册名常量与聚合种子表
 * 收敛于此——engine 单点引用，features 层零 `?raw` 导入（core→features 反向依赖清零，
 * 数据资产层被上层单向引用，ADR-0093）。
 *
 * 注册名**统一 `autospark.` 点前缀**（ADR-0094——与用户业务组件零命名冲突，引擎保留命名空间）：
 * - overlay 家族 shell：`autospark.dialog` / `autospark.popover` / `autospark.drawer` / `autospark.error`。
 * - 通知族已随通知插件迁出（@autospark/plugins ADR-0001）：`autospark.notifications.*`
 *   组件由插件自举注册，engine 零感知。
 *
 * 懒预编译纪律不变（ADR-0092）：本表只提供字符串模板，构造期经 `options.builtinComponents`
 * 注册位并入查找链，DOM 解析与 `<style global>` 注入随首次查找发生。
 */
import ERROR_TEMPLATE from "./error.html?raw";
import BASE_TEMPLATE from "./base.html?raw";

// ── overlay 家族 shell 注册名（ADR-0094 点前缀化：全部内置组件统一 `autospark.` 命名空间，
//    与用户业务组件零冲突；UI_SHELL_COMPONENT_NAMES 映射退役）──

/** 内置错误呈现组件 */
export const ERROR_COMPONENT_NAME = "autospark.error";

/**
 * 内置抽象基组件（ADR-0134）：无模板基组件（`x-define.abstract`）——官方组件族经
 * `x-define:inherit="autospark.base"` 继承，自动获得主题档位 props（data-* 六键）的
 * 宿主属性物化行为。内置 engine（非 plugins IIFE）——组件插件产物只依赖 engine，
 * 无跨产物加载时序；行为纯 DOM 属性写入、零依赖 theme 代码。
 */
export const BASE_COMPONENT_NAME = "autospark.base";

/**
 * 内置组件种子表（ADR-0092 单文件化 → ADR-0094 注册位化 → ADR-0095 通知族单层化 →
 * ADR-0097 base 正名 shell + actions 子组件退役内联 → ADR-0134 抽象基组件入列）：
 * engine 构造期并入 `options.builtinComponents`（用户同名覆盖优先——展开序在后）。
 * 通知族组件（autospark.notifications.*）已随通知插件迁出（@autospark/plugins ADR-0001），
 * overlay 家族 shell（dialog/popover/drawer 各为一组件一文件）保留。
 */
export const BUILTIN_COMPONENTS: Record<string, string> = {
    [ERROR_COMPONENT_NAME]: ERROR_TEMPLATE,
    [BASE_COMPONENT_NAME]: BASE_TEMPLATE,
};
