# ADR-0077：消息会话体系与双层渲染组合

- 状态：已采纳（**字段面被 [ADR-0079](0079-message-type-level-rename.md) 取代**——`kind`→`type`、语义色 `type`→`level`、排序 `level` 移除；**双层组合的内容分工被 [ADR-0088](0088-message-content-ownership-module-split.md) 修订**——title/description/actions 等内容渲染下放 type 模板，shell 降级为外观容器（chrome + close 钮 + 出口）；本 ADR 的会话 / persist / 双层投影机制本身不受影响）
- 日期：2026-10-01
- 关联：[ADR-0071](0071-messages.md)（消息模块）、[ADR-0072](0072-messages-state.md)（$messages 状态暴露）、[ADR-0062](0062-overlay-shell.md)（面板外壳 / shell 机制）、ADR-0056（插槽投影）

## 背景

ADR-0072 落地 `$messages` 状态暴露后，实际使用暴露三类缺口：

1. **行为句柄碎片化**：`MessageTask` 只有 `hide()`（重显走 manager `show(id)`、硬移除走 `delete(id)`）；confirm 的编程应答只有 `Promise`（糖）；task 进度是 `ProgressTask`（另一个名字）。用户面对「task / 句柄 / Promise」三种词汇；
2. **存续档位不够**：`persist: 'none' | 'local' | 'remote'` 三档之间缺「会话内可回看但不落盘」——通知中心列表想保留已消失的提示供用户翻阅，又不必为它们付出持久化；
3. **渲染接管是全有全无**：四级互斥查找（`kinds[kind].render` → `shell` → 内置注册表 → message-shell）意味着接管 kind 就要连 title / actions / close 按钮一起重写——公共骨架无法复用。

同时观察到的既有事实：overlay 家族（ADR-0062）的「面板外壳 + 内容组件经默认出口投影」双层结构运转良好，消息与它是同构问题（公共骨架 + 专属内容）。

## 决策

### 一、消息会话（AutoSparkMessageSession）

`MessageTask` / `ProgressTask` 家族**更名公开**为 Session 家族（未发布零迁移）：

- 基类 `AutoSparkMessageSession`：`id / kind / el / closed / read / status / result`（只读 getter）+ **`show() / hide() / remove()`** 三方法——重显 / 关闭 / 硬移除统一到句柄上（remove = 删除记录**含持久化数据**，与 manager `delete(id)` 同路）；
- 子类：`AutoSparkTaskMessageSession`（`start / progress / pause / resume / stop / cancel`——原 ProgressTask 六方法）与 `AutoSparkConfirmMessageSession`（`yes() / no() / cancel()`——≡ 点击对应按钮，与 DOM 点击同一条 `_fireAction` 闭环，事件观察者无感知差异）；
- `add()` 按 kind **类型窄化分派**（`kind:'task'` → Task 会话、`kind:'confirm'` → Confirm 会话、其余含自定义 kind → 基类面）；**运行时同构对象**——实现是全集方法的闭包（task.cancel 与 confirm.cancel 同为「立即关」语义、同一实现），类型面按 kind 窄化（零重复代码，KISS）；
- `messages.sessions`：全部存活会话的注册表——**manager Map 自身的正名视图**（同一张表两个读法，不建第二表）；
- **死会话**：`remove()` 后 `_entry` 置空，后续方法 no-op + warn，不复活；
- `'confirm'` 升内置 kind：`confirm()` 糖内部改走 `kind: 'confirm'`（维持 `Promise<result>` 返回）；直接 `add({ kind: 'confirm' })` 在未显式提供 actions 时**自动注入**「确定 / 取消」value-only 双钮（与糖同形）；
- **`show` 双形态**：`messages.show(props | factory)` 为 `add` 的别名（「show = 让消息出现」，含 Session 分派返回）；`show(id)` **保留** ADR-0071 决策 9 的重显语义——消歧规则零歧义（字符串恒为 id、对象恒为新建），未命中 id 仍 warn + null（不误弹）；
- **发起糖统一退役 → kind 快捷方式回归**（两步演变）：先退役 `engine.toast()` / `messages.confirm()` / `messages.progressbar()` 收敛到 `show`（内部 `AddHooks`/`onChoice` 通道一并删除）；随后以 **`messages` 域便捷层**回归——`toast(props)` / `confirm(message, {yes,no}?)` / `task(props)`，均 ≡ `show({...props, kind})` **强制对应 kind**（误传他 kind 一律归位；progressbar 更名 task，名即 kind 名）。**confirm 的 Promise 语义由 Confirm 会话 thenable 承载**（不再需要 hooks 通道）：`await confirm(...)` / `await show({kind:'confirm'})` 直接得 choice 应答（value；sticky 永不 settle、永不 reject）；`{yes,no}` 可提取键从 props 剥离转按钮文案（决策 22 沿用）。模板侧配套 action 家族 `toast`/`confirm`/`task` 保留——**宿主元素自动注入 anchor**，与编程式 `show({ anchor: HTMLElement | string })` 显式传等价（三职：action 解析根 / 事件派发根 / 渲染数据视图基准）。

### 二、persist 数值化

`'none' | 'local' | 'remote'` → **`0 | 1 | 2 | 3`**（未发布零迁移），语义常量 `MESSAGE_PERSIST = { NONE, SESSION, LOCAL, REMOTE }`：

| 值 | 语义 |
| --- | --- |
| `0` | 隐藏即销毁（默认，toast 兼容） |
| `1` | **会话缓冲**：隐藏不销毁、不持久化——记录留内存与 `$messages.items`（管理界面可再查看、`show()` 重显），刷新即失 |
| `2` | localStorage 持久化 |
| `3` | 服务器持久化（POST 全量覆盖） |

- 级别 1 的「缓冲区超出清除」**复用 maxLen**（不发明第二上限）；镜像记录 `persist >= 1` 落键（0 为缺省态不显式写）；
- **remove / delete / clear 立即同步持久化**（`_flushPersistNow`：local 即写 + remote 立即 flush 全量覆盖）——「删干净」闭环，刷新 / 多标签页不复活；
- restore 反推按介质：local → 2、remote → 3。

### 三、双层渲染组合（取代 ADR-0071 决策 16 四级互斥链）

**shell（公共骨架）与 kind renderer（专属区）正交**：

- shell 渲染公共元素与行为：close 按钮 → type 图标 + title → description → **kind 默认出口**（裸 `x-slot`）→ actions 行最底；所有 kind 共享；
- kind renderer 经出口投影（task 进度条；toast / confirm 为**空占位**——结构对称 + `kinds[kind].render` 整键替换扩展点）；
- 两条独立查找链：shell 链 = `options.messages.shell`（选择器，默认 `'message'`，运行时直写换键对后续 add 生效）→ getComponent 链 → `options.uiShells` → 内置兜底；kind 链 = `kinds[kind].render` → 内置注册表 `{ toast, task, confirm }` → 无（出口空置）；
- props 全量数据域**同权注入两层**；自定义 shell 未声明默认出口 → warn + kind 区丢弃（数据无损）；
- 装配序镜像 overlay（ADR-0062）：renderer 先编译、产物以 `mode: "live"` 段经 `slotContents` 投影进后编译的 shell 出口；shell 与 renderer **同挂 anchor scope**（兄弟挂链）+ 双注入同一 `$session` 对象（挂链继承的语义等价实现）；
- 内置名更名：`message-shell` → **`shell`**（消息域内部名 / 文件名）、`task-shell` → **task renderer**（一 kind 一 renderer，名即 kind 名——`taskWidget` 中间名退役不入词汇表）、目录 `renders/` → **`renderers/`**。

### 四、`$session` 派生变量

卡片子树（shell 与 kind renderer 两层）注入 **`$session`**——对齐 x-for `$index` / x-tree `$level` 的 `$` 前缀派生变量惯例：经 `compileChild` 的 localData 通道（`instantiateDetachedComponent` 尾参透传），**非响应式、不进 state、不进 data 域**。

- 动因：函数值进响应式 data 域会被 autostore 按计算属性语义劫持（ADR-0072 把 actions 逐出 options 真身的同一条陷阱）——Session 满是方法，整包作 props 注入行为炸裂；
- **行为专职纪律**：模板内 `@click="$session.hide()"` / `$session.progress(50)`；数据绑定走 data 域（响应式）——`x-show="$session.closed"` 不会自动更新（首渲染后不重求值）；
- kind renderer 内再嵌套**封闭** x-component 时 `$session` 不可见（组件数据边界 ADR-0053 切断祖先 localData——x-for `$index` 同款纪律）。

### 五、`options.uiShells` 引擎级外壳注册表

`AutoSparkOptions.uiShells: Record<string, string>`（HTML 模板字符串 + 懒预编译）——**全引擎「带出口协议的骨架外壳」统一寄存处**：

- 内置四件种子：`message`（消息）/ `dialog` / `popover` / `drawer`（overlay 三件自 `BUILTIN_SHELL_TEMPLATES` 模块级表迁入，`BUILTIN_SHELL_NAMES` / `resolveBuiltinShell` / `dialog-shell` 等组件名退役——键统一为消费者裸名）；
- 构造期合成 engine 私表（内置种子 < 用户同键浅覆盖）+ **构造期固化**（运行时突变不失效缓存——与 `options.components` 同纪律）；运行时换 shell 走消费者选择器（`messages.shell` 直写换键）——**注册与选择分离**；
- 解析链：消费者选项 shell 名 → getComponent 链（局部覆盖能力保留）→ uiShells → 消费者内置默认；
- **边界**：只收外壳语义组件（出口协议 + 公共骨架）——loading 块、内置 error 组件、tree-node、kind renderer 不入；
- builtin 判定（wrapper 装配规则）：种子键**未被用户接管**才视为内置（用户接管的 message 键模板无引擎类名契约，按用户模板包 wrapper）。

### 六、杂项键

- **`styles?: string`**（cssText）——卡片根追加语义（与 className 同点），渲染键不入 `AutoSparkMessageRecord` 与持久化载荷；
- **尺寸五键** `width / height / minWidth / maxWidth / minHeight`（number = px、字符串透传 CSS；width/height 默认 auto 不写内联、maxWidth 缺省走内置 shell 的 `--autospark-message-max-w` CSS 兜底）——inline 经 `setProperty` 结构化写入卡片根（在 styles cssText 之后执行，结构化键最终生效）；**内置 kind 种子默认层**（`BUILTIN_KIND_DEFAULTS`，合并链位于 MESSAGE_DEFAULTS 与 options.messages 之间）：confirm / task 默认 `width: 300`（双钮与进度形态紧凑；toast 不设——auto 跟内容），用户任意配置层可覆盖；
- **`options.shallow: 0 | 1`**——`$messages.items` 的 shallow 深度透传（默认 1；0 = 成员不代理、仅结构变更有事件——超大列表最省形态）。**构造期一次性**：运行时直写**静默忽略**（shallow 包装无法换壳）——ADR-0072「options 真身直写即生效」契约的**第一条例外键**（实施时实测 autostore `shallow` 的 Deep 类型约束即 `0 | 1`，文档同步收窄）。
- **sticky 自动关闭钮**（实施后修订）：`delayClose ≤ 0`（永不自动关）且整条合并链**未显式声明** `closable` 时自动置 `closable: true`——否则除 API / actions 外消息无法关闭（可发现性缺口：sticky 卡片无 × 就只能编程收）。显式 `closable: false`（含全局层）照常压制——「用户明确不要 ×」优先。动因：可用性兜底属**默认值语义**而非覆盖语义，任何显式层都必须能压过它。

## 实现要点（防再踩）

1. **渲染装配序**：kind renderer 必须先编译（内容先于 shell——`mode: "live"` 投影需要产物 el），但 `parentScope` 与 shell 同为 anchor scope——不要让 renderer 挂 shell scope（shell 后编译，scope 尚不存在）；
2. **confirm 双消息陷阱**：`confirm()` 与后续 `add({ id })` 是两条独立记录——编程应答要么用 `confirm()` 的 Promise，要么对自己的 add 结果调 `session.yes()`，不要跨记录混用（测试曾因此挂起：Promise 挂在另一条上永不 settle）；
3. **运行时全集 + 类型窄化**：Session 实现是含全部方法的一个闭包对象——`typeof (toastSession as any).progress === "function"` 是预期的（类型面窄化不等于运行时裁剪），断言「基类面无某方法」只能做类型层测试；
4. **级别 1 的 localStorage 形态**：不入桶 ≠ 不写——`writeLocalMessages([])` 仍会写 `"[]"`（全量覆盖语义），断言空载荷须 parse 后查长度。
5. **sticky 推断的显式性判定**：state 的 `$messages.options` 真身被 MESSAGE_DEFAULTS 全键兜底（ADR-0072「可读全量」契约），`"closable" in opts` **恒真**——区分「全局层显式配置」与「兜底值」须用构造期兜底前快照（`_globalDeclared`）；单次 props / kinds 层是原样对象，`in` 判定可靠。另：断言关闭钮显隐须查 `style.display`——`x-show` 只切 display，元素恒在 DOM。

## 被否决 / 演变的方案

- **Task / Session 双继承树**（`AutoSparkToastMessageTask` 与 `AutoSparkXxxMessageSession` 并存）：一轮即否——双词汇地狱（刚清完 body/href），单套更名公开；
- **Session 整包入 data 域**（模板直接 `session.hide()`）：computes 劫持（见决策四动因）——冻结对象方案（autostore 深代理行为不可靠）一并否决；
- **kind renderer 挂 shell scope**（决议原文的「经挂链继承」字面实现）：与「内容先编译」的投影序矛盾，改为兄弟挂链 + 双注入同一 `$session` 对象（可见性契约等价）；
- **persist 独立 bufferLen 上限**：YAGNI——maxLen 单一上限已覆盖会话缓冲淘汰；
- **uiShells 运行时可写**（缓存按名失效重建）：自造缓存失效机制换不来真实场景（换 shell 走选择器已足够），固化为构造期配置语义；
- **`options.shallow` 运行时直写 warn**：用户拍板静默忽略（例外键可发现性让位于文档说明）；
- **toast / confirm 不注册内置 renderer**（出口空置走「无 renderer」路径）：与「一 kind 一 renderer 文件」的结构对称诉求相悖——空占位保留（用户可整键替换扩展）；
- **`at` 定位键**（per-message 元素旁渲染）：本轮未采纳——anchor 维持三职不动，元素定位仍是 fast-follow（词汇已预留对齐 overlay 家族）。
