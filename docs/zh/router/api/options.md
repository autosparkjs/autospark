---
title: 路由器配置
---

# 路由器配置 AutoSparkRouterOptions

## 关于

`AutoSparkRouterOptions` 是路由器的全局配置类型，作为 `new AutoSpark(host, vars, options)` 的第三个参数（完整对象形态）传入。`routes` 为唯一必填字段。

```ts
type AutoSparkRouterOptions = {
    /** 路由模式：'history'（默认）或 'hash' */
    mode?: "hash" | "history";
    /** 注入的 AutoSpark engine 实例（混合所有权，缺省时 router 自建并在 detach 时销毁） */
    engine?: AutoSpark;
    /** 基础路径（缺省链：显式配置 > 文档 <base href> > URL 目录推断） */
    base?: string;
    /** 路由配置（必填；数组 | 单项 | 远程地址字符串 | 返回路由表的函数） */
    routes: AutoSparkRoutes;
    /** 约定子表与自动发现的默认文件名（默认 "routes.json"） */
    routesFile?: string;
    /** 远程子表最大展开深度（默认 10，触顶降级为无子路由） */
    maxChildrenDepth?: number;
    /** 路由表自动发现（默认 false） */
    autoDiscoverRoutes?: boolean;
    /** 错误页面配置（按状态码，'*' 兜底） */
    errorPages?: Partial<Record<string, ErrorPageSource>>;
    /** 起始路径（默认 "/"） */
    home?: string;
    /** 调试模式：输出详细导航日志（默认 false） */
    debug?: boolean;
    /** 宿主元素或选择器（可选项） */
    host?: HTMLElement | string;
    /** 全局错误组件：字符串路径或动态导入函数 */
    defaultErrorComponent?: string | (() => Promise<any>);
    /** 自定义日志记录器 */
    logger?: AutoSparkRouterLogger;
    /** 全局视图加载配置（路由级 viewOptions 同形，不含 from） */
    viewOptions?: Omit<AutoSparkRouteViewOptions, "from">;
    /** 全局数据加载配置（路由级 dataOptions 同形，不含 from） */
    dataOptions?: Omit<AutoSparkRouteDataOptions, "from">;
    /** 全局路由参数缺省（路由项显式声明优先） */
    routeOptions?: Partial<Pick<AutoSparkRouteItem, "cache" | "keepAlive" | "preload" | "timeout">>;
    /** engine 全局 store 初始数据 */
    data?: Record<string, any>;
    /** 钩子执行超时配置 */
    hookOptions?: { timeout?: number };
    /** 五类钩子（函数或函数数组） */
    beforeRoute?: BeforeRouteHook | BeforeRouteHook[];
    afterRoute?: AfterRouteHook | AfterRouteHook[];
    beforeRender?: BeforeRenderHook | BeforeRenderHook[];
    afterRender?: AfterRenderHook | AfterRenderHook[];
    /** 视图渲染器列表（按 test() 顺序匹配） */
    renderers?: AutoSparkRouterViewRendererBase[];
    /** SEO <head> 管理（默认开启；false 整体关闭） */
    head?: false | HeadConfigOptions;
};
```

## 字段说明

### mode / base / home

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `mode` | `"history"` | `"history"` 使用 BrowserHistory，`"hash"` 使用 HashHistory |
| `base` | 自动推断 | 显式传 `undefined` 视为未设置；缺省链为 **显式配置 > 文档 `<base href>` 标签 > URL 目录推断** |
| `home` | `"/"` | 起始路径；`router.home()` 导航到 `base + home` |

### routes / routesFile / maxChildrenDepth / autoDiscoverRoutes

路由表主体见 [路由项](./route-item.md)。三个配合字段：

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `routesFile` | `"routes.json"` | `children: true` 约定子表与 `autoDiscoverRoutes` 自动发现共同使用的子表文件名 |
| `maxChildrenDepth` | `10` | 远程子表最大展开深度；触顶时该节点降级为无子路由并落 error 状态（循环引用的兜底） |
| `autoDiscoverRoutes` | `false` | `true` 时对每个未声明 `children` 且非重定向的节点投机探测 `{累积路径}/{routesFile}`；404 与「200 但非 JSON」按阴性静默落定，网络错误/5xx 降级并发 `routes:error` |

显式 `children: []` 视为声明无子路由（单节点退出自动发现）。

### errorPages

```ts
type ErrorPageSource = HTMLElement | ErrorPageHandler;

type ErrorPageHandler = (error: any, route: AutoSparkMatchedRouteItem[]) => HTMLElement;
```

```js
new AutoSpark("#app", {}, {
  routes: [{ path: "/", view: "/views/home.html" }],
  errorPages: {
    "404": (error, route) => {
      const el = document.createElement("autospark-feedback");
      el.type = "error";
      el.message = "404 - 页面未找到";
      return el;
    },
    "500": document.createElement("div"), // 直接使用元素
    "*": createDefaultErrorPage(),        // 通用兜底
  },
});
```

内置默认错误页会先展开，再合并你的 `errorPages`（同键覆盖）。

### routeOptions / viewOptions / dataOptions

应用级缺省值。`routeOptions` 仅允许四个键：`cache`、`keepAlive`、`preload`、`timeout`；路由项上的显式声明优先。

::: warning 默认不缓存
`routeOptions` 不预置 `keepAlive: true`——ADR-0003 起默认翻转：路由与出口均未声明时不缓存。详见[缓存](../guide/cache.md)。
:::

### renderers

视图渲染器列表，按注册顺序依次执行 `test()`，返回 `true` 者中选。优先级（ADR-0008 修订）：`!` 前缀强制 raw > 路由级显式 `renderer` > `renderers` 逐个 test > 模板渲染器兜底。详见[渲染器 API](./renderers.md)。

### head

SEO `<head>` 管理，见类型：

```ts
type HeadConfigOptions = {
    /** 站点绝对地址，用于解析相对 canonical / og:url */
    siteUrl?: string;
    /** 标题模板，"%s" 替换为最终标题；不含 "%s" 时退化为 "{标题} - {模板}" */
    titleTemplate?: string;
};
```

- 不声明或声明为空对象：**开启**（默认）
- `false`：整体关闭，router 不读写 `<head>`
- 单条路由可用 `meta: { seo: false }` 关闭该路由的 head 管理

### engine

注入模式（混合所有权，ADR-0002）：

- **提供时**：router 纯消费该实例，生命周期归应用所有，`detach()` 不销毁。应用的静态模板此时已编译完成，`x-outlet` 简写不再生效——请书写 `<div x-component:autospark.outlet>` 完整形态（远程模板中的 `x-outlet` 不受影响）。
- **缺省时**：router 在 attach 时自建 engine（host 首编译激活 `x-outlet` 简写），`detach()` 时销毁。

运行时契约：HTML 先加载 `autospark.js`（全局 `AutoSparkSpaces`）再加载 `autospark.router.js`；通过 bundler 使用时按需 import 即可。
