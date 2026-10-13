export type ViewRenderOptions = {
    /**
     * 自定义内容提取选择器
     * 如果提供，将从加载的 HTML 中提取匹配该选择器的内容
     */
    selector?: string;
    hash: string;
    signal: AbortSignal; // 中止信号
};
