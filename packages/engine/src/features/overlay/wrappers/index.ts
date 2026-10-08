/**
 * 覆盖物内置 shell（ADR-0062；ADR-0092 后模板与静态样式已随组件文件走——
 * `components/panel-shell.html` / `components/drawer-shell.html` 经 `<style global
 * id="autospark-shell-styles">` 注册期注入，本模块仅保留**初始化预热入口**：FOUC 防御
 * （指令类 initialize 触发 shell 组件首次解析 → global 段注入，先于任何实例打开）。
 *
 * shell 机制：覆盖物的面板层（边框/圆角/箭头/内容出口）是可替换组件——配置链
 * `x-{name}-options.shell`（成员表达式，打开时求值一次）> 宿主 `x-options` >
 * 引擎级 `options.overlay.{kind}.shell` > 内置组件（builtinComponents 种子，用户
 * `options.components` 同名覆盖）。shell 与 mask 正交：**shell 不含遮罩**（遮罩是引擎
 * 结构，mask 选项控制显隐）。抽屉滑入/滑出的动态生成矩阵（buildSlideRules）随
 * drawer-shell 组件文件注入——不再经本模块。
 */
import type { AutoSpark } from "../../../engine/engine";

/**
 * 预热覆盖物 shell 组件（幂等——懒预编译缓存去重）：DialogDirective / PopoverDirective /
 * DrawerDirective 的类级 initialize 调用。触发 `autospark.overlays.panel-shell` /
 * `autospark.overlays.drawer-shell` 的 def 构建 + `<style global>` 注册期注入
 * （`autospark-shell-styles` 容器——含面板视觉与抽屉静态段；用户接管者无段即零注入）。
 *
 * 遮罩样式（`.autospark-dialog-mask`）不在此——遮罩是引擎结构（mask 选项控制显隐），
 * 样式随 `getOverlayContainer` 懒建注入（container.ts）。
 */
export function registerShellStyles(engine: AutoSpark): void {
    engine._resolveGlobalComponent("autospark.overlays.panel-shell");
    engine._resolveGlobalComponent("autospark.overlays.drawer-shell");
}
