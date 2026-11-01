/**
 * 覆盖物内置 shell（ADR-0062/0092；ADR-0128 批次 4 随 overlay 家族外移插件化）：
 * 三份 shell 模板资产随插件走（mechanism/shells/*.html），bootstrap 期注册进
 * `AutoSpark.components` 全局表（`autospark.*` 保留命名空间，用户同名覆盖优先——
 * 查询期委托，晚注册即生效）。
 *
 * 原 engine 侧 FOUC 预热（`_resolveGlobalComponent` 私有 API 指令类 initialize 触发）
 * 退役：shell def 的懒预编译改由首个打开实例触发（同步编译、首开瞬时——预编译缓存
 * 全局共享，仅首 engine 首开承担一次）。
 *
 * shell 机制：覆盖物的面板层（边框/圆角/箭头/内容出口）是可替换组件——配置链
 * `x-{name}-options.shell`（成员表达式，打开时求值一次）> 宿主 `x-options` >
 * 引擎级 `options.overlay.{kind}.shell` > 全局表内置 shell（用户任一注册位同名
 * 覆盖）。shell 与 mask 正交：**shell 不含遮罩**（遮罩是引擎结构，mask 选项控制
 * 显隐）。抽屉滑入/滑出的动态生成矩阵（buildSlideRules）在 ./drawer-shell.ts。
 */
import type { AutoSpark } from "autospark";
import { DIALOG_SHELL_NAME, DRAWER_SHELL_NAME, POPOVER_SHELL_NAME } from "../../../../utils/shellNames";
import DIALOG_SHELL_TEMPLATE from "../shells/dialog-shell.html?raw";
import DRAWER_SHELL_TEMPLATE from "../shells/drawer-shell.html?raw";
import POPOVER_SHELL_TEMPLATE from "../shells/popover-shell.html?raw";

/**
 * 注册内置 shell（幂等：用户同名值优先不覆盖）——bootstrap 的 register 回调内调用
 * （此时命名空间必已可达）。注册即挂全局表，查找链（scope 局部 → options.components
 * → 全局表）自然命中。
 */
export function registerBuiltinShells(autospark: typeof AutoSpark): void {
    const table = autospark.components as Record<string, string | undefined>;
    if (table[DIALOG_SHELL_NAME] === undefined) table[DIALOG_SHELL_NAME] = DIALOG_SHELL_TEMPLATE;
    if (table[POPOVER_SHELL_NAME] === undefined) table[POPOVER_SHELL_NAME] = POPOVER_SHELL_TEMPLATE;
    if (table[DRAWER_SHELL_NAME] === undefined) table[DRAWER_SHELL_NAME] = DRAWER_SHELL_TEMPLATE;
}
