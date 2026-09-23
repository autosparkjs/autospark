# x-component 组件实例化指令

## 概述

`x-component` 在模板中**实例化一个已声明的组件**（`x-define` 作用域组件 / `options.components` 全局组件 / `x-import` 远程加载）。语法职责分离（ADR-0054）：**属性参数承载组件名，值专职 props**。

```html
<div x-component:counter></div>                     <!-- 无 props -->
<div x-component:counter="{ count: 100 }"></div>    <!-- 字面量 props -->
<div x-component:counter="order"></div>             <!-- 绑定状态对象 -->
```

实例化时**宿主化身组件根**：宿主元素保留身份，组件快照子树编译挂入；组件的 `state()` / props 注入宿主 scope 的响应式状态域，`methods` / 钩子 / 作用域样式全部生效。

## 快速入门

声明组件 `counter`（`state()` 计数、`methods` 增减、`mounted` 读宿主属性初始化），再以三种方式实例化：无 props、传 props 覆盖默认值、读宿主 `data-count` 属性。

<demo html="component/counter.html"/>

## 指南

### 组件名：属性参数（静态）

组件名写在冒号后的属性参数里（`x-component:counter`），**静态、编译期可知**——不支持响应式切换组件名；要条件切换组件，把 `x-if` 写在外层包裹元素上，分支内各自实例化：

```html
<div x-if="mode === 'a'"><div x-component:card-a></div></div>
<div x-if="mode === 'b'"><div x-component:card-b></div></div>
```

组件查找沿 scope 链**就近 + 全局兜底**（与 `getComponent` 协议一致）：本 scope 的 `components` → 祖先链 → `options.components` 全局组件。

### props：三种形态

值是 props 表达式，注入组件响应式状态域（`state()` 默认先注入、props 后覆盖同名键）：

| 写法 | 语义 | 响应粒度 |
| --- | --- | --- |
| `x-component:counter="{ count: 100 }"` | 静态字面量（成员可引用状态路径） | 成员路径级触发 |
| `x-component:counter="order"` | 状态对象**按键展开**为 props（v-bind="obj" 心智） | 深层触发（内部任意键变化实时更新） |
| `x-component:counter="{ count: order.count, step: 5 }"` | 混合 | 同字面量形态 |

配套约定：

- **单向数据流**：外部状态 → 组件；组件内修改 props 键**不回写**外部状态（双向绑定是 `x-model` 的职责）；
- 更新 = 重求值后 `Object.assign` **只覆盖出现的键**——组件内部状态（用户交互改的）不被重置，绑定的状态对象删键后旧键残留（不做镜像同步）；
- props 值必须是对象形态，标量 / 数组会 `warn` 忽略（组件照常实例化，无 props）。

<demo html="component/props.html"/>

### 属性继承

宿主化身组件根后，组件快照根的属性并入宿主：`class` **拼接**；`style` 合并、冲突键**组件根优先**；其他属性宿主已有则保留、否则复制（`x-define` 声明族属性不进实例化 DOM）。

### 组件内上下文与通信

methods / 钩子内的 `this` 是组件实例 Proxy：`this.data`（聚合视图，响应式可写）、`this.state`（全局 store）、`this.el` / `this.scope` / `this.engine`、`this.$parent`（父组件链）：

<demo html="component/context.html"/>

跨组件通信的三种方式（props 下传 / 全局 state 共享 / 父链寻址）：

<demo html="component/communication.html"/>

### 结构指令互斥

`x-component` 与结构指令（`x-if` / `x-for` / `x-slot` / `x-switch` / `x-tree`）**不能同元素**——编译期 `warn` 并跳过实例化。要控制组件显隐，把 `x-show` / `x-if` 写在外层包裹元素上：

```html
<!-- ❌ 冲突：x-component 与 x-for 同元素 -->
<div x-for="i of 3" x-component:card></div>

<!-- ✅ 把结构控制写在外层 -->
<div x-if="show">
    <div x-component:card></div>
</div>
```

### 异步占位

组件定义尚未就绪（`x-import` fetch 中）时宿主显示 **loading 占位**；就绪后（`component/registered` 广播）自动重试实例化、替换为组件实例。远程组件消费见 [x-import](./x-import.md)。

## 配置

### 指令语法

| 形态 | 说明 |
| --- | --- |
| `x-component:<名称>` | 属性参数承载组件名（必写；缺参 `warn` 并跳过实例化——值恰为纯标识符时附言迁移指引） |
| `x-component:<名称>="<props>"` | 值 = props 表达式（对象字面量 / 状态路径；无值 = 无 props） |

### 选项（`x-component-options`）

| 键 | 类型 | 说明 |
| --- | --- | --- |
| `scope` | `'host'` \| `'declarer'` | 数据基准的**消费侧覆盖**——仅对已 `open` 的组件生效（对封闭组件声明 `warn` 忽略，封闭是作者契约） |

```html
<!-- 组件侧已声明 open，消费处把基准改为声明处上下文 -->
<div x-component:card x-component-options="{ scope: 'declarer' }"></div>
```

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项 / 两层回退见[指令配置](../config.md)。
:::

## 注意事项

- **旧写法已彻底移除**：`x-use="counter"` / `x-use="{name:'counter',...}"`（ADR-0054 废弃）不再识别——静默失效，请分别改写为 `x-component:counter` / `x-component:counter="{...}"`；
- **对象内 `name` / `is` / `component` 字段识别已废除**：组件名由属性参数承载，这些键回归普通 prop 名；
- **props 更新不重置内部状态**：多次更新只覆盖出现过的键；要「镜像同步」请销毁重建（外层 `x-if` 切换）；
- **完整教程**：声明、`<script setup>` 段、作用域样式见 [x-define](./x-define.md) 与[组件](../component.md)。
