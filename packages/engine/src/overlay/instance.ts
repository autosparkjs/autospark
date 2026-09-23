import type { AutoSpark } from "../engine";
import { SCOPES_KEY } from "../engine";
import type { AutoSparkScope } from "../scope";
import type { ComponentDef } from "../directives/component-def";
import { resolveAnimate } from "../animate";
import { releaseComponentStyle } from "../utils/scopedStyle";
import { getOverlayContainer, MASK_CLASS, PANEL_CLASS } from "./container";
import { pushOpenInstance, removeOpenInstance } from "./stack";
import { applyAnchorPosition, resolveAnchorEl, OVERLAY_ARROW_CLASS } from "./anchor";
import { unregisterInstance } from "./registry";
import { normalizeAtConfig, type OverlayConfig, type OverlayEventDetail } from "./types";

/**
 * 覆盖物实例选项（消费者解析后传入）。
 */
export interface OverlayInstanceOptions {
    /** scope 基准挂链目标（declarer→声明处 scope / host→消费者 scope / null→rootless） */
    parentScope?: AutoSparkScope | null;
    /** `at.selector` 相对选择器的查询域（消费者宿主 / 命令式 scope 元素） */
    searchRoot?: HTMLElement | null;
    /** 数据视图基准元素（命令式 `options.scope`；声明式为 null——基准由 parentScope 表达） */
    scopeEl?: HTMLElement | null;
    /** 模态遮罩外壳（dialog 形态：遮罩 + flex 居中 + closeOnMask）；缺省裸面板直挂容器 */
    mask?: boolean;
}

/**
 * 覆盖物实例（ADR-0052 修订版）：覆盖物被消费者打开渲染出的**活体**。
 *
 * 内容 = 任意组件：`snapshot`（组件冻结快照）经 `instantiateDetachedComponent` 管道编译——
 * data()/props、methods、四阶段 hooks、scoped CSS、styleBinds、数据基准全生效（x-use 管道兄弟路径）。
 *
 * 结构两态（修订共识 4）：
 * - `mask: true`（dialog 模态形态）：遮罩外壳根（`autospark-dialog-mask`，实例 el）> 面板
 *   （`autospark-dialog`，`data-overlay="<名称>"`）> 组件编译产物；
 * - `mask: false`（基座默认）：面板直挂 body 容器（未来 drawer/popup 等形态定制入口）。
 *
 * 每次打开都是**新实例**（修订共识 5：singleton 机制未引入）——关闭动画播完即销毁
 * （scope 级联回收 + DOM 摘除），多实例可并存、层叠 = DOM 追加顺序。
 *
 * 生命周期：
 * - `open(props)`：构建外壳 + 编译组件 → enter 动画 → 入打开栈 → 广播 `overlay:open`；
 * - `requestClose(source)`：「请求关闭」统一入口（ESC/遮罩/close action/`close()` API）——
 *   先回调 onCloseRequest（visible 写回由消费者注入，命令式无），再 `close()`；
 * - `close()`：leave 动画 → **销毁**（无保活态）→ 出栈 + 广播 `overlay:close`
 *   （**广播在 UI 关闭开始时**，善后可监听）；
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
    /** 组件冻结快照根（registry 登记键） */
    readonly snapshot: HTMLElement;
    /** 组件定义（可 null：纯快照组件无 setup） */
    readonly def: ComponentDef | null;
    /** 生效配置（三级深度合并产物） */
    config: OverlayConfig;
    /** 数据视图基准元素（命令式 `options.scope`；声明式为 null——基准由 parentScope 表达） */
    readonly scopeEl: HTMLElement | null;
    /** `at.selector` 相对选择器的查询域（消费者宿主 / 命令式 scope 元素） */
    readonly searchRoot: HTMLElement | null;
    /** scope 基准挂链目标（declarer→声明处 scope / host→消费者 scope / null→rootless） */
    readonly parentScope: AutoSparkScope | null;
    /** 模态遮罩外壳（dialog 形态） */
    readonly mask: boolean;

    /** 「请求关闭」回调：消费者注入（visible 可写回时写回 false）；命令式无（决策 19） */
    onCloseRequest: ((inst: OverlayInstance, source: string) => void) | null = null;

    /** 实例根（mask 形态为遮罩外壳；bare 形态为面板；未构建/已销毁为 null） */
    el: HTMLElement | null = null;
    /** 实例 scope（组件编译产物；data()/props 注入域） */
    instanceScope: AutoSparkScope | null = null;

    /** 当前是否可见（关闭动画中即 false） */
    private _visible = false;
    /** 关闭动画进行中（防重入；重开抢占经 animate.cancel） */
    private _closing = false;
    /** 已销毁（幂等守卫） */
    private _destroyed = false;
    /** 面板元素 */
    private _panel: HTMLElement | null = null;
    /** anchor autoUpdate 等清理回调 */
    private _cleanups: Array<() => void> = [];
    /** scope 级联死亡监听退订 */
    private _unsubScopeDeath: (() => void) | null = null;
    /** delayClose 自动关闭定时器 */
    private _delayTimer: ReturnType<typeof setTimeout> | null = null;

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
        this.scopeEl = opts.scopeEl ?? null;
        this.mask = opts.mask ?? false;
    }

    /** 是否可见 */
    get visible(): boolean {
        return this._visible;
    }

    /** 是否已销毁 */
    get destroyed(): boolean {
        return this._destroyed;
    }

    /**
     * 打开（修订共识 5：每次新实例，无复用态）：关闭动画中重开 → cancel 同步完成待决离场后重建。
     * props 注入组件 data 域（覆盖 data() 默认）。
     */
    open(props?: Record<string, any>): void {
        if (this._destroyed) return;
        if (this._closing) {
            // 关闭动画中重开：cancel = 同步完成待决离场（onDone → destroy），随后走全新构建
            this.engine.animate.cancel(this.el!);
        }
        this._buildAndMount(props);
        // delayClose 自动关闭（>0 时）：打开后延时自动「请求关闭」（通知/公告类开箱即用通道）。
        // 走 requestClose 标准链——可回写的 visible 照常回写、事件照常广播。
        const delay = Number(this.config.delayClose);
        if (delay > 0) {
            this._delayTimer = setTimeout(() => {
                this._delayTimer = null;
                this.requestClose("delay");
            }, delay);
        }
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
     * **销毁**（修订共识 5：无 singleton 保活态）。幂等（不可见/关闭中/已销毁均 no-op）。
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
            this.destroy();
        };
        // leave 返回 false（无动画配置/环境）→ 立即同步执行收尾（ADR-0039 标准时序）
        if (!this.engine.animate.leave(root, phase, done)) done();
    }

    /**
     * 销毁（无动画强拆）：scope 级联 / engine.destroy / 关闭收尾。幂等。
     * 先摘 DOM（observer 收到 removedNodes → unmount 子树 Runtime 指令）再注销额外观察根。
     */
    destroy(): void {
        if (this._destroyed) return;
        this._destroyed = true;
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
            if (this.def?.name) releaseComponentStyle(this.def.name); // scoped 样式引用对称释放
            this.instanceScope = null;
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

    /** 构建外壳 + 编译组件 + 挂载容器 */
    private _buildAndMount(props?: Record<string, any>): void {
        const container = getOverlayContainer(this.engine);
        if (!container) return; // SSR / 无 body：跳过挂载

        // 1. 外壳两态（修订共识 4）：mask 形态 = 遮罩根 > 面板（data-overlay 契约）；bare = 面板直挂容器
        const panel = document.createElement("div");
        panel.className = PANEL_CLASS;
        panel.setAttribute("data-overlay", this.name);
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

        // 2. 编译组件（instantiateDetachedComponent 管道：data() 默认 → props 覆盖、methods、
        //    四阶段 hooks、scoped CSS、styleBinds、数据基准全生效——x-use 兄弟路径）
        const clone = this.snapshot.cloneNode(true) as HTMLElement;
        const compiled = this.engine.compiler.instantiateDetachedComponent(
            clone,
            this.parentScope,
            this.def,
            props,
        );
        this.instanceScope = compiled.scope;
        panel.appendChild(compiled.el);
        // 面板 1px 边框（config.border，默认 true——无锚定也生效）：画在 panel 外壳上并配套
        // 背景 + 圆角（Tippy 外壳模式）——引擎无法预知用户的视觉面板是哪层 div，由外壳统一
        // 承担背景/边框/圆角，同色背景填平任何圆角微差；箭头双层变色经子选择器联动。
        if (this.config.border !== false) {
            panel.setAttribute("data-overlay-border", "");
        }

        // 3. scope 级联死亡感知：实例 scope 随挂链销毁时强拆自身（决策 11 生命周期三合一）
        this._unsubScopeDeath = onScopeDestroyed(this.engine, compiled.scope, () => this.destroy());

        // 5. 额外观察根 + 挂载容器 + 显示
        this.engine.dispatcher.addExtraRoot(root);
        container.appendChild(root);
        this._show();
    }

    /** 显示（构建后）：锚定定位 → enter 动画 → 入栈 → 广播 */
    private _show(): void {
        const root = this.el!;
        root.style.display = "";
        this._visible = true;

        // 锚定定位（每次显示现算：配置与锚点可随重开变化；未命中 warn 退居中，决策 22/24）。
        // config.at 三态（字符串/元素简写 ≡ {selector}）经 normalizeAtConfig 归一。
        this._clearAnchorCleanup();
        const anchorCfg = normalizeAtConfig(this.config.at);
        const anchorEl = anchorCfg ? resolveAnchorEl(anchorCfg.selector, this.searchRoot) : null;
        if (anchorEl && anchorCfg) {
            // 箭头载体（锚定模式默认开启，`arrow: false` 显式关闭）：注入须先于 applyAnchorPosition
            // （middleware 经 :scope > 查询载体）；退居中分支不注入——避免未定位载体残留孤立菱形。
            if (anchorCfg.arrow !== false) {
                const arrowHost = document.createElement("div");
                arrowHost.className = OVERLAY_ARROW_CLASS;
                this._panel!.appendChild(arrowHost);
            }
            applyAnchorPosition(anchorCfg, anchorEl, this._panel!, (fn) =>
                this._cleanups.push(fn),
            );
        } else {
            if (this.config.at != null) {
                // 提示原始选择器（config.at 已归一化为对象，String 化前取回 selector）
                this.engine.logger.warn(
                    `x-overlay "${this.name}": at "${String(anchorCfg?.selector ?? this.config.at)}" 未命中，退屏幕居中（ADR-0052 决策 22）`,
                );
            }
            this._resetPanelToCentered();
        }

        const phase = resolveAnimate(this.config.animate).enter;
        if (phase) this.engine.animate.enter(root, phase);
        pushOpenInstance(this);
        this._broadcast("overlay:open");
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

    /** 事件双通道广播（决策 13；payload 收窄 `{name, instance, scope}`——修订共识 9） */
    private _broadcast(type: "overlay:open" | "overlay:close"): void {
        const detail: OverlayEventDetail = {
            name: this.name,
            instance: this,
            scope: this.scopeEl ?? undefined,
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
