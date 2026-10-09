# 通知（Notifications）

## 概述

通知是**引擎级**的统一信息反馈与管理模块（ADR-0071）：数据层收件箱式记录管理 + 屏幕分区栈呈现，一套模型承载轻提示 / 通知 / 业务提醒 / 任务跟踪。命令式（`engine.notifications`）与模板声明（内置全局 `toast` action）双通道发起；状态经保留键 `$notifications` 暴露进 `store.state`（ADR-0072——通知中心面板 / 未读角标模板直绑）：

```ts
// 命令式：任意 JS 代码处
const session = engine.notifications.show({ title: "已保存", level: "success" });
```

```html
<!-- 声明式：模板任意可执行 action 处（toast 为内置别名） -->
<button @click="toast('已保存')">保存</button>
```

## 快速入门

### 轻提示（toast）

一行调用、默认 3 秒自动消失——`level` 决定图标与语义色：

```ts
engine.notifications.toast({ title: "已保存", level: "success" });
```

<demo html="notifications/quick-toast.html"/>

### 确认（confirm）

非模态双钮确认——`await` 会话直接得用户选择（确定 → `true` / 取消 → `false`）：

```ts
const ok = await engine.notifications.confirm("确认删除？", { yes: "删除", no: "再想想" });
if (ok) deleteFile();
```

<demo html="notifications/quick-confirm.html"/>

### 任务（task）——异步下载文件

`task()` 返回 Task 会话——`progress(n)` 推进进度条、`complete()` 完成收场（创建即 started，无需显式 `start()`）：

```ts
const s = engine.notifications.task({ title: "下载 dataset.zip", delayClose: 1200 });
for (const chunk of chunks) {
    await fetchChunk(chunk);      // 分块下载
    s.progress(pct);              // 实时推进
}
s.complete();                     // ≡ 进度 100 → 1.2s 后自动关
```

**factory 写法**——全部逻辑在 factory 内：`return` 的初始 props **立即弹卡**，下载逻辑作为异步闭包继续驱动进度条（无需 `start()`——创建即 started）：

```ts
engine.notifications.task(async (session) => {
    void (async () => {                          // 下载闭包：不 await——让 return 先执行（卡先弹）
        for (const chunk of chunks) {
            await fetchChunk(chunk);
            session.progress(pct);               // 实时推进（session 激活后直接生效）
        }
        session.complete();                      // ≡ 进度 100 → delayClose 后自动收
    })();
    return { title: "下载 dataset.zip", delayClose: 1200 };   // 初始 props——立即建卡
});
```

<demo html="notifications/quick-task.html"/>

## 指南

### 基础用法

#### 发起通知的三种写法

`engine.notifications.add(input)` / `engine.notifications.show(input)` 接受三种形态：

**字符串简写**——属性值即通知标题，等价 `{ title }`，默认 3 秒自动关：

```ts
engine.notifications.add("已保存");
```

**配置对象**——承载全部保留键（见[配置选项](#配置选项)）：

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

#### 通知会话

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

- **JS 侧编程应答**：`engine.notifications.respond(id, value)`（≡ 会话 `yes()` / 点击按钮，同一闭环）；展示结束的感知走 `notification:hide` 事件与 `closed` getter；
- **`notifications.sessions`**：全部存活会话的注册表——即 manager 本身的 Map 正名视图（`sessions.get(id)` ≡ `notifications.get(id)`，随 remove 同步进出；注意与 `$notifications.sessions` **展示序 id 数组**是两个东西）；
- **factory 挂起注入**：`add(async (session) => ...)` 同步创建挂起会话传入——挂起期 `session.update()` 缓存补丁（return 落地时合并）、`session.cancel()` 取消；`return props` = 初始展示配置（`undefined` 静默跳过）；
- **死会话**：`remove()` 后会话死亡，后续方法 no-op + warn（不复活）；
- **`$session` 派生变量**：卡片子树（shell 与 type 预设组件）模板内可直接访问本会话——`@click="$session.hide()"`、`@click="$session.progress(50)"`（详见[自定义卡片](#自定义卡片)）。

<demo html="notifications/session.html"/>

#### 快捷方法与模板按钮

`show` 是统一入口，三个内置 type 另有**便捷层**（均强制对应 type——误传他 type 一律归位）：

```ts
engine.notifications.toast({ title: "已保存", level: "success" });  // ≡ show({ ...props, type: 'toast' })

const ok = await engine.notifications.confirm("确认删除该文件？", { yes: "删除", no: "再想想" });
// ≡ show({ type: 'confirm', delayClose: 0, 双钮 })——返回 Confirm 会话（thenable：await 即得应答）

const upload = engine.notifications.task({ title: "上传中", delayClose: 3000 }); // ≡ show({ type: 'task' })——Task 会话
```

模板侧有配套的全局 action `toast` / `confirm` / `task`（内置执行型，用户同名声明覆盖）：

```html
<button @click="toast('已保存')">保存</button>
<button @click="confirm({ title: '确认删除？', yes: '删除', no: '再想想' })">删除</button>
<!-- 结果就近回流：发起子树监听 notification:action（detail.value：true 确认 / false 取消） -->
<div @notification:action="onChoice($event.detail.value)">…</div>
```

- `toast`：payload（字符串 | 配置对象）转发 `show({ type: 'toast', ... })`；
- `confirm`：payload 对象的 `yes` / `no` 键定制按钮文案，结果经 `notification:action` 事件就近回流（`detail.notification.id` 区分并发）；
- `task`：payload 转发 `show({ type: 'task', ... })`，Task 会话句柄经 `actions/task/*` 广播 payload 交付（进度推进仍为编程式）；
- 三个 action 均广播各自生命周期信号（`actions/toast/*` / `actions/confirm/*` / `actions/task/*`）；`notifications: false` 时均 warn + no-op。

**双通道发起与 anchor**：action 在元素上使用时**自动注入宿主元素为 anchor**（局部 action 解析根 / 事件派发根 / 渲染数据视图基准——自定义 renderer 可访问发起域数据）。编程式调用不自动注入，显式传 `anchor` 等价：

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

#### 全局默认与类型配置

`options.notifications` 承载全局默认，合并链：`内置默认 < options.notifications < options.notifications.types[type] < 单次 props`（浅合并逐键覆盖）——**type 是给每类通知定默认值的钩子**：

```ts
const app = new AutoSpark(el, state, {
    notifications: {
        pos: "top-right",        // 全站右上角（默认）
        delayClose: 3000,        // 全局 3 秒
        showCount: 5,            // 每列同屏最多 5 条
        types: {
            notice: { delayClose: 0, closable: true },  // 通知 sticky + 手关
            remind: { level: "warn" },                  // 提醒默认警示色
        },
    },
});
```

- `type` 是**开放集合**（默认 `'toast'`）：`notice` / `remind` 等纯用户域，引擎零预设；三个内置语义 type（`toast` / `confirm` / `task`）另有一层**内置 type 种子默认**（confirm / task 的 `width: 300`）——位于内置默认与 `options.notifications` 之间，用户任意配置层（全局 / types[type] / 单次）可覆盖；
- `types` 的值只允许通知级键——出现 `url` / `maxLen` / `pos` / `showCount` / `headers` / `shell` / `icons` 等 manager 级键 warn + 忽略；
- `notifications: false` **整体关闭**：不建容器、不注样式，`engine.notifications` 与全局 `toast` action 调用均 warn + no-op。

<demo html="notifications/defaults.html"/>

#### 屏幕位置与排队

`pos` 七值枚举：`top-left` / `top-center` / `top-right`（默认）/ `bottom-left` / `bottom-center` / `bottom-right` / `center`。

<demo html="notifications/pos.html"/>

队列语义（ADR-0068 决策 8 沿用；ADR-0079 定序简化）：

- **按 pos 分区各计**：每列独立队列，上限 `showCount`（默认 5）——右上排满不阻塞右下入队；
- **纯到达序 FIFO**：列内按到达顺序 append、满员排队按队首补位（原「level 越高越靠列边端」定序已随 ADR-0079 移除——`level` 只管图标与语义色，与展示位置无关）；
- **离场平滑收拢**（兄弟随布局流上移无跳动）；
- `offset` 仅该列首次创建时生效（不迁移已建列）。

#### 原地更新

同 id 重复 `add` = **原地更新**而非销毁重建（上传进度类场景）：

<demo html="notifications/update.html"/>

- **显示中**：换内容、重置 delayClose 满额计时、不重播动画；**排队中**：只换内容；
- 更新基准是**当前生效配置**——未传的键保留原值；
- `pos` / `offset` / `id` 更新时忽略（不迁移已建列）；
- 同 id 更新的是**展示 props**；`read` / `status` / `result` 等记录级字段走 [`update(id, patch)`](#已读与业务状态)。

#### 标题与正文

`title` 是通知主行（HTML，经 `options.sanitizer` 消毒）；`description` 是可选正文，渲染在下一行、字号小一号，缺省不渲染行：

```ts
engine.notifications.add({
    title: "版本 2.0 已发布",
    description: "包含 12 项改进与 3 项修复，查看 <b>更新日志</b> 了解详情。",
    level: "info",
});
```

<demo html="notifications/body.html"/>

#### 严重度与图标

`level` 五档封闭枚举（ADR-0079，原 `type` 语义色数值化）：`none: 0`（默认）/ `info: 1` / `success: 2` / `warn: 3` / `error: 4`——常量 `NOTIFICATION_LEVEL`，**宽松入参**（数字与名字符串同权，`level: "warn"` ≡ `level: 3`，非法值 warn + 回退 `none`）。驱动图标（同名词映射，success→内置 `yes`）与语义着色——**全边语义色 border + 同色系超淡底**（`color-mix` 混白随主色自动调和，换肤一处生效）+ 图标着色；`none` 灰边白底纯中性。`icon` 显式指定优先于 level 默认；`options.notifications.icons` 键重映射（键 = level 名）；换肤接口为 `--autospark-notification-{info,success,warn,error}-color` 四变量（变量名不变）。`level` **只管视觉语义，与展示位置无关**（原排序用途已移除）。

<demo html="notifications/level.html"/>

#### 附带链接

`link` 提供时通知尾部出现 external 图标链接：新标签打开（`target="_blank"` + `rel="noopener noreferrer"`）、**点击不关闭通知**、置已读：

```ts
engine.notifications.add({
    title: "新版本可用",
    link: "https://example.com/release",
    delayClose: 0,
});
```

<demo html="notifications/href.html"/>

#### 操作按钮与应答

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
    closable: true,
    actions: [
        { title: "保存", value: true },
        { title: "丢弃", value: false, className: "danger" },
    ],
});
// 点击后：q.result === true / false
```

点击闭环顺序：**置已读 → 写 `result = value` → 发 `notification:action` 事件 → `handle` 调用（若有）→ `hide` 判定关闭**。`value` 与 `handle` 正交可并存；`hide` 默认 `true`、显式 `false` 续显；字符串形态查全局 action 表（带 `anchor` 时沿 scope 链解析，见 [关联页面元素](#关联页面元素)）。actions 渲染在卡片**底部独立行**（不与标题同行，link 形态无边框）。

<demo html="notifications/actions.html"/>

#### 已读与业务状态

- **已读**：卡片内任意点击（按钮 / 链接 / 关闭钮）自动置已读；编程式走 `markRead(id)` / `markAllRead(type?)`；
- **业务状态 `status`**：引擎纯透传存储 + 事件，语义归开发者（如 `"sending"` / `"sent"` / `"failed"`）；
- **`update(id, patch)` 是记录级字段唯一写通道**（`read` / `status` / `result` / `title` / `description`…），生效 = 改记录 + 发 `notification:update` + 触发持久化：

```ts
engine.notifications.update(id, { status: "failed", description: "网络中断，点击重试" });
engine.notifications.markRead(id);
engine.notifications.markAllRead("notice"); // 按 type 批量已读
```

<demo html="notifications/status.html"/>

#### 记录与展示

通知有**记录**与**展示**两层生命周期，`persist`（ADR-0077 数值化，语义常量 `NOTIFICATION_PERSIST`）决定记录存续：

| persist | 常量 | 行为 |
| --- | --- | --- |
| `0`（默认） | `NONE` | 隐藏即删除记录——纯 toast 语义 |
| `1` | `SESSION` | **会话缓冲**：隐藏不删除、不持久化——记录留在内存与 `$notifications.items`（管理界面可再查看、`show()` 重显），刷新即失；复用 `maxLen` 淘汰（缓冲超出清最旧） |
| `2` | `LOCAL` | 隐藏转「已隐藏」态，记录存活、可枚举，localStorage 持久化 |
| `3` | `REMOTE` | 同上 + 服务器同步（POST） |

```ts
import { NOTIFICATION_PERSIST } from "autospark";
engine.notifications.add({ title: "x", persist: NOTIFICATION_PERSIST.SESSION }); // ≡ persist: 1（裸数字同合法）

engine.notifications.size;            // 存活记录数（展示中 + 已隐藏）
engine.notifications.get(id);         // 原生 Map.get（≡ sessions.get(id)）
engine.notifications.sessions;        // 全部存活会话注册表（Map 正名视图）
engine.notifications.show(id);        // 重显已隐藏记录（满额计时；展示中幂等；不存在 warn + null）
engine.notifications.show(props);     // add 的别名（「show = 让通知出现」——对象恒新建、字符串恒 id，零歧义）
engine.notifications.delete(id);      // 硬移除（无动画；persist 记录一并删 + 立即同步持久化）
engine.notifications.clear();         // 清全部存活记录（含隐藏与会话缓冲，带动画；clear(false) 立即）
```

`remove()` / `delete()` / `clear()` 触发**立即持久化同步**（ADR-0077）：local 即写、remote 立即 POST 全量覆盖——「删干净」闭环，刷新 / 多标签页不复活。

`maxLen`（记录数上限，溢出 FIFO 丢最旧，含会话缓冲记录）经 `options.notifications.maxLen` 设置（state 真身运行时可改）。

- `engine.stop()` 不动通知（无锚非树内）；`engine.destroy()` 收口（销毁 + 持久化 flush）；
- 多引擎独立 manager / 容器 / 队列。

<demo html="notifications/lifecycle.html"/>

### 通知类型

三个内置 type 各有专属语义、专属会话与快捷方式（自定义 type 回基类会话面，见 [类型配置](#全局默认与类型配置)）：

<demo html="notifications/types.html"/>

#### 轻提示

**默认形态**——不指定 type 即 toast：分区栈短暂浮现、`delayClose`（默认 3000）后自动消失、`persist` 默认 `0`（隐藏即删）。hover 暂停 / 移出恢复剩余时间：

```ts
engine.notifications.toast({ title: "已保存", level: "success" }); // ≡ show({ ...props })——默认 type 即 'toast'
engine.notifications.toast({ title: "注意", level: "warn", delayClose: 0 }); // sticky——自动显示关闭钮
```

- `level` 语义色 / `icon` / `pos` 等通用键照常可用（见[基础用法](#基础用法)）；

<demo html="notifications/basic.html"/>

#### 通用确认

`show({ type: 'confirm' })` 返回 **Confirm 会话**——`yes()/no()/cancel()` 编程应答 + **thenable**（`await 会话` 直接得 choice 应答，默认 确定→`true` / 取消→`false`）：

```ts
const ok = await engine.notifications.show({
    title: "确认删除该文件？",
    type: "confirm",
    delayClose: 0, // sticky：永不自动关
    actions: [{ title: "删除", value: true }, { title: "再想想", value: false }], // 缺省自动注入「确定/取消」
});
if (ok) deleteFile();
// 或快捷方式（{yes,no} 文案提取）：await engine.notifications.confirm("删除？", { yes: "删除", no: "再想想" });
// 或编程应答：const s = engine.notifications.show({...}); s.yes();
```

- **永不自动关、永不 settle**——调用方需要超时请自行 `Promise.race`；卡片自动带关闭钮（sticky 推断）——点 × 直接关不作答（Promise 同样不 settle）；
- 非模态：无遮罩、并发堆叠、pos 跟随全局默认；需要模态确认走 [x-dialog](/zh/guide/directives/x-dialog)。

<demo html="notifications/confirm.html"/>

#### 进度任务

`show({ type: 'task' })` 创建进度通知，返回 **Task 会话**（六方法行为句柄）。**进度能力由 type='task' 提供（非通用通知功能）**——`progress` 是该 type 的专属键，其他 type 携带会被 warn + 忽略；推进也可走 `update(id, { progress: n })`：

```ts
const upload = engine.notifications.show({
    title: "上传 report.pdf",
    type: "task",
    delayClose: 3000, // 完成后展示 3 秒再关
});
upload.progress(30); // 创建即 started——无需显式 start()（start 为幂等兼容面）
upload.pause();    // 闸门：pause 后 progress 调用被忽略
upload.resume();
upload.progress(100); // = stop()：完成态展示 delayClose 后自动关
// upload.cancel();   // 中止：立即关
```

- `progress(n)` clamp 到 [0,100]；**创建即 started**（ADR-0083 二次修订）——`progress` 直呼即推进，`start()` 为幂等兼容面；factory 挂起期 progress 走缓存（return 落地时合并）；
- 通用按钮走 `actions` 声明（actions 组件渲染，见 [自定义卡片](#自定义卡片)）；task 三控制键启用时**预设模板自带控制钮**（见下）；
- **进行中不计时**（sticky），完成 / 取消才进入关闭流程；
- 自定义渲染见 [自定义卡片](#自定义卡片)（接管 `task` type 时进度条与控制按钮随接管者自带）。

**三控制键**（`canPause` / `canCancel` / `canStop`，task 专属，默认 `false`）——启用后 task 预设模板自带**分立控制按钮**（ADR-0088：显隐与「暂停 ↔ 恢复」文案由数据域响应式驱动、点击直调会话方法；完成态经 `completed` 投影自动收起）：

```ts
const download = engine.notifications.show({
    title: "下载 dataset.zip",
    type: "task",
    delayClose: 1500,
    canPause: true,     // 「暂停 / 恢复」按钮（文案切换，pause() 闸门生效）
    canCancel: true,    // 「取消」按钮 + session.signal（AbortSignal 协作取消）
    canStop: true,      // 「停止」按钮（≡ complete()——立即完成态收口）
});

// canCancel 启用时暴露协作取消信号——fetch 等挂接即中断（自然完成 / 超时 / remove 不发信号）：
const resp = await fetch(url, { signal: download.signal });
try {
    await pump(resp, (n) => download.progress(n));
} catch (e) {
    if (e.name === "AbortError") download.update({ description: "已取消" });
}

// 控制钮是行为不是 action——不发 notification:action（那是用户自定义 actions 的事件）；
// 观测控制行为走 notification:update（paused / completed 投影变更照发）+ notification:show / notification:hide：
engine.on("notification:update", (e) => { /* 暂停/恢复/完成转换 */ });
engine.on("notification:hide", (e) => { /* cancel 关闭 */ });
```

- 按钮行为 ≡ 会话方法（`pause()/resume()`、`complete()`、`cancel()`）——编程驱动与点击**同一实现**；
- session 上另有只读投影 `canPause / canCancel / canStop`；
- 控制钮与**用户自定义 actions 共存**（各行排布）；用户 actions 照常走标准 `notification:action` 闭环（置已读 → 事件 → handle → hide 判定）。

<demo html="notifications/task.html"/>

### 数据直连

#### 通知面板直读

通知子系统在 `store.state` 上注入保留键 **`$notifications`**（ADR-0072，`$scopes` 后第二例）——通知中心面板 / 未读角标等**跨卡片视图零桥接直绑**：

```ts
store.state.$notifications = {
    items: AutoSparkNotification[],   // 记录镜像（shallow 包装——见下）
    sessions: string[],          // 展示中 id 序列（shown + queued；观察面——ADR-0083）
    options: { ... },            // 生效全局配置真身（可直写）
};
```

```html
<!-- 通知中心面板：x-for 直绑镜像（创建序，ADR-0079） -->
<ul x-for="r of $notifications.items">
    <li :data-read="r.read"><span x-text="r.title"></span><b x-show="!r.read"></b></li>
</ul>
<!-- 在屏通知：展示序 id 子集（session.show() 追加 / hide() 移除——引擎分区栈不经它） -->
<span x-text="$notifications.sessions.length"></span>
<!-- 未读角标：聚合表达式 -->
<span x-text="$notifications.items.filter(r => !r.read).length"></span>
```

- **items = 记录镜像**：`AutoSparkNotification` 纯数据（`AutoSparkNotificationRecord` 数据记录 + `closed/icon/pos/...` 渲染行为层），无函数、无 DOM 引用；**写通道仅 `engine.notifications` API**（记录级变更 = 镜像内整条替换）——模板直写为违约自理（纪律不加机制）；
- **sessions = 展示序 id 数组**（ADR-0083）：shown + queued 入、teardown / 硬移除出——「当前在屏通知」的响应式观察面（id 字符串数组，shallow 深度 0 仅结构变更有事件）；实例本体经 `engine.notifications.get(id)` 取（函数不入 state）；引擎分区栈渲染不经它（观察面）；
- **shallow 粒度**：`items` 经 `shallow(items, options.shallow)` 包装（默认 `1`，值域 `0 | 1`）——`1`：数组结构变更（增删/整替换）与**成员一层字段读写**有事件、孙级起 raw（N 条通知只有「数组 + 记录」两层代理，title 等叶子零代理）；`0`：成员不代理，仅结构变更有事件（超大通知列表最省形态——字段级绑定失效）；**构造期一次性**：运行时直写静默忽略（options 真身「直写即生效」契约的唯一例外键）；
- **options = 生效配置真身**：构造期注入「内置默认 < options.notifications」合并结果，**直写即生效**（对后续操作生效、已展示卡片不回溯）——运行时改 `showCount` / `delayClose` / `types` 皆可；state 写入为**信任通道**（不走入参校验）；
- **边界键**：`anchor`（DOM 引用）与 `actions`（函数值会被 autostore 按计算属性语义劫持）不入 state、构造期私有固化——「函数、元素不入 state」一条规则；`fetchOptions` 在内（token 刷新通道）；
- **保留键**：用户 state 树不得使用 `$notifications` 命名；`notifications: false` 时不注入。

<demo html="notifications/state.html"/>

#### 关联页面元素

`anchor` 把通知关联到页面元素，**三职合一**（模板 action 自动注入或 API 显式传同规）：

- **局部 action 解析根**：actions 字符串沿 anchor 的 scope 链解析局部 action（无 anchor 只查全局表）；
- **事件派发根**：action 生命周期事件以 anchor 为根额外派发（发起子树 `@notification:action` 就近消费）；
- **渲染数据视图基准（dataContext）**：anchor 存在时 shell 与 type 模板挂链 anchor 所在 scope——自定义渲染组件的表达式可访问发起元素的数据域（响应式订阅生效）；无 anchor 时 rootless（仅消费 props）。

```ts
engine.notifications.show({
    title: "订单已超时",
    actions: ["reopenOrder"],        // 沿 anchor 所在 scope 链解析
    anchor: document.querySelector("#order-123"), // 或选择器字符串
});
```

配套 action（`toast` / `confirm` / `task`）在 DOM 处使用时**自动注入发起元素为 anchor**；编程式 API 调用无注入（anchor 仅显式传时生效，两者等价——见 [快捷方法](#快捷方法与模板按钮)）。

`anchor` 不做**定位**（通知恒屏幕锚定）；元素旁提示场景用 tooltip / popover。

<demo html="notifications/anchor.html"/>

### 自定义卡片

渲染是**双层正交组合**（ADR-0077 → **ADR-0088 内容归属修订**）——**shell 管外观、type 模板管内容**，各走各的查找链：

```
┌─ shell（卡片外观——所有 type 共享）───────────────────────┐
│  ┌─ type 模板（内容——按 type 定制）────────────────────┐ │
│  │  [level 图标] [title] [link]                        │ │
│  │  [description]                                      │ │
│  │  [专属区（task 进度条 / 三控制钮等）]                │ │
│  │  [actions 按钮行——actions 组件]                     │ │
│  └─────────────────────────────────────────────────────┘ │
│  [close ×]                                                 │
└────────────────────────────────────────────────────────────┘

shell 链：options.notifications.shell（选择器，默认 'notification' = 内置 shell 裸键）
          → getComponentDeclaration 标准链（scope 局部 x-define
            → options.components → options.builtinComponents 内置兜底）
type 链：types[type].render（用户 type 级）
          → 全局组件表按预设名 autospark.notifications.<type>
          → base 默认内容模板兜底（ADR-0088——自定义 type 零配置得标准内容卡）
```

五件预设组件经 `options.components` 全局表种子注入（`autospark.*` 为引擎保留命名空间，同名声明覆盖优先）：

| 组件 | 形态 |
| --- | --- |
| `autospark.notifications.actions` | **公共按钮行组件**（ADR-0088 唯一复用件）——x-for 渲染 + 委托契约；type 模板内 `x-component:autospark.notifications.actions="{ actions }"` 组合消费 |
| `autospark.notifications.base` | **默认内容模板**（icon + title/link + description + actions 组件）兼 type 链末端 fallback；保留裸出口（继承覆盖落点） |
| `autospark.notifications.toast` / `confirm` | 纯继承 base（同名覆盖的 per-type 定制点） |
| `autospark.notifications.task` | 自有布局：头部 + 进度条 + 三控制钮 + actions 组件 |

自定义 type 组件可**继承默认内容模板**做差异化（覆盖段落 base 出口），亦可组合 actions 组件或全自绘：

```ts
const app = new AutoSpark(el, state, {
    components: {
        // 全局组件继承（ADR-0081）：裸子节点 = 继承覆盖段，替换 base 出口 fallback
        "my-notice": `
            <div x-define="my-notice" x-define:inherit="autospark.notifications.base">
                <i class="fa fa-bell"></i><b x-text="title"></b>
            </div>`,
    },
    notifications: { types: { notice: { render: "my-notice" } } },
});
```

两层组件都拿到**整包数据域 props**（剥函数后全量注入，ADR-0088——自定义 type 的自有键天然可绑）+ **`$session` 派生变量**（本通知的会话句柄——行为通道）：

```ts
const app = new AutoSpark(el, state, {
    components: {
        // type='notice' 的完整内容卡（投影进 shell 出口——title 等内容归接管者渲染）
        "notice-extra": `
            <div class="my-notice-extra">
                <b x-text="title"></b>
                <i x-icon="'star'" x-show="!read"></i>
                <button @click="$session.remove()">不再显示</button>
                <div x-component:autospark.notifications.actions="{ actions }"></div>
            </div>`,
    },
    notifications: { types: { notice: { render: "notice-extra" } } },
});
```

- props **整包注入**（两层同权）：全部通知键（含 `id / type / level / title / description / icon / link / actions / read / status / result / delayClose` 与自定义自有键）+ 运行态投影（`progress / paused / completed`——task 控制钮显隐与文案的数据域驱动源）；
- **`$session` 行为专职**（x-for `$index` 同款派生变量——非响应式、不进 state）：模板内 `@click="$session.hide()"` / `$session.progress(50)` / `$session.yes()`；**数据绑定走 data 域**（`x-text="title"` 响应式——`x-show="$session.closed"` 不会自动更新）；
- 接管 `type='task'`（render 指向自定义组件）时**整卡内容渲染随接管者**（ADR-0088——title 亦归 type 模板，引擎不兜底；`props.progress` 驱动 + `$session.progress(n)` 推进、控制钮按需自绘）——内置 task 模板不是特权通道；
- 自定义 shell 须声明**默认出口**（裸 `<div x-slot></div>`）承载 type 模板——未声明 warn + type 区丢弃（数据无损）；接管 shell = 换整卡**外观**（边框 / 背景 / 关闭钮形态），与内容扩展点（同名覆盖 type 模板 / 组件）正交。

<demo html="notifications/render.html"/>

#### 外壳定制（内置 shell 裸键）

通知内置外壳即内置组件 **`notification`**（裸键注册，ADR-0094——shell 与 overlay 家族的 `dialog` / `popover` / `drawer` 同为裸键），查找走标准组件链：局部 `x-define="notification"` 就近遮蔽 → `options.components.notification` 全局接管 → `options.builtinComponents` 内置兜底。**一般定制走 `components` 同名覆盖**（优先级更高）：

```ts
const app = new AutoSpark(el, state, {
    components: {
        // 覆盖通知内置外观（只影响通知；dialog/popover/drawer 不动）——ADR-0088 起
        // shell 只管卡片 chrome（边框/背景/关闭钮 + 出口），内容归 type 模板
        notification: `
            <div class="my-msg-shell" x-define="notification">
                <div class="body"><div x-slot></div></div>   <!-- type 出口必声明 -->
                <button class="x" @click="hide()">×</button>
            </div>`,
    },
});
// 运行时换外观：注册新键 + 选择器直写（options 真身契约——对后续 add 生效）
app.store.state.$notifications.options.shell = "compact";
```

- 值为 HTML 模板字符串（懒预编译）；**构造期固化**——运行时突变注册位不生效（注册与选择分离：灵活性全在消费者选择器 `notifications.shell` 上）；
- 明确接管框架内建件可用 `options.builtinComponents` 写同名（优先级低于 `components`，防业务配置流误伤内置默认，ADR-0094）。

### 保存与同步

```ts
// 启动时从服务器拉取（GET，响应体为通知 JSON 数组）
const loaded = await engine.notifications.load();          // url 参数缺省用 options.notifications.fetchOptions.url
// 合并语义：按 id 覆盖（服务端为准）、新 id 追加；只入记录不弹（需要时 show(id)）
loaded.forEach((t) => t.read || engine.notifications.show(t.id)); // 例：手动重弹未读
```

```ts
const app = new AutoSpark(el, state, {
    notifications: {
        fetchOptions: {
            url: "/api/notifications",                      // load 与 persist remote 同端点
            headers: { Authorization: "Bearer ..." },  // 透传 fetch（运行时可刷新）
        },
    },
});
await engine.notifications.save(); // 立即 flush（缺省变更防抖 500ms 自动 POST 全量存活记录）
```

- **fetchOptions**（ADR-0072，原 `url` + `headers` 两键合并）：`url` + RequestInit 子集（`method` / `body` 由引擎契约固定——GET 拉取 / POST 全量数组，剥除防误配），`fetch(fetchOptions.url, fetchOptions)` 直传；**每次 fetch 现读 state**——token 续期直改 `$notifications.options.fetchOptions.headers` 即对后续同步生效；
- **remote**（`persist: 3`）：`POST url`、请求体 = 存活记录全量 JSON 数组（服务端整体替换语义）、变更防抖 500ms 合并、`destroy()` 时尝试 flush（keepalive 兜底）；
- **local**（`persist: 2`）：localStorage key `autospark-notifications`，记录变更即同步全量写；
- **载荷 = `NotificationRecord` 纯业务数据**（十二键白名单封闭，与后端通用通知管理表对齐——只管数据、不管渲染与行为）：`id/type/read`（恒有）+ `title/description/level/owner/status/result/link` + `createAt/updateAt`（时间戳，恒有）。**actions 等渲染行为键、运行态、边界键、自有未知键一律不入**——恢复后的渲染与行为由具体 session 按生效配置重建；恢复记录一律转「已隐藏」态（closed 由策略置位、persist 按存储介质反推：local→2 / remote→3、时间戳以载荷为准缺失兜当前时刻）；
- **`updateAt` 刷新时机**：记录数据写入的公共入口——`update()` 补丁 / 同 id 原地更新 / 置已读 / action result 写入；纯运行态变化（progress 推进 / 显隐切换）不刷新；
- **序列化剥函数**：actions 字符串名可恢复（重查全局表）、内联 `handle` 跨会话**永久丢失**；恢复记录只入枚举不自动重弹；
- 失败均 warn 不抛（load resolve 空数组）；SSR 下 localStorage 缺失 warn + no-op。

<demo html="notifications/persist.html"/>

### 事件

双通道广播（引擎总线 + 卡片元素 `dispatchEvent`），payload `{ notification: AutoSparkNotificationSession, el }`：

```ts
engine.on("notification:action", (m) => {
    console.log(m.payload.notification.id, m.payload.value); // value 应答在此
});
document.body.addEventListener("notification:hide", (e) => console.log("关闭", e.detail.notification.id));
```

| 事件 | 触发时机 |
| --- | --- |
| `notification:add` | 记录创建 |
| `notification:update` | `update(id, patch)` 生效 / 同 id 原地更新 |
| `notification:show` / `notification:hide` | 展示状态转换（一切移除路径均广播 hide） |
| `notification:read` / `notification:status` | 已读置位 / status 补丁 |
| `notification:action` | action 点击（追加 `{ action, value? }`） |


<demo html="notifications/events.html"/>

### 外观定制

三层通道沿 ADR-0068，命名 notification 化：

```css
:root {
    --autospark-notification-error-color: #d93025; /* 语义色换肤 */
    --autospark-notification-max-w: 360px;
    --autospark-notification-inset: 16px;          /* 分区列与屏幕边缘间距 */
    --autospark-notification-z: 1100;              /* 层高（高于 overlay 的 1000） */
}
```

```ts
// 1. className / styles 追加主题定制（className 类名；styles 内联 cssText——覆盖内置规则时选择器带 .autospark-notification 提升 specificity）
// 2. 语义色 CSS 变量（见上）
// 3. types[type].render / shell 裸键同名覆盖（components/builtinComponents——见自定义渲染）
```

<demo html="notifications/customize.html"/>

## 配置选项

合并链：`内置默认 < options.notifications < types[type] < 单次 props`。保留键**封闭清单**——未知键 warn + 忽略；空 title warn + no-op。

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `title` | — | 通知标题（HTML；经 `options.sanitizer` 消毒——与 x-html 同一安全通道） |
| `description` | — | 可选正文（HTML 同通道），渲染在下一行、字号小一号 |
| `type` | `"toast"` | 业务类别（开放集合；`toast` / `confirm` / `task` 为内置语义 type）；驱动 types 默认与 type 专属渲染（原 `kind` 更名，ADR-0079） |
| `level` | `0`（`none`） | 严重度五档 `0`none / `1`info / `2`success / `3`warn / `4`error（常量 `NOTIFICATION_LEVEL`）——驱动图标与语义色；**宽松入参**（数字或名字符串同权，非法 warn + 回退 none）；只管视觉语义、与展示位置无关（原排序语义已移除） |
| `icon` | — | 显式图标名，优先于 level 默认映射 |
| `owner` | — | 归属者（业务透传：收件人/来源模块等），引擎不解释、不代填 |
| `delayClose` | `3000` | 自动关闭延迟 ms；`0` = sticky（永不自动关，自动显示关闭钮——见 `closable`）；hover 暂停 / 移出恢复（剩余时间制） |
| `pos` | `"top-right"` | 屏幕锚定位置（7 值枚举）；非法值 warn + 回退 |
| `offset` | — | 分区列与屏幕边缘间距；**仅该列首次创建时生效** |
| `id` | 自动生成 | 记录 id；**同 id = 原地更新**。仅单次调用层生效 |
| `read` | `false` | 已读标记（点击自动置位；编程式走 `markRead`） |
| `status` | — | 业务状态（引擎纯透传） |
| `result` | — | action value 应答（只读面，点击写入） |
| `link` | — | 尾随 external 链接（新标签、不关闭、置已读）；HTML 属性仍为 `href` |
| `closable` | `false`（sticky 时 `true`） | 关闭按钮（开启出 ×，内置 `no` 图标）；**sticky（`delayClose ≤ 0`）且未显式声明时自动置 `true`**——否则除 API / actions 外无法关闭；显式 `false`（任意配置层）压制 |
| `persist` | `0` | 记录存续级别 `0/1/2/3`（常量 `NOTIFICATION_PERSIST.NONE/SESSION/LOCAL/REMOTE`，见[记录与展示](#记录与展示)） |
| `actions` | — | 按钮行（字符串 = 全局 action 名 / 对象 = 局部按钮，`value` 键数据应答）；type='confirm' 缺省自动注入「确定/取消」双钮 |
| `anchor` | — | 局部 action 解析根 + 事件派发根 + 渲染数据视图基准（元素或选择器字符串） |
| `progress` | `0` | **type='task' 专属键**（类型分型属 `TaskNotificationProps`——其他 type 携带 warn + 忽略）；初始进度 0~100 |
| `canPause` / `canCancel` / `canStop` | `false` | **task 三控制键**（**类型分型**：属 `TaskNotificationProps`〔sessions/task.ts〕——公共 `NotificationProps` 不含，其他 type 携带 warn + 忽略）：启用后预设组件自动带「暂停/恢复」「取消」「停止」按钮（完成态隐藏）；`canCancel` 同时暴露 `session.signal`（AbortSignal——`cancel()` 瞬间 abort，fetch 挂接即中断） |
| `animate` | `"slide"` | 进出场动画（默认按 pos 方向自适应，`false` 关闭） |
| `className` | — | 附加类名（主题定制通道） |
| `styles` | — | 内联样式 cssText（如 `"border-left:3px solid red"`）——卡片根追加语义；渲染键不入持久化载荷 |
| `width` / `height` | `'auto'` | 卡片宽高（`number` = px、字符串原样 CSS 长度）；**confirm / task 内置默认 `width: 300`**（type 种子层，任意配置层可覆盖） |
| `minWidth` / `maxWidth` / `minHeight` | — | 尺寸约束（number = px）；`maxWidth` 缺省走内置 shell 的 CSS 兜底 `--autospark-notification-max-w: 360px`，显式声明时 inline 覆盖 |

另有**管理器级键**只在 `options.notifications` 全局层生效（types 内出现 warn + 忽略）：

| 键 | 默认值 | 说明 |
| --- | --- | --- |
| `showCount` | `5` | 同屏显示上限——按 pos 分区各计，满员排队、按队首 FIFO 补位 |
| `maxLen` | 不限 | 存活记录数上限，溢出 FIFO 丢最旧（含会话缓冲记录） |
| `fetchOptions` | — | 传输配置（原 `url`+`headers` 合并）：`url` + RequestInit 子集直传 fetch；fetch 时现读 state（运行时改 url / 刷新鉴权头即生效） |
| `icons` | — | type → 图标名重映射（默认同名词映射） |
| `shell` | `"notification"` | **卡片外观选择器**（ADR-0077 / ADR-0088 shell 降级为外观容器）：shell 链起点——指向标准组件链可命中的组件名（局部 `x-define` / `options.components` / 内置裸键，ADR-0094）；运行时直写换键对后续 `add` 生效 |
| `shallow` | `1` | `$notifications.items` 的 shallow 深度（`0 \| 1`；**构造期一次性**——运行时直写静默忽略） |
| `types` | — | 按 type 的默认值与渲染插槽（`types[type].render` = type 内容模板名；原 `kinds` 更名，ADR-0079；末端 base 兜底 ADR-0088） |

## 注意事项

- **sticky 永占坑位**：`delayClose: 0`（含 confirm、进行中的进度任务）永不自动关，极端场景占满分区队列——sticky 通知未显式声明 `closable` 时**自动显示关闭钮**（可手动清坑）；显式 `closable: false` 压制则须自管收口（API / actions）。
- **confirm 永不 settle**：用户不点击 Promise 永远挂起，需要超时请自行 `Promise.race`。
- **持久化剥函数 + 剥渲染定制**：内联 `handle` 跨会话永久丢失（字符串 action 名可恢复）；`className`/`styles`/`icon`/`pos` 等渲染键不入载荷——恢复时走生效默认（自定义主题不跨会话）；恢复记录不自动重弹。
- **maxLen 丢最旧不豁免未读**：溢出按创建序 FIFO 淘汰（会话缓冲 `persist: 1` 记录同受淘汰）。
- **`$session` 行为专职**：卡片模板内 `$session.closed` 等派生读取**非响应式**（首渲染后不更新）——需要响应式的状态走 data 域绑定（`read`/`result`/`progress` 等）。
- **shallow 是一次性键**：`options.shallow` 构造期消费后直写静默忽略——options 真身「直写即生效」契约的唯一例外。
- **$notifications.items 只读纪律**：镜像写通道仅 `engine.notifications` API；模板直写（含 `options` 误改）为违约自理——`options` 是官方可写真身、`items` 不是，这一不对称是契约。
- **鉴权头随 state 可见**：`fetchOptions.headers` 进 `$notifications.options` 真身——devtools 可查（与 network 面板等价）；**若你自行持久化整个 state 会连同落盘，请剥除**。
- **聚合绑定用表达式形态**：`$notifications.items.length` 的精准路径订阅**不随**结构变更触发——计数请用 `$notifications.items.filter(r => ...).length` 形态（依赖收集覆盖迭代与字段读，增删/字段变更均触发）。
- **anchor 不做定位**：通知恒屏幕锚定，「元素旁提示」用 tooltip（悬停）/ popover（点击）。
- **触摸设备**：hover 暂停无专属逻辑；**无障碍**：`role="status"` / `aria-live` 在 fast-follow 清单。
- **SSR**：显示静默跳过；localStorage 缺失 local 持久化 warn + no-op；load / save 可用。

技术决策与被否决方案详见 [ADR-0071](https://github.com/autosparkjs/autospark/blob/main/packages/engine/docs/adr/0071-messages.md)、[ADR-0072](https://github.com/autosparkjs/autospark/blob/main/packages/engine/docs/adr/0072-messages-state.md)、[ADR-0077](https://github.com/autosparkjs/autospark/blob/main/packages/engine/docs/adr/0077-message-session-dual-shell.md)、[ADR-0079](https://github.com/autosparkjs/autospark/blob/main/packages/engine/docs/adr/0079-message-type-level-rename.md)、[ADR-0083](https://github.com/autosparkjs/autospark/blob/main/packages/engine/docs/adr/0083-message-session-class-presets.md)、[ADR-0088](https://github.com/autosparkjs/autospark/blob/main/packages/engine/docs/adr/0088-message-content-ownership-module-split.md)。
