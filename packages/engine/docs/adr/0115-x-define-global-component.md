# ADR-0115：`x-define.global`——模板内联声明全局组件

- 状态：已接受（2026-10-15）
- 关联：承接 [ADR-0086](0086-runtime-component-registration.md)（全局表即时注册路径）、[ADR-0085](0085-component-registered-event.md)（凡注册必发事件）；对齐 [ADR-0007](0007-directive-options-and-modifiers.md) 决策 1（修饰符即同名布尔选项）；同构先例 [ADR-0058](0058-icon-symbol-and-icon-domain.md)（`x-icons.global`）；边界联动 [ADR-0053](0053-component-data-boundary.md)、继承联动 [ADR-0081](0081-component-define-inherit.md)/[ADR-0083](0083-async-parent-deferred-inherit.md)；全局三层源 [ADR-0094](0094-builtin-component-registry-and-unified-lookup.md)/[ADR-0111](0111-plugin-mechanism.md)

## 背景

此前全局组件的三条来源**都不在页面模板内**：

1. 构造选项 `options.components` / `builtinComponents` 字符串（懒预编译）；
2. `engine.registerComponent(code)` 运行时字符串注册（不传 `scope` 即全局）；
3. `x-import` / loader 的 `.global` 远程注册。

模板里的 `x-define` 则必须挂到**最近祖先 scope**——孤立声明（无任何建 scope 的祖先）编译期 warn + 丢弃。结果是：想在模板里就地声明一个「全引擎可用」的公共组件，必须退到 JS 配置或脚本，声明位置与使用位置被迫分离。

本决策开放第四种来源：**在模板中以声明属性直接把 `x-define` 注册进全局组件定义表**：

```html
<!-- 两种完全等价的写法 -->
<div x-define.global="card">...</div>
<div x-define="card" x-define-options="{global:true}">...</div>
```

## 决策

### 决策 1：落点 = per-engine 全局组件定义表，编译期即时注册

`x-define.global` 收集后写入 engine 私有的 `_globalComponentDefs`（全局组件唯一运行时名册，ADR-0086 单表），与 `registerComponent(code)` 全局路径同级、同生命周期：

- **即时**：编译期前置收集器命中即写表（不同于 `options.components` 的懒预编译）——编译顺序更早的 pending `x-component` 可经注册事件排水唤醒；
- 运行时注册表优先级天然高于构造选项，**不回写 `options.components`**（构造期事实源不突变，ADR-0086 既有纪律）；
- 作用域 = **本 engine**：`x-isolate` 子引擎天然隔离，随 engine `destroy()` 丢弃。

**不落入插件全局表**（`AutoSpark.components`，ADR-0111）。跨 engine 共享是插件作者的显式职责；模板由具体 engine 编译，声明逃逸到页面级共享会让「这份模板影响谁」不可见。

### 决策 2：两种语法完全等价——手工解析通道对齐 ADR-0007

`x-define` 被前置 transformer 剪枝、其 options 一直由收集器手工解析（`parseComponentDeclare` / `parseComponentOptions`），游离在 ADR-0007 通用机制之外；此前仅 `open` 一个键手工对齐了该约定。本决策把这条手工通道正式声明为 **ADR-0007 决策 1 的对等实现**，并新增 `global` 键：

- `.global` 修饰符 ≡ `x-define-options="{global:true}"`——修饰符是同名布尔选项的快捷写法，这是跨指令通用约定，不是 x-define 的特例；
- **优先级**：options 显式布尔值（含 `false`）压过修饰符——`{global:false}` 可显式关闭 `.global`（与 `open` 完全对称）；options 值非布尔 → warn + 回退修饰符值；
- 可与既有声明维度任意组合：`x-define.global.open="card"`、`x-define:inherit="base".global`；
- 未知修饰符的 warn 文案由「仅提供 .open」更新为「仅提供 .open / .global」。

`parseComponentDeclare` 的返回结构新增 `modifierGlobal`；编译期收集器与运行时 `parseComponentCode` 共用同一解析（「什么算合法声明」只有一处实现，ADR-0086 既有不变量）。

### 决策 3：global 跳过归属查找；非 global 孤立仍 warn 丢弃

- 声明带 global（修饰符或 options 布尔为真）→ **不再向上查找 owner scope**，无任何祖先 scope 也注册成功。「在任意位置声明公共组件」正是本语法的用途之一；
- 不带 global 的孤立声明**维持现状**：warn + 丢弃。**不照搬 `x-icons` 的「孤立静默归全局」**（ADR-0058 决策 4）——组件有就近遮蔽、数据基准、私有子组件等作用域语义，静默放大可见域会让「忘包 x-scope」的错误无声消失。升级全局必须显式。

### 决策 4：全局声明 `declarerScope = null`；`dataContext:'declarer'` 收集期拒绝

模板中的声明物理上有声明处祖先，但注册后全引擎任意位置可消费。若把 `declarerScope` 留为 owner，会产生「全局表 + 词法作用域」杂交：无关消费处实例化时数据视图挂回某个声明 scope、owner 销毁后悬空降级封闭且 warn，owner 链数据等于被全局组件偷偷带走。

故全局 def 与其他三条全局路径一致：`declarerScope = null`（全局即「脱离声明位置」）。

当 global 声明同时显式开放并选择 declarer 基准（`open` + `dataContext:'declarer'`，任一语法形态）时，**收集期 warn + 丢弃该基准**（回退 `'host'`），不拖到实例化才暴露；`open` 单独使用有效（全局组件可开放消费处上下文）。

### 决策 5：全局组件的继承父查找仅查全局表；局部父 fail-fast

`x-define.global:inherit="父名"` 的父组件解析：

- 父查找**仅全局表**（含三层声明源懒预编译与 pending 等待），与 `registerComponent` 全局路径、`options.components` 继承路径一致——不允许全局子继承作用域父（owner 一死，全局子即坏）；
- 父未在全局就绪时沿用 ADR-0083 pending 机制等待全局注册事件排水；
- **fail-fast 补刀**：若该父名在 owner 局部链命中、但全局各来源均无（局部快照存在而全局解析未命中），立即 warn「全局组件不能继承作用域组件」+ 拒绝注册，**不进 pending**——否则是永不出队的静默失效。

### 决策 6：覆盖、重复注册与事件全部复用全局即时注册语义

- 同名已有来源（全局表 / `options.components` / 插件表 / 内置表 / 先收集的同名模板全局声明）→ 经 `_hasGlobalComponentSource` + `_overrideWarnedGlobal` **warn 一次 + 后者覆盖**（per 名去重，克隆/多实例场景不刷屏）；
- `x-for` / `x-if` 克隆子树中的全局声明、嵌套组件（决策 7）多实例引发的重复注册，内容相同时为**幂等覆盖**；
- **已实例化的组件不热替换**，仅后续实例化取新定义（ADR-0086 既有铁律）；
- 注册成功统一走 `_afterComponentRegistered(name, true)`——「凡注册必发事件、必排水」结构不变量（ADR-0085）扩展到本路径；
- `<style global>` 注入、scoped 样式注册随 `registerComponentDef` 既有收口自动生效，无特殊分支。

### 决策 7：嵌套在组件定义内的全局声明允许，注册时机为外层首次实例化

嵌套 `x-define`（私有子组件机制）在**外层组件每次被实例化**、编译其快照子树时才走收集器。故嵌套的全局声明：

- 在外层组件**首次实例化时**才进入全局表（初始编译期不可用）；
- 外层每实例化一次即重建 def 覆盖注册一次（快照身份全新、内容幂等，靠决策 6 的 per-name 去重抑制 warn）。

允许该形态，不做提升（在外层收集期穿透快照提前注册会引入「外层从未使用却产生全局副作用」且要绕开 setup/style 提取管线），时序由文档明确。

### 决策 8：声明自带 global 穿过其他注册入口时，声明为准

同一份带 `x-define.global` 的组件代码若经 `engine.registerComponent(code, {scope})` / `{el}` 或作用域 `x-import` 注册（调用目标 = 作用域），**以声明为准**：落全局表，调用目标被忽略并 **warn 一次**。global 是组件**定义自身的属性**（与 open/inherit 同级），不是注册调用的参数；调用方覆盖会让同一份代码换个入口就改变作用域。

入口本就落全局（`registerComponent` 不传作用域、全局 `x-import`、`options.components`）时，声明内 global 属**冗余标记，静默接受**——同一份模板代码应能在「内联声明 / 配置字符串 / 运行时注册」间自由搬运。冲突才 warn，冗余不 warn。

### 决策 9：允许全局 `default`

无值 `x-define.global`（组件名取 `default`）允许注册为全局 `default` 组件，无特殊限制与额外提示——为 `x-loading` 等约定名消费者提供全局默认覆盖是正当用途；同名覆盖沿用决策 6。

## 被否决的方案

- **落插件全局表（跨 engine 共享）**：模板声明逃逸编译它的 engine，影响面不可见；跨 engine 共享已有插件机制显式承载。
- **孤立非 global 声明静默升级全局（对齐 x-icons）**：组件作用域语义（遮蔽/数据基准/私有子组件）远比图标域复杂，静默放大可见域会掩盖「缺少 x-scope 祖先」的作者错误。
- **global def 保留 `declarerScope = owner`**：全局表与词法作用域杂交，带来悬空引用、隐式数据外泄与实例化期延迟 warn；全局组件与声明位置脱钩是其余三条全局路径的既定事实。
- **全局子允许继承作用域父**：短命局部 def 挂进长命全局表，owner 销毁后全局组件损坏；pending 等待还会静默永不解锁。
- **调用方目标覆盖声明内 global**：同一份组件代码的作用域随入口漂移，违背「修饰符即定义的布尔配置」。
- **嵌套全局声明在外层收集期提前提升注册**：外层未实例化即产生全局副作用，且需穿透快照/setup/style 提取管线，复杂度与收益不匹配。

## 后果

- ✅ 模板内即可声明全引擎公共组件，无需 JS 配置；无 x-scope 祖先的位置也能声明（global 的附加用途）。
- ✅ 全局注册路径从三条增至四条，但落点、覆盖、事件、继承、样式、生命周期全部复用既有机制，无新表新通道。
- ✅ x-define 手工 options 解析与 ADR-0007 的对齐关系首次成文，后续新增布尔声明键有章可循。
- ⚠️ 全局表写入时机提前到编译期收集阶段：编译器新增一条「global 分支」，与局部路径的 owner 查找/重复校验分叉。
- ⚠️ 嵌套全局声明的懒注册时序（外层首次实例化才全局可见）需文档明确，作者不应在更早位置消费它。

## 实现注记（非架构决策，落地时遵循）

- `collect.ts`：`parseComponentDeclare` 返回新增 `modifierGlobal`（未知修饰符 warn 文案同步更新）；新增 global 选项提取（与 `extractBoundaryOptions` 同构：options 显式布尔优先、非布尔 warn 回落修饰符）。
- `compiler._collectComponent`：先解析 global，global 为真时跳过 owner 查找，`buildComponentDef(el, name, warn, null, modifierOpen)`；`def.dataContext === 'declarer'` 时 warn 并重置为 `undefined`；继承分支父查找走全局表 + 局部命中 fail-fast。
- `engine.ts`：`parseComponentCode` 返回结构带 global；`registerComponent` 在归属解析后应用「声明为准」（global 且 owner 非空 → warn 一次 + owner 置空）；x-import 远程注册逐个组件读取声明 global 并同样收口。
- 全局注册尾巴复用：`registerComponentDef(def)` + `_globalComponentDefs.set(name, def)` + `_afterComponentRegistered(name, true)`，覆盖 warn 复用 `_hasGlobalComponentSource` / `_overrideWarnedGlobal`。
- 文档：x-define.md（配置表加 `global` 行 + 全局组件小节 + 注意事项更新）、component/lookup.md（声明位置表与全局兜底段落补第四来源）；demo `component/define-global.html`。
- 测试：新增 `x-define-global.test.ts`——两形态等价、`{global:false}` 关闭、孤立无 scope 声明成功、非 global 孤立仍丢弃、全局兜底与就近遮蔽并存、覆盖 warn 一次、克隆重复注册幂等、嵌套懒注册时序、继承作用域父 fail-fast、`dataContext:'declarer'` warn 回落、`registerComponent(code,{scope})` 声明为准。
