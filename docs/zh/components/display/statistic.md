# Statistic 统计数值

## 概述

Statistic 是 AutoSpark 的官方统计数值组件（组件库 P2 / display 分类，ADR-0018 清单权威表 display 行）：title 标题 + 大号数值区（prefix 前缀 + 格式化数值 + suffix 后缀）。`value` 为 number 时经 **Intl.NumberFormat 按语言环境格式化**（千分位 / 小数位修约 / 自定义分组符）；string 原样直出。纯展示无事件。

**语言环境联动**（ADR-0018 决策 6 精神）：locale 取全局状态 `$.language`（i18n 插件在场时的当前语言）——语言切换即时重算；未装 i18n / 未设置时回退 `zh` 缺省（依赖松弛不强制）。

**边界声明**：倒计时形态不做——countdown 是独立件（P4，ADR-0018 清单 other 行）；数值动画（滚动渐变）不在首版范围。

引入方式：引擎之后加载 `<script src="/autospark/autospark.statistic.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。无跨插件依赖。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.statistic.js"></script>

<x-statistic title="商品总数" :value="total"></x-statistic>
<x-statistic title="今日成交" prefix="¥" :value="amount"></x-statistic>
```

```js
new AutoSpark(el, { total: 128960, amount: 98765.5 });
```

元素名快速写法（静态属性自动折叠，数字类型推断）：

```html
<x-statistic value="1024" title="静态数值"></x-statistic>
```

<demo html="components/display/statistic/basic.html"/>

## 指南

### 数值（value）

**类型**: `number | string`
**默认**: `0`

`number`（有限值）经 Intl.NumberFormat 按语言环境格式化；`string` 原样直出（跳过格式化）；`null`/`undefined` 渲染空。状态绑定驱动即时重算。

### 小数位修约（precision）

**类型**: `number`
**默认**: `null`（保留原精度）

`>= 0` 的整数时按 `minimumFractionDigits = maximumFractionDigits = precision` 修约（如 `1234.5` + `precision: 2` → `1,234.50`）；null / 负数 / 非整数忽略。

### 千分位（grouping / groupSeparator）

**类型**: `grouping: boolean`（默认 `true`）/ `groupSeparator: string`（默认 `""`）

`grouping: false` 关闭千分位（纯数字串）；`groupSeparator` 非空时替换当前语言环境的缺省分组符（如 `"_"` → `1_234_567`，`" "` → `1 234 567`）。

### 语言环境（i18n `$.language` 可选联动）

locale 取全局状态 `$.language`（i18n 插件在场时的当前语言码，BCP 47 兼容 Intl）；写入即触发重算。未装 i18n / 未设置时回退 `zh`。demo 中可经 `engine.store.state.$ = { language: "de" }` 模拟切换（i18n 在场时由其词典通道驱动）。

<demo html="components/display/statistic/format.html"/>

### 前后缀与标题（prefix / suffix / title + 插槽）

**类型**: `string`，默认 `""`

`prefix` / `suffix` / `title` 均支持 props 与同名插槽双通道（槽内容优先，props 兜底；空值不占位）。典型用法：货币符号前缀、单位后缀。

```html
<x-statistic title="余额" :value="amount">
  <template x-slot:prefix><b style="color: #22c55e">余额</b></template>
  <template x-slot:suffix><span style="font-size: 0.8em">CNY</span></template>
</x-statistic>
```

### 数值区样式（valueStyle）

**类型**: `Record<string, string | number>`
**默认**: `null`

数值区内联样式对象（camelCase 标准属性 + `--` 自定义属性双通道）。**字面量对象 props 死环规避**：经状态引用注入（`valueStyle: vs`），运行时替换驱动重应用。

### 主题化

数值区正文色走 `--auto-color`、标题次要色 `--auto-secondary-color`（三级回退链，ADR-0129）；数值字号 1.5em 标定随 `data-size` 档位缩放；`tabular-nums` 等宽数字（数值对齐惯例）；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-statistic-*`（如 `--asc-statistic-value-color`、`--asc-statistic-title-color`、`--asc-statistic-font-size`）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| value | `number \| string` | `0` | 数值（number 经 Intl 格式化 / string 直出） |
| precision | `number` | `null` | 小数位修约（>=0 整数生效；null 保留原精度） |
| grouping | `boolean` | `true` | 千分位开关 |
| groupSeparator | `string` | `""` | 自定义分组符（空 = locale 缺省符） |
| prefix | `string` | `""` | 前缀文本（prefix 槽可重载） |
| suffix | `string` | `""` | 后缀文本（suffix 槽可重载） |
| title | `string` | `""` | 标题（title 槽可重载；空值不占位） |
| valueStyle | `Record<string, string \| number>` | `null` | 数值区内联样式对象（状态引用注入） |

### 事件

无内建事件（纯展示）。

### Slots

| 插槽 | 说明 |
| --- | --- |
| title | 标题整体重载（缺省 {{ title }} props 兜底） |
| prefix | 前缀整体重载（缺省 {{ prefix }} props 兜底） |
| suffix | 后缀整体重载（缺省 {{ suffix }} props 兜底） |
