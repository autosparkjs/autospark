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
URL 经路由表匹配后的运行时结果，携带解析出的 params/query 与重定向链（`redirectFrom`）。其 `url` 是**完整路径**（pathname + search，ADR-0004）：公共层判定、路由 hash 默认模板（`"{url}"`）、tabs 页签回跳均以此为键。
_Avoid_: 路由实例、活动路由

**嵌套路由（Nested Routes）**:
路由项的视图渲染进更深层出口的组合形态，渲染按出口层级递归进行。
_Avoid_: 子路由（vue-router 词）、多级路由

**远程子表（Remote Children）**:
路由项 `children` 声明为远程地址字符串的形态——初始化期从该地址取回子路由项声明、展开为本节点的子路由。地址解析三级：含协议（`http://`、`//`）者原样；`/` 开头者拼 `base`；其余拼 `base` + 祖先路由路径。地址支持 `{path}` / `{name}` / `{meta.*}` / `{timestamp}` 插值，**绝对路径亦参与插值**；**初始化期不存在运行时变量**——`{params.*}` `{query.*}` `{url}` `{state.*}` 均不提供。响应接受数组或单个对象，返回项的 `path` 相对本节点。
_Avoid_: 动态路由表（泛称，亦可指顶层远程整表）、懒加载路由（那是 view 的加载时机）

**约定子表（Convention Children）**:
远程子表的约定式简写——`children: true`，地址取 `options.routesFile`（默认 `"routes.json"`），解析规则与字符串形态完全一致、无特殊分支。自动发现启用后，未声明 children 的节点按**同一约定**自动探测（见「路由表自动发现」）——节点级显式 opt-in 与选项级全局 opt-in 共用一套地址解析。
_Avoid_: 默认子路由（那是 `default` 键的缺省展开语义）

**路由表自动发现（Auto Route Discovery）**:
`options.autoDiscoverRoutes: true`（默认 `false`）启用后，路由表遍历中对每个**未声明 children 且非重定向**的节点，按约定探测 `{累积路径}/{routesFile}`（默认 `routes.json`）的远程子表——显式 `children: []` 视为作者声明无子路由（单节点 opt-out），`view`/`modal` 不参与判定。探测是**投机性请求**，阴性结果（404、200 但非 JSON——SPA 托管 index fallback）静默落定为无子路由（仅 `logger.debug`），与显式声明（**断言性请求**，404/坏 JSON 报错）分级；网络错误/5xx 仍降级并发 `routes:error`。探测地址纯派生（累积路径 + routesFile + base，无插值）；取回子项按同一谓词递归探测，机制复用路由表展开（ADR-0007）。缓存成功与阴性结果，不缓存其他失败——瞬时故障不钉死（ADR-0010）。
_Avoid_: `remoteRoutes`（评审曾用名，弃）、远程路由表（那是顶层 `options.routes` 传 URL）、约定子表（那是节点级显式 `children: true`）、自动探测全节点（`redirect` 与显式空数组不探测）

**远程路由表（Remote Route Table）**:
顶层 `options.routes` 传 URL 的既有能力——取回整表。与远程子表同族但层级不同：前者取整表，后者取某个路由项的子树。
_Avoid_: 远程子表

**auto-link（路由链接组件）**:
`<auto-link to="/path">` 声明式导航组件（Light DOM、内层真实 `<a href>`，JS 未执行时即可被爬虫发现与跟随）。内部路由的内层 href 自动带 base 前缀（真实可爬）、外部链接原样输出、`target="_blank"` 自动补 `noopener noreferrer`。自身不绑定点击监听，导航由文档级委托统一接管。**可选便捷层而非导航必需品**——普通 `<a>` 已被全局拦截；组件的不可替代职责是 base 前缀自动化、`replace` 声明与静态 SEO href（ADR-0009）。
_Avoid_: 导航必需组件（普通 `<a>` 已可 SPA 导航）、`autospark-link`（旧标签名，已废弃）

**全局链接拦截（Plain Anchor Interception）**:
文档级点击委托对普通 `<a href>` 的 SPA 接管——组件路径优先，无组件命中时接管同源 http(s) 内部路径：统一 `push`（plain `<a>` 无 replace 表达）、pathname 剥 base 后拼接 search/hash、相对 href 按文档 URL 解析。放行矩阵（交还浏览器默认行为）：修饰键、非左键、`target` 非 `_self`、`download`、`rel` 含 external、非 http(s) 协议、纯页内锚点（hash 模式 `#/x` 由 hashchange 自然接管）、跨域、无 href；唯一例外为危险协议（`javascript:`/`data:`）——拦截且不导航（对齐 T-02-01）。锚点须位于本 router 宿主子树内，多 router 并存各管各的子树（ADR-0009）。
_Avoid_: 全量接管（放行矩阵外的情形必须交还浏览器）、preventDefault 一切点击（危险协议之外的放行项不得阻止默认行为）

### 加载层

**公共层跳过（Common-Layer Skip）**:
导航时 fromRoute 与 toRoute 逐层比较 `matched.url`（完整路径，含 search）得到的公共前缀层级——渲染域跳过公共层渲染，加载域跳过已成功加载层的 data/view 请求（复用既有 signal）。两域前提不同：加载域是该通道加载成功（`_viewLoadState`/`_dataLoadState === "ok"`，挂在持久路由表项上，边界 = 应用生命周期）；渲染域是激活前提（本层视图仍是其出口的激活视图，ADR-0005）。失败/非激活层公共也重渲染或重试。与 loader 的 `cache` TTL（显式配置、默认 0）是两个独立机制。
_Avoid_: 缓存命中（那是 cache TTL 机制）、已缓存层跳过（跳过判定与缓存无关）

**加载状态标记（Load State）**:
路由项上按通道记录的最近一次加载结果（`_viewLoadState` / `_dataLoadState`，`"ok" | "error"`），由 loader 成功/失败落账点统一写入；导航取消不写。生命周期 = 路由表（页面刷新重置）。
_Avoid_: 缓存标记（非缓存簿记）、加载中状态（只有终态）

**路由表展开（Route Table Expansion）**:
初始化期发起、**后台渐进进行**的远程子表解析过程——分层逐层并发、不阻塞首屏匹配与渲染，深度上限 `options.maxChildrenDepth`（默认 10）。完整性是它的目标性质：成功路径下最终得到完整路由树；单个子表失败不致命——该节点局部降级为无子路由并落 error 状态（见「加载状态标记」），表其余部分照常可用。失败与触顶均发 `routes:error`，全部展开完成发 `routes:expanded`（`routes:loaded` 仍表示骨架就绪）。
_Avoid_: 路由表加载（那是 `load()` 取骨架）、路由表初始化（含混）

**待展开（Pending Expansion）**:
路由项 `children` 已声明为远程但尚未就位的状态（`_childrenState: "pending"`）。匹配撞到此状态只能判定为「未知」而非「该节点无子路由」——首屏 unmatched 重试与运行时导航挂起都以此为前提。
_Avoid_: 未加载（那是 view/data 通道的语义）

**重匹配（Re-match）**:
展开令路由表变长后，对当前 URL 重新执行一次匹配、并在结果变化时纠正渲染的动作。两处发生：attach 初始导航判定为 unmatched 时等展开完成后重试；运行时导航撞上待展开节点时挂起等待后继续判定。不产生新历史条目。
_Avoid_: 重新导航（会误导为写入历史）

### 渲染层

**出口（Outlet）**:
`autospark.outlet` engine 组件（宿主带 `data-autospark-outlet` 标记），匹配视图的 DOM 落点；内部以 x-for（`:key=hash`）持有视图清单、以临时容器承接非缓存视图。承接两个 props——`keepAlive`（本出口未显式声明路由的缓存默认值，默认 false）与 `mode`（出口模式，默认 stack）。router 渲染层经 `engine.data(outletEl, …)` 直写组件数据域驱动。
_Avoid_: 容器、视口、`autospark-outlet` 自定义元素（已退役）

**出口模式（Outlet Mode）**:
出口组件的渲染模式 prop（`mode`）——`stack` 只显示 active 视图（其余 x-show 隐藏）；`tabs` 增渲染页签条（每个已访问视图一个页签，标题取路由 `title`、缺省回退 hash），点击页签走 router 导航（URL 保持唯一真相源）。tabs 模式下所有视图常驻缓存通道（页签存续以 DOM 常驻为前提），临时通道不启用。
_Avoid_: layout（旧 `layout: tabs/collapse` 词，决策已修订）

**出口回退（Outlet Fallback）**:
嵌套渲染时上一层视图未提供子出口（模板无 x-outlet），本层视图不终止渲染而是**沿用上一层出口**挂载（置换上一层视图），更深匹配层继续在同一出口逐级置换、最深者胜；回退挂进的视图自带 x-outlet 时更深层自然向下扎根。检测以挂载后的 DOM 真相为准（有限微任务重试后仍缺失才回退），不做视图 HTML 预判。根出口缺失无处可退，维持 error 终止。
_Avoid_: 找不到出口跳过渲染（已废弃的旧行为）、出口继承、出口穿透

**激活前提（Active-View Precondition）**:
渲染域公共层跳过的前提——本层视图仍是其出口的当前激活视图，成立才跳过。不成立（出口已被更深回退视图置换，或后退裁剪后激活态指向被裁层）时跳过转为重挂：keepAlive 视图仅写 active 复用（不触碰 DOM 运行态），ephemeral 视图重挂恢复。后退裁剪配套：被裁层挂载出口的激活态清空休眠（keepAlive 条目保留可复用）。
_Avoid_: 跳过即什么都不做（旧语义）

**入口文档导航（Entry Document Navigation）**:
attach 初始导航对「直开应用载体」的自动归位——原始 pathname 以 `.html`/`.htm` 结尾（如 `/public/shop/index.html`、`/shop/a.html`、`/shop/x/y/z.html`，共同特征是 URL 即静态文件本身、不含路由信息）时，先试真实匹配（路由 path 带 `.html` 的合法场景正常渲染），仅 unmatched 才 replace 到 home 路径（地址栏归位 base 根，不留历史），首页展开交给根级 default 机制。base 未显式设置时构造期按缺省链推断：**显式配置 > 文档 `<base href>` 标签 > URL 目录推断**——目录规则为入口文件所在目录即 base（`/shop/x/y/z.html` → base=`/shop/x/y/`）；`<base href>` 信号服务于动态入口（服务端渲染入口 HTML、URL 无文件名如 `/shop`），深层直达/刷新须有它或显式 base，否则路由路径会被目录推断误判。仅 attach 初始化检测一次；运行中导航到 `.html` 结尾的 URL 按正常匹配走（404 场景不拦截）。history/hash 双模式统一。
_Avoid_: 默认路由兜底（default 是缺省展开机制，不覆盖 unmatched）、404 兜底（unmatched 静默空白是另一议题，存目）、文件名作目录（`z.html` 不产生 `z` 目录层）

**出口简写（x-outlet）**:
`<div x-outlet>` 是 `<div x-component:autospark.outlet>` 的别名糖，经编译前 DOM 预处理改写（插件自举的宿主首编译前、远程模板 renderer 管线内两处生效，ADR-0011）；**简写的值透传为 props 表达式**——`<div x-outlet="{ keepAlive: true, mode: 'tabs' }">` 等价于完整形态带值写法。直接构造（注入 engine）的静态模板须写完整形态。
_Avoid_: x-outlet 指令（它是指令系统之外的预处理，非 engine 指令）

**视图清单（Views）**:
出口组件数据域的唯一状态——append-only 的已访问视图记录（`{hash, html, ready, title}` 条目 + `active` hash）与临时视图槽，router 经 `engine.data` 直写；tabs 模式页签条 x-for 它渲染，条目的 hash/title 即页签元数据。它是访问记录而非缓存簿记：缓存由 DOM 常驻承担，清单只描述「有哪些视图、哪个激活」。
_Avoid_: 缓存列表、viewCache

**缓存视图 / 临时视图（Ephemeral View）**:
出口内视图的两种容器通道——缓存视图（keepalive）进入视图清单，切走仅 x-show 隐藏（display:none）、切回原样复用（运行态保留）；临时视图每次重编译、无态可丢。**缓存不是数据概念**——数据域只放视图清单，缓存纯由 DOM 常驻 + display:none 承担。
_Avoid_: slot（旧载体词）、页面栈

**视图源（ViewSource）**:
路由视图内容的来源形态——HTML 路径字符串 / 现成 HTMLElement / 动态导入函数三选一。
_Avoid_: 模板、组件（组件是渲染结果形态）

**KeepAlive**:
路由视图的缓存复用策略——离开不销毁、重进即复用（`activateView` 不触碰内容）。两级声明，优先级：**出口 mode=tabs（全视图常驻）> 路由项 `keepAlive` 显式声明 > 出口 `keepAlive` prop（默认 false）**。注意历史默认已翻转：路由未声明且出口未声明时不再缓存。与 `cache` 键（TTL 时长）是两个独立字段。视图条目粒度唯一裁决者是路由 hash（`route.hash` 模板，默认 `"{url}"` 即完整路径）——hash 相同即同一条目（复用），不同即新条目；覆盖模板须注意：不含 query 的模板会在 query 变化时令重载数据无法反映到复用视图（ADR-0004 数据黑洞）。
_Avoid_: 缓存（那是 `cache` 键）、keep-alive 连字符拼写、keepalive 全小写拼写（键名统一 `keepAlive`）

**路由数据（Route Data）**:
导航前由数据加载器预取、以 `<script type="autospark/data">` 形态合并进视图 HTML 尾部再交 engine 编译消费的数据（engine 对多脚本按文档序后者覆盖——动态数据覆盖远程模板自带的同名静态键）。
_Avoid_: 页面数据、props（组件单向注入语义，勿混）、模板变量替换（不做字符串插值）

**渲染器（Renderer）**:
视图内容的加工适配器——决定「加载到的字节 → 出口视图内容」的转换方式。四个内置形态：**模板渲染器**（Template，`.html`/`.htm` 及默认兜底，DOMParser + x-outlet 改写，产物经 engine 编译全响应式）、**raw 渲染器**（零加工原样输出）、**JSON 渲染器**（`<pre>` pretty-print）、**图片渲染器**（`<img src>`）。均继承自基础渲染器（`test` 探测 + `render` 加工），从包入口导出可显式注册（ADR-0008）。
_Avoid_: 模板引擎、模板（模板渲染器是渲染器的一个形态）

**渲染器选择链（Renderer Resolution）**:
fetch 之后逐级决定渲染器的固定顺序——URL `!` 前缀强制 raw（最高优先级）> 路由级显式 `view.renderer` > `options.renderers` 自定义渲染器逐个 `test()` > 模板渲染器兜底（`test()` 恒真）。无自动格式判定、无全局渲染器钩子（ADR-0008 修订）。
_Avoid_: 渲染器注册顺序唯一决定（`!` 前缀优先于一切）、内置格式判定（`.json`/图片扩展名自动分流已移除，Json/Image 渲染器需显式注册）、getRenderer 全局钩子（已取消）

**raw 前缀（Raw Prefix）**:
视图 URL 以 `!` 开头（如 `!/path/page.html`）——强制该视图跳过一切内容加工、原样输出，优先级最高（高于路由级显式渲染器）；fetch 前剥除前缀（插值与 base 拼接之前），服务器收到干净 URL。前缀独立于查询串，与业务 query（如 `?count=1`）零冲突（ADR-0008 修订）。
_Avoid_: `?raw` 查询键标记（与业务 query 冲突，已废弃）、`?raw` 导入后缀（Vite 词）、查询参数传参（前缀是给 router 的指令，非业务参数）

**raw 视图（Raw View）**:
经 raw 通道渲染的视图——内容不经 engine 编译，outlet 模板以普通 `x-html` 直接 innerHTML 挂载。动机是性能（跳过编译成本），非安全隔离。边界：跳过路由数据注入、`selector` 无效、内容中 `<script>` 不执行、内容中 x-outlet 不激活（嵌套路由不可用，子层走出口回退）。keepAlive/tabs 语义与普通视图一致（ADR-0008）。
_Avoid_: 普通HTML渲染（渲染器层的零加工 ≠ 旁路编译，两者由 raw 标志贯通为一体）、静态视图

**渲染降级链（Renderer Fallback Chain）**:
选中渲染器加工失败（抛异常或返回 error）后的两级降级——先试模板渲染器（engine 编译），再失败落 raw 通道原样输出；全链失败才落错误页。fetch 本身失败不降级（无内容可原样）。链内去重、每个渲染器至多一次、每次降级 warn（ADR-0008）。
_Avoid_: 渲染失败即错误页（那是全链失败的终态）、重试（降级不是重试，换的是加工方式）

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
router 与 AutoSpark engine 实例的接缝——**仅注入模式**（ADR-0011）：`options.engine` 注入，应用构造并拥有 engine 生命周期，router 纯消费；缺失即抛错。常规启用走插件自举（见下条），构造面仅供直接装配。
_Avoid_: 依赖注入框架词（provider/injector）、单例 engine、自建模式（`window.AutoSparkSpaces` 运行时探测自建 engine 的旧分支已删除）

**插件自举（Plugin Bootstrap）**:
router 以 AutoSpark 插件形态挂载、无独立入口——包入口模块加载即注册 precompile / ready 双回调（ADR-0011）：**precompile**（engine 构造早期、模板克隆前，ADR-0116）做出口预处理（默认出口插入 + x-outlet 简写 transform + outlet 组件全局注册 + 内建样式注入，均幂等）；**ready**（构造末尾）按挂载矩阵构造 router 并开始 attach 异步链。注册双路径（ADR-0114）：`window.AutoSpark` 已存在直接注册；否则推预加载队列，首个 engine 构造开头 drain——注册恰赶在该 engine 的首编译之前。
_Avoid_: `createRouter` 工厂（已删除）、AutoSparkSpaces 探测自建（已删除）、模块加载即挂载（挂载发生在 engine 构造期，非模块求值期）

**挂载矩阵（Mount Matrix）**:
ready 回调对 `engine.options` 的 sniff 判定表（engine 零核心改动）：`routes: false` 显式禁用压过一切；`routes` 有值（数组 / 单项 / 字符串 URL / 完整配置对象，判据 `"routes" in routes`）挂载该表且 `autoDiscoverRoutes` 不触发；无 routes + `autoDiscoverRoutes: true` 挂默认壳表 `[{path:"/"}]` 并整表发现（ADR-0010 根节点探测 `{base}/routes.json`）；都没有静默不挂载（纯 engine 应用零影响）。
_Avoid_: 路由配置校验（矩阵只判启用形态，不校验表内容）、`false` 等价缺省（false 压过 `autoDiscoverRoutes`，与未声明语义不同）

**路由快照（$.route）**:
导航 commit 后写入 engine 元状态容器 `state.$.route` 的响应式快照——`{ path, fullPath, params, query }` 四字段：path/fullPath 取 history location，params 为各层 matched 自浅到深合并（深层覆盖同名浅层键），query 自 URLSearchParams 解析。经 store 响应式代理写入，模板 `$.route.*` 与状态订阅方随导航更新；被新导航取代/中止的导航不写，错误页经同一 commit 点覆盖（ADR-0011）。视图上下文 `$route` / `$params` / `$query` 变量（per-view 编译期注入）是另一机制，勿混。
_Avoid_: 视图上下文 `$route`（per-view 变量注入，非全局元状态）、路由元数据（`route.meta` 是声明面，本词是运行时快照）

## 已废弃词条

- **KylinRouter / `Kylin*` 类型前缀** → AutoSparkRouter / `AutoSpark*`（ADR-0001，2026-10-12 品牌统一）
- **`kylin-*` 自定义元素**（kylin-outlet / kylin-link / kylin-loading / kylin-feedback / kylin-view-meta / kylin-slot）→ `autospark-*`
- **`kylin-modal-*` CSS 类 / 动画名 / `#kylin-modal-styles`** → `autospark-modal-*` / `#autospark-modal-styles`
- **KylinRouterOptiopns**（历史 typo 导出名）→ `AutoSparkRouterOptions`
- **KylinBits**：非本包词根，属 `packages/theme` 的独立议题，本表仅存目
- **`autospark-outlet` / `autospark-slot` 自定义元素** → `autospark.outlet` engine 组件（ADR-0002，2026-10-12 渲染载体更换）
- **`autospark-link` 自定义元素标签名** → `auto-link`（ADR-0009，2026-10-15 命名简化；类名 `AutoSparkLink` 与导出面不变）
- **`createRouter` 工厂函数** → engine 构造 options 声明 `routes` / `autoDiscoverRoutes` 由插件自举挂载（ADR-0011，2026-10-16 插件化）
- **`AutoSparkRouter` 运行时导出 / 自建 engine 模式** → 包入口类仅类型导出；直接装配走注入构造（`options.engine`，缺失抛错）（ADR-0011，2026-10-16）
- **`autospark-router.js` 产物名** → `autospark.router.js`（ADR-0011，2026-10-16 与 `autospark.js` 命名对仗；IIFE 全局名 `AutoSparkRouter` 不变）
- **Alpine 桥（AutoSparkAlpineStore / AlpineManager）与 x-cssvar / x-inject-data 指令** → engine 响应式体系（ADR-0002）
- **Outlet 布局 `layout: tabs / collapse`** → ~~stack 先行；tabs/collapse 存目待以 engine 布局件组合重建~~（ADR-0002）→ **tabs 以出口 `mode` prop 内建复活**（ADR-0003 修订：页签需感知路由语义——title/icon 元数据、激活态与 URL 联动，布局件组合做不到）；collapse 仍存目
- **`data` 选项的 `store` 键**（Alpine.store 全局注册）→ 数据统一走 autospark/data script 注入（ADR-0002）
- **CSS `v-bind(expr)` → CSS 变量转换** → 改用 engine 的 `:style` / x-bind 指令写变量（ADR-0002）
- **`template?: TemplateResult`（lit 类型字段）** → `template?: string`
- **outlet methods 驱动面（mountView / mountEphemeral / activateView）** → `engine.data(outletEl, …)` 直写数据域（ADR-0003，2026-10-13 驱动面更换）
