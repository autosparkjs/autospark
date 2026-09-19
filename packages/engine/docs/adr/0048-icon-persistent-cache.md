# ADR-0048：远程图标持久缓存（localStorage）+ prefetch 预取

- **状态**：Accepted（grill-with-docs，一轮九问全按推荐裁决）
- **日期**：2026-09-19
- **关联**：[ADR-0047](0047-x-icon-async-source.md)（远程物种与四层缓存/限流——本 ADR 在其上叠加持久层）、[ADR-0046](0046-x-icon-directive.md)（渲染管线/规范形）、[CONTEXT.md](../../CONTEXT.md)（「远程图标持久缓存 / 图标预取」词条）

## 背景

远程图标（ADR-0047）现有四层：模块级内存缓存 → in-flight 合并 → 并发限流（4 路，429 退避）→ 浏览器 HTTP 缓存。痛点：**冷启动可见延迟**——每图标一次网络往返（HTTP 缓存命中也逃不过请求延迟）、4 路排队（32 图标页第 33 个要等 8 波）、429 惩罚期退避秒级等待。图标本体是规范形 SVG 文本（0.5~2KB/个），量级天然适合轻量持久化。

接缝：① 验收目标（二次访问零网络）；② 载体（localStorage / IndexedDB / Cache API）；③ 存储布局与写入策略；④ 键空间是否含 baseUrl；⑤ 失效与容量；⑥ 注水时机；⑦ 预取 API 形态；⑧ 开关与降级；⑨ 文档处置。

## 决策

### 1. 目标与层级定位：五层缓存

**二次访问零网络请求、同步渲染**（持久层命中即走内存通道，观感等同 `x-icon-define` 本地图标）。层级：内存 → **持久（本 ADR 新增）** → in-flight 合并 → 限流 → HTTP。

### 2. 载体与布局：localStorage 单键 JSON + 写节流

`localStorage["autospark:icons:v1"]`，值为**按源分组的两层 map**（`{ [baseUrl]: { "prefix/name": svg } }`，见决策 3）。写入**节流 300ms 批量落盘**（一批取回只写一次）。localStorage 的同步读特性使「注水先于任何渲染」免费成立（决策 6）；图标量级（百 KB）远在 5MB 配额内。

### 3. 键空间：持久层含 baseUrl，内存层维持现状

`mdi/home` 从 Iconify 与从自建服务取可能不同图——持久化键含 baseUrl（按源分组）防换源串图；内存层维持 `prefix/name`（运行期 baseUrl 单值，无串源窗口）。**注水只取当前源组**（取别的源组反而制造串源）。

### 4. 失效与容量：无 TTL + 500 条 LRU + 配额降级

无 TTL（Iconify 图标版本不可变，ADR-0047 已载）。容量上限 500 条，LRU 靠 Map 插入序实现（命中 delete+set 刷新新旧，无独立时间戳元数据）。`QuotaExceededError`：淘汰最旧一半重写一次，再失败则本会话停写（静默，行为退回无持久层）。

### 5. 注水：模块初始化同步注水

模块 init 一次 `JSON.parse` 全量进内存 remoteCache（几十 KB 亚毫秒级，换零时序问题）；只注当前 baseUrl 的源组。

### 6. 预取：`AutoSpark.icons.prefetch(name | names)`

编程入口（字符串或数组）：静默失败（无人消费其错误，仅走限流槽与退避）、结果落内存 + 持久层。持久化只救二次访问，**首次访问的延迟只能靠提前取**——需要预知的场景（下一屏、悬停目标）编程入口已覆盖。不做模板声明式 preload 与构造 `options.preload`（YAGNI）。

### 7. 开关与降级：`AutoSpark.icons.persist`，默认开

registry 上的布尔开关。无 localStorage（SSR `typeof` 守卫）/ 隐私模式 / 读写抛异常——一律**静默降级**回现状四层，不抛错不 warn。

## 被否决的方案

- **IndexedDB**：异步读写，注水错过首屏渲染窗口（目标 1 达不成）；容量优势在图标量级下无用武之地。
- **Cache API**：面向 HTTP Response / Service Worker 场景，库形态用不上。
- **逐图标一键存储**：读写碎片化、配额检查复杂；单键 JSON + 节流更 KISS。
- **TTL 失效**：图标版本不可变，人为过期只损失命中。
- **模板声明式 preload / `options.preload`**：与编程 prefetch 场景重叠（YAGNI）。
- **storage 事件跨标签合并**：多标签并发写采用 last-write-wins（丢增量窗口极小），文档化 caveat 而非加锁。

## 后果

- ✅ 二次访问零网络、同步渲染——远程图标观感等同本地图标。
- ✅ prefetch 让首次访问的「提前量」可编程规划（闲时/悬停预热下一屏图标）。
- 🔴 持久层新增 localStorage 占用（自限 500 条 LRU，约 1MB 上界）。
- ⚠️ 多标签并发写 last-write-wins：极端情况下丢同窗口他标签的新增条目（下次访问自动补回）。
- ⚠️ 换源后旧源组条目滞留（占用 LRU 名额，至自然淘汰；不做手动清理 API，YAGNI）。
- ⚠️ 测试环境需注意 localStorage 跨用例残留（按用例清理存储键）。
