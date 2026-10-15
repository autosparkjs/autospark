# 主题要素 · 字体

## 概述

字体要素遵循与颜色相同的三层结构：**一套五档基础量 + 一个档位开关 + 一组派生量**。

| 层 | 内容 |
| --- | --- |
| 基础量 | `--x-font-size-*`（五档）、`--x-font-weight-*`（五档）、`--x-font-family` 系列 |
| 档位开关 | `data-size`（`x-small` / `small` / `medium` / `large` / `x-large`） |
| 派生量 | `--auto-font-size` / `--auto-font-weight` / `--auto-font-family` / `--auto-font`（速写）/ `--auto-title-font` |

```js
themeManager.size = "large"; // 全局字号档（写 :root 的 data-size 属性）
```

```html
<div data-size="x-small">这个子树整体用小号排版</div>
```

<demo html="theme/font-overview.html"/>

## 指南

### 五档基础量

| 变量 | x-small | small | medium | large | x-large |
| --- | --- | --- | --- | --- | --- |
| `--x-font-size-*` | `0.75rem` | `0.875rem` | `1rem` | `1.125rem` | `1.25rem` |
| `--x-font-weight-*` | `200` | `300` | `400` | `500` | `600` |

业务样式可以直接引用档位而不写死数值：

```css
.my-caption {
    font-size: var(--x-font-size-small);
    font-weight: var(--x-font-weight-small);
}
```

<demo html="theme/font-scale.html"/>

### 派生量与速写

| 变量 | 说明 |
| --- | --- |
| `--auto-font-size` | 当前档位的字号 |
| `--auto-font-weight` | 当前档位的字重 |
| `--auto-font-family` | 字体族（Lantinghei SC / Microsoft Yahei / …） |
| `--auto-font` | 速写：`{字重} {字号}/1.5 {字体族}` |
| `--auto-title-font` | 标题排版：字重比当前档 +200、字号 ×1.05 |

```css
p {
    font: var(--auto-font);
}
h2 {
    font: var(--auto-title-font);
}
```

::: tip 速写必须在档位块内重定义
CSS 自定义属性的 `var()` 替换发生在**声明所在元素**的计算值期，后代继承的是已替换的值。
因此 `--auto-font` 在每个 `[data-size=x]` 档位块内都会重新声明一遍——否则局部 `data-size` 容器里的
`font: var(--auto-font)` 不会联动。这也是「为什么局部换档能生效」的实现前提。
:::

<demo html="theme/font-shorthand.html"/>

### 消费派生量 vs 写死基础量

```css
/* ✅ 随全局档位联动 */
font: var(--auto-font);

/* ❌ 永远停在 medium 档（写死了） */
font-weight: var(--x-font-weight-medium);
font-size: var(--x-font-size-medium);
```

两者的初始观感在默认档（`medium`）下完全相同——这正是容易踩的坑：在面板切到 `x-small` 才会暴露差异。

<demo html="theme/font-auto-vs-fixed.html"/>

### 与其它维度的关系

`data-size` 属**规模维度**，与模式维度（`data-dark` / `data-light`）、色彩维度（`data-colorized` / `data-uncolored`）
分属不同域、可同元素叠加：

```html
<div data-dark data-size="x-small">暗色 + 小号排版，两域互不覆盖</div>
```

`data-size` 是「整体缩放」：字号 / 字重 / 行高 / 字距 / 内距 / 阴影 / 图标尺寸一起换档；
只想调稀疏度时用 [间距](./spacing.md) 的 `data-spacing`。

---

下一步：[主题要素 · 圆角](./radius.md)。
