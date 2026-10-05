# ADR-0086：运行时组件注册（`engine.registerComponent(code, opts)`）

- 状态：已采纳
- 日期：2026-10-04
- 关联：[ADR-0022](0022-x-component.md)（组件定义 / 查找 / 实例化主机制）、[ADR-0054](0054-define-formal.md)（x-define 声明族）、[ADR-0065](0065-x-component-remote-loader.md)（远程注册与同名覆盖 warn）、[ADR-0066](0066-x-component-remote-loader.md)（x-import / loader 管线）、[ADR-0081](0081-component-define-inherit.md)（组件继承）、[ADR-0083](0083-async-parent-deferred-inherit.md)（父未就绪挂起排水）、[ADR-0085](0085-component-registered-event.md)（`components/<名>/registered` 事件）

## 背景

组件注册此前只有三条入口，且全部**不在运行时按需发生**：

1. 模板内 `x-define` —— 编译期从模板树摘除，**静态**；
2. `options.components` —— 构造期配置，字符串入参；
3. `x-import` / loader —— 远程 `fetch` **异步**注册。

缺失的是最常见的一类用法：**代码里按数据/按分支决定注册什么组件**。典型场景（服务端返回一段 UI 描述、按用户角色装配面板、把一份外部文案渲染成带样式的卡片）当前无正规入口，用户只能拼 `innerHTML` 再走 `x-import` 兜底，或退化为「先塞 `options.components`、再手工预热所有可能用到的名字」。

## 决策

### 一、只提供 `registerComponent`，不提供公开 `parseComponent`

新增公开方法：

```ts
registerComponent(
    code: string,
    opts?: { name?: string; scope?: AutoSparkScope; el?: HTMLElement },
): ComponentDef | null
```

解析逻辑（单根判定 + 声明读取 + 修饰符/属性参数）**私有化为 engine 的 `parseComponentCode`**：它是注册的前置步骤，独立成公开 API 会给出一堆「解析出来但没注册」的中间态概念（谁持有？何时释放？再注册谁负责？）。解析所需的三块能力全部已有归属，不新增概念：

- 顶级单根判定 → `pickSingleRootElement`（`utils/transformElement`，与「组件自动包装」共用）；
- 声明读取（`x-define` / `.open` / `:inherit`） → `parseComponentDeclare`（`compile/collect`，与编译期 `x-define` 共用，**顺带消除重复解析实现**）；
- 定义组装 → `buildComponentDef`（复用，不 fork）。

### 二、严格输入契约（不自动包装）

| 输入 | 结果 |
|---|---|
| 恰好一个顶级根元素 + 根带 `x-define` | 正常注册 |
| 多顶级根 / 元素与文本混排 / 纯文本 | warn + `null` |
| 无 `x-define` 声明 | warn + `null` |
| 空串 / 非字符串 | warn + `null` |

**刻意不套用「组件自动包装」**：`options.components` 面向「配置里写个片段，引擎兜底整理」的宽松场景；运行时注册面向「我明确知道自己在声明什么」，多根/无声明是**代码错误**（把两个兄弟节点合成一个组件根，语义本就含混）。宽松归一化留给配置入参。**非元素文本节点（根外空白）忽略，不判非法**（模板字符串缩进常态）。

`opts.name` **仅校验**：与内联 `x-define` 不一致时 warn，仍以内联名为准（注册名的事实源唯一，与 `_wrapGlobalComponent` 同纪律）。

### 三、归属三态：`scope` / `el` / 全局

`scope` 与 `el` 同义——都是「声明处」。`el` 自该元素**含自身**沿 `parentElement` 上溯，取最近的 scope 根所属 scope（与 x-define「最近祖先 scope」归属同构，即 `_linkParent` 的运行时等价物），实现为私有 `_findNearestScopeOf` 逐层调 `findScopeByEl` 精确比对（同 ADR-0080 决策 2 的冒泡实现）。**不直接用 `findScopeByEl(el)` 单次命中**——它按 ADR-0060 决策「精确匹配 `scope.el === el`、不上爬」，传入普通容器元素会查不到而降级全局，可见域静默放大。查不到则 warn 并**降级为全局**而非报错（元素可能尚未编译/已脱离引擎树）。二者同传以 `scope` 为准并 warn。归属决定 `declarerScope`（data 视图基准，见 ADR-0053），故不是可有可无的参数。

### 四、全局组件定义表单一来源

原全局侧有两张表：`_globalComponentCache`（name → 快照 HTMLElement）与 `_globalComponentDefCache`（name → ComponentDef），`_wrapGlobalComponent` 先查前者、miss 再查后者。合并为**单一表** `_globalComponentDefs: Map<string, ComponentDef | null>`（快照由 `def.snapshot` 派生）：

- **负缓存**：解析失败的 `null` 也入表，使失败同样只解析一次（与原两张表的负缓存行为等价）；
- **查找顺序**：定义表优先 → miss 才惰性读取 `options.components` 并自动包装入表。所有消费方（`getComponentDeclaration` 链终点、`messages` 消息 shell、`x-overlay` 锚点、编译期继承父查找）本就是「先 `_resolveGlobalComponent` 再 `getGlobalComponentDef`」范式，无需改动；
- **运行时注册不再写 `options.components`**：`Record<string, string>` 是**构造期配置**（CONTEXT「全局组件」），运行时突变写入既违反该纪律，又让「全局组件来源」分裂为「配置 + 内部名册」两处真相。

### 五、`x-import.global` 改道直写定义表

`.global` 分支原先把快照 `outerHTML` 塞回 `options.components[name]`，下次 `_resolveGlobalComponent` 命中该字符串时又按「无声明 → 打 `x-define` 名字 + 自动包装」重新走一遍——**`innerHTML` 往返丢失 `<script setup>` 执行结果与 `<style>` 收集状态**（二者都在 `buildComponentDef` 阶段被摘出，不在序列化后的 DOM 里）。改道为与运行时注册相同的直写定义表：解析一次、快照即事实源。

### 六、覆盖语义：后注册覆盖 + per 名去重 warn；**已实例化不热替换**

同名后注册覆盖先注册（复用 ADR-0065 决策三的覆盖 warn 形态，按「注册目标 × 名」去重，避免 loader + 运行时双通道反复覆盖时刷屏）。**已实例化的组件实例持有自己的克隆，不被新定义替换**——x-component 无实例注册表，热替换需要额外的实例追踪与 diff 语义（YAGNI）。仅**后续**实例化取到新定义。

### 七、继承完全复用既有管线（不在注册层另立语法）

`x-define:inherit` 在注册层交给 `resolveComponentInheritance`，与编译期 `_collectComponent`、x-import 远程注册**同一条管线**：父查找 = scope 链就近 + 全局兜底，父未就绪时 `deferMissingParent` 挂起进 `_pendingInherits`，待父注册的 `components/<父名>/registered` 事件排水重试（ADR-0083 + ADR-0085）。因此**运行时注册所得组件与 `options.components` 平齐地支持继承**，无第二套继承语义；声明族属性由 resolver 的 `stripDeclareFamilyAttrs` 在解析快照上剥离（与编译期同）。

**挂起时本次 `registerComponent` 返回 `null`**：父就绪前注册并未完成，返回一个未解析的 def 会误导调用方。排水成功后经自身注册路径递归发事件，链式解锁收敛。

### 八、只注册不注销（无 `unregisterComponent`）

作用域注册挂在 `scope.components` 上，随 scope 对象一并失去引用而回收（scope 销毁不逐项清表，但该 scope 已脱活链、无处可达）；全局注册随 `destroy()` 丢弃。不提供显式注销点——与 ADR-0085 决策五同纪律（无注销 API 则不提供 `components/<名>/unregistered`）。

### 九、嵌套声明资源节点 warn（不改变收集行为）

`<script setup>` / `<style>` **仅根的直接子级**被 `buildComponentDef` 收集；嵌套层级的同名节点原样留在快照里、不参与组件语义，对作者是易踩的静默失效。`registerComponent` 路径补一条 warn（跳过根的直接子级），**不改收集行为**（ADR-0022 决策四的既有判定保持不变）。

### 十、类型出口

`src/index.ts` 导出 `ComponentDef` 及 `ComponentSetup` / `ComponentHooks` / `ComponentDataBasis` / `ComponentDataContext`：返回值即 `ComponentDef`，无类型则调用方只能 `any`。

## 实现要点（防再踩）

1. `captureWarns` 类测试：flex-tools `createLogger` 在**创建时**绑定 `console.warn`，而 autostore 的 `store.logger` 是**首次访问才惰性创建**——补丁窗口须覆盖 engine 创建（把 `mount()` 纳入窗口，或在窗口内访问一次 `engine.logger` 强制创建），否则 warn 全绕过捕获；
2. 作用域注册「随 scope 回收」不可断言为「destroy 后查不到」：`scope.destroy()` 不清 `components`，`engine.scopes` 是弱引用注册表且从不逐项删除——销毁后 scope 对象仍持有映射（只是已脱活链）。断言应落在「无注销 API」与「全局表随 `destroy()` 清空」上；另注意先 `scope.destroy()` 再 `engine.destroy()` 会**二次销毁同一 scope 子树**（既有幂等守卫保护，但测试里避免制造该形状）；
3. `ComponentDef | null` 与 `expect(...).toBe(def)` 的类型不兼容（`toBe` 收 `undefined` 而非 `null`）——需 `def!` 或 `toBeNull()`；
4. `registerResolved` 尾巴对 scoped 与 global 两分支的写法：scoped 存 `scope.components[name] = resolved.snapshot`（保 HTMLElement 契约），global 存定义表；`registerComponentDef(resolved)` 两者都要先调（快照反查 def 的通道）；
5. 无头解析宿主的 happy-dom 环境：`el.parentElement === root` 判定「根直接子级」，勿用 `children`（需过滤文本节点）。

## 被否决 / 演变的方案

- **公开 `parseComponent(code)`**（无头解析工具）：见决策一——产出无归属的中间态，且能力已被 `registerComponent` 全量覆盖；
- **运行时注册沿用自动包装**（多根/无声明自动整理）：见决策二——宽松归一化是配置入参的礼遇，代码错误应显式失败；
- **运行时写 `options.components`**：见决策四——配置与名册两处真相；
- **保留两张全局表**（快照表 + def 表）：合并后查找链更短、负缓存统一，且消除「两表不一致」的不变量维护成本；
- **返回 `HTMLElement` 快照**而非 `ComponentDef`：快照已可经 `engine.getComponentDef(snapshot)` 反查，返回 def 省一次跳转，并让「继承是否已解析」在类型上自明；
- **按代码串 memo**（同串复用 def）：字符串是弱身份（同名不同码、同码不同修饰符上下文），且覆盖语义要求每次重新解析；
- **`unregisterComponent`**：见决策八；
- **热替换已实例化组件**：见决策六。

## 语义代价（有意接受）

1. **不热替换**：同名覆盖后既有实例仍是旧版本，直到消费方重建实例；
2. **挂起即 `null`**：父未就绪的继承注册本次不生效，需依赖事件或再次查询 `getGlobalComponentDef` 感知后续解锁；
3. **严格单根**：一份「本就多根」的模板无法直接注册，须由作者显式给出包裹根（与「组件自动包装」的宽松面有意分道）；
4. **`el` 降级为全局**：`el` 未对应 scope 时静默改变可见域（已 warn），严格失败会阻断「元素刚插入未编译」的常见时序。
