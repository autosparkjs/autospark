/**
 * KylinSlot 组件的类型定义
 *
 * @module components/Slot/types
 */

/**
 * 路由信号结果类型
 * 用于异步加载路由数据和视图
 */
export type RouteSignalReuslt<T = any> = {
    /** 实际数据值 */
    value: T;
    /** 错误对象 */
    error?: Error;
    /** data hash，用于 Alpine 数据组件名 */
    hash: string;
};
