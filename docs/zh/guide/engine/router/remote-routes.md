---
title: 远程路由
---

# 远程路由

## 关于

路由表与子路由声明都可以是**远程地址**——初始化时只取回顶层骨架，声明为远程的 `children` 在**后台渐进展开**（逐层并发 fetch），不阻塞首屏。这让路由表可以按模块拆分、按需加载，服务端只是一堆静态 JSON 文件。

`children` 支持三种形态（ADR-0007）：

1. `AutoSparkRouteItem[]` —— 静态子路由项数组
2. `string` —— **远程子表**：该地址取回子路由声明并展开为本节点的子路由
3. `true` —— **约定子表**：地址取 `options.routesFile`（默认 `routes.json`）

## 指南

### 远程子表

子路由表按模块拆分为独立 JSON 文件，父节点声明地址：

```json
// routes.json（顶层表）
{
    "path": "/",
    "children": [
        { "path": "admin", "children": "admin-routes.json" },
        { "path": "shop", "children": "shop-routes.json" },
        { "path": "/about", "view": "/views/about.html" }
    ]
}
```

```json
// admin-routes.json
{
    "path": "/",
    "children": [
        { "path": "users", "title": "用户管理", "view": "/views/admin/users.html" },
        { "path": "logs", "title": "操作日志", "view": "/views/admin/logs.html" }
    ]
}
```

导航到 `/admin/users` 时，即便 `admin-routes.json` 尚未展开完成，导航也会被挂起等待展开——用户不会看到"路由不存在"。

### 约定子表

`children: true` 是远程子表的约定式简写：地址取 `options.routesFile`（默认 `routes.json`）。目录即模块，约定优于配置：

```json
// routes.json
{
    "path": "/",
    "children": [
        { "path": "admin", "children": true }  // → 取 /admin/routes.json
    ]
}
```

约定地址按**累积路径**解析：节点路径为 `/admin`，则子表地址为 `/admin/routes.json`（可经 `resolveChildrenUrl` 语义理解：子表地址与父路径绑定）。

服务端组织建议——每个模块目录下一个 `routes.json`：

```txt
webroot/
├── routes.json
├── admin/
│   ├── routes.json
│   └── views/
└── shop/
    ├── routes.json
    └── views/
```

### 展开时序

远程子表展开是**后台渐进**的（ADR-0007）：

1. 路由表加载只等**骨架就绪**（`routes:loaded` 事件），远程子表不在此等待范围
2. 展开按 BFS **逐层并发**进行：同层全部远程子表并行 fetch、全部 settle 后进入下一层
3. 展开完成（无论成败）触发 `routes:expanded` 事件
4. 导航匹配到待展开节点（`_childrenState === "pending"`）时挂起等待展开完成

```js
router.on("routes:loaded", () => console.log("骨架就绪，首屏可渲染"));
router.on("routes:expanded", () => console.log("全部远程子表展开完成"));
router.on("routes:error", ({ url, path, error }) => {
    console.warn(`子表 ${url}（${path}）展开失败，该节点降级为无子路由`);
});
```

::: tip 精确等待
需要在展开完成后再做事（如渲染整棵菜单树），用 `router.routes.whenExpanded(timeout?)`——成功与失败降级均算完成，传入 timeout 避免一个挂死的请求把后续逻辑拖死。
:::

### 响应缓存与同址复用

远程子表按 URL 缓存响应：**同一地址被多个分支引用时只发一次请求**。每次挂载各自跑一次规范化，得到彼此独立的路由项对象（不共享 `_getView`、加载状态等运行时状态）。

### 失败降级

单个远程子表展开失败**只影响该节点**：节点降级为无子路由（`children: []`），其祖先与兄弟照常可用，并发 `routes:error` 事件。整个路由表不会因一个子表失败而不可用。

展开深度由 `maxChildrenDepth` 限制（默认 10 层）——用于兜底循环引用（子表子项又指回祖先，其地址因拼祖先路径而无限增长）。触顶时残余节点降级为 error 状态，保证展开过程必定收敛。

::: warning 请求不接导航取消
远程子表 fetch 带**超时**信号但不接导航取消信号——子表是表结构的一部分，用户点快了就掐断会让路由表永久缺一块。超时时间取路由项 `timeout`，未声明时取 `routeOptions.timeout`，均为 0 则不限。
:::

### 远程子表的远程子表

远程子表返回的子项自身也可以声明远程子表（`children: string | true`），展开器会继续向下处理，直到没有待展开节点或触达深度上限：

```json
// admin-routes.json 的子项再声明远程子表
{
    "path": "/",
    "children": [
        { "path": "settings", "children": true }  // → 继续展开 /admin/settings/routes.json
    ]
}
```

同一地址的远程子表不会重复请求（响应缓存复用）。
