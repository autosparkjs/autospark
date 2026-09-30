import { MESSAGE_SHELL_TEMPLATE } from "./message-shell";
import { buildComponentDef } from "../../compile/collect";
import type { ComponentDef } from "../../directives/component-def";
import { parseHtmlFragment } from "../../utils/transformElement";

/**
 * 任务外壳（shell 机制延伸，ADR-0071 决策 16）——kind='task' 消息的内置私有组件。
 * 一组件一文件（`src/messages/renders/` 目录纪律，Q24 补充决策）。
 *
 * 进度能力归 kind='task' 提供（非通用消息功能，决策 12）：`progress` 专属键经引擎整包注入
 * （data 域响应式），**进度槽由本组件全权渲染**——自定义接管 task kind 时进度渲染随接管者
 * 自带，本组件的进度槽不是特权通道。**actions 行与 message-shell 同构照常渲染**（如「取消」
 * 按钮——handle 调 `task.cancel()`，引擎不自动注入取消动作）。
 *
 * 骨架位置（决策 21 纵向堆叠）：进度槽插在 title 行与 body 之间（进度为主状态、body 为其
 * 注解——上传卡片惯例：标题 / 进度条 / 统计说明）。实现为 message-shell 模板在 content 列
 * 内插入进度区块（同 x-show 显隐纪律，不用 x-if）。
 */

/** 进度槽区块（插在 title-row 与 body 之间） */
const PROGRESS_SECTION =
    `<div class="autospark-message-progress">` +
    `<div class="autospark-message-progress-track">` +
    `<div class="autospark-message-progress-bar" :style="'width:' + (progress ?? 0) + '%'"></div>` +
    `</div>` +
    `<span class="autospark-message-progress-text" x-text="(progress ?? 0) + '%'"></span>` +
    `</div>`;

/** task-shell 模板：message-shell 骨架 + 进度槽（title-row 之后、body 之前） */
export const TASK_SHELL_TEMPLATE = MESSAGE_SHELL_TEMPLATE.replace(
    `<div class="autospark-message-body"`,
    PROGRESS_SECTION + `<div class="autospark-message-body"`,
);

/** 进度槽形态样式（语义色随 data-message-type 的 accent 联动；轨道 = accent 15% 混白） */
export const TASK_SHELL_STYLES = `
.autospark-message-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.autospark-message-progress-track {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--autospark-message-accent, #999) 15%, var(--autospark-overlay-bg, #fff));
  overflow: hidden;
}
.autospark-message-progress-bar {
  height: 100%;
  border-radius: 3px;
  background: var(--autospark-message-accent, #409eff);
  transition: width 0.2s;
}
.autospark-message-progress-text {
  flex: none;
  font-size: 12px;
  opacity: 0.75;
  min-width: 34px;
  text-align: right;
}
`;

/** 内置 task-shell 的定义缓存（懒构建，模块级单例） */
let builtinTaskShell: { snapshot: HTMLElement; def: ComponentDef | null } | null = null;

/** 解析内置 task-shell（懒构建，同 message-shell 纪律） */
export function resolveBuiltinTaskShell(): { snapshot: HTMLElement; def: ComponentDef | null } {
    if (!builtinTaskShell) {
        const root = parseHtmlFragment(TASK_SHELL_TEMPLATE)!.firstElementChild as HTMLElement;
        root.setAttribute("x-define", "task-shell");
        const def = buildComponentDef(root, "task-shell", (msg) => console.warn(msg));
        builtinTaskShell = { snapshot: def.snapshot, def };
    }
    return builtinTaskShell;
}
