# 主题要素 · 圆角

## 概述

圆角为面板、按钮、输入框提供统一的圆角语言：基础量 `--x-border-radius-*`、档位开关 `data-radius`、
派生量 `--auto-border-radius`。

```js
themeManager.radius = "large";
```

```html
<div data-radius="none">直角容器</div>
```

<demo html="theme/radius.html"/>

## 指南

### 档位与特殊值

| 变量 | 值 | 说明 |
| --- | --- | --- |
| `--x-border-radius-none` | `none` | 直角 |
| `--x-border-radius-x-small` | `0.2rem` | |
| `--x-border-radius-small` | `0.3rem` | |
| `--x-border-radius-medium` | `0.5rem` | 默认态 |
| `--x-border-radius-large` | `0.8rem` | |
| `--x-border-radius-x-large` | `1rem` | |
| `--x-border-radius-pill` | `9999px` | 胶囊——**不参与档位切换** |
| `--x-border-radius-circle` | `50%` | 正圆——**不参与档位切换**，需搭配正方形容器 |

`pill` / `circle` 只作为基础量存在（标签、头像、图标底座这类形状语义），不进入 `data-radius` 档位表。

### `medium` 是默认态

```js
themeManager.radius = "small"; // 元素得到 data-radius="small"
themeManager.radius = "medium"; // 元素属性被移除，回到默认
```

基变量的默认值就来自 `medium` 档（`--auto-border-radius: var(--x-border-radius-medium)`），
所以「移除属性」与「`medium`」视觉等价。

### 局部换档

```html
<aside data-radius="x-large">这个子树整体大圆角</aside>
```

档位块的选择器是「作用域限定式 + 裸属性式」并列，所以裸 `data-radius` 在任意元素上都生效——
圆角值与主题色 / 模式无关，全局命中不会产生冲突。

### 组合四角

`border-radius` 的四角语法可自由组合，常见形态：

```css
/* 卡片头：只圆顶部两角 */
.card-head {
    border-radius: var(--auto-border-radius) var(--auto-border-radius) 0 0;
}

/* 对角圆 */
.deco {
    border-radius: var(--x-border-radius-large) 0 var(--x-border-radius-large) 0;
}
```

### 尺寸与圆角的观感关系

圆角相同而元素尺寸不同时，观感差异很大：小元素视觉接近直角、大容器更显圆润。
选档建议：小控件用 `x-small` / `small`，大面积容器用 `large` / `x-large`，整站统一时用 `medium`。

---

下一步：[主题要素 · 阴影](./shadow.md)。
