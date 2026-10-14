# 主题色

## 概述

主题色（theme color）是整套界面变量的**种子**。它不直接参与渲染，而是派生出 10 阶主色标尺 `--x-color-theme-0..9`，标尺再向上派生出主色、交互态、背景层次等语义量。本章讲主题色的取值、标尺方向、调色板形态参数与关闭方式。

## 快速入门

```js
import { themeManager } from "@autospark/theme";

themeManager.themeColor = "purple"; // 预设名
themeManager.themeColor = "#13c2c2"; // 任意色值
themeManager.themeColor = "light"; // 关闭主题色
```

## 指南

### 预设主题 {#presets}

`themeManager.presets` 是预设表（`presetThemes`），共 12 个：

| 名称 | 标题 | 种子色 |
| --- | --- | --- |
| `blue` | 拂晓蓝 | `#1677ff` |
| `red` | 薄暮 | `#f5222d` |
| `volcano` | 火山 | `#fa541c` |
| `orange` | 日暮 | `#fa8c16` |
| `lime` | 青柠 | `#a0d911` |
| `gold` | 金盏花 | `#faad14` |
| `green` | 极光绿 | `#52c41a` |
| `cyan` | 明青 | `#13c2c2` |
| `geekblue` | 极客蓝 | `#2f54eb` |
| `techblue` | 科技蓝 | `#3fb3ff` |
| `purple` | 酱紫 | `#722ed1` |
| `magenta` | 法式洋红 | `#eb2f96` |

```js
Object.entries(themeManager.presets).forEach(([name, { color, title }]) => {
    console.log(name, title, color); // 可直接渲染成色板选择器
});
```

### 自定义色值

任何能被解析的颜色都可用作种子：`#RGB` / `#RRGGBB` / `#RRGGBBAA`（忽略 alpha）/ `rgb()` / `rgba()` / 常见命名色。不可解析的输入会回退黑色（对齐 `@ant-design/fast-color` 的容错行为），因此建议先自行校验。

```js
themeManager.themeColor = "rgb(19, 194, 194)";
```

传给 setter 的值会被**规范化**后写入作用域选项：预设名解析为预设 hex，其他色值经 `toRGBString` 归一化为 hex。

```js
themeManager.themeColor = "purple";
themeManager.themeColor; // "#722ed1"（预设名已被解析）
```

::: tip 同时会写 DOM 属性
setter 会给被附着的元素写 `data-theme="{解析后的 hex}"`（`"light"` 则移除该属性）。这样「属性通道」与「JS 通道」始终一致，也便于调试与 SSR 输出。
:::

### 主色标尺：方向随模式

`--x-color-theme-0..9` 是主题色派生出的 10 阶标尺，**方向随显示模式翻转**：

| 模式 | 生成方式 | `theme-0` | `theme-9` |
| --- | --- | --- | --- |
| 亮色 | 正常序 | **最浅** | 最深 |
| 暗色 | `reverse: true` | **最深** | 最浅 |

原因：亮色下背景取浅档、文字取深档；暗色下明度关系反转，同一套映射（`bgcolor-i = theme-i`）才能继续成立。所以「暗色下主色比亮色浅」是设计结果——`darkDerivedVars` 还把 `--auto-theme-color` 从 `theme-5` 提到 `theme-6`，保证深底上的对比度。

标尺是**公共资产**，业务可直接引用做自定义层次：

```css
.my-panel {
    background: var(--x-color-theme-2);
    border: 1px solid var(--x-color-theme-4);
}
```

### 调色板形态参数

两档参数控制标尺的「疏密」与「鲜艳度」，可在构造时传，也可运行时经 `update()` 修改（`in` 判断，传 `undefined` 即重置为默认）：

| 参数 | 默认 | 含义 |
| --- | --- | --- |
| `seedLightnessGap` | `1.7` | 梯度相邻档间的最小明度递减间隔（越大档间越疏） |
| `chromaBoostCap` | `1.25` | 非种子档彩度缩放倍率上限（`< 1` 可压低饱和度） |

```js
themeManager.update({ seedLightnessGap: 2.2, chromaBoostCap: 1.1 });
```

修改后主色标尺与语义色标尺会**一起重注入**（两者共用生成参数）。

### 关闭主题色：`"light"`

```js
themeManager.themeColor = "light";
```

此时：

- 不注入主题标尺（`--x-color-theme-*` 不出现在产物里）；
- 不注入该段的 `color-scheme` 声明（暗色的 `color-scheme: dark` 改由基础变量块承担）；
- 已附着元素上的 `data-theme` 属性被移除。

适合「只用灰阶、不要品牌色」的界面。

### 作用域级主题色

每个作用域有**自己的**主题色，互不影响：

```js
const scope = themeManager.addScope({ id: "preview", themeColor: "green" });
scope.themeColor = "#13c2c2"; // 只影响本子树
```

作用域的标尺规则只由「本作用域选择器 + `[dark]` / `[data-dark]`」构成，**不依赖 DOM 上的 `data-theme` 属性**——所以局部作用域切主题色时不会与全局标尺串味（这是曾经的一个 bug，见 `scope.test.ts` 的回归用例）。

### 静态预设主题（另一条通道）

`src/themes/*.less` 提供不经运行时的静态预设：给元素挂 `data-theme=blue` 即得该套色阶。注意这些文件各自的方向与 `color-scheme` 声明**并不统一**：

| 声明为 light | 声明为 dark |
| --- | --- |
| `cyan` / `green` / `lime` / `orange` / `yellow` | `blue` / `dark` / `magenta` / `purple` / `red` / `volcano` |

声明为 light 的按「`theme-0` 最浅」书写，声明为 dark 的按「`theme-0` 最深」书写。与运行时预设表的差异（`gold` / `geekblue` / `techblue` 只在运行时预设里）也值得注意。详见[静态样式层与预设主题](./static.md)。

---

下一步：[语义色](./semantic.md)。
