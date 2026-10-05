import { TOAST_TEMPLATE } from "./sessions/toast";
import { TASK_TEMPLATE } from "./sessions/task";
import { CONFIRM_TEMPLATE } from "./sessions/confirm";
import { ACTIONS_PRESET_NAME, BASE_PRESET_NAME, presetComponentName } from "./types";

/**
 * 消息预设组件族（ADR-0083 → **ADR-0088 内容归属**）：type 维度「行为与模板同文件」
 * （模板随 session 子类住 `sessions/{toast,task,confirm}.ts`），本文件只承载**跨 type 的
 * 注册面**与两件无 session 归属的公共模板：
 *
 * - **`autospark.messages.actions`**（ADR-0088 唯一公共复用件）：按钮行组件——x-for 渲染
 *   + 委托契约（`.autospark-message-action` 类名 + `data-message-action` 索引），type
 *   模板内 `x-component` 组合消费（props 对象字面量/状态路径按键展开、深层触发联动）；
 * - **`autospark.messages.base`**（ADR-0088 升格）：默认内容模板（icon + title/link +
 *   description + actions 组件）兼 **type 链末端 fallback**——自定义 type 不配模板也得到
 *   标准内容卡（「出口空置」退役）；保留裸出口（继承覆盖落点，ADR-0081）；
 * - 公共骨架 shell 独立 `shell.ts`（外观与内容正交）。
 *
 * 注册面（ADR-0083 grilling 共识）：五件经 `options.components` **全局组件表种子**注入
 * （engine 构造期，用户同名声明覆盖优先——error 组件先例）；`autospark.*` 点前缀为引擎
 * 保留命名空间。用户自定义 type 组件可 `x-define:inherit="autospark.messages.base"`
 * 继承默认内容做差异化（覆盖段落 base 出口），亦可组合 actions 组件或全自绘。
 *
 * type 链查找协议（manager 每条消息实例化时解析）：
 * `types[type].render`（用户 type 级）→ **全局组件表按 `autospark.messages.<type>`** →
 * **base 兜底**（ADR-0088）。与 shell 链正交（公共骨架归 shell：`options.messages.shell`
 * → getComponentDeclaration 链 → `options.uiShells` → 内置 shell 兜底）。
 */

/** 预设名约定自 types.ts 收敛引入（re-export 维持本文件「注册面」一站式可见） */
export { ACTIONS_PRESET_NAME, BASE_PRESET_NAME, presetComponentName };

/**
 * actions 按钮行组件模板（ADR-0088）：渲染 `actions` 数组为按钮行——**纯渲染零行为**，
 * 点击闭环由 MessageManager 卡片根委托收口（`data-message-action` 索引 → `entry.actions[i]`
 * → `_fireAction`：置已读 → `message:action` → handle → hide 判定），模板不绑 `@click`。
 * props 契约：`{ actions }`（resolved 按钮表，深层触发——数组换引用即刷新）。
 * 根包一层裸 div：x-for 结构指令不落在 def 根上（快照根参与 def 构建，保守分层）。
 */
export const ACTIONS_TEMPLATE = `<div x-define="autospark.messages.actions">
<div class="autospark-message-actions" x-show="actions.length > 0" x-for="a of actions">
<button class="autospark-message-action" type="button" x-text="a.title" :data-message-action="actions.indexOf(a)"></button>
</div>
</div>`;

/** base 组件的预设名（type 链末端 fallback 查找名）——见 types.ts 同名常量 */

/**
 * 默认内容模板（ADR-0088 升格，原薄基类承载出口协议 → 有实体的标准内容卡）：
 * icon + title/link + description 主行 + **裸出口**（继承覆盖落点——子定义直接子节点
 * 替换出口 fallback，ADR-0081 三层优先级「消费方内容 > 继承覆盖 > 父 fallback」）+
 * actions 组件组合。toast/confirm 纯继承本品；task 自有布局（头部与此重复 ~6 行，
 * YAGNI 裁决——只拆 actions 一件复用）；自定义 type 落本品兜底。
 */
export const BASE_TEMPLATE = `<div x-define="autospark.messages.base" class="autospark-message-type">
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
    "autospark.messages.toast": TOAST_TEMPLATE,
    "autospark.messages.task": TASK_TEMPLATE,
    "autospark.messages.confirm": CONFIRM_TEMPLATE,
}
