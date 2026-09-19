# 初始化

## 概述

`AutoSpark` 是模板渲染引擎的核心类。使用流程固定为三步：**选中挂载元素 → 传入状态 → 构造引擎**。本章讲清构造器的三个参数、生命周期方法，以及引擎事件总线。

## 指南

### 构造引擎

```typescript
new AutoSpark(el, state, options?)
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `el` | `HTMLElement` | 挂载根元素，必传。引擎编译模板并把产物挂到该元素下 |
| `state` | `State` | 裸状态对象。引擎自建 store 并拥有它（传入 `AutoStore` 实例会 throw） |
| `options` | `Partial<AutoSparkOptions>` | 可选配置 |

```javascript

// 传入裸状态：引擎自动建立 store 并拥有它
const engine = new AutoSparkSpaces.AutoSpark(document.getElementById("app"), {
    user: { name: "张三" },
});
```

#### 数据源：裸状态

第二参传**裸状态对象**，引擎内部自建 store 并拥有它（1 engine 1 store）：`engine.destroy()` **会**销毁该 store，回收 computed / 订阅 / Proxy 等资源。store 级配置（computed 声明、configManager 等）经 `options.storeOptions` 传入。

```javascript
// 直接传裸状态
const engine = new AutoSpark(el, { count: 0 });
```

#### 配置选项

```typescript
interface AutoSparkOptions {
    autostart?: boolean; // 构造后是否立即编译，默认 true
    debug?: boolean; // 调试日志，默认 false
    actions?: Record<string, (...args) => any>; // 全局动作表
    sanitizer?: (html: string) => string; // x-html 的 HTML 消毒器
    storeOptions?: AutoStoreOptions; // store 配置（恒消费；configManager 缺省为引擎内存实例，configKey 缺省 ''）
}
```

### 生命周期

| 方法 | 作用 |
| --- | --- |
| `compile()` | 编译模板并挂载到 `el`（构造时 `autostart:true` 自动调） |
| `start()` | 启动引擎：未编译则编译挂载，已启动则幂等返回 |
| `stop()` | 停止：移除挂载 DOM、暂停，但**保留订阅**，可再次 `start()` |
| `destroy()` | 彻底销毁：清调度队列、销毁所有 scope、断开 observer；自建 store 一并销毁 |

```javascript
const engine = new AutoSpark(el, state, { autostart: false });
engine.start(); // 手动启动
// ...
engine.stop(); // 暂停（DOM 移除，订阅保留）
engine.start(); // 恢复
// ...
engine.destroy(); // 彻底清理
```

### 事件总线

引擎继承分层事件总线，可用 `engine.on(type, handler)` 订阅生命周期与动作事件，支持 `*` / `**` 通配。

```javascript
engine.on("engine/ready", ({ el }) => console.log("就绪", el));
engine.on("scope/created", ({ id }) => console.log("scope#", id));
engine.on("actions/*/pending", ({ name }) => console.log("动作开始", name));
engine.on("actions/*/*", ({ name }) => console.log("任一动作事件", name)); // 通配
```

::: tip 态信号会补发
`engine/ready` 这类「态信号」用 retain 发出——即使你在构造之后才订阅，也能立即补拿到最近一次。`actions/*/*` 这类「流信号」则不补发。
:::

事件类型涵盖引擎生命周期（`engine/**`）、scope（`scope/**`）、指令（`directive/**`）、动作（`actions/**`）等，完整契约见类型定义。

---

下一步：[状态](./state.md)了解状态声明与响应式机制。
