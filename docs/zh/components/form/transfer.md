# Transfer 穿梭框

## 概述

Transfer 是 AutoSpark 的官方穿梭框组件（组件库 P3 form 批重件，ADR-0028）：双列表（源/目标）+ 中间穿梭钮，用于两集合间批量迁移成员。复选项**组合** `autospark.checkbox`（table 行选择先例直承——产物内嵌注册，无须另引），列表区**复制** list 结构（视觉同源经 CSS 变量达成，ADR-0028 决策 1），穿梭钮自绘原生 button（button 同档视觉）。

能力面：行勾选 / 行点击等价切换、**头部全选**（按当前过滤视图可用项派生半选态）、**filterable** 本地搜索（每侧独立、过滤不清选中集）、**titles** 双列表标题、底部计数「N / M 项」、**disabled** 整体禁用 + 行级 `disabled` 数据项。按钮态与选中集联动——有选中才可穿梭。

组件继承 `autospark.base` 取主题档位（复合控件不继承 field 骨架——无盒饰/焦点环语义面，disabled 自持）；视觉全走 `--auto-*` 语义变量三级回退链（ADR-0129），字号 em 基准经主题通道 `data-size` 挂任意祖先容器全档位跟随。内置文案三条走 i18n 词典（`transfer.search` / `transfer.total` / `transfer.empty`，回退硬编码中文，ADR-0018 决策 6 约定 1）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.transfer.js"></script>`（自举注册，产物已内嵌 checkbox + field 注册）；**无跨产物运行时依赖**，单独引入即用。

## 快速入门

引擎之后加载组件脚本即注册完成，以元素名形态实例化（ADR-0117——静态属性直写、绑定走 `:属性`）；值通道直接在宿主上写 `x-model`（数组语域，见[指南 · 值通道](#值通道-x-model-桥)）。`data` 数据数组**经状态引用注入**（引擎值对象内的字面量数组 props 存在无限更新缺陷，修复在途）：

```html
<script src="autospark.js"></script>
<script src="autospark.transfer.js"></script>

<x-transfer x-model="form.cities" :data="cities" :titles="['可选', '已选']"></x-transfer>
```

```js
new AutoSpark(el, {
  form: { cities: ["sz"] },
  cities: [
    { key: "bj", label: "北京" },
    { key: "sh", label: "上海", disabled: true },
  ],
});
```

<demo html="components/form/transfer/basic.html"/>

## 指南

### data 数据源

**类型**: `Array<{ key, label, disabled? }>`
**默认**: `[]`

成员数组，**经 x-data / 构造器状态引用注入**（`data: myData`）；支持运行时整体替换（两侧列表热更新）。`key` 是成员标识（穿梭值域载体，**字符串归一比较**——数值与字符串互认；**不含逗号**——hidden 载体与 x-model 桥的提交域是逗号拼接），`label` 是呈现文案，`disabled` 项淡化且不可选中/穿梭（已在目标侧的禁用项不可移回）。

> **字面量数组陷阱**：`data` / `titles` / `value` 的字面量写法会触发引擎值对象 props 的无限更新缺陷（修复在途）——一律经状态引用注入。

### titles 双列表标题

**类型**: `string[]`（`[源标题, 目标题]`）
**默认**: `[]`（无标题）

列表头部呈现「全选 checkbox + 标题」；缺省不渲染标题文案（头部仍有全选）。

### 值通道（x-model 桥）

**受控真相走宿主 `x-model`**：组件把宿主 `el.value` 劫持为**数组语域**（目标侧 key 数组，value 顺序恒为 `data` 声明序——任何穿梭后按 data 过滤 canonical 重建，值序可预测）。穿梭路径派发 `input`（非冒泡，x-model 宿主监听回写 state）+ `change`（冒泡，`detail = { value }`，外层消费）。`value` 属性是**非受控初值 / 单向同步值**（快照序：x-model 初值 > props.value）。

```html
<!-- 双向绑定（推荐） -->
<x-transfer x-model="form.cities" :data="cities"></x-transfer>
<!-- 单向同步（无回写） -->
<x-transfer :data="cities" :value="form.cities"></x-transfer>
```

> **数组经 x-model 通道往返呈逗号拼接字符串**（引擎对 text-like 控件的 state→DOM 写入恒 String() 归一）——桥内部双向兼容解析，state 侧拿到的恒为数组；提交域约束「key 不含逗号」即源于此。

### 选中集与穿梭联动

- **单一选中集**跨两侧共用（同一 key 任一时刻只在一侧）；行勾选（checkbox 点击）与行点击（点行文字）等价切换；
- **按钮态与选中集联动**：无选中（或整体禁用）时穿梭钮禁用；选中集 ∩ 对应侧非空才可穿梭——**跨过滤维度**（被过滤隐藏的选中仍可穿梭）；
- 穿梭后**仅清移动侧选中**（目标侧选中保留，可继续反向穿梭）。

### 头部全选（过滤视图派生）

头部全选 checkbox 作用于**当前过滤视图的可用项**（disabled 项跳过）：部分选中呈半选态（`indeterminate`），半选态点击 → 全选（原生行为对齐）。全选不波及未过滤项。

### filterable 本地搜索

**类型**: `boolean`
**默认**: `false`

每侧列表出现独立过滤框（placeholder 走词典 `transfer.search`，回退「请输入搜索内容」），对成员 `label` 做**不区分大小写包含匹配**。**过滤词不清选中集**（antd 同款语义）；底部计数恒全量「N / M 项」不随过滤变化。空列表 / 无匹配呈现空态文案（词典 `transfer.empty`，回退「暂无数据」）。

### disabled 整体禁用

**类型**: `boolean`
**默认**: `false`

整体禁用：宿主 `data-disabled` 反射 + 整体淡化 + 勾选/穿梭/搜索全阻断 + hidden 载体出表。

### 表单提交（hidden 载体）

内嵌 `input[type=hidden]` 表单载体：宿主 `name` 透传（元素名形态 `name` 属性折叠为 props 优先 / 值对象形态宿主属性直读），提交值 = 目标侧 key **逗号拼接**字符串；禁用时载体出表。原生表单提交 / `FormData` 直接生效。

### 事件

| 事件 | 说明 |
| --- | --- |
| `change` | 穿梭变更值时冒泡派发，`detail = { value }`（目标侧 key 数组）——外层 `@change` 挂**内层包裹元素**消费（engine 根元素上 `@事件` 绑定不生效） |
| `input` | 同路径非冒泡派发（x-model 专用通道） |

> 组件内部的行 checkbox / 过滤框原生事件已在组件内拦截，不外泄冒泡（外层 `@change` 只会收到本组件的 `detail={value}` 派发）。

### 主题化

尺寸档位：任意祖先容器挂 `data-size="x-small | small | medium | large | x-large"` 整片生效（em 基准随档缩放——列表行高/穿梭钮/过滤框全联动）；暗色：整页经主题暗色模式自动跟随，局部容器裸挂 `data-dark` 亦可。使用者覆盖通道 `--asc-transfer-*`（如 `--asc-transfer-height` 列表高度、`--asc-transfer-item-hover-bg`、`--asc-transfer-placeholder`）。

### 写法对照（元素名 vs 值对象）

元素名形态是推荐写法（ADR-0117）；`x-component` 值对象形态完全等价（props 经值对象注入）：

```html
<x-transfer :data="cities" filterable="true"></x-transfer>
<div x-component:autospark.transfer="{ data: cities, filterable: true }"></div>
```

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| data | `Array<{ key, label, disabled? }>` | `[]` | 成员数组（**状态引用注入**，支持运行时整体替换；key 字符串归一、不含逗号） |
| value | `string[] \| number[]` | `[]` | 目标侧 key 数组（非受控初值 / 单向同步值；受控真相走宿主 x-model） |
| titles | `string[]` | `[]` | 双列表标题 `[源, 目标]`（缺省无标题） |
| filterable | `boolean` | `false` | 本地搜索（每侧独立，label 包含匹配；过滤不清选中集） |
| disabled | `boolean` | `false` | 整体禁用（勾选/穿梭/搜索全阻断 + 载体出表） |
| name | `string` | `""` | 表单提交名（元素名形态属性折叠 props 优先，回退宿主属性） |

### 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| change | `detail: { value }` | 穿梭变更值冒泡派发（value = 目标侧 key 数组，data 声明序） |
| input | 原生事件 | 同路径非冒泡派发（x-model 回写通道） |

### Slots

| 插槽 | 说明 |
|---|---|
| — | 不开插槽（复合控件结构自持；行内容经 `data` 数据驱动） |
