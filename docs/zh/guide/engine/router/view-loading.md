---
title: 视图加载
---

# 视图加载

## 关于

路由级 `view` 声明该路由的**视图源**：远程 HTML URL、现成 HTMLElement、动态函数三种形态。视图加载器按渲染器选择链处理内容（详见[渲染器](./renderers/index.md)），产物交出口渲染。

视图加载与数据加载并发进行；同一导航内的**已加载层自动跳过**（只有新增层才发起加载），嵌套导航不重复请求父层视图。

## 指南

### 三种视图源

```json
{
    "path": "/about",
    "view": "/views/about.html"      // ① URL：远程 HTML（默认按模板编译渲染）
}
```

```js
{
    path: "/inline",
    view: document.getElementById("tpl-inline")  // ② HTMLElement：现成元素
}
```

```js
{
    path: "/dynamic",
    view: (route) => {                            // ③ 函数：动态返回（支持异步）
        if (route.params.type === "a") return "/views/a.html";
        return "/views/b.html";
    }
}
```

### 视图配置对象

`view` 写成配置对象形态 `{ from, ...选项 }` 可附加加载选项：

```js
{
    path: "/report",
    view: {
        from: "/views/report.html",
        selector: "#content",   // 只提取匹配元素的内容作为视图
        timeout: 8000           // 加载超时（毫秒）
    }
}
```

| 选项 | 默认 | 说明 |
| --- | --- | --- |
| `from` | — | 视图源（URL / HTMLElement / 函数） |
| `selector` | — | 内容提取选择器：模板渲染器从解析后的文档中取该元素的 innerHTML；选择器支持插值，变量池仅 `params` / `query` / 导航 `state`（扁平键，如 `#{page}`） |
| `timeout` | `5000` | 加载超时（毫秒） |
| `renderer` | — | 路由级显式渲染器实例，绕过选择链探测（优先级仅次于 `!` 前缀） |

全局缺省配置经 `options.viewOptions` 声明（路由项显式值优先）。

### URL 插值与 base 前缀

视图 URL 支持插值——路由变量与 `engine.state.$` 的原始值成员参与地址构造：

| 变量 | 含义 |
| --- | --- |
| `{name}` | 路由 `name` |
| `{path}` / `{curPath}` | 路由模式路径（如 `/products/:category`，不含参数值） |
| `{url}` | 解析后的实际 URL（含参数值） |
| `{query}` | 序列化后的查询字符串 |
| `{timestamp}` | 时间戳 |
| `{路由参数名}` | 如 `{id}`，取自 `params` |
| `{meta 字段}` | 路由 `meta` 的字段展开 |
| `{导航 state 字段}` | `push(path, state)` 传入的字段 |
| `{state.$ 原始值成员}` | 如 `{language}`、`{viewport}`，见下 |

```js
{
    path: "/products/:category",
    view: "/views/products.html"       // 相对地址自动拼 base 前缀
}
```

::: tip `engine.state.$` 变量
`engine.state.$` 自有可枚举成员中值为 `string | number | boolean` 的会以**扁平键**并入变量池（`$.language` → `{language}`）：引擎预置的 `viewport` / `version` / `language` / `name` / `title` / `description` 自动可用；消费者经模块增强（`declare module "autospark"`）增补的原始值成员同样自动生效，无需额外注册。

- **路由侧同名优先**：路由 `meta`、路由参数、导航 `state` 中的同名键胜过 `state.$`；
- **`route` 键除外**：插值发生在加载期（导航提交之前），`$.route` 是**上一次导航**的快照——取本次匹配路径请用 `{path}` / `{url}`；
- **现读不订阅**：不因这些变量变化自动重载（`$.language` 变化会经语言切换重入导航，自然取到新值；`$.viewport` 跨档不触发重载）；
- 对象 / 函数 / `null` 成员静默跳过（替换为空串）。
:::

配合 `selector` 可以让多个路由共享一个页面文档，按参数提取不同区块（`selector` 走独立的小变量池，仅 `params` / `query` / 导航 `state`，不含 `state.$`）：

```js
{
    path: "/docs/:page",
    view: {
        from: "/views/docs.html",
        selector: "#{page}"            // 按路由参数选区块
    }
}
```

### 加载中指示

视图加载发起**前**，出口先落加载占位（ADR-0012）——网络等待期内出口呈现 **x-loading 门控遮罩覆盖层**（engine 指令能力，覆盖视图区域；`delay: 200` 防闪烁），完成后随就绪内容或错误自动移除。

路由项 `loading` 声明**两层配置的覆盖层**（内置默认 → 路由项覆盖）：

```js
{
    path: "/slow",
    view: "/views/slow.html",
    loading: "拼命加载中…"            // string 简写：覆盖文案，其余默认项保留
}
```

```js
{
    path: "/report",
    view: "/views/report.html",
    loading: {                        // 对象：逐字段覆盖内置默认
        message: "报表生成中…",
        delay: 0,                     // 关闭防闪烁延迟
        bgColor: "black",
        opacity: 0.4
    }
}
```

| 值 | 行为 |
| --- | --- |
| 缺省 / `true` | 显示覆盖层，走内置默认（`delay: 200`、白色 0.6 浅色遮罩） |
| `false` | 关闭本路由的加载指示，加载期间出口无任何提示 |
| `string` | 文案简写 ≡ `{ message: string }` |
| `{ message, delay, bgColor, color, opacity }` | 逐字段覆盖内置默认（不含 `value` / `selector` / `actions`——显隐归门控、动作属错误块） |

不加 router 全局 loading 配置项——应用级深度定制走 engine 自定义 loading 组件通道。

下面的 demo 中「慢速加载」路由的视图经 800ms 延迟加载，可观察到 加载遮罩 → 内容就绪 的完整过程（「函数」路由声明了自定义文案）：

<demo html="router/view-loading.html"/>

加载失败与 404 的呈现、失败层重试见[错误呈现与重试](./error-presentation.md)。

### 已加载层跳过

嵌套路由导航（如 `/a/b` → `/a/c`）时，父层 `/a` 的视图与数据**已成功加载过就不再重新请求**，只加载变化的子层（ADR-0004）：

- 视图通道按路由项记录最近一次加载结果（成功/失败）
- 成功层直接复用既有内容；失败层公共导航也会重试
- 导航取消（AbortError）不计为失败，不影响跳过判定

### 加载事件

```js
router.on("view:loading", ({ route }) => console.log("视图加载中", route.path));
router.on("view:loaded", ({ route }) => console.log("视图就绪", route.path));
router.on("view:error", ({ route }) => console.error("视图加载失败", route.path));
```

::: warning fetch 失败不降级
渲染降级链只处置"内容加工失败"（渲染器异常/解析失败）；**fetch 本身失败**（404、网络错误、超时）直接走加载错误通道，交由错误页面与错误边界处置，不会降级为 raw 输出。
:::

### 视图哈希与复用

每个路由项可声明 `hash` 模板生成视图哈希标识——同 hash 且已就绪的视图在出口中**仅激活不重渲染**（keepAlive 复用判定的依据），详见[缓存](./cache.md)。
