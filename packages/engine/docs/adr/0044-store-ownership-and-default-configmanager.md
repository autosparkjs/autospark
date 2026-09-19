# ADR-0044：store 所有权收归 engine + 默认 configManager（推翻 ADR-0009 借用轨）

- **状态**：Accepted（grill-with-docs，两轮十一问）
- **日期**：2026-09-19
- **关联**：[ADR-0009](0009-store-or-state-input.md)（**本 ADR 部分取代**：决策 1/2 的借用轨移除、决策 4 的「仅自建路径消费」改为恒消费；决策 3 判别保留用于 throw、决策 5 静默兜空保留、决策 6 不变）、[ADR-0019](0019-x-bind-config-reference-prefix.md)（`@` 配置绑定依赖 `store.configManager`/`configKey`）、[ADR-0020](0020-x-model-schema-injection.md)（x-model 元数据注入同依赖）、[CONTEXT.md](../../CONTEXT.md)（「数据源 / 种子状态 / 引擎自建 store」词条）

## 背景

ADR-0009 确立构造器第二参双轨：`AutoStore` 实例（借用，destroy 不销毁）或裸状态（自建 `_ownsStore` 拥有）。其后 ADR-0019（x-bind `@` 配置引用）与 ADR-0020（x-model 元数据注入）落地，二者依赖 store 上的 `configManager` 与 `configKey`——而这两个字段在**外部传入的 store 上不可控**：

- autostore 4.5.0 事实：AutoStore 构造期 `_createConfigManager()` 按 `options.configManager` 三态建 cm（显式对象 / `globalThis.AutoStoreConfigManager` 全局回退 / 无）；`configKey` 不传则**归一为 `store.id`**；`storeOptions.configManager` 在构造期**一次性消费**，无法事后补挂。
- 借用路径下，engine 无法保证 cm 存在（可能没有 / 可能命中全局默认造成跨 engine 污染 / 可能是消费者自建），也无法控制 configKey（fullKey 复刻算法将带不稳定的 store.id 前缀）——`@` 绑定行为不可预测。

拷问暴露的接缝：① 移除借用的动机与共享 store 用例的取舍；② 实例入参的失败姿态（throw vs 静默）；③ `storeOptions` 的去留与优先级；④ engine 自建 cm 的生命周期；⑤ `configKey=''` 的理由与可覆盖性；⑥ 文档与迁移处置。

## 决策

### 1. 构造器只收裸状态（创建权换确定性）

签名改为 `constructor(el, state: State, options?)`，形参名 `state`。store 恒由 engine 在 `private _createStore()` 内自建并拥有，`_ownsStore` 字段删除（恒真无分支）。「一个 store 挂多个 engine」的用例**明确放弃、不留逃生舱**——1 engine 1 store 本就是既定约定（`_ensureScopesState` 的注入责任即建立在其上）。

### 2. 实例入参 throw；null/undefined 静默兜空保留

传入 `AutoStore` 实例（`isAutoStore` 判别，沿用 ADR-0009 决策 3 的 instanceof + brand）→ **throw Error**，信息附迁移指引（改传裸状态 + `storeOptions`）。静默解包 `store.state` 会把带 computed/watchers/schema 的 store 悄悄降级成裸状态重建，极难排查，否决。`null`/`undefined`/非对象静默兜空 store **保留**（ADR-0009 决策 5，无害）。

### 3. `_createStore` 字段级默认：内存 configManager + `configKey=''`

`storeOptions` **恒消费**（不再有「实例路径忽略」分支），两个字段带 engine 侧默认、消费者显式传入优先：

- `configManager` 为 nullish（缺省/`null`）→ 补 `new ConfigManager({ load: () => ({}) })`——**内存空 source**（autostore `ConfigSource` 必传 `load`），角色定位为纯响应式 schema 注册表：无持久化、不设 `global`（不注册全局默认）、engine 间互不串扰。**三态**：缺省/null = engine 内存 cm；传 `ConfigManager` 实例 = 消费者自管；`false` = 完全关闭（`@`/注入走三层降级）。
- `configKey` 为 nullish → 补 `''`（falsy → fullKey 不加前缀，`@` 左侧配置路径与状态路径同形）。**多 store 共用同一 cm 时必须显式配互异 configKey**，否则 fullKey 撞车（文档化的使用者责任）。

### 4. destroy：恒销毁 store；仅销毁自建 cm

`destroy()` 恒调 `store.destroy()`（回收 computedObjects / 订阅 / Proxy；其内部先向 cm `remove(this)` 注销本 store——**先 store 后 cm** 的次序保证注销先行）。随后仅当 cm 为 engine 自建（`_ownedConfigManager`）才 `cm.destroy()`——ConfigManager 本身是 AutoStore（自带响应式 state），不自建不销毁会在反复 create/destroy engine 的 SPA 场景泄漏；消费者经 `storeOptions.configManager` 传入的不动（所有权对称）。engine 不新增 `configManager` getter（经 `engine.store.configManager` 可达，YAGNI）。

### 5. 文档处置：只删不补、暂不挂 changeset

features.md / initial.md 的「传实例 / 嵌入已有架构」内容**只删不补**迁移叙事（用户决策）；throw 错误信息内含一句迁移指引。本变更**暂不挂 changeset**（用户决策）。

## 被否决的方案

- **保留借用轨 + 文档声明「`@` 行为取决于该 store 的 cm 配置」**：不可控的全局 cm 回退会引入跨 engine 状态污染，声明无法兑现确定性。否决——创建权换确定性（决策 1）。
- **warn + 解包 `store.state` 当裸状态**：悄悄丢弃 computed/watchers/schema，排查成本极高。否决——throw（决策 2）。
- **engine 默认用 `globalThis.AutoStoreConfigManager` 全局 cm**：多 engine 共享 schema 互相串，违背隔离。否决——每 store 一个内存 cm（决策 3）。
- **engine 默认接 localStorage 持久化**：持久化策略越权归消费者。否决——内存空 source。
- **`storeOptions` 完全收死（不留逃生舱）**：多 store 共享一份 schema / 配置中心场景有真实需求。否决——字段级默认（决策 3）。
- **`configKey` 用 autostore 默认（store.id）**：fullKey 带不稳定随机前缀，`@` 路径与状态路径不同形。否决——默认 `''`。
- **`_createStore` 惰性建 cm（schema 存在才建）**：autostore 构造期一次性消费 `storeOptions.configManager`，事后无法补挂，技术不可行。否决。

## 后果

- ✅ **`@` 配置绑定 / x-model 元数据注入开箱即用**：`configurable` 字段自动注册 schema，零配置。
- ✅ **多 engine 隔离**：各自内存 cm，互不污染。
- ✅ **生命周期自洽**：engine 拥有 store 与自建 cm，destroy 全回收（含 SPA 反复建毁场景）。
- 🔴 **破坏性变更**：存量约 34 处实例入参调用点（测试 23 + demo 6 + 文档示例 5）迁移为裸状态 + `storeOptions`；测试侧 420 处 `store.state` → `engine.state`；`e2e.test.ts`「destroy 不销毁共享 store」契约删除（共享语义无宿主）。
- ⚠️ **「嵌入已有 AutoStore 架构」能力移除**：原用户把状态定义（含 computed/configurable 声明与 autostore 选项）搬进裸状态 + `storeOptions`。
- ⚠️ **共享 cm 的 configKey 纪律**：多 store 共用 cm 须互异 configKey，属文档化使用者责任（x-model.md「默认即有 configManager」tip + 本 ADR）。
