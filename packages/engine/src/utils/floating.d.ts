/** 浮动定位选项（字段名与 floating-ui 词汇对齐；overlay 的 OverlayAnchorConfig 结构兼容） */
export interface FloatingPositionOptions {
    /** 'auto'（autoPlacement，overlay 默认）或 floating-ui 12 方向值（固定 + flip） */
    placement?: string;
    /** 透传 offset 中间件（间距） */
    offset?: any;
    /** 视口内滑移：默认启用（keep in view 防溢出）；`false` 关闭；对象透传（padding 等参数） */
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
    /**
     * 面板尺寸跟随基准元素（x-popover `fit` 消费）：定位完成后按最终 placement 主向设置
     * 面板尺寸——左右方向（left/right 系）→ `height` = 基准 `offsetHeight`；上下方向
     * （top/bottom 系）→ `width` = 基准 `offsetWidth`。跟随 flip 翻转后的最终 placement；
     * autoUpdate 重算时持续生效。缺省 undefined（不 fit）。
     */
    fitToEl?: HTMLElement;
}
/**
 * 箭头默认让位间距（px）：菱形（8px 载体旋转 45°）露出面板外的尖角高 ≈ 对角线一半 ≈ 5.66px，
 * 取整 6px——面板与锚点留出此间隙后三角尖恰好点在锚元素边缘（floating-ui 官方 tooltip 惯例）。
 */
export declare const FLOATING_ARROW_DEFAULT_OFFSET = 6;
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
export declare function applyFloatingPosition(anchorEl: HTMLElement, panel: HTMLElement, opts: FloatingPositionOptions, registerCleanup: (fn: () => void) => void, contract: FloatingContract): boolean;
