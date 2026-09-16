# ADR-0038：x-loading 动作按钮（actions 选项、data-action 委托与 hide 约定键）

- **状态**：Accepted（grill-with-docs，三轮十四问）
- **日期**：2026-09-13
- **关联**：[ADR-0036](0036-action-descriptor-metadata.md)（ActionDesc 与开放元数据、内置信号型）、[ADR-0010](0010-action-dom-bubble-event.md) / [0011](0011-sync-action-lifecycle.md) / [0012](0012-local-action-dom-only.md)（双通道广播）、[ADR-0021](0021-x-scope-and-x-block.md) / [ADR-0022](0022-x-component.md)（编译块路径）、[ADR-0007](0007-directive-options-and-modifiers.md)（指令选项回退）、[CONTEXT.md](../../CONTEXT.md)（「hide 约定键」「合成动作描述符」「动作按钮清单」「data-action 委托」词条）

## 背景

x-loading 覆盖层目前只承载 loader + message——加载长期卡住或失败时，用户没有任何操作出口。需求：`x-loading-options="{actions:['close','retry']}"` 在 message 下方显示动作按钮，按下后相关元素经既有 `action:<name>` 通道监听响应。

表面是「加一个配置键」，拷问暴露出连锁决策：按钮怎么**触发**（x-for 出来的按钮名是运行期变量，模板表达式动态调用会绕过 x-on 的具名 action 路径）、未注册名怎么办（静默还是照播）、自动隐藏归谁管（loading 配置级还是 action descriptor 级）、隐藏怎么落地（写状态还是移 DOM）。

## 决策

### 1. actions 选项：字符串数组 + 双入口回退

`actions` 收 **action 名字符串数组**；inline `x-loading="{value:..., actions:[...]}"` 主声明 → `x-loading-options` 补充层回退，与既有视觉字段（message/color/...）同规则（缺失才回退、不合并）；非字符串元素 warn 剪枝。不做对象形态（`{retry:{title}}`）——文案定制经 `ActionDesc.title` 已有出口，不为同一能力开第二个口子。

### 2. 按钮渲染：编译块数据契约，渲染归块作者

挂载时经 getAction 链解析为 `[{name, title}]`（`title = ActionDesc.title ?? name`，内置 `close` 自带「关闭」）注入块 data——`_configData` 的第 8 个字段，自定义 loading 组件同享。DEFAULT_BLOCK 在 box 内 message 下方增按钮行（`x-for="a in actions"` 渲染、`:data-action="a.name"` 标名、`x-text="a.title"` 文案）+ 注入样式追加 `x-loading-actions` / `x-loading-action`（ghost 白系）。挂载时快照：后注册的 action 按钮显示 name 兜底，不做响应式追踪（attrChanged 重建时重新解析）。

### 3. 触发机制：指令侧 data-action 点击委托

指令在 overlay 根挂 click 委托：命中带 `data-action="<name>"` 的元素 → 经块 scope `getAction` 链**逐次现查** → 以标准 `AutoSparkActionContext`（`el`=被点元素）调用 `handle` → 走 buildAction 双通道广播。

为什么不用模板表达式：x-for 生成的按钮名是运行期变量，`@click="a.handle()"` 不匹配 Action 候选正则、走表达式兜底且 `this=undefined`——而 buildAction 的 DOM 广播依赖 `ctx.el`，`action:<name>` 冒泡事件就此失效。委托是保证双通道完整的唯一路径，且让自定义 loading 块**零接线**获得同一触发契约（「指令管触发、块管渲染」，与 ADR-0021 决策 12「指令管壳、块管内容」分工同构）。

### 4. 未注册名：合成透传 descriptor，双通道照播

未注册不静默：按钮照常渲染，点击时就地合成透传 descriptor `{name, title: name, handle: (p) => p}`（与 ADR-0036 决策 7 内置信号型**同构**，指令实例内按名缓存），经 buildAction 包装后以标准 ctx 调用——总线 `actions/<name>/{pending,resolved}` + DOM `action:<name>` 冒泡（同 tick 两相位，无 rejected）完整触发，`detail.action` = 合成 descriptor。逐次点击现查现决：先注册的真 action 优先，后注册的下次点击即切换真实执行。**仅 x-loading 委托内部生效**——不改 x-on「action 未命中→表达式兜底」既有 spec。

### 5. hide 约定键：自动隐藏的 per-action 开关

`hide` 成为 ActionDesc **文档化约定键**（ADR-0036 开放元数据体系内，与 `title`/`icon` 并列）：声明「触发后是否隐藏所在加载覆盖层」，默认 `true`、显式 `false` 关闭——**逐按钮独立**（close 隐藏、retry 续显可并存）。**点击时现读** `getAction(name)?.hide ?? true`（与广播同一次解析、零额外成本，后注册永不失效）；未注册合成名恒隐藏（无处配置——想要行为可控，就注册一个真 action）。

### 6. 自动隐藏落地：先广播后移除，纯 DOM、不写状态

点击 → **先完整广播**（监听方同步跑；async action 到 pending 即隐藏，不等待 resolved）→ 再复用 `hide()` 销毁块 scope + 移除 overlay；成功/抛错（rejected）都隐藏——点击即「让它消失」，简单可预期。**不写 state**：引擎隐式改写用户状态是意外副作用，且 value 为表达式支路（`a && !b`）时不可写。复苏语义：手动隐藏后 value 恒 truthy 期间保持隐藏（用户已表达「关掉」）；value 翻转或 attrChanged 重建后恢复正常驱动。

## 被否决的方案

- **模板表达式动态调用**（`@click="a.handle()"`）：丢 `ctx.el` → `action:<name>` DOM 冒泡失效，触发通道残缺。
- **未注册静默 / 挂载时校验剪枝**：前者按钮成死键、两路事件无从谈起；后者违背「查找延迟到触发时」哲学（x-on spec 既有决策）。
- **`retry` 入 BUILTIN_ACTIONS**：内置集是 ADR-0036 决策 7 已定边界；loading 场景的 retry 多有真实业务体（重新拉数），本就该注册为真 action 并带 title。
- **x-loading 配置级整排 hide 开关**：粒度错位——close 与 retry 的隐藏诉求天然不同，per-descriptor 才能表达「close 隐藏、retry 续显」。
- **挂载时快照 hide**：后注册的 `hide:false` 失效（残留默认 true）。
- **自动隐藏写状态**（value 置 falsy）：隐式副作用 + 表达式支路不可写。
- **actions 对象形态**（`{retry:{title}}`）：与 `ActionDesc.title` 同一能力两个口子。
- **x-on 全局兜底合成**（任意未命中名都合成信号）：推翻「action 未命中→表达式兜底」spec，影响面失控。

## 后果

- ✅ 加载卡住/失败时用户获得声明式操作出口；消费方沿用既有 `@action:<name>`（含 `.pending`/`.resolved`/`.rejected` phase 修饰符）与总线双通道，**零新监听语法**。
- 🐛 **顺带修复既有缺陷**：编译器 `_runtimeKeepAttr` 此前只保留 `x-{name}` / `x-{n}.*`，`x-loading-options` 属性被当普通指令属性剥除——手写 options 属性对 Runtime 指令**从未生效过**（既有 `-options` 接线实际只服务 x-data/x-html 的指令间合成传参）。现追加保留 `x-{n}-options` 形态，dispatcher 经 getDirectives 解析结果 DOM 建 Runtime 实例的链路打通。
- ✅ ActionDesc 开放元数据迎来第一个**行为型**约定键（hide，此前 title/icon 均为展示型）——为后续行为键（disabled 等）开了先例，增键须谨慎评估。
- ⚠️ 未注册合成名恒隐藏、hide 挂 descriptor 不挂 loading 实例：同一 action 用于两个 loading 场景无法差异化隐藏——接受（YAGNI）。
- ⚠️ `selector` 移位（`@#modal`）会改变 `action:<name>` 的冒泡祖先链，监听元素须在覆盖层挂载目标的祖先上——文档标注。
- 交付：`LoadingDirective` 实现全量 + `ActionDesc.hide?: boolean` 类型 + DEFAULT_BLOCK/样式 + 本 ADR + CONTEXT.md 词条 + `x-loading.test.ts` 增补（渲染 / 已注册调用与双通道广播 / 未注册合成广播 / hide 语义与复苏 / 自定义块契约）+ 文档站 demo 与 VitePress 选项表。
