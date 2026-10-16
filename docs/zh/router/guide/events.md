---
title: 事件
---

# 事件

## 关于

router 内置事件总线（基于 mitt）：导航、路由表、渲染、数据/视图加载、模态的全生命周期都会发出事件。事件是**只读观察点**——埋点、日志、联动 UI 等纯监听逻辑在此挂接；需要改变导航流程的逻辑请用守卫（[路由守卫](./guards.md)）。

```js
router.on("navigation:end", (location) => { /* ... */ });
router.off("navigation:end", handler);
```

::: warning 事件不经 DOM 派发
事件走 router 实例的 mitt 总线（`router.on`），**不是** DOM 事件——在宿主元素上 `addEventListener("navigation:start", ...)` 监听不到任何东西。
:::

## 指南

### 导航事件

```js
router.on("navigation:start", (location) => {
    console.log("导航开始", location.pathname);
});
router.on("navigation:cancel", (location) => {
    console.log("导航被取消", location.pathname); // 守卫拦截 / 新导航打断旧导航
});
router.on("navigation:matched", ({ fromRoute, toRoute }) => {
    // 匹配完成：fromRoute 首次导航为 undefined
    console.log("匹配结果", toRoute.map((m) => m.path));
});
router.on("navigation:end", (location) => {
    console.log("导航完成", location.pathname);
});
```

`location` 为 history 库的 `Update` 对象（含 `pathname`、`search`、`state` 等）。

### 路由表事件

| 事件 | 载荷 | 说明 |
| --- | --- | --- |
| `routes:loaded` | — | 路由表**骨架**就绪（远程子表仍在后台展开，首屏可渲染） |
| `routes:attached` | — | 路由表挂载到 DOM 元素 |
| `routes:expanded` | — | 全部远程子表展开完成（成功与失败降级均算） |
| `routes:error` | `{ url?, path, error }` | 单个远程子表展开失败/深度触顶——该节点局部降级，其余部分照常可用 |

详见[远程路由](./remote-routes.md)。

### 渲染事件

```js
router.on("render:before", ({ route }) => {
    // route：目标匹配数组，渲染前最后时机
});
router.on("render:after", ({ route, error, slot }) => {
    // error 存在表示渲染失败；slot 为渲染槽引用
});
```

### 数据与视图事件

```js
router.on("data:loading", ({ route }) => {});
router.on("data:loaded", ({ route }) => {});
router.on("data:error", ({ route, error }) => {});

router.on("view:loading", ({ route }) => {});
router.on("view:loaded", ({ route }) => {});
router.on("view:error", ({ route }) => {});
```

载荷中的 `route` 是触发加载的**路由项声明**（非匹配项）。

### 模态事件

```js
router.on("modal:open", ({ route, stackItem }) => {
    console.log("模态打开", route.path, "当前栈深", stackItem.timestamp);
});
router.on("modal:close", ({ route, stackItem }) => {});
```

### 钩子错误

```js
router.on("hook:error", (route) => {
    // 某个钩子执行抛错时发出（钩子默认容错继续，不会中断导航）
});
```

### 一次性监听与通配

mitt 总线支持 `on` / `off` / `clear`；配合自行包装可实现一次性监听：

```js
function once(event, handler) {
    const wrap = (...args) => {
        router.off(event, wrap);
        handler(...args);
    };
    router.on(event, wrap);
    return wrap;
}

once("routes:expanded", () => renderFullMenu());
```
