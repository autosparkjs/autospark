# 开发组件

## 快速入门

我们从零开发一个典型的计数器组件，逐步覆盖声明、数据、方法、样式、生命周期、实例化的完整流程。

### 第 1 步：声明组件

组件用 `x-define="名称"` 声明，必须放在一个**带 scope 的祖先**内（最简单的方式是用 `x-scope` 让纯容器建 scope 作为锚点）。

```html
<div x-scope>
    <!-- 声明组件 counter：编译后此元素从 DOM 消失，仅作为"模板供体" -->
    <div x-define="counter">
        <span x-text="count"></span>
    </div>
</div>
```

此时页面是空的——组件声明本身不会渲染任何内容。`x-scope` 让纯容器建 scope，使内部的 `x-define` 有归属锚点（否则组件无处归属，编译期被 `warn` 丢弃）。

### 第 2 步：加数据与方法（`<script setup>`）

在组件内用 `<script setup>` 声明数据与方法。`data` 是响应式初始数据，`methods` 是组件方法：

```html
<div x-define="counter">
    <button x-on:click="dec">−</button>
    <span x-text="count"></span>
    <button x-on:click="inc">+</button>
    <script setup>
        {
            data: { count: 0, step: 1 },
            methods: {
                inc() { this.data.count += this.data.step },
                dec() { this.data.count -= this.data.step },
            },
        }
    </script>
</div>
```

- `data` 注入组件的**响应式数据域**，模板里直接用字段名（`count`）取用；
- `methods` 是组件的**内部方法**，可被 `x-on` 调用，方法间还能 `this.其他方法()` 互调（详见[响应式数据 → 组件上下文](./data.md#组件上下文)）；
- 方法内 `this.data` 即组件聚合视图（含 state + props + 全局 state），可读可写，修改后界面自动更新。

### 第 3 步：加样式（`<style>`）

组件内的 `<style>` 默认**只命中本组件实例**（仿 Vue `<style scoped>`）：

```html
<div x-define="counter">
    <div class="counter"><span class="count" x-text="count"></span></div>
    <style>
        .counter { padding: 8px; border: 1px solid #ccc; }
        .count { font-weight: bold; }
    </style>
</div>
```

实例化时，组件根及所有后代被打上唯一 `data-cmp-{id}` 属性，`<style>` 的选择器末尾自动追加 `[data-cmp-{id}]`，使样式隔离到本实例，多实例互不串扰。

### 第 4 步：加生命周期钩子

`<script setup>` 还可声明生命周期钩子。下面在 `mounted`（DOM 编译完成后触发）里读取宿主的 `data-count` 属性来初始化计数：

```html
<div x-define="counter">
    <span class="count" x-text="count"></span>
    <script setup>
        {
            data: { count: 0 },
            mounted() {
                const init = this.el.getAttribute('data-count');
                if (init !== null) this.data.count = Number(init);
            },
        }
    </script>
</div>
```

四个阶段：`created`（编译前）、`mounted`（DOM 编译完成）、`beforeUnmount`（卸载前）、`unmounted`（卸载后）。

### 第 5 步：实例化组件（`x-component`）

组件声明完后，用 `x-component` 在任意位置实例化它。宿主元素会化身为组件根：

```html
<!-- 字面量组件名 -->
<div x-component:counter data-count="10"></div>

<!-- 传 props（对象形式）：count 覆盖 data 默认值 -->
<div x-component:counter="{count: 100, step: 5 }"></div>
```

### 小结

把上面五步合在一起，就是一个完整可用的组件。下面这个 demo 融合了 data、methods、scoped style、mounted 生命周期、props 覆盖：

<demo html="component/counter.html"/>

```html
<div x-scope>
    <div x-define="counter">
        <div class="counter">
            <button x-on:click="dec">−</button>
            <span class="count" x-text="count"></span>
            <button x-on:click="inc">+</button>
        </div>
        <script setup>
            {
                data: { count: 0, step: 1 },
                methods: {
                    inc() { this.data.count += this.data.step },
                    dec() { this.data.count -= this.data.step },
                },
                mounted() {
                    const init = this.el.getAttribute('data-count');
                    if (init !== null) this.data.count = Number(init);
                },
            }
        </script>
        <style>
            .counter { display: inline-flex; align-items: center; gap: 10px; padding: 8px 14px; border-radius: 8px; }
            .count { min-width: 48px; text-align: center; font-weight: 700; font-size: 1.25rem; }
        </style>
    </div>

    <!-- 实例化：mounted 读 data-count=10 初始化 -->
    <div x-component:counter data-count="10"></div>
    <!-- 传 props：count=100、step=5 覆盖 data 默认 -->
    <div x-component:counter="{count: 100, step: 5 }"></div>
</div>
```

至此你已掌握组件的全部核心用法。深入细节见：[实例化组件](./instantiate.md)、[响应式数据](./data.md)、[生命周期](./lifecycle.md)、[样式](./styles.md)。

## 声明组件

### 编译期摘除

`x-define` 是**声明性资源，不是渲染指令**。编译期一个前置 transformer 命中它，做四件事：

1. 提取子节点中的 `<script setup>` 与 `<style>`（求值/收集，从快照移除）；
2. **深克隆**剩余 DOM 为冻结快照（保留指令属性，尚未编译）；
3. 按名存入**最近祖先 scope** 的 `components` 映射；
4. 返回 `null` **剪枝**——组件元素及其子树不进结果 DOM、不建 scope。

所以组件元素本身永远不会出现在页面上：

```html
<div x-scope>
    <!-- 声明：编译后从 DOM 消失，仅作为 "counter" 组件供体 -->
    <div x-define="counter">
        <span x-text="count"></span>
        <script setup>{ data: { count: 0 } }</script>
    </div>
    <div x-component:counter></div>
</div>
```

### 组件归属

组件挂到其**最近的祖先 scope**——可以跨任意深度的中间纯 `<div>`（这些不建 scope 的容器会被穿透）。向上找不到任何带 scope 的祖先时，编译期 `warn` 丢弃该组件。这就是为什么作用域组件声明通常需要一个 `x-scope`（或任意其他建 scope 的指令/插值）作为祖先锚点。

### 命名约定

- 组件名自由命名（`counter`、`my-card`、`UserAvatar` 均可），不预定义任何 UI 态名册；
- 无值的 `x-define`（裸属性）取默认名 `default`；
- 同名组件直接归属**同一 scope** 时 `warn` + 后者覆盖（不抛错）；
- 沿 parent 链允许就近覆盖（内层遮蔽外层）。

### 全局组件自动包装

全局组件字符串入参规范化为「恰好一个带 `x-define` 的根元素」（仅全局字符串入参适用，作用域组件入参已是 DOM）：

| 输入形态 | 包装结果 |
| --- | --- |
| 单顶级元素、无 `x-define` | 根打本 key 名（`x-define="name"`） |
| 单顶级元素、**已含** `x-define` | 尊重原值不重命名 |
| 多顶级节点 / 元素+文本混排 | 包一层 `<div x-define="name">` |
| 纯文本无元素 | 包成 `<div x-define="name">文本` |

包装标签固定 `<div>`。
