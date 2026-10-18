---
title: 默认渲染器
---

# 默认渲染器（模板）

## 关于

模板渲染器（`AutoSparkTemplateViewRenderer`）是**内置默认渲染器**：把远程 HTML 视为 **AutoSpark 模板**——经 engine `x-html.compile` 编译激活，其中的 `x-*` 指令、组件、嵌套出口全部生效，远程视图与本地模板具备同等的全响应式能力。

`.html` / `.htm` 及**其余一切格式**都是它的承接范围——`test()` 恒真，既是选择链的末位兜底，也是渲染降级链的中间站。

## 指南

### 基本用法

无需任何配置——不声明渲染器、URL 不带 `!` 前缀、自定义渲染器都不命中时，走的就是模板渲染器：

```json
{
    "path": "/home",
    "title": "首页",
    "view": "/views/home.html"
}
```

```html
<!-- views/home.html：远程模板，指令全部生效 -->
<h1 x-text="$route.title"></h1>
<div x-if="user.vip">
    <span>尊贵的 VIP</span>
</div>
<ul>
    <li x-for="item of items" x-text="item.name"></li>
</ul>
```

模板上下文包含：路由 `data` 加载的数据字段（展开为局部变量）、`$route` 路由元信息、`$params` 路由参数、`$query` 查询参数。详见[数据加载](../data-loading.md)。

### 出口简写预处理

模板渲染器在编译前对远程 HTML 做两步预处理：

1. `DOMParser` 解析为文档
2. **`x-outlet` 简写改写**：`<div x-outlet>` → `<div x-component:autospark.outlet>`——远程模板中的嵌套出口声明由此激活，与宿主静态模板享受同等待遇

产物从改写后的文档序列化，再交出口以 `x-html.compile` 编译挂载。`<style>` 标签原样保留，经编译通路文档级生效。

### selector 内容提取

视图配置对象声明 `selector` 时，渲染器从解析后的文档中**只提取匹配元素的内容**作为视图——适合多路由共享一个页面文档、按参数取区块的场景：

```js
{
    path: "/docs/:page",
    view: {
        from: "/views/docs-all.html",
        selector: "#doc-{$query.page}"   // 选择器支持参数插值
    }
}
```

插值变量：`$params`（路由参数）、`$query`（查询参数）、`$state`（导航状态）。选择器无效时告警并回退整文档内容。

### 与 raw 通道的选择

模板编译带来全响应式，也带来编译成本。**纯静态内容**（无指令、无组件）用 raw 通道直插 DOM 更快，见 [html 渲染器](./html.md)。
