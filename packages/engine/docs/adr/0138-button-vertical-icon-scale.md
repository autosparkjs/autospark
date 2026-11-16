# ADR-0138：button 纵排图标倍率（icon.scale）与图标尺寸载体修正

- 状态：已采纳（2026-11-16 当日修订：决策三 memo 倍率并入统一 1.5×、scale 生效域扩至 memo 场景，取大语义废除）
- 日期：2026-11-16
- 关联：[ADR-0012](0012-button-rewrite.md)（button 重写）、[ADR-0129](0129-theme-integration.md)（theme 三级回退链）、[ADR-0134](0134-abstract-base-component.md)（data-\* 手动通道）、[ADR-0135](0135-icon-shape-option.md)（--auto-icon-size 令牌 / size 内联通道）

## 背景

纵排按钮（`labelPos: 'top' | 'bottom'`）中图标是主视觉元素，恒 1em 与文字块视觉失衡，需求放大 1.5 倍。排查载体时发现**既有暗病**：memo 在场时图标放大走 `font-size: 2em`（button.html 先例），而 `.as-icon` 基础规则的宽高是 `var(--auto-icon-size, 1em)`（ADR-0135）——theme 在场时 `--auto-icon-size` 为**绝对值链**（`calc(1.2 * 1rem)`），`font-size` 撑不动宽高，**该先例在 theme 页面静默失效**（文档站 demo 默认挂 theme，恰是主要消费场景）。

## 决策

### 一、纵排内建 1.5×：width/height 覆盖载体（theme 两态一致）

`.asc-button-body[data-label-pos="top"/"bottom"]` 下主图标位放大 = **倍率乘在 `var(--auto-icon-size, 1em)` 上**，以 `.asc-button-icon.as-icon` 双类选择器直接覆盖 width/height（tag 图标钉 1rem 的同构先例，压过 `.as-icon` 基础规则）——theme 在场（档位绝对值）与不在场（1em 回落）两态下均为严格「当前上下文默认大小 × 1.5」。

### 二、icon.scale 新键：纵排专属倍率，与 size 叠加，显式恒赢

`icon` 对象新增自有键 `scale?: number`（x-icon 无此选项，不走 x-icon-options 透传词表）：

- **仅纵排参与**：横排给了静默忽略（纵排即「图标作主视觉」的显式声明语境，倍率键只服务该语境）；
- **缺省 1.5**：未给键时纵排放大由 CSS 内建承载（决策一）；
- **与 `icon.size` 叠加**：纵排实际大小 = `size × scale`（size 未给 = 上下文默认 × scale）——**乘积经 `x-icon-options:size` 内联通道写入**（number 直乘出 px、字符串 size 包 `calc(<size> * <scale>)`），内联恒压 CSS 是叠加的唯一可行载体；
- **显式恒赢**：给了 `scale` 即完全接管倍率——纵排内建 1.5 与 memo 内建 2（决策三）同时失效，口径与「显式 size 即接管」家族同构；
- **非法值**（0 / 负数 / NaN）静默剪枝回退内建缺省（x-icon size 同病同治）；
- **字符串 icon 形态无通道**：`icon: "name"` 仅吃内建 1.5，自定义倍率须对象形态（scale 是 icon 对象自有键的自然结果，文档口径写明）。

### 三、memo 放大并入统一 1.5×，复用同一倍率机制（2026-11-16 当日修订）

原决策为「memo 2× 取大不叠加、迁同载体修暗病」；当日修订：**memo 在场与纵排走同一套倍率**——内建统一 1.5×（原 ADR-0012 的 memo 2× 语义废除，两条 CSS 规则合并为一条），`icon.scale` 生效域从「纵排」扩展为「纵排 **或** memo 在场」（模板放大条件 `labelPos top/bottom || !!memo`），显式恒赢、size 叠加、非法剪枝口径全同决策二。修订动机：两套内建倍率（1.5 / 2）+ 取大规则的心智成本高于统一值；1.5× 在 memo 双行文本块配平下视觉足够。

### 四、边界

- **loading 圈**：只吃纵排内建 1.5，**不吃显式 `scale`**（loading 替换 icon，scale 属于被替换者，语义不转移到替身）；
- **caret / tag 图标**：不受任何倍率影响（独立容器，选择器天然不命中；tag 恒钉 1rem 不变）；
- **纯图标纵排**（无 label）：照常放大（规则统一，纵排本身即使用者显式声明）；
- **运行时切换** labelPos / icon：CSS 属性选择器天然跟随；size × scale 通道为绑定表达式，响应式重求值（computed 通道有「后续赋值不重算」既有坑，见实现要点 3）。

## 实现要点（防再踩）

1. **CSS**：单一合并规则三选择器（纵排 top/bottom + memo `:has(.asc-button-memo)`）同值 ×1.5——svg 恒 100% 撑满宿主自动跟随，无需双写（tag 先例钉固定 rem 值才双写）；修订前的「memo 规则后位取大」安排已废；
2. **叠加通道**：`x-icon-options:size` 值改计算表达式（icon.size 有无 × scale 参与的三分支），**优先内联表达式**而非 computed——绑定表达式天然响应式，绕开组件 computed 后续赋值不重算的既有缺陷；表达式不含组件 methods（宽松求值 undefined → 静默移除，家族惯用法）；
3. 若采用 computed 通道（displayLabel 先例）：运行时 labelPos/icon 变化的跟随性**必须测试覆盖**，坏则改 mounted watch 直写属性；
4. **内联压 CSS 的时序**：显式 size（含 × scale 乘积）写入内联后，纵排/memo CSS 规则对主图标自然失效——这是决策二「显式恒赢」的机制本体，不是回归 bug；
5. 配套四态单测：theme 不在场 1.5× / theme 在场 1.5× / memo 在场取 2× / 显式 size × scale 叠加（+ 横排 scale 忽略、loading 只吃内建两边界）。

## 被否决 / 演变的方案

- **font-size: 1.5em 载体**（memo 先例沿用）：theme 在场 `--auto-icon-size` 绝对值链下静默失效，官方 demo（默认挂 theme）不可见——半残功能；
- **通用倍率键**（任意场景生效）：收窄为放大场景（纵排 / memo）专属——非放大场景给 scale 静默无效是可解释死区，无限放大域会稀释「图标作主视觉」的语义；
- **size 互斥 size 赢**：纵排「一切尺寸统一放大」的语义更自洽（含显式 size 的按钮同样视觉升级），叠加实现成本经内联乘积归零；
- **max 取大**（显式 scale vs 内建 1.5/2）：显式声明被内建覆盖不可预期（`scale: 1.2` 配 memo 被顶到 2）——显式恒赢；（原「纵排 1.5 与 memo 2 内建互取大」的同款规则亦随决策三修订废除——统一 1.5 后无取大面）；
- **顶层 props `iconScale`**：icon 视觉键族（size/color/strokeWidth/padding/shape/button/pointer/rotate/badge）聚居 icon 对象，倍率键不例外；
- **CSS 变量承载叠加**（`--auto-icon-size: calc(base × scale)` 类方案）：显式 size 的内联宽高恒压 CSS，叠加永远够不着——叠加只能进 size 值本身；
- **loading 圈吃 scale**：icon 的键影响不相关的替身位，语义松散——只吃内建。

## Future Work

- state-button 的 `states` 项视觉键 `icon` 覆盖同名 props 时为完整 icon 值，对象含 `scale` 即天然继承本机制（快照克隆 + 同一 button 骨架），无需额外适配——实施后回归确认一例即可。
