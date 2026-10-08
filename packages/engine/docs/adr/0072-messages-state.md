# ADR-0072：消息状态暴露（$messages 保留键）

- **状态**：Accepted（已实现——`src/features/messages/manager.ts` 镜像与真身化全量落地，`src/__tests__/messages.test.ts` 57 用例全绿）
- **日期**：2026-10-01
- **关联**：[ADR-0071](0071-messages.md)（消息模块——本文修订其决策 4/6/15/18：词汇改名、载荷收紧、options 真身化；「收件箱 UI 留给用户自建」的兑现路径）、[ADR-0029](0029-scopes-reserved-key.md)（保留键先例）、autostore ADR-0006/0007（`shallow` 语义）
- **共识来源**：grilling 七轮决策（评估 → 形态 → shallow → 边界 → 类型分层 → 词汇统一 → fetchOptions），本文即共识落盘

## 背景

ADR-0071 被否决方案注记宣称「收件箱用 x-for 绑定枚举 + 事件计数自建」——**言过其实**：`engine.messages` 是 Map，模板拿不到，现状需要 `engine.on("message:*")` 事件桥接进自建 state 的十行样板。声明式缺口是真实的。

塑造设计的关键事实：

1. **卡片粒度的响应式已存在**——每张卡经 `instantiateDetachedComponent` 注入独立响应式域，`update` / `_applyProgress` 已是字段级细粒度写。缺的不是「让消息变响应式」，是**跨卡片的全局视图**（列表枚举、聚合、配置态）；
2. `shallow(obj, 1)`（autostore ADR-0006/0007）原生支持「数组结构变更 + 成员一层字段读写有事件、孙级起 raw」——N 条消息只有两层代理；
3. 事件依赖收集下，`items.filter(r => !r.read).length` 这类聚合表达式是正确响应式的（迭代 + 字段读全部收集依赖）——**不需要维护性聚合键**；
4. 消息记录几乎全平（title/description/read/... 均叶子），deep=1 覆盖全部有意义字段。

## 决策

### 一、保留键与容器

#### 决策 1：`store.state.$messages = { items, options }`——保留键第二例

沿 `$scopes`（ADR-0029）先例由 MessageManager 构造期注入；**永不整体替换容器**（铁律同款）；`messages: false` 不注入；1 engine 1 store 约定下多引擎共享 store 不在契约内。

#### 决策 2：items = 记录镜像，写通道仅 manager

- 元素类型 `AutoSparkMessage`（纯数据：无函数、无 DOM 引用——`MessageTask` 句柄与其是同一 entry 的**平行投影**，行为面不入 state）；
- **写通道唯一**：add / 原地更新 / `_applyProgress` / `_setRead` / result 写入 / hide / show / delete / clear / maxLen 淘汰 / load / 构造恢复——全部收口点同步镜像（记录级变更 = `items[i]` 整条替换）；模板直写为**违约自理**（纪律不加机制，ADR-0071 决策 8「`update()` 唯一写通道」语义不变）；
- `shallow(items, 1)` 包装（决策 9 实现要点见四）。

#### 决策 3：items **不是** options——不对称契约

`options` 是官方可写真身（决策 5），`items` 是只读镜像。这一不对称写进文档契约：写 `options` 是特性，写 `items` 是违约。

### 二、类型分层

#### 决策 4：`AutoSparkMessageRecord` / `AutoSparkMessage` 两层 + 词汇统一

```
AutoSparkMessageRecord（数据记录——服务器通知 DTO 形态，persist/remote 载荷基底）
 └─ extends → AutoSparkMessage（+ 渲染/行为/生命周期字段；$messages.items 元素）
```

- **Record** = 纯业务数据：`id/kind/read` 恒有 + `owner?/level?/type?/title?/description?/status?/result?/link?`。同一份数据可被 Web / 移动端 / 第三方直接消费；
- **Message** = Record + `closed`（恒有）/ `icon/pos/offset/closable/animate/className/delayClose/persist/progress/actions`（actions 为 `Omit<ResolvedMessageAction, "handle">` 数据投影）；
- **词汇全链路统一**（未发布零迁移负担）：正文 `body → description`（输入 / 渲染 / 记录同名，消灭双层词汇）、链接 `href → link`（HTML 属性仍 `href`）；新增 `owner`（归属者，业务透传不代填）与 `level`（见决策 7）。

#### 决策 5：options = 生效配置**真身**（不是镜像）

- 构造期注入「`内置默认 < options.messages`」合并结果（缺省键显式可见，读 state 即得实际在用值）；
- manager **运行时直读 state**（无 `_globalOptions` 副本、无 watch 回写）——state 即配置唯一存放地；state 写入为**信任通道**（不走 `parseMessageProps` 校验）；
- 运行时修改对**后续操作生效**、已展示卡片不回溯；`configure(partial)` API 被**否决**（直写即 configure）；
- `maxLen` 随之解除「构造期固化」（ADR-0071 决策 6 的理由是缺运行时通道，现已不缺）。

#### 决策 6：边界键——「函数、元素不入 state」

`anchor`（DOM 引用：快照 / devtools / 用户持久化污染）与 `actions`（函数值会被 autostore 按计算属性语义劫持——handle 收到 scope 参数、静默行为腐蚀）不入 `$messages.options`，**构造期私有固化**、照常作为全局默认生效。`fetchOptions` **在**真身内（决策 8）。

### 三、排序与传输

#### 决策 7：level 排序语义

- 作用域：列内展示位（高级别靠**列边端**——top/center 系列在首、bottom 系列在末）+ 满员补位序（level 降序、同级 FIFO）；
- **入列时快照定序**：`update` 改 level 不移动已展示卡（免 DOM 迁移与动画重播），镜像记录如实反映新值；
- 不影响 `maxLen` 淘汰（仍是创建序 FIFO——level 是呈现优先级，不是记录存续权重）；
- items 镜像序 = 同规则（level 降序、同级创建序）。

#### 决策 8：fetchOptions——url + headers 合并、fetch 时现读

- `MessageFetchOptions = Omit<RequestInit, "method" | "body"> & { url }`（method/body 引擎契约固定，剥除防误配）；`fetch(fetchOptions.url, fetchOptions)` 直传；
- controller **每次 fetch 现读 state**：token 续期场景直改 `fetchOptions.headers` 即对后续同步生效；运行时补 url 即激活 remote 同步（构造期判定拆除）；
- **取代**早前「url/headers 不入 state（敏感键剥离）」的判断——token 刷新价值 > 泄漏面；文档警示：鉴权头随 state 可见（devtools 等价 network 面板），**自行持久化整个 state 时请剥除**。

### 四、实现要点（防再踩）

1. **`shallow()` 只标记**——返回裸引用，真正的代理在容器进入 store、经 state 读出时才创建。变更句柄必须用**回读值**（`state.$messages.items`），裸引用上 splice 不发通知；
2. **数组索引赋值不触发数组路径订阅**——`items[i] = 新记录` 无事件，记录级替换必须 `splice(i, 1, 新记录)`；
3. **`.length` 精准路径订阅不随结构变更触发**——`x-text="$messages.items.length"` 不会更新；聚合绑定须用 `filter(...).length` 表达式形态（依赖收集覆盖迭代与字段读）。已写入文档注意事项。

### 五、持久化载荷修订（修订 ADR-0071 决策 18）

载荷 = `AutoSparkMessageRecord & { actions?: string[] }`：渲染/行为/生命周期键（`className/icon/pos/offset/closable/delayClose`）**不再持久化**——恢复时走生效默认（自定义主题不跨会话）；`closed` 由恢复策略统一置 true、`persist` 按存储介质反推（local 存储 → `'local'`）——这两个键本就不被恢复侧消费，载荷里的存在是冗余。actions 字符串名为 persist 专属恢复通道（live 镜像是解析后对象形态，两者形状不同无法共型）。

## 被否决 / 演变的方案

- **B 派生聚合**（维护 `count`/`unread` 两个键）：被 `shallow(items,1)` + 聚合表达式吸收——少两个要同步的派生值，KISS；
- **`configure(partial)` API**：被 options 真身直写取代（无 API 竞争者、无 fast-follow 欠账）；
- **url/headers 完全不入 state**：被 fetchOptions 现读方案取代（token 刷新是真实收益；警示替代剥离）；
- **`MessageTask` 句柄直入 items**（模板可 `t.hide()` 很诱人）：句柄背后态持 `scope`/`el`——循环引用炸 `JSON.stringify(state)`、DOM 引用进快照、devtools 巨型 dump；
- **深代理全量镜像**：60Hz progress 写放大、FIFO 淘汰索引全失效全列重建、N 条记录全量 proxy 内存；
- **双向写**（state 直写 items 映射回 API）：推翻 ADR-0071 决策 8 唯一写通道、守卫机制在 autostore 代理层内不可行；
- **双层词汇**（输入面 `body` / 记录面 `description` 翻译层）：评估期一度采纳，一轮后被否——一词到底，翻译边界是认知税。

## 修订记录

- **ADR-0077**：`options.shallow`（`0 | 1`）成为 options 真身「直写即生效」契约的**第一条例外键**（构造期一次性、运行时直写静默忽略）；items 的 shallow 深度参数化（默认 1 不变）；`styles` 渲染键加入 `AutoSparkMessage`（不入 Record 与载荷）。正文保留原决策记录。
