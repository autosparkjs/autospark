# 主题变量速查与合规规则（theme-vars）

@autospark/theme 是 CSS 变量驱动的主题库，变量分两层。组件样式**只消费变量、不产字面值**（兜底位除外）。

## 目录

- [变量两层结构](#变量两层结构)
- [--auto-* 语义变量全表](#auto-语义变量全表)
- [--x-* 基础标尺](#x-基础标尺)
- [三级回退链写法](#三级回退链写法)
- [暗色与显示模式](#暗色与显示模式)
- [尺寸变体惯例](#尺寸变体惯例)

## 变量两层结构

| 层 | 形态 | 用途 |
|---|---|---|
| `--x-*` 基础层 | 标尺梯度（`--x-font-size-small`、`--x-spacing-medium`、`--x-color-theme-5`…） | 主题引擎内部派生用；组件**一般不直取**（语义层没覆盖时才用） |
| `--auto-*` 语义层 | 按用途命名的派生变量（`--auto-color`、`--auto-bgcolor`、`--auto-border`…） | **组件消费的主入口**——主题切换/暗色/多彩时自动跟随 |

规则：组件样式优先取 `--auto-*`；`--x-*` 只有在语义层确实没有对应物（如尺寸梯度）时才直取。

注意变量来源分两层：静态 CSS（`autospark-theme.css`）只含 `--x-*` 基础标尺与部分 `--auto-*`；**完整语义层（含 `--auto-primary-color` 等语义色）由 theme 运行时（`autospark.theme.js`）注入**——demo 页须双引才能看到完整主题化效果（见 registration.md）。

## --auto-* 语义变量全表

来源 `packages/theme/src/vars/derived.ts`（值省略，均为对 `--x-*` 的引用组合）：

**语义色**：`--auto-primary-color` / `--auto-success-color` / `--auto-danger-color` / `--auto-warning-color` / `--auto-info-color` / `--auto-theme-color`

**交互态**（注意：这些变量自身带 `!important`，用于状态类样式）：
- 选中：`--auto-selected-color` / `--auto-selected-bgcolor` / `--auto-selected-border-color` / `--auto-selected-border`
- 悬停：`--auto-hover-color` / `--auto-hover-bgcolor` / `--auto-hover-border-color` / `--auto-hover-border`
- 按下：`--auto-active-color` / `--auto-active-bgcolor` / `--auto-active-border-color` / `--auto-active-border`
- 禁用：`--auto-disable-color` / `--auto-disable-bgcolor` / `--auto-disable-border-color` / `--auto-disable-border`

**文字**：`--auto-color`（正文）/ `--auto-text-color` / `--auto-secondary-color`（次要，25% 透明）/ `--auto-third-color`（辅助，45% 透明）

**背景**：`--auto-bgcolor`（面板实色）/ `--auto-secondary-bgcolor`（次级）/ `--auto-third-bgcolor`（内嵌）/ `--auto-workspace-bgcolor`（工作区）

**边框**：`--auto-border-size` / `--auto-border-color` / `--auto-border`（速写）

**排版**：`--auto-font`（速写）/ `--auto-font-family` / `--auto-font-size` / `--auto-font-weight` / `--auto-letter-spacing` / `--auto-line-height` / `--auto-title-font` / `--auto-text`

**面板**：`--auto-panel-header` / `--auto-panel-header-color` / `--auto-panel-header-bgcolor` / `--auto-panel-bgcolor`

**规模速写**：`--auto-border-radius` / `--auto-spacing` / `--auto-padding` / `--auto-margin` / `--auto-shadow` / `--auto-icon-size`

**输入控件**（做表单类组件时）：`--auto-input-font` / `--auto-input-border` / `--auto-input-bgcolor` / `--auto-input-placeholder` / `--auto-input-padding` / `--auto-input-radius` / `--auto-input-height`

## --x-* 基础标尺

做尺寸/间距梯度时直取（`--auto-*` 规模速写只有 medium 一档）：

| 维度 | 变量模式 | 档位 |
|---|---|---|
| 字号 | `--x-font-size-*` | x-small / small / medium / large / x-large |
| 字重 | `--x-font-weight-*` | 同上（200→600） |
| 间距 | `--x-spacing-*` | 同上（0.4rem→1.2rem） |
| 圆角 | `--x-border-radius-*` | 同上 + none / circle / pill |
| 阴影 | `--x-shadow-*` | 同上 |
| 图标 | `--x-icon-size-*` | 同上 |
| 主题色阶 | `--x-color-theme-*` | 0..9（0 浅 9 深） |
| 灰阶 | `--x-color-*`（数字） | 0..9 |

## 三级回退链写法

每个消费语义变量的声明都写成三级回退（ADR-0129）：

```css
.asc-<name> {
    /* ① 主题在场吃 --auto-*；② 使用者设了 --asc-<name>-* 覆盖变量吃它；③ 都没有吃兜底字面值 */
    color: var(--auto-color, var(--asc-<name>-color, #606060));
    background: var(--auto-secondary-bgcolor, var(--asc-<name>-bg, rgba(245, 245, 245, 0.45)));
    border-radius: var(--auto-border-radius, var(--asc-<name>-radius, 0.5rem));
}
```

- 兜底字面值取 theme 默认（blue 主题 light）校准值——从现役组件（button.html）抄基准
- `--asc-<name>-*` 前缀是使用者覆盖通道，命名可按组件语义自定义（`-bg` / `-color` / `-radius`…）
- 语义色底上的白字**不是变量映射**（恒定设计）：`color: var(--asc-<name>-primary-color, #fff)`

## 暗色与显示模式

暗色兜底变体成对写两条选择器（作用域 `dark` 属性 + 独立样式域 `data-dark` 属性两通道），**只切兜底字面值，变量链不变**：

```css
[dark] .asc-<name>,
[data-dark] .asc-<name> {
    background: var(--auto-secondary-bgcolor, var(--asc-<name>-bg, rgba(129, 129, 129, 0.45)));
    color: var(--auto-color, var(--asc-<name>-color, #fafafa));
}
```

- 暗色兜底值用 theme 默认暗色校准值（提亮版：白字 #fafafa、面板色更深）
- **不需要**为暗色重写整份样式——主题在场时 `--auto-*` 自动跟随暗色；暗色块只兜「无主题 + data-dark」的场景
- 局部模式：任意元素裸挂 `data-dark` / `data-light` / `data-colorized` / `data-uncolored` 即独立切换样式域，组件无需感知

## 尺寸变体惯例

变体数据落内层元素、`:has()` 驱动宿主（化身路径约束，见 template-anatomy.md）：

```css
/* size 档位直取 --x-* 标尺 */
.asc-<name>:has(> .asc-<name>-inner[data-size="sm"]) {
    font-size: var(--x-font-size-small);
    padding: 0.125rem 0.625rem;
}
.asc-<name>:has(> .asc-<name>-inner[data-size="lg"]) {
    font-size: var(--x-font-size-large);
    padding: 0.5rem 1.25rem;
}
```

md（medium）即基础样式，不写变体块；x-small/x-large 按需补。type 变体（primary/success/danger…）取对应 `--auto-*-color` 语义变量。

demo 中验证暗色最简单的方式：demo 容器上裸挂 `data-dark` 属性。
