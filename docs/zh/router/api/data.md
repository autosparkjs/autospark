---
title: 数据源
---

# 数据源 API

## 关于

路由项的 `data` 字段声明导航到该路由时预加载的数据，加载结果注入渲染上下文（`route.data` 字段展开为局部变量）。加载行为说明见[指南 · 数据加载](../guide/data-loading.md)。

## 类型

```ts
type AutoSparkRouteDataSource =
    | string                                    // 远程 URL（加载 JSON）
    | Record<string, any>                       // 字面量键值对
    | ((route: AutoSparkMatchedRouteItem) =>
        Record<string, any> | Promise<Record<string, any>>); // 同步/异步函数

interface AutoSparkRouteDataOptions extends BaseLoaderOptions<AutoSparkRouteDataSource> {
    /** 加载失败时的默认值（成功后 Object.assign(default, data) 合并，避免字段缺失） */
    default?: Record<string, any>;
    /** 失败后的最大重试次数，默认 0（不重试）；retry=2 表示最多重试 2 次（共 3 次尝试） */
    retry?: number;
    /** 每次重试前的等待毫秒数，默认 0（立即重试） */
    retryDelay?: number;
    /** 同 hash 加载实例的复用策略，默认 "restart" */
    multiplex?: "off" | "restart" | "share";
}
```

## 声明形态

```js
const routes = [
  // 形态一：true —— 使用默认数据源
  { path: "/a", view: "/views/a.html", data: true },

  // 形态二：字符串 —— 远程 URL
  { path: "/b", view: "/views/b.html", data: "/api/user?id=1" },

  // 形态三：对象 —— 字面量
  { path: "/c", view: "/views/c.html", data: { title: "静态数据" } },

  // 形态四：函数 —— 支持异步
  { path: "/d", view: "/views/d.html", data: (route) => fetchUser(route.params.id) },

  // 形态五：配置对象 —— 完整选项
  {
    path: "/e",
    view: "/views/e.html",
    data: {
      from: "/api/list",
      default: { list: [] },   // 失败兜底
      retry: 2,                // 最多重试 2 次
      retryDelay: 500,
      multiplex: "share",
    },
  },
];
```

## multiplex 复用策略

基于 hash 的加载实例复用：

| 值 | 行为 |
| --- | --- |
| `"off"` | 不启用，各实例相互独立 |
| `"restart"` | 命中同 hash 且进行中的加载时，中止该加载并以首个实例重新加载（**默认**） |
| `"share"` | 命中同 hash 实例时完全共享，不中止 |

## 重试规则

- 超时与业务错误会重试
- **主动 abort 不会重试**（`abort()` 或外部 `abortSignal` 触发的取消）
- 失败时若有 `default`，以 `Object.assign(default, data)` 合并兜底
