import { buildComponentDef } from "../../compile/collect";
import type { ComponentDef } from "../../directives/component-def";
import { parseHtmlFragment } from "../../utils/transformElement";

/**
 * 任务 renderer（kind='task' 专属区组件，ADR-0077——原 task-shell 的进度槽独立成
 * kind renderer，嵌公共 shell 默认出口）。一组件一文件（`src/messages/renderers/`）。
 *
 * 进度能力归 kind='task' 提供（非通用消息功能）：`progress` 专属键经引擎整包注入
 * （data 域响应式），**进度槽由本组件全权渲染**——自定义接管 task kind（`kinds.task.render`）
 * 时进度渲染随接管者自带，本组件的进度槽不是特权通道。
 *
 * 公共元素（title/description/actions/close）不在本组件——归 shell（双层组合，ADR-0077）。
 */

/** task renderer 模板：进度槽区块（projection 位 = shell kind 出口内） */
export const TASK_RENDERER_TEMPLATE =
    `<div class="autospark-message-progress">` +
    `<div class="autospark-message-progress-track">` +
    `<div class="autospark-message-progress-bar" :style="'width:' + (progress ?? 0) + '%'"></div>` +
    `</div>` +
    `<span class="autospark-message-progress-text" x-text="(progress ?? 0) + '%'"></span>` +
    `</div>`;

/** 进度槽形态样式（语义色随 data-message-type 的 accent 联动；轨道 = accent 15% 混白） */
export const TASK_RENDERER_STYLES = `
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

/** 内置 task renderer 的定义缓存（懒构建，模块级单例） */
let builtinTaskRenderer: { snapshot: HTMLElement; def: ComponentDef | null } | null = null;

/** 解析内置 task renderer（懒构建，同 shell 纪律） */
export function resolveTaskRenderer(): { snapshot: HTMLElement; def: ComponentDef | null } {
    if (!builtinTaskRenderer) {
        const root = parseHtmlFragment(TASK_RENDERER_TEMPLATE)!.firstElementChild as HTMLElement;
        root.setAttribute("x-define", "task");
        const def = buildComponentDef(root, "task", (msg) => console.warn(msg));
        builtinTaskRenderer = { snapshot: def.snapshot, def };
    }
    return builtinTaskRenderer;
}
