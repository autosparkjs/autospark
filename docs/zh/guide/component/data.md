# 响应式数据

## data 声明

组件的**响应式数据**由 `<script setup>` 的 `data` 段声明——注入组件的响应式数据域：模板表达式直接用字段名取用，任何修改都驱动视图更新（ADR-0057）。支持两种形态：

```javascript
{
    data: { count: 0, step: 1 },        // 形态一：对象字面量（实例化时深克隆，多实例不共享引用）
    data() { return { count: 0 } },     // 形态二：工厂函数（每实例调用一次）
}
```

- **注入顺序**：`data` 默认先注入，`x-component` props 后覆盖（同名键外部优先）；
- **模板可见**：`x-text="count"`、<span v-pre>`{{ count }}`</span> 直接读，改动即更新；
- **method / 钩子内**经 `this.data.count` 读写（`this.props` 是其等价别名）；
- **多实例隔离**：对象字面量实例化时深克隆、工厂每实例调用——各实例独立一份。

## 组件上下文

组件 methods 与生命周期钩子内的 `this` 是一个 **Proxy 代理对象**，把组件实例的能力以直观的方式暴露出来——方法内 `this.xxx` 就像操作一个「组件实例」，无需关心底层 scope。

### this 暴露集合

| `this.x` | 指向 | 可写 |
| --- | --- | --- |
| `this.data` | **聚合数据视图**：组件自有 data+props（自有层优先）→ 祖先近层 → 全局 state，**响应式** | ✅ 逐字段写触发更新 |
| `this.props` | `this.data` 的**等价别名**（同一聚合视图；props 注入键位于自有层） | ✅ 同 `this.data` |
| `this.globalState` | 全局 store 状态（`engine.store.state`）——聚合视图同名键自有层优先遮蔽，**取全局值用它** | ✅ |
| `this.engine` | 引擎实例（事件总线 `this.engine.emit/on`、`this.engine.store` 等） | ❌ |
| `this.scope` | 当前组件实例 scope（需调 scope 原生方法时用） | ❌ |
| `this.el` | 组件根元素 HTMLElement | ❌ |
| `this.<方法名>` | 组件 methods（**支持 `this.inc()` 直调、`this.other()` 互调**，仅本组件边界内） | — |
| `this.<顶层私有变量>` | 组件私有变量（见[下文](#顶层私有变量)，非响应式） | ✅ |
| `this.watch` / `this.read` / `this.getComponent` | scope 同名方法（订阅/读值/取组件） | — |
| `this.$parent` | 父组件实例的 Proxy（沿链最近父组件，支持 `this.$parent.$parent` 链式；顶层为 null） | — |

::: warning 框架引用键不可整体覆盖
`this.data` / `this.props` / `this.globalState` / `this.engine` / `this.scope` / `this.el` 是框架注入的引用，**禁止整体覆盖**（`this.data = {...}` 会 warn 并忽略）。改数据请逐字段：`this.data.count = 5`。
:::

### methods 是独立机制（非 action）

组件 methods 与 action 是**两种不同机制**：methods 是组件内部方法，注入 `scope.methods`（不是 `scope.actions`），经**组件边界**查找（不穿透父组件，保证封装），以 Proxy 为 this 调用。`x-on:click="inc"` 优先查组件 method，找不到才退回 action。

- `this.inc()`、`this.other()` **直接调用**组件方法（无需 `this.methods.inc()`）；
- method 内 `this.data.count++` 修改后，界面自动更新；
- methods **不经事件总线包装**——不广播 `actions/<name>/*`、不冒泡 CustomEvent（定位是组件内部逻辑）。

下面这个 demo 在 `created` 演示读 `this.data` / `this.globalState`，`mounted` 演示 `this.el`，模板用响应式表达式拼接问候语（点击改全局用户名 → 自动更新）：

<demo html="component/context.html"/>

```html
<div x-define="hello">
    <!-- 模板表达式订阅 state.user.name，响应式更新 -->
    <div class="hello" x-text="greeting + '，' + user.name + '！'"></div>
    <script setup>
        {
            data: { greeting: '你好' },
            created() {
                // created：演示 this.data（组件数据）与 this.globalState（全局树）可读
                console.log('greeting =', this.data.greeting, '；user =', this.globalState.user.name);
            },
            mounted() {
                // mounted：this.el 即组件根元素
                this.el.setAttribute('title', '由组件上下文生成');
            },
        }
    </script>
</div>
```

::: tip 方法间互调
method 内可直接 `this.otherMethod()` 调用同组件的其他方法——无需 `this.methods.xxx()` 或 `this.getMethod('xxx')`，符合主流组件框架的直觉。
:::

## 顶层私有变量

`<script setup>` 顶层除保留键（`data` / `methods` / 钩子名）外的**其余键**是组件私有变量——非响应式、不进聚合视图，专为「不该触发更新的实例内部数据」设计：定时器句柄、缓存、防抖标记、第三方库实例引用等。值为函数时即私有方法（`this.helper()` 可调）。

```javascript
{
    data: { time: '...' },   // 响应式：改了驱动更新
    timer: null,             // 非响应式私有变量：改了不更新，组件私有
    cache: {},
    helper() { /* 私有方法 */ },
    methods: {
        start() { this.timer = setInterval(() => this.data.time = Date(), 1000) },
    },
    beforeUnmount() { clearInterval(this.timer) },
}
```

### data 与顶层私有变量的区别

| | `data`（响应式数据） | 顶层私有变量（私有数据） |
| --- | --- | --- |
| 声明 | 对象字面量或工厂函数 | setup 顶层键（非保留键） |
| 响应式 | ✅ 改了触发更新 | ❌ 改了不更新 |
| 模板可见 | ✅ <span v-pre>`{{x}}`</span> / `x-text="x"` 可读 | ❌ 模板表达式读不到（不进聚合视图） |
| 访问方式 | `this.data.x` / `this.props.x` 或模板 `x` | 仅 `this.x`（method / 钩子内） |
| 典型用途 | 业务展示数据 | 定时器句柄、缓存、防抖标记、内部 helper |

### 读写规则

- **读**：`this.<键>`（如 `this.timer`）。优先级低于 method / `data` 字段 / 框架引用——同名时响应式字段优先、私有变量被遮蔽。
- **写**：`this.<键> = 值`——若该键已在 `data` 中出现则写响应式数据域，否则写私有变量。故 `this.timer = setInterval(...)` 自动落进私有变量。
- **重名保护**：与内置上下文键（`props` / `globalState` / `engine` / `scope` / `el` / `$parent`）重名时 `warn` 并忽略该变量（内置优先）。
- **跨生命周期共享**：`created` 设、`mounted` 用、`beforeUnmount` 清——这是私有变量的核心用途（实例级、跨阶段、非响应式）。

::: warning 私有变量不进模板
顶层私有变量是组件私有的，**模板表达式读不到**——`<span x-text="timer">` 取不到（它是定时器句柄，本就不该显示）。要展示的数据放 `data`，内部数据放顶层变量。
:::

下面这个 demo 用顶层 `timer` 跨 `mounted` / `beforeUnmount` 共享定时器句柄：勾选挂载时钟、取消勾选卸载（`beforeUnmount` 清理定时器）。

<demo html="component/data.html"/>

```html
<div x-define="clock">
    <span x-text="time"></span>
    <script setup>
        {
            data: { time: '00:00:00' },     // 响应式：驱动时钟显示
            timer: null,                    // 非响应式私有变量
            mounted() {
                this.timer = setInterval(() => {    // 句柄存私有变量
                    this.data.time = new Date().toLocaleTimeString();
                }, 1000);
            },
            beforeUnmount() {
                clearInterval(this.timer);          // 读私有变量清理
            },
        }
    </script>
</div>
<!-- 勾选挂载、取消勾选卸载（触发 beforeUnmount） -->
<div x-if="running"><div x-component:clock></div></div>
```

## 数据边界（默认封闭与 `open`）

组件默认是**封闭**的：组件模板内只能读**自身 `data`/顶层私有变量、`x-component` 传入的 props、全局 state**，读不到组件声明处外层的 x-data 域或局部变量。组件与外部的数据交互应经 **props 显式声明**——这是组件封装性的基础，也让组件在任何上下文中都可移植（行为不随消费位置变化）。

```html
<!-- ❌ 封闭默认：card 读不到外层的 tip（渲染空） -->
<div x-data="{ tip: '外部数据' }">
    <div x-scope>
        <div x-define="card"><span x-text="tip"></span></div>
        <div x-component:card></div>
    </div>
</div>

<!-- ✅ 封闭默认下的正确写法：props 显式传入 -->
<div x-data="{ tip: '外部数据' }">
    <div x-scope>
        <div x-define="card"><span x-text="tip"></span></div>
        <div x-component:card="{tip: tip }"></div>
    </div>
</div>
```

封闭的范围边界：

| 通道 | 封闭吗 | 说明 |
| --- | --- | --- |
| 祖先 x-data 域 / x-for locals | 🔒 切断 | 读+写一并切断（事件里写外层键也不会穿透） |
| 全局 state | ✅ 可见 | 全局状态是环境，不是隐式耦合（`this.globalState`、`@` 配置绑定照常） |
| `x-on` 调用 action | ✅ 开放 | action 沿链查找是跨组件复用的事件处理器约定，不受边界影响 |
| methods 查找 | 🔒 本就有界 | 组件 method 边界（`open` 不改变它） |
| `this.$parent` | ✅ 保留 | 显式向上寻址是子组件作者的主动声明 |
| `x-data` 相对挂载 `..` | 🔒 边界止步 | 越过组件边界视同越顶落根 |

### `open`：开放数据边界

开发复杂组件（如树组件内部多个子组件共享数据）时，可由**组件作者**声明 `open` 开放边界：

```html
<!-- .open 修饰符 -->
<div x-define.open="tree-node">…</div>

<!-- 等价的指令选项写法 -->
<div x-define="tree-node" x-define-options="{ open: true }">…</div>
```

<demo html="component/open-boundary.html"/>

开放后组件继承哪个上下文，由 **数据上下文 `dataContext`** 决定（默认 `'host'`；原 `scope` 键已更名——避免与 `x-scope`/`AutoSparkScope` 撞名，与覆盖物的 `dataContext` 同键同语义）：

| 数据上下文 | 语义 | 典型场景 |
| --- | --- | --- |
| `'host'`（默认） | 继承**消费处**上下文（≈ 旧行为） | 通用组件跟随使用者的数据环境 |
| `'declarer'` | 继承**声明处**上下文（词法基准） | 组件固定读取它声明位置所能见的域，与消费位置无关 |

```html
<div x-data="{ who: '声明处' }">
    <div x-scope>
        <div x-define="card" x-define-options="{ open: true, dataContext: 'declarer' }">
            <span x-text="who"></span>
        </div>
        <!-- 消费处的同名 who 被遮蔽也不影响：declarer 基准读声明处 -->
        <div x-data="{ who: '消费处' }">
            <div x-component:card></div>   <!-- 渲染「声明处」 -->
        </div>
    </div>
</div>
```

### 数据上下文的消费侧覆盖（`x-component-options`）

实例化时可用 `x-component-options="{ dataContext: 'host' | 'declarer' }"` 覆盖**已开放组件**的数据上下文（消费处覆盖 > 作者声明 > 默认 `'host'`）。**封闭是作者契约**——消费侧不能打开封闭组件：对未 `open` 的组件声明 `x-component-options.dataContext` 会 `warn` 并保持封闭。

#### 消费侧 `.open`：显式豁免作者契约

`x-component` 支持 `.open` 修饰符（≡ `x-component-options="{open:true}"`，ADR-0053 修订）——**显式声明即豁免**：打开封闭组件、不 `warn`，基准默认 `'host'`，可与 `x-component-options.dataContext` 组合指定声明处基准。它只作用于当前实例，组件声明本身的封闭契约不变；适合「确知组件模板数据来源安全」的场合（自有组件、内部组件库）为单个实例开启上下文透传。

```html
<!-- 打开封闭组件（默认 host 基准，读消费处上下文） -->
<div x-component:card.open></div>

<!-- 打开 + 指定声明处基准 -->
<div x-component:card.open x-component-options="{ dataContext: 'declarer' }"></div>
```

::: warning 仅指令选项层生效
消费侧 `open` 只认 `x-component.open` / `x-component-options`——宿主元素 `x-options` 里给其他指令声明的 `open` 键**不会**回退命中，不会意外打开组件。
:::

下面这个 demo 演示消费侧 `.open` 豁免——同一个封闭组件实例化两次，普通实例化保持封闭、`.open` 实例读到外层数据：

<demo html="component/consumer-open.html"/>

下面这个 demo 用同一模板的两个组件对比 `host` / `declarer` 数据上下文，并演示消费侧覆盖——同一组件实例化三次，读到不同的 `who`：

<demo html="component/data-context.html"/>

::: warning 三条失效告警（均 warn 一次 + 忽略）
- 作者声明了 `dataContext` 但没有 `open`——数据上下文没有生效条件；
- 消费侧对封闭组件声明 `x-component-options.dataContext`；
- 全局组件（`options.components` 字符串，无声明处）声明 `dataContext: 'declarer'`——退化为封闭行为。
:::

::: tip open 不传播
`open` 是每个组件定义自己的开关：开放组件 A 内部嵌套声明的私有子组件 B 仍是默认封闭。要让 B 共享 A 的上下文，给 B 单独声明 `open`（嵌套声明的 B 其「声明处」就是 A 的实例）。
:::
