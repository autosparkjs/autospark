/**
 * 远程图标持久缓存（ADR-0048）：localStorage 单键 JSON + 写节流 + LRU + 配额降级。
 *
 * - 存储：`localStorage["autospark:icons:v1"]`，值为**按源分组**的两层对象
 *   （`{ [baseUrl]: { "prefix/name": svg } }`）——键含 baseUrl，换源不串图；
 * - 注水：模块初始化同步 `JSON.parse` 一次入内存（先于任何渲染）；查找同步、
 *   命中即由 factory 注回内存 remoteCache（零网络同步渲染）；
 * - 失效：无 TTL（图标版本不可变）；全局 500 条 LRU（插入序，命中刷新）；
 * - 写入：300ms 节流批量落盘；`QuotaExceededError` 淘汰最旧一半重写一次，
 *   再失败则本会话停写（静默降级）；
 * - 降级：无 localStorage（SSR）/ 读写异常一律静默（行为退回无持久层）。
 *
 * 本模块**不依赖** factory / registry（避免循环引用）：开关状态自持，
 * 由 registry 经 getter/setter 透出（`AutoSpark.icons.persist`）。
 */

/** 存储键（v1 版本号——结构不兼容时递增作废旧数据） */
const STORAGE_KEY = "autospark:icons:v1";
/** 全局条数上限（跨源 LRU） */
const MAX_ENTRIES = 500;
/** 写节流窗口（ms） */
const FLUSH_DELAY = 300;

let enabled = true;
let storageOk = true;
let writesDisabled = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
/** 按源分组：baseUrl → (prefix/name → svg) */
const store = new Map<string, Map<string, string>>();
/** 全局 LRU 序：`${baseUrl}|${key}`（插入序即新旧，命中/写入刷新到尾部） */
const order: string[] = [];

function init(): void {
    try {
        if (typeof localStorage === "undefined") {
            storageOk = false;
            return;
        }
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Record<string, Record<string, string>>;
        for (const [base, group] of Object.entries(parsed)) {
            const map = new Map<string, string>();
            for (const [key, svg] of Object.entries(group)) {
                map.set(key, svg);
                order.push(`${base}|${key}`);
            }
            store.set(base, map);
        }
    } catch {
        storageOk = false; // 解析失败 / 隐私模式：静默降级
    }
}
init();

/** 开关读取（registry.persist 透出） */
export function persistEnabled(): boolean {
    return enabled && storageOk;
}

/** 开关设置（registry.persist 透出） */
export function setPersistEnabled(v: boolean): void {
    enabled = !!v;
}

/** 同步查找（LRU 命中刷新）；未命中返回 undefined */
export function persistLookup(baseUrl: string, key: string): string | undefined {
    if (!persistEnabled()) return undefined;
    const hit = store.get(baseUrl)?.get(key);
    if (hit === undefined) return undefined;
    const composite = `${baseUrl}|${key}`;
    const i = order.indexOf(composite);
    if (i >= 0) order.splice(i, 1);
    order.push(composite);
    return hit;
}

/** 超限淘汰（LRU 最旧） */
function evictOldest(count: number): void {
    for (let i = 0; i < count && order.length > 0; i++) {
        const composite = order.shift()!;
        const sep = composite.indexOf("|");
        const base = composite.slice(0, sep);
        const key = composite.slice(sep + 1);
        const group = store.get(base);
        if (group) {
            group.delete(key);
            if (group.size === 0) store.delete(base);
        }
    }
}

/** 序列化当前 store 为存储对象 */
function serialize(): Record<string, Record<string, string>> {
    const obj: Record<string, Record<string, string>> = {};
    for (const [base, group] of store) {
        obj[base] = Object.fromEntries(group);
    }
    return obj;
}

/** 落盘（节流后的实际写）：序列化 → setItem，配额异常淘汰一半后**重新序列化**重试一次再败停写 */
function flush(): void {
    flushTimer = null;
    if (writesDisabled || !storageOk) return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize()));
    } catch {
        try {
            evictOldest(Math.ceil(order.length / 2));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize()));
        } catch {
            writesDisabled = true; // 本会话停写，静默
        }
    }
}

/** 写入一条（更新内存 store + LRU 刷新 + 超限淘汰 + 节流落盘） */
export function persistStore(baseUrl: string, key: string, svg: string): void {
    if (!persistEnabled() || writesDisabled) return;
    let group = store.get(baseUrl);
    if (!group) {
        group = new Map<string, string>();
        store.set(baseUrl, group);
    }
    const composite = `${baseUrl}|${key}`;
    const existed = group.has(key);
    group.set(key, svg);
    if (existed) {
        const i = order.indexOf(composite);
        if (i >= 0) order.splice(i, 1);
    }
    order.push(composite);
    evictOldest(order.length - MAX_ENTRIES);
    if (flushTimer == null) flushTimer = setTimeout(flush, FLUSH_DELAY);
}

/** 测试辅助：清空内存 store 与停写标志（localStorage 由用例自行清理） */
export function resetIconPersistenceForTest(): void {
    store.clear();
    order.length = 0;
    writesDisabled = false;
    if (flushTimer != null) {
        clearTimeout(flushTimer);
        flushTimer = null;
    }
    enabled = true;
}

/** 测试辅助：按当前 localStorage 重新注水（模拟页面重载后的模块初始化） */
export function reloadIconPersistenceForTest(): void {
    resetIconPersistenceForTest();
    storageOk = true;
    init();
}
