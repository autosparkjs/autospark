---
title: 常见问题
---

# 常见问题

## 挂载与集成

### 报错"缺少 options.engine"？

router 以 AutoSpark 插件形态挂载（ADR-0011），常规启用无需手动注入 engine——构造 engine 时声明 `routes` / `autoDiscoverRoutes` 即自动挂载：

```js
const engine = new AutoSpark(host, {}, { routes: "routes.json" });
const router = host.router;
```

仅绕过插件自举、直接装配 router 实例（高级用法）时，才须在 router 选项显式传入 `engine`，缺失即抛错。

### 静态模板里写 `<div x-outlet>` 为什么不生效？

`x-outlet` 简写靠"编译前 DOM 预处理"改写。插件自举时预处理发生在宿主首编译之前，简写可直接使用；仅直接装配（router 挂载晚于 engine 构造，宿主静态模板已编译完成、来不及转换）时须写**完整形态** `<div x-component:autospark.outlet>`。远程加载的视图走渲染管线，始终可用简写。

### 一定要搭配 engine 吗？

模板渲染（默认渲染器把远程 HTML 视为 AutoSpark 模板）依赖 engine，而 engine 始终由应用构造、不随 router 打包。若视图均为纯静态 HTML，可走 raw 通道（`!` 前缀或 HTML 渲染器）跳过模板编译，但 engine 实例本身仍不可省。

## 导航与链接

### 为什么我用 `addEventListener` 监听不到路由事件？

router 的事件经 `mitt` 事件总线派发，**不是 DOM 事件**，在元素上监听无效。请用 `router.on("navigation:start", handler)` 订阅，事件名见[事件](../guide/events.md)。

### 必须使用 `<auto-link>` 组件吗？

不必。router `attach` 后在文档级统一接管普通 `<a>` 的点击导航。`auto-link` 是可选便捷层，提供 base 前缀自动化、`replace` 声明等能力，详见指南[链接](../guide/creating-routes.md)。

### 页面部署在子路径下，路由错乱？

通过 `options.base` 声明基础路径；或改用 `mode: "hash"` 规避服务端路径问题。

## 数据与渲染

### JSON / 图片渲染器为什么不生效？

这两个渲染器**仅随包导出，不自动启用**——需显式注册到 `options.renderers` 才会参与选择链：

```js
import { AutoSpark } from "autospark";
import { AutoSparkJsonViewRenderer } from "@autospark/router";

new AutoSpark(host, {}, {
    routes,
    renderers: [new AutoSparkJsonViewRenderer()],
});
```

### 想让某个视图跳过模板编译，直接插入 HTML？

在 `view` 地址前加 `!` 前缀即可强制 raw 渲染（不经 engine 编译，性能最优）：

```js
{ "path": "/legal", "view": "!/views/legal.html" }
```

### `!` 前缀有哪些含义？

两处，注意区分：

- **`view` 值的 `!` 前缀**：强制该视图走 raw 通道渲染
- **`push` 路径的 `!` 前缀**：`router.push("!/login")` 表示以**模态路由**打开，不进入 history

## 路由表

### 路由表和视图必须经 HTTP 访问吗？

是。二者均经 `fetch` 加载，`file://` 协议下浏览器会拦截，本地开发请起静态服务器（见[快速入门](./quick-start.md#运行)）。

### 自动发现把 SPA 托管的 index.html 当成路由表了？

开启 `autoDiscoverRoutes` 后的探测请求若被 SPA 回退（返回 200 但内容非 JSON），会按"无子路由"静默处理，不会报错，也无需处理。

### 远程子表循环引用了怎么办？

router 不做循环检测，以 `options.maxChildrenDepth`（默认 10）兜底：触顶节点降级为无子路由并落 error 状态。

### `router.routes.current` 是什么？

匹配链数组（`AutoSparkMatchedRouteItem[]`）。嵌套路由命中时含整条祖先链，**当前路由取数组末项**，而非单个对象。
