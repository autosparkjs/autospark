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

## 直接形式：`x-component-options.loader`

不需要批量注册、只用一次的组件，可在 `x-component` 上经 `loader` 选项一步完成「加载 + 注册 + 实例化」——内部复用 `x-import` 同一管线（url 缓存、循环检测、注册广播），加载的组件照常进组件查找链供他人复用（ADR-0065）：

```html
<!-- string 简写：字面量 url -->
<div x-component:like-button x-component-options.loader="/components/like-button.html"></div>

<!-- 对象配置：request 透传 fetch、fallback 自定义加载占位、error 自定义失败呈现 -->
<div x-component:stat="{ label: '收入' }"
     x-component-options="{ loader: { url: '/components/stat.html', width: 160, height: 48 } }"></div>

<!-- .global 修饰符：注册为全局组件 -->
<div x-component:chip.global x-component-options.loader="/components/chip.html"></div>
```

loader 语义「**以此 url 为准**」：组件已注册仍 fetch 并以远程版覆盖注册（覆盖时 warn），首次渲染严格等待 fetch 完成（期间显示 fallback 占位，缺省 = x-loading）。

### 响应式 url

成员属性形态的值是表达式，裸状态路径即响应式 url——url 变化时中止旧请求、重新加载并重实例化（组件内部状态丢失）：

```html
<div x-component:detail x-component-options.loader="detailUrl"></div>
```

字面量 url 请以 `/`、`./`、`http(s)://` 开头书写（与 x-import 双轨判定一致）；其余形态一律作状态路径求值。

### 失败呈现

fetch 失败或加载结果中无同名组件时，宿主渲染**内置 error 组件**（引擎默认注册，用户同名声明可覆盖）——含错误文案、重试按钮（重新 fetch）与关闭按钮，亦可 `x-component:error` 显式实例化渲染任意错误。自定义失败呈现：

```html
<div x-component:stat
     x-component-options="{ loader: { url: '/stat.html', error: '<em>统计不可用</em>' } }"></div>
```

## 健壮性

| 场景 | 行为 |
| --- | --- |
| url 缓存 | 重复 `import` 同一 url 只 fetch 一次 |
| 循环 import | A import B import A → `warn` + 中断该条链（不抛错，已加载的照常注册） |
| fetch 失败 / HTTP 非 2xx | `warn` + 该组件视为未注册（不阻断其余组件）；loader 直接形式则渲染内置 error 组件 |
| url 响应式 | url 含表达式特征时经 `watch` 求值，url 变化重新加载 |
| 远程覆盖同名组件（loader） | `warn` + 以远程版覆盖注册（首帧严格等待 fetch，已实例化不受影响） |
| 加载结果无同名组件（loader） | 渲染内置 error 组件（不误报链上旧同名组件） |

::: tip 指令文档
`x-import` 与 `x-component` 的完整指令语义见 [x-import](../directives/x-import.md) 与 [x-component](../directives/x-component.md)（含 `loader` 的全部选项字段）。
:::

::: tip 远程组件测试文件
上面两个 demo 加载的真实组件文件在仓库 `docs/public/components/` 下：[`like-button.html`](https://github.com/autosparkjs/autospark/blob/main/docs/public/components/like-button.html)（作用域，含 data/methods/scoped style）、[`widgets.html`](https://github.com/autosparkjs/autospark/blob/main/docs/public/components/widgets.html)（全局，含 stat 与 chip 两个组件）。可下载到自己的静态服务器复用。
:::
