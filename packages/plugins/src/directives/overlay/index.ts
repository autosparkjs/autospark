/**
 * autospark.overlay.js 聚合入口（#5 批次 4）：覆盖物域四指令一产物（ADR-0009 同类域
 * 组合）。family 为家族核心（ComponentDirective 注入的类链闭包 + 内置 shell 注册），
 * foldable 独立工厂（运行时协作依赖 popover——同产物自包含）。
 */
import "./family";
import "./foldable";
