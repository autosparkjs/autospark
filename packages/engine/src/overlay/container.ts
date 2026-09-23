import type { AutoSpark } from "../engine";

/**
 * 覆盖物容器（ADR-0052 决策 13）：**每 engine 一个**，挂 `document.body` 下。
 *
 * - 首个覆盖物打开时**懒创建**；`engine.destroy()` 时经 {@link removeOverlayContainer} 整体移除。
 * - 容器本身是**透明壳**（无定位样式）——dialog 实例自带 fixed 遮罩，未来 popup/popover 的
 *   锚定定位不受容器布局约束。
 * - 类名 + 属性双标记，便于用户 CSS 定位与测试选择器。
 * - SSR 环境（`typeof document === "undefined"`）返回 null（调用方跳过挂载）。
 */
const containers = new WeakMap<AutoSpark<any>, HTMLElement>();

/** 容器类名（用户 CSS / 测试定位契约） */
export const OVERLAYS_CONTAINER_CLASS = "autospark-overlays";
/** 容器属性标记（与类名双标记） */
export const OVERLAYS_CONTAINER_ATTR = "data-autospark-overlays";

/** dialog 模态外壳类名契约（ADR-0052 决策 12；样式注入在 DialogDirective，结构在 OverlayInstance） */
export const MASK_CLASS = "autospark-dialog-mask";
export const PANEL_CLASS = "autospark-dialog";

/** 取（或懒建）本 engine 的覆盖物容器；SSR 返回 null。 */
export function getOverlayContainer(engine: AutoSpark<any>): HTMLElement | null {
    if (typeof document === "undefined" || !document.body) return null;
    let el = containers.get(engine);
    if (!el) {
        el = document.createElement("div");
        el.className = OVERLAYS_CONTAINER_CLASS;
        el.setAttribute(OVERLAYS_CONTAINER_ATTR, "");
        document.body.appendChild(el);
        containers.set(engine, el);
    }
    return el;
}

/** 移除本 engine 的覆盖层容器（engine.destroy 调用）；不存在则 no-op。 */
export function removeOverlayContainer(engine: AutoSpark<any>): void {
    const el = containers.get(engine);
    if (el) {
        el.remove();
        containers.delete(engine);
    }
}
