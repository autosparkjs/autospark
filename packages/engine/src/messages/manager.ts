import type { AutoSpark } from "../engine";
import { MESSAGES_KEY } from "../engine";
import { shallow } from "autostore";
import { resolveAnimate } from "../animate";
import { ComponentInstance } from "../component-instance";
import { removeMessageContainer } from "./container";
import { MESSAGE_COLUMN_GAP } from "./styles";
import { MessageRecords } from "./records";
import type { MessageEntry } from "./entry";
import { MessageQueue } from "./queue";
import { MessagePersistence, readLocalMessages } from "./storage";
import { applyCardSizes, assembleCard, buildInjectProps, unmountCard } from "./assembly";
import { mergeMessageProps, settleMessageLevel, validatePos, validatePersist, type MessageMergeContext } from "./props";
import { resolveTypeDefaults } from "./presets";
import {
    parseMessageProps,
    messageLevelName,
    MESSAGE_DEFAULTS,
    MESSAGE_LEVEL_ICONS,
    MESSAGE_PERSIST,
    type AutoSparkMessageRecord,
    type AutoSparkMessagesOptions,
    type AutoSparkMessagesState,
    type AutoSparkAction,
    type MessageOptions,
    type MessagePos,
    type MessageProps,
    type ResolvedMessageAction,
} from "./types";

export type { MessageEntry } from "./entry";

/** factory 函数类型（ADR-0089：注入 **组件实例**——add 即建，挂起期 methods/data 全程可用） */
export type MessageSessionFactory = (instance: ComponentInstance) => Promise<MessageProps | void | undefined>;

/**
 * MessageManager：全局消息引擎级子系统（ADR-0071 / 0077 / 0083 / 0088 → **ADR-0089 type
 * 组件化**）——编排门面：Map 语义 + API 面 + 事件双通道 + 可见性切换（display 模型）+
 * 组件实例化编排 + 计时与持久化调度。
 *
 * **add 恒返回组件实例**（ComponentInstance——`data` 响应式视图 / `methods` 直调 / `props`
 * 别名；唯一返回物）。可见性纯样式切换：装配即挂 DOM（display:none 挂起/排队）→ 显示 →
 * persist≥1 关闭转隐藏（display:none 保留实例）/ persist=0 与 remove·淘汰真销毁。
 *
 * - **props.ts**——五层合并链 + 归一校验（type 种子经 ctx.typeDefaults 注入，ADR-0089 决策九）；
 * - **records.ts**——entry 构建 / `$messages` 镜像（纯 record 化，ADR-0089 决策七之三）/
 *   maxLen 淘汰 / 恢复重建；
 * - **assembly.ts**——卡片装配管线（双层装配 + 约定键 watch 联动，ADR-0089）；
 * - **queue.ts**——每 pos 一实例（容量判定 + FIFO 出队；display 切换——补位挂载机制退役）；
 * - **storage.ts**——持久化全责（分桶收集 / 调度 / 删后即刷 / save·load）；
 * - **types/**——内置 type 组件族（一 type 一组件，ADR-0089）。
 *
 * - **Map 语义**（决策 10）：`Map<string, ComponentInstance>`，键恒 string id；可枚举范围 =
 *   全部存活记录（展示中 + 已隐藏）；`delete(id)` = 硬移除（persist 记录一并删 + 立即同步）。
 * - **记录 ⇄ 展示两态分离**（决策 5）：`persist` 0（默认）关闭即删；`1` 会话缓冲 / `2`/`3`
 *   （local/remote）关闭转「已隐藏」态（display:none 保留实例，`show(id)` 直切可见）。
 * - **原地更新**（决策 7）：同 id 重复 add = 换展示 props（注水刷新）+ 重置计时。
 */
export class MessageManager extends Map<string, ComponentInstance> {
    readonly engine: AutoSpark<any>;
    /** 特性开关（options.messages !== false）；false 时构造即短路 */
    readonly enabled: boolean;

    /** 记录域（entry 构建 / 镜像 / 淘汰 / 恢复） */
    readonly records: MessageRecords;
    /** 持久化域（收集 / 调度 / 即刷 / save·load） */
    readonly storage: MessagePersistence;

    /** 全部运行时 entry 的私有注册表（id → entry；Map 公共面 value = 组件实例） */
    private _entries = new Map<string, MessageEntry>();

    /** entry 内部取用（协作部件口——storage/records/queue 经 manager 实例回触） */
    _entryOf(id: string): MessageEntry | undefined {
        return this._entries.get(id);
    }

    /**
     * $messages 状态容器（ADR-0072；`messages: false` 时恒 null）。options 真身：
     * manager 运行时一律经 `_options` 现读 state——state 即配置唯一存放地。
     */
    private _state: AutoSparkMessagesState | null = null;

    /** 协作部件读取口（records / queue / storage——ADR-0088 模块拆分） */
    get _stateRef(): AutoSparkMessagesState | null {
        return this._state;
    }

    /** 生效全局配置真身读取（唯一出口；enabled 时恒可用；协作部件同用） */
    get _options(): AutoSparkMessagesOptions {
        return this._state!.options;
    }

    /** anchor / actions 的全局默认（ADR-0072 边界键）：构造期私有固化——DOM 引用与函数值不入 state */
    private _frozen: { anchor?: MessageProps["anchor"]; actions?: AutoSparkAction[] } = {};

    /** 用户在 options.messages 显式配置过的键名（构造期兜底前快照——sticky 关闭钮显式性判定基准） */
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
        this._frozen = { anchor: user.anchor, actions: user.actions };
        this._globalDeclared = new Set(Object.keys(user));
        this.records = new MessageRecords(this);
        this.storage = new MessagePersistence(this);
        if (!this.enabled) return; // messages: false——不注入保留键、不恢复
        // $messages 保留键注入（永不整体替换容器）：options 真身 = 内置默认 < 用户配置
        // （剥 anchor/actions 两边界键）；items 纯 record 化（ADR-0089 决策七之三）
        const effective: Record<string, any> = {};
        for (const key of Object.keys(user)) {
            if (key !== "anchor" && key !== "actions") effective[key] = (user as any)[key];
        }
        for (const key of Object.keys(MESSAGE_DEFAULTS)) {
            if (effective[key] === undefined) effective[key] = (MESSAGE_DEFAULTS as any)[key];
        }
        const shallowDepth: 0 | 1 = Number(effective.shallow) === 0 ? 0 : 1;
        (engine.store.state as Record<string, any>)[MESSAGES_KEY] = {
            items: shallow<AutoSparkMessageRecord[], 0 | 1>([], shallowDepth) as AutoSparkMessagesState["items"],
            options: effective as AutoSparkMessagesOptions,
        };
        this._state = (engine.store.state as Record<string, any>)[MESSAGES_KEY] as AutoSparkMessagesState;
        // local 持久化的启动恢复（决策 18）：只入记录（隐藏态 display:none）、不自动重弹
        this.records.restoreRecords(
            readLocalMessages((m) => this.engine.logger.warn(m)),
            "local",
        );
    }

    // ── 显示入口（决策 7 三态入参；ADR-0089 恒返回组件实例） ─────────────

    /**
     * 添加一条消息（字符串简写 ≡ `{ title }`；factory resolve `undefined` → 静默销毁）。
     * **恒返回组件实例**（add 即装配挂 DOM——display:none 挂起/排队态）。同 id = 原地更新。
     *
     * 第二参（ADR-0089 决策八）：**factory 形态的类型声明 + 初始 props**——`'task'`（type 名）
     * 或 `{ type: 'task', canCancel: true, … }`（对象形态携初始配置，实例化同刻注水——
     * `instance.data._abort.signal` 等在 factory 闭包内即可用）。非 factory 形态携带 → warn 忽略。
     */
    add(input: string | MessageProps | MessageSessionFactory, second?: string | MessageProps): ComponentInstance | null {
        if (!this.enabled) {
            this.engine.logger.warn("engine.messages: 消息特性已通过 options.messages: false 关闭，调用被忽略");
            return null;
        }
        if (typeof input === "function") return this._addAsync(input, second);
        if (second != null) {
            this.engine.logger.warn(
                `engine.messages: add(..., ${typeof second === "string" ? `"${second}"` : "props"}) 第二参仅对 factory 形态生效（对象形态请用 type 字段），已忽略`,
            );
        }
        const parsed = parseMessageProps(input, (m) => this.engine.logger.warn(m));
        if (!parsed) return null;
        return this._enqueueProps(parsed);
    }

    /**
     * async factory 形态（ADR-0089 决策八——**真实例，预句柄/缓存机制退役**）：同步装配
     * （display:none 挂起态）并把**组件实例**注入 factory——挂起期 methods/data 全程可用
     * （`progress()` 直写 data 域）。resolve props = 初始展示配置（走注水刷新——运行约定键
     * 剥离不回拨闭包已推值；`undefined` → 静默销毁；缺 title → warn 销毁）。**主用法 = 立即
     * return**（即时卡 + 后台驱动：长任务不 await 主线，`inst` 闭包存活持续驱动——
     * 「后台静默跑完才弹卡」不是目标形态，ADR-0083 二次修订沿用）。
     */
    private _addAsync(factory: MessageSessionFactory, second?: string | MessageProps): ComponentInstance | null {
        const seedProps: MessageProps =
            second != null && typeof second === "object" ? second : ({} as MessageProps);
        const declared =
            second == null ? "toast" : typeof second === "string" ? String(second).trim() || "toast" : String(seedProps.type ?? "").trim() || "toast";
        const { merged, type } = this._mergeProps({ ...seedProps, type: declared });
        validatePos(merged, (m) => this.engine.logger.warn(m));
        this._settleLevel(merged);
        validatePersist(merged, (m) => this.engine.logger.warn(m));
        const id = merged.id != null && merged.id !== "" ? String(merged.id) : `message-${++this._autoId}`;
        merged.id = id; // 写回生效配置（注水面 / this.props.id 数据源——ADR-0089 无 session 回填通道）
        merged.type = type; // 同上（instance.type / this.props.type 数据源）
        const entry = this.records.createEntry(merged as MessageProps, id, type);
        if (!this._materialize(entry)) return null; // 装配 + 入表（SSR 无容器 → null）
        const instance = entry.instance;
        void (async () => {
            try {
                const props = await factory(instance!);
                if (!this._entries.has(id) || entry.state === "closed") return; // 挂起期 hide()/cancel() = 丢弃
                if (props == null) {
                    this._destroyEntry(entry); // 条件通知：内容不就绪，静默销毁
                    return;
                }
                const parsed = parseMessageProps(
                    typeof props === "string" ? props : (props as MessageProps),
                    (m) => this.engine.logger.warn(m),
                );
                if (!parsed || !String((parsed as MessageProps).title ?? "").trim()) {
                    this.engine.logger.warn("engine.messages: factory 结果缺少 title（空消息），已销毁");
                    this._destroyEntry(entry);
                    return;
                }
                // type 锁定（ADR-0083 修订）：显式声明的 type 优先——组件已按声明实例化，不可变
                if (parsed.type != null && String(parsed.type) !== declared) {
                    this.engine.logger.warn(
                        `engine.messages: factory 声明 type "${declared}" 与 return props type "${parsed.type}" 不一致，以声明为准（类型不可变）`,
                    );
                    parsed.type = declared as MessageProps["type"];
                }
                const fresh = this._mergeProps({ ...parsed, id, type: declared }).merged;
                this._applyEntryConfig(entry, fresh as MessageProps);
                entry.state = "queued";
                this._emit("message:add", entry);
                this._displayEntry(entry);
                this.storage.schedule();
            } catch (e: any) {
                this.engine.logger.warn(`engine.messages: factory 执行失败，已销毁: ${e?.message ?? e}`);
                this._destroyEntry(entry);
            }
        })();
        return instance;
    }

    /** entry 物化：装配（display:none）+ choice 绑定 + 入表 + 镜像 + 淘汰；失败（SSR）false。
     *  （`_` 内部面——records 恢复路径共用） */
    _materialize(entry: MessageEntry): boolean {
        if (!assembleCard(this, entry)) return false;
        this._bindChoice(entry);
        this._entries.set(entry.id, entry);
        super.set(entry.id, entry.instance!);
        this.records.mirrorAdd(entry);
        this.records.evictOverflow(entry);
        return true;
    }

    /** confirm choice 闭环（ADR-0077/0083）：choice promise + 实例附加 then（thenable——await 实例即得应答） */
    private _bindChoice(entry: MessageEntry): void {
        if (entry.type !== "confirm" || !entry.instance) return;
        const choice = new Promise<any>((resolve) => {
            entry.confirmResolve = resolve;
        });
        Object.defineProperty(entry.instance, "then", {
            value: choice.then.bind(choice),
            configurable: true,
        });
    }

    /** type 种子默认缓存（ADR-0092）：type 名 → 组件 defaults（undefined = 已查明无种子层） */
    private _typeDefaultsCache = new Map<string, Record<string, any> | undefined>();
    /**
     * type 种子默认视图（ADR-0089 决策九 + ADR-0092 模板化）：种子随组件声明（各 type .html 的
     * `<script setup>` defaults 段），经组件表懒解析提取（resolveTypeDefaults）+ 本缓存去重——
     * 用户同名覆盖 type 组件时覆盖组件的 defaults 自然生效。Proxy 保持 mergeMessageProps 的
     * `typeDefaults[type]` 消费形态不变。
     */
    private readonly _typeDefaults: Record<string, Record<string, any>> = new Proxy(
        {} as Record<string, Record<string, any>>,
        {
            get: (_t, type: string | symbol): Record<string, any> | undefined => {
                if (typeof type !== "string") return undefined;
                if (!this._typeDefaultsCache.has(type)) {
                    this._typeDefaultsCache.set(type, resolveTypeDefaults(this.engine, type));
                }
                return this._typeDefaultsCache.get(type);
            },
        },
    );

    /** 合并链上下文（props.ts mergeMessageProps 的 manager 侧入参组装——type 种子经此注入） */
    private _mergeCtx(): MessageMergeContext {
        return {
            opts: this.enabled ? this._options : ({} as AutoSparkMessagesOptions),
            frozen: this._frozen,
            globalDeclared: this._globalDeclared,
            typeDefaults: this._typeDefaults,
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

    /** 入队 / 原地更新（同 id）唯一入口：合并链 → 校验 → 已存在则更新，否则物化 + 容量判定 */
    private _enqueueProps(userProps: MessageProps): ComponentInstance | null {
        if (!String(userProps.title ?? "").trim()) {
            this.engine.logger.warn("engine.messages: title 为空，调用被忽略");
            return null;
        }
        const { merged, type } = this._mergeProps(userProps);
        validatePos(merged, (m) => this.engine.logger.warn(m));
        this._settleLevel(merged);
        validatePersist(merged, (m) => this.engine.logger.warn(m));
        const id = merged.id != null && merged.id !== "" ? String(merged.id) : `message-${++this._autoId}`;
        merged.id = id; // 写回生效配置（注水面数据源——ADR-0089 无 session 回填通道）
        merged.type = type; // 同上（instance.type / this.props.type 数据源）

        // 同 id 处理（决策 5/7）：queued/shown → 原地更新；hidden/closed → 换新配置重显
        const existing = this._entries.get(id);
        if (existing) {
            if (existing.state === "shown" || existing.state === "queued") {
                this._updateInPlace(existing, userProps);
                return this.get(id) ?? null;
            }
            const fresh = this._mergeProps({ ...merged, id }).merged;
            this._applyEntryConfig(existing, fresh as MessageProps);
            existing.state = "queued";
            this._displayEntry(existing);
            this.storage.schedule();
            return this.get(id) ?? null;
        }

        const entry = this.records.createEntry(merged as MessageProps, id, type);
        if (!this._materialize(entry)) return null;
        this._emit("message:add", entry);
        this._displayEntry(entry);
        this.storage.schedule();
        return entry.instance;
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
    _resolveIcon(level: number, explicit?: string): string {
        if (explicit) return explicit;
        if (level === 0) return "";
        const name = messageLevelName(level as any) as Exclude<ReturnType<typeof messageLevelName>, "none">;
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

    /** actions 预解析（决策 13/14）：字符串查 action 表（anchor 沿 scope 链），对象形态解析 value/handle/hide */
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
        // ADR-0088 整包直传：补丁键全量并入；id / type / pos / offset 恒不变
        for (const key of Object.keys(userProps)) {
            if (key === "id" || key === "type" || key === "pos" || key === "offset") continue;
            merged[key] = (userProps as any)[key];
        }
        validatePos(merged, (m) => this.engine.logger.warn(m));
        this._applyEntryConfig(entry, merged as MessageProps);
        if (entry.state === "shown") this._startTimer(entry); // 重置满额计时
        this._emit("message:update", entry);
        this.storage.schedule();
    }

    /**
     * 应用新配置到 entry（level 归一 + 业务键同步 record + icon/actions 派生 + 注水刷新 +
     * className/styles 换装）。**注水面剥运行约定键**（progress/paused/completed——运行态唯
     * 组件 data 域是尊，闭包已推值不被 return props / update 补丁回拨，ADR-0089 决策八）；
     * `progress` 显式补丁经组件 method 应用（paused/completed 守卫内建）。
     */
    _applyEntryConfig(entry: MessageEntry, props: MessageProps): void {
        const prevClassName = entry.appliedClassName;
        const prevStyles = entry.appliedStyles;
        this._settleLevel(props as Record<string, any>);
        entry.props = props;
        for (const key of ["title", "description", "owner", "status", "result", "link", "read"] as const) {
            if (key in props) (entry.record as any)[key] = (props as any)[key];
        }
        entry.record.level = props.level as any;
        this.records.touch(entry);
        entry.icon = this._resolveIcon(entry.record.level ?? 0, props.icon);
        entry.actions = this._resolveActions(props.actions, entry.anchor);
        // 注水刷新（数据域响应式活体红利——shell 与 type 组件两层同权）
        const inject = buildInjectProps(this, entry);
        if (entry.scope) Object.assign((entry.scope as any)._data ?? {}, inject);
        if (entry.instance) Object.assign(entry.instance.data, inject);
        // progress 补丁通道（update(id, { progress }) 同路——组件 method 守卫内建）
        if (props.progress != null && entry.instance) {
            entry.instance.methods.progress?.(Number(props.progress));
        }
        const nextClassName = props.className ? String(props.className).trim() : "";
        const nextStyles = props.styles ? String(props.styles) : "";
        if (entry.el) {
            if (prevClassName) entry.el.classList.remove(...prevClassName.split(/\s+/));
            if (nextClassName) entry.el.classList.add(...nextClassName.split(/\s+/));
            if (nextStyles !== prevStyles) {
                entry.el.style.cssText = nextStyles;
                applyCardSizes(entry.el, props);
            }
            entry.el.setAttribute("data-message-level", messageLevelName(entry.record.level ?? 0));
        }
        entry.appliedClassName = nextClassName;
        entry.appliedStyles = nextStyles;
        this.records.mirrorReplace(entry); // 记录级变更 → 镜像整替换（纯 record 面）
    }


    /**
     * 记录级字段唯一写通道（决策 8）：`read` / `status` / `result` / `title` / `level` 等补丁
     * 生效 = 改记录 + 发 `message:update` + 触发持久化。id / type 不可变。
     */
    update(id: string, patch: Partial<MessageProps>): void {
        const entry = this._entries.get(id);
        if (!entry || !this._entries.has(id)) {
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
        this.records.touch(entry);
        if (entry.instance) entry.instance.data.read = true;
        this.records.mirrorReplace(entry);
        this._emit("message:read", entry);
        this.storage.schedule();
    }

    /** 编程式置已读 */
    markRead(id: string): void {
        const entry = this._entries.get(id);
        if (!entry) {
            this.engine.logger.warn(`engine.messages: markRead("${id}") 未命中存活记录，已忽略`);
            return;
        }
        this._setRead(entry);
    }

    /** 按 type 批量置已读（缺省全量） */
    markAllRead(type?: string): void {
        for (const entry of Array.from(this._entries.values())) {
            if (entry.props.read !== true && (type == null || entry.type === type)) {
                this._setRead(entry);
            }
        }
    }

    // ── 展示编排（display 模型，ADR-0089 决策四；queue 分区收口） ───────

    /** 分区队列取（或懒建） */
    private _queueOf(pos: MessagePos): MessageQueue {
        let q = this._queues.get(pos);
        if (!q) {
            q = new MessageQueue(this, pos);
            this._queues.set(pos, q);
        }
        return q;
    }

    /** 容量判定入口（queue.offer 收口：有坑 display 切换显示 / 满员排队） */
    _displayEntry(entry: MessageEntry): void {
        this._queueOf(entry.props.pos as MessagePos).offer(entry);
    }

    /**
     * 显示（display 切换 + 进场动画 + 计时启动 + visible 约定键）——queue 与 show(id) 共用。
     */
    _showEntry(entry: MessageEntry): void {
        if (entry.state === "shown") return;
        if (entry.el) entry.el.style.display = "";
        entry.state = "shown";
        if (entry.instance) {
            entry.instance.data.visible = true;
            entry.instance.data.closed = false;
        }
        if (entry.el) this.engine.animate.enter(entry.el, resolveAnimate(entry.props.animate).enter);
        this._startTimer(entry);
        this._emit("message:show", entry);
    }

    /** 出等待队列（关闭前置——防止补位显示已关闭 entry） */
    _dequeue(entry: MessageEntry): void {
        this._queues.get(entry.props.pos as MessagePos)?.remove(entry);
    }

    /** 补位：该分区有空坑时按队首 FIFO 显示等待队列 */
    _flushQueue(pos: MessagePos): void {
        this._queueOf(pos).flush();
    }

    // ── 重显（决策 9）与 add 别名 ────────────────────────────────────

    /**
     * `add` 的别名：配置对象 / async factory 直转 `add(...)`（含第二参透传）。**string 形态
     * 保留重显语义**：已隐藏记录 display 直切可见（重走进场动画与计时）；展示中幂等 no-op；
     * 不存在 warn + null。
     */
    show(input: string | MessageProps | MessageSessionFactory, second?: string | MessageProps): ComponentInstance | null {
        if (typeof input !== "string") return this.add(input, second);
        if (second != null) {
            this.engine.logger.warn(`engine.messages: show("${input}", ...) 第二参仅对 factory 形态生效，已忽略`);
        }
        const entry = this._entries.get(input);
        if (!entry || entry.state === "closed") {
            this.engine.logger.warn(`engine.messages: show("${input}") 未命中存活记录（persist=0 的已关消息已销毁）`);
            return null;
        }
        if (entry.state === "shown" || entry.state === "queued") return this.get(input) ?? null; // 幂等
        entry.state = "queued";
        this._displayEntry(entry);
        return this.get(input) ?? null;
    }

    /** 关闭（走离场动画；幂等；排队/挂起中 = 出队后收口）——base 组件 methods 的公共落点 */
    hide(id: string): void {
        const entry = this._entries.get(id);
        if (entry && entry.state !== "closed" && entry.state !== "hidden") {
            this._dismiss(entry, true);
        }
    }

    // ── type 快捷方式（ADR-0077：show 统一入口上的便捷层，均强制对应 type） ──

    /** toast 快捷方式：≡ `show({ ...props, type: 'toast' })` */
    toast(props: string | MessageProps | MessageSessionFactory): ComponentInstance | null {
        if (typeof props === "function") {
            return this.show(async (instance) => {
                const resolved = await props(instance);
                return resolved == null ? undefined : { ...resolved, type: "toast" };
            }, "toast");
        }
        const initial = { ...(typeof props === "string" ? { title: props } : props), type: "toast" };
        return this.show(initial);
    }

    /**
     * confirm 快捷方式：≡ `show({ ...props, type: 'confirm', delayClose: 0, 双钮 })`——返回
     * **thenable 组件实例**（`await` 直接得 choice 应答，sticky 永不 settle；`yes()/no()`
     * methods 编程应答）。`{yes, no}` 可提取键（决策 22）从 props 剥离转按钮文案。
     */
    confirm(message: string | MessageProps, texts?: { yes?: string; no?: string }): ComponentInstance | null {
        const base: Record<string, any> = typeof message === "string" ? { title: message } : { ...message };
        const yes = texts?.yes ?? base.yes;
        const no = texts?.no ?? base.no;
        delete base.yes; // 可提取键剥离（决策 22）——不落入消息 props
        delete base.no;
        return this.show({
            ...(base as MessageProps),
            type: "confirm",
            delayClose: base.delayClose ?? 0, // sticky：永不自动关
            actions: (base.actions?.length ? base.actions : undefined) ?? [
                { title: yes ?? "确定", value: true },
                { title: no ?? "取消", value: false },
            ],
        });
    }

    /** task 快捷方式：≡ `show({ ...props, type: 'task' })`——返回 task 组件实例（methods 直调） */
    task(props: string | MessageProps | MessageSessionFactory): ComponentInstance | null {
        if (typeof props === "function") {
            return this.show(async (instance) => {
                const resolved = await props(instance);
                return resolved == null ? undefined : { ...resolved, type: "task" };
            }, "task");
        }
        const initial = { ...(typeof props === "string" ? { title: props } : props), type: "task" };
        return this.show(initial);
    }

    // ── 关闭与收口（display 模型：persist 分流，ADR-0089 决策四） ────────

    /**
     * 关闭（一切移除路径终点）：`message:hide` 广播在发起时；离场动画（收拢沿用）完成后按
     * persist 分流——`≥1` 转「已隐藏」（display:none **保留实例**，closed 约定键置位）；
     * `0` 真销毁（`_destroyEntry`）。排队中的 entry 同步出等待队列。
     */
    _dismiss(entry: MessageEntry, animated: boolean): void {
        if (entry.state === "closed" || entry.state === "hidden") return;
        if (entry.state === "queued") this._dequeue(entry);
        entry.state = "closed";
        this._clearTimer(entry);
        if (entry.instance) {
            entry.instance.data.visible = false;
        }
        this._emit("message:hide", entry);
        const finish = () => this._settleClose(entry);
        const leave = animated ? entry.leave : null;
        const el = entry.el;
        if (leave && el && el.style.display !== "none") {
            // 收拢起始帧（先于 leave）：锁定自然高度（happy-dom offsetHeight 恒 0 无害）
            el.style.boxSizing = "border-box";
            el.style.height = `${el.offsetHeight}px`;
            el.style.overflow = "hidden";
            const started = this.engine.animate.leave(el, leave, finish);
            if (!started) {
                finish();
            } else {
                // 收拢目标帧：布局高度平滑归零、兄弟随流上移（ADR-0068 离场收拢沿用）
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

    /** 关闭收口（动画完成后）：persist ≥ 1 转隐藏（display:none 保留）；否则真销毁 */
    private _settleClose(entry: MessageEntry): void {
        const persist = Number(entry.props.persist ?? MESSAGE_PERSIST.NONE);
        this._queueOf(entry.props.pos as MessagePos).releaseShown(entry.id);
        if (persist >= MESSAGE_PERSIST.SESSION && persist <= MESSAGE_PERSIST.REMOTE) {
            entry.state = "hidden"; // 记录存活（display:none 保留实例，show(id) 直切可见）
            if (entry.el) entry.el.style.display = "none";
            if (entry.instance) {
                entry.instance.data.closed = true;
                entry.instance.data.visible = false;
            }
        } else {
            this._destroyEntry(entry); // toast 兼容语义：关闭即销毁
        }
        this._flushQueue(entry.props.pos as MessagePos);
        this.storage.schedule();
    }

    /** 真销毁（remove/淘汰/persist=0 关闭/factory 丢弃）：摘 DOM + 双 scope 收口 + 出表 + 镜像删。
     *  （`_` 内部面——records 淘汰路径共用） */
    _destroyEntry(entry: MessageEntry): void {
        if (entry.state === "queued") this._dequeue(entry);
        entry.state = "closed";
        this._clearTimer(entry);
        entry.confirmResolve = null;
        unmountCard(this, entry);
        this._entries.delete(entry.id);
        super.delete(entry.id);
        this.records.mirrorRemove(entry.id);
        this._queueOf(entry.props.pos as MessagePos).releaseShown(entry.id);
    }

    // ── Map 覆写与批量操作（决策 10） ──────────────────────────────────

    /**
     * 覆写 `Map.delete`：**硬移除**（无动画 + persist 记录一并删）+ **立即同步持久化**
     * （local 即写、remote 即 flush——「删干净」闭环）。展示中/排队中先广播 `message:hide`
     * （决策 20：一切移除路径均广播——payload.message 在销毁前取）。
     */
    override delete(id: string): boolean {
        const entry = this._entries.get(id);
        if (!entry) return false;
        if (entry.state === "shown" || entry.state === "queued") this._emit("message:hide", entry);
        this._destroyEntry(entry);
        this._flushQueue(entry.props.pos as MessagePos);
        this.storage.flushNow();
        return true;
    }

    /** 覆写 `Map.clear`：清全部存活记录（含隐藏），默认带离场动画；立即同步持久化 */
    override clear(animated: boolean = true): void {
        for (const q of this._queues.values()) q.clear(); // 先清等待队列（防 dismiss 补位显示排队 entry）
        for (const entry of Array.from(this._entries.values())) {
            if (entry.state === "shown" || entry.state === "queued") {
                this._dismiss(entry, animated);
            } else {
                this._destroyEntry(entry); // 隐藏态直销（display 模型下仍在 DOM）
            }
        }
        if (this._state) this._state.items.splice(0); // 镜像清空
        this.storage.flushNow();
    }

    /** engine.destroy() 收口：全部立即销毁 + 容器整体移除 + 持久化 flush。
     *  （flush 先于销毁——collect 遍历存活记录，先删后收会写空载荷） */
    dispose(): void {
        this.storage.flushNow();
        for (const q of this._queues.values()) q.clear();
        for (const entry of Array.from(this._entries.values())) {
            if (entry.state === "shown" || entry.state === "queued" || entry.state === "hidden") {
                this._destroyEntry(entry);
            }
        }
        removeMessageContainer(this.engine);
        if (this._state) this._state.items.splice(0); // 镜像清空（引擎收口——Map 与镜像同步归零）
    }

    // ── 持久化与拉取（storage 域委托，ADR-0088） ───────────────────────

    /** 从服务器拉取消息（决策 17）：GET JSON 数组、按 id 覆盖合并、只入记录不弹 */
    async load(url?: string): Promise<ComponentInstance[]> {
        return this.storage.load(url);
    }

    /** 立即持久化 flush（决策 18）：local 同步写 + remote 立即 POST */
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
     * action 触发闭环（决策 13，按钮点击与 confirm `yes()/no()` / `respond()` 共用）：value 写
     * result → `message:action` 广播 → confirm resolve → handle → hide 判定。
     */
    _fireAction(entry: MessageEntry, action: ResolvedMessageAction): void {
        if (action.hasValue) {
            entry.props.result = action.value;
            entry.record.result = action.value;
            this.records.touch(entry);
            if (entry.instance) entry.instance.data.result = action.value;
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
     * Confirm 选择（`yes()/no()` ≡ 点击对应 value 按钮 / `respond(id, value)` 同路）——沿
     * `_fireAction` 同一闭环。无匹配 action（actions 被自定义清空）→ warn + no-op。
     */
    _fireConfirmChoice(entry: MessageEntry, value: boolean): void {
        const action = entry.actions.find((a) => a.hasValue && a.value === value);
        if (!action) {
            this.engine.logger.warn(
                `engine.messages: type='confirm' 会话缺少 value=${value} 的按钮（actions 已被自定义），选择无效（ADR-0077）`,
            );
            return;
        }
        this._fireAction(entry, action);
    }

    /** 编程应答（ADR-0083 Q6a）：`respond(id, true)` ≡ 点击对应 value 按钮 */
    respond(id: string, value: any): void {
        const entry = this._entries.get(id);
        if (!entry) {
            this.engine.logger.warn(`engine.messages: respond("${id}") 未命中存活记录，已忽略`);
            return;
        }
        this._fireConfirmChoice(entry, value);
    }

    // ── 事件（决策 20） ────────────────────────────────────────────────

    /**
     * 双通道事件（决策 20）：引擎总线 + 卡片元素 dispatchEvent；`message:action` 额外以
     * anchor 为根派发（决策 14 职责②）；type='toast' 迁移期双发 `toast:show`/`toast:hide`。
     * payload `{ message: 组件实例, el }`。
     */
    _emit(
        type: "message:add" | "message:update" | "message:show" | "message:hide" | "message:read" | "message:status" | "message:action",
        entry: MessageEntry,
        extra?: Record<string, any>,
        legacyToast = true,
    ): void {
        const detail = { message: entry.instance as ComponentInstance, el: entry.el, ...extra };
        this.engine.emit(type, detail as any);
        entry.el?.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
        if (type === "message:action" && entry.anchor) {
            entry.anchor.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
        }
        // 迁移期双发（决策 3）：type='toast' 的展示状态转换照发旧事件
        if (legacyToast && entry.type === "toast" && (type === "message:show" || type === "message:hide")) {
            const legacy = type === "message:show" ? "toast:show" : "toast:hide";
            const legacyDetail = { toast: entry.instance as any, el: entry.el };
            this.engine.emit(legacy as any, legacyDetail as any);
            entry.el?.dispatchEvent(new CustomEvent(legacy, { detail: legacyDetail, bubbles: true }));
        }
    }

    // ── delayClose 计时与 hover 暂停（剩余时间制 + remaining 约定键联动） ──


    /** 启动自动关闭计时（holdOpen 约定键拦截——true 期间不计时，ADR-0089 决策五） */
    _startTimer(entry: MessageEntry): void {
        this._clearTimer(entry);
        if (entry.instance?.data.holdOpen === true) return; // 进行中 sticky（task 未完成等）
        const delay = entry.props.delayClose;
        if (typeof delay === "number" && delay > 0) {
            entry.deadline = Date.now() + delay;
            entry.pausedRemaining = null;
            if (entry.instance) entry.instance.data.remaining = delay;
            entry.tickTimer = setInterval(() => {
                if (entry.deadline != null && entry.instance) {
                    entry.instance.data.remaining = Math.max(0, entry.deadline - Date.now());
                }
            }, 1000);
            entry.timer = setTimeout(() => {
                entry.timer = null;
                this._dismiss(entry, true);
            }, delay);
        } else {
            entry.deadline = null; // sticky
            if (entry.instance) entry.instance.data.remaining = -1;
        }
    }

    /** hover 暂停：记剩余时间、停表与 tick（sticky 无表 no-op） */
    _pauseTimer(entry: MessageEntry): void {
        if (entry.timer == null || entry.deadline == null) return;
        clearTimeout(entry.timer);
        entry.timer = null;
        entry.pausedRemaining = Math.max(0, entry.deadline - Date.now());
    }

    /** hover 移出恢复：按剩余时间续表 */
    _resumeTimer(entry: MessageEntry): void {
        if (entry.pausedRemaining == null || entry.state !== "shown") return;
        const remaining = entry.pausedRemaining;
        entry.pausedRemaining = null;
        entry.deadline = Date.now() + remaining;
        entry.timer = setTimeout(() => {
            entry.timer = null;
            this._dismiss(entry, true);
        }, remaining);
    }

    _clearTimer(entry: MessageEntry): void {
        if (entry.timer != null) {
            clearTimeout(entry.timer);
            entry.timer = null;
        }
        if (entry.tickTimer != null) {
            clearInterval(entry.tickTimer);
            entry.tickTimer = null;
        }
        entry.pausedRemaining = null;
    }
}
