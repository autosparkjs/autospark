# 组件继承

## 概述

**组件继承**让一个组件（**子**）复用另一个组件（**父**）的全部定义——模板结构、`<script setup>`、`<style>`、数据边界——再经[插槽出口](../directives/x-slot.md)做差异化。声明形态是 `x-define` 的**属性参数** `x-define:inherit`（`x-define:extends` 为同义别名，正名 `inherit`；两者同时声明时首个生效并 `warn`）：

```html
<div x-scope>
    <!-- 父组件：三出口（header / 默认 / footer）+ 计数逻辑 -->
    <div x-define="card">
        <div class="hd" x-slot:header>默认标题</div>
        <div class="bd" x-slot>count={{ count }}</div>
        <div class="ft" x-slot:footer></div>
        <script setup>
            {
                data: { count: 0, step: 1 },
                methods: { inc() { this.data.count += this.data.step } },
            }
        </script>
    </div>

    <!-- 子组件：继承 card -->
    <div x-define="order-card" x-define:inherit="card">
        <template x-slot:header><b>订单</b></template>
        <div>价格 {{ price }} / 已下单 {{ count }} 件 <button x-on:click="add">下单</button></div>
        <script setup>
            {
                data: { price: 100 },
                methods: { add() { this.data.count += 1 } },
            }
        </script>
    </div>

    <!-- 实例化子组件：结构与逻辑全继承，出口被覆盖 -->
    <div x-component:order-card></div>
</div>
```

子组件实例化后：header 出口显示「订单」（继承覆盖），默认出口显示价格与下单交互，footer 保留父 fallback。点击「下单」调用**子方法** `add`，写的却是**父组件的** `count`——继承是扁平合并，没有两层实例。

<demo html="component/inherit.html"/>

## 继承了什么

| 继承项 | 规则 |
| --- | --- |
| 模板结构 | 子有效模板 = 父已解析快照（含全部出口标记），出口 fallback 被子覆盖段替换 |
| `data` | 父子**浅合并**，子同名键覆盖父（对象字面量与 `data()` 工厂混声明同此规则） |
| `methods` | 父子合并，同名**子整体覆盖**父方法（覆写是继承的卖点，不 warn）；覆盖后可经 [`this.super.方法()`](#super-调用被覆盖的父方法) 调用父实现 |
| 顶层私有变量 | 父子合并，子同名键胜 |
| 生命周期钩子 | 父子**串行**执行，父先子后 |
| `<style>` | 父子拼接（子在后，级联后者胜）；`bind()` 样式绑定清单合并 |
| 数据边界 `open` / `dataContext` | 子重声明胜；未重声明则继承父 |
| 插槽出口清单 | = 父的全量出口（继承不缩减出口，消费方可继续填任何一个） |
| 子定义根属性 | 并入解析后组件根：`class` 拼接、`style` 合并、其他属性补充不覆盖 |

## 覆盖：只走插槽出口

**父组件必须通过插槽出口来被覆盖**——子定义的直接子节点（`<script setup>` / `<style>` 之外）按[插槽内容](../directives/x-slot.md)的既有分段规则收集，与消费侧写法完全对称：

| 子定义子节点 | 分段 | 效果 |
| --- | --- | --- |
| `<template x-slot:header>…</template>` | 命名段 | 替换父 `header` 出口的 fallback（template 取 content 子节点展开、无包裹层） |
| 裸子节点（元素 / 文本） | 默认段 | 替换父默认出口（裸 `x-slot`）的 fallback |
| 未提及的出口 | — | 保留父 fallback 原样 |
| `<template x-slot:header></template>`（空段） | 命名段（空） | **显式抑制**父 fallback（存在即提供） |
| 无对应父出口的段 | — | `warn` + 丢弃（组件照常注册） |

两条关键语义：

- **求值作用域是组件实例**——覆盖内容在合并后的组件数据域求值：父数据（`count`）、子数据（`price`）、父子方法全部可见。这让覆盖写起来就像在父组件模板里继续写内容；
- **覆盖 ≠ 锁死出口**——覆盖只是替换了该出口的 fallback，实例化时消费方仍可再提供同名内容（见下节）。

::: tip 覆盖段不支持作用域形参
覆盖段声明的解构形参（如 `<template x-slot:header="{ title }">`）会被 `warn` + 忽略——继承覆盖替换的是 fallback 子树，没有作用域形参语义。
:::

## 三层优先级

同一出口的内容来源有三层，实例化时按优先级取用：

```text
消费方内容  >  继承覆盖  >  父 fallback
```

```html
<!-- order-card 已把 header 覆盖为「订单」——消费方仍可再盖掉它 -->
<div x-component:order-card>
    <template x-slot:header><b>消费方标题</b></template>
</div>
```

继承只改默认，不锁死出口——这保持了插槽投影机制的原有语义完整。

## super：调用被覆盖的父方法

子方法覆盖父同名方法后，`this.super.方法名(...)` 可以调用**被覆盖的父实现**——在父行为之上做增强（前后加逻辑、改参数、改返回值），而不是从头重写：

```html
<div x-define="card">
    <script setup>
        {
            data: { count: 0, step: 1 },
            methods: { inc() { this.data.count += this.data.step } },
        }
    </script>
</div>
<div x-define="order-card" x-define:inherit="card">
    <script setup>
        {
            methods: {
                // 覆盖 inc：先执行父实现（+step），再叠加自己的 +1
                inc() { this.super.inc(); this.data.count += 1 },
            },
        }
    </script>
</div>
```

语义要点：

- **精确词法链（class 语义）**：`this.super` 指「当前执行方法**声明层**的下一层」。`base ← card ← order-card` 三层都覆盖同名方法时，card 的方法经 super 被调用，其内部 `this.super` 正确解析到 **base**——不串层、不会无限递归；
- **this 绑定当前实例**：父方法经 super 调用时，`this.data` 读写的是子实例的合并数据域（父子同一域）；
- **仅继承组件可用**：非继承组件 `this.super === undefined`（误用自然 TypeError）；父组件无 methods 时为空对象；
- **视图只含 methods**：data / 顶层私有变量扁平合并后本就可见，不需要 super 通道；
- **门面对称**：`engine.getComponent(el).super` 与组件内同源（组件外调用按直接父解析）；
- `super` 是保留键——setup 顶层私有变量与之重名会被忽略，`this.super = xxx` 整体覆盖被 warn 拦截。

与 `this.$parent` 正交：`$parent` 是**运行时嵌套父组件实例**（组合关系，子组件实例化在父组件模板内），`super` 是**定义期继承链**（is-a 关系）——两个「父」，两个通道。

## 声明约束

### 单继承、可链式

`inherit` 的值只认**一个**父组件名（多继承 / mixin 刻意不提供，差异化组合请用插槽）。链式继承合法且递归展开到根——`base ← card ← order-card` 中 order-card 的有效定义已包含 base 的全部内容：

```html
<div x-define="base">…</div>
<div x-define="card" x-define:inherit="base">…</div>
<div x-define="order-card" x-define:inherit="card">…</div>
```

<demo html="component/inherit-chain.html"/>

### 父组件须先于子组件声明（同步场景）；异步父就绪即解析

继承解析发生在收集 `x-define` 时（编译期）：父组件**同步在场**（文档序在前、全局已注册）则立即解析。父查找协议与消费侧一致：声明处 scope 链就近 + `options.components` 全局兜底——父可以是局部组件，也可以是全局组件。

父来自 `x-import` **异步加载**时**就绪即解析**（ADR-0083）：父未就绪则子组件**挂起**（暂不注册），父注册的 `components/<父名>/registered` 事件自动排水重试——到达顺序无关（本地 / 远程混编、多 url 交叉依赖逐级解锁），使用处在此期间照常显示 loading。链式继承同样级联解锁。

```html
<div x-scope>
    <!-- 异步父：fetch 到达后注册 card，挂起的 order-card 随之解析 -->
    <div x-import="/components/base.html"></div>
    <div x-define="order-card" x-define:inherit="card">
        <template x-slot:header><b>订单</b></template>
        <script setup>{ data: { price: 100 } }</script>
    </div>
    <div x-component:order-card></div>  <!-- 父就绪前 loading，随后自动渲染 -->
</div>
```

<demo html="component/inherit-async.html"/>

注意两个诊断语义：

- **拼错父名与异步未归同形**——挂起期只有一条软提示 warn，终局症状是使用处持续 loading；fetch 失败时引擎会列出仍未就绪的父名帮助定位；
- 同一远程文件内父在子前（文档序）不经过挂起路径，fetch 到达即同步注册解析。

### 解析失败 = 拒绝注册（确定性失败）

只有**确定性失败**才 `warn` + **拒绝注册该子组件**：`inherit` 值为空、继承声明指向自身、继承链成环——不做半残降级（子的子节点已被消费为覆盖段，降级出来只是空壳），使用处呈现既有的「组件未找到」路径，定义处的 warn 指向根因。

**父组件未就绪**不属于失败（ADR-0083）：挂起等父注册（见上节），不做拒绝。

::: warning 组件名建议 kebab-case
`x-component:名称` 的属性参数会被 DOM **小写化**（HTML 属性名大小写不敏感），`x-define="orderCard"` 与 `x-component:orderCard` 因大小写不一致而无法命中。组件名请统一使用小写 / kebab-case（如 `order-card`）。
:::

### 其余边界

- `x-import` 异步父**就绪即解析**（ADR-0083，见上节）；远程子组件继承本地 / 全局父照常支持；异步环（A 等 B、B 等 A）会永悬置——没有 fetch 失败线索时注意排查；
- 全局组件（`options.components` 字符串）**自身**声明 `x-define:inherit` 不参与解析（`warn` + 忽略），但可作为父被继承；
- 无 `$parent` 组件继承语义——`$parent` 是运行时嵌套父**实例**通道（组合关系）；继承链父方法走 `this.super`（见上文专节）。扁平合并下子代码直接访问父成员，需要区分来源时请自行命名空间（如 `this.data.baseCount`）。

## 常见问题

### `x-define:extends` 和 `x-define:inherit` 有区别吗？

没有——`extends` 是 `inherit` 的**同义别名**（对齐 Vue / class 心智），解析、行为、super 语义完全一致。正名为 `inherit`（动词从子视角读），文档与示例统一用它；同元素两别名同时声明时按文档序首个生效并 `warn`。

### 使用处一直 loading，也没有报错？

大概率是子组件**挂起**（父组件未就绪，ADR-0083）——三种可能：

1. 父名拼错：挂起软提示 warn 里有父名，对照检查；
2. 父来自 `x-import` 且加载失败：控制台找加载失败 warn（会附带列出仍未就绪的父名清单）；
3. 异步环：A 等 B、B 等 A——两个远程文件互相继承时排查依赖方向。

### 继承后能覆盖父组件的方法吗？

能——`methods` 同名**子整体覆盖**父（这正是「覆写」的写法）。要保留父行为，在子方法里调 [`this.super.方法名(...)`](#super-调用被覆盖的父方法) 即可。

### 子组件能新增出口吗？

不能。先看会发生什么：

```html
<div x-define="card">
    <div x-slot:header>默认标题</div>
    <div x-slot>正文</div>
</div>

<!-- ❌ 想给 card「加」一个 extra 出口 -->
<div x-define="ext-card" x-define:inherit="card">
    <template x-slot:extra><i>新区域</i></template>
    <script setup>{}</script>
</div>
```

`ext-card` 实例化后**看不到**新区域，编译期得到一条 warn：

```text
x-slot: 内容 "extra" 无对应出口（组件未声明该 x-slot 出口），已丢弃（ADR-0056）
```

**为什么**——三层原因，从直接到根本：

1. **子定义没有自己的模板**。继承解析时，子定义的直接子节点全部按**插槽内容分段规则**收集（与消费方 `x-component` 宿主子级是同一套规则、同一个身份——内容侧输入），收集结果按**父的出口清单**校验：`extra` 不在清单里 → warn + 丢弃。`def.slots` 恒等于父的全量出口，子无法往清单里添名字；
2. **出口是结构声明，不是内容**。出口标记元素保留为真实包裹层——「出口的位置就是 DOM 的位置」。而子继承到的结构 = 父快照的原样克隆，继承唯一的结构动作是**替换既有出口的 fallback 子树**。「新增出口」意味着在结构里开辟一个新位置，内容覆盖表达不了这件事；
3. **绕路也不行**。把 `x-slot:extra` 写进某个覆盖段内部（寄希望于它随 fallback 进入模板）同样无效——内容侧无深层分段，深层 `x-slot:*` 标记会被 warn + 剥除、元素降级为普通内容（ADR-0056 决策九）。

**正确的两个做法**：

```html
<!-- ✅ 做法一：新内容直接放进覆盖段（最常见——只是想多一块内容） -->
<div x-define="ext-card" x-define:inherit="card">
    <div>正文之上叠的新区域 <i>附带任意复杂结构</i></div>
    <script setup>{}</script>
</div>
```

```html
<!-- ✅ 做法二：要「消费方可替换的新区域」→ 用组合，不用继承。
     ext-card 自己是定义侧——它的模板里可以声明任意新出口 -->
<div x-define="ext-card">
    <div class="wrap">
        <!-- 复用 card：照常实例化、照常覆盖它的出口 -->
        <div x-component:card>
            <template x-slot:header><b>订单</b></template>
        </div>
        <!-- 新结构 + 新出口：ext-card 的消费方可填 -->
        <div class="extra" x-slot:extra>新区域</div>
    </div>
    <script setup>{}</script>
</div>
```

一句话：**继承管「改默认」，组合管「加结构」**——要新出口（新结构位置）时，包一层新组件是正途。

### 父组件后来改了模板，子组件会跟着变吗？

会——继承在**每次编译**时解析：父快照更新后重新编译，子组件取到的是父当时的最新定义（同一次编译内父先收集、子后解析，天然一致）。

## 深入阅读

- [插槽 x-slot](../directives/x-slot.md)——出口 / 内容 / fallback 的完整机制（继承覆盖复用同一套分段规则）
- [x-define](../directives/x-define.md)——组件定义指令参考（含 `x-define:inherit` 语法表）
- [响应式数据](./data.md)——`<script setup>` 各段语义（继承合并发生在这些段上）
