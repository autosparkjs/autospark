# ADR-0085：组件注册事件按名化（`components/<名>/registered` + retain 补发）

- 状态：已采纳
- 日期：2026-10-04
- 关联：[ADR-0022](0022-x-component.md)（`component/registered` 事件源头与消费侧等待 R6=B）、[ADR-0066](0066-x-component-remote-loader.md)（x-import / loader 远程注册管线）、[ADR-0081](0081-component-define-inherit.md)（组件继承——依赖方场景的来源）、[ADR-0083](0083-async-parent-deferred-inherit.md)（挂起排水——本 ADR 修补其本地注册路径缺口）

## 背景

注册事件现状是**单数全局事件** `component/registered`（载荷 `{ name, global }`），且只在 3 处异步 / 挂起路径发射：远程导入普通注册、远程挂起排水、本地挂起排水。存在两类问题：

1. **覆盖不全**：本地普通 x-define 注册（含继承即时解析）与全局 `options.components` 懒预编译首解析均不发事件——「组件已注册」对外不可观测；
2. **晚订阅漏听**：fastevent 事件不回放——用户代码依赖指定组件（如 `x-define:inherit="card"` 场景依赖 card）须订阅全局事件再按名过滤，且**订阅晚于注册即永远错过**。组件依赖方没有可靠的「就绪通知」通道。

机制事实（fastevent 2.7.0）：`emit(type, payload, true)` 的 retain 按**精确事件名**保留最后一条消息，之后任意 `on()`（含 `once`、通配符）订阅即自动补发；`offAll` / `destroy` 清空。引擎已有先例：`engine/ready` 即 retain 发射。

## 决策

### 一、按名动态键 + retain

新事件 `components/<名>/registered`（载荷 `{ name, global }`，**retain=true**）：

- **订阅键即过滤**：依赖方 `engine.on("components/card/registered", ...)` 直订目标组件，无须回调内比对 name；
- **晚订阅补发**：注册先于订阅也能立即收到（retain 存最后一条）——「不错过」是本决策的核心动机；
- **通配符批量补发**：`on("components/*/registered")` 订阅即补发**全部**已注册名（fastevent 对 retain 消息做通配匹配）——天然成为「注册表快照」观察面；
- 同名覆盖注册（同 scope 重声明 / loader 远程覆盖）：照常重发，retain 更新为最新载荷——「该名已注册」信号无损。

### 二、命名：复数前缀 `components/`

与注册表数据键 `scope.components` / `options.components` 对齐（`components` 是「组件注册表」的既有词汇），区别于事件命名空间的单数惯例（`directive/<名>/mounted` 等）。grilling 拍板采纳复数。

### 三、移除旧事件（硬切）

`component/registered` 整体移除，**不保留双发兼容层**：内部消费者（x-component pending 等待）改订带名事件；用户侧 `on("component/registered")` 从此永不触发（无 warn 通道，开发阶段硬切——`scope` 配置键先例）。历史 ADR（0022/0066/0083）正文保留旧称，作为决策当时的记录。

不给旧事件加 retain 的原因（即便保留也不行）：retain 只存最后一条，晚订阅的全局监听器会收到「最后一个注册的组件」的补发——对按名过滤的全局监听器是误导性噪音。

### 四、全路径收敛单一 helper

「注册成功」的后置动作（发事件 + 排水挂起继承）收敛到 engine 单一私有方法，**5 条注册路径全走它**：

1. 本地普通 x-define（原不发）；
2. 本地继承即时解析（原不发）；
3. 本地挂起排水（原发，但排水与发射散在调用点）；
4. 远程导入普通 / 挂起排水（原发）；
5. 全局 `options.components` 懒预编译首次解析（原不发）。

结构不变量：**凡注册必发事件、必排水**——将来新增注册路径只调 helper，不可能只做其一。`default`（无值 x-define）照常发 `components/default/registered`，规则统一无特判。

**顺带修复（ADR-0083 实现缺口）**：本地「父在子后」的文档顺序（子先挂起 pending、父后经普通路径注册）原**不会排水**（`_collectComponent` 普通分支无 drain 调用），子组件永悬。收敛 helper 后该缺口自然闭合。

### 五、不做反注册事件（YAGNI）

不提供 `components/<名>/unregistered`：现状无反注册 API（scope 销毁顺带丢弃 `components`，无显式撤销点），没有可对齐的语义边界。需求出现时再议。

## 实现要点（防再踩）

1. helper 内序：先发事件（retain 落盘）再排水——排水重试注册的新组件经自身路径递归走 helper，链式解锁收敛；
2. x-component `_waitForComponent` 迁移：直订 `components/<pendingName>/registered`，回调内 name 比对删除；**pendingName 变化须比对重订**（旧实现已监听即 return 不换订阅键，迁移时一并修正）；retain 补发恰好消灭「查找失败 → 订阅之间组件恰好注册」的竞态窗口；
3. 事件表类型：动态键无法静态声明，发射处 `as any`（`directive/<名>/mounted` 先例），types.ts 删除旧 `"component/registered"` 声明并补 JSDoc 说明动态键约定；
4. 测试面 8 项：晚订阅补发 / 任意路径必发回归 / 本地父后排水修复回归 / 同名覆盖重发 / 全局懒解析发事件 / default / 旧事件名已移除 / 既有 x-overlay 模拟 emit 迁移新名。

## 被否决 / 演变的方案

- **单数前缀 `component/<名>/registered`**（对齐事件命名空间单数惯例）：grilling 中用户拍板复数——与注册表键 `components` 对齐优先；
- **保留旧事件**（原样 / 加 retain / 标记 deprecated）：全否决——加 retain 有「只补发最后一个」的误导陷阱，deprecated 双发违背「事件唯一正名」；
- **事件驱动排水**（`_drainPendingInherits` 改为订阅 `components/*/registered` 触发）：retain 补发会向新订阅误触排水、引入事件时序耦合，排水保持 helper 内直接调用；
- **payload 扩展**（scope id / def 引用）：事件是引擎级「该名已有注册」信号，可见性由消费方沿链查找（`getComponentDeclaration` 就近原则）决定——加 scope 引出「监听方如何判定自己链上可见」的复杂化；
- **反注册事件**：见决策五。

## 语义代价（有意接受）

1. **引擎级信号，不承诺链上可见**：同名组件在不同 scope 注册两次时，retain 只留最后一条，晚订阅者收到的是「最后一次」载荷——对「该名已注册」信号无损，但**可用性须消费方自查**（沿链查找）；
2. **旧事件硬切**：依赖旧名的用户代码静默失效，无迁移警告（开发阶段可接受）；
3. **retain 生命周期随 engine**：`destroy` / `offAll` 清空保留消息，晚订阅补发不跨 engine 存活。
