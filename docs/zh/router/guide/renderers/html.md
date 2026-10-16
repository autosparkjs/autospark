---
title: html 渲染器
---

# html 渲染器（raw 通道）

## 关于

raw 渲染器（`AutoSparkRawViewRenderer`）**零加工**：响应体原样字符串输出，出口以普通 `x-html` 直接 innerHTML 挂载——**不经 engine 编译**（性能旁路，非安全隔离）。

触发路径有两条：

1. **`!` 前缀强制**：视图 URL 以 `!` 开头（如 `!/path/page.html`）——选择链第 0 级最高优先级直接选中
2. **降级末站**：任何渲染器加工失败且模板渲染也失败时，原样兜底输出

## 指南

### `!` 前缀强制 raw

视图 URL 加 `!` 前缀即跳过一切内容加工：

```json
{
    "path": "/legacy",
    "view": "!/legacy/old-page.html"
}
```

```js
{
    path: "/static",
    view: "!/views/plain.html"
}
```

::: tip 前缀与业务 query 零冲突
`!` 前缀是给 router 的指令，**不是 URL 的一部分**——基于 URL 查询参数的 raw 标记会与业务 query 冲突，前缀方案彻底避开该问题。fetch 前前缀已剥除，服务器收到干净 URL（`!` 不参与 base 拼接与插值）。
:::

### raw 视图的边界

raw 视图（条目带 raw 标志）由出口直接 innerHTML 挂载，因此：

- 内容中的 `x-*` 指令**不激活**
- `script` 标签**不执行**
- `x-outlet` **不生效**（嵌套出口请用模板渲染器）
- `autospark.data` script 之类的模板协议同样无效

适合场景：服务端渲染好的纯静态片段、第三方导出的 HTML、内容型富文本页。

### 性能动机

模板渲染器的 DOMParser 解析 + 编译激活有成本；raw 通道跳过全部加工，`innerHTML` 直插即完成。对**确认无模板需求**的内容页（新闻正文、文档内容、营销页），`!` 前缀是零成本的提速手段。

### 与 html/htm 文件的关系

`!` 前缀决定的是**渲染方式**，与文件扩展名无关——`.html` 文件既可走模板渲染（默认），也可加前缀走 raw：

```json
{
    "path": "/docs",
    "view": "/views/docs.html"         // 模板渲染：可写指令
},
{
    "path": "/print",
    "view": "!/views/print.html"      // raw 直插：纯静态更快
}
```

### 降级末站

raw 渲染器同时是渲染降级链的最后一站：选中渲染器失败 → 模板渲染器重试 → 仍失败才以 raw 原样输出。全链失败才落错误页。详见[渲染器](./index.md#渲染降级链)。
