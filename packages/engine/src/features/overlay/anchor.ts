/**
 * anchor 定位（ADR-0052 决策 21–24）：覆盖物面板相对定位锚的贴附。
 *
 * floating-ui 装配管线已提取至 `utils/floating.ts`（ADR-0061 tooltip 共享同一底座），
 * 本模块只保留 overlay 侧语义：
 *
 * - dialog **恒模态**：锚定只改位置不改模态性——遮罩照常渲染、照常拦截；无 `at` 或
 *   `at.selector` 未命中时面板退回屏幕居中（遮罩 flex 布局），warn 提示。
 * - `at.selector` 两栖（决策 22）：字符串选择器（queryRelElement 相对查询——无前缀
 *   searchRoot 子树内查 / `../` 父级爬升 / `^` closest / `/` 全局，打开时现查）或元素引用（命令式）。
 * - **箭头载体**：锚定模式箭头默认开启（`arrow: false` 显式关闭），载体元素由调用方
 *   （OverlayInstance）预先注入面板，视觉由载体双伪元素实现（dialog 样式注入）。
 * - placement 默认 `'auto'`（autoPlacement）——tooltip 侧覆盖为 `'top'` 默认（ADR-0061 决策 14）。
 */
import type { OverlayAnchorConfig } from "./types";
import { queryRelElement } from "../../utils/queryRelElement";
import { applyFloatingPosition } from "../../utils/floating";

/** 箭头载体元素类名（伪元素默认视觉挂其 ::before） */
export const OVERLAY_ARROW_CLASS = "autospark-overlay-arrow";

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

/** 锚定定位的形态特化选项（ADR-0063）：缺省零变化——popover/dialog 调用方不传即现状 */
export interface AnchorPositionOptions {
    /** `flip` 缺省值覆写（锚配置未显式给 flip 时生效；x-drawer 默认关——方向明确指定，ADR-0063） */
    flipDefault?: boolean;
    /** 每次定位完成回调（含 autoUpdate 重算）：placement 写回后触发（x-drawer 锚定长轴同步） */
    onPositioned?: (placement: string, anchorEl: HTMLElement, panel: HTMLElement) => void;
}

/**
 * 对面板应用锚定定位（position:fixed + floating-ui 计算）——委托通用管线
 * {@link applyFloatingPosition}，注入 overlay 侧契约（placement 写回属性 / 箭头载体查询）。
 *
 * @param anchor      锚配置（selector 已由调用方预检非空）
 * @param anchorEl    解析出的定位锚元素
 * @param panel       面板元素（定位目标；position 会被改写为 fixed）
 * @param registerCleanup 注册清理回调（autoUpdate 的 cleanup，实例销毁时执行）
 * @param opts        形态特化选项（flip 缺省覆写 / 定位完成钩子；缺省零变化）
 * @returns 是否成功进入锚定模式（false = 无效环境，调用方退居中）
 */
export function applyAnchorPosition(
    anchor: OverlayAnchorConfig,
    anchorEl: HTMLElement,
    panel: HTMLElement,
    registerCleanup: (fn: () => void) => void,
    opts?: AnchorPositionOptions,
): boolean {
    if (typeof document === "undefined") return false;
    return applyFloatingPosition(
        anchorEl,
        panel,
        anchor,
        registerCleanup,
        {
            placementAttr: "data-overlay-placement",
            arrowSelector: `:scope > .${OVERLAY_ARROW_CLASS}`,
            flipDefault: opts?.flipDefault,
            onPositioned: opts?.onPositioned,
        },
    );
}
