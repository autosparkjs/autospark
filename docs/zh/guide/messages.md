# 消息（Messages）

## 概述

消息是**引擎级**的统一信息反馈与管理模块（ADR-0071）：数据层收件箱式记录管理 + 屏幕分区栈呈现，一套模型承载轻提示 / 通知 / 业务提醒 / 任务跟踪。命令式（`engine.messages`）与模板声明（内置全局 `toast` action）双通道发起；状态经保留键 `$messages` 暴露进 `store.state`（ADR-0072——消息中心面板 / 未读角标模板直绑）：

```ts
// 命令式：任意 JS 代码处
const session = engine.messages.show({ title: "已保存", type: "success" });
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
    description: "文件被占用，请关闭后重试",
    type: "error",
    delayClose: 0,
    actions: [{ title: "重试", handle: retry }],
});
```

#### async factory（条件通知）

resolve `undefined` / `void` 则**静默不弹**（内容就绪才提示）；同步返回挂起句柄，**挂起期 `session.hide()` = 取消**：

```ts
engine.messages.add(async () => {
    const hasUpdate = await checkUpdate();
    return hasUpdate ? { title: "发现新版本", type: "info" } : undefined;
});
```

#### 会话句柄（AutoSparkMessageSession）

`add(...)` 返回**按 kind 分派的会话句柄**（ADR-0077）——管理单条消息渲染生命周期的行为对象；`read` / `status` / `result` 为**只读 getter**（写走 [`update`](#已读与业务状态)）：

```ts
interface AutoSparkMessageSession {
    readonly id: string;             // 记录 id（缺省自动生成）
    readonly kind: string;           // 业务类别（默认 'toast'）
    readonly el: HTMLElement | null; // 卡片根元素（排队未显示 / 已关闭为 null）
    show(): void;                    // 重显已隐藏记录（完整展示管线；展示中幂等）
    hide(): void;                    // 关闭（走离场动画；幂等）
    remove(): void;                  // 硬移除记录（含持久化数据立即同步删除）
    readonly closed: boolean;        // 是否已关闭（隐藏记录仍存活、可 show() 重显）
    readonly read: boolean;          // 已读标记（只读）
    readonly status: number | string | undefined; // 业务状态（只读）
    readonly result: any;            // action value 应答（只读）
}

// kind 分派子类（自定义 kind 回基类面）：
interface AutoSparkTaskMessageSession extends AutoSparkMessageSession {
    start(): void; progress(n: number): void;
    pause(): void; resume(): void; stop(): void; cancel(): void;
}
interface AutoSparkConfirmMessageSession extends AutoSparkMessageSession {
    yes(): void; no(): void; cancel(): void;  // ≡ 点击对应按钮（value 闭环）
}
```

- **`messages.sessions`**：全部存活会话的注册表——即 manager 本身的 Map 正名视图（`sessions.get(id)` ≡ `messages.get(id)`，随 remove 同步进出）；
- **死会话**：`remove()` 后会话死亡，后续方法 no-op + warn（不复活）；
- **`$session` 派生变量**：卡片子树（shell 与 kind renderer）模板内可直接访问本会话——`@click="$session.hide()"`、`@click="$session.progress(50)"`（详见[自定义渲染](#自定义渲染)）。

#### kind 快捷方式

`show` 是统一入口，三个内置 kind 另有**便捷层**（均强制对应 kind——误传他 kind 一律归位）：

```ts
engine.messages.toast({ title: "已保存", type: "success" });   // ≡ show({ ...props, kind: 'toast' })

const ok = await engine.messages.confirm("确认删除该文件？", { yes: "删除", no: "再想想" });
// ≡ show({ kind: 'confirm', delayClose: 0, 双钮 })——返回 Confirm 会话（thenable：await 即得应答）

const upload = engine.messages.task({ title: "上传中", delayClose: 3000 }); // ≡ show({ kind: 'task' })——Task 会话
```

**双通道发起与 anchor**：模板侧有配套的全局 action `toast` / `confirm` / `task`（`@click="toast('已保存')"`），在元素上使用时**自动注入宿主元素为 anchor**（局部 action 解析根 / 事件派发根 / 渲染数据视图基准——自定义 renderer 可访问发起域数据）。编程式调用不自动注入，显式传 `anchor` 等价：

```ts
// 模板 @click="confirm({ title: '删除？' })"  ≡  编程式显式传 anchor：
engine.messages.show({
    title: "删除？",
    kind: "confirm",
    anchor: document.querySelector("#del-btn"), // HTMLElement | 选择器字符串
    delayClose: 0,
});
```

<demo html="messages/input.html"/>

<demo html="messages/session.html"/>

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
- `messages: false` **整体关闭**：不建容器、不注样式，`engine.messages` 与全局 `toast` action 调用均 warn + no-op。

<demo html="messages/defaults.html"/>

### 屏幕位置与分区队列

`pos` 七值枚举：`top-left` / `top-center` / `top-right`（默认）/ `bottom-left` / `bottom-center` / `bottom-right` / `center`。

<demo html="messages/pos.html"/>

队列语义（ADR-0068 决策 8 沿用 + ADR-0072 level）：

- **按 pos 分区各计**：每列独立队列，上限 `showCount`（默认 5）——右上排满不阻塞右下入队；
- **level 定序**（默认 0）：级别越高越靠**列边端**（top 系列在上、bottom 系列在末）——入列时快照定序，`update` 改 level 不移动已展示卡；同级保持到达序（FIFO 不插队）；
- **满员排队、按 level 降序补位**（同级 FIFO）；**离场平滑收拢**（兄弟随布局流上移无跳动）；
- `offset` 仅该列首次创建时生效（不迁移已建列）；`level` 不影响 `maxLen` 淘汰（那是创建序 FIFO）。

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

`title` 是消息主行（HTML，经 `options.sanitizer` 消毒）；`description` 是可选正文，渲染在下一行、字号小一号，缺省不渲染行：

```ts
engine.messages.add({
    title: "版本 2.0 已发布",
    description: "包含 12 项改进与 3 项修复，查看 <b>更新日志</b> 了解详情。",
    type: "info",
});
```

<demo html="messages/body.html"/>

### 链接（link）

`link` 提供时消息尾部出现 external 图标链接：新标签打开（`target="_blank"` + `rel="noopener noreferrer"`）、**点击不关闭消息**、置已读：

```ts
engine.messages.add({
    title: "新版本可用",
    link: "https://example.com/release",
    delayClose: 0,
});
```

<demo html="messages/href.html"/>

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

<demo html="messages/actions.html"/>

### 已读与业务状态

- **已读**：卡片内任意点击（按钮 / 链接 / 关闭钮）自动置已读；编程式走 `markRead(id)` / `markAllRead(kind?)`；
- **业务状态 `status`**：引擎纯透传存储 + 事件，语义归开发者（如 `"sending"` / `"sent"` / `"failed"`）；
- **`update(id, patch)` 是记录级字段唯一写通道**（`read` / `status` / `result` / `title` / `description`…），生效 = 改记录 + 发 `message:update` + 触发持久化：

```ts
engine.messages.update(id, { status: "failed", description: "网络中断，点击重试" });
engine.messages.markRead(id);
engine.messages.markAllRead("notice"); // 按kind批量已读
```

<demo html="messages/status.html"/>

### 通用确认（kind='confirm'）

`show({ kind: 'confirm' })` 返回 **Confirm 会话**——`yes()/no()/cancel()` 编程应答 + **thenable**（`await 会话` 直接得 choice 应答，默认 确定→`true` / 取消→`false`）：

```ts
const ok = await engine.messages.show({
    title: "确认删除该文件？",
    kind: "confirm",
    delayClose: 0, // sticky：永不自动关
    actions: [{ title: "删除", value: true }, { title: "再想想", value: false }], // 缺省自动注入「确定/取消」
});
if (ok) deleteFile();
// 或编程应答：const s = engine.messages.show({...}); s.yes();
```

- **永不自动关、永不 settle**——调用方需要超时请自行 `Promise.race`；
- 非模态：无遮罩、并发堆叠、pos 跟随全局默认；需要模态确认走 [x-dialog](/zh/guide/directives/x-dialog)。

<demo html="messages/confirm.html"/>

### 进度任务（kind='task'）

`show({ kind: 'task' })` 创建进度消息，返回 **Task 会话**（六方法行为句柄）。**进度能力由 kind='task' 提供（非通用消息功能）**——`progress` 是该 kind 的专属键，其他 kind 携带会被 warn + 忽略；推进也可走 `update(id, { progress: n })`：

```ts
const upload = engine.messages.show({
    title: "上传 report.pdf",
    kind: "task",
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

<demo html="messages/progressbar.html"/>

### 生命周期：记录与展示

消息有**记录**与**展示**两层生命周期，`persist`（ADR-0077 数值化，语义常量 `MESSAGE_PERSIST`）决定记录存续：

| persist | 常量 | 行为 |
| --- | --- | --- |
| `0`（默认） | `NONE` | 隐藏即删除记录——纯 toast 语义 |
| `1` | `SESSION` | **会话缓冲**：隐藏不删除、不持久化——记录留在内存与 `$messages.items`（管理界面可再查看、`show()` 重显），刷新即失；复用 `maxLen` 淘汰（缓冲超出清最旧） |
| `2` | `LOCAL` | 隐藏转「已隐藏」态，记录存活、可枚举，localStorage 持久化 |
| `3` | `REMOTE` | 同上 + 服务器同步（POST） |

```ts
import { MESSAGE_PERSIST } from "autospark";
engine.messages.add({ title: "x", persist: MESSAGE_PERSIST.SESSION }); // ≡ persist: 1（裸数字同合法）

engine.messages.size;            // 存活记录数（展示中 + 已隐藏）
engine.messages.get(id);         // 原生 Map.get（≡ sessions.get(id)）
engine.messages.sessions;        // 全部存活会话注册表（Map 正名视图）
engine.messages.show(id);        // 重显已隐藏记录（满额计时；展示中幂等；不存在 warn + null）
engine.messages.show(props);     // add 的别名（「show = 让消息出现」——对象恒新建、字符串恒 id，零歧义）
engine.messages.delete(id);      // 硬移除（无动画；persist 记录一并删 + 立即同步持久化）
engine.messages.clear();         // 清全部存活记录（含隐藏与会话缓冲，带动画；clear(false) 立即）
```

`remove()` / `delete()` / `clear()` 触发**立即持久化同步**（ADR-0077）：local 即写、remote 立即 POST 全量覆盖——「删干净」闭环，刷新 / 多标签页不复活。

`maxLen`（记录数上限，溢出 FIFO 丢最旧，含会话缓冲记录）经 `options.messages.maxLen` 设置（state 真身运行时可改）。

- `engine.stop()` 不动消息（无锚非树内）；`engine.destroy()` 收口（销毁 + 持久化 flush）；
- 多引擎独立 manager / 容器 / 队列。

<demo html="messages/lifecycle.html"/>

### 持久化与同步

```ts
// 启动时从服务器拉取（GET，响应体为消息 JSON 数组）
const loaded = await engine.messages.load();          // url 参数缺省用 options.messages.fetchOptions.url
// 合并语义：按 id 覆盖（服务端为准）、新 id 追加；只入记录不弹（需要时 show(id)）
loaded.forEach((t) => t.read || engine.messages.show(t.id)); // 例：手动重弹未读
```

```ts
const app = new AutoSpark(el, state, {
    messages: {
        fetchOptions: {
            url: "/api/messages",                      // load 与 persist remote 同端点
            headers: { Authorization: "Bearer ..." },  // 透传 fetch（运行时可刷新）
        },
    },
});
await engine.messages.save(); // 立即 flush（缺省变更防抖 500ms 自动 POST 全量存活记录）
```

- **fetchOptions**（ADR-0072，原 `url` + `headers` 两键合并）：`url` + RequestInit 子集（`method` / `body` 由引擎契约固定——GET 拉取 / POST 全量数组，剥除防误配），`fetch(fetchOptions.url, fetchOptions)` 直传；**每次 fetch 现读 state**——token 续期直改 `$messages.options.fetchOptions.headers` 即对后续同步生效；
- **remote**：`POST url`、请求体 = 存活记录全量 JSON 数组（服务端整体替换语义）、变更防抖 500ms 合并、`destroy()` 时尝试 flush（keepalive 兜底）；
- **local**：localStorage key `autospark-messages`，记录变更即同步全量写；
- **载荷 = 记录数据面**（ADR-0072 收紧）：`id/kind/read/owner/level/type/title/description/status/result/link` + actions 字符串名——渲染/行为/生命周期键（`className/icon/pos/offset/closable/delayClose/closed/persist`）不入载荷，恢复时走生效默认；恢复记录一律转「已隐藏」态（closed 由策略置位、persist 按存储介质反推）；
- **序列化剥函数**：actions 字符串名可恢复（重查全局表）、内联 `handle` 跨会话**永久丢失**；恢复记录只入枚举不自动重弹；
- 失败均 warn 不抛（load resolve 空数组）；SSR 下 localStorage 缺失 warn + no-op。

<demo html="messages/persist.html"/>

### 状态暴露：$messages

消息子系统在 `store.state` 上注入保留键 **`$messages`**（ADR-0072，`$scopes` 后第二例）——消息中心面板 / 未读角标等**跨卡片视图零桥接直绑**：

```ts
store.state.$messages = {
    items: AutoSparkMessage[],   // 记录镜像（shallow 包装——见下）
    options: { ... },            // 生效全局配置真身（可直写）
};
```

```html
<!-- 消息中心面板：x-for 直绑镜像（level 降序、同级创建序） -->
<ul x-for="r of $messages.items">
    <li :data-read="r.read"><span x-text="r.title"></span><b x-show="!r.read"></b></li>
</ul>
<!-- 未读角标：聚合表达式 -->
<span x-text="$messages.items.filter(r => !r.read).length"></span>
```

- **items = 记录镜像**：`AutoSparkMessage` 纯数据（`AutoSparkMessageRecord` 数据记录 + `closed/icon/pos/...` 渲染行为层），无函数、无 DOM 引用；**写通道仅 `engine.messages` API**（记录级变更 = 镜像内整条替换）——模板直写为违约自理（纪律不加机制）；
- **shallow 粒度**：`items` 经 `shallow(items, options.shallow)` 包装（默认 `1`，值域 `0 | 1`）——`1`：数组结构变更（增删/整替换）与**成员一层字段读写**有事件、孙级起 raw（N 条消息只有「数组 + 记录」两层代理，title 等叶子零代理）；`0`：成员不代理，仅结构变更有事件（超大消息列表最省形态——字段级绑定失效）；**构造期一次性**：运行时直写静默忽略（options 真身「直写即生效」契约的唯一例外键）；
- **options = 生效配置真身**：构造期注入「内置默认 < options.messages」合并结果，**直写即生效**（对后续操作生效、已展示卡片不回溯）——运行时改 `showCount` / `delayClose` / `kinds` 皆可；state 写入为**信任通道**（不走入参校验）；
- **边界键**：`anchor`（DOM 引用）与 `actions`（函数值会被 autostore 按计算属性语义劫持）不入 state、构造期私有固化——「函数、元素不入 state」一条规则；`fetchOptions` 在内（token 刷新通道）；
- **保留键**：用户 state 树不得使用 `$messages` 命名；`messages: false` 时不注入。

<demo html="messages/state.html"/>

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

<demo html="messages/anchor.html"/>

### 自定义渲染

渲染是**双层正交组合**（ADR-0077，取代旧四级互斥链）——公共骨架与 kind 专属区各走各的查找链：

```
┌─ shell（公共骨架——所有 kind 共享）──────────────────────┐
│  [close ×] [type 图标] [title] [link]                      │
│  [description]                                             │
│  [〈kind 出口〉← kind renderer 投影（task 进度条等）]      │
│  [actions 按钮行——最底]                                    │
└────────────────────────────────────────────────────────────┘

shell 链：options.messages.shell（选择器，默认 'message'）
          → getComponent 链（scope 局部 x-define → options.components）
          → options.uiShells 引擎级注册表（内置种子 + 用户覆盖）
          → 内置 shell 兜底
kind 链：kinds[kind].render（用户 kind 级）
          → 内置注册表（toast 空占位 / task 进度槽 / confirm 空占位）
          → 无（自定义 kind 出口空置）
```

两层组件都拿到**全量数据域 props**（已解析、剥函数）+ **`$session` 派生变量**（本消息的会话句柄——行为通道）：

```ts
const app = new AutoSpark(el, state, {
    components: {
        // kind='notice' 的专属区（嵌在公共 shell 的 kind 出口内）
        "notice-extra": `
            <div class="my-notice-extra">
                <i x-icon="'star'" x-show="!read"></i>
                <button @click="$session.remove()">不再显示</button>
            </div>`,
    },
    messages: { kinds: { notice: { render: "notice-extra" } } },
});
```

- props 键（两层同权注入）：`id / kind / title / description / type / icon / actions / closable / link / owner / level / read / status / result / progress（仅 task）/ delayClose`；
- **`$session` 行为专职**（x-for `$index` 同款派生变量——非响应式、不进 state）：模板内 `@click="$session.hide()"` / `$session.progress(50)` / `$session.yes()`；**数据绑定走 data 域**（`x-text="title"` 响应式——`x-show="$session.closed"` 不会自动更新）；
- 接管 `kind='task'`（render 指向自定义组件）时进度条渲染随接管者自带（`props.progress` 驱动 + `$session.progress(n)` 推进）——内置 task renderer 的进度槽不是特权通道；
- 自定义 shell 须声明**默认出口**（裸 `<div x-slot></div>`）承载 kind 区——未声明 warn + kind 区丢弃（数据无损）。

<demo html="messages/render.html"/>

#### uiShells：引擎级外壳注册表

`options.uiShells`（ADR-0077）是全引擎的「带出口协议的骨架外壳」注册表——消息（`message` 键）与 overlay 家族（`dialog` / `popover` / `drawer`）的内置 shell 统一寄存处，也是**同键覆盖内置**的用户面：

```ts
const app = new AutoSpark(el, state, {
    uiShells: {
        // 覆盖消息内置骨架（只影响消息；dialog/popover/drawer 不动）
        message: `
            <div class="my-msg-shell">
                <button class="x" @click="$session.hide()">×</button>
                <b x-html="title"></b>
                <div x-slot></div>   <!-- kind 出口必声明 -->
            </div>`,
    },
});
// 运行时换骨架：注册新键 + 选择器直写（options 真身契约——对后续 add 生效）
app.store.state.$messages.options.shell = "compact";
```

- 值为 HTML 模板字符串（懒预编译）；**构造期固化**——运行时突变 `uiShells` 不生效（注册与选择分离：灵活性全在消费者选择器 `messages.shell` 上）；
- 只收外壳语义组件（出口协议 + 公共骨架）——loading 块 / error 组件 / tree-node / kind renderer 不入此表。

### 内置 action：toast 与 confirm

内置执行型 action `toast`：payload（字符串 | 配置对象）转发 `messages.add({ kind: 'toast', ... })`。内置执行型 action `confirm`：模板快速确认——payload 对象的 `yes` / `no` 键定制按钮文案，**发起元素自动成为 anchor**，确认/取消结果经 `message:action` 事件就近回流（`detail.value`：`true` 确认 / `false` 取消，`detail.message.id` 区分并发）：

<demo html="messages/api.html"/>

```html
<button @click="confirm({ title: '确认删除？', yes: '删除', no: '再想想' })">删除</button>

<!-- 结果消费：就近监听 message:action -->
<div @message:action="onChoice($event.detail.value)">…</div>
```

- 内置执行型 action `task`：payload 转发 `messages.show({ kind: "task", ... })`，Task 会话句柄（`AutoSparkTaskMessageSession`）经 `actions/task/*` 广播 payload 交付（进度推进仍为编程式）；
- 三个 action 均广播各自生命周期信号（`actions/toast/*` / `actions/confirm/*` / `actions/task/*`，发起时点）；用户同名声明覆盖内置；
- `messages: false` 时均 warn + no-op。

### 事件

双通道广播（引擎总线 + 卡片元素 `dispatchEvent`），payload `{ message: AutoSparkMessageSession, el }`：

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

<demo html="messages/events.html"/>

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

<demo html="messages/customize.html"/>

## 配置选项

合并链：`内置默认 < options.messages < kinds[kind] < 单次 props`。保留键**封闭清单**——未知键 warn + 忽略；空 title warn + no-op。

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `title` | — | 消息标题（HTML；经 `options.sanitizer` 消毒——与 x-html 同一安全通道） |
| `description` | — | 可选正文（HTML 同通道），渲染在下一行、字号小一号 |
| `kind` | `"toast"` | 业务类别（开放集合）；驱动 kinds 默认与渲染插槽 |
| `type` | `"none"` | 类型 `none / info / success / warn / error`——驱动图标与语义色 |
| `icon` | — | 显式图标名，优先于 type 默认映射 |
| `owner` | — | 归属者（业务透传：收件人/来源模块等），引擎不解释、不代填 |
| `level` | `0` | 级别：越大展示越靠列边端（top 系列在上 / bottom 系列在末）；入列快照定序、同级 FIFO；不影响 maxLen 淘汰 |
| `delayClose` | `3000` | 自动关闭延迟 ms；`0` = sticky；hover 暂停 / 移出恢复（剩余时间制） |
| `pos` | `"top-right"` | 屏幕锚定位置（7 值枚举）；非法值 warn + 回退 |
| `offset` | — | 分区列与屏幕边缘间距；**仅该列首次创建时生效** |
| `id` | 自动生成 | 记录 id；**同 id = 原地更新**。仅单次调用层生效 |
| `read` | `false` | 已读标记（点击自动置位；编程式走 `markRead`） |
| `status` | — | 业务状态（引擎纯透传） |
| `result` | — | action value 应答（只读面，点击写入） |
| `link` | — | 尾随 external 链接（新标签、不关闭、置已读）；HTML 属性仍为 `href` |
| `closable` | `false` | 关闭按钮（开启出 ×，内置 `no` 图标） |
| `persist` | `0` | 记录存续级别 `0/1/2/3`（常量 `MESSAGE_PERSIST.NONE/SESSION/LOCAL/REMOTE`，见[生命周期](#生命周期-记录与展示)） |
| `actions` | — | 按钮行（字符串 = 全局 action 名 / 对象 = 局部按钮，`value` 键数据应答）；kind='confirm' 缺省自动注入「确定/取消」双钮 |
| `anchor` | — | 局部 action 解析根 + 事件派发根（元素或选择器字符串） |
| `progress` | `0` | **kind='task' 专属键**（非通用——其他 kind 携带 warn + 忽略）；初始进度 0~100 |
| `animate` | `"slide"` | 进出场动画（默认按 pos 方向自适应，`false` 关闭） |
| `className` | — | 附加类名（主题定制通道） |
| `styles` | — | 内联样式 cssText（如 `"border-left:3px solid red"`）——卡片根追加语义；渲染键不入持久化载荷 |

另有**管理器级键**只在 `options.messages` 全局层生效（kinds 内出现 warn + 忽略）：

| 键 | 默认值 | 说明 |
| --- | --- | --- |
| `showCount` | `5` | 同屏显示上限——按 pos 分区各计，满员排队、按 level 降序补位 |
| `maxLen` | 不限 | 存活记录数上限，溢出 FIFO 丢最旧（level 不豁免） |
| `fetchOptions` | — | 传输配置（原 `url`+`headers` 合并）：`url` + RequestInit 子集直传 fetch；fetch 时现读 state（运行时改 url / 刷新鉴权头即生效） |
| `icons` | — | type → 图标名重映射（默认同名词映射） |
| `shell` | `"message"` | **公共骨架选择器**（ADR-0077）：shell 链起点——指向 `options.components` / `options.uiShells` 中的组件名；运行时直写换键对后续 `add` 生效 |
| `shallow` | `1` | `$messages.items` 的 shallow 深度（`0 \| 1`；**构造期一次性**——运行时直写静默忽略） |
| `kinds` | — | 按 kind 的默认值与渲染插槽（`kinds[kind].render` = kind 专属区组件名） |

## 注意事项

- **sticky 永占坑位**：`delayClose: 0`（含 confirm、进行中的进度任务）永不自动关，极端场景占满分区队列——sticky 请搭配 `closable: true`。
- **confirm 永不 settle**：用户不点击 Promise 永远挂起，需要超时请自行 `Promise.race`。
- **持久化剥函数 + 剥渲染定制**：内联 `handle` 跨会话永久丢失（字符串 action 名可恢复）；`className`/`styles`/`icon`/`pos` 等渲染键不入载荷——恢复时走生效默认（自定义主题不跨会话）；恢复记录不自动重弹。
- **maxLen 丢最旧不豁免未读**：溢出按创建序 FIFO 淘汰（level 只影响展示位、不影响淘汰；会话缓冲 `persist: 1` 记录同受淘汰）。
- **`$session` 行为专职**：卡片模板内 `$session.closed` 等派生读取**非响应式**（首渲染后不更新）——需要响应式的状态走 data 域绑定（`read`/`result`/`progress` 等）。
- **shallow 是一次性键**：`options.shallow` 构造期消费后直写静默忽略——options 真身「直写即生效」契约的唯一例外。
- **$messages.items 只读纪律**：镜像写通道仅 `engine.messages` API；模板直写（含 `options` 误改）为违约自理——`options` 是官方可写真身、`items` 不是，这一不对称是契约。
- **鉴权头随 state 可见**：`fetchOptions.headers` 进 `$messages.options` 真身——devtools 可查（与 network 面板等价）；**若你自行持久化整个 state 会连同落盘，请剥除**。
- **聚合绑定用表达式形态**：`$messages.items.length` 的精准路径订阅**不随**结构变更触发——计数请用 `$messages.items.filter(r => ...).length` 形态（依赖收集覆盖迭代与字段读，增删/字段变更均触发）。
- **anchor 不做定位**：消息恒屏幕锚定，「元素旁提示」用 tooltip（悬停）/ popover（点击）。
- **触摸设备**：hover 暂停无专属逻辑；**无障碍**：`role="status"` / `aria-live` 在 fast-follow 清单。
- **SSR**：显示静默跳过；localStorage 缺失 local 持久化 warn + no-op；load / save 可用。

技术决策与被否决方案详见 [ADR-0071](https://github.com/autosparkjs/autospark/blob/main/packages/engine/docs/adr/0071-messages.md)、[ADR-0072](https://github.com/autosparkjs/autospark/blob/main/packages/engine/docs/adr/0072-messages-state.md)、[ADR-0077](https://github.com/autosparkjs/autospark/blob/main/packages/engine/docs/adr/0077-message-session-dual-shell.md)。
