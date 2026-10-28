import { AutoSparkDirectiveBase, DirectiveKind, type RuntimeDirective } from "../features/directive/base";
import { SCOPES_KEY } from "../consts";
import type { AutoSparkScope } from "../engine/scope";
import { queryRelElement } from "../utils/queryRelElement";
import { normalizeError, type NormalizedError } from "../utils/normalizeError";
import { buildAction } from "../features/action/buildAction";
import type { AutoSparkAction } from "../features/action/types";
import type { AutoSparkActionContext } from "./x-on/types";
import { ERROR_COMPONENT_NAME } from "../components";

/**
 * x-error：捕获子树**运行时错误**并在宿主区域呈现。（**运行时指令**，走 observer 通道）
 *
 * **运行时语义**（详见 docs/adr/0118-x-error-directive.md）：
 * - 错误来源二（决策 2）：action 失败（rejected）经 buildAction 桥接自动派发 `error`
 *   CustomEvent（bubbles+composed）；`raise(error, options?)` 内置 action 显式派发同款事件。
 * - **就近消费**（决策 3）：宿主监听 `error` 事件，捕获即 `stopPropagation`——嵌套 x-error
 *   内层优先，外层不再收到；`behavior:'none'` 同样 stop（纯消费也是消费）。
 * - **单错误槽**：新错误**替换**当前呈现（无队列/堆叠——最新错误即最相关错误）。
 * - 编译期错误**不进本通道**（决策 1：指令 created/compile、表达式首求值抛错归 `scope.errors`，
 *   正交两轨）。
 *
 * behavior 三态（决策 4，`x-error-options.behavior`，默认 `'overlay'`）：
 * - `'none'`：纯消费不呈现（声明「此区域错误我认领」，如已自建错误 UI 的组件边界）；
 * - `'addErrorClass'`：宿主加错误 class（默认名 `error`，`errorClass` 自定义），清除时移除；
 * - `'overlay'`：挂载错误覆盖层——x-loading 同款契约（append 到目标、`position:absolute;inset:0`、
 *   原内容保留、清除=移除 DOM；**目标须 relative**）。`overlayAt` 经 queryRelElement 相对查询
 *   指定挂载目标（默认宿主，未命中/非法回退宿主）。
 *
 * **配置双通道**（决策 4/7）：`behavior` / `overlay` / `errorClass` / `overlayAt` / `closeable` /
 * `retryable` = **静态字面量**（成员形态 `x-error-options.behavior="'none'"` 去引号，不支持
 * 表达式——呈现结构配置非状态驱动，同 x-loading 视觉字段先例）；`props` / `actions` =
 * **表达式**（全局 store watch，x-loading `_bindValue` 同款 collectDependencies 通道；整包形态
 * `x-error-options="{props:{...}}"` 为解析期静态值）。`closeable`（默认 true）/ `retryable`
 * （默认 action 源 true、raise 源 false）/ `actions` / `props` 另可由 `raise` 第二参
 * **事件层**供给——事件层优先于静态层。
 *
 * **错误组件解析链**（决策 5）：`options.overlay` > 指令值简写（`x-error="my.error"`）>
 * 内置 `autospark.error`。查找经 `engine.getComponentDeclaration(name, el)`。组件 data 注入：
 * 保留键 `error`（归一化普通对象，决策 6——Error 实例不进响应式域）+ `message`（别名）+
 * `closeable` / `retryable` / `actions` + `props` 合并注入（props 传入保留键同名 warn 忽略）；
 * `close` / `retry` 经**块 scope actions 通道**注入（函数值进响应式 data 域会被代理当 computed
 * 吞掉）——模板 `@click="close()"` 走 x-on action 解析直调，关闭通道零 DOM 事件往返。
 *
 * **retry 语义**（决策 7，仅 `source:"action"` 生效）：以**原 args** 重调失败 action——
 * resolved → 自动清除呈现；rejected → 桥接派发的新 error 事件经单错误槽自然更新呈现。
 * raise 源无源可重：显式 `retryable:true` 也不渲染重试按钮并 warn。
 *
 * **actions 按钮**（决策 7）：`(string|ActionDesc)[]`——string 经 getAction 链解析 title/icon，
 * 渲染 `[{name,title,icon?}]`；触发走 **data-action 点击委托**（ADR-0038 同款：已注册走真
 * action，未注册合成透传 descriptor 双通道广播）。
 *
 * @example 就近捕获子树 action 失败 + 显式触发
 * <div x-error>
 *     <button @click="submit()">提交</button>
 *     <button @click="age < 18 ? raise('未成年不可提交') : submit()">提交</button>
 * </div>
 *
 * @example 纯消费（自建错误 UI 的组件边界）
 * <div x-error x-error-options.behavior="'none'">...</div>
 *
 * @example 错误 class 形态 + 自定义错误组件
 * <div x-error="my.error" x-error-options.behavior="'addErrorClass'" x-error-options.errorClass="'has-error'">...</div>
 */

/** behavior 合法值 */
const BEHAVIORS = ["none", "addErrorClass", "overlay"] as const;
type ErrorBehavior = (typeof BEHAVIORS)[number];

/** 默认错误 class 名（addErrorClass 态） */
const DEFAULT_ERROR_CLASS = "error";

/** 组件 data 保留键（指令独占——props 传入同名 warn 忽略，ADR-0118 决策 5） */
const RESERVED_DATA_KEYS = [
    "error",
    "message",
    "closeable",
    "retryable",
    "actions",
    "close",
    "retry",
] as const;

/** 当前呈现态（单错误槽） */
interface PresentState {
    /** 归一化错误对象 */
    error: NormalizedError;
    behavior: ErrorBehavior;
    /** addErrorClass 态已应用的 class 名（clear 时移除） */
    errorClass?: string;
    /** overlay 态已挂载的覆盖层根 */
    overlay?: HTMLElement;
    /** overlay 态覆盖层 scope（clear 时 destroy + 回收 $scopes[id]） */
    overlayScope?: AutoSparkScope | null;
    /** error 事件的 target（action 源 = 原触发元素，retry ctx 的 el） */
    triggerEl?: HTMLElement;
    /** load 源重试弹药（dispatchLoadError detail.retry，= loader.refresh()） */
    retryLoad?: () => Promise<unknown>;
}

/**
 * 静态字段字面量解析（成员形态 `x-error-options.<key>="..."` 的值为表达式文本，
 * 仅取字面量）：去引号字符串 / true / false / null / 数字；其余（表达式）返回 undefined。
 */
function parseStaticLiteral(raw: string): any {
    const v = raw.trim();
    if (v === "") return undefined;
    const first = v[0]!;
    const last = v[v.length - 1]!;
    if ((first === "'" && last === "'") || (first === '"' && last === '"')) {
        return v.slice(1, -1);
    }
    if (v === "true") return true;
    if (v === "false") return false;
    if (v === "null") return null;
    if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
    return undefined;
}

export class ErrorDirective extends AutoSparkDirectiveBase implements RuntimeDirective {
    /** 运行时指令：走 observer 通道（由 engine 级 RuntimeObserverDispatcher 驱动，ADR-0003 决策 7） */
    static override readonly kind = DirectiveKind.Runtime;

    /** 当前呈现态（单错误槽；未呈现为 null） */
    private _current: PresentState | null = null;
    /** 未注册名的合成透传 descriptor 缓存（按名复用，ADR-0038 决策 4；随实例生死） */
    private _synthetics: Map<string, AutoSparkAction> = new Map();
    /** 表达式通道（props/actions）最新求值值 */
    private _exprValues: Record<string, any> = {};

    /** error 事件监听（字段箭头函数保证 add/remove 同引用） */
    private _onError = (e: Event) => this._handleError(e);

    /** 元素挂载（dispatcher 检测到 add / 初始扫描）：解析配置 + 挂 error 监听 */
    override mounted(): void {
        // 表达式通道（props/actions）：全局 store watch（x-loading _bindValue 同款；
        // 呈现是事件驱动的，watch 只负责让下次呈现取到最新值）
        this._bindExprOption("props");
        this._bindExprOption("actions");
        this.el?.addEventListener("error", this._onError);
    }

    /** 元素移除（dispatcher 检测到 remove）：清监听 / 清呈现 / off watcher */
    override unmounted(): void {
        this.el?.removeEventListener("error", this._onError);
        this.clear();
        for (const w of this.watchers) {
            try {
                (w as any).off?.();
            } catch {
                /* 忽略已 off 的 watcher */
            }
        }
        this.watchers.length = 0;
    }

    /**
     * 属性值变化（dispatcher 检测到 setAttribute）：指令值 = 组件名简写，仅影响下次呈现；
     * 若正在呈现则以同错误按新解析链重挂（语义可预期）。
     */
    attrChanged(newVal: string, _oldVal?: string): void {
        this.value = newVal;
        if (this.info) this.info.value = newVal;
        if (this._current?.behavior === "overlay") {
            const { error, triggerEl } = this._current;
            this.clear();
            this._present(error, {}, triggerEl);
        }
    }

    // ── 配置读取 ────────────────────────────────────────────────────

    /**
     * 静态字面量字段读取（behavior/overlay/errorClass/overlayAt/closeable/retryable）：
     * 成员形态（optionExprs，表达式文本）去引号取字面量 > 整包形态走标准回退链
     * （`getOption`：指令选项 → 宿主选项 → 指令全局默认，ADR-0127）。
     * 非字面量（表达式）warn 并回退（呈现结构配置不支持状态驱动）。
     */
    private _staticOption(key: string): any {
        const expr = this.info.optionExprs?.[key];
        if (expr !== undefined) {
            const v = parseStaticLiteral(expr);
            if (v === undefined) {
                this.warn(`x-error: 选项 "${key}" 仅支持字面量（不支持表达式），已忽略: ${expr}`);
            }
            return v;
        }
        return this.getOption(key);
    }

    /**
     * 表达式通道绑定（props/actions，决策 4）：成员形态 = 全局 store 表达式（collectDependencies
     * 收集依赖后订阅，x-loading `_bindValue` 同款）；整包形态 = 解析期静态值直接取用。
     * 求值异常静默回 undefined（呈现时容错——坏配置不应阻断错误呈现自身）。
     */
    private _bindExprOption(key: "props" | "actions"): void {
        const expr = this.info.optionExprs?.[key];
        if (expr === undefined) {
            // 整包静态值走标准回退链（含宿主选项与指令全局默认，ADR-0127）
            const v = this.getOption(key);
            if (v !== undefined) this._exprValues[key] = v;
            return;
        }
        const trimmed = expr.trim();
        if (trimmed === "") return;
        const store = this.engine.store;
        const getter = new Function("scope", `with(scope){ return (${trimmed}); }`) as (
            scope: any,
        ) => any;
        const read = () => {
            try {
                return getter(store.state);
            } catch {
                return undefined;
            }
        };
        this._exprValues[key] = read();
        const deps = store.collectDependencies(() => {
            read();
        }, "read");
        this.watchers.push(
            store.watch(deps, () => {
                this._exprValues[key] = read();
            }),
        );
    }

    // ── 错误捕获与呈现 ──────────────────────────────────────────────

    /**
     * error 事件捕获（决策 3）：就近消费——捕获即 stopPropagation（含 behavior:none 纯消费），
     * 嵌套时内层优先、外层不再收到。归一化后按 behavior 呈现（单错误槽新替旧）。
     */
    private _handleError(e: Event): void {
        e.stopPropagation();
        const ce = e as CustomEvent;
        const d = ce?.detail;
        // 归一化（决策 6）：引擎 detail 恒带归一化 error 对象；第三方自 dispatch 的缺字段
        // error 事件按 `{message:String(detail)}` 兜底（决策「后果」节）
        let error: NormalizedError;
        if (d && typeof d === "object" && "error" in d) {
            const raw = d.error;
            error =
                raw && typeof raw === "object" && typeof raw.message === "string"
                    ? (raw as NormalizedError)
                    : normalizeError(raw, "unknown");
        } else {
            error = { message: String(d), source: "unknown" };
        }
        const triggerEl = e.target instanceof HTMLElement ? e.target : undefined;
        this._present(error, d && typeof d === "object" ? d : {}, triggerEl, d?.retry);
    }

    /**
     * 呈现错误（单错误槽：先清旧再呈新）。
     *
     * @param error     归一化错误对象
     * @param detail    事件层 detail（含 raise 第二参透传的 props/closeable/retryable/actions）
     * @param triggerEl error 事件 target（retry ctx 的 el）
     * @param retryLoad load 源重试弹药（dispatchLoadError detail.retry）
     */
    private _present(
        error: NormalizedError,
        detail: Record<string, any>,
        triggerEl?: HTMLElement,
        retryLoad?: () => Promise<unknown>,
    ): void {
        this.clear();
        const behavior = this._behavior();
        if (behavior === "none") {
            // 纯消费：stopPropagation 已完成，不呈现（外层不应越级呈现内层已认领的错误）
            this._current = { error, behavior, triggerEl, retryLoad };
            return;
        }
        if (behavior === "addErrorClass") {
            const cls = this._staticOption("errorClass") ?? DEFAULT_ERROR_CLASS;
            this.el?.classList.add(cls);
            this._current = { error, behavior, errorClass: cls, triggerEl, retryLoad };
            return;
        }
        this._mountOverlay(error, detail, triggerEl, retryLoad);
    }

    /**
     * 清除当前呈现（close 回调 / 新错误替换 / retry resolved / unmounted 共用）：
     * overlay 态 = 销毁块 scope + 回收 $scopes[id] + 移除 DOM（重建式，非 display 隐藏）；
     * addErrorClass 态 = 移除错误 class。
     */
    clear(): void {
        const cur = this._current;
        if (!cur) return;
        this._current = null;
        if (cur.errorClass) this.el?.classList.remove(cur.errorClass);
        if (cur.overlayScope) {
            const id = cur.overlayScope.id;
            cur.overlayScope.destroy();
            const scopes = (this.engine.store.state as Record<string, any>)[SCOPES_KEY] as
                | Record<string, any>
                | undefined;
            if (scopes) delete scopes[id];
        }
        if (cur.overlay) cur.overlay.remove();
    }

    /** behavior 读取（静态字面量；非法值 warn 回退 overlay） */
    private _behavior(): ErrorBehavior {
        const v = this._staticOption("behavior") ?? "overlay";
        if (typeof v === "string" && (BEHAVIORS as readonly string[]).includes(v)) {
            return v as ErrorBehavior;
        }
        this.warn(`x-error: behavior 非法值 ${JSON.stringify(v)}，回退 "overlay"`);
        return "overlay";
    }

    /**
     * 构建并挂载错误覆盖层（决策 5，x-loading mountOverlay 同款路径）：
     * 组件解析链 options.overlay > 指令值简写 > autospark.error → 深克隆 → compileChild
     * 编译（parentScope = 宿主 scope 继承数据上下文；data 经 initialData 在 compile 前注入）→
     * 壳样式（absolute+inset:0，目标须 relative）→ 挂到 overlayAt 目标 → data-action 点击委托。
     */
    private _mountOverlay(
        error: NormalizedError,
        detail: Record<string, any>,
        triggerEl?: HTMLElement,
        retryLoad?: () => Promise<unknown>,
    ): void {
        const host = this.el;
        if (!host) return;
        // closeable/retryable/actions/props 双通道合并（决策 7：事件层优先于静态层）
        const closeable = detail.closeable ?? this._staticOption("closeable") ?? true;
        let retryable =
            detail.retryable ??
            this._staticOption("retryable") ??
            (error.source === "action" || error.source === "load");
        if (retryable && error.source !== "action" && error.source !== "load") {
            // raise 源无源可重（决策 7）：显式 retryable:true 也不渲染重试按钮
            this.warn(`x-error: 非 action/load 源错误无源可重，重试按钮不渲染（retryable 被忽略）`);
            retryable = false;
        }
        const rawActions = detail.actions ?? this._exprValues.actions;
        const props = { ...this._exprValues.props, ...detail.props };

        // 组件解析链：options.overlay > 指令值简写 > 内置默认
        const name =
            this._staticOption("overlay") ??
            (typeof this.value === "string" && this.value.trim() !== "" ? this.value.trim() : null) ??
            ERROR_COMPONENT_NAME;
        let snapshot = this.engine.getComponentDeclaration(name, host);
        if (!snapshot) {
            if (name !== ERROR_COMPONENT_NAME) {
                this.warn(`x-error: 错误组件 "${name}" 未找到，回退 ${ERROR_COMPONENT_NAME}`);
                snapshot = this.engine.getComponentDeclaration(ERROR_COMPONENT_NAME, host);
            }
            if (!snapshot) return; // 内置默认也缺失（理论不可达）：不呈现
        }
        const clone = snapshot.cloneNode(true) as HTMLElement;

        // data 注入契约（决策 5）：保留键指令独占 + props 合并（同名 warn 忽略）。
        // 注意 close/retry **不经 data 注入**——函数值进响应式 data 域会被代理当 computed
        // 求值吞掉（读取即执行、返回 undefined）；改经 scope.actions 通道（见下方注入），
        // 模板 `@click="close()"` 走 x-on action 解析直调，零 DOM 事件往返。
        const initialData: Record<string, any> = {
            error,
            message: error.message,
            closeable,
            retryable,
            actions: this._actionsData(rawActions),
        };
        for (const [k, v] of Object.entries(props ?? {})) {
            if ((RESERVED_DATA_KEYS as readonly string[]).includes(k)) {
                this.warn(`x-error: props 键 "${k}" 为保留键，已忽略`);
                continue;
            }
            initialData[k] = v;
        }

        const parentScope = this.engine.findScopeByEl(host) ?? null;
        const compiled = this.engine.compiler.compileChild(clone, parentScope, {}, undefined, initialData);
        // close/retry 注入块 scope 的 actions 通道（覆盖同名内置——错误组件子树内 close 即
        // 「关闭这个错误呈现」的就近语义；click 时 x-on 惰性解析，compile 后注入即可生效）
        compiled.scope.actions = {
            close: { id: "close", title: "关闭", handle: () => this.clear() } as any,
            retry: { id: "retry", title: "重试", handle: () => this._retry() } as any,
        };
        const overlay = compiled.el;

        // 壳样式（决策 4）：absolute+inset:0 撑满目标（目标须 relative，文档注明）
        overlay.style.position = "absolute";
        overlay.style.inset = "0";
        overlay.style.zIndex = "9999";

        // 挂载目标：overlayAt 相对查询（未命中/非法回退宿主）
        const at = this._staticOption("overlayAt");
        const target = at ? queryRelElement(host, at) : host;
        (target instanceof HTMLElement ? target : host).appendChild(overlay);

        // actions 按钮 data-action 点击委托（ADR-0038 同款；监听器随元素生死）
        overlay.addEventListener("click", (e) => this._onOverlayClick(e, compiled.scope));

        this._current = {
            error,
            behavior: "overlay",
            overlay,
            overlayScope: compiled.scope,
            triggerEl,
            retryLoad,
        };
    }

    /**
     * 解析动作按钮数据视图 `[{name, title, icon?}]`（决策 7）：
     * string 经 getAction 链解析（宿主 scope 链就近 + 全局兜底）；ActionDesc 对象取
     * `name`/`title ?? name`/`icon`；非法元素 warn 剪枝。
     */
    private _actionsData(raw: unknown): Array<{ name: string; title: string; icon?: string }> {
        if (raw === undefined || raw === null) return [];
        if (!Array.isArray(raw)) {
            this.warn(`x-error: actions 须为数组，已忽略`);
            return [];
        }
        const scope = this.el ? this.engine.findScopeByEl(this.el) : null;
        const out: Array<{ name: string; title: string; icon?: string }> = [];
        for (const a of raw) {
            if (typeof a === "string" && a.trim() !== "") {
                const desc = scope?.getAction(a) ?? this.engine.actions[a];
                out.push({ name: a, title: desc?.title ?? a, icon: desc?.icon });
            } else if (a && typeof a === "object" && typeof a.name === "string" && a.name !== "") {
                out.push({ name: a.name, title: a.title ?? a.name, icon: a.icon });
            } else {
                this.warn(`x-error: actions 元素须为非空字符串或含 name 的对象，已剪枝: ${JSON.stringify(a)}`);
            }
        }
        return out;
    }

    /**
     * retry 语义（决策 7）：action 源以**原 args** 重调失败 action；load 源执行
     * `detail.retry`（= loader.refresh()）——resolved → 自动清除呈现；rejected →
     * 桥接/派发的新 error 事件经单错误槽自然更新呈现（此处无需处理）。
     */
    private _retry(): void {
        const cur = this._current;
        if (!cur) return;
        if (cur.error.source === "load" && cur.retryLoad) {
            try {
                const result = cur.retryLoad();
                if (result && typeof result.then === "function") {
                    result.then(
                        () => {
                            // 守卫：重试失败时新错误已 dispatchLoadError 替换单错误槽
                            // （_current !== cur），不可清掉新呈现；仅当前呈现仍是原错误才清除
                            if (this._current === cur) this.clear();
                        },
                        () => {
                            /* rejected：新 error 事件经单错误槽自然更新呈现 */
                        },
                    );
                } else {
                    this.clear();
                }
            } catch {
                /* 同步抛错：呈现将自然更新 */
            }
            return;
        }
        if (cur.error.source !== "action" || !cur.error.action) return;
        const { action, args } = cur.error;
        const scope = (cur.triggerEl ? this.engine.findScopeByEl(cur.triggerEl) : null) ?? null;
        const ctx: AutoSparkActionContext = {
            el: cur.triggerEl ?? this.el!,
            $event: null as any, // retry 非事件触发（无原生事件对象）
            data: scope?.getContext(),
            scope: scope as AutoSparkScope,
            store: this.engine.store,
            globalState: this.engine.store.state,
            engine: this.engine,
            $options: {},
        } as AutoSparkActionContext;
        try {
            const result = action.handle.apply(ctx, args ?? []);
            if (result && typeof result.then === "function") {
                (result as Promise<any>).then(
                    () => this.clear(),
                    () => {
                        /* rejected：桥接的新 error 事件经单错误槽自然更新呈现 */
                    },
                );
            } else {
                this.clear();
            }
        } catch {
            /* 同步抛错：桥接已派发新 error 事件，呈现将自然更新 */
        }
    }

    /**
     * 取未注册 id 的合成透传 descriptor（ADR-0038 决策 4）：`{id, title:id, handle:(p)=>p}`
     * 经 buildAction 包装（总线 + DOM 双发），按 id 缓存复用。
     */
    private _syntheticAction(id: string): AutoSparkAction {
        let desc = this._synthetics.get(id);
        if (!desc) {
            desc = buildAction((type, payload) => this.engine.emit(type as any, payload), {
                handle: (payload?: any) => payload,
                id,
            });
            this._synthetics.set(id, desc);
        }
        return desc;
    }

    /**
     * 覆盖层级 click 委托（ADR-0038 决策 3 同款）：块内任意 `data-action="<name>"` 元素点击
     * 即触发——已注册走真 action（getAction 链），未注册走合成透传 descriptor，均以标准
     * AutoSparkActionContext 调用 → buildAction 双通道广播。点击后**不自动清除**——错误呈现
     * 的生命周期归 close / retry / 新错误替换（需要关闭在 actions 里放 "close" 由用户 UI 自行处理）。
     */
    private _onOverlayClick(event: Event, scope: AutoSparkScope): void {
        const target = (event.target as HTMLElement | null)?.closest?.(
            "[data-action]",
        ) as HTMLElement | null;
        if (!target || !this._current?.overlay?.contains(target)) return;
        const name = target.getAttribute("data-action");
        if (!name) return;
        const desc = scope.getAction(name) ?? this.engine.actions[name] ?? this._syntheticAction(name);
        const ctx: AutoSparkActionContext = {
            el: target,
            $event: event,
            data: scope.getContext(),
            scope,
            store: this.engine.store,
            globalState: this.engine.store.state,
            engine: this.engine,
            $options: {},
        };
        try {
            desc.handle.call(ctx);
        } catch {
            /* buildAction 已广播 rejected 并 rethrow；此处吞防委托监听器 uncaught（x-loading 同款对齐） */
        }
    }
}
