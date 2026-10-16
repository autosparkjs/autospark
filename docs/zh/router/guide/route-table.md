---
title: 路由表
---

# 路由表

## 关于

路由表是一份**声明式配置**，描述"路径 → 视图 + 数据 + 行为"的映射。router 启动时将其规范化为一棵以 `/` 为根的路由树，导航时沿树匹配，返回匹配分支上的**所有嵌套路由项**（父 → 子依次渲染到各层出口）。

路由表支持四种声明形态：静态数组、单个对象、远程 URL 字符串、动态函数。

## 指南

### 路由表的四种形态

`routes` 可接受以下任一形态：

```js
// 1. 静态数组
routes: [
    { path: "/", view: "/views/home.html", default: true },
    { path: "/about", view: "/views/about.html" }
]

// 2. 单个对象（作为根路由）
routes: {
    path: "/",
    view: "/views/layout.html",
    children: [
        { path: "home", view: "/views/home.html", default: true }
    ]
}

// 3. 远程 URL：fetch 该地址并解析 JSON 为路由声明
routes: "routes.json"

// 4. 函数：动态返回路由配置（支持同步/异步）
routes: () => fetch("/api/routes").then((res) => res.json())
```

### 路径语法

路由 `path` 支持以下语法，**匹配不区分大小写**，末尾斜杠自动规范化：

| 语法 | 示例 | 说明 |
| --- | --- | --- |
| 静态段 | `/user/list` | 精确匹配 |
| 冒号参数 | `/user/:id` | 捕获单段，参数名 `id` |
| 尖括号参数 | `/user/<id>` | 等价冒号参数 |
| 正则约束 | `/user/:id(\d+)` | 参数需满足正则 |
| 单段通配符 | `*` | 匹配单个路径段 |
| 多段通配符 | `**` | 匹配零个或多个段，**仅允许在路径末尾** |

```js
routes: [
    { path: "/user/:id", view: "/views/user.html" },       // /user/123 → params.id = "123"
    { path: "/user/:id(\\d+)", view: "/views/user.html" }, // 仅匹配数字
    { path: "/docs/**", view: "/views/docs.html" }         // /docs、/docs/a/b 均匹配
]
```

匹配优先级：**具体路径 > 参数化路径 > 通配符**。通配符路由总是最后尝试。

### 路由项字段

`AutoSparkRouteItem` 的完整字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `path` | `string` | 路由路径（必填），支持上述语法 |
| `name` | `string` | 命名路由，**全局唯一**（重复命名只记住一个），供命名重定向使用 |
| `title` | `string` | 路由标题：页签显示、`document.title` |
| `icon` | `string` | 路由图标，通常用于导航菜单 |
| `view` | `ViewSource \| ViewOptions` | 视图源：URL / HTMLElement / 函数，详见[视图加载](./view-loading.md) |
| `data` | `DataSource \| DataOptions \| true` | 路由数据，详见[数据加载](./data-loading.md) |
| `query` | `Record<string, any>` | 加载视图 URL 时附带的查询参数 |
| `params` | `Record<string, any>` | 参数默认值（路径参数未捕获时使用） |
| `keepAlive` | `boolean` | 是否缓存视图（默认 false），详见[缓存](./cache.md) |
| `cache` | `number` | 缓存时间（毫秒），0 不缓存 |
| `timeout` | `number` | 加载超时时间（毫秒），0 不限 |
| `loading` | `boolean \| string \| HTMLElement` | 加载提示（默认 true 显示全局 loading 组件） |
| `hash` | `string` | 视图哈希模板，详见[缓存](./cache.md) |
| `redirect` | `RedirectTarget \| Function` | 重定向，详见[重定向](./redirect.md) |
| `alias` | `string \| string[]` | 路由别名（URL 不变，使用目标路由配置） |
| `children` | `RouteItem[] \| string \| true` | 子路由：静态数组 / 远程子表地址 / 约定子表简写 |
| `meta` | `Record<string, any>` | 自定义元信息（`title`/`description` 等固定键参与 SEO） |
| `default` | `boolean` | 是否为默认子路由 |
| `modal` | `boolean \| ModalConfig` | 模态路由配置 |
| `beforeRoute` / `afterRoute` / `beforeRender` / `afterRender` / `routeError` | `Hook \| Hook[]` | 路由级钩子，详见[路由守卫](./guards.md) |
| `errorBoundary` | `ErrorBoundaryOptions` | 错误边界配置 |
| `fallback` | `string` | 导航出错时的回退路由 |
| `retry` | `RetryOptions` | 重试策略（`max`/`delay`/`backoff`/`onRetry`） |

### 扁平写法与自动规范化

路由表会经过规范化（`normalizeRoutes`）：扁平路径自动转为嵌套结构，多个根路由合并到唯一根 `/` 下。以下两种写法等价：

```js
// 扁平写法
routes: [
    { path: "a/b", view: "/views/b.html" },
    { path: "a/c", view: "/views/c.html" }
]

// 等价于嵌套写法
routes: [
    { path: "/", children: [
        { path: "a", children: [
            { path: "b", view: "/views/b.html" },
            { path: "c", view: "/views/c.html" }
        ]}
    ]}
]
```

::: tip 根路由合并
声明 `path: "/"`（或 `""`、`"./"`）的根路由，其 `children` 会被提升合并进统一根节点；根路由上的其余属性（如 `view`、`title`）保留。
:::

### 匹配结果

导航匹配返回 `AutoSparkMatchedRouteItem[]`——匹配分支上从根到叶的**所有嵌套路由项**：

```js
// 路由表：/（根）→ user/:id
// 导航到 /user/123
router.routes.current; // AutoSparkMatchedRouteItem 数组，取末项为最深匹配层
```

每个匹配项包含：

| 字段 | 说明 |
| --- | --- |
| `route` | 命中的路由项声明（404 未匹配项为 `undefined`） |
| `params` | 路由参数（合并路由声明默认值与路径捕获值） |
| `query` | 查询参数 |
| `path` | 模式路径（保留 `:id` 占位符，如 `/user/:id`） |
| `url` | 实际完整路径（参数已替换，含 search，如 `/user/123?tab=1`） |
| `hash` | 计算后的视图哈希标识 |
| `redirectFrom` | 重定向历史链（未重定向时为 `undefined`） |
| `error` | 匹配/重定向过程中的错误（渲染层据此渲染错误页） |

### 命名路由

`name` 全局唯一，路由表展开时登记到 `namedRouteItems`，供命名重定向 `{ name: "home" }` 使用：

```js
routes: [
    { name: "home", path: "/", view: "/views/home.html", default: true },
    { path: "/old-home", redirect: { name: "home" } } // 重定向到命名路由
]
```

### 全局缺省配置

`routeOptions` 为所有路由提供**缺省值**——路由项显式声明优先，仅对未声明的字段生效。可配置的字段：`cache` / `keepAlive` / `preload` / `timeout`：

```js
const engine = new AutoSpark(host, {}, {
    routes: [/* ... */],
    routeOptions: {
        timeout: 8000,     // 所有路由默认 8s 超时
        keepAlive: false   // 所有路由默认不缓存
    }
});
```

::: warning 方向别记反
`routeOptions` 是**缺省值**而非覆盖值：路由项写了自己的 `timeout` 就以路由项为准。
:::
