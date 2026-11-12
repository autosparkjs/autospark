# Skeleton 骨架屏

## 概述

Skeleton 是 AutoSpark 的官方骨架屏组件（组件库 P1，feedback 分类，ADR-0018 清单权威表）：`variant` 三形态（text 行块 / circle 圆 / rect 矩形块）、`rows` 多行 text（末行半宽收尾）、`loading` **插槽切换**（true 骨架 / false 渲染默认插槽真实内容——核心用法）、`animated` 闪烁开关。

闪烁动画为渐变扫过（antd 同款观感，淡底双色由 `--auto-color` 经 color-mix 单源派生）；`prefers-reduced-motion: reduce` 下恒停播（badge 先例同款纪律），`animated: false` 逐实例关闭。骨架块组 `aria-hidden`（纯装饰无语义）。

**与 x-loading 指令的边界**：x-loading 是 action 通道的**就近消费**（行为指令——按钮/动作执行期间自动呈现 loading 遮罩或占位）；skeleton 是**静态结构占位**（数据未到时的骨架结构，`loading` props 手动驱动、插槽切换骨架/真容）。动作级反馈用 x-loading，数据级占位用 skeleton，两者正交可同用。

**插槽切换的运行态保留**：插槽投影在编译期完成、显隐走 `x-show`（不摘 DOM 不重建）——真容内的运行态（输入焦点、滚动位置）在 loading 往返间保留，切回零重建成本。

无内置文案、不接 i18n（骨架无文案）；块尺寸以 em 为基准随主题通道 `data-size` 档位缩放。

引入方式：引擎之后加载 `<script src="/autospark/autospark.skeleton.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.skeleton.js"></script>

<!-- 骨架态（缺省 loading: true） -->
<div x-component:autospark.skeleton="{ rows: 3 }"></div>

<!-- 核心用法：loading 插槽切换骨架/真容 -->
<div x-component:autospark.skeleton="{ loading: fetching, rows: 3 }">
  <h3>订单 #1024</h3>
  <p>已支付 ¥299.00，预计 3 个工作日内送达。</p>
</div>
```

<demo html="components/feedback/skeleton/basic.html"/>

## 指南

### 形态（variant）

**类型**: `"text" | "circle" | "rect"`
**默认**: `"text"`

- **text**：行块（高 1em 满宽，行距 0.6em）——段落/标题占位；
- **circle**：正圆（直径 2.5em）——头像/图标位占位；
- **rect**：大块（高 5em 满宽，圆角取主题值）——媒体/封面/卡片位占位。

### 行数（rows）

**类型**: `number`
**默认**: `1`

text 形态的行数（钳正整数：0 / 缺省 / 非法值归 1）；**末行 60% 半宽收尾**（多行段落的观感惯例）。circle / rect 恒单块（多行无语义，rows 不放大）。

### 加载态（loading）

**类型**: `boolean`
**默认**: `true`

核心用法——`true` 显示骨架块组、`false` 渲染默认插槽真实内容，两者互斥显隐（`x-show` 通道，不摘 DOM 不重建）。典型接线：`loading: fetching`（外部请求状态驱动），数据到达时骨架换真容原位呈现。

### 动画（animated）

**类型**: `boolean`
**默认**: `true`

闪烁动画开关：渐变扫过（1.4s 循环，淡底双色由 `--auto-color` 经 color-mix 派生——theme 切换/暗色自动跟随）。`false` 静态淡底；`prefers-reduced-motion: reduce` 下恒停播（无中间帧）。

### 主题化

淡底双色走 `--auto-color` 单源派生（三级回退链 `--asc-skeleton-color` 覆盖通道）；块尺寸以 em 为基准随 `data-size` 档位缩放；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-skeleton-*`（如 `--asc-skeleton-color` 派生源色、`--asc-skeleton-radius` 圆角）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| variant | `"text" \| "circle" \| "rect"` | `"text"` | 骨架块形态 |
| rows | `number` | `1` | text 形态行数（末行半宽；circle/rect 恒单块） |
| loading | `boolean` | `true` | true 骨架态 / false 渲染默认插槽真实内容（插槽切换） |
| animated | `boolean` | `true` | 闪烁动画开关（prefers-reduced-motion 恒停播） |

### 事件

无（纯结构占位组件——loading 由外部状态单向驱动）。

### Slots

| 插槽 | 说明 |
| --- | --- |
| 默认 | 真实内容（loading=false 时呈现；可含任意指令，响应消费处状态） |
