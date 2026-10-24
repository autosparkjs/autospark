# ADR-0001: 通知模块插件化（@autospark/plugins）

- 状态：已接受（Accepted）；修订记录：2026-10-23 决策 4 零静态依赖（运行时桥）；2026-10-24 包更名 `@autospark/plugins` + 产物 IIFE-only（ADR-0003，决策 2/4 相应标注）
- 日期：2026-10-16
- 关联：engine ADR-0071（全局通知子系统）、ADR-0089（通知类型组件化）、ADR-0094（内置组件注册面）、ADR-0102（通知事件命名）、ADR-0111（插件机制）、ADR-0114（插件预加载队列）；先例：router 插件化（router 包 ADR 序列）

## 背景

通知子系统当前深植 engine：`features/notifications/` 运行时 10 文件约 2.4k 行（manager 955 / assembly 338 / types 368 等）+ 4 个内置组件模板（`autospark.notifications.shell/toast/task/confirm`）+ 保留键 `$notifications`（`NOTIFICATIONS_KEY`）+ `options.notifications` 配置 + `AutoSparkEvents` 的 `notifications/*/*/*` 事件键 + 公开类型导出。engine dist（`index.js` 494KB）中该子系统占比约 6-10%。

诉求：**按需加载、减小 engine 体积**。router 插件化已验证全套机制可复用：ADR-0111 加载即生效插件（查询期委托、晚注册天然生效）、ADR-0114 预加载队列（双加载顺序兜底）、ready/precompile 双钩子、声明合并类型扩展，以及 `engine.actions` Proxy 的运行时注册（set trap 全套规范化 + 广播语义）。

评估过程中的关键认知修正：`toast/confirm/task` 三件套**不是 engine 内置机制，而是通知类型的 action 门面**——[actions/index.ts](../../../engine/src/actions/index.ts) 中它们仅是对 `engine.notifications.add/show` 的薄转发。engine 真正内置的是通用 action 机制（描述符规范化、Proxy 注册表、信号广播），对通知零感知。因此三件套随通知模块迁移，不存在"action 留守导致 engine 残留"的问题。

## 决策

### 决策 1：全家桶迁移，engine 对通知零感知

迁移清单：

- `features/notifications/` 运行时 10 文件全部迁出；
- 4 个模板迁出，engine 种子表删除 `autospark.notifications.*` 条目与 `SHELL_PRESET_NAME` / `presetComponentName`；
- 三件套 action 声明自 `buildBuiltinActions` 移除（`SIGNAL_ACTIONS` 与 `back` 等无关内置不动）；
- `engine.notifications` 属性、构造接线与 `destroy` 中的 `dispose()` 直调、`NOTIFICATIONS_KEY`、`options.notifications` 类型、`AutoSparkEvents` 通知事件键、`index.ts` 通知类型导出全部移除。

engine **唯一增量**：公开导出 `getOverlayContainer`（通知容器挂载点，插件经 `$.ready(engine)` 取用；`compiler` / `findScopeByEl` / `store` / `logger` / `options` 均已公开）。

### 决策 2：落点 `@autospark/components/src/plugins/notifications`

否决独立包 `@autospark/plugin-notifications`：components 已有 IIFE global 产物机制与 autospark workspace 依赖，零新包成本；components 定位升级为**官方扩展集**，未来官方插件统一入住 `src/plugins/`。包 exports 增加子路径 `"./plugins/notifications"`。

> **修订（2026-10-24，ADR-0003）**：components 包更名 `@autospark/plugins`（包身份转型为「官方插件包 + 插件开发方式载体」），落点现址 `packages/plugins/src/plugins/notifications`；exports 子路径随 IIFE-only 产物策略退役。

### 决策 3：硬切，不留薄桥

否决运行时 stub / 薄桥：`engine.notifications` 属性、`NOTIFICATIONS_KEY` 等全部移除，插件 ready 时挂回。router 插件化删除独立 `createRouter` 入口已有同样纪律。

未装插件时的行为：`toast/confirm/task` action 查找失败报错、通知组件缺失——**报错本身即"该装插件了"的引导**，不做静默兜底。`$notifications` 保留键约束随插件走：engine 不再保留该键名，插件经类型扩展提供（用户拍板）。

### 决策 4：自举形态沿 router 逐项对称

- 双产物：IIFE `autospark.notifications.js`（全局名 `AutoSparkNotifications`）+ ESM 具名导出 `bootstrapNotificationsPlugin()`，模块加载即自举；ADR-0114 预加载队列兜底双加载顺序；

  > **修订（2026-10-24，ADR-0003）**：产物收敛 IIFE-only（ESM/CJS 退役），TS 模块导出仅服务源码级消费（测试/聚合入口）；自举双路径收敛为 `runtime/bootstrap.ts` 单点 `installPlugin`（含冻结队列 error 检查——原实现缺此检查，冻结队列 push 在严格模式抛未捕获 TypeError）。
- ready 自举序列：注册 4 组件模板（**engine 实例 builtinComponents 种子**，占用检查——不走插件静态全局表：该表命中走跨 engine 共享 def 缓存，会按名烘焙「继承自 shell 的 type def」击穿后续 engine 的 `options.components` 覆盖，且查找序压过 builtinComponents 使该覆盖通道失效；per-engine 种子与迁出前行为逐位一致）→ 构造 `NotificationManager`（读 `engine.options.notifications`）→ 注册三件套 action（`engine.actions` Proxy set，**占用检查**：用户同名声明优先，对齐内置补齐"只补未占用键"纪律）→ 注入 `$notifications` → 监听 `engine/destroy/before` 清理容器；
- 类型扩展 `types/augment.ts` 声明合并：`AutoSparkOptions.notifications`、`AutoSparkEvents` 通知事件键、`AutoSpark` 实例属性 `notifications`；全部通知类型自插件包重导出。`$notifications` 保留键运行时注入 **state 根**（`store.state.$notifications`，ADR-0072 面不变），不属于 `state.$` 元容器（`AutoSparkMeta` 是后者的类型）——根路径键无 interface 声明合并接缝，不做伪挂载；形态类型 `AutoSparkNotificationsState` 自插件导出，消费方经自定义 State 泛型声明（默认 `Record<string, any>` 下为索引签名 `any`，与迁出前行为一致）。

### 决策 4 修订（2026-10-23）：零静态依赖——autospark 能力运行时桥解析

用户拍板全家族纪律：**components 包内所有组件、指令、插件对 autospark 零静态值导入**（`import type` 编译期剥除保留），autospark 能力经 `src/runtime/bridge.ts` 运行时解析——与 plugin.md 的 IIFE 插件示例同构（插件只是引入即用，不静态依赖引擎）。原形态中 notifications ESM/CJS 产物的 `external: ["autospark"]` 与 IIFE 的 tsup 桥接 stub（esbuild 别名虚拟 CJS getter）整体退役。

运行时解析双捕获（`bridge.ts`）：

- `globalThis.AutoSpark`（脚本场景：IIFE 引擎先加载，直取全局）；
- 预加载队列插件体第二参 capture（ESM 场景：消费者 `new AutoSpark()` 构造开头 drain 队列时注入命名空间类）——bootstrap 双路径注册点（`bootstrap.ts` / `x-ripple.ts`）统一调用 `captureNamespace(autospark)`。

成员解析 `nsMember(name)` 缺位显式 error（响而不哑）：错误信息指明「autospark 须先于本插件加载（或经 `__AUTOSPARK_PLUGINS__` 预加载队列引导）」。

**engine 侧配套**（决策 1「engine 唯一增量 = getOverlayContainer」随之扩展）：

- **类静态补挂**（engine `index.ts` 源码级 `??=` 赋值）：`getOverlayContainer` / `markRaw` / `shallow` / `ComponentInstance` / `SCOPES_KEY`——IIFE 构建后处理的「全量导出挂类静态」不覆盖 ESM/CJS 形态（类静态仅有插件机制方法），须源码级补齐三形态同构面；名单须与桥消费面同步；
- **`SCOPES_KEY` 公开导出**：scope 注册表键（`store.state[SCOPES_KEY][scope.id]`）成为插件生态按路径精准订阅 scope 数据的公开坐标——契约广播类订阅必须走 `store.watch` 点路径（逐写入**同步 fire**），`scope.watch` 经 engine.scheduler 微任务合并会吞连续写入的中间值，破坏 ADR-0102「首个真实变更不吞」语义（notifications 卡片 holdOpen/progress/state 订阅即此）；
- **scope.destroy 职责归位**：scope 注册表条目随 scope 销毁统一回收（engine 内实现），插件不再越权手动 `delete`（notifications `disposeCard` 的越权清理已删）。

漂移锁：`src/__tests__/runtime-bridge.test.ts` 断言桥消费面五成员在命名空间齐备——engine 侧改名/移除即红，生产期 `nsMember` 抛错前置为测试期失败。

## 备选方案

- **半迁移**（三件套留守 + engine 定义 `NotificationManager` 契约接口 + guard 胶水）：否决——三件套本质是通知类型门面，留守方向别扭且 engine 仍有类型与运行时残留，瘦身目标落空。
- **独立包 `@autospark/plugin-notifications`**：否决——见决策 2，与 router 的对称性由目录结构与产物命名承接，不必以新包为代价。
- **运行时 stub 薄桥**：否决——见决策 3，与硬切纪律矛盾，属性永在的假象掩盖"功能未挂载"的事实。

## 后果

- **破坏性变更**：升级方需显式引入通知插件（IIFE script 或 ESM import）；纯信号 action 与 overlay 家族等无关内置不受影响。
- engine dist 实测（minify）：ESM 494 KB → 447.79 KB（**-46.21 KB，约 -9.4%**）；gzip 后 esm 130.18 KB（cjs 130.66 / iife 147.25）。通知插件自身 gzip：esm 15.05 KB（cjs 15.06 / iife 15.41）——按需引入的总成本仅为原内置体积的三分之一左右。
- engine 4 个通知测试文件（task-buttons / task-control / events / shell）迁至 components 包，随插件基座重建。
- 插件必须延续「用户同名声明优先」占用检查纪律，否则 ready 时会覆盖用户自定义的 `toast/confirm/task` action。
