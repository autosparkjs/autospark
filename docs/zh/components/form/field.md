# Field 表单域骨架

## 概述

Field 是 AutoSpark 的**表单域骨架**（组件库 base 目录，ADR-0020）——form 域家族（[Input](/zh/components/form/input) / Checkbox / Radio / Switch / Select / InputNumber …）的继承基座，也可以**直接实例化**：默认出口装任意控件内容，即获得骨架能力（状态色通道 / 焦点态 / disabled·readonly 同步 / 盒饰 chrome，ADR-0020 2026-11-14 修订转公开文档组件）。

骨架职责「宁薄勿胖」——只承担 form 域家族共性，控件本体与轻装饰一概留给子组件 / 消费方：

- **状态色通道**：`status` → 宿主 `data-status` → `--asc-field-tone` 中转变量派生，焦点环 / 边框统一消费；error 态自动同步控件 `aria-invalid`；
- **焦点态追踪**：`focusin` / `focusout` 冒泡承接（骨架内元素间移动焦点不闪烁）→ 宿主 `data-focus`；
- **disabled / readonly**：同步到 `data-autospark-control` 标记的原生控件 + 宿主属性反射（CSS 淡化 / 光标通道）；
- **三出口**：`default`（控件位）+ `prefix` / `suffix` 具名装饰出口（重装饰层，[指南 · 插槽](#插槽)）；
- **盒饰选配类** `.asc-field-box`：input 类控件的边框 / 底色 / 高度 / 焦点环 chrome，裸态控件（checkbox / radio 等）不加。

label、校验文案、域布局由 engine 的 [x-form / x-field 指令](/zh/guide/engine/form/) 承担——骨架只经 `status` 属性消费校验结果染色，**不双轨建域**。视觉全走 `--auto-*` 语义变量三级回退链（ADR-0129）；不设自有尺寸属性，经主题通道 `data-size` 挂任意祖先容器全档位跟随；暗色态容器裸挂 `data-dark` 即局部切换。

引入方式：引擎之后加载 `<script src="/autospark/autospark.field.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。子组件产物（如 `autospark.input.js`）已内嵌本注册——用现成表单组件时无须单独引入。**使用 [actions 融合动作](#actions-融合动作) 须同页加载 `autospark.button.js`**（组合复用 button 组件，2026-11-16 修订二）。

## 快速入门

宿主元素以 `x-component:autospark.field` 实例化（值 = props 注入），默认出口装消费方自带的控件内容，控件标 `data-autospark-control` 接管同步：

```html
<script src="autospark.js"></script>
<script src="autospark.field.js"></script>

<span class="asc-field-box" x-component:autospark.field>
  <input class="my-native" data-autospark-control placeholder="请输入" x-model="form.name" />
</span>
```

`.asc-field-box` 是选配类（盒饰 chrome）；控件裸化样式由消费方自带（骨架不假设控件形态）。

<demo html="components/form/field/basic.html"/>

## 指南

### status 状态色通道

**类型**: `string`
**默认**: `""`

`"" | error | success | warning` 四态：染 `--asc-field-tone` 中转变量（error=danger / success / warning 语义色），未聚焦即染边框、聚焦补同色光晕；`error` 态自动给控件同步 `aria-invalid="true"`。字面量直给：`x-component:autospark.field="{ status: 'error' }"`；与 [x-field](/zh/guide/directives/x-field) 协作时经后代绑定注入：`status: $field.error ? "error" : ""`。

<demo html="components/form/field/basic.html"/>

### disabled / readonly

**类型**: `boolean`
**默认**: `false`

同步到 `[data-autospark-control]` 标记控件（`disabled` / `readOnly` 原生语义）+ 宿主 `data-disabled` / `data-readonly` 反射：禁用取禁用语义边框 / 底色 + 禁点光标（状态在场时边框让位状态色——status 是显式意图）；只读仅光标归正文（无淡化）。

### 盒饰选配类 asc-field-box

input 类控件在宿主上拼 `asc-field-box` 得盒饰 chrome（边框 / 底色 / 高度 / 内距 / 焦点环 / hover）；checkbox / radio / switch 等裸态控件不加（状态色仍可经 `--asc-field-tone` 消费）。高度 / 内距消费 `--auto-input-height` / `--auto-input-padding` 随主题档位联动。

### 插槽

三出口，文档序即呈现序（DOM 序固定）：

```html
<span class="asc-field-box" x-component:autospark.field>
  <template x-slot:prefix><span>¥</span></template>
  <!-- 未标记的直接子级 = 默认段（控件位） -->
  <input class="my-native" data-autospark-control x-model="form.price" />
  <template x-slot:suffix><span>元</span></template>
</span>
```

- **default**：控件位。直接实例化时装消费方内容；被子组件继承时被子组件默认段替换（消费方内容仍可再覆盖）；
- **prefix / suffix**：具名装饰出口。消费方任意 HTML（建议单根），默认次要色（`--auto-secondary-color`）、`0.4em` 间距 + 防收缩（`flex: none`）随出口 class 活注入落内容根；空插槽整出口静默消失（零多余 DOM）；
- **点击转发焦点**：点击装饰（非控件非动作件）焦点落控件——插槽内放交互件（按钮等）须自标 `data-autospark-action` 自理焦点；
- **轻装饰 / 重装饰分层**：子组件的 props 前后置（如 Input 的 `prefix` / `suffix` 文本|图标）是轻装饰，插槽前后置是重装饰——两者同轨出口位、按覆盖链叠层（消费方投影接管出口时 props 装饰让位，显式接管语义），功能动作件（清除/眼睛/计数）恒在控件侧不被顶掉。呈现序恒为 `[slot:prefix] [控件] [动作件] [slot:suffix]`。

<demo html="components/form/field/slots.html"/>

### actions 融合动作

**类型**: `Array<button props & { pos?, name?, value? }>`
**默认**: `[]`

融合动作按钮：在输入域前后增加 1-N 个与盒饰**融合**的按钮（antd addon 形态）——共享边框线（按钮与盒饰、按钮与按钮之间一条线，不叠双线）、首/尾钮外侧圆角匹配盒饰、等高拉伸（textarea 形态随盒高）。

- 项 = **button props 全集**（label / icon / variant / type / loading / memo / tags / caret…整包透传，等效 `x-button-options`）+ 自有键：
  - `pos`: `"before" | "after"` 前后分侧，缺省 `"after"`；
  - `name`: 标识（透传进 `action-click` detail）；
  - `value`: 使用者数据，**原样透传**（不做处理，tags 同款惯例）；
- **事件双通道**：按钮点击组包派发 `action-click`（冒泡，`detail = { index, name, value, item }`——index 为侧内序号）；原生 `click` 照常冒泡；
- **状态联动**：field `disabled` → 按钮同步禁用（与项自身 `disabled` 合并）；按钮自动标 `data-autospark-action`（点击不转发焦点到控件）；`status` 染共享接缝线（整组跟随）、不染按钮本体；
- 融合仅在盒饰层生效（`.asc-field-box` 后代——裸态控件无融合线）；按钮有上下边框时与盒上下边框线**重合**（等高拉伸 + 纵向负距贴边）；钮组与控件位之间留 `0.4em` 缝（首/尾钮贴盒边融合保留）；消费方经 prefix/suffix 插槽自放的按钮是重装饰、样式自理（不自动获得融合）。

```html
<!-- 数组 props 经状态引用注入（:actions="myActions"）——值对象内字面量数组
     会触发引擎更新环缺陷（修复在途），字面量写法勿用 -->
<x-input :actions="myActions" x-model="kw"></x-input>
```

```js
// state
myActions: [
  { label: "https://", pos: "before" },
  { label: "搜索", name: "search", value: "go", pos: "after" },
]
```

```html
<!-- 事件消费（双通道之一：组包 detail）——实例化宿主默认封闭，
     @ 监听写外层包裹元素（事件经冒泡，button tag-click 同款惯例） -->
<span @action-click="onAct($event.detail)">
  <x-input :actions="myActions" x-model="kw"></x-input>
</span>
```

<demo html="components/form/field/actions.html"/>

### 作为继承基座

子组件经 `x-define:inherit="autospark.field"` 继承骨架（继承链 子组件 → field → autospark.base 三层）：子模板控件结构作默认段替换出口 fallback，根 class 拼接（宿主恒得 `.asc-field` + 子自有类），setup / hooks / styles 三通道父子合并。官方表单组件均走此通道——日常直接用 [Input](/zh/components/form/input) 等成品件即可，仅自研表单控件时才需要直接消费骨架。

### 主题化

视觉全走 `--auto-*` 语义变量（ADR-0129 三级回退链 `--auto-*` → `--asc-field-*` 组件覆盖通道 → 校准兜底字面值，无 theme 环境也可用）：

| 消费位 | 主题变量 | 覆盖通道 |
|---|---|---|
| 字体族 / 字号 / 行高 | `--auto-font-family` / `--auto-font-size` / `--auto-line-height` | `--asc-field-font-family` 等 |
| 正文 / 装饰色 | `--auto-color` / `--auto-secondary-color` | `--asc-field-color` / `--asc-field-affix` |
| 边框（拆分消费） | `--auto-border-size` + `--auto-border-color` | `--asc-field-border-size` / `--asc-field-border-color` |
| hover / 禁用边框 | `--auto-hover-border-color` / `--auto-disable-border-color` | `--asc-field-hover-border` / `--asc-field-disable-border` |
| 盒饰底色 / 内距 / 圆角 | `--auto-input-bgcolor` / `--auto-input-padding` / `--auto-input-radius` | `--asc-field-bg` / `--asc-field-padding` / `--asc-field-radius` |
| 状态色（tone 上游） | `--auto-primary-color` / `--auto-danger-color` / `--auto-success-color` / `--auto-warning-color` | `--asc-field-primary` 等 |

边框维持 size + color **拆分**消费（状态重染色机制依赖拆分，组合令牌 `--auto-input-border` 不消费）；尺寸档位经主题通道 `data-size` / `data-spacing` 挂任意祖先容器全档位联动。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| status | `string` | `""` | 状态色通道：`""` 无 \| `error` 危险 \| `success` 成功 \| `warning` 警告；染 `--asc-field-tone`，error 态同步控件 `aria-invalid` |
| disabled | `boolean` | `false` | 禁用：同步 `data-autospark-control` 控件 + 宿主 `data-disabled`（淡化 / 禁点光标） |
| readonly | `boolean` | `false` | 只读：同步控件 `readOnly` + 宿主 `data-readonly`（光标归正文） |
| actions | `Array` | `[]` | 融合动作按钮：button props 数组 + 自有键 `pos`（before \| after 分侧，缺省 after）/ `name` / `value`；**经状态引用注入**（`:actions="myActions"`） |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| action-click | `detail = { index, name, value, item }` | 融合动作按钮点击组包（冒泡）：index 为侧内序号、name/value 取自项自有键、item 为 actions 原始项；原生 click 照常冒泡（双通道） |

其余无自定义事件——内层控件的原生事件（`input` / `change` / `focus` 等）自然冒泡，外层直接消费。

### Slots

| 插槽 | 说明 |
|---|---|
| default | 控件位：直接实例化装消费方内容（控件标 `data-autospark-control`）；子组件默认段替换 |
| prefix | 前置装饰出口：任意 HTML，默认次要色（子组件 props 装饰同轨此出口、消费方投影接管时让位）；空插槽零布局 |
| suffix | 后置装饰出口：形态同 prefix |

### CSS 变量

见[指南 · 主题化](#主题化)消费表；中转变量 `--asc-field-tone`（状态色）与 `--asc-field-line`（边框色）为骨架内部派生位，可整体覆写定制。
