# ADR-0123：覆盖物内容宿主双委托（x-component / x-html.compile）与 raise 错误通道

- **状态**：Accepted（grill-with-docs，五轮收敛 Q8–Q13）
- **日期**：2026-10-20
- **关联**：修订 [ADR-0119](0119-overlay-keepalive-key-remote-url.md)（决策 3「url 远程加载双路径」与决策 4「shell-only 构建 + 延迟内容附加」的**实现形态**被本 ADR 取代；keepalive / key / 缓存身份决策 1/2 与「失败不进缓存」精神保留）、[ADR-0052](0052-x-overlay-and-x-dialog.md)（覆盖物组件化消费模型）、[ADR-0062](0062-overlay-shell.md)（shell 机制——内容宿主编入 shell 出口）、[ADR-0110](0110-x-component-value-semantics.md) / [ADR-0022](0022-x-component.md)（x-component 值语义 props 通道 + pending 占位 R6=B——委托目标一）、[ADR-0035](0035-x-html-async-source.md) / [ADR-0017](0017-x-html-compile.md) / [ADR-0122](0122-remove-x-fallback.md)（x-html.compile url 形态、子模板编译与 `$error` 元键——委托目标二）、[ADR-0118](0118-x-error-directive.md)（x-error / raise——错误通道）、[ADR-0085](0085-component-registered-event.md)（component/registered 事件——pending 重试既有能力）、[ADR-0066](0066-x-component-remote-loader.md)（x-component url loader——经本 ADR 悬置，不介入 overlay）、[ADR-0121](0121-remote-load-kernel-asyncloader.md)（远程加载内核——委托后 overlay 内容加载经 x-component / x-html 家族适配层自然接入）

## 背景

ADR-0119 落地「url 远程加载：组件优先、片段兜底」后，overlay 侧沉淀了一整套自有远程机制：指令层 `_openRemote` / `_loadRemoteFor` 双路径分流 + 实例层 `openRemote` / `attachRemote` / `attachFragment` / `failRemote` / `beginRemoteReload` 五段生命周期 + 骨架化占位锚 + 自建 error 占位 + props 暂存 + 片段文本缓存。这套机制与 x-component（本地实例化 / pending 重试）和 x-html.compile（url fetch / 竞态 / 元键）的能力大面积平行，暴露出三个结构性问题：

1. **能力漂移**：x-html / x-component 经 ADR-0121 接入 AsyncLoader 内核后获得统一的中止 / 超时 / 重试 / 缓存语义，overlay 自有远程路径仍是一次性 fetch——同一 url 两种加载语义，内核侧的能力演进 overlay 永远慢一拍；
2. **错误通道分裂**：overlay 自建 error 占位（ADR-0018 契约直用、actions 手写），与 ADR-0118 x-error / raise 边界、ADR-0121 load 错误源归一均不连通——面板内错误无法被 x-error 边界接管；
3. **pending 双轨**：x-import 未就绪时 overlay 走 `_waitForComponent` 不开面板（仅 warn），与 x-component 的 pending 占位 + component/registered 重试（ADR-0022 R6=B）语义不一致——同一组件「模板内引用」与「overlay 打开」两种体验。

用户裁决：overlay 不再自渲染内容，改为**生成内容宿主元素编译进 shell 出口**——内容渲染全委托 x-component（组件 / pending）与 x-html.compile（片段）两个既有指令，overlay 只保留探测管线（同名 x-define 判定）与错误桥（raise）。

## 决策

### 1. 统一时序：三态一律 shell 先开

本地组件 / 远程 url / pending（x-import 未就绪）三态**一律先开 shell 面板**（ADR-0119「面板先开」从远程专属推广为全家族时序），内容宿主元素作为 shell 默认出口的 live 插槽段编入。pending 从「不开 shell 只 warn」改为 shell 先开 + x-component pending 占位（ADR-0022 R6=B 既有能力），warn 保留。

### 2. 内容宿主三态（生成宿主元素，渲染全委托）

overlay 按组件注册状态生成宿主元素，以消费处 scope 为父编译进 shell 出口（compileChild 程序化编译——shell 面板 rootless 挂 body 容器，数据基准不变）：

- **组件已注册** → 宿主 `x-component:名称="props表达式文本"`——指令值 props 通道（ADR-0110），全契约 + 热更新；
- **未注册 + 声明 url** → 先走**探测管线**（保留 ADR-0119 的 importComponentsFromUrl：fetch + 解析 + 注册到消费处 scope + url 缓存 + 循环引用防护）：
  - 同名 `x-define` 命中 → 转**已注册形态**（x-component 本地形态；远程模板其余内容放弃——x-define 已注册备用、HTML 不渲染）；
  - 未命中 → 宿主 `x-html.compile="url文本"`——url 形态 fetch → 子模板编译（ADR-0035 / ADR-0017），`$loading` / `$error` 元键写宿主 scope localData（ADR-0122 决策 2），竞态丢弃 / 中止 / 消毒策略全继承；
- **未注册 + 无 url** → 宿主 `x-component:名称="props表达式文本"`——pending 占位 + component/registered 事件重试（ADR-0022 R6=B / ADR-0085）。

插槽投影零变化：overlay 预收集的插槽组（collectSlotGroups）克隆移入生成宿主，由 x-component 模板子级 x-slot 投影既有机制承接；片段路径无出口概念（ADR-0119 后果条款不变——声明了则 warn 丢弃）。

### 3. props 契约：组件路径走指令值通道；片段路径转换为数据域

- **组件路径**（含探测命中转的本地形态）：props 表达式文本直接作 x-component 指令值——三形态（对象字面量 / 纯状态路径 / 整包静态）+ 持续热更新契约零变化（ADR-0052 v2.3 / ADR-0110）；
- **片段路径**：模板片段**没有 props 概念**——props 求值结果转换为片段数据域（x-data 同语义），供片段内容消费：
  - **程序化注入**（不用字面 x-data 属性）：compileChild 初始 data 传 props 快照 + `_onPropsChange` 热应用 `Object.assign`（浅值比较复用），一台约 20 行的小机器；
  - 否决字面属性形态的原因：纯状态路径表达式会被 x-data 裸词 action 判定劫持；且 x-data 声明求值一次、无热更新——契约回退不可接受。

### 4. 错误通道：raise 进 x-error 边界

- **探测失败**（fetch 非 2xx / 网络错误 / 解析为空）与**片段加载失败**（watch 生成宿主 scope 的 `$error` 元键）统一 `raise(error, { retryable: true, closeable: true, actions: { retry, close } })`；
- 呈现归 x-error 边界（ADR-0118）在**面板内**：面板出口侧声明 x-error 就近捕获（探测失败时宿主尚未生成，与片段失败同一边界覆盖），错误组件契约 `{error, message, closeable, retryable, actions}`；
- `retry` = 销毁内容宿主、重走探测 / 生成（原位重载，等价 ADR-0119 beginRemoteReload 语义）；`close` = requestClose；
- **错误呈现期间关闭 = 销毁不挂起**——保留 ADR-0119「失败不进 keepalive 缓存」精神。

### 5. keepalive 准入与 url 缓存

- keepalive **打开即准入**：pending 占位挂起无害（watcher 存活，恢复后继续等注册）；
- **url 不缓存**（删除 `_fragmentCache`）：x-html.compile「同 url 各取各的」语义继承——片段路径重开自然重新 fetch（浏览器 HTTP 缓存兜底）；探测管线侧 x-import url 缓存（ADR-0022 决策六）保留。高频重开场景文档引导用 keepalive。

### 6. 删除面与保留面

**删除（overlay 指令 + 实例）**：`_openRemote` / `_loadRemoteFor` / `openRemote` / `attachRemote` / `attachFragment` / `failRemote` / `beginRemoteReload` / 占位锚机制（`_makeRemoteAnchor` / `_swapRemoteAnchor` / `_remoteOutlet`）/ `_remoteError` / `_pendingRemoteProps` / `_fragmentCache` / `_fragmentNameWarned` / `_waitForComponent` 使用与 `pendingName` / `pendingProps`；`_resume` 的 props 浅合并删除（keepalive 挂起期间 x-component props watch 存活，无需恢复时补应用）。

**保留**：shell / 遮罩 / 定位 / resize / keepalive / dataContext / cacheKey / delayClose / visible 驱动 + **探测管线**（importComponentsFromUrl）+ 片段数据域小机器（决策 3）。

**悬置与取消**：ADR-0066 x-component url loader 形态不介入 overlay（组件一律探测后本地实例化），其 error 契约是否 breaking 的议题随之**悬置**；x-component 状态信号提案**取消**——成败感知收敛于探测 await 与 `$error` watch。

### 7. 实施注记

- 生成宿主的 url / props 表达式文本写属性需转义（或程序化绑定）——防表达式内引号截断；
- 探测管线注册目标保持消费处 scope（`this.binding.parent`，x-import 同款）不变；
- x-error 边界由 overlay 在面板出口侧统一注入，用户内容无需声明。

## 被否决的方案

- **保留 overlay 自有远程路径、仅换接 AsyncLoader 内核**：五段生命周期 + 占位锚 + 错误占位的体量不会因换内核而缩小，能力漂移的根因（两套渲染路径平行演进）依旧；
- **远程一律 x-html.compile（取消探测、不做同名转组件）**：远程模板里的 x-define 声明失去意义，与 x-import 消费习惯割裂——用户裁决「同名命中转 x-component，其余放弃」（Q9）；
- **片段路径复用 x-component（片段包成匿名组件）**：为片段发明组件包装层只为统一宿主形态，代价是片段失去「直写 HTML」的轻量性，props 仍需数据域转换——收益不抵复杂度；
- **片段 props 用字面 x-data 属性注入**：纯状态路径形态被 x-data 裸词 action 判定劫持、求值一次无热更新（决策 3）；
- **错误沿用 overlay 自建 error 占位（ADR-0119 现状）**：与 x-error 边界、load 错误源归一分裂，actions 契约手写维护——ADR-0119 决策 3 失败语义被本 ADR 取代；
- **立即推动 ADR-0066 url loader 接入 overlay**：url loader 是 x-component 值专职 props 后的边缘形态（ADR-0110），overlay 探测后本地实例化已覆盖需求——loader 形态维持不介入。

## 后果

- ✅ overlay 内容渲染零私有路径：组件 / pending / 片段三态分别复用 x-component 与 x-html.compile 的**全量能力**（AsyncLoader 内核的中止 / 超时 / 重试、pending 重试、竞态丢弃、元键、消毒策略）——能力漂移类 bug 从根上消除，内核演进自动继承；
- ✅ 错误通道归一：x-error 边界接管面板内错误呈现，raise 契约复用 ADR-0118，retry / close actions 标准化；
- ✅ 决策 6 删除清单（五段生命周期 + 占位锚 + error 占位 + 暂存/缓存字段）对一台约 20 行的片段数据域小机器 + 宿主生成 / 探测分流逻辑——覆盖物专属代码净减明显；
- ✅ 三态时序统一「shell 先开」：pending 不再静默 warn 无面板，加载中状态用户可感知；
- ⚠️ **行为变化一**：pending（x-import 未就绪）从「不开面板 + warn」变为「开面板 + pending 占位」；
- ⚠️ **行为变化二**：远程失败从「面板内自建 error 占位」变为「x-error 边界呈现」（raise 显式传 retryable / closeable 对齐旧语义默认值）；
- ⚠️ url 片段重开重新 fetch（指令级文本缓存删除）——浏览器 HTTP 缓存与探测侧 x-import url 缓存兜住主流，高频场景文档引导 keepalive；
- **交付**：ADR（本文）+ ADR-0119 修订 + CONTEXT.md 词条更新 + 源码（directive/overlay.ts、overlay/instance.ts）+ 测试改写 + 文档（x-dialog 等指南）+ demo 调整。
