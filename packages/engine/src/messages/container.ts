import type { AutoSpark } from "../engine";
import { formatMessageSize, type MessagePos } from "./types";
import { injectMessageStyles } from "./styles";

/**
 * 消息容器与分区列（ADR-0071，机制沿 ADR-0068 决策 2/7）。
 *
 * - **容器**：每 engine 一个，挂 `document.body` 下，首个消息显示时懒创建、
 *   `engine.destroy()` 时经 {@link removeMessageContainer} 整体移除（tooltip / overlay 容器
 *   同构）。容器本身**透明壳**（无定位样式）——定位归分区列。
 * - **分区列**：每 pos 一列的 fixed 定位纵向堆叠栈（`data-message-pos` 标记），**引擎结构**
 *   （与 overlay 遮罩同地位——不组件化，只留类名 + CSS 变量契约）。各 pos 首用时懒建；
 *   `offset` 仅在列创建时生效（写 inline CSS 变量 `--autospark-message-inset`，已建列不迁移）。
 * - SSR 环境（`typeof document === "undefined"`）返回 null（调用方跳过显示）。
 */
const containers = new WeakMap<AutoSpark<any>, HTMLElement>();

/** 容器类名（用户 CSS / 测试定位契约） */
export const MESSAGES_CONTAINER_CLASS = "autospark-messages";
/** 容器属性标记（与类名双标记） */
export const MESSAGES_CONTAINER_ATTR = "data-autospark-messages";
/** 分区列属性标记（pos 值；slide 方向覆写层按此前缀/后缀分派） */
export const MESSAGE_COLUMN_ATTR = "data-message-pos";

/** 取（或懒建）本 engine 的消息容器；SSR 返回 null。首建时幂等注入消息样式。 */
export function getMessageContainer(engine: AutoSpark<any>): HTMLElement | null {
    if (typeof document === "undefined" || !document.body) return null;
    let el = containers.get(engine);
    if (!el) {
        el = document.createElement("div");
        el.className = MESSAGES_CONTAINER_CLASS;
        el.setAttribute(MESSAGES_CONTAINER_ATTR, "");
        document.body.appendChild(el);
        containers.set(engine, el);
        injectMessageStyles();
    }
    return el;
}

/**
 * 取（或懒建）pos 对应的分区列（append 进容器，顺序即创建序）；SSR 返回 null。
 * `offset` 仅在**列首次创建**时生效——已建列不迁移（ADR-0068 决策 7 沿用）。
 */
export function getMessageColumn(
    engine: AutoSpark<any>,
    pos: MessagePos,
    offset?: number | string,
): HTMLElement | null {
    const container = getMessageContainer(engine);
    if (!container) return null;
    let column = container.querySelector<HTMLElement>(`:scope > [${MESSAGE_COLUMN_ATTR}="${pos}"]`);
    if (!column) {
        column = document.createElement("div");
        column.className = "autospark-message-column";
        column.setAttribute(MESSAGE_COLUMN_ATTR, pos);
        if (offset != null) column.style.setProperty("--autospark-message-inset", formatMessageSize(offset));
        container.appendChild(column);
    }
    return column;
}

/** 移除本 engine 的消息容器（含全部分区列；engine.destroy 调用）；不存在则 no-op。 */
export function removeMessageContainer(engine: AutoSpark<any>): void {
    const el = containers.get(engine);
    if (el) {
        el.remove();
        containers.delete(engine);
    }
}
