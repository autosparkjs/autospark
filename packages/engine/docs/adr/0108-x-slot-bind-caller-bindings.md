# ADR-0108：x-slot.bind 调用方传递绑定

- 状态：已采纳（2026-10-12 grilling 共识落盘，实施随本 ADR 进行）
- 日期：2026-10-12
- 关联：ADR-0056（插槽机制主 ADR）、ADR-0107（$slots 与动态出口）、ADR-0043（属性展开）、
  ADR-0045（事件监听器键）、ADR-0053（组件数据边界——调用方作用域视图）、ADR-0084（x-super）

## 背景

调用方投影内容时无法定制**出口元素本身**的属性：出口元素（组件模板中带 `x-slot` 标记
的元素）的 class/style/属性/事件只能由组件作者静态书写（或组件作者主动 `x-bind` 展开
某个 props——需要双向约定且污染 props 域）。内容侧包裹元素（`<template x-slot:header>`）
上的属性随包裹层丢弃，不存在任何「调用方 → 出口元素」的单向传递通道。

`-options` 表达式通道（ADR-0007 修订）不是替代品：它跟随**指令实例所在作用域**求值
（出口侧 = 组件作用域，看不到调用方状态，方向相反）；内容侧包裹元素从不作为指令宿主
编译，`x-slot-options` 属性无处合并、连求值都不会发生。

## 决策

### 1. 传递方向与目标（单向：调用方 → 出口元素）

内容侧 `x-slot.bind="expr"` 的表达式在**调用方作用域链**求值（与插槽内容同一作用域
基准，`callerScope.watch`），展开结果应用到**出口元素**上。

> **实施补充（2026-10-13）**：“调用方作用域链”指**调用方视图**（`AutoSparkScope#getCallerContext`，
> 即内容 scope 的求值基准），不是调用方 scope 自身的聚合视图。组件路径的宿主 scope 被
> x-component 化为组件实例根（带 ADR-0053 封闭边界），其聚合视图只回退到全局 state——
> 绑定表达式若按聚合视图求值，会取不到使用方 `x-data` 局部域（内容却能取到，两侧基准
> 不一致）。故 `scope.watch(expr, …, { context: "caller" })` 新增该通道：
>
> - 求值视图取 `getCallerContext()`——使用方 `x-data` 域 + locals 可见、组件 `_data`/边界跳过；
> - 订阅路由按「该简单路径在调用方视图里是否仍解析自 store 根」二选一：是（全局 state 路径，
>   如 `x-slot.bind="attrs"`）→ `watchPath` 精准订阅，`depth` 键级响应与既有语义一致；
>   否（使用方 x-data 局部变量）→ 表达式支路，按实际读取收集 `$scopes.<id>.…` 依赖；
> - 常规（`context: "self"`）表达式支路不受影响——`depth` 的忽略边界仍是 x-bind 既有契约。
>
> 回归用例：x-slot 传递绑定组「调用方 x-data 局部状态」「调用方 x-data 局部变量：改状态 →
> 出口属性跟变」；demo 见 `docs/demos/slot/bind.html`。出口侧自带的 `x-bind`
（既有能力，组件作者书写）不改动，与传递绑定构成两层叠加：

```
组件静态属性 → 出口侧 x-bind → 调用方 x-slot.bind   ← 调用方恒赢
```

### 2. 语法：双属性正典 + 具名别名

| 形态 | 位置 | 含义 |
| --- | --- | --- |
| `x-slot:header="{ a, b }" x-slot.bind="{ … }"` | 使用处 | **正典**：形参与绑定正交共存（同一元素合写） |
| `x-slot:header.bind="{ … }"` | 使用处 | 别名（无形参时的人体工学简写）；`.bind` 存在时 value 重解释为绑定表达式 |
| `x-slot.bind="{ … }"` | 使用处 | default 槽绑定（与裸 `x-slot` = default 心智一致） |
| `x-slot="<{ a, b }>" x-slot.bind="{ … }"` | 使用处 | default 槽形参 + 绑定共存 |
| `x-slot.bind="expr"` | 组件内 | warn「调用方语法」+ **值仍按动态出口名处理**（ADR-0107 向后兼容） |
| `x-slot:header.bind="expr"` | 组件内 | warn + 修饰符忽略（静态出口照常） |

收集层**特设**合流（否决通用「伴随属性」语法机制——仅 slot 一个需求，YAGNI）：
`utils/slot.ts` 族谱扩展认识 `x-slot.bind`（`getSlotBindingsAttr`），形参读取在标记
属性即绑定属性时改取 plain 形参属性。`SlotDirective.singleton = true` 的同名覆盖问题
天然消解——内容侧属性由收集函数消费、从不进 `createDirectives`。

### 3. 载体规则：绑定与槽标记同生

传递绑定必须写在**槽标记元素自身**上：

- 命名槽 = 带 `x-slot:名` 的同一个元素（template 或保留包裹层的元素）；
- default 槽 = `x-slot="<{ a, b }>"` 形参载体元素，或（无形参时）一个**无子内容**的
  `<template x-slot.bind="…">`——空载体只贡献绑定、不构成默认段（存在即提供语义不变）；
  带子节点则按既有「首见者胜」参与内容竞争；
- 载体无任何附着内容（只有绑定、默认段未提供）→ warn + 丢弃（出口渲染 fallback，
  调用方绑定不可达——无内容即无 `SlotContent` 承载）。

### 4. 值语义：完全复用 x-bind 展开（SpreadBinder 单一实现）

表达式经 `callerScope.watch(expr, …, { depth: 2 })` 订阅（简单 state 路径 depth:2 键级
响应；表达式/局部上下文支路按读依赖重收集，同 x-bind 展开），应用委托 `SpreadBinder`：

- 四特判键（class/style/value/checked）走既有五路分派；`onXxx` 函数 → addEventListener；
  `true` 裸属性 / `false·null·undefined` 移除；整值 `null/undefined` 静默保留旧值；
  数组合并展开；对象值键 warn 剔除；
- `SpreadBinder` 与 `BindDirective` 解耦为最小宿主接口 `SpreadBinderHost`
  （engine/el/template/getOption/value/binding），语义零漂移、回归网共用。

### 5. 跨组件优先级：调用方赢

`SpreadBinder` 的 `reservedKeys`（后写静态恒赢）是**同一元素上的书写顺序**语义，
跨组件没有天然顺序——传递绑定通道固定 `template: null`（不收集保留键）：

- 其余键：调用方覆盖出口自身静态属性 / 出口侧 `x-bind` 的结果，或新增；
- `class`：走 classList diff **合并**——组件侧 token 永不被删，调用方追加/覆盖；
  token 顺序组件在前、调用方在后（后写覆盖先写、CSS 层叠直觉）；
- `style`：键级合并（组件侧同名属性被调用方覆盖；falsy 移除沿用 `:style` 既有语义）。

组件作者想「锁死」某属性：不写该键于绑定通道可达处，或在下游再覆盖。

### 6. 通道统一

绑定表达式挂在 `SlotContent.bindingsExpr` 上，随既有收集管道顺流——组件路径
（`collectSlotSegments` 共享）、覆盖物路径（`collectSlotGroups` → 同函数）、动态出口
（ADR-0107，段级承载与出口名解析正交）、live 段恒无（引擎编程式构造，自然跳过）。
零特判分支。

### 7. 销毁与响应边界

- watcher 由 `callerScope` 持有、随调用方卸载回收；出口 `destroy()` 将 `content`
  置 null，回调短路空转、不再写已分离的出口元素；
- 表达式**只看调用方状态链**：插槽形参（locals）对其不可见（形参在内容作用域，
  绑定在调用方基准作用域）——两者正交，各为其主；
- 包裹层普通静态属性**不**隐式转移（否决 fallthrough：`reservedKeys` 跨组件语义
  不可推理，只认显式 `x-slot.bind`）。

## 否决的替代

1. **`x-slot-options.bind="expr"`（零语法改动旁路）**：方向与作用域皆错（见背景），
   且内容侧根本不求值——不可行。
2. **修饰符带值单属性形态承载全部场景**（`x-slot:header.bind` 同时占 value 通道）：
   与形参值通道冲突（同名属性写不了两次），无法共存——故正典为双属性，别名仅作补充。
3. **调用方绑进 props、出口侧 `x-bind` 展开**：需组件作者双向约定、污染 props/数据域、
   无自动优先级——作为临时手工替代保留，不是机制。
