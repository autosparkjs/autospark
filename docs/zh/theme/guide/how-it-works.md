# 工作原理

## 概述

主题库不存任何一套写死的皮肤。给它**一个主题色**，它在浏览器里按 Material 风格色板扩散算法算出四份调色板，合成「基础调色板」，再由基础调色板派生出整套 `--auto-*` 语义变量供组件消费。

```text
主题色（种子，唯一必填输入）
  → ① 主题调色板 + 反转主题调色板       算法生成，随输入色的亮度自动适配
  → ② 灰度调色板 + 反转灰度调色板       静态灰原料的两个方向
  → ③ 基础调色板 --x-color-* / --x-bgcolor-*   按 dark / colorized 选择上述哪一份
  → ④ 派生变量 --auto-*（边框 / 面板 / 表单 / 文字 / 交互态 …）
```

因此「换主题」的成本是**改一个值**，而不是替换一套样式表：

```js
import { themeManager } from "@autospark/theme";

themeManager.themeColor = "#722ed1"; // 任意色值（或预设名）→ 整套变量重算
themeManager.dark = true; // 换基础调色板：dark 版
themeManager.colorized = true; // 换基础调色板：多彩映射（可与 dark 叠加）
```

<demo html="theme/how-it-works-overview.html"/>

## 指南

### 一、主题色是唯一输入

`themeColor` 接受预设名（12 个）或任意可解析的色值。它**不直接参与渲染**——只作为梯度种子：

```js
themeManager.themeColor = "purple"; // 预设名 → 解析为 #722ed1
themeManager.themeColor = "rgb(19, 194, 194)"; // 任意色值 → 归一化为 hex
themeManager.themeColor = "light"; // 关闭主题色（只用灰阶）
```

被附着元素的 `data-theme` 属性会同步写入解析后的 hex，方便调试与 SSR 输出。

### 二、Material 风格色板扩散算法

生成逻辑在 `src/utils/createPrimaryPalette.ts`（Material Design 色板算法的 TypeScript 实现，LCH / CIEDE2000 色彩空间）：

| 步骤 | 做什么 |
| --- | --- |
| 1 | 种子色 → HSL → **LCH**（亮度 / 彩度 / 色相，感知均匀空间） |
| 2 | 在 19 组 Material 基准色板中取 **CIEDE2000 色差最小**的一组作为骨架 |
| 3 | 以种子替换骨架中「最近档」的值，其余 9 档按该骨架的**明度 / 彩度系数**扩散 |
| 4 | 每档明度受 `seedLightnessGap` 约束逐档递减（保证单调），彩度按 `chromaBoostCap` 放大 |

为什么这样能得到「任意主题色都比较理想」的效果：

- **明度是骨架给的，不是种子给的**——种子只贡献色相与彩度位置，梯度本身沿用基准色板验证过的明暗节奏，所以深蓝与亮黄都能得到可读的 10 档；
- **感知均匀空间里算**——明度差在 LCH 里等距，肉眼看到的档距才均匀；
- **单调性有硬约束**——`maxLightness` 逐档递减，杜绝「中间某档比相邻档更亮」的脏梯度。

两档形态参数可在构造作用域时传，也可运行时经 `update()` 改（`in` 判断，传 `undefined` 重置）：

| 参数 | 默认 | 含义 |
| --- | --- | --- |
| `seedLightnessGap` | `1.7` | 梯度相邻档间的最小明度递减间隔（越大档间越疏） |
| `chromaBoostCap` | `1.25` | 非种子档彩度缩放倍率上限（`< 1` 压低饱和度） |

```js
themeManager.update({ seedLightnessGap: 2.2, chromaBoostCap: 1.1 });
```

<demo html="theme/how-it-works-diffusion.html"/>

### 三、四份调色板

| 调色板 | 变量 | 来源 | 说明 |
| --- | --- | --- | --- |
| 主题调色板 | `--x-color-theme-0..9` | 算法生成 | 亮语境：`0` 最浅 → `9` 最深 |
| 反转主题调色板 | 同名（暗块内） | 同一算法 `reverse` | 暗语境：`0` 最深 → `9` 最浅 |
| 灰度调色板 | `--x-color-gray-0..9` | 静态层常量 | 与主题无关的固定灰原料 |
| 反转灰度调色板 | `--x-plain-*`（暗块内） | 静态层常量 + 方向声明 | 暗语境的灰方向（`color-0` 最浅、`bgcolor-0` 浮起） |

「反转」不是把色值倒序，而是**方向语义的互换**：亮色下背景取浅档、文字取深档；暗色下明度关系反过来，同一套映射（`bgcolor-i = theme-i`）才能继续成立。

<demo html="theme/how-it-works-palettes.html"/>

### 四、基础调色板：`dark` / `colorized` 两个开关

模式块（亮 / 暗各一份）各自声明两组**别名**，基础调色板只声明「引用别名」：

| 别名 | 含义 |
| --- | --- |
| `--x-plain-color-*` / `--x-plain-bgcolor-*` | 灰色方向（`data-uncolored` 引用） |
| `--x-tinted-color-*` / `--x-tinted-bgcolor-*` | 多彩映射（`data-colorized` 引用） |

```css
/* 亮模式块 */
--x-plain-color-0: var(--x-color-gray-9); /* 亮：color-0 最深文字 */
--x-tinted-bgcolor-1: var(--x-color-theme-1); /* 亮：bgcolor-i = theme-i */

/* 暗模式块 */
--x-plain-color-0: var(--x-color-gray-0) !important;
--x-tinted-bgcolor-1: color-mix(in srgb, var(--x-color-theme-0), black 30%) !important;

/* 基础调色板：默认态引用灰方向 */
--x-color-0: var(--x-plain-color-0);
--x-bgcolor-0: var(--x-plain-bgcolor-0);
```

于是「四种颜色模式」只是同一份变量在四个属性组合下的取值：

| 颜色模式 | 属性 | 基础调色板取值 |
| --- | --- | --- |
| light | 无属性 / `data-light` | 亮灰方向 |
| light + colorized | `data-colorized` | 亮多彩映射 |
| dark | `dark` / `data-dark` | 暗灰方向 |
| dark + colorized | `data-dark data-colorized`（须同元素） | 暗多彩映射 |

::: tip 为什么用别名层
自定义属性继承的是**解析后的值**：直接声明「引用别名」就压过了继承值（直接声明恒胜继承，与 `!important` 无关）。所以 `data-uncolored` / `data-colorized` 的「方向」能自动跟随最近的模式块，不必为四种组合各写一套变量。细节见[明暗主题](./color-dark.md)与[多彩模式](./color-colorized.md)。
:::

<demo html="theme/how-it-works-modes.html"/>

### 五、派生层：组件只消费 `--auto-*`

基础调色板之上是**语义命名**层，组件与业务样式只引用它：

```css
.my-panel {
    background: var(--auto-bgcolor); /* ← --x-bgcolor-0 */
    color: var(--auto-color); /* ← --x-color-1 */
    border: var(--auto-border); /* ← 1px solid --x-color-6 */
    box-shadow: var(--auto-shadow);
    padding: var(--auto-padding);
    border-radius: var(--auto-border-radius);
}
```

这层是「换主题不用改组件」的实现终点：主题色 / 模式 / 色彩 / 尺寸任一维变化，都只改基础量，派生层与组件自动跟随。

<demo html="theme/how-it-works-derived.html"/>

### 六、其它要素同构

字体 / 段落 / 圆角 / 阴影 / 间距走的是**同一套三层结构**，只是「种子」换成了固定档位、开关换成了 `data-*` 属性：

| 要素 | 基础量（五/六档） | 档位开关 | 派生量（组件消费） |
| --- | --- | --- | --- |
| 字体 | `--x-font-size-*` / `--x-font-weight-*` | `data-size` | `--auto-font-size` / `--auto-font-weight` / `--auto-font` |
| 段落 | `--x-line-height-*` / `--x-letter-spacing-*` | `data-size` | `--auto-line-height` / `--auto-letter-spacing` |
| 圆角 | `--x-border-radius-*`（含 `pill` / `circle`） | `data-radius` | `--auto-border-radius` |
| 阴影 | `--x-shadow-*`（暗色换配方） | `data-shadow` | `--auto-shadow` |
| 间距 | `--x-spacing-*` | `data-spacing` | `--auto-spacing` / `--auto-padding` / `--auto-margin` |

```html
<!-- 与颜色模式同款的「元素域」用法：局部换档，不影响全局 -->
<div data-size="x-small" data-radius="none" data-dark>紧凑的暗色面板</div>
```

<demo html="theme/how-it-works-isomorphism.html"/>

### 小结：主题要素清单

| 要素 | 输入 | 输出 |
| --- | --- | --- |
| **颜色** | 主题色（1 个） + 模式 / 色彩开关 | 四份调色板 → 基础调色板 → 颜色类 `--auto-*` |
| **字体** | `size` 档位 | 字号 / 字重 / 字体族 / 行高 / 字距 |
| **段落** | `size` 档位 | 行高 / 字距（随字体联动） |
| **圆角** | `radius` 档位 | `--auto-border-radius` |
| **阴影** | `shadow` 档位 | `--auto-shadow`（暗色另换配方） |
| **间距** | `spacing` 档位 | `--auto-spacing` / `--auto-padding` / `--auto-margin` |

颜色之外的要素各有专章：[主题要素 · 颜色](./color.md) 六节、[字体](./font.md)、[圆角](./radius.md)、[阴影](./shadow.md)、[间距](./spacing.md)。

### 变量的分层

```text
① 基础量      --x-color-gray-*   --x-font-size-*   --x-spacing-*   --x-border-radius-*   --x-shadow-*
              --x-color-theme-0..9（运行时·算法生成）   --x-color-{语义}-0..9（运行时）
② 别名层      --x-plain-* / --x-tinted-*（亮 / 暗模式块各声明一份）
③ 基础调色板  --x-color-0..9 / --x-bgcolor-0..9（引用别名，随模式与色彩切换）
④ 派生层      --auto-*（组件消费）
```

排查「为什么这里没跟着变」时按这四层往下找：组件没跟 → 看它消费的是不是 `--auto-*`；`--auto-*` 没变 → 看它引用的基础调色板有没有被模式 / 色彩切换；基础调色板没变 → 看属性挂在了哪个元素上（继承的是解析后的值）。

---

下一步：[主题要素 · 颜色](./color.md)。
