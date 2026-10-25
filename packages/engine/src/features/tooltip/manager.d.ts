import type { AutoSpark } from "../../engine/engine";
import { type TooltipOptions } from "./types";
/**
 * TooltipManager：全局工具提示引擎级子系统（ADR-0061 决策 1）。
 *
 * 属性约定驱动——引擎树内任意元素带 `title`（编译期已转换为 `data-tooltip`，决策 4）或
 * 手写 `data-tooltip` 即生效，无 x-* 声明。本类负责**消费侧**：
 *
 * - **委托监听**（决策 10）：`mouseover`/`mouseout` + `focusin`/`focusout`（键盘可达，决策 12）
 *   挂 engine 根；命中 `e.target.closest("[data-tooltip]")` 取最近祖先。overlay 容器等
 *   body 侧渲染产物经 `attachDelegationRoot` 追加监听点（决策 15——dialog 内 title 不退回原生）。
 * - **嵌套引擎归属过滤**：命中元素 `closest("[data-autospark]")` 须为本 engine 根（或注册的
 *   额外监听点内）——x-isolate 内部元素只由 isolate 自身引擎响应，防双显。
 * - **单例浮层**（决策 11）：每引擎一个共享 tip 元素常驻容器（隐藏 display:none），内容随
 *   悬停目标切换；`showDelay`/`hideDelay` 延迟防抖，期间重新进入取消隐藏（跨目标快速移动
 *   不闪烁）；移入浮层内取消隐藏（可交互 tooltip）。
 * - **悬停时现读属性**（决策 6）：`:data-tooltip` 插值更新后下次悬停即新内容，显示中不热更。
 * - **断连兜底**（决策 13）：显示期间 rAF 检查触发元素 `isConnected`——x-for 回收/patch/
 *   DOM 移除无事件可感知，断连立即隐藏。
 * - **动画**（决策 16）：显隐经 `engine.animate`（ADR-0039 指令无关服务）驱动，默认
 *   `'slide'`（方向自适应覆写层见 styles.ts）。
 * - **事件双通道**（决策 17）：`tooltip:show`/`tooltip:hide` 引擎总线 + 浮层元素
 *   dispatchEvent，payload `{ el, tip }`；一切隐藏路径均广播 hide。
 * - **命令式**（决策 18）：`engine.tooltip.show(el, opts?)` / `hide()`；`options.tooltip:
 *   false` 时整体不初始化（不注样式、不挂监听），命令式调用 warn + no-op（决策 2 全关语义）。
 */
export declare class TooltipManager {
    readonly engine: AutoSpark<any>;
    /** 特性开关（options.tooltip !== false）；false 时构造即短路——样式/监听/容器全不就位 */
    readonly enabled: boolean;
    /** 全局默认配置（options.tooltip 配置对象；缺省空对象走 TOOLTIP_DEFAULTS） */
    private _globalOptions;
    private _state;
    /** 当前触发元素（shown / waiting-hide 期间有效；waiting-show 为待显示目标） */
    private _currentTarget;
    /** 上一触发元素（离场动画播中鼠标回到浮层时的恢复目标，决策 11 可交互 tooltip） */
    private _lastTarget;
    /** 显示时已解析的配置（leave 动画相在隐藏时复用，避免二次解析） */
    private _activeLeave;
    private _showTimer;
    private _hideTimer;
    private _rafId;
    /** 浮层定位 cleanup（autoUpdate），隐藏时统一执行 */
    private _cleanups;
    /** 单例浮层元素（懒建；常驻容器，display:none 切换可见性） */
    private _tip;
    /** engine 根之外的委托监听点（overlay 容器等 body 侧渲染产物，决策 15） */
    private _extraRoots;
    constructor(engine: AutoSpark<any>);
    /**
     * 命令式显示：与委托同一管道（配置解析/延迟/动画/事件全同构），`opts` 与元素级保留键
     * 同构、单次生效，覆盖该元素属性解析结果（`content` 键可无 DOM 属性注入内容）。
     * `options.tooltip: false` 时 warn + no-op（全关语义，决策 2）。
     */
    show(el: HTMLElement, opts?: TooltipOptions): void;
    /** 命令式隐藏：立即（不走 hideDelay）；未显示时 no-op。false 时 warn + no-op。 */
    hide(): void;
    /**
     * 追加委托监听点（决策 15）：overlay 容器等 body 侧渲染产物——其中的 `title`/
     * `data-tooltip` 元素同样获得工具提示（否则 dialog 内容退回原生 tooltip）。
     * 幂等；过滤规则豁免：额外监听点内元素不做 `data-autospark` 归属判定（容器本就
     * 属于本引擎的渲染产物）。
     */
    attachDelegationRoot(root: HTMLElement): void;
    /** engine.stop()：同步立即隐藏（不留离场动画——挂载 DOM 即将整体移除） */
    hideImmediate(): void;
    /** engine.destroy()：摘除监听与容器、清计时器/兜底循环（动画由 engine.animate.dispose 统一收口） */
    dispose(): void;
    private _handleEnter;
    private _handleLeave;
    /** 延迟隐藏出口（触发元素移出与浮层移出共用）：hideDelay 计时后 _hide（0 = 立即） */
    private _scheduleHide;
    /**
     * 显示请求（委托与命令式唯一入口）：解析属性 → 空内容静默 → showDelay 计时 → 渲染显示。
     * shown/waiting-hide 状态下的新目标 = 单例切换（取消在播离场，直接换内容重定位）。
     */
    private _requestShow;
    /** tooltip 箭头默认让位间距（px）：载体 10×10 菱形露出高 ≈8.5px（半对角，视觉大于 overlay
     *  的 6px 让位），尖端轻微搭住锚边缘（越界 ≈0.5px）——styles.ts 的载体尺寸与覆盖层同心
     *  嵌入（8.49px < padding 7 + 行盒留白）与此值配套，调整须同步 */
    static readonly ARROW_DEFAULT_OFFSET = 8;
    /** 渲染 + 定位 + 进场动画 + show 广播（此刻才真正切换状态为 shown） */
    private _show;
    /**
     * 隐藏（决策 17：一切隐藏路径终点）。`runLeave` = 是否播离场动画（stop 断连兜底等
     * 场景同步摘除）。hide 广播在发起时（语义对齐 overlay:close 的请求时点）。
     */
    private _hide;
    /** 浮层复位：display:none + 定位 cleanup（autoUpdate 循环必须停，否则残留滚动监听） */
    private _teardownTip;
    private _startWatch;
    private _stopWatch;
    /**
     * 大内容溢出截断（ADR-0061 决策 8 maxWidth/maxHeight）：内容先按 max-width wrap、
     * 超出 max-height 的部分经 **-webkit-line-clamp** 截断并显示省略号（…）——对纯文本与
     * 富 HTML 内联内容均优雅（浏览器渲染省略号，无需 JS 拼接）。
     *
     * 显示帧**同步测量**（display block 后读 clientHeight 强制 reflow，无闪烁）：
     * `scrollHeight > clientHeight`（有溢出）→ 行数 = ⌊内容区高 / 行高⌋ 并切换 -webkit-box。
     * 无溢出保持默认 block（避免 -webkit-box 对无溢出内容的布局副作用）。
     * happy-dom 等无布局环境 clientHeight=0 → 判定无溢出跳过（真实浏览器行为为准）。
     */
    private _applyOverflowClamp;
    private _resolveOptions;
    /**
     * 嵌套引擎归属过滤（决策 13）：命中元素须属本引擎树（`data-autospark` 根标识，
     * ADR-0060）或注册的额外监听点（overlay 容器——渲染产物不具根标识，豁免）。
     */
    private _isOwned;
    /** 单例浮层懒建（容器随之懒建；初建 display:none——styles.ts 默认态）。容器同时注册为
     *  委托监听点——浮层内 mouseover/out 事件（可交互 tooltip 的取消/出口）只有容器能收到：
     *  浮层挂 body 下，引擎根监听不可达（overlay 容器同构先例）。 */
    private _ensureTip;
    /** 重绘浮层（每次显示全量重置——上一目标的类名/边框标记/箭头/内容/clamp 状态不残留） */
    private _renderTip;
    /** 双通道事件（决策 17）：引擎总线 + 浮层元素 dispatchEvent（body 侧，树内收不到冒泡） */
    private _emit;
    private _cancelPendingShow;
    private _clearTimer;
    private _clearTimers;
}
