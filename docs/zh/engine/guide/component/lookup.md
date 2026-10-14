# 查找组件

「找到组件」在引擎里是**两个问题**，共用一套词汇但机制互不相干：

- **查找组件声明**（本章第一节）：`<div x-define="counter">` 这份声明挂在哪里、`x-component:counter` / `x-dialog` 等消费者如何按名取到它——决定声明的**可见范围**与**可用时机**；
- **获取组件实例**（本章第二节）：组件实例化之后，页面脚本如何拿到**这个实例**——调它的方法、读写它的数据——入口是 `engine.getComponent(el)`。

## 查找组件声明

`x-component:counter` 实例化（或 `x-dialog` 等消费者取用）时，引擎如何找到 `<div x-define="counter">` 这份声明？答案是两个**互相独立**的协议：

- **归属**（编译期）：每份 `x-define` 声明挂到哪个 scope——由**声明的位置**决定；
- **查找**（消费时）：消费者从哪个 scope 出发、沿什么路径取用——由**消费的位置**决定。

二者共同决定了「声明的可见范围」与「声明的可用时机」。理解这一节，就能回答诸如「声明写在这里能不能被找到」的一类问题。

### 查找链：就近向上 + 全局兜底

消费者（`x-component` / `x-dialog` / `x-loading` 等）经 `getComponentDeclaration(名称, el?)` 取组件，查找顺序固定：

```
消费元素自身的 scope
  → 沿 parent 链逐级向上，取首个持有该名称的 scope（就近者胜）
  → 到顶后兜底 engine.options.components（全局业务组件，懒预编译）
  → 仍无则兜底 engine.options.builtinComponents（内置组件末端兜底，ADR-0094）
```

命令式调用 `engine.getComponentDeclaration(名称)` 省略 `el`（或元素不在任何 scope 内）时跳过 scope 链、直接查全局两级注册位。

由此得到两条推论：

- **就近遮蔽**：内层 scope 声明的同名组件遮蔽外层同名与全局同名——「局部特例 + 公共兜底」的基础；
- **向上穿透**：祖先 scope 声明的组件对全部后代可见（不是「独立作用域」）——声明放得越高，可见范围越大。

```html
<div x-scope>
    <!-- 外层声明：本容器内全部后代可查到 -->
    <div x-define="badge"><span>外层徽章</span></div>

    <div x-component:badge></div>  <!-- ✅ 命中外层声明 -->

    <!-- 内层 scope 同名声明：就近遮蔽外层，仅本子树可见 -->
    <div x-scope>
        <div x-define="badge"><span>内层特例徽章</span></div>
        <div x-component:badge></div>  <!-- ✅ 命中内层（就近） -->
    </div>
</div>
```

<demo html="component/scoped.html"/>

未命中时不抛错，行为按消费者分：

| 消费者 | 未命中行为 |
|---|---|
| `x-component` | 显示 loading 占位，监听组件就绪（`x-import` 加载完成）后自动重试 |
| `x-dialog` 等覆盖物 | `warn` + 等待；visible 仍为真时 `x-import` 就绪会自动打开 |

### 归属：挂最近祖先 scope

`x-define` 在编译期被前置收集：从声明元素**向上找最近的带 scope 祖先**，冻结快照挂到它的 `components` 上，然后从渲染树摘除。规则：

- **任意深度**：中间隔着不建 scope 的纯 `<div>` 不截断归属，直接穿透；
- **嵌套 scope 归最内层**：多层带 scope 祖先时，挂最近的那层；
- **必须有祖先 scope**：向上找不到任何带 scope 的祖先（`x-scope` 或任意其他建 scope 的指令 / 插值）时，编译期 `warn` 并丢弃该声明。

```html
<div x-scope>
    <!-- 中间的纯 div 不建 scope，归属穿透到外层 x-scope -->
    <div class="pure-wrapper">
        <div class="pure-wrapper-2">
            <div x-define="card"><span>卡片</span></div>  <!-- 挂外层 x-scope -->
        </div>
    </div>
    <div x-component:card></div>  <!-- ✅ 同 scope 命中 -->
</div>
```

::: tip 为什么常需要 x-scope
纯容器 `<div>` 默认不建 scope。要在一个「无任何指令的容器」上提供归属锚点，`x-scope` 是最轻的声明（零副作用的纯占位指令）。
:::

### 声明位置决定可见范围

把两个协议合在一起，常见声明位置的查找结果如下：

| 声明位置 | 挂到哪个 scope | 谁能查到 |
|---|---|---|
| 祖先容器内（`x-scope` 包裹） | 该祖先 scope | 容器子树内全部消费 |
| 与消费处同级（兄弟位） | 共同父 scope | 同容器内消费（**推荐**） |
| 消费宿主子树内（如按钮内部） | 消费宿主自身的 scope | 仅该宿主自身（见下文边界） |
| 嵌套 `x-define` 内 | 外层组件的实例 scope | 仅外层组件实例内部（[私有子组件](../directives/x-define.md#嵌套私有子组件)） |
| 无带 scope 的祖先 | 无处归属 | `warn` + 丢弃 |

#### 推荐形态：声明在消费之外、之前

声明是「模板供体」，与消费位置**分离**是推荐写法——兄弟位或祖先位均可，且放在消费**之前**（文档序）：

```html
<div x-scope>
    <!-- 声明：兄弟位，挂共同父 scope（x-scope） -->
    <div x-define="login">
        <h3>{{ title }}</h3>
        <button @click="close()">关闭</button>
    </div>

    <!-- 消费：状态驱动开关（覆盖物渲染到 body 容器，与声明处 DOM 位置无关） -->
    <button x-dialog:login="ui.loginVisible" @click="ui.loginVisible = true">登录</button>
</div>
```

<demo html="component/lookup.html"/>

覆盖物（`x-dialog` / `x-popup` 等）的组件渲染目的地是 `document.body` 下的容器——**实例化位置与声明处的 DOM 位置无关**，声明不必（也不应）塞进触发按钮里。

#### 特殊形态：声明在消费宿主子树内

把 `x-define` 写进消费元素内部（如触发按钮的子级），**机制上能查到**——宿主元素因带指令而建 scope，对子级 `x-define` 而言它就是最近祖先，声明恰好挂在消费自身的 scope 上，查找第一跳即命中。但有两个边界，**不推荐**这种写法：

**1. 时序边界（编译期消费会扑空）**

编译按文档序深度优先、**父先子后**：消费元素的指令先执行，宿主子树内的声明**之后**才被收集。「读取早于写入」对这两类消费者是实际坑：

| 消费者 | 实例化时机 | 后果 |
|---|---|---|
| `x-component` | 编译期一次（`created` 内） | 未命中 → 残留 loading 占位，`x-define` 收集不触发重试，永不实例化 |
| `x-dialog`（visible **初始为真**） | 编译期（初值即开） | 未命中 → `warn` 后等待，弹层永不出现 |
| `x-dialog`（visible 初始为假，交互后开） | 运行期 | ✅ 不受影响——打开发生在整树编译完成之后 |

**2. HTML 结构边界（交互元素嵌套拆散）**

宿主是 `<button>` 这类交互元素时，组件内容里的同类元素会被 HTML 解析器**隐式闭合**——`<button>` 内不能嵌 `<button>`，内层按钮会被拆成外层的兄弟节点，组件快照因此缺件（关闭按钮跑到组件外、裸露在页面上且关不掉弹层）。声明应放在普通容器（`<div>` 等）中，与消费分离即可天然规避。

**3. 数据视图基准重合（隐式语义）**

声明处与消费处重合时，`dataContext` 的 `'declarer'`（声明处）与 `'host'`（消费处）两基准指向**同一个 scope**——同一份声明放在消费宿主内与放在外层容器，会产生不同的数据视图基准，而模板上没有任何显式标记区分。这也是「声明与消费分离」更可预期的原因之一。

### 时序速查：声明的文档序

| 消费者类型 | 实例化时机 | 对声明文档序的要求 |
|---|---|---|
| `x-component` / `x-loading` 等 | 编译期 | 声明必须在消费**之前**（祖先位或前置兄弟位） |
| `x-dialog` 等状态驱动覆盖物 | visible 翻真时（运行期） | 无要求，但初始即真的形态等同编译期消费，同样要求在前 |

一句话：**编译期消费的，声明写在前；运行期消费的，何时声明都行**——统一按「声明在前」书写最省心。

### 全局组件兜底

scope 链到顶未命中时，`getComponentDeclaration` 兜底查全局组件定义表（先查已登记的名，miss 再惰性读构造选项 `options.components` 的字符串模板，自动包装 + 懒预编译）。全局组件与作用域组件经**同一条查找链**取用，消费者无需区分来源；局部同名就近遮蔽全局同名。详见[关于组件 → 全局组件](./index.md#全局组件)与[开发组件 → 全局组件自动包装](./develop.md#全局组件自动包装)。

动态注册（运行时增补组件）不走 `options.components`（构造期配置语义），用 [`engine.registerComponent`](./runtime.md) 或 [`x-import`](./remote.md) 远程加载——x-import 触发的就绪信号正是上表「未命中等待」的唤醒来源。`registerComponent` 的归属三态（`scope` / `el` / 全局）、严格单根契约、覆盖与继承挂起语义详见[运行时创建组件](./runtime.md)。

## 获取组件实例

上一节回答「声明怎么被找到」；这一节回答另一半：**组件实例化之后，页面脚本如何拿到这个实例**——比如从业务代码或控制台里让某个组件 +1、读它的当前状态、在测试里驱动它。

### engine.getComponent(el)

自**任意元素**沿 DOM 链向上找**最近的组件实例**，返回与组件内 `this` 同构的门面对象（`ComponentInstance`）：

```html
<div x-scope>
    <div x-define="counter">
        <span x-text="count"></span>
        <script setup>
            { data: { count: 1 }, methods: { inc() { this.data.count++ } } }
        </script>
    </div>
    <div id="host" x-component:counter></div>
</div>
```

```javascript
const inst = engine.getComponent(document.querySelector("#host"));

inst.name;              // "counter"（x-component:名称 的属性参数）
inst.data.count;        // 1（聚合数据视图，响应式、可写）
inst.methods.inc();     // 调组件方法——与组件内 this.inc() 同一 this 绑定
inst.data.count = 100;  // 外部改数据，组件自动刷新
```

**就近即止**：传嵌套组件的内部元素返回**内层**实例——「这个元素属于哪个组件」的自然语义。不必精确传到 `x-component` 宿主，组件内任意元素都能反查；元素在任何组件之外时返回 `undefined`。

<demo html="component/instance.html"/>

### 门面字段：实例就是组件外的 this

| 字段 | 语义 |
| --- | --- |
| `el` | 实例根元素（宿主化身组件根） |
| `name` | 组件名（`x-component:名称` 的属性参数） |
| `data` | 聚合数据视图（自有 data+props → 祖先近层 → 全局 state），响应式、可写 |
| `props` | `data` 的完全等价别名 |
| `globalState` | 全局状态（`engine.state`）——聚合视图同名键遮蔽时取全局值的明确通道 |
| `methods` | 组件方法的 this 绑定代理——`inst.methods.inc()` 与组件内 `this.inc()` 行为一致 |
| `scope` | 实例 scope 逃生舱（`this.scope` 同款；内部对象，字段布局非公开契约） |

与[组件间通讯](./communication.md)的关系：通讯文档里 `this.data` / `this.globalState` 的全部约定，在组件外拿到实例后**原样成立**——门面就是「组件外的 this」。

### 覆盖物不走此通道

覆盖物（`x-dialog` / `x-popup` 等）的实例渲染在 `document.body` 下的容器——**触发按钮的 DOM 链通不到实例**，`getComponent(el)` 对覆盖物恒为 `undefined`。命令式操控覆盖物用 `engine.getOverlay(el, name)` 返回的句柄（`open()` / `close()` 等），详见[覆盖物](../overlays.md)。

### 组件内不需要「获取」

组件**内部**天然持有实例：methods / 钩子里的 `this` 就是（见[响应式数据](./data.md)）。跨组件联动优先走全局 state / 事件总线（[组件间通讯](./communication.md)）——拿实例是**命令式场景**（外部脚本驱动、调试探查、测试）的工具。
