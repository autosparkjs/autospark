# ADR-0013：多语言内容通道——languages 声明、getLanguageUrl 重写与 $.language 切换语义

- 状态：已接受（2026-10-19）
- 关联：[ADR-0003](0003-outlet-props-keepalive-mode.md)（keepAlive 与视图清单）、[ADR-0004](0004-loaded-layer-skip-full-path-url.md)（路由 hash 模板与缓存键）、[ADR-0007](0007-remote-children-and-route-table-expansion.md)（远程子表展开）、[ADR-0008](0008-renderer-pipeline-and-raw-channel.md)（raw 通道与 fetch 预处理）、[ADR-0010](0010-auto-discover-routes.md)（路由表自动发现）、[ADR-0011](0011-router-plugin-bootstrap.md)（插件自举、`$.route` 注入模式与模块增强先例）

## 背景

静态多语言站点需要同一套路由路径按语言取不同内容文件（`/a/x.html` ↔ `/a/x_zh-CN.html`）。router 现有加载链是纯 URL 驱动：视图与数据共享 `_loadFromRemote` 收口（剥 `!` → 参数插值 → base 前缀），路由表 fetch（`routes.json` / 远程子表）走独立通道；缓存键从 `matched.url` 派生、不含语言；engine 状态根已有 `$.route` 响应式快照先例。需要一套语言机制：声明支持语言、按语言重写内容 URL、切换语言即重载当前路由——语言清单由 engine 声明，router 消费（与插件化边界一致，ADR-0011）。

## 决策

### 决策 1：语言清单声明在 engine，运行时归 router（R1-Q1）

`AutoSparkOptions.languages?: { code; name; nativeName }[]`——engine 构造 options 声明支持语言，**非空即启用**多语言，经挂载矩阵传递为 `AutoSparkRouterOptions.languages`；空/缺省 = 不启用：钩子整体忽略、`$.language` 不注入。`name`/`nativeName` 是语言切换 UI 的元数据，运行时不消费。类型面循模块增强惯例（ADR-0011 对 `routes` 的先例）合并进 `AutoSparkOptions`。不设 `setLanguage` 门面——`$.language` 直接赋值是唯一公开入口（R2-Q13）。

### 决策 2：单钩子 + type 分流，路由表参与重写（R1-Q2/R3-Q17）

`AutoSparkRouterOptions.getLanguageUrl?: (language, url, type: 'view' | 'data' | 'routes') => string | null | undefined`——单钩子按通道分流，评审中段的 `getViewLanguageUrl` / `getDataLanguageUrl` 双钩子方案废弃。**默认矩阵（未提供钩子）**：view 与 routes 走内置文件名后缀规则，data 不重写（API 语言语义交开发者）；**提供钩子 = 三通道完全接管**（默认语言豁免不再强制），钩子内自行按 `type` 分流；**返回 `null`/`undefined` = 该次不重写、用原 URL**（回退原 URL，而非回退内置规则）。

### 决策 3：内置后缀规则与默认语言豁免（R1-Q4/R3-Q15）

默认规则仅作用于 view/routes 两通道：`languages[0]` 为默认语言、**免重写**；其余语言在末段扩展名前插 `_${code}`（`x.html → x_zh-CN.html`；无扩展名末段同插 `/a/x → /a/x_zh-CN`）；query/hash 原样保留在末尾；根路径与目录形 URL 不重写。`code` 为**标准 BCP 47 连字符风格**（`zh-CN`），后缀**原样使用**、无 `-`→`_` 转换魔法。路由路径语言无关是硬约束——本地化路由表仅 title 等元数据可变，路径级 i18n（`/en/products`）不在范围。

### 决策 4：$.language 恒为具体 code，auto 即解析（R1-Q5/R3-Q16）

`store.state.$.language` 恒为语言清单中的具体 code（完整 BCP 47 连字符），类型循 augment 模式扩展（同 `$.route` 先例，ADR-0011）。`'auto'` 仅是输入值：router 启动时**先解析再写入**——早于路由表加载（本地化 `routes.json` 首次 fetch 即需语言）；重新赋值 `'auto'` 触发再解析。解析三级匹配：① tag 全等（大小写与 `-`/`_` 归一）→ ② 主语言子标签相同（navigator `zh-HK` 命中配置 `zh-CN`）→ ③ 回退 `languages[0]`；配置纯语言 tag（`zh`）与完整 tag（`zh-CN`）均合法。

### 决策 5：切换 = 完整导航管线重入，不写历史（R1-Q6/R2-Q10）

`store.watch` 监听 `$.language` 赋值，触发对当前 `fullPath` 的**完整导航管线重入**——guards、`navigation/start` 等事件、渲染链全按既有语义重跑；经内部放行标记绕过 `onRouteUpdate` 的同 URL 去重短路（`_currentNavUrl === targetUrl`）；**不写 history、地址栏不变**。接受语义边界：刷新页面回到初始语言（auto 则回浏览器语言）。启动期首次解析早于首次导航，天然不触发重载。

### 决策 6：语言并入默认 hash 模板，缓存自动隔离（R1-Q7/R2-Q14）

loader 默认 hash 模板并入已解析语言（`{url}` → 含语言分量）——数据缓存与 keepAlive（条目粒度唯一裁决者即 `view.hash`，与 loader hash 同源，ADR-0003/0004）**自动按语言隔离**，零额外机制。自定义 `options.hash` 的应用文档提示自行纳入语言。

### 决策 7：重写时机——插值后、base 前缀前（R2-Q12）

语言重写插在 `_loadFromRemote` 既有顺序的参数插值之后、base 前缀之前——钩子与默认规则看到的是**已插值的具体 URL**；`!` raw 通道同样参与重写（剥前缀后仍是内容请求）。

### 决策 8：范围外与顺带项（R1-Q8/R2-Q9）

`document.documentElement.lang` 随 `$.language` 更新（含启动解析）；localStorage 持久化与 `<link rel=alternate hreflang>` **规划中**，不实现。

## 后果

**正面**：

- 内容多语言零路由表改动：同一路径表复用于所有语言，本地化落点收敛到内容 URL 一处；
- 单收口 + 单钩子：view/data 共享 `_loadFromRemote`，路由表两处 fetch 补齐，重写点穷尽；
- 缓存与 keepAlive 隔离随 hash 并入语言免费获得。

**代价 / 边界**：

- 地址栏不含语言信号：刷新回初始语言、外链无语言指向——静态多语言站的既有文件布局（默认语言无后缀）仍承担可寻址性；
- 远程子表按语言化 URL 请求，子表缓存（URL 键）天然按语言隔离，重复展开以新语言覆盖元数据；
- 提供钩子后 data/routes 的默认规则不再兜底——完全接管是刻意设计，`null` 语义是唯一逃生口。

## 实施落点

- `src/types/config.ts`——`AutoSparkRouterOptions` 增 `languages` / `getLanguageUrl`；`src/types/augment.ts`——`state.$.language` 类型扩展与 `AutoSparkOptions.languages` 模块增强；
- `src/features/language.ts`（新增）——语言清单传递、auto 三级解析、内置后缀规则、重写调度（按 type）、`$.language` 注入与 watch；
- `src/features/baseLoader.ts`——`_loadFromRemote` 插值后重写点、`_getHash` 默认模板并入语言；
- `src/features/routes.ts`——路由表与远程子表两处 fetch 纳入 `type: 'routes'` 重写；
- `src/router.ts`——同 URL 去重放行标记、`document.documentElement.lang` 跟随；
- 单测：默认规则矩阵 / 三级匹配 / 切换重载与放行 / 缓存·keepAlive 隔离 / 钩子接管与 null 语义 / routes 通道；
- docs：指南（多语言）+ API 参考（options 字段）。
