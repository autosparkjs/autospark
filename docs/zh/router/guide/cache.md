---
title: 缓存
---

# 缓存

## 关于

router 的缓存体系分三个层次，解决不同的问题：

| 机制 | 粒度 | 作用 |
| --- | --- | --- |
| `keepAlive` | 视图实例 | 缓存的视图离开时不销毁（DOM 常驻、隐藏），切回原样复用——表单输入等运行态保留 |
| `cache` | 加载结果 | 视图/数据的网络层缓存（毫秒），过期前不再发请求 |
| `hash` | 复用判定键 | 视图哈希标识，同 hash 且就绪的视图仅激活不重渲染 |

**默认已翻转**：路由与出口均未声明时**不缓存**（视图每次进入重编译，离开即无态可丢）——需要保态的页面显式声明。

## 指南

### keepAlive 视图缓存

路由项 `keepAlive: true` 声明该路由视图常驻：

```json
{
    "path": "/compose",
    "title": "写邮件",
    "view": "/views/compose.html",
    "keepAlive": true
}
```

导航离开时视图不销毁（`x-show` 隐藏），再次进入原样复用——草稿内容、滚动位置、输入状态全在。解析为 false 的视图走临时容器，每次进入重编译。

缓存优先级（从高到低）：

1. 出口 `mode="tabs"`——页签模式下**全部视图常驻**
2. 路由项 `keepAlive` 显式声明
3. 出口 `keepAlive` prop——本出口内未显式声明的路由的默认值

```html
<!-- 出口级默认：内部路由默认缓存，个别路由可显式覆盖 -->
<div x-outlet="{ keepAlive: true }"></div>
```

### 页签模式下的缓存生命周期

`mode="tabs"` 出口中全部视图常驻，页签**关闭即销毁**对应视图缓存（DOM 移除，下次进入重新渲染）；关闭当前激活页签时自动导航到相邻页签。

### cache 网络层缓存

`cache`（毫秒）作用于**加载结果**：视图 HTML 与路由数据各自独立缓存，有效期内再次进入不发请求。`0` 表示不缓存（默认）：

```js
{
    path: "/products",
    view: { from: "/views/products.html", cache: 60_000 },  // 视图缓存 60s
    data: { from: "/api/products", cache: 30_000 }          // 数据缓存 30s
}
```

缓存在路由项级别记账：页面刷新后重置（生命周期 = 路由表 = 应用级）。

### hash 视图哈希

`hash` 模板生成视图哈希标识——keepAlive 复用与出口视图清单的判定键。**默认 `{url}`**：实际完整 URL（含参数值），保证参数化路由的每个参数取值都是独立视图。

支持字符串插值，可用变量：

| 变量 | 含义 |
| --- | --- |
| `{url}` | 解析后的实际 URL（如 `/products/smartphones`，默认） |
| `{path}` | 路由模式路径（如 `/products/:category`，不含参数值） |
| `{basepath}` | 基础路径 |
| `{timestamp}` | 时间戳（每次导航都产生新视图） |

自定义模板可混用路由变量：

```js
{ path: "/user/:id", hash: "user-{params.id}" }      // → "user-123"
{ path: "/posts", hash: "posts-{query.category}" }   // → "posts-tech"
```

::: warning 参数坍缩陷阱
视图缓存/keepAlive 复用按 hash 判定。若把 hash 写成 `{path}`，`/user/1` 与 `/user/2` 会坍缩为同一键——参数变化时被误判为"同视图复用"而跳过重渲染（表现为子路由切换不生效）。参数化路由保持默认 `{url}` 即可，仅在需要**跨参数共享视图实例**时才显式声明。
:::

数据通道的缓存键同样支持 `hash` 模板（默认 `{path}`，需要按参数区分时写 `{url}` 或自定义模板），见[数据加载](./data-loading.md)。

### routeOptions 全局缺省

`routeOptions.cache` / `routeOptions.keepAlive` 为所有路由提供缺省值（路由项显式声明优先）：

```js
const engine = new AutoSpark(host, {}, {
    routes: [/* ... */],
    routeOptions: {
        keepAlive: true,     // 全站视图默认缓存
        cache: 30_000        // 全站加载结果默认缓存 30s
    }
});
```

### 选用建议

- **表单页、编辑页**：`keepAlive: true`（保运行态）
- **低频变动的内容页**：`cache`（省网络，不做 DOM 常驻）
- **高实时的数据页**：都不声明（每次进入重新加载渲染）
- **多页签工作台**：出口 `mode="tabs"`
