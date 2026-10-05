# ADR-0083：x-import 异步父的延迟解析（pending 继承表）

- 状态：已采纳
- 日期：2026-10-04
- 关联：[ADR-0081](0081-component-define-inherit.md)（组件继承——本 ADR 修订其「父须先于子声明 / miss 即拒绝」语义）、[ADR-0022](0022-x-component.md)（`component/registered` 事件与消费侧等待机制 R6=B）、[ADR-0066](0066-x-component-remote-loader.md)（x-import / loader 远程管线）

## 背景

ADR-0081 把继承解析钉在编译/注册的同步时刻：父查找 miss → warn + 拒绝注册。x-import 异步父因此不可用（同文件远程继承因按文档序同步注册而天然可用）。消费侧（`x-component`）早有异步等待机制（loading 占位 + `component/registered` 重试）——缺的只是把「等待」引入**定义侧**。

设计分析后拍板**方案 A（延迟解析）**：miss 不再终局拒绝，挂起等父注册事件排水。

## 决策

### 一、挂起语义（miss ≠ 拒绝）

- 父未就绪 → 解析原料（`componentEl` 引用、子独立 def、owner scope、查找闭包）压入 **engine 级 pending 表**（父名 → 任务队列），子组件暂不注册；
- resolver 增 `deferMissingParent` 形态：父 miss 返回 `PENDING_PARENT` 哨兵（不 warn）；**值空 / 指向自身 / 继承环仍是终局拒绝**（warn + 出队，不受挂起影响）；
- 挂起期发一次**软提示** warn（「暂未就绪，已挂起」）——typo 与异步未归同形，无法在挂起时区分。

### 二、排水与级联

- `importComponentsFromUrl` 每注册一个组件（发 `component/registered` 后）排水该名的挂起任务；
- 任务重跑解析：成功 → 注册 + 发 `component/registered`（子名）+ **递归排水**（等该子的孙组件逐级解锁——任意到达顺序的链都会收敛）；同名注册不在子组件可见 scope 链上 → 任务返回 false 留队继续等；终局失败（如异步环在此时暴露）→ warn + 出队；
- 消费侧零改动：子注册前的 `x-component:子` 走既有 loading 等待，注册事件即重实例化。

### 三、诊断补偿

- fetch 失败时列出**仍未就绪的挂起父名** warn（typo 与「来源加载失败」的兜底线索）；
- `engine.destroy` 清空 pending 表。

## 实现要点（防再踩）

1. 两条解析路径（compiler 本地 / engine 远程注册）各自把「解析 + 注册尾巴」收拢为闭包，挂起任务即闭包重放——两路径的任务注册尾巴不同（远程含 global 双分支），不可共用；
2. 任务返回值三态：`true` 出队（成功 / 终局失败）、`false` 留队（本次同名注册不可见）——**不要**在排水里无条件清队；
3. pending 条目引用原始 `componentEl`（模板树本就长存，无额外放大）；
4. 同文件远程继承不经挂起路径（文档序同步注册，父先落位）——勿为其引入异步开销。

## 被否决 / 演变的方案

- **ADR-0081「miss 即拒绝」**：本 ADR 修订——异步父需求成立；保留终局拒绝于「值空 / 自身 / 环」三类确定性失败；
- **阻塞式**（compile 前 await 所有 fetch）：推翻引擎同步编译契约，波及构造 / patch / 实例化全线；
- **占位 def 立即注册**（空快照后续替换）：`scope.components` 以快照为键（WeakMap），换 def = 换键，且消费者可能已实例化空壳；
- **显式依赖声明**（`x-define:inherit` + `x-import` 属性二合一，方案 C）：liveness 确定（fetch 失败即 loud error），但语法面扩张——留作后续可选增强，不与 A 同时上。

## 语义代价（有意接受）

1. **typo 诊断后移**：拼错父名从定义期 loud warn + 拒绝，变为挂起软提示 + 使用处无限 loading（与拼错组件名的既有 UX 同类）；
2. **异步环永悬置**：A 等 B、B 等 A——两个 def 都不到齐，同步环检测无输入，只剩 pending 静默（fetch 失败提示是唯一线索）；
3. 心智模型：继承从「编译期一次性」变为「**就绪即解析**（lazy）」——文档的「父须先于子声明」放宽为「就绪前子暂缓注册」。
