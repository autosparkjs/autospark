/**
 * 覆盖物内置 shell（ADR-0062；ADR-0092 后模板与静态样式已随组件文件走——
 * `components/panel-shell.html` / `components/drawer-shell.html` 经 `<style global>`
 * 注册期注入，本模块仅存**动态生成**的抽屉滑入/滑出动画规则注入。
 *
 * shell 机制：覆盖物的面板层（边框/圆角/箭头/内容出口）是可替换组件——配置链
 * `x-{name}-options.shell`（成员表达式，打开时求值一次）> 宿主 `x-options` >
 * 引擎级 `options.overlay.{kind}.shell` > 内置组件（builtinComponents 种子，用户
 * `options.components` 同名覆盖）。shell 与 mask 正交：**shell 不含遮罩**（遮罩是引擎
 * 结构，mask 选项控制显隐）。
 */
import { DRAWER_SLIDE_STYLES } from "./drawer-shell";

/** 抽屉滑入动画规则 `<style>` 的 id（幂等注入判重） */
const SHELL_STYLES_ID = "autospark-shell-styles";

/**
 * 注入抽屉滑入/滑出动画规则（幂等）：唯一无法静态化的样式段（四方向 × 四相位的复合选择器
 * 矩阵由函数生成）——由 DialogDirective / PopoverDirective / DrawerDirective 的类级
 * initialize 调用（FOUC 防御：先于任何实例打开；命令式通道同样受益——消费者指令类恒
 * 注册于 presetDirectives，engine 构造即初始化）。
 *
 * 遮罩样式（`.autospark-dialog-mask`）不在此——遮罩是引擎结构（mask 选项控制显隐），
 * 样式随 `getOverlayContainer` 懒建注入（container.ts）。
 */
export function registerShellStyles(): void {
    if (typeof document === "undefined" || !document.head) return;
    if (document.getElementById(SHELL_STYLES_ID)) return;
    const style = document.createElement("style");
    style.id = SHELL_STYLES_ID;
    style.textContent = DRAWER_SLIDE_STYLES;
    document.head.appendChild(style);
}
