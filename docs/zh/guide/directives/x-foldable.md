# x-foldable 溢出折叠容器

## 概述

溢出折叠容器指令（[ADR-0098](https://github.com/zhangfisher/autospark/blob/main/packages/engine/docs/adr/0098-x-foldable.md)）：`x-foldable` 宿主是一条 **nowrap flex 容器**（`row` / `column`），子元素强制不伸不缩；空间不足时**从主轴末尾起把子元素逐个折入「更多」按钮的弹出面板**，空间恢复时按原序还原。工具栏、面包屑、标签条等「内容多少不确定、宽度受限」的场景。

::: tip 插件指令
`x-foldable` 由官方插件包 `@autospark/plugins` 提供（ADR-0128 核心集外移），使用前须加载插件脚本，且**先于 engine 实例化**：

```html
<script src="/autospark/autospark.js"></script>
<script src="/autospark/autospark.overlay.js"></script>
```

未加载插件时 `x-foldable` 属性会被编译器当作普通属性剥除，指令不生效。`autospark.overlay.js` 同时包含覆盖物家族全部指令（x-dialog / x-popover / x-drawer / x-foldable），加载一次即全家族可用。聚合产物 `autospark.plugins.js` 一个标签包含全部官方插件。
:::

## 快速入门

```html
<div x-foldable="row" class="toolbar">
  <button>保存</button>
  <button>取消</button>
</div>
```

- 子元素强制 `flex-shrink:0`（不伸不缩——伸缩态的主轴尺寸是拉伸布局宽而非自然宽，会使溢出计算失效）；
- 容器变窄时末尾的按钮逐个折入「更多」面板，变宽时自动还原。

宿主宽度来源不限——与 [x-resizable](./x-resizable.md) 同元素组合时，拖拽调节手柄即可直接驱动折叠与恢复（手柄不参与折叠计算）：

<demo html="foldable/resize.html"/>

## 指南

### 指令值

值为**主轴**：裸词 `row` / `column` 按字面量；也可以写**响应式表达式**，状态变化时换轴（折叠中的子元素先复位、再按新轴重算）：

```html
<div x-foldable="dir"><!-- 状态 dir: 'row' | 'column' --></div>
```

表达式结果非 `"column"` 的一切值静默归一 `row`（过渡态不 warn）。

`column` 轴把主轴转为纵向：宿主定高、子元素纵向堆叠，**高度**不足时末尾项折入面板（more 按钮在底部、面板自右侧弹出，省略号图标自动旋转 90° 成竖排）：

<demo html="foldable/column.html"/>

### 溢出折叠与弹出面板

空间不足时按**从末尾往前**的顺序逐个折叠，变宽时**从后折的先还原**（LIFO——恢复是真实放回后复验布局，放不下立即折回，绝不闪跳）；每个被折叠的元素是**真实搬移**进面板（不是副本）——输入框文字、焦点态等控件状态跨开关保留。

- more 按钮（省略号图标）在溢出时出现在宿主**末尾**，未溢出时不占任何空间；
- 面板 **hover 触发**：悬停按钮开面板、离开宽限关闭、移入面板不闪关；键盘聚焦按钮后 Enter / Space 等价开合，Escape 关闭；
- 面板容器默认是 **x-popover 内置外壳**（见下节）——白底、圆角、阴影、**指向箭头**，与 [x-popover](./x-popover.md) 视觉一致；
- `display:none` 的子元素（如 `x-show` 隐藏中）不参与折叠，也不会被折叠判定波及；
- 折叠集合完全动态：子元素增删（`x-for`、`x-if`）、内容尺寸变化都会自动重估。

<demo html="foldable/overflow.html"/>

### 弹出面板与 popover 选项

弹出面板的开关 / 定位 / 动画全权交由 [x-popover](./x-popover.md)（hover 模型）。**引擎不克隆宿主元素作为面板容器**——默认走 popover 内置外壳 `autospark.popover`（自带边框、默认出口与**箭头载体**，锚定模式下箭头默认开启）：

- 折叠子元素挂入面板出口，出口自动打 `autospark-foldable-panel` 类（垂直堆叠布局 + 兜底间距，CSS 变量 `--autospark-foldable-panel-gap` 定制，默认 4px）；
- 宿主类上的样式**不会**延续进面板——面板视觉与工具栏解耦，由 popover 外壳统一承担。

需要调整 popover 行为时，用 `x-foldable-options.popover` **整包透传** `x-popover-options`（用户值优先，未覆盖项保留引擎默认）：

```html
<div x-foldable="row" x-foldable-options="{popover:{arrow:false, delayShow:0}}">
  <!-- 关闭箭头 + 悬停即开 -->
</div>
```

### 自定义 shell

对面板视觉有更高要求（品牌配色、分组标题、脚注等）时，用 `x-foldable-options.shell` 指定一个**自定义外壳组件**替换内置容器。组件要求：

- 提供**默认出口**（裸 `x-slot` 或 `x-slot:default`）——折叠子元素会挂入该出口；
- 建议保留 `.autospark-overlay-arrow` 箭头载体元素（可选；保留则 popover 锚定箭头照常工作，见 [x-popover](./x-popover.md)）；
- 组件经 `options.components` / `x-define` / `engine.registerComponent` 任一通道注册即可，解析走 popover 的 scope 链 + 全局组件表。

<demo html="foldable/shell.html"/>

出口上的 `autospark-foldable-panel` 布局类照常打上（垂直堆叠 + 兜底 gap）；外壳自带同轴样式时按 CSS 优先级自然覆盖。

## 配置选项

**宿主级 `x-foldable-options`**：

| 配置项    | 默认值                   | 修饰符 | 说明                                                                                                                                                                              |
| --------- | ------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shell`   | —（走 popover 内置外壳） | —      | 弹出面板外壳**组件名**（字符串）。指定后以内置组件为容器，组件须提供默认出口（`x-slot`）。非法值 warn + 维持内置外壳                                                              |
| `popover` | —                        | —      | **对象**，整包透传合并进触发按钮的 `x-popover-options`（用户值优先）——可配 `arrow` / `delayShow` / `delayHide` / `at` 等 [x-popover](./x-popover.md) 全量选项。非对象 warn + 忽略 |

## 注意事项

- **容器需要确定的宽度约束**（`width`、父级 flex / grid 约束）：无约束的自由伸展永远不会溢出，折叠机制不会触发。
- **宿主 `min-width`（column 为 `min-height`）由指令写入**（= more 按钮尺寸，写入后不撤）——会覆盖用户同属性的内联声明，请勿在宿主上内联声明 `min-width`。
- **Runtime 类指令的子元素被折叠时运行态重置**：搬移会触发引擎观察器的卸载/重挂（如进行中的 `x-loading` 动画会重开）；普通按钮 / 文本 / 表单控件无感。
- **子元素不提供 flex 伸缩出口**：强制 `grow:0 / shrink:0` 是溢出判据的布局数学前提（伸缩态尺寸污染求和）；弹性布局需求请改子元素自身 `min/max-width` 或移出容器。
- **触发按钮图标走全局 sprite**（`#as-more`）：同名内置图标可被 `x-icons` 注册覆盖（见 [x-icon](./x-icon.md)）；视觉定制经 CSS 变量 `--autospark-foldable-trigger-size`（按钮尺寸，默认 24px）、`--autospark-foldable-trigger-focus`（聚焦轮廓色）。
- **`x-foldable` 名与历史词条无关**：旧「布局块」（组件机制前身）已由 x-define / x-component 承接，初稿「三段分区布局」模型也已废弃（`x-foldable:header` 之类参数形态即误用，warn），三者无承继关系（见 [ADR-0098](https://github.com/zhangfisher/autospark/blob/main/packages/engine/docs/adr/0098-x-foldable.md)）。
