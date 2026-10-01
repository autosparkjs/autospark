import { buildComponentDef } from "../../compile/collect";
import type { ComponentDef } from "../../directives/component-def";
import { parseHtmlFragment } from "../../utils/transformElement";

/**
 * 消息公共骨架（ADR-0077 双层组合，原 message-shell 更名收窄）——**所有 kind 共享**的
 * shell 组件：渲染公共元素与行为（close 按钮 / type 图标 / title / description / actions
 * 行最底），并声明 **kind 默认出口**（裸 `x-slot`）承载各 kind 的专属 renderer（如 task
 * 进度条）。一组件一文件（`src/messages/renderers/` 目录纪律）。
 *
 * 与面板外壳（panel-shell，ADR-0062）**同构对齐**（ADR-0077 推翻「无出口协议」旧分野）：
 * 外壳负责公共骨架、内容组件（kind renderer）经默认出口进入；区别仅在于消息无遮罩/定位。
 * 自定义 shell 契约：模板须含默认出口（裸 `x-slot`）——未声明 → warn + kind 区丢弃
 * （数据仍在 items / `$session`，仅视觉缺位，可发现）；可消费 `$session`（行为）与
 * data 域全量 props（title/description/actions/read/…）。
 *
 * MessageProps 全量数据域整包注入（剥函数）：引擎注入前解析派生键——`type`→`icon`
 * （icons 映射）、`actions` 字符串名→解析合成。真响应式活体：同 id 原地更新 /
 * `update(id, patch)` = 引擎写 data 域 props，绑定自动响应。
 *
 * 行为契约分工：模板只渲染形态——按钮点击（actions handle/value + hide 语义）、关闭钮
 * 点击与「任意点击置已读」由 MessageManager 在卡片根上**委托监听**
 * （`data-message-action` 索引 / `autospark-message-close` 类名命中），模板不绑 `@click`。
 *
 * 模板指令清单：`x-html`（title/description，sanitizer 默认通道）/ `x-show`（图标区、link、
 * 按钮行、关闭钮显隐）/ `x-for`（按钮行，x-loading 按钮行同构）/ `x-icon`（图标，值两栖）/
 * `:data-message-type`（语义分派属性绑定）/ `x-slot`（kind 默认出口）。不用 `x-if`（KISS，
 * 显隐均可用 x-show 表达，避开结构指令接管子树编译）。
 */

/** 消息 shell 模板：双类名根 + 图标 + 消息列（title/link/description/kind 出口）+ actions 独立行 + 关闭钮 */
export const SHELL_TEMPLATE =
    `<div class="autospark-dialog autospark-message" :data-message-type="type">` +
    `<div class="autospark-message-main">` +
    `<i class="autospark-message-icon" x-icon="icon" x-show="icon" aria-hidden="true"></i>` +
    `<div class="autospark-message-content">` +
    `<div class="autospark-message-title-row">` +
    `<span class="autospark-message-title" x-html="title"></span>` +
    `<a class="autospark-message-link" x-show="link" :href="link" target="_blank" rel="noopener noreferrer" aria-label="查看详情"><i class="autospark-message-link-icon" x-icon="'external'" aria-hidden="true"></i></a>` +
    `</div>` +
    `<div class="autospark-message-description" x-html="description" x-show="description"></div>` +
    `<div class="autospark-message-kind" x-slot></div>` +
    `</div>` +
    `<button class="autospark-message-close" type="button" x-show="closable" x-icon="'no'" aria-label="关闭"></button>` +
    `</div>` +
    `<div class="autospark-message-actions" x-show="actions.length > 0" x-for="a of actions">` +
    `<button class="autospark-message-action" type="button" x-text="a.title" :data-message-action="actions.indexOf(a)"></button>` +
    `</div>` +
    `</div>`;

/**
 * 消息 shell 默认视觉（语义色沿现行 toast 实现契约，ADR-0068 决策 13 的左 3px accent
 * 条未随实现保留、废止）：
 *
 * - 双类名根：`autospark-dialog` 承担圆角（panel-shell 形态样式）；边框/背景/阴影由本表
 *   承担——复用同一批 CSS 变量（`--autospark-overlay-bg/-border`），主题换肤一处生效；
 * - **语义色 = 全边 border + 同色系超淡底（color-mix 7% 混白）+ 图标着色**：内部单一消费点
 *   `--autospark-message-accent`，各 type 经 `data-message-type` 分派到用户换肤接口
 *   `--autospark-message-{type}-color`；`none` 不匹配任何分派规则 → 灰边白底纯中性；
 * - **slide 方向自适应覆写层**（ADR-0068 决策 16 沿用）：按卡片根 `data-message-pos` 前缀/
 *   后缀换 from 值；`leave-to` = `enter-from` 同值视觉对称；duration 保持内置默认 300ms。
 *
 * 非 scoped、引用无关——多实例共享一份，经 `injectMessageStyles()` 幂等注入（styles.ts 合并注入）。
 */
export const SHELL_STYLES = `
/* 卡片形态：纵向堆叠骨架。阴影轻于 dialog 面板的 0 8px 30px——非模态消息浮于页面上
   而非遮罩上，量级对齐 tooltip */
.autospark-message {
  border: 1px solid var(--autospark-overlay-border, rgba(0, 0, 0, 0.1));
  background: var(--autospark-overlay-bg, #fff);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  box-sizing: border-box;
  max-width: var(--autospark-message-max-w, 360px);
  font-size: 14px;
  line-height: 1.5;
  color: var(--autospark-message-fg, #1f2329);
}
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
/* kind 出口（ADR-0077）：kind renderer 投影位——空 renderer（toast/confirm 占位）零内容
   天然不占位，有内容时与 description 同列排布 */
/* actions 独立行（link 形态，无边框）——最底（kind 出口之后） */
.autospark-message-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding-left: 25px; /* 与 content 列对齐（图标 17px + gap 8px） */
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
  padding: 0;
  font-size: 13px;
  color: inherit;
  opacity: 0.45;
  cursor: pointer;
}
.autospark-message-close:hover { opacity: 0.9; }
/* 语义色分派（双层变量：用户覆盖 --autospark-message-{type}-color 一处即换肤）。
   着色面 = 全边 border + 同色系超淡底（color-mix 混白，随 accent 联动）+ 图标着色；
   none 不命中任何规则 = 灰边白底纯中性 */
.autospark-message[data-message-type="info"] {
  --autospark-message-accent: var(--autospark-message-info-color, #409eff);
  border-color: var(--autospark-message-accent);
  background: color-mix(in srgb, var(--autospark-message-accent) 7%, var(--autospark-overlay-bg, #fff));
}
.autospark-message[data-message-type="success"] {
  --autospark-message-accent: var(--autospark-message-success-color, #67c23a);
  border-color: var(--autospark-message-accent);
  background: color-mix(in srgb, var(--autospark-message-accent) 7%, var(--autospark-overlay-bg, #fff));
}
.autospark-message[data-message-type="warn"] {
  --autospark-message-accent: var(--autospark-message-warn-color, #e6a23c);
  border-color: var(--autospark-message-accent);
  background: color-mix(in srgb, var(--autospark-message-accent) 7%, var(--autospark-overlay-bg, #fff));
}
.autospark-message[data-message-type="error"] {
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
