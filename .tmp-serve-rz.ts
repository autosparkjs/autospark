import { serve } from "bun";
serve({
    port: 3955,
    async fetch(req) {
        const url = new URL(req.url);
        let path = decodeURIComponent(url.pathname);
        if (path === "/") path = "/demos/foldable/resize.html";
        if (path.startsWith("/autospark/")) path = "/public/" + path.slice("/autospark/".length);
        const f = Bun.file("E:/Work/Code/autospark/docs" + path);
        if (await f.exists()) return new Response(f);
        return new Response("404", { status: 404 });
    },
});
console.log("serving at http://localhost:3955/");
