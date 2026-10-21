import type { AutoSpark } from "../../engine/engine";
import { SCOPES_KEY } from "../../consts";
import { AutoSparkScope } from "../../engine/scope";
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
import { DIALOG_SHELL_NAME } from "../../components";

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
 * shell 快照是否内嵌 overlay 结构骨架（ADR-0124 决策 8 形态判定）：扫属性名
 * `x-component:autospark.overlay`（含修饰符形态）与元素名形态（属性形态宿主
 * `x-component:autospark.overlay` 元素 / ADR-0117 自动元素名 `x-autospark.overlay`，
 * 含点分修饰符后缀）。内嵌形态无 default 出口声明是官方契约（边界经 overlay body
 * 直通锚投递），区别于「无出口失效 shell」（warn + 直挂）。
 */
function shellEmbedsOverlay(snapshot: HTMLElement): boolean {
    for (const el of Array.from(snapshot.querySelectorAll("*"))) {
        const tag = el.tagName.toLowerCase();
        if (
            tag === "x-component:autospark.overlay" ||
            tag.startsWith("x-component:autospark.overlay.") ||
            tag === "x-autospark.overlay" ||
            tag.startsWith("x-autospark.overlay.")
        ) {
            return true;
        }
        for (const attr of Array.from(el.attributes)) {
            const n = attr.name;
            if (
                n === "x-component:autospark.overlay" ||
                n.startsWith("x-component:autospark.overlay.")
            ) {
                return true;
            }
        }
    }
    return false;
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
export class OverlayInstance {
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
    private readonly _shell: OverlayShellDef;
    /** 定位策略覆盖（形态特化钩子，ADR-0063；null = 内置「锚定/退居中」两态） */
    private readonly _positioner: ((ctx: OverlayPositionerContext) => void) | null;
    /** 面板就绪钩子（ADR-0064 resize 手柄挂载点；null = 无） */
    private readonly _onPanelReady: ((ctx: {
        panel: HTMLElement;
        config: OverlayConfig;
        registerCleanup: (fn: () => void) => void;
    }) => void) | null;

    /** 「请求关闭」回调：消费者注入（visible 可写回时写回 false）；命令式无（决策 19） */
    onCloseRequest: ((inst: OverlayInstance, source: string) => void) | null = null;

    /**
     * keepalive 缓存身份（ADR-0119）：非 null 时 close 的 keepalive 挂起语义才生效
     * （挂起实例由消费者指令缓存复用与回收）；null（命令式通道）keepalive 不改变生命周期。
     */
    readonly cacheKey: string | null;

    /** 远程加载失败旗标（ADR-0119 → ADR-0123 公开化）：指令 raise 时置位、mountContent 时清除；close 据此走销毁（失败不进 keepalive 挂起） */
    remoteFailed = false;
    /** 内容形态（ADR-0123）：true = 片段宿主（x-html.compile，数据域 props 热应用目标）；false = 组件宿主（props 走 x-component 指令值通道自治） */
    isFragment = false;
    /**
     * chrome 插槽段（ADR-0124 决策 11）：消费侧收集裁决切分出的覆盖物 chrome 内容
     * （title / header / footer / actions.*，键为归一名），由指令在实例创建（open 前）就位。
     * {@link _buildShellAndMount} 合并进 shell slotContents——shell 内嵌 autospark.overlay
     * 经 `slots="*"` 通配转发原名上溯命中；出口投影的 callerScope 取持有者（shellScope）
     * 的 slotCallerScope（= 消费者 binding），chrome 表达式以消费处 scope 求值。
     */
    chromeSlots: Map<string, SlotContent> | null = null;

    /** 实例根（mask 形态为遮罩外壳；bare 形态为面板；未构建/已销毁为 null） */
    el: HTMLElement | null = null;
    /**
     * 内容 scope（**内容宿主 wrapper 编译产物**，ADR-0123）：组件形态 = x-component 化身
     * scope 的 wrapper 父（destroy 级联宿主）；片段形态 = 片段数据域（props 快照注入域 +
     * 热应用目标）。destroy 时回收（级联 + $scopes 条目清理）。
     */
    instanceScope: AutoSparkScope | null = null;
    /**
     * x-error 边界（ADR-0123 决策 4）：面板出口内的 live 段——兼加载锚（探测/加载期
     * x-loading 骨架）与错误边界（Runtime 指令就近捕获 raise 的 error 事件）。
     * {@link boundaryScope} 为其轻量 scope（错误呈现块编译父 + overlayRetry/overlayClose
     * action 注入点），由消费者指令写入。
     */
    boundary: HTMLElement | null = null;
    /** x-error 边界的轻量 scope（未构建为 null）：rootless 独立（生命周期归本实例） */
    boundaryScope: AutoSparkScope | null = null;
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
    /** 已挂载的内容宿主产物（destroyContent 摘除用） */
    private _contentHost: HTMLElement | null = null;

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
     * 打开（ADR-0123 统一时序）：三态一律 shell 先开——构建 shell 面板 + x-error 边界
     * （兼加载锚：x-loading 骨架先可见），内容宿主由消费者指令异步生成后
     * {@link mountContent} 编入。keepalive 挂起态重入 = 恢复（重新定位显示）；关闭动画中
     * 重开 → cancel 同步完成待决离场后：keepalive 已挂起 → 走恢复；已销毁（cancel 触发的
     * destroy 收尾）→ 复活重建语义（重置旗标按全新构建走）。已可见重入 = no-op（防重复堆叠）。
     */
    open(): void {
        if (this._destroyed) return;
        if (this._suspended) {
            this._resume();
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
                this._resume();
                return;
            }
        }
        if (this._visible) return; // 已可见重入：no-op（防重复堆叠，ADR-0119）
        this._buildAndMount();
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
     * （ADR-0119：容器内 display:none，DOM/scope/watcher 全存活，重开走 open 恢复）。
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
            if (this.cacheKey && this.config.keepalive === true && !this.remoteFailed) {
                this._suspend(); // keepalive：容器内隐藏挂起（DOM/scope/watcher 全存活）
            } else {
                this.destroy();
            }
        };
        // leave 返回 false（无动画配置/环境）→ 立即同步执行收尾（ADR-0039 标准时序）
        if (!this.engine.animate.leave(root, phase, done)) done();
    }

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
    mountContent(hostEl: HTMLElement, contentScope: AutoSparkScope, isFragment = false): void {
        if (this._destroyed) return;
        this.remoteFailed = false;
        this._rearmBoundaryForContent();
        this._contentHost = hostEl;
        this.instanceScope = contentScope;
        this.isFragment = isFragment;
        // 换轨级联死亡订阅：探测间隙挂 parentScope → 接管后挂内容 scope（先退订再重订）
        this._unsubScopeDeath?.();
        this._unsubScopeDeath = onScopeDestroyed(this.engine, contentScope, () => this.destroy());
        this.boundary?.appendChild(hostEl);
    }

    /**
     * 销毁内容宿主（ADR-0123 retry 前置，消费者指令调用）：内容 scope 回收（destroy 级联
     * 宿主子树 + $scopes 条目清理）→ 宿主产物摘除 → 边界复位为加载锚形态（x-loading +
     * 最小尺寸）→ 级联死亡订阅换回 parentScope（重新探测间隙）。
     */
    destroyContent(): void {
        if (this._destroyed) return;
        this._unsubScopeDeath?.();
        this._unsubScopeDeath = null;
        if (this.instanceScope) {
            const ids = this._collectContentScopeIds();
            this.instanceScope.destroy(); // 级联销毁宿主子树（x-html runner 中止、watcher off）
            const scopes = (this.engine.store.state as Record<string, any>)[SCOPES_KEY] as
                | Record<string, any>
                | undefined;
            if (scopes) for (const id of ids) delete scopes[id];
            this.instanceScope = null;
        }
        this._contentHost?.remove();
        this._contentHost = null;
        this.isFragment = false;
        this._rearmBoundaryForLoading();
        if (this.parentScope) {
            this._unsubScopeDeath = onScopeDestroyed(this.engine, this.parentScope, () =>
                this.destroy(),
            );
        }
    }

    /**
     * 重建 x-error 边界（ADR-0123 retry 前置，消费者通道调用）：错误呈现后的边界元素已被
     * x-error 呈现块占用，原位复位无法清空呈现态——摘旧建新。记录出口内原位
     * （parentElement + nextSibling）→ 摘旧边界（脱离观察根后 dispatcher 异步 unmount
     * 残留 Runtime 指令，元素整体废弃，无视觉残留）→ 销毁旧边界 scope → 新建边界
     * （加载锚形态）→ 原位插回（新边界经额外观察根拾取重新挂载 Runtime 指令）。
     * 新边界 scope 为空——调用方须重新注入错误桥 actions（injectErrorBridge）。
     */
    rebuildBoundary(): void {
        if (this._destroyed) return;
        const old = this.boundary;
        if (!old) return;
        const parent = old.parentElement;
        const next = old.nextSibling;
        old.remove();
        this.boundaryScope?.destroy();
        this.boundaryScope = null;
        this.boundary = null;
        const fresh = this._makeBoundary();
        if (parent) parent.insertBefore(fresh, next);
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
        this._unsubScopeDeath?.();
        this._unsubScopeDeath = null;
        if (this._delayTimer) {
            clearTimeout(this._delayTimer);
            this._delayTimer = null;
        }
        this._clearAnchorCleanup();
        removeOpenInstance(this);
        if (this.instanceScope) {
            const ids = this._collectScopeIds(this.instanceScope);
            this.instanceScope.destroy(); // 幂等守卫（scope.destroyed 标志）：级联已销毁时 no-op
            const scopes = (this.engine.store.state as Record<string, any>)[SCOPES_KEY] as
                | Record<string, any>
                | undefined;
            if (scopes) for (const id of ids) delete scopes[id]; // 回收私有响应式域（对齐 x-loading teardown 纪律）
            this.instanceScope = null;
        }
        // x-error 边界轻量 scope 回收（ADR-0123）：rootless 独立（错误呈现块编译父），destroy
        // 级联呈现块 scope；无 data 域（无 $scopes 条目），引擎 scopes 注册表随 WeakRef 目标回收
        this.boundaryScope?.destroy();
        this.boundaryScope = null;
        // shell scope 统一回收（ADR-0062）：rootless 挂链无级联来源，destroy 显式销毁 +
        // 回收私有响应式域。子树条目一并收集删除——shell 内嵌 overlay 组件实例（ADR-0124）
        // 的数据域条目属本实例拥有者纪律覆盖面（级联销毁不自清条目）
        if (this._shellScope) {
            const shellIds = this._collectScopeIds(this._shellScope);
            this._shellScope.destroy();
            const scopes = (this.engine.store.state as Record<string, any>)[SCOPES_KEY] as
                | Record<string, any>
                | undefined;
            if (scopes) for (const id of shellIds) delete scopes[id];
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
        this.boundary = null;
        this._contentHost = null;
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

    /** keepalive 恢复（ADR-0119）：重新定位显示 + 重挂 delayClose（props 挂起期间 watch 存活，无需补应用——ADR-0123） */
    private _resume(): void {
        this._suspended = false;
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
     * 建 x-error 边界（ADR-0123 决策 4，兼加载锚）：Runtime 指令属性由额外观察根拾取挂载
     * （dispatcher 通道，与 shell 产物同域）；自身定位（错误覆盖层 `absolute inset:0` 的
     * 定位基准）+ 最小尺寸（shell 骨架面板先可见——加载中不是塌缩空壳）；x-loading 呈现于
     * 边界内部（shell 内容出口层，自定义 shell 的标题栏等外壳层不被遮盖）。
     * 边界轻量 scope（{@link boundaryScope}）经文本 scope 先例模式注册（错误呈现块编译父
     * + overlayRetry/overlayClose action 注入点——消费者指令写入 actions）。
     */
    private _makeBoundary(): HTMLElement {
        const boundary = document.createElement("div");
        boundary.setAttribute("x-error", "");
        boundary.setAttribute("x-loading", "true");
        boundary.style.cssText =
            "position:relative;" +
            "min-width:var(--autospark-overlay-loading-min-width, 240px);" +
            "min-height:var(--autospark-overlay-loading-min-height, 120px);";
        const scope = new AutoSparkScope(this.engine, boundary, boundary);
        this.engine.scopes.set(new WeakRef(boundary), scope);
        this.boundary = boundary;
        this.boundaryScope = scope;
        return boundary;
    }

    /** 边界复位为内容形态（mountContent）：摘 x-loading + 最小尺寸（内容接管视觉） */
    private _rearmBoundaryForContent(): void {
        const boundary = this.boundary;
        if (!boundary) return;
        boundary.removeAttribute("x-loading");
        boundary.style.minWidth = "";
        boundary.style.minHeight = "";
    }

    /** 边界复位为加载锚形态（destroyContent / 重试）：重挂 x-loading + 最小尺寸 */
    private _rearmBoundaryForLoading(): void {
        const boundary = this.boundary;
        if (!boundary) return;
        boundary.setAttribute("x-loading", "true");
        boundary.style.minWidth = "var(--autospark-overlay-loading-min-width, 240px)";
        boundary.style.minHeight = "var(--autospark-overlay-loading-min-height, 120px)";
    }

    /**
     * 子树 $scopes 条目收集（ADR-0123 拥有者自负纪律的通用化）：级联 destroy 不清 $scopes
     * 条目（拥有者自负）——子树内组件实例 scope（x-component 宿主自有 scope，含 shell 内嵌
     * 的 autospark.overlay 实例，ADR-0124）各自持有数据域条目，拥有者（本实例）统一按子树
     * 收集删除（对齐 x-loading teardown 纪律）。
     * 须在 destroy 级联**前**调用（children Set 随销毁清空）。
     */
    private _collectScopeIds(root: AutoSparkScope): string[] {
        const ids: string[] = [];
        const walk = (s: AutoSparkScope) => {
            ids.push(String(s.id));
            for (const c of s.children) walk(c);
        };
        walk(root);
        return ids;
    }

    /** 构建：x-error 边界 + shell 挂载 + 级联订阅（探测间隙挂 parentScope，ADR-0123） */
    private _buildAndMount(): void {
        // 1. x-error 边界（兼加载锚）——shell 默认出口的 live 插槽段（ADR-0062 / ADR-0123）
        const boundary = this._makeBoundary();
        // 2. shell 面板构建 + 挂载 + 显示（live 段投影，ADR-0062）
        this._buildShellAndMount(boundary);
        // 3. scope 级联死亡感知：内容宿主编译前的探测间隙挂 parentScope（rootless 防御跳过）；
        //    mountContent 后换轨内容 scope。shell scope rootless（无挂链）——由本实例 destroy 统一回收。
        if (this.parentScope) {
            this._unsubScopeDeath = onScopeDestroyed(this.engine, this.parentScope, () =>
                this.destroy(),
            );
        }
    }

    /**
     * 构建 shell 面板 + 挂载容器 + 显示（ADR-0123）：x-error 边界作为 `mode:"live"` 段
     * 投影进 shell 默认出口（活体直挂不克隆不重编译，销毁权责归本实例统一回收双 scope）。
     */
    private _buildShellAndMount(boundary: HTMLElement): void {
        const container = getOverlayContainer(this.engine);
        if (!container) return; // SSR / 无 body：跳过挂载

        // 编译 **shell 组件**（ADR-0062）：config 整包注入 shell data 域（初始快照，Q13——
        // 打开时一次，不热更新）；边界以 `mode:"live"` 段投影进 shell 默认出口。
        // shell 未声明默认出口 → warn + 边界直挂 shell 根（弹窗照常工作，失效可发现）。
        const shell = this._shell;
        // 出口判定：def.slots 无出口时为 undefined——undefined 或不含 "default" 均视为无默认出口。
        // ADR-0124 决策 8（实现偏差注记）：内嵌 overlay 骨架的 shell 不声明 default 出口
        //（直通锚内置于 overlay body 出口 fallback——内容收集管线剥离嵌套标记，锚不可经
        // shell 内容段携带），边界仍以 default 段 stash 经 `slots="*"` 转发链投递，不发 warn；
        // 既无出口又未内嵌 overlay 才是失效形态——warn + 边界直挂面板根兜底。
        const hasDefaultOutlet = !!shell.def?.slots?.includes("default");
        const embedsOverlay = !hasDefaultOutlet && shellEmbedsOverlay(shell.snapshot);
        let shellSlots: Map<string, SlotContent> | null = null;
        if (hasDefaultOutlet || embedsOverlay) {
            shellSlots = new Map([
                [
                    "default",
                    {
                        name: "default",
                        nodes: [boundary],
                        params: [],
                        paramsExpr: null,
                        mode: "live",
                    } satisfies SlotContent,
                ],
            ]);
        } else {
            this.engine.logger.warn(
                `x-overlay "${this.name}": shell "${shell.name}" 未声明默认出口（x-slot），内容直挂面板根（ADR-0062）`,
            );
        }
        // chrome 段并入（ADR-0124 决策 11）：shell 内嵌 autospark.overlay 的 `slots="*"`
        // 通配转发使出口查找 miss 后原名上溯 shellScope 命中消费者分段——并入而非直挂
        // overlay，是为了同时支持自定义 shell 显式提供/同名覆盖（并存降级语义不变式）。
        if (this.chromeSlots && this.chromeSlots.size > 0) {
            shellSlots ??= new Map();
            for (const [name, seg] of this.chromeSlots) shellSlots.set(name, seg);
        }
        const shellClone = shell.snapshot.cloneNode(true) as HTMLElement;
        const shellCompiled = this.engine.compiler.instantiateDetachedComponent(
            shellClone,
            null, // shell rootless 挂链：形态组件不依赖声明上下文，生命周期归本实例
            shell.def,
            this.config as unknown as Record<string, any>,
            undefined,
            shellSlots,
            // slotCallerScope = 消费者 binding（ADR-0124）：chrome 段出口投影时
            // callerScope 取持有者的 slotCallerScope，表达式以消费处 scope 求值；
            // live 段（边界）不编译不受影响
            this.parentScope,
        );
        this._shellScope = shellCompiled.scope;
        const panel = shellCompiled.el;

        // 无默认出口回退：仅「未内嵌 overlay 的失效 shell」直挂面板根（内嵌 overlay 形态
        // 的边界已入 shell 内容集，经 overlay body 直通锚投递——直挂会双重持有）
        if (!hasDefaultOutlet && !embedsOverlay) {
            panel.appendChild(boundary);
        }

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
