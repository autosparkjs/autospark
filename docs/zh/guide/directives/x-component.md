# x-component 组件实例化

## 概述

`x-component` 在模板中**实例化一个已声明的组件**（`x-define` 作用域组件 / `options.components` 全局组件 / `x-import` 远程加载）。语法职责分离（ADR-0054）：**属性参数承载组件名，值专职 props**。

```html
<div x-component:counter></div>                     <!-- 无 props -->
<div x-component:counter="{ count: 100 }"></div>    <!-- 字面量 props -->
<div x-component:counter="order"></div>             <!-- 绑定状态对象 -->
```

实例化时**宿主化身组件根**：宿主元素保留身份，组件快照子树编译挂入；组件的 `data` / props 注入宿主 scope 的响应式数据域，`methods` / 钩子 / 作用域样式全部生效。

## 快速入门

声明组件 `counter`（`data` 计数、`methods` 增减、`mounted` 读宿主属性初始化），再以三种方式实例化：无 props、传 props 覆盖默认值、读宿主 `data-count` 属性。

<demo html="component/counter.html"/>

## 指南

### 指令值

指令分两段：**属性参数承载组件名**（`x-component:counter`），**值专职 props 表达式**（无值 = 无 props）：

| 形态 | 说明 |
| --- | --- |
| `x-component:<名称>` | 属性参数承载组件名（必写；缺参 `warn` 并跳过实例化——值恰为纯标识符时附言迁移指引） |
| `x-component:<名称>="<props>"` | 值 = props 表达式（对象字面量 / 状态路径；注入组件响应式数据域） |
| `x-component:<名称>.open` | 修饰符：**消费侧豁免**——打开封闭组件（≡ `x-component-options="{open:true}"`，显式声明即豁免、不 `warn`，ADR-0053 修订） |
| `x-component:<名称>.global` | 修饰符：配合 `loader` 把远程加载的组件注册为**全局组件**（语义同 `x-import.global`） |

组件名**静态、编译期可知**——不支持响应式切换组件名；要条件切换组件，把 `x-if` 写在外层包裹元素上，分支内各自实例化：

```html
<div x-if="mode === 'a'"><div x-component:card-a></div></div>
<div x-if="mode === 'b'"><div x-component:card-b></div></div>
```

组件查找沿 scope 链**就近 + 全局兜底**（与 `getComponentDeclaration` 协议一致）：本 scope 的 `components` → 祖先链 → `options.components` 全局组件。

### props：三种形态

值是 props 表达式，注入组件响应式数据域（`data` 默认先注入、props 后覆盖同名键）：

| 写法 | 语义 | 响应粒度 |
| --- | --- | --- |
| `x-component:counter="{ count: 100 }"` | 静态字面量（成员可引用状态路径） | 成员路径级触发 |
| `x-component:counter="order"` | 状态对象**按键展开**为 props（v-bind="obj" 心智） | 深层触发（内部任意键变化实时更新） |
| `x-component:counter="{ count: order.count, step: 5 }"` | 混合 | 同字面量形态 |

配套约定：

- **单向数据流**：外部状态 → 组件；组件内修改 props 键**不回写**外部状态（双向绑定是 `x-model` 的职责）；
- 更新 = 重求值后先与上次应用的 props **浅值比较**：键值完全相同则跳过更新——静态字面量 props 被无关状态变化触发重算时，组件内交互改的同名键**不被打回**字面量初值；有变化才 `Object.assign` **只覆盖出现的键**——组件内部状态（用户交互改的）不被重置，绑定的状态对象删键后旧键残留（不做镜像同步）；
- props 值必须是对象形态，标量 / 数组会 `warn` 忽略（组件照常实例化，无 props）。

<demo html="component/props.html"/>

### 属性继承

宿主化身组件根后，组件快照根的属性并入宿主：`class` **拼接**；`style` 合并、冲突键**组件根优先**；其他属性宿主已有则保留、否则复制（`x-define` 声明族属性不进实例化 DOM）。下方 demo 的面板 ②③ 中，宿主 `host-cls` 与组件根 `greet-root` 的 class 拼接同时生效：

<demo html="component/props.html"/>

### 组件内上下文与通信

methods / 钩子内的 `this` 是组件实例 Proxy：`this.data`（聚合视图，响应式可写）、`this.props`（其等价别名）、`this.globalState`（全局 store）、`this.el` / `this.scope` / `this.engine`、`this.$parent`（父组件链）：

<demo html="component/context.html"/>

跨组件通信的三种方式（props 下传 / 全局 state 共享 / 父链寻址）：

<demo html="component/communication.html"/>

### 与结构指令共存

判据是**是否占用子树**（`ownsChildren`，按注册表动态推导而非指令名清单）：不占子树的指令与 `x-component` 同元素**天然正交**；占子树的结构指令与组件实例化互斥——双方都要对同一子树行使编译/销毁权。

**✅ 可同元素**（组件实例化照常）：

```html
<!-- x-show：显隐切换，组件实例常驻（display 切换与实例化正交） -->
<div x-show="visible" x-component:card></div>

<!-- x-if.keepalive：显隐切换且组件保活——摘除时 unmounted 不触发、状态保留，重挂复活同一实例 -->
<div x-if.keepalive="visible" x-component:card></div>
```

两者的取舍：`x-show` 最轻（纯 display）；`.keepalive` 摘宿主出 DOM（适合列表项等需要彻底移除节点的场景）且同样保活。要**销毁重建**（切换走完整 unmounted/mounted、状态重置）才需要 eager `x-if`——它占子树，须写在外层：

**❌ 互斥**（编译期 `warn` + 跳过实例化，warn 附替代写法指引）：

```html
<!-- ❌ eager x-if 占子树，与组件互斥——条件挂载（销毁重建）把组件写进子树 -->
<div x-if="show">
    <div x-component:card></div>
</div>

<!-- ❌ x-for / x-isolate / x-switch / x-tree 同为占子树结构指令 -->
<div x-for="i of 3" x-component:card></div>
```

### 异步占位

组件定义尚未就绪（`x-import` fetch 中）时宿主显示 **loading 占位**；就绪后（`components/<名>/registered` 广播）自动重试实例化、替换为组件实例。远程组件消费见 [x-import](./x-import.md)。

<demo html="component/import.html"/>

### 远程直接实例化（loader）

不需要批量注册、只用一次的组件，可经 `x-component-options.loader` 一步完成「远程加载 + 注册 + 实例化」——内部复用 `x-import` 同一管线（url 缓存、循环检测、注册广播），加载的组件照常进组件查找链供他人复用（ADR-0066）：

```html
<!-- string 简写：字面量 url（以 / ./ ../ http(s):// 开头）直接加载 -->
<div x-component:like-button x-component-options.loader="/components/like-button.html"></div>

<!-- 对象配置：request 透传 fetch、width/height 加载中占位尺寸、fallback/error 自定义呈现 -->
<div x-component:stat="{ label: '收入' }"
     x-component-options="{ loader: { url: '/components/stat.html', width: 160, height: 48 } }"></div>

<!-- .global 修饰符：注册为全局组件 -->
<div x-component:chip.global x-component-options.loader="/components/chip.html"></div>
```

loader 语义「**以此 url 为准**」：组件已注册仍 fetch 并以远程版覆盖注册（覆盖时 `warn`，已实例化不受影响）；首次渲染**严格等待 fetch**——期间显示 fallback 占位（缺省 = `x-loading`）。

url 含多个 `x-define` 时按属性参数名取用，其余照常注册备用。

**响应式 url**：成员属性形态的值是表达式——裸状态路径即响应式 url，url 变化时中止旧请求、重新加载并重实例化（组件内部状态丢失）：

```html
<div x-component:detail x-component-options.loader="detailUrl"></div>
```

裸标识符恒按状态路径求值（与 `x-import` 的「标识符 = 文件名」语义相反）；字面量 url 请以 `/`、`./`、`http(s)://` 开头书写。

**失败呈现**：fetch 失败或加载结果中无同名组件时，宿主渲染**内置 error 组件**（引擎默认注册——错误文案 + 重试按钮（重新 fetch）+ 关闭按钮；用户同名声明可覆盖），亦可 `x-component:error` 显式实例化渲染任意错误。`error` 键可自定义呈现（形态同 fallback：HTML 字符串或 `{ name, props }`）。

<demo html="component/loader.html"/>

## 配置选项

| 配置项       | 默认值 | 修饰符  | 说明                                                                                                 |
| ------------ | ------ | ------- | ---------------------------------------------------------------------------------------------------- |
| `open`       | `false` | `.open` | 消费侧豁免：打开封闭组件（显式声明即豁免、不 `warn`）；仅指令选项层生效，不经宿主 `x-options` 回退 |
| `dataContext` | —      | —       | 数据上下文的**消费侧覆盖**：`'host'` \| `'declarer'`——对已 `open` 的组件生效；对完全封闭的组件声明 `warn` 忽略 |
| `global` | `false` | `.global` | 配合 `loader`：远程加载的组件注册为全局组件（语义同 `x-import.global`） |
| `loader` | — | — | 远程直接实例化：string 简写（字面量 url / 表达式）或对象 `{ url, request?, fallback?, error?, width?, height? }`；见[远程直接实例化](#远程直接实例化loader) |

```html
<!-- 组件侧已声明 open，消费处把基准改为声明处上下文 -->
<div x-component:card x-component-options="{ dataContext: 'declarer' }"></div>

<!-- 消费侧 .open 豁免：打开封闭组件（默认 host 基准，读消费处上下文） -->
<div x-component:card.open></div>

<!-- 组合：打开封闭组件 + 指定声明处基准 -->
<div x-component:card.open x-component-options="{ dataContext: 'declarer' }"></div>
```

::: warning 仅指令选项层生效
消费侧 `open` 只认 `x-component.open` / `x-component-options`——宿主元素 `x-options` 里给其他指令声明的 `open` 键**不会**回退命中，不会意外打开组件。
:::

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项 / 两层回退见[指令配置](../directive/config.md)。
:::

## 注意事项

- **旧写法已彻底移除**：`x-use="counter"` / `x-use="{name:'counter',...}"`（ADR-0054 废弃）不再识别——静默失效，请分别改写为 `x-component:counter` / `x-component:counter="{...}"`；
- **对象内 `name` / `is` / `component` 字段识别已废除**：组件名由属性参数承载，这些键回归普通 prop 名；
- **props 更新不重置内部状态**：值无变化（浅等）不更新；多次更新只覆盖出现过的键；要「镜像同步」请销毁重建（外层 `x-if` 切换）；
- **占位呈现组件的 props 不支持函数值**：`fallback` / `error` 的 `{ name, props }` 中，函数会被引擎自动分流到非响应式通道（重试 / 关闭等执行逻辑由引擎经 action 通道注入）——响应式数据域中的函数值会被 autostore 当 computed 在依赖收集时执行，请传纯数据；
- **完整教程**：声明、`<script setup>` 段、作用域样式见 [x-define](./x-define.md) 与[组件](../component/)。
