import { gzip } from "zlib";
import { promisify } from "node:util";
import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";
import path from "node:path";
import fs from "node:fs";

const gzipPromise = promisify(gzip);

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm", "cjs", "iife"],
    // dts 暂时禁用：rollup-plugin-dts@6.1.1 与 TypeScript 7.0.2 不兼容（tsup#1405）
    // 待 tsup 发布修复版本后恢复；类型声明可单独用 tsc --emitDeclarationOnly 生成
    dts: false,
    splitting: true,
    sourcemap: true,
    // IIFE 全局变量名
    // 暴露：window.AutoSparkSpaces.AutoSpark，及 autostore 全量转导出成员（如 AutoSparkSpaces.AutoStore）
    globalName: "AutoSparkSpaces",
    clean: true,
    treeshake: true,
    minify: true,
    // 自包含策略：将 autostore(core) 打包进产物，
    // 使文档站点 demo 仅需引入一个 autospark.js 即可运行（与 autoform.js 自包含策略一致）；
    // 入口全量转导出 autostore，故 IIFE 全局下 AutoSparkSpaces.* 亦覆盖 AutoStore 完整 API（ADR-0030）。
    noExternal: ["autostore","flex-tools"],
    onSuccess: async () => {
        const cjsFile = readFileSync("dist/index.cjs");
        const esmFile = readFileSync("dist/index.js");
        const iifeFile = readFileSync("dist/index.global.js");
        const cjsCompressed = await gzipPromise(cjsFile);
        const esmCompressed = await gzipPromise(esmFile);
        const iifeCompressed = await gzipPromise(iifeFile);
        console.log(`\x1b[33mGzipped size: \x1b[0m`);
        console.log(`  - cjs: \x1b[32m${(cjsCompressed.length / 1024).toFixed(2)} kB\x1b[0m`);
        console.log(`  - esm: \x1b[32m${(esmCompressed.length / 1024).toFixed(2)} kB\x1b[0m`);
        console.log(`  - iife: \x1b[32m${(iifeCompressed.length / 1024).toFixed(2)} kB\x1b[0m`);
        // 复制 IIFE 产物到文档站点公共资源，供 <demo html> 引入
        fs.copyFileSync(
            path.resolve("./dist/index.global.js"),
            path.resolve("../../docs/public/autospark.js"),
        );
    },
});
