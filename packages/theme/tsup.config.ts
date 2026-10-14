import { defineConfig } from "tsup";
import fs from "node:fs";
import path from "node:path";
//@ts-expect-error
import copy from "esbuild-copy-files-plugin";
export default defineConfig([
    {
        entry: ["src/index.ts"],
        outDir: "dist",
        format: ["esm", "iife"],
        splitting: false,
        // dts 暂时禁用：rollup-plugin-dts 与 TypeScript 7 不兼容（与 engine 同因，tsup#1405）
        // 类型声明可由 `tsc --emitDeclarationOnly`（tsconfig 已配置）单独生成
        dts: false,
        sourcemap: true,
        clean: true,
        platform: "browser",
        target: "es2020",
        noExternal: [],
        esbuildPlugins: [
            copy({
                source: ["./src/themes"],
                target: "./dist",
                copyWithFolder: true,
            }),
        ],
        onSuccess: async () => {
            // IIFE 产物复制到文档站点公共资源，供 <demo html="theme/*.html"> 引入
            // （与 engine 的 autospark.js 同款策略：文档 demo 只需引一个脚本即可运行）
            fs.copyFileSync(
                path.resolve("./dist/index.global.js"),
                path.resolve("../../docs/public/autospark-theme.js"),
            );
        },
    },
]);
