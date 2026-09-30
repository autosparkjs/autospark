# ADR-0063：x-drawer 贴边抽屉形态——屏幕贴边默认 + 元素贴边锚定

- **状态**：Accepted
- **日期**：2026-09-28
- **关联**：[ADR-0052](0052-x-overlay-and-x-dialog.md)（覆盖物组件化统一——x-drawer 即 fast-follow 清单第 1 项的兑现）、[ADR-0062](0062-overlay-shell.md)（shell 机制——`drawer-shell` 内置面板外壳）、[ADR-0060](0060-x-popover.md)（悬浮形态同构先例）、[ADR-0039](0039-animate-mechanism.md)（'drawer' 内置动画复用六类名契约）、[ADR-0007](0007-directive-options-and-modifiers.md)（配置体系）、[CONTEXT.md](../../CONTEXT.md)（「覆盖物消费者」词条）
- **共识来源**：grilling 四轮决策（Q1–Q14）+ 实施中断评审（overlay shell 机制并行落地的架构适配），本文即共识落盘

## 背景

抽屉（drawer）是弹层家族的最后一块常用形态：从屏幕四边或某元素边缘滑入滑出的面板（侧边栏、过滤器面板、设置面板）。ADR-0052 决策 3 已预留「x-drawer 为 OverlayDirective 同构薄子类」；实施期间 ADR-0062（overlay shell）并行落地，面板层形态已组件化——x-drawer 顺势以 **`drawer-shell` 内置外壳 + 形态薄子类** 落地，定位扩展收敛为单一钩子。

## 决策

### 一、双定位模式：屏幕贴边（默认）+ 元素贴边锚定

- **屏幕贴边**（无 `at`）：面板 `position: fixed` 贴视口对应边，贴边轴由 inset 对拉全屏展开，短轴尺寸走 CSS 变量（见决策五）。
- **元素贴边锚定**（`at.selector` 命中）：面板贴**锚元素对应边外侧**滑出；**长轴 = 锚边长**（JS 同步 + autoUpdate 随锚 resize 重同步），短轴仍走 CSS 变量、不钳制到锚内（锚比抽屉窄时允许溢出）。
- **实例定位策略钩子**：`OverlayInstanceOptions.positioner`——提供时**整体接管**内置「锚定/退居中」两态（含箭头载体显隐与未命中告警措辞）。`DrawerDirective` 经基座新钩子 `_positioner()` 注入；popover/dialog 不提供（零变化）。

### 二、placement 语义（复用 `at.placement`，四主方向）

- **默认 `right`**（业界惯例；「不配置即 right」心智最简单）；
- **屏幕模式只认 `top|bottom|left|right`**：`'auto'`、`-start/-end` 后缀、非法值一律**静默归一**为默认方向——autoPlacement 屏幕模式无锚无从谈起；warn 会惩罚从 dialog/popover 抄配置的用户；
- **锚定模式 `'auto'` 维持 floating-ui autoPlacement 语义**（方向由定位管线决定后再同步长轴）；`-start/-end` 静默剥离主方向（长轴已铺满锚边，对齐后缀无意义）。

### 三、模态默认，`mask: false` 可关

读 ADR-0062 官方 `mask` 选项（遮罩是引擎结构，显隐归选项）：缺省模态（遮罩 + `closeOnMask` + ESC）；`x-drawer-options="{mask: false}"` 裸面板贴边。无遮罩时关闭触点仅 **ESC / close action / 状态归假**——outside-click 关闭是家族 fast-follow（dismissable layer），不做；`closeOnMask` 无遮罩时静默无效。与 x-dialog 的分工：**dialog 恒模态**（ADR-0062），drawer 是家族首个 mask 可配的声明式消费者——「模态」与「visible 驱动」正交的实证。

### 四、锚定管线默认值修正与回退偏离

- **`flip` 默认关**（显式 `at.flip` 恒尊重）：抽屉方向是用户明确指定，空间不足自动翻到对侧反直觉——与拒绝 `'auto'` 同一心智。经 `utils/floating.ts` 通用管线的 `FloatingContract.flipDefault` 落地（缺省 true，tooltip/dialog/popover 零变化）；
- **无箭头**：drawer-shell 模板不渲染 `.autospark-overlay-arrow` 载体（ADR-0062「渲染归 shell」的形态分化权），`at.arrow: true` 静默无效（引擎查不到载体，floating-ui 无箭头中间件）；
- **锚定未命中回退屏幕贴边**（warn 措辞含「退屏幕贴边」）——**有意偏离**家族先例「未命中退居中」（ADR-0052 决策 22）：居中对抽屉形态无意义。

### 五、尺寸与视觉

- **短轴**：`size` 选项（实施期修订，推翻 Q4-b 的「纯 CSS 变量」共识）——`number`（px）或 CSS 长度字符串（`'40%'` / `'20rem'`），**方向中立**（左右抽屉的宽与上下抽屉的高共用），默认 320px。引擎打开时**恒 inline 写短轴**：配置值整键生效（inline 优先级天然高于样式表，不依赖样式表注入时机，DevTools 直接可见）；未配置写 `var(--autospark-drawer-size, 320px)`——CSS 变量保留为全站默认通道（`drawer-shell` 样式表的 placement 分派规则作为自定义 shell 场景的兜底）；
- **长轴**：屏幕模式 inset 对拉拉伸；锚定模式 inline = 锚边长；
- **视觉默认**：`drawer-shell` 模板根双类名 `autospark-dialog autospark-drawer`——继承 `.autospark-dialog` 外壳联动（border/背景/阴影/裸面板 z-index），`.autospark-drawer` 覆写直角（`border-radius: 0`）、`box-sizing: border-box`、`overflow: auto`。

### 六、'drawer' 内置动画（默认 animate）

类挂实例根、placement 属性挂面板（引擎**首帧同步预写**——屏幕模式定位时 / 锚定模式方向归一时，最终值由定位管线写回），复合选择器覆盖两种结构：**模态遮罩淡入淡出 + 面板按方向滑动**（`translate ±100%`）；裸面板仅滑动分量。CSS 放 `drawer-shell` 样式段（ADR-0062「样式随组件文件走」），animate 机制只传名（ADR-0039 六类名契约零改动）。默认注入规则：仅当用户未在任一层（静态整包 / 成员表达式）显式配置 `animate` 时注入——`OVERLAY_DEFAULTS.animate='fade'` 恒被合入，不能以合并产物判「未配置」。

### 七、VisibleOverlayDirective 提取（visible 驱动与模态正交）

自 DialogDirective 提取 visible 驱动全套（四形态 / `_toggle` / 落点写回 / 请求关闭写回 / 消费者销毁善后）为中间抽象基座 `VisibleOverlayDirective extends OverlayDirective`；`DialogDirective` 与 `DrawerDirective` **平级**继承（ADR-0052 决策 3 谱系即文档）。顺带修复两处既有问题（dialog 行为零变化——有测试护航）：

1. **warn 前缀参数化**：基座 `directiveLabel` 字段（默认 `'x-dialog'`），popover/drawer 覆写为自身指令名——继承基座的 warn（未找到组件 / props / shell）不再打错前缀；
2. **空值 warn 分支修复**：原实现中空值守卫位于字面量分流之内——空表达式非合法字面量（`_resolveLiteral` 返回 null）永远落不到守卫，而是落反应式分支 `watch("")` 直接 SyntaxError（违背 ADR-0052 决策 6「空值 warn 恒不开」的规格）。守卫移到分流之前，warn 恒可达。

### 八、嵌套零新机制

drawer 内再开 drawer：每次打开新实例（ADR-0052 决策 9）DOM 追加序天然层叠、ESC 打开栈只关栈顶（决策 20）、递归深度防护共享（同名自嵌套被防）。子 drawer 声明在父组件模板内、visible 状态放组件 data 域；「贴父抽屉边」画面经 `at.selector` 指向父面板内元素表达。文档写嵌套章节，不做隐式锚定（同一个指令在不同宿主上下文里定位语义不得漂移）。

## 被否决的方案

- **浮动锚定面板**（锚定复用 popover 定位、尺寸交给内容）：放弃「元素贴边抽屉」的核心承诺——长轴沿锚边展开才是「局部抽屉」心智。
- **`'auto'` 真语义**（屏幕模式按视口选边）与 **warn 回退**：引入隐式选边行为 / 惩罚抄配置用户，均不如「不配即 right」可预测。
- **`size` 配置键**：与「视觉由 CSS 承担」分工相悖；CSS 变量可全局/局部覆盖，零配置面增量。
- **箭头载体渲染 + 默认移除**（保留 `arrow: true` 能力）：「抽屉 + 箭头」无真实场景；shell 拥有渲染权正为形态分化，保留无人用的能力违背 YAGNI。
- **`modal: false` 键名**：与家族内部词汇（`MASK_CLASS` / `mask` 选项 / CONTEXT.md「遮罩」）一物二名——ADR-0052 有同款否决先例。
- **extends DialogDirective**：与平级谱系相悖，且 warn 前缀、样式注入都要规避；提取 `VisibleOverlayDirective` 后平级零重复。
- **未命中退居中**（家族先例）：抽屉居中是荒诞画面。
- **instance 面板类名注入**（shell 机制前的原方案）：被 `drawer-shell` 组件化取代——模板即类名，引擎零改动。
- **隐式嵌套锚定**（子 drawer 默认贴父面板）：定位语义随宿主上下文漂移，违背「at 只显式配置」。

## 后果

- ✅ 弹层三形态齐备（模态居中 / 悬浮贴附 / 贴边抽屉），drawer 边际成本 = 形态默认 + 一个定位钩子。
- ✅ `VisibleOverlayDirective` 使「visible 驱动」成为可复用抽象（未来 x-popup 等直接落在其上）。
- ✅ 空值 SyntaxError 修复 + warn 前缀正确化，家族诊断信息一致。
- ⚠️ `FloatingContract` 增 `flipDefault`/`onPositioned` 两钩子——通用管线为形态特化开的第一组口子，后续形态扩展优先走 contract 而非复制管线。
- ⚠️ 锚定长轴同步依赖 autoUpdate（无 ResizeObserver 环境退化为单次计算，锚 resize 后长轴不跟随——与定位行为同 degrade）。
- ⚠️ `--autospark-drawer-size` 只约束内置 drawer-shell；自定义 shell 不带 `.autospark-drawer` 类即无默认尺寸（完全自由，文档明示）。

## 测试

`src/__tests__/x-drawer.test.ts`：屏幕贴边四方向 inline 与 placement 写回、归一（-start / auto / 非法值静默）、模态默认与 `mask: false`、锚定命中（fixed + 主方向归一预写 + 长轴 = 锚边长 / 短轴交还 CSS 变量）、锚定未命中退贴边（非退居中）、锚定无箭头载体、visible 四形态继承（ESC 回写 / 字面量 / 空值 warn / 表达式）、`'drawer'` 默认动画与显式 animate 整键尊重、嵌套（父子层叠 + ESC 只关栈顶）、自定义 shell 替换与引擎级默认 shell。全量回归 1443 pass（含 x-overlay / x-popover / shell 原有断言原样通过）。

## 修订：锚定内侧展开 + 动画时序缺陷修复（2026-09-28）

实施反馈驱动两项修订（定位语义 + 动画实现），另附 animate 机制的三处时序缺陷修复。

### 一、锚定模式：外侧贴缘 → 锚内侧覆盖展开

**原决策**：锚定命中走 floating-ui（`applyAnchorPosition`），面板贴锚对应边**外侧**，长轴经 `onPositioned` 同步。

**问题**：外侧贴缘在锚旁空间不足时面板伸到容器（锚所在布局区/视口）外；位移型动画（translate ±100%）起点更远，越界更明显。

**修订**：面板终态贴锚**内侧**对应边（`right` = 右缘对齐锚右缘、面板在锚内），面板恒在锚内不越界；入场为主流位移滑入（从对应边滑入，见修订二）。实现上锚定不再经 floating-ui（`flip`/`offset`/`shift`/`arrow` 子键静默忽略、`auto` 归一 `right`——内侧展开无「选位」概念），`_applyAnchorEdge` 手写 inline 定位：贴边侧 inset 固定（终态几何），动画由 transform 位移承担（不参与布局）；重同步由 ResizeObserver（锚）+ resize/scroll（视口）承担，autoUpdate 依赖移除。

### 二、'drawer' 动画：位移滑入保留，enter-to/leave-from 补显式 identity

`DRAWER_SLIDE_TRANSFORMS`（translate ±100%，主流 drawer 形态语言：面板整体平移、内容不变形、纯合成零 reflow）**保留**；「越界」问题由修订一的**内侧终态定位**解决（终态恒在锚内，位移只是入场轨迹——与屏幕模式从屏幕外滑入的惯例一致）。动画侧两个此前隐没的缺陷修复：

- **enter-to / leave-from 补显式 `transform: translateX(0)`**：摘 from 类后 transform 回退 `none`，而 `变换值 ↔ none` 不可插值（瞬间跳变）——显式 identity 才有可插值终点；
- 曾评估的替代方案均否决：width/height 尺寸展开（`0 ↔ size`）每帧触发 reflow 且内容随宽度逐帧重排（换行/挤压抖动）；`scaleX` 纯合成但压扁内容；`clip-path: inset()` 揭开零重排但与主流 drawer 滑入观感不同。

### 三、animate 类名型 enter 的三处时序缺陷（同批修复）

1. **插入帧无 before-change style**：新插入元素（overlay 挂载即进场）同任务内「挂 from → reflow → 摘 from」不启动 transition。修复：from→to 切换经 rAF + 宏任务（Chromium 会把 rAF 回调内注册的 rAF 追加进同帧队列，双 rAF 也不隔帧；宏任务必在当前帧渲染后执行）。
2. **挂类本身的 unwanted 过渡**：append 后挂 from+active，「无类态 → from 态」的变化被 active 的 transition 立即捕获（先播反向 unwanted 过渡，目标过渡起点被污染、位移归零）。修复：from 帧 inline `transition: none`（实例根侧）+ drawer-shell 复合选择器 `transition:none!important`（面板侧，transition 不继承、inline 跨不了元素），切换帧还原。
3. **时长探测被骗**：`_registerEnd` 在挂帧执行，读到 inline `transition:none` → 时长 0 → 0ms 兜底瞬间收尾。修复：enter 的结束检测注册移到切换帧（inline 已还原）。

 AnimRecord 增 `frame` 句柄（raf/timeout 双态，finish/cancel 撤销防 to 类泄漏），`classes` 收编 from（抢占取消时不残留）。

### 测试更新

`x-drawer.test.ts`：默认动画用例拆分（起始帧 from+active / 双 rAF 切换时序，配长 duration 稳定在播）；`tooltip.test.ts`：enter 后收敛须先等切换帧注册结束检测。全量 1447 pass。

## 修订：折叠把手（toggle）——折叠 ≡ visible 归假 + 实例外常驻交互元素（2026-09-28）

### 决策

`toggle` 选项（**默认 `true`**，`false` 显式关闭）为抽屉启用常驻折叠/展开把手：

- **折叠 ≡ visible 归假，无第三态**：点把手即写回状态（展开态点 = 归假滑出销毁；折叠态点 = 归真重开）。否决「独立停靠态（docked）」：docked × open 四象限引入第二真相源，与「visible 是唯一真相源」（ADR-0052 决策 6）冲突，且与「每次打开新实例」的实例生命周期相悖。**代价（已接受）**：折叠再展开后面板内容运行态重置（表单输入、滚动位置不保留）——这是 overlay 家族既有语义，不为本特性破坏。
- **把手是覆盖物家族首个实例外常驻交互元素**：面板 visible 归假即整树销毁，把手须存活——生命周期挂**指令实例**而非 overlay 实例（每消费者一个、多实例独立层叠），宿主脱离 / scope 死亡 / engine 销毁时摘除（复用 `onScopeDestroyed`）。先例：tooltip 单例浮层（懒建常驻复用），但那是引擎级单例，把手是指令级多例。
- **几何：圆心恒骑面板活动边线**（半内半外），展开↔折叠 = 把手沿边线**同步滑移**（与面板同曲线 .3s）；折叠后屏幕模式骑屏幕边、锚定模式骑锚内侧边线，朝外一半被裁（天然「只露一半」，零特判）。
- **视觉**：直径 `24px`、`1px solid`（继承面板边框/背景配色），CSS 变量 `--autospark-drawer-toggle-size` 等开放定制；箭头 CSS 绘制、指向「下一步动作」随 `data-collapsed` 翻转。DOM 契约 `div.autospark-drawer-toggle[data-overlay-placement][data-collapsed]`（placement 同面板契约，箭头基准角按它分派）。
- **与 `mask` 正交**：不隐式改写用户显式配置的模态行为；点遮罩 / ESC 关闭后把手照常存活。

### 被否决的方案

- **独立停靠态（docked/peek）**：第二真相源 + 实例保活偏离「关闭即销毁」，成本高；内容保活需求由未来组件级 `keepalive` 通道解决更合适。
- **把手随面板销毁、折叠后重新注入**：折叠后无「边线」参照物，且反复注入/摘除抖动；常驻一把手 + 边线跟随最简。
- **默认 `false`**：抽屉的「可折叠」是高频诉求（侧栏场景默认预期），默认开启减少一层配置；不要者显式关。
- **把手内容可替换（slot/图标配置）**：YAGNI，CSS 变量已覆盖尺寸/配色定制。

## 修订：把手坐标化 + 更名 trigger——边缘锚定模型 + 折叠裁切方向统一（2026-09-29）

### 决策

把手选项 `toggle` 更名 **`trigger`**，取值从 `boolean` 扩展为 **`number | string | boolean`**——沿边线**滑轨**一维开放坐标定位（垂直边线方向的展开↔折叠滑移几何不变）：

- **边缘锚定模型**：坐标正距**主边**（top/left）、负距**对面边**（bottom/right）的绝对距离——`trigger: '-20%'` = 距底/右 20%、`100` = 距顶/左 100px。坐标作用维由 placement 决定：左右抽屉 = 把手 `top`、上下抽屉 = 把手 `left`。百分比基准 = 滑轨长度（屏幕模式视口长轴 / 锚定模式锚边长）。
- **`true`（默认）= 居中 = 语法糖 ≡ `'50%'`**；`false` 不建把手；`0` 是合法坐标（距主边 0），`=== false` 严格区分。`number` = px；`string` = CSS 长度（`'20%'`/`'100px'`/`'2rem'`，纯数字按 px）。非法值 warn 回退居中。
- **越界静默钳制到 `[half, 滑轨长 - half]`**：把手是唯一的重开触发点（折叠 ≡ 面板销毁），越出滑轨 = 抽屉功能性死锁——钳制而非放任、不 warn（自然语义非配置错误）。
- **成员属性表达式热应用**：覆盖 `_onOptionExprChange`，`trigger` 变化即重定位——把手常驻（面板销毁后存活），不热应用则折叠态长期停留过期坐标。把手是否创建仍以 created 期为断（表达式动态从 `false` → 真值不补建）。
- **直接移除 `toggle`，不设别名**：引擎未发版无外部消费者包袱；新旧取值类型不同（boolean vs 联合类型），双轨解析徒增分支；文档/demo/测试仓库内一次改净。CSS 类 `.autospark-drawer-toggle` → `.autospark-drawer-trigger`、CSS 变量 `--autospark-drawer-toggle-size` → `-trigger-size`、`requestClose("toggle")` → `"trigger"` 同批更名。
- **术语消歧**：`trigger` 与 popover/tooltip「宿主触发器」、action `triggerEl` 同名异物（引擎生成按钮 vs 用户模板元素 vs 事件派发点），CONTEXT.md 把手词条显式消歧；文档行文指涉按钮优先用「把手」。

### 同批修复：折叠裁切方向（top/bottom 与 right/left 反构）

折叠态半圆裁切原实现「保留朝容器中心的半边」只在 right/left 落实正确，**top/bottom 的 clip 写成了背离半边**：屏幕模式露出的半圆在**视口外**（top/bottom 抽屉折叠后把手整体不可见），锚定模式露锚外半圆、三角偏移落入被裁半边（半圆内无三角）。修复为四方向同构：**露面板展开侧半圆**（top 露下半 / bottom 露上半 / right 露左半 / left 露右半）——与屏幕模式「朝外半圆本在屏外」的显式统一自洽，且既有三角偏移恰好落入修复后的可见区（三角 CSS 零改动）。

### 同批修复：把手阴影按状态分派

展开态去 `box-shadow`（把手骑面板边线、视觉属于面板），折叠态保留（独立浮起提示可点）——`[data-collapsed]` 独立规则承载。

### 被否决的方案

- **中心偏移坐标模型**（0 = 居中，正/负向两侧偏移）：与用户案例 `'-20%'` = 距底 20% 不符；且居中值 `0` 是 falsy，与 `trigger: false` 的关闭判断纠缠（`=== false` 虽可区分，心智负担长存）。边缘锚定下居中 = `'50%'` 与既有默认无缝衔接。
- **`toggle` deprecated 别名**：见上，未发版 + 类型不同构。
- **折叠露背离半圆**（锚定模式「把手浮在锚外」观感）：屏幕模式下露出的半圆在视口外，须为两模式写不同方向分支——不同构、CSS/三角/文档全复杂化；统一露展开侧改动最小（clip 两行对调）且三角零改动。
- **把手创建随表达式动态补建**：把手存亡挂 created 期一次断定，动态补建引入「把手出现时机」第二套时序，YAGNI。

## 修订：把手机制组合 x-expandable 共享模块——`trigger` 选项删除（2026-09-30，ADR-0070）

把手实现整体移交 x-expandable 共享把手模块（本文件前两条把手修订的**实现**被取代，**坐标模型语义**——边缘锚定/负值距对端/越界钳制/表达式热应用/created 期创建断言——成为共享模块的契约来源）：`trigger` 选项删除，取值域移交 `x-drawer-options.expandable`（`false` 不建把手 / `true` 默认居中 / 对象 `{ pos }` 传坐标，原三态取值映射至 `pos`）。类名 `.autospark-drawer-trigger` 与变量 `--autospark-drawer-trigger-size` 删除，统一 expandable 契约（默认直径 24px → 20px，breaking）；折叠露展开侧半圆、展开无阴影折叠有阴影的视觉规则随模块统一。overlay 生命周期不变：把手实例外常驻（生命周期挂指令实例）、折叠 ≡ visible 归假、`requestClose("trigger")` source 标签保留、锚定模式贴锚内侧边保留、shell 开合动画不动；显隐策略经后续修订（ADR-0070，2026-09-30）定为 `showTrigger` 默认 `'hover'`——展开态隐藏、hover/聚焦显形（含全长固定感应边条）、**折叠态恒显**（唯一重开触点）、触屏恒显。
