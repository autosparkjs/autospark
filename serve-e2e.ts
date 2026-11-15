// 临时 e2e 验证服务（验证后删除）：/autospark.js → engine IIFE 产物，其余 → engine 包内路径
const root = "E:/Work/Code/autospark/packages/engine";
const pub = "E:/Work/Code/autospark/docs/public";
Bun.serve({
    port: 5198,
    async fetch(req) {
        const url = new URL(req.url);
        let p = decodeURIComponent(url.pathname);
        let base = root;
        if (p === "/autospark.js") {
            base = pub;
            p = "/autospark.js";
        }
        const file = Bun.file(base + p);
        if (await file.exists()) return new Response(file);
        return new Response("Not Found: " + p, { status: 404 });
    },
});
console.log("serving e2e on http://localhost:5198");
