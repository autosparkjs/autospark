# ADR-0120：版本机制收敛——versions 清单归渲染侧，`$.version` 纯元状态

- 状态：已接受（2026-10-19）
- 日期：2026-10-19
- 关联：ADR-0119（x-version 指令——本 ADR 修订其决策 5 的清单归属与切换语义）、
  [router ADR-0014](../../../router/docs/adr/0014-version-url-rewrite.md)
  （被本 ADR 取代并废弃）、ADR-0112（元状态容器）、ADR-0013（语言机制——保留导航
  语义，与本 ADR 分道）

## 背景

router ADR-0014 为版本建立了与语言同构的完整机制：`versions` 清单经挂载矩阵传入
router、`getVersionUrl` 单钩子三通道 URL 重写、赋值 `$.version` 触发完整导航管线重入、
默认 hash 模板并入版本分量实现缓存隔离。实施后浏览器实测发现：demo 切换版本视图
不刷新——定位在 `store.watch` 触发后 router 内部切换链未达预期（真实 autostore
响应式链路在 router 测试基座中从未被覆盖——既有用例全部基于 stub store 手动通知）。

更根本的是成本收益失衡：语言切换必须重载视图（内容文件按语言不同），而版本的真实
诉求只是「同一页面按版本显隐不同区块」——x-version 指令（ADR-0119）已完整覆盖该
渲染面。为渲染诉求维护一套 URL 重写 + 导航重入 + 缓存隔离机制，还引入了导航副作用
（切版本重载整页、丢失组件状态）与版本/语言复合重写顺序的记忆负担。

## 决策

### 决策 1：路由版本化整体废弃

删除 router 侧全部版本机制：`AutoSparkRouterOptions.versions` / `getVersionUrl` /
`AutoSparkGetVersionUrl` / `AutoSparkVersionUrlType` 类型、`src/features/version.ts`
（VersionManager）、URL 重写链（baseLoader / routes 的版本重写点——重写链只剩语言）、
默认 hash 模板的版本分量（缓存键不再含版本）、切换导航重入（`_rerunForMetaChange`
收归 `$.language` 专用）。router 对版本零感知。

### 决策 2：versions 清单归 engine，仅渲染用途

`AutoSparkOptions.versions?: string[]`（engine 自有类型，router 侧 augment 声明合并
删除）——旧到新排列、**末项即默认版本**（方向与语言首项默认相反，保留 ADR-0014 的
裁决）。清单唯一用途：**构造期归一 `$.version` 初值**，运行时无消费方。

### 决策 3：构造期归一规则

engine 构造期（预置注入在前、清单归一在后）：

- `options.version` 预置（非空串）→ 直接注入 `state.$.version`；
- `versions` 清单非空时二次归一：当前值空缺 → 写入默认版本（末项）；预置未命中
  清单 → warn + 回退末项；命中 → 尊重；
- 无清单 → 只认 `options.version` 预置，无默认注入。

### 决策 4：运行时赋值自由，无导航语义

`$.version` 运行时赋值是纯响应式元状态写入——无校验（清单校验只发生在构造期归一）、
无导航、无 history 副作用；x-version 订阅即时重算显隐。「按版本加载不同内容文件」
的效果由应用层自理：x-version 切换显隐，或监听 `$.version` 自行取数。

## 后果

**正面**：

- 版本机制从「router 特性」缩为「engine 构造期几行归一逻辑」，删除 VersionManager
  与重写链后 router 面积净减；
- 无导航副作用——切版本不再重载整页、不丢组件状态；
- 消除版本/语言复合重写顺序（先版本后语言）的记忆负担，重写链只剩语言单机制；
- 版本与路由解耦后，纯 engine 应用与 router 应用行为一致。

**代价 / 边界**：

- 「同路径按版本取不同内容文件」不再内置——迁移路径：x-version 显隐多版本区块，
  或应用层监听 `$.version` 自行 fetch；
- 数据缓存不再按版本隔离（hash 无版本分量）——按版本取数的应用自行携带版本参数
  做缓存键；
- `versions` 清单运行时无校验：赋值清单外的值不告警（异于语言「未命中 warn 回写」）。

## 实施落点

- `packages/engine/src/types/index.ts`——`versions?: string[]` 新增（注释声明渲染侧
  语义）、`version?: string` 注释更新；
- `packages/engine/src/engine/engine.ts`——构造期预置注入 + 清单归一；
- `packages/engine/src/__tests__/features/version-meta.test.ts`（新增）——归一矩阵
  与运行时赋值自由用例；
- router 侧删除：`src/features/version.ts`、`src/__tests__/features.version.test.ts`、
  config/augment 类型、`router.ts` VersionManager 挂载、baseLoader/routes 重写点、
  `_getHash` 版本分量、bootstrap versions 传递；
- docs：指南版本章节重写、x-version 参考页 router 表述清理、router 版本 demo 删除、
  router ADR-0014 标废弃。
