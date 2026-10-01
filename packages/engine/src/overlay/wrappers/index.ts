/**
 * 覆盖物内置 shell 模板（ADR-0062；注册表随 ADR-0077 迁移至 `options.uiShells`）。
 *
 * **shell 机制**：覆盖物的面板层（边框/圆角/箭头/内容出口）是可替换组件——配置链
 * `x-{name}-options.shell`（成员表达式，打开时求值一次）> 宿主 `x-options` >
 * 引擎级 `options.overlay.{kind}.shell` > `options.uiShells` 注册表（本目录模板为其
 * **内置种子**：dialog/popover 共用面板模板、drawer 形态分化）。shell 与 mask 正交：
 * **shell 不含遮罩**（遮罩是引擎结构，mask 选项控制显隐）。
 *
 * 懒预编译与缓存已上收 engine 侧（`engine._resolveUiShell`——构造期固化、用户浅覆盖
 * 同键生效）；本模块只保留模板与样式注入。样式经 `registerShellStyles()` 幂等注入
 * （非 scoped、引用无关——多实例共享一份，与组件 scoped CSS 的引用计数机制无关）。
 */
import { PANEL_SHELL_TEMPLATE, PANEL_SHELL_STYLES } from "./panel-shell";
import { DRAWER_SHELL_TEMPLATE, DRAWER_SHELL_STYLES } from "./drawer-shell";

export { PANEL_SHELL_TEMPLATE, PANEL_SHELL_STYLES };
export { DRAWER_SHELL_TEMPLATE, DRAWER_SHELL_STYLES };

/** shell 视觉样式 <style> 的 id（幂等注入判重） */
const SHELL_STYLES_ID = "autospark-shell-styles";

/**
 * 注入 shell 默认视觉样式（幂等）：面板视觉（圆角/边框/背景/箭头伪元素/placement 方向
 * 偏移/裸面板 z-index，自 dialog 形态样式迁移）+ 抽屉形态（直角/短轴变量尺寸/'drawer'
 * 动画，ADR-0063）——由 DialogDirective / PopoverDirective / DrawerDirective 的类级
 * initialize 调用（FOUC 防御：先于任何实例打开；命令式通道同样受益——消费者指令类恒
 * 注册于 presetDirectives，engine 构造即初始化）。
 *
 * 遮罩样式（`.autospark-dialog-mask`）**不在此**——遮罩是引擎结构（mask 选项控制显隐），
 * 样式随 `getOverlayContainer` 懒建注入（container.ts）。
 */
export function registerShellStyles(): void {
    if (typeof document === "undefined" || !document.head) return;
    if (document.getElementById(SHELL_STYLES_ID)) return;
    const style = document.createElement("style");
    style.id = SHELL_STYLES_ID;
    style.textContent = PANEL_SHELL_STYLES + "\n" + DRAWER_SHELL_STYLES;
    document.head.appendChild(style);
}
