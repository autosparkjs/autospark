# ADR-0072：x-expandable 内建单边 resize + 同元素 x-resize 互斥

- **状态**：Accepted
- **日期**：2026-09-30
- **关联**：[ADR-0069](0069-x-expandable.md)（宿主指令本体、被部分取代的通用自动桥接）、[ADR-0064](0064-x-resize.md)（复用的 ResizeSession 核心）、[ADR-0070](0070-x-expandable-compose.md)（边线交互协调的前序）、[CONTEXT.md](../../CONTEXT.md)（「展开折叠」词条）
- **共识来源**：grilling 决策 Q1–Q6 全 A（互斥失败形态 / 修饰符命名 / 退化矩阵 / 尺寸真相 / 既有消费方处置 / 桥接处置）+ 两轮代码事实调查（同元素互查机制 / ResizeSession 复用面）

## 背景

ADR-0070 修订为「drawer 把手 vs resize 手柄」的命中抢夺做了让位语义，但 x-resize × x-expandable 的共存仍是**三层命中协调**（手柄 / 把手 / 边条：手柄 z10 > 把手 z5 > 边条 z4，drawer 语境另有 overlay 层叠封顶），复杂度持续累积。根治路径：**单指令独占边线交互**——x-expandable 内建**单边** resize（方向由折叠方向决定，与折叠语义天然绑定），并强制与 x-resize 同元素互斥。

## 决策

### 一、内建单边 resize

`x-expandable-options.resize = true | 对象`（默认关闭；修饰符 `.resize` 同效——**修饰符与值同属一个属性** `x-expandable.resize="ui.open"`，分离书写是同名第二声明、会被 singleton 去重覆盖）。方向 = 活动边法线自动推导（`left`→`e` / `right`→`w` / `top`→`s` / `bottom`→`n`），`handles`/`aspectRatio` 子键不适用 warn 忽略；其余字段（`minWidth/maxWidth/minHeight/maxHeight/snap`）透传 `resolveResizeConstraints`。实现 = 实例化 x-resize 的 `ResizeSession`（target/eventTarget = 宿主；overlay 家族同款复用面，指针/键盘/钳制零新逻辑）。

### 二、resize 接管展开尺寸真相（Q4=A）

resize 写路径：直写宿主主轴 inline 尺寸 + **接管 `_maxDecl` = 拖出值**——折叠 / 展开 / `detail.size` 全走既有 maxSize 管线（收缩折叠再展开恢复拖出宽度；滑出折叠宽度不参与、负 margin 滑出量按拖出后宽度计算）。零新增状态。

### 三、enable 退化矩阵（Q3）

`enable`（默认 `true`）= 折叠功能开关：`false` 时不建把手、值绑定不订阅；`{enable: false, resize: true}` 退化为**纯单边 resize**；双关 → warn + 指令完全不作为。

### 四、同元素互斥（Q1=A）

x-resize created 检测 `binding.directives` 存在同元素 expandable → warn + 自失效（不实例化手柄）。失效判定单点在 x-resize 侧（其能力为 expandable.resize 的超集，迁移路径最短）；先例 = component 的兄弟实例检测（ADR-0056 决策十修订）。

### 五、通用自动桥接移除（Q6=A）

ADR-0069「`data-edge-hover` 桥接契约」中的**通用自动探测**（宿主事件委托）随互斥移除——同元素组合非法后无手柄可桥接；跨元素桥接保留（splitter 分隔条 / drawer 面板手柄）。

### 六、既有消费方不迁移（Q5=A）

drawer 的 `resize` 选项（overlay 侧 `_attachResize` + 把手让位语义）保留——已工作且属 overlay 家族机制；文档注明能力同构（YAGNI）。

### 七、把手与手柄同边的层级协调（2026-10-04 补充）

决策一让两层交互元素落在**同宿主同一条边线**上，原「单指令独占边线交互」的意图只解决了跨指令抢夺，未解决本指令内部的层序：resize 手柄带 `z-index:10` 全长覆盖活动边线，把手 `z-index:5` 被压在其下——调节线（2px）横穿把手圆面、把手圆面区的命中被手柄拦走，而 hover 模式下把手又不可见（症状：启用 resize 后折叠不可点）。补充裁决：

- **把手压手柄之上**：宿主挂 `data-resize`（`_resizeOn` 时置位），样式表 `.autospark-expandable[data-resize]>.autospark-expandable-trigger{z-index:11}` 把把手抬至手柄之上，视觉与命中都不被调节线拦；代价是把手圆面内起手拖不到手柄，**调节线在把手 20px 之外照常拖拽**（方向与 drawer 的「让位转发」相反——drawer 的把手在覆盖物容器、层级被 stacking context 封顶抬不动，只能在把手内把 pointerdown 转发给手柄；本场景同宿主可自由抬层，不必让位）；
- **感应载体让位手柄**：感应边条（`z-index:4`）被手柄带完全盖住收不到 hover，hover 模式「移到边线即显形把手」改由**手柄桥接**承担——手柄 hover/聚焦置位把手 `data-edge-hover`（ADR-0070 既有的统一桥接契约，splitter 分隔条 / drawer 面板手柄同款；此前「同元素无手柄可桥接」的前提随本决策失效，故由本指令在装配期自行接线）。

## 被否决的方案

- **x-expandable 失效 / 双禁**（Q1 B/C）：能力丢失或迁移路径最差的组合；
- **`.resizeable` 独立修饰符键**（Q2 B）：与 `resize` 选项双键心智 + 非标准拼写；
- **继续深化层级共存/让位**：三层协调的复杂度正是本决策要消灭的对象（drawer 让位语义保留——那是 overlay 侧跨元素组合的合理机制）。

## 后果

- **breaking**：同元素 x-resize + x-expandable 从「可共存（带缺陷）」变「x-resize 自失效 warn」；
- ADR-0069 的通用自动桥接被取代移除；splitter/drawer 桥接保留；
- 测试：expandable 新增 5 用例（互斥 / 修饰符 / 尺寸接管 / 退化矩阵 / 约束钳制），桥接用例删除。

## 修订记录

- 2026-09-30 初版。
- 2026-10-04 补充决策七（把手与手柄同边的层级协调：把手压手柄之上 + 手柄 hover 桥接显形把手），新增用例 3（层级标记与样式契约 / 手柄桥接 / 退化形态无把手）。
