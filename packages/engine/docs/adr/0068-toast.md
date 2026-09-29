# ADR-0068：全局轻提示（ToastManager 与 toast-shell）

- **状态**：Accepted（共识已 grilling 确认，实现未开始）
- **日期**：2026-09-29
- **关联**：[ADR-0061](0061-tooltip.md)（引擎级子系统先例——全关语义 / body 容器懒建 / slide 方向自适应覆写 / 命令式窄面）、[ADR-0062](0062-overlay-shell.md)（shell 机制——内置私有组件 / config 整包注入 / 面板是外壳产物 / 遮罩是引擎结构的分界先例）、[ADR-0052](0052-x-overlay-and-x-dialog.md)（body 容器先例 / 双通道事件）、[ADR-0038](0038-x-loading.md)（actions 按钮行——hide 键 / 字符串查表）、[ADR-0036](0036-action-manager.md)（内置 action / ActionDesc）、[ADR-0039](0039-animate-mechanism.md)（animate 三形态与六类名）、[ADR-0058](0058-icon-symbol-and-icon-domain.md)（图标域——同名词映射 / 缺图不破相 / 颜色主权在宿主）、[ADR-0053](0053-component-data-boundary.md)（数据基准——detached 实例化）、[CONTEXT.md](../../CONTEXT.md)（「轻提示（Toast）」词条）
- **共识来源**：grilling 三轮决策（Q1~Q21），本文即共识落盘

## 背景

需求：**轻量级全局提示**——在屏幕角落或中央短暂浮现一条消息，几秒后自动消失，不打断用户操作；命令式发起（`engine.toast(...)`）、集中管理（`toastManager`）、单项形态可整体替换（shell 机制）、并提供全局 `toast` action 使模板任意可执行 action 处都能发通知。

塑造设计的关键事实：

1. `TooltipManager`（ADR-0061）已确立「引擎级全局 UI 子系统」完整先例——全关语义 / 容器懒建 / slide 方向自适应覆写 / 双通道事件 / 命令式窄面，toast 与其同类（非树内、无 scope 响应式诉求、无遮罩语义）；
2. `engine.compiler.instantiateDetachedComponent(template, parentScope, def, props)`（compiler.ts）是现成的「编程式实例化私有组件 + props 注入」管道（overlay 家族消费中）——toast-shell 走真组件实例化后是**响应式活体**：原地更新 = 改 data 域 props，`x-html` / 属性绑定自动响应，零手写 DOM patch；
3. 内置图标注册表现成 `error` / `warn` / `info` / `yes`（√）/ `no`（×）——type→图标名同名词映射与关闭钮图标零成本（ADR-0058 缺图不破相兜底）；
4. x-loading actions 先例（ADR-0038）：字符串名数组 → 全局表查 `title`、`hide` 约定键（默认 true 点击收口）、合成 action 走 `buildAction` 广播；
5. 内置 `slide` 动画纵向固定（ADR-0039 决策 12）——方向匹配需覆写层（ADR-0061 决策 16 先例）；
6. happy-dom 无布局环境——**纯 CSS inset 定位**天然可测，floating-ui 定位难测（这也是 v1 砍元素锚定的实测论据之一）；
7. toast 内容（message HTML + 静态按钮行）无 store 响应式、无 dataContext、无遮罩、无打开栈——overlay 家族管线（`OverlayInstance`）对这些全是死重。

## 决策

### 一、形态与归属

#### 决策 1：引擎级子系统 ToastManager（非指令、非 overlay 消费者）

`src/toast/` 的 `ToastManager`，服务挂 engine 实例（`engine.toastManager`，ADR-0061 决策 1 同构）。toast 与 tooltip 同属「引擎级全局非树内 UI 子系统」；overlay 管线（dataContext / mask / 打开栈 / 组件投影）对 fire-and-forget 通知全是死重，`OverlayInstance` 必须持 `ComponentDef` 的内容组件模型亦与 toast 的「message 是 props 键」模型不合。

#### 决策 2：三层结构——单项组件化，分区列引擎结构

- **单项卡片 = 内置私有组件 `toast-shell`**：完整走 shell 机制（模板字符串 → `x-define` → `buildComponentDef` 模块级懒构建缓存），`instantiateDetachedComponent` 实例化（rootless 挂链）、ToastProps 整包作 props 注入（ADR-0062 决策四「config 整包初始快照」同构）。自定义 = 换结构骨架，查找协议「用户组件（全局表）→ 内置默认（未命中 warn 回退）」；
- **分区堆叠列 = 引擎结构**（同遮罩地位，ADR-0062「遮罩不归 shell」分界先例）：`autospark-toasts` 容器（每 engine 一个、body 下、首个 toast 懒建、destroy 整体移除）内每 pos 一列（`data-toast-pos` 标记、fixed inset 定位、flex 纵向栈），只留类名 + CSS 变量契约供样式定制，不组件化；
- **容器本身透明壳**（tooltip / overlay 容器同构），列容器承载定位。

#### 决策 3：复用边界

- **复用**：`instantiateDetachedComponent`（shell 实例化 + props 注入，rootless）；`resolveBuiltinShell` 同构的内置私有组件懒构建模式（toast 侧独立小注册表，放 `src/toast/`，不动 `overlay/wrappers`）；`registerShellStyles` 幂等注入模式；容器懒建 + destroy 清理模式；`engine.animate`（ADR-0039 指令无关服务）；`buildAction`（全局 toast action 广播）；`engine.actions` 全局表（actions 字符串解析——toast API 无 el 参数无法定位 scope 链，**只查全局表**，局部 scope action 不支持，文档标注）；`options.sanitizer`（message 消毒，x-html 同通道）；
- **不复用**：`OverlayInstance`（遮罩 / floating-ui 定位 / 打开栈全死重）、`autospark-overlays` 容器（组件实例领地）、floating-ui / `applyAnchorPosition`（屏幕锚定纯 CSS inset 定位，零 JS 测量）。

### 二、API 面

#### 决策 4：`engine.toast` 三态入参 + ToastTask 最小面

```ts
engine.toast(props: string | ToastProps | (() => Promise<ToastProps | void | undefined>)): ToastTask
```

- **字符串简写** ≡ `{ message }`；
- **async factory**：resolve `undefined` / `void` → 静默跳过不入队（条件通知：内容就绪才弹）；`toastTask` 同步返回，factory 挂起期间 `task.hide()` = 取消（resolve 后不显示）；
- **ToastTask 最小面**：`{ id: string, el: HTMLElement | null, hide(): void, closed: boolean }`——`el` 排队未显示时为 null（DOM 未挂）；`hide()` 幂等、走离场动画；不加 `promise` / `then()`（等待关闭完成无场景，YAGNI）。

#### 决策 5：toastManager 继承 Map——id 语义与原地更新

`engine.toastManager extends Map<string, ToastTask>`，键恒为 string id：

- **id 缺省自动生成**（自增），补齐后入 Map；
- **同 id = 原地更新**（antd / naive 先例）：显示中换 props（`x-html` / 绑定自动响应，红利见关键事实 2）+ **重置 delay 计时**（从满额重来）、**不重播**进场动画；排队中只换内容、位置不动，轮到显示以满额 delay 计时；type 变化经响应式 props 自动换色换图标零特判。原地更新是 id 机制的真实价值（上传进度类场景）——纯销毁重建则 id 无意义；
- **`clear(animated = true)`**：清全部（含等待队列），带离场动画；`get()` 即原生 `Map.get(id)`，不另造 API。

ToastProps 保留键封闭清单：`id` / `type` / `message` / `delay` / `pos` / `offset` / `actions` / `closable` / `animate` / `className`（未知键 warn + 忽略，ADR-0061 决策 8 同构）。

#### 决策 6：`options.toast` 三态与合并链（ADR-0061 决策 2 同构）

`AutoSparkOptions.toast: false | ToastOptions`：

- `false` = **整体不初始化**（不建容器、不注样式，`engine.toast()` / 全局 toast action **warn + no-op**，不给半开状态）；
- 配置对象 = 全局默认（`delay` / `showCount` / `pos` / `icons` / `shell` / `animate` / `offset` / `closable`…）；
- **合并链 `options.toast < 单次调用 props`**（浅合并，每键独立覆盖）；manager 配置构造期固化，不提供运行时改配置 API（fast-follow）。

### 三、定位与队列

#### 决策 7：纯屏幕锚定——pos 7 值，anchor 砍到 fast-follow

- v1 **砍掉元素锚定**（`anchor` 选择器）：「屏幕浮现」与「元素相对定位」是两套定位系统，后者要走 floating-ui + autoUpdate + 断连兜底全套成本，且「元素旁短暂提示」场景已有 tooltip（悬停）/ popover（点击）覆盖；`anchor` 入 fast-follow（届时走 `applyAnchorPosition` 共享装配）；
- **pos 7 值枚举**：`top-left` / `top-center` / `top-right`（默认）/ `bottom-left` / `bottom-center` / `bottom-right` / `center`（屏幕正中大提示）；命名 kebab 对齐 `data-overlay-placement` 词汇；非法值 warn + 回退默认；
- **`offset` = 分区列与屏幕边缘的间距**（number = px / string 透传 CSS），**仅列创建时生效**——列已存在时单次 `offset` 忽略（不迁移已建列），文档标注。

#### 决策 8：按 pos 分区 FIFO 队列

- **计数粒度按 pos 分区各计**：每列独立 FIFO 队列，上限 `showCount`（默认 5，`ToastManagerOptions` 承载于 `options.toast.showCount`）——右上排满不阻塞右下入队；满员排队、自动关闭后按序补位显示；
- **append 列尾**（先来在上、后来在下，antd message 先例）——新卡不把已有卡往下顶，视觉稳定；
- 离场后兄弟**直接回流不动画**（FLIP / margin 过渡 fast-follow，happy-dom 亦测不出）；
- `center` 与其他 pos **零特判**（同队列同上限，列垂直居中多卡堆叠）；「中央单例」语义用同 id 原地更新表达（文档标注）。

### 四、生命周期

#### 决策 9：delay / sticky / hover 暂停

- 默认 3000（`options.toast.delay` 全局 + 单次 `delay` 覆盖）；
- **`delay: 0` = sticky 不自动关闭**（antd 先例——「立即关」等于不该弹，0 表「永不」）；
- **hover 暂停 / 移出恢复**（剩余时间制）：toast 带 actions 按钮时用户需要时间移过去点，无暂停则按钮未点即消失；触摸设备无 hover，v1 不管（fast-follow）；
- sticky 永占分区坑位、极端下队列饿死：不设防，文档标注。

#### 决策 10：stop 不动、destroy 收口

`engine.stop()` **不动 toast**——toast 无锚、非树内，stop 语义是摘树暂停模板响应，全局提示生命周期独立（tooltip stop 隐藏是因锚在树内会断连，不适用）；`engine.destroy()` 收口：计时器 / 队列 / 容器整体移除。多引擎独立 manager / 容器 / 队列，跨引擎不去重不共享。

### 五、内容与模板（toast-shell）

#### 决策 11：内置模板结构——无出口协议 + props 预解析注入

```html
<div class="autospark-dialog autospark-toast" :data-toast-type="type">
  <x-icon :value="icon" …（type !== 'none' 时）/>
  <div class="autospark-toast-message" x-html="message"></div>
  <div class="autospark-toast-actions">…按钮行（x-for）…</div>
  <button class="autospark-toast-close" x-if="closable">×（内置 no 图标）</button>
</div>
```

- **双类名根**对齐 drawer-shell（继承 `autospark-dialog` 面板联动样式 + `autospark-toast` 形态层）；`data-toast-type` 挂根做语义分派；
- **无 slot 出口协议**：与 panel-shell 的本质差异——toast 没有内容组件投影概念（message 是 props 键不是组件），不走 live 投影、`x-slot` 协议整个不适用；自定义 shell 直接 `x-html="message"` 消费 props；
- **props 预解析注入**：引擎注入前解析派生键——`type`→`icon`（icons 映射，模板只认 `icon` 键）、`actions` 字符串名→查 `engine.actions` 全局表合成进已解析数组；shell（含自定义）拿到的即解析后形态；
- **`closable` 默认 `false`**：自动消失的轻提示不设手关钮（antd message 先例），显式开启出 ×（内置 `no` 图标现成）。

#### 决策 12：type 5 值 + 图标同名词映射

枚举 `none | info | success | warn | error`（`success` 补入——成功提示是最高频场景之一，注册表现成 `yes` 图标；`none` = 无图标无着色纯文本）。图标映射：默认**同名词**（`error→'error'`、`warn→'warn'`、`info→'info'`、`success→'yes'`），`options.toast.icons` 键重映射（如 `success: 'check-circle'`）；未注册图标名照传，x-icon 缺图不破相兜底（ADR-0058）。

#### 决策 13：语义色——图标 + 左侧 accent 条，双层 CSS 变量

着色面 = **图标着色 + 左侧 3px 语义条**（`border-left`）——toast 核心价值是「不点开就知道什么级别」，仅图标着色不够醒目。色值双层变量（单一消费点 `--autospark-toast-accent` + 用户换肤接口）：

```css
.autospark-toast                            { --autospark-toast-accent: var(--autospark-toast-info-color,    #409eff); }
.autospark-toast[data-toast-type="success"] { --autospark-toast-accent: var(--autospark-toast-success-color, #67c23a); }
.autospark-toast[data-toast-type="warn"]    { --autospark-toast-accent: var(--autospark-toast-warn-color,    #e6a23c); }
.autospark-toast[data-toast-type="error"]   { --autospark-toast-accent: var(--autospark-toast-error-color,   #f56c6c); }
/* none：无 accent、无语义条，纯中性 */
```

图标着色经 `color: var(--autospark-toast-accent)` 由 currentColor 流入 x-icon（ADR-0058 颜色主权在宿主）。

#### 决策 14：actions 双形态

- **字符串**（全局 action 名）：`actions: ['undo', 'close']` → 查 `engine.actions` 全局表解析 `title`（`ActionDesc.title ?? name`），x-loading 同构；
- **内联对象**（局部一次性按钮）：`actions: [{ title: '撤销', handle(){...} }]`——**不进全局表**（无名字注册语义），点击**直调 handle 不广播**（toast 局部按钮无人监听 `actions/*` 生命周期事件，KISS）；
- **`hide` 约定键对齐 x-loading（ADR-0038）**：默认 true（点击后关 toast），显式 false 保留（如「撤销失败，重试」续显）；
- 按钮行类名 `autospark-toast-actions`（视觉协议参考 x-loading 但独立类名）；
- 无参 / 空 message 调用 warn + no-op（不给白板 toast）。

### 六、全局 toast action

#### 决策 15：执行型内置 action

`BUILTIN_ACTIONS` 注册 `toast`（现有 4 个是信号型透传，toast 是**执行型**——handle 真实执行显示）：

- `handle(payload)`：payload = message 字符串 | props 对象 → 调 `engine.toast(payload)`（实现需 engine 引用，`registerBuiltinActions` 签名小改；handle 内经 `engine.toast` 惰性触达 manager，无初始化顺序问题）；
- **广播保留**：经 `buildAction` 包装（`actions/toast/*` 双通道照发）——一致性优先，无人监听也无害；
- 用户同名声明覆盖内置（「先扫用户先占」次序不变）；`title: "提示"`；
- `@click="toast('已保存')"`、`@click="toast({type:'error', message:'加载失败'})"`、x-loading 按钮 `actions:['toast']` 全走同一 handle；`options.toast: false` 时 warn + no-op（决策 6 全关语义）。

### 七、动画与事件

#### 决策 16：slide + 方向自适应覆写层（ADR-0061 决策 16 同构）

默认 `animate: 'slide'` 复用全局六类名；manager 注入 specificity 更高的覆写 CSS——按 **pos 前缀**分派换 from 值（`top-*` 从上方滑入、`bottom-*` 从下方、`*-left` 从左侧、`*-right` 从右侧、`center` 纵向），`leave-to` = `enter-from` 同值视觉对称；**duration 保持内置默认 300ms 不覆写**（toast 低频于 tooltip，无需 150ms 加速）；`animate` 键可全局 / 单次覆盖为 fade / 自定义 / false。显隐经 `engine.animate.enter/leave` 驱动。

#### 决策 17：双通道事件 `toast:show` / `toast:hide`

引擎总线 + toast 元素 dispatchEvent 双通道（卡片 DOM 在 body 下，树内物理收不到冒泡，ADR-0052 决策 13 同构约束）；payload `{ toast, el }`（`toast` = ToastTask、`el` = 卡片元素）。一切移除路径均广播 hide（自动关闭 / `hide()` / `clear()` / 原地更新替换 / destroy 收口）。

### 八、视觉与惯例

- 容器契约：`autospark-toasts`（类名 + `data-autospark-toasts` 属性双标记）、单项根 `autospark-toast`、按钮行 `autospark-toast-actions`、关闭钮 `autospark-toast-close`；
- z-index 变量 `--autospark-toast-z` 默认 **1100**（高于 overlay 的 1000——toast 要浮在对话框之上）；
- 术语 CONTEXT.md 词条「**轻提示（Toast）**」；Avoid：通知（notification 语义更重，指订阅推送）、消息框（模态 alert）、吐司、浮层（tip 已占用）；
- SSR `typeof document` 守卫（overlay / tooltip 先例）；样式幂等注入 head（`registerShellStyles` 同构）。

## 被否决的方案

- **overlay 家族新 kind（OverlayInstance 管线）**：toast 无遮罩无锚无 dataContext、message 是 props 键非内容组件——组件实例化 / 打开栈 / 数据基准管道全部虚置；
- **纯命令式 DOM 构建（tooltip 式 innerHTML 直注）**：「显示容器可整体替换」需求要求结构骨架可换，字符串模板不可组合；
- **anchor 元素锚定 v1**：两套定位系统成本（floating-ui + autoUpdate + 断连兜底），且元素旁提示已有 tooltip / popover；砍到 fast-follow；
- **showCount 满员视觉折叠（+N 徽标）**：折叠 UI 复杂度高，fast-follow；**挤掉最旧**：丢消息不可接受；
- **同 id 销毁重建**：视觉闪烁，且 id 机制失去存在意义——原地更新才是 id 的价值；
- **`delay: 0` = 立即关闭**：「立即关」等于不该弹；0 = sticky（antd 先例）；
- **仅图标着色**：角落图标不够醒目，图标 + 左侧语义条才是「不点开知级别」；
- **center 单例特判**：同构队列 + 文档标注「单例用同 id」即可，零分支；
- **slot 出口协议（live 投影）**：toast 无内容组件投影概念，message 是 props 键——出口协议整个不适用；
- **内联 action 走 buildAction 广播**：局部一次性按钮无人监听生命周期广播，直调即可；
- **stop() 隐藏 toast**：toast 无锚非树内，无断连问题；生命周期独立是语义而非疏漏；
- **floating-ui 屏幕定位**：纯 CSS inset 分区列即可，零 JS 测量且 happy-dom 天然可测；
- **每 pos 常驻 7 列**：列随 pos 首用时懒建（容器同），不预建；
- **运行时改 manager 配置**：构造期固化（YAGNI，fast-follow）；
- **ToastTask 带 promise / then()**：等待关闭完成无真实场景。

## 后果

- ✅ 模板任意处可发通知（全局 `toast` action）+ 命令式 API 双通道；条件通知（async factory）与进度更新（同 id 原地更新）原生支持。
- ✅ 复用面最大化：实例化管道 / shell 机制 / animate / 图标域 / actions 协议全部现成，零新依赖零新机制。
- ✅ 纯 CSS 屏幕定位在 happy-dom 无布局环境下天然可测（floating-ui 定位曾是 tooltip 测试的 `await nextTick()` 避坑点）。
- ⚠️ `options.toast: false` 全关是引擎表面新增开关（与 `tooltip: false` 同模式，认知一致）。
- ⚠️ sticky toast 永占分区坑位、offset 不迁移已建列、actions 不支持局部 scope action——三处边界均文档标注不设防。
- ⚠️ toast-shell 无出口协议是 shell 家族的形态分叉（panel 系有出口、toast 系无）——CONTEXT.md 词条与文档需明确此差异防误用。

## 测试

`src/__tests__/toast.test.ts`（fake timers 推进循 tooltip.test.ts 模式）：

- API 三态：字符串简写 / props / async factory（undefined 跳过、挂起期 hide 取消）；
- 队列：showCount 分区各计、FIFO 补位、append 列尾、clear 带动画、多 pos 互不阻塞；
- id：自动生成、同 id 原地更新（显示中重置计时 / 排队中换内容 / type 变化响应式换色换图标——props 注入红利直测）；
- delay：全局默认 / 单次覆盖 / `0` = sticky / hover 暂停恢复（剩余时间制）；
- pos：7 值枚举、非法值 warn 回退、`data-toast-pos` 列标记、offset 仅列创建时生效；
- type / icon：同名词映射、icons 重映射、缺图不破相、`none` 无图标无语义条；
- actions：字符串全局查表（含 title 回退）、内联对象直调、`hide` 默认 true 点击关、显式 false 续显；
- shell：内置默认结构（双类名根 / `data-toast-type` / `x-html` 消毒通道 / closable 关闭钮）、自定义 shell（全局注册 / 未命中 warn 回退）、ToastProps 整包注入、icon/actions 预解析注入；
- 事件：`toast:show` / `toast:hide` 双通道 payload、一切移除路径广播 hide；
- 动画：slide 六类名挂摘 + pos 前缀覆写方向断言（happy-dom 无真实 transition，循 tooltip 类名断言模式）；
- 全局 action：`engine.actions.toast` 执行显示（字符串 / props payload）、`actions/toast/*` 广播、用户同名覆盖、空 message warn + no-op、`options.toast: false` warn + no-op；
- 全关：不建容器不注样式；
- 生命周期：`stop()` 不动 toast、`destroy()` 收口（计时器 / 队列 / 容器整体移除）、多引擎独立。

## fast-follow 清单

1. `anchor` 元素锚定（走 `applyAnchorPosition` 共享装配 + autoUpdate）。
2. 满员折叠「+N」徽标展开。
3. 离场兄弟补位动画（FLIP）。
4. manager 运行时改配置（`configure(partial)`）。
5. a11y：`role="status"` / `aria-live` 动态关联。
6. 触屏场景 hover 暂停退化策略（长按？点击即暂停？）。

## 废止

- 无。全新特性，无既有词条受影响；CONTEXT.md 登记词条「轻提示（Toast）」与「轻提示外壳（toast-shell）」。
