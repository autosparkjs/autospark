# Result 结果页

## 概述

Result 是 AutoSpark 的官方结果页组件（组件库 P2 反馈件，ADR-0018 清单权威表 feedback 行）：语义色大图标 + 标题 + 描述 + 动作区的**操作终态页**（居中纵排，整页/整卡占位）。纯展示——无状态无事件。

与 Alert 的边界：alert 是页内警示条（行内横条、随文中断性提示）；result 是流程终点占位（提交成功 / 支付失败 / 维护通知），承载后续动作引导。两者正交，不互相替代。

引入方式：引擎之后加载 `<script src="/autospark/autospark.result.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.result.js"></script>

<x-result type="success" title="提交成功" description="预计 3 个工作日完成审核。"></x-result>
```

<demo html="components/feedback/result/basic.html"/>

## 指南

### 语义色（type）

**类型**: `success | error | warning | info`
**默认**: `info`

四档语义色大图标（4em，色随 `--auto-*-color` 语义变量）：`success → success` / `error → error` / `warning → warn` / `info → info`（内置 x-icon 映射）。语义色组织与 alert 同款（`--asc-tone` 中转 + `:has()` 反驱宿主）。

### 标题（title）与描述（description）

**类型**: `string` / `string`
**默认**: `""`

标题为操作结果主旨（1.25em + medium 字重）；描述为补充说明（次要文字色，长文案自动换行）。空值对应行不渲染（`x-if` 结构退场）。均使用者传入——本组件无内置文案、不接 i18n（ADR-0018 决策 6 约定 1 通道对本件无消费面）。

### 动作区（默认插槽）

默认插槽为动作区（标题描述下方的横排居中区域），常放 button 组合：

```html
<x-result type="error" title="支付失败" description="网络连接超时。">
  <x-button variant="primary" type="primary" label="重新支付"></x-button>
  <x-button variant="default" label="返回订单"></x-button>
</x-result>
```

未提供内容时动作区无占位（`:empty` 隐藏）。按需加载场景组合 button 须同页引 `autospark.button.js`（聚合产物无此问题）。

### 图标插槽（icon）

`icon` 插槽整体换图（自定义 emoji / 图片 / 复合图形），缺省按 type 映射内置图标：

```html
<x-result type="warning" title="账号待激活">
  <template x-slot:icon><span style="font-size: 3.5rem">🔔</span></template>
  <span>验证邮件已发送。</span>
</x-result>
```

### 主题化

字号档位：任意祖先容器挂 `data-size`（theme 手动通道，经 autospark.base 继承——图标/标题/间距随档缩放）；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-result-*`（如 `--asc-result-success`、`--asc-result-desc-color`、`--asc-result-padding`）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| type | `success \| error \| warning \| info` | `info` | 语义色大图标档 |
| title | `string` | `""` | 标题（空则不渲染） |
| description | `string` | `""` | 描述（空则不渲染） |

### 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| — | — | 纯展示组件，无事件 |

### Slots

| 插槽 | 说明 |
| --- | --- |
| 默认 | 动作区（button 组合配方位；无内容不占位） |
| icon | 图标位整体换图（缺省按 type 映射内置图标） |
