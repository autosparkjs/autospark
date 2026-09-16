# 树形渲染

## 概述

`x-tree` 渲染**嵌套树形数据**——DOM 结构即树（`ul > li > ul > li…`），引擎对展开路径递归套用同一节点模板，内置展开/折叠交互与动画、节点选中、复选级联（半选派生）、拖拽调序、循环变量注入。手写递归 `x-for` + 展开状态管理的复杂度一次清零。

```html
<ul x-tree="node of nodes" x-tree-options="{ defaultExpandLevel: 2 }">
    <li x-tree-node>
        <span class="arrow" x-tree-toggle x-text="$expanded ? '▾' : '▸'"></span>
        <span x-text="node.title"></span>
        <!-- 子节点由引擎递归渲染到这里 -->
        <ul x-tree-children></ul>
    </li>
    <li x-empty>暂无数据</li>
</ul>
```

## 快速入门

<demo html="tree/basic.html"/>

```html
<ul x-tree="node of nodes"></ul>
```

一行即得完整可交互的树：内置默认节点模板（缩进 + 展开箭头 + 节点名）渲染、整行点击展开/折叠、expand 高度过渡动画（展开时后续节点平滑跟进而非瞬跳）全部内置。

自定义节点行时，在容器内写 `x-tree-node` 模板（**唯一会被递归套用的模板**），并用 `x-tree-children` 标记子节点渲染点：

```html
<ul x-tree="node of nodes" x-tree-options="{ defaultExpandLevel: 2 }">
    <li x-tree-node :class="$expanded && 'is-open'">
        <span class="arrow" x-tree-toggle x-text="$leaf ? '' : ($expanded ? '▾' : '▸')"></span>
        <span x-text="node.title"></span>
        <ul x-tree-children></ul>
    </li>
</ul>
```

`x-tree` 宿主的**直接子元素**只认 `x-tree-node`（节点模板）与 `x-empty`（空树状态），其余子元素不会渲染（编译期 warn）。

## 指南

### 节点模板三级优先

节点行的模板按以下优先级解析，与 [x-loading 的组件覆盖](./x-loading.md)机制同构：

1. **原地模板**：容器内的 `<li x-tree-node>`（最常用，所见即所得）；
2. **`tree-node` 组件**：容器内不写 `x-tree-node` 时，引擎沿 scope 链就近查找名为 `tree-node` 的 [x-component](../component.md)（含全局 `components` 兜底）——跨模板复用同一节点模板；
3. **内置默认模板**：缩进 + 箭头 + `nameField` 字段名——零模板开箱即用。

也可以反过来把整棵树包成组件，任意处 `x-use` 复用：

```html
<!-- 一次性定义 -->
<ul x-component="my-tree" x-tree="node of $props.data">
    <li x-tree-node>…<ul x-tree-children></ul></li>
</ul>

<!-- 任意处使用 -->
<div x-use="my-tree" :props="{ data: nodes }"></div>
```

### 展开语义：惰性写回

节点的**有效展开态**按以下规则合成：

```
expandField 字段有值（≠ undefined） → 用该值
否则                              → 层级回退：$level + 1 < defaultExpandLevel
```

- `defaultExpandLevel: N` 即**前 N 层可见**（默认 `1` = 根层可见、根不展开；`2` = 根展开、子层可见）；
- 回退规则**永不写数据**——只有用户点击展开/折叠的那一刻，才把 `!有效值` 写入该节点的 `expandField`（惰性写回）。异步晚到的树数据零时机问题，源数据也只在用户真实交互时才被写入。

```javascript
const state = {
    nodes: [
        { id: 1, name: "文档", children: [...] },        // 无 expand 字段 → 回退规则
        { id: 2, name: "图片", expand: true, children: [...] }, // 显式展开（优先）
        { id: 3, name: "下载", expand: false, children: [...] }, // 显式折叠
    ],
};
```

### 数据格式：嵌套 children

只接受嵌套结构：子节点经 `childrenField`（默认 `"children"`）递归组织；单根 `{...}` 与多根 `[{...}]` 均可（自动归一）——如上方快速入门的组织架构树。平铺数据（数据库查询结果、CSV）请先在数据层转换为嵌套结构再交给 x-tree。

### 循环变量（九元组）

节点模板的求值作用域内自动注入以下变量（`$` 前缀对齐 [x-for 派生变量](./x-for.md)，不占自定义命名空间）：

| 变量        | 含义                                   | 典型用法                          |
| ----------- | -------------------------------------- | --------------------------------- |
| `node`      | 节点数据（自定义变量名，`of` 左侧）     | `x-text="node.title"`             |
| `$level`    | 层级，根 = 0                           | 层级差异化样式、缩进微调          |
| `$children` | 原始子节点数据数组                     | 判断有无子节点                    |
| `$expanded` | **有效展开态**（含回退合成）           | 箭头方向 `:class="$expanded"`     |
| `$leaf`     | 无子节点                               | 叶子不渲染箭头                    |
| `$index` / `$first` / `$last` | 兄弟内序号 / 首末 | 首末行样式            |
| `$parent`   | 父节点数据引用（根为 `null`）          | 面包屑、向上操作                  |
| `$indeterminate` | 复选半选派生态（不落盘；未启用复选恒 `false`） | 半选图标 `x-text="$indeterminate ? '⊟' : '☐'"` |

`$expanded` 是合成值——不必手写 `node.expand ?? $level < 2` 这类回退表达式。

### 交互触点

默认**整行点击**展开/折叠；节点模板内声明了 `x-tree-toggle` 标记后，**仅标记元素**触发（文件树「点箭头展开、点行选中」的语义）：

```html
<li x-tree-node>
    <span class="arrow" x-tree-toggle>▸</span>  <!-- 只有这里触发展开 -->
    <span x-text="node.title"></span>           <!-- 这里不触发 -->
    <ul x-tree-children></ul>
</li>
```

行内其他 `@click`（如删除按钮）请自行 `@click.stop` 阻断冒泡。启用选中（见下节）后整行点击语义变为**选中**，展开恒收窄到 `x-tree-toggle` 标记。

### 节点选中

配置 `selectedField` 即启用（值即选中状态写入的字段名）——**显式声明才启用**，因为它改变整行点击语义（toggle → 选中，VSCode 文件树心智）：

```html
<ul x-tree="node of nodes" x-tree-options="{ selectedField: 'selected' }">
    <li x-tree-node>
        <span class="arrow" x-tree-toggle>▸</span>
        <span x-text="node.title" :class="{ 'is-selected': node.selected }"></span>
        <ul x-tree-children></ul>
    </li>
</ul>
```

- **单选**（默认）：点行 toggle 写回 `selectedField` 并清全树其他选中；再点已选行取消；
- **多选**：`multiSelect: true` 后各行独立 toggle、互不清除；
- 点 `x-tree-toggle` 标记（如箭头）只展开不选中；模板未声明标记时 warn（将无法展开）；
- 选中态经数据驱动渲染——`:class` / `:style` 绑 `node.selected` 即高亮，折叠子树的清选在数据层完成。

### 复选与级联

节点模板内声明 `x-tree-check` 标记（复选触点元素）即启用——勾选状态写入节点的 `checkedField`（默认 `"checked"`）字段，支持三层：

<demo html="tree/check.html"/>

```html
<li x-tree-node>
    <span class="chk" x-tree-check
          x-text="node.checked ? '☑' : ($indeterminate ? '⊟' : '☐')"></span>
    <span x-text="node.name"></span>
    <ul x-tree-children></ul>
</li>
```

- **向下级联**（默认 `cascade: true`）：勾父 → 子孙全勾；取消 → 全消。级联是**数据层写入**——折叠的子树同样生效，展开即见；
- **向上级联**：子勾选变化沿祖先链重算——全部子勾选才置父勾选，部分勾选则父为**半选**；
- **`$indeterminate` 半选是派生值**（注入循环变量），**永不写入节点数据**——UI 态与数据态分离；
- `cascade: false` 关闭级联，各节点独立勾选。

### 拖拽

配置 `draggable: true` 启用（行根自动置 `draggable`）。基于 HTML5 DnD，**三态定位**：鼠标在目标行的**上 1/4** → 移到其前（上边缘线）、**下 1/4** → 移到其后（下边缘线）、**中段** → 收纳为子（高亮 + 落下自动展开）：

<demo html="tree/drag.html"/>

```html
<ul x-tree="node of nodes" x-tree-options="{ draggable: true }">…</ul>
```

- **数据写回**：源节点从原父 `childrenField` 数组移出、按定位插入目标位（`splice`，同父移动自动修正索引偏移），watcher 驱动重渲染；
- **环检测**：拖入自身或自己的子孙 → 拒绝（无落点指示，不允许 drop）；
- **单根数据**（`{...}` 对象）的根行没有兄弟序，仅允许 `inside` 收纳（before / after 拒绝）；
- 指示样式（`.x-tree-drop-before/after/inside`）由引擎注入，可被同名 CSS 覆盖。

### 折叠两态与动画

- **默认 eager**：折叠时子层渲染销毁（省内存，大树友好）；
- **`.keepalive`**（≡ `x-tree-options="{keepalive:true}"`）：折叠仅 `display:none`，子树 DOM 与状态全保留，重展开零成本。

展开/折叠动画以**子容器整体**接入引擎统一动画机制（[animate 选项](../animate.md)）。**默认 `expand`（高度过渡）**——展开时子容器高度从 0 平滑长到内容高度，后续节点平滑跟进而非瞬跳（树的布局连续性诉求）；也可换任意动画名：`animate: 'fade'` / `{name:'slide', duration:300}` / `{enter:'slide', leave:false}` / `false` 关闭——注意 fade/slide 等类名型动画只过渡 transform/opacity（不参与布局），树上后续节点会瞬时跳位。首渲静默、快速连点抢占中断等语义与其他结构指令一致：

```html
<!-- 高度过渡（默认，可省略）；duration / easing 可配 -->
<ul x-tree="node of nodes" x-tree-options="{ animate: { name: 'expand', duration: 300 } }">…</ul>
```

### 事件

交互变化时在宿主上广播冒泡事件（命名对齐 action 广播 `action:<name>` 惯例）：

| 事件           | 时机     | `detail`                    |
| -------------- | -------- | --------------------------- |
| `tree:expand`  | 节点展开 | `{ id, node, level }`       |
| `tree:collapse`| 节点折叠 | `{ id, node, level }`       |
| `tree:select`  | 节点选中（启用 `selectedField`） | `{ id, node, level }` |
| `tree:check`   | 复选切换（启用 `x-tree-check`） | `{ id, node, level, checked }` |
| `tree:drop`    | 拖拽落点（启用 `draggable`）    | `{ source, target, position }`（source/target 各含 `{id, node, level}`，position 为 `before` / `after` / `inside`） |

```html
<ul x-tree="node of nodes" @tree:expand="onExpand($event)" @tree:drop="onDrop($event)">…</ul>
```

`id` 取 `idField` 值（节点无该字段时为 `undefined`）。

### 空态

树数据为**真空数组 `[]`** 时，容器内带 `x-empty` 的子元素渲染（对齐 x-for 惯例；`undefined` 不认领——留给异步加载场景）：

```html
<ul x-tree="node of nodes">
    <li x-tree-node>…</li>
    <li x-empty>暂无数据</li>
</ul>
```

## 配置

`x-tree-options`（relaxed-json；按[指令选项回退](../directive.md)惯例可回退宿主 `x-options`）：

| 配置项               | 默认值      | 说明                                                         |
| -------------------- | ----------- | ------------------------------------------------------------ |
| `idField`            | `"id"`      | 节点唯一标识字段——复用 key 的唯一来源；缺省回退层级路径      |
| `childrenField`      | `"children"`| 子节点字段                                                   |
| `expandField`        | `"expand"`  | 展开状态字段（惰性写回目标）                                 |
| `nameField`          | `"name"`    | 内置默认节点模板显示的字段名                                 |
| `defaultExpandLevel` | `1`         | 前多少层可见（回退规则，不写数据；合法值 ≥ 1）               |
| `keepalive`          | `false`     | 折叠保活子树（display:none），默认 eager 销毁                |
| `animate`            | `'expand'`  | 子容器整体进出场动画（同 [animate 选项](../animate.md)三形态；默认 expand 高度过渡，后续节点平滑跟随） |
| `selectedField`      | 无          | 声明即启用选中（值即字段名）；整行点击 = 选中，展开收窄到 `x-tree-toggle` |
| `multiSelect`        | `false`     | 多选模式（各行独立 toggle，不清其他选中）                    |
| `checkedField`       | `"checked"` | 复选状态写入的字段名（复选由模板声明 `x-tree-check` 标记启用） |
| `cascade`            | `true`      | 复选级联（父→子孙 / 子→祖先重算）；`false` 各节点独立        |
| `draggable`          | `false`     | 启用拖拽（三态定位 + 环检测 + 数据 splice 写回）             |

## 注意事项

- **语法必写 `of`**：`x-tree="node of nodes"`（对齐 x-for，不支持裸路径）；`node, index of nodes` 可自定义序号变量名。
- **容器内的静态内容**（表头、汇总行）不会被渲染——把 `x-tree` 放到内层，静态内容包裹在外层。
- **`:key` 不生效**：节点 key 唯一来源是 `idField`（`:key` 声明 warn 忽略）；无 id 节点回退层级路径作 key（`id` 重复会 warn）。
- **同元素 `x-for`**：两者都是结构指令，同元素声明编译期报错——树本身是列表的超集，不需要组合。
- **子容器内容归引擎管理**：`x-tree-children` 元素内写的静态内容会被清空；模板缺 `x-tree-children` 时 warn 且只渲染一层。
- **表达式数据源**：`x-tree="node of getNodes()"` 这类表达式只有结构变化可响应（表达式订阅收集不到 `expandField` 依赖），展开/折叠请用纯状态路径。
- **超大树**：嵌套结构不支持虚拟滚动——依赖折叠（默认 eager 销毁省内存 / `keepalive` 按需保活）控制 DOM 规模。
- **拖拽单根限制**：单根对象数据的根行无兄弟序，仅允许 `inside` 收纳；需要根层调序请用多根数组数据。
- **选中改变整行语义**：启用 `selectedField` 前请确认模板已声明 `x-tree-toggle`（否则无法展开，引擎 warn 提示）。
