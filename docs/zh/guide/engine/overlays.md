# 覆盖物（Overlays）

## 概述

**覆盖物**是「**任意组件被渲染到 `document.body` 容器的消费方式**」——它不是一种独立的模板声明，而是组件的一种**消费形态**：内容就是普通组件（`x-define` 声明 / `options.components` 全局注册 / `x-import` 远程加载），由消费者指令状态驱动地实例化渲染到 body 下的覆盖物容器中。

```html
<!-- 内容：一个普通组件（完整组件能力：script setup / scoped CSS / hooks） -->
<div x-define="login">
    <h3>{{title}}</h3>
    <button @click="close()">关闭</button>
</div>

<!-- 消费：x-dialog 模态形态，状态驱动 -->
<button x-dialog:login="ui.loginVisible" @click="ui.loginVisible = true">登录</button>
```

同一套组件，被 [x-component](./component/instantiate.md) 消费是**原地化身**（宿主元素变成组件根），被覆盖物消费者消费就是**渲染到 body 容器**——弹层类 UI（对话框 / 抽屉 / 气泡）因此获得独立于文档流的层叠上下文，且声明处无闪现（`x-define` 声明在编译期剪枝，与组件语义一致）。

## 快速入门

<demo html="overlay/declare.html"/>

点击按钮 → `ui.loginVisible` 为真 → 消费者沿 scope 链找到 `login` 组件、编译内容宿主、渲染进 body 容器——组件内表达式默认读**消费处**（缺省基准挂消费者 scope）的数据。

## 指南

### 消费模型三要素

| 要素 | 载体 | 说明 |
| --- | --- | --- |
| **内容** | 任意组件 | `x-define` 声明（编译期剪枝缓存）/ `options.components` 全局注册 / `x-import` 加载——无专用声明语法 |
| **消费者** | 形态指令族 | `x-dialog`（模态，v1）等——决定外壳形态与打开驱动，见[消费者家族](#消费者家族) |
| **实例** | OverlayInstance | 打开渲染出的活体：独立 scope + watcher 子树，渲染进 body 下本 engine 的容器（`.autospark-overlays`） |

每次打开都是**新实例**——关闭动画播完即销毁（scope 级联回收 + DOM 摘除），多实例可并存、层叠 = DOM 追加顺序（后开在上）。

### 查找：scope 链就近 + 全局兜底

消费者按组件名沿 scope 链就近查找（内层同名组件遮蔽外层），到顶兜底 `options.components` 全局组件——与 `getComponentDeclaration` 协议完全一致：

<demo html="overlay/global.html"/>

```html
<!-- 全局注册的组件：任何 scope 链上的消费者都能消费 -->
<div x-define="confirm">…</div>
<button x-dialog:confirm="ui.showConfirm"></button>
```

整条链（含全局）未命中：消费者 warn + 面板先开呈现加载占位——组件注册（`components/<名>/registered`）后自动挂载，等待期间 visible 归假则放弃打开。

### props 统一：非保留键全部注入组件 data 域

消费处值对象 / 命令式 options 中，**保留键封闭清单之外的全部键作 props** 注入组件 data 域（覆盖 `data` 默认）——与 `x-component` 传 props 的约定一致：

保留键封闭清单：`visible`（驱动键）+ `closeOnMask` / `animate` / `at` / `dataContext`（配置键）。组件 props 应避免使用这些名字（撞名风险由封闭清单文档化）。

### 数据视图基准（dataContext）：消费处默认、声明处可选

`dataContext` 配置（原 `scope` 已更名——避免与 `x-scope`/`AutoSparkScope` 撞名，与 `x-define-options.dataContext` / `x-component-options.dataContext` 同键同语义）统一为 [ADR-0053](/zh/guide/component/data#数据边界默认封闭与-open) 组件数据基准的家族语义，**挂链即基准**（表达式上下文 / 数据视图 / 生命周期级联三合一）：

| 基准 | 挂链 | 语义 |
| --- | --- | --- |
| 缺省（未声明） | 消费处 scope | 声明式 = 消费者指令宿主 scope（模板读消费处数据，实例随消费者 scope 生死，ADR-0123）；命令式 = rootless 全局视图（仅全局 state） |
| `'declarer'` | 声明处 scope | 定义闭包——组件读它声明处所能见的域；免费获得悬空守卫 + 全局组件退化封闭 |
| `'host'` | 消费处 scope | 显式声明消费处基准（声明式与缺省同域；命令式挂 `getOverlay` 锚点 scope） |

**两栖键**（与 `at` 键的「字符串/元素」惯例同构）：声明式给**基准名**（`'declarer' | 'host'`）；命令式 `open()` 可给**基准载体**（HTMLElement——元素所属 scope 即挂链目标，并兼作 `at` 相对选择器的查询域）。缺省语义：**声明式收敛消费处 scope**（ADR-0123 决策 2——内容宿主以消费处 scope 为编译父，等价旧基准挂链的开放语义）；**命令式缺省 rootless 全局视图**。旧键 `scope` 与旧值 `'consumer'` 已随更名**硬切移除**（不再兜底——旧键 `scope` 现在是普通键，会作为 props 注入组件 data 域）。

### 公共机制契约

所有消费者共享同一套实例机制：

- **「请求关闭」**：ESC / 遮罩 / close 动作统一走 `requestClose`——消费者可注入写回（visible 简单路径回写 `false`，状态是唯一真相源），不可回写时仅收 UI；
- **事件双通道**：`overlay:open` / `overlay:close` 在实例根（DOM 冒泡）与引擎总线同时广播，payload 收窄为 `{ name, instance, dataContext }`（`dataContext` 为命令式传元素时的基准元素）；
- **打开栈**：document 级共享，ESC 只关全局栈顶实例——嵌套打开（确认框叠对话框）只关最上层，多 engine 并存不连环关；
- **at 锚定定位**：`{selector, placement, offset, shift, flip, arrow}`（字符串 / 元素简写 ≡ `{selector}`）经 floating-ui 贴锚定位，`shift` 默认启用（面板溢出视口时自动滑回视口，`at.shift: false` 关闭、对象透传调参；详见 [x-dialog 的 at](./directives/x-dialog.md#弹出定位)）；锚定生效时可开 `fit: true` 让面板单轴尺寸与宿主一致（左右弹出取高、上下弹出取宽，跟随翻转后的最终方向，ADR-0099，消费面见 [x-popover · 尺寸跟随宿主（fit）](./directives/x-popover.md#尺寸跟随宿主fit)）；
- **进出场动画**：复用 ADR-0039 animate 机制，默认 `fade`，「播完动画再动 DOM」；
- **保活 / 缓存身份 / 远程加载**（ADR-0119，家族通用）：`keepalive` 关闭不销毁、容器内挂起保活（重开复用实例，声明式专属）；`key` 为保活缓存命名空间（缓存身份 = `组件名 + key + url` 复合，同键复用、异键并存）；`url` 在组件未注册时打开走远程加载（骨架面板先开、内容出口内呈现 loading，组件优先 / 片段兜底双路径，失败呈现错误占位可重试）——消费面详见 [x-dialog · 保活](./directives/x-dialog.md#保活keepalive) / [多实例与 key](./directives/x-dialog.md#多实例与-key) / [远程加载](./directives/x-dialog.md#远程加载url)。

### 面板外壳（shell）：形态可定制

面板层形态（边框 / 圆角 / 背景 / 箭头 / 内容布局）由一个可替换的**外壳组件（shell）**渲染——内置默认（`dialog-shell` / `popover-shell`）开箱即用；与你的 UI 环境不匹配时，声明一个带 `x-slot` 默认出口的组件整体替换即可，**内容组件与全部消费行为不变**：

<demo html="overlay/shell.html"/>

```html
<!-- 自定义外壳：x-slot 默认出口 = 内容组件渲染点 -->
<div x-define="fancy-shell" class="fancy-shell" :data-theme="theme">
    <header class="bar"></header>
    <div class="body"><div x-slot></div></div>
</div>

<!-- 消费处指定（配置整包注入 shell 数据域，theme 等自由键 shell 模板可直接消费） -->
<button x-dialog:login="show" x-dialog-options="{shell: 'fancy-shell', theme: 'teal'}">登录</button>
```

分工契约：

| 职责 | 归属 | 说明 |
| --- | --- | --- |
| **遮罩** | 引擎结构 | `mask` 控制显隐（x-dialog 恒模态、x-popover 恒无）——**shell 不含遮罩**，换 shell 不影响模态行为 |
| **面板形态** | shell 组件 | 结构 + 样式自由发挥；`x-slot` 默认出口承接内容组件（未声明 → warn + 内容直挂面板根） |
| **行为** | 引擎 | 定位 / 动画 / ESC / 事件广播 / 打开栈全在实例根，与 shell 无关 |
| **箭头** | shell 渲染、引擎定位 | 模板放 `.autospark-overlay-arrow` 载体元素（`at.arrow !== false` 且锚定命中时引擎定位它；不放则无箭头） |

配置链：`x-{name}-options.shell`（成员表达式，**打开时求值一次**，不热更新）> 宿主 `x-options` > 引擎级默认 `options.overlay.{dialog|popover}.shell` > 内置默认。shell 组件与内容组件同一查找协议（scope 链 `x-define` / `options.components` 全局 / `x-import` 均可）；显式名未命中 → warn + 回退内置默认。内置名不占用用户命名空间（同名组件互不干扰）。

```javascript
// 全站换肤：一处配置，所有 x-dialog 换用自家外壳
new AutoSpark(el, state, { overlay: { dialog: { shell: "my-dialog" } } });
```

内置默认面板的家族通用视觉（圆角 / 边框 / 阴影 / 层级 / 箭头定位）挂引擎契约选择器（`[data-overlay]` 属性 + `.autospark-overlay-arrow` 载体类 + `data-overlay-border` / `data-overlay-placement` 标记）与 CSS 变量（`--autospark-overlay-z / -bg / -border / -radius`）——形态中立；形态类名（`.autospark-dialog` / `.autospark-popover` / `.autospark-drawer`）只承载形态特异（ADR-0062 修订）。自定义外壳保留 `data-overlay` 契约属性即继承默认视觉（可覆盖），完全自写则完全自由。

::: warning 迁移（ADR-0062 修订）
泛化旧义 `.autospark-dialog` 基类已退役（该类回归 dialog 形态专属）：popover / drawer / notification 面板不再携带该类。按 `.autospark-dialog` 定制过这些面板 CSS 的代码请改用形态类（如 `.autospark-popover`）或 `[data-overlay]` 属性选择器。
:::

### 结构骨架（autospark.overlay）：通用 header / body / footer

三个内置 shell 内嵌了一个通用**结构骨架组件** `autospark.overlay`（ADR-0124，内置非面向开发者组件——开发者经覆盖物配置间接使用），为覆盖物家族提供统一的标题栏 / 内容区 / 底部动作区：

```
┌──────────────────────────────────────┐
│ [icon] title        actions.top  [×] │  ← header（有内容才渲染）
├──────────────────────────────────────┤
│   body（内容出口 + padding）          │  ← 恒渲染
├──────────────────────────────────────┤
│ actions.left          actions.right  │  ← footer（有内容才渲染）
└──────────────────────────────────────┘
```

<demo html="overlay/skeleton.html"/>

五个骨架配置键（走 `x-{name}-options` 配置通道，打开时现读、重开生效）：

| 配置键 | 默认 | 说明 |
| --- | --- | --- |
| `title` | 无 | 标题文本 |
| `icon` | 无 | 标题左侧图标名（x-icon 域） |
| `closeable` | `true` | header 右侧显示 close 图标按钮，点击走全局 close 信号动作（请求关闭链） |
| `actions` | 无 | 动作集（`{id, title, icon, tooltip, handle, pos, order}` 数组），按 `pos` 归位：`top` → 顶区、`left` → 左区、`right` / `auto` / `bottom` / 无 pos → 右区，`order` 升序稳定排序 |
| `padding` | `'0.5em'` | body 区内边距（number 按 px） |

条件渲染：header / footer **有内容才渲染**（`closeable: false` 且标题、图标、动作区全空时 header 消失）；body 恒渲染。视觉定制走 CSS 变量（`--autospark-overlay-*` 家族）。

**骨架插槽重载**：内置 shell 声明了插槽通配转发（`slots: "*"`，ADR-0125）——消费者在**宿主子级**用 `x-slot:名` 标记即可直接重载骨架的 chrome 出口：`title`（替换标题文本区）、`header` / `footer`（**整块替换**，`header` 让位时 close 按钮一并失效）、`actions.top` / `actions.left` / `actions.right`（点分名；裸 `actions` 等价 `actions.right`）。内容组件 `def.slots` **声明过的名字归内容组件**（今日插槽语义 100% 不变），未声明的 chrome 名才进骨架；`default` / `body` 永不转发（body 是内容直通位）：

```html
<div x-define="confirm">
  <p>要删除这份草稿吗？</p>
  <button @click="close()">取消</button>
</div>

<!-- 消费者：标题 + 底部动作区经宿主子级标记直达骨架 -->
<button
  x-dialog:confirm="ui.open"
  x-dialog-options="{title: '删除确认', closeable: false}"
  @click="ui.open = true"
>
  <template x-slot:actions.right>
    <button @click="close()">取消</button>
    <button class="danger" @click="doDelete()">删除</button>
  </template>
  删除…
</button>
```

自定义 shell（`options.shell`）整体替换后自动退出骨架（自行决定是否内嵌 `autospark.overlay`）；内嵌了骨架的自定义 shell 同样可经 `x-component-options.slots` 声明转发承接消费者重载。

#### 骨架动作双通道（handle 与消费处 scope）

除配置式（`x-{name}-options.actions`）外，骨架动作还有第二声明通道——**消费处 scope 的 actions 表**（`<script type="autospark/actions">` 局部注册 / `options.actions` 全局注册，显式声明 `pos` ∈ {top, left, right} 即准入——无 pos 的页面级 action 不上屏）。两通道打开时合并为单一动作集：同 id 后进覆盖先进（配置式在后），scope 链上近层覆盖远层。

### 消费者家族

| 消费者 | 形态 | 状态 |
| --- | --- | --- |
| `x-dialog` | **模态**：遮罩 + 居中面板 + `closeOnMask` | ✅ v1 |
| `x-popover` | **悬浮**：宿主 mouseenter 触发的贴附浮层 | ✅ 已落地，见 [x-popover](./directives/x-popover.md) |
| `x-drawer` | **贴边抽屉** | ✅ 已落地，见 [x-drawer](./directives/x-drawer.md) |
| `x-popup` | 锚定浮层（无遮罩） | fast-follow |

家族成员是同一基座（`OverlayDirective`）上的**薄子类**——只叠加形态差异（外壳、定位、关闭行为），查找 / props / 配置链 / 数据基准 / 事件全部继承。

## 命令式 API

`engine.getOverlay(el, name, options?)` 镜像 `getComponentDeclaration` 协议：`el` 起 scope 链查找（就近覆盖）+ 全局兜底，**省略 `el` 仅查全局**：

```javascript
const handle = engine.getOverlay(document.getElementById("app"), "confirm", { animate: false });
const inst = handle.open({
    taskId: "T-1",          // 非保留键 → props 注入组件 data 域
    dataContext: someEl,    // 保留键：两栖基准——传元素（载体）挂其所属 scope；缺省 = rootless 全局视图
    animate: "slide",       // 保留键：最顶层配置
});
inst.close();   // 精确关这一个实例
handle.close(); // 关该覆盖物当前全部打开实例
```

命令式实例与声明式实例**同权**：同一容器、同一事件双通道、同一配置链、同一打开栈。

## 注意事项

- **渲染位置在 body 下**：实例**不在 engine 宿主树内**——engine 树内模板元素的 DOM 事件监听收不到覆盖物内部冒泡的事件，跨层通信用引擎事件总线（`engine.on("overlay:close")`）。
- **组件即内容**：无独立声明指令（旧 `x-overlay` 声明语法已删）——要弹什么，就声明什么组件；`x-overlay` / `.global` 修饰符 / `x-overlay-options` / `params` 键 / `type` 字段均为已废弃旧模型。
- **配置三级链**：`内置默认 < x-dialog-options（消费处） < 值对象内联保留键`——组件 def 不携带配置，配置只走消费处。
- **单例未引入**：每次 open 新实例、关闭即销毁（`keepalive` 声明可挂起保活、`key` 可多实例并存——见[公共机制契约](#公共机制契约)）；「多消费点驱动同一覆盖物」的场景（关闭只回写触发者）请保持单驱动点，或在 `overlay:close` 中自行善后。
