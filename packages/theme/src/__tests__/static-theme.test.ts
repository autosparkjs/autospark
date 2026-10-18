import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AutoSparkThemeScope } from "../scope";
import { presetThemes } from "../presets";
import { generateStaticThemeCss } from "../utils/generateStaticTheme";
import {
    buildStaticFingerprint,
    DEFAULT_CHROMA_BOOST_CAP,
    DEFAULT_SEED_LIGHTNESS_GAP,
    describeStaticMismatch,
    matchStaticFingerprint,
    parseStaticDimensions,
    parseStaticFingerprint,
    resolveThemeHex,
    resolveVarSeeds,
    STATIC_FINGERPRINT_VAR,
    STATIC_SCHEMA,
    staticFingerprintRule,
    type StaticFingerprintOptions,
} from "../utils/staticFingerprint";

/** ThemeScope 构造默认值（与 scope.ts 一致），指纹比对的基准 */
const defaultOptions: StaticFingerprintOptions = {
    themeColor: "blue",
    primary: "var(--auto-theme-color)",
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#71717a",
};

/**
 * 同源零分叉（ADR-0004）：静态包内容必须逐字符等于「同参数 live root scope
 * 生成结果 + 指纹块」。任何人改动 vars/标尺输出而忘记重新生成，此测试先红。
 */
describe("静态主题包与运行时注入同源", () => {
    test("产物 = 指纹规则块 + root scope.toStyles()，逐字符一致", () => {
        const css = generateStaticThemeCss({ themeColor: "blue" });
        const live = new AutoSparkThemeScope({
            id: "root",
            cssSelector: [":host", ":root"],
            autoConnect: false,
            autoAttach: false,
            persistence: false,
        });
        const rule = staticFingerprintRule({
            themeColor: live.options.themeColor,
            seedLightnessGap: live.options.seedLightnessGap,
            chromaBoostCap: live.options.chromaBoostCap,
            primary: live.options.primary,
            success: live.options.success,
            warning: live.options.warning,
            danger: live.options.danger,
            info: live.options.info,
        });
        expect(css).toBe(`${rule}${live.toStyles()}`);
    });

    test("产物首行为 root 选择器上的指纹声明", () => {
        const css = generateStaticThemeCss({ themeColor: "blue" });
        expect(css.startsWith(`:host,:root{${STATIC_FINGERPRINT_VAR}:`)).toBe(true);
    });
});

describe("指纹匹配纯函数", () => {
    const token = buildStaticFingerprint(defaultOptions);

    test("默认参数自匹配", () => {
        expect(matchStaticFingerprint(token, defaultOptions)).toBe(true);
    });

    test("预设名与归一化 hex 等价（大小写不敏感）", () => {
        expect(
            matchStaticFingerprint(token, { ...defaultOptions, themeColor: "#1677FF" }),
        ).toBe(true);
        expect(
            matchStaticFingerprint(buildStaticFingerprint({ ...defaultOptions, themeColor: "#1677ff" }), {
                ...defaultOptions,
                themeColor: "blue",
            }),
        ).toBe(true);
        expect(resolveThemeHex("blue")).toBe("#1677ff");
    });

    test("主题色不一致即失配", () => {
        expect(
            matchStaticFingerprint(token, { ...defaultOptions, themeColor: "red" }),
        ).toBe(false);
    });

    test("gap/cap 不一致即失配，缺省字段按生成器默认值入串", () => {
        expect(token).toContain(`|${DEFAULT_SEED_LIGHTNESS_GAP}|${DEFAULT_CHROMA_BOOST_CAP}|`);
        expect(
            matchStaticFingerprint(token, { ...defaultOptions, seedLightnessGap: 2 }),
        ).toBe(false);
        expect(
            matchStaticFingerprint(token, { ...defaultOptions, chromaBoostCap: 1.3 }),
        ).toBe(false);
        // 显式传默认值与缺省等价
        expect(
            matchStaticFingerprint(token, {
                ...defaultOptions,
                seedLightnessGap: 1.7,
                chromaBoostCap: 1.25,
            }),
        ).toBe(true);
    });

    test("任一语义色种子不一致即失配", () => {
        for (const field of ["success", "warning", "danger", "info"] as const) {
            expect(
                matchStaticFingerprint(token, { ...defaultOptions, [field]: "#123456" }),
            ).toBe(false);
        }
    });

    test("非字面量种子（var 引用）原样透传且可匹配", () => {
        const t = buildStaticFingerprint({ ...defaultOptions, primary: "var(--brand)" });
        expect(matchStaticFingerprint(t, { ...defaultOptions, primary: "var(--brand)" })).toBe(
            true,
        );
        expect(matchStaticFingerprint(t, defaultOptions)).toBe(false);
    });

    test("schema 版本不符失配", () => {
        const future = token.replace(`v${STATIC_SCHEMA}|`, `v${STATIC_SCHEMA + 1}|`);
        expect(matchStaticFingerprint(future, defaultOptions)).toBe(false);
    });

    test("空 token / 空白 / 字段数非法均失配而非抛错", () => {
        expect(matchStaticFingerprint("", defaultOptions)).toBe(false);
        expect(matchStaticFingerprint("   ", defaultOptions)).toBe(false);
        expect(matchStaticFingerprint("v1|#1677ff", defaultOptions)).toBe(false);
        expect(parseStaticFingerprint("")).toBeNull();
        expect(parseStaticFingerprint("a|b")).toBeNull();
    });

    test("浏览器替换后的大写 hex 与期望端小写归一匹配（标尺 hex 为大写）", () => {
        // 模拟 getComputedStyle 读回：主题色字段被浏览器原样保留大写写法
        const browserToken = token.replace("#1677ff", "#1677FF");
        expect(matchStaticFingerprint(browserToken, defaultOptions)).toBe(true);
    });

    test("var() 种子经同阶段查值解析后与浏览器回传 token 匹配", () => {
        // 浏览器实测：指纹原文 var(--auto-theme-color) 读回为其解析值 #009AFF
        const resolved = resolveVarSeeds(defaultOptions, (name) =>
            name === "--auto-theme-color" ? "#009AFF" : "",
        );
        const browserToken = buildStaticFingerprint({
            ...defaultOptions,
            primary: "#009AFF",
        });
        expect(matchStaticFingerprint(browserToken, resolved)).toBe(true);
    });

    test("var() 查无此变量时保留原文（与已替换 token 安全失配，回退注入）", () => {
        const resolved = resolveVarSeeds(defaultOptions, () => "");
        const browserToken = buildStaticFingerprint({
            ...defaultOptions,
            primary: "#009aff",
        });
        expect(matchStaticFingerprint(browserToken, resolved)).toBe(false);
        expect(matchStaticFingerprint(token, resolved)).toBe(true);
    });

    test("失配诊断指向首个不一致字段", () => {
        expect(describeStaticMismatch(token, { ...defaultOptions, themeColor: "red" })).toContain(
            "主题色",
        );
        expect(describeStaticMismatch("", defaultOptions)).toContain("非法");
    });
});

describe("12 预设批量生成冒烟", () => {
    for (const name of Object.keys(presetThemes)) {
        test(`${name} 生成成功且含指纹与亮/暗两块`, () => {
            const css = generateStaticThemeCss({ themeColor: name });
            expect(css.length).toBeGreaterThan(1000);
            const head = css.split("\n", 1)[0];
            expect(head).toContain(
                `${STATIC_FINGERPRINT_VAR}:v${STATIC_SCHEMA}|${presetThemes[name].color.toLowerCase()}|`,
            );
            expect(parseStaticFingerprint(head)).not.toBeNull();
            expect(css).toContain("color-scheme: light");
            expect(css).toContain("color-scheme: dark");
        });
    }
});

describe("指纹维度字段（ADR-0005）", () => {
    test("默认参数指纹尾部落维度缺省值 0|0|medium×4", () => {
        const token = buildStaticFingerprint(defaultOptions);
        expect(token.endsWith("|0|0|medium|medium|medium|medium")).toBe(true);
        expect(parseStaticFingerprint(token)).toHaveLength(15);
    });

    test("指定维度时字段正确：布尔 0/1、档位原串", () => {
        const token = buildStaticFingerprint({
            ...defaultOptions,
            dark: true,
            colorized: true,
            size: "large",
            radius: "small",
        });
        expect(token.endsWith("|1|1|large|medium|medium|small")).toBe(true);
    });

    test("维度字段不参与失配判定（水合态与包声明维度不一致是常态）", () => {
        const bakedToken = buildStaticFingerprint({ ...defaultOptions, dark: true, size: "large" });
        expect(matchStaticFingerprint(bakedToken, defaultOptions)).toBe(true);
        expect(
            matchStaticFingerprint(buildStaticFingerprint(defaultOptions), {
                ...defaultOptions,
                dark: true,
                size: "large",
            }),
        ).toBe(true);
    });

    test("parseStaticDimensions 解析维度默认；非法 token 返回 null", () => {
        const token = buildStaticFingerprint({
            ...defaultOptions,
            dark: true,
            spacing: "x-large",
        });
        expect(parseStaticDimensions(token)).toEqual({
            dark: true,
            colorized: false,
            size: "medium",
            spacing: "x-large",
            shadow: "medium",
            radius: "medium",
        });
        expect(parseStaticDimensions("")).toBeNull();
        expect(parseStaticDimensions("v1|#1677ff")).toBeNull();
    });
});

describe("维度烘焙守卫块（ADR-0005）", () => {
    test("默认包零守卫块追加（产物与仅颜色字段时逐字节一致）", () => {
        const css = generateStaticThemeCss({ themeColor: "blue" });
        expect(css).not.toContain("baked defaults");
        expect(css).not.toContain(":not([data-size])");
    });

    test("dark 烘焙：双向 :not 链守卫 + 暗色变量表，--auto-shadow 交叠键被剔除", () => {
        const css = generateStaticThemeCss({ themeColor: "blue", dark: true });
        expect(css).toContain(
            ":root:not([dark]):not([data-dark]):not([data-light])",
        );
        const guard = css.slice(css.indexOf("baked defaults"));
        expect(guard).toContain("color-scheme: dark");
        // darkColorVars 反序灰（!important 原样保留）
        expect(guard).toContain("--x-plain-color-0:var(--x-color-gray-0) !important");
        // darkShadowVars 的暗配方基量在，自举键 --auto-shadow 被剔除（让位 size 守卫）
        expect(guard).toContain("--x-shadow-medium:0 2px 4px hsl(0 0% 0% / 50%)");
        expect(guard).not.toContain("--auto-shadow");
    });

    test("colorized 烘焙：守卫排除 data-uncolored 反向出口", () => {
        const css = generateStaticThemeCss({ themeColor: "blue", colorized: true });
        expect(css).toContain(
            ":root:not([colorized]):not([data-colorized]):not([data-uncolored])",
        );
        expect(css.slice(css.indexOf("baked defaults"))).toContain("--x-color-0:var(--x-tinted-color-0)");
    });

    test("dark+colorized 同烘焙时追加组合守卫（tinted 别名映射）", () => {
        const css = generateStaticThemeCss({ themeColor: "blue", dark: true, colorized: true });
        expect(css).toContain(
            ":root:not([dark]):not([data-dark]):not([data-light]):not([colorized]):not([data-colorized]):not([data-uncolored])",
        );
    });

    test("规模维度烘焙：单属性守卫 + 档位表值；medium 不追加", () => {
        const css = generateStaticThemeCss({ themeColor: "blue", size: "large", radius: "small" });
        const guard = css.slice(css.indexOf("baked defaults"));
        expect(guard).toContain(":root:not([data-size])");
        expect(guard).toContain("--auto-font-size:var(--x-font-size-large)");
        expect(guard).toContain(":root:not([data-radius])");
        expect(guard).toContain("--auto-border-radius:var(--x-border-radius-small)!");
        // spacing/shadow 未指定（medium）→ 无对应守卫
        expect(guard).not.toContain(":not([data-spacing])");
        expect(guard).not.toContain(":not([data-shadow])");
        // 全部显式 medium → 零守卫
        expect(
            generateStaticThemeCss({ themeColor: "blue", size: "medium", spacing: "medium" }),
        ).not.toContain("baked defaults");
    });

    test("烘焙包保持同源：指纹 + 同参 scope.toStyles() 逐字前缀，守卫块追加在末尾", () => {
        const css = generateStaticThemeCss({ themeColor: "blue", dark: true, size: "large" });
        const live = new AutoSparkThemeScope({
            id: "root",
            cssSelector: [":host", ":root"],
            autoConnect: false,
            autoAttach: false,
            persistence: false,
            dark: true,
            size: "large",
        });
        const rule = staticFingerprintRule({
            themeColor: live.options.themeColor,
            seedLightnessGap: live.options.seedLightnessGap,
            chromaBoostCap: live.options.chromaBoostCap,
            primary: live.options.primary,
            success: live.options.success,
            warning: live.options.warning,
            danger: live.options.danger,
            info: live.options.info,
            dark: live.options.dark,
            colorized: live.options.colorized,
            size: live.options.size,
            spacing: live.options.spacing,
            shadow: live.options.shadow,
            radius: live.options.radius,
        });
        expect(css.startsWith(`${rule}${live.toStyles()}`)).toBe(true);
        expect(css.indexOf("baked defaults")).toBeGreaterThan(css.indexOf("Semantic Colors"));
    });
});

/**
 * download() 产物决策（ADR-0006）：root 作用域出合规静态包——经
 * assembleStaticThemeCss 与 CLI generate-theme 同参产物逐字节一致；非 root
 * 作用域出 toStyles() 快照并 warn（静态层契约只服务 root）。
 */
describe("download 产物决策（ADR-0006）", () => {
    test("root 作用域与 CLI 同参产物逐字节一致（含维度烘焙）", () => {
        const root = new AutoSparkThemeScope({
            id: "root",
            cssSelector: [":host", ":root"],
            autoConnect: false,
            autoAttach: false,
            persistence: false,
            dark: true,
            size: "large",
        });
        const css = (root as any)._resolveDownloadCss();
        expect(css).toBe(generateStaticThemeCss({ themeColor: "blue", dark: true, size: "large" }));
        expect(css.startsWith(`:host,:root{${STATIC_FINGERPRINT_VAR}:`)).toBe(true);
    });

    test("root 默认参数产物 = 默认 CLI 包（维度全缺省、零守卫）", () => {
        const root = new AutoSparkThemeScope({
            id: "root",
            cssSelector: [":host", ":root"],
            autoConnect: false,
            autoAttach: false,
            persistence: false,
        });
        expect((root as any)._resolveDownloadCss()).toBe(
            generateStaticThemeCss({ themeColor: "blue" }),
        );
    });

    test("非 root 作用域出 toStyles() 快照（无指纹头）并 warn 一次", () => {
        const scope = new AutoSparkThemeScope({
            id: "scopeX",
            autoConnect: false,
            autoAttach: false,
        });
        const warns: string[] = [];
        const original = console.warn;
        console.warn = (message: unknown) => {
            warns.push(String(message));
        };
        try {
            const css = (scope as any)._resolveDownloadCss();
            expect(css).toBe(scope.toStyles());
            expect(css).not.toContain(STATIC_FINGERPRINT_VAR);
            expect(warns.length).toBe(1);
            expect(warns[0]).toContain("scopeX");
        } finally {
            console.warn = original;
        }
    });
});

describe("blue golden 快照", () => {
    test("默认 blue 产物与入库快照逐字符一致（变量输出漂移即红，须同步 bump STATIC_SCHEMA）", () => {
        const golden = readFileSync(
            join(import.meta.dir, "__snapshots__", "static-theme-blue.css"),
            "utf8",
        );
        expect(generateStaticThemeCss({ themeColor: "blue" })).toBe(golden);
    });
});
