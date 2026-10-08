export type ThemeSize =  'none' | "x-small" | "small" | "medium" | "large" | "x-large";
export type ThemeVariantType = "primary" | "success" | "warning" | "danger" | "info";

export type ThemeOptions = {
    id: string;
    /**
     * 用于生成主题样式的CSS选择器
     *
     * 如果没有提供，则默认为`[data-theme-scope='${id}']`
     *
     */
    cssSelector?: string[];
    /**
     * 主题颜色
     */
    themeColor?: string;
    /**
     * 深色模式
     */
    dark?: boolean;
    /**
     * 多彩模式
     */
    colorized?: boolean;
    /**
     * 大小
     */
    size?: ThemeSize;
    /**
     * 间距
     * 包括内外间距，行高等，用于调节界面的整体稀疏度
     */
    spacing?: ThemeSize;
    /**
     * 面板按钮等的阴影大小
     */
    shadow?: ThemeSize;
    /**
     * 圆角大小
     */
    radius?: ThemeSize;
    /**
     * 边框大小
     * @default 1px
     */
    border?: string;
    /**
     * 调色板形态参数：梯度相邻档间最小明度递减间隔
     *
     * 缺省时由生成器层使用默认值 1.7，语义见 PaletteOptions.seedLightnessGap
     */
    seedLightnessGap?: number;
    /**
     * 调色板形态参数：非种子档彩度缩放倍率上限
     *
     * 缺省时由生成器层使用默认值 1.25，语义见 PaletteOptions.chromaBoostCap
     */
    chromaBoostCap?: number;
    /**
     * 语义颜色
     */
    primary?: string;
    success?: string;
    warning?: string;
    danger?: string;
    info?: string;
    /**
     * 实例化时自动将样式注入文档中，即docRoot
     */
    autoConnect?: boolean;
    /**
     *
     *
     * 当=true时会自动查找所有具有data-theme-scope=`${this.id}`的元素
     *
     */
    autoAttach?: boolean;
    /**
     * 应用范围
     * 提供DOM选择器，将当前ThemeScope应用于到elements所在的元素
     */
    elements?: string[];
    /**
     * 文档根元素
     *
     * 默认是document.documentElement
     *
     * 当在WebComponent使用时，应设置为WebComponent的根元素,即shadowRoot
     *
     */
    docRoot?: HTMLElement;
    /**
     * 是否参与持久化（ADR-0003）
     *
     * 默认 true：参数写入 `{storageKey}-scope-{id}`，生成的 CSS 参与样式快照合成。
     * 设为 false 时照常注入渲染，仅不读写 localStorage。
     */
    persistence?: boolean;
    /**
     * 持久化 key 前缀（ADR-0003）
     *
     * 样式快照存 `{storageKey}-styles`，scope 参数存 `{storageKey}-scope-{id}`。
     * 默认 `autospark-theme`；同源多应用经自定义前缀隔离。由 ThemeManager 统一下发。
     */
    storageKey?: string;
};

export type DynamicThemeOptions = Pick<
    ThemeOptions,
    | "themeColor"
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "seedLightnessGap"
    | "chromaBoostCap"
>;
