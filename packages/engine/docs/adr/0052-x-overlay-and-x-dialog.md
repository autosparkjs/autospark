# ADR-0052：覆盖物体系（x-overlay → 组件消费统一）与 x-dialog 模态消费者

- **状态**：Accepted（v1 实施后于 2026-09-23 **修订**——组件化统一，共识 v2 十四条落盘并实施；同日 **v2.1 修订**：定位键 `anchor` 更名 `at`、成员 `at` 更名 `selector`、支持字符串/元素简写；2026-09-24 **v2.2 修订**：数据基准键 `scope` 更名 `dataContext`（两栖），见 ADR-0053 修订节九与文末修订记录。现行语义以本文为准，变化见文末[修订记录](#修订记录v22026-09-23组件化统一)）
- **日期**：2026-09-22（v1） / 2026-09-23（v2 修订）
- **关联**：[CONTEXT.md](../../CONTEXT.md)（「覆盖物」章节词条）、[ADR-0001](0001-directive-kind-system.md)（指令类别）、[ADR-0002](0002-dynamic-patch.md)（patch 冲突防护）、[ADR-0007](0007-directive-options-and-modifiers.md)（指令配置体系）、[ADR-0022](0022-x-component.md)（x-component——覆盖物内容即组件，查找/实例化的同构来源）、[ADR-0032](0032-data-script.md)（deepMerge 语义复用）、[ADR-0036](0036-action-descriptor-metadata.md)（内置 close 动作——信号对接）、[ADR-0039](0039-animate-mechanism.md)（animate——进出场复用）、[ADR-0053](0053-component-data-boundary.md)（组件数据边界——覆盖物 scope 基准统一为其家族语义）

## 背景

需求：弹层类 UI（对话框 / 抽屉 / 气泡等「覆盖物」）——内容模板渲染到 `document.body` 容器、由消费者指令状态驱动地控制生命周期。

v1 设计（已修订）：引入独立的 `x-overlay:<名称>` 声明指令收集弹层模板、`type` 类型认领、`params` 消费键、singleton 保活。实施后经 grilling 复审收敛为**组件化统一**模型（共识 v2）：覆盖物不需要独立的「模板资源」概念——它就是**组件的一种消费方式**。`x-use` 消费组件是宿主原地化身；覆盖物消费者消费组件是渲染到 body 容器。声明、查找、props、实例化管道全部与组件体系合一，消费者指令族退化为「形态薄子类」。

v2 塑造设计的关键事实：

1. **`instantiateComponent` 的 `basis` 缺省路径**注释明说「供 overlay 等非 x-use 路径」——组件实例化管道的继承预留早已存在；
2. **组件 def 不携带声明处 options**（`x-component-options` 不存在）→ 配置只能走消费处，无需四级合并链；
3. **`engine.getComponent(el, name)` 已是「el 起 scope 链查找 + 全局兜底」协议**——命令式消费入口直接镜像；
4. observer 通道绑定 `engine.el`（单一 MutationObserver）：渲染产物落到 body 后子树内 Runtime 指令会失明 → 「额外观察根」机制（决策 14，v1 已实施，v2 保留）。

## 决策

### 一、模型与术语

#### 决策 1：覆盖物 = 任意组件被渲染到 body 容器的消费方式（v2）

**声明侧无专用指令**：覆盖物内容 = 任意组件——`x-component` 声明（编译期剪枝缓存，声明处无闪现，与组件语义一致）/ `options.components` 全局注册 / `x-import` 远程加载。消费者按组件名消费（`x-dialog:login` 的 `login` 就是组件名）。v1 的 `x-overlay` 声明语法、`.global` 修饰符、`engine._globalOverlays` 全局表、`type` 类型认领字段全部删除。

#### 决策 2：术语——覆盖物 / 覆盖物实例 / 覆盖物消费者（v2 改名）

- **覆盖物（Overlay）**：任意组件被渲染到 body 容器的消费方式（消费模型）。
- **覆盖物实例（Overlay Instance）**：消费者打开渲染出的活体（消费产物）。
- **覆盖物消费者（Overlay Consumer）**：实例化组件并驱动其生命周期的指令族（x-dialog / x-drawer / x-popup / x-popover）。

英文标识符不动：容器类名 `autospark-overlays`、事件名 `overlay:open/close`、类名 `Overlay*` 均保留。

#### 决策 3：消费者族谱——`OverlayDirective extends UseDirective` 基座 + 形态薄子类（v2）

消费侧公共基座 `OverlayDirective` **继承 `UseDirective`**（抽象，不注册 `presetDirectives`——模板无 `x-overlay` 语法），继承组件实例化全套：`getComponent` 查找、`instantiateComponent` 管道、props 注入、`_waitForComponent`（等待 x-import）、递归深度防护。子类仅覆盖三处：

| 维度 | x-use（继承） | 覆盖物基座（覆盖） |
| --- | --- | --- |
| 值语义 | 值 = 组件名 | 组件名来自 attr，值为 visible 驱动 |
| 实例化时机 | 编译期一次 | visible 真值触发、假值关闭 |
| 目的地 | 宿主原地化身（`_mergeHostAttrs`） | body 容器新实例（跳过属性继承） |

`DialogDirective extends OverlayDirective` 仅叠加模态形态（遮罩外壳、`closeOnMask`、flex 居中默认）；`x-drawer` / `x-popup` / `x-popover` 为未来同构薄子类。

### 二、配置体系

#### 决策 4：三级优先级 + 相邻层深度合并（v2 缩减）

```
内置默认（基座） < x-dialog-options（消费处指令选项） < 值对象内联保留键
```

复用 ADR-0032 的 `deepMerge` 语义（数组替换、undefined 不覆盖、函数整体覆盖）。与 ADR-0007「同元素回退不合并」的关系：同元素内仍回退，跨位置（选项层 → 值对象层）合并——命令式少值对象一级：`内置默认 < getOverlay options < open options`。

### 三、消费侧（x-dialog）

#### 决策 6：visible 四形态 + props 统一（v2 修订）

`x-dialog:<组件名>` 的值形态：

| 形态 | 例 | 打开驱动 | 请求关闭行为 |
|---|---|---|---|
| 简单路径 | `x-dialog:login="ui.flag"` | watch | **回写 `false`** |
| 表达式 | `x-dialog:pay="a && b"` | watch | 仅 UI 关闭 + `overlay:close` 广播 |
| 字面量 | `x-dialog:login="true"` | 挂载即开（公告类） | 仅 UI 关闭 |
| 对象 | `x-dialog:login="{visible: 'ui.flag', userId: 42, closeOnMask: false}"` | `visible` 保留键 | 按 visible 路径可回写性决定 |

对象形态（relaxed-json）：`visible` 为驱动保留键（字符串状态路径，相对消费处 scope）；`closeOnMask` / `animate` / `anchor` / `scope` 为配置保留键（进合并链最顶层）；**其余键全部作 props** 注入组件 data 域（覆盖 `data()` 默认，与 x-use 同约定）。**保留键封闭清单** = `visible` + `closeOnMask` / `animate` / `anchor` / `scope`——撞名风险由封闭清单文档化。

#### 决策 7：「请求关闭」统一语义

关闭动作（ESC / 点遮罩 / close action）恒可用，语义是「**请求**关闭」：可回写（简单路径）→ 回写 `false`（状态是唯一真相源）；不可回写 → 仅 UI 关闭 + `overlay:close` 广播。**已知边界**（文档明示）：表达式形态 UI 关闭后依赖变化重求值仍真时会**重开**。子树内 `close()` 动作的 `action:close` 由消费者在**实例根**上委托监听（覆盖物 DOM 在 body 下，engine 树内祖先收不到冒泡）。

#### 决策 8：纯状态驱动，无隐式点击

宿主元素是**纯声明点**（挂 visible 绑定的地方），不自动绑定 click——打开靠用户显式 `@click="ui.flag = true"`。与 x-loading 的 value 语义一致；宿主可为任意元素；「同元素多 x-dialog」本身就是宿主非触发器的证明。

#### 决策 9：每次打开新实例（v2：singleton 未引入）

每次 open 创建**全新实例**，关闭动画播完即销毁（scope 级联回收 + DOM 摘除）；多实例可并存、层叠 = DOM 追加顺序（后开在上），z-index 不做管理。v1 的 singleton 隐藏保活机制（懒实例化 / `display:none` 保活 / 单例池槽位）**未引入**——多消费点驱动同一覆盖物的状态回写边界未收敛（设计储备：per-def 共享槽 + open 幂等 + close 全量回写，待真实场景落地时再评估）。

#### 决策 11：scope 基准——挂链即基准，统一 ADR-0053 家族语义（v2 修订）

`scope: 'declarer' | 'host'`（默认 `'declarer'`）统一决定实例的表达式上下文、数据视图与生命周期挂链，**挂链即基准**（parentScope 一个载体表达三件事，无需 x-use 的 basis 施加——那是宿主化身场景的解耦机制）：

- `'declarer'`（默认）：挂**声明处** scope（定义闭包，免费获得悬空守卫 + 全局组件退化封闭）；
- `'host'`：挂**消费处** scope（实例随消费者 scope 生死）。

v1 值 `'consumer'` 更名废弃（运行时 warn + 按 `'host'` 处理）；挂链目标 = 组件 def 的 `declarerScope`（ADR-0053），悬空/无声明 scope → rootless 防御（仅全局视图 + 级联守卫兜底）。

#### 决策 12：v1 行为清单与外壳

1. **内置外壳**（模态形态）：遮罩层 + 居中 panel（类名契约 `autospark-dialog-mask` / `autospark-dialog`，样式幂等注入 head，用户 CSS 可覆盖）；组件编译产物渲染进 panel，面板根打 `data-overlay="<名称>"` 属性供用户样式定位。基座默认**裸面板直挂容器**（未来形态的定制点），模态外壳由 x-dialog 叠加。
2. ESC 关闭（经打开栈，决策 20）。
3. 点击遮罩关闭（`closeOnMask` 配置，默认 true）。
4. `action:close` 监听（实例根委托，决策 7）。
5. 进出场动画：复用 ADR-0039 animate 机制，默认 `fade`，`animate: false` 可关。

fast-follow：外壳组件覆盖、焦点陷阱（focus trap）、body 滚动锁定、`.trigger` 点击触发修饰符。

### 四、容器与事件

#### 决策 13：每 engine 一个容器 + 事件双通道

- **容器**：`<div class="autospark-overlays" data-autospark-overlays>` 挂 `document.body`，**每 engine 一个**，首个覆盖物打开时**懒创建**，`engine.destroy()` 时整体移除。容器本身**透明壳**（无定位样式）；SSR `typeof document` 守卫。
- **事件双通道**：`overlay:open` / `overlay:close`（payload 收窄为 `{ name, instance, scope }`，v2）——① 实例根 `dispatchEvent`（DOM 冒泡）；② 引擎事件总线。**注意**：实例 DOM 不在 engine 宿主树内，模板内 `@overlay:close` 收不到——文档必须明示监听方式（总线 / `document.addEventListener`）。

### 五、必要的技术改动

#### 决策 14：dispatcher「额外观察根」注册

覆盖物实例挂载时把实例根注册进 observer 观察范围、销毁时注销——否则子树内 Runtime 指令（x-loading 等）三钩子全部失明。必要改动点，非可选优化。

### 六、命令式 API

#### 决策 15：双层句柄 + 镜像 getComponent 查找（v2 修订）

```ts
// ① 定义句柄：el 起 scope 链就近查找 + options.components 全局兜底；省略 el 仅查全局
const overlay = engine.getOverlay(el, 'confirm', { /* 消费者配置级 */ });

// ② 打开 → 实例句柄
const inst = overlay.open({ userId: 42 /* 非保留键 → props */, scope: someEl /* 数据视图基准元素 */ });
inst.close();      // 精确关这一个实例

// ③ 定义句柄便捷方法
overlay.close();   // 关该覆盖物当前「全部」打开实例
```

查找**镜像 `engine.getComponent` 协议**（v2）——局部组件同样命令式可达，不再限于「全局消费」。`open(options)` 的 `visible` 键在命令式无意义（打开即打开），出现时 warn + 忽略；非保留键全部作 props。非单例多实例并存时只有实例句柄能精确关闭——双层是语义必需。

#### 决策 16：scope option——命令式数据视图基准

`open(options)` 的 `scope` 键（**元素**）与声明式 `scope` 键（基准名字符串）是同一概念的两个表达面：元素反查 scope 链作挂链目标，缺省 rootless（仅全局视图）。模板内 `x-data` / props 注入照常。

### 七、嵌套与打开栈

#### 决策 20：document 级打开栈，ESC 只关全局栈顶

- **遮罩点击**：层叠 DOM 天然命中最上层。
- **ESC**：document 级共享打开栈（所有 engine 的实例同栈同权）；ESC 监听 document 级单例（首实例打开注册、全关注销），触发时仅对**全局栈顶**实例走「请求关闭」流程——嵌套打开只关最上层，多 engine 并存不连环关。

### 八、at 锚定定位体系（floating-ui）

#### 决策 21：at 与 scope 正交

`scope` 是数据视图基准，`at` 是显示定位锚配置——两者独立可配。顶层键三态：**字符串 / 元素简写**（≡ `{selector}`，进合并链前归一化）或完整对象。结构（与 floating-ui 词汇对齐）：`{ selector, placement, offset, shift, flip, arrow }`。

#### 决策 22：at.selector 两栖

- **字符串 = 选择器**（queryRelElement 相对查询：`/` 前缀全局、无前缀 searchRoot 子树内查、`../` 父级爬升、`^` closest；打开时现查，未命中 **warn + 退屏幕居中**）；
- **元素 = 直接引用**。

#### 决策 23：@floating-ui/dom 打包进产物

dependencies 安装 + tsup `noExternal` 打包（约 +10KB min+gzip），对齐 ADR-0030「单包即用」承诺。

#### 决策 24：定位细节

- **dialog 恒模态**：无 `at` / 未命中 → 屏幕居中；命中 → floating-ui 相对定位，遮罩照常渲染。
- `flip` / `autoUpdate` 默认开；实例销毁时 cleanup。
- **arrow 伪元素实现**：`arrow: true` 时引擎自动注入箭头载体元素 + 内置伪元素默认视觉（8×8 矩形旋转 45°，用户 CSS 可覆盖）——模板零约定。
- at 走三级深度合并（简写进链前归一化）；每次打开现应用。

## 被否决的方案

- **句点命名 `x-overlay.login`**（v1）：与修饰符解析正面撞车——v2 随声明指令一起废除。
- **document 级全局 overlay（跨 engine 共享）**：模板绑定的 scope 属于声明 engine，跨 engine 共享撞状态隔离。
- **visible 仅接受简单路径**：表达式驱动（向导场景）与字面量（公告）有真实需求——「请求关闭」语义消化写回缺口。
- **表达式形态禁用关闭动作**：反直觉；「请求关闭」+ 重开边界文档明示更简单可预测。
- **隐式点击触发宿主**：与「同元素多 x-dialog」冲突，违背显式声明哲学。
- **实例生命周期与表达式上下文分离建模**：需第二挂链与独立上下文叠层，复杂度高；「挂链即基准」一个载体决定三件事。
- **child engine 承载覆盖物**：状态隔离违反「绑定声明处/消费处状态」的核心语义。
- **overlay:open/close 单走 DOM 冒泡**：实例 DOM 在 body 下，engine 树内模板元素物理收不到——必须双通道。
- **焦点陷阱 / 滚动锁定 / z-index 管理进 v1**：无场景输入，fast-follow。
- **anchor 一物二名 / 复用 scope 词汇承担定位**：两个正交概念各用一词。
- **单层句柄**（overlay 对象既是定义又是实例）：多实例并存时 `close()` 语义含糊，双层是语义必需。
- **visible 进命令式 options**：命令式打开即打开，无状态绑定意义——warn 忽略。
- **有 anchor 即非模态 + outside-click 关闭**：dismissable layer 是一整套新机制，anchor 只改位置不改模态性。
- **floating-ui external / peerDependency**：违背「单包即用」（ADR-0030）。
- **箭头走模板内元素约定**：引擎自动注入载体 + 伪元素默认视觉，模板零约定。
- **position 键名**：floating-ui 术语是 `placement`，对齐外部库词汇。
- **v2 曾议 singleton 同步引入**：多消费点回写脏状态有真实场景，但 per-def 共享槽 + 全量回写的设计储备尚无落地压力——YAGNI，储备方案已定（见决策 9），将来直接采用勿重新推演。

## 后果

- ✅ 覆盖物与组件体系统一：一套声明（x-component）、一套查找（getComponent 协议）、一套 props 约定、一套实例化管道——学习成本近乎零增量。
- ✅ 消费者指令退化为形态薄子类（dialog ≈ 300 行），drawer/popup/popover 的边际成本极小。
- ✅ 状态驱动 + 「请求关闭」：状态是唯一真相源，关闭动作语义统一可预测。
- ⚠️ dispatcher 额外观察根是前置必改点（v1 已实施）。
- ⚠️ 每次打开新实例：组件内部状态不跨开合保留（需要保活请放全局 state 或经 props 重注入）——与 v1 singleton 默认行为不同，文档必标。
- ⚠️ body 下容器数量随 engine 数增长（每 engine 一个容器换取归属清晰、destroy 干净）。
- ⚠️ 多消费点驱动同一覆盖物时，关闭只回写触发者（singleton 未引入的已知边界）——文档指引单驱动点或监听 `overlay:close` 善后。

## fast-follow 清单

1. x-drawer / x-popup / x-popover 消费者（基座薄子类）。
2. 外壳组件覆盖：`getComponent('dialog')` 兜底内置模板。
3. 焦点陷阱（focus trap）+ body 滚动锁定（嵌套场景需引用计数）。
4. singleton 机制（设计储备：per-def 共享槽 + open 幂等 + close 全量回写；多消费点驱动同一覆盖物的场景驱动）。
5. `.trigger` 修饰符（宿主点击打开/toggle 的显式 opt-in）。
6. z-index 层叠管理（打开栈序已天然覆盖默认场景）。
7. 有 at 的非模态模式：无遮罩 + outside-click 关闭（dismissable layer）。
8. at 联动销毁（锚点元素移除时实例自动关闭）。
9. 声明式 at.selector 的响应式重查。

## 修订记录（v2，2026-09-23：组件化统一）

v1 实施后经 grilling 复审收敛为组件化统一模型（共识 v2 十四条），以下 v1 决策被修订：

| # | v1 决策 | v2 现行语义 |
|---|---|---|
| 1 | `x-overlay:<名称>` 声明指令 + `.global` 修饰符 + engine 全局表 | **全部删除**——内容 = 任意组件（`x-component` / `options.components` / `x-import`），无声明指令（决策 1） |
| 2 | `type` 类型认领（def 字段 / payload / 校验 warn） | **彻底删除**；事件 payload 收窄 `{name, instance, scope}`（决策 1） |
| 3 | `OverlayDirective` 为名位类（声明侧） | `OverlayDirective extends UseDirective` 抽象消费基座；`DialogDirective` 模态薄子类（决策 3） |
| 4 | 四级配置链（含 `x-overlay-options` 声明处层） | 三级链：`内置默认 < x-dialog-options < 值对象内联`——组件 def 不携带配置（决策 4） |
| 5 | `params` 保留键（对象/表达式快照注入） | **删除**——非保留键全部作 props 注入组件 data 域（x-use 约定）；保留键封闭清单 = `visible` + `closeOnMask`/`animate`/`anchor`/`scope`（决策 6） |
| 6 | singleton 默认 true（隐藏保活 + 单例池） | **未引入**——每次 open 新实例、关闭即销毁（决策 9；设计储备已定） |
| 7 | `scope: 'consumer' \| 'declarer'`（consumer 随消费者） | `'consumer'` 更名废弃 → `'host'`；挂链即基准（parentScope 表达上下文/视图/生命周期三合一），不再需要 config.scope 字符串走 basis 施加（决策 11） |
| 8 | `engine.getOverlay(name, options?)` 纯全局查找 | `engine.getOverlay(el, name, options?)` 镜像 getComponent 协议——el 起链就近 + 全局兜底，省略 el 仅查全局（决策 15） |
| 9 | 命令式 `open({params})` | `open(options)` 非保留键全作 props；`scope` 键（元素）为数据视图基准（决策 15/16） |
| 10 | 被否决项「getOverlay 支持 el 反查 scope 链」 | **翻案**——查找协议与 getComponent 对齐后 el 反查成为正解（决策 15） |

保留不变的 v1 决策：请求关闭语义（7）、纯状态驱动（8）、容器/事件双通道（13）、额外观察根（14）、打开栈（20）、anchor 体系（21–24）、animate 复用。

术语：全库「覆盖层」→「覆盖物」（v1 的「覆盖层定义」词条删除；CONTEXT.md 已同步）。

## 修订记录（v2.1，2026-09-23：at 键更名与简写）

配置键重命名（grilling 共识四条，未发布前落地、无兼容层）：

| # | v2 决策 | v2.1 现行语义 |
|---|---|---|
| 1 | 定位配置保留键 `anchor`（对象，内含 `at` 成员） | 更名 **`at`**——三态：字符串 / 元素简写（≡ `{selector}`）或完整锚配置对象；保留键封闭清单同步（决策 21） |
| 2 | 锚配置成员 `at`（选择器/元素两栖） | 更名 **`selector`**——与 x-loading 的 `selector` 同名同语法（queryRelElement 相对查询），「相对元素指定」语言全库统一（决策 22） |
| 3 | 简写无合并语义定义 | **进链前逐层归一化**为 `{selector}`——deepMerge 局部覆盖：换锚只覆盖 selector、保留上层 placement/flip/arrow 等其余锚成员 |
| 4 | —— | 旧键 `anchor` **硬删**（同 `@` 前缀先例：未发布不考虑兼容）——移出保留清单，误写沦为 props |

`placement` 默认 `'auto'`（决策 24 前置已定）对简写形态自然成立——简写即「只指定锚点、其余全默认」。

## 修订记录（v2.2，2026-09-24：dataContext 更名）

数据基准键 `scope` 更名 **`dataContext`**（消除与 x-scope/AutoSparkScope 的重载；组件家族 `x-define-options` / `x-component-options` 同步更名，三处同名同语义——决策与动机详见 [ADR-0053 修订节九](0053-component-data-boundary.md)）：

| # | v2.1 决策 | v2.2 现行语义 |
|---|---|---|
| 1 | 数据基准保留键 `scope`（`'declarer' \| 'host'`，缺省 `'declarer'`） | 更名 **`dataContext`**，值域不变；**两栖**——声明式给基准名、命令式 `open()` 给基准载体（HTMLElement，`findScopeByEl` 挂链兼作 searchRoot，决策 16） |
| 2 | 命令式 `open({scope: someEl})`（元素，决策 16） | 更名 `open({dataContext: someEl})`；新增基准名形态（`'host'` 挂 getOverlay 锚点 scope），缺省仍 rootless |
| 3 | 事件 payload `{ name, instance, scope }`（决策 9 v2 收窄） | `detail.scope` 更名 **`detail.dataContext`**（命令式传元素时为基准元素） |
| 4 | 旧键 `scope` 兜底 + warn（v2 首次更名的过渡层）、旧值 `'consumer'` 映射 | **一并删除（硬切）**——`OVERLAY_RESERVED_KEYS` 移除 `"scope"`，旧键沦为普通 props 注入组件 data 域（与 at 键 v2.1 硬删先例一致） |
