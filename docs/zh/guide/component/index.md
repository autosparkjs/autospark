# 组件

## 概述

**组件**（`x-define`）是 AutoSpark Engine 的可复用 UI 单元——把一段 DOM 连同它的**数据、方法、生命周期、作用域样式**打包封装，在模板里声明一次，即可在任意位置反复实例化使用。

组件让模板具备「结构复用 + 内聚状态」的能力：每个组件实例拥有独立的响应式数据域、自己的方法、四阶段生命周期，以及默认只命中本实例的作用域样式。与 `x-data` 的局部状态不同，组件是**声明性的供体**——它在编译期被摘除、冻结为快照，消费时（`x-component`）才克隆实例化。

一个组件长这样：

```html
<div x-define="counter">
    <button x-on:click="dec">−</button>
    <span x-text="count"></span>
    <button x-on:click="inc">+</button>

    <!-- 数据、方法、生命周期 -->
    <script setup>
        {
            data: { count: 0 },
            methods: { inc() { this.data.count++ }, dec() { this.data.count-- } },
            mounted() { console.log('已挂载') },
        }
    </script>

    <!-- 作用域样式：默认只命中本组件实例 -->
    <style>.count { font-weight: bold }</style>
</div>
```

组件有两个来源、两种使用方式：

| 来源 | 声明方式 | 可见范围 |
| --- | --- | --- |
| **作用域组件** | 模板里 `<div x-define="name">` | 挂最近祖先 scope，仅本作用域可见 |
| **全局组件** | 构造引擎时 `options.components` 传入（字符串） | 全引擎复用（scope 链终点兜底） |

| 使用方式 | 作用 |
| --- | --- |
| `x-component` | 在模板中**实例化**一个组件 |
| `x-import` | 从远程 url **加载**组件定义（可 `.global` 注册为全局） |

此外，`x-loading` 等内置消费者也经 `getComponent(name)` 取用组件来定制默认 UI。

::: tip 组件元素不渲染自身
`x-define` 声明的元素在编译期会被**摘除**——它不进结果 DOM、不建 scope、不渲染。它只是作为「模板供体」上交给祖先 scope，等待 `x-component` 克隆实例化。
:::

## 组件类型

组件按**声明位置与可见范围**分两类。

### 作用域组件

在模板里用 `<div x-define="name">` 声明的组件，挂在**最近祖先 scope**，仅本作用域（及其子树）可见。这是最常用的形式：

```html
<div x-scope>
    <div x-define="badge"><span>局部徽章</span></div>
    <div x-component:badge></div>  <!-- 命中上面的局部组件 -->
</div>
```

作用域组件支持「就近覆盖」——内层 scope 声明的同名组件会遮蔽外层，这与组件查找的就近原则一致。配合全局组件，可实现「公共全局 + 局部特例」。

<demo html="component/scoped.html"/>

### 全局组件

在构造引擎时经 `options.components` 传入的组件，是字符串模板，全引擎复用。当 scope 链上没有同名作用域组件时，`getComponent` 最终兜底到全局组件：

```javascript
const engine = new AutoSpark(el, {}, {
    components: {
        badge: `<span class="badge">全局徽章</span>`,
        // 支持 <script setup> 与 <style>，能力与作用域组件等价
        card: `<div class="card"><span x-text="title"></span><script setup>{ data:{title:'默认'} }</script></div>`,
    },
});
```

全局组件字符串入参首次使用时，按顶级节点数**自动包装**为「恰好一个带 `x-define` 的根元素」（详见[开发组件 → 全局组件自动包装](./develop.md#全局组件自动包装)），并懒预编译缓存。

<demo html="component/global.html"/>

## 深入阅读

- [开发组件](./develop.md)——从零开发一个组件：快速入门五步走，以及 `x-define` 声明细节
- [实例化组件](./instantiate.md)——`x-component` 用法、props 传递与更新语义
- [响应式数据](./data.md)——`data` 声明、组件上下文 `this`、顶层私有变量、数据边界
- [组件间通讯](./communication.md)——props 下传 / 全局 state / 事件总线
- [生命周期](./lifecycle.md)——四阶段钩子与触发时机
- [样式](./styles.md)——作用域 CSS 与响应式样式 `bind()`
- [远程组件](./remote.md)——`x-import` 远程加载与批量注册
- [配置选项](./options.md)——声明 / 实例化 / 远程加载的全部配置项
- [注意事项](./notes.md)——使用约束与易错点
- [常见问题](./faq.md)——高频问题排查
