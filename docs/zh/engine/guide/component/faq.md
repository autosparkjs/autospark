# 常见问题

## 组件声明了，但页面上看不到 / 报 "组件无处归属" 警告？

`x-define` **本身就不渲染**——它编译期被摘除。如果你是想**使用**组件，需要用 `x-component` 实例化它。如果是 `warn` 提示组件无处归属，说明组件声明处缺少带 scope 的祖先，在最外层包一个 `<div x-scope>` 即可：

```html
<!-- ❌ 根无 scope，组件被 warn 丢弃 -->
<div>
    <div x-define="card">...</div>
</div>

<!-- ✅ x-scope 提供归属锚点 -->
<div x-scope>
    <div x-define="card">...</div>
    <div x-component:card></div>
</div>
```

## `x-component` 和 `x-if` 写一起为什么组件不渲染？

`x-component` 与结构指令（`x-if`/`x-for`/`x-isolate`/`x-switch`/`x-tree`）互斥，同元素会 `warn` 并跳过实例化。把结构指令挪到外层包裹元素：

```html
<!-- ❌ 互斥 -->
<div x-if="show" x-component:card></div>
<!-- ✅ 外层控制显隐 -->
<div x-if="show"><div x-component:card></div></div>
```

只需切换可见性（不销毁重建）用 `x-show` 包裹即可。

## 方法里 `this.count` 为什么是 `undefined`？

组件数据在 `this.data` 上，不是 `this` 根。正确写法是 `this.data.count`：

```javascript
methods: {
    // ❌
    inc() { this.count++ },
    // ✅
    inc() { this.data.count++ },
}
```

`this.data` 是组件聚合数据视图（data 默认值 + `x-component` props 为自有层，按边界聚合外部），响应式可读写；`this.props` 是其等价别名；`this.globalState` 是全局 store 状态的无遮蔽通道；`this.scope` 是组件实例 scope。

## props 和 `data` 的同名字段，哪个生效？

**props 生效**。合并顺序是 `data` 默认先注入、`x-component` props 后覆盖（外部优先）。但 props 后续更新只覆盖它**声明的键**——组件内部改的字段（没被 props 声明的）不会被重置；被 props 声明的键在组件内交互修改后，只要 props 值没有变化（浅等）也不会被打回初值。

## 同名组件会冲突吗？

分情况：

- **同一 scope 内**同名：`warn` + 后者覆盖（不抛错）。
- **沿 parent 链**：内层 scope 的同名组件**就近遮蔽**外层（含全局同名组件）。这是特性而非 bug，可用它实现「公共全局 + 局部特例」。

## scoped 样式怎么穿透到子组件？

当前**不支持穿透**（无 `:deep()`/`>>>`），`<style>` 纯隔离到本实例。如果确实需要影响子组件，两种变通：把公共样式提到页面级 `<style>`（不进 scoped），或通过 props 把样式值传入子组件用 `bind()` 注入。真实穿透需求足够多时引擎会补 `:deep()` 支持。

## `bind()` 写了但样式没反应？

常见原因：

1. **数字值没拼单位**：`width: bind("count")` 注入的是纯数字 `100`，对 `width` 无效。用 `bind("count + 'px'")` 或 `width: calc(var(--count) * 1px)`。
2. **写成了复合值**：`margin: 8px bind("gap")` 非法。`bind()` 必须独占整个属性值。
3. **值是 null/undefined**：此时走 `var(--name, unset)` 回退，表现为默认值（这是设计的安全行为，非 bug）。

## 远程组件加载失败怎么办？

`x-import` 失败时 `warn` + 该组件视为未注册，`x-component` 宿主保持 loading 占位（不崩溃）。排查：

- 确认通过 HTTP 服务器访问（`file://` 会因 CORS 受限）；
- 确认 url 正确、返回 HTTP 2xx；
- 远程 HTML 里确有 `<div x-define="name">` 元素（无 `x-define` 的节点不会被注册）。

## 组件能递归调用自己吗？

可以。组件模板内 `x-component="自身名"` 会实例化自身（树形/菜单组件常见），带深度上限保护（默认 100），超限 `warn` + 停止，防无限递归。注意递归必须有终止条件（数据结构到叶子层停止）。

```html
<div x-define="tree-node">
    <span x-text="node.name"></span>
    <!-- 递归：对每个子节点实例化自身 -->
    <div x-for="child of node.children">
        <div x-component:tree-node="{node: child }"></div>
    </div>
</div>
```

## 组件内能再声明私有子组件吗？

可以。在组件 A 的定义里声明组件 B，则 B 是 A 的**私有子组件**——仅 A 的实例（及其实例子树）可见，外层查不到。机制上 `x-component` 实例化 A 时编译其快照子树，内层 B 经收集器归属到 A 的实例 scope，运行期 scope 链天然实现严格私有。

## 组件里读不到外层的 x-data 变量？

组件数据边界**默认封闭**——组件内只能读自身 `data`/props 与全局 state，这是有意的封装设计（详见[数据边界](./data.md#数据边界默认封闭与-open)）。三个出路：

1. **props 显式传入**（推荐）：`<div x-component:card="{tip: tip }"></div>`；
2. 数据放**全局 state**（任意组件可见）；
3. 确需共享上下文的复杂组件，由组件作者声明 `x-define.open` 开放边界。

若控制台出现「未声明 open…x-component-options.dataContext 不生效」「基准仅在 open 声明时生效」「无声明处 scope」类 warn，都是边界配置失效提示，按[数据边界](./data.md#数据边界默认封闭与-open)一节修正声明即可。

---

组件讲完。它常与 `x-loading` 配合（定制其默认 UI），其作用域锚点 `x-scope` 的更多背景见 [x-scope](../directives/x-scope.md)，实例化指令 `x-component` 与远程加载 `x-import` 的指令级细节见[指令](../directives/x-bind.md)。
