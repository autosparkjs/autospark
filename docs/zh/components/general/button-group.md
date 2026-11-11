# ButtonGroup 按钮组

将多个 [Button 按钮](./button.md) 组织成一排（水平缺省 / 垂直）的容器组件——间距可调或融合一体、组级外观统一下发、可选的单选选中（分段选择器）。引入方式（**加载顺序契约：button-group 须先于 button**）：

```html
<script src="/autospark/autospark.js"></script>
<script src="/autospark/autospark.button-group.js"></script>
<script src="/autospark/autospark.button.js"></script>
```

或聚合产物 `autospark.plugins.js` 一个标签挂全部（内部顺序已排好）。

## 概述

`autospark.button-group` 是容器组件（ADR-0014），三职责：

- **布局**：`gap` 间隔（缺省 0 即融合——相邻子钮圆角清除 + 边线单线复用，整组呈一体分段胶囊）、`vertical` 垂直组合（融合轴自动换上下）、`block` 占满父宽；
- **外观缺省下发**：组级 `variant` / `type` / `disabled` 只填充**未显式声明**的子钮（声明式继承，类 CSS 继承——一组 danger 里放一个独立变体钮的逃生通道）；
- **选中协调**：`x-model` 在场即激活单选（segmented control）——点击子钮切换组值、tone 实底反白高亮、组内嵌隐藏 `input[type=hidden]`（表单提交载体）；无 x-model 且无受控 `value` 时为**纯布局组**（工具栏用法，无选中态）。

组为纯布局容器无自有视觉盒——颜色、边框、暗色全由子钮（Button）承担；主题档位经 `autospark.base` 继承六键级联整组。

## 快速入门

<demo html="components/general/button-group/basic.html"/>

## 指南

### 间隔与融合（gap）

**类型**: `number | string`　**默认**: `0`

- `0`（缺省）即**融合**：相邻子钮相邻侧圆角清除 + 边线单线复用——不设独立融合开关，无 gap 即融合；
- `> 0` 时各子钮独立圆角独立边线：number 按 px、字符串原样作 CSS `gap` 值（`"0.5em"`）；
- 支持 `:gap` 响应式绑定；
- `shape=circle` 圆钮不宜入融合组（圆角会被清除，文档注记劝退）。

<demo html="components/general/button-group/gap.html"/>

### 垂直组合（vertical）

**类型**: `boolean`　**默认**: `false`

垂直组合下融合轴自动换为上下边线 / 上下圆角；子钮等宽拉伸（水平融合等高同理）。

<demo html="components/general/button-group/vertical.html"/>

### 缺省下发（variant / type / disabled）

**类型**: `string | boolean`　**默认**: `undefined`（不下发）

组级 `variant`（形态）/ `type`（语义色）/ `disabled` 对子钮的声明式继承：**子钮未显式声明该属性才继承组的，显式声明恒优先**。静态值与绑定表达式（`:type="mode"`）都支持——绑定表达式原样转发子钮、同 scope 响应式求值。

不做组级 `size` 下发（Button 无组件级尺寸，主题档位全局跟随）；组内等高由融合 CSS 天然保证。

<demo html="components/general/button-group/propagate.html"/>

### 选中模式（x-model / value）

**激活条件**：`x-model` 在场（modelBound）**或**显式受控 `value`——两者皆无为纯布局组。

- **单选不反选**（radio 语义）：点击子钮 → 组值 = 该钮 `value`（静态属性声明子钮身份）；点击已选钮不取消；
- **组值恒字符串**（子钮 value 本是字符串属性，`value="7"` → 组值 `"7"`；要数字配 `x-model.number`）；
- **初始不匹配全不选**：state 初值不匹配任何子钮 value（或为空）时全不选——不猜首钮，state 是唯一真相源；
- **选中视觉**：选中子钮 tone 实底反白（实底变体子钮选中不显——推荐 default/text 变体子钮搭配选中模式）；
- **约束**：选中模式下子钮不再使用 `checkable`（两套勾选机制语义冲突）。

#### x-model 双向绑定（内嵌隐藏 input）

```html
<x-button-group x-model="range" name="range">
    <x-button value="day" label="日"></x-button>
    <x-button value="week" label="周"></x-button>
</x-button-group>
```

x-model 在场时组根内嵌 `input[type=hidden]`（`name` 有则透传、`value` = 选中值）——表单提交载体。子钮 `value` 为静态声明（响应式 `:value` 子钮值不支持——分段选择器的值天然静态）。

#### 受控 value 半双工（无 x-model）

```html
<div @change="view = $event.detail.value">
    <x-button-group :value="view">...</x-button-group>
</div>
```

`:value` 单向驱动视觉；点击翻转经 `change` 冒泡由外层一行回写（与 Button 的 checkable 半双工同族惯用法）。

<demo html="components/general/button-group/selection.html"/>

### 主题档位（data-size / data-shadow / data-radius / data-spacing / data-dark / data-colorized）

组继承 `autospark.base` 六键（ADR-0134）：组根物化为同名 `data-*` 属性级联整组子钮——「一组统一档位」无需逐钮声明（`<x-button-group data-size="lg">`）。

<demo html="components/general/button-group/theme.html"/>

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| `change` | `detail = { value }` | 选中模式点击子钮切换后冒泡（组根派发）；`value` 为切换后新组值 |
| `input` | — | 仅 x-model 场景派发（`bubbles: false`，x-model 回写通道，一般不直接消费） |

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `gap` | `number \| string` | `0` | 子钮间隔（number 按 px / 字符串原样 CSS 值）；0 即融合 |
| `vertical` | `boolean` | `false` | 垂直组合（融合轴换上下） |
| `block` | `boolean` | `false` | 容器占满父宽（子钮不强制等分） |
| `variant` | `string` | — | 缺省下发子钮（形态；未显式声明的子钮才继承） |
| `type` | `string` | — | 缺省下发子钮（语义色） |
| `disabled` | `boolean` | — | 缺省下发子钮（禁用） |
| `value` | `any` | `""` | 受控选中值（选中模式；当前选中子钮的 value） |
| `name` | `string` | — | 透传内嵌 hidden input（表单提交载体，x-model 场景） |
| x-model | — | — | 选中模式激活（单选 segmented + 组值桥 + 隐藏 input） |
| base 六键 | `data-size` 等 | — | `autospark.base` 继承主题档位（级联整组） |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| `change` | `{ value }` | 选中切换后冒泡；外层 `@change="v = $event.detail.value"` 回写 |

### Slots

| 插槽 | 说明 |
|---|---|
| 默认插槽 | 子钮（`<x-button>`）及其他内容；子钮直接成为组的 flex 项 |
