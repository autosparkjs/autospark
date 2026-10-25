import type { AutoSpark } from "../engine/engine";
import type { OverlayConfig } from "../features/overlay/types";
import { OverlayDirective } from "../features/directive/overlay";
export declare class PopoverDirective extends OverlayDirective {
    /** 形态键（ADR-0062）：引擎级默认 shell 的配置键（options.overlay.popover.shell） */
    protected readonly overlayKind = "popover";
    /** warn 消息前缀指令名：继承基座的 warn（未找到组件/props 等）按自身指令名提示 */
    protected directiveLabel: string;
    /** 类级初始化：注入 shell 默认视觉样式（幂等；含裸面板 z-index，样式随面板 shell 迁移 ADR-0062） */
    static initialize(engine: AutoSpark): void;
    /** delayShow 计时器（悬浮意图延迟；leave 取消） */
    private _showTimer;
    /** delayHide 计时器（关闭宽限；域内 mouseenter 取消） */
    private _hideTimer;
    /** 指针最后已知坐标（祖先重估 elementFromPoint 反查用——实例关闭后指针未动坐标仍准确） */
    private _lastPointer;
    /** 活跃实例的 overlay:close 广播退订（实例关闭/消费者销毁时退订） */
    private _unsubClose;
    /** 外点关闭监听退订（click 方式打开时挂 document capture、关闭/销毁时摘） */
    private _unsubDocClick;
    created(): void;
    /** 消费者销毁：清触发设施 + 打开中的实例直接请求关闭（无写回目标） */
    destroy(): void;
    /** 打开：基座实例化后登记面板监听 + 注册表 + 关闭订阅（等待重试路径复用同一后置登记） */
    protected _open(): void;
    /** 等待的组件就绪重试：基座已守卫 _driveOn（等待期间 hover 已离开则放弃），补后置登记 */
    protected _retryPendingComponent(): void;
    /** 默认锚 = 宿主元素自身（元素引用两栖形态）；placement 默认 'bottom' + flip 兜底。
     *  `x-popover-options.at` 显式配置时**成员级覆盖**：用户写出的成员生效，缺省成员回退
     *  （selector 缺省宿主、placement 缺省 bottom）——部分锚对象（如只写 placement）不丢锚、
     *  不退居中（换锚只改位置，不改变触发关系——ADR-0060） */
    protected _resolveConfig(optionLayer: Record<string, any>): OverlayConfig;
    /** 活跃实例存活（已开且未销毁） */
    private _isInstanceAlive;
    /** 宿主进入（hover 方式）：取消挂起关闭 → 已开防重 → delayShow 计时（0 立即）打开 */
    private _onEnter;
    /** 宿主离开（hover 方式）：show 计时取消；relatedTarget 已入域（面板/后代 popover）豁免，否则 delayHide 宽限后关 */
    private _onLeave;
    /** 宿主点击（click 方式）：toggle——已开清计时器后关（防 hover 残留计时双开），未开即开 */
    private _onClick;
    /** 面板进入（hover 方式）：取消挂起关闭（宿主↔面板互移不闪关的对面侧） */
    private _onPanelEnter;
    /** 面板离开（hover 方式）：与宿主离开同一判定（relatedTarget 域内豁免 / delayHide 宽限） */
    private _onPanelLeave;
    /**
     * 外点判定（click 方式，document capture）：命中目标在宿主∪活跃面板内豁免——宿主点击
     * 归 `_onClick` toggle 管（防同一次点击双通道打架），面板内点击不关；否则关闭。
     */
    private _onDocClick;
    private _openNow;
    /**
     * 离开调度：relatedTarget 在共享 hover 域（宿主∪面板∪后代 popover 域）内豁免并清除
     * 挂起关闭；否则 delayHide 到期关闭（到期不再重估——宽限期内回到域内会触发域内
     * mouseenter 已清定时器）。
     */
    private _scheduleClose;
    private _closeNow;
    /**
     * 共享 hover 域判定（ADR-0060 hover 链）：宿主 ∪ 活跃面板 ∪ 后代 popover 的域（递归）。
     * 后代 = 注册表中宿主落在本消费者域内的打开消费者——面板虽与宿主、父面板互为 DOM
     * 兄弟（body 容器），链判定让指针穿越「父面板→子宿主→子面板」全程不闪关。
     */
    private _inZone;
    /** 递归收集本消费者的完整 hover 域（into 去重兼防环） */
    private _collectZone;
    /**
     * 后代关闭后的重估（防祖先残留）：指针最后已知坐标经 elementFromPoint 反查现命中元素，
     * 已出域才关闭。场景——ESC 关子后指针物理位于子面板原位置（父面板上方或其外），
     * mouseleave 已被链豁免、不会再触发，唯一可靠的重估时机是后代关闭通知。
     */
    private _reevaluate;
    /**
     * 实例关闭统一善后（ESC/hover 离开/close action/销毁全路径）：注册表移除 + 清触发
     * 设施 + 同步驱动态 + 通知祖先链重估（ESC 关子后父不残留）。订阅在 close 开始的
     * overlay:close 广播上触发——此刻面板 DOM 尚在（leave 动画未播）。
     */
    private _onInstanceClosed;
    /** 通知祖先：本消费者宿主落在其活跃面板子树内的打开消费者逐个重估。
     *  click 消费者跳过（修订决策 6——重估是 hover 链机制，click 父的关闭只听点击/外点/ESC，
     *  防子关闭重估时指针恰在面板外把 click 父误关） */
    private _notifyAncestors;
    /** 实例打开后的后置登记：面板监听（共享域对面侧）+ 注册表 + overlay:close 订阅 + 内容
     *  内边距应用；click 方式补挂外点关闭监听（document capture——capture 路径先于宿主
     *  target 阶段，打开的那次 click 不会回流触发，天然免疫「开即关」） */
    private _attachInstance;
    /**
     * 内容内边距（padding 选项）：现读三层链，应用到 shell 内容区
     * `.autospark-popover-content` 的 inline padding（覆盖 shell 样式表默认 0）——对齐
     * delayShow 现读先例（重开生效）；自定义 shell 未提供该类名的内容区则静默跳过
     * （外壳形态自控内边距，ADR-0062）。
     */
    private _applyContentPadding;
    /** 读取内容内边距（默认 0 = 空串不写 inline，shell 样式表 0px 兜底）；number→px、
     *  字符串按 CSS 值直写（多值如 `'8px 16px'`）、负数/非有限数 warn 回退默认 */
    private _resolvePadding;
    /**
     * 读取触发方式（修订决策 4：回调内现读——热切换自下一次触发生效）。修饰符桥接（决策 5）：
     * `.click` 经 ADR-0007 注入为 `options.click === true`（与 trigger 键名错位，此处桥接），
     * 优先级：显式 `trigger` 恒优先 > `.click` > 默认 hover（对齐 ADR-0007「显式已写则不
     * 覆盖」同精神）。非法值 warn 回退 hover（对齐 `_resolveDelay` 哲学）。
     */
    private _resolveTrigger;
    /** 读取延迟配置（getOption 三层链：成员表达式 > 指令选项 > 宿主选项），非法值 warn 回退默认 */
    private _resolveDelay;
    private _recordPointer;
    private _clearShowTimer;
    private _clearHideTimer;
    private _unsubInstanceClose;
    /** 触发设施整体清理（消费者销毁）：宿主监听 + 双计时器 + 关闭订阅 + 外点监听 + 注册表 */
    private _teardownTriggers;
}
