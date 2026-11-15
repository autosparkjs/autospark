# Tabs 页签

## 概述

Tabs 是 AutoSpark 的官方页签组件（组件库 P1 导航件，ADR-0018 清单权威表 navigation 行 / 决策 3 裁定 **segmented 分段控制器并入本件作 variant**）：items 数据驱动页签头 + 默认插槽承载面板区，**受控 value 单选**（`el.value` 桥 + `change` 事件 `detail = { value }` + `input` 回写 x-model）。

三形态（variant）：**line** 下划线（缺省）/ **card** 卡片 / **segmented** 分段控制器（button-group 选中模式的视觉近亲——纯视图切换器用法）。

键盘（tablist 语义，WAI-ARIA tabs 模式）：左右方向键环形移焦 + 自动激活、Home/End 首末直达；焦点漫游 tabindex（激活项 `0`、其余 `-1`）；禁用项不可点击、键盘序列跳过。

面板切换经 **x-show / x-if 家族**（引擎原生路径，组件不代理面板生命周期）：`x-show` 保留 DOM、`x-if.keepalive` 摘 DOM 保活、`x-if` 销毁重建——面板写在默认插槽内、绑同一状态。

引入方式：引擎之后加载 `<script src="/autospark/autospark.tabs.js"></script>`（自举注册），或聚合产物 `autospark.plugins.js`。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.tabs.js"></script>


<x-tabs x-model="view" :items="tabs">
  <p x-show="view === 'a'">面板 A</p>
  <p x-show="view === 'b'">面板 B</p>
</x-tabs>
```

```js
new AutoSpark(el, {
  view: "a",
  tabs: [
    { key: "a", label: "概览", icon: "file" },
    { key: "b", label: "设置" },
    { key: "c", label: "禁用项", disabled: true },
  ],
});
```

等价的受控形态：`:value="view"` + 外层包裹元素 `@change="view = $event.detail.value"`。

<demo html="components/navigation/tabs/basic.html"/>

## 指南

### 页签项（items）

**类型**: `Array<{ key: string, label: string, icon?: string, disabled?: boolean }>`
**默认**: `[]`

`key` 为项标识（激活值语域）；`label` 为页签文案；`icon` 为图标名（x-icon 渲染）；`disabled` 禁用该项（原生 disabled + 键盘序列跳过）。

> **注入提示**：items 恒经**状态引用**注入（`items: tabs`，`tabs` 为页面/局部状态）——当前引擎版本对值对象内的**字面量**数组 props 存在无限更新缺陷。静态页签头请用子元素声明形态（或裸 `items='[...]'` JSON 字符串属性，precompile 变换会分流到 `data-items` 通道）。动态增删页签须**数组整体替换**（引用变化触发重注入；原地 `push` 不换引用、不重渲染）。

### 子元素声明（`<x-tab>`）

静态页签头的快捷写法：`key` / `label` / `icon` / `disabled` 四个标量属性，由 precompile DOM 变换折叠为 items JSON 落宿主 `data-items` 属性，组件 mounted 解析渲染；声明元素本身从 DOM 摘除。`:items` 状态引用在场时恒优先。`<x-tab>` 不承载内容——面板写在 `<x-tabs>` 的默认插槽。

### 激活值（value）与值通道

**类型**: `string`
**默认**: `""`（缺省激活首个可用项）

受控单选（button-group 选中模式同构）：

- **props 单向驱动**：`:value="view"` 变化即时迁移激活态；
- **点击 / 键盘激活**：写组件内部状态 + 双派发——`input`（非冒泡，x-model 监听回写）+ `change`（冒泡，`detail = { value }`，外层一行回写）；
- **el.value 桥**：宿主元素 `value` 属性劫持（读 = 当前激活 key、写 = 激活迁移），程序读写皆经此；
- **初值落定序**：`x-model` 初值 > props `value` > 首个可用项（tablist 恒有一项激活的语义缺省）。

```html

<div @change="view = $event.detail.value">
  <x-tabs :items="tabs" :value="view">
    <div x-show="view === 'a'">面板 A</div>
    <div x-show="view === 'b'">面板 B</div>
  </x-tabs>
</div>
```

同值点击短路（不重复派发）；禁用项不可激活。

### 形态（variant）

**类型**: `line | card | segmented`
**默认**: `line`

`line` 底线 + 激活下划线；`card` 卡片页签（激活卡与内容区连线）；`segmented` 分段控制器——浅底容器 + 激活项语义色实底反白，纯切换器用法（无面板区时无空盒占位）。

<demo html="components/navigation/tabs/variant.html"/>

### 面板区（默认插槽）

面板写在实例化宿主的子内容（默认插槽，投影到页签头下方的内容区）；未提供内容时内容区无空盒占位（`:empty` 隐藏）。切换三形态按面板成本选择：

- `x-show`：DOM 保留，输入态/滚动位不丢（轻量面板缺省）；
- `x-if.keepalive`：摘 DOM 但保活状态（重型面板推荐——不渲染不占资源，切回原宿主 reattach）;
- `x-if`：销毁重建（每次切入重置，纯静态面板）。

<demo html="components/navigation/tabs/panels.html"/>

> **声明式动态命名出口裁定**：不做 `x-slot:面板key` 形态——插槽出口名在编译期静态收集，动态面板 key 无静态出口可投；面板恒走默认出口 + 调用方状态切换是引擎原生最短路径。

### 键盘导航（tablist 语义）

聚焦任一页签后：`→` / `←` 环形移焦并**自动激活**，`Home` / `End` 直达首末；焦点漫游 tabindex（激活项 `0`、其余 `-1`）随激活态自动迁移；禁用项被键盘序列跳过。页签为真 `button`（原生 Space/Enter 激活）。

### 事件

| 事件 | 形态 | 说明 |
| --- | --- | --- |
| change | 冒泡，`detail = { value }` | 激活项变化（点击/键盘/程序写值时派发；props 驱动变化不广播防回环） |
| input | 非冒泡 | x-model 回写通道（同 change 时机） |

### 主题化

字号档位：任意祖先容器挂 `data-size`（theme 手动通道，经 autospark.base 继承）；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-tabs-*`（如 `--asc-tabs-primary`、`--asc-tabs-tab-color`、`--asc-tabs-seg-bg`、`--asc-tabs-border`）。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| value | `string` | `""` | 受控激活 key（缺省激活首个可用项；el.value 桥） |
| items | `Array<{ key, label, icon?, disabled? }>` | `[]` | 页签项（状态引用注入） |
| variant | `line \| card \| segmented` | `line` | 形态（segmented = 分段控制器） |

### 事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| change | `detail: { value }` | 激活项变化冒泡（外层一行回写惯用法） |
| input | — | x-model 回写通道（非冒泡） |

### Slots

| 插槽 | 说明 |
| --- | --- |
| 默认 | 面板区（x-show / x-if.keepalive / x-if 绑消费者状态切换） |
