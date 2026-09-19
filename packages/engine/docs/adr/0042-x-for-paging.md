# ADR-0042: x-for 分页模式

x-for 需要支持分页功能，包括客户端分页（全量数据 slice）和服务端分页（远程加载）。通过 `.paging` 修饰符启用，`x-for-options` 配置分页参数。

**双模式**：有 `loader` 选项为服务端分页（loader action 远程加载数据追加到 items），无 `loader` 为客户端分页（items 已有全量数据，directive 自动 slice）。

**追加式数据**：loader 返回的数据追加到 items 数组尾部（基于页偏移去重），items 是分页数据的累积源。pageSize 变化时，根据新 pageSize 重新计算 slice，只追加 items 中缺少的数据。

**Loader 契约**：标准 action，签名 `({ page, pageSize }) => Promise<{ data, page, pageSize, pageCount }>`。`pageCount=0` 表示总页数未知（load-more 模式），`data=[]` 表示没有更多数据（`$hasMore=false`）。

**状态绑定**：`:data-paging="pagingState"` 双向绑定分页状态（page, pageSize, pageCount, hasMore, loading, error, total）。仅 page、pageSize 接受外部写入（触发翻页；page 越界钳位到末页、pageSize 变化重置回第 1 页），其余 5 个字段只读、外部写入静默忽略。防循环不变量：引擎回写的值恒等于内部值，page/pageSize watcher 恒等早退，回写不会再次触发翻页。total 为估算值（pageCount×pageSize，尾页不满时高估）。

**分页状态读取器**：`scope.paging`——容器 scope 上的只读冻结快照（7 字段，`Object.freeze`），照 `scope.components` 先例挂 scope 实例，供 JS/action 读取，有无 `:data-paging` 均存在；不注入 `state._scopes`（不成为响应式状态）。分页状态三通道分工：项模板内走 `$*` 分页变量、JS 读取走 `scope.paging`、跨作用域共享与外部控制走 `:data-paging`。否决可写 Proxy 形态——翻页控制入口收敛于 `$page` 写与绑定对象写，避免真相源扩散。

**服务端渲染分流**：总页数已知（`pageCount>0`）为翻页渲染——只渲染当前页切片（`(page-1)*pageSize` 起 `pageSize` 条；数据仍按页偏移全量累积在 items，作为已加载页缓存，翻回直接命中切片）；总页数未知（`pageCount=0`，load-more）保持累积全量渲染。否决「loader 模式一律累积渲染」——翻页导航 UI 下按下一页会不断追加显示而非翻页。

**autoLoad:false 手动首载**：向绑定对象写入 `page` 触发，依赖两个配合约定：① 恒等早退放行——未完成首次加载（`_hasLoaded=false`）时 `p === _page` 不早退；② 推迟回写——未首载时引擎不向绑定对象回写 `page`，且**绑定对象初值须省略 `page`**——否则首次写 `page=1` 是同值赋值，autostore 不发射变更信号（同值赋值无信号是响应式层硬边界，任何订阅形态都无法感知）。

**互斥**：`.paging` 与 `.virtual` 互斥，paging 优先，virtual 被忽略。

**分页变量**：`$page`, `$pageSize`, `$pageCount`, `$hasMore`, `$loading`, `$error`, `$total` 注入项模板作用域，通过 Proxy 拦截 `$page`/`$pageSize` 写操作自动触发 loader 或 render。
