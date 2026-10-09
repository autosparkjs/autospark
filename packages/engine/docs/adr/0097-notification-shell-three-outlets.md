# ADR-0097：通知外壳三出口化与 closeable 语义翻转（base 正名 shell、actions 子组件退役）

- 状态：已采纳（2026-10-09 落地）
- 日期：2026-10-09
- 关联：ADR-0088（卡片内容下放与横排 body+close 布局——本 ADR 修订布局定案与 actions 组合件）、ADR-0092（单文件内置组件——actions 注册项移除）、ADR-0094（内置注册面统一——常量更名）、ADR-0095（通知族单层化——base→shell 正名）、ADR-0056/0081（插槽出口与继承覆盖机制——复用零新规则）、ADR-0077（sticky 自动补 ×——本 ADR 退役）

## 背景

ADR-0095 单层化后，notification-shell.html（组件名 `autospark.notifications.base`）已是
type 实例即卡片的族根，但内部结构留有四组历史张力：

1. **结构不可重载**：header（icon + title/link + description）是族根里的固定结构，type 组件
   无法只换头部；actions 按钮行是独立子组件 `autospark.notifications.actions`（独立注册、
   `x-component:` 组合消费）——「公共件」概念在 base 与 actions 两处分裂，且多一层间接。
2. **布局矛盾态**：根元素同时挂 `.autospark-notification`（ADR-0088「横排 body + close」意图）
   与 `.autospark-notification-type`（纵列）两条同优先级 display 规则，单层化后又无 body
   包裹层——横竖取决于样式注入顺序，行为未定。
3. **关闭钮语义绕**：`closable` 默认 false，靠「sticky（delayClose ≤ 0）且三层未显式声明则
   自动补 ×」启发式兜底（含为其服务的 `globalDeclared` 构造期显式键快照机制）——自动关闭的
   toast 无 ×、sticky 有 ×，两套心智。
4. **样式双段重复**：scoped 段与 global 段近乎重复声明同一批类名（title-row 等对齐细节两处
   打架）。

## 决策

### 1. 组件正名：base → shell（文件名不动）

`autospark.notifications.base` 更名 **`autospark.notifications.shell`**，常量
`BASE_PRESET_NAME` → `SHELL_PRESET_NAME`。概念正名回归「通知外壳」——与 overlay 家族
（dialog/popover/drawer shell）词汇对齐，词汇表「通知外壳」词条保留正名、内容重写。文件名
`notification-shell.html` 维持（种子资产名）。历史链：notification-shell 双层壳（ADR-0088）
→ base 单层族根（ADR-0095）→ shell 三出口正名（本 ADR）。

### 2. 三出口结构（行即出口）

族根模板纵列三出口，出口元素即内容行元素（无 chrome 包裹层）：

- `x-slot:header`——fallback = icon + title（+link 外链图标）+ description；type 经
  `<template x-slot:header>` 覆盖段整段重载，局部保留走 x-super（ADR-0084）拼装；
- 裸 `x-slot`（默认出口）——type 专属区（task 的进度条与控制钮），维持原语义；
- `x-slot:actions`——fallback = **内联** x-for 按钮行；type 可整段重载或经 x-super 叠加
  扩展 base 按钮行。

三层优先级沿用既有机制（消费方内容 > 继承覆盖 > 父 fallback，ADR-0081），零新规则。
注意具名出口走**属性参数形态** `x-slot:名`——值形态是作用域插槽形参表达式，不可混用。

### 3. actions 子组件退役

`autospark.notifications.actions`（actions.html）整体退役：按钮行内联进 shell 的 actions
出口 fallback（x-for 行 verbatim 沿用原写法）。删除：组件文件、注册表项、`ACTIONS_PRESET_NAME`
导出链、assembly.ts resolveRenderer 排除名单项、专属测试。点击闭环契约不变——
`.autospark-notification-action` 契约类 + `data-notification-action` 索引 + 卡片根类名委托。
理由：该组件无第二个消费方，type 级定制经 actions 出口覆盖已覆盖主要场景（YAGNI）。

### 4. closeable 语义翻转（closable → closeable，默认 true）

键全链路更名 `closable` → **`closeable`**，默认 false → **true**：关闭钮常显（含自动关闭的
toast——唯一可见行为变化），显式 `false` 任意配置层压制。「sticky 自动补 ×」启发式
（props.ts 合并链末端 if 块）与 `globalDeclared` 构造期显式键快照机制**整体删除**——默认值
恒显后两者零行为增量（纯死代码）。record 面不收此键维持（组件面，不持久化）。

### 5. 纵列布局定案 + 样式单源

- 根 **flex 纵列**（禁 grid）：header / 默认出口 / actions 依次堆叠——推翻 ADR-0088「横排
  body + close」残留意图（该意图在单层化后已断裂）；
- **关闭钮 = 根直接子节点 + 绝对定位右上**（根 relative 来自 `.autospark-dialog`）——chrome
  分离：任何出口重载不伤 ×；header 行恒 `padding-right` 预留防 title 压 ×（closeable:false
  时仅留白不对称——取简不做条件 padding）；
- display/布局规则**单源**收 global 段 `.autospark-notification`；scoped 段删除（原双段
  近重复）；`.autospark-notification-type` 类名删除（type 钩子走 `data-notification-type`
  属性选择器）；保留 `autospark-dialog` 双类名（overlay chrome 变量体系共享，ADR-0095 注记）；
- 行距走各段 `margin-top` 不走根 gap——空段零占位（纯 toast 无死空间）。

## 边界

- 插槽（ADR-0056）与继承（ADR-0081）机制零改动——三出口完全复用既有出口/覆盖段规则；
- 公共 methods 七件、data 约定键（holdOpen/visible/closed/remaining）、defaults 段不变；
- 用户覆盖语义不变：同名覆盖 `autospark.notifications.shell` = 全族换根（契约随模板走，
  ADR-0095「模板即契约」延伸——覆盖方照内置模板写法补关闭钮即得引擎契约）；
- level 语义色形态维持 accent 变量现状（不加左色条——用户可经 styles/className 自行强化）；
- 未发布零迁移（沿 ADR-0079/0096 惯例）：更名与默认值翻转不带兼容垫片。

## 实施注记（2026-10-09 落地）

- **actions 出口为中性出口 div 包按钮行 fallback**：不在出口元素上同时挂 `x-slot:actions`
  与 `x-for`——两个 ownsChildren 结构指令（x-for=100 / x-slot=65）同元素的编译顺序耦合不可
  接受；fallback 内的按钮行与原子组件产物 DOM 同构。
- **`x-slot:名` 属性参数形态**：出口命名走属性参数（`x-slot:header`），值形态
  （`x-slot="header"`）会被解析为默认出口 + 作用域形参表达式——模板与文档示例均须用前者。
- 测试新增覆盖：closeable 默认常显 / 显式 false 压制、actions 内联按钮行 + 委托契约属性、
  header/actions 出口覆盖段重载（× 不受伤）；`autospark-notification-type` 类名断言随类名
  删除移除；种子表键数 9 → 8。
- **存量回归顺带修复**：ADR-0095 更名合并时（message-shell → notification-shell）四段
  `[data-notification-level]` 语义色分派规则（accent 双层变量 + 全边 border + color-mix 淡底）
  整块遗失——accent 消费方（图标 / actions / task 进度条）俱在但无人赋值，语义色失效。
  实施期浏览器验证发现，本 ADR 落地时按 notification 词汇恢复。
