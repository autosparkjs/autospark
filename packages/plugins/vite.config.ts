/**
 * @autospark/plugins 构建与 demo 服务配置（ADR-0004）。
 *
 * 三态分治（vite 无配置数组语义，command/mode 路由）：
 * - `bun run build`（command=build，默认）——包构建：插件闭包产物清单驱动，
 *   主构建承担聚合产物，closeBundle 编排循环构建其余产物（rollup 多入口会提取
 *   共享 chunk，破坏「一产物一自包含闭包」契约，故一产物一次构建）+ publish
 *   （gzip 日志 + docs/public 复制）。闭包构建工具本体在 @autospark/utils/vite
 *   （utils ADR-0002 迁出，本包不再产出 dist/vite）；
 * - `bun run build:demo`（mode=demo）——demo 消费现场装配：构建 demo 页面后复制
 *   发布产物与引擎 IIFE 进 dist-demo（自包含 script 直引现场，preview 可验收）；
 * - `bun run dev`（command=serve）——demo 开发服务器：script 直引契约资源，
 *   插件闭包经即时闭包化 serve（改插件源码刷新页面即取新产物）。
 *
 * 插件入口按形态四区落位（ADR-0009）：`src/directives/<name>/index.ts`（指令型）、
 * `src/components/<分类>/<name>/index.ts`（组件型，分类见 ADR-0017）、`src/features/<name>/index.ts`（能力扩展型）、
 * `src/modules/<name>/index.ts`（复合型）——一插件一文件夹自包含；跨域共享纯函数住
 * `src/utils/`（一函数一文件，decorate.ts 为强内聚家族模块单文件先例）。
 */
import { defineConfig, build as viteBuild, type Plugin, type UserConfig } from "vite";
import { resolve } from "path";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { gzip } from "node:zlib";
import { promisify } from "node:util";
import { buildAutoSparkPlugin } from "@autospark/utils/vite";

const gzipPromise = promisify(gzip);

const pkgRoot = import.meta.dirname;
const docsPublicDir = resolve(pkgRoot, "../../docs/public");
const DIST_DIR = resolve(pkgRoot, "dist");
const DIST_DEMO_DIR = resolve(pkgRoot, "dist-demo");
/** dev 即时闭包产物缓存目录（与发布 dist 分离——即时产物无 sourcemap，不覆盖发布形态） */
const DEV_CLOSURE_DIR = resolve(pkgRoot, "node_modules/.cache/demo-closures");
/** 引擎 IIFE 产物（demo 消费契约的另一半：<script> 直引全局 AutoSpark） */
const ENGINE_IIFE = resolve(pkgRoot, "../engine/dist/index.global.js");

/** 插件闭包产物清单：入口（相对包根）→ 消费契约文件名 `autospark.<plugin>.js`（ADR-0003 决策 4）。
 *  首项（聚合产物）由 lib 主构建承担，其余经 closeBundle 编排循环构建。 */
const CLOSURE_ARTIFACTS = [
  { entry: "src/index.ts", outFile: "autospark.plugins.js", label: "AutoSparkPlugins (aggregate)" },
  { entry: "src/modules/notifications/index.ts", outFile: "autospark.notifications.js", label: "Notifications" },
  { entry: "src/modules/resource/index.ts", outFile: "autospark.resource.js", label: "Resource" },
  { entry: "src/modules/i18n/index.ts", outFile: "autospark.i18n.js", label: "I18n" },
  { entry: "src/directives/x-ripple/index.ts", outFile: "autospark.ripple.js", label: "Ripple" },
  { entry: "src/directives/x-spin/index.ts", outFile: "autospark.spin.js", label: "Spin" },
  { entry: "src/directives/x-scrollbar/index.ts", outFile: "autospark.scrollbar.js", label: "Scrollbar" },
  { entry: "src/directives/x-badge/index.ts", outFile: "autospark.badge.js", label: "Badge" },
  { entry: "src/components/general/button/index.ts", outFile: "autospark.button.js", label: "Button" },
  { entry: "src/components/general/state-button/index.ts", outFile: "autospark.state-button.js", label: "StateButton" },
  { entry: "src/components/general/button-group/index.ts", outFile: "autospark.button-group.js", label: "ButtonGroup" },
  { entry: "src/components/general/text/index.ts", outFile: "autospark.text.js", label: "Text" },
  { entry: "src/components/general/link/index.ts", outFile: "autospark.link.js", label: "Link" },
  { entry: "src/components/layout/divider/index.ts", outFile: "autospark.divider.js", label: "Divider" },
  { entry: "src/components/layout/space/index.ts", outFile: "autospark.space.js", label: "Space" },
  { entry: "src/components/layout/grid/index.ts", outFile: "autospark.grid.js", label: "Grid" },
  { entry: "src/components/feedback/alert/index.ts", outFile: "autospark.alert.js", label: "Alert" },
  { entry: "src/components/feedback/progress/index.ts", outFile: "autospark.progress.js", label: "Progress" },
  { entry: "src/components/feedback/skeleton/index.ts", outFile: "autospark.skeleton.js", label: "Skeleton" },
  { entry: "src/components/feedback/message-box/index.ts", outFile: "autospark.message-box.js", label: "MessageBox" },
  { entry: "src/components/display/card/index.ts", outFile: "autospark.card.js", label: "Card" },
  { entry: "src/components/display/tag/index.ts", outFile: "autospark.tag.js", label: "Tag" },
  { entry: "src/components/display/empty/index.ts", outFile: "autospark.empty.js", label: "Empty" },
  { entry: "src/components/display/avatar/index.ts", outFile: "autospark.avatar.js", label: "Avatar" },
  { entry: "src/components/display/image/index.ts", outFile: "autospark.image.js", label: "Image" },
  { entry: "src/components/display/list/index.ts", outFile: "autospark.list.js", label: "List" },
  { entry: "src/components/display/descriptions/index.ts", outFile: "autospark.descriptions.js", label: "Descriptions" },
  { entry: "src/components/display/timeline/index.ts", outFile: "autospark.timeline.js", label: "Timeline" },
  { entry: "src/components/display/statistic/index.ts", outFile: "autospark.statistic.js", label: "Statistic" },
  { entry: "src/components/display/image-viewer/index.ts", outFile: "autospark.image-viewer.js", label: "ImageViewer" },
  { entry: "src/components/display/carousel/index.ts", outFile: "autospark.carousel.js", label: "Carousel" },
  { entry: "src/components/display/table/index.ts", outFile: "autospark.table.js", label: "Table" },
  { entry: "src/components/navigation/menu/index.ts", outFile: "autospark.menu.js", label: "Menu" },
  { entry: "src/components/navigation/steps/index.ts", outFile: "autospark.steps.js", label: "Steps" },
  { entry: "src/components/navigation/page-header/index.ts", outFile: "autospark.page-header.js", label: "PageHeader" },
  { entry: "src/components/navigation/pagination/index.ts", outFile: "autospark.pagination.js", label: "Pagination" },
  { entry: "src/components/feedback/result/index.ts", outFile: "autospark.result.js", label: "Result" },
  { entry: "src/components/display/collapse/index.ts", outFile: "autospark.collapse.js", label: "Collapse" },
  { entry: "src/components/layout/container/index.ts", outFile: "autospark.container.js", label: "Container" },
  { entry: "src/components/navigation/anchor/index.ts", outFile: "autospark.anchor.js", label: "Anchor" },
  { entry: "src/components/navigation/dropdown/index.ts", outFile: "autospark.dropdown.js", label: "Dropdown" },
  { entry: "src/components/general/float-button/index.ts", outFile: "autospark.float-button.js", label: "FloatButton" },
  { entry: "src/components/other/affix/index.ts", outFile: "autospark.affix.js", label: "Affix" },
  { entry: "src/components/other/watermark/index.ts", outFile: "autospark.watermark.js", label: "Watermark" },
  { entry: "src/components/other/tour/index.ts", outFile: "autospark.tour.js", label: "Tour" },
  { entry: "src/components/other/countdown/index.ts", outFile: "autospark.countdown.js", label: "Countdown" },
  { entry: "src/components/form/input/index.ts", outFile: "autospark.input.js", label: "Input" },
  { entry: "src/components/form/password/index.ts", outFile: "autospark.password.js", label: "Password" },
  { entry: "src/components/form/textarea/index.ts", outFile: "autospark.textarea.js", label: "Textarea" },
  { entry: "src/components/form/checkbox/index.ts", outFile: "autospark.checkbox.js", label: "Checkbox" },
  { entry: "src/components/form/radio/index.ts", outFile: "autospark.radio.js", label: "Radio" },
  { entry: "src/components/form/switch/index.ts", outFile: "autospark.switch.js", label: "Switch" },
  { entry: "src/components/form/input-number/index.ts", outFile: "autospark.input-number.js", label: "InputNumber" },
  { entry: "src/components/form/slider/index.ts", outFile: "autospark.slider.js", label: "Slider" },
  { entry: "src/components/form/rate/index.ts", outFile: "autospark.rate.js", label: "Rate" },
  { entry: "src/components/form/select/index.ts", outFile: "autospark.select.js", label: "Select" },
  { entry: "src/components/form/transfer/index.ts", outFile: "autospark.transfer.js", label: "Transfer" },
  { entry: "src/components/form/color-picker/index.ts", outFile: "autospark.color-picker.js", label: "ColorPicker" },
  { entry: "src/components/form/date-picker/index.ts", outFile: "autospark.date-picker.js", label: "DatePicker" },
  { entry: "src/components/form/time-picker/index.ts", outFile: "autospark.time-picker.js", label: "TimePicker" },
  { entry: "src/components/form/time-select/index.ts", outFile: "autospark.time-select.js", label: "TimeSelect" },
  { entry: "src/components/form/autocomplete/index.ts", outFile: "autospark.autocomplete.js", label: "Autocomplete" },
  { entry: "src/components/navigation/breadcrumb/index.ts", outFile: "autospark.breadcrumb.js", label: "Breadcrumb" },
  { entry: "src/components/navigation/tabs/index.ts", outFile: "autospark.tabs.js", label: "Tabs" },
  { entry: "src/directives/tree/index.ts", outFile: "autospark.tree.js", label: "Tree" },
  { entry: "src/directives/version/index.ts", outFile: "autospark.version.js", label: "Version" },
  { entry: "src/directives/layout/index.ts", outFile: "autospark.layout.js", label: "Layout" },
  { entry: "src/directives/overlay/index.ts", outFile: "autospark.overlay.js", label: "Overlay" },
  { entry: "src/features/virtual/index.ts", outFile: "autospark.virtual.js", label: "Virtual" },
  { entry: "src/features/tooltip/bootstrap.ts", outFile: "autospark.tooltip.js", label: "Tooltip" },
  // 表单域骨架（base/，ADR-0020 2026-11-14 修订转公开文档组件）：独立产物供 demo/
  // 文档直接引入；子组件产物仍以副作用导入内嵌本注册（按需加载无须单独引入）
  { entry: "src/components/base/field/index.ts", outFile: "autospark.field.js", label: "Field" },
] as const;

/** 插件源码（本包）/ 闭包工具源码（utils 包，迁移后路径 packages/utils/src/vite）变化即失效 dev 缓存的路径特征（Windows 分隔符兼容） */
const INVALIDATE_RE = /[\\/]src[\\/](plugins|runtime|vite)[\\/]/;

/** 单插件闭包产物构建（lib 编排与 dev 即时闭包化共用，注入同一闭包工具） */
async function buildClosureArtifact(outFile: string, outDir: string, sourcemap: boolean): Promise<Buffer> {
  const artifact = CLOSURE_ARTIFACTS.find((a) => a.outFile === outFile);
  if (!artifact) {
    throw new Error(`[autospark/plugins] 未知插件闭包产物 "${outFile}"（清单见 vite.config.ts）`);
  }
  await viteBuild({
    configFile: false,
    root: pkgRoot,
    logLevel: "silent", // 构建失败经 throw 上抛（编排中断 / dev 中间件 500），进度静默
    plugins: [buildAutoSparkPlugin()],
    build: {
      outDir,
      emptyOutDir: false, // 多产物共存，禁自动清空
      sourcemap,
      minify: true,
      rollupOptions: {
        input: { [outFile.replace(/\.js$/, "")]: resolve(pkgRoot, artifact.entry) },
        output: { entryFileNames: "[name].js" },
      },
    },
  });
  return readFileSync(resolve(outDir, outFile));
}

/** 统计并复制 IIFE 产物到文档站公共资源（消费契约文件名不变） */
async function publishIife(outFile: string, label: string): Promise<void> {
  const file = readFileSync(resolve(DIST_DIR, outFile));
  const compressed = await gzipPromise(file);
  console.log(`\x1b[33m${label} plugin Gzipped size: \x1b[0m\x1b[32m${(compressed.length / 1024).toFixed(2)} kB\x1b[0m`);
  copyFileSync(resolve(DIST_DIR, outFile), resolve(docsPublicDir, outFile));
}

/** 包构建编排（lib 主构建承担清单首项聚合产物，closeBundle 收口其余产物与发布面） */
function libOrchestrationPlugin(): Plugin {
  return {
    name: "autospark-plugins-orchestration",
    apply: "build",
    closeBundle: async () => {
      for (const artifact of CLOSURE_ARTIFACTS.slice(1)) {
        await buildClosureArtifact(artifact.outFile, DIST_DIR, true);
      }
      for (const artifact of CLOSURE_ARTIFACTS) {
        await publishIife(artifact.outFile, artifact.label);
      }
    },
  };
}

/** dev：消费契约资源服务——引擎 IIFE 直读 + 插件闭包即时构建（会话级缓存） */
function demoServePlugin(): Plugin {
  const cache = new Map<string, Buffer>();
  return {
    name: "autospark-demo-contract-serve",
    apply: "serve",
    configureServer(server) {
      const invalidate = (file: string): void => {
        if (INVALIDATE_RE.test(file)) cache.clear();
      };
      server.watcher.on("change", invalidate);
      server.watcher.on("unlink", invalidate);

      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "").split("?")[0];
        const serve = (body: Buffer): void => {
          res.setHeader("Content-Type", "text/javascript");
          res.end(body);
        };
        if (url === "/autospark.js") {
          return serve(readFileSync(ENGINE_IIFE));
        }
        const closure = /^\/(autospark\.[\w-]+\.js)$/.exec(url);
        if (closure) {
          const outFile = closure[1];
          const hit = cache.get(outFile);
          if (hit) return serve(hit);
          buildClosureArtifact(outFile, DEV_CLOSURE_DIR, false)
            .then((body) => {
              cache.set(outFile, body);
              serve(body);
            })
            .catch((error: unknown) => {
              res.statusCode = 500;
              res.end(`[autospark/demo] 插件闭包构建失败：${error instanceof Error ? error.message : error}`);
            });
          return;
        }
        next();
      });
    },
  };
}

/** build:demo：装配 dist-demo 自包含消费现场（引擎 IIFE + 全部插件闭包发布产物） */
function demoAssemblePlugin(): Plugin {
  return {
    name: "autospark-demo-contract-build",
    apply: "build",
    closeBundle: async () => {
      mkdirSync(DIST_DEMO_DIR, { recursive: true });
      copyFileSync(ENGINE_IIFE, resolve(DIST_DEMO_DIR, "autospark.js"));
      for (const artifact of CLOSURE_ARTIFACTS) {
        // 发布产物须经 `bun run build` 先行产出（装配只复制不重建——消费现场即发布形态）
        copyFileSync(resolve(DIST_DIR, artifact.outFile), resolve(DIST_DEMO_DIR, artifact.outFile));
        try {
          copyFileSync(resolve(DIST_DIR, `${artifact.outFile}.map`), resolve(DIST_DEMO_DIR, `${artifact.outFile}.map`));
        } catch {
          // 无 sourcemap 跳过
        }
      }
    },
  };
}

export default defineConfig(({ command, mode }): UserConfig => {
  if (command === "serve") {
    // demo 开发服务器（root: demo）
    return {
      root: "demo",
      plugins: [demoServePlugin()],
      server: {
        port: 5181,
        open: false,
      },
    };
  }
  if (mode === "demo") {
    // demo 消费现场装配：页面多入口 + 发布产物复制
    return {
      root: "demo",
      plugins: [demoAssemblePlugin()],
      build: {
        outDir: "../dist-demo",
        emptyOutDir: true, // outDir 在 root 外，显式清空防残留
        rollupOptions: {
          input: {
            index: resolve(pkgRoot, "demo/index.html"),
            button: resolve(pkgRoot, "demo/button.html"),
            text: resolve(pkgRoot, "demo/text.html"),
            link: resolve(pkgRoot, "demo/link.html"),
            divider: resolve(pkgRoot, "demo/divider.html"),
            space: resolve(pkgRoot, "demo/space.html"),
            grid: resolve(pkgRoot, "demo/grid.html"),
            alert: resolve(pkgRoot, "demo/alert.html"),
            card: resolve(pkgRoot, "demo/card.html"),
            tag: resolve(pkgRoot, "demo/tag.html"),
            empty: resolve(pkgRoot, "demo/empty.html"),
            input: resolve(pkgRoot, "demo/input.html"),
            password: resolve(pkgRoot, "demo/password.html"),
            textarea: resolve(pkgRoot, "demo/textarea.html"),
            field: resolve(pkgRoot, "demo/field.html"),
            checkbox: resolve(pkgRoot, "demo/checkbox.html"),
            radio: resolve(pkgRoot, "demo/radio.html"),
            switch: resolve(pkgRoot, "demo/switch.html"),
            inputNumber: resolve(pkgRoot, "demo/input-number.html"),
            slider: resolve(pkgRoot, "demo/slider.html"),
            rate: resolve(pkgRoot, "demo/rate.html"),
            progress: resolve(pkgRoot, "demo/progress.html"),
            skeleton: resolve(pkgRoot, "demo/skeleton.html"),
            messageBox: resolve(pkgRoot, "demo/message-box.html"),
            breadcrumb: resolve(pkgRoot, "demo/breadcrumb.html"),
            tabs: resolve(pkgRoot, "demo/tabs.html"),
            avatar: resolve(pkgRoot, "demo/avatar.html"),
            image: resolve(pkgRoot, "demo/image.html"),
            list: resolve(pkgRoot, "demo/list.html"),
            select: resolve(pkgRoot, "demo/select.html"),
            descriptions: resolve(pkgRoot, "demo/descriptions.html"),
            timeline: resolve(pkgRoot, "demo/timeline.html"),
            statistic: resolve(pkgRoot, "demo/statistic.html"),
            imageViewer: resolve(pkgRoot, "demo/image-viewer.html"),
            carousel: resolve(pkgRoot, "demo/carousel.html"),
            table: resolve(pkgRoot, "demo/table.html"),
            menu: resolve(pkgRoot, "demo/menu.html"),
            steps: resolve(pkgRoot, "demo/steps.html"),
            pageHeader: resolve(pkgRoot, "demo/page-header.html"),
            pagination: resolve(pkgRoot, "demo/pagination.html"),
            result: resolve(pkgRoot, "demo/result.html"),
            collapse: resolve(pkgRoot, "demo/collapse.html"),
            container: resolve(pkgRoot, "demo/container.html"),
            anchor: resolve(pkgRoot, "demo/anchor.html"),
            floatButton: resolve(pkgRoot, "demo/float-button.html"),
            transfer: resolve(pkgRoot, "demo/transfer.html"),
            colorPicker: resolve(pkgRoot, "demo/color-picker.html"),
            datePicker: resolve(pkgRoot, "demo/date-picker.html"),
            timePicker: resolve(pkgRoot, "demo/time-picker.html"),
            timeSelect: resolve(pkgRoot, "demo/time-select.html"),
            affix: resolve(pkgRoot, "demo/affix.html"),
            watermark: resolve(pkgRoot, "demo/watermark.html"),
            tour: resolve(pkgRoot, "demo/tour.html"),
            countdown: resolve(pkgRoot, "demo/countdown.html"),
            autocomplete: resolve(pkgRoot, "demo/autocomplete.html"),
            dropdown: resolve(pkgRoot, "demo/dropdown.html"),
          },
        },
      },
    };
  }
  // 包构建（默认）：主构建 = 清单首项聚合产物，编排插件收口其余。
  // root/outDir 显式绝对化——产物恒落 packages/plugins/dist，与调用 cwd 无关。
  const [aggregate] = CLOSURE_ARTIFACTS;
  return {
    root: pkgRoot,
    plugins: [buildAutoSparkPlugin(), libOrchestrationPlugin()],
    build: {
      outDir: DIST_DIR,
      emptyOutDir: true, // 清除陈旧形态产物（ADR-0004 构建纪律）
      sourcemap: true,
      minify: true,
      rollupOptions: {
        input: { [aggregate.outFile.replace(/\.js$/, "")]: resolve(pkgRoot, aggregate.entry) },
        output: { entryFileNames: "[name].js" },
      },
    },
  };
});
