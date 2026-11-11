# StateButton 状态按钮

## 概述

StateButton 是在 **2-N 个状态间循环切换的单钮组件**（ADR-0016）——**继承 [`Button`](./button.md) 骨架 + 机制自治**：button 的全部形态面（variant / type / icon / label / tags / menu / 主题档位…）经组件继承原样可用，状态机制（循环切换、装饰渲染、表单桥、灰色无匹配态）自持。

**零配置即传统双态 check 按钮**：缺省 `states = [{value: false}, {value: true, decorate: 'corner'}]`——不传任何状态配置时就是一个「未勾选 ↔ 勾选（右上角打勾角标）」的 check 按钮。

与 [`ButtonGroup`](./button-group.md) 选中模式正交：**彼为多个按钮间选择**（组值受控单选），**此为一个按钮自身循环**（单控件表达 N 态）。

## 快速入门

引擎之后加载 button 与 state-button 两个组件脚本（继承依赖——或直接用聚合产物 `autospark.plugins.js`）：

```html
<script src="autospark.js"></script>
<script src="autospark.button.js"></script>
<script src="autospark.state-button.js"></script>
```

以一个 **WebSocket 连接按钮**为例——四个状态「未连接 → 正在连接 → 已连接 → 正在断开」（尾态回卷），一个组件表达整条状态机：

```html
<x-state-button :states="wsStates" :value="ws" label="未连接"></x-state-button>
```

```js
// states 须放外层状态再路径引用（字面量数组触发引擎更新环，见「状态集」警示）
const app = new AutoSpark(el, {
    ws: "disconnected",
    wsStates: [
        { value: "disconnected",  label: "未连接",   variant: "dashed", icon: "no" },
        { value: "connecting",    label: "正在连接…", variant: "primary", type: "warning", loading: true },
        { value: "connected",     label: "已连接",    variant: "primary", type: "success", icon: "yes", decorate: "ripple" },
        { value: "disconnecting", label: "正在断开…", variant: "text", type: "warning", loading: true },
    ],
});
```

三行用法要义：

- **states 定义状态集**——每项 `value` 为状态值，其余键为该态专属的 [button props](./button.md#属性) + 机制键（上例 `loading: true` 让连接/断开中自动转圈禁点、`decorate: 'ripple'` 给已连接佩绿色涟漪指示——呼吸点 + 扩散环随语义色）。点击在四态间循环推进，按钮整貌随态换装；
- **value 受控**——`:value` 注入当前态（外部状态单向驱动视觉）；点击派发 `change`（`detail.value` 为新态值），外层 `@change="ws = $event.detail.value"` 一行回写；
- **异步场景**——真实连接的切换时机归回调（`ws.onopen` / `ws.onclose`）而非点击：`autoswitch="false"` 纯受控即此形态，下方 demo 为完整实景。

不传 states 即缺省双态 check 按钮（`[{value:false},{value:true,decorate:'corner'}]`）——零配置即传统勾选按钮，综合示例见[状态集](#状态集-states)。

<demo html="components/general/state-button/websocket.html"/>

## 指南

### 状态集（states）

**类型**: `x-button-options[]` | `(number | string)[]`——**x-button-options 即 `<x-button>` 的选项集**（button props 全集），另可携带状态机制键

**默认**: `[{value: false}, {value: true, decorate: 'corner'}]`

状态数组支持双形态：**标量数组** `[1, 2]` 即 `{value}` 简写；**对象数组**每项缺 `value` 键时回退**数组下标**。

**button props 透传（2026-11-11 泛化）**：状态项可携带 [Button 的全部属性](./button.md#属性)——`variant` / `type` / `ghost` / `border` / `shape` / `wrap` / `loading` / `disabled` / `icon` / `label` / `memo` / `ripple` / `align` / `indent` / `menu` / `tags` 等——**切态整组注入**，每态完全自定义按钮的渲染与形态（如实底主按钮 ↔ 危险虚线 ↔ 幽灵文本的三态换装、`loading: true` 的「处理中」态自动转圈禁点）。当前态未声明的键回退组件底值（使用者声明的 props 初值）。theme 档位六键不随态切换（不在注入面）。

状态机制键（非 button props，走各自通道）：

| 键 | 类型 | 说明 |
| --- | --- | --- |
| `value` | `any` | 状态值（严格相等匹配；缺省回退下标） |
| `clickable` | `boolean` | 缺省 `true`；`false` = 该态**出边锁**——处于该态时点击零效果（不切换不派发） |
| `decorate` | `solid \| check \| corner \| ripple` | 该态**额外装饰**（见下节） |
| `style` | `string` | cssText 字符串（额外内联样式，对齐 tags.styles 通道） |
| `class` | `string` | 附加类名（切态摘旧加新） |
| `tooltip` | `string` | 悬停提示（双轨：tooltip 插件在场挂 `data-tooltip`、缺席挂原生 `title`） |

```html
<!-- 三态换装：primary 实底 → dashed 危险 → ghost 文本（states 须路径引用） -->
<x-state-button :states="lookStates" label="外观切换"></x-state-button>
<!-- lookStates = [
  { value: 'a', variant: 'primary', type: 'success', label: '启用' },
  { value: 'b', variant: 'dashed', type: 'danger', label: '停用', decorate: 'corner' },
  { value: 'c', variant: 'text', ghost: true, label: '归档' },
] -->
```

::: warning
states **数组一律放外层状态再路径引用**（`:states="myStates"`）——含标量数组 `[1,2]` 与空数组 `[]` 在内，**任何字面量数组都会触发引擎更新环缺陷死锁页面**（与 tags 同款约束，引擎侧修复中）；对象/数字等标量字面量安全。项内 `tags` / `icon` 对象形态同须路径引用。
:::

<demo html="components/general/state-button/basic.html"/>

### 装饰（decorate 项键）

**类型**: `solid | check | corner | ripple`（states 项键，无组件级默认装饰）

为**佩戴该装饰的状态**提供的额外视觉，N 态任意佩戴（每态一个）。指示色统一取主题色（当前态 `type` 键指定语义色时随之）：

| 值 | 佩戴态呈现 |
| --- | --- |
| `solid` | tone 实底 + 反白字（覆盖 variant 表达） |
| `check` | 最左 1.2em 显示打勾 ✓ |
| `corner` | tone 描边 + 右上角小三角内嵌反白打勾（缺省组 true 态即此） |
| `ripple` | 最左 1.2em 显示涟漪动画指示（呼吸点 + 扩散环，CSS 自绘） |

`check` / `ripple` 为**占位型**：组内任一态佩戴即全组常驻 1.2em 占位，未佩戴态留空——多态循环间对齐、勾选/取消零布局跳动（佩戴按态自由，不要求全组统一）。

<demo html="components/general/state-button/decorate.html"/>

### 切换语义（autoswitch / 循环）

**类型**: `autoswitch: boolean`，默认 `true`

点击切换的完整生效条件：`autoswitch !== false && 当前态 clickable !== false && !disabled && !loading`。命中即**循环 next**：`states[i] → states[(i+1) % N]`（尾态回卷首态；当前无匹配 → `states[0]`），并：

- 派发 `change`（冒泡，`detail = { value, index, state }` 新态三元组）；
- 原生 click 照常冒泡；
- 布尔二元组另派发 `input`（x-model 桥，见下）。

`autoswitch: false` = **纯受控**：点击不切换、不派发 `change`，仅原生 click——受控交互一行式：

```html
<!-- 原生 click 经 dataset 反射读当前值，自行裁决回写（states 须路径引用） -->
<div @click="mode = $event.currentTarget.querySelector('button').dataset.value === '1' ? 2 : 1">
    <x-state-button :states="pairStates" :value="mode" autoswitch="false" label="受控切换"></x-state-button>
</div>
```

异步状态机（连接握手等切换时机归回调而非点击）的完整实景见 WebSocket 示例——`loading: true` 态自动禁点、外部事件直接注入 value：

<demo html="components/general/state-button/websocket.html"/>

### 当前值（value）

**类型**: `any`，缺省 = `states[0].value`（初始态即首态——统一规则，N>2 同规）

**受控真相**：外部注入的 `value` 单向驱动视觉（watch 通道跟随），组件仅在点击翻转与缺省初始化时写入。显式传入**域外值**（不在 states 值域）→ **灰色无匹配态**。

#### 灰色无匹配态（asc-unmatched）

value 不在 states 值域时的专属渲染：中性灰覆盖 variant/type（「未处于任何状态」的元语义）、icon/label/tags 照常显示仅灰化、**可点击**（`cursor: pointer` + hover 轻反馈——与 disabled 的淡化 + 禁点光标明确分野），点击进 `states[0]`。states 运行时整体替换后原 value 不在新值域 → 回灰（value 不被擅改）。

### 表单与 x-model

内嵌隐藏真 input（`name` 透传宿主）——`<x-state-button name="mode">` 天然可作表单控件提交当前状态：

- **布尔二元组**（缺省组即此）：内嵌 `input[type=checkbox]`（未勾选不提交、提交值 `String(true 态 value)`）；宿主 `x-model` 走组件桥的**布尔语域**，配 `x-model.boolean` 类型保真——多枚按钮绑同一根 state 变量即「全选组」；
- **其余形态**（N>2 / 非布尔二元组）：内嵌 `input[type=hidden]`（`value = String(当前值)`、恒随表单提交）。

```html
<!-- 布尔组：x-model 双向（.boolean 保真） -->
<x-state-button x-model.boolean="flag" label="同意条款" name="agree"></x-state-button>

<!-- 三态：受控走 @change（detail.value 原值） -->
<span @change="mode = $event.detail.value">
    <x-state-button :states="modes" :value="mode" label="模式"></x-state-button>
</span>
```

::: warning
x-model 仅推荐**布尔二元组**场景——text 分型对 N>2 值字符串化固有（`1` → `"1"` 后不再匹配数字 `1`），N>2 受控通道是 `@change`。x-model 绑定变量须在**根 state**。
:::

### 事件

| 事件 | detail | 说明 |
| --- | --- | --- |
| `change` | `{ value, index, state }` | **切换实际发生后**冒泡（新态三元组；autoswitch=false / 出边锁不派发） |
| `click` | 原生事件 | 原生冒泡点击（无 detail——state 数据经 dataset 反射读取） |

**dataset 反射**：宿主常驻 `data-value` 属性反射当前值（标量 `String`、对象 `JSON.stringify`）——`@click="v = $event.currentTarget.dataset.value"` 一行读取（button-group 子钮值同款家族模式）。

### 继承面（来自 Button 的全部能力）

variant / type / label / labelPos / icon / loading / disabled / ghost / border / block / shape / wrap / memo / tags（含 tag 级 checkable）/ menu / align / indent / ripple / autoInsertSpace / 主题档位六键——用法与 [Button](./button.md) 完全一致（继承自同一模板）。入 [`ButtonGroup`](./button-group.md) 选中模式时与其他子钮同规：状态切换机制禁用。

## 参考

### 属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| states | `x-button-options[] \| (number\|string)[]` | `[{value:false},{value:true,decorate:'corner'}]` | 状态集（标量即 `{value}` 简写、对象缺 value 回退下标；**数组一律路径引用**） |
| value | `any` | `states[0].value` | 当前状态值（受控真相；域外值 → 灰色无匹配态） |
| autoswitch | `boolean` | `true` | 点击自动切下一态；false 纯受控（仅原生 click） |
| *（其余）* | — | — | 继承 [Button 全部属性](./button.md#属性) |

### 状态项（x-button-options + 机制键）

| 键 | 类型 | 说明 |
| --- | --- | --- |
| *（button props）* | — | [Button 全部属性](./button.md#属性)按名透传（variant/type/ghost/shape/loading/icon/label/ripple...），切态整组注入、未声明回退底值 |
| value | `any` | 状态值（严格相等匹配，缺省回退下标） |
| clickable | `boolean` | 缺省 true；false = 该态出边锁（点击零效果） |
| decorate | `solid \| check \| corner \| ripple` | 该态额外装饰（check/ripple 为占位型） |
| style | `string` | cssText 额外内联样式 |
| class | `string` | 附加类名（切态摘旧加新） |
| tooltip | `string` | 悬停提示（双轨） |

### 边缘语义

- **无效状态集**（归一化后少于 2 项）：静默退化为不可切态（恒无匹配灰、点击无状态效果）；
- **states 优先**：与继承面无键冲突（button 的 checkable 族已移除）；
- **产物依赖**：`autospark.state-button.js` 须与 `autospark.button.js` 同页加载（或用聚合产物 `autospark.plugins.js`）。
