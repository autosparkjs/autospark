/**
 * anchor 定位（ADR-0052 决策 21–24）：经 `@floating-ui/dom` 实现覆盖层面板相对定位锚的贴附。
 *
 * - dialog **恒模态**：anchor 只改位置不改模态性——遮罩照常渲染、照常拦截；无 anchor 或
 *   `anchor.at` 未命中时面板退回屏幕居中（遮罩 flex 布局），warn 提示。
 * - `anchor.at` 两栖（决策 22）：字符串选择器（`@` 前缀全局 / 无前缀 searchRoot 子树内查，
 *   打开时现查）或元素引用（命令式）。
 * - 中间件按配置装配：offset / shift 透传；flip 默认开（`flip: false` 关）；arrow: true 时
 *   引擎自动注入箭头**载体元素**（floating-ui arrow middleware 需真实元素承接定位计算），
 *   箭头**视觉**由载体伪元素实现（8×8 矩形旋转 45°，默认样式由 DialogDirective 注入，可覆盖）。
 * - autoUpdate 默认开（锚点滚动/resize 重定位）；无 ResizeObserver 环境（部分测试/SSR）退化为
 *   单次 computePosition。cleanup 回调注册到实例（销毁时执行）。
 */
import { computePosition, autoUpdate, offset as mwOffset, shift as mwShift, flip as mwFlip, arrow as mwArrow } from "@floating-ui/dom";
import type { OverlayAnchorConfig } from "./types";

/** 箭头载体元素类名（伪元素默认视觉挂其 ::before） */
export const OVERLAY_ARROW_CLASS = "autospark-overlay-arrow";

/**
 * 解析 anchor.at 为元素：元素直接返回；字符串按 `@` 前缀分流（全局 / searchRoot 子树内）。
 * 未命中返回 null（调用方退居中 + warn）。
 */
export function resolveAnchorEl(
    at: string | HTMLElement | undefined,
    searchRoot: HTMLElement | null,
): HTMLElement | null {
    if (at instanceof HTMLElement) return at;
    const sel = String(at ?? "").trim();
    if (!sel) return null;
    const isGlobal = sel.startsWith("@");
    const query = isGlobal ? sel.slice(1) : sel;
    if (!query) return null;
    try {
        const root: ParentNode = isGlobal ? document : searchRoot ?? document;
        const found = root.querySelector(query);
        return found instanceof HTMLElement ? found : null;
    } catch {
        return null; // 非法选择器按未命中处理（不中断打开）
    }
}

/**
 * 对面板应用锚定定位（position:fixed + floating-ui 计算）。
 *
 * @param anchor      锚配置（at 已由调用方预检非空）
 * @param anchorEl    解析出的定位锚元素
 * @param panel       面板元素（定位目标；position 会被改写为 fixed）
 * @param registerCleanup 注册清理回调（autoUpdate 的 cleanup，实例销毁时执行）
 * @returns 是否成功进入锚定模式（false = 无效环境，调用方退居中）
 */
export function applyAnchorPosition(
    anchor: OverlayAnchorConfig,
    anchorEl: HTMLElement,
    panel: HTMLElement,
    registerCleanup: (fn: () => void) => void,
): boolean {
    if (typeof document === "undefined") return false;
    panel.style.position = "fixed";
    panel.style.margin = "0";
    const middleware: any[] = [];
    if (anchor.offset != null) middleware.push(mwOffset(anchor.offset as any));
    if (anchor.flip !== false) middleware.push(mwFlip());
    if (anchor.shift != null) middleware.push(mwShift(anchor.shift as any));
    const arrowEl = anchor.arrow
        ? (panel.querySelector(`:scope > .${OVERLAY_ARROW_CLASS}`) as HTMLElement | null)
        : null;
    if (arrowEl) middleware.push(mwArrow({ element: arrowEl } as any));

    const update = () => {
        computePosition(anchorEl, panel, {
            placement: (anchor.placement as any) ?? "bottom",
            middleware,
        }).then(({ x, y, placement, middlewareData }) => {
            Object.assign(panel.style, {
                left: `${x}px`,
                top: `${y}px`,
            });
            // placement 写回面板（箭头伪元素按边旋转的 CSS 契约）
            panel.setAttribute("data-overlay-placement", placement);
            // 箭头载体定位（floating-ui 约定：middlewareData.arrow.{x,y} 相对面板）
            if (arrowEl && middlewareData.arrow) {
                const { x: ax, y: ay } = middlewareData.arrow as { x?: number; y?: number };
                Object.assign(arrowEl.style, {
                    left: ax != null ? `${ax}px` : "",
                    top: ay != null ? `${ay}px` : "",
                });
            }
        }).catch(() => {
            /* 定位失败（锚点中途移除等）：保留上次位置 */
        });
    };
    update();
    // autoUpdate：锚点滚动/resize 重定位。无 ResizeObserver 环境（happy-dom 等）退化为单次计算。
    if (typeof ResizeObserver !== "undefined") {
        registerCleanup(autoUpdate(anchorEl, panel, update));
    }
    return true;
}
