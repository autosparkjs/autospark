# ADR-0003：outlet 组件 props（keepAlive/mode）、tabs 模式内建与数据域驱动面

- **状态**：Accepted
- **日期**：2026-10-13
- **关联**：[CONTEXT.md](../../CONTEXT.md)（渲染层词条、已废弃词条节）、[ADR-0002](0002-engine-render-pipeline.md)（本 ADR 修订其决策 2 的驱动面与决策 7 的 tabs 存目）、engine [ADR-0032](../../../engine/docs/adr/0032-data-script.md)（autospark/data script 通道不动）

## 背景

ADR-0002 将渲染载体换为 `autospark.outlet` engine 组件时，出口无 props：缓存仅由路由项 `keepAlive` 声明且默认 true，tabs/collapse 布局退役存目。随后的使用暴露三处缺口：① 应用需要出口级缓存默认值——嵌套出口各自缓存策略不同（如根出口 stack + 嵌套出口 tabs 的组合）；② tabs 需要路由语义——页签标题取自路由 `title`、激活态与 URL 联动，纯布局件组合做不到，故 tabs 无法按 ADR-0002 设想「待 engine 布局件组合重建」；③ outlet 的 methods 驱动面（mountView / mountEphemeral / activateView）是命令式接缝，与 engine 响应式数据域体系不一致。

## 决策

1. **出口承接两个 props**：`keepAlive: boolean`（默认 **false**）与 `mode: 'stack' | 'tabs'`（默认 `stack`）；嵌套出口各自独立配置。`<div x-outlet>` 简写的值透传为 props 表达式，与 `x-component:autospark.outlet` 完整形态带值写法等价。
2. **KeepAlive 优先级两级化**：出口 `mode=tabs`（全视图常驻，临时通道不启用）> 路由项 `keepAlive` 显式声明 > 出口 `keepAlive` prop（默认 false）。**默认翻转属 breaking**：路由与出口均未声明时不再缓存（ADR-0002 时代默认缓存）。
3. **tabs 模式内建**：经典页签条 + 单 active 面板；页签标题取路由 `title`、缺省回退 hash；页签顺序按访问追加；点击页签走 router 导航（URL 保持唯一真相源，禁止仅本地切换 active）。
4. **页签可关闭**：关闭即销毁对应视图缓存（与浏览器标签页语义一致，不做隐藏不释放）；关闭 active 页签导航到相邻页签；唯一页签禁用关闭。**已知代价**：关闭非末尾页签触发 x-for 索引位移，其后所有视图项因子树重建语义而重编译、运行态丢失——接受并在文档中明确说明。
5. **页签样式内建 + 可重载**：组件经 injectStylesheet 全局注入 tab 条样式，以标准 CSS 自定义属性与类钩子提供重载能力；不引入 Shadow DOM 边界。
6. **驱动面更换：methods → engine.data**：router 渲染层经 `engine.data(outletEl, …)` 直写组件数据域，废弃 mountView / mountEphemeral / activateView 命令式 methods。数据域只放**视图清单**（append-only 的 `{hash, html, ready, title}` 条目 + `active`）与临时视图槽——**不放缓存簿记**：缓存纯由 DOM 常驻 + x-show（display:none）承担。tabs 页签条 x-for 视图清单响应式渲染。
7. **路由数据通道不动**：loader 数据与 `$params/$query/$state` 维持 `<script type="autospark/data">` 注入通道（ADR-0032，per-view——两个缓存视图各有自己的 `$params`，outlet 单例数据域放不下 per-view 数据）；outlet 数据域只携带页签元数据（hash/title/active）。

## 后果

- ADR-0002 决策 7 修订：tabs 以出口 `mode` prop 内建复活；collapse 仍存目。决策 2 的「router 经 methods 驱动」由决策 6 取代。
- Breaking 集中在 0.0.0 零外部消费者窗口内完成：keepAlive 默认翻转、methods 驱动面移除。
- engine 零改动：x-for / x-show / x-html.compile / engine.data 均为现成能力。
- 页签关闭的索引位移代价是 x-for 复用语义的固有结果，属文档化限制而非缺陷。
