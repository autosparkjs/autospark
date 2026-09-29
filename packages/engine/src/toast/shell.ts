import { buildComponentDef } from "../compile/collect";
import type { ComponentDef } from "../directives/component-def";
import { parseHtmlFragment } from "../utils/transformElement";

/**
 * 轻提示外壳（shell 机制延伸，ADR-0068 决策 11）——toast 单项卡片的内置私有组件。
 *
 * 与面板外壳（panel-shell，ADR-0062）的两点分野：
 *
 * - **无出口协议**：toast 没有内容组件投影概念——message 是 props 键不是组件，模板直接
 *   `x-html="message"` 消费（消毒随 x-html 默认通道）；不走 live 投影、`x-slot` 不适用；
 * - **ToastProps 预解析注入**：引擎注入前解析派生键——`type`→`icon`（icons 映射）、
 *   `actions` 字符串名→查 `engine.actions` 全局表合成（外壳拿到即解析后形态）。
 *
 * 真响应式活体：同 id 原地更新 = 引擎写 data 域 props，`x-html` / `x-show` / 属性绑定自动
 * 响应（instantiateDetachedComponent 管道红利，ADR-0068 决策 5）。
 *
 * 行为契约分工（对齐 ADR-0062 决策二「行为挂实例、形态挂外壳」）：模板只渲染形态——按钮
 * 点击（actions handle + hide 语义）与关闭钮点击由 ToastManager 在卡片根上**委托监听**
 * （`data-toast-action` 索引 / `autospark-toast-close` 类名命中），模板不绑 `@click`。
 *
 * 模板指令清单：`x-html`（message，sanitizer 默认通道）/ `x-show`（type 图标区、按钮行、
 * 关闭钮的响应式显隐）/ `x-for`（按钮行，x-loading 按钮行同构）/ `x-icon`（图标，值两栖）/
 * `:data-toast-type`（语义分派属性绑定）。不用 `x-if`：显隐均可用 x-show 表达（display:none
 * 零占位），避开结构指令接管子树编译与同元素多指令的相互干扰（KISS）。
 */

/** toast shell 模板：双类名根（继承 dialog 面板联动样式）+ 图标区 + 消息区 + 按钮行 + 关闭钮。
 *  x-for 为容器级指令（宿主携带子元素项模板，x-loading 按钮行同构）——挂在按钮行容器上。 */
export const TOAST_SHELL_TEMPLATE =
    `<div class="autospark-dialog autospark-toast" :data-toast-type="type">` +
    `<i class="autospark-toast-icon" x-icon="icon" x-show="type !== 'none'" aria-hidden="true"></i>` +
    `<div class="autospark-toast-message" x-html="message"></div>` +
    `<div class="autospark-toast-actions" x-for="a of actions">` +
    `<button class="autospark-toast-action" type="button" x-text="a.title" :data-toast-action="actions.indexOf(a)"></button>` +
    `</div>` +
    `<button class="autospark-toast-close" type="button" x-show="closable" x-icon="'no'" aria-label="关闭"></button>` +
    `</div>`;

/**
 * toast shell 默认视觉（ADR-0068 决策 13 语义色 + 形态层）：
 *
 * - 双类名根：`autospark-dialog` 承担圆角（panel-shell 形态样式）；边框/背景/阴影因不打
 *   `data-overlay-border`（overlay 专属契约）而由本表承担——复用同一批 CSS 变量
 *   （`--autospark-overlay-bg/-border`），主题换肤一处生效；
 * - **语义色双层变量**：单一消费点 `--autospark-toast-accent`（图标着色 + 左侧 3px 语义条），
 *   各 type 经 `data-toast-type` 分派到用户可覆盖的 `--autospark-toast-{type}-color`；
 *   `none` 不匹配任何分派规则 → accent 落默认 transparent（无语义条）；
 * - **slide 方向自适应覆写层**（ADR-0068 决策 16，tooltip 先例 ADR-0061 决策 16 同构）：
 *   内置 slide 纵向固定（`translateY(-12px→0)`），按卡片根 `data-toast-pos` 前缀/后缀换
 *   from 值——`top-*` 从上、`bottom-*` 从下、`*-left` 从左、`*-right` 从右滑入（角列贴边
 *   横向滑入是主流形态语言，横向规则后声明覆盖纵向）；`center` 纵向。`leave-to` = `enter-from`
 *   同值视觉对称。duration 保持内置 slide 默认 300ms 不覆写。
 *
 * 非 scoped、引用无关——多实例共享一份，经 `injectToastStyles()` 幂等注入（styles.ts 合并注入）。
 */
export const TOAST_SHELL_STYLES = `
/* 卡片形态：复用 dialog 面板变量 + 左侧语义条（accent 默认 transparent——none 无条） */
.autospark-toast {
  border: 1px solid var(--autospark-overlay-border, rgba(0, 0, 0, 0.1));
  background: var(--autospark-overlay-bg, #fff);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
  border-left: 3px solid var(--autospark-toast-accent, transparent);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  box-sizing: border-box;
  max-width: var(--autospark-toast-max-w, 360px);
  font-size: 14px;
  line-height: 1.5;
  color: var(--autospark-toast-fg, #1f2329);
}
/* 语义色分派（双层变量：用户覆盖 --autospark-toast-{type}-color 一处即换肤） */
.autospark-toast[data-toast-type="info"]    { --autospark-toast-accent: var(--autospark-toast-info-color,    #409eff); }
.autospark-toast[data-toast-type="success"] { --autospark-toast-accent: var(--autospark-toast-success-color, #67c23a); }
.autospark-toast[data-toast-type="warn"]    { --autospark-toast-accent: var(--autospark-toast-warn-color,    #e6a23c); }
.autospark-toast[data-toast-type="error"]   { --autospark-toast-accent: var(--autospark-toast-error-color,   #f56c6c); }
/* 图标区：currentColor 流入 x-icon（ADR-0058 颜色主权在宿主） */
.autospark-toast-icon {
  flex: none;
  display: inline-flex;
  font-size: 17px;
  color: var(--autospark-toast-accent, transparent);
}
.autospark-toast-message {
  flex: 1;
  min-width: 0;
  overflow-wrap: break-word;
}
/* 按钮行与按钮（视觉协议参考 x-loading，独立类名契约） */
.autospark-toast-actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
}
.autospark-toast-action {
  flex: none;
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  font-size: 13px;
  color: var(--autospark-toast-accent, #409eff);
  cursor: pointer;
}
.autospark-toast-close {
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
.autospark-toast-close:hover { opacity: 0.9; }
/* slide 方向自适应覆写层（specificity 高于全局内置裸类名规则；只换 transform 的 from 值，
   opacity 分量从内置规则级联保留；角列横向规则后声明覆盖纵向前缀命中） */
.autospark-toast { --toast-slide-from: translateY(-12px); }
.autospark-toast[data-toast-pos="center"] { --toast-slide-from: translateY(-12px); }
.autospark-toast[data-toast-pos^="top"] { --toast-slide-from: translateY(-12px); }
.autospark-toast[data-toast-pos^="bottom"] { --toast-slide-from: translateY(12px); }
.autospark-toast[data-toast-pos$="-left"] { --toast-slide-from: translateX(-12px); }
.autospark-toast[data-toast-pos$="-right"] { --toast-slide-from: translateX(12px); }
.autospark-toast.slide-enter-from,
.autospark-toast.slide-leave-to { transform: var(--toast-slide-from, translateY(-12px)); }
`;

/**
 * 解析内置 toast shell（懒构建，ADR-0068 决策 2）：模式与 overlay `resolveBuiltinShell`
 * 同构——模板字符串 parse → 根打 `x-define` → `buildComponentDef` 一次产出快照与 def。
 * 内置 shell 是引擎私有组件：不进用户 `options.components` 命名空间（同名互不干扰）。
 * 模块级缓存与 engine 实例无关（def/snapshot 纯静态）。
 */

/** 内置 toast shell 的定义缓存（懒构建，模块级单例） */
let builtinToastShell: { snapshot: HTMLElement; def: ComponentDef | null } | null = null;

/**
 * 解析内置 toast shell（懒构建）：快照 + def 一次产出。
 * toast-shell 无出口（模板不带 `x-slot`）——def.slots 为 undefined，符合「无出口协议」分界。
 */
export function resolveBuiltinToastShell(): { snapshot: HTMLElement; def: ComponentDef | null } {
    if (!builtinToastShell) {
        const root = parseHtmlFragment(TOAST_SHELL_TEMPLATE)!.firstElementChild as HTMLElement;
        root.setAttribute("x-define", "toast-shell");
        const def = buildComponentDef(root, "toast-shell", (msg) => console.warn(msg));
        builtinToastShell = { snapshot: def.snapshot, def };
    }
    return builtinToastShell;
}
