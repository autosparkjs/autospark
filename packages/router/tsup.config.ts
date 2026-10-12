import { gzip } from "zlib";
import { promisify } from "node:util";
import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";
import path from "node:path";
import fs from "node:fs";

const gzipPromise = promisify(gzip);

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm", "iife"],
    // dts 暂时禁用（同 engine：rollup-plugin-dts 与 TypeScript 7 不兼容，tsup#1405）
    dts: false,
    splitting: true,
    sourcemap: true,
    // IIFE 全局变量名：window.AutoSparkRouter
    // 使用契约：HTML 先加载 AutoSpark.js（全局 AutoSparkSpaces），再加载 autospark-router.js（ADR-0002）
    globalName: "AutoSparkRouter",
    clean: true,
    treeshake: true,
    minify: true,
    // 自包含策略：全部运行时依赖打包进产物（IIFE 场景无模块加载器，engine ADR-0030 同裁决）；
    // autospark 在 devDependencies（运行时经 window.AutoSparkSpaces 探测），天然不进产物
    noExternal: ["asyncsignal", "es-toolkit", "flex-tools", "history", "mitt", "ts-mixer"],
    onSuccess: async () => {
        const esmFile = readFileSync("dist/index.js");
        const iifeFile = readFileSync("dist/index.global.js");
        const esmCompressed = await gzipPromise(esmFile);
        const iifeCompressed = await gzipPromise(iifeFile);
        console.log(`\x1b[33mGzipped size: \x1b[0m`);
        console.log(`  - esm: \x1b[32m${(esmCompressed.length / 1024).toFixed(2)} kB\x1b[0m`);
        console.log(`  - iife: \x1b[32m${(iifeCompressed.length / 1024).toFixed(2)} kB\x1b[0m`);
        // 复制 IIFE 产物到文档站点公共资源，供 <demo html> 引入（与 engine 的 autospark.js 同模式）
        fs.copyFileSync(
            path.resolve("./dist/index.global.js"),
            path.resolve("../../docs/public/autospark-router.js"),
        );
    },
});
