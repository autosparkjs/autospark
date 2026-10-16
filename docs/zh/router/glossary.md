---
title: 名词解释
---

# 名词解释

| 名词 | 说明 |
| --- | --- |
| **路由表** | 路由项的声明集合（`AutoSparkRoutes`）。可以是静态数组、单个根对象、远程 URL 字符串（`fetch` 加载）或返回配置的函数 |
| **路由项** | 单条路由声明（`AutoSparkRouteItem`），核心字段：`path` / `view` / `data` / `children` / `redirect` / `keepAlive` / `preload` 等 |
| **路由匹配** | 将当前 URL 与路由表按路径规则（静态段、`:param` 动态参数、正则约束、`*` 通配符）比对，产出匹配结果的过程 |
| **匹配链** | 一次导航命中的路由项数组（`router.routes.current`，`AutoSparkMatchedRouteItem[]`）——嵌套路由时含祖先链，**当前路由取数组末项** |
| **路由出口** | 视图渲染的挂载点。静态模板写完整形态 `<div x-component:autospark.outlet>`；远程模板中可用简写 `<div x-outlet>`（编译前预处理转换） |
| **远程路由** | 子路由表托管在服务端：`children` 声明为 URL 字符串（断言性请求）或 `true`（约定式简写，地址取 `routesFile`，默认 `routes.json`），初始化时取回并展开 |
| **自动发现** | `autoDiscoverRoutes: true` 时，对每个未声明 `children` 的节点按 `{累积路径}/{routesFile}` 投机探测远程子表。探测为投机性请求：404 / 非 JSON 静默按无子路由处理，不报错 |
| **视图** | 路由渲染的内容来源（`view` 字段）：远程 HTML 的 URL、现成的 `HTMLElement`、或返回二者的函数 |
| **渲染器** | 决定视图如何呈现的处理器（`AutoSparkRouterViewRendererBase`）。`test()` 命中者执行渲染：模板渲染器把 HTML 视为 AutoSpark 模板编译，raw 渲染器原样插入 DOM |
| **渲染器选择链** | 固定优先级：`!` 前缀强制 raw > 路由级显式 `renderer` > `options.renderers` 逐个 `test()` > 模板渲染器兜底 |
| **raw 通道** | 不经 engine 编译、以 `x-html` 直挂 DOM 的渲染路径，用于纯静态 HTML，性能最优 |
| **数据源** | 路由级 `data`：静态对象 / URL（远程 JSON）/ 函数三种形态，结果注入模板上下文并按参数缓存 |
| **KeepAlive** | `keepAlive: true` 的视图离开时不销毁（DOM 常驻、隐藏），再次进入原样复用，保留表单输入等运行态 |
| **cache** | 视图 HTML 的内存缓存时长（毫秒），0 表示不缓存 |
| **hash** | 视图哈希标识（`{url}` / `{path}` / `{params.id}` 等插值）：同 hash 同就绪的视图仅激活不重渲染 |
| **preload** | `preload: true` 的路由在初始化阶段即预取视图，首次导航零等待 |
| **重定向** | `redirect` 声明命中即跳转：字符串路径 / 命名路由对象 / `{ path, mode }` 结果对象 / 动态计算函数，默认 `replace` 模式 |
| **别名** | `alias`：额外匹配路径——URL 保持别名形式，使用目标路由的配置渲染 |
| **默认路由** | 父路由完全匹配但无子路由命中时自动选择的路由：`path` 为 `""` / `"/"` / `"./"`，或显式 `default: true` |
| **模态路由** | 以 `push("!/path")` 的 `!` 前缀打开的浮层路由：直接渲染为模态，不进入 history 栈 |
| **守卫与钩子** | 导航生命周期回调：`beforeRoute` / `afterRoute` / `beforeRender` / `afterRender` / `routeError`，可在全局（`options.*`）或路由项级声明 |
| **事件** | router 经 `mitt` 事件总线派发的结构化事件（`router.on("navigation:start", fn)` 订阅）——**不是 DOM 事件**，`addEventListener` 收不到 |
| **auto-link** | 链接便捷组件（`<auto-link href="...">`）：base 前缀自动化、`replace` 导航声明等。router 同时统一接管普通 `<a>` 点击，auto-link 非导航必需品 |
| **head 管理** | router 对文档 `<head>` 的自动管理（默认开启）：`route.title` / `route.meta` 同步标题、描述、canonical 等，`head: false` 整体关闭 |
| **routesFile** | 远程子表的约定文件名（默认 `routes.json`），`children: true` 与自动发现均按此地址解析 |
