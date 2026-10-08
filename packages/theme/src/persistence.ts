/**
 * 持久化（ADR-0003）：localStorage 样式快照 + 每 scope 参数持久化。
 *
 * - 样式快照：全部已连接 scope 生成的 CSS 合成单字符串 → `{storageKey}-styles`，
 *   宿主经恢复片段在首帧前回插 head，回访用户零主题闪烁；运行时 connect()
 *   无条件重算重写实现自愈（快照过期最坏退化为「JS 就绪前闪旧主题」= 无持久化现状）。
 * - 参数持久化：每 scope 的用户可感参数独立存 `{storageKey}-scope-{id}`，仅
 *   themeColor/dark/colorized/size/radius/spacing/shadow（语义色与调色板参数属
 *   宿主级定制，不入快照，避免宿主升级默认值时被旧参数钉死）。
 *
 * 所有 localStorage 读写均 try-catch：iOS 隐私模式写入抛异常，静默降级为无持久化。
 */

/** 恢复片段插入的 style 标签 id；运行时 root scope 接管后移除 */
export const RESTORE_STYLE_ID = "autospark-theme-restore";

/** storageKey 前缀默认值（同源多应用经自定义前缀隔离命名空间） */
export const DEFAULT_STORAGE_KEY = "autospark-theme";

/** scope 参数持久化形状：用户可感全集（与演示面板控件一致） */
export type PersistParams = {
    themeColor?: string;
    dark?: boolean;
    colorized?: boolean;
    size?: string;
    radius?: string;
    spacing?: string;
    shadow?: string;
};

export const scopeParamsKey = (storageKey: string, id: string) =>
    `${storageKey}-scope-${id}`;

export const stylesSnapshotKey = (storageKey: string) => `${storageKey}-styles`;

/** 读取 scope 参数快照；无数据或解析失败返回 null */
export function readScopeParams(
    storageKey: string,
    id: string,
): PersistParams | null {
    try {
        const raw = globalThis.localStorage?.getItem(scopeParamsKey(storageKey, id));
        return raw ? (JSON.parse(raw) as PersistParams) : null;
    } catch {
        return null;
    }
}

/** 写入 scope 参数快照（json 为序列化结果，便于调用侧做内容去重） */
export function writeScopeParamsJson(storageKey: string, id: string, json: string) {
    try {
        globalThis.localStorage?.setItem(scopeParamsKey(storageKey, id), json);
    } catch {
        /* 静默降级：无持久化 */
    }
}

/** 删除 scope 参数快照（removeScope 时清理） */
export function removeScopeParams(storageKey: string, id: string) {
    try {
        globalThis.localStorage?.removeItem(scopeParamsKey(storageKey, id));
    } catch {
        /* 静默降级 */
    }
}

/** 读取样式快照（恢复片段使用，运行时不读） */
export function readStylesSnapshot(storageKey: string): string | null {
    try {
        return globalThis.localStorage?.getItem(stylesSnapshotKey(storageKey)) ?? null;
    } catch {
        return null;
    }
}

/** 写入样式快照（运行时每次注入变化后全量重写，实现自愈） */
export function writeStylesSnapshot(storageKey: string, css: string) {
    try {
        globalThis.localStorage?.setItem(stylesSnapshotKey(storageKey), css);
    } catch {
        /* 静默降级 */
    }
}

/** 移除恢复片段插入的快照标签（root scope 接管后调用；不存在则静默跳过） */
export function removeRestoreTag(doc: Document) {
    try {
        doc.getElementById(RESTORE_STYLE_ID)?.remove();
    } catch {
        /* 静默降级 */
    }
}
