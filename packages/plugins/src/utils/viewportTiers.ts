/**
 * 视口档位常量（自 engine features/viewport/types 复制，ADR-0008 决策 3——状态源
 * ViewportManager 留 engine 核心，消费端常量随插件单源）。
 */
export type ViewportTier = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

export const VIEWPORT_TIERS: readonly ViewportTier[] = ["xs", "sm", "md", "lg", "xl", "xxl"];

/** 内置缺省 max-width 表（Bootstrap 5 对齐） */
export const DEFAULT_VIEWPORT_MAX_WIDTHS: Record<string, string> = {
    xs: "100%",
    sm: "540px",
    md: "720px",
    lg: "960px",
    xl: "1140px",
    xxl: "1320px",
};
