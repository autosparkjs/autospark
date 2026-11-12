/**
 * @autospark/plugins i18n 插件入口（ADR-0136）：多语言能力外移落点。
 *
 * 模块加载即自举（`bootstrapI18nPlugin()`，双路径单点收敛 `installPlugin`）：
 * installPlugin 回调体注册 `autospark/locales` scriptType 与 x-locales 指令（先于
 * 首编译）；`$.ready` 覆写 `engine.translate` 翻译实现槽 + `$.language` 兜底 ensure。
 * engine 核心保留兜底 t（恒等 + 插值）——未装本插件时模板 `t(...)` 平滑降级不报错。
 *
 * IIFE 产物 `autospark.i18n.js`（闭包形态，无全局名，ADR-0003/0004）；TS 模块具名
 * 导出服务测试与聚合入口。类型面扩展见 ./augment.ts（副作用导入）。
 *
 * **加载顺序契约**：autospark.i18n.js 须早于 `new AutoSpark()`（选择性引入，ADR-0128）。
 */
import "./augment";

// 公开面：配置类型（augment 消费）+ 翻译核心（测试/高级用法直调）+ 自举入口
export type { I18nOptions, I18nLanguageItem } from "./types";
export { translate, collectScopeDict, collectEngineDict, ensureLanguage } from "./translate";
export { LOCALES_SCRIPT_TYPE, localesScriptHandler } from "./script";
export { createLocalesDirective } from "./directive";
export { bootstrapI18nPlugin } from "./bootstrap";

// 模块加载即自举（沿 notifications 先例：置于入口尾部）
import { bootstrapI18nPlugin } from "./bootstrap";
bootstrapI18nPlugin();
