# x-splitter 分割器

## 概述

`x-splitter` 把宿主渲染为**两面板分割布局**：引擎在两个子元素（面板，Pane）之间注入一条**分隔条**（Divider），拖拽分隔条（或聚焦后按方向键）调节**定容面板**（声明 `data-size` 者）的主轴尺寸，**自适应面板**（无 `data-size` 者）恒吸收剩余空间。指令值是 `direction` 表达式（`'horizontal'` 左右分栏 / `'vertical'` 上下分栏，响应式切换即换轴重排）；`collapsible` 选项启用**折叠把手**——折叠 ≡ 尺寸为 0 的纯派生态，把手骑分隔条、坐标可调（ADR-0067）。

```html
<div x-splitter="'horizontal'" style="height: 300px">
  <div data-size="240px" data-min-size="200" data-max-size="60%">定容面板</div>
  <div>自适应面板（flex:1）</div>
</div>
```

## 快速入门

<demo html="splitter/basic.html"/>

宿主只允许**两个渲染子元素**（多余者 warn + 丢弃，`<template>`/`<script>` 静默容忍）；不足两个时 warn 并退化为普通编译（内容不丢）。声明了 `data-size` 的面板由拖拽调节，没声明的恒为自适应——所以标准形态是「一容一自」，拖动的是定容面板的尺寸。

## 指南

### 指令值

值是 **direction 表达式**：求值结果为 `'vertical'` 时上下分栏，**其余一切值**（含 `'horizontal'`、`undefined` 空窗期）静默归一为左右分栏。

```html
<!-- 引号字符串字面量（静态） -->
<div x-splitter="'vertical'">…</div>

<!-- 状态路径 / 表达式（响应式切换 = 换轴重排） -->
<div x-splitter="layout.dir">…</div>
```

方向切换时面板与分隔条 DOM **不重建**：只有布局属性翻转 + 定容面板 inline 尺寸同值换轴重写（`width: 240px` ↔ `height: 240px`——`data-size` 声明轴中立，与 [x-drawer](./x-drawer.md) 的 `size` 同款方向中立）。

### 面板契约（data-size 家族）

<demo html="splitter/basic.html"/>

定容面板声明三件套（CSS 长度全形态，纯数字按 px；单位混用允许，钳制时统一换算 px 比较）：

```html
<div x-splitter="'horizontal'">
  <div data-size="240px" data-min-size="200" data-max-size="60%">…</div>
  <div>…</div>
</div>
```

- **保持声明单位**：`data-size="30%"` 拖后写回 `37.2%`——单位是布局意图，拖拽不篡改（百分比基准 = 宿主主轴内容区）；
- `data-min-size` / `data-max-size` **仅定容面板认**（自适应面板上声明 warn + 忽略——保底需求用定容面板的 `max` 表达）；自适应面板可被拖至 0 宽（无隐式防挤压下限）；
- **初始声明值不钳制**（声明即真相），拖拽钳制恒遵守 min/max；
- 绑定形态 `:data-size` / `:data-min-size` / `:data-max-size` 由指令接管（结果 DOM 无该伪属性），见下一节。

### 双向绑定

<demo html="splitter/binding.html"/>

`:data-size` 绑定**简单状态路径**即双向（语义与 [x-resize](./x-resize.md) 可选值绑定同源）：

```html
<div x-data="{ sidebar: 260 }">
  <div x-splitter="'horizontal'">
    <div :data-size="sidebar" data-min-size="160">侧栏</div>
    <div>内容区</div>
  </div>
</div>
```

- **拖拽 → 状态**：拖拽中实时写回（保持声明单位；px 写 number、其余写 string）；
- **状态 → DOM**：外部改 `sidebar` 反向同步面板尺寸；
- **防递归三防线**：拖拽会话期抑制外部反写 + 等值短路 + 写回统一格式化，循环不可达；
- 值为**表达式**（非简单路径）时 warn 一次 + 降级单向（状态 → DOM），把手折叠仅作用于 UI（状态变更后会被拉回）——对齐 x-model / x-resize 的只读降级惯例。

### 方向切换

<demo html="splitter/direction.html"/>

### 折叠（collapsible）

<demo html="splitter/collapse.html"/>

`collapsible` 选项启用**折叠把手**——骑在分隔条上的圆形按钮，箭头为内置全局图标 `arrow`（`arrow` 指向「下一步动作的分隔条位移方向」、随折叠态翻转；用户同名覆盖 `arrow` 图标自动跟随）。**折叠 ≡ 纯派生态**（无独立 collapsed 状态源）：把手点击就是写尺寸（绑定时写状态、静态时直写 DOM），初始声明等于折叠目标即初始折叠。

折叠行为由 `data-minimize-size`（声明在定容面板上，支持 `:data-minimize-size` 绑定）分派：

| 折叠目标 | 行为 |
|---|---|
| 未声明（缺省）或声明 `0` | **slide 滑入滑出**——面板宽度保持（内容不挤压），整体滑出容器边缘（负 margin 拉回占位 + 容器 `overflow: hidden` 裁剪），自适应面板扩展占满 |
| 声明 `> 0` 尺寸 | **收缩到指定尺寸**——面板保留最小化可见形态（如迷你侧栏），过渡动画为宽度收缩 |

- 折叠前**记忆 lastSize**（实例状态），展开恢复；记忆缺失时回退 `data-size` 声明值（声明值为折叠目标视为无）再退 200px；
- 折叠写目标值**绕过 min 钳制**（折叠目标是特殊语义值），拖拽仍遵守 min/max；
- 初始 `data-size` 等于折叠目标（0 或 minimize 值）= 初始折叠态，不派发事件；
- **跨折叠态翻转有过渡动画**（时长 `--autospark-splitter-duration`，默认 .25s）；非翻转的尺寸变更与拖拽全程瞬时；
- 双自适应面板（无定容面板）时 `collapsible` 不生效（无折叠对象）。

### 嵌套

<demo html="splitter/nested.html"/>

子 splitter 声明在某面板内部即随子树编译自然生效，零新机制——经典应用骨架（外层左右分栏 + 内层上下分栏）直接书写即可。

### 事件（splitter:resize / splitter:collapse / splitter:expand）

<demo html="splitter/collapse.html"/>

调节与折叠以 DOM 冒泡事件派发在**宿主元素**上（冒号命名空间对齐 `tree:*` / `resize:*` 家族惯例）：

```html
<div x-splitter="'horizontal'" @splitter:resize="save($event.detail.size)">…</div>
```

| 事件 | 时机 | detail |
|---|---|---|
| `splitter:resize` | 拖拽/键盘会话结束 | `{size}`（最终值，保持声明形态） |
| `splitter:collapse` | 折叠态翻转（任何来源：把手 / 键盘 / 外部写 0） | `{size: 0}` |
| `splitter:expand` | 同上（反向） | `{size: 恢复值}` |

初始即折叠（`data-size="0"`）**不派发** collapse——事件只反馈变更，不做状态快照。

### 键盘与样式定制

分隔条可聚焦（`tabindex="0"` + `role="separator"`）：方向键 = 分隔条的几何位移方向，**±1px** / **Shift ±10px**，与拖拽同管线同事件。双自适应面板（无 `data-size` 声明）时分隔条退化为纯视觉分界（`data-static`：不可聚焦、不可拖、无把手）。

视觉经 CSS 变量定制（类级注入的全局样式表）：

```css
#my-splitter {
  --autospark-splitter-divider-size: 2px;    /* 指示线视觉宽度 */
  --autospark-splitter-hit-size: 10px;       /* 拖拽命中区宽度 */
  --autospark-splitter-color: #e2e8f0;       /* 指示线颜色 */
  --autospark-splitter-color-hover: #94a3b8; /* hover/聚焦高亮 */
  --autospark-splitter-trigger-size: 20px;   /* 折叠把手直径 */
  --autospark-splitter-trigger-icon-size: 12px; /* 把手箭头图标尺寸 */
  --autospark-splitter-duration: .25s;       /* 折叠/展开动画时长 */
}
```

## 配置选项

| 配置项 | 默认值 | 修饰符 | 说明 |
|---|---|---|---|
| `collapsible` | `false` | — | 折叠能力与把手坐标：`false` 不启用；`true` ≡ `'50%'` 居中；`number` 为 px、`string` 为 CSS 长度（`'80'`/`'20%'`/`'2rem'`）——沿分隔条长轴一维定位，正距主端、负距对端，越界静默钳制（把手是唯一重开触发点），非法值 warn 回退居中。支持成员属性表达式（`x-splitter-options.collapsible`）热应用重定位 |

## 注意事项

- **`engine.patch` 拒绝落入 splitter 子树**：x-splitter 是结构指令（接管子树编译），与 x-for / eager x-if 同受动态区域防护——面板内动态内容请用 x-if / x-show / x-html.compile 等声明式工具；
- **至多一个定容面板**：两个都声明 `data-size` 时第二个 warn + 按自适应处理（拖拽需要吸收方是结构前提，双固定直接写 CSS 即可）；
- 宿主恒 `overflow: hidden`（分割布局裁剪语义 + slide 折叠的依赖前提）——面板内依赖溢出宿主的自绘浮层会被裁剪（body 级浮层如 tooltip 不受影响）；
- 面板内表达式的数据上下文与宿主一致（正常子树编译），子树的 x-data / x-for / x-if 等照常工作；
- slide 折叠保留面板宽度与内容运行态；收缩折叠（minimize > 0）内容随宽度重排——表单输入等状态保留，滚动位置可能变化；direction 切换 / 引擎销毁重建不保留；
- 把手是否创建以编译期为断：`collapsible` 经表达式从 `false` 动态变真值**不补建**（x-drawer 把手同款）。
