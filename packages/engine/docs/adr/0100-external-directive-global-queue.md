# ADR-0100：外部指令全局安装队列（`__AUTOSPARK_DIRECTIVES__`）

- 状态：已采纳（2026-10-10 grilling 会话闭合全部决策面并实施）
- 日期：2026-10-10
- 关联：ADR-0001（指令 kind 通道体系——安装指令同受其约束）、ADR-0030（品牌与
  IIFE 全局 `AutoSparkSpaces`——本机制的宿主环境）、ADR-0031（script type 命名空间
  ——action 的模板内声明先例，指令的代码形态不可复用该通道）、ADR-0058（icons 全局
  注册表——「同名 warn + 覆盖」先例）、`DirectiveManager.set`（运行时注册既有语义）

## 背景

script/IIFE 场景（`<script src="autospark.js">` + 全局 `AutoSparkSpaces`）下，
自定义指令作者面临三重断点：

1. **基类不可得**：`AutoSparkDirectiveBase` 未从包入口导出，ESM 用户
   `import` 不到、script 用户更无从继承——而 `custom.md` 指引「继承
   `AutoSparkDirectiveBase`」，文档与代码自相矛盾；
2. **无发现机制**：引擎没有任何「插件脚本把指令递交给引擎」的通道。ESM 侧的
   `engine.directives.set` 要求先持有 engine 实例，script 插件（加载顺序不定、
   可先于/后于引擎构造）无法挂载；
3. **生态分发无受控语义**：运行时 `set` 静默覆盖任何同名指令（含预设）——插件
   生态中同名多数是意外，需要与实例级注册分叉的保护语义。

## 决策

### 1. 全局变量定名 `window.__AUTOSPARK_DIRECTIVES__`（dunder 形式）

它是**加载顺序握手协议**而非日常调用入口，dunder 形式传达这层语义（先例
`dataLayer`、`__VUE_HMR_RUNTIME__`），并避免与业务全局撞名。与 ADR-0030 的
`AutoSpark*` 品牌家族形式不一致，属有意例外，在此记档。

否决「挂 `AutoSparkSpaces` 命名空间」（如 `AutoSparkSpaces.directives`）：
tsup `globalName` 生成 `var AutoSparkSpaces = (...)()`，IIFE 加载会**整体覆盖**
预置对象——「先于引擎加载并往命名空间下推」必然被 clobber，独立全局不可回避。

### 2. 队列元素 = 指令安装器函数 `(engine: AutoSpark) => void`

术语定为**指令安装器**（Directive Installer，CONTEXT.md 收录）。每 engine
构造期调用一次，体内经 `install`/`set` 注册指令类。

否决「直接放指令类」：类定义时即要求基类已存在（加载顺序死锁），且失去多注册/
预处理灵活性。安装器体执行时引擎必已加载，天然免疫加载顺序。

### 3. 每 engine 构造期全量消费队列

消费点在构造内 `DirectiveManager` 创建之后、autostart compile 之前——安装器
注册的指令参与首次编译。就绪前 `install`/`set` 只入表，由 `initializeAll`
统一初始化（既有机制，零新增）。每个 engine 都全量消费（多 engine 页面各自
注册；幂等由 DirectiveManager 的 Map 语义 + `initialized` 集合保证）。

### 4. 惰性 Proxy 化：首个 engine 构造时执行一次性

首个构造时将 `window.__AUTOSPARK_DIRECTIVES__` 替换为 Proxy（`get` trap 仅包装
`push`）：push 写入底层后广播**存活 engine 表**（构造入表——在队列消费完成后，
杜绝 trap 命中未就绪 engine；`destroy` 摘除）。此后晚到的插件对已建 engine
即时生效；晚注册语义完全复用 `set` 既有通道（就绪后立即 initialize + Runtime
指令触发 dispatcher 重扫）。

否决「入口模块加载时 Proxy 化」：ESM `import` 即改写全局属副作用，配合
package.json 无 `sideEffects` 标记的现状会迫使打包器放弃 tree-shaking；且
首个构造前不存在存活 engine，惰性化零损失。无 window 环境（SSR）整体跳过。

### 5. Proxy 固有边角明码标价（文档约定，非机制堵死）

- **捕获引用绕过**：缓存原数组引用再 push 不经 trap，只影响未来 engine——
  约定「始终经 `window.__AUTOSPARK_DIRECTIVES__.push(...)` 触达」；
- **整体重赋值**：Proxy 化后 `window.__AUTOSPARK_DIRECTIVES__ = [...]` 丢失
  监听——约定禁止。

两者无法从机制上堵死（原生数组无拦截点），文档化是诚实且 sufficient 的处置。

### 6. 已编译树效果边界沿用 `set` 既有语义，文档化

Runtime 指令晚注册即时生效（observer 重扫）；Compile / Hybrid 晚注册只影响
未来编译（`engine.patch` 新区域、后续 `compile()`）。需要参与首次编译的场景：
`autostart: false` + 注册 + `start()`。

### 7. `set` 保持现状：静默覆盖任何同名（含预设）

「运行时注册自定义指令类以覆盖内置指令」是 `DirectiveManager` 的文档化特性，
实例级注册不动。

### 8. 新增 `engine.directives.install(name, Cls)`：受控语义三态

| 目标名 | 行为 |
| --- | --- |
| 预设指令名（`presetDirectives` 键） | warn + **跳过**（预设原类保留，调用方后续代码继续） |
| 其他已注册名（先装插件等） | warn + 覆盖（对齐 ADR-0058 icons 注册表先例） |
| 新名 | 静默注册（就绪衔接与 `set` 一致） |

否决「模块级执行 flag 拦截」（需在 `set` 里判上下文，隐式）；否决「收紧整个
`set`」（破坏决策 7 的既有特性）。安装器约定用 `install`；约束是**约定性的**
（安装器拿得到完整 engine，本就不是安全边界）。

### 9. 入口导出 `AutoSparkDirectiveBase` + `DirectiveKind`；删除死接口

`src/index.ts` 具名导出基类与通道枚举（script 经 `AutoSparkSpaces.*` 同名取用），
兼修 ESM 侧「文档指引继承却 import 不到」的既有矛盾。顺带删除入口导出的
`Directive` / `DirectiveBinding` 死接口（`init/update/destroy` 钩子形态与真实
基类完全不符，零内部引用，纯误导——script 用户会误以为该实现它）。

### 10. `AutoSpark.defineDirective(spec)`：定义即全局安装 + 最小 spec

造类（继承基类）→ 安装器入队（存活 engine 经 push trap 即时生效）→ 返回类
本身（可组合、可测试）。spec 为**最小键集**：`name`（必填，缺失抛错）、
`kind`、`priority`、六个实例钩子（`created`/`compile`/`destroy`/`mounted`/
`unmounted`/`attrChanged`）。

- 否决「纯工厂不注册」：script 两步走扼杀存在价值；
- 否决「全扩展面镜像」（`ownsChildren`/`elementName`/`initialize`/`dispose`/
  `singleton` 等）：结构指令等高级形态走类形态（决策 9 的基类导出已保障），
  最小集的文档解释成本远低于双形态维护税；键表即契约面，扩键可渐进。

命名取 `defineDirective` 而非 `createDirective`：内部已有 scope 编译期工具
`createDirectives`（复数），近名混淆；且 `define`（先声明后注册）与 `x-define`
（先声明后实例化）语义平行。挂 `AutoSpark` 静态成员（`AutoSpark.icons` 先例）。

### 11. ESM 侧不新增静态入口

ESM 用户已有实例级 `set`/`install`（更精准：哪个 engine 注册给哪个）与
`defineDirective`（全局队列在 ESM 同样可用）。否决 `AutoSpark.install` 静态
入口——内部「推队列 + 广播」函数已存在，是否升级为公开 API 等 ESM 多 engine
统一安装的真实诉求出现再说（YAGNI）。

### 12. 健壮性三件套

- **抛错隔离**：安装器逐个 try/catch + `logger.error`，单点失败不中断其它
  安装器与 engine 构造（对齐 `_initOne` 先例）；
- **destroy 摘除**：engine 销毁即摘出存活表，不触达晚到安装器；
- **重复消费幂等**：队列不清空（每 engine 全量重放），靠 Map 语义 +
  `initialized` 集合天然幂等，不做去重检测。

## 否决项备忘

| 否决项 | 理由 |
| --- | --- |
| 挂 `AutoSparkSpaces` 命名空间 | tsup globalName 整体覆盖预置对象（决策 1） |
| 队列直放指令类 | 加载顺序死锁（决策 2） |
| 模块加载时 Proxy 化 | 全局副作用伤 tree-shaking；惰性零损失（决策 4） |
| 机制堵死捕获引用/重赋值 | 原生数组无拦截点，文档约定 sufficient（决策 5） |
| flag 拦截预设名覆盖 | 隐式上下文；`install` 显式入口已覆盖（决策 8） |
| 收紧 `set` 覆盖语义 | 破坏文档化特性（决策 7） |
| `createDirective` 命名 | 与内部 `createDirectives` 近名混淆（决策 10） |
| spec 全扩展面镜像 | 双形态维护税（决策 10） |
| ESM 静态 `AutoSpark.install` | YAGNI（决策 11） |

## 影响

- 公共契约新增：全局变量 `__AUTOSPARK_DIRECTIVES__`（一次性定死）、
  `DirectiveManager.install`、`AutoSpark.defineDirective`、`DirectiveSpec`
  类型、入口导出面（基类/枚举/类型）；同时删除死接口 `Directive`/
  `DirectiveBinding`（breaking 仅波及误用死码的消费者）。
- 领域语言：CONTEXT.md 新增「指令安装器」「全局安装队列」「defineDirective」
  词条（`define` 与 x-define 的语义平行关系记入 Avoid）。
- 文档：`zh/guide/directive/custom.md` 重写为三示例渐进教程（入门 Runtime /
  进阶 Hybrid 反应式 / 高级结构指令，示例均经测试实证）；`index.md` 已注册
  列表以 `presetDirectives` 为准修正（原列表含已硬移除的 `icon-define`、
  缺约 20 个名位）。
- 实现落点：`features/directive/global-queue.ts`（机制核心）、
  `features/directive/manager.ts`（`install` + `_register` 提取）、
  `engine/engine.ts`（构造接线 + 静态方法 + destroy 摘除）、`src/index.ts`
  （导出面）、`types/index.ts`（死码删除）。
