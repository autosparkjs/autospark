# Input 输入框

## 概述

Input 是 AutoSpark 的官方输入框组件（组件库 P0 form 批，ADR-0020），走**原生增强路线**：内层是真实的原生 `<input>` 控件 + 骨架样式包裹，不自绘输入面——原生可访问性（键盘 / IME 输入法 / 自动填充 / 移动端兼容）全保留（ADR-0018 决策 7）。多行输入请用独立的 [Textarea 多行文本框](/zh/components/form/textarea)（ADR-0032：`input` 不再内置 textarea 形态）。

能力面：**type 文本族**（text / password / email / tel / url / search 等透传）、**clearable**（清除钮）、**show-password**（眼睛切换）、**prefix / suffix**（文本或图标前后置）、**maxlength 计数**、**disabled / readonly**。label、校验文案、域布局由 engine 的 [x-form / x-field 指令](/zh/guide/engine/form/) 承担——组件只经 `status` 属性消费校验结果染色，**不双轨建域**。

组件继承 [`autospark.field` 表单域骨架](/zh/components/form/field)（状态色通道 / 焦点态 / 盒饰 chrome / prefix·suffix 装饰出口 / [actions 融合动作](/zh/components/form/field#actions-融合动作)），视觉全走 `--auto-*` 语义变量三级回退链（ADR-0129）；**不设自有尺寸属性**——高度/内距消费 `--auto-input-height` / `--auto-input-padding`，经主题通道 `data-size` 挂任意祖先容器全档位跟随（button 同范式 ADR-0012）；暗色态容器裸挂 `data-dark` 即局部切换。无内置文案、不接 i18n（ADR-0018 决策 1）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.input.js"></script>`（自举注册，产物已内嵌 field 注册，无须单独引入），或聚合产物 `autospark.plugins.js`。

## 快速入门

引擎之后加载组件脚本即注册完成，以指令值形态实例化；值通道直接在宿主上写 `x-model`（值桥协议，见[指南 · 值通道](#值通道-x-model-桥)）：

```html
<script src="autospark.js"></script>
<script src="autospark.input.js"></script>

<x-input x-model="user.name" placeholder="请输入用户名"></x-input>
<!-- 元素名快速写法（等价，属性自动折叠为 props） -->
<x-input placeholder="请输入用户名" x-model="user.name"></x-input>
```

<demo html="components/form/input/basic.html"/>

## 指南

### type 文本族

**类型**: `string`
**默认**: `text`

- 文本族值（`text` / `password` / `email` / `tel` / `url` / `search` 等）**透传为原生 input type**（原生校验语义、移动端键盘联动随之生效）；
- `type="password"` 配合 [`show-password`](#show-password-密码可见切换) 使用；
- 多行输入不在本组件：请用 [Textarea](/zh/components/form/textarea)。

<demo html="components/form/input/variants.html"/>

### placeholder / maxlength

**类型**: `string` / `number`
**默认**: `""` / `0`

`placeholder` 同步原生占位文案；`maxlength > 0` 同步原生 maxlength 属性（浏览器原生输入截断）并作为计数分母。

### 值通道（x-model 桥）

**受控真相走宿主 `x-model`**：组件把宿主 `el.value` 劫持桥接到内层原生控件——`x-model` 的读写都落在劫持位，内层原生 `input` 事件自然冒泡经过宿主被 `x-model` 直接监听（原生控件自带 value 语义，桥比 ButtonGroup 组值桥更薄，ADR-0020）。修饰符（`.trim` / `.number` / `.boolean`）与 x-model 全部语义可用。

`value` 属性是**非受控初值 / 单向同步值**：无 x-model 时外部状态变化会写入控件（单向），受控场景请恒用 `x-model`。

```html
<!-- 双向绑定（推荐） -->
<x-input x-model="form.name"></x-input>
<!-- 单向同步（无回写） -->
<x-input :value="form.name"></x-input>
```

### clearable

**类型**: `boolean`
**默认**: `false`

值非空且可交互时显示清除钮（内部动作件，点击不转发焦点）：清空 + 手动派发 `input` 事件（冒泡过宿主驱动 x-model 回写 state）+ 焦点回控件。

### show-password 密码可见切换

**类型**: `boolean`
**默认**: `false`

仅 `type="password"` 消费（其余形态忽略）：输入框尾部出现眼睛钮，点击在内层 `password ↔ text` 间切换；图标为组件注册的 `input-eye` / `input-eye-off`（全局图标表，可后注册同名图标定制）。

### prefix / suffix

**类型**: `string | { icon: string }`
**默认**: `""`

前后置装饰：`string` 渲染为文本；`{ icon: "图标名" }` 渲染为 x-icon 图标。

> **对象 props 注入提示**：`{ icon }` 对象形态请经**状态引用**注入（`prefix: myConf`）——当前引擎版本对值对象内的字面量对象/数组 props 存在无限更新缺陷（修复在途），字面量写法会触发死循环；标量 props 不受影响。

需要更重的装饰（任意 HTML / 按钮）时用 [field 装饰插槽](/zh/components/form/field#插槽)——props 装饰与插槽同轨出口位、按覆盖链叠层（投影接管出口时 props 装饰让位）；功能件（清除/眼睛/计数）恒在控件侧不受投影影响。

<demo html="components/form/input/addons.html"/>

### actions 融合动作

**类型**: `Array<button props & { pos?, name?, value? }>`
**默认**: `[]`

在输入框前后增加 1-N 个与盒饰**融合**的按钮（共享边框线、等高、首尾圆角匹配）——field 骨架层能力（继承即得，完整说明见 [BaseField · actions 融合动作](/zh/components/form/field#actions-融合动作)）。要点：项为 **button props 全集** + 自有键 `pos`（before | after 分侧，缺省 after）/ `name` / `value`；数组**经状态引用注入**（`:actions="myActions"`——字面量数组触发引擎死环缺陷勿用）；点击组包派发 `action-click`（`detail = { index, name, value, item }`，`@` 监听写外层包裹元素）+ 原生 click 双通道；**须同页加载 `autospark.button.js`**（组合依赖）。

<demo html="components/form/input/actions.html"/>

### showCount 计数器

**类型**: `boolean`
**默认**: `false`

输入框尾部显示计数：`maxlength` 在场为 `len / max`（超限整组染 danger 色），否则仅 `len`。计数随输入即时更新（含程序赋值）。

### disabled / readonly

**类型**: `boolean`
**默认**: `false`

由 field 骨架统一同步到内层原生控件（`disabled` / `readOnly` 属性）+ 宿主 `data-disabled` / `data-readonly` 反射（禁用淡化 / 光标通道）。readonly 可聚焦可复制，仅阻输入。

### status 状态色（x-field 协作）

**类型**: `"" | "error" | "success" | "warning"`
**默认**: `""`

表单域状态色通道（field 骨架）：染边框与焦点环（`error`=danger / `success`=success / `warning`=warning），`error` 态内层控件同步 `aria-invalid="true"`。**校验结果来自 x-field**——组件不做校验，经绑定消费指令注入的 `$field.error`：

```html
<form x-form="login">
  <div x-field="username">
    <x-input x-model="login.username" :status="$field.error ? 'error' : ''"></x-input>
    <em>{{ $field.error }}</em>
  </div>
</form>
```

<demo html="components/form/input/status.html"/>

### 表单提交（原生直提交）

宿主 `name` 属性自动透传到内层原生控件——原生表单提交 / `FormData` / Enter 提交语义直接生效（无须隐藏代理载体，ADR-0020 分叉决策，对照 StateButton 的 hidden input 桥）。

### 事件

组件默认封闭，**原生事件经冒泡到外层消费**（不自定义事件面）：

| 事件 | 说明 |
| --- | --- |
| `input` / `change` | 内层原生控件事件自然冒泡（x-model 与外层 `@input` / `@change` 直接消费；清除钮的清空亦派发 `input`） |

### 主题化

尺寸档位：任意祖先容器挂 `data-size="x-small | small | medium | large | x-large"`（theme 手动通道）整片生效——高度 / 内距消费 `--auto-input-height` / `--auto-input-padding` 随档联动；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-input-*`（如 `--asc-input-placeholder`）与骨架通道 `--asc-field-*`（如 `--asc-field-primary`、`--asc-field-bg`、`--asc-field-height`）；均可被同名覆盖变量接管（三级回退链第二级）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| type | `string` | `text` | 文本族透传原生 input type |
| value | `string` | `""` | 非受控初值 / 单向同步值（受控真相走宿主 x-model） |
| placeholder | `string` | `""` | 占位文案（同步原生属性） |
| maxlength | `number` | `0` | >0 同步原生 maxlength（原生截断）+ 计数分母 |
| clearable | `boolean` | `false` | 清除钮（非空显形，点击清空 + input 派发 + 焦点回控件） |
| showPassword | `boolean` | `false` | 密码可见切换眼睛钮（仅 type=password） |
| showCount | `boolean` | `false` | 计数器（len / max，超限染 danger） |
| prefix | `string \| { icon: string }` | `""` | 前置装饰（文本 / 图标，对象经状态引用注入） |
| suffix | `string \| { icon: string }` | `""` | 后置装饰（形态同 prefix） |
| status | `"" \| error \| success \| warning` | `""` | 状态色通道（field 骨架；x-field 校验结果染色入口） |
| disabled | `boolean` | `false` | 禁用（骨架同步原生控件） |
| readonly | `boolean` | `false` | 只读（骨架同步原生控件） |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| input / change | 原生事件 | 内层原生控件事件冒泡（外层 `@input` / `@change` 消费） |

### Slots

| 插槽 | 说明 |
|---|---|
| 默认 | 整段控件区覆盖（一般不用——传入内容会替换内层控件结构，属逃生通道） |
| prefix | 前置装饰出口（经 field 骨架继承）：任意 HTML，默认次要色（投影接管时 props 装饰让位）；交互件须标 `data-autospark-action` 自理焦点 |
| suffix | 后置装饰出口（经 field 骨架继承）：形态同 prefix |
