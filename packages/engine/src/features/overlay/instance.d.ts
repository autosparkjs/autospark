import type { AutoSpark } from "../../engine/engine";
import { AutoSparkScope } from "../../engine/scope";
import type { ComponentDef } from "../component/component-def";
import type { SlotContent } from "../../utils/slot";
import { type OverlayAnchorConfig, type OverlayConfig } from "./types";
/**
 * 面板外壳组件定义（shell 机制，ADR-0062）：消费者/命令式解析后传入。
 * `snapshot`/`def` 为 shell 组件的冻结快照与定义（与内容组件同构）。
 */
export interface OverlayShellDef {
    /** shell 组件名（诊断与 scoped 样式释放键） */
    name: string;
    /** shell 组件冻结快照根 */
    snapshot: HTMLElement;
    /** shell 组件定义（可 null：纯快照无 setup；slots 出口清单决定内容投影方式） */
    def: ComponentDef | null;
}
/**
 * 定位策略上下文（{@link OverlayInstanceOptions.positioner} 回调入参，ADR-0063）：
 * 形态特化定位的全部输入——面板、归一 at 配置与解析结果、清理注册与 warn 通道。
 * 提供者**整体接管**定位（含箭头载体显隐、未命中回退与告警措辞）。
 */
export interface OverlayPositionerContext {
    /** 面板元素（shell 产物根；placement 契约标记宿主、定位目标） */
    panel: HTMLElement;
    /** 归一后的 at 配置（null = 未配置 at；selector 命中与否看 anchorEl） */
    anchor: OverlayAnchorConfig | null;
    /** at.selector 解析结果（null = 无 at / 未命中） */
    anchorEl: HTMLElement | null;
    /** 注册清理回调（autoUpdate cleanup 等，实例销毁时执行） */
    registerCleanup: (fn: () => void) => void;
    /** warn 通道（engine logger） */
    warn: (msg: string) => void;
}
/**
 * 覆盖物实例选项（消费者解析后传入）。
 */
export interface OverlayInstanceOptions {
    /** 数据视图基准挂链目标（探测间隙级联死亡订阅源；内容宿主编译父由消费者指令传入） */
    parentScope?: AutoSparkScope | null;
    /** `at.selector` 相对选择器的查询域（消费者宿主 / 命令式 dataContext 元素） */
    searchRoot?: HTMLElement | null;
    /** 数据视图基准元素（命令式 `dataContext` 传元素时；声明式为 null——基准由 parentScope 表达） */
    dataContextEl?: HTMLElement | null;
    /** 模态遮罩外壳（dialog 形态：遮罩 + flex 居中 + closeOnMask）；缺省裸面板直挂容器 */
    mask?: boolean;
    /** 面板外壳组件（shell 机制，ADR-0062）；缺省 = 内置默认 shell（按 name 推断，兜底 dialog-shell） */
    shell?: OverlayShellDef | null;
    /**
     * 定位策略覆盖（形态特化钩子，ADR-0063 x-drawer 屏幕贴边）：提供时**整体替代**内置
     * 「锚定 / 退居中」两态逻辑（含箭头载体显隐、未命中回退与告警措辞——形态自管）；
     * 缺省 = 内置两态（popover/dialog 语义不变）。
     */
    positioner?: ((ctx: OverlayPositionerContext) => void) | null;
    /**
     * 面板就绪钩子（ADR-0064）：定位完成后、enter 动画前调用一次（每次打开的实例一次）。
     * 面板尺寸拖拽调节（resize 选项）的手柄挂载点——消费者在此读 config.resize 建会话，
     * registerCleanup 注册会话销毁（随实例销毁执行）。
     */
    onPanelReady?: ((ctx: {
        panel: HTMLElement;
        config: OverlayConfig;
        registerCleanup: (fn: () => void) => void;
    }) => void) | null;
    /**
     * keepalive 缓存身份（ADR-0119）：`组件名 + key + url` 复合键，由消费者（指令）经
     * buildOverlayCacheKey 计算注入。有值时 close 的 keepalive 挂起语义才生效（挂起实例由
     * 指令缓存复用与回收）；缺省（命令式通道）keepalive 不改变生命周期——关照常销毁，
     * 防挂起实例孤儿化（v1 声明式专属）。
     */
    cacheKey?: string | null;
}
/**
 * 覆盖物实例（ADR-0052 修订版 / ADR-0062 shell 机制 / ADR-0123 内容宿主双委托）：覆盖物被消费者打开渲染出的**活体**。
 *
 * **内容 = 消费者指令生成的内容宿主元素**（ADR-0123）：overlay 不再自渲染内容——指令按组件
 * 注册状态生成宿主（`x-component:名称` / `x-html.compile=url`）以消费处 scope 为父
 * wrapper-compile 编译，渲染全委托 x-component（组件 / pending 占位）与 x-html.compile
 * （片段）两个既有指令；产物经 {@link mountContent} 编入面板出口内的 **x-error 边界**
 * （{@link boundary}，兼加载锚：探测/加载期呈现 x-loading 骨架，失败经 raise 就近呈现错误）。
 *
 * 面板 = shell 组件产物（ADR-0062）：面板层形态（边框/圆角/箭头/内容出口）由 shell 组件
 * 渲染——**x-error 边界**作为 `mode:"live"` 插槽段投影进 shell 默认出口（活体直挂不克隆
 * 不重编译）；`config` 整包注入 shell data 域（初始快照，不热更新）。
 * shell 未声明默认出口 → warn + 边界直挂 shell 根。**shell 不含遮罩**——遮罩是引擎结构。
 *
 * 结构两态（修订共识 4 + ADR-0062）：
 * - `mask: true`（dialog 模态形态）：遮罩外壳根（`autospark-dialog-mask`，引擎建，实例 el）>
 *   shell 产物根（面板，`data-overlay="<名称>"`）> 出口 > x-error 边界 > 内容宿主产物；
 * - `mask: false`（基座默认）：shell 产物根直挂 body 容器（实例 el = 面板）。
 *
 * 行为契约挂载分工（ADR-0062）：**实例根**（遮罩或裸面板）挂 animate 类、`action:close`
 * 委托、遮罩点击监听；**面板**（shell 根）挂 `data-overlay` / `data-overlay-border` /
 * `data-overlay-placement` 契约标记，是 floating-ui 定位目标与箭头载体宿主（箭头渲染归
 * shell 模板、显隐与定位归引擎）。
 *
 * 每次打开都是**新实例**（修订共识 5：singleton 机制未引入）——关闭动画播完即销毁
 * （双 scope 回收 + DOM 摘除），多实例可并存、层叠 = DOM 追加顺序。
 * **keepalive 例外**（ADR-0119）：消费者注入缓存身份（`cacheKey`）且 `config.keepalive` 为
 * true 时，关闭 = leave 动画播完后容器内 display:none 挂起（DOM/scope/watcher 全存活），
 * 重开经 `open()` 原样恢复（定位 + enter 动画 + 入栈 + 广播）；挂起期间 x-component
 * props watch 存活，恢复无需补应用 props（ADR-0123 删除浅合并）。
 * **打开即准入**（ADR-0123 决策 5）：keepalive 缓存写入时机提前到实例创建（pending 占位
 * 挂起无害）；`remoteFailed` 为 true 时 close 走销毁（失败不进挂起——重开自然重试）。
 *
 * 生命周期：
 * - `open()`：构建 shell + x-error 边界（加载锚）→ enter 动画 → 入打开栈 → 广播 `overlay:open`；
 *   内容宿主由消费者指令在打开后异步生成并 {@link mountContent} 编入；
 *   挂起态重入 = 恢复（重新定位显示）；已可见重入 = no-op（防重复堆叠）；
 * - `requestClose(source)`：「请求关闭」统一入口（ESC/遮罩/close action/`close()` API）——
 *   先回调 onCloseRequest（visible 写回由消费者注入，命令式无），再 `close()`；
 * - `close()`：leave 动画 → 销毁；keepalive 启用（有缓存身份）且非 `remoteFailed` → **挂起**；
 * - `destroy()`：无动画强拆（scope 级联 / engine.destroy / 消费者销毁）——幂等。
 *
 * 实例 DOM 在 `document.body` 容器内（engine 宿主树外）——挂载时向 dispatcher 登记**额外观察根**
 * （决策 14），使子树内 Runtime 指令（x-error / x-loading 等）正常挂载；销毁时先摘 DOM 再注销观察根
 * （observer 的 removedNodes 先行 unmount）。
 */
export declare class OverlayInstance {
    readonly engine: AutoSpark<any>;
    /** 覆盖物名（= 消费 attr 名 / 组件名） */
    readonly name: string;
    /** 组件冻结快照根（registry 登记键；ADR-0123 内容走宿主生成，恒为哑 div——registry 注销 no-op） */
    snapshot: HTMLElement;
    /** 组件定义（可 null：ADR-0123 内容渲染归 x-component / x-html 委托，实例不再持有 def） */
    def: ComponentDef | null;
    /** 生效配置（三级深度合并产物） */
    config: OverlayConfig;
    /** 数据视图基准元素（命令式 `dataContext` 传元素时；声明式为 null——基准由 parentScope 表达） */
    readonly dataContextEl: HTMLElement | null;
    /** `at.selector` 相对选择器的查询域（消费者宿主 / 命令式 scope 元素） */
    readonly searchRoot: HTMLElement | null;
    /** scope 基准挂链目标（探测间隙级联订阅源；rootless 防御为 null） */
    readonly parentScope: AutoSparkScope | null;
    /** 模态遮罩外壳（dialog 形态） */
    readonly mask: boolean;
    /** 面板外壳组件（shell 机制，ADR-0062；缺省 = 内置默认） */
    private readonly _shell;
    /** 定位策略覆盖（形态特化钩子，ADR-0063；null = 内置「锚定/退居中」两态） */
    private readonly _positioner;
    /** 面板就绪钩子（ADR-0064 resize 手柄挂载点；null = 无） */
    private readonly _onPanelReady;
    /** 「请求关闭」回调：消费者注入（visible 可写回时写回 false）；命令式无（决策 19） */
    onCloseRequest: ((inst: OverlayInstance, source: string) => void) | null;
    /**
     * keepalive 缓存身份（ADR-0119）：非 null 时 close 的 keepalive 挂起语义才生效
     * （挂起实例由消费者指令缓存复用与回收）；null（命令式通道）keepalive 不改变生命周期。
     */
    readonly cacheKey: string | null;
    /** 远程加载失败旗标（ADR-0119 → ADR-0123 公开化）：指令 raise 时置位、mountContent 时清除；close 据此走销毁（失败不进 keepalive 挂起） */
    remoteFailed: boolean;
    /** 内容形态（ADR-0123）：true = 片段宿主（x-html.compile，数据域 props 热应用目标）；false = 组件宿主（props 走 x-component 指令值通道自治） */
    isFragment: boolean;
    /**
     * chrome 插槽段（ADR-0124 决策 11）：消费侧收集裁决切分出的覆盖物 chrome 内容
     * （title / header / footer / actions.*，键为归一名），由指令在实例创建（open 前）就位。
     * {@link _buildShellAndMount} 合并进 shell slotContents——shell 内嵌 autospark.overlay
     * 经 `slots="*"` 通配转发原名上溯命中；出口投影的 callerScope 取持有者（shellScope）
     * 的 slotCallerScope（= 消费者 binding），chrome 表达式以消费处 scope 求值。
     */
    chromeSlots: Map<string, SlotContent> | null;
    /** 实例根（mask 形态为遮罩外壳；bare 形态为面板；未构建/已销毁为 null） */
    el: HTMLElement | null;
    /**
     * 内容 scope（**内容宿主 wrapper 编译产物**，ADR-0123）：组件形态 = x-component 化身
     * scope 的 wrapper 父（destroy 级联宿主）；片段形态 = 片段数据域（props 快照注入域 +
     * 热应用目标）。destroy 时回收（级联 + $scopes 条目清理）。
     */
    instanceScope: AutoSparkScope | null;
    /**
     * x-error 边界（ADR-0123 决策 4）：面板出口内的 live 段——兼加载锚（探测/加载期
     * x-loading 骨架）与错误边界（Runtime 指令就近捕获 raise 的 error 事件）。
     * {@link boundaryScope} 为其轻量 scope（错误呈现块编译父 + overlayRetry/overlayClose
     * action 注入点），由消费者指令写入。
     */
    boundary: HTMLElement | null;
    /** x-error 边界的轻量 scope（未构建为 null）：rootless 独立（生命周期归本实例） */
    boundaryScope: AutoSparkScope | null;
    /** 边界合成遮罩句柄（ADR-0126 共享层）：随 boundary 创建（_makeBoundary），显隐走所有权闸 */
    private boundaryMask;
    /** shell 实例 scope（config 注入域；rootless 挂链——销毁由本实例统一回收，ADR-0062） */
    private _shellScope;
    /** 当前是否可见（关闭动画中即 false） */
    private _visible;
    /** 关闭动画进行中（防重入；重开抢占经 animate.cancel） */
    private _closing;
    /** 已销毁（幂等守卫） */
    private _destroyed;
    /** 面板元素（shell 产物根；data-overlay 契约标记宿主、floating-ui 定位目标） */
    private _panel;
    /** anchor autoUpdate 等清理回调 */
    private _cleanups;
    /** scope 级联死亡监听退订 */
    private _unsubScopeDeath;
    /** delayClose 自动关闭定时器 */
    private _delayTimer;
    /** keepalive 挂起态（ADR-0119）：true = 容器内 display:none 存活，重开走 _resume */
    private _suspended;
    /** 已挂载的内容宿主产物（destroyContent 摘除用） */
    private _contentHost;
    constructor(engine: AutoSpark<any>, name: string, snapshot: HTMLElement, def: ComponentDef | null, config: OverlayConfig, opts?: OverlayInstanceOptions);
    /** 是否可见 */
    get visible(): boolean;
    /** 是否已销毁 */
    get destroyed(): boolean;
    /** 面板元素（构建后非空直至销毁；x-drawer 折叠把手读取布局几何用） */
    get panel(): HTMLElement | null;
    /**
     * 打开（ADR-0123 统一时序）：三态一律 shell 先开——构建 shell 面板 + x-error 边界
     * （兼加载锚：x-loading 骨架先可见），内容宿主由消费者指令异步生成后
     * {@link mountContent} 编入。keepalive 挂起态重入 = 恢复（重新定位显示）；关闭动画中
     * 重开 → cancel 同步完成待决离场后：keepalive 已挂起 → 走恢复；已销毁（cancel 触发的
     * destroy 收尾）→ 复活重建语义（重置旗标按全新构建走）。已可见重入 = no-op（防重复堆叠）。
     */
    open(): void;
    /**
     * 「请求关闭」统一入口（决策 7/19）：先回调 onCloseRequest（可写回消费者注入的 visible
     * 状态；命令式无回调），再执行 UI 关闭。source 标识触点（'esc' | 'mask' | 'close-action' | 'api' | …）。
     */
    requestClose(source: string): void;
    /**
     * 关闭：出栈 + 广播 `overlay:close`（UI 关闭开始时，善后通道）→ leave 动画 →
     * **销毁**（修订共识 5）；keepalive 启用（有缓存身份）且非远程失败 → **挂起**
     * （ADR-0119：容器内 display:none，DOM/scope/watcher 全存活，重开走 open 恢复）。
     * 幂等（不可见/关闭中/已销毁均 no-op）。
     */
    close(): void;
    /**
     * 编入内容宿主（ADR-0123 决策 2，消费者指令调用）：宿主产物是消费处 scope 为父的
     * wrapper-compile 产物（渲染归 x-component / x-html.compile 委托）。摘除加载锚形态
     * （x-loading + 最小尺寸）→ 原位插入 x-error 边界 → 接管内容 scope（`contentScope` =
     * wrapper 编译产物 scope：组件形态为化身 scope 的 wrapper 父、片段形态兼数据域——
     * destroy 级联宿主子树）→ 级联死亡订阅换轨 → 清 `remoteFailed`。
     *
     * @param isFragment 片段形态标记（指令侧显式告知——产物属性在编译后不保证保留，
     *                   不可作判定依据）：true = 片段宿主（props 数据域热应用目标）
     */
    mountContent(hostEl: HTMLElement, contentScope: AutoSparkScope, isFragment?: boolean): void;
    /**
     * 销毁内容宿主（ADR-0123 retry 前置，消费者指令调用）：内容 scope 回收（destroy 级联
     * 宿主子树 + $scopes 条目清理）→ 宿主产物摘除 → 边界复位为加载锚形态（x-loading +
     * 最小尺寸）→ 级联死亡订阅换回 parentScope（重新探测间隙）。
     */
    destroyContent(): void;
    /**
     * 重建 x-error 边界（ADR-0123 retry 前置，消费者通道调用）：错误呈现后的边界元素已被
     * x-error 呈现块占用，原位复位无法清空呈现态——摘旧建新。记录出口内原位
     * （parentElement + nextSibling）→ 摘旧边界（脱离观察根后 dispatcher 异步 unmount
     * 残留 Runtime 指令，元素整体废弃，无视觉残留）→ 销毁旧边界 scope → 新建边界
     * （加载锚形态）→ 原位插回（新边界经额外观察根拾取重新挂载 Runtime 指令）。
     * 新边界 scope 为空——调用方须重新注入错误桥 actions（injectErrorBridge）。
     */
    rebuildBoundary(): void;
    /**
     * 销毁（无动画强拆）：scope 级联 / engine.destroy / 消费者销毁 / 关闭收尾。幂等。
     * 先摘 DOM（observer 收到 removedNodes → unmount 子树 Runtime 指令）再注销额外观察根。
     */
    destroy(): void;
    /** keepalive 挂起（ADR-0119）：leave 播完后的收尾——容器内 display:none 隐藏（非摘除） */
    private _suspend;
    /** keepalive 恢复（ADR-0119）：重新定位显示 + 重挂 delayClose（props 挂起期间 watch 存活，无需补应用——ADR-0123） */
    private _resume;
    /** delayClose 自动关闭（>0 时）：打开/恢复后延时自动「请求关闭」（通知/公告类通道） */
    private _armDelayClose;
    /**
     * 建 x-error 边界（ADR-0123 决策 4，兼加载锚）：Runtime 指令属性由额外观察根拾取挂载
     * （dispatcher 通道，与 shell 产物同域）；自身定位（错误覆盖层 `absolute inset:0` 的
     * 定位基准）+ 最小尺寸（shell 骨架面板先可见——加载中不是塌缩空壳）；x-loading 呈现于
     * 边界内部（shell 内容出口层，自定义 shell 的标题栏等外壳层不被遮盖）。
     * 边界轻量 scope（{@link boundaryScope}）经文本 scope 先例模式注册（错误呈现块编译父
     * + overlayRetry/overlayClose action 注入点——消费者指令写入 actions）。
     */
    private _makeBoundary;
    /** 边界复位为内容形态（mountContent）：遮罩 toggle "false" + 摘最小尺寸（内容接管视觉） */
    private _rearmBoundaryForContent;
    /** 边界复位为加载锚形态（destroyContent / 重试）：遮罩 toggle "true" + 重挂最小尺寸 */
    private _rearmBoundaryForLoading;
    /**
     * 子树 $scopes 条目收集（ADR-0123 拥有者自负纪律的通用化）：级联 destroy 不清 $scopes
     * 条目（拥有者自负）——子树内组件实例 scope（x-component 宿主自有 scope，含 shell 内嵌
     * 的 autospark.overlay 实例，ADR-0124）各自持有数据域条目，拥有者（本实例）统一按子树
     * 收集删除（对齐 x-loading teardown 纪律）。
     * 须在 destroy 级联**前**调用（children Set 随销毁清空）。
     */
    private _collectScopeIds;
    /** 构建：x-error 边界 + shell 挂载 + 级联订阅（探测间隙挂 parentScope，ADR-0123） */
    private _buildAndMount;
    /**
     * 构建 shell 面板 + 挂载容器 + 显示（ADR-0123）：x-error 边界作为 `mode:"live"` 段
     * 投影进 shell 默认出口（活体直挂不克隆不重编译，销毁权责归本实例统一回收双 scope）。
     */
    private _buildShellAndMount;
    /** 显示（构建后）：定位（形态特化钩子或内置两态）→ enter 动画 → 入栈 → 广播 */
    private _show;
    /** 面板退回居中模式（清锚定残留 inline 定位，交由遮罩 flex 布局居中） */
    private _resetPanelToCentered;
    /** 遮罩点击 → 请求关闭（仅模态形态注册；命中最上层遮罩本体；面板内点击不关；closeOnMask 可关） */
    private _onMaskClick;
    /** 子树内 close action 广播 → 请求关闭（实例根委托，决策 7） */
    private _onCloseAction;
    /** 事件双通道广播（决策 13；payload 收窄 `{name, instance, scope}`——修订共识 9；key 为 ADR-0119 增量） */
    private _broadcast;
    private _clearAnchorCleanup;
}
