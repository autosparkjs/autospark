# ADR-0031：`<script>` type 值命名空间化（autospark/actions、autospark/setup）

- **状态**：Accepted
- **日期**：2026-09-12
- **关联**：[ADR-0012](0012-local-action-dom-only.md)（local/global 分流）、[ADR-0022](0022-x-component.md)（`<script setup>`）、[ADR-0030](0030-rename-to-autospark.md)（品牌空间）、[CONTEXT.md](../../CONTEXT.md)（「动作声明脚本」词条 / 已废弃 `type="actions"`、`type="setup"`）

## 背景

引擎在模板里复用 `<script>` 元素承载两类自有声明：局部/全局动作（`<script type="actions">`，compiler 前置 transformer 提取）与组件 setup（`<script setup>` 布尔属性或 `<script type="setup">`，`buildComponentDef` 收集）。裸 `type="actions"` / `type="setup"` 取值过于通用：

- **撞车风险**：`type` 属性在 HTML 语义上是 MIME 类型，任何库（或未来的标准扩展）都可能赋予 `actions`/`setup` 之类通用词自己的含义；同一页面并存时无法区分归属，引擎会把别家的声明块误提取/误剪枝。
- **可发现性差**：裸词不携带任何品牌信息，读者无法从模板一眼判断该 script 由谁消费。
- **与 ADR-0030 不一致**：品牌已统一进 `AutoSpark` / `AutoSparkSpaces` / `autospark` 命名空间，模板 DSL 却仍用无主裸词。

包尚未发布（承接 ADR-0030 的零成本 breaking 窗口），是一次性收敛语法的时机。

## 决策

### 1. type 值加 `autospark/` 前缀

| 旧写法 | 新写法 | 消费方 |
| --- | --- | --- |
| `<script type="actions">` | `<script type="autospark/actions">` | compiler transformer → ActionManager.extractScript（局部注入） |
| `<script type="actions" global>` | `<script type="autospark/actions" global>` | 同上（global 标志不变，注入 engine.actions） |
| `<script type="setup">` | `<script type="autospark/setup">` | collect.ts buildComponentDef（组件 setup） |

**不动区**：`<script setup>` 布尔属性形态（仿 Vue SFC）不受影响，继续识别；`global` 属性标志语义不变；普通 `<script>`（无 type 或其他 type）仍原样保留在渲染 DOM。

曾评估「前缀用完整 `autospark/` vs 更短的 `as/`」：MIME 型值按惯例 `项目/用途`，`autospark/` 与品牌一致、无缩写歧义，成本仅多几个字符；`as/` 过短且与常见词冲突。

### 2. 硬切 + 旧写法编译期 warn（剪枝不执行）

不做双写兼容（无外部消费者，双收徒增长期维护面）。旧写法不静默失效，而是显式告警：

- `<script type="actions">`：compiler transformer 附加一条仅告警规则——`logger.warn` 提示已更名、该脚本未注册，返回 null 剪枝（不进渲染 DOM、不提取）。
- `<script type="setup">`：`buildComponentDef` 收集期 `warn` 提示已更名、该脚本不再求值，并从快照剪枝（不进实例化 DOM）——对称策略，否则旧写法组件 setup 会静默失效，比 actions 更难察觉。

### 3. ActionManager 提炼（同场落地，行为零变更）

action 处理逻辑自 engine/compiler 收编为独立管理单元 `src/actions/`：

- `manager.ts` — `ActionManager`：全局表（`options.actions`）构造扫描包装、`proxy` getter（`engine.actions` 赋值即自动包装的 set trap）、`extractScript(script, scope)`（模板 script 解析与 global/局部分流，ADR-0012 语义不变）。
- `buildAction.ts` — 自 `utils/buildAction.ts` 迁入（ADR-0010 的双通道广播包装，零改动）。

**职责边界**：`scope.getAction` 链查找与 `scope.actions` 字段归 scope 域（与 getData/getComponent/getMethod 的 parent 链就近 + 全局兜底范式同构，搬走会制造 ActionManager↔Scope 循环依赖）；`_findNearestScope` 留 compiler（依赖私有 templateScopeMap），查好后作为入参传入。`engine.actions` 对外契约不变（getter 委托 manager 的 proxy）；manager 挂 `public readonly actionsManager`（与 scheduler/dispatcher 同构，供 compiler 协作）。

本次为纯重构（测试零断言改动全绿），不改变任何行为；独立于决策 1/2 可回滚。

## 后果

- 模板 DSL 的 script 声明与品牌命名空间一致，撞车与误提取风险消除。
- 旧模板迁移有 warn 指引（actions：脚本未注册；setup：脚本不再求值），失效可发现。
- 活文档（docs/zh、engine glossary、specs、根 CLAUDE.md、CONTEXT.md）全部随更；ADR 0010/0012/0004/0021 等历史正文保留旧称（决策当时的记录，ADR-0030 惯例）。
- `src/actions/` 成为 action 域的唯一落点，后续 action 相关演进（如注册来源扩展）在此扩展。
