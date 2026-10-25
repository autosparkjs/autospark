/**
 * 暗模式色彩域（别名架构，与 vars/light.ts 对称；全量 !important：
 * 暗块须在同元素上压过亮块的同名普通声明——这是「亮→暗同元素切换」的
 * 级联前提，勿移除）。
 *
 * - `--x-plain-*`：暗模式「灰色方向」别名（data-uncolored 语境引用）。
 * - `--x-tinted-*`：暗模式「多彩映射」别名（data-colorized 语境引用；
 *   仅 bgcolor-1 与亮映射不同，见下方注释）。
 * - `--x-color-*` / `--x-bgcolor-*`：实际值，引用灰色别名（默认态即暗灰）。
 */
export declare const darkColorVars: {
    "--x-plain-color-0": string;
    "--x-plain-color-1": string;
    "--x-plain-color-2": string;
    "--x-plain-color-3": string;
    "--x-plain-color-4": string;
    "--x-plain-color-5": string;
    "--x-plain-color-6": string;
    "--x-plain-color-7": string;
    "--x-plain-color-8": string;
    "--x-plain-color-9": string;
    "--x-plain-bgcolor-0": string;
    "--x-plain-bgcolor-1": string;
    "--x-plain-bgcolor-2": string;
    "--x-plain-bgcolor-3": string;
    "--x-plain-bgcolor-4": string;
    "--x-plain-bgcolor-5": string;
    "--x-plain-bgcolor-6": string;
    "--x-plain-bgcolor-7": string;
    "--x-plain-bgcolor-8": string;
    "--x-plain-bgcolor-9": string;
    "--x-tinted-color-0": string;
    "--x-tinted-color-1": string;
    "--x-tinted-color-2": string;
    "--x-tinted-color-3": string;
    "--x-tinted-color-4": string;
    "--x-tinted-color-5": string;
    "--x-tinted-color-6": string;
    "--x-tinted-color-7": string;
    "--x-tinted-color-8": string;
    "--x-tinted-color-9": string;
    "--x-tinted-bgcolor-0": string;
    "--x-tinted-bgcolor-1": string;
    "--x-tinted-bgcolor-2": string;
    "--x-tinted-bgcolor-3": string;
    "--x-tinted-bgcolor-4": string;
    "--x-tinted-bgcolor-5": string;
    "--x-tinted-bgcolor-6": string;
    "--x-tinted-bgcolor-7": string;
    "--x-tinted-bgcolor-8": string;
    "--x-tinted-bgcolor-9": string;
    "--x-color-0": string;
    "--x-color-1": string;
    "--x-color-2": string;
    "--x-color-3": string;
    "--x-color-4": string;
    "--x-color-5": string;
    "--x-color-6": string;
    "--x-color-7": string;
    "--x-color-8": string;
    "--x-color-9": string;
    "--x-bgcolor-0": string;
    "--x-bgcolor-1": string;
    "--x-bgcolor-2": string;
    "--x-bgcolor-3": string;
    "--x-bgcolor-4": string;
    "--x-bgcolor-5": string;
    "--x-bgcolor-6": string;
    "--x-bgcolor-7": string;
    "--x-bgcolor-8": string;
    "--x-bgcolor-9": string;
};
/**
 * 暗色+多彩叠加块：实际值改引用多彩映射别名（映射由本模式块声明，
 * 亮语境同块内容自动取亮映射）。!important 用于在同元素上压过暗灰实际值。
 */
export declare const darkColorizedColorVars: {
    "--x-color-0": string;
    "--x-color-1": string;
    "--x-color-2": string;
    "--x-color-3": string;
    "--x-color-4": string;
    "--x-color-5": string;
    "--x-color-6": string;
    "--x-color-7": string;
    "--x-color-8": string;
    "--x-color-9": string;
    "--x-bgcolor-0": string;
    "--x-bgcolor-1": string;
    "--x-bgcolor-2": string;
    "--x-bgcolor-3": string;
    "--x-bgcolor-4": string;
    "--x-bgcolor-5": string;
    "--x-bgcolor-6": string;
    "--x-bgcolor-7": string;
    "--x-bgcolor-8": string;
    "--x-bgcolor-9": string;
};
