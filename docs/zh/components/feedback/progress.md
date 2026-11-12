# Progress 进度条

## 概述

Progress 是 AutoSpark 的官方进度条组件（组件库 P1，feedback 分类，ADR-0018 清单权威表）：**line**（轨道 + 填充，width 百分比过渡）/ **circle**（SVG 圆环，stroke-dashoffset 过渡）双形态，`percent`（0-100 钳制）经 props 单向驱动、`showText` 百分比文本（status 态自动换语义图标）、`status` 语义色联动（success / error / warning——percent>=100 且 status 缺省时自动升 success）、`strokeWidth` 线宽。纯展示组件，无事件。

语义色组织与 alert 同款（`--asc-tone` 中转变量 + 内层 `data-status` 变体属性经 `:has()` 反驱宿主，ADR-0012 基线）；色值全部走 `--auto-*` 语义变量三级回退链（ADR-0129），theme 切换 / 暗色即时跟随。增量动画由 CSS 过渡承担（width / stroke-dashoffset 0.3s），`prefers-reduced-motion: reduce` 下停播（badge 先例同款纪律）。

> **引擎边界提示（SVG 子树）**：编译器的指令扫描只认 HTMLElement，SVGElement 命名空间内的指令属性（`:r` / `x-show` 等）不被编译。circle 圆环的几何（r / stroke-width / dasharray / dashoffset）因此走 mounted JS 通道更新（同一元素 `setAttribute`，CSS 过渡保持有效）；line / circle 形态互斥走 `data-variant` 纯 CSS 显隐分支。

无内置文案、不接 i18n（百分比数字自表述）；字号档位经主题通道 `data-size` 全跟随（circle 直径与 text 行高随 `--auto-font-size` 以 em 缩放）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.progress.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.progress.js"></script>

<div x-component:autospark.progress="{ percent: 30 }"></div>
<div x-component:autospark.progress="{ percent: 75, variant: 'circle' }"></div>
```

<demo html="components/feedback/progress/basic.html"/>

## 指南

### 进度（percent）

**类型**: `number | string`
**默认**: `0`

进度百分比，钳制到 `[0, 100]`：负数归 0、超百归 100、非数字归 0。percent 经 props 注入（指令值通道响应式）——外部状态变化即时重求值，line 填充宽度 / circle dashoffset 由 CSS 过渡呈现增量动画。`aria-valuenow/min/max` 经 mounted JS 通道同步宿主（`role="progressbar"` 可访问性自持）。

### 形态（variant）

**类型**: `"line" | "circle"`
**默认**: `"line"`

- **line**：轨道 + 填充横条（轨道高 = strokeWidth，填充 `width` 百分比过渡；轨道圆角容器防窄段溢出）；
- **circle**：SVG 圆环（viewBox 100 基准，r 内缩 strokeWidth/2 防截边；`stroke-dashoffset` 过渡；起点转正上方）。circle 直径默认 `7.5rem`，经 `--asc-progress-size` 变量覆盖。

### 状态语义色（status）

**类型**: `"success" | "error" | "warning" | ""`
**默认**: `""`（自动）

三档语义色联动（对齐 `--auto-success-color` / `--auto-danger-color` / `--auto-warning-color`；`error` 档取 danger 语义色——「错误/失败进度」语义）。**status 缺省时 percent>=100 自动升 success**（antd 同款「完成后自动成功」），显式指定始终优先。status 态的文本位自动换语义图标（success / error / warn，经 engine 内置 x-icon）。

### 文本（showText）

**类型**: `boolean`
**默认**: `true`

百分比文本：line 态在条右侧（小一号、次要色）、circle 态绝对居中于环心；status 态换语义图标（色随 tone）。`false` 关闭文本位。

### 线宽（strokeWidth）

**类型**: `number | string`
**默认**: `6`

line 态 = 轨道高度（px）；circle 态 = 圆环粗细（viewBox 单位）。number 归一 px（circle 取数值参与几何计算）；字符串形态 line 态原样作 CSS 长度、circle 态取数值。经 `--asc-progress-sw` 变量 `:style` 内联下发 body。

### 主题化

语义色走 `--auto-*` 语义变量（theme 在场自动换肤）；字号档位经主题通道 `data-size` 全跟随；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-progress-*`（如 `--asc-progress-success` 某档语义色、`--asc-progress-size` circle 直径、`--asc-progress-track` 轨道色、`--asc-progress-radius`）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| percent | `number \| string` | `0` | 进度百分比（0-100 钳制；>=100 且 status 缺省自动升 success） |
| variant | `"line" \| "circle"` | `"line"` | 形态：line 轨道条 / circle 圆环 |
| status | `"success" \| "error" \| "warning" \| ""` | `""` | 状态语义色（缺省 = percent>=100 自动 success；文本位换语义图标） |
| showText | `boolean` | `true` | 百分比文本（line 条右 / circle 环心；status 态换图标） |
| strokeWidth | `number \| string` | `6` | 线宽：line 轨道高度 / circle 圆环粗细 |

### 事件

无（纯展示组件——进度由外部状态单向驱动）。

### Slots

无。
