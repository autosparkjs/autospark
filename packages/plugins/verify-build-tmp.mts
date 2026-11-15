/**
 * 临时验证脚本（用后即删）：仅为本任务两件产物做闭包构建 + Bun.serve 站点组装，
 * 不触碰 dist/ 与 docs/public（禁改面），产物落在系统临时目录。
 */
import { build } from "vite";
import { buildAutoSparkPlugin } from "@autospark/utils/vite";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { readFileSync, existsSync } from "node:fs";

const pkgRoot = resolve(import.meta.dir);
const outDir = resolve(tmpdir(), "autospark-tree-family-verify");

const artifacts = [
    { entry: "src/components/form/cascader/index.ts", outFile: "autospark.cascader.js" },
    { entry: "src/components/form/tree-select/index.ts", outFile: "autospark.tree-select.js" },
];

for (const a of artifacts) {
    await build({
        configFile: false,
        root: pkgRoot,
        logLevel: "warn",
        plugins: [buildAutoSparkPlugin()],
        build: {
            outDir,
            emptyOutDir: false,
            sourcemap: false,
            minify: false,
            rollupOptions: {
                input: { [a.outFile.replace(/\.js$/, "")]: resolve(pkgRoot, a.entry) },
                output: { entryFileNames: "[name].js" },
            },
        },
    });
    console.log("[verify-build] built:", a.outFile, existsSync(resolve(outDir, a.outFile)));
}

// —— Bun.serve：/autospark/* 资源映射 + demos 静态伺服 ——
const docsPublic = resolve(pkgRoot, "../../docs/public");
const docsDemos = resolve(pkgRoot, "../../docs/demos");

const MIME: Record<string, string> = {
    ".js": "text/javascript",
    ".css": "text/css",
    ".html": "text/html; charset=utf-8",
    ".json": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
};

Bun.serve({
    port: 5199,
    async fetch(req) {
        const url = new URL(req.url);
        let file: string | null = null;
        if (url.pathname.startsWith("/autospark/")) {
            const name = url.pathname.slice("/autospark/".length);
            // 本任务两件产物优先取临时构建目录，其余（engine/overlay/theme）取 docs/public
            const local = resolve(outDir, name);
            const pub = resolve(docsPublic, name);
            file = existsSync(local) ? local : existsSync(pub) ? pub : null;
        } else if (url.pathname.startsWith("/zh/") || url.pathname === "/") {
            return new Response("demos only", { status: 404 });
        } else {
            const rel = url.pathname.replace(/^\//, "");
            const cand = resolve(docsDemos, rel);
            if (cand.startsWith(docsDemos) && existsSync(cand)) file = cand;
        }
        if (!file) return new Response("not found: " + url.pathname, { status: 404 });
        const ext = file.slice(file.lastIndexOf("."));
        return new Response(readFileSync(file), {
            headers: { "Content-Type": MIME[ext] ?? "application/octet-stream" },
        });
    },
});
console.log("[verify-serve] http://localhost:5199/components/form/cascader/basic.html");
console.log("[verify-serve] http://localhost:5199/components/form/tree-select/basic.html");
