export type ThemeVariantOptions = {
    prefix: string;
    reverse?: boolean;
    /** 种子明度间隔：梯度相邻档间最小明度递减间隔（默认 1.7，语义见 PaletteOptions.seedLightnessGap） */
    seedLightnessGap?: number;
    /** 彩度放大上限（默认 1.25，语义见 PaletteOptions.chromaBoostCap） */
    chromaBoostCap?: number;
};
export declare function generateThemeColorVars(color: string, options?: ThemeVariantOptions): Record<string, string>;
