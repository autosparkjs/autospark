import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { AutoSpark } from "../engine/engine";
/**
 * x-resizable：宿主元素尺寸的拖拽调节指令（ADR-0064）。
 *
 * **可选值双向**（对齐 x-model 哲学）：
 * - 无值——纯 DOM：拖拽直改宿主 `style.width/height`（+ 定位元素 w/n 手柄的 left/top 补偿）；
 * - 有值（`x-resizable="size"`）——双向绑定：拖拽中实时写回 `{width, height}`（px number，
 *   简单路径经落点解析逐段直写），外部改状态反向同步宿主（过 min/max 钳制、等值短路防循环）。
 *
 * **方向声明**（{@link RESIZE_DIRECTIONS} 八方向）：`handles` 选项（逗号串或数组）为主通道；
 * 修饰符 `x-resizable.e.s.se` 解析期并入指令选项（ADR-0007——同名布尔键，本指令归一为方向集）。
 * 默认 `e,s,se`（流内自然最大集——流内元素左/上边缘锚定布局位，反向拖拽需补偿 left/top，
 * 完整 8 向仅对 `absolute/fixed` 定位元素开放；非自然方向编译期丢弃 + warn）。
 *
 * **钳制管线**（{@link clampSize}）：raw Δ → snap 吸附 → aspectRatio 等比 → min/max 钳制
 * （钳制恒最后，约束是硬边界）。约束来源回退链：指令选项（number px | CSS 长度串）→
 * 宿主 computed `min-width/max-width`（CSS 声明的约束天然生效，指令选项显式值优先）。
 *
 * **事件**：`resize:start` / `resize:move` / `resize:end`（冒号命名空间对齐 `tree:*` 家族惯例），
 * 宿主派发、冒泡，`detail = { width, height, handle }`；键盘微调（方向键 ±1px / Shift ±10px）
 * 同管线同事件。
 *
 * **手柄**是宿主真实子元素（`data-autospark-resize-handle="<方向>"` 契约，不参与子树重编译），
 * 编译后微任务注入（挂载后 computed 检测才可靠，对齐 x-teleport 先例）。样式经类级
 * `initialize` 全局注入（幂等），CSS 变量 `--autospark-resize-handle-*` 定制。
 * 覆盖物侧（drawer/dialog 的 `resize` 选项）复用 {@link ResizeSession} 核心，写路径走
 * shell 面板（见 OverlayDirective `_attachResize`）。
 */
/** 八方向枚举：n/s/e/w 四边 + ne/nw/se/sw 四角（北=上） */
export type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
/** 全部合法方向（校验与归一用） */
export declare const RESIZE_DIRECTIONS: Set<string>;
/** 默认方向集：流内自然最大集 */
export declare const DEFAULT_RESIZE_HANDLES: ResizeDirection[];
/**
 * x-resizable 选项形态（`x-resizable-options`）；覆盖物 `resize` 选项对象形态与之同构（ADR-0064 决策八）。
 */
export interface ResizeOptions {
    /** 方向集（逗号串或数组）；缺省 `e,s,se` */
    handles?: string | string[];
    /** 最小宽度：number（px）| CSS 长度串；缺省回退宿主 computed min-width */
    minWidth?: number | string;
    /** 最大宽度：同上；缺省回退宿主 computed max-width */
    maxWidth?: number | string;
    /** 最小高度：同上；缺省回退宿主 computed min-height */
    minHeight?: number | string;
    /** 最大高度：同上；缺省回退宿主 computed max-height */
    maxHeight?: number | string;
    /** 等比锁定（宽/高数值，如 `16/9` relaxed-json 可直接算）；缺省不锁 */
    aspectRatio?: number;
    /** 网格吸附步进（px，默认 0 关闭） */
    snap?: number;
    [key: string]: any;
}
/** 生效约束（全部已换算 px；null = 该轴无约束） */
export interface ResizeConstraints {
    minWidth: number | null;
    maxWidth: number | null;
    minHeight: number | null;
    maxHeight: number | null;
    snap: number;
    aspectRatio: number;
}
/** 无约束基线（克隆起点） */
export declare const NO_CONSTRAINTS: ResizeConstraints;
/**
 * 解析生效约束（回退链：指令选项 → 宿主 computed min/max，ADR-0064 决策五）。
 *
 * 选项值支持 `number`（px）与 CSS 长度串（`'10rem'` 经 getComputedStyle 的临时探针换算 px；
 * 裸数字/px 串直取）；computed 层天然是 px。非法值 warn（由调用方传入 warn 通道）后按无约束处理。
 */
export declare function resolveResizeConstraints(opts: ResizeOptions | null | undefined, target: HTMLElement | null, warn?: (msg: string) => void): ResizeConstraints;
/**
 * 钳制管线（ADR-0064 决策五）：snap 吸附 → aspectRatio 等比 → min/max 钳制。
 * 纯函数（单测直击）。等比时**主轴优先**：横向手柄（含角）以宽为主轴、高 = 宽/比；
 * 纯纵向手柄（n/s）以高为主轴、宽 = 高×比；snap 只作用主轴（从轴由比例派生），
 * min/max 恒最后（硬边界——clamp 改变主轴后从轴随之重算，从轴被 clamp 时比值为软约束让位）。
 */
export declare function clampSize(width: number, height: number, handle: ResizeDirection, c: ResizeConstraints): {
    width: number;
    height: number;
};
/**
 * 归一方向集声明：`handles` 选项（逗号串/数组）+ 修饰符布尔键（`x-resizable.e.s.se` 解析期并入
 * 指令选项的同名 `true` 键，ADR-0007）合并去重；非法值 warn 剪枝；两者皆无 → 默认 `e,s,se`。
 */
export declare function resolveHandles(opts: Record<string, any> | null | undefined, warn?: (msg: string) => void): ResizeDirection[];
/**
 * 读元素当前尺寸（px）：**inline px 精确值优先**，布局值（offset 系）兜底。
 *
 * 精确优先的三个理由（拖拽跳动的修复面）：
 * 1. offsetWidth 是布局取整值——亚像素尺寸（380.4px）读回 380，双向绑定的 watcher 会误判
 *    「值变了」而二次写 style（视觉抖动源）；
 * 2. content-box 元素的 offsetWidth 含 padding/border，与 `style.width` 语义错位——新会话起始
 *    尺寸凭空多出边距量，多次拖放越跳越多；
 * 3. 读 offset 系触发强制同步布局（reflow）——拖拽每帧读一次即每帧回流；读 inline 字符串零成本。
 * 兜底链：inline px（精确）→ offset 系（无 inline 声明时的布局真值，如 width:auto）→ 0。
 */
export declare function readElementSize(el: HTMLElement): {
    width: number;
    height: number;
};
/** 手柄会话起始快照（补偿数学的基准；_dir 为本会话方向，事件派发与键盘通道共用） */
interface SessionStart {
    /** 指针起点 */
    x: number;
    y: number;
    /** 会话内递进尺寸（每轮应用后更新——键盘多次按键/连续 move 的下一轮起点） */
    width: number;
    height: number;
    /** 会话初值尺寸（**不随递进更新**——w/n 补偿与等比联动写入的基准） */
    w0: number;
    h0: number;
    left: number;
    top: number;
    _dir?: ResizeDirection;
}
/**
 * 尺寸调节会话（per-目标控制器，普通元素与覆盖物面板共用，ADR-0064）：
 * 手柄 DOM 生命周期 + Pointer Events 拖拽状态机 + 键盘微调 + `resize:*` 事件派发。
 * **写路径经 `apply` 回调外置**（普通元素写宿主 style + 定位补偿；overlay 写 shell 面板短轴），
 * 钳制/手柄/指针核心逻辑两消费面共享。
 */
export declare class ResizeSession {
    private readonly opts;
    /** 手柄元素清单（attach 时创建） */
    private _handles;
    /** 进行中的会话起始快照（null = 空闲） */
    private _start;
    /** 键盘会话所在手柄（null = 无键盘会话） */
    private _kbHandle;
    /** 本会话约束快照（会话开始时取一次——move 中不重复 getComputedStyle，消灭每帧 reflow） */
    private _c;
    private _destroyed;
    constructor(opts: {
        /** 尺寸读写目标（普通元素 = 宿主；overlay = shell 面板） */
        target: HTMLElement;
        /** `resize:*` 事件派发目标（overlay = 指令宿主，绑定语法不变，ADR-0064 决策七） */
        eventTarget: HTMLElement;
        /** 已校验合法的方向集 */
        handles: ResizeDirection[];
        /** 现读生效约束（每次手势开始时取一次——选项/配置可随重开变化） */
        constraints: () => ResizeConstraints;
        /** 尺寸落点（写路径差异点；start 为会话起始 rect 快照，供 w/n 补偿） */
        apply: (width: number, height: number, handle: ResizeDirection, start: SessionStart) => void;
        /** 每次应用后的回调（写回状态 / 更新会话记忆；overlay 与普通元素各自消费） */
        onApplied?: (width: number, height: number, handle: ResizeDirection) => void;
        warn: (msg: string) => void;
    });
    /** 是否有活跃拖拽/键盘会话（外部→DOM 反向通道的跳过判据） */
    get active(): boolean;
    /** 创建手柄并绑定交互（幂等：重复调用跳过） */
    attach(): void;
    /** 销毁：中断会话、移除手柄（目标随 DOM 销毁时手柄随之而去，此调用保证幂等干净） */
    destroy(): void;
    private _onPointerDown;
    /** 会话开始：快照起始尺寸/定位/约束与起点坐标，派发 resize:start */
    private _begin;
    private _move;
    /** 会话结束：派发 resize:end（detail 为最终值），弃约束快照 */
    private _end;
    /** 当前会话方向（start 快照携带，pointer 与键盘通道同源） */
    private get _currentDir();
    private _kbDir;
    private _onKeyDown;
    private _endKeyboard;
    /** 钳制 → apply → onApplied → resize:move（start 快照随 dw/dh 递进——键盘多次按键累积在同一会话内） */
    private _applyClamped;
    /** 对外应用（外部→DOM 反向通道复用钳制与写路径；不走事件） */
    applyExternal(width: number, height: number): void;
    private _dispatch;
}
/** 注入手柄全局样式（幂等；多 engine 共享、destroy 不移除——对齐全局样式惯例） */
export declare function registerResizeStyles(): void;
/**
 * x-resizable 指令（ADR-0064）：宿主元素尺寸拖拽调节，Compile kind（编译期建绑定、
 * 挂载后微任务注入手柄——computed 检测需已连接文档）。动态启停用 x-if 包宿主表达。
 */
export declare class ResizableDirective extends AutoSparkDirectiveBase {
    static readonly priority = 0;
    static readonly singleton = true;
    /** 类级初始化：注入手柄全局样式（幂等） */
    static initialize(_engine: AutoSpark): void;
    /** 可写回的尺寸状态路径（简单路径形态才有；表达式只读降级） */
    private _sizePath;
    /** 调节会话（挂载后微任务创建；destroy 置 null） */
    private _session;
    /** 微任务建连前被销毁（快速 x-if 切换） */
    private _destroyed;
    /** 只读降级 warn 一次（对齐 x-model 只读降级词条） */
    private _warnedReadonly;
    /** 同元素互斥失效标记（ADR-0072）：宿主同时声明 x-expandable 时本指令自失效 */
    private _dead;
    created(): void;
    /** 编译完成后微任务建连（结果树已挂载，computed 检测可靠——对齐 x-teleport 先例） */
    compile(): void;
    destroy(): void;
    /** 建会话：方向归一 → 流内降级 → 定位锚补齐 → 手柄注入 */
    private _setup;
    /**
     * 普通元素写路径：直改 inline 尺寸 + 定位元素 w/n 手柄的对缘补偿（右/下缘不动）。
     * 写入判定 = 手柄影响该轴 **或值偏离会话初值**（aspectRatio 等比联动的从轴也要写；
     * height:auto 的元素不受同值写入钉死——初值不变不写）。
     */
    private _applyToEl;
    /** 拖拽写回：实时（每应用一次写一次；简单路径落点解析直写，响应式天然合并下游） */
    private _writeBack;
    /** 沿 scope 链探测是否存在局部上下文（locals / x-data 域——决定 watch 分流走向） */
    private _hasLocalContext;
    /**
     * 尺寸状态落点解析（读方向共用）：沿链找首段键的容器（locals → x-data 域）逐段下钻，
     * 全链无局部落点 → 全局 state（getVal 读取）。返回叶对象（尺寸对象本体）。
     */
    private _resolveSizeEntry;
    /** 读方向便捷出口（子键订阅回调重取完整对象） */
    private _readSizeEntry;
    /** 外部状态 → 宿主（反向通道）：会话中跳过（拖拽优先）；等值短路；过钳制管线 */
    private _applyFromState;
    /** 建连前到达的状态初值（_setup 末尾应用一次） */
    private _pendingSize;
}
export {};
