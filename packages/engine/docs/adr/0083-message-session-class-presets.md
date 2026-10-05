# ADR-0083：消息会话 class 化与 presets 预设组件族

- 状态：已采纳（**presets 内容分工（决策四 Q2b）与三控制键二次修订（action 通道）被 [ADR-0088](0088-message-content-ownership-module-split.md) 修订**——内容渲染归属 type 模板、公共复用件收敛为 `autospark.messages.actions` 组件、base 升格默认内容模板兼 type 链 fallback、三控制钮回归 task 模板（不发 `message:action`）；session class 家族 / factory 挂起 / `$messages.sessions` 机制不受影响）
- 日期：2026-10-04
- 关联：[ADR-0077](0077-message-session-dual-shell.md)（会话与双层渲染——session 实现形态与 type 链被本 ADR 取代）、[ADR-0079](0079-message-type-level-rename.md)（三键更名）、[ADR-0081](0081-component-define-inherit.md)（组件继承——V1 边界修订）、[ADR-0082](0082-component-inherit-super.md)

## 背景

ADR-0077 落地后遗留两处架构不满足：

1. **session 实现形态**：闭包全集方法 + 类型窄化——`AutoSparkMessageSession` 类型面声称无 `progress`，运行时（toast 会话）却携带全部方法（实现要点 3 曾专门防再踩）；行为（manager 闭包）与渲染（renderer 组件）分居两处，接管 type 组件无法复用公共形态；
2. **renderer 与组件体系脱节**：内置三 renderer 是引擎私有注册表（`BUILTIN_RENDERERS`），不进组件命名空间——用户无法覆盖 / 继承 / 实例化，而 ADR-0081 组件继承已提供「公共形态复用」的正宗机制。

用户提出以「预设组件 + 继承」重组（grilling 五轮决议）。

## 决策

### 一、功能边界：session = 全部业务逻辑，渲染组件 = 纯 UI

- **session（class 家族）**：跨态生命周期（`show/hide/remove/update/cancel`）+ type 专属行为（Task 七方法 / Confirm 三方法 + thenable）。`queued`（排队未挂载）与 `hidden`（组件已销毁）两态下组件实例不存在，生命周期操作恰在此两态最有意义；
- **渲染组件（presets 继承族）**：零行为零业务 data——模板内行为经既有 `$session` 派生变量调用。每条消息 1:1（session ↔ 组件实例，`session.el` 即组件根）；
- **组件隐藏语义**：`hide()` = 组件销毁（teardown），session / 记录按 `persist` 存活；再显示 = `show()` 重建。纯渲染组件无内部态，销毁重建零损失（保活隐藏被否决——引入「半死实例」第三态与三态模型冲突）。

### 二、session class 化（`src/messages/sessions/` 目录——一文件一类：base/toast/task/confirm/types）

`add()` 内部按 type `switch` 实例化：`MessageToastSession` / `MessageConfirmSession` / `MessageTaskSession`，自定义 type 回 `MessageSessionBase` 基类面——**类型面与运行时面统一**（基类实例不携带 task/confirm 域方法，取代 ADR-0077「闭包同构」）。死会话语义不变（`_entry` 空即死，方法 no-op + warn）。

基类新增面（均跨态）：

- **`update(patch)`**：`manager.update(id, patch)` 的句柄面；factory 挂起期为**缓存**（return 落地时合并，后写胜）；
- **`cancel()`**：挂起期 = 丢弃；展示中 / 排队中 = 立即关（ADR-0077「task.cancel 与 confirm.cancel 同为立即关」语义上移基类）。

Task 方法集七方法：`start/progress/pause/resume/stop/cancel/**complete**`（`complete ≡ stop` 显式别名——一个通用名一个语义名，同一实现）。

**三控制键（实施后修订，二次修订为 action 通道）**：`canPause` / `canCancel` / `canStop`（task 专属配置键，默认 false）——启用后引擎向 `entry.actions` **追加控制 action**（shell 公共 actions 行渲染，与用户 actions 共存、靠后排布；走 `_fireAction` 标准闭环——置已读 → `message:action` 事件 → handle，事件可监听是 action 通道对模板按钮的核心增量）：`pause`（title 随运行态「暂停 ↔ 恢复」）、`stop`（≡ complete）、`cancel`（≡ session.cancel）。`hide: false` 续显——暂停/停止不关卡，取消的关闭由 cancel() 自身完成。完成态滤除控制钮。注入项只进运行时按钮表（不落 props.actions——持久化天然不含；镜像投影照常携带）；`taskOp` 标记字段用于运行态刷新定位。`canCancel` 同时暴露 `session.signal: AbortSignal`（cancel() 瞬间 abort——fetch 挂接即中断；自然完成/超时/remove 不发信号）。初版为模板内按钮（文案动态性顾虑 actions title 快照），二次修订改 action 通道：title 刷新由引擎经不可变更新驱动（见实现要点 7）。manager 补 **`respond(id, value)`**：confirm 编程应答（`_fireConfirmChoice` 同一闭环，≡ 会话 `yes()` / 点击按钮）；JS 编程驱动进度另有既有通道 `update(id, { progress })`，不暴露组件实例代理（逃逸口 + 跨态语义含糊）。

### 三、factory`(session)` 挂起注入（决策 Q12a；type 第二参为实施后修订）

`add(async (session) => ...)` 同步创建**挂起会话**（未入 items / sessions / 展示）注入 factory：挂起期 `session.update()` 缓存补丁、`session.cancel()` / `hide()` = 取消；`return props` = 初始展示配置（`undefined` → 静默跳过），落地时合并挂起缓存。「fetch 中推进进度」类场景由普通调用 + session 驱动表达更自然——factory 留给「要不要弹都未定」的场景。

**修订（实施后）**：挂起会话缺省为基类面（type 随 return props 定）——factory 内想用 task/confirm 域方法则无门。补**第二参 type**：`add(factory, "task")` 挂起会话即按该 type 创建子类；session 类型不可变，return props 携带不同 type → warn + 以声明为准（快捷方式「强制归位」哲学）；非 factory 形态携带第二参 → warn + 忽略。快捷方式 `task/toast` 的 factory 形态同步透传 session 并锁定对应 type（此前 factory 形态根本没把 session 传给用户——一并修复）。

**二次修订（实施后）**：「全逻辑 factory」形态落地——`task(async (session) => { 下载闭包不 await; return 初始 props })`：return 的初始 props **立即建卡**（不等下载完成），factory 内异步闭包继续 `session.progress()` 实时驱动。配套两项语义变更：

- **task 创建即 started**（推翻 ADR-0071 决策 12「创建不自启」）：progress 直呼即推进，`start()` 保留为幂等兼容面；factory 挂起期的 `progress()` 走挂起缓存（return 落地时随初始 props 合并——闭包早期进度不丢）；
- 曾短暂实施的 `task(props, factory)` 双参形态被移除（YAGNI——单 factory 形态 + 立即 return 已覆盖同场景，避免双入口心智负担）。

### 四、presets 预设组件族（原 renderers/ 目录 → 变体 A 聚合后：模板随 session 子类住 `sessions/{toast,task,confirm}.ts`，`base` 模板与种子表在 `messages/presets.ts` 单文件，shell 独立 `messages/shell.ts`）

四件经 `options.components` **全局组件表种子**注入（engine 构造期，用户同名声明覆盖优先——error 组件先例）；`autospark.*` 点前缀为引擎保留命名空间：

| 组件 | 形态 |
| --- | --- |
| `autospark.messages.base` | **薄基类**：零行为零样式，只承载 type 出口协议（根 + 默认出口） |
| `autospark.messages.toast` | 纯继承零覆盖（存在意义 = 用户同名覆盖的全局 toast 定制点） |
| `autospark.messages.task` | 进度槽覆盖段（裸子节点替换 base 出口 fallback） |
| `autospark.messages.confirm` | 纯继承零覆盖（按钮在 shell 公共 actions 行） |

- **双层组合保留（决策 Q2b）**：公共视觉骨架（title/level 图标/description/actions/close）仍归 shell（`options.messages.shell` 链与 `options.uiShells.message` 种子不动）——继承只重组 type 专属区层；
- **type 链**：`types[type].render`（用户 type 级）→ 全局组件表按预设名 `autospark.messages.<type>` → 无（出口空置）。`BUILTIN_RENDERERS` 引擎私有注册表退役；
- **用户扩展**：自定义 type 组件可 `x-define:inherit="autospark.messages.base"` 继承基类做差异化（出口覆盖走 ADR-0081 三层优先级：消费方内容 > 继承覆盖 > 父 fallback）；亦可同名覆盖任一预设。

### 五、全局组件继承（ADR-0081 V1 边界修订）

ADR-0081 原判定「全局组件（`options.components` 字符串入参）不参与继承解析」——本 ADR 的注册面决策（Q3a：用户可继承 base）天然要求该能力。`_resolveGlobalComponent` 的 inherit 分支重写：子 def 独立构建后经 `resolveComponentInheritance` 展开，父沿全局表**递归懒预编译**（父可也是继承产物；环检测兜底）；失败 warn + 按未命中。

### 六、`$messages.sessions` 展示序 id 数组（决策 Q11a）

`store.state.$messages` 第三键 `sessions: string[]`（shallow 深度 0——id 无成员字段，仅结构变更有事件）：**展示中 id 序列**（shown + queued 入、teardown / 硬移除出；`show()` 追加 / `hide()` 移除——「仅隐藏」，记录仍留 items）。三键分工：`items` = 数据全集（含隐藏，创建序）、`sessions` = 展示序 id 子集、`options` = 配置真身。引擎分区栈渲染**不经它**（观察面——供用户模板按展示序渲染 / 调试消费）；「全渲染走 state」的彻底化方案被否决（分区栈 / 动画 / 离场收拢全改响应式管道的成本远超收益）。

## 实现要点（防再踩）

1. **`$session` 派生变量与组件 methods 的关系**：组件纯渲染后 methods 不再承载消息行为——模板内 `@click="$session.cancel()"`（派生变量通道）是唯一行为入口；展示结束的感知走 `message:hide` 事件与 `closed` getter（`run()` await 通道曾实施后移除，见被否决区）；
2. **sessions 列表的维护点**：入列 = `_displayEntry`（column 检查后，queued + mount 都过它）；出列 = `_teardown` / `delete`（hidden 态直删不经 teardown）/ `_evictOverflow`（queued 态淘汰直删）/ `clear` / `dispose`——五处收口，漏一处即幽灵 id；
3. **shallow 代理数组的断言形态**：`expect(代理数组).toEqual([...])` 在 bun:test 下因原型差异失败——须 `Array.from(...)`（或 `.map()`）展开后比较（items 的既有用例均经 `.map()` 天然规避）；
4. **manager 协作方法的可见性**：`_displayEntry/_dismiss/_applyProgress/_fireConfirmChoice` 去 `private`（`_` 前缀内部面惯例——`engine._resolveGlobalComponent` 先例），供 sessions/ class 家族调用；
5. **presets 组件模板的出口位置**：base 的出口标记须在**子级**（`<div class="autospark-message-type"><div x-slot></div></div>`）——`applyOverrides` 经 `querySelectorAll("*")` 遍历**不含快照根**，根上出口不会被继承覆盖命中；
6. **x-for 数组更新的成员引用陷阱（三控制键文案切换）**：`entry.actions = [...entry.actions]` 浅拷贝**保留成员引用**——x-for 元素级比较判定「无变化」不重渲染（data 域已新而 DOM 不刷）；须经不可变更新换**新成员对象**（`map(a => a === op ? { ...a, title } : a)`）再 `_syncData` 整组注入。经 data 代理的深写（`data.actions[i].title = x`）亦可触发，但绕过 manager 收口；
7. **scoped id 须按 def 而非实例分配（ADR-0087 修订的修订，防再踩）**：`injectComponentStyle` 的 `<style>` 按 defName 去重复用（首实例的选择器后缀被缓存），而 `data-cmp-{id}` 属性曾按**实例 scope.id** 打点——第二实例起属性值与缓存选择器失配（`[data-cmp-1]` 永不命中 `[data-cmp-2]` 的元素），表现为「组件第二次实例化起 scoped 样式全丢」（消息 task 预设二次弹卡只剩百分比数值）。修复：`componentScopedId(defName)` def 级稳定 id（name → id 映射全引擎缓存，style 元素被引用计数回收后重注入仍取同 id）；
8. **样式的 scoped / 全局分界（实施后修订）**：组件视觉样式（task 进度槽）进模板 `<style>` 走组件 scoped（ADR-0022）——组件被同名覆盖 / render 接管时样式随定义同生命周期消失（死样式零泄漏）；**结构契约样式**（wrapper 类 / 离场收拢 / slide 方向覆写 / 分区列定位 / 语义色 `data-message-level` 分派）**必须保持 styles.ts 全局注入**——其作用点含引擎 wrapper（用户自定义 shell 时卡片根是 wrapper，不带 `data-cmp`，scoped 后全部失效）。

## 被否决 / 演变的方案

- **task/confirm 方法进组件 methods**（最初提案形态）：queued / hidden 两态无组件实例，行为方法覆盖不了生命周期——切割线定为「跨态归 session、展示态行为也归 session（组件纯渲染）」；
- **双通道映射**（Session 方法转发活跃实例 methods）：一套实现两个入口 = ADR-0077 否决「双继承树」的同款双词汇地狱；
- **typebase 承载公共视觉骨架 / 整卡继承替代双层组合（Q2a）**：与 shell 双来源打架；ADR-0081 出口覆盖虽能解决「接管不全写」，但双层组合已运转良好——继承只重组 renderer 层（Q2b）；
- **执行体托管**（`session.run(async ctx => ...)` 引擎代管业务流程）：越界；
- **组件保活隐藏**（display:none / detach 存放）：纯渲染组件无保活价值，引入第三态；
- **sessions 含隐藏记录 / 引擎渲染走 state 驱动**：前者与 items 重复，后者重写成本远超「单一真相源」纯度收益；
- **`$messages.sessions` 存 session 实例**：违「函数不入 state」纪律（autostore computed 劫持 + 快照炸）——id 数组 + `messages.get(id)` 取实例；
- **presets 经 `engine.registerComponent` 注册**（评估否决）：ADR-0086 查找序「先查表」使运行时注册覆盖构造期配置——preset 即时注册进表后用户 `options.components` 同名声明（惰性源）永远查不到，**破坏用户同名覆盖**；且 registerComponent 要求根自带 `x-define`（base 靠自动包装打名）；
- **`session.component` 直渲染（绕过全局组件表）**（评估否决）：断四项扩展能力（同名覆盖 / types.render 指向 / inherit base / x-component 实例化），等价回退 BUILTIN_RENDERERS 私有注册表；采纳的变体 A 仅做**文件聚合**（模板与 session 同文件 + 类静态 component 名），注册与查找机制不动；
- **`run()` 展示周期 await 通道**（Q10a 曾采纳、实施后移除）：resolve 于 teardown 的「等这条消息展示走完」await 面，与 confirm thenable 正交——移除理由 YAGNI：事件族 `message:hide` + `closed` getter 已覆盖结束感知，双 await 面（run / thenable）并存的心智成本大于编排收益（业务超时本就是 `Promise.race` 的职责）。
