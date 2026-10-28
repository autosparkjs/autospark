# x-popover 悬浮弹层

## 概述

`x-popover` 是覆盖物消费者的**悬浮形态**：把**任意组件**渲染成贴附在触发元素旁的轻量浮层（无遮罩、带箭头），显示由**宿主触发**——默认悬浮（鼠标移入宿主显示、指针离开「宿主∪面板」区域后关闭），可经 `trigger: 'click'` 改为点击开关。它与 x-dialog 同基座、同消费模型（组件即内容 / 查找 / props / 插槽 / scope 基准，见[覆盖物](../overlays.md)），唯一形态差异是**触发模型**：宿主不再是纯声明点，而是触发器，指令值不参与驱动（ADR-0060）。

```html
<button x-popover:tip>悬停查看提示</button>
```

## 快速入门

<demo html="popover/basic.html"/>

`x-popover:tip`——组件名走 attr（与 `x-dialog:login` 同一载体约定）；显示与关闭完全由宿主触发驱动（默认悬浮），不需要（也不读取）指令值。

## 指南

### 指令值

值不参与驱动——悬浮/点击两种触发方式都没有 visible 真相源：显示与关闭完全由宿主触发驱动，关闭即 UI 关闭，不回写任何状态。写了指令值会收到 warn（值已忽略，失效可发现）：

```html
<!-- 值被忽略并 warn：触发模型无 visible 真相源 -->
<button x-popover:tip="ui.flag">悬停</button>
```

### 触发方式

`trigger` 选项决定宿主以何种交互触发显示与关闭，取值封闭两值（非法值触发时 warn 并回退 `'hover'`）：

| 取值 | 触发 | 关闭触点 |
| --- | --- | --- |
| `'hover'`（默认） | 宿主 `mouseenter`，经 `delayShow` 悬浮意图延迟后打开 | 指针离开「宿主∪面板」共享域（`delayHide` 宽限）、`ESC` |
| `'click'` | 宿主 `click` 即开关（toggle） | 再点宿主、**点击面板外部**、`ESC`；面板内点击不关 |

<demo html="popover/trigger.html"/>

两种方式都没有 visible 真相源（见[指令值](#指令值)）；`ESC` 与 x-dialog 共用全局打开栈、只关栈顶。三种书写形态（修饰符与显式 `trigger` 同写时**显式赢**）：

```html
<!-- 整包 -->
<button x-popover:tip x-popover-options="{trigger: 'click'}">点击</button>

<!-- 修饰符糖（≡ trigger: 'click'） -->
<button x-popover:tip.click>点击</button>

<!-- 成员属性（值为表达式，可绑定响应式状态热切换——打开中的面板不重估，切换自下一次触发生效） -->
<button x-popover:tip x-popover-options.trigger="ui.mode">切换</button>
```

**hover（默认）**：`mouseenter` 悬浮意图语义（不是字面 `mouseover`——后者会在宿主子元素间移动时反复触发），计时期间移开则取消（快速掠过不误触发）；关闭 = 指针离开共享 hover 域经 `delayHide` 宽限（机制见[共享 hover 域](#共享-hover-域不闪关)与[延迟配置](#延迟配置)）。

**click**：一次点击语义一致——关着点开、开着点关；关闭还可经**点击面板外部**（点任何面板外元素即关；点另一个 popover 宿主会关旧开新）与 `ESC`。click 方式下悬浮设施整体不生效：鼠标移入/移出宿主与面板无反应（面板内交互控件可安全使用），`delayShow`/`delayHide` 静默不适用（不 warn）。click 也是触摸设备的主路径（点按开关 + 外点关闭）。

::: warning 触觉设备
hover 交互在触摸屏上没有对应物（点按会以模拟事件触发 mouseenter）。触屏场景请改用 `trigger: 'click'`（点按开关、外点关闭）；需要模态专注时用 `x-dialog` 状态驱动。
:::

### 延迟配置

`delayShow`（默认 `200`）与 `delayHide`（默认 `150`）均为毫秒，`0` 表示无延迟（仅 `hover` 方式生效——`click` 方式下无悬浮语义，静默忽略）：

```html
<!-- 整包 -->
<button x-popover:tip x-popover-options="{delayShow: 300, delayHide: 200}">悬停</button>

<!-- 成员拆散写法（值为表达式，可绑定响应式状态） -->
<button x-popover:tip x-popover-options.delay-show="ui.slow">悬停</button>
```

非法值（负数 / 非数字）warn 后按默认值处理。

### 共享 hover 域（不闪关）

面板渲染在 body 容器内、与宿主在 DOM 上分离——「从宿主移向面板」在 DOM 层是一次真正的离开。引擎在宿主与面板两侧都挂悬浮监听并把二者视为**同一 hover 域**：宿主↔面板互移不闪关，面板与宿主之间的间隙由 `delayHide` 宽限兜底。

### 嵌套（hover 链）

子 popover 可以声明在父 popover 的面板内（典型场景：多级菜单）。所有面板都在 body 容器里、互为 DOM 兄弟——引擎维护 **hover 链**：把后代 popover 的域并入祖先域，指针从父面板移入子面板全程不闪关；子面板关闭时祖先经指针位置重估，指针仍在父域则父级保持、已出域则一并关闭（`ESC` 关子不残留父级）。

<demo html="popover/nested.html"/>

```html
<div x-define="menu">
  <div class="menu">
    <button x-popover:submenu x-popover-options="{at: {placement: 'right-start'}}">更多操作 ▸</button>
    <button>重命名</button>
  </div>
</div>
<div x-define="submenu">
  <div class="menu"><button>分享到…</button><button>归档</button></div>
</div>
<button x-popover:menu>多级菜单</button>
```

同宿主声明多个 `x-popover:*` 会收到 warn（触发源重合，同一次触发将同时打开全部面板，见[注意事项](#注意事项)）——多个入口请分散到不同宿主元素或改用嵌套。嵌套链上各 popover 可各自声明 `trigger`（混合触发，如 click 父 + hover 子）：click 消费者不参与 hover 链的豁免与重估（其关闭只听点击/外点/ESC），但仍充当 hover 后代的域容器，子级照常悬浮交互。

### 定位

默认锚 = **宿主元素自身**、`placement` 默认 `'bottom'`（空间不足自动翻转，箭头默认显示）。`x-popover-options.at` 显式配置时与默认锚做**成员级合并**——用户写出的成员生效，缺省成员回退（`selector` 回退宿主、`placement` 回退 `bottom`），因此只写方向的 `at: {placement: 'right-start'}` 同样贴附宿主生效；**换锚只改显示位置，不改变触发关系**（触发器恒为宿主、共享 hover 域恒为「宿主∪面板」）：

<demo html="popover/anchor.html"/>

```html
<!-- 右侧弹出（只写方向：selector 缺省回退宿主） -->
<button x-popover:tip x-popover-options="{at: {placement: 'right-start'}}">悬停</button>

<!-- 锚向别的元素（注意：锚距离宿主过远时，指针从宿主到面板的旅程可能超出 delayHide 宽限） -->
<button x-popover:tip x-popover-options="{at: '/#navbar-logo'}">悬停</button>
```

`placement` 共 **12 个方向取值**（4 方向 × start / 居中 / end）：`top` / `top-start` / `top-end`、`bottom` / `bottom-start` / `bottom-end`、`left` / `left-start` / `left-end`、`right` / `right-start` / `right-end`；省略时回退默认 **`bottom`**（popover 惯例，与 x-dialog 的 `auto` 不同）。九宫格 demo（悬停按钮，面板按标注 placement 贴附到中央锚点弹出）演示全部取值：

<demo html="popover/placement.html"/>

`at` 键的完整语义（相对查询语法 / flip / offset / shift / arrow / 边框配色变量）见[覆盖物 · 定位锚点](../overlays.md)。

### 尺寸跟随宿主（fit）

`fit`（默认 `false`）让面板尺寸与宿主一致——按定位主向自动选轴：左右弹出（left/right 系）→ 面板高度 = 宿主高度；上下弹出（top/bottom 系）→ 面板宽度 = 宿主宽度（[ADR-0099](https://github.com/autosparkjs/autospark/blob/main/packages/engine/docs/adr/0099-overlay-fit.md)）。跟随 `flip` 翻转后的最终方向（`auto` 选位同样生效），inline 写在面板外壳根上、`autoUpdate` 重算时持续生效——自定义 shell 照常约束：

<demo html="popover/fit.html"/>

```html
<!-- 面板宽度 = 按钮宽度（上下弹出取宽度；左右弹出则取高度） -->
<button x-popover:tip x-popover-options="{fit: true}">悬停</button>
```

### 内容内边距（padding）

`padding`（默认 `0`）控制 shell 内容区 `.autospark-popover-content` 的内边距：`number` 按 `px`，CSS 长度字符串（含多值如 `'10px 24px'`）直写；负数/非法值触发时 warn 并按默认 `0` 处理。现读应用、重开生效；自定义 shell 未提供该类名的内容区时静默跳过（外壳形态自控内边距）：

<demo html="popover/padding.html"/>

```html
<!-- 数字：四边 16px -->
<button x-popover:tip x-popover-options="{padding: 16}">悬停</button>

<!-- 多值（成员属性表达式：顶层字符串字面量须双层引号） -->
<button x-popover:tip x-popover-options.padding="'10px 24px'">悬停</button>
```

### 传递 props 与内容（插槽）

与 x-dialog 完全一致：props 经 `x-popover-options.props`（表达式 + 持续热更新），内容经 `x-slot` 显式声明（宿主裸子节点永不收集）。语法与规则见 [x-dialog · 传递 props](./x-dialog.md#传递-propsx-dialog-optionsprops) 与 [x-slot](./x-slot.md)。

<demo html="popover/props.html"/>

```html
<!-- props：表达式注入组件 data 域（成员可引用状态路径，打开期间持续热更新） -->
<button x-popover:user-card x-popover-options.props="{userId: 42}">悬停查看名片</button>

<!-- 内容：x-slot（默认出口）+ x-slot:footer（命名出口）直写宿主子级，按钮标签不受影响 -->
<button x-popover:user-card x-popover-options="{delayShow: 0}" x-popover-options.props="{userId: 42}">
  <div x-slot>自定义正文</div>
  <span x-slot:footer>自定义页脚</span>
  悬停查看名片
</button>
```

### 结构骨架（chrome）：标题 / 关闭按钮 / 动作区

内置外壳内嵌了通用**结构骨架**（`autospark.overlay`，ADR-0124）——header / body / footer 三段（header 有内容才渲染；`closeable` 双形态：header 有内容 → 行内 x，无内容 → 右上角浮动 x）与 body 内边距（`padding: '0.5em'`）。五个骨架键经 `x-popover-options` 配置。骨架与 x-dialog/x-drawer 完全同源（底层 `autospark.overlay`），形态差异是 popover 默认 hover 触发、`closeable` 缺省 `false`（紧凑悬浮形态浮动 x 价值低——hover tip 鼠标移开即消失；显式 `true` 开启）。

<demo html="popover/chrome.html"/>

#### 配置式：title / icon / actions

最常见用法——五个骨架键经 `x-popover-options` 配置。popover 用 `.click` 触发（否则气泡随鼠标消失）。整包 attr 支持纯静态 JSON（零开销静态层）与含函数对象字面量（自动降级为运行期表达式求值）两种形态，成员属性通道同走完整 JS 求值——通道规则与 x-dialog 完全一致（见 [x-dialog · 配置式](../../directives/x-dialog.md#配置式title--icon--actions)）：

```html
<button
  x-popover:user.click
  x-popover-options="{delayShow: 0, title: '用户信息', icon: 'user', closeable: true}"
  x-popover-options.actions="[
    {id: 'edit',  title: '编辑', icon: 'edit',  pos: 'top',    order: 1, handle: () => openEditor()},
    {id: 'share', title: '分享', icon: 'share', pos: 'top',    order: 2, handle: () => openShare()},
    {id: 'remove',title: '移除',                 pos: 'right',           handle: () => removeUser()}
  ]"
>
  查看用户（点击）
</button>
```

要点与 x-dialog 完全一致：`icon` 走 x-icon 域（内置名见 [x-dialog · 配置式](../../directives/x-dialog.md#配置式title--icon--actions)）；`actions` 按 `pos` 归位（top → header 右侧、left → footer 左区、right → footer 右区）；`handle` 在消费处作用域求值（popover 是触发模型、无 visible 写回——动作执行后气泡经面板外点击 / ESC 关闭）；header/footer 有内容才渲染。

#### slots 重载：title / actions / header / footer

配置式无法满足富文本标题、自定义按钮样式等场景时，**宿主子级用 `x-slot:名` 直接重载骨架出口**——内置 shell 声明了插槽通配转发（`slots: "*"`，ADR-0125），chrome 出口名直接可达：

```html
<button
  x-popover:confirm.click
  x-popover-options="{delayShow: 0, closeable: true}"
>
  <!-- 富文本标题 -->
  <template x-slot:title>
    <span class="has-text-danger">⚠️ 二次确认</span>
  </template>

  <!-- footer 右区动作：自定义按钮样式 -->
  <template x-slot:actions.right>
    <button class="button is-danger is-small" @click="close()">确认</button>
  </template>

  二次确认（点击）
</button>
```

chrome 可重载的出口名（与 x-dialog/x-drawer 完全一致，完整表见 [x-dialog · slots 重载](../../directives/x-dialog.md#slots-重载title--actions--header--footer)）：`title`（局部替换，icon/close 保留）、`header`（整块替换，close 失效）、`footer`（整块替换）、`actions.top` / `actions.left` / `actions.right`（点分名）。优先级：slots > 配置式。

::: warning 视觉变化（ADR-0124）
气泡缺省**零骨架 chrome**（`closeable` 缺省 `false` 且无标题/动作 → header 不渲染、无 x，仅 body 内边距 `0.5em`）——`padding: 0` 进一步还原零内边距紧凑气泡；提供标题/顶区动作则 header 渲染，显式 `closeable: true` 在无内容时得右上角浮动 x；自定义 shell 整体替换则完全退出骨架。注意 `padding` 是**双通道键**：显式设置时同时作用于内容区外壳 inline 与骨架 body 区，未声明时 body 走默认 `0.5em`、内容区不写 inline。
:::

### 面板外壳（shell）

面板层形态由可替换的外壳组件渲染：内置 `popover-shell`（裸面板 + 箭头载体，贴附宿主 `bottom` + flip）开箱即用；`x-popover-options.shell` 可整体替换（语法与规则与 x-dialog 完全一致，见 [x-dialog · 面板外壳](./x-dialog.md#面板外壳-shell自定义面板形态) 与 [覆盖物 · 面板外壳](../overlays.md#面板外壳-shell形态可定制)）：

<demo html="popover/shell.html"/>

```html
<!-- 自定义深色气泡：x-slot 默认出口 = 内容组件渲染点；
     箭头 = 契约类名载体（引擎定位），深色视觉经 CSS 变量联动（箭头伪元素读 --autospark-overlay-bg） -->
<div x-define="dark-pop" class="dark-pop">
  <div class="dark-pop-body"><div x-slot></div></div>
  <div class="autospark-overlay-arrow"></div>
</div>

<button x-popover:tip x-popover-options="{delayShow: 0, shell: 'dark-pop'}">悬停</button>
```

悬浮行为（共享 hover 域 / 延迟 / 嵌套链）挂在实例与宿主上，与 shell 无关；`at.arrow: false` 或自定义外壳不放箭头元素时静默无箭头，贴附定位照常。引擎级默认走 `options.overlay.popover.shell`（全站换气泡皮一处配置）。

### 远程加载（url）

远程加载机制为覆盖物家族通用能力（底层与 x-dialog/x-drawer 完全同源），组件**未注册**且配置了 `url` 时，打开走远程路径：面板先开（内容出口内呈现 loading 占位），异步加载完成后原位附加内容。加载语义为**组件优先、片段兜底**的双路径并存——选择哪条完全由远程文件内容决定。

<demo html="popover/remote-component.html"/>
<demo html="popover/remote-template.html"/>

#### 远程组件

远程 HTML 声明了匹配名的 `x-define` 时，引擎按**组件**编译实例化——与本地构建实例完全同权：data / props / 插槽 / 作用域样式 / 方法全部生效，并经 x-import 的 url 缓存注册到消费处 scope，同 url 重开零请求。远程文件中混入的**其他名** `x-define` 会被正常注册但不渲染（编译期剪枝）。

消费处——本地**不声明**组件，url 指向一个**包含同名 `x-define`** 的远程文件：

```html
<button
  x-popover:remote-user.click
  x-popover-options="{url: '/autospark/components/dialog-user.html'}"
  x-popover-options.props="{userId: 42}"
>
  点击打开远程组件 popover
</button>
```

远程文件——声明了匹配消费名的 `x-define`，标准组件模板：

```html
<!-- /autospark/components/dialog-user.html——匹配消费名 x-popover:remote-user -->
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

**数据/参数传递方式**：**只走 `x-popover-options.props`**，组件内部 `data` 隔离于外部 `x-data` 作用域，组件模板内无法直接读取消费处声明的状态（作用域隔离）。

#### 远程模板（片段）

远程 HTML **没有**匹配名的 `x-define` 时，原始 HTML 按**片段**编译进面板（`x-html.compile` 同语义）：可含任意指令、不要求组件声明、插值读消费处状态（响应式）、props 注入响应式数据域（热更新与组件路径同权）。片段里混入的其他名 `x-define` 声明会被正常注册但不渲染（编译期剪枝），片段路径不支持插槽内容投影（声明了插槽标记则 warn 丢弃）。

消费处——本地**不声明**组件，url 指向一个**无 `x-define`** 的纯 HTML 文件：

```html
<!-- x-data 声明在消费处，远程片段共享同一个作用域 -->
<div x-data="{ ui: { open: false, source: '来自消费处的状态' } }">
  <button
    x-popover:remote-note.click
    x-popover-options="{url: '/autospark/components/dialog-note.html'}"
    x-popover-options.props="{topic: '远程片段'}"
  >
    点击打开远程模板 popover
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

**数据/参数传递方式**：**消费处 `x-data` + `x-popover-options.props` 双通道，全部同 scope 共享**。片段模板可直接 `x-text="ui.source"` 读消费处状态，无需显式 props 传入；props 仅用于需要**显式声明并独立于外部**的片段内部状态（例如不同 popover 类型共用一个片段、但需要不同标题）。

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

两条路径共享以下规则（与 x-dialog/x-drawer 完全一致）：

- **本地组件优先于 url**：组件名已可解析（本地声明 / 全局注册）时 url 被忽略——url 只兜底「找不到」的情形；
- **首次打开才加载**（非指令初始化时）；`url` 支持成员表达式（`x-popover-options.url="tplFor(tab)"`）每次打开重求值——url 变 = 新缓存身份 = 重建；
- **失败不自动关**：加载失败（HTTP 非 2xx / 网络错误 / 解析为空）在面板内呈现错误占位——「重试」原位重载（回到加载中形态），「关闭」照常请求关闭；失败实例不进 keepalive 缓存，重开即重建面板重新加载——自然的重试通道。

| 维度           | x-popover                    | x-dialog                     |
| -------------- | ---------------------------- | ---------------------------- |
| 驱动           | 宿主触发：悬浮（默认）/ 点击（值不参与） | 状态 visible（纯状态驱动）   |
| 遮罩           | 无（裸面板 + 箭头）          | 有（模态遮罩 + 居中）        |
| 默认定位       | 贴附宿主（`bottom` + 箭头）  | 屏幕居中（可 `at` 锚定）     |
| 关闭触点       | hover：离开共享域、ESC；click：再点宿主、面板外点击、ESC | ESC、遮罩、close action、状态归假 |
| 状态写回       | 无                           | 简单路径自动回写 `false`     |
| 典型场景       | 悬浮菜单、卡片提示、级联面板、点击菜单 | 确认框、表单弹窗、内容向导   |

需要「触发之外还能程序化开关」时，用状态驱动的 x-dialog + `@mouseenter`/`@click` 改状态组合表达——两个真相源不混在一个指令里。

### 与 tooltip 的区别

tooltip（[工具提示](../tooltip.md)）是**引擎级零声明**能力（`data-tooltip` 属性），popover 是**指令式组件内容浮层**（`x-popover`）——形态相似（都是宿主旁的悬浮提示），定位机制与内容模型完全不同：

| 维度         | x-popover                              | tooltip                              |
| ------------ | -------------------------------------- | ------------------------------------ |
| 声明方式     | `x-popover:组件名`（消费组件）         | `data-tooltip="…"`（零声明，`title` 自动转换） |
| 内容模型     | **任意组件**（props / 插槽 / scope）   | 纯文本或富 HTML（sanitizer 消毒）    |
| 定位         | `at` 锚配置（默认贴宿主 `bottom` + 箭头） | 默认 `top` + flip，无箭头            |
| 尺寸约束     | 可选 `fit`（跟随宿主单轴），否则组件自持 | `70vw × 70vh` + line-clamp 截断      |
| 单例         | 否（各自独立实例）                     | 是（全局单例，同时只显示一个）       |
| 命令式 API   | 无（纯声明）                           | `engine.tooltip.show/hide`           |
| 全局开关     | 无                                     | `options.tooltip: false`             |
| 典型场景     | 悬浮菜单、卡片、级联面板               | 图标/按钮的轻量文字提示              |

轻量文字/HTML 提示用 tooltip（零声明、统一样式）；需要组件内容、嵌套链或自定义外壳时用 popover。

## 配置选项

两级合并链：`内置默认 < x-popover-options（消费处）`；读取经三层链——**成员属性表达式 > 指令选项 > 宿主 `x-options`**（缺失才回退、不合并）。声明形态：整包（`x-popover-options="{...}"`，宽松 JSON）/ 成员属性（`x-popover-options.键="表达式"`，可绑定状态热切换）。

| 配置项 | 默认值 | 修饰符 | 说明 |
| --- | --- | --- | --- |
| `title` | 无 | — | 骨架标题文本（header）；见[结构骨架（chrome）](#结构骨架chrome标题--关闭按钮--动作区) |
| `icon` | 无 | — | 骨架标题左侧图标名（x-icon 域） |
| `closeable` | `false` | — | 显示 close 图标按钮（走请求关闭链）——双形态：header 有内容 → 行内 x，无内容 → 右上角浮动 x；缺省 `false`（紧凑悬浮形态默认无 x），显式 `true` 开启 |
| `actions` | 无 | — | 骨架动作集（数组，按 `pos` 归位、`order` 升序）：`top` → 顶区、`left` → 左区、`right`/`auto`/`bottom`/无 pos → 右区 |
| `trigger` | `'hover'` | `.click` | 触发方式：`'hover'` 悬浮开关 / `'click'` 点击开关；显式 `trigger` 恒优先 > `.click` 修饰符 > 默认 hover；非法值 warn 回退 `'hover'`（见[触发方式](#触发方式)） |
| `delayShow` | `200` | — | 悬浮意图延迟（ms）：移入宿主后延迟打开、计时期间移开取消；`0` 无延迟；仅 hover 生效（click 静默不适用）；非法值 warn 回退默认（见[延迟配置](#延迟配置)） |
| `delayHide` | `150` | — | 关闭宽限（ms）：指针离开「宿主∪面板」共享域后再宽限 `delayHide` 毫秒才关；生效条件同 `delayShow`（仅 hover） |
| `at` | 贴附宿主（`bottom` + 箭头） | — | 定位锚：字符串 / 元素简写（≡ `{selector}`）或 `{selector, placement, offset, shift, flip, arrow}` 对象；显式配置与默认锚**成员级合并**（缺省成员回退宿主 / `bottom`）；`placement` 共 12 方向（见[定位](#定位)） |
| `fit` | `false` | — | 面板尺寸跟随宿主（单轴：左右弹出取高、上下弹出取宽，跟随翻转后最终方向；见[尺寸跟随宿主](#尺寸跟随宿主-fit)） |
| `padding` | `0`（body 区 `'0.5em'`） | — | **双通道键**：内容区外壳 `.autospark-popover-content` inline（`number` 按 px / CSS 长度字符串直写，非法值 warn 回退 `0`）+ 骨架 body 区内边距（显式设置时同步生效；未声明时 body 走默认 `'0.5em'`、内容区不写 inline）；自定义 shell 无该类名内容区静默跳过（见[内容内边距](#内容内边距-padding)与[结构骨架（chrome）](#结构骨架chrome标题--关闭按钮--动作区)） |
| `animate` | `'fade'` | — | 进出场动画（字符串 / 对象 / 分相 / `false`）——覆盖物家族同款三形态 |
| `border` | `true` | — | 面板外壳 1px 边框 + 背景 + 圆角（无锚定也生效；`false` 显式关闭） |
| `shell` | `'popover-shell'` | — | 面板外壳组件名（打开时求值一次，未命中回退内置）；链：指令选项 > 宿主 `x-options` > 引擎级 `options.overlay.popover.shell` > 内置（见[面板外壳](#面板外壳-shell)） |
| `delayClose` | `0` | — | 自动关闭延迟（ms）：`> 0` 时打开后延时走标准关闭链；`0` 不自动关 |
| `dataContext` | 消费处（声明式） | — | 数据视图基准（缺省消费处 / `declarer` 声明处 / `host` 消费处显式声明），挂链即基准；见[覆盖物 · 数据视图基准](../../guide/engine/overlays.md#数据视图基准-datacontext-消费处默认、声明处可选) |
| `props`（成员属性） | 无 | — | `x-popover-options.props` 表达式注入组件 data 域、持续热更新，见[传递 props 与内容](#传递-props-与内容-插槽) |

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项见[指令配置](../../guide/engine/directive/config.md)。
:::

## 注意事项

- 同宿主声明多个 `x-popover:*` 会收到 warn（触发源重合，同一次触发将同时打开全部面板）——多个入口请分散到不同宿主元素。
- 指令值不参与驱动，写了会收到 warn（触发模型无 visible 真相源，见[指令值](#指令值)）。
- `trigger` 非法值（非 `'hover'`/`'click'`）在触发时 warn 并按默认 `'hover'` 处理；修饰符 `.click` 与显式 `trigger` 同写时显式赢。
- 触摸设备 hover 无对应物（点按会以模拟事件触发 mouseenter），触屏场景改用 `trigger: 'click'`（见[触发方式](#触发方式)）。
- 远程锚（`at.selector` 锚向别的元素）距离宿主过远时，指针从宿主到面板的旅程可能超出 `delayHide` 宽限（hover 方式）。
- **家族通用配置**：`keepalive`（关闭挂起保活）/ `key`（保活缓存命名空间）/ `url`（组件未注册时远程加载——**远程组件 vs 远程模板的数据传递差异**见下方）三项为覆盖物家族通用配置，`x-popover-options` 同通道可用，底层机制与 x-dialog/x-drawer 完全一致，语义与消费面见 [x-dialog · 远程加载（url）](./x-dialog.md#远程加载url)（含远程组件 / 远程模板两路径的完整对比表）；`keepalive` 与 `key` 见 [x-dialog · 保活（keepalive）](./x-dialog.md#保活keepalive) 与 [多实例与 key](./x-dialog.md#多实例与-key)。
