# 消息（Messages）

::: warning 实现状态
消息模块（ADR-0071）共识已落盘、实现进行中——本文是 API 契约文档，示例引用的 `messages/*.html` demo 随实现落地。过渡期可先用 `engine.toast()` 别名（旧 API，字段名以本文为准的会 warn）。
:::

## 概述

消息是**引擎级**的统一信息反馈与管理模块（ADR-0071）：数据层收件箱式记录管理 + 屏幕分区栈呈现，一套模型承载轻提示 / 通知 / 业务提醒 / 任务跟踪。命令式（`engine.messages`）与模板声明（内置全局 `toast` action）双通道发起：

```ts
// 命令式：任意 JS 代码处
const task = engine.messages.add({ title: "已保存", type: "success" });
```

```html
<!-- 声明式：模板任意可执行 action 处（toast 为内置别名） -->
<button @click="toast('已保存')">保存</button>
```

## 快速入门

<demo html="messages/basic.html"/>

## 指南

### 入参形态

`engine.messages.add(input)` 接受三种形态：

#### 字符串简写

属性值即消息标题，等价 `{ title }`——默认 3 秒自动关：

```ts
engine.messages.add("已保存");
```

#### 配置对象

承载全部保留键（见[配置选项](#配置选项)）：

```ts
engine.messages.add({
    title: "删除失败",
    body: "文件被占用，请关闭后重试",
    type: "error",
    delayClose: 0,
    actions: [{ title: "重试", handle: retry }],
});
```

#### async factory（条件通知）

resolve `undefined` / `void` 则**静默不弹**（内容就绪才提示）；同步返回挂起句柄，**挂起期 `task.hide()` = 取消**：

```ts
engine.messages.add(async () => {
    const hasUpdate = await checkUpdate();
    return hasUpdate ? { title: "发现新版本", type: "info" } : undefined;
});
```

#### MessageTask 句柄

`add(...)` 返回任务句柄，`read` / `status` / `result` 为**只读 getter**（写走 [`update`](#已读与业务状态)）：

```ts
interface MessageTask {
    readonly id: string;             // 记录 id（缺省自动生成）
    readonly kind: string;           // 业务类别（默认 'toast'）
    readonly el: HTMLElement | null; // 卡片根元素（排队未显示 / 已关闭为 null）
    hide(): void;                    // 关闭（走离场动画；幂等）
    readonly closed: boolean;        // 是否已关闭
    readonly read: boolean;          // 已读标记（只读）
    readonly status: number | string | undefined; // 业务状态（只读）
    readonly result: any;            // action value 应答（只读）
}
```

### 全局默认、kinds 与全关

`options.messages` 承载全局默认，合并链：`内置默认 < options.messages < options.messages.kinds[kind] < 单次 props`（浅合并逐键覆盖）——**kind 是给每类消息定默认值的钩子**：

```ts
const app = new AutoSpark(el, state, {
    messages: {
        pos: "top-right",        // 全站右上角（默认）
        delayClose: 3000,        // 全局 3 秒
        showCount: 5,            // 每列同屏最多 5 条
        kinds: {
            notice: { delayClose: 0, closable: true },  // 通知 sticky + 手关
            remind: { type: "warn" },                   // 提醒默认警示色
        },
    },
});
```

- `kind` 是**开放集合**（默认 `'toast'`）：`notice` / `remind` 等纯用户域，引擎零预设；
- `kinds` 的值只允许消息级键——出现 `url` / `maxLen` / `pos` / `showCount` / `headers` / `shell` / `icons` 等 manager 级键 warn + 忽略；
- `messages: false` **整体关闭**：不建容器、不注样式，`engine.messages` / `engine.toast()` 别名与全局 `toast` action 调用均 warn + no-op。

### 屏幕位置与分区队列

`pos` 七值枚举：`top-left` / `top-center` / `top-right`（默认）/ `bottom-left` / `bottom-center` / `bottom-right` / `center`。

<demo html="messages/pos.html"/>

队列语义（ADR-0068 决策 8 沿用）：

- **按 pos 分区各计**：每列独立 FIFO 队列，上限 `showCount`（默认 5）——右上排满不阻塞右下入队；
- **append 列尾**：先来在上、后来在下；
- **满员排队、按序补位**；**离场平滑收拢**（兄弟随布局流上移无跳动）；
- `offset` 仅该列首次创建时生效（不迁移已建列）。

### 同 id 原地更新

同 id 重复 `add` = **原地更新**而非销毁重建（上传进度类场景）：

<demo html="messages/update.html"/>

- **显示中**：换内容、重置 delayClose 满额计时、不重播动画；**排队中**：只换内容；
- 更新基准是**当前生效配置**——未传的键保留原值；
- `pos` / `offset` / `id` 更新时忽略（不迁移已建列）；
- 同 id 更新的是**展示 props**；`read` / `status` / `result` 等记录级字段走 [`update(id, patch)`](#已读与业务状态)。

### 类型、图标与语义色

`type` 五值封闭枚举（`none` 默认 / `info` / `success` / `warn` / `error`），驱动图标（同名词映射，success→内置 `yes`）与语义着色——**全边语义色 border + 同色系超淡底**（`color-mix` 混白随主色自动调和，换肤一处生效）+ 图标着色；`none` 灰边白底纯中性。`icon` 显式指定优先于 type 默认；`options.messages.icons` 键重映射；换肤接口为 `--autospark-message-{info,success,warn,error}-color` 四变量。

<demo html="messages/type.html"/>

### 标题与正文

`title` 是消息主行（HTML，经 `options.sanitizer` 消毒）；`body` 是可选正文，渲染在下一行、字号小一号，缺省不渲染行：

```ts
engine.messages.add({
    title: "版本 2.0 已发布",
    body: "包含 12 项改进与 3 项修复，查看 <b>更新日志</b> 了解详情。",
    type: "info",
});
```

### 链接（href）

`href` 提供时消息尾部出现 external 图标链接：新标签打开（`target="_blank"` + `rel="noopener noreferrer"`）、**点击不关闭消息**、置已读：

```ts
engine.messages.add({
    title: "新版本可用",
    href: "https://example.com/release",
    delayClose: 0,
});
```

### 按钮行：actions 与 value

`actions` 双形态（沿 ADR-0068），对象形态新增 **`value` 键**——数据应答通道：

```ts
// 对象 = 局部一次性按钮：不进全局 action 表，点击直调
engine.messages.add({
    title: "已删除 3 个文件",
    type: "warn",
    delayClose: 0,
    actions: [{ title: "撤销", handle: undo }],
});

// value 键：点击写入 message.result（数据应答，无需 handle）
const q = engine.messages.add({
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

点击闭环顺序：**置已读 → 写 `result = value` → 发 `message:action` 事件 → `handle` 调用（若有）→ `hide` 判定关闭**。`value` 与 `handle` 正交可并存；`hide` 默认 `true`、显式 `false` 续显；字符串形态查全局 action 表（带 `anchor` 时沿 scope 链解析，见下）。actions 渲染在卡片**底部独立行**（不与标题同行，link 形态无边框）。

### 已读与业务状态

- **已读**：卡片内任意点击（按钮 / 链接 / 关闭钮）自动置已读；编程式走 `markRead(id)` / `markAllRead(kind?)`；
- **业务状态 `status`**：引擎纯透传存储 + 事件，语义归开发者（如 `"sending"` / `"sent"` / `"failed"`）；
- **`update(id, patch)` 是记录级字段唯一写通道**（`read` / `status` / `result` / `title` / `body`…），生效 = 改记录 + 发 `message:update` + 触发持久化：

```ts
engine.messages.update(id, { status: "failed", body: "网络中断，点击重试" });
engine.messages.markRead(id);
engine.messages.markAllRead("notice"); // 按kind批量已读
```

### 通用确认 confirm

`confirm` 是「两个 value-only action + sticky」的语法糖，返回 `Promise<result>`（点击时 resolve 其 value，默认 yes→`true` / no→`false`）：

```ts
const ok = await engine.messages.confirm("确认删除该文件？", { yes: "删除", no: "再想想" });
if (ok) deleteFile();
```

- **永不自动关、永不 settle**——调用方需要超时请自行 `Promise.race`；
- 非模态：无遮罩、并发堆叠、pos 跟随全局默认；需要模态确认走 [x-dialog](/zh/guide/directives/x-dialog)。

### 进度任务 progressbar

`progressbar` 创建 `kind='task'` 的进度消息，返回 `ProgressTask`（extends MessageTask）。**进度能力由 kind='task' 提供（非通用消息功能）**——直接 `add({ kind: 'task', progress: 50 })` 也渲染进度条（推进走 `update(id, { progress: n })`）；`progress` 是该 kind 的专属键，其他 kind 携带会被 warn + 忽略。`progressbar()` 只是在其上附加行为句柄：

```ts
const upload = engine.messages.progressbar({
    title: "上传 report.pdf",
    delayClose: 3000, // 完成后展示 3 秒再关
});
upload.start();
upload.progress(30);
upload.pause();    // 闸门：pause 后 progress 调用被忽略
upload.resume();
upload.progress(100); // = stop()：完成态展示 delayClose 后自动关
// upload.cancel();   // 中止：立即关
```

- `progress(n)` clamp 到 [0,100]；**创建不自启**，显式 `start()`；
- 卡片**照常渲染 `actions` 行**——如取消按钮：`actions: [{ title: "取消", handle: () => upload.cancel() }]`（引擎不自动注入）；
- **进行中不计时**（sticky），完成 / 取消才进入关闭流程；
- 自定义渲染见 [kinds[kind].render](#自定义渲染)（接管 `task` kind 时进度条自带）。

### 生命周期：记录与展示

消息有**记录**与**展示**两层生命周期，`persist` 决定记录存续：

| persist | 行为 |
| --- | --- |
| `'none'`（默认） | 隐藏即删除记录——纯 toast 语义 |
| `'local'` | 隐藏转「已隐藏」态，记录存活、可枚举，localStorage 持久化 |
| `'remote'` | 同上 + 服务器同步（POST） |

```ts
engine.messages.size;            // 存活记录数（展示中 + 已隐藏）
engine.messages.get(id);         // 原生 Map.get
engine.messages.show(id);        // 重显已隐藏记录（满额计时；展示中幂等；不存在 warn + null）
engine.messages.delete(id);      // 硬移除（无动画；persist 记录一并删）
engine.messages.clear();         // 清全部存活记录（含隐藏，带动画；clear(false) 立即）
```

`maxLen`（记录数上限，溢出 FIFO 丢最旧）只在 `options.messages.maxLen` 构造期设置——manager 配置不提供运行时修改（fast-follow `configure(partial)`）。

- `engine.stop()` 不动消息（无锚非树内）；`engine.destroy()` 收口（销毁 + 持久化 flush）；
- 多引擎独立 manager / 容器 / 队列。

### 持久化与同步

```ts
// 启动时从服务器拉取（GET url，响应体为消息 JSON 数组）
const loaded = await engine.messages.load();          // url 参数缺省用 options.messages.url
// 合并语义：按 id 覆盖（服务端为准）、新 id 追加；只入记录不弹（需要时 show(id)）
loaded.forEach((t) => t.read || engine.messages.show(t.id)); // 例：手动重弹未读
```

```ts
const app = new AutoSpark(el, state, {
    messages: {
        url: "/api/messages",                          // load 与 persist remote 同端点
        headers: { Authorization: "Bearer ..." },      // 透传 fetch
    },
});
await engine.messages.save(); // 立即 flush（缺省变更防抖 500ms 自动 POST 全量存活记录）
```

- **remote**：`POST url`、body = 存活记录全量 JSON 数组（服务端整体替换语义）、变更防抖 500ms 合并、`destroy()` 时尝试 flush（keepalive 兜底）；
- **local**：localStorage key `autospark-messages`，记录变更即同步全量写；
- **序列化剥函数**：actions 字符串名可恢复（重查全局表）、内联 `handle` 跨会话**永久丢失**；恢复记录只入枚举不自动重弹；
- 失败均 warn 不抛（load resolve 空数组）；SSR 下 localStorage 缺失 warn + no-op。

### anchor 与局部 action

`anchor` 把消息关联到页面元素，**三职合一**（配套 action 注入或 API 显式传同规）：

- **局部 action 解析根**：actions 字符串沿 anchor 的 scope 链解析局部 action（无 anchor 只查全局表）；
- **事件派发根**：action 生命周期事件以 anchor 为根额外派发（发起子树 `@message:action` 就近消费）；
- **渲染数据视图基准（dataContext）**：anchor 存在时 kind render 组件挂链 anchor 所在 scope——自定义 render 的表达式可访问发起元素的数据域（响应式订阅生效）；无 anchor 时 render 组件 rootless（仅消费 props）。

```ts
engine.messages.add({
    title: "订单已超时",
    actions: ["reopenOrder"],        // 沿 anchor 所在 scope 链解析
    anchor: document.querySelector("#order-123"), // 或选择器字符串
});
```

配套 action（`toast` / `confirm` / `task`）在 DOM 处使用时**自动注入发起元素为 anchor**；编程式 API 调用无注入（anchor 仅显式传时生效）。

`anchor` 不做**定位**（消息恒屏幕锚定）；元素旁提示场景用 tooltip / popover。

### 自定义渲染

四级查找协议：`kinds[kind].render`（用户 kind 级插槽）→ `options.messages.shell`（用户全局兜底）→ 内置注册表按 kind（引擎内置：`task` → `task-shell`，进度条全权归它）→ 内置 `message-shell`（最终默认，未命中回退）。内置 render 一组件一文件（`src/messages/renders/`）。自定义组件拿到**全量数据域 props**（已解析、剥函数），自由消费：

```ts
const app = new AutoSpark(el, state, {
    components: {
        // kind='notice' 的专属外观
        "notice-card": `
            <div class="my-notice" :data-message-type="type">
                <h4 x-html="title"></h4>
                <p class="dim" x-show="!read">未读</p>
                <div x-html="body"></div>
                <div class="row"><button x-for="a in actions" x-html="a.title" :data-message-action="$index"></button></div>
            </div>`,
    },
    messages: { kinds: { notice: { render: "notice-card" } } },
});
```

- props 键：`id / kind / title / body / type / icon / actions / closable / href / read / status / result / progress（仅 task）/ delayClose`；
- 接管 `kind='task'`（render 指向自定义组件）时进度条渲染随接管者自带（`props.progress` 驱动）——内置 `task-shell` 的进度渲染不是特权通道；
- 内置 `message-shell` 无出口协议（无 `x-slot`——消息是 props 键不是内容组件）。

### 内置 action：toast 与 confirm

内置执行型 action `toast`：payload（字符串 | 配置对象）转发 `messages.add({ kind: 'toast', ... })`。内置执行型 action `confirm`：模板快速确认——payload 对象的 `yes` / `no` 键定制按钮文案，**发起元素自动成为 anchor**，确认/取消结果经 `message:action` 事件就近回流（`detail.value`：`true` 确认 / `false` 取消，`detail.message.id` 区分并发）：

<demo html="messages/api.html"/>

```html
<button @click="confirm({ title: '确认删除？', yes: '删除', no: '再想想' })">删除</button>

<!-- 结果消费：就近监听 message:action -->
<div @message:action="onChoice($event.detail.value)">…</div>
```

- 内置执行型 action `task`：payload 转发 `messages.progressbar(...)`，`ProgressTask` 句柄经 `actions/task/*` 广播 payload 交付（进度推进仍为编程式）；
- 三个 action 均广播各自生命周期信号（`actions/toast/*` / `actions/confirm/*` / `actions/task/*`，发起时点）；用户同名声明覆盖内置；
- `messages: false` 时均 warn + no-op。

### 事件

双通道广播（引擎总线 + 卡片元素 `dispatchEvent`），payload `{ message: MessageTask, el }`：

```ts
engine.on("message:action", (m) => {
    console.log(m.payload.message.id, m.payload.value); // value 应答在此
});
document.body.addEventListener("message:hide", (e) => console.log("关闭", e.detail.message.id));
```

| 事件 | 触发时机 |
| --- | --- |
| `message:add` | 记录创建 |
| `message:update` | `update(id, patch)` 生效 / 同 id 原地更新 |
| `message:show` / `message:hide` | 展示状态转换（一切移除路径均广播 hide） |
| `message:read` / `message:status` | 已读置位 / status 补丁 |
| `message:action` | action 点击（追加 `{ action, value? }`） |

kind='toast' 时**双发**旧事件 `toast:show` / `toast:hide`（迁移期兼容，随别名退役）。

### 视觉定制

三层通道沿 ADR-0068，命名 message 化：

```css
:root {
    --autospark-message-error-color: #d93025; /* 语义色换肤 */
    --autospark-message-max-w: 360px;
    --autospark-message-inset: 16px;          /* 分区列与屏幕边缘间距 */
    --autospark-message-z: 1100;              /* 层高（高于 overlay 的 1000） */
}
```

```ts
// 1. className 追加主题类（覆盖内置规则时选择器带 .autospark-message 提升 specificity）
// 2. 语义色 CSS 变量（见上）
// 3. kinds[kind].render 结构层全换（见自定义渲染）
```

## 配置选项

合并链：`内置默认 < options.messages < kinds[kind] < 单次 props`。保留键**封闭清单**——未知键 warn + 忽略；空 title warn + no-op。

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `title` | — | 消息标题（HTML；经 `options.sanitizer` 消毒——与 x-html 同一安全通道） |
| `body` | — | 可选正文（HTML 同通道），渲染在下一行、字号小一号 |
| `kind` | `"toast"` | 业务类别（开放集合）；驱动 kinds 默认与渲染插槽 |
| `type` | `"none"` | 类型 `none / info / success / warn / error`——驱动图标与语义色 |
| `icon` | — | 显式图标名，优先于 type 默认映射 |
| `delayClose` | `3000` | 自动关闭延迟 ms；`0` = sticky；hover 暂停 / 移出恢复（剩余时间制） |
| `pos` | `"top-right"` | 屏幕锚定位置（7 值枚举）；非法值 warn + 回退 |
| `offset` | — | 分区列与屏幕边缘间距；**仅该列首次创建时生效** |
| `id` | 自动生成 | 记录 id；**同 id = 原地更新**。仅单次调用层生效 |
| `read` | `false` | 已读标记（点击自动置位；编程式走 `markRead`） |
| `status` | — | 业务状态（引擎纯透传） |
| `result` | — | action value 应答（只读面，点击写入） |
| `href` | — | 尾随 external 链接（新标签、不关闭、置已读） |
| `closable` | `false` | 关闭按钮（开启出 ×，内置 `no` 图标） |
| `persist` | `"none"` | 记录存续 `none / local / remote`（见[生命周期](#生命周期-记录与展示)） |
| `actions` | — | 按钮行（字符串 = 全局 action 名 / 对象 = 局部按钮，`value` 键数据应答） |
| `anchor` | — | 局部 action 解析根 + 事件派发根（元素或选择器字符串） |
| `progress` | `0` | **kind='task' 专属键**（非通用——其他 kind 携带 warn + 忽略）；初始进度 0~100，progressbar 内部传用 |
| `animate` | `"slide"` | 进出场动画（默认按 pos 方向自适应，`false` 关闭） |
| `className` | — | 附加类名（主题定制通道） |

另有**管理器级键**只在 `options.messages` 全局层生效（kinds 内出现 warn + 忽略）：

| 键 | 默认值 | 说明 |
| --- | --- | --- |
| `showCount` | `5` | 同屏显示上限——按 pos 分区各计，满员 FIFO 排队补位 |
| `maxLen` | 不限 | 存活记录数上限，溢出 FIFO 丢最旧 |
| `url` | — | load 拉取与 persist remote 同步端点 |
| `headers` | — | fetch 透传头（如鉴权 token） |
| `icons` | — | type → 图标名重映射（默认同名词映射） |
| `shell` | — | 全局自定义外壳组件名（兜底层） |
| `kinds` | — | 按 kind 的默认值与渲染插槽（`kinds[kind].render`） |

## 注意事项

- **sticky 永占坑位**：`delayClose: 0`（含 confirm、进行中的进度任务）永不自动关，极端场景占满分区队列——sticky 请搭配 `closable: true`。
- **confirm 永不 settle**：用户不点击 Promise 永远挂起，需要超时请自行 `Promise.race`。
- **持久化剥函数**：内联 `handle` 跨会话永久丢失（字符串 action 名可恢复）；恢复记录不自动重弹。
- **maxLen 丢最旧不豁免未读**：溢出按创建序 FIFO 淘汰。
- **anchor 不做定位**：消息恒屏幕锚定，「元素旁提示」用 tooltip（悬停）/ popover（点击）。
- **触摸设备**：hover 暂停无专属逻辑；**无障碍**：`role="status"` / `aria-live` 在 fast-follow 清单。
- **SSR**：显示静默跳过；localStorage 缺失 local 持久化 warn + no-op；load / save 可用。

技术决策与被否决方案详见 [ADR-0071](https://github.com/autosparkjs/autospark/blob/main/packages/engine/docs/adr/0071-messages.md)。
