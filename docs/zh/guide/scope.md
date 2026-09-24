# Scope

## 概述

Scope（作用域）是 AutoSpark 内部为**每个含指令或插值的 DOM 元素**创建的管理单元。它统一管理该元素上多条指令的**生命周期与状态订阅**，并在元素更新或销毁时集中清理资源。

理解 Scope，是理解 AutoSpark 数据流、组件嵌套与动作查找的基础。

## 引入

### 为什么需要 Scope？

一个 DOM 元素上可能同时挂载多条指令：

```html
<div x-data="{ count: 0 }">
  <button x-text="count" @click="count++">+</button>
</div>
```

在这个例子中：
- `<button>` 上有 `x-text` 和 `@click` 两条指令
- `<div>` 上有 `x-data` 局部数据

AutoSpark 为**每个需要管理指令的元素**创建一个 `AutoSparkScope` 实例，由它负责：

| 职责 | 说明 |
| --- | --- |
| **生命周期管理** | 按优先级串行执行指令的 `created` → `compile` → `destroy` |
| **状态订阅管理** | 统一收集所有 `scope.watch` 注册的 watcher，销毁时批量 `off` |
| **父子关系维护** | 建立 parent 链，支持作用域查找与资源递归清理 |
| **上下文聚合** | 通过 `getContext()` 拍平局部数据与全局状态，供模板表达式求值 |

没有 Scope，每条指令各自管理订阅和生命周期，嵌套作用域的变量查找和资源清理将极其复杂。Scope 把这些职责**收拢到一个对象**上，使引擎内部逻辑清晰、资源不泄漏。

### Scope 与 DOM 元素的关系

- **一个 Scope 对应一个 DOM 元素**（更准确地说，是模板元素）
- Scope 通过 `WeakRef` 引用实际渲染元素（`scope.el`），不阻止 GC
- 大多数元素**没有 Scope**——只有含指令（`x-*` / `@*` / `:*`）或 <span v-pre>`{{}}`</span> 插值的元素才会创建 Scope
- 纯静态的 `<div>hello</div>` 不会创建 Scope

## 理解 Scope

### 创建时机

Scope 在编译期由编译器（`AutoSparkCompiler`）创建。当编译器深度优先遍历模板树时，遇到含指令或插值的元素，就会调用 `new AutoSparkScope(engine, el, template)`：

```text
模板编译流程：
  template 根元素
    ├─ <div x-data="{count:0}">  → 建 scope（DataDirective）
    │   ├─ <span>{{msg}}</span>  → 建 scope（文本插值）
    │   └─ <button @click="..."> → 建 scope（OnDirective）
    └─ <p>x-text="title"</p>     → 建 scope（TextDirective）
```

编译器还会通过 `_linkParent` 建立**父子关系**：每个新 Scope 会沿模板树向上查找最近的祖先 Scope 作为 `parent`，并调用 `parent.addChild(child)` 注册。

### Scope 上挂载了什么

每个 Scope 实例持有以下核心字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `number` | 自增唯一标识，用于 `state.$scopes[id]` 索引 |
| `engine` | `AutoSpark` | 所属引擎实例的引用 |
| `el` | `HTMLElement \| null` | 实际渲染元素（WeakRef，可能已回收） |
| `template` | `HTMLElement \| null` | 模板元素（编译只读输入） |
| `parent` | `AutoSparkScope \| null` | 父作用域（根 scope 为 null） |
| `children` | `Set<AutoSparkScope>` | 子作用域集合 |
| `directives` | `AutoSparkDirectiveBase[]` | 该元素上的指令实例列表（按优先级降序） |
| `data` | `Record<string, any> \| null` | x-for 注入的局部数据（item/index 等） |
| `_data` | `Record<string, any> \| null` | x-data 注入的私有响应式数据域 |
| `hostOptions` | `Record<string, any> \| null` | 元素级宿主选项（`x-options` 解析产物） |
| `watchers` | `Watcher[]` | 本 scope 持有的所有 watcher（destroy 时统一 off） |
| `components` | `Record<string, HTMLElement> \| null` | x-define 收集的命名组件快照 |
| `actions` | `Record<string, ActionDesc> \| null` | 局部 action（`<script type="autospark/actions">`） |
| `methods` | `Record<string, Function> \| null` | 组件实例的内部方法（仅组件 scope） |
| `hooks` | `ComponentHooks \| null` | 组件实例的生命周期钩子（仅组件 scope） |

### 父子关系与 parent 链

Scope 通过 `parent` 字段形成一棵**树形结构**，这是 AutoSpark 多项机制的基础：

```
根 scope (parent=null)
  ├─ x-data scope (parent=根)
  │   ├─ x-for 项 scope A (parent=x-data)
  │   ├─ x-for 项 scope B (parent=x-data)
  │   └─ x-if 子树 scope (parent=x-data)
  └─ x-scope scope (parent=根)
```

parent 链被以下机制沿链查找：
- **聚合视图（`getContext()`）**：逐层叠加 locals → data → parent 视图 → 根 state
- **动作查找（`getAction()`）**：本 scope.actions → 祖先 actions → engine.actions
- **组件查找（`getComponent()`）**：就近取首个含该名组件的祖先 → 兜底全局组件
- **数据查找（`getData()`）**：沿链找最近持有 `_data` 的祖先 scope
- **资源清理**：destroy 时递归销毁所有 children，批量 off watcher

### 聚合视图（getContext）

`scope.getContext()` 返回一个 **Proxy 聚合视图**，将多层数据拍平为一个可读可写的对象。这是模板表达式求值的核心：

```text
查找优先级（从高到低）：
  1. locals（x-for 的 item/index 等循环派生变量）
  2. _data（x-data 注入的私有响应式域）
  3. 父 scope 的 getContext() 视图（递归）
  4. 根 engine.state（全局状态）
```

```html
<div x-data="{ user: '张三' }">
  <!-- locals 覆盖 data（x-for item 覆盖同名 x-data 键） -->
  <div x-for="item of items">
    <span x-text="item.name"></span>  <!-- item 来自 locals -->
    <span x-text="user"></span>        <!-- user 来自父 x-data -->
  </div>
</div>
```

写入 `getContext()` 返回的视图时，set 陷阱会按**同序**透传到对应容器：命中 `data` 写 locals（非响应式），命中 `_data` 写响应式域（触发字段级更新），未命中则委托父视图沿链处理。

### 双轨 watch

Scope 的 `watch` 方法支持两条订阅路径：

| 路径 | 条件 | 实现 |
| --- | --- | --- |
| **精准路径** | `isSimpleStatePath(value)` 为真，且无局部数据 | `store.watch(path)` 直连，最快 |
| **表达式** | 含运算符/函数调用，或存在局部数据 | `new Function("scope", "with(scope){return (expr)}")` + `collectDependencies` |

```text
scope.watch("user.name", listener)
  → 无局部数据 + 纯路径 → watchPath → store.watch("user.name")

scope.watch("item.name", listener)
  → 有局部数据（locals）→ watchExpression → with(getContext){return item.name}
  → collectDependencies 收集 "$scopes.<id>.item.name" 路径后订阅
```

表达式支路还支持**动态依赖重收集**：短路表达式（`a || b`）在不同分支读不同键，依赖集随实际走到的分支漂移，每次 flush 时重新收集并按需重订 watcher。

### Scope 与 x-data

`x-data` 是最常创建 Scope 的指令——它不仅建 scope，还向 `state.$scopes[scope.id]` 注入私有响应式数据域：

```html
<div x-data="{ count: 0 }">
  <!-- scope._data 指向 state.$scopes[scope.id] = { count: 0 } -->
  <button @click="count++">{{ count }}</button>
</div>
```

关键约束（铁律）：
- `_data` 引用**永不整体替换**——`Object.assign` 原地改，保证 Proxy 闭包不断裂
- 销毁时 `delete state.$scopes[scope.id]`（CAS 删除 + 删空向上回收）
- `$scopes` 是框架保留键，业务状态请避开

### Scope 与 x-scope

`x-scope` 是纯占位指令——零副作用、不建数据域、不注入变量。唯一作用是让「无其他指令的纯容器元素」也创建一个 Scope：

```html
<div x-scope>
  <!-- 这个 div 本来不会建 scope（无指令无插值） -->
  <!-- 声明 x-scope 后，它成为 scope 锚点 -->
  <x-define name="loading">...</x-define>
  <!-- x-define 可以归属到这个 scope -->
</div>
```

典型用途：
- 为 `x-define` 提供归属锚点（组件向上找最近 scope 挂载）
- 截断后代 scope 链（确定 parent 边界，防止 localData 继承链越过预期）

### Scope 销毁

当元素从 DOM 移除（x-if 条件切换、x-for 项更新等）时，对应的 Scope 被销毁：

```text
scope.destroy()
  ├─ _runHooks("beforeUnmount")    // 组件实例：触发 beforeUnmount 钩子
  ├─ parent.children.delete(this)  // 从父级脱离
  ├─ for child of children:        // 递归销毁子作用域
  │     child.destroy()
  ├─ for watcher of watchers:      // 批量 off 所有 watcher
  │     watcher.off()
  ├─ for directive of directives:  // 执行各指令的 destroy 钩子
  │     directive.destroy(el)
  └─ _runHooks("unmounted")        // 组件实例：触发 unmounted 钩子
```

销毁后：
- `scope.el` 可能为 null（WeakRef 已回收）
- `scope.watchers` 清空
- 子 scope 全部销毁并从 `children` 集合移除
- 引擎 `scopes` Map 中的 WeakRef key 也随之失效

## 访问 Scope 实例

### 从引擎获取 Scope

`engine.scopes` 是一个 `Map<WeakRef<Node>, AutoSparkScope>`，记录了所有存活 scope。遍历它可以找到特定元素对应的 scope：

```javascript
// 按元素反查 scope
const scope = engine.findScopeByEl(el);
```

::: tip 查找是 O(n) 遍历
`engine.scopes` 以 WeakRef 为 key，无法直接 `get(el)`，只能遍历 values 做 deref 比较。低频 API（运行时 patch、数据注入）可接受；高频场景请用其他方式。
:::

### 从指令获取 Scope

对于 Compile/Hybrid 类指令，`this.binding` 就是当前指令所属的 Scope 实例：

```javascript
// 在指令内部
this.binding           // AutoSparkScope 实例
this.binding.el        // 宿主元素
this.binding.engine    // AutoSpark 实例
this.binding.watch(expr, listener)   // 订阅状态
this.binding.getContext()             // 聚合视图
this.binding.getAction(name)         // 查找 action
this.binding.getComponent(name)      // 查找组件
```

### 从动作上下文获取 Scope

在动作（action）函数内，`this.scope` 指向触发动作的 Scope：

```html
<script type="autospark/actions">
{
  save() {
    // this.scope —— 当前 scope
    // this.data  —— scope.getContext() 聚合视图
    // this.engine —— engine 实例
    const data = this.scope.getData();  // 拿到当前 x-data 的响应式域
    data.count++;
  }
}
</script>
```

### 从组件 method 获取 Scope

在组件的 `<script setup>` 中，`this` 被绑定为 Proxy（`getMethodThis()`），暴露以下集合：

```html
<script setup>
// this 的暴露集合：
// data    → getContext() 聚合视图
// state   → engine.state（全局状态）
// engine  → AutoSpark 实例
// scope   → 当前 scope
// el      → 组件根元素
// $parent → 父组件实例 Proxy
// <method名> → 方法直调互调（如 this.inc()）
// watch/read/getComponent → scope 同名方法
{
  inc() { this.data.count++; },
  reset() { this.globalState.count = 0; },
}
</script>
```

### scope.data 属性

`scope.data` 是 `getContext()` 的语法糖 getter——返回聚合视图：

```javascript
const scope = engine.findScopeByEl(el);
const view = scope.data;  // 等价 scope.getContext()
console.log(view.count);  // 读聚合视图
view.count = 1;           // 写入触发响应式更新（若命中 _data 层）
```

### scope.getData() 方法

`scope.getData()` 沿 parent 链查找**最近的 x-data 私有响应式域**（`_data`），返回可读可写的原始响应式代理——区别于 `getContext()` 返回的只读聚合视图：

```javascript
const data = scope.getData();
// data 是 store.state.$scopes[id] 的响应式代理
// 可以 Object.assign、delete 等操作
Object.assign(data, { newField: '值' });  // 触发响应式更新
```

### engine.data() 运行时注入

`engine.data(el, data)` 是在运行时给已有 scope 注入数据的统一入口：

```javascript
// 给某元素的 scope 注入/合并数据
engine.data(el, { temp: '临时值' });

// 内部行为：
// - scope 已有 _data → Object.assign 合并（主路径，不重建）
// - scope 无 _data（原无 x-data）→ 新建 data + 销毁子树 + 重新编译
```

### scope.read() 只读求值

`scope.read(expr)` 求值表达式或读取路径的**当前值**，不建立订阅——适合已在 `created` 中自行订阅、仅需在回调中重读最新值的场景：

```javascript
// 纯路径 → getVal(store.state, path)
const val = scope.read("user.name");

// 表达式 → with(getContext){ return (expr) }
const filtered = scope.read("items.filter(x => x.active)");
```

---

下一步：[动作](./action.md)了解事件如何驱动状态变更，或[指令](./directive.md)了解指令类型体系。
