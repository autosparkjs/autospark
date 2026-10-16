# 全局组件

## 概述

组件按可见范围分两类：**作用域组件**挂最近祖先 scope、只在本作用域链内可见；**全局组件**登记进引擎的**全局组件定义表**，全引擎任意位置的 `x-component` / 约定名消费者都能查到。

作用域组件的声明要挑位置（要有祖先 scope、要写在消费之前），全局组件则**脱离声明位置**——这就是它的存在理由：

- 组件要跨页面、跨面板复用，不想在每个容器里重复声明；
- 声明位置不方便（孤立容器没有祖先 scope，或模板里根本写不进去）；
- 组件由代码 / 接口 / 远程文件按需产生，不是静态模板的一部分。

全局组件与作用域组件经**同一条查找链**取用，消费者无需区分来源；作用域内的同名组件**就近遮蔽**全局同名组件——「公共全局 + 局部特例」因此自然成立。

<demo html="component/global-declare.html"/>

## 声明通道

全局组件有**五条声明通道**，全部写进同一张全局组件定义表、走同一条查找兜底；按「什么时候知道要声明什么」选通道即可：

| 通道 | 时机 | 模板来源 | 何时用 |
| --- | --- | --- | --- |
| `options.components` 构造选项 | 构造期 | 构造参数（字符串） | 组件集合已知，只是模板不在页面里 |
| [`x-define.global`](../directives/x-define.md) 模板内联 | 编译期 | 写在模板里 | 组件随页面发布，模板里直接写最省事 |
| [`engine.registerComponent`](./runtime.md) | 运行期 | 代码里的字符串 | 按数据 / 分支 / 接口结果动态决定 |
| [`x-import.global`](./remote.md) 远程加载 | 运行期（异步） | 远程 url | 模板在服务器上，不进前端产物 |
| 插件 `$.components` | 构造前（脚本期） | 插件脚本里的字符串 | 插件 / 主题包提供可复用组件，多 engine 共享 |

### 构造选项 `options.components`

`Record<string, string>`：键是组件名，值是字符串模板。首次被消费时**自动包装**为「恰好一个带 `x-define` 的根元素」，再懒预编译缓存——支持 `<script type="autospark/setup">` 与 `<style>`，能力与作用域组件等价：

```javascript
const engine = new AutoSpark(el, {}, {
    components: {
        badge: `<span class="badge">全局徽章</span>`,
        card: `
            <div class="card">
                <b x-text="title"></b>
                <span x-text="desc"></span>
            </div>
            <script type="autospark/setup">{ data: { title: '默认' } }</script>
            <style>.card { border-left: 3px solid #3273dc }</style>
        `,
    },
});
```

`open` / `dataContext` 之类组件选项写在字符串根元素上。

<demo html="component/global.html"/>

::: warning 构造期语义
`options.components` 是**构造期配置**：运行时再改它**不会失效**已缓存的懒预编译产物（与 `actions`、`sanitizer` 等 options 同纪律）。要动态增补全局组件，用 `engine.registerComponent` 或 `x-import`，见[注意事项](#注意事项)。
:::

### 模板内联：`x-define.global`

加 `.global` 修饰符（或等价的 `x-define-options="{global:true}"`）即在模板里就地声明全局组件——**跳过归属**，不要求祖先 scope，编译期即时注册，无需任何 JS 配置：

```html
<!-- 两种完全等价的写法 -->
<div x-define.global="brand-card">…</div>
<div x-define="brand-card" x-define-options="{global:true}">…</div>
```

声明物理上写在哪个面板都不影响可见范围：与它链互不相交的兄弟 scope 同样能消费。详见 [x-define → 全局组件](../directives/x-define.md)。

<demo html="component/define-global.html"/>

### 运行时：`engine.registerComponent`

代码里按数据 / 分支 / 接口结果决定「注册什么、什么时候注册」时的正规入口。**省略 `opts` 即注册进全局表**：

```javascript
engine.registerComponent(`
    <div x-define="panel">
        <div class="panel"><slot /></div>
        <style>.panel { border: 1px solid }</style>
    </div>
`);
```

模板串要求与 `x-define` 一致：**恰好一个带 `x-define` 的顶级根元素**。传 `{ scope }` / `{ el }` 则改为作用域注册（三态语义见[运行时创建组件](./runtime.md)）。

<demo html="component/runtime-create.html"/>

### 远程：`x-import.global`

`x-import` 默认注册为作用域组件，加 `.global` 修饰符则注册为全局组件；一个远程 HTML 文件可含 1-N 个 `x-define`，**一次性批量注册**：

```html
<!-- widgets.html 内含 stat 与 chip 两个组件，全部注册为全局 -->
<div x-import.global="/components/widgets.html"></div>

<div x-component:stat="{ label: '收入', value: '12,580', tone: 'up' }"></div>
<div x-component:chip="{ text: '批量注册' }"></div>
```

加载是异步的：组件就绪前 `x-component` 显示 loading 占位，就绪后引擎广播 `components/<名>/registered` 唤醒 pending 的消费者。`x-component:<名>.global` + `loader` 是「加载 + 注册 + 实例化」的一步式写法，语义相同。详见[远程组件](./remote.md)。

<demo html="component/import-global.html"/>

### 插件：`$.components`

插件（在 `new AutoSpark()` 之前加载的脚本）可直接写命名空间上的全局组件表——注册一次，**所有 engine 实例共享**（编译产物跨实例复用）：

```html
<script>
    (function ($) {
        $.components["hello-card"] = "<div x-text='title'></div>"; // 全局组件
    })(AutoSpark);
</script>
```

详见[插件](../plugin.md)。

## 字符串自动包装

除 `x-define.global`（入参已是 DOM）外，其余通道的入参都是字符串，首次使用时按顶级节点数规范化为「恰好一个带 `x-define` 的根元素」：

| 输入形态 | 包装结果 |
| --- | --- |
| 单顶级元素、无 `x-define` | 根打本 key 名（`x-define="name"`） |
| 单顶级元素、**已含** `x-define` | 尊重原值不重命名 |
| 多顶级节点 / 元素+文本混排 | 包一层 `<div x-define="name">` |
| 纯文本无元素 | 包成 `<div x-define="name">文本` |

包装标签固定 `<div>`。完整规则与示例见[开发组件 → 全局组件自动包装](./develop.md#全局组件自动包装)。

## 查找与遮蔽

全局组件是查找链的**终点兜底**，与作用域组件共用一条链：

```
消费元素自身的 scope
  → 沿 parent 链逐级向上（就近者胜）
  → 到顶兜底全局组件定义表（options.components > 插件表 $.components > builtinComponents）
```

由此得到三条结论：

- **消费者无需区分来源**：`x-component` / `x-dialog` / `x-loading` 等对作用域组件与全局组件的取用方式完全一致；
- **就近遮蔽**：内层 scope 声明的同名组件遮蔽全局同名——「公共全局 + 局部特例」的基础；
- **同表同兜底**：五条通道写的是同一张表，同名重复注册 `warn` 一次 + 后者覆盖，**已实例化的实例不热替换**（换定义后新建的实例才取新版）。

配套 demo 里的对照：面板 ② 没有局部声明，`g-inline` 命中全局；面板 ③ 声明了同名局部 `g-inline`，本面板的消费就近命中局部——「公共全局 + 局部特例」因此自然成立。

详见[查找组件 → 全局组件兜底](./lookup.md#全局组件兜底)。

## 注意事项

- **动态增补不要改 `options.components`**：它是构造期配置，运行时突变不失效懒预编译缓存。动态注册走 [`engine.registerComponent`](./runtime.md) 或 [`x-import`](./remote.md)。
- **数据基准恒为消费处**：全局组件脱离声明位置，`dataContext` 恒为 `'host'`；对全局组件声明 `dataContext:'declarer'` 会 `warn` 并忽略（见[响应式数据](./data.md)）。
- **嵌套声明的注册时机**：写在外层组件定义**内部**的 `x-define.global`，要等外层组件**首次实例化**才进全局表——不要在更早位置消费它。
- **继承的父也要全局可见**：全局组件自身声明 `x-define:inherit` 时，父仅在某作用域链可见会直接 `warn` + 拒绝注册（不挂起）；父为尚未就绪的全局组件时注册挂起，待父注册后自动解析（见[组件继承](./inherit.md)）。
- **作用域为当前 engine**：全局组件随 engine 销毁回收，`x-isolate` 子引擎各有自己的表（见 [x-isolate](../directives/x-isolate.md)）。
- **就绪信号**：任何通道注册成功都广播 `components/<名>/registered`（retain，晚订阅也补发），依赖某组件是否就绪时订阅它（见[关于组件 → 组件注册事件](./index.md#组件注册事件)）。

## 深入阅读

- [x-define](../directives/x-define.md)——`.global` 修饰符与 `x-define-options` 的完整规则
- [查找组件](./lookup.md)——归属、查找链与就近遮蔽
- [开发组件](./develop.md)——作用域组件开发与全局组件自动包装
- [运行时创建组件](./runtime.md)——`registerComponent` 的归属三态与覆盖语义
- [远程组件](./remote.md)——`x-import` 批量注册与 `.global`
- [配置选项](./options.md)——声明 / 实例化 / 远程加载的全部配置项
- [注意事项](./notes.md)与[常见问题](./faq.md)——使用约束与高频排查
