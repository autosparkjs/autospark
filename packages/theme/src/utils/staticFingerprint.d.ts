import type { ThemeSize } from "../types";
/** 指纹自定义属性名 */
export declare const STATIC_FINGERPRINT_VAR = "--x-theme-static";
/** 指纹 schema 版本：变量生成输出变更时必须 +1（v2：追加 6 个维度字段，ADR-0005） */
export declare const STATIC_SCHEMA = 2;
/** 调色板形态参数缺省值（与 createPrimaryPalette 内缺省一致） */
export declare const DEFAULT_SEED_LIGHTNESS_GAP = 1.7;
export declare const DEFAULT_CHROMA_BOOST_CAP = 1.25;
export type StaticFingerprintOptions = {
    themeColor: string;
    seedLightnessGap?: number;
    chromaBoostCap?: number;
    primary?: string;
    success?: string;
    warning?: string;
    danger?: string;
    info?: string;
    /** 维度字段（ADR-0005 烘焙默认）：只进指纹声明，不参与失配判定 */
    dark?: boolean;
    colorized?: boolean;
    size?: ThemeSize;
    spacing?: ThemeSize;
    shadow?: ThemeSize;
    radius?: ThemeSize;
};
/** 维度默认值（与 scope 构造函数默认一致）：指纹字段落缺省即「未烘焙」 */
export declare const STATIC_DEFAULT_DIMENSIONS: {
    readonly dark: false;
    readonly colorized: false;
    readonly size: "medium";
    readonly spacing: "medium";
    readonly shadow: "medium";
    readonly radius: "medium";
};
/** 从指纹解析出的维度默认（ADR-0005）：供运行时首访采纳 */
export type StaticDimensionDefaults = {
    dark: boolean;
    colorized: boolean;
    size: ThemeSize;
    spacing: ThemeSize;
    shadow: ThemeSize;
    radius: ThemeSize;
};
/**
 * 主题色归一：预设名解析为预设 hex；其余经 toRGBString 归一为小写 hex；
 * 不可解析（var() 等）原样返回（主题色不应出现此情形，由调用侧校验）。
 */
export declare function resolveThemeHex(color: string): string;
/** 判定归一结果是否为合法 6 位 hex（CLI 输入校验用） */
export declare function isValidThemeColor(color: string): boolean;
/** 构造指纹值（不含属性名），两端（生成器/运行时）共用，保证可比 */
export declare function buildStaticFingerprint(options: StaticFingerprintOptions): string;
/** 指纹规则块（写入静态文件头部） */
export declare function staticFingerprintRule(options: StaticFingerprintOptions): string;
/** 解析指纹值为 15 字段；空串/字段数非法返回 null */
export declare function parseStaticFingerprint(token: string): string[] | null;
/**
 * 解析指纹的维度字段（ADR-0005）：供运行时首访采纳为初始参数。
 * 指纹非法返回 null；字段值不做枚举校验（非法档位经 setter 属性通道落不到任何
 * 档位块，视觉退化为 medium，与「正确性优先」一致）。
 */
export declare function parseStaticDimensions(token: string): StaticDimensionDefaults | null;
/**
 * 指纹与生效参数是否完全一致（全有或全无，不做逐块部分匹配）。
 * 只比对前 9 个颜色字段（ADR-0005）：维度字段是「首访默认值声明」而非匹配
 * 契约——水合态与包声明的维度不一致是常态（用户选择优先），不触发回退。
 */
export declare function matchStaticFingerprint(token: string, options: StaticFingerprintOptions): boolean;
/**
 * 失配诊断（仅在指纹存在但不匹配时调用）：返回首个不一致颜色字段的人类可读说明。
 */
export declare function describeStaticMismatch(token: string, options: StaticFingerprintOptions): string;
/** 纯解析：对 5 个语义种子中的 var() 引用施查值函数（便于无 DOM 单测） */
export declare function resolveVarSeeds(options: StaticFingerprintOptions, lookup: (name: string) => string): StaticFingerprintOptions;
/**
 * 运行时指纹比对前的选项归一（DOM 薄封装）：在指纹同一载体元素上解析语义
 * 种子里的 var() 引用，使期望侧与浏览器回传的指纹 token 处于同一替换阶段。
 */
export declare function resolveFingerprintOptions(options: StaticFingerprintOptions, docRoot: HTMLElement): StaticFingerprintOptions;
/**
 * 从文档根元素读取指纹（薄 DOM 封装，匹配逻辑保持纯函数）。
 * 无 DOM 环境（SSR/bun 测试）或属性缺失返回空串。
 */
export declare function readStaticFingerprint(docRoot: HTMLElement): string;
