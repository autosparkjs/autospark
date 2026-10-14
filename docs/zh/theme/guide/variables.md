# 变量体系

## 概述

主题库的全部能力最终落在 CSS 变量上。理解变量的**分层**，就知道「改哪一层能影响什么」——这也是排查「为什么这里没跟着变」的最快路径。

四层结构（下层引用上层，组件只消费最下层）：

```
① 基础量      --x-color-gray-0..9   --x-font-size-*   --x-spacing-*   --x-border-radius-*   --x-shadow-*
   （静态层）  --x-color-theme-0..9（运行时·主题标尺）  --x-color-{语义}-0..9（运行时·语义标尺）

② 别名层（由亮/暗两个模式块各自声明）
              --x-plain-color-* / --x-plain-bgcolor-*      灰色方向
              --x-tinted-color-* / --x-tinted-bgcolor-*    多彩映射

③ 实际值层    --x-color-0..9   --x-bgcolor-0..9            （引用别名，随模式/色彩切换）

④ 派生层      --auto-*（文字、背景、边框、主色、交互态、面板、输入框…）
   （组件消费）
```

## 指南

### ① 基础量：常量与标尺

| 变量族 | 来源 | 说明 |
| --- | --- | --- |
| `--x-color-gray-0..9` | **静态层** | 灰阶原料（`#FAFAFA` → `#1f1f1f`），与主题无关 |
| `--x-color-theme-0..9` | 运行时 | 主题色标尺；亮色 `0` 最浅、暗色 `0` 最深（方向反转） |
| `--x-color-{name}-0..9` | 运行时 | 语义色标尺（`name` ∈ primary/success/warning/danger/info），方向恒定 |
| `--x-font-size-*` / `--x-font-weight-*` | 静态层 | 字号 / 字重五档 |
| `--x-line-height-*` / `--x-letter-spacing-*` | 静态层 | 行高 / 字距五档 |
| `--x-spacing-*` | 静态层 | 间距六档 |
| `--x-border-radius-*` | 静态层 | 圆角六档（另含 `circle` / `pill`） |
| `--x-shadow-*` | 静态层 / 暗色覆盖 | 阴影六档 |
| `--x-icon-size-*` | 静态层 | 图标尺寸五档 |

::: tip 双真值源边界
灰阶等**与主题无关**的量定义在静态层；主题标尺与语义色**只由运行时注入**——静态层刻意不提供它们的默认值，避免层叠竞争。
:::

### ② 别名层：模式与色彩的语义支点

别名由**模式块**声明（亮 / 暗各一份），数据-属性块只声明「引用别名」：

```css
/* 亮模式块 */
--x-plain-color-0: var(--x-color-gray-9); /* 灰色方向 */
--x-tinted-bgcolor-1: var(--x-color-theme-1); /* 多彩映射 */

/* 暗模式块（全量 !important） */
--x-plain-color-0: var(--x-color-gray-0) !important;
--x-tinted-bgcolor-1: color-mix(in srgb, var(--x-color-theme-0), black 30%) !important;
```

于是 `data-uncolored` / `data-colorized` 的「方向」自动跟随最近的模式块（细节见[显示模式与色彩维度](./mode.md#alias-layer)）。

### ③ 实际值层：`--x-color-*` 与 `--x-bgcolor-*`

这两组是**真正随模式与色彩切换**的颜色，也是业务写自定义样式时最该引用的一组：

| 变量 | 含义 | 亮色 / 暗色 |
| --- | --- | --- |
| `--x-color-0..9` | 前景 / 文字梯度 | 亮色 `0` 最深 → `9` 最浅；暗色相反 |
| `--x-bgcolor-0` | 面板 / 卡片背景（浮起层） | 亮色 `gray-0`；暗色 `gray-8` |
| `--x-bgcolor-1` | 工作区背景（最沉） | 亮色 `gray-1`；暗色 `gray-9` |
| `--x-bgcolor-2..9` | 透明度叠加原料与扩展档 | 整条梯度单调 |

```css
.my-surface {
    background: var(--x-bgcolor-0);
    color: var(--x-color-1);
    border: 1px solid var(--x-color-6);
}
```

### ④ 派生层：组件消费的 `--auto-*`

派生层是「语义命名」层，值与模式强相关，差异集中在变量层（组件层保持模式无关）：

| 分组 | 变量 | 说明 |
| --- | --- | --- |
| **主题色** | `--auto-theme-color` | 主色基准（亮 `theme-5` / 暗 `theme-6`） |
| **语义色** | `--auto-primary-color`、`--auto-success-color`、`--auto-danger-color`、`--auto-warning-color`、`--auto-info-color` | 指向 `--x-color-{name}` |
| **文字** | `--auto-color`、`--auto-text-color`、`--auto-secondary-color`、`--auto-third-color` | 三档正文色（次要 / 辅助） |
| **背景** | `--auto-bgcolor`、`--auto-secondary-bgcolor`、`--auto-third-bgcolor`、`--auto-workspace-bgcolor` | 面板 / 次级 / 内嵌 / 工作区 |
| **交互态** | `--auto-selected-color` / `-bgcolor`、`--auto-hover-color` / `-bgcolor`、`--auto-active-color` / `-bgcolor` | 选中 / 悬停 / 激活（bgcolor 为主色透明叠加） |
| **禁用态** | `--auto-disable-color` / `-bgcolor` | 禁用文字与底色 |
| **边框** | `--auto-border-size`、`--auto-border-color`、`--auto-border`、`--auto-hover-border(-color)`、`--auto-selected-border(-color)`、`--auto-active-border(-color)`、`--auto-disable-border(-color)` | `--auto-border` 是 `1px solid {color}` 速写 |
| **排版** | `--auto-font`、`--auto-title-font`、`--auto-font-family`、`--auto-font-size`、`--auto-font-weight`、`--auto-letter-spacing`、`--auto-line-height` | 随 `size` 档位联动 |
| **面板** | `--auto-panel-header-color`、`--auto-panel-header`、`--auto-panel-header-bgcolor`、`--auto-panel-bgcolor` | 标题栏 / 面板 |
| **外框** | `--auto-border-radius`、`--auto-spacing`、`--auto-padding`、`--auto-margin`、`--auto-shadow` | 随 `radius` / `spacing` / `shadow` 档位联动 |
| **输入框** | `--auto-input-font`、`--auto-input-border`、`--auto-input-bgcolor`、`--auto-input-placeholder`、`--auto-input-padding`、`--auto-input-radius` | 表单外观 |
| **图标** | `--auto-icon-size`、`--auto-icon-{alert,info,success,warning,error,focus}` | 尺寸 + 内置 SVG 图标（data URI，可直接 `mask-image`） |

### 引用建议

| 场景 | 用什么 |
| --- | --- |
| 组件配色（文字 / 背景 / 边框 / 交互态） | `--auto-*`（唯一推荐） |
| 需要比正文更浅 / 更深的一档做层次 | `--x-color-*` 档位 |
| 需要主题色的深浅档（如品牌色浅底） | `--x-color-theme-*` |
| 需要语义色的档位（如 danger 浅底） | `--x-color-{name}-*` |
| 需要固定灰（不随模式 / 色彩变化） | `--x-color-gray-*` |
| 尺寸 / 间距 / 圆角 | `--x-*` 档位量或 `--auto-*` 语义量 |

::: warning 不要做的事
- 不要给 `--auto-*` 硬编码颜色：模式覆盖作用于**基变量**，覆盖派生层会让模式切换失效；
- 不要直接消费 `--x-plain-*` / `--x-tinted-*`：它们是给 `data-*` 属性块用的别名，直接引用会绕过维度切换；
- 不要移除暗色块里的 `!important`：那是「同元素亮 → 暗切换」的级联前提。
:::

### 变量与样式块的对应关系

| 样式标签 id | 内容 | 何时重注入 |
| --- | --- | --- |
| `autospark-{id}-vars` | 基色块、暗色块、多彩 / 无彩、尺寸四维、派生层、暗色派生层 | 连接时一次 |
| `autospark-{id}-colors` | 主题标尺（亮 / 暗两块，含 `color-scheme`） | `themeColor` 或调色板参数变化 |
| `autospark-{id}-semantics` | 语义色（标尺块 + 亮 / 暗块） | 语义色或调色板参数变化 |

注入内容按内容去重：与上次相同时跳过重解析与快照重写。

---

下一步：[内置组件与工具类](./components.md)。
