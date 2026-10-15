# ADR-0114：插件预加载队列 `globalThis.__AUTOSPARK_PLUGINS__`

- 状态：已接受（2026-10-15）
- 关联：**修订 ADR-0111 决策 6**（该决策否决的是「window 键做**注册表**」，本机制引入的是「window 键做**预加载队列**」——性质不同，注册表仍挂类静态）；承接 ADR-0111 决策 1（类即命名空间）、决策 3（无协议副作用脚本）、决策 5（查询期委托）

## 背景

ADR-0111 的 jQuery 模型要求插件脚本**必须在 `autospark.js` 之后**加载——插件体是 `(function ($) { ... })(AutoSpark)`，脚本求值那一刻 `AutoSpark` 必须已存在。这条约束把 script 标签顺序变成了硬契约：插件不能进 `<head>` 的 `defer` 批、不能与引擎脚本合并打包、顺序写反即 `AutoSpark is not defined`。

真正需要解除的只有这一条：**脚本求值顺序**。注意另有第二条约束不在此列——插件必须早于 `new AutoSpark()`（否则已被查询过且未命中的组件名会被全局 def 缓存的 null 标记挡住，ADR-0111「后果」已明码标价）——**本 ADR 不解除它**。

```html
<!-- 改造前：顺序是硬契约 -->
<script src="autospark.js"></script>
<script src="my-plugin.js"></script>

<!-- 改造后：插件可以先于引擎脚本 -->
<script>
    (globalThis.__AUTOSPARK_PLUGINS__ ??= []).push((engine, $) => {
        $.components["hello-card"] = "<div x-text='title'></div>";
        $.ready((e) => { e.actions.localOnly = () => {}; });
    });
</script>
<script src="autospark.js"></script>
```

## 决策

### 决策 1：载体是数组，元素是「插件脚本体」

`globalThis.__AUTOSPARK_PLUGINS__: ((engine, autospark) => void)[]`。插件不再直接执行注册，而是把**整个插件脚本体**包成一个函数推进数组，由引擎延后调用。这与 ADR-0111 决策 3「插件 = 无协议副作用脚本」不冲突：副作用只是从「脚本求值时」推迟到「首个 engine 构造期」，插件作者的心智不变（函数体里就是原来脚本体的内容）。

### 决策 2：双参 `(engine, autospark)`——第二参是必需的，不是冗余

后置插件通过闭包形参 `($){...}(AutoSpark)` 拿到命名空间；**前置插件在求值时 `AutoSpark` 根本不存在**，只能靠参数注入。因此：

- 预加载队列元素签名为 `(engine, autospark) => void`；
- **`AutoSpark.ready(fn)` 同步改为双参** `(engine, autospark) => void`——签名统一优先于「后置场景本可省略」的洁癖。既有单参回调 `(engine) => {}` 完全兼容（JS 忽略多余实参）。

第二参的值是**正在构造的 engine 的 constructor**（`engine.constructor`）——类即命名空间（ADR-0111 决策 1），且这样取不破坏 `features/plugin` 模块「不运行时引用 engine」的分层约束。

### 决策 3：消费时机 = 首个 engine 构造期，`setupPluginQueue` 内、`directiveInstallers` 遍历**之前**

必须早于安装器循环：队列里 `$.directive(...)` 的指令要进 `directiveInstallers` 数组才能被随后的活迭代消费、参与 engine#1 的**首次编译**。若 drain 晚于循环，engine#1 尚未入存活表（`liveEngines.add` 在 `setupPluginQueue` 末尾），广播补不上——Compile 指令将错过首屏，比顺序问题更致命。

代价是 drain 时 engine 处于「半构造」（尚未 compile），命令式 DOM 操作会落空——这类行为本来就该走 `$.ready`：队列函数体内注册的 ready 回调会在**本 engine 构造末尾** `firePluginReady` 被覆盖到，通路自洽。

### 决策 4：一次性语义不靠模块级 flag，状态活在全局数组里

drain = `splice(0)` 全量取出（快照，非活迭代）+ `Object.freeze` 原数组。之后队列恒为空且冻结：

- 后续 engine 构造再调用 drain → `queue.length === 0` 短路，自然什么都不做；
- 本模块**无新增可变状态**，可测试性由「重赋一个新数组」即得；
- 冻结让晚到的 push 在严格模式直接抛 `TypeError`（非严格静默失败，但 `Object.isFrozen()` 可检测）——**不重蹈 ADR-0100 的坑**：那个 `window.__AUTOSPARK_DIRECTIVES__` 正是「push 进无人消费的数组，静默失效」才被 ADR-0111 判死。

队列函数体只在首个 engine 构造时执行一次，因此**直接写在函数体里的 per-engine 副作用只作用于 engine#1**；需要每实例的行为必须包进 `$.ready`。

### 决策 5：多实例无影响——清的是通道，不是注册表

队列是**投递通道**，注册结果落在 `AutoSpark.components` / `actions` / `directive` / `icons` 这些类静态上（生命周期 = 页面生命周期）。engine#2 的查找链到顶兜底读全局表（查询期委托，ADR-0111 决策 5），压根不经过队列；唯一「每 engine 一次」的 `$.ready` 回调已进模块级 `readyCallbacks`，同样不依赖队列。故清空队列对后建 engine **零影响**。

边界：若首个 engine 构造时队列尚不存在（`undefined`），之后才被创建，则内容会被**下一个** engine 构造时消费——相对那个 engine 它确实是「预加载」，属良性超集，不额外设防。

### 决策 6：ESM 与 IIFE 同一后端，无差别读取

消费逻辑写在共享的 `features/plugin/index.ts`，不按产物格式分叉（延续 ADR-0111 决策 2）。ESM 消费者理论上也能用这个全局键，但没人需要（`import { AutoSpark }` 即可）——无害冗余，代价仅一点 tree-shaking 去不掉的代码。

## 后果

**正面**：

- script 标签顺序不再是契约：插件可进 `<head>` 的 `defer` 批、可与引擎脚本合并、可任意排列；
- 一次性语义由全局数组自身承载，无模块级 flag，实现与测试都更简单；
- 误用（消费后再 push）会响（抛错）而不是哑（静默失效）。

**代价 / 明码标价的边角**：

- **约束 2 仍在**：插件必须早于 `new AutoSpark()`，否则被查过且未命中的组件名仍被 null 缓存挡住——文档继续警告；
- 队列函数体只执行一次，直接写在其中的 per-engine 副作用只在 engine#1 生效（须包 `$.ready`）；
- `AutoSpark.ready` 变双参——对既有单参回调无破坏，但类型面是变更；
- 消费后冻结的全局数组对「二次加载引擎脚本」等场景不做调和（重复加载本就是页面作者的责任，ADR-0111 决策 3）。

**边界（不做）**：

- 非数组队列 → error 后忽略；非函数元素 → error 跳过；单个元素抛错 → try-catch 隔离记日志，不中断其余元素与 engine 构造；
- 消费期间再入队的元素不参与本次消费（取 splice 快照，与 `setupPluginQueue` 的活迭代刻意不同）；
- 首个 engine 构造中途抛错 → 队列不回滚（一次性即一次性）；页面永不构造 engine → 队列永不消费（它是预加载队列，不是模块初始化钩子）。

## 实施落点

- `src/types/global.d.ts`——新建，`declare var __AUTOSPARK_PLUGINS__` 全局声明（ambient，不参与 tsup dts 打包）；
- `src/features/plugin/index.ts`——`PluginBootstrap` 类型、`PluginReadyCallback` 改双参、`pluginNamespace(engine)`（经 constructor 反查）、`drainPluginBootstrapQueue(engine)`，并在 `setupPluginQueue` 开头调用；
- `src/engine/engine.ts`——`AutoSpark.ready` 静态签名与文档改双参（构造期调用点无变化，drain 藏在 `setupPluginQueue` 内）；
- `src/index.ts`——导出 `PluginBootstrap` 类型；
- `src/__tests__/features/plugin.test.ts`——预加载队列用例组（一次性 / 多实例 / ready 双参 / 非法形态 / 抛错隔离 / 冻结）；
- `docs/zh/engine/guide/plugin.md`——新增「前置加载」小节，重写加载顺序警告块。
