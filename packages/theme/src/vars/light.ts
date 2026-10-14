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
export const lightColorVars = {
    /* 灰色方向（亮：color-0 最深文字 gray-9，递亮至 color-9=gray-0） */
    "--x-plain-color-0": "var(--x-color-gray-9)",
    "--x-plain-color-1": "var(--x-color-gray-8)",
    "--x-plain-color-2": "var(--x-color-gray-7)",
    "--x-plain-color-3": "var(--x-color-gray-6)",
    "--x-plain-color-4": "var(--x-color-gray-5)",
    "--x-plain-color-5": "var(--x-color-gray-4)",
    "--x-plain-color-6": "var(--x-color-gray-3)",
    "--x-plain-color-7": "var(--x-color-gray-2)",
    "--x-plain-color-8": "var(--x-color-gray-1)",
    "--x-plain-color-9": "var(--x-color-gray-0)",

    "--x-plain-bgcolor-0": "var(--x-color-gray-0)",
    "--x-plain-bgcolor-1": "var(--x-color-gray-1)",
    "--x-plain-bgcolor-2": "var(--x-color-gray-2)",
    "--x-plain-bgcolor-3": "var(--x-color-gray-3)",
    "--x-plain-bgcolor-4": "var(--x-color-gray-4)",
    "--x-plain-bgcolor-5": "var(--x-color-gray-5)",
    "--x-plain-bgcolor-6": "var(--x-color-gray-6)",
    "--x-plain-bgcolor-7": "var(--x-color-gray-7)",
    "--x-plain-bgcolor-8": "var(--x-color-gray-8)",
    "--x-plain-bgcolor-9": "var(--x-color-gray-9)",

    /* 多彩映射（亮：color-i=theme-{9-i} 深底浅字，bgcolor-i=theme-i） */
    "--x-tinted-color-0": "var(--x-color-theme-9)",
    "--x-tinted-color-1": "var(--x-color-theme-8)",
    "--x-tinted-color-2": "var(--x-color-theme-7)",
    "--x-tinted-color-3": "var(--x-color-theme-6)",
    "--x-tinted-color-4": "var(--x-color-theme-5)",
    "--x-tinted-color-5": "var(--x-color-theme-4)",
    "--x-tinted-color-6": "var(--x-color-theme-3)",
    "--x-tinted-color-7": "var(--x-color-theme-2)",
    "--x-tinted-color-8": "var(--x-color-theme-1)",
    "--x-tinted-color-9": "var(--x-color-theme-0)",

    "--x-tinted-bgcolor-0": "var(--x-color-theme-0)",
    "--x-tinted-bgcolor-1": "var(--x-color-theme-1)",
    "--x-tinted-bgcolor-2": "var(--x-color-theme-2)",
    "--x-tinted-bgcolor-3": "var(--x-color-theme-3)",
    "--x-tinted-bgcolor-4": "var(--x-color-theme-4)",
    "--x-tinted-bgcolor-5": "var(--x-color-theme-5)",
    "--x-tinted-bgcolor-6": "var(--x-color-theme-6)",
    "--x-tinted-bgcolor-7": "var(--x-color-theme-7)",
    "--x-tinted-bgcolor-8": "var(--x-color-theme-8)",
    "--x-tinted-bgcolor-9": "var(--x-color-theme-9)",

    /* 实际值：默认态（无属性）即灰色方向 */
    "--x-color-0": "var(--x-plain-color-0)",
    "--x-color-1": "var(--x-plain-color-1)",
    "--x-color-2": "var(--x-plain-color-2)",
    "--x-color-3": "var(--x-plain-color-3)",
    "--x-color-4": "var(--x-plain-color-4)",
    "--x-color-5": "var(--x-plain-color-5)",
    "--x-color-6": "var(--x-plain-color-6)",
    "--x-color-7": "var(--x-plain-color-7)",
    "--x-color-8": "var(--x-plain-color-8)",
    "--x-color-9": "var(--x-plain-color-9)",

    "--x-bgcolor-0": "var(--x-plain-bgcolor-0)",
    "--x-bgcolor-1": "var(--x-plain-bgcolor-1)",
    "--x-bgcolor-2": "var(--x-plain-bgcolor-2)",
    "--x-bgcolor-3": "var(--x-plain-bgcolor-3)",
    "--x-bgcolor-4": "var(--x-plain-bgcolor-4)",
    "--x-bgcolor-5": "var(--x-plain-bgcolor-5)",
    "--x-bgcolor-6": "var(--x-plain-bgcolor-6)",
    "--x-bgcolor-7": "var(--x-plain-bgcolor-7)",
    "--x-bgcolor-8": "var(--x-plain-bgcolor-8)",
    "--x-bgcolor-9": "var(--x-plain-bgcolor-9)",
};
/**
 * 多彩覆盖块：实际值改引用多彩映射别名——映射本身由语境模式块声明，
 * 故亮/暗语境下同一块内容自动取各自的多彩映射（暗语境修复此前的映射缺失）。
 */
export const lightColorizedColorVars = {
    "--x-color-0": "var(--x-tinted-color-0)",
    "--x-color-1": "var(--x-tinted-color-1)",
    "--x-color-2": "var(--x-tinted-color-2)",
    "--x-color-3": "var(--x-tinted-color-3)",
    "--x-color-4": "var(--x-tinted-color-4)",
    "--x-color-5": "var(--x-tinted-color-5)",
    "--x-color-6": "var(--x-tinted-color-6)",
    "--x-color-7": "var(--x-tinted-color-7)",
    "--x-color-8": "var(--x-tinted-color-8)",
    "--x-color-9": "var(--x-tinted-color-9)",

    "--x-bgcolor-0": "var(--x-tinted-bgcolor-0)",
    "--x-bgcolor-1": "var(--x-tinted-bgcolor-1)",
    "--x-bgcolor-2": "var(--x-tinted-bgcolor-2)",
    "--x-bgcolor-3": "var(--x-tinted-bgcolor-3)",
    "--x-bgcolor-4": "var(--x-tinted-bgcolor-4)",
    "--x-bgcolor-5": "var(--x-tinted-bgcolor-5)",
    "--x-bgcolor-6": "var(--x-tinted-bgcolor-6)",
    "--x-bgcolor-7": "var(--x-tinted-bgcolor-7)",
    "--x-bgcolor-8": "var(--x-tinted-bgcolor-8)",
    "--x-bgcolor-9": "var(--x-tinted-bgcolor-9)",
};
/**
 * 无彩覆盖块（data-uncolored）：仅重置色彩两键为灰色方向引用，模式随语境——
 * `--x-plain-*` 由语境模式块（亮/暗各一份）声明并继承，普通权重直接声明即压过
 * 继承的彩色值（直接声明恒胜继承，与 !important 无关）；同元素带 data-dark 时
 * darkColorVars 的 !important 灰值胜出——语义一致（暗灰）。
 */
export const uncoloredColorVars = {
    "--x-color-0": "var(--x-plain-color-0)",
    "--x-color-1": "var(--x-plain-color-1)",
    "--x-color-2": "var(--x-plain-color-2)",
    "--x-color-3": "var(--x-plain-color-3)",
    "--x-color-4": "var(--x-plain-color-4)",
    "--x-color-5": "var(--x-plain-color-5)",
    "--x-color-6": "var(--x-plain-color-6)",
    "--x-color-7": "var(--x-plain-color-7)",
    "--x-color-8": "var(--x-plain-color-8)",
    "--x-color-9": "var(--x-plain-color-9)",

    "--x-bgcolor-0": "var(--x-plain-bgcolor-0)",
    "--x-bgcolor-1": "var(--x-plain-bgcolor-1)",
    "--x-bgcolor-2": "var(--x-plain-bgcolor-2)",
    "--x-bgcolor-3": "var(--x-plain-bgcolor-3)",
    "--x-bgcolor-4": "var(--x-plain-bgcolor-4)",
    "--x-bgcolor-5": "var(--x-plain-bgcolor-5)",
    "--x-bgcolor-6": "var(--x-plain-bgcolor-6)",
    "--x-bgcolor-7": "var(--x-plain-bgcolor-7)",
    "--x-bgcolor-8": "var(--x-plain-bgcolor-8)",
    "--x-bgcolor-9": "var(--x-plain-bgcolor-9)",
};
