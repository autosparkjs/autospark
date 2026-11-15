# TimeSelect 时间点下拉

## 概述

TimeSelect 是 AutoSpark 的官方时间点下拉组件（组件库 P3 时间族，ADR-0025）——比 [TimePicker](/zh/components/form/time-picker.md) 轻：按**起止/步长**生成离散时间点列表直接作为选项，交互是 [Select](/zh/components/form/select.md) 范式的简单列表面板直系克隆（点选即关 / 上下键高亮 + Enter 确认 / fit 宽度匹配 + uid 配对 min-width——面板与 select 下拉同款观感）。触发器是 Field 盒饰形态（`autospark.field` 骨架继承），面板**不自建弹层**——复用 [x-popover 指令](/zh/guide/directives/x-popover.md)机制呈现。

适用分界：固定间隔的可选时间点（预约时段、营业时间）用本件；任意时分组合用 time-picker。

值语域 `"HH:mm"` 字符串（落在列表内才有选中标记）；label、校验文案、域布局由 engine 的 [x-form / x-field 指令](/zh/guide/engine/form/) 承担。视觉全走 `--auto-*` 语义变量三级回退链（ADR-0129）；内置文案两条走 i18n 词典（`time-select.placeholder` 回退「请选择时间」、`time-select.empty` 回退「暂无数据」——病态起止配置兜底）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.time-select.js"></script>`（自举注册，产物已内嵌 field 注册）；**面板呈现依赖 x-popover 指令，须同时引入 `autospark.overlay.js`**（聚合产物无此问题）。

## 快速入门

引擎与 overlay 之后加载组件脚本即注册完成，以元素名标签形态实例化（缺省 00:00 → 23:00 步 30 分，47 个时间点）：

```html
<script src="autospark.js"></script>
<script src="autospark.overlay.js"></script>
<script src="autospark.time-select.js"></script>

<x-time-select x-model="form.time"></x-time-select>
```

```js
new AutoSpark(el, {
  form: { time: "09:30" },
});
```

<demo html="components/form/time-select/basic.html"/>

## 指南

### start / end / step 起止步长

**类型**: `string`
**默认**: `"00:00"` / `"23:00"` / `"00:30"`

生成规则：从 `start` 到 `end` **含端**、按 `step` 分钟粒度步进生成离散时间点（`"HH:mm"` 形态字符串）。非法步长（≤0 分钟）回退 30 分钟；列表长度防御上限 2000；`start > end` 之类病态区间渲染空态（词典 `time-select.empty` 回退「暂无数据」）。运行时变化（绑定或状态引用）列表热更新：

```html
<!-- 静态属性（元素名写法折叠为 props） -->
<x-time-select start="08:00" end="12:00" step="00:15"></x-time-select>
<!-- 绑定形态（响应式） -->
<x-time-select :start="cfg.from" :end="cfg.to" :step="cfg.by"></x-time-select>
```

### 值通道（x-model 桥）

**受控真相走宿主 `x-model`**：组件把宿主 `el.value` 劫持桥接到组件值域（`"HH:mm"` 字符串语域）——选中 / 清除路径手动派发 `input`（非冒泡）+ `change`（冒泡，`detail = { value }`）。`value` 属性是**非受控初值 / 单向同步值**（快照序：x-model 初值 > props.value）；值不在列表内时正常展示但无选中标记。

```html
<!-- 双向绑定（推荐） -->
<x-time-select x-model="form.time"></x-time-select>
<!-- 单向同步（无回写） -->
<x-time-select :value="form.time"></x-time-select>
<!-- 非受控初值（字面量） -->
<x-time-select value="09:30"></x-time-select>
```

> **绑定 x-data 局部域路径的已知边界**：x-model 写入按全局路径解析——建模请用构造器全局状态（引擎修复在途，见 ADR-0022 遗留）。

### 键盘导航（select 同款）

触发器聚焦（`tabindex=0`，role=combobox）后：

| 键 | 行为 |
| --- | --- |
| `↑` / `↓` | 未开先开面板；已开移动高亮（首尾环绕），打开时高亮落当前选中项（无选中落首项） |
| `Enter` | 未开先开面板；已开确认当前高亮项（选中 + 关面板 + 焦点回触发器） |
| `Escape` | 关闭面板（popover 打开栈机制继承，不拦截） |
| `Tab` | 自然移焦 |

### placeholder 占位文案

**类型**: `string`
**默认**: `""`（走词典）

空值占位文案：props 显式值优先；缺省走 i18n 词典 `time-select.placeholder` 键，回退硬编码「请选择时间」。

### clearable 可清除

**类型**: `boolean`
**默认**: `false`

值非空且可交互时显示清除钮：清空值 + `input` / `change` 双派发 + 焦点回触发器；清除后 `detail = { value: "" }`（字符串空语域）。元素名写法下裸属性（`clearable`）与显式布尔（`clearable="true"`）等价。

### disabled / readonly / status

**类型**: `boolean` / `boolean` / `"" | "error" | "success" | "warning"`
**默认**: `false` / `false` / `""`

`disabled`：整体淡化 + 触发器退出焦点序 + 表单载体出表 + CSS 拦截点击开面板；`readonly`：**可开面板浏览但选项不可选**；`status` 经 field 骨架染边框与焦点环（`error` 态同步 `aria-invalid`）：

```html
<form x-form="meet">
  <div x-field="slot">
    <x-time-select x-model="meet.slot"
      :status="$field.error ? 'error' : ''"></x-time-select>
    <em>{{ $field.error }}</em>
  </div>
</form>
```

<demo html="components/form/time-select/range.html"/>

### 表单提交（hidden 载体）

内嵌 `input[type=hidden]` 表单载体：宿主 `name` 透传（元素名写法下 `name` 属性折叠为 props——双通道合取），提交值恒为当前值的字符串形态；禁用时载体出表。

### 事件

| 事件 | 说明 |
| --- | --- |
| `change` | 用户交互变更值时冒泡派发（选中 / 清除），`detail = { value }`——外层 `@change` 挂**内层包裹元素**消费 |
| `input` | 同路径非冒泡派发（x-model 专用通道） |

### 与 select / time-picker 的边界（ADR-0025）

- 与 select：本件是离散时间点的**专用轻件**（无 filterable / virtual / disabled 选项 / 自定义 options——选项由 start/end/step 生成恒可用）；需要任意选项集用 select。
- 与 time-picker：本件点选**即关面板**（单列离散选项语义）；time-picker 是两列**部分提交**（面板保持开）。互不替代。

### 主题化

尺寸档位：任意祖先容器挂 `data-size`（theme 手动通道）整片生效；面板宽度走 select 同款 fit + uid 配对 min-width 两段合成（随触发器盒宽，重开自适应）。暗色：整页经主题暗色模式自动跟随（弹层在 body 容器渲染，**局部** `data-dark` 容器不覆盖弹层兜底值）。使用者覆盖通道 `--asc-time-select-*`（如 `--asc-time-select-placeholder`、`--asc-time-select-max-height`）与骨架通道 `--asc-field-*`。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| value | `string` | `""` | 非受控初值 / 单向同步值（"HH:mm"；受控真相走宿主 x-model） |
| start | `string` | `"00:00"` | 起始时间（含端） |
| end | `string` | `"23:00"` | 结束时间（含端） |
| step | `string` | `"00:30"` | 步长（分钟粒度；非法回退 30） |
| placeholder | `string` | `""` | 占位文案（缺省走词典 time-select.placeholder，回退「请选择时间」） |
| clearable | `boolean` | `false` | 清除钮（非空显形，清空 + input/change 双派发） |
| status | `"" \| error \| success \| warning` | `""` | 状态色通道（field 骨架；x-field 校验结果染色入口） |
| disabled | `boolean` | `false` | 禁用（淡化 + 退出焦点序 + 载体出表 + 不可开面板） |
| readonly | `boolean` | `false` | 只读（可开面板浏览，选项不可选） |
| name | `string` | `""` | 表单载体名（元素名写法下 name 属性折叠为 props；与宿主属性双通道） |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| change | `detail: { value }` | 用户交互变更值（选中 / 清除）冒泡派发（字符串空语域） |
| input | 原生事件 | 同路径非冒泡派发（x-model 回写通道） |

### Slots

| 插槽 | 说明 |
|---|---|
| — | 不开插槽（继承形态嵌套插槽出口被忽略，ADR-0056——文案走 props 与词典） |
