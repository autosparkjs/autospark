# Avatar 头像

## 概述

Avatar 是 AutoSpark 的官方头像组件（组件库 P1 / display 分类，ADR-0018 清单权威表 display 行）：`src`（图片，加载失败自动回退）/ `icon`（x-icon 内置图标）/ `label`（首字符回退源）三源优先级链 + `shape` 形态（circle 缺省 / square）。

尺寸无自有属性——em 基准随 theme 手动通道 `data-size` 档位全跟随（tag 同范式，ADR-00134）；底色/文字色取 `--auto-*` 语义变量（三级回退链，ADR-0129），theme 切换 / 暗色即时跟随。

**角标不内建**：角标能力由 x-badge 指令承载（ADR-0018 决策 3「指令即终态」），使用者外挂组合（见下文配方），组件不建双轨。

引入方式：引擎之后加载 `<script src="/autospark/autospark.avatar.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.avatar.js"></script>

<x-avatar label="张三"></x-avatar>                          <!-- 元素名快速写法：首字符「张」 -->
<div x-component:autospark.avatar="{ src: pic }"></div>    <!-- 指令值形态 -->
```

<demo html="components/display/avatar/basic.html"/>

## 指南

### 图片源（src）

**类型**: `string`
**默认**: `""`

图片地址，在场即渲染 `<img>`（`object-fit: cover` 铺满、`alt` 取 `label`）。加载失败（`@error`）自动回退 `icon` / `label` 首字符；`src` 变化时失败态重置、重试新地址。

### 图标回退（icon）

**类型**: `string | { name: string }`
**默认**: `""`

x-icon 内置图标名或 `{ name }` 对象（值通道响应式）。`src` 缺席或加载失败时生效；优先于 `label` 首字符。

### 首字符回退（label）

**类型**: `string`
**默认**: `""`

字符回退源——取首个码点（`Array.from` 截取，emoji / 扩展区安全）渲染加粗字符；兼职图片 `alt`（可访问性）。三源（src/icon/label）皆空时渲染内置 `default` 图标兜底，视觉不空白。

### 形态（shape）

**类型**: `"circle" | "square"`
**默认**: `"circle"`

`circle` 正圆（缺省）；`square` 方形——圆角走 `--auto-border-radius`（`data-radius` 档位通道在场即跟随）。

```html
<x-avatar label="方" shape="square"></x-avatar>
```

<demo html="components/display/avatar/shapes.html"/>

### 角标组合（x-badge 配方，不内建）

角标经 x-badge 指令外挂（须同页引入 `autospark.badge.js`；聚合产物无此问题）：

```html
<span x-badge="unread"><x-avatar label="王"></x-avatar></span>
<span x-badge.count="unread"><x-avatar icon="bell" shape="square"></x-avatar></span>
```

### 主题化

尺寸档位：容器裸挂 `data-size`（头像 2.6em 见方，随字号档整体缩放）；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-avatar-*`（如 `--asc-avatar-bg` 底色、`--asc-avatar-radius` 方形圆角、`--asc-avatar-font-size` 字号基准）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| src | `string` | `""` | 图片地址（失败自动回退；变化时重试） |
| icon | `string \| { name: string }` | `""` | 图标回退（x-icon 值通道；src 缺席/失败时生效） |
| label | `string` | `""` | 首字符回退源（兼职 alt） |
| shape | `"circle" \| "square"` | `"circle"` | 形态（square 圆角随 data-radius 档位） |

### 事件

无（组件纯展示；交互场景由外层容器承接）。

### Slots

无（回退链三源全覆盖；组合内容场景用外层容器编排）。
