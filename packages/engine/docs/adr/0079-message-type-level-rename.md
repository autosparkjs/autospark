# ADR-0079：消息三键更名（kind→type、语义色→level、排序 level 移除）

- 状态：已采纳
- 日期：2026-10-03
- 关联：[ADR-0071](0071-messages.md)（消息模块）、[ADR-0072](0072-messages-state.md)（$messages 状态暴露）、[ADR-0077](0077-message-session-dual-shell.md)（会话与双层渲染——字段面被本 ADR 取代）

## 背景

ADR-0077 落地后，消息记录的三键分工与通用心智存在错位：

- `kind`（业务类别：toast / confirm / task / notice…）与 `type`（语义色：none / info / success / warn / error）——业界惯例里 `type` 更常指**类别**，本引擎却拿它指**视觉严重度**；
- `level` 承载**排序数字**（越大越靠列边端，ADR-0072）——`level` 一词天然暗示「严重程度」，拿来表示排序权重反直觉；
- 三词组合读起来歧义频发：`kind: "notice", type: "error", level: 5` 里 level 与 type 的语义边界需要查文档才能分清。

用户提出三键连环更名（grilling 六问全数拍板），未发布零迁移硬切。

## 决策

### 一、`kind` → `type`（业务类别，开放集合）

业务类别（默认 `'toast'`）整体搬进 `type` 名下：Session 分派、type renderer 查找、`types[type]` 默认层（原 `kinds` 配置键同更名）、`markAllRead(type?)`、快捷方式强制 type、持久化载荷字段——**全链一致换词，无半改名**（保留旧词会造成「字段叫 type、配置叫 kinds」的永久错位）。

连带更名：`MessageKindOptions` → `MessageTypeOptions`、`BUILTIN_KIND_DEFAULTS` → `BUILTIN_TYPE_DEFAULTS`、「内置 kind」→「内置 type」、「kind renderer」→「type renderer」（`resolveBuiltinRendererByKind` → `resolveBuiltinRendererByType`）、卡片出口类名 `autospark-message-kind` → `autospark-message-type`。

### 二、语义色 `type` → `level`（数值枚举 + 宽松入参）

新 `AutoSparkMessageLevel`（原五值语义色数值化）：

| 值 | 常量 | 语义 |
| --- | --- | --- |
| `0`（默认） | `MESSAGE_LEVEL.NONE` | 无图标无着色纯文本 |
| `1` | `MESSAGE_LEVEL.INFO` | 信息（蓝） |
| `2` | `MESSAGE_LEVEL.SUCCESS` | 成功（绿，图标映射内置 `yes`） |
| `3` | `MESSAGE_LEVEL.WARN` | 警告（橙） |
| `4` | `MESSAGE_LEVEL.ERROR` | 错误（红） |

- **保留 success**：成功反馈是消息系统最高频场景（文档第一例即「已保存」），砍掉后无一键通道（只能 icon + className 手拼），成本远高于多一档；
- **宽松入参**：数字（`level: 3`）与名字符串（`level: "warn"`）同收，内部归一为数字（`normalizeMessageLevel`；非法值 warn + 回退 `0`）——`level` 是高频手写键，可读性权重高于 persist 场景的纯数值纪律；载体为 `const` 常量 + union（对齐 `MESSAGE_PERSIST` 先例，项目零 TS enum）；
- **序列化分工**：持久化 / 服务器 DTO / 镜像 items 存**数字**（与 Record 类型一致）；DOM `data-message-level` 属性值为**名字面**（CSS 选择器与 devtools 可读）。

### 三、排序 `level`（数字级别）移除——纯 FIFO

原 ADR-0072 的「越高级越靠列边端」定序能力整体删除：列内纯**到达序**、镜像按**创建序**、满员补位取**队首**。原实现三处定序逻辑（列内插入定位、镜像降序插入、补位 level 降序挑选）与 `_elEntries` 查序 Map 一并删除。

- 否决「新语义 level 兼任排序」：严重度与展示位置是正交概念（error 消息未必最该置顶），且绝大多数消息为 none → 排序实际失效；
- 否决「排序挪新键」：无真实场景输入（YAGNI），确有置顶诉求 fast-follow 再议。

### 四、DOM 属性与 CSS 契约

- `data-message-type` **让位给业务类别**（模板 `:data-message-type="type"` 绑定同词——值如 `"confirm"`）；
- 语义色迁 **`data-message-level`**（值 = level 名字面），CSS 语义色选择器（`.autospark-message[data-message-level="info"]` 等）同步换挂；该属性由 manager 在卡片根**写入与刷新**（`_mount` + `_applyEntryConfig`），不依赖模板绑定——自定义 shell 的 wrapper 同享契约；
- 换肤接口 `--autospark-message-{info,success,warn,error}-color` 变量名**保持不变**（名即 level 名，换肤面零 churn）；
- `options.messages.icons` 重映射键改为 level 名；`MESSAGE_TYPE_ICONS` → `MESSAGE_LEVEL_ICONS`。

### 五、兼容

未发布零迁移（persist 数值化同款先例）：localStorage 旧载荷 / 服务器 DTO 字段直接硬切；旧键 `kind` 脱离保留键清单（携带 → 未知键 warn，可发现）。

## 实现要点（防再踩）

1. **level 归一收口两处**：`_enqueue`（新建 entry 前）与 `_applyEntryConfig`（原地更新 / update / hidden 重显 / restore 共用路径）——其余代码见到的 `level` 恒为数字；
2. **`data-message-level` 不走模板绑定**：内置 shell 根虽有绑定能力，但 level 名字面转换若走表达式会把五元映射塞进模板；由 manager setAttribute 统一写，自定义 shell（无引擎类名契约的 wrapper）同样生效；
3. **排序删除后 `_elEntries` 无存在必要**——它只服务列内定序查序，随之删除（勿「以防万一」保留）；
4. `MESSAGE_DEFAULTS` 不含 `type`（业务类别缺省 `'toast'` 在合并处兜底，沿原 kind 先例），`level: 0` 在表——镜像 / state 真身的 `options.type` 键不复存在，断言全局默认改查 `options.level === 0`。

## 被否决 / 演变的方案

- **四档枚举（砍 success）**：成功场景替代成本远高于保留成本，一轮否决；
- **新 level 兼任排序**：语义与位置耦合，且 none 占多数使排序名存实亡；
- **排序挪新键（priority / order）**：无场景输入，YAGNI；
- **严格数值入参**：牺牲模板侧 `level: "error"` 可读性换不来真实收益；
- **`data-message-type` 保留语义色语义**：与字段名错位（字段 type = 业务类别），DOM 调试时 `data-message-type="confirm"` 一眼可辨；
- **TS `enum` 关键字**：项目零 enum 用例，对齐 `MESSAGE_PERSIST` 的 const 常量 + union 先例。
