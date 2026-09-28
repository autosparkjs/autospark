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
