# ADR-0069：x-expandable 展开折叠——显式展开态 + collapse 双通道 + 把手动态挂载 + 父容器注入

- **状态**：Accepted
- **日期**：2026-09-29
- **关联**：[ADR-0067](0067-x-splitter.md)（splitter 折叠——slide 负 margin 通道与把手样式契约的同构来源）、[ADR-0063](0063-x-drawer.md)（drawer trigger——滑轨三态坐标与覆盖形态折叠的先例）、[ADR-0018](0018-x-model-two-way-binding.md)（双向绑定与只读降级纪律）、[ADR-0064](0064-x-resize.md)（回写防递归先例）、[ADR-0007](0007-directive-options-and-modifiers.md)（指令选项体系）、[CONTEXT.md](../../CONTEXT.md)（「展开折叠层」词条）
- **共识来源**：grilling 四轮决策（Q1–Q24，含两轮代码事实调查 12 条、一项技术事实纠正后重裁决）

## 背景

引擎的折叠能力分散在两处私有实现：x-splitter 的 collapsible 把手（负 margin slide + 派生折叠态）与 x-drawer 的抽屉把手（fixed 定位 + 折叠 ≡ visible 归假）。通用元素（非 splitter 面板、非 overlay）没有声明式展开/折叠能力。本决策新增通用指令 x-expandable 统一承载，并以**两阶段策略**消灭三份拷贝：第一阶段独立交付，第二阶段重构 splitter / drawer 组合之（x-field 组合 x-model 先例）。

## 决策

### 一、静态特性与两阶段策略

`kind = Compile`（编译期 createElement 注入把手 + `scope.watch` 读值；把手不在模板树、天然不被 walk，无需 observer 通道——区别于 x-model 的 Hybrid）、`priority = 50`（bind/on 同级，无结构接管）、`singleton = true`、**无 `ownsChildren`**（宿主子树照常编译）。两阶段：第一阶段本指令自包含实现；第二阶段重构 splitter（`collapse:'margin'`）与 drawer（`collapse:'slide'`）内部程序化组合（用户模板不变），届时把手构建器 / 滑轨坐标解析 / 回写 helper 抽公共模块（抽取对象届时明确，现在抽靠猜——YAGNI）。

### 二、值 = 显式展开态（双向绑定纪律同 x-model）

值为展开态布尔（true=展开）。**简单路径**点击把手经 `setVal` + `store.update(flags)` 防循环回写；**复杂表达式** warn 一次 + 只读降级（不抛错、不本地假切换——UI 与状态背离是隐性 bug 源）；不提供 `options.set` 逃生门（YAGNI，真实需求出现再加）。初始值 false 编译期立即应用折叠态、**无动画**（splitter「初始折叠不派发事件」惯例，避免首屏闪跳）。

> 与 splitter 的哲学分工：splitter 折叠是**纯派生态**（尺寸==折叠目标，Avoid `collapsed 状态`），本指令的值**就是**状态源——CONTEXT.md 两条词条已互相限定范围。与 drawer 的分工：drawer「折叠 ≡ visible 归假」，本指令是显式展开态（第二阶段 drawer 组合后语义并入）。

### 三、direction = 收起方向（停靠边）

`'left' | 'right' | 'top' | 'bottom'`，默认 `left`。语义为**收起方向**：`left` = 宿主向左收起，把手骑活动边（对侧边线）——与 drawer `at.placement` 的弹出方向心智一致。top/bottom 走 height 通道。

### 四、minSize 分派折叠双通道，滑出终态不改尺寸

- **`minSize = 0`（默认）= 滑出折叠**，宽度/高度**保持不改**，由 `collapse` 选项分派载体（仅本场景生效）：
  - `collapse:'margin'`（**默认**）：inline 负 margin 滑出——占位归零、兄弟流入、内容不挤压。与 splitter 现行 slide 通道（ADR-0067 修订四）同构，第二阶段重构 splitter 零行为漂移。
  - `collapse:'slide'`：`translateX/Y(-100%)` 平移——占位不变，服务 fixed 覆盖形态（drawer 第二阶段的目标通道）；终态保持 transform 不归零（归零破坏 drawer 的 size 记忆）。
  - 两通道终态均**持续保持**（负 margin / translate 不摘除）。
- **`minSize > 0` = 纯尺寸收缩**：width/height 过渡至 minSize，`collapse` 不参与；子内容**不隐藏**（迷你形态内容可见，内容如何适应 minSize 由用户 CSS 决定）。
- 展开：margin 通道先把把手迁回宿主（见决策六）再滑入；`maxSize` 有值写内联尺寸、**缺省移除内联尺寸**让 CSS 决定（否决快照兜底——窗口 resize 后快照过期，YAGNI；文档注明宿主应有确定尺寸）。

> **性能事实澄清（决策依据修正）**：grilling 中「终态不改尺寸是为避免重排」的因果链**不成立**——margin 与 width 同为布局属性，动画每帧均触发 layout（ADR-0067 修订四的动画就是 `transition: width, height, margin` 三者并列）；真正零重排的只有 transform（合成层）。维持「终态不改尺寸」的真实收益：① 免两段式编排（同帧交换 + 强制 reflow + transitionend 依赖）；② 与 splitter 终态语义零漂移；③ 折叠全程内容零重排。

### 五、折叠态子内容隐藏：visibility 规则（宿主不可 overflow:hidden）

滑出折叠终态经注入 CSS 规则 `[data-collapsed] > :not(把手) { visibility: hidden }` 隐藏子内容——**宿主自身不能 `overflow:hidden`**：宽度保持的盒子会把它上面的 absolute 把手一并裁掉（这正是子内容隐藏不裁剪宿主的原因）。选 `visibility:hidden` 而非 `display:none`：不触发子树 reflow、可逆、子内容动画/组件活性保留。`minSize>0` 折叠不隐藏。

### 六、把手：样式同 splitter + 动态挂载（reparent）

- **样式契约复用 splitter 折叠把手**：20px 圆形 + 内置全局图标 `arrow`（`<svg><use>`）、`role=button` / `tabIndex=0` / Enter+Space / 指针 `stopPropagation`、`data-collapsed` 存在性属性 + 箭头旋转矩阵、`data-side` 分派；CSS 变量 `--autospark-expandable-*`（动画时长等不进 options，定制走 CSS 覆写）。
- **滑轨坐标 `pos` 三态**对齐家族惯例：`'center'` 默认 ≡ `'50%'` / number=px / CSS 长度串（负值距对端）；越界静默钳制——把手是唯一重开触点。
- **动态挂载（reparent）**：展开态挂宿主内骑活动边（splitter 把手挂分隔条同构）；滑出折叠（minSize=0）**完成后**（transitionend + 600ms 兜底）移入父容器贴停靠边内侧——宿主滑出后其内一切子元素随容器裁剪，把手外迁保常驻可达；展开动画**启动前**移回宿主（此刻宿主活动边在停靠边，位置连续）。reparent 防跳变：`getBoundingClientRect` 快照 → 移动 → 反算新坐标系坐标（drawer「先定位再插入」手法）；reparent 中断自身 transition 需 rAF 双帧。`minSize>0` 折叠**永不迁移**（宿主不滑出）。
- 动画机制复用 splitter 模式：`data-animating` 属性钩子 + transitionend / 600ms 兜底摘除；已知边界：弱布局环境（happy-dom）transitionend 不及时时把手短暂不可见。

### 七、父容器注入 / injectOverflow

滑出折叠（margin 通道）需要父容器 `overflow:hidden` 裁剪滑出部分，否则溢出可见。**默认（`injectOverflow: true`）由指令在折叠期间注入**：折叠动画开始挂、**保持至展开动画完成后**恢复原值（终态宿主滑出在外，动画瞬间注入摘除会令溢出重新可见——「临时」的作用期是折叠期间而非动画瞬间）；父容器本为 `hidden/clip` 幂等跳过；多实例共享父容器引用计数、最后一个展开完成才恢复；原值 `auto/scroll` 滚动条折叠期间暂失（已知副作用，文档注明）。`false` 显式禁用后回落编译期检测：父容器 computed overflow 非 `hidden/clip` 时 warn 一次、用户自负。

### 八、事件

宿主派发 `expandable:expand` / `expandable:collapse`（DOM 冒泡，detail `{ size }`），命名对齐 `splitter:*` / `tree:*` / `resize:*` 家族惯例。第二阶段 splitter 重构后 `splitter:*` 事件**保留桥接**（内部组合本指令，不破坏现有用户监听）。

## 被否决的方案

- **transform 单通道**（grilling Q3 初选 B）：占位不变、兄弟不流入——splitter 折叠需要兄弟扩占，单 transform 通道无法服务 splitter 重构；改为 collapse 双通道（Q8）。
- **终态 width:0 两段式**（滑出动画 → transitionend 同帧交换 width↔margin）：用户两次否决（Q12 附言、Q21 后重申「终态均不修改 width/height」）；真实权衡见决策四性能注——终态保持的实现更简且 splitter 零漂移。
- **把手 `position:fixed` + JS 跟随**（drawer 现行方案）：无父容器前置条件，但 splitter 重构行为漂移（分隔条内 → 全局 fixed）+ scroll/resize 监听成本（Q12 用户拍板 B 变体）。
- **把手恒挂父容器**：对两处重构同构度最高（splitter 把手挂容器级、drawer 把手挂 overlay 容器），但违背「把手属于宿主」的用户心智——改为**动态 reparent**（Q24）：展开态属宿主、折叠终态迁父容器、展开前迁回。
- **父容器 overflow 用户自负 + warn**（Q17 初推荐 A）：用户修订为默认注入 + 开关（`injectOverflow:false` 回落 warn 自负）——免配置的默认体验优先，侵入性由开关兜底。
- **第一步抽公共模块**（把手构建器 / 坐标解析 / 回写 helper）：第一阶段无第二消费者，接口靠猜（YAGNI）；第二阶段重构时三处变两处、抽取对象明确再抽（Q13-B）。
- **`options.set` 回写逃生门**：x-model 有 set 是表单变换的真实需求，展开态是纯布尔翻转无变换诉求（YAGNI）。
- **maxSize 展开快照兜底**：窗口 resize 后快照过期（展开回不到应有宽度）；移除内联约束让 CSS 决定更可预测（Q11）。
- **只读降级 + 本地视觉切换**：UI 与状态背离的隐性 bug 源；降级为纯只读（warn 一次，Q7-A，x-model 惯例逐字一致）。

## 后果

- ✅ 通用元素获得声明式展开/折叠，把手/折叠机制三份拷贝（expandable / splitter / drawer）有了统一归宿，第二阶段收敛为一。
- ✅ 折叠语义与 splitter slide 通道同构（负 margin / 宽度保持 / data-animating），重构零漂移；双向绑定纪律与 x-model / x-resize / splitter `:data-size` 四线一致。
- ⚠️ 把手 reparent 有已知边界：transitionend 不及时的弱布局环境把手短暂不可见；reparent 中断把手自身 transition（rAF 双帧编排）。
- ⚠️ 父容器注入是**指令改用户布局**的首例（drawer 把手挂 overlay 容器是引擎自有容器）——侵入性以「折叠期间限定 + 原值恢复 + 引用计数 + 开关禁用」四重约束收敛。
- ⚠️ margin 通道动画每帧触发 layout（与 splitter 现状同级，非性能退化）；追求零重排的覆盖形态走 `collapse:'slide'`。
- ⚠️ 「终态不改尺寸」依赖父容器持续 `overflow:hidden`（注入契约见决策七）；禁用注入且用户未自负时滑出溢出可见（warn 提示）。

## 测试

`src/__tests__/expandable.test.ts`（40 用例）覆盖：双向绑定（简单路径回写 / 表达式 warn 只读降级 / 字面量恒态 / 空值不作为）、direction 四方向负 margin/transform 分派、minSize=0 双通道（margin 负边距 + 宽度保持 / slide transform + 占位不变 / 终态保持）、minSize>0 尺寸收缩 + 子内容不隐藏 + 把手不迁移、maxSize（有值内联 / 缺省移除**本指令写过的** inline——用户模板自带不动）、把手（DOM 契约 / 键盘 / pos 三态与成员表达式热应用）、reparent（折叠动画完成迁父容器 / 初始折叠立即迁移 / 展开动画前迁回）、父容器注入（折叠期挂 / 展开完摘 / 幂等 / injectOverflow:false 回落 warn / 多实例引用计数）、事件 detail、初始态无动画、折叠态销毁释放注入。全过（2026-09-29）；全仓库回归 1643 pass（2 失败为 x-component「state() 已移除」既有失败——测试先行源码未实现，与本期无关）。浏览器端到端验证（Bun.serve + Playwright）：basic / min-size / slide 三 demo 全链通过（折叠滑出、主区流入、reparent 双向、把手骑边几何、状态驱动）。

## 修订记录

### 修订：把手骑边定位 + 图标入半圆 + 宿主定位上下文 JS 化（2026-09-29，实施期用户反馈）

三项修订（demo 端到端验证驱动）：

1. **把手圆心骑边线**（用户指定）：展开态圆心骑宿主**活动边线**（外半圆突出宿主外，父容器未裁剪时完整可见）；折叠态圆心骑**停靠边线**（外一半被父容器 overflow 裁掉，呈半圆把手——drawer 把手折叠态形态）。滑出全程圆心恒贴边线，reparent 前后位置天然连续（较初版「贴边内侧」更彻底的零跳变）。
2. **折叠态图标入半圆**：12px 图标几何上放不进 10px 半圆（半圆宽 = 直径/2 < 图标宽）——折叠态图标缩至 0.65 倍（≈8px）并沿可见方向平移 1/4 圆径（size/4，drawer 把手同款数学）移入半圆中心，保证完整可见；`translate` 前置于 `rotate`（视觉坐标平移，不随旋转改向）。
3. **宿主定位上下文 JS 化**（缺陷修复）：初版注入 CSS `.autospark-expandable{position:relative}` 会**覆盖 fixed/absolute 宿主**（选择器同 specificity、注入样式表后加载即胜）——而 fixed 覆盖形态恰是 slide 通道的目标场景（slide demo 实测复现：面板被钉回文档流）。改为：编译后微任务（元素已挂载、computed 可靠）检测宿主 computed `position === "static"` 才 inline 补 `relative`，fixed/absolute/用户显式定位不动。

附带实现修订（初版即采用，此处一并记录）：把手 reparent 的「rect 快照反算坐标」（决策六草案）简化为 **CSS 两态定位规则**——展开态相对宿主（rail=活动边长）、折叠态相对父容器（rail=停靠边长），同名 `--as-pos` 变量复用、样式表钳制，reparent 零 JS 测量（happy-dom 无布局环境可测）；初始折叠应用统一推迟到编译后微任务（x-resize 先例），`_applyExpanded` 对初始应用（`from === expanded`，created 已同步初值）补 `else if (slideHide) _dockTrigger()` 分支。
