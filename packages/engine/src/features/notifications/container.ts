import type { AutoSpark } from "../../engine/engine";
import { getOverlayContainer } from "../overlay/container";
import { formatNotificationSize, type NotificationPos } from "./types";
import { injectNotificationStyles } from "./styles";

/**
 * 通知容器与分区列（ADR-0071，机制沿 ADR-0068 决策 2/7 → **ADR-0089 决策七之二容器归一**）。
 *
 * - **容器**：每 engine 一个，挂 `.autospark-overlays`（引擎级 overlay 根）之下——dialog /
 *   popover / drawer / notifications 同根，跨家族层叠由同容器 DOM 序天然裁决，body 下引擎渲染根
 *   唯一。首个通知装配时懒创建、`engine.destroy()` 时经 {@link removeNotificationContainer} 移除。
 *   容器本身**透明壳**（无定位样式）——定位归分区列（fixed 定位不受透明壳影响）。
 * - **分区列**：每 pos 一列的 fixed 定位纵向堆叠栈（`data-notification-pos` 标记），**引擎结构**
 *   （与 overlay 遮罩同地位——不组件化，只留类名 + CSS 变量契约）。各 pos 首用时懒建；
 *   `offset` 仅在列创建时生效（写 inline CSS 变量 `--autospark-notification-inset`，已建列不迁移）。
 * - SSR 环境（`typeof document === "undefined"`）返回 null（调用方跳过装配）。
 */
const containers = new WeakMap<AutoSpark<any>, HTMLElement>();

/** 容器类名（用户 CSS / 测试定位契约） */
export const NOTIFICATIONS_CONTAINER_CLASS = "autospark-notifications";
/** 容器属性标记（与类名双标记） */
export const NOTIFICATIONS_CONTAINER_ATTR = "data-autospark-notifications";
/** 分区列属性标记（pos 值；slide 方向覆写层按此前缀/后缀分派） */
export const NOTIFICATION_COLUMN_ATTR = "data-notification-pos";

/** 取（或懒建）本 engine 的通知容器（挂 overlay 根下）；SSR 返回 null。首建时幂等注入通知样式。 */
export function getNotificationContainer(engine: AutoSpark<any>): HTMLElement | null {
    if (typeof document === "undefined" || !document.body) return null;
    let el = containers.get(engine);
    if (!el) {
        const host = getOverlayContainer(engine); // ADR-0089 决策七之二：引擎渲染根唯一
        if (!host) return null;
        el = document.createElement("div");
        el.className = NOTIFICATIONS_CONTAINER_CLASS;
        el.setAttribute(NOTIFICATIONS_CONTAINER_ATTR, "");
        host.appendChild(el);
        containers.set(engine, el);
        injectNotificationStyles();
    }
    return el;
}

/**
 * 取（或懒建）pos 对应的分区列（append 进容器，顺序即创建序）；SSR 返回 null。
 * `offset` 仅在**列首次创建**时生效——已建列不迁移（ADR-0068 决策 7 沿用）。
 */
export function getNotificationColumn(
    engine: AutoSpark<any>,
    pos: NotificationPos,
    offset?: number | string,
): HTMLElement | null {
    const container = getNotificationContainer(engine);
    if (!container) return null;
    let column = container.querySelector<HTMLElement>(`:scope > [${NOTIFICATION_COLUMN_ATTR}="${pos}"]`);
    if (!column) {
        column = document.createElement("div");
        column.className = "autospark-notification-column";
        column.setAttribute(NOTIFICATION_COLUMN_ATTR, pos);
        if (offset != null) column.style.setProperty("--autospark-notification-inset", formatNotificationSize(offset));
        container.appendChild(column);
    }
    return column;
}

/** 移除本 engine 的通知容器（含全部分区列；engine.destroy 调用）；不存在则 no-op。 */
export function removeNotificationContainer(engine: AutoSpark<any>): void {
    const el = containers.get(engine);
    if (el) {
        el.remove();
        containers.delete(engine);
    }
}
