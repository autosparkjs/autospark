# 注意事项

- **组件数据边界默认封闭**：组件内读不到外层 x-data 域，交互走 props、全局 state 或显式 `open`（详见[数据边界](./data.md#数据边界默认封闭与-open)）。从旧行为（组件透视外层数据）迁移：改 props 传入，或给组件声明 `open`。
- **组件元素不渲染自身**：`x-define` 声明的元素编译期被摘除，不进结果 DOM、不建 scope。它只是「模板供体」，由 `x-component` 克隆实例化。
- **必须有祖先 scope**：每个 `x-define` 都需要至少一个带 scope 的祖先（`x-scope` 或任意其他建 scope 的指令/插值），否则编译期 `warn` 丢弃。最简单做法是用 `x-scope` 包裹。
- **组件根天然建 scope**：`x-component` 实例化时消费编译路径内禀保证组件根建 scope，无需在组件根上额外声明 `x-scope`（冗余声明静默无副作用）。
- **`x-component` 与结构指令互斥**：`x-component` 不能与 `x-if`/`x-for`/`x-isolate`/`x-switch`/`x-tree` 同元素。要控制显隐，把结构指令写在外层包裹元素上。
- **props 覆盖不重置内部状态**：props 值无变化（浅等）不更新；响应式更新只覆盖声明键；组件内部状态（用户交互改的 `data` 字段）不会被外部 props 重置。
- **scoped 样式不穿透**：`<style>` 默认纯隔离，不支持 `:deep()`/`>>>`。
- **`bind` 回退固定 unset**：响应式样式的 `var()` 回退值固定为 `unset`、不可配；要自定义默认值用 `:style` 指令。
- **methods 不经事件总线**：组件 methods 不广播 `actions/*` 事件、不冒泡 CustomEvent（定位是组件内部逻辑）。需事件聚合时显式 `this.engine.emit(...)`。
- **全局组件配置期语义**：`options.components` 是构造期配置，运行时突变它**不失效懒预编译缓存**（与 `actions`/`sanitizer` 等同纪律）。要动态注册组件用 `x-import`。
- **远程加载需静态服务器**：`x-import` 经 `fetch` 加载，本地直接打开 HTML 文件（`file://`）会因 CORS 受限，需通过 HTTP 服务器访问。
