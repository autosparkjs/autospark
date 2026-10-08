import { MESSAGE_PERSIST, type AutoSparkMessageRecord, type AutoSparkMessageLevel, type MessageProps } from "./types";
import type { MessageManager } from "./manager";
import type { MessageEntry } from "./entry";

/**
 * 消息记录管理（ADR-0088 模块拆分 → **ADR-0089 镜像纯 record 化**）——**记录域职责**：
 *
 * - entry 构建（`createEntry`——派生键解析；装配归 assembly/manager）与恢复重建（`restoreRecords`）；
 * - `$messages` 镜像维护（**纯业务数据面**——`{ ...entry.record }` 浅拷贝，与持久化载荷零
 *   转换同构，ADR-0089 决策七之三；渲染配置与运行态归组件实例，不入镜像）；
 * - maxLen 淘汰（跨 pos 的 createAt FIFO 记录级策略——对隐藏记录也生效）。
 */
export class MessageRecords {
    constructor(private readonly manager: MessageManager) {}

    /** $messages 状态真身（manager 内部口） */
    private get _state() {
        return this.manager._stateRef;
    }

    // ── entry 构建 ────────────────────────────────────────────────────

    /**
     * 新建 entry（`_enqueueProps` / `_addAsync` / 恢复的记录部分）：record 构建（业务十二键
     * + createAt/updateAt）+ 派生键解析（icon / actions / anchor）。装配（组件实例化）归
     * manager `_materialize`。
     */
    createEntry(merged: MessageProps, id: string, type: string): MessageEntry {
        const anchor = this.manager._resolveAnchor(merged.anchor);
        const now = Date.now();
        const entry: MessageEntry = {
            id,
            type,
            record: {
                id,
                type,
                read: merged.read === true,
                title: merged.title,
                description: merged.description,
                level: merged.level as AutoSparkMessageLevel | undefined,
                owner: merged.owner,
                status: merged.status,
                result: merged.result,
                link: merged.link,
                createAt: now,
                updateAt: now,
            },
            props: merged,
            icon: this.manager._resolveIcon(merged.level as AutoSparkMessageLevel, merged.icon),
            actions: this.manager._resolveActions(merged.actions, anchor),
            state: "queued",
            instance: null,
            scope: null,
            el: null,
            anchor,
            confirmResolve: null,
            timer: null,
            tickTimer: null,
            deadline: null,
            pausedRemaining: null,
            leave: null,
            clickHandler: null,
            enterHandler: null,
            leaveHandler: null,
            appliedClassName: "",
            appliedStyles: "",
        };
        return entry;
    }

    // ── 镜像（ADR-0072 → ADR-0089 纯 record 化：`$messages.items` 三处收口） ──

    /** 记录数据变更触摸：`updateAt` 刷新（数据写入的公共入口调用）。纯运行态变化不经此。 */
    touch(entry: MessageEntry): void {
        entry.record.updateAt = Date.now();
    }

    /** 镜像插入（新记录）：创建序追加（纯到达序） */
    mirrorAdd(entry: MessageEntry): void {
        const items = this._state?.items;
        if (!items) return;
        items.push({ ...entry.record });
    }

    /** 镜像整替换（记录级变更）：`splice(i, 1, 新拷贝)`——索引赋值不触发数组路径订阅，须走 splice */
    mirrorReplace(entry: MessageEntry): void {
        const items = this._state?.items;
        if (!items) return;
        const i = items.findIndex((r) => r.id === entry.id);
        if (i >= 0) items.splice(i, 1, { ...entry.record });
    }

    /** 镜像移除（记录删除） */
    mirrorRemove(id: string): void {
        const items = this._state?.items;
        if (!items) return;
        const i = items.findIndex((r) => r.id === id);
        if (i >= 0) items.splice(i, 1);
    }

    // ── maxLen 淘汰（决策 6） ──────────────────────────────────────────

    /** 存活记录超限 FIFO 丢最旧（不豁免未读 / 展示中；新建 entry 本身不参与候选。
     *  persist=1 会话缓冲记录同受淘汰——ADR-0077 沿用） */
    evictOverflow(keep: MessageEntry): void {
        const max = this.manager._maxLen;
        if (max <= 0) return;
        const manager = this.manager;
        while (manager.size > max) {
            let oldest: MessageEntry | null = null;
            for (const id of manager.keys()) {
                const e = manager._entryOf(id);
                if (e && e !== keep && (oldest == null || e.record.createAt < oldest.record.createAt)) oldest = e;
            }
            if (!oldest) break;
            manager._destroyEntry(oldest); // 真销毁（display 模型下唯一销毁路径）
        }
    }

    // ── 恢复重建（决策 17/18——storage 交来纯数据，记录域负责重建） ────

    /**
     * 恢复记录（restore/load 共用）：**只入记录不弹**（决策 17）——装配为 display:none 的
     * 「已隐藏」态存活（实例恒在，`show(id)` display 直切可见），按 id 去重覆盖（服务端 /
     * 存储为准）、新 id 追加。persist 按存储介质反推（ADR-0072：载荷不携带）。
     */
    restoreRecords(
        list: Record<string, any>[],
        medium: "local" | "remote",
    ): import("../component/component-instance").ComponentInstance[] {
        const manager = this.manager;
        const restored: import("../component/component-instance").ComponentInstance[] = [];
        for (const raw0 of list) {
            if (raw0 == null || typeof raw0 !== "object") continue;
            const raw = {
                ...raw0,
                persist: medium === "local" ? MESSAGE_PERSIST.LOCAL : MESSAGE_PERSIST.REMOTE,
            } as MessageProps;
            const id = raw.id != null && raw.id !== "" ? String(raw.id) : `message-${++manager._autoId}`;
            // 载荷时间戳还原（createAt/updateAt——缺失兜当前时刻）
            const createAt = Number(raw0.createAt);
            const updateAt = Number(raw0.updateAt);
            const validCreate = Number.isFinite(createAt) && createAt > 0 ? createAt : Date.now();
            const validUpdate = Number.isFinite(updateAt) && updateAt > 0 ? updateAt : validCreate;
            const existing = manager._entryOf(id);
            if (existing) {
                // upsert：记录 props 以恢复数据为准（保持当前展示状态）；时间戳以载荷为准
                const merged = manager._mergeProps({ ...raw, id }).merged;
                manager._applyEntryConfig(existing, merged as MessageProps);
                existing.record.createAt = validCreate;
                existing.record.updateAt = validUpdate;
                restored.push(existing.instance!);
                continue;
            }
            const { merged, type } = manager._mergeProps({ ...raw, id });
            manager._settleLevel(merged);
            const entry = this.createEntry(merged as MessageProps, id, type);
            // 时间戳还原先于物化（mirrorAdd 取 record 快照——还原在后会镜像漂移）
            entry.record.createAt = validCreate;
            entry.record.updateAt = validUpdate;
            if (!manager._materialize(entry)) continue; // 装配（display:none）+ 入表 + 镜像
            entry.state = "hidden"; // 恢复只入记录不弹（display:none——closed 约定键置位）
            if (entry.instance) entry.instance.data.closed = true;
            restored.push(entry.instance!);
        }
        return restored;
    }
}

