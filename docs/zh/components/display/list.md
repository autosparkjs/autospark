# List 列表

## 概述

List 是 AutoSpark 的官方列表容器组件（组件库 P1 / display 分类，ADR-0018 清单权威表 display 行）：`items` 数据数组经内层 x-for 渲染 + `row` 作用域插槽自定义行（`{ item, $index }` 形参）+ 空态兜底（复用 `autospark.empty` 组件组合消费，`empty` 插槽可整体重载）+ `loading` 覆盖层（引擎 x-loading 组合）+ `bordered` / `split`（行间分隔线）+ `virtual` 虚拟滚动（x-for.virtual 组合 features/virtual 插件）。

**与 x-for 指令的边界**：x-for 是引擎渲染指令（全权自定义——项模板、`:key`、`$index/$end` 等派生变量全部暴露）；list 是带空态/加载态/虚拟滚动/边框分隔的**开箱容器**——内部装配 x-for，对外收敛 props（ADR-0018 决策 2「内部装配、对外开箱」）。裸渲染需求直接用 x-for，开箱列表用 list。

引入方式：引擎之后加载 `<script src="/autospark/autospark.list.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

**跨插件依赖**（按需加载须同页引入；聚合产物无此问题）：`autospark.empty.js`（空态兜底组合）；`virtual: true` 时另需 `autospark.virtual.js`（缺位时 warn 退化全量渲染，降级不失效）。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.empty.js"></script>
<script src="autospark.list.js"></script>

<x-list :items="users"></x-list>
```

```js
// items 须状态引用注入——字面量数组触发 props 更新死环（引擎已知缺陷规避）
new AutoSpark(el, { users: [{ label: "张三" }, { label: "李四" }] });
```

<demo html="components/display/list/basic.html"/>

## 指南

### 数据源（items）

**类型**: `Array`
**默认**: `[]`

列表数据，经状态**引用**注入（`{ items: users }` 指令值在调用方作用域求值）。默认行按 `label` / `title` / `name` / `value` 四键依次探测渲染文本 + 标量直出；对象数组建议用 `row` 插槽自定义行。

**变更通道**：整体替换（`state.users = [...]`）驱动重渲；对原数组的**原地**增删（`push`/`splice`）经全局路径发信号、不经组件域（autostore 路径驱动响应式的跨域边界），不触发重渲——列表变更请整体替换。

### 自定义行（row 插槽，作用域插槽）

行模板经 `row` 插槽整体自定义，形参 `{ item, $index }` 解构消费（内容在调用方作用域求值——可读调用方状态、可挂行内事件）：

```html
<x-list :items="users">
  <template x-slot:row="{ item, $index }">
    <b x-text="item.name"></b>
    <span x-text="'#' + ($index + 1)"></span>
    <span style="cursor: pointer" @click="picked = item.name">选TA</span>
  </template>
</x-list>
```

事件出口经**行元素原生冒泡**：`@click` 等直接写在行模板内容上（调用方作用域求值），组件零内建事件。

<demo html="components/display/list/slots.html"/>

### 空态（empty 插槽 / autospark.empty 组合）

`items` 为空数组时渲染空态段：默认组合 `autospark.empty` 组件（描述文案走其 i18n 通道，缺省「暂无数据」）；`empty` 插槽可整体重载：

```html
<x-list :items="users">
  <template x-slot:empty><div>一条都没有</div></template>
</x-list>
```

### 加载态（loading）

**类型**: `boolean`
**默认**: `false`

`true` 时列表覆盖加载层（引擎 x-loading 组合，铺满列表容器）。配合异步数据源：`loading: busy` 状态驱动。

### 边框与分隔线（bordered / split）

**类型**: `boolean`，默认 `true` / `true`

`bordered: false` 边框转透明色（占位稳定不跳变）；`split: false` 摘除行间分隔线（相邻行 border-top，末行/首行天然无线）。

### 虚拟滚动（virtual）

**类型**: `boolean`
**默认**: `false`

`true` 启用长列表虚拟滚动（x-for.virtual 组合 features/virtual 策略）：只渲染可见窗口 + overscan 缓冲，万级数据不卡。滚动容器为定高（`--asc-list-virtual-height` 缺省 20em 可覆盖）；行等高假设由 CSS 行高保证。**须同页引入 `autospark.virtual.js`**——缺位时 warn 退化全量渲染（降级不失效）。

### 主题化

底色/边框走 `--auto-bgcolor` / `--auto-border-color`、行文本 `--auto-color`（三级回退链，ADR-0129）；字号/行距以 em 基准随 `data-size` 档位缩放；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-list-*`（如 `--asc-list-bg` 底色、`--asc-list-radius` 圆角、`--asc-list-virtual-height` 虚拟容器高度）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| items | `Array` | `[]` | 数据源（状态引用注入；变更整体替换驱动） |
| virtual | `boolean` | `false` | 虚拟滚动（须同页引入 autospark.virtual.js） |
| loading | `boolean` | `false` | 加载覆盖层（引擎 x-loading 组合） |
| bordered | `boolean` | `true` | 边框开关（false 转透明色） |
| split | `boolean` | `true` | 行间分隔线开关 |

### 事件

无内建事件——行内交互经行元素原生冒泡（`@click` 写在 row 插槽内容上）。

### Slots

| 插槽 | 形参 | 说明 |
| --- | --- | --- |
| row | `{ item, $index }` | 行模板（缺省时四键探测默认行） |
| empty | — | 空态整体重载（缺省组合 autospark.empty） |
