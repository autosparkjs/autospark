# x-component 组件实例化

## 概述

`x-component` 在模板中**实例化一个已声明的组件**（`x-define` 作用域组件 / `options.components` 全局组件 / 远程加载）。指令值按**文本形态三分**（ADR-0110）：有属性参数时值专职 props（ADR-0054）；值是 url（以 `/` `./` `../` `http(s)://` `file://` 开头）时直载远程组件；无属性参数时值专职远程 url——**响应式 url 简写**。

```html
<div x-component:counter></div>                     <!-- 无 props -->
<div x-component:counter="{ count: 100 }"></div>    <!-- 字面量 props -->
<div x-component:counter="order"></div>             <!-- 绑定状态对象 -->
<div x-component="./components/detail.html"></div>  <!-- url 简写：远程组件直载 -->
```

实例化时**宿主化身组件根**：宿主元素保留身份，组件快照子树编译挂入；组件的 `data` / props 注入宿主 scope 的响应式数据域，`methods` / 钩子 / 作用域样式全部生效。

## 快速入门

声明组件 `counter`（`data` 计数、`methods` 增减、`mounted` 读宿主属性初始化），再以三种方式实例化：无 props、传 props 覆盖默认值、读宿主 `data-count` 属性。

<demo html="component/counter.html"/>

## 指南

### 指令值

指令值按**文本形态**消歧（ADR-0110，与 loader 通道同源判定——props 表达式永不以 url 前缀字符开头，文本级零歧义）：

| 形态 | 说明 |
| --- | --- |
| `x-component:<名称>` | 属性参数承载组件名；无值 = 无 props |
| `x-component:<名称>="<props>"` | 值 = props 表达式（对象字面量 / 状态路径；注入组件响应式数据域） |
| `x-component:<名称>="<url>"` | 值命中字面量 url（`/` `./` `../` `http(s)://` `file://` 开头）→ 远程组件直载；props 改走 `x-component-options.props` |
| `x-component="<url>"` | **无参 url 简写**：值专职远程 url——字面量直载，否则按表达式求值（string→url、object→loader 配置），**响应式 url**；返回多组件时取文档序首个 + `warn` |
| `x-component:<名称>.open` | 修饰符：**消费侧豁免**——打开封闭组件（≡ `x-component-options="{open:true}"`，显式声明即豁免、不 `warn`，ADR-0053 修订） |
| `x-component:<名称>.global` | 修饰符：把远程加载的组件注册为**全局组件**（语义同 `x-import.global`） |
| `x-component:<名称>.slots` | 修饰符：**全部插槽转发**开关（≡ `slots=true`，即 `*` 通配），见[插槽转发](#插槽转发-slots) |

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
- props 值必须是对象形态，标量 / 数组会 `warn` 忽略（组件照常实例化，无 props）；
- **props 选项通道（ADR-0110）**：`x-component-options.props`（整包静态对象或成员属性表达式——后者经 `watch` **响应式**）与指令值 props **双源合并**：`x-component-options.props` 打底、**指令值覆盖同名键**；某源无效（标量 / 数组）按缺失处理、另一源独走。url 形态下指令值被占用，props 单源 = `x-component-options.props`：

```html
<!-- url 占用指令值，props 走选项通道（成员属性表达式 = 响应式 props） -->
<div x-component="./components/detail.html" x-component-options.props="{ id: order.id }"></div>

<!-- 有参 + 双源并存：options.props 打底，指令值覆盖同名键 -->
<div x-component:stat="{ label: '收入' }" x-component-options.props="{ unit: '万元' }"></div>
```

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

不需要批量注册、只用一次的组件，可一步完成「远程加载 + 注册 + 实例化」——内部复用 `x-import` 同一管线（url 缓存、循环检测、注册广播），加载的组件照常进组件查找链供他人复用（ADR-0066）。**url 简写**（ADR-0110）与 `loader` 完整配置两种写法：

```html
<!-- ✅ url 简写：值即 url（字面量），最短写法 -->
<div x-component="/components/like-button.html"></div>

<!-- ✅ url 简写 + 显式指定组件名（url 内容含多个 x-define 时推荐） -->
<div x-component:like-button="/components/buttons.html"></div>

<!-- loader 完整配置（保留兼容）：string 简写 / 对象配置 / 响应式 url 表达式 -->
<div x-component:like-button x-component-options.loader="/components/like-button.html"></div>
<div x-component:detail x-component-options.loader="detailUrl"></div>

<!-- .global 修饰符：注册为全局组件 -->
<div x-component:chip.global="/components/chip.html"></div>
```

**url 取值优先级：指令值 > `options.loader.url`**；两者并存 `warn`（双声明）。

**平铺归一（ADR-0110）**：`fallback` / `error` / `width` / `height` / `request` / `retry` / `retryDelay` / `timeout` / `cache` 可直接写在 `x-component-options` 顶层（成员属性形态天然响应式），同名键**顶层平铺 > `loader` 对象内嵌**：

```html
<!-- url 简写 + 顶层平铺 fallback（加载中占位）与占位尺寸 -->
<div x-component="/components/stat.html"
     x-component-options="{ fallback: '<i>载入中…</i>', width: 160, height: 48 }"></div>
```

**统一内核选项**（ADR-0121）：`retry`（失败自动重试次数，默认 0）/ `retryDelay`（平坦间隔毫秒）/ `timeout`（超时毫秒，0 不限）/ `cache`（同 url 缓存毫秒 TTL）——与 [x-data 同名选项](./x-data.md#异步状态反馈) 语义一致；请求统一经 `engine.options.fetcher` 出站。

loader 语义「**以此 url 为准**」：组件已注册仍 fetch 并以远程版覆盖注册（覆盖时 `warn`，已实例化不受影响）；首次渲染**严格等待 fetch**——期间显示 fallback 占位（缺省 = `x-loading`）。

**多组件返回**：url 含多个 `x-define` 时——有属性参数则按参数名取用（其余照常注册备用）；**无参简写取文档序首个 + `warn`**（同 url 重入不重复提示），显式指定请改写 `x-component:名称="<url>"`。

**响应式 url**：无参形态的值是表达式——裸状态路径即响应式 url，url 变化时中止旧请求、重新加载并重实例化（组件名随新内容重新决策）；有参形态的响应式 url / 配置对象走 `x-component-options.loader`。

裸标识符恒按状态路径求值（与 `x-import` 的「标识符 = 文件名」语义相反）；字面量 url 请以 `/`、`./`、`http(s)://` 开头书写——以 `/` 开头的**动态拼接表达式**会被当字面量，须先落到状态再绑定。

**失败呈现**：fetch 失败或加载结果中无同名组件时，宿主渲染**内置 error 组件**（引擎默认注册——错误文案 + 重试按钮（重新 fetch）+ 关闭按钮；用户同名声明可覆盖），亦可 `x-component:error` 显式实例化渲染任意错误。`error` 键可自定义呈现（形态同 fallback：HTML 字符串或 `{ name, props }`）。

<demo html="component/loader.html"/>

### 插槽转发（slots）

包装组件（模板内又消费了别的组件）可通过 `slots` 选项把**内层组件的插槽出口暴露给自己的消费者**：按声明的清单改名继续向外层查找——支持裸名直通、`原名:对外名` 重命名与 `*` 通配（显式映射优先），多级嵌套逐级接力：

```html
<!-- 包装组件模板：内层 card 的 footer 原名直通，header 对外重导出为 card-header -->
<div x-define="wrapper">
  <div x-component:card x-component-options.slots="footer, header:card-header"></div>
</div>

<!-- 消费者：写对外名，内容落进内层出口 -->
<div x-component:wrapper>
  <template x-slot:card-header><h3>标题</h3></template>
</div>
```

要点：静态清单编译期一次解析（不响应式）；**已声明转发的名字消费者段胜过包装层直供段**（直供段降级为回退候选，消费者未提供时回补渲染；未声明名字直供段恒优先）、未声明名字不穿透；转发名与包装组件自身出口同名会双渲染并警告。全部转发有快捷方式——布尔 `true`（`x-component-options="{slots: true}"`）或直接在指令上写**修饰符** `x-component:card.slots`（≡ `slots=true` ≡ `*`），显式值在场时优先于修饰符。完整语法、并存降级、多级接力与 demo 见 [x-slot 的插槽转发](./x-slot.md#插槽转发-slots)。

## 配置选项

`x-component-options` 与 `x-define-options` 同键兼容（ADR-0110，extends）：`open` / `dataContext` 获得**实例级覆盖**能力——覆盖仅影响本实例，不回写组件定义。

| 配置项       | 默认值 | 修饰符  | 说明                                                                                                 |
| ------------ | ------ | ------- | ---------------------------------------------------------------------------------------------------- |
| `open`       | `false` | `.open` | 消费侧显式布尔（**含 `false`**）**覆盖** `x-define-options.open`（三级优先级：消费显式 > 作者声明 > 默认封闭）；仅指令选项层生效，不经宿主 `x-options` 回退 |
| `dataContext` | —      | —       | 数据上下文的**消费侧覆盖**：`'host'` \| `'declarer'`——仅在生效 `open` 下有效；对封闭组件声明 `warn` 忽略 |
| `props` | — | — | props 选项通道：整包静态对象或成员属性表达式（响应式），与指令值 props 双源合并（指令值覆盖同名键） |
| `global` | `false` | `.global` | 配合远程加载：加载的组件注册为全局组件（语义同 `x-import.global`） |
| `loader` | — | — | 远程直接实例化完整配置：string 简写（字面量 url / 表达式）或对象 `{ url, request?, fallback?, error?, width?, height?, retry?, retryDelay?, timeout?, cache? }`；url 优先级指令值 > `loader.url` |
| `slots` | — | `.slots` | **插槽转发**（ADR-0125）：逗号分隔的名字清单（裸名 / `出口名:对外名` / `*`）或布尔 `true`（≡ `*` 全部转发），把内层组件的插槽出口暴露给包装组件的消费者——静态值，编译期一次解析；修饰符 `.slots` ≡ `true` 开关（显式值在场时被压制）；与 `x-slot`（出口/内容标记）、`x-slots`（覆盖物内容归属容器）是三个不同机制，详见 [x-slot 的插槽转发](./x-slot.md#插槽转发-slots) |
| `fallback` / `error` / `width` / `height` / `request` / `retry` / `retryDelay` / `timeout` / `cache` | — | — | loader 附属键**平铺**（ADR-0110）：顶层声明等效 `loader` 对象内嵌，同名键顶层 > 内嵌；成员属性形态天然响应式；`retry` 等四键为统一内核选项（ADR-0121，默认全 0） |

```html
<!-- 组件侧已声明 open，消费处把基准改为声明处上下文 -->
<div x-component:card x-component-options="{ dataContext: 'declarer' }"></div>

<!-- 消费侧 .open 豁免：打开封闭组件（默认 host 基准，读消费处上下文） -->
<div x-component:card.open></div>

<!-- 实例级关闭：消费侧显式 false 覆盖作者声明的 open（本实例封闭，其他实例不受影响） -->
<div x-component:card x-component-options="{ open: false }"></div>

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

- **值语义消歧是文本级的**：值以 `/` `./` `../` `http(s)://` `file://` 开头即按字面量 url 直载（不经表达式求值）——以 `/` 开头的动态拼接表达式会被误当字面量，请先落到状态再绑定（`x-component="detailUrl"`）；
- **无参 url 简写不认本地组件名**：`x-component="counter"` 的纯标识符值按**状态路径**求值（响应式 url），不存在时一次性 `warn` 迁移提示——本地组件实例化请写 `x-component:counter`（组件名走属性参数，ADR-0054）；
- **props 双源合并是浅合并**：`x-component-options.props` 打底、指令值覆盖同名键，嵌套对象键整体替换；两源均为静态字面量时同样经浅等防抖（内部交互状态不被打回）；
- **旧写法已彻底移除**：`x-use="counter"` / `x-use="{name:'counter',...}"`（ADR-0054 废弃）不再识别——静默失效，请分别改写为 `x-component:counter` / `x-component:counter="{...}"`；
- **对象内 `name` / `is` / `component` 字段识别已废除**：组件名由属性参数承载，这些键回归普通 prop 名；
- **props 更新不重置内部状态**：值无变化（浅等）不更新；多次更新只覆盖出现过的键；要「镜像同步」请销毁重建（外层 `x-if` 切换）；
- **插槽转发默认关闭**：不写 `slots` 时内层出口收不到内容就渲染默认值，绝不向外层查找；声明写在包装组件模板内消费内层组件的元素上，语义与语法详见 [x-slot 的插槽转发](./x-slot.md#插槽转发-slots)；
- **占位呈现组件的 props 不支持函数值**：`fallback` / `error` 的 `{ name, props }` 中，函数会被引擎自动分流到非响应式通道（重试 / 关闭等执行逻辑由引擎经 action 通道注入）——响应式数据域中的函数值会被 autostore 当 computed 在依赖收集时执行，请传纯数据；
- **完整教程**：声明、`<script setup>` 段、作用域样式见 [x-define](./x-define.md) 与[组件](../component/)。
