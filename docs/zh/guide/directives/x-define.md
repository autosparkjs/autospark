# x-define 组件定义

## 概述

`x-define` 是**声明性资源指令**——在模板中声明一个命名组件：把一段 DOM 连同它的**响应式数据（`data`）、私有变量（setup 顶层键）、方法（`methods`）、生命周期钩子、作用域样式（`<style>`）**打包为可复用供体，经 `x-component:名称` 实例化消费。

```html
<div x-scope>
    <!-- 声明：编译期摘除，不进结果 DOM -->
    <div x-define="counter">
        <span x-text="count"></span>
        <script setup>{ data: { count: 0 } }</script>
    </div>
    <!-- 实例化：见 x-component 指令 -->
    <div x-component:counter></div>
</div>
```

`x-define` 元素在编译期被前置 transformer 拦截：**深克隆为冻结快照 → 按名挂到最近祖先 scope 的 `components` → 剪枝**（不进结果 DOM、不建 scope、同元素其他指令随组件冻结）。它是注册表里的合法指令名位，但**永不被实例化**（与 `x-icons` 同构）。

## 快速入门

`x-scope` 让纯容器建 scope 作归属锚点，内部的 `x-define="counter"` 声明组件（data / methods / 生命周期齐备），`x-component` 实例化它。注意：`x-define` 元素本身**不会出现在页面上**。

<demo html="component/basic.html"/>

## 指南

### 指令值

指令值是**组件名**（静态字符串字面量，trim 后为空取 `default`，**不经表达式求值**）：

| 写法 | 组件名 | 说明 |
| --- | --- | --- |
| `x-define="counter"` | `counter` | 值承载组件名（kebab-case / 大驼峰均可） |
| `x-define`（无值） | `default` | 默认名，供 `getComponentDeclaration("default")` 等约定名消费者取用 |

- 组件名**自由命名**，引擎不预定义任何 UI 态名册（`x-loading` 等消费者按各自约定名取用，自由命名）；
- 同名组件直接归属**同一 scope** 时 `warn` + 后者覆盖（不抛错）；
- 沿 parent 链允许**就近遮蔽**：内层 scope 的同名组件遮蔽外层与全局同名——与 `getComponentDeclaration` 就近原则一致。

<demo html="component/scoped.html"/>

### 归属规则

组件挂到其**最近的祖先 scope**——可跨任意深度的中间纯 `<div>`（不建 scope 的容器被穿透）。向上找不到任何带 scope 的祖先时，编译期 `warn` 并丢弃该组件（无处归属）。这就是作用域组件声明通常需要一个 `x-scope`（或任意其他建 scope 的指令 / 插值）作祖先锚点的原因。声明位置如何决定可见范围与可用时机，详见[查找组件](../component/lookup.md)。

<demo html="component/lookup.html"/>

### 数据与方法（script setup）

`<script setup>`（布尔属性）或 `<script type="autospark/setup">` 声明组件逻辑，对象字面量按段合并；**顶层其余键（非保留键）为私有变量**：

```javascript
{
    data: { time: '...' },                // 响应式数据：改了驱动更新（也可写 data() 工厂）
    timer: null,                          // 顶层私有变量：非响应式，仅 this.<键> 访问
    methods: { start() { /* this.timer / this.data.time */ } },
    created() {}, mounted() {}, beforeUnmount() {}, unmounted() {},
}
```

| 段 | 形态 | 语义 |
| --- | --- | --- |
| `data` | 对象字面量或工厂函数 | 响应式数据：模板可见、修改驱动更新；实例化时先注入（字面量深克隆、工厂每实例调用），props 后覆盖 |
| 顶层私有变量 | 任意值（函数即私有方法） | 非响应式私有数据：模板读不到，仅 method / 钩子内 `this.<键>` 访问；与内置键重名 warn 忽略 |
| `methods` | 对象 | 组件内部方法：`x-on` 调用、`this.其他方法()` 互调；查找止步组件边界 |
| 四阶段钩子 | 函数 | `created` / `mounted` / `beforeUnmount` / `unmounted` |

<demo html="component/data.html"/>

段名细节（读写规则、优先级、this 数据三件套）见[响应式数据](../component/data.md)的「data 声明」与「顶层私有变量」两节。

### `<style>`：作用域样式

组件内的 `<style>` 默认**只命中本组件实例**（仿 Vue `<style scoped>`）；声明值还支持 `bind(表达式)` 写 CSS 变量实现值级响应式：

<demo html="component/scoped-style.html"/>

<demo html="component/style-bind.html"/>

### 数据边界：`open` / `dataContext`

组件实例默认**封闭**——模板只能读自身 `data` / 顶层私有变量、props 与全局 state，外层 `x-data` 域不可见。声明侧经 `x-define-options` 开放：

<demo html="component/define-options.html"/>

开放后的数据上下文由 `dataContext` 键决定（消费侧可经 `x-component-options.dataContext` 覆盖已开放组件的数据上下文）：`'host'`（默认，消费处上下文）| `'declarer'`（声明处上下文，词法基准）。完整规则见[数据边界](../component/data.md#数据边界默认封闭与-open)一节。

### 组件继承：`x-define:inherit`

属性参数 `x-define:inherit="父名"` 声明**单继承**（`x-define:extends` 为同义别名，正名 `inherit`）——子组件复用父组件的模板结构、`<script setup>` 与 `<style>`，经插槽出口做内容差异化（覆盖段在组件实例作用域求值，父子数据 / 方法全可见）：

```html
<div x-scope>
    <div x-define="card">
        <div class="hd" x-slot:header>默认标题</div>
        <div class="bd" x-slot>count={{ count }}</div>
        <script setup>{ data: { count: 0 }, methods: { inc() { this.data.count++ } } }</script>
    </div>
    <!-- 子组件：header 覆盖为「订单」、默认出口覆盖为价格 -->
    <div x-define="order-card" x-define:inherit="card">
        <template x-slot:header><b>订单</b></template>
        <div>价格 {{ price }}</div>
        <script setup>{ data: { price: 100 } }</script>
    </div>
    <div x-component:order-card></div>
</div>
```

实例化时形成三层优先级：**消费方内容 > 继承覆盖 > 父 fallback**。父组件须先于子组件声明（编译期一次性解析，查找协议同消费侧：scope 链就近 + 全局兜底）；解析失败（父缺失 / 值空 / 继承链成环）`warn` + 拒绝注册。setup 按层合并（data / methods / 私有变量子同名胜、钩子父先子后串行），同名方法覆盖后可经 `this.super.方法名(...)` 调用父实现。完整规则见[组件继承](../component/inherit.md)。

<demo html="component/inherit.html"/>

### 嵌套私有子组件

`x-define` 内可再声明 `x-define`——内层组件归属到**外层组件的实例 scope**，仅在该组件实例内部可见（运行期 scope 链天然实现严格私有）。树形 / 递归组件（组件内 `x-component:自身名`）即依赖此机制，引擎带递归深度保护（上限 100，超出 `warn` 停止），详见[组件递归](../component/recursive.md)。

## 配置选项

声明侧数据边界开放配置。`x-define-options` 在编译期**手工解析**（组件元素被前置 transformer 拦截，不走通用指令选项机制）——**无宿主 `x-options` 回退、无成员 / 定向形态**：

| 配置项      | 默认值            | 修饰符 | 说明                                                                                                       |
| ----------- | ----------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| `open`      | `false`           | `.open` | 开放数据边界（声明侧作者契约）；显式布尔**优先于修饰符**（`{open:false}` 可关掉 `.open`），非布尔 warn 回落修饰符值 |
| `dataContext` | `'host'`（消费侧） | —      | 开放状态的数据上下文：`'host'` \| `'declarer'`；仅 `open` 为真生效，声明而无 `open` 时 warn 忽略，非法值 warn 忽略 |

```html
<!-- 两种开放写法等价 -->
<div x-define="card" x-define-options="{ open: true, dataContext: 'declarer' }">...</div>
<div x-define="card" x-define.open>...</div>
```

## 注意事项

- **必须有祖先 scope**：`x-define` 需要至少一个祖先 scope（`x-scope` 或任意指令 / 插值），否则编译期 `warn` 丢弃；
- **不渲染自身**：`x-define` 元素及其子树不进结果 DOM，同元素的其他指令（如 `x-text`）随组件冻结、待实例化时才编译执行；
- **旧写法已废弃**：`x-component="名称"` 的定义写法已更名 `x-define`（ADR-0054），旧写法会被读作缺少组件名的 `x-component` 实例化并 `warn`；
- **继承的父组件须先声明（同步场景）**：父同步在场（文档序在前 / 全局已注册）则编译期立即解析；值空 / 指向自身 / 继承环 `warn` + 拒绝注册。`x-import` 异步父**就绪即解析**（挂起至父注册事件排水，ADR-0083；拼错父名同表现为持续 loading，详见[组件继承](../component/inherit.md)）；
- **组件名建议 kebab-case**：`x-component:名称` 的属性参数会被 DOM 小写化，`x-define="orderCard"` 与 `x-component:orderCard` 因大小写不一致无法命中，请统一小写 / kebab-case（如 `order-card`）；
- **完整教程**：组件来源、查找链、全局组件、`x-import` 远程加载见[组件](../component/)。
