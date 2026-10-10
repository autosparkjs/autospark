# x-block 布局条

## 概述

行内三段条状布局指令（[ADR-0098](https://github.com/zhangfisher/autospark/blob/main/packages/engine/docs/adr/0098-x-block.md)）：宿主 `x-block` 的直接子元素用 `x-block:参数` 声明**分区**（词表 `header | body | footer`）——body 恒为弹性区、header/footer 随容器压缩，容器 flex 等高、分区内容交叉轴居中。分区被压缩溢出时**渐进折入弹出面板**（先 footer 后 header，body 永不收缩），面板 hover 展开、内容跨开关保留。

与 [x-layout](./x-layout.md) 分工：x-layout 管整页 Grid 骨架，x-block 管行内三段条（工具栏、卡片头、表单行）。

<demo html="block/basic.html"/>

## 快速入门

```html
<div x-block="row" x-block-options="{ gap: 8 }">
  <div x-block:header>头部</div>
  <div x-block:body>主体——吸收剩余空间</div>
  <div x-block:footer>尾部</div>
</div>
```

分区书写顺序不限，引擎按语义序渲染（header → body → footer）。body 必需（缺失静默空渲染），header/footer 可选。

<demo html="block/basic.html"/>

## 指南

### 指令值

值为 **`row | column` 表达式**，支持状态驱动换轴（响应式重排，[x-splitter](./x-splitter.md) 同款）：

```html
<div x-block="dir"><!-- 状态 dir: 'row' | 'column' --></div>
```

非 `"column"` 的一切值静默归一 `row`（不 warn）。

分区标记 `x-block:header|body|footer` 是参数化属性（[x-pane](./x-layout.md) 同构）：

- 必须是 x-block 的**直接子元素**，深层或无 x-block 祖先的标记无效（warn）；
- **不要**写成 `x-slot:header`——那是[组件插槽](./x-slot.md)语法，会被组件机制 warn + 丢弃；
- 词表外参数（如 `x-block:aside`）warn + 元素照常编译（无分区契约）；
- 重复声明同一分区：首个生效 + warn；未标记的渲染子元素 warn + 丢弃（`<template>`/`<script>` 静默容忍）；
- 分区子树照常编译——自身指令、嵌套 x-block / x-splitter / 任意指令零新机制；分区上声明 `x-if` / `x-show` 合法，存在性变化自动触发溢出重估。

### 三段布局语义

容器 `display:flex` + `align-items:stretch`（**分区等高**），各分区内部 `align-items:center`（内容交叉轴居中）；三段 `white-space:nowrap` 不换行。column 时 `flex-direction:column`，gap 作用于纵向间距。

`align` 选项控制 **body 的主轴对齐**，值域 `start | center | end`（默认 `start`）——轴无关逻辑值：row 下 start=左 / end=右，column 下 start=上 / end=下，换轴随 flex 语义自然翻转。写 `left` / `right` 等旧值 warn + 忽略。

`gap` / `padding` / `align` 均编译期静态——变更需 `engine.patch` 重编。

<demo html="block/basic.html"/>

### 溢出折叠（响应式收缩）

分区被压缩溢出即**渐进收缩**，收缩次序由 body 下限驱动（`bodyMinSize`，默认 120px）：容器缩小时 body 优先吸收（`flex-grow:1`）、压到下限后退出收缩——继续缩小，header/footer 才开始被压缩，分区自身溢出（`scrollWidth > clientWidth`，ResizeObserver 监测）即折入面板：footer 溢出先收 **footer**、header 溢出再收 **header**，**body 永不收缩**（body 溢出交容器 `overflow:hidden` 裁切，机制终态——需要内滚时用户 CSS 自行加 `overflow:auto`）。

收缩动作：**整个分区元素搬入弹出面板**（用户对分区的 class / padding 等样式在面板内原样生效，分区外观由开发者自行控制）+ 原位放引擎占位壳（承载触发按钮——footer = **more**、header = **menu**）+ 挂 `x-block-collapsed` 类（供用户 CSS 断言）。空间恢复时反向展开（分区元素原位替换占位壳、header 先回、footer 后回；试展后自身仍溢出则静默回滚）。

<demo html="block/overflow.html"/>

### 弹出面板（x-popover 接管）

分区收缩后由**预置触发按钮**上的 [x-popover](./x-popover.md)（ADR-0060 悬浮模型）全权接管开关 / 定位 / 动画 / 外壳——开关延迟（`delayShow` / `delayHide`）等选项经 `x-block-options` 透传生效。面板载体是内置组件 **`block-popover`**（与 popover shell 同模板同视觉，点自由名——声明式 attr 经修饰符语法解析无法承载点前缀名），同名遮蔽定制照常。

- **锚定方位**：row 轴 header = `bottom-start`、footer = `bottom-end`（面板对齐按钮起/止端）；column 轴对称翻转为 `right-start` / `right-end`，换轴自动热更；
- **hover 触发**：悬停按钮开面板、离开宽限关闭、移入面板取消关闭（互移不闪关）；
- **键盘通道**：按钮可聚焦，Enter / Space 开合，Escape 关闭；
- **内容常驻**：折叠期间整个分区元素常驻指令持有的容器——面板开/关只搬显隐，**控件状态跨开关保留**（输入框文字不丢）；分区在面板内的外观（padding / 背景 / 排列）由开发者的分区 CSS 原样生效；

<demo html="block/overflow.html"/>

## 配置选项

**宿主级 `x-block-options`**：

| 配置项    | 默认值   | 修饰符 | 说明                                                                                     |
| --------- | -------- | ------ | ---------------------------------------------------------------------------------------- |
| `gap`     | `0`      | —      | 相邻分区间距。number 按 px；string 原样作 CSS `gap` 值。非法值 warn + 忽略                  |
| `padding` | `0`      | —      | 容器内边距（作用于三段共同的外框）。number 按 px；string 原样。非法值 warn + 忽略           |
| `align`   | `start`  | —      | body 主轴对齐，`start` / `center` / `end`（轴无关逻辑值，随轴翻转）。非法值 warn + 忽略     |
| `bodyMinSize` | `120px` | —   | body 收缩下限（row 为宽、column 为高）：容器缩小时 body 优先吸收、压到下限后退出收缩，剩余压缩量全部落在 header/footer。number 按 px / 单值 CSS 长度串。非法值 warn + 回退默认 |
| `overflow`| `true`   | —      | 布尔。`false` 整体禁用溢出折叠（溢出直接由容器 `overflow:hidden` 裁切，不注入按钮/面板）   |
| `delayShow` | `200`  | —      | 弹出面板打开延迟（ms），透传给触发按钮的 [x-popover](./x-popover.md) 选项                   |
| `delayHide` | `150`  | —      | 弹出面板关闭宽限（ms），透传给触发按钮的 x-popover 选项                                     |
| `headerPlacement` | 按轴推导 | —  | header 弹出面板方位（floating-ui 值：`top/bottom/left/right` ± `-start/-end`）。显式配置 = 用户权威、不随轴翻转；未配置 row 下 `bottom-start`、column 下 `right-start`。非法值 warn + 回退推导 |
| `footerPlacement` | 按轴推导 | —  | footer 弹出面板方位。未配置 row 下 `bottom-end`、column 下 `right-end`，其余同上             |

## 注意事项

- **`engine.patch` 拒绝落入 x-block 子树**：x-block 是 ownsChildren 结构指令（同 x-for / eager x-if / x-layout），patch 命中即拒绝——动态内容请在分区内部用常规指令表达。
- **`x-block-collapsed` 是 class 不是属性**：收缩态标识同时挂在原位占位壳与面板内的分区元素上，用户 CSS 以 `.x-block-collapsed` 断言；占位壳不隐藏（触发按钮留守原位）。
- **溢出检测依赖真实布局**：容器需要确定的宽度约束（如 `width`、父级 flex 约束）；无约束的自由伸展永远不会溢出、机制不会触发。
- **触发按钮图标走全局 sprite**（`#as-more` / `#as-menu`）：同名内置图标可被 [x-icons](./x-icons.md) 注册覆盖。
- **视觉定制经 CSS 变量**：`--autospark-block-trigger-size`（按钮尺寸，默认 24px）、`--autospark-block-trigger-focus`（聚焦轮廓色）、`--autospark-block-align`（body 主轴对齐，由 `align` 选项写入）。
- **`x-block` 名与历史词条无关**：旧「布局块」（组件机制前身）已由 x-define / x-component 承接，两者无承继关系（见 [ADR-0098](https://github.com/zhangfisher/autospark/blob/main/packages/engine/docs/adr/0098-x-block.md) 决策一）。
