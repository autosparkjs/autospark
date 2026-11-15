# Steps 步骤条

## 概述

Steps 是 AutoSpark 的官方步骤条组件（组件库 P2 导航件，ADR-0018 清单权威表 navigation 行）：items 数据驱动步骤（title / description / icon），**受控 current**（当前步序号，0 起）+ 状态机自动推导——先行步恒 finish（打勾）、当前步取 status 取值（process / error / finish）、后续步恒 wait；**连接线随完成染色**；clickable 开启后可点切换。

两形态（统一收敛到 items 数据面渲染）：

- **items 数据驱动**：`{ title, description?, icon? }[]` 经**状态引用**注入；
- **子元素声明**（静态步骤）：`<x-step title description icon>` 快捷写法，经 precompile 变换折叠为 items JSON（`data-items` 通道）。

排向（direction）：**horizontal** 横排（缺省，步后横线）/ **vertical** 纵排（步下竖线）。

引入方式：引擎之后加载 `<script src="/autospark/autospark.steps.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.steps.js"></script>


<div @change="step = $event.detail.current">
  <x-steps clickable="true" :items="flow" :current="step"></x-steps>
</div>
```

```js
new AutoSpark(el, {
  step: 1,
  flow: [
    { title: "填写信息", description: "准备基础资料" },
    { title: "验证身份", description: "短信或邮箱验证" },
    { title: "完成" },
  ],
});
```

`class` / `style` / `id` 与 `data-*` / `x-*` / `@` 前缀属性保留给宿主。

<demo html="components/navigation/steps/basic.html"/>

## 指南

### 步骤项（items）

**类型**: `Array<{ title, description?, icon? }>`
**默认**: `[]`

`title` 为步骤标题；`description` 为补充描述（空不渲染）；`icon` 为自定义图标名（x-icon 渲染，仅未完成步显示——先行步恒打勾，完成语义优先）。

> **注入提示**：items 恒经**状态引用**注入（`items: flow`）——当前引擎版本对值对象内的**字面量**数组 props 存在无限更新缺陷。静态步骤请用子元素声明形态（或裸 `items='[...]'` JSON 字符串属性，precompile 变换会分流到 `data-items` 通道）。动态步骤须**数组整体替换**。

### 子元素声明（`<x-step>`）

静态步骤的快捷写法：`title` / `description` / `icon` 三个标量属性，由 precompile DOM 变换折叠为 items JSON 落宿主 `data-items` 属性，组件 mounted 解析渲染；声明元素本身从 DOM 摘除。`:items` 状态引用在场时恒优先。

```html
<x-steps current="1">
  <x-step title="填写信息" description="准备基础资料"></x-step>
  <x-step title="验证身份" description="短信或邮箱验证"></x-step>
  <x-step title="完成"></x-step>
</x-steps>
```

### 当前步（current）与值通道

**类型**: `number`
**默认**: `0`

受控（number 语域，负值/NaN/字符串数字归一为非负整数）：

- **props 单向驱动**：`:current="step"` 变化即时迁移状态机；
- **clickable 点击步**：写组件内部状态 + 双派发——`input`（非冒泡，x-model 监听回写）+ `change`（冒泡，`detail = { current }`，外层一行回写）；
- **el.value 桥**：宿主元素 `value` 属性劫持（读 = 当前步序号、写 = 迁移），程序读写皆经此；
- **初值落定序**：`x-model` 初值 > props `current`（缺省 0）。

同值点击短路（不重复派发）；current 越上界不钳制（> 末序 → 全部 finish，视觉合法）。

### 状态（status）

**类型**: `process | finish | error`
**默认**: `process`

描述**当前步**的状态：`process` 进行中（主色实底序号）/ `error` 当前步异常（danger 叉号 + 标题染色）/ `finish` 当前步已完成（打勾——全流程收尾用法）。先行步恒 finish、后续步恒 wait，由 current 自动推导（无需逐项配置）。

### 可点切换（clickable）

**类型**: `boolean`
**默认**: `false`

开启后步可点击切换 current（手势 cursor + hover 标题主色提示），点击派发 change；关闭时点击无效果。

### 排向（direction）

**类型**: `horizontal | vertical`
**默认**: `horizontal`

横排（缺省，等宽步 + 步后横线）/ 纵排（步下竖线延至下一步节点）。

<demo html="components/navigation/steps/variants.html"/>

### 事件

| 事件 | 形态 | 说明 |
| --- | --- | --- |
| change | 冒泡，`detail = { current }` | clickable 点击步切换（props 驱动变化不广播防回环） |
| input | 非冒泡 | x-model 回写通道（同 change 时机） |

### 主题化

字号档位：任意祖先容器挂 `data-size`（theme 手动通道，经 autospark.base 继承）；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-steps-*`（如 `--asc-steps-primary`、`--asc-steps-danger`、`--asc-steps-border`、`--asc-steps-wait-title`）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| current | `number` | `0` | 当前步序号（0 起；el.value 桥 number 语域） |
| items | `Array<{ title, description?, icon? }>` | `[]` | 步骤项（状态引用注入） |
| status | `process \| finish \| error` | `process` | 当前步状态（先行步恒 finish、后续步恒 wait） |
| direction | `horizontal \| vertical` | `horizontal` | 排向 |
| clickable | `boolean` | `false` | 可点切换（点击步切换 current + change 派发） |

### 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| change | `detail: { current }` | clickable 点击步切换冒泡（外层一行回写惯用法） |
| input | — | x-model 回写通道（非冒泡） |

### Slots

| 插槽 | 说明 |
| --- | --- |
| — | 无插槽（步骤全部由 items 数据驱动） |
