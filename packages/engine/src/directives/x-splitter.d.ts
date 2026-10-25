import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { AutoSpark } from "../engine/engine";
import type { AutoDirectiveInfo } from "../features/directive/types";
/** 方向类型 */
export type SplitterDirection = "horizontal" | "vertical";
/** 注入 splitter 全局样式（幂等；多 engine 共享、destroy 不移除——对齐全局样式惯例） */
export declare function registerSplitterStyles(): void;
/** 把手滑轨定位的样式表钳制形态见 SPLITTER_CSS（inline 只写 --as-rail 坐标变量） */
/**
 * x-splitter 指令（ADR-0067）：Compile 类结构指令（ownsChildren——剥伪绑定后自行编译
 * 两面板、注入分隔条）。实现结构见类头注释。
 */
export declare class SplitterDirective extends AutoSparkDirectiveBase {
    static readonly priority = 0;
    static readonly singleton = true;
    /** 结构指令：接管子树（编译两面板 + 注入分隔条，多余渲染子元素 warn 丢弃） */
    static ownsChildren(_info: AutoDirectiveInfo): boolean;
    /** 类级初始化：注入全局样式（幂等） */
    static initialize(_engine: AutoSpark): void;
    /** 当前方向（表达式求值派生，非 vertical 一律 horizontal） */
    private _dir;
    /** 面板声明（1~2 个；length < 2 = 已降级普通编译） */
    private _panes;
    /** sized 面板在其间的序（0 = 分隔条前；null = 无 sized（双 auto 静态形态）） */
    private _sizedIndex;
    /** 面板编译产物（compile 期填充；与 _panes 对齐） */
    private _paneEls;
    /** 分隔条元素 */
    private _divider;
    /** 折叠组合实例（sized 面板声明 data-expandable 时创建，ADR-0070） */
    private _composeInst;
    /** 折叠目标（组合 options 的 minSize 解析；null = 0 隐藏——slide 通道） */
    private _paneMinDecl;
    /** sized 面板当前声明值（唯一内部真相；null = 无 sized） */
    private _curSize;
    /** 折叠前尺寸记忆（实例状态；engine destroy 随实例回收） */
    private _lastSize;
    /** sized 尺寸的可写状态路径（null = 静态声明或表达式降级） */
    private _sizePath;
    /** 表达式降级 warn 已发（一次） */
    private _warnedReadonly;
    /** UI-only 折叠 warn 已发（一次） */
    private _warnedUiOnly;
    /** 当前折叠态（组合布尔的本地镜像——拖拽/外部写值跨目标检测与恢复链判据） */
    private _collapsed;
    /** 进行中的拖拽/键盘会话（null = 空闲） */
    private _session;
    /** 键盘会话所在元素（keyup/blur 收尾判定） */
    private _kbTarget;
    /** 微任务建连前被销毁（快速 x-if 切换防护） */
    private _destroyed;
    created(): void;
    compile(_context: Record<string, any>, _parent: HTMLElement): void;
    destroy(): void;
    /**
     * 扫描宿主模板直接子元素：只认两个渲染元素为面板（`<template>`/`<script>` 静默容忍
     * 不计数不编译）；多余渲染子元素 warn + 丢弃（x-tree 先例）；空白文本静默、非空白文本
     * warn 丢弃。冻结快照 clone（模板只读契约），绑定形态伪属性剥除（防 BindDirective 双通道）。
     */
    private _collectPanes;
    /** 单面板声明：克隆冻结快照 + 解析 data-size 家族（静态/绑定两形态）+ 剥除绑定伪属性 */
    private _declarePane;
    /** 编译单个面板到宿主（temp wrapper 技巧：compileSubtree 只认模板子节点） */
    private _compilePane;
    /** direction 解析：引号字符串字面量静态生效；否则作表达式 watch（非 vertical 静默归一） */
    private _setupDirection;
    /** 非 'vertical' 一律 horizontal（表达式空窗期 undefined 友好，静默归一） */
    private _normalizeDir;
    /** 应用方向：host 属性/类 + sized 尺寸换轴重写 + 分隔条/把手方向分派 */
    private _applyDirection;
    /** sized 面板识别 + size/min/max 订阅（简单路径双向；表达式单向降级） */
    private _setupSizeBinding;
    /** 状态值 → 长度声明（number=px；string 解析；非法 null） */
    private _parseStateLength;
    /** min/max 绑定现值缓存（订阅回调维护；null = 未绑定或值非法） */
    private _minBound;
    private _maxBound;
    /** 现读 min/max 生效值（绑定现值优先、静态声明兜底；null = 无界） */
    private _readBound;
    /**
     * 折叠目标（组合 options 的 minSize，ADR-0070）：null = 无声明 → 折叠 = 0（隐藏，
     * slide 负 margin 通道）；有声明 → 折叠 = 该尺寸（收缩迷你形态）。
     */
    private _collapseTarget;
    /** 构建分隔条（双 auto 静态形态：data-static——不可聚焦不可拖、无把手） */
    private _buildDivider;
    /** 组合实例的收起方向：按 sized 位次推导（首位向主端收、次位向对端收） */
    private _expandableDir;
    /**
     * 组合实例装配（compile 末尾）：sized 面板声明 `data-expandable` → 面板上实例化
     * x-expandable（把手/动画/事件全管线）。**折叠布尔为真相**：driver 由本指令持有——
     * get 供初值（初始声明 == 折叠目标即初始折叠），set 承接把手翻转（记忆 lastSize/
     * 状态写回后再经 composeSet 驱动全管线）。初始应用微任务与模板形态同一时机语义
     * （无动画、不派发事件）。options 接管语义：direction 按位次推导、maxSize 由
     * lastSize 恢复链供给（声明无效 warn）；面板把手默认 `showTrigger:'always'`。
     */
    private _setupCompose;
    /**
     * 组合 driver 落点（把手点击/键盘翻转，ADR-0070 决策三）：折叠前记忆 lastSize
     * （实例状态），展开走恢复链（lastSize → 声明值[非折叠值] → 200px 兜底）经
     * composeSetMaxSize 喂给组合实例；绑定形态同步写回状态（watcher 回流被等值短路吸收）。
     */
    private _onDriverSet;
    /** 展开恢复链：lastSize → 声明值（仅非折叠态值）→ 200px 兜底 */
    private _restoreDecl;
    /**
     * 应用尺寸（普通尺寸通道：inline 直写 + 簿记）。**折叠目标值不经此写**——终态由
     * 组合实例承担（slide 负 margin / 收缩写 minSize）；allowTarget 服务初始应用
     * （初始折叠场景面板宽度先行落位，组合实例初始滑出才有 extent 可测）。
     */
    private _applySize;
    /** 外部状态 → DOM（反向通道）：会话期抑制 + 等值短路（防递归）+ 跨折叠目标驱动组合实例 */
    private _applyFromState;
    private _onPointerDown;
    private _onPointerMove;
    /** 会话开始：快照换算基准与钳制（会话内恒定，消灭每帧 reflow） */
    private _beginSession;
    /** 会话内调节落点（钳制 → 递进记账 → 跨目标翻转检测 → 应用 → 写回；end 时派发 resize） */
    private _applyPx;
    /** 拖拽/键盘中的写回（实时；响应式下游由调度器合并） */
    private _writeSizeThrottled;
    /** 会话结束：摘 data-dragging + splitter:resize 事件（最终值） */
    private _endSession;
    private _onKeyDown;
    private _endKeyboard;
    /** 声明值是否为折叠目标（跨目标翻转检测与 lastSize 记忆判据共用） */
    private _isCollapseTarget;
}
