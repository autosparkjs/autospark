# 主题令牌兜底校准基准表

> 三级样式回退链末级（校准兜底值）的取值基准：`@autospark/theme` 默认参数（blue 预设 `#1677ff`、全维度 medium、无 colorized）下各 `--auto-*` 派生令牌在**浅色 / 暗色**两种显示模式下的最终计算值。
> `color-mix` 动态派生已换算为等效静态 `rgba()`；含 `calc()` 的排版值取近似固定值。
> 数据来源：`packages/theme/dist/blue.css`（静态主题包，与运行时注入同源）+ `dist/index.css`（灰阶静态层）。theme 侧变量改动时**须同步重算本表**。

## 基础派生链（解析依据）

- 灰阶：`gray-0 #FFFFFF → gray-9 #3C3C3C`（0 最浅 9 最深）
- 浅色 `--x-color-N` = `gray-(9-N)`（color-0 最深 #3C3C3C，正文色取 color-1 = gray-8 #606060）；`--x-bgcolor-N` = `gray-N`
- 暗色 `--x-color-N` = `gray-N`（反转）；`--x-bgcolor-0` = gray-8 #606060（面板）、`bgcolor-1` = gray-9 #3C3C3C（工作区）、`bgcolor-2` = gray-7 #818181
- 主题标尺（blue）：浅色 theme-5 = **#009AFF**、theme-8 = #2064EC；暗色梯度反转 theme-6 = **#56BAFF**、theme-8 = #BBE0FF
- 语义色浅色直引种子；暗色基础键提亮至各自 -3 档标尺；primary 恒随 `--auto-theme-color`

## 语义色 / 交互态

| 令牌 | 浅色兜底 | 暗色兜底 |
|---|---|---|
| `--auto-theme-color` | `#009AFF` | `#56BAFF` |
| `--auto-primary-color` | `#009AFF` | `#56BAFF` |
| `--auto-success-color` | `#22C55E` | `#5CD07C` |
| `--auto-warning-color` | `#F59E0B` | `#F7D352` |
| `--auto-danger-color` | `#EF4444` | `#E6696A` |
| `--auto-info-color` | `#71717A` | `#DCDCE6` |
| `--auto-selected-color` | `#009AFF` | `#56BAFF` |
| `--auto-selected-bgcolor` | `rgba(0,154,255,0.2)` | `rgba(86,186,255,0.18)` |
| `--auto-hover-color` | `#009AFF` | `#56BAFF` |
| `--auto-hover-bgcolor` | `rgba(0,154,255,0.15)` | `rgba(86,186,255,0.15)` |
| `--auto-active-color` | `#2064EC` | `#BBE0FF` |
| `--auto-active-bgcolor` | `rgba(32,100,236,0.15)` | `rgba(187,224,255,0.15)` |
| `--auto-disable-color` | `#BDBDBD` | `#7A7A7A` |

## 文字 / 背景 / 边框

| 令牌 | 浅色兜底 | 暗色兜底 |
|---|---|---|
| `--auto-color` / `--auto-text-color` | `#606060` | `#FAFAFA` |
| `--auto-secondary-color` | `rgba(96,96,96,0.75)` | `rgba(250,250,250,0.75)` |
| `--auto-third-color` | `rgba(96,96,96,0.55)` | `rgba(250,250,250,0.55)` |
| `--auto-bgcolor` / `--auto-panel-bgcolor` | `#FFFFFF` | `#606060` |
| `--auto-secondary-bgcolor` / `--auto-panel-header-bgcolor` | `rgba(245,245,245,0.45)` | `rgba(129,129,129,0.45)` |
| `--auto-third-bgcolor` | `rgba(245,245,245,0.75)` | `rgba(129,129,129,0.75)` |
| `--auto-workspace-bgcolor` | `#FAFAFA` | `#3C3C3C` |
| `--auto-border-size` | `1px` | `1px` |
| `--auto-border-color` | `#F0F0F0` | `#606060` |
| `--auto-border` | `1px solid #F0F0F0` | `1px solid #606060` |
| `--auto-input-bgcolor` | `#FFFFFF` | `#3C3C3C` |
| `--auto-input-placeholder` | `rgba(96,96,96,0.4)` | `rgba(250,250,250,0.4)` |

## 排版 / 规模（暗色不变，除阴影外无模式差异）

| 令牌 | 兜底值 |
|---|---|
| `--auto-font-size` | `1rem` |
| `--auto-font-weight` | `400` |
| `--auto-font-family` | `Lantinghei SC,Microsoft Yahei,Hiragino Sans GB,Microsoft Sans Serif,WenQuanYi Micro Hei,sans-serif` |
| `--auto-line-height` | `1.5`（calc 链 0.8rem×1.9≈1.52 的近似） |
| `--auto-letter-spacing` | `0.05em`（calc 链近似） |
| `--auto-border-radius` | `0.5rem` |
| `--auto-spacing` / `--auto-padding` / `--auto-margin` | `0.8rem` |
| `--auto-icon-size` | `1.2rem` |
| `--auto-shadow` | 浅色 `0 2px 4px hsl(240 3.8% 46.1% / 12%)`；暗色 `0 2px 4px hsl(0 0% 0% / 50%)` |
