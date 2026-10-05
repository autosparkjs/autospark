import type { AnyAutoStore, AutoStoreOptions, Dict, FastEvent } from "autostore";
import type { ActionDecl } from "./actions/types";
import type { TooltipOptions } from "./tooltip/types";
import type { MessageOptions } from "./messages/types";
import type { ComponentInstance } from "./component-instance";
import type { AutoSparkScope } from "./scope";

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
     * 作为 `scope.getComponentDeclaration` 查找链的**终点兜底**——scope 链无命中时查此。与局部组件
     * （x-define 声明、入参为 DOM）经同一条 `getComponentDeclaration` 链统一取用。供 x-loading 等内置
     * 消费者定制其默认 UI（如 `getComponentDeclaration("loading")`）。详见 ADR-0022。
     */
    components?: Record<string, any>;
    /**
     * 覆盖物引擎级默认（shell 机制，ADR-0062）：按消费者形态分键的默认 shell 组件名——
     * 「全站换肤」的单一配置点（逐实例经 `x-dialog-options.shell` / `x-popover-options.shell`
     * 覆盖；都没配用内置默认 `dialog-shell` / `popover-shell`）。
     *
     * @default 无（用内置默认 shell）
     */
    overlay?: Partial<Record<"dialog" | "popover" | (string & {}), { shell?: string }>>;
    /**
     * UI 外壳注册表（ADR-0077）：引擎级「带出口协议的骨架外壳」组件表——消息（`message`）
     * 与 overlay 家族（`dialog` / `popover` / `drawer`）的内置 shell 统一寄存处 + 用户引擎级
     * 覆盖面（同键浅覆盖，只影响对应消费者）。值为 HTML 模板字符串（懒预编译，与
     * `components` 同纪律）。
     *
     **构造期固化**：运行时突变不失效缓存（注册与选择分离——运行时换 shell 走消费者
     * 选择器，如 `messages.shell` 直写换键对后续操作生效）。
     *
     * 解析链（消费者选项 shell 名 → getComponentDeclaration 链（scope 局部 → `options.components`）→
     * 本表 → 消费者内置默认）。只收外壳语义组件（出口协议 + 公共骨架）——loading 块 /
     * error 组件 / tree-node / 消息 type renderer 不入此表。
     *
     * @default 内置四件种子 { message, dialog, popover, drawer }
     */
    uiShells?: Record<string, string>;
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
     * 全局消息（ADR-0071）：引擎级子系统 `engine.messages` 的全局默认。三态：
     *
     * - 缺省：默认开启 + 内置默认（pos top-right / delayClose 3000 / showCount 5 / slide）；
     * - `false`：**整体关闭**——不建容器、不注样式，`engine.messages`
     *   别名与内置 `toast` / `confirm` / `task` action 一并 warn + no-op（死句柄，不给半开状态）；
     * - 配置对象：全局默认（与单次调用 props 同构，单次覆盖全局；`showCount` / `maxLen` /
     *   `url` / `headers` / `icons` / `shell` / `kinds` 为管理器级键，仅本层生效）。
     *
     * @default 开启 + 内置默认（MessageOptions 各键见 ADR-0071 决策 4/15）
     */
    messages?: false | MessageOptions;
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

    // ── tooltip:* 工具提示（ADR-0061 决策 17，双通道之总线侧；浮层元素 dispatchEvent 同步广播） ──
    /** 工具提示显示（payload：el = 触发元素，tip = 浮层单例元素） */
    "tooltip:show": { el: HTMLElement; tip: HTMLElement };
    /** 工具提示隐藏（一切隐藏路径均广播：移出/聚焦离场/断连/stop/命令式） */
    "tooltip:hide": { el: HTMLElement; tip: HTMLElement };

    // ── message:* 消息（ADR-0071 决策 20，双通道之总线侧；卡片元素 dispatchEvent 同步广播） ──
    /** 记录创建（payload：message = 组件实例（ADR-0089），el = 卡片根元素，排队未挂为 null） */
    "message:add": { message: ComponentInstance; el: HTMLElement | null };
    /** 记录级补丁生效 / 同 id 原地更新 */
    "message:update": { message: ComponentInstance; el: HTMLElement | null };
    /** 展示挂载（进场动画发起时） */
    "message:show": { message: ComponentInstance; el: HTMLElement | null };
    /** 展示关闭（一切移除路径均广播：自动关闭 / hide() / delete() / clear() / destroy） */
    "message:hide": { message: ComponentInstance; el: HTMLElement | null };
    /** 已读置位（卡片任意点击 / markRead / markAllRead） */
    "message:read": { message: ComponentInstance; el: HTMLElement | null };
    /** 业务状态补丁（status 键变更） */
    "message:status": { message: ComponentInstance; el: HTMLElement | null };
    /** action 按钮点击（value 应答在此；anchor 存在时以发起子树为根额外派发，决策 14） */
    "message:action": {
        message: ComponentInstance;
        el: HTMLElement | null;
        action: { title: string; hide: boolean };
        value?: any;
    };
    // ── toast:* 轻提示旧事件（ADR-0068 决策 17；ADR-0071 迁移期兼容——type='toast' 双发，随别名退役） ──
    /** 轻提示显示（payload：toast = 组件实例（ADR-0089），el = 卡片根元素） */
    "toast:show": { toast: ComponentInstance; el: HTMLElement | null };
    /** 轻提示隐藏（一切移除路径均广播：自动关闭 / hide() / clear() / 原地更新替换 / destroy） */
    "toast:hide": { toast: ComponentInstance; el: HTMLElement | null };

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
    // payload name 与路径一致（方便通配订阅者）；不带 el/$event（避免持 DOM 引用泄漏）。
    /** async action 开始（action 返回 thenable 后同步广播；pending = "进行中"状态形容词） */
    "actions/*/pending": { name: string };
    /** async action 成功；result 为 resolve 值 */
    "actions/*/resolved": { name: string; result: any };
    /** async action 失败（reject 经内部 then 消费广播，消除 unhandled rejection） */
    "actions/*/rejected": { name: string; error: any };
}

export type AutoSparkPresetVars = {
    version?: string;
    language?: string;
};

export type AutoSparkVars = Record<string, any> & AutoSparkPresetVars;
