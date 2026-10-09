/**
 * `?raw` 后缀模块声明（bun / esbuild 双链内建支持——ADR-0091 模板 ?raw 化）：文本文件
 * 以字符串默认导出形式导入。仅类型面声明，不参与 tsup dts 打包（ambient 模块，入口不可达）。
 */
declare module "*?raw" {
    const content: string;
    export default content;
}
