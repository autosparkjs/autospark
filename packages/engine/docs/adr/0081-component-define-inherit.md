# ADR-0081：x-define 组件继承（x-define:inherit）

- 状态：已采纳（**V1 边界修订**：「全局组件不参与继承解析」已被 [ADR-0083](0083-message-session-class-presets.md) 决策五推翻——`options.components` 字符串入参带 `x-define:inherit` 现经懒预编译路径展开，父沿全局表递归解析）
- 日期：2026-10-03
- 关联：[ADR-0022](0022-x-component.md)（组件定义体系）、[ADR-0053](0053-component-data-boundary.md)（数据边界 open/dataContext）、[ADR-0054](0054-component-define-instantiation-rename.md)（x-define 更名与值/参数分工）、[ADR-0056](0056-x-slot.md)（x-slot 插槽出口/内容/分段）、[ADR-0057](0057-component-single-reactive-data.md)（setup 数据模型与合并管道）、[ADR-0080](0080-component-instance-getcomponent-rename.md)（getComponentDeclaration 更名）

## 背景

组件复用此前只有「整组件消费」一途——同族组件（card / orderCard）结构高度相似时只能复制模板与 `<script setup>`，改一处漏一处。grilling 九问拍板引入**组件继承**：子组件声明父组件名，复用其模板结构、setup 与样式，经插槽出口做内容差异化。

## 决策

### 一、语法与解析

- **属性参数形态唯一入口** `x-define:inherit="card"`：参数=关键字 `inherit`（x-define 首用属性参数通道——组件名走值、open 走修饰符/options，通道不混用），值=**单个父组件名**（静态字符串，编译期解析，非表达式）；不兼容 `x-define-options="{inherit:...}"` 形态（单一事实来源）。
  修订（2026-10-04）：新增 `x-define:extends` **同义别名**（正名仍为 `inherit`）——两别名同时声明时文档序首个胜 + warn；
- **单继承**（多继承 / mixin 刻意不做——差异化组合走插槽）；**链式合法**（`base ← card ← orderCard` 解析期递归展开到根）；
- 父查找：收集时沿**声明处 scope 链** `getComponentDeclaration`（就近）+ `options.components` 全局兜底——与消费侧同一查找协议；父须**先于子声明**（文档序，收集是一次性的）；
- **失败策略=拒绝注册**：父未找到（拼错 / 时序 / x-import 异步未就绪）、`inherit` 值空 / 非法、继承环 → 定义处 warn + 不注册（使用处走既有「组件未找到」路径）。不做半残降级——子的子节点已被消费为覆盖段，降级注册出来的是空壳组件，渲染无意义且掩盖根因。

### 二、模板覆盖（复用插槽机制，零新规则）

- 子定义直接子节点（非 `<script setup>` / `<style>`）按**既有插槽内容分段规则**（`collectSlotSegments`，ADR-0056）原样收集：`<template x-slot:名>` → 命名段、裸子节点 → 默认段、无对应父出口 → warn + 丢弃、未提及的出口保留父 fallback——与消费侧写法完全对称；
- **实现定位：覆盖段替换父已解析快照中该出口的 fallback 子树**（出口标记元素保留为包裹层）。于是覆盖内容天然在**组件实例作用域**（合并后 data 域）求值——`{{price}}`（子 data）/`{{count}}`（父 data）、父子方法全可见；
- **三层优先级：消费方内容 > 继承覆盖 > 父 fallback**——继承只改默认，不锁死出口，消费方实例化时仍可再覆盖；
- 覆盖段声明**作用域形参** → warn + 忽略（fallback 通道本无形参语义，强行支持需新机制）。

### 三、setup 合并（复用既有管道）

- 复用 `mergeComponentSetups`，合并顺序 **[父, 子]**：data 浅合并子胜（对象/工厂混声明走既有归一化工厂）、methods 同名**子整体覆盖**（静默——覆写父方法是继承的卖点，非事故）、hooks 串行**父先子后**、locals 合并子胜；
- 全部**静默合并**（与同一组件内多 `<script setup>` 的既有纪律一致，不 warn）；
- **扁平合并，不引入 `super` / `$parent` 组件语义**——子方法直访父 data 键（`this.data.count`）即满足场景。

### 四、其余 def 字段

- `styles` / `styleBinds`：父子拼接（子在后，级联后者胜）；
- `open` / `dataContext`：子重声明（子自己的 `.open` / `x-define-options`）胜，否则**继承父**；
- `slots` 出口清单 = **父全量出口**（继承不缩减出口，消费方可继续填任何一个）；
- `declarerScope` 取**子声明处**（ADR-0053 declarer 基准挂链目标指子组件声明点）；
- 子 `x-define` 根属性并入解析后快照根：class 拼接、style 合并、其他属性补充不覆盖（对齐消费侧 `_mergeComponentRootAttrs` 语义）；该函数的声明族跳过清单同步补 `x-define:` 前缀（防 inherit 属性泄漏进实例 DOM）。

## 实现要点（防再踩）

1. **解析期一次性完成**（`_collectComponent` 内、注册前）：子有效快照 = 父**已解析**快照的深克隆 + 出口 fallback 替换 + 子根属性并入；父快照永不被变异——多个子继承同一父互不干扰；
2. **setup 跨 def 合并陷阱（勿喂 `mergeComponentSetups`）**：一是父 def 的 hooks 存于 `def.hooks`（按 phase 的数组形态，setup 顶层已无 phase 键），直接喂会**静默丢失**；二是父 data 可能已是归一化工厂，而该管道的「对象池先、工厂池后」次序会让父工厂**覆盖子字面量**（破坏子胜）。故跨 def 合并在 `compile/inherit.ts` 手工实现：data 归一化为「父值 → 子值浅覆盖」的每实例工厂、methods/locals 浅合并子胜、hooks 各 phase 数组直接串接（父先子后）；
3. **fallback 替换双形态**：普通元素出口替换 `childNodes`；`<template x-slot:名>` 出口替换 `.content` 子节点（SlotDirective 的 fallback 读取路径两条都要对上）；
4. 解析后子快照根剥净声明族属性（`x-define` / `x-define-options` / `x-define.*` / `x-define:*`）；
5. 嵌套私有组件（父快照内的 x-define）随深克隆天然继承——实例化时 `compileSubtree` 再次命中收集器，归子组件实例 scope，零额外处理；
6. 注册结构不变：`owner.components[name] = 解析后快照`、`engine.registerComponentDef(def)`——消费侧（x-component / overlay / 消息 shell）零感知。

## 被否决 / 演变的方案

- **降级注册**（父未找到按独立组件注册）：空壳组件渲染无意义，warn 指向根因 + 拒绝注册更可预测（与 `<script setup>` 求值失败的容错降级**有意分歧**——那边丢的只是脚本，这边丢的是整个模板）；
- **覆盖内容走内容通道**（解析产物 stash 为实例 `slotContents`、callerScope=实例 scope）：与消费方内容同一 holder 冲突（`slotCallerScope` 单值），且作用域语义绕远——fallback 替换一步到位；
- **`x-define-options="{inherit:'card'}"` 兼容形态**：两通道声明同一事实违背单一来源；
- **`extends` 关键字**：初版未采纳（记 Avoid 别名），**2026-10-04 修订为同义别名**（见决策一修订注）；
- **多继承 / mixin**：YAGNI；
- **作用域形参支持**：V1 warn + 忽略，见 Future Work。

## Future Work

- x-import 异步父（延迟解析 / 注册依赖图）；
- 覆盖段作用域形参；
- 多继承。
