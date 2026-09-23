import path from "path";
import fs from "fs";
import { defineConfig } from "vitepress";
import { vitepressDemoPlugin } from "vitepress-demo-plugin";
import { context } from "esbuild";

export default defineConfig({
    base: "/autospark/",
    title: "AutoSpark",
    description: "声明式响应式模板引擎",
    themeConfig: {
        outline: {
            label: "目录",
            level: [2, 5],
        },
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: "首页", link: "/" }, 
            { text: "指南", link: "/zh/" },
            { text: "开源推荐", link: "https://zhangfisher.github.io/repos/" },
        ],
        sidebar: {  
            "/zh/": [
                {
                    text: "关于",
                    link: "/zh/index",
                    items: [
                        { text: "安装", link: "/zh/intro/install" },
                        { text: "名词解释", link: "/zh/intro/glossary" },
                        { text: "快速入门", link: "/zh/intro/get-started" },
                        { text: "特征和优势", link: "/zh/intro/features" },
                        { text: "常见问题", link: "/zh/intro/question" },
                    ],
                },
                {
                    text: "指南",
                    items: [
                        { text: "初始化", link: "/zh/guide/initial" },
                        { text: "状态", link: "/zh/guide/state" },
                        { text: "动作", link: "/zh/guide/action" },
                        { text: "指令类型", link: "/zh/guide/directive" },
                        { text: "指令配置", link: "/zh/guide/config" },
                        { text: "组件", link: "/zh/guide/component" },
                        { text: "覆盖物", link: "/zh/guide/overlays" },
                        { text: "动态模板", link: "/zh/guide/patch" },
                        { text: "动画", link: "/zh/guide/animate" }, 
                        { text: "Scope", link: "/zh/guide/scope" } 
                    ],
                },
                {
                    text: "指令",
                    collapsed:false,
                    items: [
                        { text: "x-bind", link: "/zh/guide/directives/x-bind" },
                        { text: "x-text", link: "/zh/guide/directives/x-text" },
                        { text: "x-html", link: "/zh/guide/directives/x-html" },
                        { text: "x-style", link: "/zh/guide/directives/x-style" },
                        { text: "x-class", link: "/zh/guide/directives/x-class" },
                        { text: "x-data", link: "/zh/guide/directives/x-data" },
                        { text: "x-scope", link: "/zh/guide/directives/x-scope" },
                        { text: "x-if", link: "/zh/guide/directives/x-if" },
                        { text: "x-show", link: "/zh/guide/directives/x-show" },
                        { text: "x-for", link: "/zh/guide/directives/x-for",
                            collapsed:true,
                            items: [
                                { text: "分页", link: "/zh/guide/directives/x-for-paging" },
                                { text: "虚拟列表", link: "/zh/guide/directives/x-for-virtual" },
                            ]
                        },
                        { text: "x-on", link: "/zh/guide/directives/x-on" },
                        { text: "x-loading", link: "/zh/guide/directives/x-loading" },
                        { text: "x-slot", link: "/zh/guide/directives/x-slot" },
                        { text: "x-dialog", link: "/zh/guide/directives/x-dialog" },
                        { text: "x-model", link: "/zh/guide/directives/x-model" },
                        { text: "x-form", link: "/zh/guide/directives/x-form" },
                        { text: "x-icon", link: "/zh/guide/directives/x-icon" },
                        { text: "x-switch", link: "/zh/guide/directives/x-switch" },
                        { text: "x-tree", link: "/zh/guide/directives/x-tree" },
                        { text: "x-define", link: "/zh/guide/directives/x-define" },
                        { text: "x-component", link: "/zh/guide/directives/x-component" },
                        { text: "x-import", link: "/zh/guide/directives/x-import" },
                        { text: "x-teleport", link: "/zh/guide/directives/x-teleport" },
                    ],
                },
            ],
        },
        socialLinks: [{ icon: "github", link: "https://github.com/autosparkjs/autospark/" }],
    },
    vue: {
        template: {
            compilerOptions: {
                whitespace: "preserve",
            },
        },
    },
    markdown: {
        config(md:any) {
            md.use(vitepressDemoPlugin, {
                demoDir: path.resolve(__dirname, "../../demos"),
                stackblitz: {
                    show: true,
                },
                codesandbox: {
                    show: true,
                },
            });
        },  
    }, 
    vite: {
        plugins: [
            {
                name: "autospark-engine-dev-source",
                // 仅开发期生效：demos 经 vitepress-demo-plugin 以 ?raw + srcdoc iframe 内嵌，
                // 不经过 Vite 转换管线，故无法直接 import engine 源码——由本插件接管产物 URL：
                // esbuild watch 监听 packages/engine 源码，变更即增量重建并广播整页刷新，
                // demos（随页面重载的 srcdoc）自动取到新构建，保存即见、无需手动刷新/构建。
                // 生产构建不受影响（apply: "serve"，仍用 tsup 产物 docs/public/autospark.js）。
                apply: "serve",
                configureServer(server: any) {
                    let cached: string | null = null;
                    const ctxPromise = context({
                        entryPoints: [
                            path.resolve(
                                __dirname,
                                "../../../packages/engine/src/index.ts",
                            ),
                        ],
                        bundle: true,
                        format: "iife",
                        globalName: "AutoSparkSpaces",
                        target: "es2022",
                        sourcemap: "inline",
                        write: false,
                        plugins: [
                            {
                                name: "autospark-dev-cache",
                                setup(b: any) {
                                    b.onEnd((result: any) => {
                                        cached = result.outputFiles[0].text;
                                        server.ws.send({ type: "full-reload" });
                                    });
                                },
                            },
                        ],
                    }).then(async (ctx: any) => {
                        await ctx.rebuild(); // 初次构建填充缓存
                        await ctx.watch(); // 此后监听源码增量重建
                        return ctx;
                    });
                    server.middlewares.use((req: any, res: any, next: any) => {
                        if (req.url?.split("?")[0] !== "/autospark/autospark.js")
                            return next();
                        void ctxPromise.then(() => {
                            res.setHeader("Content-Type", "application/javascript");
                            res.end(cached);
                        });
                    });
                },
            },
            {
                name: "autospark-demo-api",
                // 仅开发期生效：VitePress dev 的 SPA fallback 只放行资产类扩展（.css/.js/图片…），
                // public 下 demo 用的 .json 数据文件会被回退到 index.html。本中间件把
                // /autospark/api/* 按文件名（防目录穿越）映射到 public/autospark/api/ 伺服为 JSON。
                // 生产构建不受影响（apply: "serve"；build 后 public 静态拷贝由部署侧正常伺服）。
                apply: "serve",
                configureServer(server: any) {
                    const API_PREFIX = "/autospark/api/";
                    server.middlewares.use((req: any, res: any, next: any) => {
                        const [pathname, query] = (req.url ?? "").split("?");
                        const url = pathname ?? "";
                        if (!url.startsWith(API_PREFIX)) return next();
                        // 仅允许纯文件名（无路径分隔），杜绝目录穿越
                        const name = url.slice(API_PREFIX.length);
                        if (!/^[\w.-]+$/.test(name)) return next();
                        // .html 片段/模板（x-html 异步源 demo）伺服为 text/html，其余按 JSON
                        res.setHeader(
                            "Content-Type",
                            name.endsWith(".html") ? "text/html; charset=utf-8" : "application/json",
                        );
                        // orders.json：程序化分页订单（demo 数据源，支持 page/size/delay/fail）
                        if (name === "orders.json") {
                            const q = new URLSearchParams(query);
                            const page = Math.max(1, Number(q.get("page") ?? 1));
                            const size = Math.min(50, Math.max(1, Number(q.get("size") ?? 10)));
                            const fail = q.get("fail") === "1";
                            const delay = Number(q.get("delay") ?? 0);
                            const send = () => {
                                if (fail) {
                                    res.statusCode = 500;
                                    res.end(JSON.stringify({ message: "模拟服务错误（演示失败态）" }));
                                    return;
                                }
                                const books = [
                                    "响应式状态管理",
                                    "声明式模板引擎",
                                    "细粒度更新",
                                    "前端架构之道",
                                    "类型系统入门",
                                    "状态机实战",
                                ];
                                const statuses = ["已支付", "待支付", "已发货", "已完成"];
                                const total = 86;
                                const items = [];
                                for (let i = 0; i < size; i++) {
                                    const idx = (page - 1) * size + i;
                                    if (idx >= total) break;
                                    const qty = (idx % 4) + 1;
                                    const price = 35 + (idx % 6) * 8;
                                    items.push({
                                        id: "SO-" + String(10000 + idx),
                                        book: books[idx % books.length],
                                        qty,
                                        amount: qty * price,
                                        status: statuses[idx % statuses.length],
                                    });
                                }
                                // 注：不回显 page/size——响应键若与全局状态同名会遮蔽控制键
                                //（聚合视图 data 层优先），导致依赖驱动的重取静默失效
                                res.end(JSON.stringify({ code: 0, data: { total, items } }));
                            };
                            if (delay > 0 && delay <= 5000) setTimeout(send, delay);
                            else send();
                            return;
                        }
                        const file = path.join(__dirname, "../../public/autospark/api", name);
                        if (!fs.existsSync(file)) {
                            // demo 演示失败态：目录内不存在的文件回 404 JSON（否则 SPA fallback 返回 HTML）
                            res.statusCode = 404;
                            res.end(JSON.stringify({ message: `not found: ${name}` }));
                            return;
                        }
                        // ?delay=<ms>：演示加载中状态（上限 5s 防呆）
                        const delay = Number(new URLSearchParams(query).get("delay") ?? 0);
                        const send = () => res.end(fs.readFileSync(file));
                        if (delay > 0 && delay <= 5000) setTimeout(send, delay);
                        else send();
                    });
                },
            },
        ],
        build: {
            chunkSizeWarningLimit: 2000, // 将限制提高到 1000KB
        },
    },
});
