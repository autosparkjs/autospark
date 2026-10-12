# ADR-0002：渲染载体更换为 AutoSpark Engine（移除 lit/alpinejs，运行时依赖 engine）

- **状态**：Accepted
- **日期**：2026-10-12
- **关联**：[CONTEXT.md](../../CONTEXT.md)（已废弃词条节）、[ADR-0001](0001-rename-to-autospark.md)（品牌统一）、engine [ADR-0017](../../../engine/docs/adr/0017-x-html-compile.md)（x-html.compile 子模板编译）、[ADR-0032](../../../engine/docs/adr/0032-data-script.md)（autospark/data script）、[ADR-0083](../../../engine/docs/adr/0083-async-parent-deferred-inherit.md)（autospark.* 组件保留命名空间）、[ADR-0086](../../../engine/docs/adr/0086-runtime-component-registration.md)（registerComponent）、[ADR-0100](../../../engine/docs/adr/0100-external-directive-global-queue.md)（外部指令全局队列）

## 背景

router 的渲染激活机制构建在 Alpine.js 之上：数据经 `Alpine.data(hash)` 注册、视图容器 `autospark-slot` 以 `x-data` 挂 hash、渲染后 `Alpine.initTree` 激活指令，另有两个 Alpine 自定义指令（x-cssvar / x-inject-data）。lit 则被 4 处样式文件用作 `css` 模板字面量工具（无 LitElement），且 lit/alpinejs 均未声明在 package.json（悬空引用，tsc 426 条预存错误的主根因）。同时 `autospark-outlet` / `autospark-slot` 自定义元素与 engine 的组件体系（x-define / x-component / registerComponent）平行存在，维护两套渲染世界。

engine 已具备全部所需能力：`x-html.compile`（ADR-0017）把绑定值作为子模板编译激活；`<script type="autospark/data">`（ADR-0032）编译期消费数据、多脚本 deepMerge 文档序后者覆盖；`autospark.*` 是组件保留命名空间（ADR-0083）；`registerComponent`（ADR-0086）运行时注册组件；engine IIFE 产物挂全局 `AutoSparkSpaces`。包版本 0.0.0 未发布、零外部消费者，是零成本 breaking 窗口。

## 决策

1. **依赖关系**：移除 lit / alpinejs；autospark 进 devDependencies（`file:../engine`，本仓根未声明 workspaces 故不用 `workspace:*`），仅供类型检查——构建 external，**产物零打包零 import engine**；使用契约 = HTML 先加载 AutoSpark.js（全局 `AutoSparkSpaces`）再加载 router（IIFE 全局名 `AutoSparkRouter`，tsup 新增库构建，运行时依赖全打包）。
2. **渲染载体**：`autospark-outlet` / `autospark-slot` 元素退役，由 **`autospark.outlet` engine 组件**承接：缓存视图 = x-for（`:key=hash`）管理的 append-only 列表（同 key 同 index 复用 DOM/scope/订阅，切走仅 x-show 隐藏——keepalive 运行态保留）；非缓存视图 = 单一临时容器重编译；视图内容 = `x-html.compile` 编译激活；加载态 = 内置 `autospark-loading` 元素。router 经 `engine.getComponent(宿主).methods` 驱动。
3. **出口简写**：`<div x-outlet>` 是 `x-component:autospark.outlet` 的别名糖。以**编译前 DOM 预处理**实现（engine 指令 compile 钩子返回值不被消费，无法做编译期替换——`scope.ts` runDirectives），生效于自建 engine 的宿主首编译前与远程模板 renderer 管线两处；注入 engine 模式的静态模板须写完整形态。
4. **engine 所有权**（混合）：`options.engine` 注入优先（应用拥有）；缺省自建（router 拥有，detach 时销毁），`options.data` 作为裸状态种子。组件 ↔ router 走 DOM 向上遍历协议（`data-autospark-router` 标记，原 Base 基类机制）。
5. **组件注册**：router 自动 `registerComponent`，探测 engine 已有同名（应用经 `options.components` 预覆盖）则跳过；注册晚于静态声明编译时由 x-component 的 `components/<名>/registered` retain 事件重试兜底。
6. **数据契约**：动态路由数据（含 `$params/$query/$state`）由渲染层序列化为 `<script type="autospark/data">` 追加到视图 HTML 尾部——engine 多脚本 deepMerge 文档序后者覆盖，**动态数据自然覆盖远程模板自带的同名静态键**，零自定义合并逻辑。`data` 选项的 `store` 键（Alpine.store）随桥退役。
7. **Alpine 遗产处置**：AlpineManager / x-cssvar / x-inject-data 删除；CSS `v-bind(expr)` → CSS 变量转换退役（模板改用 engine `:style` / x-bind）；Outlet 的 tabs/collapse 布局退役存目（stack 先行），待 engine 布局件组合重建。
8. **保留不动**：`autospark-link` / `autospark-loading` / `autospark-feedback` / `autospark-view-meta`（原生实现，样式由 lit css 机械改写为原生 CSSStyleSheet）；导航层语义（嵌套路由 / KeepAlive / 模态路由 / 五类钩子 / 数据预取）全部保留，只换渲染载体。旧语法全退役不留别名。

## 后果

- lit / alpinejs 悬空引用清零；渲染世界归一（两套并行机制 → engine 单一体系）。
- 产物形态变更：新增 tsup 库构建（esm + iife，全局 `AutoSparkRouter`），IIFE 复制 `docs/public/autospark-router.js`；example 改为「注入 engine + createRouter({engine})」形态（vite 源码场景无 IIFE 全局）。
- keepalive 复用粒度从「slot 壳保留、内容每次重写」升级为「视图子树整体保留（运行态不丢）」。
- 测试基建（render/ 目录）基于 lit 元素 + Alpine，随载体退役删除，需基于真 engine 运行时重建（独立后续任务）。
- 注入模式下应用静态模板不支持 x-outlet 简写（文档化边界）；模态路由的远程视图渲染存在预存断点（`renderToOutlet` 未定义），不在本次范围。
- engine 源码经 tsconfig paths 直引类型，router 的 `tsc --noEmit` 会连带检查 engine 源码（66 条 engine 侧严格配置差异错误计入基线，非 router 回归）。
