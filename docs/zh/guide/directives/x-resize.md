# 尺寸调节（x-resize）

## 概述

`x-resize` 为宿主元素提供**拖拽调节尺寸**能力：引擎在元素边缘注入调节手柄，指针拖拽（或键盘方向键）改变宽高，支持指定调节方向、最小/最大尺寸约束、网格吸附与等比锁定（ADR-0064）。指令值**可选**——无值是纯 DOM 交互，有值（`x-resize="box"`）则与状态双向绑定；[x-drawer](./x-drawer.md) / [x-dialog](./x-dialog.md) 经 `resize` 选项复用同一核心（见文末[覆盖物集成](#覆盖物集成)）。

```html
<!-- 无值：纯 DOM，拖拽直改 style.width/height -->
<div x-resize style="width: 320px; height: 200px"></div>

<!-- 有值：与状态双向绑定 -->
<div x-resize="panelSize" x-resize-options="{minWidth: 200, maxWidth: 640}"></div>
```

## 快速入门

<demo html="resize/basic.html"/>

不配置任何选项时，`e`（右）、`s`（下）、`se`（右下角）三个方向的手柄自动可用——这三个方向对文档流内元素是**自然方向**（左/上边缘锚定在布局位，无需位置补偿）。

## 指南

### 调节方向（handles）

<demo html="resize/handles.html"/>

八方向枚举：四边 `n`（上）/ `s`（下）/ `e`（右）/ `w`（左）+ 四角 `ne` / `nw` / `se` / `sw`。

声明走 `handles` 选项，修饰符 `x-resize.e.s.se` 是等价快捷写法（解析期并入同一选项）：

```html
<!-- 逗号串或数组 -->
<div x-resize x-resize-options="{handles: 'e,s'}"></div>
<div x-resize x-resize-options="{handles: ['e','s','se']}"></div>

<!-- 修饰符糖：只保留右下角 -->
<div x-resize.se></div>
```

**流内降级**：文档流内元素（`static` / `relative`）只保留自然方向 `e` / `s` / `se`——从 `w` / `n` 等对侧拖拽需要同时补偿 `left` / `top`，只有 `absolute` / `fixed` 定位元素才能完整 8 向。声明了非自然方向但宿主未定位时，引擎丢弃这些方向并 warn（不自动改 position）。手柄定位需要宿主成为 containing block：宿主无 inline `position` 时引擎补 `position: relative`（零视觉影响，仅作手柄锚定）。

### 尺寸约束（min / max）

<demo html="resize/constraints.html"/>

```html
<!-- number 按 px；字符串支持任意 CSS 长度 -->
<div
  x-resize
  x-resize-options="{minWidth: 200, maxWidth: 640, minHeight: 120, maxHeight: '80%'}"
></div>
```

约束来源是**回退链**：指令选项 → 宿主 computed `min-width` / `max-width` / `min-height` / `max-height`——写在 CSS 里的约束天然生效，指令选项显式值优先。

### 网格吸附与等比锁定（snap / aspectRatio）

<demo html="resize/snap-aspect.html"/>

```html
<!-- 8px 步进吸附 -->
<div x-resize x-resize-options="{snap: 8}"></div>

<!-- 锁定宽高比 16:9（比值串） -->
<div x-resize x-resize-options="{aspectRatio: '16:9'}"></div>
<div x-resize x-resize-options="{aspectRatio: 1.618}"></div>
```

钳制管线统一为：**原始位移 → snap 吸附 → aspectRatio 等比 → min/max 钳制**——钳制恒最后，约束是硬边界（等比与钳制冲突时比值为软约束让位）。等比时主轴优先：横向手柄（含角）以宽为主轴、高 = 宽 ÷ 比；纯纵向手柄（`n` / `s`）以高为主轴。

### 可选值双向绑定

<demo html="resize/binding.html"/>

值绑定一个**对象路径**（`{width, height}`，px number）即启用双向：

```html
<div x-data>
  <div x-resize="box" style="width: 200px; height: 120px"></div>
  <!-- 其他绑定即时联动（拖拽中实时写回） -->
  <span x-text="box.width + ' × ' + box.height"></span>
</div>
```

- **拖拽 → 状态**：拖拽过程中实时写回 `box.width` / `box.height`（经调度器微任务合并），任何订阅该状态的绑定即时联动；
- **状态 → 拖拽**：外部修改 `box.width` 同步回宿主尺寸（经约束钳制），等值短路防止循环；
- 值为**表达式**（非简单路径）时降级只读（状态 → DOM 单向）并 warn 一次——对齐 x-model 的只读降级惯例。

### 事件（resize:start / resize:move / resize:end）

<demo html="resize/events.html"/>

调节手势的生命周期以 DOM 冒泡事件派发在**宿主元素**上（冒号命名空间对齐 `tree:*` 家族惯例）：

```html
<div x-resize @resize:end="log('最终尺寸：' + $event.detail.width + '×' + $event.detail.height)"></div>
```

| 事件 | 时机 | detail |
|---|---|---|
| `resize:start` | 手势开始（pointerdown / 首次按键） | `{width, height, handle}`（起始尺寸） |
| `resize:move` | 拖拽中每次应用 / 每次按键 | `{width, height, handle}`（当前值） |
| `resize:end` | 手势结束（pointerup / keyup / 失焦） | `{width, height, handle}`（最终值） |

`handle` 为方向枚举（`'e'` / `'se'`…）。

### 键盘调节

<demo html="resize/keyboard.html"/>

手柄可聚焦（`tabindex=0` + `role="separator"`）：聚焦后**方向键 ±1px**、**Shift + 方向键 ±10px**，与拖拽走同一钳制管线、派发同样的三事件。

### 与 x-expandable 同元素互斥

宿主同时声明 [x-expandable](./x-expandable.md) 时本指令**自失效**（warn 提示迁移）——x-expandable 内建**单边** resize（方向由折叠方向推导，复用本指令的 `ResizeSession` 核心，约束字段同构），边线交互由其独占以消除把手/手柄/边条的三层命中冲突（ADR-0072）。需要「可折叠 + 可调节」的组合请直接使用 `x-expandable-options="{resize: true}"`。

### 手柄样式定制

<demo html="resize/styles.html"/>

默认样式（类级注入的全局样式表）经 CSS 变量定制：

```css
#my-panel {
  --autospark-resize-handle-color: #6366f1;   /* 手柄视觉色（hover/聚焦显形） */
  --autospark-resize-handle-thickness: 10px;  /* 边手柄厚度 */
  --autospark-resize-handle-size: 12px;       /* 角手柄尺寸 */
}
```

手柄是宿主的**真实子元素**（`<span data-autospark-resize-handle="e">`），可直接用该属性选择器完全接管样式。

### 覆盖物集成（x-drawer / x-dialog）

<demo html="resize/drawer.html"/>

drawer / dialog 经 `resize` 选项启用同一调节核心，手柄挂到**面板**上：

```html
<!-- true：方向按形态自动推导 + 默认约束 -->
<button x-drawer:sidebar="ui.open" x-drawer-options="{resize: true}"></button>

<!-- 对象：字段与 x-resize 选项同构；handles 只能在形态合法集内收窄 -->
<button
  x-dialog:editor="ui.open"
  x-dialog-options="{resize: {handles: 'se,sw', minWidth: 320}}"
></button>
```

与普通元素的差异（ADR-0064 决策八）：

| | 普通元素 | 覆盖物（drawer / dialog） |
|---|---|---|
| 方向 | 声明任意八向（流内自动降级） | **形态自动推导**：drawer 贴边内侧单边（`placement: left` → `e`，类推）；dialog 四角（`ne,nw,se,sw`） |
| 尺寸落点 | 宿主 `style.width/height` | shell **面板**宽高（长轴仍由贴边/居中体系管理） |
| 状态写回 | 可选值双向绑定 | **不写回 store**——`resize:end` 事件 detail 即数据出口 |
| 尺寸记忆 | —— | **会话内记忆**：拖出尺寸重开沿用，**优先于声明 `size`**（改了 `size` 配置面板「不响应」属预期，重置路径 = 重建 engine） |

事件同样派发在**指令宿主**（挂 `x-drawer` 的元素）上，`@resize:end` 绑定语法与普通元素一致。

## API

### 指令值

| 形态 | 语义 |
|---|---|
| 无值 | 纯 DOM：拖拽直改 inline 尺寸，零状态成本 |
| 对象路径 | 双向绑定 `{width, height}`（px number） |
| 表达式 | 只读降级（warn 一次） |

### 指令选项（x-resize-options）

| 键 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `handles` | string \| string[] | `'e,s,se'` | 方向集（修饰符糖等价） |
| `minWidth` / `maxWidth` | number \| string | 回退 computed | 宽度约束（px 或 CSS 长度） |
| `minHeight` / `maxHeight` | number \| string | 回退 computed | 高度约束 |
| `aspectRatio` | number | 不锁 | 宽/高比（等比锁定） |
| `snap` | number | `0` | 网格吸附步进（px，0 关闭） |
