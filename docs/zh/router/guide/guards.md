---
title: 路由守卫
---

# 路由守卫

## 关于

守卫（钩子）是导航生命周期上的拦截点：**导航前**做权限判定（可取消、可改道），**渲染前**做数据补充，**渲染后**做埋点上报。router 提供五个全局钩子 + 同名路由级钩子，全局与路由级按序合并执行。

| 钩子 | 时机 | 执行方式 | 返回值语义 |
| --- | --- | --- | --- |
| `beforeRoute` | 导航匹配后、加载前 | **串行** | `false` 取消导航；字符串重定向 |
| `beforeRender` | 视图/数据加载后、渲染前 | **串行** | `false` 取消渲染；字符串重定向 |
| `afterRoute` | 导航完成后 | 并行 | 无 |
| `afterRender` | 渲染完成后 | 并行 | 无 |
| `routeError` | 导航/加载出错时 | 并行 | 无 |

## 指南

### 全局守卫

在 router 选项上声明（函数或函数数组）：

```js
const engine = new AutoSpark(host, {}, {
    routes: [/* ... */],
    beforeRoute({ from, to }) {
        // 返回 false：取消本次导航
        if (to[0].url === "/admin" && !isAdmin()) return false;
        // 返回字符串：重定向到该路径
        if (!isLogin() && to[0].url !== "/login") return "/login";
    },
    afterRoute({ to }) {
        // 导航完成：上报 PV
        report(to[to.length - 1].url);
    },
    routeError({ error, to }) {
        console.error("导航出错", to, error);
    }
});
```

`beforeRoute` 入参 `{ from, to }`：`from` 为来源匹配数组（首次导航为 `undefined`），`to` 为目标匹配数组（根 → 叶）。路由定位信息取数组**末项**（最深匹配层）。

### 路由级守卫

在路由项上声明，只对导航到该路由时生效：

```js
{
    path: "/admin",
    view: "/views/admin.html",
    beforeRoute({ to }) {
        return hasRole("admin") || false; // false → 取消导航
    },
    afterRender() {
        initAdminWidgets();
    }
}
```

### 登录拦截

`beforeRoute` 返回目标路径即重定向——经典登录拦截一行完成：

```js
beforeRoute({ to }) {
    const publicPaths = ["/login", "/register"];
    const target = to[to.length - 1].url;
    if (publicPaths.includes(target)) return;        // 公开页放行
    if (!store.isLogin) return "/login?from=" + encodeURIComponent(target);
}
```

### beforeRender 数据预取

`beforeRender` 在视图与数据加载之后、渲染之前执行，入参含 `{ from, to, view, data }`——可在此补充/修正注入模板的数据：

```js
beforeRender({ to, view, data }) {
    // data 是路由 data 通道的加载结果（可能为 undefined）
    // 返回 Promise 则渲染等待其完成
    return enrich(to[to.length - 1], data);
}
```

### 渲染后处理

`afterRender` 在渲染完成后执行，入参 `{ from, to, el }`（`el` 为渲染后的视图元素，可能为 `undefined`）：

```js
afterRender({ el }) {
    el?.querySelectorAll("[data-lazy]").forEach(initLazyLoad);
}
```

### 错误处理

`routeError` 钩子接收 `{ error, to }`，错误类型涵盖：匹配错误（404 / 重定向循环 / 重定向上限）、加载错误（fetch 失败、超时）、数据校验失败等。

配合**错误页面**（`errorPages`，按状态码配置 404/500/通用兜底，元素或返回元素的函数）与路由级**错误边界**（`errorBoundary`：错误组件 + fallback UI + 重试策略）形成完整的错误处置链：

```js
const engine = new AutoSpark(host, {}, {
    routes: [/* ... */],
    errorPages: {
        "404": (error, route) => {
            const el = document.createElement("autospark-feedback");
            el.type = "error";
            el.message = "404 - 页面未找到";
            return el;
        },
        "500": createServerErrorPage,
        "*": createDefaultErrorPage
    }
});
```

::: tip 钩子超时与容错
钩子默认**忽略执行错误**（出错视为未拦截，继续后续钩子）。全局 `hookOptions.timeout` 可为异步钩子设限时；钩子自身抛错时触发 `hook:error` 事件。
:::

### 钩子与事件的分工

钩子是**流程拦截**（可返回值改变流程）；事件是**事后广播**（只读观察）。可取消的逻辑走守卫，纯监听（埋点、日志）走事件，详见[事件](./events.md)。
