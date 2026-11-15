# Select 选择器

## 概述

Select 是 AutoSpark 的官方下拉选择器组件（组件库 P1 form 批重件，ADR-0022），属**弹层交互自绘**形态（ADR-0018 决策 7）：触发器是 Field 盒饰形态（`autospark.field` 骨架继承，input 同款 chrome），下拉面板**不自建弹层**——复用 [x-popover 指令](/zh/guide/directives/x-popover.md)机制呈现（`trigger:click` 形态），点击切换 / 面板外点击 / ESC 关闭全部机制继承（ADR-0060），面板宽度经 `fit` 随触发器对齐。

能力面：**单选**（多选 `multiple` 裁剪至 P2，见 ADR-0022 边界声明）、**clearable**（清除钮）、**filterable**（本地过滤，P1 简实现）、**loading**（加载态）、**virtual**（长列表虚拟化，渐进增强）、**disabled / readonly / status**（骨架通道）。label、校验文案、域布局由 engine 的 [x-form / x-field 指令](/zh/guide/engine/form/) 承担——组件只经 `status` 属性消费校验结果染色，**不双轨建域**。

组件继承 `autospark.field` 表单域骨架（内部基类无文档页），视觉全走 `--auto-*` 语义变量三级回退链（ADR-0129）；**不设自有尺寸属性**——高度/内距消费 `--auto-input-height` / `--auto-input-padding`，经主题通道 `data-size` 挂任意祖先容器全档位跟随（button 同范式 ADR-0012）；暗色态整页经主题暗色模式跟随（弹层在 body 容器渲染，**局部** `data-dark` 容器不覆盖弹层）。内置文案仅占位与空态两条，走 i18n 词典（`select.placeholder` / `select.empty`，回退硬编码中文，ADR-0018 决策 6 约定 1）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.select.js"></script>`（自举注册，产物已内嵌 field 注册）；**面板呈现依赖 x-popover 指令，须同时引入 `autospark.overlay.js`**（聚合产物 `autospark.plugins.js` 无此问题）；长列表虚拟化另需 `autospark.virtual.js`。

## 快速入门

引擎与 overlay 之后加载组件脚本即注册完成，以指令值形态实例化；值通道直接在宿主上写 `x-model`（值桥协议，见[指南 · 值通道](#值通道-x-model-桥)）。`options` 选项数组**经状态引用注入**（引擎值对象内的字面量数组 props 存在无限更新缺陷，修复在途）：

```html
<script src="autospark.js"></script>
<script src="autospark.overlay.js"></script>
<script src="autospark.select.js"></script>

<x-select x-model="form.city" :options="cities"></x-select>
```

```js
new AutoSpark(el, {
  form: { city: "sh" },
  cities: [
    { label: "北京", value: "bj" },
    { label: "上海", value: "sh" },
  ],
});
```

<demo html="components/form/select/basic.html"/>

## 指南

### options 选项

**类型**: `Array<{ label: string, value: string | number, disabled?: boolean }>`
**默认**: `[]`

选项数组，**经 x-data / 构造器状态引用注入**（`options: myOpts`）；支持运行时整体替换（面板列表热更新）。`value` 是提交值（string / number 均可），`label` 是呈现文案，`disabled` 选项淡化且不可选（键盘导航自动跳过）。

> **字面量数组陷阱**：`{ options: [{...}] }` 字面量写法会触发引擎值对象 props 的无限更新缺陷（修复在途）——一律经状态引用注入。

### placeholder 占位文案

**类型**: `string`
**默认**: `""`（走词典）

空值占位文案：props 显式值优先；缺省走 i18n 词典 `select.placeholder` 键（可经 x-locales / 顶层 locales script / `options.i18n.messages` 覆译），未装 i18n 插件或词典无此键时回退硬编码「请选择」。空选项列表空态文案同机制（`select.empty` 键，回退「暂无数据」）。

### 值通道（x-model 桥）

**受控真相走宿主 `x-model`**：组件把宿主 `el.value` 劫持桥接到组件值域——选中 / 清除路径手动派发 `input`（非冒泡，x-model 宿主监听直接命中回写 state）+ `change`（冒泡，`detail = { value }`，外层消费）。`value` 属性是**非受控初值 / 单向同步值**（快照序：x-model 初值 > props.value，input 同款边界）。

```html

<x-select x-model="form.city" :options="cities"></x-select>

<x-select :options="cities" :value="form.city"></x-select>
```

> **值类型注记**：x-model 对 text 控件语义会把值往返归一为字符串（与原生 input 一致）——数值型 `value` 经 x-model 往返后变字符串；组件内部选项匹配已做字符串归一（`7` 与 `"7"` 互认），需要数值 state 时配 `.number` 修饰符。**绑定 x-data 局部域路径的已知边界**：x-model 写入按全局路径解析，绑 x-data 局部键时会写到 store 根层（孤儿键）——demo 建模请用构造器全局状态（引擎修复在途，见 ADR-0022 遗留）。

<demo html="components/form/select/options.html"/>

### filterable 本地过滤

**类型**: `boolean`
**默认**: `false`

面板顶部出现过滤框，对选项 `label` 做**不区分大小写包含匹配**（P1 简实现——无远程搜索 / 无自定义过滤函数）；面板关闭后过滤词自动复位。过滤框内上下键移动高亮、Enter 确认当前高亮项、ESC 关面板。

### clearable 可清除

**类型**: `boolean`
**默认**: `false`

值非空且可交互时显示清除钮（内部动作件，点击不转发焦点）：清空值 + `input` / `change` 双派发 + 焦点回触发器。点击清除**不会**误开面板（阻断冒泡）。

### loading 加载态

**类型**: `boolean`
**默认**: `false`

异步加载选项时：触发器箭头切换为旋转图标（`data-loading` 状态通道）+ 面板列表 x-loading 遮罩（engine 内置指令，零额外引入）。

### virtual 长列表虚拟化

**类型**: `boolean`
**默认**: `false`

选项数大（> 100）时开启：面板切换 `x-for.virtual` 虚拟渲染，只渲染可见窗口（**须加载 `autospark.virtual.js`**，渐进增强——缺席时引擎 warn + 降级全量渲染）。虚拟分支选项行**固定 32px**（虚拟化需确定项高——首渲染前无可测子元素，自动检测是鸡生蛋问题，规范用法恒显式声明 `itemHeight`），与普通分支的字号档位缩放解耦。

### 键盘导航

触发器聚焦（`tabindex=0`，role=combobox）后：

| 键 | 行为 |
| --- | --- |
| `ArrowUp` / `ArrowDown` | 未开先开面板；已开移动高亮（跳过禁用项，首尾环绕），打开时高亮落当前选中项 |
| `Enter` | 未开先开面板；已开确认当前高亮项（选中 + 关面板 + 焦点回触发器） |
| `Escape` | 关闭面板（popover 打开栈机制继承，不拦截） |
| `Tab` | 自然移焦 |

filterable 过滤框聚焦时，上下键 / Enter 经同一导航通道（高亮滚动跟随可见）。

### disabled / readonly / status

**类型**: `boolean` / `boolean` / `"" | "error" | "success" | "warning"`
**默认**: `false` / `false` / `""`

`disabled`：整体淡化 + 触发器退出焦点序（tabindex=-1）+ 表单载体出表 + CSS 拦截点击开面板；`readonly`：**可开面板浏览但选项不可选**（只读可见可选不了）；`status` 经 field 骨架染边框与焦点环（`error` 态同步 `aria-invalid`），校验结果来自 x-field（组件不做校验）：

```html
<form x-form="login">
  <div x-field="city">
    <x-select x-model="login.city" :options="cities" :status="$field.error ? 'error' : ''"></x-select>
    <em>{{ $field.error }}</em>
  </div>
</form>
```

<demo html="components/form/select/status.html"/>

### 表单提交（hidden 载体）

内嵌 `input[type=hidden]` 表单载体：宿主 `name` 透传，提交值恒为当前值的字符串形态（switch 同款载体语义）；禁用时载体出表。原生表单提交 / `FormData` 直接生效。

### 事件

| 事件 | 说明 |
| --- | --- |
| `change` | 用户交互变更值时冒泡派发（选中 / 清除），`detail = { value }`——外层 `@change` 挂**内层包裹元素**消费（engine 根元素上 `@事件` 绑定不生效） |
| `input` | 同路径非冒泡派发（x-model 专用通道，checkbox/switch 同款） |

### 与 x-popover 的组合边界（ADR-0022）

面板的呈现 / 定位 / 关闭触点 / 层级 / 宽度 fit 全部由 x-popover 机制承担，组件不自建弹层；组件侧自实现的是**选项内容与交互**（列表渲染 / 高亮 / 过滤 / 选中联动）。面板与触发器的通信走 scope 链（open + dataContext:host 聚合视图沿链读写，零 DOM 事件配对）。已知引擎缺口：**x-popover attr 参数的点号组件名被切为修饰符**（x-component 已修 ADR-0088，overlay 家族未跟）——面板内部注册名用连字符形态 `autospark-select-panel`。

### 主题化

尺寸档位：任意祖先容器挂 `data-size="x-small | small | medium | large | x-large"`（theme 手动通道）整片生效——触发器高度 / 内距消费 `--auto-input-height` / `--auto-input-padding` 随档联动，面板字号与行高随档（虚拟分支行高固定 32px 除外）；暗色：整页经主题暗色模式自动跟随（弹层在 body 容器，**局部** `data-dark` 容器不覆盖弹层兜底值）。使用者覆盖通道 `--asc-select-*`（如 `--asc-select-placeholder`、`--asc-select-max-height`、`--asc-select-option-hover-bg`）与骨架通道 `--asc-field-*`。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| value | `string \| number` | `null` | 非受控初值 / 单向同步值（受控真相走宿主 x-model） |
| options | `Array<{ label, value, disabled? }>` | `[]` | 选项数组（**状态引用注入**，支持运行时整体替换） |
| placeholder | `string` | `""` | 占位文案（缺省走词典 select.placeholder，回退「请选择」） |
| clearable | `boolean` | `false` | 清除钮（非空显形，清空 + input/change 双派发） |
| filterable | `boolean` | `false` | 本地过滤（label 包含匹配，P1 简实现） |
| loading | `boolean` | `false` | 加载态（箭头转旋转图标 + 面板 x-loading 遮罩） |
| virtual | `boolean` | `false` | 虚拟渲染开关（须加载 autospark.virtual.js；行高固定 32px） |
| status | `"" \| error \| success \| warning` | `""` | 状态色通道（field 骨架；x-field 校验结果染色入口） |
| disabled | `boolean` | `false` | 禁用（淡化 + 退出焦点序 + 载体出表 + 不可开面板） |
| readonly | `boolean` | `false` | 只读（可开面板浏览，选项不可选） |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| change | `detail: { value }` | 用户交互变更值（选中 / 清除）冒泡派发 |
| input | 原生事件 | 同路径非冒泡派发（x-model 回写通道） |

### Slots

| 插槽 | 说明 |
|---|---|
| — | 不开插槽（继承形态嵌套插槽出口被忽略，ADR-0056——文案走 props 与词典，ADR-0022） |
