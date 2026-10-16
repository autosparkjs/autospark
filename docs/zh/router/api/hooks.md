---
title: 钩子
---

# 钩子 API

## 关于

五类钩子覆盖导航与渲染的关键节点。可在两处声明：全局 `AutoSparkRouterOptions`（作用于所有路由）与路由项（仅该路由生效）。

| 钩子 | 时机 | 执行方式 |
| --- | --- | --- |
| `beforeRoute` | 导航匹配后、离开前 | **串行**；返回 `false` 取消导航，返回字符串改道 |
| `beforeRender` | 视图加载后、渲染前 | **串行**；返回 `false` 取消，返回字符串重定向 |
| `afterRoute` | 导航完成后 | 并行；错误被忽略 |
| `afterRender` | 渲染完成后 | 并行；错误被忽略 |
| `routeError` | 导航/加载出错时 | 并行；错误被忽略 |

## 签名

```ts
type BeforeRouteHookArgs = {
    from: AutoSparkMatchedRouteItem[] | undefined; // 首次导航为 undefined
    to: AutoSparkMatchedRouteItem[];
};
type BeforeRouteHook = (args: BeforeRouteHookArgs) =>
    boolean | string | Promise<boolean | string>;

type AfterRouteHookArgs = { to: AutoSparkMatchedRouteItem[] };
type AfterRouteHook = (args: AfterRouteHookArgs) => void | Promise<void>;

type RouteErrorHookArgs = {
    error: AutoSparkRouterError;
    to: AutoSparkMatchedRouteItem[];
};
type RouteErrorHook = (args: RouteErrorHookArgs) => void;

type BeforeRenderHookArgs = {
    from: AutoSparkMatchedRouteItem[];
    to: AutoSparkMatchedRouteItem[];
    view: HTMLElement;
    data: AutoSparkRouteDataSource | undefined;
};
type BeforeRenderHook = (args: BeforeRenderHookArgs) => void | Promise<void>;

type AfterRenderHookArgs = {
    from: AutoSparkMatchedRouteItem[];
    to: AutoSparkMatchedRouteItem[];
    el: HTMLElement | undefined;
};
type AfterRenderHook = (args: AfterRenderHookArgs) => void | Promise<void>;
```

## 声明

```js
new AutoSpark("#app", {}, {
  routes: [/* ... */],
  // 全局：函数或函数数组
  beforeRoute: ({ to, from }) => {
    if (to.at(-1).route?.meta?.auth && !isLogin()) return "/login"; // 字符串改道
    return true; // 放行
  },
  afterRoute: ({ to }) => {
    // 埋点等只读逻辑
  },
});

// 路由级：仅该路由生效
{
  path: "/admin",
  view: "/views/admin.html",
  beforeRoute: ({ to }) => checkPermission(to),
}
```

## 动态注册 HookManager

经 `router.hooks` 在运行期增删全局钩子：

```ts
class HookManager {
    add<T extends keyof AutoSparkRouterHooks>(type: T, hook: AutoSparkRouterHooks[T][number]): void;
    remove<T extends keyof AutoSparkRouterHooks>(type: T, hook: AutoSparkRouterHooks[T][number]): void;
    clear<T extends keyof AutoSparkRouterHooks>(type?: T): void;
}

type AutoSparkRouterHooks = {
    beforeRoute: BeforeRouteHook[];
    afterRoute: AfterRouteHook[];
    beforeRender: BeforeRenderHook[];
    afterRender: AfterRenderHook[];
    routeError: RouteErrorHook[];
};
```

```js
const guard = ({ to }) => !!to.at(-1).route;

router.hooks.add("beforeRoute", guard);
router.hooks.remove("beforeRoute", guard);
router.hooks.clear();          // 清空全部
router.hooks.clear("beforeRoute"); // 仅清空一类
```

## 超时

`hookOptions.timeout`（毫秒）约束钩子执行；超时按失败处理（`beforeRoute` 视为不放行）。不配置则不限时。

::: warning 钩子与事件的分工
需要**改变导航流程**的逻辑（鉴权、改道、取消）用钩子；纯监听（埋点、日志、UI 联动）用[事件](./events.md)。
:::
