# 通知

## 概述

通知是 AutoSpark 的统一信息反馈与管理模块（ADR-0071），以**官方插件**形态随 `@autospark/plugins` 包分发（ADR-0001：子系统自 engine 迁出，引入即挂载，见[安装](./installation.md)）：数据层收件箱式记录管理 + 屏幕分区栈呈现，一套模型承载轻提示 / 通知 / 业务提醒 / 任务跟踪。命令式（`engine.notifications`）与模板声明（内置全局 `toast` action）双通道发起；状态经保留键 `$notifications` 暴露进 `store.state`（ADR-0072——通知中心面板 / 未读角标模板直绑）：

```ts
// 命令式：任意 JS 代码处
const session = engine.notifications.show({ title: "已保存", level: "success" });
```

```html
<!-- 声明式：模板任意可执行 action 处（toast 为内置别名） -->
<button @click="toast('已保存')">保存</button>
```

## 快速入门

三个内置 type 各有专属语义、专属会话与快捷方式（自定义 type 回基类会话面，见[全局默认与类型配置](#全局默认与类型配置)）——分别展开为独立章节：[轻提示](./toast.md) / [通用确认](./confirm.md) / [任务](./task.md)：

<demo html="notifications/types.html"/>

### 轻提示（toast）

一行调用、默认 3 秒自动消失——`level` 决定图标与语义色（详见 [轻提示](./toast.md)）：

```ts
engine.notifications.toast({ title: "已保存", level: "success" });
```

<demo html="notifications/quick-toast.html"/>

### 确认（confirm）

非模态双钮确认——`await` 会话直接得用户选择（确定 → `true` / 取消 → `false`，详见 [通用确认](./confirm.md)）：

```ts
const ok = await engine.notifications.confirm("确认删除？", { yes: "删除", no: "再想想" });
if (ok) deleteFile();
```

<demo html="notifications/quick-confirm.html"/>

### 任务（task）——异步下载文件

`task()` 返回 Task 会话——`progress(n)` 推进进度条、`complete()` 完成收场（自动模式创建即 running，无需显式 `start()`，详见 [任务](./task.md)）：

```ts
const s = engine.notifications.task({ title: "下载 dataset.zip", closeWhenDone: 1200 });
for (const chunk of chunks) {
    await fetchChunk(chunk);      // 分块下载
    s.progress(pct);              // 实时推进
}
s.complete();                     // ≡ 进度 100 → 1.2s 后自动关
```

**factory 写法**——全部逻辑在 factory 内：`return` 的初始 props **立即弹卡**，下载逻辑作为异步闭包继续驱动进度条；用户按下 停止 / 取消 / × 时 `session.abortSignal` 中断、`onStop` 等便捷订阅收到通知（见 [进度任务](./task.md#进度任务)）：

```ts
engine.notifications.task(async (session) => {
    void (async () => {                          // 下载闭包：不 await——让 return 先执行（卡先弹）
        for (const chunk of chunks) {
            await fetchChunk(chunk, session.abortSignal);  // 停止/取消/× 任一触发即中断
            session.progress(pct);               // 实时推进（session 激活后直接生效）
        }
        session.complete();                      // ≡ 进度 100 → closeWhenDone 后自动收
    })();
    return { title: "下载 dataset.zip", closeWhenDone: 1200, canStop: true, canCancel: true };
});
```

<demo html="notifications/quick-task.html"/>

## 基础用法

### 发起通知的三种写法

`engine.notifications.add(input)` / `engine.notifications.show(input)` 接受三种形态：

**字符串简写**——属性值即通知标题，等价 `{ title }`，默认 3 秒自动关：

```ts
engine.notifications.add("已保存");
```

**配置对象**——承载全部保留键（见[配置参数](./config.md)）：

```ts
engine.notifications.add({
    title: "删除失败",
    description: "文件被占用，请关闭后重试",
    level: "error",
    delayClose: 0,
    actions: [{ title: "重试", handle: retry }],
});
```

**async factory（条件通知 + 挂起会话注入）**——同步返回挂起会话并注入 factory（挂起期可 `update()` 缓存补丁、`cancel()` 取消）；resolve `undefined` / `void` 则**静默不弹**（内容就绪才提示）；**第二参 type** 指定挂起会话的类别（factory 内即可用 task/confirm 域方法，return props 的 type 与之冲突时以声明为准）：

```ts
engine.notifications.add(async (session) => {
    const hasUpdate = await checkUpdate();
    return hasUpdate ? { title: "发现新版本", level: "info" } : undefined;
});

// 需要 task 域方法时用第二参声明 type（挂起即 Task 会话）：
engine.notifications.add(async (session) => {
    session.update({ level: "info" });              // 挂起期缓存补丁
    checkUpdate().then(() => session.progress(60)); // 激活后照常驱动
    return { title: "检查更新", delayClose: 0 };
}, "task");

// 快捷方式等价（factory 形态自动透传 session 且已锁定 type）：
engine.notifications.task(async (session) => { ... });
```

<demo html="notifications/input.html"/>

### 通知会话

`add(...)` / `show(...)` 返回**按 type 分派的会话实例**（ADR-0083 class 家族）——**session = 全部业务逻辑、渲染组件纯 UI**（1:1 绑定，`session.el` 即组件根）；`read` / `status` / `result` 为**只读 getter**（写走 [`update`](#已读与业务状态)）：

```ts
class AutoSparkNotificationSession {         // 基类面（自定义 type 返回它）
    readonly id: string;                // 记录 id（缺省自动生成）
    readonly type: string;              // 业务类别（默认 'toast'）
    readonly el: HTMLElement | null;    // 卡片根 = 渲染组件根（排队未显示 / 已隐藏为 null）
    show(): void;                       // 重显已隐藏记录（完整展示管线；展示中幂等）
    hide(): void;                       // 关闭（走离场动画，组件销毁；幂等；factory 挂起期 = 取消）
    remove(): void;                     // 硬移除记录（含持久化数据立即同步删除）
    update(patch): void;                // 记录级补丁（manager.update 句柄面；factory 挂起期缓存）
    cancel(): void;                     // 取消：挂起期丢弃 / 展示中立即关
    readonly closed: boolean;           // 是否已关闭（隐藏记录仍存活、可 show() 重显）
    readonly read: boolean;             // 已读标记（只读）
    readonly status: number | string | undefined; // 业务状态（只读）
    readonly result: any;               // action value 应答（只读）
}

// type 分派子类（add() 内部 switch 实例化；类型面 = 运行时面——基类实例无 task 方法）：
class AutoSparkTaskNotificationSession extends AutoSparkNotificationSession {
    start(): void; progress(n: number): void;
    pause(): void; resume(): void;
    stop(): void; complete(): void;      // complete ≡ stop（完成的显式别名）
    cancel(): void;                      // 中止：立即关（无完成态）
}
class AutoSparkConfirmNotificationSession extends AutoSparkNotificationSession {
    yes(): void; no(): void;             // ≡ 点击对应按钮（value 闭环）
    then(...);                           // thenable：await 即得 choice 应答
}
```

- **JS 侧编程应答**：`engine.notifications.respond(id, value)`（≡ 会话 `yes()` / 点击按钮，同一闭环）；展示结束的感知走 `notifications/*/*/hide` 事件（分层命名，ADR-0102）与 `closed` getter（详见 [事件](./events.md)）；
- **`notifications.sessions`**：全部存活会话的注册表——即 manager 本身的 Map 正名视图（`sessions.get(id)` ≡ `notifications.get(id)`，随 remove 同步进出；注意与 `$notifications.sessions` **展示序 id 数组**是两个东西，见 [数据视图](./data.md)）；
- **factory 挂起注入**：`add(async (session) => ...)` 同步创建挂起会话传入——挂起期 `session.update()` 缓存补丁（return 落地时合并）、`session.cancel()` 取消；`return props` = 初始展示配置（`undefined` 静默跳过）；
- **死会话**：`remove()` 后会话死亡，后续方法 no-op + warn（不复活）；
- **methods 直达**：卡片模板内直接调用本卡片组件的 methods——`@click="hide()"`、`@click="progress(50)"`（shell 公共 methods 七件 + type 自有 methods；`$session` 派生变量已随 ADR-0089 退役，详见[自定义卡片](./custom.md#自定义卡片)）。

<demo html="notifications/session.html"/>

### 快捷方法与模板按钮

`show` 是统一入口，三个内置 type 另有**便捷层**（均强制对应 type——误传他 type 一律归位）：

```ts
engine.notifications.toast({ title: "已保存", level: "success" });  // ≡ show({ ...props, type: 'toast' })

const ok = await engine.notifications.confirm("确认删除该文件？", { yes: "删除", no: "再想想" });
// ≡ show({ type: 'confirm', delayClose: 0, 双钮 })——返回 Confirm 会话（thenable：await 即得应答）

const upload = engine.notifications.task({ title: "上传中", closeWhenDone: 3000 }); // ≡ show({ type: 'task' })——完成 3 秒后收口（缺省常驻）
```

模板侧有配套的全局 action `toast` / `confirm` / `task`（内置执行型，用户同名声明覆盖）：

```html
<button @click="toast('已保存')">保存</button>
<button @click="confirm({ title: '确认删除？', yes: '删除', no: '再想想' })">删除</button>
<!-- 结果回流：总线通配订阅 actions 事件（信封 payload.value：true 确认 / false 取消；
     payload.notification.id 区分并发）——事件名含运行时 id，模板侧无法预知，回流走总线 -->
<script>
    engine.on("notifications/*/*/actions/*", ({ payload }) => {
        onChoice(payload.value);
    });
</script>
```

- `toast`：payload（字符串 | 配置对象）转发 `show({ type: 'toast', ... })`；
- `confirm`：payload 对象的 `yes` / `no` 键定制按钮文案，结果经 `notifications/<type>/<id>/actions/<名>` 事件回流（`payload.notification.id` 区分并发；ADR-0102 分层命名，见 [事件](./events.md)）；
- `task`：payload 转发 `show({ type: 'task', ... })`，Task 会话句柄经 `actions/task/*` 广播 payload 交付（进度推进仍为编程式）；
- 三个 action 均广播各自生命周期信号（`actions/toast/*` / `actions/confirm/*` / `actions/task/*`）；`notifications: false` 时均 warn + no-op。

**双通道发起与 anchor**：action 在元素上使用时**自动注入宿主元素为 anchor**（局部 action 解析根 / 事件派发根 / 渲染数据视图基准——自定义 renderer 可访问发起域数据）。编程式调用不自动注入，显式传 `anchor` 等价（详见 [数据视图 · 关联页面元素](./data.md#关联页面元素)）：

```ts
// 模板 @click="confirm({ title: '删除？' })"  ≡  编程式显式传 anchor：
engine.notifications.show({
    title: "删除？",
    type: "confirm",
    anchor: document.querySelector("#del-btn"), // HTMLElement | 选择器字符串
    delayClose: 0,
});
```

<demo html="notifications/api.html"/>

### 全局默认与类型配置

`options.notifications` 承载全局默认，合并链：`内置默认 < options.notifications < options.notifications.types[type] < 单次 props`（浅合并逐键覆盖）——**type 是给每类通知定默认值的钩子**：

```ts
const app = new AutoSpark(el, state, {
    notifications: {
        pos: "top-right",        // 全站右上角（默认）
        delayClose: 3000,        // 全局 3 秒
        showCount: 5,            // 每列同屏最多 5 条
        types: {
            notice: { delayClose: 0 },  // 通知 sticky（closeable 默认 true 常显 ×，可手动清坑）
            remind: { level: "warn" },                  // 提醒默认警示色
        },
    },
});
```

- `type` 是**开放集合**（默认 `'toast'`）：`notice` / `remind` 等纯用户域，引擎零预设；三个内置语义 type（`toast` / `confirm` / `task`）另有一层**内置 type 种子默认**（confirm / task 的 `width: 300`）——位于内置默认与 `options.notifications` 之间，用户任意配置层（全局 / types[type] / 单次）可覆盖；
- `types` 的值只允许通知级键——出现 `url` / `maxLen` / `pos` / `showCount` / `headers` / `shell` / `icons` 等 manager 级键 warn + 忽略（完整清单见[配置参数](./config.md)）；
- `notifications: false` **整体关闭**：不建容器、不注样式，`engine.notifications` 与全局 `toast` action 调用均 warn + no-op。

<demo html="notifications/defaults.html"/>

### 屏幕位置与排队

`pos` 七值枚举：`top-left` / `top-center` / `top-right`（默认）/ `bottom-left` / `bottom-center` / `bottom-right` / `center`。

<demo html="notifications/pos.html"/>

队列语义（ADR-0068 决策 8 沿用；ADR-0079 定序简化）：

- **按 pos 分区各计**：每列独立队列，上限 `showCount`（默认 5）——右上排满不阻塞右下入队；
- **纯到达序 FIFO**：列内按到达顺序 append、满员排队按队首补位（原「level 越高越靠列边端」定序已随 ADR-0079 移除——`level` 只管图标与语义色，与展示位置无关）；
- **离场平滑收拢**（兄弟随布局流上移无跳动）；
- `offset` 仅该列首次创建时生效（不迁移已建列）。

### 原地更新

同 id 重复 `add` = **原地更新**而非销毁重建（上传进度类场景）：

<demo html="notifications/update.html"/>

- **显示中**：换内容、重置 delayClose 满额计时、不重播动画；**排队中**：只换内容；
- 更新基准是**当前生效配置**——未传的键保留原值；
- `pos` / `offset` / `id` 更新时忽略（不迁移已建列）；
- 同 id 更新的是**展示 props**；`read` / `status` / `result` 等记录级字段走 [`update(id, patch)`](#已读与业务状态)。

### 标题与正文

`title` 是通知主行（HTML，经 `options.sanitizer` 消毒）；`description` 是可选正文，渲染在下一行、字号小一号，缺省不渲染行：

```ts
engine.notifications.add({
    title: "版本 2.0 已发布",
    description: "包含 12 项改进与 3 项修复，查看 <b>更新日志</b> 了解详情。",
    level: "info",
});
```

<demo html="notifications/body.html"/>

### 严重度与图标

`level` 五档封闭枚举（ADR-0079，原 `type` 语义色数值化）：`none: 0`（默认）/ `info: 1` / `success: 2` / `warn: 3` / `error: 4`——常量 `NOTIFICATION_LEVEL`，**宽松入参**（数字与名字符串同权，`level: "warn"` ≡ `level: 3`，非法值 warn + 回退 `none`）。驱动图标（同名词映射，success→内置 `yes`）与语义着色——**全边语义色 border + 同色系超淡底**（`color-mix` 混白随主色自动调和，换肤一处生效）+ 图标着色；`none` 灰边白底纯中性。`icon` 显式指定优先于 level 默认；`options.notifications.icons` 键重映射（键 = level 名）；换肤接口为 `--autospark-notification-{info,success,warn,error}-color` 四变量（变量名不变）。`level` **只管视觉语义，与展示位置无关**（原排序用途已移除）。

<demo html="notifications/level.html"/>

### 附带链接

`link` 提供时通知尾部出现 external 图标链接：新标签打开（`target="_blank"` + `rel="noopener noreferrer"`）、**点击不关闭通知**、置已读：

```ts
engine.notifications.add({
    title: "新版本可用",
    link: "https://example.com/release",
    delayClose: 0,
});
```

<demo html="notifications/href.html"/>

### 操作按钮与应答

`actions` 双形态（沿 ADR-0068），对象形态新增 **`value` 键**——数据应答通道：

```ts
// 对象 = 局部一次性按钮：不进全局 action 表，点击直调
engine.notifications.add({
    title: "已删除 3 个文件",
    level: "warn",
    delayClose: 0,
    actions: [{ title: "撤销", handle: undo }],
});

// value 键：点击写入 notification.result（数据应答，无需 handle）
const q = engine.notifications.add({
    title: "是否保存草稿？",
    delayClose: 0,
    actions: [
        { title: "保存", value: true },
        { title: "丢弃", value: false, className: "danger" },
    ],
});
// 点击后：q.result === true / false
```

点击闭环顺序：**置已读 → 写 `result = value` → 发 `actions/<名>` 事件 → `handle` 调用（若有）→ `hide` 判定关闭**（事件详见 [事件](./events.md)）。`value` 与 `handle` 正交可并存；`hide` 默认 `true`、显式 `false` 续显；字符串形态查全局 action 表（带 `anchor` 时沿 scope 链解析，见 [关联页面元素](./data.md#关联页面元素)）。actions 渲染在卡片**底部独立行**（不与标题同行，link 形态无边框）。

<demo html="notifications/actions.html"/>

### 已读与业务状态

- **已读**：卡片内任意点击（按钮 / 链接 / 关闭钮）自动置已读；编程式走 `markRead(id)` / `markAllRead(type?)`；
- **业务状态 `status`**：引擎纯透传存储 + 事件，语义归开发者（如 `"sending"` / `"sent"` / `"failed"`）；
- **`update(id, patch)` 是记录级字段唯一写通道**（`read` / `status` / `result` / `title` / `description`…），生效 = 改记录 + 发 `update` 事件（`notifications/<type>/<id>/update`）+ 触发持久化：

```ts
engine.notifications.update(id, { status: "failed", description: "网络中断，点击重试" });
engine.notifications.markRead(id);
engine.notifications.markAllRead("notice"); // 按 type 批量已读
```

<demo html="notifications/status.html"/>

### 记录与展示

通知有**记录**与**展示**两层生命周期，`persist`（ADR-0077 数值化，语义常量 `NOTIFICATION_PERSIST`）决定记录存续：

| persist | 常量 | 行为 |
| --- | --- | --- |
| `0`（默认） | `NONE` | 隐藏即删除记录——纯 toast 语义 |
| `1` | `SESSION` | **会话缓冲**：隐藏不删除、不持久化——记录留在内存与 `$notifications.items`（管理界面可再查看、`show()` 重显），刷新即失；复用 `maxLen` 淘汰（缓冲超出清最旧） |
| `2` | `LOCAL` | 隐藏转「已隐藏」态，记录存活、可枚举，localStorage 持久化 |
| `3` | `REMOTE` | 同上 + 服务器同步（POST） |

```ts
engine.notifications.add({ title: "x", persist: engine.notifications.PERSIST.SESSION }); // ≡ persist: 1（裸数字同合法）

engine.notifications.size;            // 存活记录数（展示中 + 已隐藏）
engine.notifications.get(id);         // 原生 Map.get（≡ sessions.get(id)）
engine.notifications.sessions;        // 全部存活会话注册表（Map 正名视图）
engine.notifications.show(id);        // 重显已隐藏记录（满额计时；展示中幂等；不存在 warn + null）
engine.notifications.show(props);     // add 的别名（「show = 让通知出现」——对象恒新建、字符串恒 id，零歧义）
engine.notifications.delete(id);      // 硬移除（无动画；persist 记录一并删 + 立即同步持久化）
engine.notifications.clear();         // 清全部存活记录（含隐藏与会话缓冲，带动画；clear(false) 立即）
```

`remove()` / `delete()` / `clear()` 触发**立即持久化同步**（ADR-0077）：local 即写、remote 立即 POST 全量覆盖——「删干净」闭环，刷新 / 多标签页不复活（详见 [数据视图 · 保存与同步](./data.md#保存与同步)）。

`maxLen`（记录数上限，溢出 FIFO 丢最旧，含会话缓冲记录）经 `options.notifications.maxLen` 设置（state 真身运行时可改）。

- `engine.stop()` 不动通知（无锚非树内）；`engine.destroy()` 收口（销毁 + 持久化 flush）；
- 多引擎独立 manager / 容器 / 队列。

<demo html="notifications/lifecycle.html"/>

## 注意事项

- **sticky 永占坑位**：`delayClose: 0`（含 confirm、进行中的进度任务）永不自动关；**完成后的 task 默认同样常驻**（`closeWhenDone` 缺省即 sticky，ADR-0102）——极端场景占满分区队列。卡片常显关闭钮（`closeable` 默认 `true`，可手动清坑；task 未完成时点 × ≡ cancel）；显式 `closeable: false` 压制则须自管收口（API / actions）。
- **confirm 永不 settle**：用户不点击 Promise 永远挂起，需要超时请自行 `Promise.race`。
- **持久化剥函数 + 剥渲染定制**：内联 `handle` 跨会话永久丢失（字符串 action 名可恢复）；`className`/`styles`/`icon`/`pos` 等渲染键不入载荷——恢复时走生效默认（自定义主题不跨会话）；恢复记录不自动重弹。
- **maxLen 丢最旧不豁免未读**：溢出按创建序 FIFO 淘汰（会话缓冲 `persist: 1` 记录同受淘汰）。
- **shallow 是一次性键**：`options.shallow` 构造期消费后直写静默忽略——options 真身「直写即生效」契约的唯一例外。
- **$notifications.items 只读纪律**：镜像写通道仅 `engine.notifications` API；模板直写（含 `options` 误改）为违约自理——`options` 是官方可写真身、`items` 不是，这一不对称是契约（见 [数据视图](./data.md)）。
- **鉴权头随 state 可见**：`fetchOptions.headers` 进 `$notifications.options` 真身——devtools 可查（与 network 面板等价）；**若你自行持久化整个 state 会连同落盘，请剥除**。
- **聚合绑定用表达式形态**：`$notifications.items.length` 的精准路径订阅**不随**结构变更触发——计数请用 `$notifications.items.filter(r => ...).length` 形态（依赖收集覆盖迭代与字段读，增删/字段变更均触发）。
- **anchor 不做定位**：通知恒屏幕锚定，「元素旁提示」用 tooltip（悬停）/ popover（点击）。
- **触摸设备**：hover 暂停无专属逻辑；**无障碍**：`role="status"` / `aria-live` 在 fast-follow 清单。
- **SSR**：显示静默跳过；localStorage 缺失 local 持久化 warn + no-op；load / save 可用。

技术决策与被否决方案详见 [ADR-0071](https://github.com/autosparkjs/autospark/blob/main/packages/engine/docs/adr/0071-messages.md)、[ADR-0072](https://github.com/autosparkjs/autospark/blob/main/packages/engine/docs/adr/0072-messages-state.md)、[ADR-0077](https://github.com/autosparkjs/autospark/blob/main/packages/engine/docs/adr/0077-message-session-dual-shell.md)、[ADR-0079](https://github.com/autosparkjs/autospark/blob/main/packages/engine/docs/adr/0079-message-type-level-rename.md)、[ADR-0083](https://github.com/autosparkjs/autospark/blob/main/packages/engine/docs/adr/0083-message-session-class-presets.md)、[ADR-0088](https://github.com/autosparkjs/autospark/blob/main/packages/engine/docs/adr/0088-message-content-ownership-module-split.md)；插件化迁出决策见 [ADR-0001](https://github.com/autosparkjs/autospark/blob/main/packages/plugins/docs/adr/0001-notification-plugin.md)（@autospark/plugins）。
