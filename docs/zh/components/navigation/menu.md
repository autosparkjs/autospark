# Menu 导航菜单

## 概述

Menu 是 AutoSpark 的官方导航菜单组件（组件库 P2 导航件，ADR-0018 清单权威表 navigation 行）：**items 数据驱动**任意层嵌套菜单树（ADR-0033 v2 重设计，废弃 v1 `<x-menu-item>` 组合式），**value 形态即语义**（`string` 单选激活 / `string[]` checkable 勾选集合），缩进折叠与弹层弹出双机制（`expandLevel` / `popLevel`），同级 check / icon 统一占位，**布尔折叠**（垂直收窄为图标条 / 水平只留一级图标），**宽度可配**（`width` / `collapsedWidth`），完整键盘导航（roving tabindex）。

- **items 数据描述**：`MenuEntry[]`——`item`（透传 button 全 props）/ `group`（纯视觉分组标题）/ `separator`（分隔线，`'-'` 字符串等价）；`children` 支持数组或 `SubmenuOptions` 配置对象（弹层 header/title/footer/padding/indent/slotDir 自定义），递归任意层；
- **value 双语义**：`string` → 单选激活（高亮当前项，受控 + `el.value` 桥 + 祖先链自动展开）；`string[]` → checkable 勾选集合（toggle 数组成员）；
- **层级机制**：`expandLevel` 初始展开到第 N 级（默认 1，可手动折叠 / 展开）；`popLevel` 指定 `level > popLevel` 的子菜单走 popover 弹出（默认 0 全缩进折叠；弹层内更深层级继续级联）；`openKeys` 全受控展开态（显式 `true` / `false` 优先于 expandLevel 默认）；
- **折叠（collapsed）**：布尔。垂直模式 = 整菜单收窄为 `collapsedWidth` 图标条（项只显示图标 + 悬停提示，子级全弹层）；水平模式 = 仅一级项只显示图标，容器尺寸不变；
- **宽度**：`width` 缺省自适应充满宿主容器（显式正数才定宽）；垂直折叠态取 `collapsedWidth`（缺省 48）；
- **header / footer 作用域插槽**：按需解构折叠态、生效宽度、激活项等形参，折叠时切换插槽内容；
- **trigger**：弹层触发 `hover`（缺省）| `click`（透传 popover；缩进域折叠组恒 click）。

router 隔离（ADR-0018 决策 6 约定 2）：纯状态驱动、不 import router——联动以配方交付（见下方 router 配方节，breadcrumb 同款约定）。

引入方式（依赖 `autospark.overlay.js` 与 `autospark.button.js` 先于本组件加载，聚合产物 `autospark.plugins.js` 无此问题）：

```html
<script src="/autospark/autospark.js"></script>
<script src="/autospark/autospark.overlay.js"></script>
<script src="/autospark/autospark.button.js"></script>
<script src="/autospark/autospark.menu.js"></script>
```

## 快速入门

```html
<x-menu x-model="active" :items="menu"></x-menu>
```

```js
new AutoSpark(document.body, {
    active: "home",
    menu: [
        { key: "home", label: "首页", icon: "file" },
        { type: "group", title: "组件" },
        { key: "nav", label: "导航", children: [
            { key: "n1", label: "指令" },
            { key: "n2", label: "组件" },
        ] },
        "-",
        { key: "set", label: "设置" },
    ],
});
```

`<x-menu>` 元素名快捷写法经 precompile 变换承载：静态属性折叠为 props（类型推断）、`:key="expr"` 响应式项以原始表达式拼进值对象，子内容随迁为插槽内容（直接子级的 `<template header>` / `<template footer>` 快捷形态归一为正典 `x-slot:header` / `x-slot:footer`，形参声明原值保留）；**裸 `items='[…]'` JSON 字符串**走 `data-items` 通道（静态菜单树免状态声明）。`<x-menu-item>` 旧组合式已硬移除（ADR-0033 决策 1，0.x breaking）。

<demo html="components/navigation/menu/basic.html"/>

## 指南

### 菜单项 items

```ts
type MenuEntry =
  | MenuItem                                            // type 缺省 'item'；透传 button 全 props
  | { type: 'group';    title: string; icon?: string }  // 分组标题：纯视觉、不可折叠、无缩进层级
  | { type: 'separator' }                                // 分隔线（≡ '-' 字符串）
  | '-'

type MenuItem = {
  type?: 'item'
  key?: string                       // 状态锚点：value 激活/勾选、openKeys 展开按 key 定位
                                     // （无 key 项可渲染不可引用——控制台 warn）
  children?: MenuEntry[] | SubmenuOptions   // 数组 或 配置对象（递归任意层）
} & ButtonProps                      // label / icon / disabled / memo / tags / checkable /
                                     // checkStyle / loading / indent / caret / type / variant …
                                     // （state / collapsed / hideTags 由菜单折叠态接管，勿在项上声明）

interface SubmenuOptions extends Omit<PopoverOptions, 'props'> {
  children: MenuEntry[]               // 必需：项列表
  indent?:  number | string           // menu 专属：缩进呈现时的缩进量覆盖（缺省 1.5em——子级文字与父项图标列对齐，逐级累计）
  // 其余全部继承自 PopoverOptions（弹出机制全盘 x-popover，以 x-popover.md 选项表为准）：
  //   chrome     ：title / icon / actions / closeable / shell——弹层骨架全部由 popover 承载
  //   触发时序   ：trigger / delayShow / delayHide / delayClose
  //   定位外观   ：at（placement / offset）/ fit / animate / border
  //   家族通用   ：keepalive / key / url
  //   排除       ：props（被 menu 内部占用传 submenu）
}
// 移除项：header / footer / title 自绘与 slotDir 弹层分区——面板为纯列表容器，弹层骨架
// 经 popover 选项或 slots 重载定制（根菜单的 header / footer 插槽保留）
```

`group` 是**纯视觉分组标题**（不可点击、不产生缩进层级）；与 select 的 `group`（x-model-options 按字段聚合 optgroup）同名不同义。首尾分隔线自动修剪。

<demo html="components/navigation/menu/basic.html"/>

### 值通道：形态即语义

- **单选激活**（`value: string`）：点击非禁用叶子 → 更新 value + 双派发（`input` 非冒泡 x-model 回写；`change` 冒泡 `detail = { value }`）+ 关闭弹层链；外部 value 变化 → 激活迁移 + **祖先链自动展开**（antd 同款）；同值点击短路；
- **勾选集合**（`value: string[]`）：元素为 checkable 项 key；点击 toggle 数组成员 + `change` 派发（勾选不关弹层——调参非导航）；勾选视觉 = `item.checkStyle ?? 'check'`（menu 语境覆盖 button 全局缺省 `corner`）；
- 两形态互斥；`el.value` 劫持桥服务单值语域（数组消费走 `:value` + `@change` 惯用法）。

<demo html="components/navigation/menu/value.html"/>

### 层级机制：expandLevel / popLevel / openKeys

- **层级计数**：菜单主体直接渲染的项 = level 1，其 children = level 2，依此递推；
- `expandLevel`（默认 1，0 = 全折叠）：初始展开到第 N 级（可手动改），运行时变更响应式生效；
- `popLevel`（默认 0）：`level > popLevel` 的子菜单走 popover 弹出（0 = 全部缩进折叠）；`expandLevel` 只作用于缩进域；弹层内更深层级继续级联弹出；
- `openKeys`（`Record<key, boolean>`）：**全受控双绑**——外部替换即应用（显式 `true` / `false` 优先于 expandLevel 默认）；内部点击展开 / 折叠 → 写入显式 `true` / `false` + `expand` 事件（`detail = { key, expanded }`）。目标态按**当前实际展开态**取反：默认展开的父项不在 openKeys 里，首次点击即折叠；
- items 运行时整体替换：**按 key 保留展开态**（勾选态真源在 value 数组，不动）。

<demo html="components/navigation/menu/hierarchy.html"/>

### 弹层交互

- **弹出机制全盘复用 x-popover**（ADR-0060 / ADR-0128）：触发（hover / click）、定位翻转、hover 链、外点关闭、Esc 栈全部由 popover 承载；每个弹层模式的项宿主挂 `x-popover:autospark-menu-panel`，面板为递归注册组件、数据经 `x-popover-options.props` 注入 `{ submenu: { children, ...item.conf } }`；
- **`SubmenuOptions` 即 popover 选项全集**（`item.conf` 透传）：title / actions / closeable / shell 等骨架 chrome 与 at / trigger / delay* 等行为键直接配置，显式键赢过 menu 计算（placement / trigger 逐级覆盖）；面板不再自绘头尾（`header` / `footer` / `slotDir` 弹层分区已移除）；
- `trigger`（默认 `hover` | `click`）只管弹层域，菜单级值透传、`item.conf.trigger` 逐级覆盖；缩进域折叠组恒 click（button `caret` 尾箭头指示：折叠态朝右 / 展开态朝下，弹层域父项恒朝弹出方向）；
- 弹层面板宽度与菜单本体**实测宽度**一致（垂直模式恒生效——`ResizeObserver` 持续跟随，显式定宽与自适应填充统一覆盖，折叠态沿用展开宽；水平模式弹层内容自适应）；
- 关闭行为：叶子选中 → 关闭整条级联链（click 模型经 popover 原生「外点关闭」链即刻全关；hover 模型面板随指针离开自然收起）；有 children 的项点击切换展开态；勾选类叶子**不关**弹层；Esc 逐层（popover 全局栈）；点击外部整链关；
- **依赖声明**：弹层呈现须同引 `autospark.overlay.js`（x-popover，ADR-0128）——缺席时缩进域照常、弹层域无效（与 dropdown 家族同口径）。

<demo html="components/navigation/menu/popover.html"/>

### 同级统一占位

同级任一项 `checkable` → 全级统一 check 占位列；同级任一项有 icon → 全级统一图标占位列；**check 列在 icon 列左侧**。占位经 button `checkMark`（纯视觉占位通道）与占位图标 + `visibility: hidden`（保宽不可见）承载。

<demo html="components/navigation/menu/placeholder.html"/>

### 折叠（collapsed）

`collapsed` 为布尔（旧数值写法 `1` / `2` 静默归一为 `true`；原三档中的「单按钮 + 整菜单弹层」档已移除，ADR-0033 修订）。两种排列模式的作用面不同：

| 作用面 | 垂直（`mode="vertical"`） | 水平（`mode="horizontal"`） |
|---|---|---|
| 项按钮 | 全部项只显示图标，悬停提示显示项名 | 仅一级项只显示图标（二级起在弹层面板内，不折叠） |
| 容器宽度 | 收窄为 `collapsedWidth`（0.2s 过渡） | 不变 |
| 子菜单 | 全部经弹层弹出（`popLevel` 让位） | 本就全部弹层 |
| header / footer | 保留并裁剪溢出（内容可经插槽形参切换） | 不变 |
| `slotDir` | 强制纵向（`horizontal` 静默不适用） | 不变 |
| 分组标题 | 只显示图标，无图标的分组标题不渲染 | 同左 |
| 无图标项 | 显示通用占位图标 | 同左 |

折叠态的项按钮形态由 button 的折叠能力承载（只显示图标、tags 不渲染、缩进归零、悬停提示）；激活 / 勾选 = 图标染激活色。`collapsed` 支持响应式绑定（联动汉堡按钮切换）。

<demo html="components/navigation/menu/modes.html"/>

### 宽度：width / collapsedWidth

- `width`（缺省 `0` = **自适应填充**）：菜单主体（`.asc-menu-body`）恒 `width: 100%` 充满宿主容器，宽度源 = 容器；显式正数（px）才 inline 定宽覆盖（`width="200"`），负数 / 非数值与缺省等价。放进侧栏等定宽容器时直接填充即可；
- `collapsedWidth`（缺省 `48`）：垂直折叠态的宽度（px）；非法值回落 48；
- 两者仅垂直模式适用，水平模式容器随内容伸展。

<demo html="components/navigation/menu/basic.html"/>

```html
<x-menu :items="menu"></x-menu>                                      <!-- 自适应充满容器 -->
<x-menu :items="menu" width="320" collapsed-width="64" :collapsed="fold"></x-menu>  <!-- 显式定宽 -->
```

### 内边距与分割线（padding）

`padding` 作用于菜单列表区（`.asc-menu-main`）与**弹层面板**，控制菜单项与容器边界的留白节奏：

- 缺省 `calc(var(--auto-spacing, 0.8rem) * 0.5)`（接 `@autospark/theme` 随稀疏度联动；未加载 theme 时兜底 0.4rem）；
- `number` → px 值（`padding="0"` 贴边）；`string` → 原样 CSS（`padding="0.75em 1em"`）；
- 弹层面板在 overlay 容器内、CSS 继承断——同一值经 popover props 管道显式下传，弹层内边距与本体一致，递归面板逐层传递；
- header / footer 分区保持自有内边距，不跟随。

分割线（`-` / `type: 'separator'`）与菜单项**同宽**：左右 margin 为零，缩进全部由 `padding` 承担（`padding: 0` 时贴边可见）。水平模式的竖向分割线保留项间小间距。

分组标题（`type: 'group'`）文字色为次要色 `--auto-secondary-color`（三级回退链，含暗色兜底）。

<demo html="components/navigation/menu/padding.html"/>

### Logo 区（logo）

`logo` 在菜单顶部渲染品牌 Logo 区（独立分区，位于 header 之上；`slotDir="horizontal"` 时横排最前）：

```html
<x-menu :items="menu" logo="logo.png"></x-menu>                 <!-- string ≡ { icon: string } -->
<x-menu :items="menu" :logo="{ icon: 'menu', title: 'AutoSpark', description: '响应式引擎' }"></x-menu>
```

| 键 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `icon` | `string` | — | 图片地址或图标名**一体两用**：URL 形态（`http(s)://`、`//`、`/`、`./`、`data:`、`blob:`、常见图片扩展名）渲染 `<img>`，否则 `x-icon` 渲染图标 |
| `title` | `string` | — | 标题文本（600 权重、单行省略） |
| `description` | `string` | — | 描述文本（`--auto-third-color`、0.85em、单行省略） |
| `url` | `string` | — | 点击 Logo 区跳转链接（渲染 `<a href>` 包裹，未提供不包裹） |
| `direction` | `'auto' \| 'hori' \| 'vert'` | `'auto'` | 排列方向：`hori` 图标 + 文字横排、`vert` 纵排居中；`auto` 按**菜单宽度**容器查询二态切换（≥160px 横排 / 更窄纵排，零 JS） |
| `size` | `number \| string` | `'2.5em'` | 图标展示区尺寸（number → px / string 原样覆盖；宽 = 高 × `aspectRatio`）。图标形态为**品牌色块**（`x-icon` 主题强调 `shape + theme` 双色调板承载——底板实心 `--auto-theme-color`、图形恒白，ADR-0135 决策五；板撑满展示区），仅图片（无 title / description）时水平居中 |
| `padding` | `number \| string` | 同 `padding` | Logo 区内边距覆盖（缺省 `calc(var(--auto-spacing) * 0.5)`） |
| `aspectRatio` | `number` | `1` | 图标展示区宽高比（高 2.25em 固定，宽 = 高 × ratio） |
| `shape` | `'none' \| 'circle' \| 'radius'` | `'radius'` | 图标容器形状：不裁剪 / 圆形 / 圆角矩形（圆角取 `--auto-border-radius`；图标形态下放 `x-icon` shape 板，`'none'` = 无板主题色图形） |
| `color` | `string` | — | 图标自定义色（CSS 色值；显式声明时 `theme` 强调**退位**为浓板联动——该色底板 + 同色图形，引擎显式恒赢语义） |

- **图失效兜底**：URL 形态但 `<img>` 加载失败（onerror）→ 显示首字符块（形状跟随 `shape`，底色 `--auto-third-bgcolor`、文字 `--auto-secondary-color`，内容 `title` 首字符；无 `title` 显示通用图标兜底）；
- **折叠**：只渲染 Logo 图标（title / description 隐藏、居中适配 `collapsedWidth`）；未提供 `logo` 时 Logo 区整块不渲染；
- `<template x-slot:logo="{ … }">` 作用域插槽可重载整个 Logo 区（形参同 header / footer）。

<demo html="components/navigation/menu/logo.html"/>

### header / footer 作用域插槽

`header` / `footer` 是作用域插槽（ADR-0056）：出口向插槽内容注入菜单状态，调用方**按需解构**，形参随状态变化刷新。

```html
<x-menu :items="menu" :collapsed="fold" :value="active">
  <template header="{ collapsed, width, activeItem }">
    <img x-show="!collapsed" src="logo-full.png" />
    <img x-show="collapsed" src="logo-mini.png" />
    <span x-show="!collapsed">{{ activeItem ? activeItem.label : '' }}</span>
  </template>
</x-menu>
```

| 形参 | 含义 |
|---|---|
| `collapsed` | 折叠态（两种模式均为真实值） |
| `width` | 当前生效宽度（px；垂直折叠 = `collapsedWidth`，水平 / 自适应 = `0`） |
| `activeKey` | 单选激活 key（数组形态为空串） |
| `activeItem` | 激活项对象（归一化条目；无激活为 `null`；`_` 前缀字段为内部状态，勿依赖） |
| `activePath` | 激活项祖先链（根 → 自身的数组；无激活为 `[]`） |
| `mode` `value` `items` `openKeys` `expandLevel` `popLevel` `trigger` `slotDir` | 对应 props 原值 |

- 形参**只读**（切换折叠请改调用方绑定的状态）；**解构了的键会遮蔽**调用方同名变量，未解构的键不产生影响；
- `<x-menu>` 的直接子级可写 `<template header="{ … }">`（快捷形态）；直接写 `x-component:autospark.menu` 宿主时须用正典形态 `<template x-slot:header="{ … }">`。

<demo html="components/navigation/menu/slots.html"/>

### 水平菜单（mode="horizontal"）

`mode="horizontal"` 把 level 1 横排成一条顶部导航条，是官网 / 后台顶部导航的标准形态。**所有子级一律弹层**：level 2 面板 `bottom-start` 向下展开，level 3+ 面板 `right-start` 向右级联，任意深度递归。

```html
<x-menu :items="nav" mode="horizontal" :value="active"
        @change="active = $event.detail.value"></x-menu>
```

水平模式**没有缩进域**，以下结构 props 静默不适用（文档明示、不 warn）：`expandLevel` / `popLevel` / `openKeys` / `width` / `collapsedWidth`。`value` / `trigger` / `padding` / `collapsed` / `logo` / 事件照常工作，`mode` 可响应式切换；**`header` / `footer` 插槽仅垂直菜单生效**（水平模式分区隐藏——横排条无上下分区语义，logo 区照常渲染：**与菜单条并排（左端）、垂直居中共处同一水平线**）。

#### 基础横排与触发

- level 1 横排，同级 `-` 分隔线渲染为竖线（保留项间小间距）；
- `trigger` 缺省 `hover`（悬浮 + 意图延迟），触屏路径设 `click`（点击开关、外点关闭）；子项 `conf.trigger` 可逐级覆盖菜单级设置；
- `value` 单选激活 / checkable 勾选集合语义与垂直模式完全一致（`change` 事件 detail = `{ value }`）。

<demo html="components/navigation/menu/horizontal-basic.html"/>

#### 多级级联与弹层定制

- level 2 从父项下方弹出（`bottom-start`），level 3+ 从父项右侧弹出（`right-start`）；弹层宽度按内容自适应（水平模式没有 `width`）；
- `children` 对象形态即 `SubmenuOptions`，`title` / `icon` / `actions` / `closeable` / `border` / `at` / `trigger` 等 popover 选项原样透传，显式键赢过 menu 计算值；
- 关闭行为与垂直弹层域一致：叶子选中关整条级联链、勾选叶子不关、Esc / 外点逐层收起。

<demo html="components/navigation/menu/horizontal-cascade.html"/>

#### 水平折叠

`collapsed` 在水平模式只作用于一级项：项按钮只显示图标（悬停提示项名），**容器尺寸不变**，二级起仍在弹层内正常显示文字（与垂直折叠「整条收窄为图标条、子级全弹层」不同）。折叠态由 button 承载，支持响应式绑定（如汉堡按钮切换）。

<demo html="components/navigation/menu/horizontal-collapsed.html"/>

#### Logo、header / footer 与 slotDir

- `logo` 在横排最前渲染品牌区（string ≡ `{ icon }`；`direction: 'hori'` 图标 + 文字横排、`shape: 'none'` 无壳透明）；
- `slotDir: 'vertical'（默认：header 上 / footer 下） | 'horizontal'（header 左 / footer 右）`：仅作用于**根菜单本体**的 header / footer 插槽位置（弹层内分区已移除——弹层骨架由 popover 承载）；horizontal 时列表居中撑满、Logo 始终最前；垂直折叠态强制纵向，水平折叠不改写；
- header / footer 为作用域插槽，形参（`collapsed` / `width` / `activeKey` / `activeItem` / `mode` / `value` …）按需解构，随状态刷新。

<demo html="components/navigation/menu/horizontal-chrome.html"/>

#### 典型网站顶部导航

把品牌、主导航、右侧操作区组装成一条真实站点导航：Logo + `slotDir="horizontal"` + footer 插槽（搜索框 / 登录按钮）+ 多级下拉 + `collapsed` 紧凑模式切换。组件只负责导航本身，页面其余部分（hero / 内容卡）是普通 HTML —— 这正是「items 数据驱动 + 插槽补位」的推荐用法。

<demo html="components/navigation/menu/website-nav.html"/>

### 键盘导航

| 键 | 行为 |
|---|---|
| ↑ / ↓ | 同级项间移动焦点（跳过分隔线/分组/禁用项，首尾环绕） |
| → | 有子菜单项：缩进域展开并焦点入子级首项 / 弹层域打开并焦点入首项 |
| ← | 折叠当前子层并焦点返回父项（面板内为关闭本面板） |
| Enter / Space | 激活项（原生 button 语义） |
| Esc | 逐层关弹层（popover 全局栈只关栈顶） |
| Home / End | 焦点跳本级首项 / 末项 |

roving tabindex（容器托管 Tab 序，方向键移动真实焦点）；type-ahead 字母导航不做。

<demo html="components/navigation/menu/hierarchy.html"/>

### 主题化

继承 `autospark.base`（ADR-0134）主题档位六键（`data-size` / `data-shadow` / `data-radius` / `data-spacing` / `data-dark` / `data-colorized`）；样式三级回退链（ADR-0129）——`var(--auto-X, var(--asc-menu-X, 校准兜底值))`，暗色兜底变体在场，接 `@autospark/theme` 自动换肤。

<demo html="components/navigation/menu/basic.html"/>

### router 配方

激活态映射路由（纯状态驱动约定，组件不 import router）：

```html
<x-menu :value="route.path" :items="navItems"
        @change="router.push($event.detail.value)"></x-menu>
```

路由变化写 `route.path` → value 受控迁移（激活项祖先链自动展开）；点击叶子 → `change` → `router.push`。

## 参考

### 属性

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `items` | `MenuEntry[]` | `[]` | 菜单树数据（状态引用注入 / 裸 JSON 字符串 `data-items` 通道） |
| `value` | `string \| string[]` | `""` | 单选激活 key / checkable 勾选集合（形态即语义，受控） |
| `expandLevel` | `number` | `1` | 初始展开到第 N 级（缩进域默认策略；0 全折叠） |
| `popLevel` | `number` | `0` | `level > popLevel` 的子菜单走 popover（0 全缩进折叠） |
| `openKeys` | `Record<string, boolean>` | `{}` | 全受控展开态（显式 `true` / `false` 优先于 expandLevel 默认） |
| `collapsed` | `boolean` | `false` | 折叠：垂直收窄为图标条 / 水平仅一级项只显示图标（响应式可切；旧数值写法归一为 `true`） |
| `width` | `number` | `0` | 菜单宽度 px；缺省自适应充满宿主容器（body 恒 100%），显式正数 inline 定宽（仅垂直模式） |
| `collapsedWidth` | `number` | `48` | 垂直折叠态宽度 px（非法值回落 48） |
| `trigger` | `'hover' \| 'click'` | `'hover'` | 弹层触发方式（透传 popover；缩进域折叠组恒 click） |
| `mode` | `'vertical' \| 'horizontal'` | `'vertical'` | 排列形态（horizontal 下结构 props 与宽度 props 静默不适用） |
| `slotDir` | `'vertical' \| 'horizontal'` | `'vertical'` | header/footer 分区方向（仅根菜单本体；弹层内分区已移除） |
| `padding` | `number \| string` | `calc(var(--auto-spacing, 0.8rem) * 0.5)` | 列表区与弹层面板内边距（number → px / string 原样；弹层经 props 管道下传） |
| `logo` | `string \| LogoOptions` | — | Logo 区配置（string ≡ `{ icon }`；详见下文 LogoOptions 与指南 Logo 区节） |

#### MenuEntry

`items` 的元素类型——`item` / `group` / `separator` 三形态，`'-'` 字符串等价 `separator`：

```ts
type MenuEntry =
  | MenuItem                                            // type 缺省 'item'；透传 button 全 props
  | { type: 'group';    title: string; icon?: string }  // 分组标题：纯视觉、不可折叠、无缩进层级
  | { type: 'separator' }                                // 分隔线（≡ '-' 字符串）
  | '-'

type MenuItem = {
  type?: 'item'
  key?: string                       // 状态锚点：value 激活/勾选、openKeys 展开按 key 定位
  children?: MenuEntry[] | SubmenuOptions   // 数组 或 配置对象（递归任意层）
} & ButtonProps                      // label / icon / disabled / memo / tags / checkable / …
```

| 形态 | 判别 | 字段 | 说明 |
|---|---|---|---|
| item | `type` 缺省 `'item'` | `key` / `label` / `icon` / `children` + button 全 props | 可交互菜单项；无 key 可渲染但不可引用（控制台 warn） |
| group | `type: 'group'` | `title`、`icon?` | 纯视觉分组标题，不可点击、不产生缩进层级 |
| separator | `type: 'separator'` 或 `'-'` | — | 分隔线；首尾自动修剪 |

MenuItem 常用字段（其余透传 button props；完整语义见指南「菜单项 items」）：

| 字段 | 类型 | 说明 |
|---|---|---|
| `key` | `string` | 状态锚点：value 激活 / 勾选、openKeys 展开均按 key 定位 |
| `label` | `string` | 项标题（icon 渲染于其左侧） |
| `icon` | `string` | 图标名；同级任一项有 icon → 全级统一图标占位列 |
| `disabled` | `boolean` | 禁用：不响应点击、键盘导航跳过 |
| `checkable` | `boolean` | 勾选态（value 为 `string[]` 时 toggle 数组成员）；同级有一项则全级统一 check 占位列 |
| `checkStyle` | `string` | 勾选视觉（menu 语境覆盖 button 全局缺省 `corner`，默认 `check`） |
| `children` | `MenuEntry[] \| SubmenuOptions` | 子菜单；数组 = 默认弹层配置，对象 = 配置对象 |
| `caret` | `string` | 尾箭头；折叠态由 menu 自动接管（缩进域展开朝下 / 折叠朝右，弹层域朝弹出方向） |

`children` 对象形态即 `SubmenuOptions`：在 PopoverOptions 全集（`title` / `actions` / `closeable` / `at` / `trigger` / `delay*` / `border` 等）基础上增 `children: MenuEntry[]`（必需）与 `indent?: number | string`（缩进量覆盖），不含 `props`（被 menu 内部占用）。

#### LogoOptions

`logo` 的对象形态；传字符串时等价于 `{ icon: 字符串 }`。

```ts
interface LogoOptions {
  icon: string
  title?: string
  description?: string
  url?: string
  direction?: 'auto' | 'hori' | 'vert'
  size?: number | string
  padding?: number | string
  aspectRatio?: number
  shape?: 'none' | 'circle' | 'radius'
}
```

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `icon` | `string` | — | 图片 URL 或图标名一体两用：URL 形态渲染 `<img>`，否则 `x-icon` |
| `title` | `string` | — | 标题文本（600 权重、单行省略） |
| `description` | `string` | — | 描述文本（次要色、0.85em、单行省略） |
| `url` | `string` | — | 点击 Logo 区跳转链接（渲染 `<a href>`；未提供不包裹） |
| `direction` | `'auto' \| 'hori' \| 'vert'` | `'auto'` | 排列方向；auto 按菜单宽度容器查询切换（≥160px 横排 / 更窄纵排） |
| `size` | `number \| string` | `'2.5em'` | 图标展示区尺寸（number → px / string 原样）；宽 = 高 × aspectRatio |
| `padding` | `number \| string` | 同 `padding` | Logo 区内边距覆盖 |
| `aspectRatio` | `number` | `1` | 图标展示区宽高比 |
| `shape` | `'none' \| 'circle' \| 'radius'` | `'radius'` | 图标容器形状：不裁剪 / 圆形 / 圆角矩形 |

折叠态只渲染 Logo 图标；URL 形态图片加载失败 → 首字符块兜底；完整行为与重载插槽见指南「Logo 区（logo）」。

### 事件

| 事件 | 冒泡 | detail | 说明 |
|---|---|---|---|
| `change` | ✓ | `{ value }` | 叶子激活（单值）/ 勾选集合变化（数组）；外层一行回写惯用法 |
| `input` | ✗ | — | x-model 回写通道 |
| `expand` | ✓ | `{ key, expanded }` | 缩进域折叠组展开态变化（内部切换派发；外部替换不广播） |

### Slots

| 插槽 | 说明 |
|---|---|
| `header` | 顶部（slotDir=horizontal 时左端）自定义区；**作用域插槽**（形参见指南）；template 载体出口——分区 class 注入内容根，**未提供内容时分区不渲染**（可选出口）；垂直折叠态保留并裁剪溢出 |
| `footer` | 底部（slotDir=horizontal 时右端）自定义区；**作用域插槽**（形参见指南）；template 载体出口——未提供内容时分区不渲染；垂直折叠态保留并裁剪溢出 |
| `logo` | Logo 区（header 之上）整体重载；**作用域插槽**（形参同 header / footer）——未提供时渲染 `logo` 属性内置形态，两者皆无则分区不渲染 |

### 已知边界

1. hover 模型下叶选后弹层不即刻关闭（随指针离开自然收起）——hover 无 click 监听，「选完即走」语义由指针离开承载；
2. items 的**原地变更**（同引用改字段）不触发影子树重建——修改请整体替换（状态锚点语义，按 key 保留展开/勾选态）；
3. 垂直折叠态下选中弹层内的子项后，图标条里仅激活项自身染色、其一级父项图标不亮（激活标记不向祖先传导）；
4. 折叠与展开来回切换后，可见的一级项可能残留原生 `title` 提示——button 的截断检测在宽度过渡期间误判、过渡结束后不重检（待 button 侧修复）；
5. 与 ADR-0033 原文的偏差（如实登记）：`autospark.overlay.js` 缺席时**不 warn**（缩进域照常、弹层域无效）；「折叠态弹层按弹层首层重新计数」未实现——折叠态与 `popLevel` 触发的弹层内均为全级联弹出，不按 `expandLevel` / `popLevel` 重计。
