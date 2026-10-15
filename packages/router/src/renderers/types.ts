export type ViewRenderOptions = {
    /**
     * 自定义内容提取选择器
     * 如果提供，将从加载的 HTML 中提取匹配该选择器的内容
     */
    selector?: string;
    hash: string;
    signal: AbortSignal; // 中止信号
    /**
     * 最终视图 URL（插值 + base 前缀 + 剥除 `!` raw 前缀后，ADR-0008 及其修订）
     * 供图片渲染器 `<img src>` 等使用
     */
    url?: string;
};
