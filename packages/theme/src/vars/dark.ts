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
export const darkColorVars = {
    /* 灰色方向（暗：color-i=gray-i，color-0 最沉；背景与前景分离映射——
     * bgcolor-0（面板）取 gray-8 浮起于 bgcolor-1（工作区，最沉的 gray-9），
     * bgcolor-2..9 递亮供透明度叠加原料与扩展档使用，保证整条背景梯度单调） */
    "--x-plain-color-0": "var(--x-color-gray-0) !important",
    "--x-plain-color-1": "var(--x-color-gray-1) !important",
    "--x-plain-color-2": "var(--x-color-gray-2) !important",
    "--x-plain-color-3": "var(--x-color-gray-3) !important",
    "--x-plain-color-4": "var(--x-color-gray-4) !important",
    "--x-plain-color-5": "var(--x-color-gray-5) !important",
    "--x-plain-color-6": "var(--x-color-gray-6) !important",
    "--x-plain-color-7": "var(--x-color-gray-7) !important",
    "--x-plain-color-8": "var(--x-color-gray-8) !important",
    "--x-plain-color-9": "var(--x-color-gray-9) !important",

    "--x-plain-bgcolor-0": "var(--x-color-gray-8) !important",
    "--x-plain-bgcolor-1": "var(--x-color-gray-9) !important",
    "--x-plain-bgcolor-2": "var(--x-color-gray-7) !important",
    "--x-plain-bgcolor-3": "var(--x-color-gray-6) !important",
    "--x-plain-bgcolor-4": "var(--x-color-gray-5) !important",
    "--x-plain-bgcolor-5": "var(--x-color-gray-4) !important",
    "--x-plain-bgcolor-6": "var(--x-color-gray-3) !important",
    "--x-plain-bgcolor-7": "var(--x-color-gray-2) !important",
    "--x-plain-bgcolor-8": "var(--x-color-gray-1) !important",
    "--x-plain-bgcolor-9": "var(--x-color-gray-0) !important",

    /*
     * 多彩映射（暗：厚重的多彩暗底）。
     * ⚠ 关键前提：[dark] 下主题梯度已反转（theme-0=最深、theme-9=最浅），因此：
     * - 前景 color-i = theme-{9-i}，反转后 color-0 为最浅文字（深底浅字，
     *   与灰色方向前景一致）
     * - 背景结构与灰色方向同构（面板浮起）：
     *   bgcolor-0=theme-0（面板，各主题最深档——theme-1 作面板时 blue 下正文仅
     *   3.7:1 不达 AA，见 scripts/check-dark-contrast.ts）/ bgcolor-1=theme-0 混黑
     *   30%（工作区：彩色梯度无更深档可用，从最深档压暗保色相——多彩语义要求全域
     *   色调浸染，灰阶幕布会丢失多彩氛围且与 light colorized（工作区=theme-1）
     *   不对称）/ bgcolor-2..9=theme-2..9（透明度叠加原料起两档，与档位索引对齐）
     */
    "--x-tinted-color-0": "var(--x-color-theme-9) !important",
    "--x-tinted-color-1": "var(--x-color-theme-8) !important",
    "--x-tinted-color-2": "var(--x-color-theme-7) !important",
    "--x-tinted-color-3": "var(--x-color-theme-6) !important",
    "--x-tinted-color-4": "var(--x-color-theme-5) !important",
    "--x-tinted-color-5": "var(--x-color-theme-4) !important",
    "--x-tinted-color-6": "var(--x-color-theme-3) !important",
    "--x-tinted-color-7": "var(--x-color-theme-2) !important",
    "--x-tinted-color-8": "var(--x-color-theme-1) !important",
    "--x-tinted-color-9": "var(--x-color-theme-0) !important",
    "--x-tinted-bgcolor-0": "var(--x-color-theme-0) !important",
    "--x-tinted-bgcolor-1": "color-mix(in srgb, var(--x-color-theme-0), black 30%) !important",
    "--x-tinted-bgcolor-2": "var(--x-color-theme-2) !important",
    "--x-tinted-bgcolor-3": "var(--x-color-theme-3) !important",
    "--x-tinted-bgcolor-4": "var(--x-color-theme-4) !important",
    "--x-tinted-bgcolor-5": "var(--x-color-theme-5) !important",
    "--x-tinted-bgcolor-6": "var(--x-color-theme-6) !important",
    "--x-tinted-bgcolor-7": "var(--x-color-theme-7) !important",
    "--x-tinted-bgcolor-8": "var(--x-color-theme-8) !important",
    "--x-tinted-bgcolor-9": "var(--x-color-theme-9) !important",

    /* 实际值：默认态（无属性）即灰色方向 */
    "--x-color-0": "var(--x-plain-color-0) !important",
    "--x-color-1": "var(--x-plain-color-1) !important",
    "--x-color-2": "var(--x-plain-color-2) !important",
    "--x-color-3": "var(--x-plain-color-3) !important",
    "--x-color-4": "var(--x-plain-color-4) !important",
    "--x-color-5": "var(--x-plain-color-5) !important",
    "--x-color-6": "var(--x-plain-color-6) !important",
    "--x-color-7": "var(--x-plain-color-7) !important",
    "--x-color-8": "var(--x-plain-color-8) !important",
    "--x-color-9": "var(--x-plain-color-9) !important",

    "--x-bgcolor-0": "var(--x-plain-bgcolor-0) !important",
    "--x-bgcolor-1": "var(--x-plain-bgcolor-1) !important",
    "--x-bgcolor-2": "var(--x-plain-bgcolor-2) !important",
    "--x-bgcolor-3": "var(--x-plain-bgcolor-3) !important",
    "--x-bgcolor-4": "var(--x-plain-bgcolor-4) !important",
    "--x-bgcolor-5": "var(--x-plain-bgcolor-5) !important",
    "--x-bgcolor-6": "var(--x-plain-bgcolor-6) !important",
    "--x-bgcolor-7": "var(--x-plain-bgcolor-7) !important",
    "--x-bgcolor-8": "var(--x-plain-bgcolor-8) !important",
    "--x-bgcolor-9": "var(--x-plain-bgcolor-9) !important",
};
/**
 * 暗色+多彩叠加块：实际值改引用多彩映射别名（映射由本模式块声明，
 * 亮语境同块内容自动取亮映射）。!important 用于在同元素上压过暗灰实际值。
 */
export const darkColorizedColorVars = {
    "--x-color-0": "var(--x-tinted-color-0) !important",
    "--x-color-1": "var(--x-tinted-color-1) !important",
    "--x-color-2": "var(--x-tinted-color-2) !important",
    "--x-color-3": "var(--x-tinted-color-3) !important",
    "--x-color-4": "var(--x-tinted-color-4) !important",
    "--x-color-5": "var(--x-tinted-color-5) !important",
    "--x-color-6": "var(--x-tinted-color-6) !important",
    "--x-color-7": "var(--x-tinted-color-7) !important",
    "--x-color-8": "var(--x-tinted-color-8) !important",
    "--x-color-9": "var(--x-tinted-color-9) !important",
    "--x-bgcolor-0": "var(--x-tinted-bgcolor-0) !important",
    "--x-bgcolor-1": "var(--x-tinted-bgcolor-1) !important",
    "--x-bgcolor-2": "var(--x-tinted-bgcolor-2) !important",
    "--x-bgcolor-3": "var(--x-tinted-bgcolor-3) !important",
    "--x-bgcolor-4": "var(--x-tinted-bgcolor-4) !important",
    "--x-bgcolor-5": "var(--x-tinted-bgcolor-5) !important",
    "--x-bgcolor-6": "var(--x-tinted-bgcolor-6) !important",
    "--x-bgcolor-7": "var(--x-tinted-bgcolor-7) !important",
    "--x-bgcolor-8": "var(--x-tinted-bgcolor-8) !important",
    "--x-bgcolor-9": "var(--x-tinted-bgcolor-9) !important",
};
