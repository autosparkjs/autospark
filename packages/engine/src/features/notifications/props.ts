/**
 * 通知 props 管线（ADR-0088 模块拆分：合并链 + 归一校验自 manager/types 收敛于此）。
 *
 * - **合并链保留**（ADR-0071 决策 15 五层）：内置默认 < 内置 type 种子 < `options.notifications`
 *   （state 真身现读）< `types[type]` < 单次 props——「一处配置全局生效」是配置能力不是筛选；
 * - **单次 props 整包直传**（ADR-0088）：用户自有键不再经保留键白名单过滤（未知键 warn /
 *   task 专属键 warn 取消——自定义 type 的自有键天然可进模板与镜像）；
 * - 归一校验保留（title 必填在调用方、level / persist / pos 归一于此）——warn 是可发现性。
 */
import {
    NOTIFICATION_DEFAULTS,
    NOTIFICATION_POS,
    NOTIFICATION_PERSIST,
    NOTIFICATION_RESERVED_KEYS,
    normalizeNotificationLevel,
    NOTIFICATION_LEVEL,
    type AutoSparkNotificationsOptions,
    type NotificationProps,
} from "./types";

/** types 层不允许出现的 manager 级键（出现 warn + 忽略，决策 15；shallow 为 ADR-0077 新增） */
export const MANAGER_LEVEL_KEYS: ReadonlySet<string> = new Set([
    "showCount",
    "maxLen",
    "fetchOptions",
    "icons",
    "shell",
    "shallow",
    "types",
]);

/**
 * 内置 type 的种子默认（ADR-0089 决策九）：**经 ctx.typeDefaults 注入**（来源
 * 各 type 组件模板自带（`<script setup>` defaults 段，ADR-0092 模板化），manager 侧
 * 模块函数沿标准组件链懒解析）。合并链中位于 NOTIFICATION_DEFAULTS 与
 * options.notifications 之间——用户全局 / types[type] / 单次 props 均可覆盖。
 * （progress clamp 已内联进 task 组件 methods——props.ts 的 clampProgress 随 session
 * 体系退役，ADR-0089。）
 */

/** 合并链上下文（manager 构造期固化的私有态 + 告警出口） */
export interface NotificationMergeContext {
    /** 生效全局配置真身（state 现读；`notifications:false` 时为空对象） */
    opts: AutoSparkNotificationsOptions;
    /** anchor / actions 的全局默认（ADR-0072 边界键——构造期私有固化，不入 state） */
    frozen: { anchor?: NotificationProps["anchor"]; actions?: any[] };
    /** 用户在 options.notifications 显式配置过的键名（兜底前快照——sticky closable 显式性判定） */
    globalDeclared: ReadonlySet<string>;
    /** type 种子默认视图（ADR-0089 决策九 + ADR-0092 模板化：manager 侧 Proxy 惰性提取——manager.resolveTypeDefaults） */
    typeDefaults: Record<string, Record<string, any>>;
    /** 告警出口（engine.logger.warn） */
    warn: (msg: string) => void;
}

/**
 * 五层合并链（决策 15 + ADR-0077 内置 type 种子层）：内置默认 < 内置 type 种子 <
 * options.notifications（仅通知级键）< types[type]（仅通知级键）< **单次 props 整包直传**。
 * `id` 仅单次层生效（全局默认 / types 携带 id 会让所有通知互并成一条）。
 */
export function mergeNotificationProps(
    userProps: NotificationProps,
    ctx: NotificationMergeContext,
): { merged: Record<string, any>; type: string } {
    const { opts, frozen, globalDeclared, typeDefaults, warn } = ctx;
    const type = String(userProps.type ?? (opts as any).type ?? "toast");
    const typeOptions = opts.types?.[type];
    // types 值只允许通知级键：manager 级键 warn + 忽略（决策 15）
    if (typeOptions) {
        for (const key of Object.keys(typeOptions)) {
            if (MANAGER_LEVEL_KEYS.has(key)) {
                warn(`engine.notifications: types.${type} 不允许管理器级键 "${key}"，已忽略`);
            }
        }
    }
    const merged: Record<string, any> = { ...NOTIFICATION_DEFAULTS };
    const builtInType = typeDefaults?.[type];
    if (builtInType) Object.assign(merged, builtInType);
    // options.notifications 层与 types[type] 层：仅通知级键（白名单过滤 manager 级键，
    // 防止 showCount/icons/types 等混入单条通知 props）
    for (const key of NOTIFICATION_RESERVED_KEYS) {
        if (key !== "id" && key in opts) merged[key] = (opts as any)[key];
        // anchor / actions 的全局默认经构造期固化通道并入（ADR-0072 边界键——不入 state）
        if (key !== "id" && (key === "anchor" || key === "actions") && (frozen as any)[key] !== undefined) {
            merged[key] = (frozen as any)[key];
        }
        if (key !== "id" && typeOptions && key in typeOptions) merged[key] = (typeOptions as any)[key];
    }
    // 单次 props 层：整包直传（ADR-0088——白名单投影退役，自有键透传）
    Object.assign(merged, userProps);
    // （confirm 默认双钮已数据化进 type 组件 defaults 段——ADR-0089 决策九 + ADR-0092 模板化，
    //  本处合并链零 type 分支）
    // sticky 自动关闭钮（ADR-0077 修订）：delayClose ≤ 0（永不自动关）时未显式声明
    // closable 则自动补 ×——否则除 API / actions 外通知无法关闭（可发现性）。显式
    // closable: false 不覆盖（用户明确不要 ×）；三层显式源 = 单次 props / types[type] /
    // options.notifications（全局层以构造期显式键快照为准——state 真身被兜底污染不可判 in）
    const sticky = !(typeof merged.delayClose === "number" && (merged.delayClose as number) > 0);
    if (
        sticky &&
        !("closable" in userProps) &&
        !(typeOptions && "closable" in typeOptions) &&
        !globalDeclared.has("closable")
    ) {
        merged.closable = true;
    }
    return { merged, type };
}

/**
 * merged.level 宽松归一（ADR-0079）：数字（0~4）或名字符串 → 数字；非法 warn + 回退 NONE。
 */
export function settleNotificationLevel(merged: Record<string, any>, warn: (msg: string) => void): void {
    const level = normalizeNotificationLevel(merged.level);
    if (level == null) {
        warn(
            `engine.notifications: 未知 level "${merged.level}"（0~4 或 none/info/success/warn/error，ADR-0079），已回退 ${NOTIFICATION_LEVEL.NONE}`,
        );
        merged.level = NOTIFICATION_LEVEL.NONE;
    } else {
        merged.level = level;
    }
}

/** merged.pos 枚举校验：非法值 warn + 回退默认（返回是否发生回退由调用方读 merged 判定） */
export function validatePos(merged: Record<string, any>, warn: (msg: string) => void): void {
    if (!NOTIFICATION_POS.has(merged.pos)) {
        warn(`engine.notifications: 未知 pos "${merged.pos}"，已回退 "${NOTIFICATION_DEFAULTS.pos}"`);
        merged.pos = NOTIFICATION_DEFAULTS.pos;
    }
}

/** merged.persist 枚举校验：非法值 warn + 回退 NONE（ADR-0077 数值化） */
export function validatePersist(merged: Record<string, any>, warn: (msg: string) => void): void {
    if (merged.persist != null && ![0, 1, 2, 3].includes(merged.persist as number)) {
        warn(
            `engine.notifications: 未知 persist "${merged.persist}"（0|1|2|3，ADR-0077），已回退 ${NOTIFICATION_PERSIST.NONE}`,
        );
        merged.persist = NOTIFICATION_PERSIST.NONE;
    }
}
