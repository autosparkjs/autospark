export const darkColorVars = {
    "--x-color-0": "var(--x-color-gray-0) !important",
    "--x-color-1": "var(--x-color-gray-1) !important",
    "--x-color-2": "var(--x-color-gray-2) !important",
    "--x-color-3": "var(--x-color-gray-3) !important",
    "--x-color-4": "var(--x-color-gray-4) !important",
    "--x-color-5": "var(--x-color-gray-5) !important",
    "--x-color-6": "var(--x-color-gray-6) !important",
    "--x-color-7": "var(--x-color-gray-7) !important",
    "--x-color-8": "var(--x-color-gray-8) !important",
    "--x-color-9": "var(--x-color-gray-9) !important",
    /*
     * 背景（bgcolor）与前景（color）分离映射：暗色下采用「面板浮起」流派——
     * bgcolor-0（面板）取 gray-8 浮起于 bgcolor-1（工作区，最沉的 gray-9），
     * bgcolor-2..9 递亮供透明度叠加原料与扩展档使用，保证整条背景梯度单调。
     */
    "--x-bgcolor-0": "var(--x-color-gray-8) !important",
    "--x-bgcolor-1": "var(--x-color-gray-9) !important",
    "--x-bgcolor-2": "var(--x-color-gray-7) !important",
    "--x-bgcolor-3": "var(--x-color-gray-6) !important",
    "--x-bgcolor-4": "var(--x-color-gray-5) !important",
    "--x-bgcolor-5": "var(--x-color-gray-4) !important",
    "--x-bgcolor-6": "var(--x-color-gray-3) !important",
    "--x-bgcolor-7": "var(--x-color-gray-2) !important",
    "--x-bgcolor-8": "var(--x-color-gray-1) !important",
    "--x-bgcolor-9": "var(--x-color-gray-0) !important",
};
export const darkColorizedColorVars = {
    /*
     * 暗色+多彩：厚重的多彩暗底。
     * ⚠ 关键前提：[dark] 下主题梯度已反转（theme-0=最深、theme-9=最浅），因此：
     * - 前景 color-i = theme-{9-i}，反转后 color-0 为最浅文字（深底浅字，与 darkColorVars 前景方向一致）
     * - 背景结构与 darkColorVars 同构（面板浮起）：
     *   bgcolor-0=theme-0（面板，各主题最深档——theme-1 作面板时 blue 下正文仅 3.7:1 不达 AA，
     *   见 scripts/check-dark-contrast.ts）/ bgcolor-1=theme-0 混黑 30%（工作区：彩色梯度无更深
     *   档可用，从最深档压暗保色相——多彩语义要求全域色调浸染，灰阶幕布会丢失多彩氛围且
     *   与 light colorized（工作区=theme-1）不对称）/ bgcolor-2..9=theme-2..9（透明度叠加
     *   原料起两档，与档位索引对齐）
     */
    "--x-color-0": "var(--x-color-theme-9) !important",
    "--x-color-1": "var(--x-color-theme-8) !important",
    "--x-color-2": "var(--x-color-theme-7) !important",
    "--x-color-3": "var(--x-color-theme-6) !important",
    "--x-color-4": "var(--x-color-theme-5) !important",
    "--x-color-5": "var(--x-color-theme-4) !important",
    "--x-color-6": "var(--x-color-theme-3) !important",
    "--x-color-7": "var(--x-color-theme-2) !important",
    "--x-color-8": "var(--x-color-theme-1) !important",
    "--x-color-9": "var(--x-color-theme-0) !important",
    "--x-bgcolor-0": "var(--x-color-theme-0) !important",
    "--x-bgcolor-1": "color-mix(in srgb, var(--x-color-theme-0), black 30%) !important",
    "--x-bgcolor-2": "var(--x-color-theme-2) !important",
    "--x-bgcolor-3": "var(--x-color-theme-3) !important",
    "--x-bgcolor-4": "var(--x-color-theme-4) !important",
    "--x-bgcolor-5": "var(--x-color-theme-5) !important",
    "--x-bgcolor-6": "var(--x-color-theme-6) !important",
    "--x-bgcolor-7": "var(--x-color-theme-7) !important",
    "--x-bgcolor-8": "var(--x-color-theme-8) !important",
    "--x-bgcolor-9": "var(--x-color-theme-9) !important",
};
