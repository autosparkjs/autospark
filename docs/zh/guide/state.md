# 状态

## 概述

状态（state）是引擎的**唯一数据源**：一棵可任意嵌套的普通 JS 对象树（对象 / 数组 / 原始值），构造时由 [AutoStore](https://zhangfisher.github.io/autostore/) 深度代理为**响应式树**。本章讲清状态的概念与声明（含计算属性、局部状态），以及状态驱动 DOM 的响应式机制：插值的两种形式、作用域与路径规则。具体指令（`x-text` / `x-bind`）的细节见各自文档。

## 快速入门

下面的例子同时演示文本插值、属性插值（href）与响应式更新——切换用户，所有插值立即变化。

<demo html="reactive/interpolation.html"/>

## 指南

### 声明状态

构造引擎时第二参直接传**裸状态对象**，引擎自建 store 并代理响应式：

```javascript
const engine = new AutoSparkSpaces.AutoSpark(el, {
    user: { name: "张三" }, // 嵌套对象 → 路径 user.name
    books: [{ name: "AutoStore" }], // 数组 → x-for 直接迭代
    order: {
        price: 18,
        count: 3,
    },
});
```

- 嵌套不限层级，指令里路径直达叶子：`user.name`、`order.price`
- 数组的方法变更（`push` / `splice` 等）与下标赋值同样是响应式的

::: tip 种子状态建后即弃
传裸状态时，原对象只作**初始种子**——建 store 后它失去响应性。后续读写一律用 `engine.state`（响应式句柄），直接改原种子对象**不会**触发更新。
:::

### 计算属性

函数属性即**计算属性（computed）**——读取时自动求值并缓存，依赖变更后自动重算：

```javascript
const engine = new AutoSparkSpaces.AutoSpark(el, {
    order: {
        price: 18,
        count: 3,
        total: (scope) => scope.price * scope.count, // 54
    },
    todos: [{ id: 1, done: false }],
    remaining: (scope) => scope.todos.filter((t) => !t.done).length, // 1
});
```

- `scope` 参数指向计算属性**所在的对象层级**（响应式视图）：`total` 声明在 `order` 内，故 `scope.price` 即 `order.price`
- 模板中当普通路径使用：`order.total`、`remaining`
- 多次读取走缓存，仅依赖变化才重算

### 局部状态

模板的临时数据不必全塞进全局状态——在元素上用 `x-data` 就地声明一份**局部响应式数据**，供该子树的表达式读取：

```html
<div x-data="{ count: 0 }">
    <button @click="count++">点了我 {{ count }} 次</button>
</div>
```

局部变量会覆盖同名全局状态（绕过覆盖用 `$store.` 前缀），详见 [x-data](./directives/x-data.md)。

### 状态句柄

`engine.state` 等价于 `engine.store.state`——响应式状态树的根，**改它就触发更新**。常见三种改法：

```javascript
// 1. 直接改响应式句柄（最常用）
engine.state.user.name = "李四"; // 订阅了 user.name 的指令自动刷新

// 2. 在动作里改（推荐：与事件绑定）
actions: {
    rename: () => { engine.state.user.name = "李四"; }
}

// 3. 运行时给某元素注入局部数据（触发该 scope 子树重算）
engine.data(el, { temp: "临时值" });
```

::: warning `$scopes` 为框架保留键
`x-data` 的局部状态存放在 `state.$scopes` 下，业务状态请避开这个键名，也不要整体替换它。
:::

### 响应式机制

状态到 DOM 的更新由两层协作完成：

| 层 | 职责 |
| --- | --- |
| 状态层（AutoStore） | Proxy 深度代理读写；计算属性求值与缓存 |
| 引擎层（AutoSpark） | 编译期为每条指令订阅其表达式访问的路径；变更合并后精确 patch |

改一处状态的完整链路：

```
engine.state.order.count = 4
  → Proxy 拦截写入，通知订阅了 order.count 的 watcher
  → 调度器把同一 tick 的多次变更合并为一次微任务
  → 只重算受影响的表达式，只 patch 对应节点（不重建子树）
```

1. **编译期订阅**：每条指令（`x-text`、双花括号插值、`:bind` 等）在编译时通过 `scope.watch` 订阅自己表达式中访问到的状态路径。
2. **状态变更触发**：改 `engine.state` 任意路径，订阅了该路径的 watcher 被通知。
3. **调度合并**：同一 tick 内的多次变更合并为一次 patch。
4. **细粒度 patch**：只重写受影响节点的 `textContent` / 属性，不重建整棵子树，保留焦点、滚动等运行态。

### 文本插值

文本节点里的双花括号插值（花括号内写路径或表达式），效果与 `x-text` 等价：

```html
<!-- 一段文本穿插多个值 -->
<p>{{ user.name }}（{{ user.age }} 岁）</p>
<!-- 表达式 -->
<p>合计：{{ order.price * order.count }} 元</p>
```

文本插值按段拆分——每个插值段独立订阅，字面量段是静态文本节点。

### 属性插值

属性值里也能用插值，引擎在编译期把它**归一化为属性绑定**（等价 `:attr`），复用 `x-bind` 的分派逻辑：

```html
<!-- href 里插值 -->
<a href="/users/{{ user.id }}">主页</a>
<!-- class 里插值：字面量 + 状态混排 -->
<span class="card {{ user.role }}">标签</span>
<!-- 整个值就是一个插值：保留原生类型 -->
<input disabled="{{ form.locked }}" />
```

::: tip 整体单段 vs 混合段
整个属性值恰好是一个插值时（整个属性就是一对双花括号），引擎保留值的原始类型（boolean 就是 boolean）；字面量与插值混排时，按字符串拼接。后者规避了布尔属性写成字符串恒真的 HTML 坑。
:::

### 作用域与路径

指令值里的路径，按当前**作用域（scope）**解析。作用域有层次：

| 写法 | 解析为 |
| --- | --- |
| `user.name` | 当前 scope 的相对路径（默认指向全局 state） |
| `name`（在 `x-for` 项内） | 指向当前迭代项的字段 |
| `name`（在 `x-data` 局部作用域内） | 指向该元素声明的局部数据 |
| `$store.user.name` | 显式访问全局 store（绕过局部覆盖） |

`x-for` 的迭代项、`x-data` 的局部变量会**覆盖**同名全局状态——在局部作用域内写 `item` 拿到的是局部变量，要访问全局同名成员得用 `$store.item`。

---

下一步：[动作](./action.md)了解事件如何驱动状态变更。
