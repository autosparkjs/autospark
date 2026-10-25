import { AutoSparkDirectiveBase } from "../features/directive/base";
import type { AutoSpark } from "../engine/engine";
import { type ViewportTier } from "../features/viewport/types";
/** 档位隐藏类（!important——档位隐藏恒胜 x-show 的 inline display 与用户 CSS） */
export declare const VIEWPORT_HIDDEN_CLASS = "autospark-viewport-hidden";
/** 注入视口显隐全局样式（幂等） */
export declare function registerViewportStyles(): void;
/** 值解析产物：目标档位集合 */
export interface ParsedViewportTiers {
    tiers: Set<ViewportTier>;
}
/**
 * 解析指令值 → 档位集合（纯函数，单测直击）：逗号分隔 + trim + 固定枚举校验，
 * 未知档名静默跳过。空值 / 全部无效返回 null（调用方 warn + 指令整体忽略）。
 */
export declare function parseViewportTiers(raw: unknown): ParsedViewportTiers | null;
/**
 * x-viewport 指令（ADR-0106）：Compile kind、singleton、priority 80（显隐家族对齐
 * x-show）。订阅 `$.viewport` 切档位隐藏类，不碰 inline display。
 */
export declare class ViewportDirective extends AutoSparkDirectiveBase {
    static readonly priority = 80;
    static readonly singleton = true;
    /** 类级初始化：注入视口显隐全局样式（幂等） */
    static initialize(_engine: AutoSpark): void;
    /** 目标档位集合（null = 指令失效——空值/全无效，整体忽略不做动作） */
    private _tiers;
    /** `.hide` 反向：列出档隐藏、其余可见 */
    private _hide;
    created(): void;
    /** 应用档位判定：非法值静默短路（不做任何动作，ADR-0106 决策 4）；合法值按正反向切隐藏类 */
    private _apply;
}
