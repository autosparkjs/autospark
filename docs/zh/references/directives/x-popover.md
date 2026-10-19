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

### 与 x-dialog 的取舍

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
| `trigger` | `'hover'` | `.click` | 触发方式：`'hover'` 悬浮开关 / `'click'` 点击开关；显式 `trigger` 恒优先 > `.click` 修饰符 > 默认 hover；非法值 warn 回退 `'hover'`（见[触发方式](#触发方式)） |
| `delayShow` | `200` | — | 悬浮意图延迟（ms）：移入宿主后延迟打开、计时期间移开取消；`0` 无延迟；仅 hover 生效（click 静默不适用）；非法值 warn 回退默认（见[延迟配置](#延迟配置)） |
| `delayHide` | `150` | — | 关闭宽限（ms）：指针离开「宿主∪面板」共享域后再宽限 `delayHide` 毫秒才关；生效条件同 `delayShow`（仅 hover） |
| `at` | 贴附宿主（`bottom` + 箭头） | — | 定位锚：字符串 / 元素简写（≡ `{selector}`）或 `{selector, placement, offset, shift, flip, arrow}` 对象；显式配置与默认锚**成员级合并**（缺省成员回退宿主 / `bottom`）；`placement` 共 12 方向（见[定位](#定位)） |
| `fit` | `false` | — | 面板尺寸跟随宿主（单轴：左右弹出取高、上下弹出取宽，跟随翻转后最终方向；见[尺寸跟随宿主](#尺寸跟随宿主-fit)） |
| `padding` | `0` | — | shell 内容区 `.autospark-popover-content` 内边距：`number` 按 px / CSS 长度字符串直写；非法值 warn 回退 `0`；自定义 shell 无该类名内容区静默跳过（见[内容内边距](#内容内边距-padding)） |
| `animate` | `'fade'` | — | 进出场动画（字符串 / 对象 / 分相 / `false`）——覆盖物家族同款三形态 |
| `border` | `true` | — | 面板外壳 1px 边框 + 背景 + 圆角（无锚定也生效；`false` 显式关闭） |
| `shell` | `'popover-shell'` | — | 面板外壳组件名（打开时求值一次，未命中回退内置）；链：指令选项 > 宿主 `x-options` > 引擎级 `options.overlay.popover.shell` > 内置（见[面板外壳](#面板外壳-shell)） |
| `delayClose` | `0` | — | 自动关闭延迟（ms）：`> 0` 时打开后延时走标准关闭链；`0` 不自动关 |
| `dataContext` | `'declarer'` | — | 数据视图基准（`declarer` 声明处 / `host` 消费处），挂链即基准；见[覆盖物 · 数据视图基准](../../guide/engine/overlays.md#数据视图基准-datacontext-声明处默认、消费处可选) |
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
- **家族通用配置**：`keepalive`（关闭挂起保活）/ `key`（保活缓存命名空间）/ `url`（组件未注册时远程加载）为覆盖物家族通用配置，`x-popover-options` 同通道可用——语义与消费面见 [x-dialog · 保活 / key / url](./x-dialog.md#保活keepalive)。
