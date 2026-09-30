# x-splitter 分割器

## 概述

`x-splitter` 把宿主渲染为**两面板分割布局**：引擎在两个子元素（面板，Pane）之间注入一条**分隔条**（Divider），拖拽分隔条（或聚焦后按方向键）调节**定容面板**（声明 `data-size` 者）的主轴尺寸，**自适应面板**（无 `data-size` 者）恒吸收剩余空间。指令值是 `direction` 表达式（`'horizontal'` 左右分栏 / `'vertical'` 上下分栏，响应式切换即换轴重排）；定容面板声明 `data-expandable` 启用**折叠**（机制组合 [x-expandable](./x-expandable.md)，ADR-0070）——把手骑面板活动边线，折叠目标与把手选项经 `data-expandable` 透传。

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
- 值为**表达式**（非简单路径）时 warn 一次 + 降级单向（状态 → DOM），面板折叠（[data-expandable](#折叠data-expandable)）仅作用于 UI（状态变更后会被拉回）——对齐 x-model / x-resize 的只读降级惯例。

### 方向切换

<demo html="splitter/direction.html"/>

方向值是响应式表达式，切换即换轴重排。注意：demo 的单选钮写回本层 x-data 域用了 `x-model-options="{set: 'dir = $value'}"`——**x-model 简单路径的写回落点在 store 根**，写回 x-data 局部域须显式 `set` 表达式（详见 [x-model](./x-model.md#绑定局部数据)「绑定局部数据」）。

### 折叠（data-expandable）

<demo html="splitter/collapse.html"/>

定容面板声明 `data-expandable` 启用折叠——分割器在面板上实例化 [x-expandable](./x-expandable.md)（ADR-0070 组合）：把手/折叠动画/事件全部走 x-expandable 原生管线，把手骑**面板活动边线**（即分隔条所在边界，滑出折叠终态迁至分割器宿主边缘呈半圆把手）。属性值专职选项透传：**空属性 = 全默认参数；JSON 对象 = 传 [x-expandable](./x-expandable.md) options**（`minSize`/`pos`/`fadeSize`/`showTrigger` 等）。

分割器接管的语义（options 中声明无效，warn 提示）：

- `direction`：按定容面板**位次自动推导**——首位向主端收（`'left'`/`'top'`）、次位向对端收（`'right'`/`'bottom'`），换轴重排时跟随更新；
- `maxSize`：展开尺寸由分割器的尺寸管理供给——折叠前记忆 lastSize，展开恢复（记忆缺失回退 `data-size` 声明值，声明值为折叠目标视为无，再退 200px）。

折叠行为由 `minSize` 分派（x-expandable 双通道，语义与旧 `data-minimize-size` 同构）：

| 折叠目标 | 行为 |
|---|---|
| 未声明（缺省）或 `0` | **滑出折叠**——面板宽度保持（内容不挤压），整体滑出容器边缘（负 margin + 宿主 `overflow: hidden` 裁剪），自适应面板扩展占满 |
| `> 0` | **尺寸收缩**——面板保留迷你可见形态，过渡动画为宽度收缩（折叠态挂 `data-shrunk` 钩子） |

- **折叠布尔为真相**（x-expandable 持有）：把手点击/键盘翻转折叠态；拖拽跨折叠目标自动翻转为折叠（反向拖拽即展开）；
- 折叠写目标值**绕过 min 钳制**（折叠目标是特殊语义值），拖拽仍遵守 min/max；
- 初始 `data-size` 等于折叠目标 = 初始折叠态，无动画、不派发事件；
- 把手默认 `showTrigger: 'hover'`：**分隔条本身充当全长感应线**（鼠标悬停分隔条即显形把手——桥接机制；x-expandable 的感应边条在本语境被抑制，避免遮挡分隔条拖拽命中区），把手本体 hover/聚焦照常显形，折叠态恒显；`'always'` 恒常驻；
- 把手默认注入 `offset` = **分隔条宽度一半**（把手中分分隔条；offset 固定轴语义 `+` = 右/下，与定容面板位次相关——首位 `+half`、次位 `−half`），用户显式声明 `offset` 则尊重不覆盖；
- 自适应面板声明 `data-expandable` warn + 忽略（折叠仅定容面板可启用）；双自适应面板（无定容面板）无折叠对象。

### 嵌套

<demo html="splitter/nested.html"/>

子 splitter 声明在某面板内部即随子树编译自然生效，零新机制——经典应用骨架（外层左右分栏 + 内层上下分栏）直接书写即可。

### 事件（splitter:resize + expandable:*）

<demo html="splitter/collapse.html"/>

调节以 DOM 冒泡事件派发在**宿主元素**上；折叠事件由组合的 x-expandable 派发在**面板元素**上、冒泡经宿主（ADR-0070：`splitter:collapse/expand` 已删除）：

```html
<div x-splitter="'horizontal'" @splitter:resize="save($event.detail.size)" @expandable:collapse="onHide()">
    <div data-size="300" data-expandable>…</div><div>…</div>
</div>
```

| 事件 | 派发目标 | 时机 | detail |
|---|---|---|---|
| `splitter:resize` | 分割器宿主 | 拖拽/键盘会话结束 | `{size}`（最终值，保持声明形态） |
| `expandable:collapse` | 面板（冒泡至宿主） | 折叠态翻转（把手 / 键盘 / 拖拽跨目标 / 外部写值） | `{size}`（`0` 或 minSize 格式化值） |
| `expandable:expand` | 面板（冒泡至宿主） | 同上（反向） | `{size}`（恢复尺寸格式化值） |

初始即折叠（`data-size` 等于折叠目标）**不派发**——事件只反馈变更。

### 键盘与样式定制

分隔条可聚焦（`tabindex="0"` + `role="separator"`）：方向键 = 分隔条的几何位移方向，**±1px** / **Shift ±10px**，与拖拽同管线同事件。双自适应面板（无 `data-size` 声明）时分隔条退化为纯视觉分界（`data-static`：不可聚焦、不可拖）。

视觉经 CSS 变量定制（类级注入的全局样式表）；折叠把手与折叠动画的视觉走 x-expandable 契约（`--autospark-expandable-trigger-*` / `--autospark-expandable-duration`，见 [x-expandable](./x-expandable.md)）：

```css
#my-splitter {
  --autospark-splitter-divider-size: 2px;    /* 指示线视觉宽度 */
  --autospark-splitter-hit-size: 10px;       /* 拖拽命中区宽度 */
  --autospark-splitter-color: #e2e8f0;       /* 指示线颜色 */
  --autospark-splitter-color-hover: #94a3b8; /* hover/聚焦高亮 */
}
```

### 面板声明（data-* 契约属性）

| 属性 | 默认值 | 说明 |
|---|---|---|
| `data-size` | — | 声明定容面板；CSS 长度全形态（纯数字按 px），至多一个；绑定形态 `:data-size` 简单路径双向 |
| `data-min-size` / `data-max-size` | 无界 | 拖拽下限/上限；仅定容面板认读（自适应面板声明 warn + 忽略） |
| `data-expandable` | 未声明 | 启用折叠（**仅定容面板**）：空属性 = 全默认参数；JSON 对象 = 透传 [x-expandable](./x-expandable.md) options（`direction`/`maxSize`/`resize` 由分割器接管、声明无效 warn——面板调节唯一入口 = 分隔条拖拽；`offset` 缺省注入分隔条宽度一半）；把手默认 `showTrigger: 'hover'`（分隔条即感应线） |

## 注意事项

- **`engine.patch` 拒绝落入 splitter 子树**：x-splitter 是结构指令（接管子树编译），与 x-for / eager x-if 同受动态区域防护——面板内动态内容请用 x-if / x-show / x-html.compile 等声明式工具；
- **至多一个定容面板**：两个都声明 `data-size` 时第二个 warn + 按自适应处理（拖拽需要吸收方是结构前提，双固定直接写 CSS 即可）；
- 宿主恒 `overflow: hidden`（分割布局裁剪语义 + [滑出折叠](#折叠data-expandable)的依赖前提）——面板内依赖溢出宿主的自绘浮层会被裁剪（body 级浮层如 tooltip 不受影响）；
- 面板内表达式的数据上下文与宿主一致（正常子树编译），子树的 x-data / x-for / x-if 等照常工作；
- 滑出折叠保留面板宽度与内容运行态；收缩折叠（minSize > 0）内容随宽度重排——表单输入等状态保留，滚动位置可能变化；direction 切换 / 引擎销毁重建不保留；
- 折叠能力以编译期为断：`data-expandable` 是静态声明（不支持绑定形态），运行时无法动态增删；
- 折叠把手（x-expandable 组合）的 `pos` 自定义后位置沿面板边线变化，键盘 Tab 聚焦仍可达（把手 `role="button"`）。
