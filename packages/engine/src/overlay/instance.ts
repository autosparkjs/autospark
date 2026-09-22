import type { AutoSpark } from "../engine";
import { SCOPES_KEY } from "../engine";
import type { AutoSparkScope } from "../scope";
import { resolveAnimate } from "../animate";
import { getOverlayContainer, MASK_CLASS, PANEL_CLASS } from "./container";
import { pushOpenInstance, removeOpenInstance } from "./stack";
import { applyAnchorPosition, resolveAnchorEl, OVERLAY_ARROW_CLASS } from "./anchor";
import { unregisterInstance } from "./registry";
import type { OverlayConfig, OverlayDef } from "./types";

/**
 * 覆盖层实例（ADR-0052）：覆盖层定义被消费者打开渲染出的**活体**。
 *
 * 结构：遮罩外壳根（`autospark-dialog-mask`，实例 el）> 面板（`autospark-dialog`，
 * `data-overlay="<名称>"`）> 模板编译产物（compileChild，组件语义全生效）。
 * 实例 scope 挂链 = scope 基准（决策 11 三合一）：`declarer` → 声明处 scope（近永续）；
 * `consumer` → 消费者 scope（随消费者生死）；null → rootless（命令式无 scope，仅全局视图）。
 *
 * 生命周期：
 * - `open()`：懒构建（或单例隐藏态复活）→ enter 动画 → 入打开栈 → 广播 `overlay:open`；
 * - `requestClose(source)`：「请求关闭」统一入口（ESC/遮罩/close action/`close()` API）——
 *   先回调 onCloseRequest（visible 写回由消费者注入，命令式无），再 `close()`；
 * - `close()`：leave 动画 → singleton 隐藏保活（`display:none`，DOM+scope 存活）/
 *   非 singleton 销毁 → 出栈 + 广播 `overlay:close`（**广播在 UI 关闭开始时**，善后可监听）；
 * - `destroy()`：无动画强拆（scope 级联 / engine.destroy / 非单例关闭）——幂等。
 *
 * 实例 DOM 在 `document.body` 容器内（engine 宿主树外）——挂载时向 dispatcher 登记**额外观察根**
 * （决策 14），使子树内 Runtime 指令（x-loading 等）正常挂载；销毁时先摘 DOM 再注销观察根
 * （observer 的 removedNodes 先行 unmount）。
 */
export class OverlayInstance {
    readonly engine: AutoSpark<any>;
    readonly def: OverlayDef;
    /** 生效配置（四级深度合并产物；单例复用时被 acquire 替换为最新合并结果） */
    config: OverlayConfig;
    /** 覆盖层名（= def.name） */
    readonly name: string;
    /** 数据视图基准元素（命令式 `options.scope`；声明式为 null——基准由 parentScope 表达） */
    readonly scopeEl: HTMLElement | null;
    /** `anchor.at` 无 `@` 前缀选择器的查询域（消费者宿主 / 命令式 scope 元素） */
    readonly searchRoot: HTMLElement | null;
    /** scope 基准挂链目标（declarer→声明处 scope / consumer→消费者 scope / null→rootless） */
    readonly parentScope: AutoSparkScope | null;

    /** 「请求关闭」回调：消费者注入（visible 可写回时写回 false）；命令式无（决策 19） */
    onCloseRequest: ((inst: OverlayInstance, source: string) => void) | null = null;

    /** 遮罩外壳根（实例 el；未构建/已销毁为 null） */
    el: HTMLElement | null = null;
    /** 实例 scope（compileChild 产物；模板 data()/params 注入域） */
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

    constructor(
        engine: AutoSpark<any>,
        def: OverlayDef,
        config: OverlayConfig,
        opts: { parentScope?: AutoSparkScope | null; searchRoot?: HTMLElement | null; scopeEl?: HTMLElement | null } = {},
    ) {
        this.engine = engine;
        this.def = def;
        this.config = config;
        this.name = def.name;
        this.parentScope = opts.parentScope ?? null;
        this.searchRoot = opts.searchRoot ?? null;
        this.scopeEl = opts.scopeEl ?? null;
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
     * 打开（幂等，决策 18）：已可见 → 仅重注入 params；单例隐藏态 → 复活（不重建 DOM）；
     * 关闭动画中 → 抢占（cancel 同步完成待决离场后复活/重建）。
     */
    open(params?: Record<string, any>): void {
        if (this._destroyed) return;
        if (this._visible) {
            this._applyParams(params);
            return;
        }
        if (this._closing) {
            // 关闭动画中重开：cancel = 同步完成待决离场（onDone → _teardownDom），随后走复活/重建
            this.engine.animate.cancel(this.el!);
        }
        if (this.el) {
            // 单例隐藏态复活（DOM+scope 保活）：重注入 params + 重新显示（anchor 每次显示现算）
            this._applyParams(params);
            this._show();
            return;
        }
        this._buildAndMount(params);
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
     * singleton 隐藏保活 / 非 singleton 销毁。幂等（不可见/关闭中/已销毁均 no-op）。
     */
    close(): void {
        if (!this._visible || this._closing || this._destroyed) return;
        this._visible = false;
        removeOpenInstance(this);
        this._clearAnchorCleanup();
        this._broadcast("overlay:close");
        const mask = this.el!;
        const phase = resolveAnimate(this.config.animate).leave;
        this._closing = true;
        const done = () => {
            this._closing = false;
            this._teardownDom();
        };
        // leave 返回 false（无动画配置/环境）→ 立即同步执行收尾（ADR-0039 标准时序）
        if (!this.engine.animate.leave(mask, phase, done)) done();
    }

    /** 关闭收尾（leave 动画完成后，决策 10）：singleton 隐藏保活（DOM+scope 存活）/ 非 singleton 销毁 */
    private _teardownDom(): void {
        if (this._destroyed) return;
        if (this.config.singleton) {
            this.el!.style.display = "none";
        } else {
            this.destroy();
        }
    }

    /**
     * 销毁（无动画强拆）：scope 级联 / engine.destroy / 非单例关闭。幂等。
     * 先摘 DOM（observer 收到 removedNodes → unmount 子树 Runtime 指令）再注销额外观察根。
     */
    destroy(): void {
        if (this._destroyed) return;
        this._destroyed = true;
        this._unsubScopeDeath?.();
        this._unsubScopeDeath = null;
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
        if (this.el) {
            const mask = this.el;
            mask.removeEventListener("click", this._onMaskClick);
            mask.removeEventListener("action:close", this._onCloseAction);
            mask.remove();
            this.engine.dispatcher.removeExtraRoot(mask);
            this.el = null;
            this._panel = null;
        }
        if (this.def.singletonInstance === this) this.def.singletonInstance = null;
        unregisterInstance(this.def, this);
    }

    // ── 内部 ──────────────────────────────────────────────────────────

    /** 构建外壳 + 编译模板 + 挂载容器（首次打开路径；单例复用走 `_show` 复活） */
    private _buildAndMount(params?: Record<string, any>): void {
        const container = getOverlayContainer(this.engine);
        if (!container) return; // SSR / 无 body：跳过挂载

        // 1. 外壳：遮罩根 > 面板（data-overlay 契约）
        const mask = document.createElement("div");
        mask.className = MASK_CLASS;
        const panel = document.createElement("div");
        panel.className = PANEL_CLASS;
        panel.setAttribute("data-overlay", this.name);
        if (this.def.type) panel.setAttribute("data-overlay-type", this.def.type);
        mask.appendChild(panel);
        mask.addEventListener("click", this._onMaskClick);
        // close action 委托（ADR-0052 决策 7 / ADR-0036 决策 7）：子树内任意 action 广播的
        // `action:close` DOM 冒泡事件到实例根被接住 → 请求关闭（overlay 在 body 下，
        // engine 树内祖先收不到——必须实例根委托）
        mask.addEventListener("action:close", this._onCloseAction);
        this.el = mask;
        this._panel = panel;

        // 2. 编译模板（组件语义全生效：data() 默认 → params 覆盖、methods、四阶段 hooks、scoped CSS）
        const clone = this.def.snapshot.cloneNode(true) as HTMLElement;
        const initialData =
            params && typeof params === "object" ? { ...(params as Record<string, any>) } : undefined;
        const compiled = this.engine.compiler.compileChild(
            clone,
            this.parentScope,
            {},
            undefined,
            initialData,
            this.def,
        );
        this.instanceScope = compiled.scope;
        panel.appendChild(compiled.el);

        // 3. 箭头载体（anchor.arrow: true 时；视觉由伪元素默认样式承担，决策 24）
        if (this.config.anchor?.arrow) {
            const arrowHost = document.createElement("div");
            arrowHost.className = OVERLAY_ARROW_CLASS;
            panel.appendChild(arrowHost);
        }

        // 4. scope 级联死亡感知：实例 scope 随挂链销毁时强拆自身（决策 11 生命周期三合一）
        this._unsubScopeDeath = onScopeDestroyed(this.engine, compiled.scope, () => this.destroy());

        // 5. 额外观察根 + 挂载容器 + 显示
        this.engine.dispatcher.addExtraRoot(mask);
        container.appendChild(mask);
        this._show();
    }

    /** 显示（首开与单例复活共用）：锚定定位 → enter 动画 → 入栈 → 广播 */
    private _show(): void {
        const mask = this.el!;
        mask.style.display = "";
        this._visible = true;

        // 锚定定位（每次显示现算：配置与锚点可随重开变化；未命中 warn 退居中，决策 22/24）
        this._clearAnchorCleanup();
        const at = this.config.anchor?.at;
        const anchorEl = at != null ? resolveAnchorEl(at as any, this.searchRoot) : null;
        if (anchorEl && this.config.anchor) {
            applyAnchorPosition(this.config.anchor, anchorEl, this._panel!, (fn) =>
                this._cleanups.push(fn),
            );
        } else {
            if (at != null) {
                this.engine.logger.warn(
                    `x-overlay "${this.name}": anchor.at "${String(at)}" 未命中，退屏幕居中（ADR-0052 决策 22）`,
                );
            }
            this._resetPanelToCentered();
        }

        const phase = resolveAnimate(this.config.animate).enter;
        if (phase) this.engine.animate.enter(mask, phase);
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

    /** params 重注入（响应式域 Object.assign——模板内绑定字段级细粒度刷新） */
    private _applyParams(params?: Record<string, any>): void {
        if (!params || typeof params !== "object" || !this.instanceScope?._data) return;
        Object.assign(this.instanceScope._data, params);
    }

    /** 遮罩点击 → 请求关闭（仅命中最上层遮罩本体；面板内点击不关；closeOnMask 可关） */
    private _onMaskClick = (e: Event): void => {
        if (!this.config.closeOnMask) return;
        if (e.target !== this.el) return;
        this.requestClose("mask");
    };

    /** 子树内 close action 广播 → 请求关闭（实例根委托，决策 7） */
    private _onCloseAction = (): void => {
        this.requestClose("close-action");
    };

    /** 事件双通道广播（决策 13）：实例根 DOM 冒泡（body 链内可达）+ 引擎事件总线 */
    private _broadcast(type: "overlay:open" | "overlay:close"): void {
        const detail = {
            name: this.name,
            type: this.config.type || undefined,
            scope: this.scopeEl ?? undefined,
            instance: this,
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
