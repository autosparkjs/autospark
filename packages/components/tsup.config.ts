import { defineConfig } from "tsup";
import { rawAssetsPlugin } from "./scripts/esbuild-raw-assets";

/**
 * 库构建（demo 开发服务器走 vite，见 vite.config.ts；两者产物目录分离避免冲突）。
 *
 * 纯资产包：入口只是 `?raw` 模板聚合表，产物为自包含字符串表——运行时零依赖
 * `autospark`，消费方将表喂给任意引擎实例的 `options.components` 即可。
 */
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs", "iife"],
  // rollup-plugin-dts 与 TS 7.0.2 不兼容（tsup#1405，同 engine 处置）
  dts: false,
  sourcemap: true,
  treeshake: true,
  // IIFE 全局变量：window.AutoSparkComponents.AUTOSPARK_COMPONENTS
  globalName: "AutoSparkComponents",
  // ?raw 静态资产导入（esbuild 不识别 query 后缀，见 scripts/esbuild-raw-assets.ts）
  esbuildPlugins: [rawAssetsPlugin],
});
