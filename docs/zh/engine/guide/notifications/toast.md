# 轻提示

`toast` 是通知的**默认 type**（不指定 `type` 即 toast）——分区栈短暂浮现、`delayClose`（默认 3000ms）后自动消失、`persist` 默认 `0`（隐藏即删），用于「已保存」类瞬时反馈。

## 用法

### 快捷方法

一行调用、默认 3 秒自动消失——`level` 决定图标与语义色：

```ts
engine.notifications.toast({ title: "已保存", level: "success" }); // ≡ show({ ...props })——默认 type 即 'toast'
```

<demo html="notifications/quick-toast.html"/>

### sticky 与手动收口

`delayClose: 0` = sticky（永不自动关），`closeable` 默认 `true` 常显 ×，用户可手动清坑：

```ts
engine.notifications.toast({ title: "注意", level: "warn", delayClose: 0 }); // sticky——× 常显（closeable 默认 true）
```

hover 暂停 / 移出恢复剩余时间（剩余时间制）。

<demo html="notifications/basic.html"/>

## 模板 action

模板侧全局 action `toast`（内置执行型，用户同名声明覆盖）——payload 为字符串 | 配置对象，转发 `show({ type: 'toast', ... })`：

```html
<button @click="toast('已保存')">保存</button>
```

action 在元素上使用时**自动注入宿主元素为 anchor**（见 [数据视图 · 关联页面元素](./data.md#关联页面元素)）；`notifications: false` 时 warn + no-op。

## 通用键

toast 作为标准通知卡，通用键照常可用——`level` 语义色 / `icon` / `pos` / `title` / `description` / `actions` / `link` / `className` / `styles` 等（见 [基础用法](./index.md#基础用法) 与 [配置参数](./config.md)）。`notice` / `remind` 等用户自定 type 与 toast 同为「内容卡」语义，仅默认值与渲染组件不同（见 [全局默认与类型配置](./index.md#全局默认与类型配置)）。
