/**
 * 通用 floating-ui 定位装配（ADR-0052 决策 21–24 / ADR-0061 决策 14 的共享底座）。
 *
 * 自 overlay/anchor.ts 提取：middleware 装配（offset/shift/flip/arrow/autoPlacement）、
 * computePosition 调用、箭头载体 staticSide 反偏协议——overlay（x-dialog at 锚定）与
 * tooltip（data-tooltip 悬浮定位）双消费，调用方以 {@link FloatingContract} 注入各自的
 * 写回属性名与箭头载体查询（类名契约分域，定位管线同源）。
 *
 * - **placement 默认 `'auto'`**：autoPlacement 视口空间自动选位（overlay 默认）；tooltip
 *   恒传具体方向（`'top'` + flip，业界惯例，ADR-0061 决策 14）。显式方向则固定 + flip 翻转。
 * - 中间件按配置装配：offset / shift 透传（箭头开启且未配置 offset 时默认让位 6px，三角尖
 *   点在锚元素边缘上）；**箭头载体须由调用方预先注入 panel**（本函数只负责定位它）。
 * - autoUpdate 默认开（锚点滚动/resize 重定位）；无 ResizeObserver 环境（部分测试/SSR）退化为
 *   单次 computePosition。cleanup 回调经 registerCleanup 注册（实例/浮层销毁时执行）。
 */
import {
    computePosition,
    autoUpdate,
    offset as mwOffset,
    shift as mwShift,
    flip as mwFlip,
    arrow as mwArrow,
    autoPlacement as mwAutoPlacement,
} from "@floating-ui/dom";

/** 浮动定位选项（字段名与 floating-ui 词汇对齐；overlay 的 OverlayAnchorConfig 结构兼容） */
export interface FloatingPositionOptions {
    /** 'auto'（autoPlacement，overlay 默认）或 floating-ui 12 方向值（固定 + flip） */
    placement?: string;
    /** 透传 offset 中间件（间距） */
    offset?: any;
    /** 透传 shift 中间件（视口内滑移 padding） */
    shift?: any;
    /** 视口翻转，默认 true；placement: 'auto' 时无 flip（互斥） */
    flip?: boolean;
    /** 箭头：true 时对 panel 内载体元素（contract.arrowSelector）应用 arrow middleware */
    arrow?: boolean;
}

/** 消费方契约：写回属性名 + 箭头载体查询（类名分域，管线同源）+ 形态特化钩子 */
export interface FloatingContract {
    /** 最终 placement 写回属性名（flip/autoPlacement 后的最终方向；CSS 按此分派方向性视觉） */
    placementAttr: string;
    /** 箭头载体元素查询（相对 panel，`:scope >` 前缀由调用方保证直挂关系） */
    arrowSelector: string;
    /**
     * `flip` 缺省值覆写（`opts.flip` 未显式给时生效；显式配置恒尊重）。x-drawer 传 false——
     * 抽屉方向是用户明确指定，空间不足不翻转（ADR-0063）；缺省 true（floating-ui 推荐默认，
     * overlay/tooltip 现状不变）。
     */
    flipDefault?: boolean;
    /**
     * 每次定位完成回调（含 autoUpdate 滚动/resize 重算）：placement 写回面板后触发——
     * 形态特化的同步点（x-drawer 锚定长轴 = 锚边长，随锚 resize 重同步，ADR-0063）。
     */
    onPositioned?: (placement: string, anchorEl: HTMLElement, panel: HTMLElement) => void;
}

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
export const FLOATING_ARROW_DEFAULT_OFFSET = 6;

/**
 * 对浮层应用 floating-ui 定位（position:fixed + computePosition）。
 *
 * @param anchorEl        定位锚元素（调用方解析完毕；本函数不做选择器查询）
 * @param panel           面板元素（定位目标；position 会被改写为 fixed）
 * @param opts            定位选项（placement/offset/shift/flip/arrow）
 * @param registerCleanup 注册清理回调（autoUpdate 的 cleanup，销毁时执行）
 * @param contract        消费方契约（写回属性名 / 箭头载体查询）
 * @returns 是否成功进入定位流程（false = 无效环境，调用方自行回退）
 */
export function applyFloatingPosition(
    anchorEl: HTMLElement,
    panel: HTMLElement,
    opts: FloatingPositionOptions,
    registerCleanup: (fn: () => void) => void,
    contract: FloatingContract,
): boolean {
    if (typeof document === "undefined") return false;
    panel.style.position = "fixed";
    panel.style.margin = "0";
    // placement 默认 'auto'：autoPlacement 视口空间自动选位；显式方向则固定 + flip 翻转
    const placement = opts.placement ?? "auto";
    const useAuto = placement === "auto";
    const arrowEl =
        opts.arrow !== false
            ? (panel.querySelector(contract.arrowSelector) as HTMLElement | null)
            : null;
    const middleware: any[] = [];
    if (opts.offset != null) {
        middleware.push(mwOffset(opts.offset as any));
    } else if (arrowEl) {
        // 箭头开启且未显式配置 offset：默认让位菱形露出高度（对角线一半 ≈ 5.66px，取整 6px，
        // floating-ui 官方 tooltip 惯例）——三角尖恰好点在锚元素边缘上，而非覆盖锚元素内部。
        middleware.push(mwOffset(FLOATING_ARROW_DEFAULT_OFFSET));
    }
    if (useAuto) {
        // autoPlacement 与 flip/placement 互斥（经 reset 自主决定最终 placement）
        middleware.push(mwAutoPlacement());
    } else if ((opts.flip ?? contract.flipDefault ?? true) !== false) {
        // flip 缺省值可被消费方契约覆写（opts.flip 显式配置恒优先——x-drawer 默认关，ADR-0063）
        middleware.push(mwFlip());
    }
    if (opts.shift != null) middleware.push(mwShift(opts.shift as any));
    if (arrowEl) middleware.push(mwArrow({ element: arrowEl } as any));

    const update = () => {
        computePosition(anchorEl, panel, {
            // auto 模式不传 placement（computePosition 默认 'bottom' 会被 autoPlacement reset 覆盖）
            placement: useAuto ? undefined : (placement as any),
            middleware,
        })
            .then(({ x, y, placement: finalPlacement, middlewareData }) => {
                Object.assign(panel.style, {
                    left: `${x}px`,
                    top: `${y}px`,
                });
                // 最终 placement 写回面板（flip 后的值；箭头伪元素与方向性动画按此分派）
                panel.setAttribute(contract.placementAttr, finalPlacement);
                // 形态特化同步点（含 autoUpdate 重算路径）：长轴同步等消费方钩子（ADR-0063）
                contract.onPositioned?.(String(finalPlacement), anchorEl, panel);
                // 箭头载体定位（floating-ui 官方协议）：middlewareData.arrow.{x,y} 是把载体**贴在
                // 面板边缘内侧**的位置，还须按 staticSide（最终 placement 主方向的对侧）反向偏移
                // 载体尺寸的一半，让载体中心落在面板边缘线上——旋转 45° 的菱形才能一半嵌入面板
                // （同色融合）、一半露出形成小三角。
                if (arrowEl && middlewareData.arrow) {
                    const { x: ax, y: ay } = middlewareData.arrow as { x?: number; y?: number };
                    const staticSide =
                        STATIC_SIDE[String(finalPlacement).split("-")[0] ?? "bottom"] ?? "bottom";
                    Object.assign(arrowEl.style, {
                        left: ax != null ? `${ax}px` : "",
                        top: ay != null ? `${ay}px` : "",
                        [staticSide]: `${-arrowEl.offsetWidth / 2}px`,
                    });
                }
            })
            .catch(() => {
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
