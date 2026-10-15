/**
 * 插件预加载队列的全局声明（ADR-0114）。
 *
 * 插件脚本先于 `autospark.js` 加载时闭包内拿不到 `AutoSpark`，改为把插件脚本体包成
 * 函数推进本数组；engine 构造期 drain 并执行一次，回调收 `(engine, autospark)` 双参。
 *
 * ```js
 * // my-plugin.js（可出现在 autospark.js 之前）
 * (globalThis.__AUTOSPARK_PLUGINS__ ??= []).push((engine, $) => {
 *     $.components["hello-card"] = "<div x-text='title'></div>";
 *     $.ready((e) => { e.actions.localOnly = () => {}; });
 * });
 * ```
 *
 * 仅类型面声明（ambient，不参与 tsup dts 打包——IIFE 脚本作者按文档手写签名）。
 */
declare var __AUTOSPARK_PLUGINS__: import("../features/plugin").PluginBootstrap[] | undefined;
