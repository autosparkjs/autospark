# 远程模板

## 概述

模板不必全部写死在页面里——可以把模板片段放在服务端，运行时**按需 fetch 取回并编译**。主通道是 [`x-html`](./directives/x-html.md) 的 `.compile` 修饰符：

| 通道 | 写法 | 产物 |
| --- | --- | --- |
| 远程 HTML 片段 | `x-html="url"` | fetch 取回 text，**默认消毒**后写 `innerHTML`——静态快照，内部指令不生效 |
| 远程模板 | `x-html.compile="url"` | 取回的 text 作为**子模板编译**——指令/插值生效、建 watcher、继承宿主作用域 |

「模板放服务端、数据在本地」的远程模板，与「数据模板双远程」都成立。远程模板适合：内容由后端/低代码平台托管、按语言或租户下发不同模板、页面骨架本地而区块模板远程等场景。

## 快速入门

本地 `x-data` 提供数据，`x-html.compile` 从远程取回 `book-tpl.html` 编译——模板里的 `x-text` 真实建立绑定，点「换一本书」改本地数据即见模板内绑定更新。

<demo html="template/remote-basic.html"/>

```html
<div class="card-content" x-data="{ title: '响应式状态管理', price: 59, stock: 12 }">
    <div x-html.compile="/api/book-tpl.html">
        <div x-fallback>⏳ 正在加载远程模板…</div>
    </div>
    <button @click="swap">换一本书</button>
</div>
```

## 指南

### x-html.compile 远程模板

指令值以 url 前缀（`/`、`//`、`http(s)://`、`./`、`../`）开头即进入**异步形态**：fetch `res.text()` 取回 HTML 字符串，`.compile` 将其作为子模板编译执行——与本地 `.compile` 语义完全一致：建 scope/watcher、**继承宿主作用域**（宿主挂 `x-data` 或处于 `x-for` 内时，远程模板可直接读其局部变量）、支持嵌套 `x-data`/`x-for`/`x-if`。

- **全量重编译**：每次取回新模板，销毁旧子树并重编译（无 diff）；远程模板里的 `<style>` 走组件同款 [scoped / global / bind](./component/styles.md) 样式管线，重取时样式随之换血。
- **保旧值**：重取期间旧子树保留不闪断，新模板到达后才替换。

### url 插值与自动重取

url 中可用 `{表达式}` **单花括号插值**（求值于宿主作用域、自动 `encodeURIComponent`），插值依赖变化**自动重新 fetch**——竞态按请求序号丢弃过期响应，元素销毁时在途请求被中止：

```html
<!-- lang 变化自动重取对应语言的模板 -->
<div x-html.compile="/api/card-{lang}.html">
    <div x-fallback>⏳ 加载中…</div>
</div>
```

裸词相对 url 不支持（与 action 名不可判定），相对路径写 `./api/x.html`。`method` 选项直传 fetch（默认 GET）、`header` 传额外请求头；`!res.ok` 按加载失败处理（保旧值 + fallback 认领）。

### 加载反馈

`x-html` 没有数据域，不注入 `$loading`/`$error` 元键——反馈只走视觉通道：

- **x-loading 覆盖层**：异步形态默认自动合成（请求中显示、完成撤除）；
- **x-fallback**：宿主内特例子节点（静态通道，不编译），非就绪且宿主尚无注入内容时显示——首载占位、重取保旧值、失败也认领；
- 二者**互斥为默认**（声明 `x-fallback` 则不合成覆盖层），`loading:{...}` 显式并存、`loading:false` 恒关。

### 数据 + 模板双远程

同元素 `x-data`（异步）+ `x-html.compile`（异步）时，二者经响应式天然协调——先到者先行渲染，后到者字段级更新（无需重编译）：

<demo html="template/remote-double.html"/>

```html
<div
    x-data="/api/books.json"
    x-data-options="{ path: 'data' }"
    x-html.compile="/api/book-list-tpl.html"
>
    <!-- 双异步时反馈归 x-data 独占：fallback 是编译版，可插值 $loading -->
    <div x-fallback>⏳ 数据加载中…（$loading = {{ $loading }}）</div>
</div>
```

::: warning 双异步的反馈归属
同元素双异步时反馈通道归 **x-data 独占**——`x-fallback` 是编译版（可插值 `$error.message`），`x-html` 不合成覆盖层（显式 `loading` 被忽略并 warn）。
:::

### 与远程组件的分工

| | 远程模板（`x-html.compile`） | 远程组件（`x-component` url / `x-import`） |
| --- | --- | --- |
| 产物 | 模板片段 | 完整组件（`x-define` 定义） |
| 数据 | **继承宿主作用域**，无独立数据域 | 自带 `x-data`、props 传参，封装独立 |
| 样式 | 随注入内容带 `<style>`（scoped/global/bind） | 组件样式管线（同语义，注册期建立） |
| 适用 | 后端托管的区块模板、动态下发片段 | 可复用、可独立分发的封装单元 |

远程组件见[远程组件](./component/remote.md)与 [x-import](./directives/x-import.md)；路由场景按页面加载远程视图见[视图加载](./router/view-loading.md)。

### 安全

::: danger `.compile` 隐式跳过消毒
`.compile` 把取回内容当模板编译，其中的 `x-on:click` 会**真实绑定执行**——危险程度高于 `.raw`（`.raw` 的 `<script>` 经浏览器约束不执行）。远程模板的来源必须**完全可信**（自家服务端、同源静态资源），否则等同于注入任意可执行模板。不带 `.compile` 的默认通道维持默认消毒，远程内容更该守。
:::

完整语义与配置项见 [x-html](./directives/x-html.md)。

---

下一步：[动态模板](./patch.md)了解如何在运行时修改模板结构本身。
