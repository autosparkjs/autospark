# ADR-0011：router 插件化——以 AutoSpark 插件形态挂载

- 状态：已接受（2026-10-16）
- 关联：**修订 ADR-0010**（启用入口由 `createRouter` 工厂改为 engine 构造 options 声明，挂载判定收敛为挂载矩阵）；依赖 engine **ADR-0114**（预加载队列，双路径自举的载体）与 **ADR-0116**（precompile 钩子 + drain 前移，首编译前 DOM 预处理的通路）

## 背景

ADR-0010 的启用形态是独立入口 `createRouter(host, options)`：应用手动走「建 engine → 注入 → createRouter → attach」四步。这条入口带来三个维持成本：

- **独立 API 面**：工厂函数 + `AutoSparkRouter` 类运行时导出 + 完整 options 形态判定，全都要在包入口维护；
- **自建兜底路径**：engine 缺省时 router 经 `window.AutoSparkSpaces.AutoSpark` 运行时探测自建 engine（ADR-0002 产物零耦合契约的遗留形态），engineHost 需同时维护「注入 / 自建」两个分支与 `RouterEngineBinding.owned` 归属标记；
- **手动装配的心智**：顺序错了（router 先于 engine 构造）或漏了 attach 都是运行时才暴露的问题。

engine 侧的插件机制（ADR-0111 插件命名空间、ADR-0114 预加载队列、ADR-0116 precompile 钩子）成熟后，router 可以完全以插件形态自举：**模块加载即注册，engine 构造期按 options 自动挂载**——启用声明收敛到 engine options 一处，加载顺序不再是契约。

## 决策

### 决策 1：启用入口 = engine 构造 options 声明（挂载矩阵）

router 的 ready 回调 sniff `engine.options` 判定是否挂载，**engine 零核心改动**（不感知 router 存在）：

| engine options | 行为 |
|----------------|------|
| `routes: false` | 显式禁用，压过一切（含 `autoDiscoverRoutes: true`） |
| `routes` 有值（数组 / 单项 / 字符串 URL / 完整配置对象——判据 `"routes" in routes`） | 挂载该表；`autoDiscoverRoutes` 不触发（完整对象形态自身的键原样采用，engine 级 `autoDiscoverRoutes` 剥除不透传） |
| 无 `routes` + `autoDiscoverRoutes: true` | 挂默认壳表 `[{path:"/"}]` + 整表发现——壳表单根节点无 children 声明，命中 ADR-0010 的探测谓词，探测 `{base}/routes.json` 即整棵路由表，router 侧零新增机制 |
| 都没有 | 静默不挂载（纯 engine 应用零影响） |

### 决策 2：删除面（Q13a）

- `createRouter` 工厂删除；
- 包入口的 `AutoSparkRouter` 改**类型导出**（运行时挂载经插件自举；`src/router.ts` 的类保留——注入构造 `new AutoSparkRouter(host, { engine, routes })` 对直接装配场景仍可用，但不再是文档化入口）；
- engineHost 重写为**仅注入模式**：`options.engine` 缺失即抛错；`window.AutoSparkSpaces` 运行时探测自建分支删除；`RouterEngineBinding.owned` 字段删除。

### 决策 3：双路径自举（ADR-0114）

`bootstrapRouterPlugin()` 在包入口模块加载期执行一次：

- `window.AutoSpark` 已存在（引擎脚本先加载）→ 直接经类静态 `AutoSpark.precompile` / `AutoSpark.ready` 注册；
- 否则（IIFE 先于引擎加载 / ESM 无全局）→ 包成插件体推入 `globalThis.__AUTOSPARK_PLUGINS__` 预加载队列；首个 engine 构造**开头** drain 执行（ADR-0116 已把 drain 前移到 template 克隆前）——注册恰好赶在该 engine 的 precompile fire 之前，首编译不缺席。

两个回调协同完成挂载：

- **precompile**（构造早期、template 克隆前）：`ensureDefaultOutletElement`（宿主无出口声明时补 `<div x-outlet>`）→ `transformXOutlet`（简写改写为 `x-component:autospark.outlet` 完整形态）→ outlet 组件全局声明注册 + 内建样式注入（均幂等；应用经构造 options 预注册同名组件时实例层优先，定制不被覆盖）。改写进模板、随克隆参与首编译；
- **ready**（构造末尾、首编译后）：按挂载矩阵构造 `AutoSparkRouter`（engine 注入，生命周期归应用）。构造内部 attach 异步链自行推进（出口检查 → 路由表加载 → 首导航），插件不持有实例——router 经宿主 `host.router` 与文档级监听存活。

**时序边界**：router 经 ESM import 但引擎已在其之前构造完时，预加载队列已 drain 冻结，push 抛 `TypeError`（ADR-0114 设计如此——误用要响不要哑）；`AutoSpark.ready` 的 retain 语义会对已存活的 engine 补挂载，但其静态模板已编译，x-outlet 简写错过 precompile 不再生效（须写完整形态）。

### 决策 4：`$.route` 路由快照

导航 commit（`_renderRoutes` 返回后、navVersion 校验块内）把路由快照写入 engine 元状态容器：

```js
state.$.route = { path, fullPath, params, query }
```

- **经 store 响应式代理写入**（`engine.store.state.$` 现读现写）——模板 `$.route.*` 与状态订阅方随导航响应式更新；
- `params` 为各层 matched 路由项自浅到深合并（深层覆盖同名浅层键）；`query` 自 `URLSearchParams` 解析；`path` / `fullPath` 取 history location；
- `$` 为引擎保留键（ADR-0105），默认由 ViewportManager 注入；`viewport: false` 时此处兜底建空容器；
- 被新导航取代 / 中止的导航不写（在 navVersion 校验块内天然保证）；错误页经 `_renderRoutes` 内部渲染走同一 commit 点覆盖；stub engine（无 store 的最小测试面）跳过。

### 决策 5：类型面经模块声明合并

router 包 `types/augment.ts` 对 engine 类型做声明合并，导入 router 类型即自动生效（经 `types/index.ts` 转导出）：

- `AutoSparkOptions` 新增 `routes?: false | AutoSparkRoutes | Omit<AutoSparkRouterOptions, "engine">` 与 `autoDiscoverRoutes?: boolean`；
- `AutoSparkMeta` 新增 `route?: { path; fullPath; params; query }`。

### 决策 6：产物改名

IIFE 产物 `autospark-router.js` → **`autospark.router.js`**（tsup copy 目标 `docs/public/`），与 `autospark.js` 命名对仗。IIFE 全局名 `AutoSparkRouter` 保留（调试与高级用法可及），但全局仅作命名空间呈现——挂载经插件自举，无需手动调用。

## 后果

**正面**：

- 纯 engine 应用零负担：无 routes 相关配置 → 静默不挂载，产物体积与行为均无感知；
- 启用声明一处化：engine options 即启用点，「建 engine → 声明 routes」不可拆散，顺序错误在编译期（类型）即暴露；
- 加载顺序不再是契约：双路径自举覆盖两种 script 顺序与 ESM 形态。

**代价 / 明码标价的边角**：

- 直接构造 `AutoSparkRouter` 收窄为注入构造（缺 `options.engine` 抛错），包入口不再运行时导出类；
- 插件自举依赖构造时序：晚于 engine 构造的 import 补挂载时，静态模板的 x-outlet 简写已错过 precompile（须完整形态，远程模板不受影响）；
- 挂载矩阵只判启用形态、不校验表内容——表本身的错误仍由路由表加载层报错。

## 实施落点

- `src/plugin/bootstrap.ts`——`resolveMountOptions`（挂载矩阵判定）/ `routerPrecompile` / `mountRouter` / `bootstrapRouterPlugin`（双路径注册）；
- `src/index.ts`——类改类型导出 + 尾部 `bootstrapRouterPlugin()` 调用；
- `src/engine/engineHost.ts`——仅注入模式重写；`ensureDefaultOutletElement` 导出复用；
- `src/router.ts`——`_syncRouteState` + 导航 commit 点调用；detach 去 owned 分支；
- `src/features/render.ts`——`_ensureDefaultOutlet` 告警文案（插件自举 / 直接构造两态）；
- `src/types/augment.ts` + `types/index.ts`——声明合并与转导出；
- `tsup.config.ts`——copy 产物改名 `autospark.router.js`；
- `src/__tests__/plugin.bootstrap.test.ts`——挂载矩阵四分支 / precompile DOM 预处理 / `$.route` 快照 / precompile fire-once 无 retain；
- 示例迁移（`routerOptions` 声明 + `new AutoSpark(el, {}, { routes: routerOptions })`）：`example/public/shop/index.html`、`example/debug-demo.html`、`example/public/app/modal-demo.html`。
