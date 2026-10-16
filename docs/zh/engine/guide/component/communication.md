# 组件间通讯

组件实例各自拥有独立的 data 域，默认互不可见（数据边界默认封闭，见[响应式数据 → 数据边界](./data.md#数据边界默认封闭与-open)）。本引擎没有 Vue 那样的 `provide/inject` 或 React 的 Context 专用机制，但靠下面四种**响应式/事件能力**即可覆盖组件间通讯的全部场景。

## 方式一：props 下传（父 → 子）

父组件（或页面）经 `x-component` 的 props 把数据注入子组件 data 域。这是最直接的单向数据流：

```html
<!-- 父把 label 传给 product 组件 -->
<div x-component:product="{label: '键盘', id: 1 }"></div>
```

子组件在 `data` 里声明同名字段作默认值，props 覆盖之。详见[实例化组件 → 传递 props](./instantiate.md#传递-props)。

## 方式二：全局 state 共享（任意组件 ↔ 任意组件）

所有组件都可通过 `this.globalState` 读写**全局 store 状态**。把需要跨组件共享的数据放在全局 state，任意组件改它，其他订阅了该路径的组件自动刷新——这是本引擎最自然的通讯方式（细粒度响应式本就是核心能力）。

```html
<div x-define="product">
    <button x-on:click="inc">+</button>
    <script setup>
        {
            methods: {
                inc() {
                    // 子组件改全局 state.cart，cart-total 会自动刷新
                    this.globalState.cart[this.data.id] = this.data.qty;
                },
            },
        }
    </script>
</div>

<!-- 另一个组件订阅全局 state.cart，product 一改它就联动 -->
<div x-define="cart-total">
    <span x-text="total"></span>
    <script setup>
        {
            data: { total: 0 },
            created() {
                // watch 全局 state.cart 的子键（cart.*），子组件改 cart[id] 时重新求和
                this.engine.store.watch('cart.*', () => {
                    this.data.total = Object.values(this.globalState.cart).reduce((s, n) => s + n, 0);
                });
            },
        }
    </script>
</div>
```

`this.globalState` 是 `engine.store.state`（全局树明确通道，不受聚合视图同名遮蔽影响），组件内直接读写；`this.engine.store.watch(path, fn)` 监听全局路径变化。

## 方式三：事件总线（跨组件解耦）

`engine` 本身是一个事件发射器（`on` / `emit` / `once` / `onAny`）。当两个组件**没有父子关系、也不宜共享 state** 时，用自定义事件解耦通讯——发送方 `emit`，任意监听方 `on`：

```html
<div x-define="product">
    <button x-on:click="favorite">收藏</button>
    <script setup>
        {
            methods: {
                favorite() {
                    // 发送方：emit 自定义事件
                    this.engine.emit('favorite', { id: this.data.id, name: this.data.label });
                },
            },
        }
    </script>
</div>
```

```javascript
// 接收方（任意位置：脚本、另一个组件的 created、祖先作用域）
engine.on('favorite', (e) => {
    console.log('收到收藏事件', e);
});
```

事件总线适合「一次性的动作通知」（如收藏、删除、跳转），不适合「持续的状态同步」（那用全局 state 更合适，响应式自动驱动）。

## 方式四：组件事件（子 → 父）

组件方法 / 生命周期钩子内可用 `this.emit(事件名, detail)` 向组件根元素派发冒泡 `CustomEvent`（ADR-0117）；消费侧在**同元素**写 `@事件名`（`x-on` 速记）监听，处理函数经 `$event.detail` 取载荷。方式一 props 走父 → 子，组件事件走子 → 父，合起来是完整的父子通讯闭环：

```html
<div x-define="counter" x-define-options="{ directive: true }">
    <button x-on:click="inc">+1</button>
    <script setup>
        {
            data: { count: 0 },
            methods: {
                inc() {
                    this.data.count++;
                    this.emit('change', { count: this.data.count });
                },
            },
        }
    </script>
</div>

<!-- 消费侧：同元素 @change 监听 -->
<x-counter @change="total = $event.detail.count"></x-counter>
```

要点：

- 事件沿 DOM 冒泡（`bubbles: true`），所以 `@change` 也可以写在组件宿主的任意**祖先元素**上；
- 与方式三事件总线的区别：`this.emit` 是 **DOM 事件**（面向宿主 / 祖先的定向汇报），`engine.emit` 是**引擎总线事件**（任意位置广播）；
- `this.emit` 不是元素名形态专属——经 `x-component` 实例化的组件同样可用（事件派发在宿主元素上）；
- 持续的状态同步仍推荐全局 state；`emit` 适合「子向父汇报动作 / 数值」。

## 四种方式怎么选

| 通讯场景 | 推荐方式 |
| --- | --- |
| 父传子配置/初始数据 | **props 下传**（`x-component` 对象） |
| 子组件向父汇报动作/数值 | **组件事件**（`this.emit` + `@event`） |
| 多组件共享/同步一份持续状态（如购物车、登录态） | **全局 state**（`this.globalState` + `watch`） |
| 无父子关系的动作通知（如收藏、收藏计数） | **事件总线**（`engine.emit/on`） |
| 子组件通知父组件数据变化 | 组件事件（方式四）；或子写全局 state、父 `watch` |

下面这个 demo 用购物车场景一次性演示三种方式：商品组件（props 下传 + 改全局 state）、合计组件（订阅全局 state 联动）、收藏侧栏（监听事件总线）。

<demo html="component/communication.html"/>

::: tip 事件总线跨作用域
`engine` 的事件总线是**引擎级**的——任意作用域、任意组件、甚至页面脚本都能 `emit`/`on`。事件名自由约定（引擎不预定义名册），建议用带命名空间的写法（如 `cart/add`、`user/login`）避免冲突。
:::

::: tip 从组件外拿到实例
本文的 `this.data` / `this.globalState` 约定在组件**外**同样可用：`engine.getComponent(el)` 返回与组件内 `this` 同构的门面对象——见[查找组件 → 获取组件实例](./lookup.md#获取组件实例)。
:::
