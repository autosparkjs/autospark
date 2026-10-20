# ADR-0121：`auto-link` 链接激活态（active 类）

- **状态**：Accepted
- **日期**：2026-10-20
- **关联**：[CONTEXT.md](../../CONTEXT.md)（链接激活态 / auto-link / 路由快照）、[ADR-0009](0009-plain-anchor-interception-and-auto-link.md)（auto-link 组件定位）、[ADR-0011](0011-router-plugin-bootstrap.md)（路由快照 `$.route`）

## 背景

导航高亮是路由链接的最高频伴生需求：侧边栏、面包屑、tab 条都要求「当前所在页对应的链接亮起来」。业界路由器（vue-router `router-link-active`、react-router `NavLink`）均内建此能力，而 `auto-link` 此前没有任何激活态表达，应用只能自行监听导航写类，模板啰嗦且容易漏掉初始态。

## 决策

1. **默认开启**：所有 `auto-link` 自动参与激活态判定，无需声明任何属性。当链接 `to` 与当前 `$.route.path` 匹配时，宿主元素自动添加 `active` 类，失配时移除；经 `classList` 增删单个 token，不触碰用户既有类名。与 React/Vue Router 的默认行为对齐——「自动」正是组件便捷层定位（ADR-0009）的延伸。

2. **匹配语义：段边界前缀**。双方规范化后比较（去尾斜杠、不分大小写，复用 D-07/D-08 语义）；query 与 hash 一律忽略、只比较 path 部分。精确命中：`to` === 当前 path；前缀命中：当前 path 以 `to` 为前缀且按 `/` 段对齐（`/guide` 命中 `/guide/foo`，不命中 `/guides`）。特例：`to="/"` 仅在根路径精确命中、不做前缀——否则首页链接恒亮。父级与子级链接可同时 active，符合导航树惯例。

3. **类挂宿主元素**：`active` 加在 `auto-link` 宿主上而非内层 `<a>`——宿主承载整条链接的语义区块，样式可覆盖链接之外的高亮区域（`auto-link.active a` 或 `auto-link.active` 均可写）。`aria-current="page"` 则落在内层 `<a>`（真实链接元素）上，且**仅精确命中时设置**——前缀命中的父级链接并非当前页，屏幕阅读器不应播报为当前页。

4. **翻转时机跟随 `$.route` 写入**：导航 commit（路由快照写入后）才切换类与 aria，数据加载期间旧页高亮保持。`active` 类定义为 `$.route` 匹配的镜像，不存在中间态；响应源用 router 已验证的 mitt 事件链路 + 挂载/router 就绪时初评，不走 store.watch（真实浏览器响应式链路未覆盖，见 ADR-0120 教训）。

5. **范围仅 `auto-link`**：plain `<a>` 拦截路径不获得此能力——组件有宿主元素承载生命周期与类同步，plain `<a>` 是用户自己的 DOM，库不改写。外部链接、无 `href`、危险协议的 auto-link 永不参与判定。

## 后果

- 应用导航无需任何改造即获得高亮：`auto-link.active a { ... }` 即可用；已发布应用 DOM 会多出 `active` 类（默认开启的破坏面，与 React Router NavLink 一致）。
- 匹配与 `to` 中的 query/hash 无关：`to="/items?tab=a"` 在 `/items?tab=b` 下同样 active；tab 级高亮交给模板侧 `$.route.query` 自行控制。
- 组件持有事件订阅，`disconnectedCallback` 必须清理；`to` 属性变更时同步重评。
- 类名固定 `active`、不提供 `active-class` 自定义属性——真有需求时加属性是非破坏性扩展（YAGNI）。
