# 配置参数

合并链：`内置默认 < options.notifications < types[type] < 单次 props`。保留键**封闭清单**——未知键 warn + 忽略；空 title warn + no-op。

## 通知级键

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `title` | — | 通知标题（HTML；经 `options.sanitizer` 消毒——与 x-html 同一安全通道） |
| `description` | — | 可选正文（HTML 同通道），渲染在下一行、字号小一号 |
| `type` | `"toast"` | 业务类别（开放集合；`toast` / `confirm` / `task` 为内置语义 type）；驱动 types 默认与 type 专属渲染（原 `kind` 更名，ADR-0079） |
| `level` | `0`（`none`） | 严重度五档 `0`none / `1`info / `2`success / `3`warn / `4`error（常量 `NOTIFICATION_LEVEL`）——驱动图标与语义色；**宽松入参**（数字或名字符串同权，非法 warn + 回退 none）；只管视觉语义、与展示位置无关（原排序语义已移除） |
| `icon` | — | 显式图标名，优先于 level 默认映射 |
| `owner` | — | 归属者（业务透传：收件人/来源模块等），引擎不解释、不代填 |
| `delayClose` | `3000` | 自动关闭延迟 ms；`0` = sticky（永不自动关）；hover 暂停 / 移出恢复（剩余时间制） |
| `pos` | `"top-right"` | 屏幕锚定位置（7 值枚举）；非法值 warn + 回退 |
| `offset` | — | 分区列与屏幕边缘间距；**仅该列首次创建时生效** |
| `id` | 自动生成 | 记录 id；**同 id = 原地更新**。仅单次调用层生效 |
| `read` | `false` | 已读标记（点击自动置位；编程式走 `markRead`） |
| `status` | — | 业务状态（引擎纯透传） |
| `result` | — | action value 应答（只读面，点击写入） |
| `link` | — | 尾随 external 链接（新标签、不关闭、置已读）；HTML 属性仍为 `href` |
| `closeable` | `true` | 关闭按钮（默认常显 ×，内置 `no` 图标；原 `closable` 更名且默认值翻转，ADR-0097）；显式 `false`（任意配置层）压制 |
| `persist` | `0` | 记录存续级别 `0/1/2/3`（常量 `NOTIFICATION_PERSIST.NONE/SESSION/LOCAL/REMOTE`，见[记录与展示](./index.md#记录与展示)） |
| `actions` | — | 按钮行（字符串 = 全局 action 名 / 对象 = 局部按钮，`value` 键数据应答）；type='confirm' 缺省自动注入「确定/取消」双钮 |
| `anchor` | — | 局部 action 解析根 + 事件派发根 + 渲染数据视图基准（元素或选择器字符串，见 [关联页面元素](./data.md#关联页面元素)） |
| `progress` | `0` | **type='task' 专属键**（类型分型属 `TaskNotificationProps`——其他 type 携带 warn + 忽略）；初始进度 0~100 |
| `canStart` / `canPause` / `canStop` / `canCancel` | `false` / `false` / `false` / **`true`** | **task 四控制键**（ADR-0104）：启用后预设组件自动带「开始」「暂停/恢复」「停止」「取消」按钮（终态隐藏）；`canStart` 转手动门控（pending 态等启动，progress 被门控）；`canCancel` 缺省 `true`（取消是任务卡的基本出口，显式 `false` 压制）。`session.abortSignal`（AbortSignal）**恒暴露**（与按钮开关解耦）——stop / cancel / × 于非终态触发 abort，fetch 挂接即中断 |
| `animate` | `"slide"` | 进出场动画（默认按 pos 方向自适应，`false` 关闭） |
| `className` | — | 附加类名（主题定制通道） |
| `styles` | — | 内联样式 cssText（如 `"border-left:3px solid red"`）——卡片根追加语义；渲染键不入持久化载荷 |
| `width` / `height` | `'auto'` | 卡片宽高（`number` = px、字符串原样 CSS 长度）；**confirm / task 内置默认 `width: 300`**（type 种子层，任意配置层可覆盖） |
| `minWidth` / `maxWidth` / `minHeight` | — | 尺寸约束（number = px）；`maxWidth` 缺省走内置 shell 的 CSS 兜底 `--autospark-notification-max-w: 360px`，显式声明时 inline 覆盖 |

## 管理器级键

另有**管理器级键**只在 `options.notifications` 全局层生效（types 内出现 warn + 忽略）：

| 键 | 默认值 | 说明 |
| --- | --- | --- |
| `showCount` | `5` | 同屏显示上限——按 pos 分区各计，满员排队、按队首 FIFO 补位 |
| `maxLen` | 不限 | 存活记录数上限，溢出 FIFO 丢最旧（含会话缓冲记录） |
| `fetchOptions` | — | 传输配置（原 `url`+`headers` 合并）：`url` + RequestInit 子集直传 fetch；fetch 时现读 state（运行时改 url / 刷新鉴权头即生效，见 [保存与同步](./data.md#保存与同步)） |
| `icons` | — | type → 图标名重映射（默认同名词映射） |
| `shallow` | `1` | `$notifications.items` 的 shallow 深度（`0 \| 1`；**构造期一次性**——运行时直写静默忽略，见 [数据视图](./data.md)） |
| `types` | — | 按 type 的默认值与渲染插槽（`types[type].render` = type 组件名；原 `kinds` 更名，ADR-0079；末端 `autospark.notifications.shell` 兜底，见 [自定义](./custom.md)） |
