import { gzip } from "zlib";
import { promisify } from "node:util";
import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";
import path from "node:path";
import fs from "node:fs";
// ?raw 静态资源导入（内置组件模板 .html/.css，ADR-0091）——esbuild 不识别 query 后缀，插件补齐
import { rawAssetsPlugin } from "./scripts/esbuild-raw-assets";

const gzipPromise = promisify(gzip);

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm", "cjs", "iife"],
    // dts 暂时禁用：rollup-plugin-dts@6.1.1 与 TypeScript 7.0.2 不兼容（tsup#1405）
    // 待 tsup 发布修复版本后恢复；类型声明可单独用 tsc --emitDeclarationOnly 生成
    dts: false,
    splitting: true,
    sourcemap: true,
    // IIFE 全局变量名：临时命名空间（不进公共面）——onSuccess 后处理重排为正式形态
    // （ADR-0111 决策 1）：window.AutoSpark = AutoSpark 类本身（类与命名空间一体，jQuery $
    // 同构），库的全量转导出成员（AutoStore 等）挂为类静态，AutoSpark.AutoSpark 自引用；
    // window.AutoSparkSpaces 保留为指向同一对象的兼容别名（旧消费面零迁移）
    globalName: "__AUTOSPARK_NS__",
    clean: true,
    treeshake: true,
    minify: true,
    // 自包含策略：将 autostore(core) 打包进产物，
    // 使文档站点 demo 仅需引入一个 autospark.js 即可运行（与 autoform.js 自包含策略一致）；
    // 入口全量转导出 autostore，故 IIFE 全局下 AutoSparkSpaces.* 亦覆盖 AutoStore 完整 API（ADR-0030）。
    noExternal: ["autostore","flex-tools","@floating-ui/dom"],
    esbuildPlugins: [rawAssetsPlugin],
    onSuccess: async () => {
        // IIFE 全局重排（ADR-0111 决策 1）：tsup 的 footer 选项对 iife 产物不生效（实测），
        // 改在此处直接拼接后处理——类提为主全局对象，命名空间成员挂为类静态，兼容别名归位。
        // sourcemap 注释先行剥除再回接，保证映射指向不失效。
        const iifePath = path.resolve("./dist/index.global.js");
        const rawIife = readFileSync(iifePath, "utf-8");
        const mapSuffix = "//# sourceMappingURL=index.global.js.map";
        const body = rawIife.endsWith(mapSuffix + "\n")
            ? rawIife.slice(0, -1 * (mapSuffix.length + 1))
            : rawIife.replace(mapSuffix, "");
        const reshaped =
            body +
            `
;(function () {
    var ns = __AUTOSPARK_NS__;
    var C = ns.AutoSpark;
    for (var k in ns) {
        if (k !== "AutoSpark" && k !== "default" && !(k in C)) C[k] = ns[k];
    }
    C.AutoSpark = C;
    window.AutoSpark = C;
    window.AutoSparkSpaces = C;
})();
` +
            mapSuffix +
            "\n";
        fs.writeFileSync(iifePath, reshaped);
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
