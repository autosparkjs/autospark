---
title: 路由项
---

# 路由项 AutoSparkRouteItem

## 关于

路由项是路由表的组成单元，声明路径、视图、数据、缓存、重定向等行为。本页给出全字段类型与语义表。

```ts
interface AutoSparkRouteItem {
    name?: string;
    path: string;
    title?: string;
    icon?: string;
    query?: Record<string, any>;
    params?: Record<string, any>;
    view?: AutoSparkRouteViewSource | AutoSparkRouteViewOptions;
    data?: AutoSparkRouteDataSource | AutoSparkRouteDataOptions | true;
    keepAlive?: boolean;
    cache?: number;
    timeout?: number;
    loading?: boolean | string | HTMLElement;
    hash?: string;
    preload?: boolean;
    redirect?: RedirectTarget | RedirectFunction;
    alias?: string | string[];
    children?: AutoSparkRouteChildren;
    meta?: Record<string, any>;
    beforeRoute?: BeforeRouteHook | BeforeRouteHook[];
    afterRoute?: AfterRouteHook | AfterRouteHook[];
    beforeRender?: BeforeRenderHook | BeforeRenderHook[];
    afterRender?: AfterRenderHook | AfterRenderHook[];
    routeError?: RouteErrorHook | RouteErrorHook[];
    errorBoundary?: ErrorBoundaryOptions;
    fallback?: string;
    retry?: RetryOptions;
    modal?: boolean | ModalConfig;
    default?: boolean;
}
```

以下划线开头的字段（`_getView`、`_getData`、`_viewLoadState`、`_dataLoadState`、`_childrenState`、`_childrenSource`、`_autoProbe` 等）为内部状态，不属于公共 API，请勿在路由表中声明。

## path 路径语法

| 语法 | 示例 | 说明 |
| --- | --- | --- |
| 静态路径 | `/user`、`/about` | 精确匹配 |
| 动态参数 | `/user/:id`、`/user/<id>` | 提取为 `params.id` |
| 正则约束 | `/user/:id(\d+)` | 参数附加正则约束 |
| 通配符 | `*` | 匹配任意路径（404 页等场景） |

## 核心字段

### view 视图源

```ts
type AutoSparkRouteViewSource =
    | string                        // 视图 URL（远程加载 HTML）
    | HTMLElement                   // 直接使用指定元素
    | ((route: AutoSparkMatchedRouteItem) =>
        | string | HTMLElement
        | Promise<string | HTMLElement>);

interface AutoSparkRouteViewOptions<T = string> extends BaseLoaderOptions<T> {
    /** 路由级显式渲染器（优先级高于 options.renderers 逐个 test） */
    renderer?: AutoSparkRouterViewRendererBase;
}
```

`view` 可以是视图源本身，也可以是 `{ from: 视图源, ...加载选项 }` 配置对象。加载选项含 `timeout`（默认 5000ms）、`selector`（内容提取选择器）、`allowUnsafeHTML` 等，详见[视图加载](../guide/view-loading.md)。

### data 数据预加载

`true`（默认源）、数据源字符串/对象/函数或 `AutoSparkRouteDataOptions` 配置对象，详见 [数据源 API](./data.md)。

### keepAlive / cache / timeout / loading

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `keepAlive` | 不缓存 | 缓存优先级：出口 `mode=tabs`（全视图常驻）> 本字段显式声明 > 出口 `keepAlive` prop（默认 false）。缓存视图离开时不销毁（`x-show` 隐藏），再进入原样复用 |
| `cache` | 0 | 缓存时间（毫秒），0 表示不缓存 |
| `timeout` | — | 加载超时时间（毫秒） |
| `loading` | `true` | 全局 Loading 组件开关；`string`/`HTMLElement` 为自定义加载提示内容 |

### hash 视图哈希

视图缓存与 keepAlive 复用判定的标识（同 hash 同 ready 的视图仅激活不重渲染），支持插值变量：

| 变量 | 含义 |
| --- | --- |
| `{path}` | 路由模式路径（如 `/products/:category`，不含实际参数值） |
| `{url}` | 解析后的实际 URL（默认值即 `{url}`） |
| `{basepath}` | 基础路径 |
| `{timestamp}` | 时间戳 |

```js
{ path: "/user/:id", hash: "user-{params.id}" }     // → "user-123"
{ path: "/posts", hash: "posts-{query.category}" }  // → "posts-tech"
```

### preload 预加载

声明 `true` 时计划在初始化阶段自动加载视图。::: warning 规划中：预加载特性当前为空壳实现，行为尚未落地，声明不产生实际效果。:::

### meta / name / title / icon

| 字段 | 说明 |
| --- | --- |
| `name` | 路由名称 |
| `title` | 路由标题；head 管理开启时写入 `<title>`（经 `titleTemplate` 加工） |
| `icon` | 路由图标，通常用于导航菜单渲染 |
| `meta` | 任意键值对。head 管理约定固定键：`title` / `description` / `canonical` / `robots` / `og` / `jsonLd` / `seo`（`seo: false` 关闭该路由 head 管理）；视图侧可用 `<autospark-view-meta>` 同名属性覆盖 |

## 重定向

```ts
type RedirectTarget = string | NamedRedirectTarget | RedirectResult;

interface NamedRedirectTarget {
    name: string;                       // 目标路由名称
    params?: Record<string, string>;
    query?: Record<string, string>;
    mode?: "replace" | "push";          // 默认 "replace"
    target?: "_self" | "_blank";
}

interface RedirectResult {
    path: string;
    mode?: "replace" | "push";
    state?: Record<string, any>;
    target?: "_self" | "_blank";
}

type RedirectFunction = (route: AutoSparkMatchedRouteItem) => RedirectTarget | null;
```

- `string`：重定向到指定路径（默认 replace 模式）
- `NamedRedirectTarget`：命名路由重定向 `{ name: "home" }`
- `RedirectResult`：`{ path: "/target", mode: "push" }`
- 函数：动态计算目标，返回 `null` 表示不重定向
- 重定向发生在路由匹配层（最多 10 次，含循环检测）；`target: "_blank"` 在新窗口打开外部链接

详见[重定向](../guide/redirect.md)。

## 嵌套与别名

```ts
type AutoSparkRouteChildren = AutoSparkRouteItem[] | string | true;

type AutoSparkRoutes =
    | AutoSparkRouteItem[]      // 多根路由表
    | AutoSparkRouteItem        // 单根路由
    | string                    // 远程路由表地址
    | (() => AutoSparkRouteItem[] | AutoSparkRouteItem
        | Promise<AutoSparkRouteItem> | Promise<AutoSparkRouteItem[]>);
```

| 字段 | 形态 | 说明 |
| --- | --- | --- |
| `children` | `AutoSparkRouteItem[]` | 静态子路由项数组 |
| `children` | `string` | **远程子表**：地址，初始化期取回并展开为本节点的子路由 |
| `children` | `true` | **约定子表**：地址取 `options.routesFile`（默认 `routes.json`） |
| `alias` | `string \| string[]` | 路由别名：URL 不变，使用目标路由配置 |

### default 默认路由

当父路由路径完全匹配但没有其他子路由匹配时，自动选择默认路由。判定标准（按优先级）：

1. `path` 为 `""`、`"/"` 或 `"./"`（高优先级）
2. 显式设置 `default: true`（低优先级）
3. 多个默认路由时取配置顺序第一个

## 错误处理

```ts
interface ErrorBoundaryOptions {
    /** 错误组件：字符串路径或动态导入函数 */
    component?: string | (() => Promise<any>);
    /** 回退 UI：错误时显示的 HTML 字符串 */
    fallback?: string;
    /** 错误回调 */
    onError?: (error: Error, errorInfo: any) => void;
    /** 是否重试：true 用默认策略，对象为自定义策略 */
    retry?: boolean | RetryOptions;
}

interface RetryOptions {
    /** 最大重试次数（默认 3） */
    max?: number;
    /** 重试延迟毫秒（默认 1000） */
    delay?: number;
    /** 退避策略：linear 线性 / exponential 指数（默认 linear） */
    backoff?: "linear" | "exponential";
    /** 每次重试回调 */
    onRetry?: (attempt: number, error: Error) => void;
}
```

| 字段 | 说明 |
| --- | --- |
| `fallback` | 导航到此路由出错的回退路由路径 |
| `errorBoundary` | 错误边界配置（如上） |
| `retry` | 重试策略配置（如上） |
| `routeError` | 路由级错误钩子，见[钩子](./hooks.md) |

## modal 模态路由

- `true`：以默认配置打开为模态路由
- `ModalConfig`：自定义模态配置，字段见 [实例 API · 模态](./instance.md#模态方法)

`router.push("!/login")` 的 `!` 前缀可直接以模态打开一个路由而不进入 history。
