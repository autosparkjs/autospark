# Space 间距

## 概述

Space 是 AutoSpark 的官方间距容器组件（组件库 P0 轻件 / layout 分类，ADR-0019）：为子元素之间提供统一间距——间距档位（`size`）、排列方向（`direction`）、交叉轴对齐（`align`）、换行（`wrap`）。**纯样式容器**，子元素正常编译（插槽内容照常走宿主引擎编译）；页面骨架窗格分割请用 layout 指令族的 `x-layout`（彼是页面结构指令，此是成组内容的间距编排，ADR-0018 清单表边界）。

间距档位走 CSS 变量档（`--x-spacing-*` 标尺五档，medium 档经 `--auto-spacing` 联动 theme spacing 档位）；组件零色彩消费，暗色模式下无需变体。

引入方式：引擎之后加载 `<script src="/autospark/autospark.space.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.space.js"></script>

<div x-component:autospark.space="{}">              <!-- 水平排列，medium 间距（缺省） -->
  <button>按钮一</button>
  <button>按钮二</button>
  <button>按钮三</button>
</div>
<x-space direction="vertical" size="small"></x-space>  <!-- 等价元素名写法 -->
```

<demo html="components/layout/space/basic.html"/>

## 指南

### 间距（size）

**类型**: `number | string | [number | string, number | string]`
**默认**: `"medium"`

四种形态：

- **档位名**：`x-small | small | medium | large | x-large`——CSS 变量档（`--x-spacing-*` 标尺五档），`medium` 档经 `--auto-spacing` 接通 theme spacing 档位（容器 `data-spacing` 全局调节生效）；
- **number**：归一为 px（`size: 24` 即 24px）；
- **CSS 值字符串**：原样透传（`size: "1.5em"`）；
- **两轴数组** `[水平, 垂直]`（antd 序），第二项缺省同第一项——wrap 换行时行距即垂直轴。

> 嵌套数组字面量（`size: [12, 24]`）需 engine 修复版本（props 等值比较死环修复）起可用；此前经状态引用传入：`x-data="{ g: [12, 24] }"` + `size: g`。

使用者覆盖通道：`--asc-space-gap`（一变量压全档）。

### 排列方向（direction）

**类型**: `horizontal | vertical`
**默认**: `horizontal`

水平（缺省，flex 行）/ 垂直（flex 列）。`align` 的交叉轴随方向自动换轴（horizontal 时是垂直对齐、vertical 时是水平对齐）。

<demo html="components/layout/space/direction.html"/>

### 交叉轴对齐（align）

**类型**: `start | center | end | baseline`
**默认**: `center`（horizontal）/ 起缘（vertical）

显式声明覆盖方向缺省（horizontal 缺省居中、vertical 缺省左缘——antd 观感）。`baseline` 适合混排不同字号文本的基线对齐。

### 换行（wrap）

**类型**: `boolean`
**默认**: `false`

horizontal 态子项总宽超出容器时换行（`flex-wrap: wrap`）；行距 = 垂直轴间距（`size` 两轴数组的第二项）。vertical 态无换行语义（恒单列）。

### 主题化

间距档位直取 `--x-spacing-*` 标尺（medium 档联动 `--auto-spacing`）；组件不消费任何色彩变量，暗色模式天然无感。使用者覆盖通道 `--asc-space-*`（如 `--asc-space-gap` 间距）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| size | `number \| string \| [h, v]` | `"medium"` | 间距：档位名 / px 数值 / CSS 值 / [水平, 垂直] 两轴 |
| direction | `horizontal \| vertical` | `horizontal` | 排列方向 |
| align | `start \| center \| end \| baseline` | `center` | 交叉轴对齐（随方向换轴；vertical 缺省起缘） |
| wrap | `boolean` | `false` | 换行（horizontal 态，行距=垂直轴间距） |

### 事件

无（纯样式容器）。

### Slots

| 插槽 | 说明 |
| --- | --- |
| 默认 | 间距编排的子元素（正常编译；穿透出口成为 flex 直接子项） |
