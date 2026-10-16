import { gzip } from "zlib";
import { promisify } from "node:util";
import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";
import path from "node:path";
import fs from "node:fs";

const gzipPromise = promisify(gzip);

// 双配置：ESM 交由消费方打包器自行管理 NODE_ENV（保留 dev 分支可摇树），
// IIFE 浏览器产物无模块加载器，需在构建期固化 process.env.NODE_ENV（打包进来的
// history 库含 process.env.NODE_ENV 引用，缺 define 会在浏览器顶层抛
// ReferenceError: process is not defined）
export default defineConfig([
    {
        entry: ["src/index.ts"],
        format: ["esm"],
        // dts 暂时禁用（同 engine：rollup-plugin-dts 与 TypeScript 7 不兼容，tsup#1405）
        dts: false,
        splitting: true,
        sourcemap: true,
        clean: true,
        treeshake: true,
        minify: true,
        // 自包含策略：全部运行时依赖打包进产物（engine ADR-0030 同裁决）；
        // autospark 在 devDependencies（运行时经 window.AutoSparkSpaces 探测），天然不进产物
        noExternal: ["asyncsignal", "es-toolkit", "flex-tools", "history", "mitt", "ts-mixer"],
    },
    {
        entry: ["src/index.ts"],
        format: ["iife"],
        dts: false,
        sourcemap: true,
        treeshake: true,
        minify: true,
        // IIFE 全局变量名：window.AutoSparkRouter
        // 使用契约（ADR-0011 插件自举）：先加载 autospark.js 再加载 autospark.router.js 即完成
        // 注册；路由挂载由 engine 构造 options 声明（routes / autoDiscoverRoutes）触发
        globalName: "AutoSparkRouter",
        define: {
            "process.env.NODE_ENV": '"production"',
        },
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
                path.resolve("../../docs/public/autospark.router.js"),
            );
        },
    },
]);
