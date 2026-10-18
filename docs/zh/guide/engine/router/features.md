---
title: 特征与优势
---

# 特征与优势

## 特征

### 纯前端路由，静态文件即服务端

路由表（JSON）、视图（HTML）、远程子表——服务端只需托管静态文件，Nginx、对象存储、CDN 皆可。没有服务端路由逻辑、没有 SSR，部署即上传。

### 声明式路由表

路由项以纯数据声明，支持静态路径、动态参数（`/user/:id`）、正则约束（`/user/:id(\d+)`）、通配符（`*`）、别名（`alias`）、默认路由（`default`）、命名路由（`name`）。路由表本身可以是静态数组、远程 URL 或函数动态返回。

### 远程子表与自动发现

`children` 支持三种形态：静态数组、远程子表地址（`string`）、约定式简写（`true`，取 `routesFile`）。开启 `autoDiscoverRoutes` 后还能按约定路径投机探测子表，路由树按需生长，首屏不必加载全量路由。`maxChildrenDepth` 为循环引用兜底。

### 数据加载

路由级 `data` 支持三种来源——静态对象、URL（远程 JSON）、函数（自定义异步逻辑）。加载结果注入模板上下文，并按 URL 参数分别缓存（如 `/posts/:id` 的每个 id 各存一份）。

### 视图渲染器体系

视图渲染经固定选择链：`!` 前缀强制 raw → 路由级显式 `renderer` → `options.renderers` 逐个测试 → 模板渲染器兜底。内置模板渲染器（远程 HTML 视为 AutoSpark 模板）、raw 渲染器（普通 HTML 直插 DOM）；JSON / Image 渲染器随包导出，显式注册即用。渲染失败自动降级（模板重试 → raw 兜底），不白屏。

### 多层缓存

- `cache`：视图 HTML 按时间缓存，避免重复 fetch
- `keepAlive`：组件级缓存复用，离开不销毁 DOM，表单输入等运行态保留
- `hash`：视图哈希标识，同 hash 同就绪的视图仅激活不重渲染

### 导航控制全家桶

`push` / `replace` / `back` / `forward` / `go`；重定向支持字符串、命名路由、结果对象与动态函数四种形式；`push("!/path")` 打开模态路由；守卫与钩子（`beforeRoute` / `afterRoute` / `beforeRender` / `afterRender` / `routeError`）覆盖导航全生命周期。

### 事件总线

基于 `mitt` 派发结构化事件：`navigation:start` / `navigation:matched` / `navigation:cancel` / `navigation:end`、`routes:loaded` / `routes:expanded` / `routes:attached` / `routes:error`、`render:before` / `render:after`、`modal:open` / `modal:close`，导航全过程可观测。

### SEO `<head>` 管理

默认开启：`route.title` 同步文档标题（支持 `titleTemplate` 模板），`route.meta` 固定键（`description` / `canonical` / `robots` / `og` / `jsonLd`）写入对应标签，视图侧可用 `<autospark-view-meta>` 同名属性覆盖。

### 配套自定义元素

`auto-link`（链接便捷层）、`autospark-view-meta`（视图级 head 覆盖），随包自动注册。加载中指示与错误呈现由出口内建（x-loading 门控遮罩 + 内建错误块），不再依赖自定义元素。

## 优势

- **部署成本趋近于零**——任意静态托管即可，天然适配 CDN 与边缘分发
- **渐进接入**——已有 `autospark` 应用只需自建 engine 后注入 router，静态模板照旧工作，不强求重写
- **模板生态协同**——远程视图即 AutoSpark 模板，指令、组件、主题等 engine 能力全部可用
- **性能路径清晰**——预加载、视图缓存、keepAlive、raw 通道逐层提速，且渲染失败有降级兜底而非白屏
- **错误处理完备**——出口内建错误块（状态码 + 重试/返回）、`errorPages` 按状态码覆盖、`errorBoundary` 错误边界、`router.retry()` 重载失败层、`fallback` 回退路由
