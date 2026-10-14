# 名词解释

本页解释文档里反复出现的核心术语。读[快速入门](./get-started.md)遇到不熟悉的词，可随时回这里查阅。

## 颜色

### 主题色（theme color）

整套界面的**色相种子**——一个颜色值（预设名或任意 CSS 颜色），库据此派生 10 阶主色标尺 `--x-color-theme-0..9`（0 最深、9 最浅），再向上派生出主色、交互态等语义量。

```js
themeManager.themeColor = "purple"; // 预设名
themeManager.themeColor = "#13c2c2"; // 任意色值
themeManager.themeColor = "light"; // 关闭主题色（不注入标尺）
```

_Avoid_：把主题色理解成「某个固定 hex 常量」——它是种子，标尺是派生物。

### 语义色（semantic color）

操作结果的语言：`primary`（品牌 / 主操作）、`success`、`warning`、`danger`、`info` 五色。

它们的值是**梯度种子**：库会生成同系 10 阶标尺 `--x-color-{name}-0..9`，亮色直引种子原值、暗色提亮引用第 3 档（`ADR-0002`）。因此自定义语义色时应传**品牌基准色**，而不是已经调浅的色。

_Avoid_：固定色值、覆盖色（旧机制词汇）。

### 梯度 / 标尺（gradient / scale）

由种子色扩散出的 10 档同系颜色（`0` 最浅 → `9` 最深，与 `palette.less` 色系惯例同向）。三处用到：

| 标尺 | 来源 | 用途 |
| --- | --- | --- |
| `--x-color-theme-0..9` | 主题色 | 主题色派生的语义量上游 |
| `--x-color-{name}-0..9` | 语义色 | 语义色在两种模式下的取档来源 |
| `--x-color-gray-0..9` | 静态层常量 | 灰阶（无彩方向的原料） |

## 显示模式与色彩维度

### 暗色（dark）

显示模式维度之一——前景 / 背景明度标尺互换、主题色梯度方向反转的深色呈现。两条启用通道并存：

- **JS 通道**：`themeManager.dark = true`，写入作用域元素上的 `dark` 属性；
- **手动通道**：任意元素挂 `data-dark`，独立启用暗色（即便祖先不是暗色）。

_Avoid_：黑色主题；把 `data-theme=dark` 当显示模式——`data-theme` 是**主题色**维度（预设主题名）。

### 亮色（light）

显示模式维度另一端——灰色方向的完整亮域（含 `color-scheme: light`，原生控件一并回亮），是**无属性时的默认态**。`data-light` 用于在暗语境中把某个元素单独切回亮色。

_Avoid_：无亮色通道（旧认知）；JS setter 通道只有 `dark` 开关，没有 `light` 开关。

### 多彩（colorized）

与暗色对等的**显示模式维度**——灰阶幕布换为主题色浸染的色阶，可与暗色叠加。两条通道同样并存：`themeManager.colorized = true`（作用域元素上的 `colorized` 属性）与元素裸挂 `data-colorized`。

映射由**语境模式块**声明（亮：`bgcolor-i = theme-i`；暗：`bgcolor-1 = theme-0 混黑 30%`），因此暗语境里的多彩元素自动取暗映射。

_Avoid_：彩色模式、染色、仅作用域可启用（旧认知）。

### 无彩（uncolored）

色彩维度另一端——色彩两键回灰、模式随语境（`data-uncolored`）。灰的方向由最近的模式块决定：暗语境回暗灰、亮语境回亮灰。也是「整体多彩、但某元素要退灰」的降级手段。

_Avoid_：灰度模式（整域灰度滤镜，非本机制）、反染色。

### 独立样式域（data-* 手动通道）

模式维度（`data-light` / `data-dark`）与色彩维度（`data-colorized` / `data-uncolored`）构成的**四属性手动通道**：任意元素裸挂属性即可独立启用对应样式域，与作用域元素上的 `dark` / `colorized`（JS setter 通道）长期并存。

实现基础是模式块声明的别名层 `--x-plain-*`（灰色方向）/ `--x-tinted-*`（多彩映射）。

_Avoid_：手动通道（旧称，已扩展为四属性）、`data-theme=dark`。

## 作用域

### 主题作用域（ThemeScope）

一套完整主题参数的载体：选择器（作用到哪些元素）、主题色、模式、四维尺寸、持久化开关。`ThemeManager` 内部持有一个 **root 作用域**（选择器 `:host` / `:root`，即整篇文档），`addScope()` 创建的则是**局部作用域**。

局部作用域的三段式：`addScope()` 创建 → 元素挂 `data-theme-scope="{id}"`（`attach()` / `autoAttach` 自动完成）→ 该子树命中作用域选择器，样式对「自身 + 后代」生效。

_Avoid_：把 scope 理解为「样式表」——它是参数载体，样式是它的输出。

### 作用域边界与继承

作用域选择器默认是 `[data-theme-scope='{id}']`（也可用 `cssSelector` / `elements` 自定义与扩展）。作用域内的元素继承作用域变量；未覆盖 `--auto-*` 的地方自然读取最近作用域的值——这就是「就近生效」。

## 尺寸

### 尺寸维度（size / radius / spacing / shadow）

四个正交参数，各六档（`none` / `x-small` / `small` / `medium` / `large` / `x-large`）：

| 参数 | 作用 |
| --- | --- |
| `size` | 字号、字重、行高、字距、图标、控件高度（无 `none` 档） |
| `radius` | 圆角 |
| `spacing` | 内外间距、内边距、外边距 |
| `shadow` | 阴影档位 |

`medium` 是默认态，等于「不写属性」；局部覆盖用元素上的 `data-size` / `data-radius` / `data-spacing` / `data-shadow`。

## 持久化

### 样式快照（styles snapshot）

全部已连接作用域生成的 CSS 合成的**单一字符串**，持久化在 localStorage（`{storageKey}-styles`）。回访时由恢复片段在首帧前回插，运行时启动后重算重写实现**自愈**——过期快照的最坏结果与无持久化现状等价，故不设版本机制。

_Avoid_：版本化快照、JSON 信封、静态主题层。

### 参数持久化（scope params）

每个作用域的用户可感参数（主题色 / 暗色 / 多彩 / 四尺寸）按作用域独立持久化（`{storageKey}-scope-{id}`）。语义色与调色板参数属宿主级定制，**不入快照**。

### 恢复片段（restore snippet）

宿主粘贴在 `<head>` 的**阻塞内联脚本**：读样式快照插入 `<style id="autospark-theme-restore">`，赶在首帧前把用户主题还原；运行时 root 作用域接管后自动移除该标签。

_Avoid_：restore.js 外链、库自动注入。

## 组件层

### 输入控件（auto-input）

表单输入的统一外观入口。**单一类名承载两种形态**（`ADR-0001`），形态由宿主标签决定：

- **元素形态**：标注在 `input` / `select` / `textarea` 上，承载完整输入外观（`checkbox` / `radio` / `range` 的定制只存在于此形态）；
- **容器形态**：标注在 `div` 等布局元素上，用于组合复杂输入（前后缀、字段标签、选择类组合），内部表单元素一律裸化。

_Avoid_：`input-wrapper`、输入框包装器。

### 操作件（auto-input-action）

容器形态内的前后缀操作元素（按钮、图标），位置由 DOM 顺序决定。

_Avoid_：addon、前后缀、附加物。

### 字段标签（容器内 label）

容器形态内的 `label` 元素：与选择控件组合时表达选项并联动状态，与文本输入组合时表达字段名。与操作件的分工是——字段标签回答「这是什么」，操作件回答「能做什么」。

_Avoid_：行内标签、addon 文本。

---

术语清楚了，前往[快速入门](./get-started.md)动手实践；需要逐个参数细节时看[指南](../guide/initial.md)。
