import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { AutoSpark } from "../engine/engine";
/**
 * 解析实例生效 maxWidths（ADR-0105 决策 5，回退不合并）：实例 `x-container-options` /
 * 宿主 `x-options`（read 链）→ `options.viewport.maxWidths` → 内置缺省表。非 CSS 宽度
 * 值 warn + 忽略；整表无有效项回退内置缺省表 + warn。纯函数（单测直击）。
 */
export declare function resolveContainerMaxWidths(read: (key: "maxWidths") => any, global?: Record<string, number | string>, warn?: (msg: string) => void): Record<string, string>;
/** 注入容器全局样式（幂等）：基础契约 + 内置缺省表按档规则 + .fluid 中立化 */
export declare function registerContainerStyles(): void;
/**
 * x-container 指令（ADR-0101 立 / ADR-0105 重写）：Compile kind、singleton、priority 0，
 * 非结构指令、不 ownsChildren，与 x-if / x-show / x-for 正交。档位真相全局唯一
 * （`$.viewport`），本指令只装配视觉契约与消费档位。
 */
export declare class ContainerDirective extends AutoSparkDirectiveBase {
    static readonly priority = 0;
    static readonly singleton = true;
    /** 类级初始化：注入容器全局样式（幂等） */
    static initialize(_engine: AutoSpark): void;
    /** 实例生效 max-width 表（回退链归一产物） */
    private _maxWidths;
    /** .fluid：关按档 max-width（档位通道照常） */
    private _fluid;
    /** 当前档（null = 未定——首值必写，此后同档短路） */
    private _tier;
    /** 自定义表 scoped style 指纹（destroy 减引用） */
    private _styleKey;
    created(): void;
    destroy(): void;
    /** 应用档位变更：data-breakpoint（同档不动作——档位记忆化；初值 from null 必写）。 */
    private _applyTier;
}
