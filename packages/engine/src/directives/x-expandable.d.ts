import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { AutoSpark } from "../engine/engine";
import type { AutoSparkScope } from "../engine/scope";
/**
 * x-expandable：展开折叠（ADR-0069）——宿主元素的通用展开/折叠指令，值为**显式展开态布尔**
 * （true=展开）双向绑定；**全引擎折叠机制唯一实现**（ADR-0070 组合落定：x-splitter 面板
 * `data-expandable` 全机制组合、x-drawer 经共享把手模块统一把手层）。
 *
 * **值形态**（决策二）：简单路径（如 `ui.open`）双向——点击把手经 setVal 回写翻转
 * （x-model 防循环纪律：watcher 等值短路）；复杂表达式 warn 一次 + **只读降级**（点击
 * no-op，不本地假切换——UI 与状态背离是隐性 bug 源）；`true`/`false` 字面量（裸或引号）
 * 恒定态；空值 warn + 指令不作为。
 *
 * **direction = 收起方向**（决策三，停靠边）：`left`=向左收起（把手骑活动边=右边缘）、
 * 默认 `left`；top/bottom 走 height 轴。
 *
 * **折叠双通道由 minSize 分派**（决策四）：
 * - `minSize=0`（默认）= **滑出折叠**，宽度/高度**保持不改**，终态持续保持不归零：
 *   - `collapse:'margin'`（默认）：inline 负 margin 滑出（占位归零、兄弟流入、内容不挤压，
 *     与 splitter slide 通道同构）；需要父容器 `overflow:hidden` 裁剪（见「父容器注入」）。
 *   - `collapse:'slide'`：`translateX/Y(±100%)` 平移（占位不变，服务 fixed 覆盖形态）。
 * - `minSize>0` = 纯尺寸收缩（width/height 过渡至 minSize），子内容**不隐藏**。
 * 展开：maxSize 有值写 inline 尺寸、缺省**移除** inline 尺寸让 CSS 决定（不快照记忆）；
 * auto↔数值的展开/折叠动画经全局 `interpolate-size: allow-keywords` 渐进增强
 * （Chrome 129+/Safari 18.2+ 生效，不支持浏览器瞬跳——需要确定性动画显式声明 maxSize）。
 *
 * **渐变遮盖**（`fadeSize`，默认 0 不启用）：>0 时收缩折叠态在活动边显示渐隐层
 * （宿主 ::before，零 DOM），指示内容被截断（业界惯例）；显示判据 `data-shrunk`
 * （仅收缩折叠挂的宿主级标记，兼作页面 CSS 感知收缩态的通用钩子）。
 * 初始值 false：编译期挂终态、**无动画**（splitter「初始折叠不派发事件」惯例）；margin
 * 通道的滑出距离依赖布局测量，整体推迟到编译后微任务（x-resizable 先例——元素挂载后执行）。
 *
 * **子内容隐藏**（决策五）：滑出折叠态经 `[data-collapsed] > :not(把手){visibility:hidden}`
 * 隐藏——**宿主自身不能 overflow:hidden**（宽度保持的盒子会把 absolute 把手一并裁掉）；
 * 编译后微任务检测宿主 overflow 非 visible（hidden/clip/auto/scroll 任一轴）warn 一次
 * （裁掉/滚走骑边把手防线，overflow 需求由内层包裹承载）。宿主 `data-collapsed` 仅滑出
 * 折叠挂（内容隐藏钩子），把手 `data-collapsed` 独立挂（箭头翻转，minSize>0 折叠也翻转
 * ——两处分离，splitter 先例）。
 *
 * **把手**（决策六 + ADR-0070 共享模块）：构建/箭头矩阵/半圆视觉在 expandable-trigger.ts
 * 唯一实现（20px 圆 + 全局图标 `arrow`、role=button、Enter/Space、指针 stopPropagation，
 * drawer 为第二消费者）；滑轨坐标 `pos` 三态（`'center'` 默认 ≡ `'50%'` / number=px /
 * CSS 长度串负值距对端，越界样式表钳制——把手是唯一重开触点）；`offset` 额外偏移
 * （固定轴语义：+ = 把手跨轴正方向右/下，负值反向——splitter 注入分隔条宽度一半
 * 使把手中分分隔条）。
 * **显隐策略**（`showTrigger`，默认 `'hover'`）：opacity 隐藏不丢命中；感应边条覆盖
 * 整条活动边线（pos 自定义后把手位置不可预知；启用内建 resize 时感应载体让位手柄带，
 * 见「内建单边 resize」——两者同骑一条边线）；常驻仅限滑出折叠（minSize=0——
 * 感应载体随宿主隐藏）与触屏，minSize>0 收缩折叠保持 hover 控制；Tab 聚焦显形；
 * `'always'` 恒常驻。
 * **动态挂载（reparent）**：展开态挂宿主骑活动边；滑出折叠**完成后**（transitionend /
 * 600ms 兜底）移入父容器贴停靠边内侧（宿主滑出后其内子元素随容器裁剪，把手外迁保常驻
 * 可达）；展开动画**启动前**移回宿主。两态定位全 CSS 化（`--as-pos` 变量 + 样式表
 * 钳制，splitter 手法）：展开态相对宿主（rail=活动边长）、折叠态相对父容器（rail=停靠
 * 边长）——同名变量两套规则，reparent 零 JS 测量（实施修订：较 ADR 草案的 rect 快照
 * 反算更简，happy-dom 无布局可测）。`minSize>0` 折叠**永不迁移**（宿主不滑出）。
 *
 * **父容器注入**（决策七）：margin 通道需要父容器裁剪滑出部分。默认
 * `injectOverflow:true` **折叠期间**由指令注入——折叠开始挂 `data-autospark-expandable-clip`
 * （overflow:hidden；父容器本为 hidden/clip 幂等跳过）+ `data-autospark-expandable-dock`
 * （position:relative，把手 reparent 的定位上下文，恒注入），**保持至展开动画完成后**
 * （属性驱动，用户 inline/类样式不受影响；多实例共享父容器 WeakMap 引用计数、最后一个
 * 展开完成才摘）；原值 `auto/scroll` 滚动条折叠期间暂失为已知副作用。`false` 显式禁用
 * 后回落检测：父容器 computed overflow 非 hidden/clip 时 warn 一次、用户自负。
 *
 * **内建单边 resize**（ADR-0072）：`resize` 选项启用单边调节（方向由折叠方向自动推导、
 * 复用 x-resizable 的 ResizeSession 核心、拖出尺寸接管 `_maxDecl` 展开尺寸真相；同元素
 * x-resizable 互斥自失效——边线交互单指令独占）。**把手与手柄同骑活动边线，两层协调**：
 * ① *把手压手柄之上*（宿主挂 `data-resize` → 样式表抬至 z11：手柄带 z10 全长覆盖边线，
 * 压住 z5 把手会让调节线横穿把手圆面、把手圆面区命中被拦 → hover 模式下把手不可见且
 * 折叠不可点）；② *手柄 hover 桥接显形*（`data-edge-hover` 统一契约，splitter/drawer
 * 同款）：感应边条 z4 被手柄带完全盖住收不到 hover，hover 模式的边线感应由手柄转译。
 *
 * **事件**（决策八）：`expandable:expand` / `expandable:collapse`（宿主派发、DOM 冒泡、
 * detail `{ size }`——展开为 maxSize 格式化值或 null，折叠为 0 或 minSize 格式化值）；
 * 初始应用不派发。
 *
 * **静态特性**（决策一）：Compile（编译期 createElement 注入把手——不在模板树、天然
 * 不被 walk，无需 ownsChildren）、priority 50（bind/on 同级）、singleton。
 */
export type ExpandableDirection = "left" | "right" | "top" | "bottom";
export type ExpandableMode = "margin" | "slide";
/** 注入 x-expandable 全局样式（幂等；多 engine 共享、destroy 不移除——全局样式惯例） */
export declare function registerExpandableStyles(): void;
/**
 * x-expandable 指令（ADR-0069）：Compile 类（priority 50、singleton、无 ownsChildren——
 * 把手 createElement 注入不在模板树，天然不被编译；宿主子树照常编译）。实现结构见类头注释。
 */
export declare class ExpandableDirective extends AutoSparkDirectiveBase {
    static readonly priority = 50;
    static readonly singleton = true;
    /** 类级初始化：注入全局样式（共享把手 + 本指令宿主级规则，均幂等） */
    static initialize(_engine: AutoSpark): void;
    /** 收起方向（停靠边），默认 left */
    private _dir;
    /** 把手显隐策略（showTrigger）：hover=边线感应显形（默认）；always=恒常驻 */
    private _showTrigger;
    /** 滑出通道（仅 minSize=0 折叠生效），默认 margin */
    private _mode;
    /** maxSize 展开尺寸声明（null = 缺省：展开时移除 inline 尺寸、CSS 决定） */
    private _maxDecl;
    /** minSize 折叠尺寸声明（null 或 ≤0 = 滑出折叠；>0 = 尺寸收缩） */
    private _minDecl;
    /** 渐变遮盖厚度声明（null 或 ≤0 = 不启用；>0 = 收缩折叠态活动边渐隐遮盖） */
    private _fadeDecl;
    /** 把手额外偏移（null = 未配置；非 "0px" 值写 --as-offset 供两态定位规则消费） */
    private _offsetCss;
    /** 折叠功能开关（enable 选项，默认 true）：false 时退化形态——不建把手、值绑定不订阅 */
    private _enable;
    /** 单边 resize 启用（resize 选项，默认关闭；修饰符 .resize 同效） */
    private _resizeOn;
    /** resize 透传约束（ResizeOptions 剥离 handles/aspectRatio 后的剩余键） */
    private _resizeOpts;
    /** 单边 resize 会话（复用 x-resizable 的 ResizeSession 核心，ADR-0072） */
    private _resizeSession;
    /** 当前展开态（UI 真相；watcher 等值短路的判据） */
    private _expanded;
    /** 双向回写路径（null = 字面量恒态或表达式只读降级——点击 no-op） */
    private _expandedPath;
    /** 值为空 → 指令不作为（不建把手） */
    private _dead;
    /** 表达式只读降级 warn 已发（一次） */
    private _warnedReadonly;
    /** injectOverflow=false 的父容器检测 warn 已发（一次） */
    private _warnedOverflow;
    /** 宿主 overflow 非 visible 的检测 warn 已发（一次） */
    private _warnedHostOverflow;
    /** 初始应用哨兵（初始态不派发事件） */
    private _initialized;
    /** 把手元素 */
    private _trigger;
    /** 感应边条（showTrigger:'hover' 展开态整条边线感应，把手的前置兄弟） */
    private _edge;
    /** 把手当前是否 reparent 在父容器（折叠滑出终态） */
    private _docked;
    /** 本指令写过主轴 inline 尺寸（maxSize/minSize 应用时置位——展开移除仅限自己写过的，
        用户模板自带 inline 尺寸不动） */
    private _ownSizeProp;
    /** 本实例已注入父容器（dock/clip 计数所有权） */
    private _injected;
    /** 动画摘除兜底计时器 */
    private _animTimer;
    /** 微任务初始应用前被销毁（快速 x-if 切换防护） */
    private _destroyed;
    /** 组合驱动器（null = 模板值绑定形态）：get 取初值；set 承接把手翻转（组合方仲裁尺寸写回后再驱动本指令） */
    private _driver;
    /** resize:* 事件派发目标（默认宿主；组合方可指定——drawer 用指令宿主保持监听位置） */
    private _eventTarget;
    /**
     * 组合实例化（ADR-0070）：在 el 上以内部布尔源驱动本指令——**旁路模板值绑定**
     * （折叠布尔真相由组合方持有：把手点击经 driver.set 仲裁，组合方完成 lastSize
     * 记忆/状态写回后经 composeSet 驱动全管线）。生命周期由组合方顺序驱动
     * （created → compile → destroy；compile 的初始应用微任务与模板形态同一时机语义）。
     *
     * @param eventTarget resize:* 事件派发目标（可选，默认宿主 el——drawer 迁移用指令
     *                    宿主承接以保持 @resize:end 监听位置不变，ADR-0073）
     */
    static compose(engine: AutoSpark, binding: AutoSparkScope, el: HTMLElement, options: Record<string, any> | undefined, driver: {
        get(): boolean;
        set(expanded: boolean): void;
        /** resize 写回路由钩子（可选，ADR-0073）：内建单边 resize 应用后以拖出声明回调——组合方接管尺寸真相（splitter 同步 _curSize/lastSize/状态写回；drawer 记 _resizeMem） */
        resized?(decl: {
            value: number;
            unit: string;
        }): void;
    }, eventTarget?: HTMLElement): ExpandableDirective;
    /** 组合面：外部翻转折叠态（真相变更 → 动画/事件/reparent 全管线；animate=false 服务拖拽会话瞬时） */
    composeSet(expanded: boolean, animate?: boolean): void;
    /** 组合面：动态设置展开尺寸声明（splitter lastSize 恢复链专用；null = 缺省移除语义） */
    composeSetMaxSize(decl: {
        value: number;
        unit: string;
    } | null): void;
    /** 组合面：边线交互元素 hover 桥接显形（splitter 分隔条 hover 桥接专用） */
    composeSetEdgeHover(on: boolean): void;
    /**
     * 组合面：收起方向变更（splitter 换轴重排）——清滑出痕迹（四向负 margin/transform，
     * 旧轴 inline 尺寸由组合方先行清理）后按当前态重应用终态。
     */
    composeSetDirection(dir: ExpandableDirection): void;
    created(): void;
    /**
     * enable / resize 选项（ADR-0072）：`enable: false` 关闭折叠功能（不建把手、值绑定
     * 不订阅——退化为 resize 壳）；`resize`（boolean | 对象，修饰符 `.resize` 同效）启用
     **单边调节**——方向 = 活动边法线自动推导，`handles`/`aspectRatio` 子键不适用
     * warn 忽略；双关 → warn + 指令完全不作为。
     */
    private _readEnableResize;
    compile(): void;
    destroy(): void;
    /** 选项成员表达式热应用：pos 坐标 / offset 偏移变化即重定位把手（splitter collapsible 同款） */
    protected _onOptionExprChange(key: string, _value: any): void;
    /** direction / collapse / maxSize / minSize 静态读取（非法值 warn 回退默认） */
    private _readOptions;
    /**
     * offset 解析（**固定轴语义**：+ = 把手跨轴的正方向——left/right 方向 = 向右、
     * top/bottom 方向 = 向下；负值反向）：number = px；string = CSS 长度（负值合法）
     * 或 `calc()`/`var()` 表达式原样透传（splitter 注入分隔条宽度补偿的载体）；非法 null。
     */
    private _parseOffset;
    /** CSS 长度解析（number=px；非法 null）——splitter parseLength 同款 */
    private _parseLength;
    /** CSS 值形态（写 inline）：px 整数、其余两位小数 */
    private _formatCss;
    /** 值解析：空 warn 不作为 / 字面量恒态 / 简单路径双向 / 表达式只读降级 */
    private _setupValue;
    /** 外部状态 → DOM（watcher 回调）：等值短路（防循环——点击回写触发的回流在此被吸收） */
    private _applyFromState;
    /** 把手点击：组合形态翻转仲裁权在组合方；模板形态仅双向路径回写（字面量/只读降级 no-op） */
    private _toggle;
    /**
     * 把手 absolute 定位上下文保障：宿主 computed position 为 static 时 inline 补
     * `position:relative`（微任务挂载后检测——detached 元素 computed 不可靠）。fixed /
     * absolute / 用户显式定位**不动**（slide 通道的目标覆盖形态是 fixed 宿主，CSS 强写
     * relative 会把它覆盖掉）。
     */
    private _ensurePositionContext;
    /**
     * 宿主 overflow 检测（编译后微任务、warn 一次）：hidden/clip 会裁掉骑边把手突出的
     * 外半圆，auto/scroll 会把把手随内容滚走（把手是唯一重开触点）——overflow 需求
     * （裁溢出 / 内部滚动）应由**内层包裹**承载，宿主保持 visible。正向枚举而非
     * `!== "visible"`：happy-dom 对未声明属性返回空串，负向判定会误报。
     */
    private _warnHostOverflow;
    /** 手柄桥接接线落点：**同元素**边线交互元素只有内建单边 resize 手柄一种（x-resizable 已随
         *  ADR-0072 互斥移除），由 `_bridgeHandleHover` 在装配期接线；跨元素桥接（splitter
         *  分隔条 / drawer 面板手柄）仍在消费方各自接线。 */
    /** 构建把手（共享把手模块统一构建——元素/箭头/键盘管线唯一实现；点击行为本指令接线） */
    private _buildTrigger;
    /** 把手定位：inline 只写坐标变量 --as-pos/--as-offset + data-pos-negative（定位/钳制/偏移归样式表两态规则） */
    private _positionTrigger;
    /**
     * pos 坐标解析（边缘锚定模型，共享模块 parseRailCoord——drawer 等消费方同源）：
     * 非法 warn 回退居中（消息文案属本指令语境）。
     */
    private _parsePos;
    /** 主轴尺寸属性：left/right → width、top/bottom → height */
    private get _sizeProp();
    /** 滑出负 margin 属性（按收起方向分派：向哪边收起抵消哪边占位） */
    private get _marginProp();
    /** 是否滑出折叠形态（minSize 未声明或 ≤0） */
    private _isSlideCollapse;
    /** 滑出距离：主轴 inline 数值优先（亚像素精确、无布局环境可用），布局 rect 兜底 */
    private _readExtent;
    /** 应用展开/折叠终态（决策四双通道 + 决策六 reparent + 决策七注入 + 决策八事件） */
    private _applyExpanded;
    /** 清滑出痕迹（负 margin / transform / 父容器注入释放） */
    private _clearSlide;
    /** 事件 detail.size：展开 = maxSize 格式化值或 null（无约束）；折叠 = 0 或 minSize */
    private _detailSize;
    /** 挂动画属性（data-animating → CSS transition），transitionend/兜底超时摘除 + 完成回调 */
    private _playAnimation;
    /**
     * 单边 resize 装配（复用 x-resizable 的 ResizeSession 核心——overlay 家族同款复用面）：
     * 方向 = 活动边法线自动推导（left → e / right → w / top → s / bottom → n），手柄骑
     * 活动边线。本指令独占边线交互（同元素 x-resizable 已被互斥），把手/手柄/边条无跨指令
     * 抢夺。约束经 resolveResizeConstraints 透传（min/max/snap；handles/aspectRatio 已在
     * 选项读取时剥离）。手柄与把手同骑边线时的两层协调：把手压手柄之上（宿主 data-resize
     * → 样式表抬 z，命中与视觉都不被调节线拦），手柄 hover 桥接触发显形把手。
     */
    private _setupResize;
    /**
     * 手柄 → 把手 hover 桥接（`data-edge-hover` 统一契约，splitter 分隔条 / drawer 面板
     * 手柄同款）：感应边条（z4）被手柄带（z10 全长）完全盖住收不到 hover，hover 模式
     * 「鼠标移到边线任何位置把手即淡入」须由手柄转译——否则启用 resize 后把手只剩命中
     * （不可见但可点）一条退路。enable:false 退化形态无把手，直接跳过。
     * 监听器随手柄/把手同生命周期消亡，无需显式解绑（与 drawer 面板手柄桥接同款）。
     */
    private _bridgeHandleHover;
    /** resize 写路径：直写主轴 inline 尺寸 + **接管 maxSize**（Q4=A：拖出值成为展开尺寸
     *  真相——折叠/展开/detail.size 全走既有 maxSize 管线，零新增状态）；组合形态经
     *  driver.resized 路由（splitter 同步尺寸簿记 / drawer 记会话记忆） */
    private _applyResized;
    /** injectOverflow 默认 true（显式 false 才禁用） */
    private _shouldInjectOverflow;
    /** 父容器 computed overflow 是否已裁剪（hidden/clip 任一轴） */
    private _parentClips;
    /** 折叠期间注入：dock（定位上下文，恒挂）+ clip（overflow，注入通道开启且父容器未裁剪时挂） */
    private _dockParent;
    /** 展开完成后释放（引用计数归零才摘属性——多实例共享父容器） */
    private _releaseParentInjection;
    /** 把手移入父容器（折叠滑出完成后；CSS 折叠态规则接管定位，零 JS 测量） */
    private _dockTrigger;
    /** 把手移回宿主（展开动画启动前；清 inline 无需——两态定位全在样式表） */
    private _undockTrigger;
}
