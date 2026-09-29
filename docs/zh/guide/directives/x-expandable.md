# x-expandable 展开折叠

## 概述

`x-expandable` 为宿主元素提供**展开/折叠**能力：值是**展开态布尔**（`true` = 展开）的双向绑定，引擎在宿主边线注入一个**圆形把手**（样式契约同 [x-splitter](./x-splitter.md) 的折叠把手），点击把手（或外部改状态）驱动折叠/展开动画。折叠通道由 `minSize` 分派：`0`（默认）为**滑出折叠**（宽度保持、负 margin 滑出 / transform 平移，二选一），`> 0` 为**尺寸收缩**（width/height 过渡到迷你形态）（ADR-0069）。

```html
<div style="display: flex; height: 300px; overflow: hidden">
  <div x-expandable="ui.open" style="width: 220px">侧栏（把手骑右边线）</div>
  <div style="flex: 1">主区</div>
</div>
```

## 快速入门

<demo html="expandable/basic.html"/>

`direction` 是**收起方向**（停靠边）：`'left'`（默认）= 向左收起，把手骑宿主右边缘（活动边）。`minSize=0` 折叠走 **margin 滑出**——宽度保持、负 `margin-left` 拉回占位，宿主整体滑出父容器、内容不挤压，兄弟元素平滑流入。

## 指南

### 指令值

值是**展开态布尔表达式**，三形态：

```html
<!-- 简单路径（推荐）：双向绑定——点击把手回写翻转 -->
<div x-expandable="ui.open">…</div>

<!-- 表达式：只读降级（warn 一次，状态→DOM 照常，点击把手不回写） -->
<div x-expandable="ui.a || ui.b">…</div>

<!-- 字面量：恒定态（点击 no-op） -->
<div x-expandable="'false'">…</div>
```

- **点击把手 / Enter / Space** → 简单路径回写 `!当前值`（x-model 同款防循环纪律）；
- 外部改状态 → DOM 响应（折叠/展开动画）；
- 初始值 `false`：编译后立即应用折叠终态、**无动画**、不派发事件（与 x-splitter「初始折叠不派发事件」惯例一致）；
- 值为空时 warn + 指令不作为（无把手无行为）。

### 折叠通道（minSize 分派）

<demo html="expandable/min-size.html"/>

| `minSize` | 折叠行为 | 子内容 |
|---|---|---|
| `0`（默认） | **滑出折叠**：尺寸保持不改，`collapse:'margin'`（默认）负 margin 滑出（占位归零、兄弟流入）或 `collapse:'slide'` transform 平移（占位不变，服务 fixed 覆盖形态）；终态持续保持 | 隐藏（`visibility`） |
| `> 0` | **尺寸收缩**：width/height 过渡至 minSize（width 或 height 由 direction 决定），`collapse` 选项不参与 | **不隐藏**（迷你形态内容可见，如何适应窄形态由页面 CSS 决定） |

展开时 `maxSize` 有值则写 inline 尺寸；缺省则**移除本指令写过的 inline 尺寸**让 CSS 决定（不快照记忆——宿主应有确定的 CSS 尺寸或显式 `maxSize`）。

### slide 通道（覆盖形态）

<demo html="expandable/slide.html"/>

`collapse: 'slide'` 折叠 = `translateX/Y(±100%)` 平移滑出——**占位不变**，服务 `position: fixed` 的覆盖面板场景（x-drawer 的抽屉把手后续版本将组合本指令走此通道）。宿主为 fixed/absolute 时指令**不改动**其 position（仅 static 宿主自动补 `relative` 作把手定位上下文）。

### 把手与滑轨定位

<demo html="expandable/basic.html"/>

把手是**圆心骑边线**的 20px 圆形按钮（内置全局图标 `arrow`，`role="button"` 可聚焦、Enter/Space 触发；箭头指向「下一步动作」随折叠态翻转）：

- **展开态**：圆心骑宿主**活动边线**（对侧边——`direction:'left'` 时在右边缘），外半圆突出宿主外；
- **滑出折叠态**：折叠动画完成后把手移入父容器，圆心骑**停靠边线**——外一半被父容器裁掉呈**半圆把手**（图标自动缩小并移入半圆中心，完整可见）；展开动画启动前移回宿主。滑出全程圆心恒贴边线，切换零跳变；
- `minSize>0` 折叠（宿主不滑出）：把手恒在宿主内骑活动边，不迁移。

滑轨坐标 `pos` 控制把手沿边线的位置（三态对齐家族惯例）：`'center'`（默认 ≡ `'50%'`）/ `number`（px）/ CSS 长度串（`'20%'`/`'2rem'`，**负值 = 距对端**）；越界静默钳制——把手是唯一重开触点，永可达。支持成员属性表达式（`x-expandable-options.pos`）响应式重定位。

### 父容器裁剪注入（injectOverflow）

<demo html="expandable/basic.html"/>

margin 滑出需要父容器 `overflow: hidden` 裁剪滑出部分，否则溢出可见（上面 demo 的父容器自行声明了 `overflow: hidden`，指令幂等跳过注入）。默认由指令**在折叠期间注入**：折叠动画开始挂、保持至**展开动画完成后**恢复原值（终态宿主滑出在外，动画瞬间摘除会令溢出重新可见）：

- 父容器本为 `hidden`/`clip` 时幂等跳过；
- 多实例共享父容器时引用计数，最后一个展开完成才恢复；
- 父容器原值 `auto`/`scroll` 的滚动条折叠期间暂失（已知副作用）；
- `injectOverflow: false` 显式禁用：回落编译期检测——父容器未裁剪时 warn 一次，由你自行处理。

### 事件（expandable:expand / expandable:collapse）

<demo html="expandable/min-size.html"/>

折叠态翻转以 DOM 冒泡事件派发在**宿主元素**上（冒号命名空间对齐 `splitter:*` / `tree:*` 家族惯例）：

```html
<div x-expandable="ui.open" @expandable:collapse="onHide($event.detail.size)">…</div>
```

| 事件 | 时机 | detail |
|---|---|---|
| `expandable:collapse` | 折叠态翻转（任何来源：把手 / 键盘 / 外部状态） | `{size}`（`0` 或 minSize 格式化值） |
| `expandable:expand` | 同上（反向） | `{size}`（maxSize 格式化值，缺省 `null`） |

初始折叠应用**不派发**——事件只反馈变更。

## 配置选项

| 配置项 | 默认值 | 修饰符 | 说明 |
|---|---|---|---|
| `direction` | `'left'` | — | 收起方向（停靠边）：`'left'`/`'right'`/`'top'`/`'bottom'`，`left`/`right` 走 width 轴、`top`/`bottom` 走 height 轴；把手骑活动边（对侧边线）。非法值 warn 回退 `left` |
| `minSize` | `0` | — | 折叠尺寸：`number`（px）/ CSS 长度串。`0` = 滑出折叠（配合 `collapse`）；`> 0` = 尺寸收缩（迷你形态） |
| `maxSize` | — | — | 展开尺寸：`number`（px）/ CSS 长度串。缺省 = 展开时移除本指令写过的 inline 尺寸、由 CSS 决定 |
| `collapse` | `'margin'` | — | 滑出折叠的实现通道（**仅 minSize=0 生效**）：`'margin'` 负 margin 滑出（占位归零、兄弟流入）；`'slide'` transform 平移（占位不变，服务 fixed 覆盖形态）。非法值 warn 回退 `margin` |
| `pos` | `'center'` | — | 把手滑轨坐标：`'center'` ≡ `'50%'`；`number` 为 px；`string` 为 CSS 长度（负值距对端），越界静默钳制。支持成员属性表达式热应用 |
| `injectOverflow` | `true` | — | 父容器 `overflow: hidden` 折叠期间注入开关；`false` 禁用后回落检测 warn、自行处理裁剪 |

## 注意事项

- **margin 通道要求父容器裁剪**：默认注入 `overflow: hidden`（折叠期间，展开后恢复原值）；`injectOverflow: false` 且父容器未裁剪时滑出过程溢出可见（warn 提示）；
- **宿主自身不可设 `overflow: hidden`**——滑出折叠的宿主宽度保持，会把骑边把手一并裁掉；子内容隐藏由指令经 `visibility` 规则处理（把手排除）；
- `collapse: 'slide'` 占位不变——内联布局中折叠后**兄弟不流入**（原占位保留）；需要腾出布局空间用默认 `'margin'`，覆盖式（fixed 面板）才配 `'slide'`；
- `maxSize` 缺省时展开依赖宿主有确定的 CSS 尺寸（无 CSS 尺寸的 auto 元素收缩后展开可能塌陷——显式声明 `maxSize` 或给 CSS 尺寸）；
- 折叠/展开动画时长 `--autospark-expandable-duration`（默认 .25s）；把手视觉经 `--autospark-expandable-trigger-*` 变量族定制（尺寸/边框/背景/图标，对齐 x-splitter 把手变量命名）；
- 宿主为 fixed/absolute 时 position 不受影响；static 宿主由指令自动补 inline `relative`（把手定位上下文）；
- 把手键盘可达：Tab 聚焦 + Enter/Space 触发，与点击同管线（`role="button"`）。
