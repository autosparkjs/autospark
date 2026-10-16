---
title: 创建路由
---

# 创建路由

## 关于

"创建路由" = **声明路由表 + 提供出口 + 启用 router**，三步完成一个多页面应用：

- **路由表**是一个 JSON 声明（静态数组、远程 URL、函数动态返回皆可），描述"哪个路径 → 哪个视图"
- **路由出口**是视图案挂载的 DOM 位置（`<div x-outlet>`）
- **启用 router** 通过 engine 构造第三参完成（ADR-0011 插件自举），router 自动挂载并启动首导航

router 无独立 `createRouter` 入口——engine 构造时声明 `routes` / `autoDiscoverRoutes` 即自动挂载。

## 指南

### 三种启用形态

engine 构造第三参按**挂载矩阵**决定是否挂载 router：

| engine options | 行为 |
| --- | --- |
| `routes: false` | 显式禁用，压过一切（含 `autoDiscoverRoutes`） |
| `routes` 有值（表 / 完整配置对象） | 挂载该表；`autoDiscoverRoutes` 不触发 |
| 无 `routes` + `autoDiscoverRoutes: true` | 挂载默认壳表 `[{path:"/"}]` + 整表自动发现 |
| 都没有 | 静默不挂载（纯 engine 应用零影响） |

::: tip 运行时契约
页面先引入 `autospark.js`（全局 `AutoSpark`）与 `autospark.router.js`，**双加载顺序兼容**——先 engine 后 router，或先 router 后 engine 皆可（预加载队列兜底）。
:::

### 第一条路由

服务端组织两个静态文件：路由表 `routes.json` 与视图 `views/home.html`。客户端构造 engine 时声明 `routes` 即完成一切——出口预处理、router 挂载、`attach` 异步链自动发起首导航：

```html
<div id="app">
    <!-- 宿主无出口声明时，router 会在首编译前自动补一个默认出口 -->
</div>

<script src="./lib/autospark.js"></script>
<script src="./lib/autospark.router.js"></script>
<script>
    const host = document.getElementById("app");
    const engine = new AutoSpark(host, {}, {
        routes: "routes.json" // 远程路由表：fetch 该 URL 并解析为路由声明
    });
    const router = host.router; // 挂载后经宿主访问 router 实例
</script>
```

`routes` 支持四种形态，详见[路由表](./route-table.md)。

### 静态数组路由表

小应用可直接内联数组，无需服务端路由表文件：

```js
const engine = new AutoSpark(host, {}, {
    routes: [
        { path: "/", title: "首页", view: "/views/home.html", default: true },
        { path: "/about", title: "关于", view: "/views/about.html" },
        { path: "/user/:id", title: "用户", view: "/views/user.html" }
    ]
});
```

### 完整配置对象形态

`routes` 也可以是完整的 `AutoSparkRouterOptions` 对象——同时声明路由表与 router 级配置：

```js
const engine = new AutoSpark(host, {}, {
    routes: {
        mode: "hash",                  // hash 模式（默认 history）
        base: "/app/",                 // 基础路径
        routesFile: "routes.json",     // 约定子表文件名（默认 routes.json）
        routes: [
            { path: "/", view: "/views/home.html", default: true },
            { path: "/about", view: "/views/about.html" }
        ],
        routeOptions: {                // 全局缺省值：路由项未显式声明时生效
            timeout: 8000
        }
    }
});
```

::: warning 对象形态下的 autoDiscoverRoutes
完整配置对象形态时，engine 级的 `autoDiscoverRoutes` 不透传（对象自身的键原样采用）。
:::

### 嵌套路由

`children` 声明子路由，形成"布局层 + 内容层"的嵌套渲染——每层匹配结果各渲染到所在层级的出口中：

```json
// routes.json
{
    "path": "/",
    "view": "/views/layout.html",
    "children": [
        { "path": "home", "title": "首页", "view": "/views/home.html", "default": true },
        { "path": "user/:id", "title": "用户", "view": "/views/user.html" }
    ]
}
```

`layout.html` 中再放一层出口：

```html
<!-- views/layout.html -->
<header>站点头部（父层视图，常驻）</header>
<div x-outlet></div>
```

导航到 `/user/123` 时：父层 `layout.html` 渲染到根出口，子层 `user.html` 渲染到 layout 内部的出口。

### 默认子路由

父路径完全匹配但没有子路由匹配时，自动选择 `default: true` 的子路由（`path` 为 `""` 或 `"/"` 的子路由天然具备默认资格，显式 `default: true` 优先级更低，多个默认时取声明序第一个）：

```json
{
    "path": "/",
    "view": "/views/layout.html",
    "children": [
        { "path": "home", "title": "首页", "view": "/views/home.html", "default": true },
        { "path": "about", "title": "关于", "view": "/views/about.html" }
    ]
}
```

访问 `/` 时自动渲染 `home` 子路由——URL 不变，父层 + `home` 双层同时渲染。

### 直接装配（注入自建 engine）

常规启用走上述插件自举。若需要**自行管理 engine 生命周期**（如复用既有 engine 实例），可在 router 选项中经 `options.engine` 显式注入：

```js
const engine = new AutoSpark(host, {}); // 生命周期归应用所有
const router = new AutoSparkRouter(host, {
    engine, // 注入自建实例，router detach 不处置 engine
    routes: [{ path: "/", view: "/views/home.html", default: true }]
});
```

::: warning 注入模式下的出口写法
注入模式下应用的静态模板已编译完成，`x-outlet` 简写不再生效（错过 precompile 预处理），出口须写完整形态 `<div x-component:autospark.outlet>`；远程视图模板中的 `x-outlet` 不受影响。
:::

### 导航

router 挂载后即可在任意位置导航：

```js
const router = host.router;

router.push("/user/123");          // 入栈导航（产生历史记录）
router.replace("/login");          // 替换当前记录
router.back();                     // 后退（有模态打开时优先关闭模态）
router.forward();                  // 前进
router.go(-2);                     // 跳转 n 条历史记录
router.home();                     // 导航到主页（options.home，默认 "/"）
```

模板中推荐用 `auto-link` 组件声明导航链接，详见[快速入门](../quick-start.md)。
