# Descriptions 描述列表

## 概述

Descriptions 是 AutoSpark 的官方描述列表组件（组件库 P2 / display 分类，ADR-0018 清单权威表 display 行）：键值对网格展示——`items` 数据数组（`{ label, value, span? }[]`）经内层 x-for 渲染 + `columns` 每行列数 + `span` 跨项位 + `bordered` 边框表格形态（gap 间隙显线 + label 格灰底）+ `layout` 标签排布（horizontal 缺省 / vertical 标签在上）+ `title` 标题。纯展示无事件。

**双形态数据源**（breadcrumb 同款范式）：① `items` 状态引用注入（动态数据，字面量数组死环规避恒走引用）；② 子元素声明 `<x-descriptions-item label span>`（静态描述，precompile 折叠为 `data-items` 标量通道）。纯文本 value——富内容（tag/link 等）建议以调用方模板自组网格，或等待后续按需增补。

引入方式：引擎之后加载 `<script src="/autospark/autospark.descriptions.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。无跨插件依赖。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.descriptions.js"></script>

<x-descriptions title="订单信息" :items="rows"></x-descriptions>
```

```js
// items 须状态引用注入——字面量数组触发 props 更新死环（引擎已知缺陷规避）
new AutoSpark(el, {
  rows: [
    { label: "订单号", value: "ORD-001" },
    { label: "收货地址", value: "上海市静安区某某路 88 号", span: 2 },
  ],
});
```

<demo html="components/display/descriptions/basic.html"/>

## 指南

### 数据源（items，双形态）

**类型**: `Array<{ label, value, span? }>`
**默认**: `[]`

动态数据经状态**引用**注入（`{ items: rows }` 指令值在调用方作用域求值）。**变更通道**：整体替换（`state.rows = [...]`）驱动重渲；对原数组的原地增删（`push`/`splice`）不经组件域（autostore 路径驱动响应式的跨域边界），不触发重渲。

静态描述直接写子元素声明形态（precompile 折叠为 items，value 取子元素文本）：

```html
<x-descriptions columns="2" title="包信息">
  <x-descriptions-item label="版本">2.4.0</x-descriptions-item>
  <x-descriptions-item label="运行时">零依赖 engine</x-descriptions-item>
</x-descriptions>
```

裸 `items` 属性（JSON 字符串）与 `:items` 状态绑定亦可（后者恒优先，声明形态被忽略）。

### 列数与跨项位（columns / span）

**类型**: `number`，columns 默认 `3` / span 默认 `1`

`columns` 每行列数（项位）；项级 `span` 跨项位（如 3 列布局中 `span: 3` 即整行）。列数网格经 JS 通道写容器 `grid-template-columns`，支持运行时变化（状态绑定驱动）。

### 边框表格形态（bordered）

**类型**: `boolean`
**默认**: `false`

`true` 切换为表格形态：容器 gap 1px 间隙显线（任意 span 布局单线不双线）+ 外框收口 + label 格灰底（`--auto-secondary-bgcolor`）。缺省简洁形态：`label：value` 横排（中文冒号引导）、行间留白。

### 标签排布（layout）

**类型**: `"horizontal" | "vertical"`
**默认**: `"horizontal"`

`vertical` 标签在上（简洁与 bordered 双形态共用）；缺省 horizontal 标签值同行。

### 标题（title）

**类型**: `string`
**默认**: `""`

标题行（字重加粗）；空值整行不占位。

### 主题化

文本走 `--auto-color` / `--auto-secondary-color`、bordered 格底 `--auto-bgcolor` / label 格 `--auto-secondary-bgcolor`、线色 `--auto-border-color`（三级回退链，ADR-0129）；字号/内距以 em 标定随 `data-size` 档位缩放；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-descriptions-*`（如 `--asc-descriptions-label-color`、`--asc-descriptions-border-color`、`--asc-descriptions-radius`）。

<demo html="components/display/descriptions/variants.html"/>

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| items | `Array<{ label, value, span? }>` | `[]` | 数据源（状态引用注入；变更整体替换驱动；子元素声明形态经 data-items 通道） |
| columns | `number` | `3` | 每行列数（项位） |
| span（项级） | `number` | `1` | 跨项位（span: 3 即整行） |
| bordered | `boolean` | `false` | 边框表格形态（gap 间隙显线 + label 格灰底） |
| layout | `"horizontal" \| "vertical"` | `"horizontal"` | 标签排布（vertical 标签在上） |
| title | `string` | `""` | 标题（空值不占位） |

### 事件

无内建事件（纯展示）。

### Slots

无插槽——项值纯文本渲染；富内容以调用方模板自组。
