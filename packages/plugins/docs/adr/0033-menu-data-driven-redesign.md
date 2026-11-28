# ADR-0033: menu v2 数据驱动重设计（废弃 x-menu-item 组合式）

- 状态：已接受（Accepted，2026-11-18；2026-11-22 修订——决策 4 `collapsed` 布尔化并移除档 2、新增决策 4a 宽度与 4b 作用域插槽、决策 8 水平模式折叠、决策 2 展开态写显式 false、决策 11 / 12 如实化；2026-11-24 修订——决策 7 渲染机制重写（单分支单实例 / 去 ul-li / entry 四职合一）与弹层架构（面板 props 通道 / chrome 下放 popover / popover disabled 门禁 / options 表达式合并））
- 日期：2026-11-18
- 关联：ADR-0018（决策 8「menu 每件一 ADR」由本 ADR 归位——v1 实施曾落在合批 ADR-0024 第 7 节；决策 6 约定 2 router 隔离延续有效）、ADR-0024（第 7 节 v1 menu API 由本 ADR **整体重写**）、ADR-0027（dropdown 与 menu 的语义分界维持）、ADR-0060（popover 触发模型——无 visible 真相源，本组件弹层全盘委托）、ADR-0128（overlay 家族移入 plugins，构成 menu 的前置依赖）、ADR-0016 修订记（button checkable 四 props 回归，为菜单勾选提供载体）、ADR-0094 / 0111 / 0129 / 0134（命名空间 / 插件注册 / 主题回退链 / base 继承惯例）、ADR-0056（engine：作用域插槽——决策 4b header / footer 形参的机制依据）

## 背景

v1 menu（ADR-0024 第 7 节）以 `<x-menu-item>` 子元素组合声明菜单，children 仅支持**一层**嵌套（模板静态结构）、无键盘漫游、horizontal/collapsed 各只有一档。重开发需求要求：items 数据描述驱动、任意层嵌套、缩进折叠与弹层弹出双机制（expandLevel / popLevel）、同级 check / icon 统一占位、collapsed 三档（正常 / 图标条 / 单按钮+整菜单弹层）、完整键盘导航、弹层用内置 popover。

## 决策

### 1. items 数据驱动（组合式硬移除）

```ts
type MenuEntry =
  | MenuItem                                            // type 缺省 'item'；透传 button 全 props
  | { type: 'group'; title: string; icon?: string }     // 纯视觉分组标题：不可点、不可折叠、不产生缩进层级
  | { type: 'separator' }                               // 分隔线（≡ '-' 字符串）
  | '-'

type MenuItem = {
  type?: 'item'
  key?: string                                          // 状态锚点：value 激活/勾选、openKeys 展开按 key 定位；
                                                        // 无 key 项可渲染不可引用（开发期 warn）
  children?: MenuEntry[] | SubmenuOptions               // 数组 或 配置对象（递归任意层）
} & ButtonProps                                         // label / icon / disabled / memo / tags / checkable / checkStyle / loading / indent / caret …

type SubmenuOptions = {
  header?:  string | '#模板id'                          // 弹层头部：纯文本 或 template 引用
  footer?:  string | '#模板id'                          // 弹层尾部：形态同 header
  title?:   string                                      // 弹层标题行（仅弹层域显示；缩进域父项 label 已承担）
  padding?: number | string                             // 弹层内边距覆盖
  indent?:  number | string                             // 缩进域缩进量覆盖
  slotDir?: 'vertical' | 'horizontal'                   // 分区方向逐层覆盖
  children:  MenuEntry[]                                // 必需：真正的项列表
}
```

- `<x-menu-item>` 组合方式**硬移除不警告**（0.x 开发期 breaking 惯例，ADR-0016 删 checkable 先例）；旧写法静默忽略、声明子元素摘除；
- 裸 `items='[…]'` JSON 字符串走 `data-items` 通道（v1 既有，字面量数组 props 死环规避清单第 1 条延续）；
- children 为**函数**（异步子菜单）不做——涉及 loading 占位 / 缓存 / 失败态，等真实场景（YAGNI）。

### 2. 层级机制：expandLevel / popLevel / openKeys

- **层级计数**：菜单主体直接渲染的项 = level 1，其 children = level 2，依此递推；
- `expandLevel`（默认 1，0 = 全折叠）：**初始展开**到第 N 级（用户可手动再折叠/展开），运行时变更响应式生效（按新层级重算展开态）；
- `popLevel`（默认 0）：**level > popLevel 的子菜单用 popover 弹出**，level ≤ popLevel 用展开折叠 + 缩进呈现；弹层内更深层级继续级联 popover；expandLevel 只作用于缩进域；
- `openKeys`（`Record<key, boolean>`）：**全受控双绑**——外部替换即应用为展开态（优先于 expandLevel 默认）；内部展开/折叠 → 更新 openKeys + 广播 `expand` 事件；expandLevel 只在「openKeys 未覆盖的项」上生效。两层正交：expandLevel 管默认策略，openKeys 管精确状态。**2026-11-22 修订（缺陷修复）**：内部折叠写显式 `false`（不删键——删键会落入 expandLevel 回退分支而回弹）；目标态按**当前实际展开态**取反（默认展开的父项不在 openKeys 里，按原值取反会使首次点击无效）；
- **弹层重计口径**：popLevel 触发的级联弹层内层级**绝对延续**；~~collapsed=1/2 的弹层以弹层首层为 level 1 重新计数~~ **2026-11-22 修订：未实现，如实废止**——折叠态与 popLevel 触发的弹层内均为全级联弹出，不按 expandLevel / popLevel 重计（登记为已知边界）；
- value（单值形态）受控变化 → 激活项祖先链自动展开（antd 同款，写穿 openKeys，幂等写防 watcher 抖动）；数组形态不触发展开；
- items 运行时整体替换：**按 key 保留展开态**（勾选态真源在 value 数组，不动）。

### 3. value 双语义：形态即语义

- `value: string` → **单选激活**（高亮当前项，无勾选）；点击非禁用叶子 → 更新 value + 派发（非严格受控）；
- `value: string[]` → **checkable 勾选集合**（元素为勾选项 key）；点击 checkable 项 → toggle 数组成员 + 派发；勾选视觉即反馈，无激活高亮；
- 两形态互斥（一实例一种）；**不设 radio 互斥类型**——单选场景即「单值 value + 激活高亮」本身，不造第二种机制。

### 4. 折叠（`collapsed`，布尔；2026-11-22 修订——原三档 0 / 1 / 2）

- `collapsed: boolean`（旧数值写法 `1` / `2` 静默归一 `true`）；原档 `2`「单按钮 + 整菜单弹层」**移除**（v2 已知边界中该档内容链不完整，且与布尔语义不兼容）；响应式绑定可驱动切换；
- **垂直**：容器宽度收窄为 `collapsedWidth`（0.2s 过渡）；全部项只显示图标；children **一律 popover**（popLevel 让位）；header / footer 保留并裁剪溢出；slotDir 强制纵向；分组标题只留图标（无图标不渲染）；无图标项显示通用占位图标；
- **水平**：仅一级项只显示图标（二级起在弹层面板内），容器尺寸 / 插槽 / 分区不变；
- 项按钮形态由 button 折叠能力承载（`collapsed: true`——只显示图标、tags 不渲染、缩进归零、悬停提示）；node 值对象**同时给出与 button 折叠预设一致的值**（menu / labelPos / indent / caret / hideTags）——值对象重算即整组重注入，等值使结果不依赖注入时序；caret 与 checkMark 折叠态由 node 置空（button 折叠预设不含二者，且 button 侧 labelPos=none 保留 caret 是有意设计）；
- 激活 / 勾选 = 图标染激活色。

### 4a. 宽度（`width` / `collapsedWidth`；2026-11-22 修订新增）

- `width`（number，缺省 200）→ 菜单内联宽度（px），落在内层 body（模板根动态绑定不求值）；仅正有限数生效，否则（`0` / 负 / NaN）不写内联、回落样式表 `width:100%` **填充父容器**——`width="0"` 即侧栏填充配方；
- `collapsedWidth`（number，缺省 48）：垂直折叠态宽度；非法值回落 48；
- 两者仅垂直模式适用。

### 4b. header / footer 作用域插槽（2026-11-22 修订新增）

- 两出口均为作用域插槽（engine ADR-0056 假设③）：形参 13 键——派生 `collapsed` / `width`（生效宽度）/ `activeKey` / `activeItem` / `activePath` + 回显 `mode` / `value` / `items` / `openKeys` / `expandLevel` / `popLevel` / `trigger` / `slotDir`；不外泄影子树（`tree` / `openView` / `markedMap`）；
- 调用方按需解构：未声明的键不进 locals、不遮蔽调用方同名变量；形参只读；
- `<x-menu>` 直接子级的 `<template header>` / `<template footer>` 快捷形态由 precompile 归一为正典 `x-slot:header` / `x-slot:footer`（引擎只认 x-slot 标记——v2 误以为属性名形态可用，header / footer 插槽自 v2 起从未渲染，本次一并修复）。

### 5. 弹层交互（全盘委托 x-popover）

- `trigger`（menu 级 props，默认 `hover`、可 `click`）：直接映射 popover 同名选项，只管弹层域；缩进域折叠组**恒 click**（button `caret` 尾箭头承载指示：折叠态朝右 / 展开态朝下，弹层域父项恒朝弹出方向）；
- 弹出几何：vertical 缩进域末级弹出 `right-start`；horizontal level 2 `bottom-start`、level 3+ `right-start` 级联；
- 关闭行为：叶子项选中 → **关闭整条级联链**（hover 模式经面板 `close()` + hover 链指针重估天然全链关；click 模式逐层关闭兜底）；有 children 的项点击 toggle；**勾选类叶子不关弹层**（调参不是导航）；Esc 逐层（popover 全局栈只关栈顶）；点击外部整链关（light-dismiss）。

### 6. 同级统一占位（check 列 / icon 列）

- 同级任一项 `checkable` → 全级统一 check 占位列；同级任一项有 icon → 全级统一 icon 占位列；**check 列在 icon 列左侧**（勾选语义先于图标）；
- 勾选渲染：`item.checkStyle ?? 'check'`（menu 语境覆盖 button 全局缺省 `corner`——菜单勾选列惯例是最左打勾）；仍可逐项覆盖四值；
- button 小幅增强：新增 `checkMark` 布尔 props——**纯视觉 check 占位**（挂形态类、不启用 checkable 行为桥），勾选态由外部 class 驱动（menu 自管，避免与 checkable 点击翻转双处理）；icon 占位经占位名 + `visibility: hidden` 承载（列宽恒定、图标不可见）。

### 7. 渲染机制：递归组件 + 影子树归一（2026-11-24 重写：单分支单实例）

- **递归组件**（官方多级菜单路径，engine 深度 100 保护天然防数据环）：内部组件 `autospark-menu-node`——级列表渲染 separator / group / item 三分流；
- **单分支单实例**（2026-11-24 修订）：~~三分支（fold / pop / leaf）DOM 恒在、每项 3 个 button 化身~~ → **每项 1 个**——`div.asc-menu-entry` 四职合一（缩进 / 状态标记 data-* / 点击中继 / 弹层宿主），三分支语义转 `:data-mode` + 运行时分派；实测每项 37 节点 / 3 实例、100 项同步编译 10–17s → 简化后约 15 节点 / 1 实例；
- **去 ul/li**：列表容器 `div.asc-menu-list`，ARIA（menu / menuitem / separator / group / aria-expanded / aria-haspopup）随迁保留；
- **弹层面板**：内部组件 `autospark-menu-panel`（连字符注册名免疫 popover attr 参数点号切分，dropdown 同款成因）——**纯列表容器**：~~自绘 head / title / foot 与 slotDir 弹层内分区~~ 移除，骨架 chrome 全部下放 popover（title / actions / closeable / shell 经 item.conf 的 popover 键配置）；数据经 `x-popover-options.props` 注入 `{ submenu: { children, ...conf } }`（~~沿宿主链读~~ 2026-11-24 实测废弃——props 对象包数组完好、面板内 x-component 正常渲染）；
- **弹层宿主四职合一**：entry 恒挂 `x-popover`（宿主与 button 化身同宿主互斥，ADR-0056 决策十修订——宿主层省不掉），缩进模式经 popover 的 **disabled 门禁**（2026-11-24 新增选项——打开路径短路、关闭路径不受影响）关闭触发；options 经 **spread 表达式合并** `{ 基座, ...(item.conf || {}) }`——engine getDirectives 的 options 解析同期扩展「JS 表达式特征降级求值」（spread / 值位置标识符 / 三元 / 调用，响应式热更新）；
- **影子树归一化**：根组件把 items 归一为内部规范树（children 对象拆平 / `'-'` 归一 / disabled 整支传播 / 逐级 hasIcon/hasCheck 占位标注一次算好），渲染纯消费影子树——外部受控数据不被变异，模板表达式保持简单；
- 跨组件通信走 scope 链哨兵键（dropdown 先例：pickTick/pickKey 自增免疫同值去重）。

### 8. horizontal（保留）与 slotDir

- `mode: vertical（默认）| horizontal`：横排 level 1，子级**全部弹层**（无缩进域）——`expandLevel` / `popLevel` / `openKeys` / `width` / `collapsedWidth` **静默不适用**（不 warn，文档明示；mode 可响应式切换）。**2026-11-22 修订**：`collapsed` 在横排**适用**——仅一级项只显示图标（原「collapsed 静默不适用」废止；原实现亦未守住，横排 + 折叠会把 label 一并隐藏）；
- `slotDir: vertical（默认：header 上 / footer 下）| horizontal（header 左 / footer 右）`：作用于本体 header/footer slot 位置与各级弹层内部分区；menu 级统一 + SubmenuOptions 逐层覆盖；缩进域展开块内不渲染 header/footer（弹层域专属，父项 label 已承担标题）。**垂直折叠态强制纵向**（2026-11-22 修订——48px 宽容不下三分区并排）。

### 9. 键盘导航（完整版）

| 键 | 行为 |
|---|---|
| ↑ / ↓ | 同级项间移动焦点（跳过 separator / group / disabled） |
| → | 有子菜单项：缩进域展开 / 弹层域打开并焦点入首项 |
| ← | 折叠当前子层并焦点返回父项 |
| Enter / Space | 激活项（原生 button 语义） |
| Esc | 逐层关弹层（popover 全局栈机制继承，不拦截） |
| Home / End | 焦点跳本级首项 / 末项 |

roving tabindex（容器托管 Tab 序，方向键移动真实焦点）；type-ahead 字母导航不做。

### 10. 事件面（组件库惯例对齐）

- `input`：非冒泡，x-model 回写通道；
- `change`：冒泡，`detail = { value }`——叶子激活（单值）/ 勾选集合变化（数组）；
- `expand`：冒泡，`detail = { key, expanded }`——缩进域折叠组展开态变化。

### 11. 依赖面

加载序：`autospark.js` → `autospark.overlay.js` → `autospark.button.js` → `autospark.menu.js`（聚合产物 `autospark.plugins.js` 无此问题）；overlay 缺席时缩进域照常、弹层域无效（~~menu 插件 warn~~ **2026-11-22 修订：如实化**——实现不 warn，与 dropdown 家族口径一致，不补）。

### 12. 术语口径

| 术语 | 口径 |
|---|---|
| 激活（active） | value 单值形态点亮的当前项 |
| 勾选（checked） | value 数组形态的 checkable 项集合 |
| 缩进域 | level ≤ popLevel 的展开折叠 + 缩进呈现区 |
| 弹层域 | level > popLevel 的 popover 呈现区（含折叠态弹层） |
| **菜单折叠（collapsed）** | 布尔：垂直 = 整菜单收窄为折叠宽度、项只显示图标、子级全弹层；水平 = 仅一级项只显示图标（2026-11-22 修订，原「折叠三档」） |
| 子菜单折叠 / 折叠组 | 缩进域内父项 children 的展开 / 折叠（openKeys / expandLevel）——与菜单折叠是两个概念，勿混用 |
| 菜单宽度 / 折叠宽度 | `width` / `collapsedWidth`（`width=0` = 填充父容器） |
| group | menu 的**纯视觉分组标题**（不可折叠、无 children）——与 select 的 `group`（x-model-options 按字段聚合 optoptgroup）**同名不同义**，分属两组件域 |

## 备选方案

- **保留 x-menu-item 兼容层（warn + 转换）**：否决——组合式 → 数据式结构不同无从机械转换，兼容层违背 KISS；0.x 直接删（Q8 共识）。
- **children 支持函数（异步子菜单）**：否决——loading / 缓存 / 失败态是一整块设计，本版不做（YAGNI），等真实场景。
- **radio 互斥类型**：否决——单选即单值 value 激活语义本身，不造第二种机制。
- **自建弹层（CSS absolute + hover）**：否决——v1 的浮层即此路（hover 顺带、无键盘、无栈）；用户明确要求内置 popover，且 popover 的 hover 链 / light-dismiss / Esc 栈 / 嵌套级联全部现成。
- **x-tree 渲染菜单树**：否决——树形专职指令非菜单语义（占位列 / 弹层域 / 键盘漫游全要自建）；递归组件是文档明示的多级菜单路径。
- **砍掉 horizontal**：否决（曾推荐）——用户裁定保留；其语义收敛为「纯弹层形态」（API 面是 vertical 子集），成本可控。
- **trigger 默认 click**：否决（曾推荐）——用户裁定默认 hover（级联菜单桌面惯例），click 作选项（触屏路径）。
- **键盘导航基础版**：否决（曾推荐）——用户裁定完整版（六键 + Home/End + roving tabindex）。
- **openKeys 删除（只留 expandLevel）**：否决——失去「默认展开 N 级、排除某组」的精确控制；全受控双绑成本低（expand 事件回写即闭环）。

2026-11-22 修订追加：

- **保留 collapsed 三档**：否决——档 2 内容链不完整且与布尔语义不兼容；布尔 + 两种排列模式已覆盖「图标条」需求。
- **button 内置折叠预设补 `caret: 'none'`**：否决（实施期）——button 侧 labelPos=none 保留 caret 是有意设计（折叠图标条 + 箭头为合法形态）；caret 由 menu 的值对象置空。
- **折叠时 menu 自拼项按钮形态（CSS 隐藏 label / 箭头 + labelPos 切换）**：否决——与 button 折叠能力重复；消费 button 的 `collapsed` 并让值对象给出等值（抗 props 整组重注入冲回）。
- **openKeys 折叠时物化默认（mounted 把 depth ≤ expandLevel 的父项写进 openKeys）**：否决——与外部受控初值需合并；写显式 false + 按实际展开态取反两行即解。
- **`width` 支持字符串透传（em / 百分比）**：否决——随容器的需求由 `width="0"` 填充父容器覆盖（YAGNI）。
- **方法类插槽形参（toggle / expandTo）**：否决——折叠切换应改调用方自己的状态；函数形参在事件表达式中的可调用性未验证。
- **折叠态隐藏 header / footer**：否决——改经作用域插槽形参由调用方切换内容，并局部裁剪防溢出。

2026-11-26 修订追加（宽度语义翻转 + logo size / 留白一致）：

- **width 缺省语义翻转**：缺省 `200` → 缺省 `0`（自适应填充）——`.asc-menu-body` 恒 `width: 100%` 充满宿主容器（宽度源 = 容器），显式正数才 inline 定宽；body 不再自带内联缺省宽度，消除「宿主容器宽 260 / 菜单本体 200」的不一致（用户实证 demo 场景）。
- **弹层等宽改实测通道**（2026-11-28）：面板等宽源由 effWidth 计算（仅显式 width 生效）改为**本体实测宽**（`panelW`——展开态 `ResizeObserver` 持续跟随，显式定宽与自适应填充统一覆盖；折叠态沿用展开宽不写 48 窄条；水平模式弹层内容自适应）——props 键名 `effWidth` 保留、值改传 `panelW`；panel :style 等宽条件移除 `!collapsed`。实施坑：RO 句柄存响应式 this 被 Proxy 包装致 `observe` Illegal invocation——挂 `this.el._panelRO` expando。
- **水平菜单 body 改 row + align-items: center**（2026-11-28）：logo 与菜单条并排、垂直居中共处同一水平线（header/footer 已隐藏后 column 纵叠失去意义）。
- **logo `size` 键**：图标展示区尺寸（number→px / string 原样；缺省 `2.5em`，宽 = 高 × aspectRatio；折叠态 `max-width: 100%` 防溢出图标条）；图标容器为品牌色块（背景 `--auto-theme-color`、内容白色——x-icon currentColor / 首字符块，`shape: 'none'` 无壳透明）；仅图片（无 title / description）时图标水平居中（`:data-text` 标记 + `:not([data-text])` 规则）。
- **header / footer 出口改 template 载体**（ADR-0137）：`<template class="asc-menu-header" x-slot:header="slotParams">` 替代「分区 div + 出口 div」两层——无包裹层（分区 class 经出口注入落到投影内容根，多根对称、token 合并），**空载体 = 可选出口**（未提供插槽时分区整段不渲染，原空壳占位取消）；分区 CSS（padding / color / 折叠 overflow / slotDir horizontal order）选择器不变，命中注入后的内容根；**header / footer 仅垂直菜单生效**（`mode=horizontal` 分区 display:none 门禁——横排条无上下分区语义）。

2026-11-25 修订追加（外观特性扩展：group 色 / padding / 分割线 / logo）：

- **group 分组标题色**：由 `--auto-third-color` 提升为 `--auto-secondary-color`（三级回退链含 theme 未加载兜底，light 0.55 / dark 0.65）；
- **padding prop**：列表区（`.asc-menu-main`）与弹层面板内边距统一通道（缺省 `calc(var(--auto-spacing, 0.8rem) * 0.5)`；number→px / string 原样）；弹层面板在 overlay 容器、CSS 继承断——经既有 popover props 管道显式下传（node → 弹层 props → panel，递归面板逐层传递）；header / footer 分区不跟随；
- **分割线同宽**：垂直分割线左右 margin 归零（缩进全部由 padding 承担，与菜单项同宽）；水平竖线保留项间小间距；
- **logo prop**（`string \| LogoOptions`，string ≡ `{ icon }`）：icon 图片 URL / 图标名一体两用（URL 形态判定 = 协议 / 路径前缀 / 常见图片扩展名）；`url` 跳转链接、`direction` 缺省 auto（`.asc-menu-body` 开 `container-type: inline-size` + `@container ≥160px` 二态切换，零 JS——happy-dom 不支持 @container，方向切换断言由浏览器 e2e 把关）、`shape`（none/circle/radius）、`size`（图标展示区高度，number→px / string 原样，缺省 2.25em；宽 = 高 × `aspectRatio` 经 calc 承载，折叠态 max-width 防溢出图标条）；图失效（img onerror，errorArmed 模式同 avatar）→ 跟随 shape 的首字符块兜底；折叠只留图标；未提供 logo 分区不渲染；`<template x-slot:logo>` 作用域插槽重载（slot=logo 加入 precompile 快捷归一清单，出口 fallback = 内置默认渲染）；logo 区内边距缺省同 menu padding（`calc(var(--auto-spacing) * 0.5)`），可经 `logo.padding` 覆盖。
- **实施期引擎发现（menu 侧已规避，登记待根治）**：`patchStyle` 的 falsy 分支整删 `style` 属性（`removeAttribute("style")`）会冲掉同元素 x-show 已写入的 `display:none`——`:style` 绑定与 x-show 不得落在同一元素上；menu 的 logo 分区把 `:style="logoStyle"` 下移至 slot 出口包裹层规避（几何等价）。

## 后果

- menu v2 交付：注册名 `autospark.menu`（内部组件 `autospark-menu-node` / `autospark-menu-panel` 不对用户暴露）；产物 `autospark.menu.js`；依赖 `autospark.overlay.js` + `autospark.button.js` 前置加载；
- ADR-0024 第 7 节 v1 menu API 描述废止（items 单层 children / openKeys 半开放 / collapsed 布尔 / mode 单档语义均被本 ADR 取代）；ADR-0018 决策 8 的「menu 每件一 ADR」归位；
- button 新增 `checkMark` props（纯视觉 check 占位，决策 6）——button 文档与测试同步；
- 回归面：`<x-menu-item>` 存量用法静默失效（声明子元素摘除）；`collapsed` 布尔写法语义变更（true ≈ 1 图标条，裸属性归一）；openKeys 由「可注入初始展开」升级为全受控；
- **2026-11-22 修订的回归面**：① `collapsed` 数值写法 `1` / `2` 归一为 `true`（档 2 形态消失）；② 菜单宽度缺省由 `100%` 变为 260px——填满父容器的存量用法须显式 `width="0"`；③ `<x-menu>` 的 `<template header>` / `<template footer>` 此前从未渲染，本次起生效（已有该写法的页面会出现此前不可见的插槽内容）；
- 已知边界：①弹层域交互依赖 overlay 插件在场（缺席不 warn、缩进域仍可用）；②popover 无命令式开关，「叶选关整链」hover 模式靠 close() + hover 链指针重估、click 模式逐层关闭——两条路径均系机制内组合，不自建弹层；③horizontal 下结构 props 与宽度 props 静默不适用（collapsed 适用；可响应式切 mode，不 warn）；④垂直折叠态下选中弹层内子项后，一级父项图标不亮（激活标记不向祖先传导）；⑤折叠 ↔ 展开后可见的一级项可能残留原生 `title`——button 的截断检测在宽度过渡期间误判、过渡结束不重检（待 button 侧修复）；⑥button 化身载体为 div（content-box），menu 侧以 `box-sizing: border-box` 保证项按钮 block 不溢出——button 自身的 block 规则隐式依赖 `<button>` 的 UA border-box。
