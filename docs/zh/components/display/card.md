# Card 卡片

## 概述

Card 是 AutoSpark 的官方卡片容器组件（组件库 P0 / **display 分类首件**，ADR-0019）：头部（`title` / `header` 槽 / `extra` 槽）+ 内容区（默认插槽）+ 底部（`footer` 槽）三段结构，边框开关（`bordered`）、悬停浮起（`hoverable`）、可折叠头部（`collapsible` 组合 x-show，无重机制）。

阴影/圆角/字号档位走 theme 手动通道（`data-shadow` / `data-radius` / `data-size`，ADR-0134）；底色/边框取 `--auto-*` 语义变量（三级回退链，ADR-0129），theme 切换 / 暗色即时跟随。

引入方式：引擎之后加载 `<script src="/autospark/autospark.card.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.card.js"></script>

<x-card title="卡片标题">卡片内容</x-card>                        <!-- 元素名快速写法 -->
<div x-component:autospark.card="{ title: '卡片标题' }">卡片内容</div>  <!-- 指令值形态 -->
```

<demo html="components/display/card/basic.html"/>

## 指南

### 标题（title）与头部插槽（header / extra）

**类型**: `string`
**默认**: `""`

`title` 是头部标题的兜底文案；`header` 槽提供内容时整体重载标题区（title 不再渲染），`extra` 槽落头部右缘（动作区，常放「更多」链接）。

空段自动隐藏：`title` 空 + `header`/`extra` 槽无内容 + 不可折叠 → 整个头部不占位；`footer` 槽无内容、默认插槽空同理——纯头卡片 / 纯内容卡片不会留下空白段。

<demo html="components/display/card/slots.html"/>

### 底部插槽（footer）

`footer` 槽承载底部动作区（常放按钮组）；无内容不占位。头部边框（`border-bottom`）与底部边框（`border-top`）随边框开关（`bordered`）联动。

### 边框（bordered）

**类型**: `boolean`
**默认**: `true`

`false` 时边框转透明色（盒模型占位稳定不跳变），阴影仍随 `data-shadow` 档位。

### 悬停浮起（hoverable）

**类型**: `boolean`
**默认**: `false`

悬停时边框点亮主色 + 阴影抬升（抬升档可用 `--asc-card-hover-shadow` 覆盖）；常用于可点击进入的卡片入口。

### 可折叠头部（collapsible / collapsed）

**类型**: `boolean`
**默认**: `false` / `false`

`collapsible: true` 时头部出现展开箭头，点击标题区（含箭头）切换 `collapsed`：body / footer 随之显隐（x-show 通道——DOM 保留、仅切 `display`，extra 区域点击不触发）。`collapsed` 可外部受控驱动（响应式 props）。

**事件**：`collapse`——点击翻转后冒泡，`detail = { collapsed }`（翻转后的新值）；外部 props 驱动的变化不广播（防回环）。

```html
<x-card title="可折叠" collapsible="true" @collapse="open = $event.detail.collapsed">
  内容
</x-card>
```

<demo html="components/display/card/collapsible.html"/>

### 主题化

底色走 `--auto-bgcolor`、边框走 `--auto-border-color`、阴影走 `--auto-shadow`（`data-shadow` 档位通道）；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-card-*`（如 `--asc-card-bg` 底色、`--asc-card-radius` 圆角、`--asc-card-padding` 内距基准、`--asc-card-hover-shadow` 悬停阴影）。内距消费 `--auto-padding`（`data-spacing` 档位全局调节生效）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| title | `string` | `""` | 头部标题（header 槽可整体重载） |
| bordered | `boolean` | `true` | 边框开关（false 转透明色） |
| hoverable | `boolean` | `false` | 悬停浮起（边框点亮 + 阴影抬升） |
| collapsible | `boolean` | `false` | 头部可折叠（点击标题区切换） |
| collapsed | `boolean` | `false` | 折叠态（受控可驱动） |

### 事件

| 事件 | detail | 说明 |
| --- | --- | --- |
| collapse | `{ collapsed }` | 可折叠头部点击翻转后冒泡（外部受控变化不广播） |

### Slots

| 插槽 | 说明 |
| --- | --- |
| 默认 | 内容区（body 出口即容器，投影内容为直接子级） |
| header | 整体重载标题区（优先于 title 兜底） |
| extra | 头部右缘动作区 |
| footer | 底部动作区（无内容不占位） |
