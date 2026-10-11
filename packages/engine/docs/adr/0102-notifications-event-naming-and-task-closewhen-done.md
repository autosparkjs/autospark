# ADR-0102：通知事件分层命名升级 + task 完成语义反转（closeWhenDone）

- 状态：已采纳（2026-10-11 grilling 共识落盘，同日实施）
- 日期：2026-10-11
- 关联：ADR-0003（事件契约——分层命名 + 通配订阅的信号面总纲）、ADR-0071
  （决策 20 双通道事件——本文修订其命名）、ADR-0083（task 会话语义——本文修订其
  完成收口语义）、ADR-0085（`components/<名>/registered`——emit 具体名 + 类型表
  模式键的动态键先例）、ADR-0089（决策五 holdOpen 计时拦截——本文修订其联动实现）

## 背景

通知事件原为扁平冒号名（`notification:add` 等 7 个），与引擎事件总纲「分层命名（`/`
分隔）+ 通配符订阅」（ADR-0003）不符——通知族是总纲发布后唯一残留的冒号名家族。
同时 grilling 实测确诊：task 完成后**永不自动关闭**——`bindContractWatches` 的
holdOpen watcher 用「数 fire 跳首次」去重，而 `store.watch` 建立即激活的首次求值
并非确定发生，task 一生仅一次的 `holdOpen` true→false 完成转换恰被吞掉；同族的
`progress/paused/completed` 三个 watcher 同病（首个真实变更的 `update` 事件被吞）。
顺藤发现 task 完成收口语义本身需要重设计（决策 3）。

## 决策

### 1. 事件名：`notifications/<type>/<id>/<verb>`，verb 七值 + actions 尾段

- verb：`add` / `update` / `show` / `hide` / `read` / `status`，与旧名 1:1 映射、无增减；
- action 事件：`notifications/<type>/<id>/actions/<名>`——末段 = action 名
  （`ResolvedNotificationAction.name`：字符串形态 = action 名；对象形态 =
  `AutoSparkAction.name`，缺省回落 `title`）。`name` 是标识/事件键，`title` 是展示
  文案，分工不混用；
- 旧名**彻底删除**（未发布零迁移惯例，无兼容双发）；
- **emit 面恒具体名**（`components/<名>/registered` 先例，`as any` 类型通道），
  **订阅面模式键**入 `AutoSparkEvents`（`notifications/*/*/add` 等 7 条 verbatim，
  同 `directive/*` 惯例）；`*` 配一段、`**` 配尾段（中段 `**` 不支持）；
- **段卫生**：type/id/action 名中的 `/` 与 `*` 组合具体名时替换为 `-`——事件名仅是
  广播/匹配键，记录 id 本身不受影响；
- **双通道保留**（ADR-0071 决策 20）：总线 + 卡片元素 `dispatchEvent`（具体名冒泡）；
  action 额外以 anchor 为根派发。payload 零变化（`{ notification, el }`，action 附
  `action`/`value`）。

### 2. × 点击语义：经组件 `cancel()` 派发

引擎 `_onCardClick` 关闭钮分支改调 `entry.instance?.methods.cancel?.()`（无 cancel
的自定义 type 回落 `_dismiss`）。shell 的 `cancel()` ≡ `hide()`（既有通知行为零变化）；
task 覆写为「未完成先 `signal.abort()` 再关」——**未完成的 task 点 × ≡ cancel**。
类型中立：任何 type 覆写 `cancel()` 即可改写自身 × 语义。

### 3. task 完成语义反转：默认常驻 + `closeWhenDone`

- **默认（`closeWhenDone: false` / 缺省）：完成后常驻**——完成态卡片 sticky 展示，
  直到 `×` / `hide()` / `delete()` 手动收口。`delayClose` 对 task **彻底无效**
  （文档声明，不 warn——避免误伤 `types` 配置层）；
- `closeWhenDone: true`：完成**即关**（组件直呼 `hide()`）；
- `closeWhenDone: number`（ms）：完成 n 毫秒后关——经 `update({ delayClose: n })`
  写入生效配置后翻 `holdOpen = false`，走 watcher → `_startTimer` 管道，**hover
  暂停 / remaining 倒计时全保留**；
- `closeWhenDone` 是 **task 专属键**（进 `NOTIFICATION_RESERVED_KEYS`），宽松入参
  `boolean | number`（`width`/`offset` 同款先例）；完成时刻读值——完成后再
  `update({ closeWhenDone: true })` 不追溯收口；
- `cancel()` 加完成守卫：已完成的 × / cancel 不发无用 abort。

### 4. holdOpen 机制保留，watcher 改值比对

`holdOpen` 数据旗标（引擎「组件持卡勿计时」的类型中立契约）与 watcher 联动机制
**原样保留**（不引入 `release()` 命令、不删 watcher）。修复在去重方式：bind 时记
初值、fire 时读 `data` 现值、同值跳过——bind 首评在场被去重消解、缺席也不误伤，
且不再依赖 watch 回调参数取值（末参形态不稳定）。`progress/paused/completed`
三 watcher 同步改值比对（首个真实变更即广播 `update` 事件）。

## 后果

- 订阅方迁移：`engine.on("notification:hide", ...)` → `engine.on("notifications/*/*/
  hide", ...)` 等；回调收 `{ type, payload }` 信封（payload 在 `.payload`——
  FastLiteEvent 契约，全事件族一致）；
- `ResolvedNotificationAction` 增 `name` 字段（预解析面，引擎内部 + 事件名末段）；
- 事件名含具体 id：消费方可精确订阅单卡（`notifications/task/<id>/update`），
  亦可按 type / verb 批量通配——旧名做不到的粒度；
- 回归护栏：`notifications-events.test.ts` 十一条（通配/段卫生/双通道/action 名/
  closeWhenDone 三态/× 取消/运行键首变更）。

## 修订记录

- **2026-10-11（ADR-0104 修订）**：决策 2「× ≡ cancel」与决策 3 沿革的
  `stop() ≡ complete()` 均被 ADR-0104 修订——× 升级为独立 close 动词
  （`close → cancel → 直关` 逐级回落），停止改为 abort + 「已停止」终态留卡；
  决策 3 的 closeWhenDone 三态结算扩展至 stopped 终态；决策 4 的运行键三元组
  `progress/paused/completed` 随状态机改为 `progress/state`。本文事件命名
  （决策 1）与值比对去重机制不受影响、继续有效。

