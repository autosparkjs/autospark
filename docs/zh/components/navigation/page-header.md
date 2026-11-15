# PageHeader 页头

## 概述

PageHeader 是 AutoSpark 的官方页头组件（组件库 P2 导航件，ADR-0018 清单权威表 navigation 行）：title / subtitle 标题对 + back 返回钮 + extra（右侧动作区）/ 默认（内容区）双插槽的**纯结构件**。

back 三态：`false`（缺省）不渲染 / `true` 图标钮（无文案，aria-label 以标题自描述）/ 文案字符串 = 图标 + 文案。点击派发 **back 冒泡事件**——组件不执行 `history.back()`（router 隔离，ADR-0018 决策 6 约定 2，接管动作由消费者 `@back` 决定）。

无 i18n 文案（返回钮缺省图标无字，零内置文案）。返回钮为自绘轻量图标钮（不嵌套消费 autospark.button——保按需加载自包含）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.page-header.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.page-header.js"></script>


<div @back="router.back()">
  <x-page-header title="订单详情" subtitle="单号 #1024" back="返回列表">
    <p>页面内容写在默认插槽（内容区），空则不占位。</p>
  </x-page-header>
</div>
```

`class` / `style` / `id` 与 `data-*` / `x-*` / `@` 前缀属性保留给宿主。

<demo html="components/navigation/page-header/basic.html"/>

## 指南

### 标题对（title / subtitle）

**title 类型**: `string`，**默认** `""`
**subtitle 类型**: `string`，**默认** `""`

页面主标题（随字号档位相对放大）与副标题（次要色，空不渲染）。两者均受控单向（props 变化随动）。

### 返回钮（back）

**类型**: `boolean | string`
**默认**: `false`

`false` 缺省不渲染；`true` 渲染纯图标钮（无文案，aria-label 以标题自描述——零内置文案的可访问性标注通道）；文案字符串渲染「图标 + 文案」（aria-label 取文案）。点击派发 `back` 冒泡事件（detail 空）——接管动作由消费者决定：

```html

<div @back="history.back()">…</div>
<div @back="router.back()">…</div>
<div @back="router.push('/list')">…</div>
```

### 插槽（extra / 默认）

- **extra**：命名插槽，投影到头行右缘动作区（按钮组、状态标签等）；未提供时不占位（`:empty` 隐藏）。
- **默认**：内容区插槽，投影到头行下方；未提供时不占位（`:empty` 隐藏）。

```html
<x-page-header title="组件总览" back="true">
  <template x-slot:extra>
    <button type="button">刷新</button>
    <button type="button">导出</button>
  </template>
  <p>extra 投影到头行右缘；本段为默认插槽内容区。</p>
</x-page-header>
```

### 事件

| 事件 | 形态 | 说明 |
| --- | --- | --- |
| back | 冒泡，detail 空 | 返回钮点击（接管动作由消费者 `@back` 决定，组件零副作用） |

### 主题化

字号档位：任意祖先容器挂 `data-size`（theme 手动通道，经 autospark.base 继承）；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-page-header-*`（如 `--asc-page-header-title-color`、`--asc-page-header-subtitle`、`--asc-page-header-border`、`--asc-page-header-hover-bg`）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| title | `string` | `""` | 页面主标题 |
| subtitle | `string` | `""` | 副标题（空不渲染） |
| back | `boolean \| string` | `false` | 返回钮：false 不渲染 / true 图标钮 / 文案字符串 = 图标 + 文案 |

### 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| back | — | 返回钮点击冒泡（组件不执行 history.back） |

### Slots

| 插槽 | 说明 |
| --- | --- |
| extra | 头行右缘动作区（空不占位） |
| 默认 | 内容区（头行下方，空不占位） |
