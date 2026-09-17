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

用五步从零搭出上例——数据怎么准备、每个标记做什么、样式怎么控制，逐步展开：

### 第 1 步：准备树数据

x-tree 只接受**嵌套结构**：每个节点是一个对象，子节点放在 `children` 字段（字段名可经 `childrenField` 定制）下递归组织。以组织架构为例：

```javascript
const state = {
    nodes: [
        // 多根：数组里每个对象是一棵根；单根对象 { ... } 也可（自动归一）
        {
            id: "admin",                        // idField：节点唯一标识（复用/事件都靠它）
            name: "行政中心",                    // 显示字段（自定义模板中随便用）
            children: [                          // 子节点：递归嵌套，层级即嵌套深度
                { id: "admin-hr", name: "人力资源部" },
                { id: "admin-fin", name: "财务部" },
                // 叶子节点连 children 都可以省略——没有子字段就是叶子
            ],
        },
        { id: "mkt", name: "市场中心", children: [ /* … */ ] },
    ],
};
new AutoSparkSpaces.AutoSpark(el, state); // state 即响应式数据源
```

要点：

- **数据即树**：嵌套深度就是层级，不需要额外的 parentId / level 字段；
- `id` 建议必写（复用、`tree:*` 事件的 `detail.id`、拖拽都依赖它；缺省回退层级路径）；
- `expand`（可定制 `expandField`）**初始不用写**——默认展开态由 `defaultExpandLevel` 选项回退，只有用户点击展开/折叠时才写入该字段（惰性写回，详见指南「展开语义」）；
- 数据可以后到（异步加载）：`nodes` 为 `undefined` 时引擎不认领空态，数据到位自动渲染。

### 第 2 步：一行渲染（内置默认模板）

```html
<ul x-tree="node of nodes"></ul>
```

`x-tree="node of nodes"`——`of` 左侧自定义节点变量名（模板里用 `node.xxx` 读字段），右侧是状态路径。容器内**不写任何子元素**时，引擎套用内置默认节点模板：缩进 + 展开箭头 + `nameField` 字段名（默认 `"name"`），整行点击展开/折叠，高度过渡动画——零配置开箱即用。

### 第 3 步：自定义节点模板（x-tree-node / x-tree-children）

节点行的样式自己控制时，在容器内声明节点模板——**唯一会被递归套用到每一层的模板**：

```html
<ul x-tree="node of nodes" x-tree-options="{ defaultExpandLevel: 2 }">
    <li x-tree-node>
        <span class="arrow" x-tree-toggle x-text="$leaf ? '·' : ($expanded ? '▾' : '▸')"></span>
        <span class="name" x-text="node.name"></span>
        <ul x-tree-children></ul>   <!-- 子节点渲染点：缺了它只渲染一层 -->
    </li>
</ul>
```

- `x-tree-node`（容器**直接子元素**）：声明「这是节点模板」——根层、子层、孙层全部套用这同一个 `<li>`，`node` 在每层指向当前节点；
- `x-tree-children`（模板内）：标记**子节点渲染到这里**——引擎把下一层行递归渲染进这个元素，DOM 结构即树（`ul > li > ul > li…`）；
- 宿主的直接子元素只认 `x-tree-node` 与 `x-empty`（空态模板），其余不渲染（编译期提示）。

### 第 4 步：控制缩进与样式

**缩进不需要算**——它由 DOM 嵌套天然承担：每层子容器叠一份水平 padding，层级越深缩进越深。给 `x-tree-children` 元素写 CSS 即可：

```html
<ul x-tree-children style="list-style: none; margin: 0; padding-left: 22px"></ul>
```

每层 22px；想全局调整可提取 CSS 变量（`padding-left: var(--tree-indent, 22px)`）。行内样式完全归你的 class/CSS 管，引擎不注入任何行样式；需要按层级差异化（不同层级不同图标/字号）时用循环变量 `$level`：`:class="'lv-' + $level"`。

### 第 5 步：展开触点（x-tree-toggle）

默认**整行点击**展开/折叠；声明 `x-tree-toggle` 后收窄为**仅标记元素**触发——本例点箭头展开、点行名不误触：

```html
<span class="arrow" x-tree-toggle>▸</span>   <!-- 只有这里触发展开 -->
```

行内其他 `@click`（如删除按钮）自行 `@click.stop` 阻断冒泡。更进一步的交互——勾选级联（`x-tree-check`）、节点选中（`selectedField`）、拖拽（`draggable`）——见[指南](#指南)各章节与[标记一览](#标记一览)。

### 总结

- **数据**：嵌套 children 递归组织，`id` 唯一、`expand` 不用预写；
- **模板**：`x-tree-node` 一处声明全层套用，`x-tree-children` 定子层渲染点；
- **样式**：缩进 = 子容器 CSS `padding-left` 叠加，行样式归自己的 class，`$level` 可做层级差异化；
- **交互**：`x-tree-toggle` 收窄展开触点，进阶交互见指南。

## 指南

### 节点模板三级优先

节点行的模板按以下优先级解析，与 [x-loading 的组件覆盖](./x-loading.md)机制同构：

1. **原地模板**：容器内的 `<li x-tree-node>`（最常用，所见即所得）；
2. **`tree-node` 组件**：容器内不写 `x-tree-node` 时，引擎沿 scope 链就近查找名为 `tree-node` 的 [x-component](../component.md)（含全局 `components` 兜底）——跨模板复用同一节点模板；
3. **内置默认模板**：缩进 + 箭头 + `nameField` 字段名——零模板开箱即用（见下节）。

也可以反过来把整棵树包成组件，任意处 `x-use` 复用：

```html
<!-- 一次性定义 -->
<ul x-component="my-tree" x-tree="node of $props.data">
    <li x-tree-node>…<ul x-tree-children></ul></li>
</ul>

<!-- 任意处使用 -->
<div x-use="my-tree" :props="{ data: nodes }"></div>
```

### 一行渲染（内置默认模板）

容器内不写任何子元素，引擎套用内置默认节点模板——每级缩进 20px、展开箭头（随展开旋转）、`nameField` 字段名（默认 `"name"`，可定制），**整行点击展开/折叠**（启用选中后点行 = 选中并展开，antd 心智）、expand 高度动画、前 N 层可见全部内置。**全部交互也能零模板启用**——`checkedField` 声明即启用复选（默认模板自动带三态触点 ☑/⊟/☐）、`selectedField` 声明即启用选中、`draggable` 即启用拖拽：

<demo html="tree/builtin.html"/>

```html
<!-- 容器是空的：一个 x-tree 即得「勾选级联 + 选中 + 拖拽 + 展开动画」全家桶 -->
<ul
    x-tree="node of nodes"
    x-tree-options="{ defaultExpandLevel: 2, checkedField: 'checked', selectedField: 'selected', draggable: true }"
></ul>
```

内置默认模板适合原型、后台管理侧栏等标准场景；行内布局/图标/徽标有定制需求时，写自定义节点模板（下节）。

### 自定义节点模板

在容器内声明 `<li x-tree-node>`——**唯一会被递归套用到每一层的模板**（根层、子层、孙层全用这同一个 `<li>`，`node` 在每层指向当前节点）。模板 = 行内容自由 + 一个子容器标记：

```html
<ul x-tree="node of nodes" x-tree-options="{ defaultExpandLevel: 2 }">
    <li x-tree-node>                                   <!-- ① 行根：节点模板声明 -->
        <div class="x-tree-row" x-tree-toggle>          <!-- ② 行内容：任意元素/任意指令 -->
            <span x-text="$leaf ? '📄' : ($expanded ? '📂' : '📁')"></span>
            <span x-text="node.name"></span>
            <span class="tag" x-if="!$leaf" x-text="$children.length"></span>
        </div>
        <ul x-tree-children style="list-style:none;margin:0;padding-left:22px"></ul>
        <!-- ③ 子容器：子节点渲染点（必须，缺了只渲染一层） -->
    </li>
</ul>
```

模板内可用的一切（这就是「自定义」的全部原料）：

- **节点数据 `node`**：`of` 左侧自定义变量名——`x-text="node.title"`、`:class="{ hot: node.hot }"`、`:title="node.desc"` 等任意字段绑定（含事件 `@click`，注意自行 `.stop` 阻断冒泡）；
- **循环变量九元组**：`$expanded`（箭头方向）、`$leaf`（叶子不加箭头/图标差异化）、`$children`（计数徽标）、`$level`（层级差异化样式 `:class="'lv-' + $level"`）、`$indeterminate`（复选半选图标）等——完整清单见[循环变量](#循环变量九元组)；
- **交互触点标记**：`x-tree-toggle`（展开收窄到标记元素）、`x-tree-check`（复选触点）；
- **缩进与行样式**：完全归你的 CSS——缩进 = 子容器的 `padding-left` 每级叠加（见快速入门第 4 步），行样式写在行内容元素上（引擎只注入默认模板的样式，自定义模板零注入）。

三个注意：宿主直接子元素只认 `x-tree-node` 与 `x-empty`（其余丢弃并提示）；`x-tree-children` 取第一个（多余提示）；模板缺 `x-tree-children` 时只渲染一层（提示）。

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
- **例外——内置默认模板恒整行点击展开/折叠**：启用选中时点行 = 选中**并**展开/折叠（antd 心智）；收窄到标记是自定义模板的语义；
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

上例用文字符号（☑/⊟/☐）演示三态最简形态；demo 实际用的是 **lucide 内联 SVG** 三枚经 `x-show` 切换（动态行不能走 `lucide.createIcons()` 的一次性替换）——生产中任意图标库/自定义 SVG 同法。

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

## 标记一览

x-tree 家族的全部标记（除 `x-tree` 本体外均为**无值标记**——写属性名即可，带值会被忽略并提示）：

| 标记 | 书写位置 | 作用 |
| --- | --- | --- |
| `x-tree` | 容器（宿主元素） | 树渲染指令本体：`x-tree="node of nodes"` |
| `x-tree-node` | 容器**直接子元素** | 节点模板声明（首个生效，多余提示）——引擎对展开路径递归套用此模板 |
| `x-tree-children` | 节点模板内 | 子节点渲染点（缺省只渲染一层并提示）；多个取首个 |
| `x-tree-toggle` | 节点模板内 | 展开触点收窄——声明后仅标记元素触发展开/折叠；启用选中（`selectedField`）后**必须声明** |
| `x-tree-check` | 节点模板内 | 复选触点——声明即启用复选交互与级联（状态写入 `checkedField` 字段） |
| `x-empty` | 容器**直接子元素** | 空态模板（树数据为真空数组 `[]` 时渲染，对齐 x-for 惯例） |

```html
<ul x-tree="node of nodes" x-tree-options="{ defaultExpandLevel: 2 }"><!-- ① x-tree 宿主 -->
    <li x-tree-node><!-- ② 节点模板（直接子元素） -->
        <span class="arrow" x-tree-toggle>▸</span>   <!-- ③ 展开触点 -->
        <span class="chk" x-tree-check>☐</span>      <!-- ④ 复选触点 -->
        <span x-text="node.title"></span>
        <ul x-tree-children></ul>                     <!-- ⑤ 子节点渲染点 -->
    </li>
    <li x-empty>暂无数据</li>                          <!-- ⑥ 空态（直接子元素） -->
</ul>
```

各标记的机制详见上方指南各章节（模板优先级 / 交互触点 / 选中 / 复选与级联 / 空态）。

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
| `checkedField`       | `"checked"` | 复选状态写入的字段名。**显式声明即启用复选**——零模板场景默认模板自动带三态触点；自定义模板以 `x-tree-check` 标记为准（声明但无触点会提示） |
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
