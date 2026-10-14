# 尺寸参数

## 概述

界面「密度」由四个**正交**参数控制：`size`（字号 / 行高 / 间距体系）、`radius`（圆角）、`spacing`（内外间距）、`shadow`（阴影）。它们各有一套六档（或五档）变量，经元素属性输出，因此既可以全局设置、也可以局部覆盖。

## 快速入门

```js
themeManager.size = "small"; // 整体收紧
themeManager.radius = "large"; // 圆角
themeManager.spacing = "small"; // 内外间距
themeManager.shadow = "none"; // 阴影
```

```html
<div data-size="x-large" data-radius="none">局部加大字号、去掉圆角</div>
```

## 指南

### 档位与属性

| 参数 | DOM 属性 | 可选档位 | 主要影响变量 |
| --- | --- | --- | --- |
| `size` | `data-size` | `x-small` / `small` / `medium` / `large` / `x-large` | `--auto-font-size`、`--auto-font-weight`、`--auto-line-height`、`--auto-letter-spacing`、`--auto-font`、`--auto-title-font`、`--auto-spacing`/`padding`/`margin`、`--auto-shadow`、`--auto-icon-size` |
| `radius` | `data-radius` | 上述五档 + `none` | `--auto-border-radius` |
| `spacing` | `data-spacing` | 上述五档 + `none` | `--auto-spacing` / `--auto-padding` / `--auto-margin` |
| `shadow` | `data-shadow` | 上述五档 + `none` | `--auto-shadow` |

::: warning `size` 没有 `none` 档
字号没有「归零」语义（`sizeVars` 未定义 `none`）。`radius` / `spacing` / `shadow` 的 `none` 分别是直角 / 零间距 / 无阴影。
:::

### `medium` 是默认态

`medium` 等于「不写属性」——setter 会把属性**移除**而不是写成 `medium`：

```js
themeManager.size = "small"; // 元素得到 data-size="small"
themeManager.size = "medium"; // 元素移回默认（属性被移除）
```

基变量里的默认值就来自 `medium` 档（`--auto-font-size: var(--x-font-size-medium)`），所以「移除属性」与「`medium`」视觉等价。

### 底层档位变量

所有档位来自静态层的基础量，业务样式可以直接引用档位而不是写死数值：

```css
.my-list {
    gap: var(--x-spacing-small);
    font: var(--auto-font); /* 已随 size 档位联动 */
}
```

| 基础量族 | 说明 |
| --- | --- |
| `--x-font-size-*` / `--x-font-weight-*` | 字号 / 字重五档 |
| `--x-line-height-*` / `--x-letter-spacing-*` | 行高 / 字距五档（以 `--x-spacing-medium` 为基准计算） |
| `--x-spacing-*` | 间距六档（含 `none`） |
| `--x-border-radius-*` | 圆角六档（另含 `circle` / `pill` 两个特殊值） |
| `--x-shadow-*` | 阴影六档（暗色下由 `darkShadowVars` 整体替换配方） |
| `--x-icon-size-*` | 图标尺寸五档 |

### 局部覆盖

尺寸块的选择器是「作用域限定式 + 裸属性式」并列（`S[data-size=x-small],[data-size=x-small]`），因此：

- 作用域内的元素用 `data-size` 覆盖本作用域档位；
- **任意元素**上的裸 `data-*` 尺寸属性都会生效——尺寸值与主题色 / 模式无关，所以这种「全局命中」不会产生冲突，只是让局部覆盖更省事。

```html
<aside data-size="small" data-spacing="small">
    <!-- 紧凑侧栏：本子树整体收紧 -->
</aside>
```

### 暗色下的尺寸相关差异

尺寸四维本身与模式无关，但两项派生值会被暗色覆盖：

- `--x-shadow-*` → 黑色系高不透明度（否则深底上看不见）；
- `--auto-input-height` 未定义（见下）。

## 现状与注意事项 {#sync-pitfall}

::: warning 构造期传入的尺寸 / 模式参数不会立即写属性
`size` / `radius` / `spacing` / `shadow` / `dark` / `colorized` 的**属性同步只发生在 setter 与水合路径**。因此：

```js
// ⚠️ 首次不会立即生效：属性没写上去，样式块选不中元素
themeManager.addScope({ id: "compact", elements: ["#compact"], size: "small" });

// ✅ 需要立即生效时，构造后显式赋值一次
const scope = themeManager.addScope({ id: "compact", elements: ["#compact"], size: "small" });
scope.size = "small";
```

同一份参数会被写入持久化，所以下次加载时经水合路径（`_syncPersistedAttrs`）会补齐属性并生效——表现就是「第一次打开只记住，刷新后才看到」。给元素**手写** `data-size` 等属性则可完全绕开这一路径。
:::

::: warning 未接线的变量
- `--auto-input-height` 在尺寸块中指 `var(--x-input-height-{档位})`，但 `--x-input-height-*` 未在基础量中定义，因此该变量当前解析为空；输入框高度实际由 `--auto-line-height`（经字体 / 间距）决定。
- `ThemeOptions.border` 有类型定义但运行时未消费（见[主题作用域](./scope.md#scope-options)）。
:::

---

下一步：[变量体系](./variables.md)。
