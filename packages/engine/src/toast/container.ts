import type { AutoSpark } from "../engine";
import { formatToastSize, type ToastPos } from "./types";
import { injectToastStyles } from "./styles";

/**
 * 轻提示容器与分区列（ADR-0068 决策 2/7）。
 *
 * - **容器**：每 engine 一个，挂 `document.body` 下，首个 toast 显示时懒创建、
 *   `engine.destroy()` 时经 {@link removeToastContainer} 整体移除（tooltip / overlay 容器
 *   同构）。容器本身**透明壳**（无定位样式）——定位归分区列。
 * - **分区列**：每 pos 一列的 fixed 定位纵向堆叠栈（`data-toast-pos` 标记），**引擎结构**
 *   （与 overlay 遮罩同地位——不组件化，只留类名 + CSS 变量契约，ADR-0068 决策 2）。
 *   各 pos 首用时懒建；`offset` 仅在列创建时生效（写 inline CSS 变量
 *   `--autospark-toast-inset`，已建列不迁移——ADR-0068 决策 7）。
 * - SSR 环境（`typeof document === "undefined"`）返回 null（调用方跳过显示）。
 */
const containers = new WeakMap<AutoSpark<any>, HTMLElement>();

/** 容器类名（用户 CSS / 测试定位契约） */
export const TOASTS_CONTAINER_CLASS = "autospark-toasts";
/** 容器属性标记（与类名双标记） */
export const TOASTS_CONTAINER_ATTR = "data-autospark-toasts";
/** 分区列属性标记（pos 值；slide 方向覆写层按此前缀/后缀分派） */
export const TOAST_COLUMN_ATTR = "data-toast-pos";

/** 取（或懒建）本 engine 的 toast 容器；SSR 返回 null。首建时幂等注入 toast 样式。 */
export function getToastContainer(engine: AutoSpark<any>): HTMLElement | null {
    if (typeof document === "undefined" || !document.body) return null;
    let el = containers.get(engine);
    if (!el) {
        el = document.createElement("div");
        el.className = TOASTS_CONTAINER_CLASS;
        el.setAttribute(TOASTS_CONTAINER_ATTR, "");
        document.body.appendChild(el);
        containers.set(engine, el);
        injectToastStyles();
    }
    return el;
}

/**
 * 取（或懒建）pos 对应的分区列（append 进容器，顺序即创建序）；SSR 返回 null。
 * `offset` 仅在**列首次创建**时生效——已建列不迁移（ADR-0068 决策 7）。
 */
export function getToastColumn(engine: AutoSpark<any>, pos: ToastPos, offset?: number | string): HTMLElement | null {
    const container = getToastContainer(engine);
    if (!container) return null;
    let column = container.querySelector<HTMLElement>(`:scope > [${TOAST_COLUMN_ATTR}="${pos}"]`);
    if (!column) {
        column = document.createElement("div");
        column.className = "autospark-toast-column";
        column.setAttribute(TOAST_COLUMN_ATTR, pos);
        if (offset != null) column.style.setProperty("--autospark-toast-inset", formatToastSize(offset));
        container.appendChild(column);
    }
    return column;
}

/** 移除本 engine 的 toast 容器（含全部分区列；engine.destroy 调用）；不存在则 no-op。 */
export function removeToastContainer(engine: AutoSpark<any>): void {
    const el = containers.get(engine);
    if (el) {
        el.remove();
        containers.delete(engine);
    }
}
