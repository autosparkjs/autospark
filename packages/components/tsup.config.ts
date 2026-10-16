import { gzip } from "node:zlib";
import { promisify } from "node:util";
import { readFileSync, copyFileSync } from "node:fs";
import { defineConfig } from "tsup";
import path from "node:path";
import type { Plugin as EsbuildPlugin } from "esbuild";
// ?raw 静态资产导入（esbuild 不识别 query 后缀，见 scripts/esbuild-raw-assets.ts）
import { rawAssetsPlugin } from "./scripts/esbuild-raw-assets";

const gzipPromise = promisify(gzip);

/**
 * 桥接 stub（ADR-0001 决策 4，配置 C 专用）：IIFE 产物中 "autospark" 导入的取值通道。
 *
 * 背景：IIFE 无模块加载器——`external: ["autospark"]` 会编译为 `__require("autospark")`
 * 浏览器必炸；把 engine 打进插件产物则双 engine 实例，更不可取。方案：esbuild 插件把
 * "autospark" 别名到虚拟 CJS stub——逐名 `Object.defineProperty` 挂 **getter**（求值延迟到
 * 使用点，晚加载安全：插件 script 先于 autospark.js 加载也不炸），运行时从
 * `globalThis.AutoSpark` 取值——engine IIFE onSuccess（ADR-0111 决策 1）把全量导出挂为
 * 类静态，下表各名均可取到（shallow/markRaw 来自 autostore 全量转导出）。
 *
 * 细节：不能用 Proxy——esbuild `__toESM` 的 `__getOwnPropNames` 走
 * `Object.getOwnPropertyNames`，Proxy 未实现 ownKeys 陷阱时丢属性；逐名 defineProperty
 * （`enumerable: true`）保证 own props 真实存在、getter 描述符经 `__copyProps` 保真复制。
 * 名单须覆盖插件源码对 "autospark" 的全部**值导入**（类型导入编译期剥除，ComponentInstance
 * 兜底收录——部分导入未加 `type` 修饰）。
 */
const AUTOSPARK_BRIDGE_NAMES = [
    "ComponentInstance",
    "shallow",
    "markRaw",
    "getOverlayContainer",
    "SCOPES_KEY",
];

const autosparkBridgePlugin: EsbuildPlugin = {
    name: "autospark-bridge",
    setup(build) {
        build.onResolve({ filter: /^autospark$/ }, () => ({
            path: "autospark-bridge-stub",
            namespace: "autospark-bridge",
        }));
        build.onLoad({ filter: /.*/, namespace: "autospark-bridge" }, () => ({
            loader: "js",
            contents: [
                "module.exports = {};",
                ...AUTOSPARK_BRIDGE_NAMES.map(
                    (name) =>
                        `Object.defineProperty(module.exports, ${JSON.stringify(name)}, { enumerable: true, get: function () { var A = globalThis.AutoSpark; return A ? A[${JSON.stringify(name)}] : undefined; } });`,
                ),
            ].join("\n"),
        }));
    },
};

/**
 * 库构建三配置（ADR-0001 决策 2/4；demo 开发服务器走 vite，见 vite.config.ts，产物目录分离）：
 *
 * - 配置 A：资产表（入口只是 `?raw` 模板聚合表，产物为自包含字符串表——运行时零依赖
 *   `autospark`，消费方将表喂给任意引擎实例的 `options.components` 即可）。原单配置不变。
 * - 配置 B：通知插件 ESM+CJS——`autospark` 外置（消费方自带 engine），exports 子路径
 *   `"./plugins/notifications"` 指向本产物。
 * - 配置 C：通知插件 IIFE（script 直引，全局名 `AutoSparkNotifications`）——无 external，
 *   "autospark" 经桥接 stub 走 `window.AutoSpark`；onSuccess 复制 IIFE 到文档站公共资源
 *   （与 autospark.js / autospark.router.js 同模式）。
 */
export default defineConfig([
    {
        entry: ["src/index.ts"],
        format: ["esm", "cjs", "iife"],
        // rollup-plugin-dts 与 TS 7.0.2 不兼容（tsup#1405，同 engine 处置）
        dts: false,
        sourcemap: true,
        treeshake: true,
        // IIFE 全局变量：window.AutoSparkComponents.AUTOSPARK_COMPONENTS
        globalName: "AutoSparkComponents",
        esbuildPlugins: [rawAssetsPlugin],
    },
    {
        entry: ["src/plugins/notifications/index.ts"],
        outDir: "dist/plugins/notifications",
        format: ["esm", "cjs"],
        dts: false,
        sourcemap: true,
        treeshake: true,
        minify: true,
        external: ["autospark"],
        esbuildPlugins: [rawAssetsPlugin],
        onSuccess: async () => {
            // 尺寸打印收在本配置内：三配置并行构建，onSuccess 不得读其他配置的产物（竞态）
            const esmFile = readFileSync("dist/plugins/notifications/index.js");
            const cjsFile = readFileSync("dist/plugins/notifications/index.cjs");
            const esmCompressed = await gzipPromise(esmFile);
            const cjsCompressed = await gzipPromise(cjsFile);
            console.log(`\x1b[33mNotifications plugin Gzipped size: \x1b[0m`);
            console.log(`  - esm: \x1b[32m${(esmCompressed.length / 1024).toFixed(2)} kB\x1b[0m`);
            console.log(`  - cjs: \x1b[32m${(cjsCompressed.length / 1024).toFixed(2)} kB\x1b[0m`);
        },
    },
    {
        entry: ["src/plugins/notifications/index.ts"],
        outDir: "dist/plugins/notifications",
        format: ["iife"],
        dts: false,
        sourcemap: true,
        treeshake: true,
        minify: true,
        globalName: "AutoSparkNotifications",
        esbuildPlugins: [rawAssetsPlugin, autosparkBridgePlugin],
        onSuccess: async () => {
            const iifeFile = readFileSync("dist/plugins/notifications/index.global.js");
            const iifeCompressed = await gzipPromise(iifeFile);
            console.log(`  - iife: \x1b[32m${(iifeCompressed.length / 1024).toFixed(2)} kB\x1b[0m`);
            copyFileSync(
                path.resolve("./dist/plugins/notifications/index.global.js"),
                path.resolve("../../docs/public/autospark.notifications.js"),
            );
        },
    },
]);
