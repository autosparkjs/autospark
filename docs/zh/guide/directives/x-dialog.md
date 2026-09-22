# 覆盖层消费者（x-dialog）

## 概述

`x-dialog` 是覆盖层的消费者指令（v1 唯一消费者；`x-drawer` / `x-popup` / `x-popover` 待后续）：把 [x-overlay](./x-overlay) 声明的定义实例化渲染成**模态对话框**（遮罩 + 居中面板），并以**纯状态驱动**控制其生命周期——visible 绑定真值即开、假值即关，宿主是纯声明点（无隐式点击）。

```html
<button x-dialog:login="ui.loginVisible" @click="ui.loginVisible = true">登录</button>
```

打开靠改状态；ESC、点遮罩、面板内 close 动作三个触点统一走**「请求关闭」**——可回写（简单路径）自动回写 `false`，状态是唯一真相源。

## 快速入门

<demo html="dialog/basic.html"/>

`x-dialog:login="ui.loginVisible"`——`ui.loginVisible` 为真时对话框打开。打开后无论用哪种方式关闭（ESC / 遮罩 / close 按钮），`ui.loginVisible` 都会被自动回写为 `false`。

## 指南

### 状态驱动（简单路径）

值是一个状态路径——真值即开、假值即关。因为路径可寻址，所有关闭触点都会**自动回写 `false`**：

<demo html="dialog/basic.html"/>

```html
<button x-dialog:login="ui.loginVisible" @click="ui.loginVisible = true">打开</button>
```

多个按钮、菜单项都可以是打开入口——它们只是改同一个状态，对话框的行为完全由状态决定。

### 表达式驱动（派生条件）

值可以是任意表达式（向导步骤、派生条件等场景）。表达式**无路径可回写**——请求关闭只收起 UI、不改写状态；已知边界：关闭后依赖变化重求值仍为真时会再次弹出：

<demo html="dialog/expression.html"/>

```html
<button x-dialog:pay="wizard.step === 2" @click="wizard.step = 2">去支付</button>
```

需要精确善后的场景，监听 `overlay:close` 事件（见[请求关闭](#请求关闭esc遮罩close-动作)）自行回写。

### 字面量（挂载即开）

`"true"` / `"false"` 是静态字面量（不订阅状态）：`true` 页面加载即开（公告 / 通知类），`false` 永不开启：

<demo html="dialog/literal.html"/>

```html
<div x-dialog:notice="true"></div>
```

### 对象形态与 params

值是对象字面量（宽松 JSON）时，`visible` / `params` 是保留键，**其余键并入配置合并链最顶层**（per-实例配置通道）：

<demo html="dialog/params.html"/>

```html
<button x-dialog:user="{visible: 'ui.open', params: 'userOf(currentId)', closeOnMask: false}"
        @click="ui.open = true">查看</button>
```

- `visible`：字符串状态路径（相对消费处 scope，可回写）；
- `params`：对象字面量（静态）**或字符串表达式**（打开时对消费处 scope 求值快照）——注入覆盖层实例的数据域**顶层**，模板内直接读键（<span v-pre>`{{userId}}`</span>），覆盖同名；
- 其余键（如 `closeOnMask: false`）是 per-实例配置——同元素多个 `x-dialog` 可各自差异化配置。

单例覆盖层被复用时 params 会**重新注入**（`Object.assign` 进实例数据域，响应式刷新）——「每次打开传不同参数」成立。

### 请求关闭（ESC / 遮罩 / close 动作）

三个内置触点语义统一：**关闭是「请求」不是命令**——可回写（简单路径）则回写 `false`；不可回写（表达式 / 字面量）仅收起 UI。每次请求关闭同时广播 `overlay:close` 事件供善后：

<demo html="dialog/close-actions.html"/>

```javascript
// 总线通道（推荐）：覆盖层 DOM 在 body 容器内，engine 树内的模板元素收不到 DOM 冒泡
engine.on("overlay:close", ({ payload }) => {
    console.log("已关闭：", payload.name, payload.type);
});
// DOM 通道：document.addEventListener("overlay:close", e => e.detail.name)
```

::: warning DOM 冒泡的物理边界
覆盖层实例渲染在 `document.body` 下的容器中、**不在 engine 宿主树内**——模板里写 `@overlay:close="…"` 收不到事件。模板外 JS 用引擎总线 `engine.on(...)` 或 `document.addEventListener(...)`（事件 `detail` 含 `name` / `type` / `instance`）。
:::

面板内触发的内置 `close` 动作（`@click="close()"`）由消费者在实例根上委托监听，天然闭环——面板内的确认 / 取消按钮零接线即可关闭。

### singleton：单例保活与多实例并存

`singleton`（默认 `true`）控制实例的复用策略：

<demo html="dialog/singleton.html"/>

| | `singleton: true`（默认） | `singleton: false` |
| --- | --- | --- |
| 首次打开 | 懒实例化 | 全新实例 |
| 关闭 | **隐藏保活**（动画后 `display:none`，DOM + scope 存活） | **销毁**（动画后摘除） |
| 再开 | 复用同一实例（重注入 params，内部状态保留） | 再建新实例（可多实例**并存**） |

### scope 基准：表达式上下文挂谁

`scope` 配置（声明处 / 消费处均可声明，消费处优先）决定覆盖层实例的表达式上下文、挂链与生命周期，**三合一**：

<demo html="dialog/scope-consumer.html"/>

```html
<!-- 默认 declarer：模板读声明处数据；实例随声明处 scope（单例近永续） -->
<button x-dialog:demo="ui.openA"></button>

<!-- consumer：模板读消费处数据（含局部域）；实例随消费者 scope 生死 -->
<button x-dialog:demo="{visible: 'ui.openB', scope: 'consumer'}"></button>
```

`consumer` 基准时消费者所在区域被销毁（如 `x-if` 分支收起），打开中的覆盖层会随级联自动关闭摘除——不会留下悬空弹层。

### 配置深度合并

生效配置按四级优先级**深度合并**（数组替换、`undefined` 不覆盖）：

```
内置默认 < x-overlay-options（声明处） < x-dialog-options（消费处） < 值对象内联
```

<demo html="dialog/options-merge.html"/>

消费处只写想改的键——未被覆盖的声明处配置原样保留，无需重复声明。

### anchor 锚定定位

`anchor` 配置让对话框**贴着锚点元素定位**（经 [floating-ui](https://floating-ui.com/) 计算，flip / 滚动重定位默认开启）；`dialog` 恒模态——有 anchor 也照常渲染遮罩，只是位置变了：

<demo html="dialog/anchor.html"/>

```html
<!-- 声明式：at 为选择器（@ 前缀全局 / 无前缀 scope 子树内查，打开时现查） -->
<div x-overlay:tip="dialog" x-overlay-options="{anchor: {at: '@#btn', placement: 'right', arrow: true}}">…</div>

<!-- 命令式：at 直接传元素 -->
engine.getOverlay("tip").open({ anchor: { at: btnEl, placement: "top" } });
```

- `at` 未命中：warn + 退回屏幕居中（不阻断打开）；
- `arrow: true`：引擎自动注入箭头载体 + 伪元素默认视觉（8×8 旋转 45°）——模板零约定，样式可 CSS 覆盖；
- 单例复用时随打开重应用——换锚即换位置。

### 命令式 API

`engine.getOverlay(name, options?)` 返回**定义句柄**（仅 `.global` 定义可达），`open()` 返回**实例句柄**：

<demo html="dialog/imperative.html"/>

```javascript
const handle = engine.getOverlay("task", { animate: false }); // 第二参：消费者配置级
const inst = handle.open({
    params: { taskId: "T-1" },        // 注入实例数据域
    scope: someEl,                     // 可选：数据视图基准元素（缺省 = 全局根状态）
    animate: "slide",                  // 其余键 = 最顶层配置
});
inst.close();  // 精确关这一个实例
handle.close(); // 关该定义当前「全部」打开实例
```

| API | 返回 | 说明 |
| --- | --- | --- |
| `engine.getOverlay(name, options?)` | 定义句柄 / `undefined`（未命中 warn） | 仅 `.global` 定义命令式可达（「命令式 = 全局消费」） |
| `handle.open(options?)` | 实例句柄 | 单例幂等（同句柄、重注入 params、不重播动画）；`options.visible` 无意义（warn 忽略） |
| `inst.close()` | — | 精确关闭（请求关闭语义，广播 `overlay:close`） |
| `inst.el` / `inst.name` / `inst.scope` | — | 实例外壳根 / 名称 / 数据视图基准元素 |
| `handle.close()` | — | 关该定义全部打开实例 |

命令式实例与声明式实例**同权同池**——共享单例池、同一容器、同一事件与配置链。

### 嵌套与打开栈

对话框可以叠对话框（主框里触发确认框）。遮罩的 DOM 层叠天然让点击命中最上层；**ESC 经 document 级打开栈只关全局栈顶**实例——嵌套时先关确认框、再关主框，多 engine 并存时也不连环关：

<demo html="dialog/nested.html"/>

```html
<!-- 主对话框内再声明一个消费者，叠出确认框 -->
<div x-overlay:main="dialog">
    <button x-dialog:confirm="ui.confirm" @click="ui.confirm = true">删除…</button>
</div>
<div x-overlay:confirm="dialog">…</div>
```

### 进出场动画

`animate` 配置复用引擎[进出场动画](../animate.md)机制：默认 `fade`，字符串 / 对象 / 分相（`{enter, leave}`）/ `false` 关闭；自定义动画按六类名契约写 CSS、传名即用：

<demo html="dialog/animate.html"/>

```html
<button x-dialog:d2="{visible: 'zoom', animate: 'zoom'}">自定义动画</button>
```

关闭动画播放完成后才执行隐藏 / 销毁（「播完动画再动 DOM」的标准时序）；动画中重开会抢占（中断在播离场）。

## 配置

四级合并链：`内置默认 < x-overlay-options（声明处） < x-dialog-options（消费处） < 值对象内联`。

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `visible` | 必填（值对象形态） | 字符串状态路径（相对消费处 scope，可回写）；简单形态下整值即驱动表达式 |
| `params` | 无 | 对象字面量或字符串表达式——打开时快照注入实例数据域顶层（覆盖同名），单例复用重注入 |
| `singleton` | `true` | 单例隐藏保活 vs 每次新实例可并存（见[singleton](#singleton：单例保活与多实例并存)） |
| `closeOnMask` | `true` | 点击遮罩请求关闭 |
| `animate` | `"fade"` | 进出场动画（字符串 / 对象 / 分相 / `false`） |
| `scope` | `"declarer"` | scope 基准（`declarer` 声明处 / `consumer` 消费处），表达式上下文 / 挂链 / 生命周期三合一 |
| `anchor` | 无（居中） | `{at, placement, offset, shift, flip, arrow}`——贴锚定位（floating-ui） |

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项见[指令配置](../config.md)。
:::

## 注意事项

- **宿主是纯声明点**：`x-dialog` 不自动绑定宿主点击——打开请显式 `@click="ui.flag = true"`；宿主可为任意元素，同元素可声明多个 `x-dialog` 消费不同覆盖层（各自由不同状态驱动）。
- **表达式形态的重开边界**：UI 关闭后状态仍真值、watcher 值未变不会自动重开；但依赖变化重求值仍真时会**再次弹出**——需要精确控制的场景监听 `overlay:close` 自行回写状态。
- **事件监听位置**：`overlay:open` / `overlay:close` 在实例根与引擎总线双通道广播（`detail: {name, type, instance, scope}`）；engine 树内模板元素收不到 DOM 冒泡，模板外用 `engine.on(...)` 或 `document.addEventListener(...)`。
- **`type` 是文档契约**：`x-dialog` 消费类型非 `dialog` 的定义时 warn 但仍渲染——类型不匹配不阻断使用。
- **焦点陷阱与滚动锁定**尚未内置（fast-follow）——对话框打开期间页面滚动未被锁定，键盘 Tab 可移出对话框。
- **z-index**：层叠 = 容器内 DOM 追加顺序（后开在上）；需要显式层级时经容器 CSS 变量 `--autospark-overlay-z` 全局调整。
