---
title: 重定向
---

# 重定向

## 关于

路由项 `redirect` 声明"访问此路由时自动跳转到别处"。重定向发生在**匹配阶段**——匹配器递归解析直到落定最终路由，视图、数据与生命周期钩子只对最终路由生效；地址栏保留发起导航的入口地址（`redirectFrom` 记录完整跳转链，可供界面提示）。典型用途：旧地址迁移、默认页调度、登录拦截的声明式表达。

## 指南

### 四种声明形态

```js
routes: [
    // ① 字符串：默认 replace 模式跳转（支持相对路径）
    { path: "/old-about", redirect: "/about" },

    // ② 命名路由：跳到 name 注册的目标，可带参数与查询串
    { path: "/go-user", redirect: { name: "user", params: { id: "1" }, query: { tab: "info" } } },

    // ③ 结果对象：指定跳转模式与目标窗口
    { path: "/first-login", redirect: { path: "/guide", mode: "push" } },

    // ④ 函数：动态计算目标（返回 null 表示不重定向）
    {
        path: "/dashboard",
        redirect: (route) => (isAdmin(route) ? "/admin" : { path: "/profile", mode: "push" })
    }
]
```

| 形态 | 说明 |
| --- | --- |
| `string` | 目标路径，默认 `replace` 模式 |
| `{ name, params?, query?, mode?, target? }` | 命名路由重定向；`params` 替换目标路径参数，`query` 合并查询串 |
| `{ path, mode?, state?, target? }` | 结果对象；`mode` 默认 `replace`，`target` 支持 `_self` / `_blank` |
| `(route) => target \| null` | 函数形态，入参为当前匹配项；返回 `null` 放行不跳转 |

### 相对路径

字符串/结果对象的 `path` 支持相对解析（相对于当前路由的**父路径**）：

```js
routes: [
    {
        path: "/a/b/up1",
        redirect: "../target"    // 父路径 /a/b → 上一级 /a → /a/target
    },
    {
        path: "/a/b/c",
        redirect: "./sibling"    // → /a/b/sibling
    },
    {
        path: "/a/x",
        redirect: "/absolute"    // 绝对路径原样
    }
]
```

### 外部链接

重定向目标是外部 URL（带协议/跨域）时，router 以**新窗口**（`target: "_blank"`）打开外部地址，不在本应用内导航。结果对象形态可用 `target: "_self"` 覆盖为当前窗口。

```js
{ path: "/github", redirect: "https://github.com" }   // 新窗口打开
```

### 防循环保护

- **最大重定向次数**：默认 10 次（匹配递归逐次递减），触顶抛出 `AutoSparkMaxRedirectRouteError`，匹配项带 `error` 渲染错误页
- **循环检测**：重定向链中出现重复路径抛出 `AutoSparkLoopRouteError`

重定向目标最终无法命中任何路由时抛 `AutoSparkNotFoundRouteError`。全部错误都会经过 `routeError` 钩子与错误页面机制，详见[路由守卫](./guards.md)。

下面的 demo 覆盖四种声明形态，观察每次点击后「当前落地路由」与地址栏的差异：

<demo html="router/redirect.html"/>

### 重定向历史

重定向发生后，最终匹配项的 `redirectFrom` 记录完整跳转链：

```js
router.on("navigation:matched", ({ toRoute }) => {
    const last = toRoute[toRoute.length - 1];
    if (last.redirectFrom) {
        console.log("重定向链：", last.redirectFrom); // [{ url, mode }, ...]
    }
});
```

### 全局后备重定向

匹配级 `redirect` 之外，匹配器还接受一个**后备重定向**（仅当命中路由未声明 `redirect` 时生效），供"任何未声明页都去首页"之类的兜底语义使用。

::: tip redirect 与守卫的分工
`redirect` 是**声明式**的、发生在匹配阶段（无钩子可拦截）；登录态等**程序化判定**请用 `beforeRoute` 守卫返回目标路径，详见[路由守卫](./guards.md)。
:::
