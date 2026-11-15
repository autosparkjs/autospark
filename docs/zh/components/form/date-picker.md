# DatePicker 日期选择器

## 概述

DatePicker 是 AutoSpark 的官方日期选择器组件（组件库 P3 时间族，ADR-0025），属**弹层交互自绘**形态（ADR-0018 决策 7；完整日历组件不入清单——日历仅作本件内部面板，排除域裁定）：触发器是 Field 盒饰形态（`autospark.field` 骨架继承，input/select 同款 chrome），内部日历面板（月视图：星期表头 + 6×7 日格、月份前后钮 + 今天快捷）**不自建弹层**——复用 [x-popover 指令](/zh/guide/directives/x-popover.md)机制呈现（点击切换 / 面板外点击 / ESC 关闭全部机制继承），面板宽度由日历内容自定。

值语域 `"YYYY-MM-DD"` 字符串起步（自定义 format P4 按需另立 ADR）；label、校验文案、域布局由 engine 的 [x-form / x-field 指令](/zh/guide/engine/form/) 承担——组件只经 `status` 属性消费校验结果染色，不双轨建域。

组件继承 `autospark.field` 表单域骨架（内部基类无文档页），视觉全走 `--auto-*` 语义变量三级回退链（ADR-0129）；日历格 hover/选中语义色经 `--asc-tone` 中转（alert/tag 定型结构）；不设自有尺寸属性——高度/内距消费 `--auto-input-height` / `--auto-input-padding`，经主题通道 `data-size` 挂任意祖先容器全档位跟随。内置文案四条走 i18n 词典（`date-picker.placeholder` / `weekdays` / `month-format` / `today`，回退硬编码中文，ADR-0018 决策 6 约定 1；语言切换以下次开面板生效为界）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.date-picker.js"></script>`（自举注册，产物已内嵌 field 注册）；**面板呈现依赖 x-popover 指令，须同时引入 `autospark.overlay.js`**（聚合产物 `autospark.plugins.js` 无此问题）。

## 快速入门

引擎与 overlay 之后加载组件脚本即注册完成，以元素名标签形态实例化（值通道直接在宿主上写 `x-model`，值桥协议见[指南 · 值通道](#值通道-x-model-桥)）：

```html
<script src="autospark.js"></script>
<script src="autospark.overlay.js"></script>
<script src="autospark.date-picker.js"></script>

<x-date-picker x-model="form.date"></x-date-picker>
```

```js
new AutoSpark(el, {
  form: { date: "2026-11-13" },
});
```

<demo html="components/form/date-picker/basic.html"/>

## 指南

### 值通道（x-model 桥）

**受控真相走宿主 `x-model`**：组件把宿主 `el.value` 劫持桥接到组件值域——选中 / 清除路径手动派发 `input`（非冒泡，x-model 宿主监听直接命中回写 state）+ `change`（冒泡，`detail = { value }`，外层消费）。`value` 属性是**非受控初值 / 单向同步值**（快照序：x-model 初值 > props.value）。

```html
<!-- 双向绑定（推荐） -->
<x-date-picker x-model="form.date"></x-date-picker>
<!-- 单向同步（无回写） -->
<x-date-picker :value="form.date"></x-date-picker>
<!-- 非受控初值（字面量） -->
<x-date-picker value="2026-11-13"></x-date-picker>
```

值语域 `"YYYY-MM-DD"`（值即展示，缺省格式下无 label 解析层）；清除后 `detail = { value: "" }`（字符串空语域）。

> **绑定 x-data 局部域路径的已知边界**：x-model 写入按全局路径解析，绑 x-data 局部键时会写到 store 根层（孤儿键）——建模请用构造器全局状态（引擎修复在途，见 ADR-0022 遗留）。

### 日历面板

月视图结构：头部（上月钮 + 年月标题 + 下月钮）+ 星期表头（周日起步）+ 6×7=42 日格（邻月格淡化但可点——点击后视图随选中月归位）+ 底部今天快捷钮。打开时视图归位到值所在月（无值落当月），键盘高亮落当前值（无值落今天）。

### 键盘导航

触发器聚焦（`tabindex=0`，role=combobox）后：

| 键 | 行为 |
| --- | --- |
| `←` / `→` / `↑` / `↓` | 未开先开面板；已开日间漫游（±1 / ±7 天，**跨月自动翻页**） |
| `PageUp` / `PageDown` | 切换上/下一个月（年 rollover 自动进位） |
| `Enter` | 未开先开面板；已开确认当前高亮日（选中 + 关面板 + 焦点回触发器） |
| `Escape` | 关闭面板（popover 打开栈机制继承，不拦截） |
| `Tab` | 自然移焦 |

### placeholder 占位文案

**类型**: `string`
**默认**: `""`（走词典）

空值占位文案：props 显式值优先；缺省走 i18n 词典 `date-picker.placeholder` 键，未装 i18n 插件或词典无此键时回退硬编码「请选择日期」。星期表头 / 年月标题 / 今天钮同机制（`date-picker.weekdays` 逗号串——词典数组值是复数模式，列表类文案用单键逗号串；`date-picker.month-format` "{y}年{m}月" 插值；`date-picker.today`）。

### clearable 可清除

**类型**: `boolean`
**默认**: `false`

值非空且可交互时显示清除钮（内部动作件，点击不转发焦点）：清空值 + `input` / `change` 双派发 + 焦点回触发器。点击清除**不会**误开面板（阻断冒泡）。元素名写法下裸属性（`clearable`）与显式布尔（`clearable="true"`）等价。

### disabled / readonly / status

**类型**: `boolean` / `boolean` / `"" | "error" | "success" | "warning"`
**默认**: `false` / `false` / `""`

`disabled`：整体淡化 + 触发器退出焦点序（tabindex=-1）+ 表单载体出表 + CSS 拦截点击开面板；`readonly`：**可开面板浏览但日期不可选**（只读可见可选不了）；`status` 经 field 骨架染边框与焦点环（`error` 态同步 `aria-invalid`），校验结果来自 x-field（组件不做校验）：

```html
<form x-form="signup">
  <div x-field="birthday">
    <x-date-picker x-model="signup.birthday"
      :status="$field.error ? 'error' : ''"></x-date-picker>
    <em>{{ $field.error }}</em>
  </div>
</form>
```

<demo html="components/form/date-picker/keyboard.html"/>

### 表单提交（hidden 载体）

内嵌 `input[type=hidden]` 表单载体：宿主 `name` 透传（元素名写法下 `name` 属性与值对象写法的宿主属性双通道合取），提交值恒为当前值的字符串形态（switch / select 同款载体语义）；禁用时载体出表。原生表单提交 / `FormData` 直接生效。

### 事件

| 事件 | 说明 |
| --- | --- |
| `change` | 用户交互变更值时冒泡派发（选中 / 清除），`detail = { value }`——外层 `@change` 挂**内层包裹元素**消费（engine 根元素上 `@事件` 绑定不生效） |
| `input` | 同路径非冒泡派发（x-model 专用通道） |

### 与 x-popover 的组合边界（ADR-0025）

面板的呈现 / 定位 / 关闭触点 / 层级全部由 x-popover 机制承担，组件不自建弹层；组件侧自实现日历内容与交互（网格渲染 / 月份切换 / 键盘漫游 / 选中联动）。面板与触发器的通信走 scope 链（哨兵键协议，ADR-0022 决策 2 沿袭）；面板内部注册名用连字符形态 `autospark-date-picker-panel`（x-popover attr 参数点号切分的引擎缺口免疫）。

### 主题化

尺寸档位：任意祖先容器挂 `data-size="x-small | small | medium | large | x-large"`（theme 手动通道）整片生效——触发器高度 / 内距消费 `--auto-input-height` / `--auto-input-padding` 随档联动，日历格与面板字号随档（em 基准）；暗色：整页经主题暗色模式自动跟随（弹层在 body 容器渲染，**局部** `data-dark` 容器不覆盖弹层兜底值）。使用者覆盖通道 `--asc-date-picker-*`（如 `--asc-date-picker-placeholder`、`--asc-date-picker-primary`）与骨架通道 `--asc-field-*`。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| value | `string` | `""` | 非受控初值 / 单向同步值（"YYYY-MM-DD"；受控真相走宿主 x-model） |
| placeholder | `string` | `""` | 占位文案（缺省走词典 date-picker.placeholder，回退「请选择日期」） |
| clearable | `boolean` | `false` | 清除钮（非空显形，清空 + input/change 双派发） |
| status | `"" \| error \| success \| warning` | `""` | 状态色通道（field 骨架；x-field 校验结果染色入口） |
| disabled | `boolean` | `false` | 禁用（淡化 + 退出焦点序 + 载体出表 + 不可开面板） |
| readonly | `boolean` | `false` | 只读（可开面板浏览，日期不可选） |
| name | `string` | `""` | 表单载体名（元素名写法下 name 属性折叠为 props；与宿主属性双通道） |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| change | `detail: { value }` | 用户交互变更值（选中 / 清除）冒泡派发（字符串空语域） |
| input | 原生事件 | 同路径非冒泡派发（x-model 回写通道） |

### Slots

| 插槽 | 说明 |
|---|---|
| — | 不开插槽（继承形态嵌套插槽出口被忽略，ADR-0056——文案走 props 与词典，select 同款边界） |
