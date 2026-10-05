/**
 * 消息持久化通道（ADR-0071 决策 17/18 方案 A → **ADR-0088 吸收 manager 持久化全责**）：
 *
 * - **local**：localStorage key `autospark-messages`，记录变更即**同步全量写**（同步便宜，
 *   无防抖）；SSR / 配额失败 warn + no-op；
 * - **remote**：`POST fetchOptions.url`，body = 存活记录**全量 JSON 数组**（与 load 格式
 *   对称、服务端整体替换语义）；变更**防抖 500ms 合并写**（已读风暴不打爆服务器）；
 *   `save()` 立即 flush；`dispose()` 时 keepalive 兜底尝试；
 * - **`MessagePersistence`**（ADR-0088）：分桶收集（persist 2 → local、3 → remote；1 会话
 *   缓冲不入桶）、变更调度、删后即刷（「删干净」闭环——刷新 / 多标签页不复活）、`save`/
 *   `load` 手动通道——原 manager 五块持久化逻辑的收容所；
 * - **serializeMessage 白名单封闭十键**（ADR-0088 修订）：`MessageRecord` 是**纯业务数据**——
 *   与后端通用消息管理表对齐（只管数据、不管渲染与行为）；渲染（icon/pos/styles/尺寸…）、
 *   行为（**actions** / 三控制键）、运行态（progress/paused/…）、边界键（anchor）、
 *   persist（介质反推）一律不入载荷；**未知自有键不透传**（原黑名单式透传语义退役——
 *   自定义业务数据走 owner/status/result 三透传键）。恢复后的渲染与行为由**具体 session
 *   按生效配置重建**（actions 走 types 默认或缺省，不落盘不复原）。
 *
 * 恢复侧记录重建（restore/load）归 records.ts——本模块只管通道与序列化边界。
 */
import type { MessageFetchOptions, MessageProps, AutoSparkMessageRecord } from "./types";
import { MESSAGE_PERSIST } from "./types";
import type { MessageManager } from "./manager";

/** localStorage 键（ADR-0071 决策 18 约定值） */
export const MESSAGE_STORAGE_KEY = "autospark-messages";

/** remote 防抖窗口（ms） */
export const REMOTE_DEBOUNCE_MS = 500;

/**
 * 单条 entry → 可序列化 JSON（persist 载荷）：**直接取 `entry.record`**（持久化纯业务
 * 数据的单一数据源——组合分层宣言：Record 是持久化数据，Entry 是运行时消息）。浅拷贝
 * 隔离（防调用方持有引用后 Mutation 污染下次序列化）。
 */
export function serializeMessage(entry: { record: AutoSparkMessageRecord }): AutoSparkMessageRecord {
    return { ...entry.record };
}

// ── local / remote 通道叶子（原实现沿袭） ───────────────────────────────

/** local 全量写（SSR / 异常 warn + no-op） */
export function writeLocalMessages(records: Record<string, any>[], warn: (msg: string) => void): void {
    if (typeof localStorage === "undefined") return;
    try {
        localStorage.setItem(MESSAGE_STORAGE_KEY, JSON.stringify(records));
    } catch (e: any) {
        warn(`engine.messages: local 持久化写入失败，已忽略: ${e?.message ?? e}`);
    }
}

/** local 全量读（无数据 / SSR / 异常返回空数组；条目须为数组，脏数据 warn + 剪除） */
export function readLocalMessages(warn: (msg: string) => void): Record<string, any>[] {
    if (typeof localStorage === "undefined") return [];
    try {
        const raw = localStorage.getItem(MESSAGE_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            warn("engine.messages: local 持久化数据格式异常（非数组），已忽略");
            return [];
        }
        return parsed.filter((it) => it && typeof it === "object" && !Array.isArray(it));
    } catch (e: any) {
        warn(`engine.messages: local 持久化读取失败，已忽略: ${e?.message ?? e}`);
        return [];
    }
}

/**
 * remote 持久化控制器：防抖 500ms 合并全量 POST。records 在**触发时刻**传入快照——
 * 防抖窗口内多次变更只发窗口结束时点的最新全量（服务端整体替换语义下的正确合并）。
 *
 * 传输配置经 getter **fetch 时现读** state 的 `fetchOptions`（ADR-0072）：鉴权头运行时
 * 可刷新（token 续期）；无 url 即跳过（运行时补 url 即激活 remote 同步）。
 */
export class RemotePersistController {
    private timer: ReturnType<typeof setTimeout> | null = null;
    private pending: Record<string, any>[] | null = null;

    constructor(
        private getFetchOptions: () => MessageFetchOptions | null,
        private warn: (msg: string) => void,
    ) {}

    /** 防抖登记（窗口结束发最新快照） */
    schedule(records: Record<string, any>[]): void {
        this.pending = records;
        if (this.timer != null) clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.timer = null;
            const snapshot = this.pending;
            this.pending = null;
            if (snapshot) void this.flush(snapshot);
        }, REMOTE_DEBOUNCE_MS);
    }

    /** 立即 POST 全量（save / destroy 调用；keepalive 兜底页面卸载）；失败 warn 不抛 */
    async flush(records: Record<string, any>[], keepalive = false): Promise<void> {
        if (this.timer != null) {
            clearTimeout(this.timer);
            this.timer = null;
            this.pending = null;
        }
        const fetchOptions = this.getFetchOptions();
        if (typeof fetch === "undefined" || !fetchOptions?.url) return;
        try {
            const { url, ...init } = fetchOptions;
            const resp = await fetch(url, {
                ...init,
                method: "POST",
                headers: { "Content-Type": "application/json", ...(init.headers as Record<string, string> | undefined) },
                body: JSON.stringify(records),
                keepalive,
            });
            if (!resp.ok) {
                this.warn(`engine.messages: remote 持久化失败（HTTP ${resp.status}），已忽略`);
            }
        } catch (e: any) {
            this.warn(`engine.messages: remote 持久化失败，已忽略: ${e?.message ?? e}`);
        }
    }

    /** 丢弃未发的防抖挂起（manager dispose 时先 flush 再弃） */
    cancel(): void {
        if (this.timer != null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.pending = null;
    }
}

// ── 持久化管理单元（ADR-0088：原 manager _collectPersist/_schedulePersist/_flushPersistNow/
//    save/load 五块下沉收容） ─────────────────────────────────────────────

/** 消息持久化域：manager 编排下的收集 / 调度 / 即刷 / 手动通道 */
export class MessagePersistence {
    /** remote 控制器（fetch 时现读 state 的 fetchOptions——token 续期直改即生效，ADR-0072） */
    private remote: RemotePersistController;

    constructor(private readonly manager: MessageManager) {
        this.remote = new RemotePersistController(
            () => this.manager._stateRef?.options.fetchOptions ?? null,
            (m) => this.manager.engine.logger.warn(m),
        );
    }

    /** 收集两通道的序列化全量（按 persist 级别分桶：2 → local、3 → remote；1 会话缓冲不入桶） */
    collect(): { locals: Record<string, any>[]; remotes: Record<string, any>[] } {
        const locals: Record<string, any>[] = [];
        const remotes: Record<string, any>[] = [];
        for (const session of Array.from(this.manager.values())) {
            const entry = session._entry;
            if (!entry) continue;
            const serialized = serializeMessage(entry);
            if (entry.props.persist === MESSAGE_PERSIST.LOCAL) locals.push(serialized);
            else if (entry.props.persist === MESSAGE_PERSIST.REMOTE) remotes.push(serialized);
        }
        return { locals, remotes };
    }

    /** 记录变更后的持久化调度：local 同步立即写；remote 防抖 500ms 合并（决策 18） */
    schedule(): void {
        if (!this.manager.enabled) return;
        const { locals, remotes } = this.collect();
        writeLocalMessages(locals, (m) => this.manager.engine.logger.warn(m));
        this.remote.schedule(remotes);
    }

    /** 立即同步持久化（ADR-0077）：remove/delete/clear 后调——local 同步写 + remote 立即
     *  flush 全量覆盖（防抖合并的已排程请求被立即版覆盖，「删干净」闭环——刷新不复活） */
    flushNow(): void {
        if (!this.manager.enabled) return;
        const { locals, remotes } = this.collect();
        writeLocalMessages(locals, (m) => this.manager.engine.logger.warn(m));
        void this.remote.flush(remotes, true);
    }

    /** 立即持久化 flush（决策 18）：local 同步写 + remote 立即 POST（Promise） */
    async save(): Promise<void> {
        const { locals, remotes } = this.collect();
        writeLocalMessages(locals, (m) => this.manager.engine.logger.warn(m));
        await this.remote.flush(remotes);
    }

    /**
     * 从服务器拉取消息（决策 17）：`fetch(GET url)`，响应体约定为消息 JSON 数组；按 id 覆盖
     * 合并、新 id 追加；**只入记录不弹**（需要时 `show(id)`——重建归 records）；失败 warn +
     * resolve 空数组（不 reject 中断调用方）。传输配置现读 state 的 `fetchOptions`（ADR-0072）。
     */
    async load(url?: string): Promise<import("./types").AutoSparkMessageSession[]> {
        const fetchOptions = this.manager._stateRef?.options.fetchOptions ?? null;
        const target = url ?? fetchOptions?.url;
        if (!target || typeof fetch === "undefined") {
            this.manager.engine.logger.warn(
                "engine.messages: load 缺少 url（参数与 options.messages.fetchOptions.url 均未配置），已跳过",
            );
            return [];
        }
        try {
            const init: MessageFetchOptions = fetchOptions ? { ...fetchOptions } : ({} as MessageFetchOptions);
            delete (init as any).url;
            const resp = await fetch(target, init);
            if (!resp.ok) {
                this.manager.engine.logger.warn(`engine.messages: load 失败（HTTP ${resp.status}），已忽略`);
                return [];
            }
            const data = await resp.json();
            if (!Array.isArray(data)) {
                this.manager.engine.logger.warn("engine.messages: load 响应体格式异常（非数组），已忽略");
                return [];
            }
            const restored = this.manager.records.restoreRecords(data, "remote");
            this.schedule();
            return restored;
        } catch (e: any) {
            this.manager.engine.logger.warn(`engine.messages: load 失败，已忽略: ${e?.message ?? e}`);
            return [];
        }
    }

    /** 丢弃未发的防抖挂起（dispose 先 flush 再弃的一般收口） */
    cancelPending(): void {
        this.remote.cancel();
    }
}
