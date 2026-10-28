import path from "path";
import fs from "fs";
import { execFile } from "node:child_process";
import { defineConfig } from "vitepress";
import { vitepressDemoPlugin } from "vitepress-demo-plugin";
import { context } from "esbuild";
// 与 tsup 共享的 ?raw 静态资源插件（内置组件模板 .html/.css，ADR-0091）——
// esbuild watch 直接构建 engine 源码，同样需要 ?raw 解析
import { rawAssetsPlugin } from "../../../packages/engine/scripts/esbuild-raw-assets";

export default defineConfig({
  ignoreDeadLinks: true, // 临时（验证后删除）
  base: "/autospark/",
  title: "AutoSpark",
  description: "全功能的响应式前端应用引擎",
  themeConfig: {
    outline: {
      label: "目录",
      level: [2, 5],
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "首页", link: "/" },
      { text: "指南", link: "/zh/guide/" },
      { text: "插件", link: "/zh/plugins/" },
      { text: "API", link: "/zh/api/" },
      {
        text: "示例",
        items: [
          { text: "商城示例（完整应用）", link: "/zh/examples/shop" },
          // target=_blank 使 VPLink 判定为外链：整页打开 public 下的裸 HTML 示例，不经 SPA 路由
          { text: "在线运行（新窗口）", link: "/examples/shop/index.html", target: "_blank" },
        ],
      },
      { text: "开源推荐", link: "https://zhangfisher.github.io/repos/" },
    ],
    sidebar: {
      "/zh/guide/": [
        {
          text: "关于",
          link: "/zh/guide/engine/index",
          items: [
            { text: "安装", link: "/zh/guide/intro/install" },
            { text: "名词解释", link: "/zh/guide/intro/glossary" },
            { text: "快速入门", link: "/zh/guide/intro/get-started" },
            { text: "特征和优势", link: "/zh/guide/intro/features" },
            { text: "对比评测", link: "/zh/guide/intro/comparison" },
            { text: "常见问题", link: "/zh/guide/intro/question" },
          ],
        },
        {
          text: "指南",
          collapsed: false,
          items: [
            { text: "创建应用", link: "/zh/guide/engine/initial" },
            { text: "应用状态", link: "/zh/guide/engine/state" },
            {
              text: "模板",
              link: "/zh/guide/engine/template",
              collapsed: true,
              items: [
                { text: "语法", link: "/zh/guide/engine/template" },
                { text: "模板指令", link: "/zh/guide/engine/template-directives" },
                { text: "远程模板", link: "/zh/guide/engine/template-remote" },
                { text: "动态模板", link: "/zh/guide/engine/patch" },
              ],
            },
            { text: "动作", link: "/zh/guide/engine/action" },
            { text: "错误处理", link: "/zh/guide/engine/error" },
            {
              text: "指令",
              link: "/zh/guide/engine/directive/",
              collapsed: true,
              items: [
                { text: "关于", link: "/zh/guide/engine/directive/" },
                { text: "指令配置", link: "/zh/guide/engine/directive/config" },
                { text: "Scope", link: "/zh/guide/engine/directive/scope" },
                { text: "自定义指令", link: "/zh/guide/engine/directive/custom" },
              ],
            },
            {
              text: "组件",
              link: "/zh/guide/engine/component/",
              collapsed: true,
              items: [
                { text: "关于", link: "/zh/guide/engine/component/" },
                { text: "开发组件", link: "/zh/guide/engine/component/develop" },
                { text: "全局组件", link: "/zh/guide/engine/component/global" },
                { text: "组件插槽", link: "/zh/guide/engine/component/slot" },
                { text: "组件继承", link: "/zh/guide/engine/component/inherit" },
                { text: "组件递归", link: "/zh/guide/engine/component/recursive" },
                { text: "实例化组件", link: "/zh/guide/engine/component/instantiate" },
                { text: "查找组件", link: "/zh/guide/engine/component/lookup" },
                { text: "响应式数据", link: "/zh/guide/engine/component/data" },
                { text: "组件间通讯", link: "/zh/guide/engine/component/communication" },
                { text: "生命周期", link: "/zh/guide/engine/component/lifecycle" },
                { text: "样式", link: "/zh/guide/engine/component/styles" },
                { text: "远程组件", link: "/zh/guide/engine/component/remote" },
                { text: "运行时创建", link: "/zh/guide/engine/component/runtime" },
                { text: "配置选项", link: "/zh/guide/engine/component/options" },
                { text: "元素名组件", link: "/zh/guide/engine/component/tag" },
                { text: "注意事项", link: "/zh/guide/engine/component/notes" },
                { text: "常见问题", link: "/zh/guide/engine/component/faq" },
              ],
            },
            { text: "覆盖物", link: "/zh/guide/engine/overlays" },
            { text: "动画", link: "/zh/guide/engine/animate" },
            { text: "工具提示", link: "/zh/guide/engine/tooltip" },
            { text: "视口断点", link: "/zh/guide/engine/viewport" },
            {
              text: "通知",
              link: "/zh/guide/engine/notifications/",
              collapsed: true,
              items: [
                { text: "关于", link: "/zh/guide/engine/notifications/" },
                { text: "安装", link: "/zh/guide/engine/notifications/installation" },
                { text: "轻提示", link: "/zh/guide/engine/notifications/toast" },
                { text: "通用确认", link: "/zh/guide/engine/notifications/confirm" },
                { text: "任务", link: "/zh/guide/engine/notifications/task" },
                { text: "事件", link: "/zh/guide/engine/notifications/events" },
                { text: "数据视图", link: "/zh/guide/engine/notifications/data" },
                { text: "自定义", link: "/zh/guide/engine/notifications/custom" },
                { text: "配置参数", link: "/zh/guide/engine/notifications/config" },
              ],
            },
            {
              text: "路由",
              collapsed: true,
              items: [
                { text: "关于", link: "/zh/guide/engine/router/" },
                { text: "安装", link: "/zh/guide/engine/router/installation" },
                { text: "快速入门", link: "/zh/guide/engine/router/quick-start" },
                { text: "特征与优势", link: "/zh/guide/engine/router/features" },
                { text: "创建路由", link: "/zh/guide/engine/router/creating-routes" },
                { text: "路由表", link: "/zh/guide/engine/router/route-table" },
                { text: "路由出口", link: "/zh/guide/engine/router/outlet" },
                { text: "数据加载", link: "/zh/guide/engine/router/data-loading" },
                { text: "视图加载", link: "/zh/guide/engine/router/view-loading" },
                { text: "错误呈现与重试", link: "/zh/guide/engine/router/error-presentation" },
                { text: "缓存", link: "/zh/guide/engine/router/cache" },
                { text: "重定向", link: "/zh/guide/engine/router/redirect" },
                { text: "远程路由", link: "/zh/guide/engine/router/remote-routes" },
                { text: "自动发现路由", link: "/zh/guide/engine/router/auto-discover-routes" },
                { text: "预加载", link: "/zh/guide/engine/router/preload" },
                { text: "转场动画", link: "/zh/guide/engine/router/transition" },
                { text: "路由守卫", link: "/zh/guide/engine/router/guards" },
                { text: "事件", link: "/zh/guide/engine/router/events" },
                {
                  text: "渲染器",
                  link: "/zh/guide/engine/router/renderers/",
                  collapsed: true,
                  items: [
                    { text: "关于", link: "/zh/guide/engine/router/renderers/" },
                    { text: "默认渲染器", link: "/zh/guide/engine/router/renderers/default" },
                    { text: "HTML 渲染器", link: "/zh/guide/engine/router/renderers/html" },
                    { text: "Markdown 渲染器", link: "/zh/guide/engine/router/renderers/markdown" },
                    { text: "JSON 渲染器", link: "/zh/guide/engine/router/renderers/json" },
                    { text: "Image 渲染器", link: "/zh/guide/engine/router/renderers/image" },
                    { text: "自定义加载器", link: "/zh/guide/engine/router/renderers/custom" },
                  ],
                },
                { text: "SEO 优化", link: "/zh/guide/engine/router/seo" },
                { text: "性能优化", link: "/zh/guide/engine/router/performance" },
                { text: "常见问题", link: "/zh/guide/engine/router/faq" },
              ]
            }, {
              text: "多语言",
              link: "/zh/guide/engine/language",
            },
            {
              text: "版本",
              link: "/zh/guide/engine/version",
            },
            {
              text: "主题",
              collapsed: true, link: "/zh/guide/engine/theme/index",
              items: [
                { text: "安装", link: "/zh/guide/engine/theme/install" },
                { text: "快速入门", link: "/zh/guide/engine/theme/get-started" },
                { text: "初始化", link: "/zh/guide/engine/theme/initial" },
                { text: "工作原理", link: "/zh/guide/engine/theme/how-it-works" },
                {
                  text: "主题要素",
                  link: "/zh/guide/engine/theme/color",
                  collapsed: false,
                  items: [
                    {
                      text: "颜色",
                      link: "/zh/guide/engine/theme/color",
                      collapsed: false,
                      items: [
                        { text: "主题色", link: "/zh/guide/engine/theme/color#主题色" },
                        { text: "派生颜色", link: "/zh/guide/engine/theme/color-derived" },
                        { text: "明暗主题", link: "/zh/guide/engine/theme/color-dark" },
                        { text: "多彩模式", link: "/zh/guide/engine/theme/color-colorized" },
                        { text: "背景色", link: "/zh/guide/engine/theme/color-background" },
                        { text: "语义颜色", link: "/zh/guide/engine/theme/color-semantic" },
                      ],
                    },
                    { text: "字体", link: "/zh/guide/engine/theme/font" },
                    { text: "圆角", link: "/zh/guide/engine/theme/radius" },
                    { text: "阴影", link: "/zh/guide/engine/theme/shadow" },
                    { text: "间距", link: "/zh/guide/engine/theme/spacing" },
                  ],
                },
                {
                  text: "组件变量",
                  link: "/zh/guide/engine/theme/component",
                  collapsed: false,
                  items: [
                    { text: "段落", link: "/zh/guide/engine/theme/component-paragraph" },
                    { text: "面板", link: "/zh/guide/engine/theme/component-panel" },
                    { text: "表单", link: "/zh/guide/engine/theme/component-form" },
                    { text: "交互反馈", link: "/zh/guide/engine/theme/component-feedback" },
                  ],
                },
                { text: "元素域", link: "/zh/guide/engine/theme/element-scope" },
                { text: "局部主题", link: "/zh/guide/engine/theme/local-scope" },
                { text: "持久化", link: "/zh/guide/engine/theme/persistence" },
                { text: "静态主题包", link: "/zh/guide/engine/theme/static" },
                { text: "下载主题", link: "/zh/guide/engine/theme/download" },

              ]
            },
            {
              text: "插件",
              collapsed: true,
              items: [
                { text: "关于", link: "/zh/guide/engine/plugin/about" },
                { text: "开发", link: "/zh/guide/engine/plugin/dev" },
                { text: "类型扩展", link: "/zh/guide/engine/plugin/types" },
              ],
            }
          ],
        },
        {
          text: "指令",
          collapsed: false,
          items: [
            {
              text: "基础",
              collapsed: false,
              items: [
                { text: "x-text", link: "/zh/guide/directives/x-text" },
                { text: "x-html", link: "/zh/guide/directives/x-html" },
                { text: "x-bind", link: "/zh/guide/directives/x-bind" },
                { text: "x-class", link: "/zh/guide/directives/x-class" },
                { text: "x-style", link: "/zh/guide/directives/x-style" },
                { text: "x-on", link: "/zh/guide/directives/x-on" },
                { text: "x-icon", link: "/zh/guide/directives/x-icon" },
              ],
            },
            {
              text: "结构渲染",
              collapsed: true,
              items: [
                { text: "x-if", link: "/zh/guide/directives/x-if" },
                { text: "x-show", link: "/zh/guide/directives/x-show" },
                { text: "x-viewport", link: "/zh/guide/directives/x-viewport" },
                { text: "x-version", link: "/zh/guide/directives/x-version" },
                { text: "x-switch", link: "/zh/guide/directives/x-switch" },
                {
                  text: "x-for",
                  link: "/zh/guide/directives/x-for",
                  collapsed: true,
                  items: [
                    { text: "分页", link: "/zh/guide/directives/x-for-paging" },
                    { text: "虚拟列表", link: "/zh/guide/directives/x-for-virtual" },
                  ],
                },
                { text: "x-tree", link: "/zh/guide/directives/x-tree" },
              ],
            },
            {
              text: "状态数据",
              collapsed: true,
              items: [
                { text: "x-data", link: "/zh/guide/directives/x-data" },
                { text: "x-scope", link: "/zh/guide/directives/x-scope" },
                { text: "x-isolate", link: "/zh/guide/directives/x-isolate" },
              ],
            },
            {
              text: "表单",
              collapsed: true,
              items: [
                { text: "x-model", link: "/zh/guide/directives/x-model" },
                { text: "x-form", link: "/zh/guide/directives/x-form" },
                { text: "x-field", link: "/zh/guide/directives/x-field" },
              ],
            },
            {
              text: "布局",
              collapsed: true,
              items: [
                { text: "x-container", link: "/zh/guide/directives/x-container" },
                { text: "x-layout", link: "/zh/guide/directives/x-layout" },
                { text: "x-foldable", link: "/zh/guide/directives/x-foldable" },
                { text: "x-splitter", link: "/zh/guide/directives/x-splitter" },
                { text: "x-expandable", link: "/zh/guide/directives/x-expandable" },
                { text: "x-resizable", link: "/zh/guide/directives/x-resizable" },
              ],
            },
            {
              text: "覆盖物",
              collapsed: true,
              items: [
                { text: "x-dialog", link: "/zh/guide/directives/x-dialog" },
                { text: "x-drawer", link: "/zh/guide/directives/x-drawer" },
                { text: "x-popover", link: "/zh/guide/directives/x-popover" },
                { text: "x-teleport", link: "/zh/guide/directives/x-teleport" },
                { text: "x-loading", link: "/zh/guide/directives/x-loading" },
                { text: "x-error", link: "/zh/guide/directives/x-error" },
              ],
            },
            {
              text: "组件",
              collapsed: true,
              items: [
                { text: "x-define", link: "/zh/guide/directives/x-define" },
                { text: "x-component", link: "/zh/guide/directives/x-component" },
                { text: "x-slot", link: "/zh/guide/directives/x-slot" },
                { text: "x-super", link: "/zh/guide/directives/x-super" },
                { text: "x-slots", link: "/zh/guide/directives/x-slots" },
                { text: "x-import", link: "/zh/guide/directives/x-import" },
              ],
            },
            {
              text: "插件开发",
              collapsed: true,
              items: [{ text: "关于", link: "/zh/guide/plugin/" }],
            },
            {
              text: "扩展指令",
              collapsed: true,
              items: [
                { text: "x-ripple", link: "/zh/guide/directives/x-ripple" },
                { text: "x-spin", link: "/zh/guide/directives/x-spin" },
              ],
            },
          ],
        }
      ],
      "/zh/examples/": [
        {
          text: "示例",
          items: [
            { text: "商城示例", link: "/zh/examples/shop" },
            { text: "在线运行（新窗口）", link: "/examples/shop/index.html", target: "_blank" },
          ],
        },
      ],
      "zh/api/": [{
        text: "Router",
        collapsed: true,
        items: [
          { text: "API 总览", link: "/zh/api/" },
          { text: "路由器配置", link: "/zh/api/options" },
          { text: "路由项", link: "/zh/api/route-item" },
          { text: "实例", link: "/zh/api/instance" },
          { text: "匹配结果", link: "/zh/api/matched-route" },
          { text: "钩子", link: "/zh/api/hooks" },
          { text: "事件", link: "/zh/api/events" },
          { text: "数据源", link: "/zh/api/data" },
          { text: "内置元素", link: "/zh/api/components" },
          { text: "渲染器", link: "/zh/api/renderers" },
        ],
      }]
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
              rawAssetsPlugin as any,
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
        name: "autospark-plugins-dev-source",
        // 仅开发期生效：demos 引用的插件闭包产物（/autospark/autospark.<plugin>.js）在 docs
        // dev 下由本插件接管——dev 启动预热一次、插件源码/构建配置变更后下次请求触发
        // spawn 插件包全量构建（`bun run build`，产物清单单点在 packages/plugins/vite.config.ts，
        // 构建即刷新 docs/public 复制件），随后伺服新产物。生产构建不受影响（apply: "serve"，
        // public 静态产物由部署侧正常伺服）。
        apply: "serve",
        configureServer(server: any) {
          const pluginsRoot = path.resolve(__dirname, "../../../packages/plugins");
          const publicDir = path.resolve(__dirname, "../../public");
          // autospark.js（引擎）由上游 autospark-engine-dev-source 精确接管；
          // 本正则要求产物名含插件段（autospark.<name>.js），天然不匹配引擎名。
          const PLUGIN_CLOSURE_RE = /^\/autospark\/(autospark\.[\w-]+\.js)$/;
          // watcher 默认只监听 docs 项目——显式扩展到插件包源码、构建配置与 utils 工具链源码
          // （闭包构建工具所在 packages/utils/src/vite，utils ADR-0002 迁入）
          const SRC_PATHS = [
            path.join(pluginsRoot, "src"),
            path.join(pluginsRoot, "vite.config.ts"),
            path.resolve(__dirname, "../../../packages/utils/src"),
          ];
          server.watcher.add(SRC_PATHS);

          let dirty = true;
          const invalidate = (): void => {
            dirty = true;
          };
          server.watcher.on("change", invalidate);
          server.watcher.on("unlink", invalidate);

          // 构建串行队列：并发请求共享同一次构建；失败保留 dirty（下次请求重试）
          let building: Promise<void> | null = null;
          const ensureFresh = (): Promise<void> => {
            if (!dirty) return Promise.resolve();
            building ??= new Promise<void>((resolve, reject) => {
              const bin = process.execPath.includes("bun") ? process.execPath : "bun";
              execFile(bin, ["run", "build"], { cwd: pluginsRoot, windowsHide: true }, (error) => {
                building = null;
                if (error) return reject(error);
                dirty = false;
                resolve();
              });
            });
            return building;
          };
          void ensureFresh().catch(() => { }); // 启动预热（失败留给首请求重试报错）

          server.middlewares.use((req: any, res: any, next: any) => {
            const m = PLUGIN_CLOSURE_RE.exec(req.url?.split("?")[0] ?? "");
            if (!m) return next();
            const name = m[1];
            ensureFresh()
              .then(() => {
                res.setHeader("Content-Type", "application/javascript");
                res.end(fs.readFileSync(path.join(publicDir, name)));
              })
              .catch((error: any) => {
                res.statusCode = 500;
                res.end(`[autospark/docs] 插件闭包产物构建失败：${error?.message ?? error}`);
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
