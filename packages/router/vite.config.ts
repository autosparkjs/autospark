import { defineConfig } from 'vite'
import { resolve } from 'path'

// example 示例应用构建（库构建走 tsup，见 tsup.config.ts；两者产物目录分离避免冲突）
export default defineConfig({
  root: 'example',
  publicDir: 'public',
  build: {
    outDir: '../dist-example'
  },
  plugins: [
    // shop SPA 的 history 路由回退：/shop 及其子路径的**文档导航**（直达/刷新，Accept 含
    // text/html 且无扩展名）须返回 shop 壳，否则 vite 默认 SPA fallback 落到演示中心页。
    // 只重写导航请求——/shop/data/*.json、/shop/pages/*.html 等资源请求命中 publicDir
    // 静态文件（example/public/shop/ 的 publicDir URL 即 /shop/），误重写会让 JSON 解析
    // 收到 HTML（DataLoader "Unexpected token '<'" → 视图永久 loading）
    {
      name: 'shop-history-fallback',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const pathname = (req.url ?? '').split('?')[0]
          const acceptsHtml = (req.headers?.accept ?? '').includes('text/html')
          const isNavPath = !pathname.includes('.')
          if (acceptsHtml && isNavPath && (pathname === '/shop' || pathname.startsWith('/shop/'))) {
            req.url = '/public/shop/index.html'
          }
          next()
        })
      },
    },
  ],
  server: {
    port: 5173,
    open: false,
    fs: {
      // 允许访问项目根目录的文件
      allow: ['..'],
      strict: false
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '/src': resolve(__dirname, './src')
    }
    // 注：不可开 preserveSymlinks——bun 隔离布局下传递依赖（如 history 的 @babel/runtime）
    // 只存在于 .bun/<pkg>/node_modules/ 兄弟目录，从 symlink 位置出发解析会失败（history.js 500）
  },
  optimizeDeps: {
    // autospark 源码含 *.html?raw 导入，rolldown 依赖预优化在 Windows 上会把 ? 当
    // 路径字符（os error 123）导致启动崩溃；排除后由 vite 运行时 transform 处理 ?raw
    exclude: ['autospark']
  },
  css: {
    devSourcemap: true
  }
})
