import type { ThemeOptions } from "../types";
import { generateThemeGradientColors } from "./generateThemeGradientColors";

export type ThemeVariantOptions = {
    prefix: string;
    reverse?: boolean;
    /** 种子明度间隔：梯度相邻档间最小明度递减间隔（默认 1.7，语义见 PaletteOptions.seedLightnessGap） */
    seedLightnessGap?: number;
    /** 彩度放大上限（默认 1.25，语义见 PaletteOptions.chromaBoostCap） */
    chromaBoostCap?: number;
};
export function generateThemeColorVars(color: string, options?: ThemeVariantOptions) {
    const { prefix, reverse = false, seedLightnessGap, chromaBoostCap } = Object.assign(
        {},
        options
    ) as ThemeVariantOptions;

    const colors = generateThemeGradientColors(color, { seedLightnessGap, chromaBoostCap });
    //    if (isDark(color)) colors.reverse()
    if (reverse) colors.reverse();
    const vars: Record<string, string> = {};
    colors.reduce((all, cur, i) => {
        vars[`${prefix}${i}`] = cur;
        return all;
    }, {}) as Required<ThemeOptions>;
    return vars;
}
