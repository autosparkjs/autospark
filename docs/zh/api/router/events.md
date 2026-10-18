---
title: 事件
---

# 事件 API

## 关于

router 事件走实例内置的 mitt 总线（**非 DOM 事件**），本页给出总线 API 与全部事件清单。监听场景与示例见[指南 · 事件](../guide/events.md)。

## 总线 API

```ts
// 订阅，返回取消订阅函数
router.on(event, handler): () => void;

// 一次性订阅，同样返回取消订阅函数
router.once(event, handler): () => void;

// 取消订阅
router.off(event, handler): void;
```

```js
const off = router.on("navigation:end", (loc) => console.log(loc.pathname));
off(); // 直接调用返回值即取消

router.once("routes:expanded", () => console.log("子表展开完成"));
router.off("navigation:end", handler);
```

`location` 载荷为 history 库的 `Update` 对象（含 `pathname`、`search`、`state` 等）。

## 事件清单

### 导航事件

| 事件 | 载荷 | 说明 |
| --- | --- | --- |
| `navigation:start` | `NavigationLocation` | 导航开始 |
| `navigation:cancel` | `NavigationLocation` | 导航被取消（守卫拦截 / 新导航打断旧导航） |
| `navigation:matched` | `{ fromRoute, toRoute }` | 匹配完成；`fromRoute` 首次导航为 `undefined` |
| `navigation:end` | `NavigationLocation` | 导航完成 |

### 路由表事件

| 事件 | 载荷 | 说明 |
| --- | --- | --- |
| `routes:loaded` | — | 路由表**骨架**就绪（远程子表仍在后台展开，首屏可渲染） |
| `routes:attached` | — | 路由表挂载到 DOM 元素 |
| `routes:expanded` | — | 全部远程子表展开完成（成功与失败降级均算） |
| `routes:error` | `{ url?, path, error }` | 单个远程子表展开失败/深度触顶——该节点局部降级，其余部分照常可用 |

### 渲染事件

| 事件 | 载荷 | 说明 |
| --- | --- | --- |
| `render:before` | `{ route }` | 渲染前（`route` 为目标匹配数组） |
| `render:after` | `{ route, error?, slot? }` | 渲染后；`error` 存在表示渲染失败，`slot` 为渲染槽引用 |

### 数据与视图加载事件

| 事件 | 载荷 | 说明 |
| --- | --- | --- |
| `data:loading` | `{ route }` | 数据开始加载 |
| `data:loaded` | `{ route }` | 数据加载完成 |
| `data:error` | `{ route, error }` | 数据加载失败 |
| `view:loading` | `{ route }` | 视图开始加载 |
| `view:loaded` | `{ route }` | 视图加载完成 |
| `view:error` | `{ route }` | 视图加载失败 |

### 模态与钩子事件

| 事件 | 载荷 | 说明 |
| --- | --- | --- |
| `modal:open` | `{ route, stackItem }` | 模态打开 |
| `modal:close` | `{ route, stackItem }` | 模态关闭 |
| `hook:error` | `AutoSparkRouteItem` | 钩子执行出错 |
