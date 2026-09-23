# ADR-0053：组件数据边界（默认封闭 + open/scope 基准）

- **状态**：Accepted（已实施，1264 测试通过）
- **日期**：2026-09-22
- **关联**：[ADR-0022](0022-x-component.md)（组件系统，methods 边界的来源）、[ADR-0029](0029-x-data-mount.md)（x-data mount，相对挂载收口）、[ADR-0052](0052-x-overlay-and-x-dialog.md)（overlay scope 基准，本 ADR 将其泛化为家族概念）、[ADR-0007](0007-directive-options-and-modifiers.md)（配置体系，选项/修饰符形态）、[CONTEXT.md](../../CONTEXT.md)（组件数据边界 / 开放边界 / scope 基准三词条）
- **共识来源**：grilling 五轮决策（边界范围、正交双概念、解析链、通道收口、兼容策略等约 20 个决策点），本文即共识落盘

## 背景

ADR-0022 建立组件系统时，组件实例 scope 的 parent 链直通宿主 scope，`getContext` 聚合视图沿链透传——组件内表达式天然读到外部一切上下文（宿主的 x-data 域、x-for locals 等）。这在「组件即模板片段」的语境下自然，但与组件的封装性目标冲突：同一组件在不同消费位置行为不同（外层同名键被意外遮蔽/泄漏），不可移植。

当时唯一的数据边界是 **methods 查找边界**（ADR-0022 决策二-3：`getMethod` 遇 `isComponent` 祖先即停，禁止子组件被动继承父组件方法）——数据视图没有对应机制。

本次升级将「组件默认封闭」确立为契约，并提供受控开放通道。

## 决策

### 一、默认封闭与适用范围（家族划分）

**组件实例化家族**（`compileChild` 传入 `componentDef` 的路径 = **x-use 实例化 + overlay 实例化**）的实例默认**封闭数据边界**：组件内表达式只能读自身 `data()`/`locals`、x-use props、全局 state。

**不在家族内**（维持现状，零影响）：x-loading 遮罩、x-empty、x-tree 行模板等**模板片段渲染**（不传 componentDef）。它们的本质是「原地 UI 替换」，消费宿主上下文是存在理由（自定义 loading 组件读宿主状态、自定义 tree-node 模板读外层状态是既有能力）。

机制判据：边界语义挂在 x-use 实例化调用点（`instantiateComponent` 新增 `basis` 参数，缺省不施加），overlay 路径与 `compileChild` 直调路径天然不受影响。

### 二、正交双概念：open（开关）× scope（基准）

grilling 中曾将两者压成单维度（open ≡ declarer），后修正为**正交双概念**——open 回答「是否开放」，scope 回答「开放时继承谁」：

| 概念 | 载体 | 语义 | 侧 |
|---|---|---|---|
| **open** | `x-component.open` 修饰符 ≡ `x-component-options="{open:true}"` | 是否开放边界的开关，默认封闭 | 仅声明侧（作者契约） |
| **scope** | `x-component-options.scope` / `x-use-options.scope` | `'host'`（消费处上下文，默认）\| `'declarer'`（声明处上下文，词法基准） | 作者默认 + 消费侧覆盖 |

- **host**：继承消费处上下文（实例 scope 的结构 parent 链）——即封闭化之前的既有行为，`open` 无限定词时的默认基准（「把现在这条边界放开」的最小惊讶语义）。
- **declarer**：继承声明处上下文。嵌套私有子组件的声明 scope 是外层组件的**实例 scope**（运行期 scope 链，ADR-0022 决策七实施修订），故树组件等复杂组件的内部共享数据精确命中。
- 两者正交组合，无冲突规则（`open:true` + 任意合法 `scope` 均为有效声明）。

### 三、解析链与校验

```
x-use-options.scope        ← 消费处覆盖（仅已开放组件生效）
        ↓ 未声明
x-component-options.scope  ← 作者默认（须配合 open）
        ↓ 未声明
'host'                     ← 开放状态的默认基准
```

与引擎「局部覆盖、外层兜底」的查找哲学同构。三条**失效告警**（均 warn 一次 + 忽略）：

1. 作者声明 `scope` 而无 `open`——基准没有生效条件；
2. 消费侧对**封闭组件**声明 `x-use-options.scope`——封闭是作者契约，消费侧只能换基准、不能打开；
3. `scope` 值非法（非 `'host' | 'declarer'`，含把修饰符布尔 `true` 误当基准值）——忽略后开放组件回落默认 `'host'`。

`open` 的显式 options 键优先于 `.open` 修饰符（`{open:false}` 可关掉修饰符）。`x-component` 声明属性支持修饰符形态（`x-component.open`，属性名带 `.` 段、值仍是组件名），收集器同步扩展匹配与解析；未知修饰符 warn + 忽略。

### 四、封闭语义与通道收口

封闭 = 数据视图的上溯止步，收口**三处**（均在 `AutoSparkScope` / x-data）：

| 通道 | 处置 |
|---|---|
| `getContext()` 聚合视图 | 边界 scope 的 parentView 改指 `engine.state`（读+写一并切断——同一 Proxy 机制，无独立开关） |
| `hasLocalContext()` 探测 | 沿链止步于边界 scope（自身 locals/_data 仍在界内）；影响 `watch`/`read` 的支路选择 |
| x-data 相对挂载 `..` 上溯 | 越过边界 scope 即越界落根（沿用越顶落根语义）；边界 scope 自身的数据域仍在界内、可为挂载容器 |

**保留开放/不变**的通道（封闭只封数据视图，其余正交）：

- 全局 state（`engine.state`、`this.state`、`@` 配置绑定）——封闭点自然回退 state 根，全局态是环境而非隐式耦合；
- `getAction` 沿链查找——action 定位是跨组件复用的事件处理器（ADR-0022 既有分叉决策）；
- `getComponent` 定义查找——定义解析不是数据；递归深度统计走结构链，不受影响；
- `this.$parent` 显式向上寻址——主动声明，非被动继承；
- methods 边界——本就有界，`open` 不改变它（数据开放 ≠ method 穿透）；
- `<style>` bind() 订阅——走 `hostScope.watch`，随基准自动生效（全局 state 字段照常可订阅）。

实现载体：`AutoSparkScope` 新增 `dataBoundary`（封闭标志）与 `declarerDataScope`（declarer 基准挂链目标，与结构 parent 链解耦——结构链仍走消费处，供挂接/销毁级联/getAction/getComponent 使用）。基准施加后 `invalidateScopeView()` 失效聚合视图缓存。

### 五、全局组件与悬空守卫（declarer 的两类退化，均 warn 一次 + 降级封闭）

1. **全局组件**（`options.components` 字符串、x-import `.global` 注册）无声明 scope → declarer 退化为封闭行为（语义自洽：声明的就是引擎级），按组件定义去重 warn 一次；
2. **悬空**：declarer 指向的声明 scope 已销毁（如声明在 x-if 分支内、分支切假销毁）→ 数据视图降级为封闭（不悬挂引用、不读已删数据），按实例 scope warn 一次。相对挂载上溯遇悬空等同越顶。

`x-use` 换组件名重实例化时，旧基准标志与视图缓存一并重置（`_destroyInstance`）。

### 六、与覆盖物家族的关系（机制共享、基准统一）

overlay 实例**本就是组件实例化家族的兄弟物种**（同样传 componentDef）。ADR-0052 修订版（组件化统一）将家族基准**完全统一**到本 ADR 的两值：

- 覆盖物 `scope` 配置即 `'declarer' | 'host'`（默认 declarer，定义闭包）——`'consumer'` 更名废弃（warn + 按 host 处理），词汇不再分家；
- 覆盖物「挂链即基准」：parentScope 直接挂声明处/消费处 scope，表达式上下文 / 数据视图 / 生命周期由挂链统一表达；
- 机制层共享同一套基准 enforcement（`dataBoundary`/`declarerDataScope` 的三处收口）。

### 七、兼容与迁移（硬切，无运行时诊断）

**硬切**：默认值翻转后，既有越界读取静默失效（读到 undefined 或 state 同名键）。放弃 warn 诊断（编译期静态检测越界依赖）的理由：诊断需对每个绑定做边界外键扫描，成本与误报风险换不来迁移正确性——修复动作（改 props / 声明 open）只能由人判断。仓库有硬切先例（x-block→x-component）。

迁移评估（grilling 期间全量扫描）：`docs/demos/**`（193 html，15 个含 x-component）与 `docs/zh/**/*.md`（40 md，7 个含 x-component）**零不兼容**——既有示例的组件模板数据来源全部落在自身 data()/props/全局 state/引擎注入 `$` 变量/豁免路径内。三个「合规但相依」回归点（style-bind 的 bind() 读全局 state、context 的裸标识符落全局 state、x-tree 的 `$props`）均随「全局态可见」保持工作。

### 八、实施修订记录（顺手修复的既有缺陷）

实施中发现**既有 bug**：组件快照根的**直接子元素**若为 x-component/x-icon-define/x-overlay 声明，`compileOneChild` → `transformElement` 以其为根时收集器返回 null 触发「根元素被转换器丢弃」抛错（收集本身已完成，但中断当次 flush，产生错误日志）——同函数对 x-else-if/x-case 有预检，声明性收集器被遗漏。修复：compileOneChild 预检三个收集器并直连（收集 + 剪枝，与深层嵌套路径语义一致）。修复后既有 x-component 套件的 4 条异常日志清零。

## 测试

`src/__tests__/x-component-boundary.test.ts` 19 用例：封闭默认（读切断/全局态可见/props/写切断）、open 双语法等价、declarer/host 基准、消费侧覆盖、三条失效告警、全局组件退化 + warn 去重、open 不传播、嵌套私有组件开放、相对挂载越界落根、getAction 越界开放、methods 边界不随 open 改变、换组件基准重置。

## 废止

- 无。ADR-0022 的组件数据行为（透传）被本 ADR 取代，其 methods 边界（决策二-3）继续有效。
