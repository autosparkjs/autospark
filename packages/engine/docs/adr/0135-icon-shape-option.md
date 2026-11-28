# ADR-0135：图标底板 shape 选项（badge 更名 + theme 令牌对接）

- 状态：已采纳（2026-11-27 修订：追加决策五 theme 强调形态——布尔 `theme` 选项，无板图形主题色 / 有板实心主题板 + 文字色图形双色调板，显式 color 恒赢）
- 日期：2026-11-07
- 关联：[ADR-0007](0007-directive-options.md)（选项回退链）、[ADR-0049](0049-icon-button.md)（button 载体动效）、[ADR-0058](0058-icon-symbol.md)（symbol 机制 / 颜色主权在宿主）、[ADR-0129](0129-theme-integration.md)（theme 集成三级回退链）、[ADR-0134](0134-abstract-base-component.md)（data-\* 手动通道）

## 背景

x-icon 的 `badge` 选项存在三重张力：

1. **值域语义漂移**：标量三形态「形态即启用」——`true` / `number`（板 padding px）/ `string`（板 padding CSS 值），一个值同时承载「是否启用底板」与「板 padding 值」两个正交语义；badge 的值压倒独立 `padding` 选项，选项边界模糊。
2. **跨包撞名**：@autospark/plugins 的 button 组件 `icon.badge` 是**角标红点**（伪元素 danger 红点，通知计数语义），与 x-icon 的底板 badge 同名不同义，文档与心智双重混淆。
3. **theme 集成缺位**：ADR-0129 / 0134 之后组件族统一消费 `--auto-*` 派生令牌，图标层（指令）尚未接入——size 硬编码 `1em`、底板圆角硬编码 `25%`、板距硬编码 `0.3em`，挂 theme 的页面图标不随 `data-size` 等档位缩放。

## 决策

### 一、shape 选项（纯枚举），padding 语义归还独立选项

`badge?: boolean | number | string` 更名为 `shape?: "none" | "circle" | "radius"`：

- **值域仅三字符串**。`none` ≡ 未声明（显式关闭拼写，不引入新状态）；非法类型 / 拼写 warn 剪枝按未启用（`shapeWarned` 按值去重，沿 missWarned 惯例）；
- **板 padding 链**：显式 `padding` 声明（四级链：指令选项 > 宿主选项 > 全局配置）> `var(--auto-padding, 0.3em)`；**仅 shape 启用态生效**——none 态照旧（显式才内联、默认 0，裸图标不加内边距，语义「没有底板就没有板距」）；
- **修饰符快捷形态**：`.circle` / `.radius` ≡ `shape` 对应枚举值（修饰符并入选项通道 ADR-0007 的值映射）；显式 `x-icon-options="{shape:…}"` 值优先。

### 二、theme 令牌对接（三变量，基础规则层 var() 承载）

| 对接点 | 承载 | 值 |
|---|---|---|
| size 默认 | `.as-icon` 基础规则 | `var(--auto-icon-size, 1em)` |
| circle 圆角 | `.as-icon-circle` 类规则 | `50%`（形态固有值，硬编码） |
| radius 圆角 | `.as-icon-radius` 类规则 | `var(--auto-border-radius, 4px)` |
| 板距默认 | 形态类规则 | `var(--auto-padding, 0.3em)` |

- **data-\* 手动通道天然覆盖**：var() 沿 CSS 继承链解析，任意祖先 `[data-size]` / `[data-radius]` / `[data-spacing]` 覆盖令牌即自动生效（ADR-0134 手动通道）——engine 零新机制、零依赖 theme 代码（theme 不在场走 fallback，与 ADR-0129 三级回退同构，不破坏「theme 包独立于 engine」）；
- **零内联纪律不变**：默认值一律基础规则层 var() 承载，显式选项声明才 JS 内联压倒。

### 三、指定 color 的浓板联动

- 未指定 `color`：底板 `color-mix(in srgb, currentColor 5%, transparent)` 随宿主文字色（现状不变，dark 模式 currentColor 自然适配）；
- 指定 `color`：底板切换为 `color-mix(in srgb, 指定色, transparent 92%)` = **8% 浓度**指定色板（图标本身仍 100% 指定色渲染，同色相深浅对比）；实现经 `--as-icon-mix` 浓度变量（类规则默认 5%，指定 color 时宿主内联 8%——currentColor 继承使色相自动跟随）；
- `button` hover/press 三梯度公式（5% → 10% → 15% 百分点叠加）不为浓板特调。

### 四、破坏性更名（无兼容层）

- `badge` 选项、`_badge()`、`badgeWarned` 全删，**无 warn 剪枝提示**（快速迭代期直切）；
- 修饰类名 `as-icon-badge` 拆为 **`as-icon-circle` / `as-icon-radius`**（形态即类名，自定义覆盖直接选形态）；旧类从保留名集合（RESERVED_NAMES）移除、两个新类入保留名；
- 波及面全量同步：`IconOptions` 接口、x-icon.md、demo、x-icon.test.ts、CONTEXT.md 词条；plugins 的 button 组件 `icon.badge`（角标红点语义）**保留不动**，仅修正其「x-icon-options 对象」注释词面（badge 键已不属该词表）。

### 五、theme 强调形态（2026-11-27 修订）

新增布尔选项 `theme?: true`——**主题强调形态**，淡板体系（决策三）旁的实心强调分支。颜色调度全矩阵：

| 组合 | 图标色 | shape 底板 |
|---|---|---|
| 无 theme 无 color | currentColor 继承 | `currentColor 5%` 淡板（决策三不变） |
| `color` 显式 | 显式色 | 8% 同色浓板（决策三不变） |
| `theme`（无 shape） | `var(--auto-theme-color, currentColor)` | — |
| `theme` + `shape` | 恒定 `#fff`（白，不随页面底色/文字色变化） | 实心 `var(--auto-theme-color, #333)` |
| `theme` + `color` 显式 | 显式色 | 8% 同色浓板（**theme 退位**） |

- **显式 color 恒赢**（沿 [ADR-0138](0138-button-vertical-icon-scale.md) 惯例）：`theme` 只是 `color` 未声明时的取值来源；显式 `color` 声明即接管整套颜色调度（浓板联动照旧），theme 整体退位——不出现「显式图形色 + 实心主题板」这一对比度无保证的组合；
- **挂类通道**（非内联）：宿主恒挂 `as-icon-theme`、shape 启用时 wrapper 同挂——规则常驻基础样式表，`:hover` 特异性可编排（内联 background 恒胜类规则会压死 button 反馈，见「被否决」）；
- **值形态**：`true` 启用、未声明 / `false` 不启用，其余类型 warn 剪枝（按 String(v) 去重，沿 shape / rotate 先例）；修饰符快捷形态 `.theme`（沿 `.circle` / `.radius` 先例）；
- **button 反馈**：`theme + shape + button` 的 hover / active 在实心板上黑系加深（`color-mix(in srgb, var(--auto-theme-color, currentColor), #000 10% / 15%)`，对应 button 三梯度档位），`scale(.9)` 保留；无板形态沿现行图形通道 brightness 不变；
- **令牌立场**：只引用 `--auto-theme-color` 令牌，x-icon 不自带色值（板内图形除外——恒白）；板内图形**恒定白色**（2026-11-27 三修：初版 `--auto-color` 文字色、二版 `--auto-bgcolor` 页面底色镂空均被否——实心主题板上图形取白不随页面底色/文字色变化，明暗两模式恒反差）；dark 可读性归 theme 包校准域（`--auto-theme-color` dark 取 theme-5 亮档）。**令牌缺失兜底（2026-11-27 再修订）**：无板图形回退 `currentColor`（随文字色无隐形面）；板回退中性深板 `#333`——与恒白图形构成恒可见配对（currentColor 回退会在深色页面近白文字下板图同色隐形，初版即踩）；button 加深公式回退与板同值，防 hover 闪变异色。

## 实现要点（防再踩）

1. **registry.ts**：`ICON_BADGE_CLASS` → `ICON_CIRCLE_CLASS` / `ICON_RADIUS_CLASS`；`BADGE_RULE` 拆 `SHAPE_CIRCLE_RULE` / `SHAPE_RADIUS_RULE`（公共排版声明 + 各自圆角）；`IconOptions.badge` → `shape`；
2. **x-icon.ts**：`_shape()` 枚举归一化（显式 shape 值 > `.circle` / `.radius` 修饰符布尔 > none），wrapper 类按形态挂、未启用拆包照旧；padding 落点维持包裹层通道；
3. **浓板变量**：Chromium 下自定义属性赋值须 `style.setProperty`（`style["--x"]=v` 静默失效），沿 `--as-icon-sw` 惯例；
4. **size 默认不内联**：`_applyStaticStyle` 中 size 未声明照旧 `removeProperty`（零内联），默认值由基础规则 `width/height: var(--auto-icon-size, 1em)` 承接——JS 侧不感知 theme；
5. **类规则共用选择器**：两形态公共部分（inline-flex / flex:none / aspect-ratio:1 / 淡色背景 / 板距 var）以 `.as-icon-circle,.as-icon-radius{…}` 合写，圆角各自单写（DRY）；
6. **theme 类选择器编排（决策五）**：宿主自身规则 `.as-icon-theme{color:var(--auto-theme-color)}`（0,1,0）在板内会被「元素自身规则胜过 wrapper 继承」误用——板内图形色须以**后代选择器** `.as-icon-circle .as-icon-theme, .as-icon-radius .as-icon-theme{color:var(--auto-bgcolor)}`（0,2,0）压回页面底色（沿「wrapper 通道须后代选择器」既有提醒）；wrapper 双挂 `as-icon-theme` 承载实心 background 规则；hover/active 加深以 `.as-icon-circle.as-icon-theme.as-icon-button:hover` 等三类前缀编排特异性（恒胜实心板规则）；
7. **theme 状态写/清对称（决策五）**：`theme` 键并入 `ICON_STYLE_OPTION_KEYS`（成员表达式热应用通道）；`theme + shape` 时 `--as-icon-mix` 不写（实心板不吃浓度变量）、theme 退位（显式 color）时按浓板联动现行逻辑写；类挂/摘与 wrapper 拆包重包同步收敛。

## 被否决 / 演变的方案

- **radius fallback 25%**（视觉不回归派）：25% 是 badge 时代「单形态即全部」的产物；shape 分化后 radius 对齐主题令牌的绝对长度语义，fallback 定值 4px；
- **badge → shape 兼容 warn 层**（仿 ADR-0031 旧写法 warn 剪枝）：快速迭代期，一行 warn 的指引价值低于删除的彻底性；
- **单类名 `as-icon-badge` 承载两形态**（形态差异靠内联圆角）：类名是公开 CSS 覆盖契约，形态即类才能直接按形态覆盖；
- **底板色 theme 化**（`--auto-secondary-bgcolor` 面板色）：断链「改宿主 color 即换底板色」既有语义契约（ADR-0058 颜色主权在宿主的延伸）；
- **none 态 padding 变量化**：裸图标默认内边距会让全部现存图标占位突变（大面积视觉回归），且无底板即无板距；
- **button 梯度随浓板特调**：指定 color + shape + button 三叠加是边缘场景，YAGNI；
- **strokeWidth / color theme 变量化**：theme 无描边令牌；color 是宿主主权（ADR-0058 决策 6），仅底板消费它（浓板联动）不引入上游变量。

决策五（2026-11-27 修订）追加否决：

- **theme 走内联通道**（对齐 color 选项内联先例）：内联 background 特异性恒胜类规则，`theme + shape + button` 的 `:hover` / `:active` 反馈被压死——挂类保留特异性编排空间；
- **color / theme 分工模型**（color 只赢图形色、底板仍实心主题板）：允许「任意显式色 + 实心主题板」的无对比度保证组合，且与「显式恒赢 = 接管整套调度」惯例冲突；
- **theme 扩展语义色枚举**（`theme: "danger"` 类）：YAGNI——任意 CSS 色本就经 `color: "var(--auto-danger-color)"` 可表达，theme 布尔只补 color 单通道做不到的**双色调板**形态。

## Future Work

- strokeWidth 的 theme 对接待 theme 包出现描边令牌（`--auto-stroke-width` 类）再议，当前 1.25 内置默认 + `--as-icon-sw` 变量通道不变。
