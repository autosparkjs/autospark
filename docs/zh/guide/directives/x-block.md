# x-block 溢出折叠容器

## 概述

溢出折叠容器指令（[ADR-0098](https://github.com/zhangfisher/autospark/blob/main/packages/engine/docs/adr/0098-x-block.md)）：`x-block` 宿主是一条 **nowrap flex 容器**（`row` / `column`），子元素默认不伸不缩；空间不足时**从主轴末尾起把子元素逐个折入「更多」按钮的弹出面板**，空间恢复时按原序还原。工具栏、面包屑、标签条等「内容多少不确定、宽度受限」的场景。

与 [x-layout](./x-layout.md) 分工：x-layout 管整页 Grid 骨架，x-block 管行内溢出折叠。

<demo html="block/basic.html"/>

## 快速入门

```html
<div x-block="row" class="toolbar">
  <strong data-grow>标题——吸收剩余空间</strong>
  <button>保存</button>
  <button>取消</button>
</div>
```

- 子元素默认 `flex-grow:0` / `flex-shrink:0`（不伸不缩）——空间不足**不压缩、折叠**；
- `data-grow` 声明弹性元素（上例标题），空间富余时吸收剩余空间；
- 容器变窄时末尾的按钮逐个折入「更多」面板，变宽时自动还原。

<demo html="block/basic.html"/>

## 指南

### 指令值

值为**主轴**：裸词 `row` / `column` 按字面量；也可以写**响应式表达式**，状态变化时换轴（折叠中的子元素先复位、再按新轴重算）：

```html
<div x-block="dir"><!-- 状态 dir: 'row' | 'column' --></div>
```

表达式结果非 `"column"` 的一切值静默归一 `row`（过渡态不 warn）。

### 伸缩比值（data-grow / data-shrink）

两个契约属性**独立直通** CSS `flex-grow` / `flex-shrink`：

| 写法 | 含义 |
| --- | --- |
| `data-grow` | `flex-grow:1`——吸收剩余空间 |
| `data-grow="2.5"` | `flex-grow:2.5`——显式比值 |
| `data-grow="0"` | 显式关闭（回退默认） |
| `data-shrink` | `flex-shrink:1`——允许收缩（默认全体 `0` 不收缩） |

- 两属性互相独立、**无隐含**：只写 `data-grow` 的元素空间不足时不会收缩（shrink 仍为 0），而是照常被折叠——需要「弹性中柱」请同时写 `data-grow data-shrink`；
- **无豁免类别**：任何子元素（含 grow 元素）都可能被折叠，没有「永不折叠」标记；
- 非法/负值 warn 一次 + 回退 `1`；
- 属性变化即时生效（`data-grow="2"` → `1` 之类改写会触发重排重估）。

<demo html="block/basic.html"/>

### 溢出折叠与弹出面板

空间不足时按**从末尾往前**的顺序逐个折叠，变宽时**从后折的先还原**（LIFO，恢复判定 `scroll + gap + 缓存宽度 ≤ 可用宽` 才放回，绝不闪跳）；每个被折叠的元素是**真实搬移**进面板（不是副本）——输入框文字、焦点态等控件状态跨开关保留。

- more 按钮（省略号图标）在溢出时出现在宿主**末尾**，未溢出时不占任何空间；
- 面板 **hover 触发**：悬停按钮开面板、离开宽限关闭、移入面板不闪关；键盘聚焦按钮后 Enter / Space 等价开合，Escape 关闭；
- 面板外壳 = **宿主元素的浅克隆**（见下节）——宿主类上的 gap、后代选择器样式在面板内原样生效；
- `display:none` 的子元素（如 `x-show` 隐藏中）不参与折叠，也不会被折叠判定波及；
- 折叠集合完全动态：子元素增删（`x-for`、`x-if`）、伸缩比值变化、内容尺寸变化都会自动重估。

<demo html="block/overflow.html"/>

### 面板外壳（宿主克隆壳）

弹出面板的「骨架」不是内置组件，而是**宿主元素自身的浅克隆**（只带标签与属性、不带子节点），加上 `autospark-block-panel` 标识类与一个插槽出口。这意味着：

- 宿主 class 上的样式规则（`.toolbar { gap: 8px; border: ... }`）同时命中面板——面板与容器视觉一致，面板内子元素沿用同一套后代选择器样式；
- 指令自身的痕迹（`x-block`、指令选项、绑定类属性）会被清洗，不会在面板上二次生效；
- 面板默认带底色 / 边框 / 阴影兜底（`config.border` 语义同 [x-popover](./x-popover.md)），宿主类的同名规则可覆盖。

不需要克隆语义时，用 `x-block-options.shell` 指定一个自定义外壳组件（须提供默认插槽出口），视觉责任随之转移给该组件。

## 配置选项

**宿主级 `x-block-options`**：

| 配置项 | 默认值 | 修饰符 | 说明 |
| --- | --- | --- | --- |
| `shell` | 宿主克隆壳 | — | 弹出面板外壳**组件名**（字符串）。指定后替换默认宿主克隆壳，组件须提供默认出口（`x-slot`）。非法值 warn + 回退克隆壳 |

## 注意事项

- **容器需要确定的宽度约束**（`width`、父级 flex / grid 约束）：无约束的自由伸展永远不会溢出，折叠机制不会触发。
- **宿主 `min-width`（column 为 `min-height`）由指令写入**（= more 按钮尺寸，写入后不撤）——会覆盖用户同属性的内联声明，请勿在宿主上内联声明 `min-width`。
- **Runtime 类指令的子元素被折叠时运行态重置**：搬移会触发引擎观察器的卸载/重挂（如进行中的 `x-loading` 动画会重开）；普通按钮 / 文本 / 表单控件无感。
- **克隆壳继承宿主的静态样式**：宿主内联 `width` / 固定高也会被克隆——需要不同宽度的面板请走 `shell` 自定义外壳。
- **触发按钮图标走全局 sprite**（`#as-more`）：同名内置图标可被 [x-icons](./x-icons.md) 注册覆盖；视觉定制经 CSS 变量 `--autospark-block-trigger-size`（按钮尺寸，默认 24px）、`--autospark-block-trigger-focus`（聚焦轮廓色）。
- **`x-block` 名与历史词条无关**：旧「布局块」（组件机制前身）已由 x-define / x-component 承接，初稿「三段分区布局」模型也已废弃（`x-block:header` 之类参数形态即误用，warn），三者无承继关系（见 [ADR-0098](https://github.com/zhangfisher/autospark/blob/main/packages/engine/docs/adr/0098-x-block.md)）。
