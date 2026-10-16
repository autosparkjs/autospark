# 元素名组件

## 概述

`x-define-options` 的 `directive` 键把组件注册为**元素名形态指令**（ADR-0117）：模板中直接写元素标签即实例化组件——`<x-counter>` 与 `<div x-component:counter>` **完全等价**（宿主化身组件根、props、插槽、事件全量同构）。

写法接近 Web Components 的使用体验，但不涉及原生 customElements——元素名只是**指令触发标签**（无 Shadow DOM、无升级时序），元素名触发本就是指令系统的通用能力（指令类声明 `static elementName` 即以标签触发，如内置的 [x-super](../directives/x-super.md)），本机制只是为组件自动生成这样的指令类。

```html
<div x-scope>
    <!-- 声明：directive: true → 标签自动推导为 x-counter -->
    <div x-define="counter" x-define-options="{ directive: true }">
        <span x-text="count"></span>
        <script setup>{ data: { count: 0 }, methods: { inc() { this.data.count++ } } }</script>
    </div>

    <!-- 元素名实例化 -->
    <x-counter count="100"></x-counter>
</div>
```

## 启用：`directive` 键

| 值 | 行为 |
| --- | --- |
| `true` | 标签自动推导为 `x-{组件名}`（小写化） |
| 含连字符的非空字符串 | 自定义标签（如 `'my-counter'` → `<my-counter>`，小写化） |
| `false` / 未声明 | 不注册（缺省关闭——显式声明才启用） |
| 其余值（数字 / 空串 / 无连字符字符串 / 对象等） | `warn` + 忽略 |

组件经任何路径注册（作用域 `x-define`、`.global`、`engine.registerComponent`、`x-import`、继承）且声明携带 `directive` 时，元素名指令安装统一收口在注册动作内——**注册即安装**，编译前注册即可命中元素名。

<demo html="component/define-directive.html"/>

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
- **优先级**：`:expr` 响应式条目 > 静态属性 > `x-{组件名}-options`——同名条目高频者覆盖低者；
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

元素名注册撞车时按三态处理：

| 情形 | 行为 |
| --- | --- |
| 同组件重复声明（同名同标签，如 `x-for` 克隆） | 静默幂等 |
| 组件名撞预设 / 自定义指令名（如 `for`） | `warn` + 跳过注册 |
| 元素名已被其他指令占用 | `warn` + 跳过注册 |
| 同组件重声明且换了标签 | `warn` + 覆盖（随组件定义覆盖语义对齐） |

## 继承

`x-define:inherit` 的元素名注册**声明为准**：子组件自己声明了 `directive` 才注册元素名——父的声明不默认扩散；子要元素名形态需自行声明。详见[组件继承](./inherit.md)。

## 注意事项

- **标签名全小写**：HTML 元素名被 DOM 全量小写化，注册时统一小写处理；自定义标签**必须含连字符**（HTML 自定义元素惯例，防与原生 / 语义标签撞车），`'card'`（无连字符）是非法值；
- **组件名建议 kebab-case**：`directive: true` 的标签取 `x-{组件名}` 小写化结果，组件名用大驼峰（如 `orderCard`）会得到 `x-ordercard`——与 `x-component:orderCard` 的大小写不一致问题同源，统一小写 / kebab-case 可避免歧义；
- **V1 无修饰符形态**：不提供 `x-define.directive` 修饰符速记，只能写 `x-define-options`；
- **`options.components` 通道边界**：构造选项字符串声明的组件走懒预编译，其 `directive` 注册发生在**首次实例化解析**时——首个消费若直接写元素标签，注册尚未发生不会命中（无挂起重试）；该通道请先用 `x-component` 实例化一次，或改用模板内联 `x-define` 声明；
- **查找链**：元素名实例化与 `x-component` 走同一条组件查找链（scope 链就近 + 全局兜底），无额外配置。

## 深入阅读

- [实例化组件](./instantiate.md)——`x-component` 的详细用法与属性继承
- [x-define 组件定义](../directives/x-define.md)——声明侧配置选项总表
- [组件间通讯](./communication.md)——`this.emit` + `@event` 在通讯体系中的位置
- [开发组件](./develop.md)——`<script setup>` 数据 / 方法 / 钩子
- [x-super 指令](../directives/x-super.md)——引擎内置元素名指令示例
