# ADR-0023: 数据表格 table——双循环装配、CSS 表格/网格双分叉与 virtual 并入

- 状态：已接受（Accepted，2026-11-13）
- 日期：2026-11-13
- 关联：ADR-0018（组件库路线图——清单权威表 display 行「table 含 virtual 模式（P2）」与决策 4「虚拟表不独立成件——virtual 模式并入 table」）、ADR-0021（P1 合批——后果节七条引擎边界规避清单）、ADR-0022（select——virtual 接入与嵌套循环先例）、ADR-0012（button 范式——样式基线）、ADR-0129（主题三级回退链）、ADR-0107（动态名插槽出口）、ADR-0056（插槽收集与同名去重）、ADR-0114（预加载队列自举）

## 背景

table 是 P2 展示+导航主力批的最重件（ADR-0018 决策 8：重件每件一 ADR）。它是全库第一个**二维数据结构**组件（行 × 列），路线图授权的复用素材为「x-for、virtual、x-loading、tooltip、x-scrollbar、tag/card/checkbox（跨组件）」。需要钉死五件事：①与 x-for / list 的边界；②行 × 列双循环在引擎上的装配形态（尤其语义 `<table>` 与 template 形态 x-for 的兼容性）；③virtual 并入方式（路线图决策 4：不独立成件）；④行选择 / 排序与跨组件（checkbox）组合的值通道；⑤v1 裁剪清单。

## 决策

### 决策 1：与 x-for / list 的边界——列结构语义归 table

x-for 是引擎渲染指令（全权自定义，项模板 / `:key` / 派生变量全暴露）；list 是单列数据的开箱行容器（空态 / 加载态 / 虚拟滚动 / 边框分隔）；table 是**列结构化**数据的表格容器——表头、列对齐、列宽、列排序、行选择、斑马纹这些列结构语义是 table 的增量面，list 不承载也不并入 list（违反单一职责）。裸渲染用 x-for，无结构行列表用 list，列化数据表格用 table。

### 决策 2：普通分叉走 CSS `display:table` 全 div 结构（语义 `<table>` 落选的引擎边界）

**实测边界（新增，后续含表格结构组件照此规避）**：语义 `<table>` 语境下的 `<template>` 元素（template 形态 x-for 挂行内的规范用法）在 happy-dom 中 `.content` 丢失——table 插入模式的模板内容切换未实现，`<th>` 子节点被 foster 出 content，x-for 报「容器无元素子节点」（真浏览器按 spec 可正确解析，但测试基座 happy-dom 不可用即不可交付）。**语义 `<table>` + 行内 `<template>` 组合禁用**。

普通分叉（`virtual=false` 缺省）采用 **CSS `display:table` 系全 div 结构**：`.asc-table-tablebox`（`display:table; width:100%`）+ 表头行 / 行组（`table-row` / `table-row-group`）+ 单元格（`table-cell`）。收益：①div 语境 template 形态 x-for 全兼容（克隆体内组件实例 / 值通道 / 动态名出口均已实证可用）；②`table-layout:auto` 列宽随内容自动分配保真（对照 grid 的显式列模板）；③语义经 ARIA role 承载（`table` / `row` / `columnheader` / `cell` / `rowgroup`）。列循环 template 形态挂行内——项经 `template.parentElement` 落位行元素，**静态选择列与循环列共存同一行**（template 形态的独特红利：容器形态的行循环会让静态子节点随列重复）。

行 × 列双 x-for：外层行循环 `row, rowIndex of viewRows`（容器形态挂行组）× 内层列循环 `column, colIndex of columns`（template 形态挂行内）。内层源 `columns` 经 scope 链解析组件 data 域（select 面板跨组件链读先例）；**嵌套列循环渲染比行循环晚一跳**（外层 render → compileChild 克隆 → 内层 x-for created → scheduler 再排）——消费侧首屏断言须双跳等待，运行时为微任务级不可感。行循环**不设 `:key`**：evalKey 表达式经 `new Function(item, index)` 闭包求值，组件域 `rowKey` 不可达（引用即 ReferenceError → 静默回退 index 键），显式省略走 index 键（排序重排全量重绑，可接受）。

### 决策 3：virtual 并入——网格分叉（CSS grid），表头外置恒渲染

路线图决策 4：virtual 模式并入 table，不独立成件。接入方式沿用 list 范式（`virtual: true` props 经 x-if 结构分叉接线 + 行定高显式声明），但**分叉内的呈现形态分叉**：

- **语义 / CSS 表格在 virtual 分叉不可用**：virtual 策略要求 x-for 容器即滚动宿主（`container.scrollTop` / `clientHeight` 几何采样），而 `tbody` / row-group 无法独立滚动；把 row-group 设为 `display:block` 滚动则表头列对齐断裂（列布局算法脱钩）。
- **virtual 分叉走 CSS grid 网格**：`.asc-table-vbody`（x-for.virtual 容器 = 定高滚动宿主）+ `.asc-table-vrow`（`display:grid` 行）。列对齐经自定义属性 `--asc-table-cols`（列宽模板串，`width` 数字→px / 缺省 `minmax(6em,1fr)` 均分 / 选择列前置 `3em`）挂 `.asc-table-inner` **一处 setProperty**（继承贯通表头与全部行——Chromium 自定义属性 style 赋值失效须走 setProperty 的家族纪律）。
- **表头恒渲染不虚拟化**：表头在滚动容器外置（普通流），纵向天然不随滚；横向经 `vbody scroll → vhead.scrollLeft` JS 同步（表头不能进 x-for 容器——ownsChildren 下其元素子节点全部是项模板会被克隆；经典双滚动区方案）。
- **行定高 40px**（CSS `height:40px` 与 `x-for-options="{ itemHeight: 40 }"` 配套显式声明——autoDetect 首渲染自败，list/select 同款约束；与字号档位解耦，覆盖须同改两处，文档披露）。virtual 是编译期选项无法 props 响应，分叉即响应式接线（list 同款）。
- 渐进增强：须同页引入 `autospark.virtual.js`，缺席 warn 退化全量渲染（ADR-0041 决策 15 哲学）。

空态经 **x-show 兄弟段**驱动（`viewRows` 表达式），不用 x-empty special：分叉结构下 special 模板随分叉重复且虚拟策略与 special 互持路径耦合，兄弟段在两分叉各自一份（动态名 `empty` 出口共享调用方内容段）更简。

### 决策 4：单元格自定义——col-\<key\> 动态名作用域插槽

列键是运行时数据，无静态出口名可投；且双分叉各持一份出口，同名静态出口触发快照收集期去重（ADR-0056）——统一走**动态名对象形态** `x-slot="{ name: 'col-' + column.key, params: {...} }"`（ADR-0107，list row 出口同款）：动态名出口不入静态清单、不参与同名去重，运行期仅活跃分叉实例化投影。形参 `{ row, column, rowIndex, colIndex }`（内外层循环各自声明自定义索引名，规避 `$index` 嵌套遮蔽）；插槽名带连字符（`col-age`），DOM 属性小写化无影响。缺省单元格 inline 表达式：null 收敛空串 / 标量直出 / 对象 `JSON.stringify` 兜底。

### 决策 5：排序——viewRows 派生视图 + 三态轮转 + remoteSort 事件出口

排序态 `sortKey` / `sortOrder`（组件内部状态）+ `viewRows`（`rows × 排序态` 的 JS 通道派生视图——绑定通道对 props 晚注入不重算，家族纪律）；行 x-for 恒遍历 `viewRows`，排序变化整体替换驱动重渲。表头点击三态轮转（无 → 升 → 降 → 无），`remoteSort: true` 时只发 `sort-change`（`detail={ key, order }` 标量投影，冒泡——监听挂内层包裹，engine 根元素 `@事件` 失效边界）不本地重排。比较器：数值差分 / 字符串 `localeCompare`，`null` 视空，**数字字符串不隐式数值化**（"10" < "9"，文档披露；需要数值化由调用方预处理数据）。排序列从 columns 消失时复位排序态（防悬挂 key）。

### 决策 6：行选择——checkbox 组合消费 + 选中集单向内同步

- **checkbox 列组合消费 `autospark.checkbox`**（路线图授权素材；跨插件产物同页依赖）：行 / 表头勾选框经 `x-component:autospark.checkbox="{ checked: <布尔表达式>, indeterminate: <半选> }"` 实例化——props **值通道**携带标量布尔（字面量对象死环仅数组/对象值，布尔值 checkbox 测试先例），克隆体内组件实例与值通道均已实证可用；交互经 `@change` 事件通道调组件 method（方法仅事件通道可用的家族边界）。
- **选中集**：内部 `selectedKeys` 自持，变更**整体替换**驱动全行 checkbox 重求值（引用比较退化陷阱规避）；`selection` props（行键数组，状态引用注入）为**单向内同步**（外部整体替换生效 + 初始化一跳收口补读初值——props 注入可晚于 watch 注册；行内交互不回写调用方状态）；变更经 `selection-change`（`detail={ keys }` 标量投影）外发。
- **行键**：`rowKey` props（缺省 `"id"`）；字段缺失回退行索引（排序后选中集跟随位置而非数据——限制披露，建议行数据恒含 rowKey）。全选 / 半选经表头 checkbox 的 `checked` / `indeterminate` 双值通道派生。
- **已知成本披露**：`selectable=false` 时选择列经 x-show 隐藏（克隆体内禁 x-if——共享快照串台，ADR-0021 后果 3），checkbox 实例仍会实例化（仅不可见）：非虚拟千行级表格为数百隐藏实例，虚拟表格仅窗口内（约 20）——接受为 v1 边界。

### 决策 7：外观与横向滚动（视觉基线对齐：card/alert 定型）

样式基线继承 ADR-0018 决策 6（button 范式），并按同域现役件对齐变量消费面：**内距**经 `--asc-pad` 中转（`--auto-padding`，随 `data-spacing` 档位）calc 派生（card 同款）；**选中行高亮**经 `--asc-tone` 中转（`--auto-primary-color`）+ `color-mix` 派生（alert 定型语义色组织），`:has()` 探内层勾选态驱动（零额外绑定）；`bordered`（外框，false 转透明色占位稳定）/ `striped`（斑马纹经 `:data-alt="$even"` 数据通道——虚拟分叉垫片元素破坏 nth-child 奇偶，数据通道免疫）/ 行悬停 `--auto-hover-bgcolor` 语义 token；字号经 `data-size` 主题通道不设自有字号（虚拟分行高除外——定高约束）。**横向溢出走原生滚动**（`overflow:auto`）：x-scrollbar 指令须标注在滚动容器元素上，而容器是组件内部结构消费者不可达——组合不可行（v1 边界，P3 可经 props 透传选项重开）。排序指示用纯 CSS 三角伪元素（SVG 子树指令不编译边界，progress 先例）。

### 决策 8：v1 裁剪清单（P3 增补面声明）

| 裁剪项 | 去向 | 说明 |
| --- | --- | --- |
| 固定列（左钉 / 右钉） | P3 | 需双渲染区（锁定列 + 滚动列）结构，与网格列模板联动 |
| 列宽拖拽（resizable） | P3 | 表头拖把手 + 列宽状态化回写 columns |
| 分组表头（多级表头） | P3 | 列定义 children 树 + 递归表头渲染 |
| 树形数据（展开行） | P3 | 与 x-tree 语义重叠，先由 x-tree 承接 |
| 行点击 / 双击事件出口 | P3 增补面 | v1 交互经插槽内容原生冒泡（`@click` 写在 col-\<key\> 插槽内） |
| 分页 | 不做 | x-for.paging / P2 pagination 组件组合承接（路线图既有分工） |
| 单元格 tooltip 溢出提示 | P3 | tooltip 特性组合（title 通道） |
| 汇总行 / 自定义表头插槽 | P3 | v1 表头走列定义 title 声明 |
| 多选标签化 / 跨页全选 | 不做（pagination 未并入） | 随 pagination 组合形态另议 |

## 备选方案

- **语义 `<table><thead><tbody>` 结构**：否决——happy-dom 下 table 语境 `<template>` content 丢失（决策 2 实测边界），规范 template 形态行内挂载不可用；语义损失经 ARIA role 弥补。
- **单分叉全 grid（普通 + 虚拟同构）**：否决——普通模式丢失 `table-layout:auto` 内容自适应列宽（grid 列模板显式化后每列需手工定宽），中低频小表体验劣化；CSS table / grid 双分叉各取所长，共享单元格视觉样式。
- **选择列并入列循环（复合项 + x-show 分支）**：否决——复合项使静态选择单元格随列重复克隆，表头全选 checkbox 多实例浪费且状态冗余；template 形态行内挂载天然支持静态列 + 循环列共存。
- **行 `:key="row[rowKey]"`**：否决——evalKey 闭包仅见循环变量（`new Function(item, index)`），组件域 rowKey 引用即 ReferenceError 静默回退 index 键；显式省略（index 键）语义一致且无假象。
- **空态用 x-empty special（list 同款）**：否决——双分叉各持 special 模板随分叉重复 + 虚拟策略 `specialActive` 短路路径耦合；x-show 兄弟段（viewRows 表达式驱动）结构更简且空态满宽铺展（列内 colspan 语义已随语义 table 一起退役）。
- **选中集直接引用 selection props（双向）**：否决——组件内写调用方引用数组属原地变更（不发信号，引擎跨域边界），且选中交互高频回写调用方状态易环；单向内同步 + 事件外发是家族既定受控范式（tabs/button-group 同款）。
- **virtual 分叉把 vhead 做成 vbody 的 sticky 子元素**：否决——x-for ownsChildren 下容器元素子节点全部是项模板，表头会被随行克隆。

## 后果

- `autospark.table` 交付：注册名 `autospark.table`，产物 `autospark.table.js`（IIFE，全局名 `AutoSparkTable`）；测试 `src/__tests__/components/display/table-plugin.test.ts`（25 用例全绿，单文件稳定复跑）；元素名快速写法 `<x-table>`（静态属性折叠 props + `:expr` 动态 props 折叠值通道）。
- **跨插件产物依赖声明**（按需加载须同页引入，聚合产物 `autospark.plugins.js` 无此问题）：`autospark.empty.js`（空态兜底，恒需）；`autospark.checkbox.js`（`selectable: true` 时）；`autospark.virtual.js`（`virtual: true` 时，缺席退化全量渲染）。
- 实证并固化的引擎边界（后续组件照此规避，根治归 engine 侧）：
  1. **语义 table 语境 `<template>` content 丢失（happy-dom）**——table 插入模式的模板内容切换未实现；含表格结构组件用 CSS display:table 全 div 或行内循环改容器复合项；
  2. **evalKey 表达式闭包仅见循环变量**——`:key` 引用组件域 / 调用方状态静默 ReferenceError 回退 index 键；
  3. **嵌套 x-for 内层渲染比外层晚一跳**——首屏断言双跳等待；消费侧 watch 级联同理；
  4. **props 初值注入可晚于组件 mounted 的 watch 注册**——受控内同步须在初始化一跳收口补读初值（本件 selection 通道实证）；
  5. **x-for.virtual 窗口重排行序倒置（引擎缺陷，真浏览器实证）**——`_renderWindowRange` 重排分支正向遍历 + `insertBefore(ref)` + `ref = node` 逐项前插使行序**视觉倒置**（万行表滚到任意位置首行均为窗口末项；裸引擎最小复现实证，list / select virtual 同受影响——非本件引入）。窗口数 / 垫片 / scroll 几何 / data-index 均正确，仅序倒置；修复在 engine（重排应反向遍历或对齐全量 render Pass 3 的从后向前锚点推进），修复后本件 virtual 形态即正。
- 真浏览器验证（Playwright + 临时 IIFE 产物 + Bun.serve 路由映射）：基础渲染 / col 插槽 / 斑马纹 / 对齐；排序三态 + sort-change / 行选择（受控初值 [2] 勾选态、半选、全选）/ selection-change / loading 覆盖层；virtual 万行窗口化（窗口 18 行、垫片 399280px、scrollHeight 400000、data-index 跟随、排序联动）——唯行序倒置为上述引擎缺陷（裸引擎复现排除本件因素）。
- 全量测试套件下本测试文件与 carousel 等组件存在跨文件串扰（污染修复 agent 在途，并行责任面）——单文件运行稳定全绿，串扰根因与修复不属本件范围。
- P3 增补面（决策 8 表）回访时须重估：固定列与网格列模板的联动、表头插槽与分组表头的出口形态、行选择跨页语义随 pagination 组合定形。
