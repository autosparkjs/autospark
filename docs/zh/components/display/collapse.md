# Collapse 折叠面板

## 概述

Collapse 是 AutoSpark 的官方折叠面板组组件（组件库 P2 展示件，ADR-0018 清单权威表 display 行 / 决策 3 裁定入清单：x-foldable 单面板 + 「组 + 互斥手风琴」增量）：面板元信息双形态（items 数据 / `<x-collapse-item>` 子元素声明）+ 展开 key 集受控（`value` 数组 + `el.value` 桥 + `change` 事件 `detail = { value }`）+ 手风琴互斥（`accordion`：同时仅一开）+ 展开图标位置（`expandIconPosition`：start / end）。

面板开合自实现 CSS 高度过渡（`grid-template-rows: 0fr → 1fr`，DOM 恒保留——表单输入态/滚动位不丢）。**与 x-foldable 指令的边界**：x-foldable 是 nowrap flex 容器的**行内溢出折叠**结构指令（空间不足把溢出子元素收进 more 弹出面板，ADR-0098），与本件「内容面板垂直展开」语义不同构（无受控 value 集、无互斥手风琴、弹出面板非原地展开）——故不组合、自实现，取舍声明见 P2 合批 ADR。

引入方式：引擎之后加载 `<script src="/autospark/autospark.collapse.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.collapse.js"></script>

<!-- 子元素声明形态：子内容即面板内容（绑定可用） -->
<x-collapse>
  <x-collapse-item key="a" title="产品介绍">面板内容 A</x-collapse-item>
  <x-collapse-item key="b" title="计费说明">面板内容 B</x-collapse-item>
</x-collapse>
```

<demo html="components/display/collapse/basic.html"/>

## 指南

### 面板声明（items / 子元素）双形态

**类型**: `Array<{ key, title, disabled?, content? }>` / 子元素声明

两形态共享同一 value / 事件 / 手风琴语义：

- **items 数据形态**（状态引用注入）：服务端数据直驱；`content` 为 HTML 字符串经 x-html 渲染（适合富文本片段）；动态增删走**数组整体替换**（原地 `push` 不换引用、不重渲染）；
- **子元素声明形态**：`<x-collapse-item key title disabled>` 子元素即面板**模板内容**（消费者作用域编译——绑定 / 指令照常工作），经 precompile 变换展开为面板结构。

> **注入提示**：items 恒经**状态引用**注入（`items: panels`）——值对象内的字面量数组 props 存在无限更新缺陷（ADR-0019 规避清单第 1 条）。静态声明走子元素形态；裸 `items='[...]'` JSON 字符串属性经 data-items 通道兜底。

<demo html="components/display/collapse/items.html"/>

### 展开 key 集（value）与值通道

**类型**: `Array<string>`
**默认**: `[]`

受控多选集（展开的面板 key 数组）：

- **props 单向驱动**：`:value="open"` 变化即时迁移开合态（数组整体替换）；
- **头部点击**：写组件内部状态 + 双派发——`input`（非冒泡，x-model 监听回写）+ `change`（冒泡，`detail = { value }`，value 为切换后的新 key 数组）；
- **el.value 桥**：读 = key 数组快照；写 = 数组 / 逗号（空格）分隔字符串归一。

开合态经组件 mounted 的同步通道写到每个面板容器的 `data-open` 属性与各头部的 `aria-expanded`，CSS 据此驱动高度过渡与图标旋转。

### 手风琴互斥（accordion）

**类型**: `boolean`
**默认**: `false`

`accordion` 开启后同时仅一开：展开新面板自动关闭已开面板（change 携单元素数组）。

### 展开图标位置（expandIconPosition）

**类型**: `start | end`
**默认**: `end`

展开图标（内置 arrow，闭 = 右向、开 = 旋转 90° 朝下）随头部布局对调位置：`end` 标题右（缺省）/ `start` 标题左。

### 面板内容与开合动画

内容体为 `grid-template-rows: 0fr → 1fr` 高度过渡（约 250ms，`prefers-reduced-motion` 停播）；DOM 恒保留（非 `x-if` 摘挂语义）——折叠面板内的表单输入态、滚动位置在开合间不丢。

### 事件

| 事件 | 形态 | 说明 |
| --- | --- | --- |
| change | 冒泡，`detail = { value }` | 开合集变化（头部点击时派发；props 驱动变化不广播防回环） |
| input | 非冒泡 | x-model 回写通道（同 change 时机） |

### 主题化

字号档位：任意祖先容器挂 `data-size`（theme 手动通道，经 autospark.base 继承）；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-collapse-*`（如 `--asc-collapse-border-color`、`--asc-collapse-bg`、`--asc-collapse-hover-bg`）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| value | `Array<string>` | `[]` | 展开 key 集受控（分隔字符串归一；el.value 桥） |
| items | `Array<{ key, title, disabled?, content? }>` | `[]` | 数据形态面板集（状态引用；content HTML 字符串） |
| accordion | `boolean` | `false` | 手风琴互斥（同时仅一开） |
| expandIconPosition | `start \| end` | `end` | 展开图标位置 |

### 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| change | `detail: { value }` | 开合集变化冒泡（value = 新 key 数组） |
| input | — | x-model 回写通道（非冒泡） |

### Slots

| 插槽 | 说明 |
| --- | --- |
| 默认 | 子元素声明形态的面板结构投影位（数据形态时不使用） |
