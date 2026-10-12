# AutoSpark Router

`@autospark/router`——AutoSpark 生态的客户端路由器：监听浏览器历史，把 URL 匹配到的路由视图经 AutoSpark engine 编译激活后渲染进宿主内的出口组件。本表固化路由器内部的领域语言。

## Language

### 核心导航层

**路由器（Router）**:
挂接到宿主元素、监听浏览器历史并调度「匹配 → 钩子 → 加载 → 渲染」全流程的导航中枢。一个宿主一个实例，多实例并存合法。
_Avoid_: 单例、路由管理器（泛称）

**宿主（Host）**:
路由器挂接的 DOM 元素，构造期被标记 `data-autospark-router` 属性并注入 `.router` 引用。
_Avoid_: 容器（泛称）、挂载点（Vue 词）

**路由项（RouteItem）**:
路由表中「路径模式 → 视图/数据/选项」的声明单元（`AutoSparkRouteItem`）。
_Avoid_: 页面（页面是渲染结果）、路由对象（泛称）

**匹配路由（MatchedRouteItem）**:
URL 经路由表匹配后的运行时结果，携带解析出的 params/query 与重定向链（`redirectFrom`）。
_Avoid_: 路由实例、活动路由

**嵌套路由（Nested Routes）**:
路由项的视图渲染进更深层出口的组合形态，渲染按出口层级递归进行。
_Avoid_: 子路由（vue-router 词）、多级路由

### 渲染层

**出口（Outlet）**:
`autospark.outlet` engine 组件（宿主带 `data-autospark-outlet` 标记），匹配视图的 DOM 落点；内部以 x-for（`:key=hash`）持有缓存视图列表、以临时容器承接非缓存视图。
_Avoid_: 容器、视口、`autospark-outlet` 自定义元素（已退役）

**出口简写（x-outlet）**:
`<div x-outlet>` 是 `<div x-component:autospark.outlet>` 的别名糖，经编译前 DOM 预处理改写（自建 engine 的宿主首编译前、远程模板 renderer 管线内两处生效）；注入 engine 模式的静态模板须写完整形态。
_Avoid_: x-outlet 指令（它是指令系统之外的预处理，非 engine 指令）

**缓存视图 / 临时视图（Ephemeral View）**:
出口内视图的两种容器通道——缓存视图（keepalive）进入 append-only 的 x-for 列表，切走仅隐藏、切回原样复用（运行态保留）；临时视图每次重编译、无态可丢。
_Avoid_: slot（旧载体词）、页面栈

**视图源（ViewSource）**:
路由视图内容的来源形态——HTML 路径字符串 / 现成 HTMLElement / 动态导入函数三选一。
_Avoid_: 模板、组件（组件是渲染结果形态）

**KeepAlive**:
路由视图的缓存复用策略——离开不销毁、重进即复用（`activateView` 不触碰内容）。与 `cache` 键（TTL 时长）是两个独立字段。
_Avoid_: 缓存（那是 `cache` 键）、keep-alive 连字符拼写（键名是 `keepAlive`）

**路由数据（Route Data）**:
导航前由数据加载器预取、以 `<script type="autospark/data">` 形态合并进视图 HTML 尾部再交 engine 编译消费的数据（engine 对多脚本按文档序后者覆盖——动态数据覆盖远程模板自带的同名静态键）。
_Avoid_: 页面数据、props（组件单向注入语义，勿混）、模板变量替换（不做字符串插值）

**渲染器（Renderer）**:
按内容类型适配视图内容的适配器家族（html/json/image），共同继承自基础渲染器。
_Avoid_: 模板引擎

### 钩子层

**路由钩子（Hook）**:
五类——`beforeRoute` / `afterRoute` / `beforeRender` / `afterRender` / `routeError`；全局钩子与路由项级钩子合并执行，before 系返回 `false` 拦截导航、返回字符串改道。
_Avoid_: 守卫（guard，vue-router 词）、中间件、生命周期（非组件生命周期）

### 模态层

**模态路由（Modal Route）**:
以模态形态打开的路由，由独立模态栈（stack）管理、不写入主历史。
_Avoid_: 弹窗（泛称）、对话框（UI 形态词）

### 集成层

**engine 绑定（Engine Binding）**:
router 与 AutoSpark engine 实例的接缝——`options.engine` 注入（应用拥有）或缺省自建（router 拥有，经 `window.AutoSparkSpaces.AutoSpark` 运行时探测，产物零 import engine）。
_Avoid_: 依赖注入框架词（provider/injector）、单例 engine

## 已废弃词条

- **KylinRouter / `Kylin*` 类型前缀** → AutoSparkRouter / `AutoSpark*`（ADR-0001，2026-10-12 品牌统一）
- **`kylin-*` 自定义元素**（kylin-outlet / kylin-link / kylin-loading / kylin-feedback / kylin-view-meta / kylin-slot）→ `autospark-*`
- **`kylin-modal-*` CSS 类 / 动画名 / `#kylin-modal-styles`** → `autospark-modal-*` / `#autospark-modal-styles`
- **KylinRouterOptiopns**（历史 typo 导出名）→ `AutoSparkRouterOptions`
- **KylinBits**：非本包词根，属 `packages/theme` 的独立议题，本表仅存目
- **`autospark-outlet` / `autospark-slot` 自定义元素** → `autospark.outlet` engine 组件（ADR-0002，2026-10-12 渲染载体更换）
- **Alpine 桥（AutoSparkAlpineStore / AlpineManager）与 x-cssvar / x-inject-data 指令** → engine 响应式体系（ADR-0002）
- **Outlet 布局 `layout: tabs / collapse`** → stack 先行；tabs/collapse 存目待以 engine 布局件（x-container/x-foldable）组合重建（ADR-0002）
- **`data` 选项的 `store` 键**（Alpine.store 全局注册）→ 数据统一走 autospark/data script 注入（ADR-0002）
- **CSS `v-bind(expr)` → CSS 变量转换** → 改用 engine 的 `:style` / x-bind 指令写变量（ADR-0002）
- **`template?: TemplateResult`（lit 类型字段）** → `template?: string`
