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
 * `src/components/<name>/index.ts`（组件型）、`src/features/<name>/index.ts`（能力扩展型）、
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
  { entry: "src/directives/x-ripple/index.ts", outFile: "autospark.ripple.js", label: "Ripple" },
  { entry: "src/directives/x-spin/index.ts", outFile: "autospark.spin.js", label: "Spin" },
  { entry: "src/components/button/index.ts", outFile: "autospark.button.js", label: "Button" },
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
