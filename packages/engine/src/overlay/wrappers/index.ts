/**
 * 覆盖物内置 shell 注册表（ADR-0062）。
 *
 * **shell 机制**：覆盖物的面板层（边框/圆角/箭头/内容出口）是可替换组件——配置链
 * `x-{name}-options.shell`（成员表达式，打开时求值一次）> 宿主 `x-options` >
 * 引擎级 `options.overlay.{kind}.shell` > 内置默认（本表）。shell 与 mask 正交：
 * **shell 不含遮罩**（遮罩是引擎结构，mask 选项控制显隐）。
 *
 * 内置 shell 是**引擎私有组件**：不进用户 `options.components` 命名空间（用户可自由注册
 * 同名组件互不干扰），查找链「用户组件（scope 链 + 全局表）→ 本表」；用户名未命中
 * warn + 回退内置默认（弹窗照常工作，失效可发现）。模板字符串经 `buildComponentDef`
 * 懒构建（模块级缓存，与 engine 实例无关——def/snapshot 纯静态）。
 */
import type { ComponentDef } from "../../directives/component-def";
import { buildComponentDef } from "../../compile/collect";
import { parseHtmlFragment } from "../../utils/transformElement";
import { PANEL_SHELL_TEMPLATE, PANEL_SHELL_STYLES } from "./panel-shell";
import { DRAWER_SHELL_TEMPLATE, DRAWER_SHELL_STYLES } from "./drawer-shell";

export { PANEL_SHELL_TEMPLATE, PANEL_SHELL_STYLES };
export { DRAWER_SHELL_TEMPLATE, DRAWER_SHELL_STYLES };

/** 内置默认 shell 名（按消费者形态分键，ADR-0062；drawer 键随 x-drawer 落地，ADR-0063） */
export const BUILTIN_SHELL_NAMES: Record<string, string> = {
    dialog: "dialog-shell",
    popover: "popover-shell",
    drawer: "drawer-shell",
};

/** 内置 shell 的模板（dialog/popover 同构共用面板模板；drawer 形态分化——直角/无箭头载体） */
const BUILTIN_SHELL_TEMPLATES: Record<string, string> = {
    "dialog-shell": PANEL_SHELL_TEMPLATE,
    "popover-shell": PANEL_SHELL_TEMPLATE,
    "drawer-shell": DRAWER_SHELL_TEMPLATE,
};

/** 内置 shell 定义缓存（name → { snapshot, def }；懒构建，模块级单例） */
const builtinShellCache = new Map<string, { snapshot: HTMLElement; def: ComponentDef | null }>();

/**
 * 解析内置 shell（懒构建）：模板字符串 parse → 根打 `x-define` → `buildComponentDef`
 * 一次产出快照与 def（slots 出口清单含默认出口——面板模板带 `<div x-slot>`）。
 */
export function resolveBuiltinShell(name: string): { snapshot: HTMLElement; def: ComponentDef | null } {
    let hit = builtinShellCache.get(name);
    if (!hit) {
        const template = BUILTIN_SHELL_TEMPLATES[name] ?? PANEL_SHELL_TEMPLATE;
        const root = parseHtmlFragment(template)!.firstElementChild as HTMLElement;
        root.setAttribute("x-define", name);
        const def = buildComponentDef(root, name, (msg) => console.warn(msg));
        hit = { snapshot: def.snapshot, def };
        builtinShellCache.set(name, hit);
    }
    return hit;
}

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
