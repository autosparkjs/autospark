# 静态主题包

## 概述

主题库的样式分三层，可独立使用也可叠加：

| 层 | 内容 | 产物 / 入口 |
| --- | --- | --- |
| **静态样式层** | reset、工具类、组件类（`.auto-btn` / `.auto-card` / `.auto-input` …）、灰阶常量、图标、动画 | `dist/index.css`（Less 编译） |
| **运行时主题层** | 主题标尺、语义色、模式 / 色彩 / 尺寸变量、派生层 `--auto-*` | 由 `ThemeManager` 注入 `<style>` |
| **静态主题包** | 11 套写死的主题标尺（`data-theme=blue` 等） | `src/themes/*.less` → `dist/themes/*.css` |

<demo html="theme/static-overview.html"/>

## 指南

### 静态样式层的组成

`src/styles/index.less` 是聚合入口，仅聚合以下六个文件：

```less
@import './reset.less'; // 基础 reset
@import './animates.less'; // 关键帧动画（rotate / spin、.loading）
@import './utils.less'; // 工具类（.auto-border / .auto-title / .auto-text …）
@import './colors.less'; // 灰阶常量（--x-color-gray-0..9）
@import './components.less'; // .autospark-container > .popup
@import './icons.less'; // 图标 data URI（--auto-icon-*）
```

**未**进入聚合入口、需要按需引入的两块：

| 文件 | 内容 |
| --- | --- |
| `src/styles/input.less` | Firefox 焦点框微调 |
| `src/components/index.less` | 组件类：`card` / `button` / `alert` / `closeable` / `input` |

```js
// 全量引入（示例页与文档 demo 的做法）
import "…/dist/index.css"; // 聚合入口
import "…/src/styles/input.less";
import "…/src/components/index.less";
```

`package.json` 的 `build:css` 脚本只编译聚合入口：

```bash
lessc src/styles/index.less dist/index.css
```

因此 `dist/index.css` **不含**组件类与 `input.less`；需要它们时在项目侧单独引 Less 源文件，或自行补一条编译命令。

<demo html="theme/static-style-layer.html"/>

### 语义色与主题标尺只在运行时

这是刻意划的边界：

- `colors.less` 只定义**灰阶**（`--x-color-gray-0..9`）——与主题无关的常量；
- 主题标尺（`--x-color-theme-*`）与语义色（`--x-color-{name}` / `-{name}-*`）**只由 `ThemeScope` 运行时注入**。

> 若静态层再给一份默认值，会在层叠中与运行时注入形成**双真值源竞争**。

### 静态主题包：11 套预设

`src/themes/*.less` 提供 11 个静态主题文件：
`blue` / `cyan` / `dark` / `green` / `lime` / `magenta` / `orange` / `purple` / `red` / `volcano` / `yellow`。
用法是给元素挂属性：

```html
<html data-theme="blue">…</html>
```

每个文件声明 `color-scheme` 与一整套 `--x-color-theme-0..9`，**但方向与声明并不统一**：

| 声明 `color-scheme: light`（`theme-0` 最浅） | 声明 `color-scheme: dark`（`theme-0` 最深） |
| --- | --- |
| `cyan` / `green` / `lime` / `orange` / `yellow` | `blue` / `dark` / `magenta` / `purple` / `red` / `volcano` |

::: warning 用前先看方向
静态主题文件是按各自使用场景生成的历史产物：在亮语境里引一份「`theme-0` 最深」的文件，背景取到的是最深档。
使用前请核对它的 `color-scheme` 声明与色阶方向。
:::

<demo html="theme/static-presets.html"/>

### 静态预设 vs 运行时预设

| | 静态主题文件 | 运行时预设表（`themeManager.presets`） |
| --- | --- | --- |
| 清单 | 见上（无 `gold` / `geekblue` / `techblue`，多 `yellow` / `dark`） | `blue` / `red` / `volcano` / `orange` / `lime` / `gold` / `green` / `cyan` / `geekblue` / `techblue` / `purple` / `magenta` |
| 色阶来源 | 构建期写死的 hex | 运行时按算法从种子派生 |
| 切换方式 | 改 `data-theme` 属性（或加载对应 CSS） | `themeManager.themeColor = name` |
| 适用 | 完全不经运行时的消费者 | 需要运行时换肤的消费者 |

**两者正交一致**：运行时把 `themeColor` 设为 `"dark"` 时，注入的标尺块特异性更高、接管 `data-theme=dark` 的静态规则，
并按暗色规则反转——无需修复，也不会互相干扰。

### 与运行时层的层叠顺序

建议静态层先加载、运行时注入在后：

```html
<link rel="stylesheet" href="/path/to/@autospark/theme/dist/index.css" />
<!-- 之后才是模块脚本，运行时注入的变量规则位于静态规则之后 -->
<script type="module" src="/app.js"></script>
```

理由：静态层提供的是**布局与外观规则**，运行时提供的是**变量**；让变量规则位于其后，层叠更稳。

### 只引静态层的场景

不需要动态换肤时，完全可以不引运行时：

- 用静态主题包固定在某一套标尺；
- 组件类会消费 `--auto-*` 默认值——注意派生层是由**运行时**注入的，不引运行时时需要自带一份语义变量
  （或直接使用静态主题包 + 自己定义少量 `--auto-*`）。

::: tip 需要完整外观又不想引运行时？
用 `ThemeScope.toStyles()` 在构建期取产物落盘，或浏览器端 `themeManager.root.download()` 直接下载合规静态主题包（带指纹头、与 CLI 产物逐字节一致）——见[下载主题](./download.md)。
:::

---

下一步：[下载主题](./download.md)。
