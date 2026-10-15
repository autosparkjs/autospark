# 主题要素 · 派生颜色

## 概述

派生层（`--auto-*`）是主题库与组件之间的**唯一契约**：按「用途」命名，值引用基础调色板。
组件只消费这一层，于是主题色、模式、色彩、尺寸四类开关全自动联动。

```css
.my-panel {
    background: var(--auto-bgcolor);
    color: var(--auto-color);
    border: var(--auto-border);
    box-shadow: var(--auto-shadow);
    border-radius: var(--auto-border-radius);
    padding: var(--auto-padding);
}
```

<demo html="theme/color-derived.html"/>

## 指南

### 分组清单

| 分组 | 变量 | 说明 |
| --- | --- | --- |
| **主题色** | `--auto-theme-color` | 主色基准（亮 `theme-5` / 暗 `theme-6`） |
| **语义色** | `--auto-primary-color`、`--auto-success-color`、`--auto-danger-color`、`--auto-warning-color`、`--auto-info-color` | 指向 `--x-color-{name}` |
| **文字** | `--auto-color`、`--auto-text-color`、`--auto-secondary-color`、`--auto-third-color` | 三档正文色 |
| **背景** | `--auto-bgcolor`、`--auto-secondary-bgcolor`、`--auto-third-bgcolor`、`--auto-workspace-bgcolor` | 面板 / 次级 / 内嵌 / 工作区 |
| **交互态** | `--auto-hover-color` / `-bgcolor`、`--auto-active-color` / `-bgcolor`、`--auto-selected-color` / `-bgcolor`、`--auto-disable-color` / `-bgcolor` | 四态文字与底色 |
| **边框** | `--auto-border-size`、`--auto-border-color`、`--auto-border`、`--auto-{hover,active,selected,disable}-border(-color)` | `--auto-border` 是 `1px solid {色}` 速写 |
| **排版** | `--auto-font`、`--auto-title-font`、`--auto-font-family`、`--auto-font-size`、`--auto-font-weight`、`--auto-letter-spacing`、`--auto-line-height` | 随 `size` 档位联动 |
| **面板** | `--auto-panel-header-color`、`--auto-panel-header`、`--auto-panel-header-bgcolor`、`--auto-panel-bgcolor` | 标题栏 / 面板 |
| **外框** | `--auto-border-radius`、`--auto-spacing`、`--auto-padding`、`--auto-margin`、`--auto-shadow` | 随四个尺寸档位联动 |
| **输入框** | `--auto-input-font`、`--auto-input-border`、`--auto-input-bgcolor`、`--auto-input-placeholder`、`--auto-input-padding`、`--auto-input-radius` | 表单外观 |
| **图标** | `--auto-icon-size`、`--auto-icon-{alert,info,success,warning,error,focus}` | 尺寸 + 内置 SVG 图标（data URI，可直接 `mask-image`） |

### 文字三档

| 变量 | 配方 | 用途 |
| --- | --- | --- |
| `--auto-color` | `var(--x-color-1)` | 正文 / 标题 |
| `--auto-secondary-color` | 主文字色 25% 透明 | 次要说明 |
| `--auto-third-color` | 主文字色 45% 透明 | 时间戳、辅助信息 |

三档引用文字标尺的相邻档位（亮色下约 59 / 109 / 149），档距均匀且「主要 > 次要 > 辅助」的层级在暗色与多彩下恒成立。

### 背景四层

| 变量 | 配方 | 用途 |
| --- | --- | --- |
| `--auto-workspace-bgcolor` | `var(--x-bgcolor-1)` | 应用底 / 工作区 |
| `--auto-bgcolor` | `var(--x-bgcolor-0)` | 面板 / 卡片 / 弹层 |
| `--auto-secondary-bgcolor` | `bgcolor-2` 45% 不透明 | 次级面板 / 分区 |
| `--auto-third-bgcolor` | `bgcolor-2` 75% 不透明 | 内嵌块 / 代码块 |

层次不靠「不同颜色」而靠**档位 + 不透明度**的单调阶梯——所以同一套变量在亮 / 暗 / 多彩下都成立。
细节见[背景色](./color-background.md)。

### 交互四态

| 态 | 颜色来源 | 底色 |
| --- | --- | --- |
| hover | `--auto-theme-color` | 主色 15% 透明 |
| active | `--x-color-theme-8`（更深一档） | 主色 15% 透明 |
| selected | `--auto-theme-color` | 主色 20% 透明（暗色 18%，感知对称） |
| disable | 文字色混灰（暗色混灰比例更高） | `currentColor` 20% 透明 |

```css
.item:hover {
    color: var(--auto-hover-color);
    background: var(--auto-hover-bgcolor);
    border: var(--auto-hover-border);
}
```

细节见[交互反馈](./component-feedback.md)。

### 引用建议

| 场景 | 用什么 |
| --- | --- |
| 组件配色（文字 / 背景 / 边框 / 交互态） | `--auto-*`（唯一推荐） |
| 需要比正文更浅 / 更深的一档做层次 | `--x-color-*` 档位 |
| 需要主题色的深浅档（品牌色浅底） | `--x-color-theme-*` |
| 需要语义色的档位（danger 浅底） | `--x-color-{name}-*` |
| 需要固定灰（不随模式 / 色彩变化） | `--x-color-gray-*` |
| 尺寸 / 间距 / 圆角 | `--x-*` 档位量或 `--auto-*` 语义量 |

::: warning 不要做的事
- 不要给 `--auto-*` 硬编码颜色：模式覆盖作用于**基变量**，覆盖派生层会让模式切换失效；
- 不要直接消费 `--x-plain-*` / `--x-tinted-*`：它们是给 `data-*` 属性块用的别名，直接引用会绕过维度切换；
- 不要移除暗色块里的 `!important`：那是「同元素亮 → 暗切换」的级联前提。
:::

---

下一步：[明暗主题](./color-dark.md)。
