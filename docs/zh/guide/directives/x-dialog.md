# 模态对话框（x-dialog）

## 概述

`x-dialog` 是覆盖物消费者的**模态形态**（v1 唯一落地成员；`x-drawer` / `x-popup` / `x-popover` 为未来同构薄子类）：把**任意组件**渲染成**模态对话框**（遮罩 + 居中面板），并以**纯状态驱动**控制其生命周期——visible 绑定真值即开、假值即关，宿主是纯声明点（无隐式点击）。覆盖物的消费模型（组件即内容 / 查找 / props / scope 基准 / 公共契约）见[覆盖物](../overlays.md)。

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

值可以是任意表达式（向导步骤、派生条件等场景）。表达式**无路径可回写**——请求关闭只收起 UI、不改写状态，**状态仍是唯一驱动源**：

<demo html="dialog/expression.html"/>

```html
<button x-dialog:pay="wizard.step === 2" @click="wizard.step = 2">去支付</button>
```

重开只由**状态变化**驱动：依赖变化后表达式由假变真（如 step 切回 2）时弹出新实例；多依赖表达式（如 `a > 0 && b > 0`）中变化不影响结果（重求值仍为真）时同样会再次弹出。反之，UI 关闭后**状态未变化**（如对同一状态同值赋值）不触发任何重开——派生条件场景下「按钮没反应」通常就是状态没有真正变化。

需要「关闭后不再自动弹出」的精确善后，监听 `overlay:close` 事件（见[请求关闭](#请求关闭esc遮罩close-动作)）把关闭事实写回状态。

### 字面量（挂载即开）

`"true"` / `"false"` 是静态字面量（不订阅状态）：`true` 页面加载即开（公告 / 通知类），`false` 永不开启：

<demo html="dialog/literal.html"/>

```html
<!-- 组件：公告内容（须声明在消费者 scope 链上） -->
<div x-define="notice">
    <div class="ov-panel">📢 系统维护通知…</div>
</div>

<!-- 消费者：字面量 true，挂载即开（宿主任意元素） -->
<div x-dialog:notice="true"></div>
```

### 对象形态与 props

值是对象字面量（宽松 JSON）时，`visible` 是驱动保留键、`closeOnMask` / `animate` / `at` / `scope` 是配置保留键（进合并链最顶层），**其余键全部作 props** 注入组件 data 域（覆盖 `state()` 默认，与 `x-component` 同约定）：

<demo html="dialog/props.html"/>

```html
<button x-dialog:user="{visible: 'ui.open', userId: 42, closeOnMask: false}"
        @click="ui.open = true">查看</button>
```

- `visible`：字符串状态路径（相对消费处 scope，可回写）；
- `userId` 等非保留键：props——组件模板内直接读键（<span v-pre>`{{userId}}`</span>）；
- `closeOnMask` 等配置键：per-实例配置——同元素多个 `x-dialog` 可各自差异化配置。

### 请求关闭（ESC / 遮罩 / close 动作）

三个内置触点语义统一：**关闭是「请求」不是命令**——可回写（简单路径）则回写 `false`；不可回写（表达式 / 字面量）仅收起 UI。每次请求关闭同时广播 `overlay:close` 事件供善后：

<demo html="dialog/close-actions.html"/>

```javascript
// 总线通道（推荐）：覆盖物 DOM 在 body 容器内，engine 树内的模板元素收不到 DOM 冒泡
engine.on("overlay:close", ({ payload }) => {
    console.log("已关闭：", payload.name);
});
// DOM 通道：document.addEventListener("overlay:close", e => e.detail.name)
```

::: warning DOM 冒泡的物理边界
覆盖物实例渲染在 `document.body` 下的容器中、**不在 engine 宿主树内**——模板里写 `@overlay:close="…"` 收不到事件。模板外 JS 用引擎总线 `engine.on(...)` 或 `document.addEventListener(...)`（事件 `detail` 为 `{ name, instance, scope }`）。
:::

面板内触发的内置 `close` 动作（`@click="close()"`）由消费者在实例根上委托监听，天然闭环——面板内的确认 / 取消按钮零接线即可关闭。

### 数据视图基准（dataContext）

`dataContext` 配置决定实例的表达式上下文、数据视图与生命周期挂链（**挂链即基准**，详见[覆盖物 · scope 基准](../overlays.md#scope-基准声明处默认消费处可选)）：

<demo html="dialog/scope-basis.html"/>

```html
<!-- 默认 declarer：模板读声明处数据；实例随声明处 scope -->
<button x-dialog:demo="ui.openA"></button>

<!-- host：模板读消费处数据；实例随消费者 scope 生死 -->
<button x-dialog:demo="{visible: 'ui.openB', dataContext: 'host'}"></button>
```

`host` 基准下消费者所在区域被销毁（如 `x-if` 分支收起），打开中的实例会随级联自动关闭摘除——不会留下悬空弹层。旧键 `scope` 与旧值 `'consumer'` 均已废弃（warn + 兜底解析）。

### 自动关闭（delayClose）

`delayClose`（毫秒）大于 0 时，打开后延时自动走「请求关闭」——通知 / 公告 / 轻提示类弹层的开箱即用通道。它走标准关闭链：可回写的 visible 照常回写 `false`、`overlay:close` 照常广播、动画照常播放：

<demo html="dialog/delay-close.html"/>

```html
<button x-dialog:notice="{visible: 'ui.show', delayClose: 3000}">3 秒后自动消失</button>
<button x-dialog:toast="{visible: 'ui.toast', delayClose: 2000, border: false}">轻提示</button>
```

`delayClose` 缺省 / `0` 不自动关闭；手动关闭（ESC / 遮罩 / close 动作）优先于定时器，二者不冲突。

### 配置三级链

生效配置按三级优先级**深度合并**（数组替换、`undefined` 不覆盖）：

```
内置默认 < x-dialog-options（消费处） < 值对象内联保留键
```

<demo html="dialog/options-merge.html"/>

消费处只写想改的键——组件 def 不携带配置，配置全部走消费处（指令选项 `x-dialog-options` 或值对象内联）。

### at 锚定定位

`at` 配置让对话框**贴着锚点元素定位**（经 [floating-ui](https://floating-ui.com/) 计算，flip / 滚动重定位默认开启）；`dialog` 恒模态——有 `at` 也照常渲染遮罩，只是位置变了。`at` 三态：**字符串 / 元素简写**（≡ `{ selector: … }`）或完整锚配置对象：

<demo html="dialog/anchor.html"/>

```html
<!-- 声明式：字符串简写（selector 之外全部走默认——placement 'auto' 自动选位） -->
<button x-dialog:tip="ui.show" x-dialog-options="{at: '/#btn'}">…</button>

<!-- 声明式：对象形态（placement / arrow 等锚成员与 selector 并列） -->
<button x-dialog:tip="ui.show" x-dialog-options="{at: {selector: '/#btn', placement: 'right', arrow: true}}">…</button>
```

```javascript
// 命令式：元素简写 ≡ { selector: btnEl }
engine.getOverlay(el, "tip").open({ at: btnEl });
// 命令式：对象形态（换锚并指定方向）
engine.getOverlay(el, "tip").open({ at: { selector: btnEl, placement: "top" } });
```

::: tip 简写的合并语义
简写（字符串 / 元素）在进合并链前归一化为 `{ selector }`——**只覆盖 `selector`、保留上层 `placement` / `flip` / `arrow` 等其余锚成员**。所以 `x-dialog-options` 配好方向后，值对象或命令式换锚只需 `at: '#other'`，方向照旧。
:::

#### `selector` 的相对选择器语法

`selector` 取值两栖——**元素引用**（`selector: btnEl`，多用于命令式）或**相对选择器字符串**（声明式 / 命令式均可，经引擎的相对查询解析，与 `x-loading` 的 `selector` 同语法）。四种形态：

| 写法 | 查询域 | 典型场景 |
| --- | --- | --- |
| `'/#cart-badge'`（`/` 前缀） | **`document` 全局** | 锚点与消费者任意分离——跨组件树、页面任意位置 |
| 无前缀：`'li.active'`、`'#save'` | **消费者宿主元素的子树** | 锚点就在声明容器内部——把 `x-dialog` 声明在包含锚点的容器上 |
| `'../.trigger'`（`../` 可叠加） | 从宿主沿父级上爬后在**祖先内部**查 | 锚点在宿主的邻近层级 |
| `'^li.active'`（`^` closest，`^` 后可叠加 `../` 调整起点） | 从宿主向上 **closest** 匹配（含宿主自身） | 锚点是宿主的某个祖先 |

```html
<!-- / 前缀：全局查——锚点（购物车角标）与消费者任意分离 -->
<span x-dialog:cartTip="ui.tip" x-dialog-options="{at: {selector: '/#cart-badge', placement: 'bottom', arrow: true}}"></span>

<!-- 无前缀：在宿主（声明元素）子树内查——锚点（激活行）是 <ul> 的后代 -->
<ul x-dialog:rowTip="ui.rowTip" x-dialog-options="{at: {selector: 'li.active', placement: 'right', arrow: true}}">
    <li class="active">当前行（锚点）</li>
</ul>

<!-- ^ closest：锚点是宿主的祖先容器（高亮整个卡片） -->
<div class="card" x-dialog:cardTip="ui.tip" x-dialog-options="{at: {selector: '^.card', placement: 'top', arrow: true}}"></div>
```

行为要点：

- **打开时现查**：选择器在每次打开时求值（非编译期绑定）——锚元素可以是后渲染的（如 `x-if` 分支内先出现、再触发打开）；
- **未命中**：warn + 退回屏幕居中（不阻断打开）；**非法选择器**同样按未命中处理（不抛错中断）；
- `/` 前缀走全局 `document.querySelector`——**首个命中生效**，注意选择器在页面中的唯一性；无前缀只查消费者宿主**子树**——锚点在宿主之外时必须加 `/`；
- `arrow`：**锚定模式下默认开启**（`arrow: false` 显式关闭）——引擎自动注入箭头载体 + **双伪元素**默认视觉（8×8 旋转 45° 菱形：带阴影层 + 无阴影层沿主轴偏移覆盖嵌入段阴影残留），并按 floating-ui 协议沿 `staticSide` 反向偏移载体尺寸的一半，使菱形一半嵌入面板、一半露出形成小三角，与面板无缝融合；模板零约定，样式可 CSS 覆盖；
- `offset` 未配置且箭头开启：默认让位 `6px`（菱形露出高度），三角尖恰好**点在锚元素边缘**上而非覆盖锚元素内部；配置了 `offset` 则以配置为准。

### 面板边框（border）

`border` 是**面板级配置**（默认 `true`，与锚定无关——无 `at` 时同样生效）：为面板外壳加 **1px 边框 + 背景 + 圆角**（外壳模式——视觉由外壳统一承担，同色背景填平圆角微差，四角无缝），箭头双层自动变色融合——底层菱形变边框色、覆盖层变面板背景色并外扩，露出段留出 ≈1px 边框色斜带与面板 border 连续，嵌入段的边框色与阴影仍被完整遮蔽（无 V 形残留）。颜色与圆角经 CSS 变量定制：`--autospark-overlay-border`（边框色，默认 `rgba(0,0,0,.1)`）、`--autospark-overlay-bg`（面板背景色，默认 `#fff`）、`--autospark-overlay-radius`（圆角，默认 `8px`）。

```html
<button x-dialog:tip="{visible: 'ui.show', border: false}" @click="ui.show = true">无边框</button>
```

::: info 阴影融合的自定义替代路径（drop-shadow）
默认双伪元素方案对面板内容**零假设**（任意组件、任意视觉形状行为确定）。若您的面板视觉自持（不透明、无溢出浮层），可切换为更高质量的**连续阴影**：面板去掉 `box-shadow`、箭头覆盖层（`.autospark-overlay-arrow::after`）`display: none`，在面板自身挂 `filter: drop-shadow(...)`——阴影沿面板+箭头合成轮廓连续渐变。注意：`filter` 会使面板成为 `fixed` 后代的定位基准，且投影形状 = 内容合成像素轮廓（透明/溢出内容形状不可控）——这正是默认方案不采用它的原因。
:::

`placement` 共 **12 个方向取值**（4 方向 × start / 居中 / end）：`top` / `top-start` / `top-end`、`bottom` / `bottom-start` / `bottom-end`、`left` / `left-start` / `left-end`、`right` / `right-start` / `right-end`；另有 **`'auto'`（默认值）**——经 floating-ui 的 autoPlacement 按视口可用空间自动选位（与 `flip` 互斥，省略 `placement` 即为 auto）。显式方向则固定该方向 + 视口翻转（`flip` 默认开）。上方 demo 中的**九宫格**（中央为锚点，点击以锚点定位、按标注 placement 弹出）演示了全部取值。

::: warning flip 与演示语义
`flip` 默认开启（视口放不下时自动翻面）——生产期望行为；上方 demo 的九宫格中显式 `flip: false` 关闭翻转，以展示每个 placement 的**原始**语义。
:::

### 命令式 API

`engine.getOverlay(el, name, options?)` 镜像 `getComponent` 查找协议（`el` 起链就近 + 全局兜底，省略 `el` 仅查全局），返回**定义句柄**；`open()` 返回**实例句柄**：

<demo html="dialog/imperative.html"/>

```javascript
const handle = engine.getOverlay(el, "task", { animate: false }); // 第三参：消费者配置级
const inst = handle.open({
    taskId: "T-1",      // 非保留键 → props 注入组件 data 域
    scope: someEl,       // 保留键：数据视图基准元素（缺省 = rootless 全局视图）
    animate: "slide",    // 保留键：最顶层配置
});
inst.close();   // 精确关这一个实例
handle.close(); // 关该覆盖物当前「全部」打开实例
```

| API | 返回 | 说明 |
| --- | --- | --- |
| `engine.getOverlay(el, name, options?)` | 定义句柄 / `undefined`（未命中 warn） | `el` 起链查找（就近覆盖）+ 全局兜底；省略 `el` 仅查全局 |
| `handle.open(options?)` | 实例句柄 | `options.visible` 无意义（warn 忽略）；每次 open 新实例 |
| `inst.close()` | — | 精确关闭（请求关闭语义，广播 `overlay:close`） |
| `inst.el` / `inst.name` / `inst.scope` | — | 实例外壳根 / 名称 / 数据视图基准元素 |
| `handle.close()` | — | 关该覆盖物全部打开实例 |

命令式实例与声明式实例**同权**：同一容器、同一事件双通道、同一配置链、同一打开栈。

### 嵌套与打开栈

对话框可以叠对话框（主框里触发确认框）。遮罩的 DOM 层叠天然让点击命中最上层；**ESC 经 document 级打开栈只关全局栈顶**实例——嵌套时先关确认框、再关主框，多 engine 并存时也不连环关：

<demo html="dialog/nested.html"/>

```html
<!-- 主对话框组件内再消费一个确认框组件，叠出嵌套 -->
<div x-define="main">
    <button x-dialog:confirm="confirming" @click="confirming = true">删除…</button>
</div>
<div x-define="confirm">…</div>
```

### 进出场动画

`animate` 配置复用引擎[进出场动画](../animate.md)机制：默认 `fade`，字符串 / 对象 / 分相（`{enter, leave}`）/ `false` 关闭；自定义动画按六类名契约写 CSS、传名即用：

<demo html="dialog/animate.html"/>

```html
<button x-dialog:d2="{visible: 'zoom', animate: 'zoom'}">自定义动画</button>
```

关闭动画播放完成后才执行销毁（「播完动画再动 DOM」的标准时序）；动画中重开会抢占（中断在播离场）。

## 配置

三级合并链：`内置默认 < x-dialog-options（消费处） < 值对象内联保留键`。

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `visible` | 必填（值对象形态） | 字符串状态路径（相对消费处 scope，可回写）；简单形态下整值即驱动表达式 |
| `border` | `true` | 面板外壳 1px 边框 + 背景 + 圆角，箭头双层变色自动融合；见[面板边框](#面板边框border) |
| `closeOnMask` | `true` | 点击遮罩请求关闭 |
| `animate` | `"fade"` | 进出场动画（字符串 / 对象 / 分相 / `false`） |
| `dataContext` | `"declarer"` | **数据视图基准**（`declarer` 声明处 / `host` 消费处），挂链即基准；旧键 `scope` 废弃（warn + 兜底解析） |
| `delayClose` | `0` | 自动关闭延迟（ms）：`> 0` 时打开后延时自动「请求关闭」（可回写的 visible 照常回写）；`0` 不自动关 |
| `at` | 无（居中） | 贴锚定位（floating-ui）：字符串 / 元素简写（≡ `{selector}`，进链前归一化——只覆盖 selector、保留上层其余锚成员）或完整锚配置对象，成员见下表 |

**`at` 成员**（声明式经 `x-dialog-options` 或值对象内联 `at` 键配置；命令式经 `open({ at })` 顶层覆盖）：

| 成员 | 默认值 | 说明 |
| --- | --- | --- |
| `selector` | 配置 `at` 时必填 | 定位锚（两栖）：`/` 全局选择器（`'/#btn'`）/ 无前缀选择器（消费者 scope 子树内查）/ `../` 父级爬升 / `^` closest / 元素引用——打开时现查，未命中 warn + 退屏幕居中 |
| `placement` | `"auto"` | `"auto"`：autoPlacement 按视口空间自动选位（默认）；或 12 个方向值（`top|bottom|left|right` × `''|-start|-end`）固定方向 |
| `offset` | 箭头开启时 `6` | 面板与锚点的间距（透传 floating-ui offset）；箭头开启且未配置时默认让位 6px——三角尖恰好点在锚元素边缘上 |
| `shift` | 无 | 视口内滑移 padding（透传 floating-ui shift） |
| `flip` | `true` | 视口翻转（当前方向放不下自动翻面）；`placement: 'auto'` 时不生效（与 autoPlacement 互斥） |
| `arrow` | `true` | 箭头：载体 + 双伪元素视觉（阴影层 + 融合覆盖层），`false` 关闭 |

::: info 关于指令配置体系
指令选项 / 修饰符 / 宿主选项见[指令配置](../config.md)。
:::

## 注意事项

- **宿主是纯声明点**：`x-dialog` 不自动绑定宿主点击——打开请显式 `@click="ui.flag = true"`；宿主可为任意元素，同元素可声明多个 `x-dialog` 消费不同组件（各自由不同状态驱动）。
- **每次打开新实例**：关闭动画播完即销毁（组件内部状态不跨开合保留——需要保活状态请放全局 state 或经 props 重注入）；多实例可并存。
- **表达式形态的重开边界**：关闭只收起 UI，状态仍是唯一驱动源——依赖变化后重求值为真（含多依赖下结果仍真）时会**再次弹出**；状态未变化（同值赋值）不触发重开。需要精确控制请监听 `overlay:close` 自行回写状态。
- **焦点陷阱与滚动锁定**尚未内置（fast-follow）——对话框打开期间页面滚动未被锁定，键盘 Tab 可移出对话框。
- **z-index**：层叠 = 容器内 DOM 追加顺序（后开在上）；需要显式层级时经容器 CSS 变量 `--autospark-overlay-z` 全局调整。
