# ADR-0067：x-splitter 分割器——两面板契约 + data-size 家族 + collapsible 折叠把手

- **状态**：Accepted
- **日期**：2026-09-29
- **关联**：[ADR-0064](0064-x-resize.md)（x-resize——指针会话/键盘微调/双向防递归的先例语义）、[ADR-0063](0063-x-drawer.md)（x-drawer trigger——把手三态坐标化与「折叠 ≡ 单值归零」派生哲学的同构来源）、[ADR-0034](0034-x-else-if.md)（分支冻结快照克隆）、[ADR-0001](0001-directive-kinds.md)（Compile kind + ownsChildren）、[ADR-0007](0007-directive-options-and-modifiers.md)（collapsible 选项与成员表达式热应用）、[CONTEXT.md](../../CONTEXT.md)（「分割器层」词条）
- **共识来源**：grilling 三轮决策（Q1–Q15 + 派生事实 20 条），本文即共识落盘；指令名经 grilling 中期由 x-split-panel 更名 x-splitter（panel/pane 一字之差混淆，splitter 与 pane 形成「机制 vs 被分割物」的清晰分工）

## 背景

引擎缺少分割布局能力：应用骨架（侧栏 + 主区、编辑器分组）需要「两面板 + 可拖拽分隔条」的声明式结构。业界形态固定（split.js / VS Code 面板），语义收敛：恰好两面板、一条分隔条、一拖一吸。本决策以结构指令落地，交互核心（指针会话、键盘微调、双向防递归）复用 ADR-0064 的先例语义，折叠交互复用 ADR-0063 把手的派生态哲学。

## 决策

### 一、结构指令：ownsChildren + 两面板契约

`static ownsChildren = true`（Compile kind、priority 0、singleton）。编译期扫描宿主模板直接子元素：

- **只认两个渲染子元素**为面板（`<template>`/`<script>` 非渲染元素静默容忍——不计数不编译）；多余渲染子元素 **warn + 丢弃**（x-tree 先例）；非空白文本节点同样 warn + 丢弃；**不足两个 warn + 降级普通编译**（内容不丢，无分隔条）。
- 面板经**冻结快照**（`cloneNode(true)`，模板只读契约）+ temp wrapper 技巧逐个 `compileSubtree` 编译——面板子树正常编译（自身指令、嵌套 splitter 照常工作），组装顺序 pane1 → divider → pane2 即文档序。
- **代价（接受）**：`engine.patch` 拒绝落入 splitter 子树（ownsChildren 动态区域防护，x-for/eager x-if 同款）——面板内动态内容用 x-if/x-show/x-html.compile 表达。

> **否决「不接管子树」**：多余子元素的「干净丢弃」与「data-size 家族伪绑定的干净接管」都要求 ownsChildren；不接管则 bind 会编译 `:data-size` 产生双通道，且保留多余子元素会破坏 flex 几何——与 spec「只允许两元素」冲突（grilling Q12 翻案重问后定 A）。

### 二、值 = direction 表达式

`x-splitter="'horizontal'"`（引号字符串字面量静态生效）或状态路径/表达式 watch。**非 `'vertical'` 一律静默归一 horizontal**（表达式空窗期 `undefined` 友好；drawer 静默归一先例——warn 会惩罚空窗期）。**horizontal = 左右分栏**（方向 = 主轴方向，与 flex-direction 语义对齐；否决 VS Code 式「分割线方向」解读）。切换 = 换轴重排：`data-direction` 属性翻转 + 定容面板 inline 尺寸同值换轴重写（清旧轴防钉死布局），面板/分隔条 DOM 不重建。

### 三、面板契约：一容一自 + data-size 家族

- **定容面板（Sized Pane）**：声明 `data-size`，**至多一个**——两个都声明 warn + 第二个按自适应处理（声明在编译期清零，与 sized 契约属性同源）。CSS 长度全形态（`"300"`/`"300px"`/`"30%"`/`"20rem"`，纯数字按 px）；**保持声明单位写回**（`30%` 拖后写回 `37.2%`——单位是布局意图；px 写 number 整数、其余两位小数 string）。百分比基准 = 宿主主轴内容区（clientWidth/Height）；rem/em/vw/vh 按根字号/面板字号/视口换算。
- **自适应面板（Auto Pane）**：无 `data-size`，恒 flex:1 吸收剩余空间；**可被拖至 0 宽，无隐式防挤压下限**（保底需求用定容面板的 `max` 表达——grilling Q14 否决 auto 面板认 min）。双自适应 = 静态等分形态：分隔条 `data-static`（纯视觉分界，不可聚焦不可拖、collapsible 不生效）。
- **`data-min-size` / `data-max-size` 仅定容面板认读**（自适应面板上声明 warn + 忽略）；单位混用允许（钳制统一换算 px 比较）；**初始声明值不钳制**（声明即真相，drawer `size`「整键生效」先例），拖拽钳制恒遵守。
- 绑定形态 `:data-size` / `:data-min-size` / `:data-max-size` 编译期**从快照剥除**（防 BindDirective 双通道）、由本指令自行 watch：**简单可写路径**获得双向；表达式形态 warn 一次 + 单向降级（x-model/x-resize 只读降级先例）。

### 四、布局实现：flex + 契约属性

宿主 `display:flex` + `data-direction` 属性分派方向；面板打 `data-autospark-splitter-pane` 契约属性（默认 `flex:1 1 0px` + `min-width/height:0`——flex 默认 `min-size:auto` 会阻止压扁，是「拖至 0」的实现前提），定容面板另打 `data-autospark-splitter-sized`（`flex:0 0 auto`——flex-basis 交还 inline 主轴尺寸）。零微任务需求（不用 computed 探针、把手定位走 CSS），`compile()` 同步组装。

### 五、拖拽与键盘：1-D 会话（ADR-0064 语义同构）

Pointer Events（`setPointerCapture` + 临时监听）+ **绝对式数学**（会话初值 + 总位移，钳制残差不累积）；键盘方向键 = 分隔条的几何位移方向（±1px / Shift ±10px），**递进式**（会话内 curPx 随应用更新）——两通道入口统一到 `_applyPx`（钳制 → 记账 → 应用 → 写回）。会话开始快照换算基准与钳制（会话内恒定，消灭每帧 reflow；起始 px 走 inline 优先、布局值兜底）。方向语义：sized 在前 → 分隔条右/下移 = 增；在后 → 反向。

**双向防递归三防线**（ADR-0064 同款）：拖拽/键盘会话期抑制外部反写（`session` 活跃即跳过）+ 等值短路（声明值全等不重应用）+ 写回统一格式化。写回经 `setVal` 逐段直写。

### 六、分隔条与事件

分隔条是**真实元素**（`role="separator"` + `tabindex=0` + `aria-orientation`）：命中区默认 10px（`--autospark-splitter-hit-size`）、居中 2px 指示线（`--autospark-splitter-divider-size`）由 `::after` 承担——命中区是本体、指示线是视觉层。事件家族 **`splitter:*`**（前缀跟指令名，家族惯例）：`splitter:resize`（会话 end，detail `{size}` 最终值）/ `splitter:collapse` / `splitter:expand`（跨 0 翻转时，任何来源；detail `{size: 0 | 恢复值}`）；宿主派发、DOM 冒泡；**初始折叠态不派发**（事件只反馈变更）。会话中跨 0 由 end 统一派发（防双发）。

### 七、折叠：collapsible 三态坐标化把手（ADR-0063 同构）

**折叠 ≡ size=0 纯派生**（无独立 collapsed 状态源——drawer「折叠 ≡ visible 归假」的决策复用，避免第二真相源）：

- `collapsible` 容器级选项，**默认 `false`**（折叠是附加能力而非分割器核心交互，区别于 drawer trigger 默认开）；三态坐标化对齐 drawer trigger 修订：`true` ≡ `'50%'` 居中语法糖 / `number` px（0 合法，与 `false` 严格区分）/ CSS 长度串——沿分隔条长轴一维定位，正距主端、负距对端；**越界静默钳制**（把手是唯一重开触发点，永可达）；非法值 warn 回退居中；成员属性表达式热应用重定位（`_onOptionExprChange`）；创建以编译期为断（动态 `false → 真值` 不补建）。
- 把手是**分隔条子元素**——天然随分隔条滑移，drawer 的实例外常驻 + window resize/scroll 监听重定位复杂度被 DOM 嵌套**天然消解**（无独立定位面）。
- 折叠前记忆 lastSize（实例状态，engine destroy 随实例回收），展开恢复；恢复链 lastSize → 声明值（**仅非 0**——`data-size="0"` 是折叠声明非可恢复尺寸）→ 200px 兜底。**折叠写 0 绕过 min 钳制**（0 是特殊语义值）。表达式绑定的单向降级形态下把手点击走 UI-only 折叠（drawer「请求关闭」已知边界同款：下次状态变更重求值拉回）。
- 折叠态 = `width:0 + overflow:hidden` + `data-collapsed` 派生属性（面板与把手各挂）——**DOM 与内容运行态保留**（区别于 drawer 折叠即销毁实例）。箭头指向「下一步动作的分隔条位移方向」（`data-side` × `data-collapsed` × `data-direction` 样式表旋转矩阵）。

### 八、动画绑定「折叠态翻转」而非尺寸变更

跨 0 边界的变更（把手/键盘/外部写 0 或恢复）播过渡（`--autospark-splitter-duration`，默认 .25s）；非跨 0 变更与拖拽全程瞬时——拖拽会话期 `data-dragging` 属性经样式表 `transition: none !important` 强制禁用（指针每帧追不上过渡）。动画实现：`data-animating` 属性 + transitionend / 600ms 兜底超时摘除。

### 九、把手定位：CSS 变量坐标 + 样式表钳制（实现期修订）

把手沿滑轨的定位 inline **只写坐标 CSS 变量**（`--as-rail`）与 `data-rail-negative` 属性，定位与钳制表达式（`max(half, min(calc(100% - half), var(--as-rail)))`）全在样式表——三重收益：① 方向切换 = `data-direction` 翻转，零 JS 重写 top/left；② 正/负坐标 = 属性翻转而非换算属性名；③ **CSS 原生钳制**实现「越界静默钳到 `[half, rail − half]`」，零 JS 测量。钳制放 JS 需要 % 布局测量（拖拽会话才有可靠布局），放样式表则响应式且免测量。

## 被否决的方案

- **指令名 x-split-panel**：panel 与 pane 一字之差混淆容器/子元素；更名 x-splitter 后「splitter（机制）/ pane（被分割物）」分工清晰（grilling Q1 中期更名，事件/类名/变量全家连锁）。
- **`collapsibled` 选项名**：非英语词，正名 `collapsible`。
- **多余子元素「原样保留」**（grilling Q4 初判）：与 spec「只允许两元素」及 flex 几何保证冲突，Q12 翻案为 warn + 丢弃（接管子树后可干净丢弃）。
- **不接管子树（Compile 宿主指令 + 子树正常编译）**：patch 自由但 `:data-size` 双通道、多余子元素只能留在布局流——见决策一否决注。
- **2 sized 双定容**（按比例分配拖拽量）：无吸收方，语义不成立；双固定场景直接写 CSS。
- **auto pane 防挤压下限**（认 `data-min-size`）：定容面板的 `max` 已可表达保底，YAGNI（Q14）。
- **collapsible 固定中点**（不做坐标化）：用户拍板对齐 drawer trigger 坐标化（Q15-B）——值模型与心智已由 ADR-0063 修订建立，边际成本仅解析函数。
- **把手 JS 视口定位**（drawer 同款）：split 的把手与参照物（分隔条）在同一 flex 树内，DOM 嵌套即定位——JS 定位是 drawer 覆盖物（body 容器）的特有复杂度，不迁移。
- **复用 ResizeSession 类**：它是 2 轴 8 向 + 定位补偿的宿主 resize 抽象，split 是 1 轴 + 单位保持写回——复用需大量参数分叉，仅复用**模式**（会话快照、绝对式数学、apply 外置、防递归三防线），1-D 独立实现更简（KISS）。
- **独立 `collapsed` 布尔状态源**：第二真相源，「0 = 已折叠」的声明语义与外部写 0 驱动折叠天然一致，纯派生即可闭合。
- **min/max 回退宿主 computed**（ADR-0064 有此回退）：面板的 CSS min-width 与 `data-min-size` 语义重叠但反馈不到写回值（状态与视觉不一致）；钳制只认 `data-*` 声明，文档明示。

## 后果

- ✅ 分割布局能力就位：嵌套（面板内声明子 splitter）零新机制即可搭经典应用骨架。
- ✅ 交互语义与 x-resize / x-drawer trigger 三线同构（会话快照、绝对式数学、防递归三防线、派生折叠、坐标化把手）——学习成本收敛。
- ✅ 把手定位纯 CSS 化：方向切换与坐标更新零 JS 测量，钳制免布局读。
- ⚠️ `engine.patch` 拒绝落入 splitter 子树（结构指令代价，文档注意事项声明）。
- ⚠️ 无布局环境（happy-dom 等）下把手定位与钳制不可测（样式表规则不应用）——测试断言坐标变量与属性翻转，浏览器内为完整行为。
- ⚠️ 折叠是 width:0 保留 DOM：面板内表单/滚动状态跨折叠保留，但 direction 切换换轴重写与引擎销毁重建不保留（文档声明）。

## 测试

`src/__tests__/x-splitter.test.ts`（36 用例）：结构契约（两面板 + 分隔条组装 / 多余 warn 丢弃 / template-script 容忍 / 不足两个降级 / 双 sized 降级唯一化 / auto 面板 min-max warn）、direction（非法值归一 / 响应式切换换轴重排 + 旧轴清理）、data-size 家族（静态值 inline / 绑定剥除 + 初值 / 绑定 min/max 进钳制 / 非法值 warn）、拖拽（前后方向语义 / min-max 钳制 / 绝对式数学残差回归 / 双 auto 静态禁拖）、双向绑定（实时写回 / 外部反向同步 + 等值短路 / % 形态保持 / 表达式降级 warn）、折叠（默认无把手 / 三态坐标与负向属性 / 点击折叠写 0 + lastSize 恢复 / 绑定形态写状态 / 初始 0 不派发事件 / 折叠绕过 min / 双 auto 不生效）、事件（resize end detail / 跨 0 翻转 collapse-expand / 拖拽跨 0 补派发防双发 / 非跨 0 不派发）、键盘（方向语义前后镜像 / Shift 步进递进 / 会话 keyup 收尾）、嵌套（子 splitter 随子树编译）。全量回归 1560 pass（2 失败为并行会话在 `src/compile/setup.ts` 的未提交改动所致，与本期无关——`git diff` 反向对照确认）。

## 修订记录

## 修订：箭头图标化 + data-collapsed 存在性修复 + minimize 折叠目标 + slide 隐藏（2026-09-29）

实施反馈驱动四项修订（两项缺陷修复 + 两项语义扩展）：

### 一、箭头改用全局图标 arrow（替换 border 三角）

把手箭头由 CSS border 三角改为内置全局图标 `arrow`（`<svg aria-hidden><use href="#as-arrow"/></svg>`，x-icon 渲染契约同构）——registry 模块加载时内置图标已注入 sprite，把手直接 use；用户同名覆盖 `arrow` 自动跟随。尺寸/颜色走 `--autospark-splitter-trigger-icon-size` 与 `color: var(--autospark-splitter-trigger-fg)`（stroke=currentColor 继承）。旋转矩阵挂 svg（纯旋转，flex 居中不受干扰）。border 三角的视觉偏心不可用 margin 补偿（margin 偏移随 rotate 一起转、四朝向各异）——教训沉淀：零尺寸盒 + 单侧 border 才是几何居中。

### 二、data-collapsed 存在性缺陷修复（「箭头方向不切换」根因）

`_positionTrigger` / `_applySize` 曾用 `setAttribute("data-collapsed", String(collapsed))` 恒设属性——`"false"` 字符串同样命中 CSS 存在性选择器 `[data-collapsed]`，箭头恒显示折叠方向。修复为 `toggleAttribute`（存在/移除），「展开态把手不得带 `data-collapsed` 属性」入测试回归锁定。

### 三、`data-minimize-size` 折叠目标（语义扩展）

定容面板新增声明（支持 `:data-minimize-size` 绑定，auto 面板声明 warn 忽略）：**折叠目标**由恒 0 扩展为「minimize 声明值或缺省 0」。**折叠态判定 = 当前尺寸等于折叠目标**（声明值全等）——初始声明等于目标即初始折叠；折叠动作写目标值（绕过 min 钳制的特权从「0」扩展为「折叠目标」）；恢复链排除等于目标的声明值（写了等于没展开）。

### 四、折叠目标 0 = slide 滑入滑出（非 width 收缩）

折叠目标为 0（显式声明 `"0"` 或未声明 minimize）时不再 `width: 0` 挤压式收缩，改为 **slide 隐藏**：面板宽度保持（内容零重排），inline 负 margin（`margin-left/right/top/bottom` 按 sized 位次与方向分派）拉回占位——flex 布局中占位归零、内容盒整体滑出容器边缘，宿主恒 `overflow: hidden` 裁剪（新契约，注意事项声明）。过渡动画作用 margin 通道（`data-animating` 的 transition 扩展 margin 分量）——视觉即「面板整体滑出、自适应面板扩展占满」。目标 > 0 保持收缩模式（width 写目标值）。初始应用（编译期、无几何可滑）恒走收缩通道。否决 transform 位移方案：transform 不参与布局，占位不归零、自适应面板不扩展——负 margin 是 flex 布局内唯一兼具「内容不挤压 + 占位归零」的通道。

### 测试更新

箭头 use 载体断言、展开态 data-collapsed 不存在断言、slide 断言（宽度保持 + 负 margin + 展开清理）、minimize 收缩断言（折叠 80 / 拖拽钳制独立 / lastSize 更新）、初始 minimize 折叠态；sized 在后的 margin-right 分派。42 用例全过。

### 五、把手滑轨定位补 `− half` 偏移（居中缺陷修复）

样式表钳制表达式 `max(half, min(rail − half, coord))` 输出的是**圆心坐标**，曾被直接当作 `top/left`（顶边位置）写入——圆心恒偏 `half`（默认居中时肉眼可见偏下/偏右 10px），且 coord 钳到 `rail − half` 时圆心探出轨道末端半截。修复：表达式外包 `calc(... − half)`——钳制圆心、顶边取差。侧向居中（`left: calc(50% − size/2)`）本就正确，缺陷仅在滑轨轴向。同源核对：drawer `_positionTrigger` 的 `railOrigin + cross − half` 一直带此偏移，坐标模型迁移时遗漏。
