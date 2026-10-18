# ADR-0012：路由加载中指示与错误呈现——复用 x-loading、出口内建错误块与 router.retry()

- 状态：已接受（2026-10-18）
- 关联：**修订 ADR-0002 决策 8**（`autospark-loading` / `autospark-feedback` 退役）；依赖 engine **x-loading 运行时指令**（observer 通道、编译块路径）；关联 [ADR-0003](0003-outlet-props-keepalive-mode.md)（出口数据域驱动）、[ADR-0005](0005-outlet-fallback-active-precondition.md)（出口回退 / 激活前提）、[ADR-0008](0008-renderer-pipeline-and-raw-channel.md)（raw 通道）

## 背景

路由加载与错误呈现现状存在三个缺口：

- **加载指示**：出口模板以 `<autospark-loading x-show="!view.ready">` 呈现加载态——自研组件与 engine 已有的 x-loading 指令（遮罩 / delay 防闪烁 / 动作按钮 / 编译块自定义）能力重复；且渲染域的加载占位在 `await _loadData / _loadView` **之后**才挂载（render.ts 占位块位于两个 await 之后），真实网络等待期内出口无任何指示。
- **错误呈现**：加载失败一律走 errorPages 处理器、错误页 outerHTML 作为 ready 视图挂载；`options.errorPages` 未配置时由构造期合并的内建默认错误页（`pages/errors/*`，autospark-feedback 产物）兜底。**未匹配 URL（404）层被渲染循环 `if (curRouteItem)` 静默跳过**——URL 404 现状整层空白、无任何呈现。
- **重试**：`pages/errors` 产物的 retry 按钮派发 `autospark:action` 但 router 无监听（死按钮）；应用层亦无重载失败层的公开 API。

engine 的 x-loading 指令已具备完整覆盖层能力（运行时指令，observer 通道 mounted/unmounted 建拆覆盖层；裸值 ≡ 字面量 true 恒显示；配置绑定注入 message/bgColor/color/opacity/delay 等视觉字段），router 无需自研。包零外部消费者，breaking 窗口仍在。

## 决策

### 决策 1：加载中指示复用 x-loading，x-if 门控（Q1/Q4/Q7/Q8）

出口模板的视图容器（缓存条目容器与临时容器同构）内建**门控 div**：

- `x-if="view.loading"` 门控显隐——出口数据域非 engine.store，x-loading 的反应式通道（store 全局路径）在此场景不使用；显隐完全归 x-if 增删元素 → 共享 observer 通道触发指令 mounted/unmounted → 覆盖层建拆；
- 门控 div 兼任覆盖层定位宿主（裸 `x-loading` ≡ 字面量恒显示，无 value 字段）；两层合并后的配置（JSON 形态）随数据域下发、经属性绑定注入门控 div 的 `x-loading` 属性值（配置绑定、无 value 字段即字面量模式，视觉字段生效）；
- 视图容器加 `position:relative` 提供覆盖层定位上下文（遮罩 `position:absolute; inset:0` 恰罩住视图区域）。

**两层配置**：内置默认（`delay: 200` 防闪烁、`bgColor: "white"`、`opacity: 0.6` 浅色遮罩；其余字段走 x-loading 指令默认）→ 路由项 `loading` 覆盖。**不加 router 全局 loading 配置项**（Q8）——应用级深度定制走 engine 自定义 loading 组件通道（`getComponentDeclaration('loading')`）。

**类型收敛**（Q7，`AutoSparkRouteItem.loading` 死代码 repurpose——原声明无任何消费点）：

```ts
export interface RouteLoadingConfig {
    message?: string;
    delay?: number;
    bgColor?: string;
    color?: string;
    opacity?: number;
}
loading?: boolean | string | RouteLoadingConfig;
```

- `boolean`：显式开关（缺省 true 显示；`false` 关闭本路由加载指示）；
- `string`：文案简写（≡ `{ message: string }`）——旧语义「自定义 HTML 片段」废止；
- `RouteLoadingConfig`：覆盖内置默认的 x-loading 视觉字段子集——**不含 value / selector / actions**（value 显隐归 x-if 门控、定位归视图容器、动作按钮属错误块职责）；
- `HTMLElement` 形态删除。

**占位时序**：加载发起**前**先落视图条目（`loading: true` + 合并配置），完成后按结果落 `ready: true` / `error`——修正现行为「占位在 await 之后挂载、网络等待期无指示」的缺口。

### 决策 2：出口内建错误块（Q2/Q6）

出口模板内建错误块（`x-if="view.error"`，缓存条目容器与临时容器同构）：

- 数据域驱动：`view.error = { status: number, message?: string }`（视图清单条目新增 `error` 字段）；
- 动作按钮走**组件方法**（tabGo/tabClose + `_findRouter` DOM 向上遍历先例）：**404 仅「返回」**（`router.back()`）；**其余「重试」（`router.retry()`）+「返回」**；
- 错误不再作为 ready 视图挂载——view.error 入数据域后，错误呈现是容器级状态而非视图内容（与视图清单解耦，错误块不进 views 条目的 html）；
- **未匹配层纳入**（Q6）：渲染循环对 `route === undefined` 的层不再静默跳过——在其所在出口写入 `error: { status: 404 }` 条目（hash/url 取当前完整路径），动作仅「返回」。

### 决策 3：router.retry()（Q3/Q9）

公开无参方法：

- 重跑当前匹配链上所有 `loadState === "error"` 层的加载（view/data 两通道 `loadRoutes(chain, undefined, 0)`——公共层跳过语义天然只跳 ok 层，error 层真实重载；onLoadError 不落 loader 缓存，重试必真实 fetch）；
- 完成后重走渲染域恢复视图（绕公共层跳过——error 视图非就绪视图，激活复用判定不成立）；
- **语义边界**：非重新导航——不写历史、不走 beforeRoute/afterRoute 导航钩子链；
- 「返回」复用既有 `router.back()`。

### 决策 4：errorPages 优先，内建块兜底（Q10）

- **errorPages 显式配置优先**：错误发生时先查 `options.errorPages[status]` / `["*"]`，命中走错误页处理器、outerHTML 作为 ready 视图挂载（现行为不变）；
- **未命中** → 写 `view.error = { status, message }` 走内建错误块；
- 构造期**不再合并内建默认错误页**进 `options.errorPages`（`{ ...errorPages, ...this.options.errorPages }` 删除）——内建兜底职责移交内建错误块，errorPages 回归**纯应用级覆盖入口**（未配置 = 全走内建块）；`pages/errors/*` 删除。

### 决策 5：旧组件退役（Q11，修订 ADR-0002 决策 8）

- `autospark-loading`（components/Loading）与 `autospark-feedback`（components/Feedback）删除；
- `pages/errors/{404,500,default,index}.ts` 删除；相关 example / demo 同步清理；
- 出口组件模板中 `<autospark-loading x-show="!view.ready">` 替换为门控 x-loading 覆盖层。

## 后果

**正面**：

- 加载 / 错误呈现归一 engine 指令体系，router 删除自研 UI 组件（两个组件 + 三张错误页 + 样式文件）；
- 404 从静默空白变为可感知呈现（状态 + 「返回」动作）；失败层获得真实可用的重试能力与公开 API；
- 路由 `loading` 声明从死代码变为生效的两层可配置项；网络等待期出口有指示（占位前置）。

**代价 / 边界**：

- breaking：`loading` 的 string / HTMLElement 形态语义变更（HTML 片段 → 文案简写，HTMLElement 删除）；errorPages 未配置的应用从「内建默认错误页组件」变为「内建错误块」呈现；`autospark-loading` / `autospark-feedback` 标签名消失；
- 内建错误块样式为出口内建样式（`--autospark-outlet-*` CSS 自定义属性重载通道，同 tab 条惯例 ADR-0003 决策 5）；整页级深度定制仍走 errorPages；
- x-loading 的 store 反应式通道在此场景不使用（出口数据域非 store）——两套反应式域的边界由 x-if 门控桥接。

## 实施落点

- `src/engine/outletComponent.ts`——模板改造（视图容器 relative、门控 loading div、内建错误块、methods `retry` / `goBack`）、内建错误块样式、数据域默认值（`loading/loadingOptions/error`）与组件注释更新；
- `src/types/routes.ts`——`RouteLoadingConfig` 类型 + `loading` 类型收敛；
- `src/features/render.ts`——占位前置（加载发起前落 loading 态条目）、`_routeReject` 改造（errorPages 显式命中走处理器 / 未命中写 view.error）、未匹配层 404 呈现；
- `src/router.ts`——`retry()` 公开方法、构造期 errorPages 合并删除；
- 删除：`src/components/Loading/`、`src/components/Feedback/`、`src/pages/errors/`、example loading demo 及引用点（components/index.ts 导出、测试）；
- 单测：loading 门控显隐 / 两层配置合并 / errorPages 优先与兜底分流 / 404 未匹配呈现 / retry 重载语义；
- docs：指南页（加载中 / 错误呈现 / 重试）+ demo。
