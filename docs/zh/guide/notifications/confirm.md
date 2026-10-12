# 通用确认

`confirm` 是**非模态双钮确认** type（内置语义 type）——`await` 会话直接得用户选择（确定 → `true` / 取消 → `false`）。

## 用法

### 快捷方法

```ts
const ok = await engine.notifications.confirm("确认删除？", { yes: "删除", no: "再想想" });
if (ok) deleteFile();
```

<demo html="notifications/quick-confirm.html"/>

### Confirm 会话

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

- **永不自动关、永不 settle**——调用方需要超时请自行 `Promise.race`；卡片常显关闭钮（`closeable` 默认 `true`）——点 × 直接关不作答（Promise 同样不 settle）；
- 非模态：无遮罩、并发堆叠、pos 跟随全局默认；需要模态确认走 [x-dialog](/zh/guide/directives/x-dialog)。

<demo html="notifications/confirm.html"/>

## 应答闭环

应答走 `value` 数据通道：点击 = **置已读 → 写 `result = value` → 发 `actions/<名>` 事件 → hide**（详见 [操作按钮与应答](./index.md#操作按钮与应答) 与 [事件](./events.md)）。Confirm 会话 `yes()` / `no()` ≡ 点击对应按钮（同一闭环）；JS 侧亦可 `engine.notifications.respond(id, value)` 直接应答。

## 模板 action

```html
<button @click="confirm({ title: '确认删除？', yes: '删除', no: '再想想' })">删除</button>
<!-- 结果回流：总线通配订阅 actions 事件（信封 payload.value：true 确认 / false 取消；
     payload.notification.id 区分并发）——事件名含运行时 id，模板侧无法预知，回流走总线 -->
<script>
    engine.on("notifications/*/*/actions/*", ({ payload }) => {
        onChoice(payload.value);
    });
</script>
```

- payload 对象的 `yes` / `no` 键定制按钮文案（缺省自动注入「确定/取消」双钮）；
- 结果经 `notifications/<type>/<id>/actions/<名>` 事件回流；`notifications: false` 时 warn + no-op。
