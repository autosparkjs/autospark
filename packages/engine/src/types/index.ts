import type { AutoStoreOptions, ComputedState, Dict, FastEvent } from "autostore";
import type { ActionDecl } from "../features/action/types";
import type { TooltipOptions } from "../features/tooltip/types";
import type { AutoSparkScope } from "../engine/scope";
import type { ViewportOptions, ViewportTier } from "../features/viewport/types";

/**
 * 渲染选项
 *
 * 传递给 AutoSpark 构造函数的配置选项。
 */
export interface AutoSparkOptions<State extends Dict = any> extends FastEvent.FastLiteEventOptions {
    /**
     * 自建 store 的配置：恒消费（第二参只收裸状态，ADR-0044），透传给 `_createStore` 的
     * `new AutoStore(state, storeOptions)`，两个字段带 engine 侧默认（消费者显式传入优先）：
     *
     * - `configManager` 三态：缺省 / `null` = engine 补内存空 `ConfigManager`（纯响应式 schema
     *   注册表，无持久化）；传 `ConfigManager` 实例 = 消费者自管（engine 不销毁）；`false` = 完全
     *   关闭（x-bind `@` / x-model 元数据注入走三层降级）。
     * - `configKey` 缺省补 `''`（fullKey 无前缀，`@` 配置路径与状态路径同形）。
     *   多个 store 共用同一 configManager 时必须显式配互异 configKey，否则 fullKey 撞车。
     *
     * @default configManager=engine 内存实例；configKey=''
     */
    storeOptions?: AutoStoreOptions<State>;
    /**
     * 是否启用调试模式
     *
     * @default false
     */
    debug?: boolean;
    /**
     *
     * 初始化时马上是否开始编译模板并生效
     *
     * true: 马上编译模板并生效
     * false: 需要后续调用compile方法进行编译
     */
    autostart?: boolean;
    /**
     * 全局事件 action 声明表。
     *
     * 值为声明形态（ADR-0036）：**函数简写**（`toggle(){...}`）或**对象写法**
     * （`{ title, icon, handle }`，`handle` 必需、其余自由元数据），两种写法可混用；
     * 构造期统一规范化为 `ActionDesc` 描述符存储（id 以注册键注入）。
     * `@click="name"` / `@click="name(args)"` 命中时，以 AutoSparkActionContext 为 this
     * 调用 `desc.handle`。作为 scope.getAction 查找链的终点；模板内
     * `<script type="autospark/actions">` 注入的局部 action 优先级更高（沿 scope parent 链先命中）。
     *
     * @default {}
     */
    actions?: Record<string, ActionDecl>;
    /**
     * 自定义 HTML 消毒器（x-html 默认消费，见 ADR-0005 决策 4）。
     *
     * 默认为内置极简 `sanitizeHtml`（剥 `<script>` / `on*` 事件属性 / 危险协议 URL，
     * 非无懈可击——mutation XSS / foreign content 等边角向量不在覆盖范围）。
     * 高安全场景注入 DOMPurify：
     * `new AutoSpark(el, store, { sanitizer: DOMPurify.sanitize })`。
     * x-html 的 `.raw` 修饰符会整体跳过此 sanitizer（原样写入 innerHTML）。
     *
     * @default 内置极简 sanitizeHtml（utils/sanitize.ts）
     */
    sanitizer?: (html: string) => string;
    /**
     * 全局组件表（ADR-0022）：声明全引擎复用的命名组件（字符串入参，懒预编译缓存）。
     *
     * **日常业务组件注册位**（ADR-0094 双注册位）：查找优先级高于 `options.builtinComponents`
     * ——一般定制内置组件（如接管 `dialog` shell、覆盖 `error`）应在本表写同名
     * 声明。作为 `scope.getComponentDeclaration` 查找链的终点兜底之一——scope 链无命中时先查
     * 本表、再兜底 `builtinComponents`。与局部组件（x-define 声明、入参为 DOM）经同一条
     * `getComponentDeclaration` 链统一取用。供 x-loading 等内置消费者定制其默认 UI（如
     * `getComponentDeclaration("loading")`）。详见 ADR-0022、ADR-0094。
     */
    components?: Record<string, any>;
    /**
     * 内置组件注册位（ADR-0094）：随引擎发行的默认全局组件（`components/index.ts` 种子表）的
     * 独立保存处。构造期 `{ ...内置种子表, ...本表 }` 合并，同名覆盖、追加自由；查找优先级
     * **低于** `options.components`。
     *
     * **设计动机**：`components` 是日常业务注册位，内置默认独立保存以**避免被业务配置流意外
     * 覆盖**——供明确接管框架内建件（如全站换 shell）时使用；一般定制请走 `components` 同名
     * 覆盖。构造期配置语义：运行时突变不失效缓存。
     *
     * @default 内置种子表全量（dialog/popover/drawer/error 四件；通知族已随通知插件迁出）
     */
    builtinComponents?: Record<string, string>;
    /**
     * 覆盖物引擎级默认（shell 机制，ADR-0062）：按消费者形态分键的默认 shell 组件名——
     * 「全站换肤」的单一配置点（逐实例经 `x-dialog-options.shell` / `x-popover-options.shell`
     * 覆盖；都没配用内置默认 shell 裸键 `dialog` / `popover`，ADR-0094）。
     *
     * @default 无（用内置默认 shell）
     */
    overlay?: Partial<Record<"dialog" | "popover" | (string & {}), { shell?: string }>>;
    /**
     * 图标种子表（ADR-0058 图标域的全局通道）：构造期并入全局图标注册表（`AutoSpark.icons`，
     * document 级多 engine 共享，注入全局 symbol `as-{name}`），同名静默覆盖。值为
     * `名称 → SVG 字符串`。声明入口三通道：本表 / 模板 `x-icons.global` / `AutoSpark.icons.add(name, svg)`。
     *
     * @default 无种子
     */
    icons?: Record<string, string>;
    /**
     * 全局工具提示（ADR-0061）：`data-tooltip` 属性约定驱动，引擎树内零声明生效
     * （`title` 编译期自动转换）。三态：
     *
     * - 缺省：默认开启 + 内置默认（placement top / arrow / border / slide）；
     * - `false`：**整体关闭**——`title` 转换、委托监听、命令式 `engine.tooltip` 全关
     *   （原生 tooltip 行为保留；命令式调用 warn + no-op）；
     * - 配置对象：全局默认（与元素级保留键同构，元素级 `data-tooltip="{...}"` 覆盖全局）。
     *
     * @default 开启 + 内置默认（TooltipOptions 各键见 ADR-0061 决策 8）
     */
    tooltip?: false | TooltipOptions;
    /**
     * 全局视口特性（ADR-0105）：ViewportManager 的引擎级配置。三态：
     *
     * - 缺省：默认开启 + 内置 Bootstrap 5 断点表（构造期同步注入 `state.$.viewport`
     *   初值 + 根元素 `data-viewport`，跨档响应式更新——模板任意位置 `$.viewport==='md'`
     *   直接订阅）；
     * - `false`：**整体关闭**——不建 mql 监听、不写 `$.viewport`、不挂 `data-viewport`
     *   （x-container 的 media 视觉约束与 JS 无关，照常生效）；
     * - 配置对象：`breakpoints` 是 **engine 级唯一阈值真相**（ViewportManager 判定与
     *   x-container media 样式同源消费），`maxWidths` 为 x-container 的 engine 级兜底表
     *   （实例 `x-container-options` 优先）。
     *
     * 构造期配置语义：运行时突变不生效。
     *
     * @default 开启 + 内置 Bootstrap 5 断点表
     */
    viewport?: false | ViewportOptions;
}

/**
 * AutoSpark 事件契约（信号面，见 ADR-0003）。
 *
 * 分层命名（`/` 分隔）+ 通配符订阅：消费者可精确订阅，亦可经 `*`/`**` 订阅一批同类。
 * 事件只承载**离散信号**——值留 `store.state`（数据面），控制流留命令调用（控制面）。
 *
 * emit 一律直接调继承自 FastLiteEvent 的 `engine.emit()`（按 type 查监听器，无该 type 订阅≈零成本）。
 */
// ── engine.patch 内容投放模式（ADR-0109 承接 ADR-0002） ──────────
/** patch 更新回调：接收命中的模板元素，返回值决定重建语义（replace 模式四态） */
export type AutoSparkPatchUpdater = (
    templateEl: HTMLElement,
) => Node | string | null | undefined;
/** patch 内容：字符串（HTML 片段，可多顶层节点）/ 节点（引擎接管并移入模板树）/ 更新回调 */
export type AutoSparkPatchContent = string | Node | AutoSparkPatchUpdater;
/** patch 投放模式：replace=替换命中元素本身 | inner=清空容器子级后放入 | prepend/append=容器首/末子级插入 */
export type AutoSparkPatchMode = "replace" | "inner" | "prepend" | "append";
/** patch 选项 */
export interface AutoSparkPatchOptions {
    /** 投放模式，缺省 replace */
    mode?: AutoSparkPatchMode;
    /**
     * 容器内锚点元素（CSS 选择器，仅 prepend/append 生效）：指定时插入到锚点前（prepend）/
     * 后（append）。须命中容器内 **scope 元素**（否则 warn + no-op）；为空 = 容器首/尾。
     * inner/replace 忽略此值。
     */
    ref?: string;
}

export interface AutoSparkEvents {
    // ── engine/** 引擎生命周期 ──────────────────────────────
    /** 引擎初始化完成（retain：晚订阅者补拿） */
    "engine/ready": { el: HTMLElement };
    /** 编译前（payload.cancel 可被监听者置 true 否决） */
    "engine/compile/before": { root: HTMLElement; cancel?: boolean };
    /** 编译后 */
    "engine/compile/after": { root: HTMLElement };
    /** 销毁前 */
    "engine/destroy/before": void;
    /** 销毁后 */
    "engine/destroy/after": void;

    // ── scope/** scope 通道生命周期（id = scope.id，按 payload 过滤） ──
    /** scope 创建 */
    "scope/created": { id: number; el: HTMLElement; template: HTMLElement };
    /** scope 编译完成（全部指令 created+compile 跑完） */
    "scope/compiled": { id: number };
    /** scope 销毁 */
    "scope/destroyed": { id: number; scope: AutoSparkScope };
    /** engine.data() 更新了某 scope 的数据 */
    "scope/data-updated": { id: number; data: Record<string, any> };

    // ── tooltip:* 工具提示（ADR-0061 决策 17，双通道之总线侧；浮层元素 dispatchEvent 同步广播） ──
    /** 工具提示显示（payload：el = 触发元素，tip = 浮层单例元素） */
    "tooltip:show": { el: HTMLElement; tip: HTMLElement };
    /** 工具提示隐藏（一切隐藏路径均广播：移出/聚焦离场/断连/stop/命令式） */
    "tooltip:hide": { el: HTMLElement; tip: HTMLElement };

    // ── notifications/<type>/<id>/<verb> 通知事件键已随通知插件迁出（@autospark/components
    //    ADR-0001）——由插件的 types/augment.ts 声明合并提供；未装插件时无此键。 ──

    // ── directive/** 指令生命周期（<name> 占位，跨主体通配） ──
    // scope 通道（Compile/Hybrid）：带 scope.id
    /** 指令 created（scope 通道） */
    "directive/*/created": { name: string; id: number };
    /** 指令 compile（scope 通道） */
    "directive/*/compiled": { name: string; id: number };
    /** 指令 destroy（scope 通道） */
    "directive/*/destroyed": { name: string; id: number };
    // observer 通道（Runtime/Hybrid）：带 el，无 scope.id
    /** 指令 mounted（observer 通道） */
    "directive/*/mounted": { name: string; el: HTMLElement };
    /** 指令 unmounted（observer 通道） */
    "directive/*/unmounted": { name: string; el: HTMLElement };
    /** 指令属性值变化（observer 通道） */
    "directive/*/attr-changed": { name: string; el: HTMLElement; newVal: string; oldVal?: string };

    // ── engine/patch/** 动态 patch（ADR-0002 引入；投放模式与载荷 mode ADR-0109） ──────────
    /** patch 前（mode：replace/inner/prepend/append） */
    "engine/patch/before": { selector: string; el: HTMLElement; mode: AutoSparkPatchMode };
    /** patch 后 */
    "engine/patch/after": { selector: string; mode: AutoSparkPatchMode };

    // ── components/<名>/registered 组件注册（ADR-0085 按名动态键 + retain 保留事件） ──
    /**
     * 组件注册成功广播：事件键 = `components/${组件名}/registered`，五条注册路径（本地 x-define /
     * 继承解析 / x-import 远程 / 全局组件懒预编译首解析）成功即发，载荷 `{ name, global }`。
     * **retain**——订阅晚于注册也立即补发（组件依赖方不漏听）；通配符订阅即补发全部已注册名。
     * 发射处 `as any`（`directive/*` 同法）；旧单数全局事件 `component/registered` 已移除（硬切）。
     */
    "components/*/registered": { name: string; global: boolean };

    // ── render/** 调度 flush（热路径，emit 按 type 门控） ──────
    /** flush 前 */
    "render/flush/before": void;
    /** flush 后 */
    "render/flush/after": void;

    // ── actions/** async action 生命周期（buildAction 注册时自动包装） ──
    // <name> = action 函数名。通配：action 通配订阅抓任意 action 的开始/成功/失败（全局 loading / 错误 toast）。
    // 仅 async action（返回 thenable）广播；同步 action 不广播。流信号 plain（不 retain，ADR-0003 决策 6）。
    // payload id 与路径一致（方便通配订阅者）；不带 el/$event（避免持 DOM 引用泄漏）。
    /** async action 开始（action 返回 thenable 后同步广播；pending = "进行中"状态形容词） */
    "actions/*/pending": { id: string };
    /** async action 成功；result 为 resolve 值 */
    "actions/*/resolved": { id: string; result: any };
    /** async action 失败（reject 经内部 then 消费广播，消除 unhandled rejection） */
    "actions/*/rejected": { id: string; error: any };
}

/**
 * 引擎预置元变量（`state.$` 的引擎自有字段，ADR-0105）。
 *
 * - `viewport`：当前视口档位，构造期同步写初值、跨档响应式更新（`ViewportTier` 六档）。
 * - `version` / `language`：预留位，**当前无任何运行时写入方**——故为可选。
 */
export type AutoSparkPresetMeta = {
    name?: string
    title?: string
    description?: string
    version?: string;
    language?: string;
    viewport: ViewportTier;
};

/**
 * `state.$` 元状态容器的公共类型：**引擎预置字段 + 消费者声明合并接缝**。
 *
 * 消费者经 `declare module` 往本 interface 追加自己的元变量（`AutoSparkPresetVars` 是
 * 引擎自有部分，不直接合并）：
 *
 * ```ts
 * declare module "autospark" {
 *     interface AutoSparkMeta { tenant: string }
 * }
 * ```
 */
export interface AutoSparkMeta extends AutoSparkPresetMeta { }

/**
 * engine 根状态的完整类型：`store.state` / `engine.state` / `*.globalState` 共用同一
 * 命名类型（ADR-0112），保证这几条通道对 `$` 的认知不漂移。
 *
 * `$` 标为**必选**是刻意取舍（ADR-0112）：默认配置下 ViewportManager 构造期必注入，
 * 裸写 `engine.state.$.viewport` 是主流用法；`options.viewport === false` 或环境无
 * `matchMedia` 时该容器**不注入**——类型在此配置下为已知偏差，读取方自担。
 */
export type AutoSparkState<State extends Dict = Record<string, any>> = ComputedState<State> & {
    /**
     * 引擎元状态容器（严格保留键 `$`，ADR-0105）：框架私有响应式数据根，`$.viewport`
     * 为首个居民，后续引擎内部数据逐步迁入。
     *
     * **例外**：`options.viewport === false` 或环境无 `matchMedia` 时不存在（`undefined`）。
     */
    $: AutoSparkMeta;
};

// `?raw` 静态资源导入的类型声明住 src/types/raw.d.ts（ADR-0091/0094）——本文件是模块
// （有顶层 export），declare module 在此为 augmentation 形态，wildcard 模式声明无效。
