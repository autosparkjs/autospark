# Affix 固钉

## 概述

Affix 是 AutoSpark 的官方固钉组件（组件库 P4 other 件，ADR-0018 清单权威表 other 行 / ADR-0030 affix 与 watermark 轻件对 ADR）：滚动过 `offset` 阈值后内容 fixed 吸附视口（`position` 决定吸附边：top 吸顶缺省 / bottom 吸底），原位占位撑高防跳动（脱流前几何快照），吸附/脱离时广播 `change`（冒泡，`detail = { fixed }`）。

与近邻组件的边界：**float-button** 是 fixed 悬浮动作钮（恒悬浮语义）、**anchor** 是滚动高亮导航——本件是**内容区固钉吸附**（常态随文档流、越线脱流吸附），三者正交。affix 是纯定位件（无色面），吸附内容的底色由内容自带。

容器相对形态（target 指定吸附容器）v1 不做（viewport 起步，按需增补——ADR-0030 边界声明）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.affix.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.affix.js"></script>

<div @change="fixed = $event.detail.fixed">
  <x-affix :offset="80">
    <div class="sticky-bar">吸顶操作条</div>
  </x-affix>
</div>
```

静态属性直写（`position`）、数值阈值走 `:offset` 绑定、`change` 事件经外层包裹元素消费（组件默认封闭）——元素名写法经 precompile DOM 变换折叠为 props 注入（宿主替换为 `div`）。

<demo html="components/other/affix/basic.html"/>

## 指南

### 触发偏移（offset）

**类型**: `number`
**默认**: `0`

滚动位置 ≥ offset 即吸附——offset 兼**触发线**与**吸附位**（吸附时 `top: offset px` / `bottom: offset px`，antd 同款单值双义）。缺省 0 表示页顶即吸附；常用值 = 吸顶导航条高度（补偿叠加，如 80）。props 运行时变化即时重判（触发线与吸附偏移同步迁移）。

### 吸附边（position）

**类型**: `top | bottom`
**默认**: `top`

`top` 吸顶（缺省）；`bottom` 吸底（fixed 定位 `bottom: offset px`）。吸附边为纯 CSS 分支（data-position 通道），切换零 JS 重算。

**触发线语义（v1 简化，ADR-0030 声明）**：两档共用同一条触发线（`scrollY >= offset`）——antd 的 offsetTop/offsetBottom 双线独立判定（元素自然位置触发）不采，语义更少歧义。

### 占位撑高

固钉脱流时宿主原位写入等高占位（脱流前 `getBoundingClientRect` 快照），文档流不断裂、滚动不跳动；fixed 定位坐标（left/width）经宿主 CSS 变量下发内容层，resize 后自动重校（视口/布局漂移回写）。

### 事件（change）

吸附/脱离翻转时广播（冒泡，同值短路防密集 scroll 重复派发）：

```html
<div @change="fixed = $event.detail.fixed">
  <x-affix :offset="80">...</x-affix>
</div>
```

`detail = { fixed: boolean }`——true 已吸附 / false 已脱离。

<demo html="components/other/affix/variants.html"/>

### 层级与覆盖通道

吸附层级经 `--asc-affix-z` 覆盖变量调整（缺省 100）：

```css
x-affix {
  --asc-affix-z: 200;
}
```

### 主题化

affix 继承 `autospark.base`（ADR-0134）——主题档位（`data-size` 等六键）自动获得并级联给插槽内容；纯定位件自身无色面，无独立色值消费。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| offset | `number` | `0` | 触发偏移（px）：滚动位置 ≥ offset 即吸附；兼吸附位（top/bottom 偏移） |
| position | `top \| bottom` | `top` | 吸附边：top 吸顶 / bottom 吸底 |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| change | `detail = { fixed }` | 吸附/脱离翻转时广播（冒泡，同值短路） |

### Slots

| 插槽 | 说明 |
|---|---|
| 默认 | 固钉内容（吸附时脱流 fixed 的部分——底色由内容自带） |
