import type { AutoSpark } from "../engine";
import { MESSAGES_KEY } from "../engine";
import { shallow } from "autostore";
import { removeMessageContainer } from "./container";
import { MESSAGE_COLUMN_GAP } from "./styles";
import { MessageRecords } from "./records";
import type { MessageEntry } from "./entry";
import { MessageQueue } from "./queue";
import { MessagePersistence, readLocalMessages } from "./storage";
import { mergeMessageProps, settleMessageLevel, validatePos, validatePersist, type MessageMergeContext } from "./props";
import {
    MessageSessionBase,
    MessageToastSession,
    MessageTaskSession,
    MessageConfirmSession,
    DEAD_SESSION,
    type MessageSessionFactory,
} from "./sessions";
import type { TaskMessageProps } from "./sessions/task";
import type { ToastMessageProps } from "./sessions/toast";
import type { ConfirmMessageProps } from "./sessions/confirm";
import {
    parseMessageProps,
    messageLevelName,
    MESSAGE_DEFAULTS,
    MESSAGE_LEVEL_ICONS,
    MESSAGE_PERSIST,
    type AutoSparkMessage,
    type AutoSparkMessageSession,
    type AutoSparkMessageLevel,
    type AutoSparkMessagesOptions,
    type AutoSparkMessagesState,
    type AutoSparkTaskMessageSession,
    type AutoSparkConfirmMessageSession,
    type AutoSparkAction,
    type MessageOptions,
    type MessagePos,
    type MessageProps,
    type ResolvedMessageAction,
} from "./types";

export type { MessageEntry } from "./entry";

/**
 * MessageManager：全局消息引擎级子系统（ADR-0071 / ADR-0077 / ADR-0083 → **ADR-0088 模块
 * 拆分收束**——本类瘦身为**编排门面**：Map 语义 + API 门面 + 事件双通道 + 关闭收口 + 各
 * 部件编排）。
 *
 * 职责分层（ADR-0088 决策五）：
 *
 * - **props.ts**——五层合并链 + 归一校验（单次 props 整包直传，白名单投影退役）；
 * - **records.ts**——entry 构建 / `$messages` 镜像（items + sessions 双列表五处收口）/
 *   maxLen 淘汰 / 恢复重建；
 * - **queue.ts**——`MessageQueue` 每 pos 一实例（分区列懒建 + showCount 判定 + FIFO 补位）；
 * - **storage.ts**——`MessagePersistence` 持久化全责（分桶收集 / 调度 / 删后即刷 / save·load，
 *   serializeMessage 白名单十键——纯业务数据，ADR-0088 修订）；
 * - **sessions/**——class 家族 + **装配管线**（`mount/unmount` 双层装配、监听、计时器、
 *   hover 暂停；task 三控制钮归模板 x-show 数据域驱动，ADR-0088）；
 * - **本类**——`add/show/toast/confirm/task/update/respond/delete/clear/dispose/load/save/
 *   markRead*` API 面 + `message:*` 事件双通道 + `_fireAction` 闭环 + session 工厂。
 *
 * - **Map 语义**（决策 10）：继承 `Map<string, MessageSessionBase>`，键恒为 string id（缺省自动生成）；
 *   可枚举范围 = 全部存活记录（展示中 + 已隐藏）；`delete(id)` 覆写为**硬移除**（无动画，persist
 *   记录一并删 + 立即同步持久化）；`clear()` 覆写为清全部存活记录（含隐藏，默认带动画）；
 *   `dispose()` destroy 收口。
 * - **记录 ⇄ 展示两态分离**（决策 5，ADR-0077 数值化）：`persist` 控制记录存续——`0`（默认）
 *   关闭即移除（toast 兼容语义）；`1` **会话缓冲**（隐藏不删不持久化、复用 maxLen 淘汰——
 *   管理界面可再查看，刷新即失）；`2`/`3`（local/remote）关闭转「已隐藏」态仍可枚举、
 *   `show(id)` 可重显。
 * - **生命周期**：`delayClose` 默认 3000、`0` = sticky；hover 暂停/移出恢复（剩余时间制）；
 *   `engine.stop()` 不感知（无锚非树内），`dispose()`（destroy 调用）全部立即销毁 + 容器移除
 *   + 持久化 flush（keepalive 兜底）。
 * - **原地更新**（决策 7）：同 id 重复 add = 换展示 props（scope.data 响应式赋值）+ 显示中重置
 *   计时；不重播动画；pos / offset 忽略（不迁移列）。记录级字段走 `update(id, patch)`（决策 8，
 *   唯一写通道——session 上 read/status/result 为只读 getter）。
 * - **actions value 闭环**（决策 13）：点击 = 置已读 → 写 result → 发 `message:action` →
 *   handle → hide 判定；confirm（决策 11）= value-only actions 糖，Promise resolve choice value。
 * - **anchor 三职**（决策 14）：局部 action 解析根 + 事件派发根 + 渲染数据视图基准。
 * - **全关语义**（决策 15）：`options.messages: false` 构造即短路，一切入口 warn + no-op。
 */

/**
 * ToastManager → MessageManager（ADR-0071）：服务挂 engine 实例（`engine.messages`）。
 * 多引擎独立 manager / 容器 / 队列 / 持久化，跨引擎不去重不共享。
 */
export class MessageManager extends Map<string, MessageSessionBase> {
    readonly engine: AutoSpark<any>;
    /** 特性开关（options.messages !== false）；false 时构造即短路 */
    readonly enabled: boolean;

    /** 记录域（ADR-0088：entry 构建 / 镜像 / 淘汰 / 恢复） */
    readonly records: MessageRecords;
    /** 持久化域（ADR-0088：收集 / 调度 / 即刷 / save·load） */
    readonly storage: MessagePersistence;

    /**
     * 全部存活会话的注册表（ADR-0077 正名视图）：即本 Map 自身——`sessions.get(id)` ≡
     * `messages.get(id)`，随 remove/dispose 同步进出。暴露独立入口仅为词汇正名（Session 体系）。
     */
    get sessions(): Map<string, AutoSparkMessageSession> {
        return this as unknown as Map<string, AutoSparkMessageSession>;
    }

    /**
     * $messages 状态容器（ADR-0072；`messages: false` 时恒 null）。options 真身：
     * manager 运行时一律经 `_options` 现读 state——state 即配置唯一存放地（无副本、
     * 无 watch 回写）；state 写入为信任通道（不走 parseMessageProps 校验）。
     */
    private _state: AutoSparkMessagesState | null = null;

    /** 协作部件读取口（records / queue / storage / sessions——ADR-0088 模块拆分） */
    get _stateRef(): AutoSparkMessagesState | null {
        return this._state;
    }

    /** 生效全局配置真身读取（唯一出口；enabled 时恒可用；协作部件同用） */
    get _options(): AutoSparkMessagesOptions {
        return this._state!.options;
    }

    /** anchor / actions 的全局默认（ADR-0072 边界键）：构造期私有固化——DOM 引用与函数值不入 state */
    private _frozen: { anchor?: MessageProps["anchor"]; actions?: AutoSparkAction[] } = {};

    /**
     * 用户在 options.messages **显式配置过的键名**（构造期兜底前快照）：sticky 自动关闭钮的
     * 显式性判定基准（ADR-0077 修订）。
     */
    private _globalDeclared: ReadonlySet<string> = new Set();

    /** 自动 id 计数器（records 恢复路径共用） */
    _autoId = 0;

    /** 分区等待队列（按 pos 一实例，ADR-0088）：满员排队，补位按队首 FIFO */
    private _queues = new Map<MessagePos, MessageQueue>();

    constructor(engine: AutoSpark<any>) {
        super();
        this.engine = engine;
        const cfg = (engine.options as any).messages;
        this.enabled = cfg !== false;
        const user: MessageOptions = cfg === false || cfg == null ? {} : cfg;
        // 边界键私有固化（ADR-0072：「函数、元素不入 state」——anchor 是 DOM 引用，
        // actions 对象形态含 handle 函数值会被 autostore 按计算属性语义劫持）
        this._frozen = { anchor: user.anchor, actions: user.actions };
        // 用户显式键快照（兜底前）：sticky 自动关闭钮的显式性判定基准（见字段注释）
        this._globalDeclared = new Set(Object.keys(user));
        this.records = new MessageRecords(this);
        this.storage = new MessagePersistence(this);
        if (!this.enabled) return; // messages: false——不注入保留键、不恢复
        // $messages 保留键注入（沿 $scopes 先例，1 engine 1 store 约定；永不整体替换容器）：
        // options 真身 = 内置默认 < 用户配置（剥 anchor/actions 两边界键）
        const effective: Record<string, any> = {};
        for (const key of Object.keys(user)) {
            if (key !== "anchor" && key !== "actions") effective[key] = (user as any)[key];
        }
        for (const key of Object.keys(MESSAGE_DEFAULTS)) {
            if (effective[key] === undefined) effective[key] = (MESSAGE_DEFAULTS as any)[key];
        }
        // 注意：`shallow()` 只**标记**对象（返回裸引用），真正的代理在容器进入 store、
        // 经 state 读出时才创建——变更句柄必须用**回读值**（裸引用上 splice 不发通知）。
        // 深度 = options.shallow（构造期一次性，ADR-0077；autostore shallow 值域 0|1）：默认 1
        // （成员一层字段读写有事件）、0 = 成员不代理（仅数组结构变更有事件——超大消息列表
        // 的最省形态）；非零值一律归 1；运行时直写静默忽略（shallow 包装无法换壳——options
        // 真身契约例外键）
        const shallowDepth: 0 | 1 = Number(effective.shallow) === 0 ? 0 : 1;
        (engine.store.state as Record<string, any>)[MESSAGES_KEY] = {
            items: shallow<AutoSparkMessage[], 0 | 1>([], shallowDepth) as AutoSparkMessagesState["items"],
            // 展示序 id 列表（ADR-0083 Q11a）：成员是 string 无字段——shallow 深度 0（仅结构变更有事件）
            sessions: shallow<string[], 0>([], 0) as AutoSparkMessagesState["sessions"],
            options: effective as AutoSparkMessagesOptions,
        };
        this._state = (engine.store.state as Record<string, any>)[MESSAGES_KEY] as AutoSparkMessagesState;
        // local 持久化的启动恢复（决策 18）：构造期读 localStorage——只入枚举（隐藏态）、
        // 不自动重弹（需要时 show(id)）；脏数据 warn + 剪除（readLocalMessages 守卫）。
        // persist 按存储介质反推为 'local'（ADR-0072：载荷不携带 closed/persist）
        this.records.restoreRecords(
            readLocalMessages((m) => this.engine.logger.warn(m)),
            "local",
        );
    }

    // ── 显示入口（ADR-0071 决策 7：三态入参） ─────────────────────────

    /**
     * 添加一条消息（字符串简写 ≡ `{ title }`；async factory resolve `undefined`/`void` →
     * 静默跳过，挂起期 `session.hide()` = 取消）。同 id = 原地更新（决策 7）。
     * 返回按 type 分派的**会话实例**（ADR-0083 class 家族）。`options.messages: false` 时
     * warn + 死会话。统一入口：`show(props | factory)` 为本方法别名（ADR-0077）。
     *
     * 第二参 `type`（ADR-0083 修订）：**factory 形态的挂起会话类型指定**——挂起 session 按
     * 此创建子类；session 类型不可变，return props 携带不同 type → warn + 以本参数为准。
     * 非 factory 形态携带 → warn + 忽略（props 对象自带 type 字段）。
     */
    add(
        input: TaskMessageProps & { type: "task" } | ((session: AutoSparkMessageSession) => Promise<(TaskMessageProps & { type: "task" }) | void | undefined>),
    ): AutoSparkTaskMessageSession;
    add(
        input: ConfirmMessageProps & { type: "confirm" } | ((session: AutoSparkMessageSession) => Promise<(ConfirmMessageProps & { type: "confirm" }) | void | undefined>),
    ): AutoSparkConfirmMessageSession;
    add(
        input: (session: AutoSparkMessageSession) => Promise<MessageProps | void | undefined>,
        type: "task",
    ): AutoSparkTaskMessageSession;
    add(
        input: (session: AutoSparkMessageSession) => Promise<MessageProps | void | undefined>,
        type: "confirm",
    ): AutoSparkConfirmMessageSession;
    add(
        input: string | MessageProps | ((session: AutoSparkMessageSession) => Promise<MessageProps | void | undefined>),
        second?: string | ((session: AutoSparkMessageSession) => Promise<Partial<MessageProps> | void | undefined>),
    ): AutoSparkMessageSession;
    add(
        input: string | MessageProps | ((session: AutoSparkMessageSession) => Promise<MessageProps | void | undefined>),
        second?: string | ((session: AutoSparkMessageSession) => Promise<Partial<MessageProps> | void | undefined>),
    ): AutoSparkMessageSession {
        if (!this.enabled) {
            this.engine.logger.warn(
                "engine.messages: 消息特性已通过 options.messages: false 关闭，调用被忽略",
            );
            return DEAD_SESSION;
        }
        if (typeof input === "function") return this._addAsync(input, second as string | undefined);
        if (second != null) {
            this.engine.logger.warn(
                `engine.messages: add(..., "${second}") 第二参 type 仅对 factory 形态生效（对象形态请用 type 字段），已忽略`,
            );
        }
        const parsed = parseMessageProps(input, (m) => this.engine.logger.warn(m));
        if (!parsed) return DEAD_SESSION;
        return this._enqueue(parsed, undefined);
    }

    /**
     * async factory 形态（ADR-0083 Q12a 挂起注入）：同步创建**挂起会话**（按第二参 type 创建
     * 子类——缺省 'toast' 基类面，type 随 return props 定）注入 factory；挂起期 `update()` 缓存
     * 补丁、`cancel()/hide()` = 取消；resolve props = 初始展示配置（undefined → 静默跳过），
     * 落地时合并挂起缓存。**type 锁定**：第二参已指定时 return props 的 type 与之不同 →
     * warn + 以第二参为准（session 类型不可变）。
     */
    private _addAsync(factory: MessageSessionFactory, type?: string): AutoSparkMessageSession {
        const declared = type != null && String(type).trim() !== "" ? String(type).trim() : "toast";
        const session = this._createSession(declared); // 挂起会话：按声明 type 创建子类（ADR-0083 修订）
        factory(session)
            .then((props) => {
                if (session._cancelled) return; // 挂起期 hide()/cancel() = 取消
                if (props == null) {
                    session._cancelled = true; // 条件通知：内容就绪才弹，静默跳过
                    return;
                }
                const parsed =
                    parseMessageProps(
                        typeof props === "string" ? props : (props as MessageProps),
                        (m) => this.engine.logger.warn(m),
                    ) ?? null;
                if (!parsed || !String((parsed as MessageProps).title ?? "").trim()) {
                    this.engine.logger.warn("engine.messages: factory 结果缺少 title（空消息），已跳过");
                    session._cancelled = true;
                    return;
                }
                // type 锁定（ADR-0083 修订）：显式声明的 type 优先——session 子类已定，不可变
                if (parsed.type != null && String(parsed.type) !== declared) {
                    this.engine.logger.warn(
                        `engine.messages: factory 声明 type "${declared}" 与 return props type "${parsed.type}" 不一致，以声明为准（会话类型不可变）`,
                    );
                    parsed.type = declared as MessageProps["type"];
                }
                if (declared !== "toast" && parsed.type == null) {
                    parsed.type = declared as MessageProps["type"];
                }
                // 挂起期 update 缓存合并（后写胜——ADR-0083 Q12a）
                if (session._pendingPatch) Object.assign(parsed as Record<string, any>, session._pendingPatch);
                this._enqueue(parsed as MessageProps, session);
            })
            .catch((e: any) => {
                this.engine.logger.warn(`engine.messages: factory 执行失败，已跳过: ${e?.message ?? e}`);
                session._cancelled = true;
            });
        return session;
    }

    /** 合并链上下文（props.ts mergeMessageProps 的 manager 侧入参组装） */
    private _mergeCtx(): MessageMergeContext {
        return {
            opts: this.enabled ? this._options : ({} as AutoSparkMessagesOptions),
            frozen: this._frozen,
            globalDeclared: this._globalDeclared,
            warn: (m: string) => this.engine.logger.warn(m),
        };
    }

    /** 五层合并链委托（props.ts）——records / update 路径共用 */
    _mergeProps(userProps: MessageProps): { merged: Record<string, any>; type: string } {
        return mergeMessageProps(userProps, this._mergeCtx());
    }

    /** level 归一委托（props.ts） */
    _settleLevel(merged: Record<string, any>): void {
        settleMessageLevel(merged, (m) => this.engine.logger.warn(m));
    }

    /** 入队 / 原地更新（同 id）唯一入口：合并链 → 校验 → 已存在则更新，否则创建 entry 排队 */
    private _enqueue(userProps: MessageProps, reuseSession?: MessageSessionBase): AutoSparkMessageSession {
        // 空 title no-op（含字符串简写形态；factory 路径已先行校验）
        if (!String(userProps.title ?? "").trim()) {
            this.engine.logger.warn("engine.messages: title 为空，调用被忽略");
            if (reuseSession) reuseSession._cancelled = true;
            return DEAD_SESSION;
        }
        // 合并链（决策 15）：内置默认 < 内置 type 种子 < options.messages < types[type] < 单次 props。
        // `id` 仅单次层生效。
        const { merged, type } = this._mergeProps(userProps);
        validatePos(merged, (m) => this.engine.logger.warn(m));
        this._settleLevel(merged);
        validatePersist(merged, (m) => this.engine.logger.warn(m));
        const id = merged.id != null && merged.id !== "" ? String(merged.id) : `message-${++this._autoId}`;

        // 同 id 处理（决策 5/7）：queued/shown → 原地更新；hidden（persist 存续记录）→ 更新 + 重显
        const existing = super.get(id);
        if (existing) {
            const entry = existing._entry;
            if (entry && (entry.state === "shown" || entry.state === "queued")) {
                this._updateInPlace(entry, userProps);
                return existing;
            }
            if (entry && (entry.state === "hidden" || entry.state === "closed")) {
                // 已隐藏 / 离场动画中：换新配置后重新走展示管线（记录复用）
                const fresh = this._mergeProps(userProps).merged;
                fresh.id = id;
                this._applyEntryConfig(entry, fresh as MessageProps);
                entry.state = "queued";
                this._displayEntry(entry);
                this.storage.schedule();
                return existing;
            }
        }

        const session = reuseSession ?? this._createSession(type);
        const entry = this.records.createEntry(merged as MessageProps, id, type, session);
        // confirm 会话 thenable（ADR-0077，取代 confirm() 糖的 Promise）：await 会话 = 等
        // choice 应答——confirmResolve 由 _fireAction 在按钮点击 / yes()/no()/respond() 时
        // 调用（sticky 永不 settle 语义保持；一次应答后 Promise 定格）
        if (type === "confirm") {
            const choice = new Promise<any>((resolve) => {
                entry.confirmResolve = resolve;
            });
            (session as MessageConfirmSession)._bindChoice(choice);
        }
        super.set(id, session);
        this._emit("message:add", entry);
        this.records.mirrorAdd(entry);

        // maxLen 淘汰（决策 6）：存活记录超限 FIFO 丢最旧（不豁免未读 / 展示中；
        // persist=1 会话缓冲记录同受此约束——ADR-0077「缓冲区超出清除」复用 maxLen）
        this.records.evictOverflow(entry);

        // 容量判定与挂载（queue 分区收口）：有坑即显示，满员排队
        this._displayEntry(entry);
        this.storage.schedule();
        return session;
    }

    // ── 配套解析（icon / anchor / actions——records 与原地更新共用） ────

    /** 同屏上限（管理器级键，不进合并链；state 真身现读——运行时改即刻生效） */
    get _showCount(): number {
        const n = this._state?.options.showCount ?? MESSAGE_DEFAULTS.showCount;
        return typeof n === "number" && n > 0 ? Math.floor(n) : MESSAGE_DEFAULTS.showCount;
    }

    /** 存活记录数上限（0 = 不限；state 真身现读，ADR-0072 起支持运行时修改） */
    get _maxLen(): number {
        const n = this._state?.options.maxLen;
        return typeof n === "number" && n > 0 ? Math.floor(n) : 0;
    }

    /** level → 图标名：显式 icon > icons 重映射 > 同名词默认；none(0) 无图标 */
    _resolveIcon(level: AutoSparkMessageLevel, explicit?: string): string {
        if (explicit) return explicit;
        if (level === 0) return "";
        const name = messageLevelName(level) as Exclude<ReturnType<typeof messageLevelName>, "none">;
        return this._options.icons?.[name] ?? MESSAGE_LEVEL_ICONS[name] ?? name;
    }

    /** anchor 归一化（决策 14）：string = add 时一次性 querySelector，未命中 warn + null */
    _resolveAnchor(anchor: MessageProps["anchor"]): HTMLElement | null {
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
    _resolveActions(items: AutoSparkAction[] | undefined, anchor: HTMLElement | null): ResolvedMessageAction[] {
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

    // ── 原地更新（决策 7）与记录级写通道（决策 8） ─────────────────────

    /** 同 id 重复 add：以 entry 当前生效配置为基准、userProps 显式键打补丁；重置计时、不重播动画 */
    private _updateInPlace(entry: MessageEntry, userProps: MessageProps): void {
        if ("type" in userProps && String(userProps.type) !== entry.type) {
            this.engine.logger.warn("engine.messages: 同 id 更新不支持变更 type，已忽略");
        }
        const merged: Record<string, any> = { ...entry.props };
        // ADR-0088 整包直传：补丁键全量并入（自定义键同权）；id / type 恒不变；
        // pos / offset 忽略（不迁移已建列，ADR-0068 决策 7 沿用）
        for (const key of Object.keys(userProps)) {
            if (key === "id" || key === "type" || key === "pos" || key === "offset") continue;
            merged[key] = (userProps as any)[key];
        }
        validatePos(merged, (m) => this.engine.logger.warn(m));
        this._applyEntryConfig(entry, merged as MessageProps); // level 归一在 _applyEntryConfig 统一收口
        if (entry.state === "shown") entry.session._startTimer(); // 重置满额计时
        this._emit("message:update", entry);
        this.storage.schedule();
    }

    /** 应用新配置到 entry（level 归一 + 业务键同步 record + icon/actions/progress 派生 + 数据域刷新 + className/styles 换装） */
    _applyEntryConfig(entry: MessageEntry, props: MessageProps): void {
        const prevClassName = entry.appliedClassName;
        const prevStyles = entry.appliedStyles;
        this._settleLevel(props as Record<string, any>);
        entry.props = props;
        // 业务键同步进 record（update / 同 id 原地更新 / 恢复 upsert 三路共用收口——
        // record 是持久化数据单一数据源；props 出现的键覆盖，未出现保留）+ updateAt 刷新
        for (const key of ["title", "description", "owner", "status", "result", "link", "read"] as const) {
            if (key in props) (entry.record as any)[key] = (props as any)[key];
        }
        entry.record.level = props.level as AutoSparkMessageLevel;
        this.records.touch(entry);
        entry.icon = this._resolveIcon(entry.record.level ?? 0, props.icon);
        entry.actions = this._resolveActions(props.actions, entry.anchor);
        entry.session.onEntryProps(entry, props); // type 专属键响应（钩子——task progress 通道等）
        entry.session.syncData();
        const nextClassName = props.className ? String(props.className).trim() : "";
        const nextStyles = props.styles ? String(props.styles) : "";
        if (entry.el) {
            if (prevClassName) entry.el.classList.remove(...prevClassName.split(/\s+/));
            if (nextClassName) entry.el.classList.add(...nextClassName.split(/\s+/));
            if (nextStyles !== prevStyles) {
                entry.el.style.cssText = nextStyles; // 换装（无则清空内联）
                entry.session._applySizes(entry.el, props); // cssText 整体覆盖后尺寸键须重写
            } else {
                entry.session._applySizes(entry.el, props); // 幂等：等值 setProperty 天然去重
            }
            entry.el.setAttribute("data-message-level", messageLevelName(entry.record.level ?? 0)); // 语义色跟随
        }
        entry.appliedClassName = nextClassName;
        entry.appliedStyles = nextStyles;
        this.records.mirrorReplace(entry); // 记录级变更 → items[i] 整替换（update/原地更新/恢复 upsert 共用收口）
    }

    /**
     * 记录级字段唯一写通道（决策 8）：`read` / `status` / `result` / `title` / `level` 等补丁
     * 生效 = 改记录 + 发 `message:update`（read/status 变更另发专用事件）+ 触发持久化。
     * id / type 不可变。session 上只读 getter（写一律走此 API）。
     */
    update(id: string, patch: Partial<MessageProps>): void {
        const session = super.get(id);
        const entry = session?._entry;
        if (!session || !entry) {
            this.engine.logger.warn(`engine.messages: update("${id}") 未命中存活记录，已忽略`);
            return;
        }
        parseMessageProps(patch as MessageProps, (m) => this.engine.logger.warn(m));
        if ("type" in patch && String(patch.type) !== entry.type) {
            this.engine.logger.warn("engine.messages: update 不支持修改 type，已忽略");
        }
        const prevRead = entry.props.read === true;
        const prevStatus = entry.props.status;
        const merged: Record<string, any> = { ...entry.props };
        // ADR-0088 整包直传：补丁键全量并入（自定义键同权）；id / type 恒不变；
        // pos / offset 忽略（不迁移已建列）
        for (const key of Object.keys(patch)) {
            if (key === "id" || key === "type" || key === "pos" || key === "offset") continue;
            merged[key] = (patch as any)[key];
        }
        validatePos(merged, (m) => this.engine.logger.warn(m));
        this._applyEntryConfig(entry, merged as MessageProps);
        this._emit("message:update", entry);
        if (!prevRead && entry.props.read === true) this._emit("message:read", entry);
        if (entry.props.status !== prevStatus) this._emit("message:status", entry);
        this.storage.schedule();
    }

    // ── 已读（决策 11） ───────────────────────────────────────────────

    /** 置已读（幂等）：卡片任意点击自动调用；变更时发 `message:read` + 持久化 + 镜像替换 */
    private _setRead(entry: MessageEntry): void {
        if (entry.props.read === true) return;
        entry.props.read = true;
        entry.record.read = true;
        this.records.touch(entry); // updateAt 刷新（数据变更入口之一）
        entry.session.syncData();
        this.records.mirrorReplace(entry);
        this._emit("message:read", entry);
        this.storage.schedule();
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

    /** 按 type 批量置已读（缺省全量） */
    markAllRead(type?: string): void {
        for (const session of Array.from(super.values())) {
            const entry = session._entry;
            if (entry && entry.props.read !== true && (type == null || entry.type === type)) {
                this._setRead(entry);
            }
        }
    }

    // ── 展示编排（queue 分区收口，ADR-0088） ───────────────────────────

    /** 分区队列取（或懒建） */
    private _queueOf(pos: MessagePos): MessageQueue {
        let q = this._queues.get(pos);
        if (!q) {
            q = new MessageQueue(this, pos);
            this._queues.set(pos, q);
        }
        return q;
    }

    /** 容量判定与挂载入口（queue.offer 收口：sessionListAdd + 有坑 mount / 满员排队） */
    _displayEntry(entry: MessageEntry): void {
        this._queueOf(entry.props.pos as MessagePos).offer(entry);
    }

    /** 出等待队列 */
    _dequeue(entry: MessageEntry): void {
        this._queues.get(entry.props.pos as MessagePos)?.remove(entry);
    }

    /** 补位：该分区列有空坑时按队首 FIFO 挂载等待队列 */
    _flushQueue(pos: MessagePos): void {
        this._queueOf(pos).flush();
    }

    // ── 重显（决策 9）与 add 别名 ────────────────────────────────────

    /**
     * `add` 的别名（ADR-0077）：配置对象 / async factory 形态直转 `add(...)`（含按 type 的
     * Session 分派返回与第二参 factory type 透传——ADR-0083 修订）——「show = 让消息出现」。
     * **string 形态保留决策 9 重显语义**：重显已隐藏记录（重新走完整展示管线：入队、进场
     * 动画、满额 delayClose 计时）；展示中 / 排队中幂等 no-op；不存在或离场中 warn + null。
     * 消歧规则零歧义——字符串恒为 id、对象恒为新建，同 id 原地更新语义归 `add` / 对象形态。
     */
    show(input: TaskMessageProps & { type: "task" } | ((session: AutoSparkMessageSession) => Promise<(TaskMessageProps & { type: "task" }) | void | undefined>)): AutoSparkTaskMessageSession;
    show(input: ConfirmMessageProps & { type: "confirm" } | ((session: AutoSparkMessageSession) => Promise<(ConfirmMessageProps & { type: "confirm" }) | void | undefined>)): AutoSparkConfirmMessageSession;
    show(input: (session: AutoSparkMessageSession) => Promise<MessageProps | void | undefined>, type: "task"): AutoSparkTaskMessageSession;
    show(input: (session: AutoSparkMessageSession) => Promise<MessageProps | void | undefined>, type: "confirm"): AutoSparkConfirmMessageSession;
    show(input: (session: AutoSparkMessageSession) => Promise<MessageProps | void | undefined>, type: string): AutoSparkMessageSession;
    show(input: MessageProps | ((session: AutoSparkMessageSession) => Promise<MessageProps | void | undefined>)): AutoSparkMessageSession;
    show(id: string): AutoSparkMessageSession | null;
    show(
        input:
            | string
            | MessageProps
            | ((session: AutoSparkMessageSession) => Promise<MessageProps | void | undefined>),
        second?: string | ((session: AutoSparkMessageSession) => Promise<Partial<MessageProps> | void | undefined>),
    ): AutoSparkMessageSession | null {
        if (typeof input !== "string") return this.add(input, second);
        if (second != null) {
            this.engine.logger.warn(
                `engine.messages: show("${input}", ...) 第二参仅对 factory 形态生效（string 形态是重显 id），已忽略`,
            );
        }
        const session = super.get(input);
        const entry = session?._entry;
        if (!session || !entry || entry.state === "closed") {
            this.engine.logger.warn(`engine.messages: show("${input}") 未命中存活记录（persist=0 的已关消息已移除）`);
            return null;
        }
        if (entry.state === "shown" || entry.state === "queued") return session; // 幂等
        entry.state = "queued";
        this._displayEntry(entry);
        return session;
    }

    // ── type 快捷方式（ADR-0077：show 统一入口上的便捷层，均强制对应 type） ──

    /**
     * toast 快捷方式：≡ `show({ ...props, type: 'toast' })`（默认 type 即 'toast'，本方法
     * 显式强制——误传他 type 一律归 toast）。anchor 显式传时生效（模板侧 `toast` action
     * 自动注入宿主元素，两者等价）。
     */
    toast(
        props: string | ToastMessageProps | MessageSessionFactory,
    ): AutoSparkMessageSession {
        if (typeof props === "function") {
            // factory 形态：透传挂起 session（ADR-0083 修订）+ 第二参锁定 type（挂起即子类）
            return this.show(async (session) => {
                const resolved = await props(session);
                return resolved == null ? undefined : { ...resolved, type: "toast" };
            }, "toast");
        }
        const initial = { ...(typeof props === "string" ? { title: props } : props), type: "toast" };
        return this.show(initial);
    }

    /**
     * confirm 快捷方式：≡ `show({ ...props, type: 'confirm', delayClose: 0, 双钮 })`——返回
     * **Confirm 会话**（thenable：`await` 直接得 choice 应答，sticky 永不 settle / 永不 reject；
     * `yes()/no()/cancel()` 编程应答——原 Promise 糖语义由会话本体承载，ADR-0077）。
     * `{yes, no}` 可提取键（决策 22）从 props 剥离转按钮文案，不落消息 props。
     */
    confirm(
        message: string | ConfirmMessageProps,
        texts?: { yes?: string; no?: string },
    ): AutoSparkConfirmMessageSession {
        const base: Record<string, any> =
            typeof message === "string" ? { title: message } : { ...message };
        const yes = texts?.yes ?? base.yes;
        const no = texts?.no ?? base.no;
        delete base.yes; // 可提取键剥离（决策 22）——不落入消息 props
        delete base.no;
        return this.show({
            ...(base as MessageProps),
            type: "confirm",
            delayClose: base.delayClose ?? 0, // sticky：永不自动关
            actions: [
                { title: yes ?? "确定", value: true },
                { title: no ?? "取消", value: false },
            ],
        }) as AutoSparkConfirmMessageSession;
    }

    /**
     * task 快捷方式：≡ `show({ ...props, type: 'task' })`——返回 **Task 会话**
     * （`start/progress/pause/resume/stop/cancel` 七方法——创建即 started、pause 闸门、
     * stop 完成态收口）。原 progressbar() 糖同义更名（名即 type 名）。
     */
    task(
        props: string | MessageProps | MessageSessionFactory,
    ): AutoSparkTaskMessageSession {
        if (typeof props === "function") {
            // factory 形态：透传挂起 session + 第二参锁定 'task'（挂起即 Task 会话，可 start/progress）
            return this.show(async (session) => {
                const resolved = await props(session);
                return resolved == null ? undefined : { ...resolved, type: "task" };
            }, "task") as AutoSparkTaskMessageSession;
        }
        const initial = { ...(typeof props === "string" ? { title: props } : props), type: "task" };
        return this.show(initial) as AutoSparkTaskMessageSession;
    }

    // ── 关闭与收口（记录 ⇄ 展示两态分离，决策 5） ──────────────────────

    /**
     * 关闭（一切移除路径终点）：`message:hide` 广播在发起时；离场动画完成后 `_teardown`
     * （摘 DOM + 双 scope 收口），**persist 决定记录存续**（ADR-0077 数值化）：`0` → 出 Map
     * （记录移除，toast 兼容语义）；`1`（会话缓冲）/`2`/`3`（持久化）→ 转「已隐藏」态
     * （记录存活，可 `show(id)` 重显——1 不持久化刷新即失）。排队中的 entry 同步出等待队列。
     */
    _dismiss(entry: MessageEntry, animated: boolean): void {
        if (entry.state === "closed" || entry.state === "hidden") return;
        // 排队中：先出等待队列（防止补位 flush 挂载已关闭 entry）
        if (entry.state === "queued") this._dequeue(entry);
        entry.state = "closed";
        entry.session._clearTimer();
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

    /** 摘除卡片（session.unmount 收 DOM/scope）+ 记录存续 / 镜像 / 队列补位编排 */
    private _teardown(entry: MessageEntry): void {
        entry.session.unmount();
        this.records.sessionListRemove(entry.id); // 展示序 id 出列（Q11a「仅隐藏」）
        // persist 决定记录存续（决策 5，ADR-0077 数值化）：≥1（会话缓冲/持久化）转隐藏；
        // 0（含缺省/非法——MESSAGE_DEFAULTS 已归一）出 Map（toast 兼容语义）
        const persist = Number(entry.props.persist ?? MESSAGE_PERSIST.NONE);
        if (persist >= MESSAGE_PERSIST.SESSION && persist <= MESSAGE_PERSIST.REMOTE) {
            entry.state = "hidden"; // 记录存活（可 show(id) 重显；1 不持久化刷新即失）
        } else {
            super.delete(entry.id); // 记录移除
        }
        // 镜像跟随 Map 权威层（ADR-0072）：存活 → 整替换（closed 翻 true）；已移除 → 删除
        // （clear() 硬删后异步 teardown 的 persist 记录走 remove 分支）
        if (super.has(entry.id)) this.records.mirrorReplace(entry);
        else this.records.mirrorRemove(entry.id);
        this._flushQueue(entry.props.pos as MessagePos);
        this.storage.schedule();
    }

    // ── Map 覆写与批量操作（决策 10） ──────────────────────────────────

    /**
     * 覆写 `Map.delete`：**硬移除**（无动画——Map 硬移除语义；persist 记录一并删）+
     * **立即同步持久化**（ADR-0077：local 即写、remote 即 flush 全量覆盖——「删干净」闭环，
     * 刷新/多标签页不复活）。展示中先摘 DOM；排队中出等待队列；不存在返回 false。
     */
    override delete(id: string): boolean {
        const session = super.get(id);
        const entry = session?._entry;
        if (!session || !entry) return false;
        if (entry.state === "shown") this._dismiss(entry, false);
        if (entry.state === "queued") this._dequeue(entry);
        entry.state = "closed";
        entry.session._clearTimer();
        if (entry.confirmResolve) entry.confirmResolve = null;
        super.delete(id);
        session._entry = null; // 会话死亡（ADR-0077）：后续方法 no-op + warn，不复活
        this.records.mirrorRemove(id); // 硬移除（hidden 态无 teardown 路径，此处兜底）
        this.records.sessionListRemove(id); // 展示序 id 出列（hidden 态直删不经 teardown）
        this.storage.flushNow();
        return true;
    }

    /**
     * 覆写 `Map.clear`：清全部存活记录（含隐藏与会话缓冲），默认带离场动画；`clear(false)`
     * 立即清空。**立即同步持久化**（ADR-0077 同 delete）。
     */
    override clear(animated: boolean = true): void {
        for (const q of this._queues.values()) q.clear(); // 先清等待队列（防 dismiss 同步 teardown 的补位 flush 挂载排队 entry）
        for (const session of Array.from(super.values())) {
            const entry = session._entry;
            if (!entry) continue;
            if (entry.state === "shown" || entry.state === "queued") {
                this._dismiss(entry, animated);
            }
            // persist 存续的隐藏记录一并移除（决策 10：清全部存活记录含隐藏）
            if (entry.state === "hidden" || entry.state === "closed") {
                entry.state = "closed";
                super.delete(entry.id);
            }
            session._entry = null; // 会话死亡（ADR-0077）
        }
        if (this._state) this._state.items.splice(0); // 镜像清空（含动画中记录——异步 teardown 的 remove 分支自然 no-op）
        if (this._state) this._state.sessions.splice(0); // 展示序清空
        this.storage.flushNow();
    }

    /** engine.destroy() 收口（决策 10/18）：全部立即销毁 + 容器整体移除 + 持久化 flush */
    dispose(): void {
        for (const q of this._queues.values()) q.clear(); // 先清等待队列（防 dismiss 同步 teardown 的补位 flush）
        for (const session of Array.from(super.values())) {
            const entry = session._entry;
            if (entry && (entry.state === "shown" || entry.state === "queued")) {
                this._dismiss(entry, false);
            }
        }
        for (const q of this._queues.values()) q.clear();
        removeMessageContainer(this.engine);
        if (this._state) this._state.items.splice(0); // 镜像清空（引擎收口——Map 与镜像同步归零）
        if (this._state) this._state.sessions.splice(0); // 展示序清空
        // 持久化终态 flush（keepalive 兜底页面卸载）
        this.storage.flushNow();
    }

    // ── 持久化与拉取（storage 域委托，ADR-0088） ───────────────────────

    /** 从服务器拉取消息（决策 17）：storage.load 收口——GET JSON 数组、按 id 覆盖合并、
     *  只入记录不弹（重建归 records）、失败 warn + 空数组 */
    async load(url?: string): Promise<AutoSparkMessageSession[]> {
        return this.storage.load(url);
    }

    /** 立即持久化 flush（决策 18）：local 同步写 + remote 立即 POST（Promise） */
    async save(): Promise<void> {
        await this.storage.save();
    }

    // ── 交互闭环（决策 13/11） ─────────────────────────────────────────

    /** 卡片点击委托：任意点击置已读（决策 11）→ action 按钮（value 闭环）→ 关闭钮 */
    _onCardClick(entry: MessageEntry, e: Event): void {
        this._setRead(entry);
        const target = e.target as Element | null;
        const actionBtn = target?.closest?.(".autospark-message-action") as HTMLElement | null;
        if (actionBtn) {
            const index = Number(actionBtn.getAttribute("data-message-action"));
            const action = entry.actions[Number.isInteger(index) ? index : -1];
            if (action) this._fireAction(entry, action);
            return;
        }
        if (target?.closest?.(".autospark-message-close")) {
            this._dismiss(entry, true);
        }
    }

    /**
     * action 触发闭环（决策 13，按钮点击与 Confirm 会话 `yes()/no()` 共用——事件观察者
     * 无感知差异）：value 写 result → `message:action` 广播 → confirm resolve → handle →
     * hide 判定。
     */
    _fireAction(entry: MessageEntry, action: ResolvedMessageAction): void {
        if (action.hasValue) {
            entry.props.result = action.value;
            entry.record.result = action.value;
            this.records.touch(entry); // updateAt 刷新（数据变更入口之一）
            entry.session.syncData();
            this.records.mirrorReplace(entry);
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
        this.storage.schedule();
        if (action.hide) this._dismiss(entry, true);
    }

    /**
     * Confirm 会话选择（ADR-0077；ADR-0083 起 `respond(id, value)` 同路）：`yes()/no()` ≡
     * 点击对应 value 按钮——沿 `_fireAction` 同一闭环（value 写 result → `message:action`
     * 广播 → confirm resolve → hide），事件观察者对编程触发与 DOM 点击无感知差异。无匹配
     * action（如 actions 被自定义清空）→ warn + no-op。
     */
    _fireConfirmChoice(session: MessageSessionBase, value: boolean): void {
        const entry = session._entry;
        if (!entry) {
            this.engine.logger.warn(
                `engine.messages: 会话已死亡（记录已 remove），选择操作无效（ADR-0077）`,
            );
            return;
        }
        const action = entry.actions.find((a) => a.hasValue && a.value === value);
        if (!action) {
            this.engine.logger.warn(
                `engine.messages: type='confirm' 会话缺少 value=${value} 的按钮（actions 已被自定义），${value ? "yes()" : "no()"} 无效（ADR-0077）`,
            );
            return;
        }
        this._fireAction(entry, action);
    }

    /**
     * confirm 编程应答（ADR-0083 Q6a）：`respond(id, true)` ≡ 点击对应 value 按钮 / 会话
     * `yes()`——`_fireConfirmChoice` 同一闭环（value 写 result → 事件 → resolve → hide 判定）。
     * JS 侧编程驱动进度另有既有通道 `update(id, { progress })`。
     */
    respond(id: string, value: any): void {
        const session = super.get(id);
        if (!session?._entry) {
            this.engine.logger.warn(`engine.messages: respond("${id}") 未命中存活记录，已忽略`);
            return;
        }
        this._fireConfirmChoice(session, value);
    }

    // ── 事件（决策 20） ────────────────────────────────────────────────

    /**
     * 双通道事件（决策 20）：引擎总线 + 卡片元素 dispatchEvent（body 侧，树内收不到冒泡）；
     * `message:action` 额外以 anchor 为根派发（决策 14 职责②——发起子树就近消费）；
     * type='toast' 迁移期双发 `toast:show` / `toast:hide`（决策 3）。payload `{ message, el }`。
     */
    _emit(
        type: "message:add" | "message:update" | "message:show" | "message:hide" | "message:read" | "message:status" | "message:action",
        entry: MessageEntry,
        extra?: Record<string, any>,
    ): void {
        const detail = { message: entry.session as AutoSparkMessageSession, el: entry.el, ...extra };
        this.engine.emit(type, detail as any);
        entry.el?.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
        if (type === "message:action" && entry.anchor) {
            entry.anchor.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
        }
        // 迁移期双发（决策 3）：type='toast' 的展示状态转换照发旧事件
        if (entry.type === "toast" && (type === "message:show" || type === "message:hide")) {
            const legacy = type === "message:show" ? "toast:show" : "toast:hide";
            const legacyDetail = { toast: entry.session as any, el: entry.el };
            this.engine.emit(legacy as any, legacyDetail as any);
            entry.el?.dispatchEvent(new CustomEvent(legacy, { detail: legacyDetail, bubbles: true }));
        }
    }

    // ── 会话工厂（ADR-0083 class 家族） ────────────────────────────────

    /**
     * 会话工厂（ADR-0083 class 家族）：按 type `switch` 实例化子类——`toast` / `confirm` /
     * `task` 各得专属面，自定义 type 回基类面。**类型面与运行时面统一**（取代 ADR-0077 的
     * 「闭包全集方法 + 类型窄化」——基类实例不再携带 task/confirm 域方法）。records 恢复
     * 路径共用（`_` 前缀内部面惯例）。
     */
    _createSession(type: string): MessageSessionBase {
        switch (type) {
            case "task":
                return new MessageTaskSession(this);
            case "confirm":
                return new MessageConfirmSession(this);
            case "toast":
                return new MessageToastSession(this);
            default:
                return new MessageSessionBase(this); // 自定义 type 回基类面（ADR-0077 沿用）
        }
    }

    /** 原生 Map 删除（records 淘汰路径——绕过 `delete` 覆写的硬移除 + 即刷编排） */
    _rawDelete(id: string): void {
        super.delete(id);
    }
}
