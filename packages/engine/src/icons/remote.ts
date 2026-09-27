/**
 * IconifyJSON 远程源（ADR-0058 决策 8：fetch + in-flight 合并 + 会话内存缓存）。
 *
 * 缓存两层：**会话内存缓存**（同 url 多声明只 fetch 一次）+ **可选 TTL 持久层**
 * （`cache` 选项，声明级 opt-in：正数毫秒时长，取回落 localStorage、过期即弃、
 * 默认 0 不启用）+ 浏览器 HTTP 缓存兜底。并发限流随 per-icon 远程物种移除（批量声明
 * 天然少量请求）。失败不落任何缓存（可重试）。
 */
import type { IconifyJSON } from "./iconify";

/**
 * 默认远程 url（ADR-0058：Iconify 公共 API 的 material-symbols-light 图标集，可经 options.url 覆盖）。
 * 清单占位符用 `{modify-icons}`——未声明 modify 时退化为原名清单（行为同 `{icons}`），声明后
 * 自动取后缀变体（`delete-rounded` 等），modify 与默认 url 开箱即用。
 */
export const DEFAULT_REMOTE_URL = "https://api.iconify.design/material-symbols-light.json?icons={modify-icons}";

/** modify 值域（越界 warn + 按未声明处理，ADR-0058 决策 8） */
export const MODIFY_VALUES = ["rounded", "sharp", "outline", "outline-rounded", "outline-sharp"] as const;
export type IconModify = (typeof MODIFY_VALUES)[number];

/** 未知占位符 warn 去重（按占位符字面量，跨声明一次） */
const unknownPlaceholderWarned = new Set<string>();

/**
 * url 插值（ADR-0058 决策 8）：`{icons}` 原名清单**原始直书零编码**（Iconify API 直收逗号）、
 * `{modify}` 未声明 → 空串、`{modify-icons}` 未声明 → 退化为 `{icons}`、未知占位符保留
 * 原样 + warn 一次。
 */
export function interpolateUrl(tpl: string, icons: string[], modify?: string): string {
    const list = icons.join(",");
    const modList = modify ? icons.map((i) => `${i}-${modify}`).join(",") : list;
    return tpl.replace(/\{([a-z][a-z0-9-]*)\}/g, (whole: string, key: string): string => {
        if (key === "icons") return list;
        if (key === "modify") return modify ?? "";
        if (key === "modify-icons") return modList;
        if (!unknownPlaceholderWarned.has(whole)) {
            unknownPlaceholderWarned.add(whole);
            console.warn(`[autospark/icons] url 占位符 "${whole}" 未识别，已保留原样（支持：{icons}/{modify}/{modify-icons}）`);
        }
        return whole;
    });
}

/** 会话内存缓存：url → in-flight Promise（resolve 后复用同 Promise；失败剔除可重试） */
const jsonCache = new Map<string, Promise<IconifyJSON>>();

// ── TTL 持久层（cache 选项，ADR-0058 修订）──────────────────────────────────
// 每 url 一键：`autospark:icon-cache:v1:{url}` → `{ t, ttl, data }`。读写全 try/catch
// （隐私模式 / 配额超限 / SSR 无 localStorage 静默降级内存缓存）；过期条目读取时即弃。

/** localStorage 持久缓存键前缀 */
const PERSIST_PREFIX = "autospark:icon-cache:v1:";

interface PersistEntry {
    /** 落盘时刻（Date.now） */
    t: number;
    /** 声明时指定的 TTL（毫秒） */
    ttl: number;
    /** IconifyJSON 响应体 */
    data: IconifyJSON;
}

function persistGet(url: string): PersistEntry | null {
    let raw: string | null = null;
    try {
        raw = localStorage.getItem(PERSIST_PREFIX + url);
    } catch {
        return null;
    }
    if (!raw) return null;
    try {
        const e = JSON.parse(raw) as PersistEntry;
        if (
            typeof e?.t !== "number" ||
            typeof e?.ttl !== "number" ||
            !e.data ||
            typeof e.data !== "object"
        ) {
            throw new Error("bad entry");
        }
        return e;
    } catch {
        persistRemove(url); // 损坏条目即弃
        return null;
    }
}

function persistPut(url: string, json: IconifyJSON, ttl: number): void {
    try {
        localStorage.setItem(PERSIST_PREFIX + url, JSON.stringify({ t: Date.now(), ttl, data: json } satisfies PersistEntry));
    } catch {
        // 配额超限 / 隐私模式：静默降级内存缓存
    }
}

function persistRemove(url: string): void {
    try {
        localStorage.removeItem(PERSIST_PREFIX + url);
    } catch {
        // 忽略
    }
}

/** TTL 内的持久命中（过期条目读取时即弃并返回 null） */
function persistLookup(url: string): IconifyJSON | null {
    const e = persistGet(url);
    if (!e) return null;
    if (Date.now() - e.t >= e.ttl) {
        persistRemove(url);
        return null;
    }
    return e.data;
}

/**
 * fetch 图标集 JSON（in-flight 合并：同 url 并发只发一次请求）。
 * `ttl > 0` 时启用 TTL 持久层：先查 localStorage（TTL 内命中零网络），未命中 fetch
 * 成功后落盘（in-flight 共享下以首个触发网络请求的声明的 ttl 写盘）。
 * 非 200 / 非 JSON / 非 IconifyJSON 结构（icons 非对象）按失败 reject；失败不落任何缓存。
 */
export function fetchIconifySet(url: string, ttl = 0): Promise<IconifyJSON> {
    if (ttl > 0) {
        const hit = persistLookup(url);
        if (hit) return Promise.resolve(hit);
    }
    let p = jsonCache.get(url);
    if (!p) {
        p = (async () => {
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ""}`);
            }
            const json: unknown = await res.json();
            if (!json || typeof json !== "object" || typeof (json as IconifyJSON).icons !== "object") {
                throw new Error("响应不是有效 IconifyJSON（缺少 icons 对象）");
            }
            return json as IconifyJSON;
        })();
        jsonCache.set(url, p);
        // 副分支仅作失败清理（调用方的 rejection 由其自行处理）
        p.catch(() => jsonCache.delete(url));
    }
    if (ttl > 0) {
        // 副分支仅作落盘（rejection 已由主链路处理）
        p.then((json) => persistPut(url, json, ttl)).catch(() => {});
    }
    return p;
}

/** 测试专用：清空会话内存缓存（含 in-flight；localStorage 由用例自理），模拟跨会话重载 */
export function resetIconCacheForTest(): void {
    jsonCache.clear();
}
