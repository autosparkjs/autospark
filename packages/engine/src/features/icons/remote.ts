/**
 * IconifyJSON 远程源（ADR-0121 收编）：AsyncLoader 统一内核执行 + multiplex:share 合并并发 +
 * IStorage 适配器持久层。失败不落缓存（AsyncLoader 天然语义）。
 */
import { AsyncLoader, type CacheItem, type IStorage } from "asyncsignal/loader";
import type { AutoSpark } from "../../engine/engine";
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

// ── IStorage localStorage 适配器（ADR-0121 收编）──────────────────────────
// AsyncLoader 的 cache 层写入 `{ value, timestamp }`，过期由 AsyncLoader 内部按 `cache` 选项判定。
// 适配器仅做序列化/反序列化与 try/catch（隐私模式 / 配额超限 / SSR 无 localStorage 静默降级）。

/** localStorage 持久缓存键前缀 */
const PERSIST_PREFIX = "autospark:icon-cache:v1:";

function createLocalStorageAdapter(): IStorage<CacheItem<IconifyJSON>> {
    return {
        get: (key) => {
            try {
                const raw = localStorage.getItem(PERSIST_PREFIX + key);
                if (!raw) return undefined;
                const parsed = JSON.parse(raw) as CacheItem<IconifyJSON>;
                if (
                    !parsed ||
                    typeof parsed.timestamp !== "number" ||
                    !parsed.value ||
                    typeof parsed.value !== "object"
                ) {
                    throw new Error("bad entry");
                }
                return parsed;
            } catch {
                return undefined;
            }
        },
        set: (key, value) => {
            try {
                localStorage.setItem(PERSIST_PREFIX + key, JSON.stringify(value));
            } catch {
                // 配额超限 / 隐私模式：静默降级内存缓存（不写盘）
            }
        },
        delete: (key) => {
            try {
                localStorage.removeItem(PERSIST_PREFIX + key);
            } catch {
                /* 忽略 */
            }
        },
        clear: () => {
            try {
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const k = localStorage.key(i);
                    if (k?.startsWith(PERSIST_PREFIX)) localStorage.removeItem(k);
                }
            } catch {
                /* 忽略 */
            }
        },
    };
}

/**
 * fetch 图标集 JSON（ADR-0121 收编）：经 AsyncLoader 统一内核执行。
 * `multiplex:"share"` 合并同 url 并发请求（替代旧 jsonCache in-flight Map）；
 * `storage` 适配 localStorage（替代旧手动 TTL 层）；`cache` 映射 TTL（毫秒）。
 * 失败不落缓存（AsyncLoader 天然语义），非 200 / 非 JSON / 非 IconifyJSON 结构按失败 reject。
 */
export function fetchIconifySet(url: string, ttl = 0, engine?: AutoSpark): Promise<IconifyJSON> {
    const loader = new AsyncLoader<IconifyJSON>(
        async ({ abortSignal }) => {
            const fetcher = engine?.options?.fetcher ?? fetch;
            const res = await fetcher(url, { signal: abortSignal });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ""}`);
            }
            const json: unknown = await res.json();
            if (!json || typeof json !== "object" || typeof (json as IconifyJSON).icons !== "object") {
                throw new Error("响应不是有效 IconifyJSON（缺少 icons 对象）");
            }
            return json as IconifyJSON;
        },
        {
            hash: url,
            cache: ttl,
            storage: ttl > 0 ? createLocalStorageAdapter() : undefined,
            multiplex: "share",
            autostart: false,
        },
    );
    return loader.get();
}

/** 测试专用：清空 multiplex 实例缓存表（模拟页面重载/跨会话内存清空）。localStorage 持久层由用例自理。 */
export function resetIconCacheForTest(): void {
    AsyncLoader.clearLoaderCache();
}
