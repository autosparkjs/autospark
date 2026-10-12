/**
 * esbuild `?raw` 静态资源插件（ADR-0091，自 packages/engine/scripts 同名文件复制）：
 * `*.html?raw` / `*.css?raw` 导入解析为 default 导出的字符串（对齐 Vite `?raw` 语义）。
 *
 * 背景：组件模板为独立 .html 文件（IDE 语法高亮 / 格式化）。`?raw` 导入在 Bun 运行时
 * 与 Vite 原生支持；esbuild 不识别 query 后缀，需本插件补齐——本包 tsup（三格式产物
 * 构建）经此保证与 demo 开发链（vite）行为一致。
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Plugin } from "esbuild";

const RAW_SUFFIX_RE = /\.(html|css)\?raw$/;

export const rawAssetsPlugin: Plugin = {
  name: "autospark-components-raw-assets",
  setup(build) {
    // 截获带 `?raw` 后缀的导入符：剥后缀换算真实文件路径、转入专用命名空间
    // （esbuild 内建解析不认识 query，不截获会以「找不到文件」失败）
    build.onResolve({ filter: RAW_SUFFIX_RE }, (args) => ({
      path: path.resolve(path.dirname(args.importer), args.path.replace(/\?raw$/, "")),
      namespace: "raw-assets",
    }));
    // 命名空间内按真实路径读文件，text loader 内联为字符串。
    // watchFiles 必须显式登记：watch 模式（tsup --watch）只跟踪 esbuild 自身解析管线里
    // 的文件，插件 onLoad 内联的 .html/.css 模板不在其列——不登记则模板改动不触发重建
    build.onLoad({ filter: /\.(html|css)$/, namespace: "raw-assets" }, async (args) => ({
      contents: await readFile(args.path, "utf8"),
      loader: "text",
      watchFiles: [args.path],
    }));
  },
};
