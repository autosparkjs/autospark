import type { AutoSpark } from "../../engine/engine";
/** 容器类名（用户 CSS / 测试定位契约） */
export declare const OVERLAYS_CONTAINER_CLASS = "autospark-overlays";
/** 容器属性标记（与类名双标记） */
export declare const OVERLAYS_CONTAINER_ATTR = "data-autospark-overlays";
/** dialog 模态遮罩类名契约（ADR-0052 决策 12；样式注入在 DialogDirective，结构在 OverlayInstance） */
export declare const MASK_CLASS = "autospark-dialog-mask";
/** 取（或懒建）本 engine 的覆盖物容器；SSR 返回 null。 */
export declare function getOverlayContainer(engine: AutoSpark<any>): HTMLElement | null;
/** 移除本 engine 的覆盖层容器（engine.destroy 调用）；不存在则 no-op。 */
export declare function removeOverlayContainer(engine: AutoSpark<any>): void;
