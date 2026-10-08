export const derivedVars = {
    /* 语义色调 */
    "--auto-primary-color": "var(--x-color-primary)",
    "--auto-success-color": "var(--x-color-success)",
    "--auto-danger-color": "var(--x-color-danger)",
    "--auto-warning-color": "var(--x-color-warning)",
    "--auto-info-color": "var(--x-color-info)",
    "--auto-theme-color": "var(--x-color-theme-5)",

    /** 活动颜色 */
    "--auto-selected-color": "var(--x-color-theme-5)!important",
    "--auto-selected-bgcolor":
        "color-mix(in srgb, var(--auto-selected-color), transparent 80% )!important",

    "--auto-hover-color": "var(--auto-theme-color)!important",
    "--auto-hover-bgcolor":
        "color-mix(in srgb, var(--auto-hover-color), transparent 85%)!important",

    "--auto-active-color": "var(--x-color-theme-8)!important",
    "--auto-active-bgcolor":
        "color-mix(in srgb, var(--auto-active-color), transparent 85%)!important",

    "--auto-disable-color": "color-mix(in srgb, var(--x-color-8), gray 50%)!important",
    "--auto-disable-bgcolor": "color-mix(in srgb, currentColor, transparent 80%)!important",

    /* 字体颜色 */
    /* 字体颜色：三档引用 color 标尺的 1/3/4 档（light 下 59/109/149，档距均匀；
     * 次要文字白底对比约 5.3:1 达 WCAG AA。勿取相邻档（次要/辅助难分）或跨 4 档（梯度失衡） */
    "--auto-color": "var(--x-color-1)",
    "--auto-text-color": "var(--auto-color)",
    "--auto-secondary-color": "color-mix(in srgb, var(--x-color-1), transparent 25%)",
    "--auto-third-color": "color-mix(in srgb, var(--x-color-1), transparent 45%)",

    /* 背景颜色: 用于面板/对话框/组件的背景 */
    /* 背景语义按透明度阶梯区分：面板为实色容器，次级/内嵌为同一原料（bgcolor-2）的不同不透明度叠加
     * （45% / 75%），light 与 dark 下均落在可辨区间；!important 移除（模式覆盖作用于基变量，此处无需） */
    "--auto-bgcolor": "var(--x-bgcolor-0)",
    "--auto-secondary-bgcolor": "color-mix(in srgb, var(--x-bgcolor-2), transparent 55%)",
    "--auto-third-bgcolor": "color-mix(in srgb, var(--x-bgcolor-2), transparent 25%)",
    "--auto-workspace-bgcolor": "var(--x-bgcolor-1)",

    /* 边框 */
    "--auto-border-size": "1px",
    "--auto-border-color": "var(--x-color-6)",
    "--auto-border": "var(--auto-border-size) solid var(--auto-border-color)",
    // hover
    "--auto-hover-border-color": "var(--auto-hover-color)",
    "--auto-hover-border": "1px solid var(--auto-hover-border-color)",
    // selected
    "--auto-selected-border-color": "var(--auto-selected-color)",
    "--auto-selected-border": "1px solid var(--auto-selected-border-color)",
    // active
    "--auto-active-border-color": "var(--auto-active-color)",
    "--auto-active-border": "1px solid var(--auto-active-border-color)",
    // disable
    "--auto-disable-border-color": "var(--auto-disable-color)",
    "--auto-disable-border": "1px solid var(--auto-disable-border-color)",

    /* 排版/字体 */
    "--auto-font": "var(--x-font-weight-medium) var(--auto-font-size)/1.5 var(--auto-font-family)",
    "--auto-text": "var(--x-font)",
    "--auto-font-family":
        "Lantinghei SC,Microsoft Yahei,Hiragino Sans GB,Microsoft Sans Serif,WenQuanYi Micro Hei,sans-serif",
    "--auto-font-size": "var(--x-font-size-medium)",
    "--auto-text-size": "var(--x-font-size)",
    "--auto-font-weight": "var(--x-font-weight-medium)",
    "--auto-letter-spacing": "var(--x-letter-spacing-medium)",
    "--auto-line-height": "var(--x-line-height-medium)",
    "--auto-title-font":
        "calc(var(--auto-font-weight) + 100) calc(var(--auto-font-size) * 1.05)/1.5 var(--auto-font-family)",

    /* 面板: 用于导航/标题栏/标签页标题 */
    "--auto-panel-header-color": "var(--auto-color)",
    "--auto-panel-header": "var(--auto-title-font)",
    /** 标题背景颜色：用于标题/标题栏的背景颜色*/
    "--auto-panel-header-bgcolor": "var(--auto-secondary-bgcolor)",
    /* 面板背景颜色：用于面板/区块/Drawer等背景颜色*/
    "--auto-panel-bgcolor": "var(--auto-bgcolor)",

    /* 边框/间距 */
    "--auto-border-radius": "var(--x-border-radius-medium)",
    "--auto-spacing": "var(--x-spacing-medium)",
    "--auto-padding": "var(--x-spacing-medium)",
    "--auto-margin": "var(--x-spacing-medium)",
    "--auto-shadow": "var(--x-shadow-medium)",

    /* 输入框 */
    /** 输入框背景颜色：用于输入框背景颜色*/
    "--auto-input-font": "var(--auto-font)",
    "--auto-input-border": "var(--auto-border)",
    "--auto-input-bgcolor": "var(--auto-bgcolor)",
    /** 输入框占位符颜色：主文字色 40% 不透明（弱于三档正文，随模式自动适配） */
    "--auto-input-placeholder": "color-mix(in srgb, var(--auto-color), transparent 60%)",
    "--auto-input-padding": "var(--auto-padding)",
    "--auto-input-radius": "var(--auto-border-radius)",
    "--auto-input-height": "var(--auto-line-height)",
    /** 其他 */
    "--auto-icon-size": "var(--x-icon-size-medium)",
};
/**
 * 暗色专属派生变量：dark 属性下覆盖 derivedVars 的同名变量。
 *
 * 模式差异（档位引用 / 不透明度参数）集中于此，组件层保持模式无关。
 * 注入层级：必须在 derivedStyles 之后（同特异性下后者胜出）。
 *
 * 参数依据（校准工具：scripts/check-dark-contrast.ts，blue 主题实测）：
 * - 主色提一档（theme-5 → theme-6）：dark 下梯度已反转，theme-5 对面板底 gray-8 对比不足
 * - 交互态 bgcolor 不透明度与 light 保持同百分比：主色提档（更浅的蓝）叠加深底 Weber 敏感
 *   已补偿感知衰减——实测 15% 对称 +14.5%（1.34 vs 基准 1.17），抬高百分比反而过强（28% 达 1.77）
 * - 边框 gray-7 → gray-6：dark 下面板轮廓发虚（≈1.5:1），提档至 1.92:1，
 *   配合暗阴影双信号表达层级
 * - 输入框背景改指工作区色（gray-9 方向）：凹陷流派，比面板更深的"挖坑"感
 */
export const darkDerivedVars = {
    /* 主色基准：交互文字/primary 上游随此联动（hover-color 等引用 --auto-theme-color） */
    "--auto-theme-color": "var(--x-color-theme-6)",

    /* 交互态：selected-color 由 theme-5 提至主色同档；bgcolor 与 light 同百分比即感知对称 */
    "--auto-selected-color": "var(--auto-theme-color)!important",
    "--auto-selected-bgcolor":
        "color-mix(in srgb, var(--auto-selected-color), transparent 82%)!important",
    "--auto-hover-bgcolor":
        "color-mix(in srgb, var(--auto-hover-color), transparent 85%)!important",
    "--auto-active-bgcolor":
        "color-mix(in srgb, var(--auto-active-color), transparent 85%)!important",

    /* 禁用态：derivedVars 取 --x-color-8（dark 下为深灰，对面板仅 ≈1.9:1 近乎消失），
     * 提至中灰档保底可辨（≈4.3:1，仍明显弱于正文 13.5） */
    "--auto-disable-color": "color-mix(in srgb, var(--x-color-8), gray 80%)!important",

    /* 边框提亮（覆盖后 --auto-border 等引用自动跟随） */
    "--auto-border-color": "var(--x-color-8)",

    /* 输入框凹陷：dark 下 --x-bgcolor-1 为工作区最沉色 */
    "--auto-input-bgcolor": "var(--x-bgcolor-1)",
};
export const derivedColorizedVars = {};
