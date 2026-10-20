import type { AutoSpark } from "../../engine/engine";
import { SCOPES_KEY } from "../../consts";
import type { AutoSparkScope } from "../../engine/scope";
import type { ComponentDef } from "../component/component-def";
import type { SlotContent } from "../../utils/slot";
import { resolveAnimate } from "../animate/animate";
import { getOverlayContainer, MASK_CLASS } from "./container";
import { pushOpenInstance, removeOpenInstance } from "./stack";
import { applyAnchorPosition, resolveAnchorEl, OVERLAY_ARROW_CLASS } from "./anchor";
import { unregisterInstance } from "./registry";
import {
    normalizeAtConfig,
    type OverlayAnchorConfig,
    type OverlayConfig,
    type OverlayEventDetail,
} from "./types";
import { DIALOG_SHELL_NAME, ERROR_COMPONENT_NAME } from "../../components";

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
    /** 数据视图基准挂链目标（declarer→声明处 scope / host→消费者 scope / null→rootless） */
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
     * 插槽内容 map（ADR-0056）：消费者（x-dialog）在 `_instantiate` 懒收集后传入，
     * 经 `instantiateDetachedComponent` stash 到实例 scope，出口 SlotDirective 填充。
     */
    slotContents?: Map<string, SlotContent> | null;
    /** 插槽内容调用方视图基准（ADR-0056）：x-dialog 消费者 binding */
    slotCallerScope?: AutoSparkScope | null;
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
 * 覆盖物实例（ADR-0052 修订版 / ADR-0062 shell 机制）：覆盖物被消费者打开渲染出的**活体**。
 *
 * 内容 = 任意组件：`snapshot`（组件冻结快照）经 `instantiateDetachedComponent` 管道编译——
 * data()/props、methods、四阶段 hooks、scoped CSS、styleBinds、数据基准全生效（x-component 管道兄弟路径）。
 *
 * 面板 = shell 组件产物（ADR-0062）：面板层形态（边框/圆角/箭头/内容出口）由 shell 组件
 * 渲染——引擎先编译**内容组件**，再把产物作为 `mode:"live"` 插槽段投影进 shell 默认出口
 * （活体直挂不克隆不重编译）；`config` 整包注入 shell data 域（初始快照，不热更新）。
 * shell 未声明默认出口 → warn + 内容直挂 shell 根。**shell 不含遮罩**——遮罩是引擎结构。
 *
 * 结构两态（修订共识 4 + ADR-0062）：
 * - `mask: true`（dialog 模态形态）：遮罩外壳根（`autospark-dialog-mask`，引擎建，实例 el）>
 *   shell 产物根（面板，`data-overlay="<名称>"`）> 出口 > 内容组件产物；
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
 * true 时，关闭 = leave 动画播完后容器内 display:none 挂起（DOM/双 scope/watcher 全存活），
 * 重开经 `open()` 原样恢复（定位 + enter 动画 + 入栈 + 广播 open）；重开 props 为 Object.assign
 * 浅合并（仅出现的键）。挂起实例由消费者指令缓存复用与回收（指令销毁/engine.destroy）。
 *
 * **url 远程路径**（ADR-0119，消费者指令编排）：组件未注册且声明 url 时走
 * `openRemote()`（首阶段：仅构建 shell 面板——出口放骨架化占位锚（锚内挂 x-loading，
 * shell 骨架先可见、loading 在内容出口内部）+ 显示），加载成功后 `attachRemote()`
 * （第二阶段：编译内容组件原位换入占位锚（loading 随锚移除）、接管组件
 * 身份——此后与本地构建实例完全同权）；失败 `failRemote()`（面板内错误占位、不自动关，
 * 失败不进 keepalive 缓存——重开自然重试；retry action 走 {@link onRemoteRetry} 原位重载）。
 *
 * 生命周期：
 * - `open(props)`：构建外壳 + 编译组件 → enter 动画 → 入打开栈 → 广播 `overlay:open`；
 *   挂起态重入 = 恢复（props 浅合并 → 重新定位显示）；已可见重入 = no-op（防重复堆叠）；
 * - `requestClose(source)`：「请求关闭」统一入口（ESC/遮罩/close action/`close()` API）——
 *   先回调 onCloseRequest（visible 写回由消费者注入，命令式无），再 `close()`；
 * - `close()`：leave 动画 → 销毁；keepalive 启用（有缓存身份）且非远程失败 → **挂起**；
 * - `destroy()`：无动画强拆（scope 级联 / engine.destroy / 消费者销毁）——幂等。
 *
 * 实例 DOM 在 `document.body` 容器内（engine 宿主树外）——挂载时向 dispatcher 登记**额外观察根**
 * （决策 14），使子树内 Runtime 指令（x-loading 等）正常挂载；销毁时先摘 DOM 再注销观察根
 * （observer 的 removedNodes 先行 unmount）。
 */
export class OverlayInstance {
    readonly engine: AutoSpark<any>;
    /** 覆盖物名（= 消费 attr 名 / 组件名） */
    readonly name: string;
    /** 组件冻结快照根（registry 登记键；远程路径 attachRemote 后重指向——ADR-0119） */
    snapshot: HTMLElement;
    /** 组件定义（可 null：纯快照组件无 setup；远程路径 attachRemote 后重指向） */
    def: ComponentDef | null;
    /** 生效配置（三级深度合并产物） */
    config: OverlayConfig;
    /** 数据视图基准元素（命令式 `dataContext` 传元素时；声明式为 null——基准由 parentScope 表达） */
    readonly dataContextEl: HTMLElement | null;
    /** `at.selector` 相对选择器的查询域（消费者宿主 / 命令式 scope 元素） */
    readonly searchRoot: HTMLElement | null;
    /** scope 基准挂链目标（declarer→声明处 scope / host→消费者 scope / null→rootless） */
    readonly parentScope: AutoSparkScope | null;
    /** 模态遮罩外壳（dialog 形态） */
    readonly mask: boolean;
    /** 面板外壳组件（shell 机制，ADR-0062；缺省 = 内置默认） */
    private readonly _shell: OverlayShellDef;
    /** 定位策略覆盖（形态特化钩子，ADR-0063；null = 内置「锚定/退居中」两态） */
    private readonly _positioner: ((ctx: OverlayPositionerContext) => void) | null;
    /** 面板就绪钩子（ADR-0064 resize 手柄挂载点；null = 无） */
    private readonly _onPanelReady: ((ctx: {
        panel: HTMLElement;
        config: OverlayConfig;
        registerCleanup: (fn: () => void) => void;
    }) => void) | null;
    /** 插槽内容 map（ADR-0056；透传给 instantiateDetachedComponent） */
    readonly slotContents: Map<string, SlotContent> | null;
    /** 插槽内容调用方视图基准（ADR-0056） */
    readonly slotCallerScope: AutoSparkScope | null;

    /** 「请求关闭」回调：消费者注入（visible 可写回时写回 false）；命令式无（决策 19） */
    onCloseRequest: ((inst: OverlayInstance, source: string) => void) | null = null;

    /**
     * keepalive 缓存身份（ADR-0119）：非 null 时 close 的 keepalive 挂起语义才生效
     * （挂起实例由消费者指令缓存复用与回收）；null（命令式通道）keepalive 不改变生命周期。
     */
    readonly cacheKey: string | null;

    /** 远程内容重试钩子（ADR-0119）：error 占位的 retry action 经此触发原位重载（指令注入） */
    onRemoteRetry: (() => void) | null = null;

    /** 实例根（mask 形态为遮罩外壳；bare 形态为面板；未构建/已销毁为 null） */
    el: HTMLElement | null = null;
    /** 实例 scope（**内容**组件编译产物；data()/props 注入域——props 热更新目标） */
    instanceScope: AutoSparkScope | null = null;
    /** shell 实例 scope（config 注入域；rootless 挂链——销毁由本实例统一回收，ADR-0062） */
    private _shellScope: AutoSparkScope | null = null;

    /** 当前是否可见（关闭动画中即 false） */
    private _visible = false;
    /** 关闭动画进行中（防重入；重开抢占经 animate.cancel） */
    private _closing = false;
    /** 已销毁（幂等守卫） */
    private _destroyed = false;
    /** 面板元素（shell 产物根；data-overlay 契约标记宿主、floating-ui 定位目标） */
    private _panel: HTMLElement | null = null;
    /** anchor autoUpdate 等清理回调 */
    private _cleanups: Array<() => void> = [];
    /** scope 级联死亡监听退订 */
    private _unsubScopeDeath: (() => void) | null = null;
    /** delayClose 自动关闭定时器 */
    private _delayTimer: ReturnType<typeof setTimeout> | null = null;
    /** keepalive 挂起态（ADR-0119）：true = 容器内 display:none 存活，重开走 _resume */
    private _suspended = false;
    /** 远程加载失败旗标（ADR-0119）：close 据此走销毁（失败不进 keepalive 挂起） */
    private _remoteFailed = false;
    /** shell-only 构建捕获的内容出口（SlotDirective 出口恒留 data-slot 属性）——延迟附加定位锚 */
    private _remoteOutlet: HTMLElement | null = null;
    /** 远程占位锚（面板先开时出口内的占位元素；attach/fail 原位换入后置 null） */
    private _remoteAnchor: HTMLElement | null = null;
    /** 远程失败错误占位（autospark.error 编译产物 + 其 scope，统一回收） */
    private _remoteError: { el: HTMLElement; scope: AutoSparkScope } | null = null;

    constructor(
        engine: AutoSpark<any>,
        name: string,
        snapshot: HTMLElement,
        def: ComponentDef | null,
        config: OverlayConfig,
        opts: OverlayInstanceOptions = {},
    ) {
        this.engine = engine;
        this.name = name;
        this.snapshot = snapshot;
        this.def = def;
        this.config = config;
        this.parentScope = opts.parentScope ?? null;
        this.searchRoot = opts.searchRoot ?? null;
        this.dataContextEl = opts.dataContextEl ?? null;
        this.mask = opts.mask ?? false;
        // shell 缺省兜底内置 dialog 裸键（防御路径：声明式/命令式消费面恒显式解析传入；
        // ADR-0094——裸键即注册名，标准组件链恒有内置种子，断言安全）
        this._shell = opts.shell ?? {
            name: DIALOG_SHELL_NAME,
            ...this.engine._resolveGlobalComponentFull(DIALOG_SHELL_NAME)!,
        };
        this.slotContents = opts.slotContents ?? null;
        this.slotCallerScope = opts.slotCallerScope ?? null;
        this._positioner = opts.positioner ?? null;
        this._onPanelReady = opts.onPanelReady ?? null;
        this.cacheKey = opts.cacheKey ?? null;
    }

    /** 是否可见 */
    get visible(): boolean {
        return this._visible;
    }

    /** 是否已销毁 */
    get destroyed(): boolean {
        return this._destroyed;
    }

    /** 面板元素（构建后非空直至销毁；x-drawer 折叠把手读取布局几何用） */
    get panel(): HTMLElement | null {
        return this._panel;
    }

    /**
     * 打开：本地路径 = 全新构建（修订共识 5）；keepalive 挂起态重入 = 恢复（props 浅合并 →
     * 重新定位显示，ADR-0119）；关闭动画中重开 → cancel 同步完成待决离场后：
     * - keepalive 已挂起 → 走恢复；
     * - 已销毁（cancel 触发的 destroy 收尾）→ 复活重建语义（重置旗标按全新构建走）。
     * 已可见重入 = no-op（防重复堆叠——keepalive 同键复用命中已打开实例时静默）。
     * props 注入组件 data 域（覆盖 data() 默认）。
     */
    open(props?: Record<string, any>): void {
        if (this._destroyed) return;
        if (this._suspended) {
            this._resume(props);
            return;
        }
        if (this._closing) {
            // 关闭动画中重开：cancel = 同步完成待决离场（onDone → destroy 或 keepalive 挂起）
            this.engine.animate.cancel(this.el!);
            if (this._destroyed) {
                // 复活重建：cancel 触发的 destroy 已完整收尾（DOM/双 scope 已回收），重置旗标
                // 后按全新构建走——否则僵尸实例此后 requestClose/close 全被 _destroyed 守卫吞掉
                this._destroyed = false;
            } else if (this._suspended) {
                // keepalive：cancel 同步完成离场后已挂起 → 走恢复
                this._resume(props);
                return;
            }
        }
        if (this._visible) return; // 已可见重入：no-op（防重复堆叠，ADR-0119）
        this._buildAndMount(props);
        this._armDelayClose();
    }

    /**
     * 「请求关闭」统一入口（决策 7/19）：先回调 onCloseRequest（可写回消费者注入的 visible
     * 状态；命令式无回调），再执行 UI 关闭。source 标识触点（'esc' | 'mask' | 'close-action' | 'api' | …）。
     */
    requestClose(source: string): void {
        if (!this._visible || this._closing || this._destroyed) return;
        if (this.onCloseRequest) {
            try {
                this.onCloseRequest(this, source);
            } catch (e: any) {
                this.engine.logger.error(e);
            }
        }
        this.close();
    }

    /**
     * 关闭：出栈 + 广播 `overlay:close`（UI 关闭开始时，善后通道）→ leave 动画 →
     * **销毁**（修订共识 5）；keepalive 启用（有缓存身份）且非远程失败 → **挂起**
     * （ADR-0119：容器内 display:none，DOM/双 scope/watcher 全存活，重开走 open 恢复）。
     * 幂等（不可见/关闭中/已销毁均 no-op）。
     */
    close(): void {
        if (!this._visible || this._closing || this._destroyed) return;
        this._visible = false;
        removeOpenInstance(this);
        this._clearAnchorCleanup();
        this._broadcast("overlay:close");
        const root = this.el!;
        const phase = resolveAnimate(this.config.animate).leave;
        this._closing = true;
        const done = () => {
            this._closing = false;
            // destroy 抢先（指令销毁/级联）时收尾止步——不再挂起/重建
            if (this._destroyed) return;
            if (this.cacheKey && this.config.keepalive === true && !this._remoteFailed) {
                this._suspend(); // keepalive：容器内隐藏挂起（DOM/双 scope/watcher 全存活）
            } else {
                this.destroy();
            }
        };
        // leave 返回 false（无动画配置/环境）→ 立即同步执行收尾（ADR-0039 标准时序）
        if (!this.engine.animate.leave(root, phase, done)) done();
    }

    /**
     * 远程路径首阶段（ADR-0119，消费者指令编排）：仅构建 shell 面板——出口放骨架化占位锚
     * （锚内挂 x-loading：shell 骨架先可见、loading 呈现于内容出口内部）+ 显示，内容组件
     * 延迟到 `attachRemote()` 原位附加。
     * 仅消费者指令在「组件未注册且声明 url」时调用（实例恒新建，不走缓存复用）。
     * shell-only 阶段无内容 scope——级联死亡订阅挂 parentScope（挂链死亡 → 实例强拆），
     * attachRemote 后换轨内容 scope。
     */
    openRemote(): void {
        if (this._destroyed) return;
        this._buildShellAndMount(null);
        if (this.parentScope) {
            this._unsubScopeDeath = onScopeDestroyed(this.engine, this.parentScope, () =>
                this.destroy(),
            );
        }
        this._armDelayClose();
    }

    /**
     * 远程路径第二阶段（ADR-0119）：编译内容组件原位换入占位锚（loading 随锚移除）、接管组件
     * 身份（snapshot/def/instanceScope 重指向）——此后与本地构建实例完全同权（props 热更新、
     * keepalive 挂起恢复均正常）。级联死亡订阅换轨到内容 scope。
     */
    attachRemote(
        snapshot: HTMLElement,
        def: ComponentDef | null,
        props?: Record<string, any>,
        slotContents?: Map<string, SlotContent> | null,
    ): void {
        if (this._destroyed) return;
        this._destroyRemoteError();
        const compiled = this._compileContent(props, snapshot, def, slotContents ?? null);
        this.snapshot = snapshot;
        this.def = def;
        this.instanceScope = compiled.scope;
        // 换轨级联死亡订阅：shell-only 阶段挂 parentScope → 接管后挂内容 scope（先退订再重订）
        this._unsubScopeDeath?.();
        this._unsubScopeDeath = onScopeDestroyed(this.engine, compiled.scope, () => this.destroy());
        this._swapRemoteAnchor(compiled.el);
    }

    /**
     * 片段兜底路径（ADR-0119）：远程内容无匹配名组件声明时，HTML 片段作为**子模板编译**
     * 进面板出口（x-html.compile 同语义：可含任意指令，不要求组件声明）。以消费处 scope 为
     * 父编译（片段插值读声明处 state），props 注入响应式数据域（热更新/keepalive 恢复合并
     * 与组件路径同权）。片段中的 x-define 声明元素经编译器剪枝不渲染（组件已在加载阶段注册）。
     */
    attachFragment(wrapper: HTMLElement, props?: Record<string, any>): void {
        if (this._destroyed) return;
        this._destroyRemoteError();
        const compiled = this.engine.compiler.compileChild(
            wrapper,
            this.parentScope, // 消费处 scope：片段插值读声明处 state（shell rootless 不能直接委托）
            {},
            undefined,
            // 响应式 data 域（injectInitialData 路径）：后续 props 热更新 Object.assign 到
            // scope.data 即字段级细粒度更新（ADR-0119 片段兜底与组件路径行为一致）
            { ...(props ?? {}) },
        );
        this.instanceScope = compiled.scope;
        // 换轨级联死亡订阅：shell-only 阶段挂 parentScope → 接管后挂片段 scope（先退订再重订）
        this._unsubScopeDeath?.();
        this._unsubScopeDeath = onScopeDestroyed(this.engine, compiled.scope, () => this.destroy());
        this._swapRemoteAnchor(compiled.el);
    }

    /**
     * 远程加载失败（ADR-0119）：面板内错误占位（autospark.error，retry/close action 注入）、
     * 不自动关。`_remoteFailed` 旗标使 close 走销毁（失败不进 keepalive 缓存——重开自然重试）；
     * retry 经 {@link onRemoteRetry} 钩子回到加载中形态。
     */
    failRemote(err: Error, url?: string): void {
        if (this._destroyed) return;
        this._remoteFailed = true;
        this._destroyRemoteError();
        const resolved = this.engine._resolveGlobalComponentFull(ERROR_COMPONENT_NAME);
        if (!resolved) {
            // 内置 error 组件缺失（异常环境）：退化为纯文本占位（照常不自动关）
            const fallback = document.createElement("div");
            fallback.textContent = err.message;
            this._swapRemoteAnchor(fallback);
            return;
        }
        const compiled = this.engine.compiler.compileChild(
            resolved.snapshot.cloneNode(true) as HTMLElement,
            null, // rootless（对齐 x-component loader error——占位生命周期归本实例回收）
            {},
            undefined,
            // 数据上下文走响应式 data 域——纯数据 + 布尔显隐键，绝无函数（autostore 函数值
            // 当 computed → 无限循环）；执行体走 action 通道（下方 scope.actions 注入）。
            // ADR-0118 契约：retryable/closeable。
            {
                error: err,
                message: err.message,
                url: url ?? "",
                name: this.name,
                retryable: true,
                closeable: true,
            },
        );
        compiled.scope.actions = {
            ...(compiled.scope.actions ?? {}),
            retry: { name: "retry", handle: () => this.onRemoteRetry?.() },
            close: { name: "close", handle: () => this.requestClose("error-close") },
        } as Record<string, any>;
        this._remoteError = { el: compiled.el, scope: compiled.scope };
        this._swapRemoteAnchor(compiled.el);
    }

    /**
     * 远程重载前置（ADR-0119）：清失败旗标、重建骨架化占位锚（锚内挂 x-loading），随后由指令
     * 发起加载（成功 attachRemote / 失败再 failRemote）。retry action 经此回到「面板先开」形态。
     */
    beginRemoteReload(): void {
        if (this._destroyed || !this._panel) return;
        this._remoteFailed = false;
        this._destroyRemoteError();
        (this._remoteOutlet ?? this._panel).appendChild(this._makeRemoteAnchor());
    }

    /**
     * 销毁（无动画强拆）：scope 级联 / engine.destroy / 消费者销毁 / 关闭收尾。幂等。
     * 先摘 DOM（observer 收到 removedNodes → unmount 子树 Runtime 指令）再注销额外观察根。
     */
    destroy(): void {
        if (this._destroyed) return;
        this._destroyed = true;
        // 在播动画同步完成（keepalive 挂起/关闭中重开等抢占时序的兜底保障，ADR-0119）；
        // cancel 触发的 leave onDone 内有 _destroyed 止步守卫，无二次销毁
        if (this.el) this.engine.animate.cancel(this.el);
        this._destroyRemoteError();
        this._unsubScopeDeath?.();
        this._unsubScopeDeath = null;
        if (this._delayTimer) {
            clearTimeout(this._delayTimer);
            this._delayTimer = null;
        }
        this._clearAnchorCleanup();
        removeOpenInstance(this);
        if (this.instanceScope) {
            const id = this.instanceScope.id;
            this.instanceScope.destroy(); // 幂等守卫（scope.destroyed 标志）：级联已销毁时 no-op
            const scopes = (this.engine.store.state as Record<string, any>)[SCOPES_KEY] as
                | Record<string, any>
                | undefined;
            if (scopes) delete scopes[id]; // 回收私有响应式域（对齐 x-loading teardown 纪律）
            this.instanceScope = null;
        }
        // shell scope 统一回收（ADR-0062）：rootless 挂链无级联来源，destroy 显式销毁 +
        // 回收私有响应式域（scoped 样式页面级常驻，无需对称释放——ADR-0113）
        if (this._shellScope) {
            const shellId = this._shellScope.id;
            this._shellScope.destroy();
            const scopes = (this.engine.store.state as Record<string, any>)[SCOPES_KEY] as
                | Record<string, any>
                | undefined;
            if (scopes) delete scopes[shellId];
            this._shellScope = null;
        }
        if (this.el) {
            const root = this.el;
            root.removeEventListener("click", this._onMaskClick);
            root.removeEventListener("action:close", this._onCloseAction);
            root.remove();
            this.engine.dispatcher.removeExtraRoot(root);
            this.el = null;
            this._panel = null;
        }
        unregisterInstance(this.snapshot, this);
    }

    // ── 内部 ──────────────────────────────────────────────────────────

    /** keepalive 挂起（ADR-0119）：leave 播完后的收尾——容器内 display:none 隐藏（非摘除） */
    private _suspend(): void {
        this._suspended = true;
        if (this._delayTimer) {
            clearTimeout(this._delayTimer);
            this._delayTimer = null;
        }
        this.el!.style.display = "none";
    }

    /** keepalive 恢复（ADR-0119）：props 浅合并（仅出现的键）→ 重新定位显示 + 重挂 delayClose */
    private _resume(props?: Record<string, any>): void {
        this._suspended = false;
        if (props && this.instanceScope?.data) {
            Object.assign(this.instanceScope.data, props);
        }
        this._show();
        this._armDelayClose();
    }

    /** delayClose 自动关闭（>0 时）：打开/恢复后延时自动「请求关闭」（通知/公告类通道） */
    private _armDelayClose(): void {
        const delay = Number(this.config.delayClose);
        if (delay <= 0) return;
        this._delayTimer = setTimeout(() => {
            this._delayTimer = null;
            this.requestClose("delay");
        }, delay);
    }

    /**
     * 建远程占位锚（面板先开时出口内的占位元素；attach/fail 原位换入）。
     * 骨架化（ADR-0119）：锚自带最小尺寸（shell 骨架面板先可见——加载中不是塌缩空壳）、
     * 自身定位（x-loading overlay `absolute inset:0` 的定位基准）并**在锚上**挂 x-loading
     * ——loading 呈现于 shell 内容出口**内部**（而非覆盖整个面板，自定义 shell 的标题栏等
     * 外壳层不被遮盖）；attach/fail 换出锚即随锚摘除，无需显式清理。
     */
    private _makeRemoteAnchor(): HTMLElement {
        const anchor = document.createElement("div");
        anchor.setAttribute("data-overlay-remote-pending", "");
        anchor.style.cssText =
            "position:relative;" +
            "min-width:var(--autospark-overlay-loading-min-width, 240px);" +
            "min-height:var(--autospark-overlay-loading-min-height, 120px);";
        anchor.setAttribute("x-loading", "true");
        this._remoteAnchor = anchor;
        return anchor;
    }

    /** 占位锚原位换入（ADR-0119）：锚在出口内 → replaceWith；无锚（出口未渲染等）→ 追加出口/面板 */
    private _swapRemoteAnchor(el: HTMLElement): void {
        const anchor = this._remoteAnchor;
        this._remoteAnchor = null;
        if (anchor?.parentNode) {
            anchor.replaceWith(el);
        } else {
            (this._remoteOutlet ?? this._panel)?.appendChild(el);
        }
    }

    /** 销毁远程错误占位（幂等）：scope 回收（对齐 SCOPES_KEY 惯例）+ DOM 摘除 */
    private _destroyRemoteError(): void {
        const errState = this._remoteError;
        if (!errState) return;
        this._remoteError = null;
        const id = errState.scope.id;
        errState.scope.destroy();
        const scopes = (this.engine.store.state as Record<string, any>)[SCOPES_KEY] as
            | Record<string, any>
            | undefined;
        if (scopes) delete scopes[id];
        errState.el.remove();
    }

    /** 本地路径构建：编译内容组件 + shell 挂载 + 级联订阅 */
    private _buildAndMount(props?: Record<string, any>): void {
        // 1. 编译**内容**组件（instantiateDetachedComponent 管道：data() 默认 → props 覆盖、
        //    methods、四阶段 hooks、scoped CSS、styleBinds、数据基准全生效——x-component 兄弟
        //    路径）。先于 shell 编译：内容产物 el 是 shell 默认出口的 live 插槽段（ADR-0062）。
        const compiled = this._compileContent(props);
        this.instanceScope = compiled.scope;
        // 2. shell 面板构建 + 挂载 + 显示（live 段投影，ADR-0062）
        this._buildShellAndMount(compiled.el);
        // 3. scope 级联死亡感知：内容 scope 随挂链销毁时强拆自身（决策 11 生命周期三合一）。
        //    shell scope rootless（无挂链）——由本实例 destroy 统一回收。
        this._unsubScopeDeath = onScopeDestroyed(this.engine, compiled.scope, () => this.destroy());
    }

    /**
     * 编译内容组件（instantiateDetachedComponent 管线）。快照/定义/插槽 map 可覆盖——
     * 远程路径 attachRemote 时传入加载产物（ADR-0119），本地路径用实例当前身份。
     */
    private _compileContent(
        props?: Record<string, any>,
        snapshot: HTMLElement = this.snapshot,
        def: ComponentDef | null = this.def,
        slotContents: Map<string, SlotContent> | null = this.slotContents,
    ): { el: HTMLElement; scope: AutoSparkScope } {
        const clone = snapshot.cloneNode(true) as HTMLElement;
        return this.engine.compiler.instantiateDetachedComponent(
            clone,
            this.parentScope,
            def,
            props,
            undefined,
            slotContents,
            this.slotCallerScope,
        );
    }

    /**
     * 构建 shell 面板 + 挂载容器 + 显示（本地/远程两路径共用，ADR-0119）：
     * - `contentEl` 非空（本地路径）：live 段投影进 shell 默认出口；
     * - `contentEl` 为 null（远程首阶段）：出口放骨架化占位锚（锚内挂 x-loading），内容延迟附加
     *   （attachRemote 原位换入）。
     */
    private _buildShellAndMount(contentEl: HTMLElement | null): void {
        const container = getOverlayContainer(this.engine);
        if (!container) return; // SSR / 无 body：跳过挂载

        // 编译 **shell 组件**（ADR-0062）：config 整包注入 shell data 域（初始快照，Q13——
        // 打开时一次，不热更新；props 热更新只走内容域）；内容产物以 `mode:"live"` 段投影进
        // shell 默认出口（活体直挂不克隆不重编译，销毁权责归本实例统一回收双 scope）。
        // shell 未声明默认出口 → warn + 内容直挂 shell 根（弹窗照常工作，失效可发现）。
        const shell = this._shell;
        // 出口判定：def.slots 无出口时为 undefined——undefined 或不含 "default" 均视为无默认出口
        const hasDefaultOutlet = !!shell.def?.slots?.includes("default");
        let shellSlots: Map<string, SlotContent> | null = null;
        if (hasDefaultOutlet) {
            shellSlots = new Map([
                [
                    "default",
                    {
                        name: "default",
                        nodes: [contentEl ?? this._makeRemoteAnchor()],
                        params: [],
                        paramsExpr: null,
                        mode: "live",
                    } satisfies SlotContent,
                ],
            ]);
        } else {
            this.engine.logger.warn(
                `x-overlay "${this.name}": shell "${shell.name}" 未声明默认出口（x-slot），内容组件直挂面板根（ADR-0062）`,
            );
        }
        const shellClone = shell.snapshot.cloneNode(true) as HTMLElement;
        const shellCompiled = this.engine.compiler.instantiateDetachedComponent(
            shellClone,
            null, // shell rootless 挂链：形态组件不依赖声明上下文，生命周期归本实例
            shell.def,
            this.config as unknown as Record<string, any>,
            undefined,
            shellSlots,
            null,
        );
        this._shellScope = shellCompiled.scope;
        const panel = shellCompiled.el;

        // 远程首阶段：捕获内容出口（SlotDirective 出口恒留 data-slot 属性——延迟附加定位锚）；
        // 出口未渲染进产物（shell 模板条件显隐等）→ 回退直挂面板根
        if (contentEl === null && hasDefaultOutlet) {
            this._remoteOutlet =
                (panel.querySelector('[data-slot="default"]') as HTMLElement) ?? null;
        }
        if (!hasDefaultOutlet && contentEl) {
            panel.appendChild(contentEl);
        }
        // 远程首阶段的 loading 由占位锚自身承担（骨架化 _makeRemoteAnchor：锚内挂 x-loading，
        // 出口内部呈现；随锚换出自动摘除）——面板层不再挂 x-loading

        // 外壳两态（修订共识 4）：mask 形态 = 遮罩根（引擎建）> 面板（data-overlay 契约）；
        // bare = 面板（shell 根）直挂容器。行为契约分工：实例根挂 animate/close 委托/遮罩点击；
        // 面板挂 data-overlay / data-overlay-border / placement 标记（floating-ui 定位目标）。
        panel.setAttribute("data-overlay", this.name);
        // 面板 1px 边框（config.border，默认 true——无锚定也生效）：`data-overlay-border`
        // 标记挂面板根，视觉由 shell 样式承担（内置样式：border + 同色背景 + 圆角，箭头双层变色经子选择器联动）。
        if (this.config.border !== false) {
            panel.setAttribute("data-overlay-border", "");
        }
        let root: HTMLElement = panel;
        if (this.mask) {
            root = document.createElement("div");
            root.className = MASK_CLASS;
            root.appendChild(panel);
            // 遮罩点击 → 请求关闭（仅命中最上层遮罩本体；面板内点击不关；closeOnMask 可关）
            root.addEventListener("click", this._onMaskClick);
        }
        // close action 委托（ADR-0052 决策 7 / ADR-0036 决策 7）：子树内任意 action 广播的
        // `action:close` DOM 冒泡事件到实例根被接住 → 请求关闭（覆盖物在 body 下，
        // engine 树内祖先收不到——必须实例根委托）
        root.addEventListener("action:close", this._onCloseAction);
        this.el = root;
        this._panel = panel;

        // 额外观察根 + 挂载容器 + 显示
        this.engine.dispatcher.addExtraRoot(root);
        container.appendChild(root);
        this._show();
    }

    /** 显示（构建后）：定位（形态特化钩子或内置两态）→ enter 动画 → 入栈 → 广播 */
    private _show(): void {
        const root = this.el!;
        root.style.display = "";
        this._visible = true;

        this._clearAnchorCleanup();
        // 形态特化定位（ADR-0063）：提供者整体接管（含箭头载体显隐、未命中回退与告警措辞）
        if (this._positioner) {
            const anchorCfg = normalizeAtConfig(this.config.at);
            const anchorEl = anchorCfg ? resolveAnchorEl(anchorCfg.selector, this.searchRoot) : null;
            this._positioner({
                panel: this._panel!,
                anchor: anchorCfg,
                anchorEl,
                registerCleanup: (fn) => this._cleanups.push(fn),
                warn: (msg) => this.engine.logger.warn(msg),
            });
        } else {
            // 内置两态（每次显示现算：配置与锚点可随重开变化；未命中 warn 退居中，决策 22/24）。
            // config.at 三态（字符串/元素简写 ≡ {selector}）经 normalizeAtConfig 归一。
            // 箭头（ADR-0062）：**渲染归 shell**（模板恒含 `.autospark-overlay-arrow` 载体），
            // **显隐与定位归引擎**——锚定命中且 `arrow !== false` 才保留并交给 floating-ui
            // （middleware 经 :scope > 查询载体）；退居中 / `arrow: false` 时移除载体，
            // 防未定位载体残留孤立菱形。
            const anchorCfg = normalizeAtConfig(this.config.at);
            const anchorEl = anchorCfg ? resolveAnchorEl(anchorCfg.selector, this.searchRoot) : null;
            const arrowEl = this._panel!.querySelector(
                `:scope > .${OVERLAY_ARROW_CLASS}`,
            ) as HTMLElement | null;
            if (anchorEl && anchorCfg) {
                if (anchorCfg.arrow === false) arrowEl?.remove();
                // fit：面板尺寸跟随宿主（声明式 searchRoot = 指令宿主 this.el）——按最终
                // placement 主向自动选轴（左右→高度、上下→宽度），autoUpdate 重算持续生效
                const anchorOpts =
                    this.config.fit && this.searchRoot
                        ? { fitToEl: this.searchRoot }
                        : undefined;
                applyAnchorPosition(anchorCfg, anchorEl, this._panel!, (fn) =>
                    this._cleanups.push(fn),
                    anchorOpts,
                );
            } else {
                arrowEl?.remove();
                if (this.config.at != null) {
                    // 提示原始选择器（config.at 已归一化为对象，String 化前取回 selector）
                    this.engine.logger.warn(
                        `x-overlay "${this.name}": at "${String(anchorCfg?.selector ?? this.config.at)}" 未命中，退屏幕居中（ADR-0052 决策 22）`,
                    );
                }
                this._resetPanelToCentered();
            }
        }

        const phase = resolveAnimate(this.config.animate).enter;
        if (phase) this.engine.animate.enter(root, phase);
        pushOpenInstance(this);
        this._broadcast("overlay:open");
        // 面板就绪（定位后、动画已启动）：resize 手柄挂载点（ADR-0064）——定位完成后面板
        // 已有几何，手柄注入即得正确命中区；清理随实例销毁
        this._onPanelReady?.({
            panel: this._panel!,
            config: this.config,
            registerCleanup: (fn) => this._cleanups.push(fn),
        });
    }

    /** 面板退回居中模式（清锚定残留 inline 定位，交由遮罩 flex 布局居中） */
    private _resetPanelToCentered(): void {
        const panel = this._panel;
        if (!panel) return;
        panel.style.position = "";
        panel.style.left = "";
        panel.style.top = "";
        panel.style.margin = "";
        panel.removeAttribute("data-overlay-placement");
    }

    /** 遮罩点击 → 请求关闭（仅模态形态注册；命中最上层遮罩本体；面板内点击不关；closeOnMask 可关） */
    private _onMaskClick = (e: Event): void => {
        if (!this.config.closeOnMask) return;
        if (e.target !== this.el) return;
        this.requestClose("mask");
    };

    /** 子树内 close action 广播 → 请求关闭（实例根委托，决策 7） */
    private _onCloseAction = (): void => {
        this.requestClose("close-action");
    };

    /** 事件双通道广播（决策 13；payload 收窄 `{name, instance, scope}`——修订共识 9；key 为 ADR-0119 增量） */
    private _broadcast(type: "overlay:open" | "overlay:close"): void {
        const detail: OverlayEventDetail = {
            name: this.name,
            instance: this,
            dataContext: this.dataContextEl ?? undefined,
            key: this.config.key ?? undefined,
        };
        this.el?.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
        (this.engine as any).emit(type, detail);
    }

    private _clearAnchorCleanup(): void {
        for (const fn of this._cleanups) {
            try {
                fn();
            } catch {
                /* 清理容错 */
            }
        }
        this._cleanups.length = 0;
    }
}

/**
 * 监听 scope 级联销毁（FastLiteEvent 兼容形态，对齐 use.ts 的订阅/退订模式）：
 * 实例 scope 随挂链死亡（scope/destroyed 事件携带 scope 引用）→ 回调（实例强拆）。
 * @returns 退订函数
 */
function onScopeDestroyed(
    engine: AutoSpark<any>,
    scope: AutoSparkScope,
    cb: () => void,
): () => void {
    const sub = (engine as any).on("scope/destroyed", (m: any) => {
        const payload = m?.payload ?? m;
        if (payload?.scope === scope) cb();
    });
    return typeof sub === "function" ? sub : () => sub.off();
}
