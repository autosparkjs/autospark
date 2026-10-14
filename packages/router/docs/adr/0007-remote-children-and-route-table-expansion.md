# ADR-0007: 远程子表与路由表渐进展开

- 状态：已接受（Accepted）
- 日期：2026-10-14
- 关联：ADR-0006（入口文档导航——base 缺省链被本 ADR 的地址解析复用）、ADR-0005（出口回退与激活前提——重匹配纠正渲染不得绕过它）、ADR-0004（matched.url 完整路径语义）

## 背景

路由表此前只能通过 `options.routes` 一次性静态声明（`AutoSparkRouteTable.load()` 仅在 attach 时执行一次，`features/routes.ts:45-61`），顶层虽已支持传 URL 或函数取**整表**，但没有任何「按子树分发」的能力——大型应用的路由声明只能集中在一个文件里，无法按业务域拆开托管。

同时存在一个根本张力：**路由表完整性**要求 attach 时表必须长全（否则 deep-link 直开会被误判 unmatched），但**首屏速度**要求 home 的匹配与渲染不被任何远程请求拖住。二者不可兼得，必须显式取舍。

## 决策

### 决策 1：`children` 增加 `string` 与 `true` 两种形态，不做对象/函数形态

`children?: AutoSparkRouteItem[] | string | true`：

- `string` = **远程子表**（Remote Children）——远程地址
- `true` = **约定子表**（Convention Children）——等价于 `children: options.routesFile`，默认 `"routes.json"`

刻意**不**引入 `{ from, base, timeout }` 对象形态（尽管 `view`/`data` 是双形态惯例），也**不**引入函数形态：每多一个形态递归加载器就多一条分支，而 base/timeout 由 `options.base` 与既有 `timeout` 链覆盖，函数形态顶层 `options.routes` 已有。`children: true` 与字符串走**完全同一套**解析，无特殊分支。

### 决策 2：地址解析三级，绝对路径亦参与插值

| 形态 | 示例 | base | 祖先路由路径 |
|---|---|---|---|
| 含协议 | `http://…`、`https://…`、`//host/…` | 不拼 | 不拼 |
| `/` 开头 | `/shared/a.json` | **拼** | 不拼 |
| 其他 | `a.json`、`sub/a.json` | 拼 | **拼** |

「绝对路径」只意味着**不继承父路由的位置**，不意味着逃出部署根——所以 `/` 开头仍拼 `base`（ADR-0006 的 base 缺省链：显式 `options.base` > `<base href>` > URL 推断）。

插值变量集**封闭**为 `{path}`（祖先+自身的完整路由路径）、`{name}`、`{meta.*}`、`{timestamp}`，**绝对路径亦参与插值**；明确**不提供** `{params.*}` `{query.*}` `{url}` `{state.*}`——插值发生在初始化期，那时没有 matched route，运行时变量无从取值。封闭而非「取不到退化为空串」，是为了避免用户写出 `{params.id}` 后静默拿到空 URL。

### 决策 3：后台渐进展开，不阻塞首屏；待展开是独立状态

远程子表**不**阻塞 attach 与初始导航——分层逐层并发（BFS，同层全部并行 fetch、全部 settle 后进下一层），全程后台。为此必须能区分「该节点无子路由」与「该节点子路由还在路上」，故引入三态 `_childrenState: "pending" | "ok" | "error"`（扩展既有「加载状态标记」词条），并保留原始声明于 `_childrenSource`。

首屏与运行时的两处纠正动作统称**重匹配（Re-match）**，均不产生新历史条目：

- **attach 初始导航**：先用骨架匹配当前 URL，matched 立即渲染（home 场景零等待）；**仅 unmatched 时**等展开完成再判一次
- **运行时导航**撞上 pending 节点：挂起等待该分支展开，期间走既有 loading 机制，失败/超时则按降级后的表判定

等待与 fetch 的上限沿用既有 `timeout` 来源链（路由项 `timeout` → `options.routeOptions.timeout`），**不新增配置项**。fetch 带超时信号但**不接导航取消信号**——子表是表结构的一部分，用户点快了就掐断会让路由表永久缺一块。

### 决策 4：装配方式 = 骨架归一化 + 局部归一化后就地挂载

`normalizeRoutes` 对字符串 children 会按字符 `for...of` 遍历（`normalizeRoutes.ts:139-143`），故远程解析必须绕开它。装配定为：

1. 骨架先 `normalizeRoutes`，pending 节点 `children: []`
2. 每层展开结果**先单独跑一次 `normalizeRoutes`**（使远程子项也能写扁平 path 如 `a/b/c`），取 `.children` **就地 push** 进父节点

就地挂载而非重新归一化整棵树，是因为 `treeToArray` 浅拷贝路由项（`{...routeWithoutChildren}`），重跑会**换掉对象身份**，令首屏已渲染的 `el` / `_getView` / `_dataLoadState` 全部断裂。

远程返回项与本层已有静态子项 path 冲突时，**远程覆盖静态**，与 `normalizeRoutes` 既有「后者覆盖前者」（`:131`）方向一致。返回项的 `path` **相对本节点**，响应接受数组或单个对象。

每批展开结果挂载前补跑 `_applyRouteOptions`：写入 `namedRouteItems`、下发 `routeOptions` 缺省值——否则远程子项既不能被按 name 跳转、也不继承全局缺省，不成其为一等公民。

### 决策 5：失败局部降级，非致命

单个子表 fetch 失败/超时/响应非法 → 该节点 `children: []` + `_childrenState: "error"` + 发 `routes:error`（载荷 `{url, path, error}`），表其余部分照常可用。「完整性重要」指的是**成功路径下最终必须得到完整路由树**，不是失败即致命——单个 404 让整个应用白屏，代价与收益不对称。

事件语义：`routes:loaded` **保持既有语义**= 骨架就绪（attach 链路依赖它，不改时序）；新增 `routes:expanded` = 全部展开完成（含失败明细）。

### 决策 6：只做深度上限，不做循环检测

循环引用（子表的子项又指回祖先）会使 URL 因拼祖先路径而无限增长，**无法**靠「同一 URL 去重」捕获。但本次只加 `options.maxChildrenDepth`（默认 10）作为兜底：触顶即降级 + error + `console.warn`。

不做循环检测是刻意的：URL 去重集合若按全局会误伤「同一 URL 被两个分支合法引用」，按祖先链则实现成本显著，而深度上限已能把最坏情况界定为「深度 10」而非「无限」。同一 URL 被多处引用时，fetch 响应按 URL 缓存、每个挂载点**深拷贝**为独立路由项对象（避免 `el`/`_getView`/`_dataLoadState` 被两处共享）。

### 决策 7（边界）：不做运行时路由表变更

`features/routes.ts:6-7` 头注释与 `router.dynamic.test.ts`、`router.remote.test.ts` 已按 `addRoute` / `removeRoute` / `loadRemoteRoutes` 写好测试，但本次**不实现**——运行时增删改要连带处理 `routes.current`、`namedRouteItems`、已渲染视图与出口的失效，是独立议题。相关测试标 `skip` 并注明待办，不留红。

## 备选方案

- **attach 阻塞等全部子表就位**：否——首屏白屏时间随子表数量线性增长，home 场景也一并被拖住。改为「unmatched 才等」后，home 零等待、deep-link 只付出自己那条链的代价。
- **完全不等、展开后统一重匹配**：否——deep-link 用户会先看到空白/404 再跳变，UX 最差。
- **按需等匹配链（改 `matchRoute` 递归语义）**：否——更精确，但要改 `utils/matchRoute.ts:789` 的递归结构，成本显著高于「unmatched 才等」，收益仅为消除一次整体等待。
- **先全展开再一次归一化**：否——首屏需要骨架 → 势必要归一化两次 → 第二次换掉全部路由项对象身份，首屏运行时状态断裂（见决策 4）。
- **运行时导航撞 pending 立即判 unmatched**：否——首屏后立刻点击会随机失败。
- **fetch 接导航取消信号**：否——用户点快了会让路由表永久缺一块，与完整性目标相反。
- **`{params.*}` 等运行时变量参与插值**、**对象形态 `{from}`**、**函数形态**：均否——见决策 1、2，属 YAGNI。

## 后果

- 正面：路由声明可按业务域拆分托管（子树独立分发）；home 首屏不被任何远程请求阻塞；deep-link 直开正确性由「unmatched 才等 + 重匹配」保证；单个子表故障可诊断（`routes:error` + error 状态）且不致命。
- 代价：deep-link 直开在表未展开时有一次等待（上限为 `timeout`）；展开过程中路由表处于「不完整但可用」状态，依赖 `_childrenState` 的正确传播；远程子表带来额外的初始化期网络请求。
- 遗留：运行时路由表增删改（`addRoute` / `removeRoute` / `loadRemoteRoutes`）未实现，测试已 skip 待办；循环引用无专门检测，仅由深度上限界定。
