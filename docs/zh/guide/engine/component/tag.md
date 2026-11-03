# 元素名组件

## 概述

组件**缺省开启元素名形态**（ADR-0117；推导规则 ADR-0133）：`x-define` 声明后无需任何选项，模板中直接写元素标签即实例化——`<x-counter>` 与 `<div x-component:counter>` **完全等价**（宿主化身组件根、props、插槽、事件全量同构）。`x-define-options` 的 `tag` 键仅用于**自定义标签名**或 `false` **显式关闭**。

写法接近 Web Components 的使用体验，但不涉及原生 customElements——元素名只是**指令触发标签**（无 Shadow DOM、无升级时序），元素名触发本就是指令系统的通用能力（指令类声明 `static elementName` 即以标签触发，如内置的 [x-super](../directives/x-super.md)），本机制只是为组件自动生成这样的指令类。

```html
<div x-scope>
    <!-- 声明：缺省开启，标签自动推导为 x-counter -->
    <div x-define="counter">
        <span x-text="count"></span>
        <script setup>{ data: { count: 0 }, methods: { inc() { this.data.count++ } } }</script>
    </div>

    <!-- 元素名实例化 -->
    <x-counter count="100"></x-counter>
</div>
```

## 标签推导规则（ADR-0133）

自动标签由组件名**归一化推导**，四步管线：

1. **剥离 `autospark.` 前缀**（官方组件专用通道）：`autospark.button` → `button`，官方组件获得最短标签；第三方命名空间**不剥离**（`mylib.counter` → `x-mylib-counter` 完整转换）；
2. **camelCase 边界插 `-`**：`orderCounter` → `order-counter`（HTML 解析器把元素名全量小写化，不拆分则标签永远匹配不上）；
3. **小写化**；
4. **连续无效字符折叠**为单个 `-` 并去首尾：点 / 下划线 / 空格等非 `[a-z0-9]` 字符。

| 组件名 | 自动标签 |
| --- | --- |
| `counter` | `<x-counter>` |
| `order.counter` | `<x-order-counter>` |
| `orderCounter` | `<x-order-counter>`（同名异写归一） |
| `autospark.button` | `<x-button>`（官方通道剥离） |
| `mylib.counter` | `<x-mylib-counter>`（第三方不剥离） |

推导是**单向别名**：注册表键与 `x-component:order.counter` 查找仍用原名——标签只是使用入口，组件身份不变。

## 启用：`tag` 键

| 值 | 行为 |
| --- | --- |
| 未声明 / `true` | **缺省开启**——按上节归一化推导自动标签 |
| 非空字符串 | 自定义标签（小写化；**不含连字符自动补 `x-` 前缀**——`'div'` → `<x-div>`、`'my-counter'` → `<my-counter>`） |
| `false` | 显式关闭，不注册元素名形态 |
| 其余值（数字 / 空串 / 含非法字符（空格、首尾 `-` 等） / 对象等） | `warn` + 忽略该值，回落自动推导 |

组件经任何路径注册（作用域 `x-define`、`.global`、`engine.registerComponent`、`x-import`、`options.components` / 插件全局表、继承）时均按上表解析 `tag`（缺省携带自动标签），元素名指令安装统一收口在注册动作内——**注册即安装**；全局表组件懒预编译的时序缺口已由编译期反查修复（见[注意事项](#注意事项)）。

<demo html="component/define-tag.html"/>

## props：属性即 props

元素名形态的 props 直接写在标签属性上：

```html
<!-- 静态属性即 props：值做类型推断 -->
<x-counter count="100" step="5" title="计数器"></x-counter>
<!-- → props 为 { count: 100, step: 5, title: "计数器" } -->

<!-- :name="expr" 响应式 props -->
<x-counter :step="step"></x-counter>

<!-- 选项属性兜底（优先级最低；x-component-options 为兼容别名） -->
<x-counter x-counter-options="{ count: 55 }"></x-counter>
```

规则：

- **类型推断**（静态属性）：纯数字 → `number`、`true`/`false` → `boolean`、`{`/`[` 开头 → 宽松 JSON（解析失败回退原字符串）、否则原样字符串；
- **优先级**：`:expr` 响应式条目 > 静态属性 > `x-{标签基名}-options`（标签去 `x-` 前缀，ADR-0133）——同名条目高频者覆盖低者；
- **响应式**：`:step="step"` 随外部状态实时更新（同 `x-component` 值通道语义：更新只覆盖出现的键，组件内部状态不被重置；静态属性被同名 `:expr` 覆盖后以表达式为准）；
- **保留属性**（不折叠为 props）：`class` / `style` / `id` / `data-*` / `x-*` 留给宿主化身——属性继承（class 拼接、style 合并等）照常生效；`:class` / `:style` / `:data-*` 同样保留，走属性绑定。

## 事件：`@event` + `this.emit`

消费侧同元素写 `@事件名`（[x-on](../directives/x-on.md) 速记）监听；组件方法 / 生命周期钩子内 `this.emit(事件名, detail)` 向组件根元素派发冒泡 `CustomEvent`，处理函数经 `$event.detail` 取载荷：

```html
<x-counter @bump="log.push($event.detail.count)"></x-counter>
```

```javascript
// 组件内
methods: {
    inc() {
        this.data.count++;
        this.emit('bump', { count: this.data.count });
    },
}
```

事件沿 DOM 冒泡（`bubbles: true`），祖先元素同样可监听。父子通讯全景见[组件间通讯](./communication.md)。

## 与 x-component 的等价性

元素名实例化**复用 x-component 全部机制**：宿主化身组件根、数据边界（封闭 / `open`）、插槽出口投影（`x-slot` / `x-slots`）、props 更新语义、结构指令互斥、递归保护——零特殊分叉。以下两行完全等价：

```html
<x-counter count="100"></x-counter>
<div x-component:counter="{ count: 100 }"></div>
```

需要属性参数形态（组件名 / props 混排、值即状态对象 `x-component:counter="order"`）时仍用 `x-component`；元素名形态专攻「静态属性即 props + 响应式属性」的轻量写法。同元素同时写显式 `x-component:*` 声明时以显式声明为准（自动指令让位）。

## 撞名保护

不同组件**派生同一标签**（如局部 `counter` 与官方 `autospark.counter` 同归 `<x-counter>`）不再报错——**就近遮蔽**（ADR-0133）：标签按**使用处 scope 链**取最近命中的候选——内层任意候选胜外层（官方短标签可被子树局部同名定义覆盖，子树外照常解析官方组件）；同 scope 多候选（就近失灵）按声明序**后声明胜** + `warn`。其余撞名情形：

| 情形 | 行为 |
| --- | --- |
| 同组件重复声明（同名同标签，如 `x-for` 克隆） | 静默幂等 |
| **不同组件撞同标签** | **就近遮蔽**（候选列表，按使用处链位解析） |
| 同 scope 撞同标签 | 后声明胜 + `warn`（就近失灵的决胜） |
| 组件名撞预设 / 自定义指令名（如 `for`） | `warn` + 跳过标签注册（组件本身可用，`x-component:for` 照常） |
| 标签撞非组件指令的元素名（如 `tag: 'x-super'`） | 编译期 **`CompileError`**（fail-fast） |
| 同组件重声明且换了标签 | `warn` + 覆盖（随组件定义覆盖语义对齐） |

## 继承

`x-define:inherit` 的元素名注册**以子声明为准**：子缺省注册自身的自动标签 `x-{子名}`，**父的自定义标签不扩散**；子要自定义标签需自行声明 `tag`，`tag: false` 则关闭子的元素名形态。详见[组件继承](./inherit.md)。

## 注意事项

- **标签名全小写**：HTML 元素名被 DOM 全量小写化，注册与查找统一按小写处理；`tag` 显式值不含连字符时自动补 `x-` 前缀（防与原生 / 语义标签撞车），补前缀后仍须匹配 `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`（空格 / 首尾 `-` 等为非法值，warn + 回落推导）；
- **迁移提示（ADR-0133 破坏性变更）**：归一化推导落地前，camelCase 组件名的自动标签是纯小写化（`orderCard` → `x-ordercard`）；现在拆分为 `x-order-card`。存量模板若用了旧形态小写标签，请改组件名为 kebab-case（推荐）或用 `tag` 显式声明旧标签；
- **官方组件短标签**：`autospark.*` 命名空间注册的组件（如插件全局表里的 `autospark.button`）自动标签已剥离前缀——直接写 `<x-button>` 即用，无需任何暖注册；
- **未知 `x-*` 标签**：编译期会反查全局组件表（`x-greet` 依次尝试 `autospark.greet` / `greet` / camelCase / 点号还原），未命中 `warn` 一次并按普通元素处理——看到该 warn 通常是组件名拼写不一致或定义在使用点之后（局部组件按文档序收集，定义需在使用点之前）；
- **选项属性按标签基名**：`x-{标签基名}-options`（标签去 `x-` 前缀，如 `<x-order-counter x-order-counter-options="{...}">`）——组件名可含点号/大写，标签才是可书写的属性名面（ADR-0133）；`x-component-options` 兼容别名不变；
- **V1 无修饰符形态**：不提供 `x-define.tag` 修饰符速记，只能写 `x-define-options`；
- **查找链**：元素名实例化与 `x-component` 走同一条组件查找链（scope 链就近 + 全局兜底），无额外配置；就近遮蔽只在**撞名标签**上生效（候选列表解析），显式 `x-component:名` 始终精确匹配。

## 深入阅读

- [实例化组件](./instantiate.md)——`x-component` 的详细用法与属性继承
- [x-define 组件定义](../directives/x-define.md)——声明侧配置选项总表
- [组件间通讯](./communication.md)——`this.emit` + `@event` 在通讯体系中的位置
- [开发组件](./develop.md)——`<script setup>` 数据 / 方法 / 钩子
- [x-super 指令](../directives/x-super.md)——引擎内置元素名指令示例
