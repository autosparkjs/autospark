# ADR-0040：x-tree 树形渲染指令（嵌套子容器、展开惰性写回、三级节点模板）

- **状态**：Accepted（grill-with-docs，五轮二十七问）
- **日期**：2026-09-15
- **关联**：[ADR-0002](0002-template-readonly-contract.md)（模板只读契约）、[ADR-0007](0007-directive-options-and-modifiers.md)（选项回退链）、[ADR-0014](0014-empty-placeholder.md)（SameValueZero 惯例）、[ADR-0034](0034-x-if-else-branch-chain.md) / [0037](0037-x-switch-branch-selection.md)（分支家族防呆与名位指令惯例）、[0039](0039-animate-mechanism.md)（Animator 动画接入）、[CONTEXT.md](../../CONTEXT.md)（「树形渲染层」词条）

## 背景

`tree.ts` 注释骨架声明了树渲染意图：`x-tree="node of nodes"` 语法、`x-tree-node` 节点模板、json/list 双数据格式、`$level`/`$children` 循环注入、`defaultExpandLevel` 等配置。拷问过程中需求扩为「完整交互功能」：展开/折叠（含动画）、节点选中、复选框级联、懒加载、拖拽、事件广播，经 Q18 定为三批交付（P1 结构+展开+动画+事件+空态 / P2 选中+复选 / P3 懒加载+拖拽）。

拷问还触发了两次根基重审：①子树渲染结构（扁平连续段 vs 嵌套子容器）；②载体形态（x-tree 指令 vs 内置递归组件 + x-use）——本 ADR 固化这两次裁决及其论据。

## 决策

### 1. 结构：嵌套式子容器（否决扁平连续段）

DOM 即树（`ul > li > ul > li…`）。每节点行内经 `x-tree-children` 标记的元素为子容器，引擎对展开路径递归套用同一节点模板。裁决论据：单容器高度/淡入过渡、`display:none` 折叠保活、动画中断天然可逆、懒加载 loading 的天然挂载点、children 增量更新局部化——五维全面占优；扁平式唯一胜点虚拟滚动被判定为可后置的优化项（折叠保活已覆盖绝大多数场景），弃。

### 2. 语法与模板标记

- `x-tree="node of nodes"`，`of` 必写（与 x-for 一致，不做裸路径糖）；`node, index of nodes` 自定义序号名同 x-for 支持。
- 容器（x-tree 宿主）直接子元素**只认** `x-tree-node`（无值布尔标记，值 warn 忽略——Q2 裁决：不做节点字段匹配特化），其余 warn 丢弃（对齐 x-switch 非分支子元素惯例）。
- 节点模板内的子容器经 `x-tree-children`（无值标记）声明，取第一个、多余 warn；模板无子容器 → warn + 不递归（只渲染一层）。
- `x-tree-node` / `x-tree-children` / `x-tree-toggle` 均为**纯属性标记**（x-empty 模式：不注册指令名位，TreeDirective 按 `hasAttribute` 识别 + 收集期改写为 `data-x-tree-*` 保留属性——编译会剥除全部 `x-*` 指令属性，运行时 click 委托 / 子容器定位需可寻址标记），不注册 presetDirectives。

### 3. 节点模板三级优先（D 路线核心）

```
原地 <li x-tree-node>（用户定制）
  > tree-node 组件（scope 链 getComponent 就近 + engine.options.components 全局兜底）
    > 引擎内置默认节点模板（缩进 + 箭头 + nameField 字段名，零模板开箱）
```

与 x-loading 的 DEFAULT_BLOCK 组件覆盖机制同构；「用 x-use 消费树」由通用组件机制承担（用户 `x-component="my-tree"` 包一层 x-tree 容器即可），引擎不内置递归组件。

### 4. 载体：x-tree 指令（否决内置递归组件 + x-use）

组件方案的三处硬伤：引擎无模板插槽机制（x-slot 是隔离快照/远程子引擎，ADR-0006，非 Vue 式父传子模板），用户节点模板只能走「外部声明 tree-node 局部组件」窄路（定义地与使用地分离）；每节点一个完整组件实例（独立响应式域 + hooks）在大树下开销数量级放大；树域逻辑（建树/展开合成/级联/动画时序）进无 TS/lint/断点的模板字符串。「复用现有指令避免重复实现」是部分错觉——树的本质复杂度不因换壳消失，只是从 TS 指令类搬进组件模板字符串。指令方案对管线（compileChild/scope/watch/scheduler/选项体系/语义惯例）的复用本就全额兑现，增量仅树域逻辑。

### 5. 数据归一化

单根 `{...}` 与多根 `[{...}]` 归一化为根数组；`format:"list"`（默认 `"json"`）平铺记录按 `pidField` 建树，根 = pid 为空 **或孤儿提升**（pid 指向不存在的 id——避免静默丢数据）；id 重复 warn；循环引用检测（seen set）warn + 截断。默认字段名：`idField:"id"`、`childrenField:"children"`、`pidField:"pid"`、`expandField:"expand"`、`selectedField:"selected"`（P2）、`checkedField:"checked"`（P2）、`nameField:"name"`（内置默认模板显示字段）。

**实现期修订（三，2026-09-16）**：`format:"list"` 平铺建树整体移除——建树是**数据转换职责**，归数据层处理，渲染指令只接受嵌套（childrenField）格式。`format` / `pidField` 选项随之删除（残留配置静默忽略——项目未发布、无升级受众，不留防呆 warn）；孤儿提升、pid 移动节点特性一并消失（使用方转换数据时自行处理）；八元组 `$children` 的「list 格式为建树后」语义与 list 全层级联刷新机制同删，子层订阅模型简化为单一的逐层细粒度（每层三个 watcher）。

### 6. key：idField 唯一来源（否决 :key）

`:key` 在 x-tree 宿主上 warn 忽略——与 `idField` 职责重复（KISS/一职一义）。节点无 id 字段时回退**层级路径**（如 `"0-1-2"`）作复用 key。

### 7. 展开回退 + 惰性写回

有效展开态判定：`expandField 有值 ? !!值 : (level + 1 < defaultExpandLevel)`——回退规则**永不落盘**；仅用户 **toggle 时刻**写 `expandField = !有效值`。否决「defaultExpandLevel 初始化期写数据」：异步数据（x-data 异步源 / 整树替换）下初始化时机不稳，且反复污染源数据。`defaultExpandLevel = N` 即**前 N 层可见**（level ≤ N-2 的节点回退展开；默认 `1` = 根层可见、根不展开），声明 `<1` 的值 warn 并按 1 处理。`$level` 0-based（根 = 0，对齐 `$index` 惯例）。

### 8. 折叠两态：默认 eager + `.keepalive`

语义对齐 x-if 家族：默认 eager（折叠销毁子行 scope + 清空、大树省内存）；`.keepalive` ≡ `x-tree-options="{keepalive:true}"`（折叠仅 `display:none`，内容与 watcher 全保）。**挂卸自管**（否决 x-if/BranchHost 机制复用）：子容器位置天生固定（节点行模板的一部分），无需锚点/摘除重挂/兄弟位插入；`display` 翻转恰是 CSS 过渡的载体（detach 离开文档流会杀死退场动画）。真正的复用落在 compileChild 管线 + `.keepalive` 语义惯例。

### 9. 动画：接入 ADR-0039 Animator，默认 expand 高度过渡

子容器**整体** enter/leave（组动画，非逐行）：展开 → `engine.animate.enter(子容器, config)`；折叠 → `engine.animate.leave(子容器, config, onDone)`，回调做最终态（keepalive：`display:none`；eager：销毁 + 清空）——与 ShowDirective.toggle 的「离场延迟 display:none」同构。`animate` 选项沿用 0039 三形态（`'fade'` / `{name,duration,delay,easing}` / `{enter,leave}` / `false`）；抢占中断、首渲静默、eager 离场 inert 全部继承。

**实现期修订（二）**：初版结论「不做 `height:0→auto` 精确生长，用户自定义六类名 CSS 补足」被 demo 实测推翻——类名型动画 transition 的是 transform/opacity（不参与布局），展开时后续节点瞬跳到位、折叠时动画期间不动、播完 `display:none` 瞬跳收回，跳动只是被换个时点；而用户侧补足路径（max-height 曲线失真 / grid 0fr 单子元素约束——树子容器天然多行 / keyframes 定高）全部不适配树。正解是 Animator 新增**高度型内置动画 `expand`**（0039 决策 13：JS 测量自然高度 + `height`/`opacity` inline 过渡，`box-sizing:border-box` 对齐测量语义，结束还原 `height:''` 回归内容自然高度），x-tree 默认启用（`animate` 未配置时按 `'expand'`，显式配置任意动画名 / `false` 照常尊重）。浏览器实测：后续兄弟节点 top 连续变化（187.5 → 234.8 → 411.5），折叠精确复位。

### 10. 交互触点

默认**整行点击 toggle**；节点模板内 `x-tree-toggle`（无值标记，名位指令）收窄触点（仅标记元素触发，文件树「点箭头展开」场景；行内其他 @click 自行 stopPropagation）。P2：声明 `selectedField` 后整行点击自动改为**选中**，展开收窄到 `x-tree-toggle`（VSCode 文件树心智）；`x-tree-check`（名位）声明复选委托元素，级联规则 + `$indeterminate` 半选派生态见 P2 交付。

**实现期修订（四，P2/P3 交付 2026-09-16）**：click 委托定型为**三路分流**（check 标记 > toggle 标记 > 整行 select）。补充细节：选中为单选 toggle（再点取消；`multiSelect` 多选独立）；级联是数据层写入（折叠子树同生效），祖先行显式刷新 `$indeterminate`（新增属性不被表达式依赖收集——autostore 边界，同决策 7 通配绕行的因）；拖拽细节——事件名 `tree:drop`（detail 三段式 `{source, target, position}`）、三态阈值 25/50/25、环检测拒绝拖入自身子孙、单根数据根行仅 `inside`、收纳叶子目标先建 childrenField 容器（`childrenOf` 对缺字段返回临时数组，直接 push 丢数据——浏览器实测发现）。

### 11. 事件广播

`tree:expand` / `tree:collapse` / `tree:select`（P2）/ `tree:check`（P2）/ `tree:load`（P3），宿主 `dispatchEvent` + 冒泡，`detail` 统一 `{ id, node, level }`（id 取 idField 值，无 id 为 undefined；check 另带 `checked`、load 另带 `children`）。命名对齐 action 广播 `action:<name>` 惯例。

### 12. 空态与冲突

- `x-empty` 只认真空数组 `[]`（`undefined` 不认领，对齐 x-for——留给未来 loading 同款模式）。
- `priority = 100`、`ownsChildren` 恒 true；同元素声明 x-for → **compiler `_resolveOwnership` 编译期抛错**（既有所有权保护机制，同 x-for + eager x-if 同元素——实现期修订：原设想的「warn + x-tree 胜」被既有更严格的机制覆盖，不破例）。

### 13. 树循环变量（八元组）

`$level` / `$children`（原始子数据数组，list 格式为建树后）/ `$expanded`（含回退的有效展开态）/ `$leaf` / `$index` / `$first` / `$last`（兄弟内）/ `$parent`（父节点数据引用，根 null）；P2 增 `$indeterminate`。`$` 前缀对齐 x-for 派生变量惯例，不占用户自定义命名空间。

## 被否决的方案

- **扁平连续段**（虚拟滚动优先）：高度生长/折叠保活/懒加载挂载/中断反转/增量更新全面劣势，唯一胜点可后置。
- **合成 x-if 管子容器**：两态都 detach 离文档流，退场动画死路；子容器位置固定，锚点机制多余。
- **BranchHost 复用**：同上；树挂卸需求（display 翻转 + scope 循环）比其抽象更简单。
- **内置递归组件 + x-use**：无插槽机制、实例开销、无工具链模板、动画仍需 x-use 加挂点（见决策 4）。
- **measured-height JS 三段式自建**：0039 落地后属体系外异类；对齐统一 Animator（后由 0039 决策 13 在 Animator 体系内实现为内置 `expand`——否决的是 x-tree 私有自建，非高度动画本身）。
- **`:key` 表达式**：与 idField 重复。
- **初始化期写 expandField**：异步数据时机坑 + 源数据反复污染。
- **max-height 引擎内置动画**：大高度差下曲线失真不可接受。
- **x-tree-node 带值（节点 id/类型匹配特化模板）**：无真实场景输入（YAGNI），值 warn 忽略。
- **nodeClass / treeClass / expendClass 类注入选项**：类名归用户模板自管。
- **`expandField:"expend"` 拼写**：expend 意为花费，展开是 expand。
- **首版做选中/复选/懒加载/拖拽**：Q18 定分三批，API 面一次定形、实现可验证推进。
- **移除 list 后附平铺→嵌套转换示例 / 改造 demo 为转换教学**（修订三讨论）：不附——场景归使用方，引擎文档不背数据转换教程；demo 直接删除。

## 后果

- ✅ 四档渐进用法：零模板（内置默认）→ 原地 `x-tree-node` → `tree-node` 组件复用 → `x-component` 整树包装 + `x-use` 消费，全部走既有机制。
- ✅ 展开动画（默认 expand 高度过渡，后续节点平滑跟随）/折叠保活/懒加载挂载点（P3）由嵌套结构一次到位。
- ⚠️ 虚拟滚动不可行——超大树依赖折叠（eager 销毁省内存 / keepalive 按需）。
- ⚠️ 类名型动画（fade/slide 等）不参与布局——树上后续节点跳位，树的动画诉求由内置 expand 承担（见决策 9 修订）。
- 交付（P1）：`presets/tree.ts`（TreeDirective + 内置默认节点模板）+ `tree`/`tree-node`/`tree-children`/`tree-toggle` 注册（后三者为名位）+ compiler 名位剪枝 + `x-tree.test.ts` + `docs/zh/guide/directives/x-tree.md` 重写 + demo + CONTEXT.md 词条 + 本 ADR。
- 交付（P2/P3）：选中（`selectedField` / `multiSelect` / `tree:select`）+ 复选级联（`x-tree-check` 标记 / `checkedField` / `cascade` / `$indeterminate` / `tree:check`）+ 拖拽（`draggable` / 三态定位 / 环检测 / `tree:drop`），`x-tree.test.ts` 增 12 用例（浏览器端到端实测：级联半选、单选切换、inside 收纳含叶子建容器、after 跨层调岗、环检测拒绝）。未做：懒加载（P3 的 `tree:load`，未列入本轮）。
