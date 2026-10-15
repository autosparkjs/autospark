# 组件变量 · 交互反馈

## 概述

四态反馈（hover / active / selected / disable）各有独立的一组变量（`-color` / `-bgcolor` / `-border`），
值由主题色与基础调色板派生——换主题色、切模式都自动跟随，组件层不必写任何条件分支。

```css
.item:hover {
    color: var(--auto-hover-color);
    background: var(--auto-hover-bgcolor);
    border: var(--auto-hover-border);
}
```

<demo html="theme/component-feedback.html"/>

## 指南

### 四态的配方

| 态 | 颜色来源 | 底色 |
| --- | --- | --- |
| hover | `--auto-theme-color` | 主色 15% 透明叠加 |
| active | `--x-color-theme-8`（更深一档） | 主色 15% 透明叠加 |
| selected | `--auto-theme-color` | 主色 20% 透明叠加（暗色 18%，感知对称） |
| disable | 文字色混灰（暗色混灰比例更高） | `currentColor` 20% 透明 |

| 变量族 | 成员 |
| --- | --- |
| hover | `--auto-hover-color` / `-bgcolor` / `-border-color` / `-border` |
| active | `--auto-active-color` / `-bgcolor` / `-border-color` / `-border` |
| selected | `--auto-selected-color` / `-bgcolor` / `-border-color` / `-border` |
| disable | `--auto-disable-color` / `-bgcolor` / `-border-color` / `-border` |

`--auto-{态}-border` 是 `1px solid {态边框色}` 速写；默认态用 `--auto-border`。

### 为什么用透明叠加而不是实色

底色是「主色 + 透明」，因此：

- 叠在任意背景上都自然（面板、次级块、多彩幕布）；
- 亮 / 暗切换时无需为每个态各写一套色值；
- 选中态能与背景保留层次关系（实色会「挖掉」背景）。

暗色下这四态的**档位与不透明度**由 `darkDerivedVars` 重算：主色提一档（`theme-5 → theme-6`）、
底色百分比与亮色保持一致（实测感知对称 +14.5%）。组件层永远只写 `var(--auto-hover-*)` 这类引用。

### 列表项的典型实现

```css
.item {
    color: var(--auto-color);
    background: var(--auto-bgcolor);
    border: 1px solid transparent;
    border-radius: var(--auto-border-radius);
    transition: all 0.15s;
}
.item:hover {
    color: var(--auto-hover-color);
    background: var(--auto-hover-bgcolor);
}
.item:active {
    color: var(--auto-active-color);
    background: var(--auto-active-bgcolor);
    border: var(--auto-active-border);
}
.item.selected {
    color: var(--auto-selected-color);
    background: var(--auto-selected-bgcolor);
    border: var(--auto-selected-border);
}
.item:disabled,
.item.disabled {
    color: var(--auto-disable-color);
    background: var(--auto-disable-bgcolor);
    cursor: not-allowed;
}
```

### 禁用态与 `disabled` 属性

原生 `disabled` 元素（按钮、输入框）由静态样式层处理；自定义控件用 `.disabled` 类 +
`--auto-disable-*` 变量表达同一观感。`--auto-disable-color` 在暗色下会提高混灰比例，保证深底上仍可辨。

---

下一步：[元素域](./element-scope.md)。
