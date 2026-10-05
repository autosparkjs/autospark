# ADR-0088：消息内容归属 type 模板与 messages 模块拆分

- 状态：已采纳
- 日期：2026-10-05
- 关联：[ADR-0077](0077-message-session-dual-shell.md)（双层组合——**内容分工被本 ADR 修订**：shell 渲染公共元素的职责下放）、[ADR-0083](0083-message-session-class-presets.md)（presets——**Q2b / 三控制键二次修订 / 继承式内容分工被本 ADR 修订**）、[ADR-0071](0071-messages.md)、[ADR-0072](0072-messages-state.md)、[ADR-0079](0079-message-type-level-rename.md)

## 背景

ADR-0083 落地后 `manager.ts` 膨胀至 ~1800 行，一肩挑：$messages 状态注入、入口形态解析、合并链与白名单投影、session 工厂、双层渲染装配、计时器、分区队列簿记、镜像同步、持久化调度 / 恢复、task 域状态机（含控制钮注入）、关闭收口、maxLen 淘汰、事件双通道。四类结构性问题：

1. **渲染归属倒挂**：type 的业务（如 task 三控制键）与视觉本应同源，但控制钮由 manager 注入 `entry.actions`、经 shell 公共 actions 行渲染——manager 为此持有 `_injectTaskOps` / `_setPaused`（不可变更新陷阱，ADR-0083 实现要点 6）/ `_dropTaskOps` 整套 task 运行态机制；
2. **shell 职责过宽**：接管 shell = 连 title/description/actions 一起重写，type 模板只能管专属区——「换外观」与「换内容」两个正交诉求被绑在一个扩展点上；
3. **注入白名单**：`_buildInjectProps` 手列 20 键投影，自定义 type 的自有 props 键进不了模板（还要维持 task 专属键 warn / 未知键 warn 两套筛选）；
4. **模块无分层**：队列 / 记录 / 持久化 / 合并链全内聚 manager，无独立单元。

用户提出四条拆分方向（职责归 session / 渲染归属 / 参数直传 / 队列独立），grilling 三轮决议（shell 存废 / 复用机制 / 控制钮事件语义 / serializeMessage 边界 / queue·records 范围）。

## 决策

### 一、shell 降级为外观容器（修订 ADR-0077 双层组合的内容分工）

shell 只渲染**卡片级 chrome**：卡片根（边框 / 背景 / 阴影 / 圆角 + 语义色挂点 `data-message-level`）+ **close 钮** + 默认出口（裸 `x-slot`）。icon / title / link / description / actions **全部下放 type 模板**。接管链（`options.messages.shell` → 全局组件表 → `options.uiShells` → 内置兜底）与「用户接管 → 包 wrapper」判定保留——接管 shell = 换整卡外观（含关闭钮形态），语义完整。close 归 shell 的理由：它是「卡片级操作」而非内容，且 sticky 自动补 ×（closable 兜底）与 shell 的延迟关闭职责同源。

### 二、type 模板拥有内容渲染，组合复用（修订 ADR-0083 presets 继承式分工）

- 唯一公共组件 **`autospark.messages.actions`**（按钮行：x-for 渲染 + 委托契约类名 `.autospark-message-action` + `data-message-action` 索引——点击闭环仍由卡片根委托收口，模板零 `@click` 样板）；
- **`autospark.messages.base` 升格为默认内容模板**（icon + title/link + description + actions 组件），并成为 **type 链末端 fallback**：`types[type].render` → 全局组件表 `autospark.messages.<type>` → **base**（「出口空置」退役）——自定义 type 不配模板也得到标准内容卡（保住 ADR-0077 时代「shell 兜底渲染」的白得能力）；
- toast / confirm = 纯继承 base（存在意义 = 用户同名覆盖的 per-type 定制点，沿 ADR-0083）；task = 自有布局（头部 + 进度条 + 三控制钮 + actions 组件，`static component` 名不变）；
- 组合通道：type 模板内 `x-component:autospark.messages.actions`，props 表达式（对象字面量或状态路径按键展开——v-bind 心智，**深层触发**）响应式联动：`_syncData` 只刷 shell + type 模板两层 data 域，actions 组件经 props 自动跟随，不手动捅第三层 scope；
- icon/title/desc 头部 ~6 行标记在 base 与 task 两处**重复**（用户裁决：title/desc 太薄不值得整体抽象，YAGNI）。

### 三、三控制钮回归 task 模板（推翻 ADR-0083 三控制键二次修订的 action 通道）

三个分立按钮：`x-show="canPause && !completed"` 等、pause 文案 `x-text="paused ? '恢复' : '暂停'"`（响应式数据域天然驱动）；`@click` 直调 `$session.pause() / stop() / cancel()`。

- **不发 `message:action`**（它是用户自定义 action 的语义；控制钮是行为不是 action）——观测面：`message:update`（paused/completed 投影变更照发）+ `message:show` / `message:hide`（cancel → hide、stop → 完成后延迟 hide）；
- `_injectTaskOps` / `_dropTaskOps` / 不可变 actions 更新整套删除；镜像 `$messages.items` 的 `canPause/paused/completed` 投影保留（数据面如实），镜像 actions 数组自然不含控制钮；
- 置已读不需单独处理（卡片根点击委托 `_setRead` 对任意点击生效）；
- 用户自定义 actions 完整保留标准 AutoSparkAction 机制（actions 组件渲染 + 委托 + `_fireAction` 闭环 + `message:action`）。

### 四、props 剥函数整包注入

合并链（内置默认 < 内置 type 种子 < `options.messages` < `types[type]` < 单次 props）与归一校验（title 必填 / level / persist / pos）保留；`_buildInjectProps` 白名单投影退役——**剥函数后整包注入** data 域。task 专属键 warn 与未知键 warn 取消：自定义 type 的自有键天然可进模板（直传的核心收益）。

### 五、模块拆分

```
messages/
  manager.ts    Map 语义 + API 门面 + 事件双通道 + dispose + 各部件编排
  queue.ts      MessageQueue：pos 分区（持有列元素懒建）+ showCount 容量判定 + 满员排队 + FIFO 补位 + 出队
  records.ts    消息记录管理：entry 构建/校验、$messages 镜像维护（items/sessions 双列表五处收口）、maxLen 淘汰、恢复重建、状态机辅助（queued/shown/hidden/closed）
  storage.ts    持久化全责：分桶收集、变更调度、删后即刷、save/load、serializeMessage
  props.ts      合并链 + 归一校验（自 types.ts 挪出；types.ts 留纯类型）
  shell.ts      降级模板（外观 + close + 出口）
  presets.ts    base 默认内容模板 + actions 组件模板 + 种子注册表
  sessions/     base（装配 + 计时器 + 公共生命周期）/ task（三控制钮 + 进度条）/ confirm / toast
  container.ts / styles.ts / types.ts —— 不动
```

- **maxLen 淘汰归 records**（跨 pos 的 createdAt FIFO 记录级策略，与展示无关）；队列补位时经编排触发 `session.mount(column)`；
- **装配上移 `sessions/base.ts`**：`session.mount(column)` / `session.unmount()` 拥有双层装配（type 模板先编译 → live 投影进 shell 出口）、监听绑定、尺寸 / 样式换装、计时器与 hover 暂停——兑现「session = 业务 + 渲染归属」，manager 只发指令；base.ts 增重（~350 行）是 manager 同量级装配段的平移，总量守恒；
- **serializeMessage 改黑名单式**：剥函数 / DOM 引用（anchor）/ 派生键（icon）/ 渲染键，**其余透传落盘**——自定义 type 的自有键可存活重载（白名单会丢弃它们）。持久化仍需要「什么落盘」的定义（纯 JSON 边界：函数被静默丢、DOM 引用变 `{}`），不能直接 `JSON.stringify(props)`。

### 六、契约冻结（未发布仍守住行为面）

JS API 全保（`add/show/toast/confirm/task/update/respond/delete/clear/dispose/load/save/markRead*`、`sessions` getter）、事件族全保（含 `toast:show/hide` 迁移双发）、`$messages` 三键形状保、DOM 契约保（卡片根类名 / `data-message-level` / `data-message-pos` / actions 委托标记）。测试以**行为等价**为准绳：事件序 / persist 语义 / FIFO 补位用例保留，结构类断言（「actions 行在 shell 内」）可改写。

## 实现要点（防再踩）

1. **actions 组件的 props 通道**：值必须是对象形态（`x-component:autospark.messages.actions="{ actions }"` 包对象——裸数组 warn 忽略）；深层触发 + 浅值比较（值无变化跳过、只覆盖出现键）对纯渲染组件无副作用；
2. **控制钮显隐全数据域驱动**：canPause / paused / completed 等键的整包注入不可遗漏（原白名单已含这些键，整包后天然覆盖）；
3. **自定义 type 兜底**：type 链末端从「无（出口空置）」改为 base——`_resolveRenderer` 的 null 分支语义变化，自定义 type 模板未注册时不再空卡；
4. **装配序不变**：type 模板先编译（内含的 actions 组件随编译实例化）、产物 live 投影进后编译的 shell 出口；两层同挂 anchor scope、同注入 `$session`（ADR-0077 纪律沿用）；
5. **`_syncData` 两层收口**：shell 与 type 模板 scope——第三层（actions 组件）走 props 响应式表达式自动联动，勿手动寻址其 scope；
6. **镜像五处收口点**（入列 `_displayEntry`；出列 teardown / delete / evict / clear——ADR-0083 实现要点 2）随拆分迁入 records.ts，「漏一处即幽灵 id」的纪律不变；
7. **serializeMessage 黑名单的渲染键集**：styles / 尺寸五键等不入载荷（ADR-0077 沿用），黑名单化只放宽「未知自有键」的落盘，不放宽渲染键。

## 被否决 / 演变的方案

- **shell 彻底退役**（Q1-A 提案）：外观接管（边框 / 语义色 / close）作为独立扩展点保留有价值——用户裁决 shell 降级而非删除（可控制外观如边框）；
- **内容骨架整体继承复用**（Q2-A 二次提案，即 ADR-0083 Q2a 翻案）：base 承载全部公共内容 + task 继承覆盖出口——用户裁决只拆 actions 组件，头部 6 行重复可接受（YAGNI）；
- **单件 content 组件 + 消费方内容投影**（组合形态提案）：布局序零变化但引入嵌套投影（shell live 投影 + consumer content 投影两层 slot 叠加），心智重于 6 行重复；
- **三控制钮保持 action 通道**（ADR-0083 二次修订形态）：为 `message:action` 可观测性付出 manager 持有 task 状态机 + 不可变更新陷阱的代价；观测面由 `message:update` / `show` / `hide` 覆盖足够；
- **控制钮行为内补发 `message:action`（带 taskOp 标识）**：被否——`message:action` 语义是「用户自定义 action」，控制钮是行为不是 action；
- **`_buildInjectProps` 白名单保留**：自定义 type 自有键进不了模板，直传收益受限；
- **queue 只收簿记**（Q5-B 提案）：列与队列是同一 pos 分区的两面，分开则 manager 仍要碰 DOM 容量判定。
