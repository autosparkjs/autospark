import type {
    AutoSparkScope,
    ComponentDef,
    OverlayInstanceOptions,
    OverlayShellDef,
    OverlayConfig,
    AutoSparkAction,
    SlotContent,
    OverlayHostCtx,
    ResizeDirection,
    ResizeOptions,
    OverlayInstance,
    AutoSpark,
    OverlayPositionerContext,
    AutoSpark,
} from "autospark";
import { OverlayInstance } from "./mechanism/instance";
import { resolveOverlayConfig } from "./mechanism/handle";
import { buildOverlayCacheKey } from "./mechanism/types";
import { resolveDataContext } from "./mechanism/types";
import { collectSlotGroups } from "../../utils/slot";
import { collectSlotSegments } from "../../utils/slot";
import { getSlotMarker } from "../../utils/slot";
import { injectErrorBridge } from "./mechanism/contentHost";
import { mountComponentHost } from "./mechanism/contentHost";
import { probeAndMount } from "./mechanism/contentHost";
import { DIALOG_SHELL_NAME } from "../../utils/shellNames";
import { DRAWER_SHELL_NAME } from "../../utils/shellNames";
import { POPOVER_SHELL_NAME } from "../../utils/shellNames";
import { ResizeSession } from "../../utils/resizeSession";
import { resolveHandles } from "../../utils/resizeSession";
import { resolveResizeConstraints } from "../../utils/resizeSession";
import { setVal } from "../../utils/setVal";
import { isSimpleStatePath } from "../../utils/isSimpleStatePath";
import { normalizeAtConfig } from "./mechanism/types";
import { resolveAnchorEl } from "./mechanism/anchor";
import { getOverlayContainer } from "../../utils/getOverlayContainer";
import { createCollapseTrigger } from "../../utils/expandable-trigger";
import { registerTriggerStyles } from "../../utils/expandable-trigger";
import { installPlugin } from "@autospark/utils";
import { registerBuiltinShells } from "./mechanism/wrappers";
import { OverlayHandle } from "./mechanism/handle";

/**
 * overlay 家族指令类工厂（autospark.overlay.js 核心，ADR-0128 批次 4）：类链
 * ComponentDirective（engine 注入，经 nsMember）→ OverlayDirective（基座）→
 * VisibleOverlayDirective → {Dialog, Drawer}；Popover extends 基座。FOUC 预热退役
 * （registerBuiltinShells 注册面承接，见 mechanism/wrappers）。语义零漂移，全量平移自
 * engine（ADR-0052/0060/0063 及后续修订）。
 */
export function createOverlayDirectives(
    ComponentDirective: any,
): {
    dialog: any;
    popover: any;
    drawer: any;
} {
    /* ══ 自 engine features/directive/overlay.ts（模块级） ══ */
    /**
     * OverlayDirective：覆盖物消费侧**公共抽象基座**（ADR-0052 修订版——组件化统一，共识 2/3）。
     *
     * 覆盖物不再是独立声明指令，而是「**任意组件被渲染到 body 容器的消费方式**」：内容 = 任意组件
     * （`x-define` 声明 / `options.components` 全局注册 / `x-import` 加载），组件名走消费 attr
     * （`x-dialog:login` 的 `login`）。本类**不注册 `presetDirectives`**（模板无 `x-overlay` 语法，
     * 旧声明指令与 `.global` 修饰符、engine 全局表已删——共识 1）。
     *
     * 继承 `ComponentDirective`（ADR-0054 更名自 UseDirective）组件查找能力（`getComponentDeclaration`
     * 查找、def 反查、递归深度防护），仅覆盖关键分歧（共识 3）：
     *
     * 1. **值语义**：组件名来自 attr（与 x-component 同一载体约定）；值专职 visible 布尔控制
     *    （子类解析，见 DialogDirective；对象形态已删除，ADR-0052 v2.3）；
     * 2. **实例化时机**：visible 真值触发 `_open()`（x-component 为编译期一次）；
     * 3. **目的地**：body 容器新实例（`OverlayInstance`，x-component 为宿主原地化身）——跳过
     *    `_mergeComponentRootAttrs` 属性继承。
     *
     * **内容宿主双委托（ADR-0123）**：overlay 不再自渲染内容——按组件注册状态生成内容宿主元素
     * 以消费处 scope 为父 wrapper-compile 编译进 shell 出口的 x-error 边界，渲染全委托：
     * - **组件已注册 / 探测命中 / pending（未注册无 url）** → 宿主 `x-component:名称="props表达式文本"`
     *   （指令值 props 通道，ADR-0110——三形态 + 持续热更新契约零变化；pending 占位 +
     *   component/registered 重试为 x-component 既有能力，ADR-0022 R6=B）；
     * - **未注册 + 声明 url** → 探测管线（importComponentsFromUrl：fetch + 解析 + 注册到消费处
     *   scope + url 缓存，x-import 同款）后分流——同名 `x-define` 命中转组件形态（远程模板其余
     *   内容放弃），未命中转片段宿主 `x-html.compile="url"`（url 形态 fetch → 子模板编译，
     *   `$loading`/`$error` 元键、竞态丢弃、中止策略全继承，ADR-0035/0017/0122）。
     *
     * **props 契约（ADR-0123 决策 3）**：组件路径 props 表达式文本直接作 x-component 指令值；
     * 片段路径模板没有 props 概念——props 求值快照经 compileChild initialData 注入 wrapper
     * scope 响应式 data 域（x-data 同语义），`_onPropsChange` 热应用 `Object.assign`（浅值
     * 比较守卫）。**时序统一「shell 先开」**：三态一律先开面板（x-error 边界兼加载锚呈现
     * x-loading 骨架），pending 从「不开面板只 warn」改为开面板 + 占位。
     *
     * **错误通道（ADR-0123 决策 4）**：探测失败 / 片段加载失败（watch 宿主 scope `$error` 元键）
     * 统一在 x-error 边界上派发 raise 同款 error 事件（ADR-0118 契约），呈现归边界 x-error 就近
     * 捕获；retry/close 经 `overlayRetry`/`overlayClose` 自定义 action（注入边界 scope 的
     * actions 通道）——retry 销毁内容宿主重走探测/生成（原位重载），close 请求关闭面板。
     *
     * props 通道（ADR-0052 v2.3）：**唯一声明式通道 = 选项成员属性** `x-dialog-options.props`（或定向
     * `x-dialog-options:<组件名>.props`，ADR-0007 修订）——值为表达式，三形态与 x-component 值同构
     * （无属性 = 无 props / 对象字面量（成员任意表达式）/ 纯状态路径按需展开），**持续热更新**。
     *
     * 配置两级链（v2.3）：`内置默认（基座） < x-dialog-options`（值对象内联层随对象形态删除）。
     * 数据视图基准 dataContext（共识 8；ADR-0053 修订更名自 `scope`）：显式声明经
     * `resolveDataContext` 解析保留；**缺省收敛消费处 scope**（宿主编译父 = `this.binding`——
     * props 表达式上下文与既有 watch 严格对齐，ADR-0123 决策 2）。
     */
    /**
     * 形态键（`overlayKind`，兼 `options.overlay.{kind}` 配置键）→ 内置 shell 注册名
     * （`autospark.{kind}` 点前缀，ADR-0094 命名空间）映射：两个键域不同，兜底查找须换键。
     * 未知形态键回退 dialog（基座历史语义）。
     */
    const KIND_SHELL_NAMES: Record<string, string> = {
        dialog: DIALOG_SHELL_NAME,
        popover: POPOVER_SHELL_NAME,
        drawer: DRAWER_SHELL_NAME,
    };
    
    /**
     * overlay chrome 出口名集合（ADR-0124 决策 11）：消费侧分段按名裁决的 chrome 判定基准。
     * 裸 `actions` 先归一为 `actions.right` 再比对；`default` / `body` 及其余名字恒内容组
     * （body 是 overlay 骨架的内容直通位，default 是面板内容本体）。
     */
    const OVERLAY_CHROME_SLOT_NAMES: ReadonlySet<string> = new Set([
        "title",
        "header",
        "footer",
        "actions.top",
        "actions.left",
        "actions.right",
    ]);

    /* ══ 自 engine features/directive/visible-overlay.ts（模块级） ══ */
    /**
     * VisibleOverlayDirective：visible 驱动的覆盖物消费者**中间抽象基座**（ADR-0063）。
     *
     * 自 DialogDirective 提取（纯重构，dialog 行为零变化）：「纯状态驱动」家族语义（ADR-0052
     * 决策 6/7/8）的单一承载点——宿主是纯声明点（无隐式点击），指令值专职 visible 布尔控制：
     * - 简单路径 `x-dialog:login="ui.flag"`——watch，可写回（请求关闭回写 false）；
     * - 表达式 `x-dialog:pay="ui.step === 2"`——watch 只读；UI 关闭后依赖变化重求值仍真会重开
     *   （文档明示的已知边界，ADR-0052 决策 7）；
     * - 字面量 `x-dialog:login="true"`——挂载即开（公告类）；"false" 永不开；
     * - 空值——warn「缺少 visible 绑定」恒不开（ADR-0052 决策 6）；
     * - 对象形态已硬删（ADR-0052 v2.3）——值遇 `{` warn + 忽略整个指令。
     *
     * 请求关闭写回（决策 7）：visible 为简单路径时，关闭触点（ESC/遮罩/close action）经落点解析
     * 回写 `false`（locals → x-data 响应式域 → 全局 state 依次落点）。
     *
     * 形态差异（遮罩/定位/触发模型/默认动画）仍由子类叠加：DialogDirective（模态居中）、
     * DrawerDirective（贴边抽屉，ADR-0063）等平级继承本类——「模态」与「visible 驱动」正交
     * （mask 可配的 drawer 两者都要）。
     */

    /* ══ 自 engine directives/x-dialog.ts（模块级） ══ */
    /**
     * x-dialog：覆盖物消费者的**模态形态**（ADR-0052 修订版，共识 4 薄子类）。
     *
     * 仅叠加模态形态于 {@link VisibleOverlayDirective} 之上：遮罩外壳（`autospark-dialog-mask`，
     * 恒模态——ADR-0062）+ `closeOnMask` + flex 居中默认；visible 驱动四形态/写回（决策 6/7/8）、
     * 查找/防护/等待/props/配置链/scope 基准全部继承。x-drawer（贴边形态，ADR-0063）/ x-popover
     * （悬浮形态，ADR-0060）为平级同构薄子类。
     *
     * props 与配置不在值上（v2.3 三者正交）：props 走选项成员属性 `x-dialog-options.props`
     * （表达式 + 持续热更新，见基座）；配置走 `x-dialog-options`（两级合并链，可定向）。
     */

    /* ══ 自 engine directives/x-popover.ts（模块级） ══ */
    /**
     * x-popover：覆盖物消费者的**悬浮形态**（ADR-0060，2026-10-11 修订：触发方式可选）——
     * {@link OverlayDirective} 薄子类。
     *
     * 与 x-dialog 的唯一形态差异是**触发模型**：宿主不再是纯声明点（家族「纯状态驱动」原则的
     * 显式偏离，ADR-0060），而是**触发器**——`trigger` 选项（`'hover'` 默认 | `'click'`，经
     * `getOption` 三层链现读）分派两种方式。查找/防护/等待/props/配置链/插槽/锚定定位全部继承基座。
     *
     * - **hover 方式（默认）**：mouseenter/mouseleave 语义（不冒泡——悬浮意图，非字面
     *   mouseover）；`delayShow`（默认 200ms）悬浮意图延迟、`delayHide`（默认 150ms）关闭宽限，
     *   均 0 即无延迟（`x-popover-options` 整包 / 成员属性表达式 / 宿主选项）；
     * - **内容内边距（padding 选项，默认 0）**：应用在 shell 内容区
     *   `.autospark-popover-content` 的 inline padding（number→px / CSS 长度字符串直写），
     *   自定义 shell 无该类名则静默跳过——现读应用，重开生效；
     * - **click 方式**：宿主 click 即 **toggle**；关闭触点三通道——再点宿主（toggle）、点击
     *   面板外部（document **capture** 监听——capture 路径先于宿主 target 阶段，打开的那次
     *   click 不会回流触发，天然免疫「开即关」；宿主∪面板内点击豁免，宿主归 toggle 管）、
     *   ESC（打开栈栈顶，机制继承）；面板内点击不关；`delayShow`/`delayHide` 静默不适用；
     * - **读取时机（修订决策 4）**：宿主/面板监听**恒挂**、回调内现读 `_resolveTrigger()` 分派
     *   ——hover↔click 热切换（选项成员为表达式）零特例，打开中的面板不重估不打断，切换自
     *   下一次触发生效；
     * - **修饰符桥接（修订决策 5）**：`.click` 经 ADR-0007 注入为 `options.click === true`，与
     *   `trigger` 键名错位，`_resolveTrigger` 内桥接——显式 `trigger` 恒优先 > `.click` > 默认
     *   hover；只做 `.click` 不做 `.hover`（修饰符惯例是打开非默认开关）；
     * - **共享 hover 域**（ADR-0060，hover 方式）：宿主与面板在 DOM 上分离（面板渲染进 body
     *   容器），双向 mouseenter/mouseleave 让「宿主↔面板」互移不闪关；leave 的 relatedTarget
     *   与 delayHide 到期是仅有的两个关闭判定点，域内豁免、域外关闭；
     * - **hover 链（嵌套）**：子 popover 声明在父面板内（面板同在 body 容器、DOM 兄弟），经
     *   document 级打开中注册表把后代 popover 的域并入祖先域——指针位于任一后代 popover 上时
     *   祖先保持打开；后代关闭（含 ESC 关子）后祖先经最后指针坐标 `elementFromPoint` 重估，
     *   已出域才关闭（防 ESC 关子后父级残留）。**click 消费者登记与触发解耦**（修订决策 6）：
     *   打开时仍登记注册表（充当 hover 后代的域容器），但不参与链豁免/重估——重估通知跳过
     *   click 消费者（防子关闭重估误关 click 父，其关闭只听点击/外点/ESC）；
     * - **值语义**：指令值不参与驱动（触发模型无 visible 真相源），非空值 warn；
     *   同宿主多 popover 声明 warn（触发源重合将同开），不去重不拦截。
     *
     * 关闭触点按方式分述：hover = 共享域离开（delayHide 宽限）+ ESC；click = toggle + 面板外
     * 点击 + ESC。均无 visible 写回（`_makeCloseRequest` 恒 null——关闭即 UI 关闭，无状态善后）。
     */
    /** delayShow 默认（ms）：悬浮意图延迟——快速掠过宿主不触发 */
    const DEFAULT_DELAY_SHOW = 200;
    /** delayHide 默认（ms）：宿主↔面板间隙穿越与手部抖动的关闭宽限 */
    const DEFAULT_DELAY_HIDE = 150;
    
    /**
     * 打开中的 popover 消费者注册表（document 级静态，多 engine 共享——对齐打开栈先例）：
     * hover 链判定（后代 popover 的域并入祖先域）与「后代关闭后祖先重估」的基础设施。
     * 登记于实例打开（`_attachInstance`）、移除于实例关闭/消费者销毁——恒只含活跃消费者。
     */
    const openPopovers = new Set<PopoverDirective>();

    /* ══ 自 engine directives/x-drawer.ts（模块级） ══ */
    /**
     * x-drawer：覆盖物消费者的**贴边抽屉形态**（ADR-0063）——{@link VisibleOverlayDirective}
     * 平级薄子类（与 x-dialog 共享 visible 驱动四形态，ADR-0052 决策 6/7/8）。
     *
     * 双定位模式（经实例定位策略钩子整体接管，ADR-0063 修订——两种模式同构语义：
     * 「终态贴边固定 + 主流位移滑入」）：
     * - **屏幕贴边**（默认，无 `at`）：面板 fixed 贴视口对应边（贴边三边 inset），贴边轴
     *   全屏展开、短轴尺寸走 `--autospark-drawer-size`（默认 280px，CSS 变量可调）；
     * - **元素贴边锚定**（`at.selector` 命中）：面板终态贴锚元素**内侧**对应边（`right` =
     *   右缘对齐锚右缘、面板在锚内），恒不越界（外侧贴缘在锚旁空间不足时会伸到容器外）；
     *   **长轴 = 锚边长**（随锚/视口变化重同步），短轴同屏幕模式。
     *
     * placement 语义（复用 `at.placement`，四主方向）：
     * - 默认 `right`（不配置即 right，心智最简单）；
     * - 两模式只认 `top|bottom|left|right`——`auto` 与 `-start/-end` 后缀静默归一
     *   （内侧终态无「选位」概念；长轴铺满对齐后缀无意义）。
     *
     * 形态默认：
     * - **模态默认、`mask: false` 可关**（官方 mask 选项，ADR-0062）：无遮罩时关闭触点仅
     *   ESC / close action / 状态归假（outside-click 关闭是家族 fast-follow，不做）；
     *   `closeOnMask` 无遮罩时静默无效；
     * - **默认动画 `'drawer'`**：遮罩淡入淡出 + 面板位移滑入滑出（translate ±100%，主流
     *   drawer 形态语言，样式在 drawer-shell）；用户显式配置 `animate` 时整键尊重；
     * - **锚定无箭头**（drawer-shell 不渲染载体，`at.arrow: true` 静默无效）；`flip` /
     *   `offset` / `shift` 等浮动定位子键在内侧展开模型下无意义，静默忽略；
     * - **锚定未命中回退屏幕贴边**（非家族「退居中」——居中对抽屉形态无意义，ADR-0063 有意偏离）。
     *
     * 嵌套（drawer 内再开 drawer）零新机制：每次打开新实例（决策 9）DOM 追加序天然层叠、
     * ESC 打开栈只关栈顶（决策 20）、递归深度防护共享——子 drawer 声明在父组件模板内即可。
     */
    /** 屏幕贴边合法主方向（锚定归一同款；非法值/缺省/auto 一律按默认方向处理） */
    const DRAWER_MAIN_DIRECTIONS = new Set(["top", "bottom", "left", "right"]);
    /** 屏幕贴边默认方向（业界惯例：右侧抽屉） */
    const DEFAULT_DRAWER_PLACEMENT = "right";

    /* ══════════ OverlayDirective（engine features/directive/overlay.ts） ══════════ */
    abstract class OverlayDirective extends ComponentDirective {
        /**
         * 覆盖物宿主是**触发点/声明点**（按钮标签、触发容器），不是组件化身——
         * 子节点保留在宿主正常渲染（不占有子树）。插槽内容打开时从**只读 template**
         * 克隆收集投影进 body 容器，不清空宿主（对齐 x-dialog 文档的按钮标签模式）。
         */
        static override ownsChildren(): boolean {
            return false;
        }

        /**
         * 同名多实例（对齐 OnDirective 先例）：宿主是纯声明点，同元素多覆盖物消费者
         * （`x-dialog:a` + `x-dialog:b`，不同 attr）各自独立驱动——并存是 ADR-0052 决策 8
         * 「宿主非触发器」的隐含要求，也是选项定向机制（ADR-0007 修订 `x-dialog-options:a.props`）
         * 的前提。同名**同 attr** 重复声明不去重（用户错误，双实例驱动同组件）。
         */
        static override readonly singleton = false;

        /** 覆盖物消费者标记（基类静态字段的唯一覆写点）：供 compiler 内容剪枝与 x-component 冲突检测按类判定 */
        static override readonly overlayConsumer = true;

        /**
         * 覆盖物组件名 = 消费 attr 名（x-dialog:login 的 login）。keepalive 修饰符糖（ADR-0119）
         * 无需在此剥离——解析器把 `:` 后首段定为 attr、`.` 后段定为 modifiers（getDirectives），
         * attr 天然不含修饰符段；糖义经 modifier→options 注入（ADR-0007：无参开关等价
         * options[name]=true，显式选项优先）自动进入配置合并链。点号组件名（`autospark.*`）
         * 经 x-component `_resolveComponentName` 升序回溯重建（ADR-0088），宿主 attr 原样写全名。
         */
        protected get overlayName(): string {
            return this.attr ?? "";
        }

        /**
         * 覆盖物形态键（ADR-0062）：引擎级默认 shell 的配置键（`options.overlay.{kind}.shell`）。
         * 基座空串（无引擎级默认键）；子类覆写——DialogDirective `'dialog'`、PopoverDirective `'popover'`。
         */
        protected overlayKind = "";

        /**
         * warn 消息前缀指令名（诊断用）：基座历史即 dialog 语义（'x-dialog'）；子类覆写为自身指令名
         * （x-popover / x-drawer），继承基座的 warn（未找到组件/props/shell 等）才不打错前缀。
         */
        protected directiveLabel = "x-dialog";

        /** 当前活跃实例（visible 驱动；声明式单驱动点至多一个活跃实例，关闭后残留引用经 destroyed 守卫） */
        protected _overlayInstance: OverlayInstance | null = null;
        /** 当前驱动状态（visible 真值；子类 watch 维护） */
        protected _driveOn = false;
        /** 当前求值 props（选项成员属性 props 的表达式产物；undefined = 无 props）——片段数据域热应用源 */
        protected _props: Record<string, any> | undefined;
        /** 上次热应用到片段数据域的 props（浅值比较基准，复用 ComponentDirective._propsEqual） */
        private _appliedProps: Record<string, any> | undefined;
        /** keepalive 挂起实例缓存（ADR-0119）：cacheKey → 实例——同键复用防重复堆叠；指令销毁统一回收 */
        private _keepaliveCache = new Map<string, OverlayInstance>();
        /** 进行中的探测中止器（ADR-0119 → ADR-0123 保留：retry 重载/指令销毁抢占旧探测） */
        private _remoteAbort: AbortController | null = null;
        /**
         * 消费侧收集裁决的内容组缓存（ADR-0124 决策 11）：chrome 分段剥离后的原始子组，供
         * retry 重载复用（重收集会让 chrome 段再入内容宿主）；undefined = 尚未裁决。
         */
        private _splitContent: ChildNode[] | null | undefined;

        /** 模态遮罩外壳（DialogDirective 覆盖 true；基座默认裸面板直挂容器——未来形态定制点） */
        protected get _modalMask(): boolean {
            return false;
        }

        override created(): void {
            // 宿主 x-options 的 props 键不被接受（ADR-0007 修订：props 不参与宿主回退——数据走
            // 指令级通道，元素级配置容器不承载）：warn + 忽略
            if (this.binding?.hostOptions && "props" in this.binding.hostOptions) {
                this.warn(
                    `${this.directiveLabel}:${this.attr}: 宿主 x-options 中的 props 键不被接受（props 走 x-dialog-options.props 指令级通道），已忽略`,
                );
            }
            // props 通道（ADR-0052 v2.3）：先于通用管道单独订阅（纯状态路径形态需 depth:2 深层响应，
            // 对齐 x-component props 的订阅参数），通用管道跳过 props 键避免同一表达式双 watcher。
            // 求值产物（_props）供片段数据域热应用（ADR-0123 决策 3）；组件路径 props 走
            // x-component 指令值通道自治，本 watcher 求值仅为维护片段热应用源。
            const propsExpr = this.info.optionExprs?.props;
            let skip: string[] | undefined;
            if (propsExpr !== undefined) {
                skip = ["props"];
                if (propsExpr.trim() === "") {
                    this.warn(
                        `${this.directiveLabel}:${this.attr}: props 成员属性的值为空（须提供表达式：对象字面量或状态路径），已忽略`,
                    );
                } else {
                    const initial = this.binding.watch(
                        propsExpr,
                        ({ value }) => this._onPropsChange(value),
                        { depth: 2 },
                    );
                    this._onPropsChange(initial);
                }
            } else {
                // 整包内嵌 props（静态字面量子集，v2.3）：无 watch 无热更新，作初始 props——
                // 成员属性形态（表达式）整键覆盖本形态
                const staticProps = this.options?.props;
                if (staticProps !== undefined) this._onPropsChange(staticProps);
            }
            // 选项表达式统一管道（ADR-0007 修订）：其余配置成员（closeOnMask/at 等）建订阅——
            // 应用点 = 每次打开经 resolveOverlayConfig 现读（重开生效，配置不热应用）
            this._watchOptionExprs(skip);
        }

        /** 打开（visible 真值路径）：查找 → 防护 → 配置链 → 实例化到 body 容器（props 走指令值通道） */
        protected _open(): void {
            this._instantiate(this.overlayName);
        }

        /** 状态归假的关闭路径：直接 UI 关闭（状态已是唯一真相源，不走写回——ADR-0052 决策 7） */
        protected _close(): void {
            const inst = this._overlayInstance;
            if (inst && !inst.destroyed && inst.visible) inst.close();
        }

        /**
         * props 值变化（对齐 x-component `_onValueChange` 容错）：对象 → props 集合（v-bind="obj" 心智）；
         * null/undefined → 无 props（绑定的状态对象尚未就绪，静默）；数组/标量 → warn 忽略。
         * 片段形态活跃实例在场 → 浅值比较后**热应用**（`Object.assign` 进片段数据域，只覆盖出现键
         * ——ADR-0123 决策 3）；组件形态 props 走 x-component 指令值通道自治（宿主生成时的表达式
         * 文本 + x-component watch），此处不双重热应用。
         */
        private _onPropsChange(value: any): void {
            let props: Record<string, any> | undefined;
            if (Array.isArray(value)) {
                this.warn(
                    `${this.directiveLabel}:${this.attr}: props 值须为对象（字面量或状态对象），数组已忽略: ${JSON.stringify(value)}`,
                );
            } else if (value != null && typeof value === "object") {
                props = value as Record<string, any>;
            } else if (value !== undefined && value !== null) {
                this.warn(
                    `${this.directiveLabel}:${this.attr}: props 值须为对象（字面量或状态对象），已忽略: ${JSON.stringify(value)}`,
                );
            }
            this._props = props;
            const inst = this._overlayInstance;
            if (inst && !inst.destroyed && inst.isFragment && inst.instanceScope?.data) {
                if (!this._propsEqual(props, this._appliedProps)) {
                    if (props) Object.assign(inst.instanceScope.data, props);
                    this._appliedProps = props;
                }
            }
        }

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
        protected override _instantiate(name: string): void {
            // 配置两级链（v2.3）：内置默认 < x-dialog-options（静态整包层 + 成员表达式层，各自
            // 归一化后 deepMerge——标量键表达式整键覆盖静态；at 等结构键简写经逐层归一化保留
            // 上层其余成员，v2.1 简写局部覆盖语义不变）。整包内嵌的 props 键已剥离（数据不走配置链）。
            // keepalive 修饰符糖（`x-dialog:name.keepalive`）已由解析器注入本层（keepalive: true）。
            const { props: _staticProps, ...optionLayer } = this.options ?? {};
            const config = this._resolveConfig(optionLayer);
            // keepalive 缓存身份（ADR-0119）：`组件名 + key + url` 复合键——同键挂起实例复用
            const cacheKey = buildOverlayCacheKey(name, config);
            if (config.keepalive === true) {
                const cached = this._keepaliveCache.get(cacheKey);
                if (cached && !cached.destroyed) {
                    this._overlayInstance = cached;
                    cached.open(); // 挂起态 → 恢复；已可见 → no-op（防重复堆叠）
                    return;
                }
                if (cached) this._keepaliveCache.delete(cacheKey); // 已销毁残留：清位
            }
            const url = typeof config.url === "string" ? config.url.trim() : "";
            const found = this._findComponentDef(name);
            // 递归深度防护（T5=A，与 x-component 共享；未注册组件无递归风险，仅已注册路径前置判定）
            if (found && this._recursiveDepth(name) >= ComponentDirective.MAX_DEPTH) {
                this.warn(
                    `${this.directiveLabel}:${this.attr}: 组件 "${name}" 递归实例化深度超过上限（${ComponentDirective.MAX_DEPTH}），已停止（疑似无终止条件递归）。`,
                );
                return;
            }
            // 插槽内容预收集（原始子节点，ADR-0056 决策十修订）：组件宿主克隆移入宿主子级
            // （x-component 收集分段投影承接）；片段路径无出口概念——生成时 warn 丢弃
            const group = this._collectSlotGroup(name);
            // 消费侧收集裁决（ADR-0124 决策 11）：chrome 分段（title/header/footer/actions.*，
            // 裸 actions 归一）自内容组剥离 stash 实例（open 前就位，_buildShellAndMount 并入
            // shell 内容集），其余保持原始子组走内容宿主管线；内容组缓存供 retry 重载复用。
            // 消费组件已声明的出口名优先（显式优先——同名段归属组件自出口，不入 chrome）。
            const split = this._splitOverlaySlots(group, found?.def?.slots);
            this._splitContent = split.content;
            // actions 双通道合并（ADR-0124 决策 7）：链上声明式（engine.actions + scope 链，
            // 显式 pos 准入，远→近覆盖）+ config.actions 配置式最后进；回写后随 config 整包
            // 注入 shell data 域 → 内嵌 overlay 组件 props.actions。
            const mergedActions = this._mergeOverlayActions(config.actions);
            if (mergedActions) config.actions = mergedActions;
            // shell 解析（ADR-0062）：面板外壳组件（config.shell > 引擎级默认 > 内置默认）
            const shell = this._resolveShell(config);
            // 宿主不清空：ownsChildren=false 下子节点是宿主自身内容（按钮标签等），照常保留
            const inst = new OverlayInstance(this.engine, name, document.createElement("div"), null, config, {
                parentScope: this.binding,
                searchRoot: this.el ?? null,
                mask: this._modalMask,
                shell,
                positioner: this._positioner(),
                onPanelReady: (ctx) => this._attachResize(ctx),
                cacheKey,
            });
            // chrome 段就位（open 前——_buildShellAndMount 并入 shell 内容集，ADR-0124 决策 11）
            inst.chromeSlots = split.chrome;
            inst.onCloseRequest = this._makeCloseRequest();
            this._overlayInstance = inst;
            // keepalive 打开即准入（ADR-0123 决策 5）：pending 占位/加载中挂起无害（watcher 存活）
            if (config.keepalive === true) this._keepaliveCache.set(cacheKey, inst);
            inst.open();
            // 错误桥 actions 注入 + 三态分流生成内容宿主（ADR-0123，声明式/命令式共享实现见
            // contentHost.ts）：初始挂载与 retry 重载共用同一三分支选择器
            const ctx = this._hostCtx(config);
            const regenerate = () => this._regenerateContent(inst, config, name, url);
            injectErrorBridge(ctx, inst, regenerate);
            regenerate();
        }

        /**
         * 内容宿主共享上下文（ADR-0123）：声明式通道差异全部注入——warn 前缀、探测注册位
         * （`this.binding.parent`，x-import 同款）、组件查找（x-component 同源协议）、宿主编译父
         * 解析（缺省收敛消费处 scope `this.binding`——props 表达式上下文与既有 watch 严格对齐，
         * 决策 2；显式 dataContext 经 `_resolveParentScope` 两栖分派）、片段 props 热应用守卫
         * 基线维护。
         */
        private _hostCtx(config: OverlayConfig): OverlayHostCtx {
            return {
                engine: this.engine,
                warn: (m) => this.warn(`${this.directiveLabel}:${this.attr}: ${m}`),
                registerScope: this.binding.parent,
                findComponent: (n) => this._findComponentDef(n),
                resolveParentScope: (def) =>
                    config.dataContext === undefined
                        ? this.binding
                        : this._resolveParentScope(config, def).parentScope,
                onFragmentApplied: (p) => {
                    this._appliedProps = p;
                },
            };
        }

        /**
         * 探测管线执行（AbortController 归本指令持有）：retry 重载 / 指令销毁抢占旧探测——
         * 新探测发起先 abort 旧在途，finally 清理句柄。信号与失败分流归共享
         * {@link probeAndMount}。
         */
        private _probe(
            ctx: OverlayHostCtx,
            inst: OverlayInstance,
            name: string,
            url: string,
            group: ChildNode[] | null,
            propsText: string | null,
        ): Promise<void> {
            this._remoteAbort?.abort();
            const ctrl = (this._remoteAbort = new AbortController());
            return probeAndMount(ctx, inst, name, url, group, propsText, () => this._props, ctrl.signal)
                .finally(() => {
                    if (this._remoteAbort === ctrl) this._remoteAbort = null;
                });
        }

        /**
         * 三态分流选择器（ADR-0123 决策 2）：初始挂载与 retry 重载共用——重查组件注册
         * （重试间隙组件可能已就绪：x-import 其他入口/手动注册），已注册 → 组件宿主；
         * 未注册 + url → 探测分流；未注册无 url → pending 宿主（x-component 占位 +
         * registered 重试，ADR-0022 R6=B）。
         */
        private _regenerateContent(
            inst: OverlayInstance,
            config: OverlayConfig,
            name: string,
            url: string,
        ): void {
            const ctx = this._hostCtx(config);
            const found = ctx.findComponent(name);
            // 内容组用消费侧裁决缓存（ADR-0124 决策 11）：chrome 段已剥离 stash 实例，retry
            // 重载不得重新收集（会再入内容宿主）；undefined = 尚未裁决（防御回退全量收集）
            const group =
                this._splitContent === undefined ? this._collectSlotGroup(name) : this._splitContent;
            const propsText = this._propsValueText();
            if (found) {
                mountComponentHost(ctx, inst, name, found.def, propsText, group);
            } else if (url !== "") {
                void this._probe(ctx, inst, name, url, group, propsText);
            } else {
                // pending（ADR-0123 决策 1）：面板先开 + x-component pending 占位（注册后自动挂载）
                this.warn(
                    `${this.directiveLabel}:${this.attr}: 未找到覆盖物组件 "${name}"（scope 链与全局均未命中），面板已开并显示加载占位——组件注册后自动挂载（ADR-0123）`,
                );
                mountComponentHost(ctx, inst, name, null, propsText, group);
            }
        }

        /**
         * props 指令值文本（ADR-0123 决策 3）：成员表达式原文直作 x-component 指令值（三形态 +
         * 持续热更新契约由 x-component 通道承接）；整包静态 props 经 JSON 序列化为对象字面量
         * 文本（求值一次语义等价）。setAttribute 程序化写值天然防表达式内引号截断（注记 7）。
         */
        private _propsValueText(): string | null {
            const expr = this.info.optionExprs?.props;
            if (expr !== undefined && expr.trim() !== "") return expr;
            const staticProps = this.options?.props;
            if (staticProps !== undefined) {
                try {
                    return JSON.stringify(staticProps);
                } catch (e: any) {
                    this.warn(
                        `${this.directiveLabel}:${this.attr}: 静态 props 序列化失败，已忽略: ${e?.message ?? e}`,
                    );
                    return null;
                }
            }
            return null;
        }

        /**
         * 配置合并链出口（形态默认注入点）：两级链（`内置默认 < x-{name}-options`）归一后产出
         * 生效配置。子类覆写以叠加形态默认——如 PopoverDirective 注入默认锚（宿主元素）与
         * placement 'bottom'（ADR-0060），不必复制 `_instantiate` 全段。
         */
        protected _resolveConfig(optionLayer: Record<string, any>): OverlayConfig {
            return resolveOverlayConfig(optionLayer, this._optionExprValues);
        }

        /**
         * 实例定位策略钩子（形态特化，ADR-0063）：默认 undefined——实例走内置「锚定/退居中」
         * 两态；子类覆写注入形态定位（x-drawer：屏幕贴边默认 + 锚定长轴同步，并接管未命中
         * 回退措辞「退屏幕贴边」）。
         */
        protected _positioner(): OverlayInstanceOptions["positioner"] | undefined {
            return undefined;
        }

        /**
         * shell 解析（ADR-0062 → ADR-0094 标准链）：面板外壳组件按配置链取组件名——
         * `config.shell`（成员表达式打开时求值一次）> 引擎级 `options.overlay.{overlayKind}.shell`
         * > 内置 shell 注册名兜底（形态键映射，见 {@link KIND_SHELL_NAMES}）。显式名走与内容组件
         * 同源的查找协议（scope 链 x-define →
         * `components` > `builtinComponents` 双注册位全局），未命中 warn + 回退内置默认
         * （弹窗照常工作，失效可发现；不等待 x-import——shell 是结构骨架，异步回退内置的错误
         * 形态比延迟打开更糟，ADR-0062）。
         */
        protected _resolveShell(config: OverlayConfig): OverlayShellDef {
            const kind = this.overlayKind;
            const engineDefault = kind
                ? (this.engine.options.overlay as Record<string, { shell?: string }> | undefined)?.[
                      kind
                  ]?.shell
                : undefined;
            const explicit = config.shell ?? engineDefault;
            const name = explicit == null ? "" : String(explicit).trim();
            if (name !== "") {
                const found = this._findComponentDef(name);
                if (found) return { name, snapshot: found.snapshot, def: found.def };
                this.warn(
                    `${this.directiveLabel}:${this.attr}: shell "${name}" 未命中（scope 链与全局组件表均无），回退内置默认 shell（若来自 x-import 请先注册再打开）（ADR-0062）`,
                );
            }
            // 内置 shell 兜底（ADR-0094 点前缀命名空间：形态键（overlayKind）是配置键
            // `options.overlay.{kind}`，注册键是 `autospark.{kind}`——两个键域不同，须映射；
            // 用户任一注册位同名覆盖天然生效，内置种子恒在组件表，断言安全）
            const shellKey = (kind != null && KIND_SHELL_NAMES[kind]) || DIALOG_SHELL_NAME;
            return { name: shellKey, ...this.engine._resolveGlobalComponentFull(shellKey)! };
        }

        /**
         * 宿主直接子节点按归属分组后取本消费者名组（原始 ChildNode[]，ADR-0119 → ADR-0123）：
         * 组件宿主生成时克隆移入宿主子级（x-component 收集分段投影承接）；片段路径无出口概念
         * （生成时 warn 丢弃）。分段不再由 overlay 预处理——出口清单的消费归 x-component 编译期。
         */
        private _collectSlotGroup(name: string): ChildNode[] | null {
            if (!this.template) return null;
            const warn = (m: string) => this.warn(`${this.directiveLabel}:${this.attr}: ${m}`);
            const groups = collectSlotGroups(this.template, this._overlayConsumers(), warn);
            return groups.get(name) ?? null;
        }

        /** 宿主上全部覆盖物消费者的组件名（同宿主多 x-dialog 的归属校验与隐式归属基准） */
        private _overlayConsumers(): string[] {
            return this.binding.directives
                .filter((d): d is OverlayDirective => d instanceof OverlayDirective)
                .map((d) => d.overlayName)
                .filter((n) => n !== "");
        }

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
        private _splitOverlaySlots(
            group: ChildNode[] | null,
            declared: readonly string[] | undefined,
        ): { content: ChildNode[] | null; chrome: Map<string, SlotContent> | null } {
            if (!group || group.length === 0) return { content: group, chrome: null };
            const declaredSet = declared && declared.length > 0 ? new Set(declared) : null;
            const contentNodes: ChildNode[] = [];
            const chromeNodes: ChildNode[] = [];
            for (const child of group) {
                const marker = child instanceof HTMLElement ? getSlotMarker(child) : null;
                const name = marker ? marker.name : "default";
                const normalized = name === "actions" ? "actions.right" : name;
                if (!declaredSet?.has(name) && OVERLAY_CHROME_SLOT_NAMES.has(normalized)) {
                    chromeNodes.push(child);
                } else {
                    contentNodes.push(child);
                }
            }
            if (chromeNodes.length === 0) return { content: group, chrome: null };
            const warn = (m: string) => this.warn(`${this.directiveLabel}:${this.attr}: ${m}`);
            const segments = collectSlotSegments(chromeNodes, undefined, warn, { skipValidation: true });
            const chrome = new Map<string, SlotContent>();
            for (const [name, seg] of segments ?? []) {
                const key = name === "actions" ? "actions.right" : name;
                if (chrome.has(key)) {
                    warn(`x-slot: chrome 内容 "${key}" 重复（裸 actions 与 actions.right 并存），后者已生效`);
                }
                chrome.set(key, seg);
            }
            return {
                content: contentNodes.length > 0 ? contentNodes : null,
                chrome: chrome.size > 0 ? chrome : null,
            };
        }

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
        private _mergeOverlayActions(configActions: OverlayConfig["actions"]): AutoSparkAction[] | null {
            const merged = new Map<string, AutoSparkAction>();
            const admit = (id: string, a: AutoSparkAction | undefined) => {
                if (!a || typeof a.handle !== "function") return;
                if (a.pos !== "top" && a.pos !== "left" && a.pos !== "right") return;
                merged.set(id, a);
            };
            // 全局表（最远端——getAction 查找序 scope 链之后的终点）
            for (const [id, a] of Object.entries(
                this.engine.actions as unknown as Record<string, AutoSparkAction>,
            )) {
                admit(id, a);
            }
            // scope 链远→近（近层同 id 覆盖远层）
            const chain: AutoSparkScope[] = [];
            for (let s: AutoSparkScope | null = this.binding; s; s = s.parent) chain.push(s);
            for (let i = chain.length - 1; i >= 0; i--) {
                const actions = chain[i]!.actions;
                if (!actions) continue;
                for (const [id, a] of Object.entries(actions)) admit(id, a);
            }
            // 配置式最后进（同 id 覆盖声明式）；无 pos 条目放行（pos 归位归 overlay 组件 regroup）
            (configActions ?? []).forEach((a, i) => {
                if (!a || typeof a.handle !== "function") {
                    this.warn(
                        `${this.directiveLabel}:${this.attr}: config.actions 第 ${i} 项缺执行体（handle），已忽略（ADR-0124）`,
                    );
                    return;
                }
                const id = typeof a.id === "string" && a.id !== "" ? a.id : `__overlay_config_${i}`;
                merged.set(id, a);
            });
            return merged.size > 0 ? Array.from(merged.values()) : null;
        }

        /**
         * 消费者销毁（ADR-0119 → ADR-0123）：中止进行中的探测 + 回收 keepalive 缓存内全部实例
         * （挂起中/打开中/关闭动画中—— VisibleOverlayDirective.destroy 已先对活跃可见实例
         * requestClose，keepalive 语义下将挂起回缓存，此处统一销毁兜底）。
         */
        override destroy(): void {
            this._remoteAbort?.abort();
            this._remoteAbort = null;
            if (this._keepaliveCache.size) {
                for (const inst of [...this._keepaliveCache.values()]) {
                    if (!inst.destroyed) inst.destroy();
                }
                this._keepaliveCache.clear();
            }
            super.destroy();
        }

        /**
         * 数据视图基准挂链解析（共识 8；`scope` 键已更名 `dataContext`，ADR-0053 修订）：
         * **仅显式声明路径**（ADR-0123 决策 2——缺省收敛消费处 scope，宿主编译父 = `this.binding`，
         * props 表达式上下文与既有 watch 严格对齐）。显式声明统一经 `resolveDataContext` 两栖分派
         * ——`'declarer'` 挂**声明处** scope（定义闭包；def 未知时悬空防御 → rootless，仅全局
         * 视图 + 级联守卫兜底）；`'host'` 挂**消费处** scope；元素按基准载体分派。
         */
        private _resolveParentScope(
            config: OverlayConfig,
            def: ComponentDef | null,
        ): { parentScope: AutoSparkScope | null; scopeEl: HTMLElement | null } {
            const ctx = config.dataContext === undefined ? "declarer" : config.dataContext;
            return resolveDataContext(ctx, def, this.binding, this.engine, (m) =>
                this.warn(`${this.directiveLabel}:${this.attr}: ${m}`),
            );
        }

        /**
         * 「请求关闭」写回钩子（UI 触点：ESC / 遮罩 / close action → 实例 requestClose）。
         * 基座无写回目标（仅 UI 关闭）；子类按值形态注入（简单路径 visible 写回 false）。
         */
        protected _makeCloseRequest(): ((inst: OverlayInstance, source: string) => void) | null {
            return null;
        }

        // ── 面板尺寸拖拽调节（resize 选项，ADR-0064 决策八）────────────────

        /**
         * 会话内尺寸记忆：拖出尺寸存指令实例状态（跨实例保留——每次打开新 OverlayInstance，
         * 指令实例长存），重开沿用、优先于声明 `size` / CSS 尺寸；engine destroy 随指令实例消亡。
         */
        protected _resizeMem: { width: number; height: number } | null = null;

        /**
         * 形态合法方向集（null = 形态不支持 resize）：子类覆写——drawer 贴边内侧单边
         * （placement 推导）、dialog 四角（`ne,nw,se,sw`）。`handles` 声明只能在此集内收窄。
         */
        protected _resizeAllowedHandles(): ResizeDirection[] | null {
            return null;
        }

        /**
         * resize 尺寸落点（形态差异点）：默认写面板两轴（dialog——居中锚定下宽高直改、
         * transform/flex 居中自动适应）；drawer 覆写只写短轴（长轴由 inset 对拉/锚定同步管理）。
         */
        protected _applyResize(
            panel: HTMLElement,
            width: number,
            height: number,
            dir: ResizeDirection,
        ): void {
            panel.style.width = `${width}px`;
            panel.style.height = `${height}px`;
            void dir;
        }

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
        }): void {
            const cfg = ctx.config.resize;
            if (cfg == null || cfg === false) return;
            const warn = (m: string) => this.warn(`${this.directiveLabel}:${this.attr}: ${m}`);
            const allowed = this._resizeAllowedHandles();
            if (!allowed) {
                warn(`resize 选项在该形态不受支持，已忽略（ADR-0064）`);
                return;
            }
            let handles: ResizeDirection[] = allowed;
            let opts: ResizeOptions | null = null;
            if (cfg !== true) {
                if (typeof cfg !== "object") {
                    warn(`resize 须为 true 或选项对象（与 x-resizable 选项同构），已忽略: ${JSON.stringify(cfg)}`);
                    return;
                }
                opts = cfg as ResizeOptions;
                if (opts.handles != null) {
                    const declared = resolveHandles(opts, warn);
                    handles = declared.filter((d) => allowed.includes(d));
                    const dropped = declared.filter((d) => !allowed.includes(d));
                    if (dropped.length) {
                        warn(
                            `resize.handles 方向 ${dropped.join(",")} 不在形态合法集 ${allowed.join(",")} 内，已忽略（handles 只能收窄，ADR-0064）`,
                        );
                    }
                }
            }
            if (handles.length === 0) {
                warn(`resize 手柄集为空，跳过挂载`);
                return;
            }
            const session = new ResizeSession({
                target: ctx.panel,
                eventTarget: this.el,
                handles,
                constraints: () => resolveResizeConstraints(opts, ctx.panel, warn),
                apply: (w, h, dir) => this._applyResize(ctx.panel, w, h, dir),
                onApplied: (w, h) => {
                    this._resizeMem = { width: w, height: h };
                },
                warn,
            });
            session.attach();
            ctx.registerCleanup(() => session.destroy());
        }
    }

    /* ══════════ VisibleOverlayDirective（engine features/directive/visible-overlay.ts） ══════════ */
    abstract class VisibleOverlayDirective extends OverlayDirective {
        // warn 前缀 directiveLabel 继承基座（默认 'x-dialog'）；异名子类（x-drawer 等）覆写字段

        /** 可写回的 visible 状态路径（简单路径形态才有；表达式/字面量 null）。
         *  protected：形态子类消费（x-drawer 折叠把手折叠态点击须写回 true） */
        protected _visiblePath: string | null = null;
        /** visible 驱动表达式（非字面量形态） */
        private _visibleExpr: string | null = null;

        override created(): void {
            // 基座：选项表达式统一管道 + props 通道（ADR-0007 修订 / ADR-0052 v2.3）
            super.created();
            const raw = String(this.value ?? "").trim();
            // 对象形态已硬删（ADR-0052 v2.3）：值专职 visible——visible 写指令值、props 写
            // x-{name}-options.props、配置写 x-{name}-options。warn + 忽略整个指令（失效可发现）。
            if (raw.startsWith("{")) {
                this.warn(
                    `${this.directiveLabel}:${this.attr}: 对象形态已删除（ADR-0052 v2.3）——visible 写指令值、props 写 ${this.directiveLabel}-options.props、配置写 ${this.directiveLabel}-options，指令被忽略`,
                );
                return;
            }
            this._visibleExpr = raw;
            // 空值守卫（ADR-0052 决策 6）：warn 恒不开。守卫须先于字面量分流——空表达式不
            // 是合法字面量（_resolveLiteral 返回 null 会落反应式分支，watch("") 直接 SyntaxError）
            if (this._visibleExpr === "") {
                this.warn(
                    `${this.directiveLabel}:${this.attr}: 缺少 visible 绑定，恒不打开。请声明状态路径或表达式（ADR-0052 决策 6）`,
                );
                return;
            }
            // 字面量分流（对齐 x-loading resolveLiteral：裸属性恒开语义不适用——覆盖物无 visible 即非法）
            const literal = this._resolveLiteral(this._visibleExpr);
            if (literal !== null) {
                if (literal) {
                    this._driveOn = true;
                    this._open();
                }
                return;
            }
            // 反应式：可见性驱动（相对消费处 scope 求值，ADR-0052 决策 6）
            this._visiblePath = isSimpleStatePath(this._visibleExpr) ? this._visibleExpr : null;
            const initial = this.binding.watch(this._visibleExpr!, ({ value }) =>
                this._toggle(!!value),
            );
            this._toggle(!!initial);
        }

        /** 消费者销毁：打开中的实例走请求关闭（写回 false）；等待中的 x-import 监听经 super 清理 */
        override destroy(): void {
            const inst = this._overlayInstance;
            this._overlayInstance = null;
            if (inst && !inst.destroyed && inst.visible) inst.requestClose("consumer-destroyed");
            super.destroy();
        }

        /** 请求关闭写回（决策 7）：visible 为简单路径时回写 false（落点解析） */
        protected override _makeCloseRequest():
            | ((inst: OverlayInstance, source: string) => void)
            | null {
            return this._visiblePath ? () => this._writeVisible(false) : null;
        }

        // ── 内部 ──────────────────────────────────────────────────────────

        /** 可见性驱动总入口（状态归假 → 直接 close，不走写回——状态已是 false） */
        private _toggle(on: boolean): void {
            this._driveOn = on;
            if (on) {
                this._open();
            } else {
                this._close();
            }
        }

        /** 字面量判定：`true`/`false`（大小写不敏感）为静态布尔，其余 null 走反应式 */
        private _resolveLiteral(expr: string | null): boolean | null {
            const v = (expr ?? "").trim().toLowerCase();
            if (v === "true") return true;
            if (v === "false") return false;
            return null;
        }

        /**
         * visible 写回落点解析：沿 scope 链找首个持有首段键的容器（locals → x-data 响应式域），
         * 逐段深入直写（_data 写即响应式）；全链无局部落点 → `setVal` 写全局 state（x-model 同款快路径）。
         */
        protected _writeVisible(value: boolean): void {
            const path = this._visiblePath!;
            const segs = path.split(this.engine.store.delimiter);
            let s: AutoSparkScope | null = this.binding;
            while (s) {
                const container =
                    s.locals && segs[0]! in s.locals
                        ? s.locals
                        : s._data && segs[0]! in s._data
                          ? s._data
                          : null;
                if (container) {
                    let obj: any = container;
                    for (let i = 0; i < segs.length - 1; i++) {
                        obj = obj?.[segs[i]!];
                        if (obj == null) return; // 中途断裂：状态源不完整，放弃写回
                    }
                    obj[segs[segs.length - 1]!] = value;
                    return;
                }
                s = s.parent;
            }
            try {
                setVal(this.engine.store.state, segs, value);
            } catch (e: any) {
                this.warn(
                    `${this.directiveLabel}:${this.attr}: visible 回写失败（"${path}"）: ${e?.message ?? e}`,
                );
            }
        }
    }


    /* ══════════ DialogDirective（engine directives/x-dialog.ts） ══════════ */
    class DialogDirective extends VisibleOverlayDirective {
        /** 形态键（ADR-0062）：引擎级默认 shell 的配置键（options.overlay.dialog.shell） */
        protected override readonly overlayKind = "dialog";
        // warn 前缀 directiveLabel 沿用基座默认 'x-dialog'

        /** 类级初始化：注入 shell 默认视觉样式（幂等；FOUC 防御——先于任何实例打开） */
        static override initialize(engine: AutoSpark): void {
            // FOUC 预热退役（ADR-0128 批次 4）：shell 注册面见 registerBuiltinShells（bootstrap 期）
        }

        /** 模态形态（共识 4）：遮罩外壳 + closeOnMask + 居中默认（x-dialog 恒模态，ADR-0062） */
        protected override get _modalMask(): boolean {
            return true;
        }

        /** resize 形态合法集（ADR-0064）：居中浮层四角——四边拖会改居中锚定语义，角已覆盖主场景 */
        protected override _resizeAllowedHandles(): ResizeDirection[] | null {
            return ["ne", "nw", "se", "sw"];
        }
    }

    /* ══════════ PopoverDirective（engine directives/x-popover.ts） ══════════ */
    class PopoverDirective extends OverlayDirective {
        /** 形态键（ADR-0062）：引擎级默认 shell 的配置键（options.overlay.popover.shell） */
        protected override readonly overlayKind = "popover";

        /** warn 消息前缀指令名：继承基座的 warn（未找到组件/props 等）按自身指令名提示 */
        protected override directiveLabel = "x-popover";

        /** 类级初始化：注入 shell 默认视觉样式（幂等；含裸面板 z-index，样式随面板 shell 迁移 ADR-0062） */
        static override initialize(engine: AutoSpark): void {
            // FOUC 预热退役（ADR-0128 批次 4）：shell 注册面见 registerBuiltinShells（bootstrap 期）
        }

        // ── 触发状态 ──────────────────────────────────────────────────────

        /** delayShow 计时器（悬浮意图延迟；leave 取消） */
        private _showTimer: ReturnType<typeof setTimeout> | null = null;
        /** delayHide 计时器（关闭宽限；域内 mouseenter 取消） */
        private _hideTimer: ReturnType<typeof setTimeout> | null = null;
        /** 指针最后已知坐标（祖先重估 elementFromPoint 反查用——实例关闭后指针未动坐标仍准确） */
        private _lastPointer: { x: number; y: number } | null = null;
        /** 活跃实例的 overlay:close 广播退订（实例关闭/消费者销毁时退订） */
        private _unsubClose: (() => void) | null = null;
        /** 外点关闭监听退订（click 方式打开时挂 document capture、关闭/销毁时摘） */
        private _unsubDocClick: (() => void) | null = null;

        override created(): void {
            // 基座：选项表达式统一管道 + props 通道（ADR-0007 修订 / ADR-0052 v2.3）
            super.created();
            if (!this.attr) {
                this.warn(
                    "x-popover: 缺少组件名 attr（x-popover:名称），无法查找覆盖物组件，指令被忽略",
                );
                return;
            }
            // 触发模型下指令值不参与驱动（ADR-0060）：显示由宿主悬浮/点击驱动（trigger 选项），
            // 无 visible 真相源——非空值按误用提示（失效可发现，不静默吞）
            const raw = String(this.value ?? "").trim();
            if (raw) {
                this.warn(
                    `x-popover:${this.attr}: 指令值不参与驱动（触发模型无 visible 真相源，显示由宿主悬浮/点击驱动，见 trigger 选项），已忽略值 "${raw}"`,
                );
            }
            // 同宿主多 popover（对齐基座 singleton=false 的「用户错误不去重」哲学）：触发源
            // 唯一重合——同一次触发将同时打开全部面板，warn 可发现、不拦截
            const siblings = this.binding.directives.filter((d) => d instanceof PopoverDirective);
            if (siblings.length > 1) {
                this.warn(
                    `x-popover:${this.attr}: 同宿主声明了 ${siblings.length} 个 popover 消费者，触发源重合，同一次触发将同时打开全部面板`,
                );
            }
            // 触发监听恒挂、回调内按 trigger 现读分派（修订决策 4——热切换自下一次触发生效）：
            // mouseenter/mouseleave 不冒泡——悬浮意图语义（字面 mouseover 会在宿主子元素间移动
            // 时反复触发）；click 服务 click 方式 toggle。宿主监听随宿主 DOM 生死，destroy 显式摘除。
            this.el.addEventListener("mouseenter", this._onEnter);
            this.el.addEventListener("mouseleave", this._onLeave);
            this.el.addEventListener("click", this._onClick);
        }

        /** 消费者销毁：清触发设施 + 打开中的实例直接请求关闭（无写回目标） */
        override destroy(): void {
            this._teardownTriggers();
            const inst = this._overlayInstance;
            this._overlayInstance = null;
            if (inst && !inst.destroyed && inst.visible) inst.requestClose("consumer-destroyed");
            super.destroy();
        }

        // ── 形态差异（对基座的全部覆写点）──────────────────────────────────

        /** 打开：基座实例化后登记面板监听 + 注册表 + 关闭订阅（等待重试路径复用同一后置登记） */
        protected override _open(): void {
            this._unsubInstanceClose();
            this._instantiate(this.overlayName, this._props);
            this._attachInstance();
        }

        /** 等待的组件就绪重试：基座已守卫 _driveOn（等待期间 hover 已离开则放弃），补后置登记 */
        protected override _retryPendingComponent(): void {
            super._retryPendingComponent();
            this._attachInstance();
        }

        /** 默认锚 = 宿主元素自身（元素引用两栖形态）；placement 默认 'bottom' + flip 兜底。
         *  `x-popover-options.at` 显式配置时**成员级覆盖**：用户写出的成员生效，缺省成员回退
         *  （selector 缺省宿主、placement 缺省 bottom）——部分锚对象（如只写 placement）不丢锚、
         *  不退居中（换锚只改位置，不改变触发关系——ADR-0060） */
        protected override _resolveConfig(optionLayer: Record<string, any>): OverlayConfig {
            const config = super._resolveConfig(optionLayer);
            const at = normalizeAtConfig(config.at) ?? {};
            at.selector ??= this.el;
            at.placement ??= "bottom";
            config.at = at;
            // 形态默认（ADR-0124 决策 3 修订）：紧凑悬浮形态浮动 x 价值低，缺省不显示
            // close 按钮（家族默认 ≙ true 由模板 `!== false` 承担，显式 true/false 原样通过）
            config.closeable ??= false;
            return config;
        }

        // ── 悬浮触发模型（ADR-0060）───────────────────────────────────────

        /** 活跃实例存活（已开且未销毁） */
        private _isInstanceAlive(): boolean {
            const inst = this._overlayInstance;
            return !!inst && !inst.destroyed && inst.visible;
        }

        /** 宿主进入（hover 方式）：取消挂起关闭 → 已开防重 → delayShow 计时（0 立即）打开 */
        private _onEnter = (e: MouseEvent): void => {
            if (this._resolveTrigger() !== "hover") return;
            this._recordPointer(e);
            this._clearHideTimer();
            if (this._isInstanceAlive()) return;
            const delay = this._resolveDelay("delayShow", DEFAULT_DELAY_SHOW);
            this._clearShowTimer();
            if (delay > 0) {
                this._showTimer = setTimeout(() => {
                    this._showTimer = null;
                    // 计时期间方式已切换（hover→click）：上一次悬浮意图作废，放弃打开
                    if (this._resolveTrigger() !== "hover") return;
                    this._openNow();
                }, delay);
            } else {
                this._openNow();
            }
        };

        /** 宿主离开（hover 方式）：show 计时取消；relatedTarget 已入域（面板/后代 popover）豁免，否则 delayHide 宽限后关 */
        private _onLeave = (e: MouseEvent): void => {
            if (this._resolveTrigger() !== "hover") return;
            this._recordPointer(e);
            this._clearShowTimer();
            this._scheduleClose(e);
        };

        /** 宿主点击（click 方式）：toggle——已开清计时器后关（防 hover 残留计时双开），未开即开 */
        private _onClick = (): void => {
            if (this._resolveTrigger() !== "click") return;
            this._clearShowTimer();
            this._clearHideTimer();
            if (this._isInstanceAlive()) this._closeNow();
            else this._openNow();
        };

        /** 面板进入（hover 方式）：取消挂起关闭（宿主↔面板互移不闪关的对面侧） */
        private _onPanelEnter = (e: MouseEvent): void => {
            if (this._resolveTrigger() !== "hover") return;
            this._recordPointer(e);
            this._clearHideTimer();
        };

        /** 面板离开（hover 方式）：与宿主离开同一判定（relatedTarget 域内豁免 / delayHide 宽限） */
        private _onPanelLeave = (e: MouseEvent): void => {
            if (this._resolveTrigger() !== "hover") return;
            this._recordPointer(e);
            this._scheduleClose(e);
        };

        /**
         * 外点判定（click 方式，document capture）：命中目标在宿主∪活跃面板内豁免——宿主点击
         * 归 `_onClick` toggle 管（防同一次点击双通道打架），面板内点击不关；否则关闭。
         */
        private _onDocClick = (e: MouseEvent): void => {
            const target = e.target instanceof Element ? e.target : null;
            if (target && (this.el === target || this.el.contains(target))) return;
            const panel = this._overlayInstance?.el;
            if (panel && (panel === target || panel.contains(target))) return;
            this._closeNow();
        };

        private _openNow(): void {
            this._driveOn = true;
            this._open();
        }

        /**
         * 离开调度：relatedTarget 在共享 hover 域（宿主∪面板∪后代 popover 域）内豁免并清除
         * 挂起关闭；否则 delayHide 到期关闭（到期不再重估——宽限期内回到域内会触发域内
         * mouseenter 已清定时器）。
         */
        private _scheduleClose(e: MouseEvent): void {
            const related = e.relatedTarget instanceof Element ? e.relatedTarget : null;
            if (related && this._inZone(related)) {
                this._clearHideTimer();
                return;
            }
            const delay = this._resolveDelay("delayHide", DEFAULT_DELAY_HIDE);
            this._clearHideTimer();
            if (delay > 0) {
                this._hideTimer = setTimeout(() => {
                    this._hideTimer = null;
                    this._closeNow();
                }, delay);
            } else {
                this._closeNow();
            }
        }

        private _closeNow(): void {
            this._driveOn = false;
            this._close(); // 基座：UI 关闭（无写回目标）→ overlay:close 广播 → _onInstanceClosed 善后
        }

        /**
         * 共享 hover 域判定（ADR-0060 hover 链）：宿主 ∪ 活跃面板 ∪ 后代 popover 的域（递归）。
         * 后代 = 注册表中宿主落在本消费者域内的打开消费者——面板虽与宿主、父面板互为 DOM
         * 兄弟（body 容器），链判定让指针穿越「父面板→子宿主→子面板」全程不闪关。
         */
        private _inZone(target: Element | null): boolean {
            if (!target) return false;
            const zones = new Set<HTMLElement>();
            this._collectZone(zones);
            for (const z of zones) {
                if (z === target || z.contains(target)) return true;
            }
            return false;
        }

        /** 递归收集本消费者的完整 hover 域（into 去重兼防环） */
        private _collectZone(into: Set<HTMLElement>): void {
            into.add(this.el);
            const inst = this._overlayInstance;
            if (inst && !inst.destroyed && inst.el) into.add(inst.el);
            for (const other of openPopovers) {
                if (other === this || into.has(other.el)) continue;
                // 后代判定：其宿主落在我已收集的域（活跃面板或更深后代域）内
                for (const z of into) {
                    if (z.contains(other.el)) {
                        other._collectZone(into);
                        break;
                    }
                }
            }
        }

        /**
         * 后代关闭后的重估（防祖先残留）：指针最后已知坐标经 elementFromPoint 反查现命中元素，
         * 已出域才关闭。场景——ESC 关子后指针物理位于子面板原位置（父面板上方或其外），
         * mouseleave 已被链豁免、不会再触发，唯一可靠的重估时机是后代关闭通知。
         */
        private _reevaluate(): void {
            if (!this._isInstanceAlive()) return;
            const p = this._lastPointer;
            const hit =
                p && typeof document !== "undefined" ? document.elementFromPoint(p.x, p.y) : null;
            if (hit && this._inZone(hit)) {
                this._clearHideTimer();
                return;
            }
            this._closeNow();
        }

        /**
         * 实例关闭统一善后（ESC/hover 离开/close action/销毁全路径）：注册表移除 + 清触发
         * 设施 + 同步驱动态 + 通知祖先链重估（ESC 关子后父不残留）。订阅在 close 开始的
         * overlay:close 广播上触发——此刻面板 DOM 尚在（leave 动画未播）。
         */
        private _onInstanceClosed(): void {
            this._unsubInstanceClose();
            this._unsubDocClick?.();
            this._unsubDocClick = null;
            openPopovers.delete(this);
            this._clearHideTimer();
            this._clearShowTimer();
            this._driveOn = false;
            this._overlayInstance = null;
            this._notifyAncestors();
        }

        /** 通知祖先：本消费者宿主落在其活跃面板子树内的打开消费者逐个重估。
         *  click 消费者跳过（修订决策 6——重估是 hover 链机制，click 父的关闭只听点击/外点/ESC，
         *  防子关闭重估时指针恰在面板外把 click 父误关） */
        private _notifyAncestors(): void {
            for (const other of openPopovers) {
                if (other === this) continue;
                if (other._resolveTrigger() === "click") continue;
                const panel = other._overlayInstance?.el;
                if (panel && panel.contains(this.el)) other._reevaluate();
            }
        }

        // ── 内部设施 ──────────────────────────────────────────────────────

        /** 实例打开后的后置登记：面板监听（共享域对面侧）+ 注册表 + overlay:close 订阅 + 内容
         *  内边距应用；click 方式补挂外点关闭监听（document capture——capture 路径先于宿主
         *  target 阶段，打开的那次 click 不会回流触发，天然免疫「开即关」） */
        private _attachInstance(): void {
            const inst = this._overlayInstance;
            if (!inst || inst.destroyed || !inst.el) return; // 未命中等待路径：实例未产生，重试再登记
            inst.el.addEventListener("mouseenter", this._onPanelEnter);
            inst.el.addEventListener("mouseleave", this._onPanelLeave);
            this._applyContentPadding(inst.el);
            openPopovers.add(this);
            if (this._resolveTrigger() === "click") {
                document.addEventListener("click", this._onDocClick, true);
                this._unsubDocClick = () =>
                    document.removeEventListener("click", this._onDocClick, true);
            }
            const sub = (this.engine as any).on("overlay:close", (m: any) => {
                const payload = m?.payload ?? m;
                if (payload?.instance === inst) this._onInstanceClosed();
            });
            this._unsubClose = typeof sub === "function" ? sub : () => sub.off();
        }

        /**
         * 内容内边距（padding 选项）：现读三层链，应用到 shell 内容区
         * `.autospark-popover-content` 的 inline padding（覆盖 shell 样式表默认 0）——对齐
         * delayShow 现读先例（重开生效）；自定义 shell 未提供该类名的内容区则静默跳过
         * （外壳形态自控内边距，ADR-0062）。
         */
        private _applyContentPadding(panel: HTMLElement): void {
            const padding = this._resolvePadding();
            const content = panel.querySelector(".autospark-popover-content");
            if (content) (content as HTMLElement).style.padding = padding;
        }

        /** 读取内容内边距（默认 0 = 空串不写 inline，shell 样式表 0px 兜底）；number→px、
         *  字符串按 CSS 值直写（多值如 `'8px 16px'`）、负数/非有限数 warn 回退默认 */
        private _resolvePadding(): string {
            const raw = this.getOption("padding");
            if (raw === undefined || raw === null || raw === "") return "";
            if (typeof raw === "number") {
                if (!Number.isFinite(raw) || raw < 0) {
                    this.warn(
                        `x-popover:${this.attr}: padding 须为非负数字（px）或 CSS 长度字符串，已按默认 0 处理`,
                    );
                    return "";
                }
                return `${raw}px`;
            }
            return String(raw);
        }

        /**
         * 读取触发方式（修订决策 4：回调内现读——热切换自下一次触发生效）。修饰符桥接（决策 5）：
         * `.click` 经 ADR-0007 注入为 `options.click === true`（与 trigger 键名错位，此处桥接），
         * 优先级：显式 `trigger` 恒优先 > `.click` > 默认 hover（对齐 ADR-0007「显式已写则不
         * 覆盖」同精神）。非法值 warn 回退 hover（对齐 `_resolveDelay` 哲学）。
         */
        private _resolveTrigger(): "hover" | "click" {
            const raw = this.getOption("trigger");
            if (raw === undefined || raw === null || raw === "") {
                return this.getOption("click") === true ? "click" : "hover";
            }
            const v = String(raw).trim();
            if (v === "hover" || v === "click") return v;
            this.warn(
                `x-popover:${this.attr}: trigger 须为 'hover' | 'click'，已按默认 'hover' 处理`,
            );
            return "hover";
        }

        /** 读取延迟配置（getOption 三层链：成员表达式 > 指令选项 > 宿主选项），非法值 warn 回退默认 */
        private _resolveDelay(key: "delayShow" | "delayHide", fallback: number): number {
            const raw = this.getOption(key);
            if (raw === undefined || raw === null || raw === "") return fallback;
            const n = Number(raw);
            if (!Number.isFinite(n) || n < 0) {
                this.warn(
                    `x-popover:${this.attr}: ${key} 须为非负数字（ms），已按默认 ${fallback}ms 处理`,
                );
                return fallback;
            }
            return n;
        }

        private _recordPointer(e: MouseEvent): void {
            this._lastPointer = { x: e.clientX, y: e.clientY };
        }

        private _clearShowTimer(): void {
            if (this._showTimer) {
                clearTimeout(this._showTimer);
                this._showTimer = null;
            }
        }

        private _clearHideTimer(): void {
            if (this._hideTimer) {
                clearTimeout(this._hideTimer);
                this._hideTimer = null;
            }
        }

        private _unsubInstanceClose(): void {
            if (this._unsubClose) {
                this._unsubClose();
                this._unsubClose = null;
            }
        }

        /** 触发设施整体清理（消费者销毁）：宿主监听 + 双计时器 + 关闭订阅 + 外点监听 + 注册表 */
        private _teardownTriggers(): void {
            this.el.removeEventListener("mouseenter", this._onEnter);
            this.el.removeEventListener("mouseleave", this._onLeave);
            this.el.removeEventListener("click", this._onClick);
            this._clearShowTimer();
            this._clearHideTimer();
            this._unsubInstanceClose();
            this._unsubDocClick?.();
            this._unsubDocClick = null;
            openPopovers.delete(this);
        }
    }

    /* ══════════ DrawerDirective（engine directives/x-drawer.ts） ══════════ */
    class DrawerDirective extends VisibleOverlayDirective {
        /** 形态键（ADR-0062）：引擎级默认 shell 的配置键（options.overlay.drawer.shell） */
        protected override readonly overlayKind = "drawer";

        /** warn 消息前缀指令名：继承基座的 warn（未找到组件/props 等）按自身指令名提示 */
        protected override directiveLabel = "x-drawer";

        /** 类级初始化：注入 shell 默认视觉样式 + 共享把手样式（均幂等；ADR-0070 把手组合） */
        static override initialize(engine: AutoSpark): void {
            // FOUC 预热退役（ADR-0128 批次 4）：shell 注册面见 registerBuiltinShells（bootstrap 期）
            registerTriggerStyles();
        }

        /** 生效配置 stash（_resolveConfig 与 _modalMask/_positioner 同一次打开内先后执行） */
        private _config: OverlayConfig | null = null;

        // ── 抽屉把手（trigger，ADR-0063 修订）────────────────────────────

        /** 把手元素（实例外常驻——面板销毁后存活；null = 未建/已销毁） */
        private _triggerEl: HTMLElement | null = null;
        /** 最近 visible 驱动态（把手位置/箭头/裁切的分派依据） */
        private _triggerOn = false;
        /** 把手的视口监听清理（destroy 时摘除） */
        private _triggerCleanup: (() => void) | null = null;
        /** 感应边条（showTrigger:'hover' 时创建；全长活动边线感应，置于把手之前的兄弟） */
        private _edgeEl: HTMLElement | null = null;
        /** 展开态位置对齐帧句柄（与面板 enter 切换帧同调度；destroy/重入时撤销） */
        private _triggerFrame: number | null = null;
        private _triggerTimer: ReturnType<typeof setTimeout> | null = null;
        /** resize 会话的把手跟随帧句柄（合帧——每帧调节只重定位一次） */
        private _resizeSyncFrame: number | null = null;

        /**
         * 把手挂载（ADR-0070：把手机制组合 x-expandable 共享把手模块——元素/箭头矩阵/
         * 键盘管线唯一实现，`expandable` 选项承接旧 `trigger`；ADR-0063 修订的常驻语义
         * 保留）：默认开启、`false` 显式关闭；仅反应式（简单路径）形态生效——字面量/
         * 表达式形态状态不可写，把手点击无意义，不建。把手挂覆盖物容器（z 层级同源），
         * 圆心恒骑面板活动边线，几何见 `_positionTrigger`。drawer 语境把手**恒常驻**
         * （折叠态唯一重开触点——共享模块「滑出折叠常驻」规则的覆盖场景）。
         */
        override created(): void {
            super.created();
            if (this.getOption("expandable") === false) return;
            if (!this._visiblePath) return;
            const container = getOverlayContainer(this.engine);
            if (!container) return;
            const el = createCollapseTrigger({
                direction: this._screenPlacement(),
                onActivate: () => this._onTriggerClick(),
                label: "抽屉展开/折叠",
            });
            // 显隐策略（expandable.showTrigger，默认 'hover'——用户裁决，ADR-0063 修订注记）：
            // 展开态隐藏、hover/聚焦显形（无边条感应——折叠态恒显使「寻找隐藏把手」场景
            // 不存在，把手位置沿面板边线可预测）；折叠态恒显（唯一重开触点）；触屏恒显。
            // 非法值 warn 回退 hover
            const rawShow = this.getOption("expandable")?.showTrigger;
            if (rawShow != null && rawShow !== "hover" && rawShow !== "always") {
                this.warn(
                    `x-drawer:${this.attr}: expandable.showTrigger 值 "${rawShow}" 无效（hover/always），已回退 hover`,
                );
            }
            el.setAttribute("data-show-trigger", rawShow === "always" ? "always" : "hover");
            // 感应边条（hover 模式，ADR-0070 修订）：与 x-expandable 同款全长感应——覆盖抽屉
            // 活动边线（展开态 = 面板开口边、折叠态 = 屏幕/锚边，几何随把手同步），厚 24px
            // 跨边内外各 12px。插入把手**之前**（共享 `.edge:hover ~ .trigger` 显形规则的
            // 兄弟序前提）；样式在 drawer-shell（fixed + 显示分派），几何在 _positionTrigger。
            // **resize 启用时抑制**（ADR-0070 修订，Q4=A 静态判定）：边条 z(overlay+1) 盖过
            // 面板内 resize 手柄（panel stacking context 封顶，无法抬层）会拦截拖拽——此时
            // 手柄本身充当全长感应线（桥接见 _attachResize），成员表达式动态启用 resize 的
            // 边缘场景不覆盖（文档注明）
            if (rawShow !== "always" && !this.getOption("resize")) {
                const edge = document.createElement("div");
                edge.className = "autospark-expandable-edge";
                edge.setAttribute("aria-hidden", "true");
                edge.setAttribute("data-show-trigger", "hover");
                this._edgeEl = edge;
            }
            // **resize 让位语义**（ADR-0070 修订）：把手 z(overlay+1) 高于面板内 resize 手柄
            // （panel stacking context 封顶 ≤1000）——开口边中央（pos 默认 '50%' 恰在此）抓手柄
            // 拖拽命中的是把手而非手柄，resize 无法启动（hover 模式把手隐形，症状为「神秘
            // 折叠」）。让位：resize 启用且指针落在手柄带内 → 转发 pointerdown 给手柄（启动
            // resize 会话）+ 抑制本次 click（折叠不触发）；把手外半（面板外侧突出部）照常折叠
            el.addEventListener("pointerdown", (ev) => this._onTriggerPointerDown(ev));
            this._triggerEl = el;
            // 先定位再插入（避免 transition 从 0,0 滑到首位的闪移）
            this._positionTrigger();
            if (this._edgeEl) container.appendChild(this._edgeEl);
            container.appendChild(el);
            const onViewport = () => this._positionTrigger();
            window.addEventListener("resize", onViewport);
            window.addEventListener("scroll", onViewport, true);
            this._triggerCleanup = () => {
                window.removeEventListener("resize", onViewport);
                window.removeEventListener("scroll", onViewport, true);
            };
        }

        /**
         * 选项成员表达式热应用（ADR-0007 修订钩子）：`expandable`（pos 坐标）变化即重定位
         * ——把手常驻（面板销毁后仍存活），不热应用则折叠态可能长期停在过期坐标（props
         * 热应用由 overlay 基座专管订阅，此处只补坐标维度）。
         */
        protected override _onOptionExprChange(key: string, _value: any): void {
            if (key === "expandable") this._positionTrigger();
        }

        /** 把手随指令销毁摘除（宿主脱离 / scope 死亡 / engine destroy 均达此处） */
        override destroy(): void {
            this._triggerCleanup?.();
            this._triggerCleanup = null;
            this._cancelTriggerSync();
            this._edgeEl?.remove();
            this._edgeEl = null;
            this._triggerEl?.remove();
            this._triggerEl = null;
            super.destroy();
        }

        /**
         * 展开/折叠切换的把手同步点：**与面板动画同帧启动**。面板 enter 的 from→to
         * 切换经 rAF + 宏任务（新插入元素插入帧内切换不产生 transition，见 animate 机制），
         * 把手位置更新须对齐同一调度——立即更新会让把手先行 1~2 帧，视觉脱节；
         * 面板 leave 同步启动（已在文档中渲染），折叠保持立即更新。
         */
        protected override _open(): void {
            super._open();
            this._triggerOn = true;
            this._cancelTriggerSync();
            this._triggerFrame = requestAnimationFrame(() => {
                this._triggerTimer = setTimeout(() => {
                    this._triggerFrame = null;
                    this._triggerTimer = null;
                    this._positionTrigger();
                }, 0);
            });
        }

        protected override _close(): void {
            super._close();
            this._triggerOn = false;
            this._cancelTriggerSync();
            this._positionTrigger();
        }

        /** 撤销待决的展开态对齐调度（重入开合/销毁时防过期位置写入） */
        private _cancelTriggerSync(): void {
            if (this._triggerFrame != null) {
                cancelAnimationFrame(this._triggerFrame);
                this._triggerFrame = null;
            }
            if (this._triggerTimer != null) {
                clearTimeout(this._triggerTimer);
                this._triggerTimer = null;
            }
            if (this._resizeSyncFrame != null) {
                cancelAnimationFrame(this._resizeSyncFrame);
                this._resizeSyncFrame = null;
            }
        }

        /** resize 让位转发后抑制的 click 标记（真实浏览器由 pointerdown preventDefault 抑制
         *  兼容鼠标事件，测试环境手动派发 click 需标志位兜底——双保险） */
        private _suppressTriggerClick = false;

        /**
         * 把手 pointerdown 让位判定（resize 启用 + 展开态）：指针落在手柄带内（getBoundingClientRect
         * 即手柄带几何）→ 转发 pointerdown 给手柄（resize 会话以原 pointerId 启动，client 坐标
         * 保真）+ preventDefault（真实浏览器抑制兼容鼠标事件链 → click 不触发）+ 标志位兜底；
         * 指针在把手外半（面板外侧突出部，手柄带之外）→ 不干预，照常走 click 折叠。
         */
        private _onTriggerPointerDown(ev: PointerEvent | MouseEvent): void {
            if (!this._config?.resize || !this._triggerOn) return;
            const handle = this._overlayInstance?.panel?.querySelector(
                "[data-autospark-resize-handle]",
            ) as HTMLElement | null;
            if (!handle) return;
            const r = handle.getBoundingClientRect();
            const inBand =
                r.width + r.height > 0 &&
                ev.clientX >= r.left &&
                ev.clientX <= r.right &&
                ev.clientY >= r.top &&
                ev.clientY <= r.bottom;
            if (!inBand) return;
            ev.preventDefault();
            this._suppressTriggerClick = true;
            handle.dispatchEvent(
                new MouseEvent("pointerdown", {
                    bubbles: true,
                    clientX: ev.clientX,
                    clientY: ev.clientY,
                    button: 0,
                }),
            );
        }

        /**
         * 把手点击（折叠 ≡ visible 归假，无第三态）：展开态走实例请求关闭（与 ESC/遮罩
         * 同链——含简单路径回写）；折叠态直接写回 `true`（状态是唯一真相源，watch 驱动重开）。
         * resize 让位转发的 pointerdown 不触发折叠（标志位消费）。
         */
        private _onTriggerClick(): void {
            if (this._suppressTriggerClick) {
                this._suppressTriggerClick = false;
                return;
            }
            if (this._triggerOn) {
                const inst = this._overlayInstance;
                if (inst && !inst.destroyed && inst.visible) inst.requestClose("trigger");
            } else {
                this._writeVisible(true);
            }
        }

        /**
         * 把手定位（fixed + left/top，CSS transition .3s 与面板同曲线滑移）：
         * - 圆心恒骑「活动边线」——展开态 = 面板**开口边线**（面板布局盒对侧边，offset 系
         *   布局值不含 transform，enter 动画期取值即终态）；折叠态 = 贴边线（屏幕模式 =
         *   视口边；锚定模式 = 锚内侧对应边）；
         * - 沿边线滑轨位置由 `expandable.pos` 坐标决定（{@link _triggerCross}，默认居中）；
         * - `data-direction` = placement（共享箭头矩阵/半圆裁切的 CSS 钩子——属性随身）；
         *   折叠态 `data-collapsed` + `data-half`（半圆形态判据，共享把手视觉）。
         */
        private _positionTrigger(): void {
            const el = this._triggerEl;
            if (!el) return;
            const dir = this._screenPlacement();
            el.setAttribute("data-direction", dir);
            el.toggleAttribute("data-collapsed", !this._triggerOn);
            el.toggleAttribute("data-half", !this._triggerOn);
            const horizontal = dir === "left" || dir === "right";
            // 半径（样式注入前 offsetWidth 为 0，回退默认 20px——共享把手契约直径）
            const half = (horizontal ? el.offsetWidth || 20 : el.offsetHeight || 20) / 2;
            // 贴边线（折叠位）+ 滑轨长度：锚定模式取锚 rect，屏幕模式取视口
            const at = this._effectiveAt();
            const anchorEl = at ? resolveAnchorEl(at.selector, this.el) : null;
            const ar = anchorEl?.getBoundingClientRect();
            const vw = document.documentElement.clientWidth;
            const vh = document.documentElement.clientHeight;
            const edgeLine = ar
                ? (dir === "right" ? ar.right : dir === "left" ? ar.left : dir === "top" ? ar.top : ar.bottom)
                : (dir === "right" ? vw : dir === "left" ? 0 : dir === "top" ? 0 : vh);
            const lineLen = ar ? (horizontal ? ar.height : ar.width) : horizontal ? vh : vw;
            // 滑轨锚定基准（视口系起点）：锚定模式 = 锚边起点（fixed 坐标须加锚偏移，
            // 否则相对锚边的坐标会被当视口坐标、把手渲染到锚外）；屏幕模式 = 0（视口边）
            const railOrigin = ar ? (horizontal ? ar.top : ar.left) : 0;
            const cross = this._triggerCross(lineLen, half);
            // 开口边线（展开位）：面板布局盒（offset 系不含 transform）对侧边
            let line = edgeLine;
            const panel = this._overlayInstance?.panel;
            if (this._triggerOn && panel) {
                if (dir === "right") line = panel.offsetLeft;
                else if (dir === "left") line = panel.offsetLeft + panel.offsetWidth;
                else if (dir === "top") line = panel.offsetTop + panel.offsetHeight;
                else line = panel.offsetTop;
            }
            if (horizontal) {
                el.style.left = `${line - half}px`;
                el.style.top = `${railOrigin + cross - half}px`;
            } else {
                el.style.top = `${line - half}px`;
                el.style.left = `${railOrigin + cross - half}px`;
            }
            // 感应边条几何与把手同一 `line`/滑轨基准：覆盖整条活动边线（厚 24px 跨边内外
            // 各 12px）——展开态贴面板开口边、折叠态贴屏幕/锚边，与把手同点集同步
            const edge = this._edgeEl;
            if (edge) {
                if (horizontal) {
                    edge.style.left = `${line - 12}px`;
                    edge.style.top = `${railOrigin}px`;
                    edge.style.width = "24px";
                    edge.style.height = `${lineLen}px`;
                } else {
                    edge.style.top = `${line - 12}px`;
                    edge.style.left = `${railOrigin}px`;
                    edge.style.height = "24px";
                    edge.style.width = `${lineLen}px`;
                }
            }
        }

        /**
         * 把手沿边线滑轨坐标（`expandable` 选项的 `pos`，ADR-0063 修订 + ADR-0070 更名）：
         * **边缘锚定模型**——坐标沿滑轨一维（左右抽屉 = top、上下抽屉 = left，由 placement
         * 决定），正距主边（top/left）、负距对面边（bottom/right）的绝对距离；`true`/缺省 =
         * 居中（语法糖 ≡ `'50%'`）。解析：number = px；string = CSS 长度（`'20%'` / `'100px'`
         * / `'2rem'` / `'10vw'`，纯数字字符串按 px；% 基准 = 滑轨长度——屏幕模式视口长轴 /
         * 锚定模式锚边长）。非法值 warn 回退居中；`0` 是合法坐标（距主边 0）。结果静默钳制
         * 到 `[half, 滑轨长 - half]`——把手是唯一的重开触发点，越出滑轨即抽屉不可达（功能性
         * 死锁），钳制而非放任。
         */
        private _triggerCross(lineLen: number, half: number): number {
            const rawOpt = this.getOption("expandable");
            const raw = rawOpt != null && typeof rawOpt === "object" ? (rawOpt as any).pos : rawOpt;
            let dist = this._parseTriggerDist(raw, lineLen);
            if (dist == null) {
                this.warn(
                    `x-drawer:${this.attr}: expandable.pos 须为 true/数字（px）或 CSS 长度字符串（如 '-20%'），已按居中处理`,
                );
                dist = lineLen / 2;
            }
            return Math.min(Math.max(dist, half), lineLen - half);
        }

        /** expandable.pos 取值 → 距主边的 px 距离（边缘锚定换算：负值 = 距对面边）；非法返回 null */
        private _parseTriggerDist(raw: any, lineLen: number): number | null {
            if (raw == null || raw === true || raw === "") return lineLen / 2;
            if (raw === false) return null; // 不可达（created 已拦），防御性按非法处理
            const toDist = (px: number) => (px >= 0 ? px : lineLen - Math.min(-px, lineLen));
            if (typeof raw === "number") {
                return Number.isFinite(raw) ? toDist(raw) : null;
            }
            if (typeof raw !== "string") return null;
            const m = /^(-?[\d.]+)\s*(%|px|rem|em|vw|vh)?$/i.exec(raw.trim());
            if (!m) return null;
            const v = parseFloat(m[1]!);
            if (!Number.isFinite(v)) return null;
            switch ((m[2] ?? "px").toLowerCase()) {
                case "%": return toDist((v / 100) * lineLen);
                case "rem": return toDist(v * this._rootFontSize());
                case "em": return toDist(v * this._elFontSize());
                case "vw": return toDist((v / 100) * window.innerWidth);
                case "vh": return toDist((v / 100) * window.innerHeight);
                default: return toDist(v); // px / 纯数字
            }
        }

        /** 根字号 px（rem 基准；取不到回退 16） */
        private _rootFontSize(): number {
            return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        }

        /** 把手段字号 px（em 基准；取不到回退根字号） */
        private _elFontSize(): number {
            const el = this._triggerEl;
            return (el && parseFloat(getComputedStyle(el).fontSize)) || this._rootFontSize();
        }

        /**
         * 配置链出口叠加（ADR-0063）：
         * - 默认动画 `'drawer'`：仅当用户未在任一层（静态整包 / 成员表达式）显式配置 animate
         *   时注入——OVERLAY_DEFAULTS.animate='fade' 恒被合入，不能以合并产物判「未配置」；
         * - 形态默认 closeable 缺省 false（ADR-0124 决策 3 修订）——默认表无硬值（undefined ≙
         *   家族 true），合并产物 undefined 即未显式配置，可直接 ??=（与 animate 判定不同源）；
         * - stash 生效配置（mask 选项读取源 + 屏幕贴边方向读取源）。
         */
        protected override _resolveConfig(optionLayer: Record<string, any>): OverlayConfig {
            const userAnimated =
                optionLayer.animate !== undefined || this._optionExprValues?.animate !== undefined;
            const config = super._resolveConfig(optionLayer);
            this._config = config;
            if (!userAnimated) config.animate = "drawer";
            config.closeable ??= false;
            return config;
        }

        /**
         * 模态默认、`mask: false` 可关（ADR-0063）：读官方 mask 选项（ADR-0062——遮罩显隐归
         * 引擎选项）。x-dialog 恒模态不受此影响（基座调用点按形态分派）。
         */
        protected override get _modalMask(): boolean {
            return this._config?.mask !== false;
        }

        /** 定位策略：屏幕贴边（默认/回退）+ 元素贴边锚定（长轴同步），ADR-0063 */
        protected override _positioner(): OverlayInstanceOptions["positioner"] {
            return (ctx) => this._positionDrawer(ctx);
        }

        // ── 定位（ADR-0063）──────────────────────────────────────────────

        /** 定位分派：锚定命中 → 元素贴边锚定；否则 → 屏幕贴边（at 配置了 selector 但未命中时 warn） */
        private _positionDrawer(ctx: OverlayPositionerContext): void {
            const { panel, anchor, anchorEl, registerCleanup, warn } = ctx;
            if (anchor && anchorEl) {
                this._applyAnchorEdge(panel, anchorEl, this._screenPlacement(), registerCleanup);
                return;
            }
            if (anchor) {
                // 有 at 配置但 selector 未命中：回退屏幕贴边（非家族「退居中」——抽屉居中无意义）
                warn(
                    `x-drawer:${this.attr}: at "${String(anchor.selector ?? "")}" 未命中，退屏幕贴边（方向 ${this._screenPlacement()}，ADR-0063）`,
                );
            }
            this._applyScreenEdge(panel);
        }

        /**
         * 元素贴边锚定（ADR-0063 修订）：面板贴锚元素**内侧**对应边覆盖展开——placement 即
         * 展开起始边（`right` = 右缘对齐锚右缘、宽度向左展开朝容器中心），面板恒在锚内
         * 不越界。长轴 = 锚边长（随锚 resize / 视口 resize / 滚动重同步），短轴 inline
         * （{@link _shortAxisSize}）。展开起始边**固定**（不写对侧 inset），宽度/高度动画时
         * 另一缘随动——与屏幕贴边模式的展开语义同构。
         */
        private _applyAnchorEdge(
            panel: HTMLElement,
            anchorEl: HTMLElement,
            dir: string,
            registerCleanup: (fn: () => void) => void,
        ): void {
            const apply = () => {
                const r = anchorEl.getBoundingClientRect();
                // 长轴取 offset 系布局尺寸（getBoundingClientRect 在无布局环境不可靠）
                const long = (dir === "left" || dir === "right")
                    ? `${anchorEl.offsetHeight}px`
                    : `${anchorEl.offsetWidth}px`;
                // 清四向 inset 防方向切换残留（同实例重开方向可变）
                panel.style.left = panel.style.right = panel.style.top = panel.style.bottom = "";
                panel.style.position = "fixed";
                panel.style.margin = "0";
                if (dir === "left" || dir === "right") {
                    // 左右：长轴 = 锚高；展开起始边固定（right 不写 left / left 不写 right）
                    panel.style.top = `${r.top}px`;
                    panel.style.height = long;
                    panel.style.width = this._shortAxisSize();
                    if (dir === "right") {
                        panel.style.right = `${document.documentElement.clientWidth - r.right}px`;
                    } else {
                        panel.style.left = `${r.left}px`;
                    }
                } else {
                    // 上下：长轴 = 锚宽；top 固定展开向下 / bottom 固定展开向上
                    panel.style.left = `${r.left}px`;
                    panel.style.width = long;
                    panel.style.height = this._shortAxisSize();
                    if (dir === "top") {
                        panel.style.top = `${r.top}px`;
                    } else {
                        panel.style.bottom = `${document.documentElement.clientHeight - r.bottom}px`;
                    }
                }
                panel.setAttribute("data-overlay-placement", dir);
            };
            apply();
            // 重同步（floating-ui autoUpdate 的最小替代）：锚尺寸变化 + 视口 resize + 滚动
            // （fixed 坐标随视口，锚滚动后须重算）
            let ro: ResizeObserver | null = null;
            if (typeof ResizeObserver !== "undefined") {
                ro = new ResizeObserver(apply);
                ro.observe(anchorEl);
            }
            const onViewport = () => apply();
            window.addEventListener("resize", onViewport);
            window.addEventListener("scroll", onViewport, true);
            registerCleanup(() => {
                ro?.disconnect();
                window.removeEventListener("resize", onViewport);
                window.removeEventListener("scroll", onViewport, true);
            });
        }

        /**
         * 屏幕贴边定位：fixed + 贴边三边 inset 写死（另一轴由 inset 对拉全屏展开）+ 短轴
         * inline（{@link _shortAxisSize}——配置值或 CSS 变量表达式，不依赖样式表注入时机）。
         * placement 同步写回（'drawer' 动画首帧方向依赖，ADR-0063）。
         */
        private _applyScreenEdge(panel: HTMLElement): void {
            const dir = this._screenPlacement();
            panel.style.position = "fixed";
            panel.style.margin = "0";
            if (dir === "left") {
                panel.style.top = "0";
                panel.style.bottom = "0";
                panel.style.left = "0";
            } else if (dir === "right") {
                panel.style.top = "0";
                panel.style.bottom = "0";
                panel.style.right = "0";
            } else if (dir === "top") {
                panel.style.top = "0";
                panel.style.left = "0";
                panel.style.right = "0";
            } else {
                panel.style.bottom = "0";
                panel.style.left = "0";
                panel.style.right = "0";
            }
            if (dir === "left" || dir === "right") {
                panel.style.width = this._shortAxisSize();
            } else {
                panel.style.height = this._shortAxisSize();
            }
            panel.setAttribute("data-overlay-placement", dir);
        }

        /**
         * resize 装配（ADR-0073 迁移）：**面板上组合 x-expandable 的 resize 通道**（enable:
         * false 退化形态 = 纯单边 resize 壳，ADR-0072）替代 overlay 侧 `_attachResize`——
         * 方向 = placement（right → w…，与旧形态合法集同构）、写路径只写短轴（长轴由贴边
         * inset 对拉/锚定同步管理）、`resize:*` 事件派发**指令宿主**（eventTarget 参数，
         * `@resize:end` 监听位置不变）、拖出短轴经 driver.resized 进会话记忆（`_resizeMem`，
         * ADR-0064 决策八保留）并调度把手跟随（rAF 合帧）。手柄桥接显形把手（data-edge-hover
         * 统一契约）；把手 pointerdown 让位转发见 `_onTriggerPointerDown`。dialog 的四角
         * resize 不适用单边语义，overlay 层 `_attachResize` 为其保留。
         */
        protected override _attachResize(ctx: {
            panel: HTMLElement;
            config: OverlayConfig;
            registerCleanup: (fn: () => void) => void;
        }): void {
            const cfg = ctx.config.resize;
            if (cfg == null || cfg === false) return;
            const placement = this._screenPlacement();
            const opts =
                cfg === true
                    ? { enable: false, resize: true, direction: placement }
                    : {
                          enable: false,
                          resize: { ...(cfg as Record<string, any>) },
                          direction: placement,
                      };
            const horizontal = placement === "left" || placement === "right";
            // 渐进增强（ADR-0008 决策 4）：expandable 组合经注册表查询——layout 产物已加载则
            // 启用 resize 手柄/会话记忆，缺席则跳过本形态（无手柄，不 warn）
            const ExpandableCls = (this.engine.directives as unknown as Map<string, any>).get("expandable");
            if (typeof ExpandableCls?.compose !== "function") return;
            const inst = ExpandableCls.compose(
                this.engine,
                this.binding,
                ctx.panel,
                opts,
                {
                    get: () => false, // 折叠功能关闭（退化形态）——开合归 visible 归假，与 resize 无关
                    set: () => {},
                    resized: (decl) => {
                        // 会话记忆（ADR-0064 决策八）+ 把手跟随（rAF 合帧，调节改变开口边线）
                        this._resizeMem = horizontal
                            ? { width: decl.value, height: this._resizeMem?.height ?? 0 }
                            : { width: this._resizeMem?.width ?? 0, height: decl.value };
                        this._scheduleTriggerFollow();
                    },
                },
                this.el,
            );
            inst.created();
            inst.compile(undefined as any, ctx.panel);
            ctx.registerCleanup(() => inst.destroy());
            // 手柄桥接显形（hover/focus 置位把手 data-edge-hover 统一契约）。手柄随面板每次
            // 打开重建，此处每次接线（旧监听随旧面板 DOM 消亡）
            const handles = ctx.panel.querySelectorAll<HTMLElement>("[data-autospark-resize-handle]");
            if (!handles.length) return;
            const set = (on: boolean) => this._triggerEl?.toggleAttribute("data-edge-hover", on);
            for (const h of handles) {
                h.addEventListener("mouseenter", () => set(true));
                h.addEventListener("mouseleave", () => set(false));
                h.addEventListener("focus", () => set(true));
                h.addEventListener("blur", () => set(false));
            }
        }

        /** 把手跟随帧调度（rAF 合帧——每帧调节只重定位一次；.3s transition 平滑跟随） */
        private _scheduleTriggerFollow(): void {
            if (this._triggerEl == null || !this._triggerOn || this._resizeSyncFrame != null) return;
            this._resizeSyncFrame = requestAnimationFrame(() => {
                this._resizeSyncFrame = null;
                this._positionTrigger();
            });
        }

        /**
         * 短轴尺寸（`size` 选项，方向中立，ADR-0063）：`number`（px）或 CSS 长度字符串
         * （`'40%'` / `'20rem'` / 纯数字字符串按 px）；缺省回退 CSS 变量表达式
         * `var(--autospark-drawer-size, 280px)`——inline 恒写短轴（不依赖样式表注入时机），
         * 变量可调性保留。非法值 warn 回退默认。resize 启用后**会话内记忆值优先**（ADR-0064
         * 决策八：拖出尺寸重开沿用，用户改声明 `size` 不生效属预期——重置路径 = engine 重建）。
         */
        private _shortAxisSize(): string {
            if (this._resizeMem) {
                const placement = this._screenPlacement();
                const v =
                    placement === "left" || placement === "right"
                        ? this._resizeMem.width
                        : this._resizeMem.height;
                if (Number.isFinite(v) && v > 0) return `${v}px`;
            }
            const raw = this._config?.size;
            const fallback = "var(--autospark-drawer-size, 280px)";
            if (raw == null || raw === "") return fallback;
            if (typeof raw === "number") {
                if (Number.isFinite(raw) && raw > 0) return `${raw}px`;
            } else if (typeof raw === "string") {
                const s = raw.trim();
                if (/^\d+(\.\d+)?$/.test(s)) return `${Number(s)}px`;
                if (s) return s;
            }
            this.warn(
                `x-drawer:${this.attr}: size 须为正数（px）或 CSS 长度字符串（如 '40%'），已按默认 280px 处理`,
            );
            return fallback;
        }

        /**
         * 生效 at 配置（三层回退：`_config`（打开期 resolve 产物）> 成员表达式层（
         * `x-drawer-options.at` 修饰符）> 静态整包层（`x-drawer-options` 内嵌 at））——
         * 折叠把手 created 期定位时 `_config` 尚空，须回退指令选项两层。
         */
        private _effectiveAt() {
            return normalizeAtConfig(
                this._config?.at ?? this._optionExprValues?.at ?? this.options?.at,
            );
        }

        /**
         * 屏幕贴边方向（复用 `at.placement`，ADR-0063）：主方向归一（`-start/-end` 静默剥离）；
         * 缺省 / `'auto'` / 非法值一律按默认方向（right，静默——「不配即 right」心智最简单，
         * 且 autoPlacement 屏幕模式无锚无从谈起）。
         */
        private _screenPlacement(): string {
            const at = this._effectiveAt();
            const raw = String(at?.placement ?? "").trim();
            if (raw === "" || raw === "auto") return DEFAULT_DRAWER_PLACEMENT;
            const main = raw.split("-")[0]!;
            return DRAWER_MAIN_DIRECTIONS.has(main) ? main : DEFAULT_DRAWER_PLACEMENT;
        }
    }

    return {
        dialog: DialogDirective,
        popover: PopoverDirective,
        drawer: DrawerDirective,
    };
}

/** 双路径自举：注册内置 shell + 家族三指令 */
export function bootstrapOverlayFamily(): void {
    installPlugin((autospark) => {
        registerBuiltinShells(autospark);
        const classes = createOverlayDirectives(autospark.ComponentDirective);
        for (const name of ["dialog", "popover", "drawer"] as const) {
            autospark.directive(name, classes[name]);
        }
        // engine.getOverlay 薄壳的命名空间注入（ADR-0128 决策 2 修订）：单份机制状态的
        // 命令式入口（engine 侧薄壳经 constructor.getOverlay 委托至此）
        (autospark as unknown as Record<string, unknown>).getOverlay = (
            engine: any,
            el: HTMLElement | null | undefined,
            name: string,
            options?: Record<string, any>,
        ): unknown | undefined => {
            const scope = el ? engine.findScopeByEl(el) : undefined;
            const snapshot = scope
                ? scope.getComponentDeclaration(name)
                : (engine._resolveGlobalComponent(name) ?? undefined);
            if (!snapshot) {
                engine.logger.warn(
                    `engine.getOverlay("${name}"): 未找到覆盖物组件（${el ? "scope 链与全局" : "全局"}均未命中，ADR-0052 决策 15）`,
                );
                return undefined;
            }
            const def = engine.getComponentDef(snapshot) ?? engine.getGlobalComponentDef(name) ?? null;
            return new OverlayHandle(engine, name, snapshot, def, options ?? null, scope ?? null);
        };
    });
}

bootstrapOverlayFamily();
