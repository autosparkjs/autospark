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

点击按钮 → `ui.loginVisible` 为真 → 消费者沿 scope 链找到 `login` 组件、克隆编译、渲染进 body 容器——组件内表达式默认读**声明处**（`declarer` 基准）的数据。

## 指南

### 消费模型三要素

| 要素 | 载体 | 说明 |
| --- | --- | --- |
| **内容** | 任意组件 | `x-define` 声明（编译期剪枝缓存）/ `options.components` 全局注册 / `x-import` 加载——无专用声明语法 |
| **消费者** | 形态指令族 | `x-dialog`（模态，v1）等——决定外壳形态与打开驱动，见[消费者家族](#消费者家族) |
| **实例** | OverlayInstance | 打开渲染出的活体：独立 scope + watcher 子树，渲染进 body 下本 engine 的容器（`.autospark-overlays`） |

每次打开都是**新实例**——关闭动画播完即销毁（scope 级联回收 + DOM 摘除），多实例可并存、层叠 = DOM 追加顺序（后开在上）。

### 查找：scope 链就近 + 全局兜底

消费者按组件名沿 scope 链就近查找（内层同名组件遮蔽外层），到顶兜底 `options.components` 全局组件——与 `getComponent` 协议完全一致：

<demo html="overlay/global.html"/>

```html
<!-- 全局注册的组件：任何 scope 链上的消费者都能消费 -->
<div x-define="confirm">…</div>
<button x-dialog:confirm="ui.showConfirm"></button>
```

整条链（含全局）未命中：消费者 warn + 不渲染；组件正在被 `x-import` 加载时消费者会**等待就绪**（`component/registered` 后自动打开）。

### props 统一：非保留键全部注入组件 data 域

消费处值对象 / 命令式 options 中，**保留键封闭清单之外的全部键作 props** 注入组件 data 域（覆盖 `data` 默认）——与 `x-component` 传 props 的约定一致：

保留键封闭清单：`visible`（驱动键）+ `closeOnMask` / `animate` / `at` / `dataContext`（配置键）。组件 props 应避免使用这些名字（撞名风险由封闭清单文档化）。

### 数据视图基准（dataContext）：声明处默认、消费处可选

`dataContext` 配置（原 `scope` 已更名——避免与 `x-scope`/`AutoSparkScope` 撞名，与 `x-define-options.dataContext` / `x-component-options.dataContext` 同键同语义）统一为 [ADR-0053](/zh/guide/component/data#数据边界默认封闭与-open) 组件数据基准的家族语义，**挂链即基准**（表达式上下文 / 数据视图 / 生命周期级联三合一）：

| 基准 | 挂链 | 语义 |
| --- | --- | --- |
| `'declarer'`（默认） | 声明处 scope | 定义闭包——组件读它声明处所能见的域；免费获得悬空守卫 + 全局组件退化封闭 |
| `'host'` | 消费处 scope | 实例随消费者 scope 生死（消费者在 `x-if` 内被销毁时，打开中的实例自动关闭） |

**两栖键**（与 `at` 键的「字符串/元素」惯例同构）：声明式给**基准名**（`'declarer' | 'host'`）；命令式 `open()` 可给**基准载体**（HTMLElement——元素所属 scope 即挂链目标，并兼作 `at` 相对选择器的查询域）。缺省语义分消费面：声明式缺省 `'declarer'`；命令式缺省 rootless 全局视图。旧键 `scope` 与旧值 `'consumer'` 已随更名**硬切移除**（不再兜底——旧键 `scope` 现在是普通键，会作为 props 注入组件 data 域）。

### 公共机制契约

所有消费者共享同一套实例机制：

- **「请求关闭」**：ESC / 遮罩 / close 动作统一走 `requestClose`——消费者可注入写回（visible 简单路径回写 `false`，状态是唯一真相源），不可回写时仅收 UI；
- **事件双通道**：`overlay:open` / `overlay:close` 在实例根（DOM 冒泡）与引擎总线同时广播，payload 收窄为 `{ name, instance, dataContext }`（`dataContext` 为命令式传元素时的基准元素）；
- **打开栈**：document 级共享，ESC 只关全局栈顶实例——嵌套打开（确认框叠对话框）只关最上层，多 engine 并存不连环关；
- **at 锚定定位**：`{selector, placement, offset, shift, flip, arrow}`（字符串 / 元素简写 ≡ `{selector}`）经 floating-ui 贴锚定位（详见 [x-dialog 的 at](./directives/x-dialog.md#at-锚定定位)）;
- **进出场动画**：复用 ADR-0039 animate 机制，默认 `fade`，「播完动画再动 DOM」。

### 消费者家族

| 消费者 | 形态 | 状态 |
| --- | --- | --- |
| `x-dialog` | **模态**：遮罩 + 居中面板 + `closeOnMask` | ✅ v1 |
| `x-drawer` | 侧滑抽屉 | fast-follow |
| `x-popup` | 锚定浮层（无遮罩） | fast-follow |
| `x-popover` | 轻气泡 | fast-follow |

家族成员是同一基座（`OverlayDirective`）上的**薄子类**——只叠加形态差异（外壳、定位、关闭行为），查找 / props / 配置链 / 数据基准 / 事件全部继承。

## 命令式 API

`engine.getOverlay(el, name, options?)` 镜像 `getComponent` 协议：`el` 起 scope 链查找（就近覆盖）+ 全局兜底，**省略 `el` 仅查全局**：

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
- **单例未引入**：每次 open 新实例、关闭即销毁；「多消费点驱动同一覆盖物」的场景（关闭只回写触发者）请保持单驱动点，或在 `overlay:close` 中自行善后。
