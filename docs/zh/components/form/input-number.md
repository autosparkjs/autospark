# InputNumber 数字输入框

## 概述

InputNumber 是 AutoSpark 的官方数字输入框组件（组件库 P1 form 批，ADR-0018），走**原生增强路线**：内层是真实的原生 `<input>`（`inputmode="decimal"`，数字键盘联动 / IME / 自动填充全保留）+ 盒饰包裹 + 步进钮组（上/下自绘 chevron 图标钮），不自绘输入面（ADR-0018 决策 7）。

能力面：**min / max 夹取**、**step 步长**（步进钮与 ArrowUp / ArrowDown 键盘同义）、**precision 固定小数位**、**controls 步进钮开关**、**NaN 防御**（非法输入保持旧值、清空归空态）。组件**复制 input 的结构而非嵌套消费**——值桥语域分叉（string ↔ number）与产物自包含是分叉理由，共享面（盒饰 chrome / 状态色 / 焦点态 / disabled 同步）经继承 `autospark.base-field` 骨架完整获得（ADR-0020）。

视觉全走 `--auto-*` 语义变量三级回退链（ADR-0129）；**不设自有尺寸属性**——高度消费 `--auto-input-height`，经主题通道 `data-size` 挂任意祖先容器全档位跟随（button 同范式 ADR-0012）；暗色态容器裸挂 `data-dark` 即局部切换。无内置文案、不接 i18n（ADR-0018 决策 1）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.input-number.js"></script>`（自举注册，产物已内嵌 base-field 注册，无须单独引入），或聚合产物 `autospark.plugins.js`。

## 快速入门

引擎之后加载组件脚本即注册完成，以指令值形态实例化；值通道直接在宿主上写 `x-model`（数字语域值桥，见[指南 · 值通道](#值通道-x-model-桥)）：

```html
<script src="autospark.js"></script>
<script src="autospark.input-number.js"></script>

<span x-model.number="form.qty" x-component:autospark.input-number="{ min: 1, max: 99 }"></span>
```

<demo html="components/form/input-number/basic.html"/>

## 指南

### min / max

**类型**: `number | null`
**默认**: `null`（无界）

数值边界：步进与 change 归位时**夹取**到界内（输入过程不夹取——中间态自由，blur / Enter 才归位，antd 同款语义）；在场时同步控件 `aria-valuemin` / `aria-valuemax`。`null` 表示该侧无界。

### step

**类型**: `number`
**默认**: `1`

步进钮、键盘方向键与 change 归位的步进粒度；`<= 0` 或非法值视为 `1`。

### precision

**类型**: `number`
**默认**: `-1`（自适应）

固定小数位：`>= 0` 时步进结果与显示文本均按该位数修约（如 `0.1` 步进 + `precision: 2` 显示 `0.10`）；`< 0` 自适应不修约。

### controls

**类型**: `boolean`
**默认**: `true`

步进钮组开关：`false` 时收起右侧钮组，呈纯数字输入形态（键盘方向键步进仍可用）。

### 值通道（x-model 桥）

**受控真相走宿主 `x-model`**：组件把宿主 `el.value` 劫持桥接到内层原生控件，劫持语域为**数字字符串**（空态为 `""`，配 `.number` 修饰符回写数字类型）。原生 `input` 事件自然冒泡经过宿主被 `x-model` 直接监听；组件监听走 capture 阶段先行更新缓存，`x-model` 恒读到最新值。

`value` 属性是**非受控初值 / 单向同步值**：无 x-model 时外部状态变化会写入控件（单向），受控场景请恒用 `x-model`。

```html
<!-- 双向绑定（推荐，.number 保真数字类型） -->
<span x-model.number="form.qty" x-component:autospark.input-number></span>
<!-- 单向同步（无回写） -->
<span x-component:autospark.input-number="{ value: form.qty }"></span>
```

**输入中间态**：输入过程（`"1."` / `"-"` 等暂态）显示自由、不夹取不修约；blur / Enter 归位时才夹取 + 修约 + 规范文本。**NaN 防御**：非法字符输入不改变当前值（保持旧值），清空归空态（`el.value` 为 `""`）。

### change 事件（归位确认）

原生 change（blur / Enter）被组件在 capture 阶段归位（夹取 + 修约 + 规范文本）后阻断，重派发自定义 `change` 事件（冒泡，`detail = { value }`，value 为 `number | null`）；步进钮与键盘步进同语义派发。表单同步惯用法：

```html
<div @change="form.qty = $event.detail.value">
  <span x-model.number="form.qty" x-component:autospark.input-number></span>
</div>
```

<demo html="components/form/input-number/variants.html"/>

### 键盘

控件可聚焦，`ArrowUp` / `ArrowDown` 步进（默认行为阻断），步进语义与步进钮一致（step × 方向 → 夹取 → 修约）。

### disabled / readonly

**类型**: `boolean`
**默认**: `false`

由 base-field 骨架统一同步到内层原生控件（`disabled` / `readOnly` 属性）+ 宿主 `data-disabled` / `data-readonly` 反射（禁用淡化 / 光标通道）；readonly 可聚焦可复制，仅阻步进与归位写入。

### status 状态色（x-field 协作）

**类型**: `"" | "error" | "success" | "warning"`
**默认**: `""`

表单域状态色通道（base-field 骨架）：染边框与焦点环，`error` 态内层控件同步 `aria-invalid="true"`。**校验结果来自 x-field**——组件不做校验，经绑定消费指令注入的 `$field.error`（与 input 同款协作形态，ADR-0020 决策 1）。

### 表单提交（原生直提交）

宿主 `name` 属性自动透传到内层原生控件——原生表单提交 / `FormData` 语义直接生效（控件即真身，ADR-0020 决策 6）。

### 主题化

尺寸档位：任意祖先容器挂 `data-size="x-small | small | medium | large | x-large"`（theme 手动通道）整片生效——高度消费 `--auto-input-height` 随档联动；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-input-number-*`（如 `--asc-input-number-placeholder`）与骨架通道 `--asc-field-*`；均可被同名覆盖变量接管（三级回退链第二级）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| value | `number \| null` | `null` | 非受控初值 / 单向同步值（NaN 防御：非法忽略；受控真相走宿主 x-model） |
| min | `number \| null` | `null` | 下界（步进与归位夹取；null 无界；同步 aria-valuemin） |
| max | `number \| null` | `null` | 上界（同 min） |
| step | `number` | `1` | 步进粒度（钮 / 键盘 / 归位共用；<=0 视为 1） |
| precision | `number` | `-1` | 固定小数位（>=0 修约与显示；<0 自适应） |
| controls | `boolean` | `true` | 步进钮组开关（false 纯输入形态，键盘步进仍可用） |
| placeholder | `string` | `""` | 占位文案（同步原生属性） |
| status | `"" \| error \| success \| warning` | `""` | 状态色通道（base-field 骨架；x-field 校验结果染色入口） |
| disabled | `boolean` | `false` | 禁用（骨架同步原生控件） |
| readonly | `boolean` | `false` | 只读（骨架同步原生控件；阻步进与归位写入） |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| input | 原生事件 | 输入随动（冒泡过宿主，x-model 直接消费）；步进时组件派发非冒泡 input 驱动回写 |
| change | `detail: { value }` | 归位确认（blur / Enter / 步进），value 为 `number \| null`——原生 change 被阻断，恒收到 detail 版本 |

### Slots

| 插槽 | 说明 |
|---|---|
| 默认 | 整段控件区覆盖（一般不用——传入内容会替换内层控件结构，属逃生通道） |
