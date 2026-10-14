# ADR-0006: 入口文档导航

- 状态：已接受（Accepted，2026-10-14 同日修订：检测放宽至任意 `.html`/`.htm` + base 自动推断点名）
- 日期：2026-10-14
- 关联：ADR-0005（出口回退——分析中暴露的 unmatched 空白问题）、ADR-0004（matched.url 完整路径语义）

## 背景

SPA 常以「直开载体 HTML」方式进入应用：静态托管无 SPA rewrite、用户从入口页点文件路径链接（如 `/public/shop/index.html`）、或书签收藏了带 `.html` 的地址。此时 URL 是**应用的载体本身**而非路由路径——`removePathPrefix` 对不上 `base`、匹配器无路由可命中，attach 初始导航走 `replace(当前 pathname)` 后整链 unmatched，页面只剩静态导航菜单，出口区空白。

载体直开不限于 `index.html`——`/shop/a.html`、`/shop/x/y/z.html` 等任意静态文件直开同属此列。`default: true` 在此不生效是有意设计：它是「缺省展开」机制（根路径 `/` 下展开默认子路由、父路由完全匹配后展开默认子链），不覆盖非根路径的 unmatched——URL 明确指向不存在的路径时，框架不替用户猜。载体直开与 404 的区别在于：前者**不含任何路由信息**，后者含（但无路由命中）。

## 决策

### 决策 1：入口文档的检测规则 = 原始 pathname 以 `.html`/`.htm` 结尾（修订：原为 `/index.html` 结尾）

attach 初始导航时，对**原始 pathname**（剥离 base 之前）判定 `.html`/`.htm` 后缀——扩展名集合与 `getBaseUrl` 一致，大小写精确匹配。覆盖任意静态前缀（`/public/shop/index.html`）、publicDir 映射路径（`/shop/index.html`）、深层文件（`/shop/x/y/z.html`）、根部署（`/index.html`）。

### 决策 1a：先试匹配后归位（修订新增）

`.html` 结尾先走一次真实匹配（attach 时路由表已加载完毕，成本一次同步调用）：**匹配命中**（路由 path 真带 `.html` 的合法场景，如 `docs/help/faq.html` 风格路由）正常渲染不劫持；**仅 unmatched 才归位**。试匹配的输入与 `onRouteUpdate` 同构（base 剥离后的路径 + search）；真实匹配判定看 toRoute 首项（根路由 route 恒有值）之后。

### 决策 2：命中即 `home()`——地址栏归位 base 根

检测命中后调用 `home()`（`replace(joinPath(base, options.home))`）：地址栏从载体 URL 归位为 base 根，replace 不留历史（后退不会回到载体 URL）；首页展开复用既有根级 default 机制，与用户手输 base 根完全同路径。不做「只归一化匹配、不改地址栏」——地址栏与应用路径空间脱节会让后续 `push` 的 URL 语义分裂。

### 决策 2a：base 自动推断 = `getBaseUrl` 既有机制（修订新增，点名配合关系）

未显式设置 base 时，构造期缺省 `base: getBaseUrl()` 已实现「入口文件所在目录即 base」：`/shop/a.html` → `/shop/`、`/shop/x/y/z.html` → `/shop/x/y/`、根部署 `/index.html` → `/`——**目录规则**（`.html` 文件名剥除后保留所在目录，带尾斜杠）。显式传入 base 时覆盖缺省（显式权威）：任意 `.html` 直开归位显式 base 根（shop example：`/public/shop/index.html`、`/shop/a.html` 均落 `/shop`）。归位机制与推断机制零耦合——`home()` 只消费 `options.base`，推断在构造期已完成。

### 决策 3：仅 attach 初始化检测一次，双模式统一

入口文档检测只作用于 attach 的初始导航分支；运行中导航到 `.html` 结尾的 URL 按正常匹配走（匹配不到是 404 场景，不拦截）。history/hash 两种模式统一走此检测。

### 决策 2b：动态入口的 base 信号源优先级（同日第二次修订新增）

服务端入口 HTML 非静态文件而是动态渲染时（URL 形如 `/shop`，无文件名），单段目录形 URL 恰为 `getBaseUrl` 目录规则的正确输入（`/shop` → `/shop/`），attach 根判定直接走 `home()`——直开已天然工作。真实缺口是**深层动态直达**：服务端对任意路径（SPA fallback）都返回同一份入口 HTML 时，未显式 base 下 `/shop/products` 刷新会被 `getBaseUrl` 误判 base=`/shop/products/`（路由路径当目录）→ `currentPath=""` → 渲染根，深层直达断裂。

根因是信息论边界：URL 本身不携带「应用前缀到哪里结束」的信号，必须引入 URL 之外的信号源。base 缺省链定为：

```
显式 options.base > 文档 <base href> 标签（getDocumentBase）> getBaseUrl() URL 推断 > "/"
```

`<base href>` 是 HTML 标准机制：SSR 模板注入一处（服务端天然知道挂载路径），router 全自动读取，顺带修复动态入口页相对路径资源的解析。**仅当页面真有 `<base>` 标签时才采纳**——无标签时 `document.baseURI` 等于文档 URL（含路由路径），采纳会把路由路径误当 base。base 键同时移出构造 defaults、改为条件填充：显式传 `undefined` 视为未设置（不再覆盖推断值）。

动态入口五形态行为总表：

| 场景 | URL | base 来源 | 行为 |
|---|---|---|---|
| A | `/shop` 直开 + 显式 base | 显式 | 根判定 → home()，已工作 |
| B | `/shop` 直开 + 未显式 base | getBaseUrl 目录推断 | 同上，已工作 |
| C | `/shop/` 直开（带尾斜杠）| 同 A/B | 已工作 |
| D | `/shop/products` 深层直达 + 显式 base | 显式 | 正常匹配（SPA 标准场景） |
| E | `/shop/products` 深层直达 + 未显式 base | **`<base href>` 标签**（本次修复） | 无标签时断裂（误判目录）；有标签正常匹配 |

## 备选方案

- **unmatched 全量兜底到首页**：否——404 与载体直开是不同语义，前者应显示 404 视图（errorPages 404 机制，存目待议），全量兜底会吞掉死链接的可观测性。
- **配置开关**：否——直开载体停在空白页没有任何合理诉求，默认开启无害（YAGNI）。
- **匹配层 URL 归一化**（把 `.html` 结尾的 URL 归一为目录路径再匹配）：否——地址栏保留载体 URL 的状态下应用内导航会分裂出两套 URL 空间，且与 history 状态恢复（刷新/前进后退）交互复杂。
- **无条件归位（不试匹配）**：否——路由 path 带 `.html` 的合法应用直开即被劫持；先试匹配成本一次同步调用，消灭误伤面。

## 后果

- 正面：静态托管/入口页链接/书签的任意 `.html` 直开形态均自动落地 base 根首页；未显式 base 的应用自动以入口文件目录为应用根；`default` 机制语义保持纯净（缺省展开，不兼做兜底）。
- 代价：直开载体后浏览器历史中载体 URL 被 replace 掉（不可后退到它）——符合预期，载体 URL 不是可导航状态；`.html` 直开多一次同步匹配调用。
- 遗留：unmatched（真 404）时出口区静默空白仍存目，待 errorPages 404 集成时一并解决。
