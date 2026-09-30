import type { AutoSpark } from "../engine";
import { SCOPES_KEY } from "../engine";
import { resolveAnimate, type PhaseAnim } from "../animate";
import type { AutoSparkScope } from "../scope";
import type { ComponentDef } from "../directives/component-def";
import { getMessageColumn, getMessageContainer, MESSAGE_COLUMN_ATTR, removeMessageContainer } from "./container";
import { MESSAGE_COLUMN_GAP } from "./styles";
import { resolveBuiltinRenderByKind } from "./renders";
import { readLocalMessages, RemotePersistController, writeLocalMessages } from "./storage";
import {
    formatMessageSize,
    parseMessageProps,
    serializeMessage,
    MESSAGE_DEFAULTS,
    MESSAGE_POS,
    MESSAGE_RESERVED_KEYS,
    MESSAGE_TYPES,
    MESSAGE_TYPE_ICONS,
    type MessageActionItem,
    type MessageOptions,
    type MessagePersist,
    type MessagePos,
    type MessageProps,
    type MessageTask,
    type MessageType,
    type ProgressTask,
    type ResolvedMessageAction,
} from "./types";

/**
 * MessageManager：全局消息引擎级子系统（ADR-0071 决策 1）。
 *
 * 三层结构（机制沿 ADR-0068 决策 2）：本管理器（记录 / 队列 / 生命周期 / 原地更新 / 持久化）
 * > 分区列（引擎结构，container.ts）> 单项卡片 = 内置私有组件实例（message-shell / task-shell，
 * `instantiateDetachedComponent` 管道，真响应式活体）。
 *
 * - **Map 语义**（决策 10）：继承 `Map<string, MessageTask>`，键恒为 string id（缺省自动生成）；
 *   可枚举范围 = 全部存活记录（展示中 + 已隐藏）；`delete(id)` 覆写为**硬移除**（无动画，persist
 *   记录一并删）；`clear()` 覆写为清全部存活记录（含隐藏，默认带动画）；`dispose()` destroy 收口。
 * - **记录 ⇄ 展示两态分离**（决策 5）：`persist` 控制记录存续——`'none'`（默认）关闭即移除
 *   （toast 兼容语义）；`'local'/'remote'` 关闭转「已隐藏」态仍可枚举、`show(id)` 可重显。
 * - **按 pos 分区 FIFO 队列**（沿 ADR-0068 决策 8）：每列独立上限 `showCount`（默认 5），
 *   满员排队、append 列尾、自动关闭后按序补位；离场收拢（margin-bottom 抵消 gap，兄弟零跳变）。
 * - **生命周期**：`delayClose` 默认 3000、`0` = sticky；hover 暂停/移出恢复（剩余时间制）；
 *   `engine.stop()` 不感知（无锚非树内），`dispose()`（destroy 调用）全部立即销毁 + 容器移除
 *   + 持久化 flush（keepalive 兜底）。
 * - **原地更新**（决策 7）：同 id 重复 add = 换展示 props（scope.data 响应式赋值）+ 显示中重置
 *   计时；不重播动画；pos / offset 忽略（不迁移列）。记录级字段走 `update(id, patch)`（决策 8，
 *   唯一写通道——task 上 read/status/result 为只读 getter）。
 * - **actions value 闭环**（决策 13）：点击 = 置已读 → 写 result → 发 `message:action` →
 *   handle → hide 判定；confirm（决策 11）= value-only actions 糖，Promise resolve choice value。
 * - **anchor 三职**（决策 14）：局部 action 解析根（字符串沿 scope 链解析）+ 事件派发根
 *   （`message:action` 以 anchor 额外派发）+ 渲染数据视图基准（render 组件挂链 anchor scope，
 *   无 anchor rootless）。
 * - **渲染插槽**（决策 16 四级）：`kinds[kind].render` → `options.messages.shell` → 内置注册表
 *   （task → task-shell）→ message-shell 兜底；props 全量数据域整包注入（剥函数）。
 * - **持久化**（决策 17/18 方案 A）：`persist: 'local'`（localStorage 同步全量写）/ `'remote'`
 *   （POST url 防抖 500ms 全量）；`load()` GET 拉取只入记录不弹；`save()` 立即 flush；
 *   序列化剥函数与运行态，恢复不自动重弹。
 * - **事件族**（决策 20）：`message:add/update/show/hide/read/status/action` 双通道（总线 +
 *   卡片元素）；kind='toast' 迁移期双发 `toast:show` / `toast:hide`。
 * - **全关语义**（决策 15）：`options.messages: false` 构造即短路（不建容器、不注样式），
 *   一切入口 warn + no-op。
 */

/** kinds 层不允许出现的 manager 级键（出现 warn + 忽略，决策 15） */
const MANAGER_LEVEL_KEYS: ReadonlySet<string> = new Set([
    "showCount",
    "maxLen",
    "url",
    "headers",
    "icons",
    "shell",
    "kinds",
]);

/** 单条消息的运行时 entry（task 句柄的闭包背后态） */
interface MessageEntry {
    id: string;
    kind: string;
    /** 合并链后的生效配置（原地更新时整引用换新） */
    props: MessageProps;
    /** 预解析图标名 */
    icon: string;
    /** 预解析按钮表 */
    actions: ResolvedMessageAction[];
    /** 进度值（task 域，0~100） */
    progress: number;
    /** task 是否已完成（完成态进入 delayClose 倒计时） */
    completed: boolean;
    /** task 是否已 start（闸门前置） */
    started: boolean;
    /** task 闸门：pause 后 progress 调用被忽略 */
    paused: boolean;
    /** 生命周期状态：queued → shown → closed（persist none 移除 / local·remote 转隐藏） */
    state: "queued" | "shown" | "hidden" | "closed";
    /** render 实例 scope（anchor 挂链或 rootless；teardown 统一收口） */
    scope: AutoSparkScope | null;
    /** 卡片根元素（排队未挂 / 已摘除为 null） */
    el: HTMLElement | null;
    /** 解析后的 anchor 元素（三职合一，决策 14） */
    anchor: HTMLElement | null;
    task: MessageTaskImpl;
    /** confirm 的 Promise resolve（choice 点击时调用后置空） */
    confirmResolve: ((value: any) => void) | null;
    /** 自动关闭计时器（sticky / task 进行中恒 null） */
    timer: ReturnType<typeof setTimeout> | null;
    /** 满额计时的到期时刻（hover 暂停换算剩余时间用） */
    deadline: number | null;
    /** hover 暂停时的剩余 ms（null = 未暂停） */
    pausedRemaining: number | null;
    /** 离场相配置（mount 时解析缓存） */
    leave: PhaseAnim | null;
    /** 卡片根委托监听（teardown 解绑） */
    clickHandler: ((e: Event) => void) | null;
    enterHandler: (() => void) | null;
    leaveHandler: (() => void) | null;
    /** 已应用的附加类名（原地更新换装用） */
    appliedClassName: string;
    /** 创建时间戳（maxLen FIFO 淘汰序） */
    createdAt: number;
}

/** 任务句柄的可变实现形态（对外只暴露 MessageTask / ProgressTask 只读面） */
interface MessageTaskImpl {
    id: string;
    kind: string;
    readonly el: HTMLElement | null;
    hide(): void;
    readonly closed: boolean;
    readonly read: boolean;
    readonly status: number | string | undefined;
    readonly result: any;
    start(): void;
    progress(n: number): void;
    pause(): void;
    resume(): void;
    stop(): void;
    cancel(): void;
    _entry: MessageEntry | null;
    _cancelled: boolean;
}

/** add 的内部挂钩（confirm 经 onChoice 捕获 choice 应答） */
interface AddHooks {
    onChoice?: (value: any) => void;
}

/**
 * ToastManager → MessageManager（ADR-0071）：服务挂 engine 实例（`engine.messages`）。
 * 多引擎独立 manager / 容器 / 队列 / 持久化，跨引擎不去重不共享。
 */
export class MessageManager extends Map<string, MessageTaskImpl> {
    readonly engine: AutoSpark<any>;
    /** 特性开关（options.messages !== false）；false 时构造即短路 */
    readonly enabled: boolean;

    /** 全局默认配置（options.messages 配置对象；缺省空对象走 MESSAGE_DEFAULTS） */
    private _globalOptions: MessageOptions;

    /** 自动 id 计数器 */
    private _autoId = 0;
    /** 等待队列（按 pos 分区）：满员 FIFO，自动关闭后按序补位 */
    private _queues = new Map<MessagePos, MessageEntry[]>();
    /** remote 持久化控制器（url 配置时创建） */
    private _remote: RemotePersistController | null = null;

    constructor(engine: AutoSpark<any>) {
        super();
        this.engine = engine;
        const cfg = (engine.options as any).messages;
        this.enabled = cfg !== false;
        this._globalOptions = cfg === false || cfg == null ? {} : cfg;
        if (this.enabled && this._globalOptions.url) {
            this._remote = new RemotePersistController(
                this._globalOptions.url,
                this._globalOptions.headers,
                (m) => this.engine.logger.warn(m),
            );
        }
        // local 持久化的启动恢复（决策 18）：构造期读 localStorage——只入枚举（隐藏态）、
        // 不自动重弹（需要时 show(id)）；脏数据 warn + 剪除（readLocalMessages 守卫）
        if (this.enabled) {
            this._restoreRecords(readLocalMessages((m) => this.engine.logger.warn(m)));
        }
    }

    // ── 显示入口（ADR-0071 决策 7：三态入参） ─────────────────────────

    /**
     * 添加一条消息（字符串简写 ≡ `{ title }`；async factory resolve `undefined`/`void` →
     * 静默跳过，挂起期 `task.hide()` = 取消）。同 id = 原地更新（决策 7）。
     * `options.messages: false` 时 warn + 死句柄（全关语义）。
     */
    add(
        input: string | MessageProps | (() => Promise<MessageProps | void | undefined>),
        hooks?: AddHooks,
    ): MessageTask {
        if (!this.enabled) {
            this.engine.logger.warn(
                "engine.messages: 消息特性已通过 options.messages: false 关闭，调用被忽略",
            );
            return DEAD_TASK;
        }
        if (typeof input === "function") return this._addAsync(input, hooks);
        const parsed = parseMessageProps(input, (m) => this.engine.logger.warn(m));
        if (!parsed) return DEAD_TASK;
        return this._enqueue(parsed, undefined, hooks);
    }

    /** async factory 形态：同步返回挂起句柄，resolve 后入队（undefined → 静默跳过） */
    private _addAsync(factory: () => Promise<MessageProps | void | undefined>, hooks?: AddHooks): MessageTask {
        const task = this._createTask();
        factory()
            .then((props) => {
                if (task._cancelled) return; // 挂起期 hide() = 取消
                if (props == null) {
                    task._cancelled = true; // 条件通知：内容就绪才弹，静默跳过
                    return;
                }
                const parsed =
                    parseMessageProps(
                        typeof props === "string" ? props : (props as MessageProps),
                        (m) => this.engine.logger.warn(m),
                    ) ?? null;
                if (!parsed || !String((parsed as MessageProps).title ?? "").trim()) {
                    this.engine.logger.warn("engine.messages: factory 结果缺少 title（空消息），已跳过");
                    task._cancelled = true;
                    return;
                }
                this._enqueue(parsed as MessageProps, task, hooks);
            })
            .catch((e: any) => {
                this.engine.logger.warn(`engine.messages: factory 执行失败，已跳过: ${e?.message ?? e}`);
                task._cancelled = true;
            });
        return task;
    }

    /** 入队 / 原地更新（同 id）唯一入口：合并链 → 校验 → 已存在则更新，否则创建 entry 排队 */
    private _enqueue(userProps: MessageProps, reuseTask?: MessageTaskImpl, hooks?: AddHooks): MessageTask {
        // 空 title no-op（含字符串简写形态；factory 路径已先行校验）
        if (!String(userProps.title ?? "").trim()) {
            this.engine.logger.warn("engine.messages: title 为空，调用被忽略");
            if (reuseTask) reuseTask._cancelled = true;
            return DEAD_TASK;
        }
        // 合并链（决策 15）：内置默认 < options.messages < kinds[kind] < 单次 props。
        // `id` 仅单次层生效。
        const { merged, kind } = this._mergeProps(userProps);
        // 枚举校验：非法值 warn + 回退
        if (!MESSAGE_POS.has(merged.pos)) {
            this.engine.logger.warn(`engine.messages: 未知 pos "${merged.pos}"，已回退 "${MESSAGE_DEFAULTS.pos}"`);
            merged.pos = MESSAGE_DEFAULTS.pos;
        }
        if (!MESSAGE_TYPES.has(merged.type)) {
            this.engine.logger.warn(`engine.messages: 未知 type "${merged.type}"，已回退 "none"`);
            merged.type = "none";
        }
        if (merged.persist != null && !["none", "local", "remote"].includes(merged.persist)) {
            this.engine.logger.warn(`engine.messages: 未知 persist "${merged.persist}"，已回退 "none"`);
            merged.persist = "none";
        }
        const id = merged.id != null && merged.id !== "" ? String(merged.id) : `message-${++this._autoId}`;

        // 同 id 处理（决策 5/7）：queued/shown → 原地更新；hidden（persist 存续记录）→ 更新 + 重显
        const existing = super.get(id);
        if (existing) {
            const entry = existing._entry;
            if (entry && (entry.state === "shown" || entry.state === "queued")) {
                this._updateInPlace(entry, userProps);
                if (hooks?.onChoice) entry.confirmResolve = hooks.onChoice;
                return existing;
            }
            if (entry && (entry.state === "hidden" || entry.state === "closed")) {
                // 已隐藏 / 离场动画中：换新配置后重新走展示管线（记录复用）
                const fresh = this._mergeProps(userProps).merged;
                fresh.id = id;
                this._applyEntryConfig(entry, fresh);
                entry.state = "queued";
                this._displayEntry(entry);
                if (hooks?.onChoice) entry.confirmResolve = hooks.onChoice;
                this._schedulePersist();
                return existing;
            }
        }

        const anchor = this._resolveAnchor(merged.anchor);
        const entry: MessageEntry = {
            id,
            kind,
            props: merged as MessageProps,
            icon: this._resolveIcon(merged.type as MessageType, merged.icon),
            actions: this._resolveActions(merged.actions, anchor),
            progress: kind === "task" ? clampProgress(merged.progress) : 0,
            completed: false,
            started: false,
            paused: false,
            state: "queued",
            scope: null,
            el: null,
            anchor,
            task: reuseTask ?? this._createTask(),
            confirmResolve: hooks?.onChoice ?? null,
            timer: null,
            deadline: null,
            pausedRemaining: null,
            leave: null,
            clickHandler: null,
            enterHandler: null,
            leaveHandler: null,
            appliedClassName: "",
            createdAt: Date.now(),
        };
        const task = entry.task;
        task.id = id;
        task.kind = kind;
        task._entry = entry;
        super.set(id, task);
        this._emit("message:add", entry);

        // maxLen 淘汰（决策 6）：存活记录超限 FIFO 丢最旧（不豁免未读 / 展示中）
        this._evictOverflow(entry);

        // 容量判定（按 pos 分区各计）：有坑即显示，满员排队
        this._displayEntry(entry);
        this._schedulePersist();
        return task;
    }

    /** 四层合并链（决策 15）：内置默认 < options.messages < kinds[kind] < 单次 props */
    private _mergeProps(userProps: MessageProps): { merged: Record<string, any>; kind: string } {
        const kind = String(userProps.kind ?? (this._globalOptions as any).kind ?? "toast");
        const kindOptions = this._globalOptions.kinds?.[kind];
        // kinds 值只允许消息级键：manager 级键 warn + 忽略（决策 15）
        if (kindOptions) {
            for (const key of Object.keys(kindOptions)) {
                if (MANAGER_LEVEL_KEYS.has(key)) {
                    this.engine.logger.warn(
                        `engine.messages: kinds.${kind} 不允许管理器级键 "${key}"，已忽略`,
                    );
                }
            }
        }
        const merged: Record<string, any> = { ...MESSAGE_DEFAULTS };
        for (const key of MESSAGE_RESERVED_KEYS) {
            // id 仅单次层生效（全局默认 / kinds 携带 id 会让所有消息互并成一条）——单次 props 的 id 照常并入
            if (key !== "id" && key in this._globalOptions) merged[key] = (this._globalOptions as any)[key];
            if (key !== "id" && kindOptions && key in kindOptions) merged[key] = (kindOptions as any)[key];
            if (key in userProps) merged[key] = (userProps as any)[key];
        }
        // progress 为 kind='task' 专属键（决策 12）：其他 kind 携带 → warn + 忽略
        if (kind !== "task" && "progress" in userProps) {
            this.engine.logger.warn(
                "engine.messages: progress 是 kind='task' 专属键（非通用功能），其他 kind 携带已忽略",
            );
            delete merged.progress;
        }
        return { merged, kind };
    }

    /** 同屏上限（管理器级键，不进合并链） */
    private get _showCount(): number {
        const n = this._globalOptions.showCount ?? MESSAGE_DEFAULTS.showCount;
        return typeof n === "number" && n > 0 ? Math.floor(n) : MESSAGE_DEFAULTS.showCount;
    }

    /** 存活记录数上限（0 = 不限；构造期固化，决策 6） */
    private get _maxLen(): number {
        const n = this._globalOptions.maxLen;
        return typeof n === "number" && n > 0 ? Math.floor(n) : 0;
    }

    /** type → 图标名：显式 icon > icons 重映射 > 同名词默认；none 无图标 */
    private _resolveIcon(type: MessageType, explicit?: string): string {
        if (type === "none" && !explicit) return "";
        if (explicit) return explicit;
        if (type === "none") return "";
        return this._globalOptions.icons?.[type] ?? MESSAGE_TYPE_ICONS[type] ?? type;
    }

    /** anchor 归一化（决策 14）：string = add 时一次性 querySelector，未命中 warn + null */
    private _resolveAnchor(anchor: MessageProps["anchor"]): HTMLElement | null {
        if (anchor == null) return null;
        if (anchor instanceof HTMLElement) return anchor;
        if (typeof anchor === "string") {
            const el = typeof document !== "undefined" ? document.querySelector(anchor) : null;
            if (!el) {
                this.engine.logger.warn(`engine.messages: anchor 选择器 "${anchor}" 未命中，按无 anchor 处理`);
                return null;
            }
            return el as HTMLElement;
        }
        return null;
    }

    /**
     * actions 预解析（决策 13/14）：字符串查 action 表——有 anchor 时沿其 scope 链解析局部
     * action（决策 14 职责①），未命中回退全局表；全局也未命中 warn + 剪枝。对象形态解析
     * `value` / `handle` / `hide` 键。
     */
    private _resolveActions(items: MessageActionItem[] | undefined, anchor: HTMLElement | null): ResolvedMessageAction[] {
        const resolved: ResolvedMessageAction[] = [];
        for (const item of items ?? []) {
            if (typeof item === "string") {
                const desc = this._resolveActionByName(item, anchor);
                if (!desc) {
                    this.engine.logger.warn(
                        `engine.messages: action "${item}" 未命中（全局表${anchor ? "与 anchor scope 链" : ""}），按钮已剪枝`,
                    );
                    continue;
                }
                resolved.push({
                    title: (desc.title as string) ?? item,
                    handle: desc.handle,
                    hide: (desc as any).hide !== false,
                    hasValue: false,
                    value: undefined,
                });
            } else if (item && typeof item === "object") {
                const hasValue = "value" in item;
                resolved.push({
                    title: (item as any).title ?? "action",
                    handle: typeof (item as any).handle === "function" ? (item as any).handle : null,
                    hide: (item as any).hide !== false,
                    hasValue,
                    value: (item as any).value,
                });
            } else {
                this.engine.logger.warn("engine.messages: 非法 action 项，已剪枝");
            }
        }
        return resolved;
    }

    /** 字符串 action 解析：anchor 存在时沿其向上 scope 链逐级现查，未命中回退全局表 */
    private _resolveActionByName(name: string, anchor: HTMLElement | null) {
        if (anchor) {
            let el: HTMLElement | null = anchor;
            while (el) {
                const scope = this.engine.findScopeByEl(el);
                const desc = scope?.getAction(name);
                if (desc) return desc;
                el = el.parentElement;
            }
        }
        return this.engine.actions[name];
    }

    // ── 渲染（决策 16 四级查找 + anchor 数据视图挂链） ─────────────────

    /**
     * render 解析（决策 16）：`kinds[kind].render`（用户 kind 级）→ `options.messages.shell`
     * （用户全局兜底）→ 内置注册表按 kind → message-shell 兜底。用户组件名走全局组件表查找，
     * 未命中 warn + 顺位回退。
     */
    private _resolveRender(kind: string): { snapshot: HTMLElement; def: ComponentDef | null } {
        const tryCustom = (name: string, source: string) => {
            const snapshot = this.engine._resolveGlobalComponent(name);
            if (snapshot) {
                const def =
                    this.engine.getComponentDef(snapshot) ??
                    this.engine.getGlobalComponentDef(name) ??
                    null;
                return { snapshot, def };
            }
            this.engine.logger.warn(
                `engine.messages: 自定义 render "${name}"（${source}）未在全局组件表命中，按查找协议顺位回退`,
            );
            return null;
        };
        const renderName = this._globalOptions.kinds?.[kind]?.render?.trim() ?? "";
        if (renderName !== "") {
            const hit = tryCustom(renderName, `kinds.${kind}.render`);
            if (hit) return hit;
        }
        const shellName = this._globalOptions.shell?.trim() ?? "";
        if (shellName !== "") {
            const hit = tryCustom(shellName, "options.messages.shell");
            if (hit) return hit;
        }
        return resolveBuiltinRenderByKind(kind);
    }

    /** anchor 数据视图（决策 14 职责③）：自 anchor 向上找最近 scope 作 render 实例父挂链 */
    private _anchorScope(anchor: HTMLElement | null): AutoSparkScope | null {
        if (!anchor) return null;
        let el: HTMLElement | null = anchor;
        while (el) {
            const scope = this.engine.findScopeByEl(el);
            if (scope) return scope;
            el = el.parentElement;
        }
        return null;
    }

    /** 注入 props（决策 16：消息记录全量数据域整包，剥函数） */
    private _buildInjectProps(entry: MessageEntry): Record<string, any> {
        return {
            id: entry.id,
            kind: entry.kind,
            type: entry.props.type,
            title: entry.props.title ?? "",
            body: entry.props.body ?? "",
            icon: entry.icon,
            actions: entry.actions,
            closable: entry.props.closable === true,
            href: entry.props.href ?? "",
            read: entry.props.read === true,
            status: entry.props.status,
            result: entry.props.result,
            progress: entry.kind === "task" ? entry.progress : undefined,
            delayClose: entry.props.delayClose,
        };
    }

    /** 容量判定与挂载入口：有坑即 mount，满员 FIFO 排队 */
    private _displayEntry(entry: MessageEntry): void {
        const column = getMessageColumn(this.engine, entry.props.pos as MessagePos, entry.props.offset);
        if (!column) return; // SSR / 无 body：保持 queued（文档不承诺 SSR 显示）
        if (column.childElementCount < this._showCount) {
            this._mount(entry, column);
        } else {
            const queue = this._queues.get(entry.props.pos as MessagePos) ?? [];
            queue.push(entry);
            this._queues.set(entry.props.pos as MessagePos, queue);
        }
    }

    /** 挂载卡片（容量已判定）：render 实例化 → pos 标记 → 委托监听 → enter 动画 → 计时 → 广播 */
    private _mount(entry: MessageEntry, column: HTMLElement): void {
        const render = this._resolveRender(entry.kind);
        const clone = render.snapshot.cloneNode(true) as HTMLElement;
        // anchor 数据视图（决策 14 职责③）：有 anchor 挂链其 scope，无 anchor rootless
        const parentScope = this._anchorScope(entry.anchor);
        const compiled = this.engine.compiler.instantiateDetachedComponent(
            clone,
            parentScope,
            render.def,
            this._buildInjectProps(entry),
        );
        entry.scope = compiled.scope;
        entry.el = compiled.el;
        entry.task.el = compiled.el;
        // slide 方向覆写层依赖（样式表按 data-message-pos 前缀/后缀分派 from 值）
        compiled.el.setAttribute(MESSAGE_COLUMN_ATTR, entry.props.pos as string);
        if (entry.props.className) {
            compiled.el.classList.add(...String(entry.props.className).trim().split(/\s+/));
            entry.appliedClassName = String(entry.props.className);
        }
        // 行为委托：点击（actions + 关闭钮 + 任意点击置已读）与 hover 暂停，监听挂卡片根
        entry.clickHandler = (e: Event) => this._onCardClick(entry, e);
        entry.enterHandler = () => this._pauseTimer(entry);
        entry.leaveHandler = () => this._resumeTimer(entry);
        compiled.el.addEventListener("click", entry.clickHandler);
        compiled.el.addEventListener("mouseenter", entry.enterHandler);
        compiled.el.addEventListener("mouseleave", entry.leaveHandler);

        column.appendChild(compiled.el); // append 列尾（先来在上）

        const resolved = resolveAnimate(entry.props.animate);
        entry.leave = resolved.leave;
        this.engine.animate.enter(compiled.el, resolved.enter);
        entry.state = "shown";
        this._startTimer(entry);
        this._emit("message:show", entry);
    }

    /** 卡片点击委托：任意点击置已读（决策 11）→ action 按钮（value 闭环）→ 关闭钮 */
    private _onCardClick(entry: MessageEntry, e: Event): void {
        this._setRead(entry);
        const target = e.target as Element | null;
        const actionBtn = target?.closest?.(".autospark-message-action") as HTMLElement | null;
        if (actionBtn) {
            const index = Number(actionBtn.getAttribute("data-message-action"));
            const action = entry.actions[Number.isInteger(index) ? index : -1];
            if (action) {
                // 决策 13 闭环：value 写 result → message:action → confirm resolve → handle → hide
                if (action.hasValue) {
                    entry.props.result = action.value;
                    this._syncData(entry);
                }
                this._emit("message:action", entry, {
                    action: { title: action.title, hide: action.hide },
                    value: action.hasValue ? action.value : undefined,
                });
                if (entry.confirmResolve) {
                    entry.confirmResolve(action.hasValue ? action.value : undefined);
                    entry.confirmResolve = null;
                }
                action.handle?.();
                this._schedulePersist();
                if (action.hide) this._dismiss(entry, true);
            }
            return;
        }
        if (target?.closest?.(".autospark-message-close")) {
            this._dismiss(entry, true);
        }
    }

    // ── delayClose 计时与 hover 暂停（剩余时间制） ─────────────────────

    /** 启动自动关闭计时（task 进行中不计时——完成态才进入 delayClose 倒计时） */
    private _startTimer(entry: MessageEntry): void {
        this._clearTimer(entry);
        if (entry.kind === "task" && !entry.completed) return; // 进行中 sticky
        const delay = entry.props.delayClose;
        if (typeof delay === "number" && delay > 0) {
            entry.deadline = Date.now() + delay;
            entry.pausedRemaining = null;
            entry.timer = setTimeout(() => {
                entry.timer = null;
                this._dismiss(entry, true);
            }, delay);
        } else {
            entry.deadline = null; // sticky
        }
    }

    /** hover 暂停：记剩余时间、停表（sticky 无表，no-op） */
    private _pauseTimer(entry: MessageEntry): void {
        if (entry.timer == null || entry.deadline == null) return;
        clearTimeout(entry.timer);
        entry.timer = null;
        entry.pausedRemaining = Math.max(0, entry.deadline - Date.now());
    }

    /** hover 移出恢复：按剩余时间续表 */
    private _resumeTimer(entry: MessageEntry): void {
        if (entry.pausedRemaining == null || entry.state !== "shown") return;
        const remaining = entry.pausedRemaining;
        entry.pausedRemaining = null;
        entry.deadline = Date.now() + remaining;
        entry.timer = setTimeout(() => {
            entry.timer = null;
            this._dismiss(entry, true);
        }, remaining);
    }

    private _clearTimer(entry: MessageEntry): void {
        if (entry.timer != null) {
            clearTimeout(entry.timer);
            entry.timer = null;
        }
        entry.pausedRemaining = null;
    }

    // ── 原地更新（决策 7）与记录级写通道（决策 8） ─────────────────────

    /** 同 id 重复 add：以 entry 当前生效配置为基准、userProps 显式键打补丁；重置计时、不重播动画 */
    private _updateInPlace(entry: MessageEntry, userProps: MessageProps): void {
        if ("kind" in userProps && String(userProps.kind) !== entry.kind) {
            this.engine.logger.warn("engine.messages: 同 id 更新不支持变更 kind，已忽略");
        }
        const merged: Record<string, any> = { ...entry.props };
        for (const key of MESSAGE_RESERVED_KEYS) {
            // id / kind 恒不变；pos / offset 忽略（不迁移已建列，ADR-0068 决策 7 沿用）
            if (key === "id" || key === "kind" || key === "pos" || key === "offset") continue;
            if (key in userProps) merged[key] = (userProps as any)[key];
        }
        if (!MESSAGE_POS.has(merged.pos)) merged.pos = MESSAGE_DEFAULTS.pos;
        if (!MESSAGE_TYPES.has(merged.type)) merged.type = "none";
        this._applyEntryConfig(entry, merged as MessageProps);
        if (entry.state === "shown") this._startTimer(entry); // 重置满额计时
        this._emit("message:update", entry);
        this._schedulePersist();
    }

    /** 应用新配置到 entry（icon/actions/progress 派生 + 数据域刷新 + className 换装） */
    private _applyEntryConfig(entry: MessageEntry, props: MessageProps): void {
        const prevClassName = entry.appliedClassName;
        entry.props = props;
        entry.icon = this._resolveIcon(props.type as MessageType, props.icon);
        entry.actions = this._resolveActions(props.actions, entry.anchor);
        if (entry.kind === "task" && props.progress != null) {
            this._applyProgress(entry, Number(props.progress));
        }
        if (entry.scope?.data) {
            Object.assign(entry.scope.data, this._buildInjectProps(entry));
        }
        const nextClassName = props.className ? String(props.className).trim() : "";
        if (entry.el) {
            if (prevClassName) entry.el.classList.remove(...prevClassName.split(/\s+/));
            if (nextClassName) entry.el.classList.add(...nextClassName.split(/\s+/));
        }
        entry.appliedClassName = nextClassName;
    }

    /**
     * 记录级字段唯一写通道（决策 8）：`read` / `status` / `result` / `title` / `body` 等补丁
     * 生效 = 改记录 + 发 `message:update`（read/status 变更另发专用事件）+ 触发持久化。
     * id / kind 不可变。task 上只读 getter（写一律走此 API）。
     */
    update(id: string, patch: Partial<MessageProps>): void {
        const task = super.get(id);
        const entry = task?._entry;
        if (!task || !entry) {
            this.engine.logger.warn(`engine.messages: update("${id}") 未命中存活记录，已忽略`);
            return;
        }
        parseMessageProps(patch as MessageProps, (m) => this.engine.logger.warn(m));
        if ("kind" in patch && String(patch.kind) !== entry.kind) {
            this.engine.logger.warn("engine.messages: update 不支持修改 kind，已忽略");
        }
        const prevRead = entry.props.read === true;
        const prevStatus = entry.props.status;
        const merged: Record<string, any> = { ...entry.props };
        for (const key of MESSAGE_RESERVED_KEYS) {
            // id / kind 恒不变；pos / offset 忽略（不迁移已建列）
            if (key === "id" || key === "kind" || key === "pos" || key === "offset") continue;
            if (key in patch) merged[key] = (patch as any)[key];
        }
        if (!MESSAGE_POS.has(merged.pos)) merged.pos = MESSAGE_DEFAULTS.pos;
        if (!MESSAGE_TYPES.has(merged.type)) merged.type = "none";
        this._applyEntryConfig(entry, merged as MessageProps);
        this._emit("message:update", entry);
        if (!prevRead && entry.props.read === true) this._emit("message:read", entry);
        if (entry.props.status !== prevStatus) this._emit("message:status", entry);
        this._schedulePersist();
    }

    // ── 已读（决策 11） ───────────────────────────────────────────────

    /** 置已读（幂等）：卡片任意点击自动调用；变更时发 `message:read` + 持久化 */
    private _setRead(entry: MessageEntry): void {
        if (entry.props.read === true) return;
        entry.props.read = true;
        this._syncData(entry);
        this._emit("message:read", entry);
        this._schedulePersist();
    }

    /** 编程式置已读 */
    markRead(id: string): void {
        const entry = super.get(id)?._entry;
        if (!entry) {
            this.engine.logger.warn(`engine.messages: markRead("${id}") 未命中存活记录，已忽略`);
            return;
        }
        this._setRead(entry);
    }

    /** 按 kind 批量置已读（缺省全量） */
    markAllRead(kind?: string): void {
        for (const task of Array.from(super.values())) {
            const entry = task._entry;
            if (entry && entry.props.read !== true && (kind == null || entry.kind === kind)) {
                this._setRead(entry);
            }
        }
    }

    // ── confirm（决策 11）与 progressbar（决策 12） ────────────────────

    /**
     * 通用确认（决策 11）：两个 value-only action 的语法糖——点击 resolve 其 value
     * （默认 yes→`true` / no→`false`）。sticky 永不 settle（永不自动关、永不 reject）；
     * 非模态堆叠；pos 跟随全局默认。`{yes,no}` 可提取键（决策 22）从 props 剥离转按钮文案，
     * 不落消息 props。
     */
    confirm(message: string | MessageProps, texts?: { yes?: string; no?: string }): Promise<any> {
        const base: Record<string, any> =
            typeof message === "string" ? { title: message } : { ...message };
        const yes = texts?.yes ?? base.yes;
        const no = texts?.no ?? base.no;
        delete base.yes; // 可提取键剥离（决策 22）——不落入消息 props（否则未知键 warn）
        delete base.no;
        return new Promise<any>((resolve) => {
            this.add(
                {
                    ...(base as MessageProps),
                    delayClose: base.delayClose ?? 0, // sticky：永不自动关
                    actions: [
                        { title: yes ?? "确定", value: true },
                        { title: no ?? "取消", value: false },
                    ],
                },
                { onChoice: resolve },
            );
        });
    }

    /**
     * 进度任务（决策 12）：= `add({ kind: 'task', ... })` 的糖 + ProgressTask 行为句柄。
     * 进度能力归 kind='task' 提供（非通用功能）——直接 `add({kind:'task', progress})` 同样
     * 渲染进度条（推进走 `update(id, {progress})`），本 API 只是附加了行为句柄。
     */
    progressbar(props: string | MessageProps): ProgressTask {
        const base = typeof props === "string" ? { title: props } : props;
        return this.add({ ...(base as MessageProps), kind: "task" }) as ProgressTask;
    }

    /** 进度推进（task 域共享：task.progress(n) 与 update(id,{progress}) 同通道） */
    private _applyProgress(entry: MessageEntry, n: number): void {
        const value = clampProgress(n);
        entry.progress = value;
        entry.props.progress = value;
        this._syncData(entry);
        if (value >= 100 && !entry.completed) {
            entry.completed = true; // 完成态：进入 delayClose 倒计时（默认 3000）
            this._startTimer(entry);
        }
    }

    // ── 重显（决策 9） ────────────────────────────────────────────────

    /**
     * 重显已隐藏记录（决策 9）：重新走完整展示管线（入队、进场动画、满额 delayClose 计时）；
     * 展示中 / 排队中幂等 no-op；不存在或离场中 warn + null。单参 KISS——要改先 update 再 show。
     */
    show(id: string): MessageTask | null {
        const task = super.get(id);
        const entry = task?._entry;
        if (!task || !entry || entry.state === "closed") {
            this.engine.logger.warn(`engine.messages: show("${id}") 未命中存活记录（persist='none' 的已关消息已移除）`);
            return null;
        }
        if (entry.state === "shown" || entry.state === "queued") return task; // 幂等
        entry.state = "queued";
        this._displayEntry(entry);
        return task;
    }

    // ── 关闭与收口（记录 ⇄ 展示两态分离，决策 5） ──────────────────────

    /**
     * 关闭（一切移除路径终点）：`message:hide` 广播在发起时；离场动画完成后 `_teardown`
     * （摘 DOM + scope 收口），**persist 决定记录存续**：`'none'` → 出 Map（记录移除）；
     * `'local'/'remote'` → 转「已隐藏」态（记录存活，可 `show(id)` 重显）。排队中的 entry
     * 同步出等待队列。
     */
    private _dismiss(entry: MessageEntry, animated: boolean): void {
        if (entry.state === "closed" || entry.state === "hidden") return;
        // 排队中：先出等待队列（防止补位 flush 挂载已关闭 entry）
        if (entry.state === "queued") this._dequeue(entry);
        entry.state = "closed";
        this._clearTimer(entry);
        this._emit("message:hide", entry);
        const finish = () => this._teardown(entry);
        const leave = animated ? entry.leave : null;
        if (leave && entry.el) {
            const el = entry.el;
            // ① 收拢起始帧（先于 leave）：锁定自然高度（height auto → px 才可过渡；
            //    happy-dom 无布局环境 offsetHeight 恒 0，锁定 0 → 归零 0→0 无变化无害）。
            el.style.boxSizing = "border-box";
            el.style.height = `${el.offsetHeight}px`;
            el.style.overflow = "hidden";
            const started = this.engine.animate.leave(el, leave, finish);
            if (!started) {
                finish();
            } else {
                // ② 收拢目标帧：扩展 transition-property 与 leave-to 类同帧归零——布局高度
                //    平滑归零、兄弟随流上移（ADR-0068 离场收拢机制沿用）
                el.style.transitionProperty =
                    "transform, opacity, height, padding-top, padding-bottom, margin-bottom, border-top-width, border-bottom-width";
                el.style.height = "0px";
                el.style.paddingTop = "0px";
                el.style.paddingBottom = "0px";
                el.style.marginBottom = `${-MESSAGE_COLUMN_GAP}px`;
                el.style.borderTopWidth = "0px";
                el.style.borderBottomWidth = "0px";
            }
        } else {
            finish();
        }
    }

    /** 出等待队列 */
    private _dequeue(entry: MessageEntry): void {
        const queue = this._queues.get(entry.props.pos as MessagePos);
        if (!queue) return;
        const i = queue.indexOf(entry);
        if (i >= 0) queue.splice(i, 1);
    }

    /** 摘除卡片：解绑监听 + DOM 移除 + scope 收口；persist 决定记录移除或转「已隐藏」 */
    private _teardown(entry: MessageEntry): void {
        const el = entry.el;
        if (el) {
            if (entry.clickHandler) el.removeEventListener("click", entry.clickHandler);
            if (entry.enterHandler) el.removeEventListener("mouseenter", entry.enterHandler);
            if (entry.leaveHandler) el.removeEventListener("mouseleave", entry.leaveHandler);
            el.remove();
        }
        entry.el = null;
        entry.task.el = null;
        if (entry.scope) {
            const scopeId = entry.scope.id;
            entry.scope.destroy(); // 幂等守卫：级联已销毁时 no-op
            const scopes = (this.engine.store.state as Record<string, any>)[SCOPES_KEY] as
                | Record<string, any>
                | undefined;
            if (scopes) delete scopes[scopeId]; // 回收私有响应式域（overlay shell 收口同纪律）
            entry.scope = null;
        }
        // persist 决定记录存续（决策 5）：非 local/remote 一律按 none 处理（缺省 undefined ≡ none）
        const persist = entry.props.persist;
        if (persist !== "local" && persist !== "remote") {
            super.delete(entry.id); // 记录移除（toast 兼容语义）
        } else {
            entry.state = "hidden"; // 记录存活（可 show(id) 重显）
        }
        this._flushQueue(entry.props.pos as MessagePos);
        this._schedulePersist();
    }

    /** 补位：该分区列有空坑时按 FIFO 顺序挂载等待队列 */
    private _flushQueue(pos: MessagePos): void {
        const queue = this._queues.get(pos);
        if (!queue?.length) return;
        const column = getMessageColumn(this.engine, pos);
        while (queue.length && column && column.childElementCount < this._showCount) {
            this._mount(queue.shift()!, column);
        }
    }

    // ── Map 覆写与批量操作（决策 10） ──────────────────────────────────

    /**
     * 覆写 `Map.delete`：**硬移除**（无动画——Map 硬移除语义；persist 记录一并删）。
     * 展示中先摘 DOM；排队中出等待队列；不存在返回 false。
     */
    delete(id: string): boolean {
        const task = super.get(id);
        const entry = task?._entry;
        if (!task || !entry) return false;
        if (entry.state === "shown") this._dismiss(entry, false);
        if (entry.state === "queued") this._dequeue(entry);
        entry.state = "closed";
        this._clearTimer(entry);
        if (entry.confirmResolve) entry.confirmResolve = null;
        super.delete(id);
        this._schedulePersist();
        return true;
    }

    /**
     * 覆写 `Map.clear`：清全部存活记录（含隐藏），默认带离场动画；`clear(false)` 立即清空。
     */
    clear(animated: boolean = true): void {
        this._queues.clear(); // 先清等待队列（防 dismiss 同步 teardown 的补位 flush 挂载排队 entry）
        for (const task of Array.from(super.values())) {
            const entry = task._entry;
            if (!entry) continue;
            if (entry.state === "shown" || entry.state === "queued") {
                this._dismiss(entry, animated);
            }
            // persist 存续的隐藏记录一并移除（决策 10：清全部存活记录含隐藏）
            if (entry.state === "hidden" || entry.state === "closed") {
                entry.state = "closed";
                super.delete(entry.id);
            }
        }
        this._schedulePersist();
    }

    /** engine.destroy() 收口（决策 10/18）：全部立即销毁 + 容器整体移除 + 持久化 flush */
    dispose(): void {
        this._queues.clear(); // 先清等待队列（防 dismiss 同步 teardown 的补位 flush）
        for (const task of Array.from(super.values())) {
            const entry = task._entry;
            if (entry && (entry.state === "shown" || entry.state === "queued")) {
                this._dismiss(entry, false);
            }
        }
        this._queues.clear();
        removeMessageContainer(this.engine);
        // 持久化终态 flush（keepalive 兜底页面卸载）
        const { locals, remotes } = this._collectPersist();
        writeLocalMessages(locals, (m) => this.engine.logger.warn(m));
        void this._remote?.flush(remotes, true);
    }

    // ── 持久化与同步（决策 17/18） ─────────────────────────────────────

    /** 收集两通道的序列化全量（按 persist 标志分桶） */
    private _collectPersist(): { locals: Record<string, any>[]; remotes: Record<string, any>[] } {
        const locals: Record<string, any>[] = [];
        const remotes: Record<string, any>[] = [];
        for (const task of Array.from(super.values())) {
            const entry = task._entry;
            if (!entry) continue;
            const serialized = serializeMessage(entry.props);
            if (entry.props.persist === "local") locals.push(serialized);
            else if (entry.props.persist === "remote") remotes.push(serialized);
        }
        return { locals, remotes };
    }

    /** 记录变更后的持久化调度：local 同步立即写；remote 防抖 500ms 合并（决策 18） */
    private _schedulePersist(): void {
        if (!this.enabled) return;
        const { locals, remotes } = this._collectPersist();
        writeLocalMessages(locals, (m) => this.engine.logger.warn(m));
        this._remote?.schedule(remotes);
    }

    /**
     * 恢复记录（restore/load 共用）：**只入记录不弹**（决策 17）——创建为「已隐藏」态存活，
     * 需要时 `show(id)` 重显；按 id 去重覆盖（服务端 / 存储为准）、新 id 追加。
     * 序列化态经合并链归一（raw 值最优先）；字符串 action 留存原始名（挂载时重查 action 表）。
     */
    private _restoreRecords(list: Record<string, any>[]): MessageTask[] {
        const restored: MessageTask[] = [];
        for (const raw of list) {
            if (raw == null || typeof raw !== "object") continue;
            const id = raw.id != null && raw.id !== "" ? String(raw.id) : `message-${++this._autoId}`;
            const existing = super.get(id)?._entry;
            if (existing) {
                // upsert：记录 props 以恢复数据为准（保持当前展示状态）
                const merged = this._mergeProps({ ...(raw as MessageProps), id }).merged;
                this._applyEntryConfig(existing, merged as MessageProps);
                restored.push(existing.task);
                continue;
            }
            const { merged, kind } = this._mergeProps({ ...(raw as MessageProps), id });
            const entry: MessageEntry = {
                id,
                kind,
                props: merged as MessageProps,
                icon: this._resolveIcon(merged.type as MessageType, merged.icon),
                actions: [],
                progress: kind === "task" ? clampProgress(merged.progress) : 0,
                completed: false,
                started: false,
                paused: false,
                state: "hidden", // 恢复只入记录不弹
                scope: null,
                el: null,
                anchor: this._resolveAnchor(merged.anchor),
                task: this._createTask(),
                confirmResolve: null,
                timer: null,
                deadline: null,
                pausedRemaining: null,
                leave: null,
                clickHandler: null,
                enterHandler: null,
                leaveHandler: null,
                appliedClassName: "",
                createdAt: Date.now(),
            };
            entry.task.id = id;
            entry.task.kind = kind;
            entry.task._entry = entry;
            super.set(id, entry.task);
            restored.push(entry.task);
        }
        return restored;
    }

    /**
     * 从服务器拉取消息（决策 17）：`fetch(GET url)`，响应体约定为消息 JSON 数组；按 id 覆盖
     * 合并、新 id 追加；**只入记录不弹**（需要时 `show(id)`）；失败 warn + resolve 空数组
     * （不 reject 中断调用方）。
     */
    async load(url?: string): Promise<MessageTask[]> {
        const target = url ?? this._globalOptions.url;
        if (!target || typeof fetch === "undefined") {
            this.engine.logger.warn("engine.messages: load 缺少 url（参数与 options.messages.url 均未配置），已跳过");
            return [];
        }
        try {
            const resp = await fetch(target, { headers: this._globalOptions.headers });
            if (!resp.ok) {
                this.engine.logger.warn(`engine.messages: load 失败（HTTP ${resp.status}），已忽略`);
                return [];
            }
            const data = await resp.json();
            if (!Array.isArray(data)) {
                this.engine.logger.warn("engine.messages: load 响应体格式异常（非数组），已忽略");
                return [];
            }
            const restored = this._restoreRecords(data);
            this._schedulePersist();
            return restored;
        } catch (e: any) {
            this.engine.logger.warn(`engine.messages: load 失败，已忽略: ${e?.message ?? e}`);
            return [];
        }
    }

    /** 立即持久化 flush（决策 18）：local 同步写 + remote 立即 POST（Promise） */
    async save(): Promise<void> {
        const { locals, remotes } = this._collectPersist();
        writeLocalMessages(locals, (m) => this.engine.logger.warn(m));
        await this._remote?.flush(remotes);
    }

    // ── 事件（决策 20） ────────────────────────────────────────────────

    /**
     * 双通道事件（决策 20）：引擎总线 + 卡片元素 dispatchEvent（body 侧，树内收不到冒泡）；
     * `message:action` 额外以 anchor 为根派发（决策 14 职责②——发起子树就近消费）；
     * kind='toast' 迁移期双发 `toast:show` / `toast:hide`（决策 3）。payload `{ message, el }`。
     */
    private _emit(
        type: "message:add" | "message:update" | "message:show" | "message:hide" | "message:read" | "message:status" | "message:action",
        entry: MessageEntry,
        extra?: Record<string, any>,
    ): void {
        const detail = { message: entry.task as MessageTask, el: entry.el, ...extra };
        this.engine.emit(type, detail as any);
        entry.el?.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
        if (type === "message:action" && entry.anchor) {
            entry.anchor.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
        }
        // 迁移期双发（决策 3）：kind='toast' 的展示状态转换照发旧事件
        if (entry.kind === "toast" && (type === "message:show" || type === "message:hide")) {
            const legacy = type === "message:show" ? "toast:show" : "toast:hide";
            const legacyDetail = { toast: entry.task as any, el: entry.el };
            this.engine.emit(legacy as any, legacyDetail as any);
            entry.el?.dispatchEvent(new CustomEvent(legacy, { detail: legacyDetail, bubbles: true }));
        }
    }

    // ── maxLen 淘汰（决策 6） ──────────────────────────────────────────

    /** 存活记录超限 FIFO 丢最旧（不豁免未读 / 展示中；新建 entry 本身不参与候选） */
    private _evictOverflow(keep: MessageEntry): void {
        const max = this._maxLen;
        if (max <= 0) return;
        while (super.size > max) {
            let oldest: MessageEntry | null = null;
            for (const task of super.values()) {
                const e = task._entry;
                if (e && e !== keep && (oldest == null || e.createdAt < oldest.createdAt)) oldest = e;
            }
            if (!oldest) break;
            if (oldest.state === "shown") this._dismiss(oldest, false);
            if (oldest.state === "queued") this._dequeue(oldest);
            oldest.state = "closed";
            this._clearTimer(oldest);
            super.delete(oldest.id);
        }
    }

    // ── 工具 ──────────────────────────────────────────────────────────

    /** 数据域刷新（响应式活体红利：改 data 域 props 驱动 x-html / 绑定自动更新） */
    private _syncData(entry: MessageEntry): void {
        if (entry.scope?.data) Object.assign(entry.scope.data, this._buildInjectProps(entry));
    }

    /** 任务句柄工厂（闭包对象：el / id 可变、closed 走 entry 状态；ProgressTask 方法内建） */
    private _createTask(): MessageTaskImpl {
        const manager = this;
        const task: MessageTaskImpl = {
            id: "",
            kind: "toast",
            el: null,
            _entry: null,
            _cancelled: false,
            get closed() {
                const e = this._entry;
                return this._cancelled || !e || e.state === "closed" || e.state === "hidden";
            },
            get read() {
                return this._entry?.props.read === true;
            },
            get status() {
                return this._entry?.props.status;
            },
            get result() {
                return this._entry?.props.result;
            },
            hide() {
                const entry = this._entry;
                if (entry && (entry.state === "shown" || entry.state === "queued")) {
                    manager._dismiss(entry, true); // 动画关闭（幂等——状态守卫在 _dismiss 内）
                } else {
                    this._cancelled = true; // factory 挂起期：取消（resolve 后不显示）
                }
            },
            start() {
                const entry = this._entry;
                if (entry) entry.started = true; // 创建不自启，显式开始（幂等）
            },
            pause() {
                const entry = this._entry;
                if (entry) entry.paused = true; // 闸门：progress 调用被忽略
            },
            resume() {
                const entry = this._entry;
                if (entry) entry.paused = false;
            },
            progress(n: number) {
                const entry = this._entry;
                // 闸门语义（决策 12）：未 start / 已 pause / 已完成 → 忽略
                if (!entry || !entry.started || entry.paused || entry.completed) return;
                manager._applyProgress(entry, n);
            },
            stop() {
                const entry = this._entry;
                if (entry && !entry.completed) manager._applyProgress(entry, 100); // ≡ progress(100)
            },
            cancel() {
                const entry = this._entry;
                if (entry && (entry.state === "shown" || entry.state === "queued")) {
                    manager._dismiss(entry, true); // 中止：立即关（无完成态）
                }
            },
        };
        return task;
    }
}

/** 进度值 clamp 到 [0,100]（决策 12） */
function clampProgress(n: any): number {
    const v = Number(n);
    if (!Number.isFinite(v)) return 0;
    return Math.min(100, Math.max(0, Math.round(v)));
}

/** 全关 / 无效调用返回的死句柄（共享单例：hide 无效、closed 恒真） */
const DEAD_TASK: MessageTask = {
    id: "",
    kind: "toast",
    el: null,
    hide() {},
    get closed() {
        return true;
    },
    get read() {
        return false;
    },
    get status() {
        return undefined;
    },
    get result() {
        return undefined;
    },
};

// formatMessageSize 由 container.ts 消费（re-export 保持模块内聚）
export { formatMessageSize };
