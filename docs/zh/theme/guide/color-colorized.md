# 主题要素 · 多彩模式

## 概述

色彩是颜色要素的**第二个开关**，与显示模式正交：灰阶幕布换为主题色浸染的色阶。
它同样有 JS 通道（`colorized` 属性）与元素域通道（`data-colorized` / `data-uncolored`）。

```js
themeManager.colorized = true; // 全局多彩
```

```html
<div data-colorized>仅此元素多彩</div>
<div data-dark data-colorized>暗色 + 多彩（须同元素）</div>
<div data-uncolored>色彩回灰、模式随语境</div>
```

<demo html="theme/color-colorized-overview.html"/>

## 指南

### 两个维度、四个属性

| 维度 | 两端 | JS 通道 | 元素域通道 |
| --- | --- | --- | --- |
| 显示模式 | 暗色 / 亮色 | `themeManager.dark`（写 `dark` 属性） | `data-dark` / `data-light` |
| 色彩 | 多彩 / 无彩 | `themeManager.colorized`（写 `colorized` 属性） | `data-colorized` / `data-uncolored` |

四种颜色模式的组合与取值：

| 颜色模式 | 属性 | 基础调色板取值 |
| --- | --- | --- |
| light | 无属性 / `data-light` | 亮灰方向 |
| light + colorized | `data-colorized` | 亮多彩映射 |
| dark | `dark` / `data-dark` | 暗灰方向 |
| dark + colorized | `data-dark data-colorized`（同元素） | 暗多彩映射 |

<demo html="theme/color-colorized-modes.html"/>

### 映射规则

| 变量 | 亮多彩 | 暗多彩 |
| --- | --- | --- |
| `--x-color-i`（前景） | `theme-{9-i}` | `theme-{9-i}`（暗梯度已反转 → 取到更亮的档） |
| `--x-bgcolor-0`（面板） | `theme-0` | `theme-0`（各主题最深档） |
| `--x-bgcolor-1`（工作区） | `theme-1` | `theme-0` 混黑 30% |
| `--x-bgcolor-2..9` | `theme-2..9` | `theme-2..9` |

暗多彩的工作区为什么要「混黑」：彩色梯度没有比 `theme-0` 更深的档，压暗保色相才能让工作区沉于面板之下；
多彩语义要求全域色调浸染，用灰阶幕布会丢掉氛围。

### 组合与叠加规则

| 组合 | 命中块 |
| --- | --- |
| `[dark]` / `[data-dark]` | 暗色块（灰阶反转 + 暗色派生值） |
| `[colorized]` / `[data-colorized]` | 多彩块（实际值改引用 tinted 别名） |
| `[dark][colorized]` / `[data-dark][data-colorized]` / `[dark][data-colorized]` / `[data-dark][colorized]` | 叠加块（暗色 + 多彩映射） |
| `[data-uncolored]` | 无彩块（色彩两键回灰、模式随语境） |

::: warning 叠加要求属性在同一元素
`html[dark]` + 后代 `[data-colorized]` 这种**跨元素**组合**不**命中叠加块——后代只会取亮语境的多彩映射，
看起来像「没跟着暗」。降级手段：给该元素挂 `data-uncolored`（回灰但保留模式）。
:::

<demo html="theme/color-colorized-combo.html"/>

### 实现基础：别名层

模式块各自声明两组别名，实际值只声明「引用别名」：

```css
/* 亮模式块 */
--x-plain-color-0: var(--x-color-gray-9); /* 灰色方向 */
--x-tinted-bgcolor-1: var(--x-color-theme-1); /* 多彩映射 */

/* 暗模式块（全量 !important，用于同元素压过亮块） */
--x-plain-color-0: var(--x-color-gray-0) !important;
--x-tinted-bgcolor-1: color-mix(in srgb, var(--x-color-theme-0), black 30%) !important;

/* 默认态（无属性）取灰色方向 */
--x-color-0: var(--x-plain-color-0);
```

为什么这样做：**自定义属性继承的是解析后的值**，直接声明「引用别名」就压过了继承值（直接声明恒胜继承，与 `!important` 无关）。于是：

- `data-uncolored` 的灰方向自动随最近的模式块（暗语境回暗灰、亮语境回亮灰）；
- `data-colorized` 的多彩映射自动随语境（暗语境取暗多彩映射）。

### 派生层自举

组件消费的是 `--auto-*`（派生层），而派生层的值引用基础调色板。自定义属性的 `var()` 在**声明所在元素**的计算值期替换，
后代继承的已是替换后的值——所以派生层被**同时声明在四个元素域通道的元素自身**上：

```css
[selector], [data-light], [data-dark], [data-colorized], [data-uncolored] {
    --auto-color: var(--x-color-1);
    --auto-bgcolor: var(--x-bgcolor-0);
    …
}
```

否则 `data-dark` 的后代只自举了基层、继承的 `--auto-*` 仍是根域（亮 / 灰）的已替换值，维度切换对组件不可见。
（规模键不进本块：`data-size` 等档位块生成在其后，重新声明会把档位强制回 `medium`。）

### 已知限制 {#known-limits}

- **叠加要求属性同元素**（见上）；
- **非作用域元素上手工挂 `dark` / `colorized`（不带 `data-`）**只命中叠加块、不命中普通暗色 / 多彩块——不对称，既定接受；
- **组件层的字面量规则不随变量走**：如 `alert.less` 里的暗色 `color-mix` 是写死的（已为 `data-light` 补对偶反规则）；
  更深的嵌套矛盾（亮元素里再挂暗元素）组件层兜不住，请走变量层。

---

下一步：[背景色](./color-background.md)。
