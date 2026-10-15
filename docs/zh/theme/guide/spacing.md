# 主题要素 · 间距

## 概述

间距控制界面的**稀疏度**：基础量 `--x-spacing-*`、档位开关 `data-spacing`、
派生量 `--auto-spacing` / `--auto-padding` / `--auto-margin`。

```js
themeManager.spacing = "small";
```

```css
.card-body {
    padding: var(--auto-padding);
}
```

<demo html="theme/spacing-overview.html"/>

## 指南

### 六档

| 变量 | 值 |
| --- | --- |
| `--x-spacing-none` | `0` |
| `--x-spacing-x-small` | `0.4rem` |
| `--x-spacing-small` | `0.6rem` |
| `--x-spacing-medium` | `0.8rem` |
| `--x-spacing-large` | `1.0rem` |
| `--x-spacing-x-large` | `1.2rem` |

<demo html="theme/spacing-scale.html"/>

### 派生量

| 变量 | 说明 |
| --- | --- |
| `--auto-spacing` | 通用间距（列表 gap、区块间距） |
| `--auto-padding` | 内距 |
| `--auto-margin` | 外边距 |
| `--auto-input-padding` | 表单内距（由 `data-size` / `data-spacing` 同步换档） |

### `data-size` 与 `data-spacing` 的分工

| 开关 | 语义 |
| --- | --- |
| `data-size` | **整体缩放**：字号 / 字重 / 行高 / 字距 / 内距 / 阴影 / 图标尺寸一起换 |
| `data-spacing` | **只调稀疏度**：`--auto-spacing` / `--auto-padding` / `--auto-margin` / `--auto-input-padding` |

```html
<div data-size="small">整体缩小（含字号）</div>
<div data-spacing="x-small">字号不变，只收紧间距</div>
<div data-size="large" data-spacing="none">大字号 + 零间距</div>
```

微调密度而不动排版时用 `data-spacing`；要「整站变紧凑」时用 `data-size`（或两者一起）。

### 间距是排版的底层标尺

行高与字距都以 `--x-spacing-medium` 为基准计算：

```css
--x-line-height-small: calc(var(--x-spacing-medium) * 1.7);
--x-letter-spacing-large: calc(var(--x-spacing-medium) * 0.08);
```

因此改间距梯度会同时影响[段落](./component-paragraph.md)的呼吸感——这是刻意的：间距是「密度」的度量单位。

<demo html="theme/spacing-baseline.html"/>

---

下一步：[组件变量总览](./component.md)。
