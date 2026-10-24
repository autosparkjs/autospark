# ADR-0122：地址插值纳入 `engine.state.$` 成员——扁平注入、路由优先

- 状态：**已采纳**（accepted，2026-10-22）
- 关联：[ADR-0004](0004-loaded-layer-skip-full-path-url.md)（hash 模板与缓存键）、
  [ADR-0013](0013-language-url-rewrite.md)（语言重写与 `$.language`）、
  engine [ADR-0105](../../../engine/docs/adr/0105-viewport-global-feature.md)（`state.$` 保留键容器）、
  engine [ADR-0112](../../../engine/docs/adr/0112-state-typed-meta-container.md)（元容器类型契约）、
  engine [ADR-0120](../../../engine/docs/adr/0120-version-render-state.md)（`$.version` 渲染元状态，无路由重载）

## 背景

视图地址与数据地址的插值统一走 `getRouteVars(matched)`，变量集只有路由自身维度（`name` / `path` / `url` / `query` / `timestamp` / `route.meta` / 参数 / 导航 `state`）。应用需要按运行时环境构造内容地址（如按 `$.viewport` 档位、`$.language`、消费者声明的 `$.tenant` 取不同文件），但 `state.$` 的成员此前不进任何插值面。

插值发生在**加载期**，而 `$.route` 快照在渲染完成后的 commit 点才写入——加载期读到的 `$.route` 是**上一次导航**的快照（首屏为 `undefined`）。

## 决策

### 决策 1：扁平键注入，路由变量优先

`state.$` 成员以**扁平键**并入既有变量池（不引入 `{$.x}` 点路径语法，`params()` 的键字符集不变）。`$` 成员位于**最底层**：`route.meta`、路由参数、导航 `state` 等路由侧同名变量一律优先；`getRouteVars` 内部既有的覆盖顺序原样不动。

### 决策 2：成员集 = 自有可枚举 + 原始值白名单，排除 `route`

取 `state.$` 的自有可枚举键中值为 `string | number | boolean` 的成员：

- 引擎预置的 `viewport` / `version` / `language` / `name` / `title` / `description` 自动入选；
- 消费者经 `declare module "autospark" { interface AutoSparkMeta { … } }` 增补的原始值成员自动入选，无需额外注册；
- 对象、函数、`null`、`undefined` 静默跳过（地址拼字符串，不执行函数、不序列化对象）；
- **`route` 键排除**——加载期它是上一导航快照，注入即是静默错误陷阱。

取不到 / 被跳过的键沿用 `params()` 的既有语义：替换为空串。

### 决策 3：取值时机 = 插值时读取，无响应式重载

每次插值（加载发起、hash 计算）现读 `engine.state.$`，不做订阅、不因成员变化自动重载。`$.language` 变更会经语言切换重入导航（ADR-0013），因此下一次加载自然取到新值；`$.viewport` 跨档不会触发任何重载——这是运行时属性通道的既有语义，非本 ADR 改变。

`router.engine` 缺失（最小测试 stub）或 `state.$` 不存在（`viewport: false` 且无人写入）时静默降级：这批变量不参与，其余变量不受影响。

### 决策 4：hash 两套插值面统一获得同一变量池

- **路由 hash**（`route.hash` → `matched.hash`，keepAlive/视图条目键 + 数据 AsyncLoader 缓存键）：`matchRoute` 是公开纯函数、不读 `engine`；运行时路径由 `router._matchRoute` 在匹配完成后以同一变量池重算 `matched.hash`。独立调用 `matchRoute` 的工具/测试不受影响（无 `$` 变量）。
- **视图 loader 缓存键**（`options.hash` / 默认 `{url}@lang`）：同一变量池。
- 默认模板与 `@当前语言` 自动后缀**原样不动**（ADR-0013 决策 6 现状保持）——`route.hash` 里显式写 `{language}` 时语言会出现两次，属已知后果，不修。

### 决策 5：常开，无配置开关

变量集只含只读原始值、撞名由路由优先兜住，无兼容性理由引入开关；新键是纯增量（原先 `{language}` 等替换为空串，现替换为真实值）。

### 决策 6：范围外

- `view.selector` 插值：内容提取不是地址，维持其 `params/query/state` 小变量池，不纳入；
- 远程子表地址与顶层 `options.routes` URL：初始化期插值，无 matched route，不纳入；
- 数据加载器 `data.hash` 选项当前未被消费（AsyncLoader 固定取 `matched.hash`，`DataLoader._getHash` 为死代码）——既有缺陷，本 ADR 不修。

## 后果

**正面**：

- 地址模板可获得运行时环境与消费者元变量，无需为每种环境拼函数式 `view`；
- 两套 hash 插值面共用一个变量池，不存在「同一张表两套变量集」的漂移；
- 原始值白名单让消费者扩展缝（模块增强）自动生效，零额外注册。

**代价 / 边界**：

- `name` / `title` 可能来自 `state.$`（路由未声明时），实际来源取决于路由表，文档须写明「路由优先、`$` 兜底」；
- 加载期 `{route}` 不可用——想取本次匹配路径请用既有扁平变量 `{path}` / `{url}`；
- `router._matchRoute` 每层导航多一次 hash 重算（同导航内覆盖，外部不可观测）；
- 独立使用 `matchRoute` 的场景不享有 `$` 变量。

## 实施落点

- `src/utils/getRouteVars.ts` —— 增可选 `metaVars` 参数，`$` 成员先展开、路由变量覆盖；
- 新增 `src/utils/getStateVars.ts` —— 从 `router.engine?.state?.$`（最小 stub 仅有 `store` 时回退 `engine.store.state.$`）提取「自有可枚举 + 原始值 + 排除 route」；
- `src/utils/getSignalHash.ts` / `src/utils/getRouteHash.ts` —— 透传 `metaVars`；
- `src/features/baseLoader.ts` / `src/features/dataLoader.ts` —— 地址插值与 `_getHash` 传入变量池；
- `src/router.ts` —— `_matchRoute` 匹配后按同一变量池重算 `matched.hash`（仅 `route` 存在的层），再追加语言后缀；
- 单测：view/data 地址插值（预置项 / 消费者增补 / 对象与函数跳过 / 路由优先 / engine 缺失降级）、两套 hash 插值、`route` 排除；
- docs：`view-loading.md`、`data-loading.md` 的 URL 插值段（修正 `{$query.page}`、`:id` 等与实现不符的过期写法）、`cache.md` 的 hash 变量表。
