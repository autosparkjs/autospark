/**
 * 静态主题包指纹（ADR-0004）。
 *
 * 构建期生成的静态主题包（dist/<theme>.css）头部带一条机器可读指纹，运行时
 * root scope 水合生效参数后读取它：完全一致才跳过三块运行时注入（零 JS 也能
 * 正确首帧）；指纹存在但不一致 → console.warn 并回退全量动态注入（正确性优先，
 * 静态文件过期/包升级后标尺算法变更均由此兜底）。
 *
 * 指纹是声明在 :host,:root 上的 CSS 自定义属性，值为 `|` 分隔的 15 个字段：
 *
 *   v2|<生效 hex>|<gap>|<cap>|<primary>|<success>|<warning>|<danger>|<info>|<dark>|<colorized>|<size>|<spacing>|<shadow>|<radius>
 *
 * 前 9 个是颜色字段（匹配契约，全有或全无）；后 6 个是维度字段（ADR-0005 烘焙
 * 默认，dark/colorized 编码 0/1，档位为原串）——不参与失配判定，仅供运行时
 * 首访（无 localStorage 水合）采纳为初始参数，水合态恒优先（用户选择 > 包默认）。
 *
 * - 自定义属性经 getComputedStyle 原样返回（var() 不被替换、hex 不被归一化），
 *   故两端必须各自归一化：预设名解析为 hex、颜色字面量统一小写 hex；
 * - schema 版本是源码手动常量而非包版本号——文档/patch 发布不应让全部静态包失配；
 *   变量生成输出（vars/*、标尺算法、本指纹字段）变更时必须手动 +1，golden 快照
 *   测试兜底遗忘。
 */
import { presetThemes } from "../presets";
import type { ThemeSize } from "../types";
import { toRGBString } from "./toRGBString";

/** 指纹自定义属性名 */
export const STATIC_FINGERPRINT_VAR = "--x-theme-static";

/** 指纹 schema 版本：变量生成输出变更时必须 +1（v2：追加 6 个维度字段，ADR-0005） */
export const STATIC_SCHEMA = 2;

/** 调色板形态参数缺省值（与 createPrimaryPalette 内缺省一致） */
export const DEFAULT_SEED_LIGHTNESS_GAP = 1.7;
export const DEFAULT_CHROMA_BOOST_CAP = 1.25;

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
export const STATIC_DEFAULT_DIMENSIONS = {
    dark: false,
    colorized: false,
    size: "medium",
    spacing: "medium",
    shadow: "medium",
    radius: "medium",
} as const;

/** 从指纹解析出的维度默认（ADR-0005）：供运行时首访采纳 */
export type StaticDimensionDefaults = {
    dark: boolean;
    colorized: boolean;
    size: ThemeSize;
    spacing: ThemeSize;
    shadow: ThemeSize;
    radius: ThemeSize;
};

const FIELD_LABELS = [
    "schema",
    "主题色",
    "明度间隔(seedLightnessGap)",
    "彩度上限(chromaBoostCap)",
    "primary",
    "success",
    "warning",
    "danger",
    "info",
] as const;

/** 颜色字段数（匹配契约只覆盖前 9 个，维度字段不参与） */
const COLOR_FIELD_COUNT = 9;
/** 指纹总字段数 */
const FINGERPRINT_FIELD_COUNT = 15;

/** 6/8 位小写 hex 判定（与 scope.isColorLiteral 同语义） */
const isHexLiteral = (value: string): boolean =>
    /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value.trim());

/**
 * 主题色归一：预设名解析为预设 hex；其余经 toRGBString 归一为小写 hex；
 * 不可解析（var() 等）原样返回（主题色不应出现此情形，由调用侧校验）。
 */
export function resolveThemeHex(color: string): string {
    const source = (color ?? "").trim();
    if (source in presetThemes) return presetThemes[source].color.toLowerCase();
    return toRGBString(source).toLowerCase();
}

/** 判定归一结果是否为合法 6 位 hex（CLI 输入校验用） */
export function isValidThemeColor(color: string): boolean {
    return /^#[0-9a-f]{6}$/.test(resolveThemeHex(color));
}

/** 语义色种子归一：颜色字面量 → 小写 hex；var() 等非字面量原样透传 */
function resolveSeed(value: string | undefined): string {
    const v = (value ?? "").trim();
    if (!v) return "";
    if (isHexLiteral(v)) return toRGBString(v).toLowerCase();
    return v;
}

function gapField(value: number | undefined): string {
    return String(value ?? DEFAULT_SEED_LIGHTNESS_GAP);
}

function capField(value: number | undefined): string {
    return String(value ?? DEFAULT_CHROMA_BOOST_CAP);
}

const boolField = (value: boolean | undefined): string => (value ? "1" : "0");
const sizeField = (value: ThemeSize | undefined): string =>
    value ?? STATIC_DEFAULT_DIMENSIONS.size;

/** 构造指纹值（不含属性名），两端（生成器/运行时）共用，保证可比 */
export function buildStaticFingerprint(options: StaticFingerprintOptions): string {
    return [
        `v${STATIC_SCHEMA}`,
        resolveThemeHex(options.themeColor),
        gapField(options.seedLightnessGap),
        capField(options.chromaBoostCap),
        resolveSeed(options.primary),
        resolveSeed(options.success),
        resolveSeed(options.warning),
        resolveSeed(options.danger),
        resolveSeed(options.info),
        boolField(options.dark),
        boolField(options.colorized),
        sizeField(options.size),
        sizeField(options.spacing),
        sizeField(options.shadow),
        sizeField(options.radius),
    ].join("|");
}

/** 指纹规则块（写入静态文件头部） */
export function staticFingerprintRule(options: StaticFingerprintOptions): string {
    return `:host,:root{${STATIC_FINGERPRINT_VAR}:${buildStaticFingerprint(options)};}\n`;
}

/** 解析指纹值为 15 字段；空串/字段数非法返回 null */
export function parseStaticFingerprint(token: string): string[] | null {
    const parts = (token ?? "").trim().split("|");
    if (parts.length !== FINGERPRINT_FIELD_COUNT || parts.some((p) => p === "")) return null;
    return parts;
}

/**
 * 解析指纹的维度字段（ADR-0005）：供运行时首访采纳为初始参数。
 * 指纹非法返回 null；字段值不做枚举校验（非法档位经 setter 属性通道落不到任何
 * 档位块，视觉退化为 medium，与「正确性优先」一致）。
 */
export function parseStaticDimensions(token: string): StaticDimensionDefaults | null {
    const parts = parseStaticFingerprint(token);
    if (!parts) return null;
    return {
        dark: parts[9] === "1",
        colorized: parts[10] === "1",
        size: parts[11] as ThemeSize,
        spacing: parts[12] as ThemeSize,
        shadow: parts[13] as ThemeSize,
        radius: parts[14] as ThemeSize,
    };
}

/**
 * 字段归一用于比对：hex 字段统一小写——浏览器替换 var() 后保留被引用变量的
 * 原始大小写（标尺 hex 为大写），而期望端构建指纹时 hex 一律小写，需消歧。
 * 非 hex 字段（数字、未被替换的 var() 原文）原样保留（自定义属性名大小写敏感）。
 */
function normalizeField(field: string): string {
    return /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(field) ? field.toLowerCase() : field;
}

/**
 * 指纹与生效参数是否完全一致（全有或全无，不做逐块部分匹配）。
 * 只比对前 9 个颜色字段（ADR-0005）：维度字段是「首访默认值声明」而非匹配
 * 契约——水合态与包声明的维度不一致是常态（用户选择优先），不触发回退。
 */
export function matchStaticFingerprint(
    token: string,
    options: StaticFingerprintOptions,
): boolean {
    const actual = parseStaticFingerprint(token);
    if (!actual) return false;
    const expected = buildStaticFingerprint(options).split("|");
    return actual
        .slice(0, COLOR_FIELD_COUNT)
        .every((field, i) => normalizeField(field) === expected[i]);
}

/**
 * 失配诊断（仅在指纹存在但不匹配时调用）：返回首个不一致颜色字段的人类可读说明。
 */
export function describeStaticMismatch(
    token: string,
    options: StaticFingerprintOptions,
): string {
    const actual = parseStaticFingerprint(token);
    if (!actual) return "静态主题包指纹格式非法（字段缺失或损坏）";
    const expected = buildStaticFingerprint(options)
        .split("|")
        .slice(0, COLOR_FIELD_COUNT)
        .map(normalizeField);
    for (let i = 0; i < expected.length; i++) {
        if (actual[i] !== expected[i]) {
            return `${FIELD_LABELS[i]} 静态值=${actual[i]}，生效值=${expected[i]}`;
        }
    }
    return "未知失配";
}

/**
 * var() 引用解析（仅处理 `var(--name)` 与 `var(--name, fallback)` 的首参数）。
 *
 * 关键前提：浏览器在自定义属性的**计算值期**会替换其中的 var()——静态文件里
 * 指纹原文写的是 `var(--auto-theme-color)`，getComputedStyle 读回的却是解析值
 * （如 `#009AFF`）。故运行时端的期望种子也必须在同一元素上解析后再比对，
 * 否则非字面量默认种子（primary）会恒失配。解析不到（属性未定义）时保留原文，
 * 与文件侧必然不一致 → 安全回退动态注入。
 */
const VAR_REF_RE = /^var\(\s*(--[A-Za-z0-9-]+)\s*(?:,[^)]*)?\)$/;

/** 纯解析：对 5 个语义种子中的 var() 引用施查值函数（便于无 DOM 单测） */
export function resolveVarSeeds(
    options: StaticFingerprintOptions,
    lookup: (name: string) => string,
): StaticFingerprintOptions {
    const resolve = (value: string | undefined): string | undefined => {
        const v = (value ?? "").trim();
        const match = v.match(VAR_REF_RE);
        if (!match) return value;
        const resolved = lookup(match[1]).trim();
        return resolved || value;
    };
    return {
        ...options,
        primary: resolve(options.primary),
        success: resolve(options.success),
        warning: resolve(options.warning),
        danger: resolve(options.danger),
        info: resolve(options.info),
    };
}

/**
 * 运行时指纹比对前的选项归一（DOM 薄封装）：在指纹同一载体元素上解析语义
 * 种子里的 var() 引用，使期望侧与浏览器回传的指纹 token 处于同一替换阶段。
 */
export function resolveFingerprintOptions(
    options: StaticFingerprintOptions,
    docRoot: HTMLElement,
): StaticFingerprintOptions {
    let view: Window | null | undefined;
    try {
        view = docRoot.ownerDocument?.defaultView;
    } catch {
        return options;
    }
    if (!view) return options;
    return resolveVarSeeds(options, (name) => {
        try {
            return view!.getComputedStyle(docRoot).getPropertyValue(name);
        } catch {
            return "";
        }
    });
}

/**
 * 从文档根元素读取指纹（薄 DOM 封装，匹配逻辑保持纯函数）。
 * 无 DOM 环境（SSR/bun 测试）或属性缺失返回空串。
 */
export function readStaticFingerprint(docRoot: HTMLElement): string {
    try {
        return (
            docRoot.ownerDocument
                ?.defaultView?.getComputedStyle(docRoot)
                .getPropertyValue(STATIC_FINGERPRINT_VAR)
                .trim() ?? ""
        );
    } catch {
        return "";
    }
}
