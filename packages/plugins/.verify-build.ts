// 临时验证脚本：现场构建三件 IIFE 产物（不动仓库 dist，输出到 node_modules/.cache）
import { build } from "vite";
import { resolve } from "path";
import { buildAutoSparkPlugin } from "@autospark/utils/vite";

const pkgRoot = import.meta.dirname;
const outDir = resolve(pkgRoot, "node_modules/.cache/p1-verify");
const entries = [
    "src/components/form/input-number/index.ts",
    "src/components/form/slider/index.ts",
    "src/components/form/rate/index.ts",
];
for (const entry of entries) {
    const name = entry.split("/").at(-2)!;
    await build({
        configFile: false,
        root: pkgRoot,
        logLevel: "warn",
        plugins: [buildAutoSparkPlugin()],
        build: {
            outDir,
            emptyOutDir: false,
            sourcemap: false,
            minify: true,
            rollupOptions: {
                input: { [name]: resolve(pkgRoot, entry) },
                output: { entryFileNames: "[name].js" },
            },
        },
    });
    console.log("built:", name);
}
