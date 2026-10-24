# autospark.notifications

AutoSpark 官方通知插件（`@autospark/plugins` 包内复合插件样板）：统一信息反馈与管理子系统，以官方插件形态随包分发。脚本加载即自举——engine 构造期自动完成下述注册，启用只需引入产物脚本，无手动注册。

## 引擎实例 API

- **`engine.notifications`**：通知管理器（复合插件核心挂载）——`add` / `show` 统一入口，接受字符串简写、配置对象、async factory（条件通知 + 挂起会话注入）三种形态；返回按 type 分派的**通知会话**（1:1 绑定渲染组件），支持 `update` / `hide` / `show` / `remove` / `respond`，`confirm` 会话 thenable（`await` 得应答）、`task` 会话携带 `abortSignal`。
- **`engine.notifications.PERSIST`**：persist 分级常量（NONE / SESSION / LOCAL / REMOTE）——本地档 localStorage 收件箱落盘，重开会话可恢复。

## Actions（模板声明式）

| action | 说明 |
| --- | --- |
| `toast(payload)` | 轻提示：payload（字符串 \| 配置对象）转发 `show({ type: 'toast' })`，`level` 定语义色，缺省 3 秒自动关 |
| `confirm(payload)` | 通用确认：双钮非模态，`yes` / `no` 定制文案，应答经事件回流 |
| `task(payload)` | 进度任务：创建即 running，进度推进仍为编程式（会话句柄经事件广播交付） |

三个均为内置执行型全局 action（用户同名声明可覆盖），在元素上使用时自动注入宿主元素为 anchor。

## Components（全局组件模板）

| 组件 | 说明 |
| --- | --- |
| `autospark.notifications.shell` | 通知卡片公共骨架：分区栈布局、离场动画、七位分区（`pos`）定位内建 |
| `autospark.notifications.toast` / `confirm` / `task` | 三个内置 type 的卡片模板（样式与图标内建，同名组件可覆盖定制） |

## Types（通知类型）

- **内置 type**：`toast`（轻提示）/ `confirm`（通用确认）/ `task`（任务）——type 种子默认随组件声明走，覆盖组件即覆盖种子。
- **自定义 type**：`options.notifications.types[type]` 开放注册业务类型（回基类会话面），每类可配专属默认值。

## Data（数据视图）

- **`$notifications`**：保留键注入 `store.state`——记录镜像 + 展示序会话列表，通知中心面板 / 未读角标模板直绑。

## Events（事件通道）

- 通知生命周期经 `notifications/<type>/<id>/<tail>` 分层命名广播（支持 `*` / `**` 通配订阅）——展示结束、按钮应答（`actions/*`）、进度推进均有事件可感知。

## Options（配置面）

- **`options.notifications`**：全局默认（`pos` / `delayClose` / `showCount` / `closeable` / `animate` 等），合并链 `内置默认 < options.notifications < types[type] < 单次 props`；`notifications: false` 整体关闭。

## Directives

- 本插件不注册指令。

## 自举

- **双加载时序**：先引擎后插件直注册；先插件后引擎经 `__AUTOSPARK_PLUGINS__` 预加载队列引导（engine 构造期 drain 回放），两时序开箱即用。

## 相关文档

- 使用指南：`docs/zh/guide/engine/notifications/`
- 插件机制：`docs/zh/guide/engine/plugin.md`
