# Radio 单选钮

## 概述

Radio 是 AutoSpark 的官方单选钮组件（组件库 P0 form 批，ADR-0019 合批 / ADR-0020），走**原生增强路线**：内层是真实的原生 `<input type="radio">` 控件 + 自绘圆点视觉（选中由 `:checked` 原生伪类驱动）——键盘切换、方向键移组、焦点管理、表单提交等原生能力全保留（ADR-0018 决策 7）。

**组语义走原生 name 同名互斥，不建组容器组件**：同 `x-model` 路径的多枚实例经引擎缺省 name 注入（`name=路径`）天然同组；或宿主显式写 `name` 属性。组样式编排（纵排 / 横排 / 间距）用 flex 容器或 [Space 间距组件](/zh/components/layout/space) 配方（见下方指南）。受控单选组（按钮形态）由 [ButtonGroup 选中模式](/zh/components/general/button-group) 承接。

组件继承 `autospark.base-field` 表单域骨架（状态色通道 / 焦点态 / disabled 同步，内部基类无文档页），**裸态无盒饰**；视觉全走 `--auto-*` 语义变量三级回退链（ADR-0129），选中圆点经骨架 `--asc-field-tone` 消费（缺省主色，status 在场随动语义色）；**不设自有尺寸属性**——圆环 em 基准随主题通道 `data-size` 挂任意祖先容器全档位跟随（button 同范式 ADR-0012）；暗色态容器裸挂 `data-dark` 即局部切换。无内置文案、不接 i18n（ADR-0018 决策 1）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.radio.js"></script>`（自举注册，产物已内嵌 base-field 注册，无须单独引入），或聚合产物 `autospark.plugins.js`。

## 快速入门

引擎之后加载组件脚本即注册完成，以指令值形态实例化；**多枚同绑一个状态路径即成组**（值通道为 checked 值桥，见[指南 · 值通道](#值通道-x-model-桥)）：

```html
<script src="autospark.js"></script>
<script src="autospark.radio.js"></script>

<span x-model="form.city" x-component:autospark.radio="{ value: 'sh', label: '上海' }"></span>
<span x-model="form.city" x-component:autospark.radio="{ value: 'bj', label: '北京' }"></span>
```

<demo html="components/form/radio/basic.html"/>

## 指南

### value / label

**类型**: `string` / `string`
**默认**: `""` / `""`

`value` 是本钮的组内唯一标识：勾选时写 `state = 本钮 value`、外部状态按值匹配勾选（`state === value`）——与 x-model 原生 radio 语义同构。`label` 是钮旁文案（点击**文字或圆环任一处**切换——真实 `<label>` 包裹）。文案走 props 通道（继承形态下消费者子内容经 base-field 出口**整段替换控件区**，属逃生通道，与 Input 同款语义）。

### 组语义（原生 name 同名互斥）

**不建组容器组件**——组互斥由原生 radio 的同名机制承担：

- **同 x-model 路径**（推荐）：引擎缺省注入 `name=路径` 透传到内层，多枚实例天然同组；
- **显式 name**：宿主写 `name="任意组名"`，跨状态路径组队；
- 组样式编排交给容器配方：

```html
<!-- 纵排组：flex 容器配方 -->
<div style="display: flex; flex-direction: column; gap: 12px">
  <span x-model="form.city" x-component:autospark.radio="{ value: 'sh', label: '上海' }"></span>
  <span x-model="form.city" x-component:autospark.radio="{ value: 'bj', label: '北京' }"></span>
</div>

<!-- Space 组件配方（间距档位化） -->
<div x-component:autospark.space="{ direction: 'vertical', size: 'small' }">
  <span x-model="form.city" x-component:autospark.radio="{ value: 'sh', label: '上海' }"></span>
  <span x-model="form.city" x-component:autospark.radio="{ value: 'bj', label: '北京' }"></span>
</div>
```

### 值通道（x-model 桥）

**受控真相走宿主 `x-model`**（checked 值桥，与 x-model 原生 radio 读写语义同构）：

- **读**：宿主 `el.value` 恒为本钮 `value`——勾选时派发 `input`，x-model 写 `state = 本钮 value`；**取消态不派发**（被勾选的另一枚接管，原生 radio 同款语义）；
- **写**：状态变更按值匹配勾选（`state === 本钮 value`），不匹配即失勾。

`checked` 属性是**非受控初值 / 单向同步值**（组内缺省勾选项用它；受控场景请恒用 `x-model`）。

### 表单提交（原生直提交）

内层真 input 即提交载体：组内**勾选项**提交 `name=value`（原生 radio 语义，ADR-0020 决策 6）。宿主 `name` 属性自动透传到内层原生控件；`x-model` 缺省注入的 `name=路径` 同经此通道落内层。

### disabled / readonly

**类型**: `boolean`
**默认**: `false`

由 base-field 骨架统一同步到内层原生控件（`disabled` / `readOnly` 属性）+ 宿主 `data-disabled` / `data-readonly` 反射（禁用整体淡化 + 禁点光标；选中 tone 保留可辨）。

### status 状态色（x-field 协作）

**类型**: `"" | "error" | "success" | "warning"`
**默认**: `""`

表单域状态色通道（base-field 骨架）：状态在场边框与选中圆点染对应语义色，`error` 态内层控件同步 `aria-invalid="true"`。**校验结果来自 x-field**——组件不做校验，经绑定消费指令注入的 `$field.error`：

```html
<form x-form="survey">
  <div x-field="city">
    <span x-model="survey.city"
      x-component:autospark.radio="{ value: 'sh', label: '上海', status: $field.error ? 'error' : '' }"></span>
    <span x-model="survey.city"
      x-component:autospark.radio="{ value: 'bj', label: '北京', status: $field.error ? 'error' : '' }"></span>
    <em>{{ $field.error }}</em>
  </div>
</form>
```

<demo html="components/form/radio/status.html"/>

### 事件

组件默认封闭，**原生事件经冒泡到外层消费**（不自定义事件面）：

| 事件 | 说明 |
| --- | --- |
| `change` | 内层原生控件事件自然冒泡（外层 `@change` 直接消费；勾选时组件另在宿主派发 `input` 驱动 x-model 回写） |

### 主题化

尺寸档位：任意祖先容器挂 `data-size="x-small | small | medium | large | x-large"`（theme 手动通道）整片生效——圆环尺寸消费字号基线（em）随档联动；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-radio-*`（如 `--asc-radio-border`、`--asc-radio-bg`）与骨架通道 `--asc-field-*`（如 `--asc-field-primary`）；均可被同名覆盖变量接管（三级回退链第二级）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| value | `string` | `""` | 本钮值（组内唯一标识；勾选写 state、按值匹配勾选的锚点） |
| label | `string` | `""` | 钮旁文案（点击文字/圆环任一处切换） |
| checked | `boolean` | `false` | 非受控初值 / 单向同步值（受控真相走宿主 x-model） |
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
