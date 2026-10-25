/**
 * 插件机制基础设施（ADR-0111）。
 *
 * script/IIFE 场景的第三方能力分发：插件 = 纯副作用脚本，经全局命名空间
 * `AutoSpark`（类与命名空间一体，jQuery `$` 同构）注册组件/指令/action/图标，
 * 并可经 `AutoSpark.ready(fn)` 拿 engine 实例做命令式操作。本模块是命名空间
 * API 的**通用后端**——ESM（挂类静态）与 IIFE（window 全局）同一份实现：
 *
 * - **ready 回调表**：per-engine 构造末尾各调一次（retain 语义——晚注册对存活
 *   engine 立即补调）；抛错隔离；destroy 摘除；
 * - **precompile 回调表**（ADR-0116）：per-engine 构造早期（template 克隆前）各调
 *   一次，**无 retain**——晚注册 no-op，错过即错过（首个 engine 的首编译不等人）；
 *   用途：插件在首编译前对 engine.el 做 DOM 预处理（如 router 的 x-outlet 简写
 *   transform 与默认出口插入）；抛错隔离；
 * - **存活 engine 表**：广播目标（晚到的指令安装器）；构造入表、destroy 摘除；
 * - **指令安装器队列**：模块内存数组（取代 ADR-0100 的 window 键队列——script
 *   顺序加载保证插件文件后于引擎脚本求值，队列不丢）；构造期全量消费，
 *   晚入队广播存活 engine；
 * - **插件声明表**：`components`（组件模板字符串）/ `actions`（action 声明）——
 *   真全局、可变普通对象。engine 查找链到顶**查询期委托**兜底查表：不复制进
 *   engine、无运行时广播，晚注册天然立即生效；
 * - **全局 def 缓存**：插件组件的编译产物跨 engine 共享（每组件名全局只编译
 *   一次，首个消费的 engine 编译，后续 engine 直接取缓存挂账）；
 * - **预加载队列**（ADR-0114）：`globalThis.__AUTOSPARK_PLUGINS__`——插件脚本先于
 *   autospark.js 加载时的投递通道，首个 engine 构造期 drain 并执行一次，回调收
 *   `(engine, autospark)` 双参（先于引擎加载的脚本闭包里拿不到 `AutoSpark`）。
 *
 * 分层：本模块不运行时引用引擎任何模块（engine 仅 type import）——global-queue
 * （指令域）与 engine 门面（组装根）单向引用本模块。命名空间对象由
 * `engine.constructor` 取得（类即命名空间，ADR-0111 决策 1），不破坏本分层。
 */
import type { AutoSpark } from "../../engine/engine";
import type { AutoSparkAction } from "../action/types";
import type { ComponentDef } from "../component/component-def";
/** 插件就绪回调：每个 engine 构造完成后各调一次（`AutoSpark.ready(fn)` 的元素形态） */
export type PluginReadyCallback = (engine: AutoSpark<any>, autospark: typeof AutoSpark) => void;
/**
 * 预加载队列元素（ADR-0114）：与 `PluginReadyCallback` 签名同形，语义不同——
 * 只在**首个** engine 构造期执行一次（插件脚本体），而非每 engine 各一次。
 * 第二参是必需的：插件脚本先于 autospark.js 求值，其闭包内拿不到 `AutoSpark`。
 */
export type PluginBootstrap = (engine: AutoSpark<any>, autospark: typeof AutoSpark) => void;
/**
 * 注册就绪回调（`AutoSpark.ready(fn)` 后端）：入表，并对所有**存活** engine 立即各补调
 * 一次（retain 语义——晚注册不丢已存在的 engine；尚无 engine 时仅入表待构造触发）。
 */
export declare function registerPluginReady(callback: PluginReadyCallback): void;
/** engine 构造末尾触发（engine.ts 在 `engine/ready` 事件发射处调用）：全部回调各调一次 */
export declare function firePluginReady(engine: AutoSpark<any>): void;
/**
 * 预编译回调：engine 构造早期（template 克隆前、store 建立前）各调一次
 * （`AutoSpark.precompile(fn)` 的元素形态）。
 */
export type PluginPrecompileCallback = (engine: AutoSpark<any>, autospark: typeof AutoSpark) => void;
/**
 * 注册预编译回调（`AutoSpark.precompile(fn)` 后端）：仅入表。
 *
 * **无 retain（刻意区别于 ready）**：回调只在「注册先于构造」的 engine 上各调一次；
 * 晚注册对已存在的 engine 是 no-op——错过即错过。首编译是不可重放的事件：entry 模板
 * 已编译完的 engine 上再做 DOM 预处理毫无意义（编译产物不回改源模板），retain 只会
 * 造成「看似生效实则无效」的假象，不如让错过显式可见。
 *
 * 执行时机（engine.ts 构造序）：el 解析后、template 克隆前——回调对 engine.el 的
 * DOM 改写进模板，随克隆参与首编译。bootstrap 约束同 ADR-0114 插件体：回调内
 * **只能注册与做纯 DOM 预处理**，不得触碰 `engine.store`（此刻尚未建立）。
 */
export declare function registerPluginPrecompile(callback: PluginPrecompileCallback): void;
/** engine 构造早期触发（engine.ts 在 drain 预加载队列后立即调用）：快照迭代，注册期新入队者不参与本轮 */
export declare function firePluginPrecompile(engine: AutoSpark<any>): void;
/** 指令安装器：安装队列元素形态（ADR-0100 决策 2 类型沿用）。每 engine 构造期调用一次 */
export type DirectiveInstaller = (engine: AutoSpark<any>) => void;
/**
 * 安装器入队（`$.directive` 两重载的共用后端）：入内存队列 + 广播全部存活 engine（晚注册即时
 * 生效——Runtime 指令重扫 / Compile 指令只影响未来编译）。抛错隔离：安装器执行失败
 * 记日志跳过，不中断其它安装器与调用方。
 */
export declare function enqueueDirectiveInstaller(installer: (engine: AutoSpark<any>) => void): void;
/**
 * 消费全局预加载队列 `globalThis.__AUTOSPARK_PLUGINS__`：插件脚本先于 autospark.js
 * 加载时无处注册，改为把「插件脚本体」本身包成函数推进该数组；engine 构造期在此
 * drain 并执行，回调收 `(engine, autospark)` 双参——其后即可像普通插件一样经
 * `$` 注册组件/指令/action/图标，需要 per-engine 行为的包进 `$.ready`。
 *
 * **一次性语义不靠模块级 flag**：drain = `splice(0)` 全量取出 + `Object.freeze` 原数组，
 * 之后队列恒为空且冻结——后续 engine 构造再调用本函数时取到空数组，自然什么都不做。
 * 状态活在全局数组里，本模块无新增可变状态（可测试性：重赋一个新数组即重置）。
 *
 * **为什么不静默**：ADR-0100 的 `window.__AUTOSPARK_DIRECTIVES__` 正是「push 进无人
 * 消费的数组，静默失效」被 ADR-0111 判死。冻结让晚到的 push 在严格模式直接抛
 * `TypeError`（非严格静默失败但 `Object.isFrozen()` 可检测），误用会响而不是哑。
 *
 * 边界：非数组（被别的代码赋脏）→ error 后忽略；非函数元素 → error 跳过；
 * 单个回调抛错 → 隔离记日志，不中断其余回调与 engine 构造；消费期间再入队的元素
 * 不参与本次消费（取的是 splice 快照，不是活迭代）。
 */
export declare function drainPluginBootstrapQueue(engine: AutoSpark<any>): void;
/**
 * engine 构造期接入（engine.ts 构造中 `DirectiveManager` 创建后、autostart compile 前
 * 调用——安装器先于首次编译注册，保证参与首次编译）：全量消费现有队列 → 本 engine
 * （消费幂等由 DirectiveManager 的 Map 语义 + initialized 集合保证），并入存活表。
 *
 * **预加载队列的 drain 已前移**（ADR-0116）：移至 engine 构造开头 el 解析后、template
 * 克隆前执行，drain 后立即 fire precompile 回调——插件体注册的 precompile 须赶在
 * template 克隆前对 engine.el 做 DOM 预处理，晚于此的改写不进模板。本函数因此不再
 * drain（ADR-0114 的 drain 唯一调用点移入 engine 构造序）。
 *
 * 活迭代（不快照）：安装器在消费期间再入队时，广播触达不了尚在构造、未入存活表的
 * 本 engine，活迭代补上这条通路。
 */
export declare function setupPluginQueue(engine: AutoSpark<any>): void;
/** engine.destroy 摘除存活表：销毁后不再触达晚到的安装器与就绪回调 */
export declare function unregisterPluginEngine(engine: AutoSpark<any>): void;
/**
 * 全局组件声明表（`AutoSpark.components` 的底层对象）：名字 → 模板字符串（与
 * `options.components` 同构的声明形态）。查询期委托：engine 查找链兜底读本表，
 * 晚注册天然立即生效；同名后注册覆盖先注册。
 */
export declare const pluginComponents: Record<string, string>;
/** 查声明表（engine `_resolveGlobalComponent` 查找链的插件层）：返回原始模板字符串 */
export declare function getPluginComponentRaw(name: string): string | undefined;
/** 声明表是否已有该名（`_hasGlobalComponentSource` 覆盖 warn 判据的一层） */
export declare function hasPluginComponent(name: string): boolean;
/** 读全局 def 缓存：`undefined` = 未编译过；`null` = 历史编译失败；def = 共享产物 */
export declare function takeSharedComponentDef(name: string): ComponentDef | null | undefined;
/** 写全局 def 缓存（编译成功回写产物、失败回写 null 标记） */
export declare function putSharedComponentDef(name: string, def: ComponentDef | null): void;
/**
 * 全局 action 声明表（`AutoSpark.actions` 的底层对象）：声明形态（函数简写 | 对象写法，
 * ADR-0036）。engine `getAction` 链末端兜底查表，命中即经**触发 engine** 的
 * ActionManager 惰性物化（规范化 + buildAction 包装绑定本 engine 的总线与生命周期
 * 广播）——同一声明在多实例中各绑定各的触发上下文，声明无状态即可安全共享。
 */
export declare const pluginActions: Record<string, AutoSparkAction>;
/** 查声明表（scope `getAction` 链末端的插件层） */
export declare function getPluginActionDecl(name: string): AutoSparkAction | undefined;
/** 删除声明表条目（惰性物化遇非法声明时清除，避免每次查找重复报错） */
export declare function deletePluginActionDecl(name: string): void;
