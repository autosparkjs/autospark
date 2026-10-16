---
title: JSON 渲染器
---

# JSON 渲染器

## 关于

JSON 渲染器（`AutoSparkJsonViewRenderer`）把 `.json` 视图渲染为 `<pre>` 内的美化文本（2 格缩进 + HTML 转义），适合直接浏览接口数据、静态数据文件预览。

::: warning 需显式注册
内置格式自动判定已移除——JSON 渲染器**仅保留导出**，需显式注册到 `options.renderers` 后按 `test()`（`.json` 扩展名）探测生效。
:::

## 指南

### 注册

```js
const {
    AutoSparkRouterViewRendererBase,
    AutoSparkJsonViewRenderer
} = AutoSparkRouter;

const engine = new AutoSpark(host, {}, {
    routes: [/* ... */],
    renderers: [new AutoSparkJsonViewRenderer(host.router)]  // 见下方说明
});
```

::: tip 渲染器实例依赖 router
内置渲染器构造函数需要 router 实例（渲染器基类持有 `router` 引用）。经插件自举时 router 挂载晚于 engine 构造——推荐先挂载、后注册：

```js
const engine = new AutoSpark(host, {}, { routes: [/* ... */] });
const router = host.router;
router.viewLoader.renderers.push(new AutoSparkJsonViewRenderer(router));
```

或自行实现无需 router 引用的渲染器经构造 options 注册，见[自定义渲染器](./custom.md)。
:::

### 使用

注册后，视图源指向 `.json` 文件的路由自动命中：

```json
{
    "path": "/api/users",
    "title": "用户数据",
    "view": "/api/users.json"
}
```

渲染产物：

```html
<pre class="autospark-json-view">{
  "users": [
    { "id": 1, "name": "Alice" },
    ...
  ]
}</pre>
```

### 探测与降级

- `test()`：视图 URL（去 query/hash、小写化）以 `.json` 结尾即命中——基于**路由声明的视图源**判定，与响应头无关
- 解析失败（响应体不是合法 JSON）按**渲染失败**处理：返回 `error` 交由渲染降级链（模板 → raw）处置，不会白屏

::: tip 与路由 data 的区别
`view` 指向 `.json` 是把数据**当页面显示**；路由 `data` 指向 `.json` 是把数据**注入模板上下文**。两者独立使用、也可同路由并用。
:::
