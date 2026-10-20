# ADR-0121：远程加载统一内核（AsyncLoader 编排，重试/超时/缓存/错误归一）

- **状态**：Accepted（grill-with-docs，两轮收敛）
- **日期**：2026-10-20
- **关联**：[ADR-0033](0033-x-data-async-source.md) / [ADR-0035](0035-x-html-async-source.md)（异步源家族与 AsyncSourceRunner）、[ADR-0022](0022-x-component.md)（x-import / fetchHtml）、[ADR-0065](0066-x-component-remote-loader.md)（x-component loader）、[ADR-0060](0060-x-isolate-v2.md)（x-isolate remote）、[ADR-0058](0058-icon-symbol-and-icon-domain.md)（x-icons 远程源）、[ADR-0118](0118-x-error-directive.md)（x-error 错误源分流）、[CONTEXT.md](../../CONTEXT.md)（「远程加载内核」「load 错误源」「retry 动作」「全局出站口」词条）

## 背景

引擎六处远程加载各自为政：异步 x-data/x-html（AsyncSourceRunner.fetchUrl）、x-component loader（`_runLoader` 状态机 + engine.importComponentsFromUrl）、x-import（signal 未透传——abort 空转）、x-isolate remote（**内联 fetch，未复用 fetchHtml——漂移**）、x-icons（fetchIconifySet 手写 in-flight 合并 + TTL localStorage 层）。后果：fetch 包装 + abort/竞态/destroyed 守卫语义重复实现六处；自动重试仅 x-component 一家有（手写）、全家族无 timeout；错误呈现五种姿态（$error 元键 / 内部 lastError / error 占位组件 / warn 静默 / 硬编码「模板加载失败」div）；x-fallback 同名词双语义（x-data 编译态 vs x-html 静态克隆态）。

关键事实：engine 已依赖 `asyncsignal`（^1.0.1），其 `AsyncLoader` 封装「加载 + 缓存 + 中止 + 超时 + 重试」五类能力，router 的 DataLoader 已生产使用（retry/timeout/cache/multiplex/abortSignal/storage 全套在用）。

## 决策

### 1. 内核选型：AsyncLoader 为统一执行内核，家族适配层管物种

六处远程加载全部编排到 `AsyncLoader`：**家族适配层**管「形态判定 + watch 接线 + 产物消费 + 错误归一」，**AsyncLoader** 管「怎么取」（中止/超时/重试/缓存/multiplex/生命周期回调）。指令实例的每次加载意图 = 一个 AsyncLoader 实例；url 响应式变化 = abort 旧 loader + 新建（lastUrl 判重保留在适配层）。

```
指令选项（retry / retryDelay / timeout / cache / request / method / header）
        │
┌───────┴────────────────────────────────────────────┐
│ 家族适配层（形态判定 + watch + 产物消费 + 错误归一）    │
│  AsyncSourceRunner（x-data / x-html，钩子契约不变）   │
│  x-component._runLoader │ x-import._load            │
│  x-isolate._loadUrl     │ x-icons fetchIconifySet   │
└───────┬────────────────────────────────────────────┘
        │ loaderFn(args: {abortSignal, meta}) + options
┌───────┴──────────┐
│ AsyncLoader      │ 中止/超时/重试/缓存/multiplex/onPending等回调
└───────┬──────────┘
        │ (url, init)
┌───────┴────────────────────┐
│ engine.options.fetcher     │ 全局出站口（决策 8，缺省 = fetch）
└────────────────────────────┘
```

`AsyncSourceRunner` **保留类名与钩子契约**（responseParser/onLoading/onResult/onError 不变），内部 fetch/action 编排改走 AsyncLoader；生命周期回调映射：`onPending` → onLoading、`onFulfilled` → onResult、`onRejected` → onError。

### 2. 范围

收编六处：异步 x-data、异步 x-html、x-component loader、x-import、x-isolate remote、x-icons 远程源。**x-for 仅设计预留**（适配层声明「即持即用」姿势，本 round 不实现直接远程源——x-data 异步 + x-for 组合已覆盖远程列表，x-for 值语义是表达式，直接 url 源有形态歧义）。router 已在用 AsyncLoader，词汇对齐、实现不动。x-icon 本体无远程通道（ADR-0047 已被 ADR-0058 取代，远程加载收敛在 x-icons 声明处）。

### 3. 重试语义：对齐 AsyncLoader 平坦模型

- 配置 `retry: number`（默认 **0，行为零变化**）+ `retryDelay: number`（默认 0，**平坦间隔**）；选项名与 router dataLoader 一致；
- **除主动 abort 外全错误重试**（含 4xx / 解析错误——AsyncLoader 无错误分类钩子，接受简化语义并文档标注；未来需要再上游增强 asyncsignal）；
- 超时（`timeout`，默认 0）算可重试失败；主动 abort（url 变化 / destroy / 导航取消）不重试、不算错误；
- **action 形态对称接入**：loaderFn = action 调用，重试 = 重新调用 action；timeout 语义 = 「放弃等待」（无法真中止同步执行中的 action），文档写明。

### 4. 手动重试：统一 retry action

全家族统一注入 `retry` action 到宿主 `scope.actions`，执行体 = `loader.refresh()`（正在加载先中止再重启）。错误占位、x-fallback、自定义错误模板内 `@click="retry"` 触发。x-component 内置 error 组件的 retry/close 改为同源实现（消灭手写 `_loadedUrl = null` 重跑）。错误呈现注入数据契约为 ADR-0118 同款 `{ error, message, retryable, closeable, actions }`。

### 5. 错误归一与呈现：默认呈现保持 + x-error 第三错误源

**统一错误对象**：家族适配层将最终错误（重试耗尽）归一为：

```
{ name, message, url?, statusCode?, source: "load" }
```

`source:"load"` 与 ADR-0118 的 `raise` / `action` 并列为第三错误源；statusCode 经 loader `meta` 透出。

**呈现分派**（决策原则：数据态归各指令，呈现可被 x-error 接管）：

| 指令 | 数据态 | 默认呈现（无 x-error） | x-error 在场 | 手动 retry |
|---|---|---|---|---|
| x-data | `$error` 元键（响应式） | x-fallback（编译态，读元键 `$error`）+ warn | x-error 接管呈现，元键照写 | ✅ |
| x-html | 内部 lastError | x-fallback（编译态，局部注入 `$error`）+ warn | 同上 | ✅ |
| x-component | — | error 占位（自定义 / 内置 error 组件，契约注入） | 同上（error 占位退位） | ✅ |
| x-import | — | 无呈现（声明式，仅 warn） | 错误事件照派（可捕获） | ❌（无宿主呈现面） |
| x-isolate | — | 宿主错误块（升级为统一契约注入，`x-isolate-options.error` 自定义占位对齐 x-component） | 同上 | ✅ |
| x-icons | — | registry 缺省姿态（图标缺省 + warn） | 不派发（资产层，无宿主语义） | ❌ |

新错误产生（新一轮请求 onPending）即清上一轮错误（x-data「发起时清 `$error`」语义全家族对齐）。主动 abort 静默丢弃不呈现。

### 6. x-fallback 统一编译态

x-html 的静态克隆通道退役，两侧统一为编译态（可插值）：x-data fallback 读数据域 `$loading`/`$error` 元键；x-html fallback 编译时局部注入 `$error`/`$loading`（无数据域可落）。**行为变化点**：x-html 静态 fallback 中的 `{{}}` 从原文显示变为求值——文档与迁移说明标注。

### 7. fetch 参数通道：request 权威 + 简写糖

`request`(RequestInit) 为权威整包通道（fetchHtml / ADR-0065 现状）；`method` / `header` 保留为便捷简写（AsyncSourceRunner 现状），合并规则 **request 显式键优先**，全家族统一支持两者。

### 8. 全局出站口：engine.options.fetcher

`fetcher: (url, init) => Promise<Response>`（缺省 = 原生 fetch）：全部远程加载的统一 fetch 替换点，内核 loaderFn 内单点调用。统一鉴权头 / mock / 测试注入零成本，与 `engine.options.sanitizer` 注入先例同构。

### 9. 指令级缓存 + x-icons 迁移

- `cache` 选项（毫秒 TTL，默认 0 不缓存）随内核赋予 x-data / x-html / x-isolate / x-component（AsyncLoader `cache` + `hash` 白得；hash = 归一化 url）；
- x-icons `fetchIconifySet` 迁移：手写 `jsonCache`（in-flight Map）→ `multiplex: "share"`；手写 persistGet/Put/Lookup（localStorage TTL 层）→ `IStorage` localStorage 适配器；「失败不落缓存」= AsyncLoader 天然语义。

### 10. 顺带修复

① x-import 透传 signal 到 `importComponentsFromUrl`（修 abort 空转）；② x-isolate remote 弃内联 fetch 走内核（消漂移）；③ x-import **不加** loading 呈现（声明式无 DOM，保持纯净）。

## 被否决的方案

- **自研 RemoteRequest 内核**：asyncsignal 五类能力白得、router 已同源生产验证、自带测试；自研是重复建设。
- **指数退避 / 错误分类重试（4xx 不重试）**：AsyncLoader 无此能力，为它扩展上游或指令侧包装均为过度设计；平坦间隔 + 全重试的简化语义够用且与 router 一致。
- **全部错误路由到 x-error（替换各指令默认呈现）**：x-isolate 错误块、x-component error 占位是宿主级合理形态，全推 x-error 是行为大改；「默认呈现 + 可选接入」保留双轨。
- **单一巨型统一执行器（五家全走一个类）**：产物（JSON/文本/组件注册/子引擎）与呈现差异真实存在，钩子面会爆炸。
- **x-for 直接远程源**：值语义歧义（表达式 vs url 判定），组合已覆盖，YAGNI。
- **策略工具集（只发工具函数不收编执行）**：放任六处 abort/竞态实现继续漂移（x-isolate 不用 fetchHtml 即前车之鉴）。

## 后果

- ✅ 重试 / 超时 / 缓存全家族白得；fetch 包装 + 竞态/abort 语义六处收敛为「内核 + 适配层」；
- ✅ 错误呈现词汇统一（ADR-0118 契约 + source:"load"），x-error「一处声明、统一呈现」成立；
- ⚠️ 4xx / 解析错误也会自动重试（简化语义，文档标注）；retryDelay 无退避；
- ⚠️ x-html 静态 fallback → 编译态是行为变化（`{{}}` 开始求值）；
- ⚠️ action 形态的 timeout 只是「放弃等待」，不能中止执行中的 action；
- ⚠️ 指令层对 asyncsignal 的依赖从 router 专属扩展为 engine 指令级依赖（包依赖已存在）。
