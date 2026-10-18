/**
 * 静态主题包生成 CLI（ADR-0004 / ADR-0005，纯计算无浏览器依赖，bun 直跑）。
 *
 * 用法：
 *   bun scripts/generate-theme.ts blue                        # 预设 → dist/blue.css
 *   bun scripts/generate-theme.ts --theme-color blue --dark   # 维度烘焙（ADR-0005）
 *   bun scripts/generate-theme.ts '#3b82f6' -o dist/brand.css # 自定义 hex（必须 -o）
 *   bun scripts/generate-theme.ts --all                       # 构建期批量：src/themes.json 全部条目
 *
 * 主题色：--theme-color <色> 与位置参数恰居其一（同现报冲突）。
 *
 * 维度烘焙（可选，ADR-0005；--all 时忽略，由 themes.json 条目自行声明）：
 *   --dark / --colorized              布尔旗（出现即 true）
 *   --size/--spacing/--shadow/--radius <档>   档位枚举，校验对应变量表键
 *
 * 颜色覆盖（语义见 ThemeOptions）：
 *   --gap <number>      seedLightnessGap（默认 1.7）
 *   --cap <number>      chromaBoostCap（默认 1.25）
 *   --primary <color>   语义色种子（success/warning/danger/info 同）
 *
 * --all 是 themes.json 的纯函数：条目 schema 为 { color, title?, 维度与颜色覆盖
 * 同上单包标志的字段名 }（color 映射 themeColor，可引用预设名），key 即产物名
 * （dist/<key>.css）；未知字段/非法档位报错。
 *
 * 与运行时同源（generateStaticTheme → 非 connect 的 root ThemeScope.toStyles），
 * 产物经 package.json 的 "./themes/*.css" → "./dist/*.css" 导出消费：
 *   import "@autospark/theme/themes/blue.css";
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { presetThemes } from "../src/presets";
import { radiusVars, shadowVars, sizeVars, spacingVars } from "../src/vars";
import {
    generateStaticThemeCss,
    type GenerateStaticThemeOptions,
} from "../src/utils/generateStaticTheme";
import { isValidThemeColor, STATIC_FINGERPRINT_VAR } from "../src/utils/staticFingerprint";

type CliOptions = GenerateStaticThemeOptions;

const VALUE_FLAGS: Record<string, keyof CliOptions> = {
    "--theme-color": "themeColor",
    "--gap": "seedLightnessGap",
    "--cap": "chromaBoostCap",
    "--primary": "primary",
    "--success": "success",
    "--warning": "warning",
    "--danger": "danger",
    "--info": "info",
};

const BOOL_FLAGS: Record<string, keyof CliOptions> = {
    "--dark": "dark",
    "--colorized": "colorized",
};

/** 档位标志 → 校验表（变量表键即合法档位集合，size 无 none 档天然排除） */
const SIZE_FLAG_TABLES: Record<string, Record<string, unknown>> = {
    "--size": sizeVars,
    "--spacing": spacingVars,
    "--shadow": shadowVars,
    "--radius": radiusVars,
};
const SIZE_FLAG_FIELDS: Record<string, keyof CliOptions> = {
    "--size": "size",
    "--spacing": "spacing",
    "--shadow": "shadow",
    "--radius": "radius",
};

const NUMBER_FIELDS = new Set<keyof CliOptions>(["seedLightnessGap", "chromaBoostCap"]);

function fail(message: string): never {
    console.error(`generate-theme: ${message}`);
    process.exit(1);
}

function parseArgs(argv: string[]) {
    const positional: string[] = [];
    const flags: CliOptions = {};
    let out: string | undefined;
    let all = false;
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === "--all") {
            all = true;
        } else if (arg === "-o" || arg === "--out") {
            out = argv[++i];
            if (!out) fail(`${arg} 需要一个输出路径参数`);
        } else if (arg in BOOL_FLAGS) {
            (flags[BOOL_FLAGS[arg]] as boolean) = true;
        } else if (arg in SIZE_FLAG_TABLES) {
            const raw = argv[++i];
            if (raw === undefined) fail(`${arg} 需要一个档位值`);
            const table = SIZE_FLAG_TABLES[arg];
            if (!(raw in table)) {
                fail(`${arg} 非法档位：${raw}（可选：${Object.keys(table).join("/")}）`);
            }
            (flags[SIZE_FLAG_FIELDS[arg]] as string) = raw;
        } else if (arg in VALUE_FLAGS) {
            const raw = argv[++i];
            if (raw === undefined) fail(`${arg} 需要一个值`);
            const field = VALUE_FLAGS[arg];
            if (NUMBER_FIELDS.has(field)) {
                const n = Number(raw);
                if (!Number.isFinite(n)) fail(`${arg} 必须是数字，收到：${raw}`);
                (flags[field] as number) = n;
            } else {
                (flags[field] as string) = raw;
            }
        } else if (arg.startsWith("--")) {
            fail(`未知参数：${arg}`);
        } else {
            positional.push(arg);
        }
    }
    return { positional, flags, out, all };
}

const packageRoot = resolve(import.meta.dir, "..");
const distDir = resolve(packageRoot, "dist");

/** -o 路径相对包根解析（绝对路径原样使用）；缺省落 dist/<fallback> */
function resolveTarget(out: string | undefined, fallback: string): string {
    return out ? resolve(packageRoot, out) : resolve(distDir, fallback);
}

function writeThemeFile(target: string, options: GenerateStaticThemeOptions) {
    if (!isValidThemeColor(options.themeColor)) {
        fail(`无法识别的主题色（预设名或 #hex）：${options.themeColor}`);
    }
    const css = generateStaticThemeCss(options);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, css, "utf8");
    // 指纹直接取产物首行（与文件内容同源，不用入参另拼，避免默认值漂移）
    const fingerprint = css.split("\n", 1)[0].match(`${STATIC_FINGERPRINT_VAR}:(.+?);}`)?.[1];
    console.log(
        `✓ ${relative(packageRoot, target)}  ${(css.length / 1024).toFixed(1)} KiB  指纹 ${fingerprint ?? ""}`,
    );
}

/* ------------------------------- --all：themes.json 清单 ------------------------------- */

/** 条目允许的全部字段（未知字段报错，防止清单笔误静默产出错误包） */
const MANIFEST_FIELDS = new Set([
    "color",
    "title",
    "dark",
    "colorized",
    "size",
    "spacing",
    "shadow",
    "radius",
    "seedLightnessGap",
    "chromaBoostCap",
    "primary",
    "success",
    "warning",
    "danger",
    "info",
]);
const MANIFEST_SIZE_FIELDS = ["size", "spacing", "shadow", "radius"] as const;
const MANIFEST_SIZE_TABLES: Record<(typeof MANIFEST_SIZE_FIELDS)[number], Record<string, unknown>> = {
    size: sizeVars,
    spacing: spacingVars,
    shadow: shadowVars,
    radius: radiusVars,
};

function loadManifest(): Record<string, Record<string, unknown>> {
    const file = resolve(packageRoot, "src/themes.json");
    let parsed: unknown;
    try {
        parsed = JSON.parse(readFileSync(file, "utf8"));
    } catch (e) {
        fail(`读取 src/themes.json 失败：${(e as Error).message}`);
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        fail("src/themes.json 必须是 { 产物名: 条目 } 的对象");
    }
    return parsed as Record<string, Record<string, unknown>>;
}

/** 条目 → 生成参数（color 映射 themeColor；维度/类型逐项校验） */
function entryToOptions(key: string, entry: Record<string, unknown>): GenerateStaticThemeOptions {
    if (!entry || typeof entry !== "object") fail(`themes.json 条目 ${key} 必须是对象`);
    for (const field of Object.keys(entry)) {
        if (!MANIFEST_FIELDS.has(field)) fail(`themes.json 条目 ${key} 含未知字段：${field}`);
    }
    if (typeof entry.color !== "string" || !entry.color) {
        fail(`themes.json 条目 ${key} 缺少 color（预设名或 #hex）`);
    }
    const options: GenerateStaticThemeOptions = { themeColor: entry.color };
    for (const boolField of ["dark", "colorized"] as const) {
        if (entry[boolField] !== undefined) {
            if (typeof entry[boolField] !== "boolean") {
                fail(`themes.json 条目 ${key}.${boolField} 必须是布尔值`);
            }
            options[boolField] = entry[boolField] as boolean;
        }
    }
    for (const sizeField of MANIFEST_SIZE_FIELDS) {
        if (entry[sizeField] !== undefined) {
            const table = MANIFEST_SIZE_TABLES[sizeField];
            if (typeof entry[sizeField] !== "string" || !((entry[sizeField] as string) in table)) {
                fail(
                    `themes.json 条目 ${key}.${sizeField} 非法档位：${String(entry[sizeField])}（可选：${Object.keys(table).join("/")}）`,
                );
            }
            (options[sizeField] as string) = entry[sizeField] as string;
        }
    }
    for (const numField of ["seedLightnessGap", "chromaBoostCap"] as const) {
        if (entry[numField] !== undefined) {
            if (typeof entry[numField] !== "number") {
                fail(`themes.json 条目 ${key}.${numField} 必须是数字`);
            }
            options[numField] = entry[numField] as number;
        }
    }
    for (const seedField of ["primary", "success", "warning", "danger", "info"] as const) {
        if (entry[seedField] !== undefined) {
            if (typeof entry[seedField] !== "string") {
                fail(`themes.json 条目 ${key}.${seedField} 必须是字符串`);
            }
            options[seedField] = entry[seedField] as string;
        }
    }
    return options;
}

const { positional, flags, out, all } = parseArgs(Bun.argv.slice(2));

if (all) {
    if (out) fail("--all 不接受 -o（产物名由 themes.json 的 key 决定）");
    // 单包标志（含 --theme-color/位置参数/维度与颜色覆盖）在 --all 下静默忽略：
    // 批量产物是 themes.json 的纯函数，同一清单任何时候产出同样产物（ADR-0005）
    const manifest = loadManifest();
    for (const [key, entry] of Object.entries(manifest)) {
        writeThemeFile(resolve(distDir, `${key}.css`), entryToOptions(key, entry));
    }
    console.log(`\n共生成 ${Object.keys(manifest).length} 个静态主题包 → dist/`);
} else {
    const color = flags.themeColor ?? positional[0];
    if (flags.themeColor && positional[0]) {
        fail("--theme-color 与位置参数恰居其一（同现冲突）");
    }
    if (!color) fail("缺少主题色参数（--theme-color 或位置参数），或使用 --all");
    if (color in presetThemes) {
        writeThemeFile(resolveTarget(out, `${color}.css`), { ...flags, themeColor: color });
    } else {
        if (!out) fail("自定义主题色必须用 -o <path> 显式指定输出文件");
        writeThemeFile(resolveTarget(out, ""), { ...flags, themeColor: color });
    }
}
