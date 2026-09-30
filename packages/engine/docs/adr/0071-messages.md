# ADR-0071：消息模块（MessageManager——轻提示升维为信息反馈与管理）

- **状态**：Accepted（共识已 grilling 四轮确认，实现未开始）
- **日期**：2026-09-30
- **关联**：[ADR-0068](0068-toast.md)（机制基座——三层结构 / 分区队列 / 原地更新 / 离场收拢 / shell 机制 / 动画 / 图标映射全部沿用，**API 面与生命周期决策由本文取代**）、[ADR-0061](0061-tooltip.md)（引擎级子系统先例）、[ADR-0062](0062-overlay-shell.md)（shell 机制）、[ADR-0052](0052-x-overlay-and-x-dialog.md)（双通道事件）、[ADR-0038](0038-x-loading.md)（actions 按钮行 hide 键）、[ADR-0036](0036-action-manager.md)（ActionDesc）、[ADR-0039](0039-animate-mechanism.md)（animate）、[ADR-0058](0058-icon-symbol-and-icon-domain.md)（图标域）、[CONTEXT.md](../../CONTEXT.md)（「消息（Message）」词条）
- **共识来源**：grilling 四轮决策（Q1~Q23），本文即共识落盘

## 背景

需求升维：轻提示（ADR-0068 已实现）从「瞬时呈现」升级为**全功能信息反馈与管理模块**——给用户呈现轻提示与通知；统一管理所有消息（业务提醒、通知、任务跟踪）。形态定位：**数据层收件箱式记录管理 + toast 呈现层**，消息中心 UI 不做（收件箱界面留给用户以指令自建）。

塑造设计的关键事实：

1. `ToastManager` 全套机制现成（分区 FIFO 队列 / 同 id 原地更新 / 离场收拢 / toast-shell 组件化 / animate / 图标域 / actions 协议）——本次是**域模型扩展**而非重写；
2. `read` / `status` / `persist` 要求消息作为**记录**存活——「关闭即删除」模型不满足，需要**记录与展示两态分离**；
3. `instantiateDetachedComponent` + props 整包注入是现成的渲染插槽管道——per-kind 渲染（`kinds[kind].render`）零新机制；
4. localStorage 与 fetch 是平台能力——`persist: 'local'` 与方案 A（引擎内置 fetch + 约定 JSON 协议）零新依赖；
5. actions 协议（ADR-0036/0038）双形态现成——`value` 键扩展即可覆盖「数据应答」场景，独立的 choices 按钮行机制被否决。

## 决策

### 一、形态与术语

#### 决策 1：引擎级子系统 MessageManager——`engine.messages`

`src/messages/` 的 `MessageManager`，服务挂 engine 实例（`engine.messages`），继承 `Map<string, MessageTask>`（键恒为 string id）。ADR-0068 的 `engine.toastManager` 属性**不保留**（未发布、无版本号，自由破坏性改名，无迁移负担）。

#### 决策 2：术语——「消息（Message）」上位词条

新立「消息（Message）」词条 = 引擎统一信息记录（kind 划分业务类别）；toast 降格为 **kind='toast' 的瞬时呈现形态**。CONTEXT.md「轻提示」词条对「通知」的 Avoid 对 Message 开放（Message 就是通知/提醒/任务的统一承载），对 Toast 仍避免。

#### 决策 3：兼容别名双保留

- `engine.toast()` 方法保留为 `messages.add({ kind: 'toast', ... })` 的别名转发（props 键按新模型归一）；
- 全局 `toast` action 保留，handle 同路转发 + **注入 `anchor = 发起元素`**（配套 action 家族统一注入，见决策 23——DOM 处调用天然获得上下文）；
- kind='toast' 的展示**双发旧事件** `toast:show` / `toast:hide`（迁移期兼容，文档标注弃用，随别名生命周期一并退役）。

### 二、数据模型

#### 决策 4：AutoSparkMessage 数据模型

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string?` | 记录 id（缺省自动生成）；同 id = 展示 props 原地更新 |
| `kind` | `string?` | 业务类别，**开放集合**，默认 `'toast'`；引擎仅 `'toast'`（呈现形态）与 `'task'`（progressbar 内部构造）有内置语义，`notice` / `remind` 等纯用户域零预设 |
| `type` | `ToastType` | 5 值封闭枚举（`none/info/success/warn/error`），驱动图标与语义色（ADR-0068 决策 12 沿用） |
| `icon` | `string?` | 显式图标，优先于 type 默认映射 |
| `title` | `string` | 消息标题（原 `message` 改名；HTML，走 `options.sanitizer`） |
| `body` | `string?` | 可选正文（HTML 同通道），渲染在下一行、字号小一号；缺省不渲染行 |
| `read` | `boolean?` | 已读标记；**卡片内任意 click**（含按钮/链接/关闭钮）置已读 |
| `delayClose` | `number?` | 自动关闭延迟 ms（原 `delay` 改名），默认 3000；`0` = sticky；hover 暂停/恢复剩余时间制（沿用） |
| `pos` | `ToastPos?` | 屏幕锚定 7 值枚举，默认 `top-right`（维持 ADR-0068 决策 7） |
| `status` | `number \| string?` | 业务层状态，**引擎纯透传存储 + 事件，零解释**，开发者自治 |
| `result` | `any?` | action `value` 写入的应答结果 |
| `href` | `string?` | 可选链接，尾随 external 图标；`target="_blank"` + `rel="noopener noreferrer"`；点击**不关闭**、置已读 |
| `closable` | `boolean?` | 关闭按钮（默认 false，沿用） |
| `persist` | `'none' \| 'local' \| 'remote'?` | 记录存续策略，默认 `'none'`（隐藏即删，toast 兼容语义） |
| `actions` | `MessageActionItem[]?` | 按钮行（沿 ADR-0068 双形态 + 新增 `value` 键，见决策 13） |
| `anchor` | `HTMLElement \| string?` | 局部 action 解析根 + 事件派发根（见决策 14） |
| `offset` / `animate` / `className` | | 沿 ADR-0068（列间距 / 动画 / 附加类名） |

#### 决策 5：生命周期状态机——记录与展示分离

```
记录（存活）：created ──⇄── 展示（queued / shown / closed）
                 │
        persist 决定存续：'none' 隐藏即移除（toast 兼容）
                        'local'/'remote' 隐藏转「已隐藏」态，记录存活可枚举
```

- **persist 控制的是记录存续，不是写入时机**；
- `messages` 可枚举范围 = 全部存活记录（展示中 + 已隐藏）；
- 持久化恢复的记录只入枚举、**不自动重弹**（需要时 `show(id)`）。

#### 决策 6：maxLen 缓冲

存活记录数上限（与 `showCount` 的**展示坑位**上限正交：showCount 管同屏、maxLen 管记录）。溢出 FIFO 丢最旧（按创建序，不豁免未读，文档标注）；默认不限，设置才生效。

### 三、API 面

#### 决策 7：`add` 三态入参 + 同 id 原地更新

```ts
engine.messages.add(input: string | MessageProps | (() => Promise<MessageProps | void>)): MessageTask
```

字符串简写 ≡ `{ title }`；async factory resolve `undefined` 静默跳过（条件通知，沿 ADR-0068）；同 id = 展示 props 原地更新（换内容重置计时、不重播动画，机制沿 ADR-0068 决策 5）。

#### 决策 8：`update(id, patch)`——记录级字段唯一写通道

`read` / `status` / `result` / `title` / `body` 等记录级字段编程式修改的**唯一入口**：补丁生效 = 改记录 + 发 `message:update` + 触发持久化。`MessageTask` 上 `read` / `status` / `result` 暴露为**只读 getter**——单一写通道，task 不可直写。

#### 决策 9：`show(id)` 重显

已隐藏记录重新走完整展示管线（入队、进场动画、满额 delayClose 计时）；展示中幂等 no-op 返回原 task；id 不存在 / 记录已移除 warn + 返回 `null`。**单参 KISS**——要改先 `update(id, patch)` 再 `show(id)`。

#### 决策 10：`delete` / `clear` / `dispose`

- `delete(id)`：**硬移除**（展示中即摘 DOM + 删记录；隐藏态删记录；persist 记录一并删——Map 硬移除语义不变，无动画）；
- `clear()`：清全部存活记录（含隐藏，带离场动画）；
- `destroy()` 收口：全部立即销毁 + 容器整体移除 + 持久化 flush（见决策 18）。

#### 决策 11：`confirm`——value-only actions 语法糖

```ts
engine.messages.confirm(message, { yes?: string, no?: string }?): Promise<any>
```

- ≡ `add({ title, delayClose: 0, actions: [{ title: yes ?? '确定', value: true }, { title: no ?? '取消', value: false }] })`；
- 点击 choice action 时 resolve 其 `value`；
- **sticky 永不 settle**（永不自动关、永不 reject——调用方自行赛跑超时，文档标注）；
- `pos` 跟随全局默认 `top-right`（不特殊居中）；并发堆叠（同分区队列）；无遮罩非模态——confirm 是「加强版 toast」，模态语义走 dialog 体系。

#### 决策 12：`progressbar`——进度任务

```ts
const task = engine.messages.progressbar(props): ProgressTask
// ProgressTask extends MessageTask + { start, pause, resume, stop, cancel, progress(n) }
```

- **进度能力由 kind='task' 提供（非通用消息功能）**（progressbar 是其行为句柄糖）：`task-shell`（决策 16 内置注册表）渲染进度条——直接 `add({ kind: 'task', progress: 50 })` 同样获得进度条渲染（推进经 `update(id, { progress: n })`），`progressbar()` 只是在该 kind 之上封装 `ProgressTask` 行为句柄（start/pause/resume/stop/cancel/progress）——「数据能力（kind + progress 键）」与「行为句柄（API 糖）」分层；**`progress` 是 kind='task' 专属键**：其他 kind 的 add / update 携带 progress → warn + 忽略（封闭清单的 kind 特例校验）；
- `props.progress?: number` 初始进度（0~100，缺省 0，task 域展示键进 data 域驱动响应式）；
- `props.progress?: number` 初始进度（0~100，缺省 0，展示键进 data 域驱动响应式）；
- `progress(n)`：clamp 到 [0,100]，写 progress 展示键（同 id 原地更新红利）；**创建不自启**，显式 `start()`；
- `pause()` 闸门：pause 后 `progress(n)` 调用被忽略，`resume()` 恢复接受（否则 pause 对引擎无意义——进度本就是开发者推进的）；
- `progress(100)` / `stop()` = 完成态：按 `delayClose`（默认 3000）展示后关；`cancel()` = 中止、立即关；**进行中不计时**（sticky），完成后才进入 delayClose 倒计时；
- 任务卡片**照常渲染 actions 行**（与 message-shell 同构）——如「取消」按钮 `{ title: '取消', handle: () => task.cancel() }`，引擎不自动注入取消动作；
- indeterminate 不确定进度 v1 不做（fast-follow）。

### 四、actions 与 anchor

#### 决策 13：action `value` 键——数据应答闭环

`MessageActionItem` 对象形态增加 `value?: any`。点击闭环顺序：

**置已读 → `value` 存在则写 `message.result = value` → 发 `message:action` 事件 → `handle` 存在则调用 → `hide` 判定关闭**

- `value` 与 `handle` **正交可并存**（记录选择又执行行为）；
- 字符串全局 action 形态无 value 通道（confirm 用内联对象构造 value-only actions）；
- choices 独立按钮行被否决（见被否决方案）。

#### 决策 14：`anchor`——三职合一（action 解析根 / 事件派发根 / 数据视图基准），非定位

`anchor: HTMLElement | string`（string 选择器在 add 时一次性 `querySelector`，未命中 warn + 按无 anchor 处理）。**三职恒成立、不区分来源**（配套 action 注入或 API 显式传同规）：

- ① **局部 action 解析根**：actions 字符串沿 anchor 的 scope 链解析局部 action（无 anchor 维持 ADR-0068 只查全局表）；
- ② **事件派发根**：action 生命周期事件以 anchor 为根额外派发（宿主子树可监听）；
- ③ **渲染组件数据视图基准（dataContext，Q26 补充决策）**：anchor 存在时，kind render 组件实例化从 rootless 改为**挂链 anchor 所在 scope**——render 模板表达式可访问发起元素的数据域（x-data / store 视图），响应式订阅经 scope.watch 通道天然生效；无 anchor 维持 rootless（仅 props 整包消费）。render 组件**定义查找**仍走 `options.components` 全局表（anchor 改变实例化父 scope，不是定义查找域）；卡片 teardown 只销毁卡片自身 scope（子域）+ 回收 `$scopes` 键，不触达 anchor scope 链（与 overlay dataContext 生命周期同构）；
- 术语：复用 overlay 家族既有概念 **dataContext**（ADR-0053 数据视图基准），消息域不造新词——「anchor 即消息的 dataContext」；
- **元素定位不是 anchor 的职责**——定位仍 fast-follow（ADR-0068 决策 7 的砍除不变，届时走 floating-ui 共享装配）。

### 五、配置与合并链

#### 决策 15：`options.messages` 三态 + 四层合并链

```ts
AutoSparkOptions.messages: false | MessageOptions
```

- `false` = 整体不初始化，`engine.toast()` 别名与 `toast` action 一并 warn + no-op（沿 ADR-0068 决策 6 全关语义）；
- **合并链：内置默认 < `options.messages` < `options.messages.kinds[kind]` < 单次 props**（浅合并逐键覆盖）；
- `kinds` 的值只允许**消息级键**，出现 manager 级键（`url` / `maxLen` / `pos` / `showCount` / `headers` / `shell` / `icons` / `kinds`）warn + 忽略；
- `delayClose` 默认 3000、`0` = sticky；`pos` 默认 `top-right`；kind 缺省 `'toast'`。

#### 决策 16：`kinds[kind].render` 渲染插槽

查找协议（每条消息按其 kind 实例化时解析，四级）：

```
kinds[kind].render（用户 kind 级插槽）
  → options.messages.shell（用户全局兜底——kind 开放集合无法穷举 render）
    → 内置注册表按 kind（引擎内置：'task' → task-shell）
      → 内置 message-shell（最终默认）
```

- 前两级是**用户配置**（同一概念的两个作用域层，吸收进既有「用户组件（全局表）→ 内置默认」协议）；后两级是**引擎内置**（按 kind 注册表 + 最终默认兜底）——用户配置恒压过引擎内置；
- **内置 render 一组件一文件**（Q24 补充决策）：`src/messages/renders/` 目录，`message-shell.ts`（默认外壳，无进度槽）与 `task-shell.ts`（kind='task' 专属，进度槽由它全权渲染，**actions 行与 message-shell 同构照常渲染**）；后续新增内置 render 同规（一个文件一个）；
- **props 注入升级**：消息记录**全量数据域整包**（剥函数）：`{ id, kind, title, body, type, icon(已解析), actions(已解析), closable, href, read, status, result, progress(仅 kind='task' 携带), delayClose }`——自定义 render 需要什么取什么；
- `render` 仅收组件名字符串，走 `options.components` 全局组件表查找（manager 级无 el 不查 scope 链）；
- 自定义接管 `kind='task'`（render 指向自定义组件）时进度条渲染随接管者自带（`props.progress` 驱动）——内置 task-shell 的进度渲染不是特权通道。

### 六、持久化与同步（方案 A：引擎内置 fetch + 约定协议）

#### 决策 17：`load(url?)`——服务器拉取

- `fetch(GET)`（url 参数 > `options.messages.url` 默认）；
- 响应体约定为 **AutoSparkMessage JSON 数组**（函数字段服务端不返回：handle / el / anchor 不存在；字符串 action 名保留）；
- 合并语义：按 `id` 去重**覆盖**（服务端为准）、新 id 追加；
- **只入记录不弹**（与持久化恢复不重弹同纪律——100 条通知全弹淹没屏幕，需要时开发者 `show(id)`）；
- 失败 warn + resolve 空数组（不 reject 中断调用方）；返回 `Promise<MessageTask[]>`。

#### 决策 18：persist 写协议

- **local**：localStorage key `autospark-messages`；记录变更（add / update / read / status / dismiss）即**同步全量写**（同步便宜，无防抖）；
- **remote**：`POST options.messages.url`，body = **存活记录全量 JSON 数组**（与 load 格式对称、服务端整体替换语义）；变更**防抖 500ms 合并写**（已读风暴不打爆服务器）；`headers?: Record<string, string>` 透传 fetch（鉴权只此一通道，不做鉴权抽象）；`save()` 立即 flush 返回 Promise；`destroy()` 时尝试 flush（`fetch keepalive` 兜底页面卸载）；
- **序列化**：数据字段全集（id/kind/type/icon/title/body/read/delayClose/pos/status/href/closable/persist/result/className/animate/offset/actions 字符串名），**剥除所有函数**（handle / factory）与运行态（el / anchor / timer / progress）；恢复后字符串 action 重查全局表、**内联 handle 永久丢失**（文档标注）。

#### 决策 19：SSR 边界

localStorage 缺失 → local 持久化 warn + no-op；fetch 通道（load / save）SSR 可用；显示侧沿 ADR-0068 `typeof document` 守卫。

### 七、事件

#### 决策 20：`message:*` 事件族

`message:add` / `message:update` / `message:show` / `message:hide` / `message:read` / `message:status` / `message:action`——双通道（引擎总线 + 卡片元素 dispatchEvent，ADR-0052 同构）；payload `{ message: MessageTask, el: HTMLElement | null }`，`message:action` 追加 `{ action, value? }`。kind='toast' 时**双发**旧事件 `toast:show` / `toast:hide`（迁移期兼容，见决策 3）。一切移除路径均广播 `message:hide`。

### 八、命名契约

#### 决策 21：message 化统一更名

`MessageManager` / `src/messages/` / 内置外壳 `message-shell` + `task-shell`（`src/messages/renders/` 目录**一组件一文件**，Q24 补充决策）/ 卡片类名 `autospark-message`（双类名根 `autospark-dialog autospark-message` 沿用）/ 卡片骨架为**纵向堆叠**（Q27 预览修订，非现行 toast 的单行 flex 横排）：① 图标 + title 行（行尾关闭钮）→ ② 进度槽（task 域，进度为主状态置于 body 之前）→ ③ body（小一号，与 title 缩进对齐）→ ④ **actions 独立行**（不与 title 同行，link 形态）/ **语义色沿现行 toast 实现契约**（Q27 预览确认）：全边语义色 border + 同色系超淡底（`color-mix` 7% 混白随主色自动调和）+ 图标着色，内部单一消费点 `--autospark-message-accent`（各 type 经 `data-message-type` 分派到换肤接口 `--autospark-message-{type}-color`；`none` 灰边白底纯中性）——ADR-0068 决策 13 文本的「左 3px accent 条」未随实现保留，**废止** / `--autospark-message-z` 默认 1100 / 分区列标记 `data-message-pos`。CONTEXT.md 登记词条「消息（Message）」、修订「轻提示」与外壳词条。

### 九、配套 action（Q25 补充决策）

#### 决策 22：内置 `confirm` action——模板快速确认 + 结果事件回流

- `BUILTIN_ACTIONS` 注册 `confirm`（**执行型**，继 `toast` 之后第二个）：`handle(payload, ctx)` → `engine.messages.confirm(归一化 payload)`，并**注入 `anchor = 发起元素`**（action context 的 el）——确认/取消点击的 `message:action` 事件以发起子树为根额外派发（决策 14 anchor 事件派发根），模板就近消费：`detail.value`（`true` 确认 / `false` 取消）、`detail.message.id` 区分并发；
- **payload 归一化**：字符串 | props 对象；对象形态 `yes` / `no` 为**可提取键**——confirm 内部剥离转按钮文案、不落消息 props（否则未知键 warn）；API 第二参 `texts` 保留，优先级高于 props 键；
- **结果消费零新机制**：复用决策 13 点击闭环（置已读 → 写 result → 发 `message:action` → handle → hide）+ 决策 14 anchor 派发根，不发专属事件；
- **惯例对齐 toast action（决策 3）**：用户同名声明覆盖内置（先扫用户先占）、广播保留（`actions/confirm/*` 双通道，发起时点）、`options.messages: false` 时 warn + no-op。

#### 决策 23：配套 action 家族——`toast` / `confirm` / `task` 统一注入 anchor（Q26 补充决策）

与 Message API 配套的内置 action 三件套（均为执行型）：

| action | 转发 | payload |
| --- | --- | --- |
| `toast` | `messages.add({kind:'toast', ...})`（决策 3 别名） | 字符串 \| props |
| `confirm` | `messages.confirm(...)`（决策 22） | 字符串 \| props（`yes`/`no` 可提取键） |
| `task` | `messages.progressbar(...)`（决策 12） | props（含 `progress` 初始值） |

- **统一注入 `anchor = 发起元素`**（action context 的 el）——DOM 处使用 action 天然获得上下文：结果/进度事件以发起子树回流，kind render 组件获得发起域数据视图（决策 14 职责 ③）；
- **anchor 仅在 API 方式调用时显式传入**——编程式调用无注入；
- `task` action 的 `ProgressTask` 句柄经 handle 返回值与 `actions/task/*` 广播 payload 交付；进度推进仍为**编程式**（action 只负责展示引导）；
- 惯例统一：用户同名声明覆盖内置（先扫用户先占）、生命周期广播保留（`actions/<name>/*` 双通道，发起时点）、`options.messages: false` 时 warn + no-op。

## 被否决的方案

- **choices 独立按钮行**（`{label?, value, icon?}[]` 值按钮排）：actions `value` 键覆盖数据应答场景（点击写 result + 事件），双排按钮机制重复——砍；
- **内置消息中心 / 收件箱 UI**：引擎只做数据层 + toast 呈现，收件箱用指令自建（x-for 绑定枚举 + 事件计数）——UI 面巨大且指令体系已可十行表达；
- **持久化适配器接口（方案 B）**：共识选择方案 A——引擎内置 fetch + 约定 JSON 协议（GET 数组 / POST 全量），端点与方法约定死（`url` / `POST`），鉴权仅 headers 透传；
- **AutoStore 响应式域承载消息列表**：与引擎 store 生命周期耦合、序列化边界模糊、与 toast/tooltip/overlay「命令式子系统 + 事件」既有架构分叉——Map + `message:*` 事件族一致；
- **`kind: string | number`**：kinds 配置对象的数字键无优雅表达、业务类别数字无语义——string only；
- **pos 默认 center**：维持 ADR-0068 `top-right`（antd message 先例、center 遮挡页面中心内容），confirm 亦不特殊；
- **confirm 居中 / 遮罩 / Esc 关闭**：confirm 是「加强版 toast」非模态对话框，模态语义归 dialog 体系；
- **MessageTask 可写 read/status/result**：task 只读 getter，写走 `update(id, patch)` 单一通道；
- **`show(id, patch)` 带补丁重显**：KISS 单参——要改先 `update` 再 `show`；
- **load 默认弹出**：100 条通知全弹淹没屏幕（showCount 只能排队不能减量）——只入记录、按需 `show(id)`；
- **remote 增量写 / 每变更立即 POST**：全量 + 防抖 500ms——已读风暴不打爆服务器，且协议与 load 对称（服务端整体替换语义）；
- **`task.pause` 纯状态标记**：pause 后 `progress(n)` 调用被忽略的闸门语义（否则 pause 对引擎无意义）；
- **indeterminate 不确定进度**：v1 只做确定进度，fast-follow；
- **`persist?: boolean`**（初稿形态）：被三态 `'none' | 'local' | 'remote'` 取代（初稿自我修订）。

## 后果

- ✅ 数据层与呈现层正交：同一消息模型承载轻提示 / 通知 / 提醒 / 任务跟踪；`persist` 一键切换「瞬时 toast」与「收件箱式存续记录」。
- ✅ 机制复用面最大化：分区队列 / 原地更新 / 离场收拢 / shell 实例化 / animate / 图标域 / actions 协议全部现成；per-kind 渲染插槽（`kinds[kind].render`）零新机制。
- ✅ `value` 键让 actions 同时覆盖行为执行与数据应答，confirm / 自定义问卷类交互零新 API。
- ⚠️ 引擎新增网络行为（load / persist remote）——传输协议为**约定**而非配置（GET / POST url 全量数组），不适配的服务端需自行加适配层。
- ⚠️ 持久化剥函数：内联 handle 跨会话永久丢失（字符串 action 可恢复）；恢复记录不自动重弹——两者均文档标注。
- ⚠️ 别名双发旧事件（toast:show/hide）是迁移期债务，随别名退役。
- ⚠️ maxLen 溢出丢最旧不豁免未读；sticky（含 confirm / 进行中任务）永占坑位——边界文档标注不设防。

## 测试

`src/__tests__/messages.test.ts`（沿 toast.test.ts 模式改造扩展）：

- 数据模型：字段归一（message→title / delay→delayClose）、未知键 warn、kind 缺省 'toast'；
- 生命周期：persist='none' 隐藏即删 / 'local' 存活枚举、show(id) 重显（满额计时 / 幂等 / 不存在 null）、maxLen 溢出 FIFO；
- API：add 三态、同 id 原地更新、update 单一写通道（task 只读 getter / message:update 事件）、markRead / markAllRead、delete / clear / dispose；
- actions value：点击闭环顺序（已读 → result → 事件 → handle → hide）、value+handle 并存、confirm（Promise resolve value、{yes,no} 文案、永不 settle、堆叠）；
- progressbar：不自启 / progress clamp / pause 闸门（忽略 / resume 恢复）/ 100% 完成态 delayClose 收口 / cancel 立即关；
- anchor：string 选择器解析与未命中 warn、局部 action 沿 scope 链解析、事件以 anchor 派发；
- 配置：options.messages 三态、四层合并链、kinds 非法键 warn、render 四级查找协议（kinds[kind].render > shell > 内置按 kind 注册表 > message-shell 兜底；task → task-shell）、内置一组件一文件、props 全量注入剥函数；
- 持久化：local 同步全量写 / 恢复不重弹 / 序列化剥函数 / remote 防抖合并 POST / save flush / headers 透传 / SSR localStorage 缺失 warn；
- load：GET 数组格式 / id 覆盖合并 / 只入记录不弹 / 失败 resolve []；
- 事件：message:* 族双通道 payload、kind='toast' 双发 toast:show/hide、一切移除路径广播 hide；
- 别名：engine.toast() 转发（props 归一）、toast action 广播、options.messages: false 全关（别名一并 no-op）；
- 内置 confirm action（Q25）：payload 归一化（yes/no 可提取键剥离）、anchor 注入发起元素（`message:action` 就近回流 `detail.value`）、`actions/confirm/*` 广播、用户同名覆盖、`messages: false` no-op；
- anchor 三职与配套 action 家族（Q26）：dataContext 挂链（render 表达式访问发起域 + 响应式订阅 / 无 anchor rootless）、task action 转发 progressbar（`actions/task/*` 广播交付 ProgressTask、推进编程式）；
- 沿用回归：分区队列 / hover 暂停 / pos 枚举 / type 图标语义色 / 离场收拢 / stop 不动 destroy 收口 / 多引擎独立。

## fast-follow 清单

1. `anchor` 元素**定位**（floating-ui 共享装配 + autoUpdate，ADR-0068 遗留——本文 anchor 仅作用域根）；
2. 满员折叠「+N」徽标展开；
3. indeterminate 不确定进度（progressbar）；
4. a11y：`role="status"` / `aria-live` 动态关联；
5. 触屏场景 hover 暂停退化策略；
6. manager 运行时改配置（`configure(partial)`）；
7. 别名（engine.toast / toast action / toast:show 双发）退役期规划。

## 废止

- ADR-0068 的 **API 面与生命周期决策**由本文取代：决策 4（入口 `toast` → `messages.add`、`message` → `title`、`delay` → `delayClose`）、决策 5（关闭即删 → persist 三态存续 + 记录/展示分离）、决策 6（`options.toast` → `options.messages` + kinds 层）、决策 11（内置模板扩容 title/body/href/进度槽 + shell → render 插槽）、决策 14（actions 增 value 键）、决策 15（全局 toast action → 别名）、决策 17（toast:show/hide → message:* 族）；
- ADR-0068 的**机制决策继续有效**：三层结构（决策 2）、复用边界（决策 3）、纯屏幕锚定与 pos 7 值（决策 7）、分区 FIFO 队列（决策 8）、delay/sticky/hover（决策 9）、stop 不动 destroy 收口（决策 10）、type 5 值图标映射（决策 12）、语义色双层变量（决策 13）、动画方向自适应（决策 16）；
- CONTEXT.md「轻提示（Toast）」词条修订为 kind='toast' 呈现形态、「轻提示外壳（toast-shell）」更名为「消息外壳（message-shell）」；`engine.toastManager` 登记已废弃词条。
