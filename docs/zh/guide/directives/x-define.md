# x-define 组件定义指令

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

`x-define` 元素在编译期被前置 transformer 拦截：**深克隆为冻结快照 → 按名挂到最近祖先 scope 的 `components` → 剪枝**（不进结果 DOM、不建 scope、同元素其他指令随组件冻结）。它是注册表里的合法指令名位，但**永不被实例化**（与 `x-icon-define` 同构）。

## 快速入门

`x-scope` 让纯容器建 scope 作归属锚点，内部的 `x-define="counter"` 声明组件（data / methods / 生命周期齐备），`x-component` 实例化它。注意：`x-define` 元素本身**不会出现在页面上**。

<demo html="component/basic.html"/>

## 指南

### 值与命名

| 写法 | 组件名 | 说明 |
| --- | --- | --- |
| `x-define="counter"` | `counter` | 值承载组件名（kebab-case / 大驼峰均可） |
| `x-define`（无值） | `default` | 默认名，供 `getComponent("default")` 等约定名消费者取用 |

- 组件名**自由命名**，引擎不预定义任何 UI 态名册（`x-loading` 等消费者按各自约定名取用，自由命名）；
- 同名组件直接归属**同一 scope** 时 `warn` + 后者覆盖（不抛错）；
- 沿 parent 链允许**就近遮蔽**：内层 scope 的同名组件遮蔽外层与全局同名——与 `getComponent` 就近原则一致。

<demo html="component/scoped.html"/>

### 归属规则

组件挂到其**最近的祖先 scope**——可跨任意深度的中间纯 `<div>`（不建 scope 的容器被穿透）。向上找不到任何带 scope 的祖先时，编译期 `warn` 并丢弃该组件（无处归属）。这就是作用域组件声明通常需要一个 `x-scope`（或任意其他建 scope 的指令 / 插值）作祖先锚点的原因。

### `<script setup>`：数据、私有变量、方法、钩子

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

段名细节（读写规则、优先级、this 数据三件套）见[响应式数据](../component/data.md)的「data 声明」与「顶层私有变量」两节。

### `<style>`：作用域样式

组件内的 `<style>` 默认**只命中本组件实例**（仿 Vue `<style scoped>`）；声明值还支持 `bind(表达式)` 写 CSS 变量实现值级响应式：

<demo html="component/scoped-style.html"/>

<demo html="component/style-bind.html"/>

### 数据边界：`open` / `dataContext`

组件实例默认**封闭**——模板只能读自身 `data` / 顶层私有变量、props 与全局 state，外层 `x-data` 域不可见。声明侧经 `x-define-options` 开放：

<demo html="component/define-options.html"/>

开放后的数据上下文由 `dataContext` 键决定（消费侧可经 `x-component-options.dataContext` 覆盖已开放组件的数据上下文）：`'host'`（默认，消费处上下文）| `'declarer'`（声明处上下文，词法基准）。完整规则见[数据边界](../component/data.md#数据边界默认封闭与-open)一节。

### 嵌套私有子组件

`x-define` 内可再声明 `x-define`——内层组件归属到**外层组件的实例 scope**，仅在该组件实例内部可见（运行期 scope 链天然实现严格私有）。树形 / 递归组件（组件内 `x-component:自身名`）即依赖此机制，引擎带递归深度保护（上限 100，超出 `warn` 停止）。

## 配置

### 指令值

值 = 组件名（字符串字面量，**不经表达式求值**）；无值取 `default`。

### 选项（`x-define-options`）

| 键 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `open` | boolean | `false` | 开放数据边界（声明侧作者契约；`.open` 修饰符是 `true` 的糖，显式键优先） |
| `dataContext` | `'host'` \| `'declarer'` | `'host'` | 开放状态的数据上下文；声明 `dataContext` 而无 `open` 时 `warn` 忽略 |

```html
<!-- 两种开放写法等价 -->
<div x-define="card" x-define-options="{ open: true, dataContext: 'declarer' }">...</div>
<div x-define="card" x-define.open>...</div>
```

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项 / 两层回退见[指令配置](../directive.md#指令配置)。
:::

## 注意事项

- **必须有祖先 scope**：`x-define` 需要至少一个祖先 scope（`x-scope` 或任意指令 / 插值），否则编译期 `warn` 丢弃；
- **不渲染自身**：`x-define` 元素及其子树不进结果 DOM，同元素的其他指令（如 `x-text`）随组件冻结、待实例化时才编译执行；
- **旧写法已废弃**：`x-component="名称"` 的定义写法已更名 `x-define`（ADR-0054），旧写法会被读作缺少组件名的 `x-component` 实例化并 `warn`；
- **完整教程**：组件来源、查找链、全局组件、`x-import` 远程加载见[组件](../component/)。


