# ADR-0129：主题集成——三级样式回退链与暗色兜底变体

- **状态**：Accepted（grill-with-docs，19 项决策收敛）
- **日期**：2026-10-31
- **关联**：[CONTEXT.md](../../CONTEXT.md)（新增「主题化层」8 词条）、[specs/theme-token-baseline.md](../specs/theme-token-baseline.md)（兜底校准基准表）、`@autospark/theme`（ADR-0007 库型插件，本 ADR 零改动其源码）、[ADR-0124](0124-overlay-content-component.md)（overlay 家族变量契约先例）

## 背景

`@autospark/theme`（CSS 变量驱动主题库）已以插件形态存在（IIFE + `installPlugin`，挂 `engine.themeManager`），但 engine 与 plugins 的内置样式未接驳：既有 `--autospark-<feature>-<token>` 变量族只带两级 fallback（变量 + 字面兜底），theme 在场时内置组件不跟随主题。

需求：**导入 theme 即自动换肤；未导入时 `--autospark-*` 可覆盖且视觉与 theme 默认基本一致；两者皆无时保底可用**——三级一回退成链，且暗色模式在任意组合下观感协调。

约束（用户裁决）：不改 theme 包（其令牌名与机制是既成事实）；engine/plugins 对 theme 零 import、零 JS 探测（纯 CSS 变量解析解耦）。

## 决策

### 1. 三级嵌套回退链，严格字面级联

内置样式消费主题令牌的统一形态：

```css
border-radius: var(--auto-border-radius, var(--autospark-overlay-radius, 0.5rem));
```

- 第一级 **theme 派生令牌**（`--auto-X`）：theme 在场（已定义）即全赢——严格字面级联，覆盖变量被遮蔽不生效；theme 在场时改观感的正道是改 theme 参数（主题色/显示模式/维度）或在更近作用域重定义 `--auto-*`；
- 第二级 **覆盖变量**（`--autospark-<feature>-X`）：theme 缺席时的开发者定制入口；
- 第三级 **校准兜底值**：皆无时收尾（见决策 5）。

**必须嵌套**：CSS `var()` 的 fallback 是逗号后整串字面值，平铺写法 `var(--a, --b, c)` 在 `--a` 缺失时产出非法声明（裸 `--b` 非合法属性值）——不存在平铺形态的选择。

### 2. 令牌边界：只消费 `--auto-*` 派生层

theme 的变量是两层体系：`--x-*` 基变量层（灰阶/标尺/档位）是内部实现，`--auto-*` 派生消费层（语义色/交互态/边框/排版/面板/规模/输入）是公开接口。内置样式**唯一许可引用 `--auto-*`**——引用 `--x-*` 等于耦合 theme 内部结构，为禁区。

### 3. 覆盖变量保留既有名

`--autospark-<feature>-<token>` 命名约定已存在（engine 121 处，plugins 跨包复用 `--autospark-overlay-*`），**零改名**、只在前面挂 theme 令牌。既有用户覆盖面与跨包契约不破坏；语义从「唯一定制入口」升级为「theme 缺席时的定制入口」。杂音前缀（`--x-ripple-*` / `--x-spin-*` / `--asc-button-*` / `--as-*`）同样不动（改名是破坏性变更且与本目标正交）。

### 4. 严格映射：语义一一对应才挂第一级

- **映射**：radius→`--auto-border-radius`、面板底→`--auto-bgcolor`、次级底→`--auto-secondary-bgcolor`、边框色→`--auto-border-color`、阴影→`--auto-shadow`、正文/次要/三级文字→`--auto-color`/`--auto-secondary-color`/`--auto-third-color`、五语义色→`--auto-{primary|success|warning|danger|info}-color`、hover/selected 交互态→`--auto-hover-*`/`--auto-selected-*`、主题主色→`--auto-theme-color`；
- **非映射声明**（保持两级 + 兜底校准）：divider、遮罩色、tooltip 暗底、调节手柄色、分隔条 hover 色、滚动条色、focus 轮廓色——theme 无语义对应令牌，借近似令牌会产生怪异对比，宁可 theme 在场时细节不跟随主题色（显示模式经变体跟随，见决策 6）；
- **永不映射**：z-index、功能尺寸（drawer-size、max-w、loading 最小尺寸、把手尺寸、字号档、padding/gap 布局量）——主题无关维度，覆盖变量是唯一定制入口。

### 5. 校准兜底值：浅/暗双值，以 theme 默认计算值为基准

兜底字面值不是随手拍的默认，而是 theme 默认参数（blue 预设 `#1677ff`、全维度 medium）下对应令牌的**最终计算值**：浅色取 light 块、暗色取 dark 块（`color-mix` 动态派生换算为等效静态 `rgba()`，`calc()` 排版链取近似固定值）。效果：**无 theme 与有 theme（默认参数）在两种显示模式下渲染基本一致**（视觉对齐）。基准数据落盘 [specs/theme-token-baseline.md](../specs/theme-token-baseline.md)，theme 侧变量改动须同步重算。

### 6. 暗色兜底变体：`[dark]` / `[data-dark]` 属性契约

全部视觉声明（映射 + 非映射）追加暗色规则：

```css
[dark] [data-overlay][data-overlay-border],
[data-dark] [data-overlay][data-overlay-border] {
    background: var(--auto-bgcolor, var(--autospark-overlay-bg, #606060));
}
```

- **只切兜底字面值、不改变量引用链**（变体规则保留完整三级链）——theme 在场时第一级被 theme 暗色块重定义自动跟随，变体只是兜底不参与竞争；用户覆盖变量在两种模式下都生效；用户近作用域重定义 `--auto-*` 也不被变体绕过；
- 特异性 `[dark] <sel>` (0,2,x) 自然压过基规则 (0,1,x)，浅色下不命中；
- `[dark]`（裸属性 setter 通道）/`[data-dark]`（独立样式域通道）是与 theme 共享的**公开属性契约**——engine 对暗色的感知纯 CSS 属性选择器、零 JS 探测，不引入 `prefers-color-scheme`（与 theme 纯属性切换哲学一致）；
- theme 缺席 + 手挂 `[dark]` 时内置样式独立呈现暗色；
- **模式无关声明不加变体**（radius/spacing/字号——浅暗校准值相同，变体无意义；与 theme 自身 scaleVarKeys 不进 dark 块的结构同构）。

### 7. 组件级例外（实施期裁决，记入映射表）

- **x-loading 深遮罩族整体非映射**：遮罩底走配置契约（`rgba(bgColor, opacity)` 默认黑 0.5），白字/白边按钮/灰 loader 是深遮罩配套自洽设计，theme 无遮罩令牌——映射 `--auto-color` 会在黑遮罩上不可读；
- **tooltip 暗底面板非映射**：bg/fg/border/阴影是恒暗底设计（两模式同值，无变体），仅 radius 映射；
- **decorate 家族色链的暗色近似**：ripple/spin 色链经 inline `setProperty` 写入（`--x-ripple-color: var(--auto-theme-color, var(--autospark-ripple-color, #009aff))`），inline 值无选择器可挂变体——theme 缺席 + dark 下主色兜底取浅色校准值（暗底可辨）；theme 在场时第一级自动跟随暗色。

### 8. plugins 侧：覆盖位按插件独立 + 语义色命名对齐

- decorate 原共享常量 `THEME_COLOR_VAR` / `BADGE_COLOR` 拆分为四条独立链（覆盖粒度对齐插件边界）：`RIPPLE_COLOR_VAR`（`--autospark-ripple-color`）/ `SPIN_COLOR_VAR`（`--autospark-spin-color`）/ `RIPPLE_BADGE_COLOR`（`--autospark-ripple-badge-color`）/ `SPIN_BADGE_COLOR`（`--autospark-spin-badge-color`）；`resolveColor` 签名加 `DecorateDefaultColors` 参数由各插件传入自己的链；
- 语义色命名**以 theme 侧词汇为准**：notifications 的 `warn` ↔ `--auto-warning-color`、`error` ↔ `--auto-danger-color`；
- `--asc-button-*` 前缀保留，语义色变体前挂（primary/success/danger → 对应 `--auto-*-color`）；语义色底上的白字非映射（恒定设计）；
- notification 的语义色混合底经内部中转变量 `--autospark-notification-mix-bg` 承载（暗色变体只改它一处，DRY）。

## 声明级映射表

兜底值：浅色/暗色两值均取自 [specs/theme-token-baseline.md](../specs/theme-token-baseline.md)。下表「兜底」列省略为「基准值」。

### engine 组件模板（`src/components/`）

| 文件 | 声明 | 链（第一级 → 覆盖变量） | 类型 |
|---|---|---|---|
| dialog-shell.html / popover-shell.html | 面板圆角 | `--auto-border-radius` → `--autospark-overlay-radius` | 映射 |
| 同上 | 面板边框色 | `--auto-border-color` → `--autospark-overlay-border` | 映射 |
| 同上 | 面板背景 | `--auto-bgcolor` → `--autospark-overlay-bg` | 映射 |
| 同上 | 面板/箭头阴影 | `--auto-shadow` → `--autospark-overlay-shadow`（新覆盖位） | 映射 |
| 同上 | z-index | 恒两级 `--autospark-overlay-z` | 永不映射 |
| drawer-shell.html | drawer 尺寸 / z-index / 贴边 radius 0 | 恒两级 / 不变量 | 永不映射 |
| drawer-shell.html | 折叠把手阴影 | `--auto-shadow` → `--autospark-expandable-trigger-shadow` | 映射 |
| overlay.html | header/footer divider | 两级 `--autospark-overlay-divider`（兜底 #f0f0f0/#606060） | 非映射 |
| overlay.html | close/action hover 底 | `--auto-hover-bgcolor` → `--autospark-overlay-hover` | 映射 |
| overlay.html | action 边框色 | `--auto-border-color` → `--autospark-overlay-action-border` | 映射 |
| overlay.html | close/action 圆角 | `--auto-border-radius` → `--autospark-overlay-radius` | 映射 |
| error.html | 容器底/正文/图标/按钮全套 | `--auto-bgcolor`/`--auto-color`/`--auto-third-color`/`--auto-border-color`/`--auto-border-radius`/`--auto-hover-*` → `--autospark-error-*`（新覆盖位族） | 映射 |
| error.html | 字号/padding/gap | 保留组件设计值 | 非对象 |

### engine features / directives 注入样式

| 文件 | 声明 | 链 | 类型 |
|---|---|---|---|
| features/tooltip/styles.ts | 圆角 | `--auto-border-radius` → `--autospark-tooltip-radius` | 映射 |
| features/tooltip/styles.ts | 暗底/前景/边框/阴影 | 两级 `--autospark-tooltip-*`（恒暗底设计，无变体） | 非映射 |
| features/overlay/container.ts | mask | 透明壳零视觉面（z-index 恒两级） | — |
| features/directive/expandable-trigger.ts | 把手边框/背景/阴影/前景/hover | `--auto-border-color`/`--auto-bgcolor`/`--auto-shadow`/`--auto-third-color`/`--auto-hover-*` → `--autospark-expandable-trigger-*` | 映射 |
| features/icons/registry.ts | — | 纯 currentColor，零颜色面 | — |
| x-expandable.ts | fade 遮罩色 | `--auto-bgcolor` → `--autospark-expandable-fade-color` | 映射 |
| x-tree.ts | 行 hover | `--auto-hover-bgcolor` → `--autospark-tree-hover-bgcolor`（新） | 映射 |
| x-tree.ts | 拖拽指示线/落点 | `--auto-selected-color`/`--auto-selected-bgcolor` → `--autospark-tree-drop-*`（新） | 映射 |
| x-tree.ts | 错误图标 | `--auto-danger-color` → `--autospark-tree-error-color`（新） | 映射 |
| x-resizable.ts | 手柄点色 | 两级 `--autospark-resize-handle-color`（校准 third 值） | 非映射 |
| x-for.ts | 滚动条 | 两级 `--autospark-scrollbar-color`（新，校准 third 值） | 非映射 |
| x-foldable.ts | more 按钮 hover | `--auto-hover-bgcolor` → `--autospark-foldable-trigger-hover`（新） | 映射 |
| x-foldable.ts | focus 轮廓 | 两级 `--autospark-foldable-trigger-focus`（校准） | 非映射 |
| x-splitter.ts | 分隔条 hover | 两级 `--autospark-splitter-color-hover`（校准） | 非映射 |
| x-loading.ts / x-container / x-layout / x-viewport / x-version / animate | — | 深遮罩族非映射 / 无视觉面 / 布局量 | — |

### plugins（`packages/plugins/src/plugins/`）

| 文件 | 声明 | 链 | 类型 |
|---|---|---|---|
| decorate/index.ts + x-ripple | 涟漪色 | `--auto-theme-color` → `--autospark-ripple-color` | 映射（inline，暗色近似见决策 7） |
| decorate/index.ts + x-spin | 旋噪色 | `--auto-theme-color` → `--autospark-spin-color` | 映射（inline） |
| 同上 ×2 | 徽标色 | `--auto-danger-color` → `--autospark-{ripple\|spin}-badge-color` | 映射（inline） |
| button/button.html | 圆角/默认底/正文 | `--auto-border-radius`/`--auto-secondary-bgcolor`/`--auto-color` → `--asc-button-*` | 映射 |
| button/button.html | primary/success/danger 底 | `--auto-{primary\|success\|danger}-color` → `--asc-button-*-bg` | 映射 |
| button/button.html | 语义色底白字 | 两级 `--asc-button-*-color` | 非映射 |
| notifications/notification-shell.html | 卡片圆角/边框/底/阴影/正文 | `--auto-border-radius`/`--auto-border-color`/`--auto-bgcolor`/`--auto-shadow`/`--auto-color` → `--autospark-overlay-*`/`--autospark-notification-fg` | 映射 |
| 同上 | 四级语义 accent | `--auto-{info\|success\|warning\|danger}-color` → `--autospark-notification-{info\|success\|warn\|error}-color` | 映射（命名对齐） |
| 同上 | 混合底中转 | `--autospark-notification-mix-bg`（内部中转，变体单点） | 机制 |
| 同上 | action 语义变体（`type` 约定键：primary/success/warning/danger/plain，渲染 `data-action-type`；无标记 = 跟随 level accent） | `--auto-{primary\|success\|warning\|danger}-color` / plain→`--auto-secondary-color` → `--autospark-notification-action-<语义>` | 映射（场景化） |
| notifications/task.html | 进度条段色/轨道（活动指示） | `--auto-theme-color` → `--autospark-notification-accent`（轨道底再前挂 `--auto-bgcolor`，与段同源） | 映射（场景化） |
| 同上 | 固定 op 语义（`data-op`：start/pause/stop/cancel） | start→`--auto-primary-color`、stop→`--auto-danger-color`、pause/cancel→`--auto-secondary-color` → `--autospark-notification-op-<语义>`；无标记跟随 accent | 映射（场景化） |
| notifications/actions/confirm.ts | 内置确定/取消 | 确定 `type:'primary'`、取消 `type:'plain'`（走 action 语义变体通道） | 机制 |
| notifications/runtime/styles.ts | 分区结构 | 无颜色面 | — |

## 已知边界（文档同步声明）

1. theme 在场时设 `--autospark-*` 无声不生效（严格字面级联的代价，指南页明示两条正道）；
2. 非映射声明不跟随主题色变化（静态校准值），显示模式经变体跟随；
3. overlay 家族挂 body 级容器，跟随 theme **根作用域**——声明处的局部样式域（`data-dark` 子树等）对弹层不生效（overlay 容器机制与 theme scope 机制的既有事实，本次显形）；
4. decorate inline 色链的暗色兜底近似（决策 7）。

## 被否决的方案

- **分层令牌（theme 内 `--auto-X: var(--autospark-X, theme值)` 改写）**：需修改 theme 包，违反硬约束；且 theme 在场时覆盖语义会反转（覆盖恒赢）；
- **宽松映射**（divider 借 `--auto-border-color`、遮罩借 `--auto-bgcolor` 等）：语义牵强、theme 换色时产生怪异对比；
- **集中默认变量表**（engine `static initialize` 注入 `:root` 的 `--autospark-*` 默认表）：引入注入时序与「开发者 `:root` 覆盖 vs engine `:root` 表」优先级纠缠，内联三级链零机制；
- **杂音前缀统一**：破坏性改名，与主题集成正交；
- **`prefers-color-scheme` 自动探测**：与 theme 纯属性切换哲学相悖，属性契约显式可控；
- **仅非映射声明补暗色变体**：theme 缺席 + `[dark]` 时映射声明兜底仍浅色（白底暗线半吊子），变体覆盖全部视觉声明才场景一致。

## 实施

一次性全量迁移（grilling Q6）：engine 组件模板 5 文件 + features 2 文件 + directives 7 文件 + plugins 6 文件；`?raw` 断言按「空白归一化 + 结构断言」核对（既有断言为结构性匹配，零修改通过）；验证 = 链结构断言 + Bun.serve/Playwright 有/无 theme × 浅/暗四组合端到端。
