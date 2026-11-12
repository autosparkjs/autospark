# Grid 栅格

## 概述

Grid 是 AutoSpark 的官方栅格容器组件（组件库 P0 轻件 / layout 分类，ADR-0019）：通用等分栅格布局——列数（`cols`：固定 / 自适应 / 响应式档位）、间隙（`gap`）、轨道水平分布（`justify`）、项块轴对齐（`align`）。与 engine layout 七指令（`x-layout` / `x-pane` 管页面骨架窗格分割）**互补不重叠**——彼是页面结构级窗格编排，此是通用内容栅格（卡片列表、表单行、缩略图墙等），ADR-0018 清单表边界。

响应式档位名对齐 viewport 六档（`xs..xxl`），断点自持（Bootstrap 5 min-width），经 matchMedia 探测——不依赖 `x-viewport` 指令；组件零色彩消费，暗色模式下无需变体。

引入方式：引擎之后加载 `<script src="/autospark/autospark.grid.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.grid.js"></script>

<div x-component:autospark.grid="{ cols: 3, gap: 'medium' }">   <!-- 固定 3 列 -->
  <div>卡片一</div>
  <div>卡片二</div>
  <div>卡片三</div>
</div>
<x-grid cols="auto" gap="small"></x-grid>                       <!-- 等价元素名写法：自适应列 -->
```

<demo html="components/layout/grid/basic.html"/>

## 指南

### 列数（cols）

**类型**: `number | "auto" | { xs?, sm?, md?, lg?, xl?, xxl? }`
**默认**: `3`

三种形态：

- **number**：固定列数（归一正整数），轨道 `repeat(n, minmax(0, 1fr))` 等分——`minmax(0, 1fr)` 钳制子项 `min-width: auto` 撑破轨道的陷阱（长文本/媒体不换行时轨道不被顶开）；
- **`"auto"`**：自适应列——`auto-fill` 按容器宽自动列数，最小列宽 `--asc-grid-min`（缺省 16rem，可覆盖）；
- **响应式档位对象**：按视口断点声明列数（如 `{ xs: 1, sm: 2, md: 3, lg: 4 }`），取当前最高命中档的列数；全未命中（窄视口）回退 `xs ?? 1`。断点 Bootstrap 5 min-width：`sm` 576 / `md` 768 / `lg` 992 / `xl` 1200 / `xxl` 1400（`xs` 无阈值 = 基础档）；窗口跨断点时列数自动重算（matchMedia 监听）。

> 嵌套对象字面量（`cols: { xs: 1 }`）需 engine 修复版本（props 等值比较死环修复）起可用；此前经状态引用传入：`x-data="{ c: { xs: 1, md: 4 } }"` + `cols: c`。

使用者覆盖通道：`--asc-grid-cols`（列数，亦可在祖先元素声明定制缺省）。

### 间隙（gap）

**类型**: `number | string | [number | string, number | string]`
**默认**: `0`

与 [Space 的 size](./space.md) 同构四种形态：档位名（`x-small | small | medium | large | x-large` CSS 变量档，medium 联动 `--auto-spacing`）/ number px / CSS 值字符串 / `[水平, 垂直]` 两轴数组。缺省 0（CSS 原生栅格语义，显式声明才生效）。使用者覆盖通道 `--asc-grid-gap`。

<demo html="components/layout/grid/responsive.html"/>

### 轨道水平分布（justify）

**类型**: `start | center | end | between | around | evenly`
**默认**: `start`

grid 轨道整体的水平分布（映射 `justify-content` 的 start/center/end/space-between/space-around/space-evenly）——**列宽不满容器时有效**（如 `cols: "auto"` 的定宽最小列、窄项）；等分 `1fr` 轨道恒满宽无感。

### 项块轴对齐（align）

**类型**: `stretch | start | center | end | baseline`
**默认**: `stretch`

子项在轨道内的块轴（垂直）对齐（映射 `align-items`）；缺省 `stretch` 随轨道拉伸（卡片行等高）。

### 主题化

间隙档位直取 `--x-spacing-*` 标尺（medium 档联动 `--auto-spacing`）；组件不消费任何色彩变量，暗色模式天然无感。使用者覆盖通道 `--asc-grid-*`（如 `--asc-grid-gap` 间隙、`--asc-grid-min` 自适应最小列宽）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| cols | `number \| "auto" \| 对象` | `3` | 列数：固定 / auto-fill 自适应 / 视口断点档位对象 |
| gap | `number \| string \| [h, v]` | `0` | 间隙：档位名 / px 数值 / CSS 值 / 两轴数组 |
| justify | `start \| center \| end \| between \| around \| evenly` | `start` | 轨道水平分布（列不满宽时有效） |
| align | `stretch \| start \| center \| end \| baseline` | `stretch` | 项的块轴对齐 |

### 事件

无（纯样式容器）。

### Slots

| 插槽 | 说明 |
| --- | --- |
| 默认 | 栅格排布的子元素（正常编译；穿透出口成为 grid 直接子项） |
