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
| `selector` | — | 内容提取选择器：模板渲染器从解析后的文档中取该元素的 innerHTML；选择器支持参数插值（`$params`/`$query`/`$state`） |
| `timeout` | `5000` | 加载超时（毫秒） |
| `renderer` | — | 路由级显式渲染器实例，绕过选择链探测（优先级仅次于 `!` 前缀） |

全局缺省配置经 `options.viewOptions` 声明（路由项显式值优先）。

### URL 插值与 base 前缀

视图 URL 支持插值——路由参数与查询参数参与地址构造：

```js
{
    path: "/products/:category",
    view: "/views/products.html"       // 相对地址自动拼 base 前缀
}
```

配合 `selector` 可以让多个路由共享一个页面文档，按参数提取不同区块：

```js
{
    path: "/docs/:page",
    view: {
        from: "/views/docs.html",
        selector: "#{$query.page}"     // 按查询参数选区块
    }
}
```

### 加载提示

路由项 `loading` 控制加载提示（默认 `true` 显示全局 `autospark-loading` 组件，直到内容就绪）：

```js
{
    path: "/slow",
    view: "/views/slow.html",
    loading: '<div class="my-spinner">拼命加载中…</div>'  // 自定义 HTML 提示
}
```

| 值 | 行为 |
| --- | --- |
| `true` | 显示全局 loading 组件（默认） |
| `false` | 不显示任何加载提示 |
| `string` | 显示自定义 HTML 作为加载提示 |
| `HTMLElement` | 显示指定元素作为加载提示 |

下面的 demo 中「远程视图」路由的视图经慢速接口加载，可观察到加载提示 → 内容就绪的完整过程：

<demo html="router/view-loading.html"/>

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
