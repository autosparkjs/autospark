import type { AutoSpark } from "../engine/engine";
import type { OverlayInstanceOptions } from "../features/overlay/instance";
import type { OverlayConfig } from "../features/overlay/types";
import { VisibleOverlayDirective } from "../features/directive/visible-overlay";
export declare class DrawerDirective extends VisibleOverlayDirective {
    /** 形态键（ADR-0062）：引擎级默认 shell 的配置键（options.overlay.drawer.shell） */
    protected readonly overlayKind = "drawer";
    /** warn 消息前缀指令名：继承基座的 warn（未找到组件/props 等）按自身指令名提示 */
    protected directiveLabel: string;
    /** 类级初始化：注入 shell 默认视觉样式 + 共享把手样式（均幂等；ADR-0070 把手组合） */
    static initialize(engine: AutoSpark): void;
    /** 生效配置 stash（_resolveConfig 与 _modalMask/_positioner 同一次打开内先后执行） */
    private _config;
    /** 把手元素（实例外常驻——面板销毁后存活；null = 未建/已销毁） */
    private _triggerEl;
    /** 最近 visible 驱动态（把手位置/箭头/裁切的分派依据） */
    private _triggerOn;
    /** 把手的视口监听清理（destroy 时摘除） */
    private _triggerCleanup;
    /** 感应边条（showTrigger:'hover' 时创建；全长活动边线感应，置于把手之前的兄弟） */
    private _edgeEl;
    /** 展开态位置对齐帧句柄（与面板 enter 切换帧同调度；destroy/重入时撤销） */
    private _triggerFrame;
    private _triggerTimer;
    /** resize 会话的把手跟随帧句柄（合帧——每帧调节只重定位一次） */
    private _resizeSyncFrame;
    /**
     * 把手挂载（ADR-0070：把手机制组合 x-expandable 共享把手模块——元素/箭头矩阵/
     * 键盘管线唯一实现，`expandable` 选项承接旧 `trigger`；ADR-0063 修订的常驻语义
     * 保留）：默认开启、`false` 显式关闭；仅反应式（简单路径）形态生效——字面量/
     * 表达式形态状态不可写，把手点击无意义，不建。把手挂覆盖物容器（z 层级同源），
     * 圆心恒骑面板活动边线，几何见 `_positionTrigger`。drawer 语境把手**恒常驻**
     * （折叠态唯一重开触点——共享模块「滑出折叠常驻」规则的覆盖场景）。
     */
    created(): void;
    /**
     * 选项成员表达式热应用（ADR-0007 修订钩子）：`expandable`（pos 坐标）变化即重定位
     * ——把手常驻（面板销毁后仍存活），不热应用则折叠态可能长期停在过期坐标（props
     * 热应用由 overlay 基座专管订阅，此处只补坐标维度）。
     */
    protected _onOptionExprChange(key: string, _value: any): void;
    /** 把手随指令销毁摘除（宿主脱离 / scope 死亡 / engine destroy 均达此处） */
    destroy(): void;
    /**
     * 展开/折叠切换的把手同步点：**与面板动画同帧启动**。面板 enter 的 from→to
     * 切换经 rAF + 宏任务（新插入元素插入帧内切换不产生 transition，见 animate 机制），
     * 把手位置更新须对齐同一调度——立即更新会让把手先行 1~2 帧，视觉脱节；
     * 面板 leave 同步启动（已在文档中渲染），折叠保持立即更新。
     */
    protected _open(): void;
    protected _close(): void;
    /** 撤销待决的展开态对齐调度（重入开合/销毁时防过期位置写入） */
    private _cancelTriggerSync;
    /** resize 让位转发后抑制的 click 标记（真实浏览器由 pointerdown preventDefault 抑制
     *  兼容鼠标事件，测试环境手动派发 click 需标志位兜底——双保险） */
    private _suppressTriggerClick;
    /**
     * 把手 pointerdown 让位判定（resize 启用 + 展开态）：指针落在手柄带内（getBoundingClientRect
     * 即手柄带几何）→ 转发 pointerdown 给手柄（resize 会话以原 pointerId 启动，client 坐标
     * 保真）+ preventDefault（真实浏览器抑制兼容鼠标事件链 → click 不触发）+ 标志位兜底；
     * 指针在把手外半（面板外侧突出部，手柄带之外）→ 不干预，照常走 click 折叠。
     */
    private _onTriggerPointerDown;
    /**
     * 把手点击（折叠 ≡ visible 归假，无第三态）：展开态走实例请求关闭（与 ESC/遮罩
     * 同链——含简单路径回写）；折叠态直接写回 `true`（状态是唯一真相源，watch 驱动重开）。
     * resize 让位转发的 pointerdown 不触发折叠（标志位消费）。
     */
    private _onTriggerClick;
    /**
     * 把手定位（fixed + left/top，CSS transition .3s 与面板同曲线滑移）：
     * - 圆心恒骑「活动边线」——展开态 = 面板**开口边线**（面板布局盒对侧边，offset 系
     *   布局值不含 transform，enter 动画期取值即终态）；折叠态 = 贴边线（屏幕模式 =
     *   视口边；锚定模式 = 锚内侧对应边）；
     * - 沿边线滑轨位置由 `expandable.pos` 坐标决定（{@link _triggerCross}，默认居中）；
     * - `data-direction` = placement（共享箭头矩阵/半圆裁切的 CSS 钩子——属性随身）；
     *   折叠态 `data-collapsed` + `data-half`（半圆形态判据，共享把手视觉）。
     */
    private _positionTrigger;
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
    private _triggerCross;
    /** expandable.pos 取值 → 距主边的 px 距离（边缘锚定换算：负值 = 距对面边）；非法返回 null */
    private _parseTriggerDist;
    /** 根字号 px（rem 基准；取不到回退 16） */
    private _rootFontSize;
    /** 把手段字号 px（em 基准；取不到回退根字号） */
    private _elFontSize;
    /**
     * 配置链出口叠加（ADR-0063）：
     * - 默认动画 `'drawer'`：仅当用户未在任一层（静态整包 / 成员表达式）显式配置 animate
     *   时注入——OVERLAY_DEFAULTS.animate='fade' 恒被合入，不能以合并产物判「未配置」；
     * - stash 生效配置（mask 选项读取源 + 屏幕贴边方向读取源）。
     */
    protected _resolveConfig(optionLayer: Record<string, any>): OverlayConfig;
    /**
     * 模态默认、`mask: false` 可关（ADR-0063）：读官方 mask 选项（ADR-0062——遮罩显隐归
     * 引擎选项）。x-dialog 恒模态不受此影响（基座调用点按形态分派）。
     */
    protected get _modalMask(): boolean;
    /** 定位策略：屏幕贴边（默认/回退）+ 元素贴边锚定（长轴同步），ADR-0063 */
    protected _positioner(): OverlayInstanceOptions["positioner"];
    /** 定位分派：锚定命中 → 元素贴边锚定；否则 → 屏幕贴边（at 配置了 selector 但未命中时 warn） */
    private _positionDrawer;
    /**
     * 元素贴边锚定（ADR-0063 修订）：面板贴锚元素**内侧**对应边覆盖展开——placement 即
     * 展开起始边（`right` = 右缘对齐锚右缘、宽度向左展开朝容器中心），面板恒在锚内
     * 不越界。长轴 = 锚边长（随锚 resize / 视口 resize / 滚动重同步），短轴 inline
     * （{@link _shortAxisSize}）。展开起始边**固定**（不写对侧 inset），宽度/高度动画时
     * 另一缘随动——与屏幕贴边模式的展开语义同构。
     */
    private _applyAnchorEdge;
    /**
     * 屏幕贴边定位：fixed + 贴边三边 inset 写死（另一轴由 inset 对拉全屏展开）+ 短轴
     * inline（{@link _shortAxisSize}——配置值或 CSS 变量表达式，不依赖样式表注入时机）。
     * placement 同步写回（'drawer' 动画首帧方向依赖，ADR-0063）。
     */
    private _applyScreenEdge;
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
    protected _attachResize(ctx: {
        panel: HTMLElement;
        config: OverlayConfig;
        registerCleanup: (fn: () => void) => void;
    }): void;
    /** 把手跟随帧调度（rAF 合帧——每帧调节只重定位一次；.3s transition 平滑跟随） */
    private _scheduleTriggerFollow;
    /**
     * 短轴尺寸（`size` 选项，方向中立，ADR-0063）：`number`（px）或 CSS 长度字符串
     * （`'40%'` / `'20rem'` / 纯数字字符串按 px）；缺省回退 CSS 变量表达式
     * `var(--autospark-drawer-size, 280px)`——inline 恒写短轴（不依赖样式表注入时机），
     * 变量可调性保留。非法值 warn 回退默认。resize 启用后**会话内记忆值优先**（ADR-0064
     * 决策八：拖出尺寸重开沿用，用户改声明 `size` 不生效属预期——重置路径 = engine 重建）。
     */
    private _shortAxisSize;
    /**
     * 生效 at 配置（三层回退：`_config`（打开期 resolve 产物）> 成员表达式层（
     * `x-drawer-options.at` 修饰符）> 静态整包层（`x-drawer-options` 内嵌 at））——
     * 折叠把手 created 期定位时 `_config` 尚空，须回退指令选项两层。
     */
    private _effectiveAt;
    /**
     * 屏幕贴边方向（复用 `at.placement`，ADR-0063）：主方向归一（`-start/-end` 静默剥离）；
     * 缺省 / `'auto'` / 非法值一律按默认方向（right，静默——「不配即 right」心智最简单，
     * 且 autoPlacement 屏幕模式无锚无从谈起）。
     */
    private _screenPlacement;
}
