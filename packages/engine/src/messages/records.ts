import { MESSAGE_PERSIST, type AutoSparkMessage, type AutoSparkMessageLevel, type MessageProps, type MessagePos, type AutoSparkMessageRecord } from "./types";
import type { MessageManager } from "./manager";
import type { MessageSessionBase } from "./sessions";
import type { MessageEntry } from "./entry";

/**
 * 消息记录管理（ADR-0088 模块拆分：自 manager 收束）——**记录域职责**：
 *
 * - entry 构建（`createEntry`——派生键解析 + 会话绑定）与恢复重建（`restoreRecords`）；
 * - `$messages` 镜像维护（items 增删换 + 展示序 sessions id 列表进出——五处收口点集中于此，
 *   漏一处即幽灵 id，ADR-0083 实现要点 2）；
 * - maxLen 淘汰（跨 pos 的 createdAt FIFO 记录级策略——对 hidden 记录也生效，与展示无关）。
 *
 * 展示编排（何时入列 / 挂载 / teardown）仍归 manager；本类经 manager 实例回触引擎与
 * Map（type-only import——无运行时环）。
 */

/** 记录镜像构建：entry → AutoSparkMessage 纯数据投影（未定义键不入，镜像保持干净）。
 *  业务数据面自 `entry.record` 展开（单一数据源——含 createAt/updateAt）；渲染/运行时键自 props。 */
function buildRecord(entry: MessageEntry): AutoSparkMessage {
    const p = entry.props;
    const rec: AutoSparkMessage = {
        ...entry.record,
        closed: entry.state === "hidden" || entry.state === "closed",
    };
    const set = (key: keyof AutoSparkMessage, v: any) => {
        if (v !== undefined) (rec as any)[key] = v;
    };
    set("icon", entry.icon);
    set("pos", p.pos);
    set("offset", p.offset);
    set("closable", p.closable);
    set("animate", p.animate);
    set("className", p.className);
    set("width", p.width);
    set("height", p.height);
    set("minWidth", p.minWidth);
    set("maxWidth", p.maxWidth);
    set("minHeight", p.minHeight);
    set("delayClose", p.delayClose);
    if (typeof p.persist === "number" && p.persist >= MESSAGE_PERSIST.SESSION) {
        set("persist", p.persist); // ≥1 入镜像（0 缺省态不显式落键，保持记录干净）
    }
    entry.session.projectInto(rec); // type 专属投影（钩子——公共层零 type 知识）
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

/** 消息记录域（manager 编排下的记录构建 / 镜像 / 淘汰 / 恢复） */
export class MessageRecords {
    constructor(private readonly manager: MessageManager) {}

    /** $messages 状态真身（manager 内部口） */
    private get _state() {
        return this.manager._stateRef;
    }

    // ── entry 构建 ────────────────────────────────────────────────────

    /**
     * 新建 entry（`_enqueue` 的记录部分）：派生键解析（icon / actions / anchor /
     * abortController）+ 运行态初始化 + 会话绑定（id / type / _entry）。创建即完成态
     * （初始 progress ≥ 100 的 task 直接进入完成语义——factory 后台跑完 return 完成卡形态）。
     */
    createEntry(
        merged: MessageProps,
        id: string,
        type: string,
        session: MessageSessionBase,
    ): MessageEntry {
        const anchor = this.manager._resolveAnchor(merged.anchor);
        const now = Date.now();
        const entry: MessageEntry = {
            id,
            type,
            // 持久化记录（纯业务数据面——用户架构宣言：Record 是持久化数据，Entry 是运行时
            // 消息；业务键从合并配置提平，serialize/镜像/记录级写入以 record 为单一数据源）
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
            scope: null,
            rendererScope: null,
            el: null,
            anchor,
            session,
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
        };
        session.initFromProps(merged); // type 专属初始装载（钩子——task 进度/取消控制器等）
        session.id = id;
        session.type = type;
        session.el = null;
        session._entry = entry;
        return entry;
    }

    // ── 镜像（ADR-0072：$messages.items / sessions 同步收口） ─────────

    /**
     * 记录数据变更触摸：`updateAt` 刷新（数据写入的公共入口调用——`update()` 补丁 /
     * 同 id 原地更新 / 置已读 / action result 写入）。纯运行态变化（progress 推进 /
     * 显隐切换）不经此（数据审计语义，非活动心跳）。
     */
    touch(entry: MessageEntry): void {
        entry.record.updateAt = Date.now();
    }

    /** 镜像插入（新记录）：创建序追加（ADR-0079 排序移除——纯到达序） */
    mirrorAdd(entry: MessageEntry): void {
        const items = this._state?.items;
        if (!items) return;
        items.push(buildRecord(entry));
    }

    /** 镜像整替换（记录级变更）：`splice(i, 1, 新记录)`——索引赋值不触发数组路径订阅，须走 splice */
    mirrorReplace(entry: MessageEntry): void {
        const items = this._state?.items;
        if (!items) return;
        const i = items.findIndex((r) => r.id === entry.id);
        if (i >= 0) items.splice(i, 1, buildRecord(entry));
    }

    /** 镜像移除（记录删除） */
    mirrorRemove(id: string): void {
        const items = this._state?.items;
        if (!items) return;
        const i = items.findIndex((r) => r.id === id);
        if (i >= 0) items.splice(i, 1);
    }

    /** 展示序 id 列表追加（ADR-0083 $messages.sessions）：入队即进（queued + shown） */
    sessionListAdd(id: string): void {
        const list = this._state?.sessions;
        if (list && !list.includes(id)) list.push(id);
    }

    /** 展示序 id 列表移除（teardown / 硬移除路径统一收口） */
    sessionListRemove(id: string): void {
        const list = this._state?.sessions;
        if (!list) return;
        const i = list.indexOf(id);
        if (i >= 0) list.splice(i, 1);
    }

    // ── maxLen 淘汰（决策 6） ──────────────────────────────────────────

    /** 存活记录超限 FIFO 丢最旧（不豁免未读 / 展示中；新建 entry 本身不参与候选。
     *  persist=1 会话缓冲记录同受淘汰——ADR-0077「缓冲区超出清除」复用 maxLen 单一上限） */
    evictOverflow(keep: MessageEntry): void {
        const max = this.manager._maxLen;
        if (max <= 0) return;
        const manager = this.manager;
        while (manager.size > max) {
            let oldest: MessageEntry | null = null;
            for (const session of manager.values()) {
                const e = session._entry;
                if (e && e !== keep && (oldest == null || e.record.createAt < oldest.record.createAt)) oldest = e;
            }
            if (!oldest) break;
            if (oldest.state === "shown") manager._dismiss(oldest, false);
            if (oldest.state === "queued") manager._dequeue(oldest);
            oldest.state = "closed";
            oldest.session._clearTimer();
            manager._rawDelete(oldest.id); // 原生 Map 删除（绕过 delete 覆写的硬移除编排——与原 _evictOverflow 行为对齐）
            this.mirrorRemove(oldest.id);
            this.sessionListRemove(oldest.id); // queued 态淘汰直删不经 teardown
        }
    }

    // ── 恢复重建（决策 17/18——storage 交来纯数据，记录域负责重建） ────

    /**
     * 恢复记录（restore/load 共用）：**只入记录不弹**（决策 17）——创建为「已隐藏」态存活
     * （closed 由恢复策略统一置位，不读载荷），需要时 `show(id)` 重显；按 id 去重覆盖
     * （服务端 / 存储为准）、新 id 追加。persist 按存储介质反推（ADR-0072：载荷不携带）。
     * 序列化态经合并链归一（raw 值最优先）；字符串 action 留存原始名（挂载时重查 action 表）。
     */
    restoreRecords(
        list: Record<string, any>[],
        medium: "local" | "remote",
    ): import("./types").AutoSparkMessageSession[] {
        const manager = this.manager;
        const restored: import("./types").AutoSparkMessageSession[] = [];
        for (const raw0 of list) {
            if (raw0 == null || typeof raw0 !== "object") continue;
            // 存续策略按介质反推（ADR-0077 数值化：local → 2、remote → 3）
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
            const existing = manager.get(id)?._entry;
            if (existing) {
                // upsert：记录 props 以恢复数据为准（保持当前展示状态）；时间戳以载荷为准
                const merged = manager._mergeProps({ ...raw, id }).merged;
                manager._applyEntryConfig(existing, merged as MessageProps);
                existing.record.createAt = validCreate;
                existing.record.updateAt = validUpdate;
                restored.push(existing.session);
                continue;
            }
            const { merged, type } = manager._mergeProps({ ...raw, id });
            manager._settleLevel(merged);
            const session = manager._createSession(type);
            const entry = this.createEntry(merged as MessageProps, id, type, session);
            entry.record.createAt = validCreate; // 恢复记录保留原创建时间（淘汰序/审计准确）
            entry.record.updateAt = validUpdate;
            entry.state = "hidden"; // 恢复只入记录不弹（closed 由策略置位——镜像经 mirrorAdd 落 true）
            manager.set(id, session);
            this.mirrorAdd(entry);
            restored.push(session);
        }
        return restored;
    }
}
