# x-dialog 模态对话框

## 概述

`x-dialog` 是覆盖物消费者的**模态形态**（v1 唯一落地成员；`x-drawer` / `x-popup` / `x-popover` 为未来同构薄子类）：把**任意组件**渲染成**模态对话框**（遮罩 + 居中面板），并以**纯状态驱动**控制其生命周期——visible 绑定真值即开、假值即关，宿主是纯声明点（无隐式点击）。覆盖物的消费模型（组件即内容 / 查找 / props / scope 基准 / 公共契约）见[覆盖物](../overlays.md)。

```html
<button x-dialog:login="ui.loginVisible" @click="ui.loginVisible = true">登录</button>
```

打开靠改状态；ESC、点遮罩、面板内 close 动作三个触点统一走**「请求关闭」**——可回写（简单路径）自动回写 `false`，状态是唯一真相源。

::: tip 插件指令
`x-dialog` 由官方插件包 `@autospark/plugins` 提供（ADR-0128 核心集外移），使用前须加载插件脚本，且**先于 engine 实例化**：

```html
<script src="/autospark/autospark.js"></script>
<script src="/autospark/autospark.overlay.js"></script>
```

npm 场景：`npm install @autospark/plugins` 后自 `node_modules/@autospark/plugins/dist/` 复制所需产物进项目；CDN 直引把上例 `src` 换为 `https://unpkg.com/@autospark/plugins/dist/autospark.overlay.js`。

未加载插件时 `x-dialog` 属性会被编译器当作普通属性剥除，指令不生效。`autospark.overlay.js` 同时包含覆盖物家族全部指令（x-dialog / x-popover / x-drawer / x-foldable），加载一次即全家族可用。聚合产物 `autospark.plugins.js` 一个标签包含全部官方插件。
:::

## 快速入门

<demo html="dialog/basic.html"/>

`x-dialog:login="ui.loginVisible"`——`ui.loginVisible` 为真时对话框打开。打开后无论用哪种方式关闭（ESC / 遮罩 / close 按钮），`ui.loginVisible` 都会被自动回写为 `false`。

## 指南

### 指令值

对话框**没有专用的内容定义语法**——任意一个组件都可以作为对话框的内容（按[组件](../component/)的方式声明 `x-define` / `options.components` / `x-import`，消费处用 `x-dialog:组件名` 引用）。指令值**专职 visible 控制**：真值即开、假值即关（props / 配置与值三者正交，见[传递 props](#传递-propsx-dialog-optionsprops)）：

```html
<!-- 内容：就是一个普通组件，没有任何对话框专属标记 -->
<div x-define="login">
  <h3>{{title}}</h3>
  <button @click="close()">关闭</button>
</div>

<!-- 消费：x-dialog 只是引用组件名 + 状态驱动开关 -->
<button x-dialog:login="ui.loginVisible" @click="ui.loginVisible = true">登录</button>
```

组件的完整能力（数据、方法、生命周期、作用域样式、props）对对话框内容一视同仁；按名字查找（scope 链就近 + 全局兜底）等消费语义见[覆盖物](../overlays.md)。

::: warning 提示
任意组件均可以被`x-dialog`指令显示在对话框中。
:::

#### 状态驱动

`x-dialog`值是一个状态路径——真值即开、假值即关。因为路径可寻址，所有关闭触点都会**自动回写 `false`**：

<demo html="dialog/basic.html"/>

```html
<button x-dialog:login="ui.loginVisible" @click="ui.loginVisible = true">打开</button>
```

多个按钮、菜单项都可以是打开入口——它们只是改同一个状态，对话框的行为完全由状态决定。

#### 表达式驱动

`x-dialog`值可以是任意表达式（向导步骤、派生条件等场景）。表达式**无路径可回写**——请求关闭只收起 UI、不改写状态，**状态仍是唯一驱动源**：

<demo html="dialog/expression.html"/>

```html
<button x-dialog:pay="wizard.step === 2" @click="wizard.step = 2">去支付</button>
```

重开只由**状态变化**驱动：依赖变化后表达式由假变真（如 step 切回 2）时弹出新实例；多依赖表达式（如 `a > 0 && b > 0`）中变化不影响结果（重求值仍为真）时同样会再次弹出。反之，UI 关闭后**状态未变化**（如对同一状态同值赋值）不触发任何重开——派生条件场景下「按钮没反应」通常就是状态没有真正变化。

需要「关闭后不再自动弹出」的精确善后，监听 `overlay:close` 事件（见[请求关闭](#请求关闭)）把关闭事实写回状态。

#### 字面量

`"true"` / `"false"` 是静态字面量（不订阅状态）：`true` 页面加载即开（公告 / 通知类），`false` 永不开启：

<demo html="dialog/literal.html"/>

```html
<!-- 组件：公告内容（须声明在消费者 scope 链上） -->
<div x-define="notice">
  <div class="ov-panel">📢 系统维护通知…</div>
</div>

<!-- 消费者：字面量 true，挂载即开（宿主任意元素） -->
<div x-dialog:notice="true"></div>
```

#### 空值

值缺省（`x-dialog:login` 不写值）时 warn 并恒不打开——对话框必须有 visible 绑定。

### 传递 props（x-dialog-options.props）

`x-dialog` 的值**专职 visible 控制**；props 经**选项成员属性** `x-dialog-options.props` 传递（三者正交：visible 走值、props 走成员属性、配置走 `x-dialog-options`）：

<demo html="dialog/props.html"/>

```html
<button x-dialog:user="ui.open" x-dialog-options.props="{userId: 42}" @click="ui.open = true">
  查看
</button>
```

props 值是**表达式**，与 `x-component` 的值同构（v-bind 心智），三形态：

- **对象字面量**：成员可引用状态路径——`x-dialog-options.props="{userId: user.id}"`；
- **纯状态路径**：对象按键展开——`x-dialog-options.props="currentOrder"`（深层响应）；
- **未声明**：无 props。

props 是**持续热更新**的：打开期间绑定的状态变化会自动 `Object.assign` 进活跃实例的数据域（组件内部状态不被重置）——与 `x-component` props 行为完全一致。

::: warning 字符串字面量须双层引号
成员属性的值按**表达式**求值：写字符串字面量要 `x-dialog-options.title="'提示'"`（数字 / 布尔 / 对象字面量不受影响）。
:::

#### 多对话框定向（x-dialog-options:名称.props）

同一个元素上声明多个 `x-dialog`（消费不同组件）时，用**定向**形态按组件名精确配对：

```html
<button
  x-dialog:user="ui.userOpen"
  x-dialog:order="ui.orderOpen"
  x-dialog-options:user.props="{userId: 42}"
  x-dialog-options:order.props="{orderId: 'A-1'}"
>
  查看
</button>
```

定向语法同样适用于配置整包：`x-dialog-options:user="{closeOnMask: false}"` 只作用于 `user` 那个消费者。消歧规则：冒号后首段匹配同元素某 `x-dialog` 的组件名即定向，否则视为（无定向的）成员名。

### 传入内容（插槽）

对话框组件用**与组件插槽完全相同的** `x-slot` / `x-slot:名` 语法预留可替换位置（出口声明在 `x-define` 组件内，见 [x-slot](./x-slot.md)）。覆盖物宿主侧只有一条关键差别：

> **宿主的裸子节点永不收集**——按钮标签、触发容器内容只属于宿主；要投影的内容必须**显式声明**。

```html
<!-- 组件作者：声明默认出口 + 命名出口 -->
<div x-define="confirm">
  <header x-slot:header>请确认</header>
  <div class="body"><div x-slot>默认正文</div></div>
</div>

<!-- 单个 x-dialog：内容标记直接写在宿主子级 -->
<button x-dialog:confirm="ui.open" @click="ui.open = true">
  <div x-slot>要删除这份草稿吗？</div>
  删除
</button>

<!-- 同一元素多个 x-dialog：内容各套 x-slots="组件名" 归属容器 -->
<button x-dialog:save="ui.save" x-dialog:cancel="ui.cancel" @click="...">
  <template x-slots="save">保存当前草稿？</template>
  <template x-slots="cancel">放弃所有修改？</template>
  提交
</button>
```

规则速查：

| 规则                               | 说明                                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| 单消费者可省容器                   | `x-slot:*` 标记直写宿主子级即可                                                             |
| 多消费者必须各套容器               | `x-slots="组件名"`，容器内裸子节点 = 该覆盖物的默认段；裸标记无法判定归属 → 警告 + 丢弃     |
| 容器/标记不进运行 DOM              | 编译期剪枝（打开时从模板克隆投影），按钮标签全程不受影响                                    |
| 容器名须命中宿主上的 `x-dialog:名` | 不匹配 → 警告 + 丢弃                                                                        |
| 深层标记忽略                       | 归属容器与内容标记只认宿主直接子级；更深层的 `x-slot:*` 剥属性后按普通内容保留              |
| 不能与 `x-component` 同元素        | 组件化身与弹窗声明点对子节点定位互斥——警告后组件让位（弹窗照常）                            |
| 作用域插槽形参照常                 | 出口侧 `x-slot:row="{ item: … }"` 传出、内容侧 `x-slot:row="{ item }"` 接收，与组件路径一致 |

不提供任何内容时，对话框显示组件内的 fallback（默认内容）——这是最常见的形态，零配置。

**看什么**（demo 中的三个按钮）：

1. **「删除」按钮（单消费者简写）**——`x-slot` 标记直写按钮子级，按钮标签「删除」留在按钮上；点开后对话框正文是橙框里那份内容（覆盖 fallback）；
2. **「打开（save）」/「打开（cancel）」按钮（同元素多 x-dialog）**——每个按钮都声明 save + cancel 双消费者，内容各套 `x-slots="组件名"` 容器；打开谁就只投影谁的容器内容，两个对话框互不串台；
3. **不提供内容**——任何按钮去掉标记后点开，对话框退回组件内写的默认正文。

**试试看**：把第二个按钮里 `<template x-slots="cancel">` 的值改成 `"save"`——容器名与打开的组件不匹配，控制台会出现归属警告，正文退回默认提示。

<demo html="dialog/slots.html"/>

**继续阅读**：插槽出口/内容/形参的完整语法见 [x-slot 插槽指令](./x-slot.md)。

#### 配置成员的拆散写法

`x-dialog-options` 的任何配置键都可以拆成独立成员属性（值为表达式，可绑定响应式状态），优先级高于整包内嵌的同名键（整键覆盖）：

```html
<!-- 整包 -->
<button
  x-dialog:tip="ui.open"
  x-dialog-options="{close-on-mask: false, delay-close: 3000}"
></button>

<!-- 等价的成员拆散写法（值为表达式） -->
<button
  x-dialog:tip="ui.open"
  x-dialog-options.close-on-mask="false"
  x-dialog-options.delay-close="3000"
></button>
```

::: warning 成员名用 kebab-case
HTML 属性名会被 DOM 全量小写化（`closeOnMask` 存取均为 `closeonmask`）——camelCase 键的成员属性须以 **kebab-case** 书写（`close-on-mask`、`delay-close`、`data-context`），引擎自动归一；整包内嵌（属性**值**不被小写化）不受影响，纯小写单词键（`props`、`border`、`animate`、`at`）两种写法均可。
:::

### 请求关闭

三个内置触点语义统一：**关闭是「请求」不是命令**——可回写（简单路径）则回写 `false`；不可回写（表达式 / 字面量）仅收起 UI。每次请求关闭同时广播 `overlay:close` 事件供善后：

<demo html="dialog/close-actions.html"/>

```javascript
// 总线通道（推荐）：覆盖物 DOM 在 body 容器内，engine 树内的模板元素收不到 DOM 冒泡
engine.on("overlay:close", ({ payload }) => {
  console.log("已关闭：", payload.name);
});
// DOM 通道：document.addEventListener("overlay:close", e => e.detail.name)
```

::: warning DOM 冒泡的物理边界
覆盖物实例渲染在 `document.body` 下的容器中、**不在 engine 宿主树内**——模板里写 `@overlay:close="…"` 收不到事件。模板外 JS 用引擎总线 `engine.on(...)` 或 `document.addEventListener(...)`（事件 `detail` 为 `{ name, instance, dataContext }`）。
:::

面板内触发的内置 `close` 动作（`@click="close()"`）由消费者在实例根上委托监听，天然闭环——面板内的确认 / 取消按钮零接线即可关闭。

### 数据视图

`dataContext` 配置决定实例的表达式上下文、数据视图与生命周期挂链（**挂链即基准**，详见[覆盖物 · 数据视图基准](../overlays.md#数据视图基准datacontext消费处默认声明处可选)）：

<demo html="dialog/data-context-basis.html"/>

```html
<!-- 默认消费处：模板读消费处数据；实例随消费者 scope 生死 -->
<button x-dialog:demo="ui.openA"></button>

<!-- declarer：模板读声明处数据（定义闭包）；悬空/全局组件退化封闭 -->
<button x-dialog:demo="ui.openB" x-dialog-options.data-context="'declarer'"></button>
```

`declarer` 基准下组件读它声明处所能见的域；消费者所在区域被销毁（如 `x-if` 分支收起）时，打开中的实例同样随级联自动关闭摘除——不会留下悬空弹层。旧键 `scope` 与旧值 `'consumer'` 已随更名**硬切移除**（不兜底、不告警；旧键 `scope` 现在是普通 props 键）。

### 自动关闭

`delayClose`（毫秒）大于 0 时，打开后延时自动走「请求关闭」——通知 / 公告 / 轻提示类弹层的开箱即用通道。它走标准关闭链：可回写的 visible 照常回写 `false`、`overlay:close` 照常广播、动画照常播放：

<demo html="dialog/delay-close.html"/>

```html
<button x-dialog:notice="ui.show" x-dialog-options.delay-close="3000">3 秒后自动消失</button>
<button x-dialog:toast="ui.toast" x-dialog-options="{delay-close: 2000, border: false}">
  轻提示
</button>
```

`delayClose` 缺省 / `0` 不自动关闭；手动关闭（ESC / 遮罩 / close 动作）优先于定时器，二者不冲突。

### 保活（keepalive）

默认语义是**每次打开新实例**——关闭动画播完即销毁，组件内部状态（表单输入、步骤进度）不跨开合保留。`keepalive: true` 改变关闭语义：leave 动画播完后**不销毁**，改为在容器内 `display:none` 隐藏（router keepAlive 同款挂起语义）；重开时**原实例复活**——DOM、数据域、watcher 全部存活，表单填了一半的内容原样还在：

<demo html="dialog/keepalive.html"/>

```html
<!-- 修饰符糖：x-dialog:名称.keepalive="值"——修饰符与 visible 值同一个属性声明 -->
<button x-dialog:editor.keepalive="ui.open" @click="ui.open = true">
  打开编辑器
</button>

<!-- 等价的正典写法（整包 / 成员属性均可） -->
<button x-dialog:editor="ui.open" x-dialog-options="{keepalive: true}" @click="ui.open = true">
  打开编辑器
</button>
```

要点：

- **关闭语义零变化**：visible 照常回写 `false`、`overlay:close` 照常广播、ESC / 遮罩 / close 动作三触点照常——保活只是把「销毁」换成「挂起」；
- **重开 props 浅合并**：仅出现的键 `Object.assign` 进存活的数据域（未出现的键保留旧值）——需要重置的字段请显式传键；
- **声明式专属**：命令式通道 `getOverlay(...).open({keepalive: true})` 不生效并 warn（命令式句柄无缓存归属方，挂起实例会孤儿化）；
- **回收点**：宿主指令销毁时回收其全部挂起实例（含打开中 / 关闭动画中）；`engine.destroy()` 全回收。v1 无 LRU / 数量上限——大量 key 的场景请自行规划容量。

### 多实例与 key

同一组件名默认只有一个保活缓存位——同名重开总是复用同一份挂起实例。`key`（表达式）为缓存**命名空间**：缓存身份 = `组件名 + key + url` 复合——同 key 重开复用挂起实例（防重复堆叠），不同 key 各自独立实例并存（多页签场景）：

```html
<!-- 每个文档一份独立挂起实例：切文档互不覆盖 -->
<div
  x-dialog:editor.keepalive="ui.open"
  x-dialog-options.key="ui.active"
  x-dialog-options.props="{title: docs[ui.active]}"
></div>

<button @click="ui.active = 1, ui.open = true">编辑文档一</button>
<button @click="ui.active = 2, ui.open = true">编辑文档二</button>
```

- `key` 每次打开求值一次（不 watch）——key 变化即新缓存身份，**下次打开生效**；
- 无 key 时键退化为单实例位；
- key 对非 keepalive 路径不生效（无缓存），但会随 `overlay:open` / `overlay:close` 广播 payload（`detail.key`）携带——多实例并存时用于区分事件来源。

### 远程加载（url）

组件**未注册**且配置了 `url` 时，打开走远程路径：外壳骨架面板先开（内容出口内呈现 loading 占位——骨架可见、loading 在 shell 内部），异步加载完成后原位附加内容、隐藏 loading（ADR-0126 合成协议：loading 骨架由引擎在内部错误边界上程序化合成，显隐统一走所有权闸 toggle，与 x-html / x-component 等远程加载物种同协议）。适合内容体量大 / 使用频率低的对话框——不必预注册，打开时按需取。加载语义为**组件优先、片段兜底**的双路径并存：

- **组件优先**：远程 HTML 声明了匹配名的 `x-define` → 按组件编译实例化；
- **片段兜底**：远程 HTML **没有**匹配名声明 → 原始 HTML 按**片段**编译进面板（`x-html.compile` 同语义）。

<demo html="dialog/remote.html"/>

> demo 中「慢网络加载」按钮经 dev 中间件 `?delay=2500` 模拟慢网络响应，可从容观察「面板先开 + 加载中 → 内容就绪原位附加」的完整过程（生产构建后静态伺服忽略该参数）。失败重试按钮指向 demo-api 中间件路径触发确定性 404（dev 的 SPA fallback 会把其他路径下不存在的文件回成 200 HTML，失败态无法触发）。

#### 远程组件

远程 HTML 声明了匹配名的 `x-define` 时，引擎按**组件**编译实例化——与本地构建实例完全同权：data / props / 插槽 / 作用域样式 / 方法全部生效，并经 x-import 的 url 缓存注册到消费处 scope，同 url 重开零请求。远程文件中混入的**其他名** `x-define` 会被正常注册但不渲染（编译期剪枝）。

<demo html="dialog/remote-component.html"/>

消费处——本地**不声明**组件，url 指向一个**包含同名 `x-define`** 的远程文件：

```html
<button
  x-dialog:remote-user="ui.open"
  x-dialog-options="{url: '/autospark/components/dialog-user.html'}"
  x-dialog-options.props="{userId: 42}"
  @click="ui.open = true"
>
  查看用户
</button>
```

远程文件——声明了匹配消费名的 `x-define`，标准组件模板：

```html
<!-- /autospark/components/dialog-user.html——匹配消费名 x-dialog:remote-user -->
<div x-define="remote-user">
  <style>
    .remote-user-panel {
      padding: 24px;
      min-width: 320px;
    }
  </style>

  <div class="remote-user-panel">
    <!-- props 注入：与本地组件 props 通道同权，持续热更新 -->
    <p>ID：<b x-text="userId"></b></p>

    <!-- 组件内部 data / 方法 / 作用域样式 / 插槽全部支持 -->
    <p>内部计数：<b x-text="count"></b></p>
    <button @click="count++">点我自增</button>
    <button @click="close()">关闭</button>
  </div>

  <script type="autospark/setup">
    { data: { userId: 0, count: 0 } }
  </script>
</div>
```

几个要点：远程组件的**生命周期、方法、作用域样式、插槽投影**与本地声明组件完全等价（`x-define` 内的 `data/props/computed/methods` 照常走 setup / script / 属性通道）；props 由消费处 `x-dialog-options.props` 注入并持续热更新；远程组件自身也可以声明 `<script type="autospark/setup">` —— 与 props 同属组件内部**隔离**响应式域，外部 `x-data` 状态在组件内**不可见**（读不到），全部数据必须走 props 传入。远程文件只接受**同名**匹配——消费名与远程 `x-define` 名对不上（typo）时组件无法命中，引擎会 warn 一次提示实际注册名并回退到片段路径。

**数据/参数传递方式**：**只走 `x-dialog-options.props`**，组件内部 `data` 隔离于外部 `x-data` 作用域，组件模板内无法直接读取消费处声明的状态。

#### 远程模板（片段）

远程 HTML **没有**匹配名的 `x-define` 时，原始 HTML 按**片段**编译进面板（`x-html.compile` 同语义）：可含任意指令、不要求组件声明、插值读消费处状态（响应式）、props 注入响应式数据域（热更新与组件路径同权）。片段里混入的其他名 `x-define` 声明会被正常注册但不渲染（编译期剪枝），片段路径不支持插槽内容投影（声明了插槽标记则 warn 丢弃）。

<demo html="dialog/remote-template.html"/>

消费处——本地**不声明** `remote-note` 组件，url 指向一个**无 `x-define`** 的纯 HTML 文件：

```html
<!-- 注意：x-data 声明在消费处，远程片段共享同一个作用域 -->
<div x-data="{ ui: { open: false, source: '来自消费处的状态' } }">
  <button
    x-dialog:remote-note="ui.open"
    x-dialog-options="{url: '/autospark/components/dialog-note.html'}"
    x-dialog-options.props="{topic: '远程片段'}"
    @click="ui.open = true"
  >
    打开片段对话框
  </button>
</div>
```

远程文件——没有任何组件声明，就是一段普通 HTML：

```html
<!-- /autospark/components/dialog-note.html——无 x-define，按片段编译 -->
<div style="padding: 24px; min-width: 320px">
  <!-- props（topic）注入片段响应式 data 域 -->
  <h3 x-text="topic"></h3>

  <!-- 直接读消费处 x-data 的状态（同 scope，响应式同步） -->
  <p>状态来源：<b x-text="ui.source"></b></p>

  <!-- 片段内声明的局部状态 —— x-data 可以出现在片段内 -->
  <div x-data="{ local: '我是片段里的 x-data' }">
    <p x-text="local"></p>
  </div>

  <!-- 任意指令可用：x-if / x-for / x-model / @click 等照常编译 -->
  <button @click="close()">关闭</button>
</div>
```

三个要点：`topic` 来自 `x-dialog-options.props`（注入片段的响应式 data 域）；`ui.source` 读的是**消费处**状态（片段以消费处 scope 为父，声明处数据直接可见且响应式）；`close()` 是引擎内置信号 action——广播 `action:close` 被实例根接住，走标准「请求关闭」链。片段路径没有**组件内部 data**（无 `x-define`）——远程片段与消费处同 scope，`x-data` 可出现在消费处，也可直接出现在片段内部。

**数据/参数传递方式**：**消费处 `x-data` + `x-dialog-options.props` 双通道，全部同 scope 共享**。片段模板可直接 `x-text="ui.source"` 读消费处状态，无需显式 props 传入；props 仅用于需要**显式声明并独立于外部**的片段内部状态（例如不同对话框类型共用一个片段、但需要不同标题）。

#### 远程组件 vs 远程模板：数据传递差异

| 维度 | 远程组件（`x-define`） | 远程模板（片段） |
|---|---|---|
| **数据来源** | **只走 props** | 消费处 `x-data` 直接可见 + props 注入 |
| **组件内部状态** | `<script type="autospark/setup">` 的 `data` 声明 | 片段内可写 `x-data`（局部作用域） |
| **外部 `x-data` 可见性** | **隔离**——组件模板读不到消费处 `x-data` | **共享**——同 scope，消费处状态直接插值 |
| **props 语义** | 标准组件 props（声明式通道、与组件 setup.data 同权） | props 快照注入片段响应式 data 域（热更新） |
| **插槽** | ✅ 支持 | ❌ 不支持 |
| **作用域样式** | ✅ `<style>` 内联，编译期作用域化 | ❌ 纯 HTML，无法带 `<style>` 作用域 |

#### 行为要点

两条路径共享以下规则：

- **本地组件优先于 url**：组件名已可解析（本地声明 / 全局注册）时 url 被忽略——url 只兜底「找不到」的情形；
- **首次打开才加载**（非指令初始化时）；`url` 支持成员表达式（`x-dialog-options.url="tplFor(tab)"`）每次打开重求值——url 变 = 新缓存身份 = 重建（keepalive 下旧挂起实例保留到回收点）；
- **失败不自动关**：加载失败（HTTP 非 2xx / 网络错误 / 解析为空）在面板内呈现 `autospark.error` 错误占位——「重试」原位重载（回到加载中形态），「关闭」照常请求关闭；失败实例不进 keepalive 缓存，**重开即重建面板重新加载**——自然的重试通道。

### 配置合并链

生效配置按两级优先级**深度合并**（数组替换、`undefined` 不覆盖）：

```
内置默认 < x-dialog-options（消费处，整包 / 成员属性 / 定向形态）
```

成员属性（值为表达式，可绑定响应式状态）**整键覆盖**整包内嵌的同名键；同元素多 `x-dialog` 可经定向形态（`x-dialog-options:名称`）精确配对。消费处只写想改的键——组件 def 不携带配置，配置全部走消费处。

<demo html="dialog/options-merge.html"/>

### 弹出定位

默认情况下，`x-dialog`可以弹出对话框在屏幕中间，但是可以通过`at`参数来控制对话框在哪里弹出。

`at` 配置让对话框**贴着锚点元素定位**（经 [floating-ui](https://floating-ui.com/) 计算，flip / 滚动重定位默认开启）；`dialog` 恒模态——有 `at` 也照常渲染遮罩，只是位置变了。`at` 三态：**字符串 / 元素简写**（≡ `{ selector: … }`）或完整锚配置对象：

<demo html="dialog/anchor.html"/>

```html
<!-- 声明式：字符串简写（selector 之外全部走默认——placement 'auto' 自动选位） -->
<button x-dialog:tip="ui.show" x-dialog-options="{at: '/#btn'}">…</button>

<!-- 声明式：对象形态（placement / arrow 等锚成员与 selector 并列） -->
<button
  x-dialog:tip="ui.show"
  x-dialog-options="{at: {selector: '/#btn', placement: 'right', arrow: true}}"
>
  …
</button>
```

```javascript
// 命令式：元素简写 ≡ { selector: btnEl }
engine.getOverlay(el, "tip").open({ at: btnEl });
// 命令式：对象形态（换锚并指定方向）
engine.getOverlay(el, "tip").open({ at: { selector: btnEl, placement: "top" } });
```

::: tip 简写的合并语义
简写（字符串 / 元素）在进合并链前归一化为 `{ selector }`——**只覆盖 `selector`、保留上层 `placement` / `flip` / `arrow` 等其余锚成员**。所以 `x-dialog-options` 配好方向后，值对象或命令式换锚只需 `at: '#other'`，方向照旧。
:::

#### `selector` 的相对选择器语法

`selector` 取值两栖——**元素引用**（`selector: btnEl`，多用于命令式）或**相对选择器字符串**（声明式 / 命令式均可，经引擎的相对查询解析，与 `x-loading` 的 `selector` 同语法）。四种形态：

| 写法                                                       | 查询域                                    | 典型场景                                                   |
| ---------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| `'/#cart-badge'`（`/` 前缀）                               | **`document` 全局**                       | 锚点与消费者任意分离——跨组件树、页面任意位置               |
| 无前缀：`'li.active'`、`'#save'`                           | **消费者宿主元素的子树**                  | 锚点就在声明容器内部——把 `x-dialog` 声明在包含锚点的容器上 |
| `'../.trigger'`（`../` 可叠加）                            | 从宿主沿父级上爬后在**祖先内部**查        | 锚点在宿主的邻近层级                                       |
| `'^li.active'`（`^` closest，`^` 后可叠加 `../` 调整起点） | 从宿主向上 **closest** 匹配（含宿主自身） | 锚点是宿主的某个祖先                                       |

```html
<!-- / 前缀：全局查——锚点（购物车角标）与消费者任意分离 -->
<span
  x-dialog:cartTip="ui.tip"
  x-dialog-options="{at: {selector: '/#cart-badge', placement: 'bottom', arrow: true}}"
></span>

<!-- 无前缀：在宿主（声明元素）子树内查——锚点（激活行）是 <ul> 的后代 -->
<ul
  x-dialog:rowTip="ui.rowTip"
  x-dialog-options="{at: {selector: 'li.active', placement: 'right', arrow: true}}"
>
  <li class="active">当前行（锚点）</li>
</ul>

<!-- ^ closest：锚点是宿主的祖先容器（高亮整个卡片） -->
<div
  class="card"
  x-dialog:cardTip="ui.tip"
  x-dialog-options="{at: {selector: '^.card', placement: 'top', arrow: true}}"
></div>
```

行为要点：

- **打开时现查**：选择器在每次打开时求值（非编译期绑定）——锚元素可以是后渲染的（如 `x-if` 分支内先出现、再触发打开）；
- **未命中**：warn + 退回屏幕居中（不阻断打开）；**非法选择器**同样按未命中处理（不抛错中断）；
- `/` 前缀走全局 `document.querySelector`——**首个命中生效**，注意选择器在页面中的唯一性；无前缀只查消费者宿主**子树**——锚点在宿主之外时必须加 `/`；
- `arrow`：**锚定模式下默认开启**（`arrow: false` 显式关闭）——引擎自动注入箭头载体 + **双伪元素**默认视觉（8×8 旋转 45° 菱形：带阴影层 + 无阴影层沿主轴偏移覆盖嵌入段阴影残留），并按 floating-ui 协议沿 `staticSide` 反向偏移载体尺寸的一半，使菱形一半嵌入面板、一半露出形成小三角，与面板无缝融合；模板零约定，样式可 CSS 覆盖；
- `offset` 未配置且箭头开启：默认让位 `6px`（菱形露出高度），三角尖恰好**点在锚元素边缘**上而非覆盖锚元素内部；配置了 `offset` 则以配置为准。

### 面板边框（border）

`border` 是**面板级配置**（默认 `true`，与锚定无关——无 `at` 时同样生效）：为面板外壳加 **1px 边框 + 背景 + 圆角**（外壳模式——视觉由外壳统一承担，同色背景填平圆角微差，四角无缝），箭头双层自动变色融合——底层菱形变边框色、覆盖层变面板背景色并外扩，露出段留出 ≈1px 边框色斜带与面板 border 连续，嵌入段的边框色与阴影仍被完整遮蔽（无 V 形残留）。颜色与圆角经 CSS 变量定制：`--autospark-overlay-border`（边框色，默认 `rgba(0,0,0,.1)`）、`--autospark-overlay-bg`（面板背景色，默认 `#fff`）、`--autospark-overlay-radius`（圆角，默认 `8px`）。

```html
<button x-dialog:tip="ui.show" x-dialog-options.border="false" @click="ui.show = true">
  无边框
</button>
```

::: info 阴影融合的自定义替代路径（drop-shadow）
默认双伪元素方案对面板内容**零假设**（任意组件、任意视觉形状行为确定）。若您的面板视觉自持（不透明、无溢出浮层），可切换为更高质量的**连续阴影**：面板去掉 `box-shadow`、箭头覆盖层（`.autospark-overlay-arrow::after`）`display: none`，在面板自身挂 `filter: drop-shadow(...)`——阴影沿面板+箭头合成轮廓连续渐变。注意：`filter` 会使面板成为 `fixed` 后代的定位基准，且投影形状 = 内容合成像素轮廓（透明/溢出内容形状不可控）——这正是默认方案不采用它的原因。
:::

`placement` 共 **12 个方向取值**（4 方向 × start / 居中 / end）：`top` / `top-start` / `top-end`、`bottom` / `bottom-start` / `bottom-end`、`left` / `left-start` / `left-end`、`right` / `right-start` / `right-end`；另有 **`'auto'`（默认值）**——经 floating-ui 的 autoPlacement 按视口可用空间自动选位（与 `flip` 互斥，省略 `placement` 即为 auto）。显式方向则固定该方向 + 视口翻转（`flip` 默认开）。上方 demo 中的**九宫格**（中央为锚点，点击以锚点定位、按标注 placement 弹出）演示了全部取值。

::: warning flip 与演示语义
`flip` 默认开启（视口放不下时自动翻面）——生产期望行为；上方 demo 的九宫格中显式 `flip: false` 关闭翻转，以展示每个 placement 的**原始**语义。
:::

### 结构骨架（chrome）：标题 / 关闭按钮 / 动作区

内置外壳内嵌了通用**结构骨架**（`autospark.overlay`，ADR-0124）——header / body / footer 三段（header 有内容才渲染，`closeable: true`（默认）时 close 按钮双形态：header 有内容 → 行内 x，无内容 → 右上角浮动 x）与 body 内边距（`padding: '0.5em'`）。五个骨架键经 `x-dialog-options` 配置：

<demo html="dialog/chrome.html"/>

#### 配置式：title / icon / actions

最常见用法——五个骨架键经 `x-dialog-options` 配置。整包 attr 支持两种形态：**纯静态 JSON**（relaxedToJson → JSON.parse 编译期解析，零开销静态层，不建订阅）；**含函数的对象字面量**（箭头函数 / `function` / 简写方法——自动降级为运行期完整 JS 表达式求值，含响应式）。成员属性通道（`x-dialog-options.键="表达式"`）同样走完整 JS 求值：

```html
<button
  x-dialog:preview="ui.open"
  x-dialog-options="{
    title: '文件预览', icon: 'eye', closeable: true,
    actions: [
      {id: 'reload',  title: '刷新', icon: 'refresh', pos: 'top',    order: 1, handle: () => refresh()},
      {id: 'download',title: '下载', icon: 'download', pos: 'top',    order: 2, handle: () => download()},
      {id: 'cancel',  title: '取消',                   pos: 'left',            handle: () => { ui.open = false; }},
      {id: 'ok',      title: '确认',                   pos: 'right',           handle: () => { ui.open = false; }}
    ]
  }"
  @click="ui.open = true"
>
  预览
</button>
```

几个要点：

- **两条通道的分工与优先级**：整包 `x-dialog-options="{...}"` 一次写全——纯静态 JSON 走零开销静态层；检测到函数语法自动降级为表达式通道（含响应式，无状态引用时不建订阅）。成员属性 `x-dialog-options.键="表达式"` 走完整 JS 求值，且**成员属性整键覆盖整包内嵌同名键**（ADR-0007）；
- `title` / `icon` / `closeable` 是**头部配置**；`actions` 是**动作数组**——按 `pos` 归位：`top` → header 右侧、`left` → footer 左区、`right` / `auto` / `bottom` / 无 pos → footer 右区，同 `pos` 内 `order` 升序稳定排序；
- `icon` 走 **x-icon 域**——内置名 `eye` / `gear` / `trash` / `user` / `edit` / `search` / `save` / `close` / `check` / `refresh` / `download` / `lock` / `info` / `warn` 等；自定义图标注册到 x-icon 域后同名可直用；
- `actions` 每项 `handle` 在**消费处作用域**求值（定义处 `with(scope)` 词法链）——可直接读写消费处数据：visible 驱动形态下写回 `ui.open = false` 即关闭面板（面板内模板元素的 `@click="close()"` 信号动作语义不变）；不想写 `handle` 可把动作 id 绑定到组件方法（消费处 scope 同名 id）——骨架动作双通道语义，见 [覆盖物 · 动作双通道](../engine/overlays.md#骨架动作双通道handle-与消费处scope)；
- 条件渲染：header / footer **有内容才渲染**（header 只看内容——标题、图标、顶区动作任一在场；无内容时不渲染，closeable 时 close 转根级浮动形态——右上角绝对定位，紧凑面板不为空 header 付一行高度）；body 恒渲染；`header` 插槽整块替换时 close 让位（替换者全权）。

#### slots 重载：title / actions / header / footer

配置式无法满足富文本标题、自定义按钮样式等场景时，**宿主子级用 `x-slot:名` 直接重载骨架出口**——内置 shell 声明了插槽通配转发（`slots: "*"`，ADR-0125），chrome 出口名直接可达：

<demo html="dialog/chrome-slots.html"/>

```html
<button
  x-dialog:confirm="ui.open"
  x-dialog-options="{closeable: true}"
  @click="ui.open = true"
>
  <!-- 富文本标题：danger tag + 警告 icon -->
  <template x-slot:title>
    <span class="has-text-danger">⚠️ 删除确认</span>
    <span class="tag is-small is-danger is-light ml-2">不可逆</span>
  </template>

  <!-- footer 右区动作：自定义按钮样式 -->
  <template x-slot:actions.right>
    <button class="button is-text" @click="close()">取消</button>
    <button class="button is-danger" @click="doDelete()">立即删除</button>
  </template>

  删除…
</button>
```

chrome 可重载的出口名（点分名）：

| 出口名 | 作用 | 说明 |
|---|---|---|
| `title` | 标题文本区（局部替换，icon/close 保留） | 富文本标题首选；**不能**重载整块 header——整块替换用 `header` |
| `header` | 整个头部（**整块替换**） | close 按钮一并消失，消费者自己提供关闭路径 |
| `footer` | 整个底部（**整块替换**） | `actions.left` / `actions.right` 仍可独立重载；`footer` 让位时两者都不渲染 |
| `actions.top` | header 右侧动作区（点分名） | 裸 `actions` 等价 `actions.right` |
| `actions.left` | footer 左区（点分名） | |
| `actions.right` | footer 右区（点分名） | |

优先级：**slots 重载 > 配置式**——两者同时声明时，slots 胜出；内容组件 `def.slots` **声明过的名字归内容组件**，骨架 chrome 名**永不抢占**（今日插槽语义 100% 不变）。

#### 视觉定制

不想要骨架 chrome 时设无标题无动作 + `padding: 0`——`closeable: true`（默认）下得**紧凑可关形态**（无 header 行、close 为右上角浮动 x），`closeable: false` 则连浮动 x 一并去除；自定义 shell 整体替换则完全退出骨架。骨架视觉走 CSS 变量（`--autospark-overlay-bg / -border / -radius / -z`），主题系统统一驱动。

<demo html="dialog/chrome-visual.html"/>

### 面板外壳（shell）：自定义面板形态

面板层的结构与视觉（边框 / 圆角 / 背景 / 箭头 / 内容布局）由一个可替换的**外壳组件（shell）**渲染——内置默认 `dialog-shell` 开箱即用；与你的 UI 环境不匹配时，声明一个带 `x-slot` 默认出口的组件，用 `x-dialog-options.shell` 指定即可整体替换，**内容组件与全部模态行为（遮罩 / 居中 / ESC / 关闭写回）不变**：

<demo html="overlay/shell.html"/>

```html
<!-- 自定义外壳：x-slot 默认出口 = 内容组件渲染点；
     x-dialog-options 整包注入 shell 数据域，theme 等自由键 shell 模板可直接消费 -->
<div x-define="fancy-shell" class="fancy-shell" :data-theme="theme">
  <header class="bar"></header>
  <div class="body"><div x-slot></div></div>
</div>

<button x-dialog:login="show" x-dialog-options="{shell: 'fancy-shell', theme: 'teal'}">登录</button>
```

要点：

- **shell 不含遮罩**——遮罩是引擎结构（模态行为的一部分），换 shell 只换面板层；
- `shell` 值为组件名，与内容组件同一查找协议（`x-define` / `options.components` 全局 / `x-import` 均可）；**打开时求值一次**（重开生效，不热更新）；未命中 warn + 回退内置默认；
- 配置链：`x-dialog-options.shell` > 宿主 `x-options` > 引擎级 `options.overlay.dialog.shell`（全站换肤一处配置）> 内置默认；内置名不占用用户命名空间；
- **箭头**：锚定模式下（`at.arrow !== false` 默认开）引擎会定位 shell 模板里的 `.autospark-overlay-arrow` 载体元素——内置模板自带；自定义外壳想带箭头就放一个该类名的元素，不放则无箭头（定位照常）；
- 内置默认面板的家族通用视觉挂契约选择器（`[data-overlay]` 属性 + `.autospark-overlay-arrow` 载体类，ADR-0062 修订——泛化 `.autospark-dialog` 基类已退役、该类回归本形态专属）与 CSS 变量（`--autospark-overlay-z / -bg / -border / -radius`）——既有用户样式覆盖不受影响；自定义外壳保留 `data-overlay` 契约属性即继承默认视觉（可覆盖），完全自写则完全自由。

x-popover 同机制（内置 `popover-shell`，见 [x-popover](./x-popover.md#面板外壳shell)）；机制全貌见[覆盖物 · 面板外壳](../overlays.md#面板外壳shell形态可定制)。

### 命令式弹出

`engine.getOverlay(el, name, options?)` 镜像 `getComponentDeclaration` 查找协议（`el` 起链就近 + 全局兜底，省略 `el` 仅查全局），返回**定义句柄**；`open()` 返回**实例句柄**：

<demo html="dialog/imperative.html"/>

```javascript
const handle = engine.getOverlay(el, "task", { animate: false }); // 第三参：消费者配置级（props 键 = 句柄级默认 props）
const inst = handle.open({
  props: { taskId: "T-1" }, // 显式 props 键 → 注入组件 data 域（打开时快照，覆盖句柄级默认）
  dataContext: someEl, // 两栖基准——传元素（载体）挂其所属 scope；缺省 = rootless 全局视图
  animate: "slide", // 配置键（最顶层）
});
inst.close(); // 精确关这一个实例
handle.close(); // 关该覆盖物当前「全部」打开实例
```

| API                                            | 返回                                  | 说明                                                    |
| ---------------------------------------------- | ------------------------------------- | ------------------------------------------------------- |
| `engine.getOverlay(el, name, options?)`        | 定义句柄 / `undefined`（未命中 warn） | `el` 起链查找（就近覆盖）+ 全局兜底；省略 `el` 仅查全局 |
| `handle.open(options?)`                        | 实例句柄                              | `{props, ...配置键}`——props 显式键；每次 open 新实例    |
| `inst.close()`                                 | —                                     | 精确关闭（请求关闭语义，广播 `overlay:close`）          |
| `inst.el` / `inst.name` / `inst.dataContextEl` | —                                     | 实例外壳根 / 名称 / 数据视图基准元素（命令式传元素时）  |
| `handle.close()`                               | —                                     | 关该覆盖物全部打开实例                                  |

命令式实例与声明式实例**同权**：同一容器、同一事件双通道、同一配置链、同一打开栈。命令式 props 是**打开时快照**（无声明式的热更新——JS 对象无表达式载体；需要变更请关后重开）。未知键（含旧隐式写法 `open({taskId})` 与 `visible`）静默沦为配置自由键——不告警、无 props 效果，请显式使用 `props` 键。

### 嵌套与打开栈

对话框可以叠对话框（主框里触发确认框）。遮罩的 DOM 层叠天然让点击命中最上层；**ESC 经 document 级打开栈只关全局栈顶**实例——嵌套时先关确认框、再关主框，多 engine 并存时也不连环关：

<demo html="dialog/nested.html"/>

```html
<!-- 主对话框组件内再消费一个确认框组件，叠出嵌套 -->
<div x-define="main">
  <button x-dialog:confirm="confirming" @click="confirming = true">删除…</button>
</div>
<div x-define="confirm">…</div>
```

### 进出场动画

`animate` 配置复用引擎[进出场动画](../animate.md)机制：默认 `fade`，字符串 / 对象 / 分相（`{enter, leave}`）/ `false` 关闭；自定义动画按六类名契约写 CSS、传名即用：

<demo html="dialog/animate.html"/>

```html
<button x-dialog:d2="zoom" x-dialog-options.animate="'zoom'">自定义动画</button>
```

关闭动画播放完成后才执行销毁（「播完动画再动 DOM」的标准时序）；动画中重开会抢占（中断在播离场）。

## 配置选项

两级合并链：`内置默认 < x-dialog-options（消费处）`。声明形态三种：整包（`x-dialog-options="{...}"`，宽松 JSON）/ 成员属性（`x-dialog-options.键="表达式"`，整键覆盖整包同名键）/ 定向（`x-dialog-options:组件名....`，按消费实例配对）。

| 配置项        | 默认值            | 修饰符 | 说明                                                                                                                                        |
| ------------- | ----------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`       | 无                | —      | 骨架标题文本（header）；见[结构骨架（chrome）](#结构骨架chrome标题--关闭按钮--动作区)                                                        |
| `icon`        | 无                | —      | 骨架标题左侧图标名（x-icon 域）                                                                                                              |
| `closeable`   | `true`            | —      | 显示 close 图标按钮（走请求关闭链）——双形态：header 有内容 → 行内 x（top actions 最右），无内容 → 右上角浮动 x；`false` 两形态皆关                                                |
| `actions`     | 无                | —      | 骨架动作集（数组，按 `pos` 归位、`order` 升序）：`top` → 顶区、`left` → 左区、`right`/`auto`/`bottom`/无 pos → 右区                          |
| `padding`     | `'0.5em'`         | —      | 骨架 body 区内边距（number 按 px）                                                                                                           |
| `border`      | `true`            | —      | 面板外壳 1px 边框 + 背景 + 圆角，箭头双层变色自动融合；见[面板边框（border）](#面板边框border)                                              |
| `shell`       | `"dialog-shell"`  | —      | 面板外壳组件名（打开时求值一次，未命中回退内置）；见[面板外壳](#面板外壳shell自定义面板形态)                                                |
| `closeOnMask` | `true`            | —      | 点击遮罩请求关闭                                                                                                                            |
| `animate`     | `"fade"`          | —      | 进出场动画（字符串 / 对象 / 分相 / `false`）                                                                                                |
| `dataContext` | 消费处（声明式）  | —      | **数据视图基准**（缺省消费处 / `declarer` 声明处 / `host` 消费处显式声明；命令式缺省 rootless），挂链即基准；旧键 `scope` 已硬切（现为普通 props 键） |
| `delayClose`  | `0`               | —      | 自动关闭延迟（ms）：`> 0` 时打开后延时自动「请求关闭」（可回写的 visible 照常回写）；`0` 不自动关                                           |
| `keepalive`   | `false`           | `keepalive`（修饰符糖） | 关闭不销毁、容器内挂起保活，重开复用实例（声明式专属）；见[保活（keepalive）](#保活keepalive)                                               |
| `key`         | 无                | —      | 保活缓存命名空间（表达式）：缓存身份 = `组件名 + key + url` 复合，同键复用、异键并存；见[多实例与 key](#多实例与-key)                        |
| `url`         | 无                | —      | 组件未注册时打开走远程加载（组件优先 / 片段兜底）；见[远程加载（url）](#远程加载url)                                                         |
| `at`          | 无（居中）        | —      | 贴锚定位（floating-ui）：字符串 / 元素简写（≡ `{selector}`，进链前归一化——只覆盖 selector、保留上层其余锚成员）或完整锚配置对象，成员见下表 |
| `fit`         | `false`           | —      | 面板尺寸跟随宿主：左右弹出 → 高度与宿主一致、上下弹出 → 宽度与宿主一致（跟随翻转后最终方向）；**仅 `at` 锚定生效**（居中形态忽略），见 ADR-0099 |

**`at` 成员**（声明式经 `x-dialog-options` 整包或 `x-dialog-options.at` 成员属性配置；命令式经 `open({ at })` 顶层覆盖）：

| 成员        | 默认值           | 说明                                                                                                                                                              |
| ----------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `selector`  | 配置 `at` 时必填 | 定位锚（两栖）：`/` 全局选择器（`'/#btn'`）/ 无前缀选择器（消费者 scope 子树内查）/ `../` 父级爬升 / `^` closest / 元素引用——打开时现查，未命中 warn + 退屏幕居中 |
| `placement` | `"auto"`         | `"auto"`：autoPlacement 按视口空间自动选位（默认）；或 12 个方向值（`top / bottom / left / right`×`'' / -start / -end`）固定方向                                   |
| `offset`    | 箭头开启时 `6`   | 面板与锚点的间距（透传 floating-ui offset）；箭头开启且未配置时默认让位 6px——三角尖恰好点在锚元素边缘上                                                           |
| `shift`     | 启用（`padding: 0`） | 视口内滑移（floating-ui shift）——面板溢出视口时沿交叉轴滑回，**默认启用**；`false` 关闭；对象透传调参（如 `{padding: 8}`）                                        |
| `flip`      | `true`           | 视口翻转（当前方向放不下自动翻面）；`placement: 'auto'` 时不生效（与 autoPlacement 互斥）                                                                         |
| `arrow`     | `true`           | 箭头：载体 + 双伪元素视觉（阴影层 + 融合覆盖层），`false` 关闭                                                                                                    |

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项见[指令配置](../directive/config.md)。
:::

## 注意事项

- **宿主是纯声明点**：`x-dialog` 不自动绑定宿主点击——打开请显式 `@click="ui.flag = true"`；宿主可为任意元素，同元素可声明多个 `x-dialog` 消费不同组件（各自由不同状态驱动；props / 配置经[定向](#多对话框定向x-dialog-options名称props)按组件名配对）。
- **每次打开新实例**：关闭动画播完即销毁（组件内部状态不跨开合保留——表单类场景用 [keepalive](#保活keepalive) 挂起保活）；多实例可并存，keepalive 下同键复用、异键并存（见[多实例与 key](#多实例与-key)）。
- **表达式形态的重开边界**：关闭只收起 UI，状态仍是唯一驱动源——依赖变化后重求值为真（含多依赖下结果仍真）时会**再次弹出**；状态未变化（同值赋值）不触发重开。需要精确控制请监听 `overlay:close` 自行回写状态。
- **焦点陷阱与滚动锁定**尚未内置（fast-follow）——对话框打开期间页面滚动未被锁定，键盘 Tab 可移出对话框。
- **z-index**：层叠 = 容器内 DOM 追加顺序（后开在上）；需要显式层级时经容器 CSS 变量 `--autospark-overlay-z` 全局调整。
