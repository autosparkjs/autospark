import type { AutoSpark } from "../engine";

/**
 * 工具提示容器（ADR-0061 决策 15）：**每 engine 一个**，挂 `document.body` 下。
 *
 * - 首次显示 tooltip 时**懒创建**；`engine.destroy()` 时经 {@link removeTooltipContainer} 整体移除。
 * - 容器本身**透明壳**（无定位样式）——浮层 position:fixed 定位不受容器布局约束。
 * - 浮层单例常驻容器内（显示切换内容 + 重定位，隐藏 display:none）——不反复摘挂 DOM。
 * - 类名 + 属性双标记，便于用户 CSS 定位与测试选择器。
 * - SSR 环境（`typeof document === "undefined"`）返回 null（调用方跳过显示）。
 */
const containers = new WeakMap<AutoSpark<any>, HTMLElement>();

/** 容器类名（用户 CSS / 测试定位契约） */
export const TOOLTIPS_CONTAINER_CLASS = "autospark-tooltips";
/** 容器属性标记（与类名双标记） */
export const TOOLTIPS_CONTAINER_ATTR = "data-autospark-tooltips";

/** 浮层类名契约（样式注入在 styles.ts，结构在 TooltipManager） */
export const TOOLTIP_CLASS = "autospark-tooltip";
/** 箭头载体类名（伪元素默认视觉挂其 ::before/::after；视觉协议同 overlay 箭头家族） */
export const TOOLTIP_ARROW_CLASS = "autospark-tooltip-arrow";
/** 最终弹出方向写回属性（flip 后的最终值；slide 方向覆写层与箭头偏移按此前缀分派） */
export const TOOLTIP_PLACEMENT_ATTR = "data-tooltip-placement";
/** border 开关标记（border: true 时打点；CSS 据此画边框 + 箭头双层变色融合） */
export const TOOLTIP_BORDER_ATTR = "data-tooltip-border";

/** 取（或懒建）本 engine 的 tooltip 容器；SSR 返回 null。 */
export function getTooltipContainer(engine: AutoSpark<any>): HTMLElement | null {
    if (typeof document === "undefined" || !document.body) return null;
    let el = containers.get(engine);
    if (!el) {
        el = document.createElement("div");
        el.className = TOOLTIPS_CONTAINER_CLASS;
        el.setAttribute(TOOLTIPS_CONTAINER_ATTR, "");
        document.body.appendChild(el);
        containers.set(engine, el);
    }
    return el;
}

/** 移除本 engine 的 tooltip 容器（engine.destroy 调用）；不存在则 no-op。 */
export function removeTooltipContainer(engine: AutoSpark<any>): void {
    const el = containers.get(engine);
    if (el) {
        el.remove();
        containers.delete(engine);
    }
}
