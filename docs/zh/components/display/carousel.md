# Carousel 轮播

## 概述

Carousel 是 AutoSpark 的官方轮播组件（组件库 P2 / display 分类，ADR-0018 清单权威表 display 行）：`items` 双形态（图片 / 内容）+ `autoplay`（间隔毫秒，0 关）+ `loop` + `indicator`（位置 / 开关）+ `arrows`（前后箭头，x-icon）+ `effect`（**scroll 真滚动 scroll-snap** / fade 淡入淡出）；切换广播 `change`（`detail = { index }`）+ `el.value` 值桥；stage 焦点域键盘左右翻页；`prefers-reduced-motion` 停播 autoplay。

**实现取舍（scroll-snap 真滚动 vs transform 位移）**：scroll 档走 CSS scroll-snap 真滚动——原生滚动 / 触摸惯性免费，切换经 `scrollTo` 驱动（程序滚动的平滑中间态由内部 `settleTarget` 旗吞掉，用户拖动实时反推同步并广播）；fade 档纯 CSS 叠放透明度切换（stage 定高 `--asc-carousel-height`，缺省 16rem）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.carousel.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.carousel.js"></script>


<div @change="page = $event.detail.index + 1">
  <x-carousel loop="true" :items="slides"></x-carousel>
</div>


<x-carousel loop>
  <x-carousel-item src="a.png"></x-carousel-item>
  <x-carousel-item src="b.png" caption="海边日落"></x-carousel-item>
  <x-carousel-item><em>内容幻灯</em></x-carousel-item>
</x-carousel>
```

<demo html="components/display/carousel/basic.html"/>

## 指南

### 幻灯项（items 双形态）

**类型**: `(string | { src?, alt?, caption?, html? })[]`

① **状态引用注入**（推荐，动态内容唯一通道）：`x-component:autospark.carousel="{ items: slides }"`——模板里写字面量数组会触发 props 更新死循环（ADR-0021 规避清单第 5 条）；列表变更须**整体替换**状态（对原数组的 `push/splice` 原地变异不发信号，不触发重渲）。

② **子元素声明**（静态语义）：`<x-carousel-item src alt caption>` 标量折叠 + 子内容随迁为 `html` 字段，整组折叠为 `data-items` JSON（标量通道绕开值对象死环）；裸 `items` 属性（JSON 数组字符串）同经此通道。props 状态引用在场恒优先。

项形态探测：

| 项形态 | 渲染 |
| --- | --- |
| `"a.png"`（string） | 图片幻灯 |
| `{ src, alt?, caption? }` | 图片幻灯（+ 底部渐变说明条） |
| `{ html }` | 内容幻灯（x-html 直出——内容安全由调用方数据自负） |

### 自动播放（autoplay）

**类型**: `number`，默认 `0`（关）

间隔毫秒；`prefers-reduced-motion: reduce` 用户自动停播（不被自动动效打扰，CSS 过渡同步停播）；非循环模式到末页自然停播。间隔调整热重启（写 0 即停）。

### 循环（loop）

**类型**: `boolean`，默认 `false`

`true` 末页 next 回首页（环形）；`false` 首末页箭头 disabled（收起）且 autoplay 到末页停播。

### 指示器（indicator）

**类型**: `"top" | "bottom" | false`，默认 `"bottom"`

指示点条位置；`false` 关闭。点钮可点击直达对应页；激活点为拉长胶囊形态（图上浮层恒白设计）。`"top"` 置顶、`"bottom"`（缺省）贴底。

### 前后箭头（arrows）

**类型**: `boolean`，默认 `true`

图上浮层圆形箭头钮（半透明深底反白，x-icon 内置 `arrow` 图标——左箭头经 CSS 旋转 180°）；悬停显影（键盘 focus 兜底），触屏设备恒显。`false` 关闭。

### 切换效果（effect）

**类型**: `"scroll" | "fade"`，默认 `"scroll"`

- **scroll**（缺省）：CSS scroll-snap 真滚动——原生滚动条隐藏（指示点即位置反馈），触摸 / 触控板滑动惯性免费；程序切换经 `scrollTo`（smooth）驱动，中间路过页被内部旗吞掉不误广播；容器尺寸变化自动按当前页重贴齐。
- **fade**：纯 CSS 叠放透明度切换（0.3s）——绝对叠放项不撑高容器，stage 须定高 `--asc-carousel-height`（缺省 16rem，可覆盖）。

### 事件与值桥

| 通道 | 形态 | 触发 |
| --- | --- | --- |
| `change` | `detail = { index }` | 一切换一广播——箭头 / 指示点 / 键盘 / autoplay / 用户拖动殊途同归 |
| `el.value` | 读当前页 / 写直达页 | `carouselEl.value` 直读；赋值走 goTo（夹取 / 环形 / 同值短路） |

事件消费挂包裹层（化身宿主是封闭组件域）：`<div @change="page = $event.detail.index">`。

### 键盘

stage（轮播主体）为焦点域（`tabindex="0"`，WAI-ARIA carousel 地标）：聚焦后 `←` / `→` 翻页。

### 主题化

容器级样式走主题变量链 + 暗色兜底（ADR-0129）：容器底色 `--auto-third-bgcolor`、圆角 `--auto-border-radius`、内容文字 `--auto-color`（暗色下容器裸挂 `data-dark` 即切换）。图上浮层（箭头 / 指示点 / 说明条）为半透明深底反白的**恒定设计**（浮在任意图片明暗之上均成立，不随主题切换）。使用者覆盖通道 `--asc-carousel-*`：`--asc-carousel-height`（fade 档定高）、`--asc-carousel-fit`（图片 object-fit，缺省 cover）、`--asc-carousel-bg`、`--asc-carousel-radius`、`--asc-carousel-arrow-bg` / `--asc-carousel-dot-bg` / `--asc-carousel-dot-active-bg`、`--asc-carousel-caption-veil` / `--asc-carousel-caption-color` 等。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| items | `(string \| { src?, alt?, caption?, html? })[]` | `[]` | 幻灯项（状态引用注入；声明形态经 data-items 通道） |
| autoplay | `number` | `0` | 自动播放间隔毫秒（0 关；reduce 停播；非循环末页停播） |
| loop | `boolean` | `false` | 环形（末页 next 回首页；false 首末页箭头收起） |
| indicator | `"top" \| "bottom" \| false` | `"bottom"` | 指示器位置 / 开关 |
| arrows | `boolean` | `true` | 前后箭头开关 |
| effect | `"scroll" \| "fade"` | `"scroll"` | 切换效果（fade 档 stage 定高） |

### 事件

| 事件 | detail | 触发 |
| --- | --- | --- |
| change | `{ index }` | 当前页切换（箭头 / 指示点 / 键盘 / autoplay / 用户拖动） |

### Slots

无（幻灯内容经 items 的 `html` 字段或子元素声明承载）。
