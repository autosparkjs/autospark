/**
 * esbuild `?raw` 静态资源插件（ADR-0091）：`*.html?raw` / `*.css?raw` 导入解析为
 * default 导出的字符串（对齐 Vite `?raw` 语义）。
 *
 * 背景：内置组件模板已从 TS 模板字符串迁移为独立 .html / .css 文件（IDE 语法高亮 /
 * 格式化）。`?raw` 导入在 Bun 运行时（bun test）与 Vite 原生支持；esbuild 不识别 query
 * 后缀，需本插件补齐——tsup（三格式产物构建）与 docs 开发期的 esbuild watch
 * （docs/.vitepress/config/index.ts）共享本插件，保证两条构建链行为一致。
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Plugin } from "esbuild";

const RAW_SUFFIX_RE = /\.(html|css)\?raw$/;

export const rawAssetsPlugin: Plugin = {
    name: "autospark-raw-assets",
    setup(build) {
        // 截获带 `?raw` 后缀的导入符：剥后缀换算真实文件路径、转入专用命名空间
        // （esbuild 内建解析不认识 query，不截获会以「找不到文件」失败）
        build.onResolve({ filter: RAW_SUFFIX_RE }, (args) => ({
            path: path.resolve(path.dirname(args.importer), args.path.replace(/\?raw$/, "")),
            namespace: "raw-assets",
        }));
        // 命名空间内按真实路径读文件，text loader 内联为字符串
        build.onLoad({ filter: /\.(html|css)$/, namespace: "raw-assets" }, async (args) => ({
            contents: await readFile(args.path, "utf8"),
            loader: "text",
        }));
    },
};
