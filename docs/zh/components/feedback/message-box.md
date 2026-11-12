# MessageBox 确认询问对话

## 概述

MessageBox 是 AutoSpark 的官方确认询问对话组件（组件库 P1，feedback 分类，ADR-0018 清单权威表——决策 3：notifications 的 message/notification 已覆盖通知语义，message-box 入清单因其是 **confirm 询问语义、非通知**）。

**x-dialog 的确认语义组合壳**（ADR-0018 决策 3 已裁，勿自建弹层）：x-dialog 是通用弹层指令（遮罩/居中/ESC/遮罩关闭/visible 回写等模态机制，内容全自定义）；message-box 是**确认语义开箱件**——只提供询问内容（`type` 图标映射 + 标题/内容 + 确认/取消双钮），弹层机制全部组合消费 x-dialog。确认/取消钮组合消费 [autospark.button](../general/button.md)（按需加载场景须同页加载 `autospark.button.js`；聚合产物无此问题）。

消费形态：宿主声明 `x-dialog:message-box="ui.visible"`（visible 走 x-dialog 值通道，与 props 正交），props 经 `x-dialog-options.props` 注入。确认/取消点击：先广播 `confirm` / `cancel` 事件（detail 空），再走请求关闭链（visible 可回写时自动回写 `false`，状态唯一真相源）。

> **覆盖物消费用无点别名**：overlay 指令的属性参数句点段被解析器切为修饰符（`x-dialog:autospark.message-box` 的组件名会被截断 miss），故消费处写 `x-dialog:message-box`（插件双名注册的同模板别名）。overlay 侧点号候选回溯修复后可直用全名。

**i18n 内置文案**（ADR-0018 决策 6 约定 1）：`confirmText` / `cancelText` 缺省走词典 `message-box.confirm` / `message-box.cancel` 键——i18n 插件在场时按 `$.language` 查表（语言切换响应式即时生效）；未装 i18n / 词典未命中回退硬编码中文「确定」「取消」（键等值判定）。依赖松弛不强制。

引入方式：引擎之后加载 `autospark.overlay.js`（x-dialog 弹层机制）→ `autospark.button.js`（双钮）→ `autospark.message-box.js`（自举注册）；或聚合产物 `autospark.plugins.js` 一个标签。

## 快速入门

```html
<script src="autospark.js"></script>
<script src="autospark.overlay.js"></script>
<script src="autospark.button.js"></script>
<script src="autospark.message-box.js"></script>

<div x-data="{ ui: { open: false } }">
  <button
    x-dialog:message-box="ui.open"
    x-dialog-options.props="{ title: '删除确认', content: '此操作不可恢复，是否继续？', type: 'danger' }"
    @click="ui.open = true"
  >
    删除
  </button>
</div>
<script>
  // 事件消费（document 级——见下方「事件」节物理边界）
  document.addEventListener("confirm", () => console.log("已确认"));
</script>
```

<demo html="components/feedback/message-box/basic.html"/>

## 指南

### 类型（type）

**类型**: `"info" | "success" | "warning" | "danger"`
**默认**: `"info"`

图标映射（alert 同款）：`info→info` / `success→success` / `warning→warn` / `danger→error`，经 engine 内置 x-icon 渲染。图标与语义色联动（`--asc-tone` 中转）；`danger` 询问的确认钮缺省自动配 danger 语义色实底（见 confirmType）。

### 标题与内容（title / content）

**类型**: `string`
**默认**: `""`

标题（空则不渲染标题行——图标+内容仍成体）；content 为内容文案，**默认插槽内容优先于 content 兜底**（富内容可换：加粗片段、列表等）。

### 确认/取消文案（confirmText / cancelText）

**类型**: `string`
**默认**: `""`

显式传入优先；缺省走 i18n 词典 `message-box.confirm` / `message-box.cancel` 键（语言切换即时生效），未装 i18n / 未命中回退硬编码中文「确定」「取消」。使用者可经 `x-locales` / 顶层 locales script / `options.i18n.messages` 三通道任意语言覆译。

### 确认钮语义色（confirmType）

**类型**: `string`
**默认**: `""`（联动）

确认钮（autospark.button primary 形态实底）的语义色：空 = 按 type 联动——`danger` 询问配 danger 色、其余 primary；显式指定（如 `success`）始终优先。

### 取消钮开关（showCancel）

**类型**: `boolean`
**默认**: `true`

`false` 关闭取消钮（纯确认提示场景——通知式询问确认钮独占动作区）；取消钮为 default 描边形态。

### visible（x-dialog 值通道）

message-box 自身无 visible props——开关走消费处 `x-dialog:message-box="ui.visible"` 的**值通道**（与 x-dialog 的值语义同构）：状态真值即开、假值即关。确认/取消/ESC/遮罩四触点统一走「请求关闭」——可回写的状态路径自动回写 `false`。

### 事件（confirm / cancel）

确认/取消钮点击广播 `confirm` / `cancel` 事件（`bubbles`，detail 为空），**先广播后关闭**（关闭经 `action:close` 信号走请求关闭链）。

::: warning 事件物理边界（与 overlay:close 同款）
弹层 DOM 渲染在 `document.body` 下的容器内、**不在 engine 宿主树内**——模板里写 `@confirm="…"` 收不到事件。消费用 `document.addEventListener("confirm" | "cancel", ...)` 或模板外 JS 监听。
:::

### 主题化

语义色走 `--auto-*` 语义变量（theme 在场自动换肤）；双钮字号档位经主题通道 `data-size` 全跟随；暗色：容器裸挂 `data-dark`。使用者覆盖通道 `--asc-message-box-*`（如 `--asc-message-box-danger` 某档语义色、`--asc-message-box-padding` 内距）。

### 弹层行为定制

弹层机制全由 x-dialog 承担——`at` 锚定、`animate` 动画、`keepalive` 保活、`delayClose` 自动关闭、面板边框/外壳等按 [x-dialog 文档](../../guide/directives/x-dialog.md) 经 `x-dialog-options` 配置，与 message-box 正交组合。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| type | `"info" \| "success" \| "warning" \| "danger"` | `"info"` | 图标映射 + 语义色（alert 同款，询问场景无 default 档） |
| title | `string` | `""` | 标题（空则不渲染标题行） |
| content | `string` | `""` | 内容文案（默认插槽内容优先） |
| confirmText | `string` | `""` | 确认钮文案：空走 i18n 词典 `message-box.confirm` 键（回退「确定」） |
| cancelText | `string` | `""` | 取消钮文案：空走 i18n 词典 `message-box.cancel` 键（回退「取消」） |
| confirmType | `string` | `""` | 确认钮语义色：空 = 按 type 联动（danger 配 danger、其余 primary） |
| showCancel | `boolean` | `true` | 取消钮开关（false 时确认钮独占动作区） |

### 事件

| 事件 | 说明 |
| --- | --- |
| confirm | 确认钮点击冒泡（detail 为空；先于关闭广播——document 级监听，见物理边界） |
| cancel | 取消钮点击冒泡（detail 为空；先于关闭广播——document 级监听） |

事件后自动走请求关闭链：`x-dialog` 值通道可回写时 `visible` 自动回写 `false`。

### Slots

| 插槽 | 说明 |
| --- | --- |
| 默认 | 内容区（优先于 content 兜底；富内容可传——写在 x-dialog 宿主子级的 `x-slot` 标记内） |

> 对象形态 props 无消费面（均为标量）；确认/取消钮文案走 button 的 label props 通道（继承形态下嵌套插槽出口被忽略的引擎边界规避）。
