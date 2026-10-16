---
title: 快速入门
---

# 快速入门

本篇用一个最小 demo 展示 `@autospark/router` 的完整使用方式：**服务端**以静态文件组织路由表与视图，**客户端**引入 engine 与 router 两个脚本，在 engine 构造时声明 `routes` 即由插件自举自动挂载 router（ADR-0011）。全程无需构建工具。

## 目录结构

```
my-app/
├── index.html                # 客户端：宿主页面
├── routes.json               # 服务端：静态路由表
├── lib/
│   ├── autospark.js          # engine IIFE 产物
│   └── autospark.router.js   # router IIFE 产物
└── views/
    ├── home.html             # 服务端：首页视图
    └── about.html            # 服务端：关于视图
```

## 服务端组织

router 的"服务端"就是一台静态文件服务器：路由表是一个 JSON 文件，视图是普通 HTML 文件。

**routes.json** —— 声明路由树（纯 JSON，无任何运行时逻辑）：

```json
{
    "path": "/",
    "children": [
        { "path": "/", "title": "首页", "view": "/views/home.html", "default": true },
        { "path": "/about", "title": "关于", "view": "/views/about.html" }
    ]
}
```

**views/home.html** —— 首页视图，就是一个普通 HTML 片段，可以直接书写 AutoSpark 模板指令：

```html
<section>
    <h1>首页</h1>
    <p>这是一个由静态服务器托管的 HTML 文件，router 将它按 AutoSpark 模板编译渲染。</p>
    <p x-text="'当前路由：' + $route.path"></p>
</section>
```

**views/about.html**：

```html
<section>
    <h1 x-text="$route.title"></h1>
    <p>视图上下文中内置 $route / $query / $params 变量。</p>
</section>
```

## 客户端使用

**index.html** —— 宿主页面：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8" />
    <title>我的第一个 AutoSpark Router 应用</title>
</head>
<body>
    <nav>
        <a href="/">首页</a>
        <a href="/about">关于</a>
    </nav>

    <!-- 路由出口：匹配到的视图渲染在这里（x-outlet 简写经插件自举在宿主首编译前自动改写） -->
    <div id="app">
        <div x-outlet></div>
    </div>

    <!-- 双加载顺序兼容：先 engine 后 router，或先 router 后 engine 皆可 -->
    <script src="./lib/autospark.js"></script>
    <script src="./lib/autospark.router.js"></script>
    <script>
        const host = document.getElementById("app");

        // engine 构造 options 声明 routes → router 插件自举挂载
        // （路由表加载、导航监听注册、初始导航由 attach 异步链自动完成）
        const engine = new AutoSpark(host, {}, { routes: "routes.json" });

        // router 实例挂在宿主上，供命令式导航等高级用法
        const router = host.router;
    </script>
</body>
</html>
```

::: tip 零组件依赖的导航
导航链接用的是普通 `<a>` 标签——router `attach` 后会在文档级统一接管链接点击。也可使用 `auto-link` 自定义元素获得 base 前缀自动化等便捷能力，见[链接与导航](../guide/creating-routes.md)。
:::

## 运行

路由表与视图都经 `fetch` 加载，必须经 HTTP 访问。在 `my-app` 目录下启动任意静态服务器：

```bash
npx serve .
# 或
python -m http.server 8080
```

浏览器打开 `http://localhost:3000`（或 8080），点击导航链接即可在两个视图间切换，浏览器前进/后退、刷新直达、深链接均正常工作。

## 它是如何工作的

engine 构造时，router 插件按挂载矩阵自动挂载并开始 attach 异步链，依次完成：

1. **创建 history**（默认 `history` 模式）并加载路由表（`fetch("routes.json")`，展开为规范化路由树）
2. **接管导航**：监听 URL 变化，同时注册文档级链接点击委托（`auto-link` 与普通 `<a>`）
3. **初始导航**：当前 URL 为 `/` 时落到 `home`（默认 `/`）；其余路径按深链恢复（刷新/分享链接直达）
4. **匹配与渲染**：按路径匹配路由项 → 加载 `view` 指向的远程 HTML → 默认按 AutoSpark 模板编译渲染进路由出口
5. **`<head>` 管理**：将 `route.title` 等同步到文档 `<head>`（默认开启，可关闭）

## 下一步

- 想理解每个环节？从[创建路由](../guide/creating-routes.md)进入指南
- 想知道路由表还能怎么写？看[路由表](../guide/route-table.md)与[远程路由](../guide/remote-routes.md)
- 部署到子路径？了解 `base` 与路由模式，见[创建路由](../guide/creating-routes.md)
