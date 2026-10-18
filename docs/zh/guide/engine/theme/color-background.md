# 主题要素 · 背景色

## 概述

背景由基础调色板的背景梯度 `--x-bgcolor-0..9` 提供原料，派生层再按用途切成四层：
工作区 / 面板 / 次级 / 内嵌。层次不靠「不同颜色」，而靠**档位 + 不透明度**的单调阶梯。

```css
.app {
    background: var(--auto-workspace-bgcolor);
}
.panel {
    background: var(--auto-panel-bgcolor);
}
.inset {
    background: var(--auto-secondary-bgcolor);
}
```

<demo html="theme/color-background-overview.html"/>

## 指南

### 派生层四层背景

| 变量 | 配方 | 用途 |
| --- | --- | --- |
| `--auto-workspace-bgcolor` | `--x-bgcolor-1` | 应用底 / 工作区 |
| `--auto-bgcolor` | `--x-bgcolor-0` | 面板 / 卡片 / 弹层 |
| `--auto-secondary-bgcolor` | `bgcolor-2` 45% 透明 | 次级面板 / 分区 |
| `--auto-third-bgcolor` | `bgcolor-2` 75% 透明 | 内嵌块 / 代码块 |
| `--auto-panel-bgcolor` | `--auto-bgcolor` | 面板 / Drawer |
| `--auto-panel-header-bgcolor` | `--auto-secondary-bgcolor` | 标题栏 / 标签页头 |

<demo html="theme/color-background-layers.html"/>

### 基础梯度 `--x-bgcolor-0..9`

| 档 | 亮语境 | 暗语境 |
| --- | --- | --- |
| `0` | `gray-0`（最浅，面板） | `gray-8`（面板，浮起） |
| `1` | `gray-1`（工作区，略深于面板） | `gray-9`（工作区，最沉） |
| `2..9` | 递深 | 递亮（透明度叠加原料与扩展档） |

暗色的背景映射刻意把**前景与背景分离**：`color-i = gray-i`（前景从最沉起），
而背景让 `bgcolor-0`（面板）浮起于 `bgcolor-1`（工作区）之上——这样「面板浮在工作区上」的层级在两种模式下都成立。

<demo html="theme/color-background-scale.html"/>

### 为什么次级 / 内嵌用透明度

次级与内嵌块共用同一原料（`bgcolor-2`）的两档不透明度（45% / 75%）：

- 叠在任意底色上都自然（不必为每种底色各配一个色值）；
- 亮 / 暗 / 多彩下都落在可辨区间，四层阶梯恒单调；
- 半透明的次级块还能透出底层氛围（多彩模式尤其明显）。

### 多彩下的背景

| 变量 | 亮多彩 | 暗多彩 |
| --- | --- | --- |
| `--x-bgcolor-0` | `theme-0` | `theme-0`（最深档） |
| `--x-bgcolor-1` | `theme-1` | `theme-0` 混黑 30% |
| `--x-bgcolor-2..9` | `theme-2..9` | `theme-2..9` |

多彩模式下整条幕布被主题色浸染（不再取灰阶），因此 `--auto-workspace-bgcolor` 等派生值也随之变色。

### 业务自定义容器的引用顺序

```css
/* 外层 → 容器 → 内嵌 */
.page {
    background: var(--auto-workspace-bgcolor);
}
.card {
    background: var(--auto-bgcolor);
    border: var(--auto-border);
}
.card .section {
    background: var(--auto-secondary-bgcolor);
}
```

不要写死颜色——写死会让模式与多彩切换失效。

<demo html="theme/color-background-usage.html"/>

---

下一步：[语义颜色](./color-semantic.md)。
