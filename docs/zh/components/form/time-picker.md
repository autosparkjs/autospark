# TimePicker 时间选择器

## 概述

TimePicker 是 AutoSpark 的官方时间选择器组件（组件库 P3 时间族，ADR-0025），属**弹层交互自绘**形态：触发器是 Field 盒饰形态（`autospark.field` 骨架继承，input/select 同款 chrome），时间面板为**两列滚动列表**（时 0-23 / 分 0-59——刻度转盘形态的取舍声明见 ADR-0025 决策 2），**不自建弹层**——复用 [x-popover 指令](/zh/guide/directives/x-popover.md)机制呈现（点击切换 / 面板外点击 / ESC 关闭全部机制继承）。

选择语义（与 select 的关键分叉）：点选时/分格**部分提交**——更新 value 对应位 + `change` 派发 + **面板保持开**（两列需连续两次点选，先选时再选分）；空值状态点选时列得 `"HH:00"`（分位缺省 0）、点选分列得 `"00:MM"`。秒列与面板内两列间键盘漫游裁剪（P3 按简，ADR-0025 边界声明）。

值语域 `"HH:mm"` 字符串；label、校验文案、域布局由 engine 的 [x-form / x-field 指令](/zh/guide/engine/form/) 承担。组件继承 `autospark.field` 表单域骨架，视觉全走 `--auto-*` 语义变量三级回退链（ADR-0129）；格位 hover/选中语义色经 `--asc-tone` 中转；尺寸经主题通道 `data-size` 全档位跟随。内置文案一条走 i18n 词典（`time-picker.placeholder`，回退「请选择时间」）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.time-picker.js"></script>`（自举注册，产物已内嵌 field 注册）；**面板呈现依赖 x-popover 指令，须同时引入 `autospark.overlay.js`**（聚合产物无此问题）。

## 快速入门

引擎与 overlay 之后加载组件脚本即注册完成，以元素名标签形态实例化：

```html
<script src="autospark.js"></script>
<script src="autospark.overlay.js"></script>
<script src="autospark.time-picker.js"></script>

<x-time-picker x-model="form.time"></x-time-picker>
```

```js
new AutoSpark(el, {
  form: { time: "09:30" },
});
```

<demo html="components/form/time-picker/basic.html"/>

## 指南

### 值通道（x-model 桥）

**受控真相走宿主 `x-model`**：组件把宿主 `el.value` 劫持桥接到组件值域（`"HH:mm"` 字符串语域）——点选 / 清除路径手动派发 `input`（非冒泡，x-model 宿主监听直接命中回写 state）+ `change`（冒泡，`detail = { value }`，外层消费）。`value` 属性是**非受控初值 / 单向同步值**（快照序：x-model 初值 > props.value）。

```html
<!-- 双向绑定（推荐） -->
<x-time-picker x-model="form.time"></x-time-picker>
<!-- 单向同步（无回写） -->
<x-time-picker :value="form.time"></x-time-picker>
<!-- 非受控初值（字面量） -->
<x-time-picker value="09:30"></x-time-picker>
```

> **两列连续选择的 change 连发**：先点时格再点分格会连发两次 `change`（值确实变了两次——诚实语义，ADR-0025）；外层按 `detail.value` 终值消费即可。

### 部分提交语义

点选时格只更新时位（分位保留当前值或缺省 0），点选分格只更新分位（时位同理）——每次点选立即提交并保持面板打开；面板关闭走 popover 机制通道（面板外点击 / ESC）或再点触发器。需要「选中即关」的离散时间点场景请用 [TimeSelect](/zh/components/form/time-select.md)。

### 键盘（按简）

| 键 | 行为 |
| --- | --- |
| `Enter` / `↓` | 未开先开面板；已开收起确认 |
| `Escape` | 关闭面板（popover 打开栈机制继承，不拦截） |
| `Tab` | 自然移焦 |

面板内两列间键盘漫游裁剪（P3 按简边界，ADR-0025）。

### placeholder 占位文案

**类型**: `string`
**默认**: `""`（走词典）

空值占位文案：props 显式值优先；缺省走 i18n 词典 `time-picker.placeholder` 键，未装 i18n 插件或词典无此键时回退硬编码「请选择时间」。

### clearable 可清除

**类型**: `boolean`
**默认**: `false`

值非空且可交互时显示清除钮（内部动作件，点击不转发焦点）：清空值 + `input` / `change` 双派发 + 焦点回触发器。点击清除**不会**误开面板（阻断冒泡）；清除后 `detail = { value: "" }`（字符串空语域）。元素名写法下裸属性（`clearable`）与显式布尔（`clearable="true"`）等价。

### disabled / readonly / status

**类型**: `boolean` / `boolean` / `"" | "error" | "success" | "warning"`
**默认**: `false` / `false` / `""`

`disabled`：整体淡化 + 触发器退出焦点序 + 表单载体出表 + CSS 拦截点击开面板；`readonly`：**可开面板浏览但点选被阻断**；`status` 经 field 骨架染边框与焦点环（`error` 态同步 `aria-invalid`）：

```html
<form x-form="meet">
  <div x-field="start">
    <x-time-picker x-model="meet.start"
      :status="$field.error ? 'error' : ''"></x-time-picker>
    <em>{{ $field.error }}</em>
  </div>
</form>
```

<demo html="components/form/time-picker/status.html"/>

### 表单提交（hidden 载体）

内嵌 `input[type=hidden]` 表单载体：宿主 `name` 透传（元素名写法下 `name` 属性折叠为 props——双通道合取），提交值恒为当前值的字符串形态；禁用时载体出表。

### 事件

| 事件 | 说明 |
| --- | --- |
| `change` | 部分提交 / 清除路径冒泡派发，`detail = { value }`——外层 `@change` 挂**内层包裹元素**消费 |
| `input` | 同路径非冒泡派发（x-model 专用通道） |

### 主题化

尺寸档位：任意祖先容器挂 `data-size`（theme 手动通道）整片生效——触发器高度 / 内距随档联动，面板字号与格位随档（em 基准）；暗色：整页经主题暗色模式自动跟随（弹层在 body 容器渲染，**局部** `data-dark` 容器不覆盖弹层兜底值）。使用者覆盖通道 `--asc-time-picker-*`（如 `--asc-time-picker-placeholder`、`--asc-time-picker-max-height`）与骨架通道 `--asc-field-*`。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| value | `string` | `""` | 非受控初值 / 单向同步值（"HH:mm"；受控真相走宿主 x-model） |
| placeholder | `string` | `""` | 占位文案（缺省走词典 time-picker.placeholder，回退「请选择时间」） |
| clearable | `boolean` | `false` | 清除钮（非空显形，清空 + input/change 双派发） |
| status | `"" \| error \| success \| warning` | `""` | 状态色通道（field 骨架；x-field 校验结果染色入口） |
| disabled | `boolean` | `false` | 禁用（淡化 + 退出焦点序 + 载体出表 + 不可开面板） |
| readonly | `boolean` | `false` | 只读（可开面板浏览，点选被阻断） |
| name | `string` | `""` | 表单载体名（元素名写法下 name 属性折叠为 props；与宿主属性双通道） |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| change | `detail: { value }` | 部分提交 / 清除路径冒泡派发（两列连续选择会连发） |
| input | 原生事件 | 同路径非冒泡派发（x-model 回写通道） |

### Slots

| 插槽 | 说明 |
|---|---|
| — | 不开插槽（继承形态嵌套插槽出口被忽略，ADR-0056——文案走 props 与词典） |
