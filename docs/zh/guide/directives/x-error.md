# x-error 错误呈现

## 概述

`x-error` 捕获子树的**运行时错误**并在宿主区域呈现。它是**运行时指令**（observer 通道）——属性保留在渲染 DOM 上，由 `MutationObserver` 驱动。

错误来源有二：子树内 **action 失败**（rejected）经引擎自动桥接派发 `error` 事件；`raise` 内置 action **显式触发**同款事件。宿主就近捕获后按 `behavior` 呈现（错误覆盖层 / 错误 class / 纯消费）。

```html
<div x-error>
    <button @click="save()">保存（失败即呈现）</button>
</div>
```

::: info 编译期错误不进本通道
指令 created/compile 抛错、绑定表达式首求值抛错归 `scope.errors`（调试数据），与 x-error 管的运行时错误正交两轨、互不消费。机制详解见[错误处理](../../guide/engine/error.md)。
:::

## 快速入门

<demo html="error/basic.html"/>

给可能发生失败的操作区域圈一个 `x-error`——子树内 action 失败即在本区域呈现错误覆盖层（默认带「重试」「关闭」按钮），零监听代码：

```html
<div x-error style="position: relative">
    <button @click="save()">保存（失败即呈现）</button>
</div>
```

```javascript
const engine = new AutoSpark(el, state, {
    actions: {
        save: async () => {
            await api.save(); // reject → 桥接 error 事件 → 覆盖层呈现
        },
    },
});
```

失败后点「重试」以原参数重调 action；成功则呈现自动清除。

## 指南

### 指令值

`x-error` 无表达式语义（不订阅状态），指令值复用为**错误组件名简写**：非空值即组件名，仅影响**下一次**呈现：

```html
<!-- 空值：用默认错误组件 autospark.error（最常见形态） -->
<div x-error>...</div>
<!-- 简写：呈现用自定义组件 my.error -->
<div x-error="my.error">...</div>
```

组件解析链为 `x-error-options.overlay` > 指令值简写 > 内置 `autospark.error`，详见[自定义错误组件](#自定义错误组件)。呈现相关的其余配置均走 `x-error-options`（见[配置选项](#配置选项)）。

### 错误来源

<demo html="error/basic.html"/>

#### action 失败自动桥接

子树内任意 action（全局/局部、同步/异步）执行失败——同步抛错或异步 reject——引擎在**触发元素**上自动派发 `error` CustomEvent（`bubbles + composed`），由最近的 x-error 宿主捕获。既有生命周期广播（总线 + DOM `action:<name>`）照发不动，error 事件是纯追加的第三通道。

事件 `detail.error` 为归一化错误对象（`{ name?, message, stack?, source: "action", action, args }`）——`action` 是失败动作的完整描述符、`args` 是原调用参数，二者是「重试」的弹药。

::: tip 命令式直调不桥接
`engine.actions.save.handle()` 这类无触发元素的直接调用不派发 error 事件（无元素可挂事件），错误归调用方自己 catch。
:::

#### raise 显式触发

`raise` 是内置全局 action，为模板侧提供显式触发入口（前置条件不满足、表单校验失败等场景）。以**整体形态**书写：

```html
<button @click="raise('库存不足')">下单</button>
<button @click="raise('校验失败', { closeable: false })">提交</button>
```

归一化规则：`raise("文本")` → `{ message }`；`raise(new Error(...))` → `{ name, message, stack }`；`raise({...})` → 原样保留；均注入 `source: "raise"`。

第二参 `options`（`props` / `closeable` / `retryable` / `actions`）透传进事件 detail——**事件层配置优先于宿主 `x-error-options` 静态层**（调用点比宿主声明更懂这次错误要什么按钮）。

::: warning raise 不能写进复杂表达式
`raise` 经 action 查找链解析，只在指令值整体形态（`@click="raise('x')"`）可用。写成 `age < 18 ? raise('未成年') : submit()` 会走表达式兜底分支，`raise` 未定义导致求值失败。条件触发请把判断放进 action：

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

[x-data](./x-data.md) / [x-html](./x-html.md) / [x-component](./x-component.md) / [x-import](./x-import.md) / [x-isolate](./x-isolate.md) 的远程加载失败（ADR-0121 统一内核）会向宿主派发同款 `error` 事件——`source: "load"` 是与 `raise` / `action` 并列的第三错误源，x-error 一处声明即可统一接管呈现：

```html
<div x-error>
    <div x-data="/api/books">...</div>   <!-- 加载失败 → x-error 覆盖层 + 重试按钮 -->
</div>
```

归一化错误对象形如 `{ name, message, url?, statusCode?, source: "load" }`（url / statusCode 随请求透出）。**各指令默认呈现保持**（`$error` 元键、x-component error 占位等照写），x-error 在场时引擎主动渲染的错误呈现退位、由 x-error 接管；retryable 默认 `true`，重试按钮执行体 = 重新加载（在途先中止再重启）。

### 就近消费

<demo html="error/nested.html"/>

宿主监听 `error` 事件，捕获即 `stopPropagation`——嵌套 x-error 时**内层优先**消费，外层不再收到（`behavior: 'none'` 同样 stop：纯消费也是消费，外层不应越级呈现内层已认领的错误）。全程无 x-error 捕获的事件冒泡到顶自然消亡，不产生 uncaught。

同一宿主是**单错误槽**：新错误**替换**当前呈现，不做队列/堆叠——最新错误即最相关错误。错误对象不进持久状态，生命周期即呈现期。

```html
<div x-error><!-- 外层：只收到内层未认领的错误 -->
    <div x-error><!-- 内层：优先捕获 -->
        <button @click="raise('x')">go</button>
    </div>
</div>
```

### behavior 三态

`x-error-options.behavior` 声明捕获后做什么，默认 `'overlay'`：

<demo html="error/behavior.html"/>

```html
<!-- overlay（默认）：错误覆盖层铺满宿主 -->
<div x-error>...</div>

<!-- addErrorClass：宿主加错误 class（默认名 error），自绘错误样式 -->
<div x-error x-error-options.behavior="'addErrorClass'">...</div>

<!-- none：纯消费不呈现（认领错误，供已自建错误 UI 的边界使用） -->
<div x-error x-error-options.behavior="'none'">...</div>
```

- **`'overlay'`**：挂载错误覆盖层——`position: absolute; inset: 0` 撑满目标、原内容保留、清除即移除 DOM；**目标须 `position: relative`**。挂载目标可用 `overlayAt` 相对查询改指（`'../#panel'` 爬升、`'^.container'` closest、`'/#modal'` 全局，未命中回退宿主）。
- **`'addErrorClass'`**：宿主加错误 class（默认名 `error`，`errorClass` 自定义），清除时移除——宿主自身有错误样式（红边框等）时用。
- **`'none'`**：stopPropagation 后不呈现。

### 自定义错误组件

overlay 态的错误呈现是一个组件，按解析链查找：`x-error-options.overlay` 显式指定 > 指令值简写 `x-error="my.error"` > 内置 `autospark.error`。经组件机制（局部 `x-define` / 全局 `options.components`）即可完全接管错误 UI：

<demo html="error/custom.html"/>

```javascript
const engine = new AutoSpark(el, state, {
    components: {
        "my.error": `
            <div class="my-error">
                <p x-text="message"></p>
                <button @click="close()">知道了</button>
            </div>
        `,
    },
});
```

组件 data 注入契约（保留键指令独占，`props` 传入同名 warn 忽略）：

| 字段                  | 含义                                                         |
| --------------------- | ------------------------------------------------------------ |
| `error`               | 归一化错误对象（`{ name?, message, stack?, source, action?, args? }`） |
| `message`             | `error.message` 别名                                         |
| `closeable`           | 关闭按钮显隐（内置组件经 x-show 控制）                       |
| `retryable`           | 重试按钮显隐                                                 |
| `actions`             | 额外动作按钮视图 `[{ name, title, icon? }]`                  |
| `close` / `retry`     | 关闭/重试闭包（经块 scope actions 通道 注入），`@click="close()"` 直调 |
| props 合并字段        | `raise` 第二参 / `props` 配置注入的自由字段                  |

### 重试

<demo html="error/basic.html"/>

`retryable` 默认值按源分流：**action 源与 load 源 `true`、raise 源 `false`**。action 源重试按钮点击后以**原 args** 重调失败的 action：

- resolved → 自动清除呈现；
- 再次 rejected → 桥接派发的新 error 事件经单错误槽自然更新呈现。

load 源（远程加载）重试语义：执行体 = 重新加载（ADR-0121 统一注入的 `loader.refresh()`，在途先中止再重启）——加载成功 → 清除呈现；再次失败 → 新一轮 load 错误事件更新呈现（单错误槽）。

重试重放的是 **action 本身**（桥接在 action 层，重试与之对称也在 action 层），不重放触发元素上的 x-on 表达式。`raise` 源错误无源可重——显式 `retryable: true` 也不渲染重试按钮并记 warn。

工作原理要点：

1. **装填弹药**：action 失败时 `buildAction` 桥接派发 `error` 事件，`detail.error` 除归一化错误对象外还内嵌**完整 action 描述符**（`action`，含 handle）与**原参数**（`args`）；x-error 连同原触发元素（`event.target`）一起存进单错误槽——重试所需的一切在失败那一刻冻结，呈现被新错误替换时弹药随之换新。
2. **按钮装配**：`retryable` 按「`raise` 第二参事件层 > `x-error-options.retryable` 静态层 > 按源默认」回退，作布尔键注入组件 data（内置组件 `x-show` 显隐）；`retry` 闭包经错误组件**块 scope 的 actions 通道**注入（不入 data——函数值会被 autostore 当 computed 吞掉），`@click="retry()"` 点击现查直调，自定义错误组件同契约。
3. **原样重调**：以 `action.handle.apply(ctx, args)` 按原参数执行；ctx 按原触发元素重建（`findScopeByEl` 取回同一份 `data` / `scope`，`$event` 为 `null`）。handle 是 `buildAction` 包装层，故重调与首调一样广播 `pending → resolved / rejected`、失败照常桥接。
4. **结果收束**：resolved → `clear()` 自动清除呈现；再次失败 → 桥接的**新** error 事件经单错误槽先清旧再呈新（持续失败恒显示最新一次，重调无互斥，连点即并发）。
5. **边界**：重放的是 action 本身而非触发元素上的 x-on 表达式（前置语句/条件不重验，想重验就写进 action）；命令式直调无触发元素、不桥接，不进重试通道；raise 源无弹药，显式 `retryable: true` 也拦截置 `false` 并 warn（`retry()` 内以 `source !== "action"` 短路兜底）。

### 动作按钮

<demo html="error/custom.html"/>

`actions`（`(string | ActionDesc)[]`）在关闭/重试之外追加额外按钮：

```html
<div x-error x-error-options.actions="extraActions">...</div>
<button @click="raise('已删除', { actions: ['undo'] })">删除</button>
```

- **string** 经动作查找链解析 `title` / `icon`（未注册显示名字本身）；**对象**取 `name` / `title ?? name` / `icon`；
- 点击触发走 **data-action 点击委托**：已注册走真实动作，未注册**合成透传 descriptor** 照常广播双通道（按钮不变死键）；
- 点击后**不自动清除**错误呈现——生命周期归 `close` / `retry` / 新错误替换。

## 配置选项

`x-error` 的指令值是错误组件名简写（可省略）。下列配置经 `x-error-options` 成员形态（`x-error-options.behavior="'none'"`，字符串值须带引号）或整包形态（`x-error-options="{props:{...}}"`）设置。`behavior` / `overlay` / `errorClass` / `overlayAt` / `closeable` / `retryable` 为**静态字面量**（不支持表达式——呈现结构配置非状态驱动）；`props` / `actions` 为**表达式**（订阅全局 store，下次呈现取最新值）。

| 配置项       | 默认值                    | 修饰符 | 说明                                                                                     |
| ------------ | ------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| `behavior`   | `'overlay'`               | —      | 捕获后行为：`'none'`（纯消费）/ `'addErrorClass'`（加错误 class）/ `'overlay'`（覆盖层） |
| `overlay`    | 内置 `autospark.error`    | —      | 错误组件名，优先于指令值简写；未找到 warn 回退内置                                       |
| `errorClass` | `'error'`                 | —      | addErrorClass 态宿主所加的 class 名                                                       |
| `overlayAt`  | 宿主元素                  | —      | 覆盖层挂载目标（相对查询：`'../#panel'` / `'^.container'` / `'/#modal'`），未命中回退宿主 |
| `closeable`  | `true`                    | —      | 关闭按钮显隐                                                                             |
| `retryable`  | action 源 `true` / raise 源 `false` | — | 重试按钮显隐；raise 源恒不渲染（无源可重）                                      |
| `props`      | 无                        | —      | 注入组件 data 的自由字段（表达式；保留键同名 warn 忽略）                                 |
| `actions`    | 无                        | —      | 额外动作按钮数组（表达式；`(string | ActionDesc)[]`）                                    |

`raise(error, options?)` 第二参另有**事件层**四键（`props` / `closeable` / `retryable` / `actions`），优先于上表静态层。

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项 / 两层回退见[指令配置](../../guide/engine/directive/config.md)。
:::

## 注意事项

- **运行时指令**：属性保留在渲染 DOM，由 observer 通道驱动（mounted/unmounted/attrChanged）；无绑定表达式、不订阅状态（`props` / `actions` 除外）。
- **覆盖层定位前提**：overlay 为 `position: absolute; inset: 0`，宿主（或 `overlayAt` 目标）需 `position: relative` 才能被精确覆盖。
- **编译期错误不进本通道**：表达式首求值抛错、指令 created/compile 抛错归 `scope.errors`，x-error 不呈现——两轨正交。
- **error 事件名通用**：页面自行 dispatch 的同名 CustomEvent 会被捕获（缺字段时按 `{ message: String(detail) }` 兜底归一）。业务自定义事件建议避开 `error` 名。
- **命令式直调不桥接**：无触发元素的 action 直调不派发 error 事件，错误归调用方 catch。
- **raise 只能整体形态**：写进复杂表达式不可用（action 查找仅匹配 `标识符(参数)` 整体形态），条件触发请在 action 内命令式调用。
- **单错误槽新替旧**：无错误队列/堆叠，最新呈现即最新错误。
- **Error 实例不进响应式域**：注入组件的 `error` 恒为归一化普通对象，勿在组件 data 中期待原型方法。
- **重试仅 action 源**：raise 源无源可重，`retryable: true` 被拦截 warn。
- **重试只重跑 action**：触发元素上 x-on 表达式的前置语句/条件不重放，`$event` 为 `null`；条件重验请写进 action。
- **重调无互斥**：重试按钮不自带 loading/禁用，连点即并发重调；需要防护请自建。
- **actions 按钮点击不自动清除**：需要点击即关闭的场景，在 `actions` 里放 `'close'` 或由自定义组件 UI 自行处理。
