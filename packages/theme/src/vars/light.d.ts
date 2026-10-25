/**
 * 亮模式色彩域（灰色方向 + 多彩映射 + 实际值三层别名架构）：
 *
 * - `--x-plain-color-0..9` / `--x-plain-bgcolor-0..9`：亮模式「灰色方向」别名。
 *   `data-uncolored` 引用之——无彩元素的灰色方向随语境模式块（亮/暗各自声明本模式方向）。
 * - `--x-tinted-color-0..9` / `--x-tinted-bgcolor-0..9`：亮模式「多彩映射」别名。
 *   `data-colorized` 引用之——多彩映射随语境模式块（亮 bgcolor-i=theme-i，
 *   暗 bgcolor-1=theme-0 混黑 30%，见 vars/dark.ts）。
 * - `--x-color-*` / `--x-bgcolor-*`：实际值，引用灰色别名（无属性默认态即灰）。
 *
 * ⚠ 别名必须声明于模式块（亮/暗各一份），这是 data-uncolored / data-colorized
 * 「维度独立、方向随语境」语义的实现基础：自定义属性继承的是解析后的值，
 * data-* 元素只需直接声明「引用别名」即可压过继承值（直接声明恒胜继承，
 * 与 !important 无关）。
 */
export declare const lightColorVars: {
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
 * 多彩覆盖块：实际值改引用多彩映射别名——映射本身由语境模式块声明，
 * 故亮/暗语境下同一块内容自动取各自的多彩映射（暗语境修复此前的映射缺失）。
 */
export declare const lightColorizedColorVars: {
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
 * 无彩覆盖块（data-uncolored）：仅重置色彩两键为灰色方向引用，模式随语境——
 * `--x-plain-*` 由语境模式块（亮/暗各一份）声明并继承，普通权重直接声明即压过
 * 继承的彩色值（直接声明恒胜继承，与 !important 无关）；同元素带 data-dark 时
 * darkColorVars 的 !important 灰值胜出——语义一致（暗灰）。
 */
export declare const uncoloredColorVars: {
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
