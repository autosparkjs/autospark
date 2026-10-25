import { ComponentDirective } from "../../directives/x-component";
import { OverlayInstance, type OverlayInstanceOptions, type OverlayShellDef } from "../overlay/instance";
import { type OverlayConfig } from "../overlay/types";
import { type ResizeDirection } from "../../directives/x-resizable";
export declare abstract class OverlayDirective extends ComponentDirective {
    /**
     * 覆盖物宿主是**触发点/声明点**（按钮标签、触发容器），不是组件化身——
     * 子节点保留在宿主正常渲染（不占有子树）。插槽内容打开时从**只读 template**
     * 克隆收集投影进 body 容器，不清空宿主（对齐 x-dialog 文档的按钮标签模式）。
     */
    static ownsChildren(): boolean;
    /**
     * 同名多实例（对齐 OnDirective 先例）：宿主是纯声明点，同元素多覆盖物消费者
     * （`x-dialog:a` + `x-dialog:b`，不同 attr）各自独立驱动——并存是 ADR-0052 决策 8
     * 「宿主非触发器」的隐含要求，也是选项定向机制（ADR-0007 修订 `x-dialog-options:a.props`）
     * 的前提。同名**同 attr** 重复声明不去重（用户错误，双实例驱动同组件）。
     */
    static readonly singleton = false;
    /** 覆盖物消费者标记（基类静态字段的唯一覆写点）：供 compiler 内容剪枝与 x-component 冲突检测按类判定 */
    static readonly overlayConsumer = true;
    /**
     * 覆盖物组件名 = 消费 attr 名（x-dialog:login 的 login）。keepalive 修饰符糖（ADR-0119）
     * 无需在此剥离——解析器把 `:` 后首段定为 attr、`.` 后段定为 modifiers（getDirectives），
     * attr 天然不含修饰符段；糖义经 modifier→options 注入（ADR-0007：无参开关等价
     * options[name]=true，显式选项优先）自动进入配置合并链。点号组件名（`autospark.*`）
     * 经 x-component `_resolveComponentName` 升序回溯重建（ADR-0088），宿主 attr 原样写全名。
     */
    protected get overlayName(): string;
    /**
     * 覆盖物形态键（ADR-0062）：引擎级默认 shell 的配置键（`options.overlay.{kind}.shell`）。
     * 基座空串（无引擎级默认键）；子类覆写——DialogDirective `'dialog'`、PopoverDirective `'popover'`。
     */
    protected overlayKind: string;
    /**
     * warn 消息前缀指令名（诊断用）：基座历史即 dialog 语义（'x-dialog'）；子类覆写为自身指令名
     * （x-popover / x-drawer），继承基座的 warn（未找到组件/props/shell 等）才不打错前缀。
     */
    protected directiveLabel: string;
    /** 当前活跃实例（visible 驱动；声明式单驱动点至多一个活跃实例，关闭后残留引用经 destroyed 守卫） */
    protected _overlayInstance: OverlayInstance | null;
    /** 当前驱动状态（visible 真值；子类 watch 维护） */
    protected _driveOn: boolean;
    /** 当前求值 props（选项成员属性 props 的表达式产物；undefined = 无 props）——片段数据域热应用源 */
    protected _props: Record<string, any> | undefined;
    /** 上次热应用到片段数据域的 props（浅值比较基准，复用 ComponentDirective._propsEqual） */
    private _appliedProps;
    /** keepalive 挂起实例缓存（ADR-0119）：cacheKey → 实例——同键复用防重复堆叠；指令销毁统一回收 */
    private _keepaliveCache;
    /** 进行中的探测中止器（ADR-0119 → ADR-0123 保留：retry 重载/指令销毁抢占旧探测） */
    private _remoteAbort;
    /**
     * 消费侧收集裁决的内容组缓存（ADR-0124 决策 11）：chrome 分段剥离后的原始子组，供
     * retry 重载复用（重收集会让 chrome 段再入内容宿主）；undefined = 尚未裁决。
     */
    private _splitContent;
    /** 模态遮罩外壳（DialogDirective 覆盖 true；基座默认裸面板直挂容器——未来形态定制点） */
    protected get _modalMask(): boolean;
    created(): void;
    /** 打开（visible 真值路径）：查找 → 防护 → 配置链 → 实例化到 body 容器（props 走指令值通道） */
    protected _open(): void;
    /** 状态归假的关闭路径：直接 UI 关闭（状态已是唯一真相源，不走写回——ADR-0052 决策 7） */
    protected _close(): void;
    /**
     * props 值变化（对齐 x-component `_onValueChange` 容错）：对象 → props 集合（v-bind="obj" 心智）；
     * null/undefined → 无 props（绑定的状态对象尚未就绪，静默）；数组/标量 → warn 忽略。
     * 片段形态活跃实例在场 → 浅值比较后**热应用**（`Object.assign` 进片段数据域，只覆盖出现键
     * ——ADR-0123 决策 3）；组件形态 props 走 x-component 指令值通道自治（宿主生成时的表达式
     * 文本 + x-component watch），此处不双重热应用。
     */
    private _onPropsChange;
    /**
     * 目的地覆盖（共识 3-3）：body 容器新实例（x-component 为宿主原地化身）——跳过 `_mergeComponentRootAttrs`。
     * 共享 x-component 的查找（`_findComponentDef`）、递归深度防护（`_recursiveDepth`）。
     *
     * **ADR-0123 统一编排**：keepalive 缓存身份（`组件名 + key + url`）同键挂起实例复用（open
     * 恢复）；实例创建即写入缓存（**打开即准入**，决策 5——pending 占位挂起无害）。实例 open
     * （shell 先开 + x-error 边界加载锚）后注入错误桥 actions，再按组件注册状态生成内容宿主
     * （共享实现见 `overlay/contentHost.ts`）：已注册 → 组件宿主；未注册 + url → 探测分流；
     * 未注册无 url → pending 宿主（x-component 占位 + registered 重试，warn 保留）。
     */
    protected _instantiate(name: string): void;
    /**
     * 内容宿主共享上下文（ADR-0123）：声明式通道差异全部注入——warn 前缀、探测注册位
     * （`this.binding.parent`，x-import 同款）、组件查找（x-component 同源协议）、宿主编译父
     * 解析（缺省收敛消费处 scope `this.binding`——props 表达式上下文与既有 watch 严格对齐，
     * 决策 2；显式 dataContext 经 `_resolveParentScope` 两栖分派）、片段 props 热应用守卫
     * 基线维护。
     */
    private _hostCtx;
    /**
     * 探测管线执行（AbortController 归本指令持有）：retry 重载 / 指令销毁抢占旧探测——
     * 新探测发起先 abort 旧在途，finally 清理句柄。信号与失败分流归共享
     * {@link probeAndMount}。
     */
    private _probe;
    /**
     * 三态分流选择器（ADR-0123 决策 2）：初始挂载与 retry 重载共用——重查组件注册
     * （重试间隙组件可能已就绪：x-import 其他入口/手动注册），已注册 → 组件宿主；
     * 未注册 + url → 探测分流；未注册无 url → pending 宿主（x-component 占位 +
     * registered 重试，ADR-0022 R6=B）。
     */
    private _regenerateContent;
    /**
     * props 指令值文本（ADR-0123 决策 3）：成员表达式原文直作 x-component 指令值（三形态 +
     * 持续热更新契约由 x-component 通道承接）；整包静态 props 经 JSON 序列化为对象字面量
     * 文本（求值一次语义等价）。setAttribute 程序化写值天然防表达式内引号截断（注记 7）。
     */
    private _propsValueText;
    /**
     * 配置合并链出口（形态默认注入点）：两级链（`内置默认 < x-{name}-options`）归一后产出
     * 生效配置。子类覆写以叠加形态默认——如 PopoverDirective 注入默认锚（宿主元素）与
     * placement 'bottom'（ADR-0060），不必复制 `_instantiate` 全段。
     */
    protected _resolveConfig(optionLayer: Record<string, any>): OverlayConfig;
    /**
     * 实例定位策略钩子（形态特化，ADR-0063）：默认 undefined——实例走内置「锚定/退居中」
     * 两态；子类覆写注入形态定位（x-drawer：屏幕贴边默认 + 锚定长轴同步，并接管未命中
     * 回退措辞「退屏幕贴边」）。
     */
    protected _positioner(): OverlayInstanceOptions["positioner"] | undefined;
    /**
     * shell 解析（ADR-0062 → ADR-0094 标准链）：面板外壳组件按配置链取组件名——
     * `config.shell`（成员表达式打开时求值一次）> 引擎级 `options.overlay.{overlayKind}.shell`
     * > 内置 shell 注册名兜底（形态键映射，见 {@link KIND_SHELL_NAMES}）。显式名走与内容组件
     * 同源的查找协议（scope 链 x-define →
     * `components` > `builtinComponents` 双注册位全局），未命中 warn + 回退内置默认
     * （弹窗照常工作，失效可发现；不等待 x-import——shell 是结构骨架，异步回退内置的错误
     * 形态比延迟打开更糟，ADR-0062）。
     */
    protected _resolveShell(config: OverlayConfig): OverlayShellDef;
    /**
     * 宿主直接子节点按归属分组后取本消费者名组（原始 ChildNode[]，ADR-0119 → ADR-0123）：
     * 组件宿主生成时克隆移入宿主子级（x-component 收集分段投影承接）；片段路径无出口概念
     * （生成时 warn 丢弃）。分段不再由 overlay 预处理——出口清单的消费归 x-component 编译期。
     */
    private _collectSlotGroup;
    /** 宿主上全部覆盖物消费者的组件名（同宿主多 x-dialog 的归属校验与隐式归属基准） */
    private _overlayConsumers;
    /**
     * 消费侧收集裁决（ADR-0124 决策 11）：消费者分段按名三分——
     * - 段名为消费组件**已声明出口**（def.slots 命中）→ 内容组（显式优先：同名段归属
     *   组件自出口，即使名字撞 chrome 域）；
     * - 否则名归一（裸 `actions` → `actions.right`）后命中 {@link OVERLAY_CHROME_SLOT_NAMES}
     *   → chrome 组（键为归一名，经 collectSlotSegments 正式分段产出 SlotContent）；
     * - 其余（`default` / `body` / 未知名 / 裸子节点与空白注释）→ 内容组。
     *
     * 输入是归属分组的**原始子节点**（标记属性未剥）：内容组按原序重组交内容宿主管线
     * （mountComponentHost 克隆进宿主，x-component 编译期再分段投影）；chrome 组节点经
     * 分段克隆 + 剥标记，stash OverlayInstance（chromeSlots）。全 chrome 输入时内容组为
     * null（内容宿主无段可挂）。
     */
    private _splitOverlaySlots;
    /**
     * actions 双通道合并（ADR-0124 决策 7）：声明式 = engine.actions（getAction 查找链
     * 终点，最远端）+ 消费处 scope 链局部 action 注册表（`<script type="autospark/actions">`
     * 注入），**仅显式 pos ∈ {top,left,right} 准入**（全局注册表大量与覆盖物无关的 action，
     * 无 pos 不上屏）；配置式 = config.actions 最后进，同 id 覆盖声明式。遍历序远→近
     * （近层同 id 覆盖远层）。无执行体条目剪枝（链上静默——注册期已规范化；配置式 warn）。
     * 合并产物回写 config.actions（调用方负责）——打开前就位，随 config 整包注入 shell
     * data 域 → 内嵌 overlay 组件 props.actions（pos 归位渲染归 overlay 组件 regroup）。
     *
     * @returns 合并数组；空集返回 null（调用方不动 config.actions——无动作时不注入空数组）
     */
    private _mergeOverlayActions;
    /**
     * 消费者销毁（ADR-0119 → ADR-0123）：中止进行中的探测 + 回收 keepalive 缓存内全部实例
     * （挂起中/打开中/关闭动画中—— VisibleOverlayDirective.destroy 已先对活跃可见实例
     * requestClose，keepalive 语义下将挂起回缓存，此处统一销毁兜底）。
     */
    destroy(): void;
    /**
     * 数据视图基准挂链解析（共识 8；`scope` 键已更名 `dataContext`，ADR-0053 修订）：
     * **仅显式声明路径**（ADR-0123 决策 2——缺省收敛消费处 scope，宿主编译父 = `this.binding`，
     * props 表达式上下文与既有 watch 严格对齐）。显式声明统一经 `resolveDataContext` 两栖分派
     * ——`'declarer'` 挂**声明处** scope（定义闭包；def 未知时悬空防御 → rootless，仅全局
     * 视图 + 级联守卫兜底）；`'host'` 挂**消费处** scope；元素按基准载体分派。
     */
    private _resolveParentScope;
    /**
     * 「请求关闭」写回钩子（UI 触点：ESC / 遮罩 / close action → 实例 requestClose）。
     * 基座无写回目标（仅 UI 关闭）；子类按值形态注入（简单路径 visible 写回 false）。
     */
    protected _makeCloseRequest(): ((inst: OverlayInstance, source: string) => void) | null;
    /**
     * 会话内尺寸记忆：拖出尺寸存指令实例状态（跨实例保留——每次打开新 OverlayInstance，
     * 指令实例长存），重开沿用、优先于声明 `size` / CSS 尺寸；engine destroy 随指令实例消亡。
     */
    protected _resizeMem: {
        width: number;
        height: number;
    } | null;
    /**
     * 形态合法方向集（null = 形态不支持 resize）：子类覆写——drawer 贴边内侧单边
     * （placement 推导）、dialog 四角（`ne,nw,se,sw`）。`handles` 声明只能在此集内收窄。
     */
    protected _resizeAllowedHandles(): ResizeDirection[] | null;
    /**
     * resize 尺寸落点（形态差异点）：默认写面板两轴（dialog——居中锚定下宽高直改、
     * transform/flex 居中自动适应）；drawer 覆写只写短轴（长轴由 inset 对拉/锚定同步管理）。
     */
    protected _applyResize(panel: HTMLElement, width: number, height: number, dir: ResizeDirection): void;
    /**
     * 面板就绪钩子（onPanelReady 消费，ADR-0064）：读 `config.resize` 建调节会话并挂手柄——
     * `true`（形态合法全集 + 默认约束）| 对象（字段与 x-resizable 同构；handles 收窄校验，
     * 越界 warn + 忽略）。钳制/手柄/指针核心复用 ResizeSession，写路径走 shell 面板
     * （{@link _applyResize}）；`resize:*` 事件派发在**指令宿主**（非面板，绑定语法不变）；
     * 不写回 store（事件 detail 即出口）；拖出尺寸进会话记忆（{@link _resizeMem}）。
     * 会话销毁随实例 cleanup（手柄随面板 DOM 消亡，此处保证幂等干净）。
     */
    protected _attachResize(ctx: {
        panel: HTMLElement;
        config: OverlayConfig;
        registerCleanup: (fn: () => void) => void;
    }): void;
}
