# ADR-0064：x-resize 尺寸调节指令——自绘手柄 + 可选值双向 + overlay resize 选项

- **状态**：Accepted
- **日期**：2026-09-28
- **关联**：[ADR-0007](0007-directive-options-and-modifiers.md)（配置体系——handles/约束选项与修饰符并入）、[ADR-0001](0001-directive-kinds.md)（指令 kind——Compile 通道选型）、[ADR-0018](0018-x-model.md)（可选值双向绑定的先例语义）、[ADR-0052](0052-x-overlay-and-x-dialog.md)（覆盖物消费者家族——resize 选项挂载点）、[ADR-0062](0062-overlay-shell.md)（shell 写路径）、[ADR-0063](0063-x-drawer.md)（x-drawer 的 `size` 选项——resize 记忆值的衔接对象）、[CONTEXT.md](../../CONTEXT.md)（「尺寸调节层」词条）
- **共识来源**：grilling 三轮决策（Q1–Q16），本文即共识落盘；事件命名经领域词汇检查由连字符修正为冒号命名空间（决策七）。

## 背景

引擎缺少指针交互类的尺寸调节能力：面板、分区、可定制布局需要拖拽边缘改变宽高，x-drawer / x-dialog 等覆盖物形态同样有拖宽需求（VSCode 侧栏式交互）。浏览器原生 CSS `resize` 属性只支持右下角、方向不可选、无 JS 回调，不满足需求。本决策一次性落地通用 `x-resize` 指令与覆盖物家族的 `resize` 选项，核心钳制/手柄/指针逻辑复用、写路径分离。

## 决策

### 一、自绘手柄 + Pointer Events

编译期在宿主上注入真实手柄子元素（`data-autospark-resize-handle="<方向>"` 契约），Pointer Events 统一鼠标/触摸/笔（`setPointerCapture` 解决移出跟踪），不使用原生 CSS `resize` 属性。真实子元素（而非伪元素）是键盘无障碍的前提——手柄可聚焦（`tabindex`），方向键 ±1px / Shift+方向键 ±10px 微调，同钳制管线。

### 二、指令 kind = Compile

手柄注入与绑定建立都在编译期完成（剥属性 + `scope.watch`），不进 observer 通道。运行时动态启停（如「编辑模式」开关）不发明值语法（`enabled: expr` 之类），用 `x-if` 包宿主表达——YAGNI；后续有真需求升 Hybrid，注册表结构不变。

### 三、可选值双向绑定（对齐 x-model 哲学）

- **无值**：纯 DOM——拖拽直改 `style.width/height`，零状态成本；
- **有值**（`x-resize="size"`）：双向绑定——写回 `{ width, height }` 对象（px number），**拖拽中实时写回**（经 UpdateScheduler 微任务合并，其他绑定如 `{{ size.width }}px` 即时联动）；反向通道：外部改状态 → 宿主 style 同步（过钳制管线），**等值短路**防循环。

### 四、方向声明：handles 选项 + 修饰符糖，默认 `e,s,se`

`x-resize-options="{ handles: 'e,s,se' }"`（逗号串或数组，枚举 `n/s/e/w/ne/nw/se/sw`）为主通道；修饰符 `x-resize.e.s.se` 解析期并入（ADR-0007 既有机制，边际成本为零）。默认 `e,s,se` = **流内自然方向最大集**——文档流元素左/上边缘锚定在布局位，`w/n/nw/ne/sw` 方向拖拽须同时补偿 `left/top`，只有 `absolute/fixed` 定位元素才能完整 8 向。非定位元素声明非自然方向时**编译期丢弃 + dev warn**（不自动改 position——relative+left 补偿在重排后错位，是结构性缺陷）。

### 五、钳制管线：raw → snap → aspectRatio → min/max

调节量统一处理管线，**钳制恒最后**（保证约束是硬边界）：

1. `snap`：px 步进吸附（默认 0 关闭）；
2. `aspectRatio`：宽/高数值（如 `16/9` relaxed-json 可直接算）锁等比；
3. min/max 钳制：`minWidth/maxWidth/minHeight/maxHeight`。

约束值类型 `number`（px）| CSS 长度串（`'10rem'`，经 computed style 换算）；**来源回退链：指令选项 → 宿主 computed `min-width/max-width`**——CSS 里写的约束天然生效，不必重复声明（指令选项显式值优先）。

### 六、手柄样式：类级注入 + CSS 变量

`static initialize` 注入全局手柄样式（对齐 `registerShellStyles` 惯例，幂等），视觉尺寸约 6px、命中区扩大（约 12px）；CSS 变量 `--autospark-resize-handle-*`（size/color/厚度等）定制。

### 七、事件：`resize:start / resize:move / resize:end`（冒号命名空间）

宿主派发 DOM 冒泡事件三态，`detail = { width, height, handle }`（px number，end 为最终值），外界 `@resize:end="..."` 接。grilling 共识原为连字符 `resize-start`，落盘时经领域词汇检查修正：项目自定义事件一律 `域:动词` 冒号形态（`tree:*` / `tooltip:*` / `overlay:*` / `action:<name>`），连字符是 tree:* 词条明确列为 Avoid 的写法；且裸 `resize` 与 DOM 原生 window resize 事件撞名，命名空间形态天然规避。持续态动词取 `move`（手柄移动驱动尺寸变化）。

### 八、overlay 集成：`resize` 选项（drawer / dialog）

覆盖物消费者的官方选项（`x-drawer-options` / `x-dialog-options` 内），与 ADR-0062 官方选项惯例同轨：

- **形态**：`true`（方向自动推导 + 默认约束）| 对象（字段与 x-resize 选项表同构，复用解析）；
- **方向自动推导**（贴合形态几何）：drawer 贴边内侧单边（`placement: left` → `e`、`right` → `w`、`top` → `s`、`bottom` → `n`）；dialog 四角 `ne,nw,se,sw`（四边拖会改居中锚定语义，第一版角优先）。对象形态的 `handles` 只能在合法集内**收窄**，越界 warn + 忽略；
- **写路径分离**：overlay 的 resize 落在 **shell 定位体系**（面板宽高，非普通元素的 `style` 直改），钳制/手柄/指针核心逻辑复用；
- **不写回 store**：overlay 选项语法无绑定表达式位，事件 `detail` 即数据出口（KISS，不发明绑定语法）；
- **会话内尺寸记忆**：拖出尺寸存指令实例状态，重开沿用、**优先于声明 `size`（ADR-0063 决策五）/ CSS 尺寸**（打开时 inline 写记忆值而非声明值），engine destroy 才清。drawer/dialog 统一此行为，不分形态（分语义会让用户多记一条规则）。

## 被否决的方案

- **原生 CSS `resize` 属性 / 双模式**：只支持右下角、方向不可选、无回调——与「指定方向」需求直接冲突；双模式多一条维护路径（YAGNI）。
- **自动 `position: relative` + left/top 补偿**：补偿态在窗口重排后错位（结构性缺陷），隐式改用户布局属性违反最小惊讶。
- **`{w: path, h: path}` 双路径绑定语法**：表达力强但发明新语法；`{width, height}` 对象贴合「尺寸是一对儿」的域直觉。
- **松手时写回**：联动体验断档；实时写回成本已被调度器架构吸收。
- **overlay 状态写回**（drawer 宽度进 store）：选项语法无绑定位，硬造违反 KISS。
- **dialog 四边拖拽**：改居中锚定语义，角已覆盖 90% 场景。
- **双击重置**：重置目标语义模糊（哪个尺寸？），需额外存初始态；需要时经 `resize:end` 自行处理。
- **RTL 适配（v1）**：等真实需求出现再做（YAGNI）。
- **Hybrid 动态启停**：无明确用例；x-if 组合已覆盖。
- **每形态不同记忆语义**（drawer 记住 / dialog 重置）：语义分裂增加认知成本。
- **事件连字符命名 / 裸 `resize`**：违背家族冒号命名空间惯例 / 与原生事件撞名。

## 后果

- ✅ 引擎获得首个指针交互指令，手柄/钳制/指针核心逻辑与 overlay 写路径解耦，未来 x-popup 等形态可零成本接入 resize。
- ✅ CSS min/max-width 约束天然生效（回退链），零配置成本。
- ✅ 覆盖物拖宽（VSCode 侧栏心智）第一版即达。
- ⚠️ 手柄是宿主**真实子元素**：宿主同时是结构指令（x-for 等 ownsChildren 类）时注入位置需避让（实现须以 `data-autospark-resize-handle` 标记识别，不参与子树重编译）。
- ⚠️ drawer 声明 `size` 与 resize 记忆值并存时，记忆值优先生效——用户改了 `size` 配置但面板「不响应」的可能困惑点，文档须显式说明（重置路径：engine 重建）。
- ⚠️ computed min/max 回退依赖宿主已挂载（getComputedStyle）——编译期降级检测（流内方向丢弃）同样依赖，挂载前检测不到的极端场景按声明值放行。

## 测试

`src/__tests__/x-resize.test.ts`（33 用例，全量回归 1480 pass）：钳制管线纯函数（min/max 硬边界、snap 吸附、aspectRatio 主轴分派、snap→aspect→clamp 顺序）、方向归一（默认集 / 串 / 数组 / 修饰符糖 / 非法剪枝）、约束解析（number 与 px 直取、computed 回退、选项优先阻断回退、非法 warn）、手柄注入契约（data 属性 / tabindex / role / 定位锚补齐）、流内降级（非定位丢非自然方向 + warn、absolute 全向）、拖拽纯 DOM（e/se/s 手柄 Δ 数学、定位元素 w 补偿、minWidth 钳制、snap+aspect 链路）、三事件序列与 detail 载荷、可选值双向（pending 初值、实时写回、反向通道过钳制、表达式只读降级）、键盘微调（±1 / Shift ±10 / 键盘会话事件）；overlay 侧：drawer 单边推导（left→e）、拖拽写面板短轴、会话记忆优先于声明 size（关开沿用）、handles 收窄越界 warn、事件宿主派发，dialog 四角与拖拽双轴、收窄子集。

## 实施期修订（与共识的偏差记录）

- **手柄定位锚补齐**：宿主无 inline `position` 时引擎补 `position: relative`（决策四「不自动改 position」指不为反向拖拽做补偿——relative 无 left/top 零视觉影响，仅为手柄 containing block，浏览器侧必需）。
- **等比联动写入判定**：`e`/`s` 单边手柄在 `aspectRatio` 生效时联动写从轴（值偏离会话初值才写——`height:auto` 元素不被同值写入钉死）。
- **补偿基准 = 会话初值快照**（`w0/h0`，不随会话内递进更新）——递进值只作下一轮起点，防止补偿量被逐次应用污染。
- **aspectRatio 增补比值串形态**（`'16:9'` / `'4/3'`，指令侧解析）：决策五原文「`16/9` relaxed-json 可直接算」是**未经验证的错误声称**——自研 relaxed-json 是裸值透传 `JSON.parse`，不支持除法表达式；比值串保留直觉表达力。
- **跳动修复三轮**（用户实测反馈驱动）：
  1. **拖拽数学改绝对式**（初值 + 总位移）——递进式把 snap/等比归格残差带进后续轮次，格点间会一次跳变（`w0=200, snap=50` 反例：总位移 85 时递进式 350 vs 绝对式 300）；
  2. **尺寸读取 inline px 精确优先**（offset 系布局取整值兜底）——offsetWidth 取整使双向 watcher 误判「值变了」二次写 style；且 content-box 元素 offset 含 padding/border 语义错位；且每帧读 offset 强制 reflow；
  3. **补偿基准坐标系修正**——曾误用 `getBoundingClientRect`（视口坐标系）作 `style.left` 补偿基准，offsetParent 有偏移时 w/n 拖拽整体瞬移（「保持右/底不动」失效）；改为 inline px → computed used value（均为定位坐标系）。
- **反向通道订阅分流**（ADR-0043 语义边界适配）：有局部上下文（x-data 域祖先）时简单路径被分流到表达式支路（无 depth 概念，依赖止于对象引用——内部键变化不触发，反向通道失效）；补**两条子键路径订阅**（`box.width` / `box.height` 深读依赖），回调经落点解析重取完整对象。无局部上下文时维持精准订阅 + `depth:2`。
- **约束会话快照**：`constraints()` 每次手势开始取一次（move 中不重复 `getComputedStyle`——每帧强制同步布局是拖拽抖动源）；外部应用（applyExternal）仍现读。
