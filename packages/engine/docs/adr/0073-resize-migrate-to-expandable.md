# ADR-0073：x-drawer / x-splitter 的 resize 迁移到 x-expandable

- **状态**：Accepted
- **日期**：2026-09-30
- **关联**：[ADR-0072](0072-x-expandable-resize.md)（内建单边 resize 与同元素互斥——本决策的消费前提）、[ADR-0070](0070-x-expandable-compose.md)（组合与边线交互协调）、[ADR-0064](0064-x-resize.md)（ResizeSession 核心与 overlay 集成——drawer 迁出、dialog 保留）
- **共识来源**：grilling 决策 Q1–Q4 全确认（迁移范围 C / 让位内建化认知 / splitter 写回路由 / dialog 保留）

## 背景

ADR-0072 给 x-expandable 内建单边 resize 后，drawer 与 splitter 的 resize 仍走各自私有路径：drawer = overlay `_attachResize` + 把手让位转发 + 桥接/抑制三件套；splitter = `data-expandable` 透传 resize **半成品生效**（写路径未与分割器尺寸管理路由，`_maxDecl` 双头接管）。跨组件边线协调复杂度分散在三处。

## 决策

### 一、drawer 迁移（Q1-A）

`x-drawer-options.resize` 翻译为面板上组合 x-expandable 的 resize 通道（`{enable: false, resize, direction: placement}` 退化形态）——`_attachResize` 收编为 **compose 装配**（per-open 生命周期随面板）；删除 `_resizeAllowedHandles` / `_applyResize` 覆写（方向推导 / 短轴写入归 expandable）；`resize:*` 经 compose 的 **eventTarget 参数**派发指令宿主（`@resize:end` 监听位置不变）；driver.`resized` 钩子进 `_resizeMem`（会话记忆保留，ADR-0064 决策八）并调度把手跟随（rAF 合帧）。

### 二、「自有手柄 vs 把手」语义内建化认知（Q2）

语义口径统一为「**下压拖拽 = 调节、点击突出半圆 = 折叠**」——但实现分语境：**standalone 无需让位代码**（手柄 z10 > 把手 z5，z 序天然交付正确语义）；**drawer 需转发**因其 z 序倒置（把手 overlay+1 > 面板内手柄 ≤1000），让位转发保留在 drawer 侧（`_onTriggerPointerDown`）——通用化是无的放矢。

### 三、splitter 写回路由（Q3）

> **2026-09-30 取消**（用户裁决）：splitter 侧迁移回退——`resized` 路由与 `data-expandable` resize 透传转正均撤销，`resize` 加入分割器接管清单（warn + 剥除，面板调节唯一入口 = 分隔条拖拽）。drawer 迁移与 `resized` 钩子（drawer 会话记忆消费）保留。

原案：compose driver 增 `resized(decl)` 钩子——`data-expandable` 透传 resize 后，拖出值经路由同步 `_curSize` / `lastSize` / 状态写回：边缘手柄与分隔条拖拽双入口单一尺寸真相。

### 四、dialog 保留（Q4）

四角 resize 超出单边语义，overlay 层 `_attachResize` 为 x-dialog 保留；x-resize 指令的独立使用（完整多方向能力）不变。

## 被否决的方案

- **仅迁移其一**（Q1 A/B）：两处复杂度同源（跨组件边线协调），拆半迁移留一半；
- **drawer 让位逻辑移入 expandable 通用化**：standalone z 序已正确，通用化无的放矢——drawer 的 z 序倒置是 overlay 层叠特有。

## 后果

- drawer 删除 `_resizeAllowedHandles` / `_applyResize` 覆写与 `ResizeDirection` import；`_attachResize` 语义从「overlay 接线」变「compose 装配」；
- splitter `data-expandable` 的 resize 透传从半成品转正（双入口单真相）；
- drawer resize 的 `handles` 子键 warn 文案变为 expandable 的「不适用单边语义」（原「收窄」语义消亡——合法集本就单方向）；
- x-resize 指令独立使用与 dialog 集成不变。

## 修订记录

- 2026-09-30 初版。
