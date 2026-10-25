import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { ComponentDef } from "../features/component/component-def";
/**
 * x-component：组件实例化指令（ADR-0054 更名自 x-use，实例化机制承接 ADR-0022 决策五）。
 *
 * 在模板中实例化一个已声明的组件（局部 x-define 或全局 options.components）。语法：
 * - **属性参数承载组件名**：`x-component:counter`——静态、编译期可知，不支持响应式切换组件
 *   （条件切换用外层 x-if，ADR-0054 决策二）；**可省略**——省略时值专职远程组件 url（下述三分）；
 * - **值语义三分（ADR-0110）**：指令值按**文本形态**消歧（与 loader 通道同源的 isLiteralLoaderUrl
 *   判定——props 表达式永不以 url 前缀字符开头，文本级零歧义）：
 *   1. 值命中字面量 url（`/` `./` `../` `http(s)://` `file://` 开头）→ 远程组件直载；
 *   2. 无属性参数 → 值专职 url：字面量直载，否则表达式 watch 求值（string→url、object→loader
 *      配置、null→静默、undefined 且值为纯标识符形态 → 一次性迁移提示）——**响应式 url 简写**；
 *   3. 其余（有参）→ props 表达式（ADR-0054 决策三，三形态不变：无值/对象字面量/纯状态路径）。
 * - **props 选项通道（ADR-0110）**：`x-component-options.props`（整包静态或成员属性表达式——
 *   后者经 watch 响应式）与指令值 props **双源合并**：`Object.assign(optionsProps, 指令值)`——
 *   options.props 打底、指令值覆盖同名键；无效源（标量/数组 warn）按缺失处理、另一源独走；
 *   url 形态下指令值被占用，props 单源 = options.props；
 * - props **单向**注入组件 data 域（后于 data() 默认覆盖，R1=A 合并顺序），值变时 `Object.assign`
 *   更新出现键，组件内绑定经 getContext 重读自动刷新；组件内部状态不被重置、不回写外部状态。
 *
 * **loader 配置平铺归一（ADR-0110）**：url 取值优先级 指令值 > `options.loader.url`（双声明 warn
 * + 指令值胜）；`fallback`/`error`/`width`/`height`/`request` 平铺读 `x-component-options` 顶层
 * 同名键（成员属性形态天然响应式），同名键平铺层 > loader 对象内嵌层；loader 对象形态保留兼容。
 * 无参 url 返回多组件：取文档序首个 + warn（per-url 去重），显式指定用 `x-component:名称="<url>"`。
 *
 * **loading 合成协议与元键（ADR-0126）**：缺省 fallback 时合成 `x-loading` 遮罩（`loading` 选项
 * `false` | 文案字符串 | 配置子集，显式 `fallback` 声明即不合成遮罩），显隐走共享层
 * {@link createLoadingMask}（守卫：宿主手写 x-loading 不合成不触碰；所有权闸 + toggle 协议）；
 * 元键 `$loading`/`$error` 注入宿主 scope locals（{@link injectLoadMeta}），时序：发起/重试置
 * `$loading=true` 清 `$error` → 成功/失败落地翻转（失败落 normalizeLoadError 归一错误）。
 *
 * **实例级边界覆盖（ADR-0110，extends x-define-options）**：`x-component-options.open`/`dataContext`
 * 与作者侧 x-define-options 同键——显式布尔 open（含 false）**覆盖** def.open（三级优先级：消费
 * 显式声明 > 作者声明 > 默认封闭）；dataContext 仅在生效 open 下有效（沿用 ADR-0053 校验）。
 *
 * 其余机制（承接原 x-use）：
 * - 取组件冻结快照（经 `scope.getComponentDeclaration(name)` 沿链就近 + 全局兜底）；
 * - **宿主化身组件根**（T4=B）：复用宿主节点身份，清空其原内容、编译组件快照子树挂入；
 *   宿主属性继承到组件根（class 合并拼接、style 合并冲突键组件根优先、其他属性不覆盖；
 *   x-define 声明族属性不复制）；
 * - **子节点收为插槽内容**（ADR-0056）：宿主子节点在 `_instantiate` 懒收集为 content map，
 *   投影到组件模板的 `x-slot` 出口；无对应出口 warn 丢弃（不再「前缀编译」）。
 * - 组件语义：`compileChild` 传 componentDef，注入 data()/methods/hooks、置 isComponent=true。
 *
 * **结构指令冲突（U3）**：与 ownsChildren 指令（x-if/x-for/x-isolate/x-switch/x-tree）同元素
 * → 编译期 warn + 拒绝实例化（宿主原内容保持，不破坏渲染）。本指令自身声明 `ownsChildren`（ADR-0056
 * 子节点收为插槽内容），同元素时 `_resolveOwnership` 豁免通用多 owner 抛错——U3 检测留在 created
 * 友好 warn 路径，对既有行为无感。
 *
 * **递归保护（T5=A）**：组件模板内 `x-component:自身名` 实例化自身（树形/菜单组件）。沿 scope 链
 * 向上统计同名组件实例化深度，超上限（默认 100）warn + 停止，防无限递归。
 *
 * **异步占位（R6=B）**：组件定义尚未加载（x-import fetch 中）时，宿主显示 loading 态；
 * 就绪后替换为组件实例。当前阶段实现同步路径（组件已注册即实例化），异步占位在 x-import 阶段补全。
 *
 * @example 实例化组件（无 props）
 * <div x-component:counter></div>
 * @example 传 props（对象字面量，成员可引用状态路径）
 * <div x-component:counter="{ count: 100, label: order.label }"></div>
 * @example 绑定状态对象（按键展开为 props，深层响应）
 * <div x-component:counter="order"></div>
 * @example 远程组件直载（url 简写 + props 选项通道）
 * <div x-component="./components/detail.html" x-component-options.props="{ id: order.id }"></div>
 * @example 多组件远程内容显式指定（url 占用指令值，props 走选项通道）
 * <div x-component:detail="./components/pages.html" x-component-options.props="{ id: order.id }"></div>
 */
export declare class ComponentDirective extends AutoSparkDirectiveBase {
    /** 介于结构指令（if=80/for=100）之下、普通指令之上，保证组件实例化在兄弟指令前执行 */
    static readonly priority = 70;
    static readonly singleton = true;
    /**
     * 永远占有子树（ADR-0056 决策八内容侧收集）：宿主子节点是**插槽内容**（模板态），
     * 由 `_instantiate` 懒收集进 content map、不进通用 walk——避免「前缀编译」bug。
     * （x-dialog/x-overlay 经 OverlayDirective 覆写为 false，宿主子节点保留，见 ADR-0056 决策十。）
     *
     * 与 x-for 等同元素时 `_resolveOwnership` 豁免多 owner 抛错（U3 友好 warn 留在 created）。
     */
    static ownsChildren(): boolean;
    /** 递归实例化深度上限（T5=A，防无限递归；overlay 基座共享） */
    protected static readonly MAX_DEPTH = 100;
    /** 当前实例化的组件实例 scope（destroy 时级联销毁） */
    private instanceScope;
    /**
     * 当前实例化的组件名（属性参数静态承载，ADR-0054：恒定不变，无换名重实例化）。
     * null = 无参 url 简写（ADR-0110）尚未从远程清单定格（加载完成后取首个或校验参数名）。
     */
    private componentName;
    /** 当前实例化的组件 def（缓存，props 更新时复用） */
    private instanceDef;
    /** pending 组件名（异步加载中，组件未就绪；监听 components/<名>/registered 后重试实例化，R6=B） */
    protected pendingName: string | null;
    /** pending 期间的 props（组件就绪重试时复用） */
    protected pendingProps: Record<string, any> | undefined;
    /** components/<名>/registered 监听解绑函数集（点号名候选全集一键一订，ADR-0088 pending 修订） */
    private registeredUnsubs;
    /** 当前监听的事件名集：候选集变化时比对重订（订阅键即过滤） */
    private _pendingEventNames;
    /** loader 激活标志：created 解析到 loader 声明后置位，接管实例化时序（props watch 只记 pending） */
    private _loaderActive;
    /** 当前 loader 配置（retry 重取时复用） */
    private _loaderCfg;
    /** 当前已加载 url（响应式重求值的同 url 去重位） */
    private _loadedUrl;
    /** 在途加载的 AsyncLoader 实例（ADR-0121：url 变化 / scope 销毁时 abort，落地身份校验丢弃过期结果） */
    private _loader;
    /** 合成遮罩句柄（ADR-0126 共享层）：守卫 / 所有权闸 / toggle 显隐状态内聚，宿主元素恒定故惰性创建一次 */
    private _loadingMask;
    /** pending props（loader 加载完成前 props watch 的暂存，完成后随实例化应用） */
    private _pendingProps;
    /** 占位块（fallback/error 组件）编译 scope（随宿主 scope.destroy 递归销毁，此处仅断引用） */
    private _placeholderScope;
    /** props 选项通道最新值（x-component-options.props：整包静态或成员属性表达式） */
    private _optionsProps;
    /** 指令值通道最新 props（纯 props 通道求值产物；url 形态下恒 undefined） */
    private _directiveProps;
    /** 无参 url 简写的表达式文本（undefined 迁移提示的形态判定用；非表达式通道为 undefined） */
    private _urlExprText;
    /** undefined url 迁移提示已发标志（一次性，防响应式重求值刷屏） */
    private _missingUrlWarned;
    /** 多组件取首个的 warn 去重位（per-url：同 url 重入不刷屏，url 变化重新提示） */
    private _multiWarnedUrl;
    /** 无参 url 简写形态（ADR-0110）：组件名非静态——每次加载从远程清单重新决策 */
    private _anonymousUrl;
    /** .global 修饰符（ADR-0065 决策二：`x-component:名.global` 经解析期注入 options.global） */
    private get _globalMode();
    created(): void;
    /**
     * 点号组件名重建（ADR-0088，pending 场景可重跑）：指令解析器把属性参数的句点段切为
     * 修饰符（`x-component:autospark.notifications.actions` → attr="autospark" + modifiers），
     * 而组件名合法含点（`autospark.*` 引擎保留命名空间，ADR-0083）——按**升序候选回溯**
     * 拼接：attr 起逐段并入修饰符试查组件表，首个命中者即组件名；短名优先命中时点号段保持
     * 修饰符语义（`x-component:counter.global` 的 .global 不受影响）。
     *
     * 编译期（created）单次回溯的盲区：组件注册晚于编译（注入模式 registerComponent /
     * x-import 异步加载）时全部候选 miss，名字定格在截断短名——pending 重试时经
     * {@link _retryPendingComponent} 重跑本方法，注册表已变则回溯升级为全名。
     */
    private _resolveComponentName;
    /**
     * 点号候选全集（升序）：`attr`、`attr.m1`、…、全串——pending 等待的注册事件键集
     * （截断名与全名任一注册到来都能解锁重试，重试时回溯重判）。无修饰符时为单键。
     */
    private _componentNameCandidates;
    /**
     * 同元素是否含其他 ownsChildren 结构指令（U3 冲突检测）。
     *
     * 经 engine.directives 查各指令类的静态 `ownsChildren(info)`——与 compiler._resolveOwnership
     * 同源判定，但不触发通用报错，而是 warn + 跳过实例化。
     */
    private _hasStructuralConflict;
    /**
     * 同元素是否含覆盖物消费者（x-dialog 等，ADR-0056 决策十修订）。
     *
     * 经实例构造器的静态 `overlayConsumer` 判定（OverlayDirective 家族唯一覆写点）——
     * 与 `_hasStructuralConflict` 的按注册表查类同源，但**不 import overlay** 以避循环依赖。
     */
    private _hasOverlayConsumerSibling;
    /**
     * props 选项通道初始化（ADR-0110）：成员属性表达式（响应式，优先，overlay 基座同款）→
     * 整包内嵌静态 props 回退（无 watch 无热更新，作初始值）。
     */
    private _initOptionsProps;
    /**
     * props 值归一（指令值通道与 options.props 通道共用）：
     * - 对象 → 原样；
     * - null / undefined → undefined（如绑定的状态对象尚未就绪，静默）；
     * - 标量 / 数组 → warn 忽略（值必须是对象形态之一，数组无键值语义）。
     */
    private _normalizeProps;
    /** props 选项通道值变化（ADR-0110）：归一 → 存源 → 双源合并提交 */
    private _onOptionsProps;
    /**
     * 指令值通道 props 变化处理（组件名静态，无换名重实例化分支，ADR-0054）。
     * 归一后存源，实例化/更新时机统一交 {@link _commitProps}（双源合并，ADR-0110）。
     */
    private _onValueChange;
    /**
     * props 双源合并提交（ADR-0110）：`Object.assign(optionsProps, 指令值)`——options.props
     * 打底、指令值覆盖同名键；单源缺失时另一源独走。合并结果经既有防抖/更新协议应用：
     *
     * 已实例化 → 仅更新 props（覆盖声明键，组件内部状态不被重置）。
     * props 与上次应用值浅等则跳过：静态字面量 props（无状态路径）的表达式支路 watcher
     * 订阅为空 deps（autostore watch([]) = 任意状态变化触发），每次重求值产生键值相同的
     * 新对象——若照常 assign 会把组件内部交互状态重置回 props 字面量（counter demo 场景：
     * 点击 + 后 count=105 被打回 100）。值没变就不是更新（ADR-0054 决策三）。
     */
    private _commitProps;
    /** 指令值 url 与 options.loader 双声明 warn（ADR-0110：url 优先级指令值 > options.loader.url） */
    private _warnDualLoaderDeclaration;
    /**
     * loader 场景的 props 订阅（ADR-0065）：值变化仅更新 pending（实例化时机归 loader）。
     * 无值 = 无 props（不订阅，与原流程一致）。
     */
    private _watchPropsOnly;
    /**
     * 应用 loader 声明（ADR-0065）：值形态归一 + 平铺键合成 + 同 url 去重后发起加载。
     *
     * 值三态：string → url 简写（归一 `{ url }`）；对象 → 配置原样；null → 静默（绑定状态未
     * 就绪，对齐 props 绑定 nullish 静默先例）；undefined → 静默，但值为纯标识符形态时一次性
     * 迁移提示（疑似旧组件名写法 `x-component="counter"`，指回属性参数，ADR-0110）；其余 → warn。
     *
     * 平铺归一（ADR-0110）：`fallback/error/width/height/request` 平铺读 `x-component-options`
     * 顶层同名键（getOption 表达式层 > 整包 > 宿主），同名键平铺层 > loader 对象内嵌层。
     */
    private _applyLoader;
    /**
     * 执行 loader 加载（ADR-0065 决策三/四 + ADR-0121 收编）：清旧内容 → 占位（fallback/x-loading
     * + 尺寸）→ 经统一内核编排 fetch 注册（已注册仍 fetch，「以此 url 为准」）→ 同名校验 →
     * 实例化；失败 → 统一错误路径。url 响应式变化重入本方法：abort 旧 loader、销毁旧实例子树
     * （组件内部状态丢失）。
     */
    private _runLoader;
    /**
     * 手动重试弹药（ADR-0121 决策 4）：执行体 = 当前 loader 的 `refresh()`（在途先中止再重启），
     * 落地与首取同路径。
     */
    private _retryLoader;
    /**
     * 统一落地点（ADR-0121）：成功 → 组件名决策（anonymous 取首 / 多组件 warn / 同名校验）→
     * 实例化；失败（重试耗尽）→ 错误归一 + `_renderLoaderError`；校验类失败同样走统一错误路径。
     * 主动 abort（AbortError）静默丢弃（决策 3）。
     */
    private _wireLoaderLanding;
    /**
     * 渲染占位呈现（ADR-0065 决策六，fallback/error 共用协议）：
     * HTML 字符串静态插入（不编译）；`{name, props}` 引入具名组件（用户 props 与引擎注入
     * 上下文 `ctx` 合并、引擎注入优先）；组件未注册 warn + 回退默认 x-loading 占位。
     */
    private _renderPlaceholder;
    /**
     * 呈现加载失败（ADR-0065 决策六/七 + ADR-0121 决策 5）：自定义 error 声明走占位协议；
     * 缺省渲染内置 error 组件（getComponentDeclaration(ERROR_COMPONENT_NAME) 沿链 + 全局兜底
     * → 构造器默认内置），注入 error/message 与 retry/close 闭包（back 按钮走内置 action，
     * 无需注入）。error 不自愈——恢复途径仅 url 变化（响应式重入）或 retry。
     * ADR-0121：错误归一 + dispatchLoadError 派发 + x-error 在场退位；retry 统一走 loader.refresh()。
     */
    private _renderLoaderError;
    /**
     * 清空宿主内容（loader 加载前 / url 变化重实例化 / retry/close）：销毁宿主 el 内的子树
     * scopes（组件子树 / 占位块编译产物——均为宿主 scope 的直接 children，child.destroy 递归
     * 销毁孙辈并从父 children 移除自身；拷贝防遍历中 Set 变异）+ 清 DOM + 清占位尺寸与 x-loading。
     */
    private _clearHostContent;
    /** 应用加载中占位尺寸（宿主临时 inline style，防布局跳动；成功与出错均移除） */
    private _applyPlaceholderSize;
    /** 移除占位尺寸 */
    private _removePlaceholderSize;
    /**
     * 组件查找 + def 反查（x-component 与 overlay 基座共享）。
     *
     * 快照经 `scope.getComponentDeclaration(name)`（scope 链就近 + 全局兜底）；def 反查：
     * 作用域组件经 `_componentDefs`（WeakMap，snapshot 为 key）、全局组件经
     * `_globalComponentDefCache`（按 name）——getComponentDef 对全局 snapshot 返回 undefined，
     * 须 fallback getGlobalComponentDef，否则全局组件的 setup(data/methods/hooks) 丢失、不注入。
     *
     * @returns `{ snapshot, def }`；未命中返回 null（调用方决定等待/警告行为）
     */
    protected _findComponentDef(name: string): {
        snapshot: HTMLElement;
        def: ComponentDef | null;
    } | null;
    /**
     * 实例化组件：宿主 scope 化身组件实例 + 编译组件快照子树。
     *
     * 复用宿主 scope（this.binding）作组件实例 scope，避免同一宿主双 scope 冲突（T4=B 宿主化身组件根）：
     * 1. 注入组件语义（data/methods/hooks/isComponent）到宿主 scope；
     * 2. 属性继承（宿主普通属性保留，组件快照根属性并入，class/style 合并）；
     * 3. compileSubtree 编译组件快照子树到宿主（快照内指令建子 scope，watch 时读到注入的 data）；
     * 4. 手动触发 created/mounted hooks（宿主 scope 的 compile() 已早于组件注入跑过，hooks 须补触发）。
     */
    protected _instantiate(name: string, props: Record<string, any> | undefined): void;
    /** 声明方自身 def.slots（warn 纪律用，ADR-0125）：首次判定时缓存——重实例化时宿主 scope
     * 已被注入内层组件语义（isComponent），届时沿链上溯会误指内层组件 */
    private _declarerSlots;
    /**
     * 解析插槽转发声明（ADR-0125 决策二/三）：`x-component-options.slots`——静态值，
     * 编译期一次解析不响应式。读取优先级：成员属性原文（`x-component-options.slots="…"`）
     * > 显式选项值（`x-component-options="{slots:…}"` / 宿主 x-options 回退）> `.slots`
     * 修饰符开关（显式值在场时被压制，ADR-0007 显式优先）。
     * 值语义：布尔 true / 字符串 "true" / `*` = **全部转发**快捷方式（≡ 通配）；字符串清单按
     * 逗号解析；布尔 false = 显式关闭（静默，可压制修饰符）；其余非字符串 / 空值 warn + 忽略。
     * null = 未声明或声明无效。
     */
    private _parseForwardSlots;
    /**
     * 转发 warn 纪律（ADR-0125 决策五，编译期一次、列出名字、不阻断）：
     * - 清单模式（含混写显式项）：对外名 ∩ 声明方自身 def.slots → 逐名 warn（同名段将被
     *   自身出口与转发下游双渲染）；
     * - `*` 模式：声明方 def.slots ∩ 相邻下一级组件 def.slots → warn 一次列出交集
     *   （不深扫多级、动态出口场景不追求精确，对齐 ADR-0107 skipValidation 容错哲学）。
     */
    private _warnForwardSlotsCollisions;
    /**
     * 解析数据基准（ADR-0053 组件数据边界；修订一：消费侧 `.open` 豁免；ADR-0110：open 实例级覆盖）。
     *
     * 解析链：`x-component-options.dataContext`（消费覆盖）→ `def.dataContext`（作者声明，含 `.open` 修饰符
     * 经 buildComponentDef 校验）→ 默认。规则：
     * - **open 三级优先级（ADR-0110，extends x-define-options）**：消费侧显式布尔（`.open` 修饰符 ≡
     *   `x-component-options="{open:true}"`；含显式 `open:false`）**覆盖** def.open → def.open → 默认封闭。
     *   消费侧可打开也可关闭（实例级边界覆盖，不回写 def 快照）；
     * - 基准取消费 dataContext > def.dataContext（封闭组件上恒为 undefined）> 默认 `'host'`；
     * - 消费侧 dataContext 声明落在封闭组件（无任何 open 通道）时仍 warn + 忽略，保持封闭；
     * - 无效基准值 warn + 回退 `'host'`；
     * - `def` 为 null（纯快照组件，无声明侧 open 通道）仍可被消费侧 open 打开。
     */
    private _resolveDataBasis;
    /**
     * 组件快照根属性并入宿主（T4=B 属性继承）。
     *
     * 宿主化身组件根，组件快照根的属性（class/style/普通属性）并入宿主：
     * - class：拼接（宿主class + 组件根class）；
     * - style：合并，冲突键组件根优先（组件内部样式不被宿主意外覆盖）；
     * - 其他属性：宿主已有则保留（不覆盖），否则复制组件根属性。
     */
    private _mergeComponentRootAttrs;
    /** 上次实际应用到组件数据域的 props（浅值比较基准；destroy 时清空） */
    private _appliedProps;
    /**
     * props 浅值比较（键集合相同 + 每键 Object.is）。overlay 基座热更新复用（protected）。
     *
     * **同引用视为不等**：绑定状态对象形态（`x-component:box="order"`）重求值返回的是同一
     * 响应式引用，其内部键可能已被外部原地修改，必须照常 assign 把最新键值拷入。
     * 仅不同引用（静态字面量每次重求值产生新对象）才比较键值。
     */
    protected _propsEqual(a: Record<string, any> | undefined, b: Record<string, any> | undefined): boolean;
    /**
     * 更新 props（值重求值后，组件已实例化）。
     *
     * Object.assign 进组件实例 scope.data，只覆盖 props 出现的键（组件内部状态不被重置，
     * ADR-0054 决策三：覆盖声明键、删键残留、不镜像同步）。
     */
    private _updateProps;
    /**
     * 显示 loading 占位（R6=B，组件异步加载中）。
     *
     * 复用 x-loading 运行时指令：宿主加 `x-loading` 属性，dispatcher 自动 mount 覆盖层。
     * 宿主 x-component 已剥指令属性（Compile 指令），加 x-loading 属性触发 Runtime 指令派发。
     * ADR-0126 合成协议（共享层 {@link createLoadingMask}）：守卫（宿主手写 x-loading 时
     * 不合成、不触碰）+ 所有权闸 + loading 选项透传——loader 场景读 merged 配置（平铺层 >
     * 内嵌层），R6=B 等待本地组件场景无 cfg 走 x-component-options 平铺层。
     * 元键注入（ADR-0126 决策 4）：占位显示置 `$loading=true`（含 pendingName 等待
     * `components/<名>/registered` 的 R6=B 路径）。
     */
    private _showLoadingPlaceholder;
    /** 隐藏 loading 占位（ADR-0126：toggle `"false"`，仅合成方持有——宿主手写时 no-op） */
    private _hideLoadingPlaceholder;
    /**
     * 监听带名注册事件（`components/<名>/registered`，ADR-0085），目标组件就绪后经
     * {@link _retryPendingComponent} 重试（R6=B 异步占位）。
     *
     * 订阅键即过滤（无回调内名比对）；事件 **retain**——订阅晚于注册也能立即补发，
     * 消灭「查找失败 → 订阅之间组件恰好注册」的竞态窗口。pendingName 变化须比对重订
     * （订阅键随名走；旧实现已监听即 return 不换键，靠回调内比对——迁移时一并修正）。
     *
     * 点号名候选全集订阅（ADR-0088 pending 修订）：解析器把属性参数句点段切为修饰符，
     * 编译期回溯未命中时名字定格截断短名——单键等待会与全名注册事件（如
     * `components/autospark.outlet/registered`）键不匹配而死锁。故对候选全集
     * （`autospark`、`autospark.outlet`、…）逐键订阅，任一到来即解锁，重试时回溯重判。
     */
    protected _waitForComponent(name: string, props: Record<string, any> | undefined): void;
    /** 解除 pending 订阅集（重订 / 清理时） */
    private _unsubscribePending;
    /**
     * 等待的组件就绪后的重试入口（R6=B）：清 pending + 移除占位 + 重新实例化
     * （首次渲染用最新 props）。子类可覆盖加前置条件（如 overlay 的 visible 已归假则放弃）。
     *
     * 重跑点号回溯（ADR-0088 pending 修订）：等待期间注册表已变（如全名组件经
     * registerComponent / x-import 注册），截断短名可能已可升级为全名。
     */
    protected _retryPendingComponent(): void;
    /** 清理 pending 状态（组件就绪重试 / 卸载时） */
    protected _clearPending(): void;
    /**
     * 沿 parent 链统计同名组件实例化深度（递归保护 T5=A）。
     *
     * 每个 isComponent=true 的祖先 scope 若实例化了同名组件，深度 +1。
     * scope 上记录实例化的组件名（经 scope.componentName，由 compileChild 在 componentDef 在场时设置）。
     */
    protected _recursiveDepth(name: string): number;
    destroy(): void;
}
