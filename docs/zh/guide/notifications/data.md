# 数据视图

通知子系统在 `store.state` 上注入保留键 **`$notifications`**（ADR-0072，`$scopes` 后第二例）——通知中心面板 / 未读角标等**跨卡片视图零桥接直绑**。

## 通知面板直读

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

## 关联页面元素

`anchor` 把通知关联到页面元素，**三职合一**（模板 action 自动注入或 API 显式传同规）：

- **局部 action 解析根**：actions 字符串沿 anchor 的 scope 链解析局部 action（无 anchor 只查全局表）；
- **事件派发根**：action 生命周期事件以 anchor 为根额外派发（具体名 `notifications/<type>/<id>/actions/<名>`——发起子树拿到 id 后可精确监听；批量消费走总线通配，ADR-0102，见 [事件](./events.md)）；
- **渲染数据视图基准（dataContext）**：anchor 存在时 shell 与 type 模板挂链 anchor 所在 scope——自定义渲染组件的表达式可访问发起元素的数据域（响应式订阅生效）；无 anchor 时 rootless（仅消费 props）。

```ts
engine.notifications.show({
    title: "订单已超时",
    actions: ["reopenOrder"],        // 沿 anchor 所在 scope 链解析
    anchor: document.querySelector("#order-123"), // 或选择器字符串
});
```

配套 action（`toast` / `confirm` / `task`）在 DOM 处使用时**自动注入发起元素为 anchor**；编程式 API 调用无注入（anchor 仅显式传时生效，两者等价——见 [快捷方法与模板按钮](./index.md#快捷方法与模板按钮)）。

`anchor` 不做**定位**（通知恒屏幕锚定）；元素旁提示场景用 tooltip / popover。

<demo html="notifications/anchor.html"/>

## 保存与同步

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
