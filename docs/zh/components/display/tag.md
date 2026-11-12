# Tag 标签

## 概述

Tag 是 AutoSpark 的官方行内语义标签组件（组件库 P0，ADR-0019）：语义色五档 + 中性档（`type`）× 形态（`variant`：light 淡底 / solid 实底 / outline 描边）正交（button 范式 ADR-0012），前置图标（`icon`）、可关闭（`closable`：关闭钮 + `close` 事件）。

与 `x-badge` 指令（宿主内容的角标标记）**正交**——彼是内容徽标，此是行内语义标签。尺寸档经 theme 手动通道（`data-size`）全跟随，无自有尺寸属性。

引入方式：引擎之后加载 `<script src="/autospark/autospark.tag.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.tag.js"></script>

<x-tag type="success">已完成</x-tag>                            <!-- 元素名快速写法 -->
<span x-component:autospark.tag="{ type: 'success' }">已完成</span>  <!-- 指令值形态 -->
```

<demo html="components/display/tag/basic.html"/>

## 指南

### 语义色（type）

**类型**: `primary | success | warning | danger | info | default`
**默认**: `default`

对齐 button / link 范式的语义色轴：`primary` 主色 / `success` 成功 / `warning` 警告 / `danger` 危险 / `info` 信息 / `default` 中性档（正文色淡底）。色值走 `--auto-*-color` 语义变量三级回退链（ADR-0129），theme 切换 / 暗色即时跟随。

### 形态（variant）

**类型**: `light | solid | outline`
**默认**: `light`

与语义色正交的形态轴：`light` 淡底（语义色 10% 混淡底 + 同色文字）、`solid` 实底（语义色底 + 白字——白字为恒定设计非变量映射）、`outline` 描边（透明底 + 语义色 55% 淡描边 + 同色文字）。

### 前置图标（icon）

**类型**: `string | { name: string }`
**默认**: `""`

内置图标名（如 `star` / `bell`）或 `{ name }` 对象，经 x-icon 值通道渲染（随状态响应式切换）；空值不渲染图标位。

### 可关闭（closable / closed）

**类型**: `boolean`
**默认**: `false` / `false`

`closable: true` 时标签尾部出现 × 关闭钮（内置 `no` 图标）。点击后派发 `close` 事件（冒泡、可取消）：

- **未阻止**（缺省）：组件自动置 `closed = true` 隐藏整枚——非受控即关即隐；
- **`$event.preventDefault()`**：交由外部全权接管关闭时机（受控用法惯用法，如从状态数组移除该项后再隐藏）。

`closed` 受控：外部翻回 `false` 可让标签重现。

```html
<x-tag type="warning" closable="true" @close="onTagClose($event)">受控关闭</x-tag>
```

<demo html="components/display/tag/closable.html"/>

### 尺寸档（theme data-size 通道）

标签无自有尺寸属性：字号消费 `--auto-font-size`、内距以 em 标定——容器裸挂 `data-size="small | large"` 等档位即整体缩放（ADR-0134）。

### 主题化

语义色走 `--asc-tone` 中转（`--auto-*-color` 注入）；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-tag-*`（如 `--asc-tag-primary` 主色、`--asc-tag-radius` 圆角、`--asc-tag-font-size` 字号基准）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| type | `primary \| success \| warning \| danger \| info \| default` | `default` | 语义色 |
| variant | `light \| solid \| outline` | `light` | 形态（与语义色正交） |
| icon | `string \| { name: string }` | `""` | 前置图标（空值不渲染） |
| closable | `boolean` | `false` | 关闭钮（close 事件） |
| closed | `boolean` | `false` | 关闭态（true 隐藏整枚；受控可回 false 重现） |

### 事件

| 事件 | detail | 说明 |
| --- | --- | --- |
| close | `{ event }` | 关闭钮点击冒泡，cancelable——preventDefault 阻止自动隐藏 |

### Slots

| 插槽 | 说明 |
| --- | --- |
| 默认 | 标签文字（无内容时出口隐藏，纯图标标签不占位） |
