/**
 * 结构指令进出场动画（ADR-0039）：Vue 同构的六类名 CSS 生命周期 + 内置 fade/slide/expand。
 *
 * 服务挂 engine 实例（`engine.animate`），**不对消费者文档化**（内部 API，ADR-0039 决策 5）——
 * 后续 x-teleport / x-loading / x-tree 等接入只需加挂点。
 *
 * ## 六类名契约（决策 2）
 *
 * 进场：挂 `{name}-enter-from` + `{name}-enter-active` → 强制 reflow → 摘 from 挂
 * `{name}-enter-to` → 结束全摘；出场镜像（`leave-*`）。自定义动画 = 用户按此约定写 CSS
 * （transition 型 / keyframe 型皆可），传名即用、零注册 API。
 *
 * ## 高度型内置动画 expand（决策 13）
 *
 * 类名型动画 transition 的是 transform/opacity——**不参与布局**，展开/折叠类场景（树、
 * 手风琴）的后续节点会瞬时跳位。`expand` 为 height 0 ↔ 测量高度 + opacity 的 inline
 * 过渡（from/to 是动态测量值，静态 CSS 类无法表达），布局高度参与过渡、后续节点平滑
 * 跟随；同元素多子节点场景不受 grid 0fr/1fr 配方的「单子元素」约束。
 *
 * ## 结束检测（决策 4）
 *
 * `transitionend` / `animationend`（过滤 `e.target === el`，防冒泡误判）+ 超时兜底
 * （computed duration+delay 与配置 duration+delay 取最大 + buffer）。computed 与配置
 * 均为 0 时（无动画环境 / 用户 CSS 降级 reduced-motion）下一宏任务即完成——降级天然兼容（决策 11）。
 *
 * ## 抢占（决策 7）
 *
 * 同元素动画互斥（Map 跟踪）：`enter`/`leave` 起手先 `cancel` 在播动画。**cancel = 同步完成**：
 * 若在播的是携带延迟移除回调（onDone）的离场，立即执行 onDone（完成 DOM 移除）——调用方随后
 * 按新状态全新挂载，语义干净。enter 无 onDone，cancel 仅清类/定时器。
 */
/** 单相（enter/leave）动画的解析结果 */
export interface PhaseAnim {
    /** 动画名（六类名的 `{name}` 前缀），如 fade / slide / 用户自定义名 */
    name: string;
    /** 时长 ms（经 inline style 同时覆盖 transition-* 与 animation-*，决策 3） */
    duration?: number;
    /** 延迟 ms */
    delay?: number;
    /** 缓动函数 */
    easing?: string;
}
/** animate 选项的解析结果：enter/leave 各自的相配置；null = 该相禁用（或无动画） */
export interface ResolvedAnimate {
    enter: PhaseAnim | null;
    leave: PhaseAnim | null;
}
/**
 * 解析 animate 选项（决策 3）：三形态——
 * - 字符串 `'fade'`：进出同名；
 * - 对象 `{name,duration,delay,easing}`：基础字段施于两相；
 * - 分相覆盖 `{enter:'slide', leave:false}`：相值各自接受 字符串 | 对象 | false（单相禁用），
 *   显式键胜出、缺相回退基础字段。无 name（基础与相均无）即该相无动画。
 */
export declare function resolveAnimate(option: unknown): ResolvedAnimate;
/**
 * 进出场动画服务（engine 实例级）。指令无关接口：
 * `enter(el, phase)` / `leave(el, phase, onDone)` / `cancel(el)` / `dispose()`。
 */
export declare class AutoSparkAnimator {
    /** 进行中动画：el → 记录（同元素互斥、后者抢占，决策 7） */
    private active;
    constructor();
    /**
     * 进场动画：挂 enter-from + enter-active → reflow → 摘 from 挂 to → 结束全摘。
     * 起手抢占在播动画（含同步完成待决离场）。
     * @returns 是否启动了动画（phase 为 null 即未配置 → false，调用方直接同步处理）
     */
    enter(el: HTMLElement, phase: PhaseAnim | null): boolean;
    /**
     * 离场动画：挂 leave-from + leave-active → reflow → 摘 from 挂 to → 结束全摘 + onDone()
     * （onDone 承载真正的 DOM 移除——离场动画的本质是延迟移除）。
     * @returns 是否启动了动画（false 时调用方应立即执行 onDone 同步移除）
     */
    leave(el: HTMLElement, phase: PhaseAnim | null, onDone: () => void): boolean;
    /**
     * 取消在播动画（抢占的实现面）：清类/定时器/监听、还原 inline。
     * **cancel = 同步完成**：若在播离场携带 onDone，立即执行（DOM 移除到位），调用方随后
     * 按新状态全新挂载——中断语义干净（决策 7）。无在播动画时 no-op。
     */
    cancel(el: HTMLElement): void;
    /** engine 销毁：取消全部在播（离场 onDone 同步完成，DOM 随销毁清理） */
    dispose(): void;
    private _start;
    /**
     * 高度型动画（内置 expand，决策 13）：height 0 ↔ 自然高度 + opacity 同链 inline 过渡。
     *
     * - enter：此刻元素已 display 可见且无 height 残留（调用方刚恢复显示 / cancel 已还原
     *   抢占期的 inline）→ 测量自然高度 → 起始帧 height:0/opacity:0 → reflow → 目标帧
     *   height:测量值/opacity:1；
     * - leave：锁定当前自然高度 → 过渡到 0（onDone 延迟真正的隐藏/移除，与类名型契约一致）；
     * - 测量值为 0（空容器 / 无布局环境）→ 返回 false，调用方同步处理（契约同 phase=null）；
     * - box-sizing 动画期强制 border-box：height 数值与 offsetHeight（border-box 渲染高）
     *   语义对齐，content-box 下 padding/border 不产生测量误差；finish 经 inline 备份还原。
     */
    private _startHeight;
    /**
     * 结束检测注册（决策 4，类名型 / 高度型两路径共用）：事件（过滤 target + 属性归属，
     * 收齐全部分属事件）+ 超时兜底。多属性过渡（如 `transition: height .3s, opacity .3s`）
     * 会按属性各发一个 transitionend——**先到者不得提前终结**（否则长属性动画半途被摘类/
     * 还原 inline，布局属性如 height 会停在中途高度）。期望事件数从 computed
     * transition-property / animation-name 解析；不可得（happy-dom 等）时退化为
     * 单事件即结束（旧语义，测试驱动路径）。total=0（无动画环境 / reduced-motion
     * 降级）：下一宏任务即完成，不空等。
     */
    private _registerEnd;
    /** finish / cancel 共用清理：摘类、还原 inline、清定时器与监听、执行 onDone */
    private _finish;
    /**
     * 配置的 duration/delay/easing 经 inline style 同时覆盖 transition-* 与 animation-*
     * （自定义动画两种基底都存在，决策 3/4）。返回备份供 finish 还原。
     */
    private _applyInline;
}
