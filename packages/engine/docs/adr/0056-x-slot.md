# ADR-0056：x-slot 插槽指令（组件模板出口与内容投影）

- **状态**：Accepted（设计 grilling 共识已达成，实施中）
- **日期**：2026-09-24
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

- 内容侧收集：**x-component** `static ownsChildren = () => true`（x-if / x-for / isolate 范本）——结构指令接管子树编译，`_resolveOwnership` 归 component。**x-dialog / x-overlay 不占有**（`OverlayDirective.ownsChildren = false`，见决策十）：宿主子节点正常渲染，打开时从 template 克隆收集。
- 出口侧收集：`SlotDirective.ownsChildren = () => true`——出口子树=fallback，手动编译（`compileChild` 挂 caller/component scope 由出口语境决定）。

### 九、内容分段规则（Q12）

- **仅宿主直接子级参与分段**：带 `x-slot:*` 的直接子元素切命名段；其余（含裸文本/未标记元素）按文档序合并为**单一默认段**。
- 命名标记元素**存在即视为提供**（空/纯空白也覆盖 fallback）。
- 裸子节点 trim 后全纯空白 = 未提供（回退 fallback）。
- 命名段**内部**深层 `x-slot:*` → warn + 忽略（内容侧无深层分段）。

### 十、overlay 自动继承（Q11、Q13）

- **x-dialog / x-overlay 覆盖物自动继承插槽**（不需用户接线）：`instantiateDetachedComponent` / `OverlayInstance` 传递 content map，出口在覆盖物 body 容器内填充。
- **宿主子节点行为**：覆盖物宿主是**触发点/声明点**（按钮标签、触发容器），非组件化身——`OverlayDirective.ownsChildren = false`，宿主子节点**保留在原位正常渲染**；打开时从只读 template **克隆**收集有对应出口的内容投影进 body 容器（拷贝语义，不清空宿主）。组件未声明出口时不收集（避免按钮标签被误收为 default 段）。

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

## Considered Options

- **出口/内容标记元素剥除 vs 保留**：否决剥除——出口位置即 DOM 位置，剥了 fallback 就没了宿主；保留包裹层对称、简单、可 CSS 穿透。
- **出口清单显式声明 vs 自动推断**：否决显式声明（如 `slots: ['header']` 配置）——与 x-define 声明式哲学冲突，双份声明必漂移；自动推断零心智。
- **内容侧作用域=组件作用域（ADR-0053 式封闭）vs 调用方作用域**：否决组件作用域——内容是调用方的模板，读调用方 state 才是直觉；封闭边界是**数据注入**的边界（props/state），不约束内容投影。
- **形参 JSON vs 自定义解构解析**：否决 JSON——JSON 不允许裸键 `{ item, index }`，Vue 用户肌肉记忆是解构简写；自定义解析只处理 `{ 键, 键 }` 简式，复杂默认值可后续扩展。
- **分段含深层 vs 仅直接子级**：否决深层分段——`<div><span x-slot:header>` 嵌套语义模糊（span 是段内容还是段标记？）；直接子级清晰、与 Vue template 直觉一致。
- **内容保留宿主前缀（现状）vs warn 丢弃**：否决保留——现状是 bug（docstring 承诺与实现不符），两条 overlay/component 路径行为还分裂；统一 warn 丢弃，出口机制接管。
- **overlay 显式接线 vs 自动继承**：否决显式接线——x-dialog 内容投影应零配置；覆盖物路径复用同一 content map 收集，自动透传。
- **形参响应式 vs 快照**：否决快照——出口 props 经 watch 变化是常态（列表行 index），形参不同步会导致投影内容陈旧；复用 x-for locals 刷新先例成本低。

## Consequences

- **行为变更**：x-component 带子节点从「前缀编译」→「收为插槽内容（无主则丢弃）」；x-dialog 宿主子节点**保留在原位**（按钮标签等照常渲染），打开时**克隆**有对应出口的内容投影进覆盖物——既有无子节点用例不受影响（零覆盖，已核查）。
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

## 废止

- 无 ADR 废止；本 ADR **改变 ADR-0040「引擎无插槽机制」前提**（其节点模板结论维持不变，正文不动）。
- component docstring「清空宿主子节点」承诺：由本 ADR 收口为「收为插槽内容，无主 warn 丢弃」。
