# ADR-0118：x-error 指令——运行时错误捕获与呈现（error 事件、raise、behavior 三态、scope.errors）

- **状态**：Accepted（grill-with-docs，五轮拷问）
- **日期**：2026-10-18
- **关联**：[ADR-0001](0001-directive-kind-system.md)（DirectiveKind——x-error 为 Runtime 指令）、[ADR-0003](0003-engine-event-bus.md)（engine 级 RuntimeObserverDispatcher）、[ADR-0010](0010-action-dom-bubble-event.md) / [0011](0011-sync-action-lifecycle.md) / [0012](0012-local-action-dom-only.md)（action 双通道广播——error 事件是追加的第三通道）、[ADR-0036](0036-action-descriptor-metadata.md)（ActionDesc 与内置动作体系）、[ADR-0038](0038-x-loading-actions-option.md)（data-action 点击委托、合成透传 descriptor——actions 按钮复用同款契约）、[ADR-0094](0094-builtin-component-registry-and-unified-lookup.md)（内置组件注册面——`autospark.error`）、[CONTEXT.md](../../CONTEXT.md)（「错误呈现」节全部词条）

## 背景

action 失败（rejected）目前只有两条消费通道：总线 `actions/<name>/rejected`（全局消费者）与 DOM `action:<name>` 冒泡（祖先聚合）。两者都面向**程序化**消费者——模板作者想要「在某个区域内，action 失败就地显示错误提示」时，只能自己写监听代码再驱动状态，无声明式出口。同时缺一个「显式抛出错误给呈现层」的模板侧入口（如表单校验失败、前置条件不满足）。

需求形态经拷问收敛为：

```html
<div x-error x-error-options.behavior="'overlay'">
    <button @click="submit()">提交</button>
</div>
```

submit 失败（或 `raise(...)` 显式触发）→ 最近的 x-error 宿主捕获 → 按 behavior 呈现（覆盖层 / 错误 class / 纯消费）。覆盖层组件提供关闭、重试与额外动作按钮。

表面是「加一个指令」，拷问暴露出连锁决策：错误从哪来（action 桥接的点在哪）、事件模型（复用 `action:<name>` 还是专用事件）、捕获语义（嵌套谁优先）、呈现三态边界、配置双通道（静态 vs 事件载荷）、重试语义（raise 源无源可重）、编译期错误的归属（不进本通道）。

## 决策

### 决策 1：x-error 只处理运行时错误；编译期错误进 scope.errors（正交两轨）

错误按产生阶段分轨，互不消费：

- **运行时错误**（x-error 管）：action 失败（自动桥接）+ `raise` 显式触发。经 DOM 事件通道流入呈现层。
- **编译期错误**（scope.errors 管）：指令 created/compile 抛错、绑定表达式首次求值抛错，收集到失败元素所属 scope 的 `errors` 字段（只当前 scope 不含后代）。生命周期：编译前清空 → 编译结束冻结 → destroy 回收。**纯属性暴露**（不经 engine.emit 广播），供调试/开发工具消费。

否决「单一错误总线」：编译错误是诊断数据（消费者是开发者），运行时错误是呈现数据（消费者是终端用户）——混进同一通道会让 x-error 在编译失败半成品树上做无意义呈现，也让开发工具被迫监听 DOM 事件。

### 决策 2：专用 `error` CustomEvent，不复用 `action:<name>`

运行时错误的 DOM 载体是**专用 `error` CustomEvent**（`bubbles+composed`）。detail 携带归一化错误对象（见决策 6）；action 源另带 `action` 描述符与 `args` 原数组（重试的弹药）。

**生产点二**：

1. **buildAction rejected 分支自动桥接**：rejected 广播照发（总线 + `action:<name>` 双通道原样不动）之外，**追加**在触发元素上 dispatch `error` 事件。全局 action 与局部 action 均桥接（局部 action 本就只走 DOM 冒泡，error 事件同为 DOM 通道、无串扰问题）。**命令式直调不桥接**——无触发元素可挂事件（`ctx.el` 缺位），此时错误归调用方代码自己 catch。
2. **`raise(error, options?)` 内置全局 action**：同步在触发元素 dispatch `error` 事件——显式触发的模板侧入口。

否决复用 `action:<name>` rejected 相位：该事件语义是「action 生命周期广播」（每个 action 一条），错误呈现需要的是「这棵树出了个错」（与具体 action 解耦——raise 无 action 归属，且一个 action 的 rejected 不一定都要呈现）。专用事件让「呈现层消费」与「生命周期消费」各听各的，也避免 x-error 宿主被迫监听全部 `action:*` 再过滤 phase。

### 决策 3：就近消费——冒泡路径上最近的 x-error 宿主捕获并 stopPropagation

x-error 宿主监听 `error` 事件，捕获后 `stopPropagation`：嵌套 x-error 时**内层优先**消费，外层不再收到；`behavior:'none'` 同样 stop（纯消费不呈现也是消费——外层不应越级呈现内层已认领的错误）。全程无 x-error 捕获的事件冒泡到顶自然消亡（不产生 uncaught——`error` 是 CustomEvent 不是 ErrorEvent，无 window.onerror 副作用）。

**单错误槽**：同一宿主上新错误**替换**当前呈现（不做错误队列/堆叠——覆盖层场景堆叠无意义，最新错误即最相关错误）。错误对象不进持久状态，生命周期=呈现期。

### 决策 4：behavior 三态——none / addErrorClass / overlay（默认 overlay）

`x-error-options.behavior` 声明捕获后做什么：

- **`'none'`**：纯消费（stopPropagation 后不呈现）。用途：声明「此区域的错误我认领了」（如已自建错误 UI 的组件边界）。
- **`'addErrorClass'`**：宿主加错误 class（默认名 `error`，`errorClass` 自定义），清除时移除。用途：宿主自身有错误样式（红边框等），不需要覆盖层。
- **`'overlay'`（默认）**：挂载错误覆盖层——x-loading 同款契约：append 到目标、`position:absolute;inset:0`、原内容保留、清除=移除 DOM（重建式非 display 隐藏）；目标须 relative（文档注明）。

**overlayAt**：`x-error-options.overlayAt` 指定覆盖层挂载目标（默认宿主），经 queryRelElement 相对查询（`'../'` 爬升、`'^'` closest、`'/'` 全局、`'@'` 前缀 document.querySelector），未命中/非法回退宿主。

**options 求值分两类**（Runtime 指令无 binding、无 scope 通道）：`behavior` / `overlay` / `errorClass` / `overlayAt` / `closeable` / `retryable` = **静态字面量读取**（去引号，不走 watch——呈现结构配置不支持状态驱动，同 x-loading 的视觉字段先例）；`props` / `actions` = **表达式**（全局 store watch，x-loading `_bindValue` 同款 collectDependencies 通道）。

### 决策 5：错误组件解析链——options.overlay > 指令值简写 > autospark.error

overlay 态的组件名解析优先级：

1. `x-error-options.overlay="'my.error'"` 显式指定；
2. 指令值简写 `x-error="my.error"`（指令值非空即组件名——Runtime 指令的值无表达式语义，复用为简写通道）；
3. 内置 `autospark.error` 默认组件。

查找经 `engine.getComponentDeclaration(name, el)`（Runtime 反查链：scope 局部 → options.components → 全局表 → builtinComponents）。

**组件 data 注入契约**：保留键 `error`（指令独占——props 传入同名 warn 忽略）+ `message`（别名）+ `closeable` / `retryable` / `actions` / `props` 合并注入；`close` / `retry` 经**块 scope actions 通道**注入（实现期修正：函数值进响应式 data 域会被代理当 computed 吞掉——读取即执行返回 undefined）——组件 `@click="close()"` 走 x-on action 解析直调 `directive.clear()`，关闭通道零 DOM 事件往返；块 scope 内 `close` 遮蔽同名内置 action（错误组件子树内 close 即「关闭这个错误呈现」的就近语义）。

### 决策 6：错误对象归一化——普通对象进响应式域，Error 实例不进

注入组件 data 的 error 恒为**归一化普通对象**：

```
{ name, message, stack?, code?, source: "raise"|"action", action? }
```

- `raise("文本")` → `{message:"文本"}`；`raise(new Error(...))` → `{name,message,stack}`；`raise({...})` → 原样保留并注入 `source:"raise"`；
- action 桥接：Error 实例同样归一化（`{name,message,stack}` + `source:"action"` + `action` 描述符）——**Error 实例不进响应式域**（原型链对象进 AutoStore 响应式域无收益且有序列化包袱）。

### 决策 7：closeable / retryable / actions——双通道配置，事件层优先

三件配置由双通道供给：`x-error-options.*` 静态层 + `raise(error, options)` 事件层（**事件层优先**——raise 调用点比宿主声明更懂这次错误要什么按钮）。

- **closeable**（默认 true）：是否提供关闭按钮。
- **retryable**（默认按源分流）：action 源 true、raise 源 false，显式配置优先。**raise 源无源可重**：显式 `retryable:true` 也不渲染重试按钮并 warn（重试谁？）。
- **actions**：额外动作按钮 `(string|ActionDesc)[]`——string 经 getAction 链解析（engine.findScopeByEl(el) 反查），渲染 `[{name,title,icon?}]`；触发走 **data-action 点击委托**（ADR-0038 同款契约：已注册走真 action，未注册合成透传 descriptor 双通道广播）。

**retry 语义**（仅 `source:"action"` 生效）：以**原 args** 重调失败 action——重调 resolved → 自动清除呈现；rejected → 呈现更新为新错误（单错误槽语义自然覆盖）。不重跑 triggerEl 上的 x-on 表达式（那是用户手势的重放，不是 action 的重调——决策边界与 buildAction 桥接点一致：桥接在 action 层，重试也在 action 层）。

### 决策 8：error.html 破坏性升级——新 data 契约，旧契约退役

内置 `autospark.error` 组件当前零消费者（ADR-0066 引入后仅 router 早期引用、已退役），破坏性升级自由：

- **新 data 注入**：`{error, message（别名）, closeable, retryable, actions, close}` + props 合并；
- **按钮行**：关闭 + 重试 + actions 按钮（移除旧 `hasRetry`/`hasClose`/`hasBack`/`back` 契约——back 按钮是 router 404 场景残留，通用错误组件不背）；
- icon / message 插槽保留；继承定制走 ADR-0081/0082 `x-define inherit` + `x-super` 现成机制。

### 决策 9：与 router ADR-0012 出口错误块零耦合

router 出口错误块（路由加载失败呈现）是 router 包内建机制，不消费 error 事件、不被 x-error 捕获（出口错误块渲染在 outlet 内部、不产生 `error` 事件）。两系统各守各的域：router 管「路由装载失败」，x-error 管「交互动作失败」。不动 router 任何代码。

## 被否决的方案

- **复用 `action:<name>` rejected 相位做呈现触发**：呈现层被迫监听全部 `action:*` 再过滤 phase；raise（无 action 归属）进不了通道；「生命周期广播」与「错误呈现」两类消费者挤一条事件（决策 2）。
- **单一错误总线（编译+运行时同通道）**：编译错误是诊断数据、运行时错误是呈现数据，消费者不同（决策 1）。
- **错误对象进持久 state**（如 `state.errors.push(...)`）：引擎隐式改写用户状态是意外副作用（ADR-0038 决策 6 同纪律）；错误队列无呈现意义——单错误槽「新替旧」即最相关（决策 3）。
- **不重捕获、冒泡到顶全局兜底呈现**：就近消费让组件边界能认领自己的错误（决策 3）；全局兜底可经最外层宿主 x-error 表达，不需要第二条隐式通道。
- **behavior 四态含 `'toast'`**：toast 是通知家族（ADR-0068）的域——错误呈现需要 toast 形态时由用户在 `error` 事件监听里自行 `toast(...)`，x-error 不预置跨家族形态（YAGNI）。
- **Error 实例直接进组件 data**：原型链对象进响应式域无收益、有序列化包袱；归一化普通对象够用（决策 6）。
- **retry 重放 triggerEl 的 x-on 表达式**：桥接点在 action 层（决策 2），重试与之对称也在 action 层（原 args 重调）；重放用户手势会连带表达式里的其他语句，越权且不可预测（决策 7）。
- **raise 源允许 retryable:true 渲染重试按钮**：无源可重——按钮必是死键或语义造假（决策 7）。
- **errorClass 默认名 `as-has-error`**：默认 class 名从简 `error`（用户修正），与 `x-loading-overlay` 等指令自带 class 的短名风格一致。
- **保留 error.html 旧 hasRetry/hasBack 契约**：零消费者组件背双份契约是纯包袱；back 按钮是 router 场景残留，通用组件不背（决策 8）。

## 后果

- ✅ 模板作者获得声明式错误呈现出口：`<div x-error>` 一圈，子树 action 失败即地呈现；`raise(...)` 提供显式触发入口。
- ✅ action 双通道广播**零改动语义**——error 事件是纯追加的第三通道，既有消费者无感；命令式直调（无触发元素）不桥接，错误归调用方 catch，边界干净。
- ✅ scope.errors 让编译期错误首次有了结构化归属（此前仅 console.warn），为开发工具铺路；与 x-error 正交不互消费。
- ⚠️ `error` 作为 CustomEvent type 名较通用——宿主页面若自行 dispatch 同名事件会被 x-error 捕获。缓解：引擎 detail 恒带归一化错误对象，第三方事件缺字段时按 `{message:String(detail)}` 归一兜底；文档标注建议业务侧自定义事件避开 `error` 名。
- ⚠️ 覆盖层模式要求挂载目标 relative（x-loading 同款约束），文档注明。
- 交付：`scope.errors` 字段 + 两个收集点；buildAction rejected 桥接；builtins `raise`；`directives/x-error.ts` + presetDirectives 注册；error.html 升级 + components/index.ts 登记；本 ADR + CONTEXT.md 词条；`x-error.test.ts` 单测（桥接 / raise 归一化 / 就近消费 / behavior 三态 / 解析链优先级 / retry 语义 / close 回调 / actions 委托）。
