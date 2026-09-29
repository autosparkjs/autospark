# x-drawer 贴边抽屉

## 概述

`x-drawer` 是覆盖物消费者的**贴边抽屉形态**：把**任意组件**渲染成从屏幕四边或某元素边缘滑入滑出的抽屉面板（侧边栏、过滤器、设置面板）。它与 x-dialog 同基座、同 visible 驱动模型（组件即内容 / 查找 / props / 插槽 / scope 基准，见[覆盖物](../overlays.md)与[x-dialog](./x-dialog.md)），形态差异在**定位与视觉**：默认贴屏幕边滑入、`at.selector` 可锚定到任意元素边缘（长轴沿锚边展开），默认动画为方向性滑入滑出（ADR-0063），默认带抽屉把手（见「抽屉把手」）。

```html
<button x-drawer:sidebar="ui.sidebarOpen">菜单</button>
```

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

面板默认直角（贴边形态语言）、带边框与投影（继承 `.autospark-dialog` 外壳视觉，配色变量同 [覆盖物](../overlays.md)），内容超高自动滚动。

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

`resize` 选项启用面板拖拽调节（复用 [x-resize](./x-resize.md) 核心，ADR-0064）：方向按贴边形态**自动推导**——左/右抽屉的内侧竖边（`placement: left` → `e`，类推）、上/下抽屉的内侧横边；`handles` 只能在合法集内收窄。约束字段与 x-resize 选项同构；尺寸**会话内记忆**（重开沿用拖出宽度、**优先于声明 `size`**）；数据不写回 store，`@resize:end` 事件 detail 即出口（事件派发在指令宿主上）：

<demo html="resize/drawer.html"/>

```html
<button
  x-drawer:sidebar="ui.open"
  x-drawer-options="{resize: {minWidth: 240, maxWidth: 640}, size: 360}"
  @resize:end="ui.width = $event.detail.width"
></button>
```

### 抽屉把手（trigger）

抽屉**默认带**一个常驻的圆形把手（`24px`、`1px solid`，视觉继承面板边框/背景配色）：骑在面板**活动边线**上（圆心一半在面板内一半在外），点击即折叠/展开。**折叠 ≡ visible 归假**——没有第三态：折叠就是面板滑出销毁（重开内容重建，overlay 家族「每次打开新实例」既有语义），把手是常驻的打开触发器：

<demo html="drawer/trigger.html"/>

**位置坐标**：把手沿边线**滑轨**的位置由 `trigger` 坐标控制，默认居中——左右抽屉是垂直位置（把手 `top`）、上下抽屉是水平位置（把手 `left`），由 placement 决定。取值为**边缘锚定模型**（正值距主边、负值距对面边的绝对距离）：

| 取值 | 行为 |
|---|---|
| `true`（默认） | 居中（语法糖 ≡ `'50%'`） |
| `false` | 不建把手 |
| `number` | px 坐标，距**主边**（top/left）：`100` = 距顶/左 100px |
| `string` | CSS 长度：`'20%'`（滑轨长的百分比）/ `'100px'` / `'2rem'`，纯数字字符串按 px |

**负数 = 距对面边的绝对距离**：`trigger: "-20%"` = 把手显示在距底边（右抽屉）20% 处。越界值静默**钳制到滑轨内**（把手是唯一的重开触发点，永可达、不会滑出可视范围）：

```html
<button x-drawer:sidebar="ui.open">默认带把手（居中）</button>
<button x-drawer:sidebar="ui.open" x-drawer-options="{trigger: false}">无把手</button>
<button x-drawer:sidebar="ui.open" x-drawer-options="{trigger: '-20%'}">把手靠下（距底 20%）</button>
<button x-drawer:sidebar="sidebar" x-drawer-options.trigger="ui.pos">坐标响应式</button>
```

- 坐标支持**成员属性表达式响应式**（`x-drawer-options.trigger="ui.pos"`，值变化即时重定位，折叠态同样生效）；
- 折叠后把手骑**屏幕边**（屏幕模式）或**锚内侧边**（锚定模式）只露一半（面板展开侧半圆保留）；展开↔折叠时把手沿边线**同步滑移**（与面板同曲线），视觉连续；
- 箭头指向「下一步动作」：展开态指折叠方向、折叠态翻转指展开方向；**展开态无阴影**（视觉属于面板）、**折叠态保留阴影**（独立浮起提示可点）；
- 把手生命周期挂**消费者**（每指令一把、多实例独立），宿主销毁 / engine 销毁时摘除——面板销毁后它仍在；
- 字面量 / 表达式形态**不建把手**（visible 状态不可写回，点击无意义）；
- 尺寸/配色可调：CSS 变量 `--autospark-drawer-trigger-size`（默认 `24px`）+ 面板配色变量（`--autospark-overlay-border` / `--autospark-overlay-bg`）；
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

### 面板外壳（shell）

面板层是可替换组件（[ADR-0062](https://github.com/autosparkjs/autospark/blob/main/packages/engine/docs/adr/0062-overlay-shell.md)）：内置默认为 **`drawer-shell`**（直角、无箭头载体），可用自家组件整体替换——`x-drawer-options="{shell: 'my-shell'}"` 或引擎级 `options.overlay.drawer.shell` 全站换肤。短轴尺寸（`size` inline）与贴边定位契约（placement 属性）不依赖 shell 类名，自定义 shell 照常生效；直角等默认视觉不带 `.autospark-drawer` 类则不继承（完全自由）。完整规则见 [x-dialog · 面板外壳](./x-dialog.md#面板外壳shell自定义面板形态)。

### 进出场动画

默认动画为内置 **`'drawer'`**：遮罩淡入淡出 + 面板位移滑入滑出（`translate ±100%`，主流 drawer 形态语言：面板整体平移、内容不变形、纯合成零 reflow），滑入方向自动跟随最终 placement。与家族一致的 `animate` 三形态可改可关：

```html
<button x-drawer:panel="ui.open" x-drawer-options="{animate: 'fade'}">改用淡入淡出</button>
<button x-drawer:panel="ui.open" x-drawer-options="{animate: false}">关闭动画</button>
```

自定义动画（六类名契约）与时长/缓动配置见 [x-dialog · 进出场动画](./x-dialog.md#进出场动画)。

### 配置

| 键 | 默认 | 说明 |
|---|---|---|
| `at` | 无（屏幕贴边） | 字符串 / 元素简写 / `{selector, placement, flip, offset, shift}`；`selector` 命中即锚定模式 |
| `at.placement` | `'right'` | 四主方向（展开起始边）；`auto`/后缀/非法值一律静默归一为 `right` |
| `at.flip` | — | 内侧展开模型下静默忽略（保留键位仅向后兼容） |
| `size` | `280px` | 短轴尺寸（方向中立）：number 按 px / CSS 长度字符串；引擎 inline 写入，未配置回退 `--autospark-drawer-size` 变量 |
| `resize` | 无（不可调） | 面板拖拽调节：`true` / 选项对象（方向自动推导为贴边内侧单边，`handles` 只能收窄；会话内记忆优先于 `size`；详见[拖拽调宽](#拖拽调宽resize)） |
| `mask` | `true` | 模态遮罩显隐；`false` = 裸面板贴边（无外点关闭） |
| `closeOnMask` | `true` | 点遮罩请求关闭（无遮罩时静默无效） |
| `animate` | `'drawer'` | 进出场动画；显式配置整键尊重 |
| `trigger` | `true` | 抽屉把手：骑活动边线的常驻圆形按钮（折叠 ≡ visible 归假）；坐标沿边线滑轨——`true` 居中 / `false` 关闭 / number(px) 与 CSS 长度定位，负数距对面边、越界钳制；字面量/表达式形态不建（详见[抽屉把手](#抽屉把手trigger)） |
| `shell` | `drawer-shell` | 面板外壳组件名（配置链：成员表达式 > 引擎级 `options.overlay.drawer.shell` > 内置） |
| `border` | `true` | 面板 1px 边框（外壳承担） |
| `delayClose` | `0` | 打开后自动关闭延迟（ms） |
| `dataContext` | `'declarer'` | 数据视图基准（同 x-dialog） |
| `props`（成员属性） | 无 | `x-drawer-options.props` 表达式注入组件 data 域，持续热更新 |

## 注意事项

- **visible 是唯一真相源**：ESC / 遮罩 / close action 都会回写 `false`（简单路径形态）；表达式形态关闭后依赖变化重求值仍真会**重开**（家族已知边界，[x-dialog · 请求关闭](./x-dialog.md#请求关闭)）。
- **锚定长轴 = 锚边长**：锚元素高度超过视口时抽屉随之超出（不钳制）——需要视口内滚动请让锚元素自身限制高度。
- **`mask: false` 没有外点关闭**：outside-click 关闭（dismissable layer）是家族 fast-follow，未实现——无遮罩抽屉请保证状态可归假或提供 close action。
- **自定义 shell 自担视觉**：替换 shell 后直角等默认视觉不再生效（不带 `.autospark-drawer` 类时）；`size` inline 与贴边定位不受影响。
