/**
 * 消息持久化通道（ADR-0071 决策 17/18，方案 A：引擎内置 fetch + 约定协议）：
 *
 * - **local**：localStorage key `autospark-messages`，记录变更即**同步全量写**（同步便宜，
 *   无防抖）；SSR / 配额失败 warn + no-op；
 * - **remote**：`POST options.messages.url`，body = 存活记录**全量 JSON 数组**（与 load 格式
 *   对称、服务端整体替换语义）；变更**防抖 500ms 合并写**（已读风暴不打爆服务器）；`headers`
 *   透传 fetch（鉴权只此一通道，不做鉴权抽象）；`save()` 立即 flush；`destroy()` 时
 *   keepalive 兜底尝试。
 *
 * 序列化形态见 types.ts `serializeMessage`（剥函数与运行态）。恢复侧（restore/load）归
 * manager——本模块只管通道。
 */

/** localStorage 键（ADR-0071 决策 18 约定值） */
export const MESSAGE_STORAGE_KEY = "autospark-messages";

/** remote 防抖窗口（ms） */
export const REMOTE_DEBOUNCE_MS = 500;

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
 */
export class RemotePersistController {
    private timer: ReturnType<typeof setTimeout> | null = null;
    private pending: Record<string, any>[] | null = null;

    constructor(
        private url: string,
        private headers: Record<string, string> | undefined,
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
        if (typeof fetch === "undefined" || !this.url) return;
        try {
            const resp = await fetch(this.url, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(this.headers ?? {}) },
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
