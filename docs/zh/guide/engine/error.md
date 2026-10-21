# 错误处理

## 概述

AutoSpark 把错误按**产生阶段**分为两轨，各走各的通道、互不消费：

| 轨道           | 产生时机                                     | 消费者   | 通道                                          |
| -------------- | -------------------------------------------- | -------- | --------------------------------------------- |
| **运行时错误** | action 失败、`raise` 显式触发、远程加载失败 | 终端用户 | DOM `error` 事件 → [x-error](../directives/x-error.md) 呈现 |
| **编译期错误** | 指令 created/compile 抛错、绑定表达式首求值抛错 | 开发者   | `scope.errors` 属性（调试数据，不呈现）       |

**运行时错误**是呈现数据——用户在页面上点了按钮、操作失败了，或者数据没拉下来，页面应当就地告诉用户发生了什么；**编译期错误**是诊断数据——模板写错了、指令抛异常了，消费者是开发者本人，收集在 `scope.errors` 里供排查，不值得也不应该在页面上弹给终端用户。

这个分轨决定了整个错误处理体系的形状：运行时错误走 DOM 事件通道流入 [x-error](../directives/x-error.md) 做**声明式呈现**；编译期错误静默收集为结构化数据，配合日志输出供开发调试。

## 快速入门

给区域圈一个 `x-error`，子树内 action 失败（rejected）即在该区域呈现错误覆盖层，无需写任何监听代码：

<demo html="error/basic.html"/>

```html
<div x-error style="position: relative">
    <button @click="save()">保存（失败即呈现）</button>
    <button @click="submit">提交（前置条件不满足时 raise）</button>
</div>
```

```javascript
const engine = new AutoSpark(el, { age: 16 }, {
    actions: {
        // 异步 action reject → 自动桥接 error 事件 → x-error 呈现（默认带「重试」按钮）
        save: async () => {
            await api.save();
        },
        // 前置条件不满足：命令式调 raise 显式触发（raise 源无重试按钮）
        submit: function () {
            if (this.data.age < 18) {
                this.engine.actions.raise.handle.call(this, "未成年不可提交");
                return;
            }
            api.submit();
        },
    },
});
```

## 指南

### 运行时错误从哪来

运行时错误有三个生产点，都归一到同一个载体——在触发元素（load 源为宿主元素）上派发的 `error` CustomEvent（`bubbles + composed`）：

#### action 失败自动桥接

每个 action（无论全局还是局部、同步还是异步）执行失败时，除照发既有的生命周期广播（总线 `actions/<name>/rejected` + DOM `action:<name>` 冒泡）之外，**追加**在触发元素上派发 `error` 事件——这是呈现层的**第三通道**，既有消费者零感知：

```javascript
actions: {
    // 同步抛错 / 异步 reject 均桥接
    save: async () => {
        throw new Error("网络超时"); // → 触发元素 dispatch error 事件
    },
}
```

事件 `detail.error` 携带归一化错误对象 + 失败 action 的完整描述符（`action`）与原调用参数（`args`）——后者是「重试」的弹药。

::: tip 命令式直调不桥接
`engine.actions.save.handle()` 这类**无触发元素**的直接调用不产生 `error` 事件——没有元素可挂事件，错误归调用方代码自己 `try/catch`。桥接只发生在经模板（x-on）触发的路径上。
:::

#### raise 显式触发

`raise` 是引擎内置的全局 action，为模板侧提供「显式抛出错误给呈现层」的入口（表单校验失败、前置条件不满足等场景）：

```html
<!-- 整体形态：raise 是 action，须作为指令值整体书写 -->
<button @click="raise('库存不足')">下单</button>
<button @click="raise('校验失败', { closeable: false })">提交</button>
```

`raise(error, options?)` 归一化首参后派发 `error` 事件；第二参 `options` 的 `props` / `closeable` / `retryable` / `actions` 透传进事件 `detail`——**事件层配置优先于宿主 `x-error-options` 静态层**（raise 调用点比宿主声明更懂这次错误要什么按钮）。

::: warning raise 只能整体形态调用
`raise` 经 action 查找链解析，只在指令值**整体形态**（`@click="raise('x', {...})"`）下可用。写进复杂表达式（如 `age < 18 ? raise('未成年') : submit()`）会走表达式兜底分支，此时 `raise` 未定义导致求值失败。需要条件触发时，把判断放进 action 内命令式调用：

```javascript
actions: {
    submit() {
        if (this.data.age < 18) {
            this.engine.actions.raise.handle.call(this, "未成年不可提交");
            return;
        }
        api.submit();
    },
}
```
:::

#### 远程加载失败（load 源）

远程加载家族（异步 x-data / x-html、x-component loader、x-import、x-isolate remote，共享同一取数内核）**重试耗尽**后的最终失败归一为 `RemoteLoadError`（Error 实例 + `url` / `statusCode` / `source:"load"`），在宿主元素上派发 `error` 事件——`detail.error` 同为归一化普通对象，`detail.retry` 额外携带重试弹药（`loader.refresh()`，x-error 的重试按钮直接消费）：

```html
<div x-error>
    <!-- 远程加载失败由 x-error 接管呈现（含重试按钮），无需写监听代码 -->
    <div x-data="/api/orders">...</div>
</div>
```

- **HTTP 错误带状态码**：`!res.ok` 在内核抛 `HTTP <status>` 错，`statusCode` 经 `detail.error.statusCode` 透出；
- **主动 abort 静默丢弃**：url 变化重取、销毁、新轮抢占造成的 AbortError **不重试、不呈现、不算错误**；后发先至的过期响应在落地前被竞态守卫丢弃，不会覆盖新一轮结果；
- **各指令默认呈现退位**：x-data / x-html 失败照写 `$error` 元键（失败态 UI 归模板条件渲染），x-component / x-isolate 会渲染自身 error 占位——宿主或祖先有 `x-error` 时不再自行呈现，由 x-error 统一就近接管；x-import 无宿主呈现面，只派发事件 + warn 日志。

### 错误对象归一化

注入呈现层的 error **恒为普通对象**——Error 实例不进响应式域（原型链对象进 AutoStore 响应式域无收益且有序列化包袱）。归一规则：

| 原始值            | 归一结果                                    |
| ----------------- | ------------------------------------------- |
| `new Error(...)`  | `{ name, message, stack, source }`          |
| `"文本"`          | `{ message: "文本", source }`               |
| 普通对象 `{...}`  | 原样保留 + 注入 `source`                    |
| 其他（数字/null） | `{ message: String(error), source }`        |

`source` 标记来源：`"action"`（action 失败桥接）、`"raise"`（显式触发）、`"load"`（远程加载失败）——它决定重试按钮的默认显隐与 retry 语义；第三方自行 dispatch 的缺字段 `error` 事件兜底归一为 `"unknown"`。load 源对象额外携带 `url` / `statusCode`（随请求透出，呈现与调试共用）。

::: tip `$error` 元键是 Error 实例（不走归一化）
呈现层（`error` 事件 / x-error）恒收**普通对象**；但 x-data / x-html 的 `$error` 元键契约为 **Error 实例**（`RemoteLoadError`，带 `url` / `statusCode`），供模板 `$error.message` 直读。两者同源不同形：**元键给模板直读，事件给呈现层**。
:::

### x-error 呈现

[x-error](../directives/x-error.md) 是运行时错误的声明式出口：宿主监听 `error` 事件，**就近消费**（捕获即 `stopPropagation`——嵌套 x-error 内层优先，外层不再收到），按 `behavior` 三态呈现：

<demo html="error/behavior.html"/>

```html
<!-- overlay（默认）：错误覆盖层铺满宿主（宿主须 position:relative），原内容保留 -->
<div x-error>...</div>

<!-- addErrorClass：宿主加错误 class（默认名 error），自绘错误样式 -->
<div x-error x-error-options.behavior="'addErrorClass'" x-error-options.errorClass="'has-error'">...</div>

<!-- none：纯消费不呈现——声明「此区域错误我认领了」（如已自建错误 UI 的组件边界） -->
<div x-error x-error-options.behavior="'none'">...</div>
```

同一宿主是**单错误槽**：新错误替换当前呈现（最新错误即最相关错误），不做队列堆叠。

### 自定义错误组件

overlay 态的错误呈现是一个组件，解析链为 `x-error-options.overlay` > 指令值简写（`x-error="my.error"`）> 内置 `autospark.error`。用组件机制即可完全接管错误 UI：

<demo html="error/custom.html"/>

```javascript
const engine = new AutoSpark(el, state, {
    components: {
        // 全局自定义错误组件；message / error / closeable / retryable / actions 为注入 data
        "my.error": `
            <div class="my-error">
                <p x-text="message"></p>
                <button @click="close()">知道了</button>
            </div>
        `,
    },
});
```

```html
<div x-error="my.error">...</div>
```

组件 data 注入契约：

| 字段                  | 含义                                            |
| --------------------- | ----------------------------------------------- |
| `error`               | 归一化错误对象（指令独占保留键，props 不可覆盖） |
| `message`             | `error.message` 别名                            |
| `closeable` / `retryable` / `actions` | 呈现配置（见[配置选项](../directives/x-error.md#配置选项)） |
| `close` / `retry`     | 关闭/重试闭包，模板内 `@click="close()"` 直调   |
| props 合并字段        | `raise` 第二参 / `props` 配置注入的自由字段     |

### 重试语义

重试按钮（`retryable`）默认显隐随 `source` 走：**`action` / `load` 源缺省即 true**，其余源缺省不重。三种源的重试执行体各不相同：

| source  | 重试执行体                                                | 完成语义                                                         |
| ------- | --------------------------------------------------------- | ---------------------------------------------------------------- |
| `action` | 以**原 args** 重调失败的 action                          | resolved → 自动清除呈现；rejected → 新错误经单错误槽自然替换呈现 |
| `load`   | 执行事件 `detail.retry`（= `loader.refresh()`，在途先中止再重启） | 同上（resolved 后仅当呈现仍是原错误才清除，不误清已被替换的新错误） |
| `raise`  | 无源可重——即使显式 `retryable: true` 也不渲染重试按钮（记 warn） | —                                                                |

action 源重试重放的是 **action 本身**，不是触发元素上的 x-on 表达式——桥接点在 action 层，重试与之对称也在 action 层；load 源重试重放的是**整轮取数**（同一 loader 重新 get），落地路径与首取完全相同。

### 编译期错误（scope.errors）

编译期错误与运行时错误**正交通道**，互不消费——x-error 不呈现编译错误，`scope.errors` 也不收集运行时失败。三类来源收集到失败元素所属 scope 的 `errors` 字段：

| source              | 含义                                            |
| ------------------- | ----------------------------------------------- |
| `expression`        | 绑定表达式**首次求值**抛错（`expression` 字段带回原文） |
| `directive-created` | 指令 `created` 阶段抛错（`directive` 字段带指令名）     |
| `directive-compile` | 指令 `compile` 阶段抛错                                  |

```javascript
// 编译后检查（调试/开发工具场景）
const scope = engine.findScopeByEl(el);
scope.errors.forEach((e) => console.log(e.source, e.error));
```

生命周期与姿态：

- **编译前清空 → 编译结束冻结 → scope 销毁回收**——纯编译期快照，不做运行时累积；
- 表达式**首求值**成功后因状态漂移（如 `a` 被置 `null`）导致的后续重求值抛错**不收集**（那是运行时数据形态问题）；
- **容错不阻断**：单条指令 created/compile 抛错收集后继续后续指令，编译失败的半成品树仍尽量呈现（同时记 `logger.error` 日志）；
- 纯属性暴露，不经 engine.emit 广播——消费者是调试代码与开发工具。

### 引擎内部错误体系

引擎自身的结构性错误（模板编译冲突等不可恢复错误）使用统一错误类（`AutoSparkError` / `CompileError`），带结构化 `code`（如 `compile/interpolation-conflict`）与机器可读 `context`：

```javascript
try {
    engine.compile();
} catch (e) {
    if (e.code?.startsWith("compile/")) {
        // 结构化编译错误：e.context 携带冲突属性名等
    }
}
```

散点的用户可见错误（配置非法、组件未找到等）以 `logger.warn` / `logger.error` 输出并**回退缺省行为**（如错误组件未找到回退内置 `autospark.error`），不抛出中断。

### 其他错误消费通道

`error` 事件是呈现层通道，此外还有程序化消费通道，按需选用：

- **总线**：`engine.on("actions/*/rejected", ({ payload }) => ...)` —— 全局监听所有 action 失败（如统一上报）；
- **DOM 冒泡**：`@action:save.rejected="..."` —— 容器聚合后代某 action 的失败；
- **`.feedback` 修饰符**：`@click.feedback="save"` —— 触发元素级别的 rejected 类名反馈；
- **x-data / x-html 异步源**：`$loading` / `$error` 元键 + x-if 条件渲染自绘失败态（事件通道照发，与 x-error 并行不冲突）；
- **x-component / x-isolate 远程加载**：x-error 不在场时走占位协议自渲染（自定义 `error` 声明 > 内置 `autospark.error`），在场则退位交 x-error 接管。

需要 **toast 形态**的错误提示？监听 `error` 事件自行调用通知家族：

```javascript
el.addEventListener("error", (e) => toast.error(e.detail.error.message));
```

### 最佳实践

- **就近圈定错误区域**：把 `x-error` 圈在可能发生失败的操作区域内（表单项、数据面板），而不是整页一个——覆盖层语义是「这块操作失败了」，区域越小信息越准；
- **前置条件用 raise、执行失败靠桥接**：参数校验、权限判断等「还没执行就不该执行」的场景用 `raise` 显式触发；真正执行的 action 只管抛错/ reject，桥接自动处理；
- **action 内条件触发 raise 记得带 this**：`this.engine.actions.raise.handle.call(this, ...)` —— ctx 提供触发元素，事件才能派发到位；
- **自定义错误组件放全局**：`options.components["xx.error"]` 全引擎复用一套错误 UI；个别区域特例才用局部 `x-define`；
- **错误对象保持轻量**：`raise({...})` 的对象会被原样注入响应式呈现链，只带 `message` 与必要业务字段（如 `code`），别把大对象塞进去；
- **数据面板与操作区一起圈**：远程加载失败（load 源）同样由 x-error 接管且缺省自带重试——把可能加载失败的数据区域圈进就近的 x-error，失败可就地重取；
- **无 x-error 区域的错误不呈现**：`error` 事件冒泡到顶自然消亡（CustomEvent 不触发 `window.onerror`）——想全局兜底，在最外层再圈一个 `x-error`；
- **自定义事件避开 `error` 名**：`error` 是通用事件名，页面自行 dispatch 的同名事件会被 x-error 捕获（缺字段时按 `{ message: String(detail) }` 兜底归一）。

---

错误呈现讲完。x-error 的完整配置见[指令参考](../directives/x-error.md)，动作生命周期见[动作](./action.md)。
