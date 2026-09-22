import type { AutoStore, AutoStoreOptions, Dict, FastEvent } from "autostore";
import type { ActionDecl } from "./actions/types";

/**
 * AutoStore 任意类型
 */
export type AnyAutoStore = AutoStore<any, any>;

/**
 * 指令接口
 *
 * 所有指令必须实现此接口，提供名称、优先级和生命周期方法。
 */
export interface Directive {
    /**
     * 指令名称
     *
     * @example 'text', 'html', 'if', 'for'
     */
    name: string;

    /**
     * 执行优先级
     *
     * 数字越大优先级越高，执行顺序越靠前。
     *
     * 典型优先级顺序：
     * - x-for: 100 (最高，需要先创建子元素)
     * - x-if: 80 (高，需要先决定是否渲染)
     * - x-bind, x-on: 50 (中)
     * - x-text, x-html, x-visible: 20 (低)
     */
    priority: number;

    /**
     * 初始化方法
     *
     * 当指令首次绑定到元素时调用。
     *
     * @param el - 绑定的 DOM 元素
     * @param binding - 指令绑定信息
     * @param store - AutoStore 实例
     * @returns 清理函数，可选的，用于在元素移除或指令销毁时清理资源
     */
    init(el: HTMLElement, binding: DirectiveBinding, store: AnyAutoStore): void | (() => void);

    /**
     * 更新方法（可选）
     *
     * 当依赖的状态变化时调用。
     * 如果指令不需要动态更新，可以不实现此方法。
     *
     * @param el - 绑定的 DOM 元素
     * @param binding - 指令绑定信息
     * @param store - AutoStore 实例
     */
    update?(el: HTMLElement, binding: DirectiveBinding, store: AnyAutoStore): void;

    /**
     * 销毁方法（可选）
     *
     * 当元素从 DOM 中移除或引擎销毁时调用。
     * 用于清理定时器、事件监听器等资源。
     *
     * @param el - 绑定的 DOM 元素
     */
    destroy?(el: HTMLElement): void;
}

/**
 * 指令绑定信息
 *
 * 包含指令在元素上的所有绑定数据。
 */
export interface DirectiveBinding {
    /**
     * 指令名称
     *
     * @example 'text', 'html', 'if'
     */
    directive: string;

    /**
     * 表达式字符串
     */
    expression: string;

    /**
     * 绑定的 DOM 元素
     */
    element: HTMLElement;
}

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
     * 构造期统一规范化为 `ActionDesc` 描述符存储（name 以注册键注入）。
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
     * 作为 `scope.getComponent` 查找链的**终点兜底**——scope 链无命中时查此。与局部组件
     * （x-component 声明、入参为 DOM）经同一条 `getComponent` 链统一取用。供 x-loading 等内置
     * 消费者定制其默认 UI（如 `getComponent("loading")`）。详见 ADR-0022。
     */
    components?: Record<string, any>;
    /**
     * 图标种子表（ADR-0046 决策 3）：构造期并入全局图标注册表（`AutoSpark.icons`，document 级
     * 多 engine 共享），同名 warn + 覆盖。值为 `名称 → SVG 字符串`（经规范形归一化存储）。
     * 声明入口三通道：本表 / 模板 `x-icon-define` / `AutoSpark.icons.add(name, svg)`。
     *
     * @default 无种子
     */
    icons?: Record<string, string>;
}

/**
 * AutoSpark 事件契约（信号面，见 ADR-0003）。
 *
 * 分层命名（`/` 分隔）+ 通配符订阅：消费者可精确订阅，亦可经 `*`/`**` 订阅一批同类。
 * 事件只承载**离散信号**——值留 `store.state`（数据面），控制流留命令调用（控制面）。
 *
 * emit 一律直接调继承自 FastLiteEvent 的 `engine.emit()`（按 type 查监听器，无该 type 订阅≈零成本）。
 */
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

    // ── patch/** 动态 patch（ADR-0002，本期占位） ──────────
    /** patch 前 */
    "patch/before": { id: number; templateEl: HTMLElement };
    /** patch 后 */
    "patch/after": { id: number };

    // ── component/** 组件注册（ADR-0022，供 x-use 监听异步 x-import 就绪） ──
    /** 组件注册（x-import fetch 完成注册后广播；name=组件名，供 pending 的 x-use 重新实例化） */
    "component/registered": { name: string; global: boolean };

    // ── render/** 调度 flush（热路径，emit 按 type 门控） ──────
    /** flush 前 */
    "render/flush/before": void;
    /** flush 后 */
    "render/flush/after": void;

    // ── actions/** async action 生命周期（buildAction 注册时自动包装） ──
    // <name> = action 函数名。通配：action 通配订阅抓任意 action 的开始/成功/失败（全局 loading / 错误 toast）。
    // 仅 async action（返回 thenable）广播；同步 action 不广播。流信号 plain（不 retain，ADR-0003 决策 6）。
    // payload name 与路径一致（方便通配订阅者）；不带 el/$event（避免持 DOM 引用泄漏）。
    /** async action 开始（action 返回 thenable 后同步广播；pending = "进行中"状态形容词） */
    "actions/*/pending": { name: string };
    /** async action 成功；result 为 resolve 值 */
    "actions/*/resolved": { name: string; result: any };
    /** async action 失败（reject 经内部 then 消费广播，消除 unhandled rejection） */
    "actions/*/rejected": { name: string; error: any };
}
