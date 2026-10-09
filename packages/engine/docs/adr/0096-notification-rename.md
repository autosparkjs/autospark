# ADR-0096：消息子系统全链正名 Notification（messages 语义收敛）

- 状态：已采纳
- 日期：2026-10-09
- 关联：ADR-0071（消息模块——被更名主体）、ADR-0072（状态暴露）、ADR-0077/0079/0083/0088/0089（演进链）、ADR-0094/0095（注册面与 shell 实例化——更名基座）、ADR-0030（更名先例）

## 背景

「消息（message）」是该子系统的历史名（ADR-0071 自 toast 升维时沿用）。但领域模型里它承载的是
**统一信息记录**——轻提示 / 通知 / 业务提醒 / 任务跟踪，记录本体即「服务器通知 DTO 形态」
（ADR-0072）。`message` 一词过于泛化（error message、日志文案、x-loading 提示文案均在用），
无法指称本体系；「通知（notification）」才是记录与子系统的精确正名。

包未发布（ADR-0079「未发布零迁移」纪律沿用），无存量兼容负担，一次性原子更名。

## 决策

### 1. 全链更名、零别名

机械替换规则：`Message*` → `Notification*`、`MESSAGE_*` → `NOTIFICATION_*`、
`Messages*` → `Notifications*`；目录 / 文件 / 运行时 API / CSS / DOM 属性 / 事件 / 组件注册键 /
文档路径同步。旧名直接消失，不留 deprecated 别名（沿 `engine.toast()` 退役先例）。

### 2. 映射表（权威清单）

| 层 | 旧 | 新 |
|---|---|---|
| 目录 | `src/features/messages/` | `src/features/notifications/`（内部文件名不变） |
| 组件模板 | `components/message-shell.html` | `notification-shell.html` |
| 类型 | `AutoSparkMessageRecord/Level`、`AutoSparkMessagesOptions/State`、`MessageProps/Options/Pos/FetchOptions/TypeOptions/ComponentProps/RecordInput/PersistLevel/LevelName`、`ParsedMessageProps`、`ResolvedMessageAction` | `AutoSparkNotificationRecord/Level`、`AutoSparkNotificationsOptions/State`、`NotificationProps/Options/Pos/FetchOptions/TypeOptions/ComponentProps/RecordInput/PersistLevel/LevelName`、`ParsedNotificationProps`、`ResolvedNotificationAction` |
| 常量 | `MESSAGE_LEVEL/_NAMES/_LEVEL_ICONS/_PERSIST/_POS/_DEFAULTS/_RESERVED_KEYS/_STORAGE_KEY/_COLUMN_GAP`、`MESSAGES_KEY`、`MESSAGES_CONTAINER_CLASS/_ATTR`、`MESSAGE_COLUMN_ATTR` | `NOTIFICATION_*` / `NOTIFICATIONS_*` 同构 |
| 函数 | `normalizeMessageLevel`、`messageLevelName`、`parseMessageProps`、`mergeMessageProps`、`settleMessageLevel`、`formatMessageSize`、`serializeMessage`、`writeLocalMessages`/`readLocalMessages`、`injectMessageStyles`、`getMessageContainer/Column`、`removeMessageContainer` | `normalizeNotificationLevel` 等 `Notification` 形态 |
| 类 | `MessageManager/Queue/Records/Persistence/Entry/SessionFactory`、`MessageMergeContext` | `NotificationManager` 等 |
| 运行时 API | `engine.messages`、`options.messages`、保留键 `store.state.$messages` | `engine.notifications`、`options.notifications`、`$notifications` |
| 事件 | `message:add/update/show/hide/read/status/action` | `notification:*` |
| 组件键 | `autospark.messages.{actions,base,toast,task,confirm}`、shell 裸键 `message`（默认 shell 选择器值同） | `autospark.notifications.*`、裸键 `notification` |
| CSS/DOM | `autospark-message*`、`autospark-messages` 容器类、`data-autospark-messages`、`data-message-{pos,type,level}`、`--autospark-message-{z,inset,accent,max-w,-color}`、样式 id `autospark-message-{column-,}styles` | `autospark-notification*` / `autospark-notifications` / `data-autospark-notifications` / `data-notification-*` / `--autospark-notification-*` / 同名 id |
| 持久化 | localStorage 键 `autospark-messages` | `autospark-notifications` |
| 自动 id | 前缀 `message-N` | `notification-N` |
| 文档 | `docs/zh/guide/messages.md`、`docs/demos/messages/`、侧边栏「消息」 | `notifications.md`、`demos/notifications/`、「通知」 |
| 中文术语 | 消息（指本体系处） | 通知 |

### 3. 保留不变

- action 名与 type 种子值 `toast` / `confirm` / `task`——命名呈现形态而非系统名，与本更名正交；
- 历史 ADR（0068~0095）正文与文件名保留 `message` 旧称（沿 ADR-0030「0001~0029 保留旧称」先例），
  本表为唯一权威映射；`docs/specs/` 无涉。

### 4. 随更名一并移除（范围扩展，已确认）

`toast:show` / `toast:hide` 迁移期双发旧事件（`_emit` 的 `legacyToast` 通道与 `AutoSparkEvents`
定义）——为从未发布的旧 toast manager 保留的兼容广播属死代码（YAGNI），本更名窗口即 breaking
窗口，不携死代码进门。

### 5. 排除清单（语义无关，禁改）

x-form 的 `errorMessage`/`_invalidMessage`；`Error` 构造参数与 `error.message` 读取；x-loading 的
`message` 配置键与 `MESSAGE_CLASS="x-loading-message"` 类名；error 组件 `props.message`（引擎友好
文案）；`actions/*/pending|resolved|rejected` 通用信号；中文「错误消息」（error 语境）与 UI 通用
文案「消息」。

### 6. 词汇表落点

CONTEXT.md「消息（Message）」章节正名「通知（Notification）」，约 15 词条同步改写；toast 词条
Avoid 重写（notification 为体系正名，对 toast 单体仍避免混称）；「已废弃」新增「Message 家族
旧名」总条目指回本表。

## 后果

- `src/index.ts` 转导出的全部 `*Message*` 符号为 breaking change（未发布，无消费者）；
- 主测试文件 `messages.test.ts` 已随 OOM 事故退役（engine/CLAUDE.md 测试纪律），本更名不含测试
  迁移，`notifications.test.ts` 后续补写；验证面 = 存量测试 + 三格式构建 + 文档结构校验；
- 工作区同批存在 ADR-0089/0094/0095 未提交实施流，本更名叠加其上，提交边界由维护者取舍。
