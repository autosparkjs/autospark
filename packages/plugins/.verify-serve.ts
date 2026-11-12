// 临时验证服务器：demo 目录 + 现场产物 + docs/public 产物映射（端口 8791）
const demoDir = "E:/Work/Code/autospark/packages/plugins/demo";
const cacheDir = "E:/Work/Code/autospark/packages/plugins/node_modules/.cache/p1-verify";
const pubDir = "E:/Work/Code/autospark/docs/public";
const map: Record<string, string> = {
    "/autospark.js": "E:/Work/Code/autospark/docs/public/autospark.js",
    "/autospark.input-number.js": `${cacheDir}/input-number.js`,
    "/autospark.slider.js": `${cacheDir}/slider.js`,
    "/autospark.rate.js": `${cacheDir}/rate.js`,
    "/autospark.input.js": `${pubDir}/autospark.input.js`,
};
Bun.serve({
    port: 8791,
    async fetch(req) {
        const url = new URL(req.url);
        if (map[url.pathname]) return new Response(Bun.file(map[url.pathname]));
        const file = Bun.file(demoDir + url.pathname);
        if (await file.exists()) return new Response(file);
        return new Response("not found", { status: 404 });
    },
});
console.log("serving on 8791");
