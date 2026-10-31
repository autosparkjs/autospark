# x-drawer 贴边抽屉

## 概述

`x-drawer` 是覆盖物消费者的**贴边抽屉形态**：把**任意组件**渲染成从屏幕四边或某元素边缘滑入滑出的抽屉面板（侧边栏、过滤器、设置面板）。它与 x-dialog 同基座、同 visible 驱动模型（组件即内容 / 查找 / props / 插槽 / scope 基准，见[覆盖物](../overlays.md)与[x-dialog](./x-dialog.md)），形态差异在**定位与视觉**：默认贴屏幕边滑入、`at.selector` 可锚定到任意元素边缘（长轴沿锚边展开），默认动画为方向性滑入滑出（ADR-0063），默认带抽屉把手（机制组合 x-expandable 共享把手模块，见「抽屉把手」）。

```html
<button x-drawer:sidebar="ui.sidebarOpen">菜单</button>
```

::: tip 插件指令
`x-drawer` 由官方插件包 `@autospark/plugins` 提供（ADR-0128 核心集外移），使用前须加载插件脚本，且**先于 engine 实例化**：

```html
<script src="/autospark/autospark.js"></script>
<script src="/autospark/autospark.overlay.js"></script>
```

npm 场景：`npm install @autospark/plugins` 后自 `node_modules/@autospark/plugins/dist/` 复制所需产物进项目（本包仅 IIFE 产物，无 ESM import 通道，ADR-0128）；CDN 直引把上例 `src` 换为 `https://unpkg.com/@autospark/plugins/dist/autospark.overlay.js`。

未加载插件时 `x-drawer` 属性会被编译器当作普通属性剥除，指令不生效。`autospark.overlay.js` 同时包含覆盖物家族全部指令（x-dialog / x-popover / x-drawer / x-foldable），加载一次即全家族可用。聚合产物 `autospark.plugins.js` 一个标签包含全部官方插件。
:::

## 快速入门

<demo html="drawer/basic.html"/>

`x-drawer:sidebar`——组件名走 attr，渲染成贴边抽屉面板；开关语义见下方[指令值](#指令值)。

## 指南

### 指令值

与 x-dialog 完全同构（同为 visible 驱动的覆盖物消费者）：指令值**专职 visible 布尔控制**——真值打开、归假关闭；组件名走 attr（内容即任意组件，见[覆盖物](../overlays.md)）；props 与配置经 `x-drawer-options`，与值三者正交：

```html
<!-- 内容：就是一个普通组件 -->
<div x-define="filters">
  <h3>过滤器</h3>
  <button @click="close()">关闭</button>
</div>

<!-- 消费：引用组件名 + 状态驱动开关 -->
<button x-drawer:filters="ui.filtersOpen" @click="ui.filtersOpen = true">过滤器</button>
```

四形态（简单路径**回写** / 表达式 / 字面量 / 空值 warn）与「visible 是唯一真相源」语义见 [x-dialog · 指令值](./x-dialog.md#指令值)，此处不赘述。

### 弹出方向（placement）

`at.placement` 决定抽屉贴哪边滑入，只认四个主方向，**默认 `right`**：

```html
<!-- 默认右侧 -->
<button x-drawer:panel="ui.open">右侧抽屉</button>

<!-- 左侧 -->
<button x-drawer:panel="ui.open" x-drawer-options.at="{placement: 'left'}">左侧抽屉</button>

<!-- 顶部 / 底部 -->
<button x-drawer:panel="ui.open" x-drawer-options.at="{placement: 'top'}">顶部抽屉</button>
```

归一规则（全部静默，不告警）：

| 配置值 | 生效方向 |
|---|---|
| `top` / `bottom` / `left` / `right` | 原样 |
| `right-start` / `right-end` 等带后缀 | 剥离后缀取主方向（长轴已铺满，对齐后缀无意义） |
| `'auto'` / 不配置 | `right`（两种模式一致——内侧展开模型下无「选位」概念） |
| 非法值 | `right` |

### 尺寸（size）

短轴尺寸（左右抽屉的宽 / 上下抽屉的高，**方向中立**——同一个 `size` 无论哪个方向都生效）经 `size` 选项控制，**默认 `280px`**；贴边另一轴引擎写死全展开（屏幕模式全屏 / 锚定模式 = 锚边长）：

```html
<!-- 数字按 px；字符串支持任意 CSS 长度 -->
<button x-drawer:panel="ui.open" x-drawer-options="{size: 400}">400px 宽</button>
<button x-drawer:panel="ui.open" x-drawer-options="{size: '40%'}">视口 40% 宽</button>
<button x-drawer:panel="ui.open" x-drawer-options="{size: '20rem'}"></button>

<!-- 成员属性表达式：打开时求值（重开生效） -->
<button x-drawer:panel="ui.open" x-drawer-options.size="ui.drawerWidth"></button>
```

`size` 由引擎打开时 **inline 写入面板**——优先级天然高于样式表，配置必然生效。未配置时 inline 写 `var(--autospark-drawer-size, 280px)`，仍可用 CSS 变量做全站默认：

```css
/* 全站默认 400px（size 未配置时生效） */
:root { --autospark-drawer-size: 400px; }
```

面板默认直角（贴边形态语言）、带边框与投影（继承 `[data-overlay]` 家族面板视觉，配色变量同 [覆盖物](../overlays.md)；形态类 `.autospark-drawer`，ADR-0062 修订），内容超高自动滚动。

### 元素贴边锚定（at.selector）

配置 `at.selector` 后，抽屉不再贴屏幕边，而是贴**锚元素的对应边内侧**覆盖展开（`placement` 指定展开起始边：`right` = 右缘对齐锚右缘、面板从右缘滑入向左移动）；面板**恒在锚内**、不会伸到容器外，**长轴 = 锚边长**（随锚元素尺寸变化自动重同步）——「局部抽屉」：在侧栏、卡片、布局容器内滑入抽屉面板：

<demo html="drawer/anchored.html"/>

```html
<div class="layout">
  <aside id="sidebar">…</aside>
  <!-- placement 四方向：right / left / top / bottom（demo 演示四方向贴锚滑入） -->
  <button x-drawer:filters="ui.filters" @click="ui.filters = true" x-drawer-options.at="{selector: '/#sidebar', placement: 'right'}">过滤器</button>
</div>
```

- 短轴仍由 `size` / `--autospark-drawer-size` 控制，**不钳制**到锚内（锚比抽屉窄时允许溢出）；
- **浮动定位子键静默忽略**：内侧展开模型下 `flip` / `offset` / `shift` 无意义（方向是明确指定）；
- **无箭头**：抽屉形态无箭头，`at.arrow: true` 无效；
- `placement: 'auto'` 静默归一为默认方向 `right`（内侧展开无「选位」概念）；
- **`selector` 未命中**：warn 后回退**屏幕贴边**（默认方向）——不是 x-dialog 的「退居中」，居中对抽屉无意义。

`at` 键的相对选择器语法（`../` 父级爬升 / `^` closest / `/` 全局）见 [x-dialog · 弹出定位](./x-dialog.md#弹出定位)。

### 遮罩（mask）

抽屉默认**模态**（全屏遮罩 + `closeOnMask` + ESC）。不需要遮罩的轻抽屉（如页面内停靠面板）用 `mask: false` 关闭——此时关闭触点仅 **ESC / 子树内 `close()` action / 状态归假**，点外部不会关闭；`closeOnMask` 配置静默无效：

<demo html="drawer/mask.html"/>

```html
<button x-drawer:panel="ui.open" x-drawer-options="{mask: false}">无遮罩抽屉</button>
```

### 拖拽调宽（resize）

`resize` 选项启用面板拖拽调节（**ADR-0073：经面板组合的 [x-expandable](./x-expandable.md) resize 通道**，复用其 `ResizeSession` 核心）：方向按贴边形态**自动推导**——左/右抽屉的内侧竖边（`placement: left` → `e`，类推）、上/下抽屉的内侧横边。约束字段与 x-resizable 选项同构；尺寸**会话内记忆**（重开沿用拖出宽度、**优先于声明 `size`**）；调节会话中抽屉把手**跟随开口边线同步重定位**；`showTrigger: 'hover'` 时拖拽手柄自动接管感应（边条抑制，悬停手柄即显形把手）；**把手让位**——把手区域（开口边中央）下压拖拽判定为 resize 意图（不触发折叠），点击把手**外侧突出半圆**才是折叠；数据不写回 store，`@resize:end` 事件 detail 即出口（事件派发在指令宿主上）：

<demo html="resizable/drawer.html"/>

```html
<button
  x-drawer:sidebar="ui.open"
  x-drawer-options="{resize: {minWidth: 240, maxWidth: 640}, size: 360}"
  @resize:end="ui.width = $event.detail.width"
></button>
```

### 抽屉把手（expandable）

抽屉**默认带**一个常驻的圆形把手：骑在面板**活动边线**上（圆心一半在面板内一半在外），点击即折叠/展开。**折叠 ≡ visible 归假**——没有第三态：折叠就是面板滑出销毁（重开内容重建，overlay 家族「每次打开新实例」既有语义），把手是常驻的打开触发器。把手机制由 [x-expandable](./x-expandable.md) 的**共享把手模块**统一提供（ADR-0070：元素/箭头矩阵/键盘可达/半圆折叠态与 x-expandable、x-splitter 同一契约，类名 `.autospark-expandable-trigger`、变量族 `--autospark-expandable-trigger-*`）：

<demo html="drawer/trigger.html"/>

**位置坐标**：把手沿边线**滑轨**的位置由 `expandable` 选项的 `pos` 控制，默认居中——左右抽屉是垂直位置（把手 `top`）、上下抽屉是水平位置（把手 `left`），由 placement 决定。`expandable` 取值：

| 取值 | 行为 |
|---|---|
| `true`（默认） | 建把手，`pos` 居中（语法糖 ≡ `'50%'`） |
| `false` | 不建把手 |
| `{pos: number}` | px 坐标，距**主边**（top/left）：`{pos: 100}` = 距顶/左 100px |
| `{pos: string}` | CSS 长度：`'20%'`（滑轨长的百分比）/ `'100px'` / `'2rem'`，纯数字字符串按 px |

**负数 = 距对面边的绝对距离**：`{pos: "-20%"}` = 把手显示在距底边（右抽屉）20% 处。越界值静默**钳制到滑轨内**（把手是唯一的重开触发点，永可达、不会滑出可视范围）：

```html
<button x-drawer:sidebar="ui.open">默认带把手（居中）</button>
<button x-drawer:sidebar="ui.open" x-drawer-options="{expandable: false}">无把手</button>
<button x-drawer:sidebar="ui.open" x-drawer-options="{expandable: {pos: '-20%'}}">把手靠下（距底 20%）</button>
<button x-drawer:sidebar="ui.open" x-drawer-options.expandable="ui.exp">坐标响应式</button>
```

- 坐标支持**成员属性表达式响应式**（`x-drawer-options.expandable="ui.exp"`，值变化即时重定位，折叠态同样生效）；
- **显隐策略 `showTrigger` 默认 `'hover'`**：展开态把手隐藏、鼠标悬停边线或 Tab 聚焦显形——感应区是覆盖**整条活动边线**的透明边条（厚 24px，随把手同一几何基准同步，展开态贴面板开口边、折叠态贴屏幕/锚边）；**折叠态恒显**（把手是唯一重开触点，不参与 hover 隐藏）、触屏设备恒显；`'always'` 恒常驻（边条不启用）。已知代价：hover 模式边条遮挡边线附近面板内容的点击（`resize` 启用时边条自动让位于拖拽手柄，见[拖拽调宽](#拖拽调宽resize)）；
- 折叠后把手骑**屏幕边**（屏幕模式）或**锚内侧边**（锚定模式）只露一半（面板展开侧半圆保留）；展开↔折叠时把手沿边线**同步滑移**（与面板同曲线），视觉连续；
- 箭头指向「下一步动作」：展开态指折叠方向、折叠态翻转指展开方向；键盘可达（Tab 聚焦 + Enter/Space 触发，共享把手管线）；**展开态无阴影**（视觉属于面板）、**折叠态保留阴影**（独立浮起提示可点）；
- 把手生命周期挂**消费者**（每指令一把、多实例独立），宿主销毁 / engine 销毁时摘除——面板销毁后它仍在；
- 字面量 / 表达式形态**不建把手**（visible 状态不可写回，点击无意义）；
- 尺寸/配色可调：CSS 变量 `--autospark-expandable-trigger-size`（默认 `20px`）及 `--autospark-expandable-trigger-*` 变量族（见 [x-expandable](./x-expandable.md)）；
- 与 `mask` 正交：模态抽屉的把手折叠走请求关闭（含状态回写），与 ESC / 点遮罩同链。

### 传递 props 与内容（插槽）

与 x-dialog 完全一致：props 经 `x-drawer-options.props`（表达式 + 持续热更新），内容经 `x-slot` 显式声明（宿主裸子节点永不收集）：

```html
<button x-drawer:user-panel="ui.open" x-drawer-options.props="{userId: user.id}">
  <div x-slot>自定义正文</div>
  打开用户面板
</button>
```

语法与规则见 [x-dialog · 传递 props](./x-dialog.md#传递-propsx-dialog-optionsprops) 与 [x-slot](./x-slot.md)。

### 远程加载（url）

远程加载机制为覆盖物家族通用能力（底层与 x-dialog/x-popover 完全同源），组件**未注册**且配置了 `url` 时，打开走远程路径：面板先开（内容出口内呈现 loading 占位），异步加载完成后原位附加内容。加载语义为**组件优先、片段兜底**的双路径并存——选择哪条完全由远程文件内容决定。

<demo html="drawer/remote-component.html"/>
<demo html="drawer/remote-template.html"/>

#### 远程组件

远程 HTML 声明了匹配名的 `x-define` 时，引擎按**组件**编译实例化——与本地构建实例完全同权：data / props / 插槽 / 作用域样式 / 方法全部生效，并经 x-import 的 url 缓存注册到消费处 scope，同 url 重开零请求。远程文件中混入的**其他名** `x-define` 会被正常注册但不渲染（编译期剪枝）。

消费处——本地**不声明**组件，url 指向一个**包含同名 `x-define`** 的远程文件：

```html
<button
  x-drawer:remote-user="ui.open"
  x-drawer-options="{url: '/autospark/components/dialog-user.html'}"
  x-drawer-options.props="{userId: 42}"
  @click="ui.open = true"
>
  打开远程组件抽屉
</button>
```

远程文件——声明了匹配消费名的 `x-define`，标准组件模板：

```html
<!-- /autospark/components/dialog-user.html——匹配消费名 x-drawer:remote-user -->
<div x-define="remote-user">
  <style>
    .remote-user-panel { padding: 24px; min-width: 320px; }
  </style>
  <div class="remote-user-panel">
    <!-- props 注入：与本地组件 props 通道同权，持续热更新 -->
    <p>ID：<b x-text="userId"></b></p>

    <!-- 组件内部 data / 方法 / 作用域样式 / 插槽全部支持 -->
    <p>内部计数：<b x-text="count"></b></p>
    <button @click="count++">点我自增</button>
  </div>
  <script type="autospark/setup">
    { data: { userId: 0, count: 0 } }
  </script>
</div>
```

**数据/参数传递方式**：**只走 `x-drawer-options.props`**，组件内部 `data` 隔离于外部 `x-data` 作用域，组件模板内无法直接读取消费处声明的状态（作用域隔离）。

#### 远程模板（片段）

远程 HTML **没有**匹配名的 `x-define` 时，原始 HTML 按**片段**编译进面板（`x-html.compile` 同语义）：可含任意指令、不要求组件声明、插值读消费处状态（响应式）、props 注入响应式数据域（热更新与组件路径同权）。片段里混入的其他名 `x-define` 声明会被正常注册但不渲染（编译期剪枝），片段路径不支持插槽内容投影（声明了插槽标记则 warn 丢弃）。

消费处——本地**不声明**组件，url 指向一个**无 `x-define`** 的纯 HTML 文件：

```html
<!-- x-data 声明在消费处，远程片段共享同一个作用域 -->
<div x-data="{ ui: { open: false, source: '来自消费处的状态' } }">
  <button
    x-drawer:remote-note="ui.open"
    x-drawer-options="{url: '/autospark/components/dialog-note.html'}"
    x-drawer-options.props="{topic: '远程片段'}"
    @click="ui.open = true"
  >
    打开远程模板抽屉
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

  <!-- 片段内可写 x-data（局部作用域） -->
  <div x-data="{ local: '我是片段里的 x-data' }">
    <p x-text="local"></p>
  </div>

  <!-- 任意指令可用 -->
  <button @click="close()">关闭</button>
</div>
```

**数据/参数传递方式**：**消费处 `x-data` + `x-drawer-options.props` 双通道，全部同 scope 共享**。片段模板可直接 `x-text="ui.source"` 读消费处状态，无需显式 props 传入；props 仅用于需要**显式声明并独立于外部**的片段内部状态（例如不同抽屉类型共用一个片段、但需要不同标题）。

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

两条路径共享以下规则（与 x-dialog/x-popover 完全一致）：

- **本地组件优先于 url**：组件名已可解析（本地声明 / 全局注册）时 url 被忽略——url 只兜底「找不到」的情形；
- **首次打开才加载**（非指令初始化时）；`url` 支持成员表达式（`x-drawer-options.url="tplFor(tab)"`）每次打开重求值——url 变 = 新缓存身份 = 重建；
- **失败不自动关**：加载失败（HTTP 非 2xx / 网络错误 / 解析为空）在面板内呈现错误占位——「重试」原位重载（回到加载中形态），「关闭」照常请求关闭；失败实例不进 keepalive 缓存，重开即重建面板重新加载——自然的重试通道。

### 嵌套（drawer 内再开 drawer）

零特殊机制：子 drawer 消费者声明在**父组件模板内**、visible 状态放组件 data 域即可。多实例并存层叠（后开在上）、**ESC 只关栈顶**、递归深度防护均由覆盖物机制天然保证：

<demo html="drawer/nested.html"/>

```html
<div x-define="parent">
  <script setup>{ data: { childOpen: false } }</script>
  <button @click="childOpen = true">二级抽屉</button>
  <div x-drawer:child="childOpen"></div>
</div>
<div x-define="child"><div class="panel">子抽屉内容</div></div>
<button x-drawer:parent="ui.open">一级抽屉</button>
```

想要「子抽屉贴着父抽屉边缘滑入」（多级侧边栏画面）：给子 drawer 配 `at.selector` 指向父面板内元素 + 对应方向即可。

### 结构骨架（chrome）：标题 / 关闭按钮 / 动作区

内置外壳内嵌了通用**结构骨架**（`autospark.overlay`，ADR-0124）——header / body / footer 三段（header 有内容才渲染；`closeable` 双形态：header 有内容 → 行内 x，无内容 → 右上角浮动 x）与 body 内边距（`padding: '0.5em'`），内容滚动也移入 body 区。五个骨架键经 `x-drawer-options` 配置。骨架与 x-dialog/x-popover 完全同源（底层 `autospark.overlay`），形态差异是 drawer 是 visible 驱动形态（与 dialog 同构）、body 自动滚动、`closeable` 缺省 `false`（贴边常驻面板自有关闭路径居多；显式 `true` 开启）。

<demo html="drawer/chrome.html"/>

#### 配置式：title / icon / actions

最常见用法——五个骨架键经 `x-drawer-options` 配置。drawer 是 visible 驱动形态（与 dialog 同构）。整包 attr 支持纯静态 JSON（零开销静态层）与含函数对象字面量（自动降级为运行期表达式求值）两种形态，成员属性通道同走完整 JS 求值——通道规则与 x-dialog 完全一致（见 [x-dialog · 配置式](../../directives/x-dialog.md#配置式title--icon--actions)）：

```html
<button
  x-drawer:settings="ui.open"
  x-drawer-options="{title: '系统设置', icon: 'gear', closeable: true}"
  x-drawer-options.actions="[
    {id: 'save',  title: '保存', icon: 'save', pos: 'right', order: 1, handle: () => saveAndClose()},
    {id: 'reset', title: '重置',                 pos: 'right', order: 2, handle: () => resetSettings()}
  ]"
  @click="ui.open = true"
>
  打开设置抽屉
</button>
```

要点与 x-dialog 完全一致：`icon` 走 x-icon 域（内置名见 [x-dialog · 配置式](../../directives/x-dialog.md#配置式title--icon--actions)）；`actions` 按 `pos` 归位（top → header 右侧、left → footer 左区、right → footer 右区）；`handle` 在消费处作用域求值，visible 驱动下写回 `ui.open = false` 即关闭（见 [x-dialog · 配置式](../../directives/x-dialog.md#配置式title--icon--actions)）；header/footer 有内容才渲染；body 自动滚动、header/footer 保持悬浮可见。

#### slots 重载：title / actions / header / footer

配置式无法满足富文本标题、自定义按钮样式等场景时，**宿主子级用 `x-slot:名` 直接重载骨架出口**——内置 shell 声明了插槽通配转发（`slots: "*"`，ADR-0125），chrome 出口名直接可达：

```html
<button
  x-drawer:editor="ui.open"
  x-drawer-options="{closeable: true}"
  @click="ui.open = true"
>
  <!-- 富文本标题：emoji + tag 状态 -->
  <template x-slot:title>
    <span class="icon-text">
      <span class="has-text-info">📝</span>
      <span>编辑器</span>
    </span>
    <span class="tag is-small is-info is-light ml-2">自动保存中…</span>
  </template>

  <!-- footer 右区动作：自定义按钮 -->
  <template x-slot:actions.right>
    <button class="button is-small is-text" @click="close()">取消</button>
    <button class="button is-small is-primary" @click="close()">应用</button>
  </template>

  打开编辑器抽屉
</button>
```

chrome 可重载的出口名（与 x-dialog/x-popover 完全一致，完整表见 [x-dialog · slots 重载](../../directives/x-dialog.md#slots-重载title--actions--header--footer)）：`title`（局部替换，icon/close 保留）、`header`（整块替换，close 失效）、`footer`（整块替换）、`actions.top` / `actions.left` / `actions.right`（点分名）。优先级：slots > 配置式。

::: warning 视觉变化（ADR-0124）
抽屉默认**零 header**（`closeable` 缺省 `false` 且无标题/动作 → header 不渲染、无 x），保留 **body 内边距 0.5em** 与**滚动移入 body 区**——`padding: 0` 还原紧凑形态；提供标题/动作则 header 渲染，显式 `closeable: true` 在无内容时得右上角浮动 x；自定义 shell 整体替换则完全退出骨架。
:::

### 面板外壳（shell）

面板层是可替换组件（[ADR-0062](https://github.com/autosparkjs/autospark/blob/main/packages/engine/docs/adr/0062-overlay-shell.md)）：内置默认为 **`drawer-shell`**（直角、无箭头载体），可用自家组件整体替换——`x-drawer-options="{shell: 'my-shell'}"` 或引擎级 `options.overlay.drawer.shell` 全站换肤。短轴尺寸（`size` inline）与贴边定位契约（placement 属性）不依赖 shell 类名，自定义 shell 照常生效；直角等默认视觉不带 `.autospark-drawer` 类则不继承（完全自由）。完整规则见 [x-dialog · 面板外壳](./x-dialog.md#面板外壳shell自定义面板形态)。

### 进出场动画

默认动画为内置 **`'drawer'`**：遮罩淡入淡出 + 面板位移滑入滑出（`translate ±100%`，主流 drawer 形态语言：面板整体平移、内容不变形、纯合成零 reflow），滑入方向自动跟随最终 placement。与家族一致的 `animate` 三形态可改可关：

```html
<button x-drawer:panel="ui.open" x-drawer-options="{animate: 'fade'}">改用淡入淡出</button>
<button x-drawer:panel="ui.open" x-drawer-options="{animate: false}">关闭动画</button>
```

自定义动画（六类名契约）与时长/缓动配置见 [x-dialog · 进出场动画](./x-dialog.md#进出场动画)。

## 配置选项

两级合并链：`内置默认 < x-drawer-options（消费处）`；读取经三层链——**成员属性表达式 > 指令选项 > 宿主 `x-options`**（缺失才回退、不合并）。声明形态：整包（`x-drawer-options="{...}"`，宽松 JSON）/ 成员属性（`x-drawer-options.键="表达式"`，打开时求值）。

| 配置项 | 默认值 | 修饰符 | 说明 |
| --- | --- | --- | --- |
| `title` | 无 | — | 骨架标题文本（header）；见[结构骨架（chrome）](#结构骨架chrome标题--关闭按钮--动作区) |
| `icon` | 无 | — | 骨架标题左侧图标名（x-icon 域） |
| `closeable` | `false` | — | 显示 close 图标按钮（走请求关闭链）——双形态：header 有内容 → 行内 x，无内容 → 右上角浮动 x；缺省 `false`，显式 `true` 开启 |
| `actions` | 无 | — | 骨架动作集（数组，按 `pos` 归位、`order` 升序）：`top` → 顶区、`left` → 左区、`right`/`auto`/`bottom`/无 pos → 右区 |
| `padding` | `'0.5em'` | — | 骨架 body 区内边距（number 按 px） |
| `at` | 无（屏幕贴边） | — | 字符串 / 元素简写 / `{selector, placement, flip, offset, shift}`；`selector` 命中即锚定模式 |
| `at.placement` | `'right'` | — | 四主方向（展开起始边）；`auto`/后缀/非法值一律静默归一为 `right` |
| `at.flip` | — | — | 内侧展开模型下静默忽略（保留键位仅向后兼容） |
| `size` | `280px` | — | 短轴尺寸（方向中立）：number 按 px / CSS 长度字符串；引擎 inline 写入，未配置回退 `--autospark-drawer-size` 变量 |
| `resize` | 无（不可调） | — | 面板拖拽调节：`true` / 选项对象（方向自动推导为贴边内侧单边，`handles` 只能收窄；会话内记忆优先于 `size`；详见[拖拽调宽](#拖拽调宽resize)） |
| `mask` | `true` | — | 模态遮罩显隐；`false` = 裸面板贴边（无外点关闭） |
| `closeOnMask` | `true` | — | 点遮罩请求关闭（无遮罩时静默无效） |
| `animate` | `'drawer'` | — | 进出场动画；显式配置整键尊重 || `expandable` | `true` | — | 抽屉把手（机制组合 x-expandable 共享把手模块，ADR-0070）：骑活动边线的常驻圆形按钮（折叠 ≡ visible 归假）——`true` 居中 / `false` 关闭 / `{pos}` 对象定位（number(px) 与 CSS 长度，负数距对面边、越界钳制） + `{showTrigger}` 显隐策略（默认 `'hover'`：展开态边线感应显形、折叠态恒显；`'always'` 恒常驻）；字面量/表达式形态不建（详见[抽屉把手](#抽屉把手expandable)） |
| `shell` | `drawer-shell` | — | 面板外壳组件名（配置链：成员表达式 > 引擎级 `options.overlay.drawer.shell` > 内置） |
| `border` | `true` | — | 面板 1px 边框（外壳承担） |
| `delayClose` | `0` | — | 打开后自动关闭延迟（ms） |
| `dataContext` | 消费处（声明式） | — | 数据视图基准（同 x-dialog） |
| `props`（成员属性） | 无 | — | `x-drawer-options.props` 表达式注入组件 data 域，持续热更新 |

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项见[指令配置](../../guide/engine/directive/config.md)。
:::

## 注意事项

- **visible 是唯一真相源**：ESC / 遮罩 / close action 都会回写 `false`（简单路径形态）；表达式形态关闭后依赖变化重求值仍真会**重开**（家族已知边界，[x-dialog · 请求关闭](./x-dialog.md#请求关闭)）。
- **家族通用配置**：`keepalive`（关闭挂起保活）/ `key`（保活缓存命名空间）/ `url`（组件未注册时远程加载——**远程组件 vs 远程模板的数据传递差异**见下方）三项为覆盖物家族通用配置，`x-drawer-options` 同通道可用，底层机制与 x-dialog/x-popover 完全一致，语义与消费面见 [x-dialog · 远程加载（url）](./x-dialog.md#远程加载url)（含远程组件 / 远程模板两路径的完整对比表）；`keepalive` 与 `key` 见 [x-dialog · 保活（keepalive）](./x-dialog.md#保活keepalive) 与 [多实例与 key](./x-dialog.md#多实例与-key)。
- **锚定长轴 = 锚边长**：锚元素高度超过视口时抽屉随之超出（不钳制）——需要视口内滚动请让锚元素自身限制高度。
- **`mask: false` 没有外点关闭**：outside-click 关闭（dismissable layer）是家族 fast-follow，未实现——无遮罩抽屉请保证状态可归假或提供 close action。
- **自定义 shell 自担视觉**：替换 shell 后直角等默认视觉不再生效（不带 `.autospark-drawer` 类时）；`size` inline 与贴边定位不受影响。
