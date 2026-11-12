# Checkbox 复选框

## 概述

Checkbox 是 AutoSpark 的官方复选框组件（组件库 P0 form 批，ADR-0019 合批 / ADR-0020），走**原生增强路线**：内层是真实的原生 `<input type="checkbox">` 控件 + 自绘勾形视觉（选中 / 半选由 `:checked` / `:indeterminate` 原生伪类驱动）——键盘切换、焦点管理、表单提交、组语义等原生能力全保留（ADR-0018 决策 7）。

能力面：**勾选双态**（布尔语域值桥）、**indeterminate 半选**（JS 通道设原生属性）、**disabled**、**状态色**。label、校验文案、域布局由 engine 的 [x-form / x-field 指令](/zh/guide/engine/form/) 承担——组件只经 `status` 属性消费校验结果染色，**不双轨建域**。

组件继承 `autospark.base-field` 表单域骨架（状态色通道 / 焦点态 / disabled 同步，内部基类无文档页），**裸态无盒饰**（不加 `.asc-field-box`）；视觉全走 `--auto-*` 语义变量三级回退链（ADR-0129），勾选底色经骨架 `--asc-field-tone` 消费（缺省主色，status 在场随动语义色）；**不设自有尺寸属性**——盒子 em 基准随主题通道 `data-size` 挂任意祖先容器全档位跟随（button 同范式 ADR-0012）；暗色态容器裸挂 `data-dark` 即局部切换。无内置文案、不接 i18n（ADR-0018 决策 1）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.checkbox.js"></script>`（自举注册，产物已内嵌 base-field 注册，无须单独引入），或聚合产物 `autospark.plugins.js`。

## 快速入门

引擎之后加载组件脚本即注册完成，以指令值形态实例化；值通道直接在宿主上写 `x-model`（布尔语域，配 `.boolean` 修饰符类型保真，见[指南 · 值通道](#值通道-x-model-桥)）：

```html
<script src="autospark.js"></script>
<script src="autospark.checkbox.js"></script>

<span x-model.boolean="form.agree" x-component:autospark.checkbox="{ label: '我已阅读并同意协议' }"></span>
```

<demo html="components/form/checkbox/basic.html"/>

## 指南

### label

**类型**: `string`
**默认**: `""`

勾选框旁的文案（用户传入，无 i18n）。点击**文字或盒子任一处**切换——结构是真实 `<label>` 包裹，原生点击转发无需配置。文案走 props 通道（继承形态下组件内嵌套插槽出口不可用，消费者子内容经 base-field 出口**整段替换控件区**，属逃生通道，与 Input 同款语义）。

### 值通道（x-model 桥）

**受控真相走宿主 `x-model`**：组件把宿主 `el.value` 劫持为**布尔语域**（`"true"` / `"false"` 字符串）——`x-model` 的读写都落在劫持位，内层原生 `change` 冒泡经过宿主时派发 `input` 驱动回写（state-button 布尔组桥同款惯用法）。推荐恒配 `.boolean` 修饰符（`"true"→true` 严格集转换），无修饰符时 state 为字符串。

`checked` 属性是**非受控初值 / 单向同步值**：无 x-model 时外部状态变化会写入勾选（单向），受控场景请恒用 `x-model`。

```html
<!-- 双向绑定（推荐，.boolean 类型保真） -->
<span x-model.boolean="form.agree" x-component:autospark.checkbox="{ label: '同意协议' }"></span>
<!-- 单向同步（无回写） -->
<span x-component:autospark.checkbox="{ checked: form.agree, label: '只读展示' }"></span>
```

### indeterminate 半选

**类型**: `boolean`
**默认**: `false`

半选态（父子级联全选场景的「部分选中」视觉：横线）。原生 `indeterminate` 属性**无 HTML 属性形态**，故经 JS 通道设原生 property，视觉由 `:indeterminate` 伪类驱动（真实浏览器支持）。半选与勾选正交；点击半选态按原生行为转为勾选。

### 表单提交（原生直提交）

内层真 input 即提交载体：勾选时提交 `name=true`、未勾选不提交（原生 checkbox 语义，ADR-0020 决策 6）。宿主 `name` 属性自动透传到内层原生控件——原生表单提交 / `FormData` 语义直接生效；`x-model` 缺省注入的 `name=路径` 同经此通道落内层。

### disabled / readonly

**类型**: `boolean`
**默认**: `false`

由 base-field 骨架统一同步到内层原生控件（`disabled` / `readOnly` 属性）+ 宿主 `data-disabled` / `data-readonly` 反射（禁用整体淡化 + 禁点光标；勾选 tone 保留可辨）。

### status 状态色（x-field 协作）

**类型**: `"" | "error" | "success" | "warning"`
**默认**: `""`

表单域状态色通道（base-field 骨架）：状态在场边框与勾选底色染对应语义色（`error`=danger / `success`=success / `warning`=warning），`error` 态内层控件同步 `aria-invalid="true"`。**校验结果来自 x-field**——组件不做校验，经绑定消费指令注入的 `$field.error`：

```html
<form x-form="survey">
  <div x-field="agree">
    <span x-model.boolean="survey.agree"
      x-component:autospark.checkbox="{ label: '同意协议', status: $field.error ? 'error' : '' }"></span>
    <em>{{ $field.error }}</em>
  </div>
</form>
```

<demo html="components/form/checkbox/status.html"/>

### 事件

组件默认封闭，**原生事件经冒泡到外层消费**（不自定义事件面）：

| 事件 | 说明 |
| --- | --- |
| `change` | 内层原生控件事件自然冒泡（外层 `@change` 直接消费；切换同时组件在宿主派发 `input` 驱动 x-model 回写） |

### 主题化

尺寸档位：任意祖先容器挂 `data-size="x-small | small | medium | large | x-large"`（theme 手动通道）整片生效——盒子尺寸消费字号基线（em）随档联动；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-checkbox-*`（如 `--asc-checkbox-border`、`--asc-checkbox-bg`、`--asc-checkbox-radius`、`--asc-checkbox-check` 勾形色）与骨架通道 `--asc-field-*`（如 `--asc-field-primary`）；均可被同名覆盖变量接管（三级回退链第二级）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| label | `string` | `""` | 勾选框文案（点击文字/盒子任一处切换） |
| checked | `boolean` | `false` | 非受控初值 / 单向同步值（受控真相走宿主 x-model） |
| indeterminate | `boolean` | `false` | 半选态（JS 通道设原生属性；与勾选正交） |
| status | `"" \| error \| success \| warning` | `""` | 状态色通道（base-field 骨架；x-field 校验结果染色入口） |
| disabled | `boolean` | `false` | 禁用（骨架同步原生控件） |
| readonly | `boolean` | `false` | 只读（骨架同步原生控件） |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| change | 原生事件 | 内层原生控件事件冒泡（外层 `@change` 消费） |

### Slots

| 插槽 | 说明 |
|---|---|
| 默认 | 整段控件区覆盖（一般不用——传入内容会替换内层控件结构，属逃生通道） |
