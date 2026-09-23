# ADR-0054：组件指令更名与语法职责分离（x-define 定义 / x-component 实例化）

- **状态**：Accepted（已实施，1288 测试通过）
- **日期**：2026-09-23
- **关联**：[ADR-0022](0022-x-component.md)（组件系统，本 ADR 更名其决策五的 x-use 词汇与对象字段识别）、[ADR-0052](0052-x-overlay-and-x-dialog.md)（x-dialog:名称 属性参数先例）、[ADR-0053](0053-component-data-boundary.md)（选项属性随更名拆分为 define/options 两族）、[ADR-0031](0031-script-type-namespace.md)（废弃词汇处置惯例参照，本次选择更激进的彻底移除）、[CONTEXT.md](../../CONTEXT.md)（组件定义 / 组件实例化 / props 注入词条 + 两条废弃词条）
- **共识来源**：grilling 两轮 + 补充确认（12+ 决策点），本文即共识落盘

## 背景

ADR-0022 建立的组件词汇存在三处不对称：

1. **词汇不对仗**：定义叫 `x-component`，实例化却叫 `x-use`——「组件」一词在实例化侧缺席，与 `x-icon` / `x-icon-define` 已有的「消费正名 + define 后缀」命名法割裂。
2. **职责混杂**：实例化写法 `x-use="{ name: 'counter', count: 100 }"` 把组件名混在 props 对象里，靠 `name`/`is`/`component` 特殊字段识别——组件名（结构信息）与 props（数据）两种职责挤在同一载体，且 `name` 等常见业务键被特殊语义占用。
3. **先例不一致**：`x-dialog:<名称>`（ADR-0052）已确立「属性参数承载组件名」的家族语法，x-use 仍是旧形态。

## 决策

### 一、定义侧更名 `x-define`（值承载组件名）

`<div x-define="counter">…</div>`。对齐 `x-icon-define` 命名先例；无值取 `default` 的既有约定沿用。定义与实例化是相反操作，语法形态区分开（值 vs 属性参数）反而降低视觉混淆。

### 二、实例化侧更名 `x-component:名称`（属性参数承载组件名，值专职 props）

| 写法 | 语义 |
|---|---|
| `<div x-component:counter></div>` | 无 props 实例化 |
| `<div x-component:counter="{ count: 100 }"></div>` | 对象字面量 props |
| `<div x-component:counter="order"></div>` | 状态对象按键展开为 props（v-bind="obj" 心智） |

**无属性参数（`x-component="xxx"`）warn 缺组件名并跳过实例化**——值专职 props、名字专职属性参数，职责单一；值恰为纯标识符时 warn 附言「若是组件定义请改用 x-define」（属新语法错误提示的完善，非兼容层）。

**放弃响应式组件名**（grilling 权衡）：属性参数是静态字符串，编译期可知（名字拼错编译期即 warn）；条件切换组件用外层 x-if 表达。换取的确定性优先于动态切名能力。

### 三、props 注入语义（三形态统一）

- **字面量成员引用状态**（`"{ count: order.count }"`）：表达式支路依赖收集，成员路径级触发；
- **纯状态路径**（`"order"`）：**深层触发**——路径支路透传 `depth:2` 订阅（子键增删改/整体替换均触发，对齐 x-bind 展开先例 ADR-0043；grilling 阶段曾设想 `order.**` 通配，实施期改用语义等价的 depth 订阅），内部任意键变化重求值；
- **混合**（`"{ count: order.count, step: 5 }"`）：同字面量形态。

三形态更新统一为「重求值 → `Object.assign` 覆盖出现键」：组件内部状态不被重置、绑定的状态对象删键后旧键残留（**不做镜像同步**）。**单向数据流**——外部状态 → 组件 data 域，组件内修改不回写外部标量状态（双向是 x-model 的职责）；成员值为对象引用时传入 store 响应式代理引用，外部深层变化可见（JS 引用语义的自然结果，不做额外承诺）。

`name`/`is`/`component` 特殊字段识别**废除**——组件名已由属性参数承载，这些键回归普通 prop 名，无歧义。

### 四、选项属性拆分

| 新名 | 侧 | 语义 |
|---|---|---|
| `x-define-options` / `x-define.open` | 定义侧 | 原 `x-component-options` 的 open/scope 声明（ADR-0053） |
| `x-component-options` | 消费侧 | 原 `x-use-options` 的 scope 覆盖 |

解析层天然成立：`-options` 后缀分支把 `x-define-options` 归属 `define`，`x-component-options` 归属 `component`（新实例化指令），零解析改动。

### 五、废弃处置：彻底移除，无兼容层

- `x-use` / `x-use-options` **彻底移除**：注册表不注册、静默失效、无运行时诊断（比 ADR-0031 的 warn 剪枝更激进——grilling 明确选择干净硬切，靠文档与 demo 全量迁移）。
- **旧定义写法技术上不可兼容**：`x-component="counter"`（旧：定义）与 `x-component="…"`（新：缺组件名的实例化）完全同形，语义翻转无法在解析层区分，只能硬切。
- 迁移面（grilling 全量扫描）：`docs/demos/**` 14 个含 x-use 的 html、`docs/zh/guide/component.md`、engine 测试套件、CONTEXT.md 术语表。

### 六、内部实现：对称互换

`use.ts` → `component.ts`（`UseDirective` → **`ComponentDirective`**，priority=70/singleton/U3 冲突检测/T5 递归保护/R6 异步占位全套随迁）；名位类 `component.ts` → `define.ts`（`ComponentDefineDirective`）；类型文件 `component-def.ts` 不动；`OverlayDirective` 继承与 `UseDirective.MAX_DEPTH` 等引用机械更新；compiler `_collectComponent` 拦截名与 `_mergeComponentRootAttrs` 跳过清单（`x-define` 族属性）同步更新。

## 测试

`src/__tests__/x-component-props.test.ts` 12 用例（本 ADR 新语义专项）：无属性参数 warn（含纯标识符附言）、无值无 props 实例化、字面量成员状态引用响应式、纯状态路径按键展开/子键变/新增键/整体替换+删键残留、单向性（组件内改不回写）、name 字段回归普通 prop、标量 props 值 warn、x-use 静默失效。既有 x-component / 边界 / overlay / loading / data-script 套件全量迁移改写（含删除「值变化切换组件」用例——能力随决策二移除）。

## 实施修订记录

1. **定义指令二次更名**：grailing 共识为 `x-component-define`，实施期用户拍板缩短为 **`x-define`**（`x-component-define-options` → `x-define-options`、名位类 `ComponentDefineDirective` → `DefineDirective`、注册键 `"define"`）。本 ADR 正文按终名记录。
2. **深层触发机制**：决策三的纯状态路径订阅由设想的 `order.**` 通配改为 `binding.watch(value, listener, { depth: 2 })`——与 x-bind 展开同构的既有先例，用户可见行为一致（子键增删改/整体替换全触发）。
3. **「值变化切换组件→基准重置」用例删除**：该行为依赖响应式组件名（决策二已放弃），`_destroyInstance` 随之移除（YAGNI）。

## 废止

- ADR-0022 **决策五**的 x-use 写法双轨（字面量名 / 对象 name 字段识别）与 `x-use-options`——机制由本 ADR 的属性参数 + 值专职 props 取代；其实例化机制（宿主化身组件根、属性继承、递归保护、异步占位）不变。
- ADR-0053 中的 `x-use-options` / `x-component-options` 词汇引用——语义不变，按本 ADR 第四节拆分更名。
