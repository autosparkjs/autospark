# Slider 滑动条

## 概述

Slider 是 AutoSpark 的官方滑动条组件（组件库 P1 form 批，ADR-0018），走**原生增强路线**：内层是真实的原生 `<input type="range">`，以 `opacity: 0` 覆盖层形态**藏起仍可交互**——点击跳值 / 拖拽跟随 / 键盘方向键 / 触屏手势等原生行为与可访问性全保留（ADR-0018 决策 7）；轨道 / 已填充段 / 滑块视觉自绘（填充与滑块位置同源于 CSS 变量 `--asc-slider-pos`）。

能力面：**min / max / step**（原生刻度语义）、**showInput 数值输入联动**（内嵌 InputNumber 双向同步）、**disabled / readonly**。组件继承 `autospark.base-field` 表单域骨架（状态色通道 / 焦点态 / disabled 同步，裸态无盒饰，ADR-0020）；表单提交走**原生直提交**（range 是原生表单控件自带提名义，宿主 `name` 透传，无须 hidden 代理）。range 双滑块（区间选择）P3 按需。

视觉全走 `--auto-*` 语义变量三级回退链（ADR-0129）；**不设自有尺寸属性**——轨道 / 滑块 em 基准随主题 `data-size` 档位字号缩放（button 同范式 ADR-0012）；暗色态容器裸挂 `data-dark`。无内置文案、不接 i18n（ADR-0018 决策 1）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.slider.js"></script>`（自举注册，产物已内嵌 base-field 注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

引擎之后加载组件脚本即注册完成，以指令值形态实例化；值通道直接在宿主上写 `x-model`（数字语域值桥）：

```html
<script src="autospark.js"></script>
<script src="autospark.slider.js"></script>

<span x-model.number="form.volume" x-component:autospark.slider="{ min: 0, max: 100 }"></span>
```

<demo html="components/form/slider/basic.html"/>

## 指南

### min / max / step

**类型**: `number`
**默认**: `0` / `100` / `1`

数值边界与步长：同步为原生 range 的 `min` / `max` / `step` 属性——点击 / 拖拽取值原生刻度语义；组件侧另有 JS 自持夹取（越界写入防御，`max <= min` 时按 `min + 1` 防除零）。

### 值通道（x-model 桥）

**受控真相走宿主 `x-model`**：组件把宿主 `el.value` 劫持桥接到内层原生 range——原生 `input` 事件（拖动每帧）自然冒泡经过宿主被 `x-model` 直接监听，无须手动派发（原生控件自带 value 语义，ADR-0020 决策 5 同款）。

`value` 属性是**非受控初值 / 单向同步值**：无 x-model 时外部状态变化会写入 range（单向，等值短路防回环），受控场景请恒用 `x-model`。

```html
<!-- 双向绑定（推荐，.number 保真数字类型） -->
<span x-model.number="form.volume" x-component:autospark.slider></span>
<!-- 单向同步（无回写） -->
<span x-component:autospark.slider="{ value: form.volume }"></span>
```

### showInput 数值输入联动

**类型**: `boolean`
**默认**: `false`

在场时右侧渲染 [InputNumber](./input-number.md) 并双向联动：拖动滑块实时同步输入框显示；输入框 blur 确认后反向驱动滑块。**跨产物组合**——模板内以组件名引用 `autospark.input-number` 不构成构建依赖，按需加载场景须同时引入 `autospark.input-number.js`（聚合产物 `autospark.plugins.js` 无此问题）。

<demo html="components/form/slider/variants.html"/>

### change 事件（松手确认）

原生 change（松手）被组件在 capture 阶段归位（clamp 防御）后阻断，重派发自定义 `change` 事件（冒泡，`detail = { value }`，value 为 `number`）；拖动过程只有原生 `input` 冒泡（x-model 随动），松手才确认。表单同步惯用法：

```html
<div @change="form.volume = $event.detail.value">
  <span x-model.number="form.volume" x-component:autospark.slider></span>
</div>
```

### disabled / readonly

**类型**: `boolean`
**默认**: `false`

`disabled` 由骨架同步到内层 range（原生交互阻断）+ 宿主 `data-disabled` 反射（淡化 + 禁点）；`readonly` 无原生语义（range 忽略 readOnly 属性），组件经宿主 `data-readonly` 反射后以 `pointer-events: none` 阻断交互（值不可变语义，无禁用淡化）。

### status 状态色（x-field 协作）

**类型**: `"" | "error" | "success" | "warning"`
**默认**: `""`

表单域状态色通道（base-field 骨架）：填充段与滑块描边消费 `--asc-field-tone`（status 在场随语义色联动）；`error` 态同步 `aria-invalid`。校验结果来自 x-field（组件不做校验，ADR-0020 决策 1）。

### 表单提交（原生直提交）

宿主 `name` 属性自动透传到内层 range——原生表单提交 / `FormData` 语义直接生效（range 即真身，无须 hidden 代理——对照 Switch 自绘控件的 hidden 载体分叉，ADR-0020 决策 6）。

### 主题化

组件根占满父宽（块级滑动形态）。尺寸档位：任意祖先容器挂 `data-size="x-small | small | medium | large | x-large"`（theme 手动通道）整片生效——轨道 / 滑块 em 基准随字号缩放；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-slider-*`（如 `--asc-slider-track`、`--asc-slider-thumb`）与骨架通道 `--asc-field-*`；均可被同名覆盖变量接管（三级回退链第二级）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| value | `number` | `0` | 非受控初值 / 单向同步值（NaN 防御：非法归 min；受控真相走宿主 x-model） |
| min | `number` | `0` | 下界（同步原生 min；JS 自持夹取） |
| max | `number` | `100` | 上界（<= min 时按 min+1 防御） |
| step | `number` | `1` | 步长（同步原生 step 刻度语义；<=0 视为 1） |
| showInput | `boolean` | `false` | 数值输入联动（内嵌 autospark.input-number 双向同步；须同引其产物） |
| status | `"" \| error \| success \| warning` | `""` | 状态色通道（base-field 骨架；tone 联动填充段与滑块） |
| disabled | `boolean` | `false` | 禁用（骨架同步 range 原生阻断 + 淡化） |
| readonly | `boolean` | `false` | 只读（pointer-events 阻断交互，无淡化） |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| input | 原生事件 | 拖动每帧冒泡过宿主（x-model 直接消费，实时随动） |
| change | `detail: { value }` | 松手确认（原生 change 被阻断，恒收到 detail 版本） |

### Slots

| 插槽 | 说明 |
|---|---|
| 默认 | 整段控件区覆盖（一般不用——传入内容会替换内层轨道结构，属逃生通道） |
