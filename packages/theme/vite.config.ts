import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
    // 示例页根目录：dev server 直接服务 examples/index.html
    root: "examples",
    resolve: {
        // 对应 tsconfig.json 的 paths（src/vars 下使用 "@/..." 导入），vite 不会自动读取 tsconfig paths
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    server: {
        port: 5180,
    },
    // root 指向 examples 后，构建产物输出到包内独立目录，避免污染示例目录
    build: {
        outDir: "../dist-examples",
    },
});
