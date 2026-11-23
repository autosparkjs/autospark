export const derivedVars = {
    /* 语义色调 */
    "--auto-primary-color": "var(--x-color-primary)",
    "--auto-success-color": "var(--x-color-success)",
    "--auto-danger-color": "var(--x-color-danger)",
    "--auto-warning-color": "var(--x-color-warning)",
    "--auto-info-color": "var(--x-color-info)",
    /* 主色取 theme-8（#0067C2，白底 5.6:1）——观感对齐 VSCode Light Modern 链接蓝
     * #005FB8（6.3:1），为梯度上最接近档；theme-5 仅为 2.97:1 的天蓝，差距过大 */
    "--auto-theme-color": "var(--x-color-theme-8)",

    /** 活动颜色 */
    "--auto-selected-color": "var(--auto-theme-color)!important",
    "--auto-selected-bgcolor":
        "color-mix(in srgb, var(--auto-selected-color), transparent 80% )!important",

    "--auto-hover-color": "var(--auto-theme-color)!important",
    "--auto-hover-bgcolor":
        "color-mix(in srgb, var(--auto-hover-color), transparent 85%)!important",

    /* active 深于主色一档（theme-9 #0049A3），保持「悬停浅/按压实」的既有梯度关系 */
    "--auto-active-color": "var(--x-color-theme-9)!important",
    "--auto-active-bgcolor":
        "color-mix(in srgb, var(--auto-active-color), transparent 85%)!important",

    "--auto-disable-color": "color-mix(in srgb, var(--x-color-8), gray 50%)!important",
    "--auto-disable-bgcolor": "color-mix(in srgb, currentColor, transparent 80%)!important",

    /* 字体颜色 */
    /* 字体颜色三档（同源 color-1 浓度阶梯）：正文实色 + 次要 70% / 三级 40% 不透明——
     * light 次要 ≈#767676（= VSCode Light Modern placeholderForeground）对白底
     * ≈4.55:1 达 AA；dark 次要不跟此参数（彩底浓度需求不同，见 darkDerivedVars） */
    "--auto-color": "var(--x-color-1)",
    "--auto-text-color": "var(--auto-color)",
    "--auto-secondary-color": "color-mix(in srgb, var(--x-color-1), transparent 30%)",
    "--auto-third-color": "color-mix(in srgb, var(--x-color-1), transparent 60%)",

    /* 背景四档梯度（用途语义，层级递进；light 取淡流派——档间微差、靠边框分层，
     * 与 VSCode light 弱对比观感一致）：
     * - workspace：工作区 / 应用底——最底层（dark #181818 = VSCode sideBar；light #F8F8F8）
     * - bgcolor：面板 / 卡片——实色容器浮于工作区（dark #1F1F1F = VSCode editor.background）
     * - secondary：次级面板 / 分区——bgcolor-2 35% 不透明叠加（light ≈#F7F7F7 淡分区）；
     *   dark 原料距面板过近（#222222 仅差 3/255，浓度再高不可辨），升档覆盖见 darkDerivedVars
     * - third：代码块 / 内嵌提示——bgcolor-2 55% 不透明叠加（light ≈#F2F2F2 = VSCode
     *   list.hover）；dark 原料距面板过近（#222222 仅差 3/255，叠后与 secondary 不可辨），
     *   升档覆盖见 darkDerivedVars
     * 梯度方向随模式标尺互换：dark 内嵌逐级浮亮、light 内嵌逐级沉灰；
     * !important 移除（模式覆盖作用于基变量，此处无需） */
    "--auto-bgcolor": "var(--x-bgcolor-0)",
    "--auto-secondary-bgcolor": "color-mix(in srgb, var(--x-bgcolor-2), transparent 65%)",
    "--auto-third-bgcolor": "color-mix(in srgb, var(--x-bgcolor-2), transparent 45%)",
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
 * 规模维度键（font/spacing/radius/shadow/icon 梯度及其组合速写）：只引用模式无关
 * 基变量（--x-font-…/--x-spacing-…/--x-border-radius-…/--x-icon-size-… 等，暗色/
 * 彩色生成器从不覆盖）或字面常量。元素从 :root 继承的已替换值与重新声明完全相同，
 * 故**不进** data-* 自举块——自举块生成在 data-size/data-radius/data-spacing/
 * data-shadow 档位块之后、同特异性下后者胜出，重新声明会把档位强制回 medium
 * （data-size 组合 data-dark 时被击穿的根因）。只留在基亮块作根域默认值。
 */
const scaleVarKeys = new Set([
    "--auto-border-size",
    "--auto-font",
    "--auto-text",
    "--auto-font-family",
    "--auto-font-size",
    "--auto-text-size",
    "--auto-font-weight",
    "--auto-letter-spacing",
    "--auto-line-height",
    "--auto-title-font",
    "--auto-panel-header",
    "--auto-border-radius",
    "--auto-spacing",
    "--auto-padding",
    "--auto-margin",
    "--auto-shadow",
    "--auto-input-font",
    "--auto-input-padding",
    "--auto-input-radius",
    "--auto-input-height",
    "--auto-icon-size",
]);

/**
 * 色彩维度子集（全集 − 规模键）：var() 链最终触达 --x-color-… / --x-bgcolor-… /
 * currentColor（随 data-dark / data-colorized / data-uncolored 变化的基变量），
 * 必须随四个手动通道重新声明到元素自身，--auto-* 才能按其自身的 --x-* 重新替换
 * （自定义属性的 var() 在声明所在元素计算值期替换、后代继承已替换值）。
 * scope.ts 的派生层自举块只取本对象。
 *
 * 唯一模式相关的规模键 --auto-shadow 例外在侧：--x-shadow-* 被 darkShadowVars
 * 覆盖，其暗域重新声明由 darkShadowStyles 承担（该块恒在档位块之前，
 * data-size/data-shadow 可正常覆盖它），故它留在规模键集合内、不进自举块。
 */
export const derivedColorVars: Record<string, string> = Object.fromEntries(
    Object.entries(derivedVars).filter(([key]) => !scaleVarKeys.has(key)),
);
/**
 * 暗色专属派生变量：dark 属性下覆盖 derivedVars 的同名变量。
 *
 * 模式差异（档位引用 / 不透明度参数）集中于此，组件层保持模式无关。
 * 注入层级：必须在 derivedStyles 之后（同特异性下后者胜出）。
 *
 * 参数依据（校准工具：scripts/check-dark-contrast.ts，blue 主题实测；
 * 面板底对齐 VSCode Dark Modern #1F1F1F、种子 #0078d4 后重校）：
 * - 主色取 theme-5：dark 下梯度已反转，#3CA7F6 观感对齐 VSCode 链接蓝 #4daafc
 * - 交互态 bgcolor 不透明度与 light 保持同百分比：主色提档（更浅的蓝）叠加深底 Weber 敏感
 *   已补偿感知衰减，抬高百分比反而过强
 * - 边框 = 面板底混白 12% ≈ #3A3A3A（VSCode input.border #3C3C3C 同族）：混白 8% 的
 *   产物恰为 #313131、与输入底（浮起档 bgcolor-3）1:1 同色，输入框轮廓会彻底消失；
 *   12% 对面板 ≈1.45:1（VSCode panel.border #2B2B2B 为 1.19:1，同为弱边框流派）
 * - 输入框背景浮起（VSCode 流派）：改指 bgcolor-3（#313131），亮于面板而非凹陷——
 *   凹陷流派是为旧中灰面板（#606060 时代）校的，深底上浮起才与 VSCode 观感一致
 */
export const darkDerivedVars = {
    /* 主色基准：交互文字/primary 上游随此联动（hover-color 等引用 --auto-theme-color）。
     * 取 theme-5（#3CA7F6，深底 6.3:1）——观感对齐 VSCode Dark Modern 链接蓝 #4daafc
     * （6.65:1，两者仅 Δrgb≈17），为梯度上最接近档 */
    "--auto-theme-color": "var(--x-color-theme-5)",

    /* 次要文字：不随 light 基础档的 40%（灰域仅 4.5 险过、colorized 3.19 < AA）——
     * 彩色暗底（theme-0 面板）比灰面板亮，次要文字混底衰减更深，浓度需求更高；
     * 12%（88% 不透明）两域通吃（灰 ≈7.8 / 彩 ≈4.7，实测见校准脚本） */
    "--auto-secondary-color": "color-mix(in srgb, var(--x-color-1), transparent 30%)",

    /* 交互态：selected-color 由 theme-5 提至主色同档；bgcolor 与 light 同百分比即感知对称 */
    "--auto-selected-color": "var(--auto-theme-color)!important",
    "--auto-selected-bgcolor":
        "color-mix(in srgb, var(--auto-selected-color), transparent 82%)!important",
    "--auto-hover-bgcolor":
        "color-mix(in srgb, var(--auto-hover-color), transparent 85%)!important",
    "--auto-active-bgcolor":
        "color-mix(in srgb, var(--auto-active-color), transparent 85%)!important",

    /* 禁用态：derivedVars 取 --x-color-8（dark 下为最深灰 #1F1F1F，对面板近同色），
     * 混 gray 80% 提至中灰保底可辨（≈3.7:1，仍明显弱于正文 ≈12.9） */
    "--auto-disable-color": "color-mix(in srgb, var(--x-color-8), gray 80%)!important",

    /* 边框派生：面板底混白恒定偏移（保色相），不挂前景标尺档——面板底随标尺重排/
     * 彩色暗底（theme-0）变化时边框自动跟随错开，恒不与面板融合；固定档方案曾于
     * 39ca7a1 标尺迁移中被错映射为 color-8、与面板同色 1:1 失效，此为防复发
     * 的设计动机。12% 实测灰域 1.45:1（阈值 1.2，恒定偏移的结构特性）；
     * 比例上限受输入底约束：≥8% 时混白产物与 #313131 输入底趋同 */
    "--auto-border-color": "color-mix(in srgb, var(--auto-panel-bgcolor), white 12%)",

    /* 输入框浮起：dark 下 bgcolor-3 为 #313131（VSCode input.background），亮于面板 */
    "--auto-input-bgcolor": "var(--x-bgcolor-3)",

    /* 次级面板底：原料升到 bgcolor-3（与 third 同源不同浓度）——bgcolor-2（#222222）
     * 距面板 #1F1F1F 仅 3/255，浓度再高叠出的 secondary 都挤在 #1F~#22 与面板不可辨；
     * 40% 叠加 ≈#262626，与面板/third 各差约 7，梯度 181818 → 1F1F1F → 262626 →
     * 2D2D2D → 313131（输入底）单调均匀（light 侧无需覆盖：35% 淡分区 ≈#F7F7F7） */
    "--auto-secondary-bgcolor": "color-mix(in srgb, var(--x-bgcolor-3), transparent 60%)",

    /* 内嵌第三档（代码块/内嵌提示）：同源 bgcolor-3 原料、75% 浓度叠加 ≈#2D2D2D，
     * 与 secondary（40%）构成同源浓度阶梯，五档浮起链单调可辨 */
    "--auto-third-bgcolor": "color-mix(in srgb, var(--x-bgcolor-3), transparent 25%)",
};
export const derivedColorizedVars = {};
