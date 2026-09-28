# x-isolate 隔离边界

## 概述

`x-isolate` 在模板中划一块**独立于父 engine 的引擎边界**——宿主成为一个完全独立 child engine（子引擎）的根，内部模板由子引擎编译，与父 engine 状态零耦合。常用于嵌入互不信任的片段、加载远程子页面、或需要独立状态域的区域：

```html
<div x-isolate>
    <!-- 内部是一块独立世界：x-data / 插值 / 指令全部由子引擎编译生效 -->
    <div x-data="{ n: 1 }"><span x-text="n"></span></div>
</div>
```

## 快速入门

<demo html="isolate/inline.html"/>

```html
<div x-isolate>
  <!-- 内部是一块独立世界：x-data / 插值 / 指令全部由子引擎编译生效 -->
  <div x-data="{ count: 1 }">
    <button @click="count++">点击了 <span x-text="count"></span> 次</button>
  </div>
</div>
<!-- 外部普通区域正常响应式，但读不到 isolate 内部的 count -->
<p>外部：<span x-text="name"></span></p>
```

## 指南

### 指令值

指令值在**编译期分派**为三种形态，判定顺序：空值 → 以 `{` 开头 → 其余按表达式求 url：

#### 无值：inline

```html
<div x-isolate>
  <div x-data="{ n: 1 }"><span x-text="n"></span></div>
</div>
```

宿主成为**完全独立的 `AutoSpark` 实例**的根：自有 store、自有 scope 树、自有调度与指令 observer。内部模板中的 `x-data` / `x-text` / `{{ }}` / 事件绑定**全部正常生效**——由子引擎编译，而非父 engine。

#### `{...}`：种子状态

值以 `{` 开头时，`{...}` 作为**表达式在父作用域求值一次**，结果对象作为子引擎的初始状态：

<demo html="isolate/seed.html"/>

```html
<!-- 纯字面量 -->
<div x-isolate="{ page: 1, size: 20 }">...</div>
<!-- 引用父状态取初值快照 -->
<div x-isolate="{ theme: config.theme, user: currentUser.name }">...</div>
```

::: warning 一次性快照，不随父变化
`{...}` 只在编译期**求值一次**（可引用父状态、`x-data` 局部变量、`x-for` item 取初值），之后父状态变化**不会**同步到子引擎——响应式跟随意味着父每次变化都销毁重建子引擎，且违反隔离本义。需要「随父变化」的场景说明你想要的是组件传参，请用 [x-component](./x-component.md)。
:::

::: warning 引用传递
种子对象里的嵌套对象 / 数组与父**共享同一引用**（不做深拷贝）。需要真隔离请只传基本类型或纯数据副本。
:::

#### url 表达式：remote

表达式经 `scope.watch` 求值得 **url**（响应式，支持路径 / 表达式 / `x-data` 局部 / `x-for` item），fetch 该 url 的 HTML，在宿主上建独立子引擎：

<demo html="isolate/remote.html"/>

```html
<div x-isolate="state.postUrl"></div>
```

```javascript
// 换 state.postUrl 即换子模板，零额外接线
engine.state.postUrl = "/posts/2.html";
```

url 变化时销毁当前子引擎、重新 fetch、重建。加载期间自动复用 [x-loading](./x-loading.md) 显示遮罩，失败显示错误占位（`.x-isolate-error`）。

::: warning remote 模式忽略宿主内部内容
`x-isolate="url"` 的宿主内部声明的任何内容都会被**忽略**（编译期 `warn`）——remote 与内部内容互斥，加载占位由 x-loading 遮罩承担。
:::

### 隔离与通信

**与父状态零耦合**：子引擎的表达式读不到父 engine 的状态——隔离是双向的（父不渗入、子不渗出）。内部指令全部生效，但宿主自身的其他指令（如 `<div x-isolate x-show="open">` 的 `x-show`）归**父 engine** 驱动——隔离的是子树，不是宿主自身。

父子间通信走 **DOM 事件冒泡**：子内 `@click` 抛出的事件可被父的 `@click` 监听：

<demo html="isolate/events.html"/>

### engine 根标识与边界

每个 engine 的根元素都会被打上 **`data-autospark`** 属性（app 根与 isolate 宿主一视同仁）。引擎内部的相对查找（如 `^` closest 上爬、`../` 父级爬升）**遇到该标识即止步**——不会越入相邻 engine 的 DOM。子引擎内部想引用父 engine 的 DOM，用 `/` 全局选择器显式声明跨边界。

## 配置选项

子引擎的 engine 选项经 **`x-isolate-options`**（宽松 JSON，见[指令配置](../directive/config.md)）全量透传，inline / remote 通用：

```html
<div x-isolate x-isolate-options='{"debug": true, "components": {"card": "..."}}'>...</div>
```

| 配置项        | 默认值                             | 修饰符 | 说明                                                            |
| ------------- | ---------------------------------- | ------ | --------------------------------------------------------------- |
| `debug`       | `false`                            | —      | 调试模式日志                                                    |
| `autostart`   | `true`                             | —      | 构造后立即编译子模板；`false` 需手动调用子 engine 的 `compile` |
| `actions`     | `{}`                               | —      | 子引擎全局动作表，见[动作](../action.md)                        |
| `sanitizer`   | 内置极简 `sanitizeHtml`            | —      | `x-html` 消毒器（ADR-0005）；高安全场景可注入 DOMPurify        |
| `components`  | 无                                 | —      | 子引擎全局组件表（ADR-0022）                                   |
| `icons`       | 无                                 | —      | 图标种子表（ADR-0058）                                         |
| `storeOptions`| engine 内存 `ConfigManager` 实例   | —      | 自建 store 配置（`configManager` / `configKey` 等）             |

- **不自动继承**父 engine 的选项——`sanitizer` / `components` / `actions` 等定制需要就显式声明；
- 编译期静态：`x-isolate-options` 变化不会重建子引擎（无运行时覆盖通道）。

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项 / 两层回退见[指令配置](../directive/config.md)。`x-isolate` 仅消费指令选项层（透传给子 engine），不走宿主 `x-options` 回退。
:::

## 注意事项

- **只挡反应式互串，不挡结构重建**：`x-if` toggle / `engine.data` / `engine.patch` 销毁宿主时子引擎随销，重建时 inline 重编译内部模板、remote 重新 fetch。第三方代码用 DOM API 直接删除宿主时父 engine 不知情，子引擎不会自动销毁。
- **不能与 `x-for` / eager `x-if` 同元素**：三者都要独占子树（ownership 冲突）。需要时外层包裹。
- **宿主上的其他指令归父 engine**：`<div x-isolate x-show="open">` 的 `x-show` 绑定父状态、由父 engine 驱动——隔离的是子树，不是宿主自身。
- **嵌套自由**：子引擎内可继续写 `x-isolate`（inline / remote 皆可），形成多层隔离边界。
- **种子状态 ≠ props**：种子是一次性初值快照；需要响应式传参、插槽、生命周期钩子的复用单元，用 [x-component](./x-component.md)。
