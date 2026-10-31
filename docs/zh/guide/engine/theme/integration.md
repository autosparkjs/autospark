# 与内置组件集成（三级样式回退）

engine 与 plugins 的**内置样式**（内置组件模板、tooltip / 遮罩 / 把手等注入样式）已全面接入本主题库：**引入 theme，内置组件自动换肤**；不引入，也有与 theme 默认值对齐的兜底视觉。全程零配置、零 JS 探测——联动完全靠 CSS 变量解析。机制决策详见 engine 仓库 ADR-0129（`packages/engine/docs/adr/0129-theme-integration.md`，含声明级映射表）。

## 三级回退链

内置样式的每条主题化声明都是一条嵌套回退链：

```css
/* engine 内置 dialog 面板（节选） */
border-radius: var(--auto-border-radius, var(--autospark-overlay-radius, 0.5rem));
border: 1px solid var(--auto-border-color, var(--autospark-overlay-border, #f0f0f0));
background: var(--auto-bgcolor, var(--autospark-overlay-bg, #fff));
```

| 层级 | 变量 | 谁定义 | 何时生效 |
|---|---|---|---|
| 1. 主题令牌 | `--auto-X` | @autospark/theme | theme 在场（引入即换肤） |
| 2. 覆盖变量 | `--autospark-<feature>-X` | 你（任意祖先层级声明） | theme 缺席时 |
| 3. 校准兜底值 | 字面值 | engine/plugins 源码 | 皆无时（≈ theme 默认浅色） |

**严格字面级联**：第一级有值即全赢，不看后面。兜底字面值以 theme 默认参数（blue 预设）的计算值校准——不引入 theme 与引入 theme（默认参数）的渲染基本一致，暗色是 theme 的增值能力。

## 使用场景

### 什么都不装 —— 开箱即用

```html
<script src="autospark.js"></script>
<script src="autospark.notifications.js"></script>
```

渲染校准兜底值（视觉 ≈ theme 默认浅色）。

### 无 theme 的暗色 —— 手挂属性

```html
<html dark>   <!-- 或任意祖先元素 dark / data-dark -->
```

`[dark]` / `[data-dark]` 是 engine 与 theme 共享的公开属性契约。内置样式的视觉声明带暗色兜底变体，theme 缺席时手挂属性即独立呈现暗色。

### 引入 theme —— 自动换肤

```html
<link rel="stylesheet" href="autospark-theme.css" />
<script src="autospark.js"></script>
<script src="autospark.theme.js"></script>
```

全部内置样式跟随主题色、暗色（`themeManager.dark = true`）、多彩、四维度实时变化，无需逐组件接线。

## 定制样式

```css
/* theme 缺席：覆盖变量生效（CSS 继承，任意祖先层级声明皆可） */
:root {
    --autospark-overlay-radius: 12px;
    --autospark-tooltip-bg: #234;
}

/* theme 在场：覆盖变量被第一级遮蔽、写了不生效！两条正道—— */
/* ① 改 theme 参数 */
themeManager.update({ themeColor: "#eb2f96" });
/* ② 更近作用域重定义派生令牌（遮蔽 :root 的 theme 值） */
.my-app {
    --auto-border-radius: 12px;
}

/* z-index 与功能尺寸（drawer 宽、通知最大宽等）恒两级，任何时候直接覆盖 */
:root {
    --autospark-overlay-z: 2000;
}
```

各组件的可覆盖变量以 `--autospark-<feature>-<token>` 命名（`--autospark-overlay-*`、`--autospark-tooltip-*`、`--autospark-notification-*`、`--autospark-tree-*` 等），完整对应关系见 engine ADR-0129 的声明级映射表。

## 暗色兜底变体

内置样式为全部视觉声明追加了 `[dark]` / `[data-dark]` 变体规则：

```css
[dark] [data-overlay][data-overlay-border],
[data-dark] [data-overlay][data-overlay-border] {
    background: var(--auto-bgcolor, var(--autospark-overlay-bg, #606060));
}
```

变体**只切换兜底字面值、不改变量引用链**——你设置的覆盖变量在浅/暗两种模式下都生效；theme 在场时第一级已被 theme 的暗色块重定义，变体只是兜底、不参与竞争。

## 已知边界

- **theme 在场时设 `--autospark-*` 无声不生效**（严格字面级联）——用上文两条正道；
- **部分细节不跟随主题色**：divider、遮罩色、tooltip 暗底、调节手柄、分隔条、滚动条等近似属性保持两级（theme 无对应令牌，不借语义牵强的令牌），但显示模式切换经暗色变体跟随；
- **弹层跟随根作用域**：dialog / drawer / popover 的容器挂在 body 下，跟随 theme 的根作用域——在某个子树上挂 `data-dark` / `data-colorized` 局部样式域，对从那里弹出的弹层**不生效**；
- 涟漪 / 旋噪装饰（x-ripple / x-spin）的色链经内联变量写入，theme 缺席 + 暗色下主色兜底取浅色校准值（暗底仍可辨）。
