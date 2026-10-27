/**
 * theme 插件自举（theme ADR-0007）：@autospark/theme 以 AutoSpark 插件形态接入
 * 引擎家族——家族首个**库型插件**（包体对引擎零运行时引用 + 引入即生效副作用，
 * plugins ADR-0006 决策 2 immediate 外壳的适用实例）。
 *
 * **模块加载期唯一自举面**（决策 4，自 manager.ts 迁入）：
 *
 * 1. 创建默认管理器单例（纯库消费与文档 demo 的「引入即生效」语义载体）；
 * 2. 挂 `globalThis.AutoSparkThemeManager`（单例实例全局，与 `AutoSparkTheme`
 *    模块命名空间二元并存的另一半，纯库消费契约不动）；
 * 3. `installPlugin(register)` 双路径自举（utils ADR-0001，单回调签名）：
 *    引擎已加载 → 直取注册；未加载 → register 回调入预加载队列（ADR-0114），
 *    首个 engine 构造 drain 时回放。
 *
 * **ready 回调**（每 engine 各一次，retain 语义——晚加载对存活 engine 补挂载）：
 *
 * - `engine.themeManager = 单例`：纯引用注入（决策 1）——不构造、无 options 通道；
 *   多 engine 共享同一实例（root scope 物理绑定 documentElement 的必然）；
 * - `state.$.theme` 七键投影 + `watch("$.theme.*")` 回写 manager（决策 5，Q10 修订：
 *   **单向同步**——state 是可写的投影视图，写入即驱动主题切换；manager 直改
 *   **不回写**投影，投影初值以 ready 期 manager 当前值播种）；
 * - `engine/destroy/before` 摘线：manager 本体不清理（单例跨 engine 存活），但
 *   watch 订阅必须摘除——多 engine 场景死订阅向已销毁 store 回写必炸（决策 5）。
 */
import { AutoSparkThemeManager } from "./manager";
import type { ThemeSize } from "./types";
/** 默认主题管理器单例（模块加载期创建，引入即尽可能早——ADR-0007 决策 1） */
export declare const themeManager: AutoSparkThemeManager;
declare global {
    var AutoSparkThemeManager: typeof themeManager;
}
/** `state.$.theme` 七键投影的形态（与 manager 七维度一一对应） */
export type ThemeProjectionState = {
    dark: boolean;
    themeColor: string;
    size: ThemeSize;
    spacing: ThemeSize;
    shadow: ThemeSize;
    radius: ThemeSize;
    colorized: boolean;
};
declare module "autospark" {
    interface AutoSpark<State extends Record<string, any> = Record<string, any>> {
        /**
         * 主题管理器（theme ADR-0007 决策 1）：插件 ready 自举注入的
         * AutoSparkThemeManager 单例引用。多 engine 共享同一实例；
         * engine destroy 不清理（指针接入而非生命周期所有权）。
         * 未装插件时无此属性（访问即"该装插件了"的引导）。
         */
        themeManager: AutoSparkThemeManager;
    }
    interface AutoSparkMeta {
        /**
         * 主题七键投影（theme ADR-0007 决策 5）：ready 期播种、`$.theme.*`
         * 变化单向同步至 themeManager 同维度。manager 直改不回写本投影。
         */
        theme: ThemeProjectionState;
    }
}
