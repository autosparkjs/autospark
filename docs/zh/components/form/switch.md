# Switch 开关

## 概述

Switch 是 AutoSpark 的官方开关组件（组件库 P0 form 批，ADR-0019 合批 / ADR-0020），是 form 族中唯一的**自绘控件**（无原生对应）：轨道 + 滑块纯 CSS 自绘，可访问性自持——`role="switch"` + `aria-checked` + `tabindex` + 键盘 Space/Enter 切换（对照 Checkbox 的原生增强路线：彼保真原生语义、此自持语义，ADR-0018 决策 7 内的例外形态）。

能力面：**开/关双态**（布尔语域值桥）、**loading 态**（滑块转 CSS 旋转圈 + 阻断切换）、**disabled / readonly**、**状态色**（开态主色，status 在场随动）。label、校验文案、域布局由 engine 的 [x-form / x-field 指令](/zh/guide/engine/form/) 承担——组件只经 `status` 属性消费校验结果染色，**不双轨建域**。

组件继承 `autospark.base-field` 表单域骨架（状态色通道 / 焦点态 / disabled 同步，内部基类无文档页），**裸态无盒饰**；视觉全走 `--auto-*` 语义变量三级回退链（ADR-0129），开态底色经骨架 `--asc-field-tone` 消费、关态中性色；**不设自有尺寸属性**——轨道 em 基准随主题通道 `data-size` 挂任意祖先容器全档位跟随（button 同范式 ADR-0012）；暗色态容器裸挂 `data-dark` 即局部切换。无内置文案、不接 i18n（ADR-0018 决策 1）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.switch.js"></script>`（自举注册，产物已内嵌 base-field 注册，无须单独引入），或聚合产物 `autospark.plugins.js`。

## 快速入门

引擎之后加载组件脚本即注册完成，以指令值形态实例化；值通道直接在宿主上写 `x-model`（布尔语域，配 `.boolean` 修饰符类型保真，见[指南 · 值通道](#值通道-x-model-桥)）：

```html
<script src="autospark.js"></script>
<script src="autospark.switch.js"></script>

<span x-model.boolean="form.wifi" x-component:autospark.switch="{ label: '无线网络' }"></span>
```

<demo html="components/form/switch/basic.html"/>

## 指南

### label

**类型**: `string`
**默认**: `""`

开关旁的文案（用户传入，无 i18n）。点击**轨道或文案任一处**切换（整组热区）；键盘聚焦轨道（Tab）后 Space/Enter 切换（Space 默认滚动被阻断）。文案走 props 通道（继承形态下消费者子内容经 base-field 出口**整段替换控件区**，属逃生通道，与 Input 同款语义）。

### 值通道（x-model 桥）

**受控真相走宿主 `x-model`**：组件把宿主 `el.value` 劫持为**布尔语域**（`"true"` / `"false"` 字符串）——`x-model` 的读写都落在劫持位，切换时在宿主派发 `input` 驱动回写（state-button 布尔组桥同款惯用法）。推荐恒配 `.boolean` 修饰符（`"true"→true` 严格集转换），无修饰符时 state 为字符串。

`checked` 属性是**非受控初值 / 单向同步值**：无 x-model 时外部状态变化会同步视觉（单向），受控场景请恒用 `x-model`。

```html
<!-- 双向绑定（推荐，.boolean 类型保真） -->
<span x-model.boolean="form.wifi" x-component:autospark.switch="{ label: '无线网络' }"></span>
<!-- 单向同步（无回写） -->
<span x-component:autospark.switch="{ checked: form.wifi, label: '只读展示' }"></span>
```

### 表单提交（hidden 载体）

自绘控件无原生提名义，表单提交经内嵌 `input[type=hidden]` 载体：**value 恒为当前布尔字面串**（`"true"` / `"false"`，恒提交——value 是受控真相原样提交，state-button N>2 表单桥同构）、`name` 透传宿主；disabled 时载体随禁用**出表**（原生表单语义）。服务端按 true/false 值域约定解析。

### loading

**类型**: `boolean`
**默认**: `false`

加载态：滑块转为 CSS 旋转圈 + **阻断切换**（视觉优先于 disabled，不整体淡化——button loading 同款语义）。异步提交惯用法：`@change` 接管 → 置 loading → 请求落定后回写状态。

```html
<span
  x-component:autospark.switch="{ label: '自动同步', loading: form.saving }"
  @change="form.saving = true"
></span>
```

### disabled / readonly

**类型**: `boolean`
**默认**: `false`

disabled 由 base-field 骨架同步（宿主 `data-disabled` 整体淡化 + 载体出表）；readonly 亦阻断切换（值不可变语义）。两者均不拦截焦点（可聚焦不可切）。

### status 状态色（x-field 协作）

**类型**: `"" | "error" | "success" | "warning"`
**默认**: `""`

表单域状态色通道（base-field 骨架）：**开态底色染 `--asc-field-tone`**（缺省主色，`error`=danger / `success`=success / `warning`=warning 随动），`error` 态轨道同步 `aria-invalid="true"`。**校验结果来自 x-field**——组件不做校验，经绑定消费指令注入的 `$field.error`：

```html
<form x-form="settings">
  <div x-field="notify">
    <span x-model.boolean="settings.notify"
      x-component:autospark.switch="{ label: '接收通知', status: $field.error ? 'error' : '' }"></span>
    <em>{{ $field.error }}</em>
  </div>
</form>
```

<demo html="components/form/switch/status.html"/>

### 事件

组件默认封闭，切换派发自定义 `change`；原生 click 冒泡照常（外层 `@click` 直接消费）：

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `change` | `detail = { value: boolean }` | 切换实际发生后冒泡，detail 为新布尔值（loading/disabled/readonly 阻断时不派发） |
| `input` | 无 detail | 与 change 同刻在宿主派发（x-model 回写通道，非冒泡形态——外层监听请用 change） |

### 主题化

尺寸档位：任意祖先容器挂 `data-size="x-small | small | medium | large | x-large"`（theme 手动通道）整片生效——轨道尺寸消费字号基线（em）随档联动；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-switch-*`（如 `--asc-switch-off` 关态中性色、`--asc-switch-thumb` 滑块色）与骨架通道 `--asc-field-*`（如 `--asc-field-primary` 开态色）；均可被同名覆盖变量接管（三级回退链第二级）。滑块白色为恒定设计（暗色不换，与轨道形成恒定对比）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| label | `string` | `""` | 开关文案（点击轨道/文案任一处切换） |
| checked | `boolean` | `false` | 非受控初值 / 单向同步值（受控真相走宿主 x-model） |
| loading | `boolean` | `false` | 加载态（滑块转圈 + 阻断切换，不淡化） |
| status | `"" \| error \| success \| warning` | `""` | 状态色通道（base-field 骨架；开态底色随动，x-field 校验结果染色入口） |
| disabled | `boolean` | `false` | 禁用（阻断切换 + 整体淡化 + 载体出表） |
| readonly | `boolean` | `false` | 只读（阻断切换，值不可变语义） |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| change | `detail = { value: boolean }` | 切换后冒泡（detail = 新布尔值） |
| input | — | x-model 回写通道（宿主自身派发，非冒泡） |

### Slots

| 插槽 | 说明 |
|---|---|
| 默认 | 整段控件区覆盖（一般不用——传入内容会替换内层控件结构，属逃生通道） |
