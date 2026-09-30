# x-layout 布局容器

## 概述

参考 ant.design Layout 的声明式布局容器（[ADR-0074](https://github.com/zhangfisher/autospark/blob/main/packages/engine/docs/adr/0074-x-layout.md)）：宿主 `x-layout` 的直接子元素用 `x-pane:参数` 声明**布局窗格**（词表 `header | content | sidebar | footer`），引擎按窗格组合动态生成 CSS Grid 骨架——header/footer 全宽贯穿是缺省态，sidebar 可经 `through` 声明纵向贯穿行带。窗格存在性与 `x-if` / `x-show` 正交配合（回流补位、元素永不重建）；sidebar 默认可折叠、可拖拽调宽；同侧多窗格自动组合 [x-splitter](./x-splitter.md) 守恒分割。

<demo html="layout/basic.html"/>

## 快速入门

最小布局只需 content——其余窗格可选、缺失即不渲染：

```html
<div x-layout style="height: 100vh">
  <div x-pane:header>Header</div>
  <div x-pane:sidebar.left>Sidebar</div>
  <div x-pane:content>Content</div>
  <div x-pane:footer>Footer</div>
</div>
```

<demo html="layout/basic.html"/>

## 指南

### 指令值

x-layout **无值**（宿主声明即启用）。配置经 `x-layout-options`（relaxed-json）与窗格级 `x-pane-options` 两层承载，见[配置选项](#配置选项)。

窗格标记 `x-pane` 是**名位标记**：窗格的收集、剪枝、grid 模板、存在性订阅与行为组合全部由 x-layout 在编译期接管。因此：

- 窗格必须是 x-layout 的**直接子元素**，深层或无 x-layout 祖先的 `x-pane` 无效（warn）；
- 非 `x-pane` 的直接子元素被**编译期剪枝**（warn）；`<template>` / `<script>` 静默容忍；
- `x-pane:content` 必需——缺失 warn + 降级（容器照建、中心区空缺）；
- 嵌套零新机制：窗格内是正常编译子树，可嵌 x-splitter、子 x-layout、任意指令。

### 贯穿（through）

`sidebar` 窗格支持 `through` 声明纵向跨过 header / footer 行带：`"up"`（上延至容器顶、header 推向对侧）、`"down"`（下延至容器底、footer 推让）、`"up,down"`（全贯穿）。**header 全宽是缺省态**——由 sidebar 未声明 through 自然表达，无独立配置。

两种写法等价（修饰符解析期并入选项，[ADR-0007](https://github.com/zhangfisher/autospark/blob/main/packages/engine/docs/adr/0007-directive-options.md)）：

```html
<!-- 修饰符形态 -->
<div x-pane:sidebar.left.up>...</div>
<!-- 选项形态 -->
<div x-pane:sidebar.left x-pane-options="{through:'up,down'}">...</div>
```

through 仅 sidebar 支持（header/footer 上声明 warn + 忽略）；同侧多个 sidebar 时仅 **DOM 首个**有 through 资格。through 是编译期静态——变更需 `engine.patch` 重编。

<demo html="layout/through.html"/>

### 同侧多窗格与窗格分割

同一侧声明多个 sidebar 窗格时按 DOM 序**自动组合 [x-splitter](./x-splitter.md)**（3+ 递归嵌套链）：层内首窗格为定容面板（`width` 选项值或默认 240px 迁移为 `data-size`），其余为自适应面板——拖分隔条**守恒分配**（两窗格反向增减、该侧总宽不变）。

分割窗格有自己的行为通道：调节走分隔条（x-splitter 键盘/拖拽全能力）、折叠走窗格显式 `data-expandable`（[ADR-0070](https://github.com/zhangfisher/autospark/blob/main/packages/engine/docs/adr/0070-x-expandable-compose.md) 的 splitter 通道）——因此分割窗格不再享受下节的默认行为注入，也不吃布局 `gap`（间距由分隔条承载）。

<demo html="layout/splitting.html"/>

### 存在性回流（与 x-if / x-show 配合）

窗格上声明 `x-if` / `x-show` 即获得响应式布局：条件为假时该窗格从布局中**剔除并回流补位**（sidebar 消失 → content 变宽；header 消失 → 中部上移占首行）。

x-pane 不接管两者的语义——`x-show=false` 仍是 `display:none`（DOM 留）、`x-if=false` 仍是标准移除（DOM 摘），x-pane 只在编译期订阅同一表达式驱动 grid 模板重算。**存在性是唯一响应式维度**：through / gap / 尺寸 / 窗格组合均编译期静态。

```html
<div x-pane:sidebar.left x-show="ui.sidebarOpen">...</div>
```

<demo html="layout/splitting.html"/>

### 行为组合（折叠与尺寸调节）

**sidebar 窗格默认可折叠、可调节**，无需显式声明：

- **折叠**：默认注入 [x-expandable](./x-expandable.md)（程序化组合，ADR-0070 先例）——边缘圆把手常驻，把手/动画/事件全走 expandable 原生管线；注入实例为**内部态**（刷新即还原），要状态绑定/持久化请显式写 `x-expandable="路径"`；
- **调节**：默认注入 [x-resize](./x-resize.md)（内缘单方向手柄——left 拖东缘 / right 拖西缘；西缘手柄依赖 x-resize 的 grid item 感知：父容器 `display:grid` 时豁免流内方向降级且免位置补偿，无值 = 纯 DOM 内部态）——拖拽终值 ≤ 折叠阈值（`minSize`，缺省 0）自动翻转为折叠；折叠前最后有效宽度被记忆，把手展开时恢复；
- **显式优先**：窗格显式写 `x-expandable` / `x-resize` 时以显式为准（其 options 全生效）；注入实例的 options 读同元素 `x-expandable-options`——选项与是否显式写指令属性解耦；
- header / footer 显式挂 `x-resize` 合法（auto 轨道跟随元素尺寸）；content 上挂 `x-resize` 无效（warn）——content 轨道是 1fr，元素尺寸被轨道钉死。

<demo html="layout/basic.html"/>

## 配置选项

**宿主级 `x-layout-options`**：

| 配置项  | 默认值 | 修饰符 | 说明                                                     |
| ------- | ------ | ------ | -------------------------------------------------------- |
| `gap`   | `0`    | —      | 相邻窗格间距。number 按 px；string 原样作 CSS `gap` 值（支持 `"8px 16px"` 行列双值形态）。分割容器内部不吃 gap（间距由分隔条承载） |

**窗格级 `x-pane-options`**（写在窗格元素上）：

| 配置项       | 默认值 | 修饰符              | 说明                                                                                                                                       |
| ------------ | ------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `height`     | `64px` | —                   | header/footer 窗格高度（inline，显式优先于样式表；默认值经 CSS 变量 `--autospark-layout-header-height` / `--autospark-layout-footer-height`，直接改 CSS 也生效）。仅 header/footer 认读 |
| `width`      | `240px`| —                   | sidebar 窗格宽度。单窗格侧走 inline（默认值经 `--autospark-layout-sidebar-width`）；分割窗格迁移为 `data-size`。仅 sidebar 认读                          |
| `through`    | —      | `.up` / `.down`     | sidebar 纵向贯穿，值 `"up"` / `"down"` / `"up,down"`；与修饰符等价。仅 sidebar 且仅 DOM 首个生效                                             |
| `expandable` | `true` | —                   | 布尔。`false` 关闭 sidebar 默认折叠注入（opt-out）；要状态绑定请显式写 `x-expandable="路径"`                                                |
| `resize`     | `true` | —                   | 布尔。`false` 关闭 sidebar 默认调宽注入（opt-out）                                                                                          |

未知键 / 无效组合（如 content 上写 height）warn + 忽略该键，其余键照常生效。

## 注意事项

- **`engine.patch` 拒绝落入 x-layout 子树**：x-layout 是 ownsChildren 结构指令（同 x-for / eager x-if），其运行侧结构与模板非同构，patch 命中即 warn 拒绝——动态内容请在窗格内部用常规指令表达。
- **`x-pane:content` 必需**：缺失 warn + 降级渲染（容器照建、中心区空缺），不会抛错。
- **所有窗格 `position:relative`**（引擎注入）——窗格内的绝对定位以窗格为包含块；折叠把手的定位上下文由 x-expandable 自理。
- **默认尺寸可两条路覆盖**：默认 64px / 240px 经 CSS 变量落在窗格元素（改 CSS 变量或直接覆盖窗格 CSS 均生效）；`x-pane-options` 的 height/width 走 inline（显式优先于样式表）。
- **同侧多窗格与 through 互斥面**：through 资格恒在 DOM 首个窗格（收集期定死），与存在性变化无关；首个窗格被剔除后，后续窗格不会继承 through。
- **x-pane 是名位标记**：单独使用（无 x-layout 祖先）仅 warn + 子树照常编译，无结构副作用。
