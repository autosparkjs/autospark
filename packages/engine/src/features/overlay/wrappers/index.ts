/**
 * 覆盖物内置 shell（ADR-0062；ADR-0092 后模板与静态样式已随组件文件走——
 * `components/dialog-shell.html` / `components/popover-shell.html` / `components/drawer-shell.html`
 * 经各自 `<style global id>` 注册期注入，本模块仅保留**初始化预热入口**：FOUC 防御
 * （指令类 initialize 触发 shell 组件首次解析 → global 段注入，先于任何实例打开）。
 *
 * shell 机制：覆盖物的面板层（边框/圆角/箭头/内容出口）是可替换组件——配置链
 * `x-{name}-options.shell`（成员表达式，打开时求值一次）> 宿主 `x-options` >
 * 引擎级 `options.overlay.{kind}.shell` > 内置 shell 裸键（`builtinComponents` 注册位，
 * 用户任一注册位同名覆盖）。shell 与 mask 正交：**shell 不含遮罩**（遮罩是引擎
 * 结构，mask 选项控制显隐）。抽屉滑入/滑出的动态生成矩阵（buildSlideRules）随
 * drawer-shell 组件文件注入——不再经本模块。
 */
import type { AutoSpark } from "../../../engine/engine";
import { DIALOG_SHELL_NAME, DRAWER_SHELL_NAME, POPOVER_SHELL_NAME } from "../../../components";

/**
 * 预热覆盖物 shell 组件（幂等——懒预编译缓存去重）：DialogDirective / PopoverDirective /
 * DrawerDirective 的类级 initialize 调用。触发内置 shell 裸键 `dialog` / `popover` /
 * `drawer` 的 def 构建 + `<style global>` 注册期注入（`autospark-shell-styles` /
 * `autospark-popover-styles` 容器——面板视觉与抽屉静态段；用户接管者无段即零注入）。
 * 三键各自自包含（ADR-0094 拆分后 popover 样式段独立 id），均须预热防首开 FOUC。
 *
 * 遮罩样式（`.autospark-dialog-mask`）不在此——遮罩是引擎结构（mask 选项控制显隐），
 * 样式随 `getOverlayContainer` 懒建注入（container.ts）。
 */
export function registerShellStyles(engine: AutoSpark): void {
    engine._resolveGlobalComponent(DIALOG_SHELL_NAME);
    engine._resolveGlobalComponent(POPOVER_SHELL_NAME);
    engine._resolveGlobalComponent(DRAWER_SHELL_NAME);
}
