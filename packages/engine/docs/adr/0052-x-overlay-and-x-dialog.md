# ADR-0052：x-overlay 覆盖层体系与 x-dialog 消费者

- **状态**：Accepted（grilling 五轮 30 决策点共识落盘，**待实施**；v1 范围 = x-overlay 声明侧 + x-dialog 消费者 + 命令式 API + anchor 定位体系）
- **日期**：2026-09-22
- **关联**：[CONTEXT.md](../../CONTEXT.md)（「覆盖层」章节词条）、[ADR-0001](0001-directive-kind-system.md)（指令类别）、[ADR-0002](0002-dynamic-patch.md)（patch 冲突防护）、[ADR-0007](0007-directive-options-and-modifiers.md)（指令选项——本 ADR 划定其「回退不合并」的适用边界）、[ADR-0022](0022-x-component.md)（x-component——剪枝/查找/实例化的同构来源）、[ADR-0032](0032-data-script.md)（deepMerge 语义复用）、[ADR-0036](0036-action-descriptor-metadata.md)（内置 close 动作——信号对接）、[ADR-0039](0039-animate-mechanism.md)（animate——进出场复用）

## 背景

需求：引入 x-overlay 覆盖层体系——模板中声明「覆盖物模板」（dialog / drawer / popup / popover 四类弹层），由消费者指令状态驱动地实例化渲染到 `document.body`：

```html
<!-- 声明：编译期剪枝缓存，不进结果 DOM（无闪现） -->
<div x-overlay:login="dialog">
    <h3>{{title}}</h3>
    <button @click="close()">关闭</button>
</div>

<!-- 消费：状态驱动，v1 仅 x-dialog -->
<button x-dialog:login="ui.loginVisible" @click="ui.loginVisible = true">登录</button>
```

grilling 前置探索确认的三个关键事实，直接塑造了本设计：

1. **observer 通道绑定 `engine.el`**（`dispatcher.ts` 单一 MutationObserver）：渲染产物落到 `document.body` 后，overlay 子树内 Runtime 指令（x-loading 等）的 mounted/unmounted/attrChanged 全部失明；而 scope.watch / x-on 等 Compile 通道是纯 JS 订阅、与 DOM 位置无关，不受影响。→ 必须给 dispatcher 增加「额外观察根」机制（决策 14）。
2. **x-teleport 是空壳**（类未注册、`render(){}`）：「渲染到 body」无现成机制可复用，本 ADR 是首创（对齐「引擎全局资源」的既有模式：document 级共享 + 幂等注入）。
3. **术语已预留**：x-loading 旧称「加载覆盖层」更名时，「覆盖层」词汇整体让渡本家族（CONTEXT.md 已废弃词条）；本 ADR 正式启用「覆盖层定义 / 覆盖层实例 / 覆盖层消费者」词条。

消费者管道有完整范本：x-loading 的 `getComponent → cloneNode → compileChild(clone, parentScope, …, initialData) → teardown 对称回收`，几乎就是覆盖层消费的形态。

## 决策

### 一、命名与语法

#### 决策 1：名称走冒号 attr，句点保留给修饰符

覆盖层名称是「指令作用于哪个具体目标」，与 `x-on:click` 的 click、`x-bind:title` 的 title 同构——**走 attr 冒号语法**：`x-overlay:login="dialog"`、`x-dialog:login="ui.flag"`。`.global` 等修饰符照常并存：`x-overlay:login.global="dialog"`。

否决句点命名（`x-overlay.login`）：`getDirectives` 解析期把 `.` 段注入为指令选项（`options.login = true`），与 `.global` 修饰符**无法区分**——解析器没有任何办法知道哪个句点段是名称、哪个是修饰符；且同元素多消费者（`x-dialog:login` / `x-dialog:register`）依赖「同 name 不同 attr 的多实例」语义，attr 天然成立。

#### 决策 2：术语——覆盖层定义 / 覆盖层实例 / 覆盖层消费者

- **覆盖层定义（Overlay Definition）**：`x-overlay:<名称>` 声明的弹层模板资源（声明侧）。
- **覆盖层实例（Overlay Instance）**：消费者打开定义渲染出的活体（消费产物）。
- **覆盖层消费者（Overlay Consumer）**：实例化定义并驱动其生命周期的指令族（x-dialog / x-drawer / x-popup / x-popover）。

#### 决策 3：声明值是类型认领标记，无值 = 通用

`x-overlay:login="dialog"` 的值 `dialog | drawer | popup | popover` 是**类型认领**标记：各消费者指令认领自己的类型（v1 仅 `dialog` 有效），消费者消费类型不匹配的定义时 **warn 但仍渲染**（类型是文档契约，不是运行时门槛）；允许任意自定义字符串（对齐「跨指令供体协议」的开放-封闭）；**无值 = 通用**，任何消费者可消费。

同名定义归属同一 scope 时 **warn + 后者覆盖**（对齐 ADR-0022 决策四-4 的 default 唯一性放宽）。

### 二、配置体系

#### 决策 4：四级优先级 + 相邻层深度合并（对 ADR-0007 边界的修订）

覆盖层生效配置按四级优先级**深度合并**（复用 ADR-0032 数据脚本的 `deepMerge` 语义：数组替换、undefined 不覆盖、函数整体覆盖）：

```
内置默认 < x-overlay-options（声明处） < x-dialog-options（消费处） < 值对象内联配置键（决策 6 的 visible/params 之外的键）
```

**与 ADR-0007 的关系**：ADR-0007 否决合并、确立「回退不合并」，其适用边界是**同元素两层**（指令选项 → 宿主选项）——零合并开销、可预测。覆盖层是**跨位置两层**（声明处默认 vs 消费处覆盖），消费处只想改 `title` 不该被迫重复全部配置——场景本质不同，故此场景采用合并、不推翻 ADR-0007 的同元素回退纪律。两者并存：同元素内仍回退，跨位置（定义→消费）才合并。

### 三、声明侧（x-overlay）

#### 决策 5：编译期剪枝缓存 + scope 链存储 + engine 全局兜底

- x-overlay 是**编译期树变换标记**（非渲染指令，对齐 x-component）：compiler 前置 transformer 拦截，深克隆冻结快照，**返回 null 剪枝**（不进结果 DOM、不建 scope、不被实例化——声明处无闪现）。声明元素上同元素的其他指令随快照整体冻结，待消费时才编译执行。
- 快照存储：挂**最近祖先 scope** 的覆盖层容器（`scope.overlays[name]`，与 `scope.components` 语义分离：组件 ≠ 覆盖层）；`.global` 修饰符 → 挂 **engine 级**全局覆盖层表（对齐 `engine.options.components` 全局组件先例）。
- **查找**：消费者沿 scope 链就近（同级 → 祖先链）→ engine 全局表兜底——与 `getComponent` 同构。未命中 **warn + 不渲染**（覆盖层无默认 UI 可回退）。
- 声明在 x-for 内：挂 item scope、随 item 生死（对齐组件归属语义）；声明在 x-slot 内：static 模式被剥除、remote 模式归 child engine（既有边界自然延伸，无需特殊处理）。
- 模板具**完整组件能力**：`<script setup>` / `<style>`（scoped CSS）随消费实例化生效（复用 `compileChild` 管道的既有语义）。

### 四、消费侧（x-dialog）

#### 决策 6：visible 三形态 + 值对象保留键

`x-dialog:<名称>` 的值三形态：

| 形态 | 例 | 打开驱动 | 请求关闭行为 |
|---|---|---|---|
| 简单路径 | `x-dialog:login="ui.flag"` | watch | **回写 `false`** |
| 表达式 | `x-dialog:login="a && b"` | watch | 仅 UI 关闭 + `overlay:close` 广播（无路径可回写） |
| 字面量 | `x-dialog:login="true"` | 挂载即开（公告类对话框） | 仅 UI 关闭 |

对象形态 `x-dialog:login="{visible: 'ui.flag', params: {...}, closeOnMask: false}"`：`visible` / `params` 为**保留键**，`visible` 值为**字符串状态路径**（相对消费处 scope，可回写）；**其余键并入配置合并链最顶层**（决策 4）——值对象是 per-实例通道，承载差异化配置零新增机制（同元素多 x-dialog 各自独立配置成立）。

#### 决策 7：「请求关闭」统一语义

关闭动作（ESC / 点遮罩 / close action）恒可用，语义是「**请求**关闭」：可回写（简单路径）→ 回写 `false`（状态是唯一真相源）；不可回写（表达式/字面量）→ 仅 UI 关闭 + `overlay:close` 广播，由用户善后。**已知边界**（文档明示）：表达式形态 UI 关闭后状态仍真值、watcher 值未变不会自动重开；但后续依赖变化重求值仍为真时会**重开**——需要精确控制关闭善后的场景监听 `overlay:close` 自行回写。

与内置 close 动作（ADR-0036 决策 7）对接：overlay 子树内 `close()` 触发的 `action:close` 由 x-dialog **在实例根上委托监听**（overlay DOM 在 body 下，engine 树内祖先收不到冒泡——必须实例根委托，见决策 13）。

#### 决策 8：纯状态驱动，无隐式点击

宿主元素是**纯声明点**（挂 visible 绑定的地方），不自动绑定 click——打开靠用户显式 `@click="ui.flag = true"`。与 x-loading 的 value 语义一致；宿主可为任意元素；「同元素多 x-dialog」本身就是宿主非触发器的证明。

#### 决策 9：params 打开时快照注入

- **时机**：打开时快照（YAGNI，响应式 params 为 fast-follow）；单例复用时**重注入**（`Object.assign` 实例数据域）。
- **形态**：对象字面量（静态）或字符串表达式（打开时对消费处 scope 求值取结果）。
- **注入域**：实例数据域**顶层**，模板内直接读键（`{{userId}}`，对齐 x-use props 注入 data 域心智）；params **覆盖同名**（含模板 `x-data` 声明——params 是消费意图，优先级最高）。

#### 决策 10：singleton 二态

| | singleton: true（默认） | singleton: false |
|---|---|---|
| 实例化 | 首次打开**懒实例化** | 每次打开全新实例 |
| 关闭 | **隐藏保活**（leave 动画后 `display:none`，DOM+scope+watcher 存活） | **销毁**（动画后摘除，scope 级联回收） |
| 复用 | 再开复用 + 重注入 params | 多实例**可并存**（同一定义同时开两个） |

层叠顺序 = DOM 追加顺序（后开在上），v1 不做 z-index 管理。

#### 决策 11：scope 基准三合一（表达式上下文 = 挂链 = 生命周期）

`scope: 'consumer' | 'declarer'`（默认 `'declarer'`，声明处/消费处均可声明、消费处优先）统一决定三件事：

- **表达式上下文**：覆盖层实例的 scope.parent 挂消费处 scope（consumer）或声明处 scope（declarer）；
- **生命周期挂链**：挂链 scope 死亡 → 实例 scope 级联销毁 → 打开中的 overlay 动画后关闭摘除（单例实例销毁，下次打开重建、状态重置）。

推导：`declarer`（默认）单例实例随声明处 scope 生死（声明处通常在页面顶层 ≈ 近永续，最符合 singleton 直觉）；`consumer` → 实例随消费者 scope 生死（消费者在 x-if 内被销毁时，开着的 overlay 自动关闭）。

#### 决策 12：v1 行为清单与外壳

x-dialog v1 内置（全部有现成机制对接）：

1. **内置外壳**：遮罩层 + 居中 panel（类名契约 `autospark-dialog-mask` / `autospark-dialog`，样式幂等注入 head，用户 CSS 可覆盖）；overlay 模板渲染进 panel，模板根打 `data-overlay="<名称>"` 属性供用户样式定位。
2. ESC 关闭。
3. 点击遮罩关闭（`closeOnMask` 配置，默认 true）。
4. `action:close` 监听（实例根委托，决策 7）。
5. 进出场动画：复用 ADR-0039 animate 机制，默认 `fade`，`animate: false` 可关；`animate.leave(el, phase, onDone)` 的 onDone 承载真正的摘除/隐藏（「播完动画再动 DOM」的既有标准写法）。

fast-follow：外壳组件覆盖（`getComponent('dialog')` 兜底内置模板，对齐 x-loading DEFAULT_BLOCK 机制）、焦点陷阱（focus trap）、body 滚动锁定、`.trigger` 点击触发修饰符。

### 五、容器与事件

#### 决策 13：每 engine 一个容器 + 事件双通道

- **容器**：`<div class="autospark-overlays" data-autospark-overlays>` 挂 `document.body`，**每 engine 一个**（引擎对 overlay 实例的 scope/watch 全责，容器随 engine 归属），首个 overlay 打开时**懒创建**，`engine.destroy()` 时整体移除。容器本身**透明壳**（无定位样式——dialog 实例自带 fixed 遮罩，未来 popup/popover 的锚定定位不受容器布局约束）；singleton 关闭的隐藏实例留存其中。SSR `typeof document` 守卫（icons 先例）。
- **事件双通道**：`overlay:open` / `overlay:close`（`detail: { name, type }`）——① 实例根 `dispatchEvent`（DOM 冒泡，body 链内可达，`document.addEventListener` 可监听）；② 引擎事件总线 `broadcast`（对齐 x-slot `task/slot/*` 先例，模板外 JS 可订阅）。**注意**：overlay 实例 DOM 不在 engine 宿主树内，DOM 冒泡**物理上到不了** engine 树内的模板元素——模板内 `@overlay:close` 收不到，文档必须明示监听方式。

### 六、必要的技术改动

#### 决策 14：dispatcher 增加「额外观察根」注册

`RuntimeObserverDispatcher` 现仅观察 `engine.el`。新增**额外观察根**机制（与 x-slot 的 `slotRoots` 盲区对称：盲区把子树**排除**出观察，观察根把外部子树**纳入**观察）：覆盖层实例挂载时把实例根（或容器）注册进观察范围，销毁时注销——否则 overlay 子树内的 Runtime 指令（x-loading 等）三钩子全部失明。这是本 ADR 的必要改动点，不是可选优化。

### 七、命令式 API

#### 决策 15：双层句柄模型 + 纯全局查找

```ts
// ① 定义句柄（覆盖层定义的编程视角）
const overlay = engine.getOverlay('login', { type: 'dialog', /* …配置键 */ });

// ② 打开 → 实例句柄
const inst = overlay.open({ params: { userId: 42 } /* , …配置键 */ });
inst.close();      // 精确关这一个实例

// ③ 定义句柄便捷方法
overlay.close();   // 关该定义当前「全部」打开实例（可预测）
```

- `engine.getOverlay(name, options?)` → **定义句柄**（OverlayHandle）：`open(options?)` / `close()`（关全部）。
- `open()` → **实例句柄**（OverlayInstance）：`close()` / `el` / `name` / `scope`。
- **纯全局查找**：getOverlay 只查 engine 级覆盖层表——只有 `.global` 声明的定义命令式可达（文档明示「命令式 = 全局消费」，与 `.global` 修饰符天然配套）；局部定义的命令式消费 fast-follow（`scope.getOverlay(name)`，action 内 `this.scope` 可达）。
- 非单例多实例并存时只有实例句柄能精确关闭——双层是语义必需，非 API 美学。

#### 决策 16：scope option——命令式数据视图基准

`open(options)` 的 `scope` 键与声明式 `scope` 键是**同一「scope 基准」概念的两个表达面**：声明式给基准名（`'consumer' | 'declarer'` 字符串枚举），命令式给基准载体（元素）：

- `options.scope: HTMLElement` → 元素反查 scope 链（隐含 consumer 语义），`inst.scope` 透传；
- 缺省 → **engine 根 scope**（`engine.state` 全局视图，即「默认全局」）；
- 声明式 `declarer` 基准**不进命令式选项**（命令式调用方就是要脱离模板上下文，二态够用）。

模板内 `x-data` / params 注入照常（实例数据域不受基准影响）。

#### 决策 17：命令式配置合并链

对齐声明式四级链、只少 `x-dialog-options` 一级（没有声明元素）：

```
内置默认 < x-overlay-options < getOverlay options < open options
```

相邻层深度合并语义照常；`visible` 键在命令式无意义（打开即打开），出现时 **warn + 忽略**。

#### 决策 18：命令式实例同权 + 单例幂等

- 命令式实例与声明式实例**除「visible 驱动源」外完全同权**：同一容器、同一事件双通道、同一配置链、**共享同一单例池**（谁先打开都一样，复用 + 重注入 params）。
- **单例重复 open 幂等**：返回**同一实例句柄**、重注入 params、**不重播动画**、不重复入栈；非单例每次 open 都是全新实例。

#### 决策 19：命令式请求关闭

无 visible 回写目标——所有关闭触点（ESC / 遮罩 / close action / `inst.close()`）恒走「UI 关闭 + `overlay:close` 广播」，善后由调用方监听事件。

### 八、嵌套与打开栈

#### 决策 20：document 级打开栈，ESC 只关全局栈顶

A 开着再开 B（确认框叠对话框）的嵌套正确性：

- **遮罩点击**：B 的遮罩 DOM 层叠盖住 A 的，点击命中即最上层——DOM 追加顺序天然解决，零额外机制。
- **ESC（键盘事件无 DOM 分层可用）**：维护**打开栈**——document 级共享（模块级单例，对齐 icons 先例），记录**所有 engine** 的打开实例（声明式 + 命令式同权入栈）；ESC 监听 document 级单例（首实例打开注册、全关注销），触发时仅对**全局栈顶**实例走「请求关闭」流程。多 engine 并存时 ESC 也只关一个（不跨 engine 连环关）。
- 关闭中间层不影响栈底实例；容器 DOM 追加顺序与栈序天然一致。

### 九、anchor 定位体系（floating-ui）

#### 决策 21：anchor 与 scope 正交

`scope` 是**数据视图基准**（决策 16），`anchor` 是**显示定位锚点**——两者独立可配、互不依赖。anchor 结构（与 floating-ui 词汇对齐，减少映射层）：

```ts
anchor: {
    at: string | HTMLElement,  // 定位锚（决策 22）
    placement?: Placement,     // floating-ui 原生值：'top' | 'top-start' | 'bottom-end' | …
    offset?: …,                // 透传 offset 中间件
    shift?: …,                 // 透传 shift 中间件（padding）
    flip?: boolean | …,        // 默认 true（视口翻转）
    arrow?: boolean | …,       // 默认 false；true 时引擎自动注入箭头载体（决策 24）
}
```

#### 决策 22：anchor.at 两栖——选择器（声明式）/ 元素（命令式）

relaxed-json 写不了 DOM 引用，`at` 值两栖：

- **字符串 = 选择器**（对齐 x-loading `selector` 先例）：`@` 前缀全局（`document.querySelector`）、无前缀在当前 scope 子树内查；**打开时现查**，未命中 **warn + 退屏幕居中**（不阻断打开）；
- **元素 = 直接引用**（命令式场景）。

#### 决策 23：@floating-ui/dom 打包进产物

dependencies 安装 + tsup `noExternal` **打包进三格式产物**（约 +10KB min+gzip），对齐 autostore 先例（ADR-0030）——引擎的发行承诺就是「单包即用」，10KB 换定位能力开箱即用。不采用 external（IIFE 产物运行时要求）/ peerDependency（违背单包即用）。

#### 决策 24：定位细节

- **dialog 恒模态，anchor 只改位置不改模态性**：无 `anchor` / `anchor.at` 未命中 → 屏幕居中（现状语义）；有 `anchor.at` 命中 → floating-ui 相对定位，**遮罩照常渲染**。「有 anchor 则非模态 + outside-click 关闭」是一整套新机制（dismissable layer），fast-follow。
- `flip` / `autoUpdate` **默认开**（视口翻转；锚点滚动/resize 重定位，floating-ui 标准做法），实例销毁时 cleanup autoUpdate。
- **arrow 伪元素实现**：`arrow: true` 时引擎自动注入箭头**载体元素**（floating-ui arrow middleware 需真实元素承接定位计算），箭头**视觉**由引擎内置伪元素样式实现（8×8 矩形旋转 45°，用户 CSS 可覆盖）——模板零约定、零改动。
- anchor 走**四级深度合并**（`内置 < x-overlay-options.anchor < x-dialog-options.anchor < 值对象内联 anchor` / 命令式两级同理）；**单例复用时随 open 重应用**（换锚即换位置）。

## 被否决的方案

- **句点命名 `x-overlay.login`**：与修饰符解析正面撞车（`.` 段注入为指令选项，`login` 与 `global` 无法区分），同元素多消费者语义不成立（决策 1）。
- **document 级全局 overlay（跨 engine 共享）**：overlay 模板绑定的 scope 属于声明 engine，跨 engine 共享撞状态隔离；全局收敛为 engine 级（决策 5）。
- **visible 仅接受简单路径（拒绝表达式/字面量）**：用户明确需要表达式驱动（如 `ui.step === 2` 向导场景）与字面量（加载即弹的公告）——改为「请求关闭」语义消化写回缺口（决策 6/7）。
- **表达式形态禁用关闭动作（防状态脱节）**：反直觉（点 ESC 无反应）；「请求关闭」+ 重开边界文档明示更简单可预测（决策 7）。
- **隐式点击触发宿主**：与「同元素多 x-dialog」冲突（一个 click 打开谁？），隐式行为违背引擎显式声明哲学（决策 8）。
- **配置遵守 ADR-0007 回退不合并**：跨位置场景回退迫使消费处重复全部配置；场景本质不同（同元素 vs 跨位置），边界修订而非推翻（决策 4）。
- **实例生命周期与表达式上下文分离建模**（单例永续于消费者死亡之外）：需引入第二挂链与独立上下文叠层，复杂度高；「三合一」一个开关决定三件事，可预测（决策 11）。
- **v1 开放外壳组件覆盖**：overlay 模板已承载绝大部分定制，外壳定制无真实场景输入，YAGNI（决策 12）。
- **child engine 承载 overlay**（对齐 x-slot remote）：状态隔离违反「绑定声明处/消费处状态」的核心语义，否决。
- **overlay:open/close 单走 DOM 冒泡**：实例 DOM 在 body 下，engine 树内模板元素物理收不到——必须双通道（决策 13）。
- **焦点陷阱 / 滚动锁定 / z-index 管理进 v1**：无场景输入，fast-follow（决策 12/10）。
- **anchor 一物二名 / 复用 scope 词汇承担定位**：scope 的语义是「数据视图基准」（表达式上下文挂哪），定位是另一件事——两个正交概念各用一词，强行合并会双义（决策 21）。
- **getOverlay 支持 el 反查 scope 链**（对齐 getComponent）：把「查找锚点」与「定位/视图锚点」混在一个参数里；命令式 = 全局消费语义更清晰（决策 15）。
- **单层句柄**（overlay 对象既是定义又是实例）：非单例多实例并存时 `close()` 语义含糊，双层是语义必需（决策 15）。
- **visible 进命令式 options**：命令式打开即打开，无状态绑定意义——warn 忽略（决策 17）。
- **有 anchor 即非模态 + outside-click 关闭**：dismissable layer 是一整套新机制，v1 无场景输入，anchor 只改位置不改模态性（决策 24）。
- **floating-ui external / peerDependency**：违背「单包即用」发行承诺（ADR-0030），10KB 打包代价接受（决策 23）。
- **箭头走模板内元素约定（`data-overlay-arrow`）**：要求用户模板写箭头元素是多余负担——引擎自动注入载体 + 伪元素默认视觉，模板零约定（决策 24）。
- **position 键名**：floating-ui 术语是 `placement`，对齐外部库词汇减少映射层（决策 21）。

## 后果

- ✅ 覆盖层声明零闪现（编译期剪枝）、查找/复用与组件同构（学习成本零增量）。
- ✅ 消费管道复用 `compileChild`，模板自带完整组件能力（script setup / scoped CSS / hooks）。
- ✅ 状态驱动 + 「请求关闭」：状态是唯一真相源，关闭动作语义统一可预测。
- ⚠️ **dispatcher 扩展**（额外观察根）是前置必改点——不改则 overlay 内 Runtime 指令静默失效。
- ⚠️ ADR-0007 出现「同元素回退 / 跨位置合并」双纪律，文档必须明示边界，防止误读为合并被平反。
- ⚠️ 表达式形态的重开边界（决策 7）与 `consumer` 基准下单例重建状态重置（决策 11）是两处文档必标的反直觉点。
- ⚠️ body 下容器数量随 engine 数增长（接受的代价：每 engine 一个容器换取归属清晰、destroy 干净）。
- ⚠️ 每个开着的 overlay 是活的 scope+watcher 子树（singleton 隐藏实例也活着）——大量 overlay 场景需注意保活成本，文档提示。

## fast-follow 清单

1. x-drawer / x-popup / x-popover 消费者（类型认领机制的既有扩展；anchor 定位对 popup/popover 是主通道，dialog 为辅）。
2. 外壳组件覆盖：`getComponent('dialog')` 兜底内置模板（对齐 x-loading DEFAULT_BLOCK）。
3. 焦点陷阱（focus trap）+ body 滚动锁定（嵌套场景需引用计数）。
4. params 响应式（打开后跟随消费处变化）。
5. `.trigger` 修饰符（宿主点击打开/toggle 的显式 opt-in）。
6. z-index 层叠管理（多 overlay 显式层级控制；打开栈序已天然覆盖默认场景）。
7. 有 anchor 的非模态模式：无遮罩 + outside-click 关闭（dismissable layer）。
8. anchor 联动销毁（锚点元素移除时实例自动关闭）。
9. `scope.getOverlay(name)`：局部（非 `.global`）定义的命令式消费入口。
10. 声明式 anchor.at 的响应式重查（锚点选择器命中元素后渲染时才出现）。

## 实现注记（非架构决策，落地时遵循）

- **指令骨架**：`OverlayDirective` 为名位（对齐 `ComponentDirective`，实际收集在 compiler 前置 transformer，first-match-wins 排在通用 HTMLElement 规则之前）；`DialogDirective` 为 Compile 类（scope 通道 watch visible），经 `presetDirectives` 注册 `overlay` / `dialog` 两键。
- **收集管道**：对齐 `_collectComponent`——`cloneNode(true)` 深克隆 + `<script setup>`/`<style>` 提取（可复用 `buildComponentDef` 的提取段）→ 存 `scope.overlays[name]` / `engine._globalOverlays`；声明 scope 死亡时经指令实例 `destroy()` 从全局表注销（生命周期闭环）。
- **消费管道**：`compileChild(clone, parentScope, {}, undefined, initialData)`，`parentScope` = 决策 11 的基准 scope；`initialData` = params 快照（对齐 x-loading `_configData` 七字段注入方式）；单例实例引用存 dialog 指令实例（对齐 x-loading `this.overlay` / `this.blockScope`），`destroy()` 对称回收。
- **dispatcher**：`addExtraRoot(el)` / `removeExtraRoot(el)` + `collectEls` / `_handle` 纳入外部根候选（与 `_inSlotRoot` 盲区过滤并行不悖）。
- **容器**：engine 私有字段 + 首开懒创建 + `destroy()` 移除；`data-autospark-overlays` 属性双标记便于测试与用户定位。
- **命令式 API**：`OverlayHandle` / `OverlayInstance` 两个轻类（engine.ts 附近或独立模块），`engine.getOverlay(name, options?)` 工厂；getOverlay 只查 `engine._globalOverlays`；合并链复用四级 deepMerge（少一级 x-dialog-options）。
- **打开栈**：模块级单例 `Map<实例, null>`（或数组，document 级，对齐 icons 先例）+ document 级单一 keydown 监听（首实例打开注册 / 全关注销），ESC 取全局栈顶走请求关闭；多 engine 实例同栈同权。
- **floating-ui 接入**：`@floating-ui/dom` 进 dependencies + tsup `noExternal` 追加；`computePosition(anchorAt命中元素, panelEl, { placement, middleware: [offset, flip(默认), shift, arrow] })` + `autoUpdate(anchorEl, panelEl, update)`（销毁时调返回的 cleanup）；`anchor.at` 打开时现查（`@` 前缀 document.querySelector / 无前缀 scope 子树内查，未命中 warn 退居中）。
- **arrow**：`arrow: true` 时引擎自动注入载体元素（floating-ui 定位承接）+ 引擎内置伪元素默认样式（8×8 矩形旋转 45°，注入 head 的幂等样式表内，类名如 `.autospark-overlay-arrow`，用户 CSS 可覆盖）。
- **测试要点**：剪枝不闪现 / 快照冻结（声明处指令消费时才编译）/ scope 链查找 + global 兜底 + 未命中 warn / 三形态 visible 的开关与请求关闭矩阵 / params 快照·覆盖·重注入 / singleton 二态与并存 / scope 基准三合一（consumer 随消费者销毁）/ 四级配置深度合并 / ESC·遮罩·close action 三触点 / animate 进出场与中断抢占 / dispatcher 额外观察根（overlay 内 x-loading 正常挂载）/ 容器懒创建与 destroy 清理 / overlay:open/close 双通道 / 命令式 getOverlay·open·close 全链路 / 单例幂等 open / 打开栈 ESC 全局栈顶（含多 engine）/ anchor.at 两栖解析与未命中退居中 / floating-ui 定位与 flip·shift·autoUpdate / arrow 载体注入与伪元素样式。
