---
title: API 参考
---

# API 参考

## 关于

本章节是 `@autospark/router` 的完整 API 手册，内容手写整理并与源码实现逐项对照。类型签名以 TypeScript 代码块呈现，行为语义以字段表与说明补充。

router 不再导出独立的运行时类构造入口（`AutoSparkRouter` 仅作为类型导出）——路由的启用统一走 [AutoSpark 构造函数第三参](#启用方式)（ADR-0011 插件自举）。

## 获取 router 实例

router 挂载后会把实例写到宿主元素的 `router` 属性上，业务代码统一经此访问：

```js
const router = document.querySelector("#app").router;

router.push("/users/42");
router.back();
```

## 启用方式

`new AutoSpark(host, vars, routerOptions)` 的第三个参数即路由配置，共三种启用形态：

```js
import AutoSpark from "autospark";
import "autospark/router"; // 引入即完成插件自举

// 形态一：全自动模式——自动 fetch <base>/routes.json 作为整站路由表
const app = new AutoSpark("#app", {}, { autoDiscoverRoutes: true });

// 形态二：显式路由表——数组形态
const app2 = new AutoSpark("#app", {}, [
  { path: "/", view: "/views/home.html" },
]);

// 形态二（续）：显式路由表——完整配置对象形态（数组 + 其余 AutoSparkRouterOptions 字段）
const app3 = new AutoSpark("#app", {}, {
  routes: [{ path: "/", view: "/views/home.html" }],
  mode: "hash",
  home: "/",
});

// 形态三：显式禁用——routes: false 压过所有其他配置，不挂载路由
const app4 = new AutoSpark("#app", {}, { routes: false });
```

挂载判定：仅当配置中存在 `routes` 键或 `autoDiscoverRoutes: true` 时挂载路由；两者皆无则静默不挂载。

全自动模式失败兜底：`routes.json` 拉取失败时使用壳表 `[{ path: "/" }]` 并输出 `warn`。

## 类型总览

核心类型与页面的对应关系：

| 类型 / API | 说明 | 页面 |
| --- | --- | --- |
| `AutoSparkRouterOptions` | 路由器全局配置 | [路由器配置](./options.md) |
| `AutoSparkRouteItem` | 路由项声明 | [路由项](./route-item.md) |
| `AutoSparkRoutes` / `AutoSparkRouteChildren` | 路由表与子路由形态 | [路由项](./route-item.md) |
| `AutoSparkMatchedRouteItem` | 匹配结果（`routes.current` 的元素） | [匹配结果](./matched-route.md) |
| `RedirectTarget` / `RedirectFunction` | 重定向目标类型 | [路由项](./route-item.md) |
| 五类钩子签名 / `HookManager` | 导航与渲染钩子 | [钩子](./hooks.md) |
| `AutoSparkRouterEvents` | 事件清单（mitt 总线） | [事件](./events.md) |
| `AutoSparkRouteDataSource` / `DataOptions` | 数据预加载 | [数据源](./data.md) |
| `ModalConfig` / `ModalOptions` | 模态路由 | [实例](./instance.md) |
| `auto-link` 等内置自定义元素 | 声明式导航与反馈 UI | [内置元素](./components.md) |
| `ViewRendererBase` / 内置渲染器类 | 视图渲染器 | [渲染器](./renderers.md) |

## 常用入口速查

```js
const router = document.querySelector("#app").router;

// 导航
router.push("/detail?id=1");      // 入 history 栈
router.replace("/detail");         // 替换当前记录
router.back();                     // 有模态时先关模态

// 当前状态（数组，取末项为最深匹配）
router.routes.current.at(-1);

// 监听事件（mitt 总线，非 DOM 事件）
const off = router.on("navigation:end", (loc) => console.log(loc.pathname));
off(); // 返回值即取消订阅函数
```
