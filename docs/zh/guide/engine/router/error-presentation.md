---
title: 错误呈现与重试
---

# 错误呈现与重试

## 关于

视图或数据加载失败、URL 未匹配路由时，出口不再白屏——错误呈现体系由三层构成（ADR-0012）：

- **出口内建错误块**：默认呈现，显示状态码、错误信息与动作按钮（重试 / 返回）；
- **`errorPages` 应用级覆盖**：显式配置的错误页处理器优先命中，产物作为就绪视图挂载；
- **`router.retry()`**：公开重载 API，重跑当前匹配链上所有失败层。

配套的加载中指示（x-loading 门控覆盖层）见[视图加载](./view-loading.md)。

## 指南

### 内建错误块

`options.errorPages` 未配置（或对应状态码未命中）时，加载失败落出口数据域的 `view.error = { status, message }`，由出口模板内建错误块呈现：

- 状态码 + 错误信息 + 动作按钮；
- **非 404 错误**：「重试」（调 `router.retry()` 重跑失败层）+「返回」（`router.back()`）；
- **404（未匹配 URL）**：仅「返回」——未匹配不存在可重跑的失败层；
- 加载指示随错误落下同步关闭（`loading` 转为 `false`），不会被遮罩盖住。

错误块样式经出口级 CSS 自定义属性重载（同 tab 条惯例）：

```css
:root {
    --autospark-outlet-error-status-color: #e74c3c;
    --autospark-outlet-error-btn-bg: #e74c3c;
}
```

### 未匹配 URL（404）

访问路由表未声明的 URL 时，匹配链以未匹配条目收尾——所在出口呈现 404 错误块（状态码 `404` + 提示信息 + 「返回」）。此前未匹配层被静默跳过、整层空白。

### errorPages 自定义错误页

需要整页级深度定制时，按状态码配置错误页处理器（元素或返回元素的函数）：

```js
const engine = new AutoSpark(host, {}, {
    routes: {
        routes: [/* ... */],
        errorPages: {
            "404": (error, route) => {
                const el = document.createElement("div");
                el.innerHTML = "<h1>404</h1><p>页面未找到</p>";
                return el;
            },
            "500": createServerErrorPage,   // HTMLElement：直接使用
            "*": createDefaultErrorPage     // 通用兜底（状态码未命中时）
        }
    }
});
```

分流规则（**显式声明优先**）：

| 场景 | 呈现 |
| --- | --- |
| `errorPages[status]` 或 `["*"]` 命中 | 错误页处理器产物（`outerHTML`）作为就绪视图挂载 |
| 未配置 / 未命中 | 出口内建错误块 |

`errorPages` 是**纯应用级覆盖入口**——router 不再在构造期合并任何内建默认错误页，未配置即全走内建块。

### 重试失败层

`router.retry()` 无参公开方法，重跑当前匹配链上所有加载失败的层（视图 + 数据两通道），完成后重走渲染域恢复视图：

```js
// 出口错误块的「重试」按钮内部即调用它；业务代码亦可主动调用
router.retry();
```

语义边界：

- **重载而非重新导航**——不写历史记录、不走 `beforeRoute` / `afterRoute` 导航钩子链；
- 仅重跑失败层：已成功加载的层跳过（零网络成本），失败层必真实重新请求（错误不落缓存）；
- 导航进行中调用会先中止在途请求再重试，避免并发写出口数据域。

<demo html="router/loading-error.html"/>

::: warning 旧组件已退役
`autospark-loading` 与 `autospark-feedback` 自定义元素、内建默认错误页（`pages/errors`）已随 ADR-0012 删除——加载指示由出口内建 x-loading 覆盖层承担，错误呈现由内建错误块与 `errorPages` 承担。
:::

## 下一步

- [缓存](./cache.md)：视图缓存、keepAlive 与哈希复用如何与错误条目交互
- [路由守卫](./guards.md)：导航拦截与 `routeError` 钩子
