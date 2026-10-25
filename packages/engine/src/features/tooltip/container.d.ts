import type { AutoSpark } from "../../engine/engine";
/** 容器类名（用户 CSS / 测试定位契约） */
export declare const TOOLTIPS_CONTAINER_CLASS = "autospark-tooltips";
/** 容器属性标记（与类名双标记） */
export declare const TOOLTIPS_CONTAINER_ATTR = "data-autospark-tooltips";
/** 浮层类名契约（样式注入在 styles.ts，结构在 TooltipManager） */
export declare const TOOLTIP_CLASS = "autospark-tooltip";
/** 箭头载体类名（伪元素默认视觉挂其 ::before/::after；视觉协议同 overlay 箭头家族） */
export declare const TOOLTIP_ARROW_CLASS = "autospark-tooltip-arrow";
/** 最终弹出方向写回属性（flip 后的最终值；slide 方向覆写层与箭头偏移按此前缀分派） */
export declare const TOOLTIP_PLACEMENT_ATTR = "data-tooltip-placement";
/** border 开关标记（border: true 时打点；CSS 据此画边框 + 箭头双层变色融合） */
export declare const TOOLTIP_BORDER_ATTR = "data-tooltip-border";
/** 取（或懒建）本 engine 的 tooltip 容器；SSR 返回 null。 */
export declare function getTooltipContainer(engine: AutoSpark<any>): HTMLElement | null;
/** 移除本 engine 的 tooltip 容器（engine.destroy 调用）；不存在则 no-op。 */
export declare function removeTooltipContainer(engine: AutoSpark<any>): void;
