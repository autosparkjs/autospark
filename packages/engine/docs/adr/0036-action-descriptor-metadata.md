# ADR-0036：action 元数据化（ActionDesc 描述符统一存储形态）

- **状态**：Accepted（grill-with-docs，两轮十问）
- **日期**：2026-09-13
- **关联**：[ADR-0010](0010-action-dom-bubble-event.md)（双通道广播）、[ADR-0011](0011-sync-action-lifecycle.md)（同步生命周期）、[ADR-0012](0012-local-action-dom-only.md)（local/global 分流）、[ADR-0031](0031-script-type-namespace.md)（script 命名空间与 ActionManager 落点）、[ADR-0033](0033-x-data-async-source.md) / [ADR-0035](0035-x-html-async-source.md)（getAction 消费者）、[CONTEXT.md](../../CONTEXT.md)（「动作描述符」「动作自引用」词条）

## 背景

action 自诞生起是**纯函数表**：三入口（`options.actions` 构造扫描、`engine.actions` Proxy 赋值、`<script type="autospark/actions">` 提取）全部收敛到 buildAction 函数包装，`getAction` 返回函数、四个消费点（x-on / x-model get/set / x-data 异步 / 命令式直调）直接调用。函数只能承载「执行体」，**无元数据位**。

需求：action 需要携带 `title` / `icon` 等展示元数据（UI 工具按 action 表生成右键菜单/工具栏、加载提示显示动作标题），声明形态扩展为对象写法 `{ title, icon, handle }`。

表面是「加一种对象写法」，拷问暴露出连锁决策：存储是单一形态还是双形态并存？读侧（`getAction` / `engine.actions[name]`）返回什么？命令式直调的 breaking 边界画在哪？`this` 如何自引用？生命周期广播要不要带元数据？

## 决策

### 1. 存储层全量规范化为 ActionDesc（非读侧归一）

三入口写入时**即时**把函数简写与对象写法统一规范化为描述符（descriptor）存储——`engine.actions` 与 `scope.actions` 的值**恒为** `ActionDesc` 对象，不存在双形态并存：

- 函数简写 `toggle(){...}` ≡ `{ handle: toggle }`，是一等公民形态（非 deprecated），与对象写法在任一声明块内**可混用**（逐条独立判断形态）；
- `name` 由注册键（`Record` 的 key）在规范化时统一注入/覆盖——descriptor 自知其名，`Object.values` 遍历不丢名；
- 规范化在写入时点（构造扫描 / Proxy set trap / extractScript）完成，无集中 bootstrap 阶段。

否决「读侧归一」（存储保留原样、仅 `getAction` 包装）：违反单一形态，留下「遍历 `engine.actions` 时函数与对象混排」的暗坑，规范化责任从写入点漂移到每个读取点。

### 2. 开放元数据：`handle` 唯一必需保留键

`handle`（执行体函数）是唯一必需且保留的键；`title` / `icon` 是**文档化约定键**，其余自由键原样保留（类型 `[key: string]: any`）。将来加 `description` / `hotkey` / `disabled` 无需改类型与规范化逻辑（开放-封闭），引擎只认 `handle`、不为未来键做任何专门处理。

容错（对齐 extractScript 既有风格）：对象形态但 `handle` 缺失或非函数 → `logger.error` 记日志后**跳过该条**，不抛异常、不影响同块其他条目。

### 3. breaking 边界：读侧恒描述符，直调走 `.handle`

- `engine.actions[name]` / `scope.getAction(name)` 恒返回 `ActionDesc`，命令式直调改为 `engine.actions.toggle.handle(...)`；
- **内部消费者透明解包**：x-on / x-model get/set / x-data(异步) 内部取 `.handle` 调用，**模板侧行为零变化**（`@click="toggle"` 照常）；
- `.handle(...)` 直调时 `this` 非 AutoSparkActionContext，命令式直调广播语义照旧（全局进总线、无 DOM 冒泡）；
- 不做 callable descriptor（函数上挂元数据属性的「两栖魔法」）、不加 `engine.runAction` 便捷方法——单一形态，诚实对象。

### 4. `this.action` 活引用注入

AutoSparkActionContext 新增 `action` 字段，指向**规范化后的 descriptor 本体**（活引用）：`this.action.title` / `this.action.icon` 可读、元数据可写但**无响应式承诺**；`this.action.name` / `this.action.handle` 全可达，递归调用 `this.action.handle(...)` 会再次触发完整生命周期广播（pending→resolved/rejected，文档提示）。命名随 ctx 既有实体引用风格（el/data/scope/store/state/engine 均无 `$` 前缀），否决 `$action`（$ 系是「引擎注入的特殊物」语义）与 `meta`（窄化为只见元数据）。

### 5. 生命周期广播嵌套完整描述符

两通道 payload 同构扩展，均新增嵌套字段 `action` = **完整 descriptor**（含 `name`、`title`、`icon`、自由元数据、`handle` 函数本体）：

- 总线：`actions/<name>/{pending,resolved,rejected}` 的 payload 增 `action` 字段（含局部 action 不进总线的既有规则不变，ADR-0012）；
- DOM 冒泡：`action:<name>` CustomEvent 的 `detail` 增 `action` 字段（局部 action 的唯一通道，同样携带）。

顶层既有字段（`name` / `phase` / `result` / `error`）原样不动；嵌套而非平摊——自由元数据键可能撞顶层保留字。payload **不承诺可序列化**（`handle` 是函数，`JSON.stringify` 会得到 null）。

### 6. 类型落点与防重包装迁移

- 新类型 `ActionDesc`（`{ handle; name; title?; icon?; [key: string]: any }`，命名随项目 `Desc` 描述符惯例）与入参联合 `ActionDecl = fn | ActionDesc`，定义于 `src/actions/types.ts` 并经包入口公开导出；`scope.getAction` 返回类型、`options.actions` 入参类型同步迁移；
- `__buildActionWrapped` 防重包装判断从函数级移到 **descriptor 级**；包装时在 wrapped 上保留 `__rawAction` 原始 handle 引用——重复/跨名赋值同一描述符时 `_normalize` 解包重包装，广播名跟随本次注册键（原包装闭包捕获旧 name，不解包则错名）。

### 7. 内置信号型全局 action（yes / no / cancel / close）

引擎自动注册四个内置全局 action：`yes` / `no` / `cancel` / `close`。handle 为**参数透传**（`close(1)` → resolved 广播 `result: 1`），价值不在执行体而在**广播语义**——模板任意元素 `@click="close"` 触发，祖先监听 `action:close` DOM 冒泡（或总线 `actions/close/*`）即可实现关闭对话框、确认/取消等通用交互，无需为每个对话框手写空 action；透传首参让信号可携带载荷（如 `close("cancel-icon")`、`yes(formData)`），监听方从 `detail.result` / `$event.detail.result` 读取。descriptor 带 `title`（确认/否/取消/关闭）与 `builtin: true` 标记供 UI 消费与识别。用户同名声明**覆盖**内置（`registerGlobals` 先扫用户声明、后补缺失键，用户优先）。

## 被否决的方案

- **读侧归一（存储双形态）**：遍历读侧形态不一致的暗坑，规范化责任漂移。
- **callable descriptor（函数挂元数据属性）**：`typeof === "function"` 歧义、类型表达失真、与「getAction 返回对象」诉求直接矛盾。
- **`engine.runAction(name, ...args)` 补偿方法**：无消费者，YAGNI。
- **payload 平摊元数据 / 剥 `handle` 的数据视图**：前者自由键撞顶层保留字，后者不满足「完整 action 数据」。
- **严格三键封闭（仅 title/icon/handle）**：加键即改类型与规范化逻辑，二次改版可预期。
- **`this.$action` / `this.meta`**：命名风格分裂 / 语义窄化。

## 后果

- ✅ 模板作者零变化；JS 侧直调迁移 `.handle(...)`（包未发布，零成本 breaking 窗口，承接 ADR-0030/0031 惯例）。
- ✅ 生命周期广播消费者（x-loading 等）可直接从 payload 读元数据（如 toast 显示动作标题）。
- ✅ `src/actions/` 继续作为 action 域唯一落点（ADR-0031 决策 3 的演进预留兑现）。
- ⚠️ payload 携带函数本体：消费者不得假设可序列化。
- 测试迁移：`buildAction.test.ts` / `x-on.test.ts` / `x-data-async.test.ts` / `x-model.test.ts` / `x-loading.test.ts` 直调断言改 `.handle()` + 对象写法新用例；活文档（CONTEXT.md、docs/zh、specs、CLAUDE.md）随更，历史 ADR 正文保留旧称。
