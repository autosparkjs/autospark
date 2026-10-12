/**
 * viewport 全局视口特性类型（ADR-0105）。
 *
 * 档位枚举与默认表自 ADR-0101 的 x-container 迁入（原 ContainerTier 系更名
 * ViewportTier 系）：档位判定收归全局特性后，枚举/阈值真相源在本特性，
 * x-container 等消费者单向引用。
 */

/** 视口档位名（xs = < sm 的隐含兜底档，无阈值） */
export type ViewportTier = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

/** 档位升序全集（判定与校验用） */
export const VIEWPORT_TIERS: readonly ViewportTier[] = ["xs", "sm", "md", "lg", "xl", "xxl"];

/** 内置缺省阈值表（Bootstrap 5 对齐；xs 无阈值不入表，ADR-0101 决策 3） */
export const DEFAULT_VIEWPORT_BREAKPOINTS: Record<string, number> = {
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
};

/** 内置缺省按档 max-width 表（xs 档 = 100% 无约束；x-container 视觉消费） */
export const DEFAULT_VIEWPORT_MAX_WIDTHS: Record<string, string> = {
    xs: "100%",
    sm: "540px",
    md: "720px",
    lg: "960px",
    xl: "1140px",
    xxl: "1320px",
};

/**
 * viewport 引擎级配置（`options.viewport`，ADR-0105 决策 4）：构造期配置语义，
 * 运行时突变不生效（options 家族纪律）。三态开关在 `AutoSparkOptions.viewport`
 * （`false` 整体关闭），本接口仅配置对象形态的成员。
 */
export interface ViewportOptions {
    /**
     * 档位阈值表（**engine 级唯一真相**——ViewportManager 判定与 x-container media
     * 样式同源消费；number 按 px / 裸数字或 `Npx` 串；xs 无效——隐含兜底档无阈值）
     */
    breakpoints?: Record<string, number | string>;
    /** 按档 max-width 表（x-container 的 engine 级兜底；实例 `x-container-options` 优先） */
    maxWidths?: Record<string, number | string>;
}

/** 生效阈值表（归一后纯数据：档位判定与 x-container media 样式生成共用） */
export interface ResolvedViewportBreakpoints {
    /** 升序档位（不含 xs） */
    tiers: ViewportTier[];
    /** 与 tiers 对齐的 px 阈值 */
    thresholds: number[];
}
