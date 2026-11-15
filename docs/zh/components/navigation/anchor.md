# Anchor 锚点导航

## 概述

Anchor 是 AutoSpark 的官方锚点导航组件（组件库 P3 导航轻件，ADR-0018 清单权威表 navigation 行 / ADR-0029）：items 数据驱动侧边文字列表，**scroll 监听实时高亮当前锚**（`getBoundingClientRect` 判定线语义），点击平滑滚动到对应区块。

核心语义：

- **判定线高亮**：锚顶越过「offset 线」即视为当前区块，items 序最后一个越线项激活；全未达线（页顶）不高亮——antd 缺省语义；
- **纯滚动语义（router 隔离）**：点击 `preventDefault` 拦原生 hash 瞬跳 + 平滑滚动（不写 hash、不 import router——ADR-0018 决策 6 约定 2，router 联动以配方交付）；
- **监听清理**：scroll/resize 监听挂全局 window，组件拆卸（unmounted）自动摘除（grid 的 matchMedia 先例）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.anchor.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.anchor.js"></script>

<!-- affix 固定侧栏：滚动联动高亮 + 点击平滑滚动（change 外层一行回写） -->
<div @change="cur = $event.detail.key">
  <x-anchor affix :items="secs"></x-anchor>
</div>

<!-- 锚目标区块：id = 项 key（href 缺省 key 作锚 id #key） -->
<section id="intro">...</section>
<section id="usage">...</section>
```

```js
new AutoSpark(el, {
  cur: "",
  secs: [
    { key: "intro", label: "概述" },
    { key: "usage", label: "用法" },
    { key: "api", label: "API 参考" },
  ],
});
```

静态属性直写（`affix` / `offset`）、响应式数据走 `:items` 绑定——元素名写法经 precompile DOM 变换折叠为 props 注入（宿主替换为真 `nav`，地标语义保真）。

<demo html="components/navigation/anchor/basic.html"/>

## 指南

### 锚点项（items）

**类型**: `Array<{ key: string, label: string, href?: string }>`
**默认**: `[]`

`key` 为项标识（当前锚语域）；`label` 为列表文案；`href` 为锚目标（缺省 `#key` 即 `id = key` 的区块；`#id` 走 id 查找，其余形态按任意 CSS 选择器解析——目标缺席的项静默跳过）。

> **注入提示**：items 恒经**状态引用**注入（`:items="secs"`，`secs` 为页面状态）——当前引擎版本对值对象内的**字面量**数组 props 存在无限更新缺陷。静态锚点请用子元素声明形态（或裸 `items='[...]'` JSON 字符串属性，precompile 变换分流到 `data-items` 通道）。动态增删须**数组整体替换**（原地 `push` 不换引用、不重渲染）。

### 子元素声明（`<x-anchor-item>`）

静态锚点路径的快捷写法：`key` / `label` / `href` 三个标量属性，由 precompile DOM 变换折叠为 items JSON 落宿主 `data-items` 属性，组件 mounted 解析渲染；声明元素本身从 DOM 摘除。`:items` 状态引用在场时恒优先。

<demo html="components/navigation/anchor/variants.html"/>

### 判定线（offset）

**类型**: `number`
**默认**: `0`

滚动高亮判定线：锚顶（`getBoundingClientRect().top`）越过「offset 线」即视为当前区块。页面顶部有固定吸顶条时用 offset 抵消其高度；判定线同时作用于**滚动高亮**与**点击滚动目标**（锚顶停靠位置 = 判定线）。

### 固定侧栏（affix）

**类型**: `boolean`
**默认**: `false`

`affix`（裸属性写法 `<x-anchor affix>`）时锚点列表 fixed 定位右缘悬浮，随视口固定；缺省为内容流内联形态（嵌在文档版式中）。悬浮位置经 `--asc-anchor-affix-top` / `--asc-anchor-affix-right` / `--asc-anchor-affix-z` 覆盖通道定制。

### 当前锚高亮（scroll 监听）

滚动位置变化（scroll/resize）实时重算当前锚并迁移激活态（`data-active` + `aria-current`）；全未达线（页顶）时清空高亮。激活/悬停色与 tabs 激活**同源**：`--asc-tone` 主色中转 + 左墨线点亮 + 字重提升，文字色链一致。

### 事件

| 事件 | 形态 | 说明 |
| --- | --- | --- |
| change | 冒泡，`detail = { key }` | 当前锚变化（滚动联动 / 点击驱动；清空也是变化，key 为空串；同值短路不重复派发） |

```html
<!-- 外层 @change 回写（事件绑定写在包裹元素——化身封闭域求值约定） -->
<div @change="cur = $event.detail.key">
  <x-anchor affix :items="secs"></x-anchor>
</div>
```

点击行为：`preventDefault` 拦原生 hash 瞬跳 → `window.scrollTo` 平滑滚动（reduced-motion 环境瞬时归位）→ 即时高亮迁移 + change 派发（平滑滚动途中 scroll 事件逐步接管校正）。

### 主题化

字号档位：任意祖先容器挂 `data-size`（theme 手动通道，经 autospark.base 继承）；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-anchor-*`（如 `--asc-anchor-primary`、`--asc-anchor-link-color`、`--asc-anchor-ink`、`--asc-anchor-affix-right`）。

### 写法对照

元素名写法与值对象写法等价（后者为引擎底层通道，元素名写法由 precompile 变换自动折叠）：

```html
<!-- 元素名写法（推荐） -->
<x-anchor affix :items="secs" offset="72"></x-anchor>

<!-- 值对象写法（底层通道） -->
<nav x-component:autospark.anchor="{ items: secs, offset: 72, affix: true }"></nav>
```

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| items | `Array<{ key, label, href? }>` | `[]` | 锚点项（状态引用注入；href 缺省 #key） |
| offset | `number` | `0` | 滚动判定线偏移（px，吸顶导航高度补偿） |
| affix | `boolean` | `false` | 固定侧栏形态（fixed 右缘悬浮） |
| current | `string` | `""` | 当前锚 key（内部维护，scroll 判定为权威源——初始一跳即校正） |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| change | `detail: { key }` | 当前锚变化冒泡（外层一行回写惯用法） |

### Slots

| 插槽 | 说明 |
|---|---|
| 无 | 锚点列表由 items 驱动自渲染，无插槽面 |
