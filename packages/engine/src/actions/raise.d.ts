/** raise 第二参：事件层呈现配置（优先级高于 x-error-options 静态层，ADR-0118 决策 7） */
export interface RaiseOptions {
    /** 注入错误组件 data 的自由 props（与静态层 props 合并） */
    props?: Record<string, any>;
    /** 是否提供关闭按钮（覆盖静态层） */
    closeable?: boolean;
    /** 是否提供重试按钮（覆盖静态层；raise 源恒不渲染——无源可重） */
    retryable?: boolean;
    /** 额外动作按钮（覆盖静态层；data-action 点击委托，ADR-0038 同款） */
    actions?: Array<string | Record<string, any>>;
}
export declare const raiseAction: {
    title: string;
    handle: (this: any, error?: any, options?: RaiseOptions) => import("../utils/normalizeError").NormalizedError | undefined;
};
