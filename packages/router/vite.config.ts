import { defineConfig } from 'vite'
import { resolve } from 'path'

// example 示例应用构建（库构建走 tsup，见 tsup.config.ts；两者产物目录分离避免冲突）
export default defineConfig({
  root: 'example',
  publicDir: 'public',
  build: {
    outDir: '../dist-example'
  },
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
    },
    preserveSymlinks: true
  },
  css: {
    devSourcemap: true
  }
})
