import { buildComponentDef } from "../../compile/collect";
import type { ComponentDef } from "../../directives/component-def";
import { parseHtmlFragment } from "../../utils/transformElement";

/**
 * 消息外壳（shell 机制延伸，ADR-0071 决策 16）——消息单项卡片的**默认**内置私有组件。
 * 一组件一文件（`src/messages/renders/` 目录纪律，Q24 补充决策）。
 *
 * 与面板外壳（panel-shell，ADR-0062）的两点分野：
 *
 * - **无出口协议**：消息没有内容组件投影概念——title/body 是 props 键不是组件，模板直接
 *   `x-html` 消费（消毒随 x-html 默认通道）；不走 live 投影、`x-slot` 不适用；
 * - **MessageProps 全量数据域整包注入**（剥函数）：引擎注入前解析派生键——`type`→`icon`
 *   （icons 映射）、`actions` 字符串名→解析合成（render 拿到即解析后形态）。
 *
 * 真响应式活体：同 id 原地更新 / `update(id, patch)` = 引擎写 data 域 props，`x-html` /
 * `x-show` / 属性绑定自动响应（instantiateDetachedComponent 管道红利）。
 *
 * **卡片骨架（纵向堆叠，Q27 预览修订）**：① 图标 + title 行（行尾关闭钮 + href 外链）→
 * ③ body（小一号，缩进对齐）→ ④ actions 独立行（link 形态，不与 title 同行）。
 * task-shell（同目录）在同位置插入进度槽（title 与 body 之间）。
 *
 * 行为契约分工（对齐 ADR-0062「行为挂实例、形态挂外壳」）：模板只渲染形态——按钮点击
 * （actions handle/value + hide 语义）、关闭钮点击与「任意点击置已读」由 MessageManager 在
 * 卡片根上**委托监听**（`data-message-action` 索引 / `autospark-message-close` 类名命中），
 * 模板不绑 `@click`。
 *
 * 模板指令清单：`x-html`（title/body，sanitizer 默认通道）/ `x-show`（图标区、href、按钮行、
 * 关闭钮的响应式显隐）/ `x-for`（按钮行，x-loading 按钮行同构）/ `x-icon`（图标，值两栖）/
 * `:data-message-type`（语义分派属性绑定）。不用 `x-if`：显隐均可用 x-show 表达（display:none
 * 零占位），避开结构指令接管子树编译与同元素多指令的相互干扰（KISS，toast-shell 同款）。
 */

/** message-shell 模板：双类名根 + 图标 + 消息列（title/href/body）+ actions 独立行 + 关闭钮 */
export const MESSAGE_SHELL_TEMPLATE =
    `<div class="autospark-dialog autospark-message" :data-message-type="type">` +
    `<div class="autospark-message-main">` +
    `<i class="autospark-message-icon" x-icon="icon" x-show="icon" aria-hidden="true"></i>` +
    `<div class="autospark-message-content">` +
    `<div class="autospark-message-title-row">` +
    `<span class="autospark-message-title" x-html="title"></span>` +
    `<a class="autospark-message-href" x-show="href" :href="href" target="_blank" rel="noopener noreferrer" aria-label="查看详情"><span aria-hidden="true">↗</span></a>` +
    `</div>` +
    `<div class="autospark-message-body" x-html="body" x-show="body"></div>` +
    `</div>` +
    `<button class="autospark-message-close" type="button" x-show="closable" x-icon="'no'" aria-label="关闭"></button>` +
    `</div>` +
    `<div class="autospark-message-actions" x-show="actions.length > 0" x-for="a of actions">` +
    `<button class="autospark-message-action" type="button" x-text="a.title" :data-message-action="actions.indexOf(a)"></button>` +
    `</div>` +
    `</div>`;

/**
 * message-shell 默认视觉（语义色沿**现行 toast 实现契约**，ADR-0068 决策 13 的左 3px accent
 * 条未随实现保留、废止）：
 *
 * - 双类名根：`autospark-dialog` 承担圆角（panel-shell 形态样式）；边框/背景/阴影因不打
 *   `data-overlay-border`（overlay 专属契约）而由本表承担——复用同一批 CSS 变量
 *   （`--autospark-overlay-bg/-border`），主题换肤一处生效；
 * - **语义色 = 全边 border + 同色系超淡底（color-mix 7% 混白）+ 图标着色**：内部单一消费点
 *   `--autospark-message-accent`，各 type 经 `data-message-type` 分派到用户换肤接口
 *   `--autospark-message-{type}-color`；`none` 不匹配任何分派规则 → 灰边白底纯中性；
 * - **slide 方向自适应覆写层**（ADR-0068 决策 16 沿用）：按卡片根 `data-message-pos` 前缀/
 *   后缀换 from 值；`leave-to` = `enter-from` 同值视觉对称；duration 保持内置默认 300ms。
 *
 * 非 scoped、引用无关——多实例共享一份，经 `injectMessageStyles()` 幂等注入（styles.ts 合并注入）。
 */
export const MESSAGE_SHELL_STYLES = `
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
.autospark-message-href {
  flex: none;
  text-decoration: none;
  font-size: 12px;
  color: var(--autospark-message-accent, inherit);
}
.autospark-message-body {
  font-size: 12px;
  opacity: 0.75;
  margin-top: 2px;
  overflow-wrap: break-word;
}
/* actions 独立行（link 形态，无边框） */
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

/** 内置 message-shell 的定义缓存（懒构建，模块级单例） */
let builtinMessageShell: { snapshot: HTMLElement; def: ComponentDef | null } | null = null;

/**
 * 解析内置 message-shell（懒构建，ADR-0068 决策 2 同构）：模式与 overlay `resolveBuiltinShell`
 * 同构——模板字符串 parse → 根打 `x-define` → `buildComponentDef` 一次产出快照与 def。
 * 内置 shell 是引擎私有组件：不进用户 `options.components` 命名空间（同名互不干扰）。
 * 模块级缓存与 engine 实例无关（def/snapshot 纯静态）。
 */
export function resolveBuiltinMessageShell(): { snapshot: HTMLElement; def: ComponentDef | null } {
    if (!builtinMessageShell) {
        const root = parseHtmlFragment(MESSAGE_SHELL_TEMPLATE)!.firstElementChild as HTMLElement;
        root.setAttribute("x-define", "message-shell");
        const def = buildComponentDef(root, "message-shell", (msg) => console.warn(msg));
        builtinMessageShell = { snapshot: def.snapshot, def };
    }
    return builtinMessageShell;
}
