---
title: 关于
---

# AutoSpark Router

::: tip 核心定位
`@autospark/router` 是 AutoSpark 生态的**纯前端路由库**——没有服务端路由匹配、没有 SSR 依赖，路由表与视图皆以**静态文件**形式组织在任意 HTTP 服务上，浏览器端完成匹配、加载、渲染的全部工作。
:::

它解决一个朴素的问题：**用一堆静态 HTML/JSON 文件，组织出一个多页面、可深链、可缓存的前端应用**。

- 路由表可以是一个 JSON 文件，视图可以是一个 HTML 文件，都交给任意静态服务器（Nginx、对象存储、CDN）托管即可
- 客户端在 engine 构造时声明 `routes`，router 插件自举自动挂载，导航、匹配、数据加载、视图编译、`<head>` 管理全部就位
- 视图默认按 **AutoSpark 模板**编译渲染——远程 HTML 里可以直接写 `x-*` 指令、组件，与 engine 生态无缝协同；也可以切换为普通 HTML 直插等渲染方式

## 一个最小的例子

服务端只有一个静态路由表和两个视图文件：

```json
// routes.json
{
    "path": "/",
    "children": [
        { "path": "/", "title": "首页", "view": "/views/home.html", "default": true },
        { "path": "/about", "title": "关于", "view": "/views/about.html" }
    ]
}
```

客户端引入 engine 与 router 两个脚本，构造 engine 时声明 `routes` 即完成挂载：

```html
<div id="app">
    <div x-outlet></div>
</div>

<script src="./lib/autospark.js"></script>
<script src="./lib/autospark.router.js"></script>
<script>
    // 声明 routes → router 插件自举挂载（attach 异步链自动完成初始导航）
    const host = document.getElementById("app");
    const engine = new AutoSpark(host, {}, { routes: "routes.json" });
    const router = host.router;
</script>
```

完整步骤见[快速入门](./quick-start.md)。

## 它由什么组成

| 组成 | 说明 |
| --- | --- |
| 路由表 | 声明式配置：静态数组、远程 URL、函数动态返回皆可，支持多级远程子表展开 |
| 路由出口 | `<div x-outlet>`（或完整形态 `<div x-component:autospark.outlet>`），匹配视图的挂载点 |
| 视图加载与渲染器 | 从 URL/元素/函数加载视图，按渲染器选择链决定"模板编译"还是"原样插入" |
| 数据加载 | 路由级 `data` 支持静态对象 / URL / 函数三种来源，加载结果注入模板上下文 |
| 导航与守卫 | `push` / `replace` / `back` / `forward` / `go`，配套 `beforeRoute` / `afterRoute` / `beforeRender` / `afterRender` 钩子 |
| 缓存体系 | 视图缓存（`cache`）、组件级缓存复用（`keepAlive`）、视图哈希复用（`hash`） |
| 配套组件 | `auto-link`、`autospark-view-meta` 等自定义元素；加载指示与错误呈现由出口内建 |

## 与 AutoSpark Engine 的关系

router 是 engine 的**视图层扩展**，不是替代。常规启用走**插件自举**：engine 构造时声明 `routes` / `autoDiscoverRoutes`，router 插件自动挂载（ADR-0011）；也可在 router 选项中经 `options.engine` 显式注入自建实例直接装配（生命周期归应用所有，router `detach` 不处置 engine）。

- **静态模板**：插件自举时出口简写在宿主首编译前自动改写，`<div x-outlet>` 直接可用；仅直接装配（router 挂载晚于 engine 构造）时须写完整形态 `<div x-component:autospark.outlet>`
- **远程视图**：经渲染管线加载，其中可以放心使用 `x-outlet` 简写与全部 `x-*` 指令——远程 HTML 默认按 AutoSpark 模板编译渲染
- **不用模板特性**：远程 HTML 也可以不走模板编译，以普通 HTML 直插 DOM（raw 通道），性能更好
- **插件自举**：engine 构造时声明 `routes` / `autoDiscoverRoutes`，router 插件自动挂载并启动导航（ADR-0011）

运行时契约：浏览器环境引入 `autospark.js`（全局 `AutoSpark`）与 `autospark.router.js` 两个脚本，**双加载顺序兼容**——先 engine 后 router，或先 router 后 engine 皆可（ADR-0114 预加载队列兜底）。

## 从这里开始

- 第一次接触？看[安装](./installation.md)与[快速入门](./quick-start.md)
- 想了解能做什么？看[特征与优势](./features.md)
- 遇到概念疑问？查[名词解释](./glossary.md)
- 上手开发？进入[指南](./guide/creating-routes.md)
