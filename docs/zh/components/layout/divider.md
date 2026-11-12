# Divider 分割线

## 概述

Divider 是 AutoSpark 的官方分割线组件（组件库 P0 轻件 / **layout 分类首件**，ADR-0019）：水平（缺省）/ 垂直（`vertical`）、虚线（`dashed`）、带文字位置（`align`）、间距（`spacing`）。**纯装饰性分隔**——可拖拽分栏请用 layout 指令族的 `x-splitter`（彼是布局结构指令，此是视觉分割线，ADR-0018 清单表边界）。

线色取 `--auto-border-color` 语义变量（三级回退链，ADR-0129），theme 切换 / 暗色即时跟随；带文字与纯线共用同一结构（空插槽时两段线自然连成整线）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.divider.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.divider.js"></script>

<div x-component:autospark.divider="{}"></div>            <!-- 水平实线 -->
<div x-component:autospark.divider="{}">分隔标题</div>     <!-- 带文字（默认插槽） -->
<x-divider vertical="true" spacing="8"></x-divider>       <!-- 等价元素名写法 -->
```

<demo html="components/layout/divider/basic.html"/>

## 指南

### 垂直分割线（vertical）

**类型**: `boolean`
**默认**: `false`

垂直态呈行内元素（`vertical-align: middle`），默认高度 `0.9em`（`--asc-divider-length` 变量可覆盖；flex 容器内满高由容器样式控制，如 `align-self: stretch` + 自定高度）。**垂直态不支持文字**——插槽内容被忽略不渲染（对齐 antd 5 边界，垂直分割线为纯分隔场景）。`spacing` 随方向自动换轴（垂直态写左右 margin）。

### 虚线（dashed）

**类型**: `boolean`
**默认**: `false`

线型切换（`border-style: dashed`），水平 / 垂直态均支持，与带文字自由组合。

<demo html="components/layout/divider/vertical.html"/>

### 文字位置（align）

**类型**: `left | center | right`
**默认**: `center`

带文字时文字在分割线上的水平位置（仅水平态有意义）：`center` 居中（缺省，两侧线对称满铺）、`left` 文字靠左（首段短线）、`right` 文字靠右（尾段短线）。文字即默认插槽内容。

### 间距（spacing）

**类型**: `number | string`
**默认**: `""`（无边距）

与相邻内容的间距：`number` 归一为 px；任意 CSS 值（如 `"0.5em"`）原样透传。水平态写**上下 margin**、垂直态写**左右 margin**（方向切换自动换轴）。缺省无边距——成组间距编排交给布局容器 / 即将交付的 space 组件（ADR-0018 P0 清单）。

### 主题化

线色走 `--auto-border-color`（theme 边框语义变量）；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-divider-*`（如 `--asc-divider-color` 线色、`--asc-divider-length` 垂直高度、`--asc-divider-text-color` 文字色）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| vertical | `boolean` | `false` | 垂直分割线（文字不渲染） |
| dashed | `boolean` | `false` | 虚线 |
| align | `left \| center \| right` | `center` | 带文字时文字位置（水平态） |
| spacing | `number \| string` | `""` | 间距（水平=上下 / 垂直=左右，缺省无边距） |

### 事件

无（纯装饰性组件）。

### Slots

| 插槽 | 说明 |
| --- | --- |
| 默认 | 嵌线文字（空插槽时两段线连成整线；垂直态不渲染） |
