# ADR-0075：x-model 写回落点对称化——简单路径写回经聚合视图透传（域字段落域）

- **状态**：Accepted
- **日期**：2026-09-30
- **关联**：[ADR-0029](0029-x-data-mount.md)（x-data 私有响应式域与 `$scopes` 容器）、[ADR-0053](0053-component-data-boundary.md)（组件封闭数据边界——getContext 的边界语义被写路径直接继承）、[ADR-0064](0064-x-resize.md)（x-resize 已有的落点解析先例）、[CONTEXT.md](../../CONTEXT.md)（「绑定局部数据」文档口径）
- **共识来源**：用户浏览器实测发现 x-splitter direction demo 切换不生效 → 复现定位 x-model 简单路径「读局部、写全局」基准分裂 → 用户裁决引擎层修正（读写对称，仅 x-model 范围）

## 背景

x-model 的两条方向走不同支路，对同一路径名的解释基准不一致：

- **读方向**（state→DOM）：`scope.watch` 在有 x-data 祖先时分流到表达式支路，`getContext()` 聚合视图按「本层域 → 父域 → store 根」就近命中——读到域值 ✓
- **写方向**（DOM→state）：简单路径快通道 `setVal(store.state, path, value)` **直写 store 根**——域被绕过 ✗

后果：`x-data="{ count: 0 }"` 内 `x-model="count"` 输入后写到 `state.count`（根上凭空长出幽灵键），域值不变、插值不动——**静默分裂**（无 warn 无报错，控件能动界面不动）。x-model.md「绑定局部数据」曾以显式 `set` 表达式为约定解法（set 经 `with(scope)` 走 getContext set 陷阱落域）。

## 决策

### 一、写回落点经聚合视图透传（读写对称）

`AutoSparkScope` 新增 `writeThrough(path, value)`：简单路径写入经 `getContext()` 聚合视图透传——单段路径直接赋值（Proxy set 陷阱就近命中：本层 locals > x-data 域 > 沿父视图链，全链未命中 Reflect.set 透传落根）；多段路径首键命中视图时取**域内成员对象**对余段 `setVal`（写入留域内），未命中/非对象落根 `setVal`（保持旧「根上自动建中间节点」语义）。

边界语义**免费继承** getContext 既有实现：组件封闭边界（ADR-0053）内域不在父视图链上自然落根；declarer 基准、isSlotContent 的视图改道同样被写路径继承——无需第二套边界判定。

### 二、范围：仅 x-model

x-model 的 `_writeToState` 快通道接入 `writeThrough`（flags 防循环簿记不变——写入仍在 `store.update` 上下文内执行）。**x-splitter 的尺寸写回维持直写根现状**（归并行会话处理）；x-resize 已有落点解析（`_resolveSizeEntry` local 分支直写域）本就对称，不动。

### 三、set 表达式保留

`x-model-options="{set:...}"` 不废弃——写转换/字段拆分场景仍走它；ADR-0075 之前它是域内绑定的必需解法，之后降级为可选。

## 被否决的方案

- **仅加 warn 不改行为**：静默变可发现但坑仍在，用户裁决直接修正语义。
- **手写第二套落点解析**（沿 scope 链逐层 hasOwnProperty 判定）：与 getContext 的 set 陷阱重复实现边界/基准逻辑（DRY 违背）——聚合视图透传让既有实现成为唯一真相源。

## 后果

- **行为变更**：域内简单路径写回落域（原落根）。旧依赖「写根」副作用的用法（根上幽灵键被下游消费）会受影响——该用法本身是分裂 bug 的产物，不设迁移期。
- **文档同步**：x-model.md「绑定局部数据」的 warning 框改写为对称语义说明；`set` 写法降级为可选（tip）。
- **新增测试**：`write-through.test.ts`（域内单段/多段写回、radio→x-splitter direction 集成场景、嵌套域就近命中、无域落根兼容）。

## 修订记录

- 2026-09-30 初版。
