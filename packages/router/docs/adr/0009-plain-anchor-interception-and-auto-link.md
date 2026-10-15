# ADR-0009：全局 `<a>` 链接拦截与 `auto-link` 更名

- **状态**：Accepted
- **日期**：2026-10-15
- **关联**：[CONTEXT.md](../../CONTEXT.md)（auto-link / 全局链接拦截）、[ADR-0006](0006-entry-document-navigation.md)（base 推断链）、[ADR-0008](0008-renderer-pipeline-and-raw-channel.md)（渲染器管线）

## 背景

文档级点击委托此前只认 `autospark-link` 自定义元素（`instanceof` + `closest("autospark-link")`）：普通 `<a href>` 指向内部路径时触发浏览器整页跳转，应用内链接必须逐个改写为组件才能获得 SPA 导航。业界路由器（react-router / Nuxt / SvelteKit）均默认拦截普通 `<a>`，组件只承担增强职责。

同时 `autospark-link` 命名冗长；`autospark-*` 前缀体系（ADR-0001）下组件标签与 `autospark.outlet` engine 组件、`data-autospark-*` 属性混用，链接组件作为最高频书写的标签值得更短的名字。

## 决策

1. **文档级委托扩展为双路径**（`_handleDocumentLinkClick`）：组件路径优先（命中 `auto-link` 调用其 `handleClick`，保留 `to`/`replace`/base 前缀语义），无组件命中时走 **plain `<a>` 拦截**。已被 `preventDefault` 的事件跳过，避免重复导航。

2. **放行矩阵**（对齐业界惯例，交还浏览器默认行为）：
   - 修饰键（meta / ctrl / shift / alt）与非左键（`button !== 0`，中键/右键）
   - `target` 非 `_self`（含 `_blank`、`_top`、命名窗口）
   - `download` 属性存在
   - `rel` 含 `external`（token 级匹配，兼容 `rel="external noopener"` 组合）
   - 非 http(s) 协议：`mailto:`、`tel:`、`blob:` 等（URL 解析后按 `protocol` 判定）
   - 纯页内锚点（`href` 以 `#` 开头；hash 模式下 `#/x` 由 hashchange 监听自然接管，无需拦截）
   - 跨域链接（`origin` 不同）
   - 无 `href` 的 `<a>`（浏览器本就不当链接）
   - 唯一例外：**危险协议**（`javascript:` / `data:`，对齐组件侧 T-02-01）——`preventDefault` 且不导航

3. **接管语义**：plain `<a>` 无 replace 表达，统一 `push`；目标 = `pathname + search + hash`，pathname 经 `removePathPrefix` 剥除 base 前缀（与组件 push 裸路径的语义对齐）。相对 href 先按当前文档 URL 解析为绝对路径。

4. **宿主边界**：锚点必须位于本 router 宿主子树内（`host.contains`）——多 router 并存时各管各的子树；组件路径维持既有「事件路径越出 host 即停」规则。

5. **组件定位**：`auto-link` 从「导航必需品」降级为**可选便捷层**——普通 `<a>` 零成本获得 SPA 导航；组件保留三项不可替代职责：**base 前缀自动化**（渲染期生成真实可爬的内层 href，路由拦截改不了静态 DOM）、**`replace` 声明**、**`target="_blank"` 自动 `noopener noreferrer`**。

6. **更名**：`autospark-link` → `auto-link`（`customElements.define`、`HTMLElementTagNameMap`、委托的 `closest` 选择器同步）。类名 `AutoSparkLink` 与导出面不变。

## 后果

- 应用内普通 `<a href="/path">` 无需任何改造即获得 SPA 导航；组件仅在需要 base 自动化、`replace` 或静态 SEO href 时使用。
- hash 模式下 `#/x` 形态链接不经拦截、由既有 hashchange 链路接管，行为不变；无 `#` 的同源路径反而被接管并转为 hash 写入，整页刷新消失。
- `example` 下 22 个 html/css 文件的引用随更名批量迁移；`docs/public/autospark-router.js` 为构建产物，待下次构建自然刷新；ADR-0002 内的历史提法按惯例不改写。
- 测试基座修正三处预存错误后全绿（41/41）：attach 异步未等待、`routes.current` 实为 matched 数组（断言需取末项）、mitt 事件不派发 DOM（`navigation/start` 类断言改走真实委托派发）。
