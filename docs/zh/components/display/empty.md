# Empty 空状态

## 概述

Empty 是 AutoSpark 的官方通用空状态组件（组件库 P0，ADR-0019）：图区（`image` 槽，默认经 x-icon 内置图标）+ 描述（`description`，内置文案走 i18n 词典）+ 附加内容（默认插槽，常放动作按钮）。

内置文案「暂无数据」走 modules/i18n 词典机制（键 `empty.description`，ADR-0018 决策 6 约定 1）：使用者可经 `x-locales` 指令 / 顶层 `<script type="autospark/locales">` / `options.i18n.messages` 任意语言覆译，语言切换即时生效；未装 i18n 插件或词典无此键时回退硬编码中文——依赖松弛，不强制。

**命名消歧**：`x-empty` 作为**属性标记**是 x-for / x-tree 认的结构空态触发器（容器直接子元素上的无值属性，空数组时渲染该子树）；本组件 `autospark.empty` 是通用空状态**展示组件**（元素名形态 `<x-empty>`）——两者分属元素 / 属性两通道，互不相认。x-tree 容器内的结构空态仍用属性标记，页面级/卡片级空状态展示用本组件。

引入方式：引擎之后加载 `<script src="/autospark/autospark.empty.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.empty.js"></script>

<x-empty></x-empty>                                <!-- 默认图标 + 「暂无数据」 -->
<x-empty description="还没有任何项目"></x-empty>     <!-- 自定义描述 -->
```

<demo html="components/display/empty/basic.html"/>

## 指南

### 描述（description）

**类型**: `string`
**默认**: `""`（走词典兜底）

显式传入优先；缺省时走 i18n 词典 `empty.description` 键按 `$.language` 取译文，词典未命中（含未装 i18n 插件——引擎兜底 t 恒等返回键本身）回退硬编码中文「暂无数据」。

覆译三通道（任选其一，就近覆盖语义见 i18n 文档）：

```html
<!-- ① x-locales 指令（就近作用域） -->
<div x-locales="{ 'empty.description': { en: 'Nothing here yet' } }">…</div>

<!-- ② 顶层游离 script（自动全局） -->
<script type="autospark/locales">
  { "empty.description": { "zh-CN": "这里空空如也", "en": "Nothing here yet" } }
</script>

<!-- ③ 构造选项全局字典 -->
new AutoSpark(el, state, { i18n: { language: "en", messages: { "empty.description": { en: "No data" } } } })
```

### 图标（icon）与换图（image 槽）

**类型**: `string | { name: string }`
**默认**: `"file"`

默认图区渲染大号内置图标（辅助色、相对字号随 `data-size` 档位缩放）；`image` 槽提供内容时整体换图（兜底图标让位），常放自定义 SVG / 图片。

### 附加内容（默认插槽）

描述下方的动作区（常放按钮组）；无内容不占位。

<demo html="components/display/empty/slots.html"/>

### 主题化

图区走 `--auto-third-color`、描述走 `--auto-secondary-color`（三级回退链，ADR-0129）；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-empty-*`（如 `--asc-empty-image-color` 图区色、`--asc-empty-desc-color` 描述色、`--asc-empty-padding` 内距）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| description | `string` | `""` | 描述文案（空时走 empty.description 词典兜底） |
| icon | `string \| { name: string }` | `"file"` | 图标（image 槽可整体换图；空串不渲染） |

### 事件

无（纯展示组件）。

### Slots

| 插槽 | 说明 |
| --- | --- |
| image | 图区整体换图（默认大号内置图标兜底） |
| 默认 | 描述下方附加内容（动作区，无内容不占位） |
