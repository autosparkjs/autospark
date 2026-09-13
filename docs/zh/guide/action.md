# 动作

## 概述

动作（`action`）是事件到状态变更的桥梁：在 `@click` 等事件里调用一个具名函数，由它改写状态、发起请求。动作统一拥有**生命周期事件**（pending / resolved / rejected），无论同步还是异步——这让全局 loading、错误提示、执行反馈都能声明式地接上。

## 快速入门

下面的动作是异步的（模拟保存）。点击后观察状态变化与生命周期日志——`pending` 在执行前、`resolved` 在完成后，均经总线广播。

<demo html="action/lifecycle.html"/>

## 指南

### 注册动作

下面这个 demo 同时演示两种注册方式：外层按钮命中**全局** `ping`、块内按钮命中**局部** `ping`（同名局部覆盖全局）。

<demo html="action/register.html"/>

动作分**全局**与**局部**两种注册方式：

#### 全局动作

构造时传入，挂在 `engine.actions` 上，全模板可见：

```javascript
const engine = new AutoSpark(el, state, {
  actions: {
    save: async () => {
      engine.state.status = "保存中";
      await api.save();
      engine.state.status = "已保存";
    },
    remove: (id) => {
      /* ... */
    },
  },
});
```

运行时也可赋值（自动获得生命周期包装）：

```javascript
engine.actions.rename = () => {
  engine.state.user.name = "李四";
};
```

#### 局部动作

写在模板里的 `<script type="autospark/actions">` 注入**当前 scope 的局部动作**，沿 scope 父链优先命中：

```html
<div x-data="{}">
  <script type="autospark/actions">
    {
        toggle() { this.engine.state.local = !this.engine.state.local; }
    }
  </script>
  <button @click="toggle">切换</button>
</div>
```

::: warning 局部动作只 DOM 冒泡
局部动作**不进全局总线**（避免不同 scope 的同名局部动作串扰），只在 DOM 上冒泡。要进总线就用全局 `options.actions`。
:::

### 动作元数据（对象写法）

除了函数写法，动作还可以声明为**对象**：`handle` 是执行体（唯一必需键），`title` / `icon` 是约定元数据键，其余自由键（如 `danger`、`hotkey`）原样保留。两种写法可在同一声明块混用：

<demo html="action/meta.html"/>

```html
<script type="autospark/actions">
    {
        // 函数简写 ≡ { handle(v){ ... } }
        reset() { this.engine.state.status = "已重置"; },
        // 对象写法：元数据随生命周期广播携带，handle 内 this.action 可读
        save: {
            title: "保存订单",
            icon: "content-save",
            handle() { this.engine.state.status = "已保存"; }
        }
    }
</script>
```

所有注册入口（构造 `options.actions` / 运行时 `engine.actions.x = {...}` / 模板 script）统一接受两种写法，写入时**规范化**为描述符（`ActionDesc`）存储：

- `name` 由注册键自动注入（声明里写的 `name` 不生效）；
- 生命周期广播的 payload / DOM 事件 detail 均携带完整描述符（`payload.action.title` 直接可用，见[统一生命周期](#统一生命周期)）；
- `engine.actions[name]` 与 `getAction` 返回的是**描述符对象**，命令式调用取 `engine.actions.save.handle(...)`（模板内 `@click="save"` 无感，透明解包）；
- 对象写法缺 `handle`（或非函数）会记错误日志并跳过该条，不影响同块其他动作。

### 触发动作

四种触发方式：无参 / 带参 / `$event` / 表达式兜底（未命中动作时按表达式求值）。

<demo html="action/trigger.html"/>

```html
<!-- 无参：直接引用动作名 -->
<button @click="save">保存</button>
<!-- 带参：动作名(参数)，$event 拿事件对象 -->
<button @click="remove(item.id)">删除</button>
<button @input="onInput($event)">输入</button>
```

指令值若匹配「裸标识符」或「标识符(参数)」，优先当动作查找；否则当表达式求值（如 `count++`、`alert(1)`）。

### this

动作函数执行时，`this` 被绑定为**求值上下文**（`AutoSparkActionContext`）——一个聚合了触发现场与全部入口的对象。无论全局还是局部动作，`this` 形态完全一致：

<demo html="action/this.html"/>

| 字段            | 含义                                                                  |
| --------------- | --------------------------------------------------------------------- |
| `this.$event`   | 原生事件对象（`@click` 的 `MouseEvent`、`@input` 的 `InputEvent` 等） |
| `this.el`       | 触发元素（= `this.$event.currentTarget`），可就近读写 DOM             |
| `this.data`     | 数据聚合视图：本层 `localData` + `x-data` 响应域 + 全局 `state` 拍平  |
| `this.scope`    | 当前 `AutoSparkScope` 实例（`getData()` / `engine` / `parent`）       |
| `this.store`    | `AutoStore` 实例（`watch` / `state` / `collectDependencies` 等）      |
| `this.engine`   | `AutoSpark` 实例（等价于外部持有的 `engine` 变量）                    |
| `this.$options` | 指令配置只读聚合视图（指令选项 → `x-options` 宿主选项，两层回退）     |
| `this.action`   | **动作自引用**：指向当前动作的描述符（`name` / `title` / `icon` / `handle` 活引用），详见[动作元数据](#动作元数据-对象写法) |

### 读写聚合视图

`this.data` 是 `scope.getContext()` 返回的「拍平」视图：读任意键都沿 scope 父链取最近同名值；写**已存在的 `x-data` 字段**会经 set 陷阱透传到响应式域（`store.state._scopes[id]`），触发字段级细粒度更新：

```javascript
actions: {
    bump: function () {
        // 读：times 来自所在 x-data 的私有响应式域
        // 写：透传到 _scopes[id].times → 字段级更新，无需手动 refresh
        this.data.times = this.data.times + 1;
    },
},
```

::: tip 何时用 this.data、何时用 this.engine.state

- 操作**当前 `x-data` 块**的局部字段 → `this.data.xxx`（写入响应式，推荐）。
- 操作**全局根状态** → `this.engine.state.xxx`。
- 需要拿到当前 `x-data` 块的响应式代理本身（非聚合视图） → `this.scope.getData()`。
  :::

::: warning 仅在「动作分支」绑定 this
`this` 仅当指令值命中具名动作（`save` / `remove(id)`）时才绑定。表达式兜底分支（如 `count++`、`alert(1)`）走 `with(this.data)` 求值，**不经过函数调用**，故没有 `this`——此时直接写变量名即可（`count++` 而非 `this.data.count++`）。
:::

### 统一生命周期

每个动作（无论同步异步）执行时都广播完整生命周期：

| 阶段       | 时机                              |
| ---------- | --------------------------------- |
| `pending`  | 执行**之前**                      |
| `resolved` | 成功完成（同步立即；异步 `then`） |
| `rejected` | 抛错 / reject                     |

广播走**两个通道**（正交并存）：

- **总线**：`actions/<name>/{pending,resolved,rejected}`——全局消费者，可用通配订阅一批（如 `actions/*/pending` 做全局 loading）。
- **DOM 冒泡**：在触发元素上 dispatch `action:<name>` CustomEvent（`bubbles+composed`）——冒泡到祖先，供容器级聚合。

两个通道的载荷均携带完整**动作描述符**：顶层字段（`name` / `phase` / `result` / `error`）不变，嵌套 `action` 字段含 `title` / `icon` / 自由元数据与 `handle` 本体（不承诺可序列化）——消费者可直接读元数据：

```javascript
engine.on("actions/*/pending", (m) => {
    // 全局 toast 显示动作标题
    toast.show(m.payload.action.title ?? m.payload.name);
});
```

### 内置动作

引擎自动注册四个**信号型**全局动作：`yes` / `no` / `cancel` / `close`。它们的 handle **透传首参**——价值不在执行体而在**广播语义**：模板任意元素直接 `@click="close"`，容器监听 `action:close` 冒泡事件即可驱动关闭对话框、确认/取消等通用交互，无需为每个对话框手写空动作；带参触发 `close("cancel-icon")` 时载荷经 resolved 广播透传，监听方从 `$event.detail.result` 读取：

<demo html="action/builtin.html"/>

```html
<!-- 对话框容器监听内置信号（.resolved 过滤完成阶段），内部按钮零声明 -->
<div id="dialog" @action:close.resolved="dialog='已关闭'" @action:yes.resolved="submit(); dialog='已提交'">
    <button class="is-primary" @click="yes">确认</button>
    <button @click="cancel">取消</button>
    <button @click="close">✕</button>
</div>
```

```html
<!-- 信号携带载荷：close(来源) → 监听方从 $event.detail.result 读到来源 -->
<button @click="close('header-x')">✕</button>
<button @click="yes(formData)">确认</button>
```

内置动作带 `title`（确认 / 否 / 取消 / 关闭）与 `builtin: true` 标记；你自己的同名声明会**覆盖**内置。

### feedback 修饰符

`.feedback` 为触发元素提供**声明式执行反馈**——动作 pending 时加 `pending` 类、resolved 加 `resolved` 类、rejected 加 `rejected` 类：

```html
<!-- 裸 .feedback：用默认反馈类 -->
<button @click.feedback="save">保存</button>

<!-- 自定义反馈类、目标、延时 -->
<button
  @click.feedback="save"
  x-on-options="{ feedback: { pendingClass: 'loading', resolvedClass: 'ok', at: 'self' } }"
>
  保存
</button>
```

feedback 捕获动作返回的 Promise 精确反馈，连点时用 generation 计数防陈旧覆盖。详见[x-on](./directives/x-on.md)。

<demo html="action/feedback.html"/>

### 监听动作事件

监听**后代**触发的动作生命周期，用 `@action:<name>` 配合 `.pending` / `.resolved` / `.rejected` 修饰符按阶段过滤：

```html
<!-- 表单聚合内部任意 submit 动作：任一在跑则 form 显示提交中 -->
<form @action:submit.pending="onStart" @action:submit.resolved="onDone">
  <button @click="submit">提交</button>
  <button @click="submit">保存草稿</button>
</form>
```

<demo html="action/phase.html"/>

`@action:<name>` 靠 DOM 冒泡聚合后代，依赖触发元素到祖先的冒泡路径——天然按 DOM 层级隔离，无需手动判断来源。

---

动作系统讲完。接下来[指令类型](./directive.md)与[指令配置](./config.md)，或直接进入[指令](./directives/x-bind.md)。
