# Timeline 时间线

## 概述

Timeline 是 AutoSpark 的官方时间线组件（组件库 P2 / display 分类，ADR-0018 清单权威表 display 行）：垂直时间线——`items` 数据数组（`{ content, time?, icon?, type?, hollow? }[]`）经内层 x-for 渲染，每项 = 轴线段（末项隐藏）+ 节点（语义色圆点 / 空心 / 自定义图标）+ 内容区（time 弱化行 + content 正文行）+ `mode` 标签侧（left 缺省 / alternate 奇偶交错 / right 右侧）。纯展示无事件。

**双形态数据源**（breadcrumb 同款范式）：① `items` 状态引用注入（动态数据，字面量数组死环规避恒走引用）；② 子元素声明 `<x-timeline-item time icon type hollow>`（静态时间线，precompile 折叠为 `data-items` 标量通道，content 取子元素文本）。

**轻件边界（按简取舍，ADR 声明）**：time 与 content 同侧渲染（antd alternate 模式 time 居对侧的形态不做）；无 pending 加载态、无自定义轴线段折叠——此类增强后续按需增补。

引入方式：引擎之后加载 `<script src="/autospark/autospark.timeline.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。无跨插件依赖（icon 节点经引擎内置 x-icon，无须额外引入）。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.timeline.js"></script>

<x-timeline :items="steps"></x-timeline>
```

```js
// items 须状态引用注入——字面量数组触发 props 更新死环（引擎已知缺陷规避）
new AutoSpark(el, {
  steps: [
    { content: "订单已提交", time: "2026-11-12 20:31", type: "primary" },
    { content: "支付成功", time: "2026-11-12 20:35", type: "success" },
    { content: "已签收", type: "danger" },
  ],
});
```

<demo html="components/display/timeline/basic.html"/>

## 指南

### 数据源（items，双形态）

**类型**: `Array<{ content, time?, icon?, type?, hollow? }>`
**默认**: `[]`

动态数据经状态**引用**注入。**变更通道**：整体替换（`state.steps = [...]`）驱动重渲；原地增删（`push`/`splice`）不经组件域，不触发重渲。

静态时间线直接写子元素声明形态（content 取子元素文本）：

```html
<x-timeline>
  <x-timeline-item time="09:00" type="primary">创建项目</x-timeline-item>
  <x-timeline-item time="16:00">发布上线</x-timeline-item>
</x-timeline>
```

裸 `items` 属性（JSON 字符串）与 `:items` 状态绑定亦可（后者恒优先）。

### 节点变体（type / hollow / icon）

**类型**: `type: "primary" | "success" | "warning" | "danger" | "default"`，默认 `"default"`

- `type`：节点圆点语义色（default 中性灰取边框色）；
- `hollow: true`：空心节点（面板底 + 语义色描边）；
- `icon`：自定义节点（x-icon 值通道——图标替代圆点，色随 type 语义色）。

### 标签侧（mode）

**类型**: `"left" | "alternate" | "right"`
**默认**: `"left"`

`alternate` 奇偶交错（轴居中）；`right` 内容在轴左（left 的镜像）。支持运行时切换（状态绑定驱动）。

### 时间行（time）

**类型**: `string`
**默认**: 无（不渲染）

弱化色时间行（content 上方）；与 content 同侧（alternate 模式不做对侧形态，见概述轻件边界）。

### 主题化

节点语义色走 `--auto-primary-color` / `--auto-success-color` / `--auto-warning-color` / `--auto-danger-color`（`--asc-dot` 中转，tag 同款范式）、轴线 `--auto-border-color`、正文 `--auto-color`、time `--auto-third-color`（三级回退链，ADR-0129）；间距以 em 标定随 `data-size` 档位缩放；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-timeline-*`（如 `--asc-timeline-primary`、`--asc-timeline-line`、`--asc-timeline-font-size`）。

<demo html="components/display/timeline/modes.html"/>

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| items | `Array<{ content, time?, icon?, type?, hollow? }>` | `[]` | 数据源（状态引用注入；变更整体替换驱动；子元素声明形态经 data-items 通道） |
| mode | `"left" \| "alternate" \| "right"` | `"left"` | 标签侧（alternate 奇偶交错 / right 右侧镜像） |
| type（项级） | `"primary" \| "success" \| "warning" \| "danger" \| "default"` | `"default"` | 节点语义色 |
| hollow（项级） | `boolean` | `false` | 空心节点（面板底 + 语义色描边） |
| icon（项级） | `string` | 无 | 自定义节点图标名（x-icon 值通道） |
| time（项级） | `string` | 无 | 时间行（弱化色；缺省不渲染） |

### 事件

无内建事件（纯展示）。

### Slots

无插槽——项内容纯文本渲染；富内容以调用方模板自组时间线结构。
