# ADR-0111：jQuery 风格插件机制（全局命名空间 + 插件注册表）

- 状态：已接受（2026-10-13）
- 关联：**取代 ADR-0100**（外部指令全局安装队列——其 `window.__AUTOSPARK_DIRECTIVES__` 队列退役；liveEngines 广播与 `defineDirective` 语义被本机制收编）；承接 ADR-0030（IIFE 自包含发行）、ADR-0094（组件双注册位）、ADR-0036（action 三入口）

## 背景

script/IIFE 场景缺乏统一的第三方能力分发形态：指令有 ADR-0100 的 window 队列，组件只能经构造 `options.components` 传入，action 只有 per-engine 三入口，各域各为政。jQuery 以 `$` 全局命名空间 + 纯副作用脚本的事实标准，证明了脚本场景下极简扩展形态的价值：插件就是一个 js 文件，加载即生效。

```html
<script src="autospark.js"></script>
<script src="my-plugin.js"></script>
<script>
  // my-plugin.js 的内容：
  (function ($) {
    $.components["my.widget"] = "<div x-text='title'></div>";
    $.actions.greet = () => "hello";
    $.ready((engine) => { /* 拿到实例做命令式操作 */ });
  })(AutoSpark);
  const engine = new AutoSpark("#app", { title: "demo" });
</script>
```

## 决策

### 决策 1：全局命名空间重排——`window.AutoSpark` 即类本身

IIFE 产物经 footer 重排：**类提为主全局对象**，命名空间成员（`AutoStore`、`AutoSparkDirectiveBase` 等全量转导出成员）挂为类静态属性，`AutoSpark.AutoSpark` 自引用。`window.AutoSparkSpaces` 保留为指向同一对象的兼容别名——既有消费面（docs demos、router 探测构造）零迁移。

tsup `globalName` 改为临时名 `__AUTOSPARK_NS__`（不进公共面），正式全局名由 footer 组装。jQuery 的 `$` 既是函数又是命名空间，此处同构：`AutoSpark` 既是类又是命名空间。

### 决策 2：API 挂类静态——ESM 与 IIFE 同一后端

`AutoSpark.ready` / `AutoSpark.components` / `AutoSpark.actions` / `AutoSpark.icons` / `AutoSpark.directive`。ESM 消费者 `import { AutoSpark } from "autospark"` 后同样可用；插件脚本里 `$` 只是形参缩写。核心逻辑只实现一次，window 全局只是 IIFE 形态的呈现。

### 决策 3：插件 = 无协议副作用脚本

无插件名、无版本、无注册协议、无插件表。插件就是「加载即生效」的副作用脚本（jQuery 的事实模型）；引擎不感知「插件」概念，只暴露全局命名空间。重复加载是页面作者的责任，引擎不设防。

### 决策 4：`$.ready` 广播语义

`$.ready(fn)` 注册的回调对**每个 engine 构造完成后**各调用一次（回调收 engine 实例）：

- 触发时机 = 构造函数末尾（`engine/ready` 事件发射处，autostart 与否恒发）；
- **晚注册补调**：engine 已存在时注册，立即对所有存活 engine 各补调一次（retain 语义）；
- 回调抛错 try-catch 隔离记日志，不中断其他回调与 engine 构造；
- engine destroy 时摘出存活表，不再触达晚注册的回调。

### 决策 5：注册表 = 查询期委托（不复制进 engine）

引擎级（`options.*`）与真全局（`AutoSpark.*`）分层共存：engine 查找链到顶后**兜底遍历全局注册表**——不做构造期复制、不做运行时广播。仅供指定 engine 的资源仍走 `$.ready` 回调内的 engine 级注册位。

- **components**：查找链 `scope 局部（x-define）→ options.components → $.components → options.builtinComponents`。`$.components` 惰性预编译 + **全局 def 缓存跨 engine 共享**（每组件名全局只编译一次，首个消费的 engine 编译，后续 engine 直接取缓存 def 挂账）；
- **actions**：查找链 `scope 局部 script → engine（options/Proxy）→ $.actions`。命中即经**触发 engine** 的 ActionManager 惰性物化（规范化 + buildAction 包装绑定本 engine 的总线与生命周期广播）——同一声明在多实例中各绑定各的触发上下文，声明无状态即可安全共享；
- **icons**：复用现成的 document 级全局注册表（`AutoSpark.icons.add`，ADR-0058 既有），零新增机制；
- **directives**：`$.directive(name, spec)` = `defineDirective` 的语义化别名（同一后端：造类 → 安装器入内存队列 → 广播存活 engine）。指令是唯一需要广播的注册表（Runtime 指令晚注册要对存活 engine 重扫）；安装器队列从 window 键改为**模块内存队列**——script 顺序加载保证插件文件在引擎之后求值，队列不丢（先于/后于 engine 实例化皆可，构造期消费）。

组件/action 的「查询期委托」使晚注册**天然立即生效**（下次查找即命中），无需广播机制——这是查询期委托相对构造期快照合并的核心收益。

### 决策 6：旧机制处置

- `window.__AUTOSPARK_DIRECTIVES__` 队列**硬删**：不再监听该属性，ADR-0100 标记 superseded；
- ~~`defineDirective` 保留为永久公开 API~~（**实施期修订**：随后收敛为 `$.directive` 唯一入口——原保留名硬切删除，见决策 8 修订）；
- `consts.ts` 的 `GLOBAL_COMPONENTS` / `GLOBAL_DIRECTIVES` / `GLOBAL_PLUGINS` 三个 window 键预留常量删除——注册表挂类静态，不采用 window 键方案。

### 决策 7：边界——不做的

- **不开 prototype 扩展口**：无 `$.fn`、无 `$.extend`。「插件可以修改 engine」仅指 `$.ready` 回调里对公开 API 的命令式操作（actions 赋值、事件订阅、patch 等）；prototype 混入与细粒度响应式 patch 的运行树模型交互不可预测；
- **无插件卸载**：engine.destroy 摘除监听即止，全局注册表不回滚（全局资源生命周期即页面生命周期）；
- **无冲突检测**：同名覆盖（组件后注册覆盖先注册、指令撞预设名沿用 DirectiveManager 的 warn 语义）。

### 决策 8：指令定义收敛——`$.directive` 唯一入口，spec / 类双重载（实施期修订）

初版曾设 `$.directive(spec)` + `installDirective(name, Cls)` 两入口并保留 `defineDirective` 兼容名；收敛修订为**唯一入口 `$.directive` 按实参形态重载分派**：

- **spec 重载** `$.directive(spec)`：最小键集，造类入安装队列，返回类本身；
- **类重载** `$.directive(name, Cls)`：结构指令（`ownsChildren`）、元素名指令、类级钩子、singleton 等高级形态——继承基类造类后安装（取代 ADR-0100 window 队列承载的「完全控制」路径，语义同 `DirectiveManager.install`；第二参缺失或非基类子类抛错）；
- `defineDirective` / `installDirective` 两个名字硬切删除（开发期，先例同「scope 配置键」硬切）。

## 后果

**正面**：

- script 场景获得统一的第三方能力分发形态，四个域一套心智；
- 组件编译产物跨 engine 共享，多实例页面不重复编译同一插件组件；
- 多实例广播语义与 ADR-0100 心智连续，`engine/ready` retain 语义复用。

**代价 / 明码标价的边角**：

- 全局 def 缓存的「查过且无」null 标记跨 engine 传染：插件晚于 engine 加载、且该组件名已被查询过时，null 缓存挡住后续注册——与「构造期配置纪律」一致，插件必须在 autospark.js 之后加载是**硬约束**；
- `Object.keys(engine.actions)` 枚举面不含未物化的插件 action（首次命中才物化）；
- IIFE footer 重排使产物多一层属性混挂，sourcemap 的顶层段与源码结构有轻微偏差。

## 实施落点

- `packages/engine/src/features/plugin/index.ts`——命名空间基础设施（ready 回调表、存活 engine 表、指令安装器队列、组件/action 声明表、全局 def 缓存）；
- `features/directive/global-queue.ts`——window 队列退役，保留 spec 重载实现体与 `DirectiveSpec` 类型（`$.directive` 转发至此）；
- `engine.ts`——类静态成员组装 + `_resolveGlobalComponent` 查找链扩展 + 构造期 `setupPluginQueue` / 末尾 `firePluginReady` / destroy 摘除；
- `scope.ts`——`getAction` 末端兜底 `$.actions`（惰性物化）；
- `tsup.config.ts`——globalName + footer 重排。
