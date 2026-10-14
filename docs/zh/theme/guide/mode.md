# 显示模式与色彩维度

## 概述

主题库把「外观切换」拆成两个**正交维度**：

| 维度 | 两端 | JS 通道 | 手动通道 |
| --- | --- | --- | --- |
| **显示模式** | 暗色 / 亮色 | `themeManager.dark`（写 `dark` 属性） | `data-dark` / `data-light` |
| **色彩** | 多彩 / 无彩 | `themeManager.colorized`（写 `colorized` 属性） | `data-colorized` / `data-uncolored` |

两个维度可自由组合，且都支持**局部**启用——任意元素裸挂属性即可，不需要建作用域。

## 快速入门

```js
themeManager.dark = true; // 全局暗色
themeManager.colorized = true; // 全局多彩
```

```html
<div data-dark>这块独立暗色</div>
<div data-dark data-colorized>暗色 + 多彩（必须同元素）</div>
<div data-colorized data-uncolored>退灰但保留多彩语境</div>
```

## 指南

### 两条通道的分工

| 通道 | 载体 | 适用 |
| --- | --- | --- |
| **JS setter** | 被附着元素上的 `dark` / `colorized` 属性 | 作用域整体切换，参与参数持久化 |
| **独立样式域** | 任意元素上的 `data-dark` / `data-light` / `data-colorized` / `data-uncolored` | 元素级局部开关，不进持久化 |

```js
themeManager.dark = true; // 给 root 作用域附着的元素写 dark 属性，并持久化 dark: true
document.body.dataset.dark = ""; // 手动通道：body 独立暗色（但 body 在作用域子树内，样式生效）
```

两者长期并存、互不干扰：`dark` 表达「这套作用域现在是暗色」，`data-dark` 表达「这个元素独立启用暗色」。

### `data-light`：在暗语境里切回亮色

没有 `light` 的 JS setter（JS 通道只有 `dark` 布尔开关），但有手动通道属性：

```html
<html data-dark>
    <body>
        <div data-light>深色页面里的亮色卡片（含 color-scheme: light，原生控件也回亮）</div>
    </body>
</html>
```

`data-light` 是**完整亮域**：基色块会一并声明 `color-scheme: light`。

### 组合与叠加规则

| 组合 | 命中块 |
| --- | --- |
| `[dark]` / `[data-dark]` | 暗色块（灰阶反转 + 暗色派生值） |
| `[colorized]` / `[data-colorized]` | 多彩块（实际值改引用 tinted 别名） |
| `[dark][colorized]` / `[data-dark][data-colorized]` / `[dark][data-colorized]` / `[data-dark][colorized]` | 叠加块（暗色 + 多彩映射） |
| `[data-uncolored]` | 无彩块（色彩两键回灰、模式随语境） |

::: warning 叠加要求属性在同一元素
`html[dark]` + 后代 `[data-colorized]` 这种**跨元素**组合**不**命中叠加块——手工挂属性时代即存在，非本次引入。降级手段：给该元素挂 `data-uncolored`（回灰但保留模式）。
:::

### 实现基础：别名层 {#alias-layer}

模式块各自声明两组别名，实际值只声明「引用别名」：

```css
/* 亮模式块 */
--x-plain-color-0: var(--x-color-gray-9); /* 灰色方向（亮：color-0 最深） */
--x-tinted-bgcolor-1: var(--x-color-theme-1); /* 多彩映射（亮：bgcolor-i = theme-i） */

/* 暗模式块（全量 !important，用于同元素压过亮块） */
--x-plain-color-0: var(--x-color-gray-0) !important;
--x-tinted-bgcolor-1: color-mix(in srgb, var(--x-color-theme-0), black 30%) !important;

/* 默认态（无属性）取灰色方向 */
--x-color-0: var(--x-plain-color-0);
--x-bgcolor-0: var(--x-plain-bgcolor-0);
```

为什么这样做：**自定义属性继承的是解析后的值**，直接声明「引用别名」就压过了继承值（直接声明恒胜继承，与 `!important` 无关）。于是：

- `data-uncolored` 的灰方向自动随最近的模式块（暗语境回暗灰、亮语境回亮灰）；
- `data-colorized` 的多彩映射自动随语境（暗语境取暗多彩映射——这修复了「暗语境中多彩元素取不到暗映射」的旧问题）。

### 派生层自举

组件消费的是 `--auto-*`（派生层），而派生层的值引用 `--x-color-*` / `--x-bgcolor-*`（基层）。自定义属性的 `var()` 在**声明所在元素**的计算值期替换，后代继承的已是替换后的值——所以派生层被**同时声明在四个手动通道的元素自身**上：

```css
[selector], [data-light], [data-dark], [data-colorized], [data-uncolored] {
    --auto-color: var(--x-color-1);
    --auto-bgcolor: var(--x-bgcolor-0);
    …
}
```

否则 `data-dark` 的后代只自举了基层、继承的 `--auto-*` 仍是根域（亮 / 灰）的已替换值，维度切换对组件不可见。

### 暗色专属派生值

模式差异集中在变量层，组件层保持模式无关：

| 变量 | 亮色 | 暗色 | 依据 |
| --- | --- | --- | --- |
| `--auto-theme-color` | `theme-5` | `theme-6` | 梯度反转后 theme-5 对比度不足 |
| `--auto-selected-bgcolor` | 主色 20% 透明 | 主色 18% 透明 | 与亮色感知对称（实测 +14.5%） |
| `--auto-disable-color` | `--x-color-8` 混灰 50% | `--x-color-8` 混灰 80% | 暗色保底可辨 |
| `--auto-border-color` | `--x-color-6` | `--x-color-8` | 暗色面板轮廓需提亮（1.5:1 → 1.92:1） |
| `--auto-input-bgcolor` | 面板色 | `--x-bgcolor-1`（工作区，更深） | 凹陷流派 |
| `--x-shadow-*` | 中灰低不透明 | 黑色系高不透明（`darkShadowVars`） | 深底上灰阴影不可见 |

尺寸切换不受影响：尺寸块引用 `--auto-shadow`，暗色只覆盖了 `--x-shadow-*` 基值。

### 已注入的样式块与顺序前提

`_generateBaseStyles()` 产出块的顺序（**顺序即语义**，调整前请先验证）：

```
基色块（light，含 color-scheme: light）
  → 暗色块（color-scheme: dark）
  → 暗色阴影块
  → 多彩块
  → 暗多彩叠加块
  → 无彩块
  → 尺寸 / 圆角 / 间距 / 阴影块
  → 派生层块（四通道自举）
  → 暗色派生层块（同名 !important，靠「后者胜出」覆盖）
```

同特异性（如裸属性与 `:root` 都是 `(0,1,0)`）时靠**生成顺序**与 `!important` 决出胜负；`-colors` / `-semantics` 两个样式标签在 `connect()` 里注入于 `-vars` 之后。

### 作用域约束

| 作用域 | `data-*` 替选择器 |
| --- | --- |
| root（`:host` / `:root`） | 裸属性追加（子树即文档） |
| 局部作用域 | 每个选择器产出「自身 + 后代」两式：`S[data-X]`, `S [data-X]` |

局部作用域的叠加块还额外产出**后代守卫**（`S [data-dark][colorized]`、`S [data-dark][data-colorized]`），其特异性（`0,3,0`）高于本作用域暗色块的 `S [data-dark]`（`0,2,0`，带 `!important`）——没有守卫时，作用域里的 `data-dark + data-colorized` 会被降级为灰。

## 已知限制 {#known-limits}

- **叠加要求属性同元素**（见上）；
- **非作用域元素上手工挂 `dark` / `colorized` 属性**只命中叠加块、不命中普通暗色 / 多彩块——不对称，既定接受；
- **组件层的字面量规则不随变量走**：如 `alert.less` 里的暗色 `color-mix` 是写死的，已为 `data-light` 补对偶反规则；更深的嵌套矛盾（亮元素里再挂暗元素）组件层兜不住，请走变量层。

## 验证

这两条通道有回归测试覆盖（`packages/theme/src/__tests__/scope.test.ts`）：

- 暗色 / 多彩块的受限替选择器（root 裸追加、作用域收敛）；
- `data-light` 追加到基色块、主题标尺块与语义色块；
- 叠加块的 root 四组合与作用域「自身四组合 + 后代守卫」；
- 无彩块内容为 plain 别名引用（且不带 `!important`）；
- 派生层声明覆盖四个手动通道选择器；
- 派生层块置于暗色派生块之前。

视觉与数值层面用 `bun scripts/check-dark-contrast.ts`（对比度）与示例页截图矩阵核对。

---

下一步：[尺寸参数](./size.md)。
