# ADR-0089：消息 type 组件化——session 体系退役

- 状态：已采纳（实施待启动）
- 日期：2026-10-05
- 关联：[ADR-0077](0077-message-session-dual-shell.md)（双层组合——`$session` 派生变量注入退役）、[ADR-0083](0083-message-session-class-presets.md)（class 家族——**整体被本 ADR 退役**）、[ADR-0088](0088-message-content-ownership-module-split.md)（内容归属——行为归属再度迁移：session → 组件）、[ADR-0071](0071-messages.md)、[ADR-0072](0072-messages-state.md)

## 背景

ADR-0083 class 家族 + ADR-0088 模块拆分后，一个消息 type 的实现物仍分散多处：session class（行为，`sessions/` 目录）+ 组件模板（渲染，类旁常量）+ type 种子默认（`props.ts` 表）+ 组件名约定（`presetComponentName`）。且 `_createSession` 为封闭 switch——自定义 type 无行为扩展通道（只能拿基类面）。

与此同时，x-define 组件体系已具备完整逻辑宿主：`<script setup>` 的 **data**（响应式域）/ **methods**（组件方法，`this` = ComponentMethodContext）/ **locals**（非响应式私有变量）/ 四阶段生命周期钩子，且继承机制支持 setup 按层合并（父 data/methods 子同名胜、hooks 串接、styles 拼接）。「组件具有渲染，也可以包括逻辑」——消息 type 没有理由维护第二套行为载体。

grilling 六轮 17 问决议（形态分岔 / 跨态墙 / 句柄面 / 生命周期语义 / 持久化边界 / base 族根）。

## 决策

### 一、一个 type = 一个 autospark 组件（宣言）

每种消息类型的实现单元 = **一个 x-define 组件**：行为（setup methods）、数据视图（setup data）、渲染（模板 + scoped style）、生命周期（四阶段钩子）全部住组件。`sessions/` class 家族（base/toast/task/confirm）整体退役；task 状态机改写为 `data{ progress, paused, completed }` + methods（pause/resume/stop/cancel 等）；confirm 的 yes/no 为 methods。

### 二、base 族根与引擎自动继承

`autospark.messages.base` 从「默认内容模板」升格为**组件族公共基座**（结构 + 行为双继承源）。所有 type 组件强制继承 base：注册时引擎自动补 `x-define:inherit="autospark.messages.base"`（模板已显式写 inherit 的不重复补）。task 由自有布局改为「继承 + 覆盖出口」——与 base 头部重复的 ~6 行消除（ADR-0088 的 YAGNI 裁决随之翻页）。

### 三、数据层与组件分离

跨态数据的宿主 = **数据层**（record + props/运行态宿主），组件不担跨态责任——排队 / 隐藏 / 挂起期数据活在数据层，组件挂载时注水。record 恒**业务十二键封闭**：组件 data 不入持久化载荷（与现状 serializeMessage 行为一致——重启丢运行态是既有语义）。

### 四、`add()` 恒返回组件实例；可见性 = display 模型

`add()` 即实例化并挂 DOM，**恒返回组件实例**（唯一返回物，无判别）——**factory 形态亦然**（`add(async (instance) => …, 'task' | { type: 'task', … })`：调用瞬间即实例化并注入 factory，第二参为 type 名字符串或「type + 初始 props」对象——实例化提前至 add 时刻，`canCancel` 等初始配置须同刻注水，`instance.signal` 在闭包内即可用）。可见性纯样式切换：**挂起（factory 未 resolve）与排队同态** = `display:none`（满员时不占可见容量）、显示 = 可见、persist ≥ 1 隐藏 = `display:none` 保留实例、`remove()` / 淘汰 / `persist=0` 关闭 = 真销毁。queue 的 offer/flush 补位挂载机制随之简化为 display 切换。因数据与组件分离（决策三），排队/挂起期不存在白建实例的数据冗余。

### 五、引擎钩子 = data 约定键

引擎读取的 type 声明（如「进行中不自动关」）经 **data 约定键**表达（如 `data.holdOpen`）——响应式联动（completed 翻转时引擎经 watch 感知、重启计时），取代 class 虚方法覆写（`_holdOpen` 钩子退役）。

### 六、`$session` 退役

组件模板内 methods 直达（`@click="pause()"`——模板本就在组件作用域内）；shell 的 close 钮与用户 actions 点击走既有卡片根委托（本就不经 `$session`）。

### 七、thenable 与外部驱动（按默认缝合，可推翻）

- `await add({ type: 'confirm' })`：confirm 组件 setup 定义 `then` method（实例可 await，存量写法零改）；`messages.confirm()` 快捷方式语义保持；
- 外部驱动：组件实例恒在（display:none 亦然），实例方法直调即可——**无 `invoke` 通道**；数据型驱动走 `messages.update(id, patch)`。

### 八、factory 挂起期（用户修订：真实例，预句柄退役）

`add(async (instance) => …)` **调用瞬间即创建组件实例**并注入 factory——挂起 = `display:none` 的特殊排队态（与排队/隐藏统一为同一可见性模型）。推论：

- **缓存机制退役**：`instance.progress()` 直写 data 域（实例已存在，data 即宿主），ADR-0083 Q12a 的挂起补丁缓存不再需要；
- **第二参扩展对象形态**：`'task'`（type 名）或 `{ type: 'task', canCancel: true, … }`（type + 初始 props）——初始配置在实例化时刻注水（`signal` / 控制钮配置闭包内即生效）；
- **resolve 语义**：return props 为初始展示配置，落地时走合并链注水——与期间已写 data 同名键**闭包运行态胜**（沿 Q12a「pendingPatch 覆盖 return」语义：闭包驱动是更后、更真实的运行态，return 显式键不回拨）；return `undefined` → 静默销毁实例（条件通知语义不变）；
- **主用法 = 立即 return**（即时卡 + 后台驱动）：return 在 factory 首行同步路径执行——卡片即刻弹出、进度条即刻可见，长任务**不 await 在主线上**（后台启动，`inst` 闭包存活持续 `progress()` 驱动；挂起期调用直写 data 域，卡片显示时直接呈现当前值）。`await` 形态仅属**条件通知**域（内容就绪才决定弹不弹：`return undefined` 静默跳过）——「后台静默跑完才弹卡」不是 factory 的目标形态（ADR-0083 二次修订沿用）；
- **挂起期 `cancel()`/`hide()`**：标记丢弃，resolve 后不入队直接销毁。

## 考虑过的替代方案

- **一个 type = 一个 TS 类**（static typeName/template/defaults + `registerType`）：评估中途方案（本 ADR 前身）——被否决，两套声明形态（class 与组件）双轨并存，违背「引擎自举」；
- **轻 token 句柄**（引擎生成 `{ id, update, hide, … }` 转发层）：被「直接返回组件实例」否决——多一层无行为实体；
- **组件实例与 DOM 同生命周期 + 占位物**：跨态返回物分裂（token 与实例二态判别），被否决；
- **`$session` 换实现不换名**：被彻底退役否决——methods 直达后无存在必要；
- **data 白名单投影入 record / record 增设 data 桶**：打破「Record 纯业务数据」宣言，被否决（跨会话进度走 status/result 业务键表达）。

## 后果

- **内存模型变化**：hidden/display:none 恒保留实例（与现状「teardown 销毁 scope 回收」纪律相悖）——maxLen 兜底，显式接受；
- **离场动画 × display 切换时序**：先动画后 `display:none`，实现期处理；
- **迁移面**：`sessions/` 四文件逻辑改写为 setup methods；manager 的 `_createSession` / confirm choice 绑定 / queue 补位机制改造；demo 与测试（messages 全组）迁移；文档（messages.md 等）同步；未发布零迁移约定下 API 返回物类型面直接变更；
- ADR-0083 的 class 家族词汇（Session / 七方法面）进入已废弃区，ADR-0088 的「session = 全部业务逻辑」分工宣言被本 ADR 修订为「组件 = 全部业务逻辑」。
