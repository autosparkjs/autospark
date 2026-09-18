# ADR-0042: x-for 分页模式

x-for 需要支持分页功能，包括客户端分页（全量数据 slice）和服务端分页（远程加载）。通过 `.paging` 修饰符启用，`x-for-options` 配置分页参数。

**双模式**：有 `loader` 选项为服务端分页（loader action 远程加载数据追加到 items），无 `loader` 为客户端分页（items 已有全量数据，directive 自动 slice）。

**追加式数据**：loader 返回的数据追加到 items 数组尾部（基于页偏移去重），items 是分页数据的累积源。pageSize 变化时，根据新 pageSize 重新计算 slice，只追加 items 中缺少的数据。

**Loader 契约**：标准 action，签名 `({ page, pageSize }) => Promise<{ data, page, pageSize, pageCount }>`。`pageCount=0` 表示总页数未知（load-more 模式），`data=[]` 表示没有更多数据（`$hasMore=false`）。

**状态绑定**：`:data-paging="pagingState"` 双向绑定分页状态（page, pageSize, pageCount, hasMore, loading, error, total）。用户可从外部修改 `pagingState.page` 触发翻页。

**互斥**：`.paging` 与 `.virtual` 互斥，paging 优先，virtual 被忽略。

**分页变量**：`$page`, `$pageSize`, `$pageCount`, `$hasMore`, `$loading`, `$error`, `$total` 注入项模板作用域，通过 Proxy 拦截 `$page`/`$pageSize` 写操作自动触发 loader 或 render。
