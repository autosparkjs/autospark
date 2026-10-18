# 特征与优势

本页把主题库的能力逐条摊开，每条都给出对应的机制与文档入口。想先看效果可以直接 [快速入门](./get-started.md)，想看取舍看[对比评测](./comparison.md)。

## 一、种子派生：一个主题色生成整套变量

**机制**：主题色经 Material 风格色板扩散算法（`@yosulramp/material-color-palette-js` 的 TS 移植）生成 10 阶标尺 `--x-color-theme-0..9`；再向上派生主色、文字三档、背景层次、边框、交互态、禁用态等 `--auto-*` 语义量。

```js
themeManager.themeColor = "green";
```

**优点**：

- 换肤不改组件代码——组件只消费 `--auto-*`；
- 不需要人工维护多套色值，任意自定义色（`#13c2c2`）同样能展开成完整标尺；
- 标尺是公共资产，业务可以直接引用深浅档做自定义层次（如 `var(--x-color-theme-3)`）。

**入口**：[主题色](../guide/color.md)

## 二、语义色梯度化：暗色可读性由机制保证

**机制**（`ADR-0002`）：`success` / `warning` / `danger` / `info` 的值作为**梯度种子**生成 10 阶标尺；亮色直引种子原值（与固定 hex 时代零视觉差异），暗色提亮引用第 3 档（`var(--x-color-{name}-3)!important`）。

```js
themeManager.update({ danger: "#ff4d4f" }); // 传品牌基准色，而不是调浅后的色
```

**优点**：

- 深底上语义色是**提亮**而非「混透明变暗」，实测对比度从 1.6~2.2:1 提升到 4.67~10.93:1（`blue` 主题）；
- 亮色视觉零变化，升级不破坏既有观感；
- `var()` 引用（如默认 `primary: var(--auto-theme-color)`）自动豁免梯度化，语义由主题标尺承担。

**入口**：[语义颜色](../guide/color-semantic.md)

## 三、模式与色彩双维度、四属性、可局部

**机制**：显示模式维度（暗色 ↔ 亮色）与色彩维度（多彩 ↔ 无彩）彼此正交；四条手动通道 `data-dark` / `data-light` / `data-colorized` / `data-uncolored` 允许**任意元素**独立启用，作用域元素上的 `dark` / `colorized` 属性（JS setter 通道）与之并存。

```html
<div data-dark>这一块独立暗色</div>
<div data-colorized data-dark>暗 + 多彩（同元素才算叠加）</div>
```

**优点**：

- 不必为「暗色 × 多彩」写第二套样式：叠加映射由暗色模式块声明，`data-*` 只声明「引用别名」；
- 方向随语境——`data-uncolored` 在暗语境回暗灰、亮语境回亮灰；多彩元素自动取所在语境的映射；
- 局部启用对组件类透明，组件层保持模式无关。

**代价**：叠加态要求两个属性落在**同一元素**（既有语义，见[已知限制](../guide/color-colorized.md#known-limits)）。

**入口**：[明暗主题](../guide/color-dark.md)、[多彩模式](../guide/color-colorized.md)

## 四、作用域：全局与局部同构

**机制**：`ThemeManager` 持有一个 root 作用域（`:host` / `:root`），`addScope(options)` 创建局部作用域；作用域选择器默认 `[data-theme-scope='{id}']`，可经 `cssSelector` / `elements` 定制。

```js
themeManager.addScope({ id: "preview", elements: ["#preview"], themeColor: "magenta" });
```

**优点**：

- 局部作用域的参数、持久化、注入链路与 root 完全同构，学习成本一次付清；
- 作用域边界显式（写进属性），跨作用域裸命中被收敛到子树内，不会错拿别的作用域的梯度；
- 支持 `docRoot` 指向 `shadowRoot`，WebComponent 内同样可用。

**入口**：[局部主题](../guide/local-scope.md)

## 五、四维尺寸：密度可调

**机制**：`size` / `radius` / `spacing` / `shadow` 四个参数各六档，经属性选择器（`[data-size=x-small]` 等）输出；`medium` 为默认态。

**优点**：

- 「紧凑模式」不需要另一套 CSS，改一个参数即可；
- 尺寸可局部覆盖，一个页面里可以同时有宽松主区与紧凑侧栏；
- 尺寸变量（`--x-font-size-*` / `--x-spacing-*` …）本身是公共资产，业务样式可直接引用档位而不是写死数值。

**入口**：[字体](../guide/font.md)、[圆角](../guide/radius.md)、[阴影](../guide/shadow.md)、[间距](../guide/spacing.md)

## 六、持久化与回访零闪

**机制**（`ADR-0003`）：全部作用域的 CSS 合成**样式快照**写入 localStorage；每作用域参数独立持久化。宿主用 head 内阻塞内联片段在首帧前回插快照，运行时启动后重算重写并移除该标签。

**优点**：

- 回访用户零主题闪烁；首访 FOUC 是明确接受的代价（静态层方案已在取舍中否决）；
- **自愈**：每次注入变化全量重写快照、不设版本号——库升级后下一次启动即覆盖旧快照；
- 去重（内容 hash 级比较）把取色器拖动的逐像素事件与 DOM 观察回环收敛为「值真变才写一次」。

**入口**：[持久化与回访零闪](../guide/persistence.md)

## 七、可量化的可读性

**机制**：随包提供对比度校准脚本（`packages/theme/scripts/check-dark-contrast.ts`），与 `src/vars` 变量模块**同源**——变量一改，脚本自动跟随；`color-mix(in srgb)` 按规范复刻，`!important` 与 alpha 合成一并处理。

```bash
cd packages/theme && bun scripts/check-dark-contrast.ts   # 任一 FAIL 退出码 1，可挂 CI
```

**优点**：暗色各档（正文 / 次要 / 主色 / 语义色 / 交互态 / 边框 / 禁用）都有数值兜底，颜色调整不必靠肉眼。

**入口**：[语义颜色 · 对比度验收](../guide/color-semantic.md#contrast-check)

## 八、静态层 + 运行时层可分离

**机制**：reset / 工具类 / 组件类在静态 CSS 里；主题变量由运行时注入。两者可独立使用。

**优点**：

- 不需要换肤的项目只引 CSS 即可，零 JS 成本；
- 需要换肤的项目引入运行时，静态层的组件类自动消费新变量，无需改造；
- 语义色与主题标尺**只**由运行时注入，不存在双真值源竞争。

**入口**：[静态主题包](../guide/static.md)

## 九、工程性

- **TypeScript**：`ThemeOptions` / `DynamicThemeOptions` / `ThemeSize` 等类型随包发布；
- **可测试**：无 DOM 环境下注入降级为 no-op，注入缓存与快照合成仍可断言（仓库内已有 `scope.test.ts` / `persistence.test.ts`）；
- **可导出**：`toStyles()` 取 CSS 字符串，`download()` 直接落盘（root 产物即合规静态主题包，ADR-0006），便于 SSR 或交付静态主题；
- **可观测**：`scope.isConnected()` 检查样式标签是否在位，`scope.cssChunks` 给出该作用域参与快照的 CSS 片段。

---

看完能力清单，接着看[对比评测](./comparison.md)了解它与相邻方案的取舍，或直接[上手](../guide/initial.md)。
