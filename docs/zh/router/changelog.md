---
title: 更新历史
---

# 更新历史

遵循[语义化版本](https://semver.org/lang/zh-CN/)，新版本发布后在此追加条目。

## 0.0.0

首发版本。

### 核心

- `createRouter(host, options)` 工厂函数与 `AutoSparkRouter` 类：`attach` / `detach` / `push` / `replace` / `home` / `back` / `forward` / `go`
- `history` / `hash` 双模式（默认 `history`），`base` 基础路径
- 声明式路由表：静态数组 / 根对象 / 远程 URL / 函数四种形态
- 路径匹配：静态段、`:param` 动态参数、正则约束（`/user/:id(\d+)`）、`*` 通配符
- 初始导航：`/` 自动落 `home`（`options.home`，默认 `/`），其余按 URL 深链恢复；入口文档直开归位

### 路由能力

- 远程子表：`children` 支持数组 / URL 字符串 / `true` 约定简写（`routesFile` 默认 `routes.json`），`maxChildrenDepth` 兜底循环引用
- 自动发现路由 `autoDiscoverRoutes`：约定路径投机探测，404 / 非 JSON 静默阴性，失败缓存分级
- 重定向 `redirect`：字符串 / 命名路由 / 结果对象 / 动态函数，默认 `replace` 模式，记录完整重定向链
- 别名 `alias`、默认路由 `default`、命名路由 `name`、模态路由（`push("!...")`）

### 数据与视图

- 数据加载 `data`：静态对象 / URL / 函数三种来源，按 URL 参数分别缓存
- 视图加载 `view`：URL / `HTMLElement` / 函数三种来源
- 渲染器体系：固定选择链（`!` 前缀强制 raw > 路由级 `renderer` > `options.renderers` > 模板兜底）与两级降级（模板重试 → raw 兜底）
- 内置渲染器：模板渲染器、raw 渲染器；JSON / Image 渲染器随包导出（需显式注册到 `options.renderers`）
- 自定义渲染器基类 `AutoSparkRouterViewRendererBase`

### 缓存与性能

- 视图缓存 `cache`、组件级缓存复用 `keepAlive`、视图哈希复用 `hash`
- 预加载 `preload`：初始化阶段预取视图

### 可靠性与可观测性

- 守卫与钩子：`beforeRoute` / `afterRoute` / `beforeRender` / `afterRender` / `routeError`，全局与路由级双声明位，`hookOptions.timeout` 超时控制
- 错误处理：`errorPages`（按状态码 + `*` 兜底）、`errorBoundary`、`retry`（次数/延迟/退避策略）、`fallback` 回退路由、`defaultErrorComponent`
- 事件总线（mitt）：`navigation:*` / `routes:*` / `render:*` / `modal:*`
- `debug` 模式与自定义 `logger`

### 配套

- SEO `<head>` 管理：默认开启，`siteUrl` / `titleTemplate`，`route.title` + `route.meta` 固定键，视图级 `<autospark-view-meta>` 覆盖，`head: false` 关闭
- 自定义元素：`auto-link`、`autospark-loading`、`autospark-feedback`、`autospark-view-meta`
- 文档级链接点击委托：统一接管 `auto-link` 与普通 `<a>`，修饰键 / 新窗口 / 下载等场景交还浏览器默认行为
