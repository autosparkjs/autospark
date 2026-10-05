// 显式文件路径导入（规避 ./types.ts 与 ./types/ 目录的模块解析歧义——文件恒胜目录，
// 但显式路径让意图无歧义）
import { TOAST_TEMPLATE, TOAST_DEFAULTS } from "./types/toast";
import { TASK_TEMPLATE, TASK_DEFAULTS } from "./types/task";
import { CONFIRM_TEMPLATE, CONFIRM_DEFAULTS } from "./types/confirm";
import { ACTIONS_PRESET_NAME, BASE_PRESET_NAME, presetComponentName } from "./types";

/**
 * 消息预设组件族（ADR-0083 → ADR-0088 内容归属 → **ADR-0089 type 组件化**）：每个 type 的
 * 实现 = 一个 autospark 组件（行为+渲染+数据全承载，住 `types/` 一 type 一文件）；本文件承载
 * **跨 type 的公共件与注册面**：
 *
 * - **`autospark.messages.base`（族根，ADR-0089 决策二升格）**：所有 type 组件的公共基座——
 *   结构（icon + title/link + description 内容行 + 裸出口 + actions 组合）+ 行为（公共
 *   methods 七件）+ 约定键默认值，经 `x-define:inherit` **结构+行为双继承**下渗全部 type；
 *   引擎对 type 组件自动补 inherit（未显式声明者）。用户同名覆盖 base = 全族换根。
 * - **`autospark.messages.actions`**（ADR-0088 唯一公共组合件）：按钮行——x-for + 委托契约
 *   （`.autospark-message-action` + `data-message-action` 索引），type 模板内 `x-component`
 *   组合消费；点击闭环由 manager 卡片根委托收口。
 * - 公共骨架 shell 独立 `shell.ts`（外观与内容正交，ADR-0088 沿用）。
 *
 * 约定键协议（ADR-0089 决策五——引擎联动、模板/methods 读）：
 * `holdOpen`（true = 不自动关，task 完成态联动置 false）/ `visible`（在屏态）/ `closed`
 * （记录关闭态）/ `remaining`（自动关闭剩余 ms；-1 = sticky/不计时）。
 *
 * 注册面：经 `options.components` 全局组件表种子注入（engine 构造期，用户同名声明覆盖优先）；
 * `autospark.*` 点前缀为引擎保留命名空间。type 链查找协议（与 shell 链正交）：
 * `types[type].render` → 全局组件表 `autospark.messages.<type>` → base 兜底（ADR-0088 沿用）。
 */

/** 预设名约定自 types.ts 收敛引入（re-export 维持本文件「注册面」一站式可见） */
export { ACTIONS_PRESET_NAME, BASE_PRESET_NAME, presetComponentName };

/**
 * actions 按钮行组件模板（ADR-0088）：渲染 `actions` 数组为按钮行——**纯渲染零行为**，
 * 点击闭环由 manager 卡片根委托收口，模板不绑 `@click`。props 契约：`{ actions }`（resolved
 * 按钮表，深层触发——数组换引用即刷新）。根包一层裸 div：x-for 结构指令不落在 def 根上。
 */
export const ACTIONS_TEMPLATE = `<div x-define="autospark.messages.actions">
<div class="autospark-message-actions" x-show="actions.length > 0" x-for="a of actions">
<button class="autospark-message-action" type="button" x-text="a.title" :data-message-action="actions.indexOf(a)"></button>
</div>
</div>`;

/**
 * base 族根模板（ADR-0089 决策二）：公共结构（内容行 + 裸出口 + actions 组合）+ 公共行为
 * （methods 七件——`$session` 退役后模板内调用的落点，`this` = ComponentMethodContext，
 * `this.engine.messages` 即 manager 公共面）+ 约定键默认值 + 内容排版 scoped 样式
 * （用户覆盖 base 时样式随定义消失——死样式零泄漏）。
 *
 * props 注水序（引擎组件机制既有语义）：`data` 先注入、props（record 面 + 组件面全量）后
 * 注入同名覆盖——约定键不在 props 面故默认值存活；`id/title/icon/actions/read/...` 经
 * props 到达（`this.props.id` 即记录 id）。
 */
export const BASE_TEMPLATE = `
<div x-define="autospark.messages.base" class="autospark-message-type">
<script setup>
{
    data: () => ({
        holdOpen: false,
        visible: false,
        closed: false,
        remaining: -1,
    }),
    methods: {
        hide() { this.engine.messages.hide(this.props.id); },
        show() { this.engine.messages.show(this.props.id); },
        remove() { this.engine.messages.delete(this.props.id); },
        cancel() { this.engine.messages.hide(this.props.id); },
        update(p) { this.engine.messages.update(this.props.id, p); },
        markRead() { this.engine.messages.markRead(this.props.id); },
        respond(v) { this.engine.messages.respond(this.props.id, v); },
    },
}
</script>
<style>
.autospark-message-type { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.autospark-message-main { display: flex; align-items: flex-start; gap: 8px; }
.autospark-message-icon { flex: none; }
.autospark-message-content { flex: 1; min-width: 0; }
.autospark-message-title-row { display: flex; align-items: center; gap: 6px; }
.autospark-message-title { font-weight: 500; }
.autospark-message-link { flex: none; color: inherit; opacity: 0.6; }
.autospark-message-description { font-size: 0.92em; opacity: 0.8; }
</style>
<div class="autospark-message-main">
<i class="autospark-message-icon" x-icon="icon" x-show="icon" aria-hidden="true"></i>
<div class="autospark-message-content">
<div class="autospark-message-title-row">
<span class="autospark-message-title" x-html="title"></span>
<a class="autospark-message-link" x-show="link" :href="link" target="_blank" rel="noopener noreferrer" aria-label="查看详情"><i class="autospark-message-link-icon" x-icon="'external'" aria-hidden="true"></i></a>
</div>
<div class="autospark-message-description" x-html="description" x-show="description"></div>
</div>
</div>
<div x-slot></div>
<div x-component:autospark.messages.actions="{ actions }"></div>
</div>`;

/** 预设组件种子表：注入 options.components（用户同名覆盖优先——展开序在后） */
export const MESSAGE_PRESET_COMPONENTS: Record<string, string> = {
    [ACTIONS_PRESET_NAME]: ACTIONS_TEMPLATE,
    [BASE_PRESET_NAME]: BASE_TEMPLATE,
    [presetComponentName("toast")]: TOAST_TEMPLATE,
    [presetComponentName("task")]: TASK_TEMPLATE,
    [presetComponentName("confirm")]: CONFIRM_TEMPLATE,
};

/**
 * 内置 type 种子默认聚合（合并链 type 种子层的引擎侧来源，ADR-0089 决策九）：各 type 自带
 * （`types/*.ts` 的 `*_DEFAULTS`）——含 confirm 的 sticky 与默认双钮数据化（props.ts 的
 * confirm 双钮注入 if 已退役）。persist 差异化（toast 默认 0 隐于全局默认）经各 type 声明
 * 或用户 types[type] 层覆盖。
 */
export const MESSAGE_TYPE_DEFAULTS: Record<string, Record<string, any>> = {
    toast: TOAST_DEFAULTS,
    task: TASK_DEFAULTS,
    confirm: CONFIRM_DEFAULTS,
};
