export const darkColorVars = {
    "--k-color-0": "var(--k-color-gray-0) !important",
    "--k-color-1": "var(--k-color-gray-1) !important",
    "--k-color-2": "var(--k-color-gray-2) !important",
    "--k-color-3": "var(--k-color-gray-3) !important",
    "--k-color-4": "var(--k-color-gray-4) !important",
    "--k-color-5": "var(--k-color-gray-5) !important",
    "--k-color-6": "var(--k-color-gray-6) !important",
    "--k-color-7": "var(--k-color-gray-7) !important",
    "--k-color-8": "var(--k-color-gray-8) !important",
    "--k-color-9": "var(--k-color-gray-9) !important",
    /*
     * 背景（bgcolor）与前景（color）分离映射：暗色下采用「面板浮起」流派——
     * bgcolor-0（面板）取 gray-8 浮起于 bgcolor-1（工作区，最沉的 gray-9），
     * bgcolor-2..9 递亮供透明度叠加原料与扩展档使用，保证整条背景梯度单调。
     */
    "--k-bgcolor-0": "var(--k-color-gray-8) !important",
    "--k-bgcolor-1": "var(--k-color-gray-9) !important",
    "--k-bgcolor-2": "var(--k-color-gray-7) !important",
    "--k-bgcolor-3": "var(--k-color-gray-6) !important",
    "--k-bgcolor-4": "var(--k-color-gray-5) !important",
    "--k-bgcolor-5": "var(--k-color-gray-4) !important",
    "--k-bgcolor-6": "var(--k-color-gray-3) !important",
    "--k-bgcolor-7": "var(--k-color-gray-2) !important",
    "--k-bgcolor-8": "var(--k-color-gray-1) !important",
    "--k-bgcolor-9": "var(--k-color-gray-0) !important",
};
export const darkColorizedColorVars = {
    /*
     * 暗色+多彩：厚重的多彩暗底。
     * ⚠ 关键前提：[dark] 下主题梯度已反转（theme-0=最深、theme-9=最浅），因此：
     * - 前景 color-i = theme-{9-i}，反转后 color-0 为最浅文字（深底浅字，与 darkColorVars 前景方向一致）
     * - 背景结构与 darkColorVars 同构（面板浮起）：
     *   bgcolor-0=theme-1（面板，深而厚重）/ bgcolor-1=theme-0（工作区，最沉）
     *   / bgcolor-2=theme-3（透明度叠加原料，比面板亮两档），3..9 递进保持单调
     */
    "--k-color-0": "var(--k-color-theme-9) !important",
    "--k-color-1": "var(--k-color-theme-8) !important",
    "--k-color-2": "var(--k-color-theme-7) !important",
    "--k-color-3": "var(--k-color-theme-6) !important",
    "--k-color-4": "var(--k-color-theme-5) !important",
    "--k-color-5": "var(--k-color-theme-4) !important",
    "--k-color-6": "var(--k-color-theme-3) !important",
    "--k-color-7": "var(--k-color-theme-2) !important",
    "--k-color-8": "var(--k-color-theme-1) !important",
    "--k-color-9": "var(--k-color-theme-0) !important",
    "--k-bgcolor-0": "var(--k-color-theme-1) !important",
    "--k-bgcolor-1": "var(--k-color-theme-0) !important",
    "--k-bgcolor-2": "var(--k-color-theme-3) !important",
    "--k-bgcolor-3": "var(--k-color-theme-4) !important",
    "--k-bgcolor-4": "var(--k-color-theme-5) !important",
    "--k-bgcolor-5": "var(--k-color-theme-6) !important",
    "--k-bgcolor-6": "var(--k-color-theme-7) !important",
    "--k-bgcolor-7": "var(--k-color-theme-8) !important",
    "--k-bgcolor-8": "var(--k-color-theme-9) !important",
    "--k-bgcolor-9": "var(--k-color-theme-9) !important",
};
