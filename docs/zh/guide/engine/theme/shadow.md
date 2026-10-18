# 主题要素 · 阴影

## 概述

阴影表达**层级**：浮起的卡片、弹层、下拉面板靠它拉开与背景的距离。
基础量 `--x-shadow-*`、档位开关 `data-shadow`、派生量 `--auto-shadow`。

```js
themeManager.shadow = "large";
```

```css
.floating-panel {
    box-shadow: var(--auto-shadow);
}
```

<demo html="theme/shadow-overview.html"/>

## 指南

### 六档配方

| 变量 | 亮色配方 |
| --- | --- |
| `--x-shadow-none` | `none` |
| `--x-shadow-x-small` | `0 1px 2px hsl(240 3.8% 46.1% / 6%)` |
| `--x-shadow-small` | `0 1px 2px hsl(240 3.8% 46.1% / 12%)` |
| `--x-shadow-medium` | `0 2px 4px hsl(240 3.8% 46.1% / 12%)` |
| `--x-shadow-large` | `0 2px 8px hsl(240 3.8% 46.1% / 12%)` |
| `--x-shadow-x-large` | `0 4px 16px hsl(240 3.8% 46.1% / 12%)` |

档位越高，模糊半径与不透明度同时上升——所以 `x-small → x-large` 读起来是「越浮越高」。

<demo html="theme/shadow-scale.html"/>

### 暗色换配方

深底上中灰阴影几乎不可见，因此暗块（`darkShadowVars`）把整组配方替换为**黑色系高不透明度**：

| 变量 | 暗色配方 |
| --- | --- |
| `--x-shadow-x-small` | `0 1px 2px hsl(0 0% 0% / 35%)` |
| `--x-shadow-small` | `0 1px 2px hsl(0 0% 0% / 45%)` |
| `--x-shadow-medium` | `0 2px 4px hsl(0 0% 0% / 50%)` |
| `--x-shadow-large` | `0 2px 8px hsl(0 0% 0% / 55%)` |
| `--x-shadow-x-large` | `0 4px 16px hsl(0 0% 0% / 60%)` |

暗块还会一并**自举** `--auto-shadow`：非根元素上的 `data-dark` 若不重新声明它，继承到的会是根域已替换的亮阴影值，
暗阴影对组件不可见。尺寸档位块生成在暗阴影块之后（同特异性后者胜出、`data-shadow` 带 `!important`），
所以「暗色 + 换档」两者都能正常工作。

<demo html="theme/shadow-dark.html"/>

### 阴影与边框的分工

| 表达 | 用什么 | 场景 |
| --- | --- | --- |
| 浮起 | `box-shadow: var(--auto-shadow)` | 卡片、弹层、下拉面板 |
| 描边 | `border: var(--auto-border)` | 内嵌分区、表格、输入框 |

暗色下面板轮廓容易发虚（约 1.5:1），因此暗色既提亮了边框色、又换上暗阴影配方——
「描边 + 阴影」双信号表达层级。内置 `.auto-card` 默认无边框（靠阴影浮起），加 `border` 类才显示边框。

### 局部换档

```html
<div data-shadow="none">扁平子树</div>
```

`data-size` 也会换 `--auto-shadow`（尺寸档位含阴影档）；同时挂 `data-size` 与 `data-shadow` 时后者胜出
（档位块带 `!important`）。

<demo html="theme/shadow-local-scope.html"/>

---

下一步：[主题要素 · 间距](./spacing.md)。
