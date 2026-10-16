# ADR-0010: 路由表自动发现（autoDiscoverRoutes）

- 状态：已接受（Accepted）
- 日期：2026-10-16
- 关联：ADR-0007（远程子表与路由表渐进展开——本 ADR 只扩大其收敛谓词，机制零新增）

## 背景

ADR-0007 的远程子表要求**逐节点显式声明**（`children: string | true`）。目录式托管的应用——每个业务目录一份 `routes.json`——仍要在父级声明里逐个写出 `children: true`，声明本身成为重复劳动；理想形态是零声明：启用一个选项后，每个未声明 children 的节点自动按约定探测 `{累积路径}/routes.json`。

同时存在一个必须显式取舍的张力：自动探测意味着**大量投机性请求**——大多数叶子节点将命中 404，且 SPA 静态托管（nginx `try_files $uri $uri/ /index.html` 及同类平台默认重写）对缺失文件往往返回 **200 + index.html** 而非 404。这些「阴性结果」若与真实故障同通道处理，错误事件将被噪声淹没；若一律静默，显式声明的坏 JSON 又会漏报。分级必须按「请求是投机的还是断言的」划线，而非按失败形态划线。

## 决策

### 决策 1：`options.autoDiscoverRoutes?: boolean`，默认 `false`；机制 = 扩大 `_markPending` 收敛谓词

- 默认 `false` 时行为与未引入本选项**逐字节一致**——新增网络行为默认关闭，不破坏现有应用（现有应用的叶子路由本无 `routes.json`）。
- `true` 时对每个满足探测谓词（决策 2）的节点置 `_childrenSource = true`、`children = []`、`_childrenState = "pending"`，并打内部标记 `_autoProbe` 与显式声明区分（决策 4 依赖它）。
- 展开调度（BFS 同层并行）、后台渐进不阻塞首屏、深度触顶降级（`maxChildrenDepth`，默认 10）、pending 匹配语义（未知 ≠ 无子）全部**复用 ADR-0007**；取回的子项按同一谓词递归参与探测。零新机制。

`AutoSparkRouteChildren` 类型**不变**——探测是选项驱动的运行期行为，不新增 `children` 声明形态。

### 决策 2：探测谓词——缺席 = 未知，显式空 = 明确无

探测仅命中 `children === undefined && !redirect` 的节点：

- 显式 `children: []` = 作者明确声明「无子路由」，**不探测**——这是单节点 opt-out 手段，必须保留
- `redirect` 节点**跳过**——重定向节点不渲染子视图，探测纯属浪费请求
- `view` / `modal` **不参与判定**——view 与子路由正交（布局页可既有 view 又有子路由）

### 决策 3：探测地址纯派生，无插值

复用约定子表解析（`resolveChildrenUrl` 的 `true` 形态）：累积路径 + `options.routesFile`（默认 `routes.json`）+ base 前缀。`{path:"/"}` → `{base}/routes.json`；`{path:"/", children:[{path:"a"}]}` → 探测 `{base}/a/routes.json`。地址由路径**纯派生**，不含用户模板，插值变量集不适用。

### 决策 4：阴性 / 错误分级——投机性请求与断言性请求分通道

| 来源 | 404 | 200 但非 JSON（含 SPA fallback HTML） | 网络错误 / 5xx |
|---|---|---|---|
| 自动探测（`_autoProbe`） | 静默落定 ok/空 | 静默落定 ok/空 + `logger.debug` 一条 | 降级 + `routes:error` |
| 显式声明（`children: true \| string`） | 报错（现状） | 报错（现状） | 降级 + `routes:error`（现状） |

- 自动探测是**投机性请求**：「没拿到可用的子路由声明」即为阴性结果，不区分阴性原因——404 与 index fallback HTML 同权；`logger.debug` 保住可排查性。
- 显式声明是**断言性请求**：作者断言它存在，404 与坏 JSON 均为违约，必须暴露（现状语义不变）。
- 动机：按失败形态划线（仅 404 算阴性）会在 SPA fallback 部署下刷屏 `routes:error`；按 `Content-Type` 预判则依赖服务器配置正确，静态托管环境千差万别，不可靠。

### 决策 5：缓存成功与阴性结果，不缓存其他失败

`_responseCache` 对探测类请求仅缓存**成功响应与阴性结果**（404 / 解析失败）：

- 阴性结果是确定性结果，缓存避免重复探测
- 其他失败**不缓存**——瞬时网络故障不钉死，后续重试成为可能（现状 promise 级缓存会把失败钉死到刷新；探测面大增后此问题被放大，故仅对探测类请求修正，显式声明的缓存语义不变）

### 决策 6：命名 `autoDiscoverRoutes`，不占用 `mode`、避开 `loadRemoteRoutes` 语系

- 初案 `mode: 'auto' | 'static'` **否决**：`AutoSparkRouterOptions.mode` 已被 `"hash" | "history"` 占用（`types/config.ts:99`），两义混一字段使二者无法共存。
- 次案 `remoteRoutes: boolean` **否决**：是 ADR-0007 划出的运行时 API `loadRemoteRoutes()` 的子串，两者语义无关（运行时合并 vs 初始化期探测）却近碰撞；且易误读为根表 `routes` 也变远程加载——探测只作用于 children，根表不受影响。
- 定名 `autoDiscoverRoutes`：意图级命名，读作「自动发现路由表」，对新用户零前置概念；与节点级 `children: true` 的对称性由文档承接（节点级 opt-in，选项级全局 opt-in）。

## 备选方案

- **`mode: 'auto' | 'static'`**：否——与 `mode: "hash" | "history"` 冲突（见决策 6）。
- **`remoteRoutes: boolean`**：否——`loadRemoteRoutes` 子串近碰撞 + 根表误读（见决策 6）。
- **`children: []` 也探测**：否——显式空数组是作者的明确声明，夺走单节点 opt-out 手段。
- **404 即错误**：否——auto 模式下大多数叶子命中 404，错误通道被噪声淹没。
- **仅 404 算阴性、200-HTML 走错误**：否——SPA fallback 部署下刷屏（见决策 4）。
- **按 `Content-Type` 预判 JSON**：否——静态托管 content-type 配置千差万别，不可靠（见决策 4）。
- **失败也缓存（现状推广到探测）**：否——探测面大增后瞬时故障会被钉死到刷新（见决策 5）。
- **`remoteChildren` / `discoverRoutes` / `probeRoutes` 等**：否——与 `autoDiscoverRoutes` 同为合格候选，取向差异（机制视角 vs 意图视角），评审定 `autoDiscoverRoutes`。

## 后果

- 正面：目录式托管**零声明**——每个目录放一份 `routes.json` 即长成路由树，父级无需逐个写 `children: true`；显式声明仍然可用且不被探测覆盖（有 `children` 声明的节点不探测，其子项照常递归探测）。
- 代价：启用后初始化期请求数升至节点数量级（每个 childless 节点一次探测），多数以阴性告终——这是零声明的固有代价，靠后台渐进（不阻塞首屏）与阴性缓存摊薄；探测分支的可观测性收窄（404/坏 JSON 静默，仅 `logger.debug`），排障依赖 debug 日志级别。
- 遗留：无。
