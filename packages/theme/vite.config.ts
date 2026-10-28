/**
 * @autospark/theme 构建与示例服务配置（theme ADR-0007 决策 3：构建全 vite，tsup 退役）。
 *
 * 两态分治（沿 plugins 包 command/mode 路由先例）：
 * - `bun run build`（command=build，默认）——包构建：主构建 = ESM lib（src/index.ts →
 *   dist/index.js，npm 库身份保留）；closeBundle 编排 = IIFE 闭包构建（注入
 *   buildAutoSparkPlugin({ shell: "immediate" })——库型插件立即执行外壳，加载即完成
 *   单例创建 → 全局挂载 → installPlugin 自举）→ src/themes 资产复制 → 发布面
 *   （gzip 统计 + docs/public 复制）；CSS 链（lessc / generate-theme）与 d.ts
 *   （tsc --emitDeclarationOnly）保持脚本形态，由 package.json build 串行衔接；
 * - `bun run dev`（command=serve）——示例页开发服务器（examples/index.html）。
 */
import { defineConfig, build as viteBuild, type Plugin, type UserConfig } from "vite";
import { fileURLToPath } from "node:url";
import { resolve } from "path";
import { copyFileSync, cpSync, readFileSync } from "node:fs";
import { gzip } from "node:zlib";
import { promisify } from "node:util";
import { buildAutoSparkPlugin } from "@autospark/utils/vite";

const gzipPromise = promisify(gzip);

const pkgRoot = import.meta.dirname;
const DIST_DIR = resolve(pkgRoot, "dist");
const docsPublicDir = resolve(pkgRoot, "../../docs/public");

/** 闭包产物消费契约文件名（原 autospark-theme.js 退役改名，ADR-0007 后果节） */
const CLOSURE_OUT_FILE = "autospark.theme.js";

/** npm 库 ESM 的外部依赖（dependencies 声明面，消费端自解析；@autospark/utils 同理） */
const LIB_EXTERNAL = [/^@autospark\//, /^@yosulramp\//];

/**
 * 包构建编排（主构建 = ESM lib；closeBundle 收口闭包产物、资产复制与发布面）。
 */
function libOrchestrationPlugin(): Plugin {
    return {
        name: "autospark-theme-orchestration",
        apply: "build",
        closeBundle: async () => {
            // IIFE 闭包构建（immediate 外壳）：入口与 ESM lib 同源（index.ts → plugin.ts
            // 自举面），@autospark/utils 全内联——闭包自包含契约（一产物一次 vite build）
            await viteBuild({
                configFile: false,
                root: pkgRoot,
                logLevel: "silent",
                plugins: [buildAutoSparkPlugin({ shell: "immediate" })],
                build: {
                    outDir: DIST_DIR,
                    emptyOutDir: false, // ESM 主构建产物共存，禁自动清空
                    sourcemap: true,
                    minify: true,
                    rollupOptions: {
                        input: { "autospark.theme": resolve(pkgRoot, "src/index.ts") },
                        output: { entryFileNames: "[name].js" },
                    },
                },
            });
            // src/themes → dist 资产复制（原 tsup esbuild-copy-files-plugin 职责迁入编排）
            cpSync(resolve(pkgRoot, "src/themes"), resolve(DIST_DIR, "themes"), {
                recursive: true,
            });
            // 发布面：gzip 统计 + docs/public 复制（demo 消费契约 = script 直引）
            const file = readFileSync(resolve(DIST_DIR, CLOSURE_OUT_FILE));
            const compressed = await gzipPromise(file);
            console.log(
                `\x1b[33mTheme plugin Gzipped size: \x1b[0m\x1b[32m${(compressed.length / 1024).toFixed(2)} kB\x1b[0m`,
            );
            copyFileSync(resolve(DIST_DIR, CLOSURE_OUT_FILE), resolve(docsPublicDir, CLOSURE_OUT_FILE));
        },
    };
}

export default defineConfig(({ command }): UserConfig => {
    if (command === "serve") {
        // 示例页开发服务器：dev server 直接服务 examples/index.html
        return {
            root: "examples",
            resolve: {
                // 对应 tsconfig.json 的 paths（src/vars 下使用 "@/..." 导入），vite 不会自动读取 tsconfig paths
                alias: {
                    "@": fileURLToPath(new URL("./src", import.meta.url)),
                },
            },
            server: {
                port: 5180,
            },
        };
    }
    // 包构建（默认）：主构建 = ESM lib。root/outDir 显式绝对化——产物恒落
    // packages/theme/dist，与调用 cwd 无关（plugins 包先例）。
    return {
        root: pkgRoot,
        resolve: {
            alias: {
                "@": fileURLToPath(new URL("./src", import.meta.url)),
                "@autospark/utils": fileURLToPath(new URL("../utils/src/index.ts", import.meta.url)),
            },
        },
        plugins: [libOrchestrationPlugin()],
        build: {
            outDir: DIST_DIR,
            emptyOutDir: true, // 清除陈旧形态产物（tsup 时代 index.global.js 等）
            sourcemap: true,
            minify: false, // npm 库形态保持可读
            target: "es2020",
            lib: {
                entry: resolve(pkgRoot, "src/index.ts"),
                formats: ["es"],
                fileName: () => "index.js",
            },
            rollupOptions: {
                external: LIB_EXTERNAL,
            },
        },
    };
});
