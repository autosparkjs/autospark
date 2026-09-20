# ADR-0049：x-icon button 选项——图标按钮的载体动效模型

- **状态**：Accepted（grill-with-docs，两轮八问）
- **日期**：2026-09-20
- **关联**：[ADR-0046](0046-x-icon-directive.md)（x-icon 本地物种与四级配置链，badge / pointer 修饰先例）、[ADR-0047](0047-x-icon-async-source.md)（远程物种——button 与值通道正交，两物种同样生效）、[CONTEXT.md](../../CONTEXT.md)（「图标层」词条：图标按钮）

## 背景

需求：给 `x-icon` 增加 `button` 选项——启用后图标成为「图标按钮」，带 mouseover 与 press 动效，且在 badge 开启与未开启两种场景下均可工作。

拷问暴露的接缝：① 语义范围（纯视觉 vs 控件语义）；② 非 badge 场景动效载体——硬约束是宿主 mask 裁剪整个元素渲染（伪元素板不可见）且 `background-color` 即图标颜色通道，任何「底板」必须有外层独立盒；③ badge 场景动效落点与梯度；④ 与 `pointer` 选项的关系；⑤ 动效参数可配置性；⑥ 全局默认链归属。

## 决策

### 1. 纯视觉可供性，不承载控件语义

`button` 只做视觉交互态（动效 + 手型光标），不加 `role="button"` / `tabindex` / 键盘激活 / disabled 状态模型。本引擎交互归 `x-on`（用户自行 `@click`），需要真按钮时包 `<button>` 元素——控件语义 YAGNI。

### 2. 载体动效型（核心权衡）：动效作用于既有视觉载体，不新增视觉结构

两方案对峙：

- **板浮现型（否决）**：非 badge 也复用 badge 的包裹层机制，包一层透明板、hover 浮现——与 UI 库图标按钮主流视觉一致，但布局占位恒定变大（总占位 = size + 2×padding），行内文字混排撑行高，且给非 badge 场景引入 DOM 变化。
- **载体动效型（采纳）**：零 DOM 变化、零布局变化，动效作用在既有载体上——非 badge 载体是图形本身（hover 加深 `brightness(.75)` + press 缩放 `scale(.9)`，类挂宿主）；badge 载体是底板（板色三梯度 `5% → hover 10% → press 15%` + press 缩放 wrapper 整体 `scale(.94)`，类挂 wrapper，图形不动）。

由此确立正交分工：**badge 管「板常驻」，button 管「交互动效」**——`badge + button` = 常驻板 + 板动效。要「hover 出板」完整形态直接组合获得。两载体互斥不双挂（载体唯一，防双动效）。

### 3. hover 加深走 filter:brightness，避开 background-color

`color` 选项内联 `background-color`（颜色主权在宿主，ADR-0046 决策 7），类规则 hover 打不过内联样式——动效必须避开该通道。初版取 `opacity:.7` 变淡（跨主题方向一致：朝背景退让读作「待激活」），**demo 观感评审否决**——非 badge 无板时变淡存在感不足，悬停反馈不明显。改定 `filter:brightness(.75)` 加深（作用在 mask 渲染结果上）：变深方向与 badge 板梯度加深一致（都是「增强」），且无板场景下加深对存在感的提升远大于变淡。代价：暗色主题（浅色图形）下 brightness 降低对比，为**已接受的取舍**——主题化反向动效走同名 CSS 覆盖 `.as-icon-button:hover` 规则。

### 4. 纯 CSS `:hover` / `:active` 触发，零事件监听

需求措辞的 "mouseover" 以 CSS hover 语义实现（JS mouseover 反复触发需状态管理，无增益）；`:active` 天然覆盖鼠标 / 触屏按下。规则常驻基础样式表（`buildStyleSheet` 恒下发，对齐 BADGE_RULE 先例）：`.as-icon.as-icon-button`（宿主）与 `.as-icon-badge.as-icon-button`（wrapper）两套选择器以基类归属天然互斥——宿主恒有 `as-icon`、wrapper 恒有 `as-icon-badge` 且无 `as-icon`。

### 5. pointer 隐含；参数内置常量；纳入全局链

- `button` 隐含手型光标（类规则承载、不经内联通道）——图标按钮没有不是手型的理由；`pointer` 选项保持独立可用（不配 button 仍可单开）。
- 动效参数（时长 0.15s ease、缩放比例、板色梯度）内置常量不暴露选项——`button` 保持布尔语义（修饰符 `.button` 免费获得，ADR-0007），自定义走同名 CSS 覆盖 `.as-icon-button` 规则（对齐 fade/slide 内置动画「同名 CSS 可覆盖」惯例）。
- `button` 纳入 `IconOptions`（`AutoSpark.icons.options.button`）——四级链一致性优先于场景频率，`_opt()` 通道零额外成本。

## 后果

- 非 badge 的 button hover 无底板浮现，视觉语言与 UI 库图标按钮（hover 出板）不同——要板用 `badge + button` 组合，文档已写明分工。
- `as-icon-button` 类名与 `as-icon` / `as-icon-badge` 同列保留名（图标注册表拒绝同名图标，warn 复用既有通道）。
- 类规则 `transition` 会被宿主内联 `transition`（如 x-style `.transition` 修饰符）覆盖——用户显式声明优先，可接受。
