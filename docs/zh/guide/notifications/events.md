# 事件

## 分层命名

**分层命名（ADR-0102）**：`notifications/<type>/<id>/<verb>`——emit 面恒**具体名**，订阅面可 `*`（配一段）/ `**`（配尾段）通配。

**双通道广播**：引擎总线 + 卡片元素 `dispatchEvent`（具体名冒泡）；action 额外以 anchor 为根派发（anchor 见 [数据视图 · 关联页面元素](./data.md#关联页面元素)）。payload `{ notification, el }`，action 追加 `{ action, value? }`。**总线回调收 `{ type, payload }` 信封**（payload 在 `.payload`）；DOM 通道 `e.detail` 即 payload：

```ts
// 总线：通配批量订阅（verb 过滤 / type 过滤 / 全收）
engine.on("notifications/*/*/hide", ({ payload }) => {
    console.log("关闭", payload.notification.id);
});
engine.on("notifications/task/**", ({ type }) => {
    console.log("task 全事件", type); // notifications/task/<id>/<verb> 具体名
});
// 总线：精确订阅单卡（id 已知时）
engine.on("notifications/toast/my-id/actions/save", ({ payload }) => {
    console.log("value 应答在此", payload.value);
});
// DOM 通道：卡片元素具体名冒泡（body 级捕获）
document.body.addEventListener("notifications/toast/my-id/show", (e) => console.log("展示", e.detail.el));
```

## 事件清单

| 事件（订阅模式） | 触发时机 |
| --- | --- |
| `notifications/*/*/add` | 记录创建 |
| `notifications/*/*/update` | `update(id, patch)` 生效 / 同 id 原地更新 / task 运行键（progress·state）变更 |
| `notifications/*/*/show` / `notifications/*/*/hide` | 展示状态转换（一切移除路径均广播 hide） |
| `notifications/*/*/read` / `notifications/*/*/status` | 已读置位 / status 补丁 |
| `notifications/*/*/actions/*` | action 点击（末段 = action id：字符串形态 = action id / 对象形态 = `id` ?? `title`；追加 `{ action, value? }`） |

## 注意

- **段卫生**：type/id/action 名中的 `/` 与 `*` 组合事件名时替换为 `-`（事件名仅是广播/匹配键，记录 id 本身不变）；
- 模板侧 `@事件名` 监听无法通配（DOM 精确匹配）——事件名含运行时 id，模板预知不到；批量消费走总线通配，单卡消费在拿到 id 后动态 `addEventListener` 具体名。

<demo html="notifications/events.html"/>
