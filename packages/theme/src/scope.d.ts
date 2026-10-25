import type { DynamicThemeOptions, ThemeOptions, ThemeSize } from "./types";
export declare class AutoSparkThemeScope {
    options: Required<ThemeOptions>;
    private _selectors;
    stylesheets: string[];
    connected: boolean;
    elements: WeakRef<HTMLElement>[];
    /**
     * 快照协调器（ADR-0003）：由 ThemeManager 构造后注入，负责把本 scope 的 CSS
     * 合成进全局样式快照；独立使用的 scope 为 null（仅参数持久化，无样式快照）。
     */
    coordinator: {
        persistStyles(scope: AutoSparkThemeScope): void;
        /** 静态主题包指纹命中时清空旧样式快照（ADR-0004），避免回访首帧画错 */
        clearStylesSnapshot?(scope: AutoSparkThemeScope): void;
    } | null;
    /** 已注入样式内容缓存（styleId → css）：内容未变跳过重解析；也是样式快照的数据源（不查 DOM） */
    private _cssMap;
    /**
     * 静态主题包满足标记（ADR-0004）：root scope 水合后指纹与静态 <link>
     * 完全一致时为 true，三块运行时注入全部跳过，静态文件即永久样式来源。
     * 运行时 update() 换色后动态块照常注入并常驻，本标记不回退（刷新回归纯静态路径）。
     */
    private _staticSatisfied;
    /**
     * 静态包声明的维度默认（ADR-0005）：指纹命中时从指纹解析。两个用途：
     * 首访（无水合）采纳为初始参数；setter/水合同步的「medium/亮/灰回退」
     * 显式化判据（烘焙维度下「无属性」= 烘焙值而非库默认，回退须显式写
     * data-X="medium" / data-light / data-uncolored 命中对应块）。
     */
    private _staticDims;
    /** 上次持久化的参数 JSON：值未变跳过 localStorage 写入 */
    private _lastParamsJson;
    constructor(options?: ThemeOptions);
    get id(): string;
    /** 是否参与持久化（默认 true，显式传 false 退出：不读写 localStorage，照常渲染） */
    get persistence(): boolean;
    /** 本 scope 已注入的 CSS 片段（样式快照合成数据源，供 coordinator 读取） */
    get cssChunks(): string[];
    get docRoot(): HTMLElement;
    get size(): ThemeSize;
    set size(value: ThemeSize);
    get dark(): boolean;
    set dark(value: boolean);
    get spacing(): ThemeSize;
    set spacing(value: ThemeSize);
    get shadow(): ThemeSize;
    set shadow(value: ThemeSize);
    get colorized(): boolean;
    set colorized(value: boolean);
    get radius(): ThemeSize;
    set radius(value: ThemeSize);
    get themeColor(): string;
    set themeColor(value: string);
    private _forEachElements;
    /**
     * 规模维度回退 medium 的属性写入（ADR-0005 显式化配套）：静态包烘焙了非
     * medium 默认档时，「无属性」经守卫块命中烘焙档，回 medium 必须显式写
     * data-X="medium"（medium 档块本就存在于全量产物中）；否则维持移除语义。
     */
    private _applySizeAttr;
    /**
     * dark 回退亮的属性写入（ADR-0005）：烘焙 dark 时切亮须显式 data-light
     * （守卫 :not 链出口）；data-light 原为纯手动通道，仅烘焙场景下由本类代管。
     */
    private _applyDarkAttr;
    /** colorized 回退灰的属性写入（ADR-0005）：烘焙多彩时切灰须显式 data-uncolored */
    private _applyColorizedAttr;
    /**
     * 本作用域是否为文档根域（:host/:root 选择器，即 manager 的 root scope）。
     * 根域子树即文档，data-* 手动通道可裸追加；其余作用域须收敛到自身子树。
     */
    private get _isRootScope();
    /**
     * data-* 手动通道的替选择器（Q2a：约束到本作用域子树）：根域保持裸属性
     * 追加——其子树即文档，裸命中即正确；其余作用域由 _selectors 逐个产出
     * 「自身 + 后代」两式（S[data-X],S [data-X]），把命中约束在本作用域子树内
     * ——跨作用域裸命中会错拿别的作用域的字面量梯度（自定义属性继承的是
     * 解析后的值，裸属性无法感知所属作用域）。
     */
    private _dataAlt;
    /**
     * 暗色+多彩叠加块选择器：根域沿用四组合裸写（既有纯遗留 + 三个裸组合，
     * 同元素命中）；作用域收敛为「自身四组合 + 后代守卫」——后代守卫
     * S [data-dark][colorized] / S [data-dark][data-colorized] 以更高特异性
     * 压过本作用域暗色块的 S [data-dark]（!important 灰），否则作用域内
     * data-dark+data-colorized 会被降级为灰（Q5 组合修复的特异性前提）。
     */
    private _comboSelector;
    /**
     * 生成主题颜色的CSS样式字符串
     * @returns {string} 包含主题颜色变量的CSS样式字符串，支持亮色和暗色模式
     */
    protected _generateThemeColorStyles(): string;
    protected _injectThemeColorStyles(): string | undefined;
    /**
     * 创建语义化颜色样式并注入到页面中
     * @param {boolean} [inject=true] - 是否立即将样式注入到页面
     * @returns {string|undefined} 生成的CSS样式字符串，如果未覆盖默认颜色则返回undefined
     * @private
     */
    protected _injectSemanticColorStyles(): string | undefined;
    /**
     * 创建语义化颜色样式并注入到页面中
     * @returns {string|undefined} 生成的CSS样式字符串，如果未覆盖默认颜色则返回undefined
     * @private
     */
    /**
     * 生成语义化颜色样式。
     *
     * 语义色作为梯度种子统一生成 10 阶标尺（--x-color-{name}-0..9，0 最浅 9 最深，
     * 与 palette.less 色系惯例同向）：light 直引种子原值（行为与固定 hex 时代零差异），
     * dark 提亮引用第 3 档——深底上语义色需提亮而非变暗（ADR-0002）。
     *
     * var() 引用等不可解析为颜色字面量的种子豁免梯度化，直接注入原值且无 dark 覆盖
     * （primary 默认值 var(--auto-theme-color) 即此情形，其 dark 适配由 theme 标尺
     * 提档承担）。
     */
    protected _generateSemanticColorStyles(): string | undefined;
    /**
     * 生成主题颜色相关的CSS变量
     * @param {string} [color=this.themeColor] - 主题颜色值，可以是预设主题名或自定义颜色值
     * @param {boolean} [reverse=false] - 是否反转渐变颜色顺序
     * @returns {Record<string, string>} 包含主题颜色CSS变量的对象
     */
    protected _createThemeColorVars(color?: string, reverse?: boolean): Record<string, string>;
    protected _addStyleheetId(id: string): void;
    protected _generateBaseStyles(): string;
    /**
     * 注入主题基础样式到页面中
     * @param {boolean} [inject=true] - 是否立即将样式注入到页面中
     * @returns {string} 生成的CSS样式字符串
     * @private
     */
    private _injectBaseStyles;
    /**
     * 注入样式（内容去重版，ADR-0003）：与缓存相同则跳过重解析与快照重写——
     * 取色器拖动的 @input 逐像素触发与 MutationObserver 回环在此收敛为
     * 「值真变才写一次」。代价：外部移除 style 标签后同内容重注入不会重建
     * 标签（disconnect 清缓存兜底重连场景）。
     */
    private _writeStylesheet;
    private _collectParams;
    /** 持久化当前参数（ADR-0003）：序列化后与上次相同则跳过写 IO */
    protected _persistParams(): void;
    /** 读取参数快照水合 options；返回是否存在水合数据 */
    private _hydrateParams;
    /**
     * 将水合后的参数同步为 DOM 属性（与各 setter 的属性语义一致：medium 移除、
     * false 移除）。水合发生在 connect 早期（先于注入，防二次闪烁），当时元素
     * 尚未 attach、setter 走不到目标元素，故由此统一补齐。
     */
    private _syncPersistedAttrs;
    /**
     * 更新主题
     */
    update(options: Partial<DynamicThemeOptions>): void;
    /**
     * 静态主题包指纹校验（ADR-0004）：仅 root 作用域参与——静态包选择器固定
     * :host,:root，局部作用域即使经继承读到指纹也不代表其样式被覆盖。
     * 比对发生在 _hydrateParams 之后（拿到的是 localStorage 水合后的生效参数）；
     * 指纹缺失（未引静态包/SSR 无 DOM）返回 false 走现行注入路径；指纹存在但
     * 不一致 → warn 一次并返回 false，由动态注入（后注入胜出）接管静态文件。
     */
    private _satisfiedByStaticLayer;
    /**
     * 首访采纳指纹维度默认（ADR-0005）：仅在水合缺失时由 connect 调用——水合态
     * 恒优先（用户选择 > 包默认）。与库默认有差异才写入 options 并返回 true，
     * 属性物化由 _syncPersistedAttrs 统一补齐，connect 尾部 _persistParams 随
     * 基线漂移自然落盘（与首访写默认参数的现行行为一致）。
     */
    private _adoptStaticDims;
    connect(): void;
    /**
     * 将主题样式应用到匹配选择器的所有元素
     * @private
     * @throws {TypeError} 如果元素不是HTMLElement实例
     */
    private _applyToElements;
    disconnect(): void;
    isConnected(): boolean;
    /**
     * 生成作用域全量 CSS 字符串（base → colors → semantics，与 connect 注入
     * 顺序一致）。构建期静态产物（ADR-0004，经 generateStaticThemeCss）与
     * download() 均走本方法——物理上不存在第二套组装路径（ADR-0006）。
     */
    toStyles(): string;
    /**
     * download() 的产物决策（ADR-0006）：root 作用域经 assembleStaticThemeCss
     * 出合规静态主题包（指纹头 + 三块 + 当前维度烘焙守卫块，与 CLI
     * generate-theme 产物逐字节一致，挂 <link> 即可被运行时指纹接管）；
     * 非 root 作用域出 toStyles() 快照——静态层契约只服务 root，局部产物
     * 挂 <link> 不会被指纹识别，warn 防误用。
     */
    protected _resolveDownloadCss(): string;
    download(): void;
    autoAttach(): void;
    /**
     * 将主题作用域应用到指定的DOM元素上
     * @param {string | HTMLElement} selector - CSS选择器字符串或HTMLElement元素
     */
    attach(selector: string | HTMLElement): void;
    /**
     * 从主题作用域中分离指定的元素
     * @param {string|HTMLElement} selector - CSS选择器字符串或HTMLElement元素
     * @returns {void}
     */
    detach(selector: string | HTMLElement): void;
}
