/**
 * 主色板（Material Design 风格 10 阶梯度）生成实现。
 *
 * 从 @yosulramp/material-color-palette-js@1.0.4（MIT License，
 * https://github.com/yosulramp/material-color-palette-js ，系 Hammwerk/material-color-palette
 * 的 TypeScript 移植）中提取 createPrimaryPalette / createComplementaryPalette 及其全部
 * 依赖闭包，默认参数下算法与数值与原包完全一致（seedLightnessGap / chromaBoostCap
 * 系原包两处硬编码值的参数化，见 PaletteOptions）。
 *
 * 与原包的差异（不影响输出结果）：
 * - 原包通过 `Number.prototype` 扩展（correctGamma/coerceIn 等）实现数值工具，此处改为
 *   模块内纯函数，避免污染全局原型；
 * - 未使用的 createAnalogousPalette / createTriadicPalette 及 HslColor 调和方法中
 *   未被本包用到的成员未随迁。
 */
/** HSL 颜色（原包 color-spaces/HslColor.ts） */
declare class HslColor {
    private hue;
    private saturation;
    private lightness;
    private alpha;
    constructor(hue: number, saturation: number, lightness: number, alpha?: number);
    /** 互补色：色相旋转 180° */
    get complementaryColor(): HslColor;
    toRgbColor(): RgbColor;
    private harmonize;
}
/** RGB 颜色（各分量取值 0~1；原包 color-spaces/RgbColor.ts） */
declare class RgbColor {
    private red;
    private green;
    private blue;
    private alpha;
    constructor(red: number, green: number, blue: number, alpha?: number);
    /** 形如 `FFEBEE` 的 6 位大写十六进制（不含 # 前缀） */
    get rgbHex(): string;
    toHslColor(): HslColor;
    toXyzColor(): XyzColor;
}
/** CIE XYZ 颜色（原包 color-spaces/XyzColor.ts） */
declare class XyzColor {
    private x;
    private y;
    private z;
    private alpha;
    constructor(x: number, y: number, z: number, alpha?: number);
    toLabColor(): LabColor;
    toRgbColor(): RgbColor;
    private f;
}
/**
 * CIE Lab 颜色（原包 color-spaces/LabColor.ts）。
 * 字段对外只读公开：原包在 LchColor.deltaE 中经 Object.assign 解构私有字段（esbuild
 * 不做类型检查故可编译），此处改为显式只读字段以通过 tsc 严格检查，运行时行为一致。
 */
declare class LabColor {
    readonly lightness: number;
    readonly a: number;
    readonly b: number;
    readonly alpha: number;
    constructor(lightness: number, a: number, b: number, alpha?: number);
    toLchColor(): LchColor;
    toXyzColor(): XyzColor;
    private fInv;
}
/** CIE LCh(ab) 颜色（原包 color-spaces/LchColor.ts） */
declare class LchColor {
    private lightness;
    private chroma;
    private hue;
    private alpha;
    constructor(lightness: number, chroma: number, hue: number, alpha?: number);
    getLightness(): number;
    getChroma(): number;
    /** CIEDE2000 色差 */
    deltaE(other: LchColor): number;
    toLabColor(): LabColor;
    minus(other: LchColor): LchColor;
    adjustLightness(block: (lightness: number) => number): LchColor;
    adjustChroma(block: (chroma: number) => number): LchColor;
    adjustHue(block: (hue: number) => number): LchColor;
    private hueDelta;
    private meanHue;
}
/** 调色板形态参数；缺省值与原包（material-color-palette-js）硬编码值一致 */
export type PaletteOptions = {
    /** 种子明度间隔：梯度相邻档间的最小明度递减间隔（maxLightness 阶梯约束，实测可波及种子两侧的临界档），默认 1.7（建议 ≥0，负值破坏梯度单调性） */
    seedLightnessGap?: number;
    /** 彩度放大上限：非种子档彩度缩放倍率的上限，默认 1.25（<1 可压低饱和度） */
    chromaBoostCap?: number;
};
/**
 * 由十六进制主色（不含 # 前缀，6/8 位）生成 Material 风格 10 阶主色板；
 * 长度非法时返回 null。
 */
export declare const createPrimaryPalette: (hexColor: string, options?: PaletteOptions) => RgbColor[] | null;
/**
 * 由十六进制主色（不含 # 前缀，6/8 位）生成其互补色（色相 +180°）的
 * Material 风格 10 阶色板；长度非法时返回 null。
 */
export declare const createComplementaryPalette: (hexColor: string, options?: PaletteOptions) => RgbColor[] | null;
export type { RgbColor };
