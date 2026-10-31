# x-resizable 尺寸调节

## 概述

`x-resizable` 为宿主元素提供**拖拽调节尺寸**能力：引擎在元素边缘注入调节手柄，指针拖拽（或键盘方向键）改变宽高，支持指定调节方向、最小/最大尺寸约束、网格吸附与等比锁定（ADR-0064）。指令值**可选**——无值是纯 DOM 交互，有值（`x-resizable="box"`）则与状态双向绑定；[x-drawer](./x-drawer.md) / [x-dialog](./x-dialog.md) 经 `resize` 选项复用同一核心（见文末[覆盖物集成](#覆盖物集成)）。

```html
<!-- 无值：纯 DOM，拖拽直改 style.width/height -->
<div x-resizable style="width: 320px; height: 200px"></div>

<!-- 有值：与状态双向绑定 -->
<div x-resizable="panelSize" x-resizable-options="{minWidth: 200, maxWidth: 640}"></div>
```

::: tip 插件指令
`x-resizable` 由官方插件包 `@autospark/plugins` 提供（ADR-0128 核心集外移），使用前须加载插件脚本，且**先于 engine 实例化**：

```html
<script src="/autospark/autospark.js"></script>
<script src="/autospark/autospark.layout.js"></script>
```

npm 场景：`npm install @autospark/plugins` 后自 `node_modules/@autospark/plugins/dist/` 复制所需产物进项目；CDN 直引把上例 `src` 换为 `https://unpkg.com/@autospark/plugins/dist/autospark.layout.js`。

未加载插件时 `x-resizable` 属性会被编译器当作普通属性剥除，指令不生效。`autospark.layout.js` 同时包含布局家族全部指令（x-layout / x-pane / x-splitter / x-expandable / x-resizable / x-container / x-viewport），加载一次即全家族可用。聚合产物 `autospark.plugins.js` 一个标签包含全部官方插件。
:::

## 快速入门

<demo html="resizable/basic.html"/>

不配置任何选项时，`e`（右）、`s`（下）、`se`（右下角）三个方向的手柄自动可用——这三个方向对文档流内元素是**自然方向**（左/上边缘锚定在布局位，无需位置补偿）。

## 指南

### 指令值

| 形态 | 语义 |
|---|---|
| 无值 | 纯 DOM：拖拽直改 inline 尺寸，零状态成本 |
| 对象路径 | 双向绑定 `{width, height}`（px number）——拖拽中实时写回，外部改状态反向同步（过钳制管线） |
| 表达式 | 只读降级（状态 → DOM 单向，warn 一次）——对齐 x-model 的只读降级惯例 |

读写两方向的细节与联动演示见[可选值双向绑定](#可选值双向绑定)。

### 调节方向（handles）

<demo html="resizable/handles.html"/>

八方向枚举：四边 `n`（上）/ `s`（下）/ `e`（右）/ `w`（左）+ 四角 `ne` / `nw` / `se` / `sw`。

声明走 `handles` 选项，修饰符 `x-resizable.e.s.se` 是等价快捷写法（解析期并入同一选项）：

```html
<!-- 逗号串或数组 -->
<div x-resizable x-resizable-options="{handles: 'e,s'}"></div>
<div x-resizable x-resizable-options="{handles: ['e','s','se']}"></div>

<!-- 修饰符糖：只保留右下角 -->
<div x-resizable.se></div>
```

**流内降级**：文档流内元素（`static` / `relative`）只保留自然方向 `e` / `s` / `se`——从 `w` / `n` 等对侧拖拽需要同时补偿 `left` / `top`，只有 `absolute` / `fixed` 定位元素才能完整 8 向。声明了非自然方向但宿主未定位时，引擎丢弃这些方向并 warn（不自动改 position）。手柄定位需要宿主成为 containing block：宿主无 inline `position` 时引擎补 `position: relative`（零视觉影响，仅作手柄锚定）。

### 尺寸约束（min / max）

<demo html="resizable/constraints.html"/>

```html
<!-- number 按 px；字符串支持任意 CSS 长度 -->
<div
  x-resizable
  x-resizable-options="{minWidth: 200, maxWidth: 640, minHeight: 120, maxHeight: '80%'}"
></div>
```

约束来源是**回退链**：指令选项 → 宿主 computed `min-width` / `max-width` / `min-height` / `max-height`——写在 CSS 里的约束天然生效，指令选项显式值优先。

### 网格吸附与等比锁定（snap / aspectRatio）

<demo html="resizable/snap-aspect.html"/>

```html
<!-- 8px 步进吸附 -->
<div x-resizable x-resizable-options="{snap: 8}"></div>

<!-- 锁定宽高比 16:9（比值串） -->
<div x-resizable x-resizable-options="{aspectRatio: '16:9'}"></div>
<div x-resizable x-resizable-options="{aspectRatio: 1.618}"></div>
```

钳制管线统一为：**原始位移 → snap 吸附 → aspectRatio 等比 → min/max 钳制**——钳制恒最后，约束是硬边界（等比与钳制冲突时比值为软约束让位）。等比时主轴优先：横向手柄（含角）以宽为主轴、高 = 宽 ÷ 比；纯纵向手柄（`n` / `s`）以高为主轴。

### 可选值双向绑定

<demo html="resizable/binding.html"/>

值绑定一个**对象路径**（`{width, height}`，px number）即启用双向：

```html
<div x-data>
  <div x-resizable="box" style="width: 200px; height: 120px"></div>
  <!-- 其他绑定即时联动（拖拽中实时写回） -->
  <span x-text="box.width + ' × ' + box.height"></span>
</div>
```

- **拖拽 → 状态**：拖拽过程中实时写回 `box.width` / `box.height`（经调度器微任务合并），任何订阅该状态的绑定即时联动；
- **状态 → 拖拽**：外部修改 `box.width` 同步回宿主尺寸（经约束钳制），等值短路防止循环。

### 事件（resize:start / resize:move / resize:end）

<demo html="resizable/events.html"/>

调节手势的生命周期以 DOM 冒泡事件派发在**宿主元素**上（冒号命名空间对齐 `tree:*` 家族惯例）：

```html
<div x-resizable @resize:end="log('最终尺寸：' + $event.detail.width + '×' + $event.detail.height)"></div>
```

| 事件 | 时机 | detail |
|---|---|---|
| `resize:start` | 手势开始（pointerdown / 首次按键） | `{width, height, handle}`（起始尺寸） |
| `resize:move` | 拖拽中每次应用 / 每次按键 | `{width, height, handle}`（当前值） |
| `resize:end` | 手势结束（pointerup / keyup / 失焦） | `{width, height, handle}`（最终值） |

`handle` 为方向枚举（`'e'` / `'se'`…）。

### 键盘调节

<demo html="resizable/keyboard.html"/>

手柄可聚焦（`tabindex=0` + `role="separator"`）：聚焦后**方向键 ±1px**、**Shift + 方向键 ±10px**，与拖拽走同一钳制管线、派发同样的三事件。

### 手柄样式定制

<demo html="resizable/styles.html"/>

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

<demo html="resizable/drawer.html"/>

drawer / dialog 经 `resize` 选项启用同一调节核心，手柄挂到**面板**上：

```html
<!-- true：方向按形态自动推导 + 默认约束 -->
<button x-drawer:sidebar="ui.open" x-drawer-options="{resize: true}"></button>

<!-- 对象：字段与 x-resizable 选项同构；handles 只能在形态合法集内收窄 -->
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
| 尺寸记忆 | —— | **会话内记忆**：拖出尺寸重开沿用，**优先于声明 `size`**（见[注意事项](#注意事项)） |

事件同样派发在**指令宿主**（挂 `x-drawer` 的元素）上，`@resize:end` 绑定语法与普通元素一致。

## 配置选项

（`x-resizable-options`，relaxed-json；修饰符解析期并入同名选项键，ADR-0007）

| 配置项 | 默认值 | 修饰符 | 说明 |
|---|---|---|---|
| `handles` | `'e,s,se'` | `.e` `.s` `.se` 等八向（并入） | 方向集：逗号串或数组（`'e,s'` / `['e','s']`） |
| `minWidth` / `maxWidth` | 回退宿主 computed `min/max-width` | — | 宽度约束：number（px）或 CSS 长度串（`'80%'`、`'10rem'`） |
| `minHeight` / `maxHeight` | 回退宿主 computed `min/max-height` | — | 高度约束：同上 |
| `aspectRatio` | 不锁 | — | 宽/高比：number（`1.618`）或比值串（`'16:9'`），等比锁定 |
| `snap` | `0` | — | 网格吸附步进（px，0 关闭） |

## 注意事项

- **`x-resizable` 于 2026-10-11 由 `x-resize` 更名**：裸名词形态易误读为 resize 事件钩子，更名对齐 x-expandable / x-foldable 的能力形容词家族（ADR-0064 修订记录）。旧属性 `x-resize` / `x-resize-options` 已失效（硬更名，无兼容别名）；**衍生命名保留 `resize-*` 原名**——`resize:start / resize:move / resize:end` 事件、`data-autospark-resize-handle` 属性、`--autospark-resize-handle-*` CSS 变量均未随指令名更名。
- **与 x-expandable 同元素互斥**：宿主同时声明 [x-expandable](./x-expandable.md) 时本指令**自失效**（warn 提示迁移）——x-expandable 内建**单边** resize（方向由折叠方向推导，复用本指令的 `ResizeSession` 核心，约束字段同构），边线交互由其独占以消除把手/手柄/边条的三层命中冲突（ADR-0072）。需要「可折叠 + 可调节」的组合请直接使用 `x-expandable-options="{resize: true}"`。
- **手柄是宿主真实子元素**：宿主同时是结构指令（x-for 等 ownsChildren 类）时，手柄注入以 `data-autospark-resize-handle` 标记识别、不参与子树重编译。
- **覆盖物记忆值优先**：drawer 声明 `size` 与 resize 记忆值并存时记忆值优先生效——改了 `size` 配置但面板「不响应」属预期行为，重置路径 = 重建 engine。
