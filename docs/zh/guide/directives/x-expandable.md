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

收缩折叠另有两个配套机制：

- **渐变遮盖**（`fadeSize`，默认 `0` 不启用）：`> 0` 时折叠态在活动边显示一层渐隐遮盖（厚度即 `fadeSize`），提示「边缘之外还有内容」（业界惯例）。只在收缩折叠生效（滑出折叠内容整体隐藏，无指示意义）；折叠渐显、展开渐隐，不拦截鼠标事件；
- **收缩态钩子**（`data-shrunk`）：收缩折叠态宿主挂、展开摘除（滑出折叠走 `data-collapsed`，不挂）——页面 CSS 感知收缩态的通用钩子（如折叠态隐藏白名单列、切换图标布局），与 `fadeSize` 是否启用无关。

### slide 通道（覆盖形态）

<demo html="expandable/slide.html"/>

`collapse: 'slide'` 折叠 = `translateX/Y(±100%)` 平移滑出——**占位不变**，服务 `position: fixed` 的覆盖面板场景。宿主为 fixed/absolute 时指令**不改动**其 position（仅 static 宿主自动补 `relative` 作把手定位上下文）。

### 把手与滑轨定位

<demo html="expandable/basic.html"/>

把手是**圆心骑边线**的 20px 圆形按钮（内置全局图标 `arrow`，`role="button"` 可聚焦、Enter/Space 触发；箭头指向「下一步动作」随折叠态翻转）：

- **展开态**：圆心骑宿主**活动边线**（对侧边——`direction:'left'` 时在右边缘），外半圆突出宿主外；
- **滑出折叠态**：折叠动画完成后把手移入父容器，圆心骑**停靠边线**——外一半被父容器裁掉呈**半圆把手**（图标自动缩小并移入半圆中心，完整可见）；展开动画启动前移回宿主。滑出全程圆心恒贴边线，切换零跳变；
- `minSize>0` 折叠（宿主不滑出）：把手恒在宿主内骑活动边，不迁移。

滑轨坐标 `pos` 控制把手沿边线的位置（三态对齐家族惯例）：`'center'`（默认 ≡ `'50%'`）/ `number`（px）/ CSS 长度串（`'20%'`/`'2rem'`，**负值 = 距对端**）；越界静默钳制——把手是唯一重开触点，永可达。支持成员属性表达式（`x-expandable-options.pos`）响应式重定位。

`offset` 为把手提供**跨轴额外偏移**（修正骑边位置）：`number`（px）/ CSS 长度串 / `calc()`/`var()` 表达式，**负值合法**——固定轴语义：`+` = 把手跨轴的正方向（`direction: 'left'/'right'` 时 = 向右、`'top'/'bottom'` 时 = 向下），`3px` 在现有位置上向右/下偏 3px、`-2px` 反向。展开态与滑出折叠终态（dock）两套定位规则分别消费（活动边翻边，符号逐方向固定，见实现样式表）。典型用途：组合方注入几何补偿——[x-splitter](./x-splitter.md) 注入**分隔条宽度一半**使把手中分分隔条（首位 `+half` / 次位 `−half`）。

把手显隐经 `showTrigger` 控制（默认 `'hover'`）：视觉隐藏但**不丢命中**（`opacity: 0` 仍可点击/聚焦）；感应区是覆盖**整条活动边线**的透明边条（厚 24px，跨边内外各 12px）——`pos` 自定义把手位置后位置不可预知，鼠标移到边线任何位置把手即淡入；Tab 聚焦即显形。**常驻仅限滑出折叠**（`minSize=0`：宿主滑出后边条感应载体随宿主隐藏，把手是唯一重开触点必须常驻）与触屏设备；`minSize>0` 尺寸收缩折叠宿主可见、边条感应仍在——把手保持 hover 显隐控制（折叠态鼠标离开边线即隐藏）。`'always'` 恒常驻（边条不启用、零遮挡）。注意 hover 模式的边条会遮挡边线附近内容的点击（固有代价）；启用内建 `resize` 时感应载体让位拖拽手柄（见[内建单边 resize](#内建单边-resize与-x-resize-互斥)）。

### 内建单边 resize（与 x-resize 互斥）

<demo html="expandable/resize.html"/>

`resize` 选项（`true` / 对象，默认关闭；修饰符 `.resize` 同效——**修饰符与值同属一个属性** `x-expandable.resize="ui.open"`）为宿主启用**单边拖拽调节**：手柄骑活动边线，方向由折叠方向自动推导（`left` 折叠 → 右缘单边拉伸），复用 [x-resize](./x-resize.md) 的 `ResizeSession` 核心（指针/键盘/钳制零差异，事件 `resize:start/move/end` 派发宿主）。约束字段透传 x-resize（`minWidth/maxWidth/minHeight/maxHeight/snap`）；`handles`/`aspectRatio` 子键不适用单边语义（warn 忽略）。**拖出尺寸接管展开尺寸真相**：折叠再展开恢复拖出宽度（`detail.size` 同步）。

**把手与手柄同骑一条边线时的两层协调**（ADR-0072）：把手**压在手柄之上**——宿主挂 `data-resize`，样式表把把手抬到手柄层级之上，调节线不再横穿把手圆面、把手圆面区的命中不被手柄拦走（否则 hover 模式下把手不可见且点不到，折叠不可达）；代价是从把手圆面起手拖不到手柄，**调节线在把手 20px 之外照常拖拽**。同时**手柄接管感应**：感应边条被手柄带完全盖住收不到 hover，hover 模式「鼠标移到边线即显形把手」改由手柄 hover / 聚焦转译（`data-edge-hover` 桥接，与 [x-splitter](./x-splitter.md) 分隔条、[x-drawer](./x-drawer.md) 面板手柄同款契约）。

**与 x-resize 同元素互斥**（ADR-0072）：宿主同时声明两者时 **x-resize 自失效**（warn 提示迁移）——折叠与拖拽的边线交互由本指令独占，从根上消除把手/手柄/边条的三层命中冲突。`enable: false` 可关闭折叠功能：`{enable: false, resize: true}` 退化为**纯单边 resize**（无把手、值绑定不订阅）；双关 warn + 指令不作为。

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

### 场景：超长内容折叠

<demo html="expandable/long-content.html"/>

长文收纳是 height 轴的典型场景：`direction: 'top'`（向上收起，顶边不动、底边向上缩）+ `minSize: 96`（收缩折叠，只留标题与摘要行）；`maxSize` 缺省 = 展开时移除 inline 高度、由内容自然撑开；`resize: true` 启用底缘单边调节（方向随折叠方向推导）——拖底缘直接调阅读高度，拖出高度接管展开尺寸真相。两个布局要点：

- 溢出裁剪交给**内层包裹**（`height: 100%` + `overflow: hidden` 跟随宿主高度）——正文超出折叠高度的部分由它裁掉；
- 宿主自身仍不可设 `overflow: hidden`（会裁掉骑底边把手突出宿主的外半圆）。

### 场景：嵌套折叠

<demo html="expandable/nested.html"/>

外层侧栏走**滑出折叠**（`minSize=0` 默认），内层设置面板走**尺寸收缩**（`direction: 'top'` + `minSize: 44` 折叠只留标题行），两层各自绑定独立状态、把手各骑各边（外层右缘 / 内层底缘）互不干扰：

- 外层折叠把整个侧栏滑出父容器，内层随宿主子内容隐藏规则（`visibility`）一并隐藏，展开后原样恢复；
- 嵌套时内层建议用收缩通道：若内层也走滑出通道，其父容器注入（`overflow: hidden` + dock）会挂到**外层 x-expandable 宿主**上，裁掉外层把手突出宿主的外半圆；
- 内层面板的 overflow 需求由内层包裹承载（`.panel-body` 充满宿主、恒挂 `overflow: auto`）：折叠态内容超出 `minSize` 自动出滚动条、展开态自然收回——嵌套场景的内容适应与单层同一规则。

### 组合：折叠机制唯一实现（x-splitter / x-drawer）

x-expandable 是全引擎折叠机制的唯一实现（ADR-0070）——另外两个折叠场景是本指令的组合消费者：

- **[x-splitter](./x-splitter.md) 面板折叠**：定容面板声明 `data-expandable`（空属性 = 全默认 / JSON = 透传 options），分割器在面板上实例化本指令——把手骑面板活动边线（即分隔条边界）、折叠动画/事件全走本指令管线；`direction` 按面板位次推导、展开尺寸由分割器 lastSize 恢复链供给（options 中 `direction`/`maxSize` 接管无效），把手默认 `showTrigger: 'always'`（分隔条拖拽命中区与 hover 边条冲突）。事件 `expandable:collapse/expand` 在面板上派发、冒泡经分割器宿主监听；
- **[x-drawer](./x-drawer.md) 抽屉把手**：`x-drawer-options.expandable`（`true`/`false`/`{pos}`）经共享把手模块统一把手层——元素/箭头矩阵/键盘管线与折叠态半圆视觉与本指令同一契约（折叠 ≡ visible 归假的 drawer 语义不变，overlay 生命周期不组合）。

## 配置选项

| 配置项 | 默认值 | 修饰符 | 说明 |
|---|---|---|---|
| `enable` | `true` | — | 折叠功能开关：`false` 不建把手、值绑定不订阅；与 `resize` 双关 warn + 指令不作为（见[内建单边 resize](#内建单边-resize与-x-resize-互斥)） |
| `resize` | 关闭 | `.resize` | 内建单边拖拽调节（复用 x-resize 核心，方向由折叠方向推导）：`true` 默认约束 / 对象透传约束字段（`minWidth` 等，`handles`/`aspectRatio` 不适用 warn 忽略）；拖出尺寸接管展开尺寸真相；把手压手柄之上、感应让位手柄（手柄带盖住感应边条）；与 x-resize 同元素互斥 |
| `direction` | `'left'` | — | 收起方向（停靠边）：`'left'`/`'right'`/`'top'`/`'bottom'`，`left`/`right` 走 width 轴、`top`/`bottom` 走 height 轴；把手骑活动边（对侧边线）。非法值 warn 回退 `left` |
| `minSize` | `0` | — | 折叠尺寸：`number`（px）/ CSS 长度串。`0` = 滑出折叠（配合 `collapse`）；`> 0` = 尺寸收缩（迷你形态） |
| `maxSize` | — | — | 展开尺寸：`number`（px）/ CSS 长度串。缺省 = 展开时移除本指令写过的 inline 尺寸、由 CSS 决定 |
| `fadeSize` | `0` | — | 渐变遮盖厚度：`number`（px）/ CSS 长度串。`0`（默认）不启用；`> 0` 时**收缩折叠态**（minSize>0）在活动边显示渐隐遮盖（宿主 `::before`，`pointer-events` 关闭），指示内容被截断——折叠渐显、展开渐隐。颜色经 `--autospark-expandable-fade-color` 定制（默认 slate 半透明）。非法值 warn 忽略 |
| `collapse` | `'margin'` | — | 滑出折叠的实现通道（**仅 minSize=0 生效**）：`'margin'` 负 margin 滑出（占位归零、兄弟流入）；`'slide'` transform 平移（占位不变，服务 fixed 覆盖形态）。非法值 warn 回退 `margin` |
| `pos` | `'center'` | — | 把手滑轨坐标：`'center'` ≡ `'50%'`；`number` 为 px；`string` 为 CSS 长度（负值距对端），越界静默钳制。支持成员属性表达式热应用 |
| `offset` | `0` | — | 把手跨轴额外偏移（固定轴语义：`+` = 跨轴正方向右/下，负值反向）：`number`(px) / CSS 长度串 / `calc()`/`var()` 表达式透传；非法值 warn 忽略。典型用途 = 组合方注入分隔条宽度一半的几何补偿（见 [x-splitter](./x-splitter.md)） |
| `showTrigger` | `'hover'` | — | 把手显隐策略：`'hover'` 边线感应显形（**整条活动边线**感应淡入、Tab 聚焦显形；滑出折叠（minSize=0）与触屏设备常驻，minSize>0 收缩折叠保持 hover 控制）；`'always'` 恒常驻。非法值 warn 回退 `hover` |
| `injectOverflow` | `true` | — | 父容器 `overflow: hidden` 折叠期间注入开关；`false` 禁用后回落检测 warn、自行处理裁剪 |

## 注意事项

- **margin 通道要求父容器裁剪**：默认注入 `overflow: hidden`（折叠期间，展开后恢复原值）；`injectOverflow: false` 且父容器未裁剪时滑出过程溢出可见（warn 提示）；
- **宿主自身不可设 `overflow`**（`hidden`/`clip` 会裁掉骑边把手突出的外半圆，`auto`/`scroll` 会把把手随内容滚走；引擎编译后检测到非 `visible` 时 warn 一次）——overflow 需求一律由**内层包裹**承载：宿主子内容包一层（`height: 100%` 跟随宿主高度）并在此层声明 `overflow`，把手是宿主直接子元素不受影响。收缩折叠（`minSize>0`）的推荐形态：包裹层**恒挂 `overflow: auto`**——折叠态内容超出 minSize 时自动出现滚动条、展开态内容收纳后自然收回，纯几何自适应，无需感知折叠态（收缩折叠宿主无 `data-collapsed` 钩子）；裁溢出场景用 `hidden`（滑出折叠的子内容隐藏则由指令经 `visibility` 规则处理，把手排除）；
- `collapse: 'slide'` 占位不变——内联布局中折叠后**兄弟不流入**（原占位保留）；需要腾出布局空间用默认 `'margin'`，覆盖式（fixed 面板）才配 `'slide'`；
- `maxSize` 缺省时展开依赖宿主有确定的 CSS 尺寸（无 CSS 尺寸的 auto 元素收缩后展开可能塌陷——显式声明 `maxSize` 或给 CSS 尺寸）；`auto ↔ 数值` 默认不可插值，缺省 `maxSize` 的展开/折叠动画经指令注入的 `interpolate-size: allow-keywords` 渐进增强（Chrome 129+ / Safari 18.2+ 生效，Firefox 等不支持的浏览器瞬跳、不劣化）——需要确定性动画请显式声明 `maxSize`；
- 折叠/展开动画时长 `--autospark-expandable-duration`（默认 .25s）；把手视觉经 `--autospark-expandable-trigger-*` 变量族定制（尺寸/边框/背景/图标，对齐 x-splitter 把手变量命名）；
- 宿主为 fixed/absolute 时 position 不受影响；static 宿主由指令自动补 inline `relative`（把手定位上下文）；
- 把手键盘可达：Tab 聚焦 + Enter/Space 触发，与点击同管线（`role="button"`）。
