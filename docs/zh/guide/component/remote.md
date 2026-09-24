# 远程组件

`x-import` 从远程 url 加载组件定义——fetched HTML 内可含 **1-N 个 `x-define`**，加载后注册到当前 engine：

```html
<!-- 作用域组件：挂最近祖先 scope，仅本作用域可见 -->
<div x-import="/components.html"></div>

<!-- 全局组件（.global 修饰符）：注册到 engine，全引擎复用 -->
<div x-import.global="/global-components.html"></div>
```

加载后用 `x-component` 实例化即可。远程组件与本地组件能力**完全等价**——同样支持 `<script setup>`、`<style>`、props、生命周期。

## 异步占位与编译时序

`x-import` 的 fetch 是异步的，**不阻塞编译**。组件就绪前，`x-component` 宿主显示 loading 占位；组件就绪后引擎广播 `component/registered`，pending 的 `x-component` 收到通知重新实例化（首次渲染用最新 props）。

```html
<div x-scope>
    <!-- 1. 发起远程加载 -->
    <div x-import="/components/like-button.html"></div>
    <!-- 2. 加载完成前显示 loading 占位，就绪后自动渲染 -->
    <div x-component:like-button></div>
</div>
```

<demo html="component/import.html"/>

## `.global` 修饰符与批量注册

一个远程 HTML 文件可含多个 `x-define`，一次性批量注册。加 `.global` 修饰符则注册为全局组件，全引擎可跨任意作用域实例化：

```html
<!-- widgets.html 含 stat 与 chip 两个组件，全部注册为全局 -->
<div x-import.global="/components/widgets.html"></div>

<div x-component:stat="{label: '收入', value: '12,580', tone: 'up' }"></div>
<div x-component:chip="{text: '批量注册' }"></div>
```

<demo html="component/import-global.html"/>

## 健壮性

| 场景 | 行为 |
| --- | --- |
| url 缓存 | 重复 `import` 同一 url 只 fetch 一次 |
| 循环 import | A import B import A → `warn` + 中断该条链（不抛错，已加载的照常注册） |
| fetch 失败 / HTTP 非 2xx | `warn` + 该组件视为未注册（不阻断其余组件） |
| url 响应式 | url 含表达式特征时经 `watch` 求值，url 变化重新加载 |

::: tip 远程组件测试文件
上面两个 demo 加载的真实组件文件在仓库 `docs/public/components/` 下：[`like-button.html`](https://github.com/autosparkjs/autospark/blob/main/docs/public/components/like-button.html)（作用域，含 data/methods/scoped style）、[`widgets.html`](https://github.com/autosparkjs/autospark/blob/main/docs/public/components/widgets.html)（全局，含 stat 与 chip 两个组件）。可下载到自己的静态服务器复用。
:::
