# 悬浮弹层（x-popover）

## 概述

`x-popover` 是覆盖物消费者的**悬浮形态**：把**任意组件**渲染成贴附在触发元素旁的轻量浮层（无遮罩、带箭头），显示由**宿主悬浮**触发——鼠标移入宿主显示、指针离开「宿主∪面板」区域后关闭。它与 x-dialog 同基座、同消费模型（组件即内容 / 查找 / props / 插槽 / scope 基准，见[覆盖物](../overlays.md)），唯一形态差异是**触发模型**：宿主不再是纯声明点，而是悬浮触发器，指令值不参与驱动（ADR-0060）。

```html
<button x-popover:tip>悬停查看提示</button>
```

## 快速入门

<demo html="popover/basic.html"/>

`x-popover:tip`——组件名走 attr（与 `x-dialog:login` 同一载体约定）；显示与关闭完全由悬浮驱动，不需要（也不读取）指令值。

## 指南

### 触发模型

- **显示**：`mouseenter` 触发（悬浮意图语义，不是字面 `mouseover`——后者会在宿主子元素间移动时反复触发）。经过 `delayShow` 悬浮意图延迟后打开；计时期间移开则取消（快速掠过不误触发）。
- **关闭**：指针离开「宿主∪面板」**共享 hover 域**后，经 `delayHide` 关闭宽限关闭；宽限期内回到域内则取消。按 `ESC` 也可关闭（与 x-dialog 共用全局打开栈，只关栈顶）。
- **无状态写回**：悬浮模型没有 visible 真相源，关闭即 UI 关闭，不回写任何状态。写了指令值会收到 warn（值不参与驱动）。

::: warning 触觉设备
悬浮交互在触摸屏上没有对应物（点按会以模拟事件触发 mouseenter）。触摸适配（点按开关、外点关闭）不在 v1 范围——触屏场景请改用 `x-dialog` 状态驱动。
:::

### 延迟配置

`delayShow`（默认 `200`）与 `delayHide`（默认 `150`）均为毫秒，`0` 表示无延迟：

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

同宿主声明多个 `x-popover:*` 会收到 warn（悬浮驱动源重合，hover 将同时打开全部面板）——多个入口请分散到不同宿主元素。

### 定位

默认锚 = **宿主元素自身**、`placement` 默认 `'bottom'`（空间不足自动翻转，箭头默认显示）。`x-popover-options.at` 显式配置时与默认锚做**成员级合并**——用户写出的成员生效，缺省成员回退（`selector` 回退宿主、`placement` 回退 `bottom`），因此只写方向的 `at: {placement: 'right-start'}` 同样贴附宿主生效；**换锚只改显示位置，不改变触发关系**（触发器恒为宿主、共享 hover 域恒为「宿主∪面板」）：

<demo html="popover/anchor.html"/>

```html
<!-- 右侧弹出（只写方向：selector 缺省回退宿主） -->
<button x-popover:tip x-popover-options="{at: {placement: 'right-start'}}">悬停</button>

<!-- 锚向别的元素（注意：锚距离宿主过远时，指针从宿主到面板的旅程可能超出 delayHide 宽限） -->
<button x-popover:tip x-popover-options="{at: '/#navbar-logo'}">悬停</button>
```

`at` 键的完整语义（相对查询语法 / flip / offset / shift / arrow / 边框配色变量）见[覆盖物 · 定位锚点](../overlays.md)。

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

### 面板外壳（shell）

面板层形态由可替换的外壳组件渲染：内置 `popover-shell`（裸面板 + 箭头载体，贴附宿主 `bottom` + flip）开箱即用；`x-popover-options.shell` 可整体替换（语法与规则与 x-dialog 完全一致，见 [x-dialog · 面板外壳](./x-dialog.md#面板外壳shell自定义面板形态) 与 [覆盖物 · 面板外壳](../overlays.md#面板外壳shell形态可定制)）：

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

## 与 x-dialog 的取舍

| 维度           | x-popover                    | x-dialog                     |
| -------------- | ---------------------------- | ---------------------------- |
| 驱动           | 宿主悬浮（值不参与）         | 状态 visible（纯状态驱动）   |
| 遮罩           | 无（裸面板 + 箭头）          | 有（模态遮罩 + 居中）        |
| 默认定位       | 贴附宿主（`bottom` + 箭头）  | 屏幕居中（可 `at` 锚定）     |
| 关闭触点       | 离开共享域、ESC              | ESC、遮罩、close action、状态归假 |
| 状态写回       | 无                           | 简单路径自动回写 `false`     |
| 典型场景       | 悬浮菜单、卡片提示、级联面板 | 确认框、表单弹窗、内容向导   |

需要「悬浮之外还能程序化开关」时，用状态驱动的 x-dialog + `@mouseenter` 改状态组合表达——两个真相源不混在一个指令里。
