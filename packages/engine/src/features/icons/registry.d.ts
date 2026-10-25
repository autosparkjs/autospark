/** 全局 symbol id 前缀（`as-{name}`；`as-` 为引擎保留前缀，页面手写 svg id 避让） */
export declare const GLOBAL_SYMBOL_PREFIX = "as-";
/** 基础类名（保留名，禁作图标名） */
export declare const ICON_BASE_CLASS = "as-icon";
/** badge 修饰类名（保留名——`badge` 选项挂类承载，规则常驻基础样式表） */
export declare const ICON_BADGE_CLASS = "as-icon-badge";
/** button 修饰类名（保留名——`button` 选项挂类承载，规则常驻基础样式表，ADR-0049） */
export declare const ICON_BUTTON_CLASS = "as-icon-button";
export type IconChangeAction = "add" | "delete" | "options";
export type IconChangeListener = (name: string, action: IconChangeAction) => void;
/** 图标渲染选项（全局默认配置 `AutoSpark.icons.options` 的形态） */
export interface IconOptions {
    strokeWidth?: number | string;
    size?: number | string;
    color?: string;
    padding?: number | string;
    /**
     * 修饰：图标底板——圆角矩形背景（包裹层通道）。标量三形态（形态即启用）：true 开关
     * （板 padding 走「显式 padding 选项 > 默认 0.3em」）、number 板 padding（→ px，须 ≥ 0）、
     * string 板 padding（CSS 值直传，空串按 true）。
     */
    badge?: boolean | number | string;
    /** 修饰：图标按钮——hover/press 交互动效（载体动效型，隐含 pointer，ADR-0049） */
    button?: boolean;
    /** 修饰：手型光标（`cursor: pointer`，可点击语义） */
    pointer?: boolean;
}
/** 默认描边宽度（`.as-icon` 基础规则 `--as-icon-sw` 变量的兜底值，ADR-0058 决策 6） */
export declare const DEFAULT_ICON_STROKE_WIDTH = 1.25;
/** 本地图标名约束（CSS ident；symbol id 体系沿用——收紧无成本且天然挡住旧 `集/名` 值形误用） */
export declare const ICON_NAME_RE: RegExp;
/** 图标名校验：CSS ident + 非保留名（声明侧与注册表共用） */
export declare function isValidIconName(name: string): boolean;
/** strokeWidth 值归一化：合法正数返回数值，否则 null（由调用方决定回退到哪层默认） */
export declare function normalizeStrokeWidth(v: unknown): number | null;
export declare class IconRegistry extends Set<string> {
    private _options;
    /**
     * 全局图标默认配置（配置链第三级：指令选项 > 宿主选项 > 本配置 > 内置默认）。
     * **整体赋值**（`icons.options = {...}`）广播 `options` 变更重渲染已渲染实例（描边宽度
     * 经 `--as-icon-sw` 变量即时换挡）；深修改不广播，仅影响后续渲染——主题切换请整体赋值。
     */
    get options(): IconOptions;
    set options(v: IconOptions);
    /** name → 原始 svg 串（内部存储，getSvg 外露） */
    private svgs;
    /** 变更监听器 */
    private listeners;
    /**
     * 注册图标（扩展 Set 契约的双参形态）：归一化 → 注入全局 symbol `as-{name}`。
     * 校验失败（非法名/保留名/无 svg）warn + 拒绝；**同名静默覆盖**（ADR-0058 决策 12——
     * 模板克隆幂等重收集不再刷屏）。
     */
    add(name: string, svg: string): this;
    /** 移除图标（Set 契约：不存在的名称静默返回 false）；摘除 symbol，使用中实例经变更通知回退默认图标 */
    delete(name: string): boolean;
    /** 取原始 svg 串（声明入参原样；symbol 是渲染产物）；不存在返回 undefined */
    getSvg(name: string): string | undefined;
    /** 订阅图标域变更（全局 add/delete/options + 局部 symbol 注入/远程到达）；返回退订函数 */
    onChange(listener: IconChangeListener): () => void;
    /**
     * 图标域变更总线出口（ADR-0058 决策 11）：本表 add/delete 与 options setter 之外，
     * **scope 局部 symbol 注入与远程到达/失败**也经此广播——x-icon 按名唤醒的统一通道。
     */
    emitChange(name: string, action: IconChangeAction): void;
}
/** 惰性建表（幂等；SSR 无 document 守卫）。内容为静态常量，建表后不再变更。 */
export declare function refreshIconStyle(): void;
/** 全局图标注册表单例（`AutoSpark.icons` 静态暴露同一实例） */
export declare const iconRegistry: IconRegistry;
