import { defineConfig } from "vite";
import { resolve } from "path";

// 组件 demo 开发服务器（库构建走 tsup，见 tsup.config.ts；两者产物目录分离避免冲突）
export default defineConfig({
  root: "demo",
  build: {
    outDir: "../dist-demo",
  },
  server: {
    port: 5181,
    open: false,
    fs: {
      // 允许访问项目根目录的文件
      allow: [".."],
      strict: false,
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "/src": resolve(__dirname, "./src"),
    },
    // 注：不可开 preserveSymlinks——bun 隔离布局下传递依赖只存在于 .bun/<pkg>/node_modules/
    // 兄弟目录，从 symlink 位置出发解析会失败
  },
  optimizeDeps: {
    // autospark 源码含 *.html?raw 导入，rolldown 依赖预优化在 Windows 上会把 ? 当
    // 路径字符（os error 123）导致启动崩溃；排除后由 vite 运行时 transform 处理 ?raw
    exclude: ["autospark"],
  },
  css: {
    devSourcemap: true,
  },
});
