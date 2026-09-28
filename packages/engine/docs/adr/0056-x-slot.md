# ADR-0056：x-slot 插槽指令（组件模板出口与内容投影）

- **状态**：Accepted（设计 grilling 共识已达成，实施中）
- **日期**：2026-09-24
- **修订**：2026-09-28 覆盖物侧内容归属就地修订（grilling 第四轮 Q1–Q13，用户确认）——推翻「宿主子节点自动继承为默认段」，改为显式声明 + `x-slots` 归属容器；仅动决策三/八/十、Consequences、实现注记，组件路径（决策一~七、九）不受影响
- **关联**：[ADR-0022](0022-x-component.md)（组件定义/实例化，本 ADR 为其补插槽投影面）、[ADR-0006](0006-x-isolate-directive.md)（旧 `x-slot` 更名腾名，本 ADR 复用该名新义）、[ADR-0040](0040-x-tree-rendering.md)（曾以「引擎无插槽机制」否决内置递归组件——本 ADR 改变该前提的插槽供给面，但节点模板经组件传递的路径结论维持）、[ADR-0052](0052-x-overlay-and-x-dialog.md)（overlay 覆盖物子节点去向）、[ADR-0053](0053-component-data-boundary.md)（组件数据封闭边界——插槽内容不受其约束）、[ADR-0054](0054-component-define-instantiation-rename.md)、[CONTEXT.md](../../CONTEXT.md)（插槽四词条）
- **共识来源**：grilling 三轮 Q1–Q17 + 7 条终局假设，前沿为空，用户全盘确认

## 背景

组件体系（x-define / x-component，ADR-0022/0054）已具备数据注入（props/state），但**模板内容投影**缺失：

1. **宿主子节点去向分裂**：x-component 子节点被主 walk 编译为**前缀**（docstring 承诺清空但无代码）；x-dialog 子节点**原地残留**（overlay 覆盖 `_instantiate` 不碰子节点）——两条路径行为不一致，均无测试覆盖。
2. **无法自定义组件内部结构**：消费者不能替换组件模板中的某段内容（页头/页脚/列表行等），只能整体另建组件。
3. **x-dialog 叠加层无内容出口**：宿主子节点残留在调用点、不进 body 覆盖物，用户无法给对话框正文传内容。

AutoSpark 需要一套**声明式内容投影**机制，语义对齐 Vue slot（命名/默认/作用域），接入现有组件编译管线。

## 决策

### 一、命名与类（Q1）

- 指令名复用 **`x-slot`**：旧 x-isolate 曾用此名（ADR-0006，2026-09-24 更名腾空）；本 ADR 赋予全新语义。
- 新类 **`SlotDirective`**（`src/directives/presets/slot.ts`），与旧 `IsolateDirective`（`isolate.ts`）**无关**。
- 注册键 `slot`；`kind = Compile`、`singleton = true`、`static ownsChildren = () => true`（出口/内容侧皆然，见决策十）。

### 二、定义侧：出口声明（Q2）

```html
<aside x-define="card">
    <header x-slot:header>默认页头</header>
    <!-- 命名出口，标记元素保留为包裹层 -->
    <div x-slot>默认主体</div>
    <!-- 裸 x-slot = 默认出口 -->
    <footer>固定页脚</footer>
    <!-- 无出口标记 = 组件固定内容 -->
</aside>
```

- **属性参数承载名**：`x-slot:header`；裸 `x-slot` = 默认出口（名 `default`）。
- **标记元素始终保留为真实包裹层**（不剥标签）——出口位置即 DOM 位置，fallback 内容有宿主。
- **出口清单从模板自动推断**：编译期收集带 `x-slot*` 的元素名进 `ComponentDef.slots: string[]`（复用 `buildComponentDef` 收集通道）。声明侧不做运行时校验，无对应出口的内容侧才校验（见决策九）。

### 三、内容侧：内容提供（Q3）

```html
<div x-component="card">
    <template x-slot:header><h1>自定义头</h1></template>
    <!-- 命名内容，标记元素保留 -->
    <p>裸子节点 = 默认插槽内容</p>
</div>
```

- **裸子节点 = 默认插槽**（无形参，见决策八）。
- **命名内容**用元素 `x-slot:header` 标记，标记元素保留为包裹层（与定义侧对称）。
- ⚠️ 以上仅限 **x-component 路径**：覆盖物消费者（x-dialog 等）宿主的裸子节点**永不参与收集**，内容须显式声明，见决策十（2026-09-28 修订）。

### 四、作用域语义（Q4、假设①④）

- **插槽内容在调用方作用域链求值**（Vue 语义）：内容进调用方 scope 编译，读调用方 state/locals，**不受 ADR-0053 组件封闭边界影响**（内容不进组件数据视图）。
- **fallback（默认内容）在组件作用域求值**：出口是组件模板的一部分，天然组件作用域。
- **作用域形参进内容 scope 的 `locals`**（假设④）：形参容器挂内容作用域，`getContext` 走 locals>data>parent 链；进聚合视图可被 `x-text` 等直接引用。

### 五、作用域插槽（Q5、Q7、Q8、假设③）

**v1 做作用域插槽**，三形态：

| 侧                 | 语法                                       | 语义                                                                                   |
| ------------------ | ------------------------------------------ | -------------------------------------------------------------------------------------- |
| 出口侧（组件模板） | `x-slot:header="{ item: row, index: i }"`  | 值=对象字面量，**在组件作用域**求值（复用 x-component props 三形态 + watch），注入内容 |
| 内容侧（调用方）   | `x-slot:header="{ item, index }"`          | 值=**解构形参**（自定义 `{ 键, 键 }` 解析，非 JSON），绑定注入对象                     |
| 默认内容要形参     | `<div x-slot="{ item }">`（命名标记+形参） | 裸子节点=默认插槽**无形参**；要形参须显式标记                                          |

- 出口值经 `watch` 订阅（假设③）：注入对象变化 → 形参容器 `Object.assign` 更新 + `scope.refresh()`（x-for 复用先例）→ 内容刷新（形参响应式）。
- 形参更新走既有 `locals` 非响应式刷新路径，不新建响应式通道。

### 六、出口位置与深度（Q6、Q12 不对称）

- 出口可在组件模板**任意深度**（嵌套出口合法）。
- 内容侧分段**仅认宿主直接子级**（见决策九）；命名段内部深层 `x-slot:*` → warn+忽略。
- **不对称是有意的**：出口是组件作者的结构声明（深度自由），内容是调用方的扁平投影（直接子级分段清晰）——写入文档。

### 七、无对应出口处置（Q9）

| 情形                                           | 处置                                                              |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| 内容名无对应出口（含裸子节点但组件无默认出口） | **warn + 丢弃**（不再保留宿主前缀行为，component docstring 收口） |
| 同名出口多个 / 同名内容多段 / 多个裸 `x-slot`  | **首个胜 + warn**                                                 |
| 出口无对应内容                                 | 渲染 **fallback**（出口子树原样编译）                             |
| 内容标记存在但内部纯空白                       | **视为已提供**（命名标记元素存在即覆盖，不回退 fallback）         |
| 裸子节点 trim 后全纯空白                       | **未提供**（回退 fallback；纯空白文本不构成默认内容）             |

### 八、收集通道（Q10）

- 内容侧收集：**x-component** `static ownsChildren = () => true`（x-if / x-for / isolate 范本）——结构指令接管子树编译，`_resolveOwnership` 归 component。**x-dialog / x-overlay 不占有**（`OverlayDirective.ownsChildren = false`，见决策十）：宿主子节点正常渲染，打开时从只读 template 克隆收集**显式声明的内容**（不是宿主子节点本身——裸子节点永不参与，决策十修订）。
- 出口侧收集：`SlotDirective.ownsChildren = () => true`——出口子树=fallback，手动编译（`compileChild` 挂 caller/component scope 由出口语境决定）。

### 九、内容分段规则（Q12）

- **仅宿主直接子级参与分段**：带 `x-slot:*` 的直接子元素切命名段；其余（含裸文本/未标记元素）按文档序合并为**单一默认段**。
- 命名标记元素**存在即视为提供**（空/纯空白也覆盖 fallback）。
- 裸子节点 trim 后全纯空白 = 未提供（回退 fallback）。
- 命名段**内部**深层 `x-slot:*` → warn + 忽略（内容侧无深层分段）。

### 十、overlay 内容归属（Q11、Q13；2026-09-28 修订）

> 原决策十为「宿主子节点打开时自动克隆收集（自动继承）」。实施期核查发现其必然把按钮标签等裸子节点收成默认段、覆盖 fallback（测试实证），且同一宿主上多个 `x-dialog` 无法区分归属。grilling 第四轮 Q1–Q13 重议后就地修订如下。

**规则集（11 条，覆盖物路径专有）：**

1. **裸子节点永不参与收集**——宿主子节点只属于宿主（按钮标签、触发容器内容照常留在原位），不构成任何覆盖物的内容。收集侧对裸子节点**保持沉默**（不 warn：这是绝大多数既有用例的形态）。
2. **内容必须显式声明**：`x-slot:*` 内容标记（与组件路径同语法）。
3. **归属由 `x-slots="覆盖物组件名"` 容器承载**（P3 方案）：容器值须命中宿主上的某个 `x-dialog:名称` 消费者；容器内即该覆盖物的内容集——容器内**裸子节点 = 该覆盖物的默认段**。
4. **`x-slot:` 冒号段全库恒为出口名**：归属不进 `x-slot` 属性，只在 `x-slots` 上——故 x-component 宿主与 x-dialog 宿主的**内容标记语法零分叉**（`x-slots` 不匹配插槽标记边界，多一个 s）。
5. **单消费者宿主可省容器**（标记直写宿主子级）；**多消费者必须各套容器**——裸标记无法判定归属 → warn + 丢弃。
6. **作用域插槽形参照常支持**（决策五不变，出口侧/内容侧两侧语法在覆盖物路径同样生效）。
7. **落点 `OverlayDirective` 基座**，载体沿用既有通道（`<template>` 展开 / 元素包裹），不新设载体形态。
8. **编译期剪枝**：容器与内容标记子级不进运行 DOM（收集在打开时从只读 `engine.template` 克隆，模板只读契约 ADR-0002）；**深层**内容标记按决策九处置——剥标记属性、元素保留为普通内容（否则 SlotDirective 会把 fallback 渲染进按钮）。
9. **`x-component` 与覆盖物消费者不得同宿主**：化身（子节点归组件）与声明点（子节点留原地）对宿主子节点的定位互斥 → 编译期 warn + **component 让步跳过实例化**（overlay 照常）。
10. **告警集**：`x-slots` 宿主无覆盖物消费者 → 编译期 warn + 剪枝；容器名不匹配任何消费者 → 收集期 warn + 丢弃；容器嵌套容器 → warn + 忽略内层；多消费者裸标记 → warn + 丢弃；组件无出口但显式提供了内容 → 收集期 warn + 丢弃（原静默改 warn）；宿主子节点裸节点 → **永远沉默**（规则 1）。
11. **收集通道不变**：`OverlayDirective.ownsChildren = false`，宿主子节点正常渲染；打开时 `_collectSlotContents` 走 `collectSlotGroups`（按归属分组）→ `collectSlotSegments`（按出口分段），组件无出口或本名组缺失时提前返回（不再回退全量子节点收集）。

### 十一、校验与警告时机

- 内容侧校验在**收集完成**时（懒收集于 `_instantiate`，见实现注记）：逐段比对出口清单，无主段 warn 丢弃；重复名 warn 首胜。
- 出口清单在 **x-define 收集期**生成（`buildComponentDef`），组件实例化时读取。

### 十二、与既有 ADR 关系（Q14）

- 本 ADR 编号 **0056**（现有最大 0055）。
- **ADR-0006 正文不动**（更名记录保持，x-slot 旧义历史）；仅在本 ADR 关联其腾名事件。
- **ADR-0040 正文不动**（否决当时成立：引擎确无插槽；节点模板三级优先的结论——不经插槽传递——维持，插槽是**另一条**组件内容通道，不改变 x-tree 节点模板来源决策）。

### 十三、文档同步（Q15）

1. **CONTEXT.md** 新增四词条：插槽（x-slot）、插槽出口（Outlet）、插槽内容（Content）、作用域形参（Slot Params）。
2. **CONTEXT.md 修正 4 处「引擎无插槽机制」旧断言**（L189 x-tree-children、L193 节点模板三级优先、L479 组件定义、L511 跨指令供体协议）——措辞改为「x-tree 行模板不经插槽传递」等精确表述，删「引擎无插槽」泛断。
3. **docs/glossary.md**（自称活文档）同步插槽章节。
4. **docs/comparison-vue3-vs-alpinejs-vs-autospark.md** L160 ❌→✅（autospark 列补 x-slot）。

### 十四、测试计划（Q16）

12 组（详见实现后用例）：命名/默认出口命中、fallback、无主 warn、重复首胜、裸子节点默认段、命名分段直接子级、深层忽略 warn、作用域插槽形参、形参响应式、调用方作用域求值、overlay 继承、x-dialog 子节点进覆盖物。
**2026-09-28 修订追加**（覆盖物归属）：裸子节点不参与收集（旧「子节点进覆盖物」用例改写为反证）、单消费者省容器投影 + 标记剪枝、多消费者 `x-slots` 分组各投各、多消费者裸标记 warn 丢弃、容器名不匹配 warn 丢弃、无消费者宿主 `x-slots` 编译期 warn 剪枝、无出口显式内容 warn、深层标记剥属性放行 + 收集忽略、混合宿主 component 让步。

## Considered Options

- **出口/内容标记元素剥除 vs 保留**：否决剥除——出口位置即 DOM 位置，剥了 fallback 就没了宿主；保留包裹层对称、简单、可 CSS 穿透。
- **出口清单显式声明 vs 自动推断**：否决显式声明（如 `slots: ['header']` 配置）——与 x-define 声明式哲学冲突，双份声明必漂移；自动推断零心智。
- **内容侧作用域=组件作用域（ADR-0053 式封闭）vs 调用方作用域**：否决组件作用域——内容是调用方的模板，读调用方 state 才是直觉；封闭边界是**数据注入**的边界（props/state），不约束内容投影。
- **形参 JSON vs 自定义解构解析**：否决 JSON——JSON 不允许裸键 `{ item, index }`，Vue 用户肌肉记忆是解构简写；自定义解析只处理 `{ 键, 键 }` 简式，复杂默认值可后续扩展。
- **分段含深层 vs 仅直接子级**：否决深层分段——`<div><span x-slot:header>` 嵌套语义模糊（span 是段内容还是段标记？）；直接子级清晰、与 Vue template 直觉一致。
- **内容保留宿主前缀（现状）vs warn 丢弃**：否决保留——现状是 bug（docstring 承诺与实现不符），两条 overlay/component 路径行为还分裂；统一 warn 丢弃，出口机制接管。
- **overlay 显式接线 vs 自动继承**（2026-09-28 重议）：原结论「自动继承（不需用户接线）」被**推翻**——实施期实证自动收集必然把按钮标签收成默认段覆盖 fallback，且多消费者无归属可分。三方案重比：**P1** 改走 `x-component` 实例化（否决：丢遮罩/打开栈/实例管理，语义不等价）；**P2** `x-slot:覆盖物名` 属性参数带归属（否决：`x-slot:冒号段` 全库恒为出口名，破规则 4 引分叉）；**P3 `x-slots="组件名"` 归属容器**（采纳：出口/内容语法与组件路径零分叉，多消费者有显式归属，单消费者可省容器保简写）。核心让步：**用「必须显式声明」换「归属永远无歧义 + 宿主子节点永不被误收」**。
- **形参响应式 vs 快照**：否决快照——出口 props 经 watch 变化是常态（列表行 index），形参不同步会导致投影内容陈旧；复用 x-for locals 刷新先例成本低。

## Consequences

- **行为变更**：x-component 带子节点从「前缀编译」→「收为插槽内容（无主则丢弃）」；x-dialog 宿主子节点**保留在原位**（按钮标签等照常渲染），打开时按 `x-slots` 归属（或单消费者省容器的显式标记）克隆投影进覆盖物——**裸子节点不再有任何隐式去向**（2026-09-28 修订：旧「自动继承」行为废止，既有无子节点用例不受影响，「子节点进覆盖物」旧用例已改写为反证）。
- **x-component × 覆盖物同宿主**：编译期冲突防护——component 检测到同元素覆盖物消费者即 warn 跳过实例化（子树既不归组件也不残留），与 U3（ownsChildren 结构指令）友好 warn 路径同构。
- **x-for / x-if 同元素冲突**：component 变 `ownsChildren` 后，`_resolveOwnership` 多 owner 抛错在 `scope.compile()`（created）**之前**跑——component/dialog 需计入所有权信号但**不计入**多 owner 抛错（或对齐通用抛错并改既有 U3 测试）。倾向保留 U3 友好 warn 路径（见实现注记）。
- **嵌套组件 content map 隔离**：各实例独立收集/编译填充，map stash 到组件宿主/实例 scope，出口指令沿 parent 链就近查找。
- **模板只读契约（ADR-0002）维持**：收集一律 `cloneNode(true)` 克隆，不摘模板原节点。
- **引擎体积/复杂度**：+1 指令类 + collect/component/overlay 三处接线 + 形参解析器。

## 实现注记（接缝处置）

1. **`_resolveOwnership` 时序**（compiler.ts:610）：多 owner 抛错在 `scope.compile()`（created 钩子）**之前**。component 变 `ownsChildren` 后与 x-for 同元素 → 先触发通用抛错而非 U3 友好 warn。处置：所有权解析阶段 component/dialog 计入 owner 但对「component 自身指令」豁免多 owner 抛错（U3 检测留在 `_instantiate` created 路径），或对齐通用抛错改既有 U3 测试——**倾向豁免保友好路径**，实施时定。
2. **内容懒收集时机**：content map 懒收集于 `_instantiate`（overlay 覆盖 created 不影响——`DialogDirective.created` 不调 `super.created`，收集勿放 created）。x-component 主路径 created 中 U3 早返回需确认不阻断收集。
3. **caller scope 挂接**：内容克隆节点脱离宿主，`_linkParent` 找不到父 scope。处置：参照 `compileChild` 手动建 scope 模式（显式传 `parentScope` + `localData`），或预注册 `templateScopeMap`；出口侧 `SlotDirective.ownsChildren` 编译 fallback 子树挂组件 scope。
4. **形参刷新**：`Object.assign(locals)` + `scope.refresh()`（x-for 复用先例，locals 非响应式）。
5. **content map 传递**：stash 到组件宿主/实例 scope；出口指令沿 parent 链就近查找（嵌套组件各持独立 map）。
6. **`engine.patch` 动态区域守卫**：`scopeOwnsChildren` 自动纳入 x-component（实施核查既有 patch×component 用例）。
7. **覆盖物归属收集（2026-09-28）**：`overlay._collectSlotContents` → `collectSlotGroups(host, consumers, warn)` 按 `x-slots` 分组（直接子级裸标记入隐式组供单消费者/多义判定）→ `groups.get(name)` → `collectSlotSegments` 按出口分段；组件无出口或本名组缺失 → 提前 return（不回退全量收集）。**编译期剪枝双写点**：`_getTransformers` 前置 transformer 与 `compileOneChild` 镜像判定共用 `_matchOverlaySlotNode` / `_pruneOverlaySlotNode`（与 x-else / x-define 双写点同惯例——子编译通道根元素交 transformElement 处理返回 null 会抛「根元素被丢弃」）；剪枝只动**结果树**，`transformElement` 原树只读，收集源不受影响。

## 废止

- 无 ADR 废止；本 ADR **改变 ADR-0040「引擎无插槽机制」前提**（其节点模板结论维持不变，正文不动）。
- component docstring「清空宿主子节点」承诺：由本 ADR 收口为「收为插槽内容，无主 warn 丢弃」。
- **本 ADR 内部**（2026-09-28）：决策十原「overlay 自动继承（宿主子节点打开时自动克隆收集）」废止，由修订后的决策十取代——覆盖物宿主裸子节点不再有任何隐式去向。
