# 主题要素 · 明暗主题

## 概述

显示模式是颜色要素的**第一个开关**：亮色是默认态，暗色经 `dark` 属性（JS 通道）或 `data-dark` 属性（元素域通道）启用。
暗色下前景 / 背景明度标尺互换、主题梯度方向反转，并附带一批暗色专属派生值与暗色阴影配方。

```js
themeManager.dark = true; // 全局暗色
```

```html
<div data-dark>这块独立暗色</div>
<div data-light>暗语境里单独切回亮色</div>
```

<demo html="theme/color-dark-overview.html"/>

## 指南

### 两条启用通道

| 通道 | 载体 | 适用 |
| --- | --- | --- |
| **JS setter** | 被附着元素上的 `dark` 属性 | 作用域整体切换，参与参数持久化 |
| **元素域** | 任意元素上的 `data-dark` / `data-light` | 元素级局部开关，不进持久化 |

```js
themeManager.dark = true; // 给 root 附着的元素写 dark 属性，并持久化 dark: true
document.body.dataset.dark = ""; // 元素域：body 独立暗色
```

两者长期并存、互不干扰：`dark` 表达「这套作用域现在是暗色」，`data-dark` 表达「这个元素独立启用暗色」。

<demo html="theme/color-dark-channels.html"/>

### `data-light`：在暗语境里切回亮色

JS 通道只有 `dark` 布尔开关，没有 `light`；元素域则两端齐全：

```html
<html data-dark>
    <body>
        <div data-light>深色页面里的亮色卡片</div>
    </body>
</html>
```

`data-light` 是**完整亮域**：基色块会一并声明 `color-scheme: light`——暗语境中的亮元素连原生控件
（滚动条、表单控件）也一并回亮。

<demo html="theme/color-dark-light-attr.html"/>

### 暗色改变了什么

| 方面 | 变化 |
| --- | --- |
| `color-scheme` | `dark`（原生控件换暗） |
| 主题梯度 | 反转（`theme-0` 最深、`theme-9` 最浅） |
| 灰方向 | 反转（`--x-plain-*` 由暗模式块声明：`color-0` 最浅、`bgcolor-0` 浮起于 `bgcolor-1`） |
| 背景映射 | 前景与背景分离：面板 `gray-8` 浮起于工作区 `gray-9` |
| 阴影 | 换黑色系高不透明度配方 |
| 派生值 | 见下表 |

<demo html="theme/color-dark-gradient.html"/>

### 暗色专属派生值

| 变量 | 亮色 | 暗色 | 依据 |
| --- | --- | --- | --- |
| `--auto-theme-color` | `theme-5` | `theme-6` | 梯度反转后 `theme-5` 对面板底对比不足 |
| `--auto-selected-bgcolor` | 主色 20% 透明 | 主色 18% 透明 | 与亮色感知对称（实测 +14.5%） |
| `--auto-disable-color` | `--x-color-8` 混灰 50% | 混灰 80% | 深底保底可辨 |
| `--auto-border-color` | `--x-color-6` | `--x-color-8` | 暗色面板轮廓需提亮（1.5:1 → 1.92:1） |
| `--auto-input-bgcolor` | 面板色 | `--x-bgcolor-1`（工作区，更深） | 凹陷流派 |
| `--x-shadow-*` | 中灰低不透明 | 黑色系高不透明 | 深底上灰阴影不可见 |

**组件层永远保持模式无关**——它只写 `var(--auto-*)`，模式差异全部在变量层完成。

<demo html="theme/color-dark-derived.html"/>

### 可读性有量化兜底

暗色各档按 WCAG 对比度校准（正文 ≥ 4.5:1、图形 ≥ 3:1），并随包提供校准脚本：

```bash
cd packages/theme && bun scripts/check-dark-contrast.ts
```

脚本与 `src/vars` 变量**同源**，改完变量直接跑数值回归，任一 FAIL 退出码为 1。

### 与其它维度的关系

模式维度与色彩维度（`data-colorized` / `data-uncolored`）正交、可同元素叠加；
叠加要求属性落在**同一元素**，跨元素组合不命中叠加块。详见[多彩模式](./color-colorized.md)。

---

下一步：[多彩模式](./color-colorized.md)。
