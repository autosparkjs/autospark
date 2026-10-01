import type { AutoSpark } from "../engine";
import { SCOPES_KEY, MESSAGES_KEY } from "../engine";
import { shallow } from "autostore";
import { resolveAnimate, type PhaseAnim } from "../animate";
import type { AutoSparkScope } from "../scope";
import type { ComponentDef } from "../directives/component-def";
import { getMessageColumn, getMessageContainer, MESSAGE_COLUMN_ATTR, removeMessageContainer } from "./container";
import { MESSAGE_COLUMN_GAP } from "./styles";
import { resolveBuiltinRendererByKind, resolveMessageShell } from "./renderers";
import type { SlotContent } from "../utils/slot";
import { readLocalMessages, RemotePersistController, writeLocalMessages } from "./storage";
import {
    formatMessageSize,
    parseMessageProps,
    serializeMessage,
    MESSAGE_DEFAULTS,
    MESSAGE_PERSIST,
    MESSAGE_POS,
    MESSAGE_RESERVED_KEYS,
    MESSAGE_TYPES,
    MESSAGE_TYPE_ICONS,
    type AutoSparkMessage,
    type AutoSparkMessageAction,
    type AutoSparkConfirmMessageSession,
    type AutoSparkMessageSession,
    type AutoSparkMessagesOptions,
    type AutoSparkMessagesState,
    type AutoSparkTaskMessageSession,
    type MessageActionItem,
    type MessageFetchOptions,
    type MessageOptions,
    type MessagePersistLevel,
    type MessagePos,
    type MessageProps,
    type MessageType,
    type ResolvedMessageAction,
} from "./types";

/**
 * MessageManager：全局消息引擎级子系统（ADR-0071 决策 1 / ADR-0077 会话与双层渲染修订）。
 *
 * 三层结构：本管理器（记录 / 队列 / 生命周期 / 原地更新 / 持久化）> 分区列（引擎结构，
 * container.ts）> 单项卡片 = **公共 shell + kind renderer 双层组合**（ADR-0077——shell 渲染
 * 公共元素（close/type/title/description/actions 最底）并声明 kind 默认出口；kind renderer
 * 为专属区组件（task 进度条等）经 `mode:"live"` 投影出口；均 `instantiateDetachedComponent`
 * 管道，真响应式活体）。
 *
 * - **会话（Session）**（ADR-0077，原 MessageTask 家族正名扩容）：`add()` 按 kind 返回
 *   `AutoSparkMessageSession` 行为句柄（内置映射 toast/task/confirm，自定义 kind 回基类面）；
 *   `sessions` getter 即本 Map 的正名视图（同一张表）；会话死亡（remove 后）方法 no-op + warn。
 *   卡片子树注入 `$session` 派生变量（localData 通道——x-for `$index` 同构，非响应式、行为专职）。
 * - **Map 语义**（决策 10）：继承 `Map<string, SessionImpl>`，键恒为 string id（缺省自动生成）；
 *   可枚举范围 = 全部存活记录（展示中 + 已隐藏）；`delete(id)` 覆写为**硬移除**（无动画，persist
 *   记录一并删 + 立即同步持久化）；`clear()` 覆写为清全部存活记录（含隐藏，默认带动画）；
 *   `dispose()` destroy 收口。
 * - **记录 ⇄ 展示两态分离**（决策 5，ADR-0077 数值化）：`persist` 控制记录存续——`0`（默认）
 *   关闭即移除（toast 兼容语义）；`1` **会话缓冲**（隐藏不删不持久化、复用 maxLen 淘汰——
 *   管理界面可再查看，刷新即失）；`2`/`3`（local/remote）关闭转「已隐藏」态仍可枚举、
 *   `show(id)` 可重显。
 * - **按 pos 分区 FIFO 队列**（沿 ADR-0068 决策 8）：每列独立上限 `showCount`（默认 5），
 *   满员排队、append 列尾、自动关闭后按序补位；离场收拢（margin-bottom 抵消 gap，兄弟零跳变）。
 * - **生命周期**：`delayClose` 默认 3000、`0` = sticky；hover 暂停/移出恢复（剩余时间制）；
 *   `engine.stop()` 不感知（无锚非树内），`dispose()`（destroy 调用）全部立即销毁 + 容器移除
 *   + 持久化 flush（keepalive 兜底）。
 * - **原地更新**（决策 7）：同 id 重复 add = 换展示 props（scope.data 响应式赋值）+ 显示中重置
 *   计时；不重播动画；pos / offset 忽略（不迁移列）。记录级字段走 `update(id, patch)`（决策 8，
 *   唯一写通道——session 上 read/status/result 为只读 getter）。
 * - **actions value 闭环**（决策 13）：点击 = 置已读 → 写 result → 发 `message:action` →
 *   handle → hide 判定；confirm（决策 11）= value-only actions 糖，Promise resolve choice value
 *   （`confirm()` 糖维持 Promise；kind='confirm' 的 `yes()/no()/cancel()` 走同一闭环）。
 * - **anchor 三职**（决策 14）：局部 action 解析根（字符串沿 scope 链解析）+ 事件派发根
 *   （`message:action` 以 anchor 额外派发）+ 渲染数据视图基准（shell/renderer 挂链 anchor scope，
 *   无 anchor rootless）。
 * - **渲染双层**（ADR-0077，取代决策 16 四级互斥链）：**shell 链**（公共骨架）=
 *   `options.messages.shell`（选择器，默认 'message'）→ getComponent 链 → `options.uiShells`
 *   引擎级注册表 → 内置 shell 兜底；**kind 链**（专属区）= `kinds[kind].render` → 内置注册表
 *   （toast 空占位 / task 进度槽 / confirm 空占位）→ 无（出口空）。props 全量数据域**同权注入
 *   两层**（剥函数）；shell 无默认出口 → warn + kind 区丢弃。
 * - **持久化**（决策 17/18 方案 A，ADR-0077 数值化）：`persist: 2`（localStorage 同步全量写）/
 *   `3`（POST url 防抖 500ms 全量）；`remove`/`delete`/`clear` **立即同步**（local 即写、
 *   remote 即 flush 全量覆盖）；`load()` GET 拉取只入记录不弹；`save()` 立即 flush；
 *   序列化剥函数与运行态，恢复不自动重弹（persist 按介质反推：local→2 / remote→3）。
 * - **事件族**（决策 20）：`message:add/update/show/hide/read/status/action` 双通道（总线 +
 *   卡片元素）；kind='toast' 迁移期双发 `toast:show` / `toast:hide`。
 * - **全关语义**（决策 15）：`options.messages: false` 构造即短路（不建容器、不注样式），
 *   一切入口 warn + no-op。
 */

/** kinds 层不允许出现的 manager 级键（出现 warn + 忽略，决策 15；shallow 为 ADR-0077 新增） */
const MANAGER_LEVEL_KEYS: ReadonlySet<string> = new Set([
    "showCount",
    "maxLen",
    "fetchOptions",
    "icons",
    "shell",
    "shallow",
    "kinds",
]);

/** 单条消息的运行时 entry（会话句柄的闭包背后态） */
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
    /** 生命周期状态：queued → shown → closed（persist 0 移除 / ≥1 转隐藏） */
    state: "queued" | "shown" | "hidden" | "closed";
    /** shell 实例 scope（anchor 挂链或 rootless；teardown 统一收口） */
    scope: AutoSparkScope | null;
    /** kind renderer 实例 scope（双层组合 ADR-0077；无 renderer 为 null；teardown 统一收口） */
    rendererScope: AutoSparkScope | null;
    /** 卡片根元素（排队未挂 / 已摘除为 null） */
    el: HTMLElement | null;
    /** 解析后的 anchor 元素（三职合一，决策 14） */
    anchor: HTMLElement | null;
    session: SessionImpl;
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
    /** 已应用的内联样式（原地更新换装用，ADR-0077 styles） */
    appliedStyles: string;
    /** 创建时间戳（maxLen FIFO 淘汰序） */
    createdAt: number;
    /** level 定序快照（ADR-0072）：入列时取值，update 改 level 不重排已展示卡 */
    level: number;
}

/**
 * 会话的可变实现形态（对外只暴露 AutoSparkMessageSession 家族只读面）。运行时**全集方法**
 * （基类 show/hide/remove + task 域 start/progress/pause/resume/stop/cancel + confirm 域
 * yes/no/cancel）——`add()` 返回时按 kind 做**类型窄化**（运行时同构对象，TS 类型面分派；
 * task.cancel 与 confirm.cancel 同为「立即关」语义、同一实现）。`_entry` 为 null 即死亡
 * （remove 后）——方法 no-op + warn，不复活。
 */
interface SessionImpl {
    id: string;
    kind: string;
    /** 卡片根（挂载/摘除时由 manager 写——对外经 AutoSparkMessageSession 的 readonly 面暴露） */
    el: HTMLElement | null;
    show(): void;
    hide(): void;
    remove(): void;
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
    yes(): void;
    no(): void;
    /** confirm 域 thenable（ADR-0077）：await 会话 = 等 choice 应答（value）；其他 kind 无此成员 */
    then?(...args: any[]): Promise<any>;
    _entry: MessageEntry | null;
    _cancelled: boolean;
}

/**
 * ToastManager → MessageManager（ADR-0071）：服务挂 engine 实例（`engine.messages`）。
 * 多引擎独立 manager / 容器 / 队列 / 持久化，跨引擎不去重不共享。
 */
export class MessageManager extends Map<string, SessionImpl> {
    readonly engine: AutoSpark<any>;
    /** 特性开关（options.messages !== false）；false 时构造即短路 */
    readonly enabled: boolean;

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

    /** anchor / actions 的全局默认（ADR-0072 边界键）：构造期私有固化——DOM 引用与函数值不入 state */
    private _frozen: { anchor?: MessageProps["anchor"]; actions?: MessageActionItem[] } = {};

    /** 自动 id 计数器 */
    private _autoId = 0;
    /** 等待队列（按 pos 分区）：满员排队，补位按 level 降序（ADR-0072）、同级 FIFO */
    private _queues = new Map<MessagePos, MessageEntry[]>();
    /** 展示中卡片根 → entry（列内 level 定位查序用） */
    private _elEntries = new Map<HTMLElement, MessageEntry>();
    /** remote 持久化控制器（恒建；fetch 时现读 state 的 fetchOptions，无 url 跳过——ADR-0072） */
    private _remote: RemotePersistController;

    constructor(engine: AutoSpark<any>) {
        super();
        this.engine = engine;
        const cfg = (engine.options as any).messages;
        this.enabled = cfg !== false;
        const user: MessageOptions = cfg === false || cfg == null ? {} : cfg;
        // 边界键私有固化（ADR-0072：「函数、元素不入 state」——anchor 是 DOM 引用，
        // actions 对象形态含 handle 函数值会被 autostore 按计算属性语义劫持）
        this._frozen = { anchor: user.anchor, actions: user.actions };
        this._remote = new RemotePersistController(
            () => this._state?.options.fetchOptions ?? null,
            (m) => this.engine.logger.warn(m),
        );
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
            options: effective as AutoSparkMessagesOptions,
        };
        this._state = (engine.store.state as Record<string, any>)[MESSAGES_KEY] as AutoSparkMessagesState;
        // local 持久化的启动恢复（决策 18）：构造期读 localStorage——只入枚举（隐藏态）、
        // 不自动重弹（需要时 show(id)）；脏数据 warn + 剪除（readLocalMessages 守卫）。
        // persist 按存储介质反推为 'local'（ADR-0072：载荷不携带 closed/persist）
        this._restoreRecords(
            readLocalMessages((m) => this.engine.logger.warn(m)),
            "local",
        );
    }

    /** 生效全局配置真身读取（唯一出口；enabled 时恒可用） */
    private get _options(): AutoSparkMessagesOptions {
        return this._state!.options;
    }

    // ── 显示入口（ADR-0071 决策 7：三态入参） ─────────────────────────

    /**
     * 添加一条消息（字符串简写 ≡ `{ title }`；async factory resolve `undefined`/`void` →
     * 静默跳过，挂起期 `session.hide()` = 取消）。同 id = 原地更新（决策 7）。
     * 返回按 kind 分派的**会话句柄**（ADR-0077）：`kind:'task'` → Task 会话（进度六方法）、
     * `kind:'confirm'` → Confirm 会话（yes/no/cancel + **thenable**——await 即得 choice 应答）、
     * 其余（含自定义 kind）→ 基类面。`options.messages: false` 时 warn + 死会话（全关语义）。
     * 统一入口：`show(props | factory)` 为本方法别名（ADR-0077）。
     */
    add(
        input: MessageProps & { kind: "task" } | (() => Promise<(MessageProps & { kind: "task" }) | void | undefined>),
    ): AutoSparkTaskMessageSession;
    add(
        input: MessageProps & { kind: "confirm" } | (() => Promise<(MessageProps & { kind: "confirm" }) | void | undefined>),
    ): AutoSparkConfirmMessageSession;
    add(
        input: string | MessageProps | (() => Promise<MessageProps | void | undefined>),
    ): AutoSparkMessageSession;
    add(
        input: string | MessageProps | (() => Promise<MessageProps | void | undefined>),
    ): AutoSparkMessageSession {
        if (!this.enabled) {
            this.engine.logger.warn(
                "engine.messages: 消息特性已通过 options.messages: false 关闭，调用被忽略",
            );
            return DEAD_SESSION;
        }
        if (typeof input === "function") return this._addAsync(input);
        const parsed = parseMessageProps(input, (m) => this.engine.logger.warn(m));
        if (!parsed) return DEAD_SESSION;
        return this._enqueue(parsed, undefined);
    }

    /** async factory 形态：同步返回挂起会话，resolve 后入队（undefined → 静默跳过） */
    private _addAsync(factory: () => Promise<MessageProps | void | undefined>): AutoSparkMessageSession {
        const session = this._createSession();
        factory()
            .then((props) => {
                if (session._cancelled) return; // 挂起期 hide() = 取消
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
                this._enqueue(parsed as MessageProps, session);
            })
            .catch((e: any) => {
                this.engine.logger.warn(`engine.messages: factory 执行失败，已跳过: ${e?.message ?? e}`);
                session._cancelled = true;
            });
        return session;
    }

    /** 入队 / 原地更新（同 id）唯一入口：合并链 → 校验 → 已存在则更新，否则创建 entry 排队 */
    private _enqueue(userProps: MessageProps, reuseSession?: SessionImpl): AutoSparkMessageSession {
        // 空 title no-op（含字符串简写形态；factory 路径已先行校验）
        if (!String(userProps.title ?? "").trim()) {
            this.engine.logger.warn("engine.messages: title 为空，调用被忽略");
            if (reuseSession) reuseSession._cancelled = true;
            return DEAD_SESSION;
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
        if (merged.persist != null && ![0, 1, 2, 3].includes(merged.persist as number)) {
            this.engine.logger.warn(
                `engine.messages: 未知 persist "${merged.persist}"（0|1|2|3，ADR-0077），已回退 ${MESSAGE_PERSIST.NONE}`,
            );
            merged.persist = MESSAGE_PERSIST.NONE;
        }
        // confirm kind 默认双按钮（ADR-0077 升内置 kind）：合并链未提供 actions 时注入
        // value-only 确定钮（与 confirm() 糖同形；kinds.confirm.actions / 单次 actions 显式覆盖）
        if (kind === "confirm" && !(merged.actions as any[] | undefined)?.length) {
            merged.actions = [
                { title: "确定", value: true },
                { title: "取消", value: false },
            ];
        }
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
                this._applyEntryConfig(entry, fresh);
                entry.state = "queued";
                this._displayEntry(entry);
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
            rendererScope: null,
            el: null,
            anchor,
            session: reuseSession ?? this._createSession(),
            confirmResolve: null,
            timer: null,
            deadline: null,
            pausedRemaining: null,
            leave: null,
            clickHandler: null,
            enterHandler: null,
            leaveHandler: null,
            appliedClassName: "",
            appliedStyles: "",
            createdAt: Date.now(),
            level: normalizeLevel(merged.level),
        };
        const session = entry.session;
        session.id = id;
        session.kind = kind;
        session._entry = entry;
        // confirm 会话 thenable（ADR-0077，取代 confirm() 糖的 Promise）：await 会话 = 等
        // choice 应答——confirmResolve 由 _fireAction 在按钮点击 / yes()/no() 时调用
        // （sticky 永不 settle 语义保持；一次应答后 Promise 定格）
        if (kind === "confirm") {
            const choice = new Promise<any>((resolve) => {
                entry.confirmResolve = resolve;
            });
            session.then = choice.then.bind(choice);
        }
        super.set(id, session);
        this._emit("message:add", entry);
        this._mirrorAdd(entry);

        // maxLen 淘汰（决策 6）：存活记录超限 FIFO 丢最旧（不豁免未读 / 展示中；
        // persist=1 会话缓冲记录同受此约束——ADR-0077「缓冲区超出清除」复用 maxLen）
        this._evictOverflow(entry);

        // 容量判定（按 pos 分区各计）：有坑即显示，满员排队
        this._displayEntry(entry);
        this._schedulePersist();
        return session;
    }

    /** 四层合并链（决策 15）：内置默认 < options.messages（state 真身现读）< kinds[kind] < 单次 props */
    private _mergeProps(userProps: MessageProps): { merged: Record<string, any>; kind: string } {
        const opts = this.enabled ? this._options : ({} as AutoSparkMessagesOptions);
        const kind = String(userProps.kind ?? (opts as any).kind ?? "toast");
        const kindOptions = opts.kinds?.[kind];
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
            if (key !== "id" && key in opts) merged[key] = (opts as any)[key];
            // anchor / actions 的全局默认经构造期固化通道并入（ADR-0072 边界键——不入 state）
            if (key !== "id" && (key === "anchor" || key === "actions") && (this._frozen as any)[key] !== undefined) {
                merged[key] = (this._frozen as any)[key];
            }
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

    /** 同屏上限（管理器级键，不进合并链；state 真身现读——运行时改即刻生效） */
    private get _showCount(): number {
        const n = this._options.showCount ?? MESSAGE_DEFAULTS.showCount;
        return typeof n === "number" && n > 0 ? Math.floor(n) : MESSAGE_DEFAULTS.showCount;
    }

    /** 存活记录数上限（0 = 不限；state 真身现读，ADR-0072 起支持运行时修改） */
    private get _maxLen(): number {
        const n = this._options.maxLen;
        return typeof n === "number" && n > 0 ? Math.floor(n) : 0;
    }

    /** type → 图标名：显式 icon > icons 重映射 > 同名词默认；none 无图标 */
    private _resolveIcon(type: MessageType, explicit?: string): string {
        if (type === "none" && !explicit) return "";
        if (explicit) return explicit;
        if (type === "none") return "";
        return this._options.icons?.[type] ?? MESSAGE_TYPE_ICONS[type] ?? type;
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

    // ── 渲染（ADR-0077 双层查找 + anchor 数据视图挂链） ────────────────

    /**
     * shell 解析（ADR-0077 公共骨架链，每卡现读——`options.messages.shell` 运行时直写换键
     * 对后续 add 生效）：选择器名（默认 'message'）→ getComponent 链（用户自定义组件）→
     * `options.uiShells` 引擎级注册表（内置种子 + 用户覆盖）→ 内置 shell 兜底。
     * `builtin` 标记决定装配形态（内置模板自带引擎类名契约根即卡片根；用户模板包 wrapper）。
     */
    private _resolveShell(): { name: string; snapshot: HTMLElement; def: ComponentDef | null; builtin: boolean } {
        const name = String(this._options.shell ?? "").trim() || "message";
        // ① getComponent 链（用户自定义 shell——消息无树内宿主，实际查全局组件表）
        const snapshot = this.engine._resolveGlobalComponent(name);
        if (snapshot) {
            const def =
                this.engine.getComponentDef(snapshot) ??
                this.engine.getGlobalComponentDef(name) ??
                null;
            return { name, snapshot, def, builtin: false };
        }
        // ② options.uiShells 引擎级注册表（ADR-0077：内置种子 + 用户同键覆盖）
        const ui = this.engine._resolveUiShell(name);
        if (ui) return { name, ...ui, builtin: this.engine._isBuiltinUiShell(name) };
        // ③ 兜底内置 shell（名配错——可发现）
        this.engine.logger.warn(
            `engine.messages: shell "${name}" 未命中（全局组件表与 options.uiShells 均无），回退内置默认（ADR-0077）`,
        );
        return { name: "message", ...resolveMessageShell(), builtin: true };
    }

    /**
     * kind renderer 解析（ADR-0077 专属区链，与 shell 链正交）：`kinds[kind].render`（用户
     * kind 级）→ 内置注册表（toast 空占位 / task 进度槽 / confirm 空占位）→ **null**（自定义
     * kind 无专属区，shell 出口空置）。用户组件名走全局组件表查找，未命中 warn + 顺位回退。
     */
    private _resolveRenderer(kind: string): { snapshot: HTMLElement; def: ComponentDef | null } | null {
        const renderName = this._options.kinds?.[kind]?.render?.trim() ?? "";
        if (renderName !== "") {
            const snapshot = this.engine._resolveGlobalComponent(renderName);
            if (snapshot) {
                const def =
                    this.engine.getComponentDef(snapshot) ??
                    this.engine.getGlobalComponentDef(renderName) ??
                    null;
                return { snapshot, def };
            }
            this.engine.logger.warn(
                `engine.messages: 自定义 render "${renderName}"（kinds.${kind}.render）未在全局组件表命中，按内置注册表顺位回退（ADR-0077）`,
            );
        }
        return resolveBuiltinRendererByKind(kind);
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

    /** 注入 props（决策 16：消息记录全量数据域整包，剥函数；description/link 全链路统一词 ADR-0072） */
    private _buildInjectProps(entry: MessageEntry): Record<string, any> {
        return {
            id: entry.id,
            kind: entry.kind,
            type: entry.props.type,
            title: entry.props.title ?? "",
            description: entry.props.description ?? "",
            icon: entry.icon,
            actions: entry.actions,
            closable: entry.props.closable === true,
            link: entry.props.link ?? "",
            owner: entry.props.owner,
            level: entry.level,
            read: entry.props.read === true,
            status: entry.props.status,
            result: entry.props.result,
            progress: entry.kind === "task" ? entry.progress : undefined,
            delayClose: entry.props.delayClose,
        };
    }

    /**
     * 列内插入锚点（ADR-0072 level 定序）：返回 card 应 insertBefore 的兄弟（null = 尾部）。
     * top/center 系列边端在首——插到**首个更低级别**之前；bottom 系列边端在末——插到
     * **首个更高级别**之前（展示自上而下按级别升序、边端在末位）。同级不插队。
     */
    private _columnInsertBefore(column: HTMLElement, entry: MessageEntry): Node | null {
        const bottom = String(entry.props.pos).startsWith("bottom");
        for (const child of Array.from(column.children)) {
            const sibling = this._elEntries.get(child as HTMLElement);
            if (!sibling) continue;
            if (bottom ? sibling.level > entry.level : sibling.level < entry.level) return child;
        }
        return null;
    }

    // ── 记录镜像（ADR-0072：$messages.items 同步收口） ────────────────

    /** 记录镜像构建：entry → AutoSparkMessage 纯数据投影（未定义键不入，镜像保持干净） */
    private _buildRecord(entry: MessageEntry): AutoSparkMessage {
        const p = entry.props;
        const rec: AutoSparkMessage = {
            id: entry.id,
            kind: entry.kind,
            read: p.read === true,
            closed: entry.state === "hidden" || entry.state === "closed",
        };
        const set = (key: keyof AutoSparkMessage, v: any) => {
            if (v !== undefined) (rec as any)[key] = v;
        };
        set("type", p.type);
        set("title", p.title);
        set("description", p.description);
        set("owner", p.owner);
        set("level", p.level);
        set("status", p.status);
        set("result", p.result);
        set("link", p.link);
        set("icon", entry.icon);
        set("pos", p.pos);
        set("offset", p.offset);
        set("closable", p.closable);
        set("animate", p.animate);
        set("className", p.className);
        set("delayClose", p.delayClose);
        if (typeof p.persist === "number" && p.persist >= MESSAGE_PERSIST.SESSION) {
            set("persist", p.persist); // ≥1 入镜像（0 缺省态不显式落键，保持记录干净）
        }
        if (entry.kind === "task") set("progress", entry.progress);
        if (entry.actions.length > 0) {
            rec.actions = entry.actions.map((a) => ({
                title: a.title,
                hide: a.hide,
                hasValue: a.hasValue,
                value: a.value,
            }));
        }
        return rec;
    }

    /** 镜像插入（新记录）：level 降序定位、同级按创建序在后（与列序同规则，ADR-0072） */
    private _mirrorAdd(entry: MessageEntry): void {
        const items = this._state?.items;
        if (!items) return;
        let i = items.length;
        for (let k = 0; k < items.length; k++) {
            if ((items[k].level ?? 0) < entry.level) {
                i = k;
                break;
            }
        }
        items.splice(i, 0, this._buildRecord(entry));
    }

    /** 镜像整替换（记录级变更）：`splice(i, 1, 新记录)`——索引赋值不触发数组路径订阅，须走 splice */
    private _mirrorReplace(entry: MessageEntry): void {
        const items = this._state?.items;
        if (!items) return;
        const i = items.findIndex((r) => r.id === entry.id);
        if (i >= 0) items.splice(i, 1, this._buildRecord(entry));
    }

    /** 镜像移除（记录删除） */
    private _mirrorRemove(id: string): void {
        const items = this._state?.items;
        if (!items) return;
        const i = items.findIndex((r) => r.id === id);
        if (i >= 0) items.splice(i, 1);
    }

    /** 容量判定与挂载入口：有坑即 mount，满员排队 */
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

    /**
     * 挂载卡片（容量已判定，ADR-0077 双层装配）：kind renderer 先编译（内容先于 shell——
     * overlay 装配序），产物经 `mode:"live"` 段投影进 shell 默认出口；shell 与 renderer
     * **同挂 anchor scope**（兄弟挂链）+ 同引用 `$session` 派生变量双层注入（挂链继承的
     * 语义等价实现——两层子树统一可见，嵌套封闭组件照组件数据边界纪律不可见）。
     * shell 无默认出口 → warn + kind 区丢弃（renderer 不编译，数据无损失）。props 全量
     * 数据域**同权注入两层**。最后卡片根装配（wrapper 判据 = 非内置 shell）→ 委托监听 →
     * enter 动画 → 计时 → 广播。
     */
    private _mount(entry: MessageEntry, column: HTMLElement): void {
        const shell = this._resolveShell();
        const renderer = this._resolveRenderer(entry.kind);
        // anchor 数据视图（决策 14 职责③）：有 anchor 挂链其 scope，无 anchor rootless
        const parentScope = this._anchorScope(entry.anchor);
        // $session 派生变量（ADR-0077）：localData 通道——非响应式、行为专职、不进 state；
        // shell 与 renderer 两层注入同一对象（值即本会话，模板 `@click="$session.hide()"`）
        const sessionVars: Record<string, any> = { $session: entry.session };
        const props = this._buildInjectProps(entry);

        // ① kind renderer 编译（专属区组件——task 进度槽等；无 renderer / 无出口则跳过）
        let rendererCompiled: { el: HTMLElement; scope: AutoSparkScope } | null = null;
        const hasOutlet = !!shell.def?.slots?.includes("default");
        if (renderer) {
            if (!hasOutlet) {
                this.engine.logger.warn(
                    `engine.messages: shell "${shell.name}" 未声明默认出口（裸 x-slot），kind="${entry.kind}" 专属区已丢弃（ADR-0077）`,
                );
            } else {
                rendererCompiled = this.engine.compiler.instantiateDetachedComponent(
                    renderer.snapshot.cloneNode(true) as HTMLElement,
                    parentScope,
                    renderer.def,
                    props,
                    undefined,
                    null,
                    null,
                    sessionVars,
                );
            }
        }

        // ② shell 编译（公共骨架）：renderer 产物作为 live 插槽段投影默认出口（活体直挂
        //    不克隆不重编译，销毁权责归 teardown 统一回收双 scope——overlay 同构）
        const shellSlots: Map<string, SlotContent> | null = rendererCompiled
            ? new Map<string, SlotContent>([
                  [
                      "default",
                      {
                          name: "default",
                          nodes: [rendererCompiled.el],
                          params: [],
                          paramsExpr: null,
                          mode: "live",
                      } satisfies SlotContent,
                  ],
              ])
            : null;
        const compiled = this.engine.compiler.instantiateDetachedComponent(
            shell.snapshot.cloneNode(true) as HTMLElement,
            parentScope,
            shell.def,
            props,
            undefined,
            shellSlots,
            null,
            sessionVars,
        );

        // 卡片根装配（决策 16/21 DOM 契约 + ADR-0077）：内置 shell（或未接管的内置种子）的
        // 组件根即卡片根（模板自带双类名）；用户 shell（components 命中 / uiShells 用户键）
        // 包引擎 wrapper——基类 / pos 标记 / 卡片级动画、收拢与 hover 监听恒挂 wrapper，
        // 用户模板零引擎类污染（不被卡片布局样式干扰）
        let card = compiled.el;
        if (!shell.builtin) {
            const wrapper = document.createElement("div");
            wrapper.appendChild(card);
            card = wrapper;
        }
        entry.scope = compiled.scope;
        entry.rendererScope = rendererCompiled?.scope ?? null;
        entry.el = card;
        entry.session.el = card;
        // slide 方向覆写层依赖（样式表按 data-message-pos 前缀/后缀分派 from 值）
        card.setAttribute(MESSAGE_COLUMN_ATTR, entry.props.pos as string);
        // 卡片根基类契约（决策 21）：列内卡片查找（.autospark-message 选择器）与 slide 动画
        // 覆写层均依赖该类——内置外壳模板自带，wrapper 初始即设（classList.add 幂等）
        card.classList.add("autospark-message");
        if (entry.props.className) {
            card.classList.add(...String(entry.props.className).trim().split(/\s+/));
            entry.appliedClassName = String(entry.props.className);
        }
        // 内联样式（ADR-0077 styles）：cssText 一次性写入（追加语义——与后续引擎动画写入的
        // display/transition 属性经 setProperty 并存不互清）
        if (entry.props.styles) {
            card.style.cssText = String(entry.props.styles);
            entry.appliedStyles = String(entry.props.styles);
        }
        // 行为委托：点击（actions + 关闭钮 + 任意点击置已读）与 hover 暂停，监听挂卡片根
        entry.clickHandler = (e: Event) => this._onCardClick(entry, e);
        entry.enterHandler = () => this._pauseTimer(entry);
        entry.leaveHandler = () => this._resumeTimer(entry);
        card.addEventListener("click", entry.clickHandler);
        card.addEventListener("mouseenter", entry.enterHandler);
        card.addEventListener("mouseleave", entry.leaveHandler);

        // 列内定位（ADR-0072 level）：高级别靠列边端——top/center 系列边端在首、bottom 系列
        // 在末；同级保持到达序（不插队）。append 列尾仍是 level 相同（默认 0）时的行为
        column.insertBefore(card, this._columnInsertBefore(column, entry));
        this._elEntries.set(card, entry);

        const resolved = resolveAnimate(entry.props.animate);
        entry.leave = resolved.leave;
        this.engine.animate.enter(card, resolved.enter);
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
    private _fireAction(entry: MessageEntry, action: ResolvedMessageAction): void {
        if (action.hasValue) {
            entry.props.result = action.value;
            this._syncData(entry);
            this._mirrorReplace(entry);
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

    /** 应用新配置到 entry（icon/actions/progress 派生 + 数据域刷新 + className/styles 换装） */
    private _applyEntryConfig(entry: MessageEntry, props: MessageProps): void {
        const prevClassName = entry.appliedClassName;
        const prevStyles = entry.appliedStyles;
        entry.props = props;
        entry.icon = this._resolveIcon(props.type as MessageType, props.icon);
        entry.actions = this._resolveActions(props.actions, entry.anchor);
        if (entry.kind === "task" && props.progress != null) {
            this._applyProgress(entry, Number(props.progress));
        }
        this._syncData(entry);
        const nextClassName = props.className ? String(props.className).trim() : "";
        const nextStyles = props.styles ? String(props.styles) : "";
        if (entry.el) {
            if (prevClassName) entry.el.classList.remove(...prevClassName.split(/\s+/));
            if (nextClassName) entry.el.classList.add(...nextClassName.split(/\s+/));
            if (nextStyles !== prevStyles) entry.el.style.cssText = nextStyles; // 换装（无则清空内联）
        }
        entry.appliedClassName = nextClassName;
        entry.appliedStyles = nextStyles;
        this._mirrorReplace(entry); // 记录级变更 → items[i] 整替换（update/原地更新/恢复 upsert 共用收口）
    }

    /**
     * 记录级字段唯一写通道（决策 8）：`read` / `status` / `result` / `title` / `body` 等补丁
     * 生效 = 改记录 + 发 `message:update`（read/status 变更另发专用事件）+ 触发持久化。
     * id / kind 不可变。session 上只读 getter（写一律走此 API）。
     */
    update(id: string, patch: Partial<MessageProps>): void {
        const session = super.get(id);
        const entry = session?._entry;
        if (!session || !entry) {
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

    /** 置已读（幂等）：卡片任意点击自动调用；变更时发 `message:read` + 持久化 + 镜像替换 */
    private _setRead(entry: MessageEntry): void {
        if (entry.props.read === true) return;
        entry.props.read = true;
        this._syncData(entry);
        this._mirrorReplace(entry);
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
        for (const session of Array.from(super.values())) {
            const entry = session._entry;
            if (entry && entry.props.read !== true && (kind == null || entry.kind === kind)) {
                this._setRead(entry);
            }
        }
    }

    // ── 进度推进（task 域） ────────────────────────────────────────────

    /** 进度推进（task 域共享：session.progress(n) 与 update(id,{progress}) 同通道；每写同步镜像——与卡片现状同频） */
    private _applyProgress(entry: MessageEntry, n: number): void {
        const value = clampProgress(n);
        entry.progress = value;
        entry.props.progress = value;
        this._syncData(entry);
        this._mirrorReplace(entry);
        if (value >= 100 && !entry.completed) {
            entry.completed = true; // 完成态：进入 delayClose 倒计时（默认 3000）
            this._startTimer(entry);
        }
    }

    // ── 重显（决策 9）与 add 别名 ────────────────────────────────────

    /**
     * `add` 的别名（ADR-0077）：配置对象 / async factory 形态直转 `add(...)`（含按 kind 的
     * Session 分派返回）——「show = 让消息出现」。**string 形态保留决策 9 重显语义**：
     * 重显已隐藏记录（重新走完整展示管线：入队、进场动画、满额 delayClose 计时）；展示中 /
     * 排队中幂等 no-op；不存在或离场中 warn + null。消歧规则零歧义——字符串恒为 id、
     * 对象恒为新建，同 id 原地更新语义归 `add` / 对象形态。
     */
    show(input: MessageProps & { kind: "task" } | (() => Promise<(MessageProps & { kind: "task" }) | void | undefined>)): AutoSparkTaskMessageSession;
    show(input: MessageProps & { kind: "confirm" } | (() => Promise<(MessageProps & { kind: "confirm" }) | void | undefined>)): AutoSparkConfirmMessageSession;
    show(input: MessageProps | (() => Promise<MessageProps | void | undefined>)): AutoSparkMessageSession;
    show(id: string): AutoSparkMessageSession | null;
    show(
        input:
            | string
            | MessageProps
            | (() => Promise<MessageProps | void | undefined>),
    ): AutoSparkMessageSession | null {
        if (typeof input !== "string") return this.add(input);
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

    // ── kind 快捷方式（ADR-0077：show 统一入口上的便捷层，均强制对应 kind） ──

    /**
     * toast 快捷方式：≡ `show({ ...props, kind: 'toast' })`（默认 kind 即 'toast'，本方法
     * 显式强制——误传他 kind 一律归 toast）。anchor 显式传时生效（模板侧 `toast` action
     * 自动注入宿主元素，两者等价）。
     */
    toast(
        props: string | MessageProps | (() => Promise<MessageProps | void | undefined>),
    ): AutoSparkMessageSession {
        if (typeof props === "function") {
            // factory 形态：包一层在 resolve 后补 kind
            return this.show(async () => {
                const resolved = await props();
                return resolved == null ? undefined : { ...resolved, kind: "toast" };
            });
        }
        return this.show({ ...(typeof props === "string" ? { title: props } : props), kind: "toast" });
    }

    /**
     * confirm 快捷方式：≡ `show({ ...props, kind: 'confirm', delayClose: 0, 双钮 })`——返回
     * **Confirm 会话**（thenable：`await` 直接得 choice 应答，sticky 永不 settle / 永不 reject；
     * `yes()/no()/cancel()` 编程应答——原 Promise 糖语义由会话本体承载，ADR-0077）。
     * `{yes, no}` 可提取键（决策 22）从 props 剥离转按钮文案，不落消息 props。
     */
    confirm(
        message: string | MessageProps,
        texts?: { yes?: string; no?: string },
    ): AutoSparkConfirmMessageSession {
        const base: Record<string, any> =
            typeof message === "string" ? { title: message } : { ...message };
        const yes = texts?.yes ?? base.yes;
        const no = texts?.no ?? base.no;
        delete base.yes; // 可提取键剥离（决策 22）——不落入消息 props（否则未知键 warn）
        delete base.no;
        return this.show({
            ...(base as MessageProps),
            kind: "confirm",
            delayClose: base.delayClose ?? 0, // sticky：永不自动关
            actions: [
                { title: yes ?? "确定", value: true },
                { title: no ?? "取消", value: false },
            ],
        }) as AutoSparkConfirmMessageSession;
    }

    /**
     * task 快捷方式：≡ `show({ ...props, kind: 'task' })`——返回 **Task 会话**
     * （`start/progress/pause/resume/stop/cancel` 六方法；创建不自启、pause 闸门、
     * stop 完成态收口）。原 progressbar() 糖同义更名（名即 kind 名）。
     */
    task(
        props: string | MessageProps | (() => Promise<MessageProps | void | undefined>),
    ): AutoSparkTaskMessageSession {
        if (typeof props === "function") {
            return this.show(async () => {
                const resolved = await props();
                return resolved == null ? undefined : { ...resolved, kind: "task" };
            }) as AutoSparkTaskMessageSession;
        }
        return this.show({
            ...(typeof props === "string" ? { title: props } : props),
            kind: "task",
        }) as AutoSparkTaskMessageSession;
    }

    // ── 关闭与收口（记录 ⇄ 展示两态分离，决策 5） ──────────────────────

    /**
     * 关闭（一切移除路径终点）：`message:hide` 广播在发起时；离场动画完成后 `_teardown`
     * （摘 DOM + 双 scope 收口），**persist 决定记录存续**（ADR-0077 数值化）：`0` → 出 Map
     * （记录移除，toast 兼容语义）；`1`（会话缓冲）/`2`/`3`（持久化）→ 转「已隐藏」态
     * （记录存活，可 `show(id)` 重显——1 不持久化刷新即失）。排队中的 entry 同步出等待队列。
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

    /** 摘除卡片：解绑监听 + DOM 移除 + 双 scope 收口；persist 决定记录移除或转「已隐藏」 */
    private _teardown(entry: MessageEntry): void {
        const el = entry.el;
        if (el) {
            if (entry.clickHandler) el.removeEventListener("click", entry.clickHandler);
            if (entry.enterHandler) el.removeEventListener("mouseenter", entry.enterHandler);
            if (entry.leaveHandler) el.removeEventListener("mouseleave", entry.leaveHandler);
            el.remove();
            this._elEntries.delete(el);
        }
        entry.el = null;
        entry.session.el = null;
        // 双 scope 收口（ADR-0077 双层组合）：shell 与 kind renderer 实例 scope 各自销毁 +
        // 回收私有响应式域（overlay shell 收口同纪律）
        for (const scope of [entry.scope, entry.rendererScope]) {
            if (!scope) continue;
            const scopeId = scope.id;
            scope.destroy(); // 幂等守卫：级联已销毁时 no-op
            const scopes = (this.engine.store.state as Record<string, any>)[SCOPES_KEY] as
                | Record<string, any>
                | undefined;
            if (scopes) delete scopes[scopeId];
        }
        entry.scope = null;
        entry.rendererScope = null;
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
        if (super.has(entry.id)) this._mirrorReplace(entry);
        else this._mirrorRemove(entry.id);
        this._flushQueue(entry.props.pos as MessagePos);
        this._schedulePersist();
    }

    /** 补位：该分区列有空坑时按 level 降序（同级 FIFO）挂载等待队列（ADR-0072） */
    private _flushQueue(pos: MessagePos): void {
        const queue = this._queues.get(pos);
        if (!queue?.length) return;
        const column = getMessageColumn(this.engine, pos);
        while (queue.length && column && column.childElementCount < this._showCount) {
            let pick = 0;
            for (let i = 1; i < queue.length; i++) {
                if (queue[i].level > queue[pick].level) pick = i;
            }
            this._mount(queue.splice(pick, 1)[0], column);
        }
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
        this._clearTimer(entry);
        if (entry.confirmResolve) entry.confirmResolve = null;
        super.delete(id);
        session._entry = null; // 会话死亡（ADR-0077）：后续方法 no-op + warn，不复活
        this._mirrorRemove(id); // 硬移除（hidden 态无 teardown 路径，此处兜底）
        this._flushPersistNow();
        return true;
    }

    /**
     * 覆写 `Map.clear`：清全部存活记录（含隐藏与会话缓冲），默认带离场动画；`clear(false)`
     * 立即清空。**立即同步持久化**（ADR-0077 同 delete）。
     */
    override clear(animated: boolean = true): void {
        this._queues.clear(); // 先清等待队列（防 dismiss 同步 teardown 的补位 flush 挂载排队 entry）
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
        this._flushPersistNow();
    }

    /** engine.destroy() 收口（决策 10/18）：全部立即销毁 + 容器整体移除 + 持久化 flush */
    dispose(): void {
        this._queues.clear(); // 先清等待队列（防 dismiss 同步 teardown 的补位 flush）
        for (const session of Array.from(super.values())) {
            const entry = session._entry;
            if (entry && (entry.state === "shown" || entry.state === "queued")) {
                this._dismiss(entry, false);
            }
        }
        this._queues.clear();
        removeMessageContainer(this.engine);
        if (this._state) this._state.items.splice(0); // 镜像清空（引擎收口——Map 与镜像同步归零）
        // 持久化终态 flush（keepalive 兜底页面卸载）
        const { locals, remotes } = this._collectPersist();
        writeLocalMessages(locals, (m) => this.engine.logger.warn(m));
        void this._remote?.flush(remotes, true);
    }

    // ── 持久化与同步（决策 17/18） ─────────────────────────────────────

    /** 收集两通道的序列化全量（按 persist 级别分桶：2 → local、3 → remote；1 会话缓冲不入桶） */
    private _collectPersist(): { locals: Record<string, any>[]; remotes: Record<string, any>[] } {
        const locals: Record<string, any>[] = [];
        const remotes: Record<string, any>[] = [];
        for (const session of Array.from(super.values())) {
            const entry = session._entry;
            if (!entry) continue;
            const serialized = serializeMessage(entry.props);
            if (entry.props.persist === MESSAGE_PERSIST.LOCAL) locals.push(serialized);
            else if (entry.props.persist === MESSAGE_PERSIST.REMOTE) remotes.push(serialized);
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

    /** 立即同步持久化（ADR-0077）：remove/delete/clear 后调——local 同步写 + remote 立即
     *  flush 全量覆盖（防抖合并的已排程请求被立即版覆盖，「删干净」闭环——刷新不复活） */
    private _flushPersistNow(): void {
        if (!this.enabled) return;
        const { locals, remotes } = this._collectPersist();
        writeLocalMessages(locals, (m) => this.engine.logger.warn(m));
        void this._remote?.flush(remotes, true);
    }

    /**
     * 恢复记录（restore/load 共用）：**只入记录不弹**（决策 17）——创建为「已隐藏」态存活
     * （closed 由恢复策略统一置位，不读载荷），需要时 `show(id)` 重显；按 id 去重覆盖
     * （服务端 / 存储为准）、新 id 追加。persist 按存储介质反推（ADR-0072：载荷不携带）。
     * 序列化态经合并链归一（raw 值最优先）；字符串 action 留存原始名（挂载时重查 action 表）。
     */
    private _restoreRecords(
        list: Record<string, any>[],
        medium: "local" | "remote",
    ): AutoSparkMessageSession[] {
        const restored: AutoSparkMessageSession[] = [];
        for (const raw0 of list) {
            if (raw0 == null || typeof raw0 !== "object") continue;
            // 存续策略按介质反推（ADR-0077 数值化：local → 2、remote → 3）
            const raw = {
                ...raw0,
                persist: medium === "local" ? MESSAGE_PERSIST.LOCAL : MESSAGE_PERSIST.REMOTE,
            } as MessageProps;
            const id = raw.id != null && raw.id !== "" ? String(raw.id) : `message-${++this._autoId}`;
            const existing = super.get(id)?._entry;
            if (existing) {
                // upsert：记录 props 以恢复数据为准（保持当前展示状态）
                const merged = this._mergeProps({ ...raw, id }).merged;
                this._applyEntryConfig(existing, merged as MessageProps);
                restored.push(existing.session);
                continue;
            }
            const { merged, kind } = this._mergeProps({ ...raw, id });
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
                state: "hidden", // 恢复只入记录不弹（closed 由策略置位——镜像经 _mirrorAdd 落 true）
                scope: null,
                rendererScope: null,
                el: null,
                anchor: this._resolveAnchor(merged.anchor),
                session: this._createSession(),
                confirmResolve: null,
                timer: null,
                deadline: null,
                pausedRemaining: null,
                leave: null,
                clickHandler: null,
                enterHandler: null,
                leaveHandler: null,
                appliedClassName: "",
                appliedStyles: "",
                createdAt: Date.now(),
                level: normalizeLevel(merged.level),
            };
            entry.session.id = id;
            entry.session.kind = kind;
            entry.session._entry = entry;
            super.set(id, entry.session);
            this._mirrorAdd(entry);
            restored.push(entry.session);
        }
        return restored;
    }

    /**
     * 从服务器拉取消息（决策 17）：`fetch(GET url)`，响应体约定为消息 JSON 数组；按 id 覆盖
     * 合并、新 id 追加；**只入记录不弹**（需要时 `show(id)`）；失败 warn + resolve 空数组
     * （不 reject 中断调用方）。传输配置现读 state 的 `fetchOptions`（ADR-0072）。
     */
    async load(url?: string): Promise<AutoSparkMessageSession[]> {
        const fetchOptions = this._options.fetchOptions ?? null;
        const target = url ?? fetchOptions?.url;
        if (!target || typeof fetch === "undefined") {
            this.engine.logger.warn(
                "engine.messages: load 缺少 url（参数与 options.messages.fetchOptions.url 均未配置），已跳过",
            );
            return [];
        }
        try {
            const init = fetchOptions ? { ...fetchOptions } : {};
            delete (init as any).url;
            const resp = await fetch(target, init);
            if (!resp.ok) {
                this.engine.logger.warn(`engine.messages: load 失败（HTTP ${resp.status}），已忽略`);
                return [];
            }
            const data = await resp.json();
            if (!Array.isArray(data)) {
                this.engine.logger.warn("engine.messages: load 响应体格式异常（非数组），已忽略");
                return [];
            }
            const restored = this._restoreRecords(data, "remote");
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
        const detail = { message: entry.session as AutoSparkMessageSession, el: entry.el, ...extra };
        this.engine.emit(type, detail as any);
        entry.el?.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
        if (type === "message:action" && entry.anchor) {
            entry.anchor.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
        }
        // 迁移期双发（决策 3）：kind='toast' 的展示状态转换照发旧事件
        if (entry.kind === "toast" && (type === "message:show" || type === "message:hide")) {
            const legacy = type === "message:show" ? "toast:show" : "toast:hide";
            const legacyDetail = { toast: entry.session as any, el: entry.el };
            this.engine.emit(legacy as any, legacyDetail as any);
            entry.el?.dispatchEvent(new CustomEvent(legacy, { detail: legacyDetail, bubbles: true }));
        }
    }

    // ── maxLen 淘汰（决策 6） ──────────────────────────────────────────

    /** 存活记录超限 FIFO 丢最旧（不豁免未读 / 展示中；新建 entry 本身不参与候选。
     *  persist=1 会话缓冲记录同受淘汰——ADR-0077「缓冲区超出清除」复用 maxLen 单一上限） */
    private _evictOverflow(keep: MessageEntry): void {
        const max = this._maxLen;
        if (max <= 0) return;
        while (super.size > max) {
            let oldest: MessageEntry | null = null;
            for (const session of super.values()) {
                const e = session._entry;
                if (e && e !== keep && (oldest == null || e.createdAt < oldest.createdAt)) oldest = e;
            }
            if (!oldest) break;
            if (oldest.state === "shown") this._dismiss(oldest, false);
            if (oldest.state === "queued") this._dequeue(oldest);
            oldest.state = "closed";
            this._clearTimer(oldest);
            super.delete(oldest.id);
            this._mirrorRemove(oldest.id);
        }
    }

    // ── 工具 ──────────────────────────────────────────────────────────

    /** 数据域刷新（响应式活体红利：改 data 域 props 驱动 x-html / 绑定自动更新；双层同权——
     *  shell 与 kind renderer 各自实例 data 域同步刷新，ADR-0077） */
    private _syncData(entry: MessageEntry): void {
        const props = this._buildInjectProps(entry);
        if (entry.scope?.data) Object.assign(entry.scope.data, props);
        if (entry.rendererScope?.data) Object.assign(entry.rendererScope.data, props);
    }

    /**
     * 会话工厂（ADR-0077，闭包对象）：**运行时全集方法**（基类 show/hide/remove + task 域
     * 六方法 + confirm 域 yes/no——`add()` 返回时按 kind 类型窄化，运行时同构）。el / id
     * 可变、closed 走 entry 状态；`_entry` 为 null 即死亡（remove 后）——行为方法 no-op + warn
     * 不复活（`_cancelled` 仅 factory 挂起期语义：hide = 取消）。
     */
    private _createSession(): SessionImpl {
        const manager = this;
        const session: SessionImpl = {
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
            show() {
                const entry = this._entry;
                if (!entry) {
                    manager.engine.logger.warn(
                        `engine.messages: 会话已死亡（记录已 remove），show() 无效（ADR-0077）`,
                    );
                    return;
                }
                if (entry.state === "hidden") {
                    entry.state = "queued";
                    manager._displayEntry(entry);
                }
            },
            hide() {
                const entry = this._entry;
                if (entry && (entry.state === "shown" || entry.state === "queued")) {
                    manager._dismiss(entry, true); // 动画关闭（幂等——状态守卫在 _dismiss 内）
                } else if (!entry) {
                    this._cancelled = true; // factory 挂起期：取消（resolve 后不显示）
                }
            },
            remove() {
                if (!this._entry) {
                    manager.engine.logger.warn(
                        `engine.messages: 会话已死亡（记录已 remove），remove() 无效（ADR-0077）`,
                    );
                    return;
                }
                manager.delete(this.id); // 硬移除 + 立即同步持久化（含远端全量覆盖）
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
                    manager._dismiss(entry, true); // 中止：立即关（无完成态）——confirm 域同语义
                }
            },
            yes() {
                manager._fireConfirmChoice(this, true);
            },
            no() {
                manager._fireConfirmChoice(this, false);
            },
        };
        return session;
    }

    /**
     * Confirm 会话选择（ADR-0077）：`yes()/no()` ≡ 点击对应 value 按钮——沿 `_fireAction`
     * 同一闭环（value 写 result → `message:action` 广播 → confirm resolve → hide），
     * 事件观察者对编程触发与 DOM 点击无感知差异。无匹配 action（如 actions 被自定义清空）
     * → warn + no-op。
     */
    private _fireConfirmChoice(session: SessionImpl, value: boolean): void {
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
                `engine.messages: kind='confirm' 会话缺少 value=${value} 的按钮（actions 已被自定义），${value ? "yes()" : "no()"} 无效（ADR-0077）`,
            );
            return;
        }
        this._fireAction(entry, action);
    }
}

/** 进度值 clamp 到 [0,100]（决策 12） */
function clampProgress(n: any): number {
    const v = Number(n);
    if (!Number.isFinite(v)) return 0;
    return Math.min(100, Math.max(0, Math.round(v)));
}

/** level 归一（ADR-0072）：非有限数字归 0（默认级） */
function normalizeLevel(n: any): number {
    const v = Number(n);
    return Number.isFinite(v) ? v : 0;
}

/** 全关 / 无效调用返回的死会话（共享单例：行为方法无效、closed 恒真——ADR-0077） */
const DEAD_SESSION: AutoSparkMessageSession = {
    id: "",
    kind: "toast",
    el: null,
    show() {},
    hide() {},
    remove() {},
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
