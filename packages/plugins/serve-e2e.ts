const docs = "E:/Work/Code/autospark/docs";
Bun.serve({
    port: 5198,
    async fetch(req) {
        const url = new URL(req.url);
        let p = decodeURIComponent(url.pathname);
        let base = docs;
        if (p.startsWith("/autospark/")) { base = docs + "/public"; p = p.slice("/autospark".length); }
        else if (p.startsWith("/src/")) base = "E:/Work/Code/autospark/packages/engine";
        const file = Bun.file(base + p);
        if (await file.exists()) return new Response(file);
        return new Response("Not Found: " + p, { status: 404 });
    },
});
console.log("serving on 5198");
