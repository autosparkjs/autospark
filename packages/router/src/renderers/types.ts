export type ViewRenderOptions = {
    /**
     * 自定义内容提取选择器
     * 如果提供，将从加载的 HTML 中提取匹配该选择器的内容
     */
    selector?: string;
    /**
     * 启用样式隔离（默认 true）
     * - true: 启用 scoped CSS，为样式添加 data-v-xxx 属性前缀
     * - false: 禁用样式隔离，样式全局生效
     */
    scopedStyle?: boolean;
    hash: string;
    signal: AbortSignal; // 中止信号
};
