/**
 * 模态路由相关类型定义
 *
 * @module types/modals
 */

import type { KylinRouteItem } from "./routes";

// ============================================================================
// 模态路由相关类型定义
// ============================================================================

/**
 * 模态路由配置接口
 * 当路由的 modal 属性为对象时使用此配置
 */
export interface ModalConfig {
    /**
     * 模态显示类型（默认 'dialog'）
     * - dialog: 对话框式模态，支持9种位置
     * - drawer: 抽屉式模态，支持4种边缘位置
     */
    type?: "dialog" | "drawer";

    /**
     * 模态显示位置
     * - dialog 支持: center, top, top-left, top-right, right, bottom-right, bottom, bottom-left, left
     * - drawer 支持: left, right, top, bottom
     * @default center
     */
    position?:
        | "center"
        | "top"
        | "top-left"
        | "top-right"
        | "right"
        | "bottom-right"
        | "bottom"
        | "bottom-left"
        | "left";

    /**
     * 在 position 基础上的额外偏移量（像素）
     * @example [20, 10] 表示向右偏移20px，向下偏移10px
     */
    offset?: [number, number];

    /**
     * 自动关闭倒计时（毫秒）
     * 设置后模态将在指定时间后自动关闭
     * @example 3000 表示3秒后自动关闭
     */
    autoClose?: number;

    /**
     * 是否显示背景遮罩（默认 true）
     * 设置为 false 时不显示背景遮罩
     */
    backdrop?: boolean;

    /**
     * 点击遮罩是否关闭（默认 true）
     */
    closeOnBackdropClick?: boolean;

    /**
     * 按 ESC 键是否关闭（默认 true）
     */
    closeOnEsc?: boolean;

    /**
     * 是否支持多层模态（默认 true）
     */
    stackable?: boolean;
}

/**
 * 模态栈项接口
 */
export interface ModalStackItem {
    /**
     * 模态路由对象
     */
    route: KylinRouteItem;

    /**
     * 模态元素
     */
    element: HTMLElement;

    /**
     * 背景遮罩元素（可选）
     */
    backdrop?: HTMLElement;

    /**
     * 创建时间戳
     */
    timestamp: number;
}

/**
 * 模态状态类型
 */
export interface ModalState {
    /**
     * 模态栈
     */
    stack: ModalStackItem[];

    /**
     * 当前模态
     */
    current: ModalStackItem | null;
}

/**
 * 打开模态的选项接口
 */
export interface ModalOptions {
    /**
     * 路由路径或配置
     */
    route?: string | KylinRouteItem;

    /**
     * 路由参数
     */
    params?: Record<string, string>;

    /**
     * 查询参数
     */
    query?: Record<string, string>;

    /**
     * 是否显示背景遮罩
     */
    backdrop?: boolean;
}
