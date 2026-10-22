---
title: 数据加载
---

# 数据加载

## 关于

路由级 `data` 声明**导航到该路由时预加载的数据**：支持静态对象、远程 URL、函数三种来源。数据在视图渲染前加载完成，注入模板上下文——远程 HTML 里可以直接使用这些变量，无需手写 fetch 逻辑。

数据加载与视图加载**并发**进行（同层各路由项的数据、视图同时加载），导航在全部就绪后提交渲染。

## 指南

### 三种数据来源

```json
{
    "path": "/user/:id",
    "view": "/views/user.html",
    "data": "/api/user/{id}"         // ① URL：远程 JSON
}
```

```js
{
    path: "/settings",
    view: "/views/settings.html",
    data: { theme: "dark", locale: "zh-CN" }  // ② 静态对象：直接注入
}
```

```js
{
    path: "/dashboard",
    view: "/views/dashboard.html",
    data: async (route) => {                    // ③ 函数：动态返回（支持异步）
        const stats = await fetch(`/api/stats${route.url}`).then(r => r.json());
        return { stats };
    }
}
```

三种来源均可写成配置对象形态 `{ from: ..., ...选项 }` 以附加加载选项：

```js
{
    path: "/user/:id",
    view: "/views/user.html",
    data: {
        from: "/api/user/{id}",
        default: { name: "未知用户" }, // 加载失败时的默认值（Object.assign(default, data) 合并）
        retry: 2,                      // 失败后最多重试 2 次（共 3 次尝试）
        retryDelay: 500,               // 每次重试前等待 500ms
        timeout: 5000,                 // 加载超时（毫秒）
        cache: 60_000,                 // 缓存 60 秒
        multiplex: "share"             // 并发复用策略
    }
}
```

### data: true 简写

`data: true` 自动加载与视图**同名地址**的 JSON 文件——`/views/user.html` → `/views/user.json`。视图与数据一对一约定，目录结构即接口：

```json
{
    "path": "/user/:id",
    "view": "/views/user.html",
    "data": true
}
```

```txt
views/
├── user.html
└── user.json      ← 自动加载
```

::: tip URL 插值
URL 来源（含 `data: true` 生成的地址）支持插值：`{id}` 形式取路由参数，`{query}` 取序列化查询串——`/api/user/{id}` 导航到 `/user/123` 时实际请求 `/api/user/123`。变量池与视图地址一致（路由变量 + `engine.state.$` 原始值成员，路由侧同名优先，`route` 键除外），详见[视图加载 · URL 插值](./view-loading.md#url-插值与-base-前缀)。相对地址自动拼上 `base` 前缀。
:::

### 数据注入模板上下文

加载完成的数据在渲染时注入模板上下文：

- `route.data` 的**字段展开为局部变量**，可直接引用
- `$route` 当前路由元信息、`$params` 路由参数、`$query` 查询参数同时可用

```html
<!-- views/user.html：data 加载了 { name, age } -->
<h1 x-text="name"></h1>
<p x-text="'年龄：' + age"></p>
<p x-text="'参数 id：' + $params.id"></p>
```

全局响应式的 `$.route`（`{ path, fullPath, params, query }`）在导航 commit 后写入，任何模板中都可用。

<demo html="router/data-loading.html"/>

### 数据校验

数据必须是**纯对象**（plain object）——数组、标量视为无效，抛出 `AutoSparkRouterLoadError`。远程 JSON 接口请返回对象形态。

### 缓存与并发复用

数据缓存键默认取路由实际 URL（`{path}` 为模式路径，参数不同的路由会坍缩为同一键，需要按参数区分缓存时显式声明 `hash`）：

```js
data: {
    from: "/api/user/{id}",
    cache: 60_000,
    hash: "user-{id}"            // 每个用户 id 独立缓存
}
```

并发复用策略 `multiplex` 控制同 hash 加载的并发行为：

| 值 | 行为 |
| --- | --- |
| `"off"` | 不启用，各实例相互独立 |
| `"restart"` | 命中进行中的同 hash 加载时，中止它并以首个实例重新加载（默认） |
| `"share"` | 命中进行中的同 hash 加载时完全共享，不中止 |

### 全局数据配置

`dataOptions` 为所有路由提供数据加载缺省配置（路由项 `data` 对象形态的字段优先）。它是 router 级选项，须写在 `routes` **完整配置对象形态**内（engine 第三参顶层仅承载数组表/配置对象，平铺的 `dataOptions` 会被忽略）：

```js
const engine = new AutoSpark(host, {}, {
    routes: {
        routes: [/* ... */],
        dataOptions: {
            timeout: 5000,
            retry: 1,
            cache: 30_000
        }
    }
});
```

### 加载事件与失败处理

```js
router.on("data:loading", ({ route }) => console.log("数据加载中", route.path));
router.on("data:loaded", ({ route }) => console.log("数据就绪", route.path));
router.on("data:error", ({ route, error }) => console.error("数据加载失败", route.path, error));
```

数据加载失败不阻塞视图渲染的降级处置：配合错误边界（`errorBoundary`）、回退路由（`fallback`）与 `routeError` 钩子处理，详见[路由守卫](./guards.md)。

::: tip 主动操作
经 `router.dataLoader` 可对指定路由的数据做精细操作：`invalidateRoute(matched)` 失效缓存、`refreshRoute(matched)` 强制重载、`abortRoute(matched)` 中止加载、`isLoading(matched)` 查询状态。
:::
