/**
 * anchor 定位（ADR-0052 决策 21–24）：经 `@floating-ui/dom` 实现覆盖物面板相对定位锚的贴附。
 *
 * - dialog **恒模态**：锚定只改位置不改模态性——遮罩照常渲染、照常拦截；无 `at` 或
 *   `at.selector` 未命中时面板退回屏幕居中（遮罩 flex 布局），warn 提示。
 * - `at.selector` 两栖（决策 22）：字符串选择器（queryRelElement 相对查询——无前缀
 *   searchRoot 子树内查 / `../` 父级爬升 / `^` closest / `/` 全局，打开时现查）或元素引用（命令式）。
 * - **placement 默认 `'auto'`**：视口空间自动选位（autoPlacement middleware，按可用空间从
 *   候选方向中选最优）。显式配置具体方向（`'top'` / `'bottom-start'` 等 12 值）则固定方向 +
 *   flip 视口翻转（默认开）。`auto` 与 `flip`/`placement` 选项互斥（autoPlacement 经 reset
 *   自主决定最终 placement，由 computePosition 返回值回写）。
 * - 中间件按配置装配：offset / shift 透传（箭头开启且未配置 offset 时默认让位 6px，三角尖
 *   点在锚元素边缘上）；**锚定模式下 arrow 默认开启**（`arrow: false` 显式关闭）——引擎自动
 *   注入箭头**载体元素**（floating-ui arrow middleware 需真实元素承接定位计算），箭头**视觉**
 *   由载体双伪元素实现（8×8 矩形旋转 45°：`::before` 带阴影、`::after` 无阴影沿主轴向面板
 *   内侧偏移覆盖嵌入段阴影残留，默认样式由 DialogDirective 注入，可覆盖）。
 * - 箭头对齐遵循 floating-ui 官方协议：middleware 给出的 x/y 把载体贴在面板边缘**内侧**，
 *   须按最终 placement 的 staticSide 反向偏移载体尺寸的一半（`style[staticSide] = -half`），
 *   使载体中心落在面板边缘线上——旋转 45° 的菱形一半嵌入面板与面板同色融合、一半露出
 *   形成指向锚点的小三角。
 * - autoUpdate 默认开（锚点滚动/resize 重定位）；无 ResizeObserver 环境（部分测试/SSR）退化为
 *   单次 computePosition。cleanup 回调注册到实例（销毁时执行）。
 */
import { computePosition, autoUpdate, offset as mwOffset, shift as mwShift, flip as mwFlip, arrow as mwArrow, autoPlacement as mwAutoPlacement } from "@floating-ui/dom";
import type { OverlayAnchorConfig } from "./types";
import { queryRelElement } from "../utils/queryRelElement";

/** 箭头载体元素类名（伪元素默认视觉挂其 ::before） */
export const OVERLAY_ARROW_CLASS = "autospark-overlay-arrow";

/** placement 主方向 → staticSide（箭头所在的面板边缘侧）映射 */
const STATIC_SIDE: Record<string, string> = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left",
};

/**
 * 箭头默认让位间距（px）：菱形（8px 载体旋转 45°）露出面板外的尖角高 ≈ 对角线一半 ≈ 5.66px，
 * 取整 6px——面板与锚点留出此间隙后三角尖恰好点在锚元素边缘（floating-ui 官方 tooltip 惯例）。
 */
const ARROW_DEFAULT_OFFSET = 6;

/**
 * 解析 at.selector 为元素：元素直接返回；字符串走 {@link queryRelElement} 相对查询——
 * 普通选择器在 searchRoot 子树内查、`'../'` 父级爬升、`'/'` 全局、`'^'` closest 向上。
 * 未命中 / 非法选择器返回 null（调用方退居中 + warn）。
 */
export function resolveAnchorEl(
    selector: string | HTMLElement | undefined,
    searchRoot: HTMLElement | null,
): HTMLElement | null {
    if (selector instanceof HTMLElement) return selector;
    const sel = String(selector ?? "").trim();
    if (!sel) return null;
    const found = queryRelElement((searchRoot ?? document.body) as Element | null, sel);
    return found instanceof HTMLElement ? found : null;
}

/**
 * 对面板应用锚定定位（position:fixed + floating-ui 计算）。
 *
 * @param anchor      锚配置（selector 已由调用方预检非空）
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
    // placement 默认 'auto'：autoPlacement 视口空间自动选位；显式方向则固定 + flip 翻转
    const placement = anchor.placement ?? "auto";
    const useAuto = placement === "auto";
    // 锚定模式箭头默认开启（arrow: false 显式关闭）；载体由调用方在进入锚定前注入面板
    const arrowEl =
        anchor.arrow !== false
            ? (panel.querySelector(`:scope > .${OVERLAY_ARROW_CLASS}`) as HTMLElement | null)
            : null;
    const middleware: any[] = [];
    if (anchor.offset != null) {
        middleware.push(mwOffset(anchor.offset as any));
    } else if (arrowEl) {
        // 箭头开启且未显式配置 offset：默认让位菱形露出高度（对角线一半 ≈ 5.66px，取整 6px，
        // floating-ui 官方 tooltip 惯例）——三角尖恰好点在锚元素边缘上，而非覆盖锚元素内部。
        middleware.push(mwOffset(ARROW_DEFAULT_OFFSET));
    }
    if (useAuto) {
        // autoPlacement 与 flip/placement 互斥（经 reset 自主决定最终 placement）
        middleware.push(mwAutoPlacement());
    } else if (anchor.flip !== false) {
        middleware.push(mwFlip());
    }
    if (anchor.shift != null) middleware.push(mwShift(anchor.shift as any));
    if (arrowEl) middleware.push(mwArrow({ element: arrowEl } as any));

    const update = () => {
        computePosition(anchorEl, panel, {
            // auto 模式不传 placement（computePosition 默认 'bottom' 会被 autoPlacement reset 覆盖）
            placement: useAuto ? undefined : (placement as any),
            middleware,
        }).then(({ x, y, placement, middlewareData }) => {
            Object.assign(panel.style, {
                left: `${x}px`,
                top: `${y}px`,
            });
            // placement 写回面板（flip 后的最终值；箭头伪元素按边旋转的 CSS 契约）
            panel.setAttribute("data-overlay-placement", placement);
            // 箭头载体定位（floating-ui 官方协议）：middlewareData.arrow.{x,y} 是把载体**贴在
            // 面板边缘内侧**的位置，还须按 staticSide（最终 placement 主方向的对侧）反向偏移
            // 载体尺寸的一半，让载体中心落在面板边缘线上——旋转 45° 的菱形才能一半嵌入面板
            // （同色融合）、一半露出形成小三角。
            if (arrowEl && middlewareData.arrow) {
                const { x: ax, y: ay } = middlewareData.arrow as { x?: number; y?: number };
                const staticSide =
                    STATIC_SIDE[String(placement).split("-")[0]] ?? "bottom";
                Object.assign(arrowEl.style, {
                    left: ax != null ? `${ax}px` : "",
                    top: ay != null ? `${ay}px` : "",
                    [staticSide]: `${-arrowEl.offsetWidth / 2}px`,
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
