import path from "path";
import { defineConfig } from "vitepress";
import { vitepressDemoPlugin } from "vitepress-demo-plugin"; 

export default defineConfig({
    base: "/autostore/",
    title: "AutoStore",
    description: "响应式数据管理库",
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
                        { text: "响应式", link: "/zh/guide/reactive" },
                        { text: "动作", link: "/zh/guide/action" },
                        { text: "指令类型", link: "/zh/guide/directive" },
                        { text: "指令配置", link: "/zh/guide/config" },
                        { text: "动态模板", link: "/zh/guide/patch" },
                        { text: "组件", link: "/zh/guide/component" },
                    ],
                },
                {
                    text: "指令",
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
                        { text: "x-for", link: "/zh/guide/directives/x-for" },
                        { text: "x-on", link: "/zh/guide/directives/x-on" },
                        { text: "x-loading", link: "/zh/guide/directives/x-loading" },
                        { text: "x-slot", link: "/zh/guide/directives/x-slot" },
                        { text: "x-model", link: "/zh/guide/directives/x-model" },
                        { text: "x-switch", link: "/zh/guide/directives/x-switch" },
                        { text: "x-table", link: "/zh/guide/directives/x-table" },
                        { text: "x-teleport", link: "/zh/guide/directives/x-teleport" },
                        {
                            text: "x-transition",
                            link: "/zh/guide/directives/x-transition",
                        },
                    ],
                },
            ],
        },
        socialLinks: [{ icon: "github", link: "https://github.com/zhangfisher/autostore/" }],
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
        build: {
            chunkSizeWarningLimit: 2000, // 将限制提高到 1000KB
        },
    },
});
