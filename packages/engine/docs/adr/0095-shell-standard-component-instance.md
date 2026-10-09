# ADR-0095：shell 统一标准组件实例模型（messages 装配升级与 wrapper 退役）

- 状态：已采纳（2026-10-09 落地；域名词随 ADR-0096 messages→notifications 更名）
- 日期：2026-10-09
- 关联：ADR-0094（查找统一——本 ADR 的前置）、ADR-0062（overlay shell 实例化先例）、ADR-0071/0089（消息域）、ADR-0092（单文件组件 defaults 段）、ADR-0096（messages→notifications 更名）

## 背景

shell 的消费形态双轨并存：

- **overlay 家族**（dialog/popover/drawer 声明式 + `getOverlay` 命令式）已是**标准组件实例**：
  shell 快照经 `instantiateDetachedComponent` 完整实例化（data 域 + scoped CSS + 四阶段 hooks），
  `config` 整包注水 shell data 域（打开时一次，ADR-0062 Q13），内容组件以 `mode:"live"` 段投影
  进 shell 默认出口（`x-slot`），独立 shell scope 统一回收。
- **messages** 仍是**手工装配**：卡片骨架按 DOM 拼装——非内置 shell 垫 wrapper div（防引擎类名
  污染用户模板）、引擎静态写卡片根契约（`autospark-message` 类 + `data-message-type/level`
  分派属性）、约定键（`holdOpen`/`visible`/`closed`/`remaining`）直接 watch 手工装配产物。

同是 shell，一套机制两种实现；messages 侧的 wrapper + 静态写入是组件实例化模型诞生前的历史层。

## 决策

### 1. messages shell 升级标准组件实例，与 overlay 同管道

`assembly.ts` 的手工装配链重写为 `instantiateDetachedComponent`：卡片配置整包注水 shell 实例
data 域，type 组件实例以 live 段投影进 shell 默认出口（无出口时 warn + 内容直挂面板根，
对齐 ADR-0062 行为）。实例生命周期归消息卡统一管理（remove 即销毁实例 scope，回收私有响应式域
与 scoped 样式引用）。

### 2. 契约模板绑定化——「模板即契约」

引擎静态写卡片根的机制退役：`autospark-message` 类、`data-message-type/level` 等分派属性改为
**内置 `message-shell.html` 模板自绑**（消费注水的 data 域）。用户接管 shell（同名覆盖）时契约
随模板走——要引擎契约就沿用内置模板写法，不要则完全自定（ADR-0092 覆盖彻底性语义的延伸）。
引擎不再拥有「实例化后补写 DOM」的第二套契约机制（DRY）。

### 3. wrapper 退役

非内置 shell 垫 wrapper div 的机制整体退役——shell 本身就是组件，模板即完整结构，引擎不垫任何
DOM。`ShellRef.builtin` 标记与配套装配分支删除。

### 4. 约定键 watch 迁实例 data 域

`holdOpen` / `visible` / `closed` / `remaining` 的 watch 目标从手工装配产物迁到 shell 实例
data 域；manager 侧 watch 逻辑不变、落点更换（ADR-0089 约定键协议不变）。

### 5. messages shell 查找链起点 = 引擎根 scope

消息卡无树内宿主（分区列挂 document 级容器），链起点取**引擎根元素 scope**：根元素建过 scope
（如根上 `x-define="message"`）则就近命中，否则纯全局兜底。有 `anchor` 的消息沿 anchor scope
起链（与 overlay 的 anchorScope 对齐）。

## 边界

- **overlay 家族装配零改动**——已是目标模型，仅查找链随 ADR-0094 统一。
- **tooltip 不涉及**——无 shell 概念（ADR-0061 纯样式呈现）。
- 实施分两阶段（ADR-0094 查找统一先行、全量回归后进本 ADR），各自独立可回归。

## 实施注记（2026-10-09 落地修正）

实施期核查修正了背景判断的精度——决策的**净增量**比原背景预估小：

- **决策 1（实例化）与决策 4（watch）在装配层已天然满足**：notifications 的 shell 本就经
  `instantiateDetachedComponent` 实例化（config 注水 + live 出口投影，与 overlay 同管道），
  约定键 watch 本就挂实例 scope（`$scopes.<id>.holdOpen` 精准订阅）。本 ADR 的实际净增量 =
  **决策 2（契约绑定化）+ 决策 3（wrapper 退役）+ 决策 5（链起点）**。
- **契约绑定化的实现形态**：`data-notification-type/level` 由内置 notification-shell.html 根
  自绑（`:data-notification-type="type"` / `:data-notification-level="levelName"`）——归一名
  经 `buildInjectProps` 派生键 `levelName` 注入（与 icon 同款派生键，模板零逻辑）；原地更新
  走既有注水刷新（`_applyEntryConfig` 的 `Object.assign(scope._data, inject)`），绑定响应式
  跟随，manager 静态写删除。
- **决策 5 链起点的实现细节**：引擎根 scope 取 `compiler.getScopeByTemplate(engine.template)`
  （模板容器有指令才建 scope，纯静态根为 null → 纯全局）——不能 `findScopeByEl(engine.el)`
  （编译产物子节点挂回 el，el 自身不建 scope；且产物剥指令属性，属性选择器反查不可用）。
- **wrapper 退役的语义边界**：引擎**运行态写入**（display / 列属性 / className / styles /
  尺寸五键 / 行为监听）仍直挂 shell 根——wrapper 时代这些写在垫层上，退役后改写用户模板根，
  这正是「模板即契约」的应有语义（渲染键作用于卡片根）。
