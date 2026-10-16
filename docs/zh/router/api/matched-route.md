---
title: 匹配结果
---

# 匹配结果 AutoSparkMatchedRouteItem

## 关于

导航时 URL 经路由表匹配得到**匹配链**——`AutoSparkMatchedRouteItem` 数组，从根路由到最深子路由逐层排列。匹配链贯穿钩子、事件与渲染全程，是编写守卫与钩子的核心数据结构。

```ts
type AutoSparkMatchedRouteItem = {
    /** 匹配的路由配置（未匹配层为 undefined） */
    route: AutoSparkRouteItem | undefined;
    /** 本层提取的路径参数 */
    params: Record<string, string | number>;
    /** 本层提取的查询参数 */
    query: Record<string, string>;
    /** history state（push/replace 时传入） */
    state: Record<string, any>;
    /** 目标窗口：_self 当前窗口，_blank 新窗口 */
    target?: "_self" | "_blank";
    /** 路由原始路径（保留参数占位，如 /user/:id） */
    path: string;
    /** 参数替换后的实际 URL（如 /user/123） */
    url: string;
    /** 计算后的视图哈希标识 */
    hash: string;
    /** 匹配序号 */
    id: number;
    /** 重定向链：从原始路径到当前路径的完整记录 */
    redirectFrom?: Array<{ url: string; mode: "replace" | "push" }>;
    /** 匹配/重定向过程中的错误（渲染层据此渲染错误页） */
    error?: Error;
};
```

`path` 与 `url` 的区别：`path` 是路由声明原始路径（含 `:id` 占位符），`url` 是占位符替换为实际值后的路径。

::: warning 数组语义
钩子与事件中的 `to` / `from` 均为该数组。`from` 在首次导航时为 `undefined`；数组**首项恒为根路由**，判断「真实命中」看首项之后是否存在 `route` 有值的层。取当前最深匹配用末项：

```js
const current = router.routes.current.at(-1);
```
:::

## 路由表 AutoSparkRouteTable

经 `router.routes` 访问：

```ts
class AutoSparkRouteTable {
    /** 当前匹配链（导航 commit 后更新） */
    public current?: AutoSparkMatchedRouteItem[];
    /** 归一化的路由树根节点（path 恒为 "/"，声明在 children 上） */
    root: AutoSparkRouteItem;
    /** 加载路由表（构造 attach 流程内部调用） */
    async load(): Promise<void>;
    /** 是否存在待展开的远程子表 */
    public hasPending(): boolean;
    /** 按路径匹配，返回匹配链或 null */
    public match(pathname: string): AutoSparkMatchedRouteItem[] | null;
    /** 深度优先遍历全部路由项 */
    forEach(callback: (route: AutoSparkRouteItem, parent: AutoSparkRouteItem | null) => void): void;
}
```

```js
// 当前路由信息
const matched = router.routes.current?.at(-1);
console.log(matched?.url, matched?.params);

// 遍历路由表构建菜单
router.routes.forEach((route, parent) => {
    if (route.title && !parent) console.log(route.path, route.title);
});
```

## $.route 响应式快照

导航 commit 后，router 自动把路由快照写入 engine 全局状态容器 `$.route`，模板中全局可用：

```html
<div x-text="$.route.path"></div>
<div x-show="$.route.params.id == 42">仅 /users/42 可见</div>
```

```ts
type RouteSnapshot = {
    /** 当前 pathname（不含 query） */
    path: string;
    /** pathname + search */
    fullPath: string;
    /** 各层匹配参数自浅到深合并（深层覆盖同名浅层键） */
    params: Record<string, string>;
    /** 查询参数 */
    query: Record<string, string>;
};
```

`$.route` 经 store 响应式代理写入，随导航自动更新；`viewport: false` 时由 router 兜底注入。
