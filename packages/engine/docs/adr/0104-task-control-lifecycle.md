# ADR-0104：task 控制与生命周期——六控制动词、状态机与 abortSignal

- 状态：已采纳（2026-10-11 grilling 九问共识落盘，同日实施）
- 日期：2026-10-11
- 关联：ADR-0089（type 组件化——行为住组件，本文的动词方法与 onXxx 均为组件
  methods）、ADR-0102（事件分层命名 + closeWhenDone 三态——本文修订其 × ≡ cancel
  判定与 stop ≡ complete 沿革、扩展 closeWhenDone 至 stopped 终态）、ADR-0083
  （task 会话语义沿革）、ADR-0003（事件契约总纲）

## 背景

task 卡虽有 暂停↔恢复 / 停止 / 取消 三钮，但控制语义残缺：按钮只改 data
（外界仅能收到泛化 `update` 事件），`stop() ≡ complete()`（把中止伪装成完成），
× 冒充 cancel（ADR-0102），`_abort` 仅 `canCancel === true` 才注入，`start()` 是空
操作兼容方法，宿主代码无从知晓用户按了什么、也无统一的协作中止通道。需求：任务
通知对**开始、暂停、停止、取消、关闭(×)** 的完整控制与生命周期观测。

## 决策

### 1. 六控制动词：start / pause / resume / stop / cancel / close

每动词 = 组件方法 + `actions/<动词>` 事件 +（订阅便捷面）`on<动词>` 回调：

- **事件复用 actions 家族**（用户原案）：`notifications/<type>/<id>/actions/<动词>`
  ——与 props.actions 自定义按钮同一订阅家族；内置动词
  `start/pause/resume/stop/cancel/close` 是该卡 actions 命名空间的**事实保留名**
  （用户自定义 action 撞名 = 同义触发，责任自负，文档声明）。否决独立 `ops/` 段：
  两个家族两份心智。payload `{ notification, el }`（无 `value`——控制动词无应答）；
  双通道 + anchor 子树派发与既有 action 事件一致；
- **方法级单一真相源**：事件在**组件方法内**派发——按钮点击与程序直调
  （`session.pause()`）同发、不可区分，外部可模拟用户操作；否决「仅点击发」
  （外部代码将无法替用户操作）；
- **开始双模式**（决策 1c）：缺省自动开跑，**首次显示时补发一次** `actions/start`
  （纯观测——时机在 show 事件后，factory 闭包内挂的 `onStart` 不丢事件；重显不
  重发；显示前已入终态不补发）。声明 `canStart: true` 转手动门控：卡片以 pending
  态等「开始」按钮 / `start()`，点击才发 start 并由宿主开跑。`start()` 由空操作
  升级为程序化启动触发（幂等）。

### 2. 状态机：`state ∈ pending / running / paused / stopped / completed`

旧 `paused/completed` 双布尔并入单值 `state`（组件 data 运行约定键；watcher /
update 事件观测面随之切换）。迁移规则：

- 初值经注水通道归位：`canStart` 门控卡 = `pending`，自动模式 = `running`
  （挂起/排队期闭包 `progress()` 直写不丢——ADR-0089 决策八沿用）；
- `progress()` 仅 `running` 态生效（pending / paused / 终态忽略）；
- `cancel` / `close` **不入状态机**——它们的终态是卡片不可见，不是任务态；
- `closeWhenDone` 三态（ADR-0102）扩展至 **stopped 终态**：完成与中止同为终态，
  同按 `false 常驻 / true 即关 / number(ms) 计时收口` 结算。

### 3. 停止与取消的分野：结果是否留卡

- **停止** = abort + **「已停止」终态留卡**（进度定格、文案「已停止」，默认常驻）；
- **取消** = abort + **立即隐藏**（不留结果）；
- 旧 `stop() ≡ complete()` 沿革废除——「中止伪装成完成」既误导宿主也无从协作取消。

### 4. × 独立成词 close（修订 ADR-0102 决策 2）

引擎 × 分支路由改为 `close → cancel → 直关` 逐级回落：task 覆写 `close()` =
非终态先 abort + `actions/close` 广播再关；completed/stopped 终态仅关卡（完成守卫
沿用 ADR-0102，不发无用 abort）。shell 无 close（× 走 cancel ≡ hide，既有行为零
变化）；自定义 type 定义 `close()` 即获得独立 × 语义。外部常需区分「用户主动放弃
任务」与「用户只是把卡关了」——五动词各自可订阅才配得上「完整控制」。

### 5. abortSignal：task 恒注入，与 UI 开关解耦

- `task` 类型**恒注入** AbortController（`stop/cancel/close` 三动词共用；否决
  `canStop/canCancel` 任一为真的门控——信号是底层能力，UI 开关不该决定它存不存在，
  也免去「想要信号就得开取消钮」的耦合）。其他 type 沿 `canCancel === true` 门控；
- `session.abortSignal` 扁平 getter（`data._abort.signal` 的公共读法，未注入为
  undefined）；
- 原地更新换装**复用既有 controller**（`buildInjectProps` 读现值回填）——中途
  `update()` 不换发新信号孤儿化已挂接的监听；
- abort 触发点 = stop / cancel / close 且非 completed/stopped 终态（pending 态也
  abort——「非终态终止即 abort」，幂等无害且统一）。

### 6. onXxx 订阅便捷面 + 自动清理

`session.onStart/onPause/onResume/onStop/onCancel/onClose(cb)`（组件 methods，
经 ADR-0089 扁平直达）——转发引擎侧 `_onControlAction`（事件名构造 + 段卫生单点）。
返回**退订函数**（fastevent 订阅者 `.off()` 包装）；退订函数登记 `entry.controlOffs`，
**卡销毁（unmountCard）自动清残留**（id 唯一使残留侦听永不再触发，纯泄漏）。

### 7. 术语：session 形参约定

词表正名「通知组件实例」（ADR-0089 退役 Session 类家族），但**文档/示例保留
`session` 作为 factory 形参名**（变量名不是类名，DX 顺口；退役的是类家族不是单词）。
CONTEXT.md 增补说明。

## 后果

- `data.paused` / `data.completed` 布尔键消失（改读 `data.state`）——组件 data 是
  运行态投影不入持久化，无迁移负担；旧测试断言同步更新；
- 内置动词成为通知卡 actions 命名空间保留名——与内置信号型 action（`close`/
  `cancel` 等，ADR-0036 决策 7）同名不同物但语义相容（都是广播信号）；
- `_emitControlAction` / `_onControlAction` 是 manager 的 `_` 内部面——内置组件
  （engine 自有物）调用内部面属既有惯例（assembly 对引擎内部件的越界同源）；
- 回归护栏：`notifications-task-control.test.ts` 十一条（动词事件方法级派发 /
  stop 分野 / stopped 的 closeWhenDone / cancel / 完成守卫 / progress 态门控 /
  canStart 门控 / 自动 start 补发与重显不重发 / factory 时序护栏 / onXxx 退订与
  销毁自动清 / abortSignal 恒注入与换装不换发）+ ADR-0102 既有测试的 × 用例改判
  close。
