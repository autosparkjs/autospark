import type { ThemeOptions } from "../types";
export type GenerateStaticThemeOptions = Pick<ThemeOptions, "themeColor" | "dark" | "colorized" | "size" | "spacing" | "shadow" | "radius" | "seedLightnessGap" | "chromaBoostCap" | "primary" | "success" | "warning" | "danger" | "info">;
/**
 * 生成一份完整静态主题包 CSS（指纹块 + 基量 + 主题标尺亮/暗块 + 语义色
 * + 维度烘焙守卫块）。选择器固定 :host,:root——静态包只服务 root 作用域，
 * 局部作用域永远运行时注入。
 */
export declare function generateStaticThemeCss(options: GenerateStaticThemeOptions & {
    themeColor: string;
}): string;
