import path from "path";
import fs from "fs";
import { defineConfig } from "vitepress";
import { vitepressDemoPlugin } from "vitepress-demo-plugin";
import { context } from "esbuild";
// 与 tsup 共享的 ?raw 静态资源插件（内置组件模板 .html/.css，ADR-0091）——
// esbuild watch 直接构建 engine 源码，同样需要 ?raw 解析
import { rawAssetsPlugin } from "../../../packages/engine/scripts/esbuild-raw-assets";

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
      { text: "指南", link: "/zh/engine/" },
      { text: "路由", link: "/zh/engine/" },
      { text: "主题", link: "/zh/theme/" },
      { text: "开源推荐", link: "https://zhangfisher.github.io/repos/" },
    ],
    sidebar: {
      "/zh/engine/": [
        {
          text: "关于",
          link: "/zh/engine/index",
          items: [
            { text: "安装", link: "/zh/engine/intro/install" },
            { text: "名词解释", link: "/zh/engine/intro/glossary" },
            { text: "快速入门", link: "/zh/engine/intro/get-started" },
            { text: "特征和优势", link: "/zh/engine/intro/features" },
            { text: "对比评测", link: "/zh/engine/intro/comparison" },
            { text: "常见问题", link: "/zh/engine/intro/question" },
          ],
        },
        {
          text: "指南",
          items: [
            { text: "初始化", link: "/zh/engine/guide/initial" },
            { text: "状态", link: "/zh/engine/guide/state" },
            { text: "动作", link: "/zh/engine/guide/action" },
            {
              text: "指令",
              link: "/zh/engine/guide/directive/",
              collapsed: true,
              items: [
                { text: "关于", link: "/zh/engine/guide/directive/" },
                { text: "指令配置", link: "/zh/engine/guide/directive/config" },
                { text: "自定义指令", link: "/zh/engine/guide/directive/custom" },
              ],
            },
            {
              text: "组件",
              link: "/zh/engine/guide/component/",
              collapsed: true,
              items: [
                { text: "关于", link: "/zh/engine/guide/component/" },
                { text: "开发组件", link: "/zh/engine/guide/component/develop" },
                { text: "组件继承", link: "/zh/engine/guide/component/inherit" },
                { text: "组件递归", link: "/zh/engine/guide/component/recursive" },
                { text: "实例化组件", link: "/zh/engine/guide/component/instantiate" },
                { text: "查找组件", link: "/zh/engine/guide/component/lookup" },
                { text: "响应式数据", link: "/zh/engine/guide/component/data" },
                { text: "组件间通讯", link: "/zh/engine/guide/component/communication" },
                { text: "生命周期", link: "/zh/engine/guide/component/lifecycle" },
                { text: "样式", link: "/zh/engine/guide/component/styles" },
                { text: "远程组件", link: "/zh/engine/guide/component/remote" },
                { text: "运行时创建", link: "/zh/engine/guide/component/runtime" },
                { text: "配置选项", link: "/zh/engine/guide/component/options" },
                { text: "注意事项", link: "/zh/engine/guide/component/notes" },
                { text: "常见问题", link: "/zh/engine/guide/component/faq" },
              ],
            },
            { text: "覆盖物", link: "/zh/engine/guide/overlays" },
            { text: "动态模板", link: "/zh/engine/guide/patch" },
            { text: "动画", link: "/zh/engine/guide/animate" },
            { text: "工具提示", link: "/zh/engine/guide/tooltip" },
            { text: "视口断点", link: "/zh/engine/guide/viewport" },
            {
              text: "通知",
              link: "/zh/engine/guide/notifications/",
              collapsed: true,
              items: [
                { text: "关于", link: "/zh/engine/guide/notifications/" },
                { text: "轻提示", link: "/zh/engine/guide/notifications/toast" },
                { text: "通用确认", link: "/zh/engine/guide/notifications/confirm" },
                { text: "任务", link: "/zh/engine/guide/notifications/task" },
                { text: "事件", link: "/zh/engine/guide/notifications/events" },
                { text: "数据视图", link: "/zh/engine/guide/notifications/data" },
                { text: "自定义", link: "/zh/engine/guide/notifications/custom" },
                { text: "配置参数", link: "/zh/engine/guide/notifications/config" },
              ],
            },            
            { text: "插件", link: "/zh/engine/guide/plugin" },
            { text: "Scope", link: "/zh/engine/guide/scope" }
          ],
        },
        {
          text: "指令参考",
          collapsed: false,
          items: [
            {
              text: "基础",
              collapsed: false,
              items: [
                { text: "x-text", link: "/zh/engine/guide/directives/x-text" },
                { text: "x-html", link: "/zh/engine/guide/directives/x-html" },
                { text: "x-bind", link: "/zh/engine/guide/directives/x-bind" },
                { text: "x-class", link: "/zh/engine/guide/directives/x-class" },
                { text: "x-style", link: "/zh/engine/guide/directives/x-style" },
                { text: "x-on", link: "/zh/engine/guide/directives/x-on" },
                { text: "x-icon", link: "/zh/engine/guide/directives/x-icon" },
              ],
            },
            {
              text: "结构渲染",
              collapsed: true,
              items: [
                { text: "x-if", link: "/zh/engine/guide/directives/x-if" },
                { text: "x-show", link: "/zh/engine/guide/directives/x-show" },
                { text: "x-viewport", link: "/zh/engine/guide/directives/x-viewport" },
                { text: "x-switch", link: "/zh/engine/guide/directives/x-switch" },
                {
                  text: "x-for",
                  link: "/zh/engine/guide/directives/x-for",
                  collapsed: true,
                  items: [
                    { text: "分页", link: "/zh/engine/guide/directives/x-for-paging" },
                    { text: "虚拟列表", link: "/zh/engine/guide/directives/x-for-virtual" },
                  ],
                },
                { text: "x-tree", link: "/zh/engine/guide/directives/x-tree" },
              ],
            },
            {
              text: "状态数据",
              collapsed: true,
              items: [
                { text: "x-data", link: "/zh/engine/guide/directives/x-data" },
                { text: "x-scope", link: "/zh/engine/guide/directives/x-scope" },
                { text: "x-isolate", link: "/zh/engine/guide/directives/x-isolate" },
              ],
            },
            {
              text: "表单",
              collapsed: true,
              items: [
                { text: "x-model", link: "/zh/engine/guide/directives/x-model" },
                { text: "x-form", link: "/zh/engine/guide/directives/x-form" },
                { text: "x-field", link: "/zh/engine/guide/directives/x-field" },
              ],
            },
            {
              text: "布局",
              collapsed: true,
              items: [
                { text: "x-container", link: "/zh/engine/guide/directives/x-container" },
                { text: "x-layout", link: "/zh/engine/guide/directives/x-layout" },
                { text: "x-foldable", link: "/zh/engine/guide/directives/x-foldable" },
                { text: "x-splitter", link: "/zh/engine/guide/directives/x-splitter" },
                { text: "x-expandable", link: "/zh/engine/guide/directives/x-expandable" },
                { text: "x-resizable", link: "/zh/engine/guide/directives/x-resizable" },
              ],
            },
            {
              text: "覆盖物",
              collapsed: true,
              items: [
                { text: "x-dialog", link: "/zh/engine/guide/directives/x-dialog" },
                { text: "x-drawer", link: "/zh/engine/guide/directives/x-drawer" },
                { text: "x-popover", link: "/zh/engine/guide/directives/x-popover" },
                { text: "x-teleport", link: "/zh/engine/guide/directives/x-teleport" },
                { text: "x-loading", link: "/zh/engine/guide/directives/x-loading" },
              ],
            },
            {
              text: "组件",
              collapsed: true,
              items: [
                { text: "x-define", link: "/zh/engine/guide/directives/x-define" },
                { text: "x-component", link: "/zh/engine/guide/directives/x-component" },
                { text: "x-slot", link: "/zh/engine/guide/directives/x-slot" },
                { text: "x-super", link: "/zh/engine/guide/directives/x-super" },
                { text: "x-slots", link: "/zh/engine/guide/directives/x-slots" },
                { text: "x-import", link: "/zh/engine/guide/directives/x-import" },
              ],
            },
          ],
        },
      ],
      "/zh/theme/": [
        {
          text: "关于",
          link: "/zh/theme/index",
          items: [
            { text: "安装", link: "/zh/theme/intro/install" },
            { text: "名词解释", link: "/zh/theme/intro/glossary" },
            { text: "快速入门", link: "/zh/theme/intro/get-started" },
            { text: "特征和优势", link: "/zh/theme/intro/features" },
            { text: "对比评测", link: "/zh/theme/intro/comparison" },
            { text: "常见问题", link: "/zh/theme/intro/question" },
          ],
        },
        {
          text: "指南",
          items: [
            { text: "初始化", link: "/zh/theme/guide/initial" },
            { text: "主题作用域", link: "/zh/theme/guide/scope" },
            { text: "主题色", link: "/zh/theme/guide/color" },
            { text: "语义色", link: "/zh/theme/guide/semantic" },
            { text: "显示模式与色彩", link: "/zh/theme/guide/mode" },
            { text: "尺寸参数", link: "/zh/theme/guide/size" },
            { text: "变量体系", link: "/zh/theme/guide/variables" },
            { text: "组件与工具类", link: "/zh/theme/guide/components" },
            { text: "持久化", link: "/zh/theme/guide/persistence" },
            { text: "静态样式层", link: "/zh/theme/guide/static" },
            { text: "API 参考", link: "/zh/theme/guide/api" },
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
    config(md: any) {
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
            entryPoints: [path.resolve(__dirname, "../../../packages/engine/src/index.ts")],
            bundle: true,
            format: "iife",
            // 临时命名空间（不进公共面）——footer 重排与 tsup onSuccess 同款（ADR-0111 决策 1）：
            // window.AutoSpark = 类本身，成员挂类静态，AutoSparkSpaces 兼容别名
            globalName: "__AUTOSPARK_NS__",
            footer: {
              js: [
                ";(function () {",
                "    var ns = __AUTOSPARK_NS__;",
                "    var C = ns.AutoSpark;",
                "    for (var k in ns) {",
                '        if (k !== "AutoSpark" && k !== "default" && !(k in C)) C[k] = ns[k];',
                "    }",
                "    C.AutoSpark = C;",
                "    window.AutoSpark = C;",
                "    window.AutoSparkSpaces = C;",
                "})();",
              ].join("\n"),
            },
            target: "es2022",
            sourcemap: "inline",
            write: false,
            plugins: [
              rawAssetsPlugin,
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
            if (req.url?.split("?")[0] !== "/autospark/autospark.js") return next();
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
