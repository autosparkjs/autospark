---
title: 自动发现路由
---

# 自动发现路由

## 关于

`autoDiscoverRoutes: true` 开启**路由表自动发现**（ADR-0010）：路由表遍历时，对每个**未声明 `children` 且非重定向**的节点，按约定自动探测 `{累积路径}/{routesFile}`（默认 `routes.json`）是否存在远程子表——有则展开，没有则静默落定为无子路由。

它把"路由表"从一份中心化清单变成**目录即模块**的约定式结构：服务端只需按目录放置 `routes.json`，客户端自动把整棵目录树装配成路由表。

## 指南

### 开启自动发现

构造时声明 `autoDiscoverRoutes: true`——无需写任何路由表，router 自动探测根节点 `{base}/routes.json` 作为**整棵路由表**：

```html
<script src="./lib/autospark.js"></script>
<script src="./lib/autospark.router.js"></script>
<script>
    const engine = new AutoSpark(host, {}, {
        autoDiscoverRoutes: true  // → 探测 routes.json 作为整表
    });
</script>
```

服务端按目录组织：

```txt
webroot/
├── routes.json            ← 根表（自动发现入口）
├── views/
│   ├── home.html
│   └── about.html
├── admin/
│   ├── routes.json        ← /admin 的子表（探测到即展开）
│   └── views/
└── shop/
    └── views/             ← 无 routes.json：静默落定为无子路由
```

```json
// routes.json
{
    "path": "/",
    "children": [
        { "path": "home", "title": "首页", "view": "/views/home.html" },
        { "path": "about", "title": "关于", "view": "/views/about.html" },
        { "path": "admin" }          ← 未声明 children：自动探测 /admin/routes.json
    ]
}
```

::: tip 挂载矩阵回顾
`autoDiscoverRoutes` 仅在**未声明 `routes`** 时触发；`routes: false` 显式禁用压过一切；`routes` 有值时发现不触发（完整配置对象形态下 engine 级该键也不透传）。
:::

### 探测规则

| 节点状态 | 是否探测 |
| --- | --- |
| `children` 未声明（缺席 = 未知）且非重定向节点 | **探测** `{累积路径}/{routesFile}` |
| `children: []` 显式空数组 | 不探测——作者明确声明无子路由（单节点 opt-out） |
| `children: true \| string` | 不探测——已按显式远程子表处理 |
| 声明了 `redirect` 的节点 | 不探测 |

### 投机性请求的阴性分级

自动探测是**投机性请求**：「没拿到可用的子路由声明」即为阴性结果，不区分原因：

- **404** → 阴性，静默落定为无子路由（仅 logger.debug）
- **200 但响应体非 JSON**（SPA 托管的 index.html fallback）→ 同样按阴性静默处理
- **网络错误 / 5xx / 超时** → 真失败：节点降级为无子路由并发 `routes:error`

这与显式声明（`children: true | string`）的**断言性请求**相对：显式声明遇到同型失败一律报错，不会静默。

::: warning SPA 托管 fallback 的前提
静态服务器开启"404 回退到 index.html"时，探测 `.json` 若被回退成 HTML，router 按"200 非 JSON"阴性处理——不会把 HTML 误装为路由表。但请确保真实存在的子表返回 `Content-Type: application/json` 的 JSON 体。
:::

### 缓存策略

探测结果按 URL 缓存（同一地址只探测一次）：

- **缓存**：成功结果与阴性结果（404 / 非 JSON）——确定性结果，避免重复探测
- **不缓存**：其他失败（网络错误/5xx）——瞬时故障不钉死，后续可重试

### 与显式远程子表的关系

自动发现与显式声明可混用——显式声明的节点按断言语义处理，未声明的节点按探测语义处理：

```json
{
    "path": "/",
    "children": [
        { "path": "admin" },                          // 探测 /admin/routes.json
        { "path": "shop", "children": true },         // 断言 /shop/routes.json
        { "path": "legacy", "children": "legacy.json" }, // 断言指定地址
        { "path": "help", "children": [] }            // 声明无子路由，不探测
    ]
}
```

### 事件与等待

- 骨架就绪：`routes:loaded`（首屏渲染不等待发现完成）
- 全部展开完成：`routes:expanded`（成功与失败降级均算）
- 单个节点失败：`routes:error`
- 精确等待：`router.routes.whenExpanded(timeout?)`

详见[远程路由](./remote-routes.md)——自动发现的展开机制与显式远程子表完全共用。
