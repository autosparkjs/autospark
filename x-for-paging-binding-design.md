---
name: x-for-paging-binding-design
description: x-for.paging 的 :data-paging 绑定增强设计盘问（/grilling）进行中的状态快照，含已定决策与待答问题 Q5~Q8
metadata: 
  node_type: memory
  type: project
  originSessionId: 39b045be-0a9c-47f9-abd1-256533f752c8
  modified: 2026-09-18T09:38:52.074Z
---

# :data-paging 绑定增强 — grilling 会话快照（2026-09-18 暂停）

## 背景

用户要求 `:data-paging` 提供更完整的绑定（page/pageSize/pageCount/hasMore）。前置 bug 已修复并落地：
- `for.ts` 翻页 watcher 曾把 `{ value }` 包装对象当数字用（`Number({value})` → NaN → 翻页静默失效），已改为解包 `payload?.value`，并在 pageCount>0 时钳位越界页码
- 回归用例已转正进 `x-for-paging.test.ts`（翻页/钳位/pageSize 重置），全量 1067 测试通过
- IIFE 产物已重建（docs/public/autospark.js）

## 已查证事实（无需重查）

- `_syncPagingToBinding()`（for.ts:955）已回写 7 字段：page、pageSize、pageCount、hasMore、loading、error、total
- page 可写（钳位翻页）、pageSize 可写（重置第 1 页）；其余 5 个为只读派生（外部写被覆盖、无提示）
- **total 失真**：`total = pageCount × pageSize` 公式值（23 条 pageSize=5 显示 25）
- **绑定对象缺失空洞**：`:data-paging` 引用的对象未在 state 声明时静默 no-op
- 客户端模式 pageCount 在每次 render 的 readItems() 里由 `ceil(arr.length/pageSize)` 重算回写

## 已定决策

- Q1 = A+B：引擎行为已闭环，剩余工作 = demo 完整展示 + 绑定契约钉死（文档）
- Q3 = A：绑定对象缺失时自动创建（位置：ForDirective `created()`，首次同步前，经 `engine.store.state` 响应式代理按路径写入完整初始对象 `{page:1, pageSize:<options 解析值>, pageCount:0, hasMore:true, loading:false, error:null, total:0}`）
- Q4 = A：total 双模式精确化——客户端用全量数组长度真值；服务端 loader 契约增加可选 `total` 字段（向后兼容），ADR-0042 契约需补
- Q2 部分定：hasMore 只读；**pageCount 用户要求可读写，语义未澄清**（用户例子「调节分页大小」疑似指 pageSize）

## 待答问题（下次会话从此继续）

- **Q5 pageCount 可写语义**：A=保持只读（推荐）；B=写入作翻页上界 cap（内部 `_pageCountCap`，防 render 回写覆盖，需联动钳位/hasMore/$pageCount 三处）；C=覆盖钉住（不推荐，items 变化失真）
- **Q6 自动创建范围**：A=多级路径全段创建（推荐）；B=仅一级，中间段缺失 warn
- **Q7 loader total 推导边界**：A=仅展示；B=返回 total>0 且未返回 pageCount 时推导 `pageCount=ceil(total/pageSize)`（推荐，钳位/hasMore/$pageCount 自动受益）；C=另建 hasMore 规则（不推荐）
- **Q8 demo 展示范围**：A=paging-basic 加四字段 tag + paging-data-binding 展示全 7 字段并标注只读（推荐）；B=只改 data-binding；C=只改快速入门

## 既定后果（不另设问）

- 文档 `docs/zh/guide/directives/x-for-paging.md` 更新：`:data-paging` 绑定契约表（字段/方向/语义）、autoCreate 行为说明、Loader 契约补 `total`
- 涉及文件：`packages/engine/src/directives/presets/for.ts`、ADR-0042、`docs/demos/for/paging-basic.html`、`docs/demos/for/paging-data-binding.html`
