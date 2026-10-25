export declare const derivedVars: {
    "--auto-primary-color": string;
    "--auto-success-color": string;
    "--auto-danger-color": string;
    "--auto-warning-color": string;
    "--auto-info-color": string;
    "--auto-theme-color": string;
    /** 活动颜色 */
    "--auto-selected-color": string;
    "--auto-selected-bgcolor": string;
    "--auto-hover-color": string;
    "--auto-hover-bgcolor": string;
    "--auto-active-color": string;
    "--auto-active-bgcolor": string;
    "--auto-disable-color": string;
    "--auto-disable-bgcolor": string;
    "--auto-color": string;
    "--auto-text-color": string;
    "--auto-secondary-color": string;
    "--auto-third-color": string;
    "--auto-bgcolor": string;
    "--auto-secondary-bgcolor": string;
    "--auto-third-bgcolor": string;
    "--auto-workspace-bgcolor": string;
    "--auto-border-size": string;
    "--auto-border-color": string;
    "--auto-border": string;
    "--auto-hover-border-color": string;
    "--auto-hover-border": string;
    "--auto-selected-border-color": string;
    "--auto-selected-border": string;
    "--auto-active-border-color": string;
    "--auto-active-border": string;
    "--auto-disable-border-color": string;
    "--auto-disable-border": string;
    "--auto-font": string;
    "--auto-text": string;
    "--auto-font-family": string;
    "--auto-font-size": string;
    "--auto-text-size": string;
    "--auto-font-weight": string;
    "--auto-letter-spacing": string;
    "--auto-line-height": string;
    "--auto-title-font": string;
    "--auto-panel-header-color": string;
    "--auto-panel-header": string;
    /** 标题背景颜色：用于标题/标题栏的背景颜色*/
    "--auto-panel-header-bgcolor": string;
    "--auto-panel-bgcolor": string;
    "--auto-border-radius": string;
    "--auto-spacing": string;
    "--auto-padding": string;
    "--auto-margin": string;
    "--auto-shadow": string;
    /** 输入框背景颜色：用于输入框背景颜色*/
    "--auto-input-font": string;
    "--auto-input-border": string;
    "--auto-input-bgcolor": string;
    /** 输入框占位符颜色：主文字色 40% 不透明（弱于三档正文，随模式自动适配） */
    "--auto-input-placeholder": string;
    "--auto-input-padding": string;
    "--auto-input-radius": string;
    "--auto-input-height": string;
    /** 其他 */
    "--auto-icon-size": string;
};
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
export declare const derivedColorVars: Record<string, string>;
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
export declare const darkDerivedVars: {
    "--auto-theme-color": string;
    "--auto-selected-color": string;
    "--auto-selected-bgcolor": string;
    "--auto-hover-bgcolor": string;
    "--auto-active-bgcolor": string;
    "--auto-disable-color": string;
    "--auto-border-color": string;
    "--auto-input-bgcolor": string;
};
export declare const derivedColorizedVars: {};
