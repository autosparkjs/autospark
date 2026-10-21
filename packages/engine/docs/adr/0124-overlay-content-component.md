# ADR-0124：覆盖物内容组件（autospark.overlay）——通用 header/footer 结构骨架

- **状态**：Accepted（grill-with-docs，三轮收敛）
- **日期**：2026-10-21
- **关联**：[ADR-0052](0052-x-overlay-and-x-dialog.md)（覆盖物组件化消费模型）、[ADR-0062](0062-overlay-shell.md)（shell 机制——本 ADR 改写内置 shell 模板结构）、[ADR-0094](0094-builtin-component-registry-and-unified-lookup.md)（点前缀命名空间与统一查找）、[ADR-0084](0084-x-super-slot-fallback.md)（x-super——自定义 shell 扩展 overlay 内容的机制）、[ADR-0036](0036-action-descriptor-metadata.md)（action 描述符——pos/order 元数据消费方）、[ADR-0123](0123-overlay-content-host-dual-delegation.md)（内容宿主双委托——body 出口承接内容宿主，正交不冲突）、[ADR-0107](0107-slots-registry-and-dynamic-outlets.md)（slot 注册表——嵌套出口直挂活体段）

## 背景

三个内置 shell（dialog/popover/drawer）只有裸 `<div x-slot>` 基础框架：无标题、无关闭按钮、无动作区。需要标题栏（icon + title + topActions + close）、底部动作区（leftActions + rightActions）的覆盖物，目前只能用户在内容组件里自己画，三形态各自重复、风格漂移。

需要一个**全局通用结构组件**统一承载覆盖物的 header/footer 骨架：三内置 shell 内嵌消费，提供 title / closeable / actions / padding 通用行为；开发者不直接消费该组件（通过 shell 配置与覆盖物配置间接使用），自定义 shell 可选择内嵌并经 x-super 扩展。

grilling 三轮钉死的关键分歧：组件名收敛为 `autospark.overlay`（废弃初始提案的 `.content` 后缀）；actions 走 options 通道（props 通道静态字面量经 JSON 序列化会丢函数 handle）；内容宿主（ADR-0123）与结构骨架的层级关系——shell 内嵌 overlay，内容宿主仍经 shell 默认出口直挂。

## 决策

### 1. 组件定位与命名：`autospark.overlay`，内置结构组件，非面向开发者

新内置组件 `autospark.overlay`（ADR-0094 点前缀命名空间，`builtinComponents` 种子注册，x-define 模板组件）。定位是**覆盖物家族的结构骨架**：

- **三个内置 shell 内嵌消费**（模板内 `x-component:autospark.overlay`），形态特化（遮罩 / 箭头 / 贴边 / placement）仍归 shell 与引擎；
- **不面向开发者直接消费**——开发者经覆盖物配置（`x-dialog:user` options / `x-dialog-options`）间接驱动，经自定义 shell + x-super 间接扩展；
- 不入「指令层」「显隐控制层」词汇——它是组件不是指令，文档归覆盖物家族章节。

### 2. 结构契约：header / body / footer 三段 + 七出口

```
┌──────────────────────────────────────────┐
│ [icon] title            actions.top  [×] │  ← header（有内容才渲染）
├──────────────────────────────────────────┤
│                                          │
│   body（默认出口 + padding）              │  ← 恒渲染
│                                          │
├──────────────────────────────────────────┤
│ actions.left          actions(.right)    │  ← footer（有内容才渲染）
└──────────────────────────────────────────┘
```

**props**（经 x-component 指令值通道，全契约 + 热更新）：

| prop | 类型 | 默认 | 语义 |
| --- | --- | --- | --- |
| `title` | `string` | — | 标题文本 |
| `icon` | `string` | — | 标题左侧图标名（x-icon 域，ADR-0058） |
| `closeable` | `boolean` | `true` | 显示 close 图标按钮，点击触发全局 close action |
| `actions` | `AutoSparkAction[]` | — | 动作集，按 `pos` 归位到同名出口 |
| `padding` | `string \| number` | `'0.5em'` | body 区内边距 |

**出口（slots）**：`title`（替换标题文本区——默认 header 结构内）、`header`（**整块替换** header——title/actions.top/close 全部让位，`closeable` 失效）、`body`（内容出口——shell 默认出口的直通位）、`footer`（整块替换 footer）、动作区三出口——**`actions.top` / `actions.left` / `actions.right`（点分命名空间；裸 `actions` 为 `actions.right` 的收集侧等价别名——「actions 默认是 right actions」）**。

> **出口名点分的引擎前提（实现验证项）**：引擎指令属性通用解析按 `.` 切修饰符（`x-component:autospark.notifications.actions` → name + modifiers），x-slot 现忽略修饰符——`x-slot:actions.left` 会塌缩为出口名 `actions`。需给 x-slot 加「名段重组」：修饰符恰为 `bind` → 传递绑定语法（ADR-0108 现状不变）；**其余修饰符以 `.` 并回出口名**（出口声明、collectSlotGroups 内容侧归组、slots 转发清单三处同规则）。

### 3. header/footer 条件渲染：有内容才渲染

- **header 渲染条件**（任一命中）：`title` 非空 ∥ `icon` 非空 ∥ `title` 出口有内容 ∥ `actions.top` 出口有内容 ∥ actions 中存在 `pos='top'` ∥ `closeable === true`。**`closeable` 默认 true → 默认全家族 header 恒渲染**（一个带关闭按钮的标题栏），`closeable: false` 且其余全空才消失；
- **footer 渲染条件**（任一命中）：`footer` 出口有内容 ∥ actions 中存在 `pos='left'` 或 `pos='right'`（含归位到右区的 `auto`/`bottom`/无 pos）；
- 条件求值基于 props（响应式——props 热更新联动显隐）+ 出口内容命中（编译期静态——出口有内容与否不响应式，与 slot 机制一致）；`header` 出口有内容时整块替换，条件渲染让位于出口本身。

### 4. actions 渲染归属：overlay 组件 props + 出口 fallback 渲染（否决 shell 渲染）

actions 的**渲染逻辑归 overlay 组件**：`actions.top` / `actions.left` / `actions.right` 出口的 **fallback** 按 `pos` 过滤渲染动作按钮。理由：

- **x-super 扩展依赖 fallback**（ADR-0084）：自定义 shell 写 `<template x-slot:actions.top><x-super></x-super>自定义</template>` 展开的正是 overlay 的 fallback（默认动作渲染）——fallback 为空则扩展机制失效；
- 否决「shell 渲染 actions 进出口」：三 shell 三份重复渲染逻辑，自定义 shell 必须重新实现，x-super 无 fallback 可展开；
- 否决「overlay 无 actions prop、从 scope 取」：shell scope rootless、内容组件 scope 是 overlay body 的子级——**向上不可见**，scope 通道不存在。

**pos 归位映射**：`'top'` → `actions.top`；`'left'` → `actions.left`；`'right'` / `'auto'` / `'bottom'` / 无 pos → `actions.right`（用户裁决：auto 与 bottom 归右区；裸 `actions` 出口别名同区）。组内按 `order` 升序稳定排序（缺省视为 0）。

**动作按钮契约**：icon（有则 x-icon + tooltip）/ title 文案；点击执行 `$actions[id].handle`——action 描述符经 props 传入时已是规范化形态（handle 必在）。

### 5. close 语义：复用全局 close 信号 action（零新机制）

close 图标按钮 `x-on:click="close"` → 内置信号 action `close`（[signals.ts](../../src/actions/signals.ts)，handle 透传 + 广播）→ `action:close` DOM 冒泡 → 实例根委托接住 → `requestClose`（ADR-0062 既有链路，实例根已挂监听）。零新机制、零实例引用穿透。

已知边界（接受）：`registerBuiltinActions` 只补用户未占用键——用户自定义全局 `close` action 覆盖内置后，按钮调的是用户的 action（可能不关面板）。这是「全局 action 可覆盖」语义的自然结果，文档标注。

### 6. 配置通道：OverlayConfig 五新字段，走 options 通道（否决 props 通道）

`OverlayConfig` 新增 `title` / `icon` / `closeable` / `actions` / `padding` 五字段：

- **通道 = options 通道**（`x-dialog-options` 整包 / 成员属性表达式，ADR-0007 修订）——打开时经 `resolveOverlayConfig` 现读，重开生效（家族「配置不热应用」惯例一致；成员表达式 watch 既有管道照常）；
- **否决 props 通道**（`x-dialog:user.props="{title}"`）：props 是内容组件的数据通道，覆盖物骨架配置混入会污染内容 props 面；且静态字面量 props 经 JSON 序列化（ADR-0123 决策 3 注记），**actions 内函数 handle 被静默丢弃**——通道性缺陷；
- **到达路径**：`config` 整包注入 shell data 域（ADR-0062 既有机制，初始快照）→ shell 模板 `x-component:autospark.overlay props="{title: config.title, icon: config.icon, closeable: config.closeable, actions: config.actions, padding: config.padding}"` 透传 → overlay 组件 props 响应式承接。

### 7. actions 双通道合并：消费处 scope（显式 pos 准入）+ config，后进覆盖

actions 两个声明通道，打开时合并为单一数组注入：

1. **声明式**：消费处 scope（写 `x-dialog:user` 的页面/组件，`this.binding` 可达）的 actions 表——**准入规则：仅显式声明 `pos` ∈ {top, left, right} 的 action 参与**（无 pos 的页面级 action 不参与——防页面 scope 全量 actions 污染每个覆盖物的 footer；需要进覆盖物的 action 显式标注 pos 即准入）；
2. **配置式**：`OverlayConfig.actions`（决策 6 通道），无 pos 归 right。

**合并次序与冲突**：声明式在前、配置式在后，**同 id 后进覆盖先进**（用户裁决）。合并产物整体传 overlay 组件（单数组），pos 过滤归渲染期职责。

### 8. shell 改造：三内置 shell 内嵌 overlay + body 直通出口

三个内置 shell 模板重构为：

```html
<div class="autospark-dialog" x-define="autospark.dialog">
    <x-component:autospark.overlay props="{title: config.title, ...}">
        <template x-slot:body><div x-slot></div></template>
    </x-component>
    <div class="autospark-overlay-arrow"></div>
    <style>...</style>
</div>
```

- **body 直通出口**：shell 默认出口（`<div x-slot>`）嵌在 overlay `body` 出口的内容模板里——内容宿主（x-error 边界 live 段，ADR-0123）经出口查找链（callerScope = shell 模板域 → parent 链命中 shell scope 的活体段 stash）直挂进 overlay body 区。**实现期验证项**：`def.slots` 出口清单是否统计嵌套在 slot 内容模板里的出口（instance.ts 默认出口判定）——不统计则需放宽判定或改 DOM 寻址；
- **形态 CSS 重排**：dialog 内容层 z-index、popover 显式 `padding: 0px`、drawer 整壳 `overflow: auto` 等样式随结构迁移——滚动归 body 区、padding 归 overlay（决策 9 视觉变化接受）；
- **自定义 shell 不受影响**：`config.shell` 整壳替换，自动退出 overlay 骨架（自行决定是否内嵌）；shell 契约不变（默认出口仍存在，位置移入 body 出口内容内）。

### 9. 视觉变化接受（「顺手修好」）

默认 `closeable: true`（全家族默认带关闭按钮的 header）、body 默认 `padding: 0.5em`（popover 原 0、dialog 原无）、drawer 滚动移入 body 区——**现有 demo 视觉变化接受**，按新契约修 demo。主题定制继续走 CSS 变量（`--autospark-overlay-*` 家族扩展 body/header/footer 区块变量）。

### 10. x-super 扩展路径（自定义 shell）

自定义 shell 内嵌 overlay 后，经 ADR-0084 x-super 扩展任意出口：

```html
<template x-slot:actions.top>
    <x-super></x-super>   <!-- 展开 overlay 的默认动作渲染（fallback） -->
    自定义内容
</template>
```

语义恒自引用无名（actions.top 内容内的标记 = actions.top 出口的 fallback），多次出现各自独立展开——ADR-0084 契约零变化。

### 11. 消费侧 slot 上行转发（chrome 出口的消费者直达通道）

shell 内嵌 overlay 引入**层级缺口**：消费者宿主子级的 `x-slot:name` 分段（collectSlotGroups）当前全部投影进内容组件，而 chrome 出口在 overlay 组件上——内容组件 scope 是 overlay body 的**子级**，分段 stash 向上不可见，消费者无法触达 chrome 出口。解决 = **家族专用收集裁决 + 通用转发查找（ADR-0125 slots）**：

- **收集裁决（家族专用，名字裁决三分）**：`_instantiate` 时按名字切分宿主子级分段（早于 open，时序安全）——内容组件 `def.slots` **声明过的名字 → 内容组件**（今日语义 100% 保留：内容组件自带 `header` / `title` 等常见名出口的场景不受扰）；未声明且 ∈ chrome 契约名（title / header / footer / actions.top / actions.left / actions.right——裸 `actions` 归一为 `actions.right`）→ **收进 shell 内容集**（供转发）；`default` / `body` **永不转发**（default 归内容组件；body 出口由 shell 直通内容占用，永不 miss，转发无意义）；
- **转发查找（通用机制，ADR-0125）**：三个内置 shell 在内嵌 overlay 的元素上声明通配转发——`<x-component:autospark.overlay x-component-options.slots="*" props="...">`。overlay chrome 出口 miss 于 overlay 内容集（内置壳只提供 body 直通段）→ 按原名白名身上溯 shell 内容集 → 命中消费者分段。`*` 通配天然覆盖 chrome 全部出口与 overlay 未来新增出口（运行时动态集合）；显式改名清单（`title:dialogTitle` 等）留给有跨层重名需求的自定义 shell；
- **stash 落点**：`OverlayInstance` 收集消费者 chrome 分段，`open()` 建壳时与活体段**同域 stash**（同一 shell 内容集、普通段、非 live、slotCallerScope = 消费者 `this.binding`）；**出口 miss 语义天然形成优先级**：自定义 shell 显式提供的出口内容（overlay 内容集，miss 不发生）> 消费者转发段（shell 内容集）> fallback（config.actions）；
- **消费语义**：转发段求值基准与 shell 自身出口消费逐位一致（同一持有者、同一调用方作用域——表达式以消费者 scope 求值）；转发段内 `<x-super>` 展开 overlay 出口 fallback（= config.actions 默认渲染）——**消费者侧扩展与自定义 shell 侧扩展（决策 10）同机制同语义**；
- **自定义 shell 免费获益**：家族查找不在 OverlayDirective/Instance 特判——自定义 shell 内嵌 overlay 时**自行声明 slots 即接入**消费者转发（ADR-0125「恒显式声明，无默认转发」原则）；不声明则消费者 chrome 分段静默失效；
- **约束**：转发段为消费者模板克隆，随出口内容 scope 生命周期回收（keepalive 挂起随实例存活，重开重新克隆）；default 段不进 shell 内容集（「首持有者即停」防穿透原则不受扰）。

## 被否决的方案

- **组件名 `autospark.overlay.content`**：与「一个组件」事实冲突（用户裁决收敛为 `autospark.overlay`，无薄封装层）；
- **shell 渲染 actions 进出口（overlay 无 actions prop）**：三份重复 + 自定义 shell 重实现 + x-super 无 fallback 可展开（决策 4）；
- **actions 走 props 通道**：内容组件数据面污染 + 静态字面量 JSON 序列化丢函数 handle（决策 6）；
- **overlay 组件从 scope 读 actions**：shell scope rootless、内容 scope 向上不可见——通道不存在（决策 4）；
- **声明式 actions 全量合并消费处 scope**：页面级无 pos action 全归 right，污染每个覆盖物 footer——显式 pos 准入（决策 7）；
- **close 按钮注入专用 action / $close() 实例方法**：全局 close 信号 + 实例根委托已闭环，零新机制（决策 5）；
- **内容组件显式转发出口（组件作者在模板里写转发标记）**：内容组件不感知 overlay 存在，转发出口渲染在 body 区内而非 chrome 区——结构上到不了 header/footer；x-teleport 中转按选择器寻址脆弱、依赖编译时序，否决（决策 11）；
- **chrome 名保留字硬切分（content def.slots 不参与裁决）**：`header` / `title` 是内容组件高频出口名（confirm 示例即自带 header），硬切分破坏今日语义——内容组件声明优先（决策 11）；
- **决策 11 v1 的家族专用查找（scope 链自然命中）**：ADR-0125 slots 落地后，查找步复用通用白名身上溯——家族专用代码收缩为收集裁决 + stash，查找零家族特判（决策 11 修订）；
- **内容宿主改寻址（绕开 slot 机制挂 body 区）**：嵌套出口在作用域链上可通（活体段 stash 命中），仅 `def.slots` 判定待验证——先走正道，验证失败再议（决策 8）。

## 后果

- ✅ 覆盖物家族获得统一 header/footer 骨架：标题 / 图标 / 关闭 / 动作区一次声明三形态通用，自定义 shell 可复用可扩展；
- ✅ actions 消费落地 `pos` / `order` 元数据（ADR-0036 文档化约定键首次有引擎级渲染消费方）；
- ✅ close 语义零新机制（复用信号 action + 实例根委托）；
- ✅ x-super（ADR-0084）获得第二、第三个真实消费场景（shell→overlay 扩展 + 消费者转发段扩展默认动作渲染）；
- ✅ 消费者直达 chrome 出口：宿主子级 `x-slot:actions.left` 等分段经上行转发触达 overlay footer/header（决策 11）——内容组件声明优先，今日语义零破坏；
- ⚠️ **行为变化一**：全家族默认渲染 header（closeable 默认 true）——不想要 header 的存量覆盖物需显式 `closeable: false`；
- ⚠️ **行为变化二**：body 默认 padding 0.5em、popover 不再 0px、drawer 滚动移 body 区——demo 与文档按新契约修；
- ⚠️ 配置快照语义：五字段经 config 注入 shell（初始快照），打开中变更不热应用（重开生效）——与家族配置惯例一致，与 overlay 组件 props 响应式（组件路径热更新）并存不矛盾（快照进 props 后仍是响应式数据，只是源不重求值）；
- ⚠️ 实现期验证项：嵌套出口的 `def.slots` 判定与活体段直挂实测（决策 8）；x-slot 名段重组（`actions.left` 等点分出口名 vs `.bind` 修饰符特例，决策 2 注记）；
- **交付**：ADR（本文）+ CONTEXT.md 词条 + 源码（`autospark.overlay` 模板组件、OverlayConfig 五字段、resolveOverlayConfig 归一、三 shell 模板重构（内嵌 overlay + body 直通 + `slots="*"`）、OverlayDirective actions 合并、消费侧收集裁决——collectSlotGroups 名字切分 + shell 内容集 stash）+ 测试 + 文档（x-dialog / x-popover / x-drawer 指南与 demo）。
