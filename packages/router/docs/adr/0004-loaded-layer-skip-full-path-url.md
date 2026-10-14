# ADR-0004: 加载域公共层跳过与 url 完整路径语义

- 状态：已接受（Accepted）
- 日期：2026-10-14
- 关联：ADR-0002（engine 渲染管线）、ADR-0003（outlet props / keepAlive 默认翻转）

## 背景

嵌套路由 `/products` → `/products/tablets` 导航时，匹配链 `[根, products, :category]` 中的公共层（products）的 data 与 view 每次都重新发起网络请求（仅靠浏览器 HTTP 缓存兜底 304）。排查确认三个事实：

1. 加载器对匹配链**全层**发起加载（`router.onRouteUpdate` → `loadDatas/loadViews(toRoute)`），渲染层的公共路由跳过（`_getCommonRouteIndex`）只作用于渲染，不作用于加载；
2. loader 缓存（`cache` TTL）默认 0（禁用），应用未显式配置时无框架层拦截；
3. `matched.url` 的实现只含 pathname——构造期 `parseQueryString` 剥离 query 后仅按路径段拼接——与变量表注释宣称的「当前完整路径」语义背离，导致路由 hash（默认 `"{url}"` 模板）不含 query。

## 决策

### 决策 1：加载域公共层跳过（loaded-layer skip）

导航时先按渲染域同算法（`_getCommonRouteIndex`，判定键 `matched.url` 逐层序列相等）计算公共层数，传给两个加载器：`i < fromIndex` 且该通道加载成功过的层**跳过加载**，复用既有 signal（渲染层照常取用）；`i >= fromIndex` 的新增层无条件加载。

跳过的前提是「加载成功」：路由项上按通道挂载状态标记 `_viewLoadState` / `_dataLoadState`（`"ok" | "error"`），由 loader 的成功/失败落账点统一写入（ViewLoader 在 `onLoadSuccess`/`onLoadError`，DataLoader 在 `_loadRoute` 的 try/catch）。**失败层（`"error"` 或未标记）即使公共也重新加载**——不冻结错误态。导航取消（AbortError）不写标记。

### 决策 2：跳过的会话边界 = 应用生命周期

状态标记挂在**持久路由表项**（`AutoSparkRouteItem`，normalizeRoutes 产物）上而非每次导航重建的 matched 项——边界即路由表生命周期：离开分支再回来照样跳过，页面刷新重置。与 keepAlive 复用 DOM 的应用级边界对齐。会话内不自动刷新公共层数据；时效需求走显式 `cache`（TTL）或数据源函数，框架不另设刷新 API（YAGNI）。

### 决策 3：`matched.url` 修复为完整路径（pathname + search）

实现兑现术语注释的「当前完整路径」语义：matchRoute 出口对全部层统一追加原始 search 串（保真传递，顺序/编码不重建；redirect 递归的内层结果已带目标自身 search，`includes("?")` 防重复追加），并对 `route` 存在的层重建 `matched.hash`。unmatched 项 hash 为降级标识（`unmatched-<path>`），保持原样。

三处消费自动联动：公共层判定（决策 1）、路由 hash（决策 4）、tabs 页签回跳 URL（顺带修复页签 `router.push(tab.url)` 丢 query 的问题）。

### 决策 4：视图缓存粒度的唯一裁决者是 `matched.hash`

视图清单条目、keepAlive 复用判定、tabs 页签的粒度全部由 `matched.hash` 决定（`route.hash` 模板可配，默认 `"{url}"`）。`url` 修复含 search 后，默认模板随之含 query——**渲染域自动跟上加载域**：query 变化 → 该层重新加载 + hash 变化 → 新视图条目（tabs 模式即新页签）。若 hash 不含 query 而加载判定含，query 变化会重载数据但 keepAlive 复用旧视图（同 hash 命中 `isReuse` 只激活不更新）——新数据永不渲染的黑洞。开发者可覆盖 `route.hash` 模板自定义粒度；覆盖成不含 query 的模板即自担上述黑洞后果（文档警示，框架不做守护）。

### 决策 5：loader 缓存默认值不翻转

`cache` 保持默认 0（禁用），本机制只解决「会话内已加载层不重复请求」，不引入全局 TTL 缓存——与 ADR-0003「默认翻转：路由与出口均未声明时不缓存」方向一致。需要 TTL 语义的应用显式配置 `viewOptions.cache` / `dataOptions.cache`（`hitCache` 既有机制）。

### 决策 6：loader 缓存键默认模板 `"{path}"` → `"{url}"`

`baseLoader._getHash` 原默认 `"{path}"` 是**模式路径**（如 `/products/:category`，不含参数值），参数不同的层会坍缩为同一缓存键；改用 `matched.url`（实际完整路径）。显式配置 `hash` 模板的应用不受影响。

## 备选方案

- **loader 缓存默认开启（TTL 语义）**：否——默认值变更波及所有应用，且与 ADR-0003 默认不缓存方向矛盾；TTL 命中与导航来源无关，直达/刷新也命中，语义过宽。
- **仅改加载判定、hash 不动**：否——决策 4 的数据黑洞。
- **同 hash 比对内容变化强制刷新**：否——击穿 keepAlive「运行态保留」核心承诺；query 驱动的页面状态（如 `?tab=2`）保留旧 DOM 状态无意义。

## 后果

- 正面：SPA 内导航只对新增层发起请求；页签回跳不再丢 query；缓存键不再按模式路径坍缩。
- 代价：公共层数据会话内不自动刷新（时效需求显式配置）；query 变化产生独立视图条目（tabs 页签按 query 细分——URL 唯一真相源语义下的正确行为）；直达/刷新首载不受益（无 fromRoute）。
- `matched.url` 的全部消费方（页签元数据、hash、公共判定）按完整路径语义运行，术语表同步修正。
