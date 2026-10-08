import type { AutoSpark } from "../../engine/engine";

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

/** 遮罩样式 <style> 的 id（首次懒建容器时注入一次，常驻不回收） */
const MASK_STYLES_ID = "autospark-mask-styles";

/**
 * 注入遮罩默认样式（幂等）——**遮罩是引擎结构**（mask 选项控制显隐，不归 shell，ADR-0062）：
 * fixed 全屏 + flex 居中（锚定模式下面板 position:fixed 脱离 flex 流，不受影响）；
 * z-index 走 CSS 变量（用户可全局调层）。
 */
function injectMaskStyles(): void {
    if (document.getElementById(MASK_STYLES_ID)) return;
    const style = document.createElement("style");
    style.id = MASK_STYLES_ID;
    style.textContent = `
.${MASK_CLASS} {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--autospark-overlay-z, 1000);
}`;
    document.head.appendChild(style);
}

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
        injectMaskStyles();
        // 容器纳入 tooltip 委托监听（ADR-0061 决策 15）：dialog 内容在 body 下、引擎根之外，
        // 不挂监听则其中的 title/data-tooltip 退回原生 tooltip
        engine.tooltipManager.attachDelegationRoot(el);
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
