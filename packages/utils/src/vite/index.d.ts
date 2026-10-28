/**
 * @autospark/utils/vite 公开类型面（utils ADR-0002；原 @autospark/plugins/vite
 * 的 public.d.ts 迁入改名，plugins ADR-0004 决策 3 修订）：插件闭包构建插件。
 *
 * 词汇锚点：产物外壳契约 = 「插件闭包」（根 CONTEXT.md 插件域）；工具仅此一个
 * 公开符号，入口/输出文件名由使用方的 vite 构建配置决定（见 plugins 包
 * vite.config.ts 编排先例：一产物一次 vite build）。source-entry 阶段本文件是
 * 未来 dist 化时的收窄面规格（utils ADR-0002 类型面纪律），exports map 暂不接线。
 */
import type { Plugin } from "vite";

/**
 * 插件闭包构建插件工厂：注入 `vite build` 的 plugins 即得单产物闭包打包。
 *
 * 职责（plugins ADR-0004）：
 * 1. 剥除源码对 `"autospark"` 的值导入——`AutoSpark` 本名经闭包参数落定，其他具名
 *    合并为 `const { x } = AutoSpark` 解构，namespace/default 映射命名空间本体；
 * 2. 剥除产物 exports 面（闭包无 exports，残留非 `export {...}` 形态即构建报错）；
 * 3. 按定谳模板包裹闭包外壳——`AutoSpark === undefined` 时插件体入
 *    `__AUTOSPARK_PLUGINS__` 预加载队列（双路径自举的产物级载体，engine ADR-0114），
 *    并保持 sourcemap 行映射有效。
 */
export declare function buildAutoSparkPlugin(options?: { shell?: "queued" | "immediate" }): Plugin;
