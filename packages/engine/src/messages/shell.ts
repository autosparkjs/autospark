import { buildComponentDef } from "../compile/collect";
import type { ComponentDef } from "../directives/component-def";
import { parseHtmlFragment } from "../utils/transformElement";

/**
 * 消息公共骨架（ADR-0077 双层组合 → **ADR-0088 内容下放降级**）——**所有 type 共享**的
 * 卡片级外观容器：只渲染 chrome（卡片根的边框 / 背景 / 阴影 / 圆角 + **close 钮**）并声明
 * **type 默认出口**（裸 `x-slot`）——icon/title/description/link/actions 等**内容渲染归
 * type 模板**（ADR-0088，经出口 `mode:"live"` 投影）。接管 shell = 换整卡外观（含关闭钮
 * 形态）——「换外观」与「换内容」（同名覆盖 type 模板）两个扩展点正交。独立于 presets.ts /
 * sessions/（外观与内容正交）。
 *
 * 与面板外壳（panel-shell，ADR-0062）**同构对齐**：外壳负责公共骨架、内容组件经默认出口
 * 进入；区别仅在于消息无遮罩/定位。自定义 shell 契约：模板须含默认出口（裸 `x-slot`）——
 * 未声明 → warn + type 区丢弃（数据仍在 items / `$session`，仅视觉缺位，可发现）；可消费
 * `$session`（行为）与 data 域全量 props（closable 驱动关闭钮显隐等）。
 *
 * MessageProps 数据域（剥函数整包，ADR-0088）注入；真响应式活体：同 id 原地更新 /
 * `update(id, patch)` = 引擎写 data 域 props，绑定自动响应。
 *
 * 行为契约分工：模板只渲染形态——关闭钮点击与「任意点击置已读」由 MessageManager 在卡片
 * 根上**委托监听**（`autospark-message-close` 类名命中），模板不绑 `@click`；action 按钮的
 * 委托契约类名 / 索引归 actions 组件（presets.ts）。
 *
 * 卡片根属性（`data-message-pos` / `data-message-level` / `data-message-type`）由引擎装配
 * 期静态写入与刷新（ADR-0088——原 `:data-message-type` 模板绑定改引擎写，用户 shell 的
 * wrapper 同享契约）——不依赖模板绑定，自定义 shell 同享。
 */

/** 消息 shell 模板（ADR-0088 降级形态）：外观根（body 出口 + close 钮） */
export const SHELL_TEMPLATE = `<div class="autospark-dialog autospark-message">
<div class="autospark-message-body"><div x-slot></div></div>
<button class="autospark-message-close" type="button" x-show="closable" x-icon="'no'" aria-label="关闭"></button>
</div>`;

/**
 * 消息 shell 默认视觉（ADR-0088 降级后只承载卡片 chrome 与内容区公共样式——内容结构样式
 * 仍全局注入：base/task 模板复用同名类，用户接管模板同享）：
 *
 * - 双类名根：`autospark-dialog` 承担圆角（panel-shell 形态样式）；根为**横向行**（body
 *   弹性伸展 + close 收尾）——内容纵向堆叠移入 `.autospark-message-body` 列；
 * - **语义色 = 全边 border + 同色系超淡底（color-mix 7% 混白）+ 图标着色**：内部单一消费点
 *   `--autospark-message-accent`，各 level 经 `data-message-level` 分派到用户换肤接口
 *   `--autospark-message-{level}-color`；`none` 不匹配任何分派规则 → 灰边白底纯中性；
 * - **slide 方向自适应覆写层**（ADR-0068 决策 16 沿用）：按卡片根 `data-message-pos` 前缀/
 *   后缀换 from 值；`leave-to` = `enter-from` 同值视觉对称；duration 保持内置默认 300ms。
 *
 * 非 scoped、引用无关——多实例共享一份，经 `injectMessageStyles()` 幂等注入（styles.ts 合并注入）。
 */
export const SHELL_STYLES = `
/* 卡片形态（ADR-0088：横向行 body + close；内容纵向堆叠在 body 列内）。阴影轻于 dialog
   面板的 0 8px 30px——非模态消息浮于页面上而非遮罩上，量级对齐 tooltip */
.autospark-message {
  border: 1px solid var(--autospark-overlay-border, rgba(0, 0, 0, 0.1));
  background: var(--autospark-overlay-bg, #fff);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  box-sizing: border-box;
  max-width: var(--autospark-message-max-w, 360px);
  font-size: 14px;
  line-height: 1.5;
  color: var(--autospark-message-fg, #1f2329);
}
/* type 模板投影位（ADR-0088）：body 弹性伸展承接整卡内容 */
.autospark-message-body {
  flex: 1;
  min-width: 0;
}
/* 内容主行（icon + 内容列）——base/task 模板复用 */
.autospark-message-main {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.autospark-message-icon {
  flex: none;
  display: inline-flex;
  font-size: 17px;
  color: var(--autospark-message-accent, transparent);
}
.autospark-message-content {
  flex: 1;
  min-width: 0;
}
.autospark-message-title-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.autospark-message-title { overflow-wrap: break-word; }
.autospark-message-link {
  flex: none;
  text-decoration: none;
  font-size: 12px;
  color: var(--autospark-message-accent, inherit);
}
/* 外链图标（内置 external，x-icon 注入 svg） */
.autospark-message-link-icon {
  display: inline-flex;
  font-size: 13px;
}
.autospark-message-description {
  font-size: 12px;
  opacity: 0.75;
  margin-top: 2px;
  overflow-wrap: break-word;
}
/* actions 独立行（link 形态，无边框）——内容行之后（actions 组件根） */
.autospark-message-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
}
.autospark-message-action {
  flex: none;
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  font-size: 13px;
  color: var(--autospark-message-accent, #409eff);
  cursor: pointer;
}
.autospark-message-close {
  flex: none;
  display: inline-flex;
  align-items: center;
  border: none;
  background: none;
  padding: 2px;
  font-size: 13px;
  color: inherit;
  opacity: 0.45;
  cursor: pointer;
}
.autospark-message-close:hover { opacity: 0.9; }
/* 语义色分派（双层变量：用户覆盖 --autospark-message-{level}-color 一处即换肤）。
   着色面 = 全边 border + 同色系超淡底（color-mix 混白，随 accent 联动）+ 图标着色；
   选择器挂 data-message-level（ADR-0079——原 data-message-type 已让位业务类别）；
   none 不命中任何规则 = 灰边白底纯中性 */
.autospark-message[data-message-level="info"] {
  --autospark-message-accent: var(--autospark-message-info-color, #409eff);
  border-color: var(--autospark-message-accent);
  background: color-mix(in srgb, var(--autospark-message-accent) 7%, var(--autospark-overlay-bg, #fff));
}
.autospark-message[data-message-level="success"] {
  --autospark-message-accent: var(--autospark-message-success-color, #67c23a);
  border-color: var(--autospark-message-accent);
  background: color-mix(in srgb, var(--autospark-message-accent) 7%, var(--autospark-overlay-bg, #fff));
}
.autospark-message[data-message-level="warn"] {
  --autospark-message-accent: var(--autospark-message-warn-color, #e6a23c);
  border-color: var(--autospark-message-accent);
  background: color-mix(in srgb, var(--autospark-message-accent) 7%, var(--autospark-overlay-bg, #fff));
}
.autospark-message[data-message-level="error"] {
  --autospark-message-accent: var(--autospark-message-error-color, #f56c6c);
  border-color: var(--autospark-message-accent);
  background: color-mix(in srgb, var(--autospark-message-accent) 7%, var(--autospark-overlay-bg, #fff));
}
/* slide 方向自适应覆写层（specificity 高于全局内置裸类名规则；只换 transform 的 from 值，
   opacity 分量从内置规则级联保留；角列横向规则后声明覆盖纵向前缀命中） */
.autospark-message { --message-slide-from: translateY(-12px); }
.autospark-message[data-message-pos="center"] { --message-slide-from: translateY(-12px); }
.autospark-message[data-message-pos^="top"] { --message-slide-from: translateY(-12px); }
.autospark-message[data-message-pos^="bottom"] { --message-slide-from: translateY(12px); }
.autospark-message[data-message-pos$="-left"] { --message-slide-from: translateX(-12px); }
.autospark-message[data-message-pos$="-right"] { --message-slide-from: translateX(12px); }
.autospark-message.slide-enter-from,
.autospark-message.slide-leave-to { transform: var(--message-slide-from, translateY(-12px)); }
`;

/** 内置消息 shell 的定义缓存（懒构建，模块级单例） */
let builtinShell: { snapshot: HTMLElement; def: ComponentDef | null } | null = null;

/**
 * 解析内置消息 shell（懒构建）：模式与 overlay `resolveBuiltinShell` 同构——模板字符串
 * parse → 根打 `x-define` → `buildComponentDef` 一次产出快照与 def（slots 出口清单含
 * 默认出口——模板带 `<div x-slot>`）。内置 shell 是引擎私有组件：不进用户
 * `options.components` 命名空间（同名互不干扰）。模块级缓存与 engine 实例无关。
 */
export function resolveMessageShell(): { snapshot: HTMLElement; def: ComponentDef | null } {
    if (!builtinShell) {
        const root = parseHtmlFragment(SHELL_TEMPLATE)!.firstElementChild as HTMLElement;
        root.setAttribute("x-define", "shell");
        const def = buildComponentDef(root, "shell", (msg) => console.warn(msg));
        builtinShell = { snapshot: def.snapshot, def };
    }
    return builtinShell;
}
