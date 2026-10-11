# ADR-0103：AutoSparkAction 描述符字段 `name` 更名为 `id`

- 状态：已采纳（2026-10-11 grilling 共识落盘，同日实施）
- 日期：2026-10-11
- 关联：ADR-0036（action 描述符元数据——决策 3「name 以注册键注入」，本文更名其字段）、
  ADR-0038（x-loading 合成描述符与 `[{name,title}]` 按钮视图——描述符部分随之更名）、
  ADR-0102（通知事件命名——`ResolvedNotificationAction.name` 引用 `AutoSparkAction.name`，本文更新其引用）

## 背景

`AutoSparkAction` 描述符的注册键字段原名 `name`（ADR-0036 决策 3：由 ActionManager
以注册键统一注入/覆盖）。两个问题：

1. **撞名**：`name` 是 JS/HTML/DOM 中最泛滥的标识词（`Function.name`、`attr.name`、
   `schema.name`、组件/指令/修饰符各自的 `name`），引擎内部与用户代码读到
   `action.name` / `desc.name` 时无法自明是哪个域的 `name`——盘点中数十处
   `x.info.name` / `def.name` / `schema.name` 与它同屏出现；
2. **语义错位**：该字段的真实语义是**注册键 / 标识**（事件路径 `actions/<name>/*`、
   `action:<name>` 的键源），与展示文案 `title` 分工——`id` 恰是「标识」的直陈，
   `name` 则摇摆于「名」与「标识」之间。

## 决策

### 1. 描述符字段更名：`AutoSparkAction.name` → `AutoSparkAction.id`

- **纯更名，语义零变化**：仍由 ActionManager 以注册键统一注入/覆盖（用户声明里的
  `id` 不生效），`_normalize` / `createBuiltinAction` / x-loading 合成描述符同步注入 `id` 键；
- **硬切换，不留别名**：不保留 `name` getter、不做用户声明 `name` → `id` 的兼容映射
  （未发布零迁移惯例，同 ADR-0102「旧名彻底删除」）；引擎无版本号、无 npm 发布配置、
  描述符无序列化持久化（通知持久化白名单明确排除 actions），无迁移负担。

### 2. 事件载荷顶层键跟随：`payload` / `detail` 的 `name:` → `id:`

总线 `actions/<name>/{pending,resolved,rejected}` 的 payload 与 DOM `action:<name>`
的 `detail` 顶层键由 `name` 改 `id`（`AutoSparkEvents` 类型契约同步），避免
`desc.id` 与 `payload.name` 同值不同名的割裂。**字符串事件键不动**：
`actions/<name>/*`、`action:<name>`、`data-action="<name>"` 是通道名/属性值形态，
不是字段读写，保持原样。

### 3. 术语面随之更新

glossary「actions 域」「action DOM 事件」词条、CONTEXT.md「动作描述符」「合成动作
描述符」词条、`this.action.id` doc-comment、用户指南（action.md / initial.md /
notifications.md）中「`name` 由注册键注入」「payload 带 `name`」等描述一律改引 `id`。
x-loading 注入块 data 的 `[{name, title}]` 按钮视图键是**模板契约**（`:data-action="a.name"`），
与描述符字段是两回事，**不在更名范围**。

## 后果

- 用户代码迁移点：`desc.name` → `desc.id`、`this.action.name` → `this.action.id`、
  `m.payload.name` / `e.detail.name` → `.id`、通知对象形态 action 的 `name:` 键 → `id:`；
- 历史 ADR（0036 / 0038 / 0102 / 0010 / 0012 等）**原样保留**（决策记录不改写），
  其中的 `AutoSparkAction.name` 按当时事实阅读；
- 回归护栏：`action-meta.test.ts` / `buildAction.test.ts` / `x-loading.test.ts` /
  `notifications-events.test.ts` 已同步改断言（1836 pass，2 fail 为 x-foldable 存量失败、与本更名无关）。
