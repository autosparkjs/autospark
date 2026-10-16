# ADR-0116：插件 precompile 钩子与预加载队列 drain 前移

- 状态：已接受（2026-10-16）
- 关联：**修订 ADR-0114 决策 3**（drain 时机自 `setupPluginQueue` 前移至 engine 构造开头）；承接 ADR-0111（`$.ready` 的同族回调机制，语义对照）；消费者 ADR-0011（router 插件自举）

## 背景

router 插件化（ADR-0011）需要一个「首编译前」的钩子：entry 静态模板的 x-outlet 简写 transform 与默认出口插入，必须在 engine 的 template 克隆（`rootEl.cloneNode`）**之前**改写 `engine.el`，改写才能随克隆参与首编译——编译后再改 DOM，产物不回改源模板，等于无效。

ADR-0114 的 drain 位于 `setupPluginQueue` 内（DirectiveManager 创建后、autostart compile 前）——该位置已晚于 template 克隆，赶不上首编译。precompile 的窗口比 ADR-0114 的指令安装窗口更早，drain 必须再前移。

## 决策

### 决策 1：`AutoSpark.precompile(fn)`——fire-once、无 retain

per-engine 构造早期各调一次，执行时机 = 构造开头 el 解析后、template 克隆前、store 建立前。回调收 `(engine, autospark)` 双参（与 ADR-0114 的 `PluginBootstrap` 同形）。

**无 retain（刻意区别于 `$.ready`）**：晚注册对已存在的 engine 是 no-op——错过即错过。首编译是不可重放的事件：entry 模板已编译完的 engine 上再做 DOM 预处理毫无意义，retain 只会制造「看似生效实则无效」的假象，不如让错过显式可见。回调表用数组（无去重需求；`$.ready` 的 Set 去重服务于 retain 重入，本表无此语义）。抛错隔离记日志，不中断其他回调与 engine 构造。

### 决策 2：drain 前移 + fire 紧随

`drainPluginBootstrapQueue` 从 `setupPluginQueue` 移到 engine 构造开头（`this.el = rootEl` 之后、template 克隆之前），drain 后立即 `firePluginPrecompile`。这样**插件体注册的 precompile 恰好赶在本 engine 的 template 克隆前**——首编译不缺席。

`setupPluginQueue` 因此只剩两件事：指令安装器队列全量消费（位置不变：DirectiveManager 创建后、autostart compile 前）+ `liveEngines.add`，不再 drain。安装器循环的时序关系不受影响（安装器仍先于首次编译注册）。

### 决策 3：bootstrap 约束

precompile 回调内**只能注册与做纯 DOM 预处理**，不得触碰 `engine.store`（此刻尚未建立——store 在 template 克隆后才创建）。需要 per-engine 状态的包进 `$.ready`（构造末尾触发，store 已就位）。与 ADR-0114 插件体的约束同构、更严格。

### 决策 4：fire 以快照迭代

`firePluginPrecompile` 对回调表取数组快照迭代——回调内新注册的 precompile 不参与本轮（首编译前的窗口极短，执行期间再入队属误用，对下一 engine 生效）。

## 后果

**正面**：

- 插件获得「首编译前 DOM 预处理」的正规通路（router 的出口自举是首个消费者；后续插件同需求免费）；
- drain 时机与首编译的关系显式化：预加载队列的消费点即 precompile 的 fire 点，两个机制一处收口。

**代价 / 明码标价的边角**：

- ADR-0114 决策 3「drain 在 setupPluginQueue 内、安装器循环之前」被修订——构造序中 drain 位置整体前移；
- 构造早期再添一个回调面：precompile（克隆前，无 store）→ ready（构造末尾，有 store）的双阶段心智需要文档讲清。

**边界（不做）**：

- 晚注册 no-op 不告警（语义即文档）；
- engine 构造中途抛错不回滚已 fire 的回调（与 ADR-0114「队列不回滚」同调）；
- 不提供「对已编译 engine 重放预处理」的补救——错过即显式错过。

## 实施落点

- `src/features/plugin/index.ts`——`PluginPrecompileCallback` 类型 / `registerPluginPrecompile` / `firePluginPrecompile`（快照迭代 + 抛错隔离）；`setupPluginQueue` 去 drain；
- `src/engine/engine.ts`——构造开头 el 解析后 `drainPluginBootstrapQueue(this)` + `firePluginPrecompile(this)`；`static precompile`（挂在 `static ready` 旁）；
- `src/index.ts`——导出 `PluginPrecompileCallback` 类型；
- `src/__tests__/features/plugin.test.ts`——precompile 用例组（fire-once / 无 retain / 抛错隔离 / 快照迭代）；
- 消费方：`@autospark/router` `src/plugin/bootstrap.ts`（ADR-0011 的 `routerPrecompile`）。
